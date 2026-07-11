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

## Search accessibility (story 003)

* `src/tests/a11y/search.a11y.test.tsx`
  Always-on smokes: `/search` page shell landmarks + labeled input; idle /
  empty / results states; trigger→dialog keyboard open/focus/Escape restore;
  dialog idle/loading/empty/results serious/critical axe.
* `src/lib/verify/a11y-search-page.test.ts`
  Opt-in served-page probe for `/search` (landmarks, labeled input, dialog
  open from trigger, Playwright axe).
* `src/features/docs/search/SearchDialog.tsx`
  Dialog input carries `aria-label` from `messages.search.placeholder` (Fumadocs
  overwrites `placeholder` from its own i18n). On close, focus is returned to
  `button[data-search]` so keyboard users leave the lazy dialog on the trigger.
* `src/features/docs/search/SearchResultRow.tsx`
  Clears Fumadocs `aria-selected` on native `<button>` result rows (axe
  `aria-allowed-attr` critical). Active-row text styles also key off
  `group-[.bg-fd-accent]:…` because selection chrome still uses that class.
* `src/components/providers/app-providers.tsx`
  Lazy `DocsSearchDialog` is wrapped in `<Suspense fallback={null}>` (Fumadocs
  SearchProvider also Suspense-wraps the dialog slot).
* Prefer factory-current result queries (for example `ralph` / `harness`); do
  not rely on retired Atlas terms such as `GQA` in a11y smokes.
* Browser probes against `next dev`: use `http://localhost:<port>` rather than
  `http://127.0.0.1:<port>` — Next 16 blocks cross-origin HMR from 127.0.0.1 and
  client hydration/handlers (including search open) can fail silently.

## Docs / harness-support accessibility (story 004)

* `src/tests/a11y/docs-harness.a11y.test.tsx`
  Always-on smokes: getting-started + harness-support landmarks/headings/
  keyboard chrome/axe; intentional matrix + fenced-code scroll wrappers.
* `src/lib/verify/a11y-docs-harness-page.test.ts`
  Opt-in served-page probe: laptop a11y for docs article + harness-support;
  mobile/tablet matrix scroll without page overflow; mobile code-block scroll
  without page overflow.
* `INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS` includes
  `[data-rich-content-scroll="code"]` (Fumadocs `DocsCodeBlock` viewport) in
  addition to `[data-harness-support-matrix]`, `pre`, and `.overflow-x-auto`.
* Untitled fenced blocks use `DocsCodeBlock` with
  `data-docs-code-actions="rail"` beside the viewport (not `absolute top-3
  right-2`). Layout CSS is `src/features/docs/styles/docs-code-block.css`
  (imported from `globals.css`). Horizontal scroll stays in the viewport
  column so it never paints over the copy control; inset is
  `padding-inline` on the viewport (`DOCS_CODE_BLOCK_INSET_INLINE`).
* Copy controls use host `DocsCodeCopyButton` (not stock Fumadocs CopyButton),
  marked `data-docs-code-copy="control"` / `.docs-code-block__copy-button`
  (see `docs-code-copy-chrome.ts`). Clipboard write excludes `.nd-copy-ignore`.
  Successful copy sets `data-checked`, swaps to a checkmark icon, updates
  `aria-label` to `Copied Text`, and announces via an `aria-live="polite"`
  status span; state resets after `DOCS_CODE_COPY_RESET_MS` (1500). Host CSS
  keeps `opacity: 1` at rest/hover/checked and uses semantic `--secondary`
  (cool blue) for hover/focus/checked — never accent-ink. Focus-visible uses
  a secondary ring. Native `<button>` covers pointer, keyboard (Enter/Space),
  and touch.
* Theme/code-copy regression lock (repair-theme-code-blocks-005):
  - Contrast: `src/lib/theme/color-contrast.ts` +
    `HOST_SEMANTIC_CONTRAST_PAIRINGS` in `host-semantic-theme-tokens.ts`
    (behavioral WCAG ratios on resolved factory-dark hex, not CSS inventories).
  - Overflow non-overlap: `src/lib/verify/docs-code-block-layout.ts` asserts
    the copy control lives in the rail sibling, not inside the scroll viewport.
  - A11y: `src/tests/a11y/docs-code-block.a11y.test.tsx` — keyboard reach,
    default/copied accessible names, axe on a representative fixture.
  - Interaction: `DocsCodeCopyButton.test.tsx` + `docs-code-copy-chrome.test.ts`
    cover persistent visibility, secondary hover/focus, checkmark, live status,
    and reset.
* R00 theme/code-copy served-page gate (repair-theme-code-blocks-006):
  - Helpers: `src/lib/verify/theme-code-copy-r00-gate.ts` (factory-dark RGB
    proofs, chrome/block probes, Playwright evaluators).
  - Always-on unit: `theme-code-copy-r00-gate.test.ts`.
  - Opt-in served page: `theme-code-copy-r00-page.test.ts` on
    `/docs/guides/getting-started` at laptop + mobile — black/yellow chrome,
    inset/rail, persistent secondary-blue hover/focus, checkmark + accessible
    copied text + reset, scroll non-overlap. Listed in
    `PRODUCTION_INTEGRATION_TEST_PATHS`. Use `localhost` (not `127.0.0.1`) for
    any ad-hoc `next dev` Playwright probes.
* `HarnessSupportMatrix` puts `data-harness-support-matrix` /
  `data-testid="harness-support-matrix"` on DataTable `containerProps` (the
  real `overflow-x-auto` scroller). Do not wrap DataTable in a second
  overflow div — the outer wrapper will not report scrollWidth growth.
* Docs sidebar chrome is `aside#nd-sidebar` with `aria-label` from
  `messages.shell.sidebarTitle` (not a `nav`).
* Render docs pages for a11y via `renderDocsSlugPage` + `CanonicalDocsLayout`
  (same shell as production), not a bare `<main>` wrapper alone.

## Blog accessibility (story 005)

* `src/tests/a11y/blog.a11y.test.tsx`
  Always-on smokes: `/blog` index landmarks/headings/labeled post links + axe;
  representative post `/blog/comparing-agent-factories` landmarks/headings/
  keyboard chrome/labeled comparison table + related docs links + axe.
* `src/lib/verify/a11y-blog-page.test.ts`
  Opt-in served-page probe (`VERIFY_PRODUCTION_INTEGRATION_TESTS=1` + fresh
  `.next`): blog index + representative post landmarks, focus rings, Playwright
  axe at laptop viewport.
* Contract routes: `blog-index` → `/blog`, `blog-post` →
  `/blog/comparing-agent-factories`.
* Render blog surfaces via `renderBlogIndexPage` / `renderBlogPostPage` +
  `CanonicalDocsLayout` (same shell as production).

## Contributing / not-found / empty-state accessibility (launch extras)

* `src/tests/a11y/contributing-not-found-empty.a11y.test.tsx`
  Always-on smokes: contributing-to-these-docs landmarks/headings/keyboard
  chrome/Atlas-free copy + axe; docs not-found recovery links (Getting Started,
  Browse, Search, Blog) with focus-visible rings + Atlas-free copy + axe;
  glossary empty state factory recovery (home/browse/blog/search) with keyboard
  focus + Atlas-free copy + axe.
* Render contributing via `renderDocsSlugPage` + `CanonicalDocsLayout`; wrap
  `DocsNotFound` in the same shell; empty proof via `renderGlossaryIndexPage`.
* Colocated contract proofs (required `bun run test`): 
  `contributing-to-these-docs-page.test.tsx`, `src/app/docs/not-found.test.tsx`,
  `DocsIndexEmptyState.test.tsx`.
* Live empty surface for browser proof: `/docs/glossary`. Missing docs and
  retired Atlas paths (for example `/docs/models`) share `src/app/docs/not-found.tsx`.

## Responsive overflow matrix (story 006)

* `listCriticalOverflowMatrixCases()` in `a11y-responsive-contract.ts`
  enumerates every critical route × mobile/tablet/laptop/wide viewport.
* `collectResponsiveOverflowProbe` / `evaluateResponsiveOverflowInBrowser` in
  `a11y-responsive-probes.ts` — unit + Playwright page-level overflow checks
  that allow intentional table/code scrollers.
* `probePrimaryNavUsability` in `a11y-responsive-nav-probe.ts` — drawer vs
  inline primary-nav reachability.
* `openA11yResponsiveBrowserSession` in `a11y-responsive-page-session.ts` —
  one verify server + one Chromium for multi-route/viewport matrix iteration
  (prefer over per-case `openA11yResponsivePageProbe`).
* `src/tests/a11y/responsive-overflow.a11y.test.tsx` — always-on matrix
  contract, mobile drawer primary-nav usability, intentional scroller markers.
* `src/lib/verify/a11y-responsive-overflow-matrix-page.test.ts` — opt-in served
  matrix: all critical routes at four widths with no page overflow; mobile
  drawer + tablet inline primary nav usable.
* At Tailwind `md` (768px) the desktop inline primary nav is shown; mobile
  drawer applies below that. Tablet probes should assert inline nav, not the
  drawer.

## Reduced motion (story 007)

* `src/app/globals.css` — `@media (prefers-reduced-motion: reduce)` sets
  near-zero `animation-duration` / `transition-duration` (0.01ms) site-wide so
  non-essential motion (drawer, dropdowns, graph hover fades) becomes
  instantaneous without dropping transitionend events.
* `MobileDocsDrawer` marks animated chrome with `data-motion-chrome` and adds
  `motion-reduce:transition-none motion-reduce:duration-0` on the panel and
  backdrop. Home brush header is static SVG — do not add decorative motion.
* `src/lib/verify/a11y-reduced-motion.ts` — `parseCssTimeToMs`,
  `probeMotionDurationsFromStyle`, `evaluateReducedMotionChromeInBrowser`
  (self-contained for Playwright `page.evaluate`).
* `src/tests/a11y/reduced-motion.a11y.test.tsx` — always-on: open mobile drawer
  and assert motion-chrome markers + motion-reduce classes.
* `src/lib/verify/a11y-reduced-motion-page.test.ts` — opt-in served probe:
  Playwright `emulateMedia({ reducedMotion: "reduce" })` proves drawer
  transition ≤ threshold; `no-preference` keeps duration-300.

## Layout snapshot / lightweight visual equivalent (story 008)

* Prefer the lightweight layout-snapshot contract over full-page screenshot
  baselines: landmarks, h1 texts, primary-nav hrefs, header brand text,
  content-column surface markers, page overflow, and rounded chrome boxes
  (when geometry is non-zero).
* `src/lib/verify/a11y-layout-snapshot.ts` — `captureCriticalLayoutSnapshot`,
  `serializeLayoutSnapshot` / `hashLayoutSnapshot`, `diffLayoutSnapshots`,
  `expectLayoutSnapshotMatches`, `assertCriticalLayoutContract` (optional
  `expectedBrand` / `expectedContentColumnSurface`),
  `evaluateCriticalLayoutSnapshotInBrowser`, and
  `evaluateContentColumnLeftEdgeAlignmentInBrowser` (self-contained for
  Playwright; compare header primary-nav column left to `#nd-page`).
* `src/tests/a11y/layout-snapshot.a11y.test.tsx` — always-on: home/browse
  baselines pass the contract (including display brand); deliberate main/h1
  regressions change the hash and fail `expectLayoutSnapshotMatches`.
* `src/lib/verify/a11y-layout-snapshot-page.test.ts` — opt-in served probe:
  all critical routes at laptop viewport pass the contract with non-empty
  chrome boxes under Chromium.
* Brand + content-column alignment matrix (repair-layout-brand-alignment):
  `content-column-brand-alignment-coverage.ts`, always-on
  `content-column-brand-alignment.a11y.test.tsx`, always-on Playwright
  `a11y-content-column-left-edge-geometry.test.ts` (fixture proves `md:gap-0`
  vs historical ~32px gap drift), and served
  `a11y-content-column-brand-alignment-page.test.ts` (also in
  `PRODUCTION_INTEGRATION_TEST_PATHS`; four viewports, brand, surfaces,
  overflow, md+ left-edge geometry).
* Chrome box geometry is optional under happy-dom (often zero rects); structural
  fields + hash diffs are the always-on regression signal.

## Focused gate

* `Makefile` target `a11y` → `bun run test:a11y`
* `package.json` script `test:a11y` runs contract/probe/axe/page-structure/
  reduced-motion/layout-snapshot unit tests plus home/browse, search,
  docs/harness-support, blog, contributing/not-found/empty-state, responsive
  overflow, reduced-motion, and layout snapshot a11y smokes (and the
  skipped-by-default served-page probes).
* Required by `make ci` and `.github/workflows/ci.yml` (after
  `test-reader-facing`, before `test-ci-contract`) via
  `src/lib/ci-required-path.ts` (`MAKE_CI_PREREQUISITES`,
  `CI_WORKFLOW_REQUIRED_MAKE_TARGETS`, `SHARED_REQUIRED_SUITE_TARGETS`).
* On failure, reproduce with `make a11y` (constant
  `A11Y_SUITE_REPRODUCTION_COMMAND` in `a11y-responsive-contract.ts`).
* `test:a11y` runs with `--max-concurrency=1` so happy-dom component smokes
  that share `document` do not race (same pattern as `test:reader-facing`).
* Distinct from `make test-reader-facing`, which covers older component a11y
  smokes plus search/layout contracts — do not fold Atlas-era
  `src/tests/a11y/*` wholesale into `make a11y`.

## Existing component a11y smokes

* `src/tests/a11y/*.a11y.test.tsx` — still excluded from default
  `scripts/run-website-functionality-tests.ts`. Some rows still assert retired
  Atlas sidebar labels; do not fold the whole directory into `make a11y` until
  those smokes are updated in later stories. A bounded subset is already
  required via `make test-reader-facing`.

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
* Wire new required a11y gates through `src/lib/ci-required-path.ts` so
  `make ci` and CI stay aligned — do not add a workflow-only or Makefile-only
  required stage.
