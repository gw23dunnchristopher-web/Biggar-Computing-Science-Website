import { r as reactExports, j as jsxRuntimeExports, g as cn } from "./index-DZjJp9Jo.js";
const getCellValue = (cell) => {
  if (typeof cell === "string") return cell;
  if (cell && typeof cell === "object" && "value" in cell) return cell.value || "";
  return String(cell || "");
};
const getCellRole = (cell) => {
  if (typeof cell === "object" && cell !== null && "role" in cell) return cell.role || "data";
  return "data";
};
function ResponsiveDataTable({ dataTable, className }) {
  const [compactionLevel, setCompactionLevel] = reactExports.useState(0);
  const containerRef = reactExports.useRef(null);
  const tableRef = reactExports.useRef(null);
  reactExports.useLayoutEffect(() => {
    const container = containerRef.current;
    const table = tableRef.current;
    if (!container || !table) return;
    const checkOverflow = () => {
      const containerWidth = container.clientWidth;
      const tableWidth = table.scrollWidth;
      return tableWidth > containerWidth + 2;
    };
    requestAnimationFrame(() => {
      if (checkOverflow() && compactionLevel < 2) {
        setCompactionLevel((prev) => Math.min(prev + 1, 2));
      }
    });
  }, [compactionLevel, dataTable]);
  reactExports.useLayoutEffect(() => {
    setCompactionLevel(0);
  }, [dataTable]);
  const cellPadding = compactionLevel >= 1 ? "px-2 py-1" : "px-4 py-2";
  const textSize = compactionLevel >= 2 ? "text-xs" : "text-sm";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex justify-center overflow-x-auto", className), ref: containerRef, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden inline-block max-w-full", children: [
    dataTable.tableName && dataTable.tableName.trim() !== "" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("bg-neutral-200 dark:bg-neutral-700 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono", cellPadding, textSize), children: dataTable.tableName }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: textSize, ref: tableRef, children: [
      !dataTable.hideHeaders && /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: cn(cellPadding, "font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0 break-words", col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"), style: col.width ? { width: col.width } : void 0, children: col.header }, col.id)) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-neutral-300 dark:border-neutral-700", children: row.cells.map((cell, cellIndex) => {
        const cellObj = typeof cell === "object" && cell !== null ? cell : null;
        if (cellObj?.hidden) return null;
        const colSpan = cellObj?.colSpan || 1;
        const cellRole = getCellRole(cell);
        const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
        const col = dataTable.columns[cellIndex];
        const colAlign = col?.align;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          CellTag,
          {
            colSpan: colSpan > 1 ? colSpan : void 0,
            className: cn(
              cellPadding,
              "border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
              cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold",
              cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold",
              cellRole !== "title" && colAlign === "center" && "text-center",
              cellRole !== "title" && colAlign === "right" && "text-right",
              cellRole !== "title" && !colAlign && dataTable.centered && cellRole === "data" && "text-center",
              cellRole === "title" && "text-left",
              "whitespace-pre-wrap",
              dataTable.verticalAlign === "middle" ? "align-middle" : dataTable.verticalAlign === "bottom" ? "align-bottom" : "align-top"
            ),
            style: col?.width ? { width: col.width } : void 0,
            children: getCellValue(cell)
          },
          cellIndex
        );
      }) }, row.id)) })
    ] })
  ] }) });
}
export {
  ResponsiveDataTable as R
};
//# sourceMappingURL=responsive-data-table-CZUpIuB-.js.map
