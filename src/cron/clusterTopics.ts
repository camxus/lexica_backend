import { openai } from "../lib/ai";
import { TopicClusterSchema } from "../lib/schemas";
import { Article, Topic } from "../lib/types";

export async function clusterTopics(
  articles: Article[]
): Promise<Topic[]> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an expert research analyst." },
      {
        role: "user",
        content: `
Cluster these articles into topics with relevancy scores.
Return ONLY valid JSON.

Articles:
${JSON.stringify(articles)}
`,
      },
    ],
  });

  const parsed = JSON.parse(res.choices[0].message.content!);
  return TopicClusterSchema.parse(parsed);
}
