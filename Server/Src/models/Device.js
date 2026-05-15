import mongoose from "mongoose";

const DeviceSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hostname:    { type: String },
  os:          { type: String },
  osVersion:   { type: String },
  ipAddress:   { type: String },
  openPorts:   [Number],
  antivirus:   { type: Boolean, default: false },
  lastSeen:    { type: Date, default: Date.now },
  status:      { type: String, enum: ["online", "offline"], default: "online" },
  pendingUpdates: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Device", DeviceSchema);