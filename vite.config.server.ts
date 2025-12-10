import { defineConfig } from "vite";
import path from "path";

// Server build configuration
// ✅ Uses v2 entry point (server/node-build-v2.ts) which imports from index-v2.ts
// This is the production server build that `pnpm start` uses
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/node-build-v2.ts"),
      name: "server",
      fileName: "node-build-v2",
      formats: ["es"],
    },
    outDir: "dist/server",
    emptyOutDir: false, // Preserve static files from client build
    target: "node24",
    ssr: true,
    rollupOptions: {
      external: [
        // Node.js built-ins
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",
        // External dependencies that should not be bundled
        "express",
        "cors",
        "@anthropic-ai/sdk",
        "@sendgrid/mail",
        "@supabase/supabase-js",
        "multer",
        "nodemailer",
        "openai",
        "sharp",
        "socket.io",
        "uuid",
        "zod",
        "dotenv",
      ],
      output: {
        format: "es",
        entryFileNames: "[name].mjs",
      },
    },
    minify: false, // Keep readable for debugging
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./server"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
