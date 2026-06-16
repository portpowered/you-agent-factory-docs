import type { ReactNode } from "react";

export type CalloutVariant = "info" | "caution";

type CalloutProps = {
  variant: CalloutVariant;
  title: string;
  children: ReactNode;
};

const VARIANT_LABEL: Record<CalloutVariant, string> = {
  info: "Information",
  caution: "Caution",
};

export function Callout({ variant, title, children }: CalloutProps) {
  const labelId = `callout-${variant}-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <aside
      aria-labelledby={labelId}
      className={`docs-callout docs-callout--${variant}`}
      role="note"
    >
      <p className="docs-callout__title" id={labelId}>
        <span className="docs-callout__variant">{VARIANT_LABEL[variant]}</span>
        {title}
      </p>
      <div className="docs-callout__content">{children}</div>
    </aside>
  );
}
