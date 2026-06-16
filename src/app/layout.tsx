import { PROJECT_NAME, PROJECT_TAGLINE } from "@/lib/project";
import { LocalizationProvider } from "@/localization/context/localization-context";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: PROJECT_NAME,
  description: PROJECT_TAGLINE,
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <LocalizationProvider>{children}</LocalizationProvider>
      </body>
    </html>
  );
}
