import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    fileId:       { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    grantedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    grantedTo:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role:         { type: String, enum: ["read", "write", "admin"], required: true },
    expiresAt:    { type: Date, default: null },      
    revokedAt:    { type: Date, default: null },      
    riskOverride: { type: Boolean, default: false },  
  },
  { timestamps: true, versionKey: false }
);

permissionSchema.index({ fileId: 1, grantedTo: 1 });

export default mongoose.model("Permission", permissionSchema);
