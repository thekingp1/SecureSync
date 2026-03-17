import mongoose from "mongoose";

const fileVersionSchema = new mongoose.Schema(
  {
    fileId:             { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    versionNumber:      { type: Number, required: true },
    uploadedBy:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    storedName:         { type: String, required: true },
    ciphertextSize:     { type: Number, required: true },
    ciphertextSha256B64:{ type: String, required: true },
    algorithm:          { type: String, required: true },
    ivB64:              { type: String, required: true },
    wrappedKeyB64:      { type: String, required: true },
    encryptedMetaB64:   { type: String, required: true },
    metaIvB64:          { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

fileVersionSchema.index({ fileId: 1, versionNumber: 1 });

export default mongoose.model("FileVersion", fileVersionSchema);
