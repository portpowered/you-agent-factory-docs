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
Graph-pages Wave A. They are maintainer teaching/dev surfaces — do **not** treat
them as published customer routes in the glossary, guides, documentation, or
blog inventory above. Wave B customer pages (for example
`planner-executor-in-action`, `comparing-orchestrators`) are inventoried only
when those routes already exist on the base branch; this section does not invent
them.

teaching-ui harnesses (gated; `ENABLE_COMPONENT_EXAMPLES=1` in production)
- `/teaching-ui-harness` — recipes chassis + tables fixture slot
  (`src/app/(dev)/teaching-ui-harness/`)
- `/teaching-ui-charts-harness` — comparative bar/line chart fixtures
  (`src/app/(dev)/teaching-ui-charts-harness/`)
- `/teaching-ui-lists-harness` — plain + tagged TeachingList fixtures
  (`src/app/(dev)/teaching-ui-lists-harness/`)

commit-only teaching registries (validated via `make validate-data` / registry CI)
- model pricing — `src/content/registry/models/**` (`kind: model-pricing`),
  loaders in `src/lib/content/model-pricing.ts` (+ `model-cost.ts`,
  `validate-model-pricing.ts`); not part of the page compile graph
- orchestrator feature registry — `src/content/registry/orchestrators/**`
  (`attribute-defs.json` + `orchestrator.*.json`), loaders / agreement
  validation in `src/lib/content/orchestrators.ts`

## Wave B teaching customer pages (soft-inventory)

Inventory only when the route already exists on the base branch (`main`). Do
**not** invent coming-soon rows or sibling-owned MDX from this integrate lane.

techniques (beside `planner-executor`)
- `planner-executor-in-action` (`/docs/techniques/planner-executor-in-action/`) —
  **soft-skipped** (2026-07-21 UTC): not present on `main` / this integrate
  HEAD; sibling worktrees may land it later — re-check before cross-linking.
  Cross-link soft-wire (`planner-executor` ↔ in-action) also **soft-skipped**
  for the same reason (no technique MDX edits until the destination lands).

blog (beside comparing agent factories)
- `comparing-orchestrators` (`/blog/comparing-orchestrators/`) — **soft-skipped**
  (2026-07-21 UTC): not present on `main` / this integrate HEAD; sibling
  worktrees may land it later — re-check before cross-linking.
  Cross-link soft-wire (`comparing-orchestrators` ↔ `comparing-agent-factories`)
  also **soft-skipped** for the same reason (no blog MDX edits until the
  destination lands; nearest peer remains `comparing-agent-factories`).
