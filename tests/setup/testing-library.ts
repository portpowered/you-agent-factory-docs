import { afterEach, beforeEach } from "bun:test";
import { cleanup } from "@testing-library/react";
import { resetMatchMedia } from "../helpers/mock-match-media";

beforeEach(() => {
  globalThis.fetch = (() => new Promise(() => {})) as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  resetMatchMedia();
});
