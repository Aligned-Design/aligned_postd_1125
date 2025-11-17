import fetch from "node-fetch";

const BASE_URL = "http://localhost:8080";

const routes = [
  { path: "/", label: "Dashboard (Home)" },
  { path: "/dashboard", label: "Dashboard (alias)" },
  { path: "/calendar", label: "Calendar" },
  { path: "/content-queue", label: "Content Queue (actual)" },
  { path: "/queue", label: "Queue (alias)" },
  { path: "/campaigns", label: "Campaigns" },
  { path: "/analytics", label: "Analytics" },
  { path: "/paid-ads", label: "Paid Ads (actual)" },
  { path: "/ads", label: "Ads (alias)" },
  { path: "/reporting", label: "Reporting (actual)" },
  { path: "/reports", label: "Reports (alias)" },
  { path: "/library", label: "Media Library" },
  { path: "/events", label: "Events" },
  { path: "/reviews", label: "Reviews" },
  { path: "/linked-accounts", label: "Linked Accounts" },
  { path: "/settings", label: "Settings" },
  { path: "/onboarding", label: "Onboarding" },
  { path: "/login", label: "Login (alias to onboarding)" },
  { path: "/signup", label: "Signup (alias to onboarding)" },
  { path: "/not-found-test", label: "404 Test" },
];

const results = [];

console.log("Testing routes...\n");

for (const route of routes) {
  try {
    const response = await fetch(`${BASE_URL}${route.path}`, {
      method: "GET",
      headers: { Accept: "text/html" },
    });
    const html = await response.text();
    const hasContent = html.length > 100;
    const status = response.ok ? response.status : response.status;

    results.push({
      path: route.path,
      label: route.label,
      status: status,
      hasContent: hasContent,
      ok: response.ok,
      length: html.length,
    });

    console.log(
      `${status === 200 ? "✓" : "✗"} ${route.path.padEnd(25)} ${route.label}`,
    );
  } catch (err) {
    results.push({
      path: route.path,
      label: route.label,
      status: "error",
      error: err.message,
    });
    console.log(`✗ ${route.path.padEnd(25)} ERROR: ${err.message}`);
  }
}

console.log("\n\nDetailed Results:");
console.log(JSON.stringify(results, null, 2));

const successCount = results.filter((r) => r.ok || r.status === 200).length;
const totalCount = results.length;
console.log(`\n\nSummary: ${successCount}/${totalCount} routes successful`);
