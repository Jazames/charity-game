# Narrative and Content System

## Goals

The content system must support deterministic delayed consequences, competing
interpretations, and substantial writing volume without embedding prose in
simulation code. Each allocatable object should be self-contained: its gameplay
rules, dossier, initial headlines and articles, follow-up extras, internal memos,
and trigger conditions live together in one validated data object.

## Content categories

The initial taxonomy should include:

- Opportunity objects containing rules and associated documents.
- Availability rules and dossiers.
- Normal allocation headlines and articles.
- Triggered newspaper extras.
- Triggered internal memoranda.
- Global events not owned by one opportunity.
- Exceptional player choices.
- Ending fragments.
- Glossary and help material.

YAML is the required authoring format. Each opportunity lives in its own
`.opportunity.yaml` file. Structured fields remain easy for the machine to
parse, while long text uses YAML's `|` block form and is rendered as Markdown.
The build pipeline validates the source and emits optimized JSON bundles; that
JSON is generated output and is never edited by authors.

## Opportunity definition

An opportunity owns the documents and effects caused by allocating to it:

```yaml
schema_version: 1
id: investment.example-fusion
category: investment
name: Example Fusion Systems
rules:
  harmfulness: 0
  speculative: true
  success:
    all:
      - minimum_allocation: 2500000000
      - committed_by_day: 20
dossier:
  title: Example Fusion Systems
  body_markdown: |
    The company proposes a demonstration-scale **fusion power plant**.

    - No commercial reactor has been completed.
    - Its local construction agreement is fully negotiated.
initial_coverage:
  - id: initial
    headline: Church fund backs uncertain fusion venture
    body_markdown: |
      The church investment office has made a long-shot energy investment.

      Analysts described the decision as technically interesting but uncertain.
memos:
  - id: technical-milestone
    when: { success_conditions_met: true }
    day_offset: 5
    body_markdown: |
      The test reactor has sustained its target reaction. Public disclosure is
      expected tomorrow.
extras:
  - id: failed
    when: { success_conditions_met: false }
    day_offset: 6
    headline: Billions lost on speculative church investment
    body_markdown: |
      The experimental project has exhausted its capital without completing a
      working reactor.
  - id: profitable
    when: { success_conditions_met: true }
    day_offset: 6
    headline: Church reaps windfall from energy breakthrough
    body_markdown: |
      The institution's holding has increased sharply in value following a
      successful demonstration.
```

The exact schema can change during prototyping, but it should preserve:

- Stable IDs for the opportunity and every document.
- Initial coverage for an apportionment.
- Exact trigger conditions and day offsets.
- An explicit `manifest_after_days` value for every gameplay effect.
- State effects and holding valuation changes.
- Optional memo-before-extra sequences.
- Mutually exclusive follow-up branches.
- A causal link to the relevant player transaction.

Content must not execute arbitrary source code.

Effect timing is deterministic. `manifest_after_days: 0` resolves during the
current authorization; larger values schedule the effect relative to the day of
the allocation. All effects due on the same day are applied as a single batch
before dismissal or campaign-completion conditions are evaluated.

The complete file layout, Markdown rules, trigger conventions, and authoring
workflow are specified in [Opportunity authoring format](opportunity-authoring.md).

## The two types of newspaper content

### Normal coverage

Normal headlines and short articles are the immediate reaction to an
apportionment. Every opportunity owns the variants appropriate to different
allocation bands or conditions. This coverage establishes the newspaper's
initial frame but does not mean something exceptional has happened.

### Extras

Extras are follow-up editions generated only when an authored condition becomes
notable: a fraud is exposed, a program creates a perverse incentive, a project
collapses, or an investment becomes conspicuously profitable. Most good
decisions should generate no extra because nothing extraordinary went wrong.

## Internal memos

Memos are event-driven, not a mandatory daily document. A warning memo normally
arrives one day before the public extra, giving the player advance institutional
knowledge. Some notable successes generate a short congratulatory memo even if
no newspaper extra follows.

## Document templates

Newspaper and memo documents should use authored variants with controlled
substitutions. Selection is deterministic: the first highest-priority matching
variant wins, with stable IDs used as the final tie-breaker.

Documents need metadata for:

- Source and author persona.
- Subject organization and decision.
- Tone and media frame.
- Required known facts.
- Facts the document reveals to the player.
- Earliest and latest publication day.
- Duplicate-suppression group.
- Follow-up story references.

Substitution must use a small approved vocabulary. Free-form procedural text
generation is not needed and would make tone, testing, and continuity harder to
control.

Raw HTML in Markdown should be disabled. The renderer should support a defined
CommonMark subset plus selected GitHub-flavored features such as tables, while
sanitizing links and generated output.

## Competing accounts

An underlying event can produce multiple observations:

```text
Simulation fact
|-- Internal operations memo: exceptional, early, detailed, defensive
|-- Auditor report: delayed, narrow, high confidence
`-- Newspaper extra: exceptional, public, selective, adversarial frame
```

Documents should distinguish facts from interpretations. Bias changes which
facts are selected and how they are framed; it should not require every source
to lie constantly.

## Narrative chains

Longer arcs should be built from small stateful events. Each arc needs:

- Entry conditions.
- At least one early signal.
- Escalation conditions.
- Opportunities for player intervention.
- Resolution or expiry conditions.
- Documents for the major branches.
- Ending consequences if unresolved.

The content validator should flag impossible triggers, duplicate IDs, invalid
effect paths, ambiguous equal-priority matches, extras without a notable cause,
and memo/extra sequences with incorrect timing.

## Editorial rules

- Use fictional names, brands, quotations, and article text.
- Do not copy real headlines or article paragraphs.
- Attribute claims to in-world speakers when the truth is uncertain.
- Avoid treating a demographic group as a monolith.
- Aim satire at systems and incentives rather than vulnerable beneficiaries.
- Give organizations internally coherent motivations.
- Ensure that favorable and unfavorable facts can exist in the same storyline.
- Record the intended causal lesson for every cobra-effect scenario.

The fictional newspaper can maintain a recognizable editorial stance. It
should still sometimes uncover real wrongdoing, praise an unusually transparent
decision, or criticize the institution for a valid reason. Predictable hostility
becomes more interesting when its factual basis varies.

## Authoring workflow

1. Write or revise a content file.
2. Run schema and reference validation.
3. Generate a preview containing every possible document variant.
4. Run a scripted scenario that triggers the event.
5. Review continuity, factual consistency, and tone.
6. Add or update automated reachability tests.
7. Merge only after the production content build succeeds.

Adding a file must not require editing a central registry. The content compiler
discovers opportunity files by directory and extension, then reports validation
errors with filenames and line numbers.

## Development tools

The application should eventually include a development-only inspector showing:

- Current hidden simulation values.
- Eligible events and failed preconditions.
- Why the selected event won priority.
- Trigger evaluations and deterministic tie-breaks used in resolution.
- Scheduled future effects.
- The player decision that caused a document.

This tool will be essential for debugging and balancing delayed systems.
