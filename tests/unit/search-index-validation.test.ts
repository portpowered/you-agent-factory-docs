import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  assertValidSearchIndex,
  validateSearchIndex,
} from "../../src/lib/validation/search-index";

const CONTENT_ROOT = join(process.cwd(), "src/content");
const ARTIFACT_PATH = join(
  process.cwd(),
  "public/search/public-search-index.json",
);

describe("search index validation", () => {
  test("accepts the checked-in generated public search artifact contract", () => {
    expect(
      validateSearchIndex({
        contentRoot: CONTENT_ROOT,
        artifactPath: ARTIFACT_PATH,
      }),
    ).toEqual({
      valid: true,
      issues: [],
    });
  });

  test("rejects a missing checked-in search artifact path", () => {
    const missingPath = join(process.cwd(), "public/search/missing-index.json");

    expect(
      validateSearchIndex({
        contentRoot: CONTENT_ROOT,
        artifactPath: missingPath,
      }),
    ).toEqual({
      valid: false,
      issues: [
        {
          field: "artifactPath",
          message: `Checked-in search artifact is missing at ${missingPath}. Run bun run generate:search-index and commit public/search/public-search-index.json.`,
        },
      ],
    });
  });

  test("rejects a checked-in artifact that drifts from generated output", () => {
    const result = validateSearchIndex({
      contentRoot: CONTENT_ROOT,
      artifactPath: ARTIFACT_PATH,
      checkedInArtifactSource: '{\n  "version": 1,\n  "entries": []\n}\n',
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      {
        field: "artifact",
        message: `Checked-in search artifact at ${ARTIFACT_PATH} does not match generated artifact. Regenerate with bun run generate:search-index and review the diff.`,
      },
    ]);
  });

  test("throws a contract failure with maintainer guidance", () => {
    expect(() =>
      assertValidSearchIndex({
        contentRoot: CONTENT_ROOT,
        artifactPath: ARTIFACT_PATH,
        checkedInArtifactSource: '{\n  "version": 1,\n  "entries": []\n}\n',
      }),
    ).toThrow("Search index validation failed");
  });
});
