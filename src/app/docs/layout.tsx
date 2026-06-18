import "fumadocs-ui/style.css";
import { FumadocsDocsLayout } from "@/components/docs/fumadocs-docs-layout";
import type { ReactNode } from "react";

type DocsRouteLayoutProps = {
  children: ReactNode;
};

export default function DocsRouteLayout({ children }: DocsRouteLayoutProps) {
  return <FumadocsDocsLayout>{children}</FumadocsDocsLayout>;
}
