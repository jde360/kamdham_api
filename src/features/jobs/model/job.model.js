import mongoose from "mongoose";
const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "title is required"],
    },
    description: {
      type: String,
      required: [true, "description is required"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "category is required"],
    },

    requirements: [
      {
        type: String,
      },
    ],
    duration: {
      type: Number,
      default: 30,
      required: [true, "duration required"],
    },
    city: {
      type: String,
      required: [true, "provide your state"],
    },
    state: {
      type: String,
      required: [true, "provide your address"],
    },
    venue: {
      type: String,
      required: [true, "provide your working address"],
    },
    applicant: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Freelancer",
      },
    ],
    shortListed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Freelancer",
      },
    ],
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deadLine: {
      type: Date,
      default: null,
    },
    budget: {
      type: Number,
      required: [true, "please add your budget"],
      default: 500,
    },
    status: {
      type: String,
      enum: ["active", "pending", "inactive", "suspended", "closed"],
      default: "active",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
const JobModel = mongoose.model("job", jobSchema);
export default JobModel;
