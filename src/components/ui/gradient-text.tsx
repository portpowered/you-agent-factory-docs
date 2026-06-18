import { joinClassNames } from "@/lib/classnames";
import type { ComponentPropsWithoutRef, ElementType } from "react";

type GradientTextProps<T extends ElementType = "span"> =
  ComponentPropsWithoutRef<T> & {
    as?: T;
  };

export function GradientText<T extends ElementType = "span">({
  as,
  className,
  ...props
}: GradientTextProps<T>) {
  const Component = as ?? "span";

  return (
    <Component
      className={joinClassNames(
        "bg-linear-to-r from-accent via-sky-400 to-emerald-500 bg-clip-text text-accent supports-[background-clip:text]:text-transparent",
        className,
      )}
      {...props}
    />
  );
}
