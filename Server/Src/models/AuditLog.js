import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action:     { type: String, enum: ["upload", "download", "delete", "list", "login", "verify_otp", "share", "revoke"], required: true },
    fileId:     { type: mongoose.Schema.Types.ObjectId, ref: "File", default: null },
    ip:         { type: String, default: null },
    userAgent:  { type: String, default: null },
    outcome:    { type: String, enum: ["success", "failure"], required: true },
    detail:     { type: String, default: null }, // הודעת שגיאה אם outcome === "failure"
  },
  {
    timestamps: true,   // createdAt אוטומטי
    versionKey: false,
  }
);

// אסור לעדכן רשומות – רק ליצור
auditLogSchema.pre(["updateOne", "findOneAndUpdate", "updateMany"], function () {
  throw new Error("AuditLog records are immutable");
});

export default mongoose.model("AuditLog", auditLogSchema);
