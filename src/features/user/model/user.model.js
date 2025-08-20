import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
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
    image: {
      type: String,
      default: "https://ik.imagekit.io/fqbwqlzwt/kamdham/noImage.png",
    },

    status: {
      type: String,
      required: true,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
