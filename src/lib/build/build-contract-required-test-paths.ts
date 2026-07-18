/**
 * Bounded required suite for build/export/base-path/Pages contracts
 * (restore-required-tests-gates / make test-build-contract).
 */

export const BUILD_CONTRACT_REQUIRED_TEST_PATHS = [
  "src/lib/build/export-out-directory.test.ts",
  "src/lib/build/verify-export-base-path.test.ts",
  "src/lib/build/static-export.test.ts",
  "src/lib/build/deploy-pages-workflow-contract.test.ts",
  "src/lib/build/built-app-html-paths.test.ts",
  "src/lib/build/verify-project-site-export-consumers.test.ts",
  "src/lib/build/acquire-trusted-project-site-export.test.ts",
  "src/lib/build/guard-pages-deployed-artifact.test.ts",
  "src/lib/build/exported-site-budget.test.ts",
  "src/lib/build/required-read-only-export-probes.test.ts",
  "src/lib/build/build-contract-required-test-paths.test.ts",
  "src/lib/navigation/site-path.test.ts",
  "src/lib/navigation/site-navigation-href.test.ts",
  "src/lib/navigation/site-metadata-path.test.ts",
  "src/lib/i18n/route-locale.test.ts",
  "src/lib/seo/production-metadata-base.test.ts",
  "src/lib/seo/export-absolute-canonical.test.ts",
  "src/lib/seo/page-open-graph.test.ts",
  "src/lib/seo/export-page-open-graph.test.ts",
  "src/lib/seo/social-preview-assets.test.ts",
  "src/lib/seo/export-social-preview-images.test.ts",
  "src/lib/seo/export-localized-alternates.test.ts",
  "src/lib/seo/public-sitemap-routes.test.ts",
  "src/lib/seo/export-sitemap.test.ts",
  "src/lib/seo/export-robots.test.ts",
  "src/lib/seo/verify-export-seo-discovery.test.ts",
  "src/lib/seo/documentation-route-migration.test.ts",
  "src/lib/seo/documentation-route-compatibility.test.tsx",
  "src/lib/seo/documentation-route-migration-canonical.test.ts",
  "src/features/docs/components/DocumentationRouteCompatibilityDocument.test.tsx",
] as const;

export const BUILD_CONTRACT_REQUIRED_SUITE_COMMAND = "make test-build-contract";
