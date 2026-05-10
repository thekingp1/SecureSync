import mongoose from "mongoose";

const KeyPairSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  publicKey:  { type: String, required: true },
  privateKey: { type: String, required: true },
  algorithm:  { type: String, default: "RSA-2048" },
  createdAt:  { type: Date, default: Date.now },
});

export default mongoose.model("KeyPair", KeyPairSchema);