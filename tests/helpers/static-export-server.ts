import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { SITE_BASE_PATH } from "../../src/lib/site";
import { STATIC_EXPORT_SKIP_BUILD_ENV } from "../../src/lib/validation/static-export";
import { withStaticExportBuildLock } from "../../src/lib/validation/static-export-build-lock";
import { fetchHttp } from "./http";

const projectRoot = join(import.meta.dir, "../..");
const exportDir = join(projectRoot, "out");
const nextDir = join(projectRoot, ".next");
const STATIC_EXPORT_LOCK_HELD_ENV = "STATIC_EXPORT_BUILD_LOCK_HELD";
const tsBuildInfoPath = join(projectRoot, "tsconfig.tsbuildinfo");
let inProcessStaticExportBuild: Promise<void> | undefined;
let inProcessStaticExportBuildComplete = false;

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

export type StaticExportServer = {
  baseUrl: string;
  stop: () => void;
};

function resolveSnapshotRequestPath(
  serveRoot: string,
  requestPath: string,
): { path: string; status: number } {
  const basePathname = SITE_BASE_PATH.replace(/\/$/, "");
  const decodedRequestPath = decodeURIComponent(requestPath);
  const normalizedRequestPath = decodedRequestPath.replace(/\/+$/, "") || "/";

  if (!normalizedRequestPath.startsWith(basePathname)) {
    return { path: join(serveRoot, "404.html"), status: 404 };
  }

  const relativePath = normalizedRequestPath
    .slice(basePathname.length)
    .replace(/^\/+/, "");
  const normalizedRelativePath = normalize(relativePath).replace(
    /^(\.\.[/\\])+/,
    "",
  );
  const candidatePath = normalizedRelativePath
    ? join(serveRoot, normalizedRelativePath)
    : join(serveRoot, "index.html");

  const routeIndexPath = join(candidatePath, "index.html");

  if (existsSync(candidatePath) && statSync(candidatePath).isFile()) {
    return { path: candidatePath, status: 200 };
  }

  if (existsSync(routeIndexPath)) {
    return { path: routeIndexPath, status: 200 };
  }

  return { path: join(serveRoot, "404.html"), status: 404 };
}

function contentTypeForPath(path: string): string {
  switch (extname(path)) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".ico":
      return "image/x-icon";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".map":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
}

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

  const server = createServer((request, response) => {
    const pathname = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "127.0.0.1"}`,
    ).pathname;
    const resolved = resolveSnapshotRequestPath(serveSnapshotPath, pathname);
    const body = readFileSync(resolved.path);

    response.writeHead(resolved.status, {
      "Content-Length": String(body.byteLength),
      "Content-Type": contentTypeForPath(resolved.path),
    });
    response.end(body);
  });
  server.listen(port, "127.0.0.1");

  const baseUrl = `http://127.0.0.1:${port}${SITE_BASE_PATH}/`;

  return {
    baseUrl,
    stop: () => {
      server.close();
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
