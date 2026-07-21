# Hygiene — Make Real Targets Only (relevant files)

Use this note when auditing or fixing living Make instructions so agents and
maintainers only copy **real** root `Makefile` targets.

## Source of truth

Primary shared entrypoints (non-exhaustive): `setup`, `check`, `build`, `ci`,
`dev`, `a11y`, `test`, `linkcheck`, `validate-data`, `budget`,
`component-coverage`.

The full target list lives in the root `Makefile` `.PHONY` line. Do **not**
invent names such as `ui-build`, `all`, `links`, or resurrect retired
`build-export` as a live command.

Intent → real target (common replacements):

| Intent | Real target |
| --- | --- |
| Static export / site build | `make build` |
| Full local required path | `make ci` |
| Typecheck + lint | `make check` |
| Internal link validation | `make linkcheck` |

## Surfaces checked (story 001 audit)

Compared committed instruction surfaces against root `Makefile` `.PHONY`
targets (UTC audit for HY-make).

| Surface | Result |
| --- | --- |
| `AGENTS.md` | Clean — no Make prescriptions |
| `README.md` | Clean — real targets only (`setup`, `check`, `build`, `ci`, `linkcheck`, …) |
| `docs/contributors/CONTRIBUTING.md` | Mostly clean; see **must-fix** for retired Phase-1 verifier names still listed as existing optional targets |
| `scripts/**` comments | Clean — real targets (`make test`, `make build`, `make validate-data`, …) |
| `factory/docs/overview.md` | **Must fix** — foreign Go-README local-check language |
| `docs/governance/architectural-checklist-mechanism-status.md` | **Must fix** — present-tense `make build-export` verification/build guidance |
| `docs/operations.md` | Historical only — retirement wording for `make build-export` (keep) |
| `docs/internal/processes/ci-deploy-foundation-relevant-files.md` | Historical only — explains `make build` vs retired `make build-export` (keep) |
| Closed-era / conflict-refresh handoffs under `docs/internal/processes/*` that name past CI job labels including `build-export` | Historical reports — leave alone (not live maintainer instructions) |
| Factory batch archives + `src/tests/ci/planner-deployment-guidance.test.ts` expecting historical `make build-export` in batch-014 payloads | Historical / test contract — leave alone |
| `docs/temp/**` (opportunistic) | No `make ui-build` instructional hits found at audit time |

## Must-fix (present-tense live false instructions)

These prescribe nonexistent **current** targets and should be rewritten to real
targets in follow-on stories (do not invent Makefile targets to match the old
wording).

### `factory/docs/overview.md`

- Line ~22: Local checks list includes `make all` and `make links` (neither
  exists). Also mis-points at a foreign `CONTRIBUTING.md` Go-README checklist.
- Quality Gates block (~172–180): `make all` and `make links` as live
  pre-submit guidance, plus “mirror the Go README checks” framing that does not
  match this repo’s Makefile contract.

**Replacement intent:** use this repo’s real gates (`make check`, `make test`,
`make linkcheck`, `make ci` as appropriate) or remove the foreign toolchain
prose.

### `docs/governance/architectural-checklist-mechanism-status.md`

Present-tense live prescriptions of retired `make build-export` (retarget to
`make build` / current deploy-pages + CI contract):

- Deploy workflow **Build job** description still says `make build-export`
- Category **Verification commands** / evidence rows that list
  `make build-export` as something to run now
- README summary row that still claims Quality Gates / static export docs
  prescribe `make build-export`

Accurate “former / retired” wording elsewhere is out of scope for deletion.

### `docs/contributors/CONTRIBUTING.md` (bonus audit hit)

Optional-commands table still lists `make verify-phase-1-ux` and
`make verify-phase-1-*-convergence` as if they exist. Those targets were
removed with Atlas/Phase-1 export verifiers. Retarget or remove the rows so
contributors are not steered at missing rules.

## Historical (allowed — do not “fix” into silence)

- `docs/operations.md` — Atlas/Phase-1 verifiers and `make build-export` **were
  retired**
- `docs/internal/processes/ci-deploy-foundation-relevant-files.md` —
  `make build` vs former `make build-export`
- `docs/internal/processes/delete-atlas-domain-relevant-files.md` and similar
  handoffs that record past CI matrix names
- Closed factory batch JSON / tests that assert historical planner text

## Explicit non-hits

- **No committed surface** instructs `make ui-build` / `ui-build` as a current
  command at audit time. The HY-make customer ask still requires the maintainer
  entrypoint note so agents do not invent it later.
- Root `Makefile` `.PHONY` / target definitions were not changed by this audit.

## Follow-on work (other PRD stories)

1. Replace false live instructions listed above with real targets.
2. Add or tighten a short primary-entrypoints maintainer note (README /
   AGENTS / factory overview) pointing at the root Makefile.
3. Opportunistically scrub `docs/temp/**` if instructional `ui-build` reappears.
4. Confirm lane fences: instruction docs/scripts comments only; no new Make
   targets; no page-chrome / IA / feature-package moves.
