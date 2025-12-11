/**
 * @deprecated Legacy production server build entry point.
 * 
 * ⚠️ DO NOT USE THIS FILE FOR NEW DEVELOPMENT
 * 
 * Use `server/node-build-v2.ts` instead, which uses the current server implementation.
 * 
 * This file is kept for backward compatibility only.
 * 
 * @see server/node-build-v2.ts - Current production build entry
 * @see server/index-v2.ts - Current server implementation
 */

import "dotenv/config";
import path from "path";
// @deprecated - Use node-build-v2.ts for new deployments
// This file is kept for backward compatibility with existing deployment scripts
import { createServer } from "./index";
import * as express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Serve static files
app.use(express.static(distPath));

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
