import { useRef, useState, type ChangeEvent } from "react";

interface GameMenuProps {
  day: number;
  notice: string;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
  onRestart: () => void;
}

export function GameMenu({ day, notice, onExport, onImport, onRestart }: GameMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) await onImport(file);
    event.target.value = "";
    setOpen(false);
  }

  return (
    <aside className="game-menu" data-testid="game-menu">
      <button
        aria-expanded={open}
        className="game-menu-toggle"
        data-testid="game-menu-toggle"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >☰ Game</button>
      {open && (
        <section className="game-menu-panel" data-testid="game-menu-panel">
          <header><strong>Campaign</strong><span>Day {day}</span></header>
          <button data-testid="save-export" onClick={onExport} type="button">Export save…</button>
          <button data-testid="save-import" onClick={() => inputRef.current?.click()} type="button">Import save…</button>
          <input accept="application/json,.json" data-testid="save-import-input" hidden onChange={importFile} ref={inputRef} type="file" />
          <hr />
          <button className="restart-button" data-testid="game-restart" onClick={() => setConfirmRestart(true)} type="button">Restart campaign…</button>
          {notice && <p data-testid="save-menu-notice">{notice}</p>}
        </section>
      )}
      {confirmRestart && (
        <section aria-modal="true" className="restart-dialog" data-testid="restart-confirm-dialog" role="dialog">
          <h2>Restart campaign?</h2>
          <p>This replaces the automatic save with a new Day 1 campaign.</p>
          <div>
            <button data-testid="restart-cancel" onClick={() => setConfirmRestart(false)} type="button">Cancel</button>
            <button className="restart-confirm" data-testid="restart-confirm" onClick={() => { setConfirmRestart(false); setOpen(false); onRestart(); }} type="button">Restart</button>
          </div>
        </section>
      )}
    </aside>
  );
}
