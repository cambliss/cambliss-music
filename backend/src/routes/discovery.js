const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/feed", requireAuth, async (req, res) => {
  const following = await prisma.follow.findMany({
    where: { followerId: req.user.id },
    select: { artistId: true },
  });
  const artistIds = following.map((f) => f.artistId);

  const [recentTracks, likes, reposts, history] = await Promise.all([
    prisma.track.findMany({
      where: { isPublic: true, artistId: { in: artistIds } },
      include: { artist: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.like.findMany({
      where: { userId: req.user.id },
      include: { track: { include: { artist: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.repost.findMany({
      where: { userId: req.user.id },
      include: { track: { include: { artist: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.listeningEvent.findMany({
      where: { userId: req.user.id },
      include: { track: { include: { artist: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  res.json({
    feed: {
      recentTracks,
      likes: likes.map((x) => x.track),
      reposts: reposts.map((x) => x.track),
      history,
    },
  });
});

module.exports = router;
