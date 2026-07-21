"use client";

import { ParticleSphere } from "@/features/landing-page/components/ParticleSphere";

/**
 * Sphere-only harness shell: fixed square, no landing chrome.
 * Used by `(dev)/sphere-harness` so Wave C can review W-sphere alone.
 */
export function SphereHarnessView() {
  return (
    <main
      className="fixed inset-0 flex items-center justify-center bg-neutral-950 text-neutral-100"
      data-sphere-harness=""
    >
      <div
        className="aspect-square h-[min(100vw,100vh)] w-[min(100vw,100vh)] max-h-screen max-w-full"
        data-sphere-harness-stage=""
      >
        <ParticleSphere className="h-full w-full" />
      </div>
    </main>
  );
}
