# Packaged Factory 0.0.2 Package and CSS Contract Relevant Files

Use these files when proving or extending the Batch 1 host contract for the
five `@you-agent-factory/*` packages at exact `0.0.2` (clean-consumer install,
public exports, host pins, Next transpile posture, global CSS order, visualizer
theme custom properties).

## Ownership fence

This lane owns only:

- dependency / lockfile pins for the five packages
- `next.config.ts` `transpilePackages` posture for this family
- `src/app/globals.css` package stylesheet order
- focused package/CSS contract tests under `src/lib/packaged-factory-v002/`

Do **not** add packaged-factories index pages, shared factory-replay UI,
landing Youi wiring, or upstream npm publish repairs in this lane.

## Package set (exact 0.0.2)

| Package | Role in Batch 1 |
| --- | --- |
| `@you-agent-factory/client` | Recording parser / transport-neutral contracts |
| `@you-agent-factory/components` | Host UI + styles foundation (`styles.css`) |
| `@you-agent-factory/factory-replay` | Replay projections |
| `@you-agent-factory/factory-visualizers` | Visualizer components + `styles.css` (includes React Flow base CSS) |
| `@you-agent-factory/packaged-factories` | First-party factory definitions / deep-research source |

## Key files (story 001 — clean-consumer install)

| Path | Role |
| --- | --- |
| `src/lib/packaged-factory-v002/five-package-pins.ts` | Pure exact-pin constants for the five packages at `0.0.2` |
| `src/lib/packaged-factory-v002/clean-consumer-manifest.ts` | Pure consumer `package.json` builder + fail-closed override/link checks |
| `src/lib/packaged-factory-v002/clean-consumer-install.ts` | Disposable temp-dir registry install + installed version readback |
| `src/lib/packaged-factory-v002/clean-consumer-install.test.ts` | Live registry install success + unpublished fail-closed proof |

## Key files (story 002 — declared public exports)

| Path | Role |
| --- | --- |
| `src/lib/packaged-factory-v002/required-public-exports.ts` | Pure required surface list (recording parser, replay projections, visualizer components/styles, packaged-factories manifest + `./factories/<slug>.json`, deep-research) |
| `src/lib/packaged-factory-v002/export-map-coverage.ts` | Pure `exports` map coverage helpers (exact + single-segment `*` patterns) |
| `src/lib/packaged-factory-v002/public-export-proof.ts` | Clean-consumer install + export-map-gated resolve/import proof |
| `src/lib/packaged-factory-v002/public-export-proof.test.ts` | Live proofs for client/replay/visualizers + fail-closed packaged-factories gap |

### Declared packaged-factories contract (do not invent)

Documented public subpaths (from the upstream data-only package README):

- `@you-agent-factory/packaged-factories/manifest` — catalog order/metadata
- `@you-agent-factory/packaged-factories/factories/<slug>.json` — flattened factory definitions

Do **not** treat nested authored paths such as
`factories/<slug>/factory.json` or `factories/<slug>/scripts/*.js` as public
exports. Those are package-internal source trees.

**Current registry gap:** published `packaged-factories@0.0.2` ships the
authored `factories/` tree with **no** `exports` map. The proof fails closed
(`missing-export-map`) until upstream republishes the data-only catalog
artifact with the documented export map. See
`tasks/ideas-to-review/packaged-factory/packaged-factories-0-0-2-export-map-mismatch.md`.

## Patterns

- Prefer a disposable temporary consumer directory for install/export proof so
  the docs tree is not polluted; always clean up after the proof.
- Build the consumer manifest with exact `"0.0.2"` pins and reject
  `overrides` / `resolutions` / `pnpm` / `workspaces` plus `link:` / `file:` /
  `workspace:` / `portal:` dependency redirects before install.
- Prove success by reading each installed `node_modules/<pkg>/package.json`
  `version` field (observable install result), not by scanning host source.
- Prove fail-closed behavior with a real registry install against an
  unpublished version string; do not continue with substitutes on non-zero
  `npm install`.
- Keep pure pin/manifest helpers IO-free so later host-pin contract tests can
  reuse the same five-package list without spawning installs.
- For public-export proofs: read the installed package `exports` map first;
  fail closed when the map is missing or does not cover the required subpath;
  only then `createRequire(consumer/package.json).resolve(specifier)` and
  import/read. Never walk undocumented package directories to invent paths.
- Legacy Node resolution without an `exports` map can invent filesystem paths
  (for example nested `factories/<slug>/factory.json`); those must still fail
  the contract because they are not declared public exports.

## Verification

```bash
bun test src/lib/packaged-factory-v002/
bunx biome check src/lib/packaged-factory-v002/
bun run typecheck
```

## Related

- Prior components host integration:
  `docs/internal/processes/factory-components-host-integration-relevant-files.md`
  (still documents host `@0.0.0` until story 003 pins `0.0.2`)
- Similar public-export resolver pattern for `@you-agent-factory/api`:
  `src/lib/references/api-package-artifact-resolver.ts`
- PRD lane: `packaged-factory-v002-package-css-contract`
