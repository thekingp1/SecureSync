import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true},
    storedName: { type: String, required: true, unique: true },
    ciphertextSize: { type: Number, required: true },
    ciphertextSha256B64: { type: String, required: true },

    algorithm: { type: String, required: true },
    ivB64: { type: String, required: true },
    wrappedKeyB64: { type: String, required: true },

    encryptedMetaB64:   { type: String, required: true },
    metaIvB64:          { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("File", fileSchema);