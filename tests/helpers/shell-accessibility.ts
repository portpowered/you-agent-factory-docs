import { type RenderResult, within } from "@testing-library/react";
import { DOCS_NAV_HEADING, GITHUB_CTA_LABEL } from "../../src/lib/shell";
import {
  DOCS_SITE_NAV_ARIA_LABEL,
  type DocsShellAccessibilitySnapshot,
  LANDING_PRIMARY_NAV_ARIA_LABEL,
  type LandingShellAccessibilitySnapshot,
  type ShellAccessibilitySnapshot,
} from "../../src/lib/validation/shell-accessibility";

function resolveShellRoot(
  rendered: RenderResult | undefined,
  selector: string,
): HTMLElement {
  const scopedRoot = rendered?.container.querySelector(selector);
  if (scopedRoot instanceof HTMLElement) {
    return scopedRoot;
  }

  return rendered?.container ?? document.body;
}

export function collectLandingShellAccessibilitySnapshot(
  rendered?: RenderResult,
): LandingShellAccessibilitySnapshot {
  const root = within(resolveShellRoot(rendered, ".landing-shell"));
  const primaryNav = root.queryByRole("navigation", {
    name: LANDING_PRIMARY_NAV_ARIA_LABEL,
  });
  const main = root.queryByRole("main");
  const heroHeading = main
    ? within(main).queryByRole("heading", { level: 1 })
    : null;
  const githubLink = main
    ? within(main).queryByRole("link", { name: GITHUB_CTA_LABEL })
    : null;

  return {
    primaryNavigationLabel: primaryNav?.getAttribute("aria-label") ?? "",
    hasMainLandmark: main !== null,
    heroHeadingLevel: heroHeading?.tagName === "H1" ? 1 : 0,
    externalGithubLinkRel: githubLink?.getAttribute("rel") ?? null,
  };
}

export function collectDocsShellAccessibilitySnapshot(
  rendered?: RenderResult,
): DocsShellAccessibilitySnapshot {
  const root = within(resolveShellRoot(rendered, ".docs-shell"));
  const banner = root.queryByRole("banner");
  const siteNav = root.queryByRole("navigation", {
    name: DOCS_SITE_NAV_ARIA_LABEL,
  });
  const docsNav = root.queryByRole("navigation", {
    name: DOCS_NAV_HEADING,
  });
  const main = root.queryByRole("main");
  const overviewLink = docsNav?.querySelector('[aria-current="page"]');

  return {
    hasBannerLandmark: banner !== null,
    siteNavigationLabel: siteNav?.getAttribute("aria-label") ?? "",
    docsNavigationLabel: docsNav?.getAttribute("aria-label") ?? "",
    hasMainLandmark: main !== null,
    overviewLinkAriaCurrent: overviewLink?.getAttribute("aria-current") ?? null,
  };
}

export function collectShellAccessibilitySnapshot(
  landingRendered: RenderResult,
  docsRendered: RenderResult,
): ShellAccessibilitySnapshot {
  return {
    landing: collectLandingShellAccessibilitySnapshot(landingRendered),
    docs: collectDocsShellAccessibilitySnapshot(docsRendered),
  };
}
