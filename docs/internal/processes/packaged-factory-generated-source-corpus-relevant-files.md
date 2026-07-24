# Packaged Factory Generated Source Corpus Relevant Files

Use these files when acquiring or generating the build-only
`packaged-factories@0.0.2` ordered index corpus (definitions, companion source,
recordings, manifest, pure/drift tests).

## Ownership fence

This lane owns only:

- generator / acquisition code under
  `src/lib/packaged-factory-generated-source-corpus/`
- generated artifacts under
  `src/content/docs/references/packaged-factories-index/generated/` (later
  stories)
- pure and drift tests for the corpus

Do **not** edit React features, pages, route loaders, dependencies, Next config,
or CSS in this lane.

## Reuse from Batch 1 (do not fork acquisition policy)

| Path | Role |
| --- | --- |
| `src/lib/packaged-factory-v002/packaged-factories-allowlist.ts` | Docs-owned slug order + required/optional relative paths |
| `src/lib/packaged-factory-v002/packaged-factories-filesystem-pull.ts` | Resolve package root via `package.json`, read allowlisted paths, fail closed on missing/wrong version/escape |
| `src/lib/packaged-factory-v002/five-package-pins.ts` | Exact `0.0.2` version constant |

Absence of a packaged-factories `exports` map is expected and must not fail
corpus acquisition.

## Key files (story 001 — ordered index corpus acquisition)

| Path | Role |
| --- | --- |
| `src/lib/packaged-factory-generated-source-corpus/index-corpus-model.ts` | Pure corpus types + builders: canonical name, packaged description (schema metadata only), child slug, unabridged `factory.json`, package version, SHA-256 |
| `src/lib/packaged-factory-generated-source-corpus/acquire-index-corpus.ts` | Build-only IO: filesystem pull → ordered index corpus |
| `src/lib/packaged-factory-generated-source-corpus/index-corpus-model.test.ts` | Pure fail-closed + order + hash proofs |
| `src/lib/packaged-factory-generated-source-corpus/acquire-index-corpus.test.ts` | Live host pull + fail-closed acquisition proofs |

### Packaged description rule

Take a top-level factory.json `description` only when it is a non-empty string
or a `LOCALIZABLE_ASSET` with a string `value`. If absent (as on published
0.0.2 definitions), store `null`. Never invent narrative from examples,
workers, or companion JavaScript.

### Acquisition contract

1. Resolve installed `@you-agent-factory/packaged-factories@0.0.2` via
   `package.json` (host project root or injected consumer).
2. Pull required allowlisted `factories/<slug>/factory.json` in docs order:
   goal → subagent → fusion → review → quorum → tts → deep-research.
3. Build corpus entries with complete unabridged text + parsed object and
   SHA-256 of the acquired UTF-8 bytes.
4. Fail closed on missing allowlisted files, wrong version, path escape,
   invalid JSON/shape, or missing canonical `name`.

## Key files (story 002 — companion JavaScript preservation)

| Path | Role |
| --- | --- |
| `src/lib/packaged-factory-generated-source-corpus/companion-source-model.ts` | Pure companion source types + builder: raw UTF-8 text, relative path, SHA-256, straightforward metadata only (`sourceKind`, canonical name, child slug, package version) |
| `src/lib/packaged-factory-generated-source-corpus/acquire-companion-source.ts` | Build-only IO: filesystem pull → fail-closed companion acquisition |
| `src/lib/packaged-factory-generated-source-corpus/companion-source-model.test.ts` | Pure fail-closed + no-interpretation proofs |
| `src/lib/packaged-factory-generated-source-corpus/acquire-companion-source.test.ts` | Live host pull + missing-companion fail-closed proofs |

### Companion JavaScript rule

- Allowlisted path:
  `factories/deep-research/scripts/deep-research.workflow.js`
- Preserve complete raw UTF-8 text exactly as pulled. Hash with SHA-256.
- Metadata only from package / deep-research `factory.json` (canonical name,
  child slug `deep-research`, package version `0.0.2`) plus a fixed
  `sourceKind: "companion-javascript"`.
- Do **not** parse, execute, traverse, interpret, summarize, or emit derived
  stage/worker/call-graph artifacts from the script body.
- Batch 1 filesystem pull still lists the companion as optional at the
  allowlist layer; **this corpus lane treats it as required** and fails closed
  when absent — never invent substitute JavaScript.

## Key files (story 003 — deterministic generated artifacts + manifest)

| Path | Role |
| --- | --- |
| `src/lib/packaged-factory-generated-source-corpus/generated-artifacts-model.ts` | Pure artifact builders: `index.json` model (corpus + companion), per-slug definition paths, companion JSON, `manifest.json` (package version, artifact paths, source hashes), deterministic JSON serialization |
| `src/lib/packaged-factory-generated-source-corpus/generate-packaged-factories-index.ts` | Build-only IO: acquire corpus + companion → write artifacts under the generated tree via `writeFileIfChangedSync` |
| `src/lib/packaged-factory-generated-source-corpus/generated-artifacts-model.test.ts` | Pure order / manifest / byte-stability / fail-closed proofs |
| `src/lib/packaged-factory-generated-source-corpus/generate-packaged-factories-index.test.ts` | Live host generate + re-run byte-stability proofs |
| `scripts/generate-packaged-factories-index.ts` | CLI entrypoint (`bun ./scripts/generate-packaged-factories-index.ts`) |
| `src/content/docs/references/packaged-factories-index/generated/` | Committed generated outputs (`index.json`, `manifest.json`, `factories/<slug>.factory.json`, `deep-research.source.json`, six `*.factory-recording.v1.json`) |

## Key files (story 004 — six distinctive factory-recording/v1 samples)

| Path | Role |
| --- | --- |
| `src/lib/packaged-factory-generated-source-corpus/recording-samples-model.ts` | Pure builders: project acquired factory.json into recording-safe topology, emit six `factory-recording/v1` samples, validate via public client parser + factory-replay projections |
| `src/lib/packaged-factory-generated-source-corpus/recording-samples-model.test.ts` | Pure projection / fail-closed proofs + live host six-recording distinctiveness proofs |
| `src/lib/packaged-factory-generated-source-corpus/generated-artifacts-model.ts` | Bundle includes `*.factory-recording.v1.json` + `factory-recording` manifest kind |
| `src/lib/packaged-factory-generated-source-corpus/generate-packaged-factories-index.ts` | Writes validated recordings beside index / definitions / companion / manifest |

### Recording sample rule

- Emit exactly six recordings for `goal`, `subagent`, `fusion`, `review`,
  `quorum`, and `tts`. **Never** emit a deep-research recording.
- Paths under the generated root:
  `{slug}.factory-recording.v1.json`.
- Packaged `@you/...` factory names and package-only worker fields (for example
  `promptFile`, some `modelProvider` enums) are **not** recording-schema-valid.
  Project a recording-safe Factory definition that:
  - uses the docs-owned child slug as `factory.name`
  - preserves work-type + workstation IO topology identity from the acquired
    definition
  - keeps only schema-safe worker identity fields (`name`, `type`, `stopToken`)
- Each sample includes a deterministic `INITIAL_STRUCTURE_REQUEST` topology
  bootstrap event.
- Before write, validate with
  `@you-agent-factory/client` `parseFactoryRecording` /
  `safeParseFactoryRecording` and project every tick with
  `@you-agent-factory/factory-replay`
  `projectFactoryTopologyAtTick` + `projectFactoryWorkProgressAtTick`.
- Fail closed on parser failure, topology `ok: false`, thrown progress
  projection, missing corpus entry, or duplicated topology fingerprints.

## Generated tree layout

```
src/content/docs/references/packaged-factories-index/generated/
  index.json                      # ordered corpus + companionSource
  manifest.json                   # packageVersion, artifacts[], sourceHashes[]
  deep-research.source.json       # raw companion JS + straightforward metadata
  goal.factory-recording.v1.json  # validated factory-recording/v1 samples
  subagent.factory-recording.v1.json
  fusion.factory-recording.v1.json
  review.factory-recording.v1.json
  quorum.factory-recording.v1.json
  tts.factory-recording.v1.json
  factories/
    goal.factory.json             # exact acquired factory.json UTF-8 bytes
    subagent.factory.json
    fusion.factory.json
    review.factory.json
    quorum.factory.json
    tts.factory.json
    deep-research.factory.json
```

### Determinism rule

- JSON artifacts (`index.json`, `manifest.json`, `deep-research.source.json`)
  use `${JSON.stringify(value, null, 2)}\n`.
- Per-factory definition files preserve exact acquired `factory.json` UTF-8
  bytes (do not re-serialize).
- Re-running the generator with the same installed package inputs must leave
  file bytes unchanged (`writeFileIfChangedSync` → `changed: false`).

### Biome ignore for generated tree

`biome.json` excludes
`src/content/docs/references/packaged-factories-index/generated` from
format/lint. Generated `factories/<slug>.factory.json` files preserve exact
acquired package UTF-8 bytes (and `index.json` embeds unabridged parsed
definitions); Biome's JSON formatter would otherwise rewrite those bytes and
break hash/drift stability.
