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

async function listMetaFiles() {
  const entries = await fs.readdir(META_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".meta.json"))
    .map((e) => path.join(META_DIR, e.name));
}

describe("meta.json schema validation", () => {
  it("all meta files should match the schema", async () => {
    const files = await listMetaFiles();
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const raw = await fs.readFile(file, "utf-8");
      let data;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        throw new Error(`Invalid JSON in ${file}: ${err.message}`);
      }

      const result = metaSchema.safeParse(data);
      if (!result.success) {
        throw new Error(
          `Schema validation failed for ${file}: ${JSON.stringify(result.error.format(), null, 2)}`,
        );
      }
    }
  });
});
