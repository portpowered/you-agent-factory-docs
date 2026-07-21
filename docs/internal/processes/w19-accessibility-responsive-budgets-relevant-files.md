# W19 Accessibility, Responsive Behavior, and Reference Payload Budgets — relevant files

Use these files when extending Factory **reference-surface** accessibility,
responsive overflow (including zoomed), reduced-motion, no-JS readability, or
focused API/event/schema payload budgets after batch-009.

Prefer extending the critical-route harness under `src/lib/verify/` rather than
inventing a parallel a11y framework. Critical home/browse/search/docs/blog
gates stay documented in
[harden-accessibility-responsive-ui-relevant-files](./harden-accessibility-responsive-ui-relevant-files.md).

## Shared W19 contract and probe binders

* `src/lib/verify/a11y-reference-surface-contract.ts`
  Representative routes:
  - `/docs/references/api`
  - `/docs/references/events`
  - `/docs/references/factory-schema` (largest schema representative)
  - `/docs/factories/packaged` (authored factory)
  - `/docs/workers/hosted` (authored worker)
  - `/docs/workstations/standard` (authored workstation)
  Five layouts: large desktop (1440), laptop (1024), tablet (768), narrow phone
  (390), zoomed (512×384 = ~200% of laptop CSS pixels). Reuses
  `PAGE_OVERFLOW_TOLERANCE_PX`, `INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS`, and
  `A11Y_SUITE_REPRODUCTION_COMMAND` (`make a11y`) from
  `a11y-responsive-contract.ts`.
* `src/lib/verify/a11y-reference-surface-probes.ts`
  Binders over existing axe / overflow / reduced-motion / page-session helpers:
  `collectReferenceSurfaceOverflowProbe`, `openReferenceSurfacePageProbe`,
  `openReferenceSurfaceBrowserSession`, `listReferenceSurfaceProbeBindings`,
  `expectReferenceKeyboardChrome`, `evaluateReferenceKeyboardChromeInBrowser`,
  `referenceHashFocusScrollBehavior`,
  `evaluateReferenceReducedMotionInBrowser`.
* Always-on contract proofs (required via `make a11y`):
  - `src/lib/verify/a11y-reference-surface-contract.test.ts`
  - `src/lib/verify/a11y-reference-surface-probes.test.ts`
  - `src/lib/verify/a11y-reference-keyboard-contract.test.ts`
  - `src/lib/verify/a11y-reference-screen-reader-contract.test.ts`
  - `src/lib/verify/a11y-reference-hash-focus-contract.test.ts`
  - `src/lib/verify/a11y-reference-copy-announcement-contract.test.ts`
  - `src/lib/verify/a11y-reference-reduced-motion-contract.test.ts`
  - `src/lib/verify/a11y-reference-long-token-overflow-contract.test.ts`
  - `src/lib/verify/a11y-reference-no-js-html-contract.test.ts`
  - `src/lib/verify/a11y-reference-browser-closeout-contract.test.ts`

## Existing harnesses to extend (do not fork)

* `src/lib/verify/a11y-responsive-contract.ts` — critical routes + 4 viewports
* `src/lib/verify/a11y-responsive-probes.ts` — page overflow + intentional scrollers
* `src/lib/verify/a11y-responsive-page-session.ts` — verify server + Playwright
* `src/lib/verify/a11y-axe.ts` / `a11y-playwright-axe.ts` — serious/critical axe
* `src/lib/verify/a11y-reduced-motion.ts` — motion duration probes
* `src/lib/verify/a11y-page-structure.ts` — landmarks / headings / keyboard
* `src/features/references/api/a11y-verification.ts` — W08 API-local chrome
  (print/keyboard/viewports); keep production W19 gates on the shared verify
  contract, not a second matrix of hard-coded paths

## Focused reference payload budgets (story 002)

* `src/lib/verify/a11y-reference-payload-budget.ts`
  Records HTML + attributable `/_next/static/**/*.js` baselines for
  `/docs/references/api`, `/docs/references/events`, and
  `/docs/references/factory-schema` and enforces focused ceilings with ~25%
  headroom. Factory-schema HTML baseline was raised after intentional
  recursive `$defs` catalog splay (~2.0 MiB measured / 2.5 MiB ceiling;
  2026-07-19 UTC CI export) — re-measure before further raises. Aligns
  route ids/paths with `REFERENCE_SURFACE_ROUTES`. Does **not** raise
  `FACTORY_EXPORTED_SITE_BUDGET_BASELINES`.
* Always-on proofs: `src/lib/verify/a11y-reference-payload-budget.test.ts`
  (wired into `make a11y` / `test:a11y`).
* CI / maintainer export gate: `scripts/run-exported-site-budget.ts`
  (`make budget`) runs the total-site evaluation first, then the focused
  reference page budgets against the same trusted `out/`.
* Reproduce measurement:
  1. `make build`
  2. `make budget` (or call `evaluateReferencePayloadBudgets()`)

## Reference overflow matrix (story 003)

* `listReferenceOverflowMatrixCases()` — 6 representative routes × 5 layouts
  (wide / laptop / tablet / mobile / zoomed).
* Always-on proofs: `src/tests/a11y/reference-responsive-overflow.a11y.test.tsx`
  (matrix enumeration + intentional scroller vs page-level overflow fixtures via
  `collectReferenceSurfaceOverflowProbe`).
* Opt-in served matrix:
  `src/lib/verify/a11y-reference-overflow-matrix-page.test.ts` — Playwright via
  `openReferenceSurfaceBrowserSession` + `evaluateResponsiveOverflowInBrowser`
  with `referenceSurfaceOverflowEvaluateArgs()`. Same gate as critical overflow:
  `VERIFY_PRODUCTION_INTEGRATION_TESTS=1` + fresh `.next`. For local browser
  verify after `make build` (static `out/`), start
  `runStaticExportServerLifecycle` and set `VERIFY_BASE_URL` to that loopback
  base (do not assume `next start` works for `output: "export"`).
* Intentional horizontal scrollers remain the shared contract selectors
  (`pre`, `[data-rich-content-scroll="code"]`, `.overflow-x-auto`, …); page-level
  `scrollWidth` overflow beyond `PAGE_OVERFLOW_TOLERANCE_PX` fails the gate.
* Always-on overflow fixtures that stub `clientWidth`/`scrollWidth` must clear
  those overrides in `afterEach` so later happy-dom a11y tests stay unpolluted.

## Reference keyboard navigation (story 004)

* `src/lib/verify/a11y-reference-keyboard-contract.ts` — shared selectors for
  filters, mobile `<details>` disclosures, nav links, copy controls, schema
  `$ref` links, and optional code-copy / field-expand chrome. Probes fail when
  a required control is missing, pointer-only, or lacks a `focus-visible:ring`
  / `focus-visible:outline` class. Disabled filter-clear buttons are ignored
  until enabled.
* Probe binders: `expectReferenceKeyboardChrome`,
  `evaluateReferenceKeyboardChromeInBrowser`, `referenceKeyboardEvaluateArgs`
  (also re-exported from `a11y-reference-surface-probes.ts`).
* Always-on proofs:
  - `src/lib/verify/a11y-reference-keyboard-contract.test.ts`
  - `src/tests/a11y/reference-keyboard-navigation.a11y.test.tsx` (API harness,
    events catalog, FactorySchemaReference, nested SchemaFieldTree expand)
* Opt-in served probe: `src/lib/verify/a11y-reference-keyboard-page.test.ts`
  (API / events / factory-schema at laptop + mobile). Same
  `VERIFY_PRODUCTION_INTEGRATION_TESTS=1` gate; prefer `VERIFY_BASE_URL` against
  static `out/` for local browser verify.
* Production SchemaReference builds flat property trees — nested
  `[data-schema-field-expand]` is optional on the contract and proven via
  SchemaFieldTree fixtures.

## Reference screen-reader / non-color status (story 005)

* `src/lib/verify/a11y-reference-screen-reader-contract.ts` — labeled chrome
  selectors (filters, nav/copy, schema `$ref`), non-color status kinds (HTTP
  method, required/optional, canonicality, optional lifecycle), heading
  hierarchy probe, and `expectReferenceScreenReaderChrome`. Failures fire when
  a required control lacks an accessible name or status chrome is color-only.
* Probe binders re-exported from `a11y-reference-surface-probes.ts`
  (`expectReferenceLabeledChrome`, `expectReferenceNonColorStatus`,
  `expectCoherentReferenceHeadingHierarchy`, `expectNoSeriousAxeViolations`).
* Always-on proofs:
  - `src/lib/verify/a11y-reference-screen-reader-contract.test.ts`
  - `src/tests/a11y/reference-screen-reader.a11y.test.tsx` (API harness, events
    stream + copy, FactorySchemaReference, lifecycle chrome; axe serious /
    critical on each fixture)
* Opt-in served probe:
  `src/lib/verify/a11y-reference-screen-reader-page.test.ts` — API / events /
  factory-schema at laptop + mobile with landmarks/headings/labels/non-color
  status + Playwright axe. Same `VERIFY_PRODUCTION_INTEGRATION_TESTS=1` gate;
  prefer `VERIFY_BASE_URL` against static `out/` for local browser verify.

## Reference copy status announcements (story 007)

* `src/lib/verify/a11y-reference-copy-announcement-contract.ts` — deep-link and
  code-copy control + polite live-region status selectors. Required:
  API `[data-api-operation-copy-link]` + `[data-api-operation-copy-status]`,
  events `[data-reference-anchor-copy]` + `[data-reference-anchor-copy-status]`,
  schema `[data-schema-breadcrumb="copy"]` +
  `[data-schema-deep-link-copy-status]`. Optional when present: API/schema
  example code-copy and docs code-block copy (`data-*-copy-status`).
* Probe binders: `expectReferenceCopyAnnouncements` (async, activates copy),
  `expectReferenceCopyAnnouncementChrome` (idle structure),
  `evaluateReferenceCopyAnnouncementsInBrowser`,
  `referenceCopyAnnouncementEvaluateArgs` (also re-exported from
  `a11y-reference-surface-probes.ts`).
* Narrow UI markers: status data attrs on `CopyableReferenceAnchor`,
  `ApiOperationCopyLink`, `SchemaBreadcrumb`, and `SchemaExamplePanel` (API
  example + docs code-copy already had status markers).
* Always-on proofs:
  - `src/lib/verify/a11y-reference-copy-announcement-contract.test.ts`
  - `src/tests/a11y/reference-copy-announcements.a11y.test.tsx`
* Opt-in served probe:
  `src/lib/verify/a11y-reference-copy-announcement-page.test.ts` — API / events /
  factory-schema at laptop + mobile. Same
  `VERIFY_PRODUCTION_INTEGRATION_TESTS=1` gate; prefer `VERIFY_BASE_URL`
  against static `out/` for local browser verify. Grants `clipboard-write`.

## Reference reduced-motion (story 008)

* `src/lib/verify/a11y-reference-reduced-motion-contract.ts` — hash scroll
  behavior (`auto` under reduce / `smooth` otherwise) plus marked motion
  chrome (`data-motion-chrome` mobile drawer + backdrop) with
  `motion-reduce:*` class fragments. Extends existing
  `a11y-reduced-motion*` duration probes — does not invent a parallel
  framework. `referenceHashFocusScrollBehavior` lives here (re-exported from
  `a11y-reference-surface-probes.ts`).
* Probe binders: `expectReferenceReducedMotionHashFocus`,
  `expectReferenceReducedMotionChrome`,
  `evaluateReferenceReducedMotionInBrowser`,
  `referenceReducedMotionEvaluateArgs`.
* Always-on proofs:
  - `src/lib/verify/a11y-reference-reduced-motion-contract.test.ts`
  - `src/tests/a11y/reference-reduced-motion.a11y.test.tsx` (API harness /
    events payload / FactorySchemaReference hash focus + motion-chrome
    fixture)
* Opt-in served probe:
  `src/lib/verify/a11y-reference-reduced-motion-page.test.ts` — API / events /
  factory-schema at laptop + mobile with `emulateMedia({ reducedMotion:
  "reduce" })`, hash focus, and mobile drawer duration probe. Same
  `VERIFY_PRODUCTION_INTEGRATION_TESTS=1` gate; prefer `VERIFY_BASE_URL`
  against static `out/` for local browser verify.

## Reference long-token overflow (story 009)

* `src/lib/verify/a11y-reference-long-token-overflow-contract.ts` — long path /
  field / enum / code token selectors, containment class fragments
  (`break-all`, `truncate`, `overflow-x-auto`, …), and page-overflow gate at
  narrow phone + zoomed (`REFERENCE_LONG_TOKEN_OVERFLOW_VIEWPORT_IDS`). Extends
  existing `collectResponsiveOverflowProbe` / intentional scroller selectors —
  does not invent a parallel overflow framework.
* Probe binders: `expectReferenceLongTokenOverflow`,
  `evaluateReferenceLongTokenOverflowInBrowser`,
  `referenceLongTokenOverflowEvaluateArgs` (also re-exported from
  `a11y-reference-surface-probes.ts`).
* Narrow UI containment: `break-all` / `min-w-0` on schema field names;
  authored `SchemaDefinitionEmbed` property names + enums gain
  `data-schema-embed-*` markers with wrap/scroll classes.
* Always-on proofs:
  - `src/lib/verify/a11y-reference-long-token-overflow-contract.test.ts`
  - `src/tests/a11y/reference-long-token-overflow.a11y.test.tsx`
* Opt-in served probe:
  `src/lib/verify/a11y-reference-long-token-overflow-page.test.ts` — API /
  events / factory-schema at mobile + zoomed. Same
  `VERIFY_PRODUCTION_INTEGRATION_TESTS=1` gate; prefer `VERIFY_BASE_URL`
  against static `out/` for local browser verify.

## Reference no-JS static HTML readability (story 010)

* `src/lib/verify/a11y-reference-no-js-html-contract.ts` — essential static
  HTML facts for all six W19 routes: API method/path/summary, event type
  identity + envelope/payload headings, schema field names/types (including
  authored SchemaReference embeds). `stripScriptsFromHtml` removes client
  bundles before probing so contract text cannot depend on hydration.
* Probe binders: `expectReferenceNoJsHtmlReadability`,
  `evaluateReferenceNoJsHtmlInBrowser`, `referenceNoJsHtmlEvaluateArgs`
  (also re-exported from `a11y-reference-surface-probes.ts`).
* Always-on proofs:
  - `src/lib/verify/a11y-reference-no-js-html-contract.test.ts`
  - `src/tests/a11y/reference-no-js-html.a11y.test.tsx` (API harness, events
    envelope + payload variant, FactorySchemaReference, authored factory
    metadata/source embed)
* Export / served probe:
  `src/lib/verify/a11y-reference-no-js-html-page.test.ts` — script-stripped
  `out/*.html` for all six routes when a trusted export exists; Playwright
  setContent of script-stripped DOM for API/events/factory-schema under
  `VERIFY_PRODUCTION_INTEGRATION_TESTS=1`.

## Reference hash focus, sticky visibility, mobile collapse (story 006)

* `src/lib/verify/a11y-reference-hash-focus-contract.ts` — hash target selectors
  (API operation sections, event payload variants, schema definitions), sticky
  obscuring probe, and API `<details>` mobile navigator open/close/focus-return.
  Hash focus must not rewrite contract HTML; required targets need
  `scroll-mt-*` / scroll-margin clearance.
* Shared client chrome: `src/features/references/shared/ReferenceHashNavigation.tsx`
  (events wraps it as `EventHashNavigation`). Mounted on production
  `/docs/references/events` and `/docs/references/factory-schema` page mounts;
  API already uses `ApiReferenceHashController`.
* Narrow UI gate fixes: `scroll-mt-20` + `tabIndex={-1}` on schema definitions
  and event payload variants so deep links can take focus and stay clear of
  sticky chrome.
* Always-on proofs:
  - `src/lib/verify/a11y-reference-hash-focus-contract.test.ts`
  - `src/tests/a11y/reference-hash-focus.a11y.test.tsx`
* Opt-in served probe:
  `src/lib/verify/a11y-reference-hash-focus-page.test.ts` — API / events /
  factory-schema at wide + laptop (sticky check) and mobile (API nav collapse).
  Same `VERIFY_PRODUCTION_INTEGRATION_TESTS=1` gate; prefer `VERIFY_BASE_URL`
  against static `out/` for local browser verify.

## Reference browser close-out (story 011)

* `src/lib/verify/a11y-reference-browser-closeout-contract.ts` — enumerates the
  route × layout × probe evidence matrix for W19 close-out (overflow,
  keyboard, hash focus, copy announcements, reduced-motion, long-token,
  no-JS, focused payload budgets). Covers all six representative routes;
  interactive probes require API + events + factory-schema. Explicitly
  excludes W20 sitemap/canonical/link/search convergence suites.
* Probe binders re-exported from `a11y-reference-surface-probes.ts`
  (`listReferenceBrowserCloseoutCases`,
  `referenceBrowserCloseoutCoversRequiredSurfaces`).
* Always-on proofs: `src/lib/verify/a11y-reference-browser-closeout-contract.test.ts`
* Opt-in consolidated served probe:
  `src/lib/verify/a11y-reference-browser-closeout-page.test.ts` — one Playwright
  session runs overflow (6×5), interactive chrome, long-token, no-JS, and
  focused budgets when `out/` exists. Same
  `VERIFY_PRODUCTION_INTEGRATION_TESTS=1` gate; prefer `VERIFY_BASE_URL`
  against static `out/` for local browser verify. Does not run W20 convergence.

## Focused gate

* Reproduce with `make a11y` (or `bun run test:a11y`).
* Close-out and later stories must enumerate
  `listReferenceOverflowMatrixCases()` / `listReferenceBrowserCloseoutCases()` /
  route ids from the contract — do not hard-code widths or reference paths in
  story tests.
* Do not own W20 static-export/sitemap/canonical/link/search convergence here.
* Do not reopen W00–W18 feature ownership except narrow gate-fix UI edits.

## Patterns

* Zoomed layout is a CSS-pixel half of the laptop viewport, not a separate
  Playwright zoom API — overflow probes already key off viewport width.
* Keep verify/ free of `@/components` imports; mirror small pure helpers
  locally when the API a11y module already defines the same one-liner.
* Authored factory/worker/workstation representatives should be pages that
  embed schema fragments so no-JS / overflow stories have real long tokens.
* Browser close-out should reuse prior story evaluate helpers in one session
  rather than inventing a second a11y framework; prefer a fresh `make build`
  `out/` (copy-status markers) before served interactive probes.
* Static-export HTTP serving must percent-decode `_next/static` catch-all chunk
  paths (`%5B%5B...slug%5D%5D` → `[[...slug]]`) or hydration fails with
  “couldn’t load” and W19 served probes look empty.
