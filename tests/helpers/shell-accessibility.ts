import { type RenderResult, within } from "@testing-library/react";
import { PROJECT_TAGLINE } from "../../src/lib/project";
import type {
  DocsShellAccessibilitySnapshot,
  LandingShellAccessibilitySnapshot,
  ShellAccessibilitySnapshot,
} from "../../src/lib/validation/shell-accessibility";
import { enMessages } from "../../src/localization/messages/en";

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
  const root = within(resolveShellRoot(rendered, ".shared-shell"));
  const primaryNav = root.queryByRole("navigation", {
    name: enMessages.landing.primaryNavAriaLabel,
  });
  const main = root.queryByRole("main");
  const hero = main
    ? within(main).queryByRole("region", { name: PROJECT_TAGLINE })
    : null;
  const heroHeading = hero
    ? within(hero).queryByRole("heading", { level: 1 })
    : null;
  const githubLink = hero
    ? within(hero).queryByRole("link", {
        name: enMessages.common.githubCta,
      })
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
  const root = within(resolveShellRoot(rendered, ".shared-shell"));
  const banner = root.queryByRole("banner");
  const siteNav = root.queryByRole("navigation", {
    name: enMessages.landing.primaryNavAriaLabel,
  });
  const docsNav = root.queryByRole("navigation", {
    name: enMessages.docs.navHeading,
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
