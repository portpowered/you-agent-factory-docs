# Factory references W00 baseline — relevant files

Use this file when capturing or refreshing the W00 contract/route baseline under
`docs/temp/references/`.

## Ownership

| Path | Role |
| --- | --- |
| `docs/temp/references/baseline.md` | Human-readable W00 baseline (committed) |
| `docs/temp/references/fixtures/**` | Deterministic inventory fixtures (committed when present) |
| `docs/temp/references/plan.md` | Planner PRD/plan (gitignored scratch; do not commit) |
| `node_modules/@you-agent-factory/api/package.json` | Installed API package identity source |
| `node_modules/@you-agent-factory/components/package.json` | Installed components package identity source |

## Gitignore carve-out

Planner scratch under `docs/temp/` stays ignored. The published W00 baseline is
an exception:

- ignore `docs/temp/*`
- un-ignore `docs/temp/references/`
- re-ignore `docs/temp/references/*`
- un-ignore `baseline.md` and `fixtures/**`

Do not force-add other `docs/temp/` paths. Do not treat recorded inventory
counts in later fixtures as permanent product limits.

## Package identity read path

`@you-agent-factory/api` does not export `./package.json`. Read version/peers
from the installed package root on disk after `bun install`, not via a public
subpath import. Consume contract artifacts only through public subpaths
(`@you-agent-factory/api/manifest`, `.../openapi`, `.../schemas/*`, etc.).

## Manifest export inventory

Read `@you-agent-factory/api/manifest` (resolves to
`generated/manifest.json`). Record every key under `exports` with:

- `family`, `path`, `artifactHash`
- documentation: `formatVersion`, `visibility`, `sourceHash` (plus title /
  description when useful)
- lifecycle: `state`, `since`, `formatVersion`, `itemId`

Also record manifest root `packageId`, `packageVersion`, `formatVersion`,
`sourceCommit`, and `familyFormatVersions`. Export count must match the
installed artifact membership (currently 10); do not copy plan prose if the
package differs. With `packageVersion` `0.0.0`, prefer format versions and
hashes over semver for freshness.

## OpenAPI inventory

Read `@you-agent-factory/api/openapi` (resolves to
`generated/openapi/openapi.yaml`). Parse the YAML and record:

- OpenAPI version (`openapi` root field) and `info.title` / `info.version`
- Path count: `Object.keys(paths).length`
- Operation count: HTTP method entries on each path item (`get`/`put`/`post`/
  `delete`/`options`/`head`/`patch`/`trace`)
- Tag count: document-level `tags` array length (and names when useful)
- Component schema count: `components.schemas` keys
- Shared parameter count: `components.parameters` keys
- Shared response count: `components.responses` keys

Derive counts from the installed artifact. Do not copy plan prose when the
package differs. Counts are baseline drift observations, not permanent product
limits.

## Configuration schema inventory

Read the three public schema subpaths:

- `@you-agent-factory/api/schemas/factory` → `generated/schemas/factory.schema.json`
- `@you-agent-factory/api/schemas/you-config` → `generated/schemas/you-config.schema.json`
- `@you-agent-factory/api/schemas/mock-workers` → `generated/schemas/mock-workers.schema.json`

For each schema record:

- `$id`, `$schema` (Draft 2020-12 on this install), and title when useful
- Root-property count: `Object.keys(schema.properties).length`
- `$defs` count: `Object.keys(schema.$defs).length`
- Root property key names (for reviewer verification)

Derive counts from the installed Draft JSON Schema artifacts. Do not copy plan
prose when the package differs. Current install: factory 18/91, you-config 3/6,
mock-workers 2/5. Counts are baseline drift observations, not permanent product
limits.
