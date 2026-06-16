import { afterEach } from "bun:test";
import { cleanup } from "@testing-library/react";
import { resetMatchMedia } from "../helpers/mock-match-media";

afterEach(() => {
  cleanup();
  resetMatchMedia();
});
