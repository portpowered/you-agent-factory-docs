# Package Artifact Resolver (W03) Relevant Files

Use these files when implementing or extending build/server acquisition of
`@you-agent-factory/api` public export artifacts (resolver, validators, ledger,
`prepare:content-runtime` wiring).

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
| `package.json` | Runtime dependency on `@you-agent-factory/api@0.0.0` |

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
- Later stories (format-version gate, consumed-hash ledger, prepare wiring,
  browser-bundle exclusion) should extend this surface rather than inventing a
  second acquisition path.

## Verification

```bash
bun test src/lib/references/api-package-artifact-resolver.test.ts \
  src/lib/references/api-package-manifest-membership.test.ts
bunx biome check src/lib/references/
bun run typecheck
```
