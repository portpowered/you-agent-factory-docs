/**
 * Page-owned render proof for documentation/script-workers.
 * Covers documentation shell, Script workers identity, ownership teaching,
 * execution contract, and minimal SCRIPT_WORKER example — not route
 * inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("script-workers documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/script-workers with ownership and example teaching", async () => {
    const fumadocsPage = source.getPage(["documentation", "script-workers"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/script-workers");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "script-workers",
    });

    expect(loadedPage.messages.title).toBe("Script workers");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/SCRIPT_WORKER/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

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
    const ownershipWorker = String(
      loadedPage.messages.links?.ownershipWorkerFields ?? "",
    );
    const ownershipWorkstation = String(
      loadedPage.messages.links?.ownershipWorkstationFields ?? "",
    );
    const executionContract = String(
      loadedPage.messages.links?.executionContractBody ?? "",
    );
    const minimalExample = String(
      loadedPage.messages.links?.minimalScriptExample ?? "",
    );

    expect(whatItCovers).toMatch(/SCRIPT_WORKER/i);
    expect(whatItCovers).toMatch(/command and args/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(keyConcepts).toMatch(/SCRIPT_WORKER/i);
    expect(keyConcepts).toMatch(/factory\.json/i);
    expect(keyConcepts).toMatch(/workers\/<name>\/AGENTS\.md/i);
    expect(keyConcepts).toMatch(/SCRIPT_RUN/i);
    expect(keyConcepts).toMatch(/descriptive only/i);
    expect(keyConcepts).toMatch(/command and args/i);
    expect(keyConcepts).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(howToUse).toMatch(/SCRIPT_WORKER/i);
    expect(howToUse).toMatch(/SCRIPT_RUN/i);
    expect(howToUse).toMatch(/command/i);
    expect(howToUse).toMatch(/copyReferencedScripts/i);
    expect(howToUse).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);
    expect(ownershipWorker).toMatch(/command/i);
    expect(ownershipWorker).toMatch(/args/i);
    expect(ownershipWorker).toMatch(/timeout/i);
    expect(ownershipWorkstation).toMatch(/SCRIPT_RUN/i);
    expect(ownershipWorkstation).toMatch(/outputs/i);
    expect(ownershipWorkstation).toMatch(/onFailure/i);
    expect(ownershipWorkstation).toMatch(/workingDirectory/i);
    expect(ownershipWorkstation).toMatch(/copyReferencedScripts/i);
    expect(executionContract).toMatch(/descriptive only/i);
    expect(executionContract).toMatch(/not executed/i);
    expect(executionContract).toMatch(/command/i);
    expect(executionContract).toMatch(/args/i);
    expect(executionContract).toMatch(/Go template/i);
    expect(minimalExample).toMatch(/SCRIPT_WORKER/);
    expect(minimalExample).toMatch(/command:\s*go/);
    expect(minimalExample).toMatch(/args:/);
    expect(minimalExample).toMatch(/timeout:\s*10m/);
    expect(limits).toMatch(/Operator model defaults never apply/i);
    expect(limits).toMatch(/Absolute script paths/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).toMatch(/not the Workers taxonomy overview/i);
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
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    const body = document.body.textContent ?? "";
    expect(body).toMatch(/SCRIPT_WORKER/i);
    expect(body).toMatch(/command-backed/i);
    expect(body).toMatch(/Put it on the worker/i);
    expect(body).toMatch(/Put it on the workstation/i);
    expect(body).toMatch(/descriptive only/i);
    expect(body).toMatch(/not executed/i);
    expect(body).toMatch(/command:\s*go/);
    expect(body).toMatch(/Runs the Go test suite/);
    expect(body).toMatch(/Operator model defaults never apply/i);

    const workersLink = screen.getByRole("link", { name: "Workers" });
    expect(workersLink.getAttribute("href")).toBe(
      "/docs/documentation/workers",
    );
    expect(
      screen.getByRole("link", { name: "Workstations" }).getAttribute("href"),
    ).toBe("/docs/documentation/workstations");
    expect(
      screen
        .getByRole("link", { name: "Submitting work" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/submitting-work");
    expect(
      screen.getByRole("link", { name: "Logs" }).getAttribute("href"),
    ).toBe("/docs/documentation/logs");
    expect(
      screen
        .getByRole("link", { name: "Troubleshooting" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/troubleshooting");
    expect(
      screen.getByRole("link", { name: "Poller workers" }).getAttribute("href"),
    ).toBe("/docs/documentation/poller-workers");
  });

  test("ships ja locale messages with the same key shape as en", async () => {
    const loadedPage = await loadLocalDocsPage(
      {
        section: "documentation",
        slug: "script-workers",
      },
      "ja",
    );

    expect(loadedPage.messages.title).toBe("Script workers");
    expect(loadedPage.messages.sections?.whatItCovers?.title).toBeTruthy();
    expect(loadedPage.messages.sections?.keyConcepts?.title).toBeTruthy();
    expect(loadedPage.messages.sections?.howToUse?.title).toBeTruthy();
    expect(
      loadedPage.messages.sections?.limitsAndAssumptions?.title,
    ).toBeTruthy();
    expect(loadedPage.messages.sections?.related?.title).toBeTruthy();
    expect(loadedPage.messages.links?.workersDocs).toBe("Workers");
    expect(loadedPage.messages.links?.pollerWorkersDocs).toBe("Poller workers");

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
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Workers" }).getAttribute("href"),
    ).toBe("/docs/documentation/workers");
  });
});
