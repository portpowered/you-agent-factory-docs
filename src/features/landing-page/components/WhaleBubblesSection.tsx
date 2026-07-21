"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  WHALE_BUBBLES_FIXTURE_ITEMS,
  WHALE_BUBBLES_FIXTURE_SRC,
} from "../whale-bubbles.fixtures";
import { type FeatureBubbleItem, FeatureBubbles } from "./FeatureBubbles";
import { WhalePlate } from "./WhalePlate";
import {
  resolveWhalePlateTheme,
  type WhalePlateThemeKnobs,
} from "./whale-plate.theme";

export type WhaleBubblesSectionProps = {
  className?: string;
  /** Whale plate image URL; defaults to staged mid→end asset path. */
  whaleSrc?: string;
  /** Bubble cluster items; defaults to local fixture constants. */
  items?: readonly FeatureBubbleItem[];
  /**
   * Optional whale theme knob overrides (harness / tests).
   * `bubbleDelayMs` also drives FeatureBubbles enter delay.
   */
  theme?: Partial<WhalePlateThemeKnobs>;
  /** Fired once after whale settle (bubbles arm at the same moment). */
  onSettle?: () => void;
};

/**
 * Mid→end plate composition: whale behind, bubbles above.
 * Owns settle → delayed bubble enter orchestration for skeleton slots.
 */
export function WhaleBubblesSection({
  className,
  whaleSrc = WHALE_BUBBLES_FIXTURE_SRC,
  items = WHALE_BUBBLES_FIXTURE_ITEMS,
  theme,
  onSettle,
}: WhaleBubblesSectionProps) {
  const [armed, setArmed] = useState(false);
  const resolved = resolveWhalePlateTheme(theme);

  return (
    <section
      className={cn("relative w-full overflow-hidden", className)}
      data-whale-bubbles-section=""
      data-whale-bubbles-armed={armed ? "true" : "false"}
      data-whale-bubbles-delay-ms={String(resolved.bubbleDelayMs)}
      data-whale-bubbles-item-count={String(items.length)}
    >
      {/* Whale sits behind the cluster (z-0); bubbles overlay above (z-10). */}
      <div className="relative z-0 w-full" data-whale-bubbles-plate-slot="">
        <WhalePlate
          src={whaleSrc}
          theme={theme}
          onSettle={() => {
            setArmed(true);
            onSettle?.();
          }}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-10"
        data-whale-bubbles-cluster-slot=""
      >
        <FeatureBubbles
          armed={armed}
          className="h-full min-h-0"
          delayMs={resolved.bubbleDelayMs}
          items={[...items]}
        />
      </div>
    </section>
  );
}
