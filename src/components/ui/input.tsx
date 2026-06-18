import { joinClassNames } from "@/lib/classnames";
import type { InputHTMLAttributes } from "react";

export function getInputClassName(className?: string): string {
  return joinClassNames(
    "ui-input min-h-11 w-full rounded-lg border bg-background px-3.5 py-3 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
    className,
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input className={getInputClassName(className)} type={type} {...props} />
  );
}
