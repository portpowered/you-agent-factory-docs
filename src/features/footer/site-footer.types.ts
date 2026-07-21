import type { ReactNode } from "react";

/** Single navigable link inside a footer column or meta row. */
export type FooterLink = {
  label: string;
  href: string;
};

/** Titled group of footer links (one column). */
export type FooterColumn = {
  title: string;
  links: FooterLink[];
};

/** Meta-row content below the column groups. */
export type FooterMeta = {
  copyright: string;
  links?: FooterLink[];
};

/** Public props for the landing SiteFooter (homepage-2 contract). */
export type SiteFooterProps = {
  columns: FooterColumn[];
  meta: FooterMeta;
  art?: ReactNode;
  className?: string;
};
