import mongoose from "mongoose";
const ratingSchema = new mongoose.Schema({
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Freelancer",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: [true, "you already rated this person"],
  },

  averageRating: {
    type: String,
    required: true,
    default: "",
  },
  averageRating: {
    type: Number,
    required: true,
    default: 0.0,
  },
});
const RatingModel = mongoose.model("Rating", ratingSchema);
export default RatingModel;
