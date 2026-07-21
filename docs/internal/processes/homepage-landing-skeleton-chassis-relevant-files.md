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
| `src/app/(dev)/landing-harness/page.tsx` | Production-gated harness (`ENABLE_COMPONENT_EXAMPLES` / `notFound`); spreads `composeWaveALandingHarnessSlots()` so only wired Wave A slots receive fixture fills; unwired Wave B slots stay placeholders |
| `src/app/(dev)/landing-harness/compose-wave-a-slots.tsx` | Thin compose helpers + `composeWaveALandingHarnessSlots()` / `WIRED_WAVE_A_SLOTS`: map `fixtureLandingPageData` onto public Wave A prop contracts only (no new schemas; no Wave B content trees); `artSrc` → optional `<img>` ReactNode for SiteFooter; whale `bubbles` → section `items` with `WHALE_BUBBLES_FIXTURE_*` fallback; hero soft-wires `cta.installCommand` / carousel `command` → Terminal `lines` |
| `src/app/(dev)/landing-harness/page.test.tsx` | Observable harness proofs: wired Wave A markers + fixture content; unwired placeholder labels; absence of unwired Wave B fixture trees (hero title, capability labels, youi/faq/cta copy, carousel blurbs) |
| `public/home/` | Reserved homepage asset root (`/home/...` URLs) |
| `scripts/stage-homepage-assets.ts` | Copy/optimize planner or sibling `images/` sources into `public/home/` (no-op leave-empty when sources absent) |

## Production home (Wave C route flip)

| File | Role |
| --- | --- |
| `src/app/(site)/compose-production-landing-slots.tsx` | Production compose helper: maps `fixtureLandingPageData` onto MERGED public exports (`LandingHeader`, `HeroSection` + `ParticleSphere`/`Terminal` holes, `CapabilityStrip`, `YouiShowcase`, `WhaleBubblesSection`, `SiteFooter` + `LandingFooterArt`). Returns only `WIRED_PRODUCTION_LANDING_SLOTS` — omits carousel/faq/cta so LandingPage keeps labeled placeholders. No CMS schemas; do not import open `#217` carousel surfaces. |
| `src/app/(site)/compose-production-landing-slots.test.tsx` | Observable proofs for each wired slot + aggregate LandingPage mount (wired markers present; carousel/faq/cta stay placeholders) |
| `src/app/(site)/page.tsx` / `site-renderers.tsx` `renderHomePage` | Live `/` (and localized home) mounts `LandingPage {...composeProductionLandingSlots()}` — docs chrome bypass for `/` only is a separate Wave C story |
| `src/app/(site)/production-home-landing-untouched.test.tsx` | Post-flip regression: `renderHomePage` mounts `LandingPage` with header/hero/footer markers; rejects `HomeArticle` as production home composition |

## Patterns

- Whale theme knob names come from `docs/temp/homepage-2/motion-whale.md` (`initialScale`, `initialY`, `durationMs`, `ease`, `blurPx`, `viewAmount`, `bubbleDelayMs`, `parallaxFactor`).
- Sphere stub knobs: `particleCount`, `repulsion`, `radiusRatio` (workstreams W-sphere).
- Carousel stub knobs: depth neighbor scale/opacity + transition/drag thresholds (workstreams W-carousel).
- Feature lanes must not import unfinished sibling packages; chassis stubs stay self-contained.
- Match other `(dev)` harnesses: gate with `NODE_ENV === "production" && ENABLE_COMPONENT_EXAMPLES !== "1"` → `notFound()`.
- Worktree browser verify: when `node_modules` lives only in the main checkout, Turbopack may fail (`next` not resolvable / symlink out of root). Prefer `bun ./scripts/run-next.ts dev --webpack -p <unique-port>` for local harness checks; do not leave the server running.
- Wave C production compose + route flip: build LandingPage slots under `src/app/(site)/compose-production-landing-slots.tsx` via `composeProductionLandingSlots()` / `WIRED_PRODUCTION_LANDING_SLOTS` from MERGED public exports only (`LandingHeader`, `HeroSection` + `ParticleSphere`/`Terminal`, `CapabilityStrip`, `YouiShowcase`, `WhaleBubblesSection`, `SiteFooter` + `LandingFooterArt`). Omit carousel/faq/cta keys so placeholders remain; do not import open `#217` carousel surfaces or relocate `src/components/home`. Map fixture fields at compose time; omit fixture-only extras (`meta.tagline`); map whale `bubbles` → `items` (fallback `WHALE_BUBBLES_FIXTURE_*`); map `cta.installCommand` + distinct carousel `command` strings → Terminal `lines` (omit Terminal when empty). `renderHomePage` returns `<LandingPage {...composeProductionLandingSlots()} />` (locale arg kept for callers; fixture content is English until i18n). Docs chrome bypass on `/` only remains a follow-up Wave C story.
- W-integrate Wave A fill: compose only public exports (`SiteFooter`, `WhaleBubblesSection`, `ParticleSphere` from components path, optional `Terminal` from `@/features/code`) into LandingPage slots on landing-harness via `composeWaveALandingHarnessSlots()` (returns only `WIRED_WAVE_A_SLOTS`). Same fixture→prop mapping rules as production compose; harness stays review-only and does not flip production `/`. Reduced-motion remains inside ParticleSphere / WhalePlate — wiring must not force animated-only paths.
- Homepage image sources: prefer `docs/temp/images/`, else walk up from the
  checkout looking for a sibling `images/` directory (worktrees need several
  `..` hops). Stage with `bun ./scripts/stage-homepage-assets.ts`; consumers use
  `landingHomeAssets` / `/home/...`. When sources are absent the script still
  creates/leaves `public/home/` without failing the chassis.
