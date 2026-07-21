# CI and GitHub Pages Deploy Foundation Relevant Files

Use these files when aligning local Makefile targets with GitHub Actions CI and
Pages deploy for the rewrite-era foundation pipeline.

## Maintainer command contract

| Stage | Makefile target | Behavior |
| --- | --- | --- |
| Install | `make setup` | `bun install --frozen-lockfile` |
| Static analysis | `make check` | `typecheck` then `lint` (fails if either fails) |
| Tests | `make test` | Existing website test entrypoint |
| Reader-facing contracts | `make test-reader-facing` | Bounded search / layout shell / a11y suite (`bun run test:reader-facing`); included in `make ci` and `.github/workflows/ci.yml` |
| Critical a11y / responsive | `make a11y` | Critical-route axe, overflow, reduced-motion, layout-snapshot suite (`bun run test:a11y`); included in `make ci` and CI; reproduce with `make a11y` |
| CI alignment contracts | `make test-ci-contract` | Bounded workflow/Makefile alignment suite (`bun run test:ci-contract`); included in `make ci` and CI |
| Verify-contract | `make test-verify-contract` | Factory verifier/tooling contracts; fails closed if the required path list is empty |
| Build-contract | `make test-build-contract` | Build/export/base-path/Pages contracts |
| Integration | `make test-integration` | Production-integration path set for live shell/lifecycle contracts (after `make build`) |
| Static export / build | `make build` | Runs `bun run build:export` (`NEXT_STATIC_EXPORT=1`); produces `out/` for Pages and for budget/integration. Deploy-pages sets `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` on this step so project-site HTML references `/you-agent-factory-docs/_next`. |
| Local static-export benchmark (optional) | `make benchmark-static-export MODE=clean\|warm` | Opt-in profiled export with clean/warm prep. Clean removes `.next`, `out`, `.source`, and ignored generated outputs (deps stay installed); warm leaves artifacts in place. Prints a stable timing summary with `mode=`, stage wall times, cache reasons, scale counts, and non-identifying machine metadata. Reference machine + recorded <=180s evidence live in `docs/operations.md`; print the gate with `bun run prove:static-export-optimization-evidence`. Not part of CI/Pages. |
| Exported-site budget | `make budget` | Measures existing `out/` against factory baselines (total size, Next static JS, search bootstrap); never unconditional skip/`exit 0` |
| Component coverage | `make component-coverage` | Evaluates factory component + verifier coverage manifests via `bun run coverage`; never unconditional skip/`exit 0` |
| Registry validation | `make validate-data` | Registry content validation; included in `make ci` and CI |
| Linkcheck | `make linkcheck` | Documentation link validation; included in `make ci` and CI |

Workflows that call this contract:

- `.github/workflows/ci.yml` — Wave CI-1 parallel job graph (`check`, `unit-tests`, `reader-facing`, `a11y`, `contracts`, `component-coverage`, `content`, `static-export`, `integration`, `budget`) plus aggregate `ci-gate`; membership/edges in `src/lib/ci-required-path.ts`. Wave CI-2 trusted artifact handoff: after `make build`, `static-export` uploads Actions artifact `static-export-out` (trusted `out/` tree); `integration` and `budget` download that artifact, fail closed if `out/` is missing/empty, and run their gates — they must not run a second `make build` / `build:export`. Wave CI-3 Playwright Chromium install ownership (`CI_BROWSER_INSTALL_OWNERSHIP`): install (`bunx playwright install --with-deps chromium`) runs only on browser-backed required jobs `unit-tests`, `a11y`, and `integration` (`CI_BROWSER_INSTALL_REQUIRED_JOB_IDS`); non-browser jobs (`check`, `reader-facing`, `contracts`, `component-coverage`, `content`, `static-export`, `budget`, `ci-gate`) must not install Chromium (`CI_BROWSER_INSTALL_FORBIDDEN_JOB_IDS`). `unit-tests` keeps install because `make test` still launches Chromium (`CI_UNIT_TESTS_PLAYWRIGHT_CHROMIUM_EVIDENCE_PATHS`). Local full path stays sequential (`make ci`) and does not use Actions artifacts. CI-4 shards are not part of this wave.
- `.github/workflows/deploy-pages.yml` — setup → Playwright Chromium → check → test → build (with `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs`) → `make guard-pages-deployed-artifact` → budget, then upload `out/` (Pages-focused subset; does not replace CI; unchanged by Wave CI-2 / CI-3)

Reproduce any failing workflow stage locally with the same `make <target>` after
`make setup` (and `bunx playwright install --with-deps chromium` when website
tests need a browser — local `make a11y` / `make test-integration` / browser-backed
`make test` still install or use Chromium when those targets need them). Map a
failed Actions child job to its make target via `src/lib/ci-required-path.ts`
(`CI_REQUIRED_JOB_GRAPH`); treat **ci-gate** as the aggregate required check, not
a linear `verify` job. The full local required path stays sequential: `make ci`
(builds once on one machine, then `test-integration` / `budget` — no Actions
artifact download). Deploy-pages remains a separate Pages-focused subset
unchanged by Wave CI-1 / CI-2 / CI-3.

### Project-site export (local match for deploy-pages)

```sh
GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs make build
```

Unset `GITHUB_PAGES_BASE_PATH` keeps `/` for local preview and root Pages sites;
the project site requires the `/you-agent-factory-docs` repository prefix.

After that export, `out/index.html` (and other shipped pages) must reference
`/you-agent-factory-docs/_next/...` assets — not bare `/_next/...`. Confirm with
`exportHtmlReferencesBasePathAssets` / `exportHtmlReferencesRootLevelNextAssets`
from `src/lib/build/verify-export-base-path.ts`, or run the consumer proof:

```sh
bun run test:website:export-consumers
```

That proof builds with `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` and
checks representative home/docs/blog hrefs plus the baked search bootstrap
(`/you-agent-factory-docs/api/search`) via
`verifyProjectSiteExportDirectory`. Quality gate for the runtime-path-consumers
lane: `make check`, `make test-build-contract`, `bun run test:website:static-search`,
and `bun run test:website:export-consumers`.

## Key files

| Path | Role |
| --- | --- |
| `Makefile` | Public local/CI command contract for the stages above |
| `src/lib/ci-required-path.ts` | Required-path inventory + Wave CI-1 job-graph contract (`CI_REQUIRED_JOB_GRAPH`: suite membership per job, `static-export` → `integration`/`budget` edges, `ci-gate` aggregate) plus Wave CI-2 trusted artifact handoff (`CI_STATIC_EXPORT_ARTIFACT_HANDOFF`: stable name `static-export-out`, producer `static-export`, consumers `integration`/`budget`) plus Wave CI-3 browser-install ownership (`CI_BROWSER_INSTALL_OWNERSHIP`: required `unit-tests`/`a11y`/`integration`, forbidden on non-browser peers; `unit-tests` kept because `make test` launches Chromium). Helpers distinguish `needs: static-export` ordering (`ciJobDependsOnStaticExportJob`) from artifact consumption / forbidden local rebuild (`ciJobConsumesStaticExportArtifact`, `ciJobForbidsLocalStaticExportRebuild`, `ciJobMustRebuildStaticExportLocally`) and install ownership (`ciJobRequiresPlaywrightChromiumInstall` / `ciJobForbidsPlaywrightChromiumInstall`). `make ci` prerequisites remain sequential (local path builds once; no Actions artifact). |
| `.github/workflows/ci.yml` | Required PR/push parallel job graph + `ci-gate` (see `CI_REQUIRED_JOB_GRAPH`); Wave CI-2: `static-export` uploads Actions artifact `static-export-out` (`out/`), `integration`/`budget` download it and must not `make build`. Wave CI-3: Playwright Chromium install only on `unit-tests`/`a11y`/`integration`. Contract tests in `src/lib/ci-required-path.test.ts` and `src/tests/ci/github-actions-make-ci.test.ts` assert upload/download steps, forbidden consumer rebuild, and browser-install presence/absence. Does not call `make ci` |
| `.github/workflows/deploy-pages.yml` | Main-branch Pages validate + deploy; artifact path `out/` |
| `docs/operations.md` | Maintainer-facing CI/deploy posture; Wave CI-2 Actions artifact handoff (`static-export-out`) vs sequential local `make ci` (no Actions artifact); Wave CI-3 Playwright install ownership (browser-backed jobs only); local static-export benchmark command, summary field contract (including non-identifying machine metadata), agreed reference machine, and recorded optimize-next-static-export evidence (clean <=180s, warm reuse, determinism) |
| `package.json` | Underlying Bun scripts (`typecheck`, `lint`, `test`, `build:export`, `benchmark:static-export`) |
| `src/lib/build/static-export-profile.ts` | Optional static-export stage timing contract (`PROFILE_STATIC_EXPORT=1`); off by default; summary includes `mode=`, stage timings, cache reasons, scale counts, and non-identifying machine metadata (`osFamily`, `cpuArchitecture`, `logicalCpuCount`, `runtimeName`, `runtimeVersion`) |
| `src/lib/build/static-export-profile-diagnostics.ts` | Cache artifact snapshot + scale-count collectors (routes/locales/chunks); content-runtime hit/miss from fingerprint store + contracted output presence; fumadocs hit/miss from immutable snapshot store + `.source` presence; Next compilation hit/miss from usable non-empty `.next/cache` (clean mode always `miss:clean-mode-regenerates`); search-index emission hit/miss from `.source/.export-search-parsed-documents.json` presence (clean mode always `miss:clean-mode-regenerates`); missing diagnostics degrade to `not-available` |
| `src/lib/build/static-export-benchmark-prep.ts` | Clean/warm prep: clean wipes `.next`/`out`/`.source`/ignored generated outputs (compiler cache included); warm is a no-op that preserves `.next/cache` |
| `src/lib/build/static-export-compiler-cache.ts` / `static-export-compiler-cache.test.ts` | Next/compiler cache policy: warm and ordinary `build:export` preserve a usable `.next/cache`; only clean benchmark prep wipes `.next`. Usability = non-empty `.next/cache` directory. |
| `src/lib/build/static-export-immutable-snapshot.ts` / `static-export-immutable-snapshot.test.ts` / `scripts/ensure-static-export-immutable-snapshot.ts` | Fingerprint-gated immutable snapshot for the fumadocs `.source` intermediate on `build` / `build:export` / profiled export. When contracted inputs (`src/content/docs`, `source.config.ts`, ensure/snapshot modules) are unchanged and `.source/server.ts` plus `.source/.static-export-immutable-snapshot.json` are present and valid, reuse skips `fumadocs-mdx`. Input changes, missing/corrupt store or output, and `--force-clean` / `STATIC_EXPORT_IMMUTABLE_SNAPSHOT_FORCE=1` regenerate. Reuses content-runtime fingerprint hashing helpers. |
| `src/lib/build/export-search-parsed-documents.ts` / `export-search-parsed-documents.test.ts` / `emit-export-search-index.ts` / `emit-export-search-index.test.ts` / `scripts/emit-export-search-index.ts` / `src/lib/search/load-search-documents.ts` / `create-search-catalog-from-documents.ts` | Search-index emission reuses fingerprint-gated parsed search documents (store: `.source/.export-search-parsed-documents.json`). Within one emit, registry loads once and documents are built per locale from that shared parse; warm reuse skips the source walk when the store fingerprint matches. Missing/corrupt store, fingerprint miss, incomplete locale coverage, or `EXPORT_SEARCH_PARSED_DOCUMENTS_FORCE=1` falls back to a full parse and refreshes the store. Orama bootstrap under `out/api/search` is still written from the resolved documents. |
| `src/lib/build/static-export-legacy-compile-graph.ts` / `static-export-legacy-compile-graph.test.ts` / `scripts/verify-static-export-legacy-compile-graph.ts` / `scripts/run-static-export-next-build.ts` / `bun run verify:static-export-legacy-compile-graph` | Post-B09 legacy compile-graph contract for `build:export`: App Router page inventory must omit retired Atlas/AI route modules (`/docs/models|modules|papers|training|systems`, `/topology`, `/docs/timeline`) and denylist owned paths; factory guides/concepts/techniques/documentation/glossary/blog page modules must remain; docs `generateStaticParams` filters retired Atlas collection slugs via `omitRetiredAtlasDocsStaticParams`; after Next export, `out/` must not contain HTML under those retired families (default + localized prefixes). `run-static-export-next-build.ts` sets `NEXT_STATIC_EXPORT=1`, resolves bundler via `STATIC_EXPORT_BUNDLER` (default webpack), runs the Next build, then verifies. |
| `src/lib/build/static-export-bundler.ts` / `static-export-bundler-correctness.ts` / `static-export-bundler-comparison.ts` / `static-export-bundler-bakeoff.ts` / `gather-static-export-bundler-observation.ts` / matching `*.test.ts` / `scripts/compare-static-export-bundlers.ts` / `bun run compare:static-export-bundlers` | Webpack vs Turbopack bake-off: shared correctness suite (export completes, base-path/build-contract, search-bootstrap, Turbopack NFT tracing); comparison decides adoption; recorded bake-off keeps **webpack** as locked `build:export` / `make build` default after Turbopack failed worktree root/`next` resolution (UTC 2026-07-10). `--live` re-runs both bundlers; `STATIC_EXPORT_BUNDLER=turbopack` overrides a single export for probes. |
| `src/lib/build/static-export-optimization-evidence.ts` / `static-export-optimization-evidence-recorded.ts` / `static-export-contracted-export-surfaces.ts` / matching `*.test.ts` / `scripts/prove-static-export-optimization-evidence.ts` / `bun run prove:static-export-optimization-evidence` | Story 007 evidence gate: pure evaluators for clean <=180s budget, warm faster + cache-hit reuse, and contracted-surface determinism (search bootstrap hashes + HTML base-path contract digests on directory landings `index.html` / `blog/index.html` / `docs/guides/index.html`). Recorded evidence on the M1 Max reference class (UTC 2026-07-10): clean ~111.6s, warm ~92.8s with hits on content-runtime / fumadocs snapshot / Next cache / search parsed docs. See also `verifyExportDirectoryLandings` in [repair-static-export-trailing-slash-directory-routes-relevant-files.md](./repair-static-export-trailing-slash-directory-routes-relevant-files.md). |
| `src/lib/content/content-runtime-preparation.ts` / `content-runtime-fingerprints.ts` / `write-file-if-changed.ts` / `render-typescript-literal.ts` / `ensure-graph-registry-runtime.ts` / `root-graph-registry-load.ts` / `scripts/prepare-content-runtime.ts` / `scripts/run-next.ts` / `bun run prepare:content-runtime` | Default prepare preserves valid `.source` and ignored generated runtime modules. Steps are fingerprint-gated (inputs + generator identity + schemas); cache hits skip generation when the output is usable. Independent generators with disjoint `outputPath` values (and no unmet `dependsOn`) run concurrently in deterministic waves; overlapping outputs or `dependsOn` edges stay sequenced. Pass `concurrency: false` to force serial waves (byte-equivalence / debugging). Generators emit contracted runtime modules via shared `writeFileIfChanged` / `writeFileIfChangedSync` (identical bytes leave the file untouched). Biome-stable TypeScript literals come from `renderTypescriptLiteral` — content-runtime generators do not spawn per-file `bunx biome format` subprocesses. Live graph-registry generation/parse runs at most once per prepare→build path: `prepare:content-runtime` owns regeneration when fingerprints miss; `scripts/run-next.ts` calls `ensureGraphRegistryRuntimeOnce` so a warm fingerprint skips a second generate/parse; force-clean prepare regenerates the graph runtime once, then run-next reuses it. Alternate content roots memoize parsed graph records in `syncGraphRegistryForContentRoot` (live `CONTENT_ROOT` reuses the generated runtime module without re-reading JSON). Opt-in wipe: `--force-clean` or `CONTENT_RUNTIME_FORCE_CLEAN=1` (truthy: `1`/`true`/`yes`) clears outputs and the fingerprint store then regenerates all steps. Completeness still fails clearly when a required output is missing after preparation. Fingerprint store: `src/lib/content/generated/.content-runtime-fingerprints.json` (gitignored). Focused incremental proofs (`incremental proof:` in `src/tests/ci/content-runtime-preparation.test.ts`) cover cache-hit byte identity, schema invalidation, empty/corrupt recovery, force-clean byte-equivalence, and warm-vs-force-clean stage improvement. |
| `src/lib/content/registry.ts` / `pages.ts` / `registry-load-cache.test.ts` / `pages-load-cache.test.ts` | Process/build-scoped memoization for static-export route generation: `loadRegistry` shares one successful parse Promise per registry root (failed loads are not retained); `loadPublishedDocsPages` / `loadPublishedDocsPagesSync` / shipped variants share one scan per `(rootDir, locale, variant)`. Test helpers `resetRegistryLoadCacheForTests` / `resetDocsPageLoadCacheForTests` and parse counters prove reuse. Mid-build content is assumed immutable; a new process (or explicit reset) re-parses after input changes. |
| `src/lib/build/run-profiled-static-export.ts` | Opt-in profiled runner: discrete timed stages + stable timing summary with cache/scale/machine-metadata diagnostics |
| `scripts/run-profiled-static-export-build.ts` / `bun run build:export:profile` | Maintainer entrypoint for profiled export without clean wipe; does not replace `make build` / `build:export` |
| `scripts/run-static-export-benchmark.ts` / `bun run benchmark:static-export` / `make benchmark-static-export MODE=…` | Documented clean/warm benchmark: prep + profiled export + mode-labeled summary |
| `src/lib/build/static-export-profile.test.ts` / `static-export-profile-diagnostics.test.ts` / `static-export-benchmark-prep.test.ts` / `static-export-compiler-cache.test.ts` / `static-export-legacy-compile-graph.test.ts` / `export-search-parsed-documents.test.ts` / `emit-export-search-index.test.ts` / `run-profiled-static-export.test.ts` / `static-export-bundler.test.ts` / `static-export-bundler-correctness.test.ts` / `static-export-bundler-comparison.test.ts` / `static-export-bundler-bakeoff.test.ts` / `static-export-optimization-evidence.test.ts` / `static-export-optimization-evidence-recorded.test.ts` / `static-export-contracted-export-surfaces.test.ts` / `bun run test:static-export-profile-contract` | Focused benchmark-contract gate: summary shape (stages, total, mode, cache reasons, scale counts, non-identifying machine metadata), optional-off default, clean/warm prep semantics (warm preserves `.next` compiler cache), legacy Atlas/AI compile-graph absence + factory route presence, search-index parsed-document reuse/fallback, webpack vs Turbopack correctness comparison + locked webpack default, recorded <=180s / warm / determinism evidence, stubbed stage runner — no full timed export required |
| `src/lib/build/static-export.ts` | Single `normalizeGitHubPagesBasePath` → `basePath` + `assetPrefix` contract; export-only `trailingSlash: true` for directory landings on Pages; `next.config.ts` spreads `resolveNextConfigForBuildMode()` (no hardcoded Pages prefix). See [repair-static-export-trailing-slash-directory-routes-relevant-files.md](./repair-static-export-trailing-slash-directory-routes-relevant-files.md). |
| `src/lib/build/built-app-html-paths.ts` | Live project-site fixture default `BUILT_APP_GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` (not retired `/ai-model-reference`); shared by export-search artifact matching and built-HTML path normalization |
| `src/lib/navigation/site-path.ts` | Runtime `withBasePath(href, basePath)` / `stripBasePathFromHref` — prefixes or strips internal absolute hrefs; leaves empty-base, external, hash, and already-prefixed hrefs unchanged |
| `src/lib/navigation/site-navigation-href.ts` | Absolute navigation/locale href resolution via `resolveLocalizedSiteHref` / `resolveLocaleSwitchedSiteHref` / `resolveSiteNavigationHrefs` (compose locale routes + `withBasePath`). Do not pass results to Next `<Link>` when `basePath` is already set in next.config |
| `src/lib/seo/production-metadata-base.ts` | Production origin (`https://portpowered.github.io`) + `resolveProductionMetadataBase` / `resolveProductionMetadataHref`. Project-site export `metadataBase` is origin + `/you-agent-factory-docs`; root / unset-base-path stays origin-only. Metadata field hrefs must stay app-relative so Next.js does not double-prefix. |
| `src/lib/seo/export-absolute-canonical.ts` / `export-absolute-canonical.test.ts` | Stricter absolute-canonical gate for project-site export HTML (home + docs article + blog post); rejects path-prefixed-only relative canonicals and retired Atlas routes |
| `src/lib/seo/page-open-graph.ts` / `export-page-open-graph.ts` (+ tests) | Page-specific Open Graph title/description/url mirroring Metadata; export HTML gate for home/search/docs/blog proof routes |
| `src/lib/seo/social-preview-assets.ts` / `export-social-preview-images.ts` (+ tests) / `public/images/og-default.png` | Default OG/Twitter social card path; project-site vs root public-asset prefix; export HTML `og:image` / `twitter:image` gate |
| `src/lib/seo/export-localized-alternates.ts` (+ tests) | Shipped-only absolute production hreflang gate; multi-locale home + subset-locale docs (`concepts/task-queue`) + blog English-only proofs; requires `x-default` → English canonical when language alternates are advertised |
| `src/lib/seo/public-sitemap-routes.ts` / `export-sitemap.ts` (+ tests) / `src/app/sitemap.ts` | Public factory route inventory + absolute production `out/sitemap.xml` gate (live routes only; no retired Atlas paths) |
| `src/lib/seo/export-robots.ts` (+ tests) / `src/app/robots.ts` / `verify-export-seo-discovery.ts` (+ tests) | `out/robots.txt` production sitemap reference + composite SEO discovery export gate (canonicals/OG/social/alternates/sitemap/robots) |
| `src/lib/navigation/site-metadata-path.ts` | Public-asset / non-Metadata path helpers (`resolveSiteAbsoluteHref` / `resolvePublicAssetHref` / `prefixMetadataAlternates`). Prefer app-relative Metadata fields + root `metadataBase`; use these for hardcoded `public/` paths and non-Metadata absolute hrefs. |
| `src/lib/i18n/route-locale.ts` (`localizedRouteAlternates`) | Canonical + language-alternate metadata; emits app-relative hrefs. Production origin/base path come from root `metadataBase`. |
| `src/lib/build/deploy-pages-workflow-contract.test.ts` | Focused build-contract gate: live `deploy-pages.yml` sets `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` on `make build`, runs `make guard-pages-deployed-artifact` after build and before `upload-pages-artifact`, and uploads `out/` |
| `src/lib/build/static-export.test.ts` | Focused build-contract gate: `/you-agent-factory-docs` → identical `basePath` + `assetPrefix` |
| `src/lib/build/verify-export-base-path.test.ts` | Focused build-contract gate: HTML asset-prefix check for `/you-agent-factory-docs/_next` plus representative home/getting-started/comparing-agent-factories navigation hrefs (relative prefixed pass; absolute production comparing-only fails), prefixed canonical/hreflang, and public-asset URL checks |
| `src/lib/build/verify-project-site-export-consumers.ts` | Composite project-site export consumer proof: no root `/_next`, prefixed search bootstrap, home/docs/blog nav under `/you-agent-factory-docs` |
| `src/lib/build/project-site-export-consumers.proof.test.ts` | Direct export proof (`bun run test:website:export-consumers`): builds with `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` and runs `verifyProjectSiteExportDirectory` |
| `src/lib/build/acquire-trusted-project-site-export.ts` | Guard helper: reuse a matching `/you-agent-factory-docs` `out/` (validate-job artifact) or build once when missing/mismatched; `allowBuild: false` for probe-only CI steps that must not re-export |
| `src/lib/build/acquire-trusted-project-site-export.test.ts` | Focused build-contract gate: reuse vs single rebuild vs `allowBuild: false` without a real Next export |
| `src/lib/build/guard-pages-deployed-artifact.ts` | Pages deploy guard: `guardPagesDeployedArtifact` reuses trusted `out/` with `allowBuild: false`, then `probePagesDeployedArtifact` serves via `runStaticExportServerLifecycle` / `createStaticExportHttpServer` and HTTP-probes home, getting-started, comparing-agent-factories, search bootstrap, one CSS asset, and a JS chunk for `/you-agent-factory-docs` prefix correctness. Prefixed search-bootstrap presence is evaluated from concatenated `out/_next/static/chunks/*.js` (same as export-consumer) — not only the first HTML-referenced script — because the Orama static `from` bake is code-split into a search chunk |
| `src/lib/build/guard-pages-deployed-artifact.test.ts` | Focused build-contract gate: repaired fixture passes; code-split bake in a non-entry chunk passes; unprefixed fixture fails; absolute-only comparing canonical/OG (no relative comparing href) fails representative nav; missing `out/` fails without rebuild — no production-scale rebuild required |
| `src/lib/build/required-read-only-export-probes.ts` / `required-read-only-export-probes.test.ts` | Story 006 inventory of required read-only probes (Pages guard + budget); forbids competing `build:export` / `runStaticExportBuild` in probe CLIs; guard failure report prints `make guard-pages-deployed-artifact` |
| `scripts/guard-pages-deployed-artifact.ts` / `make guard-pages-deployed-artifact` / `bun run guard:pages-deployed-artifact` | Thin deploy-path entrypoint: reuse existing `out/` only and probe; never runs a second `make build` / `build:export` |
| `src/lib/build/exported-site-budget.ts` / `exported-site-budget.test.ts` / `scripts/run-exported-site-budget.ts` / `make budget` / `bun run budget` | Factory exported-site budget gate: measures existing `out/` (total size, Next static JS, `api/search*`) against factory baselines; fails closed on missing/incomplete export or breach; no unconditional skip |
| `src/lib/build/built-app-html-paths.test.ts` / `src/lib/navigation/site-path.test.ts` / `src/lib/navigation/site-navigation-href.test.ts` / `src/lib/navigation/site-metadata-path.test.ts` / `src/lib/i18n/route-locale.test.ts` | Focused helper gates: live project-site default + root vs `/you-agent-factory-docs` navigation/locale/metadata/asset href behavior |
| `src/features/docs/components/LocalizedLinkList.tsx` | MDX link lists use Next `<Link>` so project-site `basePath` prefixes hrefs (raw `<a>` would escape to the org root) |

## `make build` vs `make build-export`

- `make build` is the CI/Pages contract: `bun run build:export` only. It must
  emit `out/` and must not chain Atlas/Phase-1 route verifiers.
- Former `make build-export` (export + Phase 1 verifiers) was retired with
  Atlas verifier deletion. CI and deploy-pages call `make build` only.

## Atlas / Phase-1 post-build verifiers (retired)

`rewrite-delete-atlas-domain` deleted Atlas-specific verifier scripts and their
Makefile/`package.json` entrypoints (`verify-atlas-*`, Phase-1 export/route
convergence passes, GQA built-route checks, and related `src/lib/verify`
helpers). Do not reintroduce those targets into `make build`, `make check`,
`make test`, CI, or deploy-pages.

`scripts/run-website-functionality-tests.ts` (plain `make test`) consumes the
classified exclusion inventory in
`src/lib/website-functionality-exclusions.ts` (`active` / `replaced`; obsolete
Atlas package prefixes and dead paths removed). See
[restore-required-tests-gates-relevant-files.md](./restore-required-tests-gates-relevant-files.md)
and [delete-atlas-domain-relevant-files.md](./delete-atlas-domain-relevant-files.md).

## Empty `generateStaticParams` under static export

Next.js `output: "export"` fails with a misleading "missing generateStaticParams()"
error when a dynamic route returns `[]`. Use `ensureStaticExportParams` from
`src/lib/build/static-export.ts` to emit a single placeholder param that the page
already `notFound()`s (see localized blog `[slug]` and docs `[[...slug]]` after
Atlas page deletion leaves empty collections).

## Transitional skip/pass gates

`make budget` now enforces factory exported-site baselines via
`bun run budget` / `scripts/run-exported-site-budget.ts` (see
[restore-required-tests-gates-relevant-files.md](./restore-required-tests-gates-relevant-files.md)).
`make component-coverage` now enforces factory component and verifier coverage
baselines via `bun run coverage` / `scripts/component-coverage-gate.ts` (same
doc). Do not hide failures from `check`, `test`, `budget`, `component-coverage`,
or the static-export build behind skip stubs.

## Related

- [operations.md](../../operations.md) — maintainer CI/deploy posture for the rewrite-era Makefile contract

## Stale inventory tests

`src/tests/ci/github-actions-*.test.ts` may still describe older matrix /
`make build-export` layouts. They are excluded from plain `make test`
(`scripts/run-website-functionality-tests.ts` skips `src/tests/ci/`).
Do not treat those inventory tests as the live workflow contract; prefer
command-level verification of the Makefile targets and the YAML files above.

The retired Pages inventory file
`src/tests/ci/github-actions-deploy.test.ts` (which asserted
`.github/workflows/deploy.yml` + `ai-model-reference`) was removed. Live
Pages deploy coverage is only
`src/lib/build/deploy-pages-workflow-contract.test.ts` inside
`make test-build-contract` / `bun run test:build-contract`.

Live project-site coverage belongs in `make test-build-contract` /
`bun run test:build-contract`, which runs `deploy-pages-workflow-contract`,
`static-export`, `verify-export-base-path`, `export-out-directory`,
`built-app-html-paths`, `verify-project-site-export-consumers` (fixture gate),
`acquire-trusted-project-site-export` (reuse vs single rebuild),
`guard-pages-deployed-artifact` (HTTP probe suite),
`site-path`, `site-navigation-href`, `site-metadata-path`, and `route-locale`
tests. Direct project-site `out/` proof (real export build) is
`bun run test:website:export-consumers`.

Trusted export acquisition for the Pages guard should call
`acquireTrustedProjectSiteExport` (default base
`BUILT_APP_GITHUB_PAGES_BASE_PATH`). Matching `out/index.html` that already
references `/you-agent-factory-docs/_next` is reused — including the validate
job’s just-built artifact — so the guard must not pay for a second full
`build:export`. Inject `runBuild` in unit tests; use `allowBuild: false` in
workflow probe steps that only verify an existing artifact.

HTTP probing for the Pages guard should call `probePagesDeployedArtifact`
(same default base). It serves `out/` with the existing static-export harness
under `/you-agent-factory-docs` and fails when home / getting-started /
comparing-agent-factories HTML, search bootstrap, CSS, or JS expose unprefixed
asset, search, or internal URLs. Fixture coverage for the failure mode is
enough — do not require a second production-scale export solely to prove fail.

Representative nav hrefs (`PAGES_DEPLOYED_ARTIFACT_PROBE_NAV_HREFS`) require
relative `href="${basePath}${path}"` strings in combined probed HTML — absolute
production canonical/OG URLs do not satisfy
`exportHtmlReferencesPrefixedNavigationHrefs`. Home and getting-started usually
appear via primary nav / docs sidebar; the comparing blog probe route is not in
that tree, so `renderBlogPostPage` / `renderBlogPostShell` emit a title self-link
(`blogPostHref(slug)` via Next `Link`) that project-site `basePath` rewrites to
`href="/you-agent-factory-docs/blog/comparing-agent-factories"`. Do not post-build
rewrite `out/` HTML to inject those hrefs.

The deploy validate job must call `make guard-pages-deployed-artifact` (→
`bun run guard:pages-deployed-artifact` → `guardPagesDeployedArtifact`) after
`make build` and before `actions/upload-pages-artifact@v3`. That entrypoint
always acquires with `allowBuild: false` so it reuses the validate job’s
just-built `out/` and never triggers a redundant `build:export`.

Read-only post-deploy operator checks (live
`https://portpowered.github.io/you-agent-factory-docs` home / getting-started /
comparing-agent-factories / search / prefixed `_next` CSS+JS) live in
`docs/operations.md` under **Read-only post-deploy checks**. That runbook
includes an operator-only constraints table (GET-only; no push/PR/Pages deploy
API), a check inventory, copy-paste curls, and auto-extracted prefixed CSS/JS
fetches that reject bare `/_next`. Prefixed asset paths in live HTML are
host-absolute (`/you-agent-factory-docs/_next/...`); fetch them from
`https://portpowered.github.io` — do not append them to the `$SITE` base URL.
Those curls are maintainer verification after a green deploy; they must not be
wired into tests or the guard. The guard and `test:build-contract` only probe
local `out/` over loopback and must never deploy to Pages, push branches, open
PRs, or submit other external changes.

When path-helper fixtures still encode retired `/ai-model-reference`, update them
to `/you-agent-factory-docs` (or import `BUILT_APP_GITHUB_PAGES_BASE_PATH`) —
do not invent a second prefix mechanism beside `normalizeGitHubPagesBasePath` /
`withBasePath`.

Search bootstrap path consumers (`docs-search-bootstrap-path`, export-search
bootstrap emit/verify, and the baked `NEXT_PUBLIC_DOCS_SEARCH_BOOTSTRAP_FROM`
client path) are covered by `bun run test:website:static-search`. Those fixtures
must also use the live project-site prefix, not retired `/ai-model-reference`.

## Repository-facing workflow identity

- Live workflow display names are project-neutral: `CI` and `Deploy GitHub Pages`.
  **CI** is the Wave CI-1 parallel job graph (`check`, `unit-tests`,
  `reader-facing`, `a11y`, `contracts`, `component-coverage`, `content`,
  `static-export`, `integration`, `budget`) plus aggregate **ci-gate**
  (membership/edges in `src/lib/ci-required-path.ts`), with Wave CI-2 trusted
  artifact handoff: `static-export` uploads `static-export-out` (`out/`);
  `integration` / `budget` download it and must not rebuild, and Wave CI-3
  Playwright Chromium install only on browser-backed jobs (`unit-tests`,
  `a11y`, `integration` — see `CI_BROWSER_INSTALL_OWNERSHIP`). Deploy-pages jobs
  remain `Canonical validation` and `Deploy to GitHub Pages`. Local full path
  stays sequential (`make ci`, no Actions artifact); deploy-pages stays a
  separate Pages-focused subset. Do not treat CI-4 shards as landed.
- Source-SHA → Pages proof for maintainers lives in
  `docs/operations.md` under **Commit-SHA traceability**: record
  `merge_sha` + **CI**/**ci-gate** run + **Deploy GitHub Pages**
  (**Canonical validation** / **Deploy to GitHub Pages**) run + Pages
  deployment record; do not claim the live project site
  (`https://portpowered.github.io/you-agent-factory-docs`) updated until
  **Deploy to GitHub Pages** is green for that SHA.
- Non-destructive rollback lives in `docs/operations.md` under **Rollback
  process**: identify `good_sha` with green **ci-gate** + green **Deploy to
  GitHub Pages**; record `(good_sha, bad_sha)` and Actions run IDs; prefer
  `git revert` via PR (or fix-forward) then redeploy on the new `main` tip.
  Force-push and hard-reset of `main` are prohibited. Direct redeploy of a
  prior SHA is **not available today** (`deploy-pages.yml` is `push` to `main`
  only — no `workflow_dispatch`).
- Incident diagnosis for live Pages failure modes lives in `docs/operations.md`
  under **Incident diagnosis**: bare `/_next` / missing project-site prefix,
  broken or empty search bootstrap, browser/CDN cache serving old HTML/assets,
  and stale or wrong uploaded artifact. Each mode lists observable symptoms and
  a next action that points back to **Commit-SHA traceability**, **Read-only
  post-deploy checks**, and **Rollback process** — do not invent a second
  recovery path. Prefer fresh GET-only `curl` over a single browser tab when
  distinguishing cache from a bad artifact.
- Deployment status expectations live in `docs/operations.md` under
  **Deployment status expectations**: pushes to `main` show **CI**/**ci-gate**
  (plus child jobs) plus **Deploy GitHub Pages** (**Canonical validation** /
  **Deploy to GitHub Pages**); pull requests show **CI** / **ci-gate** only and
  do not run production deploy. Fail → `make <target>` after `make setup`; full
  local path → `make ci`. A failed deploy on `main` leaves the prior successful
  Pages deployment live until a later green **Deploy to GitHub Pages**.
- PR preview policy lives in `docs/operations.md` under **PR preview policy**:
  status is **Deferred** (not **Implemented**); owner is repository
  maintainers; alternative for PR authors is the local Makefile contract
  (`make setup` → `check` → `test` → `build` → `budget` → `component-coverage`)
  plus optional `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs make build` and
  green **CI**/**ci-gate** on the PR. Checklist mapping and governance status
  language must stay **Deferred** with that owner/alternative until a preview
  workflow ships.
- Contributor-facing entry points must link the operations runbooks by section
  (release, SHA proof, smoke, rollback, incident diagnosis, deployment status,
  PR preview), not only a generic “CI/deploy posture” blurb:
  - `docs/contributors/CONTRIBUTING.md` → **Operations runbooks**
  - Root `README.md` Important Docs + Quality Gates operations pointer
  Keep workflow/job display names and Makefile stages aligned with live
  `.github/workflows/ci.yml` / `deploy-pages.yml` (no retired `deploy.yml` /
  `ai-model-reference` / Atlas-only required paths as current).
- The README CI badge must point at
  `portpowered/you-agent-factory-docs` / `.github/workflows/ci.yml`, not the
  legacy `ai-model-reference` repository.
- Maintainer `GITHUB_PAGES_BASE_PATH` examples in README should use the current
  repository name when illustrating project-site export.
- Root README quality-gate docs for the CLI rewrite should document the B00
  Makefile stages above (`setup` / `check` / `test` / `build`, plus transitional
  `budget` / `component-coverage`) and must not present retired Atlas / Phase 1
  verifier inventories as the required contributor path. Meta-doc lanes point
  Important Docs at `docs/temp/customer-ask.md` and `docs/temp/big-docs` even
  though `docs/temp/` is gitignored planner working state.
- Root `AGENTS.md` for the CLI rewrite should describe the you-agent-factory
  docs product and customer stories from `docs/temp/customer-ask.md` (install/run,
  guides, concepts/techniques, comparisons, news), keep the planner-only `you`
  rule, and point planners at `docs/temp/customer-ask.md` plus `docs/temp/big-docs`.
  Prefer live standards paths under `factory/docs/standards/` when the old
  `docs/graphing-standards.md` path is gone.
- Meta-doc lanes that must leave B00 ownership untouched should verify with
  `git diff <base>...HEAD -- Makefile .github/workflows/` (empty) and then run
  `make check` / `make test` on the lane checkout before marking the CI-contract
  story complete. Do not edit those surfaces from README/AGENTS/package rename
  work.

## Mergeability: brittle HTML / inventory test drift

When required CI `make test` fails after foundation Makefile work for reasons
outside the story diff, prefer the smallest mergeability fix:

- Align stale nav/tag/blog inventory expectations with current published config
  (for example primary nav `/blog`, published factory tags such as `foundations`
  / `local-models`, current blog title).
- For rendered HTML that asserts contiguous prose containing auto-linked terms,
  assert the surrounding fragments and the auto-link `href` instead of rewriting
  customer copy. Do not reintroduce deleted Atlas-only tags such as
  `tag.inference` / `tag.model-family` as fixtures.
- Restore missing internal notes files required by existing tests (for example
  `docs/phase-2-3-reconciliation-implementation-notes.md`) rather than deleting
  the dependency assessment test.
