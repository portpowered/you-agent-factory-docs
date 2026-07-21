import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import ConceptsIndexPage, {
  generateMetadata as generateConceptsMetadata,
} from "@/app/(site)/docs/concepts/page";
import DocumentationIndexPage, {
  generateMetadata as generateDocumentationMetadata,
} from "@/app/(site)/docs/documentation/page";
import FactoriesIndexPage, {
  generateMetadata as generateFactoriesMetadata,
} from "@/app/(site)/docs/factories/page";
import GuidesIndexPage, {
  generateMetadata as generateGuidesMetadata,
} from "@/app/(site)/docs/guides/page";
import ReferencesIndexPage, {
  generateMetadata as generateReferencesMetadata,
} from "@/app/(site)/docs/references/page";
import TechniquesIndexPage, {
  generateMetadata as generateTechniquesMetadata,
} from "@/app/(site)/docs/techniques/page";
import WorkersIndexPage, {
  generateMetadata as generateWorkersMetadata,
} from "@/app/(site)/docs/workers/page";
import WorkstationsIndexPage, {
  generateMetadata as generateWorkstationsMetadata,
} from "@/app/(site)/docs/workstations/page";
import LocalizedConceptsIndexPage, {
  generateMetadata as generateLocalizedConceptsMetadata,
} from "@/app/[locale]/docs/concepts/page";
import LocalizedDocumentationIndexPage, {
  generateMetadata as generateLocalizedDocumentationMetadata,
} from "@/app/[locale]/docs/documentation/page";
import LocalizedFactoriesIndexPage, {
  generateMetadata as generateLocalizedFactoriesMetadata,
} from "@/app/[locale]/docs/factories/page";
import LocalizedGuidesIndexPage, {
  generateMetadata as generateLocalizedGuidesMetadata,
} from "@/app/[locale]/docs/guides/page";
import LocalizedReferencesIndexPage, {
  generateMetadata as generateLocalizedReferencesMetadata,
} from "@/app/[locale]/docs/references/page";
import LocalizedTechniquesIndexPage, {
  generateMetadata as generateLocalizedTechniquesMetadata,
} from "@/app/[locale]/docs/techniques/page";
import LocalizedWorkersIndexPage, {
  generateMetadata as generateLocalizedWorkersMetadata,
} from "@/app/[locale]/docs/workers/page";
import LocalizedWorkstationsIndexPage, {
  generateMetadata as generateLocalizedWorkstationsMetadata,
} from "@/app/[locale]/docs/workstations/page";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { CLI_DOCS_COLLECTION_IDS } from "@/lib/docs/docs-collection-slug-acceptance";
import { listDocumentationRouteMigrationOldRoutes } from "@/lib/seo/documentation-route-migration";

const CLI_SECTION_INDEX_CASES = [
  {
    collectionId: "guides" as const,
    messageKey: "guidesIndex" as const,
    renderDefault: GuidesIndexPage,
    renderLocalized: LocalizedGuidesIndexPage,
    generateDefaultMetadata: generateGuidesMetadata,
    generateLocalizedMetadata: generateLocalizedGuidesMetadata,
  },
  {
    collectionId: "concepts" as const,
    messageKey: "conceptsIndex" as const,
    renderDefault: ConceptsIndexPage,
    renderLocalized: LocalizedConceptsIndexPage,
    generateDefaultMetadata: generateConceptsMetadata,
    generateLocalizedMetadata: generateLocalizedConceptsMetadata,
  },
  {
    collectionId: "techniques" as const,
    messageKey: "techniquesIndex" as const,
    renderDefault: TechniquesIndexPage,
    renderLocalized: LocalizedTechniquesIndexPage,
    generateDefaultMetadata: generateTechniquesMetadata,
    generateLocalizedMetadata: generateLocalizedTechniquesMetadata,
  },
  {
    collectionId: "documentation" as const,
    messageKey: "documentationIndex" as const,
    renderDefault: DocumentationIndexPage,
    renderLocalized: LocalizedDocumentationIndexPage,
    generateDefaultMetadata: generateDocumentationMetadata,
    generateLocalizedMetadata: generateLocalizedDocumentationMetadata,
  },
] as const;

type CliSectionIndexCase = (typeof CLI_SECTION_INDEX_CASES)[number];

// All CLI section indexes currently have authored entries. Keep this list typed
// explicitly so an empty filter does not collapse to `never[]` under `as const`.
const CLI_EMPTY_SECTION_INDEX_CASES: CliSectionIndexCase[] =
  CLI_SECTION_INDEX_CASES.filter(
    (section) =>
      section.collectionId !== "documentation" &&
      section.collectionId !== "guides" &&
      section.collectionId !== "concepts" &&
      section.collectionId !== "techniques",
  );

describe("CLI section index messages", () => {
  it("loads index copy for guides, concepts, techniques, and documentation", async () => {
    const messages = await loadUiMessages();

    expect(messages.guidesIndex.title).toBe("Guides");
    expect(messages.conceptsIndex.title).toBe("Concepts");
    expect(messages.techniquesIndex.title).toBe("Techniques");
    expect(messages.documentationIndex.title).toBe("Documentation");
    expect([...CLI_DOCS_COLLECTION_IDS]).toEqual([
      "guides",
      "concepts",
      "techniques",
      "documentation",
    ]);
    // All four CLI section indexes now have authored page entries; keep the
    // case table for metadata/localized helpers without an empty-state loop.
    // Empty-state contract coverage lives in section-collection-index tests.
    expect(
      CLI_SECTION_INDEX_CASES.map((section) => section.collectionId),
    ).toEqual([...CLI_DOCS_COLLECTION_IDS]);
  });
});

const CLI_EMPTY_STATE_ATLAS_PHRASING =
  /Model Atlas|Browse the Atlas|the atlas|アトラス|Duyệt Atlas|浏览图谱|图谱/i;

describe("CLI section index page render", () => {
  for (const section of CLI_EMPTY_SECTION_INDEX_CASES) {
    it(`renders the ${section.collectionId} index through the generic empty-state contract`, async () => {
      const messages = await loadUiMessages();
      const indexMessages = messages[section.messageKey];
      const html = renderToStaticMarkup(await section.renderDefault());

      expect(html).toContain(indexMessages.title);
      expect(html).toContain(indexMessages.description);
      expect(html).toContain(indexMessages.emptyTitle);
      expect(html).toContain(indexMessages.emptyDescription);
      expect(html).toContain(indexMessages.emptyHomeLink);
      expect(html).toContain('href="/"');
      expect(html).not.toContain(`aria-label="${indexMessages.listLabel}"`);
      // Empty-state copy only — SearchTrigger may still carry residual Atlas search chrome.
      expect(indexMessages.emptyTitle).not.toMatch(
        CLI_EMPTY_STATE_ATLAS_PHRASING,
      );
      expect(indexMessages.emptyDescription).not.toMatch(
        CLI_EMPTY_STATE_ATLAS_PHRASING,
      );
      expect(indexMessages.emptyHomeLink).not.toMatch(
        CLI_EMPTY_STATE_ATLAS_PHRASING,
      );
    });
  }

  it("renders the guides index with authored page entries", async () => {
    const messages = await loadUiMessages();
    const indexMessages = messages.guidesIndex;
    const html = renderToStaticMarkup(await GuidesIndexPage());

    expect(html).toContain(indexMessages.title);
    expect(html).toContain(indexMessages.description);
    expect(html).toContain(`aria-label="${indexMessages.listLabel}"`);
    expect(html).toContain("Getting Started");
    expect(html).toContain("/docs/guides/getting-started");
    expect(html).toContain("Using you-agent-factory for Loops");
    expect(html).toContain("/docs/guides/using-you-agent-factory-for-loops");
    expect(html).not.toContain(indexMessages.emptyTitle);
    expect(indexMessages.emptyTitle).not.toMatch(
      CLI_EMPTY_STATE_ATLAS_PHRASING,
    );
    expect(indexMessages.emptyDescription).not.toMatch(
      CLI_EMPTY_STATE_ATLAS_PHRASING,
    );
  });

  it("renders the concepts index with authored page entries", async () => {
    const messages = await loadUiMessages();
    const indexMessages = messages.conceptsIndex;
    const html = renderToStaticMarkup(await ConceptsIndexPage());

    expect(html).toContain(indexMessages.title);
    expect(html).toContain(indexMessages.description);
    expect(html).toContain(`aria-label="${indexMessages.listLabel}"`);
    expect(html).toContain("Bottlenecks");
    expect(html).toContain("/docs/concepts/bottlenecks");
    expect(html).toContain("Checklist");
    expect(html).toContain("/docs/concepts/checklist");
    expect(html).toContain("Compaction");
    expect(html).toContain("/docs/concepts/compaction");
    expect(html).toContain("Harness");
    expect(html).toContain("/docs/concepts/harness");
    expect(html).toContain("Loop");
    expect(html).toContain("/docs/concepts/loop");
    expect(html).toContain("Skills");
    expect(html).toContain("/docs/concepts/skills");
    expect(html).toContain("MCP");
    expect(html).toContain("/docs/concepts/mcp");
    expect(html).toContain("Statistical Process Control Graphs");
    expect(html).toContain("/docs/concepts/statistical-process-control-graphs");
    expect(html).toContain("Task Queue");
    expect(html).toContain("/docs/concepts/task-queue");
    expect(html).toContain("Thinking");
    expect(html).toContain("/docs/concepts/thinking");
    expect(html).toContain("Tokens");
    expect(html).toContain("/docs/concepts/tokens");
    expect(html).toContain("Tool");
    expect(html).toContain("/docs/concepts/tool");
    expect(html).toContain("Tool calling");
    expect(html).toContain("/docs/concepts/tool-calling");
    expect(html).toContain("Worktree");
    expect(html).toContain("/docs/concepts/worktree");
    expect(html).not.toContain(indexMessages.emptyTitle);
    expect(indexMessages.emptyTitle).not.toMatch(
      CLI_EMPTY_STATE_ATLAS_PHRASING,
    );
    expect(indexMessages.emptyDescription).not.toMatch(
      CLI_EMPTY_STATE_ATLAS_PHRASING,
    );
  });

  it("renders the documentation index with authored page entries", async () => {
    const messages = await loadUiMessages();
    const indexMessages = messages.documentationIndex;
    const html = renderToStaticMarkup(await DocumentationIndexPage());

    expect(html).toContain(indexMessages.title);
    expect(html).toContain(indexMessages.description);
    expect(html).toContain(`aria-label="${indexMessages.listLabel}"`);
    expect(html).toContain("What is you-agent-factory");
    expect(html).toContain("/docs/documentation/what-is-you-agent-factory");
    expect(html).toContain(
      "you-agent-factory is a CLI and agent-factory workflow system that keeps long-running agent work persistent.",
    );
    // W18 move stubs keep compatibility HTML but are not browse destinations.
    for (const oldRoute of listDocumentationRouteMigrationOldRoutes()) {
      expect(html).not.toContain(`href="${oldRoute}"`);
    }
    expect(html).not.toContain(indexMessages.emptyTitle);
    expect(indexMessages.emptyTitle).not.toMatch(
      CLI_EMPTY_STATE_ATLAS_PHRASING,
    );
    expect(indexMessages.emptyDescription).not.toMatch(
      CLI_EMPTY_STATE_ATLAS_PHRASING,
    );
  });

  it("renders the techniques index with authored page entries", async () => {
    const messages = await loadUiMessages();
    const indexMessages = messages.techniquesIndex;
    const html = renderToStaticMarkup(await TechniquesIndexPage());

    expect(html).toContain(indexMessages.title);
    expect(html).toContain(indexMessages.description);
    expect(html).toContain(`aria-label="${indexMessages.listLabel}"`);
    expect(html).toContain("Classify-Execute");
    expect(html).toContain("/docs/techniques/classify-execute");
    expect(html).toContain(
      "Classify an item into a known class, then run the specialist execute path for that class.",
    );
    expect(html).toContain("Fusion");
    expect(html).toContain("/docs/techniques/fusion");
    expect(html).toContain(
      "Fusion is a you-agent-factory technique that runs two model passes on the same request: a first pass drafts an answer and a second pass refines it.",
    );
    expect(html).toContain("Planner-Executor");
    expect(html).toContain("/docs/techniques/planner-executor");
    expect(html).toContain("Ralph");
    expect(html).toContain("/docs/techniques/ralph");
    expect(html).toContain(
      "Ralph is an autonomous one-story-per-iteration execution loop driven by a product requirements backlog.",
    );
    expect(html).toContain("Worker-Adviser");
    expect(html).toContain("/docs/techniques/worker-adviser");
    expect(html).toContain("Workqueue Executor");
    expect(html).toContain("/docs/techniques/workqueue-executor");
    expect(html).toContain("Writer-Reviewer");
    expect(html).toContain("/docs/techniques/writer-reviewer");
    expect(html).toContain(
      "Writer-reviewer is a dual-role factory technique: a writer produces a candidate, and a reviewer accepts or rejects it.",
    );
    expect(html).not.toContain(indexMessages.emptyTitle);
    expect(indexMessages.emptyTitle).not.toMatch(
      CLI_EMPTY_STATE_ATLAS_PHRASING,
    );
    expect(indexMessages.emptyDescription).not.toMatch(
      CLI_EMPTY_STATE_ATLAS_PHRASING,
    );
  });
});

describe("localized CLI section index page render", () => {
  it("renders the vietnamese guides index with localized title and authored page entries", async () => {
    const messages = await loadUiMessages("vi");
    const html = renderToStaticMarkup(
      await LocalizedGuidesIndexPage({
        params: Promise.resolve({ locale: "vi" }),
      }),
    );

    expect(html).toContain(messages.guidesIndex.title);
    expect(html).toContain(`aria-label="${messages.guidesIndex.listLabel}"`);
    expect(html).toContain("Bắt đầu");
    expect(html).toContain("/vi/docs/guides/getting-started");
    expect(html).toContain("Dùng you-agent-factory cho vòng lặp");
    expect(html).toContain("/vi/docs/guides/using-you-agent-factory-for-loops");
    expect(html).not.toContain(messages.guidesIndex.emptyTitle);
    expect(messages.guidesIndex.emptyDescription).not.toMatch(
      CLI_EMPTY_STATE_ATLAS_PHRASING,
    );
  });

  it("renders the japanese techniques index with localized title and authored page entries", async () => {
    const messages = await loadUiMessages("ja");
    const html = renderToStaticMarkup(
      await LocalizedTechniquesIndexPage({
        params: Promise.resolve({ locale: "ja" }),
      }),
    );

    expect(html).toContain(messages.techniquesIndex.title);
    expect(html).toContain(
      `aria-label="${messages.techniquesIndex.listLabel}"`,
    );
    expect(html).toContain("Fusion");
    expect(html).toContain("/ja/docs/techniques/fusion");
    expect(html).toContain(
      "Fusion is a you-agent-factory technique that runs two model passes on the same request: a first pass drafts an answer and a second pass refines it.",
    );
    expect(html).toContain("Planner-Executor");
    expect(html).toContain("/ja/docs/techniques/planner-executor");
    expect(html).toContain("Ralph");
    expect(html).toContain("/ja/docs/techniques/ralph");
    expect(html).toContain(
      "Ralph is an autonomous one-story-per-iteration execution loop driven by a product requirements backlog.",
    );
    expect(html).toContain("Worker-Adviser");
    expect(html).toContain("/ja/docs/techniques/worker-adviser");
    expect(html).toContain("Writer-Reviewer");
    expect(html).toContain("/ja/docs/techniques/writer-reviewer");
    expect(html).not.toContain(messages.techniquesIndex.emptyTitle);
    expect(messages.techniquesIndex.emptyDescription).not.toMatch(
      CLI_EMPTY_STATE_ATLAS_PHRASING,
    );
  });

  it("renders the vietnamese documentation index with localized title and authored page entries", async () => {
    const messages = await loadUiMessages("vi");
    const html = renderToStaticMarkup(
      await LocalizedDocumentationIndexPage({
        params: Promise.resolve({ locale: "vi" }),
      }),
    );

    expect(html).toContain(messages.documentationIndex.title);
    expect(html).toContain(
      `aria-label="${messages.documentationIndex.listLabel}"`,
    );
    expect(html).toContain("you-agent-factory là gì");
    expect(html).toContain("/vi/docs/documentation/what-is-you-agent-factory");
    expect(html).toContain(
      "you-agent-factory là CLI và hệ thống workflow agent-factory giúp công việc agent chạy dài được duy trì liên tục.",
    );
    expect(html).not.toContain(messages.documentationIndex.emptyTitle);
    expect(messages.documentationIndex.emptyDescription).not.toMatch(
      CLI_EMPTY_STATE_ATLAS_PHRASING,
    );
  });

  it("renders the japanese concepts index with localized title and authored page entries", async () => {
    const messages = await loadUiMessages("ja");
    const html = renderToStaticMarkup(
      await LocalizedConceptsIndexPage({
        params: Promise.resolve({ locale: "ja" }),
      }),
    );

    expect(html).toContain(messages.conceptsIndex.title);
    expect(html).toContain(messages.conceptsIndex.description);
    expect(html).toContain(`aria-label="${messages.conceptsIndex.listLabel}"`);
    expect(html).toContain("Bottlenecks");
    expect(html).toContain("/ja/docs/concepts/bottlenecks");
    expect(html).toContain("Checklist");
    expect(html).toContain("/ja/docs/concepts/checklist");
    expect(html).toContain("Compaction");
    expect(html).toContain("/ja/docs/concepts/compaction");
    expect(html).toContain("Harness");
    expect(html).toContain("/ja/docs/concepts/harness");
    expect(html).toContain("Loop");
    expect(html).toContain("/ja/docs/concepts/loop");
    expect(html).toContain("Skills");
    expect(html).toContain("/ja/docs/concepts/skills");
    expect(html).toContain("MCP");
    expect(html).toContain("/ja/docs/concepts/mcp");
    expect(html).toContain("Statistical Process Control Graphs");
    expect(html).toContain(
      "/ja/docs/concepts/statistical-process-control-graphs",
    );
    expect(html).toContain("Tokens");
    expect(html).toContain("/ja/docs/concepts/tokens");
    expect(html).toContain("Tool");
    expect(html).toContain("/ja/docs/concepts/tool");
    expect(html).toContain("Tool calling");
    expect(html).toContain("/ja/docs/concepts/tool-calling");
    expect(html).toContain("Worktree");
    expect(html).toContain("/ja/docs/concepts/worktree");
    expect(html).not.toContain("Thinking");
    expect(html).not.toContain("/ja/docs/concepts/thinking");
    expect(html).not.toContain("Task Queue");
    expect(html).not.toContain("/ja/docs/concepts/task-queue");
    expect(html).not.toContain(messages.conceptsIndex.emptyTitle);
    expect(messages.conceptsIndex.emptyDescription).not.toMatch(
      CLI_EMPTY_STATE_ATLAS_PHRASING,
    );
  });
});

describe("CLI section index metadata", () => {
  for (const section of CLI_SECTION_INDEX_CASES) {
    it(`keeps default and localized ${section.collectionId} index metadata aligned`, async () => {
      const defaultMetadata = await section.generateDefaultMetadata();
      const localizedMetadata = await section.generateLocalizedMetadata({
        params: Promise.resolve({ locale: "vi" }),
      });
      const routeSlug = section.collectionId;
      const expectedAlternates = {
        canonical: `/docs/${routeSlug}`,
        languages: {
          en: `/docs/${routeSlug}`,
          ja: `/ja/docs/${routeSlug}`,
          "zh-CN": `/zh-CN/docs/${routeSlug}`,
          vi: `/vi/docs/${routeSlug}`,
        },
      };

      expect(defaultMetadata.alternates).toEqual(expectedAlternates);
      expect(localizedMetadata.alternates).toEqual(defaultMetadata.alternates);

      const viMessages = await loadUiMessages("vi");
      const indexMessages = viMessages[section.messageKey];
      expect(localizedMetadata.title).toBe(indexMessages.title);
      expect(localizedMetadata.description).toBe(indexMessages.description);
    });
  }
});

const W05_DIRECT_ROUTE_FAMILY_METADATA_CASES = [
  {
    collectionId: "factories" as const,
    messageKey: "factoriesIndex" as const,
    renderDefault: FactoriesIndexPage,
    renderLocalized: LocalizedFactoriesIndexPage,
    generateDefaultMetadata: generateFactoriesMetadata,
    generateLocalizedMetadata: generateLocalizedFactoriesMetadata,
  },
] as const;

describe("W05 direct route-family section index pages", () => {
  it("loads index copy for references, factories, workers, and workstations", async () => {
    const messages = await loadUiMessages();

    expect(messages.referencesIndex.title).toBe("References");
    expect(messages.factoriesIndex.title).toBe("Factories");
    expect(messages.factoriesIndex.overviewTitle).toBeTruthy();
    expect(messages.factoriesIndex.schemaSummaryTitle).toBeTruthy();
    expect(messages.workersIndex.title).toBe("Workers");
    expect(messages.workstationsIndex.title).toBe("Workstations");
  });

  it("renders the factories index with authored entries and overview", async () => {
    const messages = await loadUiMessages();
    const indexMessages = messages.factoriesIndex;
    const html = renderToStaticMarkup(await FactoriesIndexPage());

    expect(html).toContain(indexMessages.title);
    expect(html).toContain(indexMessages.description);
    expect(html).toContain(indexMessages.overviewTitle);
    expect(html).toContain(indexMessages.overviewBody);
    expect(html).toContain(indexMessages.schemaSummaryTitle);
    expect(html).toContain(`aria-label="${indexMessages.listLabel}"`);
    expect(html).toContain("/docs/factories/configuration");
    expect(html).toContain("/docs/factories/sessions");
    expect(html).toContain('data-testid="factories-index-factory-root-schema"');
    expect(html).not.toContain(indexMessages.emptyTitle);
    expect(html).not.toContain("/docs/documentation/");
  });

  it("renders the localized factories index overview while locale page stubs are absent", async () => {
    const messages = await loadUiMessages("ja");
    const indexMessages = messages.factoriesIndex;
    const html = renderToStaticMarkup(
      await LocalizedFactoriesIndexPage({
        params: Promise.resolve({ locale: "ja" }),
      }),
    );

    expect(html).toContain(indexMessages.title);
    expect(html).toContain(indexMessages.overviewTitle);
    expect(html).toContain(indexMessages.schemaSummaryTitle);
    expect(html).toContain('data-testid="factories-index-factory-root-schema"');
    // Child factories pages ship default-locale only until locale stubs exist.
    expect(html).toContain(indexMessages.emptyTitle);
    expect(html).not.toContain(`aria-label="${indexMessages.listLabel}"`);
  });

  it("renders the authored references family index without introduction or Package freshness chrome", async () => {
    const html = renderToStaticMarkup(await ReferencesIndexPage());

    expect(html).toContain("References");
    expect(html).toContain("Contract lookup surfaces");
    expect(html).toContain("published contract surfaces");
    expect(html).not.toContain("What this family covers");
    expect(html).not.toContain("isolation-first lookup");
    expect(html).not.toContain('data-references-family-introduction=""');
    expect(html).not.toContain('id="introduction"');
    expect(html).toContain('data-references-family-index=""');
    expect(html).toContain("Contract surfaces");
    expect(html).toContain('data-references-family-discoverability=""');
    expect(html).not.toContain('data-references-family-freshness=""');
    expect(html).not.toContain("Package freshness");
    expect(html).not.toContain("data-freshness-status=");
    expect(html).not.toContain('data-references-family-freshness-summary=""');
    expect(html).not.toContain('id="package-freshness"');
    expect(html).toContain("System configuration schema");
    expect(html).not.toContain("you-config");
    for (const href of [
      "/docs/references/api",
      "/docs/references/events",
      "/docs/references/factory-schema",
      "/docs/references/system-config-schema",
      "/docs/references/mock-workers-schema",
      "/docs/references/cli",
      "/docs/references/mcp",
      "/docs/references/javascript-runtime",
    ]) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).not.toContain("No reference entries yet");
    expect(html).not.toContain("Package freshness unavailable");
  });

  it("renders the localized references family index with locale page chrome", async () => {
    const html = renderToStaticMarkup(
      await LocalizedReferencesIndexPage({
        params: Promise.resolve({ locale: "ja" }),
      }),
    );

    expect(html).toContain("リファレンス");
    expect(html).not.toContain("このファミリーが扱うこと");
    expect(html).toContain("コントラクト面");
    expect(html).toContain("公開済みコントラクト面");
    expect(html).not.toContain("パッケージの鮮度");
    expect(html).not.toContain('data-references-family-freshness=""');
    expect(html).not.toContain('id="package-freshness"');
    expect(html).not.toContain("What this family covers");
    expect(html).not.toContain("No reference entries yet");
  });

  it("keeps default and localized references index metadata aligned", async () => {
    const defaultMetadata = await generateReferencesMetadata();
    const localizedMetadata = await generateLocalizedReferencesMetadata({
      params: Promise.resolve({ locale: "vi" }),
    });
    const expectedAlternates = {
      canonical: "/docs/references",
      languages: {
        en: "/docs/references",
        ja: "/ja/docs/references",
        "zh-CN": "/zh-CN/docs/references",
        vi: "/vi/docs/references",
      },
    };

    expect(defaultMetadata.alternates).toEqual(expectedAlternates);
    expect(localizedMetadata.alternates).toEqual(defaultMetadata.alternates);
    expect(defaultMetadata.title).toBe("References");
    expect(defaultMetadata.description).toContain("Contract lookup");
    expect(localizedMetadata.title).toBe("Tham chiếu");
    expect(localizedMetadata.description).toContain("bề mặt tra cứu hợp đồng");
  });

  it("renders the authored workers family index instead of the empty-state contract", async () => {
    const html = renderToStaticMarkup(await WorkersIndexPage());

    expect(html).toContain("Workers");
    expect(html).toContain('data-workers-family-index=""');
    expect(html).toContain('data-workers-selection-table=""');
    expect(html).toContain("INFERENCE_WORKER");
    expect(html).toContain("Mock worker (not a WorkerType)");
    expect(html).not.toContain("No worker entries yet");
  });

  it("renders the localized workers family index with page-local selection copy", async () => {
    const html = renderToStaticMarkup(
      await LocalizedWorkersIndexPage({
        params: Promise.resolve({ locale: "ja" }),
      }),
    );

    expect(html).toContain("Workers");
    expect(html).toContain('data-workers-family-index=""');
    expect(html).toContain("AGENT_WORKER");
    expect(html).not.toContain("No worker entries yet");
  });

  it("keeps default and localized workers index metadata aligned to page-local messages", async () => {
    const defaultMetadata = await generateWorkersMetadata();
    const localizedMetadata = await generateLocalizedWorkersMetadata({
      params: Promise.resolve({ locale: "vi" }),
    });
    const expectedAlternates = {
      canonical: "/docs/workers",
      languages: {
        en: "/docs/workers",
        ja: "/ja/docs/workers",
        "zh-CN": "/zh-CN/docs/workers",
        vi: "/vi/docs/workers",
      },
    };

    expect(defaultMetadata.alternates).toEqual(expectedAlternates);
    expect(localizedMetadata.alternates).toEqual(defaultMetadata.alternates);
    expect(defaultMetadata.title).toBe("Workers");
    expect(localizedMetadata.title).toBe("Workers");
    expect(String(defaultMetadata.description)).toMatch(/WorkerType/i);
    expect(localizedMetadata.description).toBe(defaultMetadata.description);
  });

  for (const section of W05_DIRECT_ROUTE_FAMILY_METADATA_CASES) {
    it(`keeps default and localized ${section.collectionId} index metadata aligned`, async () => {
      const defaultMetadata = await section.generateDefaultMetadata();
      const localizedMetadata = await section.generateLocalizedMetadata({
        params: Promise.resolve({ locale: "vi" }),
      });
      const routeSlug = section.collectionId;
      const expectedAlternates = {
        canonical: `/docs/${routeSlug}`,
        languages: {
          en: `/docs/${routeSlug}`,
          ja: `/ja/docs/${routeSlug}`,
          "zh-CN": `/zh-CN/docs/${routeSlug}`,
          vi: `/vi/docs/${routeSlug}`,
        },
      };

      expect(defaultMetadata.alternates).toEqual(expectedAlternates);
      expect(localizedMetadata.alternates).toEqual(defaultMetadata.alternates);

      const viMessages = await loadUiMessages("vi");
      const indexMessages = viMessages[section.messageKey];
      expect(localizedMetadata.title).toBe(indexMessages.title);
      expect(localizedMetadata.description).toBe(indexMessages.description);
    });
  }

  it("renders the authored workstations family index instead of the empty-state contract", async () => {
    const html = renderToStaticMarkup(await WorkstationsIndexPage());

    expect(html).toContain("Workstations");
    expect(html).toContain('data-workstations-family-index=""');
    expect(html).toContain('data-workstations-type-selection-table=""');
    expect(html).toContain('data-workstations-compatibility-matrix=""');
    expect(html).toContain("INFERENCE_RUN");
    expect(html).toContain("POLLER_RUN");
    expect(html).toContain("Do not collapse POLLER_RUN");
    expect(html).not.toContain("No workstation entries yet");
  });

  it("renders the localized workstations family index with page-local selection copy", async () => {
    const html = renderToStaticMarkup(
      await LocalizedWorkstationsIndexPage({
        params: Promise.resolve({ locale: "ja" }),
      }),
    );

    expect(html).toContain("Workstations");
    expect(html).toContain('data-workstations-family-index=""');
    expect(html).toContain("AGENT_RUN");
    expect(html).not.toContain("No workstation entries yet");
  });

  it("keeps default and localized workstations index metadata aligned to page-local messages", async () => {
    const defaultMetadata = await generateWorkstationsMetadata();
    const localizedMetadata = await generateLocalizedWorkstationsMetadata({
      params: Promise.resolve({ locale: "vi" }),
    });
    const expectedAlternates = {
      canonical: "/docs/workstations",
      languages: {
        en: "/docs/workstations",
        ja: "/ja/docs/workstations",
        "zh-CN": "/zh-CN/docs/workstations",
        vi: "/vi/docs/workstations",
      },
    };

    expect(defaultMetadata.alternates).toEqual(expectedAlternates);
    expect(localizedMetadata.alternates).toEqual(defaultMetadata.alternates);
    expect(defaultMetadata.title).toBe("Workstations");
    expect(localizedMetadata.title).toBe("Workstations");
    expect(String(defaultMetadata.description)).toMatch(/WorkstationType/i);
    expect(localizedMetadata.description).toBe(defaultMetadata.description);
  });
});
