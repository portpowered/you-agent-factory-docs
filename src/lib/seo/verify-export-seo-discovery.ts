import { DEFAULT_EXPORT_OUT_DIR } from "@/lib/build/export-out-directory";
import type { BuildModeEnv } from "@/lib/build/static-export";
import { verifyExportAbsoluteCanonicals } from "@/lib/seo/export-absolute-canonical";
import { verifyExportLocalizedAlternates } from "@/lib/seo/export-localized-alternates";
import { verifyExportPageOpenGraph } from "@/lib/seo/export-page-open-graph";
import { verifyExportRobots } from "@/lib/seo/export-robots";
import { verifyExportSitemap } from "@/lib/seo/export-sitemap";
import { verifyExportSocialPreviewImages } from "@/lib/seo/export-social-preview-images";

export type VerifyExportSeoDiscoveryResult =
  | { ok: true }
  | { ok: false; reason: string; gate: string };

const PROJECT_SITE_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: "/you-agent-factory-docs",
} as const;

/**
 * Composite project-site export SEO/discovery gate.
 *
 * Proves absolute canonicals, page-specific Open Graph, base-prefixed social
 * images, shipped-only absolute alternates (including `hreflang="x-default"` →
 * English canonical when language alternates are advertised, plus the blog
 * English-only alternate policy), sitemap of live factory routes only, and
 * robots.txt pointing at the production sitemap — all against an exported
 * `out/` directory. Sitemap locale inventory stays owned by
 * `seo-sitemap-locales`; this gate consumes alternates without expanding it.
 */
export function verifyExportSeoDiscovery(options: {
  env?: BuildModeEnv;
  outDir?: string;
  cwd?: string;
}): VerifyExportSeoDiscoveryResult {
  const {
    env = PROJECT_SITE_EXPORT_ENV,
    outDir = DEFAULT_EXPORT_OUT_DIR,
    cwd = process.cwd(),
  } = options;

  const shared = { env, outDir, cwd };

  const canonicals = verifyExportAbsoluteCanonicals(shared);
  if (!canonicals.ok) {
    return {
      ok: false,
      gate: "absolute-canonicals",
      reason: canonicals.reason,
    };
  }

  const openGraph = verifyExportPageOpenGraph(shared);
  if (!openGraph.ok) {
    return {
      ok: false,
      gate: "page-open-graph",
      reason: openGraph.reason,
    };
  }

  const social = verifyExportSocialPreviewImages(shared);
  if (!social.ok) {
    return {
      ok: false,
      gate: "social-preview-images",
      reason: social.reason,
    };
  }

  const alternates = verifyExportLocalizedAlternates(shared);
  if (!alternates.ok) {
    return {
      ok: false,
      gate: "localized-alternates",
      reason: alternates.reason,
    };
  }

  const sitemap = verifyExportSitemap(shared);
  if (!sitemap.ok) {
    return {
      ok: false,
      gate: "sitemap",
      reason: sitemap.reason,
    };
  }

  const robots = verifyExportRobots(shared);
  if (!robots.ok) {
    return {
      ok: false,
      gate: "robots",
      reason: robots.reason,
    };
  }

  return { ok: true };
}
