import { joinClassNames } from "@/lib/classnames";
import type { LabelHTMLAttributes } from "react";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    /* biome-ignore lint/a11y/noLabelWithoutControl: this reusable label is paired with a control at call sites. */
    <label
      className={joinClassNames(
        "ui-label text-sm font-semibold text-foreground",
        className,
      )}
      {...props}
    />
  );
}
