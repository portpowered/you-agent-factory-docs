/**
 * Post-build integration tests exercised by `make test-integration`.
 * Atlas/Phase-1 built-route and module-convergence suites were retired with
 * rewrite-delete-atlas-domain; keep only shell/lifecycle paths that still exist.
 */
export const PRODUCTION_INTEGRATION_TEST_PATHS = [
  "src/lib/verify/built-html-convergence-test-helpers.test.ts",
  "src/lib/verify/server-lifecycle.test.ts",
  "src/lib/verify/a11y-content-column-brand-alignment-page.test.ts",
  "src/tests/layout/docs-index-shell.test.tsx",
  "src/tests/layout/docs-page-toc.test.tsx",
  "src/tests/layout/docs-sidebar-navigation.test.tsx",
  "src/tests/content/high-traffic-locales-browser.test.ts",
  "src/lib/verify/theme-code-copy-r00-page.test.ts",
  "src/content/docs/references/cli-mcp-js-static-export-success.test.ts",
  // Packaged-factory Batch 5 closeout: out/-backed tip proofs + family browser
  // evidence (contracts job has no out/; these run after `make build`).
  "src/lib/verify/packaged-factory-reference-family-closeout-gates.test.ts",
  "src/lib/verify/packaged-factory-reference-family-closeout-import-graphs.test.ts",
  "src/lib/verify/packaged-factory-reference-family-closeout-evidence-browser-verify.test.ts",
] as const;
