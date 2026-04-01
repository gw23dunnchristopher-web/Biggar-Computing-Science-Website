import { useState, useRef, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import type { DataTable, DataTableCellRole } from "@/lib/past-papers";

const getCellValue = (cell: string | { value: string; role?: DataTableCellRole }): string => {
  if (typeof cell === "string") return cell;
  if (cell && typeof cell === "object" && "value" in cell) return cell.value || "";
  return String(cell || "");
};

const getCellRole = (cell: string | { value: string; role?: DataTableCellRole }): DataTableCellRole => {
  if (typeof cell === "object" && cell !== null && "role" in cell) return cell.role || "data";
  return "data";
};

const getCellSpan = (cell: string | { value: string; colSpan?: number; rowSpan?: number; hidden?: boolean }): { colSpan?: number; rowSpan?: number; hidden?: boolean } => {
  if (typeof cell === "object" && cell !== null) {
    return { colSpan: cell.colSpan, rowSpan: cell.rowSpan, hidden: cell.hidden };
  }
  return {};
};

interface ResponsiveDataTableProps {
  dataTable: DataTable;
  className?: string;
}

export function ResponsiveDataTable({ dataTable, className }: ResponsiveDataTableProps) {
  const [compactionLevel, setCompactionLevel] = useState<0 | 1 | 2>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  useLayoutEffect(() => {
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
        setCompactionLevel(prev => Math.min(prev + 1, 2) as 0 | 1 | 2);
      }
    });
  }, [compactionLevel, dataTable]);

  useLayoutEffect(() => {
    setCompactionLevel(0);
  }, [dataTable]);

  const cellPadding = compactionLevel >= 1 ? "px-2 py-1" : "px-4 py-2";
  const textSize = compactionLevel >= 2 ? "text-xs" : "text-sm";

  const renderCellContent = (text: string) => {
    const lines = text.split("\n");
    if (lines.length <= 1) return text;
    return lines.map((line, i) => {
      const isBullet = /^\s*[•\-\*]\s/.test(line);
      return <div key={i} style={isBullet ? { paddingLeft: "1.2em", textIndent: "-1.2em" } : undefined}>{line || "\u00A0"}</div>;
    });
  };

  return (
    <div className={cn("flex justify-center overflow-x-auto", className)} ref={containerRef}>
      <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden inline-block max-w-full">
        {dataTable.tableName && dataTable.tableName.trim() !== "" && (
          <div className={cn("bg-neutral-200 dark:bg-neutral-700 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono", cellPadding, textSize)}>
            {dataTable.tableName}
          </div>
        )}
        <table className={textSize} ref={tableRef} style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
          {!dataTable.hideHeaders && (
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-800">
                {dataTable.columns.map((col) => (
                  <th
                    key={col.id}
                    className={cn(cellPadding, "text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0 break-words")}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {renderCellContent(col.header)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {dataTable.rows.map((row) => (
              <tr key={row.id} className="border-t border-neutral-300 dark:border-neutral-700">
                {row.cells.map((cell, cellIndex) => {
                  const { colSpan, rowSpan, hidden } = getCellSpan(cell);
                  if (hidden) return null;
                  const cellRole = getCellRole(cell);
                  const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                  const colWidth = dataTable.columns[cellIndex]?.width;
                  const spanProps: Record<string, number> = {};
                  if (colSpan && colSpan > 1) spanProps.colSpan = colSpan;
                  if (rowSpan && rowSpan > 1) spanProps.rowSpan = rowSpan;
                  return (
                    <CellTag
                      key={cellIndex}
                      className={cn(
                        cellPadding,
                        "border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                        cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                        cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                      )}
                      style={{ verticalAlign: "top", ...(colWidth ? { width: colWidth } : {}) }}
                      {...spanProps}
                    >
                      {renderCellContent(getCellValue(cell))}
                    </CellTag>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
