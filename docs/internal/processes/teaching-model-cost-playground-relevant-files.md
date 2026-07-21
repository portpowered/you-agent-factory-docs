# Teaching Model Cost Playground — Relevant Files

Use these files when extending the page-bespoke `ModelCostPlayground` under
`src/features/teaching-pages/`. This lane owns the interactive cost widget and
(later) its gated harness. It does **not** own technique/blog MDX, teaching-ui
chart recipe implementations, orchestrator matrix UI, inventory integrate, or
`@you-agent-factory/components` API expansion.

## Playground-owned surface

* `src/features/teaching-pages/ModelCostPlayground/`
  Client composer: primary/secondary model selects, planner/executor token
  inputs, live total R + breakdown via `calculateSplitPlanCost`.
* `src/features/teaching-pages/ModelCostPlayground/derive-playground-cost-state.ts`
  Pure parse + cost derivation (no React / filesystem). Prefer asserting tests
  against this + displayed totals rather than Recharts pixels.
* `src/features/teaching-pages/ModelCostPlayground/types.ts`
  Public props contract: parent-supplied `models`, default model ids, and
  host-resolved `messages` strings (no hard-coded product copy in the widget).
* `src/features/teaching-pages/index.ts`
  Barrel for technique-page / harness imports.

## Soft dependencies (read, do not rewrite)

* `src/lib/content/model-cost.ts` — `calculateModelCost` / `calculateSplitPlanCost`
* `src/lib/content/model-pricing.ts` — `ModelPricingRecord` type
* `src/features/teaching-ui/charts/**` — comparative chart exports (story 002+)

## Patterns

* Parent (page or harness) passes `models`; the production props path does not
  load registry JSON itself.
* Keep calc logic in pure helpers so component tests can prove displayed USD
  equals `calculateSplitPlanCost` for the same inputs.
* Empty models, missing selected ids, and invalid token fields use explicit
  empty/error UI (`data-state`) — never silent NaN totals.
* Message keys are resolved by the host; the widget only receives strings.

## Out of scope

* Technique / blog MDX pages
* Orchestrator matrix UI / inventory cross-link integrate
* Teaching-ui recipe rewrites or package API expansion
* Inventing pricing schemas (use Wave A `model-pricing` records)

Quality gate for this lane: `bun run typecheck`, `bun run lint`, and focused
tests under `src/features/teaching-pages/ModelCostPlayground/`.
