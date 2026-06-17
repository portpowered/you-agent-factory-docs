import { loadDocsStructureSource } from "@/lib/content/docs-structure-source";
import { PROJECT_NAME } from "@/lib/project";
import { GITHUB_REPO_URL } from "@/lib/shell";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";

type FumadocsDocsLayoutProps = {
  children: ReactNode;
};

export function FumadocsDocsLayout({ children }: FumadocsDocsLayoutProps) {
  const { fumadocsPageTree } = loadDocsStructureSource(undefined, {
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
      tree={fumadocsPageTree}
    >
      {children}
    </DocsLayout>
  );
}
