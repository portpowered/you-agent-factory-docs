"use client";

import { useResponsiveShellState } from "@/hooks/layout/useResponsiveShellState";
import type { ReactNode } from "react";

type ResponsiveShellRootProps = {
  className?: string;
  children: ReactNode;
};

/** Projects canonical responsive shell state onto shell UI without owning layout markup. */
export function ResponsiveShellRoot({
  className,
  children,
}: ResponsiveShellRootProps) {
  const { viewport, isNarrowViewport, prefersReducedMotion } =
    useResponsiveShellState();

  return (
    <div
      className={className}
      data-shell-narrow={isNarrowViewport ? "" : undefined}
      data-shell-reduced-motion={prefersReducedMotion ? "" : undefined}
      data-shell-viewport={viewport}
    >
      {children}
    </div>
  );
}
