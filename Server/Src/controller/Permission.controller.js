import { Router } from "express";
import { authRequired } from "../middlewares/auth.js";
import File from "../models/File.js";
import User from "../models/User.model.js";
import Permission from "../models/Permission.js";
import { logAudit } from "../utils/audit.js";

const router = Router();


export async function shareFile(req, res){
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) return res.status(404).json({ error: "File not found or not owner" });

    const { email, role, expiresAt } = req.body;
    if (!email || !role) return res.status(400).json({ error: "Missing email or role" });
    if (!["read", "write", "admin"].includes(role))
      return res.status(400).json({ error: "Invalid role" });

    const target = await User.findOne({ email });
    if (!target) return res.status(404).json({ error: "User not found" });
    if (String(target._id) === req.user.id)
      return res.status(400).json({ error: "Cannot share with yourself" });

    const existing = await Permission.findOne({
      fileId: file._id,
      grantedTo: target._id,
      revokedAt: null,
    });

    if (existing) {
      existing.role = role;
      existing.expiresAt = expiresAt || null;
      existing.riskOverride = false;
      await existing.save();
    } else {
      await Permission.create({
        fileId: file._id,
        grantedBy: req.user.id,
        grantedTo: target._id,
        role,
        expiresAt: expiresAt || null,
      });
    }

    await logAudit({ userId: req.user.id, action: "share", outcome: "success", req, fileId: file._id });
    res.json({ message: `Shared with ${email} as ${role}` });
  } catch (e) {
    console.error("Share failed:", e);
    res.status(500).json({ error: "Share failed" });
  }
};


export async function revokePermission(req, res) {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) return res.status(404).json({ error: "File not found or not owner" });

    const perm = await Permission.findOne({
      fileId: file._id,
      grantedTo: req.params.targetUserId,
      revokedAt: null,
    });

    if (!perm) return res.status(404).json({ error: "Permission not found" });

    perm.revokedAt = new Date();
    await perm.save();

    await logAudit({ userId: req.user.id, action: "revoke", outcome: "success", req, fileId: file._id });
    res.json({ message: "Permission revoked" });
  } catch (e) {
    console.error("Revoke failed:", e);
    res.status(500).json({ error: "Revoke failed" });
  }
};

export async function getPermissions(req, res) {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) return res.status(404).json({ error: "File not found or not owner" });

    const perms = await Permission.find({ fileId: file._id })
      .populate("grantedTo", "email name")
      .sort({ createdAt: -1 });

    res.json(perms);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch permissions" });
  }
};

export default router;
