# Factory Reference API Package Relevant Files

Use these files when acquiring published `@you-agent-factory/api` contract
artifacts from the docs host (reference bootstrap, later OpenAPI/schema
renderers).

## Package facts

| Fact | Value |
| --- | --- |
| Package | `@you-agent-factory/api@0.0.0` |
| Export style | Data-only raw JSON/YAML via package `exports` |
| Bootstrap public subpaths | `manifest`, `openapi`, `cli`, `mcp`, `schemas/factory`, `schemas/you-config`, `schemas/mock-workers`, `javascript/runtime` |
| Not in bootstrap allowlist | `joined/*` (still published by the package; reject unless a later lane opts in) |

The package provides **no** JavaScript runtime API. Resolve a public subpath,
then read the file as data. Do not hardcode `node_modules/...` joins and do not
import the package root or `generated/*` internals.

## Key host files

| Path | Role |
| --- | --- |
| `package.json` | Runtime dependency on `@you-agent-factory/api@0.0.0` |
| `src/lib/references/api-package-artifact-resolver.ts` | Build/server-only public-subpath resolver + UTF-8 loader |
| `src/lib/references/api-package-artifact-resolver.test.ts` | Proves public-subpath resolution and rejection of root/internal locators |

## Resolution contract

- Call `resolveYouAgentFactoryApiArtifactPath(subpath)` or
  `loadYouAgentFactoryApiArtifact(subpath)` with one of the documented public
  subpaths above.
- Resolution uses `createRequire(import.meta.url).resolve(...)` against the
  package export map (same host pattern as
  `src/lib/factory-components/host-package-styles.ts`).
- Package root (`""`, `"."`, `@you-agent-factory/api`) and package-internal
  paths (`generated/*`, `package.json`, `joined/*`, traversal) throw
  `YouAgentFactoryApiArtifactResolutionError` with an actionable message.
- Keep this module build/server-only. Browser components must receive
  serializable projections/props, not the resolver (see think-004).

## Follow-on lanes

- Manifest membership / `formatVersion` / consumed-hash ledger: think-002
- OpenAPI + configuration JSON Schema parse helpers: think-003
- Browser-bundle boundary proof: think-004
