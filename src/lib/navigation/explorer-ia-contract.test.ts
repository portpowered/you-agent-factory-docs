/**
 * Focused explorer IA contract proofs for exact order and fail-closed locale
 * behavior. Desktop/mobile parity lives in desktop-mobile-explorer-parity;
 * accessible names / keyboard reachability live in docs-sidebar-navigation.a11y.
 *
 * R02 story 002 also locks eight Program documentation page membership under
 * declared subgroups and Concepts Skills / MCP / Tool calling / Tokens groups.
 *
 * Story 006 locks the three-level Program documentation contract end-to-end:
 * FAQ stays top-level outside Program documentation, and the former ten-group
 * Basics/Feature support/Functions/… separator order is no longer required.
 */
import { describe, expect, test } from "bun:test";
import {
  DOCS_EXPLORER_TOP_LEVEL_FAQ_URL,
  DOCS_PAGE_TREE_ROOT_NAME,
  FACTORY_EXPLORER_FOLDER_LABELS,
  FACTORY_EXPLORER_SECTION_ORDER,
} from "@/lib/content/factory-breadcrumb-sidebar";
import {
  DOCUMENTATION_SIDEBAR_SECONDARY_LABELS,
  FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG,
  FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG,
  FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG,
  SIDEBAR_GROUP_LABELS,
} from "@/lib/content/sidebar-grouping";
import { loadUiMessages } from "@/lib/content/ui-messages";
import type { UiMessages } from "@/lib/content/ui-messages.types";
import {
  ExplorerLabelsError,
  resolveExplorerMessages,
} from "@/lib/i18n/explorer-labels";
import { supportedLocales } from "@/lib/i18n/locale-routing";
import { localizePageTree } from "@/lib/i18n/localize-page-tree";
import {
  buildExplorerTreeSignature,
  folderSignatureByName,
  pageEntriesInFolder,
  pageEntriesInSecondaryFolderUnderSeparator,
  pageEntriesUnderSeparator,
  secondaryFolderNamesUnderSeparator,
  separatorNamesInFolder,
  topLevelFolderNames,
  topLevelPageEntries,
} from "@/lib/navigation/explorer-tree-signature";
import { listDocumentationRouteMigrationOldRoutes } from "@/lib/seo/documentation-route-migration";
import { source } from "@/lib/source";

const DECLARED_CONCEPTS_GROUP_ORDER = Object.values(
  SIDEBAR_GROUP_LABELS.concepts,
);

const DECLARED_DOCUMENTATION_GROUP_ORDER = Object.values(
  SIDEBAR_GROUP_LABELS.documentation,
);

const DECLARED_TOP_LEVEL_FOLDER_ORDER = [
  FACTORY_EXPLORER_FOLDER_LABELS.guides,
  FACTORY_EXPLORER_FOLDER_LABELS.concepts,
  FACTORY_EXPLORER_FOLDER_LABELS.techniques,
  FACTORY_EXPLORER_FOLDER_LABELS.documentation,
  FACTORY_EXPLORER_FOLDER_LABELS.references,
  FACTORY_EXPLORER_FOLDER_LABELS.factories,
  FACTORY_EXPLORER_FOLDER_LABELS.workers,
  FACTORY_EXPLORER_FOLDER_LABELS.workstations,
] as const;

/**
 * R01 Program documentation pages that remain explorer members after W18
 * move-stub demotion and PS-100 demotions.
 */
const R01_PROGRAM_DOCUMENTATION_EXPLORER_PAGES = [
  { slug: "packaged-documents", group: "capabilities" },
] as const;

/**
 * Direct Program documentation top groups and their pages under locked PS-100.
 * Operations → Configuring secondary membership is owned by STORY_004_SECONDARY_PAGES;
 * the Operations list below is direct children only (no Configuring nest).
 */
const STORY_003_DIRECT_TOP_GROUP_PAGES = {
  orientation: ["what-is-you-agent-factory"],
  capabilities: [
    "harness-support",
    "replays-records",
    "submitting-work",
    "packaged-documents",
  ],
  interfaces: ["cli", "mcp"],
  operations: ["logs", "metrics", "dashboard-ui-overview"],
} as const;

/**
 * Operations → Configuring secondary membership, including cross-collection
 * factories config pages that keep `/docs/factories/...` routes.
 */
const STORY_004_SECONDARY_PAGES = {
  operations: {
    configuring: [
      "resources",
      "factories/configuration",
      "factories/global-configuration",
    ],
  },
} as const;

/** Config / ops pages that must not leak into Capabilities. */
const CAPABILITIES_EXCLUDED_SLUGS = [
  "workers",
  "poller-workers",
  "script-workers",
  "agent-workers",
  "inference-workers",
  "mock-workers",
  "workstations",
  "configuration",
  "factory-session",
  "global-configuration-factories",
  "resources",
  "throttling-and-limits",
  "logs",
  "metrics",
] as const;

/** Locked PS-100 demotions — published but absent from Program explorer. */
const PROGRAM_DOCUMENTATION_DEMOTED_EXPLORER_SLUGS = [
  "install",
  "throttling-and-limits",
  "architecture-of-system",
  "petri",
  "troubleshooting",
  "security-trust-boundaries",
  "contributing-to-these-docs",
] as const;

/**
 * Former flat Program documentation separators (Basics → … → Additional
 * reference). Story 006 proves these are no longer the explorer contract.
 * Keep exact historical spellings (including "Internal architecture" and
 * singular "Additional reference") so regressions to the old IA fail CI.
 */
const FORMER_TEN_GROUP_PROGRAM_DOCUMENTATION_SEPARATORS = [
  "Basics",
  "Feature support",
  "Functions",
  "Configuration",
  "API",
  "CLI",
  "MCP",
  "Operational",
  "Internal architecture",
  "Additional reference",
] as const;

/** R00 Concepts pages required under declared explorer subgroups. */
const R00_CONCEPTS_PAGES = [
  { slug: "skills", group: "harnesses" },
  { slug: "mcp", group: "harnesses" },
  { slug: "tool-calling", group: "model-inference" },
  { slug: "tokens", group: "model-inference" },
] as const;

function isSubsequence(
  actual: readonly string[],
  declared: readonly string[],
): boolean {
  let declaredIndex = 0;
  for (const label of actual) {
    const next = declared.indexOf(label, declaredIndex);
    if (next === -1) {
      return false;
    }
    declaredIndex = next + 1;
  }
  return true;
}

function urlEndsWithSlug(
  url: string,
  collection: string,
  slug: string,
): boolean {
  return url.endsWith(`/docs/${collection}/${slug}`);
}

describe("explorer IA exact-order contract", () => {
  test("declared top-level section order is collection folders then FAQ", () => {
    expect(FACTORY_EXPLORER_SECTION_ORDER).toEqual([
      { kind: "collection", id: "guides" },
      { kind: "collection", id: "concepts" },
      { kind: "collection", id: "techniques" },
      { kind: "collection", id: "documentation" },
      { kind: "collection", id: "references" },
      { kind: "collection", id: "factories" },
      { kind: "collection", id: "workers" },
      { kind: "collection", id: "workstations" },
      { kind: "page", docsSlug: "documentation/faq" },
    ]);
  });

  test("default-locale constructed tree matches exact top-level, Concepts, and Program documentation order", async () => {
    const messages = await loadUiMessages("en");
    const signature = buildExplorerTreeSignature(
      localizePageTree(source.pageTree, "en", { messages }),
    );

    expect(signature.rootName).toBe(DOCS_PAGE_TREE_ROOT_NAME);
    expect(topLevelFolderNames(signature)).toEqual([
      ...DECLARED_TOP_LEVEL_FOLDER_ORDER,
    ]);
    expect(topLevelFolderNames(signature)).not.toContain("Glossary");

    const topLevelPages = topLevelPageEntries(signature);
    expect(topLevelPages).toEqual([
      { name: "FAQ", url: DOCS_EXPLORER_TOP_LEVEL_FAQ_URL },
    ]);
    expect(signature.children.at(-1)).toMatchObject({
      type: "page",
      name: "FAQ",
      url: DOCS_EXPLORER_TOP_LEVEL_FAQ_URL,
    });

    const concepts = folderSignatureByName(
      signature,
      FACTORY_EXPLORER_FOLDER_LABELS.concepts,
    );
    expect(concepts).toBeTruthy();
    if (!concepts) {
      throw new Error("expected Concepts folder");
    }
    expect(separatorNamesInFolder(concepts)).toEqual([
      ...DECLARED_CONCEPTS_GROUP_ORDER,
    ]);
    expect(pageEntriesInFolder(concepts).length).toBeGreaterThan(0);
    expect(
      pageEntriesInFolder(concepts).some((page) =>
        page.url.endsWith("/docs/concepts/harness"),
      ),
    ).toBe(true);

    const documentation = folderSignatureByName(
      signature,
      FACTORY_EXPLORER_FOLDER_LABELS.documentation,
    );
    expect(documentation).toBeTruthy();
    if (!documentation) {
      throw new Error("expected Program documentation folder");
    }
    expect(separatorNamesInFolder(documentation)).toEqual([
      ...DECLARED_DOCUMENTATION_GROUP_ORDER,
    ]);
    expect(
      secondaryFolderNamesUnderSeparator(
        documentation,
        SIDEBAR_GROUP_LABELS.documentation.operations,
      ),
    ).toEqual(Object.values(DOCUMENTATION_SIDEBAR_SECONDARY_LABELS.operations));
    expect(
      pageEntriesInFolder(documentation).some((page) =>
        page.url.endsWith("/docs/documentation/faq"),
      ),
    ).toBe(false);
    for (const oldRoute of listDocumentationRouteMigrationOldRoutes()) {
      expect(
        pageEntriesInFolder(documentation).some((page) =>
          page.url.endsWith(oldRoute),
        ),
        `${oldRoute} must not appear in Program documentation explorer`,
      ).toBe(false);
    }
  });

  test("default-locale Program documentation places orientation, capability, interface, and operations pages under declared top groups", async () => {
    const messages = await loadUiMessages("en");
    const signature = buildExplorerTreeSignature(
      localizePageTree(source.pageTree, "en", { messages }),
    );

    const documentation = folderSignatureByName(
      signature,
      FACTORY_EXPLORER_FOLDER_LABELS.documentation,
    );
    expect(documentation).toBeTruthy();
    if (!documentation) {
      throw new Error("expected Program documentation folder");
    }

    expect(separatorNamesInFolder(documentation)).toEqual([
      ...DECLARED_DOCUMENTATION_GROUP_ORDER,
    ]);

    for (const [groupId, slugs] of Object.entries(
      STORY_003_DIRECT_TOP_GROUP_PAGES,
    ) as Array<
      [keyof typeof STORY_003_DIRECT_TOP_GROUP_PAGES, readonly string[]]
    >) {
      const groupLabel = SIDEBAR_GROUP_LABELS.documentation[groupId];
      if (groupId !== "operations") {
        expect(
          secondaryFolderNamesUnderSeparator(documentation, groupLabel),
        ).toEqual([]);
      }

      const underGroup = pageEntriesUnderSeparator(documentation, groupLabel);
      if (groupId === "operations") {
        for (const slug of slugs) {
          expect(
            FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG[
              slug as keyof typeof FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG
            ],
          ).toBe(groupId);
          expect(
            underGroup.some((entry) =>
              urlEndsWithSlug(entry.url, "documentation", slug),
            ),
            `${slug} must sit under Program documentation top group ${groupLabel}`,
          ).toBe(true);
        }
        continue;
      }

      const underGroupSlugs = underGroup.map((entry) => {
        const match = entry.url.match(/\/documentation\/([^/]+)$/);
        expect(
          match?.[1],
          `${entry.url} must be a documentation page`,
        ).toBeTruthy();
        return match?.[1] ?? "";
      });

      expect(underGroupSlugs.sort()).toEqual([...slugs].sort());

      for (const slug of slugs) {
        expect(
          FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG[
            slug as keyof typeof FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG
          ],
        ).toBe(groupId);
        expect(
          underGroup.some((entry) =>
            urlEndsWithSlug(entry.url, "documentation", slug),
          ),
          `${slug} must sit under Program documentation top group ${groupLabel}`,
        ).toBe(true);
      }
    }

    const capabilitiesPages = pageEntriesUnderSeparator(
      documentation,
      SIDEBAR_GROUP_LABELS.documentation.capabilities,
    );
    for (const slug of CAPABILITIES_EXCLUDED_SLUGS) {
      expect(
        capabilitiesPages.some((entry) =>
          urlEndsWithSlug(entry.url, "documentation", slug),
        ),
        `${slug} must not appear under Capabilities`,
      ).toBe(false);
    }

    for (const slug of PROGRAM_DOCUMENTATION_DEMOTED_EXPLORER_SLUGS) {
      expect(
        pageEntriesInFolder(documentation).some((entry) =>
          urlEndsWithSlug(entry.url, "documentation", slug),
        ),
        `${slug} must not appear in Program documentation explorer`,
      ).toBe(false);
    }
  });

  test("default-locale Program documentation nests Operations Configuring secondary with exact page membership", async () => {
    const messages = await loadUiMessages("en");
    const signature = buildExplorerTreeSignature(
      localizePageTree(source.pageTree, "en", { messages }),
    );

    const documentation = folderSignatureByName(
      signature,
      FACTORY_EXPLORER_FOLDER_LABELS.documentation,
    );
    expect(documentation).toBeTruthy();
    if (!documentation) {
      throw new Error("expected Program documentation folder");
    }

    const operationsLabel = SIDEBAR_GROUP_LABELS.documentation.operations;

    expect(
      secondaryFolderNamesUnderSeparator(documentation, operationsLabel),
    ).toEqual(Object.values(DOCUMENTATION_SIDEBAR_SECONDARY_LABELS.operations));

    for (const [groupId, secondaries] of Object.entries(
      STORY_004_SECONDARY_PAGES,
    ) as Array<
      [
        keyof typeof STORY_004_SECONDARY_PAGES,
        (typeof STORY_004_SECONDARY_PAGES)[keyof typeof STORY_004_SECONDARY_PAGES],
      ]
    >) {
      const groupLabel = SIDEBAR_GROUP_LABELS.documentation[groupId];
      for (const [secondaryId, slugs] of Object.entries(secondaries) as Array<
        [string, readonly string[]]
      >) {
        const secondaryLabel =
          DOCUMENTATION_SIDEBAR_SECONDARY_LABELS[groupId][
            secondaryId as keyof (typeof DOCUMENTATION_SIDEBAR_SECONDARY_LABELS)[typeof groupId]
          ];
        const underSecondary = pageEntriesInSecondaryFolderUnderSeparator(
          documentation,
          groupLabel,
          secondaryLabel,
        );
        const underSecondarySlugs = underSecondary.map((entry) => {
          const documentationMatch = entry.url.match(
            /\/docs\/documentation\/([^/]+)$/,
          );
          if (documentationMatch?.[1]) {
            return documentationMatch[1];
          }
          const factoriesMatch = entry.url.match(/\/docs\/(factories\/[^/]+)$/);
          expect(
            factoriesMatch?.[1],
            `${entry.url} must be a documentation or factories config page`,
          ).toBeTruthy();
          return factoriesMatch?.[1] ?? "";
        });

        expect(underSecondarySlugs.sort()).toEqual([...slugs].sort());

        for (const slug of slugs) {
          const membership =
            FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG[
              slug as keyof typeof FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG
            ];
          expect(membership.group).toBe(groupId);
          expect(
            "secondary" in membership
              ? String(membership.secondary)
              : undefined,
          ).toBe(secondaryId);
          const slashIndex = slug.indexOf("/");
          const collection =
            slashIndex === -1 ? "documentation" : slug.slice(0, slashIndex);
          const pathSlug =
            slashIndex === -1 ? slug : slug.slice(slashIndex + 1);
          expect(
            underSecondary.some((entry) =>
              urlEndsWithSlug(entry.url, collection, pathSlug),
            ),
            `${slug} must sit under ${groupLabel} → ${secondaryLabel}`,
          ).toBe(true);
        }
      }
    }

    const configuringPages = pageEntriesInSecondaryFolderUnderSeparator(
      documentation,
      operationsLabel,
      DOCUMENTATION_SIDEBAR_SECONDARY_LABELS.operations.configuring,
    );
    expect(
      configuringPages.some((entry) =>
        urlEndsWithSlug(entry.url, "documentation", "replays-records"),
      ),
      "replays-records must not duplicate under Configuring",
    ).toBe(false);

    const capabilitiesPages = pageEntriesUnderSeparator(
      documentation,
      SIDEBAR_GROUP_LABELS.documentation.capabilities,
    );
    expect(
      capabilitiesPages.some((entry) =>
        urlEndsWithSlug(entry.url, "documentation", "replays-records"),
      ),
      "replays-records must remain under Capabilities",
    ).toBe(true);

    const operationsPages = pageEntriesUnderSeparator(
      documentation,
      operationsLabel,
    );
    for (const invented of ["model-workers", "hosted-workers"] as const) {
      expect(
        operationsPages.some((entry) =>
          urlEndsWithSlug(entry.url, "documentation", invented),
        ),
        `${invented} must not be invented under Operations`,
      ).toBe(false);
    }
  });

  test("story 006 locks three-level Program documentation IA with FAQ outside and former ten-group order rejected", async () => {
    const messages = await loadUiMessages("en");
    const signature = buildExplorerTreeSignature(
      localizePageTree(source.pageTree, "en", { messages }),
    );

    const faq = topLevelPageEntries(signature);
    expect(faq).toEqual([
      { name: "FAQ", url: DOCS_EXPLORER_TOP_LEVEL_FAQ_URL },
    ]);
    expect(signature.children.at(-1)).toMatchObject({
      type: "page",
      name: "FAQ",
      url: DOCS_EXPLORER_TOP_LEVEL_FAQ_URL,
    });

    const documentation = folderSignatureByName(
      signature,
      FACTORY_EXPLORER_FOLDER_LABELS.documentation,
    );
    expect(documentation).toBeTruthy();
    if (!documentation) {
      throw new Error("expected Program documentation folder");
    }

    expect(separatorNamesInFolder(documentation)).toEqual([
      ...DECLARED_DOCUMENTATION_GROUP_ORDER,
    ]);
    for (const former of FORMER_TEN_GROUP_PROGRAM_DOCUMENTATION_SEPARATORS) {
      expect(
        separatorNamesInFolder(documentation),
        `former ten-group separator "${former}" must not be the Program documentation contract`,
      ).not.toContain(former);
    }

    expect(
      pageEntriesInFolder(documentation).some((page) =>
        page.url.endsWith("/docs/documentation/faq"),
      ),
    ).toBe(false);

    expect(
      secondaryFolderNamesUnderSeparator(
        documentation,
        SIDEBAR_GROUP_LABELS.documentation.operations,
      ),
    ).toEqual(Object.values(DOCUMENTATION_SIDEBAR_SECONDARY_LABELS.operations));

    for (const oldRoute of listDocumentationRouteMigrationOldRoutes()) {
      expect(
        pageEntriesInFolder(documentation).some((page) =>
          page.url.endsWith(oldRoute),
        ),
        `${oldRoute} must not appear in Program documentation explorer`,
      ).toBe(false);
    }

    const configuringPages = pageEntriesInSecondaryFolderUnderSeparator(
      documentation,
      SIDEBAR_GROUP_LABELS.documentation.operations,
      DOCUMENTATION_SIDEBAR_SECONDARY_LABELS.operations.configuring,
    );
    expect(
      configuringPages.some((entry) =>
        urlEndsWithSlug(entry.url, "documentation", "resources"),
      ),
    ).toBe(true);
    expect(
      configuringPages.some((entry) =>
        urlEndsWithSlug(entry.url, "factories", "configuration"),
      ),
    ).toBe(true);
    expect(
      configuringPages.some((entry) =>
        urlEndsWithSlug(entry.url, "factories", "global-configuration"),
      ),
    ).toBe(true);
    expect(
      configuringPages.some((entry) =>
        urlEndsWithSlug(entry.url, "documentation", "throttling-and-limits"),
      ),
    ).toBe(false);
    expect(
      secondaryFolderNamesUnderSeparator(
        documentation,
        SIDEBAR_GROUP_LABELS.documentation.operations,
      ),
    ).toEqual([DOCUMENTATION_SIDEBAR_SECONDARY_LABELS.operations.configuring]);

    const operationsPages = pageEntriesUnderSeparator(
      documentation,
      SIDEBAR_GROUP_LABELS.documentation.operations,
    );
    expect(
      operationsPages.some((entry) =>
        urlEndsWithSlug(entry.url, "documentation", "logs"),
      ),
    ).toBe(true);
    expect(
      operationsPages.some((entry) =>
        urlEndsWithSlug(entry.url, "documentation", "metrics"),
      ),
    ).toBe(true);

    for (const slug of PROGRAM_DOCUMENTATION_DEMOTED_EXPLORER_SLUGS) {
      expect(
        pageEntriesInFolder(documentation).some((entry) =>
          urlEndsWithSlug(entry.url, "documentation", slug),
        ),
        `${slug} must not appear in Program documentation explorer`,
      ).toBe(false);
    }

    for (const slug of Object.keys(
      FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG,
    )) {
      if (slug.includes("/")) {
        continue;
      }
      expect(slug).not.toBe("faq");
      const membership =
        FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG[
          slug as keyof typeof FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG
        ];
      const groupLabel = SIDEBAR_GROUP_LABELS.documentation[membership.group];
      const underGroup = pageEntriesUnderSeparator(documentation, groupLabel);
      expect(
        underGroup.some((entry) =>
          urlEndsWithSlug(entry.url, "documentation", slug),
        ),
        `${slug} must remain under Program documentation group ${groupLabel}`,
      ).toBe(true);
    }
  });

  test("default-locale explorer places Concepts and eight Program pages under declared subgroups", async () => {
    const messages = await loadUiMessages("en");
    const signature = buildExplorerTreeSignature(
      localizePageTree(source.pageTree, "en", { messages }),
    );

    const concepts = folderSignatureByName(
      signature,
      FACTORY_EXPLORER_FOLDER_LABELS.concepts,
    );
    expect(concepts).toBeTruthy();
    if (!concepts) {
      throw new Error("expected Concepts folder");
    }

    for (const page of R00_CONCEPTS_PAGES) {
      expect(FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG[page.slug]).toBe(
        page.group,
      );
      const groupLabel = SIDEBAR_GROUP_LABELS.concepts[page.group];
      const underGroup = pageEntriesUnderSeparator(concepts, groupLabel);
      expect(
        underGroup.some((entry) =>
          urlEndsWithSlug(entry.url, "concepts", page.slug),
        ),
        `${page.slug} must sit under Concepts subgroup ${groupLabel}`,
      ).toBe(true);
    }

    const documentation = folderSignatureByName(
      signature,
      FACTORY_EXPLORER_FOLDER_LABELS.documentation,
    );
    expect(documentation).toBeTruthy();
    if (!documentation) {
      throw new Error("expected Program documentation folder");
    }

    for (const page of R01_PROGRAM_DOCUMENTATION_EXPLORER_PAGES) {
      expect(FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG[page.slug]).toBe(
        page.group,
      );
      const groupLabel = SIDEBAR_GROUP_LABELS.documentation[page.group];
      const underGroup = pageEntriesUnderSeparator(documentation, groupLabel);
      expect(
        underGroup.some((entry) =>
          urlEndsWithSlug(entry.url, "documentation", page.slug),
        ),
        `${page.slug} must sit under Program documentation subgroup ${groupLabel}`,
      ).toBe(true);
    }
  });

  test("every locale preserves declared subgroup order as a subsequence of present separators", async () => {
    for (const locale of supportedLocales) {
      const messages = await loadUiMessages(locale);
      const explorer = resolveExplorerMessages(messages);
      const signature = buildExplorerTreeSignature(
        localizePageTree(source.pageTree, locale, { messages }),
      );

      expect(topLevelFolderNames(signature)).toEqual([
        explorer.folders.guides,
        explorer.folders.concepts,
        explorer.folders.techniques,
        explorer.folders.documentation,
        explorer.folders.references,
        ...(locale === "en"
          ? [
              explorer.folders.factories,
              explorer.folders.workers,
              explorer.folders.workstations,
            ]
          : []),
      ]);

      const faq = topLevelPageEntries(signature);
      expect(faq).toHaveLength(1);
      expect(faq[0]?.url).toMatch(/\/docs\/documentation\/faq$/);
      expect(signature.children.at(-1)?.type).toBe("page");

      const concepts = folderSignatureByName(
        signature,
        explorer.folders.concepts,
      );
      expect(concepts).toBeTruthy();
      if (!concepts) {
        throw new Error(`expected Concepts folder for ${locale}`);
      }
      expect(separatorNamesInFolder(concepts)).toEqual([
        explorer.conceptsGroups.harnesses,
        explorer.conceptsGroups["industrial-engineering"],
        explorer.conceptsGroups["model-inference"],
      ]);

      for (const page of R00_CONCEPTS_PAGES) {
        const groupLabel = explorer.conceptsGroups[page.group];
        const underGroup = pageEntriesUnderSeparator(concepts, groupLabel);
        expect(
          underGroup.some((entry) =>
            entry.url.includes(`/concepts/${page.slug}`),
          ),
          `${locale}: ${page.slug} under ${groupLabel}`,
        ).toBe(true);
      }

      const documentation = folderSignatureByName(
        signature,
        explorer.folders.documentation,
      );
      expect(documentation).toBeTruthy();
      if (!documentation) {
        throw new Error(`expected Program documentation folder for ${locale}`);
      }

      const documentationSeparators = separatorNamesInFolder(documentation);
      const declaredLocalizedOrder = Object.values(
        explorer.documentationGroups,
      );
      expect(
        isSubsequence(documentationSeparators, declaredLocalizedOrder),
      ).toBe(true);
      expect(documentationSeparators[0]).toBe(
        explorer.documentationGroups.orientation,
      );
      expect(documentationSeparators.at(-1)).toBe(
        explorer.documentationGroups.operations,
      );

      for (const page of R01_PROGRAM_DOCUMENTATION_EXPLORER_PAGES) {
        const groupLabel = explorer.documentationGroups[page.group];
        const underGroup = pageEntriesUnderSeparator(documentation, groupLabel);
        expect(
          underGroup.some((entry) =>
            entry.url.includes(`/documentation/${page.slug}`),
          ),
          `${locale}: ${page.slug} under ${groupLabel}`,
        ).toBe(true);
      }

      const configuringSecondaries = [
        explorer.documentationSecondaries.configuring,
      ];
      const presentConfiguringSecondaries = secondaryFolderNamesUnderSeparator(
        documentation,
        explorer.documentationGroups.operations,
      );
      expect(
        isSubsequence(presentConfiguringSecondaries, configuringSecondaries),
        `${locale}: Operations secondaries use localized Configuring label in declared order`,
      ).toBe(true);
      for (const name of presentConfiguringSecondaries) {
        expect(configuringSecondaries).toContain(name);
      }
    }
  });
});

describe("explorer IA fail-closed locale contract", () => {
  test("localizePageTree fails closed when explorer catalogs are missing", async () => {
    const messages = await loadUiMessages("en");
    const broken = {
      ...messages,
      explorer: undefined,
    } as unknown as UiMessages;

    expect(() =>
      localizePageTree(source.pageTree, "en", { messages: broken }),
    ).toThrow(ExplorerLabelsError);
  });

  test("localizePageTree fails closed when a subgroup label is empty", async () => {
    const messages = await loadUiMessages("en");
    const broken: UiMessages = {
      ...messages,
      explorer: {
        ...messages.explorer,
        conceptsGroups: {
          ...messages.explorer.conceptsGroups,
          harnesses: "   ",
        },
      },
    };

    expect(() =>
      localizePageTree(source.pageTree, "en", { messages: broken }),
    ).toThrow(/harnesses/);
  });

  test("assertExplorerMessages rejects incomplete documentation group catalogs", async () => {
    const messages = await loadUiMessages("vi");
    const incomplete = {
      folders: messages.explorer.folders,
      conceptsGroups: messages.explorer.conceptsGroups,
      documentationGroups: {
        ...messages.explorer.documentationGroups,
        interfaces: "",
      },
      documentationSecondaries: messages.explorer.documentationSecondaries,
    };

    expect(() =>
      resolveExplorerMessages({ ...messages, explorer: incomplete }),
    ).toThrow(/interfaces/);
  });

  test("assertExplorerMessages rejects incomplete documentation secondary catalogs", async () => {
    const messages = await loadUiMessages("ja");
    const incomplete = {
      folders: messages.explorer.folders,
      conceptsGroups: messages.explorer.conceptsGroups,
      documentationGroups: messages.explorer.documentationGroups,
      documentationSecondaries: {
        ...messages.explorer.documentationSecondaries,
        configuring: "",
      },
    };

    expect(() =>
      resolveExplorerMessages({ ...messages, explorer: incomplete }),
    ).toThrow(/documentationSecondaries\.configuring/);
  });
});
