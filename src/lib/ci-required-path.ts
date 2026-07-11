/**
 * Aligned required path for `make ci` and `.github/workflows/ci.yml`
 * (restore-required-tests-gates-007).
 *
 * `make ci` prerequisites and the CI workflow `run: make <target>` stages must
 * invoke the same restored suites — no workflow-only required gate that
 * `make ci` skips, and no `make ci`-only required suite that CI never runs.
 *
 * Deploy-pages stays a Pages-focused subset (check / test / build / guard /
 * budget) and is not required to mirror the full verify path.
 */

/**
 * Makefile `ci:` prerequisites in order.
 * Includes `build` so `test-integration` and `budget` reuse one trusted `out/`.
 */
export const MAKE_CI_PREREQUISITES = [
  "lint",
  "typecheck",
  "test",
  "test-reader-facing",
  "a11y",
  "test-ci-contract",
  "test-verify-contract",
  "test-build-contract",
  "build",
  "test-integration",
  "budget",
  "component-coverage",
  "validate-data",
  "linkcheck",
] as const;

/**
 * Workflow `run: make <target>` stages that must appear in
 * `.github/workflows/ci.yml`. Uses `check` (typecheck + lint) instead of the
 * separate `lint` / `typecheck` prerequisites from `make ci`.
 */
export const CI_WORKFLOW_REQUIRED_MAKE_TARGETS = [
  "setup",
  "check",
  "test",
  "test-reader-facing",
  "a11y",
  "test-ci-contract",
  "test-verify-contract",
  "test-build-contract",
  "build",
  "test-integration",
  "budget",
  "component-coverage",
  "validate-data",
  "linkcheck",
] as const;

/**
 * Restored required suites that must appear in both `make ci` and CI.
 * (`build` is the shared export step that feeds integration + budget.)
 */
export const SHARED_REQUIRED_SUITE_TARGETS = [
  "test",
  "test-reader-facing",
  "a11y",
  "test-ci-contract",
  "test-verify-contract",
  "test-build-contract",
  "build",
  "test-integration",
  "budget",
  "component-coverage",
  "validate-data",
  "linkcheck",
] as const;

/** Targets that must stay out of the required `make ci` path. */
export const EXCLUDED_MAKE_CI_TARGETS = [
  "validate-pdf",
  "deploy",
  "build-search-index",
] as const;

/** Maintainer reproduction command for the full local required path. */
export const MAKE_CI_REPRODUCTION_COMMAND = "make ci";
