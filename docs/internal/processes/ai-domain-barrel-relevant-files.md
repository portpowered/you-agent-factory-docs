# AI domain barrel — relevant files

## Status

`src/features/ai` is deleted. Do not reintroduce `@/features/ai` barrels,
empty retired namespaces (`models`, `topology`, `timeline`), or transitional
re-export stubs. Factory docs shell navigation uses
`src/lib/navigation/docs-sidebar-adapter.ts` instead.

## Historical context

Atlas feature packages that previously backed these barrels (`src/features/models`,
`src/features/topology`, `src/features/docs/timeline`, generation/training/roofline
explorers, and `src/features/graphs`) were deleted in `rewrite-delete-atlas-domain`.
The empty AI barrel package was removed in `delete-ai-content-infrastructure`.

## Shell consumers

- `src/app/(site)/site-renderers.tsx` — no longer imports AI timeline/topology explorers.
- `src/lib/content/mdx-components.tsx` / `blog-mdx-components.tsx` — no longer register Atlas explorer MDX components.
- `src/lib/navigation/docs-sidebar-adapter.ts` — neutrally named factory-docs sidebar/page-tree wiring.

## Conventions

- Prefer deleting Atlas explorer packages and AI domain barrels over leaving stub re-exports.
- Keep `src/features/ai/` in website-test exclusion lists only as a reintroduction guard, not as a live package path.

## Verification

- No runtime or test import should resolve `@/features/ai` (or `@/features/ai/*`).
- Docs sidebar/page-tree proofs live under `src/lib/navigation/docs-sidebar-adapter*.test.ts`.
