import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/health": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      allow: ["./client", "./shared", "./config"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor code splitting strategy
          if (id.includes("node_modules")) {
            if (id.includes("react") && id.includes("react-dom|react-router")) {
              return "vendor-react";
            }
            if (id.includes("@radix-ui")) {
              return "vendor-ui";
            }
            if (id.includes("three") || id.includes("@react-three")) {
              return "vendor-graphics";
            }
            if (
              id.includes("@tanstack/react-query") ||
              id.includes("recharts")
            ) {
              return "vendor-data";
            }
            if (id.includes("react-hook-form") || id.includes("zod")) {
              return "vendor-form";
            }
            return "vendor-other";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@postd": path.resolve(__dirname, "./client/components/postd"),
      "@shared-components": path.resolve(__dirname, "./client/components/shared"),
      "@app": path.resolve(__dirname, "./client/app"),
    },
  },
});
