/**
 * Batch 5 packaged-factory reference family closeout — story 005 proofs.
 *
 * Tip-owned evidence that interactive replay surfaces stay keyboard/touch
 * operable, graph hosts stay page-contained on a11y suite widths, and
 * representative family routes render without React hydration mismatches.
 *
 * Composes shared factory-replay mounts, a11y keyboard/overflow probes, and
 * browser console classifiers. Does not redesign replay chrome or CSS.
 */

import { listKeyboardFocusableControls } from "./a11y-page-structure";
import {
  CRITICAL_VIEWPORTS,
  type CriticalViewport,
  PAGE_OVERFLOW_TOLERANCE_PX,
} from "./a11y-responsive-contract";
import {
  type DocumentLike,
  measurePageLevelOverflow,
  type PageOverflowMeasurement,
} from "./a11y-responsive-probes";

/** Shared factory-replay chrome names required on tip for Play/Pause. */
export const PACKAGED_FACTORY_CLOSEOUT_PLAY_CONTROL_NAME = "Play" as const;
export const PACKAGED_FACTORY_CLOSEOUT_PAUSE_CONTROL_NAME = "Pause" as const;
export const PACKAGED_FACTORY_CLOSEOUT_RESET_CONTROL_NAME = "Reset" as const;
export const PACKAGED_FACTORY_CLOSEOUT_REPLAY_REGION_LABEL =
  "Factory replay" as const;
export const PACKAGED_FACTORY_CLOSEOUT_TIMELINE_REGION_LABEL =
  "Timeline scrubber" as const;
export const PACKAGED_FACTORY_CLOSEOUT_TIMELINE_SLIDER_LABEL =
  "Select recorded tick" as const;
export const PACKAGED_FACTORY_CLOSEOUT_FOLLOW_LATEST_LABEL =
  "Follow latest" as const;

/**
 * Representative family routes that must stay free of hydration mismatch
 * console/page errors during closeout browser verification.
 */
export const PACKAGED_FACTORY_CLOSEOUT_A11Y_FAMILY_ROUTES = [
  {
    id: "parent-index",
    path: "/docs/references/packaged-factories-index",
    label: "Packaged factories index",
  },
  {
    id: "goal-child",
    path: "/docs/references/packaged-factories-index/goal",
    label: "Goal child",
  },
  {
    id: "deep-research-child",
    path: "/docs/references/packaged-factories-index/deep-research",
    label: "Deep-research child",
  },
  {
    id: "home-youi",
    path: "/",
    label: "Home Youi",
  },
] as const;

export type PackagedFactoryCloseoutA11yFamilyRouteId =
  (typeof PACKAGED_FACTORY_CLOSEOUT_A11Y_FAMILY_ROUTES)[number]["id"];

/**
 * Mobile + desktop widths used by the critical a11y suite for graph
 * containment proofs (phone + wide desktop).
 */
export const PACKAGED_FACTORY_CLOSEOUT_GRAPH_CONTAINMENT_VIEWPORTS: readonly CriticalViewport[] =
  CRITICAL_VIEWPORTS.filter(
    (viewport) => viewport.id === "mobile" || viewport.id === "wide",
  );

export type PackagedFactoryCloseoutKeyboardControlEvidence = {
  readonly playFocusable: true;
  readonly pauseFocusableAfterPlay: true;
  readonly resetFocusableOnFull: true;
  readonly timelineSliderFocusableOnFull: true;
  /**
   * Follow latest is host-owned on full mode; it may be disabled (and therefore
   * not keyboard-focusable) when already on the latest tick — still required
   * as a named control in the timeline region when enabled.
   */
  readonly followLatestPresentOnFull: true;
  readonly regionLabel: typeof PACKAGED_FACTORY_CLOSEOUT_REPLAY_REGION_LABEL;
};

export type PackagedFactoryCloseoutOverflowEvidence = {
  readonly viewportId: CriticalViewport["id"];
  readonly width: number;
  readonly overflowPx: number;
  readonly contained: true;
};

export type PackagedFactoryCloseoutHydrationEvidence = {
  readonly routeId: PackagedFactoryCloseoutA11yFamilyRouteId;
  readonly hydrationMismatchCount: 0;
};

export type PackagedFactoryCloseoutA11yEvidence = {
  readonly keyboard: PackagedFactoryCloseoutKeyboardControlEvidence;
  readonly graphContainmentViewports: readonly CriticalViewport["id"][];
  readonly pageOverflowTolerancePx: typeof PAGE_OVERFLOW_TOLERANCE_PX;
  readonly familyRoutes: readonly PackagedFactoryCloseoutA11yFamilyRouteId[];
};

export class PackagedFactoryCloseoutA11yError extends Error {
  readonly code:
    | "keyboard-control-missing"
    | "keyboard-activation-failed"
    | "graph-overflow"
    | "hydration-mismatch"
    | "route-contract-failed";

  constructor(
    code: PackagedFactoryCloseoutA11yError["code"],
    message: string,
    options?: { cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PackagedFactoryCloseoutA11yError";
    this.code = code;
  }
}

/**
 * True when a browser console / pageerror payload looks like a React
 * hydration mismatch (fail closed on tip).
 */
export function isPackagedFactoryCloseoutHydrationMismatchMessage(
  message: string,
): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("hydration") ||
    normalized.includes("hydrating") ||
    normalized.includes("did not match") ||
    normalized.includes("text content does not match") ||
    normalized.includes("server rendered html")
  );
}

/**
 * Fail closed unless the message is classified as a hydration mismatch.
 * Pure classifier for unit proofs; browser probe feeds live console text.
 */
export function assertPackagedFactoryCloseoutHydrationMismatchMessage(
  message: string,
): void {
  if (!isPackagedFactoryCloseoutHydrationMismatchMessage(message)) {
    throw new PackagedFactoryCloseoutA11yError(
      "hydration-mismatch",
      `Expected a hydration-mismatch message, got: ${message}`,
    );
  }
}

/**
 * Assert zero hydration-mismatch console/page errors for a family route.
 */
export function assertPackagedFactoryCloseoutNoHydrationMismatches(
  routeId: PackagedFactoryCloseoutA11yFamilyRouteId,
  messages: readonly string[],
): PackagedFactoryCloseoutHydrationEvidence {
  const mismatches = messages.filter((message) =>
    isPackagedFactoryCloseoutHydrationMismatchMessage(message),
  );
  if (mismatches.length > 0) {
    throw new PackagedFactoryCloseoutA11yError(
      "hydration-mismatch",
      `${routeId}: React hydration mismatch(es) observed: ${mismatches.slice(0, 3).join(" | ")}`,
    );
  }
  return { routeId, hydrationMismatchCount: 0 };
}

/**
 * Require Play (and optional Reset / timeline controls) among keyboard-focusable
 * controls inside a replay root. Pure DOM probe — safe in happy-dom.
 */
export function assertPackagedFactoryCloseoutKeyboardFocusableControls(
  root: ParentNode,
  options: {
    readonly mode: "full" | "compact";
    readonly playing?: boolean;
  },
): {
  readonly playOrPauseName: string;
  readonly controlNames: readonly string[];
} {
  const controls = listKeyboardFocusableControls(root);
  const names = controls.map((control) => control.name);
  const expectedToggle = options.playing
    ? PACKAGED_FACTORY_CLOSEOUT_PAUSE_CONTROL_NAME
    : PACKAGED_FACTORY_CLOSEOUT_PLAY_CONTROL_NAME;

  if (!names.includes(expectedToggle)) {
    throw new PackagedFactoryCloseoutA11yError(
      "keyboard-control-missing",
      `Expected keyboard-focusable ${expectedToggle} in ${options.mode} replay; found: ${names.join(", ") || "(none)"}`,
    );
  }

  if (options.mode === "full") {
    if (!names.includes(PACKAGED_FACTORY_CLOSEOUT_RESET_CONTROL_NAME)) {
      throw new PackagedFactoryCloseoutA11yError(
        "keyboard-control-missing",
        `Expected keyboard-focusable ${PACKAGED_FACTORY_CLOSEOUT_RESET_CONTROL_NAME} in full replay; found: ${names.join(", ") || "(none)"}`,
      );
    }
    if (!names.includes(PACKAGED_FACTORY_CLOSEOUT_TIMELINE_SLIDER_LABEL)) {
      throw new PackagedFactoryCloseoutA11yError(
        "keyboard-control-missing",
        `Expected keyboard-focusable ${PACKAGED_FACTORY_CLOSEOUT_TIMELINE_SLIDER_LABEL} in full replay; found: ${names.join(", ") || "(none)"}`,
      );
    }

    // Follow latest may be disabled when already on the latest tick (goal
    // sample is a single tick). Require the named control in the DOM; do not
    // require it among enabled focusables.
    const followLatest = root.querySelectorAll("button");
    const hasFollowLatest = Array.from(followLatest).some((button) => {
      const label = (button.textContent ?? "").replace(/\s+/g, " ").trim();
      const aria = button.getAttribute("aria-label")?.trim() ?? "";
      return (
        label === PACKAGED_FACTORY_CLOSEOUT_FOLLOW_LATEST_LABEL ||
        aria === PACKAGED_FACTORY_CLOSEOUT_FOLLOW_LATEST_LABEL
      );
    });
    if (!hasFollowLatest) {
      throw new PackagedFactoryCloseoutA11yError(
        "keyboard-control-missing",
        `Expected ${PACKAGED_FACTORY_CLOSEOUT_FOLLOW_LATEST_LABEL} button in full replay timeline chrome.`,
      );
    }
  }

  return { playOrPauseName: expectedToggle, controlNames: names };
}

/**
 * Fail closed when page-level horizontal overflow exceeds the a11y suite
 * tolerance — graph/replay hosts must stay contained.
 */
export function assertPackagedFactoryCloseoutPageContained(
  doc: DocumentLike,
  viewport: Pick<CriticalViewport, "id" | "width">,
  tolerancePx: number = PAGE_OVERFLOW_TOLERANCE_PX,
): PackagedFactoryCloseoutOverflowEvidence {
  const measurement: PageOverflowMeasurement = measurePageLevelOverflow(
    doc,
    tolerancePx,
  );
  if (measurement.hasUnintendedOverflow) {
    throw new PackagedFactoryCloseoutA11yError(
      "graph-overflow",
      `Graph/replay host caused page overflow at ${viewport.id} (${viewport.width}px): overflowPx=${measurement.overflowPx} (client=${measurement.clientWidth}, scroll=${measurement.scrollWidth})`,
    );
  }
  return {
    viewportId: viewport.id,
    width: viewport.width,
    overflowPx: measurement.overflowPx,
    contained: true,
  };
}

/**
 * Tip contract snapshot for story 005 — routes, viewports, and shared chrome
 * labels. Mount/browser proofs exercise live behavior against this contract.
 */
export function provePackagedFactoryReferenceFamilyCloseoutA11yContract(): PackagedFactoryCloseoutA11yEvidence {
  if (PACKAGED_FACTORY_CLOSEOUT_GRAPH_CONTAINMENT_VIEWPORTS.length !== 2) {
    throw new PackagedFactoryCloseoutA11yError(
      "route-contract-failed",
      "Expected mobile + wide viewports for graph containment proofs.",
    );
  }

  const familyRoutes = PACKAGED_FACTORY_CLOSEOUT_A11Y_FAMILY_ROUTES.map(
    (route) => route.id,
  );
  if (
    !familyRoutes.includes("parent-index") ||
    !familyRoutes.includes("goal-child") ||
    !familyRoutes.includes("deep-research-child") ||
    !familyRoutes.includes("home-youi")
  ) {
    throw new PackagedFactoryCloseoutA11yError(
      "route-contract-failed",
      `Family route contract incomplete: ${familyRoutes.join(", ")}`,
    );
  }

  return {
    keyboard: {
      playFocusable: true,
      pauseFocusableAfterPlay: true,
      resetFocusableOnFull: true,
      timelineSliderFocusableOnFull: true,
      followLatestPresentOnFull: true,
      regionLabel: PACKAGED_FACTORY_CLOSEOUT_REPLAY_REGION_LABEL,
    },
    graphContainmentViewports:
      PACKAGED_FACTORY_CLOSEOUT_GRAPH_CONTAINMENT_VIEWPORTS.map(
        (viewport) => viewport.id,
      ),
    pageOverflowTolerancePx: PAGE_OVERFLOW_TOLERANCE_PX,
    familyRoutes,
  };
}
