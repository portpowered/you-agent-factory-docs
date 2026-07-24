/**
 * Page-owned proofs for references/packaged-factories-index.
 * Asserts published route presence, registry alignment, concise reference
 * chrome, family-index discoverability, ordered generated enumeration
 * rendering (unabridged definitions, JS-only shape, stable child links /
 * anchors, no replay/playback UI), and index-only page MDX component-map merge
 * via the route-family loader. Import-graph isolation lives in
 * packaged-factories-index-import-graph.test.ts. Does not author child page
 * bodies.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getRegistryRecord, loadRegistry } from "@/lib/content/registry";
import { source } from "@/lib/source";
import { loadReferencesFamilyIndex } from "../family-index/load-references-family-index";
import { REFERENCE_FAMILY_DISCOVERABILITY_ROUTES } from "../family-index/reference-family-routes";
import { resolveReferenceFamilyDiscoverabilityCards } from "../family-index/resolve-reference-family-discoverability";
import generatedIndex from "./generated/index.json";
import { PackagedFactoriesIndex } from "./PackagedFactoriesIndex";
import { pageMdxComponents } from "./page-mdx-components";

const PAGE_URL = "/docs/references/packaged-factories-index";
const REGISTRY_ID = "reference.packaged-factories-index";
const ALLOWLIST_ORDER = [
  "goal",
  "subagent",
  "fusion",
  "review",
  "quorum",
  "tts",
  "deep-research",
] as const;

describe("packaged-factories-index reference page shell", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/references/packaged-factories-index as Packaged Factory Reference", async () => {
    const fumadocsPage = source.getPage([
      "references",
      "packaged-factories-index",
    ]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe(PAGE_URL);

    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "packaged-factories-index",
    });

    expect(loadedPage.frontmatter.kind).toBe("reference");
    expect(loadedPage.frontmatter.registryId).toBe(REGISTRY_ID);
    expect(loadedPage.frontmatter.status).toBe("published");
    expect(loadedPage.messages.title).toBe("Packaged Factory Reference");
    expect(loadedPage.messages.description).toMatch(
      /@you-agent-factory\/packaged-factories/i,
    );
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
    expect(loadedPage.messages.sections?.limitsAndAssumptions).toBeUndefined();
    expect(loadedPage.messages.sections?.related).toBeUndefined();
    expect(loadedPage.messages.sections?.tags).toBeUndefined();
    expect(loadedPage.messages.sections?.references).toBeUndefined();
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.links).toBeUndefined();

    const overview = String(
      loadedPage.messages.sections?.indexOverview?.body ?? "",
    );
    expect(overview).toMatch(/allowlist order|canonical name/i);
    expect(overview).not.toMatch(
      /usage example|how to run|replay|visualizer|playback|Model Atlas/i,
    );

    render(
      <main>
        <DocsPageProviders
          assets={loadedPage.assets}
          messages={loadedPage.messages}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    expect(
      screen.getByRole("heading", { name: "Packaged factory index" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.querySelector("[data-factory-replay]")).toBeNull();
    expect(document.querySelector("[data-factory-visualizer]")).toBeNull();
  });

  test("exposes a published registry record for the parent page", async () => {
    const indexes = await loadRegistry();
    const record = getRegistryRecord(indexes, REGISTRY_ID);

    expect(record).toBeTruthy();
    expect(record?.kind).toBe("reference");
    expect(record?.id).toBe(REGISTRY_ID);
    expect(record?.slug).toBe("packaged-factories-index");
    expect(record?.status).toBe("published");
    expect(record?.aliases).toContain("Packaged Factory Reference");
  });

  test("appears in references family-index discoverability cards", async () => {
    const loaded = await loadReferencesFamilyIndex();
    const cards = resolveReferenceFamilyDiscoverabilityCards(loaded.messages);
    const route = REFERENCE_FAMILY_DISCOVERABILITY_ROUTES.find(
      (entry) => entry.id === "packaged-factories-index",
    );

    expect(route?.href).toBe(PAGE_URL);
    const card = cards.find((entry) => entry.id === "packaged-factories-index");
    expect(card).toBeTruthy();
    expect(card?.href).toBe(PAGE_URL);
    expect(card?.title).toBe("Packaged Factory Reference");
    expect(card?.description.length).toBeGreaterThan(0);
  });
});

describe("packaged-factories-index ordered enumeration", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders generated allowlist order with unabridged factory.json panels and child links", () => {
    render(<PackagedFactoriesIndex />);

    const root = screen.getByTestId("packaged-factories-index");
    expect(root.getAttribute("data-packaged-factories-index-package")).toBe(
      "@you-agent-factory/packaged-factories",
    );
    expect(root.getAttribute("data-packaged-factories-index-version")).toBe(
      "0.0.2",
    );

    const articles = within(root).getAllByRole("article");
    expect(articles.map((node) => node.id)).toEqual([...ALLOWLIST_ORDER]);

    for (const [index, slug] of ALLOWLIST_ORDER.entries()) {
      const article = articles[index];
      expect(article).toBeTruthy();
      if (!article) {
        throw new Error(`missing article for ${slug}`);
      }

      const corpusEntry = generatedIndex.entries[index];
      expect(corpusEntry?.childSlug).toBe(slug);
      expect(
        within(article).getByRole("heading", {
          name: corpusEntry?.canonicalName ?? "",
        }),
      ).toBeTruthy();
      expect(
        within(article).getByText("No packaged description."),
      ).toBeTruthy();
      expect(
        article.querySelector("[data-packaged-factory-package-version]")
          ?.textContent,
      ).toBe(corpusEntry?.packageVersion);
      expect(
        article.querySelector("[data-packaged-factory-source-kind]")
          ?.textContent,
      ).toBe("factory.json");
      expect(
        article.querySelector("[data-packaged-factory-source-path]")
          ?.textContent,
      ).toBe(corpusEntry?.sourceRelativePath);
      expect(
        article.querySelector("[data-packaged-factory-definition-label]")
          ?.textContent,
      ).toBe("factory.json");

      const childLink = within(article).getByRole("link", {
        name: `Open ${slug} reference`,
      });
      expect(childLink.getAttribute("href")).toBe(`${PAGE_URL}/${slug}`);

      const code = within(article).getByTestId(
        `packaged-factory-definition-${slug}`,
      );
      expect(code.tagName).toBe("PRE");
      expect(code.textContent).toBe(corpusEntry?.factoryJsonText ?? "");
      expect(code.textContent).toContain(`"name": "@you/${slug}"`);
    }

    expect(root.querySelector("[data-factory-replay]")).toBeNull();
    expect(root.querySelector("[data-factory-visualizer]")).toBeNull();
    expect(root.querySelector("[data-factory-recording]")).toBeNull();
    expect(screen.queryByText(/usage example/i)).toBeNull();
  });

  test("renders JavaScript-only entries with raw source and no-factory.json statement", () => {
    const javascriptSourceText =
      "return (async function () { return { ok: true }; })();\n";

    render(
      <PackagedFactoriesIndex
        corpus={{
          packageName: "@you-agent-factory/packaged-factories",
          packageVersion: "0.0.2",
          entries: [
            {
              canonicalName: "@you/js-only",
              packagedDescription: "Exact acquired JavaScript factory.",
              childSlug: "js-only",
              packageVersion: "0.0.2",
              sourceRelativePath: "factories/js-only/workflow.js",
              javascriptSourceText,
            },
          ],
        }}
      />,
    );

    const article = screen.getByRole("article");
    expect(article.getAttribute("data-packaged-factory-entry-kind")).toBe(
      "javascript-only",
    );
    expect(
      within(article).getByText(/This entry has no factory\.json/i),
    ).toBeTruthy();
    expect(
      within(article).getByText("Packaged JavaScript source"),
    ).toBeTruthy();
    expect(
      article.querySelector("[data-packaged-factory-source-kind]")?.textContent,
    ).toBe("javascript");

    const code = within(article).getByTestId(
      "packaged-factory-definition-js-only",
    );
    expect(code.textContent).toBe(javascriptSourceText);
    expect(code.textContent).not.toMatch(/stages|workers|call graph/i);
    expect(article.querySelector("[data-factory-replay]")).toBeNull();
  });

  test("page MDX mounts the ordered enumeration without replay chrome", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "packaged-factories-index",
    });

    render(
      <main>
        <DocsPageProviders
          assets={loadedPage.assets}
          messages={loadedPage.messages}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    const root = screen.getByTestId("packaged-factories-index");
    const articles = within(root).getAllByRole("article");
    expect(articles.map((node) => node.id)).toEqual([...ALLOWLIST_ORDER]);
    expect(
      within(articles[0] as HTMLElement).getByRole("heading", {
        name: "@you/goal",
      }),
    ).toBeTruthy();
    expect(
      within(articles[0] as HTMLElement).getByTestId(
        "packaged-factory-definition-goal",
      ).textContent,
    ).toBe(generatedIndex.entries[0]?.factoryJsonText);
    expect(document.querySelector("[data-factory-replay]")).toBeNull();
    expect(document.querySelector("[data-factory-visualizer]")).toBeNull();
  });
});

describe("packaged-factories-index page MDX component map", () => {
  afterEach(() => {
    cleanup();
  });

  test("exports an index-only map keyed to PackagedFactoriesIndex", () => {
    expect(Object.keys(pageMdxComponents).sort()).toEqual([
      "PackagedFactoriesIndex",
    ]);
    expect(pageMdxComponents.PackagedFactoriesIndex).toBe(
      PackagedFactoriesIndex,
    );
    expect(
      Object.keys(pageMdxComponents).some((key) =>
        /replay|recording|visualizer|playback/i.test(key),
      ),
    ).toBe(false);
  });

  test("route-family loader merges the map so parent MDX renders the index", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "packaged-factories-index",
    });

    render(
      <main>
        <DocsPageProviders
          assets={loadedPage.assets}
          messages={loadedPage.messages}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    const root = screen.getByTestId("packaged-factories-index");
    expect(root.getAttribute("data-packaged-factories-index-package")).toBe(
      "@you-agent-factory/packaged-factories",
    );
    expect(
      within(root)
        .getAllByRole("article")
        .map((node) => node.id),
    ).toEqual([...ALLOWLIST_ORDER]);
    expect(document.querySelector("[data-factory-replay]")).toBeNull();
    expect(document.querySelector("[data-factory-visualizer]")).toBeNull();
    expect(document.querySelector("[data-factory-recording]")).toBeNull();
    expect(screen.queryByText(/usage example/i)).toBeNull();
  });
});
