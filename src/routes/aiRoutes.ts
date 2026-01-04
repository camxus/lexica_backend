import express, { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  generateSummary,
  generateQuiz,
} from "../controllers/aiController";

const router: Router = express.Router();

router.post("/summary", authenticate, generateSummary);
router.post("/quiz", authenticate, generateQuiz);

export default router;
