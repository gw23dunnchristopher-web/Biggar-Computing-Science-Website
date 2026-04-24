/**
 * Regression tests for ds-client/src/components/ui/data-grid.tsx.
 *
 * The lookup-fetch effect previously listed `table.fields` (an array
 * reference) in its dependency array. A parent that recomputed the
 * `table` object on every render handed DataGrid a fresh array reference
 * each time, causing the effect to re-fire, hit `setLookupRecords`, and
 * eventually trigger React error #185 ("Maximum update depth exceeded").
 *
 * The fix replaces the dep with a memoised string `lookupSignature`, so
 * the effect only re-fires when the underlying lookup-field configuration
 * actually changes.
 *
 * To keep the test focused on the effect we mock heavy dependencies
 * (`@/api`, the toast hook, the sub-datasheet, and the design-grid parser)
 * so DataGrid mounts cleanly inside JSDOM.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useState } from "react";
import { act, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/api", () => ({
  useCreateRecord: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useUpdateRecord: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  getListRecordsQueryKey: (databaseId: number, tableId: number) => [
    "records",
    databaseId,
    tableId,
  ],
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn(), dismiss: vi.fn() }),
}));

vi.mock("@/components/ui/sub-datasheet", () => ({
  SubDatasheet: () => null,
}));

vi.mock("@/components/ui/design-grid", () => ({
  parseLookupConfig: (description: string | null | undefined) => {
    if (!description?.startsWith("__lookup__:")) return null;
    try {
      return JSON.parse(description.slice("__lookup__:".length));
    } catch {
      return null;
    }
  },
  parseCalculatedExpr: () => "",
  parseValidation: () => ({ rule: "", text: "" }),
}));

import { DataGrid } from "@/components/ui/data-grid";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

function makeTable() {
  // Returns a brand new object/array reference every call so the parent
  // looks like one that recomputes its `table` prop on every render.
  return {
    id: 1,
    databaseId: 1,
    name: "Orders",
    description: null,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      {
        id: 10,
        tableId: 1,
        name: "id",
        fieldType: "autonumber",
        sortOrder: 0,
        isPrimaryKey: true,
        description: null,
      },
      {
        id: 11,
        tableId: 1,
        name: "customer",
        fieldType: "lookup",
        sortOrder: 1,
        isPrimaryKey: false,
        // Lookup config that points at table id 99. The fix keys the
        // fetch effect off a stable signature derived from this value.
        description:
          "__lookup__:" +
          JSON.stringify({
            type: "table",
            tableId: 99,
            valueField: "id",
            displayField: "name",
          }),
      },
    ],
  } as unknown as Parameters<typeof DataGrid>[0]["table"];
}

describe("DataGrid lookup-fetch render-loop regression", () => {
  it("fetches lookup records exactly once even when the parent re-renders with a fresh table reference", async () => {
    // Use a fetch that never resolves so the lookup cache stays empty.
    // This exposes the bug (stale-closure refetch) — without the
    // memoised `lookupSignature`, a parent that hands us a fresh
    // `table` reference on every render would call fetch again and again
    // because the cache check inside the effect keeps reading "empty".
    const fetchSpy = vi.fn().mockImplementation(() => new Promise(() => {}));
    (globalThis as { fetch: typeof fetchSpy }).fetch = fetchSpy;

    let bumpParent = () => {};

    function Parent() {
      const [tick, setTick] = useState(0);
      bumpParent = () => setTick((t) => t + 1);
      // Fresh `table` and `records` references on every render — the
      // exact pattern that previously made the lookup effect re-fire.
      return (
        <DataGrid
          table={makeTable()}
          records={[]}
          databaseId={1}
          selectedRowId={null}
          onSelectRow={() => {}}
        />
      );
    }

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Parent />
      </QueryClientProvider>,
    );

    // Let the mount-time effect fire and the mocked fetch resolve.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    const initialFetchCount = fetchSpy.mock.calls.length;
    expect(initialFetchCount).toBeGreaterThanOrEqual(1);

    // Force many parent re-renders. Each render hands DataGrid a fresh
    // `table` object. With the bug, every render would re-fire the lookup
    // effect and call fetch again. With the fix, the memoised
    // `lookupSignature` keeps the deps stable.
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        bumpParent();
        await vi.advanceTimersByTimeAsync(20);
      });
    }
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(fetchSpy.mock.calls.length).toBe(initialFetchCount);
  });
});
