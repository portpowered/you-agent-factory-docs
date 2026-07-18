import { notFound } from "next/navigation";

/**
 * Production-export stub for the AsyncAPI SSE spike content module.
 * Keeps @fumadocs/asyncapi out of the static-export JS graph.
 */
export async function SseAsyncApiSpikePageContent() {
  notFound();
}
