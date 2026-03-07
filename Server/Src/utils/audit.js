import AuditLog from "../models/AuditLog.js";

/**
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.action
 * @param {string} params.outcome  "success" | "failure"
 * @param {import("express").Request} params.req
 * @param {string} [params.fileId]
 * @param {string} [params.detail]
 */
export async function logAudit({ userId, action, outcome, req, fileId = null, detail = null }) {
  try {
    await AuditLog.create({
      userId,
      action,
      outcome,
      fileId,
      detail,
      ip:        req.ip || req.headers["x-forwarded-for"] || null,
      userAgent: req.headers["user-agent"] || null,
    });
  } catch (err) {
    // לא נפיל את הבקשה בגלל כשל ב-audit
    console.error("[audit] Failed to write audit log:", err.message);
  }
}
