/**
 * Page-owned render proof for references/factory-schema.
 * Asserts route presence, SchemaReference success markers, pagePath ownership,
 * leftover intro chrome absence, recursively splayed definitions, same-page
 * `$ref` click-traverse onto those definitions, the authored full Factory
 * configuration JSON example, and explicit invalid status when acquisition
 * fails — not W07 internals.
 *
 * Browser success-path close-out (intro + splay + click-traverse + example):
 * `assert-factory-schema-repair-browser.ts`.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { focusReferenceHashTarget } from "@/features/references/shared";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadSchemaVerificationPackageModel } from "@/lib/references/load-schema-verification-models";
import { source } from "@/lib/source";
import {
  FACTORY_SCHEMA_PAGE_PATH,
  FactorySchemaReference,
} from "./FactorySchemaReference";
import {
  FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE,
  FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_ID,
} from "./factory-schema-full-config-example";
import { groupFactorySchemaDefinitions } from "./factory-schema-groups";
import { collectFactorySchemaSplayDefinitions } from "./factory-schema-splay";
import { buildPageToc } from "./page-toc";

describe("factory-schema reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/references/factory-schema as a reference page", async () => {
    const fumadocsPage = source.getPage(["references", "factory-schema"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/references/factory-schema");

    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "factory-schema",
    });

    expect(loadedPage.frontmatter.kind).toBe("reference");
    expect(loadedPage.frontmatter.registryId).toBe("reference.factory-schema");
    expect(loadedPage.messages.title).toBe("Factory schema");
    expect(loadedPage.messages.description).toBe(
      "Reference for the factory configuration schema.",
    );

    // The verbose "Schema Lookup" preamble is gone; the page opens on one
    // plain-language sentence and then the schema itself.
    expect(loadedPage.messages.sections).toBeUndefined();
    expect(loadedPage.messages.contextSentence).toMatch(
      /reference for the factory configuration schema/i,
    );

    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
    expect(loadedPage.messages.sections?.limitsAndAssumptions).toBeUndefined();
    expect(loadedPage.messages.sections?.related).toBeUndefined();
    expect(loadedPage.messages.sections?.tags).toBeUndefined();
    expect(loadedPage.messages.sections?.references).toBeUndefined();
    expect(loadedPage.messages.links).toBeUndefined();

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
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Schema Lookup" })).toBeNull();
    expect(document.getElementById("schema-lookup")).toBeNull();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("what-it-covers")).toBeNull();
    expect(document.getElementById("key-concepts")).toBeNull();

    const schemaSurface = screen.getByTestId("factory-schema-reference");
    expect(schemaSurface.getAttribute("data-schema-status")).toBe("ready");
    expect(
      schemaSurface.querySelector('[data-schema-field-path="workers"]'),
    ).toBeTruthy();
    expect(
      schemaSurface.querySelector('[data-schema-field-path="id"]'),
    ).toBeTruthy();

    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});

describe("FactorySchemaReference mount", () => {
  afterEach(() => {
    cleanup();
  });

  test("mounts complete-schema mode with stable pagePath for factory schema", () => {
    render(<FactorySchemaReference />);

    const surface = screen.getByTestId("factory-schema-reference");
    expect(surface.getAttribute("data-schema-status")).toBe("ready");
    expect(
      surface.querySelector('[data-schema-reference-mode="complete"]'),
    ).toBeTruthy();

    const deepLink = surface.querySelector(
      `a[href^="${FACTORY_SCHEMA_PAGE_PATH}#"]`,
    );
    expect(deepLink).toBeTruthy();
    expect(
      surface.querySelector('[data-schema-field-path="workers"]'),
    ).toBeTruthy();
  });

  test("groups the splayed catalog into ordered, titled sections", () => {
    render(<FactorySchemaReference />);

    const surface = screen.getByTestId("factory-schema-reference");
    // The flat, untitled "Definitions" bucket is gone.
    expect(screen.queryByRole("heading", { name: "Definitions" })).toBeNull();

    const sections = [
      ...surface.querySelectorAll("[data-schema-catalog-group]"),
    ];

    // Core configuration leads, then each subject, then the shared primitives.
    expect(
      sections.map((section) =>
        section.getAttribute("data-schema-catalog-group"),
      ),
    ).toEqual([
      "core",
      "workers",
      "workstations",
      "work",
      "orchestrator",
      "invocation",
      "guards",
      "resources",
      "layout",
      "shared",
    ]);

    // Every section is a labelled landmark with a stable, unique anchor.
    const anchors = new Set<string>();
    for (const section of sections) {
      const anchor = section.getAttribute("id") ?? "";
      expect(anchor).toMatch(/^schema-group-[a-z0-9-]+$/);
      expect(anchors.has(anchor)).toBe(false);
      anchors.add(anchor);
      expect(document.getElementById(`${anchor}-heading`)?.tagName).toBe("H2");
    }

    // Each definition sits inside exactly one section — none escape to the
    // catalog root, which is what made the old page read as a dump.
    const catalog = screen.getByRole("region", { name: "Schema definitions" });
    for (const definition of catalog.querySelectorAll(
      "[data-schema-definition-pointer]",
    )) {
      expect(definition.closest("[data-schema-catalog-group]")).toBeTruthy();
    }

    const workers = surface.querySelector(
      '[data-schema-catalog-group="workers"]',
    );
    expect(
      workers
        ?.querySelector("[data-schema-definition-pointer]")
        ?.getAttribute("data-schema-definition-pointer"),
    ).toBe("/$defs/Worker");
  });

  test("renders each definition as a separated block at page type scale", () => {
    render(<FactorySchemaReference />);

    const surface = screen.getByTestId("factory-schema-reference");
    expect(
      surface.querySelector('[data-schema-reference-type-scale="page"]'),
    ).toBeTruthy();

    // `not-prose` is what lets the explicit spacing apply at all: fumadocs
    // prose margins outrank a bare `m-0` utility.
    expect(surface.className).toContain("not-prose");

    const definitions = [
      ...surface.querySelectorAll("[data-schema-definition-pointer]"),
    ];
    expect(definitions.length).toBeGreaterThan(50);
    for (const definition of definitions) {
      expect(definition.className).toContain("border");
      expect(definition.className).toContain("rounded-lg");
    }

    // Section h2 → definition h3 → Fields/Examples h4, so the hierarchy steps
    // down instead of flattening into one weight.
    const worker = surface.querySelector(
      '[data-schema-definition-pointer="/$defs/Worker"]',
    );
    const title = worker?.querySelector("[data-schema-definition-title]");
    expect(title?.tagName).toBe("H3");
    expect(title?.className).toContain("font-bold");
    expect(
      worker?.querySelector("[data-schema-definition-fields] h4"),
    ).toBeTruthy();
  });

  test("holds the definition list back until a query is typed", () => {
    render(<FactorySchemaReference />);

    const surface = screen.getByTestId("factory-schema-reference");

    // The filter input stays — it is the page's search affordance.
    expect(surface.querySelector('[data-schema-filter="input"]')).toBeTruthy();

    // Its results do not: a standing list of 100+ rows above content that
    // already renders all of them is the dump, not a control.
    expect(
      screen.queryByTestId("factory-schema-reference-filter-results"),
    ).toBeNull();
    expect(
      surface.querySelectorAll("[data-schema-filter-definition-pointer]"),
    ).toHaveLength(0);

    // Typing surfaces matches, and every match is a link that goes somewhere.
    fireEvent.change(
      surface.querySelector('[data-schema-filter="input"]') as HTMLInputElement,
      { target: { value: "WorkstationCron" } },
    );

    const rows = [
      ...surface.querySelectorAll("[data-schema-filter-definition-pointer]"),
    ];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const href = row.querySelector("a")?.getAttribute("href") ?? "";
      expect(href.startsWith(`${FACTORY_SCHEMA_PAGE_PATH}#`)).toBe(true);
      expect(
        document.getElementById(
          href.slice(`${FACTORY_SCHEMA_PAGE_PATH}#`.length),
        ),
      ).toBeTruthy();
    }
  });

  test("recursively splays referenced Factory definitions onto the page", () => {
    render(<FactorySchemaReference />);

    const surface = screen.getByTestId("factory-schema-reference");
    expect(surface.getAttribute("data-schema-status")).toBe("ready");

    const catalog = screen.getByRole("region", { name: "Schema definitions" });
    expect(catalog.getAttribute("data-schema-reference")).toBe("catalog");
    expect(surface.contains(catalog)).toBe(true);

    // Representative transitive $ref targets from the Factory root must render
    // as expanded definition sections (not opaque $ref chrome alone).
    for (const pointer of [
      "/$defs/Worker",
      "/$defs/Workstation",
      "/$defs/WorkType",
      "/$defs/FactoryGuard",
      "/$defs/FactoryOrchestrator",
    ]) {
      const definition = surface.querySelector(
        `[data-testid="factory-schema-reference-catalog-${pointer}"]`,
      );
      expect(definition).toBeTruthy();
      expect(catalog.contains(definition)).toBe(true);
    }

    // Nested refs from a splayed definition remain cycle-safe link chrome
    // rather than inventing unpublished bodies.
    expect(
      catalog.querySelector('[data-schema-ref-kind="resolved"]'),
    ).toBeTruthy();
  });

  test("publishes one authored full Factory configuration JSON example", () => {
    render(<FactorySchemaReference />);

    const surface = screen.getByTestId("factory-schema-reference");
    expect(surface.getAttribute("data-schema-status")).toBe("ready");

    const examples = surface.querySelector(
      '[data-testid="schema-definition-examples"][data-schema-examples="present"]',
    );
    expect(examples).toBeTruthy();
    expect(surface.contains(examples)).toBe(true);

    const example = examples?.querySelector(
      `[data-schema-example-id="${FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_ID}"]`,
    );
    expect(example).toBeTruthy();
    expect(example?.getAttribute("data-schema-example-origin")).toBe(
      "authored",
    );

    const code = examples?.querySelector(
      `[data-testid="schema-example-code-${FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_ID}"]`,
    );
    expect(code).toBeTruthy();
    const codeText = code?.textContent ?? "";
    expect(codeText).toContain('"workTypes"');
    expect(codeText).toContain('"workers"');
    expect(codeText).toContain('"workstations"');
    expect(codeText).toContain('"name": "task"');
    expect(codeText).toContain('"name": "processor"');
    expect(codeText).toContain('"name": "process"');

    // Authored override stays aligned with the hermetic factories/configuration
    // minimal sample keys — no invented unpublished top-level fields.
    expect(Object.keys(FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE).sort()).toEqual(
      ["workers", "workstations", "workTypes"].sort(),
    );
    for (const field of ["workTypes", "workers", "workstations"] as const) {
      expect(
        surface.querySelector(`[data-schema-field-path="${field}"]`),
      ).toBeTruthy();
    }

    expect(
      examples?.querySelector('[data-schema-example="copy"]'),
    ).toBeTruthy();
  });

  test("navigable $ref links click-traverse to same-page splayed definition anchors", () => {
    const { container } = render(<FactorySchemaReference />);

    const surface = screen.getByTestId("factory-schema-reference");
    expect(surface.getAttribute("data-schema-status")).toBe("ready");
    expect(screen.getByTestId("factory-schema-hash-navigation")).toBeTruthy();

    // Root `workers` is Worker[] (type summary, not a direct $ref row). Use a
    // representative property `$ref` that lands on a splayed catalog definition.
    const orchestratorRow = surface.querySelector(
      '[data-schema-field-path="orchestrator"]',
    );
    expect(orchestratorRow).toBeTruthy();
    const orchestratorRef = orchestratorRow?.querySelector(
      'a[data-schema-ref-kind="resolved"]',
    );
    expect(orchestratorRef).toBeTruthy();

    const href = orchestratorRef?.getAttribute("href") ?? "";
    expect(href.startsWith(`${FACTORY_SCHEMA_PAGE_PATH}#`)).toBe(true);
    expect(href.includes("://")).toBe(false);

    const fragment = href.slice(`${FACTORY_SCHEMA_PAGE_PATH}#`.length);
    expect(fragment.length).toBeGreaterThan(0);

    const definition = surface.querySelector(
      `[data-testid="factory-schema-reference-catalog-/$defs/FactoryOrchestrator"]`,
    );
    expect(definition).toBeInstanceOf(HTMLElement);
    if (!(definition instanceof HTMLElement)) {
      throw new Error("expected FactoryOrchestrator catalog definition");
    }
    expect(definition.getAttribute("id")).toBe(fragment);
    expect(definition.getAttribute("data-schema-definition-pointer")).toBe(
      "/$defs/FactoryOrchestrator",
    );
    expect(orchestratorRef?.getAttribute("data-schema-ref-pointer")).toBe(
      "/$defs/FactoryOrchestrator",
    );

    const focused = focusReferenceHashTarget(container, `#${fragment}`, {
      reduceMotion: true,
    });
    expect(focused).toBe(definition);
    expect(document.activeElement).toBe(definition);

    // Every navigable $ref on this page must land on a rendered definition —
    // no off-page destinations and no invented anchors for unpublished targets.
    const navigableRefs = surface.querySelectorAll(
      'a[data-schema-ref-kind="resolved"], a[data-schema-ref-kind="cycle"]',
    );
    expect(navigableRefs.length).toBeGreaterThan(0);
    for (const link of navigableRefs) {
      const linkHref = link.getAttribute("href") ?? "";
      expect(linkHref.startsWith(`${FACTORY_SCHEMA_PAGE_PATH}#`)).toBe(true);
      const linkFragment = linkHref.slice(
        `${FACTORY_SCHEMA_PAGE_PATH}#`.length,
      );
      const target = surface.querySelector(`#${CSS.escape(linkFragment)}`);
      expect(target).toBeTruthy();
      expect(target?.getAttribute("data-schema-definition-pointer")).toBe(
        link.getAttribute("data-schema-ref-pointer"),
      );
    }

    for (const unresolved of surface.querySelectorAll(
      '[data-schema-ref-kind="missing"], [data-schema-ref-kind="malformed"]',
    )) {
      expect(unresolved.tagName.toLowerCase()).not.toBe("a");
      expect(unresolved.getAttribute("href")).toBeNull();
      expect(
        unresolved.querySelector("[data-schema-ref-unresolved]"),
      ).toBeTruthy();
    }
  });

  test("shows an accessible invalid status when schema acquisition fails", () => {
    render(
      <FactorySchemaReference
        loadModel={() => {
          throw new Error("simulated factory schema acquisition failure");
        }}
      />,
    );

    const surface = screen.getByTestId("factory-schema-reference");
    const alert = screen.getByRole("alert");
    expect(surface.contains(alert)).toBe(true);
    expect(alert.getAttribute("data-schema-status")).toBe("invalid");
    expect(alert.textContent ?? "").toMatch(/Factory schema unavailable/i);
    expect(alert.textContent ?? "").toMatch(
      /simulated factory schema acquisition failure/i,
    );
  });
});

describe("factory-schema right rail", () => {
  afterEach(() => {
    cleanup();
  });

  test("lists every section and definition, and every link lands on the page", async () => {
    const model = loadSchemaVerificationPackageModel("schemas/factory");
    const definitions = collectFactorySchemaSplayDefinitions(
      model.root,
      model.definitions,
    );
    const groups = groupFactorySchemaDefinitions(definitions);
    const toc = buildPageToc();

    // Core section + root definition, then one entry per group and per
    // definition. Pinning the arithmetic is what stops the rail from silently
    // dropping a section when the published schema grows.
    expect(toc).toHaveLength(2 + groups.length + definitions.length);
    expect(toc[0]?.title).toBe("Core configuration");
    expect(toc[1]?.title).toBe("You Factory configuration");
    expect(new Set(toc.map((item) => item.url)).size).toBe(toc.length);

    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "factory-schema",
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

    for (const item of toc) {
      const fragment = String(item.url).slice(1);
      expect(document.getElementById(fragment)).toBeTruthy();
    }
  });
});
