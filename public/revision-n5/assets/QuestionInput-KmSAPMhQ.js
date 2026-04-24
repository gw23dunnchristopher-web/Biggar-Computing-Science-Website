import { j as jsxRuntimeExports, r as reactExports, X } from "./index-DZjJp9Jo.js";
import { T as Textarea } from "./textarea-DVZKhD5j.js";
import { I as Input } from "./input-BglVfhce.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { D as DiagramEditor } from "./diagram-editor-YPWk6RIh.js";
import { U as Upload, I as Image } from "./upload-BqUh_JkD.js";
import { C as CodeXml, F as FilePen } from "./file-pen-D6Iuyym7.js";
function handleTabKey(e, onChange, inputKey = "main") {
  if (e.key === "Tab") {
    e.preventDefault();
    const target = e.target;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const value = target.value;
    if (e.shiftKey) {
      if (value.substring(start - 2, start) === "  ") {
        const newValue = value.substring(0, start - 2) + value.substring(end);
        onChange(inputKey, newValue);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start - 2;
        }, 0);
      }
    } else {
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(inputKey, newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  }
}
function getRequirementBadge(req) {
  if (req === "programming-language") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900/50 w-fit mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CodeXml, { className: "w-4 h-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-wider", children: "Must Use: Programming Language" })
    ] });
  }
  if (req === "design-notation") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900/50 w-fit mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FilePen, { className: "w-4 h-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-wider", children: "Must Use: Design Notation" })
    ] });
  }
  return null;
}
function teacherTextPreserved(newValue, teacherText) {
  if (!teacherText) return true;
  const teacherLines = teacherText.split("\n");
  const newLines = newValue.split("\n");
  if (newLines.length < teacherLines.length) return false;
  for (let i = 0; i < teacherLines.length; i++) {
    if (!newLines[i].startsWith(teacherLines[i])) return false;
  }
  return true;
}
function renderQuestionInput(subQ, currentInput, onChange, onCodeKeyDown, onUpload, previewMode) {
  if (subQ.maxMarks === 0) return null;
  const mainInput = renderMainInput(subQ, currentInput, onChange, onCodeKeyDown, onUpload, previewMode);
  const allowedUploads = subQ.allowedFileUploads || [];
  if (allowedUploads.length === 0 || previewMode) {
    return mainInput;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    mainInput,
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FileUploadSection,
      {
        subQ,
        currentInput,
        onChange,
        onUpload,
        allowedTypes: allowedUploads
      }
    )
  ] });
}
function renderMainInput(subQ, currentInput, onChange, onCodeKeyDown, onUpload, previewMode) {
  if (subQ.inputStyle === "file-upload") {
    return null;
  }
  if (subQ.inputStyle === "screenshot-upload") {
    if (previewMode) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 min-h-[60px] border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-sm text-neutral-400", children: "Screenshot upload area" });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      ScreenshotUploadInput,
      {
        subQ,
        currentInput,
        onChange,
        onUpload
      }
    );
  }
  if (subQ.inputStyle === "code-editor") {
    const isProgrammingOnly = subQ.codeRequirement === "programming-language";
    const placeholderText = isProgrammingOnly ? "// Write your code here..." : "// Write your code or design notation here...";
    if (previewMode) {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 mt-4", children: [
        getRequirementBadge(subQ.codeRequirement),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-[60px] text-base font-mono p-4 bg-neutral-900 text-neutral-600 border border-neutral-800 rounded-md" })
      ] });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 mt-4", children: [
      getRequirementBadge(subQ.codeRequirement),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          placeholder: placeholderText,
          className: "min-h-[200px] text-base font-mono p-4 resize-y bg-neutral-900 text-neutral-100 border-neutral-800 focus:border-blue-800",
          value: currentInput["main"] || "",
          onChange: (e) => onChange("main", e.target.value),
          onKeyDown: (e) => {
            handleTabKey(e, onChange);
          },
          "data-testid": `input-code-${subQ.id}`
        }
      )
    ] });
  }
  if (subQ.inputStyle === "labeled-inputs" && subQ.inputConfig) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 mt-4 w-full", children: subQ.inputConfig.fields?.map((field, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-neutral-700 dark:text-neutral-300 shrink-0 whitespace-nowrap", children: field.label }),
      previewMode ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0 bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 text-sm min-h-[36px]" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          value: currentInput[field.key] || "",
          onChange: (e) => onChange(field.key, e.target.value),
          className: "flex-1 min-w-0 bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-blue-800 shadow-sm",
          "data-testid": `input-${field.key}-${subQ.id}`
        }
      )
    ] }, i)) });
  }
  if (subQ.inputStyle === "design-choice") {
    if (previewMode) {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-4 text-sm text-neutral-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Pseudocode / Structure Diagram" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-[60px] bg-neutral-900 border border-neutral-800 rounded-md p-4" })
      ] });
    }
    const activeMode = currentInput["design_mode"] || "pseudocode";
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "radio",
              name: `mode-${subQ.id}`,
              checked: activeMode === "pseudocode",
              onChange: () => onChange("design_mode", "pseudocode"),
              className: "w-4 h-4 text-red-600"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Pseudocode" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "radio",
              name: `mode-${subQ.id}`,
              checked: activeMode === "diagram",
              onChange: () => onChange("design_mode", "diagram"),
              className: "w-4 h-4 text-red-600"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Structure Diagram" })
        ] })
      ] }),
      activeMode === "pseudocode" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          placeholder: "Write your pseudocode here...",
          className: "min-h-[200px] text-base font-mono p-4 bg-neutral-900 text-neutral-100 border-neutral-800",
          value: currentInput["main"] || "",
          onChange: (e) => onChange("main", e.target.value),
          onKeyDown: (e) => handleTabKey(e, onChange)
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-[500px] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-visible bg-white dark:bg-neutral-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        DiagramEditor,
        {
          initialData: currentInput["drawing"],
          initialDrawing: currentInput["drawing_canvas"],
          onChange: (data, drawing) => {
            onChange("drawing", data);
            onChange("drawing_canvas", drawing);
          },
          backgroundUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
          mode: "structure-diagram"
        },
        `struct-diagram-${subQ.id}`
      ) })
    ] });
  }
  if (subQ.inputStyle === "drawing") {
    if (previewMode) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 min-h-[80px] border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-sm text-neutral-400", children: "Drawing / Diagram area" });
    }
    const questionText = subQ.questionText.toLowerCase();
    let diagramMode = "general";
    if (questionText.includes("entity") || questionText.includes("relationship") || questionText.includes("database") || questionText.includes("erd")) {
      diagramMode = "database";
    } else if (questionText.includes("user interface") || questionText.includes("wireframe") || questionText.includes("ui design") || questionText.includes("browser")) {
      diagramMode = "wireframe";
    }
    const useBackgroundUrl = diagramMode !== "database" ? subQ.drawingBackgroundUrl || subQ.imageUrl : void 0;
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 mt-4 min-h-[500px] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-visible bg-white dark:bg-neutral-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      DiagramEditor,
      {
        initialData: currentInput["drawing"],
        initialDrawing: currentInput["drawing_canvas"],
        onChange: (data, drawing) => {
          onChange("drawing", data);
          onChange("drawing_canvas", drawing);
        },
        backgroundUrl: useBackgroundUrl,
        mode: diagramMode
      },
      `drawing-${subQ.id}`
    ) });
  }
  if (subQ.inputStyle === "erd-annotation" && subQ.inputConfig?.baseErdDiagram) {
    if (previewMode) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 min-h-[80px] border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-sm text-neutral-400", children: "ERD Annotation area" });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 mt-4 min-h-[500px] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-visible bg-white dark:bg-neutral-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      DiagramEditor,
      {
        initialData: currentInput["erd_diagram"],
        initialDrawing: currentInput["erd_drawing"],
        baseDiagram: subQ.inputConfig.baseErdDiagram,
        onChange: (data, drawing) => {
          onChange("erd_diagram", data);
          onChange("erd_drawing", drawing);
        },
        backgroundUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
        mode: "erd-annotation"
      },
      `erd-${subQ.id}`
    ) });
  }
  if (subQ.inputStyle === "nav-structure") {
    if (previewMode) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 min-h-[80px] border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-sm text-neutral-400", children: "Navigation Structure area" });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 mt-4 min-h-[500px] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-visible bg-white dark:bg-neutral-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      DiagramEditor,
      {
        initialData: currentInput["drawing"],
        initialDrawing: currentInput["drawing_canvas"],
        baseDiagram: subQ.inputConfig?.baseNavDiagram,
        onChange: (data, drawing) => {
          onChange("drawing", data);
          onChange("drawing_canvas", drawing);
        },
        backgroundUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
        mode: "nav-structure"
      },
      `nav-${subQ.id}`
    ) });
  }
  if (subQ.inputStyle === "nav-structure-higher") {
    if (previewMode) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 min-h-[80px] border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-sm text-neutral-400", children: "Navigation Structure area" });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 mt-4 min-h-[500px] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-visible bg-white dark:bg-neutral-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      DiagramEditor,
      {
        initialData: currentInput["drawing"],
        initialDrawing: currentInput["drawing_canvas"],
        baseDiagram: subQ.inputConfig?.baseNavDiagram,
        onChange: (data, drawing) => {
          onChange("drawing", data);
          onChange("drawing_canvas", drawing);
        },
        backgroundUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
        mode: "nav-structure-higher"
      },
      `nav-higher-${subQ.id}`
    ) });
  }
  if (subQ.inputStyle === "structure-dataflow") {
    if (previewMode) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 min-h-[80px] border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-sm text-neutral-400", children: "Structure Dataflow area" });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 mt-4 min-h-[500px] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-visible bg-white dark:bg-neutral-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      DiagramEditor,
      {
        initialData: currentInput["drawing"],
        initialDrawing: currentInput["drawing_canvas"],
        baseDiagram: subQ.inputConfig?.baseStructureDiagram,
        onChange: (data, drawing) => {
          onChange("drawing", data);
          onChange("drawing_canvas", drawing);
        },
        backgroundUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
        mode: "structure-dataflow"
      },
      `dataflow-${subQ.id}`
    ) });
  }
  if (subQ.inputStyle === "form-wireframe") {
    if (previewMode) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 min-h-[80px] border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-sm text-neutral-400", children: "Form Wireframe area" });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      DiagramEditor,
      {
        initialData: currentInput["drawing"],
        initialDrawing: currentInput["drawing_canvas"],
        onChange: (dataStr, drawingStr) => {
          onChange("drawing", dataStr);
          onChange("drawing_canvas", drawingStr);
        },
        backgroundUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
        mode: "form-wireframe"
      }
    ) });
  }
  if (subQ.inputStyle === "webpage-wireframe") {
    if (previewMode) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 min-h-[80px] border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-sm text-neutral-400", children: "Webpage Wireframe area" });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      DiagramEditor,
      {
        initialData: currentInput["drawing"],
        initialDrawing: currentInput["drawing_canvas"],
        onChange: (dataStr, drawingStr) => {
          onChange("drawing", dataStr);
          onChange("drawing_canvas", drawingStr);
        },
        backgroundUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
        mode: "webpage-wireframe"
      }
    ) });
  }
  if (subQ.inputStyle === "table" && subQ.inputConfig) {
    const renderSingleGrid = (grid, gridIndex = 0) => {
      const colWidths = grid.colWidths || grid.headers.map(() => "auto");
      const rowMinHeights = grid.rowMinHeights || grid.rows.map(() => "auto");
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
        grid.title && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-neutral-900 dark:text-neutral-100 mb-1 text-sm", children: grid.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm border-collapse", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: grid.headers.map((header, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-medium border border-neutral-200 dark:border-neutral-700", style: { width: colWidths[i] !== "auto" ? colWidths[i] : void 0 }, children: header }, i)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: grid.rows.map((row, rowIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: row.cells.map((cell, cellIdx) => {
            const CellTag = cell.isHeading ? "th" : "td";
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              CellTag,
              {
                className: `px-4 py-3 align-top border border-neutral-200 dark:border-neutral-700 ${cell.isHeading ? "bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-700 dark:text-neutral-300" : cell.isInput ? "bg-white dark:bg-neutral-900" : "bg-neutral-50 dark:bg-neutral-800/50"}`,
                style: { minHeight: rowMinHeights[rowIdx] !== "auto" ? rowMinHeights[rowIdx] : void 0 },
                children: cell.isInput ? (() => {
                  const cellKey = cell.key || `cell_g${gridIndex}_${rowIdx}_${cellIdx}`;
                  const teacherValue = cell.value || "";
                  const cellValue = currentInput[cellKey] !== void 0 ? currentInput[cellKey] : teacherValue;
                  if (previewMode) {
                    return /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 text-sm whitespace-pre-wrap",
                        style: { minHeight: rowMinHeights[rowIdx] !== "auto" ? rowMinHeights[rowIdx] : "40px" },
                        children: teacherValue && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-700 dark:text-neutral-300", children: teacherValue })
                      }
                    );
                  }
                  const lineCount = Math.max((cellValue || teacherValue).split("\n").length, 3);
                  return /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Textarea,
                    {
                      placeholder: cell.placeholder || "Enter answer...",
                      value: cellValue,
                      onChange: (e) => {
                        const newVal = e.target.value;
                        if (teacherTextPreserved(newVal, teacherValue)) {
                          onChange(cellKey, newVal);
                        }
                      },
                      className: "bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-blue-800 shadow-sm resize-y",
                      style: { minHeight: rowMinHeights[rowIdx] !== "auto" ? rowMinHeights[rowIdx] : "60px" },
                      rows: lineCount
                    }
                  );
                })() : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap", children: cell.value || "" })
              },
              cellIdx
            );
          }) }, rowIdx)) })
        ] }) })
      ] }, gridIndex);
    };
    if (subQ.inputConfig.grids && Array.isArray(subQ.inputConfig.grids) && subQ.inputConfig.grids.length > 0) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: subQ.inputConfig.grids.map((grid, i) => renderSingleGrid(grid, i)) });
    }
    if (subQ.inputConfig.grid) {
      return renderSingleGrid(subQ.inputConfig.grid);
    }
    if (subQ.inputConfig.columns) {
      const numRows = subQ.inputConfig.inputRows || 1;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: subQ.inputConfig.columns.map((col, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-medium", style: col.width ? { width: col.width } : void 0, children: col.header }, i)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-neutral-200 dark:divide-neutral-700", children: Array.from({ length: numRows }).map((_, rowIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-white dark:bg-neutral-900", children: subQ.inputConfig.columns.map((col, colIdx) => {
          const key = numRows > 1 ? `${col.key}_${rowIdx + 1}` : col.key;
          return /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: previewMode ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 text-sm min-h-[36px]" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: `Enter ${col.header.toLowerCase()}...`,
              value: currentInput[key] || "",
              onChange: (e) => onChange(key, e.target.value),
              className: "bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-blue-800 shadow-sm"
            }
          ) }, colIdx);
        }) }, rowIdx)) })
      ] }) });
    }
    if (subQ.inputConfig.rows) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid w-full", style: { gridTemplateColumns: "max-content 1fr" }, children: subQ.inputConfig.rows.map((row, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 whitespace-nowrap border-b border-neutral-200 dark:border-neutral-700 flex items-center", children: row.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 flex items-center", children: row.isInput ? (() => {
          const teacherVal = row.value || "";
          const rowValue = currentInput[row.key] !== void 0 ? currentInput[row.key] : teacherVal;
          if (previewMode) {
            return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 text-sm min-h-[36px] whitespace-pre-wrap", children: teacherVal && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-700 dark:text-neutral-300", children: teacherVal }) });
          }
          const handleRowChange = (newVal) => {
            if (teacherTextPreserved(newVal, teacherVal)) {
              onChange(row.key, newVal);
            }
          };
          return row.multiline ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              placeholder: "Enter answer...",
              value: rowValue,
              onChange: (e) => handleRowChange(e.target.value),
              className: "w-full min-h-[100px] bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-blue-800 shadow-sm resize-y",
              rows: Math.max((rowValue || teacherVal).split("\n").length, 3)
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: "Enter answer...",
              value: rowValue,
              onChange: (e) => handleRowChange(e.target.value),
              className: "w-full bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-blue-800 shadow-sm"
            }
          );
        })() : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-700 dark:text-neutral-300", children: row.value || "" }) })
      ] }, i)) }) });
    }
  }
  if (previewMode) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 text-sm min-h-[40px]" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Textarea,
    {
      placeholder: "Type your answer here...",
      className: "min-h-[100px]",
      value: currentInput["main"] || "",
      onChange: (e) => onChange("main", e.target.value),
      onKeyDown: (e) => {
        handleTabKey(e, onChange);
      },
      "data-testid": `input-text-${subQ.id}`
    }
  );
}
function FileUploadSection({ subQ, currentInput, onChange, onUpload, allowedTypes }) {
  const fileInputRef = reactExports.useRef(null);
  const dropZoneRef = reactExports.useRef(null);
  const [uploading, setUploading] = reactExports.useState(false);
  const [isDragging, setIsDragging] = reactExports.useState(false);
  allowedTypes.some((t) => ["py", "html", "css"].includes(t));
  const hasScreenshot = allowedTypes.includes("screenshot");
  const codeExtensions = allowedTypes.filter((t) => ["py", "html", "css"].includes(t)).flatMap((t) => t === "py" ? [".py"] : t === "html" ? [".html", ".htm"] : [".css"]);
  const allAccept = [
    ...codeExtensions,
    ...hasScreenshot ? ["image/*"] : []
  ].join(",");
  const typeLabels = allowedTypes.map((t) => t === "py" ? ".py" : t === "html" ? ".html" : t === "css" ? ".css" : "image").join(", ");
  const maxFiles = subQ.inputConfig?.maxFiles || 5;
  const maxFileSizeBytes = (subQ.inputConfig?.maxFileSizeKB || 500) * 1024;
  const isAllowedFile = (file) => {
    if (file.type.startsWith("image/") && hasScreenshot) return true;
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    return codeExtensions.includes(ext);
  };
  const handleFile = async (file) => {
    if (!isAllowedFile(file)) return;
    if (file.size > maxFileSizeBytes) return;
    const existing = currentInput["uploaded_files"] ? JSON.parse(currentInput["uploaded_files"]) : [];
    if (existing.length >= maxFiles) return;
    if (file.type.startsWith("image/") && hasScreenshot) {
      await handleImageFile(file);
    } else {
      await handleCodeFile(file);
    }
  };
  const handleCodeFile = async (file) => {
    const text = await file.text();
    const existing = currentInput["uploaded_files"] ? JSON.parse(currentInput["uploaded_files"]) : [];
    existing.push({ name: file.name, content: text, type: "code" });
    onChange("uploaded_files", JSON.stringify(existing));
  };
  const handleImageFile = async (file) => {
    if (!onUpload) return;
    setUploading(true);
    try {
      const url = await onUpload(file);
      const existing = currentInput["uploaded_files"] ? JSON.parse(currentInput["uploaded_files"]) : [];
      existing.push({ name: file.name, url, type: "screenshot" });
      onChange("uploaded_files", JSON.stringify(existing));
    } finally {
      setUploading(false);
    }
  };
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await handleFile(file);
    }
  };
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          await handleFile(file);
        }
      }
    }
  };
  let uploadedFiles = [];
  try {
    if (currentInput["uploaded_files"]) {
      uploadedFiles = JSON.parse(currentInput["uploaded_files"]);
    }
  } catch {
  }
  const removeFile = (index) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    onChange("uploaded_files", updated.length > 0 ? JSON.stringify(updated) : "");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: dropZoneRef,
      onDragOver: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      },
      onDragEnter: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      },
      onDragLeave: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      },
      onDrop: handleDrop,
      onPaste: handlePaste,
      tabIndex: 0,
      className: `border-2 border-dashed rounded-lg p-4 transition-colors outline-none ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/30 hover:border-neutral-400 dark:hover:border-neutral-500"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4 text-neutral-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "File Uploads" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-500", children: [
            "(",
            typeLabels,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            ref: fileInputRef,
            type: "file",
            accept: allAccept,
            multiple: true,
            className: "hidden",
            onChange: async (e) => {
              const files = Array.from(e.target.files || []);
              for (const file of files) {
                await handleFile(file);
              }
              e.target.value = "";
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 dark:text-neutral-400 mb-2", children: isDragging ? "Drop files here" : "Drag and drop files here, paste screenshots (Ctrl+V), or" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: () => fileInputRef.current?.click(),
              disabled: uploading,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3 w-3 mr-1" }),
                uploading ? "Uploading..." : "Choose Files"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-neutral-400 mt-2", children: [
            "Accepts: ",
            typeLabels,
            " | Max ",
            maxFiles,
            " file",
            maxFiles !== 1 ? "s" : "",
            ", up to ",
            subQ.inputConfig?.maxFileSizeKB || 500,
            "KB each"
          ] })
        ] }),
        uploadedFiles.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 mt-3 border-t border-neutral-200 dark:border-neutral-700 pt-3", children: uploadedFiles.map((file, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 bg-white dark:bg-neutral-900 border rounded px-3 py-2", children: [
          file.type === "screenshot" && file.url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: file.url, alt: file.name, className: "h-10 w-10 object-cover rounded" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CodeXml, { className: "h-4 w-4 text-green-600 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm flex-1 truncate", children: file.name }),
          file.type === "code" && file.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-500", children: [
            file.content.split("\n").length,
            " lines"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => removeFile(i), className: "text-red-600 hover:text-red-700 h-6 w-6 p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }) })
        ] }, i)) })
      ]
    }
  );
}
function ScreenshotUploadInput({ subQ, currentInput, onChange, onUpload }) {
  const fileInputRef = reactExports.useRef(null);
  const [uploading, setUploading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const maxFiles = subQ.inputConfig?.maxScreenshots || 5;
  const instructions = subQ.inputConfig?.screenshotInstructions || "Upload screenshots or documents of your practical work";
  const getFileTypeFromUrl = (url) => {
    const ext = url.split(".").pop()?.toLowerCase() || "";
    const docExtensions = ["pdf", "doc", "docx", "ppt", "pptx"];
    return docExtensions.includes(ext) ? "document" : "image";
  };
  const getFileNameFromUrl = (url) => {
    return url.split("/").pop() || "File";
  };
  let uploadedFiles = [];
  try {
    const fileData = currentInput["screenshots"];
    if (fileData && fileData.trim()) {
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed)) {
        uploadedFiles = parsed.map((item) => {
          if (typeof item === "string") {
            return {
              url: item,
              type: getFileTypeFromUrl(item),
              name: getFileNameFromUrl(item)
            };
          }
          return item;
        });
      }
    }
  } catch {
    uploadedFiles = [];
  }
  const isImageFile = (file) => file.type.startsWith("image/");
  const isDocumentFile = (file) => {
    const docTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];
    return docTypes.includes(file.type);
  };
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const newFiles = [];
      for (let i = 0; i < files.length; i++) {
        if (uploadedFiles.length + newFiles.length >= maxFiles) {
          setError(`Maximum ${maxFiles} files allowed`);
          break;
        }
        const file = files[i];
        if (!isImageFile(file) && !isDocumentFile(file)) {
          setError("Please select image or document files (PDF, Word, PowerPoint)");
          continue;
        }
        if (onUpload) {
          const url = await onUpload(file);
          newFiles.push({
            url,
            type: isImageFile(file) ? "image" : "document",
            name: file.name
          });
        }
      }
      if (newFiles.length > 0) {
        const allFiles = [...uploadedFiles, ...newFiles];
        onChange("screenshots", JSON.stringify(allFiles));
      }
    } catch (err) {
      setError("Failed to upload file");
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  const removeFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    onChange("screenshots", JSON.stringify(newFiles));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mt-4", "data-testid": `input-screenshot-${subQ.id}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-600 dark:text-neutral-400", children: instructions }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4", children: [
      uploadedFiles.map((file, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
        file.type === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: file.url,
            alt: `Screenshot ${idx + 1}`,
            className: "w-full h-32 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-32 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex flex-col items-center justify-center gap-2 p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "w-8 h-8 text-neutral-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-600 dark:text-neutral-400 text-center truncate w-full px-2", children: file.name || "Document" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => removeFile(idx),
            className: "absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
            type: "button",
            "data-testid": `button-remove-file-${idx}`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
          }
        )
      ] }, idx)),
      uploadedFiles.length < maxFiles && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => fileInputRef.current?.click(),
          disabled: uploading,
          className: "h-32 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors disabled:opacity-50",
          type: "button",
          "data-testid": "button-add-file",
          children: uploading ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-neutral-500", children: "Uploading..." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "w-6 h-6 text-neutral-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-neutral-500 text-center px-2", children: "Add Image or Document" })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: "image/*,.pdf,.doc,.docx,.ppt,.pptx",
        onChange: handleFileSelect,
        className: "hidden",
        multiple: true,
        "data-testid": "input-file-upload"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-neutral-500", children: [
      uploadedFiles.length,
      "/",
      maxFiles,
      " files uploaded (images, PDF, Word, PowerPoint)"
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-500", children: error })
  ] });
}
export {
  handleTabKey as h,
  renderQuestionInput as r
};
//# sourceMappingURL=QuestionInput-KmSAPMhQ.js.map
