# packaged-factories@0.0.2 export-map mismatch

## Problem

Batch 1 story `packaged-factory-v002-package-css-contract-002` requires importing
packaged factory definitions, package order/metadata (`./manifest`), and
deep-research source (`./factories/deep-research.json`) **only through declared
public exports**, failing closed when the published export map is missing.

Upstream source on `you-agent-factory` / `infinite-you` already documents and
implements the data-only contract:

- `exports["./manifest"]`
- `exports["./factories/*.json"]` / `./factories/*.yaml`
- generated flattened catalog under `generated/factories/`

But the npm registry artifact for `@you-agent-factory/packaged-factories@0.0.2`
(and `0.0.0`) publishes the older authored-source tree (`files: ["factories"]`)
with **no** `exports` map and nested paths such as
`factories/deep-research/factory.json`.

Legacy Node resolution can invent filesystem paths for those nested files, which
is exactly the failure mode this lane must stop: hosts inventing undocumented
internals when the public contract is absent.

## Why this matters

- Later packaged-factory reference / replay lanes depend on a single fail-closed
  five-package public-export surface at exact `0.0.2`.
- This docs lane must not repair upstream publishes (PRD non-goal) and must not
  invent nested authored-source imports as a workaround.
- Story 002 cannot mark `passes: true` until the registry artifact matches the
  documented export map and the clean-consumer proof imports succeed.

## Proposed fix (upstream)

Republish `@you-agent-factory/packaged-factories` so the installed
`package.json` matches the data-only contract (manifest + flattened
`./factories/<slug>.json` exports, no reliance on authored nested trees). Bump
or replace the broken `0.0.2` artifact so Batch 1 can pin one exact version
that proves clean.

## Upstream status (re-checked 2026-07-24 02:53 UTC)

- Source of truth already lands the exports map in
  `packages/packaged-factories/package.json` on
  `portpowered/you-agent-factory` (`./manifest`, `./schemas/*`,
  `./factories/*.json` / `./factories/*.yaml` → `generated/` + `schemas/`).
  Default-branch package `version` there is still `0.0.0`.
- [you-agent-factory#1258](https://github.com/portpowered/you-agent-factory/pull/1258)
  (`packaged-factories-npm-publication`) **merged** 2026-07-23 after the broken
  npm `0.0.2` tarball publish (~00:42Z that day). Registry was not republished.
- [you-agent-factory#1260](https://github.com/portpowered/you-agent-factory/pull/1260)
  (website manifest consumption) **merged** 2026-07-24; it assumes the public
  data exports but does not republish npm.
- [you-agent-factory#1239](https://github.com/portpowered/you-agent-factory/pull/1239)
  (`Fix public package releases`) remains an open draft / conflicting (updated
  `2026-07-22T23:29:58Z`).
- npm still only has `0.0.0` and `0.0.2`; downloaded `0.0.2` tarball has
  `files: ["factories"]` and **no** `exports` (registry Updated
  `2026-07-23T00:42:41.715Z`; `dist-tags.latest=0.0.2`). Nested authored
  paths only (`factories/<slug>/factory.json`); no `generated/` tree.

## Evidence in this repo

- Fail-closed proof:
  `src/lib/packaged-factory-v002/public-export-proof.test.ts`
- Process note:
  `docs/internal/processes/packaged-factory-v002-package-css-contract-relevant-files.md`
