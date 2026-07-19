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
| Story 004 Concepts + Program docs discovery / links | `src/lib/verify/concepts-program-docs-discovery-r02-convergence.test.ts` |
| Story 005 focused inventory/search/sitemap/link lock | `src/lib/verify/focused-repair-suites-r02-convergence.test.ts` |
| Story 007 Pages-prefixed rebuild + guard lock | `src/lib/verify/pages-prefixed-rebuild-r02-convergence.test.ts` |
| Story 008 browser/visual review inventory + lock | `src/lib/verify/browser-visual-review-r02-gate.ts` / `browser-visual-review-r02-convergence.test.tsx` |
| Pages deploy guard implementation | `src/lib/build/guard-pages-deployed-artifact.ts` / `scripts/guard-pages-deployed-artifact.ts` |
| Link inventory (factory URLs, not Atlas) | `src/lib/build/validate-links.test.ts` |

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
bun test \
  src/lib/navigation/explorer-ia-contract.test.ts \
  src/tests/layout/desktop-mobile-explorer-parity.test.tsx \
  src/lib/i18n/route-locale.test.ts \
  src/lib/i18n/locale-routing.test.ts \
  src/lib/content/factory-locale-base-path.test.tsx \
  src/lib/theme/host-semantic-theme-tokens.test.ts \
  src/features/docs/styles/docs-code-copy-chrome.test.ts \
  src/lib/verify/brand-theme-code-copy-r02-convergence.test.tsx \
  src/lib/verify/theme-code-copy-r00-gate.test.ts \
  src/features/docs/components/DocsCodeCopyButton.test.tsx \
  src/lib/verify/a11y-responsive-contract.test.ts \
  src/tests/a11y/responsive-overflow.a11y.test.tsx \
  src/tests/a11y/content-column-brand-alignment.a11y.test.tsx \
  src/tests/a11y/docs-code-block.a11y.test.tsx \
  src/tests/a11y/docs-sidebar-navigation.a11y.test.tsx \
  src/tests/a11y/primary-navigation.a11y.test.tsx \
  src/lib/content/factory-only-public-inventory.test.tsx \
  src/lib/docs/docs-collection-definition-inventory-verification.test.ts \
  src/lib/verify/concepts-program-docs-discovery-r02-convergence.test.ts \
  src/lib/content/factory-search-navigation-convergence.test.tsx \
  src/lib/content/factory-search-categories.test.tsx \
  src/lib/content/factory-search-alias-body-tag.test.ts \
  src/lib/content/factory-search-deleted-records.test.ts \
  src/lib/seo/public-sitemap-routes.test.ts \
  src/lib/seo/export-sitemap.test.ts \
  src/lib/content/factory-prev-next-related.test.tsx \
  src/lib/build/validate-links.test.ts \
  src/lib/verify/plan-issues-r02-reconciliation.test.ts \
  src/lib/verify/focused-repair-suites-r02-convergence.test.ts \
  src/lib/verify/pages-prefixed-rebuild-r02-convergence.test.ts \
  src/lib/verify/browser-visual-review-r02-convergence.test.tsx \
  src/lib/build/guard-pages-deployed-artifact.test.ts \
  src/lib/build/deploy-pages-workflow-contract.test.ts
make typecheck
```

### Story 007 Pages-prefixed rebuild commands

```bash
GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs make build
make guard-pages-deployed-artifact
```

Run the guard immediately against the same `out/` from the prefixed rebuild.
Do not run an intervening unprefixed `make build` before the guard.

Do **not** include Atlas-era `src/tests/search/orama-index.test.ts` in this focused set;
factory search proofs live under `src/lib/content/factory-search-*` and story 004/005
R02 suites (website-functionality exclusions route Atlas search under reader-facing).

## Later R02 stories

- **002** — DONE: Explorer IA / locale parity / eight-page membership (IA contract + parity suites)
- **003** — DONE: Brand, alignment, theme, code-copy (R02 convergence suite + browser verify on port 3533)
- **004** — DONE: Concepts + Program documentation discovery / links (R02 convergence suite + browser verify)
- **005** — DONE: Focused nav/locale/copy/theme/responsive/a11y/inventory/search/sitemap/link suites green; Atlas link-inventory assertions repaired
- **006** — DONE: Full local gates green (`make check/test/build/linkcheck/budget/component-coverage`); biome format on story 004 suite was the only combined-result fix
- **007** — DONE: Pages-prefixed rebuild + `make guard-pages-deployed-artifact` (live gate + R02 lock suite)
- **008** — DONE: Browser/visual review across required shells (live port 3555 + R02 lock suite)

## Story 008 browser / visual review (2026-07-11 UTC)

| Surface | Result (served HTML, port 3555) |
| --- | --- |
| home / browse / blog | You Agent Factory brand, `factory-dark`, content-column surfaces |
| `/docs/guides/getting-started` | brand, theme, inset copy rail + status |
| Concepts `/docs/concepts/skills` | title Skills; Program documentation + FAQ; no Glossary folder |
| Program docs throttling-and-limits + packaged-documents | titles; Program documentation folder; related internal hrefs (W18 move stubs are compatibility-only, not visual-review samples) |
| Mobile drawer chrome | `nd-sidebar`, Open menu, Sidebar, `aria-controls`, Sheet markers |
| Locale shells `en` / `ja` / `zh-CN` / `vi` | `lang` attr + brand + factory-dark on Concepts sample |

No cross-lane integration defects found — tip contracts already hold. Lock suite:
`browser-visual-review-r02-convergence.test.tsx` (inventory, locale paths,
published titles, explorer IA per locale, mobile drawer markers).

## Story 007 Pages-prefixed rebuild + guard (2026-07-11 UTC)

| Gate | Command | Result |
| --- | --- | --- |
| Prefixed rebuild | `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs make build` | PASS (`out/` references `/you-agent-factory-docs/_next/...`) |
| Deployed-artifact guard | `make guard-pages-deployed-artifact` | PASS (`source=reused`, `basePath=/you-agent-factory-docs`) |
| R02 lock suite | `pages-prefixed-rebuild-r02-convergence.test.ts` | PASS (base path, probe inventory, prefixed accept / unprefixed reject) |

Live proof: home HTML uses `/you-agent-factory-docs/_next/static/css/...`; no root `/_next` asset hrefs; guard HTTP-probes home, getting-started, comparing-agent-factories, search bootstrap, CSS, and JS under the project-site prefix. No unprefixed asset/search regressions found — no cross-lane repair required.

## Story 006 full local gates (2026-07-11 UTC)

| Gate | Command | Result |
| --- | --- | --- |
| check | `make check` | PASS (typecheck + lint) |
| test | `make test` | PASS (756 tests) |
| build | `make build` | PASS (static export) |
| linkcheck | `make linkcheck` | PASS |
| budget | `make budget` | PASS (out/ 127.50 MB / 130; search 5.16 / 5.30) |
| component-coverage | `make component-coverage` | PASS |

Combined-result repair: biome format drift in
`src/lib/verify/concepts-program-docs-discovery-r02-convergence.test.ts`
(import / join / expect wrapping) blocked `make check`; fixed with
`biome check --write`. No budget raise required.

## Story 005 focused suites contract

| Surface | Expected | Proof |
| --- | --- | --- |
| Navigation / locale | Explorer IA + desktop/mobile parity + locale routing | `explorer-ia-contract`, `desktop-mobile-explorer-parity`, `route-locale`, `locale-routing`, `factory-locale-base-path` |
| Code-copy / theme / responsive / a11y | R00 contracts hold on combined tip | brand-theme-code-copy R02 + theme-code-copy-r00-gate + DocsCodeCopyButton + a11y/responsive suites |
| Inventory / search / sitemap / links | Concepts + eight Program docs present; Atlas glossary/modules absent | `focused-repair-suites-r02-convergence.test.ts` + factory-search-* + sitemap + `validate-links.test.ts` |
| Combined-result repair | Link inventory no longer asserts retired Atlas module/glossary URLs | `validate-links.test.ts` factory URL membership |

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

## Story 004 Concepts / Program documentation discovery contract

| Surface | Expected | Proof |
| --- | --- | --- |
| Concepts Skills / MCP / Tool calling / Tokens | Route + metadata + concepts index card | `concepts-program-docs-discovery-r02-convergence.test.ts` |
| Remaining discoverable Program documentation pages | Route + metadata + documentation index card (`throttling-and-limits`, `packaged-documents`) | same |
| Demoted W18 Program stubs | Published + family Metadata canonical; absent from search/sitemap/section index; family routes remain searchable | same + `factory-documentation-route-migration-demoted-contract.test.tsx` |
| Search documents + representative queries | Indexed under `concept` / `documentation` kinds for discoverable pages; stubs omitted | same |
| Public sitemap | Discoverable URLs included; demoted stub URLs excluded | same |
| Locale path policy | `en` unprefixed; `ja` / `zh-CN` / `vi` prefixed | same |
| LocalizedLinkList + registry `relatedIds` | Resolve to published docs URLs or W18 family targets (use `getPublishedDocsEntryByRegistryId` / `source.getPage` / `listDocumentationRouteMigrationTargetRoutes`; documentation kinds are not in `getRegistryRecordById`) | same |
| Browser spot-check | One Concepts + two non-stub Program pages load with title + at least one related link | port 3544 static serve |

### Pattern: demote W18 move stubs in R02 discovery / visual-review proofs

When Program documentation move stubs are excluded from explorer/search, update
R02 suites that still treat those stub URLs as ordinary documentation
destinations:

1. Keep stub URLs in **link inventory** / published presence proofs (compatibility).
2. Remove stub URLs from **search documents**, **sitemap**, **section-index**,
   and **browser visual-review Program documentation samples**.
3. Point representative search queries at **family destinations**.
4. Accept W18 family target hrefs in LocalizedLinkList validation (App Router
   family indexes are not always MDX published entries).
5. Keep colocated stub `*-page.test.tsx` as compatibility HTML proofs and
   `*-discoverability.test.tsx` as ledger-target-only stubs (no ordinary body
   discovery assertions).
