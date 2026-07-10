/**
 * Page-owned render proof for documentation/api-doc.
 * Covers documentation shell, API / OpenAPI identity, the hand-authored
 * OpenAPI surface outline (grouped method/path families), how-to-use
 * base-host guidance with representative HTTP examples, key concepts /
 * limits with deferred OpenAPI-generation follow-up, and sibling discovery.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

// Cold MDX compile + full-page render can exceed Bun's 5s default under load.
const PAGE_RENDER_TIMEOUT_MS = 30_000;

const REQUIRED_METHOD_PATHS = [
  "GET /factory-sessions",
  "GET /factory-sessions/{session_id}",
  "GET /factory-sessions/{session_id}/status",
  "POST /factory-sessions/{session_id}/work",
  "POST /factories/preview",
] as const;

const RELATED_DISCOVERY_HREFS = [
  "/docs/documentation/factory-session",
  "/docs/documentation/submitting-work",
  "/docs/documentation/dynamic-workflows",
  "/docs/documentation/cli",
  "/docs/documentation/mcp",
] as const;

describe("api-doc documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/documentation/api-doc as a documentation page",
    async () => {
      const fumadocsPage = source.getPage(["documentation", "api-doc"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/api-doc");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "api-doc",
      });

      expect(loadedPage.messages.title).toBe("API");
      expect(loadedPage.messages.description).toContain("you-agent-factory");
      expect(loadedPage.messages.description).toMatch(/OpenAPI|HTTP/i);
      expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

      const whatItCovers = String(
        loadedPage.messages.sections?.whatItCovers?.body ?? "",
      );
      const keyConcepts = String(
        loadedPage.messages.sections?.keyConcepts?.body ?? "",
      );
      const openapiSurface = String(
        loadedPage.messages.sections?.openapiSurface?.body ?? "",
      );
      const howToUseBody = String(
        loadedPage.messages.sections?.howToUse?.body ?? "",
      );
      const limitsBody = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );
      const deferredGeneration = String(
        loadedPage.messages.callouts?.deferredOpenApiGeneration?.body ?? "",
      );
      const additionalRoutes = String(
        loadedPage.messages.callouts?.additionalRoutes?.body ?? "",
      );
      const listSessionsExample = String(
        loadedPage.messages.links?.exampleListSessionsCode ?? "",
      );
      const submitWorkExample = String(
        loadedPage.messages.links?.exampleSubmitWorkCode ?? "",
      );
      expect(whatItCovers).toMatch(/OpenAPI|HTTP|API/i);
      expect(keyConcepts).toMatch(
        /OpenAPI \(Open Application Programming Interface\)/,
      );
      expect(keyConcepts).toMatch(/api\/openapi\.yaml/);
      expect(keyConcepts).toMatch(/session-scoped/i);
      expect(keyConcepts).toMatch(/workTypeName/);
      expect(openapiSurface).toMatch(/session/i);
      expect(howToUseBody).toMatch(/http:\/\/localhost:7437/);
      expect(howToUseBody).toMatch(/~default/);
      expect(howToUseBody).toMatch(/not this documentation site/i);
      expect(howToUseBody).not.toMatch(
        /FACTORY_REQUEST_BATCH|on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(limitsBody).toMatch(/hand-authored/i);
      expect(limitsBody).toMatch(/not a build-time generated OpenAPI UI/i);
      expect(limitsBody).toMatch(/not a full schema dump/i);
      expect(limitsBody).toMatch(/not a sync of packaged CLI docs/i);
      expect(limitsBody).toMatch(/Factory Session/i);
      expect(limitsBody).toMatch(/submitting-work/i);
      expect(limitsBody).toMatch(/dynamic-workflows/i);
      expect(limitsBody).toMatch(/MCP/i);
      expect(limitsBody).toMatch(/CLI/i);
      expect(deferredGeneration).toMatch(
        /OpenAPI generation|interactive spec rendering/i,
      );
      expect(deferredGeneration).toMatch(/codegen|third-party|renderer/i);
      expect(listSessionsExample).toContain(
        "http://localhost:7437/factory-sessions",
      );
      expect(submitWorkExample).toContain(
        "http://localhost:7437/factory-sessions/~default/work",
      );
      expect(submitWorkExample).toMatch(/workTypeName/);
      expect(additionalRoutes).toMatch(/events/i);
      expect(additionalRoutes).toMatch(/factory/i);
      expect(additionalRoutes).toMatch(/pause|resume/i);
      expect(additionalRoutes).toMatch(/staged-files/i);
      expect(whatItCovers).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(keyConcepts).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(openapiSurface).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(limitsBody).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut|this lane/i,
      );
      expect(deferredGeneration).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut|this lane/i,
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
        screen.getByRole("heading", { name: "OpenAPI Surface" }),
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
      const openapiSurfaceSection = document.getElementById("openapi-surface");
      expect(whatItCoversSection).toBeTruthy();
      expect(keyConceptsSection).toBeTruthy();
      expect(openapiSurfaceSection).toBeTruthy();
      expect(whatItCoversSection?.textContent).toMatch(
        /you-agent-factory API|OpenAPI/i,
      );
      expect(keyConceptsSection?.textContent).toMatch(
        /OpenAPI \(Open Application Programming Interface\)/,
      );
      expect(keyConceptsSection?.textContent).toMatch(/api\/openapi\.yaml/);
      expect(keyConceptsSection?.textContent).toMatch(/session-scoped/i);
      expect(keyConceptsSection?.textContent).toMatch(/workTypeName/);

      const outline = within(openapiSurfaceSection as HTMLElement);
      expect(outline.getByText("Family")).toBeTruthy();
      expect(outline.getByText("Method and path")).toBeTruthy();
      expect(outline.getByText("Purpose")).toBeTruthy();
      for (const methodPath of REQUIRED_METHOD_PATHS) {
        expect(outline.getByText(methodPath)).toBeTruthy();
      }
      expect(openapiSurfaceSection?.textContent).toMatch(/events/i);
      expect(openapiSurfaceSection?.textContent).toMatch(
        /GET \/factory-sessions\/\{session_id\}\/factory/,
      );
      expect(openapiSurfaceSection?.textContent).toMatch(/pause/i);
      expect(openapiSurfaceSection?.textContent).toMatch(/resume/i);
      expect(openapiSurfaceSection?.textContent).toMatch(/staged-files/i);

      const howToUseSection = document.getElementById("how-to-use");
      expect(howToUseSection).toBeTruthy();
      expect(howToUseSection?.textContent).toMatch(/http:\/\/localhost:7437/);
      expect(howToUseSection?.textContent).toMatch(/~default/);
      expect(howToUseSection?.textContent).toMatch(
        /not this documentation site/i,
      );
      expect(howToUseSection?.textContent).not.toMatch(
        /FACTORY_REQUEST_BATCH|on this page|Model Atlas|reader.?shortcut/i,
      );

      const howToUse = within(howToUseSection as HTMLElement);
      const exampleBlocks = howToUse.getAllByText((_, element) => {
        if (element?.tagName !== "CODE") {
          return false;
        }
        const text = element.textContent ?? "";
        return (
          text.includes("http://localhost:7437/factory-sessions") ||
          text.includes("http://localhost:7437/factory-sessions/~default/work")
        );
      });
      expect(exampleBlocks.length).toBeGreaterThanOrEqual(2);
      expect(
        howToUse.getByText(
          /curl -s "http:\/\/localhost:7437\/factory-sessions"/,
        ),
      ).toBeTruthy();
      expect(howToUseSection?.textContent).toMatch(
        /POST[\s\S]*factory-sessions\/~default\/work/,
      );
      expect(howToUseSection?.textContent).toMatch(/workTypeName/);

      const limitsSection = document.getElementById("limits-and-assumptions");
      expect(limitsSection).toBeTruthy();
      expect(limitsSection?.textContent).toMatch(/hand-authored/i);
      expect(limitsSection?.textContent).toMatch(
        /not a build-time generated OpenAPI UI/i,
      );
      expect(limitsSection?.textContent).toMatch(
        /OpenAPI generation|interactive spec rendering/i,
      );
      expect(limitsSection?.textContent).toMatch(
        /codegen|third-party|renderer/i,
      );
      expect(limitsSection?.textContent).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut|this lane/i,
      );

      const relatedSection = document.getElementById("related");
      expect(relatedSection).toBeTruthy();
      const relatedHrefs = Array.from(
        relatedSection?.querySelectorAll("a[href]") ?? [],
      ).map((node) => node.getAttribute("href") ?? "");
      for (const href of RELATED_DISCOVERY_HREFS) {
        expect(relatedHrefs).toContain(href);
      }
      expect(relatedSection?.textContent).toMatch(/Factory Session/i);
      expect(relatedSection?.textContent).toMatch(/Submitting Work/i);
      expect(relatedSection?.textContent).toMatch(/Dynamic Workflows/i);
      expect(relatedSection?.textContent).toMatch(/CLI/i);
      expect(relatedSection?.textContent).toMatch(/MCP/i);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
