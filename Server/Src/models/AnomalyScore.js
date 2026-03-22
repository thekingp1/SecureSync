import mongoose from "mongoose";

const AnomalyScoreSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, 
               ref:"User", 
               required: true},
    action: {type: String},
    score: {type: Number},
    method: {type: String, default : "z-score"},
    details: [String],
    detectedAt: {type: Date, default : Date.now},
});

export default  mongoose.model("AnomalyScore", AnomalyScoreSchema);