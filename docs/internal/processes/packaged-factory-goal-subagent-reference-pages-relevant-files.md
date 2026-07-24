# Packaged Factory Goal and Subagent Reference Pages Relevant Files

Use these files when authoring the nested goal and subagent child reference
pages under `/docs/references/packaged-factories-index/{goal,subagent}`.

## Ownership fence

This lane owns:

- child page bundles under
  `src/content/docs/references/packaged-factories-index/goal/` and
  `…/subagent/` (`page.mdx`, `messages/en.json`, `assets.json`, child-owned
  `page-mdx-components.tsx` / thin replay wrappers)
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

## Key files (story 002 — goal-only full-mode replay)

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/goal/GoalFactoryReplay.tsx` | Client mount: `ControlledFactoryReplay` `mode="full"` with only `generated/goal.factory-recording.v1.json` |
| `src/content/docs/references/packaged-factories-index/goal/page-mdx-components.tsx` | Goal-owned MDX map exporting `GoalFactoryReplay` |
| `src/lib/content/route-family-local-docs-page-load.ts` | `packaged-factories-index/goal` case literal-imports the goal-owned map (not shared `replay-page-mdx-components`) |
| `src/content/docs/references/packaged-factories-index/packaged-factories-index-child-maps.test.ts` | Asserts goal resolves goal-owned map; remaining standard children keep the shared placeholder |
| `src/content/docs/references/packaged-factories-index/goal/assert-goal-child-reference-browser.ts` | Browser markers for concise content + `data-factory-replay-mode="full"` |

## Key files (story 003 — subagent child reference content)

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/subagent/page.mdx` | Concise nested reference: canonical name, one-sentence description, positional + stdin + help invocation examples, parent definition link |
| `src/content/docs/references/packaged-factories-index/subagent/messages/en.json` | Local messages for the subagent child surface |
| `src/content/docs/references/packaged-factories-index/subagent/assets.json` | Empty local asset config |
| `src/content/registry/references/packaged-factories-index/subagent.json` | Registry id `reference.packaged-factories-index-subagent`, slug `packaged-factories-index/subagent` |
| `src/content/docs/references/packaged-factories-index/subagent/subagent-page.test.tsx` | Route + concise content publish proofs |

## Key files (story 004 — subagent-only full-mode replay)

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/subagent/SubagentFactoryReplay.tsx` | Client mount: `ControlledFactoryReplay` `mode="full"` with only `generated/subagent.factory-recording.v1.json` |
| `src/content/docs/references/packaged-factories-index/subagent/page-mdx-components.tsx` | Subagent-owned MDX map exporting `SubagentFactoryReplay` |
| `src/lib/content/route-family-local-docs-page-load.ts` | `packaged-factories-index/subagent` case literal-imports the subagent-owned map (not shared `replay-page-mdx-components`) |
| `src/content/docs/references/packaged-factories-index/packaged-factories-index-child-maps.test.ts` | Asserts goal and subagent resolve child-owned maps; remaining standard children keep the shared placeholder |
| `src/content/docs/references/packaged-factories-index/subagent/assert-subagent-child-reference-browser.ts` | Browser markers for concise content + `data-factory-replay-mode="full"` |

## Patterns

- Nested packaged-factory child pages are ordinary local-docs reference bundles
  under the parent directory. Keep copy concise: no workflow teaching, no
  unabridged `factory.json` on the child, no package-specific operational-notes
  section for this lane.
- Subagent invocation examples should follow the packaged signature/help:
  positional input, stdin pipe (`printf … | you run --named @you/subagent`),
  and a third concrete variant such as `--help`. Do not invent unrelated flags.
- Registry multi-segment slugs map to nested files under the kind directory
  (`references/packaged-factories-index/goal.json` for slug
  `packaged-factories-index/goal`). The registry loader must walk nested kind
  directories and must skip colocated `messages/` trees.
- Parent definition links use the stable child-slug anchor already emitted by
  the generated parent (`/docs/references/packaged-factories-index#goal`).
  Prefer `LocalizedLinkList` so GitHub Pages `basePath` prefixes correctly.
- **Recording isolation:** each replay child owns its MDX map under the child
  directory and statically imports only that child’s
  `generated/<slug>.factory-recording.v1.json`. Never put packaged-factory
  recordings into the shared `replay-page-mdx-components.tsx` placeholder —
  that module is still loaded by sibling standard-replay loader cases.
- Prefer `ControlledFactoryReplay` with `mode="full"` from
  `@/features/factory-replay`. Do not use `FactoryRecordingTopologyReplay`,
  corpus acquisition modules, or sibling recording JSON files.
- Worktree browser verify: `bun run dev -- --webpack -p <port>` (Turbopack
  cannot resolve hoisted parent `node_modules/next`).
- After adding a new nested `page.mdx`, run
  `bun run prepare:content-runtime && bunx fumadocs-mdx` (or any
  `pretest`/`pretypecheck` path) so `.source` and the ignored
  `published-docs-registry.generated.ts` include the new route before
  `source.getPage([...])` asserts. Do not commit ignored generated runtime
  outputs or accidental `next-env.d.ts` drift from `bun run dev`.
