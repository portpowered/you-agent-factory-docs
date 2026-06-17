import { describe, expect, test } from "bun:test";
import { runMake } from "../helpers/make";
import { runValidationScript } from "../helpers/validation";

const verifyingMakeTest = process.env.VERIFYING_MAKE_TEST === "1";
const testUnlessVerifying = verifyingMakeTest ? test.skip : test;

describe("early foundation quality gate failing-path proof", () => {
  testUnlessVerifying(
    "validate:localization blocks a broken message catalog regression",
    () => {
      const result = runValidationScript(
        "validate:localization",
        "broken-shell-localization",
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Shared shell message validation failed");
      expect(result.stderr).toContain("common.getStarted");
    },
  );

  testUnlessVerifying(
    "validate:content blocks a broken starter content regression",
    () => {
      const result = runValidationScript(
        "validate:content",
        "broken-foundation-content",
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Starter content validation failed");
      expect(result.stderr).toContain("canonicalLocale");
    },
  );

  testUnlessVerifying(
    "make quality-gate fails fast when localization validation regresses",
    () => {
      const result = runMake("quality-gate", {
        env: {
          EARLY_GATE_VALIDATION_FIXTURE: "broken-shell-localization",
        },
      });

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Shared shell message validation failed");
    },
    180_000,
  );

  testUnlessVerifying(
    "validate:content blocks public content graph or artifact drift regressions",
    () => {
      const result = runValidationScript(
        "validate:content",
        "broken-public-content",
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Public content validation failed");
      expect(result.stderr).toContain(
        "Generated localized search artifact is missing",
      );
    },
  );

  testUnlessVerifying(
    "validate:accessibility blocks a missing primary navigation label regression",
    () => {
      const result = runValidationScript(
        "validate:accessibility",
        "broken-shell-accessibility",
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Shell accessibility validation failed");
      expect(result.stderr).toContain("primaryNavigationLabel");
    },
  );

  testUnlessVerifying(
    "validate:static-export blocks a broken static export configuration regression",
    () => {
      const result = runValidationScript(
        "validate:static-export",
        "broken-static-export",
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Static export validation failed");
      expect(result.stderr).toContain("output");
    },
  );
});
