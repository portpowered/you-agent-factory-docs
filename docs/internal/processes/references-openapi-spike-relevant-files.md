# References OpenAPI spike — relevant files

Non-production W01 single-page OpenAPI spike helpers. Do not treat this tree as
the shipped `/docs/references/api` surface.

## Dependency selection

- `src/lib/references-openapi-spike/dependency-selection.ts` — temporary
  `fumadocs-openapi` pin (`10.10.3` on Fumadocs 16.9) plus coordinated upgrade
  candidate (`11.2.2` with Fumadocs 16.10). Status is
  `non-production-temporary`; W08 chooses production pins.
- `src/lib/references-openapi-spike/dependency-selection.test.ts` — asserts
  installed package versions match the recorded selection and upgrade-risk
  notes.
- Narrative findings for planners: `docs/temp/references/` (gitignored local
  planner state). Commit machine-checkable selection constants; keep long-form
  measurements and risk writeups under `docs/temp/references/`.

## Temporary install policy

- Spike may add exact `fumadocs-openapi` and required peers (for example
  `@scalar/api-client-react`) to `package.json` / lockfile for render evidence.
- Do not treat those pins as the final production OpenAPI dependency set.
- Do not install `fumadocs-openapi` 11.2 while remaining on Fumadocs 16.9;
  upgrade requires a coordinated `fumadocs-core` + `fumadocs-ui` 16.10 bump.
