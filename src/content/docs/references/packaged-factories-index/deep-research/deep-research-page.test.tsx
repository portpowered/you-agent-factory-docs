/**
 * Page-owned proofs for references/packaged-factories-index/deep-research.
 * Story 001: published nested route, purpose description, and non-replay
 * component-map resolution.
 * Story 002: one visible minimal concrete usage example (no walkthrough
 * expansion).
 * Story 003: real anchors to JavaScript Runtime and Dynamic Workflows.
 * Story 004: focused proofs that the rendered page stays limited to purpose,
 * one usage example, and the two required links — with no forbidden expansion
 * surfaces (replay, timeline/event-history, raw source panels, AST,
 * stages/workers, schema expansion).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getRegistryRecord, loadRegistry } from "@/lib/content/registry";
import { loadRouteFamilyPageMdxComponents } from "@/lib/content/route-family-local-docs-page-load";
import { source } from "@/lib/source";
import {
  packagedFactoriesIndexChildComponentMapKind as deepResearchMapKind,
  pageMdxComponents as deepResearchPageMdxComponents,
} from "../deep-research-page-mdx-components";
import { pageMdxComponents as replayPageMdxComponents } from "../replay-page-mdx-components";

const PAGE_URL = "/docs/references/packaged-factories-index/deep-research";
const REGISTRY_ID = "reference.packaged-factories-index-deep-research";
const PURPOSE_BODY =
  "@you/deep-research investigates a research topic with a lead research pass. When the topic needs more breadth, it can call specialist investigators and then synthesize the findings into one result.";
const USAGE_EXAMPLE =
  'you run --named @you/deep-research "Compare event sourcing and state machines for workflow orchestration"';
const JAVASCRIPT_RUNTIME_HREF = "/docs/references/javascript-runtime";
const DYNAMIC_WORKFLOWS_HREF = "/docs/factories/dynamic-workflows";

/** DOM markers that would indicate forbidden expansion surfaces on this route. */
const FORBIDDEN_EXPANSION_SELECTORS = [
  "[data-factory-replay]",
  "[data-factory-replay-mode]",
  "[data-factory-visualizer]",
  "[data-factory-recording]",
  "[data-packaged-factory-definition]",
  "[data-packaged-factory-definition-code]",
  "[data-packaged-factory-source-kind]",
  "[data-schema-field-expand]",
  "[data-schema-status]",
  "[data-schema-definition-embed]",
] as const;

/** Rendered-body phrases that would indicate forbidden expansion content. */
const FORBIDDEN_EXPANSION_BODY_PATTERNS = [
  /event history|timeline scrubber|playback|recording sample/i,
  /\bAST\b|abstract syntax|call graph/i,
  /\bstages\b|\bworkers\b/i,
  /"id":\s*"builtin-deep-research"|invocationSignature|scripts\/deep-research\.workflow\.js/i,
  /schema expansion|field expand|definition embed/i,
] as const;

describe("packaged-factories-index/deep-research nested reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes the nested deep-research route with a concise purpose description", async () => {
    const fumadocsPage = source.getPage([
      "references",
      "packaged-factories-index",
      "deep-research",
    ]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe(PAGE_URL);

    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "packaged-factories-index/deep-research",
    });

    expect(loadedPage.frontmatter.kind).toBe("reference");
    expect(loadedPage.frontmatter.registryId).toBe(REGISTRY_ID);
    expect(loadedPage.frontmatter.status).toBe("published");
    expect(loadedPage.messages.title).toBe("@you/deep-research");
    expect(loadedPage.messages.description).toMatch(/@you\/deep-research/i);
    expect(loadedPage.messages.sections?.purpose?.body).toBe(PURPOSE_BODY);
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
    expect(loadedPage.messages.sections?.limitsAndAssumptions).toBeUndefined();
    expect(
      String(loadedPage.messages.sections?.purpose?.body ?? ""),
    ).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut|teaching|Batch 4/i,
    );

    render(
      <main>
        <DocsPageProviders
          assets={loadedPage.assets}
          messages={loadedPage.messages}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "Purpose" })).toBeTruthy();
    expect(screen.getByText(PURPOSE_BODY)).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeNull();
    expect(document.querySelector("[data-factory-replay]")).toBeNull();
    expect(document.querySelector("[data-factory-visualizer]")).toBeNull();
  });

  test("shows exactly one minimal concrete usage example in the page body", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "packaged-factories-index/deep-research",
    });

    expect(loadedPage.messages.sections?.usage?.title).toBe("Usage");
    expect(loadedPage.messages.sections?.usage?.body).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();

    render(
      <main>
        <DocsPageProviders
          assets={loadedPage.assets}
          messages={loadedPage.messages}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "Usage" })).toBeTruthy();
    expect(screen.getByText(USAGE_EXAMPLE)).toBeTruthy();

    const namedInvocations = screen.getAllByText(
      /you run --named @you\/deep-research/,
    );
    expect(namedInvocations).toHaveLength(1);

    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(
      screen.queryByText(/step 1|walkthrough|tutorial|operational note/i),
    ).toBeNull();
    expect(document.querySelector("[data-factory-replay]")).toBeNull();
    expect(document.querySelector("[data-factory-visualizer]")).toBeNull();
  });

  test("links to JavaScript Runtime and Dynamic Workflows with real anchors", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "packaged-factories-index/deep-research",
    });

    expect(loadedPage.messages.links?.javascriptRuntime).toBe(
      "JavaScript Runtime",
    );
    expect(loadedPage.messages.links?.dynamicWorkflows).toBe(
      "Dynamic Workflows",
    );

    render(
      <main>
        <DocsPageProviders
          assets={loadedPage.assets}
          messages={loadedPage.messages}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    const javascriptRuntimeLink = screen.getByRole("link", {
      name: "JavaScript Runtime",
    });
    const dynamicWorkflowsLink = screen.getByRole("link", {
      name: "Dynamic Workflows",
    });

    expect(javascriptRuntimeLink.tagName).toBe("A");
    expect(javascriptRuntimeLink.getAttribute("href")).toBe(
      JAVASCRIPT_RUNTIME_HREF,
    );
    expect(dynamicWorkflowsLink.tagName).toBe("A");
    expect(dynamicWorkflowsLink.getAttribute("href")).toBe(
      DYNAMIC_WORKFLOWS_HREF,
    );

    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
  });

  test("exposes a published registry record for the nested deep-research page", async () => {
    const indexes = await loadRegistry();
    const record = getRegistryRecord(indexes, REGISTRY_ID);

    expect(record).toBeTruthy();
    expect(record?.kind).toBe("reference");
    expect(record?.id).toBe(REGISTRY_ID);
    expect(record?.slug).toBe("deep-research");
    expect(record?.status).toBe("published");
    expect(record?.aliases).toContain("@you/deep-research");
  });

  test("resolves the non-replay deep-research component map and never the shared replay map", async () => {
    const loaded = await loadRouteFamilyPageMdxComponents(
      "references",
      "packaged-factories-index/deep-research",
    );

    expect(deepResearchMapKind).toBe("non-replay");
    expect(loaded).toBe(deepResearchPageMdxComponents);
    expect(loaded).not.toBe(replayPageMdxComponents);
  });

  test("renders only purpose, one usage example, and the two required links with no forbidden expansion surfaces", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "packaged-factories-index/deep-research",
    });

    render(
      <main>
        <DocsPageProviders
          assets={loadedPage.assets}
          messages={loadedPage.messages}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "Purpose" })).toBeTruthy();
    expect(screen.getByText(PURPOSE_BODY)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Usage" })).toBeTruthy();
    expect(screen.getByText(USAGE_EXAMPLE)).toBeTruthy();
    expect(
      screen.getAllByText(/you run --named @you\/deep-research/),
    ).toHaveLength(1);

    const javascriptRuntimeLink = screen.getByRole("link", {
      name: "JavaScript Runtime",
    });
    const dynamicWorkflowsLink = screen.getByRole("link", {
      name: "Dynamic Workflows",
    });
    expect(javascriptRuntimeLink.getAttribute("href")).toBe(
      JAVASCRIPT_RUNTIME_HREF,
    );
    expect(dynamicWorkflowsLink.getAttribute("href")).toBe(
      DYNAMIC_WORKFLOWS_HREF,
    );

    for (const selector of FORBIDDEN_EXPANSION_SELECTORS) {
      expect(document.querySelector(selector)).toBeNull();
    }

    const renderedBody = document.body.textContent ?? "";
    for (const pattern of FORBIDDEN_EXPANSION_BODY_PATTERNS) {
      expect(renderedBody).not.toMatch(pattern);
    }

    expect(
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Event History" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Timeline" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Stages" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Workers" })).toBeNull();
    expect(screen.queryByRole("button", { name: /play|pause/i })).toBeNull();

    expect(Object.keys(deepResearchPageMdxComponents)).toEqual([]);
  });
});
