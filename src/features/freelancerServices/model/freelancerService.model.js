import mongoose from "mongoose";
const freeLancerServiceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "Freelancer", required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true, default: 10 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    images: [{ type: String }],
    skills: [{ type: String }],
    availability: [
        {
            type: String,
            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            , default: "Monday"
        }

    ],
    status: { type: String, enum: ["active", "inactive", "suspend"], default: "active" },
    location: { type: String, required: true },
    exprience: { type: Number, required: true },

}, {
    timestamps: true,
    versionKey: false
});
export const FreeLancerServiceModel = mongoose.model("FreeLancerService", freeLancerServiceSchema);