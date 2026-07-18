/**
 * Page-owned render proof for factories/sessions.
 * Covers documentation shell, Factory Session identity/lifecycle teaching,
 * live FactoryName schema embed via W07 SchemaReference for Factory
 * relationship, and full-reference lookup links. Colocated under the page
 * bundle so audit:canonical-page-surface stays within-budget for this
 * factories lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("factories/sessions documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/factories/sessions with live Factory relationship embed", async () => {
    const fumadocsPage = source.getPage(["factories", "sessions"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/factories/sessions");

    const loadedPage = await loadLocalDocsPage({
      section: "factories",
      slug: "sessions",
    });

    expect(loadedPage.frontmatter.registryId).toBe(
      "documentation.factories-sessions",
    );
    expect(loadedPage.frontmatter.kind).toBe("documentation");
    expect(loadedPage.messages.title).toBe("Factory Sessions");
    expect(loadedPage.messages.description).toMatch(/Factory Session/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const factoryRelationship = String(
      loadedPage.messages.sections?.factoryRelationship?.body ?? "",
    );
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
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(whatItCovers).toMatch(/Factory Session/i);
    expect(whatItCovers).toMatch(/live runtime unit/i);
    expect(keyConcepts).toMatch(/FactorySession/i);
    expect(keyConcepts).toMatch(/loaded factory/i);
    expect(factoryRelationship).toMatch(/FactoryName/i);
    expect(factoryRelationship).toMatch(/schema, API, and events/i);
    expect(sessionList).toMatch(/liveness check/i);
    expect(sessionShow).toMatch(/owns its own runtime state/i);
    expect(lifecycle).toMatch(/Pause and resume/i);
    expect(durableJavascriptSession).toMatch(/Durable JavaScript runs/i);
    expect(durableJavascriptSession).toMatch(/Dynamic workflow is shorthand/i);
    expect(howToUse).toMatch(/session list/i);
    expect(limits).toMatch(/web Factory Session reference/i);
    expect(limits).toMatch(/not a full CLI flag dump/i);
    expect(limits).toMatch(/not the OpenAPI, schema, or events reference/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(keyConcepts).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(factoryRelationship).not.toMatch(
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
      screen.getByRole("heading", { name: "Relationship To A Factory" }),
    ).toBeTruthy();
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
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();

    const factoryNameEmbed = screen.getByTestId(
      "factories-sessions-factory-name-schema",
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
        .getAllByRole("link", { name: "Factory events reference" })[0]
        ?.getAttribute("href"),
    ).toBe("/docs/references/events");

    expect(
      screen.getByRole("link", { name: "CLI docs" }).getAttribute("href"),
    ).toBe("/docs/documentation/cli");
    expect(
      screen
        .getByRole("link", { name: "Submitting work" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/submitting-work");
    expect(
      screen
        .getByRole("link", { name: "Dynamic workflows" })
        .getAttribute("href"),
    ).toBe("/docs/factories/dynamic-workflows");
    expect(
      screen
        .getByRole("link", { name: "Configuration (factory.json topology)" })
        .getAttribute("href"),
    ).toBe("/docs/factories/configuration");
    expect(
      screen
        .getByRole("link", { name: "Cursor dynamic workflows" })
        .getAttribute("href"),
    ).toBe("/docs/guides/cursor-dynamic-workflows");

    const sessionListSection = document.getElementById("session-list");
    const sessionShowSection = document.getElementById("session-show");
    const lifecycleSection = document.getElementById("lifecycle");
    const durableSection = document.getElementById(
      "durable-javascript-session",
    );
    expect(sessionListSection?.textContent).toMatch(/you session list/);
    expect(sessionShowSection?.textContent).toMatch(
      /you session show <session-id>/,
    );
    expect(lifecycleSection?.textContent).toMatch(
      /you session pause <session-id>/,
    );
    expect(lifecycleSection?.textContent).toMatch(
      /you session resume <session-id>/,
    );
    expect(durableSection?.textContent).toMatch(/you workflow validate/);
    expect(durableSection?.textContent).toMatch(/you workflow start/);
    expect(durableSection?.textContent).toMatch(/you workflow status/);
    expect(durableSection?.textContent).toMatch(/you workflow result/);
  });
});
