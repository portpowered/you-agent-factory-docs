import { withBasePath } from "@/lib/navigation/site-path";
import { PRODUCTION_SITE_ORIGIN } from "@/lib/seo/production-metadata-base";

/** True when exported HTML references bundled assets under the configured base path. */
export function exportHtmlReferencesBasePathAssets(
  html: string,
  basePath: string,
): boolean {
  if (basePath === "") {
    return false;
  }

  return html.includes(`${basePath}/_next/`);
}

/**
 * True when exported HTML references bare root-level `/_next` assets
 * (`src`/`href` starting at `/_next/`), which escape a project-site prefix.
 */
export function exportHtmlReferencesRootLevelNextAssets(html: string): boolean {
  return /(?:src|href)=["']\/_next\//.test(html);
}

function metadataHrefCandidates(path: string, basePath: string): string[] {
  const prefixed = withBasePath(path, basePath);
  const absolute =
    basePath === ""
      ? `${PRODUCTION_SITE_ORIGIN}${prefixed === "/" ? "/" : prefixed}`
      : `${PRODUCTION_SITE_ORIGIN}${prefixed}`;
  return prefixed === absolute ? [prefixed] : [prefixed, absolute];
}

function htmlIncludesMetadataHref(html: string, href: string): boolean {
  return (
    html.includes(`href="${href}"`) ||
    html.includes(`href='${href}'`) ||
    html.includes(`rel="canonical" href="${href}"`) ||
    html.includes(`href="${href}" rel="canonical"`)
  );
}

/**
 * True when exported HTML advertises a canonical (and optional hreflang)
 * href under the configured base path — either as a path-prefixed relative
 * href or as an absolute production URL composed with metadataBase.
 */
export function exportHtmlReferencesPrefixedMetadataHrefs(
  html: string,
  basePath: string,
  canonicalPath: string,
  languagePaths: readonly string[] = [],
): boolean {
  const hasCanonical = metadataHrefCandidates(canonicalPath, basePath).some(
    (href) =>
      html.includes(`rel="canonical" href="${href}"`) ||
      html.includes(`href="${href}" rel="canonical"`),
  );

  if (!hasCanonical) {
    return false;
  }

  return languagePaths.every((path) => {
    const candidates = metadataHrefCandidates(path, basePath);
    return (
      html.includes(`hreflang=`) &&
      candidates.some((href) => htmlIncludesMetadataHref(html, href))
    );
  });
}

/** True when exported HTML references a public asset under the configured base path. */
export function exportHtmlReferencesPrefixedPublicAsset(
  html: string,
  basePath: string,
  assetPath: string,
): boolean {
  const absolute = withBasePath(assetPath, basePath);
  return (
    html.includes(`href="${absolute}"`) ||
    html.includes(`src="${absolute}"`) ||
    html.includes(`url(${absolute})`) ||
    html.includes(`url("${absolute}")`)
  );
}

/** True when exported HTML includes at least one internal docs or tags href under basePath. */
export function exportHtmlReferencesBasePathInternalLinks(
  html: string,
  basePath: string,
): boolean {
  if (basePath === "") {
    return false;
  }

  const docsHref = `href="${basePath}/docs/`;
  const tagsHref = `href="${basePath}/tags`;
  const blogHref = `href="${basePath}/blog`;
  const rootHref = `href="${basePath}"`;

  return (
    html.includes(docsHref) ||
    html.includes(tagsHref) ||
    html.includes(blogHref) ||
    html.includes(`${rootHref}/`) ||
    html.includes(`${rootHref}"`)
  );
}

/**
 * True when exported HTML includes every representative navigation href under
 * the configured base path (home, docs, blog, and optional locale variants).
 */
export function exportHtmlReferencesPrefixedNavigationHrefs(
  html: string,
  basePath: string,
  hrefs: readonly string[],
): boolean {
  return hrefs.every((href) => {
    const absolute = withBasePath(href, basePath);
    if (html.includes(`href="${absolute}"`)) {
      return true;
    }
    // Home may serialize as href="/base" or href="/base/" depending on Link.
    if (href === "/" && basePath !== "") {
      return (
        html.includes(`href="${basePath}"`) ||
        html.includes(`href="${basePath}/"`)
      );
    }
    return false;
  });
}
