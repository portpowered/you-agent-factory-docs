import { describe, expect, test } from "bun:test";
import { dryRunMake, runMake } from "../helpers/make";

describe("root makefile workflow", () => {
  test("make setup prepares dependencies through bun install", () => {
    expect(dryRunMake("setup")).toContain("bun install");
  });

  test("make check runs typecheck then lint through the shared path", () => {
    const output = dryRunMake("check");

    expect(output).toMatch(/bun run typecheck/);
    expect(output).toMatch(/bun run lint/);
    expect(output.indexOf("typecheck")).toBeLessThan(output.indexOf("lint"));
  });

  test("make test delegates to bun test", () => {
    expect(dryRunMake("test")).toContain("bun test");
  });

  test("make build verifies static production export through bun run build", () => {
    const output = dryRunMake("build");

    expect(output).toMatch(/bun run build/);
    expect(output).toMatch(/out/);
  });

  test("make check succeeds on the reconciled scaffold", () => {
    const result = runMake("check");

    expect(result.status).toBe(0);
  }, 30_000);
});
