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

## Key files (story 001 — parent shell + discovery)

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/page.mdx` | Published parent route shell titled Packaged Factory Reference |
| `src/content/docs/references/packaged-factories-index/messages/en.json` | Concise reference-oriented local messages (no usage-example sections) |
| `src/content/docs/references/packaged-factories-index/assets.json` | Empty local asset config |
| `src/content/registry/references/packaged-factories-index.json` | Registry id `reference.packaged-factories-index`, slug `packaged-factories-index` |
| `src/content/docs/references/family-index/reference-family-routes.ts` | Discoverability href `/docs/references/packaged-factories-index` |
| `src/content/docs/references/family-index/messages/*.json` | Localized discoverability card title/body for `packaged-factories-index` |
| `src/content/docs/references/packaged-factories-index/packaged-factories-index-page.test.tsx` | Route, registry, and family-index discoverability proofs |

## Patterns

- Parent pages under `references/` are ordinary local-docs page bundles:
  `page.mdx` + `messages/en.json` + `assets.json` + matching registry JSON.
- Family-index discovery is authored on the index: add a stable route row, then
  matching `sections.<id>` title/body in every owned locale message file.
- Keep the parent free of replay/recording/visualizer/playback mounts; later
  stories add an index-only MDX component map and literal route-family loader
  imports.
- Fumadocs only maps `**/page.mdx` bundles to routes, so the Batch 2
  `generated/` corpus beside the parent page does not create child routes by
  itself.
