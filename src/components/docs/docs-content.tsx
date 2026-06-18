import { Card } from "@/components/ui";
import { joinClassNames } from "@/lib/classnames";
import type { ComponentPropsWithoutRef } from "react";

type DocsContentSurfaceProps = ComponentPropsWithoutRef<"article"> & {
  as?: "article" | "div" | "section";
};

export function DocsContentSurface({
  as: Component = "article",
  className,
  ...props
}: DocsContentSurfaceProps) {
  return (
    <Component
      className={joinClassNames(
        "docs-content-surface mx-auto flex w-full max-w-4xl flex-col gap-6",
        className,
      )}
      {...props}
    />
  );
}

type DocsContentCardProps = ComponentPropsWithoutRef<"section"> & {
  as?: "article" | "div" | "li" | "nav" | "section";
};

export function DocsContentCard({
  as = "section",
  className,
  ...props
}: DocsContentCardProps) {
  return (
    <Card
      as={as}
      className={joinClassNames("docs-content-card p-5 sm:p-7", className)}
      {...props}
    />
  );
}
