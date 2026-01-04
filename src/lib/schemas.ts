import { z } from "zod";

export const TopicClusterSchema = z.array(
  z.object({
    topic: z.string(),
    relevancy: z.number().min(0).max(100),
    articles: z.array(
      z.object({
        title: z.string(),
        link: z.string().url(),
      })
    ),
  })
);

export const ResearchSchema = z.object({
  level_1: z.string(),
  level_2: z.string(),
  level_3: z.string(),
  level_4: z.string(),
  level_5: z.string(),
  references: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      url: z.string().url(),
    })
  ),
});
