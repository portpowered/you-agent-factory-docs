import { describe, expect, test } from "bun:test";
import {
  assertValidFoundationContentMetadata,
  validateFoundationContentMetadata,
} from "../../src/lib/validation/foundation-content";

describe("foundation content validation", () => {
  test("accepts the current project metadata constants", () => {
    expect(validateFoundationContentMetadata().valid).toBe(true);
    expect(() => assertValidFoundationContentMetadata()).not.toThrow();
  });
});
