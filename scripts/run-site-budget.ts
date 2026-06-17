import {
  SITE_BUDGET_ROUTE_TARGETS,
  measureBudgetRoute,
} from "@/lib/site-budget";
import {
  buildStaticExport,
  startStaticExportServer,
  waitForStaticExportServer,
} from "@/lib/static-export";

const SITE_BUDGET_PORT = 3786;

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
  } finally {
    server.stop();
  }
}

await main();
