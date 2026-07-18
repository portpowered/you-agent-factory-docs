import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  API_REFERENCE_FORBIDDEN_OWNERSHIP_ROOTS,
  API_REFERENCE_OWNERSHIP_IMPORT,
  API_REFERENCE_OWNERSHIP_ROOT,
  isApiReferenceOwnershipPath,
  isForbiddenApiReferenceOwnershipPath,
} from "./ownership";

describe("W08 production API ownership surface", () => {
  test("owns a dedicated production module root under references/api", () => {
    expect(API_REFERENCE_OWNERSHIP_ROOT).toBe("src/components/references/api");
    expect(API_REFERENCE_OWNERSHIP_IMPORT).toBe("@/components/references/api");
    expect(existsSync(join(process.cwd(), API_REFERENCE_OWNERSHIP_ROOT))).toBe(
      true,
    );
    expect(isApiReferenceOwnershipPath(API_REFERENCE_OWNERSHIP_ROOT)).toBe(
      true,
    );
    expect(
      isApiReferenceOwnershipPath(
        `${API_REFERENCE_OWNERSHIP_ROOT}/dependency-selection.ts`,
      ),
    ).toBe(true);
  });

  test("keeps production ownership distinct from spike, schema, and family trees", () => {
    expect(API_REFERENCE_FORBIDDEN_OWNERSHIP_ROOTS).toContain(
      "src/lib/references-openapi-spike",
    );
    expect(API_REFERENCE_FORBIDDEN_OWNERSHIP_ROOTS).toContain(
      "src/lib/references-sse-asyncapi-spike",
    );
    expect(API_REFERENCE_FORBIDDEN_OWNERSHIP_ROOTS).toContain(
      "src/components/references/schema",
    );
    expect(
      isForbiddenApiReferenceOwnershipPath(
        "src/components/references/schema/schema-surface.tsx",
      ),
    ).toBe(true);
    expect(
      isForbiddenApiReferenceOwnershipPath(
        "src/lib/references-openapi-spike/dependency-selection.ts",
      ),
    ).toBe(true);
    expect(
      isForbiddenApiReferenceOwnershipPath(
        `${API_REFERENCE_OWNERSHIP_ROOT}/api-surface.tsx`,
      ),
    ).toBe(false);
  });
});
