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
