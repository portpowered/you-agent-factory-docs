import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SITE_BASE_PATH } from "@/lib/site";
import { STATIC_EXPORT_SKIP_BUILD_ENV } from "@/lib/validation/static-export";
import { withStaticExportBuildLock } from "@/lib/validation/static-export-build-lock";

const projectRoot = join(import.meta.dir, "../..");
const exportDir = join(projectRoot, "out");
const nextDir = join(projectRoot, ".next");
const tsBuildInfoPath = join(projectRoot, "tsconfig.tsbuildinfo");
const STATIC_EXPORT_LOCK_HELD_ENV = "STATIC_EXPORT_BUILD_LOCK_HELD";
let inProcessStaticExportBuild: Promise<void> | undefined;
let inProcessStaticExportBuildComplete = false;

export type FetchLike = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

function cleanNextBuildArtifacts(): void {
  rmSync(nextDir, { recursive: true, force: true });
  rmSync(tsBuildInfoPath, { force: true });
}

export function shouldSkipStaticExportBuild(): boolean {
  return process.env[STATIC_EXPORT_SKIP_BUILD_ENV] === "1";
}

export function buildStaticExport(): void {
  if (shouldSkipStaticExportBuild()) {
    if (!existsSync(exportDir)) {
      throw new Error(
        `${STATIC_EXPORT_SKIP_BUILD_ENV}=1 but static export output is missing at out/`,
      );
    }

    return;
  }

  withStaticExportBuildLock(projectRoot, () => {
    cleanNextBuildArtifacts();

    const build = spawnSync("make", ["build"], {
      cwd: projectRoot,
      encoding: "utf8",
      env: process.env,
    });

    if (build.status !== 0) {
      throw new Error(
        build.stderr || build.stdout || "Static export build failed",
      );
    }
  });
}

export async function ensureStaticExportBuilt(): Promise<void> {
  if (inProcessStaticExportBuildComplete) {
    return;
  }

  if (!inProcessStaticExportBuild) {
    inProcessStaticExportBuild = Promise.resolve().then(() => {
      try {
        buildStaticExport();
        inProcessStaticExportBuildComplete = true;
      } catch (error) {
        inProcessStaticExportBuild = undefined;
        throw error;
      }
    });
  }

  await inProcessStaticExportBuild;
}

export async function findAvailableLocalPort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.unref();

    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();

      if (!address || typeof address === "string") {
        probe.close();
        reject(new Error("Unable to determine an available localhost port"));
        return;
      }

      probe.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(address.port);
      });
    });
  });
}

export type StaticExportServer = {
  baseUrl: string;
  stop: () => void;
};

export function startStaticExportServer(port: number): StaticExportServer {
  const serveRoot = mkdtempSync(join(tmpdir(), "yaf-docs-serve-"));
  const serveSnapshotPath = join(serveRoot, SITE_BASE_PATH.slice(1));

  const snapshotExport = () => {
    if (!existsSync(exportDir)) {
      throw new Error(
        "Static export output is missing at out/; build the export before serving it",
      );
    }

    cpSync(exportDir, serveSnapshotPath, { recursive: true });
  };

  if (process.env[STATIC_EXPORT_LOCK_HELD_ENV] === "1") {
    snapshotExport();
  } else {
    withStaticExportBuildLock(projectRoot, snapshotExport);
  }

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
  fetchHttp: FetchLike,
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
