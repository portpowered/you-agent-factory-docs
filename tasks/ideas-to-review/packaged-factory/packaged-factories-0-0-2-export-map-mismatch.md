# packaged-factories@0.0.2 authored-source registry artifact

## Status (2026-07-24 UTC)

**Superseded for Batch 1 docs lane.** Customer unlocked direct allowlisted
filesystem pull for `packaged-factories@0.0.2`. Story
`packaged-factory-v002-package-css-contract-002` now proves:

1. ESM libraries via declared public exports
2. packaged-factories via docs-owned allowlisted reads under
   `factories/<slug>/factory.json` (absence of an `exports` map is expected)

Do **not** treat missing exports as a Batch 1 hard stop. Waiting for an exports
map republish is a PRD non-goal for this lane.

## Remaining upstream note (optional / future)

The npm registry artifact for `@you-agent-factory/packaged-factories@0.0.2`
still ships `files: ["factories"]` with **no** `exports` map and nested authored
paths. Upstream `main` documents a data-only export map (`./manifest`,
`./factories/*.json` → `generated/`) at package `version` `0.0.0` that is not
what npm `0.0.2` serves.

A future exports-based consumer API may still want a republished catalog
artifact. That work belongs upstream and is **not** required to unblock Batch 1
host pins / CSS / transpile stories.

## Evidence snapshot (2026-07-24 UTC)

- npm `@you-agent-factory/packaged-factories@0.0.2`: `exports` absent,
  `files: ["factories"]`, nested `factories/<slug>/factory.json` plus
  `factories/deep-research/scripts/deep-research.workflow.js`
- Registry `time.modified`: `2026-07-23T00:42:41.715Z`
- Docs-side proof: `provePackagedFactoryV002SplitAcquisition()` +
  `pullPackagedFactoriesAllowlistedFiles()`
