import { describe, expect, test } from "bun:test";
import {
  collectRetiredProductDocsConsistency,
  formatRetiredProductDocsConsistency,
  isRetiredProductExclusionContext,
  RETIRED_PRODUCT_DOCS_OWNED_PATHS,
  scanRetiredProductDocsContent,
} from "./retired-product-docs-consistency";

const BAD_PRODUCT_FIXTURE = `# Model Reference

Model Reference is the documentation site for learning language models.
Readers browse Model Atlas pages and Learn Language Models attention sheets.
`;

const BAD_ROUTE_FIXTURE = `# Authoring

Open the module page at /docs/modules/grouped-query-attention.
Also link models at /docs/models/gpt-2 and papers at /docs/papers/attention.
Training regimes live under /docs/training/pretraining.
`;

const ALLOWED_EXCLUSION_FIXTURE = `# Site Fundamentals

This is **not** the retired Model Atlas / Learn Language Models
attention-reference product (sometimes called Model Reference). Mention those
names only to exclude them.

Do not teach /docs/modules or /docs/models as live product destinations.
Atlas-era PAGE=docs/modules/... examples are not required product contracts.
Configure external model providers and external-model support in the CLI.
`;

describe("retired-product-docs-consistency", () => {
  test("fails on product-identity regressions in a known bad fixture", () => {
    const findings = scanRetiredProductDocsContent(
      "fixture/bad-product.md",
      BAD_PRODUCT_FIXTURE,
    );

    expect(findings.length).toBeGreaterThan(0);
    expect(
      findings.some((finding) => finding.matchedText === "Model Reference"),
    ).toBe(true);
    expect(
      findings.some((finding) => finding.matchedText === "Model Atlas"),
    ).toBe(true);
    expect(
      findings.some(
        (finding) => finding.matchedText === "Learn Language Models",
      ),
    ).toBe(true);
    expect(
      findings.every((finding) => finding.kind === "retired-product-name"),
    ).toBe(true);
  });

  test("fails when retired public route families are taught as live destinations", () => {
    const findings = scanRetiredProductDocsContent(
      "fixture/bad-routes.md",
      BAD_ROUTE_FIXTURE,
    );

    expect(findings.length).toBeGreaterThanOrEqual(4);
    expect(
      findings.every((finding) => finding.kind === "retired-route-family"),
    ).toBe(true);
    expect(findings.map((finding) => finding.matchedText).join(" ")).toContain(
      "/docs/modules",
    );
    expect(findings.map((finding) => finding.matchedText).join(" ")).toContain(
      "/docs/models",
    );
    expect(findings.map((finding) => finding.matchedText).join(" ")).toContain(
      "/docs/papers",
    );
    expect(findings.map((finding) => finding.matchedText).join(" ")).toContain(
      "/docs/training",
    );
  });

  test("passes on explicit retirement/exclusion wording and provider mentions", () => {
    const findings = scanRetiredProductDocsContent(
      "fixture/allowed-exclusion.md",
      ALLOWED_EXCLUSION_FIXTURE,
    );

    expect(findings).toEqual([]);
  });

  test("exclusion context helper recognizes demotion wording", () => {
    expect(
      isRetiredProductExclusionContext(
        "This is not the retired Model Atlas product.",
      ),
    ).toBe(true);
    expect(
      isRetiredProductExclusionContext(
        "Model Atlas is the documentation site for attention modules.",
      ),
    ).toBe(false);
  });

  test("collectRetiredProductDocsConsistency scans owned paths via injected reader", () => {
    const files = new Map<string, string>(
      RETIRED_PRODUCT_DOCS_OWNED_PATHS.map((path) => [
        path,
        "Factory docs use guides and concepts.\n",
      ]),
    );
    files.set(
      "docs/site-fundamentals.md",
      "Welcome to Model Reference, the current product.\n",
    );

    const result = collectRetiredProductDocsConsistency({
      repoRoot: "/repo",
      exists: (absolutePath) => {
        const relativePath = absolutePath.replace(/^\/repo\//, "");
        return files.has(relativePath);
      },
      readFile: (absolutePath) => {
        const relativePath = absolutePath.replace(/^\/repo\//, "");
        const content = files.get(relativePath);
        if (content === undefined) {
          throw new Error(`missing fixture for ${relativePath}`);
        }
        return content;
      },
    });

    expect(result.ok).toBe(false);
    expect(result.scannedPaths).toEqual([...RETIRED_PRODUCT_DOCS_OWNED_PATHS]);
    expect(result.findings[0]?.path).toBe("docs/site-fundamentals.md");
    expect(result.findings[0]?.matchedText).toBe("Model Reference");
    expect(formatRetiredProductDocsConsistency(result)).toContain(
      "Status: fail",
    );
  });

  test("formatRetiredProductDocsConsistency reports a clean pass", () => {
    const formatted = formatRetiredProductDocsConsistency({
      findings: [],
      ok: true,
      scannedPaths: [...RETIRED_PRODUCT_DOCS_OWNED_PATHS],
    });

    expect(formatted).toContain("Status: pass");
    expect(formatted).toContain(
      "No retired product-name or route-family regressions",
    );
  });
});
