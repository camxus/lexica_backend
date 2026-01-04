import express, { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  testFeedFetch,
  previewTopics,
} from "../controllers/rssController";

const router: Router = express.Router();

router.get("/test", authenticate, testFeedFetch);
router.get("/preview", authenticate, previewTopics);

export default router;
