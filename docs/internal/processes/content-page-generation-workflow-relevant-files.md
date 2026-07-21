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
`DocsPageProviders` wraps the compiled MDX (same pattern as concepts/systems).

## Shared docs shell: Opening summary chrome retired

`src/app/docs/docs-slug-renderer.tsx` no longer mounts `DocsOpeningSummary` /
`DocsFoldedSummary` bordered Opening summary chrome (`aria-label="Opening
summary"`, `data-opening-summary="folded"`, `data-testid="folded-summary"`).
Title + description + normal article body remain; do not revive What It Covers /
Key Concepts (or equivalent) intro chrome as a replacement. Message fields named
`openingSummary` may remain in content for non-chrome reuse (for example the
references family-index plain `<p>` purpose lead in
`ReferencesFamilyIndex.tsx`). Workers/workstations intentional `#how-to-use`
sections stay page-local and are unrelated to that retired shell chrome.

## Canonical generation: RelatedDocs presence optional (PF-L-contracts)

`validateGeneratedKindSpecificStructure` in
`src/lib/content/validate-generated-canonical-docs.ts` no longer emits
`missing-related-docs-component` when concept/canonical MDX omits
`<RelatedDocs />` or a related-section. Strip-ready generated/template pages
without that chrome must validate for RelatedDocs presence rules. Do not
reintroduce a fail-closed RelatedDocs presence gate in generation validation.

Proofs live in `validate-generated-canonical-docs.test.ts`: kind-specific and
full `validateGeneratedCanonicalDocs` both assert live concept template MDX
(without RelatedDocs / related-section) passes with zero RelatedDocs-presence
errors. An end-to-end `buildPageBundleArtifacts` proof also asserts generated
concept `pageMdx` stays strip-ready and validates (no
`missing-related-docs-component`). Do not revive a presence-expecting test that
fails when chrome is absent. Existing published MDX may still mount RelatedDocs
until PF-L-strip removes it by collection; that remaining chrome is not a
contracts-lane failure. FAQ-only strip remains PF-D2.

### Documentation collection PF-L-strip (published MDX, minus FAQ)

For published non-FAQ documentation under
`src/content/docs/documentation/**/page.mdx` (except `documentation/faq/**`):

- Strip trailing `Section id="related"` / `id="references"` footer chrome and
  drop unused `RelatedDocs` / References `CitationList` / Related-only
  `LocalizedLinkList` imports.
- Keep Tags (`TagPillList`) and teaching-section `LocalizedLinkList` mounts
  (for example limits-and-assumptions links on what-is-you-agent-factory, or
  per-scenario lists on troubleshooting).
- Leave `documentation/faq/**` unchanged — FAQ Related chrome stays for
  `#190` / PF-D2.
- Prefer stop-mounting over rewriting shared `RelatedDocs` behavior; do not
  invent a replacement related surface.
- Colocated documentation page / discoverability tests that required Related To
  / References headings or `#related` curated links must assert absence (or
  drop those asserts) in the same lane as the MDX strip so CI stays green;
  keep teaching-body link asserts.
- Formalize absence on every non-FAQ documentation `*-page.test.tsx` English
  render proof for stripped pages: `queryByRole("heading", { name: "Related
  To"|"References" })` null, `#related` / `#references` DOM null, and Tags
  heading present. Keep FAQ page tests on Related presence until `#190` /
  PF-D2. Pages that had no colocated test (for example cli, resources,
  what-is-you-agent-factory) get a lean page-owned render proof with the same
  absence block.
- After MDX strip, clean owned non-FAQ `messages/*.json`: remove
  `sections.related` / `sections.references` footer titles; drop link / label
  keys used only by stripped Related-footer lists; keep teaching-body link
  keys and `sections.tags`. Leave `documentation/faq/**/messages` unchanged.
  Align every owned locale (en and present ja / zh-CN / vi) for the stripped
  keys.
- Browser-verify stripped documentation routes with
  `bun src/content/docs/documentation/assert-documentation-related-chrome-strip-browser.ts`
  (webpack `next dev` via `scripts/run-next.ts`, unique port 3591 default,
  Playwright; kill server on exit). Fail closed on Related / Related To /
  References footer headings and `#related` / `#references` mounts while
  proving at least one teaching section id remains. Prefer
  `DOC_RELATED_CHROME_STRIP_PROBE_BASE_URL` when a server is already warm. Do
  not include `documentation/faq` in the absence probe (FAQ stays fenced for
  `#190` / PF-D2).

Kind templates under `docs/templates/**` (`concept.mdx`, `guide.mdx`,
`technique.mdx`, `documentation.mdx`, `glossary.mdx`, `reference.mdx`) no
longer mandatorily emit `<RelatedDocs />`, `<DerivedRelatedDocs />`, or a
related-section. `generate-page-bundle` / `buildPageBundleArtifacts` copy those
templates, so new page MDX stays strip-ready by default. Do not reintroduce
RelatedDocs chrome into kind templates. Leave unused `sections.related`
message keys alone unless a template edit needs them; they are not page chrome.

## Derived page directory contract

Routine canonical pages live under `src/content/docs/<section>/<slug>`. Resolve
the page directory with `getDocsPageDir(section, slug)` instead of adding a new
exported `*_PAGE_DIR` constant to `src/lib/content/content-paths.ts`.

## First CLI collection page (guides / techniques / documentation)

The first authored `techniques/` page needs the same local-docs loader pair as
guides/documentation (`technique-page.ts` / `technique-page-load.ts`) plus
`techniques` in `LOCAL_DOCS_SECTIONS` / `parseLocalDocsPageRef`. Published-docs
section membership and `techniquePageHref` already exist on main; still remove
section-root `.gitkeep` files and flip
`src/tests/content/section-indexes.test.tsx` from empty-state to authored-entry
assertions. Prefer a colocated `<slug>-page.test.tsx` under the page bundle.
Later technique pages stay page-local beside that wiring.

Technique → concept / documentation / unpublished sibling technique discovery
needs page-local `<LocalizedLinkList>` today: `getRegistryRecordById()` /
`listRelatedRegistryRecords()` omit `techniques` (and documentation/guides), so
`<RelatedDocs registryId="technique.*" />` returns null even when
`relatedIds` lists a published concept. Keep curated `relatedIds` only for
targets that exist in this worktree (validation still resolves them), and wire
reviewer-visible discovery under `#related` with message-backed
`LocalizedLinkList` hrefs — published siblings such as `/docs/concepts/task-queue`
and `/docs/documentation/submitting-work`, plus published or planned technique
hrefs for nearby techniques (for example classify-execute, planner-executor,
ralph, worker-adviser, and writer-reviewer when published). Do not put
unpublished technique registry ids in `relatedIds`.

Optional technique teaching graphs: baseline `technique.assets.json` is empty.
Atlas-era `<ConceptMap />` / `<ModuleGraph />` MDX tags are retired from
templates; `PageAsset` graph slots only stub `data-graph-id` without a real
React Flow canvas. Prefer strengthening how-it-works prose (for example the
waiting → consume → remaining ready work drain loop) and keep `assets.json`
empty rather than shipping a decorative or stub-only graph. Mirror the
concepts/task-queue no-graph proof pattern in the colocated page test.

Before the first authored page under a rewrite-era CLI collection can pass
`prepare:content-runtime` / `make validate-data` and render under
`/docs/<section>/<slug>`:

1. `PUBLISHED_DOCS_SECTIONS` and `publishedDocsHrefFromEntry` in
   `src/lib/content/published-docs-registry-contract.ts` must accept that
   section (with matching `*PageHref` helpers in `content-hrefs.ts`). Empty
   CLI taxonomy roots alone are not enough — generation throws
   `Unsupported published docs section` otherwise.
2. `parseLocalDocsPageRef` / `loadLocalDocsPage` in
   `src/lib/content/local-docs-page.ts` must include the section with a
   colocated loader (for example `documentation-page.ts` /
   `documentation-page-load.ts`, or `technique-page.ts` /
   `technique-page-load.ts` for the first techniques page). Without that,
   Fumadocs renders the MDX body without `DocsPageProviders` and
   `Section` / `T` throw `usePageMessages must be used within PageMessagesProvider`.
3. Fumadocs MDX frontmatter still needs `title` (and usually `description`)
   even when reader copy is message-backed — mirror the glossary template.
4. `registryDirectoryByKind` in
   `src/lib/factory/canonical-page-surface-audit.ts` must map
   `guide` / `technique` / `documentation` to their registry directories, or
   `bun run audit:canonical-page-surface` fails with an unsupported registry
   kind for the new primary record.
5. Extra section message keys beyond `title` / `body` are stripped by
   `pageSectionSchema`. Put OS labels and similar short strings under
   `links.*` (or another allowed top-level message field), not under
   `sections.<id>.*`.
5a. Empty-string section `body` values also fail `make validate-data` as
   missing MDX message keys. Draft documentation scaffolds must use
   non-empty placeholder bodies (even before story copy lands); do not
   leave `""` for keys referenced by `<T k="sections.*.body" />`.
6. Browser verify with `bun run start` serves the last production build.
   After editing page MDX or colocated messages, run `bun run build` (or
   use `bun run dev`) before curling the route, or the HTML will still show
   the previous copy. Prefer a unique port in `3100-3999`,
   `curl --max-time 10`, and kill the server before the command exits.
7. Do not run overlapping `prepare:content-runtime` / `fumadocs-mdx`
   invocations in parallel on the same worktree — concurrent prep can delete
   `.source` mid-validate and fail with `Cannot find module '../../.source/server'`.
   Run `make validate-data`, `bun run lint`, and `bun run test` sequentially
   when diagnosing page-bundle validation.

## Guide quickstart commands and message keys

When a guide needs copyable shell commands (install, first-run, submit):

1. Put fenced code blocks in `page.mdx` (not in message JSON). They render
   through the Fumadocs `pre` → `DocsPre` mapping in `moduleMdxComponents`.
   `DocsCodeBlock` keeps inset padding on the scroll viewport and a dedicated
   copy rail (`data-docs-code-actions="rail"`) so long-line scroll never
   overlaps the control (see `docs-code-block.css`). Host `DocsCodeCopyButton`
   owns clipboard + checkmark + accessible copied status (`Copied Text` label
   + `aria-live` status) with secondary-blue hover/focus/checked chrome
   (`docs-code-copy-chrome.ts`); it resets after `DOCS_CODE_COPY_RESET_MS`.
   Regression lock: contrast pairings (`color-contrast.ts` /
   `HOST_SEMANTIC_CONTRAST_PAIRINGS`), rail non-overlap
   (`docs-code-block-layout.ts`), and
   `src/tests/a11y/docs-code-block.a11y.test.tsx`.
   R00 served-page gate: `theme-code-copy-r00-gate.ts` +
   `theme-code-copy-r00-page.test.ts` (opt-in
   `VERIFY_PRODUCTION_INTEGRATION_TESTS=1`) proves factory-dark chrome and the
   full copy interaction on `/docs/guides/getting-started` at desktop + narrow.
2. Keep OS labels and short prose in colocated messages. `pageSectionSchema`
   only allows `title` / `body` per section — extra keys under
   `sections.<id>` are stripped by Zod and then fail
   `make validate-data` as missing MDX message keys.
3. For short non-section strings (for example OS labels), use top-level
   `links.<key>` (string map). For an extra prose block that is not a section
   heading, use `callouts.<id>.body` with `<T k="callouts.<id>.body" />` —
   that stores the string without rendering the `Callout` UI component.

Canonical install command forms match the home CTA in
`src/content/messages/*/common.json` (`home.installMacosLinuxCommand` /
`home.installWindowsCommand`). After PS-200, Guides → Getting Started owns the
full standard install teaching path: both OS release scripts, post-install
confirm-`you`-available guidance, and starter scaffold choice (default Codex
when `--executor` is omitted; copyable `you init --executor claude` for a
Claude-backed scaffold). Do not reintroduce an Install deep-dive callout or
primary next-step that requires `/docs/documentation/install` to finish a
standard install — that URL stays a thin compatibility stub (PS-200) until
explorer demotion (PS-300).

For `documentation/install` itself: keep a published thin stub under
`src/content/docs/documentation/install/` with one `install-path` section that
identifies Getting Started as the install path and a
`<LocalizedLinkList>` href to `/docs/guides/getting-started`. Do **not** put OS
scripts or `you init --executor claude` back on that page as primary teaching.
Do **not** use W18 `DocumentationRouteCompatibilityDocument` / the §10 family
migration ledger for this absorption (that ledger is for documentation →
factories/workers/workstations/references moves). Stay static-export-safe: no
`next.config` redirects, host `_redirects`, or runtime server redirects.
Prove stub behavior in `src/lib/content/install-page.test.tsx` (Getting Started
link present; OS/Claude command literals absent; stub message shape is only
`sections.installPath` + `links.gettingStarted`). Prove Getting Started owns
the merged path in
`src/content/docs/guides/getting-started/getting-started-page.test.tsx`: both
OS commands and `you init --executor claude` live under `#install`, confirm-you
+ scaffold copy render, and the `#common-pitfalls` teaching links stay CLI-docs
only (no Install deep-dive href). Prefer scoping “no Install deep-dive” to the
pitfalls / teaching link list — do not require the whole document body to omit
`/docs/documentation/install` if RelatedDocs later re-adds that registry id.
First-run / session forms used on the getting-started quickstart:
`you run --named @goal/blah`, bare `you`, and `you session list`. First-submit
forms: unary
`you submit --name <name> --work-type-name <type> --payload <path>` and
`you submit batch <path>` (keep the quickstart free of full batch schema /
relation dumps — those belong on submitting-work / CLI docs).

Guide kind is outside the strict page-template conformance set, so extra
quickstart `Section`s (for example `install`, `first-you`, `first-submit`)
are allowed when colocated message keys validate. Browser-verify MDX or
message edits with `bun run build` then `bun run start` on a unique port —
plain `start` serves the last production build and will look stale otherwise.
In parent-hoisted worktrees prefer
`bun ./scripts/run-next.ts dev --webpack -p <port> -H 127.0.0.1` (unique port
in `3100–3999`); plain Turbopack `bun run dev` can fail to resolve `next` from
`src/app`, and the first docs compile may need a long curl `--max-time`.

When linking parallel-lane sibling destinations that are not yet published in
this worktree (for example getting-started → `/docs/documentation/cli`), prefer
page-local `<LocalizedLinkList>` with stable hrefs and `links.*` labels. Do not
put those ids in registry `relatedIds` until the sibling registry records exist
here — unresolved related ids fail `validate-data`, and RelatedDocs also drops
unpublished targets.

Guide ↔ guide discovery also needs `<LocalizedLinkList>` today: generated
`listRelatedRegistryRecords()` / `getRegistryRecordById()` omit `guides` (and
documentation) kinds, so curated `relatedIds` on a guide record will not render
under `<RelatedDocs />` even when the target guide is published. Keep
getting-started and planned concept/write-review destinations on the page via
message-backed `LocalizedLinkList` hrefs.

Concept → guide discovery uses the same rule: even when guide registry records
are published, put loops / write-review / getting-started next steps on the
concept page with message-backed `<LocalizedLinkList>` under `#related` (or an
equivalent discovery section). Leave concept `relatedIds` empty for those guide
ids — they will not render under `<RelatedDocs />` until guides join the related
registry runtime.

Technique → guide discovery follows the same pattern: a technique glossary page
that needs a visible next-step to a published how-to guide (for example
writer-reviewer → `/docs/guides/write-review-loops`) must wire that destination
with page-local `<LocalizedLinkList>` and `links.*` labels under `#related`.
Do not rely on registry `relatedIds` alone for guide kinds — they will not
render under `<RelatedDocs />` until guides join the related registry runtime.

Concept → documentation discovery has the same gap: `listRelatedRegistryRecords()`
omits `documentation` kinds, so a concept page that needs visible links to
configuration / workstations / submitting-work (or other published docs pages)
must wire those destinations with page-local `<LocalizedLinkList>` and
`links.*` labels. Leave concept `relatedIds` empty for those documentation
targets until related-runtime includes documentation records; keep
`<RelatedDocs />` / `<DerivedRelatedDocs />` for concept-to-concept curated
discovery when those ids can resolve.

Technique → sibling technique / documentation / guide / concept discovery
follows the same page-local rule while sibling technique pages are still
unpublished: put planned routes such as `/docs/techniques/writer-reviewer`,
`/docs/techniques/planner-executor`, `/docs/techniques/workqueue-executor`,
published documentation such as `/docs/documentation/workers`, and useful
concept/guide destinations on the technique page with message-backed
`<LocalizedLinkList>` under `#related`. Leave technique `relatedIds` empty for
unpublished sibling technique ids so `validate-data` stays clean; keep
`<RelatedDocs />` for curated targets that already resolve. Technique kind is
not in the page-template-conformance supported set, so adding
`LocalizedLinkList` does not require a conformance exception entry.
When asserting compared-to-nearby prose in colocated page tests, prefer
section `textContent` matchers — prose auto-links can fragment exact
`getByText` sentence matches.

## Shipping non-en locale stubs on a page bundle

Colocated `messages/{ja,zh-CN,vi}.json` may stub English copy. Adding those
files is what derives the page as shipped for that locale
(`deriveShippedLocalizedDocsManifest` / `bun run generate:shipped-localized-docs`).
Missing non-default messages fail closed (no English fallback at load time).

When a later lane **fills** high-traffic stubs with real target-language prose
(for example `guides/getting-started`, `guides/using-you-agent-factory-for-loops`,
`guides/write-review-loops`, `guides/cursor-dynamic-workflows`,
`documentation/install`, `documentation/what-is-you-agent-factory`,
`documentation/cli`), keep the same key shape, leave install/run/submit and
MCP tool-name command literals unchanged (in `page.mdx` or under `links.*` for
CLI), keep OS platform labels such as `macOS / Linux` /
`Windows (PowerShell)` identical across locales, and update any section-index
title/description assertions that previously expected the English stub (for
example `src/tests/content/section-indexes.test.tsx` for `vi` documentation
index). Prefer extending the existing page-owned test
(`src/lib/content/install-page.test.tsx` /
`src/lib/content/what-is-you-agent-factory-page.test.tsx` /
`src/lib/content/cli-page.test.tsx`, or a colocated `<slug>-page.test.tsx`) with
locale cases that assert reader-facing fields differ from English rather than
only that files exist. For `documentation/cli`, authoring new
`messages/{ja,zh-CN,vi}.json` (not just filling stubs) is what ships the page
in those locales — regenerate and commit
`shipped-localized-docs.generated.ts` plus the derive-test expectation.

Commit the regenerated tracked `shipped-localized-docs.generated.ts` when adding
locale message files (the derive test requires it). On a first CLI-section page
(including the first authored `concepts/` page), that generated file plus a
narrow `shipped-localized-docs.server.test.ts` expectation update stay inside
the documented `declare-exception` allowlist —
see [canonical-page-surface-budget-relevant-files.md](./canonical-page-surface-budget-relevant-files.md#first-authored-page-under-a-rewrite-era-cli-section).
Leave other `prepare:content-runtime` outputs uncommitted when they stay
gitignored. Colocate new concept page render proofs under
`src/content/docs/concepts/<slug>/<slug>-page.test.tsx` so the page test stays
page-owned rather than under `src/lib/content/`.

When an intentional multi-page PRD ships locale stubs for more than one page
bundle, bare `bun run audit:canonical-page-surface` cannot infer a single page
scope. Audit each page with `--page-dir src/content/docs/<section>/<slug>
--files <that-page paths…> shipped-localized-docs.generated.ts
shipped-localized-docs.server.test.ts --exception-reason "…"`, and repeat the
exception reason in the PR conversation. Do not treat the sibling page bundle
as shared hotspot churn for the page under audit.

When the same documentation lane also needs a narrow
`FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG` membership entry
(`src/lib/content/sidebar-grouping.ts`), prove the owned surface and each
exception separately rather than stuffing every shared path into one
`--files` list:

1. Page-owned paths only → expect `keep-routine` / `within-budget`.
2. Page-owned + locale-shipping trio → `--exception-reason` for locale
   shipping → expect `declare-exception`.
3. Page-owned + `sidebar-grouping.ts` → `--exception-reason` for the
   membership entry → expect `declare-exception`.

Combining sidebar membership and locale-shipping shared paths in one audit
still recommends `redirect-to-throughput-prd` today (multiple shared
categories). Document both exception reasons in the PR conversation; do not
redesign the shared audit classifier on a routine page lane.

When colocated page tests assert non-guarantee / denial copy, match the denial
positively (for example `/not a compliance certification claim/i`) instead of
negating the denied phrase — otherwise correct “not a …” prose fails the test.

For later concept pages (not first-CLI-section), the same locale shipping trio
is still required to publish non-en routes. Update
`src/tests/content/section-indexes.test.tsx` so default and localized concepts
indexes assert the authored page entry instead of the empty-state contract.
When the branch also touches a section loader (for example
`concept-page-load.ts` for page-local MDX components), rerun
`audit:canonical-page-surface` with `--exception-reason` and repeat that
justification in the PR conversation — the classifier may still recommend
`redirect-to-throughput-prd` until the locale-shipping exception lane is
widened; sibling concept locale stories document the same narrow exception.

Optional factory-ui teaching visuals on concept pages need that same
`page-mdx-components.tsx` + `concept-page-load.ts` switch pattern (relative
imports in `page.mdx` do not resolve under `compileMDX`). On a page-only lane
where the visual is optional, stay prose-first with empty `assets.json` rather
than editing the shared loader; see
`tasks/ideas-to-review/content/concept-page-local-mdx-components-without-shared-loader-switch.md`.

### Documentation page-local DataTable / graph / MDX components

When a documentation page needs a required factory-ui teaching surface such as
`DataTable` (for example `documentation/harness-support` support matrix), a
factory-ui system diagram (for example `documentation/architecture-of-system`),
or a factory-ui charts time series (for example `documentation/metrics`
teaching chart):

1. Keep matrix JSON / graph or chart fixture, the page-local renderer, and
   `page-mdx-components.tsx` under the page bundle. Import graph primitives from
   `@/features/factory-ui/graphs` and chart primitives from
   `@/features/factory-ui/charts` (not package internals, not Atlas assets).
2. Add a static slug switch in `documentation-page-load.ts` that imports
   `@/content/docs/documentation/<slug>/page-mdx-components` (same compileMDX
   constraint as concepts — relative MDX imports do not resolve).
3. Treat that loader switch as a narrow shared-surface exception: rerun
   `bun run audit:canonical-page-surface` with `--exception-reason` and repeat
   the justification in the PR conversation. Do not edit
   `src/features/factory-ui/*` or invent shared matrix/graph/chart infrastructure.
4. React Flow node labels may be absent from curl/SSR HTML; prove the teaching
   diagram with colocated render tests and, when verifying a served page, a
   JS-capable browser check (Playwright) for title, legend, and labeled nodes.
   Recharts teaching charts usually expose title, axis labels, and series
   legend text in SSR HTML — curl can prove those strings after `bun run build`.

Required factory-ui teaching visuals on blog posts use the same pattern under
the blog loader: colocate `page-mdx-components.tsx` next to `page.mdx` and add a
static `import("@/content/blog/<slug>/page-mdx-components")` switch case in
`blog-page-load.ts`. Keep the chart/graph component post-owned; do not register
it in shared `blog-mdx-components.tsx` / `mdx-components.tsx`.

### Route-family page-local MDX components (references / factories / workers / workstations)

When a route-family page under `src/content/docs/references/` (or factories /
workers / workstations) needs a page-owned mount such as the W11 events corpus
`EventsCorpusMount` (stream roles, catalogs, reconnect/lifecycle, static SSE):

1. Keep the page-local renderer and `page-mdx-components.tsx` under the page
   bundle. Import public surfaces from `@/components/references/...` and helpers
   from `@/lib/references/...` — do not edit renderer internals on a page-wiring
   lane.
2. Add a static section+slug switch in
   `route-family-local-docs-page-load.ts` that imports
   `@/content/docs/<section>/<slug>/page-mdx-components` (same compileMDX
   constraint as documentation/concept/blog — relative MDX imports do not
   resolve).
3. Treat that loader switch as a narrow shared-surface exception: rerun
   `bun run audit:canonical-page-surface` with `--exception-reason` and repeat
   the justification in the PR conversation. Do not register page mounts in
   shared `mdx-components.tsx`.
4. For published-route empty/error proofs, export a presentational view (for
   example `EventsCorpusMountView`) that accepts a resolved mount model so
   colocated tests can assert accessible `EventsStatus` messaging without
   mocking OpenAPI loaders or scanning renderer trees.

For `/docs/references/events`, also see
[events-reference-page-relevant-files](./events-reference-page-relevant-files.md).
Events-local ordinary textual links in
`event-json-reconnect-probe.tsx` and `response-event-matrix.tsx` use
`text-secondary` (keep `underline-offset-4 hover:underline`; matrix also
keeps `font-mono text-sm`) — not `text-primary` yellow. SchemaRefLink /
API navigator accents are separate ownership. Lock those accents in the
colocated component tests (`event-reconnect-lifecycle.test.tsx` for the
probe transport-summary link; `factory-response-event-catalog.test.tsx`
for matrix payload-variant links) by asserting rendered `className`
contains `text-secondary` and does not match `\btext-primary\b`.
Browser-verify with
`bun ./scripts/run-next.ts dev --webpack -p <3100-3999> -H 127.0.0.1` and
fetch `/docs/references/events` (no trailing slash, or `curl -L`).

Blog discoverability proofs (index card, search queries, tag landing) for a
blog-local lane should colocate under `src/content/blog/<slug>/` (for example
`<slug>-discoverability.test.tsx`) rather than editing sibling B07 posts or
shared search helpers. Published posts are already indexed by
`docsSearchApi` / tag resource groups once the bundle is `status: published`
with resolving tags — the test asserts that contract, it does not regenerate
search artifacts.

Documentation discoverability proofs for a page-local lane should likewise
colocate under `src/content/docs/<section>/<slug>/` (for example
`<slug>-discoverability.test.tsx`): assert the section index card, representative
`docsSearchApi.search` hits, and `buildDocsPageMetadata` title/description/
canonical/OG. Prefer that over editing shared `section-indexes` or search
helpers when the lane owns only the new page.

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

## First published documentation (or other empty CLI collection) page

The first published page in a previously empty CLI collection (`documentation`,
`guides`, `techniques`, or `concepts`) is not a routine page-only lane when
shared wiring is still missing. Publishing may trip
`bun run audit:canonical-page-surface`:

- `PUBLISHED_DOCS_SECTIONS` + collection `*PageHref` in content-hrefs /
  published-docs registry contract
- `LOCAL_DOCS_SECTIONS` + `<kind>-page(-load).ts` local MDX loader path
- `registryDirectoryByKind.<kind>` in the canonical page surface audit
- empty-root / section-index tests that previously forbade authored bundles
  (`src/tests/content/section-indexes.test.tsx` must move that section from
  empty-state assertions to authored-entry assertions once the first page
  ships; keep non-default locale empty-state checks until locale stubs exist).
  When every CLI section is authored in the default locale, remove the
  `CLI_EMPTY_SECTION_INDEX_CASES` filter loop entirely — filtering all
  sections out yields `never[]` and breaks `tsc` on the empty-state `for`
  loop. Keep locale-specific empty-state `it(...)` cases as standalone tests
  until that locale ships stubs; when techniques (or another section) ships
  `messages/{ja,zh-CN,vi}.json`, flip the matching localized index assertion
  to authored-entry and regenerate/commit
  `shipped-localized-docs.generated.ts` plus the derive-test expectation.

### First published techniques page

`techniques` already has `PUBLISHED_DOCS_SECTIONS` / `techniquePageHref` and
`registryDirectoryByKind.technique`, but still needs the local-docs loader path
before `/docs/techniques/<slug>` can render with `DocsPageProviders`:

- add `src/lib/content/technique-page.ts` + `technique-page-load.ts`
- include `techniques` in `LOCAL_DOCS_SECTIONS` / `parseLocalDocsPageRef` /
  `loadLocalDocsPage` in `src/lib/content/local-docs-page.ts`
- remove `src/content/docs/techniques/.gitkeep` and
  `src/content/registry/techniques/.gitkeep` when the first authored bundle and
  registry record ship
- update default-locale techniques expectations in
  `src/tests/content/section-indexes.test.tsx` to authored-entry assertions;
  leave non-default locale techniques indexes on empty-state until colocated
  `messages/<locale>.json` stubs exist
- when those locale stubs ship, flip localized techniques indexes to
  authored-entry assertions (title / href) and regenerate/commit
  `shipped-localized-docs.generated.ts` plus the matching
  `shipped-localized-docs.server.test.ts` committed-tree assertion
- colocate the page render proof under the page bundle
  (`<slug>-page.test.tsx`, e.g. `workqueue-executor-page.test.tsx` /
  `classify-execute-page.test.tsx`) so the proof stays page-owned
- document the exception with `--exception-reason` on
  `bun run audit:canonical-page-surface`
- when every CLI section has authored entries, type
  `CLI_EMPTY_SECTION_INDEX_CASES` as `CliSectionIndexCase[]` (or equivalent)
  instead of relying on a filtered `as const` array — an empty filter collapses
  to `never[]` and breaks `tsc` on the empty-state loop

Declare the first-CLI-section exception with
`bun run audit:canonical-page-surface -- --exception-reason "..."` and repeat
that justification in the PR conversation. Later technique pages should stay
page-local once this wiring lands. Do not treat excluded `src/lib/docs/`
empty-root suites as required CI for this lane; update them only when a
throughput lane owns that shared surface.

When the section loader wiring already exists (for example `concepts` after
empty-CLI taxonomy work), the first authored page may only need the
section-index test update plus page-owned bundle/registry files. Document the
first-collection publish-wiring exception in the work-item PRD when shared
paths remain required so review does not reject a necessary shared diff as
“page-only AC failure.” Later pages in the same collection should stay
page-local and in-budget.

### First published concepts page (collection already wired)

`concepts` already has published-section wiring (`PUBLISHED_DOCS_SECTIONS`,
`LOCAL_DOCS_SECTIONS`, concept page loaders, `registryDirectoryByKind.concept`).
The first authored published page under `src/content/docs/concepts/<slug>/`
still needs a narrow section-index expectation update so default-locale indexes
list the page title / summary / href instead of empty-state copy:

- `src/tests/content/section-indexes.test.tsx`
- `src/lib/docs/section-collection-index.test.ts`
- optional verification helpers such as
  `src/lib/docs/empty-cli-browse-indexes-verification.test.tsx`

Do not treat that index-expectation update as a redirect-to-throughput lane.
Non-default locales stay on the empty concepts index until colocated
`messages/<locale>.json` files exist for the page (shipped-localized-docs is
derived from those files). When those locale stubs ship, update the localized
concepts section-index expectations the same way (list title / summary / href)
and regenerate/commit `shipped-localized-docs.generated.ts` plus the matching
`shipped-localized-docs.server.test.ts` committed-tree assertion.

Prefer behavioral coverage for the shipped page (section-index listing title /
summary / href, or `loadLocalDocsPage` + rendered body asserting framing copy
and next-step links) over inventory-only “slug exists on disk” assertions.
For documentation pages with copyable commands, mirror
`src/lib/content/what-is-you-agent-factory-page.test.tsx` /
`src/lib/content/install-page.test.tsx`: after PS-200, load via
`loadLocalDocsPage`, render with `DocsPageProviders`, and assert the thin stub
(Getting Started pointer; no primary OS/Claude install command teaching). Do not
treat `shipped-localized-docs.server.test.ts` route-list updates as sufficient
page coverage.

## Glossary-derived browse and sidebar sections

Public `/browse` and the docs sidebar are factory-only (guides, concepts,
techniques, documentation, plus glossary on the sidebar). Do not reintroduce
Model Types / Inference / Module Components as browse hub cards or sidebar
folders through `buildDocsBrowseSections` / `buildDocsSidebarSectionNodes` —
those paths only accept collection section refs.

- `src/lib/navigation/docs-sidebar-sections.ts` keeps every glossary page under
  the single `Glossary` folder; do not filter pages into Atlas-era derived
  folders.
- Docs breadcrumbs (`DocsPageBreadcrumb`) only add a collection crumb when
  `isAcceptedDocsSourceSection` accepts the slug section; retired Atlas
  prefixes must not become live crumb labels or `/docs/{atlas}` hrefs.
- Retired Atlas collection index routes
  (`/docs/{models,modules,papers,training,systems}` and localized equivalents)
  must stay deleted as App Router modules. Those URLs not-found through the
  docs slug renderer and must stay out of `source.generateParams()` /
  docs `generateStaticParams` inventories — see
  `src/lib/content/retired-atlas-collection-routes.test.ts`,
  `src/lib/content/factory-only-public-inventory.test.tsx` (factory-only
  inventory + Blog/Search as separate surfaces), and
  [shell-domain-relevant-files](./shell-domain-relevant-files.md).
- Glossary-derived Atlas browse helpers
  (`src/lib/docs/glossary-derived-browse-sections.ts`) are deleted. Public
  browse stays CLI-only via `buildDocsBrowseSections` /
  `DOCS_BROWSE_SECTION_ORDER`; proofs live in
  `src/lib/docs/browse-collection-sections.test.ts`. Do not reintroduce
  Model Types / Inference / Module Components browse sections.
- Inference terms with canonical concept routes (`concepts/prefill`,
  `concepts/quantization`, `concepts/kv-cache-quantization`,
  `concepts/post-training-quantization`) still expose inference classification
  in search even when they are absent from the public browse hub.
- Classify every remaining published glossary concept with `primaryClassificationId`;
  align `conceptType` with `classification.concept.architecture`, and rely on ontology
  sidebar resolution for math/training/evaluation before editorial `sidebarGrouping`
  fallbacks for generation-and-diffusion or sequence-and-attention subgroups.
- Concepts-section `sidebarGrouping.concepts` only allows `harnesses`,
  `industrial-engineering`, and `model-inference`. Factory explorer membership
  is driven by `FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG` first; editorial
  `sidebarGrouping.concepts` is for exceptions not covered by that map.
  `generation-and-diffusion` remains glossary-only.
- Program documentation explorer membership is driven by
  `FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG` (seven top groups with
  optional secondaries under Factory Configuration and System Operations;
  `FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG` is the top-group-only view).
  FAQ is omitted from that map because it is a top-level explorer
  page outside the Program documentation folder.
- Packaged CLI reference surfaces: place `packaged-documents` and
  `packaged-factories` under the `packaged-factories` top group; place
  `cli` / `cli-command-index` / `api-doc` / `mcp` under `interfaces`. Wire
  documentation→documentation discovery with page-local `<LocalizedLinkList>`
  plus aligned registry `relatedIds`; `<RelatedDocs />` alone will not render
  documentation-kind siblings.
- Deferred Program documentation explorer membership (page-only lanes such as
  PS-220 `/docs/documentation/api`): publish the page bundle + registry with
  status `published`, add the slug to
  `DEFERRED_DOCUMENTATION_EXPLORER_MEMBERSHIP_SLUGS` in
  `src/lib/content/sidebar-grouping.ts`, and keep
  `FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG` unchanged until the IA lane
  (PS-300) wires Interfaces membership. The sidebar adapter omits deferred
  slugs from the explorer tree the same way it omits FAQ and W18 move stubs;
  do not leave an unassigned published page to append after the last top group
  (that leaks into Additional references under `pageEntriesUnderSeparator`).
  Direct URL, documentation section index, and search still include the page.
- Dual-page API how-to proof (`documentation/api` vs `references/api`): colocate
  page-local tests under `src/content/docs/documentation/api/api-page.test.tsx`.
  Assert Mode A how-to identity, default base URL / factory-running / session-flow
  teaching, a reader-visible `a[href="/docs/references/api"]` (How To Use + Related),
  and absence of catalog UI markers (`[data-api-reference-projection]`,
  `[data-api-operation-navigator]`, `[data-api-fumadocs-operations]`). Do not
  assert explorer sidebar membership or Lane A maps from that page-local proof.
- `/docs/concepts/tokens` is the model-inference token concept (LLM/context/cost
  units). When rewriting or consuming that page, retarget program-doc related
  links and `relatedIds` that treated Tokens as the factory/work-token glossary
  (for example Petri, Metrics) to program documentation surfaces such as
  `/docs/documentation/petri`, configuration, workstations, or submitting-work.
  Keep Petri/CPN teaching body intact; change only href/label/message keys,
  registry `relatedIds`, and matching focused tests.
- `/docs/concepts/skills` teaches agent/harness skills as reusable instruction
  packages (Cursor Agent Skills / `SKILL.md` practice), not tools, not MCP, and
  not this repo's frontend `docs/design-skills.md` authoring guide. Factory map
  `FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG.skills` already places it under
  Harnesses — do not add a redundant editorial `sidebarGrouping.concepts`.
  Once sibling concept pages ship, add them to `relatedIds` (Skills includes
  `concept.mcp` and `concept.tool-calling` when those pages exist); use
  `LocalizedLinkList` planned hrefs only while a sibling is still unpublished.
- `/docs/concepts/mcp` teaches Model Context Protocol as the host↔server
  protocol that exposes named tools (including Factory Session tools via
  `you mcp serve`). It is isolation-first and distinct from
  `/docs/documentation/mcp` (install/host JSON / serve-mode reference). Factory
  map already places `mcp` under Harnesses — omit redundant editorial
  `sidebarGrouping.concepts`. Related links must include the MCP
  program-documentation page; include `concept.tool-calling` in `relatedIds`
  once that page ships.
- `/docs/concepts/tool-calling` teaches tool calling as the model-inference
  behavior of selecting and invoking named tools during an agent/model turn,
  grounded in `agentTools.policy` on `AGENT_WORKER` (`DISABLED` default,
  `READ_ONLY` / `ENABLED` for bounded filesystem tools). Factory map already
  places `tool-calling` under Model inference — omit redundant editorial
  `sidebarGrouping.concepts`. Distinguish from Tool (named capability), MCP
  (host↔server protocol), and Thinking (deliberative reasoning). Link Workers
  documentation for the full field contract; do not absorb the workers
  reference on the concept page.
- `/docs/concepts/tool` retains a distinct scope as the named callable
  capability (name/arguments/result contract). Do not re-teach the
  select-and-invoke / `agentTools.policy` story on Tool—that belongs on Tool
  calling. Cross-link Tool ↔ Tool calling, MCP, Skills, and Harness so readers
  get one canonical explanation path per idea.
- Multi-page concept repair lanes (for example Tokens rewrite + Skills/MCP/Tool
  calling) should colocate `<slug>-discoverability.test.tsx` under each owned
  bundle to prove concepts-index listing, `docsSearchApi` / search-document
  aliases, `listPublicSitemapRoutes()`, and `buildDocsPageMetadata` without
  editing shared search helpers. Keep locale stubs key-shape-aligned with `en`
  (`ja` / `zh-CN` / `vi`); section-index and shipped-localized-docs expectations
  already cover non-en browse listing when stubs ship.
- Registry `relatedIds` should omit records without published docs pages; for
  example `paper.ltx-2` can stay in model/paper metadata but must not appear in
  concept `relatedIds` until `/docs/papers/ltx-2` ships.
- Forward next-step links to sibling lanes that are not yet published on this
  branch: prefer `LocalizedLinkList` in the how-to-use (or equivalent) section
  with canonical planned hrefs (for example `/docs/guides/getting-started`,
  `/docs/documentation/cli`, `/docs/documentation/architecture-of-system`).
  `RelatedDocs` filters out items without published hrefs, so curated
  `relatedIds` alone will not show reviewer-visible navigation for unpublished
  targets. `LocalizedLinkList` is registered in MDX components and is not in
  `LINK_VALIDATION_MARKDOWN_COMPONENTS`, so planned destinations stay
  mergeable under current linkcheck rules without authoring the target pages.
- `validatePublishedGlossaryClassification` in `validate-glossary-classification.ts`
  blocks published glossary pages that lack `primaryClassificationId` unless
  `sidebarGrouping.glossary` provides an explicit editorial fallback; wired through
  `validateDerivedPublishedPageBundles` and `make validate-data`.
- Browse proof: `src/tests/content/browse-index.test.tsx` and
  `src/tests/content/glossary-decomposition-browse-built-app.test.tsx` assert
  factory CLI browse headings and the absence of retired Atlas browse cards at
  desktop and narrow viewports when integration tests run.

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

When rebasing a family-index lane onto `main` that already authored another
direct route family (workers index, factories authored index, events-on-
references collection listing, schema sibling pages listed via the generic W05
collection index, etc.), reconcile
`src/tests/content/section-indexes.test.tsx` by keeping each authored
family-index proof and narrowing empty-state cases to families that are still
empty (today: workstations only). Prefer the authored family-index assertions
(intro + discoverability hrefs + freshness markers) over main’s generic
collection-listing proofs for the same route once
`renderReferencesFamilyIndexPage` owns `/docs/references` — sibling schema /
events bodies remain published under their own page routes. Do not restore
empty-state-as-primary for a family this lane authored, and do not drop main’s
workers or factories authored-index assertions while resolving references
conflicts. Also reconcile
`src/lib/docs/section-collection-index.test.ts` so generic-helper empty-state
loops match still-empty families only (keep factories authored-entry proofs).
The same rebase often dual-edits
`docs/internal/processes/content-page-generation-workflow-relevant-files.md` —
keep both sides’ notes (including any “First published `references` schema
page” section from schema lanes and factories index loader notes).

When several documentation lanes land close together, the exported-site
`totalOutBytes` / `searchBootstrapBytes` gates in
`src/lib/build/exported-site-budget.ts` can fail even though each lane alone
was under budget. Raising
`FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxTotalOutBytes` and/or
`maxSearchBootstrapBytes` (and the matching expectations in
`exported-site-budget.test.ts` plus the documented baselines in
`restore-required-tests-gates-relevant-files.md`) is valid mergeability work
when the measured `out/` size is the concrete CI blocker—keep the bump modest
and recalibrate from the observed CI measurement rather than inventing a second
budget policy.

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

Supported `section` values for local-docs dispatch: `glossary`, `concepts`,
`guides`, `techniques`, `documentation`. Retired Atlas sections (`modules`,
`models`, `papers`, `training`, `systems`) are not accepted by
`parseLocalDocsPageRef` / `loadLocalDocsPage`.

When publishing the first authored page under a rewrite-era CLI section
(`guides`, `techniques`, or `documentation`), also confirm:

1. `PUBLISHED_DOCS_SECTIONS` and `publishedDocsHrefFromEntry` in
   `src/lib/content/published-docs-registry-contract.ts` recognize that section,
   with matching `*PageHref` helpers in `src/lib/content/content-hrefs.ts`.
2. `parseLocalDocsPageRef` / `loadLocalDocsPage` in
   `src/lib/content/local-docs-page.ts` include the section, with a matching
   `*-page.ts` / `*-page-load.ts` pair (same shape as `guide-page*`) so
   message-backed MDX resolves through `DocsPageProviders`.
3. `bun run audit:canonical-page-surface -- --page-dir src/content/docs/<section>/<slug> --exception-reason "..."`
   reports `declare-exception` for that first-page wiring (not
   `redirect-to-throughput-prd`). The audit maps CLI registry kinds
   (`guide` / `technique` / `documentation`) and ignores section-root
   `.gitkeep` when inferring page scope. Repeat the exception reason in the PR
   conversation comment. Do not add a shared
   `src/lib/content/local-docs-page.test.ts` for the new section — that path is
   outside the first-CLI-section allowlist and forces
   `redirect-to-throughput-prd`. Colocate `parseLocalDocsPageRef` /
   `isLocalDocsCatchAllSlug` proofs under the page bundle
   (`src/content/docs/<section>/<slug>/<slug>-page.test.tsx`) instead, and flip
   `src/tests/content/section-indexes.test.tsx` from empty-state to
   authored-entry for the default-locale index.

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
`DocsPageProviders`. Do not put the real reader title only in Fumadocs
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

### Documentation workers taxonomy matrix (page-local)

For `documentation/workers` taxonomy copy, keep a distinct `#worker-taxonomy`
`Section` after `#key-concepts` (template order stays intact; taxonomy is an
extra teaching surface before `#how-to-use`). Put matrix headers, public type
names, behavior cells, when-to-use cells, and the legacy-alias note under page
`links.*` keys — same reason as CLI matrices: `pageSectionSchema` only keeps
`title`/`body`. Render an always-visible HTML `<table>` with
`<T k="links.…" />` in each cell so `INFERENCE_WORKER`, `AGENT_WORKER`,
`SCRIPT_WORKER`, and `POLLER_WORKER` are readable without hover.

Orient from `you docs workers` for type/behavior/when-to-use meaning, but
rewrite for web scanning. Mention `MODEL_WORKER` / `HOSTED_WORKER` only as
migration guidance and prefer the current public names for new configs.

### Documentation workers ownership, examples, and core fields (page-local)

Authored `/docs/workers/*` and `/docs/workstations/*` pages (family indexes +
variant pages, including `/docs/workers/mock`) use purpose/howto teaching:
`#how-to-use`, then
`#schema-reference` (messages `sections.schemaReference`, not “Variant
Fields”) and `#examples`. Do not restore bordered Opening summary shell chrome
(`DocsOpeningSummary` / `data-opening-summary`) — the shared docs slug renderer
no longer mounts it. Do not restore `#what-it-covers` /
`#key-concepts` summary intro sections on those trees. Fold discriminator
identity into `#how-to-use` (label + value line) rather than a separate Key
Concepts section. Workstation family index follows the same intro shape;
type/behavior selection and the compatibility matrix stay after how-to-use.
Do not restore `#operational-cautions` or `#limits-and-assumptions` on
worker/workstation authored trees (including family indexes); companion
facts stay in purpose / how-to-use / schema reference / examples, and
failure-class tables that lived only under cautions are removed with that
chrome.

Worker/workstation `*VariantSchemaEmbed` components pass
`showVariantHeading={false}` and `showPointerBreadcrumb={false}` into
`SchemaVariantReference` so embeds omit reader-facing `Variant: XX_*` headings
and `/$defs/Worker` / `/$defs/Workstation` pointer breadcrumb chrome. Defaults
on those props stay `true` so Factory schema / you-config / mock-workers
reference pages keep their current chrome.

Workstation authored page titles (frontmatter `title` + matching
`messages.title`) and in-family sibling/companion link labels use concrete
`… workstation` forms — for example `Classifier workstation`,
`Logical move workstation`, `Agent-run workstation`, `Standard workstation`.
Do not restore `… type`, `… behavior`, or `Agent-run type` / `Classifier type`
as the primary display title. Routes/slugs stay unchanged; only display
titles and owned link labels change. `MODEL_WORKSTATION` displays as
`Model workstation` (avoid `Model-workstation workstation`).

On `/docs/workers/agent`, `#related` uses `<RelatedDocs />` alone (no
duplicate hand-built `LocalizedLinkList` of the same destinations beside it).
JSON examples render through shared `CodePanel` (not bare unstyled
`<pre><code>`). Do not restore `#tags` / `#references`
(`TagPillList` / `CitationList`) footer chrome on that page.

Page-local worker/workstation tests must prove that polished shape
behaviorally (rendered headings/copy, not file inventories):

- Assert `openingSummary` + `howToUse` message bodies (purpose teaching), and
  for family-index App Router renders also assert the purpose lead appears in
  HTML.
- Assert visible `#how-to-use` / `#schema-reference` / `#examples` (or mock’s
  `#schema-fields`) presence with `getByRole` headings.
- Assert removed chrome with `queryByRole(...).toBeNull()` for What It Covers,
  Key Concepts, Operational Cautions, and Limits And Assumptions (family
  indexes included).
- On variant embeds, assert `queryByText("Variant: …")` is null and the
  definition-header breadcrumb is absent via
  `:scope > header [data-testid="schema-breadcrumb"]` (field-row breadcrumbs
  still use that test id).
- Assert concrete workstation `messages.title` forms (`… workstation`) and
  Agent worker RelatedDocs-only related
  (`section#related [data-testid="curated-related-docs"]`) with no Tags /
  References headings.
- Do not edit Factory schema / you-config / mock-workers *reference* page
  tests for this chrome trim unless proving shared opt-in defaults stay
  unchanged.

Browser-verify the polished chrome on representative live routes (at least
`/docs/workers/agent` and `/docs/workstations/classifier`) with a unique
port in `3100–3999`, kill the server before exit, and prefer
`bun ./scripts/run-next.ts dev --webpack -p <port> -H 127.0.0.1` in
parent-hoisted worktrees (plain Turbopack `bun run dev` can fail to resolve
`next` from `src/app`). Assert from SSR HTML: purpose lead after the H1,
`#how-to-use` / `#schema-reference` / `#examples`, no What It Covers / Key
Concepts / Operational Cautions / Limits And Assumptions, no
`Variant: XX_*` heading, no definition-header
`[data-testid="schema-breadcrumb"]` (do **not** treat field-row `$ref →
/$defs/…` links or `data-schema-definition-pointer` attributes as chrome
noise), concrete `… workstation` title on the workstation page, and on
agent: RelatedDocs (`curated-related-docs`),
`data-agent-worker-example-code`, and absent `#tags` / `#references`.

For `documentation/workers` how-to-use teaching, keep ownership split,
minimal authoring example, and type-specific cues inside `#how-to-use`
(stable anchor). Put ownership matrix cells, example label/body, and
type-guidance strings under page `links.*` keys — same reason as taxonomy:
`pageSectionSchema` only keeps `title`/`body`. Render:

- an always-visible ownership HTML `<table>` (worker-owned vs workstation-owned)
- a minimal agent-worker example as `<pre><code><T k="links.…" /></code></pre>`
- short type-guidance bullets for inference / agent / script / poller

Keep a distinct `#core-fields` `Section` after `#how-to-use` for the
structured field reference table (type, model/provider, command/args,
poller provider/auth, operations). Orient from `you docs workers` for field
meanings, but rewrite for web scanning and avoid a full flag dump.

### Documentation workers limits and sibling discovery (page-local)

Authored `/docs/workers/*` and `/docs/workstations/*` (including family
indexes) no longer mount `#limits-and-assumptions` or `#operational-cautions`.
Scope boundaries that used to live in those sections belong in purpose /
how-to-use / schema reference / examples when still needed for authoring.
Keep the page isolation-first: sibling links aid discovery but must not be
required to define what a worker is.

When B04 siblings (`configuration`, `workstations`, `resources`) are not yet
published in this worktree, wire reviewer-visible discovery with page-local
`<LocalizedLinkList>` and planned hrefs under `#how-to-use` (same pattern as
install / what-is). Leave registry `relatedIds` empty until those sibling
registry records and published pages exist; keep `<RelatedDocs />` in
`#related` for when curated ids can resolve cleanly.

### Documentation Program core intro strip (page-local)

For Documentation Program **core product** pages under
`src/content/docs/documentation/` (`what-is-you-agent-factory`, `install`,
`cli`, `mcp`, `contributing-to-these-docs`, `faq`, `troubleshooting`,
`submitting-work`, `harness-support`, `architecture-of-system`):

- Remove `#what-it-covers` / `#key-concepts` Sections from `page.mdx` and delete
  `sections.whatItCovers` / `sections.keyConcepts` from all locale messages.
- Keep a short purpose `openingSummary` message when useful for non-chrome reuse
  (add one sentence only when the page would otherwise open with no useful
  lead). Do not clear it to `""` the way Events/JS reference intro-strips do —
  but the shared docs slug renderer no longer mounts `DocsOpeningSummary` as a
  bordered Opening summary lead box; do not revive What It Covers / Key Concepts
  chrome as a replacement.
- Strip `#how-to-use` / `sections.howToUse` only when it is opening meta reading
  guidance before real teaching. Keep it when it holds the page’s primary
  procedure (for example install commands, contributing steps) or when it sits
  after teaching sections (for example MCP integrate/serve/tools).
- Do not expand this strip into ops/platform Documentation Program trees
  (`logs`, `metrics`, `resources`, `petri`, `packaged-documents`,
  `dashboard-ui-overview`, `security-trust-boundaries`, `throttling-and-limits`,
  `replays-records`) — those belong to the sibling ops intro-strip lane.
- Flip owned page tests (page-local under those trees plus
  `src/lib/content/{what-is,install,cli}-page.test.tsx`) to assert intro
  absence with `queryByRole(...).toBeNull()` / `toBeUndefined()` on
  `whatItCovers` / `keyConcepts` (and `howToUse` when stripped as opening
  boilerplate), while still proving remaining teaching headings/content and a
  non-empty purpose `openingSummary`. Do not delete shared helpers/modules
  while stripping intros.
- Browser-verify the ten core routes with
  `bun src/content/docs/documentation/assert-documentation-program-core-intro-strip-browser.ts`
  (webpack `next dev` via `scripts/run-next.ts`, unique port 3587 default,
  Playwright; kill server on exit). Assert absent What It Covers / Key Concepts
  headings and `#what-it-covers` / `#key-concepts`; absent bordered Opening
  summary shell markers (`[data-opening-summary="folded"]` /
  `[data-testid="folded-summary"]` / `aria-label="Opening summary"`) because the
  shared renderer no longer mounts that chrome; at least
  one teaching section id still mounted; `#how-to-use` absent on pages where it
  was stripped as opening boilerplate (what-is, cli, faq, troubleshooting,
  submitting-work). Prefer `DOC_PROGRAM_CORE_INTRO_STRIP_PROBE_BASE_URL` when a
  server is already warm.

### Documentation CLI limits and sibling discovery

For `documentation/cli`, open on `#install` then `#commands` after the purpose
`openingSummary` — do not restore `#what-it-covers` / `#key-concepts` or a meta
`#how-to-use` opener. Keep `#limits-and-assumptions` as the scope boundary: web
install + command matrix only — not a flag dump, not a packaged-docs sync, and
not harness/MCP/config deep pages.

Wire sibling discovery through registry `relatedIds` + `<RelatedDocs />` only
when the sibling registry records and published pages exist (for example
getting-started or install deep-dive). Omit unpublished sibling ids from
`relatedIds` so validation and related rendering stay clean; do not invent
page-meta “on this page” prose or hard-coded sibling route lists in MDX.

### Freshness ownership on maintainer-facing surfaces (page-local)

When a PRD asks for freshness ownership on a changelog hub or structured
command inventory, put reader-visible maintainer copy on the page itself:
owner role (for example site docs maintainers), source of truth (GitHub
Releases for release hubs; product CLI / `you docs agents` for command
inventories), and refresh trigger (new product release, command add/rename,
or running-factory semantics change). Prefer a dedicated
`#freshness-ownership` section on documentation pages (message-backed) or a
`## Freshness ownership` heading on blog hubs. State explicitly that this is
a human maintainer checklist — do not invent automated governance CI, owner
registry fields, or Atlas-era process prose. Bump `updatedAt` (and blog
`publishedAt` when first authored) to match the content change.

When a lane ships both a releases/changelog blog hub and a CLI command-index
documentation page, wire one-click quick-reach among install, commands, and
release changes on both surfaces: blog hubs use in-prose markdown links (and
`relatedDocIds` for metadata) because `BlogRelatedDocs` only resolves concept
ids; documentation pages use message-backed `<LocalizedLinkList>` under
`#related` for `/docs/documentation/install`, `/docs/documentation/cli`,
`/blog/changelog`, and the GitHub Releases archive URL. Keep registry
`relatedIds` on the command-index record for published documentation siblings
(install/cli) without inventing blog registry ids.

### Documentation replays-records sensitivity, limits, and sibling discovery

For `documentation/replays-records`, keep sensitivity and retention in default-locale
prose (key concepts / how-to-use / limits): artifacts can contain prompts, payloads,
stdout, stderr, and diagnostic metadata; the product does not auto-delete; operators
manage retention; real customer-run recordings must not be committed. Keep
`#limits-and-assumptions` as the scope boundary: web record/replay reference — not a
packaged CLI sync, not factory-session pause/resume/status, not mock-worker selection,
not logs/metrics/API, and not a full factory-authoring walkthrough. Mention packaged
`you docs record-replay` / `you docs mock-workers` / `you docs authoring-factories` as
external CLI topics in prose without embedding those docs wholesale.

Wire published sibling discovery with page-local `<LocalizedLinkList>` and `links.*`
labels under `#related` (for example `/docs/documentation/cli`,
`/docs/documentation/configuration`, `/docs/documentation/submitting-work`).
Documentation kind is outside `listRelatedRegistryRecords()` /
`getRegistryRecordById()`, so `<RelatedDocs />` alone will not render
documentation→documentation curated links. Keep registry `relatedIds` aligned with
those published siblings for search/metadata when useful; omit unpublished ids such
as factory-session until those registry records and pages exist. Keep
`<RelatedDocs />` in `#related` for when related-runtime can resolve curated ids.
The same `#related` + `<LocalizedLinkList>` pattern applies to other documentation
lookup surfaces such as `documentation/troubleshooting` and `documentation/faq`
(cross-link FAQ↔Troubleshooting plus a short curated canonical set).

For page tests that read bundle files, keep the same assertions after switching
from a `*_PAGE_DIR` import or `join(sectionRoot, slug)` to the derived lookup.

### Documentation dynamic-workflows API interface matrices (page-local)

For `documentation/dynamic-workflows` API interface copy, keep a single
`#api-interface` `Section`. Put overview prose in `sections.apiInterface.body`,
surface intros in `callouts.{cliSurface,mcpSurface,durableInspection}.body`,
and matrix headers/cells under page `links.*` keys — `pageSectionSchema` only
keeps `title`/`body` on sections. Render always-visible HTML `<table>` blocks
with `<T k="links.…" />` so CLI commands (`you workflow validate|start|status|
result|dispatches|artifacts|events`), canonical MCP tools
(`you.factory_session.*`), compatibility aliases (`you.workflow.*`), and durable
inspection surfaces (`you session list|show`, session-scoped events, Factory
preview) are reviewer-visible without hard-coded command strings in MDX.

Orient from `you docs orchestrators`, `you docs mcp-hosts`, and
`you docs sessions`. Keep the live-run noun as `FactorySession`; do not invent
a separate dynamic-workflow resource type.

### Documentation dynamic-workflows configuration matrices (page-local)

For `documentation/dynamic-workflows` configuration copy, keep a single
`#configuration` `Section`. Put overview prose in `sections.configuration.body`,
surface intros and the serve-mode boundary in
`callouts.{sourceResolution,mcpHostConfig,serveModes,serveModeBoundary}.body`,
and matrix headers/cells under page `links.*` keys — same strip-avoidance as the
API interface matrices. Render always-visible HTML `<table>` blocks with
`<T k="links.…" />` so source knobs (`--dir`, `WORKFLOW_NAME`, `INLINE_WORKFLOW`,
`--args-schema`, `--requested-policy`), MCP host fields (`command`, `args`,
`cwd`), and serve modes (fixture-backed `mcp serve` vs runtime-backed
`mcp serve --runtime`, including do-not-combine `--runtime` with
`--fixture-catalog`) are reviewer-visible without hard-coded strings in MDX.

Orient from `you workflow validate --help` and `you docs mcp-hosts`. Stay at
dynamic-workflow configuration depth; do not absorb the full Petri
`factory.json` topology owned by the configuration documentation page.

### Documentation dynamic-workflows limits and sibling discovery (page-local)

For `documentation/dynamic-workflows`, keep `#limits-and-assumptions` as the
scope boundary: web reference for JavaScript dynamic-workflow API interface and
configuration only — not the Cursor first-loop guide, not the full MCP host
catalog deep dive beyond dynamic-workflow needs, and not the Petri
`factory.json` topology overview. Keep the page isolation-first: sibling links
aid discovery but must not be required to define the topic.

Wire reviewer-visible next steps with page-local `<LocalizedLinkList>` and
`links.*` labels under `#how-to-use` (Cursor dynamic-workflows guide,
configuration, CLI, harness support). Leave registry `relatedIds` empty for
guide and documentation targets while related-runtime omits those kinds;
keep `<RelatedDocs />` in `#related` for when curated ids can resolve cleanly.

## Core content paths

* `src/lib/content/content-paths.ts`
  Canonical path helpers. Module JSDoc documents the derived page directory
  contract. `getDocsPageDir(section, slug)` accepts nested slug paths
  (`parent/child`) so route-family child pages resolve beyond two segments.
  Add shared roots or section helpers here only when the path is not an
  ordinary single-page directory.
* `src/lib/content/docs-page-directories.ts`
  Shared `findDocsPageDirectories` walker used by published-page load,
  shipped-locale manifests, and derived bundle validation. Continues under
  directories that already contain `page.mdx` so nested child bundles are
  discovered.
* `src/lib/content/routable-docs-page.ts`
  `isLocalDocsPageBundlePath` accepts section + one-or-more slug segments
  (`guides/foo` and `workers/agent/variant`) for Fumadocs routing exclusion.
* `src/lib/content/local-docs-page.ts`
  `parseLocalDocsPageRef` accepts catch-all slugs with two or more segments
  under every `DOCS_SECTIONS` id (including references/factories/workers/
  workstations). Nested page segments join into `slug` (`agent/variant`).
  One-segment collection indexes stay null. Route-family sections load through
  `loadRouteFamilyLocalDocsPage`.
* `src/lib/content/route-family-local-docs-page.ts` /
  `route-family-local-docs-page-load.ts`
  Generic local-message disk loader for the four direct route families; uses
  `getDocsPageDir` so nested child bundles resolve. Page-local MDX components
  use the same `page-mdx-components.tsx` + static slug switch pattern as
  documentation/concept loaders (relative imports in `page.mdx` do not resolve
  under `compileMDX`). Factories examples:
  `factories/configuration` →
  `@/content/docs/factories/configuration/page-mdx-components` for the W07
  `FactoryRootSchemaEmbed`; `factories/global-configuration` →
  `@/content/docs/factories/global-configuration/page-mdx-components` for
  You-config root plus addressed Factory `FactoryName` / `RunnerID` embeds;
  `factories/packaged` →
  `@/content/docs/factories/packaged/page-mdx-components` for addressed
  `FactoryName` plus root Factory metadata/`sourceDirectory` teaching embed
  (property pointers do not resolve as addressed catalog definitions);
  `factories/dynamic-workflows` →
  `@/content/docs/factories/dynamic-workflows/page-mdx-components` for addressed
  `FactoryOrchestrator`, `FactoryOrchestratorJavaScriptConfig`, and
  `FactoryInvocationSignature` teaching embeds (link out for exhaustive
  schema/API lookup; do not paste OpenAPI/operation inventories into the page);
  `factories/sessions` →
  `@/content/docs/factories/sessions/page-mdx-components` for addressed
  `FactoryName` teaching the Factory a session loads (FactorySession /
  Dispatch / event contracts live in OpenAPI — link
  `/docs/references/{schema,api,events}` rather than inventing session schema
  embeds outside W07 JSON Schema package models).
  Factories authored child pages
  (`configuration` / `global-configuration` / `packaged` / `dynamic-workflows` /
  `sessions`) keep a short `openingSummary` message when useful for non-chrome
  reuse, then open MDX on the first teaching section (for
  example `#what-lives-where`, `#operator-model-defaults`,
  `#discovery-and-resolution`, `#orchestrator-schema`, or
  `#factory-relationship`). Do not restore bordered Opening summary shell chrome
  via the shared docs slug renderer, and do not restore `#what-it-covers` /
  `#key-concepts` or `sections.whatItCovers` / `sections.keyConcepts` on those
  trees. Leave the factories family index overview / root summary embed alone
  unless it literally ships those intros. Do not expand this intro strip into
  workers/workstations (separate polish), documentation Program pages, or
  reference schema pages (batch-004).
  Factories page-local tests assert intro absence the same way as polished
  reference pages: `sections.whatItCovers` / `sections.keyConcepts` are
  `undefined`, `queryByRole` for those headings returns null, and
  `#what-it-covers` / `#key-concepts` ids are absent — while still proving
  teaching headings, ready schema embeds, and lookup links (`openingSummary`
  message fields may remain unused by shell chrome).
  Do not require How To Use / Limits / Related absence on factories pages that
  still ship those non-intro sections.
  Browser-verify Factories intro strip on the five child routes with
  `bun ./scripts/run-next.ts dev --webpack -p <3100-3999> -H 127.0.0.1`
  (Turbopack often fails in parent-hoisted worktrees). Fetch SSR HTML and
  assert: no `What It Covers` / `Key Concepts` headings, no
  `#what-it-covers` / `#key-concepts`, no bordered Opening summary markers
  (`data-opening-summary` / `data-testid="folded-summary"`), and the first
  teaching section id/title visible
  (`#what-lives-where`, `#operator-model-defaults`,
  `#discovery-and-resolution`, `#orchestrator-schema` titled
  Orchestrator Identity, `#factory-relationship`). Kill the server before
  exit. In zsh verify scripts, do not assign to `path` (it aliases `PATH`).
  After stripping factories `what-it-covers`, retarget
  `DOCUMENTATION_ROUTE_MIGRATION_IMPORTANT_ANCHORS` for those five routes to
  the first teaching section ids above or W18 migration-closure /
  `make test-build-contract` fails.
  Treat each loader switch as a narrow shared-surface exception and declare it
  with `audit:canonical-page-surface --exception-reason`.
* `src/lib/content/published-docs-registry-contract.ts` /
  `src/lib/content/content-hrefs.ts`
  `PUBLISHED_DOCS_SECTIONS` includes `factories` with `factoriesPageHref` and
  `publishedDocsHrefFromEntry` so authored `/docs/factories/<slug>` (including
  `getDocsPageDir` so nested child bundles resolve.
* `src/lib/content/published-docs-registry-contract.ts` /
  `src/lib/content/content-hrefs.ts`
  `PUBLISHED_DOCS_SECTIONS` includes `workers` with `workersPageHref` and
  `publishedDocsHrefFromEntry` so authored `/docs/workers/<slug>` (including
  nested slugs) validate and resolve without
  `Unsupported published docs section`. Do not treat this as W15–W18 nav /
  search / sitemap / compat inventory ownership — those stay deferred.
* `src/lib/content/published-docs-registry-contract.test.ts`
  Factories section membership, nested href proofs, and unchanged CLI section
  href behavior.
  Workers section membership, nested href proofs, and unchanged CLI section
  href behavior.
* `src/content/docs/workers/` family index composition (W13)
  `/docs/workers` stays an App Router family index (not
  `workers/page.mdx` — `isLocalDocsPageBundlePath` rejects section-root
  bundles). Authored overview/selection/shared-fields/schema embed live as
  page-local messages + React composition under `src/content/docs/workers/`
  (`render-workers-family-index.tsx`, `WorkersFamilyIndexContent.tsx`,
  `WorkerBaseSchemaEmbed.tsx` via W07 `SchemaReference` addressed to
  `/$defs/Worker`). Registry id `documentation.workers-family`. Unshipped
  locales fall back to `messages/en.json`. Wire
  `src/app/(site)/docs/workers/page.tsx` and the locale mirror to
  `renderWorkersFamilyIndexPage` instead of the empty collection contract.
* `src/content/docs/workers/<variant>/` variant pages (W13)
  Child Worker pages are ordinary route-family local-message bundles
  (`page.mdx` + `messages/en.json` + `assets.json` + registry
  `documentation.workers-<variant>`). Embed production overlays with W07
  `SchemaVariantReference` via a page-local `*VariantSchemaEmbed` that loads
  the Worker base definition (`load-worker-base-schema.ts`), builds the
  overlay from `createProductionWorkerOverlay`, and maps slots through
  `factory-variant-overlay-presentation.ts` (shared under workers ownership —
  do not rewrite W06/W07 cores). Register the embed in
  `page-mdx-components.tsx` and add a static slug switch in
  `route-family-local-docs-page-load.ts` (same compileMDX constraint as
  documentation/concept loaders — relative MDX imports do not resolve). Link
  Workstation companions with `LocalizedLinkList` hrefs under
  `/docs/workstations/...` (implementers: do not author W14 pages in this
  lane). Keep customer-facing Limits / body copy product-scope only: say what
  the Worker is / is not and what companion links mean (run-time pairing),
  never narrate “planned Workstation targets” or “without authoring those
  pages here.” Keep mock workers on
  `/docs/workers/mock`, not as a Factory WorkerType overlay. Legacy
  `MODEL_WORKER` companions are `MODEL_WORKSTATION` (required) plus
  `MODEL_INVOKE` (compatible) at `/docs/workstations/model-workstation` and
  `/docs/workstations/model-invoke`; capability fields stay in overlay
  `shared` (presentation omits shared paths — assert selected/excluded only).
  Prefer `INFERENCE_WORKER` / `AGENT_WORKER` guidance in prose for new configs.
  Legacy `HOSTED_WORKER` companions are `LOGICAL_MOVE` (required) plus
  `CLASSIFIER_WORKSTATION` (compatible) at `/docs/workstations/logical-move`
  and `/docs/workstations/classifier`; hosted provider fields (`provider`,
  `auth`, `linear`) stay in overlay `shared`. Prefer `POLLER_WORKER` guidance
  in prose for new configs; misuse example is inline `auth.apiKey`
  (`worker.hosted.misuse-inline-secret`).
  Mock workers (`/docs/workers/mock`) are **not** a Factory WorkerType page:
  embed `@you-agent-factory/api/schemas/mock-workers` via W07
  `SchemaReference` addressed to `/$defs/mockWorker` (page-local
  `load-mock-workers-schema.ts` + `MockWorkersSchemaEmbed`), never
  `SchemaVariantReference` / production Worker overlays. Identity line is
  `runType = accept | script | reject`, not `type = MOCK_WORKER`. Link the
  planned full schema at `/docs/references/mock-workers-schema`; misuse
  teaching is Factory Worker shape (`name` + `type`) on a mock entry
  (`worker.mock.misuse-worker-type`).
* `src/lib/content/route-family-local-docs-page-load.ts`
  Generic local-message disk loader for the four direct route families; uses
  `getDocsPageDir` so nested child bundles resolve. W13 adds an optional
  page-mdx-components merge for workers variant embeds (static slug switch).
* `src/lib/content/local-docs-page.test.ts`
  Nested parse/load proofs and fail-closed checks (temp fixtures; no production
  content pages).
* `src/lib/content/published-docs-registry-contract.ts` /
  `src/lib/content/content-hrefs.ts`
  `PUBLISHED_DOCS_SECTIONS` includes `workstations` with `workstationsPageHref`
  and `publishedDocsHrefFromEntry` so authored `/docs/workstations/<slug>`
  (including nested slugs) validate and resolve without
  `Unsupported published docs section`. Do not treat this as W15–W18 nav /
  search / sitemap / compat inventory ownership — those stay deferred.
* `src/lib/content/published-docs-registry-contract.test.ts`
  Workstations section membership, nested href proofs, and unchanged CLI
  section href behavior.
* `src/content/docs/workstations/` family index composition (W14)
  `/docs/workstations` stays an App Router family index (not
  `workstations/page.mdx` — `isLocalDocsPageBundlePath` rejects section-root
  bundles). Authored overview / type+behavior selection / type-versus-behavior
  compatibility matrix / shared-fields / schema embed live as page-local
  messages + React composition under `src/content/docs/workstations/`
  (`render-workstations-family-index.tsx`, `WorkstationsFamilyIndexContent.tsx`,
  `WorkstationBaseSchemaEmbed.tsx` via W07 `SchemaReference` addressed to
  `/$defs/Workstation`). Registry id `documentation.workstations-family`.
  Unshipped locales fall back to `messages/en.json`. Wire
  `src/app/(site)/docs/workstations/page.tsx` and the locale mirror to
  `renderWorkstationsFamilyIndexPage` instead of the empty collection
  contract. Keep `POLLER_RUN` (type) distinct from `POLLER` (behavior) in
  selection copy and matrix headers.
* `src/content/docs/workstations/<slug>/` variant pages (W14)
  Behavior and type children are MDX page bundles (`page.mdx`,
  `messages/en.json`, `assets.json`, `page-mdx-components.tsx`, variant schema
  embed + examples + colocated `*-page.test.tsx`). Reuse
  `factory-variant-overlay-presentation.ts` under workstations ownership —
  do not rewrite W06/W07 cores. Embed via W07 `SchemaVariantReference` with
  `createProductionWorkstationBehaviorOverlay` /
  `createProductionWorkstationTypeOverlay` +
  `loadWorkstationBaseSchemaEmbedModel`. Register embeds in
  `page-mdx-components.tsx` and add a static slug switch in
  `route-family-local-docs-page-load.ts` (same compileMDX constraint as
  workers — relative MDX imports do not resolve). Link Worker companions with
  `/docs/workers` (or planned `/docs/workers/<slug>` hrefs) without authoring
  W13 pages. Keep customer-facing Limits / body copy product-scope only —
  never narrate “planned Worker targets” or “without authoring those pages
  here.”   Behavior pages so far: `workstations/standard` /
  `documentation.workstations-standard` (`behavior:STANDARD`, misuse = cron);
  `workstations/repeater` / `documentation.workstations-repeater`
  (`behavior:REPEATER`, change-triggered / rejection reloop, misuse = cron);
  `workstations/cron` / `documentation.workstations-cron` (`behavior:CRON`,
  selects exclusive `cron`, misuse = missing cron);
  `workstations/poller` / `documentation.workstations-poller`
  (`behavior:POLLER`, long-lived poller scheduling, misuse = POLLER-as-type
  axis collapse; keep `POLLER` distinct from type `POLLER_RUN` and link
  `/docs/workstations/poller-run`). Non-CRON behaviors share empty `selected`
  and exclude `cron` — STANDARD/REPEATER misuse stays on the cron field;
  POLLER's primary misuse is axis collapse (`type: "POLLER"`); CRON flips
  the cron pattern (selected `cron`, misuse omits it). Type pages so far:
  `workstations/inference-run` / `documentation.workstations-inference-run`
  (`workstation:INFERENCE_RUN`, requires `worker:INFERENCE_WORKER`, empty
  `selected`, misuse = `classificationRoutes`; link behaviors + `/docs/workers`
  without authoring W13);
  `workstations/agent-run` / `documentation.workstations-agent-run`
  (`workstation:AGENT_RUN`, requires `worker:AGENT_WORKER`, selects exclusive
  `openCodeAgent`, misuse = `operation` from MODEL_INVOKE);
  `workstations/script-run` / `documentation.workstations-script-run`
  (`workstation:SCRIPT_RUN`, requires `worker:SCRIPT_WORKER`, empty
  `selected`, misuse = `promptFile` from MODEL_WORKSTATION);
  `workstations/poller-run` / `documentation.workstations-poller-run`
  (`workstation:POLLER_RUN`, requires `worker:POLLER_WORKER`, empty
  `selected`, misuse = axis collapse putting `POLLER_RUN` on behavior;
  keep `POLLER_RUN` distinct from behavior `POLLER` and link
  `/docs/workstations/poller`);
  `workstations/model-workstation` /
  `documentation.workstations-model-workstation`
  (`workstation:MODEL_WORKSTATION`, requires `worker:MODEL_WORKER`, selects
  exclusive `promptFile` / `outcomeFormat` / `outputSchema` / `stopWords`,
  misuse = `operation` from MODEL_INVOKE; keep distinct from
  `model-invoke`);
  `workstations/model-invoke` / `documentation.workstations-model-invoke`
  (`workstation:MODEL_INVOKE`, requires `worker:MODEL_WORKER`, selects
  exclusive `operation` / `operationBindings`, misuse = `outcomeFormat`
  from MODEL_WORKSTATION; keep distinct from `model-workstation`);
  `workstations/logical-move` / `documentation.workstations-logical-move`
  (`workstation:LOGICAL_MOVE`, requires `worker:HOSTED_WORKER`, selects
  exclusive `guards`, misuse = `classificationRoutes` from
  CLASSIFIER_WORKSTATION; keep distinct from `classifier`);
  `workstations/classifier` / `documentation.workstations-classifier`
  (`workstation:CLASSIFIER_WORKSTATION`, requires `worker:HOSTED_WORKER`,
  selects exclusive `classificationRoutes`, excludes `outputs` /
  `onContinue` / `onRejection`, misuse = `outputs`; keep distinct from
  `logical-move`). Mirror this bundle for WorkstationType pages with
  `createProductionWorkstationTypeOverlay`.
* `src/app/(site)/docs/{references,factories,workers,workstations}/page.tsx`
  Default-locale collection index routes for the four W05 direct route
  families. Empty collections call `renderSectionCollectionIndexPage` with
  matching `*Index` messages (`DocsIndexEmptyState`). Authored family indexes
  (W14 workstations) call page-local `render*FamilyIndexPage` instead.
  families. References/workers/workstations call
  `renderSectionCollectionIndexPage` with matching `*Index` messages; empty
  collections render `DocsIndexEmptyState`. Factories uses the factories-owned
  `renderFactoriesIndexPage` composition (overview + W07 root Factory summary
  embed + child entry list) once authored factories pages exist.
  families. Workstations (still empty) call `renderSectionCollectionIndexPage`
  with matching `*Index` messages and render `DocsIndexEmptyState`. Factories
  uses the factories-owned `renderFactoriesIndexPage` composition (overview +
  W07 root Factory summary embed + child entry list). Workers uses the
  workers-owned family index. References uses
  `renderReferencesFamilyIndexPage` (authored intro owned under
  `src/content/docs/references/family-index/`) instead of empty-state-only UX.
* `src/app/[locale]/docs/{references,factories,workers,workstations}/page.tsx`
  Shipped-locale mirrors of the same four family indexes.
* `src/content/docs/factories/index/render-factories-index-page.tsx` /
  `FactoryRootSummaryEmbed.tsx` / `factories-index.test.tsx`
  Factories-lane index ownership: isolation-first overview copy from
  `factoriesIndex` messages, live root Factory SchemaReference embed
  (`showCatalog={false}`), links to `/docs/references/{schema,api}`, and the
  factories child-page list. Do not fold this into shared nav/search/sitemap
  inventories (W15–W18).
* `src/content/messages/*/common.json` (`factoriesIndex`)
  Extended factories index messages with `overviewTitle` / `overviewBody` /
  `schemaSummaryTitle` / `schemaSummaryBody` / full schema+API link labels
  (`FactoriesIndexMessages`).
* Factories sibling discovery (W12 related wiring): keep family-local
  `relatedIds` on each `documentation.factories-*` registry record pointing at
  sibling factories pages plus published workers/workstations/resources/
  sessions-adjacent documentation targets that already exist. Render
  reviewer-visible discovery with page-local `#related` `<LocalizedLinkList>`
  hrefs to `/docs/factories/...`, existing `/docs/documentation/{workers,
  workstations,resources,...}`, and planned `/docs/references/{schema,api,
  events}` — documentation kind still will not render under `<RelatedDocs />`
  alone. Do not invent workers/workstations content or references registry ids
  in this lane; keep `<RelatedDocs />` beside the LocalizedLinkList for when
  related-runtime can resolve curated documentation ids.
* Factories schema embeds under webpack static export: keep
  `serverExternalPackages: ["@you-agent-factory/api"]` in `next.config.ts`, and
  harden `resolveSchemaVerificationFsPath` to fall back from broken
  `require.resolve` / numeric module ids to the installed package `exports`
  map under `node_modules/@you-agent-factory/api/package.json`. Without that,
  prerender of `/docs/factories` (and localized factories indexes) fails with
  package-resolution TypeErrors during `make build`.
* `src/content/docs/references/family-index/`
  References family index ownership surface: `frontmatter.json` (`kind:
  reference`, `registryId: reference.references`), page-local `messages/en.json`,
  `assets.json`, composition (`ReferencesFamilyIndex.tsx`), loader, planned
  eight-route constants (`reference-family-routes.ts`), discoverability card
  resolver (`resolve-reference-family-discoverability.ts` — message sections
  keyed by route id supply title/body; hrefs stay on planned
  `/docs/references/...` paths even when sibling bodies are unpublished),
  ownership fence helpers (`ownership.ts` — allowed family-index root vs
  forbidden sibling page / foreign renderer / factories-workers-workstations
  roots; prove with path helpers, not source inventory scans), and colocated
  tests. Do not put sibling W11 page bodies (`api/`, `events/`, …) in this
  lane. Do not remount Package freshness on this landing — the exclusive
  freshness loader/view were removed; keep `openingSummary` (plain paragraph)
  + Contract surfaces only, not `sections.introduction` / What this family
  covers and not `sections.freshness` / `#package-freshness`. Browser-verify
  with
  `bun src/content/docs/references/family-index/assert-references-family-index-intro-strip-browser.ts`
  (webpack `bun run next` via `scripts/run-next.ts`, unique port default
  `3589`, or `REFERENCES_FAMILY_INDEX_INTRO_STRIP_PROBE_BASE_URL` when a server
  is already warm). The probe asserts introduction absence, purpose lead,
  eight discoverability hrefs including System configuration schema →
  `/docs/references/system-config-schema` (#177), Package freshness absence,
  and no empty-collection / you-config revival.
* `src/content/registry/references/`
  First `reference` registry collection. Wire new records through
  `REGISTRY_COLLECTIONS`, `registry.ts` directories, and
  `registry-runtime-generation.ts` (plus `canonical-page-surface-audit`
  `registryDirectoryByKind.reference`) the same way the first documentation
  records needed their loader path.
* `src/app/(site)/site-renderers.tsx`
  `renderShellSectionCollectionIndexPage` filters index entries by
  `routeSlug` prefix (`docsSlug.startsWith(`${routeSlug}/`)`), not
  frontmatter kind alone — required because factories/workers/workstations
  reuse `documentation` kind while keeping an independent public route.
  `renderReferencesFamilyIndexPage` loads the family-index ownership surface
  for `/docs/references` (purpose lead + Contract surfaces only — no Package
  freshness load).
* `src/lib/docs/section-collection-index.test.ts` /
  `src/tests/content/section-indexes.test.tsx`
  Empty-state + localized metadata proofs for still-empty family indexes;
  authored workstations index asserts `data-workstations-family-index` instead
  of the empty-state contract; factories must not list documentation child
  pages.
  factories flips to authored-entry + overview assertions and must not list
  documentation child pages.
  Empty-state + localized metadata proofs for still-empty family indexes
  (workstations); factories authored-entry + overview assertions; workers
  family-index proofs; references family index asserts purpose lead +
  Contract surfaces and absence of Package freshness /
  `sections.introduction` / What this family covers chrome; factories must
  not list documentation child pages.
* `src/lib/content/docs-catch-all-static-params.ts`
  Catch-all static-param helpers for nested docs slugs. Default-locale
  `generateStaticParams` merges Fumadocs source params with published-page
  discovery so nested route-family children enter the compile graph; localized
  params map shipped page slugs the same way. Family indexes themselves are
  dedicated App Router pages listed in
  `SUPPORTED_FACTORY_EXPORT_APP_PAGE_MARKERS` /
  `DIRECT_DOCS_ROUTE_FAMILY_INDEX_APP_PAGE_MARKERS` (not one-segment catch-all
  params). Empty collections still rely on `ensureStaticExportParams` so static
  export never emits an empty param list.
* `src/lib/content/docs-catch-all-static-params.test.ts`
  Nested fixture proofs for default/shipped catch-all params, empty-family
  export safety for still-empty references/factories/workers, authored
  workstations children in default catch-all params (W14), compile-graph
  index markers, and invalid nested not-found.
  Nested fixture proofs for default/shipped catch-all params, compile-graph
  index markers, and invalid nested not-found. After W13, default-locale
  params include authored `workers/<variant>` children; empty families
  (`references` / `factories` / `workstations`) still contribute none.
  Localized params stay empty for route-family children until those pages
  ship non-English message stubs.
* `src/lib/docs/supported-docs-route-family-mechanism.test.ts`
  Focused mechanism tests for the supported route-family contract: accept the
  four direct families (`references`/`factories`/`workers`/`workstations`),
  reject unknown family ids, accept nested slugs under those families, and
  preserve CLI collection acceptance. Asserts observable accept/reject/resolve
  outcomes from collection/route helpers — not source-file or registration
  inventory scans.
* `src/lib/content/content-paths-page-dir-guard.ts`
  Grandfathered allowlist for legacy `*_PAGE_DIR` exports and the guard failure
  message that points reviewers to `getDocsPageDir(section, slug)`.
* `src/lib/content/content-paths.test.ts`
  Contract tests for derived directories across every docs section, exported
  production roots, and the no-new-page-constants guard.
* `src/lib/content/docs-page-directories.test.ts`
  Nested-slug discovery proofs (temp fixtures under new families; no
  production content pages).

### First authored page under `/docs/references` (W05 route family)

The first published `references/<slug>` page needs more than the page bundle.
W05 already provides nested discovery, family indexes, and
`loadRouteFamilyLocalDocsPage`. Before the page can pass
`prepare:content-runtime` / `make validate-data` and appear in
`generateStaticParams` / the references index:

1. Add `references` to `PUBLISHED_DOCS_SECTIONS` and `referencePageHref` /
   `publishedDocsHrefFromEntry` in `published-docs-registry-contract.ts` +
   `content-hrefs.ts`. Without that, `docsSectionFromSlug("references/…")`
   throws and the published-docs scanner cannot index the page.
2. Add `references` to `REGISTRY_COLLECTIONS`, load `referenceRecordSchema`
   from `src/content/registry/references/` in `registry.ts`, include the
   directory in `registry-runtime-generation.ts`, and treat `reference` as
   linkable in `registry-linking.ts`. Schema/kind support already exists;
   the loader path was empty until the first record.
3. Map `reference` → `references` in
   `canonical-page-surface-audit.ts` `registryDirectoryByKind`. The audit
   also documents a first W05 route-family page exception for the narrow
   shared wiring above (plus section-index empty-state flips).
4. Remove `src/content/docs/references/.gitkeep` when the first page bundle
   lands. Prefer colocated `<slug>-page.test.tsx` under the page bundle.
5. Flip `section-indexes.test.tsx` and
   `section-collection-index.test.ts` from references empty-state to
   authored-entry assertions when the App Router still uses the generic
   section-collection renderer. Parallel lanes now own custom family indexes
   for references/workers/workstations — keep coexistence proofs on those
   App Router surfaces instead of fighting shared empty-state tables.
6. Ship non-default locale message files when the page should appear on
   localized family indexes (shipped-locale manifest derives from
   `messages/<locale>.json` presence). English-first copies are fine.
7. When the page needs a required page-local MDX component (for example
   mounting `@/components/references/api` on `/docs/references/api`),
   colocate `page-mdx-components.tsx` next to `page.mdx` and add a static
   `import("@/content/docs/references/<slug>/page-mdx-components")` switch
   in `route-family-local-docs-page-load.ts`. Relative MDX imports do not
   resolve under `compileMDX` (same constraint as documentation/concept
   page-local components). Keep the visual page-owned; do not register it
   in shared `mdx-components.tsx`. Union sibling slug cases (`api`, `events`,
   `cli`, `mcp`, `javascript-runtime`, schema pages) when merging parallel
   W11 lanes — do not drop another lane's switch arm.
8. For `/docs/references/api`, compose the public W08 surface
   (`ApiSurface` + nav + `ApiOperationSection` + hash/theme/print markers +
   `ApiLocalServerBaseUrlNotice`) in a page-local `ApiReferenceProjection`.
   SSE hybrid summaries mount automatically through `ApiOperationSection`;
   do not re-implement event catalog UI. Prove static-only + three SSE
   summaries with page-local tests and the colocated browser probe
   `assert-api-page-static-sse-browser.ts` (unique port; kill server on exit).
   Production loaders must use Next/webpack-safe OpenAPI acquisition via
   `src/lib/references/api-openapi-turbopack.ts` (`resolveApiPackageManifestFsPath`
   ancestor `node_modules` walk → `openapi/openapi.yaml`) injected through
   page-local `api-reference-production-loaders.ts` / `loadApiOpenApiArtifact({
   resolveExport })`. Do not rely on W08 default `createRequire` resolve —
   under Turbopack it can return unreadable `[externals]/` paths and the
   published route falls through to `data-api-status="invalid"` while Bun
   unit tests stay green.
9. Keep non-success outcomes page-owned: `resolveApiReferenceProjectionState`
   short-circuits to `ApiSurface` `empty` / `invalid` (public `ApiStatus`)
   when the packaged projection has zero operations or loaders throw.
   Inject optional `loaders` only in page-local tests — production MDX omits
   them (defaults are the Next-safe production loaders). Assert ready
   `data-api-status="ready"` plus accessible empty/invalid `role="status"`
   messaging in `ApiReferenceProjection.test.tsx` / `api-page.test.tsx`; do
   not scan renderer trees or shared inventories. Ownership stays page
   wiring: no edits under `src/components/references/api/` (or
   schema/events/CLI/MCP/JS), no sibling W11 pages, no W15–W18 inventories,
   no factories/workers/workstations content, no `node_modules` patches.

Do not edit shared nav/sidebar/search/sitemap/compat inventory owners
(W15–W18) by hand for this first page — published-docs membership is enough
for nested static params and the family index. Do not create sibling
reference pages or a contended shared references `meta.json`.

## First published `references` schema page

The first authored page under `src/content/docs/references/` needs the same
kind of first-section publish wiring as CLI collections, plus route-family
MDX component merge for schema mounts:

1. Add `references` to `PUBLISHED_DOCS_SECTIONS` and
   `publishedDocsHrefFromEntry` / `referencePageHref` so
   `prepare:content-runtime` / `validateDerivedPublishedPageBundles` accept
   `references/<slug>` without throwing `Unsupported published docs section`.
2. Add `references` to `REGISTRY_COLLECTIONS`, `loadRegistry` /
   `registry-runtime-generation` (`referenceRecordSchema`),
   `registryDirectoryByKind` / `registryKindDirectories`, and
   `registryRecordHref` so `reference.*` records resolve and validate.
3. Extend `route-family-local-docs-page-load.ts` with a static
   `page-mdx-components` import switch (same pattern as
   `documentation-page-load.ts`) so page-local mounts such as
   `<FactorySchemaReference />` compile. Relative MDX imports do not resolve
   through `compileMDX`.
4. Keep schema acquisition on the W03 helper
   `loadSchemaVerificationPackageModel("schemas/<name>")` and mount public
   W07 `SchemaReference` with `pagePath="/docs/references/<slug>"`. Do not
   edit renderer internals under `src/components/references/schema/`.
   Production browser proofs must assert `data-schema-status="ready"` (page
   intro copy can mention the schema title even when acquisition fails).
   If production `bun run start` shows `invalid` with
   `Package export resolution failed`, check that
   `resolveApiPackageManifestFsPath` uses ancestor `node_modules` filesystem
   walk — webpack stubs `createRequire().resolve` in production server chunks
   (MODULE_NOT_FOUND), including runtime-built specifier strings.
   Factory schema recursive `$ref` splay is page-local: enable `showCatalog`
   only on `FactorySchemaReference` and select the transitive closure with
   `collectFactorySchemaSplayDefinitions` under
   `src/content/docs/references/factory-schema/` — leave you-config /
   mock-workers on `showCatalog={false}`. Same-page `$ref` click-traverse
   depends on that splay plus `pagePath={FACTORY_SCHEMA_PAGE_PATH}` and
   `ReferenceHashNavigation`: navigable `$ref` hrefs are
   `/docs/references/factory-schema#…` fragments whose ids match splayed
   `SchemaDefinition` anchors. Prefer a direct property `$ref` row such as
   `orchestrator` → `/$defs/FactoryOrchestrator` for proofs — root `workers`
   is `Worker[]` type chrome, not a `data-schema-ref-row`. Browser probe:
   `src/content/docs/references/factory-schema/assert-factory-schema-click-traverse-browser.ts`.
   Authored full Factory configuration JSON example is page-local
   `FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_INPUTS` from
   `factory-schema-full-config-example.ts` (hermetic factories/configuration
   minimal sample keys) passed as `exampleInputs` on `FactorySchemaReference`
   only. Browser probe:
   `assert-factory-schema-full-config-example-browser.ts`.
   Factory schema repair close-out (intro strip + splay + click-traverse +
   full config) uses one page-local success-path probe:
   `assert-factory-schema-repair-browser.ts` (webpack `bun run dev`, unique
   port in 3100–3999, Playwright, kill server on exit). Assert
   `data-schema-status="ready"`, absent What It Covers / Key Concepts,
   splayed `$defs` catalog, `orchestrator` → `#defs-FactoryOrchestrator`
   same-page click-traverse, and copyable authored
   `full-factory-configuration` example keys. Run with plain `bun` from
   repo cwd; do not leave the probe server running. Narrower probes
   (`assert-factory-schema-click-traverse-browser.ts`,
   `assert-factory-schema-full-config-example-browser.ts`) remain for
   story-scoped iteration.
   Intentional catalog splay grows Factory schema SSR HTML (~2.0 MiB);
   raise the focused `references-factory-schema` payload ceiling in
   `a11y-reference-payload-budget.ts` (~25% headroom) when closing this
   lane so `make budget` stays green — do not invent unpublished defs to
   shrink the page.
5. Prefer page-local `LocalizedLinkList` for sibling schema routes that are
   not published yet; do not put unpublished `reference.*` ids in
   `relatedIds`.
6. Update `src/tests/content/section-indexes.test.tsx` so the references
   family index asserts discoverability links for published reference routes.
7. Do not hand-edit shared nav/sidebar/search/sitemap/compat inventories
   (W15–W18). Sitemap inclusion follows derived published-docs entries after
   `prepare:content-runtime`.

Representative pages: `src/content/docs/references/factory-schema/`,
`system-config-schema/`, `mock-workers-schema/` (add `page-mdx-components`
switch cases per slug). Cross-route success/invalid proofs live in
`src/content/docs/references/schema-reference-published-routes.test.tsx`
(page-owned route + mount markers only — not renderer or inventory scans).
Schema reference polish stays projection-first: open on `#schema-lookup` (plus
authored examples when present); do **not** restore `What It Covers` /
`Key Concepts` / summary-style intros — page-local tests should assert those
headings and `sections.whatItCovers` / `sections.keyConcepts` keys absent.
Mock-workers recursive splay stays page-local: enable `showCatalog` and pass
expanded `fieldNodes` from a page helper that resolves `itemSchema` /
`refTarget` into nested children (strip `refTarget` on inlined parents so the
shared expander can open them). Do not retarget shared SchemaReference defaults
for Factory schema / you-config siblings.
Mock-workers authored examples stay page-local: pass `exampleInputs` into the
page `SchemaReference` mount from a page-owned module adapted from existing
docs/customer samples (schema-true keys only). Do not edit workers/workstations
authored pages and do not invent hermetic upstream schemas (HOLD).
Mock-workers polish regression proofs stay under
`mock-workers-schema-page.test.tsx`: assert intro absence, nested splay /
on-page `$defs`, and authored example payloads on both the full MDX page path
and the isolated mount (shared helper preferred) so `$ref`-only / no-examples
presentation cannot silently return.
Mock-workers browser verify stays page-local:
`assert-mock-workers-schema-polish-browser.ts` (webpack `bun run dev`, unique
port in 3100–3999, Playwright, kill server on exit). Assert
`data-schema-status="ready"`, absent What It Covers / Key Concepts headings,
nested `mockWorkers[]` / `unmatchedDispatchPolicy` fields + on-page `$defs`,
and copyable authored examples (`data-schema-example="copy"` focusable).
Run with plain `bun` from repo cwd; do not leave the probe server running.

## Page bundle and registry workflow

* First published `reference.*` page also needs `references` in
  `REGISTRY_COLLECTIONS` / registry disk loader / `PUBLISHED_DOCS_SECTIONS` /
  `referencePageHref`, plus `registryDirectoryByKind.reference` and
  `validate-registry` path-kind mapping. See
  [events-reference-page-relevant-files.md](./events-reference-page-relevant-files.md).
  Route-family pages load through `loadRouteFamilyLocalDocsPage`; keep curated
  sibling discovery under `#related` with `LocalizedLinkList` when sibling
  `reference.*` records are not yet published.
* `docs/templates/*.content.md`
  Authoring templates for factory kinds (guide, concept, technique,
  documentation, reference, glossary) plus blog-post. Atlas
  model/module/paper/training/system templates are deleted. Direct route
  families: `references` → `reference.mdx` / kind `reference`;
  `factories` / `workers` / `workstations` → `documentation.mdx` / kind
  `documentation` (route slug independent from kind). Nested child slugs are
  supported under every docs family.
* `docs/documentation-template.md`
  Shared template contract including reference kind and route-slug
  independence for the four direct public route families.
* `docs/architecture.md` / `docs/data-model.md` / `docs/site-fundamentals.md`
  Architectural route documentation for the four direct families and nested
  slug support.
* `docs/guide-to-writing-pages.md`
  High-level page authoring steps, graph requirements, and code/documentation
  separation expectations — includes reference + factories/workers/workstations
  mapping.
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
* When a page story requires non-en stubs (`ja` / `zh-CN` / `vi`), copy the
  default-locale file into `messages/<locale>.json` with the **same key shape**
  (en complete; non-en may reuse English wording). Adding those files ships the
  page for those locales via `deriveShippedLocalizedDocsManifest`. Regenerate
  with `bun run prepare:content-runtime` / `generate:shipped-localized-docs`
  and **commit** `src/lib/content/generated/shipped-localized-docs.generated.ts`
  (unlike other generated runtime files, this manifest is tracked). Update the
  committed-tree expectation in
  `src/lib/content/shipped-localized-docs.server.test.ts` to match the new
  shipped slug lists.
* Language switcher (`src/components/layout/language-switcher.tsx`) maps
  `supportedLocales` into options: non-docs surfaces (home, search, browse, …)
  always get a locale-preserving `href` via `switchRouteLocale`; docs pages mark
  unshipped locales unavailable (`href: null`) instead of linking to wrong-language
  copy. Cover available zh-CN navigation + query preservation and unavailable
  docs behavior in `src/components/layout/docs-header.test.tsx`. When filling
  high-traffic locales, also prove language switching stays available on a filled
  docs slug (for example `/docs/guides/getting-started`) and that localized
  metadata titles/descriptions resolve from page message bundles in
  `src/tests/layout/localized-route-metadata.test.ts`. Shell `nav.guides` /
  `nav.docs` must exist for every shipped locale (including `zh-CN`) so primary
  nav labels are not `undefined` on locale-prefixed routes.
* After filling the high-traffic install/run journey, keep a focused suite at
  `src/tests/content/high-traffic-locales.test.ts` that proves (via
  `loadUiMessages` / `loadPageMessages` + shipped-manifest helpers, not source
  scans): reader-facing prose differs from English on home + filled docs;
  shipped-localized-docs includes those docs slugs including
  `documentation/cli`; an intentionally unfilled published page such as
  `documentation/configuration` stays fail-closed (`MessageLoadError`, not
  shipped); and at least one non-high-traffic shipped stub (for example
  `concepts/harness`) still reuses English wording so the lane does not claim
  full-corpus translation.
* Browser-verify the filled install/run journey with
  `src/tests/content/high-traffic-locales-browser.test.ts` (listed in
  `PRODUCTION_INTEGRATION_TEST_PATHS`). It is opt-in via
  `VERIFY_PRODUCTION_INTEGRATION_TESTS=1` + a fresh production build, and walks
  home → getting-started → install/CLI for `ja` / `zh-CN` / `vi`, asserting
  target-language prose, copyable install/run command literals, and language
  switching among filled surfaces without English stub body copy. Scope
  "no English stub" checks to `article` (not all of `main`) because the docs
  sidebar page tree still surfaces English frontmatter titles. `home.intro` is
  metadata-only and is not rendered in the home body. Worktree `bun run dev`
  may still fail under Turbopack/`node_modules` hoist — prefer `bun run build`
  then `make test-integration` (or the focused browser file under the same env)
  for this proof.
* Under heavier W12+ factories/workers/references exports, CI can flake when
  `next start` writes to a closed parent stdout pipe (`Error: write EPIPE` via
  Next `console-exit`) during `acquireVerifyServerSession` for
  `high-traffic-locales-browser.test.ts`. `defaultSpawnProductionServer` now
  redirects stdout/stderr to a temp log (so the child cannot EPIPE a parent
  pipe), `isRetryableVerifyServerStartupError` treats EPIPE/EADDRINUSE early
  exits as retryable, and `attachChildOutputCapture` ignores parent-side pipe
  resets. Prefer those harness fixes over widening Playwright timeouts alone.

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

### Documentation Program ops/platform intro strip (page-local)

For the nine ops/platform Documentation Program trees under
`src/content/docs/documentation/` (`logs`, `metrics`, `resources`, `petri`,
`packaged-documents`, `dashboard-ui-overview`, `security-trust-boundaries`,
`throttling-and-limits`, `replays-records`):

- Remove `#what-it-covers` / `#key-concepts` Sections from `page.mdx` and drop
  `sections.whatItCovers` / `sections.keyConcepts` from every shipped locale.
- Keep at most one short purpose lead via `openingSummary` message fields when
  useful for non-chrome reuse; omit or empty it when the first remaining body
  section already opens usefully. The shared docs slug renderer no longer mounts
  bordered `DocsOpeningSummary` chrome. Do not ship a multi-paragraph Summary
  section heading.
  Purpose leads must be product-first: the topic/behavior is the subject (for
  example “Local you-agent-factory trust boundaries define…” or
  “you-agent-factory can capture live runs as replay artifacts…”). Reject
  page-as-subject / page-role openers such as “Security / Trust Boundaries
  describes…”, “Replays / Records is the … reference for…”, or “This page
  explains…”. Update every shipped locale together; page-local tests should
  assert short lead length and reject those page-meta patterns.
- Strip `#how-to-use` when it is only sibling-pointer / opening boilerplate
  (`metrics`, `resources`). When How To Use wraps primary operational teaching
  (tables, commands, CPN asset, pressure-surface table), keep that teaching
  visible—promote unique facts that lived only under Key Concepts into the
  remaining body (for example throttling surface table into `#how-to-use`,
  packaged callouts into `#how-to-use`, dashboard/security bind URL teaching
  into `#how-to-use`).
- Do not edit core Program sibling trees owned by
  `repair-documentation-program-intro-strip-core`, and do not delete unused
  shared helpers (dead-code consolidation owns that).
- Page-local tests assert intro absence (MCP #156 / Events #171 style):
  `sections.whatItCovers` / `sections.keyConcepts` undefined;
  `queryByRole` / `getElementById` null for What It Covers / Key Concepts;
  `openingSummary` empty or one short purpose sentence (no `\n\n` overview).
  Retarget body asserts onto promoted teaching markers (`#how-to-use`,
  status/dashboard sections, limits, callouts)—not restore intros to satisfy
  old expects. Metrics/resources How To Use was stripped as boilerplate; other
  ops pages keep How To Use when it wraps primary teaching.
- Browser-verify all nine routes with
  `bun src/content/docs/documentation/logs/assert-ops-platform-intro-strip-browser.ts`
  (webpack `next dev`, unique port 3681 default, Playwright; kill server on
  exit). Assert absent What It Covers / Key Concepts / `#what-it-covers` /
  `#key-concepts` / visible `Summary` section heading; absent bordered Opening
  summary shell markers (`[data-opening-summary="folded"]` /
  `[data-testid="folded-summary"]`); assert
  one operational teaching marker per route (logs retention, metrics
  `factoryState`/`runtimeStatus`, resources ownership/pool, petri `task:init`,
  packaged `you docs`, dashboard/security bind URLs, throttling surface table,
  replays `--replay`). Prefer `OPS_INTRO_STRIP_PROBE_BASE_URL` when a server is
  warm.

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
