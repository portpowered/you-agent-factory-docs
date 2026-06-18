import { joinClassNames } from "@/lib/classnames";
import type { ComponentPropsWithoutRef } from "react";

export function Table({
  className,
  ...props
}: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="ui-table relative w-full overflow-x-auto rounded-xl border">
      <table
        className={joinClassNames("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead
      className={joinClassNames(
        "border-b bg-muted/40 [&_tr]:border-0",
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: ComponentPropsWithoutRef<"tbody">) {
  return (
    <tbody
      className={joinClassNames("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

export function TableRow({
  className,
  ...props
}: ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={joinClassNames(
        "border-b transition-colors hover:bg-muted/30",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className={joinClassNames(
        "h-11 px-4 text-left align-middle font-semibold text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: ComponentPropsWithoutRef<"td">) {
  return (
    <td
      className={joinClassNames(
        "px-4 py-3 align-middle text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({
  className,
  ...props
}: ComponentPropsWithoutRef<"caption">) {
  return (
    <caption
      className={joinClassNames(
        "px-4 py-3 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
