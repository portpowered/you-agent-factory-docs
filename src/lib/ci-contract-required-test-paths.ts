/**
 * Bounded required suite for CI workflow / Makefile alignment contracts
 * (restore-required-tests-gates-003).
 *
 * Invoked by `make test-ci-contract` / `bun run test:ci-contract` and included
 * in `make ci` / CI. Heavy fresh-checkout proofs, planner command suites, and
 * content-runtime preparation live under `src/tests/ci/` but stay out of this
 * bounded list until a later story opts them in.
 */

export const CI_CONTRACT_REQUIRED_TEST_PATHS = [
  "src/lib/ci-required-path.test.ts",
  "src/tests/ci/github-actions-bun-install.test.ts",
  "src/tests/ci/github-actions-make-ci.test.ts",
  "src/tests/ci/system-test-gates.test.ts",
] as const;

export const CI_CONTRACT_REQUIRED_SUITE_COMMAND = "make test-ci-contract";
