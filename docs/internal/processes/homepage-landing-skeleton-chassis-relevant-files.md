# Homepage landing skeleton chassis — relevant files

Use these files when working on Homepage-2 **W-skeleton** (Wave A): the thin
`landing-page` chassis, theme/data stubs, `public/home` assets, and the
production-gated `(dev)/landing-harness` route. Do **not** flip production `/`
here — that belongs to W-integrate / Wave C route flip.

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
| `src/app/(dev)/landing-harness/page.tsx` | Production-gated harness (`ENABLE_COMPONENT_EXAMPLES` / `notFound`); spreads `composeWaveALandingHarnessSlots()` + `composeWaveBLandingHarnessSlots()` so wired Wave A/B slots receive fixture fills; remaining unwired slots stay placeholders |
| `src/app/(dev)/landing-harness/compose-wave-a-slots.tsx` | Thin compose helpers + `composeWaveALandingHarnessSlots()` / `WIRED_WAVE_A_SLOTS`: map `fixtureLandingPageData` onto public Wave A prop contracts only (no new schemas; no Wave B content trees); `artSrc` → optional `<img>` ReactNode for SiteFooter; whale `bubbles` → section `items` with `WHALE_BUBBLES_FIXTURE_*` fallback; hero soft-wires `cta.installCommand` / carousel `command` → Terminal `lines` |
| `src/app/(dev)/landing-harness/compose-wave-b-slots.tsx` | Thin Wave B compose helpers + `composeWaveBLandingHarnessSlots()` / `WIRED_WAVE_B_SLOTS`: map fixture carousel slides onto public `FactoryCarousel` / `FactorySlideData` (`id`/`title`/`blurb`/`command`; preserve caller-owned `art` ReactNode only); map fixture FAQ items onto public `FaqPanel` / `FaqPanelItem` (`id`/`question`/`answer`) with harness-local `heading="FAQ"`; map fixture CTA (`headline`/`supporting`/`installCommand`) onto public `CtaBand` with faq-cta-harness defaults for `ctaLabel`/`ctaHref` (do not extend `LandingCtaContent`). Wired: carousel + faq + cta |
| `src/app/(dev)/landing-harness/page.test.tsx` | Observable harness proofs: Wave A + Wave B wired together (footer/whale/hero + carousel/faq/cta markers + fixture content); placeholders only for remaining unwired slots (header/capability/youi); absence of still-unwired fixture trees |
| `public/home/` | Reserved homepage asset root (`/home/...` URLs) |
| `scripts/stage-homepage-assets.ts` | Copy/optimize planner or sibling `images/` sources into `public/home/` (no-op leave-empty when sources absent) |

## Production home (Wave C route flip)

| File | Role |
| --- | --- |
| `src/app/(site)/compose-production-landing-slots.tsx` | Production compose helper: maps `fixtureLandingPageData` onto MERGED public exports (`LandingHeader`, `HeroSection` + `ParticleSphere`/`Terminal` holes, `CapabilityStrip`, `YouiShowcase`, `FactoryCarousel`, `FaqPanel`, `CtaBand`, `WhaleBubblesSection`, `SiteFooter` + `LandingFooterArt`). Returns only `WIRED_PRODUCTION_LANDING_SLOTS` — includes carousel + faq + cta via copied harness Wave B maps. No CMS schemas; copy harness Wave B maps into `(site)/` — do not import from `(dev)/landing-harness/**`. |
| `src/app/(site)/compose-production-landing-slots.test.tsx` | Observable proofs for each wired slot + aggregate LandingPage mount (wired markers present including `data-factory-carousel` / `data-landing-faq-panel` / `data-landing-cta-band`; placeholders absent for those three) |
| `src/app/(site)/page.tsx` / `site-renderers.tsx` `renderHomePage` | Live `/` (and localized home) mounts `LandingPage {...composeProductionLandingSlots()}` |
| `src/app/(site)/layout.tsx` / `src/app/[locale]/layout.tsx` | Root shell only (`RootDocument` + `AppProviders` + `RouteLocaleEffect`) — no `CanonicalDocsLayout` so production home is full-bleed |
| `src/app/(site)/(with-docs-chrome)/layout.tsx` / `src/app/[locale]/(with-docs-chrome)/layout.tsx` | Nested route-group layouts that wrap browse/search/blog/docs/tags with `CanonicalDocsLayout`; home `page.tsx` stays outside the group |
| `src/app/(site)/production-home-landing-untouched.test.tsx` | Post-flip regression: `renderHomePage` (default + localized) mounts `LandingPage` with wired slot markers (header/hero+sphere/capability/youi/carousel/faq/cta/whale/footer); rejects `HomeArticle` / docs-home content-column as production home composition. Production Wave B fill lane may update carousel/faq/cta assertions when wiring those fills; harness Wave B lanes must not edit this file. |
| `src/app/(site)/production-home-landing-a11y.test.tsx` | Production LandingPage a11y + reduced-motion: Landing nav keyboard focus, `main` landmark, ParticleSphere static + WhalePlate settled under `prefers-reduced-motion` |
| `src/app/(site)/production-home-docs-chrome-bypass.test.tsx` | Home layouts omit `CanonicalDocsLayout` / `#nd-sidebar`; `(with-docs-chrome)` layouts keep docs chrome |

## Patterns

- Whale theme knob names come from `docs/temp/homepage-2/motion-whale.md` (`initialScale`, `initialY`, `durationMs`, `ease`, `blurPx`, `viewAmount`, `bubbleDelayMs`, `parallaxFactor`).
- Sphere stub knobs: `particleCount`, `repulsion`, `radiusRatio` (workstreams W-sphere).
- Carousel stub knobs: depth neighbor scale/opacity + transition/drag thresholds (workstreams W-carousel).
- Feature lanes must not import unfinished sibling packages; chassis stubs stay self-contained.
- Match other `(dev)` harnesses: gate with `NODE_ENV === "production" && ENABLE_COMPONENT_EXAMPLES !== "1"` → `notFound()`.
- Worktree browser verify: when `node_modules` lives only in the main checkout, Turbopack may fail (`next` not resolvable / symlink out of root). Prefer `bun ./scripts/run-next.ts dev --webpack -p <unique-port>` for local harness checks; do not leave the server running.
- Wave C production compose + route flip: build LandingPage slots under `src/app/(site)/compose-production-landing-slots.tsx` via `composeProductionLandingSlots()` / `WIRED_PRODUCTION_LANDING_SLOTS` from MERGED public exports only (`LandingHeader`, `HeroSection` + `ParticleSphere`/`Terminal`, `CapabilityStrip`, `YouiShowcase`, `FactoryCarousel`, `FaqPanel`, `CtaBand`, `WhaleBubblesSection`, `SiteFooter` + `LandingFooterArt`). Carousel + FAQ + CTA are wired via copied harness Wave B maps (`mapFixtureCarouselToFactoryCarouselProps`, `mapFixtureFaqToFaqPanelProps` with heading `"FAQ"`, `mapFixtureCtaToCtaBandProps` with compose-local `ctaLabel="Install the CLI"` / `ctaHref="/docs/guides"`) — do not import from `(dev)/landing-harness/**`. Do not relocate `src/components/home`. Map fixture fields at compose time; omit fixture-only extras (`meta.tagline`); map whale `bubbles` → `items` (fallback `WHALE_BUBBLES_FIXTURE_*`); map `cta.installCommand` + distinct carousel `command` strings → Terminal `lines` (omit Terminal when empty). `renderHomePage` returns `<LandingPage {...composeProductionLandingSlots()} />` (locale arg kept for callers; fixture content is English until i18n). Production compose tests invert placeholders for carousel/faq/cta and mirror harness Wave B reduced-motion coverage (`matchMedia` stub → `data-carousel-motion="static"` vs `depth`) in `compose-production-landing-slots.test.tsx` — do not rewrite FactoryCarousel internals.
- Wave C production-home regression (`production-home-landing-untouched.test.tsx`): lock ownership via observable markers on `renderHomePage` output (wired fills present including `data-factory-carousel` / `data-landing-faq-panel` / `data-landing-cta-band`; HomeArticle content-column / harness-only hero absent). Cover both default and localized `renderHomePage(locale)` callers. Prefer marker asserts over route-registration inventory scans. When production Wave B wires carousel/faq/cta, invert those placeholder assertions in this file.
- Wave C production-home a11y / reduced-motion: `LandingPage` wraps body slots in `<main data-landing-main>`; site-nav probes accept `nav[aria-label="Landing"]` alongside docs `Primary`. Drawer reduced-motion probes target docs chrome routes (`/browse`), not `/`. Brand-alignment served matrix omits `/` (no docs content-column on landing).
- Wave C docs chrome bypass (`/` only): keep `CanonicalDocsLayout` off `(site)` / `[locale]` root layouts; nest browse/search/blog/docs/tags under `(with-docs-chrome)` route groups whose layouts mount `CanonicalDocsLayout`. Home `page.tsx` stays a sibling of the group so URLs are unchanged. Update `@/app/(site)/…` and `@/app/[locale]/…` module imports (and denylist path strings) to include `(with-docs-chrome)` after the move — route groups affect filesystem imports, not public URLs. When rebasing onto `main`, keep blog index metadata on `englishOnlyCanonicalAlternates` (seo-hreflang) while preserving `(with-docs-chrome)` nesting + `../../site-renderers` depth; retarget any newly landed `@/app/(site)/blog/…` or `@/app/[locale]/blog/…` imports to the nested paths.
- W-integrate Wave A fill: compose only public exports (`SiteFooter`, `WhaleBubblesSection`, `ParticleSphere` from components path, optional `Terminal` from `@/features/code`) into LandingPage slots on landing-harness via `composeWaveALandingHarnessSlots()` (returns only `WIRED_WAVE_A_SLOTS`). Same fixture→prop mapping rules as production compose; harness stays review-only. Reduced-motion remains inside ParticleSphere / WhalePlate — wiring must not force animated-only paths.
- W-integrate Wave B fill (harness-only): add sibling `compose-wave-b-slots.tsx` and merge with Wave A on `landing-harness/page.tsx`. Map `fixtureLandingPageData.carousel.slides` onto public `FactoryCarousel` props only (`id`/`title`/`blurb`/`command`; keep optional `art` only when already a ReactNode). Map `fixtureLandingPageData.faq.items` onto public `FaqPanel` props (`id`/`question`/`answer`; harness-local `heading="FAQ"` matching faq-cta-harness — do not invent FAQ schemas). Map `fixtureLandingPageData.cta` (`headline`/`supporting`/`installCommand`) onto public `CtaBand` with harness-local `ctaLabel="Install the CLI"` / `ctaHref="/docs/guides"` from faq-cta-harness — do not extend `LandingCtaContent`. Do **not** edit production compose / site-renderers / production-home tests; do not relocate `src/components/home`; do not rewrite FactoryCarousel / FaqPanel / CtaBand internals. Leave header / capability / youi as placeholders on the harness until their harness stories wire them. Reduced-motion stays inside FactoryCarousel (`data-carousel-motion`); prove harness wiring with compose client tests under a `matchMedia("(prefers-reduced-motion: reduce)")` stub (`static` vs `depth`) — do not rewrite carousel internals.
- Wave B integrate closeout: confirm harness lane diffs stay under `src/app/(dev)/landing-harness/**` (+ process relevant-files docs). Run typecheck, scoped biome on `landing-harness/`, harness tests. Browser-verify on a unique port: `/landing-harness` shows Wave A + Wave B wired markers with placeholders only for header / capability / youi. Production `/` ownership stays with Wave C (`LandingPage` compose) — harness lanes must not revert production-home regression expectations. Restore `next-env.d.ts` if `bun run dev` rewrites it.
- Homepage image sources: prefer `docs/temp/images/`, else walk up from the
  checkout looking for a sibling `images/` directory (worktrees need several
  `..` hops). Stage with `bun ./scripts/stage-homepage-assets.ts`; consumers use
  `landingHomeAssets` / `/home/...`. When sources are absent the script still
  creates/leaves `public/home/` without failing the chassis.
