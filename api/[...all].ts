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
  try {
    const application = getApp();

    // Handle the request through the Express app
    // Express expects the app to be called as a middleware function
    return new Promise((resolve, reject) => {
      // Set timeout to prevent hanging (Vercel has 60s maxDuration)
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          console.error("[Vercel] Request timeout after 55s");
          res.status(504).json({ 
            error: "Request timeout",
            message: "The request took too long to process"
          });
        }
        resolve(null);
      }, 55000); // 55 seconds (5s buffer before Vercel's 60s limit)

      application(req as any, res as any, (err?: any) => {
        clearTimeout(timeout);
        if (err) {
          console.error("[Vercel] Error in request handler:", err);
          console.error("[Vercel] Error stack:", err?.stack);
          if (!res.headersSent) {
            res.status(500).json({ 
              error: "Internal server error",
              message: err?.message || "An unexpected error occurred",
              ...(process.env.NODE_ENV === "development" && { stack: err?.stack })
            });
          }
        }
        resolve(null);
      });
    });
  } catch (error) {
    console.error("[Vercel] Fatal error in serverless handler:", error);
    console.error("[Vercel] Error stack:", error instanceof Error ? error.stack : "No stack");
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "FUNCTION_INVOCATION_FAILED",
        message: error instanceof Error ? error.message : "Function invocation failed",
        ...(process.env.NODE_ENV === "development" && { 
          stack: error instanceof Error ? error.stack : undefined 
        })
      });
    }
  }
};
