import { openai } from "../lib/ai";
import { ResearchSchema } from "../lib/schemas";
import { Topic } from "../lib/types";

export async function generateResearch(topic: Topic) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an academic writer and educator.",
      },
      {
        role: "user",
        content: `
Write a research article on "${topic.topic}"

Use ONLY these sources:
${JSON.stringify(topic.articles)}

Create 5 levels (very simple → expert).
Cite sources inline [1], [2].

Return JSON only.
`,
      },
    ],
  });

  const parsed = JSON.parse(res.choices[0].message.content!);
  return ResearchSchema.parse(parsed);
}
