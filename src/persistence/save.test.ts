import { describe, expect, it } from "vitest";
import { initialGameState } from "../game/state";
import { parseSave, serializeSave } from "./save";

describe("portable saves", () => {
  it("round-trips a versioned game state", () => {
    const game = { ...initialGameState(), day: 4, draft: { "company.example": 5_000_000 } };
    expect(parseSave(serializeSave(game, 100_000_000_000), 100_000_000_000)).toEqual(game);
  });

  it("rejects a save for a different campaign endowment", () => {
    const serialized = serializeSave(initialGameState(), 10_000_000);
    expect(() => parseSave(serialized, 100_000_000_000)).toThrow("different endowment");
  });
});
