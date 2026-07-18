import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONCEPTS_DOCS_ROOT,
  CONTENT_ROOT,
  DOCS_ROOT,
  DOCS_SECTIONS,
  DOCUMENTATION_DOCS_ROOT,
  GENERATED_CONTENT_RUNTIME_ROOT,
  GENERATED_DOCS_SOURCE_ROOT,
  GLOSSARY_DOCS_ROOT,
  GUIDES_DOCS_ROOT,
  getConceptsDocsRoot,
  getContentRoot,
  getDocsPageDir,
  getDocsRoot,
  getDocsSectionRoot,
  getDocumentationDocsRoot,
  getGeneratedContentRuntimeRoot,
  getGeneratedDocsSourceRoot,
  getGlossaryDocsRoot,
  getGuidesDocsRoot,
  getMessagesRoot,
  getProjectRoot,
  getRegistryCollectionRoot,
  getRegistryRoot,
  getTagMessagesRoot,
  getTechniquesDocsRoot,
  MESSAGES_ROOT,
  REGISTRY_COLLECTIONS,
  REGISTRY_ROOT,
  TAG_MESSAGES_ROOT,
  TECHNIQUES_DOCS_ROOT,
} from "./content-paths";
import {
  findNewOrdinaryPageDirExports,
  formatNewPageDirExportViolation,
} from "./content-paths-page-dir-guard";

describe("content-paths", () => {
  test("roots resolve under src/content from the project directory", () => {
    const projectRoot = getProjectRoot();
    const contentRoot = getContentRoot(projectRoot);

    expect(contentRoot).toBe(join(projectRoot, "src/content"));
    expect(getDocsRoot(contentRoot)).toBe(join(contentRoot, "docs"));
    expect(getGlossaryDocsRoot()).toBe(join(contentRoot, "docs", "glossary"));
    expect(getRegistryRoot(contentRoot)).toBe(join(contentRoot, "registry"));
    expect(getMessagesRoot(contentRoot)).toBe(join(contentRoot, "messages"));
    expect(getTagMessagesRoot()).toBe(
      join(contentRoot, "registry", "tags", "messages"),
    );
  });

  test("generic docs section helpers derive canonical section roots", () => {
    for (const section of DOCS_SECTIONS) {
      expect(getDocsSectionRoot(section)).toBe(join(DOCS_ROOT, section));
    }

    expect(getGlossaryDocsRoot()).toBe(getDocsSectionRoot("glossary"));
  });

  test("generic docs page helper derives representative page directories for every docs section", () => {
    const representativePages = [
      {
        section: "guides",
        slug: "getting-started",
        sectionRoot: GUIDES_DOCS_ROOT,
      },
      { section: "concepts", slug: "alibi", sectionRoot: CONCEPTS_DOCS_ROOT },
      {
        section: "techniques",
        slug: "prompt-caching",
        sectionRoot: TECHNIQUES_DOCS_ROOT,
      },
      {
        section: "documentation",
        slug: "cli-reference",
        sectionRoot: DOCUMENTATION_DOCS_ROOT,
      },
      { section: "glossary", slug: "token", sectionRoot: GLOSSARY_DOCS_ROOT },
      {
        section: "workers",
        slug: "agent/variant",
        sectionRoot: getDocsSectionRoot("workers"),
      },
    ] as const;

    for (const { section, slug, sectionRoot } of representativePages) {
      expect(getDocsPageDir(section, slug)).toBe(
        join(sectionRoot, ...slug.split("/")),
      );
      expect(getDocsPageDir(section, slug)).toBe(
        join(DOCS_ROOT, section, ...slug.split("/")),
      );
    }
  });

  test("generic docs page helper preserves section-plus-slug invariants for custom roots", () => {
    const docsRoot = "/tmp/factory-docs/docs";
    const representativePages = [
      { section: "guides", slug: "getting-started" },
      { section: "concepts", slug: "alibi" },
      { section: "techniques", slug: "prompt-caching" },
      { section: "documentation", slug: "cli-reference" },
      { section: "glossary", slug: "token" },
    ] as const;

    for (const { section, slug } of representativePages) {
      const sectionRoot = getDocsSectionRoot(section, docsRoot);

      expect(sectionRoot).toBe(join(docsRoot, section));
      expect(getDocsPageDir(section, slug, docsRoot)).toBe(
        join(sectionRoot, slug),
      );
    }
  });

  test("generic registry collection helpers derive canonical collection roots", () => {
    for (const collection of REGISTRY_COLLECTIONS) {
      expect(getRegistryCollectionRoot(collection)).toBe(
        join(REGISTRY_ROOT, collection),
      );
    }

    expect(getTagMessagesRoot()).toBe(
      join(getRegistryCollectionRoot("tags"), "messages"),
    );
  });

  test("generic registry helpers preserve collection derivation invariants for custom roots", () => {
    const registryRoot = "/tmp/factory-docs/registry";

    for (const collection of REGISTRY_COLLECTIONS) {
      expect(getRegistryCollectionRoot(collection, registryRoot)).toBe(
        join(registryRoot, collection),
      );
    }

    expect(getTagMessagesRoot(registryRoot)).toBe(
      join(registryRoot, "tags", "messages"),
    );
  });

  test("exported production roots match helper-derived paths", () => {
    expect(CONTENT_ROOT.endsWith("src/content")).toBe(true);
    expect(DOCS_ROOT).toBe(getDocsRoot());
    expect(GLOSSARY_DOCS_ROOT).toBe(getGlossaryDocsRoot());
    expect(GUIDES_DOCS_ROOT).toBe(getGuidesDocsRoot());
    expect(CONCEPTS_DOCS_ROOT).toBe(getConceptsDocsRoot());
    expect(TECHNIQUES_DOCS_ROOT).toBe(getTechniquesDocsRoot());
    expect(DOCUMENTATION_DOCS_ROOT).toBe(getDocumentationDocsRoot());
    expect(REGISTRY_ROOT).toBe(getRegistryRoot());
    expect(GENERATED_CONTENT_RUNTIME_ROOT).toBe(
      getGeneratedContentRuntimeRoot(),
    );
    expect(GENERATED_DOCS_SOURCE_ROOT).toBe(getGeneratedDocsSourceRoot());
    expect(MESSAGES_ROOT).toBe(getMessagesRoot());
    expect(TAG_MESSAGES_ROOT).toBe(getTagMessagesRoot());
  });

  test("content-paths.ts does not add new ordinary page directory constants", () => {
    const source = readFileSync(
      join(import.meta.dir, "content-paths.ts"),
      "utf8",
    );
    const newExports = findNewOrdinaryPageDirExports(source);

    if (newExports.length > 0) {
      throw new Error(formatNewPageDirExportViolation(newExports));
    }
  });

  test("page directory guard explains derived lookup replacement on violations", () => {
    const sampleSource = [
      'export const GPT_2_MODEL_PAGE_DIR = join(MODELS_DOCS_ROOT, "gpt-2");',
    ].join("\n");
    const newExports = findNewOrdinaryPageDirExports(sampleSource);
    const message = formatNewPageDirExportViolation(newExports);

    expect(newExports).toEqual(["GPT_2_MODEL_PAGE_DIR"]);
    expect(message).toContain("getDocsPageDir");
    expect(message).toContain('getDocsPageDir("concepts", "my-page-slug")');
    expect(message).toContain("section and slug");
    expect(message).toContain("getDocsRoot");
    expect(message).toContain("getDocsSectionRoot");
  });
});
