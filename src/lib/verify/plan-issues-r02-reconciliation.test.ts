/**
 * R02 story 001 — tip evidence proofs for every plan-issues.md section.
 * Asserts published inventory, explorer membership, brand/theme/code-copy
 * contracts against the combined R00 (#115–#118) + R01 (#119–#122) tip.
 */
import { describe, expect, test } from "bun:test";
import {
  DOCS_CODE_COPY_CHROME_FACTORY_DARK,
  DOCS_CODE_COPY_CHROME_TOKENS,
  DOCS_CODE_COPY_CONTROL_ATTR,
  DOCS_CODE_COPY_COPIED_LABEL,
  DOCS_CODE_COPY_LABEL,
  DOCS_CODE_COPY_STATUS_ATTR,
} from "@/features/docs/styles/docs-code-copy-chrome";
import {
  DOCS_EXPLORER_TOP_LEVEL_FAQ_URL,
  DOCS_PAGE_TREE_ROOT_NAME,
  FACTORY_EXPLORER_FOLDER_LABELS,
  FACTORY_EXPLORER_SECTION_ORDER,
} from "@/lib/content/factory-breadcrumb-sidebar";
import {
  getPublishedDocsEntryByRegistryId,
  listPublishedDocsEntries,
} from "@/lib/content/published-docs-registry-ids";
import { getConceptById } from "@/lib/content/registry-runtime";
import {
  FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG,
  FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG,
  SIDEBAR_GROUP_LABELS,
} from "@/lib/content/sidebar-grouping";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { supportedLocales } from "@/lib/i18n/locale-routing";
import { localizePageTree } from "@/lib/i18n/localize-page-tree";
import {
  buildExplorerTreeSignature,
  folderSignatureByName,
  pageEntriesInFolder,
  topLevelFolderNames,
  topLevelPageEntries,
} from "@/lib/navigation/explorer-tree-signature";
import { source } from "@/lib/source";
import {
  FACTORY_DARK_FOUNDATION,
  resolveHostSemanticThemeTokens,
} from "@/lib/theme/host-semantic-theme-tokens";

/** R01 eight Program documentation pages with declared explorer subgroups. */
const R01_PROGRAM_DOCUMENTATION_PAGES = [
  {
    slug: "mock-workers",
    group: "factory-configuration",
    registryId: "documentation.mock-workers",
  },
  {
    slug: "throttling-and-limits",
    group: "factory-configuration",
    registryId: "documentation.throttling-and-limits",
  },
  {
    slug: "script-workers",
    group: "factory-configuration",
    registryId: "documentation.script-workers",
  },
  {
    slug: "poller-workers",
    group: "factory-configuration",
    registryId: "documentation.poller-workers",
  },
  {
    slug: "agent-workers",
    group: "factory-configuration",
    registryId: "documentation.agent-workers",
  },
  {
    slug: "inference-workers",
    group: "factory-configuration",
    registryId: "documentation.inference-workers",
  },
  {
    slug: "packaged-documents",
    group: "packaged-factories",
    registryId: "documentation.packaged-documents",
  },
  {
    slug: "packaged-factories",
    group: "packaged-factories",
    registryId: "documentation.packaged-factories",
  },
] as const;

/** R00 Concepts pages required by plan-issues.md. */
const R00_CONCEPTS_PAGES = [
  { slug: "skills", group: "harnesses", registryId: "concept.skills" },
  { slug: "mcp", group: "harnesses", registryId: "concept.mcp" },
  {
    slug: "tool-calling",
    group: "model-inference",
    registryId: "concept.tool-calling",
  },
  { slug: "tokens", group: "model-inference", registryId: "concept.tokens" },
] as const;

describe("plan-issues R02 tip reconciliation", () => {
  test("execution-plan tip includes published R00 Concepts and R01 Program documentation inventory", () => {
    const publishedUrls = new Set(
      listPublishedDocsEntries().map((entry) => entry.url),
    );

    for (const page of R01_PROGRAM_DOCUMENTATION_PAGES) {
      const entry = getPublishedDocsEntryByRegistryId(page.registryId);
      expect(entry, `${page.registryId} must be published`).toBeDefined();
      expect(entry?.docsSlug).toBe(`documentation/${page.slug}`);
      expect(entry?.url).toBe(`/docs/documentation/${page.slug}`);
      expect(publishedUrls.has(`/docs/documentation/${page.slug}`)).toBe(true);
      expect(FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG[page.slug]).toBe(
        page.group,
      );
      expect(entry?.pageKind).toBe("documentation");
    }

    for (const page of R00_CONCEPTS_PAGES) {
      const entry = getPublishedDocsEntryByRegistryId(page.registryId);
      expect(entry, `${page.registryId} must be published`).toBeDefined();
      expect(entry?.docsSlug).toBe(`concepts/${page.slug}`);
      expect(entry?.url).toBe(`/docs/concepts/${page.slug}`);
      expect(FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG[page.slug]).toBe(
        page.group,
      );

      const concept = getConceptById(page.registryId);
      expect(concept?.status).toBe("published");
    }
  });

  test("Tokens remains model-inference conceptType (not factory work tokens)", () => {
    const tokens = getConceptById("concept.tokens");
    expect(tokens?.conceptType).toBe("inference");
    expect(FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG.tokens).toBe(
      "model-inference",
    );
  });

  test("front page / title bar / explorer brand and Program documentation IA hold on tip", async () => {
    expect(DOCS_PAGE_TREE_ROOT_NAME).toBe("You Agent Factory");
    expect(FACTORY_EXPLORER_FOLDER_LABELS.documentation).toBe(
      "Program documentation",
    );
    expect(Object.values(FACTORY_EXPLORER_FOLDER_LABELS)).not.toContain(
      "Glossary",
    );
    expect(FACTORY_EXPLORER_SECTION_ORDER.at(-1)).toEqual({
      kind: "page",
      docsSlug: "documentation/faq",
    });

    const messages = await loadUiMessages("en");
    expect(messages.home.title).toBe("You Agent Factory");

    const signature = buildExplorerTreeSignature(
      localizePageTree(source.pageTree, "en", { messages }),
    );
    expect(signature.rootName).toBe("You Agent Factory");
    expect(topLevelFolderNames(signature)).toEqual([
      "Guides",
      "Concepts",
      "Techniques",
      "Program documentation",
      "References",
      "Factories",
      "Workers",
      "Workstations",
    ]);
    expect(topLevelFolderNames(signature)).not.toContain("Glossary");
    expect(topLevelPageEntries(signature).map((page) => page.url)).toContain(
      DOCS_EXPLORER_TOP_LEVEL_FAQ_URL,
    );

    const concepts = folderSignatureByName(signature, "Concepts");
    expect(concepts).toBeTruthy();
    if (!concepts) {
      throw new Error("expected Concepts folder");
    }
    const conceptUrls = pageEntriesInFolder(concepts).map((page) => page.url);
    for (const page of R00_CONCEPTS_PAGES) {
      expect(conceptUrls).toContain(`/docs/concepts/${page.slug}`);
    }

    const documentation = folderSignatureByName(
      signature,
      "Program documentation",
    );
    expect(documentation).toBeTruthy();
    if (!documentation) {
      throw new Error("expected Program documentation folder");
    }
    const documentationUrls = pageEntriesInFolder(documentation).map(
      (page) => page.url,
    );
    for (const page of R01_PROGRAM_DOCUMENTATION_PAGES) {
      expect(documentationUrls).toContain(`/docs/documentation/${page.slug}`);
    }

    expect(Object.values(SIDEBAR_GROUP_LABELS.concepts)).toEqual([
      "Harnesses",
      "Industrial engineering",
      "Model inference",
    ]);
    expect(Object.values(SIDEBAR_GROUP_LABELS.documentation)).toEqual([
      "System feature set",
      "Interfaces",
      "Packaged factories",
      "Factory Configuration",
      "System Operations",
      "Internal Architecture",
      "Additional references",
    ]);
  });

  test("localized explorer trees keep brand, FAQ, no Glossary, and eight-page membership", async () => {
    for (const locale of supportedLocales) {
      const messages = await loadUiMessages(locale);
      const signature = buildExplorerTreeSignature(
        localizePageTree(source.pageTree, locale, { messages }),
      );

      expect(signature.rootName).toBe("You Agent Factory");
      expect(topLevelFolderNames(signature)).not.toContain("Glossary");
      expect(
        topLevelPageEntries(signature).some((page) =>
          page.url.endsWith("/documentation/faq"),
        ),
      ).toBe(true);

      const documentation = folderSignatureByName(
        signature,
        messages.explorer.folders.documentation,
      );
      expect(documentation).toBeTruthy();
      if (!documentation) {
        throw new Error(`expected Program documentation for ${locale}`);
      }
      const urls = pageEntriesInFolder(documentation).map((page) => page.url);
      for (const page of R01_PROGRAM_DOCUMENTATION_PAGES) {
        expect(
          urls.some((url) => url.endsWith(`/documentation/${page.slug}`)),
        ).toBe(true);
      }
    }
  });

  test("colors and guide code-copy contracts remain factory-dark + accessible chrome", () => {
    const tokens = resolveHostSemanticThemeTokens();
    expect(tokens.background).toBe(FACTORY_DARK_FOUNDATION.background);
    expect(tokens.primary).toBe(FACTORY_DARK_FOUNDATION.accent);
    expect(tokens.foreground).toBe(FACTORY_DARK_FOUNDATION.ink);

    expect(DOCS_CODE_COPY_CONTROL_ATTR).toBe("data-docs-code-copy");
    expect(DOCS_CODE_COPY_STATUS_ATTR).toBe("data-docs-code-copy-status");
    expect(DOCS_CODE_COPY_LABEL).toBe("Copy Text");
    expect(DOCS_CODE_COPY_COPIED_LABEL).toBe("Copied Text");
    expect(DOCS_CODE_COPY_CHROME_TOKENS.interactiveColor).toBe(
      "var(--secondary)",
    );
    expect(DOCS_CODE_COPY_CHROME_FACTORY_DARK.interactiveColor).toBe(
      FACTORY_DARK_FOUNDATION.secondaryAccent,
    );
  });
});
