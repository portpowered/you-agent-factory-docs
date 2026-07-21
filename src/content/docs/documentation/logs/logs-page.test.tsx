/**
 * Page-owned render proof for documentation/logs.
 * Covers documentation shell, Logs identity, runtime-log channel
 * framing, retention/rotation controls, CLI diagnostics policy,
 * channel boundaries, sibling discovery, and non-en locale route
 * render — not route inventories or shared helper contracts.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within the ordinary page-owned + locale-shipping surface for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("logs documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/logs as a documentation page", async () => {
    const fumadocsPage = source.getPage(["documentation", "logs"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/logs");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "logs",
    });

    expect(loadedPage.messages.title).toBe("Logs");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/runtime logs/i);
    expect(loadedPage.messages.description).toMatch(/--verbose|--debug/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).not.toMatch(
      /docs-site build logs/i,
    );

    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

    const openingSummary = String(loadedPage.messages.openingSummary ?? "");
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(openingSummary).toMatch(/structured JSON rolling files/i);
    expect(openingSummary).toMatch(/log root/i);
    expect(openingSummary).not.toMatch(/\n\n/);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );

    expect(howToUse).toMatch(/log root/i);
    expect(howToUse).toMatch(/retention and rotation/i);
    expect(howToUse).toMatch(/structured JSON rolling files/i);
    expect(howToUse).toMatch(/UTC start date/i);
    expect(howToUse).toMatch(/~\/\.you-agent-factory\/logs/);
    expect(howToUse).toMatch(/metrics files/i);
    expect(howToUse).toMatch(/structured JSONL/i);
    expect(howToUse).toMatch(/--verbose/);
    expect(howToUse).toMatch(/concise command diagnostics to stderr/i);
    expect(howToUse).toMatch(/--debug/);
    expect(howToUse).toMatch(/implies --verbose/i);
    expect(howToUse).toMatch(/--json/);
    expect(howToUse).toMatch(/structured success output to stdout/i);
    expect(howToUse).toMatch(/diagnostics remain on stderr/i);
    expect(howToUse).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);

    expect(limits).toMatch(/Logs covers runtime logs and CLI diagnostics/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).toMatch(/not the metrics reference/i);
    expect(limits).toMatch(/not record\/replay artifact management/i);
    expect(limits).toMatch(/not FactoryEvent or session event-stream/i);
    expect(limits).toMatch(/not agent-run tool-diagnostics inspection/i);
    expect(limits).toMatch(/not the OpenAPI or API reference/i);
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
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(document.getElementById("what-it-covers")).toBeNull();
    expect(document.getElementById("key-concepts")).toBeNull();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();

    expect(document.body.textContent).toMatch(/~\/\.you-agent-factory\/logs/);

    const howToUseSection = document.getElementById("how-to-use");
    expect(howToUseSection).toBeTruthy();
    expect(howToUseSection?.textContent).toMatch(
      /~\/\.you-agent-factory\/logs/,
    );
    expect(howToUseSection?.textContent).toMatch(/--runtime-log-dir/);
    expect(howToUseSection?.textContent).toMatch(/--runtime-log-max-age-days/);
    expect(howToUseSection?.textContent).toMatch(/default 30/);
    expect(howToUseSection?.textContent).toMatch(/--runtime-log-max-backups/);
    expect(howToUseSection?.textContent).toMatch(/default 20/);
    expect(howToUseSection?.textContent).toMatch(/--runtime-log-max-size-mb/);
    expect(howToUseSection?.textContent).toMatch(/default 100/);
    expect(howToUseSection?.textContent).toMatch(/--runtime-log-compress/);
    expect(howToUseSection?.textContent).toMatch(
      /you run --dir \.\/factory --runtime-log-dir ~\/\.you-agent-factory\/logs/,
    );
    expect(howToUseSection?.textContent).toMatch(/--verbose/);
    expect(howToUseSection?.textContent).toMatch(
      /concise command diagnostics to stderr/i,
    );
    expect(howToUseSection?.textContent).toMatch(/--debug/);
    expect(howToUseSection?.textContent).toMatch(/implies --verbose/i);
    expect(howToUseSection?.textContent).toMatch(/--json/);
    expect(howToUseSection?.textContent).toMatch(
      /diagnostics remain on stderr/i,
    );
    expect(howToUseSection?.textContent).toMatch(
      /you run --dir \.\/factory --verbose/,
    );
    expect(howToUseSection?.textContent).toMatch(
      /System logs include command stdout and stderr only on command failures/i,
    );
    expect(howToUseSection?.textContent).toMatch(
      /Environment details are record-channel diagnostics only/i,
    );
    expect(howToUseSection?.textContent).toMatch(
      /structured JSON rolling files/i,
    );
    expect(howToUseSection?.textContent).toMatch(/UTC start date/i);
    expect(howToUseSection?.textContent).toMatch(/metrics files/i);
    expect(howToUseSection?.textContent).toMatch(/structured JSONL/i);

    const limitsSection = document.getElementById("limits-and-assumptions");
    expect(limitsSection?.textContent).toMatch(
      /Logs covers runtime logs and CLI diagnostics/i,
    );
    expect(limitsSection?.textContent).toMatch(
      /not a sync of packaged CLI docs/i,
    );
    expect(limitsSection?.textContent).toMatch(/not the metrics reference/i);
    expect(limitsSection?.textContent).toMatch(
      /not record\/replay artifact management/i,
    );
    expect(limitsSection?.textContent).toMatch(
      /not FactoryEvent or session event-stream/i,
    );
    expect(limitsSection?.textContent).toMatch(
      /not agent-run tool-diagnostics inspection/i,
    );
    expect(limitsSection?.textContent).toMatch(
      /not the OpenAPI or API reference/i,
    );
  });

  test("loads ja locale messages with the same section structure", async () => {
    const loadedPage = await loadLocalDocsPage(
      {
        section: "documentation",
        slug: "logs",
      },
      "ja",
    );

    expect(loadedPage.messages.title).toBe("Logs");
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse?.title).toBe("How To Use");
    expect(loadedPage.messages.sections?.limitsAndAssumptions?.title).toBe(
      "Limits And Assumptions",
    );
    expect(String(loadedPage.messages.openingSummary ?? "")).toMatch(
      /structured JSON rolling files/i,
    );
    expect(String(loadedPage.messages.links?.defaultPathValue ?? "")).toBe(
      "~/.you-agent-factory/logs",
    );
    expect(String(loadedPage.messages.links?.exampleCommand ?? "")).toMatch(
      /you run --dir \.\/factory --runtime-log-dir ~\/\.you-agent-factory\/logs/,
    );
    expect(
      String(loadedPage.messages.links?.diagnosticsExampleCommand ?? ""),
    ).toMatch(/you run --dir \.\/factory --verbose/);

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
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(document.body.textContent).toMatch(/~\/\.you-agent-factory\/logs/);
    expect(document.body.textContent).toMatch(/--runtime-log-dir/);
    expect(document.body.textContent).toMatch(/--verbose/);
  });
});
