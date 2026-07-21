# Teaching Model Cost Playground — Relevant Files

Use these files when extending the page-bespoke `ModelCostPlayground` under
`src/features/teaching-pages/`. This lane owns the interactive cost widget and
its gated `(dev)` harness. It does **not** own technique/blog MDX, teaching-ui
chart recipe implementations, orchestrator matrix UI, inventory integrate, or
`@you-agent-factory/components` API expansion.

## Playground-owned surface

* `src/features/teaching-pages/ModelCostPlayground/`
  Client composer: primary/secondary model selects, planner/executor token
  inputs, live total R + breakdown via `calculateSplitPlanCost`, a comparative
  bar chart focused on the recommended plan, and recommendation copy from host
  message keys (success state only).
* `src/features/teaching-pages/ModelCostPlayground/derive-playground-cost-state.ts`
  Pure parse + cost derivation (no React / filesystem). Prefer asserting tests
  against this + displayed totals rather than Recharts pixels.
* `src/features/teaching-pages/ModelCostPlayground/derive-playground-chart-props.ts`
  Pure cost-state → `ComparativeBarChart` props. Series ids are
  `primary-only` / `split`; `focusSeriesId` equals `recommendedPlan`.
* `src/features/teaching-pages/ModelCostPlayground/resolve-recommendation-copy.ts`
  Pure plan → recommendation body from host message keys
  (`recommendationPreferPrimaryOnly` / `recommendationPreferSplit`, with
  `recommendation` fallback).
* `src/features/teaching-pages/ModelCostPlayground/types.ts`
  Public props contract: parent-supplied `models`, default model ids, and
  host-resolved `messages` strings (no hard-coded product copy in the widget).
* `src/features/teaching-pages/index.ts`
  Barrel for technique-page / harness imports.

## Soft dependencies (read, do not rewrite)

* `src/lib/content/model-cost.ts` — `calculateModelCost` / `calculateSplitPlanCost`
* `src/lib/content/model-pricing.ts` — `ModelPricingRecord` type
* `src/features/teaching-ui/charts/**` — public `ComparativeBarChart` /
  `ComparativeLineChart` exports (compose; do not rewrite recipes)

## Dev harness

* `src/app/(dev)/model-cost-playground-harness/` — gated fixture mount for
  reviewer / technique-page implementers. Inline `ModelPricingRecord[]` subset
  (≥2 distinct prices); no MDX / registry / inventory ownership.
* `model-cost-playground-harness-gate.ts` — pure
  `isModelCostPlaygroundHarnessEnabled` (allow when `NODE_ENV !== "production"`
  or `ENABLE_COMPONENT_EXAMPLES === "1"`). Prefer this helper over inlining the
  env check so gate tests stay IO-free.
* Route page calls `notFound()` when the gate is false; harness client mounts
  `ModelCostPlayground` with fixture models + resolved message strings.
* Harness tests cover gate behavior, fixture mount markers (selects, R, chart
  focus, recommendation), and token-edit → live R calc wiring — not chart pixels.

## Patterns

* Parent (page or harness) passes `models`; the production props path does not
  load registry JSON itself.
* Keep calc logic in pure helpers so component tests can prove displayed USD
  equals `calculateSplitPlanCost` for the same inputs.
* Chart values must come from the same derive helper as R — never hand-wave a
  second number path. Assert `focusSeriesId === recommendedPlan` and accent /
  muted CSS vars; do not pixel-assert Recharts output.
* Empty models, missing selected ids, and invalid token fields use explicit
  empty/error UI (`data-state`) — never silent NaN totals. Chart gets the
  matching `state="empty"|"error"` panel.
* Message keys are resolved by the host; the widget only receives strings
  (including chart title / axis / category labels and recommendation copy).
  Recommendation region uses `recommendationLabel` for its accessible name and
  selects prefer-primary / prefer-split body by `recommendedPlan`; it is omitted
  on empty/error so invalid inputs never show a misleading you-should line.
* Gated `(dev)` harnesses use `notFound()` when
  `NODE_ENV === "production" && ENABLE_COMPONENT_EXAMPLES !== "1"`.

## Out of scope

* Technique / blog MDX pages
* Orchestrator matrix UI / inventory cross-link integrate
* Teaching-ui recipe rewrites or package API expansion
* Inventing pricing schemas (use Wave A `model-pricing` records)

Quality gate for this lane: `bun run typecheck`, `bun run lint`, and focused
tests under `src/features/teaching-pages/ModelCostPlayground/`.
