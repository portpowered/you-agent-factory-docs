import { afterEach, describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DocsShellNavigationInput } from "../../src/lib/content";
import { projectFumadocsPageTree } from "../../src/lib/content/fumadocs-page-tree";
import { PROJECT_NAME } from "../../src/lib/project";

const capturedLayoutProps: unknown[] = [];

mock.module("fumadocs-ui/layouts/docs", () => ({
  DocsLayout: ({
    children,
    ...props
  }: {
    children?: ReactNode;
    [key: string]: unknown;
  }) => {
    capturedLayoutProps.push(props);

    return <div data-testid="fumadocs-layout">{children}</div>;
  },
}));

const navigation: DocsShellNavigationInput = {
  sections: [
    {
      id: "setup",
      label: "Setup",
      pages: [
        {
          canonicalId: "doc/introduction",
          href: "/docs/introduction",
          label: "Introduction",
          order: 0,
        },
        {
          canonicalId: "doc/installation",
          href: "/docs/installation",
          label: "Installation",
          order: 1,
        },
      ],
    },
    {
      id: "guides",
      label: "Guides",
      pages: [
        {
          canonicalId: "doc/getting-started",
          href: "/docs/getting-started",
          label: "Getting started",
          order: 0,
        },
      ],
    },
  ],
};

afterEach(() => {
  capturedLayoutProps.length = 0;
});

describe("Fumadocs docs layout bridge", () => {
  test("projects generated docs navigation into a Fumadocs page tree", () => {
    const tree = projectFumadocsPageTree(navigation, {
      rootName: PROJECT_NAME,
    });

    expect(tree.name).toBe(PROJECT_NAME);
    expect(tree.children).toHaveLength(2);
    expect(tree.children[0]).toEqual({
      children: [
        {
          name: "Introduction",
          type: "page",
          url: "/docs/introduction",
        },
        {
          name: "Installation",
          type: "page",
          url: "/docs/installation",
        },
      ],
      defaultOpen: true,
      name: "Setup",
      root: true,
      type: "folder",
    });
  });

  test("routes docs pages through the checked-in Fumadocs layout component", async () => {
    const { FumadocsDocsLayout } = await import(
      "../../src/components/docs/fumadocs-docs-layout"
    );

    render(
      <FumadocsDocsLayout>
        <p>Docs route content</p>
      </FumadocsDocsLayout>,
    );

    expect(screen.getByTestId("fumadocs-layout")).toBeTruthy();
    expect(screen.getByText("Docs route content")).toBeTruthy();

    const props = capturedLayoutProps.at(-1) as {
      disableThemeSwitch: boolean;
      githubUrl: string;
      nav: { enableSearch: boolean; title: string; url: string };
      sidebar: { hideSearch: boolean };
      tree: ReturnType<typeof projectFumadocsPageTree>;
    };

    expect(props.disableThemeSwitch).toBe(true);
    expect(props.githubUrl).toContain("github.com");
    expect(props.nav).toEqual({
      enableSearch: false,
      title: PROJECT_NAME,
      url: "/",
    });
    expect(props.sidebar).toEqual({
      hideSearch: true,
    });
    expect(props.tree.name).toBe(PROJECT_NAME);
    expect(props.tree.children.length).toBeGreaterThan(0);
  });
});
