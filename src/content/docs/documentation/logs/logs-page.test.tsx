/**
 * Page-owned render proof for documentation/logs.
 * Covers documentation shell, Logs identity, runtime-log channel
 * framing, retention/rotation controls, CLI diagnostics policy,
 * channel boundaries, and sibling discovery — not route inventories
 * or shared helper contracts.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
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

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(whatItCovers).toMatch(/runtime logs/i);
    expect(whatItCovers).toMatch(/CLI diagnostics/i);
    expect(whatItCovers).toMatch(/UTC-date grouping/i);
    expect(whatItCovers).toMatch(/Runtime metrics/i);
    expect(keyConcepts).toMatch(/structured JSON rolling files/i);
    expect(keyConcepts).toMatch(/UTC start date/i);
    expect(keyConcepts).toMatch(/~\/\.you-agent-factory\/logs/);
    expect(keyConcepts).toMatch(/Runtime metrics/i);
    expect(keyConcepts).toMatch(/structured JSONL/i);
    expect(keyConcepts).toMatch(/--verbose/);
    expect(keyConcepts).toMatch(/concise command diagnostics to stderr/i);
    expect(keyConcepts).toMatch(/--debug/);
    expect(keyConcepts).toMatch(/implies --verbose/i);
    expect(keyConcepts).toMatch(/--json/);
    expect(keyConcepts).toMatch(/structured success output to stdout/i);
    expect(keyConcepts).toMatch(/diagnostics remain on stderr/i);
    expect(keyConcepts).toMatch(
      /System logs include command stdout and stderr only on command failures/i,
    );
    expect(keyConcepts).toMatch(
      /Environment details are record-channel diagnostics only/i,
    );
    expect(howToUse).toMatch(/log root/i);
    expect(howToUse).toMatch(/retention and rotation/i);
    expect(howToUse).toMatch(/CLI diagnostics/i);
    expect(limits).toMatch(/web runtime-logs and CLI-diagnostics reference/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).toMatch(/not the metrics reference/i);
    expect(limits).toMatch(/not record\/replay artifact management/i);
    expect(limits).toMatch(/not FactoryEvent or session event-stream/i);
    expect(limits).toMatch(/not agent-run tool-diagnostics inspection/i);
    expect(limits).toMatch(/not the OpenAPI or API reference/i);
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
        <ModulePageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          {loadedPage.content}
        </ModulePageProviders>
      </main>,
    );

    expect(
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Key Concepts" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    expect(document.body.textContent).toMatch(/Logs is the web reference/i);
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

    const keyConceptsSection = document.getElementById("key-concepts");
    expect(keyConceptsSection?.textContent).toMatch(
      /structured JSON rolling files/i,
    );
    expect(keyConceptsSection?.textContent).toMatch(/UTC start date/i);
    expect(keyConceptsSection?.textContent).toMatch(/Runtime metrics/i);
    expect(keyConceptsSection?.textContent).toMatch(/structured JSONL/i);
    expect(keyConceptsSection?.textContent).toMatch(/--verbose/);
    expect(keyConceptsSection?.textContent).toMatch(/--debug/);
    expect(keyConceptsSection?.textContent).toMatch(/--json/);

    const limitsSection = document.getElementById("limits-and-assumptions");
    expect(limitsSection?.textContent).toMatch(
      /web runtime-logs and CLI-diagnostics reference/i,
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

    const relatedSection = document.getElementById("related");
    expect(relatedSection).toBeTruthy();
    const relatedQueries = within(relatedSection as HTMLElement);
    expect(
      relatedQueries
        .getByRole("link", { name: "CLI docs" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/cli");
    expect(
      relatedQueries
        .getByRole("link", { name: "Factory Session" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/factory-session");
    expect(
      relatedQueries
        .getByRole("link", { name: "Replays / Records" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/replays-records");
  });
});
