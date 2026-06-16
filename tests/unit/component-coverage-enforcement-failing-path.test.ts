import { describe, expect, test } from "bun:test";
import { COMPONENT_COVERAGE_ENFORCEMENT_FAILURE_PREFIX } from "../../src/lib/component-coverage/enforce";
import { runComponentCoverageEnforcement } from "../helpers/component-coverage";
import { runMake } from "../helpers/make";

describe("component coverage enforcement failing-path proof", () => {
  test("component-coverage blocks a below-threshold coverage regression", () => {
    const result = runComponentCoverageEnforcement({
      env: {
        COMPONENT_COVERAGE_ENFORCEMENT_FIXTURE: "below-threshold",
      },
    });

    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).not.toBe(0);
    expect(output).toContain(COMPONENT_COVERAGE_ENFORCEMENT_FAILURE_PREFIX);
    expect(output).toContain("src/components/landing/landing-shell.tsx");
    expect(output).not.toContain("typecheck");
    expect(output).not.toContain("biome check");
  });

  test("make component-coverage fails fast when coverage drops below the threshold", () => {
    const result = runMake("component-coverage", {
      env: {
        COMPONENT_COVERAGE_ENFORCEMENT_FIXTURE: "below-threshold",
      },
    });

    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).not.toBe(0);
    expect(output).toContain(COMPONENT_COVERAGE_ENFORCEMENT_FAILURE_PREFIX);
    expect(output).toContain("src/components");
  });
});
