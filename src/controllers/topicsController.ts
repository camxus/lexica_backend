import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { AuthenticatedRequest } from "../middleware/auth";
import { dynamo, TOPICS_TABLE } from "../lib/aws";

export const getTopics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { limit = "20", lastKey, status } = req.query;

    try {
      const filterExpressions: string[] = [];
      const expressionAttributeValues: Record<string, any> = {};

      if (status) {
        filterExpressions.push("#status = :status");
        expressionAttributeValues[":status"] = status;
      }

      const params: any = {
        TableName: TOPICS_TABLE,
        Limit: parseInt(limit as string),
      };

      if (filterExpressions.length > 0) {
        params.FilterExpression = filterExpressions.join(" AND ");
        params.ExpressionAttributeNames = { "#status": "status" };
        params.ExpressionAttributeValues = marshall(expressionAttributeValues);
      }

      if (lastKey) {
        params.ExclusiveStartKey = JSON.parse(lastKey as string);
      }

      const result = await dynamo.send(new ScanCommand(params));

      const topics = result.Items?.map((item) => unmarshall(item)) || [];

      res.status(200).json({
        topics,
        lastKey: result.LastEvaluatedKey
          ? JSON.stringify(result.LastEvaluatedKey)
          : null,
        hasMore: !!result.LastEvaluatedKey,
      });
    } catch (error: any) {
      console.error("Get topics error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const getTopicsByDate = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { date } = req.params;

    try {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: TOPICS_TABLE,
          KeyConditionExpression: "pk = :pk",
          ExpressionAttributeValues: marshall({
            ":pk": `TOPIC#${date}`,
          }),
        })
      );

      const topics = result.Items?.map((item) => unmarshall(item)) || [];

      res.status(200).json({ topics });
    } catch (error: any) {
      console.error("Get topics by date error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const getTopicBySlug = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { slug } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date query parameter is required" });
    }

    try {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: TOPICS_TABLE,
          KeyConditionExpression: "pk = :pk AND sk = :sk",
          ExpressionAttributeValues: marshall({
            ":pk": `TOPIC#${date}`,
            ":sk": `TOPIC#${slug}`,
          }),
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return res.status(404).json({ error: "Topic not found" });
      }

      const topic = unmarshall(result.Items[0]);

      res.status(200).json({ topic });
    } catch (error: any) {
      console.error("Get topic by slug error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);
