import mongoose from "mongoose";
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },

    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'inactive'],
        default: 'inactive',
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
    });
const CategoryModel = mongoose.model("Category", categorySchema);
export default CategoryModel;