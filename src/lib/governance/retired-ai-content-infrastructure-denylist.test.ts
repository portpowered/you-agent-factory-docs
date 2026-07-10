import { describe, expect, test } from "bun:test";
import {
  auditRetiredCollectionSectionInventory,
  auditRetiredKindInventory,
  auditRetiredOwnedPaths,
  auditRetiredRouteInventory,
  collectRetiredAiContentInfrastructureDenylist,
  formatRetiredAiContentInfrastructureDenylist,
  isFactoryProviderModelExceptionContext,
  RETIRED_AI_CONTENT_OWNED_PATHS,
  RETIRED_PAGE_REGISTRY_KINDS,
  RETIRED_PUBLIC_ROUTE_FAMILIES,
  scanRetiredAiContentDenylistContent,
} from "./retired-ai-content-infrastructure-denylist";

const BAD_REINTRODUCTION_FIXTURE = `# Atlas content

Publish pages with kind: "model" and kind: "module".
Live page kinds still include paper and training-regime.
Open /docs/models/gpt-2 and /docs/modules/attention.
Also ship /docs/papers/attention and /docs/systems/runtime.
`;

const ALLOWED_FACTORY_PROVIDER_FIXTURE = `# Harness support

Configure external model providers and external-model support in the CLI.
Use --default-worker-model-provider when selecting a supported model provider.
Factory docs describe supported model providers; they are not Atlas content kinds.
`;

describe("retired-ai-content-infrastructure-denylist", () => {
  test("fails when a denylisted owned path is reintroduced", () => {
    const findings = auditRetiredOwnedPaths([
      { path: "src/features/ai", exists: true },
      { path: "src/lib/content/model-page.ts", exists: false },
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.kind).toBe("retired-owned-path");
    expect(findings[0]?.matchedText).toBe("src/features/ai");
  });

  test("fails when a live kind inventory includes retired Atlas kinds", () => {
    const findings = auditRetiredKindInventory("fixture-kinds", [
      "guide",
      "concept",
      "model",
      "paper",
    ]);

    expect(findings.map((finding) => finding.matchedText).sort()).toEqual([
      "model",
      "paper",
    ]);
    expect(findings.every((finding) => finding.kind === "retired-kind")).toBe(
      true,
    );
  });

  test("passes when kind inventory is factory-only", () => {
    expect(
      auditRetiredKindInventory("factory-kinds", [
        "guide",
        "concept",
        "technique",
        "documentation",
        "glossary",
      ]),
    ).toEqual([]);
  });

  test("fails when route inventory includes retired public route families", () => {
    const findings = auditRetiredRouteInventory("fixture-routes", [
      "/docs/guides/getting-started",
      "/docs/models",
      "/docs/modules/attention",
      "/docs/systems",
    ]);

    expect(findings.map((finding) => finding.matchedText).sort()).toEqual([
      "/docs/models",
      "/docs/modules/attention",
      "/docs/systems",
    ]);
  });

  test("fails when collection/section inventory includes retired ids", () => {
    const findings = auditRetiredCollectionSectionInventory("sections", [
      "guides",
      "models",
      "training-regimes",
    ]);

    expect(findings.map((finding) => finding.matchedText).sort()).toEqual([
      "models",
      "training-regimes",
    ]);
  });

  test("fails on a denylisted reintroduction content fixture", () => {
    const findings = scanRetiredAiContentDenylistContent(
      "fixture/bad-reintroduction.md",
      BAD_REINTRODUCTION_FIXTURE,
    );

    expect(findings.length).toBeGreaterThanOrEqual(4);
    expect(
      findings.some((finding) => finding.matchedText.includes("/docs/models")),
    ).toBe(true);
    expect(
      findings.some((finding) => finding.matchedText.includes("/docs/modules")),
    ).toBe(true);
    expect(findings.some((finding) => finding.matchedText === "model")).toBe(
      true,
    );
    expect(findings.some((finding) => finding.matchedText === "module")).toBe(
      true,
    );
  });

  test("passes on an allowed factory provider/model exception fixture", () => {
    const findings = scanRetiredAiContentDenylistContent(
      "fixture/allowed-factory-provider.md",
      ALLOWED_FACTORY_PROVIDER_FIXTURE,
    );

    expect(findings).toEqual([]);
    expect(
      isFactoryProviderModelExceptionContext(ALLOWED_FACTORY_PROVIDER_FIXTURE),
    ).toBe(true);
  });

  test("collectRetiredAiContentInfrastructureDenylist aggregates injected surfaces", () => {
    const result = collectRetiredAiContentInfrastructureDenylist({
      repoRoot: "/repo",
      ownedPaths: ["src/features/ai", "src/lib/content/model-page.ts"],
      exists: (absolutePath) => absolutePath.endsWith("src/features/ai"),
      kindInventories: [
        { name: "bad-kinds", kinds: ["guide", "model"] },
        { name: "good-kinds", kinds: ["guide", "concept"] },
      ],
      collectionSectionInventories: [
        { name: "sections", sectionIds: ["guides", "modules"] },
      ],
      routeInventories: [
        {
          name: "routes",
          routes: ["/docs/guides/getting-started", "/docs/papers"],
        },
      ],
      contentFixtures: [
        {
          path: "fixture/provider.md",
          content: ALLOWED_FACTORY_PROVIDER_FIXTURE,
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.scannedOwnedPaths).toEqual([
      "src/features/ai",
      "src/lib/content/model-page.ts",
    ]);
    expect(
      result.findings.some(
        (finding) =>
          finding.kind === "retired-owned-path" &&
          finding.matchedText === "src/features/ai",
      ),
    ).toBe(true);
    expect(
      result.findings.some(
        (finding) =>
          finding.kind === "retired-kind" && finding.matchedText === "model",
      ),
    ).toBe(true);
    expect(
      result.findings.some(
        (finding) =>
          finding.kind === "retired-collection-section" &&
          finding.matchedText === "modules",
      ),
    ).toBe(true);
    expect(
      result.findings.some(
        (finding) =>
          finding.kind === "retired-route-family" &&
          finding.matchedText === "/docs/papers",
      ),
    ).toBe(true);
    expect(formatRetiredAiContentInfrastructureDenylist(result)).toContain(
      "Status: fail",
    );
  });

  test("live repo collector passes on the cleaned factory-only tree", () => {
    const repoRoot = `${import.meta.dir}/../../..`;
    const result = collectRetiredAiContentInfrastructureDenylist({
      repoRoot,
    });

    expect(result.ok).toBe(true);
    expect(result.scannedOwnedPaths).toEqual([
      ...RETIRED_AI_CONTENT_OWNED_PATHS,
    ]);
    expect(result.scannedKindInventories.length).toBeGreaterThan(0);
    expect(formatRetiredAiContentInfrastructureDenylist(result)).toContain(
      "Status: pass",
    );
  });

  test("denylist constants cover the story route and kind families", () => {
    expect([...RETIRED_PUBLIC_ROUTE_FAMILIES]).toEqual([
      "/docs/models",
      "/docs/modules",
      "/docs/papers",
      "/docs/training",
      "/docs/systems",
    ]);
    expect([...RETIRED_PAGE_REGISTRY_KINDS]).toEqual([
      "model",
      "module",
      "paper",
      "training-regime",
      "system",
    ]);
    expect(RETIRED_AI_CONTENT_OWNED_PATHS).toContain("src/features/ai");
    expect(RETIRED_AI_CONTENT_OWNED_PATHS).toContain(
      "src/lib/content/__generate-fixtures__",
    );
  });
});
