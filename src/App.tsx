import { useCallback, useEffect, useState } from "react";
import opportunitiesJson from "./generated/opportunities.json";
import { opportunitySchema } from "./content/schema";
import { Desktop } from "./desktop/Desktop";
import { DayTransition, type DayTransitionPhase } from "./desktop/DayTransition";
import { IntroSequence } from "./desktop/IntroSequence";
import {
  formatMoney,
  initialGameState,
  sumLedger,
  type GameState,
  type Metrics,
  type ScheduledOutcome
} from "./game/state";
import {
  clearCookieSave,
  parseSave,
  readCookieSave,
  serializeSave,
  writeCookieSave
} from "./persistence/save";
import { GameMenu } from "./shell/GameMenu";
import { evaluateTrigger } from "./simulation/triggers";

const FULL_ENDOWMENT_DOLLARS = 100_000_000_000;
const FIRING_THRESHOLD = -10;
const opportunities = opportunitiesJson.map((item) => opportunitySchema.parse(item));

interface DayTransitionState {
  day: number;
  phase: DayTransitionPhase;
}

function getEndowmentDollars(): number {
  if (import.meta.env.MODE !== "e2e") return FULL_ENDOWMENT_DOLLARS;
  const requested = Number(new URLSearchParams(window.location.search).get("testEndowment"));
  return Number.isSafeInteger(requested) && requested > 0
    ? requested
    : FULL_ENDOWMENT_DOLLARS;
}

function applyOutcomes(metrics: Metrics, outcomes: ScheduledOutcome[]): Metrics {
  return outcomes.reduce<Metrics>((current, outcome) => {
    const worldChange = outcome.effects.world_wellbeing ?? 0;
    const directPublicChange = outcome.effects.pr ?? 0;
    const visibleHarmPenalty = worldChange < 0 ? Math.floor(worldChange / 2) : 0;
    const fraudLoss = (outcome.effects.fraud_loss_fraction ?? 0) * outcome.allocationDollars;
    const holdingRatio = outcome.effects.holding_value_ratio;
    const holdingLoss =
      holdingRatio !== undefined && holdingRatio < 1
        ? (1 - holdingRatio) * outcome.allocationDollars
        : 0;

    return {
      publicStanding: current.publicStanding + directPublicChange + visibleHarmPenalty,
      worldWellbeing: current.worldWellbeing + worldChange,
      wastedDollars: current.wastedDollars + fraudLoss + holdingLoss
    };
  }, metrics);
}

export default function App() {
  const endowmentDollars = getEndowmentDollars();
  const introKey = "stewardship-office-intro-seen-v1";
  const [game, setGame] = useState<GameState>(() => readCookieSave(endowmentDollars) ?? initialGameState());
  const [notice, setNotice] = useState("");
  const [introVisible, setIntroVisible] = useState(() => localStorage.getItem(introKey) !== "true");
  const [dayTransition, setDayTransition] = useState<DayTransitionState | null>(null);
  const committedTotal = sumLedger(game.committed);
  const draftTotal = sumLedger(game.draft);
  const remaining = endowmentDollars - committedTotal - draftTotal;

  useEffect(() => {
    try {
      writeCookieSave(game, endowmentDollars);
    } catch {
      setNotice("Automatic cookie save failed. Export a save before leaving this page.");
    }
  }, [endowmentDollars, game]);

  useEffect(() => {
    if (!dayTransition) return;
    const nextPhase: Record<DayTransitionPhase, { delay: number; phase: DayTransitionPhase | null }> = {
      "logging-off": { delay: 500, phase: "blackout" },
      blackout: { delay: 500, phase: "day-card" },
      "day-card": { delay: 700, phase: "desktop-in" },
      "desktop-in": { delay: 480, phase: null }
    };
    const next = nextPhase[dayTransition.phase];
    const timeout = window.setTimeout(() => {
      setDayTransition(next.phase ? { ...dayTransition, phase: next.phase } : null);
    }, next.delay);
    return () => window.clearTimeout(timeout);
  }, [dayTransition]);

  const completeIntro = useCallback(() => {
    localStorage.setItem(introKey, "true");
    setIntroVisible(false);
    setDayTransition({ day: game.day, phase: "blackout" });
  }, [game.day, introKey]);

  function beginNextDayTransition() {
    setDayTransition({ day: game.day + 1, phase: "logging-off" });
  }

  function exportGame() {
    const blob = new Blob([serializeSave(game, endowmentDollars)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stewardship-save-day-${game.day}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setNotice(`Day ${game.day} save exported.`);
  }

  async function importGame(file: File) {
    try {
      const imported = parseSave(await file.text(), endowmentDollars);
      setGame(imported);
      localStorage.setItem(introKey, "true");
      setIntroVisible(false);
      setDayTransition({ day: imported.day, phase: "blackout" });
      setNotice(`Day ${imported.day} save imported.`);
    } catch (error) {
      setNotice(error instanceof Error ? `Import failed: ${error.message}` : "Import failed: invalid save file.");
    }
  }

  function restartGame() {
    clearCookieSave(endowmentDollars);
    setGame(initialGameState());
    setNotice("Campaign restarted.");
    setDayTransition(null);
    localStorage.removeItem(introKey);
    setIntroVisible(true);
  }

  function queueAllocation(opportunityId: string, amountMillions: string) {
    const opportunity = opportunities.find((item) => item.id === opportunityId);
    const amount = Number(amountMillions) * 1_000_000;
    if (!opportunity || !Number.isSafeInteger(amount) || amount <= 0) {
      setNotice("Enter a whole-number allocation of at least one million dollars.");
      return;
    }
    if (amount > remaining) {
      setNotice("That entry exceeds the unallocated principal.");
      return;
    }
    setGame((current) => ({
      ...current,
      draft: {
        ...current.draft,
        [opportunity.id]: (current.draft[opportunity.id] ?? 0) + amount
      }
    }));
    setNotice(`${formatMoney(amount)} prepared for ${opportunity.name}.`);
  }

  function clearDraft() {
    setGame((current) => ({ ...current, draft: {} }));
    setNotice("The current day's working entries have been cleared.");
  }

  function authorizeDay() {
    const draftEntries = Object.entries(game.draft);
    const principalAfterCommit = endowmentDollars - committedTotal - draftTotal;
    if (draftEntries.length === 0 && !(principalAfterCommit === 0 && game.pending.length > 0)) {
      setNotice("Prepare an allocation before authorizing the day.");
      return;
    }
    beginNextDayTransition();

    const committed = { ...game.committed };
    const scheduled = [...game.pending];
    const immediate: ScheduledOutcome[] = [];

    draftEntries.forEach(([opportunityId, allocationDollars]) => {
      const opportunity = opportunities.find((item) => item.id === opportunityId);
      if (!opportunity) return;
      const totalAllocationDollars = (committed[opportunityId] ?? 0) + allocationDollars;
      committed[opportunityId] = totalAllocationDollars;
      const baseContext = { allocationDollars, totalAllocationDollars, day: game.day };
      const successConditionsMet = opportunity.rules.success
        ? evaluateTrigger(opportunity.rules.success, baseContext)
        : true;
      const context = { ...baseContext, successConditionsMet };
      const memo = [...opportunity.memos]
        .filter((item) => evaluateTrigger(item.when, context))
        .sort((left, right) => right.priority - left.priority)[0];
      const extra = [...opportunity.extras]
        .filter((item) => evaluateTrigger(item.when, context))
        .sort((left, right) => right.priority - left.priority)[0];

      opportunity.effects.forEach((effect, effectIndex) => {
        if (!evaluateTrigger(effect.when, context)) return;
        const outcome: ScheduledOutcome = {
          id: `${opportunity.id}.${game.day}.${effectIndex}`,
          opportunityId: opportunity.id,
          opportunityName: opportunity.name,
          dueDay: game.day + effect.manifest_after_days,
          allocationDollars,
          effects: effect.apply,
          memoSubject: memo?.subject,
          memoBodyMarkdown: memo?.body_markdown,
          newsHeadline: extra?.headline,
          newsBodyMarkdown: extra?.body_markdown
        };
        if (effect.manifest_after_days === 0) immediate.push(outcome);
        else scheduled.push(outcome);
      });
    });

    const afterImmediate = applyOutcomes(game.metrics, immediate);
    if (afterImmediate.publicStanding <= FIRING_THRESHOLD) {
      setGame({
        ...game,
        committed,
        draft: {},
        pending: scheduled,
        resolved: [...game.resolved, ...immediate],
        metrics: afterImmediate,
        status: "fired",
        finalOutcomeCount: immediate.length
      });
      return;
    }

    const nextDay = game.day + 1;
    const arriving = scheduled.filter((outcome) => outcome.dueDay <= nextDay);
    const stillPending = scheduled.filter((outcome) => outcome.dueDay > nextDay);
    const nextMetrics = applyOutcomes(afterImmediate, arriving);
    const fired = nextMetrics.publicStanding <= FIRING_THRESHOLD;
    const finished = principalAfterCommit === 0 && stillPending.length === 0;

    setGame({
      day: nextDay,
      committed,
      draft: {},
      pending: stillPending,
      resolved: [...game.resolved, ...immediate, ...arriving],
      metrics: nextMetrics,
      status: fired ? "fired" : finished ? "complete" : "active",
      finalOutcomeCount: arriving.length
    });
    setNotice(
      arriving.length > 0
        ? `${arriving.length} consequence${arriving.length === 1 ? "" : "s"} arrived on day ${nextDay}.`
        : `Day ${game.day} authorized. No notable consequence arrived.`
    );
  }

  return (
    <div className="app-shell" data-testid="app-shell">
      {introVisible ? <IntroSequence onComplete={completeIntro} /> : (
        <div className={`game-surface ${dayTransition?.phase === "desktop-in" ? "desktop-fade-in" : ""}`} data-testid="game-surface">
          <Desktop
            endowmentDollars={endowmentDollars}
            game={game}
            notice={notice}
            onAuthorizeDay={authorizeDay}
            onClearDraft={clearDraft}
            onQueueAllocation={queueAllocation}
            opportunities={opportunities}
          />
          {dayTransition && dayTransition.phase !== "desktop-in" && <DayTransition day={dayTransition.day} phase={dayTransition.phase} />}
        </div>
      )}
      <GameMenu day={game.day} notice={notice} onExport={exportGame} onImport={importGame} onRestart={restartGame} />
    </div>
  );
}
