import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { OPENAPI_SPIKE_STATUS } from "./dependency-selection";
import {
  assertFindingsRollupContent,
  OPENAPI_SPIKE_FINDINGS_REQUIRED_TOPICS,
  OPENAPI_SPIKE_FINDINGS_ROLLUP_COMMITTED_PATH,
  OPENAPI_SPIKE_FINDINGS_ROLLUP_PATH,
  OPENAPI_SPIKE_FINDINGS_SOURCES,
  OPENAPI_SPIKE_PUBLICATION_POLICY,
} from "./findings-publication";

const repoRoot = join(import.meta.dir, "../../..");

describe("W01 OpenAPI spike findings publication", () => {
  test("keeps the spike non-production and not the shipped references API", () => {
    expect(OPENAPI_SPIKE_PUBLICATION_POLICY.status).toBe(
      "non-production-temporary",
    );
    expect(OPENAPI_SPIKE_PUBLICATION_POLICY.status).toBe(OPENAPI_SPIKE_STATUS);
    expect(OPENAPI_SPIKE_PUBLICATION_POLICY.isShippedReferencesApiSurface).toBe(
      false,
    );
    expect(OPENAPI_SPIKE_PUBLICATION_POLICY.shippedReferencesApiSurface).toBe(
      "/docs/references/api",
    );
    expect(OPENAPI_SPIKE_PUBLICATION_POLICY.spikeRoutePath).toBe(
      "/references-openapi-spike",
    );
  });

  test("keeps OpenAPI production dependency pins temporary / unpinned", () => {
    expect(OPENAPI_SPIKE_PUBLICATION_POLICY.openApiDependencyPinStatus).toBe(
      "temporary-non-final",
    );
    expect(
      OPENAPI_SPIKE_PUBLICATION_POLICY.finalProductionOpenApiVersionsPinned,
    ).toBe(false);
  });

  test("does not own W02 AsyncAPI or edit shared inventories", () => {
    expect(OPENAPI_SPIKE_PUBLICATION_POLICY.ownsW02AsyncApiProjector).toBe(
      false,
    );
    expect(
      OPENAPI_SPIKE_PUBLICATION_POLICY.editsSharedNavigationInventory,
    ).toBe(false);
    expect(OPENAPI_SPIKE_PUBLICATION_POLICY.editsSharedSearchInventory).toBe(
      false,
    );
    expect(OPENAPI_SPIKE_PUBLICATION_POLICY.editsSharedSitemapInventory).toBe(
      false,
    );
    expect(
      OPENAPI_SPIKE_PUBLICATION_POLICY.expectedSearchProjectionDeltaBytes,
    ).toBe(0);
  });

  test("inventories every required findings topic and source file", () => {
    expect(OPENAPI_SPIKE_FINDINGS_REQUIRED_TOPICS).toEqual([
      "dependency-choice",
      "upgrade-candidate-and-risk",
      "single-page-render-result",
      "anchor-collision-result",
      "playground-suppression",
      "customization-results",
      "mobile-navigation-notes",
      "cost-measurements",
    ]);
    expect(OPENAPI_SPIKE_FINDINGS_SOURCES).toHaveLength(6);
    expect(OPENAPI_SPIKE_PUBLICATION_POLICY.findingsRollupPath).toBe(
      OPENAPI_SPIKE_FINDINGS_ROLLUP_PATH,
    );
    expect(OPENAPI_SPIKE_PUBLICATION_POLICY.findingsRollupCommittedPath).toBe(
      OPENAPI_SPIKE_FINDINGS_ROLLUP_COMMITTED_PATH,
    );
    expect(OPENAPI_SPIKE_PUBLICATION_POLICY.findingsDirectory).toBe(
      "docs/temp/references",
    );

    for (const source of OPENAPI_SPIKE_FINDINGS_SOURCES) {
      expect(source.path.startsWith("docs/temp/references/")).toBe(true);
      expect(source.path.endsWith(".md")).toBe(true);
    }
  });

  test("publishes a committed consolidated rollup covering every required topic", async () => {
    const committedAbs = join(
      repoRoot,
      OPENAPI_SPIKE_FINDINGS_ROLLUP_COMMITTED_PATH,
    );
    expect(existsSync(committedAbs)).toBe(true);

    const markdown = await readFile(committedAbs, "utf8");
    const failures = assertFindingsRollupContent(markdown);
    expect(failures).toEqual([]);

    // Planner copy under docs/temp is optional in CI (gitignored). When present
    // locally, it must match the committed rollup so planners and PR review stay
    // aligned.
    const plannerAbs = join(repoRoot, OPENAPI_SPIKE_FINDINGS_ROLLUP_PATH);
    if (existsSync(plannerAbs)) {
      const plannerMarkdown = await readFile(plannerAbs, "utf8");
      expect(assertFindingsRollupContent(plannerMarkdown)).toEqual([]);
    }
  });

  test("shared search/sitemap modules do not register the spike route", async () => {
    const sitemap = await readFile(
      join(repoRoot, "src/lib/seo/public-sitemap-routes.ts"),
      "utf8",
    );
    const searchBootstrap = await readFile(
      join(repoRoot, "src/lib/search/docs-search-bootstrap-path.ts"),
      "utf8",
    );

    expect(sitemap).not.toContain("references-openapi-spike");
    expect(searchBootstrap).not.toContain("references-openapi-spike");
  });
});
