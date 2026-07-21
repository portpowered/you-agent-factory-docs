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

| Route | Content / registry cue |
| --- | --- |
| `/docs/techniques/planner-executor-in-action/` | Technique content bundle + registry entry when landed |
| `/blog/comparing-orchestrators/` | Blog content bundle + registry entry when landed |
| `/docs/techniques/planner-executor/` | Existing glossary technique (cross-link source) |
| `/blog/comparing-agent-factories/` (or nearest comparison slug) | Existing comparison post (cross-link peer) |

## Patterns

* Inventory unfinished Wave B siblings as **skipped**, never as invented done rows.
* Mark `(dev)` harnesses explicitly as maintainer/dev — not public customer pages.
* Soft-wire cross-links only when the destination route already exists on the base
  branch; prefer LocalizedLinkList / in-body / blog related patterns already used
  on those pages — do not restore stripped RelatedDocs footer chrome.
* Registry validation stays on existing hooks (`make validate-data` /
  `scripts/validate-registry.ts`); do not invent schemas or rewrite loaders from
  this lane.
* Teaching stays site-internal under `src/features/teaching-ui/` + page-local
  composers — no `@you-agent-factory/components` API expansion.
