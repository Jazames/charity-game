# Diegetic XP Workstation Design

## Concept

The game appears as a fictional Windows XP-era institutional workstation rather
than a conventional web dashboard. Desktop shortcuts, overlapping application
windows, a start menu, and a taskbar provide the primary navigation. The visual
language deliberately recalls early-2000s office software without redistributing
Microsoft artwork, sounds, trademarks, or fonts.

The workstation belongs to the Office of Temporal Stewardship. Its aging software
and locked-down corporate branding make the player feel like an employee operating
inside a bureaucracy, while standard HTML controls keep the interface readable.

## Primary workspace

The desktop should make the daily responsibilities spatially understandable:

- **The Valley Tribune:** a browser-like news site for ordinary reaction stories
  and prominent extras when delayed consequences become public.
- **Office Messenger:** a contact-list conversation that delivers notable internal
  memos, generally one day before the corresponding extra.
- **GrantWorks:** charity dossiers and proposed grant entry.
- **Covenant Capital:** company dossiers, speculative investments, and holdings.
- **PropertyDesk:** real-estate development dossiers and allocation entry.
- **Temporal Stewardship Ledger:** the authoritative daily draft, remaining
  principal, validation messages, and irreversible authorization control.
- **Start menu and taskbar:** redundant access to open and minimized programs and
  a persistent campaign-day indicator.

When a new memo or newspaper extra becomes available, its application is opened
minimized if necessary and its taskbar button flashes amber with an unread badge.
Activating the application marks the current notification read and stops the
flash. Ordinary headlines do not trigger the newspaper alert.

Only one window needs to be visually foregrounded at a time. Open programs remain
available on the taskbar so switching applications never discards a draft.

## Document interaction

Each program uses era-appropriate chrome but a consistent document surface. The
player can switch between programs without losing a draft allocation. Windows
support opening, closing, minimizing, and title-bar dragging with mouse or touch.
Dragging is bounded to the usable desktop above the taskbar. Resizing remains
optional polish rather than a gameplay requirement.

## Opening sequence

A new browser save begins with a short timed story establishing the mandate: a
wealthy religion has accidentally amassed $100 billion from faithful donations,
faces mounting scrutiny, and hires the player to improve the world without
causing scandal. Any keyboard key immediately skips the sequence; the on-screen
prompt also works as a button. Once dismissed, the intro stays dismissed for
that browser profile so reloading an active campaign does not interrupt play.

Dismissal first reveals a black `Day 1` title card, followed by a desktop
fade-in. After each valid daily authorization, the workstation shows a brief XP
logging-off screen, fades quickly to black, announces the incoming day number,
and fades the updated desktop into view. The transition prevents further input
while the daily decision is resolving.

## Allocation ledger

The ledger must communicate:

- Recipient.
- Category.
- Amount committed today.
- Total prior commitment.
- Applicable conditions or oversight.
- Remaining original principal.
- Validation problems.
- Whether the decision can still be revised.

Large values need unambiguous formatting. The player should be able to enter an
exact amount and use useful increment controls. A confirmation step must show
the full daily transaction before the irreversible stamp.

The interface should distinguish uncommitted principal from permanent holdings
and their changing valuations. Holdings are not sellable and never return funds
to the allocation ledger.

## Feedback hierarchy

The game should avoid immediate floating score changes after an allocation.
Feedback arrives primarily in the next day's documents. Immediate interface
feedback is limited to accounting, compliance warnings, obvious logistical
constraints, and confirmation that a transaction was recorded.

Animations and sound can reinforce software actions:

- Restrained window-open and minimize transitions.
- Keyboard or calculator sounds for ledger entry.
- A weighty authorization sound when committing the day.
- Messenger and browser notification sounds only when a notable item arrives.
- Subtle computer-fan and office ambience.

All repeated sounds need independent volume controls.

## Accessibility

The diegetic metaphor must have a conventional accessible structure underneath
it. Requirements include:

- Complete keyboard operation.
- Predictable focus order and visible focus state.
- Semantic headings, dialogs, forms, and buttons.
- A text-size setting that does not rely only on browser zoom.
- High-contrast and low-texture modes.
- Reduced motion and the ability to skip repeated transitions.
- Captions or textual equivalents for meaningful audio.
- No information conveyed by color, position, or handwriting alone.
- The start menu as a redundant list-based alternative to desktop shortcuts.

Screen-reader labels should describe function, not decorative position. For
example, use “Open internal memo” rather than “Click the folder at the top.”

## Responsive behavior

Desktop and tablet are the primary targets. On narrower screens, programs can
become maximized panels with a horizontally scrollable taskbar, but all gameplay
must remain possible. The project should not promise an elaborate mobile layout
until dense dossiers and ledgers are proven usable.

## Visual implementation boundaries

Use HTML and CSS for documents, controls, and layout so text remains accessible
and responsive. Bitmap textures and illustrations may decorate these elements.
Canvas should not be the primary interface technology.

The UI should render from application state and never store authoritative game
rules in window-management callbacks or component-local state.

## Integration-test contract

Interactive and state-bearing components expose stable `data-testid` attributes.
Tests should use these identifiers instead of visible XP-era labels, which may
change during art and copy iteration.

- Desktop access: `desktop-shell`, `desktop-icon-{app}`, `start-app-{app}`.
- Intro: `game-intro`, `intro-story`, and `intro-skip`.
- Day cycle: `transition-logging-off`, `transition-blackout`,
  `transition-day-card`, `transition-day-number`, and `game-surface`.
- Windows: `window-{app}`, `window-title-{app}`, `window-drag-handle-{app}`,
  `window-minimize-{app}`, `window-close-{app}`, and `taskbar-app-{app}`.
- Unread alerts: `data-attention="true"` on the relevant taskbar application and
  `taskbar-alert-{messenger|news}` for its visible badge.
- Content: `news-story-{opportunityId}`, `news-extra-{opportunityId}`,
  `memo-{opportunityId}`, and `opportunity-row-{opportunityId}`.
- Allocation: `allocation-input-{opportunityId}` and
  `queue-allocation-{opportunityId}`.
- Commitment: `ledger-draft-{opportunityId}`, `ledger-remaining`,
  `ledger-authorize`, and `ledger-notice`.
- End state: `game-over`, `game-status`, `hell-world-message`, and the
  `metric-*` fields.

App identifiers are currently `messenger`, `news`, `grants`, `capital`,
`property`, and `ledger`. New test IDs should describe domain identity rather
than window position or styling.

## Game-level save menu

A compact menu sits outside the diegetic desktop and remains available from the
intro and terminal game states. It provides JSON save export, validated save
import, and a restart confirmation. Stable hooks are `game-menu-toggle`,
`game-menu-panel`, `save-export`, `save-import-input`, `game-restart`,
`restart-confirm-dialog`, and `restart-confirm`.
