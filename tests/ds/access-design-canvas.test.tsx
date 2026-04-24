/**
 * Regression tests for ds-client/src/components/ui/access-design-canvas.tsx.
 *
 * The auto-save effect previously listed the parent's `onSave` callback in
 * its dependency array. When the parent passed an inline arrow (fresh
 * identity on every render) and `onSave` itself triggered parent state
 * changes, the effect re-fired indefinitely and produced React error #185
 * ("Maximum update depth exceeded").
 *
 * The fix stores `onSave` in a ref so the auto-save effect's deps remain
 * `[designFields, designImages, designLabels, autoSave, isSaving]` and
 * never re-fire just because the parent re-rendered.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useState } from "react";
import { act, render } from "@testing-library/react";
import { AccessDesignCanvas } from "@/components/ui/access-design-canvas";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("AccessDesignCanvas auto-save render-loop regression", () => {
  it("does not re-fire auto-save just because the parent re-renders with a fresh onSave identity", async () => {
    const saveSpy = vi.fn();
    let bumpParent = () => {};

    function Parent() {
      const [tick, setTick] = useState(0);
      bumpParent = () => setTick((t) => t + 1);
      return (
        <AccessDesignCanvas
          mode="form"
          objectName="TestForm"
          fields={[
            {
              fieldName: "name",
              label: "Name",
              visible: true,
              sortOrder: 0,
              fieldType: "text",
            },
          ]}
          accentColor="#000"
          // Inline arrow — fresh identity every render. The fix must keep
          // this OUT of the auto-save effect's dep list (via onSaveRef),
          // otherwise the effect re-fires on every parent render and the
          // 1500ms debounced save eventually triggers a setState loop.
          onSave={(...args) => saveSpy(...args)}
          isSaving={false}
          autoSave={true}
        />
      );
    }

    render(<Parent />);

    // Force a barrage of parent re-renders during the auto-save window.
    for (let i = 0; i < 30; i++) {
      await act(async () => {
        bumpParent();
        await vi.advanceTimersByTimeAsync(100);
      });
    }
    // Drain any leftover debounce window.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Design data never changed — auto-save must not have fired.
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it("does not enter a save loop when onSave itself causes the parent to re-render", async () => {
    const saveSpy = vi.fn();
    let renderCount = 0;

    function Parent() {
      renderCount++;
      const [count, setCount] = useState(0);
      return (
        <AccessDesignCanvas
          mode="form"
          objectName="LoopForm"
          fields={[
            {
              fieldName: "field1",
              label: "Field 1",
              visible: true,
              sortOrder: 0,
              fieldType: "text",
            },
          ]}
          accentColor="#000"
          // The classic React error #185 pattern: onSave does setState on
          // the parent. Without onSaveRef, every save would re-fire the
          // effect because the new onSave identity is a dep — producing an
          // unbounded loop that React eventually aborts.
          onSave={(f, i, l) => {
            saveSpy(f, i, l);
            setCount((c) => c + 1);
          }}
          isSaving={false}
          autoSave={true}
        />
      );
    }

    render(<Parent />);

    // Walk the clock for several auto-save windows.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    // Without an actual data change, onSave should not fire at all. The
    // outer ceiling of 5 keeps the test resilient to small implementation
    // tweaks while still catching a runaway loop (which would call save
    // dozens of times before React aborted).
    expect(saveSpy.mock.calls.length).toBeLessThanOrEqual(5);
    expect(renderCount).toBeLessThan(30);
  });
});
