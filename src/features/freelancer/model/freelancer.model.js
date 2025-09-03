import mongoose from "mongoose";
const freelancerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: [true, "this phone number already used"],
    },
    pan: {
      type: String,
      require: [true, "please provide your PAN number"],
      unique: [true, "this PAN number already used"]
    },
    aadhaar: {
      type: String,
      require: [true, "Please provide your aadhar number"],
      unique: [true, "this Aadhaar number already used"]

    },
    panImage: {
      type: "String",
      default: ""
    },
    aadharImage: {

      type: "String",
      default: ""
    },

    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    email: {
      type: String,
      unique: [true, "this email already used"],
    },
    profession: {
      type: String,
      default: "",
    },
    summary: {
      type: String,
      default: "",
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    isRegistered: {
      type: Boolean,
      default: false,
    },
    pricePerHr: {
      type: Number,
      required: true,
      default: 0.0,
    },
    skills: [
      {
        type: String,
      },
    ],

    image: {
      type: String,
      default: "https://ik.imagekit.io/fqbwqlzwt/kamdham/noImage.png",
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive", "suspend"],
      default: "inactive",
    },
    languages: [
      {
        type: String,
      },
    ],
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const FreelancerModel = mongoose.model("Freelancer", freelancerSchema);
export default FreelancerModel;
