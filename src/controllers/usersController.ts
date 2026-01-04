import { Request, RequestHandler, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { GetItemCommand, UpdateItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { AuthenticatedRequest } from "../middleware/auth";
import { dynamo, s3, USERS_TABLE, ARTICLES_TABLE } from "../lib/aws";
import { copyItemImage, getSignedImage, saveItemImage } from "../utils/s3";
import multer from "multer";
import { extension as mimeExtension } from "mime-types";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const uploadAvatar: RequestHandler = upload.single("avatar_file");

export const getProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const result = await dynamo.send(
        new GetItemCommand({
          TableName: USERS_TABLE,
          Key: marshall({ user_id: userId }),
        })
      );

      if (!result.Item) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = unmarshall(result.Item);

      if (user.avatar) {
        user.avatar = await getSignedImage(s3, user.avatar);
      }

      res.status(200).json({ user });
    } catch (error: any) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const updateProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let { first_name, last_name, bio } = req.body;

    let avatar =
      typeof req.body.avatar === "string"
        ? JSON.parse(req.body.avatar || "{}")
        : req.body.avatar;

    let uploadedAvatarKey: string | null = null;

    try {
      const existing = await dynamo.send(
        new GetItemCommand({
          TableName: USERS_TABLE,
          Key: marshall({ user_id: userId }),
        })
      );

      if (!existing.Item) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentUser = unmarshall(existing.Item);
      const key = (ext: string) => `profile_images/${userId}.${ext}`;

      if (avatar) {
        const ext = avatar.key.split(".").pop()!;
        const destination = await copyItemImage(
          s3,
          { bucket: avatar.bucket, key: avatar.key },
          {
            bucket: process.env.EXPRESS_S3_APP_BUCKET!,
            key: key(ext),
          }
        );

        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.EXPRESS_S3_TEMP_BUCKET!,
            Key: avatar.key,
          })
        );

        if (currentUser.avatar?.key) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.EXPRESS_S3_APP_BUCKET!,
              Key: currentUser.avatar.key,
            })
          );
        }

        avatar = destination;
        uploadedAvatarKey = destination.key;
      }

      if (req.file) {
        const mimeType = req.file.mimetype;
        const ext = mimeExtension(mimeType);
        if (!ext) throw new Error("Unsupported avatar file type.");

        if (currentUser.avatar?.key) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.EXPRESS_S3_APP_BUCKET!,
              Key: currentUser.avatar.key,
            })
          );
        }

        avatar = await saveItemImage(s3, undefined, key(ext), req.file.buffer);
        uploadedAvatarKey = avatar.key;
      }

      const updateExpression: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      if (first_name !== undefined) {
        updateExpression.push("#fn = :fn");
        expressionAttributeNames["#fn"] = "first_name";
        expressionAttributeValues[":fn"] = first_name;
      }

      if (last_name !== undefined) {
        updateExpression.push("#ln = :ln");
        expressionAttributeNames["#ln"] = "last_name";
        expressionAttributeValues[":ln"] = last_name;
      }

      if (bio !== undefined) {
        updateExpression.push("#bio = :bio");
        expressionAttributeNames["#bio"] = "bio";
        expressionAttributeValues[":bio"] = bio;
      }

      if (avatar) {
        updateExpression.push("#avatar = :avatar");
        expressionAttributeNames["#avatar"] = "avatar";
        expressionAttributeValues[":avatar"] = avatar;
      }

      if (updateExpression.length > 0) {
        await dynamo.send(
          new UpdateItemCommand({
            TableName: USERS_TABLE,
            Key: marshall({ user_id: userId }),
            UpdateExpression: `SET ${updateExpression.join(", ")}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: marshall(expressionAttributeValues),
          })
        );
      }

      const updated = await dynamo.send(
        new GetItemCommand({
          TableName: USERS_TABLE,
          Key: marshall({ user_id: userId }),
        })
      );

      const user = unmarshall(updated.Item!);

      if (user.avatar) {
        user.avatar = await getSignedImage(s3, user.avatar);
      }

      res.status(200).json({ user });
    } catch (error: any) {
      console.error("Update profile error:", error);

      if (uploadedAvatarKey) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.EXPRESS_S3_APP_BUCKET!,
            Key: uploadedAvatarKey,
          })
        );
      }

      res.status(500).json({ error: error.message });
    }
  }
);

export const getUserProgress = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: ARTICLES_TABLE,
          IndexName: "UserProgressIndex",
          KeyConditionExpression: "user_id = :uid",
          ExpressionAttributeValues: marshall({ ":uid": userId }),
        })
      );

      const progress = result.Items?.map((item) => unmarshall(item)) || [];

      res.status(200).json({ progress });
    } catch (error: any) {
      console.error("Get user progress error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);
