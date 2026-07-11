const express = require("express");
const fs = require("fs");
const path = require("path");
const prisma = require("../prisma");
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth");
const { audioUpload, UPLOAD_ROOT } = require("../utils/upload");
const { filterPlayableTracks, isTrackPlayable } = require("../utils/media");

const router = express.Router();

function contentTypeFor(fileUrl) {
  const ext = path.extname(String(fileUrl || "")).toLowerCase();
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".flac") return "audio/flac";
  if (ext === ".m4a" || ext === ".mp4") return "audio/mp4";
  if (ext === ".ogg") return "audio/ogg";
  return "application/octet-stream";
}

// List / browse tracks
router.get("/", async (req, res) => {
  const { page = 1, pageSize = 20, genre, tag } = req.query;
  const take = Math.min(parseInt(pageSize, 10) || 20, 50);
  const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

  const where = {
    isPublic: true,
    ...(genre ? { genre } : {}),
    ...(tag ? { tags: { has: String(tag) } } : {}),
  };

  const [tracks, total] = await Promise.all([
    prisma.track.findMany({
      where,
      include: {
        artist: { select: { id: true, name: true } },
        album: { select: { id: true, title: true, coverArtUrl: true } },
        _count: { select: { likes: true, comments: true, reposts: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.track.count({ where }),
  ]);

  const playableTracks = filterPlayableTracks(tracks);
  res.json({ tracks: playableTracks, total: playableTracks.length, page: Number(page), pageSize: take });
});

// Upload a new track (artist only)
router.post(
  "/",
  requireAuth,
  requireRole("ARTIST"),
  audioUpload.single("audio"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No audio file provided" });
    const { title, genre, albumId, releaseId, isPublic, isDownloadable, license, tags } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });

    if (albumId) {
      const album = await prisma.album.findFirst({ where: { id: albumId, artistId: req.user.id } });
      if (!album) return res.status(400).json({ error: "Album not found or not owned by you" });
    }

    if (releaseId) {
      const release = await prisma.release.findFirst({
        where: { id: releaseId, artistId: req.user.id },
      });
      if (!release) return res.status(400).json({ error: "Release not found or not owned by you" });
    }

    const parsedTags =
      typeof tags === "string"
        ? tags
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : [];

    const allowedLicenses = [
      "ALL_RIGHTS_RESERVED",
      "CC_BY",
      "CC_BY_SA",
      "CC_BY_NC",
      "CC_BY_NC_SA",
    ];
    const normalizedLicense = allowedLicenses.includes(license) ? license : "ALL_RIGHTS_RESERVED";

    const track = await prisma.track.create({
      data: {
        title,
        genre: genre || null,
        artistId: req.user.id,
        albumId: albumId || null,
        releaseId: releaseId || null,
        tags: parsedTags,
        fileUrl: `/uploads/tracks/${req.file.filename}`,
        masterFileUrl: `/uploads/tracks/${req.file.filename}`,
        isDownloadable: isDownloadable === "true" || isDownloadable === true,
        license: normalizedLicense,
        isPublic: isPublic === undefined ? true : isPublic === "true" || isPublic === true,
      },
    });

    await prisma.trackMaster.create({
      data: {
        trackId: track.id,
        preset: "balanced",
        details: { engine: "default" },
      },
    });

    res.status(201).json({ track });
  }
);

router.get("/:id", async (req, res) => {
  const track = await prisma.track.findUnique({
    where: { id: req.params.id },
    include: {
      artist: { select: { id: true, name: true } },
      album: true,
      release: true,
      trackPeaks: true,
      trackMasters: { orderBy: { createdAt: "desc" } },
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: { select: { likes: true, reposts: true } },
    },
  });
  if (!track) return res.status(404).json({ error: "Track not found" });
  if (!isTrackPlayable(track)) return res.status(404).json({ error: "Audio file missing on server" });
  res.json({ track });
});

router.get("/:id/download", async (req, res) => {
  const track = await prisma.track.findUnique({ where: { id: req.params.id } });
  if (!track) return res.status(404).json({ error: "Track not found" });
  if (!track.isPublic || !track.isDownloadable) {
    return res.status(403).json({ error: "Track is not downloadable" });
  }

  const filePath = path.join(UPLOAD_ROOT, "tracks", path.basename(track.fileUrl));
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Audio file missing on server" });
  }

  const ext = path.extname(track.fileUrl || ".mp3") || ".mp3";
  res.download(filePath, `${track.title}${ext}`);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const track = await prisma.track.findUnique({ where: { id: req.params.id } });
  if (!track) return res.status(404).json({ error: "Track not found" });
  if (track.artistId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "You do not own this track" });
  }
  await prisma.track.delete({ where: { id: req.params.id } });
  const filePath = path.join(UPLOAD_ROOT, "tracks", path.basename(track.fileUrl));
  fs.unlink(filePath, () => {});
  res.status(204).end();
});

// Stream audio with HTTP range support (seeking) and play-count increment
router.get("/:id/stream", optionalAuth, async (req, res) => {
  const track = await prisma.track.findUnique({ where: { id: req.params.id } });
  if (!track) return res.status(404).json({ error: "Track not found" });

  const filePath = path.join(UPLOAD_ROOT, "tracks", path.basename(track.fileUrl));
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Audio file missing on server" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const contentType = contentTypeFor(track.fileUrl);

  prisma.track
    .update({ where: { id: track.id }, data: { playCount: { increment: 1 } } })
    .catch(() => {});

  prisma.listeningEvent
    .create({
      data: {
        trackId: track.id,
        userId: req.user?.id || null,
        source: req.query.source ? String(req.query.source) : null,
      },
    })
    .catch(() => {});

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": contentType,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

router.post("/:id/listen", requireAuth, async (req, res) => {
  const track = await prisma.track.findUnique({ where: { id: req.params.id } });
  if (!track) return res.status(404).json({ error: "Track not found" });

  const event = await prisma.listeningEvent.create({
    data: {
      trackId: track.id,
      userId: req.user.id,
      progressSec: Number(req.body.progressSec) || null,
      source: req.body.source || "player",
    },
  });

  res.status(201).json({ event });
});

router.get("/:id/analytics", requireAuth, async (req, res) => {
  const track = await prisma.track.findUnique({ where: { id: req.params.id } });
  if (!track) return res.status(404).json({ error: "Track not found" });
  if (track.artistId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "You do not own this track" });
  }

  const [plays, likes, reposts, comments] = await Promise.all([
    prisma.listeningEvent.count({ where: { trackId: track.id } }),
    prisma.like.count({ where: { trackId: track.id } }),
    prisma.repost.count({ where: { trackId: track.id } }),
    prisma.comment.count({ where: { trackId: track.id } }),
  ]);

  res.json({ analytics: { plays, likes, reposts, comments } });
});

router.post("/:id/like", requireAuth, async (req, res) => {
  const track = await prisma.track.findUnique({ where: { id: req.params.id } });
  if (!track || !track.isPublic) return res.status(404).json({ error: "Track not found" });

  await prisma.like.upsert({
    where: { userId_trackId: { userId: req.user.id, trackId: track.id } },
    update: {},
    create: { userId: req.user.id, trackId: track.id },
  });
  res.status(201).json({ liked: true });
});

router.delete("/:id/like", requireAuth, async (req, res) => {
  await prisma.like
    .delete({ where: { userId_trackId: { userId: req.user.id, trackId: req.params.id } } })
    .catch(() => null);
  res.json({ liked: false });
});

router.post("/:id/repost", requireAuth, async (req, res) => {
  const track = await prisma.track.findUnique({ where: { id: req.params.id } });
  if (!track || !track.isPublic) return res.status(404).json({ error: "Track not found" });

  await prisma.repost.upsert({
    where: { userId_trackId: { userId: req.user.id, trackId: track.id } },
    update: {},
    create: { userId: req.user.id, trackId: track.id },
  });
  res.status(201).json({ reposted: true });
});

router.delete("/:id/repost", requireAuth, async (req, res) => {
  await prisma.repost
    .delete({ where: { userId_trackId: { userId: req.user.id, trackId: req.params.id } } })
    .catch(() => null);
  res.json({ reposted: false });
});

router.post("/:id/comments", requireAuth, async (req, res) => {
  const track = await prisma.track.findUnique({ where: { id: req.params.id } });
  if (!track || !track.isPublic) return res.status(404).json({ error: "Track not found" });
  if (!req.body.content?.trim()) {
    return res.status(400).json({ error: "content is required" });
  }

  const comment = await prisma.comment.create({
    data: {
      trackId: track.id,
      userId: req.user.id,
      content: String(req.body.content).trim(),
    },
    include: { user: { select: { id: true, name: true } } },
  });

  res.status(201).json({ comment });
});

module.exports = router;
