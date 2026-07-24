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

## Verification

```bash
bun test src/lib/packaged-factory-v002/clean-consumer-install.test.ts
bunx biome check src/lib/packaged-factory-v002/
bun run typecheck
```

## Related

- Prior components host integration:
  `docs/internal/processes/factory-components-host-integration-relevant-files.md`
  (still documents host `@0.0.0` until story 003 pins `0.0.2`)
- PRD lane: `packaged-factory-v002-package-css-contract`
