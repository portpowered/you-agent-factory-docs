import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { DocsHeader } from "@/features/layout/docs-header";
import { docsSidebarTreeComponents } from "@/features/layout/docs-sidebar-tree";
import { EmptyDocsNavTitle } from "@/features/layout/empty-docs-nav-title";
import type { UiMessages } from "@/lib/content/ui-messages.types";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import { localizePageTree } from "@/lib/i18n/localize-page-tree";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

type CanonicalDocsLayoutProps = {
  children: ReactNode;
  messages: UiMessages;
  locale?: SiteLocale;
};

export function CanonicalDocsLayout({
  children,
  messages,
  locale = defaultLocale,
}: CanonicalDocsLayoutProps) {
  const options = baseOptions(locale);
  const pageTree = localizePageTree(source.pageTree, locale, { messages });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <DocsHeader messages={messages} pageTree={pageTree} locale={locale} />
      <main className="flex min-h-0 flex-1 flex-col">
        <DocsLayout
          tree={pageTree}
          {...options}
          nav={{ ...options.nav, enabled: false }}
          searchToggle={{ enabled: false }}
          themeSwitch={{ enabled: false }}
          slots={{
            searchTrigger: false,
            themeSwitch: false,
            // Header brand mark owns chrome identity; do not repeat it in the
            // desktop sidebar header via Fumadocs InlineNavTitle. Use a client
            // module export — inline `() => null` breaks RSC serialization.
            navTitle: EmptyDocsNavTitle,
          }}
          sidebar={{
            "aria-label": messages.shell.sidebarTitle,
            components: docsSidebarTreeComponents,
          }}
        >
          {children}
        </DocsLayout>
      </main>
    </div>
  );
}
