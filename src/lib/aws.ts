import { SQSClient } from "@aws-sdk/client-sqs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";

export const dynamo = new DynamoDBClient({
    region: process.env.AWS_REGION!,
});

export const s3 = new S3Client({
    region: process.env.AWS_REGION!,
});

export const sqs = new SQSClient({
    region: process.env.AWS_REGION!
});

export const RESEARCH_QUEUE_URL = process.env.RESEARCH_QUEUE_URL!;


export const TOPICS_TABLE = "LexicaTopics";
export const ARTICLES_TABLE = "LexicaArticles";
export const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || "Users";

export const BUCKET = "lexica-articles";