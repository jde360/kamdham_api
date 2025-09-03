import multer from "multer";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../temp/my-uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure the directory exists
    fs.mkdir(uploadDir, { recursive: true }, (err) => {
      cb(err, uploadDir);
    });
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = file.mimetype.split('/')[1];
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  }
});
 const uploadMiddleWare = multer({ storage: storage });
 export default uploadMiddleWare;