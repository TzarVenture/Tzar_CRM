import { describe, expect, it } from "vitest";
import { pageWindow } from "./pagination";

describe("pageWindow", () => {
  it("shows every page when there are few", () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
  });
  it("keeps first, last and the current neighbourhood, with gaps", () => {
    expect(pageWindow(1, 26)).toEqual([1, 2, null, 26]);
    expect(pageWindow(13, 26)).toEqual([1, null, 12, 13, 14, null, 26]);
    expect(pageWindow(26, 26)).toEqual([1, null, 25, 26]);
  });
  it("handles a single page", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
  });
});
