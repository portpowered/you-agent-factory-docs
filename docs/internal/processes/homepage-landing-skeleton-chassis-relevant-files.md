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
| `src/app/(dev)/landing-harness/page.tsx` | Production-gated harness (`ENABLE_COMPONENT_EXAMPLES` / `notFound`); spreads `composeWaveALandingHarnessSlots()` + `composeWaveBLandingHarnessSlots()` so wired Wave A/B slots receive fixture fills; remaining unwired slots stay placeholders |
| `src/app/(dev)/landing-harness/compose-wave-a-slots.tsx` | Thin compose helpers + `composeWaveALandingHarnessSlots()` / `WIRED_WAVE_A_SLOTS`: map `fixtureLandingPageData` onto public Wave A prop contracts only (no new schemas; no Wave B content trees); `artSrc` → optional `<img>` ReactNode for SiteFooter; whale `bubbles` → section `items` with `WHALE_BUBBLES_FIXTURE_*` fallback; hero soft-wires `cta.installCommand` / carousel `command` → Terminal `lines` |
| `src/app/(dev)/landing-harness/compose-wave-b-slots.tsx` | Thin Wave B compose helpers + `composeWaveBLandingHarnessSlots()` / `WIRED_WAVE_B_SLOTS`: map fixture carousel slides onto public `FactoryCarousel` / `FactorySlideData` (`id`/`title`/`blurb`/`command`; preserve caller-owned `art` ReactNode only); map fixture FAQ items onto public `FaqPanel` / `FaqPanelItem` (`id`/`question`/`answer`) with harness-local `heading="FAQ"`; map fixture CTA (`headline`/`supporting`/`installCommand`) onto public `CtaBand` with faq-cta-harness defaults for `ctaLabel`/`ctaHref` (do not extend `LandingCtaContent`). Wired: carousel + faq + cta |
| `src/app/(dev)/landing-harness/page.test.tsx` | Observable harness proofs: Wave A + Wave B wired together (footer/whale/hero + carousel/faq/cta markers + fixture content); placeholders only for remaining unwired slots (header/capability/youi); absence of still-unwired fixture trees |
| `public/home/` | Reserved homepage asset root (`/home/...` URLs) |
| `scripts/stage-homepage-assets.ts` | Copy/optimize planner or sibling `images/` sources into `public/home/` (no-op leave-empty when sources absent) |

## Production home (do not flip)

| File | Role |
| --- | --- |
| `src/app/(site)/page.tsx` / `site-renderers.tsx` `renderHomePage` | Live `/` still serves DocsPage + HomeArticle; do not DocsPage-bypass `/` in Wave A fill while Header remains a placeholder |
| `src/app/(site)/production-home-landing-untouched.test.tsx` | Regression: `renderHomePage` composes `HomeArticle`, does not mount `LandingPage`, and HTML has docs-home markers without Wave A/B landing fills (`data-landing-page`, SiteFooter, whale/sphere/hero harness markers, FactoryCarousel / FaqPanel / CtaBand). Owned by production flip / prior integrate — harness Wave B lanes must not edit this file |

## Patterns

- Whale theme knob names come from `docs/temp/homepage-2/motion-whale.md` (`initialScale`, `initialY`, `durationMs`, `ease`, `blurPx`, `viewAmount`, `bubbleDelayMs`, `parallaxFactor`).
- Sphere stub knobs: `particleCount`, `repulsion`, `radiusRatio` (workstreams W-sphere).
- Carousel stub knobs: depth neighbor scale/opacity + transition/drag thresholds (workstreams W-carousel).
- Feature lanes must not import unfinished sibling packages; chassis stubs stay self-contained.
- Match other `(dev)` harnesses: gate with `NODE_ENV === "production" && ENABLE_COMPONENT_EXAMPLES !== "1"` → `notFound()`.
- Worktree browser verify: when `node_modules` lives only in the main checkout, Turbopack may fail (`next` not resolvable / symlink out of root). Prefer `bun ./scripts/run-next.ts dev --webpack -p <unique-port>` for local harness checks; do not leave the server running.
- Keep production `/` on the current docs home until Header+Hero+Footer are all non-placeholder (Header is Wave B). Quality gate for W-integrate Wave A fill: typecheck + lint + landing-harness + production-home regression tests + browser proof that `/` stays docs home and `/landing-harness` shows wired Wave A fills.
- W-integrate Wave A fill: compose only public exports (`SiteFooter`, `WhaleBubblesSection`, `ParticleSphere` from components path, optional `Terminal` from `@/features/code`) into LandingPage slots on landing-harness via `composeWaveALandingHarnessSlots()` (returns only `WIRED_WAVE_A_SLOTS`). Map fixture fields at compose time; omit fixture-only extras (`meta.tagline`); map whale `bubbles` → `items` (fallback `WHALE_BUBBLES_FIXTURE_*`); map `cta.installCommand` + distinct carousel `command` strings → Terminal `lines` (omit Terminal when empty). Do not invent footer/content schemas, mount Wave B fixture trees for unwired slots, relocate `src/components/home`, rewrite Wave B internals, mix page-formatting/SEO/graph-pages chrome, or flip production `/` while Header remains a placeholder. Reduced-motion remains inside ParticleSphere / WhalePlate — harness wiring must not force animated-only paths.
- W-integrate Wave B fill (batch-004, harness-only while production flip-003 owns `/`): add sibling `compose-wave-b-slots.tsx` and merge with Wave A on `landing-harness/page.tsx`. Map `fixtureLandingPageData.carousel.slides` onto public `FactoryCarousel` props only (`id`/`title`/`blurb`/`command`; keep optional `art` only when already a ReactNode). Map `fixtureLandingPageData.faq.items` onto public `FaqPanel` props (`id`/`question`/`answer`; harness-local `heading="FAQ"` matching faq-cta-harness — do not invent FAQ schemas). Map `fixtureLandingPageData.cta` (`headline`/`supporting`/`installCommand`) onto public `CtaBand` with harness-local `ctaLabel="Install the CLI"` / `ctaHref="/docs/guides"` from faq-cta-harness — do not extend `LandingCtaContent`. Do **not** edit production compose / site-renderers / production-home tests; do not relocate `src/components/home`; do not rewrite FactoryCarousel / FaqPanel / CtaBand internals. Leave header / capability / youi as placeholders until their stories wire them. Reduced-motion stays inside FactoryCarousel (`data-carousel-motion`); prove harness wiring with compose client tests under a `matchMedia("(prefers-reduced-motion: reduce)")` stub (`static` vs `depth`) — do not rewrite carousel internals.
- Wave B integrate closeout (batch-004 quality gate): confirm branch diff stays under `src/app/(dev)/landing-harness/**` (+ process relevant-files docs). Run typecheck, scoped biome on `landing-harness/`, harness + `production-home-landing-untouched` tests. Browser-verify on a unique port: `/` has no `data-landing-page` / FactoryCarousel / FaqPanel / CtaBand markers; `/landing-harness` shows Wave A + Wave B wired markers with placeholders only for header / capability / youi. Restore `next-env.d.ts` if `bun run dev` rewrites it.
- Homepage image sources: prefer `docs/temp/images/`, else walk up from the
  checkout looking for a sibling `images/` directory (worktrees need several
  `..` hops). Stage with `bun ./scripts/stage-homepage-assets.ts`; consumers use
  `landingHomeAssets` / `/home/...`. When sources are absent the script still
  creates/leaves `public/home/` without failing the chassis.
