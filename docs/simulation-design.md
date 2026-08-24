# Simulation and Game Systems

## Daily state machine

Every normal day follows the same explicit sequence:

1. Deliver ordinary headlines reacting to the latest apportionments.
2. Deliver an extra or internal memo only if a notable trigger fired.
3. Allow dossiers and prior records to be reviewed.
4. Allow allocations to be drafted and revised.
5. Validate the ledger and any daily constraints.
6. Require a deliberate stamp or signature to commit the decision.
7. Resolve immediate effects and schedule delayed effects.
8. Advance time and evaluate the following day's deterministic document triggers.

Exceptional story events may add a document, deadline, or constrained choice,
but should not replace the core loop.

## Principal game state

The domain state should include:

- Day number and campaign phase.
- Uncommitted original principal.
- Permanent holdings and their current values.
- Leadership confidence.
- Public and member sentiment.
- Actual social benefit by cause and population.
- Fraud, investigation, and scandal exposure.
- Organization and project states.
- Scheduled effects that have not yet surfaced.
- Known and hidden facts.
- Decision, transaction, and event history.
- Ruleset, campaign, and save-format version information.

Public opinion, leadership confidence, social benefit, and financial position
must remain separate. No single number should define success.

Each opportunity effect declares how many days after its allocation it
manifests. The engine resolves all effects due on a day together. This permits
several apparently quiet decisions to mature simultaneously into a combined
social, financial, and public-relations crisis.

## Opportunity model

An opportunity represents a charity, investment, or development that can
receive funds. It has authored characteristics and effect rules:

```ts
interface Opportunity {
  id: string;
  category: "charity" | "investment" | "development";
  absorptiveCapacity: Money;
  effectiveness: number;
  governanceQuality: number;
  fraudRisk: number;
  incentiveDistortion: number;
  publicAppeal: number;
  controversyTags: string[];
  effects: EffectDefinition[];
  initialCoverage: ArticleDefinition[];
  extras: TriggeredArticleDefinition[];
  memos: TriggeredMemoDefinition[];
}
```

Exact values are internal. Dossiers communicate estimates, confidence ranges,
auditor opinions, and institutional claims rather than exposing statistics.
All consequences are deterministic even when the relevant trigger is hidden.

## Charitable allocations

Charitable benefit should usually follow a saturating curve. Early funding can
serve high-value unmet needs; later funding is harder to deploy effectively.
Giving beyond absorptive capacity should increase rushed hiring, weak controls,
vendor inflation, duplicated programs, and opportunities for fraud.

A conceptual model is:

```text
gross benefit = effectiveness * saturating(allocation / capacity)
risk pressure = nonlinear excess(allocation - capacity)
net benefit   = gross benefit - waste - induced harm
```

The formula should not be identical for every charity. Capacity-building
charities create durable local skill and control—for example, a hospital built
and staffed with trained local workers. Emergency relief may
have high short-term capacity but poor long-term leverage. Research may absorb
large sums slowly. Direct cash assistance may have excellent administrative
efficiency but cause local price or political effects under certain conditions.

## Cobra effects

A cobra effect occurs when rewards tied to a proxy cause participants to game
the proxy or increase the underlying problem. These effects should be authored
as causal chains rather than arbitrary punishment.

Example chain:

1. A bounty program receives a large allocation.
2. The measured nuisance declines and favorable news appears.
3. The bounty becomes a reliable source of income.
4. Suppliers begin producing the nuisance intentionally.
5. An internal audit notices inconsistent sourcing.
6. The player may reform, terminate, conceal, or expand the program.

Signals should exist before the final consequence so a careful player can act
without needing to memorize content.

## Fraud, waste, and abuse

Fraud risk should depend on more than allocation size:

- Recipient governance and audit capacity.
- Speed of disbursement.
- Amount relative to existing annual spending.
- Complexity and number of intermediaries.
- Oversight conditions selected by the player.
- Prior investigations and staff warnings.
- Local political or market conditions.

Fraud events should distinguish attempted fraud, actual loss, detected loss,
and public scandal. An undiscovered theft harms impact without immediately
harming reputation. A well-controlled detection may create negative coverage
while demonstrating that oversight worked.

## Company classifications

Most companies should be neutral: they conduct ordinary commerce, can create
jobs or useful products, and can increase or lose value without a large direct
moral score. Some companies are affirmatively harmful. Casinos and addictive
drug manufacturers create deterministic social harm that profitability does not
erase. Some companies can be positively transformative, but they should earn
that status from their actual activity rather than from being an investment.

## Investments

Investments commit principal and can generate proceeds, employment, technology,
tax revenue, political influence, environmental costs, or market concentration.
They should be evaluated on both portfolio and social dimensions.

Media reaction may be hostile to visible gains even when an investment funds
useful activity. Conversely, a fashionable investment may receive favorable
coverage despite poor fundamentals or hidden harms.

Investments are not sold during the campaign. Buying a holding permanently
reduces uncommitted principal. Changes in valuation affect the institution's
balance sheet and press response, but never add spendable money back to the
allocation pool.

Speculative companies such as fusion-power ventures have initially uncertain
prospects and neutral ordinary coverage. Their eventual success or failure is
determined by authored conditions such as funding level, timing, or other world
state—not randomness. Failure can trigger an extra condemning the gamble;
success can trigger an extra condemning the institution's profit.

## Real-estate development

Developments combine investment behavior with local physical consequences:

- Construction and permanent employment.
- Housing or commercial supply.
- Displacement and land-price changes.
- Environmental and infrastructure burdens.
- Neighborhood amenities.
- Long-term operating income.
- Visibility and reputational exposure.

Location, design, tenant policy, and community agreements should matter. A
development is not inherently good or bad solely because it earns money.

## Oversight actions

The player may eventually be allowed to attach conditions to an allocation:

- Staged disbursement.
- Independent audit.
- Outcome reporting.
- Local governance participation.
- Matching requirements.
- Anonymous or public attribution.
- A pilot phase before expansion.

Conditions consume staff time, delay benefits, or reduce positive publicity,
but can increase information quality and reduce risk. The vertical slice should
use only one or two of these to avoid an oversized initial ruleset.

## Information and uncertainty

The true simulation state is not directly shown. Documents provide observations
with a source, delay, and bias. Ordinary headlines are the initial press
reaction to apportionments. Extras appear only when a later consequence becomes
notable; most sound allocations never generate one. Internal memos are also
exceptional and usually warn about a notable development one day before the
related extra. They may occasionally congratulate the player.

Reports should sometimes disagree. The player should be able to distinguish an
uncertain measurement from a writer's opinion.

## Endings

The campaign ends when the original $100 billion has been irrevocably committed,
or immediately when sufficiently bad public relations causes the player to be
fired. Making the world noticeably worse produces public-relations damage as
the harm becomes visible, even if earlier coverage was favorable.

Ending selection should examine dimensions independently:

- Long-term social benefit and induced harm.
- Distribution of benefits.
- Fraud losses and institutional learning.
- Financial resilience and the value of permanent holdings.
- Leadership confidence.
- Public and member sentiment.
- Unresolved investigations.
- Major narrative choices.

An ending is assembled from compatible authored epilogue sections rather than
chosen from one numeric ranking.
