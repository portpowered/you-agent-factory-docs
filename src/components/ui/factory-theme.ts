import { joinClassNames } from "@/lib/classnames";

const SURFACE_TONE_CLASS_NAMES = {
  default: "ui-surface--default",
  hero: "ui-surface--hero",
  muted: "ui-surface--muted",
} as const;

const SURFACE_PADDING_CLASS_NAMES = {
  compact: "ui-surface-padding--compact",
  comfortable: "ui-surface-padding--comfortable",
  spacious: "ui-surface-padding--spacious",
} as const;

const SURFACE_RADIUS_CLASS_NAMES = {
  default: "ui-surface-radius--default",
  inner: "ui-surface-radius--inner",
} as const;

const STACK_GAP_CLASS_NAMES = {
  compact: "ui-stack-gap--compact",
  section: "ui-stack-gap--section",
} as const;

const CONTENT_WIDTH_CLASS_NAMES = {
  prose: "ui-layout--prose",
  reading: "ui-layout--reading",
} as const;

type SurfaceTone = keyof typeof SURFACE_TONE_CLASS_NAMES;
type SurfacePadding = keyof typeof SURFACE_PADDING_CLASS_NAMES;
type SurfaceRadius = keyof typeof SURFACE_RADIUS_CLASS_NAMES;
type StackGap = keyof typeof STACK_GAP_CLASS_NAMES;
type ContentWidth = keyof typeof CONTENT_WIDTH_CLASS_NAMES;

type SurfaceClassNameOptions = {
  className?: string;
  padding?: SurfacePadding;
  radius?: SurfaceRadius;
  tone?: SurfaceTone;
};

export function getSurfaceClassName({
  className,
  padding = "comfortable",
  radius = "default",
  tone = "default",
}: SurfaceClassNameOptions = {}): string {
  return joinClassNames(
    "ui-surface w-full border",
    SURFACE_TONE_CLASS_NAMES[tone],
    SURFACE_PADDING_CLASS_NAMES[padding],
    SURFACE_RADIUS_CLASS_NAMES[radius],
    className,
  );
}

type StackClassNameOptions = {
  align?: "items-center" | "items-stretch";
  className?: string;
  gap?: StackGap;
};

export function getStackClassName({
  align = "items-stretch",
  className,
  gap = "section",
}: StackClassNameOptions = {}): string {
  return joinClassNames(
    "ui-stack flex w-full flex-col",
    align === "items-center"
      ? "ui-stack-align--center"
      : "ui-stack-align--stretch",
    STACK_GAP_CLASS_NAMES[gap],
    className,
  );
}

export function getContentWidthClassName(
  width: ContentWidth,
  className?: string,
): string {
  return joinClassNames(CONTENT_WIDTH_CLASS_NAMES[width], className);
}

export const BUTTON_VARIANT_CLASS_NAMES = {
  primary: "ui-button--primary",
  secondary: "ui-button--secondary",
  nav: "ui-button--nav",
  navCurrent: "ui-button--nav-current",
  navSubtle: "ui-button--nav-subtle",
} as const;

export const BUTTON_SIZE_CLASS_NAMES = {
  default: "ui-button-size--default",
  compact: "ui-button-size--compact",
} as const;
