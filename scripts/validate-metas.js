import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

const META_DIR = path.resolve(process.cwd(), "src", "pages");

const metaSchema = z.object({
  title: z.string().min(1),
  route: z.string().min(1),
  layout: z.string().min(1),
  theme: z.string().min(1),
  primaryAccent: z.string().min(1),
  purpose: z.string().min(1),
  visualNotes: z.string().optional(),
  _changelog: z.string().optional(),
});

async function findMetaFiles() {
  const entries = await fs.readdir(META_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".meta.json"))
    .map((e) => path.join(META_DIR, e.name));
}

async function validateFile(filePath) {
  const raw = await fs.readFile(filePath, "utf-8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return { ok: false, filePath, error: `Invalid JSON: ${err.message}` };
  }

  const result = metaSchema.safeParse(data);
  if (!result.success) {
    return { ok: false, filePath, error: result.error.format() };
  }
  return { ok: true, filePath };
}

async function main() {
  try {
    const files = await findMetaFiles();
    if (files.length === 0) {
      console.warn(
        "No *.meta.json files found under src/pages/. Nothing to validate.",
      );
      return;
    }

    const results = await Promise.all(files.map((f) => validateFile(f)));
    const failures = results.filter((r) => !r.ok);
    if (failures.length > 0) {
      console.error(`\nMeta validation failed for ${failures.length} file(s):`);
      failures.forEach((f) => {
        console.error("\n--- " + f.filePath + "\n", f.error);
      });
      process.exitCode = 1;
      return;
    }

    console.log(`All ${results.length} meta files validated successfully.`);
  } catch (err) {
    console.error("Error validating meta files:", err);
    process.exitCode = 2;
  }
}

if (require.main === module) {
  main();
}
