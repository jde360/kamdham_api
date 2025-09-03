import ImageKit from "imagekit";
import AppError from "./error.js";
import { httpCode } from "./httpCode.js";
import { appConfig } from "./appConfig.js";
import fs from "fs";
var imagekit = new ImageKit({
    publicKey: appConfig.IMAGEKIT_PUBLIC_KEY,
    privateKey: appConfig.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: appConfig.IMAGEKIT_URL_ENDPOINT
});


export const uploadImage = async (file, folder, name) => {
    try {
        console.log(name);

        const res = await imagekit.upload(
            {
                file: file.path,
                fileName: name,
                folder: `/${folder}`,
            }
        );
        await deleteImage(file.path);
        return res.url;

    } catch (error) {
        console.log(error);
        await deleteImage(file.path);
        throw new AppError("Image upload failed", httpCode.BAD_REQUEST);
    }

}

const deleteImage = async (imageUrl) => {
    fs.unlink(imageUrl, (err) => {
        if (err) {
            console.error("Error deleting file:", err);
        } else {
            console.log("File deleted successfully");
        }
    });
}