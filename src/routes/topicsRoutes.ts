import express, { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getTopics,
  getTopicBySlug,
  getTopicsByDate,
} from "../controllers/topicsController";

const router: Router = express.Router();

router.get("/", authenticate, getTopics);
router.get("/date/:date", authenticate, getTopicsByDate);
router.get("/:slug", authenticate, getTopicBySlug);

export default router;
