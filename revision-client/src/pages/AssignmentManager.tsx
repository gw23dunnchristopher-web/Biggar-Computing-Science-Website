import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/mode-toggle";
import { RichTextEditor, RichTextDisplay } from "@/components/ui/rich-text-editor";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { DiagramEditor } from "@/components/ui/diagram-editor";
import {
  ArrowLeft, ArrowUp, ArrowDown, Plus, Pencil, Trash2, Clock, FileText,
  Eye, EyeOff, ChevronDown, ChevronRight, Loader2, X, Upload,
  ClipboardList, ClipboardCheck, Check, Code, Table, Type, Image, FileCode, Columns, Unlink,
  HelpCircle, Download, Clipboard, Save, Settings2, Grid3X3, Minus, Database, Users
} from "lucide-react";
import { DatabaseSchemaEditor, DatabaseSchemaDisplay } from "@/components/ui/database-schema-editor";

interface ContentBlock {
  id: string;
  type: "text" | "image" | "code" | "data-table" | "pseudocode" | "heading" | "row-layout" | "database-schema";
  content: string;
  caption?: string;
  imageSize?: string;
  dataTable?: {
    tableName: string;
    columns: { id: string; header: string; align?: string; width?: string }[];
    rows: { id: string; cells: (string | { value: string; role?: "data" | "title" | "header"; colSpan?: number; rowSpan?: number; hidden?: boolean })[] }[];
    hideHeaders?: boolean;
    centered?: boolean;
    verticalAlign?: string;
  };
  pseudocode?: {
    heading: string;
    lines: { id: string; label: string; code: string }[];
  };
  databaseSchema?: {
    tables: { id: string; name: string; fields: { id: string; name: string; isPrimaryKey?: boolean; isForeignKey?: boolean }[] }[];
  };
  children?: ContentBlock[];
}

interface ChecklistItem {
  id: string;
  sectionType: string;
  partLabel: string;
  questionNumber: string;
  description: string;
}

interface MarkingGuidanceRow {
  id: string;
  part: string;
  expectedResponse: string;
  additionalGuidance: string;
  marks: number;
}

interface MarkingGuidanceData {
  rows: MarkingGuidanceRow[];
  exampleAnswer: string;
  exampleImages?: string[];
  exampleFiles?: { url: string; originalName: string }[];
}

interface GridCell {
  key?: string;
  value?: string;
  isInput?: boolean;
  isHeading?: boolean;
  placeholder?: string;
  starterText?: string;
  colSpan?: number;
  rowSpan?: number;
  hidden?: boolean;
}

interface GridConfig {
  title?: string;
  headers: string[];
  showHeaders?: boolean;
  colWidths?: string[];
  rowMinHeights?: string[];
  rows: Array<{
    cells: Array<GridCell>;
  }>;
  constraints?: Record<string, string>;
}

interface AssignmentQuestion {
  id: string;
  label: string;
  questionText: string;
  contentBlocks?: ContentBlock[];
  maxMarks: number;
  inputStyle: string;
  aiGuidance: string;
  markingGuidanceData?: MarkingGuidanceData | null;
  markingScheme: string[];
  allowedFileUploads?: string[];
  requiresStudentCode?: boolean;
  allowFileUpload?: boolean;
  subParts?: AssignmentQuestion[];
  inputConfig?: {
    fields?: { key: string; label: string }[];
    maxScreenshots?: number;
    screenshotInstructions?: string;
    maxFiles?: number;
    maxFileSizeKB?: number;
    grid?: GridConfig;
    grids?: GridConfig[];
    erdStarterDiagram?: string;
    erdModelAnswer?: string;
    baseErdDiagram?: string;
    baseNavDiagram?: string;
    navModelAnswer?: string;
  };
}

interface AssignmentResource {
  id: string;
  partId: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  description: string | null;
}

interface AssignmentPart {
  id: string;
  sectionId: string;
  partLabel: string;
  title: string | null;
  instructions: string | null;
  contentBlocks?: ContentBlock[] | null;
  maxMarks: number | null;
  orderIndex: number | null;
  isPractical: boolean | null;
  aiGradingGuidance: string | null;
  subQuestions: AssignmentQuestion[] | null;
  requiresUpload: boolean | null;
  inputStyle: string | null;
  resources?: AssignmentResource[];
}

interface AssignmentSection {
  id: string;
  assignmentId: string;
  sectionType: string;
  title: string;
  isCompulsory: boolean | null;
  orderIndex: number | null;
  informationSheet?: ContentBlock[] | null;
  parts?: AssignmentPart[];
}

interface Assignment {
  id: string;
  year: number;
  title: string;
  totalMarks: number | null;
  totalTimeMinutes: number | null;
  isPublished: boolean | null;
  evidenceChecklist?: ChecklistItem[] | null;
  createdAt: string | null;
  sections?: AssignmentSection[];
}

const SECTION_TYPES = [
  { id: "sdd", name: "Software Design and Development", compulsory: true },
  { id: "database", name: "Database Design and Development", compulsory: false },
  { id: "web", name: "Web Design and Development", compulsory: false },
];

const INPUT_STYLES = [
  { value: "info-only", label: "Info Only (no answer required)" },
  { value: "text", label: "Text Answer" },
  { value: "code-editor", label: "Code Editor" },
  { value: "labeled-inputs", label: "Labeled Inputs" },
  { value: "drawing", label: "Drawing/Diagram" },
  { value: "erd-diagram", label: "ERD Diagram" },
  { value: "table", label: "Table Input" },
  { value: "design-choice", label: "Design Choice (Pseudocode or Structure Diagram)" },
  { value: "file-upload", label: "File Upload Only" },
  { value: "form-wireframe", label: "Form Wireframe" },
  { value: "nav-structure", label: "Navigation Diagram" },
];

const PART_INPUT_STYLES = [
  { value: "info-only", label: "Info Only (no answer required)" },
  { value: "text", label: "Text Answer" },
  { value: "erd-diagram", label: "ERD Diagram" },
  { value: "html-upload", label: "HTML File Upload" },
  { value: "py-upload", label: "Python File Upload" },
  { value: "design-choice", label: "Design Choice" },
];

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;
};

function getLeafQuestions(questions: AssignmentQuestion[]): AssignmentQuestion[] {
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

function getTotalMarks(questions: AssignmentQuestion[]): number {
  return getLeafQuestions(questions).reduce((sum, q) => sum + (q.maxMarks || 0), 0);
}

function ContentBlockEditor({
  blocks,
  onChange,
  allowGrouping = false,
}: {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  allowGrouping?: boolean;
}) {
  const [editingDataTableBlockId, setEditingDataTableBlockId] = useState<string | null>(null);
  const editingDataTableBlock = editingDataTableBlockId ? blocks.find(b => b.id === editingDataTableBlockId) : undefined;

  const addBlock = (type: ContentBlock["type"]) => {
    const id = `block-${Date.now()}`;
    let newBlock: ContentBlock = { id, type, content: "" };
    if (type === "code") newBlock.content = "// Enter code here...";
    if (type === "data-table") {
      newBlock.dataTable = {
        tableName: "",
        columns: [
          { id: "col1", header: "Column 1" },
          { id: "col2", header: "Column 2" },
          { id: "col3", header: "Column 3" },
        ],
        rows: [
          { id: "row1", cells: ["", "", ""] },
          { id: "row2", cells: ["", "", ""] },
          { id: "row3", cells: ["", "", ""] },
        ],
      };
    }
    if (type === "pseudocode") {
      newBlock.pseudocode = {
        heading: "",
        lines: [{ id: `line-${Date.now()}`, label: "1", code: "" }],
      };
    }
    if (type === "database-schema") {
      newBlock.databaseSchema = {
        tables: [{ id: `tbl-${Date.now()}`, name: "TableName", fields: [{ id: `fld-${Date.now()}`, name: "fieldName", isPrimaryKey: true }] }],
      };
    }
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (index: number, updated: ContentBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updated;
    onChange(newBlocks);
  };

  const removeBlock = (index: number) => {
    const block = blocks[index];
    if (block.type === "row-layout" && block.children) {
      if (block.children.length === 1) {
        const newBlocks = [...blocks];
        newBlocks.splice(index, 1, block.children[0]);
        onChange(newBlocks);
        return;
      }
    }
    onChange(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    onChange(newBlocks);
  };

  const groupWithNext = (index: number) => {
    if (index >= blocks.length - 1) return;
    const block1 = blocks[index];
    const block2 = blocks[index + 1];
    if (block1.type === "row-layout" || block2.type === "row-layout") return;
    const rowLayout: ContentBlock = {
      id: `block-${Date.now()}`,
      type: "row-layout",
      content: "",
      children: [block1, block2],
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index, 2, rowLayout);
    onChange(newBlocks);
  };

  const ungroupBlock = (index: number) => {
    const block = blocks[index];
    if (block.type !== "row-layout" || !block.children) return;
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1, ...block.children);
    onChange(newBlocks);
  };

  const handleImagePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          addBlock("image");
          const newBlocks = [...blocks];
          newBlocks.push({ id: `block-${Date.now()}`, type: "image", content: dataUrl });
          onChange(newBlocks);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }, [blocks, onChange]);

  const renderBlockEditor = (block: ContentBlock, index: number, isChild = false) => {
    const bgClass = isChild ? "bg-white dark:bg-neutral-950" : "bg-neutral-50 dark:bg-neutral-900";
    return (
      <div key={block.id} className={`border rounded-lg p-3 ${bgClass}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase text-neutral-500 font-medium">
            {block.type === "row-layout" ? "Side-by-Side Group" : block.type}
          </span>
          <div className="flex items-center gap-1">
            {allowGrouping && !isChild && block.type !== "row-layout" && index < blocks.length - 1 && blocks[index + 1]?.type !== "row-layout" && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600" onClick={() => groupWithNext(index)} title="Group with next">
                <Columns className="h-3 w-3" />
              </Button>
            )}
            {!isChild && (
              <>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveBlock(index, "up")} disabled={index === 0}>
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveBlock(index, "down")} disabled={index === blocks.length - 1}>
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={() => {
              if (isChild) {
                return;
              }
              removeBlock(index);
            }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {block.type === "heading" && (
          <Input
            value={block.content}
            onChange={(e) => updateBlock(index, { ...block, content: e.target.value })}
            placeholder="Section heading"
            className="font-medium"
          />
        )}

        {block.type === "text" && (
          <RichTextEditor
            value={block.content}
            onChange={(val) => updateBlock(index, { ...block, content: val })}
            placeholder="Enter text content..."
            rows={4}
          />
        )}

        {block.type === "image" && (
          <div className="space-y-2">
            {block.content ? (
              <img src={block.content} alt="Preview" className="max-h-32 rounded border" />
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => updateBlock(index, { ...block, content: ev.target?.result as string });
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }}
              >
                <Upload className="h-6 w-6 mx-auto mb-1 text-neutral-400" />
                <p className="text-sm text-neutral-500">Drag & drop, paste, or click to upload</p>
                <p className="text-xs text-neutral-400">Or enter URL below</p>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={block.content?.startsWith("data:") ? "(pasted image)" : block.content || ""}
                onChange={(e) => updateBlock(index, { ...block, content: e.target.value })}
                placeholder="Image URL"
                readOnly={block.content?.startsWith("data:")}
                className="flex-1"
              />
              {block.content && (
                <Button variant="ghost" size="sm" onClick={() => updateBlock(index, { ...block, content: "" })}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Input
              value={block.caption || ""}
              onChange={(e) => updateBlock(index, { ...block, caption: e.target.value })}
              placeholder="Caption (optional)"
              className="text-sm"
            />
            <Select value={block.imageSize || "medium"} onValueChange={(v) => updateBlock(index, { ...block, imageSize: v })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="full">Full Width</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {block.type === "code" && (
          <Textarea
            value={block.content}
            onChange={(e) => updateBlock(index, { ...block, content: e.target.value })}
            className="font-mono text-sm"
            rows={5}
          />
        )}

        {block.type === "data-table" && block.dataTable && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-500">
                {block.dataTable.tableName ? `"${block.dataTable.tableName}" — ` : ""}
                {block.dataTable.columns.length} columns, {block.dataTable.rows.length} rows
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingDataTableBlockId(block.id)}
                data-testid={`button-configure-datatable-${block.id}`}
              >
                <Grid3X3 className="h-3 w-3 mr-1" /> Configure Table
              </Button>
            </div>
            <ResponsiveDataTable dataTable={block.dataTable} />
          </div>
        )}

        {block.type === "pseudocode" && block.pseudocode && (
          <div className="space-y-2">
            <Input
              value={block.pseudocode.heading}
              onChange={(e) => updateBlock(index, { ...block, pseudocode: { ...block.pseudocode!, heading: e.target.value } })}
              placeholder="Pseudocode heading"
              className="font-medium"
            />
            <table className="w-full border-collapse">
              <tbody>
                {block.pseudocode.lines.map((line, li) => (
                  <tr key={line.id}>
                    <td className="border p-1 w-16">
                      <Input
                        value={line.label}
                        onChange={(e) => {
                          const newLines = [...block.pseudocode!.lines];
                          newLines[li] = { ...newLines[li], label: e.target.value };
                          updateBlock(index, { ...block, pseudocode: { ...block.pseudocode!, lines: newLines } });
                        }}
                        className="h-7 text-xs text-right"
                      />
                    </td>
                    <td className="border p-1">
                      <Input
                        value={line.code}
                        onChange={(e) => {
                          const newLines = [...block.pseudocode!.lines];
                          newLines[li] = { ...newLines[li], code: e.target.value };
                          updateBlock(index, { ...block, pseudocode: { ...block.pseudocode!, lines: newLines } });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Tab") {
                            e.preventDefault();
                            const target = e.target as HTMLInputElement;
                            const start = target.selectionStart || 0;
                            const newCode = line.code.slice(0, start) + "    " + line.code.slice(start);
                            const newLines = [...block.pseudocode!.lines];
                            newLines[li] = { ...newLines[li], code: newCode };
                            updateBlock(index, { ...block, pseudocode: { ...block.pseudocode!, lines: newLines } });
                            setTimeout(() => target.setSelectionRange(start + 4, start + 4), 0);
                          }
                        }}
                        className="h-7 text-xs font-mono"
                      />
                    </td>
                    <td className="border p-1 w-8">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => {
                        if (block.pseudocode!.lines.length <= 1) return;
                        const newLines = block.pseudocode!.lines.filter((_, i) => i !== li);
                        updateBlock(index, { ...block, pseudocode: { ...block.pseudocode!, lines: newLines } });
                      }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button variant="outline" size="sm" onClick={() => {
              const lastLine = block.pseudocode!.lines[block.pseudocode!.lines.length - 1];
              let nextLabel = "1";
              if (lastLine) {
                const parts = lastLine.label.split(".");
                if (parts.length > 1) {
                  const last = parseInt(parts[parts.length - 1]);
                  parts[parts.length - 1] = String((isNaN(last) ? 0 : last) + 1);
                  nextLabel = parts.join(".");
                } else {
                  const num = parseInt(lastLine.label);
                  nextLabel = String((isNaN(num) ? 0 : num) + 1);
                }
              }
              const newLine = { id: `line-${Date.now()}`, label: nextLabel, code: "" };
              updateBlock(index, { ...block, pseudocode: { ...block.pseudocode!, lines: [...block.pseudocode!.lines, newLine] } });
            }}>
              Add Line
            </Button>
          </div>
        )}

        {block.type === "database-schema" && (
          <div className="space-y-2">
            <DatabaseSchemaEditor
              value={block.databaseSchema}
              onChange={(schema) => updateBlock(index, { ...block, databaseSchema: schema })}
            />
            {block.databaseSchema && <DatabaseSchemaDisplay schema={block.databaseSchema} />}
          </div>
        )}

        {block.type === "row-layout" && block.children && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs text-neutral-500">
              <span>These blocks display side-by-side to students.</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => ungroupBlock(index)}>
                <Unlink className="h-3 w-3 mr-1" /> Ungroup
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {block.children.map((child, ci) => (
                <div key={child.id}>
                  {renderBlockEditor(child, ci, true)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3" onPaste={handleImagePaste}>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => addBlock("heading")} data-testid="button-add-heading">
          <Type className="h-3 w-3 mr-1" /> Heading
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock("text")} data-testid="button-add-text">
          <FileText className="h-3 w-3 mr-1" /> Text
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock("image")} data-testid="button-add-image">
          <Image className="h-3 w-3 mr-1" /> Image
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock("code")} data-testid="button-add-code">
          <Code className="h-3 w-3 mr-1" /> Code
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock("data-table")} data-testid="button-add-table">
          <Table className="h-3 w-3 mr-1" /> Table
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock("pseudocode")} data-testid="button-add-pseudocode">
          <FileCode className="h-3 w-3 mr-1" /> Pseudocode
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock("database-schema")} data-testid="button-add-db-schema">
          <Database className="h-3 w-3 mr-1" /> DB Schema
        </Button>
      </div>
      <p className="text-xs text-neutral-500">Add context, images, code snippets that students will see before the tasks.</p>
      <div className="space-y-2">
        {blocks.map((block, index) => renderBlockEditor(block, index))}
      </div>
      <DataTableConfigModal
        open={!!editingDataTableBlockId}
        onOpenChange={(open) => { if (!open) setEditingDataTableBlockId(null); }}
        dataTable={editingDataTableBlock?.dataTable}
        onSave={(dt) => {
          if (editingDataTableBlockId) {
            const newBlocks = blocks.map(b =>
              b.id === editingDataTableBlockId ? { ...b, dataTable: dt } : b
            );
            onChange(newBlocks);
          }
        }}
      />
    </div>
  );
}

function ContentBlockPreview({ blocks }: { blocks: ContentBlock[] }) {
  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case "heading":
        return <h3 className="text-lg font-bold mt-4 mb-2">{block.content}</h3>;
      case "text":
        return <RichTextDisplay content={block.content} className="mb-2" />;
      case "image":
        return (
          <div className="my-2">
            <img
              src={block.content}
              alt={block.caption || ""}
              className={`rounded border ${block.imageSize === "small" ? "max-w-xs" : block.imageSize === "large" ? "max-w-2xl" : block.imageSize === "full" ? "w-full" : "max-w-md"}`}
            />
            {block.caption && <p className="text-xs text-neutral-500 mt-1">{block.caption}</p>}
          </div>
        );
      case "code":
        return <pre className="bg-neutral-100 dark:bg-neutral-800 rounded p-3 text-sm font-mono overflow-x-auto my-2">{block.content}</pre>;
      case "data-table":
        return block.dataTable ? <div className="my-2"><ResponsiveDataTable dataTable={block.dataTable} /></div> : null;
      case "database-schema":
        return block.databaseSchema ? <div className="my-2"><DatabaseSchemaDisplay schema={block.databaseSchema} /></div> : null;
      case "pseudocode":
        if (!block.pseudocode) return null;
        return (
          <div className="my-2 border rounded overflow-hidden">
            {block.pseudocode.heading && (
              <div className="bg-neutral-200 dark:bg-neutral-700 px-3 py-1 font-mono text-sm font-bold">{block.pseudocode.heading}</div>
            )}
            <table className="w-full text-sm">
              <tbody>
                {block.pseudocode.lines.map((line) => (
                  <tr key={line.id} className="border-t">
                    <td className="px-2 py-1 text-right text-neutral-500 w-12 font-mono">{line.label}</td>
                    <td className="px-2 py-1 font-mono whitespace-pre">{line.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "row-layout":
        return (
          <div className="grid grid-cols-2 gap-4 my-2">
            {block.children?.map((child) => (
              <div key={child.id}>{renderBlock(child)}</div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return <div>{blocks.map((block) => <div key={block.id}>{renderBlock(block)}</div>)}</div>;
}

function PartCard({
  part,
  onEdit,
  onDelete,
  onUploadResource,
  onDeleteResource,
}: {
  part: AssignmentPart;
  onEdit: () => void;
  onDelete: () => void;
  onUploadResource: (file: File, description: string) => void;
  onDeleteResource: (resourceId: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resourceDescription, setResourceDescription] = useState("");
  const [showFiles, setShowFiles] = useState(!!part.resources?.length);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setIsUploading(true);
    for (const file of Array.from(files)) {
      await onUploadResource(file, resourceDescription);
    }
    setResourceDescription("");
    setIsUploading(false);
  };

  const subQCount = part.subQuestions ? getLeafQuestions(part.subQuestions).length : 0;
  const subQMarks = part.subQuestions ? getTotalMarks(part.subQuestions) : 0;

  return (
    <div className="border rounded p-3 bg-white dark:bg-neutral-900" data-testid={`card-part-${part.id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">Part {part.partLabel}</span>
          {part.title && <span className="text-sm text-neutral-500">- {part.title}</span>}
          <span className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{part.maxMarks || 0} marks</span>
          {part.isPractical && (
            <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded">Practical</span>
          )}
          {subQCount > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">
              {subQCount} tasks ({subQMarks} marks)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit} data-testid={`button-edit-part-${part.id}`}>
            <Pencil className="h-3 w-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-600" data-testid={`button-delete-part-${part.id}`}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Part {part.partLabel}?</AlertDialogTitle>
                <AlertDialogDescription>This will delete this part and all its resources. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showFiles}
            onChange={(e) => setShowFiles(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium">Starter Files</span>
          {part.resources && part.resources.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">
              {part.resources.length}
            </span>
          )}
        </label>

        {showFiles && (
          <div className="mt-2">
            <div className="flex gap-2 items-start">
              <div
                className={`flex-1 border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                  isDragOver ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-neutral-300 dark:border-neutral-600"
                } ${isUploading ? "opacity-60" : ""}`}
                onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setIsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragOver(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  dragCounter.current = 0;
                  setIsDragOver(false);
                  if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-sm text-neutral-500">
                  {isUploading ? "Uploading..." : isDragOver ? "Drop files here" : <>Drop files or <strong>browse</strong></>}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".accdb,.mdb,.html,.htm,.css,.js,.sql,.txt,.pdf,.zip,.py,.vb,.jpg,.jpeg,.png,.gif"
                  onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
                />
              </div>
              <Input
                value={resourceDescription}
                onChange={(e) => setResourceDescription(e.target.value)}
                placeholder="Description"
                className="w-40 h-9 text-xs"
              />
            </div>

            {(part.resources && part.resources.length > 0) ? (
              <div className="mt-2 space-y-1">
                {part.resources.map((resource) => (
                  <div key={resource.id} className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800 rounded p-2">
                    <FileText className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                    <button
                      type="button"
                      onClick={async () => {
                        const apiUrl = `/api/download-resource?url=${encodeURIComponent(resource.fileUrl)}&name=${encodeURIComponent(resource.fileName)}`;
                        try {
                          const resp = await fetch(apiUrl);
                          if (resp.ok) {
                            const blob = await resp.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = resource.fileName;
                            a.style.display = "none";
                            document.body.appendChild(a);
                            a.click();
                            setTimeout(() => {
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }, 100);
                          } else {
                            alert('Failed to download "' + resource.fileName + '".');
                          }
                        } catch {
                          alert('Failed to download "' + resource.fileName + '".');
                        }
                      }}
                      className="text-sm text-blue-600 hover:underline flex-1 truncate text-left"
                    >
                      {resource.fileName}
                    </button>
                    {resource.description && <span className="text-xs text-neutral-500">{resource.description}</span>}
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => onDeleteResource(resource.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 mt-2">No starter files uploaded</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TableConfigModal({
  open,
  onOpenChange,
  grid,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grid: GridConfig | undefined;
  onSave: (grid: GridConfig) => void;
}) {
  const WIDTH_OPTIONS = [
    { value: "auto", label: "Auto" },
    { value: "80px", label: "S" },
    { value: "140px", label: "M" },
    { value: "220px", label: "L" },
    { value: "320px", label: "XL" },
    { value: "450px", label: "XXL" },
  ];

  const HEIGHT_OPTIONS = [
    { value: "auto", label: "Auto" },
    { value: "40px", label: "S" },
    { value: "80px", label: "M" },
    { value: "130px", label: "L" },
    { value: "200px", label: "XL" },
  ];

  const getDefaultGrid = (): GridConfig => ({
    headers: ["Column 1", "Column 2", "Column 3"],
    showHeaders: true,
    colWidths: ["auto", "auto", "auto"],
    rowMinHeights: ["auto", "auto", "auto"],
    rows: [
      { cells: [{ value: "", isInput: false }, { value: "", isInput: true, key: "A" }, { value: "", isInput: true, key: "B" }] },
      { cells: [{ value: "", isInput: false }, { value: "", isInput: true, key: "C" }, { value: "", isInput: true, key: "D" }] },
      { cells: [{ value: "", isInput: false }, { value: "", isInput: true, key: "E" }, { value: "", isInput: true, key: "F" }] },
    ],
  });

  const [config, setConfig] = useState<GridConfig>(grid || getDefaultGrid());

  useEffect(() => {
    if (open) {
      const g = grid || getDefaultGrid();
      if (!g.colWidths || g.colWidths.length !== g.headers.length) {
        g.colWidths = g.headers.map(() => "auto");
      }
      if (!g.rowMinHeights || g.rowMinHeights.length !== g.rows.length) {
        g.rowMinHeights = g.rows.map(() => "auto");
      }
      if (g.showHeaders === undefined) g.showHeaders = true;
      const rebuilt = g.rows.map(row => ({
        ...row,
        cells: row.cells.map(cell => ({ ...cell, hidden: false })),
      }));
      rebuilt.forEach((row, ri) => {
        row.cells.forEach((cell, ci) => {
          const cs = cell.colSpan || 1;
          const rs = cell.rowSpan || 1;
          if (cs > 1 || rs > 1) {
            for (let dr = 0; dr < rs; dr++) {
              for (let dc = 0; dc < cs; dc++) {
                if (dr === 0 && dc === 0) continue;
                const tr = ri + dr;
                const tc = ci + dc;
                if (tr < rebuilt.length && tc < rebuilt[tr].cells.length) {
                  rebuilt[tr].cells[tc].hidden = true;
                }
              }
            }
          }
        });
      });
      g.rows = rebuilt;
      setConfig(g);
    }
  }, [open]);

  const numCols = config.headers.length;
  const numRows = config.rows.length;

  const getNextLabel = (): string => {
    const usedKeys = new Set<string>();
    config.rows.forEach(r => r.cells.forEach(c => { if (c.key) usedKeys.add(c.key); }));
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      if (!usedKeys.has(letter)) return letter;
    }
    for (let i = 1; i <= 100; i++) {
      const label = `Z${i}`;
      if (!usedKeys.has(label)) return label;
    }
    return `cell_${Date.now()}`;
  };

  const reassignLabels = (rows: GridConfig["rows"]): GridConfig["rows"] => {
    let labelIdx = 0;
    return rows.map(row => ({
      ...row,
      cells: row.cells.map(cell => {
        if (cell.isInput) {
          const letter = labelIdx < 26 ? String.fromCharCode(65 + labelIdx) : `Z${labelIdx - 25}`;
          labelIdx++;
          return { ...cell, key: letter };
        }
        return { ...cell, key: undefined };
      }),
    }));
  };

  const clampSpans = (rows: GridConfig["rows"], maxCols: number): GridConfig["rows"] => {
    const maxRows = rows.length;
    return rows.map((row, ri) => ({
      ...row,
      cells: row.cells.map((cell, ci) => ({
        ...cell,
        colSpan: cell.colSpan ? Math.min(cell.colSpan, maxCols - ci) : undefined,
        rowSpan: cell.rowSpan ? Math.min(cell.rowSpan, maxRows - ri) : undefined,
      })),
    }));
  };

  const addRow = () => {
    const newCells: GridCell[] = config.headers.map(() => ({ value: "", isInput: false }));
    const newRows = [...config.rows, { cells: newCells }];
    const newHeights = [...(config.rowMinHeights || []), "auto"];
    setConfig({ ...config, rows: recalcHidden(reassignLabels(newRows)), rowMinHeights: newHeights });
  };

  const removeRow = () => {
    if (numRows <= 1) return;
    const newRows = clampSpans(config.rows.slice(0, -1), numCols);
    const newHeights = (config.rowMinHeights || []).slice(0, -1);
    setConfig({ ...config, rows: recalcHidden(reassignLabels(newRows)), rowMinHeights: newHeights });
  };

  const addColumn = () => {
    const newHeaders = [...config.headers, `Column ${numCols + 1}`];
    const newWidths = [...(config.colWidths || []), "auto"];
    const newRows = config.rows.map(row => ({
      ...row,
      cells: [...row.cells, { value: "", isInput: false }],
    }));
    setConfig({ ...config, headers: newHeaders, colWidths: newWidths, rows: recalcHidden(reassignLabels(newRows)) });
  };

  const removeColumn = () => {
    if (numCols <= 1) return;
    const newHeaders = config.headers.slice(0, -1);
    const newWidths = (config.colWidths || []).slice(0, -1);
    const newRows = clampSpans(config.rows.map(row => ({
      ...row,
      cells: row.cells.slice(0, -1),
    })), numCols - 1);
    setConfig({ ...config, headers: newHeaders, colWidths: newWidths, rows: recalcHidden(reassignLabels(newRows)) });
  };

  const updateHeader = (colIdx: number, value: string) => {
    const newHeaders = [...config.headers];
    newHeaders[colIdx] = value;
    setConfig({ ...config, headers: newHeaders });
  };

  const updateColWidth = (colIdx: number, width: string) => {
    const newWidths = [...(config.colWidths || config.headers.map(() => "auto"))];
    newWidths[colIdx] = width;
    setConfig({ ...config, colWidths: newWidths });
  };

  const updateRowHeight = (rowIdx: number, height: string) => {
    const newHeights = [...(config.rowMinHeights || config.rows.map(() => "auto"))];
    newHeights[rowIdx] = height;
    setConfig({ ...config, rowMinHeights: newHeights });
  };

  const recalcHidden = (rows: GridConfig["rows"]): GridConfig["rows"] => {
    const newRows = rows.map(row => ({
      ...row,
      cells: row.cells.map(cell => ({ ...cell, hidden: false })),
    }));
    newRows.forEach((row, ri) => {
      row.cells.forEach((cell, ci) => {
        const cs = cell.colSpan || 1;
        const rs = cell.rowSpan || 1;
        if (cs > 1 || rs > 1) {
          for (let dr = 0; dr < rs; dr++) {
            for (let dc = 0; dc < cs; dc++) {
              if (dr === 0 && dc === 0) continue;
              const tr = ri + dr;
              const tc = ci + dc;
              if (tr < newRows.length && tc < newRows[tr].cells.length) {
                newRows[tr].cells[tc].hidden = true;
              }
            }
          }
        }
      });
    });
    return newRows;
  };

  const updateCell = (rowIdx: number, cellIdx: number, updates: Partial<GridCell>) => {
    const newRows = config.rows.map((row, ri) => ({
      ...row,
      cells: row.cells.map((cell, ci) => {
        if (ri === rowIdx && ci === cellIdx) {
          const updated = { ...cell, ...updates };
          if (updates.isInput === true && !cell.isInput) {
            updated.key = getNextLabel();
            updated.isHeading = false;
          }
          if (updates.isInput === false) {
            updated.key = undefined;
            updated.starterText = undefined;
          }
          if (updates.isHeading === true) {
            updated.isInput = false;
            updated.key = undefined;
            updated.starterText = undefined;
          }
          return updated;
        }
        return cell;
      }),
    }));
    setConfig({ ...config, rows: recalcHidden(newRows) });
  };

  const setCellSpan = (rowIdx: number, cellIdx: number, colSpan: number, rowSpan: number) => {
    const newRows = config.rows.map((row, ri) => ({
      ...row,
      cells: row.cells.map((cell, ci) => {
        if (ri === rowIdx && ci === cellIdx) {
          return { ...cell, colSpan: colSpan > 1 ? colSpan : undefined, rowSpan: rowSpan > 1 ? rowSpan : undefined };
        }
        return cell;
      }),
    }));
    setConfig({ ...config, rows: recalcHidden(newRows) });
  };

  const unmergeCell = (rowIdx: number, cellIdx: number) => {
    setCellSpan(rowIdx, cellIdx, 1, 1);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, rowIdx: number, cellIdx: number, isStarterText: boolean) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const val = textarea.value;
      const pos = textarea.selectionStart;
      const before = val.substring(0, pos);
      const after = val.substring(textarea.selectionEnd);
      const lastLine = before.split("\n").pop() || "";
      const isBulletLine = /^[\s]*(•|- |\* )/.test(lastLine);
      const addBullet = isBulletLine ? "• " : "";
      const newVal = before + "\n" + addBullet + after;
      if (isStarterText) {
        updateCell(rowIdx, cellIdx, { starterText: newVal });
      } else {
        updateCell(rowIdx, cellIdx, { value: newVal });
      }
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = pos + 1 + addBullet.length;
      }, 0);
    }
  };

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = "auto"; }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" /> Configure Table
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Rows:</span>
            <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={removeRow} disabled={numRows <= 1}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-mono w-6 text-center">{numRows}</span>
            <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={addRow}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Columns:</span>
            <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={removeColumn} disabled={numCols <= 1}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-mono w-6 text-center">{numCols}</span>
            <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={addColumn}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={config.showHeaders !== false}
                onChange={(e) => setConfig({ ...config, showHeaders: e.target.checked })}
                className="rounded"
              />
              Header row
            </label>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-neutral-200 dark:bg-neutral-700 border rounded-sm" /> Header</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-white dark:bg-neutral-900 border rounded-sm" /> Fixed text</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-sm" /> Student input</span>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-sm">
            {config.showHeaders !== false && (
              <thead>
                <tr>
                  <th className="p-1 w-8"></th>
                  {config.headers.map((header, colIdx) => (
                    <th key={colIdx} className="p-1">
                      <Textarea
                        value={header}
                        onChange={(e) => updateHeader(colIdx, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const ta = e.currentTarget;
                            const pos = ta.selectionStart;
                            const before = ta.value.substring(0, pos);
                            const after = ta.value.substring(ta.selectionEnd);
                            updateHeader(colIdx, before + "\n" + after);
                            setTimeout(() => { ta.selectionStart = ta.selectionEnd = pos + 1; }, 0);
                          }
                        }}
                        className="text-sm font-medium text-center bg-neutral-100 dark:bg-neutral-800 min-h-[36px] resize-none"
                        rows={1}
                        style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                        data-testid={`table-header-${colIdx}`}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              <tr>
                <td className="p-1"></td>
                {config.headers.map((_, colIdx) => (
                  <td key={colIdx} className="p-1">
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-[10px] text-neutral-400">W:</span>
                      <select
                        value={(config.colWidths || [])[colIdx] || "auto"}
                        onChange={(e) => updateColWidth(colIdx, e.target.value)}
                        className="text-[10px] h-5 px-1 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                      >
                        {WIDTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </td>
                ))}
              </tr>
              {config.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="p-1 text-xs text-neutral-400 text-center align-top pt-3">
                    <div>{rowIdx + 1}</div>
                    <div className="flex items-center gap-0.5 mt-1 justify-center">
                      <span className="text-[10px] text-neutral-400">H:</span>
                      <select
                        value={(config.rowMinHeights || [])[rowIdx] || "auto"}
                        onChange={(e) => updateRowHeight(rowIdx, e.target.value)}
                        className="text-[10px] h-5 px-0.5 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                      >
                        {HEIGHT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </td>
                  {row.cells.map((cell, cellIdx) => {
                    if (cell.hidden) return null;
                    const isHeader = cell.isHeading;
                    const isInput = cell.isInput;
                    const isMerged = (cell.colSpan || 1) > 1 || (cell.rowSpan || 1) > 1;
                    const bgClass = isHeader
                      ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600"
                      : isInput
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                        : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700";
                    const colWidth = (config.colWidths || [])[cellIdx];
                    const rowHeight = (config.rowMinHeights || [])[rowIdx];
                    const maxCS = numCols - cellIdx;
                    const maxRS = numRows - rowIdx;

                    return (
                      <td
                        key={cellIdx}
                        className={`p-1 border ${bgClass}`}
                        style={colWidth && colWidth !== "auto" ? { width: colWidth } : undefined}
                        colSpan={cell.colSpan || undefined}
                        rowSpan={cell.rowSpan || undefined}
                      >
                        <div className="space-y-1" style={rowHeight && rowHeight !== "auto" ? { minHeight: rowHeight } : undefined}>
                          <div className="flex items-center gap-1 mb-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => updateCell(rowIdx, cellIdx, { isHeading: !isHeader })}
                              className={`text-[10px] px-1.5 py-0.5 rounded border ${isHeader ? "bg-neutral-700 text-white border-neutral-700 dark:bg-neutral-300 dark:text-neutral-900 dark:border-neutral-300" : "bg-white dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"}`}
                              title="Toggle header"
                              data-testid={`table-toggle-header-${rowIdx}-${cellIdx}`}
                            >
                              H
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCell(rowIdx, cellIdx, { isInput: !isInput })}
                              className={`text-[10px] px-1.5 py-0.5 rounded border ${isInput ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"}`}
                              title="Toggle student input"
                              data-testid={`table-toggle-input-${rowIdx}-${cellIdx}`}
                            >
                              Input
                            </button>
                            {maxCS > 1 && (
                              <div className="flex items-center gap-0.5">
                                <span className="text-[9px] text-neutral-400">C:</span>
                                <select
                                  value={cell.colSpan || 1}
                                  onChange={(e) => setCellSpan(rowIdx, cellIdx, parseInt(e.target.value), cell.rowSpan || 1)}
                                  className="text-[10px] h-5 px-0.5 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                                  title="Column span"
                                >
                                  {Array.from({ length: maxCS }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {maxRS > 1 && (
                              <div className="flex items-center gap-0.5">
                                <span className="text-[9px] text-neutral-400">R:</span>
                                <select
                                  value={cell.rowSpan || 1}
                                  onChange={(e) => setCellSpan(rowIdx, cellIdx, cell.colSpan || 1, parseInt(e.target.value))}
                                  className="text-[10px] h-5 px-0.5 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                                  title="Row span"
                                >
                                  {Array.from({ length: maxRS }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {isMerged && (
                              <button
                                type="button"
                                onClick={() => unmergeCell(rowIdx, cellIdx)}
                                className="text-[9px] px-1 py-0.5 rounded border border-orange-400 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                title="Unmerge cell"
                              >
                                Unmerge
                              </button>
                            )}
                            {isInput && cell.key && (
                              <span className="ml-auto text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                                {cell.key}
                              </span>
                            )}
                          </div>
                          {isInput ? (
                            <Textarea
                              value={cell.starterText || ""}
                              onChange={(e) => {
                                let v = e.target.value;
                                v = v.replace(/^(- |(\* ))/gm, "• ");
                                updateCell(rowIdx, cellIdx, { starterText: v });
                              }}
                              onKeyDown={(e) => handleCellKeyDown(e, rowIdx, cellIdx, true)}
                              placeholder="Starter text (optional, type - for bullets)..."
                              className="text-xs min-h-[50px] resize-y bg-white dark:bg-neutral-950"
                              style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", ...(rowHeight && rowHeight !== "auto" ? { minHeight: `calc(${rowHeight} - 30px)` } : {}) }}
                              data-testid={`table-starter-${rowIdx}-${cellIdx}`}
                            />
                          ) : (
                            <Textarea
                              value={cell.value || ""}
                              onChange={(e) => {
                                let v = e.target.value;
                                v = v.replace(/^(- |(\* ))/gm, "• ");
                                updateCell(rowIdx, cellIdx, { value: v });
                              }}
                              onKeyDown={(e) => handleCellKeyDown(e, rowIdx, cellIdx, false)}
                              placeholder={isHeader ? "Header text..." : "Fixed text (type - for bullets)..."}
                              className="text-xs min-h-[36px] resize-y"
                              style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", ...(rowHeight && rowHeight !== "auto" ? { minHeight: `calc(${rowHeight} - 30px)` } : {}) }}
                              data-testid={`table-cell-value-${rowIdx}-${cellIdx}`}
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="text-xs text-neutral-500 space-y-1">
            <p><strong>How it works:</strong> Click <strong>H</strong> to mark a cell as a header (shaded, not editable by students). Click <strong>Input</strong> to mark a cell as a student input area. Use the <strong>Header row</strong> checkbox to show/hide column headers.</p>
            <p>Student input cells are labelled (A, B, C...) so the AI can identify each answer. Type <strong>-</strong> (dash) then space to start a bullet point — it auto-converts to •. Press Enter to continue the list. Set column width (W) and row height (H) using the dropdowns.</p>
            <p><strong>Merging cells:</strong> Use the <strong>C:</strong> (column span) and <strong>R:</strong> (row span) dropdowns to merge a cell across multiple columns or rows. Click <strong>Unmerge</strong> to split it back.</p>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-1" /> Save Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DataTableConfigModal({
  open,
  onOpenChange,
  dataTable,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataTable: ContentBlock["dataTable"];
  onSave: (dt: NonNullable<ContentBlock["dataTable"]>) => void;
}) {
  type DT = NonNullable<ContentBlock["dataTable"]>;
  type DTCell = string | { value: string; role?: "data" | "title" | "header"; colSpan?: number; rowSpan?: number; hidden?: boolean };

  const WIDTH_OPTIONS = [
    { value: "auto", label: "Auto" },
    { value: "80px", label: "S" },
    { value: "140px", label: "M" },
    { value: "220px", label: "L" },
    { value: "320px", label: "XL" },
    { value: "450px", label: "XXL" },
  ];

  const getDefault = (): DT => ({
    tableName: "",
    columns: [
      { id: "col1", header: "Column 1" },
      { id: "col2", header: "Column 2" },
      { id: "col3", header: "Column 3" },
    ],
    rows: [
      { id: "row1", cells: ["", "", ""] },
      { id: "row2", cells: ["", "", ""] },
      { id: "row3", cells: ["", "", ""] },
    ],
  });

  const [config, setConfig] = useState<DT>(dataTable || getDefault());

  const getCellObj = (cell: DTCell): { value: string; role?: "data" | "title" | "header"; colSpan?: number; rowSpan?: number; hidden?: boolean } => {
    if (typeof cell === "string") return { value: cell };
    return cell;
  };

  const recalcHidden = (rows: DT["rows"]): DT["rows"] => {
    const newRows = rows.map(row => ({
      ...row,
      cells: row.cells.map(c => {
        const obj = getCellObj(c);
        return { ...obj, hidden: false } as DTCell;
      }),
    }));
    newRows.forEach((row, ri) => {
      row.cells.forEach((c, ci) => {
        const obj = getCellObj(c);
        const cs = obj.colSpan || 1;
        const rs = obj.rowSpan || 1;
        if (cs > 1 || rs > 1) {
          for (let dr = 0; dr < rs; dr++) {
            for (let dc = 0; dc < cs; dc++) {
              if (dr === 0 && dc === 0) continue;
              const tr = ri + dr;
              const tc = ci + dc;
              if (tr < newRows.length && tc < newRows[tr].cells.length) {
                const target = getCellObj(newRows[tr].cells[tc]);
                newRows[tr].cells[tc] = { ...target, hidden: true };
              }
            }
          }
        }
      });
    });
    return newRows;
  };

  useEffect(() => {
    if (open) {
      const dt = dataTable ? JSON.parse(JSON.stringify(dataTable)) : getDefault();
      if (!dt.columns) dt.columns = [{ id: "col1", header: "Column 1" }];
      if (!dt.rows) dt.rows = [{ id: "row1", cells: dt.columns.map(() => "") }];
      dt.rows = recalcHidden(dt.rows);
      setConfig(dt);
    }
  }, [open]);

  const numCols = config.columns.length;
  const numRows = config.rows.length;

  const updateCell = (rowIdx: number, cellIdx: number, updates: Partial<{ value: string; role: "data" | "title" | "header"; colSpan: number; rowSpan: number }>) => {
    const newRows = config.rows.map((row, ri) => ({
      ...row,
      cells: row.cells.map((c, ci) => {
        if (ri === rowIdx && ci === cellIdx) {
          const obj = getCellObj(c);
          return { ...obj, ...updates } as DTCell;
        }
        return c;
      }),
    }));
    setConfig({ ...config, rows: recalcHidden(newRows) });
  };

  const setCellSpan = (rowIdx: number, cellIdx: number, colSpan: number, rowSpan: number) => {
    const newRows = config.rows.map((row, ri) => ({
      ...row,
      cells: row.cells.map((c, ci) => {
        if (ri === rowIdx && ci === cellIdx) {
          const obj = getCellObj(c);
          return { ...obj, colSpan: colSpan > 1 ? colSpan : undefined, rowSpan: rowSpan > 1 ? rowSpan : undefined } as DTCell;
        }
        return c;
      }),
    }));
    setConfig({ ...config, rows: recalcHidden(newRows) });
  };

  const clampSpans = (rows: DT["rows"], maxCols: number): DT["rows"] => {
    const maxRows = rows.length;
    return rows.map((row, ri) => ({
      ...row,
      cells: row.cells.map((c, ci) => {
        const obj = getCellObj(c);
        return {
          ...obj,
          colSpan: obj.colSpan ? Math.min(obj.colSpan, maxCols - ci) : undefined,
          rowSpan: obj.rowSpan ? Math.min(obj.rowSpan, maxRows - ri) : undefined,
        } as DTCell;
      }),
    }));
  };

  const addRow = () => {
    const newCells: DTCell[] = config.columns.map(() => "");
    const newRows = [...config.rows, { id: `row-${Date.now()}`, cells: newCells }];
    setConfig({ ...config, rows: recalcHidden(newRows) });
  };

  const removeRow = () => {
    if (numRows <= 1) return;
    const newRows = clampSpans(config.rows.slice(0, -1), numCols);
    setConfig({ ...config, rows: recalcHidden(newRows) });
  };

  const addColumn = () => {
    const newCol = { id: `col-${Date.now()}`, header: `Column ${numCols + 1}` };
    const newRows = config.rows.map(row => ({
      ...row,
      cells: [...row.cells, "" as DTCell],
    }));
    setConfig({ ...config, columns: [...config.columns, newCol], rows: recalcHidden(newRows) });
  };

  const removeColumn = () => {
    if (numCols <= 1) return;
    const newCols = config.columns.slice(0, -1);
    const newRows = clampSpans(config.rows.map(row => ({
      ...row,
      cells: row.cells.slice(0, -1),
    })), numCols - 1);
    setConfig({ ...config, columns: newCols, rows: recalcHidden(newRows) });
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, rowIdx: number, cellIdx: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const val = textarea.value;
      const pos = textarea.selectionStart;
      const before = val.substring(0, pos);
      const after = val.substring(textarea.selectionEnd);
      const lastLine = before.split("\n").pop() || "";
      const isBulletLine = /^[\s]*(•|- |\* )/.test(lastLine);
      const addBullet = isBulletLine ? "• " : "";
      const newVal = before + "\n" + addBullet + after;
      updateCell(rowIdx, cellIdx, { value: newVal });
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = pos + 1 + addBullet.length;
      }, 0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = "auto"; }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" /> Configure Data Table
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-4 pb-3 border-b">
          <Input
            value={config.tableName}
            onChange={(e) => setConfig({ ...config, tableName: e.target.value })}
            placeholder="Table name (optional)"
            className="w-48 h-8 text-sm"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Rows:</span>
            <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={removeRow} disabled={numRows <= 1}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-mono w-6 text-center">{numRows}</span>
            <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={addRow}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Columns:</span>
            <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={removeColumn} disabled={numCols <= 1}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-mono w-6 text-center">{numCols}</span>
            <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={addColumn}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <label className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={config.hideHeaders || false}
              onChange={(e) => setConfig({ ...config, hideHeaders: e.target.checked })}
              className="rounded"
            />
            Hide headers
          </label>
          <div className="ml-auto flex items-center gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-neutral-200 dark:bg-neutral-700 border rounded-sm" /> Header</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-white dark:bg-neutral-900 border rounded-sm" /> Data</span>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-sm">
            {!config.hideHeaders && (
              <thead>
                <tr>
                  <th className="p-1 w-8"></th>
                  {config.columns.map((col, colIdx) => (
                    <th key={col.id} className="p-1">
                      <Textarea
                        value={col.header}
                        onChange={(e) => {
                          const newCols = [...config.columns];
                          newCols[colIdx] = { ...newCols[colIdx], header: e.target.value };
                          setConfig({ ...config, columns: newCols });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const ta = e.currentTarget;
                            const pos = ta.selectionStart;
                            const before = ta.value.substring(0, pos);
                            const after = ta.value.substring(ta.selectionEnd);
                            const newCols = [...config.columns];
                            newCols[colIdx] = { ...newCols[colIdx], header: before + "\n" + after };
                            setConfig({ ...config, columns: newCols });
                            setTimeout(() => { ta.selectionStart = ta.selectionEnd = pos + 1; }, 0);
                          }
                        }}
                        className="text-sm font-medium text-center bg-neutral-100 dark:bg-neutral-800 min-h-[36px] resize-none"
                        rows={1}
                        style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              <tr>
                <td className="p-1"></td>
                {config.columns.map((col, colIdx) => (
                  <td key={col.id} className="p-1">
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-[10px] text-neutral-400">W:</span>
                      <select
                        value={col.width || "auto"}
                        onChange={(e) => {
                          const newCols = [...config.columns];
                          newCols[colIdx] = { ...newCols[colIdx], width: e.target.value === "auto" ? undefined : e.target.value };
                          setConfig({ ...config, columns: newCols });
                        }}
                        className="text-[10px] h-5 px-1 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                      >
                        {WIDTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </td>
                ))}
              </tr>
              {config.rows.map((row, rowIdx) => (
                <tr key={row.id}>
                  <td className="p-1 text-xs text-neutral-400 text-center align-top pt-3">
                    <div>{rowIdx + 1}</div>
                  </td>
                  {row.cells.map((cell, cellIdx) => {
                    const obj = getCellObj(cell);
                    if (obj.hidden) return null;
                    const isHeader = obj.role === "header" || obj.role === "title";
                    const isMerged = (obj.colSpan || 1) > 1 || (obj.rowSpan || 1) > 1;
                    const bgClass = isHeader
                      ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600"
                      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700";
                    const colWidth = config.columns[cellIdx]?.width;
                    const maxCS = numCols - cellIdx;
                    const maxRS = numRows - rowIdx;

                    return (
                      <td
                        key={cellIdx}
                        className={`p-1 border ${bgClass}`}
                        style={colWidth ? { width: colWidth } : undefined}
                        colSpan={obj.colSpan || undefined}
                        rowSpan={obj.rowSpan || undefined}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 mb-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => updateCell(rowIdx, cellIdx, { role: isHeader ? "data" : "header" })}
                              className={`text-[10px] px-1.5 py-0.5 rounded border ${isHeader ? "bg-neutral-700 text-white border-neutral-700 dark:bg-neutral-300 dark:text-neutral-900 dark:border-neutral-300" : "bg-white dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"}`}
                              title="Toggle header"
                            >
                              H
                            </button>
                            {maxCS > 1 && (
                              <div className="flex items-center gap-0.5">
                                <span className="text-[9px] text-neutral-400">C:</span>
                                <select
                                  value={obj.colSpan || 1}
                                  onChange={(e) => setCellSpan(rowIdx, cellIdx, parseInt(e.target.value), obj.rowSpan || 1)}
                                  className="text-[10px] h-5 px-0.5 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                                  title="Column span"
                                >
                                  {Array.from({ length: maxCS }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {maxRS > 1 && (
                              <div className="flex items-center gap-0.5">
                                <span className="text-[9px] text-neutral-400">R:</span>
                                <select
                                  value={obj.rowSpan || 1}
                                  onChange={(e) => setCellSpan(rowIdx, cellIdx, obj.colSpan || 1, parseInt(e.target.value))}
                                  className="text-[10px] h-5 px-0.5 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                                  title="Row span"
                                >
                                  {Array.from({ length: maxRS }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {isMerged && (
                              <button
                                type="button"
                                onClick={() => setCellSpan(rowIdx, cellIdx, 1, 1)}
                                className="text-[9px] px-1 py-0.5 rounded border border-orange-400 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                title="Unmerge cell"
                              >
                                Unmerge
                              </button>
                            )}
                          </div>
                          <Textarea
                            value={obj.value || ""}
                            onChange={(e) => {
                              let v = e.target.value;
                              v = v.replace(/^(- |(\* ))/gm, "• ");
                              updateCell(rowIdx, cellIdx, { value: v });
                            }}
                            onKeyDown={(e) => handleCellKeyDown(e, rowIdx, cellIdx)}
                            placeholder={isHeader ? "Header text..." : "Cell text (type - for bullets)..."}
                            className="text-xs min-h-[36px] resize-y"
                            style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t pt-3">
          <div className="text-xs text-neutral-500 space-y-1">
            <p><strong>How it works:</strong> Click <strong>H</strong> to mark a cell as a header (shaded). Set column width (W) using the dropdowns. Type <strong>-</strong> then space for bullet points.</p>
            <p><strong>Merging cells:</strong> Use the <strong>C:</strong> (column span) and <strong>R:</strong> (row span) dropdowns to merge a cell across multiple columns or rows.</p>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={() => { onSave(config); onOpenChange(false); }} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-1" /> Save Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MarkingGuidanceModal({
  open,
  onOpenChange,
  data,
  onSave,
  questionLabel,
  inputStyle,
  erdModelAnswer: initialErdModelAnswer,
  erdStarterDiagram,
  navModelAnswer: initialNavModelAnswer,
  navStarterDiagram,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: MarkingGuidanceData | null | undefined;
  onSave: (data: MarkingGuidanceData, diagramModelAnswer?: string) => void;
  questionLabel: string;
  inputStyle?: string;
  erdModelAnswer?: string;
  erdStarterDiagram?: string;
  navModelAnswer?: string;
  navStarterDiagram?: string;
}) {
  const [rows, setRows] = useState<MarkingGuidanceRow[]>([]);
  const [exampleAnswer, setExampleAnswer] = useState("");
  const [exampleFiles, setExampleFiles] = useState<{ url: string; originalName: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [erdModel, setErdModel] = useState<string>("");
  const [navModel, setNavModel] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (open) {
      if (data && data.rows && data.rows.length > 0) {
        setRows(data.rows.map(r => ({ ...r, part: r.part || "" })));
        setExampleAnswer(data.exampleAnswer || "");
        setExampleFiles(data.exampleFiles || []);
      } else {
        setRows([{ id: `mg-${Date.now()}`, part: "", expectedResponse: "", additionalGuidance: "", marks: 1 }]);
        setExampleAnswer("");
        setExampleFiles([]);
      }
      setErdModel(initialErdModelAnswer || erdStarterDiagram || "[]");
      setNavModel(initialNavModelAnswer || navStarterDiagram || "[]");
    }
  }, [open]);

  const addRow = () => {
    setRows([...rows, { id: `mg-${Date.now()}`, part: "", expectedResponse: "", additionalGuidance: "", marks: 1 }]);
  };

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, updates: Partial<MarkingGuidanceRow>) => {
    setRows(rows.map((r, i) => i === idx ? { ...r, ...updates } : r));
  };

  const totalMarks = rows.reduce((sum, r) => sum + (r.marks || 0), 0);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("teacher_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploading(true);
    try {
      for (const file of fileArray) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload-resource", {
          method: "POST",
          headers: { ...getAuthHeaders() },
          body: formData,
        });
        if (res.ok) {
          const result = await res.json();
          setExampleFiles(prev => [...prev, { url: result.url, originalName: result.originalName }]);
        } else {
          const errText = await res.text().catch(() => "");
          console.error("Upload failed for", file.name, res.status, errText);
        }
      }
    } catch (e) {
      console.error("Upload failed", e);
    }
    setUploading(false);
  };

  const removeFile = (idx: number) => {
    setExampleFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleErdModelChange = useCallback((data: string) => {
    setErdModel(data);
  }, []);

  const handleNavModelChange = useCallback((data: string) => {
    setNavModel(data);
  }, []);

  const handleSave = () => {
    const diagramModel = inputStyle === "erd-diagram" ? erdModel
      : inputStyle === "nav-structure" ? navModel
      : undefined;
    onSave(
      {
        rows: rows.filter(r => r.expectedResponse.trim() || r.part.trim()),
        exampleAnswer,
        exampleFiles,
      },
      diagramModel,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-7xl max-h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = "auto"; }}
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" /> Marking Guidance — {questionLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Marking Criteria</span>
              <span className="text-xs text-neutral-500">Total: {totalMarks} marks</span>
            </div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800">
                  <th className="border p-2 text-left w-48">Part</th>
                  <th className="border p-2 text-left">Expected Response</th>
                  <th className="border p-2 text-left w-16">Mark</th>
                  <th className="border p-2 text-left">Additional Guidance</th>
                  <th className="border p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="border p-1">
                      <Input
                        value={row.part}
                        onChange={(e) => updateRow(idx, { part: e.target.value })}
                        placeholder="e.g. (a)(i)"
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="border p-1">
                      <Textarea
                        value={row.expectedResponse}
                        onChange={(e) => updateRow(idx, { expectedResponse: e.target.value })}
                        placeholder="What the student should answer..."
                        className="text-xs min-h-[60px] resize-y"
                        rows={2}
                      />
                    </td>
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={row.marks}
                        onChange={(e) => updateRow(idx, { marks: parseInt(e.target.value) || 0 })}
                        className="h-8 text-xs text-center"
                        min={0}
                      />
                    </td>
                    <td className="border p-1">
                      <Textarea
                        value={row.additionalGuidance}
                        onChange={(e) => updateRow(idx, { additionalGuidance: e.target.value })}
                        placeholder="Extra info for AI grading..."
                        className="text-xs min-h-[60px] resize-y"
                        rows={2}
                      />
                    </td>
                    <td className="border p-1 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500"
                        onClick={() => removeRow(idx)}
                        disabled={rows.length <= 1}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button variant="outline" size="sm" onClick={addRow} className="mt-2">
              <Plus className="h-3 w-3 mr-1" /> Add Row
            </Button>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-1">Example / Model Answer (optional)</label>
            <Textarea
              value={exampleAnswer}
              onChange={(e) => setExampleAnswer(e.target.value)}
              placeholder="Provide a model answer the AI can reference..."
              rows={3}
              className="text-sm resize-y"
            />
          </div>

          {inputStyle === "erd-diagram" && open && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-1">ERD Model Answer (completed ERD for AI grading reference)</label>
              <p className="text-xs text-neutral-500 mb-2">Create the correct completed ERD below. The AI will compare student diagrams against this.</p>
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950">
                <DiagramEditor
                  key={`erd-model-${questionLabel}`}
                  initialData={initialErdModelAnswer || erdStarterDiagram || "[]"}
                  baseDiagram={erdStarterDiagram}
                  mode="erd-annotation"
                  onChange={handleErdModelChange}
                />
              </div>
            </div>
          )}

          {inputStyle === "nav-structure" && open && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-1">Navigation Diagram Model Answer (for AI grading reference)</label>
              <p className="text-xs text-neutral-500 mb-2">Create the correct navigation diagram below. The AI will compare student diagrams against this.</p>
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950">
                <DiagramEditor
                  key={`nav-model-${questionLabel}`}
                  initialData={initialNavModelAnswer || navStarterDiagram || "[]"}
                  baseDiagram={navStarterDiagram}
                  mode="nav-structure-higher"
                  onChange={handleNavModelChange}
                />
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <label className="text-sm font-medium mb-2 block">Reference Screenshots & Files (optional)</label>
            <div
              ref={dropRef}
              className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-neutral-300 dark:border-neutral-600 hover:border-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              }`}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounter.current++;
                setIsDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounter.current--;
                if (dragCounter.current <= 0) {
                  dragCounter.current = 0;
                  setIsDragging(false);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounter.current = 0;
                setIsDragging(false);
                const droppedFiles = e.dataTransfer?.files;
                if (droppedFiles && droppedFiles.length > 0) {
                  handleFileUpload(droppedFiles);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!uploading) fileInputRef.current?.click();
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".py,.txt,.sql,.css,.html,.htm,.js,.vb,.csv,.json,.xml,.jpg,.jpeg,.png,.gif,.webp,.pdf,.zip,.accdb,.mdb"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files);
                    e.target.value = "";
                  }
                }}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-1 py-2 pointer-events-none">
                  <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-neutral-500">Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 py-2 pointer-events-none">
                  <Upload className={`h-6 w-6 ${isDragging ? "text-blue-500" : "text-neutral-400"}`} />
                  <span className="text-sm text-neutral-500">
                    {isDragging ? "Drop files here" : "Drag & drop files here, or click to browse"}
                  </span>
                  <span className="text-xs text-neutral-400">Upload screenshots of correct output, code files, or documents for the AI to reference when grading</span>
                </div>
              )}
            </div>
            {exampleFiles.length > 0 && (
              <div className="space-y-1 mt-3">
                {exampleFiles.map((f, i) => {
                  const ext = f.originalName.split(".").pop()?.toLowerCase() || "";
                  const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs bg-neutral-50 dark:bg-neutral-800 rounded px-2 py-1.5">
                      {isImage ? (
                        <img src={f.url} alt={f.originalName} className="h-8 w-8 object-cover rounded border" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1 truncate">
                        {f.originalName}
                      </a>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-500" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-1" /> Save Marking Guidance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuestionStarterDiagramEditor({
  questionId,
  inputConfig,
  updateQuestion,
  mode,
  fieldName,
  alsoSetBaseField,
}: {
  questionId: string;
  inputConfig: AssignmentQuestion["inputConfig"];
  updateQuestion: (id: string, updates: Partial<AssignmentQuestion>) => void;
  mode: "erd-annotation" | "nav-structure-higher";
  fieldName: "erdStarterDiagram" | "baseNavDiagram";
  alsoSetBaseField?: "baseErdDiagram";
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
      const newConfig: any = { ...(inputConfigRef.current || {}), [fieldName]: data };
      if (alsoSetBaseField) {
        newConfig[alsoSetBaseField] = data;
      }
      updateQuestionRef.current(questionId, { inputConfig: newConfig });
    },
    [questionId, fieldName, alsoSetBaseField],
  );

  return (
    <DiagramEditor
      initialData={inputConfig?.[fieldName] || "[]"}
      mode={mode}
      onChange={handleChange}
    />
  );
}

function AssignmentQuestionEditor({
  questions,
  onChange,
  questionNumberPrefix = 1,
  questionStartIndex = 0,
}: {
  questions: AssignmentQuestion[];
  onChange: (questions: AssignmentQuestion[]) => void;
  isAssignment?: boolean;
  questionNumberPrefix?: number;
  questionStartIndex?: number;
}) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [tableConfigQuestionId, setTableConfigQuestionId] = useState<string | null>(null);
  const [markingGuidanceQuestionId, setMarkingGuidanceQuestionId] = useState<string | null>(null);
  const romanNumerals = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];

  const getLabel = (index: number, level: number, parentLabel?: string): string => {
    if (level === 0) {
      const letterIdx = questionStartIndex + index;
      const letter = String.fromCharCode(97 + letterIdx);
      return `${questionNumberPrefix}(${letter})`;
    }
    if (level === 1) {
      const roman = romanNumerals[index] || `${index + 1}`;
      return `${parentLabel}(${roman})`;
    }
    return `${parentLabel}.${index + 1}`;
  };

  const addQuestion = (parentId?: string) => {
    const newQ: AssignmentQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      label: "",
      questionText: "",
      maxMarks: 1,
      inputStyle: "text",
      aiGuidance: "",
      markingScheme: [],
      subParts: [],
    };

    if (parentId) {
      const updateNested = (qs: AssignmentQuestion[]): AssignmentQuestion[] =>
        qs.map(q => q.id === parentId ? { ...q, subParts: [...(q.subParts || []), newQ] } : { ...q, subParts: q.subParts ? updateNested(q.subParts) : undefined });
      onChange(updateNested(questions));
    } else {
      onChange([...questions, newQ]);
    }
  };

  const updateQuestion = (id: string, updates: Partial<AssignmentQuestion>) => {
    const updateNested = (qs: AssignmentQuestion[]): AssignmentQuestion[] =>
      qs.map(q => q.id === id ? { ...q, ...updates } : { ...q, subParts: q.subParts ? updateNested(q.subParts) : undefined });
    onChange(updateNested(questions));
  };

  const deleteQuestion = (id: string) => {
    const removeNested = (qs: AssignmentQuestion[]): AssignmentQuestion[] =>
      qs.filter(q => q.id !== id).map(q => ({ ...q, subParts: q.subParts ? removeNested(q.subParts) : undefined }));
    onChange(removeNested(questions));
  };

  const moveQuestion = (id: string, direction: "up" | "down", parentQuestions: AssignmentQuestion[]) => {
    const idx = parentQuestions.findIndex(q => q.id === id);
    if (idx < 0) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= parentQuestions.length) return;
    const newQs = [...parentQuestions];
    [newQs[idx], newQs[newIdx]] = [newQs[newIdx], newQs[idx]];
    return newQs;
  };

  const renderQuestion = (q: AssignmentQuestion, index: number, level: number, parentLabel?: string, parentQuestions?: AssignmentQuestion[]) => {
    const label = getLabel(index, level, parentLabel);
    const isExpanded = expandedQuestions.has(q.id);
    const hasSubParts = q.subParts && q.subParts.length > 0;

    return (
      <Card key={q.id} className="mb-2">
        <div
          className="p-3 cursor-pointer flex items-center justify-between"
          onClick={() => {
            const next = new Set(expandedQuestions);
            isExpanded ? next.delete(q.id) : next.add(q.id);
            setExpandedQuestions(next);
          }}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-medium">{label}</span>
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">
              {hasSubParts ? getTotalMarks([q]) : q.maxMarks} marks
            </span>
            <span className="text-xs text-neutral-500">{q.inputStyle}</span>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
              const qs = parentQuestions || questions;
              const moved = moveQuestion(q.id, "up", qs);
              if (moved) {
                if (parentQuestions) {
                  const parent = questions.find(pq => pq.subParts?.some(sp => sp.id === q.id));
                  if (parent) updateQuestion(parent.id, { subParts: moved });
                } else {
                  onChange(moved);
                }
              }
            }}>
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
              const qs = parentQuestions || questions;
              const moved = moveQuestion(q.id, "down", qs);
              if (moved) {
                if (parentQuestions) {
                  const parent = questions.find(pq => pq.subParts?.some(sp => sp.id === q.id));
                  if (parent) updateQuestion(parent.id, { subParts: moved });
                } else {
                  onChange(moved);
                }
              }
            }}>
              <ArrowDown className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={() => deleteQuestion(q.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 border-t pt-3">
            <div>
              <label className="block text-xs font-medium mb-1">Question Content</label>
              <ContentBlockEditor
                blocks={q.contentBlocks || []}
                onChange={(blocks) => updateQuestion(q.id, { contentBlocks: blocks })}
              />
              {(!q.contentBlocks || q.contentBlocks.length === 0) && q.questionText && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-700 dark:text-amber-400">Legacy text detected — migrate to content blocks?</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => updateQuestion(q.id, {
                        contentBlocks: [{ id: `cb-${Date.now()}`, type: "text", content: q.questionText }],
                        questionText: "",
                      })}
                    >
                      Migrate
                    </Button>
                  </div>
                  <p className="text-neutral-500 mt-1 truncate">{q.questionText}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Max Marks</label>
                {q.inputStyle === "info-only" ? (
                  <div className="h-8 flex items-center text-sm text-neutral-500">
                    {(q.subParts && q.subParts.length > 0) ? `${getTotalMarks(q.subParts)} (from sub-parts)` : "0 (add sub-parts)"}
                  </div>
                ) : (
                  <div className="h-8 flex items-center text-sm">
                    <span className={q.maxMarks > 0 ? "font-medium" : "text-neutral-400"}>
                      {q.maxMarks > 0 ? `${q.maxMarks} mark${q.maxMarks !== 1 ? "s" : ""}` : "Set in marking guidance"}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Input Style</label>
                <Select value={q.inputStyle} onValueChange={(v) => {
                  const updates: Partial<AssignmentQuestion> = { inputStyle: v };
                  if (v === "info-only") updates.maxMarks = 0;
                  updateQuestion(q.id, updates);
                }}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INPUT_STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-1 gap-4">
                {q.inputStyle !== "info-only" && (
                  <>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.allowFileUpload || false}
                        onChange={(e) => updateQuestion(q.id, { allowFileUpload: e.target.checked })}
                        className="rounded"
                      />
                      <span>Allow file uploads</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.requiresStudentCode || false}
                        onChange={(e) => updateQuestion(q.id, { requiresStudentCode: e.target.checked })}
                        className="rounded"
                      />
                      <span>AI references student's uploaded code</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {q.inputStyle === "table" && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTableConfigQuestionId(q.id)}
                  className="gap-1"
                  data-testid={`table-config-btn-${q.id}`}
                >
                  <Settings2 className="h-3 w-3" />
                  {q.inputConfig?.grid ? "Edit Table" : "Configure Table"}
                </Button>
                {q.inputConfig?.grid && (
                  <span className="text-xs text-neutral-500">
                    {q.inputConfig.grid.rows.length} rows × {q.inputConfig.grid.headers.length} cols
                    ({q.inputConfig.grid.rows.reduce((n, r) => n + r.cells.filter(c => c.isInput).length, 0)} input cells)
                  </span>
                )}
              </div>
            )}

            {q.inputStyle === "erd-diagram" && (
              <div className="space-y-3 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 bg-neutral-50 dark:bg-neutral-900">
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">ERD Diagram Configuration</p>
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Starter Diagram (given to students to build on)</label>
                  <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950">
                    <QuestionStarterDiagramEditor
                      questionId={q.id}
                      inputConfig={q.inputConfig}
                      updateQuestion={updateQuestion}
                      mode="erd-annotation"
                      fieldName="erdStarterDiagram"
                      alsoSetBaseField="baseErdDiagram"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">The model answer ERD is configured in the Marking Guidance dialog.</p>
                </div>
              </div>
            )}

            {q.inputStyle === "nav-structure" && (
              <div className="space-y-3 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 bg-neutral-50 dark:bg-neutral-900">
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Navigation Diagram Configuration</p>
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Starter Diagram (optional — given to students to build on)</label>
                  <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950">
                    <QuestionStarterDiagramEditor
                      questionId={q.id}
                      inputConfig={q.inputConfig}
                      updateQuestion={updateQuestion}
                      mode="nav-structure-higher"
                      fieldName="baseNavDiagram"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">The model answer diagram is configured in the Marking Guidance dialog.</p>
                </div>
              </div>
            )}

            {q.inputStyle !== "info-only" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium">Marking Guidance</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMarkingGuidanceQuestionId(q.id)}
                    className="text-xs"
                  >
                    <ClipboardCheck className="h-3 w-3 mr-1" />
                    {q.markingGuidanceData?.rows?.length ? `Edit (${q.markingGuidanceData.rows.length} criteria, ${q.markingGuidanceData.rows.reduce((s, r) => s + (r.marks || 0), 0)} marks)` : "Set Up Marking Guidance"}
                  </Button>
                </div>
                {q.markingGuidanceData?.rows?.length ? (
                  <div className="text-xs text-neutral-500 space-y-0.5">
                    {q.markingGuidanceData.rows.slice(0, 3).map((r, i) => (
                      <div key={i} className="truncate">
                        {r.part ? `${r.part}: ` : ""}{r.expectedResponse} ({r.marks} mark{r.marks !== 1 ? "s" : ""})
                      </div>
                    ))}
                    {q.markingGuidanceData.rows.length > 3 && (
                      <div className="text-neutral-400">...and {q.markingGuidanceData.rows.length - 3} more</div>
                    )}
                    {q.markingGuidanceData.exampleFiles && q.markingGuidanceData.exampleFiles.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-blue-500">
                        <FileText className="h-3 w-3" /> {q.markingGuidanceData.exampleFiles.length} reference file{q.markingGuidanceData.exampleFiles.length !== 1 ? "s" : ""} attached
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400">No marking guidance set. Click to add criteria, example answers, and reference screenshots.</p>
                )}
              </div>
            )}

            {q.inputStyle === "info-only" && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  This is an information-only question — no answer is required from students. Add sub-parts below for the actual questions.
                  {q.subParts && q.subParts.length > 0 && (
                    <span className="font-medium block mt-1">Total marks from sub-parts: {getTotalMarks(q.subParts)}</span>
                  )}
                </p>
              </div>
            )}

            {level < 2 && (
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sub-parts</span>
                  <Button variant="outline" size="sm" onClick={() => addQuestion(q.id)}>
                    <Plus className="h-3 w-3 mr-1" /> Add Sub-part
                  </Button>
                </div>
                {q.subParts && q.subParts.map((sp, si) => renderQuestion(sp, si, level + 1, label, q.subParts))}
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  const findQuestion = (id: string, qs: AssignmentQuestion[]): AssignmentQuestion | undefined => {
    for (const q of qs) {
      if (q.id === id) return q;
      if (q.subParts) {
        const found = findQuestion(id, q.subParts);
        if (found) return found;
      }
    }
    return undefined;
  };

  const tableConfigQuestion = tableConfigQuestionId ? findQuestion(tableConfigQuestionId, questions) : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Questions</span>
          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">
            {getLeafQuestions(questions).length} tasks ({getTotalMarks(questions)} marks)
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => addQuestion()}>
          <Plus className="h-3 w-3 mr-1" /> Add Question
        </Button>
      </div>
      {questions.map((q, i) => renderQuestion(q, i, 0))}
      {questions.length === 0 && (
        <p className="text-sm text-neutral-500 text-center py-4">No questions yet. Click "Add Question" to create one.</p>
      )}

      <TableConfigModal
        open={!!tableConfigQuestionId}
        onOpenChange={(open) => { if (!open) setTableConfigQuestionId(null); }}
        grid={tableConfigQuestion?.inputConfig?.grid}
        onSave={(grid) => {
          if (tableConfigQuestionId) {
            updateQuestion(tableConfigQuestionId, {
              inputConfig: { ...(tableConfigQuestion?.inputConfig || {}), grid },
            });
          }
        }}
      />

      {(() => {
        const mgQuestion = markingGuidanceQuestionId ? findQuestion(markingGuidanceQuestionId, questions) : undefined;
        return (
          <MarkingGuidanceModal
            open={!!markingGuidanceQuestionId}
            onOpenChange={(open) => { if (!open) setMarkingGuidanceQuestionId(null); }}
            data={mgQuestion?.markingGuidanceData}
            questionLabel={mgQuestion?.label || "Question"}
            inputStyle={mgQuestion?.inputStyle}
            erdModelAnswer={mgQuestion?.inputConfig?.erdModelAnswer}
            erdStarterDiagram={mgQuestion?.inputConfig?.erdStarterDiagram}
            navModelAnswer={mgQuestion?.inputConfig?.navModelAnswer}
            navStarterDiagram={mgQuestion?.inputConfig?.baseNavDiagram}
            onSave={(data, diagramModelAnswer) => {
              if (markingGuidanceQuestionId) {
                const markingScheme: string[] = [];
                data.rows.forEach(r => {
                  const prefix = r.part ? `[${r.part}] ` : "";
                  for (let m = 0; m < Math.max(r.marks, 1); m++) {
                    markingScheme.push(`${prefix}${r.expectedResponse}${r.marks > 1 ? ` (point ${m + 1} of ${r.marks})` : ""}`);
                  }
                });
                const guidanceParts: string[] = [];
                data.rows.forEach(r => {
                  const parts = [];
                  if (r.part) parts.push(`Part ${r.part}:`);
                  parts.push(`Expected: ${r.expectedResponse}`);
                  if (r.additionalGuidance) parts.push(`Guidance: ${r.additionalGuidance}`);
                  parts.push(`(${r.marks} mark${r.marks !== 1 ? "s" : ""})`);
                  guidanceParts.push(parts.join(" "));
                });
                if (data.exampleAnswer) {
                  guidanceParts.push(`\nModel Answer:\n${data.exampleAnswer}`);
                }
                if (data.exampleFiles && data.exampleFiles.length > 0) {
                  guidanceParts.push(`\nReference files attached: ${data.exampleFiles.map(f => f.originalName).join(", ")}`);
                }
                const totalMarksFromGuidance = data.rows.reduce((s, r) => s + (r.marks || 0), 0);
                const updates: Record<string, unknown> = {
                  markingGuidanceData: data,
                  markingScheme,
                  aiGuidance: guidanceParts.join("\n"),
                  maxMarks: totalMarksFromGuidance,
                };
                if (diagramModelAnswer !== undefined && mgQuestion?.inputStyle === "erd-diagram") {
                  updates.inputConfig = {
                    ...(mgQuestion?.inputConfig || {}),
                    erdModelAnswer: diagramModelAnswer,
                  };
                }
                if (diagramModelAnswer !== undefined && mgQuestion?.inputStyle === "nav-structure") {
                  updates.inputConfig = {
                    ...(mgQuestion?.inputConfig || {}),
                    navModelAnswer: diagramModelAnswer,
                  };
                }
                updateQuestion(markingGuidanceQuestionId, updates);
              }
            }}
          />
        );
      })()}
    </div>
  );
}

export default function AssignmentManager() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loadingSections, setLoadingSections] = useState<Set<string>>(new Set());
  const [expandingSection, setExpandingSection] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editingSection, setEditingSection] = useState<{ assignmentId: string; section?: AssignmentSection } | null>(null);
  const [editingPart, setEditingPart] = useState<{ sectionId: string; part?: AssignmentPart; assignmentId: string } | null>(null);
  const [checklistEditorOpen, setChecklistEditorOpen] = useState(false);
  const [editingChecklistAssignment, setEditingChecklistAssignment] = useState<Assignment | null>(null);
  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
  const [editingInfoSheet, setEditingInfoSheet] = useState<{ sectionId: string; assignmentId: string; blocks: ContentBlock[] } | null>(null);
  const [infoSheetPreview, setInfoSheetPreview] = useState(false);

  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newChecklistSection, setNewChecklistSection] = useState("sdd");
  const [newChecklistPartLabel, setNewChecklistPartLabel] = useState("A");
  const [newChecklistQuestionNumber, setNewChecklistQuestionNumber] = useState("");
  const [editingChecklistItemData, setEditingChecklistItemData] = useState<ChecklistItem | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formTotalMarks, setFormTotalMarks] = useState(40);
  const [formTotalTimeMinutes, setFormTotalTimeMinutes] = useState(360);
  const [formIsPublished, setFormIsPublished] = useState(false);

  const [sectionFormType, setSectionFormType] = useState("sdd");
  const [sectionFormTitle, setSectionFormTitle] = useState("");
  const [sectionFormCompulsory, setSectionFormCompulsory] = useState(true);
  const [sectionFormOrderIndex, setSectionFormOrderIndex] = useState(0);

  const [partFormLabel, setPartFormLabel] = useState("A");
  const [partFormTitle, setPartFormTitle] = useState("");
  const [partFormMaxMarks, setPartFormMaxMarks] = useState(0);
  const [partFormOrderIndex, setPartFormOrderIndex] = useState(0);
  const [partFormIsPractical, setPartFormIsPractical] = useState(false);
  const [partFormRequiresUpload, setPartFormRequiresUpload] = useState(true);
  const [partFormInputStyle, setPartFormInputStyle] = useState("text");
  const [partFormAiGuidance, setPartFormAiGuidance] = useState("");
  const [partFormContentBlocks, setPartFormContentBlocks] = useState<ContentBlock[]>([]);
  const [partFormSubQuestions, setPartFormSubQuestions] = useState<AssignmentQuestion[]>([]);

  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [submissionsAssignment, setSubmissionsAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  const openSubmissionsDialog = async (assignment: Assignment) => {
    setSubmissionsAssignment(assignment);
    setSubmissionsDialogOpen(true);
    setSubmissionsLoading(true);
    setExpandedSubmission(null);
    try {
      const res = await fetch(`/api/teacher/assignment-submissions/${assignment.id}`, {
        headers: getAuthHeaders(),
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      setSubmissions(data);
    } catch {
      toast({ title: "Error", description: "Failed to load submissions", variant: "destructive" });
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("teacher_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  };

  const handleAuthError = (res: Response): boolean => {
    if (res.status === 401) {
      localStorage.removeItem("teacher_token");
      localStorage.removeItem("teacher_token_expires");
      toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
      navigate("/teacher/login");
      return true;
    }
    return false;
  };

  useEffect(() => {
    const token = localStorage.getItem("teacher_token");
    if (!token) { navigate("/teacher/login"); return; }
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/assignments/all-full");
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.sort((a: Assignment, b: Assignment) => b.year - a.year));
      }
    } catch (e) {
      console.error("Failed to fetch assignments:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentDetails = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/full`);
      if (res.ok) {
        const fullAssignment = await res.json();
        setAssignments(prev => prev.map(a => a.id === assignmentId ? fullAssignment : a).sort((a, b) => b.year - a.year));
      }
    } catch (e) {
      console.error("Failed to fetch assignment details:", e);
    }
  };

  const openCreateDialog = () => {
    setEditingAssignment(null);
    setFormTitle("");
    setFormYear(new Date().getFullYear());
    setFormTotalMarks(40);
    setFormTotalTimeMinutes(360);
    setFormIsPublished(false);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormTitle(assignment.title);
    setFormYear(assignment.year);
    setFormTotalMarks(assignment.totalMarks || 40);
    setFormTotalTimeMinutes(assignment.totalTimeMinutes || 360);
    setFormIsPublished(assignment.isPublished || false);
    setIsCreateDialogOpen(true);
  };

  const handleSaveAssignment = async () => {
    if (!formTitle.trim()) {
      toast({ title: "Error", description: "Please enter a title", variant: "destructive" });
      return;
    }
    const body = { title: formTitle.trim(), year: formYear, totalMarks: formTotalMarks, totalTimeMinutes: formTotalTimeMinutes, isPublished: formIsPublished };
    try {
      const url = editingAssignment ? `/api/assignments/${editingAssignment.id}` : "/api/assignments";
      const method = editingAssignment ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify(body) });
      if (handleAuthError(res)) return;
      if (res.ok) {
        toast({ title: "Success", description: editingAssignment ? "Assignment updated" : "Assignment created" });
        setIsCreateDialogOpen(false);
        fetchAssignments();
      } else {
        toast({ title: "Error", description: "Failed to save assignment", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Error saving assignment", variant: "destructive" });
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (handleAuthError(res)) return;
      if (res.ok) {
        toast({ title: "Success", description: "Assignment deleted" });
        if (expandedAssignment === id) setExpandedAssignment(null);
        fetchAssignments();
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete assignment", variant: "destructive" });
    }
  };

  const toggleExpandAssignment = (assignmentId: string) => {
    if (expandedAssignment === assignmentId) {
      setExpandedAssignment(null);
    } else {
      setExpandedAssignment(assignmentId);
    }
  };

  const toggleExpandSection = (sectionId: string) => {
    const next = new Set(expandedSections);
    if (next.has(sectionId)) {
      next.delete(sectionId);
    } else {
      next.add(sectionId);
      setExpandingSection(sectionId);
      setTimeout(() => setExpandingSection(null), 300);
    }
    setExpandedSections(next);
  };

  const openAddSectionDialog = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    const existingSections = assignment?.sections || [];
    setEditingSection({ assignmentId });
    setSectionFormType("sdd");
    setSectionFormTitle(SECTION_TYPES[0].name);
    setSectionFormCompulsory(SECTION_TYPES[0].compulsory);
    setSectionFormOrderIndex(existingSections.length);
  };

  const handleSaveSection = async () => {
    if (!editingSection) return;
    const body = {
      assignmentId: editingSection.assignmentId,
      sectionType: sectionFormType,
      title: sectionFormTitle.trim() || SECTION_TYPES.find(st => st.id === sectionFormType)?.name || "Section",
      isCompulsory: sectionFormCompulsory,
      orderIndex: sectionFormOrderIndex,
    };
    try {
      const url = editingSection.section
        ? `/api/assignment-sections/${editingSection.section.id}`
        : "/api/assignment-sections";
      const method = editingSection.section ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify(body) });
      if (handleAuthError(res)) return;
      if (res.ok) {
        toast({ title: "Success", description: editingSection.section ? "Section updated" : "Section added" });
        setEditingSection(null);
        fetchAssignmentDetails(editingSection.assignmentId);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to save section", variant: "destructive" });
    }
  };

  const handleDeleteSection = async (sectionId: string, assignmentId: string) => {
    try {
      const res = await fetch(`/api/assignment-sections/${sectionId}`, { method: "DELETE", headers: getAuthHeaders() });
      if (handleAuthError(res)) return;
      if (res.ok) {
        toast({ title: "Success", description: "Section deleted" });
        fetchAssignmentDetails(assignmentId);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete section", variant: "destructive" });
    }
  };

  const reorderSections = async (assignmentId: string, sectionId1: string, sectionId2: string, order1: number, order2: number) => {
    setLoadingSections(prev => { const next = new Set(prev); next.add(sectionId1); next.add(sectionId2); return next; });
    try {
      await Promise.all([
        fetch(`/api/assignment-sections/${sectionId1}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify({ orderIndex: order2 }) }),
        fetch(`/api/assignment-sections/${sectionId2}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify({ orderIndex: order1 }) }),
      ]);
      await new Promise(r => setTimeout(r, 300));
      await fetchAssignmentDetails(assignmentId);
    } catch (e) {
      toast({ title: "Error", description: "Failed to reorder sections", variant: "destructive" });
    } finally {
      setLoadingSections(prev => {
        const next = new Set(prev);
        next.delete(sectionId1);
        next.delete(sectionId2);
        return next;
      });
    }
  };

  const openPartDialog = (sectionId: string, assignmentId: string, part?: AssignmentPart) => {
    setEditingPart({ sectionId, part, assignmentId });
    if (part) {
      setPartFormLabel(part.partLabel);
      setPartFormTitle(part.title || "");
      setPartFormMaxMarks(part.maxMarks || 0);
      setPartFormOrderIndex(part.orderIndex || 0);
      setPartFormIsPractical(part.isPractical || false);
      setPartFormRequiresUpload(part.requiresUpload !== false);
      setPartFormInputStyle(part.inputStyle || "text");
      setPartFormAiGuidance(part.aiGradingGuidance || "");
      setPartFormContentBlocks((part.contentBlocks as ContentBlock[]) || []);
      setPartFormSubQuestions((part.subQuestions as AssignmentQuestion[]) || []);
    } else {
      const assignment = assignments.find(a => a.id === assignmentId);
      const section = assignment?.sections?.find(s => s.id === sectionId);
      const existingParts = section?.parts || [];
      const nextOrder = existingParts.length > 0
        ? Math.max(...existingParts.map(p => (p.orderIndex || 0))) + 1
        : 0;
      const usedLabels = existingParts.map(p => p.partLabel);
      const nextLabel = ["A", "B", "C", "D", "E"].find(l => !usedLabels.includes(l)) || "A";
      setPartFormLabel(nextLabel);
      setPartFormTitle("");
      setPartFormMaxMarks(0);
      setPartFormOrderIndex(nextOrder);
      setPartFormIsPractical(false);
      setPartFormRequiresUpload(true);
      setPartFormInputStyle("text");
      setPartFormAiGuidance("");
      setPartFormContentBlocks([]);
      setPartFormSubQuestions([]);
    }
  };

  const handleSavePart = async () => {
    if (!editingPart) return;
    const body: any = {
      sectionId: editingPart.sectionId,
      partLabel: partFormLabel,
      title: partFormTitle.trim() || null,
      maxMarks: partFormMaxMarks,
      orderIndex: partFormOrderIndex,
      isPractical: partFormIsPractical,
      requiresUpload: partFormRequiresUpload,
      inputStyle: partFormInputStyle,
      aiGradingGuidance: partFormAiGuidance.trim() || null,
      contentBlocks: partFormContentBlocks.length > 0 ? partFormContentBlocks : null,
      subQuestions: partFormSubQuestions.length > 0 ? partFormSubQuestions : null,
    };
    try {
      const url = editingPart.part
        ? `/api/assignment-parts/${editingPart.part.id}`
        : "/api/assignment-parts";
      const method = editingPart.part ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify(body) });
      if (handleAuthError(res)) return;
      if (res.ok) {
        toast({ title: "Success", description: editingPart.part ? "Part updated" : "Part added" });
        setEditingPart(null);
        fetchAssignmentDetails(editingPart.assignmentId);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to save part", variant: "destructive" });
    }
  };

  const handleDeletePart = async (partId: string, assignmentId: string) => {
    try {
      const res = await fetch(`/api/assignment-parts/${partId}`, { method: "DELETE", headers: getAuthHeaders() });
      if (handleAuthError(res)) return;
      if (res.ok) {
        toast({ title: "Success", description: "Part deleted" });
        fetchAssignmentDetails(assignmentId);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete part", variant: "destructive" });
    }
  };

  const handleUploadResource = async (partId: string, assignmentId: string, file: File, description: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description);
    try {
      const res = await fetch(`/api/assignment-parts/${partId}/resources`, { method: "POST", headers: getAuthHeaders(), body: formData });
      if (handleAuthError(res)) return;
      if (res.ok) {
        toast({ title: "Success", description: "File uploaded" });
        fetchAssignmentDetails(assignmentId);
      } else {
        toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    }
  };

  const handleDeleteResource = async (resourceId: string, assignmentId: string) => {
    try {
      const res = await fetch(`/api/assignment-resources/${resourceId}`, { method: "DELETE", headers: getAuthHeaders() });
      if (handleAuthError(res)) return;
      if (res.ok) {
        toast({ title: "Success", description: "Resource deleted" });
        fetchAssignmentDetails(assignmentId);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete resource", variant: "destructive" });
    }
  };

  const saveInfoSheet = async () => {
    if (!editingInfoSheet) return;
    try {
      const res = await fetch(`/api/assignment-sections/${editingInfoSheet.sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ informationSheet: editingInfoSheet.blocks }),
      });
      if (handleAuthError(res)) return;
      if (res.ok) {
        toast({ title: "Success", description: "Information sheet saved" });
        setEditingInfoSheet(null);
        setInfoSheetPreview(false);
        fetchAssignmentDetails(editingInfoSheet.assignmentId);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast({ title: "Error", description: errData.message || "Failed to save information sheet", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to save information sheet", variant: "destructive" });
    }
  };

  const saveChecklist = async (items: ChecklistItem[]) => {
    if (!editingChecklistAssignment) return;
    try {
      const res = await fetch(`/api/assignments/${editingChecklistAssignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ evidenceChecklist: items }),
      });
      if (handleAuthError(res)) return;
      setEditingChecklistAssignment(prev => prev ? { ...prev, evidenceChecklist: items } : null);
      setAssignments(prev => prev.map(a => a.id === editingChecklistAssignment.id ? { ...a, evidenceChecklist: items } : a));
    } catch (e) {
      toast({ title: "Error", description: "Failed to save checklist", variant: "destructive" });
    }
  };

  const handleSaveQuestions = async () => {
    if (!editingPart?.part) return;
    const totalMarks = getTotalMarks(partFormSubQuestions);
    try {
      const cleanQuestions = (qs: AssignmentQuestion[]): AssignmentQuestion[] =>
        qs.map(q => ({
          ...q,
          markingScheme: (q.markingScheme || []).filter(s => s.trim()),
          subParts: q.subParts ? cleanQuestions(q.subParts) : undefined,
        }));
      const res = await fetch(`/api/assignment-parts/${editingPart.part.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          ...editingPart.part,
          subQuestions: cleanQuestions(partFormSubQuestions),
          maxMarks: totalMarks,
        }),
      });
      if (handleAuthError(res)) return;
      if (res.ok) {
        toast({ title: "Success", description: "Questions saved" });
        setQuestionsModalOpen(false);
        fetchAssignmentDetails(editingPart.assignmentId);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to save questions", variant: "destructive" });
    }
  };

  const getSectionQuestionStartIndex = (assignment: Assignment, sectionId: string, partOrderIndex: number): number => {
    const section = assignment.sections?.find(s => s.id === sectionId);
    if (!section?.parts) return 0;
    let count = 0;
    for (const part of section.parts.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))) {
      if ((part.orderIndex || 0) >= partOrderIndex) break;
      if (part.subQuestions) {
        count += (part.subQuestions as AssignmentQuestion[]).length;
      }
    }
    return count;
  };

  const getSectionIndex = (assignment: Assignment, sectionId: string): number => {
    if (!assignment.sections) return 0;
    const sorted = [...assignment.sections].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    return sorted.findIndex(s => s.id === sectionId);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <div className="w-full bg-black dark:bg-neutral-800 py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/teacher/dashboard">
              <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="link-back-dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">Assignment Manager</h1>
              <p className="text-neutral-400 text-sm">Create and manage Higher coursework assignments</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700" data-testid="button-new-assignment">
              <Plus className="w-4 h-4 mr-2" /> New Assignment
            </Button>
            <ModeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
            <h2 className="text-xl font-bold mb-2" data-testid="text-empty-state">No Assignments Yet</h2>
            <p className="text-neutral-500 mb-4">Create a coursework assignment to get started.</p>
            <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Create Assignment
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id} data-testid={`card-assignment-${assignment.id}`}>
                <Collapsible open={expandedAssignment === assignment.id} onOpenChange={() => toggleExpandAssignment(assignment.id)}>
                  <CollapsibleTrigger className="w-full" asChild>
                    <div className="p-4 cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {expandedAssignment === assignment.id ? <ChevronDown className="h-5 w-5 flex-shrink-0" /> : <ChevronRight className="h-5 w-5 flex-shrink-0" />}
                          <div>
                            <span className="font-bold">{assignment.year} - {assignment.title}</span>
                            <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(assignment.totalTimeMinutes || 360)}</span>
                              <span>{assignment.totalMarks || 40} marks</span>
                              <span className={`text-xs font-medium ${assignment.isPublished ? "text-green-600" : "text-amber-500"}`}>
                                {assignment.isPublished ? "Published" : "Draft"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => openSubmissionsDialog(assignment)} data-testid={`button-submissions-${assignment.id}`} title="View Student Submissions">
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(assignment)} data-testid={`button-edit-assignment-${assignment.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600" data-testid={`button-delete-assignment-${assignment.id}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{assignment.title}"?</AlertDialogTitle>
                                <AlertDialogDescription>This will delete this assignment and all its sections, parts, and resources. This cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteAssignment(assignment.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Sections</h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setEditingChecklistAssignment(assignment);
                            setChecklistEditorOpen(true);
                          }} data-testid={`button-manage-checklist-${assignment.id}`}>
                            <ClipboardList className="h-3 w-3 mr-1" /> Manage Checklist
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openAddSectionDialog(assignment.id)} data-testid={`button-add-section-${assignment.id}`}>
                            <Plus className="h-3 w-3 mr-1" /> Add Section
                          </Button>
                        </div>
                      </div>

                      {(assignment.sections || [])
                        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                        .map((section, sIdx, sortedSections) => (
                          <div
                            key={section.id}
                            className={`border rounded-lg ${loadingSections.has(section.id) ? "opacity-50" : ""}`}
                          >
                            <Collapsible open={expandedSections.has(section.id)} onOpenChange={() => toggleExpandSection(section.id)}>
                              <CollapsibleTrigger className="w-full" asChild>
                                <div className="p-3 cursor-pointer">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {loadingSections.has(section.id) || expandingSection === section.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : expandedSections.has(section.id) ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                      <span className="font-medium">Task {sIdx + 1} - {section.title}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        section.isCompulsory
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                      }`}>
                                        {section.isCompulsory ? "Compulsory" : "Optional"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        disabled={sIdx === 0}
                                        onClick={() => {
                                          const prev = sortedSections[sIdx - 1];
                                          if (prev) reorderSections(assignment.id, section.id, prev.id, section.orderIndex || 0, prev.orderIndex || 0);
                                        }}
                                      >
                                        <ArrowUp className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        disabled={sIdx === sortedSections.length - 1}
                                        onClick={() => {
                                          const next = sortedSections[sIdx + 1];
                                          if (next) reorderSections(assignment.id, section.id, next.id, section.orderIndex || 0, next.orderIndex || 0);
                                        }}
                                      >
                                        <ArrowDown className="h-3 w-3" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600">
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete this section?</AlertDialogTitle>
                                            <AlertDialogDescription>This will delete "{section.title}" and all its parts.</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteSection(section.id, assignment.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <div className="border-t p-3 space-y-3">
                                  <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-purple-600" />
                                      <span className="text-sm font-medium">Information Sheet</span>
                                      {(section.informationSheet as ContentBlock[] | undefined)?.length ? (
                                        <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                          {(section.informationSheet as ContentBlock[]).length} blocks
                                        </span>
                                      ) : null}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setEditingInfoSheet({
                                      sectionId: section.id,
                                      assignmentId: assignment.id,
                                      blocks: (section.informationSheet as ContentBlock[]) || [],
                                    })}>
                                      <Pencil className="h-3 w-3 mr-1" /> Edit
                                    </Button>
                                  </div>
                                  <p className="text-xs text-neutral-500">Reference material students can access across all parts (A, B, C) in this section.</p>

                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Parts</span>
                                    <Button variant="outline" size="sm" onClick={() => openPartDialog(section.id, assignment.id)}>
                                      <Plus className="h-3 w-3 mr-1" /> Add Part
                                    </Button>
                                  </div>

                                  <div className="space-y-2">
                                    {(section.parts || [])
                                      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                                      .map((part) => (
                                        <PartCard
                                          key={part.id}
                                          part={part}
                                          onEdit={() => openPartDialog(section.id, assignment.id, part)}
                                          onDelete={() => handleDeletePart(part.id, assignment.id)}
                                          onUploadResource={(file, desc) => handleUploadResource(part.id, assignment.id, file, desc)}
                                          onDeleteResource={(resourceId) => handleDeleteResource(resourceId, assignment.id)}
                                        />
                                      ))}
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        ))}

                      {(!assignment.sections || assignment.sections.length === 0) && (
                        <p className="text-sm text-neutral-500 text-center py-4">No sections yet. Click "Add Section" to create one.</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Assignment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl" onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = "auto"; }}>
          <DialogHeader>
            <DialogTitle>{editingAssignment ? "Edit Assignment" : "Create Assignment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g., Higher Computing Science Assignment" data-testid="input-assignment-title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <Input type="number" value={formYear} onChange={(e) => setFormYear(parseInt(e.target.value) || 2024)} data-testid="input-assignment-year" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Marks</label>
                <Input type="number" value={formTotalMarks} onChange={(e) => setFormTotalMarks(parseInt(e.target.value) || 0)} data-testid="input-assignment-marks" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time Limit (minutes)</label>
              <Input type="number" value={formTotalTimeMinutes} onChange={(e) => setFormTotalTimeMinutes(parseInt(e.target.value) || 0)} data-testid="input-assignment-time" />
              <p className="text-xs text-neutral-500 mt-1">Default: 360 minutes (6 hours)</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formIsPublished} onCheckedChange={setFormIsPublished} data-testid="switch-assignment-published" />
              <label className="text-sm font-medium">Publish (visible to students)</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAssignment} className="bg-blue-600 hover:bg-blue-700" data-testid="button-save-assignment">
              {editingAssignment ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(open) => { if (!open) setEditingSection(null); }}>
        <DialogContent onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = "auto"; }}>
          <DialogHeader>
            <DialogTitle>{editingSection?.section ? "Edit Section" : "Add Section"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Section Type</label>
              <Select value={sectionFormType} onValueChange={(v) => {
                setSectionFormType(v);
                const st = SECTION_TYPES.find(s => s.id === v);
                if (st) {
                  setSectionFormTitle(st.name);
                  setSectionFormCompulsory(st.compulsory);
                }
              }}>
                <SelectTrigger data-testid="select-section-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map((st) => (
                    <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input value={sectionFormTitle} onChange={(e) => setSectionFormTitle(e.target.value)} data-testid="input-section-title" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={sectionFormCompulsory} onCheckedChange={setSectionFormCompulsory} />
              <label className="text-sm font-medium">Compulsory</label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Order Index</label>
              <Input type="number" value={sectionFormOrderIndex} onChange={(e) => setSectionFormOrderIndex(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
            <Button onClick={handleSaveSection} className="bg-blue-600 hover:bg-blue-700" data-testid="button-save-section">
              {editingSection?.section ? "Save" : "Add Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Part Dialog */}
      <Dialog open={!!editingPart} onOpenChange={(open) => { if (!open) setEditingPart(null); }}>
        <DialogContent className="max-w-5xl" onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = "auto"; }}>
          <DialogHeader>
            <DialogTitle>{editingPart?.part ? "Edit Part" : "Add Part"}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-4 py-4 px-1">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Part Label</label>
                <Select value={partFormLabel} onValueChange={setPartFormLabel}>
                  <SelectTrigger data-testid="select-part-label">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["A", "B", "C", "D", "E"].map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Marks</label>
                <div className="h-10 flex items-center text-sm border rounded-md px-3 bg-neutral-50 dark:bg-neutral-800" data-testid="input-part-marks">
                  <span className={partFormMaxMarks > 0 ? "font-medium" : "text-neutral-400"}>
                    {partFormMaxMarks > 0 ? `${partFormMaxMarks} mark${partFormMaxMarks !== 1 ? "s" : ""}` : "Computed from tasks"}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order</label>
                <Input type="number" value={partFormOrderIndex} onChange={(e) => setPartFormOrderIndex(parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input value={partFormTitle} onChange={(e) => setPartFormTitle(e.target.value)} placeholder="e.g., Analysis and Design" data-testid="input-part-title" />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={partFormIsPractical} onCheckedChange={setPartFormIsPractical} />
                <label className="text-sm">Practical Work</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={partFormRequiresUpload} onCheckedChange={setPartFormRequiresUpload} />
                <label className="text-sm">Requires Upload</label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Input Style</label>
              <Select value={partFormInputStyle} onValueChange={setPartFormInputStyle}>
                <SelectTrigger data-testid="select-part-input-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PART_INPUT_STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Content Blocks</span>
              </div>
              <ContentBlockEditor blocks={partFormContentBlocks} onChange={setPartFormContentBlocks} />
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Tasks</span>
                  {partFormSubQuestions.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">
                      {getLeafQuestions(partFormSubQuestions).length} tasks ({getTotalMarks(partFormSubQuestions)} marks)
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  if (editingPart?.part) {
                    setQuestionsModalOpen(true);
                  } else {
                    toast({ title: "Save the part first", description: "You need to save this part before adding tasks.", variant: "destructive" });
                  }
                }}>
                  {partFormSubQuestions.length > 0 ? "Edit Tasks" : "Add Tasks"}
                </Button>
              </div>
              {partFormSubQuestions.length === 0 && (
                <p className="text-xs text-neutral-500">No tasks yet. Save this part first, then add tasks.</p>
              )}
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPart(null)}>Cancel</Button>
            <Button onClick={handleSavePart} className="bg-blue-600 hover:bg-blue-700" data-testid="button-save-part">
              {editingPart?.part ? "Save" : "Add Part"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Questions Editor Modal */}
      <Dialog open={questionsModalOpen} onOpenChange={setQuestionsModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh]" onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = "auto"; }}>
          <DialogHeader>
            <DialogTitle>Tasks - Part {editingPart?.part?.partLabel || partFormLabel}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto px-1">
            {editingPart && (
              <AssignmentQuestionEditor
                questions={partFormSubQuestions}
                onChange={(qs) => {
                  setPartFormSubQuestions(qs);
                  setPartFormMaxMarks(getTotalMarks(qs));
                }}
                isAssignment
                questionNumberPrefix={(() => {
                  const assignment = assignments.find(a => a.id === editingPart.assignmentId);
                  if (!assignment) return 1;
                  return getSectionIndex(assignment, editingPart.sectionId) + 1;
                })()}
                questionStartIndex={(() => {
                  const assignment = assignments.find(a => a.id === editingPart.assignmentId);
                  if (!assignment) return 0;
                  return getSectionQuestionStartIndex(assignment, editingPart.sectionId, editingPart.part?.orderIndex || 0);
                })()}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveQuestions} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-1" /> Save Questions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Information Sheet Dialog */}
      <Dialog open={!!editingInfoSheet} onOpenChange={(open) => { if (!open) { setEditingInfoSheet(null); setInfoSheetPreview(false); } }}>
        <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col" onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = "auto"; }}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Information Sheet</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setInfoSheetPreview(!infoSheetPreview)}>
                <Eye className="h-4 w-4 mr-1" /> {infoSheetPreview ? "Edit" : "Preview"}
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-1">
            {editingInfoSheet && (
              infoSheetPreview ? (
                <ContentBlockPreview blocks={editingInfoSheet.blocks} />
              ) : (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3 flex items-center gap-2">
                    <Clipboard className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-xs text-blue-700 dark:text-blue-300">Tip: You can paste images directly into the editor.</span>
                  </div>
                  <ContentBlockEditor
                    blocks={editingInfoSheet.blocks}
                    onChange={(blocks) => setEditingInfoSheet({ ...editingInfoSheet, blocks })}
                    allowGrouping
                  />
                </>
              )
            )}
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => { setEditingInfoSheet(null); setInfoSheetPreview(false); }}>Cancel</Button>
            <Button type="button" onClick={saveInfoSheet} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-1" /> Save Information Sheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={submissionsDialogOpen} onOpenChange={setSubmissionsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Submissions — {submissionsAssignment?.title}</DialogTitle>
          </DialogHeader>
          {submissionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No student submissions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub: any) => (
                <Card key={sub.attemptId} className="overflow-hidden" data-testid={`card-submission-${sub.attemptId}`}>
                  <div
                    className="p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    onClick={() => setExpandedSubmission(expandedSubmission === sub.attemptId ? null : sub.attemptId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedSubmission === sub.attemptId ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="font-medium">{sub.studentUsername}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sub.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"}`}>
                          {sub.status === "completed" ? "Completed" : "In Progress"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        {sub.gradedResponses > 0 && (
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">
                            Score: {sub.totalScore}
                          </span>
                        )}
                        <span>{sub.totalResponses} response{sub.totalResponses !== 1 ? "s" : ""}</span>
                        {sub.completedAt && (
                          <span>{new Date(sub.completedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedSubmission === sub.attemptId && (
                    <div className="border-t p-3 space-y-2 bg-neutral-50 dark:bg-neutral-900/50">
                      <div className="text-sm text-neutral-500 mb-2">
                        Started: {sub.startedAt ? new Date(sub.startedAt).toLocaleString() : "Unknown"}
                        {sub.completedAt && <> · Completed: {new Date(sub.completedAt).toLocaleString()}</>}
                        {sub.completedParts > 0 && <> · {sub.completedParts} parts completed</>}
                      </div>
                      {sub.responses.length === 0 ? (
                        <p className="text-sm text-neutral-400 italic">No responses recorded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {sub.responses.map((r: any, idx: number) => (
                            <div key={idx} className="border rounded p-2 bg-white dark:bg-neutral-950 text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-xs text-neutral-600 dark:text-neutral-400">{r.partId}</span>
                                {r.marksAwarded !== null && r.marksAwarded !== undefined && (
                                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                    {r.marksAwarded} marks
                                  </span>
                                )}
                              </div>
                              {r.textAnswer && (
                                <div className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap text-xs mb-1 max-h-32 overflow-y-auto">
                                  {r.textAnswer}
                                </div>
                              )}
                              {r.aiFeedback && (
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 border-t pt-1 mt-1 whitespace-pre-wrap max-h-24 overflow-y-auto">
                                  {r.aiFeedback}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Evidence Checklist Dialog */}
      <Dialog open={checklistEditorOpen} onOpenChange={(open) => { if (!open) setChecklistEditorOpen(false); }}>
        <DialogContent className="max-w-5xl max-h-[80vh]" onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = "auto"; }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" /> Evidence Checklist
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-4 px-1">
            <div className="flex gap-2 items-end">
              <div className="w-32">
                <label className="block text-xs font-medium mb-1">Section</label>
                <Select value={newChecklistSection} onValueChange={setNewChecklistSection}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((st) => (
                      <SelectItem key={st.id} value={st.id}>{st.id.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-16">
                <label className="block text-xs font-medium mb-1">Part</label>
                <Input value={newChecklistPartLabel} onChange={(e) => setNewChecklistPartLabel(e.target.value)} className="h-8" />
              </div>
              <div className="w-16">
                <label className="block text-xs font-medium mb-1">Q#</label>
                <Input value={newChecklistQuestionNumber} onChange={(e) => setNewChecklistQuestionNumber(e.target.value)} className="h-8" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">Description</label>
                <Input
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Evidence required..."
                  className="h-8"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newChecklistItem.trim()) {
                      const items = [...(editingChecklistAssignment?.evidenceChecklist || [])];
                      items.push({
                        id: `item-${Date.now()}`,
                        sectionType: newChecklistSection,
                        partLabel: newChecklistPartLabel,
                        questionNumber: newChecklistQuestionNumber,
                        description: newChecklistItem.trim(),
                      });
                      saveChecklist(items);
                      setNewChecklistItem("");
                      setNewChecklistQuestionNumber("");
                    }
                  }}
                />
              </div>
              <Button size="sm" className="h-8" onClick={() => {
                if (!newChecklistItem.trim()) return;
                const items = [...(editingChecklistAssignment?.evidenceChecklist || [])];
                items.push({
                  id: `item-${Date.now()}`,
                  sectionType: newChecklistSection,
                  partLabel: newChecklistPartLabel,
                  questionNumber: newChecklistQuestionNumber,
                  description: newChecklistItem.trim(),
                });
                saveChecklist(items);
                setNewChecklistItem("");
                setNewChecklistQuestionNumber("");
              }}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {(() => {
              const items = editingChecklistAssignment?.evidenceChecklist || [];
              if (items.length === 0) return <p className="text-sm text-neutral-500 text-center py-4">No checklist items yet.</p>;

              const grouped: Record<string, Record<string, ChecklistItem[]>> = {};
              for (const item of items) {
                if (!grouped[item.sectionType]) grouped[item.sectionType] = {};
                if (!grouped[item.sectionType][item.partLabel]) grouped[item.sectionType][item.partLabel] = [];
                grouped[item.sectionType][item.partLabel].push(item);
              }

              return Object.entries(grouped).map(([sType, parts]) => (
                <div key={sType} className="space-y-2">
                  <h4 className="text-sm font-bold uppercase text-neutral-600 dark:text-neutral-400">{sType}</h4>
                  {Object.entries(parts).map(([partLabel, partItems]) => (
                    <div key={partLabel}>
                      <h5 className="text-xs font-medium text-neutral-500 mb-1">Part {partLabel}</h5>
                      <table className="w-full text-sm border">
                        <thead>
                          <tr className="bg-neutral-50 dark:bg-neutral-800">
                            <th className="border px-2 py-1 text-left w-20">Q#</th>
                            <th className="border px-2 py-1 text-left">Evidence Required</th>
                            <th className="border px-2 py-1 w-20">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {partItems.map((item) => (
                            <tr key={item.id}>
                              {editingChecklistItemData?.id === item.id ? (
                                <>
                                  <td className="border px-2 py-1" colSpan={3}>
                                    <div className="space-y-2">
                                      <div className="flex gap-2 items-center">
                                        <div className="flex-1">
                                          <label className="text-[10px] text-neutral-500 block mb-0.5">Section</label>
                                          <Select value={editingChecklistItemData.sectionType} onValueChange={(v) => setEditingChecklistItemData({ ...editingChecklistItemData, sectionType: v })}>
                                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                              {SECTION_TYPES.map(st => (
                                                <SelectItem key={st.id} value={st.id}>{st.id.toUpperCase()}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="w-16">
                                          <label className="text-[10px] text-neutral-500 block mb-0.5">Part</label>
                                          <Input
                                            value={editingChecklistItemData.partLabel}
                                            onChange={(e) => setEditingChecklistItemData({ ...editingChecklistItemData, partLabel: e.target.value })}
                                            className="h-7 text-xs"
                                          />
                                        </div>
                                        <div className="w-16">
                                          <label className="text-[10px] text-neutral-500 block mb-0.5">Q#</label>
                                          <Input
                                            value={editingChecklistItemData.questionNumber}
                                            onChange={(e) => setEditingChecklistItemData({ ...editingChecklistItemData, questionNumber: e.target.value })}
                                            className="h-7 text-xs"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                          <label className="text-[10px] text-neutral-500 block mb-0.5">Evidence</label>
                                          <Input
                                            value={editingChecklistItemData.description}
                                            onChange={(e) => setEditingChecklistItemData({ ...editingChecklistItemData, description: e.target.value })}
                                            className="h-7 text-xs"
                                          />
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => {
                                          const newItems = items.map(i => i.id === editingChecklistItemData.id ? editingChecklistItemData : i);
                                          saveChecklist(newItems);
                                          setEditingChecklistItemData(null);
                                        }}>
                                          <Check className="h-3 w-3 text-green-600 mr-1" /> Save
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditingChecklistItemData(null)}>
                                          <X className="h-3 w-3 mr-1" /> Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="border px-2 py-1">{item.questionNumber}</td>
                                  <td className="border px-2 py-1">{item.description}</td>
                                  <td className="border px-2 py-1 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingChecklistItemData(item)}>
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-600" onClick={() => {
                                        const newItems = items.filter(i => i.id !== item.id);
                                        saveChecklist(newItems);
                                      }}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
