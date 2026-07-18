import { notFound } from "next/navigation";

/**
 * Production-export stub for the hybrid placement SSE spike content module.
 * Keeps fumadocs-openapi / Scalar out of the static-export JS graph.
 */
export async function SseHybridSpikePageContent() {
  notFound();
}
