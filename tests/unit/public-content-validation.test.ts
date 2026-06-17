import { describe, expect, test } from "bun:test";
import {
  SUPPORTED_PUBLIC_CONTENT_KINDS,
  getPublicContentGraph,
} from "../../src/lib/content/public-content";
import {
  formatPublicContentValidationResult,
  validatePublicContentGraph,
} from "../../src/lib/content/public-content-validation";

describe("public content validation", () => {
  test("covers every supported public content kind in one validation contract", () => {
    const result = validatePublicContentGraph(getPublicContentGraph());

    expect(result.ok).toBe(true);
    expect(result.coveredKinds).toEqual([...SUPPORTED_PUBLIC_CONTENT_KINDS]);
  });

  test("fails clearly when one supported kind is missing from the graph", () => {
    const graph = getPublicContentGraph();
    const result = validatePublicContentGraph({
      entries: graph.entries.filter((entry) => entry.kind !== "reference"),
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([
      {
        code: "missing_kind_coverage",
        kind: "reference",
        message: "Public content validation is missing reference coverage.",
      },
    ]);
    expect(formatPublicContentValidationResult(result)).toContain(
      "missing reference coverage",
    );
  });
});
