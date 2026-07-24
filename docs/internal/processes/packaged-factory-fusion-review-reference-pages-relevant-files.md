# Packaged Factory Fusion and Review Reference Pages Relevant Files

Use these files when authoring the nested fusion and review child reference
pages under `/docs/references/packaged-factories-index/{fusion,review}`.

## Ownership fence

This lane owns:

- child page bundles under
  `src/content/docs/references/packaged-factories-index/fusion/` and
  `…/review/` (`page.mdx`, `messages/en.json`, `assets.json`, child-owned
  `page-mdx-components.tsx` / thin replay wrappers in later stories)
- matching reference registry records with multi-segment slugs
  `packaged-factories-index/fusion` and `packaged-factories-index/review`
- the two literal loader cases for those nested slugs in
  `src/lib/content/route-family-local-docs-page-load.ts` (updated when child
  maps leave the shared replay placeholder)
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

## Patterns

- Nested packaged-factory child pages are ordinary local-docs reference bundles
  under the parent directory. Keep copy concise: no workflow teaching and no
  unabridged `factory.json` on the child. Fusion/review lanes include a short
  package-specific operational-notes section; goal/subagent lanes intentionally
  omit that section.
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
- Story 001 publishes content only. Full-mode replay mounts and per-route
  recording isolation (child-owned MDX maps + loader case updates) belong to
  later stories; leave the shared `replay-page-mdx-components` placeholder
  alone until then.
