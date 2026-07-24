/**
 * Closeout story 001 — tip proofs for deterministic packaged-factories corpus
 * generation, manifest source hashes (0.0.2 + SHA-256), and unabridged
 * factory.json panels on the parent index.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import generatedIndex from "@/content/docs/references/packaged-factories-index/generated/index.json";
import { PackagedFactoriesIndex } from "@/content/docs/references/packaged-factories-index/PackagedFactoriesIndex";
import { getProjectRoot } from "@/lib/content/content-paths";
import { PACKAGED_FACTORY_V002_VERSION } from "@/lib/packaged-factory-v002/five-package-pins";
import { PACKAGED_FACTORIES_ALLOWLIST_SLUGS } from "@/lib/packaged-factory-v002/packaged-factories-allowlist";
import {
  assertPackagedFactoryCloseoutGenerationIsDeterministic,
  assertPackagedFactoryCloseoutManifestContract,
  assertPackagedFactoryCloseoutUnabridgedDefinitions,
  loadCommittedPackagedFactoriesIndexManifest,
  loadCommittedPackagedFactoryDefinitionTexts,
  PackagedFactoryCloseoutCorpusError,
  packagedFactoryCloseoutExpectedSourceRelativePaths,
  provePackagedFactoryReferenceFamilyCloseoutCorpus,
} from "./packaged-factory-reference-family-closeout-corpus";

const tempDirs: string[] = [];

afterEach(() => {
  cleanup();
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir !== undefined) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("packaged-factory-reference-family-closeout corpus (pure)", () => {
  test("manifest contract fails closed on wrong package version", () => {
    expect(() =>
      assertPackagedFactoryCloseoutManifestContract({
        packageVersion: "9.9.9",
        sourceHashes: packagedFactoryCloseoutExpectedSourceRelativePaths().map(
          (relativePath) => ({
            relativePath,
            sha256: "a".repeat(64),
          }),
        ),
      }),
    ).toThrow(PackagedFactoryCloseoutCorpusError);

    try {
      assertPackagedFactoryCloseoutManifestContract({
        packageVersion: "9.9.9",
        sourceHashes: packagedFactoryCloseoutExpectedSourceRelativePaths().map(
          (relativePath) => ({
            relativePath,
            sha256: "a".repeat(64),
          }),
        ),
      });
    } catch (error) {
      expect(error).toBeInstanceOf(PackagedFactoryCloseoutCorpusError);
      if (error instanceof PackagedFactoryCloseoutCorpusError) {
        expect(error.code).toBe("wrong-package-version");
      }
    }
  });

  test("manifest contract fails closed on non-SHA-256 digests", () => {
    expect(() =>
      assertPackagedFactoryCloseoutManifestContract({
        packageVersion: PACKAGED_FACTORY_V002_VERSION,
        sourceHashes: packagedFactoryCloseoutExpectedSourceRelativePaths().map(
          (relativePath) => ({
            relativePath,
            sha256: "not-a-sha256",
          }),
        ),
      }),
    ).toThrow(PackagedFactoryCloseoutCorpusError);
  });

  test("unabridged definition assert fails closed on truncated panel text", () => {
    const corpus = {
      packageName: "@you-agent-factory/packaged-factories",
      packageVersion: PACKAGED_FACTORY_V002_VERSION,
      entries: PACKAGED_FACTORIES_ALLOWLIST_SLUGS.map((slug) => ({
        canonicalName: `@you/${slug}`,
        packagedDescription: null,
        childSlug: slug,
        packageVersion: PACKAGED_FACTORY_V002_VERSION,
        sourceRelativePath: `factories/${slug}/factory.json`,
        factoryJsonText: `{"name":"@you/${slug}"}\n`,
      })),
    };
    const texts = new Map(
      PACKAGED_FACTORIES_ALLOWLIST_SLUGS.map((slug) => [
        slug,
        `{"name":"@you/${slug}","truncated":true}\n`,
      ]),
    );

    expect(() =>
      assertPackagedFactoryCloseoutUnabridgedDefinitions({
        corpus,
        definitionTextsBySlug: texts,
      }),
    ).toThrow(PackagedFactoryCloseoutCorpusError);
  });
});

describe("packaged-factory-reference-family-closeout corpus (tip)", () => {
  test("generation path is deterministic across repeated runs", () => {
    const outputDir = mkdtempSync(
      join(tmpdir(), "packaged-factory-closeout-corpus-"),
    );
    tempDirs.push(outputDir);

    expect(() =>
      assertPackagedFactoryCloseoutGenerationIsDeterministic({
        outputDir,
        consumerDir: getProjectRoot(),
      }),
    ).not.toThrow();
  });

  test("committed manifest records 0.0.2 and SHA-256 hashes for every allowlisted source", () => {
    const manifest = loadCommittedPackagedFactoriesIndexManifest();
    assertPackagedFactoryCloseoutManifestContract(manifest);
    expect(manifest.packageVersion).toBe(PACKAGED_FACTORY_V002_VERSION);
    expect(manifest.sourceHashes.map((entry) => entry.relativePath)).toEqual([
      ...packagedFactoryCloseoutExpectedSourceRelativePaths(),
    ]);
  });

  test("tip closeout corpus proof verifies drift, hashes, and unabridged definitions", () => {
    const evidence = provePackagedFactoryReferenceFamilyCloseoutCorpus({
      corpus: generatedIndex,
    });

    expect(evidence.packageVersion).toBe(PACKAGED_FACTORY_V002_VERSION);
    expect(evidence.allowlistOrder).toEqual([
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
    ]);
    expect(evidence.sourceHashCount).toBe(
      PACKAGED_FACTORIES_ALLOWLIST_SLUGS.length + 1,
    );
    expect(evidence.artifactCount).toBeGreaterThan(0);
    expect(evidence.unabridgedDefinitionSlugs).toEqual([
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
    ]);
    expect(
      evidence.committedRoot.endsWith("packaged-factories-index/generated"),
    ).toBe(true);
  });

  test("parent index renders unabridged factory.json panels matching committed artifacts", () => {
    const definitionTexts = loadCommittedPackagedFactoryDefinitionTexts();

    render(<PackagedFactoriesIndex />);

    const root = screen.getByTestId("packaged-factories-index");
    expect(root.getAttribute("data-packaged-factories-index-version")).toBe(
      PACKAGED_FACTORY_V002_VERSION,
    );

    const articles = within(root).getAllByRole("article");
    expect(articles.map((node) => node.id)).toEqual([
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
    ]);

    for (const [index, slug] of PACKAGED_FACTORIES_ALLOWLIST_SLUGS.entries()) {
      const article = articles[index];
      expect(article).toBeTruthy();
      if (!article) {
        throw new Error(`missing article for ${slug}`);
      }

      const expectedDefinition = definitionTexts.get(slug);
      expect(expectedDefinition).toBeDefined();
      if (expectedDefinition === undefined) {
        throw new Error(`missing committed definition for ${slug}`);
      }

      const code = within(article).getByTestId(
        `packaged-factory-definition-${slug}`,
      );
      expect(code.tagName).toBe("PRE");
      expect(code.textContent).toBe(expectedDefinition);
      expect(code.textContent).toBe(
        generatedIndex.entries[index]?.factoryJsonText,
      );
    }
  });
});
