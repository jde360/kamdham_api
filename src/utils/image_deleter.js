import ImageKit from "imagekit";
const imageKit  = new ImageKit({
    publicKey: appConfig.IMAGEKIT_PUBLIC_KEY,
    privateKey: appConfig.IMAGEKIT_PRIVATE_KEY,
});
import AppError from "./error.js";
import { httpCode } from "./httpCode.js";
import { appConfig } from "./appConfig.js";
var imagekit = new ImageKit({
    publicKey: appConfig.IMAGEKIT_PUBLIC_KEY,
    privateKey: appConfig.IMAGEKIT_PRIVATE_KEY,
});
const imageDeleter =  async (imageUrl) => {
    imagekit.deleteFile(imageUrl, function(error, result) {
        if(error) console.log(error);
        else console.log(result);
    });
}

export default imageDeleter;