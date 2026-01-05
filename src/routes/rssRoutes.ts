import express, { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/adminAuth";
import {
  getSources,
  addSource,
  ingestFeeds,
  previewRss,
  testFeedFetch,
  previewTopics,
} from "../controllers/rssController";

const router: Router = express.Router();

router.get("/sources", authenticate, getSources);
router.post("/sources", authenticate, requireAdmin, addSource);
router.post("/ingest", authenticate, ingestFeeds);
router.get("/preview", authenticate, previewRss);

router.get("/test", authenticate, testFeedFetch);
router.get("/topics", authenticate, previewTopics);

export default router;
