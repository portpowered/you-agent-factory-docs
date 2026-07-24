# Packaged Factory Quorum and TTS Reference Pages Relevant Files

Use these files when publishing the nested manually maintained child reference
pages for `@you/quorum` and `@you/tts` under
`/docs/references/packaged-factories-index/{quorum,tts}`.

## Ownership fence

This lane owns:

- child page bundles under
  `src/content/docs/references/packaged-factories-index/quorum/` and
  `.../tts/` (`page.mdx`, `messages/en.json`, `assets.json`, child-owned
  `page-mdx-components.tsx` / thin replay wrappers, focused tests)
- matching multi-segment reference registry records under
  `src/content/registry/references/packaged-factories-index/{quorum,tts}.json`
- the two literal loader cases for
  `packaged-factories-index/quorum` and `packaged-factories-index/tts` in
  `route-family-local-docs-page-load.ts` (retargeted to child-owned maps when
  mounting isolated recordings)

Do **not** modify sibling child page bodies (goal, subagent, fusion, review,
deep-research), parent index renderer behavior, shared factory-replay feature
internals beyond consuming the public API, Batch 2 `generated/` corpus
regeneration, landing composition, dependency pins, or global CSS.

## Key files (story 001 — quorum content)

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/quorum/page.mdx` | Concise nested quorum reference route |
| `src/content/docs/references/packaged-factories-index/quorum/messages/en.json` | Canonical name, description, examples labels, parallelism, parent link |
| `src/content/docs/references/packaged-factories-index/quorum/assets.json` | Empty local asset config |
| `src/content/docs/references/packaged-factories-index/quorum/quorum-page.test.tsx` | Route, registry, concise content, parent-link, full-mode replay proofs |
| `src/content/registry/references/packaged-factories-index/quorum.json` | Registry id `reference.packaged-factories-index-quorum`, slug `packaged-factories-index/quorum` |
| `src/lib/content/registry.ts` | Recursive registry directory load for multi-segment slug paths |
| `src/lib/content/validate-registry.ts` | Recursive path walk so nested registry JSON still validates |
| `src/content/docs/references/packaged-factories-index/generated/factories/quorum.factory.json` | Read-only source for invocation examples / parallelism facts |

## Key files (story 002 — quorum-only full-mode replay)

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/quorum/QuorumFactoryReplay.tsx` | Client mount: `ControlledFactoryReplay` `mode="full"` + quorum recording only |
| `src/content/docs/references/packaged-factories-index/quorum/page-mdx-components.tsx` | Quorum-owned MDX map exporting `QuorumFactoryReplay` |
| `src/lib/content/route-family-local-docs-page-load.ts` | Literal `packaged-factories-index/quorum` → quorum child map |
| `src/content/docs/references/packaged-factories-index/generated/quorum.factory-recording.v1.json` | Read-only Batch 2 quorum recording (imported only from quorum child) |
| `src/content/docs/references/packaged-factories-index/quorum/assert-quorum-child-reference-browser.ts` | Dev-server HTML probe for content + full-mode replay markers |
| `src/content/docs/references/packaged-factories-index/packaged-factories-index-child-maps.test.ts` | Loader identity: quorum → child map; remaining siblings stay on shared placeholder |

## Key files (story 003 — tts content)

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/tts/page.mdx` | Concise nested tts reference route |
| `src/content/docs/references/packaged-factories-index/tts/messages/en.json` | Canonical name, description, examples labels, resource note, parent link |
| `src/content/docs/references/packaged-factories-index/tts/assets.json` | Empty local asset config |
| `src/content/docs/references/packaged-factories-index/tts/tts-page.test.tsx` | Route, registry, concise content, parent-link, full-mode replay proofs |
| `src/content/registry/references/packaged-factories-index/tts.json` | Registry id `reference.packaged-factories-index-tts`, slug `packaged-factories-index/tts` |
| `src/content/docs/references/packaged-factories-index/generated/factories/tts.factory.json` | Read-only source for TTS operation / omnivoice resource facts (no packaged examples) |

## Key files (story 004 — tts-only full-mode replay)

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/tts/TtsFactoryReplay.tsx` | Client mount: `ControlledFactoryReplay` `mode="full"` + tts recording only |
| `src/content/docs/references/packaged-factories-index/tts/page-mdx-components.tsx` | Tts-owned MDX map exporting `TtsFactoryReplay` |
| `src/lib/content/route-family-local-docs-page-load.ts` | Literal `packaged-factories-index/tts` → tts child map |
| `src/content/docs/references/packaged-factories-index/generated/tts.factory-recording.v1.json` | Read-only Batch 2 tts recording (imported only from tts child) |
| `src/content/docs/references/packaged-factories-index/tts/assert-tts-child-reference-browser.ts` | Dev-server HTML probe for content + full-mode replay markers |
| `src/content/docs/references/packaged-factories-index/packaged-factories-index-child-maps.test.ts` | Loader identity: quorum/tts → child maps; remaining siblings stay on shared placeholder |

## Key files (story 005 — page behavior + recording isolation proofs)

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/child-recording-import-graph.ts` | Shared child helper on main (`ownedPackagedFactoryRecordingFilename` / `graphIncludesOwnedPackagedRecording` / local Bun collector) — do not land a parallel `allowed*` API |
| `src/content/docs/references/packaged-factories-index/quorum-tts-child-import-graph.test.ts` | Quorum/tts child map reaches only its own `*.factory-recording.v1.json` via the shared owned-* helper |
| `src/content/docs/references/packaged-factories-index/quorum/quorum-page.test.tsx` | Concise content + full-mode replay region proofs |
| `src/content/docs/references/packaged-factories-index/tts/tts-page.test.tsx` | Concise content + full-mode replay region proofs |
| `src/content/docs/references/packaged-factories-index/quorum/assert-quorum-child-reference-browser.ts` | Browser HTML probe (content + full-mode + no sibling recording filenames) |
| `src/content/docs/references/packaged-factories-index/tts/assert-tts-child-reference-browser.ts` | Browser HTML probe (content + full-mode + no sibling recording filenames) |

## Patterns

- Nested packaged-factory child pages are ordinary local-docs bundles under the
  parent directory (`packaged-factories-index/<child>/page.mdx`). Fumadocs only
  maps `**/page.mdx`, so the Batch 2 `generated/` corpus alone does not create
  child routes.
- `@you/tts` ships without packaged `invocationSignature` / `examples` in
  `tts.factory.json`. Child invocation examples are derived from the MODEL_INVOKE
  TTS `text` input (positional, stdin, and a text-oriented heredoc) plus the
  capacity-1 `omnivoice-cache` ON_DEMAND local resource note.
- Multi-segment reference registry slugs (`packaged-factories-index/quorum`)
  must live at nested registry paths matching
  `registry/references/<slug>.json`. Flat `readdir` cannot see them — registry
  load, validate, and runtime generation must walk recursively while skipping
  colocated `messages/` locale trees (tag message JSON is not a registry
  record).
- Keep child copy concise and reference-oriented: canonical name as the
  overview heading, one-sentence description, two or three concrete
  `you run --named` examples (positional/stdin plus branch/merge overrides for
  quorum), a short operational note, and a `LocalizedLinkList` link to the
  parent `#<childSlug>` definition anchor. Do not dump unabridged
  `factory.json` or add How To Use / Related / Tags chrome.
- Full-mode replay isolation: each child that mounts replay owns
  `<Child>FactoryReplay.tsx` (static import of only that child’s
  `generated/<slug>.factory-recording.v1.json` + `ControlledFactoryReplay`
  `mode="full"`) and `page-mdx-components.tsx` under the child directory. The
  route-family loader case must literal-import that child map — do not keep
  using shared `replay-page-mdx-components.tsx` once the child recording is
  mounted (the shared placeholder would otherwise risk co-bundling sibling
  recordings later). Put recording imports in the replay wrapper, not the map
  module.
- Browser verify for child replay: prefer
  `bun src/content/docs/references/packaged-factories-index/<child>/assert-*-browser.ts`
  with `--webpack` on a unique port (worktree Turbopack often fails on hoisted
  `node_modules`). Assert `data-factory-replay-mode="full"` plus timeline /
  topology / work-progress region labels, and that sibling recording filenames
  do not appear in HTML.
- Per-route recording isolation: prove each child `page-mdx-components.tsx`
  Bun metafile graph includes only that child’s
  `generated/<slug>.factory-recording.v1.json` and hits none of the other
  packaged recording filenames. Use the shared
  `child-recording-import-graph.ts` already on main
  (`ownedPackagedFactoryRecordingFilename`,
  `findForeignPackagedRecordingHits`,
  `graphIncludesOwnedPackagedRecording`,
  `collectChildRecordingImportGraphInputs`) — do not reintroduce a parallel
  `allowed*` / parent-wrapper helper surface.
