const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth");
const { imageUpload } = require("../utils/upload");

const router = express.Router();

router.get("/", optionalAuth, async (req, res) => {
  const { page = 1, pageSize = 20, type } = req.query;
  const take = Math.min(parseInt(pageSize, 10) || 20, 50);
  const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

  const where = {
    ...(type ? { type } : {}),
    ...(req.user?.role === "ADMIN" ? {} : { isPublic: true }),
  };

  const [releases, total] = await Promise.all([
    prisma.release.findMany({
      where,
      include: {
        artist: { select: { id: true, name: true } },
        _count: { select: { tracks: true, sections: true } },
      },
      orderBy: { releaseDate: "desc" },
      skip,
      take,
    }),
    prisma.release.count({ where }),
  ]);

  res.json({ releases, total, page: Number(page), pageSize: take });
});

router.post("/", requireAuth, requireRole("ARTIST"), imageUpload.single("cover"), async (req, res) => {
  const { title, description, type, isPublic, releaseDate, layout } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "title is required" });

  const allowedTypes = ["ALBUM", "SINGLE", "EP"];
  const release = await prisma.release.create({
    data: {
      artistId: req.user.id,
      title: title.trim(),
      description: description || null,
      type: allowedTypes.includes(type) ? type : "ALBUM",
      isPublic: isPublic === undefined ? true : isPublic === "true" || isPublic === true,
      releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
      coverArtUrl: req.file ? `/uploads/images/${req.file.filename}` : null,
      layout: layout || null,
    },
  });

  res.status(201).json({ release });
});

router.get("/:id", optionalAuth, async (req, res) => {
  const release = await prisma.release.findUnique({
    where: { id: req.params.id },
    include: {
      artist: { select: { id: true, name: true } },
      tracks: { include: { artist: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      sections: { include: { image: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!release) return res.status(404).json({ error: "Release not found" });
  if (!release.isPublic && release.artistId !== req.user?.id && req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Release is private" });
  }

  res.json({ release });
});

router.post("/:id/sections", requireAuth, requireRole("ARTIST"), async (req, res) => {
  const release = await prisma.release.findUnique({ where: { id: req.params.id } });
  if (!release) return res.status(404).json({ error: "Release not found" });
  if (release.artistId !== req.user.id) {
    return res.status(403).json({ error: "You do not own this release" });
  }

  const { title, kind, layout, sortOrder } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "title is required" });

  const section = await prisma.releaseSection.create({
    data: {
      releaseId: release.id,
      title: title.trim(),
      kind: kind || null,
      layout: layout || null,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  });

  res.status(201).json({ section });
});

module.exports = router;
