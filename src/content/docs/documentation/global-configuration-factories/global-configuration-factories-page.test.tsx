/**
 * Page-owned render proof for documentation/global-configuration-factories.
 * Covers documentation shell and operator-defaults / named-factories identity.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("global-configuration-factories documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/documentation/global-configuration-factories as a documentation page",
    async () => {
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
      expect(loadedPage.messages.description).toMatch(
        /operator model defaults/i,
      );
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
      const namedFactories = String(
        loadedPage.messages.sections?.namedFactories?.body ?? "",
      );
      const howToUse = String(
        loadedPage.messages.sections?.howToUse?.body ?? "",
      );
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
      const namedResolution = String(
        loadedPage.messages.callouts?.namedResolution?.body ?? "",
      );
      const oneRootListing = String(
        loadedPage.messages.callouts?.oneRootListing?.body ?? "",
      );
      const builtInMaterialization = String(
        loadedPage.messages.callouts?.builtInMaterialization?.body ?? "",
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
      expect(namedFactories).toMatch(/~\/\.you-agent-factory\/factories/);
      expect(namedFactories).toMatch(/\.\/factory/);
      expect(namedFactories).toMatch(/you run --named/);
      expect(namedFactories).toMatch(/project-local first/i);
      expect(namedFactories).toMatch(/never merge/i);
      expect(namedResolution).toMatch(/you run --named/);
      expect(oneRootListing).toMatch(/exactly one root/i);
      expect(oneRootListing).toMatch(/never merges/i);
      expect(builtInMaterialization).toMatch(/@you\/goal/);
      expect(builtInMaterialization).toMatch(/@you\/fusion/);
      expect(builtInMaterialization).toMatch(/@you\/tts/);
      expect(builtInMaterialization).toMatch(/materialize/i);
      expect(builtInMaterialization).toMatch(/editable on disk/i);
      expect(howToUse).toMatch(/YOU_DEFAULT_WORKER_MODEL_PROVIDER/);
      expect(howToUse).toMatch(/--default-worker-model-provider/);
      expect(howToUse).toMatch(/file, then env, then flag/i);
      expect(howToUse).toMatch(/you run --named/);
      expect(howToUse).toMatch(/--dir/);
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
      expect(limits).toMatch(
        /not workers, workstations, or resources field dumps/i,
      );
      expect(limits).toMatch(/not packaged @you\/\* invocation deep dives/i);
      expect(limits).toMatch(/not factory-session/i);
      expect(limits).toMatch(/not submitting-work/i);
      expect(limits).toMatch(/missing config continues with no defaults/i);
      expect(limits).toMatch(/unsupported providers/i);
      expect(limits).toMatch(
        /DEFAULT without a concrete lower-precedence provider/i,
      );
      expect(
        String(loadedPage.messages.links?.failureMissingConfigBehavior ?? ""),
      ).toMatch(/no operator defaults/i);
      expect(
        String(loadedPage.messages.links?.failureMalformedConfigBehavior ?? ""),
      ).toMatch(/names the config path/i);
      expect(
        String(
          loadedPage.messages.links?.failureUnsupportedProviderBehavior ?? "",
        ),
      ).toMatch(/accepted provider/i);
      expect(
        String(
          loadedPage.messages.links?.failureDefaultWithoutProviderBehavior ??
            "",
        ),
      ).toMatch(/resolution guidance/i);
      expect(
        String(
          loadedPage.messages.links?.failureAuthoredWorkerFieldsBehavior ?? "",
        ),
      ).toMatch(/do not override authored values/i);
      expect(
        String(loadedPage.messages.links?.configurationDocs ?? ""),
      ).toMatch(/Configuration/i);
      expect(String(loadedPage.messages.links?.cliDocs ?? "")).toMatch(/CLI/i);
      expect(String(loadedPage.messages.links?.workersDocs ?? "")).toMatch(
        /Workers/i,
      );
      expect(whatItCovers).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(keyConcepts).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(operatorDefaults).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(namedFactories).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(howToUse).not.toMatch(
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
      expect(
        screen.getByRole("heading", { name: "Key Concepts" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Operator Model Defaults" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Named Factories" }),
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
      const namedFactoriesSection = document.getElementById("named-factories");
      const howToUseSection = document.getElementById("how-to-use");
      const limitsSection = document.getElementById("limits-and-assumptions");
      expect(whatItCoversSection).toBeTruthy();
      expect(keyConceptsSection).toBeTruthy();
      expect(operatorDefaultsSection).toBeTruthy();
      expect(namedFactoriesSection).toBeTruthy();
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
      expect(operatorDefaultsSection?.textContent).toMatch(
        /workerModelProvider/,
      );
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
      expect(namedFactoriesSection?.textContent).toMatch(
        /~\/\.you-agent-factory\/factories/,
      );
      expect(namedFactoriesSection?.textContent).toMatch(/\.\/factory/);
      expect(namedFactoriesSection?.textContent).toMatch(/project-local/);
      expect(namedFactoriesSection?.textContent).toMatch(/exactly one root/i);
      expect(namedFactoriesSection?.textContent).toMatch(/@you\/goal/);
      expect(namedFactoriesSection?.textContent).toMatch(/@you\/fusion/);
      expect(namedFactoriesSection?.textContent).toMatch(/@you\/tts/);
      expect(namedFactoriesSection?.textContent).toMatch(/materialize/i);
      expect(namedFactoriesSection?.textContent).toMatch(/editable on disk/i);
      expect(howToUseSection?.textContent).toMatch(/you factory list/);
      expect(howToUseSection?.textContent).toMatch(
        /you factory list --dir ~\/\.you-agent-factory\/factories/,
      );
      expect(howToUseSection?.textContent).toMatch(
        /you run --named @you\/goal/,
      );
      expect(howToUseSection?.textContent).toMatch(/you factory save staging/);
      expect(howToUseSection?.textContent).toMatch(
        /you factory update staging/,
      );
      expect(limitsSection?.textContent).toMatch(
        /not the factory\.json topology overview/i,
      );
      expect(limitsSection?.textContent).toMatch(/not factory-session/i);
      expect(limitsSection?.textContent).toMatch(/not submitting-work/i);
      expect(limitsSection?.textContent).toMatch(
        /Missing ~\/\.you-agent-factory\/config\.json/,
      );
      expect(limitsSection?.textContent).toMatch(
        /Startup continues with no operator defaults/i,
      );
      expect(limitsSection?.textContent).toMatch(/Malformed config JSON/i);
      expect(limitsSection?.textContent).toMatch(/names the config path/i);
      expect(limitsSection?.textContent).toMatch(
        /Unsupported workerModelProvider/i,
      );
      expect(limitsSection?.textContent).toMatch(/accepted provider summary/i);
      expect(limitsSection?.textContent).toMatch(
        /DEFAULT without a lower-precedence concrete provider/i,
      );
      expect(limitsSection?.textContent).toMatch(/resolution guidance/i);
      expect(limitsSection?.textContent).toMatch(
        /Authored worker modelProvider or model/i,
      );
      expect(limitsSection?.textContent).toMatch(
        /do not override authored values/i,
      );

      const relatedSection = document.getElementById("related");
      expect(relatedSection).toBeTruthy();
      const configurationLink = screen.getByRole("link", {
        name: /Configuration \(factory\.json topology\)/i,
      });
      const cliLink = screen.getByRole("link", { name: /^CLI$/i });
      expect(configurationLink.getAttribute("href")).toBe(
        "/docs/documentation/configuration",
      );
      expect(cliLink.getAttribute("href")).toBe("/docs/documentation/cli");
      expect(
        screen
          .getAllByRole("link", { name: /^Workers$/i })
          .some(
            (link) =>
              link.getAttribute("href") === "/docs/documentation/workers",
          ),
      ).toBe(true);
      expect(relatedSection?.contains(configurationLink)).toBe(true);
      expect(relatedSection?.contains(cliLink)).toBe(true);
      expect(
        relatedSection?.querySelector('a[href="/docs/documentation/workers"]'),
      ).toBeTruthy();
    },
    { timeout: 30_000 },
  );
});
