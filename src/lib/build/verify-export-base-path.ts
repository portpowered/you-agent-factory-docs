import { withBasePath } from "@/lib/navigation/site-path";

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
