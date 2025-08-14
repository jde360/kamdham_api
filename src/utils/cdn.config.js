import ImageKit from 'imagekit';
import AppError from './error.js';
import { httpCode } from './httpCode.js';
var imagekit = new ImageKit({
    publicKey : "your_public_api_key",
    privateKey : "your_private_api_key",
    urlEndpoint : "https://ik.imagekit.io/your_imagekit_id/"
})

export const uploadImage = (file,name,folder) => {
  try {
    const url = imagekit.upload({
        file: file, // required
        fileName: name, // required
        folder: `/${folder}`, // optional

        }).then(response => {
            return response.url; // returns the URL of the uploaded image
        }).catch(error => {
            throw new AppError("Image upload failed", httpCode.INTERNAL_SERVER_ERROR);
    });
    
  } catch (error) {
    throw new AppError("Image upload failed", httpCode.INTERNAL_SERVER_ERROR);
  }
}