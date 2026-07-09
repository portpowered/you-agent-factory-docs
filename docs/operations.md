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
| Validate stages | `make check`, `make test`, `make build`, `make budget` (same targets as local/CI) |
| Build entrypoint | `make build` → `bun run build:export` (`NEXT_STATIC_EXPORT=1`) |
| Published artifact | `out/` uploaded with `actions/upload-pages-artifact@v3` |
| Quality gates | `.github/workflows/ci.yml` runs `make setup` → `check` → `test` → `build` → `budget` → `component-coverage`; deploy-pages validate does not replace CI |

The workflow **`validate`** job checks out the pushed commit, runs the Makefile
stages above, and uploads `out/` with `actions/upload-pages-artifact@v3`.
The **`deploy`** job (`needs: validate`) publishes that artifact via
`actions/deploy-pages@v4`. Failed validation never starts deploy for that run.

Opt-in `make build-export` still chains Phase 1 export route/search verifiers for
local maintainer use. CI and deploy-pages call `make build`, not `make build-export`.

### Why GitHub Pages works for this repository

Observable constraints satisfied in the current repository:

| Constraint | Evidence |
| --- | --- |
| Static export is verified in CI and deploy | `make build` runs `bun run build:export` (`NEXT_STATIC_EXPORT=1`) and emits `out/` with `output: "export"`. CI and deploy-pages both call `make build` before later stages or artifact upload. |
| Search works without live API routes on Pages | The static export ships a prebuilt Orama bootstrap under `out/api/search`. Client search loads that index from `/api/search` in the export. Opt-in `make build-export` can still run Phase 1 export search handoff verifiers locally. |
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
| Documented release / rollback / SHA traceability | **Implemented** | Follow [Release process](#release-process), [Rollback process](#rollback-process), and [Commit-SHA traceability](#commit-sha-traceability) using the live deploy check and published site. |

### What contributors should expect today

- **Pull requests and pushes** run the **verify** job in `.github/workflows/ci.yml`
  (`make setup` → `check` → `test` → `build` → `budget` → `component-coverage`).
  Reproduce a failing stage locally with the same `make <target>`.
- **Pushes to `main`** also run `.github/workflows/deploy-pages.yml`, which
  validates with the same Makefile targets (through `budget`), uploads `out/`,
  and publishes to GitHub Pages when deploy succeeds.
- Confirm the **Deploy to GitHub Pages** check on the merge commit before
  claiming the site was updated.
- Opt-in Atlas / Phase 1 export verifiers remain available as
  `make build-export` and `make verify-atlas-*`; they are not required by CI or
  deploy-pages.

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
- `make build` locally produces the same `out/` artifact deploy-pages uploads;
  it does not push to GitHub Pages. Use opt-in `make build-export` when you also
  want Phase 1 export route/search verifiers.

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
4. **Confirm post-merge deploy** on the same SHA: `.github/workflows/deploy-pages.yml`
   validates with `make build`, uploads `out/`, and publishes to GitHub Pages. A
   green **Deploy to GitHub Pages** check means the public site reflects that
   commit.
5. **Optionally tag a release point** on `main` when maintainers want a named
   version in git history, for example `git tag v0.1.0 <merge-commit-sha>` followed
   by `git push origin v0.1.0`. Tags do not replace the deploy-on-`main` flow
   unless a future workflow adds tag triggers.
6. **Record the shipping SHA** using [Commit-SHA traceability](#commit-sha-traceability)
   and verify the published site matches that commit.

Do not claim the public site was updated until **deploy** succeeds on the target
`main` commit.

### Manual or tagged deploy (future extension)

The current deploy workflow triggers on `main` pushes only. If maintainers add
`workflow_dispatch` or tag triggers later, the workflow must still pass
`${{ github.sha }}` (or an explicit input SHA) into build and deploy steps so the
hosted artifact matches source control.

## Rollback process

Rollback means **republishing a prior known-good commit** to GitHub Pages and/or
**moving `main` back to a healthy integration state**.

### Redeploy a prior SHA

When the latest deploy is bad but an older artifact is still valid:

1. **Identify the last good commit** on `main` with green **verify** and
   deploy-pages in GitHub Actions.
2. **Re-run deploy for that SHA**—today this means restoring `main` to that
   commit via revert (preferred) or merging a fix-forward PR, then letting
   deploy-pages run on the new `main` tip. If `workflow_dispatch` is added later,
   re-run deploy against the good SHA directly.
3. **Confirm** the **Deploy to GitHub Pages** check reflects the target SHA
   (see [Commit-SHA traceability](#commit-sha-traceability)).

### Revert on `main`, then redeploy

When code on `main` must change:

1. **`git revert`** the bad merge commit or commits on a branch, open a PR, and
   merge after **verify** passes. This preserves history and avoids force-push
   (branch protection disallows force-push to `main`).
2. Let deploy-pages run on the post-revert merge commit on `main`.
3. **Use GitHub Actions run metadata**—note the failing deploy run ID, the SHA it
   built, and the prior successful deploy run/SHA when documenting the incident.

Do not force-push `main`; roll forward with revert + redeploy unless host
documentation explicitly requires a different emergency path.

## Commit-SHA traceability

Maintainers must tie integration and deployment to an exact git commit.

### SHAs in CI and deploy

| SHA role | Where it appears | Phase 1 meaning |
| --- | --- | --- |
| PR head commit | PR **Checks** tab **verify** run | Validates the proposed merge tip before integration. |
| Merge commit on `main` | Commit page; **verify** and deploy-pages runs | Authoritative integrated and published state after green checks. |
| `github.sha` in workflows | GitHub Actions context for `ci.yml` and `deploy-pages.yml` | The commit `actions/checkout@v4` built for that run—matches the trigger commit. |
| Deploy workflow output | **deploy** job summary and Pages deployment record | Should reference the same SHA as the `main` push that triggered publish. |

**Proof of what shipped to production** is: the merge commit SHA on `main`, a
green **verify** run for that SHA, a green deploy-pages run for that SHA, and
the live site updated after that deploy.

| Artifact | Purpose |
| --- | --- |
| Deploy workflow `github.sha` | Build and publish steps log and deploy this commit. |
| GitHub Actions run URL / run ID | Links a deploy attempt to workflow logs and timing. |
| GitHub Pages deployment record | Platform deployment should reference the same commit SHA as the workflow. |
| Optional git tag | Human-friendly name (`v0.2.0`) pointing at a release SHA; does not replace SHA traceability in Actions. |

**Rollback traceability:** keep pairs of `(good_sha, bad_sha)` and the Actions run
IDs for failed and successful deploys so redeploy targets an earlier green commit
without guessing.

### Practical lookup steps

1. On GitHub, open **Commits** on `main` and copy the full SHA of the merge or
   release point.
2. Open **Actions**, select the **CI** workflow, and confirm a successful
   **verify** run exists for that SHA.
3. Open the **Deploy GitHub Pages** workflow run for the same SHA and confirm
   the **deploy** job succeeded and the run summary repeats the commit hash.
4. Load the published Pages site and spot-check that content matches the
   expected release (deploy propagation can take a short time).
5. Locally, `git rev-parse HEAD` or `git log -1 --format=%H` on `main` must match
   the SHA recorded in CI and deploy for that release.
