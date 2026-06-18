import {
  BUTTON_SIZE_CLASS_NAMES,
  BUTTON_VARIANT_CLASS_NAMES,
} from "@/components/ui/factory-theme";
import { joinClassNames } from "@/lib/classnames";
import Link from "next/link";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";

type ButtonVariant = keyof typeof BUTTON_VARIANT_CLASS_NAMES;
type ButtonSize = keyof typeof BUTTON_SIZE_CLASS_NAMES;

type ButtonClassNameOptions = {
  className?: string;
  displayClassName?: string;
  fullWidth?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function getButtonClassName({
  className,
  displayClassName = "inline-flex",
  fullWidth = false,
  size = "default",
  variant = "primary",
}: ButtonClassNameOptions = {}): string {
  return joinClassNames(
    "ui-button",
    displayClassName,
    BUTTON_SIZE_CLASS_NAMES[size],
    BUTTON_VARIANT_CLASS_NAMES[variant],
    fullWidth && "w-full",
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  displayClassName?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      displayClassName,
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
        className={getButtonClassName({
          className,
          displayClassName,
          fullWidth,
          size,
          variant,
        })}
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
  displayClassName?: string;
  external?: boolean;
  fullWidth?: boolean;
  href: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href">;

export function ButtonLink({
  children,
  className,
  displayClassName,
  external = false,
  fullWidth = false,
  href,
  size = "default",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  const resolvedClassName = getButtonClassName({
    className,
    displayClassName,
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
