# Technical Architecture

## Architectural decision

The initial release should be a static, client-side web application. It does
not require a backend, user account, database service, or server rendering.

| Layer | Recommended technology | Responsibility |
| --- | --- | --- |
| Application UI | React and TypeScript | XP-style programs, desktop shell, ledger, navigation |
| Build system | Vite | Development server and production bundle |
| Simulation | Framework-free TypeScript | Deterministic daily resolution and state transitions |
| UI state | Zustand | Open documents, drafts, preferences, current session |
| Content | YAML source compiled to JSON | Self-contained opportunities, global events, endings |
| Validation | Zod | Build-time and development-time content checks |
| Persistence | Versioned first-party cookies | Chunked autosave of local campaign state |
| Unit tests | Vitest | Rules, accounting, migrations, content validation |
| Browser tests | Playwright | Critical player journeys and deployment smoke tests |
| Hosting | GitHub Pages | Static production site |
| Continuous delivery | GitHub Actions | Checks, build, and Pages deployment |

Dependencies should be kept modest. In particular, the simulation must not
import React, browser storage, or UI components.

## Runtime boundaries

### Presentation layer

The presentation layer renders the workstation and its programs, collects draft
allocations, and invokes application commands. It may animate a result, but it
must not decide the result.

### Application layer

The application layer coordinates sessions, autosaves, content loading,
preferences, and simulation commands. It translates user actions into domain
commands such as `commitAllocation` and `advanceDay`.

### Simulation domain

The simulation is a pure state transition:

```text
previous state + validated player decision + authored trigger rules
                             |
                             v
             next state + resolution + scheduled effects
```

The core API should resemble:

```ts
advanceDay(state, decision): DayResolution
```

Given the same ruleset version, state, and decision, it must always produce the
same output. There is no random event selection or random outcome resolution.
This makes failures reproducible and enables exhaustive or scripted balance
simulations.

### Content layer

Each opportunity file is an aggregate containing its gameplay properties,
dossier, ordinary allocation coverage, triggered extras, and triggered internal
memos. Global events and ending conditions may live separately. Content refers
to registered simulation effects rather than executing arbitrary JavaScript.

The source of truth is one `.opportunity.yaml` file per opportunity. Structured
YAML fields describe mechanics and trigger conditions; explicitly named fields
such as `body_markdown` contain Markdown prose. A build step discovers every
file, parses it as YAML 1.2, validates it against the opportunity schema, and
compiles it into JSON for the browser. Authors never edit the compiled JSON.

### Persistence layer

Save data is versioned, schema-validated, and migrated at load time. The current
campaign is automatically serialized into 3,000-character first-party cookie
chunks plus a count manifest, avoiding the per-cookie size limit while keeping
the static application backend-free. The same envelope supports JSON export and
import. Ephemeral animation, window layout, and intro-dismissal state are not
stored in the domain save.

## Monetary representation

Money should be stored as integer cents. $100 billion is 10 trillion cents,
which remains below JavaScript's maximum safe integer. Floating-point currency
must not be used for balances or allocation invariants.

The state must distinguish:

- Original mandated principal still uncommitted.
- Original principal already committed.
- Permanent investment and development holdings at current authored valuations.
- Restricted or encumbered funds.
- The current marked value of long-lived assets, which is not spendable cash.

Every committed decision should balance like a ledger transaction. Automated
tests should assert that money is neither silently created nor destroyed.

## Deterministic events

The simulation has no random number generator. Event eligibility, timing, and
outcomes are calculated from authored rules, prior decisions, current state,
and the campaign day.

Apparent uncertainty comes from incomplete player information. A speculative
investment can be a long shot because its requirements and future result are
unknown to the player, not because the engine rolls a die. Changing an
unrelated UI component must never change a campaign's outcome.

## Suggested repository structure

```text
charity-game/
|-- src/
|   |-- app/                 # Commands, session coordination, error handling
|   |-- desktop/             # Diegetic XP-style application shell
|   |-- documents/           # Newspaper, memo, dossier components
|   |-- ledger/              # Allocation entry and accounting presentation
|   |-- simulation/          # Pure game rules and state transitions
|   |-- narrative/           # Deterministic trigger matching and rendering
|   |-- persistence/         # Cookie autosave, portable files, validation, migrations
|   `-- accessibility/       # Focus, motion, contrast, and input helpers
|-- content/
|   |-- opportunities/
|   |   |-- charities/       # One .opportunity.yaml file per charity
|   |   |-- companies/       # One .opportunity.yaml file per company
|   |   `-- real-estate/     # One .opportunity.yaml file per development
|   |-- global-events/
|   `-- endings/
|-- public/
|   |-- audio/
|   |-- fonts/
|   `-- textures/
|-- tests/
|   |-- simulation/
|   |-- content/
|   `-- e2e/
|-- tools/
|   `-- validate-content.ts
`-- .github/workflows/
    |-- checks.yml
    `-- deploy-pages.yml
```

## Save compatibility

Each save should include:

- A save schema version.
- A ruleset version.
- A campaign/content version.
- The complete domain state.
- A compact transaction and event history.

Migrations should be sequential, tested, and non-destructive. Players should
also be able to export and import a save as a file. Imports must match the save
format version and campaign endowment before replacing the automatic save.

## Backend boundary

A backend should only be introduced for a specific feature that cannot be
provided locally, such as:

- Cross-device cloud saves.
- Anonymous aggregate decision statistics.
- Community-authored scenarios.
- A synchronized daily challenge.
- Moderated leaderboards.

If one of these becomes important, a small edge API and serverless database can
be added without moving the core simulation off the client. The simulation must
remain independently testable and capable of offline execution.

## Quality strategy

Unit tests should cover monetary conservation, deterministic replay, threshold
boundaries, effect scheduling, save migrations, and ending selection. Content
tests should detect broken references and unreachable chains. Browser tests
should cover a complete day, saving and loading, keyboard operation, and the
final allocation.

For balance work, a headless runner should execute many scripted allocation
strategies such as equal allocation, maximum publicity, maximum expected impact,
and reckless concentration. Because outcomes are deterministic, boundary and
representative strategies are more useful than repeating the same campaign.
