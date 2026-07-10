import type { Metadata } from "next";
import {
  type BuildModeEnv,
  resolveGitHubPagesBasePath,
} from "@/lib/build/static-export";
import { withBasePath } from "@/lib/navigation/site-path";

/**
 * Resolves an absolute site href for public-asset or non-Metadata contexts that
 * bypass Next `<Link>` / automatic `assetPrefix` rewriting.
 *
 * For Next.js Metadata canonical/hreflang/OG fields, prefer app-relative hrefs
 * and let root `metadataBase` (`resolveProductionMetadataBase`) own the
 * production origin + project-site base path. Prefixing those fields as well
 * double-prefixes under project-site export.
 *
 * Pass an explicit base path string, or omit / pass env to read the export
 * GitHub Pages base path (`""` for root / non-export builds).
 */
export function resolveSiteAbsoluteHref(
  href: string,
  basePathOrEnv: string | BuildModeEnv = process.env,
): string {
  const basePath =
    typeof basePathOrEnv === "string"
      ? basePathOrEnv
      : resolveGitHubPagesBasePath(basePathOrEnv);
  return withBasePath(href, basePath);
}

/**
 * Prefixes a root-absolute public asset path (`/favicon.ico`, `/images/...`)
 * for project-site exports. Root / unset-base-path builds stay unprefixed.
 */
export function resolvePublicAssetHref(
  assetPath: string,
  basePathOrEnv: string | BuildModeEnv = process.env,
): string {
  return resolveSiteAbsoluteHref(assetPath, basePathOrEnv);
}

function prefixAlternateHref(
  href: NonNullable<Metadata["alternates"]>["canonical"],
  basePath: string,
): NonNullable<Metadata["alternates"]>["canonical"] {
  if (typeof href === "string") {
    return withBasePath(href, basePath);
  }
  return href;
}

/**
 * Applies the project-site (or root) base path to canonical + language
 * alternate hrefs. Leaves descriptor objects and external URLs unchanged via
 * `withBasePath`.
 *
 * Prefer app-relative alternates with root `metadataBase` for Next Metadata
 * fields. Use this helper only when emitting path-prefixed hrefs outside
 * metadataBase composition (for example raw export HTML assertions).
 */
export function prefixMetadataAlternates(
  alternates: NonNullable<Metadata["alternates"]>,
  basePath = "",
): NonNullable<Metadata["alternates"]> {
  const languages = alternates.languages
    ? Object.fromEntries(
        Object.entries(alternates.languages).map(([locale, href]) => [
          locale,
          typeof href === "string" ? withBasePath(href, basePath) : href,
        ]),
      )
    : undefined;

  return {
    ...alternates,
    canonical: prefixAlternateHref(alternates.canonical, basePath),
    languages,
  };
}
