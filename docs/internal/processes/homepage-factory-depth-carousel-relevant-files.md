# Homepage factory depth carousel — relevant files

Use these files when working on Homepage-2 **W-carousel** (Wave B):
`FactorySlide` / `FactoryCarousel`, Terminal command chrome, depth motion,
navigation, reduced-motion, and the gated carousel harness. Do **not** flip
production `/`, rewrite LandingPage slot wiring, or edit hero art / FAQ / CTA /
header / whale / sphere / SiteFooter here — those belong to sibling lanes or
W-integrate.

Control docs live under planner-local `docs/temp/homepage-2/` (gitignored):
`README.md`, `workstreams.md`, `contracts.md`.

## Slide + carousel components

| File | Role |
| --- | --- |
| `src/features/landing-page/components/FactorySlide.tsx` | One slide: `{ id, title, blurb, command, art?: ReactNode }` + real `Terminal` from `@/features/code` |
| `src/features/landing-page/components/FactorySlide.test.tsx` | Title/blurb/Terminal render; optional art omit; empty/whitespace command still mounts chrome |
| `src/features/landing-page/components/FactoryCarousel.tsx` | Depth carousel + wrap nav; `prefers-reduced-motion` → static active-only (`data-carousel-motion`) |
| `src/features/landing-page/components/FactoryCarousel.test.tsx` | Depth markers; nav; matchMedia reduce vs no-preference; reduced-motion buttons/keyboard |
| `src/features/landing-page/landing-page.data.ts` | Re-exports `FactorySlideData` from FactorySlide; fixture slides omit `art` |
| `src/features/landing-page/index.ts` | Public barrel: exports `FactoryCarousel`, `FactorySlide`, slide types (+ FAQ/CTA + whale-bubbles + hero-art). On rebase onto `main`, keep **all** sibling-lane exports and the carousel exports — do not drop `CtaBand` / `FaqPanel` / header / footer art / `CapabilityStrip` / `HeroPortrait` / `HeroSection` / `TornEdge` / `YouiShowcase`. |
| `src/features/code/Terminal.tsx` | Command chrome (`lines`, optional `chips`, `install` \| `dark`) — prefer this over stubs |
| `src/app/(dev)/factory-carousel-harness/` | Gated carousel-only harness (gate + view + page); 4 fixture slides on neutral bg |

## Patterns

- Locked slide shape matches homepage-2 contracts; do not invent CMS/message-pack
  schemas. Decorative `art` is caller-owned (`ReactNode`), same pattern as
  SiteFooter.
- Empty / whitespace-only `command` still mounts `Terminal` with a stable empty
  line (`lines={[""]}`) so chrome does not crash.
- Import Terminal from `@/features/code` (Wave A merged). Local TerminalStub only
  if the import would otherwise block.
- Own only `FactoryCarousel*` / `FactorySlide*` under
  `src/features/landing-page/components/` plus
  `(dev)/factory-carousel-harness`. Export from `landing-page/index.ts` for
  skeleton integrate. Gate with `isFactoryCarouselHarnessEnabled` (same rule as
  sphere / component-examples). Do not expand closed component-examples
  inventory unless required.
- Chassis carousel theme knobs live in `landing-page.theme.ts`
  (`activeScale`, `neighborScale`, `neighborOpacity`, `farScale`, `farOpacity`,
  `transitionMs`, `dragThresholdPx`). `getCarouselSlideDepth(index, activeIndex,
  theme)` maps distance → `active` / `neighbor` / `far` with scale, opacity, z,
  and translateX. DOM hooks: `data-carousel-slide`, `data-carousel-depth`,
  `data-active`.
- Navigation wraps via `wrapCarouselIndex`. Controls: `data-carousel-prev` /
  `data-carousel-next` (accessible names "Previous slide" / "Next slide"),
  ArrowLeft/ArrowRight on the focused carousel region (`tabIndex={0}`), and
  pointer drag on `data-carousel-track` using `theme.dragThresholdPx` (drag
  right → previous, drag left → next). Optional `onActiveIndexChange` for
  controlled parents.
- Reduced motion: subscribe to `matchMedia("(prefers-reduced-motion: reduce)")`
  (WhalePlate-style). When matched, `data-carousel-motion="static"` and only the
  active slide mounts (no neighbor scale/translate). Otherwise
  `data-carousel-motion="depth"`. Buttons/keyboard/drag still change the index.
- `slides: []` renders a stable empty region (`data-carousel-empty`) — no throw.
- Worktree browser verify: when `node_modules` is hoisted at the main checkout,
  prefer `bun ./scripts/run-next.ts dev --webpack -p <unique-port>`; always trap
  and kill the server.
