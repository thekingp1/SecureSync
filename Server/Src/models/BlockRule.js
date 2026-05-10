import mongoose from "mongoose";

const blockRuleSchema = new mongoose.Schema({
  hostname:  { type: String },
  ipAddress: { type: String },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reason:    { type: String, default: "Manual block" },
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  active:    { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("BlockRule", blockRuleSchema);