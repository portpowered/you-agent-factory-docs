# Teaching Integrate — Inventory / Cross-Links — Relevant Files

Use these files for Graph-pages Wave B **W-integrate**: truthful inventory of
landed teaching surfaces, soft-wired reader cross-links only when destinations
exist, live-route/a11y smoke notes, and registry CI confirmation. Do **not**
create sibling-owned MDX, rewrite teaching-ui/registry schemas, or mix
page-formatting / homepage-2 / SEO work.

## Inventory (this lane)

| Path | Role |
| --- | --- |
| `docs/documentation-site-pages-needed.md` | Committed page inventory; Wave A/B harnesses + registries live under a **maintainer/dev** section (not fake public customer pages); Wave B customer routes inventoried as **present** once landed |
| `docs/internal/processes/teaching-ui-recipes-chassis-relevant-files.md` | Chassis harness ownership |
| `docs/internal/processes/teaching-ui-lists-relevant-files.md` | Lists harness ownership |
| `docs/internal/processes/teaching-ui-filterable-sortable-table-relevant-files.md` | Tables / chassis table slot |
| `docs/internal/processes/factory-components-host-integration-relevant-files.md` | Charts harness notes |
| `docs/internal/processes/teaching-model-pricing-registry-relevant-files.md` | Model pricing registry ownership |
| `docs/internal/processes/teaching-model-cost-playground-relevant-files.md` | Model-cost playground + `/model-cost-playground-harness` ownership |

## Landed Wave A / Wave B maintainer surfaces (inventory targets)

| Surface | Path / route |
| --- | --- |
| Teaching-ui chassis + tables harness | `/teaching-ui-harness` → `src/app/(dev)/teaching-ui-harness/` |
| Charts harness | `/teaching-ui-charts-harness` → `src/app/(dev)/teaching-ui-charts-harness/` |
| Lists harness | `/teaching-ui-lists-harness` → `src/app/(dev)/teaching-ui-lists-harness/` |
| Cost-playground / model-cost harness | `/model-cost-playground-harness` → `src/app/(dev)/model-cost-playground-harness/` (+ `src/features/teaching-pages/ModelCostPlayground/`) — **maintainer/dev only**, not a public customer page |
| Model pricing registry | `src/content/registry/models/**` + `src/lib/content/model-pricing.ts` |
| Orchestrator feature registry | `src/content/registry/orchestrators/**` + `src/lib/content/orchestrators.ts` |

## Soft-wire destinations (inventory / link when present)

| Route | Content / registry cue | Integrate status (re-check each pass) |
| --- | --- | --- |
| `/docs/techniques/planner-executor-in-action/` | `src/content/docs/techniques/planner-executor-in-action/` | **Present** (landed #233, 2026-07-21 UTC) — soft-wire glossary→in-action **done** (Wave B landed `002`) |
| `/blog/comparing-orchestrators/` | `src/content/blog/comparing-orchestrators/` | **Present** (landed #232, 2026-07-21 UTC) — reciprocal in-body hop from agent-factories **done** (Wave B landed `003`) |
| `/docs/techniques/planner-executor/` | Existing glossary technique (cross-link source) | Present — LocalizedLinkList hop to in-action **done** (Wave B landed `002`) |
| `/blog/comparing-agent-factories/` (or nearest comparison slug) | Existing comparison post (cross-link peer) | Present — in-body hop to comparing-orchestrators **done** (Wave B landed `003`) |

Prior soft-skip rows (2026-07-21 ~11:11 UTC) that treated Wave B customer routes as
absent from `main` are **superseded**. Destinations landed via #232 / #233;
cost-playground harness landed via #231. Soft-wire hops and live-route/a11y smoke
are recorded in the pass logs below (Wave B landed follow-up stories `002`–`004`).

### Soft-wire pass log

| Story | Outcome | UTC check |
| --- | --- | --- |
| `003` planner-executor ↔ in-action | Soft-skipped — destination absent on `origin/main`; no technique MDX edits | 2026-07-21 11:12 UTC |
| `004` comparing-orchestrators ↔ comparing-agent-factories | Soft-skipped — destination absent on `origin/main`; no blog MDX edits | 2026-07-21 11:11 UTC |
| Wave B landed follow-up inventory | Destinations **present** on `main` (#232 / #233); soft-wire still pending follow-up stories (glossary→in-action; agent-factories→orchestrators) | 2026-07-21 11:55 UTC |
| Wave B landed `002` glossary→in-action | **Done** — `/docs/techniques/planner-executor/` LocalizedLinkList → `/docs/techniques/planner-executor-in-action/`; reverse back-link left intact | 2026-07-21 12:05 UTC |
| Wave B landed `003` agent-factories→orchestrators | **Done** — `/blog/comparing-agent-factories/` in-body hop → `/blog/comparing-orchestrators/`; reverse in-body link left intact (`relatedDocIds` stay docs-only) | 2026-07-21 12:15 UTC |

### Live-route / a11y smoke + registry CI pass log

Record observable maintainer outcomes only (route loads; keyboard-reachable
critical regions; `make validate-data` / CI green). Soft-skip only when a
customer route is still absent — do not invent browser smoke fiction for
unlanded pages.

| Surface | Outcome | UTC check |
| --- | --- | --- |
| `/docs/techniques/planner-executor-in-action/` live-route + a11y smoke | Soft-skipped — route absent on `origin/main` / integrate HEAD; no browser verify | 2026-07-21 11:16 UTC |
| `/blog/comparing-orchestrators/` live-route + a11y smoke | Soft-skipped — route absent on `origin/main` / integrate HEAD; no browser verify | 2026-07-21 11:16 UTC |
| Wave B customer routes (inventory status) | **Present** on `main` (#232 / #233) — smoke notes deferred to follow-up integrate story (routes no longer inventoried as absent) | 2026-07-21 11:55 UTC |
| `/docs/techniques/planner-executor-in-action/` live-route + a11y smoke | **Passed** — Playwright@`127.0.0.1:3431` loaded HTTP 200 / h1 “Planner-Executor In Action”; sections `intro`/`pattern-list`/`playground`/`compare-chart`/`recommendation` present; teaching-list + playground placeholder + comparative bar chart reachable; Tab focused back-link `/docs/techniques/planner-executor` | 2026-07-21 12:25 UTC |
| `/blog/comparing-orchestrators/` live-route + a11y smoke | **Passed** — Playwright@`127.0.0.1:3431` loaded HTTP 200 / h1 “Comparing orchestrators by feature attributes”; matrix + focus controls + table present; Tab reached Focus column/row `<select>`s and a filter checkbox; programmatic focus OK on both selects + first checkbox; reverse link to `/blog/comparing-agent-factories` present | 2026-07-21 12:25 UTC |
| `/model-cost-playground-harness` (+ teaching-ui harnesses) | **Maintainer-only** — not customer smoke targets for public-page claims (landed #231; Wave A harnesses remain `(dev)`) | 2026-07-21 12:25 UTC |
| Model pricing + orchestrator registries (`make validate-data`) | **Passed** — `make validate-data` → `bun ./scripts/validate-registry.ts` → “Registry validation passed.” (same hook as `make ci`); reconfirmed after Wave B landings | 2026-07-21 12:25 UTC |

Prior absent-route soft-skip smoke rows (2026-07-21 11:16 UTC) are **superseded** by the
2026-07-21 12:25 UTC Passed rows above. When a soft-skipped customer route later
lands on the base branch, re-run a short live-route load + keyboard smoke for
that page and append a new row here.

### Components API fence pass log

Confirm Wave A/B teaching integrate work did not expand
`@you-agent-factory/components`. Teaching stays under `src/features/teaching-ui/`
+ `src/features/teaching-pages/` + page-local composers.

| Check | Outcome | UTC check |
| --- | --- | --- |
| Lane diff vs `origin/main` (inventory story) | **Docs-only** — `documentation-site-pages-needed.md` + this process note; no `packages/`, no `node_modules/@you-agent-factory/components` edits, no `src/features/teaching-ui/` recipe rewrites | 2026-07-21 11:20 UTC |
| Sibling-owned MDX / PF strip / homepage-2 / SEO (inventory story) | **None mixed in** — inventory/process-note only in this inventory story | 2026-07-21 11:55 UTC |
| Wave B customer route inventory | Prior soft-skips **superseded** — routes inventoried as **present** after #232 / #233 landings | 2026-07-21 11:55 UTC |
| Wave B landed follow-up closeout (`001`–`005`) | **Fence held** — lane paths are inventory/process notes + additive glossary LocalizedLinkList/locale labels + agent-factories in-body hop + page tests only; package stays host-consumed `0.0.0` / no public export growth; no teaching-ui recipe / ModelCostPlayground calc / registry schema rewrites; no RelatedDocs chrome restore; no PF / homepage-2 / SEO / explorer-map mix-ins | 2026-07-21 12:35 UTC |
| Prior soft-skipped Wave B integrate steps | **Closed completed** — present + soft-wired + live-route/a11y smoked + `make validate-data` reconfirmed (see soft-wire + smoke pass logs above); soft-skip rows remain historical only | 2026-07-21 12:35 UTC |

## Patterns

* Inventory unfinished Wave B siblings as **skipped**, never as invented done rows;
  once routes land on `main`, supersede soft-skips with **present** inventory rows.
* Mark `(dev)` harnesses (including `/model-cost-playground-harness`) explicitly as
  maintainer/dev — not public customer pages.
* Soft-wire cross-links only when the destination route already exists on the base
  branch; prefer LocalizedLinkList / in-body / blog related patterns already used
  on those pages — do not restore stripped RelatedDocs footer chrome.
* Registry validation stays on existing hooks (`make validate-data` /
  `scripts/validate-registry.ts`); do not invent schemas or rewrite loaders from
  this lane.
* Live-route / a11y smoke notes belong in this process pass log (and a short
  inventory pointer): soft-skip missing Wave B customer routes; never invent
  browser smoke fiction for unlanded pages; after landings, append a fresh
  **Passed** smoke row (route load + Tab/focus on critical controls) rather than
  leaving the absent-route soft-skip as live truth. Harness routes stay
  maintainer-only — not customer smoke targets.
* Teaching stays site-internal under `src/features/teaching-ui/` +
  `src/features/teaching-pages/` + page-local composers — no
  `@you-agent-factory/components` API expansion.
