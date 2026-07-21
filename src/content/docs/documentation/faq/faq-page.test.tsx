/**
 * Page-owned render proof for documentation/faq.
 * Covers documentation shell, FAQ identity, short-answer Q&A entries with
 * canonical-doc links, Troubleshooting cross-link, non-en locale stub
 * structure, list-only chrome (no Limits / Related / Tags / References footer
 * sections or RelatedDocs / TagPillList / CitationList mounts; discovery stays
 * via in-answer LocalizedLinkList only), and absence of Model Atlas /
 * reader-shortcut / page-meta copy — not route inventories or shared helper
 * contracts.
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
    expect(loadedPage.messages.openingSummary).toMatch(/short-answer surface/i);
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();

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
    expect(loadedPage.messages.sections?.limitsAndAssumptions).toBeUndefined();

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
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(document.getElementById("what-it-covers")).toBeNull();
    expect(document.getElementById("key-concepts")).toBeNull();
    expect(document.getElementById("how-to-use")).toBeNull();
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
      screen.queryByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeNull();
    expect(document.getElementById("limits-and-assumptions")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Related" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(loadedPage.messages.sections?.related).toBeUndefined();
    expect(loadedPage.messages.sections?.tags).toBeUndefined();
    expect(loadedPage.messages.sections?.references).toBeUndefined();
    expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("tags")).toBeNull();
    expect(document.getElementById("references")).toBeNull();
    expect(
      document.querySelector('[data-testid="curated-related-docs"]'),
    ).toBeNull();

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

    // Answer-section LocalizedLinkList mounts stay intact (scoped to Q&A ids).
    const whatIsSection = document.getElementById("what-is-you-agent-factory");
    expect(whatIsSection).toBeTruthy();
    expect(
      within(whatIsSection as HTMLElement)
        .getByRole("link", { name: "What is you-agent-factory" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/what-is-you-agent-factory");
    expect(
      within(whatIsSection as HTMLElement)
        .getByRole("link", { name: "Getting Started" })
        .getAttribute("href"),
    ).toBe("/docs/guides/getting-started");

    const installSection = document.getElementById("how-to-install");
    expect(installSection).toBeTruthy();
    expect(
      within(installSection as HTMLElement)
        .getByRole("link", { name: "Install" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/install");

    const runSection = document.getElementById("how-to-run-named-workflow");
    expect(runSection).toBeTruthy();
    expect(
      within(runSection as HTMLElement)
        .getByRole("link", { name: "Getting Started" })
        .getAttribute("href"),
    ).toBe("/docs/guides/getting-started");
    expect(
      within(runSection as HTMLElement)
        .getByRole("link", { name: "CLI" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/cli");
    expect(
      within(runSection as HTMLElement)
        .getByRole("link", { name: "Factory Session" })
        .getAttribute("href"),
    ).toBe("/docs/factories/sessions");

    const configSection = document.getElementById("where-configuration-lives");
    expect(configSection).toBeTruthy();
    expect(
      within(configSection as HTMLElement)
        .getByRole("link", { name: "Configuration" })
        .getAttribute("href"),
    ).toBe("/docs/factories/configuration");
    expect(
      within(configSection as HTMLElement)
        .getByRole("link", { name: "Global Configuration Factories" })
        .getAttribute("href"),
    ).toBe("/docs/factories/global-configuration");

    const mcpSection = document.getElementById("how-mcp-or-cursor-connects");
    expect(mcpSection).toBeTruthy();
    expect(
      within(mcpSection as HTMLElement)
        .getByRole("link", { name: "MCP" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/mcp");
    expect(
      within(mcpSection as HTMLElement)
        .getByRole("link", { name: "Dynamic Workflows" })
        .getAttribute("href"),
    ).toBe("/docs/factories/dynamic-workflows");
    expect(
      within(mcpSection as HTMLElement)
        .getByRole("link", { name: "Cursor dynamic workflows guide" })
        .getAttribute("href"),
    ).toBe("/docs/guides/cursor-dynamic-workflows");

    const failedSection = document.getElementById("something-failed");
    expect(failedSection).toBeTruthy();
    expect(
      within(failedSection as HTMLElement)
        .getByRole("link", { name: "Troubleshooting" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/troubleshooting");
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
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
    expect(loadedPage.messages.sections?.whatIsYouAgentFactory?.title).toBe(
      "What Is You-Agent-Factory, And Where Do I Start?",
    );
    expect(loadedPage.messages.sections?.somethingFailed?.title).toBe(
      "Something Failed—Where Do I Recover?",
    );
    expect(loadedPage.messages.sections?.limitsAndAssumptions).toBeUndefined();
    expect(loadedPage.messages.sections?.related).toBeUndefined();

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
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(
      screen.getByRole("heading", {
        name: "Something Failed—Where Do I Recover?",
      }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Related" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("tags")).toBeNull();
    expect(document.getElementById("references")).toBeNull();
    expect(
      document.querySelector('[data-testid="curated-related-docs"]'),
    ).toBeNull();
    expect(document.body.textContent).not.toMatch(/Model Atlas/i);
  });
});
