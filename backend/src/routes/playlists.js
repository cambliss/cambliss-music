const express = require("express");
const prisma = require("../prisma");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", optionalAuth, async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const take = Math.min(parseInt(pageSize, 10) || 20, 50);
  const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

  const where = req.user
    ? { OR: [{ isPublic: true }, { ownerId: req.user.id }] }
    : { isPublic: true };

  const [playlists, total] = await Promise.all([
    prisma.playlist.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { tracks: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
    prisma.playlist.count({ where }),
  ]);

  res.json({ playlists, total, page: Number(page), pageSize: take });
});

router.post("/", requireAuth, async (req, res) => {
  const { title, description, isPublic } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "title is required" });

  const playlist = await prisma.playlist.create({
    data: {
      ownerId: req.user.id,
      title: title.trim(),
      description: description || null,
      isPublic: isPublic === undefined ? true : isPublic === true,
    },
  });

  res.status(201).json({ playlist });
});

router.get("/:id", optionalAuth, async (req, res) => {
  const playlist = await prisma.playlist.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, name: true } },
      tracks: {
        include: {
          track: {
            include: { artist: { select: { id: true, name: true } }, album: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!playlist) return res.status(404).json({ error: "Playlist not found" });
  if (!playlist.isPublic && playlist.ownerId !== req.user?.id) {
    return res.status(403).json({ error: "Playlist is private" });
  }

  res.json({ playlist });
});

router.post("/:id/tracks", requireAuth, async (req, res) => {
  const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });
  if (playlist.ownerId !== req.user.id) {
    return res.status(403).json({ error: "You do not own this playlist" });
  }

  const { trackId } = req.body;
  const track = await prisma.track.findUnique({ where: { id: trackId } });
  if (!track || !track.isPublic) return res.status(404).json({ error: "Track not found" });

  const maxItem = await prisma.trackPlaylist.findFirst({
    where: { playlistId: playlist.id },
    orderBy: { sortOrder: "desc" },
  });

  const item = await prisma.trackPlaylist.upsert({
    where: { playlistId_trackId: { playlistId: playlist.id, trackId } },
    update: {},
    create: {
      playlistId: playlist.id,
      trackId,
      sortOrder: maxItem ? maxItem.sortOrder + 1 : 0,
    },
  });

  res.status(201).json({ item });
});

router.delete("/:id/tracks/:trackId", requireAuth, async (req, res) => {
  const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });
  if (playlist.ownerId !== req.user.id) {
    return res.status(403).json({ error: "You do not own this playlist" });
  }

  await prisma.trackPlaylist
    .delete({
      where: {
        playlistId_trackId: {
          playlistId: req.params.id,
          trackId: req.params.trackId,
        },
      },
    })
    .catch(() => null);

  res.status(204).end();
});

module.exports = router;
