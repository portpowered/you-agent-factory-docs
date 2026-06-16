import { fetch } from "bun";

export async function fetchHttp(
  url: string | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(url, init);
}
