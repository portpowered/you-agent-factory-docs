# Factory Components Host Integration Relevant Files

Use these files when installing or consuming `@you-agent-factory/components` from
the docs host (rewrite-era factory-ui wrappers, styles, transpile).

## Package facts

| Fact | Value |
| --- | --- |
| Package | `@you-agent-factory/components@0.0.0` |
| Export style | TypeScript source via `exports` (`types`/`default` → `.ts` / `.tsx`) |
| Styles entry | `@you-agent-factory/components/styles.css` |
| Category entrypoints needed by the host | `/graphs`, `/charts`, `/data-display` |

The package does **not** ship a compiled `dist/`. The host must transpile the
package (Next `transpilePackages`) and import styles once from the global CSS
entry. Do not vendor or fork package source into this repo.

## Key host files

| Path | Role |
| --- | --- |
| `package.json` | Runtime dependency on `@you-agent-factory/components@0.0.0` |
| `next.config.ts` | `transpilePackages: ["@you-agent-factory/components"]` so Next compiles TS source exports |
| `src/lib/factory-components/host-package-surface.ts` | Minimal host import proving root + category resolution/typecheck |
| `src/app/globals.css` | Single `@import "@you-agent-factory/components/styles.css"` after Tailwind (package README order); host `:root` shadcn tokens map to `--color-af-foundation-*` (factory-dark), not legacy teal/coral oklch |
| `src/lib/theme/host-semantic-theme-tokens.ts` | Contract for host semantic → foundation bindings + resolved factory-dark hex; keep aligned with `globals.css` `:root` |
| `src/app/root-layout.shared.tsx` | Root `<html className="dark" data-color-palette="factory-dark">` so package palette presets stay explicit |
| `src/lib/factory-components/host-package-styles.ts` | Resolves the published `styles.css` export map entry for smoke verification |
| `src/features/factory-ui/graphs.ts` | Thin re-export of `@you-agent-factory/components/graphs` (viewport/node/edge helpers); no domain logic or styles import |
| `src/features/factory-ui/charts.ts` | Thin re-export of `@you-agent-factory/components/charts` (ChartContainer, ChartStatePanel, tooltip/legend helpers); no domain series models or styles import |
| `src/features/factory-ui/data-display.ts` | Thin re-export of DataTable + CodePanel from `@you-agent-factory/components/data-display`; columns/rows/code stay caller-owned; no styles import |
| `src/lib/docs/component-manifest.ts` | Reusable coverage boundary: factory-ui wrappers in `REUSABLE_THIN_WRAPPERS`; Atlas `AttentionVariantComparisonGraph` / `RegistryGraphFlow` are not in `REUSABLE_COVERAGE_COMPONENTS` |
| `src/lib/docs/component-coverage-gate.ts` | Allows `src/features/factory-ui/` via `FACTORY_UI_MANIFEST_PREFIX` alongside components/search/tags paths |

## Styles import contract

- Import `@you-agent-factory/components/styles.css` **exactly once** in
  `src/app/globals.css` (the stylesheet every app/static-export layout already
  pulls in). Place it immediately after `@import "tailwindcss"` so package
  `@theme` tokens layer correctly with Tailwind v4.
- Do **not** re-import package styles from `src/features/factory-ui/*` wrappers.
- Prove the styles export resolves with `resolveFactoryComponentsStylesPath()`;
  do not add tests that only count `@import` lines in `globals.css`.

## Host semantic theme remap (factory-dark)

- Package `color-palette-presets.css` defines `--color-af-foundation-*` for
  `factory-dark` (near-black `#050b10`, warm ink `#f7f2e8`, yellow accent
  `#f5c76f` / strong `#ecbf58`, cool secondary `#507f8c`).
- Host shadcn variables (`--background`, `--primary`, `--secondary`, …) in
  `globals.css` must `var()` those foundation keys. Do not paste a second
  teal/coral oklch palette into `:root`.
- Keep `src/lib/theme/host-semantic-theme-tokens.ts` as the binding contract;
  prove resolved primary/secondary/background with
  `host-semantic-theme-tokens.test.ts` (behavioral color checks, not a CSS
  source inventory).
- Contrast lock: `HOST_SEMANTIC_CONTRAST_PAIRINGS` +
  `src/lib/theme/color-contrast.ts` assert readable WCAG ratios for
  primary/secondary/foreground pairings on the dark product theme
  (`color-contrast.test.ts`). Secondary button fill is ~4.48:1 — lane floor
  is 4.4 for that pairing; body/primary stay at 4.5+.
- Set `data-color-palette="factory-dark"` on the root document element.
- R00 served-page gate: `src/lib/verify/theme-code-copy-r00-gate.ts` +
  `theme-code-copy-r00-page.test.ts` prove factory-dark chrome and shared
  code-copy interaction on `/docs/guides/getting-started` (desktop + narrow).

## Docs chrome highlighting token map (locked roles)

Wave 5 / batch-005 chrome hover-active repair owns resting vs overlay colors
for search, globe, GitHub, TOC, sidebar, header, and breadcrumb through one
shared map — not per-control hex hacks.

| Role | Host semantic | Factory-dark proof | Surfaces |
| --- | --- | --- | --- |
| surrounding chrome background | `--background` | `#050b10` | search / globe / GitHub rest |
| primary yellow | `--primary` | `#f5c76f` | hover/active overlay (all); sidebar hover **background** |
| secondary blue | `--secondary` | `#507f8c` | TOC current rest; sidebar active wash (`color-mix` 18%) |
| white | `--foreground` | `#f7f2e8` | sidebar / header text+icons rest |
| muted white | `--muted-foreground` | `#8aaeb8` | TOC non-current / breadcrumb rest |

- Contract module: `src/lib/theme/docs-chrome-highlighting-tokens.ts`
  (`DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS`, surface role map,
  factory-dark hex proofs).
- CSS ownership: `:root` `--docs-chrome-*` vars in `src/app/globals.css`
  (must stay aligned with the TS contract).
- Lock with `docs-chrome-highlighting-tokens.test.ts` (role bindings +
  observable DOM color checks). Do not add source-inventory tests that only
  scan `globals.css` for var names.
- Search / globe / GitHub surface (story 002): consume
  `src/features/docs/styles/docs-chrome-search-globe-github.ts` +
  `.header-action-icon` / `button[data-search]` rules in `globals.css`.
  Rest = `--docs-chrome-surrounding-background`; hover/active =
  `--docs-chrome-primary-yellow` (not `--accent` or secondary color-mix).
  Chrome icon overrides must sit in `@layer utilities` with `!important`
  so they beat outline-button `dark:!bg-input/30` (layered !important wins
  over unlayered !important per CSS Cascade 5).
  Prove with `docs-chrome-search-globe-github.test.ts` and SearchTrigger
  hover assertions.
- TOC “On this page” surface (story 003): consume
  `src/features/docs/styles/docs-chrome-toc.ts` + `docs-chrome-toc.css`
  (imported from `globals.css`). Current = `--docs-chrome-secondary-blue`;
  non-current = `--docs-chrome-muted-white`; hover =
  `--docs-chrome-primary-yellow`. Overrides Fumadocs
  `data-[active=true]:text-fd-primary` / `hover:text-fd-accent-foreground`
  and retargets the TOC thumb `.bg-fd-primary` to secondary blue. Keep
  focus-visible as outline-only so focus does not recolor rest roles.
  Prove with `docs-chrome-toc.test.ts`.
- Sidebar row surface (story 004 / PF-K repair): consume
  `src/features/docs/styles/docs-chrome-sidebar.ts` + `docs-chrome-sidebar.css`
  (imported from `globals.css`). Rest text = `--docs-chrome-white`; hover =
  wide `--docs-chrome-primary-yellow` **background** + dark
  `--primary-foreground` text (with `px-2` so the fill covers outline/padding —
  not text-only recolor; do not invent a secondary-blue hover). Active rows use
  a muted secondary-blue wash (`color-mix` of `--docs-chrome-secondary-blue` at
  18% into transparent) so selection stays quiet and distinct from yellow hover.
  Hover rules follow active in the stylesheet so `:hover` wins over the active
  wash at the same specificity. Focus-visible keeps a `--ring` outline.
  Marker class `docs-chrome-sidebar-row` is shared by desktop `#nd-sidebar`
  tree (`docs-sidebar-tree.tsx`) and mobile drawer (`data-mobile-docs-drawer`).
  Do not leave `text-fd-muted-foreground` rest or `hover:bg-fd-accent/50` /
  `hover:bg-sidebar-accent` owning these rows. Prove with
  `docs-chrome-sidebar.test.ts` and
  `docs-chrome-sidebar.browser.test.ts` (Playwright fixture — rest, yellow
  hover on resting+active rows, focus-visible ring; no Next build).
- Header text/icons + breadcrumb surface (story 005): consume
  `src/features/docs/styles/docs-chrome-header-breadcrumb.ts` +
  `docs-chrome-header-breadcrumb.css` (imported from `globals.css`). Header
  brand / primary-nav text and menu icon rest = `--docs-chrome-white`;
  hover/active = `--docs-chrome-primary-yellow` text overlay. Breadcrumb
  links and current page rest = `--docs-chrome-muted-white`; link hover =
  `--docs-chrome-primary-yellow`. Marker classes
  `docs-chrome-header-text` / `docs-chrome-header-icon` /
  `docs-chrome-breadcrumb-link` / `docs-chrome-breadcrumb-page`. Do not leave
  `text-muted-foreground hover:text-foreground` owning these chrome surfaces.
  Do not reopen primary-nav membership, brand copy, glossary, or search
  ranking. Prove with `docs-chrome-header-breadcrumb.test.ts`.
- Five-surface lock (story 006): consume
  `src/features/docs/styles/docs-chrome-highlighting-token-map-contract.ts`
  for the representative resting vs hover/active expectations across search /
  globe / GitHub, TOC, sidebar, header text/icons, and breadcrumb. Prove with
  `docs-chrome-highlighting-token-map-contract.test.ts` (happy-dom role + DOM
  color proofs) and
  `docs-chrome-highlighting-token-map.browser.test.ts` (Playwright fixture —
  same always-on pattern as `docs-page-footer-chrome.browser.test.ts`; no Next
  build required). The home-shell layout contract also asserts the five-surface
  expectation map next to the search resting-fill contract. Joint live check:
  on `/docs/guides/getting-started`, confirm all five surfaces match the locked
  map together (rest + hover).

## Prose / chrome link underline accent (secondary blue)

- Fumadocs prose defaults `text-decoration-color` to `--color-fd-primary`
  (host `--primary` / yellow accent). Do **not** remap `--primary` or
  `--color-fd-primary` to fix underlines — that would retarget logos, CTA
  fills, and method badges.
- Own the accent in shared CSS: `.prose a:not([data-card])` (matching the
  Fumadocs `:where` exclusion for `not-prose`) sets
  `text-decoration-color: var(--secondary)` in `src/app/globals.css`.
- Inline auto-links share `proseAutoLinkClassName` in
  `src/features/docs/components/prose-auto-link-class.ts`
  (`text-secondary` + `decoration-secondary`, not `text-primary`).
- Ordinary non-button browse-all / see-all textual CTAs use the same
  secondary accent family (not `text-primary` yellow): Browse section
  footers in `BrowseIndexPage.tsx` (`linkHref` + `linkLabel`) and
  factories-index see-all links in `render-factories-index-page.tsx`
  (`data-factories-index-full-schema-link` /
  `data-factories-index-full-api-link`). Lock with
  `browse-index.test.tsx` and `factories-index.test.tsx` class assertions.
  Do not restyle solid primary buttons, search trigger, or primary accent
  icons as part of that repair.
- Lock with `prose-auto-link-class.test.tsx` and rendered secondary-class
  assertions on a live factory phrase (for example Model Context Protocol).
  The representative layout chrome contract
  (`home-shell-styling-contract.test.tsx`) also asserts the same secondary
  underline classes next to the header search resting-fill contract so both
  chrome repairs stay locked together.
- Joint browser check: on `/docs/concepts/mcp`, confirm
  `button[data-search]` computed background matches `--background`, and
  prose / auto-link underline or text colors resolve to `--secondary`
  (not `--primary` yellow).

## Thin factory-ui graph wrappers

- Host path: `src/features/factory-ui/graphs.ts` — re-export only from
  `@you-agent-factory/components/graphs`.
- Smoke-test with fixture props via `@testing-library/react`.
  `GraphViewportSurface` mounts without React Flow; `GraphNodeShell` /
  handle badges need a `ReactFlowProvider` ancestor (same pattern as
  `RegistryGraphFlow` tests).
- Do not put registry IDs, Atlas copy, or data fetching in the wrapper module.

## Thin factory-ui chart wrappers

- Host path: `src/features/factory-ui/charts.ts` — re-export only from
  `@you-agent-factory/components/charts`.
- Host apps already depend on `recharts` for Recharts children
  (`LineChart`, `Line`, axes). Keep series config/data caller-owned.
- Smoke-test `ChartContainer` with fixture `ChartConfig` + Recharts children
  (`role="img"` + `data-chart-container`). Also exercise `ChartStatePanel`
  empty (`role="status"`) and error (`role="alert"`) states.
- Do not import package styles from the wrapper module.

## Thin factory-ui DataTable and CodePanel wrappers

- Host path: `src/features/factory-ui/data-display.ts` — re-export
  `DataTable`, `CodePanel`, and related types/helpers from
  `@you-agent-factory/components/data-display`.
- Keep column definitions, row data, and code content caller-owned; the
  wrapper adds no domain matrix models or Atlas assumptions.
- Smoke-test `DataTable` success with fixture columns/rows
  (`role="table"` + cell text), plus at least one non-success state:
  empty → `role="status"`, error → `role="alert"`.
- Smoke-test `CodePanel` with fixture code text on a `<pre>` surface.
- Do not import package styles from the wrapper module.

## Component manifest retarget

- Remove Atlas `AttentionVariantComparisonGraph` and `RegistryGraphFlow` from
  `REUSABLE_COVERAGE_COMPONENTS` / `PHASE_1_MODULE_PAGE_COVERAGE_COMPONENTS`.
  Leave the Atlas implementation files in place for existing page consumers;
  deletion/migration belongs to later lanes.
- Register factory-ui wrappers in `REUSABLE_THIN_WRAPPERS` with
  `forwardsTo` pointing at the package category (or DataTable / CodePanel) and
  smoke tests under `src/features/factory-ui/*.test.tsx`.
- Coverage gate must allow `src/features/factory-ui/`
  (`FACTORY_UI_MANIFEST_PREFIX` in `component-coverage-gate.ts`); thin wrappers
  skip line-percent thresholds and only require existing smoke test files.

## Verification preference

Prove install/transpile by compiling and importing real package exports (and later
by rendering factory-ui wrappers with fixture props). Avoid meta-tests that only
scan `package.json` keys, CSS `@import` counts, import-path inventories, or live
`REUSABLE_COVERAGE_COMPONENTS` / `REUSABLE_THIN_WRAPPERS` membership lists.
Prove gate path allowlisting and thin-wrapper evaluation with fixture inputs in
`component-coverage-gate.test.ts`; keep render smoke tests under
`src/features/factory-ui/*.test.tsx`.

## Related

- PRD lane: `rewrite-components-package`
- Upstream foundation: `rewrite-ci-deploy-foundation-zero` (Makefile/CI/static-export contract)
