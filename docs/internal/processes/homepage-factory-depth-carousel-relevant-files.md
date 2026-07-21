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
| `src/features/landing-page/landing-page.data.ts` | Re-exports `FactorySlideData` from FactorySlide; fixture slides omit `art` |
| `src/features/code/Terminal.tsx` | Command chrome (`lines`, optional `chips`, `install` \| `dark`) — prefer this over stubs |

## Patterns

- Locked slide shape matches homepage-2 contracts; do not invent CMS/message-pack
  schemas. Decorative `art` is caller-owned (`ReactNode`), same pattern as
  SiteFooter.
- Empty / whitespace-only `command` still mounts `Terminal` with a stable empty
  line (`lines={[""]}`) so chrome does not crash.
- Import Terminal from `@/features/code` (Wave A merged). Local TerminalStub only
  if the import would otherwise block.
- Own only `FactoryCarousel*` / `FactorySlide*` under
  `src/features/landing-page/components/` plus a dedicated `(dev)/…-harness`
  (story 005). Do not expand closed component-examples inventory unless required.
- Chassis carousel theme knobs live in `landing-page.theme.ts`
  (`activeScale`, `neighborScale`, `neighborOpacity`, `farScale`, `farOpacity`,
  `transitionMs`, `dragThresholdPx`) for later depth/nav stories.
- Worktree browser verify: when `node_modules` is hoisted at the main checkout,
  prefer `bun ./scripts/run-next.ts dev --webpack -p <unique-port>`; always trap
  and kill the server.
