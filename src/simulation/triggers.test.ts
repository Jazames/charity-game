import { describe, expect, it } from "vitest";
import { evaluateTrigger } from "./triggers";

const context = {
  allocationDollars: 5_000_000_000,
  totalAllocationDollars: 5_000_000_000,
  day: 10,
  successConditionsMet: true
};

describe("evaluateTrigger", () => {
  it("evaluates compound conditions deterministically", () => {
    expect(
      evaluateTrigger(
        {
          all: [
            { minimum_total_allocation_dollars: 4_000_000_000 },
            { committed_by_day: 12 }
          ]
        },
        context
      )
    ).toBe(true);
  });

  it("supports negative and alternative conditions", () => {
    expect(
      evaluateTrigger(
        {
          all: [
            { not: { allocation_above_dollars: 6_000_000_000 } },
            {
              any: [
                { success_conditions_met: false },
                { success_conditions_met: true }
              ]
            }
          ]
        },
        context
      )
    ).toBe(true);
  });
});
