// Vercel-specific server entry point
// This file is built separately and exports createServer for Vercel functions
// Import from index-v2 which is the current server implementation
import { createServer } from "./index-v2";

export { createServer };

