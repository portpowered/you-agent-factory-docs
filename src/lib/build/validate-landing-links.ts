/**
 * Link validation for the landing surface.
 *
 * `validate-links.ts` runs `next-validate-link` over **MDX** only, so the
 * homepage's hrefs — which live as string literals in TypeScript, not markdown —
 * were never checked. That is how an empty `[here]()` target and any future
 * drift toward a deleted route could ship unnoticed.
 *
 * This module closes that gap with a deliberately small check: pull internal
 * href literals out of the landing source files, resolve each against the real
 * published route inventory, and fail on anything that would 404.
 */

import { readFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { resolveDocumentationRouteMigrationTarget } from "@/lib/seo/documentation-route-migration";
import { listComingSoonRoutes } from "@/lib/site/coming-soon-pages";

/**
 * Source files whose internal href literals ship to readers on `/`.
 *
 * Repo-relative. Landing components render raw `<a href>` (not `next/link`),
 * so these strings reach the browser exactly as written.
 */
export const LANDING_LINK_SOURCE_FILES = [
  "src/features/landing-page/landing-page.data.ts",
  "src/features/landing-page/components/CapabilityStrip.tsx",
  "src/app/(site)/compose-production-landing-slots.tsx",
] as const;

export type LandingLinkReference = {
  /** Repo-relative source file the href literal was found in. */
  file: string;
  /** 1-indexed line number of the literal. */
  line: number;
  /** The href exactly as written in source. */
  href: string;
};

export type LandingLinkError = LandingLinkReference & {
  reason: string;
};

/** Matches `href: "…"` / `href="…"` / `href={"…"}` string literals. */
const HREF_LITERAL_PATTERN = /\bhref\s*[:=]\s*\{?\s*["'`]([^"'`]*)["'`]/g;

/**
 * Matches a markdown-style inline link inside prose strings — `[label](/href)`.
 *
 * FAQ answers are authored as plain strings and rendered through
 * `parseFaqAnswerSegments`, so a link written this way is a real reader-facing
 * destination even though it never appears as an `href=` literal. An empty
 * target (`[here]()`) is captured so it reports rather than slipping through.
 */
const MARKDOWN_LINK_PATTERN = /\[[^\]\n]+\]\(([^)\s]*)\)/g;

/**
 * True for hrefs this validator is responsible for.
 *
 * External URLs, `mailto:`, `tel:`, and bare fragments resolve outside the
 * route inventory and are intentionally out of scope.
 */
export function isInternalLandingHref(href: string): boolean {
  if (href === "") {
    // Not "internal" in a useful sense, but an empty href is always a defect —
    // extractLandingLinkReferences keeps it so validation can report it.
    return true;
  }
  return (
    !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href) &&
    !href.startsWith("//") &&
    !href.startsWith("#")
  );
}

/** Extracts internal href literals with their line numbers from source text. */
export function extractLandingLinkReferences(
  file: string,
  content: string,
): LandingLinkReference[] {
  const references: LandingLinkReference[] = [];

  content.split("\n").forEach((text, index) => {
    for (const pattern of [HREF_LITERAL_PATTERN, MARKDOWN_LINK_PATTERN]) {
      for (const match of text.matchAll(pattern)) {
        const href = match[1] ?? "";
        if (isInternalLandingHref(href)) {
          references.push({ file, line: index + 1, href });
        }
      }
    }
  });

  return references;
}

/** Normalizes an href to its inventory form: no query, hash, or trailing slash. */
export function normalizeLandingHref(href: string): string {
  const withoutHash = href.split("#")[0] ?? "";
  const withoutQuery = withoutHash.split("?")[0] ?? "";
  if (withoutQuery === "/" || withoutQuery === "") {
    return withoutQuery;
  }
  return withoutQuery.endsWith("/") ? withoutQuery.slice(0, -1) : withoutQuery;
}

export type ValidateLandingLinksOptions = {
  cwd?: string;
  files?: readonly string[];
  /** App-relative routes that exist. Defaults to the live published inventory. */
  knownRoutes?: readonly string[];
};

/**
 * Docs shell roots that build as real pages but stay out of the sitemap, which
 * advertises `/browse` as the canonical discovery surface instead.
 */
export const LANDING_LINK_EXTRA_ROUTES = ["/docs"] as const;

/**
 * Every app-relative route a landing link may point at: the public sitemap
 * inventory, the coming-soon placeholders (real buildable pages deliberately
 * excluded from the sitemap), and the docs shell roots.
 *
 * Deliberately excludes retired documentation routes. Those still serve
 * compatibility HTML, so linking to one does not 404 — but it sends readers to
 * a superseded page, so the validator pushes landing links onto canonicals.
 */
export async function listLandingLinkTargets(): Promise<string[]> {
  const { listPublicSitemapRoutes } = await import(
    "@/lib/seo/public-sitemap-routes"
  );

  return [
    ...new Set(
      [
        ...listPublicSitemapRoutes(),
        ...listComingSoonRoutes(),
        ...LANDING_LINK_EXTRA_ROUTES,
      ].map((route) => normalizeLandingHref(route)),
    ),
  ];
}

/**
 * Validates every internal href literal on the landing surface against the
 * published route inventory. Returns one error per broken link.
 */
export async function validateLandingLinks(
  options: ValidateLandingLinksOptions = {},
): Promise<LandingLinkError[]> {
  const cwd = options.cwd ?? process.cwd();
  const files = options.files ?? LANDING_LINK_SOURCE_FILES;
  const known = new Set(
    options.knownRoutes ?? (await listLandingLinkTargets()),
  );
  const errors: LandingLinkError[] = [];

  for (const file of files) {
    const absolute = isAbsolute(file) ? file : join(cwd, file);
    const repoRelative = relative(cwd, absolute);
    const references = extractLandingLinkReferences(
      repoRelative,
      readFileSync(absolute, "utf8"),
    );

    for (const reference of references) {
      if (reference.href === "") {
        errors.push({ ...reference, reason: "empty href" });
        continue;
      }
      if (!reference.href.startsWith("/")) {
        errors.push({
          ...reference,
          reason:
            "relative href on the landing surface — use a root-absolute path",
        });
        continue;
      }

      const normalized = normalizeLandingHref(reference.href);
      if (known.has(normalized)) {
        continue;
      }

      const replacement = resolveDocumentationRouteMigrationTarget(normalized);
      errors.push({
        ...reference,
        reason: replacement
          ? `retired route superseded by ${replacement} — link to the canonical page`
          : `no published route for ${normalized} — point it at a live page or add a coming-soon slug`,
      });
    }
  }

  return errors;
}

/** Maintainer reproduction command printed on failure. */
export const LANDING_LINKCHECK_COMMAND = "make linkcheck";

/** Prints landing link errors. Returns true when the surface is clean. */
export function reportLandingLinkValidation(
  errors: readonly LandingLinkError[],
): boolean {
  if (errors.length === 0) {
    console.log("Landing link validation passed.");
    return true;
  }

  console.error(
    `\n${errors.length} broken landing link(s). Reproduce locally with: ${LANDING_LINKCHECK_COMMAND}`,
  );
  for (const error of errors) {
    console.error(
      `  ${error.file}:${error.line}  "${error.href}" — ${error.reason}`,
    );
  }
  return false;
}
