import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "../..");

describe("README contributor workflow contract", () => {
  test("documents the same root parity commands used by pull request validation", () => {
    const readme = readFileSync(join(repoRoot, "README.md"), "utf8");

    expect(readme).toContain(
      "`make setup`, `make check`, `make test`, and `make build` are the authoritative commands",
    );
    expect(readme).toContain(
      "`make quality-gate` remains a broader local-only foundation sweep.",
    );
    expect(readme).toContain(
      "make check         # pull request parity: typecheck and lint",
    );
    expect(readme).toContain(
      "make test          # pull request parity: automated test suite",
    );
    expect(readme).toContain(
      "make build         # pull request parity: production static export",
    );
  });
});
