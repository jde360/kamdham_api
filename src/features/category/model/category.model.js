import mongoose from "mongoose";
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: [true, "Category name must be unique"],
    },

    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "pending", "inactive"],
      default: "pending",
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      default: null,
    },
    image: {
      type: String,
      default: "https://ik.imagekit.io/fqbwqlzwt/kamdham/noImage.png",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
const CategoryModel = mongoose.model("Category", categorySchema);
export default CategoryModel;
