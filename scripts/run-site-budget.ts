import { join } from "node:path";
import {
  SITE_BUDGET_GUIDANCE,
  SITE_BUDGET_ROUTE_TARGETS,
  SITE_BUDGET_STATIC_ASSET_TARGETS,
  assertSiteBudget,
  assertStaticAssetBudget,
  measureBudgetRoute,
  measureStaticAssetBudget,
} from "@/lib/site-budget";
import {
  buildStaticExport,
  startStaticExportServer,
  waitForStaticExportServer,
} from "@/lib/static-export";

const SITE_BUDGET_PORT = 3786;
const exportRoot = join(import.meta.dir, "..", "out");

async function main(): Promise<void> {
  buildStaticExport();

  const server = startStaticExportServer(SITE_BUDGET_PORT);

  try {
    await waitForStaticExportServer(fetch, server.baseUrl);

    const measurements = await Promise.all(
      SITE_BUDGET_ROUTE_TARGETS.map((route) =>
        measureBudgetRoute(fetch, server.baseUrl, route),
      ),
    );
    const staticAssetMeasurements = SITE_BUDGET_STATIC_ASSET_TARGETS.map(
      (target) => measureStaticAssetBudget(exportRoot, target),
    );

    assertSiteBudget(measurements);
    assertStaticAssetBudget(staticAssetMeasurements);

    console.log(`Budget command: ${SITE_BUDGET_GUIDANCE.command}`);
    console.log(
      `Protected routes: ${SITE_BUDGET_GUIDANCE.protectedRoutes.join(", ")}`,
    );
    console.log(
      `Protected asset surfaces: ${SITE_BUDGET_GUIDANCE.protectedAssetSurfaces.join(", ")}`,
    );
    console.log("Current limitations:");
    for (const limitation of SITE_BUDGET_GUIDANCE.currentLimitations) {
      console.log(`- ${limitation}`);
    }

    for (const measurement of measurements) {
      console.log(
        [
          `${measurement.route.label}: ${measurement.requestUrl}`,
          `status=${measurement.status}`,
          `htmlBytes=${measurement.htmlBytes}`,
          `scripts=${measurement.scriptTagCount}`,
          `stylesheets=${measurement.stylesheetLinkCount}`,
          `images=${measurement.imageCount}`,
          `main=${measurement.mainLandmarkPresent}`,
          `title=${measurement.titlePresent}`,
          `h1=${measurement.h1Text ?? "missing"}`,
        ].join(" | "),
      );
    }

    for (const measurement of staticAssetMeasurements) {
      console.log(
        [
          `${measurement.target.label}: ${measurement.target.directory}`,
          `assets=${measurement.assetCount}`,
          `totalBytes=${measurement.totalBytes}`,
          `largest=${measurement.largestAssetPath ?? "missing"}`,
          `largestBytes=${measurement.largestAssetBytes}`,
        ].join(" | "),
      );
    }
  } finally {
    server.stop();
  }
}

await main();
