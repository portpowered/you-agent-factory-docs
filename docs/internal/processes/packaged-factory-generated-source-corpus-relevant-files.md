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
