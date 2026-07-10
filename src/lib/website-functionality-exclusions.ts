/**
 * Classified exclusions for plain `make test` /
 * `scripts/run-website-functionality-tests.ts`.
 *
 * Classification:
 * - `active` — still excluded from the website functionality suite on purpose
 * - `replaced` — excluded here because a named required suite owns the contract
 *
 * Obsolete Atlas exclusions (deleted packages, missing paths, Atlas-only
 * suites) are removed from these lists rather than kept as permanent skips.
 */

export type WebsiteExclusionClass = "active" | "replaced";

export type WebsitePrefixExclusion = {
  prefix: string;
  classification: WebsiteExclusionClass;
  /** Required suite / make target that owns replaced contracts. */
  ownedBy?: string;
  note: string;
};

export type WebsiteSuffixExclusion = {
  suffix: string;
  classification: WebsiteExclusionClass;
  note: string;
};

export type WebsiteFileExclusion = {
  path: string;
  classification: WebsiteExclusionClass;
  ownedBy?: string;
  note: string;
};

/**
 * Prefix exclusions. Deleted Atlas packages (`src/features/ai/`,
 * `src/features/models/`) and the missing `src/tests/build/` tree are not
 * listed — those obsolete skips were removed in restore-required-tests-gates-001.
 */
export const WEBSITE_FUNCTIONALITY_PREFIX_EXCLUSIONS: readonly WebsitePrefixExclusion[] =
  [
    {
      prefix: "src/lib/verify/",
      classification: "replaced",
      ownedBy: "make test-verify-contract / bun run test:verify-contract",
      note: "Factory verifier tooling contracts run in the verify-contract gate; production-server lifecycle soft-gates also re-run under make test-integration.",
    },
    {
      prefix: "src/lib/governance/",
      classification: "active",
      note: "Governance / taxonomy audit suites run via dedicated scripts (verify/audit targets), not plain make test.",
    },
    {
      prefix: "src/tests/ci/",
      classification: "replaced",
      ownedBy:
        "make test-ci-contract / bun run test:ci-contract (workflow/Makefile alignment); make test-build-contract (Pages/export contracts)",
      note: "Bounded CI alignment contracts run in test-ci-contract; heavy fresh-checkout/planner suites stay out of plain make test.",
    },
    {
      prefix: "src/tests/discovery/",
      classification: "active",
      note: "Factory planner/discovery helpers are heavy and stay out of plain make test; obsolete Atlas discovery fixtures were deleted.",
    },
    {
      prefix: "src/tests/search/",
      classification: "replaced",
      ownedBy:
        "make test-reader-facing / bun run test:reader-facing (current factory search paths); Atlas-era GQA/module query fixtures remain excluded until rewritten",
      note: "Current factory search contracts run in the reader-facing required suite; stale Atlas query suites stay out of plain make test.",
    },
    {
      prefix: "src/tests/content/",
      classification: "active",
      note: "Content/render suites stay bounded out of plain make test; obsolete Atlas content suites were deleted from this tree.",
    },
    {
      prefix: "src/tests/docs/",
      classification: "replaced",
      ownedBy:
        "make component-coverage / bun run coverage (restore-required-tests-gates-005)",
      note: "Component coverage contract lives under the coverage gate.",
    },
    {
      prefix: "src/tests/features/",
      classification: "replaced",
      ownedBy: "make test-reader-facing / bun run test:reader-facing",
      note: "Factory search UI contracts run in the reader-facing required suite.",
    },
    {
      prefix: "src/tests/a11y/",
      classification: "replaced",
      ownedBy: "make test-reader-facing / bun run test:reader-facing",
      note: "Accessibility smoke contracts run in the reader-facing required suite.",
    },
    {
      prefix: "src/tests/fixtures/non-ai-shell/",
      classification: "active",
      note: "Non-AI shell fixture harness stays isolated from the default website suite.",
    },
    {
      prefix: "src/lib/navigation/",
      classification: "replaced",
      ownedBy:
        "make test-build-contract (site-path/navigation helpers); make test-reader-facing / make test-integration (layout shell)",
      note: "Navigation path helpers are covered by build-contract; layout shell adapters run in reader-facing and integration suites.",
    },
    {
      prefix: "src/lib/docs/",
      classification: "replaced",
      ownedBy:
        "make component-coverage / bun run coverage (restore-required-tests-gates-005)",
      note: "Docs component coverage gate and manifests belong to the coverage target.",
    },
    {
      prefix: "src/lib/search/",
      classification: "replaced",
      ownedBy:
        "make test-reader-facing / bun run test:reader-facing; build-contract covers export search artifact helpers under src/lib/build/",
      note: "Current factory search library unit contracts run in the reader-facing required suite.",
    },
    {
      prefix: "src/lib/build/",
      classification: "replaced",
      ownedBy: "make test-build-contract / bun run test:build-contract",
      note: "Build/export/base-path/Pages contracts run in the build-contract suite.",
    },
    {
      prefix: "src/lib/factory/",
      classification: "active",
      note: "Planner/factory operational suites run via dedicated report scripts, not plain make test.",
    },
  ];

/**
 * Atlas / Phase-1 built-HTML assertion filename suffixes. Kept as an active
 * guard so leftover or accidentally restored filenames cannot re-enter
 * required `make test`.
 */
export const WEBSITE_FUNCTIONALITY_ATLAS_HTML_ASSERTION_SUFFIXES: readonly WebsiteSuffixExclusion[] =
  [
    {
      suffix: "-built-route-convergence.test.tsx",
      classification: "active",
      note: "Retired Atlas built-route convergence assertion pattern.",
    },
    {
      suffix: "-built-route-convergence.test.ts",
      classification: "active",
      note: "Retired Atlas built-route convergence assertion pattern.",
    },
    {
      suffix: "-built-app.test.ts",
      classification: "active",
      note: "Retired Atlas built-app HTML assertion pattern.",
    },
    {
      suffix: "-built-app.test.tsx",
      classification: "active",
      note: "Retired Atlas built-app HTML assertion pattern.",
    },
  ];

/**
 * Explicit file exclusions outside the prefix set. Missing paths and
 * prefix-redundant build/docs entries were removed in
 * restore-required-tests-gates-001.
 */
export const WEBSITE_FUNCTIONALITY_FILE_EXCLUSIONS: readonly WebsiteFileExclusion[] =
  [
    {
      path: "src/lib/fumadocs-source-runtime.test.ts",
      classification: "active",
      note: "Fumadocs source runtime wiring stays out of the serialized website suite.",
    },
    {
      path: "src/lib/layout.shared.test.ts",
      classification: "active",
      note: "Shared layout option helpers stay out of plain make test.",
    },
    {
      path: "src/lib/scaffold.test.ts",
      classification: "active",
      note: "Scaffold CLI helper coverage stays out of plain make test.",
    },
    {
      path: "src/lib/source.test.ts",
      classification: "active",
      note: "Fumadocs source loader coverage stays out of plain make test.",
    },
    {
      path: "src/app/docs/docs-slug-renderer.test.tsx",
      classification: "active",
      note: "Docs slug renderer still asserts Atlas-era locale/module fixtures; keep out of plain make test until rewritten for factory pages.",
    },
    {
      path: "src/components/layout/docs-header.test.tsx",
      classification: "replaced",
      ownedBy: "make test-reader-facing / bun run test:reader-facing",
      note: "Docs header shell contract runs in the reader-facing required suite.",
    },
    {
      path: "src/features/blog/components/BlogRelatedDocs.test.tsx",
      classification: "active",
      note: "Blog related-docs component coverage stays bounded out of plain make test.",
    },
    {
      path: "src/features/blog/components/blog-related-docs-blog-integration.test.tsx",
      classification: "active",
      note: "Blog related-docs integration coverage stays bounded out of plain make test.",
    },
    {
      path: "src/features/docs/components/CitationList.test.tsx",
      classification: "active",
      note: "Docs citation list component coverage stays bounded out of plain make test.",
    },
    {
      path: "src/features/docs/components/DerivedRelatedDocs.test.tsx",
      classification: "active",
      note: "Derived related-docs component coverage stays bounded out of plain make test.",
    },
    {
      path: "src/features/docs/components/DocsAutoLinkedDescription.test.tsx",
      classification: "active",
      note: "Auto-linked description coverage stays bounded out of plain make test.",
    },
    {
      path: "src/features/docs/components/ProseAutoLinkText.test.tsx",
      classification: "active",
      note: "Prose auto-link coverage stays bounded out of plain make test.",
    },
    {
      path: "src/features/docs/components/RegistryAssociatedRecords.test.tsx",
      classification: "active",
      note: "Registry associated-records coverage stays bounded out of plain make test.",
    },
    {
      path: "src/features/docs/components/RelatedDocList.test.tsx",
      classification: "active",
      note: "Related doc list coverage stays bounded out of plain make test.",
    },
    {
      path: "src/features/docs/components/RelatedDocs.test.tsx",
      classification: "active",
      note: "Related docs coverage stays bounded out of plain make test.",
    },
    {
      path: "src/features/docs/components/RelatedRegistryDocs.test.tsx",
      classification: "active",
      note: "Related registry docs coverage stays bounded out of plain make test.",
    },
    {
      path: "src/features/docs/components/Section.test.tsx",
      classification: "active",
      note: "Docs Section component coverage stays bounded out of plain make test.",
    },
    {
      path: "src/features/docs/components/T.test.tsx",
      classification: "active",
      note: "Docs T/message component coverage stays bounded out of plain make test.",
    },
    {
      path: "src/features/docs/components/TagPillList.test.tsx",
      classification: "active",
      note: "Tag pill list coverage stays bounded out of plain make test.",
    },
    {
      path: "src/features/docs/search/SearchResults.test.tsx",
      classification: "active",
      note: "SearchResults UI still asserts Atlas-era GQA/module fixtures; keep out until rewritten for factory search hits.",
    },
    {
      path: "src/lib/i18n/localize-page-tree.test.ts",
      classification: "active",
      note: "Localized page-tree suite still asserts Atlas attention proof sets; keep out until rewritten for factory collections.",
    },
    {
      path: "src/lib/site/site-config-compatibility.test.tsx",
      classification: "active",
      note: "Site-config compatibility stays out of the serialized website suite.",
    },
    {
      path: "src/lib/site/site-config-resolution.test.ts",
      classification: "active",
      note: "Site-config resolution stays out of the serialized website suite.",
    },
    {
      path: "src/tests/component-examples/registry.test.tsx",
      classification: "active",
      note: "Component-examples registry harness stays out of plain make test.",
    },
    {
      path: "src/tests/layout/docs-sidebar-navigation.test.tsx",
      classification: "replaced",
      ownedBy:
        "make test-reader-facing / bun run test:reader-facing; make test-integration",
      note: "Docs sidebar shell runs in the reader-facing required suite and the integration path.",
    },
    {
      path: "src/tests/layout/docs-page-toc.test.tsx",
      classification: "replaced",
      ownedBy:
        "make test-reader-facing / bun run test:reader-facing; make test-integration",
      note: "Docs TOC shell runs in the reader-facing required suite and the integration path.",
    },
    {
      path: "src/tests/layout/docs-index-shell.test.tsx",
      classification: "replaced",
      ownedBy:
        "make test-reader-facing / bun run test:reader-facing; make test-integration",
      note: "Docs index shell runs in the reader-facing required suite and the integration path.",
    },
    {
      path: "src/tests/layout/home-shell-coverage-contract.test.ts",
      classification: "replaced",
      ownedBy: "make test-reader-facing / bun run test:reader-facing",
      note: "Home shell coverage contract runs in the reader-facing required suite.",
    },
    {
      path: "src/tests/layout/home-shell-styling-contract.test.tsx",
      classification: "replaced",
      ownedBy: "make test-reader-facing / bun run test:reader-facing",
      note: "Home shell styling contract runs in the reader-facing required suite.",
    },
    {
      path: "src/tests/layout/japanese-shell-routes.test.tsx",
      classification: "active",
      note: "Japanese shell route suite still asserts Atlas architecture/glossary indexes; keep out until rewritten for factory collections.",
    },
    {
      path: "src/tests/layout/localized-route-metadata.test.ts",
      classification: "active",
      note: "Localized route metadata still asserts Atlas module proof sets; keep out until rewritten for factory pages.",
    },
    {
      path: "src/tests/layout/module-page-coverage-contract.test.ts",
      classification: "replaced",
      ownedBy: "make test-reader-facing / bun run test:reader-facing",
      note: "Module-page shell coverage contract runs in the reader-facing required suite.",
    },
    {
      path: "src/tests/layout/root-layout-locale.test.tsx",
      classification: "replaced",
      ownedBy: "make test-reader-facing / bun run test:reader-facing",
      note: "Root layout locale contract runs in the reader-facing required suite.",
    },
  ];

/** Obsolete Atlas suites deleted in restore-required-tests-gates-001. */
export const DELETED_OBSOLETE_ATLAS_WEBSITE_SUITES = [
  "src/tests/content/attention-tag-landing.test.ts",
  "src/tests/content/architecture-index.test.ts",
  "src/tests/content/glossary-index.test.ts",
  "src/tests/discovery/verify-grouped-query-attention-built-route.test.ts",
  "src/lib/build/built-app-html-test-utils.test.ts",
  "src/lib/build/verify-export-routes.test.ts",
  "src/lib/build/verify-module-built-routes.test.ts",
  "src/features/docs/components/PageAsset.test.tsx",
  "src/tests/layout/docs-shell-contract.test.tsx",
  "src/tests/layout/docs-page-footer-hover-convergence.test.tsx",
  "src/tests/layout/site-routes-shell.test.tsx",
] as const;

/** Deleted package / missing directory prefixes removed from the exclusion list. */
export const REMOVED_OBSOLETE_EXCLUSION_PREFIXES = [
  "src/features/ai/",
  "src/features/models/",
  "src/tests/build/",
] as const;

export function listWebsiteFunctionalityExcludedPrefixes(): string[] {
  return WEBSITE_FUNCTIONALITY_PREFIX_EXCLUSIONS.map((entry) => entry.prefix);
}

export function listWebsiteFunctionalityAtlasHtmlAssertionSuffixes(): string[] {
  return WEBSITE_FUNCTIONALITY_ATLAS_HTML_ASSERTION_SUFFIXES.map(
    (entry) => entry.suffix,
  );
}

export function listWebsiteFunctionalityExcludedFiles(): ReadonlySet<string> {
  return new Set(
    WEBSITE_FUNCTIONALITY_FILE_EXCLUSIONS.map((entry) => entry.path),
  );
}

export function isWebsiteFunctionalityExcluded(relativePath: string): boolean {
  const excludedFiles = listWebsiteFunctionalityExcludedFiles();
  if (excludedFiles.has(relativePath)) {
    return true;
  }

  if (
    listWebsiteFunctionalityExcludedPrefixes().some((prefix) =>
      relativePath.startsWith(prefix),
    )
  ) {
    return true;
  }

  return listWebsiteFunctionalityAtlasHtmlAssertionSuffixes().some((suffix) =>
    relativePath.endsWith(suffix),
  );
}
