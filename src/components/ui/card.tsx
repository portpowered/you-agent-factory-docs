import { getSurfaceClassName } from "@/components/ui/factory-theme";
import { joinClassNames } from "@/lib/classnames";
import type { ComponentPropsWithoutRef } from "react";

type CardTone = "default" | "hero" | "muted";
type CardPadding = "compact" | "comfortable" | "spacious";

type CardProps = ComponentPropsWithoutRef<"section"> & {
  as?: "article" | "div" | "li" | "nav" | "section";
  padding?: CardPadding;
  tone?: CardTone;
};

export function Card({
  as: Component = "section",
  className,
  padding = "comfortable",
  tone = "default",
  ...props
}: CardProps) {
  return (
    <Component
      className={joinClassNames(
        "ui-card",
        getSurfaceClassName({
          className,
          padding,
          tone,
        }),
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className={joinClassNames(
        "m-0 leading-tight tracking-tight text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={joinClassNames("m-0 text-muted-foreground", className)}
      {...props}
    />
  );
}
