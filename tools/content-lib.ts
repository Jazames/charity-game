import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parseDocument } from "yaml";
import { opportunitySchema, type Opportunity } from "../src/content/schema";

export interface LoadedOpportunity {
  file: string;
  opportunity: Opportunity;
}

async function findFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return findFiles(entryPath);
      return entry.name.endsWith(".opportunity.yaml") ? [entryPath] : [];
    })
  );
  return files.flat().sort();
}

export async function loadOpportunities(root = process.cwd()): Promise<LoadedOpportunity[]> {
  const contentDirectory = path.join(root, "content", "opportunities");
  const files = await findFiles(contentDirectory);
  const loaded: LoadedOpportunity[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const relativeFile = path.relative(root, file).replaceAll("\\", "/");
    const source = await readFile(file, "utf8");
    const document = parseDocument(source, {
      prettyErrors: true,
      version: "1.2"
    });

    if (document.errors.length > 0) {
      errors.push(...document.errors.map((error) => `${relativeFile}: ${error.message}`));
      continue;
    }

    const result = opportunitySchema.safeParse(document.toJS({ maxAliasCount: 0 }));
    if (!result.success) {
      errors.push(
        ...result.error.issues.map((issue) => {
          const field = issue.path.length > 0 ? issue.path.join(".") : "root";
          return `${relativeFile}: ${field}: ${issue.message}`;
        })
      );
      continue;
    }

    loaded.push({ file: relativeFile, opportunity: result.data });
  }

  const seen = new Map<string, string>();
  for (const item of loaded) {
    const previous = seen.get(item.opportunity.id);
    if (previous) {
      errors.push(`${item.file}: duplicate opportunity ID also used in ${previous}`);
    } else {
      seen.set(item.opportunity.id, item.file);
    }
  }

  if (files.length === 0) errors.push("No .opportunity.yaml files were found.");
  if (errors.length > 0) throw new Error(errors.join("\n"));
  return loaded;
}
