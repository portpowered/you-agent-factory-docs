# Bento-card presentation components — relevant files

## Shared contracts

- `src/components/ui/bento-card.tsx` is the reusable bento presentation surface for dense docs-homepage content; keep authored meaning in typed props such as `title`, `description`, `eyebrow`, `meta`, and `action` instead of page-local wrapper markup.
- `BentoCard` builds on the shared `Card` and `ButtonLink` primitives, so new bento-style content should inherit the existing token-backed surface, spacing, and control variants rather than introducing a second card or CTA contract.
- `BentoGrid` is the narrow responsive layout wrapper for bento surfaces. Reuse it when a page needs stacked-on-mobile and multi-column-on-tablet dense content cards without scattering custom grid classes through feature code.

## Styling and responsive behavior

- `src/app/globals.css` owns the `ui-bento-*` classes. Keep the shared bento layout, eyebrow, metadata pill, and footer responsiveness there so the React components stay content-driven and typed.
- The current contract is one column by default, two columns from `48rem`, and optional `span="feature"` cards that widen across both columns on wider viewports. Prefer this span-based contract over hard-coded page-specific column math.
- Optional footer regions must disappear cleanly when metadata or actions are absent; do not render empty separators or placeholder wrappers just to preserve symmetry.

## Current homepage integration and verification

- `src/components/landing/landing-shell.tsx` is the reviewer-visible integration surface for story `you-agent-factory-ui-portover-004`; the example workflow and differentiation sections now prove the bento cards on the homepage.
- `src/lib/landing-content.ts` holds the authored bento content. Keep homepage-only workflow metadata and CTA labels there unless the same copy is genuinely reused across docs-shell surfaces.
- `tests/unit/bento-card.test.tsx` covers the shared component contract directly, while `tests/unit/homepage-shell.test.tsx` proves the homepage composition, accessible headings, and token reuse.
- Because this surface renders on the homepage, always re-run `bun run component-coverage` and the full `bun run quality-gate`; bento additions can regress both component coverage and the export-size budget.
