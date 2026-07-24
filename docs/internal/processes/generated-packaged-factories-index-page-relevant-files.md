# Generated Packaged Factories Index Page Relevant Files

Use these files when publishing or extending the parent Packaged Factory
Reference at `/docs/references/packaged-factories-index`.

## Ownership fence

This lane owns:

- parent page bundle under
  `src/content/docs/references/packaged-factories-index/` (page.mdx, messages,
  assets, index renderer / page-mdx-components in later stories)
- reference registry record
  `src/content/registry/references/packaged-factories-index.json`
- references family-index discoverability row for this parent
  (`reference-family-routes.ts` + family-index `messages/*.json`)
- focused parent page / import-isolation tests

Do **not** modify Batch 2 generator/corpus under `generated/`, shared
factory-replay feature internals (beyond thin child component-map placeholders
required for literal imports), child page bodies, landing composition,
dependency pins, or global CSS.

## Key files (stories 001–004 — parent shell, ordered index, maps, nested loader)

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/page.mdx` | Published parent route titled Packaged Factory Reference; mounts index renderer |
| `src/content/docs/references/packaged-factories-index/PackagedFactoriesIndex.tsx` | Server-rendered ordered enumeration + CodePanel definitions |
| `src/content/docs/references/packaged-factories-index/project-packaged-factories-index.ts` | Pure corpus → view projection (factory.json vs JavaScript-only) |
| `src/content/docs/references/packaged-factories-index/page-mdx-components.tsx` | Index-only MDX map exporting `PackagedFactoriesIndex` |
| `src/content/docs/references/packaged-factories-index/replay-page-mdx-components.tsx` | Shared thin placeholder map for standard replay children |
| `src/content/docs/references/packaged-factories-index/deep-research-page-mdx-components.tsx` | Non-replay placeholder map for `deep-research` only |
| `src/lib/content/route-family-local-docs-page-load.ts` | Literal static imports for parent + nested child maps (`loadRouteFamilyPageMdxComponents`) |
| `src/content/docs/references/packaged-factories-index/generated/index.json` | Batch 2 ordered corpus (read-only for this lane) |
| `src/content/docs/references/packaged-factories-index/messages/en.json` | Concise reference-oriented local messages (no usage-example sections) |
| `src/content/docs/references/packaged-factories-index/assets.json` | Empty local asset config |
| `src/content/registry/references/packaged-factories-index.json` | Registry id `reference.packaged-factories-index`, slug `packaged-factories-index` |
| `src/content/docs/references/family-index/reference-family-routes.ts` | Discoverability href `/docs/references/packaged-factories-index` |
| `src/content/docs/references/family-index/messages/*.json` | Localized discoverability card title/body for `packaged-factories-index` |
| `src/content/docs/references/packaged-factories-index/packaged-factories-index-page.test.tsx` | Route, discovery, and enumeration render proofs |
| `src/content/docs/references/packaged-factories-index/packaged-factories-index-child-maps.test.ts` | Nested child map identity + loader wiring proofs |
| `src/content/docs/references/packaged-factories-index/project-packaged-factories-index.test.ts` | Pure projection proofs including JavaScript-only shape |

## Patterns

- Parent pages under `references/` are ordinary local-docs page bundles:
  `page.mdx` + `messages/en.json` + `assets.json` + matching registry JSON.
- Family-index discovery is authored on the index: add a stable route row, then
  matching `sections.<id>` title/body in every owned locale message file.
- Index rendering statically imports `generated/index.json` and projects entries
  through a pure helper. Prefer shipped `factoryJsonText`; otherwise require
  exact acquired `javascriptSourceText` and label “no factory.json”. Never
  parse companion JavaScript into stages/workers/call graphs.
- Mount the index renderer through `page-mdx-components.tsx` + a literal
  `import("@/content/docs/references/packaged-factories-index/page-mdx-components")`
  case in `route-family-local-docs-page-load.ts`. Relative MDX imports of local
  components are not resolved by the compile path.
- Use site `CodePanel` (`@/features/factory-ui/data-display`) for unabridged
  definition panels. Full source must remain in the DOM (scroll clipping is OK).
- Keep the parent free of replay/recording/visualizer/playback mounts. Story
  003’s `page-mdx-components` must stay index-only (`PackagedFactoriesIndex`
  only). Nested child maps are separate modules: standard children
  (`goal`/`subagent`/`fusion`/`review`/`quorum`/`tts`) each get a literal
  loader case importing the shared `replay-page-mdx-components` module;
  `deep-research` imports `deep-research-page-mdx-components` only (never the
  replay-page map). Duplicate the same literal specifier per case — do not use
  expression-based `import(variable)`.
- Prove nested map wiring via `loadRouteFamilyPageMdxComponents` map identity
  (shared replay vs non-replay) without authoring Batch 4 child `page.mdx`
  bodies.
- Fumadocs only maps `**/page.mdx` bundles to routes, so the Batch 2
  `generated/` corpus beside the parent page does not create child routes by
  itself. Child hrefs are still emitted as
  `/docs/references/packaged-factories-index/<childSlug>` with `id={childSlug}`
  anchors.
