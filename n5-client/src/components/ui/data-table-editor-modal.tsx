import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Plus, Trash2, Table, Eye, ArrowDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import type { DataTable, DataTableCellRole, DataTableVerticalAlign, DataTableColumnConstraint } from "@/lib/past-papers";

interface LocalDataTable {
  tableName: string;
  columns: { id: string; header: string; width?: string; align?: "left" | "center" | "right"; constraint?: DataTableColumnConstraint }[];
  rows: { id: string; cells: (string | { value: string; role?: DataTableCellRole; colSpan?: number; rowSpan?: number; hidden?: boolean })[] }[];
  centered: boolean;
  hideHeaders: boolean;
  verticalAlign: DataTableVerticalAlign;
}

interface DataTableEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataTable: DataTable | null;
  onSave: (dataTable: DataTable) => void;
}

const getCellValue = (cell: string | { value: string; role?: DataTableCellRole }): string => {
  if (typeof cell === "string") return cell;
  if (cell && typeof cell === "object" && "value" in cell) return cell.value || "";
  return String(cell || "");
};

const getCellRole = (cell: string | { value: string; role?: DataTableCellRole }): DataTableCellRole => {
  if (typeof cell === "object" && cell !== null && "role" in cell) return cell.role || "data";
  return "data";
};

const defaultTable: LocalDataTable = {
  tableName: "",
  columns: [{ id: "col-1", header: "Column1" }],
  rows: [{ id: "row-1", cells: [""] }],
  centered: false,
  hideHeaders: false,
  verticalAlign: "top"
};

const normalizeToLocal = (dt: DataTable): LocalDataTable => ({
  tableName: dt.tableName || "",
  columns: dt.columns,
  rows: dt.rows,
  centered: dt.centered || false,
  hideHeaders: dt.hideHeaders || false,
  verticalAlign: dt.verticalAlign || "top"
});

const normalizeToDataTable = (lt: LocalDataTable): DataTable => ({
  tableName: lt.tableName || undefined,
  columns: lt.columns,
  rows: lt.rows,
  centered: lt.centered || undefined,
  hideHeaders: lt.hideHeaders || undefined,
  verticalAlign: lt.verticalAlign !== "top" ? lt.verticalAlign : undefined
});

export function DataTableEditorModal({ open, onOpenChange, dataTable, onSave }: DataTableEditorModalProps) {
  const [localTable, setLocalTable] = useState<LocalDataTable>(dataTable ? normalizeToLocal(dataTable) : defaultTable);
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [compactionLevel, setCompactionLevel] = useState<0 | 1 | 2>(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (open && dataTable) {
      setLocalTable(normalizeToLocal(JSON.parse(JSON.stringify(dataTable))));
      setCompactionLevel(0);
    }
  }, [open, dataTable]);

  useLayoutEffect(() => {
    if (activeTab !== "preview") return;
    const container = tableContainerRef.current;
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
  }, [activeTab, compactionLevel, localTable]);

  const updateTableName = (name: string) => {
    setLocalTable(prev => ({ ...prev, tableName: name }));
  };

  const addColumn = () => {
    const newCol = { id: `col-${Date.now()}`, header: `Column${localTable.columns.length + 1}` };
    const updatedRows = localTable.rows.map(row => ({ 
      ...row, 
      cells: [...row.cells, ""] 
    }));
    setLocalTable(prev => ({ 
      ...prev, 
      columns: [...prev.columns, newCol], 
      rows: updatedRows 
    }));
  };

  const insertColumnAfter = (colIndex: number) => {
    const newCol = { id: `col-${Date.now()}`, header: `Column${localTable.columns.length + 1}` };
    const updatedCols = [...localTable.columns];
    updatedCols.splice(colIndex + 1, 0, newCol);
    const updatedRows = localTable.rows.map(row => {
      const newCells = [...row.cells];
      newCells.splice(colIndex + 1, 0, "");
      return { ...row, cells: newCells };
    });
    setLocalTable(prev => ({ 
      ...prev, 
      columns: updatedCols, 
      rows: updatedRows 
    }));
  };

  const removeColumn = (colIndex: number) => {
    if (localTable.columns.length <= 1) return;
    const updatedCols = localTable.columns.filter((_, i) => i !== colIndex);
    const updatedRows = localTable.rows.map(row => ({ 
      ...row, 
      cells: row.cells.filter((_, i) => i !== colIndex) 
    }));
    setLocalTable(prev => ({ 
      ...prev, 
      columns: updatedCols, 
      rows: updatedRows 
    }));
  };

  const updateColumnHeader = (colIndex: number, value: string) => {
    const updatedCols = [...localTable.columns];
    updatedCols[colIndex] = { ...updatedCols[colIndex], header: value };
    setLocalTable(prev => ({ ...prev, columns: updatedCols }));
  };

  const updateColumnWidth = (colIndex: number, value: string) => {
    const updatedCols = [...localTable.columns];
    updatedCols[colIndex] = { ...updatedCols[colIndex], width: value || undefined };
    setLocalTable(prev => ({ ...prev, columns: updatedCols }));
  };

  const autoResizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const addRow = () => {
    const newRow = { 
      id: `row-${Date.now()}`, 
      cells: localTable.columns.map(() => "") 
    };
    setLocalTable(prev => ({ 
      ...prev, 
      rows: [...prev.rows, newRow] 
    }));
  };

  const insertRowAfter = (rowIndex: number) => {
    const newRow = { 
      id: `row-${Date.now()}`, 
      cells: localTable.columns.map(() => "") 
    };
    const updatedRows = [...localTable.rows];
    updatedRows.splice(rowIndex + 1, 0, newRow);
    setLocalTable(prev => ({ 
      ...prev, 
      rows: updatedRows 
    }));
  };

  const removeRow = (rowIndex: number) => {
    if (localTable.rows.length <= 1) return;
    const updatedRows = localTable.rows.filter((_, i) => i !== rowIndex);
    setLocalTable(prev => ({ ...prev, rows: updatedRows }));
  };

  const updateCell = (rowIndex: number, cellIndex: number, value: string) => {
    const updatedRows = [...localTable.rows];
    const currentCell = updatedRows[rowIndex].cells[cellIndex];
    if (typeof currentCell === "object" && currentCell !== null) {
      updatedRows[rowIndex].cells[cellIndex] = { ...currentCell, value };
    } else {
      updatedRows[rowIndex].cells[cellIndex] = value;
    }
    setLocalTable(prev => ({ ...prev, rows: updatedRows }));
  };

  const handleSave = () => {
    onSave(normalizeToDataTable(localTable));
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Edit Data Table
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 overflow-auto mt-4 space-y-4">
            <div className="flex flex-wrap gap-6 items-end">
              <div className="space-y-2">
                <Label>Table Name</Label>
                <Input
                  value={localTable.tableName}
                  onChange={(e) => updateTableName(e.target.value)}
                  placeholder="Enter table name..."
                  className="max-w-md"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="centered-data"
                  checked={localTable.centered}
                  onChange={(e) => setLocalTable(prev => ({ ...prev, centered: e.target.checked }))}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <Label htmlFor="centered-data" className="cursor-pointer">Center data</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hide-headers"
                  checked={localTable.hideHeaders}
                  onChange={(e) => setLocalTable(prev => ({ ...prev, hideHeaders: e.target.checked }))}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <Label htmlFor="hide-headers" className="cursor-pointer">Hide headers</Label>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vertical Align</Label>
                <Select
                  value={localTable.verticalAlign}
                  onValueChange={(v: DataTableVerticalAlign) => setLocalTable(prev => ({ ...prev, verticalAlign: v }))}
                >
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-lg overflow-auto max-h-[50vh]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800 z-10">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold border-b border-r w-10">#</th>
                    {localTable.columns.map((col, colIndex) => (
                      <th key={col.id} className="px-2 py-2 border-b border-r min-w-[150px]" style={col.width ? { width: col.width } : undefined}>
                        <div className="flex items-center gap-1">
                          <Input
                            value={col.header}
                            onChange={(e) => updateColumnHeader(colIndex, e.target.value)}
                            className="h-7 text-sm font-semibold"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-blue-500 hover:text-blue-600 shrink-0"
                            onClick={() => insertColumnAfter(colIndex)}
                            title="Insert column after"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600 shrink-0"
                            onClick={() => removeColumn(colIndex)}
                            disabled={localTable.columns.length <= 1}
                            title="Delete column"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <Input
                          value={col.width || ""}
                          onChange={(e) => updateColumnWidth(colIndex, e.target.value)}
                          placeholder="auto"
                          className="h-6 text-xs mt-1 text-center text-neutral-500"
                          title="Column width (e.g. 200px, 30%, auto)"
                        />
                      </th>
                    ))}
                    <th className="px-2 py-2 border-b w-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={addColumn}
                        title="Add Column"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {localTable.rows.map((row, rowIndex) => (
                    <tr key={row.id} className="border-b last:border-b-0">
                      <td className={cn("px-2 py-1 border-r text-center text-neutral-500 text-xs", localTable.verticalAlign === "middle" ? "align-middle" : localTable.verticalAlign === "bottom" ? "align-bottom" : "align-top")}>
                        {rowIndex + 1}
                      </td>
                      {row.cells.map((cell, cellIndex) => {
                        const cellObj = typeof cell === "object" && cell !== null ? cell : null;
                        if (cellObj?.hidden) return null;
                        const colSpan = cellObj?.colSpan || 1;
                        const cellRole = getCellRole(cell);
                        const col = localTable.columns[cellIndex];
                        const constraint = col?.constraint;
                        const vAlignClass = localTable.verticalAlign === "middle" ? "align-middle" : localTable.verticalAlign === "bottom" ? "align-bottom" : "align-top";

                        return (
                          <td key={cellIndex} colSpan={colSpan} className={cn("px-1 py-1 border-r", vAlignClass)} style={col?.width ? { width: col.width } : undefined}>
                            {cellRole === "title" ? (
                              <Input
                                value={getCellValue(cell)}
                                onChange={(e) => updateCell(rowIndex, cellIndex, e.target.value)}
                                className="h-8 text-sm font-bold"
                                placeholder="Entity name..."
                              />
                            ) : constraint === "pk-fk" ? (
                              <select
                                value={getCellValue(cell)}
                                onChange={(e) => updateCell(rowIndex, cellIndex, e.target.value)}
                                className="h-8 w-full rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm text-center px-1"
                              >
                                <option value=""></option>
                                <option value="PK">PK</option>
                                <option value="FK">FK</option>
                              </select>
                            ) : constraint === "type" ? (
                              <select
                                value={getCellValue(cell)}
                                onChange={(e) => updateCell(rowIndex, cellIndex, e.target.value)}
                                className="h-8 w-full rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm text-center px-1"
                              >
                                <option value=""></option>
                                <option value="number">number</option>
                                <option value="text">text</option>
                                <option value="date">date</option>
                                <option value="time">time</option>
                                <option value="boolean">boolean</option>
                              </select>
                            ) : constraint === "y-n" ? (
                              <select
                                value={getCellValue(cell)}
                                onChange={(e) => updateCell(rowIndex, cellIndex, e.target.value)}
                                className="h-8 w-full rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm text-center px-1"
                              >
                                <option value=""></option>
                                <option value="Y">Y</option>
                                <option value="N">N</option>
                              </select>
                            ) : constraint === "number-only" ? (
                              <Input
                                value={getCellValue(cell)}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === "" || /^\d+$/.test(v)) updateCell(rowIndex, cellIndex, v);
                                }}
                                className="h-8 text-sm text-center"
                                placeholder=""
                                inputMode="numeric"
                              />
                            ) : (
                              <Textarea
                                ref={(el) => autoResizeTextarea(el)}
                                value={getCellValue(cell)}
                                onChange={(e) => { updateCell(rowIndex, cellIndex, e.target.value); autoResizeTextarea(e.target); }}
                                className="text-sm min-h-[32px] resize-none overflow-hidden"
                                rows={1}
                                placeholder="Cell value..."
                              />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-1 py-1">
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-blue-500 hover:text-blue-600"
                            onClick={() => insertRowAfter(rowIndex)}
                            title="Insert row below"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                            onClick={() => removeRow(rowIndex)}
                            disabled={localTable.rows.length <= 1}
                            title="Delete row"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-3 w-3 mr-1" /> Add Row
            </Button>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            {(() => {
              const cellPadding = compactionLevel >= 1 ? "px-2 py-1" : "px-4 py-2";
              const textSize = compactionLevel >= 2 ? "text-xs" : "text-sm";
              return (
                <div className="flex justify-center" ref={tableContainerRef}>
                  <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden inline-block max-w-full">
                    {localTable.tableName && localTable.tableName.trim() !== "" && (
                      <div className={cn("bg-neutral-200 dark:bg-neutral-700 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono", cellPadding, textSize)}>
                        {localTable.tableName}
                      </div>
                    )}
                    <table className={textSize} ref={tableRef}>
                      <thead>
                        <tr className="bg-neutral-100 dark:bg-neutral-800">
                          {localTable.columns.map((col) => (
                            <th key={col.id} className={cn(cellPadding, "font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0 break-words", col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left")} style={col.width ? { width: col.width } : undefined}>
                              {col.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {localTable.rows.map((row) => (
                          <tr key={row.id} className="border-t border-neutral-300 dark:border-neutral-700">
                            {row.cells.map((cell, cellIndex) => {
                              const cellRole = getCellRole(cell);
                              const CellTag = cellRole === "header" ? "th" : "td";
                              const vAlign = localTable.verticalAlign || "top";
                              const col = localTable.columns[cellIndex];
                              const colAlign = col?.align;
                              return (
                                <CellTag
                                  key={cellIndex}
                                  className={cn(
                                    cellPadding,
                                    "border-r border-neutral-300 dark:border-neutral-600 last:border-r-0 whitespace-pre-wrap",
                                    cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold",
                                    colAlign === "center" && "text-center",
                                    colAlign === "right" && "text-right",
                                    colAlign === "left" && "text-left",
                                    vAlign === "top" && "align-top",
                                    vAlign === "middle" && "align-middle",
                                    vAlign === "bottom" && "align-bottom"
                                  )}
                                  style={col?.width ? { width: col.width } : undefined}
                                >
                                  {getCellValue(cell)}
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
            })()}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
