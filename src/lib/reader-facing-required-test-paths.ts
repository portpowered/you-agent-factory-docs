/**
 * Bounded required suite for current factory search, layout shell, and
 * accessibility contracts (restore-required-tests-gates-002).
 *
 * Invoked by `make test-reader-facing` / `bun run test:reader-facing` and
 * included in `make ci` / CI. Atlas-era GQA/module query fixtures and other
 * stale search/layout files stay excluded from plain `make test` until they
 * are rewritten for factory content.
 */

export const READER_FACING_REQUIRED_TEST_PATHS = [
  // Search library + factory UI contracts
  "src/lib/search/build-base-document.test.ts",
  "src/lib/search/build-blog-search-document.test.ts",
  "src/lib/search/build-documents.test.ts",
  "src/lib/search/collapse-search-results-to-page-hits.test.ts",
  "src/lib/search/docs-search-bootstrap-path.test.ts",
  "src/lib/search/enrich-search-document.test.ts",
  "src/lib/search/load-search-documents.test.ts",
  "src/lib/search/rerank-search-results.test.ts",
  "src/tests/search/build-documents.test.ts",
  "src/tests/features/search-ui.test.ts",
  "src/features/docs/search/SearchTrigger.test.tsx",
  "src/features/docs/search/search-result-title-content.test.ts",

  // Layout shell (home/docs header, locale, coverage contracts, live sidebar)
  "src/components/layout/docs-header.test.tsx",
  "src/components/layout/primary-nav.test.ts",
  "src/tests/layout/home-shell-coverage-contract.test.ts",
  "src/tests/layout/home-shell-styling-contract.test.tsx",
  "src/tests/layout/root-layout-locale.test.tsx",
  "src/tests/layout/module-page-coverage-contract.test.ts",
  "src/tests/layout/docs-sidebar-navigation.test.tsx",
  "src/tests/layout/docs-page-toc.test.tsx",
  "src/tests/layout/docs-index-shell.test.tsx",

  // Accessibility smokes under src/tests/a11y/
  "src/tests/a11y/primary-navigation.a11y.test.tsx",
  "src/tests/a11y/search-dialog.a11y.test.tsx",
  "src/tests/a11y/search-page-panel.a11y.test.tsx",
  "src/tests/a11y/docs-components.a11y.test.tsx",
  "src/tests/a11y/docs-sidebar-navigation.a11y.test.tsx",
  "src/tests/a11y/glossary-token.a11y.test.tsx",
] as const;

export const READER_FACING_REQUIRED_SUITE_COMMAND = "make test-reader-facing";
