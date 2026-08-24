export type DayTransitionPhase = "logging-off" | "blackout" | "day-card" | "desktop-in";

interface DayTransitionProps {
  day: number;
  phase: Exclude<DayTransitionPhase, "desktop-in">;
}

export function DayTransition({ day, phase }: DayTransitionProps) {
  if (phase === "logging-off") {
    return (
      <main className="day-transition transition-logoff" data-testid="day-transition">
        <div className="logoff-brand"><span>S</span><strong>StewardOS</strong></div>
        <section data-testid="transition-logging-off">
          <div className="logoff-user">👤</div>
          <div><h1>Logging off…</h1><p>Saving your settings and stewardship records.</p></div>
        </section>
        <footer>Office of Temporal Stewardship</footer>
      </main>
    );
  }

  if (phase === "blackout") {
    return <main aria-label="Transitioning to the next day" className="day-transition transition-blackout" data-testid="transition-blackout" />;
  }

  return (
    <main className="day-transition transition-day-card" data-testid="transition-day-card">
      <p>DAY</p>
      <h1 data-testid="transition-day-number">{day}</h1>
      <div className="day-card-rule" />
    </main>
  );
}
