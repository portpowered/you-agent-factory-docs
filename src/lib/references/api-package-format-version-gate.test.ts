import { describe, expect, test } from "bun:test";
import {
  ApiPackageFormatVersionError,
  validateConsumedApiPackageExportFormatVersions,
  validateConsumedApiPackageExportFormatVersionsForFamilies,
} from "./api-package-format-version-gate";
import {
  assertSupportedApiPackageExportFormatVersions,
  assertSupportedApiPackageManifestFormatVersion,
  SUPPORTED_API_PACKAGE_ARTIFACT_BODY_FORMAT_VERSIONS,
  SUPPORTED_API_PACKAGE_FAMILY_FORMAT_VERSIONS,
  SUPPORTED_API_PACKAGE_MANIFEST_FORMAT_VERSION,
} from "./api-package-format-versions";
import type {
  ApiPackageManifest,
  ApiPackageManifestExportEntry,
} from "./api-package-manifest";
import { loadApiPackageManifest } from "./api-package-manifest-membership";
import { API_PACKAGE_FIXED_PUBLIC_SUBPATHS } from "./api-package-public-exports";

const VALID_HASH =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function validMembershipEntry(
  overrides: Partial<ApiPackageManifestExportEntry> & {
    path: string;
    family: string;
  },
): ApiPackageManifestExportEntry {
  const itemId = `generated.${overrides.family}.fixture`;
  return {
    artifactHash: VALID_HASH,
    documentation: {
      formatVersion: "1.0.0",
      itemId,
      documentation: {
        title: {
          id: `${itemId}.title`,
          canonicalEnglish: "Fixture title",
        },
        description: {
          id: `${itemId}.description`,
          canonicalEnglish: "Fixture description",
        },
      },
      examples: [overrides.path],
      visibility: "public",
      sourceHash: VALID_HASH,
    },
    lifecycle: {
      formatVersion: "1.0.0",
      itemId,
      since: "0.0.0",
      state: "active",
    },
    ...overrides,
  };
}

function fixtureManifest(
  overrides: Partial<ApiPackageManifest> = {},
): ApiPackageManifest {
  return {
    formatVersion: SUPPORTED_API_PACKAGE_MANIFEST_FORMAT_VERSION,
    packageId: "you-agent-factory.api",
    packageVersion: "0.0.0",
    sourceCommit: "abc",
    familyFormatVersions: { ...SUPPORTED_API_PACKAGE_FAMILY_FORMAT_VERSIONS },
    exports: {
      "generated.cli.commands": validMembershipEntry({
        path: "generated/cli/commands.json",
        family: "cli",
      }),
    },
    ...overrides,
  };
}

describe("assertSupportedApiPackageManifestFormatVersion", () => {
  test("accepts the installed package manifest format version", () => {
    const manifest = loadApiPackageManifest();
    expect(() =>
      assertSupportedApiPackageManifestFormatVersion(manifest),
    ).not.toThrow();
    expect(manifest.formatVersion).toBe(
      SUPPORTED_API_PACKAGE_MANIFEST_FORMAT_VERSION,
    );
  });

  test("fails closed on an unsupported publication-manifest format version", () => {
    const manifest = fixtureManifest({ formatVersion: "9.9.9" });
    try {
      assertSupportedApiPackageManifestFormatVersion(manifest, {
        subpath: "manifest",
      });
      throw new Error("expected unsupported-manifest-format-version");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageFormatVersionError);
      const formatError = error as ApiPackageFormatVersionError;
      expect(formatError.code).toBe("unsupported-manifest-format-version");
      expect(formatError.observedVersion).toBe("9.9.9");
      expect(formatError.message).toContain("9.9.9");
      expect(formatError.message).toMatch(/docs build does not support/i);
      expect(formatError.message).toContain(
        SUPPORTED_API_PACKAGE_MANIFEST_FORMAT_VERSION,
      );
    }
  });
});

describe("assertSupportedApiPackageExportFormatVersions", () => {
  test("accepts known family and artifact body versions for the installed package", () => {
    const manifest = fixtureManifest();
    const entry = manifest.exports["generated.cli.commands"];
    expect(entry).toBeDefined();
    if (entry === undefined) {
      throw new Error("expected fixture export");
    }

    expect(() =>
      assertSupportedApiPackageExportFormatVersions({
        manifest,
        entry,
        artifactData: {
          formatVersion:
            SUPPORTED_API_PACKAGE_ARTIFACT_BODY_FORMAT_VERSIONS.cli,
          commands: [],
        },
        context: {
          subpath: "cli",
          exportId: "generated.cli.commands",
          dependentReferenceFamily: "cli-reference",
        },
      }),
    ).not.toThrow();
  });

  test("fails closed when a family format version is unsupported", () => {
    const manifest = fixtureManifest({
      familyFormatVersions: {
        ...SUPPORTED_API_PACKAGE_FAMILY_FORMAT_VERSIONS,
        cli: "2.0.0",
      },
    });
    const entry = manifest.exports["generated.cli.commands"];
    expect(entry).toBeDefined();
    if (entry === undefined) {
      throw new Error("expected fixture export");
    }

    try {
      assertSupportedApiPackageExportFormatVersions({
        manifest,
        entry,
        artifactData: {
          formatVersion:
            SUPPORTED_API_PACKAGE_ARTIFACT_BODY_FORMAT_VERSIONS.cli,
        },
        context: {
          subpath: "cli",
          exportId: "generated.cli.commands",
          dependentReferenceFamily: "cli-reference",
        },
      });
      throw new Error("expected unsupported-family-format-version");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageFormatVersionError);
      const formatError = error as ApiPackageFormatVersionError;
      expect(formatError.code).toBe("unsupported-family-format-version");
      expect(formatError.family).toBe("cli");
      expect(formatError.observedVersion).toBe("2.0.0");
      expect(formatError.subpath).toBe("cli");
      expect(formatError.message).toContain("cli");
      expect(formatError.message).toContain("2.0.0");
      expect(formatError.message).toMatch(/docs build does not support/i);
    }
  });

  test("fails closed when an artifact body format version is unsupported", () => {
    const manifest = fixtureManifest();
    const entry = manifest.exports["generated.cli.commands"];
    expect(entry).toBeDefined();
    if (entry === undefined) {
      throw new Error("expected fixture export");
    }

    try {
      assertSupportedApiPackageExportFormatVersions({
        manifest,
        entry,
        artifactData: { formatVersion: "cli-command-identity/v99" },
        context: {
          subpath: "cli",
          exportId: "generated.cli.commands",
        },
      });
      throw new Error("expected unsupported-artifact-format-version");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageFormatVersionError);
      const formatError = error as ApiPackageFormatVersionError;
      expect(formatError.code).toBe("unsupported-artifact-format-version");
      expect(formatError.family).toBe("cli");
      expect(formatError.observedVersion).toBe("cli-command-identity/v99");
      expect(formatError.message).toContain("cli-command-identity/v99");
      expect(formatError.message).toContain(
        SUPPORTED_API_PACKAGE_ARTIFACT_BODY_FORMAT_VERSIONS.cli,
      );
      expect(formatError.message).toMatch(/docs build does not support/i);
    }
  });
});

describe("validateConsumedApiPackageExportFormatVersions", () => {
  test("accepts known supported versions for each fixed non-manifest public export", () => {
    const consumable = API_PACKAGE_FIXED_PUBLIC_SUBPATHS.filter(
      (subpath) => subpath !== "manifest",
    );

    for (const subpath of consumable) {
      const result = validateConsumedApiPackageExportFormatVersions(subpath, {
        dependentReferenceFamily: `${subpath}-reference`,
      });
      expect(result.subpath).toBe(subpath);
      expect(result.dependentReferenceFamily).toBe(`${subpath}-reference`);
      expect(result.entry.family.length).toBeGreaterThan(0);
      expect(
        Object.hasOwn(
          SUPPORTED_API_PACKAGE_FAMILY_FORMAT_VERSIONS,
          result.entry.family,
        ),
      ).toBe(true);
    }
  });

  test("batch-gates installed package exports used by reference families", () => {
    const results = validateConsumedApiPackageExportFormatVersionsForFamilies([
      { target: "cli", dependentReferenceFamily: "cli-reference" },
      { target: "mcp", dependentReferenceFamily: "mcp-reference" },
      {
        target: "javascript/runtime",
        dependentReferenceFamily: "javascript-reference",
      },
      { target: "openapi", dependentReferenceFamily: "openapi-reference" },
    ]);

    expect(results.map((result) => result.subpath)).toEqual([
      "cli",
      "mcp",
      "javascript/runtime",
      "openapi",
    ]);
    expect(results.map((result) => result.dependentReferenceFamily)).toEqual([
      "cli-reference",
      "mcp-reference",
      "javascript-reference",
      "openapi-reference",
    ]);
  });

  test("fails closed when a required artifact is missing from the published manifest", () => {
    const authority = loadApiPackageManifest();
    const stripped: ApiPackageManifest = {
      ...authority,
      exports: Object.fromEntries(
        Object.entries(authority.exports).filter(
          ([, entry]) => entry.path !== "generated/cli/commands.json",
        ),
      ),
    };

    try {
      validateConsumedApiPackageExportFormatVersions("cli", {
        dependentReferenceFamily: "cli-reference",
        manifest: stripped,
      });
      throw new Error("expected missing-artifact");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageFormatVersionError);
      const formatError = error as ApiPackageFormatVersionError;
      expect(formatError.code).toBe("missing-artifact");
      expect(formatError.subpath).toBe("cli");
      expect(formatError.dependentReferenceFamily).toBe("cli-reference");
      expect(formatError.message).toContain("cli");
      expect(formatError.message).toContain("cli-reference");
      expect(formatError.message).toMatch(/Missing required/i);
    }
  });

  test("fails closed when a required public export is missing", () => {
    try {
      validateConsumedApiPackageExportFormatVersions(
        "@you-agent-factory/api/does-not-exist",
        { dependentReferenceFamily: "factory-reference" },
      );
      throw new Error("expected missing-artifact");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageFormatVersionError);
      const formatError = error as ApiPackageFormatVersionError;
      expect(formatError.code).toBe("missing-artifact");
      expect(formatError.dependentReferenceFamily).toBe("factory-reference");
      expect(formatError.message).toContain("does-not-exist");
      expect(formatError.message).toContain("factory-reference");
    }
  });

  test("fails closed when installed family format versions are overridden to unsupported values", () => {
    const authority = loadApiPackageManifest();
    const unsupported: ApiPackageManifest = {
      ...authority,
      familyFormatVersions: {
        ...authority.familyFormatVersions,
        cli: "99.0.0",
      },
    };

    try {
      validateConsumedApiPackageExportFormatVersions("cli", {
        dependentReferenceFamily: "cli-reference",
        manifest: unsupported,
      });
      throw new Error("expected unsupported-family-format-version");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageFormatVersionError);
      const formatError = error as ApiPackageFormatVersionError;
      expect(formatError.code).toBe("unsupported-family-format-version");
      expect(formatError.family).toBe("cli");
      expect(formatError.observedVersion).toBe("99.0.0");
      expect(formatError.message).toMatch(/docs build does not support/i);
    }
  });
});
