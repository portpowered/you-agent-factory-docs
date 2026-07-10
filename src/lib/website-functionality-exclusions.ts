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
      note: "Website verifier and production-server helpers run in the verify-contract / integration gates.",
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
        "make test-build-contract (Pages/workflow contracts); remaining CI inventory deferred to restore-required-tests-gates-003",
      note: "CI workflow inventory and planner CI helpers stay out of the serialized website suite.",
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
        "pending required search suite (restore-required-tests-gates-002)",
      note: "Current factory search contracts will move into a bounded required suite.",
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
      ownedBy:
        "pending required search suite (restore-required-tests-gates-002)",
      note: "Factory search UI contracts will join the required search path.",
    },
    {
      prefix: "src/tests/a11y/",
      classification: "replaced",
      ownedBy:
        "pending required accessibility suite (restore-required-tests-gates-002)",
      note: "Accessibility smoke contracts will join the required path.",
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
        "make test-build-contract (site-path/navigation helpers); layout shell deferred to restore-required-tests-gates-002",
      note: "Navigation path helpers are covered by build-contract; remaining layout adapters stay deferred.",
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
        "pending required search suite (restore-required-tests-gates-002); build-contract covers export search artifact helpers under src/lib/build/",
      note: "Search library unit contracts will join the required search path.",
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
      classification: "replaced",
      ownedBy:
        "pending required layout suite (restore-required-tests-gates-002)",
      note: "Docs slug renderer contract will join the required layout path.",
    },
    {
      path: "src/components/layout/docs-header.test.tsx",
      classification: "replaced",
      ownedBy:
        "pending required layout suite (restore-required-tests-gates-002)",
      note: "Docs header shell contract will join the required layout path.",
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
      classification: "replaced",
      ownedBy:
        "pending required search suite (restore-required-tests-gates-002)",
      note: "Search results UI contract will join the required search path.",
    },
    {
      path: "src/lib/i18n/localize-page-tree.test.ts",
      classification: "replaced",
      ownedBy:
        "pending required layout suite (restore-required-tests-gates-002)",
      note: "Localized page-tree contract will join the required layout path.",
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
        "make test-integration (current); pending required layout suite (restore-required-tests-gates-002)",
      note: "Docs sidebar shell is already on the integration path and will also join required layout coverage.",
    },
    {
      path: "src/tests/layout/docs-page-toc.test.tsx",
      classification: "replaced",
      ownedBy:
        "make test-integration (current); pending required layout suite (restore-required-tests-gates-002)",
      note: "Docs TOC shell is already on the integration path and will also join required layout coverage.",
    },
    {
      path: "src/tests/layout/docs-index-shell.test.tsx",
      classification: "replaced",
      ownedBy:
        "make test-integration (current); pending required layout suite (restore-required-tests-gates-002)",
      note: "Docs index shell is already on the integration path and will also join required layout coverage.",
    },
    {
      path: "src/tests/layout/home-shell-coverage-contract.test.ts",
      classification: "replaced",
      ownedBy:
        "pending required layout suite (restore-required-tests-gates-002)",
      note: "Home shell coverage contract will join the required layout path.",
    },
    {
      path: "src/tests/layout/home-shell-styling-contract.test.tsx",
      classification: "replaced",
      ownedBy:
        "pending required layout suite (restore-required-tests-gates-002)",
      note: "Home shell styling contract will join the required layout path.",
    },
    {
      path: "src/tests/layout/japanese-shell-routes.test.tsx",
      classification: "replaced",
      ownedBy:
        "pending required layout suite (restore-required-tests-gates-002)",
      note: "Japanese shell route contract will join the required layout path.",
    },
    {
      path: "src/tests/layout/localized-route-metadata.test.ts",
      classification: "replaced",
      ownedBy:
        "pending required layout suite (restore-required-tests-gates-002)",
      note: "Localized route metadata contract will join the required layout path.",
    },
    {
      path: "src/tests/layout/module-page-coverage-contract.test.ts",
      classification: "replaced",
      ownedBy:
        "pending required layout suite (restore-required-tests-gates-002)",
      note: "Module-page shell coverage contract will join the required layout path.",
    },
    {
      path: "src/tests/layout/root-layout-locale.test.tsx",
      classification: "replaced",
      ownedBy:
        "pending required layout suite (restore-required-tests-gates-002)",
      note: "Root layout locale contract will join the required layout path.",
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
