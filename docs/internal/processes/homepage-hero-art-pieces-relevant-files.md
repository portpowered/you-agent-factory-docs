# Homepage hero art pieces (W-hero-art) — relevant files

Use these files when owning Homepage-2 **W-hero-art** (Wave B): TornEdge,
HeroPortrait, CapabilityStrip, YouiShowcase, optional HeroSection chrome, and
the production-gated `(dev)/hero-art-harness`. Do **not** own carousel,
FAQ/CTA/header, whale, SiteFooter package, HY-home (`src/components/home/**`),
or production `/`.

Control docs live under planner-local `docs/temp/homepage-2/` (gitignored).

## Owned components

| File | Role |
| --- | --- |
| `src/features/landing-page/components/TornEdge.tsx` | Reusable section-edge strip (`placement` / `className` / optional `src`) |
| `src/features/landing-page/components/HeroPortrait.tsx` | Woman-head portrait with constrained `sizes` (not bare `100vw`) |
| `src/features/landing-page/components/CapabilityStrip.tsx` | FLOWS / AGENTS / ENTRY / OS label strip from fixture items |
| `src/features/landing-page/components/YouiShowcase.tsx` | Monkey bg + factory graph UI with explicit sizes |
| `src/features/landing-page/components/HeroSection.tsx` | Optional static chrome: portrait + `sphere` / `terminal` ReactNode holes |

## Public exports + harness

| File | Role |
| --- | --- |
| `src/features/landing-page/index.ts` | Public barrel: re-exports hero-art APIs alongside whale/bubbles |
| `src/app/(dev)/hero-art-harness/page.tsx` | Production-gated route (`ENABLE_COMPONENT_EXAMPLES` / `notFound`) |
| `src/app/(dev)/hero-art-harness/hero-art-harness-view.tsx` | Stacked art on `bg-neutral-100`; TornEdge in two places |

## Patterns

- Prefer `landingHomeAssets` defaults with optional `src` overrides; land art on plain `<img>` + explicit `sizes` (static export uses `images.unoptimized`).
- Presentational edges / backgrounds: `aria-hidden="true"`; keep stable `data-*` hooks for harness/unit tests.
- Sphere/terminal: pass ReactNode holes into `HeroSection` — never re-implement ParticleSphere Canvas or Terminal chrome in this lane.
- Match other `(dev)` harnesses: gate with `NODE_ENV === "production" && ENABLE_COMPONENT_EXAMPLES !== "1"` → `notFound()`.
- Worktree browser verify: when `node_modules` lives only in the main checkout, prefer `bun ./scripts/run-next.ts dev --webpack -p <unique-port>`; kill the server before exit. Harness URL is `/hero-art-harness`.
- Keep production `/` and `src/components/home/**` untouched.
