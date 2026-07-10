# Operations

Maintainer guide for Phase 1 deployment posture, CI merge policy, and release
operations. This document closes operational checklist rows from
[architectural-checklist.md](./architectural-checklist.md) that cannot be
inferred from workflow files alone.

## Deployment posture

**Decision: the rewrite-era site publishes a static export to GitHub Pages via
GitHub Actions.** Merges to `main` trigger an automatic deploy workflow that
builds `out/` with `make build` and publishes that artifact.

Local maintainers and automation share one Makefile contract. Reproduce any
failing workflow stage with the same `make <target>` locally (see
[ci-deploy-foundation-relevant-files.md](./internal/processes/ci-deploy-foundation-relevant-files.md)).

### Active deploy path

| Item | Value |
| --- | --- |
| Workflow file | `.github/workflows/deploy-pages.yml` (separate from `.github/workflows/ci.yml`) |
| Trigger | `push` to `main` |
| Install | `make setup` (`bun install --frozen-lockfile`) |
| Validate stages | `make check`, `make test`, `make build`, `make guard-pages-deployed-artifact`, `make budget` (same targets as local/CI) |
| Build entrypoint | `make build` → `bun run build:export` (`NEXT_STATIC_EXPORT=1`) with `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` |
| Pages artifact guard | `make guard-pages-deployed-artifact` after `make build`, before `upload-pages-artifact` — reuses `out/` only (no second full export) |
| Project-site base path | `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` on the validate job build step (required for `https://portpowered.github.io/you-agent-factory-docs`) |
| Published artifact | `out/` uploaded with `actions/upload-pages-artifact@v3` |
| Quality gates | `.github/workflows/ci.yml` runs `make setup` → `check` → `test` → `build` → `budget` → `component-coverage`; deploy-pages validate does not replace CI |

The workflow **`validate`** job checks out the pushed commit, runs the Makefile
stages above (including `make guard-pages-deployed-artifact` after `make build`),
and uploads `out/` with `actions/upload-pages-artifact@v3`.
The **`deploy`** job (`needs: validate`) publishes that artifact via
`actions/deploy-pages@v4`. Failed validation never starts deploy for that run.

Atlas/Phase-1 export route verifiers and `make build-export` were retired with
`rewrite-delete-atlas-domain`. CI and deploy-pages call `make build` only.

### Project-site export base path

The live site is a GitHub Pages **project site** at
`https://portpowered.github.io/you-agent-factory-docs`. Deploy-pages sets
`GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` on the build step so exported
HTML references `/you-agent-factory-docs/_next` assets rather than bare `/_next`.

Reproduce that artifact locally with the same env:

```sh
GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs make build
```

When `GITHUB_PAGES_BASE_PATH` is unset, export builds keep `/` as the base for
local preview and user/org root Pages sites. The project site requires the
repository prefix.

### Why GitHub Pages works for this repository

Observable constraints satisfied in the current repository:

| Constraint | Evidence |
| --- | --- |
| Static export is verified in CI and deploy | `make build` runs `bun run build:export` (`NEXT_STATIC_EXPORT=1`) and emits `out/` with `output: "export"`. CI and deploy-pages both call `make build` before later stages or artifact upload. |
| Search works without live API routes on Pages | The static export ships a prebuilt Orama bootstrap under `out/api/search`. Client search loads that index from `/api/search` in the export. Search bootstrap is emitted by `make build` via `emit-export-search-index`. |
| Query-backed static routes stay exportable | Static export routes must not await request-only `searchParams` during prerender. Query-driven surfaces should fall back to export-safe HTML on the server and hydrate URL state inside a client component wrapped by `Suspense`. |
| GitHub Pages is static-only | GitHub Pages cannot run Node.js API routes at request time. This site ships a pre-generated static export and search index instead of live `GET` handlers. |
| CI and deploy are separate | `.github/workflows/ci.yml` runs the Makefile contract on pull requests and pushes. `.github/workflows/deploy-pages.yml` validates with the same Makefile targets on `main` pushes, then publishes `out/`. |

### Required GitHub repository settings

Maintainers must confirm these settings under the repository **Settings** tab
(maintainer access). They cannot be enforced from git alone.

| Setting | Location | Phase 1 expectation |
| --- | --- | --- |
| Pages source | **Settings → Pages → Build and deployment → Source** | **GitHub Actions** (not “Deploy from a branch”) |
| Workflow permissions | **Settings → Actions → General → Workflow permissions** | **Read and write permissions** enabled so the deploy workflow can request `pages: write` and `id-token: write` |
| Pages environment | **Settings → Environments → `github-pages`** | Created automatically on first successful deploy; confirm it exists and review protection rules if the org requires approvals |
| Deploy workflow permissions | `.github/workflows/deploy-pages.yml` | `contents: read`, `pages: write`, `id-token: write` at workflow scope |

**One-time host-side step:** the first publish requires Pages to be enabled with
source **GitHub Actions**. Until that setting is saved, deploy workflow runs may
fail at the Pages configuration step. After the first successful deploy, the
public URL above should resolve.

Preview deployments for pull requests remain **out of scope** for Phase 1.

## Phase 1 operational checklist mapping

Rows below reference the **Operational** section of
[architectural-checklist.md](./architectural-checklist.md). Status values:
**Implemented** (satisfied in this repo today), **Deferred** (documented blocker
with owner), or **N/A** (not applicable).

| Checklist row | Phase 1 status | Owner | Follow-up |
| --- | --- | --- | --- |
| Merges to `main` are blocked unless CI passes | **Implemented** (CI workflow) + **GitHub settings assumed** | Repository maintainers | Configure **Settings → Branches** on GitHub per the [Branch protection](#branch-protection) section; rules cannot be enforced from git. |
| Website deploys automatically via GitHub Actions (GitHub Pages or equivalent) | **Implemented** | Repository maintainers | `.github/workflows/deploy-pages.yml` runs on `main` pushes; confirm Pages source is **GitHub Actions** on first enablement. |
| Deployment status is visible in GitHub checks | **Implemented** on `main` | Repository maintainers | The **Deploy to GitHub Pages** job from `.github/workflows/deploy-pages.yml` reports status on each `main` push alongside CI. PRs do not run deploy (preview deploy is deferred). |

Related operational rows not closed in this section alone:

| Checklist row | Phase 1 status | Notes |
| --- | --- | --- |
| Website has CI checks on every pull request and merge | **Implemented** | `.github/workflows/ci.yml` runs on `pull_request` and `push`. |
| The build has deterministic install behavior through a lockfile | **Implemented** | `bun.lock` + `make setup` (`bun install --frozen-lockfile`) in CI and deploy-pages. |
| Preview deployments for pull requests | **Deferred** | Out of scope for Phase 1; production deploy is active on `main` only. |
| Documented release / rollback / SHA traceability | **Implemented** | Follow [Release process](#release-process), [Rollback process](#rollback-process), [Commit-SHA traceability](#commit-sha-traceability), [read-only post-deploy checks](#read-only-post-deploy-checks), and [Incident diagnosis](#incident-diagnosis) using the live deploy check and published site. |

### What contributors should expect today

- **Pull requests and pushes** run the **verify** job in `.github/workflows/ci.yml`
  (`make setup` → `check` → `test` → `build` → `budget` → `component-coverage`).
  Reproduce a failing stage locally with the same `make <target>`.
- **Pushes to `main`** also run `.github/workflows/deploy-pages.yml`, which
  validates with the same Makefile targets (through `budget`), uploads `out/`,
  and publishes to GitHub Pages when deploy succeeds.
- Confirm the **Deploy to GitHub Pages** check on the merge commit before
  claiming the site was updated.
- Atlas / Phase 1 export verifiers (`make build-export`, `make verify-atlas-*`)
  were deleted with `rewrite-delete-atlas-domain` and must not be re-chained into
  CI or deploy-pages.

## Branch protection

Branch protection rules live in **GitHub repository settings**, not in this git
repository. Maintainers configure them under **Settings → Branches** for the
default branch (`main`). The table below records the Phase 1 expectations so
contributors know merges require green CI even though the rules cannot be
version-controlled.

| Setting | Phase 1 expectation | Why |
| --- | --- | --- |
| Protected branch | `main` | Production integration branch; merges trigger CI and GitHub Pages deploy. |
| Require status checks to pass before merging | **Enabled** | Merges must not land while the CI workflow is failing. |
| Required status check name | `verify` | Matches the sole job in `.github/workflows/ci.yml` (`jobs.verify`). GitHub lists this as **verify** on pull requests once the workflow has run at least once on the branch. |
| Require branches to be up to date before merging | **Recommended** | Ensures the required `verify` check ran against the latest `main` tip, not only an older base. |
| Do not allow bypassing the above settings | **Enabled for administrators** | Prevents accidental direct pushes that skip the gate. |
| Allow force pushes | **Disabled** | Force-push to `main` is not permitted; history repair uses revert commits or a new branch and PR. |
| Allow deletions | **Disabled** | The default branch must not be deleted from the UI. |

The **Deploy to GitHub Pages** check on `main` is informational for merge gating
(deploy runs after merge). Maintainers may add it as a required check later if
the org wants to block integration on deploy failure.

If the required check name drifts (for example after renaming the workflow job),
update **Settings → Branches → Branch protection rules → Required status
checks** to match the job name in `.github/workflows/ci.yml` and update this
section in the same change.

Repository maintainers own keeping GitHub settings aligned with this guide.
Contributors cannot verify branch protection from a local clone alone; open the
repository **Settings** tab (maintainer access) or ask a maintainer to confirm
the rule is active.

## CI status expectations

The baseline quality gate is workflow file `.github/workflows/ci.yml`, job
**`verify`**. It checks out the branch, runs `make setup`, installs Playwright
Chromium for browser-backed website tests, then runs the Makefile contract in
order: `make check`, `make test`, `make build`, `make budget`, and
`make component-coverage`. Deploy and preview steps are intentionally excluded
from CI.

Production publish is workflow file `.github/workflows/deploy-pages.yml`. The
**`validate`** job runs the same Makefile stages through `make budget`, uploads
`out/`, and the **`deploy`** job publishes that artifact on `push` to `main`
only.

### When checks run

| Event | Workflow trigger | Expected checks |
| --- | --- | --- |
| Pull request opened or updated | `on: pull_request` in `ci.yml` | **verify** runs against the PR head commit and appears in the PR **Checks** tab. No deploy check on PRs. |
| Push to `main` | `on: push` in `ci.yml`; `on: push` branches `main` in `deploy-pages.yml` | **verify** plus deploy-pages **validate** / **deploy** run against the pushed commit. |
| Push to other branches without a PR | `on: push` in `ci.yml` | **verify** runs; deploy-pages does not. |

### What contributors see

**On pull requests**

- The **Checks** tab shows the **verify** job from `.github/workflows/ci.yml`.
- A green **verify** check means every Makefile contract stage passed on the PR
  head SHA.
- A red **verify** check blocks merge when branch protection requires status
  checks (see [Branch protection](#branch-protection)); open the failed step to
  see which `make <target>` broke, then reproduce it locally.
- No deploy-pages check appears on PRs; production deploy runs after merge to
  `main`.

**On pushes to `main`**

- Each commit on `main` shows **verify** plus deploy-pages **Canonical
  validation** / **Deploy to GitHub Pages**.
- Failed **verify** on `main` signals the integration branch is unhealthy; fix
  forward with a follow-up commit or revert—do not force-push.
- Failed deploy-pages on `main` means the static export did not publish; the
  prior successful Pages deployment remains live until a later green deploy.

**Local versus GitHub**

- Local Makefile targets do not publish status to GitHub; push or open/update a
  PR to surface the **verify** check.
- `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs make build` locally produces
  the same project-site `out/` artifact deploy-pages uploads; it does not push
  to GitHub Pages. Plain `make build` (unset base path) keeps `/` for local
  preview. Former Phase 1 export route/search verifiers were retired with Atlas
  deletion.

### Matching local and CI

Run `make setup`, then the same stages CI runs, from the repository root before
opening a PR:

```sh
make setup
make check
make test
make build
make budget
make component-coverage
```

That sequence matches `.github/workflows/ci.yml`, so a local green run is the
practical preflight for the **verify** check contributors see on GitHub.

### Local static-export benchmark (optional profiling)

To compare clean versus warm local static-export timings without changing the
CI/Pages `make build` path, use the opt-in benchmark:

```sh
make setup
make benchmark-static-export MODE=clean
make benchmark-static-export MODE=warm
```

Equivalent package scripts:

```sh
bun run benchmark:static-export -- --mode=clean
bun run benchmark:static-export -- --mode=warm
```

- **Clean** leaves dependencies installed and removes `.next`, `out`, `.source`,
  and ignored generated content-runtime outputs before the measured profiled
  export.
- **Warm** is an unchanged repeat: it does not wipe those artifacts.
- Each successful run prints a stable timing summary that includes `mode=clean`
  or `mode=warm`, per-stage wall times, `totalWallTimeMs`, per-stage cache
  hit/miss/not-applicable reasons, scale counts (`staticRouteCount`,
  `localeCount`, `majorBundleModuleCount`), and non-identifying machine
  metadata (`osFamily`, `cpuArchitecture`, `logicalCpuCount`, `runtimeName`,
  `runtimeVersion`). Missing optional diagnostics print explicit
  `not-available:…` reasons instead of omitting fields. Summaries never include
  hostname, username, home path, or other identifying fields.
- Content-runtime cache reasons reflect incremental preparation: clean mode
  reports `miss:clean-mode-regenerates`; warm mode reports
  `hit:fingerprint-store-and-outputs-present` when
  `.content-runtime-fingerprints.json` and all contracted generated outputs are
  present and non-empty, otherwise `miss:fingerprint-store-or-outputs-absent`.
- Fumadocs / immutable-snapshot cache reasons: clean mode reports
  `miss:clean-mode-regenerates`; warm mode reports
  `hit:immutable-snapshot-store-and-source-present` when `.source` and
  `.source/.static-export-immutable-snapshot.json` are present, otherwise
  `miss:immutable-snapshot-store-or-source-absent`. The export path reuses a
  fingerprint-fresh `.source` via
  `bun ./scripts/ensure-static-export-immutable-snapshot.ts` instead of always
  re-running `fumadocs-mdx`.
- Next compilation / static-rendering cache reasons: clean mode reports
  `miss:clean-mode-regenerates` (clean prep wipes `.next`, including
  `.next/cache`); warm mode reports `hit:next-compiler-cache-present` when
  `.next/cache` exists and is non-empty, otherwise
  `miss:next-compiler-cache-absent`. Ordinary `make build` /
  `bun run build:export` never wipe a valid `.next` compiler cache — only the
  explicit clean benchmark prep path does.
- Search-index emission cache reasons: clean mode reports
  `miss:clean-mode-regenerates`; warm mode reports
  `hit:parsed-documents-store-present` when
  `.source/.export-search-parsed-documents.json` is present, otherwise
  `miss:parsed-documents-store-absent`. `emit-export-search-index` reuses
  fingerprint-fresh parsed search documents across locales (registry loaded
  once) instead of independently re-walking sources; missing/corrupt store or
  fingerprint miss falls back to a full parse and refreshes the store.
  Force with `EXPORT_SEARCH_PARSED_DOCUMENTS_FORCE=1`.
- Legacy Atlas/AI compile-graph trim: `build:export` runs
  `scripts/run-static-export-next-build.ts`, which builds with
  `NEXT_STATIC_EXPORT=1` then verifies that retired public route families
  (`/docs/models|modules|papers|training|systems`, `/topology`,
  `/docs/timeline`) are absent from App Router page modules, denylist owned
  paths, and emitted `out/` HTML. Docs catch-all `generateStaticParams` also
  filters retired Atlas collection slugs. Re-run the gate alone with
  `bun run verify:static-export-legacy-compile-graph`.
- Webpack vs Turbopack bake-off: both bundlers are evaluated against the same
  correctness suite (export completes, project-site base-path / build-contract
  expectations, search-bootstrap expectations, and Turbopack whole-project NFT
  tracing when Turbopack is under test). Recorded comparison
  (`src/lib/build/static-export-bundler-bakeoff.ts`, UTC 2026-07-10): webpack
  remains fully compatible; Turbopack failed to complete a static export in
  this worktree (Next.js 16.2.7 could not resolve `next/package.json` from the
  App Router tree despite `turbopack.root`). **Correctness winner and locked
  default: webpack.** Relative clean timing is not claimed from the incomplete
  Turbopack run; re-check with `bun run compare:static-export-bundlers` (recorded)
  or `bun run compare:static-export-bundlers --live` after tooling/layout
  changes. Override a single export with `STATIC_EXPORT_BUNDLER=turbopack` for
  maintainer probes only — do not change `build:export` / `make build` until
  Turbopack is fully compatible.
- Ordinary `make build` / `bun run build:export` stay uninstrumented.
- Focused contract coverage (no full timed export):
  `bun run test:static-export-profile-contract`.
- Warm unchanged `prepare:content-runtime` (fingerprint cache hits) is the
  incremental path; force-clean / full regeneration is the pre-incremental
  baseline proxy for stage comparison. Focused proofs live in
  `src/tests/ci/content-runtime-preparation.test.ts` (`incremental proof:`
  cases).

#### Reference machine for the <=180-second clean-build target

Agreed reference machine class for B09b optimization comparison:

- Machine class: Apple Silicon developer Mac (arm64), M-series (M1 Max class)
- OS family: macOS 15 (Darwin)
- CPU summary: 10 logical CPUs
- Build runtime: Bun (version recorded per profile run in `runtimeVersion`)

#### Recorded optimize-next-static-export evidence (UTC 2026-07-10)

On that reference machine class, the `optimize-next-static-export` lane recorded:

| Gate | Result |
| --- | --- |
| Clean `MODE=clean` `totalWallTimeMs` | **111560** (<= 180000) |
| Warm `MODE=warm` after unchanged tree | **92776** (faster than clean) |
| Warm cache reuse | hits for content-runtime, fumadocs immutable snapshot, Next `.next/cache`, and search parsed-documents store |
| Determinism (two clean exports) | matching contracted digests for `api/search` (+ locales) and HTML base-path contracts on `index.html`, `blog.html`, `docs/guides.html` |
| Bundler default | webpack (see bake-off above) |

Print the recorded gate without rebuilding:

```sh
bun run prove:static-export-optimization-evidence
```

Focused contract tests (no full timed export):
`bun run test:static-export-profile-contract`.

Re-measure after material export-path changes with
`make benchmark-static-export MODE=clean` then `MODE=warm`, then update
`src/lib/build/static-export-optimization-evidence-recorded.ts`.

See
[ci-deploy-foundation-relevant-files.md](./internal/processes/ci-deploy-foundation-relevant-files.md)
for the file map.

### Governance audit reviewer path

Checklist mechanism coverage for Phase 1 governance passes is recorded in
[architectural-checklist-mechanism-status.md](./governance/architectural-checklist-mechanism-status.md).
Reviewers validating that artifact should run, in order:

1. `make verify-architectural-checklist-mechanism-status` — proves the durable
   audit artifact stays complete and aligned with
   [architectural-checklist.md](./architectural-checklist.md).
2. `make check` and `make test` — confirms general site quality gates still pass
   after governance edits.

## Release process

Release means integrating changes onto `main` with a green **verify** check,
then confirming deploy-pages published the merge commit.

### Standard release on `main`

1. **Open a pull request** against `main` and wait for the **verify** check to
   pass on the PR head commit (see [CI status expectations](#ci-status-expectations)).
2. **Merge to `main`** only when branch protection allows it (required **verify**
   green and branch up to date if that rule is enabled).
3. **Confirm post-merge CI** on the merge commit: a push to `main` triggers
   `.github/workflows/ci.yml` again on the integrated SHA.
4. **Confirm post-merge deploy** on the same SHA: workflow **Deploy GitHub Pages**
   (`.github/workflows/deploy-pages.yml`) runs **Canonical validation** (`make
   build`, `make guard-pages-deployed-artifact` reusing `out/`, upload) then
   **Deploy to GitHub Pages**. A green **Deploy to GitHub Pages** check means the
   public site reflects that commit.
5. **Optionally tag a release point** on `main` when maintainers want a named
   version in git history, for example `git tag v0.1.0 <merge-commit-sha>` followed
   by `git push origin v0.1.0`. Tags do not replace the deploy-on-`main` flow
   unless a future workflow adds tag triggers.
6. **Record the shipping SHA** using [Commit-SHA traceability](#commit-sha-traceability)
   and run the [read-only post-deploy checks](#read-only-post-deploy-checks)
   against the live project site.

Do not claim the public site was updated until the **Deploy to GitHub Pages**
job succeeds on the target `main` commit (see
[Commit-SHA traceability](#commit-sha-traceability)).

### Manual or tagged deploy (future extension)

The current deploy workflow triggers on `main` pushes only. If maintainers add
`workflow_dispatch` or tag triggers later, the workflow must still pass
`${{ github.sha }}` (or an explicit input SHA) into build and deploy steps so the
hosted artifact matches source control.

## Rollback process

Rollback means restoring a **known-good source state on `main`** and letting
**Deploy GitHub Pages** republish from the new tip — without destructive local
Git on `main`.

### Prohibited on `main`

| Action | Status | Why |
| --- | --- | --- |
| Force-push to `main` | **Prohibited** | Branch protection disables force-push; history repair must use revert or fix-forward PRs. |
| Hard-reset of `main` (`git reset --hard` then push) | **Prohibited** | Rewrites the integration tip and requires a force-push; use revert-forward instead. |
| Direct local Pages deploy / deploy API calls | **Prohibited** | Publish only via the live **Deploy GitHub Pages** workflow on a `main` push. |

### Identify the last good SHA

Before changing anything, pick the last commit on `main` that has **both**:

1. A green **CI** / **verify** run for that SHA, and
2. A green **Deploy GitHub Pages** run for that SHA (**Canonical validation** and
   **Deploy to GitHub Pages**).

Use [Commit-SHA traceability](#commit-sha-traceability) to confirm those runs
(and the Pages deployment record) for the candidate `good_sha`. A green **verify**
alone is not enough; a green **Canonical validation** without **Deploy to GitHub
Pages** is also not enough.

### Record the incident pair

Before opening a revert or fix-forward PR, record:

| Field | Meaning |
| --- | --- |
| `good_sha` | Last known-good merge commit with green **verify** + green **Deploy to GitHub Pages**. |
| `bad_sha` | The merge commit (or tip) that published or attempted the bad artifact. |
| `bad_ci_run_id` / `bad_deploy_pages_run_id` | Actions run IDs (or URLs) for the failing or suspect **CI** / **Deploy GitHub Pages** runs. |
| `good_ci_run_id` / `good_deploy_pages_run_id` | Actions run IDs (or URLs) that proved `good_sha` was healthy. |

Keep this pair with the incident notes so the next maintainer does not guess the
redeploy target.

### Direct redeploy of a prior SHA (not available today)

**Not available today.** `.github/workflows/deploy-pages.yml` triggers only on
`push` to `main`. There is no `workflow_dispatch` (or tag) path to rebuild and
publish an older SHA without moving `main`.

Do **not** invent a local workaround (force-push, hard-reset, or calling Pages
deploy APIs). The current non-destructive alternative is below.

### Current non-destructive path: revert or fix-forward, then redeploy

Prefer restoring healthy source on `main`, then letting deploy run on the new tip:

1. **Choose the recovery shape**
   - **`git revert`** (preferred when the bad change is clear): on a branch,
     revert the bad merge commit(s) that introduced `bad_sha`, open a PR, and
     merge after **verify** passes.
   - **Fix-forward**: open a PR that corrects the defect without reverting, merge
     after **verify** passes, when a targeted fix is safer than a full revert.
2. **Merge to `main`** under normal branch protection (required **verify** green).
3. **Let deploy run** on the post-merge tip: workflow **Deploy GitHub Pages**
   runs **Canonical validation** then **Deploy to GitHub Pages** for the new
   `main` SHA (not for the historical `good_sha` itself).
4. **Confirm publish** with [Commit-SHA traceability](#commit-sha-traceability)
   for the new tip, then run the
   [read-only post-deploy checks](#read-only-post-deploy-checks) against
   `https://portpowered.github.io/you-agent-factory-docs`.
5. **Update the incident record** with the recovery merge SHA and its
   `ci_run_id` / `deploy_pages_run_id`.

Until a later green **Deploy to GitHub Pages** succeeds, the prior successful
Pages deployment remains live (a failed deploy does not automatically roll the
site back).

If maintainers later add `workflow_dispatch` or tag triggers, that path must
still pass an explicit SHA into build and deploy so the hosted artifact matches
source control — and this section must be updated to name the new trigger.

## Read-only post-deploy checks

After a green **Deploy to GitHub Pages** run on `main`, maintainers confirm the
live project site at `https://portpowered.github.io/you-agent-factory-docs`
with **GET-only** operator curls (or equivalent browser loads). Pair these
checks with [Commit-SHA traceability](#commit-sha-traceability) so you know
which SHA you are smoking.

### Operator-only constraints

These checks are **maintainer operator verification only**. They are **not** CI
deploy steps, not part of the Pages guard, and not automated tests.

| Must | Must not |
| --- | --- |
| Use `GET` (or a browser load) against the live project site | Push branches, open PRs, or mutate remotes |
| Use short timeouts (`--max-time 10` or shorter) | Call GitHub Pages deploy APIs or re-run deploy from a local harness |
| Fail closed on HTTP errors and bare `/_next` references | Wire these curls into `make test`, CI, or `make guard-pages-deployed-artifact` |

`make guard-pages-deployed-artifact` and `make test-build-contract` only probe a
local `out/` over loopback. They never hit the public site and must stay
separate from this runbook.

### Check inventory

| Surface | URL under `https://portpowered.github.io/you-agent-factory-docs` | What a 200 proves |
| --- | --- | --- |
| Home | `/` | Project-site root HTML is reachable |
| Docs page | `/docs/guides/getting-started` | A representative docs route is live |
| Blog page | `/blog/comparing-agent-factories` | A representative blog route is live |
| Search bootstrap | `/api/search` | Prefixed static Orama bootstrap is reachable |
| Prefixed assets | `/you-agent-factory-docs/_next/...` CSS + JS from home HTML | Asset prefix is correct; bare `/_next` is absent |

### Copy-paste smoke curls

Use short timeouts so a hung host fails fast:

```sh
SITE=https://portpowered.github.io/you-agent-factory-docs

# Home
curl --fail --silent --show-error --max-time 10 "$SITE/" >/dev/null

# Docs page (getting started)
curl --fail --silent --show-error --max-time 10 \
  "$SITE/docs/guides/getting-started" >/dev/null

# Blog page (comparing agent factories)
curl --fail --silent --show-error --max-time 10 \
  "$SITE/blog/comparing-agent-factories" >/dev/null

# Search bootstrap (static Orama index under the project-site prefix)
curl --fail --silent --show-error --max-time 10 \
  "$SITE/api/search" >/dev/null
```

### Project-site asset prefix (reject bare `/_next`)

Confirm live HTML references `/you-agent-factory-docs/_next/` and does **not**
emit root-level `/_next` `src`/`href` attributes, then fetch one CSS and one JS
asset from that HTML. Prefixed asset paths in HTML are host-absolute (they
already include `/you-agent-factory-docs`), so fetch them from the Pages host
origin — do not append them to `$SITE` or the path doubles.

```sh
SITE=https://portpowered.github.io/you-agent-factory-docs
ORIGIN=https://portpowered.github.io
html="$(curl --fail --silent --show-error --max-time 10 "$SITE/")"
printf '%s' "$html" | grep -q '/you-agent-factory-docs/_next/'
! printf '%s' "$html" | grep -q 'src="/_next/'
! printf '%s' "$html" | grep -q 'href="/_next/'

CSS_PATH="$(printf '%s' "$html" | grep -oE '/you-agent-factory-docs/_next/[^"[:space:]]+\.css' | head -n 1)"
JS_PATH="$(printf '%s' "$html" | grep -oE '/you-agent-factory-docs/_next/[^"[:space:]]+\.js' | head -n 1)"
test -n "$CSS_PATH" && test -n "$JS_PATH"
curl --fail --silent --show-error --max-time 10 "$ORIGIN$CSS_PATH" >/dev/null
curl --fail --silent --show-error --max-time 10 "$ORIGIN$JS_PATH" >/dev/null
```

A failed curl, a missing prefixed asset path, or a bare `/_next` match means the
published artifact drifted from the project-site contract. Investigate the
latest **Deploy GitHub Pages** run for that SHA (see
[Commit-SHA traceability](#commit-sha-traceability)) rather than re-running
deploy from a local test harness.

## Commit-SHA traceability

Maintainers must prove which source commit is live on the project site
(`https://portpowered.github.io/you-agent-factory-docs`) by tying the merge
commit on `main` to the Actions runs that verified and published it.

Do **not** claim the public site was updated for a SHA until the **Deploy to
GitHub Pages** job for that SHA succeeds. A green **CI** / **verify** check alone
is not publish proof; **Canonical validation** without a green deploy also is
not publish proof.

### Live workflows and jobs used for proof

| Display name | Workflow file | Job(s) | Role in proof |
| --- | --- | --- | --- |
| **CI** | `.github/workflows/ci.yml` | **verify** | Confirms the merge commit passed the Makefile contract on `main`. |
| **Deploy GitHub Pages** | `.github/workflows/deploy-pages.yml` | **Canonical validation**, then **Deploy to GitHub Pages** | Builds/uploads `out/` for that SHA, then publishes it to Pages. |

Both workflows run against `${{ github.sha }}` for the `main` push (the merge
commit). The project site URL after a successful deploy is
`https://portpowered.github.io/you-agent-factory-docs`.

### SHAs in CI and deploy

| SHA role | Where it appears | Phase 1 meaning |
| --- | --- | --- |
| PR head commit | PR **Checks** tab **verify** run | Validates the proposed merge tip before integration. |
| Merge commit on `main` | Commit page; **CI** (**verify**) and **Deploy GitHub Pages** runs | Authoritative integrated SHA; published only after **Deploy to GitHub Pages** is green. |
| `github.sha` in workflows | GitHub Actions context for `ci.yml` and `deploy-pages.yml` | The commit `actions/checkout@v4` built for that run—matches the trigger commit. |
| Deploy workflow output | **Deploy to GitHub Pages** job summary and Pages deployment record | Must reference the same SHA as the `main` push that triggered publish. |

**Proof of what shipped to production** is all of: the merge commit SHA on
`main`, a green **CI** / **verify** run for that SHA, a green **Deploy GitHub
Pages** run for that SHA (**Canonical validation** + **Deploy to GitHub
Pages**), and the live project site reflecting that deploy.

| Artifact | Purpose |
| --- | --- |
| Deploy workflow `github.sha` | Build and publish steps log and deploy this commit. |
| GitHub Actions run URL / run ID | Links a verify or deploy attempt to workflow logs and timing. |
| GitHub Pages deployment record | Platform deployment under the `github-pages` environment should reference the same commit SHA as the workflow. |
| Optional git tag | Human-friendly name (`v0.2.0`) pointing at a release SHA; does not replace SHA traceability in Actions. |

**Rollback traceability:** keep pairs of `(good_sha, bad_sha)` and the Actions run
IDs for failed and successful deploys (see [Rollback process](#rollback-process)).
Direct redeploy of a prior SHA is not available today; recover with revert or
fix-forward on `main`, then confirm the new tip’s deploy.

### Practical lookup steps (record the shipping SHA)

Record these fields for every release you need to prove later: `merge_sha`,
`ci_run_id` (or URL), `deploy_pages_run_id` (or URL), and the Pages deployment
record / environment URL when available.

1. On GitHub, open **Commits** on `main` and copy the full SHA of the merge or
   release point (`merge_sha`).
2. Open **Actions** → workflow **CI**, filter or open the run for that SHA, and
   confirm job **verify** succeeded. Record the run ID or URL as `ci_run_id`.
3. Open **Actions** → workflow **Deploy GitHub Pages** for the same SHA.
   Confirm **Canonical validation** succeeded (artifact built/uploaded) and
   **Deploy to GitHub Pages** succeeded (artifact published). Confirm the run
   summary / commit hash matches `merge_sha`. Record the run ID or URL as
   `deploy_pages_run_id`.
4. Open the **github-pages** environment / Pages deployment record for that
   deploy and confirm it references the same commit SHA (and note the
   deployment URL when present).
5. Only after step 3 is green, treat the public site as updated for that SHA.
   Optionally run the [read-only post-deploy checks](#read-only-post-deploy-checks)
   against `https://portpowered.github.io/you-agent-factory-docs` (deploy
   propagation can take a short time).
6. Locally, `git rev-parse HEAD` or `git log -1 --format=%H` on an up-to-date
   `main` must match the SHA recorded in CI and deploy for that release.

## Incident diagnosis

Use this section when the live project site at
`https://portpowered.github.io/you-agent-factory-docs` looks wrong after a
deploy (or after a suspected bad publish). Diagnose first; do not invent a
second recovery path.

**Always start here:**

1. Prove which SHA should be live with
   [Commit-SHA traceability](#commit-sha-traceability) (`merge_sha`,
   `ci_run_id`, `deploy_pages_run_id`, Pages deployment record).
2. Re-run the [read-only post-deploy checks](#read-only-post-deploy-checks)
   (GET-only) against the live site.
3. Match symptoms to a failure mode below and take that next action.
4. If the published artifact is bad and `main` needs recovery, follow
   [Rollback process](#rollback-process) (revert or fix-forward — never
   force-push or hard-reset `main`).

Do not push, open PRs, or call Pages deploy APIs from a local smoke harness
while diagnosing. Operator curls stay GET-only.

### Failure modes

| Failure mode | Observable symptoms | Next action |
| --- | --- | --- |
| **Bare `/_next` / missing project-site prefix** | Live HTML has `src="/_next/..."` or `href="/_next/..."`; CSS/JS 404 at the org root; smoke prefix checks fail (`grep` for `/you-agent-factory-docs/_next/` fails or bare `/_next` matches). | Confirm the **Deploy GitHub Pages** run for the intended SHA set `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` on `make build` and that **Canonical validation** / `make guard-pages-deployed-artifact` passed. Re-run the project-site asset-prefix curls under [read-only post-deploy checks](#read-only-post-deploy-checks). If the uploaded artifact was built without the prefix, [roll back or fix-forward](#rollback-process) — do not “fix” by force-pushing. |
| **Broken or empty search bootstrap** | `$SITE/api/search` returns non-200, empty body, or non-JSON; in-browser search shows no results / fails to bootstrap; other smoke routes may still be 200. | Re-run the search curl from [read-only post-deploy checks](#read-only-post-deploy-checks). Inspect the **Canonical validation** logs for that SHA (`make build` / search-index emit). Confirm `out/api/search` was part of the uploaded artifact. If the index is missing or empty in the published artifact, fix-forward the emit path or [roll back](#rollback-process) to a `good_sha` that had a healthy search bootstrap. |
| **Browser / CDN cache serving old HTML or assets** | Actions show a green **Deploy to GitHub Pages** for the new SHA, but the browser still shows pre-deploy content or mixed old/new assets; a fresh `curl` (no browser cache) already returns the new HTML while the browser does not. | Prefer a hard-refresh / private window, or `curl` with `--max-time 10` from [read-only post-deploy checks](#read-only-post-deploy-checks) as the source of truth. Wait briefly for CDN propagation, then re-check. Do **not** treat cache alone as a reason to force-push or re-run deploy from a local harness. If `curl` still shows the old artifact after a green deploy, treat it as [stale or wrong uploaded artifact](#failure-modes) instead. |
| **Stale or wrong uploaded artifact relative to the intended SHA** | Live site (via `curl`) does not match what the intended `merge_sha` should have published; Pages deployment record / run summary SHA disagrees with the merge commit you think shipped; or a failed deploy left the prior successful deployment live while `main` moved. | Reconcile with [Commit-SHA traceability](#commit-sha-traceability): confirm **Deploy to GitHub Pages** succeeded for the SHA you expect. A failed deploy leaves the prior successful Pages deployment live until a later green deploy. If the wrong artifact is live, record `(good_sha, bad_sha)` and recover via [Rollback process](#rollback-process) (revert/fix-forward → new tip deploy). Direct redeploy of a prior SHA is not available today. |

### Distinguishing cache from a bad artifact

| Signal | Likely cache | Likely bad / stale artifact |
| --- | --- | --- |
| Fresh `curl` matches the new SHA’s expected content; browser does not | Yes | No |
| Fresh `curl` still shows old or broken content after green deploy for `merge_sha` | No | Yes — prove SHA, then roll back or fix-forward |
| Deploy job red; site still serves the previous green deploy | N/A | Expected until the next green **Deploy to GitHub Pages**; do not claim the new SHA is live |

When in doubt, trust GET-only `curl` results plus the Actions / Pages records from
[Commit-SHA traceability](#commit-sha-traceability) over a single browser tab.
