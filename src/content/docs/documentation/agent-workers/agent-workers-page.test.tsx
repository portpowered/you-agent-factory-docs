/**
 * Page-owned render proof for documentation/agent-workers.
 * Covers AGENT_RUN loop vs inference distinction, agentTools.policy teaching,
 * minimal AGENT_WORKER example, failure/security cautions, and sibling
 * discovery — not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("agent-workers documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes Agent workers teaching for loop, tool policy, and failure recovery", async () => {
    const fumadocsPage = source.getPage(["documentation", "agent-workers"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/agent-workers");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "agent-workers",
    });

    expect(loadedPage.messages.title).toBe("Agent workers");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/AGENT_WORKER/i);
    expect(loadedPage.messages.description).toMatch(/agentTools\.policy/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const toolPolicy = String(
      loadedPage.messages.sections?.toolPolicy?.body ?? "",
    );
    const failureAndSecurity = String(
      loadedPage.messages.sections?.failureAndSecurity?.body ?? "",
    );
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(whatItCovers).toMatch(/AGENT_WORKER/i);
    expect(whatItCovers).toMatch(/AGENT_RUN/i);
    expect(whatItCovers).toMatch(/agentTools\.policy/i);
    expect(keyConcepts).toMatch(/one agent loop per dispatch/i);
    expect(keyConcepts).toMatch(/not INFERENCE_WORKER/i);
    expect(keyConcepts).toMatch(/do not declare operations/i);
    expect(howToUse).toMatch(/model and modelProvider/i);
    expect(howToUse).toMatch(
      /Runner selection is separate from modelProvider/i,
    );
    expect(toolPolicy).toMatch(/disabled unless/i);
    expect(toolPolicy).toMatch(/agentTools is valid only on AGENT_WORKER/i);
    expect(failureAndSecurity).toMatch(/failure_class/i);
    expect(failureAndSecurity).toMatch(
      /Do not treat INFERENCE_WORKER or operations as an agent-loop substitute/i,
    );
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).toMatch(/not the Inference workers full contract/i);
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
      screen.getByRole("heading", { name: "Explicit Tool Policy" }),
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
    expect(howToUseSection?.textContent).toMatch(/type: AGENT_WORKER/);
    expect(howToUseSection?.textContent).toMatch(/model: gpt-5-codex/);
    expect(howToUseSection?.textContent).toMatch(/modelProvider: CODEX/);

    const toolPolicySection = document.getElementById("tool-policy");
    expect(toolPolicySection).toBeTruthy();
    expect(toolPolicySection?.textContent).toMatch(/DISABLED/);
    expect(toolPolicySection?.textContent).toMatch(/READ_ONLY/);
    expect(toolPolicySection?.textContent).toMatch(/ENABLED/);
    expect(toolPolicySection?.textContent).toMatch(/tool_diagnostics/);
    expect(toolPolicySection?.textContent).toMatch(
      /do not expose raw process output/i,
    );

    const failureSection = document.getElementById("failure-and-security");
    expect(failureSection).toBeTruthy();
    expect(failureSection?.textContent).toMatch(/agent_run_lease_denied/);
    expect(failureSection?.textContent).toMatch(
      /agent_run_tool_policy_violation/,
    );
    expect(failureSection?.textContent).toMatch(/agent_run_harness_failure/);
    expect(failureSection?.textContent).toMatch(/agent_run_timeout/);
    expect(failureSection?.textContent).toMatch(/agent_run_canceled/);
    expect(failureSection?.textContent).toMatch(
      /Do not treat INFERENCE_WORKER or operations as a substitute/i,
    );

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
        .getByRole("link", { name: "Inference workers" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/inference-workers");
  });
});
