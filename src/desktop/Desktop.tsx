import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Opportunity } from "../content/schema";
import { formatMoney, sumLedger, type GameState } from "../game/state";

type AppId = "messenger" | "news" | "grants" | "capital" | "property" | "ledger";

interface WindowState {
  open: boolean;
  minimized: boolean;
  position?: { x: number; y: number };
}

interface DesktopProps {
  game: GameState;
  endowmentDollars: number;
  opportunities: Opportunity[];
  notice: string;
  onQueueAllocation: (opportunityId: string, amountMillions: string) => void;
  onClearDraft: () => void;
  onAuthorizeDay: () => void;
}

const appMeta: Record<AppId, { label: string; icon: string }> = {
  messenger: { label: "Office Messenger", icon: "👥" },
  news: { label: "Valley Tribune", icon: "🌐" },
  grants: { label: "GrantWorks", icon: "📁" },
  capital: { label: "Covenant Capital", icon: "📈" },
  property: { label: "PropertyDesk", icon: "🏢" },
  ledger: { label: "Apportionment Ledger", icon: "🧮" }
};

function Markdown({ children }: { children: string }) {
  return (
    <div className="app-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{children}</ReactMarkdown>
    </div>
  );
}

function DesktopIcon({ app, onOpen }: { app: AppId; onOpen: (app: AppId) => void }) {
  return (
    <button
      className="desktop-icon"
      data-testid={`desktop-icon-${app}`}
      onDoubleClick={() => onOpen(app)}
      onClick={() => onOpen(app)}
      type="button"
    >
      <span className={`desktop-icon-image icon-${app}`} aria-hidden="true">{appMeta[app].icon}</span>
      <span>{appMeta[app].label}</span>
    </button>
  );
}

function AppWindow({
  app,
  active,
  minimized,
  position,
  onActivate,
  onClose,
  onMinimize,
  onMove,
  children
}: {
  app: AppId;
  active: boolean;
  minimized: boolean;
  position?: { x: number; y: number };
  onActivate: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMove: (position: { x: number; y: number }) => void;
  children: React.ReactNode;
}) {
  const dragOrigin = useRef<{
    pointerId: number;
    pointerX: number;
    pointerY: number;
    windowX: number;
    windowY: number;
    windowElement: HTMLElement;
    layerElement: HTMLElement;
  } | null>(null);

  function beginDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as Element).closest(".window-controls")) return;
    const windowElement = event.currentTarget.parentElement;
    const layerElement = windowElement?.parentElement;
    if (!windowElement || !layerElement) return;

    onActivate();
    dragOrigin.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      windowX: windowElement.offsetLeft,
      windowY: windowElement.offsetTop,
      windowElement,
      layerElement
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function dragWindow(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragOrigin.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const maxX = Math.max(0, drag.layerElement.clientWidth - drag.windowElement.offsetWidth);
    const maxY = Math.max(0, drag.layerElement.clientHeight - drag.windowElement.offsetHeight);
    onMove({
      x: Math.min(maxX, Math.max(0, drag.windowX + event.clientX - drag.pointerX)),
      y: Math.min(maxY, Math.max(0, drag.windowY + event.clientY - drag.pointerY))
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    if (dragOrigin.current?.pointerId !== event.pointerId) return;
    dragOrigin.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  if (minimized) return null;
  return (
    <section
      className={`os-window window-${app} ${active ? "active" : "inactive"}`}
      data-testid={`window-${app}`}
      onMouseDown={onActivate}
      style={{
        zIndex: active ? 20 : 10,
        ...(position ? { left: position.x, right: "auto", top: position.y } : {})
      }}
    >
      <header
        className="window-titlebar"
        data-testid={`window-drag-handle-${app}`}
        onPointerCancel={endDrag}
        onPointerDown={beginDrag}
        onPointerMove={dragWindow}
        onPointerUp={endDrag}
      >
        <span className="titlebar-icon" aria-hidden="true">{appMeta[app].icon}</span>
        <strong data-testid={`window-title-${app}`}>{appMeta[app].label}</strong>
        <div className="window-controls">
          <button aria-label={`Minimize ${appMeta[app].label}`} data-testid={`window-minimize-${app}`} onClick={onMinimize} type="button">_</button>
          <button aria-label={`Close ${appMeta[app].label}`} data-testid={`window-close-${app}`} onClick={onClose} type="button">×</button>
        </div>
      </header>
      <div className="window-body" data-testid={`app-${app}`}>{children}</div>
    </section>
  );
}

function NewsApp({ game, opportunities }: Pick<DesktopProps, "game" | "opportunities">) {
  const committedStories = Object.keys(game.committed)
    .map((id) => opportunities.find((item) => item.id === id))
    .filter((item): item is Opportunity => Boolean(item));
  const breaking = game.resolved.filter(
    (outcome) => outcome.dueDay === game.day && outcome.newsHeadline
  );

  return (
    <div className="browser-app">
      <div className="browser-toolbar">
        <button type="button" aria-label="Back">←</button>
        <button type="button" aria-label="Forward">→</button>
        <button type="button" aria-label="Refresh">↻</button>
        <label>Address <input readOnly value="http://www.valleytribune.local/" /></label>
      </div>
      <div className="news-site" data-testid="news-homepage">
        <header className="news-masthead">
          <div className="news-date">DAY {game.day} · MORNING EDITION</div>
          <h1>The Valley Tribune</h1>
          <p>Independent news for the mountain west</p>
        </header>
        {breaking.map((outcome) => (
          <article className="breaking-story" data-testid={`news-extra-${outcome.opportunityId}`} key={outcome.id}>
            <span>BREAKING EXTRA</span>
            <h2>{outcome.newsHeadline}</h2>
            {outcome.newsBodyMarkdown && <Markdown>{outcome.newsBodyMarkdown}</Markdown>}
          </article>
        ))}
        <div className="news-columns">
          <main>
            {committedStories.length === 0 ? (
              <article className="lead-story">
                <p className="section-label">Religion & Money</p>
                <h2>Church fund begins secretive $100 billion allocation mandate</h2>
                <p>Officials declined to identify the newly appointed steward or disclose which projects are under consideration.</p>
              </article>
            ) : committedStories.map((opportunity) => (
              <article className="news-story" data-testid={`news-story-${opportunity.id}`} key={opportunity.id}>
                <p className="section-label">Latest allocation</p>
                <h2>{opportunity.initial_coverage[0].headline}</h2>
                <Markdown>{opportunity.initial_coverage[0].body_markdown}</Markdown>
              </article>
            ))}
          </main>
          <aside>
            <h3>Most read</h3>
            <ol>
              <li>What the church owns—and what it will not disclose</li>
              <li>Downtown land prices rise for ninth year</li>
              <li>Editorial: Charity cannot excuse secrecy</li>
            </ol>
            <div className="web-ad">TRIBUNE ARCHIVE<br /><small>Search stories since 1871</small></div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MessengerApp({ game }: Pick<DesktopProps, "game">) {
  const warnings = game.pending.filter((outcome) => outcome.dueDay === game.day + 1 && outcome.memoSubject);
  return (
    <div className="messenger-app">
      <aside className="contact-list">
        <div className="messenger-user"><span>👤</span><strong>Steward</strong><small>Online</small></div>
        <p>INTERNAL CONTACTS</p>
        <button className="contact active" type="button"><span className="presence online" />Executive Secretariat</button>
        <button className="contact" type="button"><span className="presence online" />Internal Audit</button>
        <button className="contact" type="button"><span className="presence away" />Public Affairs</button>
        <button className="contact" type="button"><span className="presence online" />Investment Committee</button>
      </aside>
      <section className="conversation" data-testid="messenger-thread">
        <header>Executive Secretariat <span>● Online</span></header>
        <div className="message-history">
          <div className="message system">This conversation is retained under institutional policy.</div>
          {warnings.length === 0 ? (
            <div className="message received" data-testid="messenger-empty">
              <strong>Executive Secretariat:</strong>
              <p>No action required this morning. Continue reviewing the active files.</p>
              <time>8:05 AM</time>
            </div>
          ) : warnings.map((outcome) => (
            <div className="message received urgent" data-testid={`memo-${outcome.opportunityId}`} key={outcome.id}>
              <strong>{outcome.memoSubject}</strong>
              {outcome.memoBodyMarkdown && <Markdown>{outcome.memoBodyMarkdown}</Markdown>}
              <time>7:42 AM</time>
            </div>
          ))}
        </div>
        <div className="message-compose"><input aria-label="Message" disabled value="Replies disabled for this contact." /><button disabled type="button">Send</button></div>
      </section>
    </div>
  );
}

function OpportunityApp({
  category,
  game,
  opportunities,
  onQueueAllocation
}: Pick<DesktopProps, "game" | "opportunities" | "onQueueAllocation"> & { category: Opportunity["category"] }) {
  const items = opportunities.filter((item) => item.category === category);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [amount, setAmount] = useState("10");
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const appClass = category === "charity" ? "grant-app" : category === "company" ? "capital-app" : "property-app";
  const labels = category === "charity"
    ? { title: "GrantWorks 4.2", noun: "Applicant", action: "Prepare grant" }
    : category === "company"
      ? { title: "Covenant Capital Workstation", noun: "Security", action: "Prepare purchase" }
      : { title: "PropertyDesk Enterprise", noun: "Development", action: "Prepare investment" };

  if (!selected) return null;
  return (
    <div className={`opportunity-app ${appClass}`}>
      <div className="enterprise-menubar">File&nbsp;&nbsp; Edit&nbsp;&nbsp; View&nbsp;&nbsp; Reports&nbsp;&nbsp; Tools&nbsp;&nbsp; Help</div>
      <div className="enterprise-toolbar">
        <strong>{labels.title}</strong>
        <span>Connection: SECURE</span>
        <span>Day {game.day}</span>
      </div>
      <div className="opportunity-workspace">
        <aside className="record-list" data-testid={`opportunity-list-${category}`}>
          <h3>{labels.noun} directory</h3>
          {items.map((item) => (
            <button
              className={item.id === selected.id ? "record active" : "record"}
              data-testid={`opportunity-row-${item.id}`}
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              type="button"
            >
              <span className="record-icon">{category === "charity" ? "📄" : category === "company" ? "▥" : "▧"}</span>
              <span><strong>{item.name}</strong><small>{item.dossier.summary}</small></span>
            </button>
          ))}
        </aside>
        <main className="record-detail" data-testid={`opportunity-detail-${selected.id}`}>
          <div className="record-header">
            <div><small>{selected.id}</small><h2>{selected.name}</h2></div>
            <span className="status-badge">ACTIVE FILE</span>
          </div>
          <div className="record-tabs"><button className="active" type="button">Overview</button><button type="button">Documents</button><button type="button">Audit history</button></div>
          <Markdown>{selected.dossier.body_markdown}</Markdown>
          <fieldset className="allocation-box">
            <legend>Apportionment request</legend>
            <label>Amount in millions
              <input
                data-testid={`allocation-input-${selected.id}`}
                min="1"
                onChange={(event) => setAmount(event.target.value)}
                step="1"
                type="number"
                value={amount}
              />
            </label>
            <button
              data-testid={`queue-allocation-${selected.id}`}
              onClick={() => onQueueAllocation(selected.id, amount)}
              type="button"
            >
              {labels.action} →
            </button>
          </fieldset>
        </main>
      </div>
    </div>
  );
}

function LedgerApp({ game, endowmentDollars, opportunities, notice, onClearDraft, onAuthorizeDay }: Omit<DesktopProps, "onQueueAllocation">) {
  const committed = sumLedger(game.committed);
  const draft = sumLedger(game.draft);
  const remaining = endowmentDollars - committed - draft;
  return (
    <div className="ledger-app">
      <div className="ledger-menubar">File&nbsp;&nbsp; Transaction&nbsp;&nbsp; Reports&nbsp;&nbsp; Window&nbsp;&nbsp; Help</div>
      <header className="ledger-app-header">
        <div className="ledger-seal">TS</div>
        <div><h1>Temporal Stewardship Ledger</h1><p>Permanent apportionment control · Day {game.day}</p></div>
      </header>
      <div className="ledger-summary">
        <label>Original principal<strong>{formatMoney(endowmentDollars)}</strong></label>
        <label>Previously committed<strong>{formatMoney(committed)}</strong></label>
        <label>Available after entries<strong data-testid="ledger-remaining">{formatMoney(remaining)}</strong></label>
      </div>
      <div className="ledger-table" role="table" aria-label="Daily ledger entries">
        <div className="ledger-table-head" role="row"><span>Account</span><span>Recipient / Holding</span><span>Amount</span></div>
        {Object.entries(game.draft).length === 0 ? (
          <p className="empty-ledger" data-testid="ledger-empty">No entries prepared for day {game.day}.</p>
        ) : Object.entries(game.draft).map(([id, amount]) => (
          <div className="ledger-table-row" data-testid={`ledger-draft-${id}`} key={id} role="row">
            <span>{id.split(".")[0].toUpperCase()}</span>
            <span>{opportunities.find((item) => item.id === id)?.name ?? id}</span>
            <strong>{formatMoney(amount)}</strong>
          </div>
        ))}
      </div>
      <p className="ledger-notice" data-testid="ledger-notice" aria-live="polite">{notice}</p>
      <div className="ledger-actions">
        <button data-testid="ledger-clear" disabled={draft === 0} onClick={onClearDraft} type="button">Clear today's entries</button>
        <button
          className="authorize-ledger"
          data-testid="ledger-authorize"
          disabled={draft === 0 && !(remaining === 0 && game.pending.length > 0)}
          onClick={onAuthorizeDay}
          type="button"
        >Authorize day {game.day}</button>
      </div>
    </div>
  );
}

function LockedWorkstation({ game }: { game: GameState }) {
  const hellWorld = game.status === "fired" && game.finalOutcomeCount >= 3 && game.metrics.worldWellbeing <= -15 && game.metrics.wastedDollars > 0;
  return (
    <main className="lock-screen" data-testid="game-over">
      <header className="lock-brand"><span className="os-orb">S</span><div><strong>StewardOS</strong><small>Institutional Edition</small></div></header>
      <section className="lock-panel">
        <div className="disabled-user">👤</div>
        <div>
          <h1 data-testid="game-status">{game.status === "fired" ? "Your account has been disabled" : "Mandate complete"}</h1>
          {game.status === "fired" ? <p>Executive Secretariat revoked authorization privileges on day {game.day}. Public standing: {game.metrics.publicStanding}.</p> : <p>The apportionment mandate has been completed and this workstation is now read-only.</p>}
          {hellWorld && <p className="lock-alert" data-testid="hell-world-message">Hell world: {game.finalOutcomeCount} delayed consequences arrived together, producing severe real-world harm and financial waste.</p>}
          <dl className="lock-metrics">
            <div><dt>World wellbeing</dt><dd data-testid="metric-world">{game.metrics.worldWellbeing}</dd></div>
            <div><dt>Money wasted</dt><dd data-testid="metric-waste">{formatMoney(game.metrics.wastedDollars)}</dd></div>
            <div><dt>Consequences today</dt><dd data-testid="metric-consequences">{game.finalOutcomeCount}</dd></div>
          </dl>
        </div>
      </section>
      <footer>To log on again, contact your system administrator.</footer>
    </main>
  );
}

export function Desktop(props: DesktopProps) {
  const { game } = props;
  const [windows, setWindows] = useState<Record<AppId, WindowState>>({
    messenger: { open: false, minimized: false },
    news: { open: true, minimized: false },
    grants: { open: false, minimized: false },
    capital: { open: false, minimized: false },
    property: { open: false, minimized: false },
    ledger: { open: false, minimized: false }
  });
  const [activeApp, setActiveApp] = useState<AppId>("news");
  const [startOpen, setStartOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(() => new Set());
  const memoNotificationKeys = game.pending
    .filter((outcome) => outcome.dueDay === game.day + 1 && outcome.memoSubject)
    .map((outcome) => `memo:${outcome.id}`);
  const newsNotificationKeys = game.resolved
    .filter((outcome) => outcome.dueDay === game.day && outcome.newsHeadline)
    .map((outcome) => `news:${outcome.id}`);
  const messengerNeedsAttention = memoNotificationKeys.some((key) => !readNotifications.has(key));
  const newsNeedsAttention = newsNotificationKeys.some((key) => !readNotifications.has(key));

  useEffect(() => {
    const alertedApps: AppId[] = [];
    if (messengerNeedsAttention) alertedApps.push("messenger");
    if (newsNeedsAttention) alertedApps.push("news");
    if (alertedApps.length === 0) return;

    setWindows((current) => {
      let changed = false;
      const next = { ...current };
      alertedApps.forEach((app) => {
        if (current[app].open) return;
        next[app] = { ...current[app], open: true, minimized: true };
        changed = true;
      });
      return changed ? next : current;
    });
  }, [messengerNeedsAttention, newsNeedsAttention]);

  if (game.status !== "active") return <LockedWorkstation game={game} />;

  function markNotificationsRead(app: AppId) {
    const keys = app === "messenger"
      ? memoNotificationKeys
      : app === "news"
        ? newsNotificationKeys
        : [];
    if (keys.length === 0) return;
    setReadNotifications((current) => {
      if (keys.every((key) => current.has(key))) return current;
      const next = new Set(current);
      keys.forEach((key) => next.add(key));
      return next;
    });
  }

  function activateApp(app: AppId) {
    setActiveApp(app);
    markNotificationsRead(app);
  }

  function openApp(app: AppId) {
    setWindows((current) => ({ ...current, [app]: { open: true, minimized: false } }));
    activateApp(app);
    setStartOpen(false);
  }

  function closeApp(app: AppId) {
    setWindows((current) => ({ ...current, [app]: { open: false, minimized: false } }));
  }

  function minimizeApp(app: AppId) {
    setWindows((current) => ({ ...current, [app]: { ...current[app], minimized: true } }));
  }

  function moveApp(app: AppId, position: { x: number; y: number }) {
    setWindows((current) => ({ ...current, [app]: { ...current[app], position } }));
  }

  function appNeedsAttention(app: AppId) {
    return app === "messenger"
      ? messengerNeedsAttention
      : app === "news" && newsNeedsAttention;
  }

  function appContent(app: AppId) {
    if (app === "messenger") return <MessengerApp game={game} />;
    if (app === "news") return <NewsApp game={game} opportunities={props.opportunities} />;
    if (app === "grants") return <OpportunityApp category="charity" game={game} opportunities={props.opportunities} onQueueAllocation={props.onQueueAllocation} />;
    if (app === "capital") return <OpportunityApp category="company" game={game} opportunities={props.opportunities} onQueueAllocation={props.onQueueAllocation} />;
    if (app === "property") return <OpportunityApp category="real-estate" game={game} opportunities={props.opportunities} onQueueAllocation={props.onQueueAllocation} />;
    return <LedgerApp {...props} />;
  }

  return (
    <main className="xp-desktop" data-testid="desktop-shell">
      <div className="desktop-watermark"><span className="watermark-seal">S</span><div><strong>OFFICE OF TEMPORAL STEWARDSHIP</strong><small>AUTHORIZED PERSONNEL ONLY</small></div></div>
      <div className="desktop-icons" aria-label="Desktop applications">
        {(Object.keys(appMeta) as AppId[]).map((app) => <DesktopIcon app={app} key={app} onOpen={openApp} />)}
      </div>

      <div className="window-layer">
        {(Object.keys(windows) as AppId[]).filter((app) => windows[app].open).map((app) => (
          <AppWindow
            active={activeApp === app}
            app={app}
            key={app}
            minimized={windows[app].minimized}
            position={windows[app].position}
            onActivate={() => activateApp(app)}
            onClose={() => closeApp(app)}
            onMinimize={() => minimizeApp(app)}
            onMove={(position) => moveApp(app, position)}
          >{appContent(app)}</AppWindow>
        ))}
      </div>

      {startOpen && (
        <section className="start-menu" data-testid="start-menu">
          <header><span>👤</span><strong>Steward</strong></header>
          <div className="start-programs">
            {(Object.keys(appMeta) as AppId[]).map((app) => (
              <button data-testid={`start-app-${app}`} key={app} onClick={() => openApp(app)} type="button"><span>{appMeta[app].icon}</span>{appMeta[app].label}</button>
            ))}
          </div>
          <footer><button type="button">Log Off</button><button type="button">Shut Down</button></footer>
        </section>
      )}

      <footer className="taskbar" data-testid="taskbar">
        <button className="start-button" data-testid="taskbar-start" onClick={() => setStartOpen((open) => !open)} type="button"><span className="start-orb">S</span> start</button>
        <div className="taskbar-apps">
          {(Object.keys(windows) as AppId[]).filter((app) => windows[app].open).map((app) => {
            const needsAttention = appNeedsAttention(app);
            return (
            <button
              aria-label={`${appMeta[app].label}${needsAttention ? ", unread notification" : ""}`}
              className={`${activeApp === app && !windows[app].minimized ? "active" : ""}${needsAttention ? " attention" : ""}`}
              data-attention={needsAttention ? "true" : "false"}
              data-testid={`taskbar-app-${app}`}
              key={app}
              onClick={() => openApp(app)}
              type="button"
            >
              <span>{appMeta[app].icon}</span>{appMeta[app].label}
              {needsAttention && <span className="taskbar-alert" data-testid={`taskbar-alert-${app}`}>!</span>}
            </button>
            );
          })}
        </div>
        <div className="system-tray">
          <span title="Secure network">🖥️</span><span title="Volume">🔊</span>
          <time data-testid="taskbar-day">Day {game.day}<small>8:13 AM</small></time>
        </div>
      </footer>
    </main>
  );
}
