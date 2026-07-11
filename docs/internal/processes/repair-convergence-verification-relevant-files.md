# Repair Convergence Verification — Relevant Files

R02 sole convergence owner after R00 (#115–#118) and R01 (#119–#122). Use this
file when reconciling `docs/temp/page-failures/plan-issues.md`, fixing
cross-lane drift, or proving the close gate.

## Primary surfaces

| Concern | Paths |
| --- | --- |
| Live failure inventory (gitignored) | `docs/temp/page-failures/plan-issues.md` |
| Repair plan / R02 close gate | `docs/temp/big-docs/plan.md` |
| Explorer brand, FAQ, folder labels | `src/lib/content/factory-breadcrumb-sidebar.ts` |
| Concepts / Program documentation subgroup maps | `src/lib/content/sidebar-grouping.ts` |
| Explorer tree signatures | `src/lib/navigation/explorer-tree-signature.ts` (`pageEntriesUnderSeparator` for subgroup membership) |
| Published docs inventory | `src/lib/content/published-docs-registry-ids.ts` |
| Theme tokens (factory-dark) | `src/lib/theme/host-semantic-theme-tokens.ts` |
| Code-copy chrome | `src/features/docs/styles/docs-code-copy-chrome.ts` |
| Story 001 tip reconciliation proofs | `src/lib/verify/plan-issues-r02-reconciliation.test.ts` |
| Story 002 explorer IA + eight-page membership | `src/lib/navigation/explorer-ia-contract.test.ts` |
| Story 002 desktop/mobile explorer parity | `src/tests/layout/desktop-mobile-explorer-parity.test.tsx` |
| Story 003 brand / alignment / theme / code-copy | `src/lib/verify/brand-theme-code-copy-r02-convergence.test.tsx` |

## Tip ancestry (story 001 evidence)

| Gate | Tip / PRs | Status on this branch |
| --- | --- | --- |
| R00 shell/navigation | #115–#118 → `5505537b` | Ancestor of HEAD |
| R01 Program documentation | #119–#122 → `4113c6a7` | HEAD (this tip) |

## plan-issues.md reconciliation (2026-07-11 UTC)

Every section checked against tip runtime / registry / explorer evidence.
**Remaining in-lane defect list:** none for inventory claims below.

| Section | Verdict | Tip evidence |
| --- | --- | --- |
| Front page spacing / Browse | FIXED | R00 #115; `content-column-brand-alignment.a11y.test.tsx`; home Browse uses shared content column |
| Explorer localization | FIXED | R00 #118; `explorer-ia-contract.test.ts`; `desktop-mobile-explorer-parity.test.tsx` |
| Explorer header brand | FIXED | `DOCS_PAGE_TREE_ROOT_NAME` = You Agent Factory; sidebar root signature |
| Glossary folder absent | FIXED | `FACTORY_SIDEBAR_FOLDER_NAMES` omits Glossary; explorer parity tests |
| Concepts groups + Skills/MCP/Tool calling/Tokens | FIXED | Published `concept.{skills,mcp,tool-calling,tokens}`; Tokens `conceptType: inference` |
| Documentation → Program documentation + FAQ top-level | FIXED | `FACTORY_EXPLORER_FOLDER_LABELS.documentation`; FAQ last in `FACTORY_EXPLORER_SECTION_ORDER` |
| Blog / title bar alignment + brand | FIXED | R00 #115; `messages.home.title` / layout brand tests |
| Guide code blocks | FIXED | R00 #117; `docs-code-copy-chrome` + theme token tests |
| Missing eight Program documentation pages | FIXED | R01 #119–#122; all eight published under `/docs/documentation/*` with declared subgroup membership |
| Colors (factory-dark) | FIXED | R00 #117; `FACTORY_DARK_FOUNDATION` / host semantic tokens |
| Execution plan R00/R01 | FIXED / gate green | Tips above; R02 in flight on this lane |

### R01 eight-page membership (tip)

| Page | Subgroup | PR |
| --- | --- | --- |
| mock-workers | functions | #120 |
| throttling-and-limits | operational | #120 |
| script-workers | configuration | #119 |
| poller-workers | configuration | #119 |
| agent-workers | configuration | #122 |
| inference-workers | configuration | #122 |
| packaged-documents | cli | #121 |
| packaged-factories | configuration | #121 |

## Focused verification commands

```bash
bun run prepare:content-runtime && bunx fumadocs-mdx
bun test src/lib/verify/plan-issues-r02-reconciliation.test.ts
bun test src/lib/navigation/explorer-ia-contract.test.ts \
  src/tests/layout/desktop-mobile-explorer-parity.test.tsx \
  src/lib/theme/host-semantic-theme-tokens.test.ts \
  src/features/docs/styles/docs-code-copy-chrome.test.ts \
  src/lib/verify/brand-theme-code-copy-r02-convergence.test.tsx \
  src/tests/a11y/content-column-brand-alignment.a11y.test.tsx \
  src/features/docs/components/DocsCodeCopyButton.test.tsx
make typecheck
```

## Later R02 stories

- **002** — DONE: Explorer IA / locale parity / eight-page membership (IA contract + parity suites)
- **003** — DONE: Brand, alignment, theme, code-copy (R02 convergence suite + browser verify on port 3533)
- **004** — Concepts + Program documentation discovery / links
- **005–007** — Focused suites, full `make` gates, Pages-prefixed guard
- **008** — Browser/visual review across required shells

Do not author net-new product pages here. Repair only cross-lane integration,
registry drift, ordering/parity, broken links, or combined-result test failures.

## Story 002 membership contract

| Surface | Declared subgroup | Proof |
| --- | --- | --- |
| Concepts skills, mcp | Harnesses | `pageEntriesUnderSeparator` in `explorer-ia-contract.test.ts` |
| Concepts tool-calling, tokens | Model inference | same |
| mock-workers | Functions | same + desktop/mobile parity link lists |
| throttling-and-limits | Operational | same |
| script/poller/agent/inference-workers, packaged-factories | Configuration | same |
| packaged-documents | CLI | same |
| FAQ | Top-level (not in Program folder) | IA + parity suites |
| Glossary folder | Absent | IA + parity suites |

## Story 003 brand / theme / code-copy contract

| Surface | Expected | Proof |
| --- | --- | --- |
| Header + explorer brand | You Agent Factory | `brand-theme-code-copy-r02-convergence.test.tsx` + browser curl |
| Home / browse / blog / docs left edge | Shared `CONTENT_COLUMN_*` surfaces, no `-m*` compensation | same + `content-column-brand-alignment.a11y.test.tsx` |
| Theme | `factory-dark` black/yellow (`#050b10` / `#f5c76f` / `#507f8c`) | same + `host-semantic-theme-tokens.test.ts` |
| Code-heavy guide | inset `1rem`, rail copy control, secondary hover/focus, checkmark + polite status | same + `DocsCodeCopyButton.test.tsx`; browser `/docs/guides/getting-started` |
