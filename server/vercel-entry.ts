// Vercel-specific entry point that exports createServer
// This file is used by api/[...all].ts to import the server
import { createServer } from "./index";

export { createServer };

