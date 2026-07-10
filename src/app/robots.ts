import type { MetadataRoute } from "next";
import { buildPublicRobots } from "@/lib/seo/export-robots";

/** Required for `output: "export"` — generate robots.txt at build time. */
export const dynamic = "force-static";

/**
 * Static-export robots.txt for the factory public site.
 * Points crawlers at the absolute production sitemap URL.
 */
export default function robots(): MetadataRoute.Robots {
  return buildPublicRobots();
}
