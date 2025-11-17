import request from "supertest";
import { createServer } from "../server";
import { generateTokenPair } from "../server/lib/jwt-auth";
import { Role } from "../server/middleware/rbac";

process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "service-key";

async function run() {
  const app = createServer();
  const token = generateTokenPair({
    userId: "smoke-user",
    email: "smoke@example.com",
    role: Role.SUPERADMIN,
    brandIds: ["brand-123"],
    tenantId: "tenant-1",
  }).accessToken;

  const auth = { Authorization: `Bearer ${token}` };

  const approvals = await request(app).get("/api/approvals/pending").set(auth);
  console.log("Approvals /pending:", approvals.status);

  const clientDashboard = await request(app)
    .get("/api/client-portal/dashboard")
    .set(auth);
  console.log("Client portal /dashboard:", clientDashboard.status);

  const adminOverview = await request(app)
    .get("/api/admin/overview")
    .set(auth);
  console.log("Admin /overview:", adminOverview.status);
}

run().catch((error) => {
  console.error("Smoke test failed:", error);
  process.exitCode = 1;
});

