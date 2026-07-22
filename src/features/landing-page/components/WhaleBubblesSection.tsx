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
  /** Render the local whale plate; disable when a shared scene owns the whale. */
  renderPlate?: boolean;
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
  renderPlate = true,
}: WhaleBubblesSectionProps) {
  const [armed, setArmed] = useState(false);
  const resolved = resolveWhalePlateTheme(theme);
  const bubblesArmed = renderPlate ? armed : true;

  return (
    <section
      className={cn(
        "relative min-h-[clamp(64rem,125vw,110rem)] w-full overflow-hidden",
        className,
      )}
      data-whale-bubbles-section=""
      data-whale-bubbles-armed={bubblesArmed ? "true" : "false"}
      data-whale-bubbles-delay-ms={String(resolved.bubbleDelayMs)}
      data-whale-bubbles-item-count={String(items.length)}
    >
      {renderPlate ? (
        <div
          className="absolute inset-x-0 top-0 z-0 mx-auto w-full max-w-[100rem] mix-blend-multiply [&_img]:max-h-[110rem] [&_img]:object-contain [&_img]:object-top"
          data-whale-bubbles-plate-slot=""
        >
          <WhalePlate
            src={whaleSrc}
            theme={theme}
            onSettle={() => {
              setArmed(true);
              onSettle?.();
            }}
          />
        </div>
      ) : null}
      <p
        className="pointer-events-none absolute top-[5%] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap font-sans text-[clamp(1.55rem,3.1vw,3.4rem)] leading-none font-medium tracking-[-0.045em] text-[#191f2b]"
        data-whale-bubbles-kicker=""
      >
        Many feature, such wow
      </p>
      <div
        className="pointer-events-none absolute inset-0 z-10 mx-auto w-full max-w-[100rem]"
        data-whale-bubbles-cluster-slot=""
      >
        <FeatureBubbles
          armed={bubblesArmed}
          className="h-full min-h-0"
          delayMs={resolved.bubbleDelayMs}
          items={[...items]}
        />
      </div>
    </section>
  );
}
