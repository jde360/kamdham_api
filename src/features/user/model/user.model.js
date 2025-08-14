import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
    },
    image: {
        type: String,
        default: "https://ik.imagekit.io/fqbwqlzwt/kamdham/noImage.png",
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'inactive'],
        default: 'active',
    },
},
    {
        timestamps: true,
        versionKey: false,
    });


const UserModel = mongoose.model("User", userSchema);
export default UserModel;