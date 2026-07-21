import type { CSSProperties } from "react";
import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";
import { cn } from "@/lib/utils";

/** Which edge of a section this treatment anchors to. */
export type TornEdgePlacement = "top" | "bottom";

export type TornEdgeProps = {
  /**
   * Edge placement for section boundaries.
   * `top` flips the raster so the torn face points upward into the section above.
   */
  placement?: TornEdgePlacement;
  /**
   * Optional edge / mask image URL.
   * Defaults to staged `landingHomeAssets.downTransition` (`/home/down-transition.png`).
   * Pass a harness-safe fixture src when the staged asset is absent.
   * Empty string keeps a stable empty host (no crash).
   */
  src?: string;
  /** Root className for positioning (top vs bottom / flip / stretch). */
  className?: string;
  /** Optional inline styles for stretch / absolute anchoring. */
  style?: CSSProperties;
};

export const TORN_EDGE_DEFAULT_SRC = landingHomeAssets.downTransition;

/**
 * Reusable section-edge mask / transition strip.
 *
 * Presentational by default (`aria-hidden`). Renders the staged home
 * `down-transition` raster as a full-width edge treatment consumers can
 * place at the top or bottom of a section via `placement` + `className`.
 */
export function TornEdge({
  placement = "bottom",
  src = TORN_EDGE_DEFAULT_SRC,
  className,
  style,
}: TornEdgeProps) {
  const hasSrc = typeof src === "string" && src.length > 0;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none block w-full overflow-hidden leading-none select-none",
        placement === "top" && "[transform:scaleY(-1)]",
        className,
      )}
      data-torn-edge=""
      data-torn-edge-placement={placement}
      style={style}
    >
      {hasSrc ? (
        <img
          alt=""
          className="block h-auto w-full max-w-full"
          data-torn-edge-image=""
          decoding="async"
          draggable={false}
          src={src}
        />
      ) : null}
    </div>
  );
}
