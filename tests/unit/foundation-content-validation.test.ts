import { describe, expect, test } from "bun:test";
import {
  assertValidFoundationContentMetadata,
  getFoundationContentMetadata,
  validateFoundationContentMetadata,
} from "../../src/lib/validation/foundation-content";

describe("foundation content validation", () => {
  test("accepts the current project metadata constants", () => {
    expect(validateFoundationContentMetadata().valid).toBe(true);
    expect(() => assertValidFoundationContentMetadata()).not.toThrow();
  });

  test("rejects missing required project metadata fields", () => {
    const metadata = getFoundationContentMetadata();
    const { PROJECT_TAGLINE: _removed, ...partialMetadata } = metadata;

    const result = validateFoundationContentMetadata(
      partialMetadata as ReturnType<typeof getFoundationContentMetadata>,
    );

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "PROJECT_TAGLINE",
          message: "PROJECT_TAGLINE is required",
        }),
      ]),
    );
  });

  test("rejects empty project metadata values", () => {
    const metadata = {
      ...getFoundationContentMetadata(),
      PROJECT_NAME: "",
    };

    const result = validateFoundationContentMetadata(metadata);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "PROJECT_NAME",
          message: "PROJECT_NAME must be a non-empty string",
        }),
      ]),
    );
    expect(() => assertValidFoundationContentMetadata(metadata)).toThrow(
      /Foundation content validation failed/,
    );
  });
});
