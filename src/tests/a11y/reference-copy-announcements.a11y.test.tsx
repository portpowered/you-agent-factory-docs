/**
 * Always-on W19 reference-surface code-copy and deep-link copy announcement
 * proofs. Served-page probes live in
 * `a11y-reference-copy-announcement-page.test.ts` (opt-in via
 * VERIFY_PRODUCTION_INTEGRATION_TESTS).
 */

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, waitFor } from "@testing-library/react";
import { ApiNavigationVerificationHarness } from "@/components/references/api/api-navigation-verification-harness";
import { ApiOperationExamples } from "@/components/references/api/api-operation-examples";
import type { ApiOperationDetail } from "@/components/references/api/operation-detail";
import type { ApiOperationNavModel } from "@/components/references/api/operation-navigation";
import { SchemaExamplePanel } from "@/components/references/schema/schema-example-panel";
import { CopyableReferenceAnchor } from "@/components/references/shared/CopyableReferenceAnchor";
import { FactorySchemaReference } from "@/content/docs/references/factory-schema/FactorySchemaReference";
import {
  expectReferenceCopyAnnouncementChrome,
  expectReferenceCopyAnnouncements,
  listRequiredReferenceCopyAnnouncements,
  probeReferenceCopyAnnouncement,
  REFERENCE_COPY_ANNOUNCEMENTS,
} from "@/lib/verify/a11y-reference-copy-announcement-contract";
import { REFERENCE_SURFACE_ROUTES } from "@/lib/verify/a11y-reference-surface-contract";

function installClipboardMock() {
  const writeText = mock((text: string) => {
    void text;
    return Promise.resolve();
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: {
      writeText: (text: string) => writeText(text),
    },
  });
  return writeText;
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  mock.restore();
});

const miniNav: ApiOperationNavModel = {
  groups: [
    {
      tag: "Work",
      items: [
        {
          id: "submitWorkBySessionId",
          method: "post",
          path: "/factory-sessions/{session_id}/work",
          operationId: "submitWorkBySessionId",
          anchor: "submitWorkBySessionId",
          summary: "Submit work",
          tags: ["Work"],
        },
      ],
    },
  ],
  linkCount: 1,
  operationCount: 1,
};

const sampleDetail: ApiOperationDetail = {
  method: "post",
  path: "/factory-sessions/{session_id}/work",
  operationId: "submitWorkBySessionId",
  anchor: "submitWorkBySessionId",
  summary: "Submit work",
  parameters: [],
  responses: [],
};

const detailsByAnchor = new Map<string, ApiOperationDetail>([
  ["submitWorkBySessionId", sampleDetail],
]);

describe("reference copy status announcements (always-on)", () => {
  test("contract requires deep-link copy announcements on primary routes", () => {
    const byRoute = Object.fromEntries(
      REFERENCE_SURFACE_ROUTES.map((route) => [
        route.id,
        listRequiredReferenceCopyAnnouncements(route.id).map((spec) => spec.id),
      ]),
    );

    expect(byRoute["references-api"]).toEqual(["api-deep-link-copy"]);
    expect(byRoute["references-events"]).toEqual(["events-deep-link-copy"]);
    expect(byRoute["references-factory-schema"]).toEqual([
      "schema-deep-link-copy",
    ]);
    expect(byRoute["authored-factory"]).toEqual([]);
  });

  test("API harness deep-link copy announces via polite live region", async () => {
    installClipboardMock();
    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={detailsByAnchor}
        model={miniNav}
      />,
    );

    expect(() =>
      expectReferenceCopyAnnouncementChrome(container, "references-api"),
    ).not.toThrow();

    await expectReferenceCopyAnnouncements(container, "references-api");

    await waitFor(() => {
      const status = container.querySelector(
        "[data-api-operation-copy-status]",
      );
      expect(status?.getAttribute("aria-live")).toBe("polite");
      expect((status?.textContent ?? "").trim().length).toBeGreaterThan(0);
    });
  });

  test("API example code-copy announces via polite live region when present", async () => {
    installClipboardMock();
    const { container } = render(
      <ApiOperationExamples
        examples={[
          {
            id: "ok",
            label: "OK",
            language: "json",
            code: '{"ok":true}',
          },
        ]}
      />,
    );

    const spec = REFERENCE_COPY_ANNOUNCEMENTS.find(
      (entry) => entry.id === "api-code-copy",
    );
    expect(spec).toBeDefined();
    if (!spec) {
      return;
    }
    const codeCopy = await probeReferenceCopyAnnouncement(container, spec);
    expect(codeCopy.controlFound).toBe(true);
    expect(codeCopy.announcedAfterCopy).toBe(true);
    expect(codeCopy.announcementPersistsWithoutHover).toBe(true);
  });

  test("events CopyableReferenceAnchor announces copy status without hover", async () => {
    installClipboardMock();
    const { container } = render(
      <CopyableReferenceAnchor anchor="RUN_REQUEST" family="events" />,
    );

    expect(() =>
      expectReferenceCopyAnnouncementChrome(container, "references-events"),
    ).not.toThrow();

    await expectReferenceCopyAnnouncements(container, "references-events");

    const status = container.querySelector(
      "[data-reference-anchor-copy-status]",
    );
    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.className).toContain("sr-only");
    expect((status?.textContent ?? "").trim().length).toBeGreaterThan(0);
  });

  test("FactorySchemaReference deep-link copy announces via polite live region", async () => {
    installClipboardMock();
    const { container } = render(<FactorySchemaReference />);

    expect(() =>
      expectReferenceCopyAnnouncementChrome(
        container,
        "references-factory-schema",
      ),
    ).not.toThrow();

    await expectReferenceCopyAnnouncements(
      container,
      "references-factory-schema",
    );

    await waitFor(() => {
      const status = container.querySelector(
        "[data-schema-deep-link-copy-status]",
      );
      expect(status?.getAttribute("aria-live")).toBe("polite");
      expect((status?.textContent ?? "").trim().length).toBeGreaterThan(0);
    });
  });

  test("schema example code-copy announces via polite live region when present", async () => {
    installClipboardMock();
    const { container } = render(
      <SchemaExamplePanel
        examples={[
          {
            id: "sample",
            label: "Sample",
            language: "json",
            code: '{"worker":"hosted"}',
            origin: "authored",
          },
        ]}
      />,
    );

    const spec = REFERENCE_COPY_ANNOUNCEMENTS.find(
      (entry) => entry.id === "schema-code-copy",
    );
    expect(spec).toBeDefined();
    if (!spec) {
      return;
    }
    const codeCopy = await probeReferenceCopyAnnouncement(container, spec);
    expect(codeCopy.controlFound).toBe(true);
    expect(codeCopy.announcedAfterCopy).toBe(true);
    expect(codeCopy.statusAriaLive).toBe("polite");
  });
});
