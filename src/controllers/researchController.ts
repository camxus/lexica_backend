import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { AuthenticatedRequest } from "../middleware/auth";
import { dynamo, s3, ARTICLES_TABLE, BUCKET } from "../lib/aws";

export const getResearchByTopic = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { slug } = req.params;

    try {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: ARTICLES_TABLE,
          KeyConditionExpression: "pk = :pk",
          ExpressionAttributeValues: marshall({
            ":pk": `TOPIC#${slug}`,
          }),
        })
      );

      const articles = result.Items?.map((item) => unmarshall(item)) || [];

      res.status(200).json({ articles });
    } catch (error: any) {
      console.error("Get research by topic error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const getResearchByLevel = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { slug, level } = req.params;

    try {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: ARTICLES_TABLE,
          KeyConditionExpression: "pk = :pk AND sk = :sk",
          ExpressionAttributeValues: marshall({
            ":pk": `TOPIC#${slug}`,
            ":sk": `LEVEL#${level}`,
          }),
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return res.status(404).json({ error: "Research article not found" });
      }

      const article = unmarshall(result.Items[0]);

      const s3Result = await s3.send(
        new GetObjectCommand({
          Bucket: BUCKET,
          Key: article.s3Key,
        })
      );

      const content = await s3Result.Body?.transformToString();

      res.status(200).json({
        article: {
          ...article,
          content,
        },
      });
    } catch (error: any) {
      console.error("Get research by level error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);
