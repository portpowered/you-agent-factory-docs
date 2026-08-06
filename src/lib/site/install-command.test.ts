import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { HOMEPAGE_INSTALL_COMMAND } from "@/app/(site)/compose-production-landing-slots";

const repoRoot = process.cwd();
const installShPath = join(repoRoot, "public", "install.sh");

/**
 * The homepage's install command is the first thing a reader runs, and it
 * pointed at a path nothing was ever published to. `curl -fsSL` on a 404 exits
 * 0 with an empty body, so `| sh` ran nothing and reported no error — the
 * failure was completely silent.
 */
describe("homepage install command", () => {
  test("advertises a URL this site actually publishes", () => {
    const url = HOMEPAGE_INSTALL_COMMAND.match(/https:\/\/\S+/)?.[0];
    expect(url).toBe("https://youagentfactory.com/install.sh");
    expect(existsSync(installShPath)).toBe(true);
    expect(statSync(installShPath).size).toBeGreaterThan(0);
  });

  test("the published script tracks the newest release rather than a pinned tag", () => {
    const script = readFileSync(installShPath, "utf8");

    expect(script).toContain(
      "https://github.com/portpowered/you-agent-factory/releases/latest/download/install.sh",
    );
    // A pinned version here would silently stop tracking releases.
    expect(script).not.toMatch(/releases\/download\/v\d+\.\d+\.\d+/);
  });

  test("fails loudly instead of piping a truncated or empty body into sh", () => {
    const script = readFileSync(installShPath, "utf8");

    // Buffered to a file first: piping a partial download straight into a shell
    // executes whatever prefix arrived.
    expect(script).toContain('installer="$(mktemp)"');
    expect(script).toContain('if [ ! -s "$installer" ]; then');
    expect(script).toContain("set -eu");
  });
});
