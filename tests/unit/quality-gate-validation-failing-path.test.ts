import { describe, expect, test } from "bun:test";
import { runMake } from "../helpers/make";
import { runValidationScript } from "../helpers/validation";

const verifyingMakeTest = process.env.VERIFYING_MAKE_TEST === "1";
const testUnlessVerifying = verifyingMakeTest ? test.skip : test;

describe("early foundation quality gate failing-path proof", () => {
  function combinedOutput(result: { stdout: string; stderr: string }) {
    return `${result.stdout}${result.stderr}`;
  }

  testUnlessVerifying(
    "validate:localization blocks a broken message catalog regression",
    () => {
      const result = runValidationScript(
        "validate:localization",
        "broken-shell-localization",
      );
      const output = combinedOutput(result);

      expect(result.status).not.toBe(0);
      expect(output).toContain("Shared shell message validation failed");
      expect(output).toContain("common.getStarted");
    },
    60_000,
  );

  testUnlessVerifying(
    "validate:content blocks a broken starter content regression",
    () => {
      const result = runValidationScript(
        "validate:content",
        "broken-foundation-content",
      );
      const output = combinedOutput(result);

      expect(result.status).not.toBe(0);
      expect(output).toContain("Starter content validation failed");
      expect(output).toContain("canonicalLocale");
    },
    60_000,
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
      const output = combinedOutput(result);

      expect(result.status).not.toBe(0);
      expect(output).toContain("Public content validation failed");
      expect(output).toContain(
        "Generated localized search artifact is missing",
      );
    },
    60_000,
  );

  testUnlessVerifying(
    "validate:accessibility blocks a missing primary navigation label regression",
    () => {
      const result = runValidationScript(
        "validate:accessibility",
        "broken-shell-accessibility",
      );
      const output = combinedOutput(result);

      expect(result.status).not.toBe(0);
      expect(output).toContain("Shell accessibility validation failed");
      expect(output).toContain("primaryNavigationLabel");
    },
    60_000,
  );

  testUnlessVerifying(
    "validate:static-export blocks a broken static export configuration regression",
    () => {
      const result = runValidationScript(
        "validate:static-export",
        "broken-static-export",
      );
      const output = combinedOutput(result);

      expect(result.status).not.toBe(0);
      expect(output).toContain("Static export validation failed");
      expect(output).toContain("output");
    },
    60_000,
  );

  testUnlessVerifying(
    "validate:static-export uses the maintained Makefile build path on the current baseline",
    () => {
      const result = runValidationScript("validate:static-export");

      expect(result.status).toBe(0);
      expect(result.stdout).toContain(
        "Running static export validation build through `make build`",
      );
      expect(result.stdout).toContain("make build");
    },
    180_000,
  );

  testUnlessVerifying(
    "make quality-gate fails fast when search-index validation regresses",
    () => {
      const result = runMake("quality-gate", {
        env: {
          EARLY_GATE_VALIDATION_FIXTURE: "broken-search-contract-field",
        },
      });

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Search index validation failed");
      expect(result.stderr).toContain("normalized contract mismatch");
      expect(result.stderr).toContain(
        "Early quality gate failed at: search-index contract validation",
      );
      expect(result.stderr).not.toContain("Static export validation failed");
      expect(result.stderr).not.toContain("Starter content validation failed");
    },
    180_000,
  );
});
