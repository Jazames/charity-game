# Opportunity Authoring Format

## Decision

Every charity, company investment, and real-estate development is authored as
one UTF-8 YAML file with the extension `.opportunity.yaml`.

YAML provides labeled, machine-readable structure without JSON's punctuation
overhead. Long-form fields use YAML block scalars and contain Markdown. This
keeps the rules and all related writing together while allowing the application
to validate and compile the file reliably.

Markdown with YAML front matter was considered but rejected as the primary
format. It works well for one article, but an opportunity contains a dossier,
several initial-coverage variants, multiple extras, multiple memos, and trigger
conditions. Representing those as named Markdown sections would require a
fragile custom document parser. JSON was rejected as the authoring source
because escaping multiline prose and managing commas makes routine writing
unnecessarily awkward.

## Directory layout

```text
content/
|-- opportunities/
|   |-- charities/
|   |   `-- locally-staffed-hospital.opportunity.yaml
|   |-- companies/
|   |   |-- example-fusion.opportunity.yaml
|   |   `-- regional-casino.opportunity.yaml
|   `-- real-estate/
|       `-- mixed-income-housing.opportunity.yaml
|-- global-events/
`-- endings/
```

Subdirectories are for human organization. The `category` field is
authoritative. Moving a file must not change its identity or invalidate saves.
The compiler discovers all `*.opportunity.yaml` files recursively, so adding an
opportunity does not require updating an import list or manifest.

## File conventions

- One opportunity per file.
- Use YAML 1.2 and UTF-8.
- Use two spaces for indentation and never tabs.
- Include `schema_version: 1` at the top.
- Give the opportunity and every nested document a stable, unique ID.
- Use lowercase namespaced IDs such as `charity.locally-staffed-hospital`.
- Use `_markdown` only for fields interpreted as Markdown.
- Headlines, labels, IDs, and accessibility text are plain strings.
- Use `|` for multiline Markdown and preserve readable blank lines.
- Do not use YAML anchors, aliases, custom tags, or executable expressions.
- Express money in integer dollars in fields ending `_dollars`.
- Use named trigger objects, not JavaScript or string expressions.

## Recommended structure

```yaml
schema_version: 1
id: charity.locally-staffed-hospital
category: charity
name: Community Health Partnership
status: draft

tags:
  - health
  - capacity-building

availability:
  first_day: 1
  last_day: 30

dossier:
  summary: Builds a hospital and trains a permanent local workforce.
  body_markdown: |
    The partnership proposes a new regional hospital governed with local health
    authorities.

    **The proposal includes:**

    - Training and employing local physicians, nurses, and administrators.
    - A five-year transfer of operating authority.
    - Independent procurement review.

rules:
  absorptive_capacity_dollars: 1200000000
  world_effects:
    health_capacity: 8
    dependency: -4
  overfunding:
    begins_above_dollars: 1500000000
    effects:
      waste: 3
      fraud_exposure: 1

initial_coverage:
  - id: ordinary
    priority: 10
    when:
      always: true
    headline: Church announces major regional health investment
    body_markdown: |
      The church has committed substantial funds to a new hospital partnership.
      Supporters emphasized the plan to train and employ local staff.

memos:
  - id: good-job-capacity
    priority: 20
    when:
      allocation_at_most_dollars: 1200000000
    deliver_after_days: 3
    subject: Strong early operating plan
    body_markdown: |
      Local hiring and training milestones are ahead of schedule. This appears
      to be the kind of durable institution the board hoped to support.

extras:
  - id: overfunding-procurement
    priority: 30
    when:
      allocation_above_dollars: 1500000000
    publish_after_days: 5
    headline: Hospital windfall overwhelms procurement controls
    body_markdown: |
      Contractors have multiplied following the unusually large commitment,
      while the hospital partnership struggles to review bids.

effects:
  - when:
      allocation_at_most_dollars: 1200000000
    manifest_after_days: 1
    apply:
      world_health: 8
  - when:
      allocation_above_dollars: 1500000000
    manifest_after_days: 3
    apply:
      waste: 3
      pr: -2
```

The precise list of rule and trigger labels will evolve with the simulation.
The important constraint is that every label belongs to a documented registry
and is validated. Authors combine known labels; they do not write code.

Every entry in `effects` must declare `manifest_after_days`. A value of `0`
applies the consequence during authorization and can fire the player immediately.
A positive value schedules it for that many campaign days after the allocation.
Different opportunities can therefore be timed so their effects mature on the
same day. Article and memo timing remains independently authored because the
institution may learn about an outcome before or after its public consequences.

## Markdown fields

Markdown is allowed in dossier bodies, article bodies, memo bodies, supporting
records, and ending prose. The initial supported syntax should be:

- Paragraphs and line breaks.
- Emphasis and strong emphasis.
- Ordered and unordered lists.
- Block quotations.
- Links.
- Tables where a document template permits them.
- A small heading range inside long dossiers.

Raw HTML, scripts, embedded iframes, and arbitrary component syntax are not
allowed. Images should be referenced through a structured asset field rather
than arbitrary Markdown image URLs, allowing the build to verify local files,
alternative text, dimensions, and licenses.

The Markdown renderer should use the same configuration in the game and the
authoring preview so content cannot change layout after compilation.

## Trigger format

Triggers must be labeled data. A simple trigger is concise:

```yaml
when:
  allocation_above_dollars: 1500000000
```

Compound triggers use explicit `all`, `any`, and `not` collections:

```yaml
when:
  all:
    - minimum_total_allocation_dollars: 2500000000
    - committed_by_day: 20
    - not:
        company.harmful_product: true
```

Each registered trigger has documented value types and semantics. Unknown
labels are errors. There is no `eval`, embedded JavaScript, or general-purpose
expression language.

If two document variants match, the highest numeric `priority` wins. Equal
priority is resolved by stable document ID, but the validator should warn so
authors can make the intended ordering explicit.

## Memos that precede extras

A memo and its related extra remain separate entries in the same opportunity.
Their relationship can be declared explicitly:

```yaml
memos:
  - id: reactor-warning
    related_extra: reactor-failure
    when: { success_conditions_met: false }
    deliver_after_days: 5
    subject: Test program has been terminated
    body_markdown: |
      The technical team does not expect the project to recover.

extras:
  - id: reactor-failure
    when: { success_conditions_met: false }
    publish_after_days: 6
    headline: Church loses billions on fusion gamble
    body_markdown: |
      The speculative energy project has ceased operations.
```

Validation should confirm that a related warning memo arrives before its extra.
A memo may also stand alone, as with a private “good job” message.

## Content compilation

The development and production build performs these steps:

1. Recursively discover `*.opportunity.yaml` files.
2. Parse them in YAML 1.2 mode with aliases and custom tags disabled.
3. Validate the complete object with a versioned schema.
4. Validate stable IDs, referenced assets, triggers, effects, and relationships.
5. Parse every `_markdown` field using the approved Markdown configuration.
6. Report errors with the source filename, field path, and line number.
7. Emit normalized JSON bundles for the browser.
8. Generate an author preview showing every dossier, article, extra, and memo.

The compiled JSON is disposable build output. Save files refer to stable
opportunity and document IDs, never filenames or array positions.

## Author experience

The repository should eventually provide commands equivalent to:

```text
npm run content:check
npm run content:preview
npm run content:new -- charity locally-staffed-hospital
```

The creation command should copy a commented example template. The validation
command should be fast enough to run while writing and should use direct error
messages such as:

```text
content/opportunities/companies/example-fusion.opportunity.yaml:42
extras[1].when: unknown trigger "market_maybe_improves"
```

This authoring path is a first-class feature of the project, not merely an
implementation detail.
