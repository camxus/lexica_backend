import { fetchFeeds } from "./fetchFeeds";
import { normalize } from "./normalize";
import { clusterTopics } from "./clusterTopics";
import { storeTopic } from "./store";
import { RESEARCH_QUEUE_URL, sqs } from "../lib/aws";
import { SendMessageCommand } from "@aws-sdk/client-sqs";


export async function handler() {
  const raw = await fetchFeeds();
  const clean = normalize(raw);

  const topics = await clusterTopics(clean);
  const relevant = topics.filter((t) => t.relevancy >= 60);

  for (const topic of relevant) {
    const { slug, date } = await storeTopic(topic);

    // ✅ send to SQS
    const cmd = new SendMessageCommand({
      QueueUrl: RESEARCH_QUEUE_URL,
      MessageBody: JSON.stringify({ topic, slug, date }),
    });
    await sqs.send(cmd);
  }

  return { topics: relevant.length };
}
