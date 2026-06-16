import { describe, expect, test } from "bun:test";
import { runMake } from "../helpers/make";
import { runValidationScript } from "../helpers/validation";

describe("early foundation quality gate failing-path proof", () => {
  test("validate:localization blocks a broken message catalog regression", () => {
    const result = runValidationScript(
      "validate:localization",
      "broken-shell-localization",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Shared shell message validation failed");
    expect(result.stderr).toContain("common.getStarted");
  });

  test("validate:content blocks a broken starter content regression", () => {
    const result = runValidationScript(
      "validate:content",
      "broken-foundation-content",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Starter content validation failed");
    expect(result.stderr).toContain("canonicalLocale");
  });

  test("make quality-gate fails fast when localization validation regresses", () => {
    const result = runMake("quality-gate", {
      env: {
        EARLY_GATE_VALIDATION_FIXTURE: "broken-shell-localization",
      },
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Shared shell message validation failed");
  }, 180_000);

  test("validate:accessibility blocks a missing primary navigation label regression", () => {
    const result = runValidationScript(
      "validate:accessibility",
      "broken-shell-accessibility",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Shell accessibility validation failed");
    expect(result.stderr).toContain("primaryNavigationLabel");
  });

  test("validate:static-export blocks a broken static export configuration regression", () => {
    const result = runValidationScript(
      "validate:static-export",
      "broken-static-export",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Static export validation failed");
    expect(result.stderr).toContain("output");
  });
});
