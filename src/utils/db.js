
import mongoose from "mongoose";
const connectDB = async (url) => {
    try {
        await mongoose.connect(url);
        console.log("Connected to DB");
    } catch (error) {
       throw new Error("Error connecting to DB: " + error.message);
    }
}
export default connectDB