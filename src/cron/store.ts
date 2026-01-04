

import slugify from "slugify";
import { ARTICLES_TABLE, BUCKET, dynamo, s3, TOPICS_TABLE } from "../lib/aws";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { PutObjectCommand } from "@aws-sdk/client-s3";


export async function storeTopic(topic: any) {
  const slug = slugify(topic.topic, { lower: true });
  const date = new Date().toISOString().slice(0, 10);

  await dynamo.send(
    new PutItemCommand({
      TableName: TOPICS_TABLE,
      Item: {
        pk: { S: `TOPIC#${date}` },
        sk: { S: `TOPIC#${slug}` },
        topic: { S: topic.topic },
        slug: { S: slug },
        relevancy: { N: String(topic.relevancy) },
        date: { S: date },
        articleCount: { N: String(topic.articles.length) },
        status: { S: "pending" },
      },
    })
  );

  return { slug, date };
}

export async function storeResearch(
  slug: string,
  date: string,
  level: number,
  content: string,
  references: any[]
) {
  const s3Key = `${date.replace(/-/g, "/")}/${slug}/level-${level}.md`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: content,
      ContentType: "text/markdown",
    })
  );

  await dynamo.send(
    new PutItemCommand({
      TableName: ARTICLES_TABLE,
      Item: {
        pk: { S: `TOPIC#${slug}` },
        sk: { S: `LEVEL#${level}` },
        level: { N: String(level) },
        s3Key: { S: s3Key },
        references: { S: JSON.stringify(references) },
      },
    })
  );
}
