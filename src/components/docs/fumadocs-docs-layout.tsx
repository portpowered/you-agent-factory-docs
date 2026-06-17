import { loadDocsShellNavigation } from "@/lib/content";
import { projectFumadocsPageTree } from "@/lib/content/fumadocs-page-tree";
import { PROJECT_NAME } from "@/lib/project";
import { GITHUB_REPO_URL } from "@/lib/shell";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";

type FumadocsDocsLayoutProps = {
  children: ReactNode;
};

export function FumadocsDocsLayout({ children }: FumadocsDocsLayoutProps) {
  const navigation = loadDocsShellNavigation();
  const tree = projectFumadocsPageTree(navigation, {
    rootName: PROJECT_NAME,
  });

  return (
    <DocsLayout
      disableThemeSwitch
      githubUrl={GITHUB_REPO_URL}
      nav={{
        enableSearch: false,
        title: PROJECT_NAME,
        url: "/",
      }}
      sidebar={{
        hideSearch: true,
      }}
      tree={tree}
    >
      {children}
    </DocsLayout>
  );
}
