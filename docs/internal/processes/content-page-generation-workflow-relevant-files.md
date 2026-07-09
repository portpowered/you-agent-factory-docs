# Content Page Generation Workflow Relevant Files

Use these files when adding or updating routine canonical docs pages (model,
concept, module, system, paper, training, glossary, or documentation). The goal
is to add page bundles and registry records without editing shared helper
surfaces for page-specific directory paths.

First published `documentation` pages also need `documentation` in
`PUBLISHED_DOCS_SECTIONS` / `documentationPageHref`, and
`registryDirectoryByKind.documentation` in the canonical page surface audit.
See [empty-cli-taxonomy-relevant-files.md](./empty-cli-taxonomy-relevant-files.md).
Published local page bundles must include Fumadocs `title` (and usually
`description`) in `page.mdx` frontmatter — `pageSchema` requires `title` once
the page is no longer excluded as draft. Local-message documentation pages also
need `documentation` in `LOCAL_DOCS_SECTIONS` plus
`documentation-page.ts` / `documentation-page-load.ts` so
`ModulePageProviders` wraps the compiled MDX (same pattern as concepts/systems).

## Derived page directory contract

Routine canonical pages live under `src/content/docs/<section>/<slug>`. Resolve
the page directory with `getDocsPageDir(section, slug)` instead of adding a new
exported `*_PAGE_DIR` constant to `src/lib/content/content-paths.ts`.

## Routine preflight for ordinary page branches

| When | Command |
| --- | --- |
| Page bundle and registry shape are aligned | `make validate-data` — primary derived page-bundle validation proof |
| Structural proof passes and the review commit is ready | `bun run audit:canonical-page-surface` — owned-surface budget check before review |
| Review commit excludes accidental generated framework drift | Inspect the diff and drop root `next-env.d.ts` when the task is ordinary page content, registry, messages, or colocated assets — see [CONTRIBUTING.md#drop-accidental-next-envdts-drift-before-review](../../contributors/CONTRIBUTING.md#drop-accidental-next-envdts-drift-before-review) |

Derived validation contract and exceptions:
[derived-page-validation-relevant-files.md](./derived-page-validation-relevant-files.md).
Contributor-facing walkthrough:
[CONTRIBUTING.md#review-preflight-before-opening-a-page-pr](../../contributors/CONTRIBUTING.md#review-preflight-before-opening-a-page-pr).

## Routine review checklist for ordinary page PRs

| When | Check |
| --- | --- |
| Ordinary page PR includes root `next-env.d.ts` changes unrelated to page behavior | Reject or request removal — see [review-standards.md#drop-accidental-next-envdts-drift](../../review-standards.md#drop-accidental-next-envdts-drift) |

## Page-local scope versus shared hotspot redirects

Routine canonical page branches should stay page-local unless the requested
behavior requires shared infrastructure changes.

Full observable budget (page-owned, supported derived, shared hotspot, and
review lanes):
[canonical-page-surface-budget-relevant-files.md](./canonical-page-surface-budget-relevant-files.md).

**Page-local (routine):**

- Page bundle under `src/content/docs/<section>/<slug>/` (`page.mdx`, messages,
  `assets.json`, page-local media)
- Matching primary registry record and page-specific supporting graph/table
  records

**Supported derived (regenerate locally; keep out of routine commits):**

- Outputs from `bun run prepare:content-runtime` such as
  `src/lib/content/generated/*.generated.ts`

**Shared hotspot (redirect or visible exception):**

- **`src/lib/content`** runtime helpers, MDX components, and colocated content
  tests — currently the hottest shared surface in maintained hotspot evidence
- Shared test and verification files (`src/tests/ci`, `src/tests/search`,
  `scripts/validate-*.ts`)
- Generated runtime artifacts checked in as authored changes
- Registry-manifest rewrites beyond the page's primary record
- Build, search, or tooling files unless the work item is explicitly broader

Do not hide shared hotspot churn inside an ordinary page slice. When
`bun run audit:canonical-page-surface` reports `redirect-to-throughput-prd`, or
when the work item is fundamentally cross-surface, open or redirect to a broader
throughput/conflict-reduction PRD.

Owned-surface audit: `bun run audit:canonical-page-surface`. Contributor
contract:
[CONTRIBUTING.md#routine-canonical-page-pr-surface-budget](../../contributors/CONTRIBUTING.md#routine-canonical-page-pr-surface-budget).

Compatible with narrow, reviewer-verifiable changes in
[code standards](../../code-standards.md) and
[review standards](../../review-standards.md).

## Glossary bridge plus concept canonical route (dual registry id)

When a new concept page shares an existing `concept.<slug>` registry id with a
published glossary bridge at `/docs/glossary/<slug>`, the page bundle can stay
page-local but CI will require narrowly-scoped shared updates:

- Resolve glossary-chain validation by `glossaryPageHref(slug)` plus
  `registryId`, not `pages.find(registryId)` alone.
- Route curated links, search ranking, and auto-linked prose to
  `/docs/concepts/<slug>` via generated `PUBLISHED_CONCEPT_SECTION_REGISTRY_IDS`.
- Keep glossary-chain gates validating `/docs/glossary/<slug>`.
- Add one behavioral discovery test (for example `embedding-concept-discovery.test.ts`)
  using `getDocsPageDir("concepts", "<slug>")`; update only convergence fixtures
  whose expectations change because of the dual route.

Document the exception explicitly in the work-item PRD when this collision is
inherent to the slice.

## Glossary-derived browse and sidebar sections

When glossary decomposition needs new reader-facing top-level areas such as
Model Types or Inference without changing canonical `/docs/glossary/<slug>`
routes:

- Add or extend ontology classifications under `classification.concept.*` (for
  example `classification.concept.model-type`, `classification.concept.module`).
- Derive browse cards through `buildDocsBrowseSections` and
  `src/lib/docs/glossary-derived-browse-sections.ts`, using
  `primaryClassificationId` / `secondaryClassificationIds` membership rather
  than new docs collection route slugs.
- Split sidebar folders through `src/lib/navigation/docs-sidebar-sections.ts`
  and keep the remaining glossary pages in the `Glossary` folder.
- Pass `config.starterSlugs.length` into `toDocsIndexEntries` for derived browse
  sections when starter slugs exceed the default six-entry preview cap.
- Sidebar reconciliation tests that previously compared every glossary page to the
  `Glossary` folder must union `Model Types`, `Inference`, `Module Components`, and remaining
  `Glossary` URLs, or filter out `isGlossaryPageAssignedToDerivedSection`
  pages when asserting the residual glossary folder.
- Inference terms with canonical concept routes (`concepts/prefill`,
  `concepts/quantization`, `concepts/kv-cache-quantization`,
  `concepts/post-training-quantization`) still expose inference classification
  in search even when they are absent from glossary-derived browse sections.
- Update `browseIndex.*Section*` copy in `src/content/messages/*/common.json`
  and extend `DOCS_BROWSE_SECTION_ORDER` when introducing another derived area.
- Classify every remaining published glossary concept with `primaryClassificationId`;
  align `conceptType` with `classification.concept.architecture`, and rely on ontology
  sidebar resolution for math/training/evaluation before editorial `sidebarGrouping`
  fallbacks for generation-and-diffusion or sequence-and-attention subgroups.
- Concepts-section `sidebarGrouping.concepts` only allows `long-context`,
  `inference`, `architecture`, and `reference-samples`; `generation-and-diffusion`
  is glossary-only until a concepts generation subgroup exists.
- Registry `relatedIds` should omit records without published docs pages; for
  example `paper.ltx-2` can stay in model/paper metadata but must not appear in
  concept `relatedIds` until `/docs/papers/ltx-2` ships.
- Forward next-step links to sibling lanes that are not yet published on this
  branch: prefer `LocalizedLinkList` in the how-to-use (or equivalent) section
  with canonical planned hrefs (for example `/docs/guides/getting-started`,
  `/docs/documentation/architecture-of-system`). `RelatedDocs` filters out
  items without published hrefs, so curated `relatedIds` alone will not show
  reviewer-visible navigation for unpublished targets. `LocalizedLinkList` is
  registered in MDX components and is not in
  `LINK_VALIDATION_MARKDOWN_COMPONENTS`, so planned destinations stay
  mergeable under current linkcheck rules without authoring the target pages.
- `validatePublishedGlossaryClassification` in `validate-glossary-classification.ts`
  blocks published glossary pages that lack `primaryClassificationId` unless
  `sidebarGrouping.glossary` provides an explicit editorial fallback; wired through
  `validateDerivedPublishedPageBundles` and `make validate-data`.
- Story-006 gates: `glossary-decomposition-validation.test.ts` for browse/search
  placement fixtures and `glossary-decomposition-browse-built-app.test.tsx` for
  desktop and narrow `/browse` category verification when integration tests run.

## PR-head mergeability for page branches (process executors)

When a routine canonical page branch has finished its page PRD stories but the
current blocker is PR-head mergeability—failed required checks, merge
conflicts, inherited test failures, or a non-mergeable PR head—do not stall in
passive continue states. Follow the existing process workstation mergeability
phase in
[factory/workstations/process/AGENTS.md](../../../factory/workstations/process/AGENTS.md)
(rules 5.2.1–5.2.5). Attempt the smallest disciplined mergeability fix those
rules allow before returning continue.

| When | Command |
| --- | --- |
| Diagnose mergeability class, linkage gaps, and action queue for active PR-backed lanes | `bun run watch:active-pr-mergeability` |
| Planner batch dispatch: collision preflight before scheduling overlapping page lanes | `bun run report:planner-batch-collision-preflight` |

These are existing owned commands. Do not invent a second mergeability policy,
new command, or new enforcement mechanism—the process workstation owns
mergeability phase expectations.

Valid mergeability work on the current PR head includes fixing required test,
lint, typecheck, build, contract, or browser-check failures; resolving merge
conflicts or merging the current base branch; and updating shared files outside
the original page slice when they are the concrete reason the reviewed head is
blocked. Document mergeability-only follow-ups in `progress.txt` and PR
conversation comments.

**Do not add** page-specific directory exports for ordinary page work. A focused
guard in `content-paths.test.ts` fails when new `export const *_PAGE_DIR`
constants appear outside the grandfathered allowlist.

**Still allowed** when you need tree-wide or section-wide paths:

* `getDocsRoot`, `getContentRoot`, `getProjectRoot`
* Section roots such as `getModulesDocsRoot`, `getGlossaryDocsRoot`, and
  `getDocsSectionRoot(section)`
* Registry, generated, and message roots such as `getRegistryRoot`,
  `getRegistryCollectionRoot`, `getMessagesRoot`, and generated docs roots

### Replacement pattern

```ts
import { getDocsPageDir } from "@/lib/content/content-paths";

const pageDir = getDocsPageDir("modules", "grouped-query-attention");
```

Supported `section` values: `glossary`, `concepts`, `modules`, `models`,
`papers`, `training`, `systems`, `guides`, `techniques`, `documentation`.

When publishing the first authored page under a rewrite-era CLI section
(`guides`, `techniques`, or `documentation`), also confirm:

1. `PUBLISHED_DOCS_SECTIONS` and `publishedDocsHrefFromEntry` in
   `src/lib/content/published-docs-registry-contract.ts` recognize that section,
   with matching `*PageHref` helpers in `src/lib/content/content-hrefs.ts`.
2. `parseLocalDocsPageRef` / `loadLocalDocsPage` in
   `src/lib/content/local-docs-page.ts` include the section, with a matching
   `*-page.ts` / `*-page-load.ts` pair (same shape as `system-page*`) so
   message-backed MDX resolves through `ModulePageProviders`.
3. `bun run audit:canonical-page-surface -- --page-dir src/content/docs/<section>/<slug> --exception-reason "..."`
   reports `declare-exception` for that first-page wiring (not
   `redirect-to-throughput-prd`). The audit maps CLI registry kinds
   (`guide` / `technique` / `documentation`) and ignores section-root
   `.gitkeep` when inferring page scope. Repeat the exception reason in the PR
   conversation comment.

Without (1), `bun run prepare:content-runtime` fails while generating the
published-docs registry. Without (2), `/docs/<section>/<slug>` falls through to
Fumadocs frontmatter title and 404s because CLI templates keep title/description
in colocated messages. Without (3), review preflight cannot classify the
first-page shared wiring as the documented exception lane.

Fumadocs `pageSchema` still requires frontmatter `title` (and accepts optional
`description`) at webpack/static-export time. For local-message CLI pages, set
`title: ""` and `description: ""` on that page's `page.mdx` frontmatter (same
pattern as published glossary pages) so the Fumadocs collection validates, while
the shell continues to render `messages.title` / `messages.description` via
`ModulePageProviders`. Do not put the real reader title only in Fumadocs
frontmatter, and do not edit shared `docs/templates/{concept,documentation,guide,technique}.mdx`
just to add those empty keys — that pulls a page lane out of the documented
first-CLI-section `declare-exception` allowlist into `redirect-to-throughput-prd`.

### Documentation CLI install commands (page-local)

For `documentation/cli` install copy, keep OS labels and install commands under
page `links.*` keys (not under `sections.*` — `pageSectionSchema` only keeps
`title`/`body`, so extra section fields are stripped on load). Render them as
always-visible `<pre><code><T k="links.…" /></code></pre>` blocks inside a
`#install` `Section`. Reuse the same product release strings as home
(`install.sh` curl | sh and PowerShell `irm` | `iex`). Do not hard-code command
strings in MDX and do not import `HomeCommandBlock` into docs MDX (home-only CTA
primitive).

Canonical commands:

- macOS/Linux: `curl -fsSL https://github.com/portpowered/you-agent-factory/releases/latest/download/install.sh | sh`
- Windows: `irm https://github.com/portpowered/you-agent-factory/releases/latest/download/install.ps1 | iex`

### Documentation CLI command matrix (page-local)

For `documentation/cli` commands copy, keep a distinct `#commands` `Section`
after `#how-to-use` (template order stays intact; `#commands` is an extra
teaching surface). Put matrix headers and cell strings under page `links.*`
keys — same reason as install: `pageSectionSchema` only keeps `title`/`body`.
Render an always-visible HTML `<table>` with `<T k="links.…" />` in each cell
so the running-factory distinction is readable without hover and without
hard-coded prose in MDX.

Do not use `PageAsset` table stubs for this matrix (they only echo `tableId`).
Do not paste packaged `you docs agents` markdown verbatim; rewrite rows for web
readers while keeping the run/submit/session/work/docs running-factory
distinctions clear.

### Documentation CLI key concepts, limits, and sibling discovery

For `documentation/cli`, keep `#key-concepts` before the install/commands
teaching surfaces so readers learn start-a-factory vs submit-to-a-running-factory
before the matrix. Keep `#limits-and-assumptions` as the scope boundary: web
install + command matrix only — not a flag dump, not a packaged-docs sync, and
not harness/MCP/config deep pages.

Wire sibling discovery through registry `relatedIds` + `<RelatedDocs />` only
when the sibling registry records and published pages exist (for example
getting-started or install deep-dive). Omit unpublished sibling ids from
`relatedIds` so validation and related rendering stay clean; do not invent
page-meta “on this page” prose or hard-coded sibling route lists in MDX.

For page tests that read bundle files, keep the same assertions after switching
from a `*_PAGE_DIR` import or `join(sectionRoot, slug)` to the derived lookup.

## Core content paths

* `src/lib/content/content-paths.ts`
  Canonical path helpers. Module JSDoc documents the derived page directory
  contract. Add shared roots or section helpers here only when the path is not
  an ordinary single-page directory.
* `src/lib/content/content-paths-page-dir-guard.ts`
  Grandfathered allowlist for legacy `*_PAGE_DIR` exports and the guard failure
  message that points reviewers to `getDocsPageDir(section, slug)`.
* `src/lib/content/content-paths.test.ts`
  Contract tests for derived directories across every docs section, exported
  production roots, and the no-new-page-constants guard.

## Page bundle and registry workflow

* `docs/templates/*.content.md`
  Authoring templates for model, module, concept, glossary, paper, training, and
  system pages.
* `docs/guide-to-writing-pages.md`
  High-level page authoring steps, graph requirements, and code/documentation
  separation expectations.
* `src/content/docs/<section>/<slug>/`
  Canonical page bundle layout (`page.mdx`, `messages/`, `assets.json`, graphs,
  and related colocated files).
* Concept teaching graphs wired through `<ConceptMap />` must define message-backed
  `assets.<assetId>.title` and `assets.<assetId>.legend` entries (same shape as
  `<ModuleGraph />`); `ConceptMap` delegates to `RegistryGraphFlow` via
  `buildRegistryGraphLegend`.
* `src/content/registry/`
  Registry JSON records that connect published pages to taxonomy, graphs, and
  runtime loaders.
* `scripts/validate-registry.ts`
  Maintainer and CI entrypoint for registry validation after adding records.

## Shipped-locale discovery when adding a locale

When extending `supportedLocales` (for example adding `zh-CN`):

* Derive `NonDefaultLocale` / empty shipped-docs buckets from `supportedLocales`
  in `src/lib/content/shipped-localized-docs.ts` and
  `src/lib/content/shipped-localized-docs.server.ts` — do not hard-code a
  `ja`/`vi`-only manifest shape as the authoritative contract.
* An empty locale bucket is valid: pages without `messages/<locale>.json` stay
  unshipped and the language switcher marks that locale unavailable for those
  docs routes.
* Regenerate with `bun run generate:shipped-localized-docs` (also covered by
  `prepare:content-runtime`).
* Cover client gating in `src/lib/content/shipped-localized-docs.test.ts` and
  derivation in `src/lib/content/shipped-localized-docs.server.test.ts`.
* Ship shell UI copy at `src/content/messages/<locale>/common.json` with the
  same top-level groups as English; `loadUiMessages` / `loadUiMessagesFromDisk`
  fail closed on a missing file (same as `ja`/`vi`). Every shipped shell locale
  must include `language.locales.<new-locale>` for the language selector.
* Prove load + fail-closed behavior in `src/tests/content/ui-messages.test.ts`
  (use `bun test --preload ./src/tests/a11y/mock-navigation.ts` for focused
  runs; `bun run test` alone fans the full website suite).
* Page-bundle messages use the same `messages/<locale>.json` convention for
  every supported locale (including `zh-CN`). `loadPageMessages` /
  `hasPageMessagesFile` already resolve that path from `SiteLocale`; do not
  special-case `ja`/`vi`. Missing non-default page messages fail closed (no
  English fallback). Validation iterates `supportedLocales` but only requires
  colocated locale files for docs that derive as shipped in that locale—an
  empty `zh-CN` shipped bucket is valid and does not force every page to ship
  Chinese copy. Cover load + fail-closed in `src/lib/content/messages.test.ts`
  and shipped/empty validation in `src/lib/content/validate-registry.test.ts`.
* Language switcher (`src/components/layout/language-switcher.tsx`) maps
  `supportedLocales` into options: non-docs surfaces (home, search, browse, …)
  always get a locale-preserving `href` via `switchRouteLocale`; docs pages mark
  unshipped locales unavailable (`href: null`) instead of linking to wrong-language
  copy. Cover available zh-CN navigation + query preservation and unavailable
  docs behavior in `src/components/layout/docs-header.test.tsx`.

## Representative migrated consumers

These files show the preferred `getDocsPageDir` pattern in page tests without
requiring a broad rewrite of every legacy `*_PAGE_DIR` import:

* `src/lib/content/module-page.test.ts`
* `src/lib/content/page-bundle.test.ts`
* `src/lib/content/validate-registry.ts`
* `src/lib/content/vocabulary-size-glossary-page.test.ts`
* `src/lib/content/prefill-concept.test.ts`
* `src/lib/content/sparse-attention-module-page.test.ts`
* `src/lib/content/attention-module-page.test.ts`
* `src/lib/content/pretraining-training-regime.test.ts`
* `src/lib/content/memory-system-page.test.ts`

When adding a new page test, follow the same module-level
`const pageDir = getDocsPageDir("<section>", "<slug>")` pattern instead of
importing a page-specific constant.

### Module compute-flow graph title and legend

Attention-variant module pages (`assets.computeFlow.type:
"attention-variant-graph"`) can teach mechanism details through
`messages.assets.computeFlow.title` and `messages.assets.computeFlow.legend`.
`ModuleGraph` routes those assets through `AttentionVariantComparisonGraph`,
which builds the legend from the active variant graph via
`buildModuleComputeFlowLegend` in
`src/features/models/components/module-compute-flow-legend.ts`. Page tests should
assert `data-graph-title`, `data-graph-legend`, and the active variant's graph
id when the story requires graphing-standard legend support.

## Stale-branch reconciliation before publishing

When a page slice was drafted on an older branch that predates current
`origin/main`, reconcile before copying artifacts:

1. `git fetch origin main` and inspect prerequisite registry records and page
   bundles on main (papers, citations, modules the slice should link to).
2. Inspect the stale branch/worktree for salvageable page bundle, registry,
   graph, and test files only — do not merge the stale branch wholesale.
3. Document gaps in `docs/internal/processes/<work-item>-reconciliation-notes.md`
   (missing `relatedIds`, empty `paperIds`, modules that landed on main after
   the stale branch).
4. Drop stale assumptions when the target does not exist or has changed on main
   (for example omit `model.stable-diffusion` when no canonical record exists).
5. Port tests with updated relationship expectations rather than copying stale
   assertions blindly.

Representative reconciliation: [clip-model-current-main-reconciliation-notes.md](./clip-model-current-main-reconciliation-notes.md).

## Paired model slice discoverability

When shipping the final story in a multi-model family PRD, keep discovery
registry-backed instead of hand-maintaining related prose:

* Bidirectional sibling links in each model record's `relatedIds`
* Aliases on both registry records and page frontmatter (`Mixtral 8x7B`,
  `open-mixtral-8x7b`, etc.)
* Back-links on shared module/system records:
  `module.mixture-of-experts` `usedByModelIds` and `system.routing`
  `relatedModelIds`
* A focused `*-discovery.test.tsx` patterned after
  `src/lib/content/qwen-3-6-discovery.test.tsx` or
  `src/lib/content/glm-family-discovery.test.tsx`

Representative paired-slice verification:

* `src/lib/content/mixtral-moe-discovery.test.tsx`
* `src/lib/content/qwen-3-6-discovery.test.tsx`
* `src/lib/content/glm-family-discovery.test.tsx`

## Reviewer-facing verification

* Canonical concept page slices should keep one `*-slice-verification` file with
  observable route/render/search assertions only; routine bundle alignment
  (registry fields, frontmatter, raw messages, tags, citations, assets) stays in
  `make validate-data`.
* When adding a page-local comparison table, commit only the new
  `flops-peak-achieved-comparison.json` entries in
  `table-registry.generated.ts`; do not carry unrelated stale generated
  reconciliation from other lanes (for example `looped-transformers-comparison`)
  because `prepare:content-runtime` regenerates the full table manifest at CI
  time.
* `bun test src/lib/content/content-paths.test.ts`
  Proves derived lookup across sections and rejects new ordinary page directory
  exports.
* `bun run typecheck`
  Required after touching shared content helpers or page tests that import them.
