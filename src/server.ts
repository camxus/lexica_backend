import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import serverless from "serverless-http";
import multipart from "lambda-multipart-parser";
import { APIGatewayProxyEvent } from "aws-lambda";

import { createCorsConfig } from "./utils/cors";

/* Routes */
import authRoutes from "./routes/authRoutes";
import usersRoutes from "./routes/usersRoutes";
import topicsRoutes from "./routes/topicsRoutes";
import researchRoutes from "./routes/researchRoutes";
import notesRoutes from "./routes/notesRoutes";
import fieldsRoutes from "./routes/fieldsRoutes";
import rssRoutes from "./routes/rssRoutes";
import aiRoutes from "./routes/aiRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

/* =========================
   Middleware
========================= */

app.use(cors(createCorsConfig()));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* =========================
   Routes
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

app.use("/api/topics", topicsRoutes);        // daily topics
app.use("/api/research", researchRoutes);    // AI-generated research
app.use("/api/notes", notesRoutes);          // user notes
app.use("/api/fields", fieldsRoutes);        // learning fields
app.use("/api/rss", rssRoutes);               // RSS ingestion / testing
app.use("/api/ai", aiRoutes);                 // internal AI utilities

/* =========================
   Health check
========================= */

app.get("/health", (_, res) => {
  res.status(200).json({
    status: "ok",
    service: "lexica-backend",
    timestamp: new Date().toISOString()
  });
});

/* =========================
   Local dev
========================= */

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Lexica API running on port ${port}`);
  });
}

/* =========================
   Lambda handler
========================= */

export const handler = serverless(app, {
  request: async (req: Request, event: APIGatewayProxyEvent) => {
    let body: any = event.body;

    if (body) {
      // Decode base64
      if (event.isBase64Encoded) {
        body = Buffer.from(body, "base64");
      } else {
        body = Buffer.from(body, "utf8");
      }

      // JSON payload
      if (event.headers["content-type"]?.includes("application/json")) {
        try {
          body = JSON.parse(body.toString());
        } catch {
          /* ignore */
        }
      }

      // multipart/form-data (future-proof: uploads, imports)
      if (event.headers["content-type"]?.includes("multipart/form-data")) {
        try {
          const originalBody = event.body;
          (event as any).body = body;

          const parsed = await multipart.parse(event);
          body = parsed;

          (event as any).body = originalBody;
        } catch (err) {
          console.error("Multipart parse error:", err);
        }
      }
    }

    (req as any).body = body;
  }
});
