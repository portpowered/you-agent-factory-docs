import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BlogNextPostControl } from "./BlogNextPostControl";

describe("BlogNextPostControl", () => {
  test("renders a keyboard-focusable next-post link with assistive label", () => {
    const html = renderToStaticMarkup(
      createElement(BlogNextPostControl, {
        next: {
          slug: "middle-post",
          title: "Middle Post",
          href: "/blog/middle-post",
        },
      }),
    );

    expect(html).toContain('data-testid="blog-next-post"');
    expect(html).toContain('aria-label="Next blog post"');
    expect(html).toContain('href="/blog/middle-post"');
    expect(html).toContain("Next post");
    expect(html).toContain("Middle Post");
    expect(html).toContain('data-testid="blog-next-post-link"');
  });
});
