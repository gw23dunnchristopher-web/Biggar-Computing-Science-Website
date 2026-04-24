/**
 * Regression tests for n5-client/src/components/ui/diagram-editor.tsx.
 *
 * The DiagramEditor previously triggered React error #185 ("Maximum update
 * depth exceeded") when a parent passed an unstable inline `onChange` arrow
 * because the items-sync effect would re-fire and bounce data back into
 * parent state. The fix routes the callback through an `onChangeRef` and
 * guards the effect with a `lastSyncedDataRef` so that:
 *
 *   - re-renders that only change the `onChange` identity do NOT re-fire
 *     the effect (onChange must stay out of the dep list)
 *   - even if the effect runs again, onChange is skipped when the
 *     serialized items are unchanged
 *
 * These tests assert both invariants. They will fail if a future change
 * re-introduces the loop.
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

describe("n5 DiagramEditor render-loop regression", () => {
  it("does not invoke onChange repeatedly when the parent re-renders with a fresh callback identity", async () => {
    const spy = vi.fn();
    let bumpParent = () => {};

    function Parent() {
      const [tick, setTick] = useState(0);
      bumpParent = () => setTick((t) => t + 1);
      // Inline arrow — a brand new function identity on every render. If the
      // items-sync effect ever lists `onChange` as a dependency again, this
      // will cause the effect to re-fire on every parent render and (with the
      // 150ms debounce) eventually emit an onChange. Without the bug, the
      // effect only depends on `items`, so no extra calls happen.
      return (
        <DiagramEditor
          initialData={JSON.stringify([SAMPLE_ITEM])}
          onChange={(data, drawing) => spy(data, drawing)}
        />
      );
    }

    render(<Parent />);

    // Flush mount-time effect + 150ms debounce.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    const initialCalls = spy.mock.calls.length;

    // Force many parent re-renders, each with a brand new onChange identity.
    // We space the renders well past the 150ms debounce so each render's
    // (potentially buggy) scheduled timeout has time to fire — that way an
    // accidental `[items, onChange]` dep would yield N extra spy calls.
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        bumpParent();
        await vi.advanceTimersByTimeAsync(250);
      });
    }
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // The serialized items never changed, so the guard must keep the spy
    // call count from growing with re-renders. A non-broken implementation
    // emits at most one onChange (the initial mount sync).
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
            // Bounce the same data straight back into parent state. Without
            // the lastSyncedDataRef guard / ref-based callback, this is the
            // pattern that previously produced React error #185.
            setData(d);
          }}
        />
      );
    }

    render(<Parent />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // The bounce should settle quickly: at most a couple of renders and
    // a single onChange notification (the initial mount sync).
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
    expect(renderCount).toBeLessThan(20);
  });
});
