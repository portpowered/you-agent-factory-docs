import { describe, expect, test } from "bun:test";
import { SITE_BASE_PATH } from "../../src/lib/site";
import {
  assertValidStaticExportConfig,
  getStaticExportConfig,
  validateStaticExportConfig,
} from "../../src/lib/validation/static-export";

describe("static export validation", () => {
  test("accepts the current GitHub Pages-safe export configuration", () => {
    expect(validateStaticExportConfig().valid).toBe(true);
    expect(() => assertValidStaticExportConfig()).not.toThrow();
  });

  test("rejects a non-export output mode regression", () => {
    const config = {
      ...getStaticExportConfig(),
      output: "standalone",
    };

    const result = validateStaticExportConfig(config);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "output",
          message: expect.stringContaining('output must be "export"'),
        }),
      ]),
    );
  });

  test("rejects a broken base path regression", () => {
    const config = {
      ...getStaticExportConfig(),
      basePath: "/wrong-base-path",
      assetPrefix: "/wrong-base-path/",
    };

    const result = validateStaticExportConfig(config);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "basePath",
          message: `basePath must be ${SITE_BASE_PATH}`,
        }),
      ]),
    );
  });
});
