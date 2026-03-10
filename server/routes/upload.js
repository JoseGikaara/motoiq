import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { requireAuth } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "cars");

try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  // ignore
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext.toLowerCase()}`;
    cb(null, safe);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype);
    cb(null, !!ok);
  },
});

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)?.toLowerCase() || ".mp4";
    const safe = `video-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, safe);
  },
});
const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^video\/(mp4|webm)$/i.test(file.mimetype);
    cb(null, !!ok);
  },
});

export const uploadRouter = Router();
uploadRouter.use(requireAuth);

/** POST /api/upload/car-image — single image file; returns { url } */
uploadRouter.post("/car-image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file" });
    const baseUrl = process.env.API_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}/uploads/cars/${req.file.filename}`;
    res.json({ url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Upload failed" });
  }
});

/** POST /api/upload/car-video — single video file (MP4/WebM, max 50MB); returns { url } */
uploadRouter.post("/car-video", uploadVideo.single("video"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No video file" });
    const baseUrl = process.env.API_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}/uploads/cars/${req.file.filename}`;
    res.json({ url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Video upload failed" });
  }
});
