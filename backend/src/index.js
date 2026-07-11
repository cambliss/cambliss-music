require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/auth");
const artistRoutes = require("./routes/artists");
const trackRoutes = require("./routes/tracks");
const albumRoutes = require("./routes/albums");
const releaseRoutes = require("./routes/releases");
const playlistRoutes = require("./routes/playlists");
const searchRoutes = require("./routes/search");
const discoveryRoutes = require("./routes/discovery");
const adminRoutes = require("./routes/admin");

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients and same-origin server calls.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Unsupported CORS origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.json());

// Static file serving for uploaded audio/images
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (_req, res) => {
  res.json({
    service: "Cambliss API",
    status: "ok",
    health: "/api/health",
  });
});

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api", (_req, res) => {
  res.json({
    service: "Cambliss API",
    status: "ok",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/tracks", trackRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/releases", releaseRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Central error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  const message = String(err?.message || "");

  if (err.message && err.message.includes("Unsupported")) {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === "P1000") {
    return res.status(503).json({ error: "Database authentication failed. Check DATABASE_URL credentials." });
  }
  if (err.code === "P1001") {
    return res.status(503).json({ error: "Database server is unreachable. Check host/port and that Postgres is running." });
  }
  if (err.code === "P2021") {
    return res.status(503).json({
      error: "Database schema is not initialized. Run Prisma db push or migrations on the deployment database.",
    });
  }
  if (
    err?.name === "PrismaClientInitializationError" &&
    message.includes("Authentication failed against database server")
  ) {
    return res.status(503).json({ error: "Database authentication failed. Check DATABASE_URL credentials." });
  }
  res.status(500).json({ error: "Something went wrong on our end" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Cambliss API listening on http://localhost:${PORT}`);
});
