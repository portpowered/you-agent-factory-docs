# AI domain barrel — relevant files

## Namespace entry points

- `src/features/ai/index.ts` — re-exports empty retired namespaces (`models`, `topology`, `timeline`) plus the empty server surface.
- `src/features/ai/server.ts` — intentionally empty after Model Atlas explorer deletion (`export {}`).
- `src/features/ai/models.ts` — retired Model Atlas renderer namespace (`export {}`).
- `src/features/ai/topology.ts` — retired topology explorer namespace (`export {}`).
- `src/features/ai/timeline.ts` — retired ontology timeline namespace (`export {}`).

## Source domains

Atlas feature packages that previously backed these barrels (`src/features/models`,
`src/features/topology`, `src/features/docs/timeline`, generation/training/roofline
explorers, and `src/features/graphs`) were deleted in `rewrite-delete-atlas-domain`.
Do not reintroduce those packages through the AI barrel.

## Shell consumers

- `src/app/(site)/site-renderers.tsx` — no longer imports AI timeline/topology explorers.
- `src/lib/content/mdx-components.tsx` / `blog-mdx-components.tsx` — no longer register Atlas explorer MDX components.

## Conventions

- Keep retired `@/features/ai/<name>` paths as empty modules so transitional imports stay type-safe without re-exporting deleted code.
- Prefer deleting Atlas explorer packages over leaving stub renderers in the AI barrel.

## Verification

- `src/features/ai/ai-domain-import-surfaces.test.ts` — asserts retired namespaces export nothing and the server barrel no longer re-exports Atlas explorers.
