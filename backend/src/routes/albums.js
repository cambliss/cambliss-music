const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { imageUpload } = require("../utils/upload");
const { filterPlayableTracks } = require("../utils/media");

const router = express.Router();

router.get("/", async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const take = Math.min(parseInt(pageSize, 10) || 20, 50);
  const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

  const [albums, total] = await Promise.all([
    prisma.album.findMany({
      include: { artist: { select: { id: true, name: true } }, _count: { select: { tracks: true } } },
      orderBy: { releaseDate: "desc" },
      skip,
      take,
    }),
    prisma.album.count(),
  ]);

  res.json({ albums, total, page: Number(page), pageSize: take });
});

router.get("/:id", async (req, res) => {
  const album = await prisma.album.findUnique({
    where: { id: req.params.id },
    include: {
      artist: { select: { id: true, name: true } },
      tracks: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!album) return res.status(404).json({ error: "Album not found" });
  res.json({ album: { ...album, tracks: filterPlayableTracks(album.tracks) } });
});

router.post("/", requireAuth, requireRole("ARTIST"), imageUpload.single("cover"), async (req, res) => {
  const { title, description, releaseDate } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });

  const album = await prisma.album.create({
    data: {
      title,
      description: description || null,
      artistId: req.user.id,
      releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
      coverArtUrl: req.file ? `/uploads/images/${req.file.filename}` : null,
    },
  });

  res.status(201).json({ album });
});

router.put("/:id", requireAuth, async (req, res) => {
  const album = await prisma.album.findUnique({ where: { id: req.params.id } });
  if (!album) return res.status(404).json({ error: "Album not found" });
  if (album.artistId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "You do not own this album" });
  }
  const { title, description, releaseDate } = req.body;
  const updated = await prisma.album.update({
    where: { id: req.params.id },
    data: {
      ...(title ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(releaseDate ? { releaseDate: new Date(releaseDate) } : {}),
    },
  });
  res.json({ album: updated });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const album = await prisma.album.findUnique({ where: { id: req.params.id } });
  if (!album) return res.status(404).json({ error: "Album not found" });
  if (album.artistId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "You do not own this album" });
  }
  await prisma.album.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

module.exports = router;
