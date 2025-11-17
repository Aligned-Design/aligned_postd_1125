import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:8080"],
    credentials: true,
  }),
);

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API ping
app.get("/api/ping", (_req, res) => {
  res.json({ message: "pong" });
});

// Milestones - mock data
app.get("/api/milestones", async (_req, res) => {
  res.json([]);
});

// Agents review queue - mock data
app.get("/api/agents/review/queue/:brandId", async (req, res) => {
  res.json({ queue: [] });
});

// Catch all
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
