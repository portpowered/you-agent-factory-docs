# Packaged Factory Reference Family Closeout Relevant Files

Use these files when closing Batches 1–4 packaged-factory reference surfaces as
one tip-owned family (index + seven children + landing Youi compact goal
replay).

## Ownership fence

This lane owns only:

- closeout evidence / verification under `src/lib/verify/packaged-factory-reference-family-closeout-*`
- narrow integration fixes required to keep family behavior and repository
  gates green on the converged tip
- reproducible evidence notes in `progress.txt` / PR conversation

Do **not** regenerate the committed corpus unless hash/drift gates fail closed.
Do **not** redesign shared factory-replay internals, parent index ownership,
child page bodies, landing composition, package pins, or global CSS unless a
concrete closeout failure requires a minimal fix in that surface. Prefer fixing
avoidable import leakage over raising budget ceilings.

## Key files (story 001 — deterministic corpus hashes + unabridged index)

| Path | Role |
| --- | --- |
| `src/lib/verify/packaged-factory-reference-family-closeout-corpus.ts` | Closeout-owned tip proof helpers: deterministic generate, manifest 0.0.2 + SHA-256 source-hash contract, unabridged definition alignment |
| `src/lib/verify/packaged-factory-reference-family-closeout-corpus.test.tsx` | Pure fail-closed + live tip proofs (generate twice, committed drift/hashes, accessible unabridged panels) |
| `src/lib/packaged-factory-generated-source-corpus/verify-committed-corpus.ts` | Reused Batch 2 committed regeneration + source-hash verify (do not fork) |
| `src/lib/packaged-factory-generated-source-corpus/generate-packaged-factories-index.ts` | Reused generate path for byte-stability proof |
| `src/content/docs/references/packaged-factories-index/generated/manifest.json` | Committed packageVersion + `sourceHashes[]` contract under test |
| `src/content/docs/references/packaged-factories-index/generated/factories/*.factory.json` | Committed unabridged definition bytes panels must match |
| `src/content/docs/references/packaged-factories-index/PackagedFactoriesIndex.tsx` | Parent index renderer (read-only for story 001 unless panels regress) |
| `src/content/docs/references/packaged-factories-index/project-packaged-factories-index.ts` | Pure corpus → panel projection (read-only) |

### Story 001 acceptance mapping

1. **Deterministic generation** —
   `assertPackagedFactoryCloseoutGenerationIsDeterministic` runs
   `generatePackagedFactoriesIndex` twice into a temp dir and requires
   `changedCount === 0` with identical bundle file bytes.
2. **Package version + source hashes** —
   `assertPackagedFactoryCloseoutManifestContract` requires `packageVersion`
   `0.0.2` and lowercase 64-char hex SHA-256 entries for every allowlisted
   `factories/<slug>/factory.json` plus the deep-research companion JS path, in
   docs order. `provePackagedFactoryReferenceFamilyCloseoutCorpus` also calls
   `verifyCommittedPackagedFactoriesIndex` and recomputes hashes from committed
   artifact bytes.
3. **Unabridged index panels** — projected `definitionText` and rendered
   `data-testid="packaged-factory-definition-<slug>"` `<pre>` panels must equal
   committed `factories/<slug>.factory.json` UTF-8 bytes (and
   `generated/index.json` `factoryJsonText`).

## Patterns

- Closeout proofs compose Batch 2 verify/generate helpers; they do not invent a
  second acquisition policy or rewrite committed `generated/` outputs on green
  tip.
- Keep pure fail-closed asserts (manifest contract, definition mismatch) separate
  from IO (generate, committed-tree load, live verify).
- Parent index panel accessibility for story 001 is the accessible code panel
  (`<pre>` in `CodePanel`) remaining in the DOM with full unabridged text —
  scroll clipping is OK; truncation is not.
- Later closeout stories (replay gates, import graphs, a11y/export/CSS, gates,
  browser evidence) should add sibling `packaged-factory-reference-family-closeout-*`
  modules rather than expanding story 001 beyond corpus + unabridged index.

## Reproduce

```bash
bun run prepare:content-runtime
bun test src/lib/verify/packaged-factory-reference-family-closeout-corpus.test.tsx
bun test src/lib/packaged-factory-generated-source-corpus/corpus-drift.test.ts
```
