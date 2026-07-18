/**
 * Page-owned render proof for documentation/faq.
 * Covers documentation shell, FAQ identity, short-answer Q&A entries with
 * canonical-doc links, Troubleshooting cross-link, non-en locale stub
 * structure, and absence of Model Atlas / reader-shortcut / page-meta copy —
 * not route inventories or shared helper contracts.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within the ordinary page-owned + locale-shipping surface for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("faq documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/faq as a documentation page", async () => {
    const fumadocsPage = source.getPage(["documentation", "faq"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/faq");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "faq",
    });

    expect(loadedPage.messages.title).toBe("FAQ");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(
      /short answers|common .+ questions|FAQ/i,
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const whatIsYouAgentFactory = String(
      loadedPage.messages.sections?.whatIsYouAgentFactory?.body ?? "",
    );
    const howToInstall = String(
      loadedPage.messages.sections?.howToInstall?.body ?? "",
    );
    const howToRunNamedWorkflow = String(
      loadedPage.messages.sections?.howToRunNamedWorkflow?.body ?? "",
    );
    const whereConfigurationLives = String(
      loadedPage.messages.sections?.whereConfigurationLives?.body ?? "",
    );
    const howMcpOrCursorConnects = String(
      loadedPage.messages.sections?.howMcpOrCursorConnects?.body ?? "",
    );
    const somethingFailed = String(
      loadedPage.messages.sections?.somethingFailed?.body ?? "",
    );
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(whatItCovers).toMatch(/short-answer surface/i);
    expect(whatItCovers).toMatch(/install/i);
    expect(whatItCovers).toMatch(/MCP/i);
    expect(keyConcepts).toMatch(/question/i);
    expect(keyConcepts).toMatch(/short reply|canonical/i);
    expect(keyConcepts).toMatch(/canonical/i);
    expect(howToUse).toMatch(/question/i);
    expect(howToUse).toMatch(/short reply/i);

    expect(whatIsYouAgentFactory).toMatch(/you-agent-factory/i);
    expect(whatIsYouAgentFactory).toMatch(/Getting Started|first-run/i);
    expect(whatIsYouAgentFactory).not.toMatch(/you run --named/i);

    expect(howToInstall).toMatch(/Install/i);
    expect(howToInstall).toMatch(/PATH|OS-specific/i);
    expect(howToInstall).not.toMatch(/curl -fsSL|\birm\b/i);

    expect(howToRunNamedWorkflow).toMatch(/session list|Factory Session/i);
    expect(howToRunNamedWorkflow).toMatch(/Getting Started|CLI/i);
    expect(howToRunNamedWorkflow).not.toMatch(/--named @goal/i);

    expect(whereConfigurationLives).toMatch(/factory\.json/i);
    expect(whereConfigurationLives).toMatch(
      /~\/\.you-agent-factory\/config\.json|operator defaults/i,
    );
    expect(whereConfigurationLives).not.toMatch(
      /defaults\.workerModelProvider.*defaults\.workerModel/i,
    );

    expect(howMcpOrCursorConnects).toMatch(/mcp serve/i);
    expect(howMcpOrCursorConnects).toMatch(/Cursor|Dynamic Workflows/i);
    expect(howMcpOrCursorConnects).not.toMatch(/args-schema|OpenAPI/i);

    expect(somethingFailed).toMatch(/Troubleshooting/i);
    expect(somethingFailed).toMatch(/failure|recover/i);

    expect(limits).toMatch(/web FAQ/i);
    expect(limits).toMatch(/not the install command matrix/i);
    expect(limits).toMatch(/not a full CLI flag dump/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(keyConcepts).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(howToUse).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);
    expect(limits).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);

    render(
      <main>
        <DocsPageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    expect(
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Key Concepts" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "What Is You-Agent-Factory, And Where Do I Start?",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "How Do I Install You?" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "How Do I Run A Named Workflow Or Confirm A Live Session?",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Where Does Configuration Live?",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "How Do MCP Or Cursor Dynamic Workflows Connect?",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Something Failed—Where Do I Recover?",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    expect(document.body.textContent).toMatch(
      /FAQ is the you-agent-factory short-answer surface/i,
    );
    expect(document.body.textContent).toMatch(/keeps long-running agent work/i);
    expect(document.body.textContent).toMatch(/OS-specific script/i);
    expect(document.body.textContent).toMatch(/you session list/i);
    expect(document.body.textContent).toMatch(/factory\.json/i);
    expect(document.body.textContent).toMatch(/you mcp serve/i);
    expect(document.body.textContent).toMatch(
      /open Troubleshooting for symptom-scoped recovery/i,
    );
    expect(document.body.textContent).not.toMatch(/Model Atlas/i);
    expect(document.body.textContent).not.toMatch(/reader.?shortcut/i);
    // Docs shell owns the page title; body must not duplicate an h1 title.
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();

    const whatIsLinks = screen.getAllByRole("link", {
      name: "What is you-agent-factory",
    });
    expect(whatIsLinks.length).toBeGreaterThanOrEqual(1);
    expect(whatIsLinks[0]?.getAttribute("href")).toBe(
      "/docs/documentation/what-is-you-agent-factory",
    );

    const gettingStartedLinks = screen.getAllByRole("link", {
      name: "Getting Started",
    });
    expect(gettingStartedLinks.length).toBeGreaterThanOrEqual(1);
    expect(gettingStartedLinks[0]?.getAttribute("href")).toBe(
      "/docs/guides/getting-started",
    );

    const installLinks = screen.getAllByRole("link", { name: "Install" });
    expect(installLinks.length).toBeGreaterThanOrEqual(1);
    expect(installLinks[0]?.getAttribute("href")).toBe(
      "/docs/documentation/install",
    );
    expect(screen.getByRole("link", { name: "CLI" }).getAttribute("href")).toBe(
      "/docs/documentation/cli",
    );
    expect(
      screen
        .getByRole("link", { name: "Factory Session" })
        .getAttribute("href"),
    ).toBe("/docs/factories/sessions");
    expect(
      screen.getByRole("link", { name: "Configuration" }).getAttribute("href"),
    ).toBe("/docs/factories/configuration");
    expect(
      screen
        .getByRole("link", { name: "Global Configuration Factories" })
        .getAttribute("href"),
    ).toBe("/docs/factories/global-configuration");
    const mcpLinks = screen.getAllByRole("link", { name: "MCP" });
    expect(mcpLinks.length).toBeGreaterThanOrEqual(1);
    expect(mcpLinks[0]?.getAttribute("href")).toBe("/docs/documentation/mcp");
    expect(
      screen
        .getByRole("link", { name: "Dynamic Workflows" })
        .getAttribute("href"),
    ).toBe("/docs/factories/dynamic-workflows");
    expect(
      screen
        .getByRole("link", { name: "Cursor dynamic workflows guide" })
        .getAttribute("href"),
    ).toBe("/docs/guides/cursor-dynamic-workflows");

    const troubleshootingLinks = screen.getAllByRole("link", {
      name: "Troubleshooting",
    });
    expect(troubleshootingLinks.length).toBeGreaterThanOrEqual(1);
    expect(troubleshootingLinks[0]?.getAttribute("href")).toBe(
      "/docs/documentation/troubleshooting",
    );

    const relatedSection = document.getElementById("related");
    expect(relatedSection).toBeTruthy();
    const relatedQueries = within(relatedSection as HTMLElement);
    expect(
      relatedQueries
        .getByRole("link", { name: "Troubleshooting" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/troubleshooting");
    expect(
      relatedQueries
        .getByRole("link", { name: "What is you-agent-factory" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/what-is-you-agent-factory");
    expect(
      relatedQueries
        .getByRole("link", { name: "Getting Started" })
        .getAttribute("href"),
    ).toBe("/docs/guides/getting-started");
  });

  test("loads ja locale messages with the same section structure", async () => {
    const loadedPage = await loadLocalDocsPage(
      {
        section: "documentation",
        slug: "faq",
      },
      "ja",
    );

    expect(loadedPage.messages.title).toBe("FAQ");
    expect(loadedPage.messages.sections?.whatItCovers?.title).toBe(
      "What It Covers",
    );
    expect(loadedPage.messages.sections?.whatIsYouAgentFactory?.title).toBe(
      "What Is You-Agent-Factory, And Where Do I Start?",
    );
    expect(loadedPage.messages.sections?.somethingFailed?.title).toBe(
      "Something Failed—Where Do I Recover?",
    );
    expect(loadedPage.messages.sections?.limitsAndAssumptions?.title).toBe(
      "Limits And Assumptions",
    );

    render(
      <main>
        <DocsPageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    expect(
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Something Failed—Where Do I Recover?",
      }),
    ).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Model Atlas/i);
  });
});
