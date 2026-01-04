import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth";
import { openai } from "../lib/ai";

export const generateSummary = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { text, maxLength = 150 } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates concise summaries.",
          },
          {
            role: "user",
            content: `Summarize the following text in approximately ${maxLength} characters:\n\n${text}`,
          },
        ],
      });

      const summary = response.choices[0].message.content;

      res.status(200).json({ summary });
    } catch (error: any) {
      console.error("Generate summary error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const generateQuiz = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { content, level = 1, questionCount = 5 } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an educational assistant that creates quiz questions.",
          },
          {
            role: "user",
            content: `Create ${questionCount} multiple-choice quiz questions based on this content at difficulty level ${level} (1-5).

Content:
${content}

Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct"
    }
  ]
}`,
          },
        ],
      });

      const quiz = JSON.parse(response.choices[0].message.content || "{}");

      res.status(200).json({ quiz });
    } catch (error: any) {
      console.error("Generate quiz error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);
