/**
 * Public barrel for the landing SiteFooter feature.
 *
 * Distinct from docs next/prev footer chrome. Decorative art is caller-owned
 * (`art?: ReactNode`); this package does not embed seadragon.
 */

export { SiteFooter } from "./SiteFooter";
export type {
  FooterColumn,
  FooterLink,
  FooterMeta,
  SiteFooterProps,
} from "./site-footer.types";
