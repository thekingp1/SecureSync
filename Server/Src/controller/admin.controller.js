import AuditLog from "../models/AuditLog.js";
import AnomalyScore from "../models/AnomalyScore.js";
import Session from "../models/Session.js";
import BlockRule from "../models/BlockRule.js";
import User from "../models/User.model.js";


export async function getAuditLogs(req, res) {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("userId", "email name");
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function getAnomalyScores(req, res) {
  try {
    const scores = await AnomalyScore.find()
      .sort({ detectedAt: -1 })
      .limit(50);
    res.json(scores);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function getActiveSessions(req, res) {
  try {
    const sessions = await Session.find({ revokedAt: null })
      .sort({ createdAt: -1 })
      .populate("userId", "email name");
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
export async function blockDevice(req, res) {
  try {
    const { hostname, ipAddress, reason } = req.body;
    await BlockRule.create({ hostname, ipAddress, reason, blockedBy: req.user.id, active: true });
    res.json({ message: "Device blocked" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function unblockDevice(req, res) {
  try {
    await BlockRule.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: "Device unblocked" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function getBlockRules(req, res) {
  try {
    const rules = await BlockRule.find({ active: true });
    res.json(rules);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function getUsers(req, res) {
  try {
    const users = await User.find({}, "email name createdAt");
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function blockUser(req, res) {
  try {
    const { userId, reason } = req.body;
    await BlockRule.create({ userId, reason, blockedBy: req.user.id, active: true });
    res.json({ message: "User blocked" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}