const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function parseProvider(providerRaw) {
  const provider = String(providerRaw || "").toUpperCase();
  if (!["TWITTER", "DISCORD", "TWITCH"].includes(provider)) return null;
  return provider;
}

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

router.post("/register", asyncRoute(async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "email, password and name are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  const allowedRoles = ["ARTIST", "LISTENER"]; // admins are promoted, not self-registered
  const finalRole = allowedRoles.includes(role) ? role : "LISTENER";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: finalRole,
      ...(finalRole === "ARTIST" ? { artistProfile: { create: {} } } : {}),
    },
  });

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
}));

router.post("/login", asyncRoute(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (!user.passwordHash) {
    return res.status(400).json({ error: "This account uses OAuth. Please sign in with provider." });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
}));

router.post("/oauth/:provider", asyncRoute(async (req, res) => {
  const provider = parseProvider(req.params.provider);
  if (!provider) {
    return res.status(400).json({ error: "Unsupported OAuth provider" });
  }

  const { providerAccountId, email, name } = req.body;
  if (!providerAccountId || !email || !name) {
    return res.status(400).json({ error: "providerAccountId, email and name are required" });
  }

  const existingCredential = await prisma.oAuthCredential.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    include: { user: true },
  });

  let user;
  if (existingCredential?.user) {
    user = existingCredential.user;
  } else {
    user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name, role: "LISTENER" },
    });

    await prisma.oAuthCredential.upsert({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      update: { userId: user.id },
      create: { userId: user.id, provider, providerAccountId },
    });
  }

  await prisma.connectedAccount.upsert({
    where: { userId_provider: { userId: user.id, provider } },
    update: {},
    create: {
      userId: user.id,
      provider,
      username: providerAccountId,
      profileUrl: null,
    },
  });

  const token = signToken(user);
  res.json({ token, user: publicUser(user), provider });
}));

router.get("/me", requireAuth, asyncRoute(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { artistProfile: true, connectedAccounts: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
}));

router.get("/me/connections", requireAuth, asyncRoute(async (req, res) => {
  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: req.user.id },
    orderBy: { connectedAt: "desc" },
  });
  res.json({ accounts });
}));

router.post("/me/connections", requireAuth, asyncRoute(async (req, res) => {
  const provider = parseProvider(req.body.provider);
  if (!provider) {
    return res.status(400).json({ error: "Unsupported provider" });
  }

  const { username, profileUrl } = req.body;
  const account = await prisma.connectedAccount.upsert({
    where: { userId_provider: { userId: req.user.id, provider } },
    update: { username: username || null, profileUrl: profileUrl || null },
    create: {
      userId: req.user.id,
      provider,
      username: username || null,
      profileUrl: profileUrl || null,
    },
  });

  res.status(201).json({ account });
}));

router.delete("/me/connections/:provider", requireAuth, asyncRoute(async (req, res) => {
  const provider = parseProvider(req.params.provider);
  if (!provider) {
    return res.status(400).json({ error: "Unsupported provider" });
  }

  await prisma.connectedAccount
    .delete({ where: { userId_provider: { userId: req.user.id, provider } } })
    .catch(() => null);

  res.status(204).end();
}));

module.exports = router;
