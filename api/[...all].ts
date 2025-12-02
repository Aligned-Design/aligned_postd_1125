import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
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
          // @ts-expect-error: Dynamic import paths may not resolve at type-check time
          const serverModule = await importPath();
          // Type assertion for server module - runtime will have createServer
          const moduleWithCreateServer = serverModule as { createServer?: () => Express; default?: { createServer?: () => Express } };
          createServerFn = moduleWithCreateServer.createServer || moduleWithCreateServer.default?.createServer || undefined;
          if (createServerFn && typeof createServerFn === 'function') {
            console.log(`[Vercel] Successfully loaded server module using strategy ${i + 1}`);
            break;
          } else {
            console.warn(`[Vercel] Strategy ${i + 1} loaded module but createServer is not a function`);
          }
        } catch (error) {
          const err = error as unknown;
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.warn(`[Vercel] Import strategy ${i + 1} failed:`, errorMsg);
          lastError = err instanceof Error ? err : new Error(String(err));
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
    return new Promise<void>((resolve) => {
      // Set timeout to prevent hanging (Vercel has 60s maxDuration)
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          console.error("[Vercel] Request timeout after 55s");
          res.status(504).json({ 
            error: "Request timeout",
            message: "The request took too long to process"
          });
        }
        resolve();
      }, 55000); // 55 seconds (5s buffer before Vercel's 60s limit)

      // Cast Express app to handle VercelRequest/VercelResponse compatibility
      // Runtime behavior is correct, types just need to be relaxed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Express/Vercel type compatibility
      (application as any)(req as any, res as any, (err?: unknown) => {
        clearTimeout(timeout);
        if (err) {
          const error = err as unknown;
          const errorObj = error instanceof Error ? error : { message: String(error), stack: undefined };
          console.error("[Vercel] Error in request handler:", errorObj);
          console.error("[Vercel] Error stack:", errorObj.stack);
          if (!res.headersSent) {
            res.status(500).json({ 
              error: "Internal server error",
              message: errorObj.message || "An unexpected error occurred",
              ...(process.env.NODE_ENV === "development" && { stack: errorObj.stack })
            });
          }
        }
        resolve();
      });
    });
  } catch (error) {
    const err = error as unknown;
    const errorObj = err instanceof Error ? err : { message: String(err), stack: undefined };
    console.error("[Vercel] Fatal error in serverless handler:", errorObj);
    console.error("[Vercel] Error stack:", errorObj.stack || "No stack");
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "FUNCTION_INVOCATION_FAILED",
        message: errorObj.message || "Function invocation failed",
        ...(process.env.NODE_ENV === "development" && { 
          stack: errorObj.stack 
        })
      });
    }
  }
};
