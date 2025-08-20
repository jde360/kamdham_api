import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "job",
      required: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
    },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "rejected", "hired", "withdrawn"],
      default: "applied",
    },
    proposedRate: {
      type: Number,
      required: true,
    },

    employerNotes: {
      type: String,
      maxlength: 500,
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["applied", "shortlisted", "rejected", "hired", "withdrawn"],
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "statusHistory.changedByModel",
        },
        changedByModel: {
          type: String,
          enum: ["User", "Freelancer"],
        },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
jobApplicationSchema.index({ job: 1, freelancer: 1 }, { unique: true });
jobApplicationSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});
const JobApplicationModel = mongoose.model(
  "JobApplication",
  jobApplicationSchema
);
export default JobApplicationModel;
