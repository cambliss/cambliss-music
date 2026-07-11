const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ artists: [], tracks: [], albums: [], releases: [], playlists: [] });

  const [artists, tracks, albums, releases, playlists] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ARTIST", name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, artistProfile: { select: { profileImageUrl: true } } },
      take: 10,
    }),
    prisma.track.findMany({
      where: {
        isPublic: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { genre: { contains: q, mode: "insensitive" } },
          { tags: { has: q } },
        ],
      },
      include: { artist: { select: { id: true, name: true } } },
      take: 10,
    }),
    prisma.album.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      include: { artist: { select: { id: true, name: true } } },
      take: 10,
    }),
    prisma.release.findMany({
      where: { isPublic: true, title: { contains: q, mode: "insensitive" } },
      include: { artist: { select: { id: true, name: true } } },
      take: 10,
    }),
    prisma.playlist.findMany({
      where: { isPublic: true, title: { contains: q, mode: "insensitive" } },
      include: { owner: { select: { id: true, name: true } }, _count: { select: { tracks: true } } },
      take: 10,
    }),
  ]);

  res.json({ artists, tracks, albums, releases, playlists });
});

module.exports = router;
