// scripts/analyze-vercel-logs.ts
//
// Usage:
//   npx ts-node scripts/analyze-vercel-logs.ts ./logs_result.csv

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

type LogRow = {
  TimeUTC: string;
  timestampInMs: string;
  requestPath: string;
  requestMethod: string;
  responseStatusCode: string;
  durationMs: string;
};

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: npx ts-node scripts/analyze-vercel-logs.ts <csv-file>");
  process.exit(1);
}

const content = fs.readFileSync(path.resolve(filePath), "utf8");
const records = parse(content, {
  columns: true,
  skip_empty_lines: true,
}) as LogRow[];

console.log(`Total rows: ${records.length}`);

const statusCounts = new Map<string, number>();
const pathCounts = new Map<string, number>();
const dupeCounts = new Map<string, number>();

for (const row of records) {
  const status = row.responseStatusCode || "UNKNOWN";
  statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);

  const key = row.requestPath;
  pathCounts.set(key, (pathCounts.get(key) ?? 0) + 1);

  const dupeKey = `${row.timestampInMs}::${row.requestPath}::${row.requestMethod}`;
  dupeCounts.set(dupeKey, (dupeCounts.get(dupeKey) ?? 0) + 1);
}

console.log("\nStatus code distribution:");
for (const [status, count] of [...statusCounts.entries()].sort(
  (a, b) => Number(a[0]) - Number(b[0])
)) {
  console.log(`  ${status}: ${count}`);
}

console.log("\nTop paths:");
for (const [p, count] of [...pathCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`  ${count.toString().padStart(4, " ")}  ${p}`);
}

console.log("\nPotential duplicate/burst calls (same timestamp + path + method):");
for (const [key, count] of [...dupeCounts.entries()].sort((a, b) => b[1] - a[1])) {
  if (count <= 1) continue;
  const [ts, pathKey, method] = key.split("::");
  console.log(`  x${count}  ${method} ${pathKey} at ${ts}`);
}

