/**
 * Cross-route page-owned proofs for W11 published CLI / MCP / JavaScript
 * runtime reference routes: success mounts, accessible empty/error states,
 * package-backed (not copied) inventory source, static no-host safety,
 * projection-first page chrome (no How To Use / Limits / Related / Tags /
 * Citations), and ownership fences that keep CLI/MCP/JS pages coexisting with
 * sibling reference routes (API, events, schemas) once those lanes land.
 *
 * Does not scan renderer source trees, enforce global registration
 * inventories, or re-own W10 contract-count drift logic.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { CLI_REFERENCE_EXPORT_SPECIFIER } from "@/lib/references/cli-reference-turbopack";
import { JAVASCRIPT_RUNTIME_REFERENCE_EXPORT_SPECIFIER } from "@/lib/references/javascript-runtime-reference-turbopack";
import { loadCliReferenceInventory } from "@/lib/references/load-cli-reference-inventory";
import { loadJavascriptRuntimeReferenceInventory } from "@/lib/references/load-javascript-runtime-reference-inventory";
import { loadMcpReferenceInventory } from "@/lib/references/load-mcp-reference-inventory";
import { MCP_REFERENCE_EXPORT_SPECIFIER } from "@/lib/references/mcp-reference-turbopack";
import { REFERENCE_FAMILY_PAGE_PATHS } from "@/lib/references/reference-search-projection";
import { source } from "@/lib/source";
import { CliReferenceInventory } from "./cli/CliReferenceInventory";
import { JavascriptRuntimeReferenceInventory } from "./javascript-runtime/JavascriptRuntimeReferenceInventory";
import { McpReferenceInventory } from "./mcp/McpReferenceInventory";

const PAGE_RENDER_TIMEOUT_MS = 45_000;

const PUBLISHED_ROUTES = [
  {
    slug: "cli",
    url: REFERENCE_FAMILY_PAGE_PATHS.cli,
    registryId: "reference.cli",
    inventorySelector: "[data-cli-command-inventory]",
    countAttr: "data-cli-command-count",
  },
  {
    slug: "mcp",
    url: REFERENCE_FAMILY_PAGE_PATHS.mcp,
    registryId: "reference.mcp",
    inventorySelector: "[data-mcp-tool-inventory]",
    countAttr: "data-mcp-tool-count",
  },
  {
    slug: "javascript-runtime",
    url: REFERENCE_FAMILY_PAGE_PATHS.javascript,
    registryId: "reference.javascript-runtime",
    inventorySelector: "[data-javascript-runtime-inventory]",
    countAttr: "data-javascript-symbol-count",
  },
] as const;

/** Sibling W11 routes once owned elsewhere — now coexist when those lanes land. */
const COEXISTING_REFERENCE_SLUGS = [
  { slug: "api", url: "/docs/references/api" },
  { slug: "events", url: "/docs/references/events" },
  { slug: "factory-schema", url: "/docs/references/factory-schema" },
  { slug: "you-config-schema", url: "/docs/references/you-config-schema" },
  { slug: "mock-workers-schema", url: "/docs/references/mock-workers-schema" },
] as const;

describe("W11 published route states and ownership fences", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "each published route mounts a package-backed inventory success state",
    async () => {
      const cliInventory = loadCliReferenceInventory();
      const mcpInventory = loadMcpReferenceInventory();
      const jsInventory = loadJavascriptRuntimeReferenceInventory();

      expect(cliInventory.state).toBe("success");
      expect(mcpInventory.state).toBe("success");
      expect(jsInventory.state).toBe("success");
      if (
        cliInventory.state !== "success" ||
        mcpInventory.state !== "success" ||
        jsInventory.state !== "success"
      ) {
        return;
      }

      expect(
        cliInventory.commands.every(
          (command) =>
            command.source.publicArtifactId === CLI_REFERENCE_EXPORT_SPECIFIER,
        ),
      ).toBe(true);
      expect(
        mcpInventory.tools.every(
          (tool) =>
            tool.source.publicArtifactId === MCP_REFERENCE_EXPORT_SPECIFIER,
        ),
      ).toBe(true);
      expect(
        jsInventory.symbols.every(
          (symbol) =>
            symbol.source.publicArtifactId ===
            JAVASCRIPT_RUNTIME_REFERENCE_EXPORT_SPECIFIER,
        ),
      ).toBe(true);
      expect(
        jsInventory.sharedSchemas.every(
          (schema) =>
            schema.source.publicArtifactId ===
            JAVASCRIPT_RUNTIME_REFERENCE_EXPORT_SPECIFIER,
        ),
      ).toBe(true);

      for (const route of PUBLISHED_ROUTES) {
        const fumadocsPage = source.getPage(["references", route.slug]);
        expect(fumadocsPage).toBeDefined();
        expect(fumadocsPage?.url).toBe(route.url);

        const loadedPage = await loadLocalDocsPage({
          section: "references",
          slug: route.slug,
        });
        expect(loadedPage.frontmatter.kind).toBe("reference");
        expect(loadedPage.frontmatter.registryId).toBe(route.registryId);

        expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
        expect(
          loadedPage.messages.sections?.limitsAndAssumptions,
        ).toBeUndefined();
        expect(loadedPage.messages.sections?.related).toBeUndefined();
        expect(loadedPage.messages.sections?.tags).toBeUndefined();
        expect(loadedPage.messages.sections?.references).toBeUndefined();
        expect(loadedPage.messages.links).toBeUndefined();
        expect(loadedPage.messages.openingSummary).toMatch(
          /without a live Factory host/i,
        );

        cleanup();
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
          screen.queryByRole("heading", { name: "How To Use" }),
        ).toBeNull();
        expect(
          screen.queryByRole("heading", { name: "Limits And Assumptions" }),
        ).toBeNull();
        expect(
          screen.queryByRole("heading", { name: "Related To" }),
        ).toBeNull();
        expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
        expect(
          screen.queryByRole("heading", { name: "References" }),
        ).toBeNull();
        expect(document.getElementById("related")).toBeNull();

        const inventoryRoot = document.querySelector(route.inventorySelector);
        expect(inventoryRoot).toBeTruthy();
        expect(inventoryRoot?.getAttribute("data-inventory-state")).toBe(
          "success",
        );
        expect(
          Number(inventoryRoot?.getAttribute(route.countAttr) ?? "0"),
        ).toBeGreaterThan(0);
      }
    },
    PAGE_RENDER_TIMEOUT_MS,
  );

  test("page mounts surface accessible empty and error states", () => {
    render(<CliReferenceInventory inventory={{ state: "empty" }} />);
    expect(
      document.querySelector(
        '[data-cli-command-inventory][data-inventory-state="empty"]',
      ),
    ).toBeTruthy();
    expect(document.querySelector("[data-reference-empty-state]")).toBeTruthy();
    expect(screen.getByText("No CLI commands")).toBeTruthy();
    cleanup();

    render(
      <CliReferenceInventory
        inventory={{
          state: "error",
          detail: "forced CLI contract failure",
        }}
      />,
    );
    expect(
      document.querySelector(
        '[data-cli-command-inventory][data-inventory-state="error"]',
      ),
    ).toBeTruthy();
    expect(document.querySelector("[data-reference-error-state]")).toBeTruthy();
    expect(screen.getByText("CLI inventory error")).toBeTruthy();
    expect(screen.getByText("forced CLI contract failure")).toBeTruthy();
    cleanup();

    render(<McpReferenceInventory inventory={{ state: "empty" }} />);
    expect(
      document.querySelector(
        '[data-mcp-tool-inventory][data-inventory-state="empty"]',
      ),
    ).toBeTruthy();
    expect(screen.getByText("No MCP tools")).toBeTruthy();
    cleanup();

    render(
      <McpReferenceInventory
        inventory={{
          state: "error",
          detail: "forced MCP contract failure",
        }}
      />,
    );
    expect(
      document.querySelector(
        '[data-mcp-tool-inventory][data-inventory-state="error"]',
      ),
    ).toBeTruthy();
    expect(screen.getByText("MCP inventory error")).toBeTruthy();
    expect(screen.getByText("forced MCP contract failure")).toBeTruthy();
    cleanup();

    render(
      <JavascriptRuntimeReferenceInventory inventory={{ state: "empty" }} />,
    );
    expect(
      document.querySelector(
        '[data-javascript-runtime-inventory][data-inventory-state="empty"]',
      ),
    ).toBeTruthy();
    expect(screen.getByText("No JavaScript runtime items")).toBeTruthy();
    cleanup();

    render(
      <JavascriptRuntimeReferenceInventory
        inventory={{
          state: "error",
          detail: "forced JavaScript runtime contract failure",
        }}
      />,
    );
    expect(
      document.querySelector(
        '[data-javascript-runtime-inventory][data-inventory-state="error"]',
      ),
    ).toBeTruthy();
    expect(screen.getByText("JavaScript inventory error")).toBeTruthy();
    expect(
      screen.getByText("forced JavaScript runtime contract failure"),
    ).toBeTruthy();
  });

  test("static inventory loaders resolve without a live Factory host", () => {
    const previousHost = process.env.FACTORY_HOST;
    const previousUrl = process.env.YOU_FACTORY_URL;
    const previousBase = process.env.FACTORY_BASE_URL;
    delete process.env.FACTORY_HOST;
    delete process.env.YOU_FACTORY_URL;
    delete process.env.FACTORY_BASE_URL;

    try {
      expect(loadCliReferenceInventory().state).toBe("success");
      expect(loadMcpReferenceInventory().state).toBe("success");
      expect(loadJavascriptRuntimeReferenceInventory().state).toBe("success");
    } finally {
      if (previousHost === undefined) {
        delete process.env.FACTORY_HOST;
      } else {
        process.env.FACTORY_HOST = previousHost;
      }
      if (previousUrl === undefined) {
        delete process.env.YOU_FACTORY_URL;
      } else {
        process.env.YOU_FACTORY_URL = previousUrl;
      }
      if (previousBase === undefined) {
        delete process.env.FACTORY_BASE_URL;
      } else {
        process.env.FACTORY_BASE_URL = previousBase;
      }
    }
  });

  test("ownership fences keep CLI/MCP/JS pages coexisting with sibling reference routes", () => {
    // Family index is an App Router page, not a fumadocs catch-all slug.
    expect(source.getPage(["references"])).toBeUndefined();

    for (const route of PUBLISHED_ROUTES) {
      expect(source.getPage(["references", route.slug])?.url).toBe(route.url);
    }

    // Parallel W11 API/schema/events pages coexist on the same family; this
    // lane must not delete or re-own them.
    for (const route of COEXISTING_REFERENCE_SLUGS) {
      expect(source.getPage(["references", route.slug])?.url).toBe(route.url);
    }
  });
});
