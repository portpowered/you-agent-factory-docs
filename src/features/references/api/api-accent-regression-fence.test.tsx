/**
 * Lane regression fence for repair-api-accents-secondary-not-primary-003.
 *
 * Locks observable rendered behavior so:
 * - API method-badge accents stay secondary / muted-secondary (not primary)
 * - Batch-011 navigator operation-entry links stay `text-secondary`
 * - Batch-010 browse / factories textual CTAs stay secondary (not primary)
 *
 * Assertions target rendered classes / markup only — no source-file inventory
 * or site-wide primary audit.
 */

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import FactoriesIndexPage from "@/app/(site)/(with-docs-chrome)/docs/factories/page";
import { renderBrowseIndexPage } from "@/app/(site)/site-renderers";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { createOpenApiOperationSummary } from "@/lib/references/family-normalized-models";
import { API_METHOD_BADGE_ATTR, ApiMethodBadge } from "./api-method-badge";
import { ApiOperationNavigator } from "./api-operation-navigator";
import {
  API_OPERATION_NAV_ATTR,
  API_OPERATION_NAV_LINK_ATTR,
  buildApiOperationNavModel,
} from "./operation-navigation";
import {
  API_ACCENT_TOKEN_CLASSES,
  API_THEME_ROOT_ATTR,
  apiMethodBadgeToneClass,
  avoidsPrimaryAccentClasses,
} from "./theme-tokens";

afterEach(() => {
  cleanup();
});

const sampleOps = [
  createOpenApiOperationSummary({
    source: {
      publicArtifactId: "@you-agent-factory/api/openapi",
      pointer: "/paths/factory-sessions/{session_id}/work",
    },
    id: "submitWorkBySessionId",
    operationId: "submitWorkBySessionId",
    method: "post",
    path: "/factory-sessions/{session_id}/work",
    anchor: "submitWorkBySessionId",
    summary: "Submit work",
    tags: ["Work"],
  }),
];

/** Batch-010 browse section footer textual CTA class (must stay secondary). */
const BATCH_010_BROWSE_FOOTER_CTA_CLASS =
  "text-sm font-medium text-secondary underline-offset-4 decoration-secondary hover:underline";

describe("API accent lane regression fence", () => {
  test("method badges use secondary accent roles, never text-primary", () => {
    const { container } = render(
      <div {...{ [API_THEME_ROOT_ATTR]: "" }}>
        <ApiMethodBadge method="get" />
        <ApiMethodBadge method="post" />
        <ApiMethodBadge method="options" />
      </div>,
    );

    const badges = container.querySelectorAll(`[${API_METHOD_BADGE_ATTR}]`);
    expect(badges.length).toBe(3);

    for (const badge of badges) {
      expect(badge.className).not.toMatch(/\btext-primary\b/);
      expect(avoidsPrimaryAccentClasses(badge.className)).toBe(true);
    }

    const getBadge = screen.getByText("GET");
    expect(getBadge.className).toContain(API_ACCENT_TOKEN_CLASSES.selected);
    expect(getBadge.className).toContain(apiMethodBadgeToneClass("get"));

    const quietBadge = screen.getByText("OPTIONS");
    expect(quietBadge.className).toContain(API_ACCENT_TOKEN_CLASSES.quiet);
  });

  test("batch-011 navigator operation-entry links stay text-secondary", () => {
    const model = buildApiOperationNavModel(sampleOps, ["Work"]);
    const { container } = render(
      <div {...{ [API_THEME_ROOT_ATTR]: "" }}>
        <ApiOperationNavigator groups={model.groups} model={model} />
      </div>,
    );

    expect(
      container.querySelector(`[${API_OPERATION_NAV_ATTR}]`),
    ).not.toBeNull();

    const work = container.querySelector(
      '[data-api-operation-nav-tag="Work"]',
    ) as HTMLElement;
    const link = within(work).getByRole("link", { name: /Submit work/i });
    expect(link.getAttribute(API_OPERATION_NAV_LINK_ATTR)).toBe(
      "submitWorkBySessionId",
    );
    expect(link.className).toContain("text-secondary");
    expect(link.className).toContain(API_ACCENT_TOKEN_CLASSES.selected);
    expect(link.className).not.toMatch(/\btext-primary\b/);
  });

  test("batch-010 browse footer textual CTAs stay secondary, not primary yellow", async () => {
    const messages = await loadUiMessages();
    const page = await renderBrowseIndexPage();
    const html = renderToStaticMarkup(page);
    const documentationCta = messages.browseIndex.documentationSectionLinkLabel;

    expect(html).toContain(documentationCta);
    expect(html).toContain(BATCH_010_BROWSE_FOOTER_CTA_CLASS);
    expect(html).not.toContain(
      "text-sm font-medium text-primary underline-offset-4 hover:underline",
    );
    expect(html).not.toContain(
      "text-sm font-medium text-primary underline-offset-4 decoration-primary hover:underline",
    );
  });

  test("batch-010 factories index textual CTAs stay secondary, not primary yellow", async () => {
    render(await FactoriesIndexPage());

    const fullApi = document.querySelector(
      "[data-factories-index-full-api-link]",
    );
    expect(fullApi).toBeTruthy();
    expect(fullApi?.className).toContain("text-secondary");
    expect(fullApi?.className).toContain("decoration-secondary");
    expect(fullApi?.className).not.toMatch(/\btext-primary\b/);
    expect(fullApi?.className).not.toMatch(/\bdecoration-primary\b/);

    const fullSchema = document.querySelector(
      "[data-factories-index-full-schema-link]",
    );
    expect(fullSchema?.className).toContain("text-secondary");
    expect(fullSchema?.className).not.toMatch(/\btext-primary\b/);
  });
});
