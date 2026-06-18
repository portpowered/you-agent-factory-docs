"use client";

import { useReducedMotion } from "@/hooks/media/useReducedMotion";
import { joinClassNames } from "@/lib/classnames";
import { Children, type ComponentPropsWithoutRef, type ReactNode } from "react";

type MarqueeProps = ComponentPropsWithoutRef<"div"> & {
  itemClassName?: string;
  pauseOnHover?: boolean;
  reverse?: boolean;
};

function renderMarqueeItems(
  children: ReactNode[],
  itemClassName?: string,
): ReactNode[] {
  return children.map((child) => {
    const childKey =
      typeof child === "object" && child !== null && "key" in child
        ? child.key
        : null;

    return (
      <div
        className={joinClassNames("ui-marquee__item shrink-0", itemClassName)}
        key={String(childKey ?? child)}
      >
        {child}
      </div>
    );
  });
}

export function Marquee({
  children,
  className,
  itemClassName,
  pauseOnHover = false,
  reverse = false,
  ...props
}: MarqueeProps) {
  const prefersReducedMotion = useReducedMotion();
  const items = Children.toArray(children);

  return (
    <div
      className={joinClassNames("ui-marquee", className)}
      data-reduced-motion={prefersReducedMotion ? "" : undefined}
      {...props}
    >
      <div className="ui-marquee__viewport">
        <div
          className={joinClassNames(
            "ui-marquee__content",
            prefersReducedMotion && "ui-marquee__content--static",
            pauseOnHover && "ui-marquee__content--pause-on-hover",
            reverse && "ui-marquee__content--reverse",
          )}
        >
          <div className="ui-marquee__track">
            {renderMarqueeItems(items, itemClassName)}
          </div>
          {prefersReducedMotion ? null : (
            <div aria-hidden="true" className="ui-marquee__track">
              {renderMarqueeItems(items, itemClassName)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
