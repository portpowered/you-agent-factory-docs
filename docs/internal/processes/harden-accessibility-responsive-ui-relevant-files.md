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
* `src/lib/verify/a11y-page-structure.ts`
  Pure landmark/heading/keyboard probes: `probePageLandmarks`,
  `expectCriticalPageStructure`, `listKeyboardFocusableControls`.
* `src/lib/verify/a11y-axe.ts`
  Shared axe-core serious/critical runners used by component smokes and page
  probes (`expectNoSeriousAxeViolations`, `runAxeOnElement`).
* `src/lib/verify/a11y-playwright-axe.ts`
  Playwright injection helper: `expectNoSeriousAxeOnPlaywrightPage` /
  `runSeriousAxeOnPlaywrightPage` for served critical routes.
* `src/lib/verify/a11y-responsive-page-session.ts`
  IO helper: `openA11yResponsivePageProbe` / `resolveA11yResponsiveProbeUrl`
  (verify server + Playwright Chromium at a contracted viewport).
* `src/tests/a11y/axe.ts`
  Thin re-export of `src/lib/verify/a11y-axe.ts` for existing component smokes.

## Home / browse accessibility (story 002)

* `src/tests/a11y/home-browse.a11y.test.tsx`
  Always-on component smokes: home + browse landmarks, headings, keyboard
  focus, labeled controls, serious/critical axe.
* `src/lib/verify/a11y-home-browse-page.test.ts`
  Opt-in served-page probe (`VERIFY_PRODUCTION_INTEGRATION_TESTS=1` + fresh
  `.next`): home/browse landmarks, focus rings, Playwright axe.

## Focused gate

* `Makefile` target `a11y` → `bun run test:a11y`
* `package.json` script `test:a11y` runs contract/probe/axe/page-structure unit
  tests plus home/browse a11y smokes (and the skipped-by-default served-page
  probe). Starts thin for other routes; later stories expand coverage and may
  fold in remaining `src/tests/a11y/` once those smokes are factory-current.
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
* For critical-page a11y stories: assert banner + `nav[aria-label="Primary"]` +
  `main` + coherent h1/h2 outline, keyboard focus with `focus-visible:ring`,
  then serious/critical axe on the verified surface.
