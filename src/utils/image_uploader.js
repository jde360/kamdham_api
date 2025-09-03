import ImageKit from "imagekit";
import AppError from "./error.js";
import { httpCode } from "./httpCode.js";
var imagekit = new ImageKit({
    publicKey : "your_public_api_key",
    privateKey : "your_private_api_key",
    urlEndpoint : "https://ik.imagekit.io/your_imagekit_id/"
});


export const uploadImage = async(image, folder,name) => {
    try {
    const res =   await  imagekit.upload(
        {
            file : image, //required
            fileName : "image.jpg",   //required
            folder: "/your_folder_name/"
        }
    );
    } catch (error) {
        throw new AppError("Image upload failed", httpCode.BAD_REQUEST);
    }

}