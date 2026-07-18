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
  `referenceHashFocusScrollBehavior`.
* Always-on contract proofs (required via `make a11y`):
  - `src/lib/verify/a11y-reference-surface-contract.test.ts`
  - `src/lib/verify/a11y-reference-surface-probes.test.ts`
  - `src/lib/verify/a11y-reference-keyboard-contract.test.ts`

## Existing harnesses to extend (do not fork)

* `src/lib/verify/a11y-responsive-contract.ts` — critical routes + 4 viewports
* `src/lib/verify/a11y-responsive-probes.ts` — page overflow + intentional scrollers
* `src/lib/verify/a11y-responsive-page-session.ts` — verify server + Playwright
* `src/lib/verify/a11y-axe.ts` / `a11y-playwright-axe.ts` — serious/critical axe
* `src/lib/verify/a11y-reduced-motion.ts` — motion duration probes
* `src/lib/verify/a11y-page-structure.ts` — landmarks / headings / keyboard
* `src/components/references/api/a11y-verification.ts` — W08 API-local chrome
  (print/keyboard/viewports); keep production W19 gates on the shared verify
  contract, not a second matrix of hard-coded paths

## Focused reference payload budgets (story 002)

* `src/lib/verify/a11y-reference-payload-budget.ts`
  Records HTML + attributable `/_next/static/**/*.js` baselines for
  `/docs/references/api`, `/docs/references/events`, and
  `/docs/references/factory-schema` (from a prior production static-export
  measurement on 2026-07-18 UTC) and enforces focused ceilings with ~25%
  headroom. Aligns route ids/paths with `REFERENCE_SURFACE_ROUTES`. Does
  **not** raise `FACTORY_EXPORTED_SITE_BUDGET_BASELINES`.
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

## Focused gate

* Reproduce with `make a11y` (or `bun run test:a11y`).
* Later W19 stories (axe, hash-focus, copy live regions, reduced motion,
  long-token overflow, no-JS HTML) must enumerate
  `listReferenceOverflowMatrixCases()` / route ids from the contract — do not
  hard-code widths or reference paths in story tests.
* Do not own W20 static-export/sitemap/canonical/link/search convergence here.
* Do not reopen W00–W18 feature ownership except narrow gate-fix UI edits.

## Patterns

* Zoomed layout is a CSS-pixel half of the laptop viewport, not a separate
  Playwright zoom API — overflow probes already key off viewport width.
* Keep verify/ free of `@/components` imports; mirror small pure helpers
  locally when the API a11y module already defines the same one-liner.
* Authored factory/worker/workstation representatives should be pages that
  embed schema fragments so no-JS / overflow stories have real long tokens.
