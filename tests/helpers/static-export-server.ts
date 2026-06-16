import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SITE_BASE_PATH } from "../../src/lib/site";
import { fetchHttp } from "./http";

const projectRoot = join(import.meta.dir, "../..");

export function buildStaticExport(): void {
  const build = spawnSync("bun", ["run", "build"], {
    cwd: projectRoot,
    encoding: "utf8",
    env: process.env,
  });

  if (build.status !== 0) {
    throw new Error(build.stderr || "Static export build failed");
  }
}

export type StaticExportServer = {
  baseUrl: string;
  stop: () => void;
};

export function startStaticExportServer(port: number): StaticExportServer {
  const serveRoot = mkdtempSync(join(tmpdir(), "yaf-docs-serve-"));
  symlinkSync(
    join(projectRoot, "out"),
    join(serveRoot, SITE_BASE_PATH.slice(1)),
  );

  const server = Bun.spawn(
    ["python3", "-m", "http.server", String(port), "--bind", "127.0.0.1"],
    {
      cwd: serveRoot,
      stdout: "ignore",
      stderr: "ignore",
    },
  );

  const baseUrl = `http://127.0.0.1:${port}${SITE_BASE_PATH}/`;

  return {
    baseUrl,
    stop: () => {
      server.kill();
      rmSync(serveRoot, { recursive: true, force: true });
    },
  };
}

export async function waitForStaticExportServer(
  baseUrl: string,
  timeoutMs = 10_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetchHttp(baseUrl, {
        signal: AbortSignal.timeout(2_000),
      });

      if (response.ok) {
        return;
      }
    } catch {
      // Server may still be starting.
    }

    await Bun.sleep(200);
  }

  throw new Error(`Static export server did not become ready at ${baseUrl}`);
}
