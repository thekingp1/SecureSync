import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    otpCode:{type: String, default: null},
    otpExpires: {type: Date, default: null}
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);