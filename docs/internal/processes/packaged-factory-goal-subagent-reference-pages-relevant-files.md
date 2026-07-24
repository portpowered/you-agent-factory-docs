# Packaged Factory Goal and Subagent Reference Pages Relevant Files

Use these files when authoring the nested goal and subagent child reference
pages under `/docs/references/packaged-factories-index/{goal,subagent}`.

## Ownership fence

This lane owns:

- child page bundles under
  `src/content/docs/references/packaged-factories-index/goal/` and
  `…/subagent/` (`page.mdx`, `messages/en.json`, `assets.json`, child-owned
  `page-mdx-components.tsx` / thin replay wrappers in later stories)
- matching reference registry records with multi-segment slugs
  `packaged-factories-index/goal` and `packaged-factories-index/subagent`
- the two literal loader cases for those nested slugs in
  `src/lib/content/route-family-local-docs-page-load.ts`
- focused child page / recording-isolation tests

Do **not** modify sibling child page bodies (fusion, review, quorum, tts,
deep-research), parent index renderer behavior, shared `factory-replay`
internals beyond consuming the public API, generated corpus regeneration,
landing composition, dependency pins, or global CSS.

## Key files (story 001 — goal child reference content)

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/goal/page.mdx` | Concise nested reference: canonical name, one-sentence description, invocation examples, parent definition link |
| `src/content/docs/references/packaged-factories-index/goal/messages/en.json` | Local messages for the goal child surface |
| `src/content/docs/references/packaged-factories-index/goal/assets.json` | Empty local asset config |
| `src/content/registry/references/packaged-factories-index/goal.json` | Registry id `reference.packaged-factories-index-goal`, slug `packaged-factories-index/goal` |
| `src/lib/content/registry.ts` | Recursive kind-directory walk so multi-segment slug files load (skips `messages/`) |
| `src/content/docs/references/packaged-factories-index/goal/goal-page.test.tsx` | Route + concise content publish proofs |

## Patterns

- Nested packaged-factory child pages are ordinary local-docs reference bundles
  under the parent directory. Keep copy concise: no workflow teaching, no
  unabridged `factory.json` on the child, no package-specific operational-notes
  section for this lane.
- Registry multi-segment slugs map to nested files under the kind directory
  (`references/packaged-factories-index/goal.json` for slug
  `packaged-factories-index/goal`). The registry loader must walk nested kind
  directories and must skip colocated `messages/` trees.
- Parent definition links use the stable child-slug anchor already emitted by
  the generated parent (`/docs/references/packaged-factories-index#goal`).
  Prefer `LocalizedLinkList` so GitHub Pages `basePath` prefixes correctly.
- Story 001 publishes content only. Full-mode replay mounts and per-route
  recording isolation (child-owned MDX maps + loader case updates) belong to
  later stories; leave the shared `replay-page-mdx-components` placeholder
  alone until then.
