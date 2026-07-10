/**
 * Prefixes an internal app href with a GitHub Pages project-site base path.
 * External URLs, hash links, and already-prefixed paths are returned unchanged.
 *
 * Next.js `<Link>` already honors `basePath` from next.config — pass unprefixed
 * app hrefs to Link. Use this helper for absolute URL contexts that bypass Link
 * (export verification, raw anchors, metadata, client fetches).
 */
export function withBasePath(href: string, basePath = ""): string {
  if (
    basePath === "" ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("#")
  ) {
    return href;
  }

  if (href === basePath || href.startsWith(`${basePath}/`)) {
    return href;
  }

  const normalizedPath = href.startsWith("/") ? href : `/${href}`;
  return `${basePath}${normalizedPath}`;
}

/**
 * Strips a GitHub Pages project-site base path from an absolute href.
 * Used when matching locale routes against pathnames that may include the
 * project-site prefix (for example export HTML or absolute browser URLs).
 */
export function stripBasePathFromHref(href: string, basePath = ""): string {
  if (basePath === "") {
    return href;
  }

  if (href === basePath || href === `${basePath}/`) {
    return "/";
  }

  if (href.startsWith(`${basePath}/`)) {
    const stripped = href.slice(basePath.length);
    return stripped === "" ? "/" : stripped;
  }

  return href;
}
