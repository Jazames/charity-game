import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadOpportunities } from "./content-lib";

const root = process.cwd();
const loaded = await loadOpportunities(root);
const outputDirectory = path.join(root, "src", "generated");
const outputFile = path.join(outputDirectory, "opportunities.json");

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  outputFile,
  `${JSON.stringify(loaded.map((item) => item.opportunity), null, 2)}\n`,
  "utf8"
);
process.stdout.write(`Built ${loaded.length} opportunities into src/generated/opportunities.json.\n`);
