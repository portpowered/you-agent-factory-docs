import { joinClassNames } from "@/lib/classnames";
import type { ComponentPropsWithoutRef } from "react";

const ALERT_VARIANT_CLASS_NAMES = {
  default: "border bg-card text-card-foreground",
  info: "border-accent/30 bg-accent/5 text-card-foreground",
  error:
    "border-red-300 bg-red-50 text-red-950 dark:border-red-500/50 dark:bg-red-950/30 dark:text-red-100",
  success:
    "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-500/50 dark:bg-emerald-950/30 dark:text-emerald-100",
} as const;

type AlertVariant = keyof typeof ALERT_VARIANT_CLASS_NAMES;

type AlertProps = ComponentPropsWithoutRef<"section"> & {
  variant?: AlertVariant;
};

export function Alert({
  className,
  variant = "default",
  ...props
}: AlertProps) {
  return (
    <section
      className={joinClassNames(
        "ui-alert grid gap-1.5 rounded-xl border px-4 py-3 shadow-sm",
        ALERT_VARIANT_CLASS_NAMES[variant],
        className,
      )}
      role="status"
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      className={joinClassNames("m-0 text-sm font-semibold", className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={joinClassNames("m-0 text-sm/6 opacity-90", className)}
      {...props}
    />
  );
}
