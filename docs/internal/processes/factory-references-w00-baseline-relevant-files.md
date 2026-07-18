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
