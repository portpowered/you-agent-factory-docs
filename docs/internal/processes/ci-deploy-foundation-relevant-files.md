# CI and GitHub Pages Deploy Foundation Relevant Files

Use these files when aligning local Makefile targets with GitHub Actions CI and
Pages deploy for the rewrite-era foundation pipeline.

## Maintainer command contract

| Stage | Makefile target | Behavior |
| --- | --- | --- |
| Install | `make setup` | `bun install --frozen-lockfile` |
| Static analysis | `make check` | `typecheck` then `lint` (fails if either fails) |
| Tests | `make test` | Existing website test entrypoint |
| Static export / build | `make build` | Runs `bun run build:export` (`NEXT_STATIC_EXPORT=1`); produces `out/` for Pages. Deploy-pages sets `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` on this step so project-site HTML references `/you-agent-factory-docs/_next`. |
| Local static-export benchmark (optional) | `make benchmark-static-export MODE=clean\|warm` | Opt-in profiled export with clean/warm prep. Clean removes `.next`, `out`, `.source`, and ignored generated outputs (deps stay installed); warm leaves artifacts in place. Prints a stable timing summary with `mode=`, stage wall times, cache reasons, scale counts, and non-identifying machine metadata. Reference machine for the later <=180s target is recorded in `docs/operations.md`. Not part of CI/Pages. |
| Exported-site budget | `make budget` | Rewrite-safe gate, or honest transitional skip/pass exiting 0 |
| Component coverage | `make component-coverage` | Rewrite-safe gate, or honest transitional skip/pass exiting 0 |

Workflows that call this contract:

- `.github/workflows/ci.yml` — setup → Playwright Chromium → check → test → build → budget → component-coverage
- `.github/workflows/deploy-pages.yml` — setup → Playwright Chromium → check → test → build (with `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs`) → `make guard-pages-deployed-artifact` → budget, then upload `out/`

Reproduce any failing workflow stage locally with the same `make <target>` after
`make setup` (and `bunx playwright install --with-deps chromium` when website
tests need a browser).

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
| `.github/workflows/ci.yml` | Required PR/push verification stages (`jobs.verify`) |
| `.github/workflows/deploy-pages.yml` | Main-branch Pages validate + deploy; artifact path `out/` |
| `docs/operations.md` | Maintainer-facing CI/deploy posture; local static-export benchmark command, summary field contract (including non-identifying machine metadata), and agreed reference machine for the <=180-second clean-build target (profiling lane does not claim the budget) |
| `package.json` | Underlying Bun scripts (`typecheck`, `lint`, `test`, `build:export`, `benchmark:static-export`) |
| `src/lib/build/static-export-profile.ts` | Optional static-export stage timing contract (`PROFILE_STATIC_EXPORT=1`); off by default; summary includes `mode=`, stage timings, cache reasons, scale counts, and non-identifying machine metadata (`osFamily`, `cpuArchitecture`, `logicalCpuCount`, `runtimeName`, `runtimeVersion`) |
| `src/lib/build/static-export-profile-diagnostics.ts` | Cache artifact snapshot + scale-count collectors (routes/locales/chunks); content-runtime hit/miss from fingerprint store + contracted output presence; fumadocs hit/miss from immutable snapshot store + `.source` presence; Next compilation hit/miss from usable non-empty `.next/cache` (clean mode always `miss:clean-mode-regenerates`); missing diagnostics degrade to `not-available` |
| `src/lib/build/static-export-benchmark-prep.ts` | Clean/warm prep: clean wipes `.next`/`out`/`.source`/ignored generated outputs (compiler cache included); warm is a no-op that preserves `.next/cache` |
| `src/lib/build/static-export-compiler-cache.ts` / `static-export-compiler-cache.test.ts` | Next/compiler cache policy: warm and ordinary `build:export` preserve a usable `.next/cache`; only clean benchmark prep wipes `.next`. Usability = non-empty `.next/cache` directory. |
| `src/lib/build/static-export-immutable-snapshot.ts` / `static-export-immutable-snapshot.test.ts` / `scripts/ensure-static-export-immutable-snapshot.ts` | Fingerprint-gated immutable snapshot for the fumadocs `.source` intermediate on `build` / `build:export` / profiled export. When contracted inputs (`src/content/docs`, `source.config.ts`, ensure/snapshot modules) are unchanged and `.source/server.ts` plus `.source/.static-export-immutable-snapshot.json` are present and valid, reuse skips `fumadocs-mdx`. Input changes, missing/corrupt store or output, and `--force-clean` / `STATIC_EXPORT_IMMUTABLE_SNAPSHOT_FORCE=1` regenerate. Reuses content-runtime fingerprint hashing helpers. |
| `src/lib/content/content-runtime-preparation.ts` / `content-runtime-fingerprints.ts` / `write-file-if-changed.ts` / `render-typescript-literal.ts` / `ensure-graph-registry-runtime.ts` / `root-graph-registry-load.ts` / `scripts/prepare-content-runtime.ts` / `scripts/run-next.ts` / `bun run prepare:content-runtime` | Default prepare preserves valid `.source` and ignored generated runtime modules. Steps are fingerprint-gated (inputs + generator identity + schemas); cache hits skip generation when the output is usable. Independent generators with disjoint `outputPath` values (and no unmet `dependsOn`) run concurrently in deterministic waves; overlapping outputs or `dependsOn` edges stay sequenced. Pass `concurrency: false` to force serial waves (byte-equivalence / debugging). Generators emit contracted runtime modules via shared `writeFileIfChanged` / `writeFileIfChangedSync` (identical bytes leave the file untouched). Biome-stable TypeScript literals come from `renderTypescriptLiteral` — content-runtime generators do not spawn per-file `bunx biome format` subprocesses. Live graph-registry generation/parse runs at most once per prepare→build path: `prepare:content-runtime` owns regeneration when fingerprints miss; `scripts/run-next.ts` calls `ensureGraphRegistryRuntimeOnce` so a warm fingerprint skips a second generate/parse; force-clean prepare regenerates the graph runtime once, then run-next reuses it. Alternate content roots memoize parsed graph records in `syncGraphRegistryForContentRoot` (live `CONTENT_ROOT` reuses the generated runtime module without re-reading JSON). Opt-in wipe: `--force-clean` or `CONTENT_RUNTIME_FORCE_CLEAN=1` (truthy: `1`/`true`/`yes`) clears outputs and the fingerprint store then regenerates all steps. Completeness still fails clearly when a required output is missing after preparation. Fingerprint store: `src/lib/content/generated/.content-runtime-fingerprints.json` (gitignored). Focused incremental proofs (`incremental proof:` in `src/tests/ci/content-runtime-preparation.test.ts`) cover cache-hit byte identity, schema invalidation, empty/corrupt recovery, force-clean byte-equivalence, and warm-vs-force-clean stage improvement. |
| `src/lib/content/registry.ts` / `pages.ts` / `registry-load-cache.test.ts` / `pages-load-cache.test.ts` | Process/build-scoped memoization for static-export route generation: `loadRegistry` shares one successful parse Promise per registry root (failed loads are not retained); `loadPublishedDocsPages` / `loadPublishedDocsPagesSync` / shipped variants share one scan per `(rootDir, locale, variant)`. Test helpers `resetRegistryLoadCacheForTests` / `resetDocsPageLoadCacheForTests` and parse counters prove reuse. Mid-build content is assumed immutable; a new process (or explicit reset) re-parses after input changes. |
| `src/lib/build/run-profiled-static-export.ts` | Opt-in profiled runner: discrete timed stages + stable timing summary with cache/scale/machine-metadata diagnostics |
| `scripts/run-profiled-static-export-build.ts` / `bun run build:export:profile` | Maintainer entrypoint for profiled export without clean wipe; does not replace `make build` / `build:export` |
| `scripts/run-static-export-benchmark.ts` / `bun run benchmark:static-export` / `make benchmark-static-export MODE=…` | Documented clean/warm benchmark: prep + profiled export + mode-labeled summary |
| `src/lib/build/static-export-profile.test.ts` / `static-export-profile-diagnostics.test.ts` / `static-export-benchmark-prep.test.ts` / `static-export-compiler-cache.test.ts` / `run-profiled-static-export.test.ts` / `bun run test:static-export-profile-contract` | Focused benchmark-contract gate: summary shape (stages, total, mode, cache reasons, scale counts, non-identifying machine metadata), optional-off default, clean/warm prep semantics (warm preserves `.next` compiler cache), stubbed stage runner — no full timed export required |
| `src/lib/build/static-export.ts` | Single `normalizeGitHubPagesBasePath` → `basePath` + `assetPrefix` contract; `next.config.ts` spreads `resolveNextConfigForBuildMode()` (no hardcoded Pages prefix) |
| `src/lib/build/built-app-html-paths.ts` | Live project-site fixture default `BUILT_APP_GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` (not retired `/ai-model-reference`); shared by export-search artifact matching and built-HTML path normalization |
| `src/lib/navigation/site-path.ts` | Runtime `withBasePath(href, basePath)` / `stripBasePathFromHref` — prefixes or strips internal absolute hrefs; leaves empty-base, external, hash, and already-prefixed hrefs unchanged |
| `src/lib/navigation/site-navigation-href.ts` | Absolute navigation/locale href resolution via `resolveLocalizedSiteHref` / `resolveLocaleSwitchedSiteHref` / `resolveSiteNavigationHrefs` (compose locale routes + `withBasePath`). Do not pass results to Next `<Link>` when `basePath` is already set in next.config |
| `src/lib/navigation/site-metadata-path.ts` | Metadata + public-asset absolute href helpers (`resolveSiteAbsoluteHref` / `resolvePublicAssetHref` / `prefixMetadataAlternates`) — Next Metadata API does **not** auto-apply `basePath`, so canonical/hreflang and hardcoded `public/` paths must use these |
| `src/lib/i18n/route-locale.ts` (`localizedRouteAlternates`) | Canonical + language-alternate metadata; prefixes via `resolveGitHubPagesBasePath` + `prefixMetadataAlternates` on project-site export |
| `src/lib/build/deploy-pages-workflow-contract.test.ts` | Focused build-contract gate: live `deploy-pages.yml` sets `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` on `make build`, runs `make guard-pages-deployed-artifact` after build and before `upload-pages-artifact`, and uploads `out/` |
| `src/lib/build/static-export.test.ts` | Focused build-contract gate: `/you-agent-factory-docs` → identical `basePath` + `assetPrefix` |
| `src/lib/build/verify-export-base-path.test.ts` | Focused build-contract gate: HTML asset-prefix check for `/you-agent-factory-docs/_next` plus representative home/docs/blog navigation hrefs, prefixed canonical/hreflang, and public-asset URL checks |
| `src/lib/build/verify-project-site-export-consumers.ts` | Composite project-site export consumer proof: no root `/_next`, prefixed search bootstrap, home/docs/blog nav under `/you-agent-factory-docs` |
| `src/lib/build/project-site-export-consumers.proof.test.ts` | Direct export proof (`bun run test:website:export-consumers`): builds with `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` and runs `verifyProjectSiteExportDirectory` |
| `src/lib/build/acquire-trusted-project-site-export.ts` | Guard helper: reuse a matching `/you-agent-factory-docs` `out/` (validate-job artifact) or build once when missing/mismatched; `allowBuild: false` for probe-only CI steps that must not re-export |
| `src/lib/build/acquire-trusted-project-site-export.test.ts` | Focused build-contract gate: reuse vs single rebuild vs `allowBuild: false` without a real Next export |
| `src/lib/build/guard-pages-deployed-artifact.ts` | Pages deploy guard: `guardPagesDeployedArtifact` reuses trusted `out/` with `allowBuild: false`, then `probePagesDeployedArtifact` serves via `runStaticExportServerLifecycle` / `createStaticExportHttpServer` and HTTP-probes home, getting-started, comparing-agent-factories, search bootstrap, one CSS asset, and a JS chunk for `/you-agent-factory-docs` prefix correctness. Prefixed search-bootstrap presence is evaluated from concatenated `out/_next/static/chunks/*.js` (same as export-consumer) — not only the first HTML-referenced script — because the Orama static `from` bake is code-split into a search chunk |
| `src/lib/build/guard-pages-deployed-artifact.test.ts` | Focused build-contract gate: repaired fixture passes; code-split bake in a non-entry chunk passes; unprefixed fixture fails; missing `out/` fails without rebuild — no production-scale rebuild required |
| `scripts/guard-pages-deployed-artifact.ts` / `make guard-pages-deployed-artifact` / `bun run guard:pages-deployed-artifact` | Thin deploy-path entrypoint: reuse existing `out/` only and probe; never runs a second `make build` / `build:export` |
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

`scripts/run-website-functionality-tests.ts` (plain `make test`) still excludes
Atlas discovery/search/content/feature packages that require deleted Model Atlas
page fixtures. See [delete-atlas-domain-relevant-files.md](./delete-atlas-domain-relevant-files.md).

## Empty `generateStaticParams` under static export

Next.js `output: "export"` fails with a misleading "missing generateStaticParams()"
error when a dynamic route returns `[]`. Use `ensureStaticExportParams` from
`src/lib/build/static-export.ts` to emit a single placeholder param that the page
already `notFound()`s (see localized blog `[slug]` and docs `[[...slug]]` after
Atlas page deletion leaves empty collections).

## Transitional skip/pass gates

During rewrite foundation, `budget` and `component-coverage` may print a clear
skip message and exit 0 when no rewrite-safe enforcement exists yet. Do not hide
failures from `check`, `test`, or the static-export build behind those skips.

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

The deploy validate job must call `make guard-pages-deployed-artifact` (→
`bun run guard:pages-deployed-artifact` → `guardPagesDeployedArtifact`) after
`make build` and before `actions/upload-pages-artifact@v3`. That entrypoint
always acquires with `allowBuild: false` so it reuses the validate job’s
just-built `out/` and never triggers a redundant `build:export`.

Read-only post-deploy operator checks (live
`https://portpowered.github.io/you-agent-factory-docs` home / getting-started /
comparing-agent-factories / search / prefixed `_next` CSS+JS) live in
`docs/operations.md` under **Read-only post-deploy checks**. Those curls are
maintainer GET-only verification after a green deploy; they must not be wired
into tests or the guard. The guard and `test:build-contract` only probe local
`out/` over loopback and must never deploy to Pages, push branches, open PRs,
or submit other external changes.

When path-helper fixtures still encode retired `/ai-model-reference`, update them
to `/you-agent-factory-docs` (or import `BUILT_APP_GITHUB_PAGES_BASE_PATH`) —
do not invent a second prefix mechanism beside `normalizeGitHubPagesBasePath` /
`withBasePath`.

Search bootstrap path consumers (`docs-search-bootstrap-path`, export-search
bootstrap emit/verify, and the baked `NEXT_PUBLIC_DOCS_SEARCH_BOOTSTRAP_FROM`
client path) are covered by `bun run test:website:static-search`. Those fixtures
must also use the live project-site prefix, not retired `/ai-model-reference`.

## Repository-facing workflow identity

- Live workflow display names are project-neutral: `CI` and `Deploy GitHub Pages`
  (jobs `verify`, `Canonical validation`, `Deploy to GitHub Pages`).
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
