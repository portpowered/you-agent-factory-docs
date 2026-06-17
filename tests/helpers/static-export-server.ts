import { fetchHttp } from "./http";
export {
  buildStaticExport,
  startStaticExportServer,
  type StaticExportServer,
} from "../../src/lib/static-export";

export async function waitForStaticExportServer(
  baseUrl: string,
  timeoutMs = 10_000,
): Promise<void> {
  const { waitForStaticExportServer: waitForServer } = await import(
    "../../src/lib/static-export"
  );

  await waitForServer(fetchHttp, baseUrl, timeoutMs);
}
