import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import {
  isYouAgentFactoryApiPublicSubpath,
  loadYouAgentFactoryApiArtifact,
  resolveYouAgentFactoryApiArtifactPath,
  toYouAgentFactoryApiExportSpecifier,
  YOU_AGENT_FACTORY_API_PACKAGE,
  YOU_AGENT_FACTORY_API_PUBLIC_SUBPATHS,
  YouAgentFactoryApiArtifactResolutionError,
} from "@/lib/references/api-package-artifact-resolver";

describe("you-agent-factory api package artifact resolver", () => {
  test("lists the documented public subpaths used by the reference bootstrap", () => {
    expect(YOU_AGENT_FACTORY_API_PACKAGE).toBe("@you-agent-factory/api");
    expect([...YOU_AGENT_FACTORY_API_PUBLIC_SUBPATHS]).toEqual([
      "manifest",
      "openapi",
      "cli",
      "mcp",
      "schemas/factory",
      "schemas/you-config",
      "schemas/mock-workers",
      "javascript/runtime",
    ]);
  });

  test("resolves every public subpath to a readable installed artifact", () => {
    for (const subpath of YOU_AGENT_FACTORY_API_PUBLIC_SUBPATHS) {
      expect(isYouAgentFactoryApiPublicSubpath(subpath)).toBe(true);
      expect(toYouAgentFactoryApiExportSpecifier(subpath)).toBe(
        `${YOU_AGENT_FACTORY_API_PACKAGE}/${subpath}`,
      );

      const absolutePath = resolveYouAgentFactoryApiArtifactPath(subpath);
      expect(absolutePath.includes("node_modules")).toBe(true);
      expect(existsSync(absolutePath)).toBe(true);

      const contents = loadYouAgentFactoryApiArtifact(subpath);
      expect(contents.length).toBeGreaterThan(0);
      expect(contents).toBe(readFileSync(absolutePath, "utf8"));
    }
  });

  test("resolved paths use package resolution rather than a hardcoded node_modules join", () => {
    const manifestPath = resolveYouAgentFactoryApiArtifactPath("manifest");
    expect(basename(manifestPath)).toBe("manifest.json");
    expect(
      manifestPath.endsWith("/@you-agent-factory/api/generated/manifest.json"),
    ).toBe(true);

    const openapiPath = resolveYouAgentFactoryApiArtifactPath("openapi");
    expect(basename(openapiPath)).toBe("openapi.yaml");
  });

  test("loads the manifest and openapi artifacts with expected markers", () => {
    const manifest = JSON.parse(loadYouAgentFactoryApiArtifact("manifest")) as {
      packageId?: string;
      exports?: Record<string, unknown>;
    };
    expect(manifest.packageId).toBe("you-agent-factory.api");
    expect(manifest.exports).toBeDefined();

    const openapi = loadYouAgentFactoryApiArtifact("openapi");
    expect(openapi).toContain("openapi:");
  });

  test("rejects the package root with an actionable error", () => {
    for (const subpath of ["", ".", YOU_AGENT_FACTORY_API_PACKAGE]) {
      expect(() => resolveYouAgentFactoryApiArtifactPath(subpath)).toThrow(
        YouAgentFactoryApiArtifactResolutionError,
      );

      try {
        resolveYouAgentFactoryApiArtifactPath(subpath);
        throw new Error(`expected rejection for ${JSON.stringify(subpath)}`);
      } catch (error) {
        expect(error).toBeInstanceOf(YouAgentFactoryApiArtifactResolutionError);
        const resolutionError =
          error as YouAgentFactoryApiArtifactResolutionError;
        expect(resolutionError.reason).toBe("package-root");
        expect(resolutionError.message).toContain("package root");
        expect(resolutionError.message).toContain("public subpath");
      }
    }
  });

  test("rejects package-internal and undocumented locators with actionable errors", () => {
    const rejected = [
      "generated/manifest.json",
      "generated/openapi/openapi.yaml",
      "package.json",
      "joined/contracts/manifest.schema.json",
      "../package.json",
      "schemas/unknown",
    ];

    for (const subpath of rejected) {
      expect(isYouAgentFactoryApiPublicSubpath(subpath)).toBe(false);
      expect(() => resolveYouAgentFactoryApiArtifactPath(subpath)).toThrow(
        YouAgentFactoryApiArtifactResolutionError,
      );

      try {
        resolveYouAgentFactoryApiArtifactPath(subpath);
        throw new Error(`expected rejection for ${subpath}`);
      } catch (error) {
        expect(error).toBeInstanceOf(YouAgentFactoryApiArtifactResolutionError);
        const resolutionError =
          error as YouAgentFactoryApiArtifactResolutionError;
        expect(resolutionError.reason).toBe("non-public");
        expect(resolutionError.message).toContain("non-public");
        expect(resolutionError.message).toContain("Allowed public subpaths");
        expect(resolutionError.message).toContain(subpath);
      }
    }
  });
});
