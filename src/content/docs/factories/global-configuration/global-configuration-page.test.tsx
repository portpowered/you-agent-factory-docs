/**
 * Page-owned render proof for factories/global-configuration.
 * Covers documentation shell, operator/named-factory teaching, live You-config
 * and Factory schema embeds via W07 SchemaReference, and full-reference lookup
 * links. Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this factories documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("factories/global-configuration documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/factories/global-configuration with live You-config and Factory schema embeds", async () => {
    const fumadocsPage = source.getPage(["factories", "global-configuration"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/factories/global-configuration");

    const loadedPage = await loadLocalDocsPage({
      section: "factories",
      slug: "global-configuration",
    });

    expect(loadedPage.frontmatter.registryId).toBe(
      "documentation.factories-global-configuration",
    );
    expect(loadedPage.frontmatter.kind).toBe("documentation");
    expect(loadedPage.messages.title).toBe("Global Configuration");
    expect(loadedPage.messages.description).toMatch(/operator model defaults/i);
    expect(loadedPage.messages.description).toMatch(/named factories/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const youConfigSchema = String(
      loadedPage.messages.sections?.youConfigSchema?.body ?? "",
    );
    const namedFactories = String(
      loadedPage.messages.sections?.namedFactories?.body ?? "",
    );
    const factoryRunnerSchema = String(
      loadedPage.messages.sections?.factoryRunnerSchema?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(whatItCovers).toMatch(/operator model defaults/i);
    expect(whatItCovers).toMatch(/named factories/i);
    expect(keyConcepts).toMatch(/INFERENCE_WORKER/i);
    expect(keyConcepts).toMatch(/~\/\.you-agent-factory\/factories/);
    expect(youConfigSchema).toMatch(/you-config/i);
    expect(youConfigSchema).toMatch(/exhaustive/i);
    expect(namedFactories).toMatch(/you run --named/i);
    expect(factoryRunnerSchema).toMatch(/runner/i);
    expect(factoryRunnerSchema).toMatch(/operator defaults/i);
    expect(howToUse).toMatch(/config\.json/i);
    expect(limits).toMatch(/not a sync of packaged CLI/i);
    expect(limits).toMatch(/schema and API reference/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(keyConcepts).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(youConfigSchema).not.toMatch(
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
    expect(
      screen.getByRole("heading", { name: "Operator Model Defaults" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "You Configuration Schema" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Named Factories" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Factory Name Contract" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Factory Runner Versus Operator Defaults",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();

    const youConfigEmbed = screen.getByTestId(
      "factories-global-configuration-you-config-schema",
    );
    expect(youConfigEmbed).toBeTruthy();
    expect(youConfigEmbed.getAttribute("data-schema-status")).toBe("ready");
    expect(
      youConfigEmbed.querySelector('[data-schema-field-path="defaults"]'),
    ).toBeTruthy();
    expect(
      youConfigEmbed.querySelector('[data-schema-field-path="workerPresets"]'),
    ).toBeTruthy();

    const factoryNameEmbed = screen.getByTestId(
      "factories-global-configuration-factory-name-schema",
    );
    expect(factoryNameEmbed).toBeTruthy();
    expect(factoryNameEmbed.getAttribute("data-schema-status")).toBe("ready");
    expect(
      factoryNameEmbed.querySelector(
        '[data-schema-reference-mode="addressed"]',
      ),
    ).toBeTruthy();
    expect(
      factoryNameEmbed.querySelector(
        '[data-schema-reference-pointer="/$defs/FactoryName"]',
      ),
    ).toBeTruthy();

    const runnerEmbed = screen.getByTestId(
      "factories-global-configuration-runner-id-schema",
    );
    expect(runnerEmbed).toBeTruthy();
    expect(runnerEmbed.getAttribute("data-schema-status")).toBe("ready");
    expect(
      runnerEmbed.querySelector('[data-schema-reference-mode="addressed"]'),
    ).toBeTruthy();
    expect(
      runnerEmbed.querySelector(
        '[data-schema-reference-pointer="/$defs/RunnerID"]',
      ),
    ).toBeTruthy();

    expect(
      screen
        .getByRole("link", { name: "Full You-config schema" })
        .getAttribute("href"),
    ).toBe("/docs/references/schema");
    expect(
      screen
        .getByRole("link", { name: "Full Factory schema" })
        .getAttribute("href"),
    ).toBe("/docs/references/schema");
    expect(
      screen
        .getByRole("link", { name: "Factory API reference" })
        .getAttribute("href"),
    ).toBe("/docs/references/api");

    expect(
      screen
        .getByRole("link", { name: "Configuration (factory.json topology)" })
        .getAttribute("href"),
    ).toBe("/docs/factories/configuration");
    expect(screen.getByRole("link", { name: "CLI" }).getAttribute("href")).toBe(
      "/docs/documentation/cli",
    );
    expect(
      screen.getByRole("link", { name: "Workers" }).getAttribute("href"),
    ).toBe("/docs/documentation/workers");
  });
});
