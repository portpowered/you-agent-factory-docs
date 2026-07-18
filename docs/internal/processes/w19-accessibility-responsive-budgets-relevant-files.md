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
  `referenceHashFocusScrollBehavior`.
* Always-on contract proofs (required via `make a11y`):
  - `src/lib/verify/a11y-reference-surface-contract.test.ts`
  - `src/lib/verify/a11y-reference-surface-probes.test.ts`

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

## Focused gate

* Reproduce with `make a11y` (or `bun run test:a11y`).
* Later W19 stories (overflow matrix, keyboard, axe, hash-focus, copy live
  regions, reduced motion, long-token overflow, no-JS HTML, payload budgets)
  must enumerate `listReferenceOverflowMatrixCases()` / route ids from the
  contract — do not hard-code widths or reference paths in story tests.
* Do not own W20 static-export/sitemap/canonical/link/search convergence here.
* Do not reopen W00–W18 feature ownership except narrow gate-fix UI edits.

## Patterns

* Zoomed layout is a CSS-pixel half of the laptop viewport, not a separate
  Playwright zoom API — overflow probes already key off viewport width.
* Keep verify/ free of `@/components` imports; mirror small pure helpers
  locally when the API a11y module already defines the same one-liner.
* Authored factory/worker/workstation representatives should be pages that
  embed schema fragments so no-JS / overflow stories have real long tokens.
