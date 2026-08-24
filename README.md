# Charity Game

This repository currently contains architecture and game-design plans for a
single-player web game about allocating a fictionalized religious institution's
$100 billion endowment.

The intended experience combines institutional resource allocation with a
diegetic, Windows XP-era office workstation inspired by games such as *Papers, Please*.
Players balance genuine social benefit, institutional expectations, financial
stewardship, unintended incentives, fraud risk, and hostile media coverage.

The first infrastructure slice is implemented. It includes the Vite application,
validated opportunity authoring pipeline, deterministic trigger evaluator,
working allocation ledger, automated checks, and GitHub Pages deployment.
The playable shell now presents the systems as a fictional institutional desktop:
news arrives through a web browser, memos through office messenger, and allocations
through separate grant, capital, property, and ledger applications.
New campaigns open with a short, keyboard-skippable mandate sequence, and the
application windows can be dragged by their title bars within the desktop.

## Development

```text
pnpm install
pnpm dev
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
```

The full browser suite always builds and tests a local production preview. A
separate `pnpm test:smoke` command requires `PLAYWRIGHT_BASE_URL` and checks only
that an already-deployed game loads its intro, Day 1 transition, desktop, and
news application. GitHub Actions runs this smoke test after Pages deployment.

The Playwright suite builds the application in isolated end-to-end mode and
serves the production files over HTTP. Its successful-playthrough scenario uses
a test-only $10 million mandate; ordinary development and production builds
always use the full $100 billion principal. The suite also verifies immediate
dismissal after a catastrophic day-one allocation and a multi-day hell-world
sequence whose delayed outcomes arrive together.

Campaign progress is automatically stored in versioned, chunked first-party
cookies. The game-level menu can export the same validated save format as JSON,
import it again, or restart from Day 1. Browser tests clear cookies before every
scenario so saved progress cannot leak between playthroughs.

Opportunity source files live under `content/opportunities/`. Adding a new
`*.opportunity.yaml` file requires no central registry change. See the
[opportunity authoring format](docs/opportunity-authoring.md) for the schema and
Markdown conventions.

The current starter set contains two charities, two companies, and two
real-estate developments. Each category includes one beneficial or potentially
transformative opportunity and one deliberately harmful opportunity. All names
and organizations are fictional.

## Planning documents

- [Product vision](docs/product-vision.md)
- [Technical architecture](docs/technical-architecture.md)
- [Simulation and game systems](docs/simulation-design.md)
- [Narrative and content system](docs/content-system.md)
- [Opportunity authoring format](docs/opportunity-authoring.md)
- [Diegetic interface](docs/interface-design.md)
- [Infrastructure and deployment](docs/infrastructure.md)
- [Implementation roadmap](docs/roadmap.md)

## Current recommended direction

The first release should be a static client-side application built with React,
TypeScript, and Vite. The simulation should be a deterministic,
framework-free TypeScript library with no random outcomes. Each allocatable
object should carry its own dossier, initial coverage, triggered follow-up
extras, and internal memos in a validated YAML file. Prose fields contain
Markdown using readable YAML block syntax. Save games should remain in the
player's browser. This makes a free GitHub Pages deployment possible without
committing to a backend prematurely.
