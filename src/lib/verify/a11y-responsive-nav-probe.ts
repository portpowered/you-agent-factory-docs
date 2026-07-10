/**
 * Primary-nav usability probes for mobile/tablet responsive matrix checks.
 * Pure DOM helpers for happy-dom; Playwright stories mirror the click path.
 */

export type PrimaryNavUsabilityProbe = {
  mode: "drawer" | "inline";
  hasMenuButton: boolean;
  menuButtonLabel: string | null;
  menuButtonExpanded: boolean | null;
  hasPrimaryNavigation: boolean;
  primaryLinkCount: number;
  primaryLinkLabels: string[];
};

function readAccessibleName(element: Element): string {
  const aria = element.getAttribute("aria-label");
  if (aria?.trim()) {
    return aria.trim();
  }
  return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Inspects whether primary navigation is reachable via the mobile drawer
 * control or the desktop inline nav. Call after opening the drawer when
 * `mode` should be `"drawer"`.
 */
export function probePrimaryNavUsability(
  root: ParentNode,
  mode: "drawer" | "inline" = "inline",
): PrimaryNavUsabilityProbe {
  const menuButton =
    root.querySelector<HTMLButtonElement>(
      "button[aria-controls][aria-expanded]",
    ) ??
    root.querySelector<HTMLButtonElement>(
      "header button[aria-label], header button[aria-expanded]",
    );

  const primaryNav = root.querySelector('nav[aria-label="Primary"]');
  const links = primaryNav
    ? (Array.from(
        primaryNav.querySelectorAll("a[href]"),
      ) as HTMLAnchorElement[])
    : [];

  return {
    mode,
    hasMenuButton: Boolean(menuButton),
    menuButtonLabel: menuButton ? readAccessibleName(menuButton) : null,
    menuButtonExpanded: menuButton
      ? menuButton.getAttribute("aria-expanded") === "true"
      : null,
    hasPrimaryNavigation: Boolean(primaryNav),
    primaryLinkCount: links.length,
    primaryLinkLabels: links.map((link) => readAccessibleName(link)),
  };
}
