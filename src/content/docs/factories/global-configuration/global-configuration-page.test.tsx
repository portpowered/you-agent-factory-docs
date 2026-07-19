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
    expect(loadedPage.messages.openingSummary).toMatch(
      /operator-wide model defaults/i,
    );
    expect(loadedPage.messages.openingSummary).toMatch(/named factories/i);
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

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

    expect(youConfigSchema).toMatch(/you-config/i);
    expect(youConfigSchema).toMatch(/exhaustive/i);
    expect(namedFactories).toMatch(/you run --named/i);
    expect(factoryRunnerSchema).toMatch(/runner/i);
    expect(factoryRunnerSchema).toMatch(/operator defaults/i);
    expect(howToUse).toMatch(/config\.json/i);
    expect(limits).toMatch(/not a sync of packaged CLI/i);
    expect(limits).toMatch(/schema and API reference/i);
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
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(document.getElementById("what-it-covers")).toBeNull();
    expect(document.getElementById("key-concepts")).toBeNull();
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
        .getByRole("link", { name: "Full System config schema" })
        .getAttribute("href"),
    ).toBe("/docs/references/system-config-schema");
    expect(
      screen
        .getAllByRole("link", { name: "Full Factory schema" })[0]
        ?.getAttribute("href"),
    ).toBe("/docs/references/schema");
    expect(
      screen
        .getAllByRole("link", { name: "Factory API reference" })[0]
        ?.getAttribute("href"),
    ).toBe("/docs/references/api");

    expect(
      screen
        .getAllByRole("link", {
          name: "Configuration (factory.json topology)",
        })[0]
        ?.getAttribute("href"),
    ).toBe("/docs/factories/configuration");
    expect(
      screen.getAllByRole("link", { name: "CLI" })[0]?.getAttribute("href"),
    ).toBe("/docs/documentation/cli");
    expect(
      screen.getAllByRole("link", { name: "Workers" })[0]?.getAttribute("href"),
    ).toBe("/docs/workers");

    const related = document.getElementById("related");
    expect(related).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/factories/configuration"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/factories/packaged"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/factories/dynamic-workflows"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/factories/sessions"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/documentation/cli"]'),
    ).toBeTruthy();
    expect(related?.querySelector('a[href="/docs/workers"]')).toBeTruthy();
    expect(related?.querySelector('a[href="/docs/workstations"]')).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/documentation/resources"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/references/schema"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/references/api"]'),
    ).toBeTruthy();
  });
});
