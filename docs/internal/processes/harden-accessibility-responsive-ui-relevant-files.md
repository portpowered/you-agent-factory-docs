# Harden Accessibility and Responsive UI — relevant files

Use these files when extending critical-route accessibility, responsive overflow,
reduced-motion, or visual/layout regression verification for factory-docs
surfaces (home, browse, search, docs/harness-support, blog).

## Shared contract and probes

* `src/lib/verify/a11y-responsive-contract.ts`
  Critical routes (`/`, `/browse`, `/search`, representative docs article,
  `/docs/documentation/harness-support`, `/blog`, representative blog post) and
  viewport matrix (mobile 390 / tablet 768 / laptop 1024 / wide 1440), plus
  page-overflow tolerance and intentional horizontal-scroll selectors.
* `src/lib/verify/a11y-responsive-probes.ts`
  Pure DOM helpers: `measurePageLevelOverflow`,
  `findIntentionalHorizontalScrollContainers`,
  `pageOverflowAllowsIntentionalScrollers`.
* `src/lib/verify/a11y-axe.ts`
  Shared axe-core serious/critical runners used by component smokes and page
  probes (`expectNoSeriousAxeViolations`, `runAxeOnElement`).
* `src/lib/verify/a11y-responsive-page-session.ts`
  IO helper: `openA11yResponsivePageProbe` / `resolveA11yResponsiveProbeUrl`
  (verify server + Playwright Chromium at a contracted viewport).
* `src/tests/a11y/axe.ts`
  Thin re-export of `src/lib/verify/a11y-axe.ts` for existing component smokes.

## Focused gate

* `Makefile` target `a11y` → `bun run test:a11y`
* `package.json` script `test:a11y` runs the new contract/probe/axe/page-session
  unit tests under `src/lib/verify/a11y-*`. Starts thin; later stories expand
  coverage and may fold in `src/tests/a11y/` once those smokes are factory-current.
* Not yet part of `make ci` (wire in story `harden-accessibility-responsive-ui-009`).

## Existing component a11y smokes

* `src/tests/a11y/*.a11y.test.tsx` — still excluded from default
  `scripts/run-website-functionality-tests.ts`. Some rows still assert retired
  Atlas sidebar labels; do not fold the whole directory into `make a11y` until
  those smokes are updated in later stories.

## Patterns

* Keep route/viewport lists in the contract module; do not hard-code widths or
  critical paths inside later story tests.
* Treat table/code `overflow-x-auto` (and `[data-harness-support-matrix]`) as
  intentional scrollers; fail only on page-level `scrollWidth` overflow.
* Prefer pure probe helpers for happy-dom unit proofs; use
  `openA11yResponsivePageProbe` only when a served page is required.
