# Teaching Model Pricing Registry — Relevant Files

Use these files when extending commit-only teaching model pricing (`kind:
model-pricing`) under `src/content/registry/models/**`. This lane owns pricing
JSON, Zod loaders, pure cost math, and the validate-registry hook. It does **not**
own ModelCostPlayground UI, technique/blog pages, or live provider price APIs.

## Pricing-owned surface

* `src/content/registry/models/model.<provider>.<name>.json`
  Commit-only `ModelPricingRecord` seeds (USD per 1M tokens + `asOf` freshness).
* `src/lib/content/model-pricing.ts`
  Zod `modelPricingRecordSchema`, `listModelPricing()`, `getModelPricing(id)`.
  Keep teaching pricing **out of** the main page `registryKindSchema` union.
* `src/lib/content/model-cost.ts`
  Pure `calculateModelCost` / `calculateSplitPlanCost` (no filesystem or network I/O).
* `src/lib/content/validate-model-pricing.ts`
  Dedicated validation pass for `registry/models/**`. Wired into
  `validateRegistryContent` / `scripts/validate-registry.ts` (`make validate-data`).
  Optional `kind: "provider"` metadata JSON is skipped; every other JSON must parse
  as `model-pricing` (negative prices, wrong kind/currency, missing fields fail).

## Shared validate-data wiring (minimum touch)

* `src/lib/content/validate-registry.ts`
  Calls `validateModelPricing({ modelsRoot })` after blog validation. Override
  `modelsRoot` in tests; default is `<registryRoot>/models`.
* `scripts/validate-registry.ts`
  Maintainer CLI entry for `make validate-data`.

## Fixture and isolation tests

* `src/lib/content/model-pricing.test.ts` — schema + loader behavior
* `src/lib/content/model-cost.test.ts` — input/output/total token math
* `src/lib/content/validate-model-pricing.test.ts` — bad prices, malformed
  kind/currency, seeded success, and `validateRegistryContent` surfacing

## Patterns

* Prefer a dedicated validation pass over reintroducing Atlas `kind: "model"`.
* Invalid fixtures live under test temp dirs, never as committed broken production JSON.
* `generate-registry-runtime` ignores `registry/models/**` — load via `model-pricing.ts` only.
* No live price fetches; freshness is the committed `asOf` date.
* `src/content/registry/models` is **not** on `RETIRED_AI_CONTENT_OWNED_PATHS`
  (teaching pricing). Atlas `/docs/models` routes, `kind: "model"`, and
  `src/content/docs/models` remain denylisted so the path does not re-enter the
  page compile graph.

## Wave A closeout (this lane)

Wave A ships only the pricing-owned surface above. Out of scope for this branch:

* `ModelCostPlayground` / any browser cost widget
* Technique or blog pages that consume pricing
* Teaching-ui recipes or orchestrator-registry content
* Live provider price clients, fetchers, or scheduled freshness jobs

Quality gate for this lane: `bun run typecheck`, `bun run lint`, focused tests
(`model-pricing` / `model-cost` / `validate-model-pricing`), and
`bun ./scripts/validate-registry.ts`.
