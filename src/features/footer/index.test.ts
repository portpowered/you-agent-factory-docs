import { describe, expect, test } from "bun:test";
import {
  type FooterColumn,
  type FooterLink,
  type FooterMeta,
  SiteFooter,
  type SiteFooterProps,
} from "./index";

describe("footer public barrel", () => {
  test("re-exports SiteFooter and public types", () => {
    expect(typeof SiteFooter).toBe("function");

    const link: FooterLink = { label: "Guides", href: "/docs/guides" };
    const column: FooterColumn = { title: "Product", links: [link] };
    const meta: FooterMeta = { copyright: "© barrel" };
    const props: SiteFooterProps = { columns: [column], meta };

    expect(props.columns[0]?.title).toBe("Product");
    expect(props.meta.copyright).toBe("© barrel");
  });
});
