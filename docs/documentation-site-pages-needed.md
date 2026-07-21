## Website structure 

Home page (page)
- CTA with (part)
	- install.sh command to install based on operating system
	- command to run `you run --named @goal/blah`
- why? (part)
	- run 100s of agents at once
- feature list (part)
	- supports various harnesses
	- supports various formats (loop, review, planner, crons, event streams, etc)
	- supports 
guides: 
- using you-agent-factory for loops (page)
- using you-agent-factory for cursor dynamic workflows (page)
- using you-agent-factory for write-review loops (page)
glossary elements
- concepts (header group)
	- harness (page)
	- loop (page)
	- tool (page)
	- thinking (page)
	- checklist (page)
	- task queue (page)
	- statistical process control graphs (page)
	- tokens (page)
	- worktree (page)
	- compaction (page)
	- bottlenecks (page)
- techniques (header group)
	- ralph (page)
	- fusion (page)
	- writer-reviewer
	- worker-adviser
	- planner-executor
	- classify-execute
	- workqueue-executor
documentation
- configuration (page)
	- workers (page)
	- workstations (page)
	- resources (page)
- replays/records (page)
- global configuration factories (page)
- harness support (page)
	- table of different harnesses we support
		- x axis is harnesses, y is features
		- harnesses
			- claude
			- codex
			- opencode
			- pi
			- cursor
			- agy
		- features
			- mcp
			- worktrees
			- loop
			- thinking controls
			- open source
			- external model support
- factory session (page)
- submitting work (page)
	- work batches (part)
	- relationships (part)
- dynamic workflows (page)
	- API interface (part)
	- configuration (part)
- cli (page)
	- install (part)
	- commands (part)
- mcp (page)
	- how to integrate (part)
- architecture of system (page)
- concepts (page)
	- petri
- logs (page)
- metrics (page)
- api doc (page)
	- openapispec generated
	- imports the components
blog list page
- comparison of different model agent factories (page)
- an examination of agent factories for building the factory docs (page)
- an examination of cursor composer after 6 billion tokens (page)
- lies, damned lies, and evals (page)
- useful list of relevant links (page)
- bottlenecks (page)
Search (page)

## Wave A teaching maintainer / dev surfaces (not public customer pages)

These are production-gated `(dev)` harnesses and commit-only registries from
Graph-pages Wave A / Wave B. They are maintainer teaching/dev surfaces — do
**not** treat them as published customer routes in the glossary, guides,
documentation, or blog inventory above.

teaching-ui harnesses (gated; `ENABLE_COMPONENT_EXAMPLES=1` in production)
- `/teaching-ui-harness` — recipes chassis + tables fixture slot
  (`src/app/(dev)/teaching-ui-harness/`)
- `/teaching-ui-charts-harness` — comparative bar/line chart fixtures
  (`src/app/(dev)/teaching-ui-charts-harness/`)
- `/teaching-ui-lists-harness` — plain + tagged TeachingList fixtures
  (`src/app/(dev)/teaching-ui-lists-harness/`)

cost-playground / model-cost harness (gated; maintainer/dev only — not a public
customer page)
- `/model-cost-playground-harness` — `ModelCostPlayground` fixture mount
  (`src/app/(dev)/model-cost-playground-harness/`); page-bespoke widget under
  `src/features/teaching-pages/ModelCostPlayground/`

commit-only teaching registries (validated via `make validate-data` / registry CI)
- model pricing — `src/content/registry/models/**` (`kind: model-pricing`),
  loaders in `src/lib/content/model-pricing.ts` (+ `model-cost.ts`,
  `validate-model-pricing.ts`); not part of the page compile graph
- orchestrator feature registry — `src/content/registry/orchestrators/**`
  (`attribute-defs.json` + `orchestrator.*.json`), loaders / agreement
  validation in `src/lib/content/orchestrators.ts`

## Wave B teaching customer pages (present)

Landed on `main` via Wave B PRs (#231 cost-playground / model-cost harness,
#232 comparing-orchestrators, #233 planner-executor-in-action). Inventory marks
these as **present** customer routes (prior soft-skip rows from the earlier
integrate pass are superseded).

techniques (beside `planner-executor`)
- `planner-executor-in-action` (`/docs/techniques/planner-executor-in-action/`) —
  **present** (landed #233, 2026-07-21 UTC). Content under
  `src/content/docs/techniques/planner-executor-in-action/`. Soft-wire
  glossary→in-action hop is a follow-up integrate story (destination ready).

blog (beside comparing agent factories)
- `comparing-orchestrators` (`/blog/comparing-orchestrators/`) — **present**
  (landed #232, 2026-07-21 UTC). Content under
  `src/content/blog/comparing-orchestrators/`. Soft-wire reciprocal hop from
  `comparing-agent-factories` is a follow-up integrate story (destination ready).

### Live-route / a11y smoke + registry verify (W-integrate)

Maintainer verify trail for this stream (detail in
`docs/internal/processes/teaching-integrate-inventory-crosslinks-relevant-files.md`):

- Wave B teaching customer routes above — **present** on base branch; live-route /
  a11y smoke notes are a follow-up integrate story (destinations no longer
  soft-skipped as absent).
- Cost-playground / model-cost harness — maintainer-only (not a customer smoke
  target for public-page claims).
- Model pricing + orchestrator registries — `make validate-data` **passed**
  (2026-07-21 11:16 UTC); same registry validation hook runs under `make ci`.

### Components API fence (W-integrate)

Lane diff review (2026-07-21 UTC): this integrate branch only updates the
committed inventory + process note above. No `@you-agent-factory/components`
public exports, package API growth, or promotion of teaching recipes into that
package. Teaching remains site-internal under `src/features/teaching-ui/` +
`src/features/teaching-pages/` + page-local composers. Prior soft-skipped Wave B
customer routes are now inventoried as **present**. No teaching-ui
recipe/registry schema rewrites, no sibling-owned MDX creation, and no
page-formatting / homepage-2 / SEO helper churn mixed in.
