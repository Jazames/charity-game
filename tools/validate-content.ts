import { loadOpportunities } from "./content-lib";

try {
  const opportunities = await loadOpportunities();
  const counts = opportunities.reduce<Record<string, number>>((result, item) => {
    result[item.opportunity.category] = (result[item.opportunity.category] ?? 0) + 1;
    return result;
  }, {});
  process.stdout.write(
    `Validated ${opportunities.length} opportunities (${Object.entries(counts)
      .map(([category, count]) => `${count} ${category}`)
      .join(", ")}).\n`
  );
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
