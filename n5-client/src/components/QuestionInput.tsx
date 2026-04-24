import { Fragment, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DiagramImageInput, DIAGRAM_HINTS } from "@/components/ui/diagram-image-input";
import { Code2, FileEdit, Upload, X, Image as ImageIcon } from "lucide-react";

export function handleTabKey(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  onChange: (key: string, val: string) => void,
  inputKey: string = "main"
) {
  if (e.key === "Tab") {
    e.preventDefault();
    const target = e.target as HTMLTextAreaElement;
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

export interface SubQuestion {
  id: string;
  questionText: string;
  contentBlocks?: Array<{
    id: string;
    type: string;
    content: string;
    caption?: string;
    imageSize?: string;
    dataTable?: any;
    pseudocodeLines?: Array<{ id: string; lineLabel: string; content: string }>;
  }>;
  maxMarks: number;
  inputStyle?: string;
  inputConfig?: {
    fields?: { key: string; label: string }[];
    columns?: { key: string; header: string; width?: string }[];
    rows?: { key?: string; label: string; value?: string; isInput?: boolean; multiline?: boolean }[];
    inputRows?: number;
    grid?: {
      title?: string;
      headers: string[];
      colWidths?: string[];
      rowMinHeights?: string[];
      rows: { cells: { key?: string; value?: string; isInput?: boolean; multiline?: boolean; placeholder?: string; width?: string }[] }[];
    };
    grids?: Array<{
      title?: string;
      headers: string[];
      colWidths?: string[];
      rowMinHeights?: string[];
      rows: { cells: { key?: string; value?: string; isInput?: boolean; multiline?: boolean; placeholder?: string; width?: string }[] }[];
    }>;
    baseErdDiagram?: string;
    baseNavDiagram?: string;
    baseStructureDiagram?: string;
    maxScreenshots?: number;
    screenshotInstructions?: string;
    maxFiles?: number;
    maxFileSizeKB?: number;
  };
  codeRequirement?: "programming-language" | "design-notation" | "either";
  drawingBackgroundUrl?: string;
  imageUrl?: string;
  aiGuidance?: string;
  allowedFileUploads?: string[];
  label?: string;
  subParts?: SubQuestion[];
  markingGuidanceData?: any;
}

function getRequirementBadge(req?: "programming-language" | "design-notation" | "either") {
  if (req === "programming-language") {
    return (
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900/50 w-fit mb-2">
        <Code2 className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">Must Use: Programming Language</span>
      </div>
    );
  }
  if (req === "design-notation") {
    return (
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900/50 w-fit mb-2">
        <FileEdit className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">Must Use: Design Notation</span>
      </div>
    );
  }
  return null;
}

function teacherTextPreserved(newValue: string, teacherText: string): boolean {
  if (!teacherText) return true;
  const teacherLines = teacherText.split("\n");
  const newLines = newValue.split("\n");
  if (newLines.length < teacherLines.length) return false;
  for (let i = 0; i < teacherLines.length; i++) {
    if (!newLines[i].startsWith(teacherLines[i])) return false;
  }
  return true;
}

export function renderQuestionInput(
  subQ: SubQuestion, 
  currentInput: Record<string, string>, 
  onChange: (key: string, val: string) => void,
  onCodeKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void,
  onUpload?: (file: File) => Promise<string>,
  previewMode?: boolean
) {
  if (subQ.maxMarks === 0) return null;

  const mainInput = renderMainInput(subQ, currentInput, onChange, onCodeKeyDown, onUpload, previewMode);
  
  const allowedUploads = subQ.allowedFileUploads || [];
  if (allowedUploads.length === 0 || previewMode) {
    return mainInput;
  }

  return (
    <div className="space-y-4">
      {mainInput}
      <FileUploadSection
        subQ={subQ}
        currentInput={currentInput}
        onChange={onChange}
        onUpload={onUpload}
        allowedTypes={allowedUploads}
      />
    </div>
  );
}

function renderMainInput(
  subQ: SubQuestion, 
  currentInput: Record<string, string>, 
  onChange: (key: string, val: string) => void,
  onCodeKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void,
  onUpload?: (file: File) => Promise<string>,
  previewMode?: boolean
) {
  if (subQ.inputStyle === "file-upload") {
    return null;
  }

  if (subQ.inputStyle === "screenshot-upload") {
    if (previewMode) {
      return (
        <div className="mt-4 min-h-[60px] border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-sm text-neutral-400">
          Screenshot upload area
        </div>
      );
    }
    return (
      <ScreenshotUploadInput
        subQ={subQ}
        currentInput={currentInput}
        onChange={onChange}
        onUpload={onUpload}
      />
    );
  }

  if (subQ.inputStyle === "code-editor") {
    const isProgrammingOnly = subQ.codeRequirement === "programming-language";
    const placeholderText = isProgrammingOnly 
      ? "// Write your code here..." 
      : "// Write your code or design notation here...";

    if (previewMode) {
      return (
        <div className="space-y-2 mt-4">
          {getRequirementBadge(subQ.codeRequirement)}
          <div className="min-h-[60px] text-base font-mono p-4 bg-neutral-900 text-neutral-600 border border-neutral-800 rounded-md" />
        </div>
      );
    }

    return (
      <div className="space-y-2 mt-4">
        {getRequirementBadge(subQ.codeRequirement)}
        <Textarea 
          placeholder={placeholderText}
          className="min-h-[200px] text-base font-mono p-4 resize-y bg-neutral-900 text-neutral-100 border-neutral-800 focus:border-blue-800"
          value={currentInput["main"] || ""}
          onChange={(e) => onChange("main", e.target.value)}
          onKeyDown={(e) => { onCodeKeyDown?.(e); handleTabKey(e, onChange); }}
          data-testid={`input-code-${subQ.id}`}
        />
      </div>
    );
  }

  if (subQ.inputStyle === "labeled-inputs" && subQ.inputConfig) {
    return (
      <div className="space-y-3 mt-4 w-full">
        {subQ.inputConfig.fields?.map((field, i) => (
          <div key={i} className="flex w-full items-center gap-4">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 shrink-0 whitespace-nowrap">
              {field.label}
            </label>
            {previewMode ? (
              <div className="flex-1 min-w-0 bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 text-sm min-h-[36px]" />
            ) : (
              <Input 
                value={currentInput[field.key] || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="flex-1 min-w-0 bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-blue-800 shadow-sm"
                data-testid={`input-${field.key}-${subQ.id}`}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (subQ.inputStyle === "design-choice") {
    if (previewMode) {
      return (
        <div className="space-y-2 mt-4">
          <div className="flex gap-4 text-sm text-neutral-500">
            <span>Pseudocode / Structure Diagram</span>
          </div>
          <div className="min-h-[60px] bg-neutral-900 border border-neutral-800 rounded-md p-4" />
        </div>
      );
    }

    const activeMode = currentInput["design_mode"] || "pseudocode";
    
    return (
      <div className="space-y-4 mt-4">
        <div className="flex gap-4 mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name={`mode-${subQ.id}`} 
              checked={activeMode === "pseudocode"}
              onChange={() => onChange("design_mode", "pseudocode")}
              className="w-4 h-4 text-red-600"
            />
            <span className="text-sm font-medium">Pseudocode</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name={`mode-${subQ.id}`} 
              checked={activeMode === "diagram"}
              onChange={() => onChange("design_mode", "diagram")}
              className="w-4 h-4 text-red-600"
            />
            <span className="text-sm font-medium">Structure Diagram</span>
          </label>
        </div>

        {activeMode === "pseudocode" ? (
          <Textarea 
            placeholder="Write your pseudocode here..."
            className="min-h-[200px] text-base font-mono p-4 bg-neutral-900 text-neutral-100 border-neutral-800"
            value={currentInput["main"] || ""}
            onChange={(e) => onChange("main", e.target.value)}
            onKeyDown={(e) => handleTabKey(e, onChange)}
          />
        ) : (
          <DiagramImageInput
            value={currentInput["diagram_image"] || ""}
            onChange={(val) => onChange("diagram_image", val)}
            startingImageUrl={(subQ.inputConfig as any)?.startingImage || subQ.drawingBackgroundUrl || subQ.imageUrl}
            hint={DIAGRAM_HINTS["drawing"]}
          />
        )}
      </div>
    );
  }

  // Unified image-paste input — covers the new "image-paste" style and all
  // legacy diagram-editor styles which have been retired in favour of pasted
  // screenshots graded by Gemini Vision.
  const IMAGE_PASTE_STYLES = new Set([
    "image-paste",
    "drawing",
    "erd-annotation",
    "nav-structure",
    "nav-structure-higher",
    "tag-matching",
    "structure-dataflow",
    "form-wireframe",
    "webpage-wireframe",
    "structure-diagram",
    "entity-occurrence-diagram",
  ]);

  if (subQ.inputStyle && IMAGE_PASTE_STYLES.has(subQ.inputStyle)) {
    if (previewMode) {
      return (
        <div className="mt-4 min-h-[80px] border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-sm text-neutral-400">
          Image paste area
        </div>
      );
    }
    const startingImg = (subQ.inputConfig as any)?.startingImage || subQ.drawingBackgroundUrl || subQ.imageUrl;
    const hint = DIAGRAM_HINTS[subQ.inputStyle] || DIAGRAM_HINTS["image-paste"];
    return (
      <DiagramImageInput
        value={currentInput["diagram_image"] || ""}
        onChange={(val) => onChange("diagram_image", val)}
        startingImageUrl={startingImg}
        hint={hint}
      />
    );
  }

  if (subQ.inputStyle === "table" && subQ.inputConfig) {
    type GridType = { title?: string; headers: string[]; colWidths?: string[]; rowMinHeights?: string[]; rows: Array<{ cells: Array<{ key?: string; value?: string; isInput?: boolean; isHeading?: boolean; multiline?: boolean; placeholder?: string; width?: string }> }> };

    const renderSingleGrid = (grid: GridType, gridIndex: number = 0) => {
      const colWidths: string[] = grid.colWidths || grid.headers.map(() => "auto");
      const rowMinHeights: string[] = grid.rowMinHeights || grid.rows.map(() => "auto");
      return (
        <div key={gridIndex} className="mt-4">
          {grid.title && (
            <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1 text-sm">{grid.title}</div>
          )}
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                <tr>
                  {grid.headers.map((header: string, i: number) => (
                    <th key={i} className="px-4 py-3 font-medium border border-neutral-200 dark:border-neutral-700" style={{ width: colWidths[i] !== "auto" ? colWidths[i] : undefined }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map((row, rowIdx: number) => (
                  <tr key={rowIdx}>
                    {row.cells.map((cell, cellIdx: number) => {
                      const CellTag = cell.isHeading ? "th" : "td";
                      return (
                      <CellTag
                        key={cellIdx}
                        className={`px-4 py-3 align-top border border-neutral-200 dark:border-neutral-700 ${
                          cell.isHeading
                            ? "bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-700 dark:text-neutral-300"
                            : cell.isInput ? "bg-white dark:bg-neutral-900" : "bg-neutral-50 dark:bg-neutral-800/50"
                        }`}
                        style={{ minHeight: rowMinHeights[rowIdx] !== "auto" ? rowMinHeights[rowIdx] : undefined }}
                      >
                        {cell.isInput ? (
                          (() => {
                            const cellKey = cell.key || `cell_g${gridIndex}_${rowIdx}_${cellIdx}`;
                            const teacherValue = cell.value || "";
                            const cellValue = currentInput[cellKey] !== undefined ? currentInput[cellKey] : teacherValue;
                            if (previewMode) {
                              return (
                                <div
                                  className="bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 text-sm whitespace-pre-wrap"
                                  style={{ minHeight: rowMinHeights[rowIdx] !== "auto" ? rowMinHeights[rowIdx] : "40px" }}
                                >
                                  {teacherValue && (
                                    <span className="text-neutral-700 dark:text-neutral-300">{teacherValue}</span>
                                  )}
                                </div>
                              );
                            }
                            const lineCount = Math.max((cellValue || teacherValue).split("\n").length, 3);
                            return (
                              <Textarea
                                placeholder={cell.placeholder || "Enter answer..."}
                                value={cellValue}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  if (teacherTextPreserved(newVal, teacherValue)) {
                                    onChange(cellKey, newVal);
                                  }
                                }}
                                className="bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-blue-800 shadow-sm resize-y"
                                style={{ minHeight: rowMinHeights[rowIdx] !== "auto" ? rowMinHeights[rowIdx] : "60px" }}
                                rows={lineCount}
                              />
                            );
                          })()
                        ) : (
                          <span className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{cell.value || ""}</span>
                        )}
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
    };

    if (subQ.inputConfig.grids && Array.isArray(subQ.inputConfig.grids) && subQ.inputConfig.grids.length > 0) {
      return (
        <div className="space-y-4">
          {(subQ.inputConfig.grids as GridType[]).map((grid, i) => renderSingleGrid(grid, i))}
        </div>
      );
    }

    if (subQ.inputConfig.grid) {
      return renderSingleGrid(subQ.inputConfig.grid as GridType);
    }
    
    if (subQ.inputConfig.columns) {
      const numRows = subQ.inputConfig.inputRows || 1;
      return (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              <tr>
                {subQ.inputConfig.columns.map((col: { key: string; header: string; width?: string }, i: number) => (
                  <th key={i} className="px-4 py-3 font-medium" style={col.width ? { width: col.width } : undefined}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {Array.from({ length: numRows }).map((_, rowIdx) => (
                <tr key={rowIdx} className="bg-white dark:bg-neutral-900">
                  {subQ.inputConfig!.columns!.map((col: { key: string; header: string; width?: string }, colIdx: number) => {
                    const key = numRows > 1 ? `${col.key}_${rowIdx + 1}` : col.key;
                    return (
                      <td key={colIdx} className="px-4 py-3">
                        {previewMode ? (
                          <div className="bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 text-sm min-h-[36px]" />
                        ) : (
                          <Input
                            placeholder={`Enter ${col.header.toLowerCase()}...`}
                            value={currentInput[key] || ""}
                            onChange={(e) => onChange(key, e.target.value)}
                            className="bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-blue-800 shadow-sm"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    if (subQ.inputConfig.rows) {
      return (
        <div className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4">
          <div className="grid w-full" style={{ gridTemplateColumns: 'max-content 1fr' }}>
            {subQ.inputConfig.rows.map((row: { key?: string; label: string; value?: string; isInput?: boolean; multiline?: boolean }, i: number) => (
              <Fragment key={i}>
                <div className="px-4 py-3 font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 whitespace-nowrap border-b border-neutral-200 dark:border-neutral-700 flex items-center">
                  {row.label}
                </div>
                <div className="px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
                  {row.isInput ? (
                    (() => {
                      const teacherVal = row.value || "";
                      const rowValue = currentInput[row.key!] !== undefined ? currentInput[row.key!] : teacherVal;
                      if (previewMode) {
                        return (
                          <div className="w-full bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 text-sm min-h-[36px] whitespace-pre-wrap">
                            {teacherVal && <span className="text-neutral-700 dark:text-neutral-300">{teacherVal}</span>}
                          </div>
                        );
                      }
                      const handleRowChange = (newVal: string) => {
                        if (teacherTextPreserved(newVal, teacherVal)) {
                          onChange(row.key!, newVal);
                        }
                      };
                      return row.multiline ? (
                        <Textarea
                          placeholder="Enter answer..."
                          value={rowValue}
                          onChange={(e) => handleRowChange(e.target.value)}
                          className="w-full min-h-[100px] bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-blue-800 shadow-sm resize-y"
                          rows={Math.max((rowValue || teacherVal).split("\n").length, 3)}
                        />
                      ) : (
                        <Input
                          placeholder="Enter answer..."
                          value={rowValue}
                          onChange={(e) => handleRowChange(e.target.value)}
                          className="w-full bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-blue-800 shadow-sm"
                        />
                      );
                    })()
                  ) : (
                    <span className="text-neutral-700 dark:text-neutral-300">{row.value || ""}</span>
                  )}
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      );
    }
  }

  if (previewMode) {
    return (
      <div className="bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 text-sm min-h-[40px]" />
    );
  }

  return (
    <Textarea 
      placeholder="Type your answer here..."
      className="min-h-[100px]"
      value={currentInput["main"] || ""}
      onChange={(e) => onChange("main", e.target.value)}
      onKeyDown={(e) => { onCodeKeyDown?.(e); handleTabKey(e, onChange); }}
      data-testid={`input-text-${subQ.id}`}
    />
  );
}

interface UploadedFile {
  url: string;
  type: "image" | "document";
  name?: string;
}

interface FileUploadSectionProps {
  subQ: SubQuestion;
  currentInput: Record<string, string>;
  onChange: (key: string, val: string) => void;
  onUpload?: (file: File) => Promise<string>;
  allowedTypes: string[];
}

function FileUploadSection({ subQ, currentInput, onChange, onUpload, allowedTypes }: FileUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const hasCodeTypes = allowedTypes.some(t => ["py", "html", "css"].includes(t));
  const hasScreenshot = allowedTypes.includes("screenshot");

  const codeExtensions = allowedTypes
    .filter(t => ["py", "html", "css"].includes(t))
    .flatMap(t => t === "py" ? [".py"] : t === "html" ? [".html", ".htm"] : [".css"]);

  const allAccept = [
    ...codeExtensions,
    ...(hasScreenshot ? ["image/*"] : []),
  ].join(",");

  const typeLabels = allowedTypes
    .map(t => t === "py" ? ".py" : t === "html" ? ".html" : t === "css" ? ".css" : "image")
    .join(", ");

  const maxFiles = subQ.inputConfig?.maxFiles || 5;
  const maxFileSizeBytes = (subQ.inputConfig?.maxFileSizeKB || 500) * 1024;

  const isAllowedFile = (file: File): boolean => {
    if (file.type.startsWith("image/") && hasScreenshot) return true;
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    return codeExtensions.includes(ext);
  };

  const handleFile = async (file: File) => {
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

  const handleCodeFile = async (file: File) => {
    const text = await file.text();
    const existing = currentInput["uploaded_files"] ? JSON.parse(currentInput["uploaded_files"]) : [];
    existing.push({ name: file.name, content: text, type: "code" });
    onChange("uploaded_files", JSON.stringify(existing));
  };

  const handleImageFile = async (file: File) => {
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await handleFile(file);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
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

  let uploadedFiles: Array<{ name: string; content?: string; url?: string; type: string }> = [];
  try {
    if (currentInput["uploaded_files"]) {
      uploadedFiles = JSON.parse(currentInput["uploaded_files"]);
    }
  } catch {}

  const removeFile = (index: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    onChange("uploaded_files", updated.length > 0 ? JSON.stringify(updated) : "");
  };

  return (
    <div
      ref={dropZoneRef}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
      onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
      onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
      className={`border-2 border-dashed rounded-lg p-4 transition-colors outline-none ${
        isDragging
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
          : "border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/30 hover:border-neutral-400 dark:hover:border-neutral-500"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Upload className="h-4 w-4 text-neutral-500" />
        <span className="text-sm font-medium">File Uploads</span>
        <span className="text-xs text-neutral-500">({typeLabels})</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={allAccept}
        multiple
        className="hidden"
        onChange={async e => {
          const files = Array.from(e.target.files || []);
          for (const file of files) {
            await handleFile(file);
          }
          e.target.value = "";
        }}
      />

      <div className="text-center py-3">
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
          {isDragging ? "Drop files here" : "Drag and drop files here, paste screenshots (Ctrl+V), or"}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-3 w-3 mr-1" />
          {uploading ? "Uploading..." : "Choose Files"}
        </Button>
        <p className="text-xs text-neutral-400 mt-2">
        Accepts: {typeLabels} | Max {maxFiles} file{maxFiles !== 1 ? "s" : ""}, up to {subQ.inputConfig?.maxFileSizeKB || 500}KB each
      </p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2 mt-3 border-t border-neutral-200 dark:border-neutral-700 pt-3">
          {uploadedFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-white dark:bg-neutral-900 border rounded px-3 py-2">
              {file.type === "screenshot" && file.url ? (
                <img src={file.url} alt={file.name} className="h-10 w-10 object-cover rounded" />
              ) : (
                <Code2 className="h-4 w-4 text-green-600 shrink-0" />
              )}
              <span className="text-sm flex-1 truncate">{file.name}</span>
              {file.type === "code" && file.content && (
                <span className="text-xs text-neutral-500">{file.content.split("\n").length} lines</span>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(i)} className="text-red-600 hover:text-red-700 h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ScreenshotUploadProps {
  subQ: SubQuestion;
  currentInput: Record<string, string>;
  onChange: (key: string, val: string) => void;
  onUpload?: (file: File) => Promise<string>;
}

export function ScreenshotUploadInput({ subQ, currentInput, onChange, onUpload }: ScreenshotUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxFiles = subQ.inputConfig?.maxScreenshots || 5;
  const instructions = subQ.inputConfig?.screenshotInstructions || "Upload screenshots or documents of your practical work";
  
  // Helper to determine file type from URL extension
  const getFileTypeFromUrl = (url: string): "image" | "document" => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    const docExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx'];
    return docExtensions.includes(ext) ? 'document' : 'image';
  };
  
  const getFileNameFromUrl = (url: string): string => {
    return url.split('/').pop() || 'File';
  };

  // Defensive JSON parsing for uploaded files
  let uploadedFiles: UploadedFile[] = [];
  try {
    const fileData = currentInput["screenshots"];
    if (fileData && fileData.trim()) {
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed)) {
        // Handle both old format (string[]) and new format (UploadedFile[])
        uploadedFiles = parsed.map((item: string | UploadedFile) => {
          if (typeof item === "string") {
            // Derive type and name from URL for backwards compatibility
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

  const isImageFile = (file: File) => file.type.startsWith("image/");
  const isDocumentFile = (file: File) => {
    const docTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];
    return docTypes.includes(file.type);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const newFiles: UploadedFile[] = [];
      
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

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    onChange("screenshots", JSON.stringify(newFiles));
  };

  return (
    <div className="space-y-4 mt-4" data-testid={`input-screenshot-${subQ.id}`}>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{instructions}</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {uploadedFiles.map((file, idx) => (
          <div key={idx} className="relative group">
            {file.type === "image" ? (
              <img 
                src={file.url} 
                alt={`Screenshot ${idx + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
              />
            ) : (
              <div className="w-full h-32 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex flex-col items-center justify-center gap-2 p-2">
                <ImageIcon className="w-8 h-8 text-neutral-400" />
                <span className="text-xs text-neutral-600 dark:text-neutral-400 text-center truncate w-full px-2">
                  {file.name || "Document"}
                </span>
              </div>
            )}
            <button
              onClick={() => removeFile(idx)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
              data-testid={`button-remove-file-${idx}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {uploadedFiles.length < maxFiles && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-32 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors disabled:opacity-50"
            type="button"
            data-testid="button-add-file"
          >
            {uploading ? (
              <span className="text-sm text-neutral-500">Uploading...</span>
            ) : (
              <>
                <Upload className="w-6 h-6 text-neutral-400" />
                <span className="text-sm text-neutral-500 text-center px-2">Add Image or Document</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
        onChange={handleFileSelect}
        className="hidden"
        multiple
        data-testid="input-file-upload"
      />

      <p className="text-xs text-neutral-500">
        {uploadedFiles.length}/{maxFiles} files uploaded (images, PDF, Word, PowerPoint)
      </p>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
