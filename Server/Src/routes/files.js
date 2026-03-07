import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import File from "../models/File.js";
import { logAudit } from "../utils/audit.js";


const router = Router();

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const randomName = crypto.randomBytes(16).toString("hex") + ".enc";
    cb(null, randomName);
  },
});

const upload = multer({ storage });

function sha256FileBase64(filePath) {
  const hash = crypto.createHash("sha256");
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest("base64");
}

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      await logAudit({ userId: req.user.id, action: "upload", outcome: "failure", req, detail: "Missing file" });
      return res.status(400).json({ error: "Missing file" });
    }

    const { algorithm, ivB64, wrappedKeyB64, ciphertextSha256B64, encryptedMetaB64, metaIvB64 } = req.body;
    const required = { algorithm, ivB64, wrappedKeyB64, ciphertextSha256B64, encryptedMetaB64, metaIvB64 };
    const missing = Object.entries(required)
      .filter(([, v]) => v === undefined || v === null || String(v).trim() === "")
      .map(([k]) => k);

    if (missing.length) {
      try { fs.unlinkSync(req.file.path); } catch {}
      await logAudit({ userId: req.user.id, action: "upload", outcome: "failure", req, detail: `Missing fields: ${missing.join(", ")}` });
      return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    }

    const serverShaB64 = sha256FileBase64(req.file.path);
    if (serverShaB64 !== ciphertextSha256B64) {
      try { fs.unlinkSync(req.file.path); } catch {}
      await logAudit({ userId: req.user.id, action: "upload", outcome: "failure", req, detail: "SHA-256 mismatch" });
      return res.status(400).json({ error: "ciphertextSha256 mismatch" });
    }

    const doc = await File.create({
      userId: req.user.id,
      storedName: req.file.filename,
      ciphertextSize: req.file.size,
      ciphertextSha256B64,
      algorithm, ivB64, wrappedKeyB64, encryptedMetaB64, metaIvB64,
    });

    await logAudit({ userId: req.user.id, action: "upload", outcome: "success", req, fileId: doc._id });
    res.json({ id: doc._id });
  } catch (e) {
    console.error("Upload failed:", e);
    await logAudit({ userId: req.user.id, action: "upload", outcome: "failure", req, detail: e.message });
    res.status(500).json({ error: "Upload failed" });
  }
});


router.get("/", async (_req, res) => {
  try {
    const files = await File.find({ userId: _req.user.id }).sort({ createdAt: -1 }).limit(50);
    await logAudit({ userId: _req.user.id, action: "list", outcome: "success", req: _req });
    res.json(files);
  } catch (e) {
    console.error("List files failed:", e);
    await logAudit({ userId: _req.user.id, action: "list", outcome: "failure", req: _req, detail: e.message });
    res.status(500).json({ error: "List failed" });
  }
});


router.get("/:id/download", async (req, res) => {
  try {
    const doc = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      await logAudit({ userId: req.user.id, action: "download", outcome: "failure", req, fileId: req.params.id, detail: "File not found" });
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = path.join(uploadDir, doc.storedName);
    if (!fs.existsSync(filePath)) {
      await logAudit({ userId: req.user.id, action: "download", outcome: "failure", req, fileId: doc._id, detail: "File missing on disk" });
      return res.status(404).json({ error: "File missing on disk" });
    }

    const meta = {
      algorithm: doc.algorithm, ivB64: doc.ivB64, wrappedKeyB64: doc.wrappedKeyB64,
      ciphertextSha256B64: doc.ciphertextSha256B64, encryptedMetaB64: doc.encryptedMetaB64, metaIvB64: doc.metaIvB64,
    };

    const metaB64 = Buffer.from(JSON.stringify(meta), "utf8").toString("base64url");
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("x-securesync-meta", metaB64);
    res.setHeader("Access-Control-Expose-Headers", "x-securesync-meta");

    await logAudit({ userId: req.user.id, action: "download", outcome: "success", req, fileId: doc._id });
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    console.error("Download failed:", e);
    await logAudit({ userId: req.user.id, action: "download", outcome: "failure", req, detail: e.message });
    res.status(500).json({ error: "Download failed" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const doc = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      await logAudit({ userId: req.user.id, action: "delete", outcome: "failure", req, fileId: req.params.id, detail: "File not found" });
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = path.join(uploadDir, doc.storedName);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }

    await doc.deleteOne();
    await logAudit({ userId: req.user.id, action: "delete", outcome: "success", req, fileId: doc._id });
    res.json({ message: "Deleted successfully" });
  } catch (e) {
    console.error("Delete failed:", e);
    await logAudit({ userId: req.user.id, action: "delete", outcome: "failure", req, detail: e.message });
    res.status(500).json({ error: "Delete failed" });
  }
});



export default router;