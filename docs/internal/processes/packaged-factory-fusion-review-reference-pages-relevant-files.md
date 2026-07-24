# Packaged Factory Fusion and Review Reference Pages Relevant Files

Use these files when authoring the nested fusion and review child reference
pages under `/docs/references/packaged-factories-index/{fusion,review}`.

## Ownership fence

This lane owns:

- child page bundles under
  `src/content/docs/references/packaged-factories-index/fusion/` and
  `…/review/` (`page.mdx`, `messages/en.json`, `assets.json`, child-owned
  `page-mdx-components.tsx` / thin replay wrappers)
- matching reference registry records with multi-segment slugs
  `packaged-factories-index/fusion` and `packaged-factories-index/review`
- the two literal loader cases for those nested slugs in
  `src/lib/content/route-family-local-docs-page-load.ts`
- focused child page / recording-isolation tests

Do **not** modify sibling child page bodies (goal, subagent, quorum, tts,
deep-research), parent index renderer behavior, shared `factory-replay`
internals beyond consuming the public API, generated corpus regeneration,
landing composition, dependency pins, or global CSS.

## Key files (story 001 — fusion child reference content)

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/fusion/page.mdx` | Concise nested reference: canonical name, one-sentence description, invocation examples, operational notes, parent definition link |
| `src/content/docs/references/packaged-factories-index/fusion/messages/en.json` | Local messages for the fusion child surface |
| `src/content/docs/references/packaged-factories-index/fusion/assets.json` | Empty local asset config |
| `src/content/registry/references/packaged-factories-index/fusion.json` | Registry id `reference.packaged-factories-index-fusion`, slug `packaged-factories-index/fusion` |
| `src/lib/content/registry.ts` | Recursive kind-directory walk so multi-segment slug files load (skips `messages/`) |
| `src/content/docs/references/packaged-factories-index/fusion/fusion-page.test.tsx` | Route + concise content publish proofs |

## Key files (story 002 — fusion-only full-mode replay)

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/fusion/FusionFactoryReplay.tsx` | Client mount: `ControlledFactoryReplay` `mode="full"` with only `generated/fusion.factory-recording.v1.json` |
| `src/content/docs/references/packaged-factories-index/fusion/page-mdx-components.tsx` | Fusion-owned MDX map exporting `FusionFactoryReplay` |
| `src/lib/content/route-family-local-docs-page-load.ts` | `packaged-factories-index/fusion` case literal-imports the fusion-owned map (not shared `replay-page-mdx-components`) |
| `src/content/docs/references/packaged-factories-index/fusion/fusion-import-graph.ts` | Pure forbidden-marker classification for the fusion ownership surface |
| `src/content/docs/references/packaged-factories-index/fusion/fusion-import-graph.test.ts` | Bun.build reachability: fusion recording only; no sibling recordings / generator / parent renderer |
| `src/content/docs/references/packaged-factories-index/packaged-factories-index-child-maps.test.ts` | Asserts fusion resolves fusion-owned map; remaining standard children keep the shared placeholder |
| `src/content/docs/references/packaged-factories-index/fusion/assert-fusion-child-reference-browser.ts` | Browser markers for concise content + `data-factory-replay-mode="full"` |

## Key files (story 003 — review child reference content)

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/review/page.mdx` | Concise nested reference: canonical name, one-sentence description, invocation examples, operational notes, parent definition link (no replay yet) |
| `src/content/docs/references/packaged-factories-index/review/messages/en.json` | Local messages for the review child surface |
| `src/content/docs/references/packaged-factories-index/review/assets.json` | Empty local asset config |
| `src/content/registry/references/packaged-factories-index/review.json` | Registry id `reference.packaged-factories-index-review`, slug `packaged-factories-index/review` |
| `src/content/docs/references/packaged-factories-index/review/review-page.test.tsx` | Route + concise content publish proofs |
| `src/content/docs/references/packaged-factories-index/review/assert-review-child-reference-browser.ts` | Browser markers for concise content (story 003; no replay markers yet) |
| `src/lib/content/route-family-local-docs-page-load.ts` | `packaged-factories-index/review` still resolves shared empty `replay-page-mdx-components` until story 004 |

## Patterns

- Nested packaged-factory child pages are ordinary local-docs reference bundles
  under the parent directory. Keep copy concise: no workflow teaching and no
  unabridged `factory.json` on the child. Fusion/review lanes include a short
  package-specific operational-notes section; goal/subagent lanes intentionally
  omit that section.
- Story 003 is content-only for review: leave the shared
  `replay-page-mdx-components` loader case until story 004 adds a child-owned
  map + replay mount.
- Put the visible canonical name under `links.canonicalName` (and
  `<T k="links.canonicalName" />`). Top-level custom message keys are stripped
  by `pageMessagesSchema`.
- Registry multi-segment slugs map to nested files under the kind directory
  (`references/packaged-factories-index/fusion.json` for slug
  `packaged-factories-index/fusion`). The registry loader must walk nested kind
  directories and must skip colocated `messages/` trees.
- Parent definition links use the stable child-slug anchor already emitted by
  the generated parent (`/docs/references/packaged-factories-index#fusion`).
  Prefer `LocalizedLinkList` so GitHub Pages `basePath` prefixes correctly.
- **Recording isolation:** each replay child owns its MDX map under the child
  directory and statically imports only that child’s
  `generated/<slug>.factory-recording.v1.json`. Never put packaged-factory
  recordings into the shared `replay-page-mdx-components.tsx` placeholder —
  that module is still loaded by sibling standard-replay loader cases.
- Prefer `ControlledFactoryReplay` with `mode="full"` from
  `@/features/factory-replay`. Do not use `FactoryRecordingTopologyReplay`,
  corpus acquisition modules, or sibling recording JSON files.
- Fusion ownership import-graph proofs live under `fusion/` and reuse
  `collectParentImportGraphInputs` from `parent-import-graph.ts` for Bun.build
  metafile collection only — keep fusion-specific forbidden markers local.
- Worktree browser verify: `bun run dev -- --webpack -p <port>` (Turbopack
  cannot resolve hoisted parent `node_modules/next`).
