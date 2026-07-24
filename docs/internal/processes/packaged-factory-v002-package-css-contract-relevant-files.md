# Packaged Factory 0.0.2 Package and CSS Contract Relevant Files

Use these files when proving or extending the Batch 1 host contract for the
five `@you-agent-factory/*` packages at exact `0.0.2` (clean-consumer install,
split acquisition, host pins, Next transpile posture, global CSS order,
visualizer theme custom properties).

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
| `@you-agent-factory/packaged-factories` | First-party factory definitions via allowlisted filesystem pull |

## Key files (story 001 — clean-consumer install)

| Path | Role |
| --- | --- |
| `src/lib/packaged-factory-v002/five-package-pins.ts` | Pure exact-pin constants for the five packages at `0.0.2` |
| `src/lib/packaged-factory-v002/clean-consumer-manifest.ts` | Pure consumer `package.json` builder + fail-closed override/link checks |
| `src/lib/packaged-factory-v002/clean-consumer-install.ts` | Disposable temp-dir registry install + installed version readback |
| `src/lib/packaged-factory-v002/clean-consumer-install.test.ts` | Live registry install success + unpublished fail-closed proof |

## Key files (story 002 — library exports + packaged-factories FS pull)

| Path | Role |
| --- | --- |
| `src/lib/packaged-factory-v002/required-public-exports.ts` | Pure required library surface list (recording parser, replay projections, visualizer components/styles) |
| `src/lib/packaged-factory-v002/export-map-coverage.ts` | Pure `exports` map coverage helpers (exact + single-segment `*` patterns) |
| `src/lib/packaged-factory-v002/public-export-proof.ts` | Clean-consumer install + export-map-gated resolve/import proof for ESM libraries |
| `src/lib/packaged-factory-v002/packaged-factories-allowlist.ts` | Docs-owned allowlist: slug order + `factories/<slug>/factory.json` + optional deep-research companion |
| `src/lib/packaged-factory-v002/packaged-factories-filesystem-pull.ts` | Resolve package root via `package.json`, read allowlisted paths, stay inside root, fail closed on missing/wrong version |
| `src/lib/packaged-factory-v002/split-acquisition-proof.ts` | Combined one-install proof: library exports + packaged-factories FS pull |
| `src/lib/packaged-factory-v002/public-export-proof.test.ts` | Live library export proofs + allowlisted FS pull + fail-closed cases |

### Split acquisition contract

**ESM libraries** (declared public exports only):

- `@you-agent-factory/client` root — recording parser
- `@you-agent-factory/factory-replay` root — replay projections
- `@you-agent-factory/factory-visualizers` root + `./styles.css`

**packaged-factories@0.0.2** (direct filesystem pull; no exports map required):

1. Resolve `@you-agent-factory/packaged-factories/package.json` to locate the
   package root and assert exact version `0.0.2`.
2. Read required allowlisted relative paths in order:
   `factories/goal/factory.json` → `subagent` → `fusion` → `review` →
   `quorum` → `tts` → `deep-research`.
3. When present, also read optional companion
   `factories/deep-research/scripts/deep-research.workflow.js` as UTF-8 text
   only (never execute / never derive stages/workers/call graphs).
4. Fail closed only when an allowlisted required file is missing/unreadable or
   the installed version is wrong. Absence of an `exports` map is expected.

Do **not** invent fake export maps or treat nested paths outside the docs-owned
allowlist as public surfaces.

## Key files (story 003 — host exact pins)

| Path | Role |
| --- | --- |
| `package.json` | Exact `"0.0.2"` pins for all five Batch 1 packages |
| `bun.lock` | Lockfile resolving a single components@0.0.2 (no leftover 0.0.0) |
| `src/lib/packaged-factory-v002/host-package-pins.ts` | Pure declared-pin + dual-components fail-closed helpers |
| `src/lib/packaged-factory-v002/host-package-pins-proof.ts` | Reads host package.json + installed versions + walks node_modules for components |
| `src/lib/packaged-factory-v002/host-package-pins.test.ts` | Observable host pin contract (declared + installed + single components) |

## Patterns

- Prefer a disposable temporary consumer directory for install/acquisition
  proof so the docs tree is not polluted; always clean up after the proof.
- Build the consumer manifest with exact `"0.0.2"` pins and reject
  `overrides` / `resolutions` / `pnpm` / `workspaces` plus `link:` / `file:` /
  `workspace:` / `portal:` dependency redirects before install.
- Prove success by reading each installed `node_modules/<pkg>/package.json`
  `version` field (observable install result), not by scanning host source.
- Prove fail-closed behavior with a real registry install against an
  unpublished version string; do not continue with substitutes on non-zero
  `npm install`.
- Keep pure pin/manifest/allowlist helpers IO-free so later host-pin contract
  tests can reuse the same five-package list without spawning installs.
- For library public-export proofs: read the installed package `exports` map
  first; fail closed when the map is missing or does not cover the required
  subpath; only then `createRequire(consumer/package.json).resolve(specifier)`
  and import/read.
- For packaged-factories: resolve `package.json` → package root, then join only
  allowlisted relative paths; reject `..` / absolute / non-allowlisted paths;
  realpath-bound so symlinks cannot escape the package root.
- Do **not** wait for a packaged-factories `exports` map republish — direct
  allowlisted filesystem pull is the locked Batch 1 acquisition policy.
- Host pin proof: assert exact `"0.0.2"` in docs `package.json` dependencies,
  read each installed `node_modules/@you-agent-factory/*/package.json` version,
  and walk nested `node_modules` so leftover `components@0.0.0` cannot hide
  beside `0.0.2`.

## Verification

```bash
bun test src/lib/packaged-factory-v002/
bunx biome check src/lib/packaged-factory-v002/
bun run typecheck
```

## Related

- Related components host integration:
  `docs/internal/processes/factory-components-host-integration-relevant-files.md`
  (historical `@0.0.0` notes; Batch 1 host pin is exact `0.0.2`)
- Similar public-export resolver pattern for `@you-agent-factory/api`:
  `src/lib/references/api-package-artifact-resolver.ts`
- PRD lane: `packaged-factory-v002-package-css-contract`
