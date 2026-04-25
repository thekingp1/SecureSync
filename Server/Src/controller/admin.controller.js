import AuditLog from "../models/AuditLog.js";
import AnomalyScore from "../models/AnomalyScore.js";
import Session from "../models/Session.js";

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