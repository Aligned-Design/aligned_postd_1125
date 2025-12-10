import { defineConfig } from "vite";
import path from "path";

// Vercel-specific server build - bundles server code and exports createServer
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/vercel-server.ts"),
      name: "vercel-server",
      fileName: "vercel-server",
      formats: ["es"],
    },
    outDir: "dist/server",
    emptyOutDir: false, // Preserve node-build-v2.mjs from the server build
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
    minify: false,
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

