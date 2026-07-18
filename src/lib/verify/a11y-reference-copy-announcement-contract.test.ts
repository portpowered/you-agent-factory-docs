import { describe, expect, mock, test } from "bun:test";
import {
  evaluateReferenceCopyAnnouncementsInBrowser,
  expectReferenceCopyAnnouncementChrome,
  expectReferenceCopyAnnouncements,
  listRequiredReferenceCopyAnnouncements,
  probeReferenceCopyAnnouncementChrome,
  REFERENCE_COPY_ANNOUNCEMENTS,
  referenceCopyAnnouncementEvaluateArgs,
} from "./a11y-reference-copy-announcement-contract";
import { REFERENCE_SURFACE_ROUTE_IDS } from "./a11y-reference-surface-contract";

describe("a11y-reference-copy-announcement-contract", () => {
  test("enumerates deep-link and code-copy announcement specs for primary routes", () => {
    expect(REFERENCE_COPY_ANNOUNCEMENTS.map((entry) => entry.id)).toEqual([
      "api-deep-link-copy",
      "api-code-copy",
      "events-deep-link-copy",
      "schema-deep-link-copy",
      "schema-code-copy",
      "docs-code-copy",
    ]);

    expect(
      listRequiredReferenceCopyAnnouncements("references-api").map((s) => s.id),
    ).toEqual(["api-deep-link-copy"]);
    expect(
      listRequiredReferenceCopyAnnouncements("references-events").map(
        (s) => s.id,
      ),
    ).toEqual(["events-deep-link-copy"]);
    expect(
      listRequiredReferenceCopyAnnouncements("references-factory-schema").map(
        (s) => s.id,
      ),
    ).toEqual(["schema-deep-link-copy"]);

    for (const routeId of REFERENCE_SURFACE_ROUTE_IDS.filter((id) =>
      id.startsWith("authored-"),
    )) {
      expect(listRequiredReferenceCopyAnnouncements(routeId)).toEqual([]);
    }
  });

  test("idle chrome probe requires polite live-region status markers", () => {
    document.body.innerHTML = `
      <button type="button" data-api-operation-copy-link="">Copy</button>
      <span aria-live="polite" class="sr-only" data-api-operation-copy-status=""></span>
    `;
    const spec = REFERENCE_COPY_ANNOUNCEMENTS.find(
      (entry) => entry.id === "api-deep-link-copy",
    );
    expect(spec).toBeDefined();
    if (!spec) {
      return;
    }

    const probe = probeReferenceCopyAnnouncementChrome(document, spec);
    expect(probe.controlFound).toBe(true);
    expect(probe.statusFound).toBe(true);
    expect(probe.statusAriaLive).toBe("polite");
    expect(probe.statusIsSrOnly).toBe(true);
    expect(probe.idleAnnouncementEmpty).toBe(true);

    expect(() =>
      expectReferenceCopyAnnouncementChrome(document, "references-api"),
    ).not.toThrow();
  });

  test("expectReferenceCopyAnnouncements fails when status region is missing", async () => {
    document.body.innerHTML = `
      <button type="button" data-api-operation-copy-link="">Copy</button>
    `;
    await expect(
      expectReferenceCopyAnnouncements(document, "references-api"),
    ).rejects.toThrow(/missing live-region status/);
  });

  test("expectReferenceCopyAnnouncements accepts announcement after activation", async () => {
    document.body.innerHTML = `
      <div data-testid="copy-host">
        <button type="button" data-api-operation-copy-link="">Copy operation link</button>
        <span aria-live="polite" class="sr-only" data-api-operation-copy-status=""></span>
      </div>
    `;

    const probes = await expectReferenceCopyAnnouncements(
      document,
      "references-api",
      {
        activate: (control) => {
          control.setAttribute("data-checked", "");
          control.setAttribute("aria-label", "Copied operation link");
          const status = document.querySelector(
            "[data-api-operation-copy-status]",
          );
          if (status) {
            status.textContent = "Copied operation link";
          }
        },
      },
    );

    const deepLink = probes.find((probe) => probe.id === "api-deep-link-copy");
    expect(deepLink?.announcedAfterCopy).toBe(true);
    expect(deepLink?.announcementAfter).toBe("Copied operation link");
    expect(deepLink?.announcementPersistsWithoutHover).toBe(true);
  });

  test("browser evaluate helper reports failure for empty announcements", async () => {
    document.body.innerHTML = `
      <button type="button" data-reference-anchor-copy="">Copy</button>
      <span aria-live="polite" class="sr-only" data-reference-anchor-copy-status=""></span>
    `;

    const result = await evaluateReferenceCopyAnnouncementsInBrowser(
      referenceCopyAnnouncementEvaluateArgs("references-events"),
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/did not announce status/);
  });

  test("browser evaluate helper accepts populated live regions", async () => {
    document.body.innerHTML = `
      <button type="button" data-reference-anchor-copy="">Copy</button>
      <span aria-live="polite" class="sr-only" data-reference-anchor-copy-status=""></span>
    `;

    const writeText = mock(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      writable: true,
      value: { writeText },
    });

    // Simulate production React copy: click handler fills the live region.
    const control = document.querySelector(
      "[data-reference-anchor-copy]",
    ) as HTMLButtonElement;
    control.addEventListener("click", () => {
      const status = document.querySelector(
        "[data-reference-anchor-copy-status]",
      );
      if (status) {
        status.textContent = "Anchor link copied";
      }
    });

    const result = await evaluateReferenceCopyAnnouncementsInBrowser(
      referenceCopyAnnouncementEvaluateArgs("references-events"),
    );
    expect(result.ok).toBe(true);
    expect(result.error).toBeNull();
    expect(writeText).not.toHaveBeenCalled();
  });
});
