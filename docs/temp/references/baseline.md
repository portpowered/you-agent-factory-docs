# W00 Contract and route baseline

Working set: `docs/temp/references/`  
Lane ownership: baseline artifacts and focused fixture tests only. This lane does
**not** implement the package resolver, renderers, route families, or production
UI.

Sources for package identity are the installed packages under `node_modules`
(package resolution), not invented values. Re-check these fields after any
`@you-agent-factory/api` or `@you-agent-factory/components` install change.

## Package versions and peer constraints

Recorded from the installed package roots:

| Package | Installed version | Source |
| --- | --- | --- |
| `@you-agent-factory/api` | `0.0.0` | `node_modules/@you-agent-factory/api/package.json` → `version` |
| `@you-agent-factory/components` | `0.0.0` | `node_modules/@you-agent-factory/components/package.json` → `version` |

Site `package.json` pins both dependencies at `0.0.0`, matching the installed
identity above.

### `@you-agent-factory/api` peers and engines

- `peerDependencies`: **absent** (no peers published on the installed package).
- `peerDependenciesMeta`: **absent**.
- `engines`: **absent**.
- `dependencies`: **absent** (data-only contract package; consume via public
  subpath exports such as `@you-agent-factory/api/manifest`).

Note: the package `exports` map does not expose `./package.json`. Version and
peer fields are read from the installed package root on disk after resolution,
not via a public subpath import.

### `@you-agent-factory/components` peers and engines

- `peerDependencies`:
  - `react`: `^19.0.0`
  - `react-dom`: `^19.0.0`
- `peerDependenciesMeta`: **absent**.
- `engines`: **absent**.

These React peers are the relevant peer constraints for the components package
at the installed `0.0.0` identity.

### Freshness note

Both packages currently publish version `0.0.0`. Later baseline sections treat
manifest `formatVersion` values and artifact hashes as more useful freshness
signals than semver alone.

## Manifest exports

Source: installed `@you-agent-factory/api/manifest`
(`node_modules/@you-agent-factory/api/generated/manifest.json`), not plan prose.

### Manifest root

| Field | Value |
| --- | --- |
| `packageId` | `you-agent-factory.api` |
| `packageVersion` | `0.0.0` |
| `formatVersion` | `1.0.0` |
| `sourceCommit` | `280e13dbb101809532034fef24c6b46144f7f7cc` |
| Export count | **10** (matches installed membership; plan text also expects 10) |

`familyFormatVersions` on the installed manifest:

| Family | Format version |
| --- | --- |
| `cli` | `1.0.0` |
| `config` | `1.0.0` |
| `javascript` | `1.0.0` |
| `mcp` | `1.0.0` |
| `openapi` | `1.0.0` |
| `shared` | `1.0.0` |

Because `packageVersion` is `0.0.0`, treat each export’s documentation
`formatVersion`, lifecycle `formatVersion`, and `artifactHash` /
documentation `sourceHash` as the practical freshness signals rather than
semver alone.

### Export inventory

Each row is one key under `manifest.exports`. Lifecycle is published as
`state` / `since` / `formatVersion` / `itemId`. Documentation metadata below
records `formatVersion`, `visibility`, and `sourceHash` as published on each
export’s `documentation` object.

| Export id | Family | Path | Artifact hash | Doc format | Visibility | Doc source hash | Lifecycle state | Since | Lifecycle format |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `generated.cli.commands` | `cli` | `generated/cli/commands.json` | `6b32edebf7ea06619c958a4723cb96eb5f7c10aa2fcc112c273bf3f809c6424c` | `1.0.0` | `public` | `6b32edebf7ea06619c958a4723cb96eb5f7c10aa2fcc112c273bf3f809c6424c` | `active` | `0.0.0` | `1.0.0` |
| `generated.javascript.runtime-api` | `javascript` | `generated/javascript/runtime-api.json` | `4d1c70325407b340fdd6e072cf9f2f8c77c499001b1553a06691418e6e988247` | `1.0.0` | `public` | `4d1c70325407b340fdd6e072cf9f2f8c77c499001b1553a06691418e6e988247` | `active` | `0.0.0` | `1.0.0` |
| `generated.joined.contracts.common.deprecations` | `shared` | `generated/joined/contracts/common/deprecations.schema.json` | `7ce45d618efb3116525acf3acf08766a550d77bd12f4e525e0f1789dc38e17d8` | `1.0.0` | `public` | `7ce45d618efb3116525acf3acf08766a550d77bd12f4e525e0f1789dc38e17d8` | `active` | `0.0.0` | `1.0.0` |
| `generated.joined.contracts.common.documentation` | `shared` | `generated/joined/contracts/common/documentation.schema.json` | `8126c0a29e39b53733165db4177d486a109cb2b263839d0bd9e6f359cffa4e60` | `1.0.0` | `public` | `8126c0a29e39b53733165db4177d486a109cb2b263839d0bd9e6f359cffa4e60` | `active` | `0.0.0` | `1.0.0` |
| `generated.joined.contracts.manifest` | `shared` | `generated/joined/contracts/manifest.schema.json` | `4dae080e46652c697025016b97d82a03437cdf27f3f0c43f1485812fa271a339` | `1.0.0` | `public` | `4dae080e46652c697025016b97d82a03437cdf27f3f0c43f1485812fa271a339` | `active` | `0.0.0` | `1.0.0` |
| `generated.mcp.tools` | `mcp` | `generated/mcp/tools.json` | `98eff642b8b6bf442de1e150e13bdb89a6beab05c1fec3a24aa270690e9ffb33` | `1.0.0` | `public` | `98eff642b8b6bf442de1e150e13bdb89a6beab05c1fec3a24aa270690e9ffb33` | `active` | `0.0.0` | `1.0.0` |
| `generated.openapi.openapi` | `openapi` | `generated/openapi/openapi.yaml` | `74932a7018dd449663cb9f858be203d4ec3d8de9d3b44f18e944259db0eec568` | `1.0.0` | `public` | `74932a7018dd449663cb9f858be203d4ec3d8de9d3b44f18e944259db0eec568` | `active` | `0.0.0` | `1.0.0` |
| `generated.schemas.factory` | `config` | `generated/schemas/factory.schema.json` | `06ddc805d0901db1f98fcffaab366655ed5764074a1f27a6b16ace51022a2a93` | `1.0.0` | `public` | `06ddc805d0901db1f98fcffaab366655ed5764074a1f27a6b16ace51022a2a93` | `active` | `0.0.0` | `1.0.0` |
| `generated.schemas.mock-workers` | `config` | `generated/schemas/mock-workers.schema.json` | `1aad74057b85a8c0d5c195e945832b373a0d37bbc7fc7efece5aa88085efd7d3` | `1.0.0` | `public` | `1aad74057b85a8c0d5c195e945832b373a0d37bbc7fc7efece5aa88085efd7d3` | `active` | `0.0.0` | `1.0.0` |
| `generated.schemas.you-config` | `config` | `generated/schemas/you-config.schema.json` | `d13af3b56397d8da27f47f7b7823a570583f8ac9207602df04364123bdcf88e1` | `1.0.0` | `public` | `d13af3b56397d8da27f47f7b7823a570583f8ac9207602df04364123bdcf88e1` | `active` | `0.0.0` | `1.0.0` |

Published documentation titles (canonical English) follow the pattern
`Published <export-id> contract`; descriptions follow
`Published <export-id> contract as raw JSON or YAML data.` Lifecycle `itemId`
matches the export id for every row above. On this install, each export’s
`artifactHash` equals its documentation `sourceHash`.

These counts and hashes are baseline observations for later drift detection,
not permanent product limits.
