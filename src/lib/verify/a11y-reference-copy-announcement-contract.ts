/**
 * W19 code-copy and deep-link copy status announcement contract for
 * representative Factory reference surfaces. Proves accessible live-region
 * announcements after clipboard actions without inventing a parallel a11y
 * framework.
 *
 * Keep selectors mirrored from the components layer (do not import
 * `@/components` into verify/).
 */

import {
  REFERENCE_SURFACE_ROUTES,
  type ReferenceSurfaceRouteId,
} from "./a11y-reference-surface-contract";

export type ReferenceCopyAnnouncementKind = "code-copy" | "deep-link-copy";

export type ReferenceCopyAnnouncementSpec = {
  id: string;
  kind: ReferenceCopyAnnouncementKind;
  /** Interactive copy control selector. */
  controlSelector: string;
  /**
   * Live-region status marker associated with the control. Prefer a stable
   * data attribute colocated with the control host.
   */
  statusSelector: string;
  label: string;
  /**
   * When true, every matching representative route must expose at least one
   * control + status pair. When false, present hits are still probed.
   */
  required: boolean;
  routeIds: readonly ReferenceSurfaceRouteId[];
};

/**
 * Primary copy + announcement chrome for W19. Status selectors match production
 * markers added for probeability (API code-copy already had one).
 */
export const REFERENCE_COPY_ANNOUNCEMENTS: readonly ReferenceCopyAnnouncementSpec[] =
  [
    {
      id: "api-deep-link-copy",
      kind: "deep-link-copy",
      controlSelector: "[data-api-operation-copy-link]",
      statusSelector: "[data-api-operation-copy-status]",
      label: "API operation deep-link copy announcement",
      required: true,
      routeIds: ["references-api"],
    },
    {
      id: "api-code-copy",
      kind: "code-copy",
      controlSelector: '[data-api-example="copy"]',
      statusSelector: "[data-api-code-copy-status]",
      label: "API example code-copy announcement",
      // Authored examples are sparse on some operations; fixture + served
      // probes cover presence when the control mounts.
      required: false,
      routeIds: ["references-api"],
    },
    {
      id: "events-deep-link-copy",
      kind: "deep-link-copy",
      controlSelector: "[data-reference-anchor-copy]",
      statusSelector: "[data-reference-anchor-copy-status]",
      label: "Events / shared deep-link copy announcement",
      required: true,
      routeIds: ["references-events"],
    },
    {
      id: "schema-deep-link-copy",
      kind: "deep-link-copy",
      controlSelector: '[data-schema-breadcrumb="copy"]',
      statusSelector: "[data-schema-deep-link-copy-status]",
      label: "Schema deep-link copy announcement",
      required: true,
      routeIds: ["references-factory-schema"],
    },
    {
      id: "schema-code-copy",
      kind: "code-copy",
      controlSelector: '[data-schema-example="copy"]',
      statusSelector: "[data-schema-example-copy-status]",
      label: "Schema example code-copy announcement",
      required: false,
      routeIds: ["references-factory-schema"],
    },
    {
      id: "docs-code-copy",
      kind: "code-copy",
      controlSelector: '[data-docs-code-copy="control"]',
      statusSelector: "[data-docs-code-copy-status]",
      label: "Docs code-block copy announcement",
      required: false,
      routeIds: [
        "references-api",
        "references-events",
        "references-factory-schema",
        "authored-factory",
        "authored-worker",
        "authored-workstation",
      ],
    },
  ] as const;

export type ReferenceCopyAnnouncementProbe = {
  id: string;
  kind: ReferenceCopyAnnouncementKind;
  label: string;
  required: boolean;
  controlFound: boolean;
  statusFound: boolean;
  statusAriaLive: string | null;
  statusIsSrOnly: boolean;
  announcementBefore: string;
  announcementAfter: string;
  announcedAfterCopy: boolean;
  announcementPersistsWithoutHover: boolean;
  controlChecked: boolean;
};

export function listReferenceCopyAnnouncementsForRoute(
  routeId: ReferenceSurfaceRouteId,
): ReferenceCopyAnnouncementSpec[] {
  return REFERENCE_COPY_ANNOUNCEMENTS.filter((spec) =>
    spec.routeIds.includes(routeId),
  );
}

export function listRequiredReferenceCopyAnnouncements(
  routeId: ReferenceSurfaceRouteId,
): ReferenceCopyAnnouncementSpec[] {
  return listReferenceCopyAnnouncementsForRoute(routeId).filter(
    (spec) => spec.required,
  );
}

function nearestStatusForControl(
  control: Element,
  statusSelector: string,
): Element | null {
  const host =
    control.closest(
      "[data-testid], [data-reference-copyable-anchor], [data-schema-anchor], [data-api-operation-examples], [data-schema-examples], figure, nav",
    ) ?? control.parentElement;
  if (host) {
    const local = host.querySelector(statusSelector);
    if (local) {
      return local;
    }
  }
  const sibling = control.nextElementSibling;
  if (
    sibling?.matches(statusSelector) ||
    sibling?.querySelector?.(statusSelector)
  ) {
    return sibling.matches(statusSelector)
      ? sibling
      : sibling.querySelector(statusSelector);
  }
  return control.ownerDocument?.querySelector(statusSelector) ?? null;
}

function readAnnouncementText(status: Element | null): string {
  if (!status) {
    return "";
  }
  return (status.textContent ?? "").replace(/\s+/g, " ").trim();
}

function isSrOnlyStatus(status: Element): boolean {
  if (!(status instanceof HTMLElement)) {
    return false;
  }
  const className = status.className ?? "";
  return (
    className.includes("sr-only") ||
    className.includes("visually-hidden") ||
    status.getAttribute("aria-hidden") === "true"
  );
}

export type ReferenceCopyAnnouncementChromeProbe = {
  id: string;
  kind: ReferenceCopyAnnouncementKind;
  label: string;
  required: boolean;
  controlFound: boolean;
  statusFound: boolean;
  statusAriaLive: string | null;
  statusIsSrOnly: boolean;
  idleAnnouncementEmpty: boolean;
};

/**
 * Idle chrome probe: control + polite live region exist before activation.
 * Does not click (safe for structure-only fixtures).
 */
export function probeReferenceCopyAnnouncementChrome(
  root: ParentNode,
  spec: ReferenceCopyAnnouncementSpec,
): ReferenceCopyAnnouncementChromeProbe {
  const control = root.querySelector(spec.controlSelector);
  if (!(control instanceof HTMLElement)) {
    return {
      id: spec.id,
      kind: spec.kind,
      label: spec.label,
      required: spec.required,
      controlFound: false,
      statusFound: false,
      statusAriaLive: null,
      statusIsSrOnly: false,
      idleAnnouncementEmpty: true,
    };
  }

  let status = nearestStatusForControl(control, spec.statusSelector);
  if (!(status instanceof Element)) {
    status = root.querySelector(spec.statusSelector);
  }

  return {
    id: spec.id,
    kind: spec.kind,
    label: spec.label,
    required: spec.required,
    controlFound: true,
    statusFound: status instanceof Element,
    statusAriaLive:
      status instanceof Element ? status.getAttribute("aria-live") : null,
    statusIsSrOnly: status instanceof Element && isSrOnlyStatus(status),
    idleAnnouncementEmpty: readAnnouncementText(status).length === 0,
  };
}

async function waitForNonEmptyAnnouncement(
  read: () => string,
  timeoutMs: number,
): Promise<string> {
  const started = Date.now();
  let latest = read();
  while (latest.length === 0 && Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    latest = read();
  }
  return latest;
}

/**
 * Probe one copy control: confirm a polite live region exists, activate the
 * control, and assert a non-empty announcement remains without hover.
 */
export async function probeReferenceCopyAnnouncement(
  root: ParentNode,
  spec: ReferenceCopyAnnouncementSpec,
  options?: {
    /** When provided, used instead of dispatching a click (for SSR fixtures). */
    activate?: (control: HTMLElement) => void | Promise<void>;
    /** Max wait for React/useCopyButton to populate the live region. */
    timeoutMs?: number;
  },
): Promise<ReferenceCopyAnnouncementProbe> {
  const control = root.querySelector(spec.controlSelector);
  if (!(control instanceof HTMLElement)) {
    return {
      id: spec.id,
      kind: spec.kind,
      label: spec.label,
      required: spec.required,
      controlFound: false,
      statusFound: false,
      statusAriaLive: null,
      statusIsSrOnly: false,
      announcementBefore: "",
      announcementAfter: "",
      announcedAfterCopy: false,
      announcementPersistsWithoutHover: false,
      controlChecked: false,
    };
  }

  let status = nearestStatusForControl(control, spec.statusSelector);
  if (!(status instanceof Element)) {
    status = root.querySelector(spec.statusSelector);
  }

  const announcementBefore = readAnnouncementText(status);
  const statusIsSrOnly = status instanceof Element && isSrOnlyStatus(status);

  if (!(status instanceof Element)) {
    return {
      id: spec.id,
      kind: spec.kind,
      label: spec.label,
      required: spec.required,
      controlFound: true,
      statusFound: false,
      statusAriaLive: null,
      statusIsSrOnly: false,
      announcementBefore,
      announcementAfter: "",
      announcedAfterCopy: false,
      announcementPersistsWithoutHover: false,
      controlChecked: false,
    };
  }

  if (options?.activate) {
    await options.activate(control);
  } else {
    control.click();
  }

  const timeoutMs = options?.timeoutMs ?? 1000;
  const announcementAfter = await waitForNonEmptyAnnouncement(() => {
    status =
      nearestStatusForControl(control, spec.statusSelector) ??
      root.querySelector(spec.statusSelector);
    return readAnnouncementText(status);
  }, timeoutMs);

  const statusAriaLive =
    status instanceof Element ? status.getAttribute("aria-live") : null;
  const controlChecked =
    control.hasAttribute("data-checked") ||
    control.getAttribute("aria-label")?.toLowerCase().includes("copied") ===
      true;

  // Announcement must remain readable without hover — live region text is in
  // the DOM (sr-only), not a title/tooltip that requires pointer.
  const announcementPersistsWithoutHover =
    announcementAfter.length > 0 &&
    status instanceof Element &&
    statusAriaLive === "polite";

  return {
    id: spec.id,
    kind: spec.kind,
    label: spec.label,
    required: spec.required,
    controlFound: true,
    statusFound: status instanceof Element,
    statusAriaLive,
    statusIsSrOnly,
    announcementBefore,
    announcementAfter,
    announcedAfterCopy: announcementAfter.length > 0,
    announcementPersistsWithoutHover,
    controlChecked,
  };
}

export async function probeReferenceCopyAnnouncementsForRoute(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
  options?: Parameters<typeof probeReferenceCopyAnnouncement>[2],
): Promise<ReferenceCopyAnnouncementProbe[]> {
  const specs = listReferenceCopyAnnouncementsForRoute(routeId);
  const probes: ReferenceCopyAnnouncementProbe[] = [];
  for (const spec of specs) {
    probes.push(await probeReferenceCopyAnnouncement(root, spec, options));
  }
  return probes;
}

/**
 * Assert required (and present optional) copy controls announce via a polite
 * live region after activation.
 */
export async function expectReferenceCopyAnnouncements(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
  options?: Parameters<typeof probeReferenceCopyAnnouncement>[2],
): Promise<ReferenceCopyAnnouncementProbe[]> {
  const route = REFERENCE_SURFACE_ROUTES.find((entry) => entry.id === routeId);
  const routeLabel = route?.path ?? routeId;
  const probes = await probeReferenceCopyAnnouncementsForRoute(
    root,
    routeId,
    options,
  );

  for (const probe of probes) {
    const spec = REFERENCE_COPY_ANNOUNCEMENTS.find(
      (entry) => entry.id === probe.id,
    );
    if (!spec) {
      continue;
    }

    if (!probe.controlFound) {
      if (spec.required) {
        throw new Error(
          `${routeLabel}: required copy control "${spec.label}" (${spec.controlSelector}) was not found`,
        );
      }
      continue;
    }

    if (!probe.statusFound) {
      throw new Error(
        `${routeLabel}: copy control "${spec.label}" is missing live-region status (${spec.statusSelector})`,
      );
    }
    if (probe.statusAriaLive !== "polite") {
      throw new Error(
        `${routeLabel}: copy status for "${spec.label}" must use aria-live="polite" (got ${String(probe.statusAriaLive)})`,
      );
    }
    if (!probe.announcedAfterCopy) {
      throw new Error(
        `${routeLabel}: copy control "${spec.label}" did not announce status after the clipboard action`,
      );
    }
    if (!probe.announcementPersistsWithoutHover) {
      throw new Error(
        `${routeLabel}: copy announcement for "${spec.label}" does not persist without hover / pointer-only UI`,
      );
    }
  }

  return probes;
}

/**
 * Assert idle chrome: required controls expose polite live regions before copy.
 */
export function expectReferenceCopyAnnouncementChrome(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
): ReferenceCopyAnnouncementChromeProbe[] {
  const route = REFERENCE_SURFACE_ROUTES.find((entry) => entry.id === routeId);
  const routeLabel = route?.path ?? routeId;
  const probes = listReferenceCopyAnnouncementsForRoute(routeId).map((spec) =>
    probeReferenceCopyAnnouncementChrome(root, spec),
  );

  for (const probe of probes) {
    const spec = REFERENCE_COPY_ANNOUNCEMENTS.find(
      (entry) => entry.id === probe.id,
    );
    if (!spec) {
      continue;
    }
    if (!probe.controlFound) {
      if (spec.required) {
        throw new Error(
          `${routeLabel}: required copy control "${spec.label}" (${spec.controlSelector}) was not found`,
        );
      }
      continue;
    }
    if (!probe.statusFound) {
      throw new Error(
        `${routeLabel}: copy control "${spec.label}" is missing live-region status (${spec.statusSelector})`,
      );
    }
    if (probe.statusAriaLive !== "polite") {
      throw new Error(
        `${routeLabel}: copy status for "${spec.label}" must use aria-live="polite"`,
      );
    }
  }

  return probes;
}

/**
 * Playwright-safe evaluate helper: probe copy announcements using plain args
 * (no Node-module closures — Playwright serializes the function into the
 * browser). Activates the first matching control via click and waits briefly
 * for the live region to populate.
 */
export async function evaluateReferenceCopyAnnouncementsInBrowser(args: {
  controls: ReadonlyArray<{
    id: string;
    kind: ReferenceCopyAnnouncementKind;
    controlSelector: string;
    statusSelector: string;
    label: string;
    required: boolean;
  }>;
}): Promise<{
  ok: boolean;
  error: string | null;
  probes: Array<{
    id: string;
    label: string;
    required: boolean;
    controlFound: boolean;
    statusFound: boolean;
    statusAriaLive: string | null;
    announcementAfter: string;
    announcedAfterCopy: boolean;
    announcementPersistsWithoutHover: boolean;
  }>;
}> {
  function nearestStatus(
    control: Element,
    statusSelector: string,
  ): Element | null {
    const host =
      control.closest(
        "[data-testid], [data-reference-copyable-anchor], [data-schema-anchor], [data-api-operation-examples], [data-schema-examples], figure, nav",
      ) ?? control.parentElement;
    if (host) {
      const local = host.querySelector(statusSelector);
      if (local) {
        return local;
      }
    }
    const sibling = control.nextElementSibling;
    if (sibling?.matches(statusSelector)) {
      return sibling;
    }
    return document.querySelector(statusSelector);
  }

  function textOf(status: Element | null): string {
    if (!status) {
      return "";
    }
    return (status.textContent ?? "").replace(/\s+/g, " ").trim();
  }

  async function waitForText(
    read: () => string,
    timeoutMs: number,
  ): Promise<string> {
    const started = Date.now();
    let latest = read();
    while (latest.length === 0 && Date.now() - started < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      latest = read();
    }
    return latest;
  }

  const probes: Array<{
    id: string;
    label: string;
    required: boolean;
    controlFound: boolean;
    statusFound: boolean;
    statusAriaLive: string | null;
    announcementAfter: string;
    announcedAfterCopy: boolean;
    announcementPersistsWithoutHover: boolean;
  }> = [];

  for (const spec of args.controls) {
    const control = document.querySelector(spec.controlSelector);
    if (!(control instanceof HTMLElement)) {
      probes.push({
        id: spec.id,
        label: spec.label,
        required: spec.required,
        controlFound: false,
        statusFound: false,
        statusAriaLive: null,
        announcementAfter: "",
        announcedAfterCopy: false,
        announcementPersistsWithoutHover: false,
      });
      continue;
    }

    let status = nearestStatus(control, spec.statusSelector);
    control.click();
    const announcementAfter = await waitForText(() => {
      status = nearestStatus(control, spec.statusSelector);
      return textOf(status);
    }, 1500);

    const statusAriaLive =
      status instanceof Element ? status.getAttribute("aria-live") : null;
    const announcedAfterCopy = announcementAfter.length > 0;
    const announcementPersistsWithoutHover =
      announcedAfterCopy && statusAriaLive === "polite";

    probes.push({
      id: spec.id,
      label: spec.label,
      required: spec.required,
      controlFound: true,
      statusFound: status instanceof Element,
      statusAriaLive,
      announcementAfter,
      announcedAfterCopy,
      announcementPersistsWithoutHover,
    });
  }

  for (const probe of probes) {
    if (!probe.controlFound) {
      if (probe.required) {
        return {
          ok: false,
          error: `required copy control "${probe.label}" (${probe.id}) was not found`,
          probes,
        };
      }
      continue;
    }
    if (!probe.statusFound) {
      return {
        ok: false,
        error: `copy control "${probe.label}" (${probe.id}) is missing a live-region status`,
        probes,
      };
    }
    if (probe.statusAriaLive !== "polite") {
      return {
        ok: false,
        error: `copy status for "${probe.label}" (${probe.id}) must use aria-live="polite"`,
        probes,
      };
    }
    if (!probe.announcedAfterCopy || !probe.announcementPersistsWithoutHover) {
      return {
        ok: false,
        error: `copy control "${probe.label}" (${probe.id}) did not announce status after the clipboard action`,
        probes,
      };
    }
  }

  return { ok: true, error: null, probes };
}

/** Plain control args for {@link evaluateReferenceCopyAnnouncementsInBrowser}. */
export function referenceCopyAnnouncementEvaluateArgs(
  routeId: ReferenceSurfaceRouteId,
): {
  controls: Array<{
    id: string;
    kind: ReferenceCopyAnnouncementKind;
    controlSelector: string;
    statusSelector: string;
    label: string;
    required: boolean;
  }>;
} {
  return {
    controls: listReferenceCopyAnnouncementsForRoute(routeId).map((spec) => ({
      id: spec.id,
      kind: spec.kind,
      controlSelector: spec.controlSelector,
      statusSelector: spec.statusSelector,
      label: spec.label,
      required: spec.required,
    })),
  };
}
