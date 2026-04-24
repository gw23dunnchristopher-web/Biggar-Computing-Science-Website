import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, E as Eye, g as cn } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { I as Input } from "./input-BglVfhce.js";
import { T as Textarea } from "./textarea-DVZKhD5j.js";
import { L as Label } from "./label-DXOWQ5Is.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, e as DialogFooter } from "./dialog-DTiCktmM.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CtGyirbS.js";
import { a as Select, b as SelectTrigger, c as SelectValue, d as SelectContent, e as SelectItem } from "./select-BoXHqBzp.js";
import { A as ArrowRight } from "./arrow-right-BGWMDShP.js";
import { T as Trash2 } from "./trash-2-bLg5w6uM.js";
import { P as Plus } from "./plus-Bl_GJopp.js";
import { a as ArrowDown, T as TextAlignStart, b as TextAlignCenter, c as TextAlignEnd } from "./diagram-editor-YPWk6RIh.js";
import { C as Code } from "./code-CkVOXEbl.js";
import { L as List } from "./list-CSQ5KgpQ.js";
const __iconNode$3 = [
  [
    "path",
    { d: "M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8", key: "mg9rjx" }
  ]
];
const Bold = createLucideIcon("bold", __iconNode$3);
const __iconNode$2 = [
  ["line", { x1: "19", x2: "10", y1: "4", y2: "4", key: "15jd3p" }],
  ["line", { x1: "14", x2: "5", y1: "20", y2: "20", key: "bu0au3" }],
  ["line", { x1: "15", x2: "9", y1: "4", y2: "20", key: "uljnxc" }]
];
const Italic = createLucideIcon("italic", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "m4 19 8-8", key: "hr47gm" }],
  ["path", { d: "m12 19-8-8", key: "1dhhmo" }],
  [
    "path",
    {
      d: "M20 12h-4c0-1.5.442-2 1.5-2.5S20 8.334 20 7.002c0-.472-.17-.93-.484-1.29a2.105 2.105 0 0 0-2.617-.436c-.42.239-.738.614-.899 1.06",
      key: "1dfcux"
    }
  ]
];
const Superscript = createLucideIcon("superscript", __iconNode$1);
const __iconNode = [
  ["path", { d: "M12 3v18", key: "108xh3" }],
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
  ["path", { d: "M3 9h18", key: "1pudct" }],
  ["path", { d: "M3 15h18", key: "5xshup" }]
];
const Table = createLucideIcon("table", __iconNode);
const getCellValue = (cell) => {
  if (typeof cell === "string") return cell;
  if (cell && typeof cell === "object" && "value" in cell) return cell.value || "";
  return String(cell || "");
};
const getCellRole = (cell) => {
  if (typeof cell === "object" && cell !== null && "role" in cell) return cell.role || "data";
  return "data";
};
const defaultTable = {
  tableName: "",
  columns: [{ id: "col-1", header: "Column1" }],
  rows: [{ id: "row-1", cells: [""] }],
  centered: false,
  hideHeaders: false,
  verticalAlign: "top"
};
const normalizeToLocal = (dt) => ({
  tableName: dt.tableName || "",
  columns: dt.columns,
  rows: dt.rows,
  centered: dt.centered || false,
  hideHeaders: dt.hideHeaders || false,
  verticalAlign: dt.verticalAlign || "top"
});
const normalizeToDataTable = (lt) => ({
  tableName: lt.tableName || void 0,
  columns: lt.columns,
  rows: lt.rows,
  centered: lt.centered || void 0,
  hideHeaders: lt.hideHeaders || void 0,
  verticalAlign: lt.verticalAlign !== "top" ? lt.verticalAlign : void 0
});
function DataTableEditorModal({ open, onOpenChange, dataTable, onSave }) {
  const [localTable, setLocalTable] = reactExports.useState(dataTable ? normalizeToLocal(dataTable) : defaultTable);
  const [activeTab, setActiveTab] = reactExports.useState("edit");
  const [compactionLevel, setCompactionLevel] = reactExports.useState(0);
  const tableContainerRef = reactExports.useRef(null);
  const tableRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (open && dataTable) {
      setLocalTable(normalizeToLocal(JSON.parse(JSON.stringify(dataTable))));
      setCompactionLevel(0);
    }
  }, [open, dataTable]);
  reactExports.useLayoutEffect(() => {
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
        setCompactionLevel((prev) => Math.min(prev + 1, 2));
      }
    });
  }, [activeTab, compactionLevel, localTable]);
  const updateTableName = (name) => {
    setLocalTable((prev) => ({ ...prev, tableName: name }));
  };
  const addColumn = () => {
    const newCol = { id: `col-${Date.now()}`, header: `Column${localTable.columns.length + 1}` };
    const updatedRows = localTable.rows.map((row) => ({
      ...row,
      cells: [...row.cells, ""]
    }));
    setLocalTable((prev) => ({
      ...prev,
      columns: [...prev.columns, newCol],
      rows: updatedRows
    }));
  };
  const insertColumnAfter = (colIndex) => {
    const newCol = { id: `col-${Date.now()}`, header: `Column${localTable.columns.length + 1}` };
    const updatedCols = [...localTable.columns];
    updatedCols.splice(colIndex + 1, 0, newCol);
    const updatedRows = localTable.rows.map((row) => {
      const newCells = [...row.cells];
      newCells.splice(colIndex + 1, 0, "");
      return { ...row, cells: newCells };
    });
    setLocalTable((prev) => ({
      ...prev,
      columns: updatedCols,
      rows: updatedRows
    }));
  };
  const removeColumn = (colIndex) => {
    if (localTable.columns.length <= 1) return;
    const updatedCols = localTable.columns.filter((_, i) => i !== colIndex);
    const updatedRows = localTable.rows.map((row) => ({
      ...row,
      cells: row.cells.filter((_, i) => i !== colIndex)
    }));
    setLocalTable((prev) => ({
      ...prev,
      columns: updatedCols,
      rows: updatedRows
    }));
  };
  const updateColumnHeader = (colIndex, value) => {
    const updatedCols = [...localTable.columns];
    updatedCols[colIndex] = { ...updatedCols[colIndex], header: value };
    setLocalTable((prev) => ({ ...prev, columns: updatedCols }));
  };
  const updateColumnWidth = (colIndex, value) => {
    const updatedCols = [...localTable.columns];
    updatedCols[colIndex] = { ...updatedCols[colIndex], width: value || void 0 };
    setLocalTable((prev) => ({ ...prev, columns: updatedCols }));
  };
  const autoResizeTextarea = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };
  const addRow = () => {
    const newRow = {
      id: `row-${Date.now()}`,
      cells: localTable.columns.map(() => "")
    };
    setLocalTable((prev) => ({
      ...prev,
      rows: [...prev.rows, newRow]
    }));
  };
  const insertRowAfter = (rowIndex) => {
    const newRow = {
      id: `row-${Date.now()}`,
      cells: localTable.columns.map(() => "")
    };
    const updatedRows = [...localTable.rows];
    updatedRows.splice(rowIndex + 1, 0, newRow);
    setLocalTable((prev) => ({
      ...prev,
      rows: updatedRows
    }));
  };
  const removeRow = (rowIndex) => {
    if (localTable.rows.length <= 1) return;
    const updatedRows = localTable.rows.filter((_, i) => i !== rowIndex);
    setLocalTable((prev) => ({ ...prev, rows: updatedRows }));
  };
  const updateCell = (rowIndex, cellIndex, value) => {
    const updatedRows = [...localTable.rows];
    const currentCell = updatedRows[rowIndex].cells[cellIndex];
    if (typeof currentCell === "object" && currentCell !== null) {
      updatedRows[rowIndex].cells[cellIndex] = { ...currentCell, value };
    } else {
      updatedRows[rowIndex].cells[cellIndex] = value;
    }
    setLocalTable((prev) => ({ ...prev, rows: updatedRows }));
  };
  const handleSave = () => {
    onSave(normalizeToDataTable(localTable));
    onOpenChange(false);
  };
  const handleCancel = () => {
    onOpenChange(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-hidden flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "h-5 w-5" }),
      "Edit Data Table"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "flex-1 overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "edit", children: "Edit" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "preview", className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }),
          " Preview"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "edit", className: "flex-1 overflow-auto mt-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-6 items-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Table Name" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: localTable.tableName,
                onChange: (e) => updateTableName(e.target.value),
                placeholder: "Enter table name...",
                className: "max-w-md"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                id: "centered-data",
                checked: localTable.centered,
                onChange: (e) => setLocalTable((prev) => ({ ...prev, centered: e.target.checked })),
                className: "h-4 w-4 rounded border-neutral-300"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "centered-data", className: "cursor-pointer", children: "Center data" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                id: "hide-headers",
                checked: localTable.hideHeaders,
                onChange: (e) => setLocalTable((prev) => ({ ...prev, hideHeaders: e.target.checked })),
                className: "h-4 w-4 rounded border-neutral-300"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "hide-headers", className: "cursor-pointer", children: "Hide headers" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Vertical Align" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: localTable.verticalAlign,
                onValueChange: (v) => setLocalTable((prev) => ({ ...prev, verticalAlign: v })),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 w-28 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "top", children: "Top" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "middle", children: "Middle" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "bottom", children: "Bottom" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-lg overflow-auto max-h-[50vh]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 bg-neutral-100 dark:bg-neutral-800 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-2 py-2 text-left font-semibold border-b border-r w-10", children: "#" }),
            localTable.columns.map((col, colIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("th", { className: "px-2 py-2 border-b border-r min-w-[150px]", style: col.width ? { width: col.width } : void 0, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: col.header,
                    onChange: (e) => updateColumnHeader(colIndex, e.target.value),
                    className: "h-7 text-sm font-semibold"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    className: "h-6 w-6 p-0 text-blue-500 hover:text-blue-600 shrink-0",
                    onClick: () => insertColumnAfter(colIndex),
                    title: "Insert column after",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    className: "h-6 w-6 p-0 text-red-500 hover:text-red-600 shrink-0",
                    onClick: () => removeColumn(colIndex),
                    disabled: localTable.columns.length <= 1,
                    title: "Delete column",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: col.width || "",
                  onChange: (e) => updateColumnWidth(colIndex, e.target.value),
                  placeholder: "auto",
                  className: "h-6 text-xs mt-1 text-center text-neutral-500",
                  title: "Column width (e.g. 200px, 30%, auto)"
                }
              )
            ] }, col.id)),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-2 py-2 border-b w-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                className: "h-7 w-7 p-0",
                onClick: addColumn,
                title: "Add Column",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" })
              }
            ) })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: localTable.rows.map((row, rowIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b last:border-b-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: cn("px-2 py-1 border-r text-center text-neutral-500 text-xs", localTable.verticalAlign === "middle" ? "align-middle" : localTable.verticalAlign === "bottom" ? "align-bottom" : "align-top"), children: rowIndex + 1 }),
            row.cells.map((cell, cellIndex) => {
              const cellObj = typeof cell === "object" && cell !== null ? cell : null;
              if (cellObj?.hidden) return null;
              const colSpan = cellObj?.colSpan || 1;
              const cellRole = getCellRole(cell);
              const col = localTable.columns[cellIndex];
              const constraint = col?.constraint;
              const vAlignClass = localTable.verticalAlign === "middle" ? "align-middle" : localTable.verticalAlign === "bottom" ? "align-bottom" : "align-top";
              return /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan, className: cn("px-1 py-1 border-r", vAlignClass), style: col?.width ? { width: col.width } : void 0, children: cellRole === "title" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: getCellValue(cell),
                  onChange: (e) => updateCell(rowIndex, cellIndex, e.target.value),
                  className: "h-8 text-sm font-bold",
                  placeholder: "Entity name..."
                }
              ) : constraint === "pk-fk" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: getCellValue(cell),
                  onChange: (e) => updateCell(rowIndex, cellIndex, e.target.value),
                  className: "h-8 w-full rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm text-center px-1",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "PK", children: "PK" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "FK", children: "FK" })
                  ]
                }
              ) : constraint === "type" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: getCellValue(cell),
                  onChange: (e) => updateCell(rowIndex, cellIndex, e.target.value),
                  className: "h-8 w-full rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm text-center px-1",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "number", children: "number" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "text", children: "text" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "date", children: "date" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "time", children: "time" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "boolean", children: "boolean" })
                  ]
                }
              ) : constraint === "y-n" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: getCellValue(cell),
                  onChange: (e) => updateCell(rowIndex, cellIndex, e.target.value),
                  className: "h-8 w-full rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm text-center px-1",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "Y", children: "Y" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "N", children: "N" })
                  ]
                }
              ) : constraint === "number-only" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: getCellValue(cell),
                  onChange: (e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d+$/.test(v)) updateCell(rowIndex, cellIndex, v);
                  },
                  className: "h-8 text-sm text-center",
                  placeholder: "",
                  inputMode: "numeric"
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  ref: (el) => autoResizeTextarea(el),
                  value: getCellValue(cell),
                  onChange: (e) => {
                    updateCell(rowIndex, cellIndex, e.target.value);
                    autoResizeTextarea(e.target);
                  },
                  className: "text-sm min-h-[32px] resize-none overflow-hidden",
                  rows: 1,
                  placeholder: "Cell value..."
                }
              ) }, cellIndex);
            }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-1 py-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  className: "h-6 w-6 p-0 text-blue-500 hover:text-blue-600",
                  onClick: () => insertRowAfter(rowIndex),
                  title: "Insert row below",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { className: "h-3 w-3" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  className: "h-6 w-6 p-0 text-red-500 hover:text-red-600",
                  onClick: () => removeRow(rowIndex),
                  disabled: localTable.rows.length <= 1,
                  title: "Delete row",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" })
                }
              )
            ] }) })
          ] }, row.id)) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: addRow, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 mr-1" }),
          " Add Row"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "preview", className: "flex-1 overflow-auto mt-4", children: (() => {
        const cellPadding = compactionLevel >= 1 ? "px-2 py-1" : "px-4 py-2";
        const textSize = compactionLevel >= 2 ? "text-xs" : "text-sm";
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", ref: tableContainerRef, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden inline-block max-w-full", children: [
          localTable.tableName && localTable.tableName.trim() !== "" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("bg-neutral-200 dark:bg-neutral-700 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono", cellPadding, textSize), children: localTable.tableName }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: textSize, ref: tableRef, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: localTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: cn(cellPadding, "font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0 break-words", col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"), style: col.width ? { width: col.width } : void 0, children: col.header }, col.id)) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: localTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-neutral-300 dark:border-neutral-700", children: row.cells.map((cell, cellIndex) => {
              const cellRole = getCellRole(cell);
              const CellTag = cellRole === "header" ? "th" : "td";
              const vAlign = localTable.verticalAlign || "top";
              const col = localTable.columns[cellIndex];
              const colAlign = col?.align;
              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                CellTag,
                {
                  className: cn(
                    cellPadding,
                    "border-r border-neutral-300 dark:border-neutral-600 last:border-r-0 whitespace-pre-wrap",
                    cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold",
                    colAlign === "center" && "text-center",
                    colAlign === "right" && "text-right",
                    colAlign === "left" && "text-left",
                    vAlign === "top" && "align-top",
                    vAlign === "middle" && "align-middle",
                    vAlign === "bottom" && "align-bottom"
                  ),
                  style: col?.width ? { width: col.width } : void 0,
                  children: getCellValue(cell)
                },
                cellIndex
              );
            }) }, row.id)) })
          ] })
        ] }) });
      })() })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "mt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: handleCancel, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSave, children: "Save Changes" })
    ] })
  ] }) });
}
function RichTextEditor({ value, onChange, placeholder, rows = 3, className = "" }) {
  const textareaRef = reactExports.useRef(null);
  const [selectionStart, setSelectionStart] = reactExports.useState(0);
  const [selectionEnd, setSelectionEnd] = reactExports.useState(0);
  const autoResize = reactExports.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }, []);
  reactExports.useEffect(() => {
    autoResize();
  }, [value, autoResize]);
  const handleSelect = () => {
    if (textareaRef.current) {
      setSelectionStart(textareaRef.current.selectionStart);
      setSelectionEnd(textareaRef.current.selectionEnd);
    }
  };
  const wrapSelection = (prefix, suffix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = selectionStart;
    const end = selectionEnd;
    const text = value;
    if (start === end) {
      const newText = text.slice(0, start) + prefix + suffix + text.slice(end);
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }, 0);
    } else {
      const selectedText = text.slice(start, end);
      const newText = text.slice(0, start) + prefix + selectedText + suffix + text.slice(end);
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        const newStart = start + prefix.length;
        const newEnd = end + prefix.length;
        textarea.setSelectionRange(newStart, newEnd);
      }, 0);
    }
  };
  const handleButtonMouseDown = (e, action) => {
    e.preventDefault();
    action();
  };
  const applyBold = () => wrapSelection("**", "**");
  const applyItalic = () => wrapSelection("*", "*");
  const applyMonospace = () => wrapSelection("`", "`");
  const applySuperscript = () => wrapSelection("^", "^");
  const applyAlignment = (align) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const lines = value.split("\n");
    const beforeCursor = value.slice(0, selectionStart);
    const lineIndex = beforeCursor.split("\n").length - 1;
    const alignmentPrefixes = ["[left]", "[center]", "[right]"];
    let currentLine = lines[lineIndex];
    for (const prefix of alignmentPrefixes) {
      if (currentLine.startsWith(prefix)) {
        currentLine = currentLine.slice(prefix.length);
        break;
      }
    }
    lines[lineIndex] = align === "left" ? currentLine : `[${align}]${currentLine}`;
    onChange(lines.join("\n"));
  };
  const toggleBullet = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const lines = value.split("\n");
    const beforeCursor = value.slice(0, selectionStart);
    const startLineIndex = beforeCursor.split("\n").length - 1;
    const beforeEnd = value.slice(0, selectionEnd);
    const endLineIndex = beforeEnd.split("\n").length - 1;
    for (let i = startLineIndex; i <= endLineIndex; i++) {
      if (lines[i].startsWith("• ")) {
        lines[i] = lines[i].slice(2);
      } else {
        lines[i] = "• " + lines[i];
      }
    }
    onChange(lines.join("\n"));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `border rounded-md overflow-hidden ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 border-b flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          className: "h-7 w-7 p-0",
          onMouseDown: (e) => handleButtonMouseDown(e, applyBold),
          title: "Bold",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bold, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          className: "h-7 w-7 p-0",
          onMouseDown: (e) => handleButtonMouseDown(e, applyItalic),
          title: "Italic",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Italic, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          className: "h-7 w-7 p-0",
          onMouseDown: (e) => handleButtonMouseDown(e, applyMonospace),
          title: "Courier New / Monospace",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          className: "h-7 w-7 p-0",
          onMouseDown: (e) => handleButtonMouseDown(e, applySuperscript),
          title: "Superscript",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Superscript, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          className: "h-7 w-7 p-0",
          onMouseDown: (e) => handleButtonMouseDown(e, toggleBullet),
          title: "Bullet Point",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          className: "h-7 w-7 p-0",
          onMouseDown: (e) => handleButtonMouseDown(e, () => applyAlignment("left")),
          title: "Align Left",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignStart, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          className: "h-7 w-7 p-0",
          onMouseDown: (e) => handleButtonMouseDown(e, () => applyAlignment("center")),
          title: "Align Center",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignCenter, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          className: "h-7 w-7 p-0",
          onMouseDown: (e) => handleButtonMouseDown(e, () => applyAlignment("right")),
          title: "Align Right",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignEnd, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-400 ml-2", children: "Select text then click to format" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        ref: textareaRef,
        value,
        onChange: (e) => onChange(e.target.value),
        onSelect: handleSelect,
        onKeyUp: handleSelect,
        onClick: handleSelect,
        placeholder,
        rows,
        className: "w-full px-3 py-2 text-sm resize-vertical focus:outline-none bg-white dark:bg-neutral-950 dark:text-neutral-100 overflow-hidden",
        style: { minHeight: "1.5em" }
      }
    )
  ] });
}
function RichTextDisplay({ content, className = "" }) {
  if (!content) return null;
  const parseContent = (text) => {
    const parts = [];
    let remaining = text;
    let key = 0;
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push(/* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: parseContent(boldMatch[1]) }, key++));
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }
      const italicMatch = remaining.match(/^\*([^*]+?)\*/);
      if (italicMatch) {
        parts.push(/* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: parseContent(italicMatch[1]) }, key++));
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }
      const codeMatch = remaining.match(/^`([^`]+?)`/);
      if (codeMatch) {
        parts.push(
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded", children: codeMatch[1] }, key++)
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }
      const supMatch = remaining.match(/^\^([^^]+?)\^/);
      if (supMatch) {
        parts.push(/* @__PURE__ */ jsxRuntimeExports.jsx("sup", { children: parseContent(supMatch[1]) }, key++));
        remaining = remaining.slice(supMatch[0].length);
        continue;
      }
      const nextSpecial = remaining.search(/\*\*|\*|`|\^/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }
    return parts;
  };
  const lines = content.split("\n");
  const groups = [];
  for (const line of lines) {
    if (line.startsWith("• ")) {
      const last = groups[groups.length - 1];
      if (last && last.type === "bullet") {
        last.items.push(line.slice(2));
      } else {
        groups.push({ type: "bullet", items: [line.slice(2)] });
      }
    } else {
      let alignment = "text-left";
      let lineContent = line;
      if (line.startsWith("[center]")) {
        alignment = "text-center";
        lineContent = line.slice(8);
      } else if (line.startsWith("[right]")) {
        alignment = "text-right";
        lineContent = line.slice(7);
      } else if (line.startsWith("[left]")) {
        lineContent = line.slice(6);
      }
      groups.push({ type: "text", line: lineContent, alignment });
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className, children: groups.map((group, i) => {
    if (group.type === "bullet") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "list-disc pl-5 mb-2 space-y-0.5", children: group.items.map((item, j) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: parseContent(item) }, j)) }, i);
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `${group.alignment} ${i < groups.length - 1 ? "mb-2" : ""}`, children: group.line ? parseContent(group.line) : /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}) }, i);
  }) });
}
export {
  Bold as B,
  DataTableEditorModal as D,
  Italic as I,
  RichTextEditor as R,
  Table as T,
  RichTextDisplay as a
};
//# sourceMappingURL=rich-text-editor-BgZyQsfw.js.map
