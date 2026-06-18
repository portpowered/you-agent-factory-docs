import { joinClassNames } from "@/lib/classnames";
import type { ComponentPropsWithoutRef } from "react";

type CardProps = ComponentPropsWithoutRef<"section"> & {
  as?: "article" | "div" | "li" | "nav" | "section";
};

export function Card({
  as: Component = "section",
  className,
  ...props
}: CardProps) {
  return (
    <Component
      className={joinClassNames(
        "ui-card w-full rounded-xl border bg-card shadow-sm",
        className,
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
