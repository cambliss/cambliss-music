const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/users", async (req, res) => {
  const { page = 1, pageSize = 25, role } = req.query;
  const take = Math.min(parseInt(pageSize, 10) || 25, 100);
  const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

  const where = role ? { role } : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total, page: Number(page), pageSize: take });
});

router.patch("/users/:id/role", async (req, res) => {
  const { role } = req.body;
  if (!["ARTIST", "LISTENER", "ADMIN"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
  res.json({ user: { id: user.id, role: user.role } });
});

router.patch("/users/:id/status", async (req, res) => {
  const { isActive } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: !!isActive },
  });
  res.json({ user: { id: user.id, isActive: user.isActive } });
});

router.get("/stats", async (_req, res) => {
  const [users, artists, tracks, albums] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ARTIST" } }),
    prisma.track.count(),
    prisma.album.count(),
  ]);
  res.json({ users, artists, tracks, albums });
});

module.exports = router;
