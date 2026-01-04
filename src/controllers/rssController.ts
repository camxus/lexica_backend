import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth";
import { fetchFeeds } from "../cron/fetchFeeds";
import { normalize } from "../cron/normalize";
import { clusterTopics } from "../cron/clusterTopics";

export const testFeedFetch = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const articles = await fetchFeeds();
      const normalized = normalize(articles);

      res.status(200).json({
        totalArticles: normalized.length,
        articles: normalized.slice(0, 10),
      });
    } catch (error: any) {
      console.error("Test feed fetch error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const previewTopics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const articles = await fetchFeeds();
      const normalized = normalize(articles);
      const topics = await clusterTopics(normalized);
      const relevant = topics.filter((t) => t.relevancy >= 60);

      res.status(200).json({
        totalArticles: normalized.length,
        totalTopics: topics.length,
        relevantTopics: relevant.length,
        topics: relevant,
      });
    } catch (error: any) {
      console.error("Preview topics error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);
