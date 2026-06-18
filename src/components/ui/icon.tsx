import { joinClassNames } from "@/lib/classnames";
import type { SVGProps } from "react";

const ICON_PATHS = {
  checkCircle:
    "M12 2.75a9.25 9.25 0 1 0 0 18.5a9.25 9.25 0 0 0 0-18.5Zm4.12 6.78l-4.82 5.75a.75.75 0 0 1-1.11.05l-2.34-2.33a.75.75 0 1 1 1.06-1.06l1.76 1.76l4.29-5.11a.75.75 0 1 1 1.16.94Z",
  chevronDown:
    "M6.53 9.47a.75.75 0 0 1 1.06 0L12 13.88l4.41-4.41a.75.75 0 1 1 1.06 1.06l-4.94 4.94a.75.75 0 0 1-1.06 0L6.53 10.53a.75.75 0 0 1 0-1.06Z",
  info: "M12 2.75a9.25 9.25 0 1 0 0 18.5a9.25 9.25 0 0 0 0-18.5Zm0 4.5a1 1 0 1 1 0 2a1 1 0 0 1 0-2Zm1 10h-2a.75.75 0 0 1 0-1.5h.25v-3H11a.75.75 0 0 1 0-1.5h1a.75.75 0 0 1 .75.75v3.75H13a.75.75 0 0 1 0 1.5Z",
  spark:
    "M11.22 3.4a.8.8 0 0 1 1.56 0l.93 3.76a2.4 2.4 0 0 0 1.75 1.75l3.76.93a.8.8 0 0 1 0 1.56l-3.76.93a2.4 2.4 0 0 0-1.75 1.75l-.93 3.76a.8.8 0 0 1-1.56 0l-.93-3.76a2.4 2.4 0 0 0-1.75-1.75l-3.76-.93a.8.8 0 0 1 0-1.56l3.76-.93a2.4 2.4 0 0 0 1.75-1.75l.93-3.76Z",
  warningTriangle:
    "M11.18 4.2a1 1 0 0 1 1.64 0l7.02 10.29a1 1 0 0 1-.82 1.56H4.98a1 1 0 0 1-.82-1.56L11.18 4.2Zm.82 3.55a.75.75 0 0 0-.75.75v3.75a.75.75 0 0 0 1.5 0V8.5a.75.75 0 0 0-.75-.75Zm0 7a1 1 0 1 0 0-2a1 1 0 0 0 0 2Z",
} as const;

export type IconName = keyof typeof ICON_PATHS;

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  decorative?: boolean;
  name: IconName;
  title?: string;
};

export function Icon({
  className,
  decorative = true,
  name,
  title,
  ...props
}: IconProps) {
  const labelled = !decorative && title;

  return (
    <svg
      aria-hidden={decorative || !labelled}
      className={joinClassNames("ui-icon", className)}
      fill="currentColor"
      role={labelled ? "img" : undefined}
      viewBox="0 0 24 24"
      {...props}
    >
      {labelled ? <title>{title}</title> : null}
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
