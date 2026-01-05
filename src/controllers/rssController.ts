import { Request, Response } from "express";
import { DynamoDBClient, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth";
import { fetchFeeds } from "../cron/fetchFeeds";
import { normalize } from "../cron/normalize";
import { clusterTopics } from "../cron/clusterTopics";
import { feeds } from "../lib/feeds";

const client = new DynamoDBClient({ region: process.env.AWS_REGION_CODE });
const RSS_SOURCES_TABLE = process.env.DYNAMODB_RSS_SOURCES_TABLE || "rss-sources";

export const getSources = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const scanResult = await client.send(
      new ScanCommand({
        TableName: RSS_SOURCES_TABLE,
      })
    );

    const sources = (scanResult.Items || []).map((item) => unmarshall(item));

    res.status(200).json({
      sources,
      total: sources.length,
    });
  }
);

export const addSource = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { url, name, category } = req.body;

    if (!url || !name) {
      return res.status(400).json({ error: "URL and name are required" });
    }

    const sourceId = `source_${Date.now()}`;

    await client.send(
      new PutItemCommand({
        TableName: RSS_SOURCES_TABLE,
        Item: marshall({
          id: sourceId,
          url,
          name,
          category: category || "general",
          added_by: req.user?.user_id,
          created_at: new Date().toISOString(),
          active: true,
        }),
      })
    );

    res.status(201).json({
      id: sourceId,
      url,
      name,
      category: category || "general",
      created_at: new Date().toISOString(),
    });
  }
);

export const ingestFeeds = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const articles = await fetchFeeds();
      const normalized = normalize(articles);

      res.status(200).json({
        status: "success",
        totalArticles: normalized.length,
        articles: normalized.slice(0, 10),
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Feed ingestion error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const previewRss = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const articles = await fetchFeeds();
      const normalized = normalize(articles);

      res.status(200).json({
        totalArticles: normalized.length,
        articles: normalized,
      });
    } catch (error: any) {
      console.error("RSS preview error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

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
