import crypto from "crypto";
import fs from "fs";
import path from "path";
import File from "../models/File.js";
import FileVersion from "../models/FileVersion.js";
import { logAudit } from "../utils/audit.js";
import { upload } from "./File.controller.js";
export { upload };

const uploadDir = path.resolve(process.cwd(), "uploads");

function sha256FileBase64(filePath) {
  const hash = crypto.createHash("sha256");
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest("base64");
}

// העלאת גרסה חדשה לקובץ קיים
export async function uploadVersion(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "Missing file" });

    const doc = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(404).json({ error: "File not found or not owner" });
    }

    const { algorithm, ivB64, wrappedKeyB64, ciphertextSha256B64, encryptedMetaB64, metaIvB64 } = req.body;
    const required = { algorithm, ivB64, wrappedKeyB64, ciphertextSha256B64, encryptedMetaB64, metaIvB64 };
    const missing = Object.entries(required)
      .filter(([, v]) => !v || String(v).trim() === "")
      .map(([k]) => k);

    if (missing.length) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    }

    const serverShaB64 = sha256FileBase64(req.file.path);
    if (serverShaB64 !== ciphertextSha256B64) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ error: "ciphertextSha256 mismatch" });
    }

    // ספור גרסאות קיימות
    const versionCount = await FileVersion.countDocuments({ fileId: doc._id });

    // שמור את הגרסה הנוכחית כ-FileVersion
    await FileVersion.create({
      fileId:              doc._id,
      versionNumber:       versionCount + 1,
      uploadedBy:          req.user.id,
      storedName:          doc.storedName,
      ciphertextSize:      doc.ciphertextSize,
      ciphertextSha256B64: doc.ciphertextSha256B64,
      algorithm:           doc.algorithm,
      ivB64:               doc.ivB64,
      wrappedKeyB64:       doc.wrappedKeyB64,
      encryptedMetaB64:    doc.encryptedMetaB64,
      metaIvB64:           doc.metaIvB64,
    });

    // עדכן את ה-File לגרסה החדשה
    doc.storedName          = req.file.filename;
    doc.ciphertextSize      = req.file.size;
    doc.ciphertextSha256B64 = ciphertextSha256B64;
    doc.algorithm           = algorithm;
    doc.ivB64               = ivB64;
    doc.wrappedKeyB64       = wrappedKeyB64;
    doc.encryptedMetaB64    = encryptedMetaB64;
    doc.metaIvB64           = metaIvB64;
    await doc.save();

    await logAudit({ userId: req.user.id, action: "version_upload", outcome: "success", req, fileId: doc._id });
    res.json({ message: "New version uploaded", versionNumber: versionCount + 2 });
  } catch (e) {
    console.error("Version upload failed:", e);
    await logAudit({ userId: req.user.id, action: "version_upload", outcome: "failure", req, detail: e.message });
    res.status(500).json({ error: "Version upload failed" });
  }
}

// רשימת גרסאות של קובץ
export async function listVersions(req, res) {
  try {
    const doc = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) return res.status(404).json({ error: "File not found or not owner" });

    const versions = await FileVersion.find({ fileId: doc._id })
      .sort({ versionNumber: -1 })
      .select("-wrappedKeyB64 -encryptedMetaB64 -metaIvB64 -ivB64"); // אל תחשוף מפתחות

    res.json(versions);
  } catch (e) {
    res.status(500).json({ error: "Failed to list versions" });
  }
}

// שחזור גרסה ישנה
export async function restoreVersion(req, res) {
  try {
    const doc = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) return res.status(404).json({ error: "File not found or not owner" });

    const version = await FileVersion.findOne({
      _id: req.params.versionId,
      fileId: doc._id,
    });
    if (!version) return res.status(404).json({ error: "Version not found" });

    // ודא שהקובץ הישן עדיין קיים על הדיסק
    const versionPath = path.join(uploadDir, version.storedName);
    if (!fs.existsSync(versionPath))
      return res.status(404).json({ error: "Version file missing on disk" });

    // שמור את הגרסה הנוכחית לפני שמחליפים
    const versionCount = await FileVersion.countDocuments({ fileId: doc._id });
    await FileVersion.create({
      fileId:              doc._id,
      versionNumber:       versionCount + 1,
      uploadedBy:          req.user.id,
      storedName:          doc.storedName,
      ciphertextSize:      doc.ciphertextSize,
      ciphertextSha256B64: doc.ciphertextSha256B64,
      algorithm:           doc.algorithm,
      ivB64:               doc.ivB64,
      wrappedKeyB64:       doc.wrappedKeyB64,
      encryptedMetaB64:    doc.encryptedMetaB64,
      metaIvB64:           doc.metaIvB64,
    });

    // החלף את הגרסה הנוכחית בגרסה הישנה
    doc.storedName          = version.storedName;
    doc.ciphertextSize      = version.ciphertextSize;
    doc.ciphertextSha256B64 = version.ciphertextSha256B64;
    doc.algorithm           = version.algorithm;
    doc.ivB64               = version.ivB64;
    doc.wrappedKeyB64       = version.wrappedKeyB64;
    doc.encryptedMetaB64    = version.encryptedMetaB64;
    doc.metaIvB64           = version.metaIvB64;
    await doc.save();

    await logAudit({ userId: req.user.id, action: "version_restore", outcome: "success", req, fileId: doc._id });
    res.json({ message: `Restored to version ${version.versionNumber}` });
  } catch (e) {
    console.error("Restore failed:", e);
    await logAudit({ userId: req.user.id, action: "version_restore", outcome: "failure", req, detail: e.message });
    res.status(500).json({ error: "Restore failed" });
  }
}
