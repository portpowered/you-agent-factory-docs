import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { joinClassNames } from "@/lib/classnames";
import type {
  ComponentPropsWithoutRef,
  HTMLAttributes,
  ReactNode,
} from "react";

type BentoCardAction = {
  external?: boolean;
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type BentoCardSpan = "default" | "feature";

type BentoCardProps = Omit<ComponentPropsWithoutRef<"article">, "title"> & {
  action?: BentoCardAction;
  as?: "article" | "div" | "li" | "section";
  children?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  meta?: readonly string[];
  span?: BentoCardSpan;
  title: string;
  titleAs?: "h2" | "h3";
};

const BENTO_CARD_SPAN_CLASS_NAMES: Record<BentoCardSpan, string> = {
  default: "ui-bento-card--default",
  feature: "ui-bento-card--feature",
};

export function BentoGrid({
  as: Component = "div",
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: "div" | "ol" | "section" | "ul";
}) {
  return (
    <Component
      className={joinClassNames("ui-bento-grid", className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function BentoCard({
  action,
  as = "article",
  children,
  className,
  description,
  eyebrow,
  meta,
  span = "default",
  title,
  titleAs: TitleTag = "h3",
  ...props
}: BentoCardProps) {
  const hasMeta = Boolean(meta && meta.length > 0);
  const hasFooter = hasMeta || action;

  return (
    <Card
      as={as}
      className={joinClassNames(
        "ui-bento-card",
        BENTO_CARD_SPAN_CLASS_NAMES[span],
        className,
      )}
      padding="comfortable"
      tone="muted"
      {...props}
    >
      <div className="ui-bento-card__header">
        {eyebrow ? <p className="ui-bento-card__eyebrow">{eyebrow}</p> : null}
        <TitleTag className="ui-bento-card__title">{title}</TitleTag>
        {description ? (
          <div className="ui-bento-card__description">{description}</div>
        ) : null}
      </div>

      {children ? <div className="ui-bento-card__body">{children}</div> : null}

      {hasFooter ? (
        <div className="ui-bento-card__footer">
          {hasMeta ? (
            <ul className="ui-bento-card__meta">
              {meta?.map((item) => (
                <li className="ui-bento-card__meta-item" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
          {action ? (
            <ButtonLink
              className="ui-bento-card__action"
              external={action.external}
              href={action.href}
              size="compact"
              variant={action.variant ?? "secondary"}
            >
              {action.label}
            </ButtonLink>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
