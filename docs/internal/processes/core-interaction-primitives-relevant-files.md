# Core interaction primitives — relevant files

## Shared contracts

- `src/components/ui/button.tsx` remains the shared CTA primitive; homepage, shell, and future docs examples should consume its tokenized `variant` and `size` contract instead of restyling anchors or buttons locally.
- `src/components/ui/selector.tsx` implements the typed selector contract with native radio inputs, so interactive docs examples can keep keyboard behavior and explicit selected state without inventing page-local button groups.
- `src/components/ui/checkbox.tsx` pairs native checkbox semantics with shared helper and error-message slots; use it when docs examples need reviewer-verifiable boolean state plus validation feedback.
- `src/components/ui/notice.tsx` exposes `Banner` and `Alert` as status primitives with explicit titles and icon-backed meaning so status communication does not rely on color alone.
- `src/components/ui/icon.tsx` is the narrow icon surface for the ported UI system; prefer extending its named glyph set over scattering ad hoc inline SVG markup through pages.

## Token hooks and styling

- `src/components/ui/factory-theme.ts` now exports `getNoticeClassName` and the notice-tone contract alongside button and surface tokens; new primitive variants should reuse these helpers before adding one-off palette logic.
- `src/app/globals.css` owns the `ui-selector__*`, `ui-checkbox__*`, `ui-notice__*`, and `ui-icon` classes. Keep repeated control styling there so components stay typed and readable while the token grammar stays centralized.

## Demo consumer and verification

- `src/components/landing/primitives-showcase.tsx` is the current integration surface that proves the primitives work together with explicit success, disabled, and blocking states.
- `tests/unit/ui-primitives.test.tsx` covers the primitives directly at the component layer; `tests/unit/primitives-showcase.test.tsx` proves the homepage-facing integration and state transitions.
- Because component coverage is enforced across all `src/components/**/*.{ts,tsx}` files, every new shared primitive needs focused tests immediately or `bun run component-coverage` will regress.

## Dialog and overlay behavior

- `src/components/ui/dialog.tsx` is the shared overlay primitive for docs-native modal surfaces; keep open state controlled by the parent and preserve keyboard dismissal and focus return inside the primitive instead of reimplementing them per page.
- Dialog demos should keep fixture-state meaning in authored props or localized copy, then render loading, empty, error, and success bodies explicitly inside the overlay rather than closing or rendering nothing when state changes.
