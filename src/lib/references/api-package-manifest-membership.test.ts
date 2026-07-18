import { describe, expect, test } from "bun:test";
import {
  type ApiPackageManifest,
  type ApiPackageManifestExportEntry,
  ApiPackageManifestParseError,
  indexApiPackageManifestExportsByPath,
  packageRelativePathFromResolvedArtifactPath,
  parseApiPackageManifest,
  parseApiPackageManifestExportEntry,
} from "./api-package-manifest";
import {
  ApiPackageManifestMembershipError,
  loadApiPackageManifest,
  validateConsumedApiPackageExportMembership,
  validateConsumedApiPackageExportMemberships,
} from "./api-package-manifest-membership";
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

describe("parseApiPackageManifest", () => {
  test("parses the installed package manifest through structured membership fields", () => {
    const manifest = loadApiPackageManifest();

    expect(manifest.packageId).toBe("you-agent-factory.api");
    expect(typeof manifest.formatVersion).toBe("string");
    expect(typeof manifest.packageVersion).toBe("string");
    expect(typeof manifest.sourceCommit).toBe("string");
    expect(Object.keys(manifest.familyFormatVersions).length).toBeGreaterThan(
      0,
    );
    expect(Object.keys(manifest.exports).length).toBeGreaterThan(0);

    for (const [exportId, entry] of Object.entries(manifest.exports)) {
      expect(exportId.length).toBeGreaterThan(0);
      expect(entry.path.startsWith("generated/")).toBe(true);
      expect(entry.family.length).toBeGreaterThan(0);
      expect(entry.artifactHash).toMatch(/^[0-9a-f]{64}$/);
      expect(entry.lifecycle.state).toBeTruthy();
      expect(entry.documentation.visibility).toMatch(/^(public|internal)$/);
    }
  });

  test("fails closed when required manifest fields are missing", () => {
    expect(() => parseApiPackageManifest({ packageId: "x" })).toThrow(
      ApiPackageManifestParseError,
    );

    try {
      parseApiPackageManifest({
        formatVersion: "1.0.0",
        packageId: "you-agent-factory.api",
        packageVersion: "0.0.0",
        sourceCommit: "abc",
        familyFormatVersions: {},
        exports: "not-an-object",
      });
      throw new Error("expected malformed-manifest");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageManifestParseError);
      const parseError = error as ApiPackageManifestParseError;
      expect(parseError.code).toBe("malformed-manifest");
      expect(parseError.message).toContain("exports");
    }
  });

  test("fails closed when a membership entry has a malformed hash", () => {
    try {
      parseApiPackageManifestExportEntry(
        "generated.cli.commands",
        validMembershipEntry({
          path: "generated/cli/commands.json",
          family: "cli",
          artifactHash: "not-a-hash",
        }),
      );
      throw new Error("expected malformed-membership");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageManifestParseError);
      const parseError = error as ApiPackageManifestParseError;
      expect(parseError.code).toBe("malformed-membership");
      expect(parseError.exportId).toBe("generated.cli.commands");
      expect(parseError.field).toBe("artifactHash");
      expect(parseError.message).toContain("generated.cli.commands");
      expect(parseError.message).toContain("artifactHash");
    }
  });

  test("fails closed when lifecycle or documentation metadata is missing", () => {
    try {
      parseApiPackageManifestExportEntry("generated.mcp.tools", {
        path: "generated/mcp/tools.json",
        family: "mcp",
        artifactHash: VALID_HASH,
      });
      throw new Error("expected malformed-membership");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageManifestParseError);
      const parseError = error as ApiPackageManifestParseError;
      expect(parseError.code).toBe("malformed-membership");
      expect(parseError.exportId).toBe("generated.mcp.tools");
      expect(parseError.message).toContain("generated.mcp.tools");
    }
  });
});

describe("packageRelativePathFromResolvedArtifactPath", () => {
  test("extracts generated/... paths from installed package locations", () => {
    expect(
      packageRelativePathFromResolvedArtifactPath(
        "/tmp/node_modules/@you-agent-factory/api/generated/cli/commands.json",
      ),
    ).toBe("generated/cli/commands.json");
  });
});

describe("validateConsumedApiPackageExportMembership", () => {
  test("loads the installed manifest as membership authority via its public subpath", () => {
    const manifest = loadApiPackageManifest();
    expect(manifest.packageId).toBe("you-agent-factory.api");

    const byPath = indexApiPackageManifestExportsByPath(manifest);
    expect(byPath.get("generated/cli/commands.json")?.exportId).toBe(
      "generated.cli.commands",
    );
  });

  test("validates each fixed non-manifest public export against the published manifest", () => {
    const consumable = API_PACKAGE_FIXED_PUBLIC_SUBPATHS.filter(
      (subpath) => subpath !== "manifest",
    );

    const results = validateConsumedApiPackageExportMemberships(consumable);
    expect(results.length).toBe(consumable.length);

    for (const result of results) {
      expect(result.specifier).toBe(`@you-agent-factory/api/${result.subpath}`);
      expect(result.exportId.length).toBeGreaterThan(0);
      expect(result.path.startsWith("generated/")).toBe(true);
      expect(result.entry.family.length).toBeGreaterThan(0);
      expect(result.entry.artifactHash).toMatch(/^[0-9a-f]{64}$/);
      expect(result.entry.lifecycle.itemId).toBeTruthy();
      expect(result.entry.documentation.itemId).toBeTruthy();
      expect(result.artifact.subpath).toBe(result.subpath);
    }
  });

  test("validates a joined public export against manifest membership", () => {
    const result = validateConsumedApiPackageExportMembership(
      "@you-agent-factory/api/joined/contracts/manifest.schema.json",
    );

    expect(result.subpath).toBe("joined/contracts/manifest.schema.json");
    expect(result.path).toBe("generated/joined/contracts/manifest.schema.json");
    expect(result.exportId).toBe("generated.joined.contracts.manifest");
    expect(result.entry.family).toBe("shared");
    expect(result.entry.artifactHash).toMatch(/^[0-9a-f]{64}$/);
  });

  test("fails closed when a consumed export is missing from the published manifest", () => {
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
      validateConsumedApiPackageExportMembership("cli", {
        manifest: stripped,
      });
      throw new Error("expected missing-membership");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageManifestMembershipError);
      const membershipError = error as ApiPackageManifestMembershipError;
      expect(membershipError.code).toBe("missing-membership");
      expect(membershipError.subpath).toBe("cli");
      expect(membershipError.message).toContain("cli");
      expect(membershipError.message).toContain("@you-agent-factory/api/cli");
      expect(membershipError.message).toMatch(
        /missing from the published package manifest/i,
      );
      expect(membershipError.message).toMatch(/does not invent or patch/i);
    }
  });

  test("does not invent missing membership entries for unresolved joined paths", () => {
    // Documented joined/* allowlist accepts the subpath shape, but the
    // installed package has no such artifact — resolution fails before membership.
    try {
      validateConsumedApiPackageExportMembership(
        "@you-agent-factory/api/joined/contracts/does-not-exist.schema.json",
      );
      throw new Error("expected resolution or membership failure");
    } catch (error) {
      expect(error).toBeTruthy();
      const message = error instanceof Error ? error.message : String(error);
      expect(message).toMatch(
        /does-not-exist|Missing @you-agent-factory\/api|could not be read|ENOENT/i,
      );
    }
  });

  test("rejects treating the publication manifest itself as a member export", () => {
    try {
      validateConsumedApiPackageExportMembership("manifest");
      throw new Error("expected missing-membership for manifest authority");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageManifestMembershipError);
      const membershipError = error as ApiPackageManifestMembershipError;
      expect(membershipError.code).toBe("missing-membership");
      expect(membershipError.subpath).toBe("manifest");
      expect(membershipError.message).toContain("membership authority");
    }
  });
});
