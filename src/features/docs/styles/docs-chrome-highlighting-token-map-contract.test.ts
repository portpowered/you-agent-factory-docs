import { afterEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import {
  assertDocsChromeTokenMapSurfaceRolesAligned,
  DOCS_CHROME_TOKEN_MAP_FACTORY_DARK_PROOFS,
  DOCS_CHROME_TOKEN_MAP_LOCKED_SURFACE_ROLES,
  DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS,
  DOCS_CHROME_TOKEN_MAP_SURFACES,
} from "@/features/docs/styles/docs-chrome-highlighting-token-map-contract";
import { DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES } from "@/lib/theme/docs-chrome-highlighting-tokens";

function normalizeHex(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith("#") && trimmed.length === 7) {
    return trimmed;
  }
  const rgb = trimmed.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (!rgb) {
    return trimmed;
  }
  const toHex = (channel: string) =>
    Number(channel).toString(16).padStart(2, "0");
  return `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}`;
}

describe("docs chrome highlighting token-map contract (five surfaces)", () => {
  let window: Window | undefined;

  afterEach(() => {
    window?.close();
    window = undefined;
  });

  test("exposes exactly the five reader-facing chrome surfaces", () => {
    expect([...DOCS_CHROME_TOKEN_MAP_SURFACES]).toEqual([
      "searchGlobeGitHub",
      "toc",
      "sidebarRow",
      "headerTextIcons",
      "breadcrumb",
    ]);

    for (const surface of DOCS_CHROME_TOKEN_MAP_SURFACES) {
      expect(DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS[surface]).toBeDefined();
      expect(
        DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS[surface].hoverActiveRole,
      ).toBe("primaryYellow");
    }
  });

  test("surface modules stay aligned with the locked highlighting role map", () => {
    const aligned = assertDocsChromeTokenMapSurfaceRolesAligned();

    expect(aligned.searchGlobeGitHub).toEqual(
      DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.searchGlobeGitHub,
    );
    expect(aligned.tocCurrent).toEqual(
      DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.tocCurrent,
    );
    expect(aligned.tocNonCurrent).toEqual(
      DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.tocNonCurrent,
    );
    expect(aligned.sidebarRow).toEqual(
      DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.sidebarRow,
    );
    expect(aligned.headerTextIcons).toEqual(
      DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.headerTextIcons,
    );
    expect(aligned.breadcrumb).toEqual(
      DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.breadcrumb,
    );

    expect(DOCS_CHROME_TOKEN_MAP_LOCKED_SURFACE_ROLES).toEqual(
      DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES,
    );
  });

  test("encodes resting vs hover/active roles for all five surfaces", () => {
    expect(
      DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.searchGlobeGitHub,
    ).toEqual({
      mapSurfaces: ["searchGlobeGitHub"],
      restRoles: ["surroundingChromeBackground"],
      hoverActiveRole: "primaryYellow",
      hoverActiveKind: "overlay",
      restProofs: ["#050b10"],
      hoverActiveProof: "#f5c76f",
    });

    expect(DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.toc).toEqual({
      mapSurfaces: ["tocCurrent", "tocNonCurrent"],
      restRoles: ["secondaryBlue", "mutedWhite"],
      hoverActiveRole: "primaryYellow",
      hoverActiveKind: "overlay",
      restProofs: ["#507f8c", "#8aaeb8"],
      hoverActiveProof: "#f5c76f",
    });

    expect(DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.sidebarRow).toEqual({
      mapSurfaces: ["sidebarRow"],
      restRoles: ["white"],
      hoverActiveRole: "primaryYellow",
      hoverActiveKind: "background",
      restProofs: ["#f7f2e8"],
      hoverActiveProof: "#f5c76f",
    });

    expect(DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.headerTextIcons).toEqual({
      mapSurfaces: ["headerTextIcons"],
      restRoles: ["white"],
      hoverActiveRole: "primaryYellow",
      hoverActiveKind: "overlay",
      restProofs: ["#f7f2e8"],
      hoverActiveProof: "#f5c76f",
    });

    expect(DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.breadcrumb).toEqual({
      mapSurfaces: ["breadcrumb"],
      restRoles: ["mutedWhite"],
      hoverActiveRole: "primaryYellow",
      hoverActiveKind: "overlay",
      restProofs: ["#8aaeb8"],
      hoverActiveProof: "#f5c76f",
    });

    // Sidebar is the only surface whose hover is a fill background.
    expect(
      DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.sidebarRow.hoverActiveKind,
    ).toBe("background");
    for (const surface of DOCS_CHROME_TOKEN_MAP_SURFACES) {
      if (surface === "sidebarRow") {
        continue;
      }
      expect(
        DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS[surface].hoverActiveKind,
      ).toBe("overlay");
    }
  });

  test("factory-dark proofs match the locked chrome hex map", () => {
    expect(DOCS_CHROME_TOKEN_MAP_FACTORY_DARK_PROOFS).toEqual({
      surroundingChromeBackground: "#050b10",
      primaryYellow: "#f5c76f",
      secondaryBlue: "#507f8c",
      white: "#f7f2e8",
      mutedWhite: "#8aaeb8",
    });
  });

  test("all five surfaces paint observable factory-dark rest and hover colors on DOM", () => {
    window = new Window({ url: "https://example.test/" });
    const { document } = window;
    const proofs = DOCS_CHROME_TOKEN_MAP_FACTORY_DARK_PROOFS;
    const expectations = DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS;

    const search = document.createElement("button");
    search.setAttribute("data-search", "");
    search.style.backgroundColor = expectations.searchGlobeGitHub.restProofs[0];

    const tocCurrent = document.createElement("a");
    tocCurrent.href = "#overview";
    tocCurrent.setAttribute("data-active", "true");
    tocCurrent.style.color = expectations.toc.restProofs[0];

    const tocNonCurrent = document.createElement("a");
    tocNonCurrent.href = "#install";
    tocNonCurrent.style.color = expectations.toc.restProofs[1];

    const sidebar = document.createElement("a");
    sidebar.className = "docs-chrome-sidebar-row";
    sidebar.href = "/docs/guides/getting-started";
    sidebar.style.color = expectations.sidebarRow.restProofs[0];
    sidebar.style.backgroundColor = "transparent";

    const headerText = document.createElement("a");
    headerText.className = "docs-chrome-header-text";
    headerText.href = "/";
    headerText.style.color = expectations.headerTextIcons.restProofs[0];

    const breadcrumb = document.createElement("a");
    breadcrumb.className = "docs-chrome-breadcrumb-link";
    breadcrumb.href = "/docs";
    breadcrumb.style.color = expectations.breadcrumb.restProofs[0];

    document.body.append(
      search,
      tocCurrent,
      tocNonCurrent,
      sidebar,
      headerText,
      breadcrumb,
    );

    expect(normalizeHex(search.style.backgroundColor)).toBe(
      proofs.surroundingChromeBackground,
    );
    expect(normalizeHex(tocCurrent.style.color)).toBe(proofs.secondaryBlue);
    expect(normalizeHex(tocNonCurrent.style.color)).toBe(proofs.mutedWhite);
    expect(normalizeHex(sidebar.style.color)).toBe(proofs.white);
    expect(normalizeHex(headerText.style.color)).toBe(proofs.white);
    expect(normalizeHex(breadcrumb.style.color)).toBe(proofs.mutedWhite);

    search.style.backgroundColor =
      expectations.searchGlobeGitHub.hoverActiveProof;
    tocCurrent.style.color = expectations.toc.hoverActiveProof;
    tocNonCurrent.style.color = expectations.toc.hoverActiveProof;
    sidebar.style.backgroundColor = expectations.sidebarRow.hoverActiveProof;
    headerText.style.color = expectations.headerTextIcons.hoverActiveProof;
    breadcrumb.style.color = expectations.breadcrumb.hoverActiveProof;

    expect(normalizeHex(search.style.backgroundColor)).toBe(
      proofs.primaryYellow,
    );
    expect(normalizeHex(tocCurrent.style.color)).toBe(proofs.primaryYellow);
    expect(normalizeHex(tocNonCurrent.style.color)).toBe(proofs.primaryYellow);
    expect(normalizeHex(sidebar.style.backgroundColor)).toBe(
      proofs.primaryYellow,
    );
    expect(normalizeHex(headerText.style.color)).toBe(proofs.primaryYellow);
    expect(normalizeHex(breadcrumb.style.color)).toBe(proofs.primaryYellow);
  });
});
