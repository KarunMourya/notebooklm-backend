import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { uploadPdf } from "../controllers/pdfController.js";

const router = Router();
const uploadDir = path.resolve("uploads/");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function clearOldUploads(req, res, next) {
  const files = fs.readdirSync(uploadDir);
  for (const file of files) {
    try {
      fs.unlinkSync(path.join(uploadDir, file));
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  }
  next();
}

const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

router.post("/upload/pdf",clearOldUploads, upload.single("file"), uploadPdf);

export default router;
