import mongoose from "mongoose";
const freelancerServiceApplicationSchema = new mongoose.Schema({
    service: { type: mongoose.Schema.Types.ObjectId, ref: "FreeLancerService", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected", "withdrawn", "hired", "completed"], default: "pending" },
    paymentType: { type: String, enum: ["pay after service", "full", "advance", "pending"], required: true, default: "pending" },
    bookingAmount: { type: Number, required: true },
    pendingAmount: { type: Number, default: 0 },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true },
    additionalNotes: { type: String },
    freelancerNotes: { type: String }, 
    completionNotes: { type: String },
    completedAt: { type: Date },
    acceptedAt: { type: Date },
    hiredAt: { type: Date },
    rejectedAt: { type: Date },

}, {
    timestamps: true,
    versionKey: false
});
export const FreelancerServiceApplicationModel = mongoose.model("FreelancerServiceApplication", freelancerServiceApplicationSchema);
