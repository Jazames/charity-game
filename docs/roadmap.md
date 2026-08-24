# Implementation Roadmap

## Guiding approach

Implementation should prove the simulation loop before investing heavily in
art, content volume, or online services. Each milestone should end in a playable
or testable artifact.

## Milestone 0: Decision record and scaffold

- Confirm the fictional setting and editorial boundaries.
- Choose the initial campaign length and daily allocation constraints.
- Record the rules for principal, permanent holdings, firing, and the end condition.
- Scaffold React, TypeScript, Vite, Vitest, and Playwright.
- Establish formatting, linting, content validation, and GitHub Actions checks.
- Deploy a minimal page to GitHub Pages to prove the base-path configuration.

Exit condition: a tested empty application deploys automatically from `main`,
and the central design decisions are recorded.

## Milestone 1: Simulation prototype

- Define money, game state, decision, opportunity, and effect types.
- Enforce a no-randomness rule in the simulation boundary.
- Implement ledger transactions and monetary invariants.
- Implement daily advancement and delayed effect scheduling.
- Add one charity, one investment, and one development.
- Build a minimal developer interface or headless runner.
- Test deterministic replay and save serialization.

Exit condition: a complete miniature campaign produces identical results from
identical decisions, with no random state in the save or rules engine.

## Milestone 2: Playable vertical slice

- Build seven game days.
- Add approximately twelve opportunities across the three categories.
- Implement one complete cobra-effect narrative arc.
- Implement capacity, fraud, publicity, permanent-holding valuation, and firing.
- Add normal headlines, sparse extras, event-driven memos, dossiers, and ledger screens.
- Add autosave and multiple local save slots.
- Add two or more provisional endings.

Exit condition: an unfamiliar player can complete a short campaign without
developer assistance and can explain why at least some consequences occurred.

## Milestone 3: Diegetic XP workstation

- Build the desktop, taskbar, start menu, and overlapping program windows.
- Present news, memos, opportunities, and authorization through distinct programs.
- Establish the fictional XP-era visual system, typography, wallpaper, and icons.
- Add restrained computer/office ambience and interaction sounds.
- Implement keyboard navigation, reduced motion, text sizing, and high contrast.
- Test desktop, tablet, and the simplified narrow-screen layout.

Exit condition: the game feels like an institutional workstation while remaining
usable through keyboard and accessible document navigation.

## Milestone 4: Content pipeline

- Finalize self-contained opportunity schemas containing rules, dossier,
  initial coverage, triggered extras, and triggered memos.
- Discover one `.opportunity.yaml` file per opportunity without a central registry.
- Parse Markdown block fields and compile validated YAML into production JSON.
- Detect invalid references, unreachable chains, and conflicting IDs.
- Generate previews of all document variants.
- Add a development event inspector and forced-event tooling.
- Document the authoring and review process.

Exit condition: a writer can add and test a narrative chain without changing
simulation source code.

## Milestone 5: Campaign production and balance

- Expand opportunity and event coverage.
- Add interacting narrative arcs and institutional factions.
- Add additional oversight choices and exceptional events selectively.
- Write modular ending fragments.
- Create automated player strategies and exercise decision boundaries.
- Conduct structured playtests for comprehension, pacing, and exploitability.
- Revise content for continuity, fairness, and tonal consistency.

Exit condition: multiple viable strategies produce meaningfully different
outcomes, and no single allocation heuristic dominates the campaign.

## Milestone 6: Release preparation

- Complete the full browser regression suite.
- Test save migrations across release candidates.
- Add save export, import, and recovery flows.
- Optimize image, font, and audio budgets.
- Review all attributions, licenses, names, and editorial risk.
- Add privacy information, content notices, credits, and support instructions.
- Test the production deployment on major desktop browsers.
- Tag and archive the first stable ruleset and content version.

Exit condition: the production build is reproducible, existing saves survive an
upgrade, and the public deployment has passed accessibility and editorial review.

## Deferred features

These should not be included in the initial architecture unless playtesting
demonstrates a strong need:

- User accounts and cloud saves.
- Multiplayer or leaderboards.
- Community-authored content.
- Real-time news feeds or scraped articles.
- Generative text in the runtime game.
- A general-purpose backend.
- Mobile-native applications.
- Fully simulated window-manager physics.
- A large set of allocation conditions before the basic loop is balanced.

## Early decisions still to make

- Exact fictional names and visual era.
- Campaign length and expected play-session length.
- Whether allocation is required every day or only by campaign end.
- How much of the simulation is explained to the player.
- How prominently changing holding values should be shown.
- The initial set of oversight controls.
- Tone boundaries between satire, drama, and systems education.
- The exact public-relations threshold and warnings before the player is fired.

These decisions should be tested through the vertical slice rather than treated
as infrastructure requirements.
