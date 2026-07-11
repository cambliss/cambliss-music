const express = require("express");
const prisma = require("../prisma");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { imageUpload } = require("../utils/upload");
const { filterPlayableTracks } = require("../utils/media");

const router = express.Router();

// List artists (paginated)
router.get("/", async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const take = Math.min(parseInt(pageSize, 10) || 20, 50);
  const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

  const [artists, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ARTIST", isActive: true },
      include: {
        artistProfile: true,
        userLinks: { orderBy: { sortOrder: "asc" } },
        _count: { select: { followers: true, tracks: true } },
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { role: "ARTIST", isActive: true } }),
  ]);

  res.json({
    artists: artists.map(({ passwordHash, ...a }) => a),
    total,
    page: Number(page),
    pageSize: take,
  });
});

// Get one artist's full public profile
router.get("/:id", optionalAuth, async (req, res) => {
  const artist = await prisma.user.findFirst({
    where: { id: req.params.id, role: "ARTIST" },
    include: {
      artistProfile: true,
      userLinks: { orderBy: { sortOrder: "asc" } },
      photos: { orderBy: { createdAt: "desc" }, take: 12 },
      pressKits: { orderBy: { updatedAt: "desc" }, take: 1 },
      albums: { orderBy: { releaseDate: "desc" }, include: { tracks: true } },
      tracks: { where: { albumId: null, isPublic: true }, orderBy: { createdAt: "desc" } },
      _count: { select: { followers: true } },
    },
  });
  if (!artist) return res.status(404).json({ error: "Artist not found" });

  let isFollowing = false;
  if (req.user) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_artistId: { followerId: req.user.id, artistId: artist.id } },
    });
    isFollowing = !!follow;
  }

  const { passwordHash, ...publicArtist } = artist;
  const sanitizedArtist = {
    ...publicArtist,
    tracks: filterPlayableTracks(publicArtist.tracks),
    albums: publicArtist.albums.map((album) => ({
      ...album,
      tracks: filterPlayableTracks(album.tracks),
    })),
  };
  res.json({ artist: sanitizedArtist, isFollowing });
});

// Update own artist profile
router.put("/me/profile", requireAuth, async (req, res) => {
  if (req.user.role !== "ARTIST") {
    return res.status(403).json({ error: "Only artists have a profile to edit" });
  }
  const { bio, links, events, articles, merchandise, name } = req.body;

  const profile = await prisma.artistProfile.upsert({
    where: { userId: req.user.id },
    update: { bio, links, events, articles, merchandise },
    create: { userId: req.user.id, bio, links, events, articles, merchandise },
  });

  if (name) {
    await prisma.user.update({ where: { id: req.user.id }, data: { name } });
  }

  res.json({ profile });
});

router.put("/me/links", requireAuth, async (req, res) => {
  if (req.user.role !== "ARTIST") {
    return res.status(403).json({ error: "Only artists can update profile links" });
  }

  const links = Array.isArray(req.body.links) ? req.body.links : [];
  await prisma.$transaction([
    prisma.userLink.deleteMany({ where: { userId: req.user.id } }),
    prisma.userLink.createMany({
      data: links
        .filter((x) => x?.label && x?.url)
        .map((x, i) => ({
          userId: req.user.id,
          label: String(x.label),
          url: String(x.url),
          sortOrder: Number.isFinite(x.sortOrder) ? x.sortOrder : i,
        })),
    }),
  ]);

  const userLinks = await prisma.userLink.findMany({
    where: { userId: req.user.id },
    orderBy: { sortOrder: "asc" },
  });

  res.json({ links: userLinks });
});

router.put("/me/press-kit", requireAuth, async (req, res) => {
  if (req.user.role !== "ARTIST") {
    return res.status(403).json({ error: "Only artists can update press kits" });
  }

  const { headline, shortBio, longBio, bookingEmail, assets } = req.body;
  const pressKit = await prisma.pressKit.upsert({
    where: { artistId: req.user.id },
    update: { headline, shortBio, longBio, bookingEmail, assets },
    create: { artistId: req.user.id, headline, shortBio, longBio, bookingEmail, assets },
  });

  await prisma.artistProfile.upsert({
    where: { userId: req.user.id },
    update: { pressKitId: pressKit.id },
    create: { userId: req.user.id, pressKitId: pressKit.id },
  });

  res.json({ pressKit });
});

router.post(
  "/me/photos",
  requireAuth,
  imageUpload.single("image"),
  async (req, res) => {
    if (req.user.role !== "ARTIST") {
      return res.status(403).json({ error: "Only artists can upload gallery photos" });
    }
    if (!req.file) return res.status(400).json({ error: "No image file provided" });

    const photo = await prisma.photo.create({
      data: {
        artistId: req.user.id,
        imageUrl: `/uploads/images/${req.file.filename}`,
        caption: req.body.caption || null,
      },
    });

    res.status(201).json({ photo });
  }
);

// Upload profile / cover image
router.post(
  "/me/image",
  requireAuth,
  imageUpload.single("image"),
  async (req, res) => {
    if (req.user.role !== "ARTIST") {
      return res.status(403).json({ error: "Only artists can upload profile images" });
    }
    const { kind } = req.body; // "profile" | "cover"
    if (!req.file) return res.status(400).json({ error: "No image file provided" });

    const url = `/uploads/images/${req.file.filename}`;
    const field = kind === "cover" ? "coverImageUrl" : "profileImageUrl";

    const profile = await prisma.artistProfile.upsert({
      where: { userId: req.user.id },
      update: { [field]: url },
      create: { userId: req.user.id, [field]: url },
    });

    res.json({ profile });
  }
);

// Follow / unfollow
router.post("/:id/follow", requireAuth, async (req, res) => {
  const artistId = req.params.id;
  if (artistId === req.user.id) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }
  const artist = await prisma.user.findFirst({ where: { id: artistId, role: "ARTIST" } });
  if (!artist) return res.status(404).json({ error: "Artist not found" });

  await prisma.follow.upsert({
    where: { followerId_artistId: { followerId: req.user.id, artistId } },
    update: {},
    create: { followerId: req.user.id, artistId },
  });
  res.status(201).json({ following: true });
});

router.delete("/:id/follow", requireAuth, async (req, res) => {
  await prisma.follow
    .delete({
      where: { followerId_artistId: { followerId: req.user.id, artistId: req.params.id } },
    })
    .catch(() => null);
  res.json({ following: false });
});

module.exports = router;
