import {
  type CalloutVariant,
  formatCalloutAccessibleName,
  formatCalloutVariantLabel,
} from "@/lib/docs-primitives";
import type { ReactNode } from "react";

export type { CalloutVariant };

type CalloutProps = {
  variant: CalloutVariant;
  title: string;
  children: ReactNode;
};

export function Callout({ variant, title, children }: CalloutProps) {
  const accessibleName = formatCalloutAccessibleName(variant, title);
  const variantLabel = formatCalloutVariantLabel(variant);

  return (
    <aside
      aria-label={accessibleName}
      className={`docs-callout docs-callout--${variant}`}
      role="note"
    >
      <p className="docs-callout__title">
        <span aria-hidden="true" className="docs-callout__variant">
          {variantLabel}
        </span>
        <span className="docs-callout__title-text">{title}</span>
      </p>
      <div className="docs-callout__content">{children}</div>
    </aside>
  );
}
