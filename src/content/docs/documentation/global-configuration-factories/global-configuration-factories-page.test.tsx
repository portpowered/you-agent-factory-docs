/**
 * Page-owned render proof for documentation/global-configuration-factories.
 * Covers documentation shell and operator-defaults / named-factories identity.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("global-configuration-factories documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/global-configuration-factories as a documentation page", async () => {
    const fumadocsPage = source.getPage([
      "documentation",
      "global-configuration-factories",
    ]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe(
      "/docs/documentation/global-configuration-factories",
    );

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "global-configuration-factories",
    });

    expect(loadedPage.messages.title).toBe("Global Configuration Factories");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/operator model defaults/i);
    expect(loadedPage.messages.description).toMatch(
      /global \/ named factories/i,
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).not.toMatch(
      /factory\.json topology/i,
    );

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const operatorDefaults = String(
      loadedPage.messages.sections?.operatorModelDefaults?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );
    const precedence = String(
      loadedPage.messages.callouts?.precedence?.body ?? "",
    );
    const runnerDistinction = String(
      loadedPage.messages.callouts?.runnerDistinction?.body ?? "",
    );
    const configNotes = String(
      loadedPage.messages.callouts?.configFileNotes?.body ?? "",
    );

    expect(whatItCovers).toMatch(/operator model defaults/i);
    expect(whatItCovers).toMatch(/global \/ named factories/i);
    expect(whatItCovers).toMatch(/~\/\.you-agent-factory\/config\.json/);
    expect(whatItCovers).toMatch(/~\/\.you-agent-factory\/factories/);
    expect(keyConcepts).toMatch(/INFERENCE_WORKER|AGENT_WORKER/);
    expect(keyConcepts).toMatch(/in memory/i);
    expect(keyConcepts).toMatch(/never overwritten/i);
    expect(keyConcepts).toMatch(/you run --named/);
    expect(operatorDefaults).toMatch(/INFERENCE_WORKER|AGENT_WORKER/);
    expect(operatorDefaults).toMatch(/omit modelProvider or model/i);
    expect(operatorDefaults).toMatch(/in memory/i);
    expect(operatorDefaults).toMatch(/does not persist/i);
    expect(howToUse).toMatch(/YOU_DEFAULT_WORKER_MODEL_PROVIDER/);
    expect(howToUse).toMatch(/--default-worker-model-provider/);
    expect(howToUse).toMatch(/file, then env, then flag/i);
    expect(howToUse).toMatch(/you factory list/);
    expect(howToUse).toMatch(/you run --named/);
    expect(precedence).toMatch(/independent per field/i);
    expect(runnerDistinction).toMatch(/factory-level runner/i);
    expect(runnerDistinction).toMatch(/do not rewrite/i);
    expect(configNotes).toMatch(/missing config file is valid/i);
    expect(configNotes).toMatch(/Malformed JSON fails/i);
    expect(limits).toMatch(
      /web operator-defaults and global \/ named-factories reference/i,
    );
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).toMatch(/not the factory\.json topology overview/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(keyConcepts).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(operatorDefaults).not.toMatch(
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
    expect(
      screen.getByRole("heading", { name: "Operator Model Defaults" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    const whatItCoversSection = document.getElementById("what-it-covers");
    const keyConceptsSection = document.getElementById("key-concepts");
    const operatorDefaultsSection = document.getElementById(
      "operator-model-defaults",
    );
    const howToUseSection = document.getElementById("how-to-use");
    const limitsSection = document.getElementById("limits-and-assumptions");
    expect(whatItCoversSection).toBeTruthy();
    expect(keyConceptsSection).toBeTruthy();
    expect(operatorDefaultsSection).toBeTruthy();
    expect(howToUseSection).toBeTruthy();
    expect(limitsSection).toBeTruthy();
    expect(whatItCoversSection?.textContent).toMatch(
      /operator model defaults/i,
    );
    expect(whatItCoversSection?.textContent).toMatch(
      /global \/ named factories/i,
    );
    expect(keyConceptsSection?.textContent).toMatch(/Named factories/i);
    expect(operatorDefaultsSection?.textContent).toMatch(
      /~\/\.you-agent-factory\/config\.json/,
    );
    expect(operatorDefaultsSection?.textContent).toMatch(/workerModelProvider/);
    expect(operatorDefaultsSection?.textContent).toMatch(/workerModel/);
    expect(operatorDefaultsSection?.textContent).toMatch(
      /YOU_DEFAULT_WORKER_MODEL_PROVIDER/,
    );
    expect(operatorDefaultsSection?.textContent).toMatch(
      /YOU_DEFAULT_WORKER_MODEL/,
    );
    expect(operatorDefaultsSection?.textContent).toMatch(
      /--default-worker-model-provider/,
    );
    expect(operatorDefaultsSection?.textContent).toMatch(
      /--default-worker-model/,
    );
    expect(operatorDefaultsSection?.textContent).toMatch(/file < env < flag/);
    expect(operatorDefaultsSection?.textContent).toMatch(
      /factory-level runner/i,
    );
    expect(howToUseSection?.textContent).toMatch(/you factory list/);
    expect(limitsSection?.textContent).toMatch(
      /not the factory\.json topology overview/i,
    );
  });
});
