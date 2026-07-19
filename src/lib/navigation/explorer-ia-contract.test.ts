/**
 * Focused explorer IA contract proofs for exact order and fail-closed locale
 * behavior. Desktop/mobile parity lives in desktop-mobile-explorer-parity;
 * accessible names / keyboard reachability live in docs-sidebar-navigation.a11y.
 *
 * R02 story 002 also locks eight Program documentation page membership under
 * declared subgroups and Concepts Skills / MCP / Tool calling / Tokens groups.
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
  pageEntriesUnderSeparator,
  secondaryFolderNamesUnderSeparator,
  separatorNamesInFolder,
  topLevelFolderNames,
  topLevelPageEntries,
} from "@/lib/navigation/explorer-tree-signature";
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

/** R01 eight Program documentation pages with declared explorer subgroups. */
const R01_PROGRAM_DOCUMENTATION_PAGES = [
  { slug: "mock-workers", group: "factory-configuration" },
  { slug: "throttling-and-limits", group: "factory-configuration" },
  { slug: "script-workers", group: "factory-configuration" },
  { slug: "poller-workers", group: "factory-configuration" },
  { slug: "agent-workers", group: "factory-configuration" },
  { slug: "inference-workers", group: "factory-configuration" },
  { slug: "packaged-documents", group: "packaged-factories" },
  { slug: "packaged-factories", group: "packaged-factories" },
] as const;

/**
 * Story 003 — non-secondary Program documentation top groups and their pages.
 * Factory Configuration / System Operations nesting is owned by story 004.
 */
const STORY_003_DIRECT_TOP_GROUP_PAGES = {
  "system-feature-set": [
    "dynamic-workflows",
    "harness-support",
    "replays-records",
    "submitting-work",
  ],
  interfaces: ["cli", "cli-command-index", "api-doc", "mcp"],
  "packaged-factories": ["packaged-factories", "packaged-documents"],
  "internal-architecture": ["architecture-of-system", "petri"],
  "additional-references": [
    "what-is-you-agent-factory",
    "install",
    "contributing-to-these-docs",
    "dashboard-ui-overview",
    "security-trust-boundaries",
    "troubleshooting",
  ],
} as const;

/** Config / ops pages that must not leak into System feature set. */
const SYSTEM_FEATURE_SET_EXCLUDED_SLUGS = [
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
        SIDEBAR_GROUP_LABELS.documentation["factory-configuration"],
      ),
    ).toEqual(
      Object.values(
        DOCUMENTATION_SIDEBAR_SECONDARY_LABELS["factory-configuration"],
      ),
    );
    expect(
      secondaryFolderNamesUnderSeparator(
        documentation,
        SIDEBAR_GROUP_LABELS.documentation["system-operations"],
      ),
    ).toEqual(
      Object.values(
        DOCUMENTATION_SIDEBAR_SECONDARY_LABELS["system-operations"],
      ),
    );
    expect(
      pageEntriesInFolder(documentation).some((page) =>
        page.url.endsWith("/docs/documentation/faq"),
      ),
    ).toBe(false);
  });

  test("default-locale Program documentation places feature, interface, packaged, architecture, and additional pages under declared top groups", async () => {
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
      expect(
        secondaryFolderNamesUnderSeparator(documentation, groupLabel),
      ).toEqual([]);

      const underGroup = pageEntriesUnderSeparator(documentation, groupLabel);
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

    const systemFeaturePages = pageEntriesUnderSeparator(
      documentation,
      SIDEBAR_GROUP_LABELS.documentation["system-feature-set"],
    );
    for (const slug of SYSTEM_FEATURE_SET_EXCLUDED_SLUGS) {
      expect(
        systemFeaturePages.some((entry) =>
          urlEndsWithSlug(entry.url, "documentation", slug),
        ),
        `${slug} must not appear under System feature set`,
      ).toBe(false);
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

    for (const page of R01_PROGRAM_DOCUMENTATION_PAGES) {
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
        explorer.documentationGroups["system-feature-set"],
      );
      expect(documentationSeparators.at(-1)).toBe(
        explorer.documentationGroups["additional-references"],
      );

      for (const page of R01_PROGRAM_DOCUMENTATION_PAGES) {
        const groupLabel = explorer.documentationGroups[page.group];
        const underGroup = pageEntriesUnderSeparator(documentation, groupLabel);
        expect(
          underGroup.some((entry) =>
            entry.url.includes(`/documentation/${page.slug}`),
          ),
          `${locale}: ${page.slug} under ${groupLabel}`,
        ).toBe(true);
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
    };

    expect(() =>
      resolveExplorerMessages({ ...messages, explorer: incomplete }),
    ).toThrow(/interfaces/);
  });
});
