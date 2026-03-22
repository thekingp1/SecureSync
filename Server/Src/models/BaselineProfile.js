import mongoose from "mongoose";

const BaselineProfileSchema = new mongoose.Schema({
  userId:    { type: String, required: true, unique: true },
  avgHour:   Number, stdHour:  Number,
  avgDl:     Number, stdDl:    Number,
  avgDel:    Number, stdDel:   Number,
  updatedAt: Date,
});

export default mongoose.model("BaselineProfile", BaselineProfileSchema);
