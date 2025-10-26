import { queue } from "../configs/bullmqQueue.js";
import { handleUpload, parsePdf } from "../services/pdfService.js";

export async function uploadPdf(req, res) {
  try {
    await queue.add(
    'file-ready',
    JSON.stringify({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    })
  );
  return res.json({ message: 'uploaded' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }
}
