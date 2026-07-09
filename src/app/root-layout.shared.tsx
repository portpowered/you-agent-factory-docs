import type { Metadata } from "next";
import type { ReactNode } from "react";

export const siteMetadata: Metadata = {
  title: "you-agent-factory",
  description:
    "CLI documentation for installing the factory, running named goals, and operating agent workflows",
};

type RootDocumentProps = {
  children: ReactNode;
  lang: string;
};

export function RootDocument({ children, lang }: RootDocumentProps) {
  return (
    <html lang={lang} className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
