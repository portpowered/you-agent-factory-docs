# Packaged Factory Deep-Research Reference Page Relevant Files

Use these files when publishing or extending the minimal manually maintained
deep-research nested reference at
`/docs/references/packaged-factories-index/deep-research`.

## Ownership fence

This lane owns:

- child page bundle under
  `src/content/docs/references/packaged-factories-index/deep-research/`
  (`page.mdx`, `messages/`, `assets.json`, colocated page tests, browser probe)
- reference registry record
  `src/content/registry/references/packaged-factories-index-deep-research.json`
- focused child-page tests/messages only

Do **not** modify sibling child page bodies, the parent index renderer or
generated corpus, shared `src/features/factory-replay/**` internals, landing
composition, dependency pins, or global CSS. The parent-owned non-replay map at
`deep-research-page-mdx-components.tsx` and its loader case already exist from
Batch 3 — keep using that path; do not switch deep-research onto
`replay-page-mdx-components`.

## Key files

| Path | Role |
| --- | --- |
| `src/content/docs/references/packaged-factories-index/deep-research/page.mdx` | Minimal nested reference: purpose + one usage fenced example + LocalizedLinkList to JS runtime and Dynamic Workflows |
| `src/content/docs/references/packaged-factories-index/deep-research/messages/en.json` | Concise purpose + Usage title + `links.javascriptRuntime` / `links.dynamicWorkflows`; no teaching/how-to chrome keys |
| `src/content/docs/references/packaged-factories-index/deep-research/assets.json` | Empty local asset config |
| `src/content/registry/references/packaged-factories-index-deep-research.json` | Registry id `reference.packaged-factories-index-deep-research`, leaf slug `deep-research` |
| `src/content/docs/references/packaged-factories-index/deep-research-page-mdx-components.tsx` | Parent-owned non-replay MDX map (Batch 3); keep empty of replay mounts |
| `src/lib/content/route-family-local-docs-page-load.ts` | Literal loader case for `packaged-factories-index/deep-research` → non-replay map |
| `src/content/docs/references/packaged-factories-index/deep-research/deep-research-page.test.tsx` | Nested route, purpose, single usage example, required link hrefs, registry, non-replay map, and story-004 focused forbidden-expansion absence proofs |
| `src/content/docs/references/packaged-factories-index/deep-research/assert-deep-research-purpose-browser.ts` | Playwright purpose+usage+links+no-forbidden-expansion browser verify (webpack `next dev`, unique port) |
| `src/content/docs/references/packaged-factories-index/generated/factories/deep-research.factory.json` | Ground truth for the packaged example topic (read-only; do not edit from this lane) |

## Patterns

- Nested reference children under a published parent are ordinary local-docs
  bundles discovered by `findDocsPageDirectories` continuing under directories
  that already contain `page.mdx`. Fumadocs only maps `**/page.mdx`, so a child
  directory without `page.mdx` does not publish even when the parent links to
  `/docs/references/packaged-factories-index/<childSlug>`.
- Keep the deep-research body minimal: purpose, one usage example, and the two
  required links. Do not add replay, recordings, visualizers, timelines, event
  history, raw packaged source dumps, AST/stages/workers views, schema
  expansion, extended operational notes, or teaching sections. Story 004
  focused proofs assert both the required minimal surface and the absence of
  those forbidden expansion markers/phrases on the rendered page body
  (`[data-factory-replay*]`, `[data-factory-visualizer]`,
  `[data-factory-recording]`, `[data-packaged-factory-*]`,
  `[data-schema-field-expand]` / schema surface markers, plus body phrases for
  AST / stages / workers / unabridged factory.json). Scope browser assertions
  to `#nd-page` so sidebar nav does not create false positives.
- Title the usage section `Usage` (not `How To Use`). Put exactly one fenced
  `you run --named @you/deep-research "…"` example in MDX, grounded in the
  packaged `positional-topic` example topic from
  `generated/factories/deep-research.factory.json`. Do not add a second
  invocation, walkthrough steps, or operational-note prose.
- Add the two required links with `LocalizedLinkList` (Next `<Link>`,
  basePath-aware) to `/docs/references/javascript-runtime` and
  `/docs/factories/dynamic-workflows`. Prefer bare list anchors after Usage
  rather than a `Related To` / `References` teaching section heading.
- Resolve MDX mounts through the existing parent-level
  `deep-research-page-mdx-components` non-replay map. Do not invent a second
  child-local `page-mdx-components.tsx` unless the loader case is updated to
  match — relative MDX imports still do not resolve under `compileMDX`.
- Registry leaf slug stays `deep-research` (last docsSlug segment). Prefer a
  unique registry id that includes the parent family prefix
  (`reference.packaged-factories-index-deep-research`) so it does not collide
  with a future top-level `reference.deep-research`.
- Browser-verify with webpack `bun ./scripts/run-next.ts dev --webpack` on a
  unique port in 3100–3999 (default `3611`), Playwright via
  `launchPlaywrightBrowser`, and kill the server on exit. Prefer
  `DEEP_RESEARCH_PAGE_PROBE_BASE_URL` when a server is already warm.
