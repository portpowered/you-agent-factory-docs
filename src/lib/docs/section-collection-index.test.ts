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

const trainingDefinition = getDocsCollectionDefinition("training");

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
    expect(resolveDocsCollectionInput(trainingDefinition)).toBe(
      trainingDefinition,
    );
  });

  test("rejects unknown collection ids with not-found behavior", () => {
    expect(isDocsCollectionId("unknown-collection")).toBe(false);

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

  test("maps section frontmatter kinds to collection ids", () => {
    expect(resolveSectionKindCollectionId("training-regime")).toBe("training");
    expect(resolveSectionKindCollectionId("model")).toBe("models");
    expect(resolveSectionKindCollectionId("guide")).toBe("guides");
    expect(resolveSectionKindCollectionId("technique")).toBe("techniques");
    expect(resolveSectionKindCollectionId("documentation")).toBe(
      "documentation",
    );
    expect(resolveSectionKindCollectionId("concept")).toBe("concepts");
  });

  test("resolves localized index copy from collection message metadata", async () => {
    const messages = await loadUiMessages();
    const guidesDefinition = getDocsCollectionDefinition("guides");
    const resolved = resolveDocsCollectionIndexMessages(
      messages,
      guidesDefinition,
    );

    expect(resolved).toEqual(messages.guidesIndex);
    expect(
      resolveDocsCollectionIndexMessages(messages, trainingDefinition),
    ).toEqual(messages.trainingIndex);
  });

  test("resolves index copy from an inline collection definition", async () => {
    const messages = await loadUiMessages();
    const inlineDefinition: DocsCollectionDefinition = {
      ...trainingDefinition,
      starterSlugs: ["training/on-policy-distillation"],
    };

    expect(
      resolveDocsCollectionIndexMessages(messages, inlineDefinition),
    ).toEqual(messages.trainingIndex);
  });
});

describe("renderSectionCollectionIndexPage empty CLI collections", () => {
  test("renders techniques title, description, and empty-state copy", async () => {
    const messages = await loadUiMessages();
    const indexMessages = sectionIndexMessages(messages, "techniques");
    const html = renderToStaticMarkup(
      await renderSectionCollectionIndexPage("techniques"),
    );

    expect(html).toContain(indexMessages.title);
    expect(html).toContain(indexMessages.description);
    expect(html).toContain(indexMessages.emptyTitle);
    expect(html).toContain(indexMessages.emptyDescription);
    expect(html).toContain(indexMessages.emptyHomeLink);
    expect(html).not.toContain(`aria-label="${indexMessages.listLabel}"`);
    // Empty-state copy only — SearchTrigger may still carry residual Atlas search chrome.
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
    expect(html).toContain("Checklist");
    expect(html).toContain("/docs/concepts/checklist");
    expect(html).toContain("Harness");
    expect(html).toContain("/docs/concepts/harness");
    expect(html).toContain("Task Queue");
    expect(html).toContain("/docs/concepts/task-queue");
    expect(html).toContain("Thinking");
    expect(html).toContain("/docs/concepts/thinking");
    expect(html).toContain("Tokens");
    expect(html).toContain("/docs/concepts/tokens");
    expect(html).toContain(
      "Factory and work tokens: the unit of submitted work that occupies a work-type state as it moves through you-agent-factory.",
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

describe("renderSectionCollectionIndexPage empty state", () => {
  test("renders DocsIndexEmptyState copy from collection index message metadata", async () => {
    const messages = await loadUiMessages("vi");
    const techniquesDefinition = getDocsCollectionDefinition("techniques");
    const html = renderToStaticMarkup(
      await renderSectionCollectionIndexPage(techniquesDefinition, "vi"),
    );

    expect(html).toContain(messages.techniquesIndex.emptyTitle);
    expect(html).toContain(messages.techniquesIndex.emptyDescription);
    expect(html).toContain(messages.techniquesIndex.emptyHomeLink);
    expect(html).toContain('href="/vi"');
    expect(html).not.toContain(
      `aria-label="${messages.techniquesIndex.listLabel}"`,
    );
  });
});
