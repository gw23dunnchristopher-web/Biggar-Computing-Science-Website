import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom does not implement HTMLCanvasElement.getContext / toDataURL.
// The diagram editor uses both, so install lightweight stubs that satisfy
// the calls without throwing.
type AnyFn = (...args: unknown[]) => unknown;

const noop: AnyFn = () => undefined;

const fakeCtx = {
  fillRect: noop,
  clearRect: noop,
  getImageData: () => ({ data: new Uint8ClampedArray(0), width: 0, height: 0 }),
  putImageData: noop,
  createImageData: () => ({ data: new Uint8ClampedArray(0), width: 0, height: 0 }),
  setTransform: noop,
  drawImage: noop,
  save: noop,
  fillText: noop,
  restore: noop,
  beginPath: noop,
  moveTo: noop,
  lineTo: noop,
  closePath: noop,
  stroke: noop,
  translate: noop,
  scale: noop,
  rotate: noop,
  arc: noop,
  fill: noop,
  measureText: () => ({ width: 0 }),
  transform: noop,
  rect: noop,
  clip: noop,
  strokeRect: noop,
  globalAlpha: 1,
  fillStyle: "#000",
  strokeStyle: "#000",
  lineWidth: 1,
  font: "10px sans-serif",
  textAlign: "start",
  textBaseline: "alphabetic",
} as unknown as CanvasRenderingContext2D;

if (typeof HTMLCanvasElement !== "undefined") {
  (HTMLCanvasElement.prototype as unknown as { getContext: AnyFn }).getContext = vi.fn(
    () => fakeCtx,
  );
  (HTMLCanvasElement.prototype as unknown as { toDataURL: AnyFn }).toDataURL = vi.fn(
    () => "data:image/png;base64,",
  );
}

// jsdom does not implement Image natural sizing. The diagram editor measures
// the background image; provide a minimal Image polyfill so onload fires.
class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 600;
  naturalHeight = 400;
  set src(_v: string) {
    queueMicrotask(() => this.onload?.());
  }
  get src(): string {
    return "";
  }
}
(globalThis as { Image: unknown }).Image = FakeImage;

// Default fetch stub — individual tests may override.
if (typeof globalThis.fetch === "undefined") {
  (globalThis as { fetch: unknown }).fetch = vi.fn(async () =>
    new Response(JSON.stringify([]), { status: 200 }),
  );
}

afterEach(() => {
  cleanup();
});
