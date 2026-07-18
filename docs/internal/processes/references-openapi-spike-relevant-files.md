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

## Single-page route projection

- `src/lib/references-openapi-spike/resolve-openapi-artifact.ts` — resolves the
  installed OpenAPI YAML via the package's `manifest` JSON export + known
  relative path (do not `require.resolve` the `.yaml` export from Next-bundled
  modules; fumadocs-mdx/webpack will try to parse YAML as JS). Normalizes
  Turbopack `[project]/` virtual paths before `fs` reads.
- `src/lib/references-openapi-spike/openapi-server.ts` — `createOpenAPI` loads
  the packaged YAML via Bun into a schema-map input (avoids happy-dom file-URL
  breakage under `bun test`), then `openapiSource(..., { per: "file" })`
  projects every operation onto one virtual page.
- `src/lib/references-openapi-spike/api-page.tsx` — `createAPIPage` binder for
  the spike server.
- `src/app/(dev)/references-openapi-spike/page.tsx` — isolated non-production
  spike route (`/references-openapi-spike`). Hidden in production unless
  `ENABLE_OPENAPI_SPIKE=1`. Does not edit shared nav/search/sitemap inventories.
- `src/lib/references-openapi-spike/single-page-route.test.ts` — proves package
  resolution and that `per:"file"` yields one page with every published op.

## Temporary install policy

- Spike may add exact `fumadocs-openapi` and required peers (for example
  `@scalar/api-client-react`) to `package.json` / lockfile for render evidence.
- Do not treat those pins as the final production OpenAPI dependency set.
- Do not install `fumadocs-openapi` 11.2 while remaining on Fumadocs 16.9;
  upgrade requires a coordinated `fumadocs-core` + `fumadocs-ui` 16.10 bump.
- Temporary CSS import: `fumadocs-openapi/css/preset.css` in `globals.css` for
  the spike only; revert or relocate when W08 productionizes references UI.
- Document-object `createOpenAPI` input (load packaged YAML with Node `fs` +
  `js-yaml`) avoids absolute file-path input. Under `bun test`, happy-dom's URL
  polyfill still breaks fumadocs-openapi's ref-parser — run projection
  assertions via plain `bun` child process
  (`assert-single-page-projection.ts`) instead of calling `openapiSource`
  inside happy-dom.
