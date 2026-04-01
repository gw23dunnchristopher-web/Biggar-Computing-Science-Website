import { useState, useEffect, useRef, useCallback } from "react";

// Helper component for comma-separated options input that only parses on blur
function OptionsInput({ 
  value, 
  onChange, 
  placeholder, 
  className 
}: { 
  value: string[] | undefined; 
  onChange: (options: string[]) => void; 
  placeholder?: string;
  className?: string;
}) {
  const [localValue, setLocalValue] = useState(value?.join(", ") || "");
  
  // Sync local value when prop changes (e.g., loading different question)
  useEffect(() => {
    setLocalValue(value?.join(", ") || "");
  }, [value]);
  
  const handleBlur = useCallback(() => {
    const parsed = localValue.split(",").map(s => s.trim()).filter(Boolean);
    onChange(parsed);
  }, [localValue, onChange]);
  
  return (
    <Input 
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}
import { useLocation, useRoute } from "wouter";
import { useQuestions } from "@/lib/QuestionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save, ChevronDown, ChevronUp, Upload, PlusCircle, X, MoveUp, MoveDown, Type, Image, Code, AlignLeft, AlignCenter, AlignRight, Eye, Layers, Ungroup, Settings, Square } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Question, SubQuestion, TOPICS, ContentBlock, ContentBlockType, CodeSection, DataTableCell, DataTableCellRole, DatabaseSchema, PseudocodeLine } from "@/lib/past-papers";

// Helper functions for DataTable cells (handles both string and object cells)
const getCellValue = (cell: string | DataTableCell): string => {
  return typeof cell === "string" ? cell : cell.value;
};

const getCellRole = (cell: string | DataTableCell): DataTableCellRole => {
  return typeof cell === "string" ? "data" : (cell.role || "data");
};

const getCellColSpan = (cell: string | DataTableCell): number => {
  return typeof cell === "string" ? 1 : (cell.colSpan || 1);
};

const getCellRowSpan = (cell: string | DataTableCell): number => {
  return typeof cell === "string" ? 1 : (cell.rowSpan || 1);
};

const isCellHidden = (cell: string | DataTableCell): boolean => {
  return typeof cell === "string" ? false : (cell.hidden || false);
};

const createCell = (value: string, role: DataTableCellRole = "data", colSpan: number = 1, rowSpan: number = 1): DataTableCell => {
  return { value, role, colSpan, rowSpan };
};

const updateCellValue = (cell: string | DataTableCell, value: string): string | DataTableCell => {
  if (typeof cell === "string") return value;
  return { ...cell, value };
};

const updateCellRole = (cell: string | DataTableCell, role: DataTableCellRole): DataTableCell => {
  if (typeof cell === "string") return { value: cell, role };
  return { ...cell, role };
};
import { Table, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DiagramEditor, DiagramItem } from "@/components/ui/diagram-editor";
import { TagMatchingEditor, SourceTag, TargetZone } from "@/components/ui/tag-matching-editor";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { DatabaseSchemaEditor, DatabaseSchemaDisplay } from "@/components/ui/database-schema-editor";
import { DataTableEditorModal } from "@/components/ui/data-table-editor-modal";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { RowLayout, RowLayoutItem } from "@/components/ui/row-layout";

// Helper to migrate legacy sub-part fields to content blocks
function migrateLegacySubPartContent(question: Question): Question {
  const migrated = { ...question };
  
  migrated.subQuestions = migrated.subQuestions.map((subQ, subQIdx) => {
    if (!subQ.subParts || subQ.subParts.length === 0) return subQ;
    
    return {
      ...subQ,
      subParts: subQ.subParts.map((part, partIdx) => {
        // Skip if content blocks already exist
        if (part.contentBlocks && part.contentBlocks.length > 0) return part;
        
        // Check if any legacy fields exist
        const hasLegacy = part.questionText || part.imageUrl || part.codeSnippet || part.preCodeText;
        if (!hasLegacy) return part;
        
        // Build content blocks from legacy fields in order:
        // 1. questionText, 2. image, 3. preCodeText (before code), 4. code
        const newBlocks: ContentBlock[] = [];
        const idPrefix = `cb-${subQIdx}-${partIdx}-${Date.now()}`;
        
        // 1. questionText as text block (main question)
        if (part.questionText) {
          newBlocks.push({
            id: `${idPrefix}-txt`,
            type: "text",
            content: part.questionText
          });
        }
        
        // 2. imageUrl as image block (with caption if exists)
        if (part.imageUrl) {
          newBlocks.push({
            id: `${idPrefix}-img`,
            type: "image",
            content: part.imageUrl,
            caption: part.imageCaption || "",
            imageSize: "medium"
          });
        }
        
        // 3. preCodeText as text block (context before code)
        if (part.preCodeText) {
          newBlocks.push({
            id: `${idPrefix}-pre`,
            type: "text",
            content: part.preCodeText
          });
        }
        
        // 4. codeSnippet as code block
        if (part.codeSnippet) {
          newBlocks.push({
            id: `${idPrefix}-code`,
            type: "code",
            content: part.codeSnippet
          });
        }
        
        return {
          ...part,
          contentBlocks: newBlocks
        };
      })
    };
  });
  
  return migrated;
}

export default function QuestionEditor() {
  const [, params] = useRoute("/teacher/question/:id");
  const [, setLocation] = useLocation();
  const { getQuestion, addQuestion, updateQuestion } = useQuestions();
  const { toast } = useToast();
  const isNew = params?.id === "new";
  const hasLoadedRef = useRef(false);

  const [formData, setFormData] = useState<Question>({
    id: "",
    year: new Date().getFullYear(),
    topic: "sdcs",
    title: "Question X",
    isPractice: false,
    scenario: { text: "" },
    subQuestions: []
  });
  
  const [additionalExamsList, setAdditionalExamsList] = useState<Array<{ id: string; title: string }>>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  // State for data table editor modal
  const [dataTableModalOpen, setDataTableModalOpen] = useState(false);
  const [editingDataTable, setEditingDataTable] = useState<{
    type: "scenario" | "subQuestion" | "subPart";
    blockIndex: number;
    subIndex?: number;
    partIndex?: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/additional-exams")
      .then(r => r.json())
      .then(setAdditionalExamsList)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    
    if (!isNew && params?.id) {
      const existing = getQuestion(params.id);
      if (existing) {
        // Deep copy and migrate legacy sub-part content to content blocks
        const copied = JSON.parse(JSON.stringify(existing));
        const migrated = migrateLegacySubPartContent(copied);
        setFormData(migrated);
        hasLoadedRef.current = true;
      }
    } else if (isNew) {
        // Initialize new ID
        setFormData(prev => ({ ...prev, id: `q-${Date.now()}` }));
        hasLoadedRef.current = true;
    }
  }, [isNew, params?.id, getQuestion]);

  const handleSave = async (exitAfterSave: boolean = false) => {
    if (!formData.title || (!formData.year && !formData.isAdditionalExam)) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please fill in the title and year.",
        });
        return;
    }

    if (isNew) {
        const success = await addQuestion(formData);
        if (success) {
            toast({ title: "Question Created", description: "New question added successfully." });
            if (exitAfterSave) {
                setLocation("/teacher/dashboard");
            } else {
                // Navigate to the actual question URL so subsequent saves work correctly
                setLocation(`/teacher/question/${formData.id}`);
            }
        } else {
            toast({ 
                variant: "destructive",
                title: "Save Failed", 
                description: "Failed to create question. Please try again." 
            });
        }
    } else {
        const success = await updateQuestion(formData);
        if (success) {
            toast({ title: "Question Saved", description: "Changes saved successfully." });
            if (exitAfterSave) {
                setLocation("/teacher/dashboard");
            }
        } else {
            toast({ 
                variant: "destructive",
                title: "Save Failed", 
                description: "Failed to save changes. Please try again." 
            });
        }
    }
  };

  const addSubQuestion = () => {
    const newSub: SubQuestion = {
        id: `${formData.id}-sub-${Date.now()}`,
        label: `(${String.fromCharCode(97 + formData.subQuestions.length)})`, // a, b, c...
        questionText: "",
        maxMarks: 1,
        markingScheme: [],
        keywords: [],
        aiGuidance: "",
        inputStyle: "text"
    };
    setFormData(prev => ({
        ...prev,
        subQuestions: [...prev.subQuestions, newSub]
    }));
  };

  const removeSubQuestion = (index: number) => {
    setFormData(prev => ({
        ...prev,
        subQuestions: prev.subQuestions.filter((_, i) => i !== index)
    }));
  };

  const insertSubQuestionAfter = (index: number) => {
    const newSub: SubQuestion = {
        id: `${formData.id}-sub-${Date.now()}`,
        label: "",
        questionText: "",
        maxMarks: 1,
        markingScheme: [],
        keywords: [],
        aiGuidance: "",
        inputStyle: "text"
    };
    setFormData(prev => {
        const updated = [...prev.subQuestions];
        updated.splice(index + 1, 0, newSub);
        return { ...prev, subQuestions: updated };
    });
  };

  const addSubPart = (subIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const existingParts = subQ.subParts || [];
    const romanNumerals = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
    const newPart: SubQuestion = {
        id: `${subQ.id}-part-${Date.now()}`,
        label: `(${romanNumerals[existingParts.length] || existingParts.length + 1})`,
        questionText: "",
        maxMarks: 1,
        markingScheme: [],
        keywords: [],
        aiGuidance: "",
        inputStyle: "text"
    };
    updateSubQuestion(subIndex, "subParts", [...existingParts, newPart]);
  };

  const removeSubPart = (subIndex: number, partIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const updatedParts = (subQ.subParts || []).filter((_, i) => i !== partIndex);
    updateSubQuestion(subIndex, "subParts", updatedParts.length > 0 ? updatedParts : undefined);
  };

  const updateSubPart = (subIndex: number, partIndex: number, field: keyof SubQuestion | string, value: any) => {
    const subQ = formData.subQuestions[subIndex];
    const updatedParts = [...(subQ.subParts || [])];
    updatedParts[partIndex] = { ...updatedParts[partIndex], [field]: value };
    updateSubQuestion(subIndex, "subParts", updatedParts);
  };

  const insertSubPartAfter = (subIndex: number, partIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const existingParts = subQ.subParts || [];
    const newPart: SubQuestion = {
        id: `${subQ.id}-part-${Date.now()}`,
        label: "",
        questionText: "",
        maxMarks: 1,
        markingScheme: [],
        keywords: [],
        aiGuidance: "",
        inputStyle: "text"
    };
    const updatedParts = [...existingParts];
    updatedParts.splice(partIndex + 1, 0, newPart);
    updateSubQuestion(subIndex, "subParts", updatedParts);
  };

  // Sub-part table/grid configuration helpers
  const initSubPartGridTable = (subIndex: number, partIndex: number, numCols: number = 3, numRows: number = 3) => {
    const headers = Array.from({ length: numCols }, (_, i) => `Column ${i + 1}`);
    const rows = Array.from({ length: numRows }, (_, rowIdx) => ({
      cells: Array.from({ length: numCols }, (_, colIdx) => ({
        value: "",
        isInput: false,
        key: `cell_${rowIdx}_${colIdx}`
      }))
    }));
    updateSubPart(subIndex, partIndex, "inputConfig", { grid: { headers, rows } });
  };

  const updateSubPartGridHeader = (subIndex: number, partIndex: number, colIndex: number, value: string) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const grid = part?.inputConfig?.grid;
    if (!grid) return;
    const newHeaders = [...grid.headers];
    newHeaders[colIndex] = value;
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part.inputConfig, grid: { ...grid, headers: newHeaders } });
  };

  const updateSubPartGridCell = (subIndex: number, partIndex: number, rowIndex: number, cellIndex: number, field: string, value: any) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const grid = part?.inputConfig?.grid;
    if (!grid) return;
    const newRows = grid.rows.map((row, rIdx) => {
      if (rIdx !== rowIndex) return row;
      return {
        cells: row.cells.map((cell, cIdx) => {
          if (cIdx !== cellIndex) return cell;
          return { ...cell, [field]: value };
        })
      };
    });
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part.inputConfig, grid: { ...grid, rows: newRows } });
  };

  const addSubPartGridColumn = (subIndex: number, partIndex: number) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const grid = part?.inputConfig?.grid;
    if (!grid) return;
    const newColIndex = grid.headers.length;
    const newHeaders = [...grid.headers, `Column ${newColIndex + 1}`];
    const newRows = grid.rows.map((row, rowIdx) => ({
      cells: [...row.cells, { value: "", isInput: false, key: `cell_${rowIdx}_${newColIndex}` }]
    }));
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part.inputConfig, grid: { headers: newHeaders, rows: newRows } });
  };

  const removeSubPartGridColumn = (subIndex: number, partIndex: number, colIndex: number) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const grid = part?.inputConfig?.grid;
    if (!grid || grid.headers.length <= 1) return;
    const newHeaders = grid.headers.filter((_, i) => i !== colIndex);
    const newRows = grid.rows.map(row => ({
      cells: row.cells.filter((_, i) => i !== colIndex)
    }));
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part.inputConfig, grid: { headers: newHeaders, rows: newRows } });
  };

  const addSubPartGridRow = (subIndex: number, partIndex: number) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const grid = part?.inputConfig?.grid;
    if (!grid) return;
    const newRowIndex = grid.rows.length;
    const newRow = {
      cells: grid.headers.map((_, colIdx) => ({
        value: "",
        isInput: false,
        key: `cell_${newRowIndex}_${colIdx}`
      }))
    };
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part.inputConfig, grid: { ...grid, rows: [...grid.rows, newRow] } });
  };

  const removeSubPartGridRow = (subIndex: number, partIndex: number, rowIndex: number) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const grid = part?.inputConfig?.grid;
    if (!grid || grid.rows.length <= 1) return;
    const newRows = grid.rows.filter((_, i) => i !== rowIndex);
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part.inputConfig, grid: { ...grid, rows: newRows } });
  };

  const initSubPartLabeledInputs = (subIndex: number, partIndex: number) => {
    updateSubPart(subIndex, partIndex, "inputConfig", {
      fields: [{ label: "Field 1", key: "field1" }]
    });
  };

  const addSubPartLabeledField = (subIndex: number, partIndex: number) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const fields = part?.inputConfig?.fields || [];
    const newField = { label: `Field ${fields.length + 1}`, key: `field${fields.length + 1}` };
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part?.inputConfig, fields: [...fields, newField] });
  };

  const updateSubPartLabeledField = (subIndex: number, partIndex: number, fieldIndex: number, prop: string, value: string) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const fields = [...(part?.inputConfig?.fields || [])];
    fields[fieldIndex] = { ...fields[fieldIndex], [prop]: value };
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part?.inputConfig, fields });
  };

  const removeSubPartLabeledField = (subIndex: number, partIndex: number, fieldIndex: number) => {
    const part = formData.subQuestions[subIndex]?.subParts?.[partIndex];
    const fields = (part?.inputConfig?.fields || []).filter((_, i) => i !== fieldIndex);
    updateSubPart(subIndex, partIndex, "inputConfig", { ...part?.inputConfig, fields });
  };

  const updateSubQuestion = (index: number, field: keyof SubQuestion | string, value: any) => {
    setFormData(prev => {
        const updated = [...prev.subQuestions];
        updated[index] = { ...updated[index], [field]: value };
        return { ...prev, subQuestions: updated };
    });
  };

  const initTableConfig = (subIndex: number) => {
    updateSubQuestion(subIndex, "inputConfig", {
      headers: ["Item", "Value"],
      rows: [{ label: "Row 1", value: "", isInput: true, key: "row1" }]
    });
  };

  const addTableRow = (subIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const rows = subQ.inputConfig?.rows || [];
    const newRow = { 
      label: `Row ${rows.length + 1}`, 
      value: "", 
      isInput: true, 
      key: `row${rows.length + 1}` 
    };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      rows: [...rows, newRow]
    });
  };

  const updateTableRow = (subIndex: number, rowIndex: number, field: string, value: any) => {
    const subQ = formData.subQuestions[subIndex];
    const rows = [...(subQ.inputConfig?.rows || [])];
    rows[rowIndex] = { ...rows[rowIndex], [field]: value };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      rows
    });
  };

  const removeTableRow = (subIndex: number, rowIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const rows = (subQ.inputConfig?.rows || []).filter((_, i) => i !== rowIndex);
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      rows
    });
  };

  // Column-based table functions
  const initColumnTableConfig = (subIndex: number) => {
    updateSubQuestion(subIndex, "inputConfig", {
      columns: [
        { header: "Column 1", key: "col1" },
        { header: "Column 2", key: "col2" }
      ],
      inputRows: 1
    });
  };

  const addTableColumn = (subIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const columns = subQ.inputConfig?.columns || [];
    const newCol = { 
      header: `Column ${columns.length + 1}`, 
      key: `col${columns.length + 1}` 
    };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      columns: [...columns, newCol]
    });
  };

  const updateTableColumn = (subIndex: number, colIndex: number, field: string, value: any) => {
    const subQ = formData.subQuestions[subIndex];
    const columns = [...(subQ.inputConfig?.columns || [])];
    columns[colIndex] = { ...columns[colIndex], [field]: value };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      columns
    });
  };

  const removeTableColumn = (subIndex: number, colIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const columns = (subQ.inputConfig?.columns || []).filter((_, i) => i !== colIndex);
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      columns
    });
  };

  const updateInputRows = (subIndex: number, numRows: number) => {
    const subQ = formData.subQuestions[subIndex];
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      inputRows: Math.max(1, numRows)
    });
  };

  // Flexible grid table functions
  const initGridTableConfig = (subIndex: number, numCols: number = 3, numRows: number = 3) => {
    const headers = Array.from({ length: numCols }, (_, i) => `Column ${i + 1}`);
    const rows = Array.from({ length: numRows }, (_, rowIdx) => ({
      cells: Array.from({ length: numCols }, (_, colIdx) => ({
        value: "",
        isInput: false,
        key: `cell_${rowIdx}_${colIdx}`
      }))
    }));
    updateSubQuestion(subIndex, "inputConfig", { grid: { headers, rows } });
  };

  const updateGridHeader = (subIndex: number, colIndex: number, value: string) => {
    const subQ = formData.subQuestions[subIndex];
    const grid = subQ.inputConfig?.grid;
    if (!grid) return;
    const newHeaders = [...grid.headers];
    newHeaders[colIndex] = value;
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      grid: { ...grid, headers: newHeaders }
    });
  };

  const updateGridCell = (subIndex: number, rowIndex: number, cellIndex: number, field: string, value: any) => {
    const subQ = formData.subQuestions[subIndex];
    const grid = subQ.inputConfig?.grid;
    if (!grid) return;
    const newRows = grid.rows.map((row, rIdx) => {
      if (rIdx !== rowIndex) return row;
      return {
        cells: row.cells.map((cell, cIdx) => {
          if (cIdx !== cellIndex) return cell;
          return { ...cell, [field]: value };
        })
      };
    });
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      grid: { ...grid, rows: newRows }
    });
  };

  const addGridColumn = (subIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const grid = subQ.inputConfig?.grid;
    if (!grid) return;
    const newColIndex = grid.headers.length;
    const newHeaders = [...grid.headers, `Column ${newColIndex + 1}`];
    const newRows = grid.rows.map((row, rowIdx) => ({
      cells: [...row.cells, { value: "", isInput: false, key: `cell_${rowIdx}_${newColIndex}` }]
    }));
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      grid: { headers: newHeaders, rows: newRows }
    });
  };

  const removeGridColumn = (subIndex: number, colIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const grid = subQ.inputConfig?.grid;
    if (!grid || grid.headers.length <= 1) return;
    const newHeaders = grid.headers.filter((_, i) => i !== colIndex);
    const newRows = grid.rows.map(row => ({
      cells: row.cells.filter((_, i) => i !== colIndex)
    }));
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      grid: { headers: newHeaders, rows: newRows }
    });
  };

  const addGridRow = (subIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const grid = subQ.inputConfig?.grid;
    if (!grid) return;
    const newRowIndex = grid.rows.length;
    const newRow = {
      cells: grid.headers.map((_, colIdx) => ({
        value: "",
        isInput: false,
        key: `cell_${newRowIndex}_${colIdx}`
      }))
    };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      grid: { ...grid, rows: [...grid.rows, newRow] }
    });
  };

  const removeGridRow = (subIndex: number, rowIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const grid = subQ.inputConfig?.grid;
    if (!grid || grid.rows.length <= 1) return;
    const newRows = grid.rows.filter((_, i) => i !== rowIndex);
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      grid: { ...grid, rows: newRows }
    });
  };

  const initLabeledInputsConfig = (subIndex: number) => {
    updateSubQuestion(subIndex, "inputConfig", {
      fields: [{ label: "Field 1", key: "field1" }]
    });
  };

  const addLabeledField = (subIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const fields = subQ.inputConfig?.fields || [];
    const newField = { label: `Field ${fields.length + 1}`, key: `field${fields.length + 1}` };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      fields: [...fields, newField]
    });
  };

  const updateLabeledField = (subIndex: number, fieldIndex: number, prop: string, value: string) => {
    const subQ = formData.subQuestions[subIndex];
    const fields = [...(subQ.inputConfig?.fields || [])];
    fields[fieldIndex] = { ...fields[fieldIndex], [prop]: value };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      fields
    });
  };

  const removeLabeledField = (subIndex: number, fieldIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const fields = (subQ.inputConfig?.fields || []).filter((_, i) => i !== fieldIndex);
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      fields
    });
  };

  const initErdConfig = (subIndex: number) => {
    updateSubQuestion(subIndex, "inputConfig", {
      erdAttributes: [{ id: "attr1", entityName: "Entity1", attributeName: "attribute1", correctMarking: "none" as const }]
    });
  };

  const addErdAttribute = (subIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const attrs = subQ.inputConfig?.erdAttributes || [];
    const newAttr = { 
      id: `attr${attrs.length + 1}`, 
      entityName: "", 
      attributeName: "", 
      correctMarking: "none" as const 
    };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      erdAttributes: [...attrs, newAttr]
    });
  };

  const updateErdAttribute = (subIndex: number, attrIndex: number, prop: string, value: string) => {
    const subQ = formData.subQuestions[subIndex];
    const attrs = [...(subQ.inputConfig?.erdAttributes || [])];
    attrs[attrIndex] = { ...attrs[attrIndex], [prop]: value };
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      erdAttributes: attrs
    });
  };

  const removeErdAttribute = (subIndex: number, attrIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const attrs = (subQ.inputConfig?.erdAttributes || []).filter((_, i) => i !== attrIndex);
    updateSubQuestion(subIndex, "inputConfig", {
      ...subQ.inputConfig,
      erdAttributes: attrs
    });
  };

  const initSubPartErdConfig = (subIndex: number, partIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...(subQ.subParts || [])];
    parts[partIndex] = {
      ...parts[partIndex],
      inputConfig: {
        erdAttributes: [{ id: "attr1", entityName: "Entity1", attributeName: "attribute1", correctMarking: "none" as const }]
      }
    };
    updateSubQuestion(subIndex, "subParts", parts);
  };

  const addSubPartErdAttribute = (subIndex: number, partIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...(subQ.subParts || [])];
    const attrs = parts[partIndex].inputConfig?.erdAttributes || [];
    const newAttr = { 
      id: `attr${attrs.length + 1}`, 
      entityName: "", 
      attributeName: "", 
      correctMarking: "none" as const 
    };
    parts[partIndex] = {
      ...parts[partIndex],
      inputConfig: {
        ...parts[partIndex].inputConfig,
        erdAttributes: [...attrs, newAttr]
      }
    };
    updateSubQuestion(subIndex, "subParts", parts);
  };

  const updateSubPartErdAttribute = (subIndex: number, partIndex: number, attrIndex: number, prop: string, value: string) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...(subQ.subParts || [])];
    const attrs = [...(parts[partIndex].inputConfig?.erdAttributes || [])];
    attrs[attrIndex] = { ...attrs[attrIndex], [prop]: value };
    parts[partIndex] = {
      ...parts[partIndex],
      inputConfig: {
        ...parts[partIndex].inputConfig,
        erdAttributes: attrs
      }
    };
    updateSubQuestion(subIndex, "subParts", parts);
  };

  const removeSubPartErdAttribute = (subIndex: number, partIndex: number, attrIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...(subQ.subParts || [])];
    const attrs = (parts[partIndex].inputConfig?.erdAttributes || []).filter((_, i) => i !== attrIndex);
    parts[partIndex] = {
      ...parts[partIndex],
      inputConfig: {
        ...parts[partIndex].inputConfig,
        erdAttributes: attrs
      }
    };
    updateSubQuestion(subIndex, "subParts", parts);
  };

  // Content Block helper functions for SubQuestions
  const addContentBlock = (subIndex: number, type: ContentBlockType, insertAtIndex?: number) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      content: type === "code" ? "// Enter code here..." : "",
      caption: undefined,
      ...(type === "code-table" && {
        codeSections: [{ id: `section-${Date.now()}`, label: "Code Section", code: "// Enter code here..." }]
      }),
      ...(type === "data-table" && {
        dataTable: {
          tableName: "TABLE_NAME",
          columns: [
            { id: `col-${Date.now()}-1`, header: "Column1" },
            { id: `col-${Date.now()}-2`, header: "Column2" }
          ],
          rows: [
            { id: `row-${Date.now()}-1`, cells: ["", ""] }
          ]
        }
      }),
      ...(type === "database-schema" && {
        databaseSchema: {
          tables: []
        }
      }),
      ...(type === "pseudocode" && {
        pseudocodeLines: [
          { id: `line-${Date.now()}-1`, lineNumber: 1, content: "", indent: 0 }
        ]
      })
    };
    if (insertAtIndex !== undefined) {
      blocks.splice(insertAtIndex, 0, newBlock);
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    } else {
      updateSubQuestion(subIndex, "contentBlocks", [...blocks, newBlock]);
    }
  };

  // Database schema helper functions for content blocks
  const updateContentBlockDatabaseSchema = (subIndex: number, blockIndex: number, schema: DatabaseSchema) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "database-schema") {
      blocks[blockIndex] = { ...block, databaseSchema: schema };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };

  // Pseudocode helper functions for sub-question content blocks
  const updateContentBlockPseudocodeLine = (subIndex: number, blockIndex: number, lineIndex: number, field: keyof PseudocodeLine, value: string | number) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "pseudocode") {
      const lines = [...(block.pseudocodeLines || [])];
      lines[lineIndex] = { ...lines[lineIndex], [field]: value };
      blocks[blockIndex] = { ...block, pseudocodeLines: lines };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };

  const addContentBlockPseudocodeLine = (subIndex: number, blockIndex: number, insertAtIndex?: number) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "pseudocode") {
      const lines = [...(block.pseudocodeLines || [])];
      const newLine: PseudocodeLine = {
        id: `line-${Date.now()}`,
        lineNumber: lines.length + 1,
        content: "",
        indent: 0
      };
      if (insertAtIndex !== undefined) {
        lines.splice(insertAtIndex + 1, 0, newLine);
      } else {
        lines.push(newLine);
      }
      lines.forEach((line, i) => { line.lineNumber = i + 1; });
      blocks[blockIndex] = { ...block, pseudocodeLines: lines };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };

  const removeContentBlockPseudocodeLine = (subIndex: number, blockIndex: number, lineIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "pseudocode") {
      const lines = (block.pseudocodeLines || []).filter((_, i) => i !== lineIndex);
      lines.forEach((line, i) => { line.lineNumber = i + 1; });
      blocks[blockIndex] = { ...block, pseudocodeLines: lines };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };
  
  // Code section helper functions for sub-question code-table blocks
  const addSubQuestionCodeSection = (subIndex: number, blockIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "code-table") {
      const sections = block.codeSections || [];
      blocks[blockIndex] = {
        ...block,
        codeSections: [...sections, { id: `section-${Date.now()}`, label: "Code Section", code: "// Enter code here..." }]
      };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };
  
  const updateSubQuestionCodeSection = (subIndex: number, blockIndex: number, sectionIndex: number, field: "label" | "code", value: string) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "code-table" && block.codeSections) {
      const sections = [...block.codeSections];
      sections[sectionIndex] = { ...sections[sectionIndex], [field]: value };
      blocks[blockIndex] = { ...block, codeSections: sections };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };
  
  const removeSubQuestionCodeSection = (subIndex: number, blockIndex: number, sectionIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "code-table" && block.codeSections && block.codeSections.length > 1) {
      const sections = block.codeSections.filter((_, i) => i !== sectionIndex);
      blocks[blockIndex] = { ...block, codeSections: sections };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };

  // Data table helper functions for sub-question data-table blocks
  const updateSubQuestionDataTable = (subIndex: number, blockIndex: number, field: "tableName", value: string) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable) {
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, [field]: value } };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };

  const addSubQuestionDataTableColumn = (subIndex: number, blockIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable) {
      const newCol = { id: `col-${Date.now()}`, header: `Column${block.dataTable.columns.length + 1}` };
      const updatedRows = block.dataTable.rows.map(row => ({ ...row, cells: [...row.cells, ""] }));
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, columns: [...block.dataTable.columns, newCol], rows: updatedRows } };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };

  const removeSubQuestionDataTableColumn = (subIndex: number, blockIndex: number, colIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable && block.dataTable.columns.length > 1) {
      const updatedCols = block.dataTable.columns.filter((_, i) => i !== colIndex);
      const updatedRows = block.dataTable.rows.map(row => ({ ...row, cells: row.cells.filter((_, i) => i !== colIndex) }));
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, columns: updatedCols, rows: updatedRows } };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };

  const updateSubQuestionDataTableColumnHeader = (subIndex: number, blockIndex: number, colIndex: number, value: string) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable) {
      const updatedCols = [...block.dataTable.columns];
      updatedCols[colIndex] = { ...updatedCols[colIndex], header: value };
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, columns: updatedCols } };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };

  const addSubQuestionDataTableRow = (subIndex: number, blockIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable) {
      const newRow = { id: `row-${Date.now()}`, cells: block.dataTable.columns.map(() => "") };
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, rows: [...block.dataTable.rows, newRow] } };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };

  const removeSubQuestionDataTableRow = (subIndex: number, blockIndex: number, rowIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable && block.dataTable.rows.length > 1) {
      const updatedRows = block.dataTable.rows.filter((_, i) => i !== rowIndex);
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, rows: updatedRows } };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };

  const updateSubQuestionDataTableCell = (subIndex: number, blockIndex: number, rowIndex: number, cellIndex: number, value: string) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable) {
      const updatedRows = [...block.dataTable.rows];
      const updatedCells = [...updatedRows[rowIndex].cells];
      updatedCells[cellIndex] = updateCellValue(updatedCells[cellIndex], value);
      updatedRows[rowIndex] = { ...updatedRows[rowIndex], cells: updatedCells };
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, rows: updatedRows } };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };

  const updateSubQuestionDataTableCellRole = (subIndex: number, blockIndex: number, rowIndex: number, cellIndex: number, role: DataTableCellRole) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable) {
      const updatedRows = [...block.dataTable.rows];
      const updatedCells = [...updatedRows[rowIndex].cells];
      updatedCells[cellIndex] = updateCellRole(updatedCells[cellIndex], role);
      updatedRows[rowIndex] = { ...updatedRows[rowIndex], cells: updatedCells };
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, rows: updatedRows } };
      updateSubQuestion(subIndex, "contentBlocks", blocks);
    }
  };

  // Data table helper functions for scenario blocks
  const updateScenarioDataTable = (blockIndex: number, field: "tableName", value: string) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable) {
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, [field]: value } };
      setFormData(prev => ({ ...prev, scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks } }));
    }
  };

  const addScenarioDataTableColumn = (blockIndex: number) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable) {
      const newCol = { id: `col-${Date.now()}`, header: `Column${block.dataTable.columns.length + 1}` };
      const updatedRows = block.dataTable.rows.map(row => ({ ...row, cells: [...row.cells, ""] }));
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, columns: [...block.dataTable.columns, newCol], rows: updatedRows } };
      setFormData(prev => ({ ...prev, scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks } }));
    }
  };

  const removeScenarioDataTableColumn = (blockIndex: number, colIndex: number) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable && block.dataTable.columns.length > 1) {
      const updatedCols = block.dataTable.columns.filter((_, i) => i !== colIndex);
      const updatedRows = block.dataTable.rows.map(row => ({ ...row, cells: row.cells.filter((_, i) => i !== colIndex) }));
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, columns: updatedCols, rows: updatedRows } };
      setFormData(prev => ({ ...prev, scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks } }));
    }
  };

  const updateScenarioDataTableColumnHeader = (blockIndex: number, colIndex: number, value: string) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable) {
      const updatedCols = [...block.dataTable.columns];
      updatedCols[colIndex] = { ...updatedCols[colIndex], header: value };
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, columns: updatedCols } };
      setFormData(prev => ({ ...prev, scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks } }));
    }
  };

  const addScenarioDataTableRow = (blockIndex: number) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable) {
      const newRow = { id: `row-${Date.now()}`, cells: block.dataTable.columns.map(() => "") };
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, rows: [...block.dataTable.rows, newRow] } };
      setFormData(prev => ({ ...prev, scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks } }));
    }
  };

  const removeScenarioDataTableRow = (blockIndex: number, rowIndex: number) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable && block.dataTable.rows.length > 1) {
      const updatedRows = block.dataTable.rows.filter((_, i) => i !== rowIndex);
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, rows: updatedRows } };
      setFormData(prev => ({ ...prev, scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks } }));
    }
  };

  const updateScenarioDataTableCell = (blockIndex: number, rowIndex: number, cellIndex: number, value: string) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable) {
      const updatedRows = [...block.dataTable.rows];
      const updatedCells = [...updatedRows[rowIndex].cells];
      updatedCells[cellIndex] = updateCellValue(updatedCells[cellIndex], value);
      updatedRows[rowIndex] = { ...updatedRows[rowIndex], cells: updatedCells };
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, rows: updatedRows } };
      setFormData(prev => ({ ...prev, scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks } }));
    }
  };

  const updateScenarioDataTableCellRole = (blockIndex: number, rowIndex: number, cellIndex: number, role: DataTableCellRole) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "data-table" && block.dataTable) {
      const updatedRows = [...block.dataTable.rows];
      const updatedCells = [...updatedRows[rowIndex].cells];
      updatedCells[cellIndex] = updateCellRole(updatedCells[cellIndex], role);
      updatedRows[rowIndex] = { ...updatedRows[rowIndex], cells: updatedCells };
      blocks[blockIndex] = { ...block, dataTable: { ...block.dataTable, rows: updatedRows } };
      setFormData(prev => ({ ...prev, scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks } }));
    }
  };

  const updateContentBlock = (subIndex: number, blockIndex: number, field: keyof ContentBlock, value: string | boolean | number) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    blocks[blockIndex] = { ...blocks[blockIndex], [field]: value };
    updateSubQuestion(subIndex, "contentBlocks", blocks);
  };

  const removeContentBlock = (subIndex: number, blockIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = (subQ.contentBlocks || []).filter((_, i) => i !== blockIndex);
    updateSubQuestion(subIndex, "contentBlocks", blocks.length > 0 ? blocks : undefined);
  };

  const moveContentBlock = (subIndex: number, blockIndex: number, direction: "up" | "down") => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const newIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    [blocks[blockIndex], blocks[newIndex]] = [blocks[newIndex], blocks[blockIndex]];
    updateSubQuestion(subIndex, "contentBlocks", blocks);
  };

  const groupSubQuestionContentBlocks = (subIndex: number, startBlockIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    if (startBlockIndex < 0 || startBlockIndex >= blocks.length - 1) return;
    const block1 = blocks[startBlockIndex];
    const block2 = blocks[startBlockIndex + 1];
    if (block1.type === "row-layout" || block2.type === "row-layout") return;
    const rowLayout: ContentBlock = {
      id: `row-layout-${Date.now()}`,
      type: "row-layout",
      content: "",
      children: [block1, block2]
    };
    const newBlocks = [
      ...blocks.slice(0, startBlockIndex),
      rowLayout,
      ...blocks.slice(startBlockIndex + 2)
    ];
    updateSubQuestion(subIndex, "contentBlocks", newBlocks);
    toast({ title: "Blocks Grouped", description: "Blocks will now display side-by-side." });
  };

  const ungroupSubQuestionContentBlocks = (subIndex: number, blockIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const blocks = [...(subQ.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block.type !== "row-layout" || !block.children) return;
    const newBlocks = [
      ...blocks.slice(0, blockIndex),
      ...block.children,
      ...blocks.slice(blockIndex + 1)
    ];
    updateSubQuestion(subIndex, "contentBlocks", newBlocks);
    toast({ title: "Blocks Ungrouped", description: "Blocks are now displayed separately." });
  };

  const handleContentBlockImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, subIndex: number, blockIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      updateContentBlock(subIndex, blockIndex, "content", base64String);
      toast({ title: "Image Added", description: "Image added successfully." });
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      toast({ variant: "destructive", title: "Upload Failed", description: "Failed to read image file." });
    };
    reader.readAsDataURL(file);
  };

  // Content Block helper functions for Sub-Parts
  const addSubPartContentBlock = (subIndex: number, partIndex: number, type: ContentBlockType) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...(subQ.subParts || [])];
    const part = parts[partIndex];
    const blocks = part.contentBlocks || [];
    const newBlock: ContentBlock = {
      id: `part-block-${Date.now()}`,
      type,
      content: type === "code" ? "// Enter code here..." : "",
      caption: undefined,
      ...(type === "code-table" && {
        codeSections: [{ id: `section-${Date.now()}`, label: "Code Section", code: "// Enter code here..." }]
      }),
      ...(type === "data-table" && {
        dataTable: {
          tableName: "TABLE_NAME",
          columns: [
            { id: `col-${Date.now()}-1`, header: "Column1" },
            { id: `col-${Date.now()}-2`, header: "Column2" }
          ],
          rows: [
            { id: `row-${Date.now()}-1`, cells: ["", ""] }
          ]
        }
      }),
      ...(type === "database-schema" && {
        databaseSchema: {
          tables: []
        }
      })
    };
    parts[partIndex] = { ...part, contentBlocks: [...blocks, newBlock] };
    updateSubQuestion(subIndex, "subParts", parts);
  };

  const updateSubPartContentBlock = (subIndex: number, partIndex: number, blockIndex: number, field: keyof ContentBlock, value: string) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...(subQ.subParts || [])];
    const part = parts[partIndex];
    const blocks = [...(part.contentBlocks || [])];
    blocks[blockIndex] = { ...blocks[blockIndex], [field]: value };
    parts[partIndex] = { ...part, contentBlocks: blocks };
    updateSubQuestion(subIndex, "subParts", parts);
  };

  const removeSubPartContentBlock = (subIndex: number, partIndex: number, blockIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...(subQ.subParts || [])];
    const part = parts[partIndex];
    const blocks = (part.contentBlocks || []).filter((_, i) => i !== blockIndex);
    parts[partIndex] = { ...part, contentBlocks: blocks.length > 0 ? blocks : undefined };
    updateSubQuestion(subIndex, "subParts", parts);
  };

  const moveSubPartContentBlock = (subIndex: number, partIndex: number, blockIndex: number, direction: "up" | "down") => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...(subQ.subParts || [])];
    const part = parts[partIndex];
    const blocks = [...(part.contentBlocks || [])];
    const newIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    [blocks[blockIndex], blocks[newIndex]] = [blocks[newIndex], blocks[blockIndex]];
    parts[partIndex] = { ...part, contentBlocks: blocks };
    updateSubQuestion(subIndex, "subParts", parts);
  };

  const handleSubPartContentBlockImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, subIndex: number, partIndex: number, blockIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      updateSubPartContentBlock(subIndex, partIndex, blockIndex, "content", base64String);
      toast({ title: "Image Added", description: "Image added successfully." });
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      toast({ variant: "destructive", title: "Upload Failed", description: "Failed to read image file." });
    };
    reader.readAsDataURL(file);
  };

  // Code section helper functions for sub-part code-table blocks
  const addSubPartCodeSection = (subIndex: number, partIndex: number, blockIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...(subQ.subParts || [])];
    const part = parts[partIndex];
    const blocks = [...(part.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "code-table") {
      const sections = block.codeSections || [];
      blocks[blockIndex] = {
        ...block,
        codeSections: [...sections, { id: `section-${Date.now()}`, label: "Code Section", code: "// Enter code here..." }]
      };
      parts[partIndex] = { ...part, contentBlocks: blocks };
      updateSubQuestion(subIndex, "subParts", parts);
    }
  };

  const updateSubPartCodeSection = (subIndex: number, partIndex: number, blockIndex: number, sectionIndex: number, field: "label" | "code", value: string) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...(subQ.subParts || [])];
    const part = parts[partIndex];
    const blocks = [...(part.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "code-table" && block.codeSections) {
      const sections = [...block.codeSections];
      sections[sectionIndex] = { ...sections[sectionIndex], [field]: value };
      blocks[blockIndex] = { ...block, codeSections: sections };
      parts[partIndex] = { ...part, contentBlocks: blocks };
      updateSubQuestion(subIndex, "subParts", parts);
    }
  };

  const updateSubPartContentBlockDatabaseSchema = (subIndex: number, partIndex: number, blockIndex: number, schema: DatabaseSchema) => {
    const subQ = formData.subQuestions[subIndex];
    if (!subQ) return;
    const parts = [...(subQ.subParts || [])];
    const part = parts[partIndex];
    if (!part) return;
    const blocks = [...(part.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (!block || block.type !== "database-schema") return;
    blocks[blockIndex] = { ...block, databaseSchema: schema };
    parts[partIndex] = { ...part, contentBlocks: blocks };
    updateSubQuestion(subIndex, "subParts", parts);
  };

  const removeSubPartCodeSection = (subIndex: number, partIndex: number, blockIndex: number, sectionIndex: number) => {
    const subQ = formData.subQuestions[subIndex];
    const parts = [...(subQ.subParts || [])];
    const part = parts[partIndex];
    const blocks = [...(part.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "code-table" && block.codeSections && block.codeSections.length > 1) {
      const sections = block.codeSections.filter((_, i) => i !== sectionIndex);
      blocks[blockIndex] = { ...block, codeSections: sections };
      parts[partIndex] = { ...part, contentBlocks: blocks };
      updateSubQuestion(subIndex, "subParts", parts);
    }
  };

  const handleDrawingBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>, subIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      updateSubQuestion(subIndex, "drawingBackgroundUrl", base64String);
      toast({ title: "Image Uploaded", description: "Drawing background image uploaded successfully." });
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      toast({ variant: "destructive", title: "Upload Failed", description: "Failed to upload image." });
    };
    reader.readAsDataURL(file);
  };

  // Scenario Content Block helper functions
  const addScenarioContentBlock = (type: ContentBlockType, insertAtIndex?: number) => {
    const blocks = formData.scenario?.contentBlocks || [];
    const newBlock: ContentBlock = {
      id: `scenario-block-${Date.now()}`,
      type,
      content: type === "code" ? "// Enter code here..." : "",
      caption: undefined,
      codeSections: type === "code-table" ? [{ id: `section-${Date.now()}`, label: "Code", code: "// Enter code here..." }] : undefined,
      dataTable: type === "data-table" ? {
        tableName: "TABLE_NAME",
        columns: [
          { id: `col-${Date.now()}-1`, header: "Column1" },
          { id: `col-${Date.now()}-2`, header: "Column2" }
        ],
        rows: [
          { id: `row-${Date.now()}-1`, cells: ["", ""] }
        ]
      } : undefined,
      databaseSchema: type === "database-schema" ? { tables: [] } : undefined,
      pseudocodeLines: type === "pseudocode" ? [
        { id: `line-${Date.now()}-1`, lineNumber: 1, content: "", indent: 0 }
      ] : undefined
    };
    
    let newBlocks: ContentBlock[];
    if (insertAtIndex !== undefined && insertAtIndex >= 0 && insertAtIndex <= blocks.length) {
      newBlocks = [...blocks.slice(0, insertAtIndex), newBlock, ...blocks.slice(insertAtIndex)];
    } else {
      newBlocks = [...blocks, newBlock];
    }
    
    setFormData(prev => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: newBlocks }
    }));
  };
  
  // Database schema helper for scenario content blocks
  const updateScenarioDatabaseSchema = (blockIndex: number, schema: DatabaseSchema) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "database-schema") {
      blocks[blockIndex] = { ...block, databaseSchema: schema };
      setFormData(prev => ({
        ...prev,
        scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
      }));
    }
  };

  // Pseudocode helpers for scenario content blocks
  const updateScenarioPseudocodeLine = (blockIndex: number, lineIndex: number, field: keyof PseudocodeLine, value: string | number) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "pseudocode") {
      const lines = [...(block.pseudocodeLines || [])];
      lines[lineIndex] = { ...lines[lineIndex], [field]: value };
      blocks[blockIndex] = { ...block, pseudocodeLines: lines };
      setFormData(prev => ({
        ...prev,
        scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
      }));
    }
  };

  const addScenarioPseudocodeLine = (blockIndex: number, insertAtIndex?: number) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "pseudocode") {
      const lines = [...(block.pseudocodeLines || [])];
      const newLine: PseudocodeLine = {
        id: `line-${Date.now()}`,
        lineNumber: lines.length + 1,
        content: "",
        indent: 0
      };
      if (insertAtIndex !== undefined) {
        lines.splice(insertAtIndex + 1, 0, newLine);
      } else {
        lines.push(newLine);
      }
      // Renumber lines
      lines.forEach((line, i) => { line.lineNumber = i + 1; });
      blocks[blockIndex] = { ...block, pseudocodeLines: lines };
      setFormData(prev => ({
        ...prev,
        scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
      }));
    }
  };

  const removeScenarioPseudocodeLine = (blockIndex: number, lineIndex: number) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block && block.type === "pseudocode") {
      const lines = (block.pseudocodeLines || []).filter((_, i) => i !== lineIndex);
      // Renumber lines
      lines.forEach((line, i) => { line.lineNumber = i + 1; });
      blocks[blockIndex] = { ...block, pseudocodeLines: lines };
      setFormData(prev => ({
        ...prev,
        scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
      }));
    }
  };
  
  // Code section helpers for code-table blocks
  const addScenarioCodeSection = (blockIndex: number) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    const sections = block.codeSections || [];
    blocks[blockIndex] = {
      ...block,
      codeSections: [...sections, { id: `section-${Date.now()}`, label: "Code", code: "// Enter code here..." }]
    };
    setFormData(prev => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
    }));
  };
  
  const updateScenarioCodeSection = (blockIndex: number, sectionIndex: number, field: keyof CodeSection, value: string) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    const sections = [...(block.codeSections || [])];
    sections[sectionIndex] = { ...sections[sectionIndex], [field]: value };
    blocks[blockIndex] = { ...block, codeSections: sections };
    setFormData(prev => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
    }));
  };
  
  const removeScenarioCodeSection = (blockIndex: number, sectionIndex: number) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    const sections = (block.codeSections || []).filter((_, i) => i !== sectionIndex);
    blocks[blockIndex] = { ...block, codeSections: sections };
    setFormData(prev => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
    }));
  };

  const updateScenarioContentBlock = (blockIndex: number, field: keyof ContentBlock, value: string | boolean | number) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    blocks[blockIndex] = { ...blocks[blockIndex], [field]: value };
    setFormData(prev => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
    }));
  };

  const removeScenarioContentBlock = (blockIndex: number) => {
    const blocks = (formData.scenario?.contentBlocks || []).filter((_, i) => i !== blockIndex);
    setFormData(prev => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks.length > 0 ? blocks : undefined }
    }));
  };

  const moveScenarioContentBlock = (blockIndex: number, direction: "up" | "down") => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const newIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    [blocks[blockIndex], blocks[newIndex]] = [blocks[newIndex], blocks[blockIndex]];
    setFormData(prev => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: blocks }
    }));
  };

  const groupScenarioContentBlocks = (startIndex: number) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    if (startIndex < 0 || startIndex >= blocks.length - 1) return;
    const block1 = blocks[startIndex];
    const block2 = blocks[startIndex + 1];
    if (block1.type === "row-layout" || block2.type === "row-layout") return;
    const rowLayout: ContentBlock = {
      id: `row-layout-${Date.now()}`,
      type: "row-layout",
      content: "",
      children: [block1, block2]
    };
    const newBlocks = [
      ...blocks.slice(0, startIndex),
      rowLayout,
      ...blocks.slice(startIndex + 2)
    ];
    setFormData(prev => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: newBlocks }
    }));
    toast({ title: "Blocks Grouped", description: "Blocks will now display side-by-side." });
  };

  const ungroupScenarioContentBlocks = (blockIndex: number) => {
    const blocks = [...(formData.scenario?.contentBlocks || [])];
    const block = blocks[blockIndex];
    if (block.type !== "row-layout" || !block.children) return;
    const newBlocks = [
      ...blocks.slice(0, blockIndex),
      ...block.children,
      ...blocks.slice(blockIndex + 1)
    ];
    setFormData(prev => ({
      ...prev,
      scenario: { ...prev.scenario, text: prev.scenario?.text || "", contentBlocks: newBlocks }
    }));
    toast({ title: "Blocks Ungrouped", description: "Blocks are now displayed separately." });
  };

  const handleScenarioContentBlockImageUpload = (e: React.ChangeEvent<HTMLInputElement>, blockIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateScenarioContentBlock(blockIndex, "content", base64String);
      toast({
        title: "Image Uploaded",
        description: "Image converted to base64 and attached.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "scenario" | "subQuestion", index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        
        if (target === "scenario") {
            setFormData(prev => ({
                ...prev,
                scenario: {
                    ...prev.scenario!,
                    imageUrl: base64String
                }
            }));
        } else if (target === "subQuestion" && index !== undefined) {
            updateSubQuestion(index, "imageUrl", base64String);
        }
        
        toast({
            title: "Image Uploaded",
            description: "Image converted to base64 and attached.",
        });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
       <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-[200]">
        <div className="container mx-auto max-w-4xl flex justify-between items-center">
          <div className="flex items-center gap-4">
             <Button variant="ghost" onClick={() => setLocation("/teacher/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
             </Button>
             <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
                {isNew ? "Add New Question" : "Edit Question"}
             </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowPreview(true)} data-testid="button-preview">
              <Eye className="mr-2 h-4 w-4" /> Preview
            </Button>
            <Button variant="outline" onClick={() => handleSave(false)} data-testid="button-save">
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button onClick={() => handleSave(true)} className="bg-red-600 hover:bg-red-700" data-testid="button-save-exit">
              Save & Exit
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl p-6 space-y-6">
        {/* General Settings */}
        <Card>
            <CardHeader>
                <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="isPractice"
                        checked={formData.isPractice || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPractice: e.target.checked, isAdditionalExam: false }))}
                        className="w-4 h-4 text-red-600 border-neutral-300 rounded focus:ring-red-500"
                    />
                    <Label htmlFor="isPractice" className="cursor-pointer">
                        This is a practice question (not from a past paper)
                    </Label>
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="isAdditionalExam"
                        checked={formData.isAdditionalExam || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, isAdditionalExam: e.target.checked, isPractice: false, year: e.target.checked ? 0 : (prev.year || new Date().getFullYear()) }))}
                        className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="isAdditionalExam" className="cursor-pointer">
                        This is an additional exam (teacher-created, not a past paper)
                    </Label>
                </div>

                {formData.isAdditionalExam && additionalExamsList.length > 0 && (
                  <div className="space-y-2 pl-6 border-l-2 border-blue-200 dark:border-blue-800">
                    <Label>Assign to Exam Paper</Label>
                    <Select
                      value={(formData as any).additionalExamId || ""}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, additionalExamId: val || null }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an exam paper..." />
                      </SelectTrigger>
                      <SelectContent>
                        {additionalExamsList.map(exam => (
                          <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-neutral-500">Questions must be assigned to an exam paper to appear in it.</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Year {(formData.isPractice || formData.isAdditionalExam) && "(Not applicable)"}</Label>
                    <Input 
                        type="number" 
                        value={formData.isAdditionalExam ? "" : formData.year} 
                        onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                        disabled={formData.isPractice || formData.isAdditionalExam}
                        className={(formData.isPractice || formData.isAdditionalExam) ? "bg-neutral-100 dark:bg-neutral-800" : ""}
                        placeholder={formData.isAdditionalExam ? "N/A" : ""}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Topic</Label>
                    <Select 
                        value={formData.topic} 
                        onValueChange={(val: any) => setFormData(prev => ({ ...prev, topic: val }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Topic" />
                        </SelectTrigger>
                        <SelectContent>
                            {TOPICS.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label>Question Title (e.g. Question 1 or Practice: Arrays)</Label>
                    <Input 
                        value={formData.title} 
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                </div>
                </div>
            </CardContent>
        </Card>

        {/* Scenario */}
        <Card>
            <CardHeader>
                <CardTitle>Scenario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Content Blocks */}
                <div className="space-y-3">
                    {formData.scenario?.contentBlocks && formData.scenario.contentBlocks.length > 0 ? (
                        formData.scenario.contentBlocks.map((block, blockIndex) => (
                          <div key={block.id}>
                            {/* Insert dropdown before each block */}
                            <div className="flex justify-center py-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-5 px-2 text-xs text-neutral-400 hover:text-neutral-600">
                                    <Plus className="h-3 w-3 mr-1" /> Insert here
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => addScenarioContentBlock("text", blockIndex)}>
                                    <Type className="h-4 w-4 mr-2" /> Text
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => addScenarioContentBlock("image", blockIndex)}>
                                    <Image className="h-4 w-4 mr-2" /> Image
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => addScenarioContentBlock("code", blockIndex)}>
                                    <Code className="h-4 w-4 mr-2" /> Code
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => addScenarioContentBlock("code-table", blockIndex)}>
                                    <Table className="h-4 w-4 mr-2" /> Code Table
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => addScenarioContentBlock("data-table", blockIndex)}>
                                    <Table className="h-4 w-4 mr-2" /> Data Table
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => addScenarioContentBlock("database-schema", blockIndex)}>
                                    <Database className="h-4 w-4 mr-2" /> DB Schema
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => addScenarioContentBlock("pseudocode", blockIndex)}>
                                    <Code className="h-4 w-4 mr-2" /> Pseudocode
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        {block.type === "text" && <Type className="h-4 w-4 text-neutral-500" />}
                                        {block.type === "image" && <Image className="h-4 w-4 text-neutral-500" />}
                                        {block.type === "code" && <Code className="h-4 w-4 text-neutral-500" />}
                                        {(block.type === "code-table" || block.type === "data-table") && <Table className="h-4 w-4 text-neutral-500" />}
                                        {block.type === "database-schema" && <Database className="h-4 w-4 text-neutral-500" />}
                                        {block.type === "pseudocode" && <Code className="h-4 w-4 text-neutral-500" />}
                                        {block.type === "row-layout" && <Layers className="h-4 w-4 text-blue-500" />}
                                        <span className="text-sm font-medium capitalize">{block.type === "code-table" ? "Code Table" : block.type === "data-table" ? "Data Table" : block.type === "database-schema" ? "DB Schema" : block.type === "pseudocode" ? "Pseudocode" : block.type === "row-layout" ? "Side-by-Side Layout" : block.type}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => moveScenarioContentBlock(blockIndex, "up")}
                                            disabled={blockIndex === 0}
                                            type="button"
                                        >
                                            <MoveUp className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => moveScenarioContentBlock(blockIndex, "down")}
                                            disabled={blockIndex === (formData.scenario?.contentBlocks?.length || 0) - 1}
                                            type="button"
                                        >
                                            <MoveDown className="h-3 w-3" />
                                        </Button>
                                        {block.type !== "row-layout" && blockIndex < (formData.scenario?.contentBlocks?.length || 0) - 1 && formData.scenario?.contentBlocks?.[blockIndex + 1]?.type !== "row-layout" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-blue-500 hover:text-blue-600"
                                                onClick={() => groupScenarioContentBlocks(blockIndex)}
                                                type="button"
                                                title="Group with next block (side-by-side)"
                                            >
                                                <Layers className="h-3 w-3" />
                                            </Button>
                                        )}
                                        {block.type === "row-layout" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-orange-500 hover:text-orange-600"
                                                onClick={() => ungroupScenarioContentBlocks(blockIndex)}
                                                type="button"
                                                title="Ungroup blocks"
                                            >
                                                <Ungroup className="h-3 w-3" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                                            onClick={() => removeScenarioContentBlock(blockIndex)}
                                            type="button"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                {block.type === "text" && (
                                    <div className="space-y-2">
                                        <div className="flex gap-1 mb-1 flex-wrap items-center">
                                            <Button
                                                variant={block.textAlign === "left" || !block.textAlign ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => updateScenarioContentBlock(blockIndex, "textAlign", "left")}
                                                type="button"
                                                title="Align Left"
                                            >
                                                <AlignLeft className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant={block.textAlign === "center" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => updateScenarioContentBlock(blockIndex, "textAlign", "center")}
                                                type="button"
                                                title="Align Center"
                                            >
                                                <AlignCenter className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant={block.textAlign === "right" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => updateScenarioContentBlock(blockIndex, "textAlign", "right")}
                                                type="button"
                                                title="Align Right"
                                            >
                                                <AlignRight className="h-3 w-3" />
                                            </Button>
                                            <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />
                                            <div className="flex items-center gap-1.5">
                                                <Checkbox
                                                    id={`scenario-border-${block.id}`}
                                                    checked={block.hasBorder || false}
                                                    onCheckedChange={(checked) => updateScenarioContentBlock(blockIndex, "hasBorder", checked === true)}
                                                />
                                                <Label htmlFor={`scenario-border-${block.id}`} className="text-xs cursor-pointer">Border</Label>
                                            </div>
                                            {block.hasBorder && (
                                                <Select
                                                    value={String(block.borderWidth || 1)}
                                                    onValueChange={(val) => updateScenarioContentBlock(blockIndex, "borderWidth", parseInt(val))}
                                                >
                                                    <SelectTrigger className="w-16 h-7 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">1px</SelectItem>
                                                        <SelectItem value="2">2px</SelectItem>
                                                        <SelectItem value="3">3px</SelectItem>
                                                        <SelectItem value="4">4px</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                        <RichTextEditor
                                            value={block.content}
                                            onChange={(val) => updateScenarioContentBlock(blockIndex, "content", val)}
                                            placeholder="Enter text content..."
                                            rows={3}
                                        />
                                    </div>
                                )}

                                {block.type === "image" && (
                                    <div className="space-y-2">
                                        {block.content && (
                                            <div className="border rounded-md p-2 w-fit bg-white dark:bg-neutral-800">
                                                <img src={block.content} alt="Preview" className="max-h-32 object-contain" />
                                            </div>
                                        )}
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                placeholder="Paste image URL..."
                                                value={block.content}
                                                onChange={(e) => updateScenarioContentBlock(blockIndex, "content", e.target.value)}
                                                className="flex-1 h-8 text-sm"
                                            />
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => handleScenarioContentBlockImageUpload(e, blockIndex)}
                                                />
                                                <Button variant="outline" size="sm" type="button">
                                                    <Upload className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                placeholder="Caption (optional)"
                                                value={block.caption || ""}
                                                onChange={(e) => updateScenarioContentBlock(blockIndex, "caption", e.target.value)}
                                                className="flex-1 h-8 text-sm"
                                            />
                                            <Select
                                                value={block.imageSize || "medium"}
                                                onValueChange={(val) => updateScenarioContentBlock(blockIndex, "imageSize", val)}
                                            >
                                                <SelectTrigger className="w-28 h-8">
                                                    <SelectValue placeholder="Size" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="xs">Extra Small</SelectItem>
                                                    <SelectItem value="small">Small</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="large">Large</SelectItem>
                                                    <SelectItem value="xl">Extra Large</SelectItem>
                                                    <SelectItem value="2xl">2X Large</SelectItem>
                                                    <SelectItem value="full">Full Width</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {block.type === "code" && (
                                    <Textarea
                                        className="font-mono text-sm bg-neutral-900 text-neutral-100 border-neutral-700"
                                        value={block.content}
                                        onChange={(e) => updateScenarioContentBlock(blockIndex, "content", e.target.value)}
                                        rows={4}
                                    />
                                )}

                                {block.type === "code-table" && (
                                    <div className="space-y-3">
                                        {block.codeSections?.map((section, sectionIndex) => (
                                            <div key={section.id} className="border rounded-lg overflow-hidden">
                                                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-2">
                                                    <Input
                                                        value={section.label}
                                                        onChange={(e) => updateScenarioCodeSection(blockIndex, sectionIndex, "label", e.target.value)}
                                                        className="flex-1 h-7 text-sm font-medium"
                                                        placeholder="Section label (e.g., JavaScript Code)"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                                        onClick={() => removeScenarioCodeSection(blockIndex, sectionIndex)}
                                                        disabled={(block.codeSections?.length || 0) <= 1}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <Textarea
                                                    className="font-mono text-sm bg-neutral-900 text-neutral-100 border-0 rounded-none"
                                                    value={section.code}
                                                    onChange={(e) => updateScenarioCodeSection(blockIndex, sectionIndex, "code", e.target.value)}
                                                    rows={3}
                                                    placeholder="Enter code here..."
                                                />
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addScenarioCodeSection(blockIndex)}
                                            type="button"
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Add Section
                                        </Button>
                                    </div>
                                )}

                                {block.type === "data-table" && block.dataTable && (
                                    <div className="space-y-3">
                                        <ResponsiveDataTable dataTable={block.dataTable} />
                                        <div className="flex justify-center">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setEditingDataTable({ type: "scenario", blockIndex });
                                              setDataTableModalOpen(true);
                                            }}
                                            type="button"
                                          >
                                            <Table className="h-3 w-3 mr-1" /> Edit Table
                                          </Button>
                                        </div>
                                        <p className="text-xs text-center text-neutral-500">
                                          {block.dataTable.columns.length} columns, {block.dataTable.rows.length} rows
                                        </p>
                                    </div>
                                )}

                                {block.type === "database-schema" && (
                                    <div className="space-y-3">
                                        <DatabaseSchemaEditor
                                            value={block.databaseSchema}
                                            onChange={(schema) => updateScenarioDatabaseSchema(blockIndex, schema)}
                                        />
                                        {block.databaseSchema && block.databaseSchema.tables.length > 0 && (
                                            <div className="border-t pt-3">
                                                <p className="text-xs text-neutral-500 mb-2">Preview:</p>
                                                <div className="p-3 bg-white dark:bg-neutral-800 rounded border">
                                                    <DatabaseSchemaDisplay schema={block.databaseSchema} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {block.type === "pseudocode" && (
                                    <div className="space-y-3">
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="w-full font-mono text-sm">
                                                <thead>
                                                    <tr className="bg-neutral-100 dark:bg-neutral-800 border-b">
                                                        <th className="w-12 px-2 py-1 text-center text-xs text-neutral-500">Line</th>
                                                        <th className="w-20 px-2 py-1 text-center text-xs text-neutral-500">Indent</th>
                                                        <th className="px-2 py-1 text-left text-xs text-neutral-500">Code</th>
                                                        <th className="w-16 px-1 py-1"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(block.pseudocodeLines || []).map((line, lineIndex) => (
                                                        <tr key={line.id} className="border-b last:border-b-0">
                                                            <td className="px-2 py-1 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900">{line.lineNumber}</td>
                                                            <td className="px-1 py-1">
                                                                <Select
                                                                    value={String(line.indent)}
                                                                    onValueChange={(v) => updateScenarioPseudocodeLine(blockIndex, lineIndex, "indent", parseInt(v))}
                                                                >
                                                                    <SelectTrigger className="h-7 text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {[0, 1, 2, 3, 4, 5].map(n => (
                                                                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="px-1 py-1">
                                                                <Input
                                                                    value={line.content}
                                                                    onChange={(e) => updateScenarioPseudocodeLine(blockIndex, lineIndex, "content", e.target.value)}
                                                                    className="h-7 font-mono text-sm"
                                                                    placeholder="Enter pseudocode..."
                                                                />
                                                            </td>
                                                            <td className="px-1 py-1">
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 w-6 p-0"
                                                                        onClick={() => addScenarioPseudocodeLine(blockIndex, lineIndex)}
                                                                        title="Add line below"
                                                                    >
                                                                        <Plus className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                                        onClick={() => removeScenarioPseudocodeLine(blockIndex, lineIndex)}
                                                                        disabled={(block.pseudocodeLines || []).length <= 1}
                                                                        title="Remove line"
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
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addScenarioPseudocodeLine(blockIndex)}
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Add Line
                                        </Button>
                                    </div>
                                )}

                                {block.type === "row-layout" && block.children && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-neutral-500">These blocks will display side-by-side on larger screens:</p>
                                        <RowLayout>
                                            {block.children.map((childBlock, childIndex) => (
                                                <RowLayoutItem key={childBlock.id}>
                                                    <div className="p-2 bg-white dark:bg-neutral-800 rounded border text-sm">
                                                        <div className="flex items-center gap-1 mb-1 text-xs text-neutral-500">
                                                            {childBlock.type === "text" && <Type className="h-3 w-3" />}
                                                            {childBlock.type === "image" && <Image className="h-3 w-3" />}
                                                            {childBlock.type === "code" && <Code className="h-3 w-3" />}
                                                            {childBlock.type === "data-table" && <Table className="h-3 w-3" />}
                                                            {childBlock.type === "database-schema" && <Database className="h-3 w-3" />}
                                                            <span className="capitalize">{childBlock.type === "data-table" ? "Data Table" : childBlock.type}</span>
                                                        </div>
                                                        {childBlock.type === "text" && (
                                                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: childBlock.content }} />
                                                        )}
                                                        {childBlock.type === "image" && childBlock.content && (
                                                            <img src={childBlock.content} alt={childBlock.caption || ""} className="max-h-32 object-contain" />
                                                        )}
                                                        {childBlock.type === "code" && (
                                                            <pre className="text-xs bg-neutral-900 text-neutral-100 p-2 rounded overflow-x-auto">{childBlock.content}</pre>
                                                        )}
                                                        {childBlock.type === "data-table" && childBlock.dataTable && (
                                                            <ResponsiveDataTable dataTable={childBlock.dataTable} />
                                                        )}
                                                        {childBlock.type === "database-schema" && childBlock.databaseSchema && (
                                                            <DatabaseSchemaDisplay schema={childBlock.databaseSchema} />
                                                        )}
                                                    </div>
                                                </RowLayoutItem>
                                            ))}
                                        </RowLayout>
                                        <p className="text-xs text-center text-neutral-400">Click the ungroup button above to edit individual blocks</p>
                                    </div>
                                )}
                            </div>
                          </div>
                        ))
                    ) : (
                        /* Legacy fallback for old format questions */
                        (formData.scenario?.text || formData.scenario?.imageUrl || formData.scenario?.codeSnippet) && !formData.scenario?.contentBlocks ? (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                                    This scenario uses the legacy format. Add content blocks below to upgrade.
                                </p>
                                {formData.scenario?.text && (
                                    <div className="mb-2">
                                        <Label className="text-xs text-amber-600">Legacy Text:</Label>
                                        <p className="text-sm">{formData.scenario.text}</p>
                                    </div>
                                )}
                                {formData.scenario?.imageUrl && (
                                    <div className="mb-2">
                                        <Label className="text-xs text-amber-600">Legacy Image:</Label>
                                        <img src={formData.scenario.imageUrl} alt="Legacy" className="max-h-24 mt-1" />
                                    </div>
                                )}
                                {formData.scenario?.codeSnippet && (
                                    <div className="mb-2">
                                        <Label className="text-xs text-amber-600">Legacy Code:</Label>
                                        <pre className="text-xs bg-neutral-800 text-neutral-100 p-2 rounded mt-1 overflow-x-auto">{formData.scenario.codeSnippet}</pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-500 italic">No content blocks yet. Add text, images, or code below.</p>
                        )
                    )}
                </div>

                {/* Add Content Block Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addScenarioContentBlock("text")}
                        type="button"
                    >
                        <Type className="h-3 w-3 mr-1" /> Add Text
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addScenarioContentBlock("image")}
                        type="button"
                    >
                        <Image className="h-3 w-3 mr-1" /> Add Image
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addScenarioContentBlock("code")}
                        type="button"
                    >
                        <Code className="h-3 w-3 mr-1" /> Add Code
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addScenarioContentBlock("code-table")}
                        type="button"
                    >
                        <Table className="h-3 w-3 mr-1" /> Add Code Table
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addScenarioContentBlock("data-table")}
                        type="button"
                    >
                        <Table className="h-3 w-3 mr-1" /> Add Data Table
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addScenarioContentBlock("database-schema")}
                        type="button"
                    >
                        <Database className="h-3 w-3 mr-1" /> Add DB Schema
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Questions</h2>
                <Button variant="outline" size="sm" onClick={addSubQuestion}>
                    <Plus className="mr-2 h-4 w-4" /> Add Question
                </Button>
            </div>

            <Accordion type="multiple" className="space-y-2">
            {formData.subQuestions.map((subQ, index) => (
                <AccordionItem key={subQ.id || index} value={`question-${index}`} className="border rounded-lg bg-white dark:bg-neutral-900">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-3 text-left flex-1">
                            <span className="font-semibold text-lg">{subQ.label || `(${String.fromCharCode(97 + index)})`}</span>
                            <span className="text-neutral-500 truncate max-w-[400px] text-sm">{(() => {
                              const textContent = subQ.contentBlocks?.find(b => b.type === "text")?.content || subQ.questionText || "";
                              return textContent ? textContent.substring(0, 80) + (textContent.length > 80 ? "..." : "") : "(No question text)";
                            })()}</span>
                            <span className="text-xs text-neutral-400 ml-auto mr-4">
                              ({subQ.maxMarks === 0 && subQ.subParts && subQ.subParts.length > 0 
                                ? subQ.subParts.reduce((sum, part) => sum + (part.maxMarks || 0), 0)
                                : subQ.maxMarks} marks)
                            </span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                        <div className="flex justify-end mb-3">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => removeSubQuestion(index)}
                            >
                                <Trash2 className="h-4 w-4 mr-1" /> Remove Question
                            </Button>
                        </div>

                        <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2 col-span-1">
                                <Label>Label (e.g. a)</Label>
                                <Input 
                                    value={subQ.label || ""} 
                                    onChange={(e) => updateSubQuestion(index, "label", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>Marks</Label>
                                <Input 
                                    type="number"
                                    value={subQ.maxMarks} 
                                    onChange={(e) => updateSubQuestion(index, "maxMarks", parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Input Style</Label>
                                <Select 
                                    value={subQ.inputStyle || "text"} 
                                    onValueChange={(val: any) => {
                                        updateSubQuestion(index, "inputStyle", val);
                                        if (val === "info-only") {
                                            updateSubQuestion(index, "maxMarks", 0);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="info-only">Info Only (No Input)</SelectItem>
                                        <SelectItem value="text">Text Area</SelectItem>
                                        <SelectItem value="code-editor">Code Editor</SelectItem>
                                        <SelectItem value="design-choice">Design Choice (Pseudocode/Diagram)</SelectItem>
                                        <SelectItem value="drawing">Diagram/Drawing</SelectItem>
                                        <SelectItem value="table">Table</SelectItem>
                                        <SelectItem value="labeled-inputs">Labeled Inputs</SelectItem>
                                        <SelectItem value="fill-in-blanks">Fill in the Blanks</SelectItem>
                                        <SelectItem value="erd-annotation">ERD Annotation (Keys)</SelectItem>
                                        <SelectItem value="nav-structure">Navigation Diagram (N5)</SelectItem>
                                        <SelectItem value="nav-structure-higher">Navigation Diagram (Higher)</SelectItem>
                                        <SelectItem value="tag-matching">Tag Matching (Connect to Image)</SelectItem>
                                        <SelectItem value="structure-dataflow">Structure Diagram (Dataflow)</SelectItem>
                                        <SelectItem value="form-wireframe">Form Wireframe (Web Form Design)</SelectItem>
                                        <SelectItem value="structure-diagram">Structure Diagram (Design Notation)</SelectItem>
                                        <SelectItem value="entity-occurrence-diagram">Entity-Occurrence Diagram (Database)</SelectItem>
                                        <SelectItem value="database-schema">Database Schema Diagram</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Input Style Configuration - Collapsible */}
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                              <span className="flex items-center gap-2">
                                <Settings className="h-3 w-3" />
                                Input Style Configuration
                              </span>
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-3 space-y-4">
                        {/* Drawing Background URL - for drawing, ERD annotation, and nav-structure questions */}
                        {(subQ.inputStyle === "drawing" || subQ.inputStyle === "erd-annotation" || subQ.inputStyle === "nav-structure" || subQ.inputStyle === "nav-structure-higher" || subQ.inputStyle === "tag-matching" || subQ.inputStyle === "structure-dataflow" || subQ.inputStyle === "form-wireframe" || subQ.inputStyle === "structure-diagram" || subQ.inputStyle === "entity-occurrence-diagram") && (
                          <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <Label className="text-sm font-medium">Drawing Background Image (Optional)</Label>
                            <div className="flex gap-2">
                              <Input 
                                placeholder="URL for image students will annotate..."
                                value={subQ.drawingBackgroundUrl || ""}
                                onChange={(e) => updateSubQuestion(index, "drawingBackgroundUrl", e.target.value || undefined)}
                                className="flex-1"
                              />
                              <label className="cursor-pointer">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden"
                                  onChange={(e) => handleDrawingBackgroundUpload(e, index)}
                                />
                                <div className="h-10 px-3 inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 text-sm font-medium hover:bg-neutral-900/90 dark:hover:bg-neutral-100/90">
                                  <Upload className="h-4 w-4" />
                                  Upload
                                </div>
                              </label>
                            </div>
                            {subQ.drawingBackgroundUrl && (
                              <div className="flex items-center gap-2">
                                <img 
                                  src={subQ.drawingBackgroundUrl} 
                                  alt="Drawing background preview" 
                                  className="h-16 rounded border"
                                />
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-red-500"
                                  onClick={() => updateSubQuestion(index, "drawingBackgroundUrl", undefined)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            <p className="text-xs text-neutral-500">If set, this image will be the background for the drawing canvas. Any other images in the question will be shown separately for reference.</p>
                          </div>
                        )}

                        {/* Form Wireframe Expectations - for AI grading */}
                        {subQ.inputStyle === "form-wireframe" && (
                          <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                              <Label className="text-sm font-semibold">Expected Form Elements (for AI grading)</Label>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const current = subQ.inputConfig?.formWireframeExpectations || [];
                                  updateSubQuestion(index, "inputConfig", {
                                    ...(subQ.inputConfig || {}),
                                    formWireframeExpectations: [...current, { fieldType: "text-input", labelText: "" }]
                                  });
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add Expected Element
                              </Button>
                            </div>
                            <p className="text-xs text-neutral-500">Specify what form elements students should include. The AI will check for these when grading.</p>
                            
                            {subQ.inputConfig?.formWireframeExpectations?.map((expectation, expIdx) => (
                              <div key={expIdx} className="flex gap-2 items-start flex-wrap p-2 bg-white dark:bg-neutral-900 rounded border">
                                <div className="flex-1 min-w-[120px]">
                                  <Label className="text-xs">Type</Label>
                                  <Select
                                    value={expectation.fieldType}
                                    onValueChange={(val) => {
                                      const updated = [...(subQ.inputConfig?.formWireframeExpectations || [])];
                                      updated[expIdx] = { ...updated[expIdx], fieldType: val as any };
                                      updateSubQuestion(index, "inputConfig", {
                                        ...(subQ.inputConfig || {}),
                                        formWireframeExpectations: updated
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text-input">Text Input</SelectItem>
                                      <SelectItem value="textarea">Textarea</SelectItem>
                                      <SelectItem value="dropdown">Dropdown</SelectItem>
                                      <SelectItem value="radio-group">Radio Group</SelectItem>
                                      <SelectItem value="checkbox">Checkbox</SelectItem>
                                      <SelectItem value="submit-button">Submit Button</SelectItem>
                                      <SelectItem value="label">Label Only</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex-[2] min-w-[150px]">
                                  <Label className="text-xs">Label Text (fuzzy match)</Label>
                                  <Input 
                                    value={expectation.labelText || ""}
                                    onChange={(e) => {
                                      const updated = [...(subQ.inputConfig?.formWireframeExpectations || [])];
                                      updated[expIdx] = { ...updated[expIdx], labelText: e.target.value };
                                      updateSubQuestion(index, "inputConfig", {
                                        ...(subQ.inputConfig || {}),
                                        formWireframeExpectations: updated
                                      });
                                    }}
                                    placeholder="e.g., Name, Email, Phone..."
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div className="flex items-end gap-2">
                                  <label className="flex items-center gap-1 text-xs cursor-pointer mt-4">
                                    <input 
                                      type="checkbox"
                                      checked={expectation.required || false}
                                      onChange={(e) => {
                                        const updated = [...(subQ.inputConfig?.formWireframeExpectations || [])];
                                        updated[expIdx] = { ...updated[expIdx], required: e.target.checked };
                                        updateSubQuestion(index, "inputConfig", {
                                          ...(subQ.inputConfig || {}),
                                          formWireframeExpectations: updated
                                        });
                                      }}
                                      className="w-3 h-3"
                                    />
                                    Required*
                                  </label>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-500"
                                    onClick={() => {
                                      const updated = (subQ.inputConfig?.formWireframeExpectations || []).filter((_, i) => i !== expIdx);
                                      updateSubQuestion(index, "inputConfig", {
                                        ...(subQ.inputConfig || {}),
                                        formWireframeExpectations: updated.length > 0 ? updated : undefined
                                      });
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                {(expectation.fieldType === "dropdown" || expectation.fieldType === "radio-group") && (
                                  <div className="w-full">
                                    <Label className="text-xs">Options (comma-separated)</Label>
                                    <OptionsInput 
                                      value={expectation.options}
                                      onChange={(options) => {
                                        const updated = [...(subQ.inputConfig?.formWireframeExpectations || [])];
                                        updated[expIdx] = { 
                                          ...updated[expIdx], 
                                          options
                                        };
                                        updateSubQuestion(index, "inputConfig", {
                                          ...(subQ.inputConfig || {}),
                                          formWireframeExpectations: updated
                                        });
                                      }}
                                      placeholder="Option 1, Option 2, Option 3..."
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                )}
                                {/* Validation rules for text input types only */}
                                {(expectation.fieldType === "text-input" || expectation.fieldType === "textarea") && (
                                  <div className="w-full">
                                    <Label className="text-xs">Expected Validation</Label>
                                    <Input 
                                      value={expectation.validationMessage || ""}
                                      onChange={(e) => {
                                        const updated = [...(subQ.inputConfig?.formWireframeExpectations || [])];
                                        updated[expIdx] = { 
                                          ...updated[expIdx], 
                                          validationMessage: e.target.value || undefined
                                        };
                                        updateSubQuestion(index, "inputConfig", {
                                          ...(subQ.inputConfig || {}),
                                          formWireframeExpectations: updated
                                        });
                                      }}
                                      placeholder="e.g., 1-14 or must be positive"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {(!subQ.inputConfig?.formWireframeExpectations || subQ.inputConfig.formWireframeExpectations.length === 0) && (
                              <p className="text-xs text-neutral-400 italic">No expectations set. Add expected form elements to help the AI grade student responses.</p>
                            )}
                          </div>
                        )}

                        {/* Table Configuration */}
                        {subQ.inputStyle === "table" && (
                          <div className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                              <Label className="text-sm font-semibold">Table Configuration</Label>
                              {!subQ.inputConfig?.rows && !subQ.inputConfig?.columns && !subQ.inputConfig?.grid && (
                                <div className="flex gap-2 flex-wrap">
                                  <Button size="sm" variant="outline" onClick={() => initGridTableConfig(index)}>
                                    <Plus className="w-3 h-3 mr-1" /> Flexible Grid (Recommended)
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => initTableConfig(index)}>
                                    Row-Based
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => initColumnTableConfig(index)}>
                                    Column-Based
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {/* Flexible grid table configuration */}
                            {subQ.inputConfig?.grid && (
                              <>
                                <p className="text-xs text-neutral-500">Click cells to toggle between fixed text and input fields</p>
                                
                                <div className="w-full overflow-x-auto">
                                  <table className="border-collapse border border-neutral-300 dark:border-neutral-600 text-sm w-full">
                                    <thead>
                                      <tr>
                                        <th className="border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-200 dark:bg-neutral-700 w-8"></th>
                                        {subQ.inputConfig.grid.headers.map((header, colIdx) => (
                                          <th key={colIdx} className="border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-200 dark:bg-neutral-700">
                                            <div className="flex items-center gap-1">
                                              <input 
                                                type="text"
                                                value={header}
                                                onChange={(e) => updateGridHeader(index, colIdx, e.target.value)}
                                                className="h-7 text-xs px-2 border rounded w-16"
                                              />
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 text-red-500"
                                                onClick={() => removeGridColumn(index, colIdx)}
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </th>
                                        ))}
                                        <th className="border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-200 dark:bg-neutral-700">
                                          <Button size="sm" variant="ghost" onClick={() => addGridColumn(index)} className="h-6 px-2">
                                            <Plus className="w-3 h-3" />
                                          </Button>
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {subQ.inputConfig.grid.rows.map((row, rowIdx) => (
                                        <tr key={rowIdx}>
                                          <td className="border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-100 dark:bg-neutral-800">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0 text-red-500"
                                              onClick={() => removeGridRow(index, rowIdx)}
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </td>
                                          {row.cells.map((cell, cellIdx) => (
                                            <td 
                                              key={cellIdx} 
                                              className={`border border-neutral-300 dark:border-neutral-600 p-1 ${cell.isInput ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                                            >
                                              <div className="space-y-1">
                                                <div className="flex items-center gap-1">
                                                  <input 
                                                    type="text"
                                                    value={cell.value || ""}
                                                    onChange={(e) => updateGridCell(index, rowIdx, cellIdx, "value", e.target.value)}
                                                    placeholder={cell.isInput ? "" : ""}
                                                    className={`h-7 text-xs px-1 border rounded flex-1 min-w-[60px] ${cell.isInput ? 'border-blue-400' : ''}`}
                                                  />
                                                  <label className="flex items-center gap-0.5 text-xs whitespace-nowrap cursor-pointer shrink-0" title="Check to make this an input field">
                                                    <input 
                                                      type="checkbox"
                                                      checked={cell.isInput || false}
                                                      onChange={(e) => updateGridCell(index, rowIdx, cellIdx, "isInput", e.target.checked)}
                                                      className="w-3 h-3"
                                                    />
                                                    <span className="text-[10px]">Input</span>
                                                  </label>
                                                </div>
                                                {cell.isInput && (
                                                  <div className="flex items-center gap-1 flex-wrap">
                                                    <Input 
                                                      value={cell.placeholder || ""}
                                                      onChange={(e) => updateGridCell(index, rowIdx, cellIdx, "placeholder", e.target.value)}
                                                      placeholder="Placeholder"
                                                      className="h-6 text-xs flex-1 min-w-[80px]"
                                                    />
                                                    <Select
                                                      value={cell.width || "auto"}
                                                      onValueChange={(val) => updateGridCell(index, rowIdx, cellIdx, "width", val)}
                                                    >
                                                      <SelectTrigger className="w-20 h-6 text-xs">
                                                        <SelectValue placeholder="W" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="auto">Auto</SelectItem>
                                                        <SelectItem value="50px">S</SelectItem>
                                                        <SelectItem value="100px">M</SelectItem>
                                                        <SelectItem value="150px">L</SelectItem>
                                                        <SelectItem value="200px">XL</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                    <label className="flex items-center gap-0.5 text-xs whitespace-nowrap cursor-pointer shrink-0" title="Use multi-line textarea">
                                                      <input 
                                                        type="checkbox"
                                                        checked={cell.multiline || false}
                                                        onChange={(e) => updateGridCell(index, rowIdx, cellIdx, "multiline", e.target.checked)}
                                                        className="w-3 h-3"
                                                      />
                                                      <span className="text-[10px]">Multi</span>
                                                    </label>
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                          ))}
                                          <td className="border border-neutral-300 dark:border-neutral-600 p-1"></td>
                                        </tr>
                                      ))}
                                      <tr>
                                        <td className="border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-100 dark:bg-neutral-800">
                                          <Button size="sm" variant="ghost" onClick={() => addGridRow(index)} className="h-6 px-2">
                                            <Plus className="w-3 h-3" />
                                          </Button>
                                        </td>
                                        <td colSpan={subQ.inputConfig.grid.headers.length + 1} className="border border-neutral-300 dark:border-neutral-600 p-1 text-xs text-neutral-400">
                                          Add row
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-neutral-500 text-xs"
                                  onClick={() => updateSubQuestion(index, "inputConfig", undefined)}
                                >
                                  Clear table configuration
                                </Button>
                              </>
                            )}
                            
                            {/* Column-based table configuration */}
                            {subQ.inputConfig?.columns && (
                              <>
                                <p className="text-xs text-neutral-500">Column-based table: inputs appear below each column header</p>
                                
                                <div className="space-y-2">
                                  <Label className="text-xs">Number of Input Rows</Label>
                                  <Input 
                                    type="number"
                                    min="1"
                                    value={subQ.inputConfig.inputRows || 1}
                                    onChange={(e) => updateInputRows(index, parseInt(e.target.value) || 1)}
                                    className="w-24"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label className="text-xs">Columns</Label>
                                  {subQ.inputConfig.columns.map((col, colIndex) => (
                                    <div key={colIndex} className="p-2 border rounded-lg space-y-2 bg-white dark:bg-neutral-800">
                                      <div className="flex gap-2 items-center">
                                        <Input 
                                          placeholder="Header"
                                          value={col.header}
                                          onChange={(e) => updateTableColumn(index, colIndex, "header", e.target.value)}
                                          className="flex-1"
                                        />
                                        <Input 
                                          placeholder="Key (for grading)"
                                          value={col.key}
                                          onChange={(e) => updateTableColumn(index, colIndex, "key", e.target.value)}
                                          className="flex-1"
                                        />
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className="text-red-500 px-2"
                                          onClick={() => removeTableColumn(index, colIndex)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      <div className="flex gap-2 items-center pl-2">
                                        <Input 
                                          placeholder="Placeholder text (e.g. A, B, C)"
                                          value={col.placeholder || ""}
                                          onChange={(e) => updateTableColumn(index, colIndex, "placeholder", e.target.value)}
                                          className="flex-1 h-8 text-sm"
                                        />
                                        <Select
                                          value={col.width || "auto"}
                                          onValueChange={(val) => updateTableColumn(index, colIndex, "width", val)}
                                        >
                                          <SelectTrigger className="w-28 h-8 text-sm">
                                            <SelectValue placeholder="Width" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="auto">Auto</SelectItem>
                                            <SelectItem value="50px">Small</SelectItem>
                                            <SelectItem value="100px">Medium</SelectItem>
                                            <SelectItem value="150px">Large</SelectItem>
                                            <SelectItem value="200px">X-Large</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  ))}
                                  <Button size="sm" variant="outline" onClick={() => addTableColumn(index)}>
                                    <Plus className="w-3 h-3 mr-1" /> Add Column
                                  </Button>
                                </div>
                                
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-neutral-500 text-xs"
                                  onClick={() => updateSubQuestion(index, "inputConfig", undefined)}
                                >
                                  Switch to Row-Based Table
                                </Button>
                              </>
                            )}
                            
                            {/* Row-based table configuration */}
                            {subQ.inputConfig?.rows && (
                              <>
                                <p className="text-xs text-neutral-500">Row-based table: label in first column, value/input in second column</p>
                                
                                <div className="space-y-2">
                                  <Label className="text-xs">Column Headers (comma separated)</Label>
                                  <Input 
                                    value={subQ.inputConfig.headers?.join(", ") || ""}
                                    onChange={(e) => updateSubQuestion(index, "inputConfig", {
                                      ...subQ.inputConfig,
                                      headers: e.target.value.split(",").map(s => s.trim())
                                    })}
                                    placeholder="e.g. Variable, Sample Data, Type"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label className="text-xs">Rows</Label>
                                  {subQ.inputConfig.rows.map((row, rowIndex) => (
                                    <div key={rowIndex} className="p-2 border rounded-lg space-y-2 bg-white dark:bg-neutral-800">
                                      <div className="flex gap-2 items-center">
                                        <Input 
                                          placeholder="Label"
                                          value={row.label}
                                          onChange={(e) => updateTableRow(index, rowIndex, "label", e.target.value)}
                                          className="flex-1"
                                        />
                                        <Input 
                                          placeholder="Fixed value (optional)"
                                          value={row.value || ""}
                                          onChange={(e) => updateTableRow(index, rowIndex, "value", e.target.value)}
                                          className="flex-1"
                                        />
                                        <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                                          <input 
                                            type="checkbox"
                                            checked={row.isInput}
                                            onChange={(e) => updateTableRow(index, rowIndex, "isInput", e.target.checked)}
                                          />
                                          Input?
                                        </label>
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className="text-red-500 px-2"
                                          onClick={() => removeTableRow(index, rowIndex)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      {row.isInput && (
                                        <div className="flex gap-2 items-center pl-2">
                                          <Input 
                                            placeholder="Placeholder text (e.g. A, B, C)"
                                            value={row.placeholder || ""}
                                            onChange={(e) => updateTableRow(index, rowIndex, "placeholder", e.target.value)}
                                            className="flex-1 h-8 text-sm"
                                          />
                                          <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                                            <input 
                                              type="checkbox"
                                              checked={row.multiline || false}
                                              onChange={(e) => updateTableRow(index, rowIndex, "multiline", e.target.checked)}
                                            />
                                            Multi-line
                                          </label>
                                          <Select
                                            value={row.width || "auto"}
                                            onValueChange={(val) => updateTableRow(index, rowIndex, "width", val)}
                                          >
                                            <SelectTrigger className="w-28 h-8 text-sm">
                                              <SelectValue placeholder="Width" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="auto">Auto</SelectItem>
                                              <SelectItem value="50px">Small</SelectItem>
                                              <SelectItem value="100px">Medium</SelectItem>
                                              <SelectItem value="150px">Large</SelectItem>
                                              <SelectItem value="200px">X-Large</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  <Button size="sm" variant="outline" onClick={() => addTableRow(index)}>
                                    <Plus className="w-3 h-3 mr-1" /> Add Row
                                  </Button>
                                </div>
                                
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-neutral-500 text-xs"
                                  onClick={() => updateSubQuestion(index, "inputConfig", undefined)}
                                >
                                  Switch to Column-Based Table
                                </Button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Code Editor Configuration - Starter Code */}
                        {subQ.inputStyle === "code-editor" && (
                          <div className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border max-w-xl">
                            <Label className="text-sm font-semibold">Starter Code (Optional)</Label>
                            <p className="text-xs text-neutral-500">Provide code that students will see pre-filled in the editor. They can then complete or modify it.</p>
                            <Textarea
                              value={subQ.inputConfig?.starterCode || ""}
                              onChange={(e) => {
                                const newConfig = { ...subQ.inputConfig, starterCode: e.target.value };
                                updateSubQuestion(index, "inputConfig", newConfig);
                              }}
                              placeholder="# Enter starter code here that students will complete..."
                              className="font-mono text-sm min-h-[150px] bg-neutral-900 text-neutral-100"
                            />
                          </div>
                        )}

                        {/* Labeled Inputs Configuration */}
                        {subQ.inputStyle === "labeled-inputs" && (
                          <div className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border max-w-xl">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm font-semibold">Labeled Inputs Configuration</Label>
                              {!subQ.inputConfig?.fields && (
                                <Button size="sm" variant="outline" onClick={() => initLabeledInputsConfig(index)}>
                                  <Plus className="w-3 h-3 mr-1" /> Initialize Fields
                                </Button>
                              )}
                            </div>
                            
                            {subQ.inputConfig?.fields && (
                              <div className="space-y-2">
                                {subQ.inputConfig.fields.map((field, fieldIndex) => (
                                  <div key={fieldIndex} className="flex gap-2 items-center">
                                    <Input 
                                      placeholder="Label"
                                      value={field.label}
                                      onChange={(e) => updateLabeledField(index, fieldIndex, "label", e.target.value)}
                                      className="flex-1"
                                    />
                                    <Input 
                                      placeholder="Key (for grading)"
                                      value={field.key}
                                      onChange={(e) => updateLabeledField(index, fieldIndex, "key", e.target.value)}
                                      className="flex-1"
                                    />
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="text-red-500 px-2"
                                      onClick={() => removeLabeledField(index, fieldIndex)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                                <Button size="sm" variant="outline" onClick={() => addLabeledField(index)}>
                                  <Plus className="w-3 h-3 mr-1" /> Add Field
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Fill-in-Blanks Configuration */}
                        {subQ.inputStyle === "fill-in-blanks" && (
                          <div className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border max-w-xl">
                            <Label className="text-sm font-semibold">Fill in the Blanks Configuration</Label>
                            <p className="text-xs text-neutral-500">Use {"{{blank_1}}"}, {"{{blank_2}}"}, etc. as placeholders in your code template.</p>
                            
                            <div>
                              <Label className="text-xs">Code Template</Label>
                              <Textarea
                                value={subQ.inputConfig?.codeTemplate || ""}
                                onChange={(e) => {
                                  const newConfig = { ...subQ.inputConfig, codeTemplate: e.target.value };
                                  updateSubQuestion(index, "inputConfig", newConfig);
                                }}
                                placeholder="Enter code with {{blank_1}}, {{blank_2}} placeholders..."
                                className="font-mono text-sm min-h-[150px]"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs">Blanks (Answers)</Label>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const blanks = subQ.inputConfig?.blanks || [];
                                    const newBlank = { key: `blank_${blanks.length + 1}`, answer: "", hint: "" };
                                    updateSubQuestion(index, "inputConfig", { ...subQ.inputConfig, blanks: [...blanks, newBlank] });
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Add Blank
                                </Button>
                              </div>
                              
                              {(subQ.inputConfig?.blanks || []).map((blank, blankIdx) => (
                                <div key={blankIdx} className="flex gap-2 items-center bg-white dark:bg-neutral-800 p-2 rounded border">
                                  <span className="text-xs font-mono text-neutral-500 w-16">{`{{${blank.key}}}`}</span>
                                  <Input
                                    value={blank.answer}
                                    onChange={(e) => {
                                      const blanks = [...(subQ.inputConfig?.blanks || [])];
                                      blanks[blankIdx] = { ...blanks[blankIdx], answer: e.target.value };
                                      updateSubQuestion(index, "inputConfig", { ...subQ.inputConfig, blanks });
                                    }}
                                    placeholder="Correct answer"
                                    className="flex-1 h-8"
                                  />
                                  <Input
                                    value={blank.hint || ""}
                                    onChange={(e) => {
                                      const blanks = [...(subQ.inputConfig?.blanks || [])];
                                      blanks[blankIdx] = { ...blanks[blankIdx], hint: e.target.value };
                                      updateSubQuestion(index, "inputConfig", { ...subQ.inputConfig, blanks });
                                    }}
                                    placeholder="Hint (optional)"
                                    className="w-24 h-8"
                                  />
                                  <Input
                                    type="number"
                                    value={blank.width || 80}
                                    onChange={(e) => {
                                      const blanks = [...(subQ.inputConfig?.blanks || [])];
                                      blanks[blankIdx] = { ...blanks[blankIdx], width: parseInt(e.target.value) || 80 };
                                      updateSubQuestion(index, "inputConfig", { ...subQ.inputConfig, blanks });
                                    }}
                                    placeholder="Width (px)"
                                    className="w-20 h-8"
                                    min={40}
                                    max={300}
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const blanks = (subQ.inputConfig?.blanks || []).filter((_, i) => i !== blankIdx);
                                      updateSubQuestion(index, "inputConfig", { ...subQ.inputConfig, blanks });
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ERD Annotation Configuration */}
                        {subQ.inputStyle === "erd-annotation" && (
                          <div className="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                            <div>
                              <Label className="text-sm font-semibold">1. Draw the ERD Diagram (Student Starting Point)</Label>
                              <p className="text-xs text-neutral-500 mt-1">
                                Draw your ERD using ellipses for attributes. Students will see this diagram and mark attributes as Primary Key (underline) or Foreign Key (star).
                              </p>
                            </div>
                            
                            <DiagramEditor
                              initialData={subQ.inputConfig?.baseErdDiagram || ""}
                              onChange={(data) => {
                                updateSubQuestion(index, "inputConfig", {
                                  ...subQ.inputConfig,
                                  baseErdDiagram: data
                                });
                              }}
                              mode="database"
                              allowBaseItemDeletion={true}
                            />
                            
                            <div className="border-t pt-4">
                              <Label className="text-sm font-semibold">2. Draw the Correct Answer (for AI Grading)</Label>
                              <p className="text-xs text-neutral-500 mt-1 mb-3">
                                Draw the same ERD with the correct Primary Key (underline) and Foreign Key (star) markings applied. The AI will use this as a reference when grading student answers.
                              </p>
                              
                              <DiagramEditor
                                initialData={subQ.inputConfig?.correctErdDiagram || ""}
                                onChange={(data) => {
                                  updateSubQuestion(index, "inputConfig", {
                                    ...subQ.inputConfig,
                                    correctErdDiagram: data
                                  });
                                }}
                                mode="erd-annotation"
                                baseDiagram={subQ.inputConfig?.baseErdDiagram || ""}
                                allowBaseItemDeletion={true}
                              />
                            </div>
                            
                            <div className="border-t pt-4">
                              <div className="flex justify-between items-center mb-2">
                                <Label className="text-sm font-semibold">Mark Correct Answers</Label>
                                <Button size="sm" variant="outline" onClick={() => {
                                  // Auto-detect ellipses from diagram and create entries
                                  try {
                                    const items: DiagramItem[] = JSON.parse(subQ.inputConfig?.baseErdDiagram || "[]");
                                    const ellipses = items.filter(i => i.type === "ellipse" && i.content);
                                    const newAttrs = ellipses.map(e => ({
                                      id: e.id,
                                      entityName: "",
                                      attributeName: e.content || "",
                                      correctMarking: "none" as const
                                    }));
                                    updateSubQuestion(index, "inputConfig", {
                                      ...subQ.inputConfig,
                                      erdAttributes: newAttrs
                                    });
                                  } catch (e) {
                                    console.error("Failed to parse diagram", e);
                                  }
                                }}>
                                  <Plus className="w-3 h-3 mr-1" /> Detect Attributes from Diagram
                                </Button>
                              </div>
                              <p className="text-xs text-neutral-500 mb-3">
                                Specify which attributes should be marked as Primary Key or Foreign Key.
                              </p>
                              
                              {subQ.inputConfig?.erdAttributes && subQ.inputConfig.erdAttributes.length > 0 && (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-neutral-500 px-1">
                                    <div className="col-span-5">Attribute (from diagram)</div>
                                    <div className="col-span-6">Correct Marking</div>
                                    <div className="col-span-1"></div>
                                  </div>
                                  {subQ.inputConfig.erdAttributes.map((attr, attrIndex) => (
                                    <div key={attrIndex} className="grid grid-cols-12 gap-2 items-center">
                                      <div className="col-span-5 text-sm px-2 py-1 bg-white dark:bg-neutral-800 rounded border">
                                        {attr.attributeName || "(empty)"}
                                      </div>
                                      <Select 
                                        value={attr.correctMarking} 
                                        onValueChange={(val) => updateErdAttribute(index, attrIndex, "correctMarking", val)}
                                      >
                                        <SelectTrigger className="col-span-6 h-8 text-sm">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">None (no marking needed)</SelectItem>
                                          <SelectItem value="primary">Primary Key (student should underline)</SelectItem>
                                          <SelectItem value="foreign">Foreign Key (student should add star)</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="col-span-1 text-red-500 px-2 h-8"
                                        onClick={() => removeErdAttribute(index, attrIndex)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Navigation Diagram Configuration (N5) */}
                        {subQ.inputStyle === "nav-structure" && (
                          <div className="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                            <div>
                              <Label className="text-sm font-semibold">Starting Diagram (Optional)</Label>
                              <p className="text-xs text-neutral-500 mt-1">
                                Draw a starting navigation diagram that students will complete. Leave empty if students should create from scratch.
                              </p>
                            </div>
                            
                            <DiagramEditor
                              initialData={subQ.inputConfig?.baseNavDiagram || ""}
                              onChange={(data) => {
                                updateSubQuestion(index, "inputConfig", {
                                  ...subQ.inputConfig,
                                  baseNavDiagram: data
                                });
                              }}
                              mode="nav-structure"
                            />
                          </div>
                        )}

                        {/* Navigation Diagram Configuration (Higher) */}
                        {subQ.inputStyle === "nav-structure-higher" && (
                          <div className="space-y-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-semibold">Starting Diagram (Optional)</Label>
                                <p className="text-xs text-neutral-500 mt-1">
                                  Create a starting diagram that students will complete. Leave empty if students should create from scratch.
                                </p>
                              </div>
                              
                              <DiagramEditor
                                initialData={subQ.inputConfig?.baseNavDiagram || ""}
                                onChange={(data) => {
                                  updateSubQuestion(index, "inputConfig", {
                                    ...subQ.inputConfig,
                                    baseNavDiagram: data
                                  });
                                }}
                                mode="nav-structure-higher"
                              />
                            </div>

                            <div className="border-t pt-4 space-y-4">
                              <div>
                                <Label className="text-sm font-semibold text-green-700 dark:text-green-400">Solution Diagram (For AI Grading)</Label>
                                <p className="text-xs text-neutral-500 mt-1">
                                  Draw the expected solution. This will be shown to the AI to help grade student answers more accurately.
                                </p>
                              </div>
                              
                              <DiagramEditor
                                initialData={subQ.inputConfig?.solutionNavDiagram || ""}
                                onChange={(data) => {
                                  updateSubQuestion(index, "inputConfig", {
                                    ...subQ.inputConfig,
                                    solutionNavDiagram: data
                                  });
                                }}
                                mode="nav-structure-higher"
                              />
                            </div>
                          </div>
                        )}

                        {/* Tag Matching Configuration */}
                        {subQ.inputStyle === "tag-matching" && (
                          <div className="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                            <div>
                              <Label className="text-sm font-semibold">Tag Matching Setup</Label>
                              <p className="text-xs text-neutral-500 mt-1">
                                Add source tags on the left, then draw target zones on the image where each tag should connect. Upload a background image first.
                              </p>
                            </div>
                            
                            <TagMatchingEditor
                              mode="edit"
                              backgroundUrl={subQ.drawingBackgroundUrl}
                              sourceTags={subQ.inputConfig?.tagMatchingConfig?.sourceTags || []}
                              targetZones={subQ.inputConfig?.tagMatchingConfig?.targetZones || []}
                              onChange={(tags: SourceTag[], zones: TargetZone[]) => {
                                updateSubQuestion(index, "inputConfig", {
                                  ...subQ.inputConfig,
                                  tagMatchingConfig: { sourceTags: tags, targetZones: zones }
                                });
                              }}
                            />
                          </div>
                        )}

                        {/* Structure Dataflow Configuration */}
                        {subQ.inputStyle === "structure-dataflow" && (
                          <div className="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                            <div>
                              <Label className="text-sm font-semibold">Base Structure Diagram</Label>
                              <p className="text-xs text-neutral-500 mt-1">
                                Draw the structure diagram with function boxes, dataflow arrows (up = data IN, down = data OUT), and variable labels. Students will see this as the starting point.
                              </p>
                            </div>
                            
                            <DiagramEditor
                              initialData={subQ.inputConfig?.baseStructureDiagram || ""}
                              onChange={(data) => {
                                updateSubQuestion(index, "inputConfig", {
                                  ...subQ.inputConfig,
                                  baseStructureDiagram: data
                                });
                              }}
                              mode="structure-dataflow"
                              showFunctionNumbers={true}
                            />
                          </div>
                        )}

                        {/* Structure Diagram (Design Notation) Configuration */}
                        {subQ.inputStyle === "structure-diagram" && (
                          <div className="space-y-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-semibold">Starting Diagram (Optional)</Label>
                                <p className="text-xs text-neutral-500 mt-1">
                                  Create a starting structure diagram with process (rectangles), decision (diamonds), and loop (ellipses) shapes that students will complete. Leave empty if students should create from scratch.
                                </p>
                              </div>
                              
                              <DiagramEditor
                                initialData={subQ.inputConfig?.baseStructureDiagram || ""}
                                onChange={(data) => {
                                  updateSubQuestion(index, "inputConfig", {
                                    ...subQ.inputConfig,
                                    baseStructureDiagram: data
                                  });
                                }}
                                mode="structure-diagram"
                              />
                            </div>

                            <div className="border-t pt-4 space-y-4">
                              <div>
                                <Label className="text-sm font-semibold text-green-700 dark:text-green-400">Solution Diagram (For AI Grading)</Label>
                                <p className="text-xs text-neutral-500 mt-1">
                                  Draw the expected solution diagram. This will be shown to the AI to help grade student answers more accurately.
                                </p>
                              </div>
                              
                              <DiagramEditor
                                initialData={subQ.inputConfig?.solutionStructureDiagram || ""}
                                onChange={(data) => {
                                  updateSubQuestion(index, "inputConfig", {
                                    ...subQ.inputConfig,
                                    solutionStructureDiagram: data
                                  });
                                }}
                                mode="structure-diagram"
                              />
                            </div>
                          </div>
                        )}

                        {/* Entity-Occurrence Diagram Configuration */}
                        {subQ.inputStyle === "entity-occurrence-diagram" && (
                          <div className="space-y-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-semibold">Starting Diagram (Optional)</Label>
                                <p className="text-xs text-neutral-500 mt-1">
                                  Create a starting entity-occurrence diagram with entities (tall ovals) and occurrences inside them. Students will complete the diagram by adding connections between occurrences.
                                </p>
                              </div>
                              
                              <DiagramEditor
                                initialData={subQ.inputConfig?.baseEntityOccurrenceDiagram || ""}
                                onChange={(data) => {
                                  updateSubQuestion(index, "inputConfig", {
                                    ...subQ.inputConfig,
                                    baseEntityOccurrenceDiagram: data
                                  });
                                }}
                                mode="entity-occurrence"
                              />
                            </div>

                            <div className="border-t pt-4 space-y-4">
                              <div>
                                <Label className="text-sm font-semibold text-green-700 dark:text-green-400">Solution Diagram (For AI Grading)</Label>
                                <p className="text-xs text-neutral-500 mt-1">
                                  Draw the expected solution diagram with the correct connections between entity occurrences. This will be shown to the AI to help grade student answers.
                                </p>
                              </div>
                              
                              <DiagramEditor
                                initialData={subQ.inputConfig?.solutionEntityOccurrenceDiagram || ""}
                                onChange={(data) => {
                                  updateSubQuestion(index, "inputConfig", {
                                    ...subQ.inputConfig,
                                    solutionEntityOccurrenceDiagram: data
                                  });
                                }}
                                mode="entity-occurrence"
                              />
                            </div>
                          </div>
                        )}

                        {/* Database Schema Diagram Configuration */}
                        {subQ.inputStyle === "database-schema" && (
                          <div className="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                            <div>
                              <Label className="text-sm font-semibold">Database Schema Tables</Label>
                              <p className="text-xs text-neutral-500 mt-1">
                                Create database tables with fields. Mark primary keys (underlined) and foreign keys (*) to show relationships between tables.
                              </p>
                            </div>
                            
                            <DatabaseSchemaEditor
                              value={subQ.inputConfig?.databaseSchema}
                              onChange={(schema) => {
                                updateSubQuestion(index, "inputConfig", {
                                  ...subQ.inputConfig,
                                  databaseSchema: schema
                                });
                              }}
                            />
                            
                            {subQ.inputConfig?.databaseSchema && subQ.inputConfig.databaseSchema.tables.length > 0 && (
                              <div className="border-t pt-4">
                                <Label className="text-sm font-semibold text-green-700 dark:text-green-400">Preview</Label>
                                <div className="mt-2 p-3 bg-white dark:bg-neutral-800 rounded border">
                                  <DatabaseSchemaDisplay schema={subQ.inputConfig.databaseSchema} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Content Blocks - Flexible ordering */}
                        <div className="space-y-3">
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Question Content</p>
                            
                            {/* Render content blocks in order */}
                            {(subQ.contentBlocks && subQ.contentBlocks.length > 0) ? (
                                <div className="space-y-1">
                                    {subQ.contentBlocks.map((block, blockIndex) => (
                                        <div key={block.id}>
                                          {/* Insert before button */}
                                          <div className="flex justify-center py-1 opacity-0 hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-5 px-2 text-xs text-neutral-400 hover:text-neutral-600">
                                                  <Plus className="h-3 w-3 mr-1" /> Insert here
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => addContentBlock(index, "text", blockIndex)}>
                                                  <Type className="h-4 w-4 mr-2" /> Text
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => addContentBlock(index, "image", blockIndex)}>
                                                  <Image className="h-4 w-4 mr-2" /> Image
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => addContentBlock(index, "code", blockIndex)}>
                                                  <Code className="h-4 w-4 mr-2" /> Code
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => addContentBlock(index, "code-table", blockIndex)}>
                                                  <Table className="h-4 w-4 mr-2" /> Code Table
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => addContentBlock(index, "data-table", blockIndex)}>
                                                  <Table className="h-4 w-4 mr-2" /> Data Table
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => addContentBlock(index, "database-schema", blockIndex)}>
                                                  <Database className="h-4 w-4 mr-2" /> DB Schema
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => addContentBlock(index, "pseudocode", blockIndex)}>
                                                  <Code className="h-4 w-4 mr-2" /> Pseudocode
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                          <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    {block.type === "text" && <Type className="h-4 w-4 text-neutral-500" />}
                                                    {block.type === "image" && <Image className="h-4 w-4 text-neutral-500" />}
                                                    {block.type === "code" && <Code className="h-4 w-4 text-neutral-500" />}
                                                    {(block.type === "code-table" || block.type === "data-table") && <Table className="h-4 w-4 text-neutral-500" />}
                                                    {block.type === "database-schema" && <Database className="h-4 w-4 text-neutral-500" />}
                                                    {block.type === "pseudocode" && <Code className="h-4 w-4 text-neutral-500" />}
                                                    {block.type === "row-layout" && <Layers className="h-4 w-4 text-blue-500" />}
                                                    <Label className="text-sm font-medium capitalize">{block.type === "code-table" ? "Code Table" : block.type === "data-table" ? "Data Table" : block.type === "database-schema" ? "DB Schema" : block.type === "pseudocode" ? "Pseudocode" : block.type === "row-layout" ? "Side-by-Side Layout" : block.type}</Label>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2"
                                                        onClick={() => moveContentBlock(index, blockIndex, "up")}
                                                        disabled={blockIndex === 0}
                                                        type="button"
                                                    >
                                                        <MoveUp className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2"
                                                        onClick={() => moveContentBlock(index, blockIndex, "down")}
                                                        disabled={blockIndex === (subQ.contentBlocks?.length || 0) - 1}
                                                        type="button"
                                                    >
                                                        <MoveDown className="h-3 w-3" />
                                                    </Button>
                                                    {block.type !== "row-layout" && blockIndex < (subQ.contentBlocks?.length || 0) - 1 && subQ.contentBlocks?.[blockIndex + 1]?.type !== "row-layout" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-2 text-blue-500 hover:text-blue-600"
                                                            onClick={() => groupSubQuestionContentBlocks(index, blockIndex)}
                                                            type="button"
                                                            title="Group with next block (side-by-side)"
                                                        >
                                                            <Layers className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    {block.type === "row-layout" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-2 text-orange-500 hover:text-orange-600"
                                                            onClick={() => ungroupSubQuestionContentBlocks(index, blockIndex)}
                                                            type="button"
                                                            title="Ungroup blocks"
                                                        >
                                                            <Ungroup className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-600 h-6 px-2"
                                                        onClick={() => removeContentBlock(index, blockIndex)}
                                                        type="button"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            
                                            {block.type === "text" && (
                                                <div className="space-y-2">
                                                    <div className="flex gap-1 mb-1 flex-wrap items-center">
                                                        <Button
                                                            variant={block.textAlign === "left" || !block.textAlign ? "secondary" : "ghost"}
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => updateContentBlock(index, blockIndex, "textAlign", "left")}
                                                            type="button"
                                                            title="Align Left"
                                                        >
                                                            <AlignLeft className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant={block.textAlign === "center" ? "secondary" : "ghost"}
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => updateContentBlock(index, blockIndex, "textAlign", "center")}
                                                            type="button"
                                                            title="Align Center"
                                                        >
                                                            <AlignCenter className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant={block.textAlign === "right" ? "secondary" : "ghost"}
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => updateContentBlock(index, blockIndex, "textAlign", "right")}
                                                            type="button"
                                                            title="Align Right"
                                                        >
                                                            <AlignRight className="h-3 w-3" />
                                                        </Button>
                                                        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />
                                                        <div className="flex items-center gap-1.5">
                                                            <Checkbox
                                                                id={`subq-border-${block.id}`}
                                                                checked={block.hasBorder || false}
                                                                onCheckedChange={(checked) => updateContentBlock(index, blockIndex, "hasBorder", checked === true)}
                                                            />
                                                            <Label htmlFor={`subq-border-${block.id}`} className="text-xs cursor-pointer">Border</Label>
                                                        </div>
                                                        {block.hasBorder && (
                                                            <Select
                                                                value={String(block.borderWidth || 1)}
                                                                onValueChange={(val) => updateContentBlock(index, blockIndex, "borderWidth", parseInt(val))}
                                                            >
                                                                <SelectTrigger className="w-16 h-7 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="1">1px</SelectItem>
                                                                    <SelectItem value="2">2px</SelectItem>
                                                                    <SelectItem value="3">3px</SelectItem>
                                                                    <SelectItem value="4">4px</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    </div>
                                                    <RichTextEditor 
                                                        value={block.content} 
                                                        onChange={(val) => updateContentBlock(index, blockIndex, "content", val)}
                                                        placeholder="Enter text content..."
                                                        rows={3}
                                                    />
                                                </div>
                                            )}
                                            
                                            {block.type === "image" && (
                                                <>
                                                    {block.content && (
                                                        <div className="border rounded-md p-2 w-fit bg-white dark:bg-neutral-800 mb-2">
                                                            <img src={block.content} alt="Preview" className="max-h-32 object-contain" />
                                                        </div>
                                                    )}
                                                    <div className="flex gap-2 items-center mb-2">
                                                        <Input 
                                                            placeholder="Paste image URL..."
                                                            value={block.content || ""}
                                                            onChange={(e) => updateContentBlock(index, blockIndex, "content", e.target.value)}
                                                            className="flex-1 h-8 text-sm"
                                                        />
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                onChange={(e) => handleContentBlockImageUpload(e, index, blockIndex)}
                                                            />
                                                            <Button variant="outline" size="sm" type="button">
                                                                <Upload className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        <Input 
                                                            placeholder="Caption (optional)..."
                                                            value={block.caption || ""}
                                                            onChange={(e) => updateContentBlock(index, blockIndex, "caption", e.target.value)}
                                                            className="flex-1 h-8 text-sm"
                                                        />
                                                        <Select
                                                            value={block.imageSize || "medium"}
                                                            onValueChange={(val) => updateContentBlock(index, blockIndex, "imageSize", val)}
                                                        >
                                                            <SelectTrigger className="w-28 h-8">
                                                                <SelectValue placeholder="Size" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="xs">Extra Small</SelectItem>
                                                                <SelectItem value="small">Small</SelectItem>
                                                                <SelectItem value="medium">Medium</SelectItem>
                                                                <SelectItem value="large">Large</SelectItem>
                                                                <SelectItem value="xl">Extra Large</SelectItem>
                                                                <SelectItem value="2xl">2X Large</SelectItem>
                                                                <SelectItem value="full">Full Width</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </>
                                            )}
                                            
                                            {block.type === "code" && (
                                                <Textarea 
                                                    value={block.content} 
                                                    onChange={(e) => updateContentBlock(index, blockIndex, "content", e.target.value)}
                                                    placeholder="// Enter code here..."
                                                    className="min-h-[100px] font-mono text-sm bg-neutral-900 text-neutral-100 border-neutral-700"
                                                />
                                            )}
                                            
                                            {block.type === "code-table" && (
                                                <div className="space-y-3">
                                                    {block.codeSections?.map((section, sectionIndex) => (
                                                        <div key={section.id} className="border rounded-lg overflow-hidden">
                                                            <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-2">
                                                                <Input
                                                                    value={section.label}
                                                                    onChange={(e) => updateSubQuestionCodeSection(index, blockIndex, sectionIndex, "label", e.target.value)}
                                                                    className="flex-1 h-7 text-sm font-medium"
                                                                    placeholder="Section label (e.g., JavaScript Code)"
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                                                    onClick={() => removeSubQuestionCodeSection(index, blockIndex, sectionIndex)}
                                                                    disabled={(block.codeSections?.length || 0) <= 1}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                            <Textarea
                                                                className="font-mono text-sm bg-neutral-900 text-neutral-100 border-0 rounded-none"
                                                                value={section.code}
                                                                onChange={(e) => updateSubQuestionCodeSection(index, blockIndex, sectionIndex, "code", e.target.value)}
                                                                rows={3}
                                                                placeholder="Enter code here..."
                                                            />
                                                        </div>
                                                    ))}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addSubQuestionCodeSection(index, blockIndex)}
                                                        type="button"
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" /> Add Section
                                                    </Button>
                                                </div>
                                            )}

                                            {block.type === "data-table" && block.dataTable && (
                                                <div className="space-y-3">
                                                    <ResponsiveDataTable dataTable={block.dataTable} />
                                                    <div className="flex justify-center">
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                          setEditingDataTable({ type: "subQuestion", blockIndex, subIndex: index });
                                                          setDataTableModalOpen(true);
                                                        }}
                                                        type="button"
                                                      >
                                                        <Table className="h-3 w-3 mr-1" /> Edit Table
                                                      </Button>
                                                    </div>
                                                    <p className="text-xs text-center text-neutral-500">
                                                      {block.dataTable.columns.length} columns, {block.dataTable.rows.length} rows
                                                    </p>
                                                </div>
                                            )}

                                            {block.type === "database-schema" && (
                                                <div className="space-y-3">
                                                    <DatabaseSchemaEditor
                                                        value={block.databaseSchema}
                                                        onChange={(schema) => updateContentBlockDatabaseSchema(index, blockIndex, schema)}
                                                    />
                                                    {block.databaseSchema && block.databaseSchema.tables.length > 0 && (
                                                        <div className="border-t pt-3">
                                                            <p className="text-xs text-neutral-500 mb-2">Preview:</p>
                                                            <div className="p-3 bg-white dark:bg-neutral-800 rounded border">
                                                                <DatabaseSchemaDisplay schema={block.databaseSchema} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {block.type === "pseudocode" && (
                                                <div className="space-y-3">
                                                    <div className="border rounded-lg overflow-hidden">
                                                        <table className="w-full font-mono text-sm">
                                                            <thead>
                                                                <tr className="bg-neutral-100 dark:bg-neutral-800 border-b">
                                                                    <th className="w-12 px-2 py-1 text-center text-xs text-neutral-500">Line</th>
                                                                    <th className="w-20 px-2 py-1 text-center text-xs text-neutral-500">Indent</th>
                                                                    <th className="px-2 py-1 text-left text-xs text-neutral-500">Code</th>
                                                                    <th className="w-16 px-1 py-1"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(block.pseudocodeLines || []).map((line, lineIndex) => (
                                                                    <tr key={line.id} className="border-b last:border-b-0">
                                                                        <td className="px-2 py-1 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900">{line.lineNumber}</td>
                                                                        <td className="px-1 py-1">
                                                                            <Select
                                                                                value={String(line.indent)}
                                                                                onValueChange={(v) => updateContentBlockPseudocodeLine(index, blockIndex, lineIndex, "indent", parseInt(v))}
                                                                            >
                                                                                <SelectTrigger className="h-7 text-xs">
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {[0, 1, 2, 3, 4, 5].map(n => (
                                                                                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </td>
                                                                        <td className="px-1 py-1">
                                                                            <Input
                                                                                value={line.content}
                                                                                onChange={(e) => updateContentBlockPseudocodeLine(index, blockIndex, lineIndex, "content", e.target.value)}
                                                                                className="h-7 font-mono text-sm"
                                                                                placeholder="Enter pseudocode..."
                                                                            />
                                                                        </td>
                                                                        <td className="px-1 py-1">
                                                                            <div className="flex gap-1">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-6 w-6 p-0"
                                                                                    onClick={() => addContentBlockPseudocodeLine(index, blockIndex, lineIndex)}
                                                                                    title="Add line below"
                                                                                >
                                                                                    <Plus className="h-3 w-3" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                                                    onClick={() => removeContentBlockPseudocodeLine(index, blockIndex, lineIndex)}
                                                                                    disabled={(block.pseudocodeLines || []).length <= 1}
                                                                                    title="Remove line"
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
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addContentBlockPseudocodeLine(index, blockIndex)}
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" /> Add Line
                                                    </Button>
                                                </div>
                                            )}

                                            {block.type === "row-layout" && block.children && (
                                                <div className="space-y-2">
                                                    <p className="text-xs text-neutral-500">These blocks will display side-by-side on larger screens:</p>
                                                    <RowLayout>
                                                        {block.children.map((childBlock) => (
                                                            <RowLayoutItem key={childBlock.id}>
                                                                <div className="p-2 bg-white dark:bg-neutral-800 rounded border text-sm">
                                                                    <div className="flex items-center gap-1 mb-1 text-xs text-neutral-500">
                                                                        {childBlock.type === "text" && <Type className="h-3 w-3" />}
                                                                        {childBlock.type === "image" && <Image className="h-3 w-3" />}
                                                                        {childBlock.type === "code" && <Code className="h-3 w-3" />}
                                                                        {childBlock.type === "data-table" && <Table className="h-3 w-3" />}
                                                                        {childBlock.type === "database-schema" && <Database className="h-3 w-3" />}
                                                                        <span className="capitalize">{childBlock.type === "data-table" ? "Data Table" : childBlock.type}</span>
                                                                    </div>
                                                                    {childBlock.type === "text" && (
                                                                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: childBlock.content }} />
                                                                    )}
                                                                    {childBlock.type === "image" && childBlock.content && (
                                                                        <img src={childBlock.content} alt={childBlock.caption || ""} className="max-h-32 object-contain" />
                                                                    )}
                                                                    {childBlock.type === "code" && (
                                                                        <pre className="text-xs bg-neutral-900 text-neutral-100 p-2 rounded overflow-x-auto">{childBlock.content}</pre>
                                                                    )}
                                                                    {childBlock.type === "data-table" && childBlock.dataTable && (
                                                                        <ResponsiveDataTable dataTable={childBlock.dataTable} />
                                                                    )}
                                                                    {childBlock.type === "database-schema" && childBlock.databaseSchema && (
                                                                        <DatabaseSchemaDisplay schema={childBlock.databaseSchema} />
                                                                    )}
                                                                </div>
                                                            </RowLayoutItem>
                                                        ))}
                                                    </RowLayout>
                                                    <p className="text-xs text-center text-neutral-400">Click the ungroup button above to edit individual blocks</p>
                                                </div>
                                            )}
                                          </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Legacy fields fallback for existing questions */
                                (subQ.questionText || subQ.imageUrl || subQ.codeSnippet) && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                        <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                                            This question uses the old format. Add a content block below to migrate to the new flexible system.
                                        </p>
                                        {subQ.questionText && <p className="text-sm mb-1"><strong>Text:</strong> {subQ.questionText}</p>}
                                        {subQ.imageUrl && <p className="text-sm mb-1"><strong>Image:</strong> <img src={subQ.imageUrl} alt="Preview" className="max-h-24 inline-block" /></p>}
                                        {subQ.codeSnippet && <pre className="text-xs bg-neutral-900 text-neutral-100 p-2 rounded mt-1">{subQ.codeSnippet}</pre>}
                                    </div>
                                )
                            )}

                            {/* Add Content Buttons - Always visible */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-700">
                                <span className="text-xs text-neutral-400 mr-2 self-center">Add:</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addContentBlock(index, "text")}
                                    type="button"
                                >
                                    <Type className="h-3 w-3 mr-1" /> Text
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addContentBlock(index, "image")}
                                    type="button"
                                >
                                    <Image className="h-3 w-3 mr-1" /> Image
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addContentBlock(index, "code")}
                                    type="button"
                                >
                                    <Code className="h-3 w-3 mr-1" /> Code
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addContentBlock(index, "code-table")}
                                    type="button"
                                >
                                    <Table className="h-3 w-3 mr-1" /> Code Table
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addContentBlock(index, "data-table")}
                                    type="button"
                                >
                                    <Table className="h-3 w-3 mr-1" /> Data Table
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addContentBlock(index, "database-schema")}
                                    type="button"
                                >
                                    <Database className="h-3 w-3 mr-1" /> DB Schema
                                </Button>
                            </div>
                        </div>

                        {/* Marking section - for grading (hidden for info-only questions) */}
                        {subQ.inputStyle !== "info-only" && (
                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-4">
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Marking Configuration</p>
                            
                            <div className="space-y-2">
                                <Label>Marking Scheme (One mark per line)</Label>
                                <Textarea 
                                    value={subQ.markingScheme.join("\n")} 
                                    onChange={(e) => updateSubQuestion(index, "markingScheme", e.target.value.split("\n"))}
                                    placeholder="Correct use of WHILE loop&#10;  - Could also accept REPEAT UNTIL&#10;  - Could also accept FOR with condition&#10;Variable initialised before loop"
                                    className="min-h-[100px]"
                                />
                                <p className="text-xs text-neutral-500">Each line = 1 mark. Use indented lines with - for alternative answers worth the same mark.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Keywords for Auto-Marking (Comma separated)</Label>
                                <Input 
                                    value={subQ.keywords?.join(", ") || ""} 
                                    onChange={(e) => updateSubQuestion(index, "keywords", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                    placeholder="e.g. loop, array, integer"
                                />
                                <p className="text-xs text-neutral-500">Used to automatically award marks if these words appear in student answer.</p>
                            </div>

                            {subQ.aiGuidance === undefined ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateSubQuestion(index, "aiGuidance", "")}
                                    type="button"
                                >
                                    <PlusCircle className="h-3 w-3 mr-1" /> Add AI Guidance
                                </Button>
                            ) : (
                                <div className="space-y-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-sm font-medium">AI Marking Guidance</Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 h-6 px-2"
                                            onClick={() => updateSubQuestion(index, "aiGuidance", undefined)}
                                            type="button"
                                        >
                                            <X className="h-3 w-3 mr-1" /> Remove
                                        </Button>
                                    </div>
                                    <Textarea 
                                        value={subQ.aiGuidance || ""} 
                                        onChange={(e) => updateSubQuestion(index, "aiGuidance", e.target.value)}
                                        placeholder="e.g. Do not accept 'while loop' as an answer. Only accept specific programming language syntax, not pseudocode."
                                        className="min-h-[80px]"
                                    />
                                    <p className="text-xs text-neutral-500">Additional instructions for AI marking, such as answers to reject or special requirements.</p>
                                </div>
                            )}
                        </div>
                        )}

                        {/* Nested Sub-Parts Section */}
                        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <div className="flex justify-between items-center mb-3">
                                <Label className="text-sm font-semibold">Sub-Questions (e.g. i, ii, iii)</Label>
                                <Button variant="outline" size="sm" onClick={() => addSubPart(index)}>
                                    <Plus className="mr-1 h-3 w-3" /> Add Sub-Question
                                </Button>
                            </div>
                            
                            {subQ.subParts && subQ.subParts.length > 0 ? (
                                <div className="space-y-3 ml-4 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700">
                                    {subQ.subParts.map((part, partIndex) => (
                                        <div key={part.id || partIndex}>
                                            <Accordion type="single" collapsible className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                                                <AccordionItem value={`part-${partIndex}`} className="border-none">
                                                    <AccordionTrigger className="px-4 py-2 hover:no-underline">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="font-semibold">{part.label || `Part ${partIndex + 1}`}</span>
                                                            <span className="text-neutral-500 truncate max-w-[300px]">
                                                                {part.contentBlocks?.find(b => b.type === "text")?.content || part.questionText || "(No content)"}
                                                            </span>
                                                            <span className="text-xs text-neutral-400">({part.maxMarks} marks)</span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-4 pb-4 space-y-3">
                                                        <div className="flex justify-end">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                onClick={() => removeSubPart(index, partIndex)}
                                                            >
                                                                <Trash2 className="h-3 w-3 mr-1" /> Remove
                                                            </Button>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Label</Label>
                                                                <Input 
                                                                    value={part.label || ""} 
                                                                    onChange={(e) => updateSubPart(index, partIndex, "label", e.target.value)}
                                                                    placeholder="(i)"
                                                                    className="h-8"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Marks</Label>
                                                                <Input 
                                                                    type="number"
                                                                    value={part.maxMarks} 
                                                                    onChange={(e) => updateSubPart(index, partIndex, "maxMarks", parseInt(e.target.value) || 0)}
                                                                    className="h-8"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Input Style</Label>
                                                                <Select 
                                                                    value={part.inputStyle || "text"} 
                                                                    onValueChange={(val: any) => {
                                                                        updateSubPart(index, partIndex, "inputStyle", val);
                                                                        if (val === "info-only") {
                                                                            updateSubPart(index, partIndex, "maxMarks", 0);
                                                                        }
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="info-only">Info Only (No Input)</SelectItem>
                                                                        <SelectItem value="text">Text Area</SelectItem>
                                                                        <SelectItem value="code-editor">Code Editor</SelectItem>
                                                                        <SelectItem value="design-choice">Design Choice</SelectItem>
                                                                        <SelectItem value="drawing">Drawing</SelectItem>
                                                                        <SelectItem value="table">Table</SelectItem>
                                                                        <SelectItem value="labeled-inputs">Labeled Inputs</SelectItem>
                                                                        <SelectItem value="fill-in-blanks">Fill in the Blanks</SelectItem>
                                                                        <SelectItem value="erd-annotation">ERD Annotation</SelectItem>
                                                                        <SelectItem value="nav-structure">Navigation Diagram (N5)</SelectItem>
                                                                        <SelectItem value="nav-structure-higher">Navigation Diagram (Higher)</SelectItem>
                                                                        <SelectItem value="tag-matching">Tag Matching</SelectItem>
                                                                        <SelectItem value="structure-dataflow">Structure Diagram (Dataflow)</SelectItem>
                                                                        <SelectItem value="form-wireframe">Form Wireframe</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Question Content - Content Blocks */}
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Question Content</p>
                                                            
                                                            {/* Render content blocks in order */}
                                                            {(part.contentBlocks && part.contentBlocks.length > 0) ? (
                                                                <div className="space-y-2">
                                                                    {part.contentBlocks.map((block: ContentBlock, blockIndex: number) => (
                                                                        <div key={block.id} className="p-2 bg-white dark:bg-neutral-800 rounded border">
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    {block.type === "text" && <Type className="h-3 w-3 text-neutral-500" />}
                                                                                    {block.type === "image" && <Image className="h-3 w-3 text-neutral-500" />}
                                                                                    {block.type === "code" && <Code className="h-3 w-3 text-neutral-500" />}
                                                                                    {block.type === "code-table" && <Table className="h-3 w-3 text-neutral-500" />}
                                                                                    <Label className="text-xs font-medium capitalize">{block.type === "code-table" ? "Code Table" : block.type}</Label>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-5 px-1"
                                                                                        onClick={() => moveSubPartContentBlock(index, partIndex, blockIndex, "up")}
                                                                                        disabled={blockIndex === 0}
                                                                                        type="button"
                                                                                    >
                                                                                        <MoveUp className="h-2.5 w-2.5" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-5 px-1"
                                                                                        onClick={() => moveSubPartContentBlock(index, partIndex, blockIndex, "down")}
                                                                                        disabled={blockIndex === (part.contentBlocks?.length || 0) - 1}
                                                                                        type="button"
                                                                                    >
                                                                                        <MoveDown className="h-2.5 w-2.5" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-5 px-1 text-red-500 hover:text-red-600"
                                                                                        onClick={() => removeSubPartContentBlock(index, partIndex, blockIndex)}
                                                                                        type="button"
                                                                                    >
                                                                                        <Trash2 className="h-2.5 w-2.5" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {block.type === "text" && (
                                                                                <Textarea 
                                                                                    value={block.content} 
                                                                                    onChange={(e) => updateSubPartContentBlock(index, partIndex, blockIndex, "content", e.target.value)}
                                                                                    placeholder="Enter text content..."
                                                                                    rows={2}
                                                                                    className="text-xs"
                                                                                />
                                                                            )}
                                                                            
                                                                            {block.type === "image" && (
                                                                                <div className="space-y-2">
                                                                                    <div className="flex gap-2">
                                                                                        <Input
                                                                                            placeholder="Paste image URL or upload"
                                                                                            value={block.content}
                                                                                            onChange={(e) => updateSubPartContentBlock(index, partIndex, blockIndex, "content", e.target.value)}
                                                                                            className="flex-1 h-7 text-xs"
                                                                                        />
                                                                                        <div className="relative">
                                                                                            <input
                                                                                                type="file"
                                                                                                accept="image/*"
                                                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                                                onChange={(e) => handleSubPartContentBlockImageUpload(e, index, partIndex, blockIndex)}
                                                                                            />
                                                                                            <Button variant="outline" size="sm" type="button" className="h-7">
                                                                                                <Upload className="h-3 w-3" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    </div>
                                                                                    {block.content && (
                                                                                        <img src={block.content} alt={block.caption || "Preview"} className="max-h-24 object-contain rounded border" />
                                                                                    )}
                                                                                    <Input
                                                                                        placeholder="Caption (optional)"
                                                                                        value={block.caption || ""}
                                                                                        onChange={(e) => updateSubPartContentBlock(index, partIndex, blockIndex, "caption", e.target.value)}
                                                                                        className="h-7 text-xs"
                                                                                    />
                                                                                    <Select
                                                                                        value={block.imageSize || "medium"}
                                                                                        onValueChange={(val) => updateSubPartContentBlock(index, partIndex, blockIndex, "imageSize", val)}
                                                                                    >
                                                                                        <SelectTrigger className="w-24 h-7 text-xs">
                                                                                            <SelectValue placeholder="Size" />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="xs">XS</SelectItem>
                                                                                            <SelectItem value="small">Small</SelectItem>
                                                                                            <SelectItem value="medium">Medium</SelectItem>
                                                                                            <SelectItem value="large">Large</SelectItem>
                                                                                            <SelectItem value="xl">XL</SelectItem>
                                                                                            <SelectItem value="2xl">2XL</SelectItem>
                                                                                            <SelectItem value="full">Full</SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                </div>
                                                                            )}
                                                                            
                                                                            {block.type === "code" && (
                                                                                <Textarea 
                                                                                    value={block.content} 
                                                                                    onChange={(e) => updateSubPartContentBlock(index, partIndex, blockIndex, "content", e.target.value)}
                                                                                    placeholder="// Enter code here..."
                                                                                    className="min-h-[60px] font-mono text-xs bg-neutral-900 text-neutral-100 border-neutral-700"
                                                                                />
                                                                            )}
                                                                            
                                                                            {block.type === "code-table" && (
                                                                                <div className="space-y-2">
                                                                                    {block.codeSections?.map((section, sectionIndex) => (
                                                                                        <div key={section.id} className="border rounded overflow-hidden">
                                                                                            <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-700 px-2 py-1">
                                                                                                <Input
                                                                                                    value={section.label}
                                                                                                    onChange={(e) => updateSubPartCodeSection(index, partIndex, blockIndex, sectionIndex, "label", e.target.value)}
                                                                                                    className="flex-1 h-6 text-xs font-medium"
                                                                                                    placeholder="Section label"
                                                                                                />
                                                                                                <Button
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    className="h-6 w-6 p-0 text-red-500"
                                                                                                    onClick={() => removeSubPartCodeSection(index, partIndex, blockIndex, sectionIndex)}
                                                                                                    disabled={(block.codeSections?.length || 0) <= 1}
                                                                                                >
                                                                                                    <Trash2 className="h-2.5 w-2.5" />
                                                                                                </Button>
                                                                                            </div>
                                                                                            <Textarea
                                                                                                className="font-mono text-xs bg-neutral-900 text-neutral-100 border-0 rounded-none"
                                                                                                value={section.code}
                                                                                                onChange={(e) => updateSubPartCodeSection(index, partIndex, blockIndex, sectionIndex, "code", e.target.value)}
                                                                                                rows={2}
                                                                                                placeholder="Enter code here..."
                                                                                            />
                                                                                        </div>
                                                                                    ))}
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        onClick={() => addSubPartCodeSection(index, partIndex, blockIndex)}
                                                                                        type="button"
                                                                                        className="h-6 text-xs"
                                                                                    >
                                                                                        <Plus className="h-2.5 w-2.5 mr-1" /> Add Section
                                                                                    </Button>
                                                                                </div>
                                                                            )}

                                                                            {block.type === "data-table" && block.dataTable && (
                                                                                <div className="space-y-2">
                                                                                    <ResponsiveDataTable dataTable={block.dataTable} />
                                                                                    <div className="flex justify-center">
                                                                                      <Button
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        onClick={() => {
                                                                                          setEditingDataTable({ type: "subPart", blockIndex, subIndex: index, partIndex });
                                                                                          setDataTableModalOpen(true);
                                                                                        }}
                                                                                        type="button"
                                                                                        className="h-6 text-xs"
                                                                                      >
                                                                                        <Table className="h-2.5 w-2.5 mr-1" /> Edit Table
                                                                                      </Button>
                                                                                    </div>
                                                                                    <p className="text-xs text-center text-neutral-500">
                                                                                      {block.dataTable.columns.length} columns, {block.dataTable.rows.length} rows
                                                                                    </p>
                                                                                </div>
                                                                            )}

                                                                            {block.type === "database-schema" && (
                                                                                <div className="space-y-2">
                                                                                    <DatabaseSchemaEditor
                                                                                        value={block.databaseSchema}
                                                                                        onChange={(schema) => updateSubPartContentBlockDatabaseSchema(index, partIndex, blockIndex, schema)}
                                                                                    />
                                                                                    {block.databaseSchema && block.databaseSchema.tables.length > 0 && (
                                                                                        <div className="border-t pt-2">
                                                                                            <p className="text-xs text-neutral-500 mb-1">Preview:</p>
                                                                                            <div className="p-2 bg-white dark:bg-neutral-800 rounded border">
                                                                                                <DatabaseSchemaDisplay schema={block.databaseSchema} />
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                /* Legacy content migration notice */
                                                                (part.questionText || part.imageUrl || part.codeSnippet) ? (
                                                                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                                                                        <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                                                                            This uses the legacy format. Add content blocks below to upgrade.
                                                                        </p>
                                                                        {part.questionText && <p className="text-xs mb-1"><strong>Text:</strong> {part.questionText}</p>}
                                                                        {part.imageUrl && <img src={part.imageUrl} alt="Legacy" className="max-h-16 mt-1" />}
                                                                        {part.codeSnippet && <pre className="text-xs bg-neutral-900 text-neutral-100 p-1 rounded mt-1 overflow-x-auto">{part.codeSnippet}</pre>}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-xs text-neutral-400 italic">No content blocks yet. Add text, images, or code below.</p>
                                                                )
                                                            )}
                                                            
                                                            {/* Add Content Block Buttons */}
                                                            <div className="flex flex-wrap gap-1 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-700">
                                                                <span className="text-xs text-neutral-400 mr-1 self-center">Add:</span>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => addSubPartContentBlock(index, partIndex, "text")}
                                                                    type="button"
                                                                    className="h-6 text-xs"
                                                                >
                                                                    <Type className="h-2.5 w-2.5 mr-1" /> Text
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => addSubPartContentBlock(index, partIndex, "image")}
                                                                    type="button"
                                                                    className="h-6 text-xs"
                                                                >
                                                                    <Image className="h-2.5 w-2.5 mr-1" /> Image
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => addSubPartContentBlock(index, partIndex, "code")}
                                                                    type="button"
                                                                    className="h-6 text-xs"
                                                                >
                                                                    <Code className="h-2.5 w-2.5 mr-1" /> Code
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => addSubPartContentBlock(index, partIndex, "code-table")}
                                                                    type="button"
                                                                    className="h-6 text-xs"
                                                                >
                                                                    <Table className="h-2.5 w-2.5 mr-1" /> Code Table
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => addSubPartContentBlock(index, partIndex, "data-table")}
                                                                    type="button"
                                                                    className="h-6 text-xs"
                                                                >
                                                                    <Table className="h-2.5 w-2.5 mr-1" /> Data Table
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => addSubPartContentBlock(index, partIndex, "database-schema")}
                                                                    type="button"
                                                                    className="h-6 text-xs"
                                                                >
                                                                    <Database className="h-2.5 w-2.5 mr-1" /> DB Schema
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Code Editor Configuration - Starter Code for Sub-Parts */}
                                                        {part.inputStyle === "code-editor" && (
                                                          <div className="space-y-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-full">
                                                            <Label className="text-xs font-semibold">Starter Code (Optional)</Label>
                                                            <p className="text-xs text-neutral-500">Pre-filled code students will complete.</p>
                                                            <Textarea
                                                              value={part.inputConfig?.starterCode || ""}
                                                              onChange={(e) => {
                                                                const newConfig = { ...part.inputConfig, starterCode: e.target.value };
                                                                updateSubPart(index, partIndex, "inputConfig", newConfig);
                                                              }}
                                                              placeholder="# Enter starter code here..."
                                                              className="font-mono text-xs min-h-[100px] bg-neutral-900 text-neutral-100"
                                                            />
                                                          </div>
                                                        )}

                                                        {/* Table Configuration for Sub-Parts */}
                                                        {part.inputStyle === "table" && (
                                                          <div className="space-y-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                                            <Label className="text-xs font-semibold">Table Configuration</Label>
                                                            
                                                            {!part.inputConfig?.grid && (
                                                              <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={() => initSubPartGridTable(index, partIndex)}
                                                              >
                                                                <Plus className="w-3 h-3 mr-1" /> Create Table Grid
                                                              </Button>
                                                            )}
                                                            
                                                            {part.inputConfig?.grid && (
                                                              <>
                                                                <p className="text-xs text-neutral-500">Set cell values and mark which are input fields</p>
                                                                <div className="overflow-x-auto">
                                                                  <table className="border-collapse text-xs">
                                                                    <thead>
                                                                      <tr>
                                                                        <th className="border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-200 dark:bg-neutral-700 w-8"></th>
                                                                        {part.inputConfig.grid.headers.map((header, colIdx) => (
                                                                          <th key={colIdx} className="border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-200 dark:bg-neutral-700">
                                                                            <div className="flex items-center gap-1">
                                                                              <Input 
                                                                                value={header}
                                                                                onChange={(e) => updateSubPartGridHeader(index, partIndex, colIdx, e.target.value)}
                                                                                className="h-6 text-xs min-w-[60px]"
                                                                              />
                                                                              <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="h-5 w-5 p-0 text-red-500"
                                                                                onClick={() => removeSubPartGridColumn(index, partIndex, colIdx)}
                                                                              >
                                                                                <Trash2 className="w-2 h-2" />
                                                                              </Button>
                                                                            </div>
                                                                          </th>
                                                                        ))}
                                                                        <th className="border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-200 dark:bg-neutral-700">
                                                                          <Button size="sm" variant="ghost" onClick={() => addSubPartGridColumn(index, partIndex)} className="h-5 px-1">
                                                                            <Plus className="w-2 h-2" />
                                                                          </Button>
                                                                        </th>
                                                                      </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                      {part.inputConfig.grid.rows.map((row, rowIdx) => (
                                                                        <tr key={rowIdx}>
                                                                          <td className="border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-100 dark:bg-neutral-800">
                                                                            <Button
                                                                              size="sm"
                                                                              variant="ghost"
                                                                              className="h-5 w-5 p-0 text-red-500"
                                                                              onClick={() => removeSubPartGridRow(index, partIndex, rowIdx)}
                                                                            >
                                                                              <Trash2 className="w-2 h-2" />
                                                                            </Button>
                                                                          </td>
                                                                          {row.cells.map((cell, cellIdx) => (
                                                                            <td 
                                                                              key={cellIdx} 
                                                                              className={`border border-neutral-300 dark:border-neutral-600 p-1 ${cell.isInput ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                                                                            >
                                                                              <div className="flex items-center gap-1">
                                                                                <Input 
                                                                                  value={cell.value || ""}
                                                                                  onChange={(e) => updateSubPartGridCell(index, partIndex, rowIdx, cellIdx, "value", e.target.value)}
                                                                                  placeholder={cell.isInput ? "Input" : "Fixed"}
                                                                                  className={`h-6 text-xs flex-1 min-w-[60px] ${cell.isInput ? 'border-blue-400' : ''}`}
                                                                                />
                                                                                <label className="flex items-center cursor-pointer shrink-0" title="Input field">
                                                                                  <input 
                                                                                    type="checkbox"
                                                                                    checked={cell.isInput || false}
                                                                                    onChange={(e) => updateSubPartGridCell(index, partIndex, rowIdx, cellIdx, "isInput", e.target.checked)}
                                                                                    className="w-2 h-2"
                                                                                  />
                                                                                </label>
                                                                                {cell.isInput && (
                                                                                  <label className="flex items-center cursor-pointer shrink-0 ml-1" title="Multi-line">
                                                                                    <input 
                                                                                      type="checkbox"
                                                                                      checked={cell.multiline || false}
                                                                                      onChange={(e) => updateSubPartGridCell(index, partIndex, rowIdx, cellIdx, "multiline", e.target.checked)}
                                                                                      className="w-2 h-2"
                                                                                    />
                                                                                    <span className="text-[10px] ml-0.5">ML</span>
                                                                                  </label>
                                                                                )}
                                                                              </div>
                                                                            </td>
                                                                          ))}
                                                                          <td className="border border-neutral-300 dark:border-neutral-600 p-1"></td>
                                                                        </tr>
                                                                      ))}
                                                                      <tr>
                                                                        <td className="border border-neutral-300 dark:border-neutral-600 p-1 bg-neutral-100 dark:bg-neutral-800">
                                                                          <Button size="sm" variant="ghost" onClick={() => addSubPartGridRow(index, partIndex)} className="h-5 px-1">
                                                                            <Plus className="w-2 h-2" />
                                                                          </Button>
                                                                        </td>
                                                                        <td colSpan={part.inputConfig.grid.headers.length + 1} className="border border-neutral-300 dark:border-neutral-600 p-1 text-xs text-neutral-400">
                                                                          Add row
                                                                        </td>
                                                                      </tr>
                                                                    </tbody>
                                                                  </table>
                                                                </div>
                                                                
                                                                <Button 
                                                                  size="sm" 
                                                                  variant="ghost" 
                                                                  className="text-neutral-500 text-xs"
                                                                  onClick={() => updateSubPart(index, partIndex, "inputConfig", undefined)}
                                                                >
                                                                  Clear table
                                                                </Button>
                                                              </>
                                                            )}
                                                          </div>
                                                        )}

                                                        {/* Labeled Inputs Configuration for Sub-Parts */}
                                                        {part.inputStyle === "labeled-inputs" && (
                                                          <div className="space-y-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                                            <Label className="text-xs font-semibold">Labeled Inputs Configuration</Label>
                                                            
                                                            {!part.inputConfig?.fields && (
                                                              <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={() => initSubPartLabeledInputs(index, partIndex)}
                                                              >
                                                                <Plus className="w-3 h-3 mr-1" /> Initialize Fields
                                                              </Button>
                                                            )}
                                                            
                                                            {part.inputConfig?.fields && (
                                                              <>
                                                                <div className="space-y-2">
                                                                  {part.inputConfig.fields.map((field, fieldIndex) => (
                                                                    <div key={fieldIndex} className="flex gap-2 items-center">
                                                                      <Input 
                                                                        placeholder="Label"
                                                                        value={field.label}
                                                                        onChange={(e) => updateSubPartLabeledField(index, partIndex, fieldIndex, "label", e.target.value)}
                                                                        className="flex-1 h-7 text-xs"
                                                                      />
                                                                      <Input 
                                                                        placeholder="Key"
                                                                        value={field.key}
                                                                        onChange={(e) => updateSubPartLabeledField(index, partIndex, fieldIndex, "key", e.target.value)}
                                                                        className="flex-1 h-7 text-xs"
                                                                      />
                                                                      <Button 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        className="text-red-500 px-1 h-6"
                                                                        onClick={() => removeSubPartLabeledField(index, partIndex, fieldIndex)}
                                                                      >
                                                                        <Trash2 className="w-3 h-3" />
                                                                      </Button>
                                                                    </div>
                                                                  ))}
                                                                  <Button size="sm" variant="outline" onClick={() => addSubPartLabeledField(index, partIndex)}>
                                                                    <Plus className="w-3 h-3 mr-1" /> Add Field
                                                                  </Button>
                                                                </div>
                                                              </>
                                                            )}
                                                          </div>
                                                        )}

                                                        {/* Fill-in-Blanks Configuration for Sub-Parts */}
                                                        {part.inputStyle === "fill-in-blanks" && (
                                                          <div className="space-y-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                                            <Label className="text-xs font-semibold">Fill in the Blanks Configuration</Label>
                                                            <p className="text-xs text-neutral-500">Use {"{{blank_1}}"}, {"{{blank_2}}"}, etc. as placeholders.</p>
                                                            
                                                            <div>
                                                              <Label className="text-xs">Code Template</Label>
                                                              <Textarea
                                                                value={part.inputConfig?.codeTemplate || ""}
                                                                onChange={(e) => {
                                                                  const newConfig = { ...part.inputConfig, codeTemplate: e.target.value };
                                                                  updateSubPart(index, partIndex, "inputConfig", newConfig);
                                                                }}
                                                                placeholder="Enter code with {{blank_1}}, {{blank_2}} placeholders..."
                                                                className="font-mono text-xs min-h-[100px]"
                                                              />
                                                            </div>

                                                            <div className="space-y-2">
                                                              <div className="flex justify-between items-center">
                                                                <Label className="text-xs">Blanks (Answers)</Label>
                                                                <Button
                                                                  size="sm"
                                                                  variant="outline"
                                                                  onClick={() => {
                                                                    const blanks = part.inputConfig?.blanks || [];
                                                                    const newBlank = { key: `blank_${blanks.length + 1}`, answer: "", hint: "" };
                                                                    updateSubPart(index, partIndex, "inputConfig", { ...part.inputConfig, blanks: [...blanks, newBlank] });
                                                                  }}
                                                                >
                                                                  <Plus className="h-3 w-3 mr-1" /> Add Blank
                                                                </Button>
                                                              </div>
                                                              
                                                              {(part.inputConfig?.blanks || []).map((blank, blankIdx) => (
                                                                <div key={blankIdx} className="flex gap-2 items-center bg-white dark:bg-neutral-700 p-2 rounded border">
                                                                  <span className="text-xs font-mono text-neutral-500 w-14">{`{{${blank.key}}}`}</span>
                                                                  <Input
                                                                    value={blank.answer}
                                                                    onChange={(e) => {
                                                                      const blanks = [...(part.inputConfig?.blanks || [])];
                                                                      blanks[blankIdx] = { ...blanks[blankIdx], answer: e.target.value };
                                                                      updateSubPart(index, partIndex, "inputConfig", { ...part.inputConfig, blanks });
                                                                    }}
                                                                    placeholder="Correct answer"
                                                                    className="flex-1 h-7 text-xs"
                                                                  />
                                                                  <Input
                                                                    value={blank.hint || ""}
                                                                    onChange={(e) => {
                                                                      const blanks = [...(part.inputConfig?.blanks || [])];
                                                                      blanks[blankIdx] = { ...blanks[blankIdx], hint: e.target.value };
                                                                      updateSubPart(index, partIndex, "inputConfig", { ...part.inputConfig, blanks });
                                                                    }}
                                                                    placeholder="Hint"
                                                                    className="w-20 h-7 text-xs"
                                                                  />
                                                                  <Input
                                                                    type="number"
                                                                    value={blank.width || 80}
                                                                    onChange={(e) => {
                                                                      const blanks = [...(part.inputConfig?.blanks || [])];
                                                                      blanks[blankIdx] = { ...blanks[blankIdx], width: parseInt(e.target.value) || 80 };
                                                                      updateSubPart(index, partIndex, "inputConfig", { ...part.inputConfig, blanks });
                                                                    }}
                                                                    placeholder="Width"
                                                                    className="w-16 h-7 text-xs"
                                                                    min={40}
                                                                    max={300}
                                                                  />
                                                                  <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                      const blanks = (part.inputConfig?.blanks || []).filter((_, i) => i !== blankIdx);
                                                                      updateSubPart(index, partIndex, "inputConfig", { ...part.inputConfig, blanks });
                                                                    }}
                                                                  >
                                                                    <Trash2 className="h-3 w-3 text-red-500" />
                                                                  </Button>
                                                                </div>
                                                              ))}
                                                            </div>
                                                          </div>
                                                        )}

                                                        {/* ERD Annotation Configuration for Sub-Parts */}
                                                        {part.inputStyle === "erd-annotation" && (
                                                          <div className="space-y-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                                            <div>
                                                              <Label className="text-xs font-semibold">Draw the ERD Diagram</Label>
                                                              <p className="text-xs text-neutral-500 mt-1">
                                                                Draw your ERD using ellipses for attributes. Students will mark attributes as Primary Key (underline) or Foreign Key (star).
                                                              </p>
                                                            </div>
                                                            
                                                            <DiagramEditor
                                                              initialData={part.inputConfig?.baseErdDiagram || ""}
                                                              onChange={(data) => {
                                                                updateSubPart(index, partIndex, "inputConfig", {
                                                                  ...part.inputConfig,
                                                                  baseErdDiagram: data
                                                                });
                                                              }}
                                                              mode="database"
                                                              allowBaseItemDeletion={true}
                                                            />
                                                            
                                                            <div className="border-t pt-3">
                                                              <div className="flex justify-between items-center mb-2">
                                                                <Label className="text-xs font-semibold">Mark Correct Answers</Label>
                                                                <Button size="sm" variant="outline" onClick={() => {
                                                                  try {
                                                                    const items: DiagramItem[] = JSON.parse(part.inputConfig?.baseErdDiagram || "[]");
                                                                    const ellipses = items.filter(i => i.type === "ellipse" && i.content);
                                                                    const newAttrs = ellipses.map(e => ({
                                                                      id: e.id,
                                                                      entityName: "",
                                                                      attributeName: e.content || "",
                                                                      correctMarking: "none" as const
                                                                    }));
                                                                    updateSubPart(index, partIndex, "inputConfig", {
                                                                      ...part.inputConfig,
                                                                      erdAttributes: newAttrs
                                                                    });
                                                                  } catch (e) {
                                                                    console.error("Failed to parse diagram", e);
                                                                  }
                                                                }}>
                                                                  <Plus className="w-3 h-3 mr-1" /> Detect Attributes
                                                                </Button>
                                                              </div>
                                                              <p className="text-xs text-neutral-500 mb-2">
                                                                Specify which attributes should be marked as Primary Key or Foreign Key.
                                                              </p>
                                                              
                                                              {part.inputConfig?.erdAttributes && part.inputConfig.erdAttributes.length > 0 && (
                                                                <div className="space-y-2">
                                                                  <div className="grid grid-cols-12 gap-1 text-xs font-medium text-neutral-500 px-1">
                                                                    <div className="col-span-5">Attribute (from diagram)</div>
                                                                    <div className="col-span-6">Correct Marking</div>
                                                                    <div className="col-span-1"></div>
                                                                  </div>
                                                                  {part.inputConfig.erdAttributes.map((attr, attrIndex) => (
                                                                    <div key={attrIndex} className="grid grid-cols-12 gap-1 items-center">
                                                                      <div className="col-span-5 text-xs px-2 py-1 bg-white dark:bg-neutral-900 rounded border">
                                                                        {attr.attributeName || "(empty)"}
                                                                      </div>
                                                                      <Select 
                                                                        value={attr.correctMarking} 
                                                                        onValueChange={(val) => updateSubPartErdAttribute(index, partIndex, attrIndex, "correctMarking", val)}
                                                                      >
                                                                        <SelectTrigger className="col-span-6 h-7 text-xs">
                                                                          <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                          <SelectItem value="none">None (no marking needed)</SelectItem>
                                                                          <SelectItem value="primary">Primary Key (underline)</SelectItem>
                                                                          <SelectItem value="foreign">Foreign Key (star)</SelectItem>
                                                                        </SelectContent>
                                                                      </Select>
                                                                      <Button 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        className="col-span-1 text-red-500 px-1 h-6"
                                                                        onClick={() => removeSubPartErdAttribute(index, partIndex, attrIndex)}
                                                                      >
                                                                        <Trash2 className="w-2 h-2" />
                                                                      </Button>
                                                                    </div>
                                                                  ))}
                                                                </div>
                                                              )}
                                                            </div>
                                                          </div>
                                                        )}

                                                        {/* Navigation Diagram Configuration for Sub-Parts */}
                                                        {part.inputStyle === "nav-structure" && (
                                                          <div className="space-y-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                                            <div>
                                                              <Label className="text-xs font-semibold">Starting Diagram (Optional)</Label>
                                                              <p className="text-xs text-neutral-500 mt-1">
                                                                Draw a starting navigation diagram that students will complete. Leave empty if students should create from scratch.
                                                              </p>
                                                            </div>
                                                            
                                                            <DiagramEditor
                                                              initialData={part.inputConfig?.baseNavDiagram || ""}
                                                              onChange={(data) => {
                                                                updateSubPart(index, partIndex, "inputConfig", {
                                                                  ...part.inputConfig,
                                                                  baseNavDiagram: data
                                                                });
                                                              }}
                                                              mode="nav-structure"
                                                            />
                                                          </div>
                                                        )}

                                                        {/* Tag Matching Configuration for Sub-Parts */}
                                                        {part.inputStyle === "tag-matching" && (
                                                          <div className="space-y-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                                            <div>
                                                              <Label className="text-xs font-semibold">Tag Matching Setup</Label>
                                                              <p className="text-xs text-neutral-500 mt-1">
                                                                Add tags and draw target zones. Upload background image in parent question first.
                                                              </p>
                                                            </div>
                                                            
                                                            <TagMatchingEditor
                                                              mode="edit"
                                                              backgroundUrl={formData.subQuestions[index]?.drawingBackgroundUrl}
                                                              sourceTags={part.inputConfig?.tagMatchingConfig?.sourceTags || []}
                                                              targetZones={part.inputConfig?.tagMatchingConfig?.targetZones || []}
                                                              onChange={(tags: SourceTag[], zones: TargetZone[]) => {
                                                                updateSubPart(index, partIndex, "inputConfig", {
                                                                  ...part.inputConfig,
                                                                  tagMatchingConfig: { sourceTags: tags, targetZones: zones }
                                                                });
                                                              }}
                                                            />
                                                          </div>
                                                        )}

                                                        {/* Form Wireframe Configuration for Sub-Parts */}
                                                        {part.inputStyle === "form-wireframe" && (
                                                          <div className="space-y-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                            <div className="flex justify-between items-center flex-wrap gap-2">
                                                              <Label className="text-xs font-semibold">Expected Form Elements (for AI grading)</Label>
                                                              <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={() => {
                                                                  const current = part.inputConfig?.formWireframeExpectations || [];
                                                                  updateSubPart(index, partIndex, "inputConfig", {
                                                                    ...(part.inputConfig || {}),
                                                                    formWireframeExpectations: [...current, { fieldType: "text-input", labelText: "" }]
                                                                  });
                                                                }}
                                                              >
                                                                <Plus className="w-3 h-3 mr-1" /> Add Expected Element
                                                              </Button>
                                                            </div>
                                                            <p className="text-xs text-neutral-500">Specify what form elements students should include. The AI will check for these when grading.</p>
                                                            
                                                            {part.inputConfig?.formWireframeExpectations?.map((expectation: any, expIdx: number) => (
                                                              <div key={expIdx} className="flex gap-2 items-start flex-wrap p-2 bg-white dark:bg-neutral-900 rounded border">
                                                                <div className="flex-1 min-w-[120px]">
                                                                  <Label className="text-xs">Type</Label>
                                                                  <Select
                                                                    value={expectation.fieldType}
                                                                    onValueChange={(val) => {
                                                                      const updated = [...(part.inputConfig?.formWireframeExpectations || [])];
                                                                      updated[expIdx] = { ...updated[expIdx], fieldType: val as any };
                                                                      updateSubPart(index, partIndex, "inputConfig", {
                                                                        ...(part.inputConfig || {}),
                                                                        formWireframeExpectations: updated
                                                                      });
                                                                    }}
                                                                  >
                                                                    <SelectTrigger className="h-8 text-xs">
                                                                      <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                      <SelectItem value="label">Label</SelectItem>
                                                                      <SelectItem value="text-input">Text Input</SelectItem>
                                                                      <SelectItem value="textarea">Textarea</SelectItem>
                                                                      <SelectItem value="dropdown">Dropdown</SelectItem>
                                                                      <SelectItem value="radio">Radio Button</SelectItem>
                                                                      <SelectItem value="checkbox">Checkbox</SelectItem>
                                                                      <SelectItem value="submit">Submit Button</SelectItem>
                                                                    </SelectContent>
                                                                  </Select>
                                                                </div>
                                                                <div className="flex-[2] min-w-[150px]">
                                                                  <Label className="text-xs">Label Text (fuzzy match)</Label>
                                                                  <Input 
                                                                    value={expectation.labelText || ""}
                                                                    onChange={(e) => {
                                                                      const updated = [...(part.inputConfig?.formWireframeExpectations || [])];
                                                                      updated[expIdx] = { ...updated[expIdx], labelText: e.target.value };
                                                                      updateSubPart(index, partIndex, "inputConfig", {
                                                                        ...(part.inputConfig || {}),
                                                                        formWireframeExpectations: updated
                                                                      });
                                                                    }}
                                                                    placeholder="e.g., Name, Email, Phone..."
                                                                    className="h-8 text-xs"
                                                                  />
                                                                </div>
                                                                <div className="shrink-0 flex items-center gap-1">
                                                                  <label className="flex items-center gap-1 text-xs cursor-pointer mt-4">
                                                                    <input 
                                                                      type="checkbox"
                                                                      checked={expectation.required || false}
                                                                      onChange={(e) => {
                                                                        const updated = [...(part.inputConfig?.formWireframeExpectations || [])];
                                                                        updated[expIdx] = { ...updated[expIdx], required: e.target.checked };
                                                                        updateSubPart(index, partIndex, "inputConfig", {
                                                                          ...(part.inputConfig || {}),
                                                                          formWireframeExpectations: updated
                                                                        });
                                                                      }}
                                                                      className="w-3 h-3"
                                                                    />
                                                                    Required*
                                                                  </label>
                                                                  <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0 text-red-500 mt-4"
                                                                    onClick={() => {
                                                                      const updated = (part.inputConfig?.formWireframeExpectations || []).filter((_: any, i: number) => i !== expIdx);
                                                                      updateSubPart(index, partIndex, "inputConfig", {
                                                                        ...(part.inputConfig || {}),
                                                                        formWireframeExpectations: updated
                                                                      });
                                                                    }}
                                                                  >
                                                                    <Trash2 className="w-3 h-3" />
                                                                  </Button>
                                                                </div>
                                                              </div>
                                                            ))}
                                                          </div>
                                                        )}
                                                        
                                                        {/* Marking fields - hidden for info-only sub-parts */}
                                                        {part.inputStyle !== "info-only" && (
                                                        <>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Marking Scheme (One per line)</Label>
                                                            <Textarea 
                                                                value={part.markingScheme.join("\n")} 
                                                                onChange={(e) => updateSubPart(index, partIndex, "markingScheme", e.target.value.split("\n"))}
                                                                rows={2}
                                                            />
                                                        </div>
                                                        
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Keywords (Comma separated)</Label>
                                                            <Input 
                                                                value={part.keywords?.join(", ") || ""} 
                                                                onChange={(e) => updateSubPart(index, partIndex, "keywords", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                                                className="h-8"
                                                            />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label className="text-xs">AI Marking Guidance (Optional)</Label>
                                                            <Textarea 
                                                                value={part.aiGuidance || ""} 
                                                                onChange={(e) => updateSubPart(index, partIndex, "aiGuidance", e.target.value)}
                                                                placeholder="e.g. Do not accept 'while loop' as an answer."
                                                                rows={2}
                                                            />
                                                        </div>
                                                        </>
                                                        )}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                            
                                            {/* Insert sub-part button */}
                                            <div className="flex justify-center my-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-6 text-xs text-neutral-400 hover:text-neutral-600"
                                                    onClick={() => insertSubPartAfter(index, partIndex)}
                                                >
                                                    <PlusCircle className="h-3 w-3 mr-1" /> Insert sub-question here
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-neutral-400 ml-4">No sub-questions. Use sub-questions for parts like (a)(i), (a)(ii), etc.</p>
                            )}
                        </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
            </Accordion>

            {formData.subQuestions.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg text-neutral-400">
                    No questions added yet. Click "Add Question" to get started.
                </div>
            )}
        </div>
      </main>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Preview</DialogTitle>
          </DialogHeader>
          
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                {formData.isAdditionalExam ? "Additional Exam" : formData.year}
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {formData.title}
              </h2>
            </div>

            {/* Scenario Section */}
            {formData.scenario && (formData.scenario.contentBlocks?.length || formData.scenario.text || formData.scenario.imageUrl || formData.scenario.codeSnippet) && (
              <div className="mb-8 p-6 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Scenario</div>
                {formData.scenario.contentBlocks && formData.scenario.contentBlocks.length > 0 ? (
                  <div className="space-y-4">
                    {formData.scenario.contentBlocks.map((block: ContentBlock) => (
                      <div key={block.id}>
                        {block.type === "text" && (
                          <div className={cn(
                            "text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap",
                            block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left",
                            block.hasBorder && "border border-neutral-300 dark:border-neutral-700 p-3 rounded",
                            block.hasBorder && block.borderWidth === 2 && "border-2",
                            block.hasBorder && block.borderWidth === 3 && "border-[3px]",
                            block.hasBorder && block.borderWidth === 4 && "border-4"
                          )}>
                            {block.content}
                          </div>
                        )}
                        {block.type === "image" && block.content && (
                          <div className={cn(
                            "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                            block.imageSize === "xs" && "max-w-[150px]",
                            block.imageSize === "small" && "max-w-xs",
                            block.imageSize === "medium" && "max-w-md",
                            block.imageSize === "large" && "max-w-xl",
                            block.imageSize === "xl" && "max-w-2xl",
                            block.imageSize === "2xl" && "max-w-4xl",
                            block.imageSize === "full" && "w-full",
                            !block.imageSize && "max-w-md"
                          )}>
                            {block.caption && <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-2">{block.caption}</p>}
                            <img src={block.content} alt={block.caption || "Scenario image"} className="max-w-full h-auto object-contain" />
                          </div>
                        )}
                        {block.type === "code" && (
                          <div className="bg-neutral-900 p-4 rounded-lg font-mono text-sm text-neutral-300 overflow-x-auto border border-neutral-800">
                            <pre>{block.content}</pre>
                          </div>
                        )}
                        {block.type === "code-table" && block.codeSections && (
                          <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                            {block.codeSections.map((section, sIdx) => (
                              <div key={section.id || sIdx}>
                                <div className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600">
                                  {section.label}
                                </div>
                                <div className="bg-white dark:bg-neutral-900 p-4 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0">
                                  {section.code}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {block.type === "data-table" && block.dataTable && (
                          <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                            <div className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono">
                              {block.dataTable.tableName}
                            </div>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-neutral-100 dark:bg-neutral-800">
                                  {block.dataTable.columns.map((col) => (
                                    <th key={col.id} className="px-4 py-2 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0">
                                      {col.header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {block.dataTable.rows.map((row) => (
                                  <tr key={row.id} className="border-t border-neutral-300 dark:border-neutral-700">
                                    {row.cells.map((cell, cellIndex) => {
                                      const cellRole = getCellRole(cell);
                                      const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                                      return (
                                        <CellTag 
                                          key={cellIndex} 
                                          className={cn(
                                            "px-4 py-2 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                                            cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                                            cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                                          )}
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
                        )}
                        {block.type === "row-layout" && block.children && (
                          <RowLayout>
                            {block.children.map((child: ContentBlock, childIdx: number) => (
                              <RowLayoutItem key={child.id || childIdx}>
                                {child.type === "text" && (
                                  <div className={`text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap ${child.textAlign === "center" ? "text-center" : child.textAlign === "right" ? "text-right" : "text-left"}`}>
                                    {child.content}
                                  </div>
                                )}
                                {child.type === "image" && child.content && (
                                  <div className="flex flex-col items-center">
                                    {child.caption && <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-2">{child.caption}</p>}
                                    <img src={child.content} alt={child.caption || "Image"} className="max-w-full h-auto object-contain rounded" />
                                  </div>
                                )}
                                {child.type === "code" && (
                                  <div className="bg-neutral-900 p-3 rounded-lg font-mono text-sm text-neutral-300 overflow-x-auto">
                                    <pre>{child.content}</pre>
                                  </div>
                                )}
                              </RowLayoutItem>
                            ))}
                          </RowLayout>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Legacy fallback */
                  <>
                    {formData.scenario.text && (
                      <div className="text-neutral-700 dark:text-neutral-300 mb-4 leading-relaxed whitespace-pre-wrap">
                        {formData.scenario.text}
                      </div>
                    )}
                    {formData.scenario.imageUrl && (
                      <div className="mb-4 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center mx-auto max-w-md">
                        <img src={formData.scenario.imageUrl} alt="Scenario Illustration" className="max-w-full h-auto max-h-[600px] object-contain" />
                      </div>
                    )}
                    {formData.scenario.preCodeText && (
                      <div className="mb-4 text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                        {formData.scenario.preCodeText}
                      </div>
                    )}
                    {formData.scenario.codeSnippet && (
                      <div className="bg-neutral-900 p-4 rounded-lg font-mono text-sm text-neutral-300 overflow-x-auto border border-neutral-800">
                        <pre>{formData.scenario.codeSnippet}</pre>
                      </div>
                    )}
                    {formData.scenario.postImageText && (
                      <div className="mt-4 text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                        {formData.scenario.postImageText}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Sub Questions Preview */}
            <div className="space-y-8">
              {formData.subQuestions.map((subQ) => (
                <div key={subQ.id} className="border-t border-neutral-100 dark:border-neutral-800 pt-6 first:border-0 first:pt-0">
                  <div className="flex items-start gap-3 mb-4">
                    {subQ.label && (
                      <span className="text-lg font-bold text-neutral-900 dark:text-white">
                        {subQ.label}
                      </span>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        {subQ.maxMarks > 0 && (
                          <span className="ml-auto inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                            {subQ.maxMarks} {subQ.maxMarks === 1 ? 'Mark' : 'Marks'}
                          </span>
                        )}
                      </div>

                      {/* Content blocks or legacy content */}
                      {subQ.contentBlocks && subQ.contentBlocks.length > 0 ? (
                        <div className="space-y-4 my-4">
                          {subQ.contentBlocks.map((block: ContentBlock) => (
                            <div key={block.id}>
                              {block.type === "text" && (
                                <div className={cn(
                                  "text-lg font-medium text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap",
                                  block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left",
                                  block.hasBorder && "border border-neutral-300 dark:border-neutral-700 p-3 rounded",
                                  block.hasBorder && block.borderWidth === 2 && "border-2",
                                  block.hasBorder && block.borderWidth === 3 && "border-[3px]",
                                  block.hasBorder && block.borderWidth === 4 && "border-4"
                                )}>
                                  {block.content}
                                </div>
                              )}
                              {block.type === "image" && block.content && (
                                <div className={cn(
                                  "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                                  block.imageSize === "small" && "max-w-xs",
                                  block.imageSize === "medium" && "max-w-md",
                                  block.imageSize === "large" && "max-w-2xl",
                                  block.imageSize === "full" && "w-full",
                                  !block.imageSize && "max-w-md"
                                )}>
                                  {block.caption && <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-2">{block.caption}</p>}
                                  <img src={block.content} alt={block.caption || "Question image"} className="max-w-full h-auto object-contain" />
                                </div>
                              )}
                              {block.type === "code" && (
                                <div className="p-4 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{block.content}</pre>
                                </div>
                              )}
                              {block.type === "code-table" && block.codeSections && (
                                <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                  {block.codeSections.map((section, sIdx) => (
                                    <div key={section.id || sIdx}>
                                      <div className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600">
                                        {section.label}
                                      </div>
                                      <div className="bg-white dark:bg-neutral-900 p-4 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0">
                                        {section.code}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {block.type === "data-table" && block.dataTable && (
                                <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                  <div className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono">
                                    {block.dataTable.tableName}
                                  </div>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-neutral-100 dark:bg-neutral-800">
                                        {block.dataTable.columns.map((col) => (
                                          <th key={col.id} className="px-4 py-2 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0">
                                            {col.header}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {block.dataTable.rows.map((row) => (
                                        <tr key={row.id} className="border-t border-neutral-300 dark:border-neutral-700">
                                          {row.cells.map((cell, cellIndex) => {
                                            if (isCellHidden(cell)) return null;
                                            const cellRole = getCellRole(cell);
                                            const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                                            const colSpan = getCellColSpan(cell);
                                            const rowSpan = getCellRowSpan(cell);
                                            return (
                                              <CellTag 
                                                key={cellIndex} 
                                                colSpan={colSpan > 1 ? colSpan : undefined}
                                                rowSpan={rowSpan > 1 ? rowSpan : undefined}
                                                className={cn(
                                                  "px-4 py-2 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                                                  cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                                                  cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                                                )}
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
                              )}
                              {block.type === "row-layout" && block.children && (
                                <RowLayout>
                                  {block.children.map((child: ContentBlock, childIdx: number) => (
                                    <RowLayoutItem key={child.id || childIdx}>
                                      {child.type === "text" && (
                                        <div className={`text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap ${child.textAlign === "center" ? "text-center" : child.textAlign === "right" ? "text-right" : "text-left"}`}>
                                          {child.content}
                                        </div>
                                      )}
                                      {child.type === "image" && child.content && (
                                        <div className="flex flex-col items-center">
                                          {child.caption && <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-2">{child.caption}</p>}
                                          <img src={child.content} alt={child.caption || "Image"} className="max-w-full h-auto object-contain rounded" />
                                        </div>
                                      )}
                                      {child.type === "code" && (
                                        <div className="bg-neutral-900 p-3 rounded-lg font-mono text-sm text-neutral-300 overflow-x-auto">
                                          <pre>{child.content}</pre>
                                        </div>
                                      )}
                                    </RowLayoutItem>
                                  ))}
                                </RowLayout>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Legacy content */
                        <>
                          {subQ.questionText && (
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap my-4">
                              {subQ.questionText}
                            </h3>
                          )}
                          {subQ.imageUrl && subQ.inputStyle !== "drawing" && (
                            <div className="my-4">
                              <div className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center mx-auto max-w-md">
                                <img src={subQ.imageUrl} alt="Question Illustration" className="max-w-full h-auto max-h-[600px] object-contain" />
                              </div>
                            </div>
                          )}
                          {subQ.preCodeText && (
                            <div className="my-4 text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                              {subQ.preCodeText}
                            </div>
                          )}
                          {subQ.codeSnippet && (
                            <div className="my-4 p-4 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                              <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{subQ.codeSnippet}</pre>
                            </div>
                          )}
                          {subQ.imageCaption && (
                            <p className="my-4 text-base text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap">{subQ.imageCaption}</p>
                          )}
                        </>
                      )}

                      {/* Input placeholder */}
                      {subQ.maxMarks > 0 && (
                        <div className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 italic text-center">
                            Student input area ({subQ.inputStyle || "text"})
                          </p>
                        </div>
                      )}

                      {/* Nested Sub-Parts */}
                      {subQ.subParts && subQ.subParts.length > 0 && (
                        <div className="mt-6 ml-4 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700 space-y-6">
                          {subQ.subParts.map((part) => (
                            <div key={part.id} className="space-y-3">
                              <div className="flex items-start gap-2">
                                {part.label && (
                                  <span className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                                    {part.label}
                                  </span>
                                )}
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    {part.maxMarks > 0 && (
                                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                        {part.maxMarks} {part.maxMarks === 1 ? 'Mark' : 'Marks'}
                                      </span>
                                    )}
                                  </div>

                                  {/* Content blocks or legacy content for sub-parts */}
                                  {part.contentBlocks && part.contentBlocks.length > 0 ? (
                                    <div className="space-y-3 my-3">
                                      {part.contentBlocks.map((block: ContentBlock) => (
                                        <div key={block.id}>
                                          {block.type === "text" && (
                                            <div className={cn(
                                              "text-base text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap",
                                              block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left",
                                              block.hasBorder && "border border-neutral-300 dark:border-neutral-700 p-3 rounded",
                                              block.hasBorder && block.borderWidth === 2 && "border-2",
                                              block.hasBorder && block.borderWidth === 3 && "border-[3px]",
                                              block.hasBorder && block.borderWidth === 4 && "border-4"
                                            )}>
                                              {block.content}
                                            </div>
                                          )}
                                          {block.type === "image" && block.content && (
                                            <div className={cn(
                                              "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                                              block.imageSize === "small" && "max-w-xs",
                                              block.imageSize === "medium" && "max-w-md",
                                              block.imageSize === "large" && "max-w-2xl",
                                              block.imageSize === "full" && "w-full",
                                              !block.imageSize && "max-w-md"
                                            )}>
                                              {block.caption && <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mb-1">{block.caption}</p>}
                                              <img src={block.content} alt={block.caption || "Question image"} className="max-w-full h-auto object-contain" />
                                            </div>
                                          )}
                                          {block.type === "code" && (
                                            <div className="p-3 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                                              <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{block.content}</pre>
                                            </div>
                                          )}
                                          {block.type === "code-table" && block.codeSections && (
                                            <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden text-sm">
                                              {block.codeSections.map((section, sIdx) => (
                                                <div key={section.id || sIdx}>
                                                  <div className="bg-neutral-200 dark:bg-neutral-700 px-3 py-1.5 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600">
                                                    {section.label}
                                                  </div>
                                                  <div className="bg-white dark:bg-neutral-900 p-3 font-mono text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0">
                                                    {section.code}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {block.type === "data-table" && block.dataTable && (
                                            <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden text-sm">
                                              <div className="bg-neutral-200 dark:bg-neutral-700 px-3 py-1.5 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono">
                                                {block.dataTable.tableName}
                                              </div>
                                              <table className="w-full">
                                                <thead>
                                                  <tr className="bg-neutral-100 dark:bg-neutral-800">
                                                    {block.dataTable.columns.map((col) => (
                                                      <th key={col.id} className="px-3 py-1.5 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0">
                                                        {col.header}
                                                      </th>
                                                    ))}
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {block.dataTable.rows.map((row) => (
                                                    <tr key={row.id} className="border-t border-neutral-300 dark:border-neutral-700">
                                                      {row.cells.map((cell, cellIndex) => {
                                                        if (isCellHidden(cell)) return null;
                                                        const cellRole = getCellRole(cell);
                                                        const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                                                        const colSpan = getCellColSpan(cell);
                                                        const rowSpan = getCellRowSpan(cell);
                                                        return (
                                                          <CellTag 
                                                            key={cellIndex} 
                                                            colSpan={colSpan > 1 ? colSpan : undefined}
                                                            rowSpan={rowSpan > 1 ? rowSpan : undefined}
                                                            className={cn(
                                                              "px-3 py-1.5 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                                                              cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                                                              cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                                                            )}
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
                                          )}
                                          {block.type === "row-layout" && block.children && (
                                            <RowLayout>
                                              {block.children.map((child: ContentBlock, childIdx: number) => (
                                                <RowLayoutItem key={child.id || childIdx}>
                                                  {child.type === "text" && (
                                                    <div className={`text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap ${child.textAlign === "center" ? "text-center" : child.textAlign === "right" ? "text-right" : "text-left"}`}>
                                                      {child.content}
                                                    </div>
                                                  )}
                                                  {child.type === "image" && child.content && (
                                                    <div className="flex flex-col items-center">
                                                      {child.caption && <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mb-1">{child.caption}</p>}
                                                      <img src={child.content} alt={child.caption || "Image"} className="max-w-full h-auto object-contain rounded" />
                                                    </div>
                                                  )}
                                                  {child.type === "code" && (
                                                    <div className="bg-neutral-900 p-2 rounded-lg font-mono text-xs text-neutral-300 overflow-x-auto">
                                                      <pre>{child.content}</pre>
                                                    </div>
                                                  )}
                                                </RowLayoutItem>
                                              ))}
                                            </RowLayout>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    /* Legacy content for sub-parts */
                                    <>
                                      {part.questionText && (
                                        <p className="text-base text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap my-3">
                                          {part.questionText}
                                        </p>
                                      )}
                                      {part.imageUrl && part.inputStyle !== "drawing" && (
                                        <div className="my-3">
                                          <div className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center mx-auto max-w-sm">
                                            <img src={part.imageUrl} alt="Question Illustration" className="max-w-full h-auto max-h-[400px] object-contain" />
                                          </div>
                                        </div>
                                      )}
                                      {part.preCodeText && (
                                        <div className="my-3 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                                          {part.preCodeText}
                                        </div>
                                      )}
                                      {part.codeSnippet && (
                                        <div className="my-3 p-3 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                                          <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{part.codeSnippet}</pre>
                                        </div>
                                      )}
                                      {part.imageCaption && (
                                        <p className="my-3 text-sm text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap">{part.imageCaption}</p>
                                      )}
                                    </>
                                  )}

                                  {/* Sub-part input placeholder */}
                                  {part.maxMarks > 0 && (
                                    <div className="mt-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600">
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400 italic text-center">
                                        Student input area ({part.inputStyle || "text"})
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {formData.subQuestions.length === 0 && (
              <div className="text-center py-8 text-neutral-400">
                No questions added yet.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Data Table Editor Modal */}
      <DataTableEditorModal
        open={dataTableModalOpen}
        onOpenChange={setDataTableModalOpen}
        dataTable={(() => {
          if (!editingDataTable) return null;
          if (editingDataTable.type === "scenario") {
            const block = formData.scenario?.contentBlocks?.[editingDataTable.blockIndex];
            return block?.dataTable || null;
          }
          if (editingDataTable.type === "subQuestion" && editingDataTable.subIndex !== undefined) {
            const subQ = formData.subQuestions[editingDataTable.subIndex];
            const block = subQ?.contentBlocks?.[editingDataTable.blockIndex];
            return block?.dataTable || null;
          }
          if (editingDataTable.type === "subPart" && editingDataTable.subIndex !== undefined && editingDataTable.partIndex !== undefined) {
            const subQ = formData.subQuestions[editingDataTable.subIndex];
            const part = subQ?.subParts?.[editingDataTable.partIndex];
            const block = part?.contentBlocks?.[editingDataTable.blockIndex];
            return block?.dataTable || null;
          }
          return null;
        })()}
        onSave={(updatedTable) => {
          if (!editingDataTable) return;
          if (editingDataTable.type === "scenario") {
            const blocks = [...(formData.scenario?.contentBlocks || [])];
            blocks[editingDataTable.blockIndex] = {
              ...blocks[editingDataTable.blockIndex],
              dataTable: updatedTable
            };
            setFormData(prev => ({
              ...prev,
              scenario: {
                text: prev.scenario?.text || "",
                ...prev.scenario,
                contentBlocks: blocks
              }
            }));
          }
          if (editingDataTable.type === "subQuestion" && editingDataTable.subIndex !== undefined) {
            const subIndex = editingDataTable.subIndex;
            const blockIndex = editingDataTable.blockIndex;
            setFormData(prev => {
              const updatedSubQuestions = [...prev.subQuestions];
              const blocks = [...(updatedSubQuestions[subIndex]?.contentBlocks || [])];
              blocks[blockIndex] = {
                ...blocks[blockIndex],
                dataTable: updatedTable
              };
              updatedSubQuestions[subIndex] = {
                ...updatedSubQuestions[subIndex],
                contentBlocks: blocks
              };
              return { ...prev, subQuestions: updatedSubQuestions };
            });
          }
          if (editingDataTable.type === "subPart" && editingDataTable.subIndex !== undefined && editingDataTable.partIndex !== undefined) {
            const subIndex = editingDataTable.subIndex;
            const partIndex = editingDataTable.partIndex;
            const blockIndex = editingDataTable.blockIndex;
            setFormData(prev => {
              const updatedSubQuestions = [...prev.subQuestions];
              const parts = [...(updatedSubQuestions[subIndex]?.subParts || [])];
              const blocks = [...(parts[partIndex]?.contentBlocks || [])];
              blocks[blockIndex] = {
                ...blocks[blockIndex],
                dataTable: updatedTable
              };
              parts[partIndex] = { ...parts[partIndex], contentBlocks: blocks };
              updatedSubQuestions[subIndex] = { ...updatedSubQuestions[subIndex], subParts: parts };
              return { ...prev, subQuestions: updatedSubQuestions };
            });
          }
          setDataTableModalOpen(false);
          setEditingDataTable(null);
        }}
      />
    </div>
  );
}
