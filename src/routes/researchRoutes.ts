import express, { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getResearchByTopic,
  getResearchByLevel,
} from "../controllers/researchController";

const router: Router = express.Router();

router.get("/:slug", authenticate, getResearchByTopic);
router.get("/:slug/level/:level", authenticate, getResearchByLevel);

export default router;
