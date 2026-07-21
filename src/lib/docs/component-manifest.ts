/**
 * Reusable shared components subject to the manifest-driven coverage gate.
 * Allowed manifest paths: src/components (any depth), src/features/.../components,
 * documented search UI under src/features/docs/search/, tag list UI under
 * src/features/docs/tags/, and rewrite-era factory-ui wrappers under
 * src/features/factory-ui/.
 *
 * Phase inventories below document broader shell/module/search surfaces.
 * `REUSABLE_COVERAGE_COMPONENTS` is the factory-green required set for
 * `make component-coverage`. Atlas models/topology graph components are deleted
 * in rewrite-delete-atlas-domain; use factory-ui thin wrappers for rewrite-era
 * reusable coverage.
 */
export type ComponentCoverageEntry = {
  /** Repo-relative source path */
  file: string;
  /** Human label for docs and failure messages */
  label: string;
  /** Minimum reachable line coverage (Bun `bun test --coverage` line %) */
  minReachableLinePercent: number;
  /** Unit or integration tests that exercise the component */
  unitTests: string[];
  /** Accessibility smoke tests, when applicable */
  a11ySmokeTests?: string[];
};

export type ThinWrapperEntry = {
  file: string;
  label: string;
  /** Primitive or package the wrapper forwards to */
  forwardsTo: string;
  /** Named smoke tests that prove render + accessibility */
  smokeTests: string[];
};

/** Phase 1 home/header/tag shell components touched by surface-polish work. */
export const PHASE_1_SHELL_COVERAGE_COMPONENTS: ComponentCoverageEntry[] = [
  {
    file: "src/components/home/home-brush-header.tsx",
    label: "HomeBrushHeader",
    minReachableLinePercent: 90,
    unitTests: ["src/components/home/home-brush-header.test.tsx"],
  },
  {
    file: "src/components/home/home-article.tsx",
    label: "HomeArticle",
    minReachableLinePercent: 90,
    unitTests: ["src/tests/content/home-page.test.tsx"],
  },
  {
    file: "src/components/home/home-browse-link.tsx",
    label: "HomeBrowseLink",
    minReachableLinePercent: 90,
    unitTests: ["src/components/home/home-browse-link.test.tsx"],
  },
  {
    file: "src/features/layout/primary-nav.ts",
    label: "Primary navigation",
    minReachableLinePercent: 90,
    unitTests: ["src/features/layout/primary-nav.test.ts"],
    a11ySmokeTests: ["src/tests/a11y/primary-navigation.a11y.test.tsx"],
  },
  {
    file: "src/features/layout/docs-header.tsx",
    label: "DocsHeader",
    minReachableLinePercent: 90,
    unitTests: ["src/features/layout/docs-header.test.tsx"],
    a11ySmokeTests: ["src/tests/a11y/primary-navigation.a11y.test.tsx"],
  },
  {
    file: "src/features/layout/canonical-docs-layout.tsx",
    label: "CanonicalDocsLayout",
    minReachableLinePercent: 90,
    unitTests: ["src/tests/a11y/docs-sidebar-navigation.a11y.test.tsx"],
    a11ySmokeTests: ["src/tests/a11y/docs-sidebar-navigation.a11y.test.tsx"],
  },
  {
    file: "src/features/docs/components/DocsIndexEntryList.tsx",
    label: "DocsIndexEntryList",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/components/DocsIndexEntryList.test.tsx"],
  },
  {
    file: "src/features/docs/search/SearchTrigger.tsx",
    label: "SearchTrigger",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/search/SearchTrigger.test.tsx"],
    a11ySmokeTests: ["src/tests/a11y/primary-navigation.a11y.test.tsx"],
  },
  {
    file: "src/features/docs/components/TagResourceList.tsx",
    label: "TagResourceList",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/components/TagResourceList.test.tsx"],
  },
  {
    file: "src/features/docs/tags/TagsIndexList.tsx",
    label: "TagsIndexList",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/tags/TagsIndexList.test.tsx"],
  },
];

/** Phase 1 GQA module page reusable components touched by renderer/linking refresh. */
export const PHASE_1_MODULE_PAGE_COVERAGE_COMPONENTS: ComponentCoverageEntry[] =
  [
    {
      file: "src/features/docs/components/Callout.tsx",
      label: "Callout",
      minReachableLinePercent: 90,
      unitTests: ["src/features/docs/components/Callout.test.tsx"],
      a11ySmokeTests: [
        "src/tests/a11y/docs-components.a11y.test.tsx (Callout accessibility smoke)",
      ],
    },
    {
      file: "src/features/docs/components/T.tsx",
      label: "T",
      minReachableLinePercent: 90,
      unitTests: ["src/features/docs/components/T.test.tsx"],
      a11ySmokeTests: [
        "src/tests/component-examples/registry.test.tsx (T example render smoke)",
      ],
    },
    {
      file: "src/features/docs/components/ProseAutoLinkText.tsx",
      label: "ProseAutoLinkText",
      minReachableLinePercent: 90,
      unitTests: ["src/features/docs/components/ProseAutoLinkText.test.tsx"],
    },
    {
      file: "src/features/docs/components/TBlockMath.tsx",
      label: "TBlockMath",
      minReachableLinePercent: 90,
      unitTests: ["src/features/docs/components/TBlockMath.test.tsx"],
    },
    {
      file: "src/features/docs/components/PageAsset.tsx",
      label: "PageAsset",
      minReachableLinePercent: 90,
      unitTests: ["src/features/docs/components/PageAsset.test.tsx"],
    },
    {
      file: "src/features/docs/components/MissingGraphRecord.tsx",
      label: "MissingGraphRecord",
      minReachableLinePercent: 90,
      unitTests: ["src/features/docs/components/MissingGraphRecord.test.tsx"],
    },
  ];

export const PHASE_2_DOCS_MDX_COVERAGE_COMPONENTS: ComponentCoverageEntry[] = [
  {
    file: "src/features/docs/components/Section.tsx",
    label: "Section",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/components/Section.test.tsx"],
    a11ySmokeTests: [
      "src/tests/a11y/docs-components.a11y.test.tsx (Section accessibility smoke)",
    ],
  },
  {
    file: "src/features/docs/components/RelatedDocList.tsx",
    label: "RelatedDocList",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/components/RelatedDocList.test.tsx"],
    a11ySmokeTests: [
      "src/tests/a11y/glossary-token.a11y.test.tsx (token glossary route accessibility smoke)",
    ],
  },
  {
    file: "src/features/docs/components/TagPillList.tsx",
    label: "TagPillList",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/components/TagPillList.test.tsx"],
    a11ySmokeTests: [
      "src/tests/a11y/docs-components.a11y.test.tsx (TagPillList accessibility smoke)",
      "src/tests/a11y/glossary-token.a11y.test.tsx (token glossary route accessibility smoke)",
    ],
  },
  {
    file: "src/features/docs/components/DerivedRelatedDocs.tsx",
    label: "DerivedRelatedDocs",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/components/DerivedRelatedDocs.test.tsx"],
    a11ySmokeTests: [
      "src/tests/a11y/docs-components.a11y.test.tsx (DerivedRelatedDocs accessibility smoke)",
    ],
  },
];

/** Phase 1 search presentation components touched by page-level result convergence. */
export const PHASE_1_SEARCH_COVERAGE_COMPONENTS: ComponentCoverageEntry[] = [
  {
    file: "src/features/docs/search/SearchPagePanel.tsx",
    label: "SearchPagePanel",
    minReachableLinePercent: 90,
    unitTests: ["src/tests/search/search-page-panel.test.tsx"],
    a11ySmokeTests: [
      "src/tests/a11y/search-page-panel.a11y.test.tsx (SearchPagePanel accessibility smoke)",
    ],
  },
  {
    file: "src/features/docs/search/SearchDialog.tsx",
    label: "SearchDialog",
    minReachableLinePercent: 90,
    unitTests: ["src/tests/search/search-dialog-panel.test.tsx"],
    a11ySmokeTests: [
      "src/tests/a11y/search-dialog.a11y.test.tsx (SearchDialog accessibility smoke)",
    ],
  },
  {
    file: "src/features/docs/search/SearchResults.tsx",
    label: "SearchResults",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/search/SearchResults.test.tsx"],
    a11ySmokeTests: [
      "src/tests/a11y/docs-components.a11y.test.tsx (SearchResults accessibility smoke)",
    ],
  },
  {
    file: "src/features/docs/search/SearchResultRow.tsx",
    label: "SearchResultRow",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/search/SearchResults.test.tsx"],
    a11ySmokeTests: [
      "src/tests/a11y/docs-components.a11y.test.tsx (SearchResults accessibility smoke)",
    ],
  },
  {
    file: "src/features/docs/search/SearchResultTitle.tsx",
    label: "SearchResultTitle",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/search/SearchResults.test.tsx"],
  },
  {
    file: "src/features/docs/search/SearchResultMetaDetails.tsx",
    label: "SearchResultMetaDetails",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/search/SearchResults.test.tsx"],
    a11ySmokeTests: [
      "src/tests/a11y/docs-components.a11y.test.tsx (SearchResultMetaDetails accessibility smoke)",
    ],
  },
];

/**
 * Required coverage set for `make component-coverage`.
 * Factory-green components only — Atlas-stale search/auto-link/related-docs
 * entries remain in the phase inventories above until their unit tests are
 * rewritten for factory content.
 */
export const REUSABLE_COVERAGE_COMPONENTS: ComponentCoverageEntry[] = [
  {
    file: "src/features/docs/components/Callout.tsx",
    label: "Callout",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/components/Callout.test.tsx"],
    a11ySmokeTests: [
      "src/tests/a11y/docs-components.a11y.test.tsx (Callout accessibility smoke)",
    ],
  },
  {
    file: "src/features/docs/components/TBlockMath.tsx",
    label: "TBlockMath",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/components/TBlockMath.test.tsx"],
  },
  {
    file: "src/features/docs/components/PageAsset.tsx",
    label: "PageAsset",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/components/PageAsset.test.tsx"],
  },
  {
    file: "src/features/docs/components/MissingGraphRecord.tsx",
    label: "MissingGraphRecord",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/components/MissingGraphRecord.test.tsx"],
  },
  {
    file: "src/features/docs/components/TagPillList.tsx",
    label: "TagPillList",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/components/TagPillList.test.tsx"],
    a11ySmokeTests: [
      "src/tests/a11y/docs-components.a11y.test.tsx (TagPillList accessibility smoke)",
      "src/tests/a11y/glossary-token.a11y.test.tsx (token glossary route accessibility smoke)",
    ],
  },
  {
    file: "src/components/home/home-brush-header.tsx",
    label: "HomeBrushHeader",
    minReachableLinePercent: 90,
    unitTests: ["src/components/home/home-brush-header.test.tsx"],
  },
  {
    file: "src/components/home/home-article.tsx",
    label: "HomeArticle",
    minReachableLinePercent: 90,
    unitTests: ["src/tests/content/home-page.test.tsx"],
  },
  {
    file: "src/components/home/home-browse-link.tsx",
    label: "HomeBrowseLink",
    minReachableLinePercent: 90,
    unitTests: ["src/components/home/home-browse-link.test.tsx"],
  },
  {
    file: "src/features/layout/primary-nav.ts",
    label: "Primary navigation",
    minReachableLinePercent: 90,
    unitTests: ["src/features/layout/primary-nav.test.ts"],
    a11ySmokeTests: ["src/tests/a11y/primary-navigation.a11y.test.tsx"],
  },
  {
    file: "src/features/layout/docs-header.tsx",
    label: "DocsHeader",
    minReachableLinePercent: 90,
    unitTests: ["src/features/layout/docs-header.test.tsx"],
    a11ySmokeTests: ["src/tests/a11y/primary-navigation.a11y.test.tsx"],
  },
  {
    file: "src/features/layout/canonical-docs-layout.tsx",
    label: "CanonicalDocsLayout",
    minReachableLinePercent: 90,
    unitTests: ["src/tests/a11y/docs-sidebar-navigation.a11y.test.tsx"],
    a11ySmokeTests: ["src/tests/a11y/docs-sidebar-navigation.a11y.test.tsx"],
  },
  {
    file: "src/features/docs/components/DocsIndexEntryList.tsx",
    label: "DocsIndexEntryList",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/components/DocsIndexEntryList.test.tsx"],
  },
  {
    file: "src/features/docs/search/SearchTrigger.tsx",
    label: "SearchTrigger",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/search/SearchTrigger.test.tsx"],
    a11ySmokeTests: ["src/tests/a11y/primary-navigation.a11y.test.tsx"],
  },
  {
    file: "src/features/docs/components/TagResourceList.tsx",
    label: "TagResourceList",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/components/TagResourceList.test.tsx"],
  },
  {
    file: "src/features/docs/tags/TagsIndexList.tsx",
    label: "TagsIndexList",
    minReachableLinePercent: 90,
    unitTests: ["src/features/docs/tags/TagsIndexList.test.tsx"],
  },
];

/** Documented thin wrappers that forward without extra branching. */
export const REUSABLE_THIN_WRAPPERS: ThinWrapperEntry[] = [
  {
    file: "src/features/factory-ui/graphs.ts",
    label: "factory-ui graphs",
    forwardsTo: "@you-agent-factory/components/graphs",
    smokeTests: ["src/features/factory-ui/graphs.test.tsx"],
  },
  {
    file: "src/features/factory-ui/charts.ts",
    label: "factory-ui charts",
    forwardsTo: "@you-agent-factory/components/charts",
    smokeTests: ["src/features/factory-ui/charts.test.tsx"],
  },
  {
    file: "src/features/factory-ui/data-display.ts",
    label: "factory-ui DataTable",
    forwardsTo: "DataTable (@you-agent-factory/components/data-display)",
    smokeTests: ["src/features/factory-ui/data-display.test.tsx"],
  },
  {
    file: "src/features/factory-ui/data-display.ts",
    label: "factory-ui CodePanel",
    forwardsTo: "CodePanel (@you-agent-factory/components/data-display)",
    smokeTests: ["src/features/factory-ui/data-display.test.tsx"],
  },
];
