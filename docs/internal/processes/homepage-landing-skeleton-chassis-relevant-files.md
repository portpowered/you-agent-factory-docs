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
| `src/app/(dev)/landing-harness/page.tsx` | Production-gated harness (`ENABLE_COMPONENT_EXAMPLES` / `notFound`); Wave A integrate fills wired slots (footer → `SiteFooter`, whaleBubbles → `WhaleBubblesSection`) while unwired slots stay placeholders |
| `src/app/(dev)/landing-harness/compose-wave-a-slots.tsx` | Thin compose helpers: map `fixtureLandingPageData` onto public Wave A prop contracts (no new schemas); `artSrc` → optional `<img>` ReactNode for SiteFooter; whale `bubbles` → section `items` with `WHALE_BUBBLES_FIXTURE_*` fallback |
| `public/home/` | Reserved homepage asset root (`/home/...` URLs) |
| `scripts/stage-homepage-assets.ts` | Copy/optimize planner or sibling `images/` sources into `public/home/` (no-op leave-empty when sources absent) |

## Production home (do not flip)

| File | Role |
| --- | --- |
| `src/app/(site)/page.tsx` / `site-renderers.tsx` `renderHomePage` | Live `/` still serves DocsPage + HomeArticle; W-integrate owns LandingPage swap |
| `src/app/(site)/production-home-landing-untouched.test.tsx` | Regression: `renderHomePage` must not emit `data-landing-page` / placeholders |

## Patterns

- Whale theme knob names come from `docs/temp/homepage-2/motion-whale.md` (`initialScale`, `initialY`, `durationMs`, `ease`, `blurPx`, `viewAmount`, `bubbleDelayMs`, `parallaxFactor`).
- Sphere stub knobs: `particleCount`, `repulsion`, `radiusRatio` (workstreams W-sphere).
- Carousel stub knobs: depth neighbor scale/opacity + transition/drag thresholds (workstreams W-carousel).
- Feature lanes must not import unfinished sibling packages; chassis stubs stay self-contained.
- Match other `(dev)` harnesses: gate with `NODE_ENV === "production" && ENABLE_COMPONENT_EXAMPLES !== "1"` → `notFound()`.
- Worktree browser verify: when `node_modules` lives only in the main checkout, Turbopack may fail (`next` not resolvable / symlink out of root). Prefer `bun ./scripts/run-next.ts dev --webpack -p <unique-port>` for local harness checks; do not leave the server running.
- Keep production `/` on the current docs home until W-integrate swaps slots. Quality gate for W-skeleton: typecheck + lint + landing-page/harness tests + browser proof that `/` has no `data-landing-page`.
- W-integrate Wave A fill: compose only public exports (`SiteFooter`, `WhaleBubblesSection`, later sphere) into LandingPage slots on landing-harness. Map fixture fields at compose time; omit fixture-only extras (`meta.tagline`); map whale `bubbles` → `items` (fallback `WHALE_BUBBLES_FIXTURE_*`). Do not invent footer/content schemas or flip production `/` while Header remains a placeholder.
- Homepage image sources: prefer `docs/temp/images/`, else walk up from the
  checkout looking for a sibling `images/` directory (worktrees need several
  `..` hops). Stage with `bun ./scripts/stage-homepage-assets.ts`; consumers use
  `landingHomeAssets` / `/home/...`. When sources are absent the script still
  creates/leaves `public/home/` without failing the chassis.
