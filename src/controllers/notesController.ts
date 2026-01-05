import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { AuthenticatedRequest } from "../middleware/auth";
import { dynamo } from "../lib/aws";
import { v4 as uuidv4 } from "uuid";

const NOTES_TABLE = process.env.DYNAMODB_NOTES_TABLE || "LexicaNotes";

export const getNotes = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.user_id;
    const { topicSlug, limit = "20", lastKey } = req.query;

    try {
      const params: any = {
        TableName: NOTES_TABLE,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: marshall({
          ":pk": `USER#${userId}`,
        }),
        Limit: parseInt(limit as string),
      };

      if (topicSlug) {
        params.FilterExpression = "topicSlug = :topicSlug";
        params.ExpressionAttributeValues = marshall({
          ":pk": `USER#${userId}`,
          ":topicSlug": topicSlug,
        });
      }

      if (lastKey) {
        params.ExclusiveStartKey = JSON.parse(lastKey as string);
      }

      const result = await dynamo.send(new QueryCommand(params));

      const notes = result.Items?.map((item) => unmarshall(item)) || [];

      res.status(200).json({
        notes,
        lastKey: result.LastEvaluatedKey
          ? JSON.stringify(result.LastEvaluatedKey)
          : null,
        hasMore: !!result.LastEvaluatedKey,
      });
    } catch (error: any) {
      console.error("Get notes error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const getNoteById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.user_id;
    const { noteId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: NOTES_TABLE,
          KeyConditionExpression: "pk = :pk AND sk = :sk",
          ExpressionAttributeValues: marshall({
            ":pk": `USER#${userId}`,
            ":sk": `NOTE#${noteId}`,
          }),
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return res.status(404).json({ error: "Note not found" });
      }

      const note = unmarshall(result.Items[0]);

      res.status(200).json({ note });
    } catch (error: any) {
      console.error("Get note by id error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const createNote = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.user_id;
    const { topicSlug, level, content, title } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!content || !topicSlug) {
      return res
        .status(400)
        .json({ error: "Content and topicSlug are required" });
    }

    try {
      const noteId = uuidv4();
      const now = new Date().toISOString();

      const note = {
        pk: `USER#${userId}`,
        sk: `NOTE#${noteId}`,
        noteId,
        userId,
        topicSlug,
        level: level || null,
        title: title || null,
        content,
        createdAt: now,
        updatedAt: now,
      };

      await dynamo.send(
        new PutItemCommand({
          TableName: NOTES_TABLE,
          Item: marshall(note, { removeUndefinedValues: true }),
        })
      );

      res.status(201).json({ note });
    } catch (error: any) {
      console.error("Create note error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const updateNote = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.user_id;
    const { noteId } = req.params;
    const { content, title } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const updateExpression: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      if (content !== undefined) {
        updateExpression.push("#content = :content");
        expressionAttributeNames["#content"] = "content";
        expressionAttributeValues[":content"] = content;
      }

      if (title !== undefined) {
        updateExpression.push("#title = :title");
        expressionAttributeNames["#title"] = "title";
        expressionAttributeValues[":title"] = title;
      }

      updateExpression.push("#updatedAt = :updatedAt");
      expressionAttributeNames["#updatedAt"] = "updatedAt";
      expressionAttributeValues[":updatedAt"] = new Date().toISOString();

      await dynamo.send(
        new UpdateItemCommand({
          TableName: NOTES_TABLE,
          Key: marshall({
            pk: `USER#${userId}`,
            sk: `NOTE#${noteId}`,
          }),
          UpdateExpression: `SET ${updateExpression.join(", ")}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: marshall(expressionAttributeValues),
        })
      );

      const updated = await dynamo.send(
        new QueryCommand({
          TableName: NOTES_TABLE,
          KeyConditionExpression: "pk = :pk AND sk = :sk",
          ExpressionAttributeValues: marshall({
            ":pk": `USER#${userId}`,
            ":sk": `NOTE#${noteId}`,
          }),
        })
      );

      const note = unmarshall(updated.Items![0]);

      res.status(200).json({ note });
    } catch (error: any) {
      console.error("Update note error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const deleteNote = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.user_id;
    const { noteId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await dynamo.send(
        new DeleteItemCommand({
          TableName: NOTES_TABLE,
          Key: marshall({
            pk: `USER#${userId}`,
            sk: `NOTE#${noteId}`,
          }),
        })
      );

      res.status(200).json({ message: "Note deleted successfully" });
    } catch (error: any) {
      console.error("Delete note error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);
