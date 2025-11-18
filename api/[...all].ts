import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Create the Express app once and cache it
let app: any = null;
let createServerFn: (() => any) | null = null;

async function getApp() {
  if (!app) {
    // Lazy load the server module to handle Vercel's build context
    if (!createServerFn) {
      // Vercel compiles TypeScript in api/ directory, so we can import server/index directly
      // The server code will be compiled by Vercel's TypeScript compiler
      try {
        const serverModule = await import("../server/index");
        createServerFn = serverModule.createServer;
        if (!createServerFn) {
          throw new Error("createServer not exported from server/index");
        }
      } catch (importError) {
        console.error("[Vercel] Failed to import server/index:", importError);
        console.error("[Vercel] Error details:", {
          message: importError instanceof Error ? importError.message : String(importError),
          stack: importError instanceof Error ? importError.stack : undefined,
          code: (importError as any)?.code,
        });
        throw new Error(`Cannot load server module: ${importError instanceof Error ? importError.message : String(importError)}`);
      }
    }
    if (!createServerFn) {
      throw new Error("createServer function is null");
    }
    app = createServerFn();
  }
  return app;
}

// Export as a serverless handler
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const application = await getApp();

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
