import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ChevronDown, ChevronUp, ChevronRight, GripVertical, Type, Image, Code, Table, Edit, X, FileText, Loader2, ClipboardList, Heading, Upload } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ContentBlock, ContentBlockType, DataTable, PseudocodeLine } from "@/lib/past-papers";
import { DataTableEditorModal } from "@/components/ui/data-table-editor-modal";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { MarkingGuidanceModal, MarkingGuidanceData } from "@/components/ui/marking-guidance-modal";
import { DiagramEditor } from "@/components/ui/diagram-editor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import RichTextEditor from "@/components/RichTextEditor";

export interface AssignmentQuestion {
  id: string;
  label: string;
  questionText: string;
  contentBlocks?: ContentBlock[];
  maxMarks: number;
  inputStyle: string;
  aiGuidance: string;
  markingGuidanceData?: MarkingGuidanceData;
  markingScheme: string[];
  allowedFileUploads?: string[];
  subParts?: AssignmentQuestion[];
  drawingBackgroundUrl?: string;
  inputConfig?: {
    fields?: { key: string; label: string }[];
    maxScreenshots?: number;
    screenshotInstructions?: string;
    maxFiles?: number;
    maxFileSizeKB?: number;
    grid?: GridConfig;
    grids?: GridConfig[];
    wireframeExampleData?: string;
    wireframeExampleCanvas?: string;
    baseNavDiagram?: string;
    navExampleData?: string;
    navExampleCanvas?: string;
  };
}

export function getLeafQuestions(questions: AssignmentQuestion[]): AssignmentQuestion[] {
  const leaves: AssignmentQuestion[] = [];
  for (const q of questions) {
    if (q.subParts && q.subParts.length > 0) {
      leaves.push(...getLeafQuestions(q.subParts));
    } else {
      leaves.push(q);
    }
  }
  return leaves;
}

export function getTotalMarks(questions: AssignmentQuestion[]): number {
  return getLeafQuestions(questions).reduce((sum, q) => sum + q.maxMarks, 0);
}

interface AssignmentQuestionEditorProps {
  questions: AssignmentQuestion[];
  onChange: (questions: AssignmentQuestion[]) => void;
  isAssignment?: boolean;
  questionNumberPrefix?: number;
  questionStartIndex?: number;
}

function toRoman(num: number): string {
  const numerals = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
  return numerals[num - 1] || String(num);
}

const INPUT_STYLES = [
  { value: "text", label: "Text Answer" },
  { value: "code-editor", label: "Code Editor" },
  { value: "labeled-inputs", label: "Labeled Inputs" },
  { value: "drawing", label: "Drawing/Diagram" },
  { value: "table", label: "Table Input" },
  { value: "design-choice", label: "Design Choice (Pseudocode or Structure Diagram)" },
  { value: "file-upload", label: "File Upload Only" },
  { value: "webpage-wireframe", label: "Webpage Wireframe" },
  { value: "form-wireframe", label: "Form Wireframe" },
  { value: "nav-structure", label: "Navigation Structure Diagram" },
];

interface GridConfig {
  title?: string;
  headers: string[];
  colWidths?: string[];
  rowMinHeights?: string[];
  rows: Array<{
    cells: Array<{
      key?: string;
      value?: string;
      isInput?: boolean;
      isHeading?: boolean;
      placeholder?: string;
    }>;
  }>;
}

let cellIdCounter = 0;
function generateCellId() {
  return `c_${Date.now()}_${++cellIdCounter}`;
}

function makeCell(isInput = false): GridConfig["rows"][0]["cells"][0] {
  return { key: generateCellId(), value: "", isInput };
}

function TableGridEditor({ grid, onChange, questionId }: { grid?: GridConfig; onChange: (grid: GridConfig) => void; questionId: string }) {
  const createDefaultGrid = (): GridConfig => ({
    headers: ["Column 1", "Column 2", "Column 3"],
    colWidths: ["auto", "auto", "auto"],
    rowMinHeights: ["60px", "60px"],
    rows: [
      { cells: [makeCell(), makeCell(), makeCell()] },
      { cells: [makeCell(), makeCell(), makeCell()] },
    ],
  });

  const currentGrid = grid || createDefaultGrid();
  const colWidths = currentGrid.colWidths || currentGrid.headers.map(() => "auto");
  const rowMinHeights = currentGrid.rowMinHeights || currentGrid.rows.map(() => "60px");

  const initGrid = () => {
    if (!grid) onChange(createDefaultGrid());
  };

  const updateHeader = (idx: number, value: string) => {
    const headers = [...currentGrid.headers];
    headers[idx] = value;
    onChange({ ...currentGrid, headers });
  };

  const updateColWidth = (idx: number, value: string) => {
    const newWidths = [...colWidths];
    newWidths[idx] = value;
    onChange({ ...currentGrid, colWidths: newWidths });
  };

  const updateRowHeight = (idx: number, value: string) => {
    const newHeights = [...rowMinHeights];
    newHeights[idx] = value;
    onChange({ ...currentGrid, rowMinHeights: newHeights });
  };

  const addColumn = () => {
    const headers = [...currentGrid.headers, `Column ${currentGrid.headers.length + 1}`];
    const newColWidths = [...colWidths, "auto"];
    const rows = currentGrid.rows.map(row => ({
      cells: [...row.cells, makeCell()],
    }));
    onChange({ ...currentGrid, headers, colWidths: newColWidths, rows });
  };

  const removeColumn = (colIdx: number) => {
    if (currentGrid.headers.length <= 1) return;
    const headers = currentGrid.headers.filter((_, i) => i !== colIdx);
    const newColWidths = colWidths.filter((_, i) => i !== colIdx);
    const rows = currentGrid.rows.map(row => ({
      cells: row.cells.filter((_, i) => i !== colIdx),
    }));
    onChange({ ...currentGrid, headers, colWidths: newColWidths, rows });
  };

  const addRow = () => {
    const newRow = { cells: currentGrid.headers.map(() => makeCell()) };
    const newHeights = [...rowMinHeights, "60px"];
    onChange({ ...currentGrid, rows: [...currentGrid.rows, newRow], rowMinHeights: newHeights });
  };

  const removeRow = (rowIdx: number) => {
    if (currentGrid.rows.length <= 1) return;
    const newHeights = rowMinHeights.filter((_, i) => i !== rowIdx);
    onChange({ ...currentGrid, rows: currentGrid.rows.filter((_, i) => i !== rowIdx), rowMinHeights: newHeights });
  };

  const toggleCell = (rowIdx: number, cellIdx: number) => {
    const rows = currentGrid.rows.map((row, rIdx) => {
      if (rIdx !== rowIdx) return row;
      return {
        cells: row.cells.map((cell, cIdx) => {
          if (cIdx !== cellIdx) return cell;
          const newIsInput = !cell.isInput;
          return {
            ...cell,
            isInput: newIsInput,
            isHeading: newIsInput ? false : cell.isHeading,
          };
        }),
      };
    });
    onChange({ ...currentGrid, rows });
  };

  const toggleHeading = (rowIdx: number, cellIdx: number) => {
    const rows = currentGrid.rows.map((row, rIdx) => {
      if (rIdx !== rowIdx) return row;
      return {
        cells: row.cells.map((cell, cIdx) => {
          if (cIdx !== cellIdx) return cell;
          const newIsHeading = !cell.isHeading;
          return {
            ...cell,
            isHeading: newIsHeading,
            isInput: newIsHeading ? false : cell.isInput,
          };
        }),
      };
    });
    onChange({ ...currentGrid, rows });
  };

  const updateCellValue = (rowIdx: number, cellIdx: number, value: string) => {
    const rows = currentGrid.rows.map((row, rIdx) => {
      if (rIdx !== rowIdx) return row;
      return {
        cells: row.cells.map((cell, cIdx) => {
          if (cIdx !== cellIdx) return cell;
          return { ...cell, value };
        }),
      };
    });
    onChange({ ...currentGrid, rows });
  };

  if (!grid) {
    return (
      <Button variant="outline" size="sm" onClick={initGrid} data-testid={`button-init-table-${questionId}`}>
        <Plus className="w-4 h-4 mr-1" /> Create Table Grid
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Label className="text-xs shrink-0">Table Title:</Label>
          <Input
            value={currentGrid.title || ""}
            onChange={(e) => onChange({ ...currentGrid, title: e.target.value })}
            placeholder="e.g. Entity: Seller"
            className="h-7 text-sm"
            data-testid={`input-grid-title-${questionId}`}
          />
        </div>
        <Button variant="outline" size="sm" onClick={addColumn} data-testid={`button-add-col-${questionId}`}>
          <Plus className="w-3 h-3 mr-1" /> Column
        </Button>
        <Button variant="outline" size="sm" onClick={addRow} data-testid={`button-add-row-${questionId}`}>
          <Plus className="w-3 h-3 mr-1" /> Row
        </Button>
        <span className="text-xs text-neutral-500 ml-2">
          <span className="text-emerald-600 dark:text-emerald-400">Pencil</span> = student-editable &middot; <span className="text-blue-600 dark:text-blue-400">H</span> = heading cell
        </span>
      </div>

      <div className="space-y-2">
        <div className="grid gap-2" style={{ gridTemplateColumns: `80px ${currentGrid.headers.map((_, i) => colWidths[i] !== "auto" ? colWidths[i] : "1fr").join(" ")} 32px` }}>
          <div></div>
          {currentGrid.headers.map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <Label className="text-[10px] text-neutral-500 shrink-0">Width:</Label>
              <Select value={colWidths[i] || "auto"} onValueChange={(v) => updateColWidth(i, v)}>
                <SelectTrigger className="h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="100px">Narrow (100px)</SelectItem>
                  <SelectItem value="150px">Small (150px)</SelectItem>
                  <SelectItem value="200px">Medium (200px)</SelectItem>
                  <SelectItem value="250px">Wide (250px)</SelectItem>
                  <SelectItem value="300px">Extra Wide (300px)</SelectItem>
                  <SelectItem value="30%">30%</SelectItem>
                  <SelectItem value="40%">40%</SelectItem>
                  <SelectItem value="50%">50%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
          <div></div>
        </div>
      </div>

      <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-700 rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-neutral-100 dark:bg-neutral-800">
              <th className="w-20 px-2 py-1 text-xs text-neutral-500">Row Height</th>
              {currentGrid.headers.map((header, i) => (
                <th key={i} className="px-2 py-1 relative group" style={{ width: colWidths[i] !== "auto" ? colWidths[i] : undefined }}>
                  <div className="flex items-center gap-1">
                    <Input
                      value={header}
                      onChange={(e) => updateHeader(i, e.target.value)}
                      className="h-7 text-xs font-medium bg-transparent border-dashed"
                      data-testid={`input-header-${questionId}-${i}`}
                    />
                    {currentGrid.headers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={() => removeColumn(i)}
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {currentGrid.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-t border-neutral-200 dark:border-neutral-700">
                <td className="px-1 py-1 bg-neutral-50 dark:bg-neutral-900 align-top">
                  <Select value={rowMinHeights[rowIdx] || "60px"} onValueChange={(v) => updateRowHeight(rowIdx, v)}>
                    <SelectTrigger className="h-6 w-[72px] text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="40px">Short (40px)</SelectItem>
                      <SelectItem value="60px">Default (60px)</SelectItem>
                      <SelectItem value="100px">Medium (100px)</SelectItem>
                      <SelectItem value="150px">Tall (150px)</SelectItem>
                      <SelectItem value="200px">Extra Tall (200px)</SelectItem>
                      <SelectItem value="300px">Very Tall (300px)</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                {row.cells.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={`px-2 py-1 align-top transition-colors border border-neutral-200 dark:border-neutral-700 ${
                      cell.isHeading
                        ? "bg-neutral-200 dark:bg-neutral-700 outline outline-2 outline-dashed outline-blue-400"
                        : cell.isInput
                        ? "bg-white dark:bg-neutral-950 outline outline-2 outline-dashed outline-emerald-400"
                        : "bg-neutral-100 dark:bg-neutral-800"
                    }`}
                    style={{ minHeight: rowMinHeights[rowIdx] || "60px" }}
                    data-testid={`cell-${questionId}-${rowIdx}-${cellIdx}`}
                  >
                    <div className="flex gap-1">
                      <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-5 w-5 ${cell.isInput ? "text-emerald-600" : "text-neutral-400"}`}
                          onClick={() => toggleCell(rowIdx, cellIdx)}
                          title={cell.isInput ? "Currently: student editable. Click to make pre-filled only." : "Currently: pre-filled. Click to make student editable."}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-5 w-5 ${cell.isHeading ? "text-blue-600" : "text-neutral-400"}`}
                          onClick={() => toggleHeading(rowIdx, cellIdx)}
                          title={cell.isHeading ? "Currently: heading cell. Click to make normal." : "Currently: normal cell. Click to make heading."}
                        >
                          <Heading className="w-3 h-3" />
                        </Button>
                      </div>
                      <Textarea
                        value={cell.value || ""}
                        onChange={(e) => updateCellValue(rowIdx, cellIdx, e.target.value)}
                        className={`text-xs bg-transparent border-none shadow-none focus-visible:ring-1 resize-y ${
                          cell.isInput ? "placeholder:text-emerald-400" : ""
                        }`}
                        placeholder={cell.isInput ? "Starter text (optional)..." : "Pre-filled text..."}
                        style={{ minHeight: rowMinHeights[rowIdx] || "60px" }}
                        data-testid={`input-cell-${questionId}-${rowIdx}-${cellIdx}`}
                      />
                    </div>
                  </td>
                ))}
                <td className="w-8 text-center align-top pt-1">
                  {currentGrid.rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeRow(rowIdx)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MultiGridEditor({ grids, onChange, questionId }: { grids: GridConfig[]; onChange: (grids: GridConfig[]) => void; questionId: string }) {
  const addGrid = () => {
    const newGrid: GridConfig = {
      title: "",
      headers: ["Attribute name", "Key", "Type", "Size", "Required", "Validation"],
      colWidths: ["auto", "auto", "auto", "auto", "auto", "auto"],
      rowMinHeights: ["40px"],
      rows: [
        { cells: [makeCell(), makeCell(true), makeCell(), makeCell(), makeCell(), makeCell()] },
      ],
    };
    onChange([...grids, newGrid]);
  };

  const updateGrid = (index: number, grid: GridConfig) => {
    const newGrids = [...grids];
    newGrids[index] = grid;
    onChange(newGrids);
  };

  const removeGrid = (index: number) => {
    onChange(grids.filter((_, i) => i !== index));
  };

  const duplicateGrid = (index: number) => {
    const source = grids[index];
    const duplicate: GridConfig = {
      ...source,
      title: (source.title || "") + " (copy)",
      rows: source.rows.map(row => ({
        cells: row.cells.map(cell => ({ ...cell, key: generateCellId() })),
      })),
    };
    const newGrids = [...grids];
    newGrids.splice(index + 1, 0, duplicate);
    onChange(newGrids);
  };

  if (grids.length === 0) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => {
          const newGrid: GridConfig = {
            title: "",
            headers: ["Column 1", "Column 2", "Column 3"],
            colWidths: ["auto", "auto", "auto"],
            rowMinHeights: ["60px", "60px"],
            rows: [
              { cells: [makeCell(), makeCell(), makeCell()] },
              { cells: [makeCell(), makeCell(), makeCell()] },
            ],
          };
          onChange([newGrid]);
        }} data-testid={`button-init-table-${questionId}`}>
          <Plus className="w-4 h-4 mr-1" /> Create Table
        </Button>
        <Button variant="outline" size="sm" onClick={() => {
          const entityGrid: GridConfig = {
            title: "Entity: ",
            headers: ["Attribute name", "Key", "Type", "Size", "Required", "Validation"],
            colWidths: ["150px", "auto", "auto", "auto", "auto", "auto"],
            rowMinHeights: ["40px", "40px", "40px"],
            rows: [
              { cells: [makeCell(), makeCell(true), makeCell(), makeCell(), makeCell(), makeCell()] },
              { cells: [makeCell(), makeCell(true), makeCell(), makeCell(), makeCell(), makeCell()] },
              { cells: [makeCell(), makeCell(true), makeCell(), makeCell(), makeCell(), makeCell()] },
            ],
          };
          onChange([entityGrid]);
        }} data-testid={`button-init-entity-table-${questionId}`}>
          <Plus className="w-4 h-4 mr-1" /> Create Data Dictionary Table
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grids.map((grid, index) => (
        <div key={index} className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Table {index + 1}{grid.title ? `: ${grid.title}` : ""}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => duplicateGrid(index)} title="Duplicate this table">
                <FileText className="w-3 h-3 mr-1" /> Duplicate
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500" onClick={() => removeGrid(index)} title="Remove this table">
                <Trash2 className="w-3 h-3 mr-1" /> Remove
              </Button>
            </div>
          </div>
          <TableGridEditor
            grid={grid}
            onChange={(updated) => updateGrid(index, updated)}
            questionId={`${questionId}-grid-${index}`}
          />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addGrid} data-testid={`button-add-table-${questionId}`}>
        <Plus className="w-4 h-4 mr-1" /> Add Another Table
      </Button>
    </div>
  );
}

export default function AssignmentQuestionEditor({ 
  questions, 
  onChange,
  isAssignment = true,
  questionNumberPrefix,
  questionStartIndex = 0
}: AssignmentQuestionEditorProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [tableEditorOpen, setTableEditorOpen] = useState(false);
  const [editingTableBlock, setEditingTableBlock] = useState<{ questionId: string; blockIndex: number } | null>(null);
  const [markingGuidanceModalOpen, setMarkingGuidanceModalOpen] = useState(false);
  const [editingMarkingGuidanceQuestion, setEditingMarkingGuidanceQuestion] = useState<string | null>(null);
  const [wireframeBgModalQuestion, setWireframeBgModalQuestion] = useState<string | null>(null);
  const hasMigrated = useRef(false);

  useEffect(() => {
    if (hasMigrated.current) return;
    const needsMigration = questions.some(
      q => q.questionText && q.questionText.trim() !== "" && (!q.contentBlocks || q.contentBlocks.length === 0)
    );
    if (needsMigration) {
      hasMigrated.current = true;
      const migrated = questions.map(q => {
        if (q.questionText && q.questionText.trim() !== "" && (!q.contentBlocks || q.contentBlocks.length === 0)) {
          return {
            ...q,
            contentBlocks: [{
              id: `block-migrated-${q.id}`,
              type: "text" as ContentBlockType,
              content: q.questionText,
            }],
          };
        }
        return q;
      });
      onChange(migrated);
    }
  }, [questions, onChange]);

  const toggleQuestion = (id: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedQuestions(newExpanded);
  };

  const addQuestion = () => {
    const newId = `q-${Date.now()}`;
    const defaultLabel = questionNumberPrefix 
      ? `${questionNumberPrefix}${String.fromCharCode(97 + questionStartIndex + questions.length)}` 
      : `Q${questionStartIndex + questions.length + 1}`;
    const newQuestion: AssignmentQuestion = {
      id: newId,
      label: defaultLabel,
      questionText: "",
      maxMarks: 1,
      inputStyle: "text",
      aiGuidance: "",
      markingScheme: [],
    };
    onChange([...questions, newQuestion]);
    setExpandedQuestions(prev => new Set(prev).add(newId));
  };

  const updateQuestionDeep = (list: AssignmentQuestion[], id: string, updates: Partial<AssignmentQuestion>): AssignmentQuestion[] => {
    return list.map(q => {
      if (q.id === id) return { ...q, ...updates };
      if (q.subParts && q.subParts.length > 0) {
        const updated = updateQuestionDeep(q.subParts, id, updates);
        if (updated !== q.subParts) return { ...q, subParts: updated, maxMarks: getTotalMarks(updated) };
      }
      return q;
    });
  };

  const updateQuestion = (id: string, updates: Partial<AssignmentQuestion>) => {
    onChange(updateQuestionDeep(questions, id, updates));
  };

  const removeQuestionDeep = (list: AssignmentQuestion[], id: string): AssignmentQuestion[] => {
    const filtered = list.filter(q => q.id !== id);
    if (filtered.length !== list.length) return filtered;
    return list.map(q => {
      if (q.subParts && q.subParts.length > 0) {
        const updated = removeQuestionDeep(q.subParts, id);
        if (updated !== q.subParts) return { ...q, subParts: updated, maxMarks: getTotalMarks(updated) };
      }
      return q;
    });
  };

  const removeQuestion = (id: string) => {
    onChange(removeQuestionDeep(questions, id));
  };

  const findQuestionDeep = (list: AssignmentQuestion[], id: string): AssignmentQuestion | undefined => {
    for (const q of list) {
      if (q.id === id) return q;
      if (q.subParts) {
        const found = findQuestionDeep(q.subParts, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const getQuestionDepth = (list: AssignmentQuestion[], id: string, depth: number = 0): number => {
    for (const q of list) {
      if (q.id === id) return depth;
      if (q.subParts) {
        const found = getQuestionDepth(q.subParts, id, depth + 1);
        if (found >= 0) return found;
      }
    }
    return -1;
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    
    onChange(newQuestions);
  };

  const addSubPart = (parentId: string) => {
    const parent = findQuestionDeep(questions, parentId);
    if (!parent) return;
    const depth = getQuestionDepth(questions, parentId);
    if (depth >= 2) return;
    const existingSubs = parent.subParts || [];
    const subLabel = `(${toRoman(existingSubs.length + 1)})`;
    const newId = `q-${Date.now()}`;
    const newSub: AssignmentQuestion = {
      id: newId,
      label: subLabel,
      questionText: "",
      maxMarks: 1,
      inputStyle: "text",
      aiGuidance: "",
      markingScheme: [],
    };
    updateQuestion(parentId, { subParts: [...existingSubs, newSub] });
    setExpandedQuestions(prev => new Set(prev).add(parentId).add(newId));
  };

  const moveSubPart = (parentId: string, index: number, direction: "up" | "down") => {
    const parent = findQuestionDeep(questions, parentId);
    if (!parent || !parent.subParts) return;
    const subs = [...parent.subParts];
    if ((direction === "up" && index === 0) || (direction === "down" && index === subs.length - 1)) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [subs[index], subs[targetIndex]] = [subs[targetIndex], subs[index]];
    updateQuestion(parentId, { subParts: subs });
  };

  const availableStyles = isAssignment 
    ? INPUT_STYLES 
    : INPUT_STYLES.filter(s => s.value !== "screenshot-upload");

  const addContentBlock = (questionId: string, type: ContentBlockType) => {
    const question = findQuestionDeep(questions, questionId);
    if (!question) return;
    
    const blocks = [...(question.contentBlocks || [])];
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      content: type === "code" ? "// Enter code here..." : "",
      ...(type === "data-table" && {
        dataTable: {
          tableName: "TABLE_NAME",
          columns: [
            { id: `col-${Date.now()}-1`, header: "Column1" },
            { id: `col-${Date.now()}-2`, header: "Column2" }
          ],
          rows: [
            { id: `row-${Date.now()}`, cells: ["", ""] }
          ],
          centered: false
        }
      }),
      ...(type === "pseudocode" && {
        pseudocodeLines: [
          { id: `line-${Date.now()}-1`, lineLabel: "Line 1", content: "" },
          { id: `line-${Date.now()}-2`, lineLabel: "Line 2", content: "" },
          { id: `line-${Date.now()}-3`, lineLabel: "Line 3", content: "" }
        ]
      })
    };
    blocks.push(newBlock);
    updateQuestion(questionId, { contentBlocks: blocks });
  };

  const addEntityTable = (questionId: string) => {
    const question = findQuestionDeep(questions, questionId);
    if (!question) return;

    const ts = Date.now();
    const blocks = [...(question.contentBlocks || [])];
    const newBlock: ContentBlock = {
      id: `block-${ts}`,
      type: "data-table",
      content: "",
      dataTable: {
        columns: [
          { id: `col-${ts}-1`, header: "Attribute name", align: "left" },
          { id: `col-${ts}-2`, header: "Key", align: "center", constraint: "pk-fk" },
          { id: `col-${ts}-3`, header: "Type", align: "center", constraint: "type" },
          { id: `col-${ts}-4`, header: "Size", align: "center", constraint: "number-only" },
          { id: `col-${ts}-5`, header: "Required", align: "center", constraint: "y-n" },
          { id: `col-${ts}-6`, header: "Validation", width: "33%", align: "left" },
        ],
        rows: [
          { id: `row-${ts}-1`, cells: ["", "", "", "", "", ""] },
          { id: `row-${ts}-2`, cells: ["", "", "", "", "", ""] },
          { id: `row-${ts}-3`, cells: ["", "", "", "", "", ""] },
        ],
        hideHeaders: false,
      },
    };
    blocks.push(newBlock);
    updateQuestion(questionId, { contentBlocks: blocks });
  };

  const moveContentBlock = (questionId: string, blockIndex: number, direction: "up" | "down") => {
    const question = findQuestionDeep(questions, questionId);
    if (!question || !question.contentBlocks) return;
    const blocks = [...question.contentBlocks];
    const swapIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
    if (swapIndex < 0 || swapIndex >= blocks.length) return;
    [blocks[blockIndex], blocks[swapIndex]] = [blocks[swapIndex], blocks[blockIndex]];
    updateQuestion(questionId, { contentBlocks: blocks });
  };

  const handleImageUpload = async (questionId: string, blockIndex: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      updateContentBlock(questionId, blockIndex, "content", data.url);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const updateContentBlock = (questionId: string, blockIndex: number, field: keyof ContentBlock, value: any) => {
    const question = findQuestionDeep(questions, questionId);
    if (!question) return;
    
    const blocks = [...(question.contentBlocks || [])];
    blocks[blockIndex] = { ...blocks[blockIndex], [field]: value };
    updateQuestion(questionId, { contentBlocks: blocks });
  };

  const removeContentBlock = (questionId: string, blockIndex: number) => {
    const question = findQuestionDeep(questions, questionId);
    if (!question) return;
    
    const blocks = (question.contentBlocks || []).filter((_, i) => i !== blockIndex);
    updateQuestion(questionId, { contentBlocks: blocks });
  };

  const updatePseudocodeLine = (questionId: string, blockIndex: number, lineIndex: number, field: keyof PseudocodeLine, value: string) => {
    const question = findQuestionDeep(questions, questionId);
    if (!question || !question.contentBlocks) return;
    const blocks = [...question.contentBlocks];
    const block = { ...blocks[blockIndex] };
    const lines = [...(block.pseudocodeLines || [])];
    lines[lineIndex] = { ...lines[lineIndex], [field]: value };
    block.pseudocodeLines = lines;
    blocks[blockIndex] = block;
    updateQuestion(questionId, { contentBlocks: blocks });
  };

  const addPseudocodeLine = (questionId: string, blockIndex: number) => {
    const question = findQuestionDeep(questions, questionId);
    if (!question || !question.contentBlocks) return;
    const blocks = [...question.contentBlocks];
    const block = { ...blocks[blockIndex] };
    const lines = [...(block.pseudocodeLines || [])];
    lines.push({ id: `line-${Date.now()}`, lineLabel: `Line ${lines.length + 1}`, content: "" });
    block.pseudocodeLines = lines;
    blocks[blockIndex] = block;
    updateQuestion(questionId, { contentBlocks: blocks });
  };

  const removePseudocodeLine = (questionId: string, blockIndex: number, lineIndex: number) => {
    const question = findQuestionDeep(questions, questionId);
    if (!question || !question.contentBlocks) return;
    const blocks = [...question.contentBlocks];
    const block = { ...blocks[blockIndex] };
    const lines = (block.pseudocodeLines || []).filter((_, i) => i !== lineIndex);
    block.pseudocodeLines = lines;
    blocks[blockIndex] = block;
    updateQuestion(questionId, { contentBlocks: blocks });
  };

  const handleSaveTable = (dataTable: DataTable) => {
    if (!editingTableBlock) return;
    const { questionId, blockIndex } = editingTableBlock;
    const question = findQuestionDeep(questions, questionId);
    if (!question) return;
    
    const blocks = [...(question.contentBlocks || [])];
    blocks[blockIndex] = { ...blocks[blockIndex], dataTable };
    updateQuestion(questionId, { contentBlocks: blocks });
    setTableEditorOpen(false);
    setEditingTableBlock(null);
  };

  const openTableEditor = (questionId: string, blockIndex: number) => {
    setEditingTableBlock({ questionId, blockIndex });
    setTableEditorOpen(true);
  };

  const getEditingDataTable = (): DataTable | null => {
    if (!editingTableBlock) return null;
    const question = findQuestionDeep(questions, editingTableBlock.questionId);
    return question?.contentBlocks?.[editingTableBlock.blockIndex]?.dataTable || null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <Button onClick={addQuestion} size="sm" data-testid="button-add-question">
          <Plus className="w-4 h-4 mr-1" /> Add Task
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 border-2 border-dashed rounded-lg">
          <p>No tasks yet. Click "Add Task" to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <Collapsible 
              key={question.id} 
              open={expandedQuestions.has(question.id)}
              onOpenChange={() => toggleQuestion(question.id)}
            >
              <Card className="border">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-neutral-400" />
                        {expandedQuestions.has(question.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <CardTitle className="text-base">
                          {question.label}: {(() => {
                            const rawText = question.contentBlocks?.find(b => b.type === "text" || b.type === "heading")?.content || question.questionText;
                            if (!rawText) return "(No task text)";
                            const plainText = rawText.replace(/<[^>]*>/g, "").trim();
                            if (!plainText) return "(No task text)";
                            return plainText.length > 50 ? plainText.slice(0, 50) + "..." : plainText;
                          })()}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                          {question.maxMarks} mark{question.maxMarks !== 1 ? "s" : ""}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQuestion(question.id);
                          }}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-question-${question.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    {(() => {
                      const hasSubParts = question.subParts && question.subParts.length > 0;
                      const depth = getQuestionDepth(questions, question.id);
                      const canAddSubParts = depth <= 1;
                      return (
                        <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Label</Label>
                        <Input
                          value={question.label}
                          onChange={(e) => updateQuestion(question.id, { label: e.target.value })}
                          placeholder="Q1, (a), (i), etc."
                          data-testid={`input-question-label-${question.id}`}
                        />
                      </div>
                      {!hasSubParts && (
                      <div>
                        <Label>Max Marks</Label>
                        <Input
                          type="number"
                          min={0}
                          value={question.maxMarks}
                          onChange={(e) => updateQuestion(question.id, { maxMarks: parseInt(e.target.value) || 0 })}
                          data-testid={`input-question-marks-${question.id}`}
                        />
                      </div>
                      )}
                      {hasSubParts && (
                        <div>
                          <Label>Total Marks (auto)</Label>
                          <div className="h-9 px-3 flex items-center rounded-md border bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-500">
                            {question.maxMarks} marks (from subparts)
                          </div>
                        </div>
                      )}
                      {!hasSubParts && (
                      <div>
                        <Label>Input Style</Label>
                        <Select
                          value={question.inputStyle}
                          onValueChange={(value) => updateQuestion(question.id, { inputStyle: value })}
                        >
                          <SelectTrigger data-testid={`select-input-style-${question.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStyles.map(style => (
                              <SelectItem key={style.value} value={style.value}>
                                {style.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      )}
                      {!hasSubParts && (
                      <div>
                        <Label>File Uploads Allowed</Label>
                        <div className="flex flex-wrap gap-3 mt-1.5">
                          {[
                            { value: "py", label: "Python (.py)" },
                            { value: "html", label: "HTML (.html)" },
                            { value: "css", label: "CSS (.css)" },
                            { value: "screenshot", label: "Screenshot (image)" },
                          ].map(ft => (
                            <label key={ft.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(question.allowedFileUploads || []).includes(ft.value)}
                                onChange={e => {
                                  const current = question.allowedFileUploads || [];
                                  const updated = e.target.checked
                                    ? [...current, ft.value]
                                    : current.filter(t => t !== ft.value);
                                  updateQuestion(question.id, { allowedFileUploads: updated });
                                }}
                                className="rounded"
                              />
                              {ft.label}
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">Select which file types students can upload for this question</p>
                      </div>
                      )}
                    </div>

                    {/* Question Content Blocks */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Task Content</Label>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => addContentBlock(question.id, "text")} title="Add Text" data-testid={`button-add-text-block-${question.id}`}>
                            <Type className="h-3 w-3 mr-1" />
                            <span className="text-xs">Text</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => addContentBlock(question.id, "heading")} title="Add Heading" data-testid={`button-add-heading-block-${question.id}`}>
                            <Heading className="h-3 w-3 mr-1" />
                            <span className="text-xs">Heading</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => addContentBlock(question.id, "image")} title="Add Image" data-testid={`button-add-image-block-${question.id}`}>
                            <Image className="h-3 w-3 mr-1" />
                            <span className="text-xs">Image</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => addContentBlock(question.id, "code")} title="Add Code" data-testid={`button-add-code-block-${question.id}`}>
                            <Code className="h-3 w-3 mr-1" />
                            <span className="text-xs">Code</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => addContentBlock(question.id, "data-table")} title="Add Data Table" data-testid={`button-add-table-block-${question.id}`}>
                            <Table className="h-3 w-3 mr-1" />
                            <span className="text-xs">Table</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => addEntityTable(question.id)} title="Add Entity Table" data-testid={`button-add-entity-table-${question.id}`} className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30">
                            <Table className="h-3 w-3 mr-1" />
                            <span className="text-xs">Entity</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => addContentBlock(question.id, "pseudocode")} title="Add Pseudocode" data-testid={`button-add-pseudocode-block-${question.id}`}>
                            <FileText className="h-3 w-3 mr-1" />
                            <span className="text-xs">Pseudocode</span>
                          </Button>
                        </div>
                      </div>

                      {(!question.contentBlocks || question.contentBlocks.length === 0) && (
                        <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                          Add content blocks above to build your question (text, images, code, tables, pseudocode)
                        </div>
                      )}
                      
                      {question.contentBlocks && question.contentBlocks.length > 0 && (
                        <div className="space-y-2 border rounded p-2 bg-neutral-50 dark:bg-neutral-800/50">
                          {question.contentBlocks.map((block, blockIndex) => (
                            <div key={block.id} className="relative group border border-neutral-200 dark:border-neutral-700 rounded p-2 bg-white dark:bg-neutral-900">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-neutral-400 uppercase">{block.type}</span>
                                <div className="flex items-center gap-0.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => moveContentBlock(question.id, blockIndex, "up")}
                                    disabled={blockIndex === 0}
                                    data-testid={`button-move-block-up-${block.id}`}
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => moveContentBlock(question.id, blockIndex, "down")}
                                    disabled={blockIndex === (question.contentBlocks?.length || 1) - 1}
                                    data-testid={`button-move-block-down-${block.id}`}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => removeContentBlock(question.id, blockIndex)}
                                    data-testid={`button-remove-block-${block.id}`}
                                  >
                                    <X className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              </div>

                              {block.type === "heading" && (
                                <Input
                                  value={block.content || ""}
                                  onChange={(e) => updateContentBlock(question.id, blockIndex, "content", e.target.value)}
                                  placeholder="Enter section heading..."
                                  className="text-sm font-semibold"
                                  data-testid={`input-heading-block-${block.id}`}
                                />
                              )}
                              {block.type === "text" && (
                                <div data-testid={`input-text-block-${block.id}`}>
                                  <RichTextEditor
                                    content={block.content || ""}
                                    onChange={(html) => updateContentBlock(question.id, blockIndex, "content", html)}
                                    placeholder="Enter text content..."
                                  />
                                </div>
                              )}
                              {block.type === "image" && (
                                <div className="space-y-2">
                                  {block.content ? (
                                    <div className="space-y-2">
                                      <img src={block.content} alt="Preview" className="max-h-48 rounded border" data-testid={`img-preview-${block.id}`} />
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={block.caption || ""}
                                          onChange={(e) => updateContentBlock(question.id, blockIndex, "caption", e.target.value)}
                                          placeholder="Image caption (optional)..."
                                          className="text-sm flex-1"
                                          data-testid={`input-image-caption-${block.id}`}
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => updateContentBlock(question.id, blockIndex, "content", "")}
                                          data-testid={`button-remove-image-${block.id}`}
                                        >
                                          <X className="h-3 w-3 mr-1" /> Remove
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-4 text-center cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];
                                        if (file && file.type.startsWith("image/")) handleImageUpload(question.id, blockIndex, file);
                                      }}
                                      onDragOver={(e) => e.preventDefault()}
                                      onClick={() => {
                                        const input = document.createElement("input");
                                        input.type = "file";
                                        input.accept = "image/*";
                                        input.onchange = (e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0];
                                          if (file) handleImageUpload(question.id, blockIndex, file);
                                        };
                                        input.click();
                                      }}
                                      onPaste={(e) => {
                                        const items = e.clipboardData?.items;
                                        if (items) {
                                          for (const item of Array.from(items)) {
                                            if (item.type.startsWith("image/")) {
                                              const file = item.getAsFile();
                                              if (file) handleImageUpload(question.id, blockIndex, file);
                                              break;
                                            }
                                          }
                                        }
                                      }}
                                      tabIndex={0}
                                      data-testid={`dropzone-image-${block.id}`}
                                    >
                                      <div className="flex flex-col items-center gap-1 text-neutral-500 dark:text-neutral-400">
                                        <Upload className="h-5 w-5" />
                                        <span className="text-sm">Drag & drop, paste, or click to upload</span>
                                        <span className="text-xs text-neutral-400">Or enter URL below</span>
                                      </div>
                                    </div>
                                  )}
                                  <Input
                                    value={block.content || ""}
                                    onChange={(e) => updateContentBlock(question.id, blockIndex, "content", e.target.value)}
                                    placeholder="Or enter image URL..."
                                    className="text-xs"
                                    data-testid={`input-image-url-${block.id}`}
                                  />
                                </div>
                              )}
                              {block.type === "code" && (
                                <Textarea
                                  value={block.content || ""}
                                  onChange={(e) => updateContentBlock(question.id, blockIndex, "content", e.target.value)}
                                  placeholder="Enter code..."
                                  className="text-sm font-mono min-h-[80px] bg-neutral-900 text-green-400"
                                  data-testid={`input-code-block-${block.id}`}
                                />
                              )}
                              {block.type === "data-table" && block.dataTable && (
                                <div className="space-y-2">
                                  <ResponsiveDataTable dataTable={block.dataTable} />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openTableEditor(question.id, blockIndex)}
                                    data-testid={`button-edit-table-${block.id}`}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit Table
                                  </Button>
                                </div>
                              )}
                              {block.type === "pseudocode" && (
                                <div className="space-y-2">
                                  <Input
                                    value={block.content || ""}
                                    onChange={(e) => updateContentBlock(question.id, blockIndex, "content", e.target.value)}
                                    placeholder="Pseudocode heading (optional)..."
                                    className="text-sm font-medium"
                                    data-testid={`input-pseudocode-heading-${block.id}`}
                                  />
                                  <div className="border rounded overflow-hidden">
                                    <table className="w-full text-sm font-mono">
                                      <tbody>
                                        {(block.pseudocodeLines || []).map((line, lineIndex) => (
                                          <tr key={line.id} className="border-b last:border-b-0">
                                            <td className="px-2 py-1 w-20 border-r bg-neutral-50 dark:bg-neutral-800">
                                              <Input
                                                value={line.lineLabel}
                                                onChange={(e) => updatePseudocodeLine(question.id, blockIndex, lineIndex, "lineLabel", e.target.value)}
                                                className="h-7 text-xs text-center p-1"
                                                data-testid={`input-pseudo-label-${line.id}`}
                                              />
                                            </td>
                                            <td className="px-2 py-1">
                                              <Input
                                                value={line.content}
                                                onChange={(e) => updatePseudocodeLine(question.id, blockIndex, lineIndex, "content", e.target.value)}
                                                className="h-7 text-sm font-mono p-1"
                                                placeholder="Pseudocode..."
                                                data-testid={`input-pseudo-content-${line.id}`}
                                              />
                                            </td>
                                            <td className="px-1 py-1 w-8">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0"
                                                onClick={() => removePseudocodeLine(question.id, blockIndex, lineIndex)}
                                                disabled={(block.pseudocodeLines || []).length <= 1}
                                                data-testid={`button-remove-pseudo-line-${line.id}`}
                                              >
                                                <X className="h-3 w-3 text-red-500" />
                                              </Button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addPseudocodeLine(question.id, blockIndex)}
                                    data-testid={`button-add-pseudo-line-${block.id}`}
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Add Line
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {!hasSubParts && (question.allowedFileUploads && question.allowedFileUploads.length > 0) && (
                      <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <Label className="text-blue-700 dark:text-blue-300">File Upload Settings</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">Max Files</Label>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={question.inputConfig?.maxFiles || 5}
                              onChange={(e) => updateQuestion(question.id, { 
                                inputConfig: { 
                                  ...question.inputConfig, 
                                  maxFiles: parseInt(e.target.value) || 5 
                                }
                              })}
                              data-testid={`input-max-files-${question.id}`}
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Max File Size (KB)</Label>
                            <Input
                              type="number"
                              min={10}
                              max={10000}
                              value={question.inputConfig?.maxFileSizeKB || 500}
                              onChange={(e) => updateQuestion(question.id, { 
                                inputConfig: { 
                                  ...question.inputConfig, 
                                  maxFileSizeKB: parseInt(e.target.value) || 500 
                                }
                              })}
                              data-testid={`input-max-file-size-${question.id}`}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {!hasSubParts && question.inputStyle === "table" && (
                      <div className="space-y-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                        <Label className="text-emerald-700 dark:text-emerald-300">Table Grid Editor</Label>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          Define tables where some cells are pre-filled and others are left blank for students to complete. Add multiple tables for questions like data dictionaries with multiple entities.
                        </p>
                        <MultiGridEditor
                          grids={question.inputConfig?.grids || (question.inputConfig?.grid ? [question.inputConfig.grid] : [])}
                          onChange={(grids) => updateQuestion(question.id, { inputConfig: { ...question.inputConfig, grids, grid: grids[0] } })}
                          questionId={question.id}
                        />
                      </div>
                    )}

                    {!hasSubParts && question.inputStyle === "labeled-inputs" && (
                      <div className="space-y-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                        <Label className="text-amber-700 dark:text-amber-300">Labeled Input Fields</Label>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Add fields for students to fill in (e.g., "Variable 1:", "Variable 2:")
                        </p>
                        {(question.inputConfig?.fields || []).map((field, idx) => (
                          <div key={idx} className="flex gap-2 items-end">
                            <div className="flex-1">
                              <Label className="text-sm">Key</Label>
                              <Input
                                value={field.key}
                                onChange={(e) => {
                                  const fields = [...(question.inputConfig?.fields || [])];
                                  fields[idx] = { ...fields[idx], key: e.target.value };
                                  updateQuestion(question.id, { inputConfig: { ...question.inputConfig, fields } });
                                }}
                                placeholder="field_key"
                              />
                            </div>
                            <div className="flex-1">
                              <Label className="text-sm">Label</Label>
                              <Input
                                value={field.label}
                                onChange={(e) => {
                                  const fields = [...(question.inputConfig?.fields || [])];
                                  fields[idx] = { ...fields[idx], label: e.target.value };
                                  updateQuestion(question.id, { inputConfig: { ...question.inputConfig, fields } });
                                }}
                                placeholder="Display Label"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const fields = (question.inputConfig?.fields || []).filter((_, i) => i !== idx);
                                updateQuestion(question.id, { inputConfig: { ...question.inputConfig, fields } });
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const fields = [...(question.inputConfig?.fields || []), { key: `field${(question.inputConfig?.fields?.length || 0) + 1}`, label: "" }];
                            updateQuestion(question.id, { inputConfig: { ...question.inputConfig, fields } });
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Field
                        </Button>
                      </div>
                    )}

                    {!hasSubParts && question.inputStyle === "nav-structure" && (
                      <div className="space-y-3 p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg">
                        <Label className="text-cyan-700 dark:text-cyan-300">Navigation Structure Configuration</Label>
                        <p className="text-xs text-cyan-600 dark:text-cyan-400">
                          Create a starting diagram that students will build upon. Students will add pages and links to complete the navigation structure.
                        </p>
                        <div className="border rounded-lg overflow-hidden bg-white dark:bg-neutral-900" style={{ minHeight: "400px" }}>
                          <BaseNavDiagramFieldEditor
                            questionId={question.id}
                            inputConfig={question.inputConfig}
                            updateQuestion={updateQuestion}
                          />
                        </div>
                      </div>
                    )}

                    {!hasSubParts && (question.inputStyle === "webpage-wireframe" || question.inputStyle === "form-wireframe") && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Image className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">Wireframe Background Image</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setWireframeBgModalQuestion(question.id)}
                            data-testid={`button-open-wireframe-bg-${question.id}`}
                          >
                            {question.drawingBackgroundUrl ? "Change" : "Add"} Background
                          </Button>
                        </div>
                        {question.drawingBackgroundUrl && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">Background image set</p>
                        )}
                      </div>
                    )}

                    {!hasSubParts && (
                    <div className="p-3 border border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">AI Marking Guidance</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingMarkingGuidanceQuestion(question.id);
                            setMarkingGuidanceModalOpen(true);
                          }}
                          data-testid={`button-open-marking-guidance-${question.id}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {question.markingGuidanceData?.rows?.length ? "Edit" : "Add"} Marking Criteria
                        </Button>
                      </div>
                      {question.markingGuidanceData?.rows?.length ? (
                        <div className="mt-2">
                          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {question.markingGuidanceData.rows.length} marking criteria defined
                            ({question.markingGuidanceData.rows.reduce((sum, r) => sum + (r.marks || 0), 0)} marks)
                          </p>
                          {question.markingGuidanceData.exampleAnswer && (
                            <p className="text-xs text-neutral-500 mt-1">
                              Example answer provided
                            </p>
                          )}
                          {question.markingGuidanceData.exampleImages && question.markingGuidanceData.exampleImages.length > 0 && (
                            <p className="text-xs text-neutral-500 mt-1">
                              {question.markingGuidanceData.exampleImages.length} example screenshot{question.markingGuidanceData.exampleImages.length !== 1 ? 's' : ''} attached
                            </p>
                          )}
                          {question.markingGuidanceData.exampleFiles && question.markingGuidanceData.exampleFiles.length > 0 && (
                            <p className="text-xs text-neutral-500 mt-1">
                              {question.markingGuidanceData.exampleFiles.length} example file{question.markingGuidanceData.exampleFiles.length !== 1 ? 's' : ''}: {question.markingGuidanceData.exampleFiles.map((f: any) => f.originalName).join(', ')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 mt-2">
                          Define expected responses, guidance for the AI grader, and mark allocation for each marking point.
                        </p>
                      )}

                      {(question.inputStyle === "webpage-wireframe" || question.inputStyle === "form-wireframe") && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                          {question.inputConfig?.wireframeExampleData ? "Example drawing provided" : "Open Marking Criteria to add an example drawing"}
                        </p>
                      )}
                      {question.inputStyle === "nav-structure" && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                          {question.inputConfig?.navExampleData ? "Example diagram provided" : "Open Marking Criteria to add an example diagram for the AI to check against"}
                        </p>
                      )}
                    </div>
                    )}

                    {hasSubParts && (
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Subparts</Label>
                          <Button size="sm" variant="outline" onClick={() => addSubPart(question.id)} data-testid={`button-add-subpart-${question.id}`}>
                            <Plus className="w-3 h-3 mr-1" /> Add Subpart
                          </Button>
                        </div>
                        <div className="space-y-2 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                          {question.subParts!.map((sub, subIdx) => (
                            <Collapsible
                              key={sub.id}
                              open={expandedQuestions.has(sub.id)}
                              onOpenChange={() => toggleQuestion(sub.id)}
                            >
                              <Card className="border border-blue-200 dark:border-blue-800">
                                <CollapsibleTrigger asChild>
                                  <CardHeader className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 py-2 px-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        {expandedQuestions.has(sub.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        <span className="text-sm font-medium">{sub.label}: {(() => {
                                          const rawText = sub.contentBlocks?.find(b => b.type === "text" || b.type === "heading")?.content || sub.questionText;
                                          if (!rawText) return "(No text)";
                                          const plainText = rawText.replace(/<[^>]*>/g, "").trim();
                                          return plainText.length > 40 ? plainText.slice(0, 40) + "..." : plainText || "(No text)";
                                        })()}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">{sub.maxMarks}m</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeQuestion(sub.id); }}>
                                          <Trash2 className="w-3 h-3 text-red-500" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <CardContent className="pt-0 pb-3 px-3 space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                      <div>
                                        <Label className="text-xs">Label</Label>
                                        <Input value={sub.label} onChange={(e) => updateQuestion(sub.id, { label: e.target.value })} placeholder="(a), (i)..." className="h-8 text-sm" />
                                      </div>
                                      {!(sub.subParts && sub.subParts.length > 0) ? (
                                      <div>
                                        <Label className="text-xs">Max Marks</Label>
                                        <Input type="number" min={0} value={sub.maxMarks} onChange={(e) => updateQuestion(sub.id, { maxMarks: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                                      </div>
                                      ) : (
                                      <div>
                                        <Label className="text-xs">Marks (auto)</Label>
                                        <div className="h-8 px-2 flex items-center rounded border bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-500">{sub.maxMarks}m</div>
                                      </div>
                                      )}
                                      {!(sub.subParts && sub.subParts.length > 0) && (
                                      <div>
                                        <Label className="text-xs">Input Style</Label>
                                        <Select value={sub.inputStyle} onValueChange={(value) => updateQuestion(sub.id, { inputStyle: value })}>
                                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            {availableStyles.map(style => (
                                              <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      )}
                                    </div>
                                    {!(sub.subParts && sub.subParts.length > 0) && (
                                    <div>
                                      <Label className="text-xs">File Uploads</Label>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {[
                                          { value: "py", label: "Python" },
                                          { value: "html", label: "HTML" },
                                          { value: "css", label: "CSS" },
                                          { value: "screenshot", label: "Screenshot" },
                                        ].map(ft => (
                                          <label key={ft.value} className="flex items-center gap-1 text-xs cursor-pointer">
                                            <input type="checkbox" checked={(sub.allowedFileUploads || []).includes(ft.value)} onChange={e => {
                                              const current = sub.allowedFileUploads || [];
                                              const updated = e.target.checked ? [...current, ft.value] : current.filter(t => t !== ft.value);
                                              updateQuestion(sub.id, { allowedFileUploads: updated });
                                            }} className="rounded" />
                                            {ft.label}
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                    )}
                                    {!(sub.subParts && sub.subParts.length > 0) && sub.inputStyle === "table" && (
                                      <div className="space-y-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                                        <Label className="text-xs text-emerald-700 dark:text-emerald-300">Table Grid Editor</Label>
                                        <MultiGridEditor
                                          grids={sub.inputConfig?.grids || (sub.inputConfig?.grid ? [sub.inputConfig.grid] : [])}
                                          onChange={(grids) => updateQuestion(sub.id, { inputConfig: { ...sub.inputConfig, grids, grid: grids[0] } })}
                                          questionId={sub.id}
                                        />
                                      </div>
                                    )}
                                    {!(sub.subParts && sub.subParts.length > 0) && (sub.inputStyle === "webpage-wireframe" || sub.inputStyle === "form-wireframe") && (
                                      <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium flex items-center gap-1"><Image className="w-3 h-3 text-purple-500" />Background Image</span>
                                          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setWireframeBgModalQuestion(sub.id)} data-testid={`button-open-wireframe-bg-${sub.id}`}>
                                            {sub.drawingBackgroundUrl ? "Change" : "Add"}
                                          </Button>
                                        </div>
                                        {sub.drawingBackgroundUrl && <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">Background image set</p>}
                                      </div>
                                    )}
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold">Content</Label>
                                        <div className="flex gap-0.5">
                                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-1.5" onClick={() => addContentBlock(sub.id, "text")}><Type className="h-2.5 w-2.5 mr-0.5" />Text</Button>
                                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-1.5" onClick={() => addContentBlock(sub.id, "heading")}><Heading className="h-2.5 w-2.5 mr-0.5" />H</Button>
                                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-1.5" onClick={() => addContentBlock(sub.id, "image")}><Image className="h-2.5 w-2.5 mr-0.5" />Img</Button>
                                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-1.5" onClick={() => addContentBlock(sub.id, "code")}><Code className="h-2.5 w-2.5 mr-0.5" />Code</Button>
                                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-1.5" onClick={() => addContentBlock(sub.id, "data-table")}><Table className="h-2.5 w-2.5 mr-0.5" />Table</Button>
                                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-1.5" onClick={() => addContentBlock(sub.id, "pseudocode")}><FileText className="h-2.5 w-2.5 mr-0.5" />Pseudo</Button>
                                        </div>
                                      </div>
                                      {sub.contentBlocks && sub.contentBlocks.length > 0 && (
                                        <div className="space-y-1.5 border rounded p-1.5 bg-neutral-50 dark:bg-neutral-800/50">
                                          {sub.contentBlocks.map((block, blockIndex) => (
                                            <div key={block.id} className="relative border border-neutral-200 dark:border-neutral-700 rounded p-1.5 bg-white dark:bg-neutral-900">
                                              <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-[10px] font-medium text-neutral-400 uppercase">{block.type}</span>
                                                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => removeContentBlock(sub.id, blockIndex)}><X className="h-2.5 w-2.5 text-red-500" /></Button>
                                              </div>
                                              {block.type === "heading" && <Input value={block.content || ""} onChange={(e) => updateContentBlock(sub.id, blockIndex, "content", e.target.value)} placeholder="Heading..." className="h-7 text-sm font-semibold" />}
                                              {block.type === "text" && <div><RichTextEditor content={block.content || ""} onChange={(html) => updateContentBlock(sub.id, blockIndex, "content", html)} placeholder="Text..." /></div>}
                                              {block.type === "image" && (
                                                block.content ? <img src={block.content} alt="Preview" className="max-h-32 rounded border" /> :
                                                <div className="border-2 border-dashed rounded p-2 text-center text-xs text-neutral-400 cursor-pointer" onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.onchange = (ev) => { const file = (ev.target as HTMLInputElement).files?.[0]; if (file) handleImageUpload(sub.id, blockIndex, file); }; input.click(); }}>Upload image</div>
                                              )}
                                              {block.type === "code" && <Textarea value={block.content || ""} onChange={(e) => updateContentBlock(sub.id, blockIndex, "content", e.target.value)} placeholder="Code..." className="text-xs font-mono min-h-[60px] bg-neutral-900 text-green-400" />}
                                              {block.type === "data-table" && block.dataTable && (
                                                <div className="space-y-1">
                                                  <ResponsiveDataTable dataTable={block.dataTable} />
                                                  <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => openTableEditor(sub.id, blockIndex)}>
                                                    <Edit className="h-2.5 w-2.5 mr-0.5" /> Edit Table
                                                  </Button>
                                                </div>
                                              )}
                                              {block.type === "pseudocode" && (
                                                <div className="space-y-1">
                                                  <Input value={block.content || ""} onChange={(e) => updateContentBlock(sub.id, blockIndex, "content", e.target.value)} placeholder="Pseudocode heading..." className="h-7 text-xs font-medium" />
                                                  <div className="border rounded overflow-hidden">
                                                    <table className="w-full text-xs font-mono">
                                                      <tbody>
                                                        {(block.pseudocodeLines || []).map((line: any, lineIndex: number) => (
                                                          <tr key={line.id} className="border-b last:border-b-0">
                                                            <td className="px-1 py-0.5 w-16 border-r bg-neutral-50 dark:bg-neutral-800">
                                                              <Input value={line.lineLabel} onChange={(e) => updatePseudocodeLine(sub.id, blockIndex, lineIndex, "lineLabel", e.target.value)} className="h-6 text-[10px] text-center p-0.5" />
                                                            </td>
                                                            <td className="px-1 py-0.5">
                                                              <Input value={line.content} onChange={(e) => updatePseudocodeLine(sub.id, blockIndex, lineIndex, "content", e.target.value)} className="h-6 text-[10px] font-mono p-0.5" />
                                                            </td>
                                                          </tr>
                                                        ))}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                  <Button size="sm" variant="outline" className="h-5 text-[9px]" onClick={() => {
                                                    const lines = [...(block.pseudocodeLines || [])];
                                                    lines.push({ id: `line-${Date.now()}`, lineLabel: `Line ${lines.length + 1}`, content: "" });
                                                    updateContentBlock(sub.id, blockIndex, "pseudocodeLines", lines);
                                                  }}>+ Line</Button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {!(sub.subParts && sub.subParts.length > 0) && (
                                    <div className="p-2 border border-dashed border-neutral-300 dark:border-neutral-600 rounded">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium flex items-center gap-1"><ClipboardList className="w-3 h-3 text-blue-500" />AI Marking Guidance</span>
                                        <Button type="button" variant="outline" size="sm" className="h-6 text-xs" onClick={() => { setEditingMarkingGuidanceQuestion(sub.id); setMarkingGuidanceModalOpen(true); }}>
                                          <Edit className="w-3 h-3 mr-1" />{sub.markingGuidanceData?.rows?.length ? "Edit" : "Add"}
                                        </Button>
                                      </div>
                                      {sub.markingGuidanceData?.rows?.length ? (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">{sub.markingGuidanceData.rows.length} criteria ({sub.markingGuidanceData.rows.reduce((sum, r) => sum + (r.marks || 0), 0)} marks)</p>
                                      ) : <p className="text-[10px] text-neutral-500 mt-1">No marking criteria yet</p>}
                                    </div>
                                    )}

                                    {sub.subParts && sub.subParts.length > 0 && (
                                      <div className="space-y-2 pl-3 border-l-2 border-purple-200 dark:border-purple-800 mt-2">
                                        <Label className="text-xs font-semibold text-purple-700 dark:text-purple-300">Sub-subparts</Label>
                                        {sub.subParts.map((ssub, ssubIdx) => (
                                          <div key={ssub.id} className="border border-purple-200 dark:border-purple-800 rounded p-2 bg-purple-50/30 dark:bg-purple-950/20 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs font-medium">{ssub.label}</span>
                                              <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">{ssub.maxMarks}m</span>
                                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeQuestion(ssub.id)}><Trash2 className="w-2.5 h-2.5 text-red-500" /></Button>
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                              <Input value={ssub.label} onChange={(e) => updateQuestion(ssub.id, { label: e.target.value })} placeholder="Label" className="h-7 text-xs" />
                                              <Input type="number" min={0} value={ssub.maxMarks} onChange={(e) => updateQuestion(ssub.id, { maxMarks: parseInt(e.target.value) || 0 })} className="h-7 text-xs" />
                                              <Select value={ssub.inputStyle} onValueChange={(value) => updateQuestion(ssub.id, { inputStyle: value })}>
                                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>{availableStyles.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                                              </Select>
                                            </div>
                                            {ssub.inputStyle === "table" && (
                                              <div className="space-y-1 p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded">
                                                <Label className="text-[9px] text-emerald-700 dark:text-emerald-300">Table Grid</Label>
                                                <MultiGridEditor
                                                  grids={ssub.inputConfig?.grids || (ssub.inputConfig?.grid ? [ssub.inputConfig.grid] : [])}
                                                  onChange={(grids) => updateQuestion(ssub.id, { inputConfig: { ...ssub.inputConfig, grids, grid: grids[0] } })}
                                                  questionId={ssub.id}
                                                />
                                              </div>
                                            )}
                                            {(ssub.inputStyle === "webpage-wireframe" || ssub.inputStyle === "form-wireframe") && (
                                              <div className="p-1.5 bg-purple-50 dark:bg-purple-950/30 rounded">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[9px] font-medium flex items-center gap-1"><Image className="w-2.5 h-2.5 text-purple-500" />Background</span>
                                                  <Button size="sm" variant="outline" className="h-5 text-[9px]" onClick={() => setWireframeBgModalQuestion(ssub.id)} data-testid={`button-open-wireframe-bg-${ssub.id}`}>
                                                    {ssub.drawingBackgroundUrl ? "Change" : "Add"}
                                                  </Button>
                                                </div>
                                                {ssub.drawingBackgroundUrl && <p className="text-[9px] text-green-600 dark:text-green-400 mt-0.5">Background set</p>}
                                              </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                              <div className="flex gap-0.5">
                                                <Button size="sm" variant="outline" className="h-5 text-[9px] px-1" onClick={() => addContentBlock(ssub.id, "text")}><Type className="h-2 w-2 mr-0.5" />T</Button>
                                                <Button size="sm" variant="outline" className="h-5 text-[9px] px-1" onClick={() => addContentBlock(ssub.id, "image")}><Image className="h-2 w-2 mr-0.5" />I</Button>
                                                <Button size="sm" variant="outline" className="h-5 text-[9px] px-1" onClick={() => addContentBlock(ssub.id, "code")}><Code className="h-2 w-2 mr-0.5" />C</Button>
                                                <Button size="sm" variant="outline" className="h-5 text-[9px] px-1" onClick={() => addContentBlock(ssub.id, "data-table")}><Table className="h-2 w-2 mr-0.5" />Tbl</Button>
                                              </div>
                                              <Button type="button" variant="outline" size="sm" className="h-5 text-[9px]" onClick={() => { setEditingMarkingGuidanceQuestion(ssub.id); setMarkingGuidanceModalOpen(true); }}>
                                                <ClipboardList className="w-2.5 h-2.5 mr-0.5" />{ssub.markingGuidanceData?.rows?.length ? `${ssub.markingGuidanceData.rows.length} criteria` : "Marking"}
                                              </Button>
                                            </div>
                                            {ssub.contentBlocks && ssub.contentBlocks.length > 0 && (
                                              <div className="space-y-1 border rounded p-1 bg-white dark:bg-neutral-900">
                                                {ssub.contentBlocks.map((block, bi) => (
                                                  <div key={block.id} className="flex items-start gap-1 text-xs">
                                                    <span className="text-[9px] text-neutral-400 uppercase shrink-0 mt-1">{block.type}</span>
                                                    <div className="flex-1 min-w-0">
                                                      {block.type === "text" && <div><RichTextEditor content={block.content || ""} onChange={(html) => updateContentBlock(ssub.id, bi, "content", html)} placeholder="Text..." /></div>}
                                                      {block.type === "heading" && <Input value={block.content || ""} onChange={(e) => updateContentBlock(ssub.id, bi, "content", e.target.value)} placeholder="Heading..." className="h-6 text-xs" />}
                                                      {block.type === "image" && (block.content ? <img src={block.content} alt="" className="max-h-20 rounded" /> : <Input value="" onChange={(e) => updateContentBlock(ssub.id, bi, "content", e.target.value)} placeholder="Image URL..." className="h-6 text-xs" />)}
                                                      {block.type === "code" && <Textarea value={block.content || ""} onChange={(e) => updateContentBlock(ssub.id, bi, "content", e.target.value)} className="text-xs font-mono min-h-[40px] bg-neutral-900 text-green-400" />}
                                                      {block.type === "data-table" && block.dataTable && (
                                                        <div className="space-y-1">
                                                          <ResponsiveDataTable dataTable={block.dataTable} />
                                                          <Button size="sm" variant="outline" className="h-5 text-[9px]" onClick={() => openTableEditor(ssub.id, bi)}>
                                                            <Edit className="h-2 w-2 mr-0.5" /> Edit Table
                                                          </Button>
                                                        </div>
                                                      )}
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => removeContentBlock(ssub.id, bi)}><X className="h-2.5 w-2.5 text-red-500" /></Button>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            <div className="flex gap-1">
                                              <Button variant="outline" size="sm" className="h-5 text-[9px]" onClick={() => moveSubPart(sub.id, ssubIdx, "up")} disabled={ssubIdx === 0}>Up</Button>
                                              <Button variant="outline" size="sm" className="h-5 text-[9px]" onClick={() => moveSubPart(sub.id, ssubIdx, "down")} disabled={ssubIdx === (sub.subParts?.length || 1) - 1}>Down</Button>
                                            </div>
                                          </div>
                                        ))}
                                        <Button variant="outline" size="sm" className="h-6 text-xs text-purple-600 border-purple-300" onClick={() => addSubPart(sub.id)}>
                                          <Plus className="w-2.5 h-2.5 mr-0.5" /> Add Sub-subpart
                                        </Button>
                                      </div>
                                    )}

                                    {!(sub.subParts && sub.subParts.length > 0) && getQuestionDepth(questions, sub.id) <= 1 && (
                                      <Button variant="outline" size="sm" className="h-6 text-xs text-purple-600 border-purple-300" onClick={() => addSubPart(sub.id)}>
                                        <Plus className="w-2.5 h-2.5 mr-0.5" /> Add Sub-subpart
                                      </Button>
                                    )}

                                    <div className="flex gap-1">
                                      <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => moveSubPart(question.id, subIdx, "up")} disabled={subIdx === 0}>Up</Button>
                                      <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => moveSubPart(question.id, subIdx, "down")} disabled={subIdx === (question.subParts?.length || 1) - 1}>Down</Button>
                                    </div>
                                  </CardContent>
                                </CollapsibleContent>
                              </Card>
                            </Collapsible>
                          ))}
                        </div>
                      </div>
                    )}

                    {canAddSubParts && !hasSubParts && (
                      <Button variant="outline" size="sm" onClick={() => addSubPart(question.id)} className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/30" data-testid={`button-add-subpart-${question.id}`}>
                        <Plus className="w-3 h-3 mr-1" /> Add Subpart
                      </Button>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveQuestion(index, "up")}
                        disabled={index === 0}
                      >
                        Move Up
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveQuestion(index, "down")}
                        disabled={index === questions.length - 1}
                      >
                        Move Down
                      </Button>
                    </div>
                    </>
                      );
                    })()}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Data Table Editor Modal */}
      <DataTableEditorModal
        open={tableEditorOpen}
        onOpenChange={(open) => {
          setTableEditorOpen(open);
          if (!open) setEditingTableBlock(null);
        }}
        dataTable={getEditingDataTable()}
        onSave={handleSaveTable}
      />

      {wireframeBgModalQuestion && (() => {
        const bgQ = findQuestionDeep(questions, wireframeBgModalQuestion);
        return (
          <Dialog open={!!wireframeBgModalQuestion} onOpenChange={(open) => { if (!open) setWireframeBgModalQuestion(null); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Wireframe Background Image</DialogTitle>
                <DialogDescription>
                  Upload an image to use as the starting content of the wireframe canvas. Students will see this as the background when building their design, and it will also appear in the teacher example used for AI grading.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {bgQ?.drawingBackgroundUrl ? (
                  <div className="space-y-3">
                    <div className="border rounded-lg overflow-hidden bg-white dark:bg-neutral-900 p-2">
                      <img
                        src={bgQ.drawingBackgroundUrl}
                        alt="Wireframe background"
                        className="max-h-64 mx-auto rounded"
                        data-testid="img-wireframe-bg-modal"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append("file", file);
                            const response = await fetch("/api/upload", { method: "POST", body: formData });
                            if (response.ok) {
                              const data = await response.json();
                              updateQuestion(wireframeBgModalQuestion, { drawingBackgroundUrl: data.url });
                            }
                          };
                          input.click();
                        }}
                        data-testid="button-replace-wireframe-bg"
                      >
                        <Image className="w-3 h-3 mr-1" /> Replace Image
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => {
                          updateQuestion(wireframeBgModalQuestion, { drawingBackgroundUrl: undefined });
                        }}
                        data-testid="button-remove-wireframe-bg"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg p-8 text-center cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append("file", file);
                        const response = await fetch("/api/upload", { method: "POST", body: formData });
                        if (response.ok) {
                          const data = await response.json();
                          updateQuestion(wireframeBgModalQuestion, { drawingBackgroundUrl: data.url });
                        }
                      };
                      input.click();
                    }}
                    data-testid="button-upload-wireframe-bg"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Click to upload a background image</p>
                    <p className="text-xs text-purple-400 mt-1">PNG, JPG, or SVG</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Marking Guidance Modal */}
      {editingMarkingGuidanceQuestion && (
        <MarkingGuidanceModalConnector
          questionId={editingMarkingGuidanceQuestion}
          activeQ={findQuestionDeep(questions, editingMarkingGuidanceQuestion)}
          open={markingGuidanceModalOpen}
          onClose={() => {
            setMarkingGuidanceModalOpen(false);
            setEditingMarkingGuidanceQuestion(null);
          }}
          updateQuestion={updateQuestion}
        />
      )}
    </div>
  );
}

function BaseNavDiagramFieldEditor({
  questionId,
  inputConfig,
  updateQuestion,
}: {
  questionId: string;
  inputConfig: AssignmentQuestion["inputConfig"];
  updateQuestion: (id: string, updates: Partial<AssignmentQuestion>) => void;
}) {
  const inputConfigRef = useRef(inputConfig);
  const updateQuestionRef = useRef(updateQuestion);
  useEffect(() => {
    inputConfigRef.current = inputConfig;
  }, [inputConfig]);
  useEffect(() => {
    updateQuestionRef.current = updateQuestion;
  }, [updateQuestion]);

  const handleChange = useCallback(
    (data: string) => {
      updateQuestionRef.current(questionId, {
        inputConfig: {
          ...(inputConfigRef.current || {}),
          baseNavDiagram: data,
        },
      });
    },
    [questionId],
  );

  return (
    <DiagramEditor
      initialData={inputConfig?.baseNavDiagram || ""}
      onChange={handleChange}
      mode="nav-structure"
    />
  );
}

function MarkingGuidanceModalConnector({
  questionId,
  activeQ,
  open,
  onClose,
  updateQuestion,
}: {
  questionId: string;
  activeQ: AssignmentQuestion | undefined;
  open: boolean;
  onClose: () => void;
  updateQuestion: (id: string, updates: Partial<AssignmentQuestion>) => void;
}) {
  const activeQRef = useRef(activeQ);
  const updateQuestionRef = useRef(updateQuestion);
  useEffect(() => {
    activeQRef.current = activeQ;
  }, [activeQ]);
  useEffect(() => {
    updateQuestionRef.current = updateQuestion;
  }, [updateQuestion]);

  const isWireframe = activeQ?.inputStyle === "webpage-wireframe" || activeQ?.inputStyle === "form-wireframe";
  const isNavStructure = activeQ?.inputStyle === "nav-structure";
  const wfMode = activeQ?.inputStyle === "webpage-wireframe" ? "webpage-wireframe" as const
    : activeQ?.inputStyle === "form-wireframe" ? "form-wireframe" as const
    : undefined;
  const diagramMode = isNavStructure ? "nav-structure" as const : undefined;
  const diagramExampleData = isNavStructure ? activeQ?.inputConfig?.navExampleData : undefined;
  const diagramExampleCanvas = isNavStructure ? activeQ?.inputConfig?.navExampleCanvas : undefined;

  const handleSave = useCallback(
    (data: MarkingGuidanceData) => {
      updateQuestionRef.current(questionId, { markingGuidanceData: data });
    },
    [questionId],
  );

  const handleWireframeChange = useCallback(
    (dataStr: string, drawingStr: string) => {
      updateQuestionRef.current(questionId, {
        inputConfig: {
          ...(activeQRef.current?.inputConfig || {}),
          wireframeExampleData: dataStr,
          wireframeExampleCanvas: drawingStr,
        },
      });
    },
    [questionId],
  );

  const handleWireframeClear = useCallback(() => {
    updateQuestionRef.current(questionId, {
      inputConfig: {
        ...(activeQRef.current?.inputConfig || {}),
        wireframeExampleData: undefined,
        wireframeExampleCanvas: undefined,
      },
    });
  }, [questionId]);

  const handleDiagramChange = useCallback(
    (dataStr: string, drawingStr: string) => {
      updateQuestionRef.current(questionId, {
        inputConfig: {
          ...(activeQRef.current?.inputConfig || {}),
          navExampleData: dataStr,
          navExampleCanvas: drawingStr,
        },
      });
    },
    [questionId],
  );

  const handleDiagramClear = useCallback(() => {
    updateQuestionRef.current(questionId, {
      inputConfig: {
        ...(activeQRef.current?.inputConfig || {}),
        navExampleData: undefined,
        navExampleCanvas: undefined,
      },
    });
  }, [questionId]);

  return (
    <MarkingGuidanceModal
      open={open}
      onClose={onClose}
      initialData={activeQ?.markingGuidanceData}
      onSave={handleSave}
      questionLabel={activeQ?.label || ""}
      maxMarks={activeQ?.maxMarks || 0}
      wireframeMode={wfMode}
      wireframeExampleData={activeQ?.inputConfig?.wireframeExampleData}
      wireframeExampleCanvas={activeQ?.inputConfig?.wireframeExampleCanvas}
      wireframeBackgroundUrl={isWireframe ? activeQ?.drawingBackgroundUrl : undefined}
      onWireframeChange={isWireframe ? handleWireframeChange : undefined}
      onWireframeClear={isWireframe ? handleWireframeClear : undefined}
      diagramMode={diagramMode}
      diagramExampleData={diagramExampleData}
      diagramExampleCanvas={diagramExampleCanvas}
      onDiagramChange={isNavStructure ? handleDiagramChange : undefined}
      onDiagramClear={isNavStructure ? handleDiagramClear : undefined}
    />
  );
}
