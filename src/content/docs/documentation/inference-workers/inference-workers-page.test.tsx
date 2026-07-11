/**
 * Page-owned render proof for documentation/inference-workers.
 * Covers INFERENCE_RUN operations teaching, LOCAL/CLOUD ownership examples,
 * declared-operations validation, failure/security cautions, and sibling
 * discovery — not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("inference-workers documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes Inference workers teaching for operations, locality, and cautions", async () => {
    const fumadocsPage = source.getPage(["documentation", "inference-workers"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/inference-workers");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "inference-workers",
    });

    expect(loadedPage.messages.title).toBe("Inference workers");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/INFERENCE_WORKER/i);
    expect(loadedPage.messages.description).toMatch(/INFERENCE_RUN/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const declaredOperations = String(
      loadedPage.messages.sections?.declaredOperations?.body ?? "",
    );
    const failureAndSecurity = String(
      loadedPage.messages.sections?.failureAndSecurity?.body ?? "",
    );
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(whatItCovers).toMatch(/INFERENCE_WORKER/i);
    expect(whatItCovers).toMatch(/INFERENCE_RUN/i);
    expect(whatItCovers).toMatch(/TTS|ASR/i);
    expect(keyConcepts).toMatch(/one bounded model operation/i);
    expect(keyConcepts).toMatch(/not AGENT_WORKER/i);
    expect(keyConcepts).toMatch(/agentTools\.policy/i);
    expect(howToUse).toMatch(/model, modelProvider, and modelLocality/i);
    expect(howToUse).toMatch(/Declare operations/i);
    expect(declaredOperations).toMatch(/provider-agnostic capability/i);
    expect(declaredOperations).toMatch(/LOCAL to CLOUD/i);
    expect(failureAndSecurity).toMatch(/Keep secrets out of worker bodies/i);
    expect(failureAndSecurity).toMatch(
      /Do not treat inference workers as a substitute for AGENT_WORKER/i,
    );
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).toMatch(/not the Agent workers full contract/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(keyConcepts).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
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
    expect(screen.getByRole("heading", { name: "Key Concepts" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Declared Operations" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Failure And Security Cautions" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();

    const howToUseSection = document.getElementById("how-to-use");
    expect(howToUseSection).toBeTruthy();
    expect(howToUseSection?.textContent).toMatch(/type: INFERENCE_WORKER/);
    expect(howToUseSection?.textContent).toMatch(/modelLocality: LOCAL/);
    expect(howToUseSection?.textContent).toMatch(/modelLocality: CLOUD/);
    expect(howToUseSection?.textContent).toMatch(/name: TTS/);
    expect(howToUseSection?.textContent).toMatch(
      /modelLocality is LOCAL or CLOUD/,
    );

    const declaredSection = document.getElementById("declared-operations");
    expect(declaredSection).toBeTruthy();
    expect(declaredSection?.textContent).toMatch(/Duplicate operation names/i);
    expect(declaredSection?.textContent).toMatch(
      /not a substitute for AGENT_WORKER agent loops/i,
    );

    const failureSection = document.getElementById("failure-and-security");
    expect(failureSection).toBeTruthy();
    expect(failureSection?.textContent).toMatch(/Validation failures/i);
    expect(failureSection?.textContent).toMatch(/Locality and capacity/i);
    expect(failureSection?.textContent).toMatch(/Secrets in worker bodies/i);
    expect(failureSection?.textContent).toMatch(/Agent-loop substitution/i);

    const relatedSection = document.getElementById("related");
    expect(relatedSection).toBeTruthy();
    const relatedQueries = within(relatedSection as HTMLElement);
    expect(
      relatedQueries
        .getByRole("link", { name: "Workers" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/workers");
    expect(
      relatedQueries
        .getByRole("link", { name: "Workstations" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/workstations");
    expect(
      relatedQueries
        .getByRole("link", { name: "Resources" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/resources");
    expect(
      relatedQueries.getByRole("link", { name: "Tokens" }).getAttribute("href"),
    ).toBe("/docs/concepts/tokens");
    expect(
      relatedQueries
        .getByRole("link", { name: "Tool calling" })
        .getAttribute("href"),
    ).toBe("/docs/concepts/tool-calling");
    expect(
      relatedQueries.getByRole("link", { name: "Logs" }).getAttribute("href"),
    ).toBe("/docs/documentation/logs");
    expect(
      relatedQueries
        .getByRole("link", { name: "Troubleshooting" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/troubleshooting");
    expect(
      relatedQueries
        .getByRole("link", { name: "Agent workers" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/agent-workers");
  });
});
