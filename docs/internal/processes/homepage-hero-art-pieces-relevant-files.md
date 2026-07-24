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
| `src/features/landing-page/youi-landing-import-graph.ts` | Bun metafile collector + pure forbidden-marker classification for home/landing Youi client ownership (allows goal recording + shared factory-replay; forbids non-goal recordings / `generated/index.json` / `.source.json` / generator) |
| `src/features/landing-page/youi-landing-import-graph.polluted-fixture.ts` | Test-only deliberately polluted entry (non-goal recording + index corpus + source artifact) for positive-control detector coverage |
| `src/features/landing-page/youi-landing-import-graph.test.ts` | Focused import-graph isolation proofs for near-viewport gate + island ownership entrypoints |
| `src/features/landing-page/youi-compact-goal-replay-browser-contract.ts` | Pure classifier for home-route Youi compact goal replay browser evidence (pre-activation shell, near-viewport activation, Play/Pause) |
| `src/features/landing-page/youi-compact-goal-replay-browser-contract.test.ts` | Always-on unit coverage for the browser evidence classifier |
| `src/features/landing-page/assert-youi-compact-goal-replay-browser.ts` | Playwright home-route probe: fallback before activation, near-viewport island mount, topology + Play/Pause + tick/timeline chrome |
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
- Prove home client import isolation with Bun.build `metafile` inputs from `YouiCompactGoalReplayNearViewport.tsx` / `YouiCompactGoalReplayIsland.tsx`, then classify forbidden markers (non-goal `*.factory-recording.v1.json`, `generated/index.json`, `.source.json`, `generate-packaged-factories-index`). Allow the goal recording and shared `src/features/factory-replay` / visualizer package edges. Keep classification pure; keep bundling in the collector. Externalize React/Next plus `clsx` / `tailwind-merge` / `@you-agent-factory/{client,factory-replay,factory-visualizers}` so the graph stays ownership-focused and avoids flaky concurrent `node_modules` reads. Include a deliberately polluted fixture entry so the detector is not a no-op.
- Home Youi compact goal replay browser close-out: keep a pure evidence classifier (`youi-compact-goal-replay-browser-contract.ts`) and run `bun src/features/landing-page/assert-youi-compact-goal-replay-browser.ts` against `/`. Prefer a static-export base (`make build`, then serve `out/` and set `YOUI_COMPACT_GOAL_REPLAY_PROBE_BASE_URL`) — worktree `next dev` with parent-hoisted `node_modules` can SSR the markers but fail to hydrate client islands. Probe must prove (1) monkey + fixed geometry + static fallback before activation with no island, (2) near-viewport activation mounts compact goal replay with topology + Play/Pause + tick/timeline chrome, (3) Play/Pause toggles `data-playing` while tick/timeline labels stay visible. Goal sample is single-tick — do not invent a second recording. Do not edit `src/features/factory-replay/**`.
- Sphere/terminal: pass ReactNode holes into `HeroSection` — never re-implement ParticleSphere Canvas or Terminal chrome in this lane.
- Match other `(dev)` harnesses: gate with `NODE_ENV === "production" && ENABLE_COMPONENT_EXAMPLES !== "1"` → `notFound()`.
- Worktree browser verify: when `node_modules` lives only in the main checkout, prefer `bun ./scripts/run-next.ts dev --webpack -p <unique-port>` for harness checks; for home `/` Youi replay close-out prefer static `out/` via `assert-youi-compact-goal-replay-browser.ts`. Kill servers before exit. Harness URL is `/hero-art-harness`.
- Keep production `/` and `src/features/home/**` untouched.
