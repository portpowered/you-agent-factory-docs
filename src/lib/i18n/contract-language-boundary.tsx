/**
 * Reusable English language-boundary wrapper for canonical contract description
 * prose on non-English reference pages (W17).
 *
 * Use only for package-sourced contract descriptions. Do not wrap localizable
 * chrome — that fails closed via the contract-language policy helpers.
 */

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import {
  assertContractDescriptionRole,
  CONTRACT_LANGUAGE,
  englishContractLanguageBoundaryAttributes,
  type ReferenceTextRole,
} from "@/lib/i18n/contract-language-policy";
import type { SiteLocale } from "@/lib/i18n/locale-routing";
import { cn } from "@/lib/utils";

type EnglishContractDescriptionOwnProps<T extends ElementType> = {
  /** Active UI locale for the surrounding page. */
  locale: SiteLocale;
  children: ReactNode;
  className?: string;
  /**
   * Element tag for the boundary container. Defaults to `span` so it can sit
   * inline beside localized chrome.
   */
  as?: T;
  /**
   * Must stay `contract-description`. Passing chrome or identifier text roles
   * fails closed so call sites cannot misuse this helper for localizable strings.
   * Named `textRole` (not DOM `role`) to avoid ARIA attribute collisions.
   */
  textRole?: ReferenceTextRole;
};

export type EnglishContractDescriptionProps<T extends ElementType = "span"> =
  EnglishContractDescriptionOwnProps<T> &
    Omit<
      ComponentPropsWithoutRef<T>,
      keyof EnglishContractDescriptionOwnProps<T>
    >;

/**
 * Wraps canonical English contract description text. On non-default locales,
 * emits `lang="en"` so assistive tech treats the prose as English while the
 * surrounding page keeps its UI locale.
 */
export function EnglishContractDescription<T extends ElementType = "span">({
  locale,
  children,
  className,
  as,
  textRole = "contract-description",
  ...rest
}: EnglishContractDescriptionProps<T>) {
  assertContractDescriptionRole(textRole);

  const Component = (as ?? "span") as ElementType;
  const boundary = englishContractLanguageBoundaryAttributes(locale);

  return (
    <Component
      {...rest}
      {...boundary}
      className={cn(className)}
      data-contract-language={CONTRACT_LANGUAGE}
      data-contract-prose=""
    >
      {children}
    </Component>
  );
}
