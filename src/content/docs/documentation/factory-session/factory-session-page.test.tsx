/**
 * Page-owned render proof for documentation/factory-session.
 * Covers documentation shell, Factory Session identity, discovery/inspect,
 * lifecycle pause/resume, and durable JavaScript validate → start →
 * status/result guidance — not route inventories or shared helper contracts.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("factory-session documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/factory-session as a documentation page", async () => {
    const fumadocsPage = source.getPage(["documentation", "factory-session"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/factory-session");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "factory-session",
    });

    expect(loadedPage.messages.title).toBe("Factory Session");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/Factory Session/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const sessionList = String(
      loadedPage.messages.sections?.sessionList?.body ?? "",
    );
    const sessionShow = String(
      loadedPage.messages.sections?.sessionShow?.body ?? "",
    );
    const lifecycle = String(
      loadedPage.messages.sections?.lifecycle?.body ?? "",
    );
    const durableJavascriptSession = String(
      loadedPage.messages.sections?.durableJavascriptSession?.body ?? "",
    );
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );
    expect(whatItCovers).toMatch(/Factory Session/i);
    expect(whatItCovers).toMatch(/live session/i);
    expect(keyConcepts).toMatch(/live runtime unit/i);
    expect(keyConcepts).toMatch(/Session list confirms/i);
    expect(howToUse).toMatch(/session list/i);
    expect(sessionList).toMatch(/liveness check/i);
    expect(sessionList).toMatch(/empty list|connection failure/i);
    expect(sessionShow).toMatch(/owns its own runtime state/i);
    expect(sessionShow).toMatch(/target the intended session/i);
    expect(lifecycle).toMatch(/Pause and resume/i);
    expect(lifecycle).toMatch(/re-reading session status/i);
    expect(durableJavascriptSession).toMatch(/Durable JavaScript runs/i);
    expect(durableJavascriptSession).toMatch(/Dynamic workflow is shorthand/i);
    expect(durableJavascriptSession).toMatch(
      /Dispatch, FactoryArtifact, and FactoryEvent/i,
    );
    expect(limits).toMatch(/web Factory Session reference/i);
    expect(limits).toMatch(/not a full CLI flag dump/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(keyConcepts).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(howToUse).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);

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
      screen.getByRole("heading", { name: "Discover Sessions" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Inspect A Session" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Pause And Resume" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Durable JavaScript Session" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    const whatItCoversSection = document.getElementById("what-it-covers");
    const keyConceptsSection = document.getElementById("key-concepts");
    const howToUseSection = document.getElementById("how-to-use");
    const sessionListSection = document.getElementById("session-list");
    const sessionShowSection = document.getElementById("session-show");
    const lifecycleSection = document.getElementById("lifecycle");
    const durableSection = document.getElementById(
      "durable-javascript-session",
    );
    const limitsSection = document.getElementById("limits-and-assumptions");
    expect(whatItCoversSection).toBeTruthy();
    expect(keyConceptsSection).toBeTruthy();
    expect(howToUseSection).toBeTruthy();
    expect(sessionListSection).toBeTruthy();
    expect(sessionShowSection).toBeTruthy();
    expect(lifecycleSection).toBeTruthy();
    expect(durableSection).toBeTruthy();
    expect(limitsSection).toBeTruthy();
    expect(whatItCoversSection?.textContent).toMatch(/Factory Session/i);
    expect(keyConceptsSection?.textContent).toMatch(/live runtime unit/i);
    expect(howToUseSection?.textContent).toMatch(/session list/i);
    expect(sessionListSection?.textContent).toMatch(/you session list/);
    expect(sessionListSection?.textContent).toMatch(
      /empty|unreachable|no live session is accepting work/i,
    );
    expect(sessionShowSection?.textContent).toMatch(
      /you session show <session-id>/,
    );
    expect(sessionShowSection?.textContent).toMatch(
      /owns its own runtime state/i,
    );
    expect(sessionShowSection?.textContent).toMatch(
      /target the intended session/i,
    );
    expect(lifecycleSection?.textContent).toMatch(
      /you session pause <session-id>/,
    );
    expect(lifecycleSection?.textContent).toMatch(
      /you session resume <session-id>/,
    );
    expect(lifecycleSection?.textContent).toMatch(
      /confirm the outcome|re-reading session status|you session show/i,
    );
    expect(durableSection?.textContent).toMatch(/you workflow validate/);
    expect(durableSection?.textContent).toMatch(/you workflow start/);
    expect(durableSection?.textContent).toMatch(/you workflow status/);
    expect(durableSection?.textContent).toMatch(/you workflow result/);
    expect(durableSection?.textContent).toMatch(
      /Dispatch, FactoryArtifact, and FactoryEvent/i,
    );
    expect(durableSection?.textContent).toMatch(
      /Dynamic workflow is shorthand/i,
    );
    expect(limitsSection?.textContent).toMatch(
      /web Factory Session reference/i,
    );
  });
});
