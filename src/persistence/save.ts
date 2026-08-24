import { z } from "zod";
import type { GameState } from "../game/state";

const SAVE_FORMAT = "stewardship-office-save";
const SAVE_VERSION = 1;
const COOKIE_CHUNK_SIZE = 3_000;
const COOKIE_MAX_CHUNKS = 64;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const scheduledOutcomeSchema = z.object({
  id: z.string().min(1),
  opportunityId: z.string().min(1),
  opportunityName: z.string().min(1),
  dueDay: z.number().int().positive(),
  allocationDollars: z.number().int().nonnegative(),
  effects: z.record(z.string(), z.number()),
  memoSubject: z.string().optional(),
  memoBodyMarkdown: z.string().optional(),
  newsHeadline: z.string().optional(),
  newsBodyMarkdown: z.string().optional()
});

export const gameStateSchema = z.object({
  day: z.number().int().positive(),
  committed: z.record(z.string(), z.number().int().nonnegative()),
  draft: z.record(z.string(), z.number().int().nonnegative()),
  pending: z.array(scheduledOutcomeSchema),
  resolved: z.array(scheduledOutcomeSchema),
  metrics: z.object({
    publicStanding: z.number(),
    worldWellbeing: z.number(),
    wastedDollars: z.number().nonnegative()
  }),
  status: z.enum(["active", "complete", "fired"]),
  finalOutcomeCount: z.number().int().nonnegative()
});

const exportedSaveSchema = z.object({
  format: z.literal(SAVE_FORMAT),
  version: z.literal(SAVE_VERSION),
  endowmentDollars: z.number().int().positive(),
  exportedAt: z.string(),
  game: gameStateSchema
});

export function cookiePrefix(endowmentDollars: number) {
  return `stewardship-save-v${SAVE_VERSION}-${endowmentDollars}`;
}

export function serializeSave(game: GameState, endowmentDollars: number) {
  return JSON.stringify({
    format: SAVE_FORMAT,
    version: SAVE_VERSION,
    endowmentDollars,
    exportedAt: new Date().toISOString(),
    game
  }, null, 2);
}

export function parseSave(serialized: string, expectedEndowmentDollars: number): GameState {
  const parsed = exportedSaveSchema.parse(JSON.parse(serialized));
  if (parsed.endowmentDollars !== expectedEndowmentDollars) {
    throw new Error("This save belongs to a campaign with a different endowment.");
  }
  return parsed.game;
}

function cookieAttributes(maxAge: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  return `; Path=/; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function cookiesByName() {
  return new Map(
    document.cookie
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        return separator < 0 ? [part, ""] : [part.slice(0, separator), part.slice(separator + 1)];
      })
  );
}

export function clearCookieSave(endowmentDollars: number) {
  const prefix = cookiePrefix(endowmentDollars);
  cookiesByName().forEach((_value, name) => {
    if (name === `${prefix}-count` || name.startsWith(`${prefix}-chunk-`)) {
      document.cookie = `${name}=${cookieAttributes(0)}`;
    }
  });
}

export function writeCookieSave(game: GameState, endowmentDollars: number) {
  const prefix = cookiePrefix(endowmentDollars);
  const encoded = encodeURIComponent(serializeSave(game, endowmentDollars));
  const chunks = Array.from(
    { length: Math.ceil(encoded.length / COOKIE_CHUNK_SIZE) },
    (_unused, index) => encoded.slice(index * COOKIE_CHUNK_SIZE, (index + 1) * COOKIE_CHUNK_SIZE)
  );
  if (chunks.length > COOKIE_MAX_CHUNKS) throw new Error("The campaign save is too large for cookie storage.");

  clearCookieSave(endowmentDollars);
  chunks.forEach((chunk, index) => {
    document.cookie = `${prefix}-chunk-${index}=${chunk}${cookieAttributes(COOKIE_MAX_AGE_SECONDS)}`;
  });
  document.cookie = `${prefix}-count=${chunks.length}${cookieAttributes(COOKIE_MAX_AGE_SECONDS)}`;
}

export function readCookieSave(endowmentDollars: number): GameState | null {
  try {
    const prefix = cookiePrefix(endowmentDollars);
    const cookies = cookiesByName();
    const count = Number(cookies.get(`${prefix}-count`));
    if (!Number.isInteger(count) || count < 1 || count > COOKIE_MAX_CHUNKS) return null;
    const chunks = Array.from({ length: count }, (_unused, index) => cookies.get(`${prefix}-chunk-${index}`));
    if (chunks.some((chunk) => chunk === undefined)) return null;
    return parseSave(decodeURIComponent(chunks.join("")), endowmentDollars);
  } catch {
    return null;
  }
}
