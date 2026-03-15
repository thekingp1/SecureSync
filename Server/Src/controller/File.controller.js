import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import File from "../models/File.js";
import { hasPermission } from "../utils/permissions.js";
import Permission from "../models/Permission.js";

import { logAudit } from "../utils/audit.js";

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, _file, cb) => {
    const randomName = crypto.randomBytes(16).toString("hex") + ".enc";
    cb(null, randomName);
  },
});

export const upload = multer({ storage });

function sha256FileBase64(filePath) {
  const hash = crypto.createHash("sha256");
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest("base64");
}

export async function uploadFile(req, res) {
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
}

export async function listFiles(req, res) {
  try {
    // קבצים של המשתמש עצמו
    const ownFiles = await File.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    // קבצים ששותפו איתו
    const sharedPerms = await Permission.find({
      grantedTo: req.user.id,
      revokedAt: null,
      riskOverride: false,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).populate("fileId");

    const sharedFiles = sharedPerms
      .filter((p) => p.fileId)
      .map((p) => ({ ...p.fileId.toObject(), sharedAs: p.role }));

    await logAudit({ userId: req.user.id, action: "list", outcome: "success", req });
    res.json([...ownFiles, ...sharedFiles]);
  } catch (e) {
    console.error("List files failed:", e);
    await logAudit({ userId: req.user.id, action: "list", outcome: "failure", req, detail: e.message });
    res.status(500).json({ error: "List failed" });
  }
}


export async function downloadFile(req, res) {
  try {
    let doc = await File.findOne({ _id: req.params.id, userId: req.user.id });

    // אם לא הבעלים – בדוק הרשאה
    if (!doc) {
      const allowed = await hasPermission(req.params.id, req.user.id, "read");
      if (!allowed) {
        await logAudit({ userId: req.user.id, action: "download", outcome: "failure", req, fileId: req.params.id, detail: "No permission" });
        return res.status(403).json({ error: "Access denied" });
      }
      doc = await File.findById(req.params.id);
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
}


export async function deleteFile(req, res) {
  try {
    let doc = await File.findOne({ _id: req.params.id, userId: req.user.id });

    if (!doc) {
      const allowed = await hasPermission(req.params.id, req.user.id, "admin");
      if (!allowed) {
        await logAudit({ userId: req.user.id, action: "delete", outcome: "failure", req, fileId: req.params.id, detail: "No permission" });
        return res.status(403).json({ error: "Access denied" });
      }
      doc = await File.findById(req.params.id);
    }

    const filePath = path.join(uploadDir, doc.storedName);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }

    await doc.deleteOne();
    await Permission.deleteMany({ fileId: doc._id }); // נקה הרשאות של הקובץ
    await logAudit({ userId: req.user.id, action: "delete", outcome: "success", req, fileId: doc._id });
    res.json({ message: "Deleted successfully" });
  } catch (e) {
    console.error("Delete failed:", e);
    await logAudit({ userId: req.user.id, action: "delete", outcome: "failure", req, detail: e.message });
    res.status(500).json({ error: "Delete failed" });
  }
}

