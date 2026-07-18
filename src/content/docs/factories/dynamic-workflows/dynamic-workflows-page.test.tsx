/**
 * Page-owned render proof for factories/dynamic-workflows.
 * Covers documentation shell, dynamic-workflow API/configuration teaching,
 * live orchestrator/invocation schema embeds via W07 SchemaReference, and
 * full-reference lookup links. Colocated under the page bundle so
 * audit:canonical-page-surface stays within-budget for this factories lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("factories/dynamic-workflows documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/factories/dynamic-workflows with live orchestration embeds", async () => {
    const fumadocsPage = source.getPage(["factories", "dynamic-workflows"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/factories/dynamic-workflows");

    const loadedPage = await loadLocalDocsPage({
      section: "factories",
      slug: "dynamic-workflows",
    });

    expect(loadedPage.frontmatter.registryId).toBe(
      "documentation.factories-dynamic-workflows",
    );
    expect(loadedPage.frontmatter.kind).toBe("documentation");
    expect(loadedPage.messages.title).toBe("Dynamic Workflows");
    expect(loadedPage.messages.description).toMatch(/JavaScript/i);
    expect(loadedPage.messages.description).toMatch(/Factory/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const orchestratorSchema = String(
      loadedPage.messages.sections?.orchestratorSchema?.body ?? "",
    );
    const javascriptConfig = String(
      loadedPage.messages.sections?.javascriptConfigSchema?.body ?? "",
    );
    const invocationSchema = String(
      loadedPage.messages.sections?.invocationSchema?.body ?? "",
    );
    const apiAndConfiguration = String(
      loadedPage.messages.sections?.apiAndConfiguration?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(whatItCovers).toMatch(/JavaScript/i);
    expect(whatItCovers).toMatch(/Factory Session/i);
    expect(keyConcepts).toMatch(/FactoryOrchestrator/i);
    expect(keyConcepts).toMatch(/JAVASCRIPT/i);
    expect(orchestratorSchema).toMatch(/FactoryOrchestrator/i);
    expect(javascriptConfig).toMatch(/FactoryOrchestratorJavaScriptConfig/i);
    expect(invocationSchema).toMatch(/FactoryInvocationSignature/i);
    expect(apiAndConfiguration).toMatch(/Factory Session/i);
    expect(apiAndConfiguration).toMatch(/CLI workflow path/i);
    expect(howToUse).toMatch(/Cursor dynamic-workflows/i);
    expect(limits).toMatch(/not a duplicated OpenAPI/i);
    expect(limits).toMatch(/schema and API reference/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(keyConcepts).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(orchestratorSchema).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(apiAndConfiguration).not.toMatch(
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
      screen.getByRole("heading", { name: "Orchestrator Identity" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "JavaScript Orchestrator Configuration",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Invocation Signature" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "API And Configuration Relationship",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();

    const orchestratorEmbed = screen.getByTestId(
      "factories-dynamic-workflows-orchestrator-schema",
    );
    expect(orchestratorEmbed).toBeTruthy();
    expect(orchestratorEmbed.getAttribute("data-schema-status")).toBe("ready");
    expect(
      orchestratorEmbed.querySelector(
        '[data-schema-reference-mode="addressed"]',
      ),
    ).toBeTruthy();
    expect(
      orchestratorEmbed.querySelector(
        '[data-schema-reference-pointer="/$defs/FactoryOrchestrator"]',
      ),
    ).toBeTruthy();

    const jsConfigEmbed = screen.getByTestId(
      "factories-dynamic-workflows-js-config-schema",
    );
    expect(jsConfigEmbed).toBeTruthy();
    expect(jsConfigEmbed.getAttribute("data-schema-status")).toBe("ready");
    expect(
      jsConfigEmbed.querySelector(
        '[data-schema-reference-pointer="/$defs/FactoryOrchestratorJavaScriptConfig"]',
      ),
    ).toBeTruthy();

    const invocationEmbed = screen.getByTestId(
      "factories-dynamic-workflows-invocation-schema",
    );
    expect(invocationEmbed).toBeTruthy();
    expect(invocationEmbed.getAttribute("data-schema-status")).toBe("ready");
    expect(
      invocationEmbed.querySelector(
        '[data-schema-reference-pointer="/$defs/FactoryInvocationSignature"]',
      ),
    ).toBeTruthy();

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
        .getAllByRole("link", { name: "Cursor dynamic workflows" })[0]
        ?.getAttribute("href"),
    ).toBe("/docs/guides/cursor-dynamic-workflows");
    expect(
      screen
        .getAllByRole("link", {
          name: "Configuration (factory.json topology)",
        })[0]
        ?.getAttribute("href"),
    ).toBe("/docs/factories/configuration");
    expect(
      screen
        .getAllByRole("link", { name: "Global configuration" })[0]
        ?.getAttribute("href"),
    ).toBe("/docs/factories/global-configuration");
    expect(
      screen.getAllByRole("link", { name: "CLI" })[0]?.getAttribute("href"),
    ).toBe("/docs/documentation/cli");
    expect(
      screen
        .getAllByRole("link", { name: "Harness support" })[0]
        ?.getAttribute("href"),
    ).toBe("/docs/documentation/harness-support");

    const related = document.getElementById("related");
    expect(related).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/factories/configuration"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/factories/global-configuration"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/factories/packaged"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/factories/sessions"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/documentation/cli"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/documentation/workers"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/references/schema"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/references/api"]'),
    ).toBeTruthy();
  });
});
