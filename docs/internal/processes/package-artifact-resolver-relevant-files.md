# Package Artifact Resolver (W03) Relevant Files

Use these files when implementing or extending build/server acquisition of
`@you-agent-factory/api` public export artifacts (resolver, validators, ledger,
and `prepare:content-runtime` wiring).

## Ownership fence

W03 owns only the acquisition surface and its tests. Do **not** add normalized
reference models (W04), renderers, or reference/factory/worker/workstation pages
in this lane. Do **not** patch files under `node_modules`.

## Package facts

| Fact | Value |
| --- | --- |
| Package | `@you-agent-factory/api@0.0.0` |
| Export style | Data-only public subpaths (JSON / YAML files) |
| Resolution | `import.meta.resolve("@you-agent-factory/api/<subpath>")` then read file |
| Forbidden | Package root, `@you-agent-factory/api/generated/...`, raw `node_modules/...` paths |

Fixed public subpaths: `manifest`, `openapi`, `cli`, `mcp`, `schemas/you-config`,
`schemas/factory`, `schemas/mock-workers`, `javascript/runtime`. Joined contracts
use the `joined/*` wildcard export.

## Key host files

| Path | Role |
| --- | --- |
| `src/lib/references/api-package-public-exports.ts` | Pure documented-subpath allowlist and target parsing (no filesystem IO) |
| `src/lib/references/api-package-artifact-resolver.ts` | Build/server resolver: public-subpath resolve → read → JSON/YAML parse; actionable illegal/missing errors |
| `src/lib/references/api-package-artifact-resolver.test.ts` | Observable resolve/parse success plus illegal-target and missing-export failures |
| `src/lib/references/api-package-manifest.ts` | Pure manifest parse + membership field shape checks + path index (no IO) |
| `src/lib/references/api-package-manifest-membership.ts` | Build/server: load manifest via public subpath; validate consumed exports against published membership |
| `src/lib/references/api-package-manifest-membership.test.ts` | Manifest authority load, membership success, missing/malformed failure proofs |
| `src/lib/references/api-package-format-versions.ts` | Pure docs-build format-version allowlist + fail-closed checks (no IO) |
| `src/lib/references/api-package-format-version-gate.ts` | Build/server: membership + format-version gate; missing-artifact errors name subpath + dependent reference family |
| `src/lib/references/api-package-format-version-gate.test.ts` | Known-version success, unsupported-version failure, missing-artifact consumer-identity proofs |
| `src/lib/references/api-package-consumed-hash-ledger.ts` | Pure ledger types/builder + Biome-stable TypeScript module renderer (no IO) |
| `src/lib/references/api-package-consumed-hash-ledger-generation.ts` | Build/server: validate consumed exports then emit ledger via `writeFileIfChanged` |
| `src/lib/references/api-package-consumed-hash-ledger.test.ts` | Deterministic ledger bytes, identity/hash recording, no-diff rebuild proofs |
| `scripts/generate-api-package-consumed-hash-ledger.ts` | CLI entry for ledger emission (`bun run generate:api-package-consumed-hash-ledger`) |
| `src/lib/content/generated/api-package-consumed-hash-ledger.generated.ts` | Generated runtime ledger output (gitignored; regenerated from package inputs) |
| `src/lib/content/content-runtime-preparation.ts` | Registers `api-package-consumed-hash-ledger` in `CONTENT_RUNTIME_COMPLETENESS_CONTRACT` |
| `src/lib/content/content-runtime-fingerprints.ts` | Fingerprint inputs for the ledger step (installed package + acquisition generators) |
| `package.json` | Runtime dependency on `@you-agent-factory/api@0.0.0`; `generate:api-package-consumed-hash-ledger` script |

## Patterns

- Keep the public-subpath allowlist pure and IO-free so later browser-exclusion
  tests can prove client code never imports the Node resolver.
- Resolve only through package export specifiers. Never hard-code
  `node_modules/@you-agent-factory/api/generated/...` paths.
- Reject package root, package-internal `generated/...` targets, and raw
  filesystem paths with `ApiPackageArtifactResolutionError` messages that name
  the illegal target.
- Parse `.json` with `JSON.parse` and `.yaml`/`.yml` with `Bun.YAML.parse`.
- Inject `resolveExport` / `readTextFile` / `parseYaml` in tests when proving
  failure paths; use the real installed package for success-path proofs.
- Treat `@you-agent-factory/api/manifest` as the membership authority
  (`loadApiPackageManifest`), not as a member export. Match consumed artifacts
  to `manifest.exports[*].path` via the package-relative `generated/...` path
  derived from the resolved file URL. Validate `family`, `path`,
  `artifactHash`, `lifecycle`, and `documentation` shapes; never invent missing
  membership entries.
- Pin docs-build format versions in `api-package-format-versions.ts` (manifest
  `formatVersion`, `familyFormatVersions`, documentation/lifecycle versions, and
  per-family artifact body `formatVersion` when published). Unsupported versions
  fail closed naming family/subpath/observed version and that the docs build does
  not support it. Missing required artifacts after resolution/membership name
  the public subpath and the caller `dependentReferenceFamily`.
- Build the consumed-hash ledger only from validated exports
  (`buildApiPackageConsumedHashLedger`); sort entries by `subpath` then
  `exportId`; render with `renderTypescriptLiteral` so identical package inputs
  produce identical module bytes. Emit through `writeFileIfChanged` /
  `generateApiPackageConsumedHashLedger` so unchanged inputs leave the generated
  file untouched. Default consumed set is fixed public subpaths minus
  `manifest`.
- Register the ledger generator in `CONTENT_RUNTIME_COMPLETENESS_CONTRACT` (id
  `api-package-consumed-hash-ledger`, ignored git classification) and declare
  matching `CONTENT_RUNTIME_STEP_FINGERPRINT_INPUTS` over the installed package
  (`node_modules/@you-agent-factory/api/package.json` + `generated/`) plus the
  acquisition generator/schema modules. Do not invent a second prepare pipeline;
  warm `prepare:content-runtime` skips via fingerprints, and generators still
  use `writeFileIfChanged` so unchanged package inputs produce no ledger diff.
- Later stories (browser-bundle exclusion) should extend this surface rather
  than inventing a second acquisition path.

## Verification

```bash
bun test src/lib/references/api-package-artifact-resolver.test.ts \
  src/lib/references/api-package-manifest-membership.test.ts \
  src/lib/references/api-package-format-version-gate.test.ts \
  src/lib/references/api-package-consumed-hash-ledger.test.ts \
  src/tests/ci/content-runtime-preparation.test.ts
bunx biome check src/lib/references/ src/lib/content/content-runtime-preparation.ts \
  src/lib/content/content-runtime-fingerprints.ts
bun run prepare:content-runtime
bun run typecheck
```
