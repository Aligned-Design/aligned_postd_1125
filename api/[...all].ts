import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// ✅ FIX: Use proper types instead of any
import type { Express } from "express";

// Create the Express app once and cache it
let app: Express | null = null;
let createServerFn: (() => Express) | null = null;

async function getApp() {
  if (!app) {
    // Lazy load the server module to handle Vercel's build context
    if (!createServerFn) {
      // Try multiple import strategies for Vercel deployment
      // In Vercel, api/ is at root, so we need to go up one level to reach dist/
      const importPaths = [
        // Strategy 1: Built file in dist (production) - relative from api/
        () => import("../dist/server/vercel-server.mjs"),
        // Strategy 2: Built file with .js extension (some builds)
        () => import("../dist/server/vercel-server.js"),
        // Strategy 3: Source file (development or if dist not available)
        () => import("../server/vercel-server"),
        // Strategy 4: Alternative relative path
        () => import("./dist/server/vercel-server.mjs"),
      ];

      let lastError: Error | null = null;
      
      for (let i = 0; i < importPaths.length; i++) {
        const importPath = importPaths[i];
        try {
          console.log(`[Vercel] Attempting import strategy ${i + 1}/${importPaths.length}`);
          const serverModule = await importPath();
          // ✅ FIX: Type assertion for server module
          const moduleWithCreateServer = serverModule as { createServer?: () => Express };
          createServerFn = moduleWithCreateServer.createServer || undefined;
          if (createServerFn && typeof createServerFn === 'function') {
            console.log(`[Vercel] Successfully loaded server module using strategy ${i + 1}`);
            break;
          } else {
            console.warn(`[Vercel] Strategy ${i + 1} loaded module but createServer is not a function`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.warn(`[Vercel] Import strategy ${i + 1} failed:`, errorMsg);
          lastError = error instanceof Error ? error : new Error(String(error));
          // Continue to next import strategy
        }
      }

      if (!createServerFn) {
        const errorMessage = lastError 
          ? `Cannot load server module. Last error: ${lastError.message}`
          : "Cannot load server module: createServer function not found";
        console.error("[Vercel] Failed to import server module:", errorMessage);
        console.error("[Vercel] Tried import paths:", importPaths.map((_, i) => `Strategy ${i + 1}`).join(", "));
        throw new Error(errorMessage);
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

      // ✅ FIX: VercelRequest/VercelResponse are compatible with Express types
      // TypeScript will accept these as they share the same shape
      application(req, res, (err?: unknown) => {
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
