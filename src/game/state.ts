export interface Metrics {
  publicStanding: number;
  worldWellbeing: number;
  wastedDollars: number;
}

export interface ScheduledOutcome {
  id: string;
  opportunityId: string;
  opportunityName: string;
  dueDay: number;
  allocationDollars: number;
  effects: Record<string, number>;
  memoSubject?: string;
  memoBodyMarkdown?: string;
  newsHeadline?: string;
  newsBodyMarkdown?: string;
}

export interface GameState {
  day: number;
  committed: Record<string, number>;
  draft: Record<string, number>;
  pending: ScheduledOutcome[];
  resolved: ScheduledOutcome[];
  metrics: Metrics;
  status: "active" | "complete" | "fired";
  finalOutcomeCount: number;
}

export function initialGameState(): GameState {
  return {
    day: 1,
    committed: {},
    draft: {},
    pending: [],
    resolved: [],
    metrics: { publicStanding: 0, worldWellbeing: 0, wastedDollars: 0 },
    status: "active",
    finalOutcomeCount: 0
  };
}

export function sumLedger(ledger: Record<string, number>): number {
  return Object.values(ledger).reduce((total, amount) => total + amount, 0);
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}
