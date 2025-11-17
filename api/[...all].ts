import "dotenv/config";
import { createServer } from "../server/index";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Create the Express app once and cache it
let app: any = null;

function getApp() {
  if (!app) {
    app = createServer();
  }
  return app;
}

// Export as a serverless handler
export default async (req: VercelRequest, res: VercelResponse) => {
  const application = getApp();

  // Handle the request through the Express app
  // Express expects the app to be called as a middleware function
  return new Promise((resolve) => {
    application(req as any, res as any, (err?: any) => {
      if (err) {
        console.error("Error in request handler:", err);
        res.status(500).json({ error: "Internal server error" });
      }
      resolve(null);
    });
  });
};
