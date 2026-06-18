import { describe, expect, test } from "bun:test";
import { runMake } from "../helpers/make";
import { runValidationScript } from "../helpers/validation";

const verifyingMakeTest = process.env.VERIFYING_MAKE_TEST === "1";
const testUnlessVerifying = verifyingMakeTest ? test.skip : test;
const getProcessOutput = (result: { stdout: string; stderr: string }) =>
  `${result.stdout}${result.stderr}`;

describe("early foundation quality gate failing-path proof", () => {
  testUnlessVerifying(
    "validate:localization blocks a broken message catalog regression",
    () => {
      const result = runValidationScript(
        "validate:localization",
        "broken-shell-localization",
      );
      const output = getProcessOutput(result);

      expect(result.status).not.toBe(0);
      expect(output).toContain("Shared shell message validation failed");
      expect(output).toContain("common.getStarted");
    },
    120_000,
  );

  testUnlessVerifying(
    "validate:content blocks a broken starter content regression",
    () => {
      const result = runValidationScript(
        "validate:content",
        "broken-foundation-content",
      );
      const output = getProcessOutput(result);

      expect(result.status).not.toBe(0);
      expect(output).toContain("Starter content validation failed");
      expect(output).toContain("canonicalLocale");
    },
    120_000,
  );

  testUnlessVerifying(
    "make quality-gate fails fast when localization validation regresses",
    () => {
      const result = runMake("quality-gate", {
        env: {
          EARLY_GATE_VALIDATION_FIXTURE: "broken-shell-localization",
        },
      });
      const output = getProcessOutput(result);

      expect(result.status).not.toBe(0);
      expect(output).toContain("Shared shell message validation failed");
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
      const output = getProcessOutput(result);

      expect(result.status).not.toBe(0);
      expect(output).toContain("Public content validation failed");
      expect(output).toContain(
        "Generated localized search artifact is missing",
      );
    },
    120_000,
  );

  testUnlessVerifying(
    "validate:accessibility blocks a missing primary navigation label regression",
    () => {
      const result = runValidationScript(
        "validate:accessibility",
        "broken-shell-accessibility",
      );
      const output = getProcessOutput(result);

      expect(result.status).not.toBe(0);
      expect(output).toContain("Shell accessibility validation failed");
      expect(output).toContain("primaryNavigationLabel");
    },
    120_000,
  );

  testUnlessVerifying(
    "validate:static-export blocks a broken static export configuration regression",
    () => {
      const result = runValidationScript(
        "validate:static-export",
        "broken-static-export",
      );
      const output = getProcessOutput(result);

      expect(result.status).not.toBe(0);
      expect(output).toContain("Static export validation failed");
      expect(output).toContain("output");
    },
    120_000,
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
      const output = getProcessOutput(result);

      expect(result.status).not.toBe(0);
      expect(output).toContain("Search index validation failed");
      expect(output).toContain("normalized contract mismatch");
      expect(output).toContain(
        "Early quality gate failed at: search-index contract validation",
      );
      expect(output).not.toContain("Static export validation failed");
      expect(output).not.toContain("Starter content validation failed");
    },
    180_000,
  );
});
