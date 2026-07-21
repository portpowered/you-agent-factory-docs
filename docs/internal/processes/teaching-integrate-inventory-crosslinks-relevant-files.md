# Teaching Integrate — Inventory / Cross-Links — Relevant Files

Use these files for Graph-pages Wave B **W-integrate**: truthful inventory of
landed teaching surfaces, soft-wired reader cross-links only when destinations
exist, live-route/a11y smoke notes, and registry CI confirmation. Do **not**
create sibling-owned MDX, rewrite teaching-ui/registry schemas, or mix
page-formatting / homepage-2 / SEO work.

## Inventory (this lane)

| Path | Role |
| --- | --- |
| `docs/documentation-site-pages-needed.md` | Committed page inventory; Wave A harnesses + registries live under a **maintainer/dev** section (not fake public customer pages) |
| `docs/internal/processes/teaching-ui-recipes-chassis-relevant-files.md` | Chassis harness ownership |
| `docs/internal/processes/teaching-ui-lists-relevant-files.md` | Lists harness ownership |
| `docs/internal/processes/teaching-ui-filterable-sortable-table-relevant-files.md` | Tables / chassis table slot |
| `docs/internal/processes/factory-components-host-integration-relevant-files.md` | Charts harness notes |
| `docs/internal/processes/teaching-model-pricing-registry-relevant-files.md` | Model pricing registry ownership |

## Landed Wave A surfaces (inventory targets)

| Surface | Path / route |
| --- | --- |
| Teaching-ui chassis + tables harness | `/teaching-ui-harness` → `src/app/(dev)/teaching-ui-harness/` |
| Charts harness | `/teaching-ui-charts-harness` → `src/app/(dev)/teaching-ui-charts-harness/` |
| Lists harness | `/teaching-ui-lists-harness` → `src/app/(dev)/teaching-ui-lists-harness/` |
| Model pricing registry | `src/content/registry/models/**` + `src/lib/content/model-pricing.ts` |
| Orchestrator feature registry | `src/content/registry/orchestrators/**` + `src/lib/content/orchestrators.ts` |

## Soft-wire destinations (inventory / link only when present)

| Route | Content / registry cue | Integrate status (re-check each pass) |
| --- | --- | --- |
| `/docs/techniques/planner-executor-in-action/` | Technique content bundle + registry entry when landed | Soft-skipped 2026-07-21 UTC — absent from `main` (sibling worktree has MDX; no open PR / not merged) |
| `/blog/comparing-orchestrators/` | Blog content bundle + registry entry when landed | Soft-skipped 2026-07-21 UTC — absent from `main` (sibling worktree has MDX; no open PR / not merged) |
| `/docs/techniques/planner-executor/` | Existing glossary technique (cross-link source) | Present — **no in-action cross-link edits** until destination lands |
| `/blog/comparing-agent-factories/` (or nearest comparison slug) | Existing comparison post (cross-link peer) | Present — **no orchestrator cross-link edits** until destination lands |

Sibling branches may exist (`teaching-technique-planner-executor-in-action`,
`teaching-blog-comparing-orchestrators`) while still off `main`. Soft-inventory
and soft-wire only after those routes land on the base branch — never invent
MDX or done inventory rows from in-flight sibling worktrees.

### Soft-wire pass log

| Story | Outcome | UTC check |
| --- | --- | --- |
| `003` planner-executor ↔ in-action | Soft-skipped — destination absent on `origin/main`; no technique MDX edits | 2026-07-21 11:12 UTC |
| `004` comparing-orchestrators ↔ comparing-agent-factories | Soft-skipped — destination absent on `origin/main`; no blog MDX edits | 2026-07-21 11:11 UTC |

### Live-route / a11y smoke + registry CI pass log

Record observable maintainer outcomes only (route loads; keyboard-reachable
critical regions; `make validate-data` / CI green). Soft-skip missing Wave B
customer routes — do not invent browser smoke fiction for unlanded pages.

| Surface | Outcome | UTC check |
| --- | --- | --- |
| `/docs/techniques/planner-executor-in-action/` live-route + a11y smoke | Soft-skipped — route absent on `origin/main` / integrate HEAD; no browser verify | 2026-07-21 11:16 UTC |
| `/blog/comparing-orchestrators/` live-route + a11y smoke | Soft-skipped — route absent on `origin/main` / integrate HEAD; no browser verify | 2026-07-21 11:16 UTC |
| Model pricing + orchestrator registries (`make validate-data`) | **Passed** — `bun ./scripts/validate-registry.ts` → “Registry validation passed.” (same hook as `make ci`) | 2026-07-21 11:16 UTC |

When a soft-skipped customer route later lands on the base branch, re-run a short
live-route load + keyboard smoke for that page and append a new row here.

## Patterns

* Inventory unfinished Wave B siblings as **skipped**, never as invented done rows.
* Mark `(dev)` harnesses explicitly as maintainer/dev — not public customer pages.
* Soft-wire cross-links only when the destination route already exists on the base
  branch; prefer LocalizedLinkList / in-body / blog related patterns already used
  on those pages — do not restore stripped RelatedDocs footer chrome.
* Registry validation stays on existing hooks (`make validate-data` /
  `scripts/validate-registry.ts`); do not invent schemas or rewrite loaders from
  this lane.
* Live-route / a11y smoke notes belong in this process pass log (and a short
  inventory pointer): soft-skip missing Wave B customer routes; never invent
  browser smoke fiction for unlanded pages.
* Teaching stays site-internal under `src/features/teaching-ui/` + page-local
  composers — no `@you-agent-factory/components` API expansion.
