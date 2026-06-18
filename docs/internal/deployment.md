# GitHub Pages deployment contract

This document describes how the docs site is published to GitHub Pages on `main`. It is scoped to the automation contract only; it does not cover docs-shell UI, navigation, or content authoring.

## Automatic publish path

Pushes and merges to `main` trigger `.github/workflows/deploy-pages.yml`. There is no separate manual publish command for production docs.

When validation succeeds, the workflow publishes the static export automatically through the supported GitHub Pages Actions path (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`). Failed validation blocks deployment for that run.

## Validation gate

Deployment eligibility is tied to the same root `Makefile` contract used locally:

| Target | Purpose |
| --- | --- |
| `make setup` | Install dependencies (`bun install`) |
| `make check` | Typecheck and lint |
| `make test` | Unit and component tests (`bun test`) |
| `make build` | Production static export (`bun run build`) |
| `make budget` | Exported-site route and asset budget enforcement against the built GitHub Pages surface |

The workflow runs those targets in the `validate` job before any deploy step can start. Do not add deploy-only validation commands; extend the Makefile and call it from the workflow instead.

`deploy` has `needs: validate`, so it never runs in parallel as an independent publish path for the same `main` update.

## Artifact handoff

1. `make build` writes the Next.js static export to `out/`.
2. `validate` runs `actions/configure-pages` and uploads `out/` with `actions/upload-pages-artifact`.
3. `deploy` runs `actions/deploy-pages`, which consumes the artifact from the same workflow run.

Reviewers can verify the contract directly in `.github/workflows/deploy-pages.yml`; this document should stay aligned with that file.

## Repo-level assumptions to preserve

### Static export output

- Build output directory: `out/`
- Export mode: `output: "export"` in `next.config.ts`
- GitHub Pages project-site base path: `SITE_BASE_PATH` in `src/lib/site.ts` (currently `/you-agent-factory-docs`)
- `basePath`, `assetPrefix`, `trailingSlash: true`, and `images.unoptimized: true` must remain compatible with GitHub Pages hosting

Changing base-path or export settings requires updating `src/lib/site.ts`, `next.config.ts`, and any served-export tests that assert route behavior.

### GitHub Pages Actions requirements

- Workflow trigger: `push` to `main` only for this deploy path
- Permissions: `contents: read`, `pages: write`, `id-token: write`
- `deploy` uses the `github-pages` environment so repository Pages settings and environment protection apply
- `concurrency.group: pages-${{ github.ref }}` with `cancel-in-progress: false` avoids overlapping production deploy races
- Artifact upload must stay in the same workflow file as `deploy-pages` so the Pages artifact is visible to the deploy job

### Runtime and tooling

- CI uses `oven-sh/setup-bun@v2`; local and CI verification should keep using the same Bun-driven Makefile targets
- There is no required server runtime on GitHub Pages; the published site is fully static

## What this workflow does not do

- It does not replace pull-request CI or other quality gates defined elsewhere in the repository
- It does not publish from branches other than `main` through this workflow
- It does not introduce a second undocumented validation surface for deploy

## Related maintainer references

- Workflow implementation: `.github/workflows/deploy-pages.yml`
- Process file index: `docs/internal/processes/ci-pages-deploy-gate-foundation-relevant-files.md`
- Static export scaffold assumptions: `docs/internal/processes/bootstrap-static-export-foundation-relevant-files.md`
