import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  ApiPackageArtifactResolutionError,
  resolveApiPackageArtifact,
} from "./api-package-artifact-resolver";
import {
  API_PACKAGE_FIXED_PUBLIC_SUBPATHS,
  API_PACKAGE_NAME,
  isDocumentedApiPackagePublicSubpath,
  toApiPackageExportSpecifier,
} from "./api-package-public-exports";

describe("api-package-public-exports", () => {
  test("documents every fixed public subpath from the installed package exports map", () => {
    expect([...API_PACKAGE_FIXED_PUBLIC_SUBPATHS]).toEqual([
      "manifest",
      "openapi",
      "cli",
      "mcp",
      "schemas/you-config",
      "schemas/factory",
      "schemas/mock-workers",
      "javascript/runtime",
    ]);

    for (const subpath of API_PACKAGE_FIXED_PUBLIC_SUBPATHS) {
      expect(isDocumentedApiPackagePublicSubpath(subpath)).toBe(true);
      expect(toApiPackageExportSpecifier(subpath)).toBe(
        `${API_PACKAGE_NAME}/${subpath}`,
      );
    }
  });

  test("accepts joined/* public wildcard subpaths without parent segments", () => {
    expect(
      isDocumentedApiPackagePublicSubpath(
        "joined/contracts/common/deprecations.schema.json",
      ),
    ).toBe(true);
    expect(isDocumentedApiPackagePublicSubpath("joined/")).toBe(false);
    expect(isDocumentedApiPackagePublicSubpath("joined/../secret")).toBe(false);
  });
});

describe("resolveApiPackageArtifact", () => {
  test("loads the manifest JSON artifact through its public subpath", () => {
    const artifact = resolveApiPackageArtifact(
      "@you-agent-factory/api/manifest",
    );

    expect(artifact.subpath).toBe("manifest");
    expect(artifact.specifier).toBe("@you-agent-factory/api/manifest");
    expect(artifact.format).toBe("json");
    expect(artifact.resolvedUrl.startsWith("file:")).toBe(true);
    expect(artifact.resolvedPath.includes("node_modules")).toBe(true);
    expect(artifact.data).toBeTruthy();
    expect(typeof artifact.data).toBe("object");
    const data = artifact.data as {
      formatVersion?: unknown;
      exports?: unknown;
      packageId?: unknown;
    };
    expect(typeof data.formatVersion).toBe("string");
    expect(data.packageId).toBe("you-agent-factory.api");
    expect(data.exports).toBeTruthy();
    expect(typeof data.exports).toBe("object");
  });

  test("loads the OpenAPI YAML artifact into structured data", () => {
    const artifact = resolveApiPackageArtifact("openapi");

    expect(artifact.subpath).toBe("openapi");
    expect(artifact.format).toBe("yaml");
    expect(artifact.data).toBeTruthy();
    const data = artifact.data as {
      openapi?: unknown;
      paths?: Record<string, unknown>;
    };
    expect(data.openapi).toBe("3.0.3");
    expect(data.paths).toBeTruthy();
    expect(Object.keys(data.paths ?? {}).length).toBeGreaterThan(0);
  });

  test("loads other fixed JSON public exports through package resolution", () => {
    for (const subpath of [
      "cli",
      "mcp",
      "schemas/factory",
      "schemas/you-config",
      "schemas/mock-workers",
      "javascript/runtime",
    ] as const) {
      const artifact = resolveApiPackageArtifact(
        toApiPackageExportSpecifier(subpath),
      );
      expect(artifact.subpath).toBe(subpath);
      expect(artifact.format).toBe("json");
      expect(artifact.data).toBeTruthy();
      expect(typeof artifact.data).toBe("object");
    }
  });

  test("loads a joined/* public export through package resolution", () => {
    const artifact = resolveApiPackageArtifact(
      "@you-agent-factory/api/joined/contracts/manifest.schema.json",
    );

    expect(artifact.subpath).toBe("joined/contracts/manifest.schema.json");
    expect(artifact.format).toBe("json");
    expect(artifact.data).toBeTruthy();
    expect(typeof artifact.data).toBe("object");
  });

  test("rejects the package root with an actionable illegal-target error", () => {
    expect(() => resolveApiPackageArtifact("@you-agent-factory/api")).toThrow(
      ApiPackageArtifactResolutionError,
    );

    try {
      resolveApiPackageArtifact("@you-agent-factory/api/");
      throw new Error("expected package-root rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageArtifactResolutionError);
      const resolutionError = error as ApiPackageArtifactResolutionError;
      expect(resolutionError.code).toBe("illegal-target");
      expect(resolutionError.target).toBe("@you-agent-factory/api/");
      expect(resolutionError.message).toContain("package-root");
      expect(resolutionError.message).toContain("@you-agent-factory/api/");
    }
  });

  test("rejects package-internal generated/... export targets", () => {
    const illegal = "@you-agent-factory/api/generated/manifest.json";

    try {
      resolveApiPackageArtifact(illegal);
      throw new Error("expected package-internal rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageArtifactResolutionError);
      const resolutionError = error as ApiPackageArtifactResolutionError;
      expect(resolutionError.code).toBe("illegal-target");
      expect(resolutionError.target).toBe(illegal);
      expect(resolutionError.message).toContain("generated/");
      expect(resolutionError.message).toContain(illegal);
    }
  });

  test("rejects raw filesystem paths under the package tree", () => {
    const absolutePath = join(
      process.cwd(),
      "node_modules/@you-agent-factory/api/generated/manifest.json",
    );

    try {
      resolveApiPackageArtifact(absolutePath);
      throw new Error("expected filesystem-path rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageArtifactResolutionError);
      const resolutionError = error as ApiPackageArtifactResolutionError;
      expect(resolutionError.code).toBe("illegal-target");
      expect(resolutionError.target).toBe(absolutePath);
      expect(resolutionError.message).toContain(absolutePath);
      expect(resolutionError.message).toMatch(
        /filesystem|public package exports/i,
      );
    }
  });

  test("rejects relative package-internal filesystem paths", () => {
    const relativePath =
      "./node_modules/@you-agent-factory/api/generated/cli/commands.json";

    try {
      resolveApiPackageArtifact(relativePath);
      throw new Error("expected relative filesystem-path rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageArtifactResolutionError);
      const resolutionError = error as ApiPackageArtifactResolutionError;
      expect(resolutionError.code).toBe("illegal-target");
      expect(resolutionError.target).toBe(relativePath);
      expect(resolutionError.message).toContain(relativePath);
    }
  });

  test("fails closed for a missing public export with the requested subpath named", () => {
    const missing = "@you-agent-factory/api/schemas/does-not-exist";

    try {
      resolveApiPackageArtifact(missing);
      throw new Error("expected missing-export rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageArtifactResolutionError);
      const resolutionError = error as ApiPackageArtifactResolutionError;
      expect(resolutionError.code).toBe("missing-export");
      expect(resolutionError.subpath).toBe("schemas/does-not-exist");
      expect(resolutionError.message).toContain("schemas/does-not-exist");
      expect(resolutionError.message).toContain(missing);
    }
  });

  test("surfaces package resolution failures as missing-export for documented subpaths", () => {
    try {
      resolveApiPackageArtifact("@you-agent-factory/api/manifest", {
        resolveExport: () => {
          throw new Error("export missing from install");
        },
      });
      throw new Error("expected injected resolve failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageArtifactResolutionError);
      const resolutionError = error as ApiPackageArtifactResolutionError;
      expect(resolutionError.code).toBe("missing-export");
      expect(resolutionError.subpath).toBe("manifest");
      expect(resolutionError.message).toContain("manifest");
      expect(resolutionError.message).toContain(
        "@you-agent-factory/api/manifest",
      );
    }
  });

  test("does not hard-code node_modules generated paths for successful resolution", () => {
    const seenSpecifiers: string[] = [];
    const artifact = resolveApiPackageArtifact("cli", {
      resolveExport: (specifier) => {
        seenSpecifiers.push(specifier);
        return import.meta.resolve(specifier);
      },
    });

    expect(seenSpecifiers).toEqual(["@you-agent-factory/api/cli"]);
    expect(artifact.specifier).toBe("@you-agent-factory/api/cli");
    expect(artifact.format).toBe("json");
  });
});
