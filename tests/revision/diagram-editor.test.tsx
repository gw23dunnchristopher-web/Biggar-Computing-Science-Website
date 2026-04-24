/**
 * Regression tests for revision-client/src/components/ui/diagram-editor.tsx.
 *
 * Mirror of the n5-client suite but for the revision-client copy of the
 * diagram editor. The revision version's items-sync effect is synchronous
 * (no debounce) and uses the same `onChangeRef` + `lastSyncedDataRef` guard
 * to avoid the React error #185 ("Maximum update depth exceeded") loop.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useState } from "react";
import { act, render } from "@testing-library/react";
import { DiagramEditor } from "@/components/ui/diagram-editor";

const SAMPLE_ITEM = {
  id: "box-1",
  type: "box",
  x: 10,
  y: 20,
  width: 80,
  height: 40,
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("revision DiagramEditor render-loop regression", () => {
  it("does not invoke onChange repeatedly when the parent re-renders with a fresh callback identity", async () => {
    const spy = vi.fn();
    let bumpParent = () => {};

    function Parent() {
      const [tick, setTick] = useState(0);
      bumpParent = () => setTick((t) => t + 1);
      return (
        <DiagramEditor
          initialData={JSON.stringify([SAMPLE_ITEM])}
          onChange={(data, drawing) => spy(data, drawing)}
        />
      );
    }

    render(<Parent />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    const initialCalls = spy.mock.calls.length;

    for (let i = 0; i < 25; i++) {
      await act(async () => {
        bumpParent();
        await vi.advanceTimersByTimeAsync(20);
      });
    }
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    const finalCalls = spy.mock.calls.length;
    expect(finalCalls - initialCalls).toBeLessThanOrEqual(1);
    expect(finalCalls).toBeLessThanOrEqual(2);
  });

  it("does not enter a render loop when the parent feeds onChange data straight back into its own state", async () => {
    const spy = vi.fn();
    let renderCount = 0;

    function Parent() {
      renderCount++;
      const [data, setData] = useState(JSON.stringify([SAMPLE_ITEM]));
      return (
        <DiagramEditor
          initialData={data}
          onChange={(d, dr) => {
            spy(d, dr);
            setData(d);
          }}
        />
      );
    }

    render(<Parent />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
    expect(renderCount).toBeLessThan(20);
  });
});
