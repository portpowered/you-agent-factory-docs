import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderSectionCollectionIndexPage } from "@/app/(site)/site-renderers";
import { loadUiMessages } from "@/lib/content/ui-messages";
import type { UiMessages } from "@/lib/content/ui-messages.types";
import type { DocsCollectionDefinition } from "@/lib/docs/collection-definition-contract";
import { getDocsCollectionDefinition } from "@/lib/docs/docs-collection-definitions";
import type { CLI_DOCS_COLLECTION_IDS } from "@/lib/docs/docs-collection-slug-acceptance";
import {
  isDocsCollectionId,
  resolveDocsCollectionIndexMessages,
  resolveDocsCollectionInput,
  resolveSectionKindCollectionId,
} from "@/lib/docs/section-collection-index";

const guidesDefinition = getDocsCollectionDefinition("guides");

type CliSectionIndexCollectionId = (typeof CLI_DOCS_COLLECTION_IDS)[number];

type SectionIndexMessages = UiMessages["guidesIndex"];

const CLI_SECTION_INDEX_MESSAGE_KEYS = {
  guides: "guidesIndex",
  concepts: "conceptsIndex",
  techniques: "techniquesIndex",
  documentation: "documentationIndex",
} as const satisfies Record<CliSectionIndexCollectionId, keyof UiMessages>;

function sectionIndexMessages(
  messages: UiMessages,
  collectionId: CliSectionIndexCollectionId,
): SectionIndexMessages {
  return messages[
    CLI_SECTION_INDEX_MESSAGE_KEYS[collectionId]
  ] as SectionIndexMessages;
}

describe("section collection index resolution", () => {
  test("resolves a collection id to the canonical definition", () => {
    expect(resolveDocsCollectionInput("guides")).toEqual(
      getDocsCollectionDefinition("guides"),
    );
  });

  test("accepts a full collection definition without re-resolving", () => {
    expect(resolveDocsCollectionInput(guidesDefinition)).toBe(guidesDefinition);
  });

  test("rejects unknown and retired Atlas collection ids with not-found behavior", () => {
    expect(isDocsCollectionId("unknown-collection")).toBe(false);
    expect(isDocsCollectionId("models")).toBe(false);
    expect(isDocsCollectionId("modules")).toBe(false);

    try {
      resolveDocsCollectionInput("unknown-collection");
      throw new Error("Expected unknown collection id to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(
        /notFound\(\)|NEXT_HTTP_ERROR_FALLBACK;404/,
      );
    }
  });

  test("maps section frontmatter kinds to factory collection ids", () => {
    expect(resolveSectionKindCollectionId("guide")).toBe("guides");
    expect(resolveSectionKindCollectionId("technique")).toBe("techniques");
    expect(resolveSectionKindCollectionId("documentation")).toBe(
      "documentation",
    );
    expect(resolveSectionKindCollectionId("concept")).toBe("concepts");
    expect(resolveSectionKindCollectionId("reference")).toBe("references");
  });

  test("resolves localized index copy from collection message metadata", async () => {
    const messages = await loadUiMessages();
    const resolved = resolveDocsCollectionIndexMessages(
      messages,
      guidesDefinition,
    );

    expect(resolved).toEqual(messages.guidesIndex);
    expect(
      resolveDocsCollectionIndexMessages(
        messages,
        getDocsCollectionDefinition("concepts"),
      ),
    ).toEqual(messages.conceptsIndex);
  });

  test("resolves index copy from an inline collection definition", async () => {
    const messages = await loadUiMessages();
    const inlineDefinition: DocsCollectionDefinition = {
      ...guidesDefinition,
      starterSlugs: [],
    };

    expect(
      resolveDocsCollectionIndexMessages(messages, inlineDefinition),
    ).toEqual(messages.guidesIndex);
  });
});

describe("renderSectionCollectionIndexPage empty CLI collections", () => {
  test("renders techniques index with authored page entries", async () => {
    const messages = await loadUiMessages();
    const indexMessages = sectionIndexMessages(messages, "techniques");
    const html = renderToStaticMarkup(
      await renderSectionCollectionIndexPage("techniques"),
    );

    expect(html).toContain(indexMessages.title);
    expect(html).toContain(indexMessages.description);
    expect(html).toContain(`aria-label="${indexMessages.listLabel}"`);
    expect(html).toContain("Ralph");
    expect(html).toContain("/docs/techniques/ralph");
    expect(html).toContain("Writer-Reviewer");
    expect(html).toContain("/docs/techniques/writer-reviewer");
    expect(html).not.toContain(indexMessages.emptyTitle);
    expect(indexMessages.emptyTitle).not.toMatch(
      /Model Atlas|Browse the Atlas|the atlas|アトラス|Duyệt Atlas|浏览图谱|图谱/i,
    );
    expect(indexMessages.emptyDescription).not.toMatch(
      /Model Atlas|Browse the Atlas|the atlas|アトラス|Duyệt Atlas|浏览图谱|图谱/i,
    );
    expect(indexMessages.emptyHomeLink).not.toMatch(
      /Model Atlas|Browse the Atlas|the atlas|アトラス|Duyệt Atlas|浏览图谱|图谱/i,
    );
  });

  test("renders documentation index with authored page entries", async () => {
    const messages = await loadUiMessages();
    const indexMessages = sectionIndexMessages(messages, "documentation");
    const html = renderToStaticMarkup(
      await renderSectionCollectionIndexPage("documentation"),
    );

    expect(html).toContain(indexMessages.title);
    expect(html).toContain(indexMessages.description);
    expect(html).toContain(`aria-label="${indexMessages.listLabel}"`);
    expect(html).toContain("What is you-agent-factory");
    expect(html).toContain("/docs/documentation/what-is-you-agent-factory");
    expect(html).toContain(
      "you-agent-factory is a CLI and agent-factory workflow system that keeps long-running agent work persistent.",
    );
    expect(html).not.toContain(indexMessages.emptyTitle);
  });

  test("renders guides index with authored page entries", async () => {
    const messages = await loadUiMessages();
    const indexMessages = sectionIndexMessages(messages, "guides");
    const html = renderToStaticMarkup(
      await renderSectionCollectionIndexPage("guides"),
    );

    expect(html).toContain(indexMessages.title);
    expect(html).toContain(indexMessages.description);
    expect(html).toContain(`aria-label="${indexMessages.listLabel}"`);
    expect(html).toContain("Getting Started");
    expect(html).toContain("/docs/guides/getting-started");
    expect(html).not.toContain(indexMessages.emptyTitle);
  });

  test("renders concepts index with authored concept page entries", async () => {
    const messages = await loadUiMessages();
    const indexMessages = sectionIndexMessages(messages, "concepts");
    const html = renderToStaticMarkup(
      await renderSectionCollectionIndexPage("concepts"),
    );

    expect(html).toContain(indexMessages.title);
    expect(html).toContain(indexMessages.description);
    expect(html).toContain(`aria-label="${indexMessages.listLabel}"`);
    expect(html).toContain("Bottlenecks");
    expect(html).toContain("/docs/concepts/bottlenecks");
    expect(html).toContain("Checklist");
    expect(html).toContain("/docs/concepts/checklist");
    expect(html).toContain("Harness");
    expect(html).toContain("/docs/concepts/harness");
    expect(html).toContain("MCP");
    expect(html).toContain("/docs/concepts/mcp");
    expect(html).toContain(
      "Model Context Protocol: the host↔server protocol that exposes named tools, including Factory Session tools via you mcp serve.",
    );
    expect(html).toContain("Skills");
    expect(html).toContain("/docs/concepts/skills");
    expect(html).toContain(
      "Reusable instruction packages a harness or coding agent can load to specialize behavior for a task class.",
    );
    expect(html).toContain("Task Queue");
    expect(html).toContain("/docs/concepts/task-queue");
    expect(html).toContain("Thinking");
    expect(html).toContain("/docs/concepts/thinking");
    expect(html).toContain("Tokens");
    expect(html).toContain("/docs/concepts/tokens");
    expect(html).toContain(
      "Model-inference tokens: units of model input and output used for context limits and cost accounting when running harnesses, workers, or inference.",
    );
    expect(html).toContain("Tool");
    expect(html).toContain("/docs/concepts/tool");
    expect(html).toContain(
      "A named callable capability an agent or Model Context Protocol (MCP) host can use while doing factory work.",
    );
    expect(html).toContain("Tool calling");
    expect(html).toContain("/docs/concepts/tool-calling");
    expect(html).toContain(
      "Tool calling is the model-inference behavior of selecting and invoking named tools during an agent or model turn, gated by worker tool policy such as agentTools.",
    );
    expect(html).not.toContain(indexMessages.emptyTitle);
  });

  test("renders the same guides output when passed the collection definition", async () => {
    const byId = renderToStaticMarkup(
      await renderSectionCollectionIndexPage("guides"),
    );
    const byDefinition = renderToStaticMarkup(
      await renderSectionCollectionIndexPage(
        getDocsCollectionDefinition("guides"),
      ),
    );

    expect(byDefinition).toBe(byId);
  });
});

describe("renderSectionCollectionIndexPage localized techniques", () => {
  test("renders localized techniques index with authored page entries", async () => {
    const messages = await loadUiMessages("vi");
    const techniquesDefinition = getDocsCollectionDefinition("techniques");
    const html = renderToStaticMarkup(
      await renderSectionCollectionIndexPage(techniquesDefinition, "vi"),
    );

    expect(html).toContain(messages.techniquesIndex.title);
    expect(html).toContain(messages.techniquesIndex.description);
    expect(html).toContain(
      `aria-label="${messages.techniquesIndex.listLabel}"`,
    );
    expect(html).toContain("/vi/docs/techniques/ralph");
    expect(html).not.toContain(messages.techniquesIndex.emptyTitle);
  });
});

const W05_DIRECT_ROUTE_FAMILY_INDEX_CASES = [
  {
    collectionId: "references" as const,
    messageKey: "referencesIndex" as const,
  },
  {
    collectionId: "factories" as const,
    messageKey: "factoriesIndex" as const,
  },
  {
    collectionId: "workers" as const,
    messageKey: "workersIndex" as const,
  },
  {
    collectionId: "workstations" as const,
    messageKey: "workstationsIndex" as const,
  },
] as const;

const W05_EMPTY_STATE_ATLAS_PHRASING =
  /Model Atlas|Browse the Atlas|the atlas|アトラス|Duyệt Atlas|浏览图谱|图谱/i;

describe("renderSectionCollectionIndexPage W05 direct route families", () => {
  test("renders empty-state indexes for all four families without leaking documentation entries", async () => {
    const messages = await loadUiMessages();

    for (const {
      collectionId,
      messageKey,
    } of W05_DIRECT_ROUTE_FAMILY_INDEX_CASES) {
      const indexMessages = messages[messageKey];
      const html = renderToStaticMarkup(
        await renderSectionCollectionIndexPage(collectionId),
      );

      expect(html).toContain(indexMessages.title);
      expect(html).toContain(indexMessages.description);
      expect(html).toContain(indexMessages.emptyTitle);
      expect(html).toContain(indexMessages.emptyDescription);
      expect(html).toContain(indexMessages.emptyHomeLink);
      expect(html).toContain('href="/"');
      expect(html).not.toContain(`aria-label="${indexMessages.listLabel}"`);
      expect(html).not.toContain("/docs/documentation/");
      expect(indexMessages.emptyTitle).not.toMatch(
        W05_EMPTY_STATE_ATLAS_PHRASING,
      );
      expect(indexMessages.emptyDescription).not.toMatch(
        W05_EMPTY_STATE_ATLAS_PHRASING,
      );
      expect(indexMessages.emptyHomeLink).not.toMatch(
        W05_EMPTY_STATE_ATLAS_PHRASING,
      );
    }
  });

  test("keeps factories empty even though it reuses the documentation frontmatter kind", async () => {
    const messages = await loadUiMessages();
    const html = renderToStaticMarkup(
      await renderSectionCollectionIndexPage("factories"),
    );

    expect(html).toContain(messages.factoriesIndex.emptyTitle);
    expect(html).not.toContain("What is you-agent-factory");
    expect(html).not.toContain("/docs/documentation/what-is-you-agent-factory");
  });

  test("renders localized empty-state indexes for shipped locales", async () => {
    for (const locale of ["ja", "zh-CN", "vi"] as const) {
      const messages = await loadUiMessages(locale);

      for (const {
        collectionId,
        messageKey,
      } of W05_DIRECT_ROUTE_FAMILY_INDEX_CASES) {
        const indexMessages = messages[messageKey];
        const html = renderToStaticMarkup(
          await renderSectionCollectionIndexPage(collectionId, locale),
        );

        expect(html).toContain(indexMessages.title);
        expect(html).toContain(indexMessages.emptyTitle);
        expect(html).toContain(indexMessages.emptyHomeLink);
        expect(html).not.toContain(`aria-label="${indexMessages.listLabel}"`);
      }
    }
  });
});
