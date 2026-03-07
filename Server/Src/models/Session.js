import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jti:       { type: String, required: true, unique: true },
    ip:        { type: String, default: null },
    userAgent: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

// index לניקוי אוטומטי של sessions שפגו תוקפם
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Session", sessionSchema);
