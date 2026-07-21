# Homepage landing skeleton chassis — relevant files

Use these files when working on Homepage-2 **W-skeleton** (Wave A): the thin
`landing-page` chassis, theme/data stubs, `public/home` assets, and the
production-gated `(dev)/landing-harness` route. Do **not** flip production `/`
here — that belongs to W-integrate.

Control docs live under planner-local `docs/temp/homepage-2/` (gitignored):
`README.md`, `workstreams.md`, `contracts.md`, `motion-whale.md`,
`component-inventory.md`.

## Chassis + stubs

| File | Role |
| --- | --- |
| `src/features/landing-page/landing-page.theme.ts` | Typed theme stub: whale / carousel / sphere knobs + `landingThemeToCssVars` for root wrappers |
| `src/features/landing-page/landing-page.data.ts` | Typed `emptyLandingPageData` + `fixtureLandingPageData` section shapes (no CMS) |
| `src/features/landing-page/landing-page.assets.ts` | `/home/...` public path constants for staged homepage images |
| `src/features/landing-page/LandingPage.tsx` | Nine optional `ReactNode` slots (contracts); omitted → labeled placeholders; root applies `landingThemeToCssVars` |
| `src/features/landing-page/components/LandingPlaceholder.tsx` | Gray labeled box with mock `minHeight` (`LANDING_SLOT_MIN_HEIGHTS` / `LANDING_SLOT_ORDER`) |

## Harness + assets

| File | Role |
| --- | --- |
| `src/app/(dev)/landing-harness/page.tsx` | Production-gated harness (`ENABLE_COMPONENT_EXAMPLES` / `notFound`) rendering default `LandingPage` |
| `public/home/` | Reserved homepage asset root (`/home/...` URLs) |
| `scripts/stage-homepage-assets.ts` | Copy/optimize planner or sibling `images/` sources into `public/home/` (no-op leave-empty when sources absent) |

## Patterns

- Whale theme knob names come from `docs/temp/homepage-2/motion-whale.md` (`initialScale`, `initialY`, `durationMs`, `ease`, `blurPx`, `viewAmount`, `bubbleDelayMs`, `parallaxFactor`).
- Sphere stub knobs: `particleCount`, `repulsion`, `radiusRatio` (workstreams W-sphere).
- Carousel stub knobs: depth neighbor scale/opacity + transition/drag thresholds (workstreams W-carousel).
- Feature lanes must not import unfinished sibling packages; chassis stubs stay self-contained.
- Match other `(dev)` harnesses: gate with `NODE_ENV === "production" && ENABLE_COMPONENT_EXAMPLES !== "1"` → `notFound()`.
- Keep production `/` on the current docs home until W-integrate swaps slots.
- Homepage image sources: prefer `docs/temp/images/`, else walk up from the
  checkout looking for a sibling `images/` directory (worktrees need several
  `..` hops). Stage with `bun ./scripts/stage-homepage-assets.ts`; consumers use
  `landingHomeAssets` / `/home/...`. When sources are absent the script still
  creates/leaves `public/home/` without failing the chassis.
