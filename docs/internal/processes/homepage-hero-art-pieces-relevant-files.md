# Homepage hero art pieces (W-hero-art) — relevant files

Use these files when owning Homepage-2 **W-hero-art** (Wave B): TornEdge,
HeroPortrait, CapabilityStrip, YouiShowcase, optional HeroSection chrome, and
the production-gated `(dev)/hero-art-harness`. Do **not** own carousel,
FAQ/CTA/header, whale, SiteFooter package, HY-home (`src/features/home/**`),
or production `/`.

Control docs live under planner-local `docs/temp/homepage-2/` (gitignored).

## Owned components

| File | Role |
| --- | --- |
| `src/features/landing-page/components/TornEdge.tsx` | Reusable section-edge strip (`placement` / `className` / optional `src`) |
| `src/features/landing-page/components/HeroPortrait.tsx` | Woman-head portrait with constrained `sizes` (not bare `100vw`) |
| `src/features/landing-page/components/CapabilityStrip.tsx` | FLOWS / AGENTS / ENTRY / OS label strip from fixture items |
| `src/features/landing-page/components/YouiShowcase.tsx` | Monkey bg + fixed content/foreground geometry + semantic static graph fallback (`data-youi-showcase-graph-fallback`); optional `replayIsland` slot for compact goal replay without dropping SSR fallback |
| `src/features/landing-page/components/YouiCompactGoalReplayIsland.tsx` | Landing-owned client island: literal import of `goal.factory-recording.v1.json` only + shared `ControlledFactoryReplay` (`mode="compact"`); no Work progress / no second autoplay stack |
| `src/features/landing-page/components/YouiCompactGoalReplayNearViewport.tsx` | Intersection-gated loader: literal `import("./YouiCompactGoalReplayIsland")` near the viewport; empty host until activation so SSR static fallback stays visible |
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
- Youi SSR shell: export `YOUI_SHOWCASE_CONTENT_CLASSNAME` / `YOUI_SHOWCASE_FOREGROUND_CLASSNAME` so clamped min-height + constrained foreground host stay locked; keep `data-youi-showcase-graph-fallback` in delivered HTML until a client `replayIsland` is active; empty optional srcs still keep the content host.
- Youi compact goal replay: own a landing client island that literally imports only `goal.factory-recording.v1.json` and mounts `@/features/factory-replay` `ControlledFactoryReplay` with `mode="compact"`. Do not import other `*.factory-recording.v1.json` modules, `generated/index.json`, raw JS source artifacts, or generators. Do not edit `src/features/factory-replay/**`. Wire via `composeProductionYouiSlot` → `replayIsland={<YouiCompactGoalReplayNearViewport />}` so the literal client import activates near the viewport; keep `data-youi-showcase-graph-fallback` in HTML until activation / for no-JS.
- Sphere/terminal: pass ReactNode holes into `HeroSection` — never re-implement ParticleSphere Canvas or Terminal chrome in this lane.
- Match other `(dev)` harnesses: gate with `NODE_ENV === "production" && ENABLE_COMPONENT_EXAMPLES !== "1"` → `notFound()`.
- Worktree browser verify: when `node_modules` lives only in the main checkout, prefer `bun ./scripts/run-next.ts dev --webpack -p <unique-port>`; kill the server before exit. Harness URL is `/hero-art-harness`.
- Keep production `/` and `src/features/home/**` untouched.
