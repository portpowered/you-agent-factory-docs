import type { MetadataRoute } from "next";
import { buildPublicSitemapEntries } from "@/lib/seo/export-sitemap";

/**
 * Static-export sitemap of current public factory routes only.
 * Absolute production URLs come from {@link buildPublicSitemapEntries}.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return buildPublicSitemapEntries();
}
