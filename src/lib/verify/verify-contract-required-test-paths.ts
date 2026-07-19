/**
 * Bounded required suite for current factory verifier / tooling contracts
 * (restore-required-tests-gates-003).
 *
 * Invoked by `make test-verify-contract` / `bun run test:verify-contract`.
 * Atlas website-verifier HTML assertion suites were deleted; this list is the
 * remaining factory tooling that must stay required. An empty list is a
 * misconfiguration — the runner fails closed instead of skipping.
 *
 * Production-integration soft-gated probes that need a fresh `.next` build are
 * also listed in `PRODUCTION_INTEGRATION_TEST_PATHS` and re-run under
 * `make test-integration` with `VERIFY_PRODUCTION_INTEGRATION_TESTS=1`.
 */

export const VERIFY_CONTRACT_REQUIRED_TEST_PATHS = [
  "src/lib/verify/build-source-fingerprint.test.ts",
  "src/lib/verify/built-html-convergence-test-helpers.test.ts",
  "src/lib/verify/export-integration-probe-lock.test.ts",
  "src/lib/verify/export-probe-spawn-guard.test.ts",
  "src/lib/verify/http-harness.test.ts",
  "src/lib/verify/launch-playwright-browser.test.ts",
  "src/lib/verify/production-integration-build-trust.test.ts",
  "src/lib/verify/production-integration-test-paths.test.ts",
  "src/lib/verify/server-lifecycle.test.ts",
  "src/lib/verify/static-export-directory-landing-url-probe.test.ts",
  "src/lib/verify/static-export-http-server.test.ts",
  "src/lib/verify/static-export-server-lifecycle.test.ts",
  "src/lib/verify/verifier-coverage-gate.test.ts",
  "src/lib/verify/verify-contract-required-test-paths.test.ts",
  "src/lib/verify/verify-listen-port-lock.test.ts",
  "src/lib/verify/website-test-workers.test.ts",
] as const;

export const VERIFY_CONTRACT_REQUIRED_SUITE_COMMAND =
  "make test-verify-contract";
