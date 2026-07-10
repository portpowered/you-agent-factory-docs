import type { MetadataRoute } from "next";
import { buildPublicSitemapEntries } from "@/lib/seo/export-sitemap";

/** Required for `output: "export"` — generate sitemap.xml at build time. */
export const dynamic = "force-static";

/**
 * Static-export sitemap of current public factory routes only.
 * Absolute production URLs come from {@link buildPublicSitemapEntries}.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return buildPublicSitemapEntries();
}
