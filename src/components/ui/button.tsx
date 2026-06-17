import { joinClassNames } from "@/lib/classnames";
import Link from "next/link";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";

const BUTTON_VARIANT_CLASS_NAMES = {
  primary: "bg-accent text-accent-foreground hover:opacity-90",
  secondary: "border bg-transparent text-card-foreground hover:bg-muted",
  nav: "text-accent hover:bg-accent/10",
  navCurrent: "bg-accent text-accent-foreground",
  navSubtle:
    "text-card-foreground hover:bg-muted hover:text-foreground data-[current=true]:bg-accent/12 data-[current=true]:text-accent",
} as const;

const BUTTON_SIZE_CLASS_NAMES = {
  default: "min-h-11 px-4 py-2.5",
  compact: "px-3 py-2 text-sm",
} as const;

type ButtonVariant = keyof typeof BUTTON_VARIANT_CLASS_NAMES;
type ButtonSize = keyof typeof BUTTON_SIZE_CLASS_NAMES;

type ButtonClassNameOptions = {
  className?: string;
  fullWidth?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function getButtonClassName({
  className,
  fullWidth = false,
  size = "default",
  variant = "primary",
}: ButtonClassNameOptions = {}): string {
  return joinClassNames(
    "ui-button inline-flex items-center justify-center rounded-md font-semibold no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    BUTTON_SIZE_CLASS_NAMES[size],
    BUTTON_VARIANT_CLASS_NAMES[variant],
    fullWidth && "w-full",
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      fullWidth = false,
      size = "default",
      type = "button",
      variant = "primary",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={getButtonClassName({ className, fullWidth, size, variant })}
        ref={ref}
        type={type}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

type ButtonLinkProps = {
  children: ReactNode;
  className?: string;
  external?: boolean;
  fullWidth?: boolean;
  href: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href">;

export function ButtonLink({
  children,
  className,
  external = false,
  fullWidth = false,
  href,
  size = "default",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  const resolvedClassName = getButtonClassName({
    className,
    fullWidth,
    size,
    variant,
  });

  if (external) {
    return (
      <a
        className={resolvedClassName}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <Link className={resolvedClassName} href={href} {...props}>
      {children}
    </Link>
  );
}
