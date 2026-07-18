/**
 * Page-owned render proof for the published OpenAPI projection mount.
 * Asserts navigation, operation sections, anchors, and filter chrome without
 * scanning foreign renderer inventories.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import {
  API_OPERATION_ANCHOR_ATTR,
  API_OPERATION_COPY_LINK_ATTR,
  API_OPERATION_FILTER_ATTR,
  API_OPERATION_NAV_ATTR,
  API_OPERATION_NAV_LINK_ATTR,
  API_OPERATION_SECTION_ATTR,
  API_PLAYGROUND_SUPPRESSED_ATTR,
  API_REFERENCE_PAGE_PATH,
  apiOperationAnchorUrl,
  buildApiOperationNavigationFromArtifact,
} from "@/components/references/api";
import { ApiReferenceProjection } from "./ApiReferenceProjection";

// Artifact load + full projection render can exceed Bun's 5s default.
const PROJECTION_RENDER_TIMEOUT_MS = 60_000;

describe("ApiReferenceProjection", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "mounts tag navigation, filter, and all published operation sections",
    () => {
      const { model } = buildApiOperationNavigationFromArtifact();
      expect(model.operationCount).toBeGreaterThan(0);

      const { container } = render(<ApiReferenceProjection />);

      const root = screen.getByTestId("api-reference-projection");
      expect(root).toBeTruthy();
      expect(root.getAttribute(API_PLAYGROUND_SUPPRESSED_ATTR)).toBe("true");

      expect(
        container.querySelector(`[${API_OPERATION_NAV_ATTR}]`),
      ).not.toBeNull();
      expect(
        container.querySelector(`[${API_OPERATION_FILTER_ATTR}]`),
      ).not.toBeNull();

      const sections = container.querySelectorAll(
        `[${API_OPERATION_SECTION_ATTR}]`,
      );
      expect(sections.length).toBe(model.operationCount);

      for (const item of model.groups.flatMap((group) => group.items)) {
        const section = container.querySelector(`#${CSS.escape(item.anchor)}`);
        expect(section).not.toBeNull();
        expect(section?.getAttribute(API_OPERATION_ANCHOR_ATTR)).toBe(
          item.anchor,
        );

        const expectedUrl = apiOperationAnchorUrl(
          item.anchor,
          API_REFERENCE_PAGE_PATH,
        );
        const copyControl = section?.querySelector(
          `[${API_OPERATION_COPY_LINK_ATTR}="${item.anchor}"]`,
        );
        expect(copyControl).not.toBeNull();
        expect(
          section
            ?.querySelector("[data-api-operation-copy-value]")
            ?.getAttribute("data-api-operation-copy-value"),
        ).toBe(expectedUrl);

        const navLinks = container.querySelectorAll(
          `[${API_OPERATION_NAV_LINK_ATTR}][href="#${item.anchor}"]`,
        );
        expect(navLinks.length).toBeGreaterThan(0);
      }
    },
    PROJECTION_RENDER_TIMEOUT_MS,
  );
});
