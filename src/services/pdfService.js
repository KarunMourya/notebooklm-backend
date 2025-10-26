  import fs from "fs";
  import { createRequire } from "module";

  const require = createRequire(import.meta.url);
  const pdfParse = require("pdf-parse");

  export async function handleUpload(file) {
    return {
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  export async function parsePdf(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const result = await new pdfParse.PDFParse({data: dataBuffer}).getText();
    console.log('result: ', result);

    return {
      text: result.text,
      numPages: result.total,
    };
  }
