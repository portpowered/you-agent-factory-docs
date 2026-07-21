import type { FeatureBubbleItem } from "./components/FeatureBubbles";
import { WHALE_PLATE_DEFAULT_SRC } from "./components/whale-plate.theme";

/**
 * Local harness/demo fixtures for whale + bubbles composition.
 * Prop-level constants only — no CMS/content schema invention.
 */

/** Default whale image path preferred by the mid→end plate. */
export const WHALE_BUBBLES_FIXTURE_SRC = WHALE_PLATE_DEFAULT_SRC;

/** Harness-safe override when the staged `/home` asset is absent. */
export const WHALE_BUBBLES_HARNESS_SRC = "/fixtures/whale-harness.svg";

/** Demo bubble cluster for section / harness mounts. */
export const WHALE_BUBBLES_FIXTURE_ITEMS: readonly FeatureBubbleItem[] = [
  { id: "flows", label: "Flows" },
  { id: "agents", label: "Agents", href: "#agents" },
  { id: "os", label: "OS" },
  { id: "loops", label: "Loops" },
  { id: "worktrees", label: "Worktrees", href: "#worktrees" },
] as const;
