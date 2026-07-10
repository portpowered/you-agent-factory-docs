"use client";

import type { SharedProps } from "fumadocs-ui/contexts/search";
import { RootProvider } from "fumadocs-ui/provider/next";
import { type ComponentType, lazy, type ReactNode, useMemo } from "react";
import type { SearchResultMetaRecord } from "@/features/docs/search/search-result-meta-client";
import type { UiMessages } from "@/lib/content/ui-messages.types";

const DocsSearchDialog = lazy(() =>
  import("@/features/docs/search/SearchDialog").then((mod) => ({
    default: mod.DocsSearchDialog,
  })),
);

type AppProvidersProps = {
  children: ReactNode;
  metaByUrl: SearchResultMetaRecord;
  messages: UiMessages;
};

export function AppProviders({
  children,
  metaByUrl,
  messages,
}: AppProvidersProps) {
  const SearchDialog = useMemo((): ComponentType<SharedProps> => {
    return function SearchDialogWithMeta(props) {
      return (
        <DocsSearchDialog
          {...props}
          metaByUrl={metaByUrl}
          messages={messages}
        />
      );
    };
  }, [metaByUrl, messages]);

  return (
    <RootProvider
      theme={{ enabled: true, defaultTheme: "dark", forcedTheme: "dark" }}
      search={{
        SearchDialog,
        enabled: true,
      }}
    >
      {children}
    </RootProvider>
  );
}
