const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v2: cloudinary } = require("cloudinary");

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");
const CLOUDINARY_ENABLED = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (CLOUDINARY_ENABLED) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

for (const sub of ["tracks", "images"]) {
  const dir = path.join(UPLOAD_ROOT, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function uniqueFilename(file) {
  const ext = path.extname(file.originalname);
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
}

function saveBufferLocally(file, subdir) {
  const filename = uniqueFilename(file);
  const targetPath = path.join(UPLOAD_ROOT, subdir, filename);
  fs.writeFileSync(targetPath, file.buffer);
  return `/uploads/${subdir}/${filename}`;
}

function uploadBufferToCloudinary(file, options) {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result.secure_url);
    });
    upload.end(file.buffer);
  });
}

async function saveTrackUpload(file) {
  if (!file) return null;
  if (!CLOUDINARY_ENABLED) return saveBufferLocally(file, "tracks");

  return uploadBufferToCloudinary(file, {
    folder: "cambliss/tracks",
    resource_type: "video",
    use_filename: true,
    unique_filename: true,
  });
}

async function saveImageUpload(file) {
  if (!file) return null;
  if (!CLOUDINARY_ENABLED) return saveBufferLocally(file, "images");

  return uploadBufferToCloudinary(file, {
    folder: "cambliss/images",
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
  });
}

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".mp3", ".wav", ".flac", ".m4a", ".ogg", ".mp4"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error("Unsupported audio format"));
    cb(null, true);
  },
});

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error("Unsupported image format"));
    cb(null, true);
  },
});

module.exports = {
  audioUpload,
  imageUpload,
  saveTrackUpload,
  saveImageUpload,
  UPLOAD_ROOT,
};
