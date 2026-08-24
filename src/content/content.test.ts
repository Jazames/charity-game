import { describe, expect, it } from "vitest";
import opportunitiesJson from "../generated/opportunities.json";
import { opportunitySchema } from "./schema";

describe("compiled opportunity content", () => {
  const opportunities = opportunitiesJson.map((item) => opportunitySchema.parse(item));

  it("contains one beneficial and one harmful starter in every category", () => {
    for (const category of ["charity", "company", "real-estate"] as const) {
      const categoryItems = opportunities.filter((item) => item.category === category);
      expect(categoryItems.some((item) => item.rules.disposition === "beneficial" || item.rules.disposition === "speculative")).toBe(true);
      expect(categoryItems.some((item) => item.rules.disposition === "harmful")).toBe(true);
    }
  });

  it("uses globally unique opportunity IDs", () => {
    const ids = opportunities.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
