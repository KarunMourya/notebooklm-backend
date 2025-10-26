import { Router } from "express";
import { chatWithDocument } from "../controllers/chatController.js";

const router = Router();

router.post("/chat", chatWithDocument);

export default router;
