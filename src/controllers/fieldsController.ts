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

const FIELDS_TABLE = process.env.DYNAMODB_FIELDS_TABLE || "LexicaFields";

export const getFields = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.user_id;

    try {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: FIELDS_TABLE,
          KeyConditionExpression: "pk = :pk",
          ExpressionAttributeValues: marshall({
            ":pk": `USER#${userId}`,
          }),
        })
      );

      const fields = result.Items?.map((item) => unmarshall(item)) || [];

      res.status(200).json({ fields });
    } catch (error: any) {
      console.error("Get fields error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const getFieldById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.user_id;
    const { fieldId } = req.params;

    try {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: FIELDS_TABLE,
          KeyConditionExpression: "pk = :pk AND sk = :sk",
          ExpressionAttributeValues: marshall({
            ":pk": `USER#${userId}`,
            ":sk": `FIELD#${fieldId}`,
          }),
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return res.status(404).json({ error: "Field not found" });
      }

      const field = unmarshall(result.Items[0]);

      res.status(200).json({ field });
    } catch (error: any) {
      console.error("Get field by id error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const createField = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.user_id;
    const { name, description, topics } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    try {
      const fieldId = uuidv4();
      const now = new Date().toISOString();

      const field = {
        pk: `USER#${userId}`,
        sk: `FIELD#${fieldId}`,
        fieldId,
        userId,
        name,
        description: description || null,
        topics: topics || [],
        createdAt: now,
        updatedAt: now,
      };

      await dynamo.send(
        new PutItemCommand({
          TableName: FIELDS_TABLE,
          Item: marshall(field, { removeUndefinedValues: true }),
        })
      );

      res.status(201).json({ field });
    } catch (error: any) {
      console.error("Create field error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const updateField = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.user_id;
    const { fieldId } = req.params;
    const { name, description, topics } = req.body;

    try {
      const updateExpression: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      if (name !== undefined) {
        updateExpression.push("#name = :name");
        expressionAttributeNames["#name"] = "name";
        expressionAttributeValues[":name"] = name;
      }

      if (description !== undefined) {
        updateExpression.push("#description = :description");
        expressionAttributeNames["#description"] = "description";
        expressionAttributeValues[":description"] = description;
      }

      if (topics !== undefined) {
        updateExpression.push("#topics = :topics");
        expressionAttributeNames["#topics"] = "topics";
        expressionAttributeValues[":topics"] = topics;
      }

      updateExpression.push("#updatedAt = :updatedAt");
      expressionAttributeNames["#updatedAt"] = "updatedAt";
      expressionAttributeValues[":updatedAt"] = new Date().toISOString();

      await dynamo.send(
        new UpdateItemCommand({
          TableName: FIELDS_TABLE,
          Key: marshall({
            pk: `USER#${userId}`,
            sk: `FIELD#${fieldId}`,
          }),
          UpdateExpression: `SET ${updateExpression.join(", ")}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: marshall(expressionAttributeValues),
        })
      );

      const updated = await dynamo.send(
        new QueryCommand({
          TableName: FIELDS_TABLE,
          KeyConditionExpression: "pk = :pk AND sk = :sk",
          ExpressionAttributeValues: marshall({
            ":pk": `USER#${userId}`,
            ":sk": `FIELD#${fieldId}`,
          }),
        })
      );

      const field = unmarshall(updated.Items![0]);

      res.status(200).json({ field });
    } catch (error: any) {
      console.error("Update field error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const deleteField = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.user_id;
    const { fieldId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await dynamo.send(
        new DeleteItemCommand({
          TableName: FIELDS_TABLE,
          Key: marshall({
            pk: `USER#${userId}`,
            sk: `FIELD#${fieldId}`,
          }),
        })
      );

      res.status(200).json({ message: "Field deleted successfully" });
    } catch (error: any) {
      console.error("Delete field error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);
