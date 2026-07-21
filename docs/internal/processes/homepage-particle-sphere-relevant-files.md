# Homepage ParticleSphere (W-sphere) — relevant files

Use these files when owning the Canvas 2D particle sphere lane for homepage-2
(Wave A / W-sphere). Do **not** touch whale/bubbles, carousel, hero art,
`LandingPage` slot wiring, or production `/` from this lane.

## Component + simulation

| File | Role |
| --- | --- |
| `src/features/landing-page/components/ParticleSphere.tsx` | Public `<ParticleSphere className? />`; Canvas 2D host; reduced-motion gate |
| `src/features/landing-page/components/particle-sphere.theme.ts` | Typed local particle-count / repulsion knobs (fallback until shared landing theme exists) |
| `src/features/landing-page/components/particle-sphere-simulation.ts` | Pure fibonacci + repulsion math (no React/DOM) |
| `src/features/landing-page/components/ParticleSphere.test.tsx` | Knob density/separation + reduced-motion static vs animated markers |

## Dev harness

| File | Role |
| --- | --- |
| `src/app/(dev)/sphere-harness/page.tsx` | Gated route: `notFound()` in production unless `ENABLE_COMPONENT_EXAMPLES=1` |
| `src/app/(dev)/sphere-harness/sphere-harness-gate.ts` | Pure enable check (mirrors component-examples / reference-chrome-harness) |
| `src/app/(dev)/sphere-harness/sphere-harness-view.tsx` | Fixed-square sphere-only shell (`data-sphere-harness`) |
| `src/app/(dev)/sphere-harness/*.test.*` | Gate + harness composition tests |

## Patterns

- Keep sphere math pure; React/canvas IO stays in `ParticleSphere.tsx`.
- Prefer `aria-hidden` on the host wrapper, not the `<canvas>` (biome `noAriaHiddenOnFocusable`).
- Observable markers: `data-particle-sphere`, `data-particle-sphere-motion` (`static` \| `animated`), theme data attrs.
- Local worktree `bun run dev` may need `--webpack` when Turbopack mis-infers the monorepo root; harness URL is `/sphere-harness`.
- No landing-page components barrel yet — export from `ParticleSphere.tsx` only; do not invent a package schema.
