import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Plus, Trash2, ChevronUp, ChevronDown, Upload, X, Image as ImageIcon, FileCode, File as FileIcon } from "lucide-react";
import { DiagramEditor } from "@/components/ui/diagram-editor";

export interface MarkingGuidanceRow {
  id: string;
  expectedResponse: string;
  additionalGuidance: string;
  marks: number;
}

export interface ExampleFile {
  url: string;
  originalName: string;
}

export interface MarkingGuidanceData {
  rows: MarkingGuidanceRow[];
  exampleAnswer: string;
  exampleImages?: string[];
  exampleFiles?: ExampleFile[];
}

interface MarkingGuidanceModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: MarkingGuidanceData;
  onSave: (data: MarkingGuidanceData) => void;
  questionLabel: string;
  maxMarks: number;
  wireframeMode?: "webpage-wireframe" | "form-wireframe";
  wireframeExampleData?: string;
  wireframeExampleCanvas?: string;
  wireframeBackgroundUrl?: string;
  onWireframeChange?: (dataStr: string, drawingStr: string) => void;
  onWireframeClear?: () => void;
  diagramMode?: "nav-structure";
  diagramExampleData?: string;
  diagramExampleCanvas?: string;
  onDiagramChange?: (dataStr: string, drawingStr: string) => void;
  onDiagramClear?: () => void;
}

export function MarkingGuidanceModal({
  open,
  onClose,
  initialData,
  onSave,
  questionLabel,
  maxMarks,
  wireframeMode,
  wireframeExampleData,
  wireframeExampleCanvas,
  wireframeBackgroundUrl,
  onWireframeChange,
  onWireframeClear,
  diagramMode,
  diagramExampleData,
  diagramExampleCanvas,
  onDiagramChange,
  onDiagramClear
}: MarkingGuidanceModalProps) {
  const [rows, setRows] = useState<MarkingGuidanceRow[]>([]);
  const [exampleAnswer, setExampleAnswer] = useState("");
  const [exampleImages, setExampleImages] = useState<string[]>([]);
  const [exampleFiles, setExampleFiles] = useState<ExampleFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeFileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const CODE_EXTENSIONS = [".py", ".css", ".html", ".htm", ".js", ".sql", ".txt", ".vb", ".json", ".xml", ".csv"];

  const isCodeFile = (filename: string) => {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
    return CODE_EXTENSIONS.includes(ext);
  };

  useEffect(() => {
    if (initialData) {
      setRows(initialData.rows);
      setExampleAnswer(initialData.exampleAnswer);
      setExampleImages(initialData.exampleImages || []);
      setExampleFiles(initialData.exampleFiles || []);
    } else {
      setRows([{ id: `row-${Date.now()}`, expectedResponse: "", additionalGuidance: "", marks: 1 }]);
      setExampleAnswer("");
      setExampleImages([]);
      setExampleFiles([]);
    }
  }, [initialData, open]);

  const uploadFile = async (file: File): Promise<{ url: string; originalName: string } | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      return { url: data.url, originalName: data.originalName || file.name };
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const allFiles = Array.from(files);
    const imageFiles = allFiles.filter(f => f.type.startsWith("image/"));
    const codeFiles = allFiles.filter(f => isCodeFile(f.name));

    if (imageFiles.length === 0 && codeFiles.length === 0) return;

    setUploading(true);
    const imageUrls: string[] = [];
    const newCodeFiles: ExampleFile[] = [];

    for (const file of imageFiles) {
      const result = await uploadFile(file);
      if (result) imageUrls.push(result.url);
    }
    for (const file of codeFiles) {
      const result = await uploadFile(file);
      if (result) newCodeFiles.push({ url: result.url, originalName: result.originalName });
    }

    if (imageUrls.length > 0) {
      setExampleImages(prev => [...prev, ...imageUrls]);
    }
    if (newCodeFiles.length > 0) {
      setExampleFiles(prev => [...prev, ...newCodeFiles]);
    }
    setUploading(false);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      handleFiles(imageFiles);
    }
  }, [handleFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const removeImage = (index: number) => {
    setExampleImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeFile = (index: number) => {
    setExampleFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setRows([...rows, { 
      id: `row-${Date.now()}`, 
      expectedResponse: "", 
      additionalGuidance: "", 
      marks: 1 
    }]);
  };

  const updateRow = (id: string, updates: Partial<MarkingGuidanceRow>) => {
    setRows(rows.map(row => row.id === id ? { ...row, ...updates } : row));
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const moveRow = (index: number, direction: "up" | "down") => {
    const newRows = [...rows];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newRows[index], newRows[swapIndex]] = [newRows[swapIndex], newRows[index]];
    setRows(newRows);
  };

  const handleSave = () => {
    onSave({ rows, exampleAnswer, exampleImages, exampleFiles });
    onClose();
  };

  const totalMarks = rows.reduce((sum, row) => sum + (row.marks || 0), 0);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onPaste={handlePaste}>
        <DialogHeader>
          <DialogTitle>AI Marking Guidance - {questionLabel}</DialogTitle>
          <DialogDescription>
            Define expected responses and guidance for each mark point. Total marks allocated: {totalMarks} / {maxMarks}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Marking Criteria</Label>
              <span className={`text-sm ${totalMarks === maxMarks ? 'text-green-600' : totalMarks > maxMarks ? 'text-red-600' : 'text-amber-600'}`}>
                {totalMarks} / {maxMarks} marks allocated
              </span>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-3 bg-neutral-100 dark:bg-neutral-800 text-sm font-medium border-b">
                <div className="col-span-1"></div>
                <div className="col-span-4">Expected Response</div>
                <div className="col-span-5">Additional Guidance</div>
                <div className="col-span-1 text-center">Marks</div>
                <div className="col-span-1"></div>
              </div>
              
              <div className="divide-y">
                {rows.map((row, index) => (
                  <div key={row.id} className="grid grid-cols-12 gap-2 p-3 items-start">
                    <div className="col-span-1 flex flex-col items-center justify-start pt-1 gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0"
                        onClick={() => moveRow(index, "up")}
                        disabled={index === 0}
                        data-testid={`button-move-up-${index}`}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <span className="text-sm text-neutral-500 leading-none">{index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0"
                        onClick={() => moveRow(index, "down")}
                        disabled={index === rows.length - 1}
                        data-testid={`button-move-down-${index}`}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="col-span-4">
                      <RichTextEditor
                        value={row.expectedResponse}
                        onChange={(value) => updateRow(row.id, { expectedResponse: value })}
                        placeholder="Expected answer (use toolbar for formatting)"
                        rows={1}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-5">
                      <RichTextEditor
                        value={row.additionalGuidance}
                        onChange={(value) => updateRow(row.id, { additionalGuidance: value })}
                        placeholder="Additional guidance for the AI"
                        rows={1}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="number"
                        min={0}
                        max={maxMarks}
                        value={row.marks}
                        onChange={(e) => updateRow(row.id, { marks: parseInt(e.target.value) || 0 })}
                        className="text-center"
                        data-testid={`input-marks-${index}`}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center pt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1}
                        data-testid={`button-remove-row-${index}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addRow}
              className="mt-3"
              data-testid="button-add-marking-row"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Mark Point
            </Button>
          </div>

          <div>
            <Label className="text-base font-semibold">Example Answer (Optional)</Label>
            <p className="text-sm text-neutral-500 mb-2">
              Provide a model answer to help the AI understand what a full-marks response looks like.
            </p>
            <RichTextEditor
              value={exampleAnswer}
              onChange={setExampleAnswer}
              placeholder="Write an example of a perfect answer here"
              rows={6}
            />
          </div>

          <div>
            <Label className="text-base font-semibold">Example Files (Optional)</Label>
            <p className="text-sm text-neutral-500 mb-2">
              Upload example code files (.py, .css, .html, .js, .sql, .txt, .vb) or screenshots. The AI will read these files and use them as reference when grading.
            </p>

            {(exampleFiles.length > 0 || exampleImages.length > 0) && (
              <div className="space-y-2 mb-3">
                {exampleFiles.map((file, index) => (
                  <div key={`file-${index}`} className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                    <FileCode className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-sm font-mono truncate flex-1" data-testid={`text-example-file-${index}`}>{file.originalName}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-600 shrink-0"
                      data-testid={`button-remove-file-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex flex-wrap gap-3">
                  {exampleImages.map((url, index) => (
                    <div key={`img-${index}`} className="relative group">
                      <img
                        src={url}
                        alt={`Example ${index + 1}`}
                        className="w-32 h-32 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                        data-testid={`img-example-${index}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        data-testid={`button-remove-image-${index}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              ref={dropZoneRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => codeFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                  : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600"
              }`}
              data-testid="dropzone-example-files"
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2 text-neutral-500">
                  <div className="w-6 h-6 border-2 border-neutral-300 border-t-red-500 rounded-full animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5" />
                    <ImageIcon className="w-5 h-5" />
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">
                    Drag & drop, paste, or click to upload files
                  </span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">
                    Code files: .py, .css, .html, .js, .sql, .txt, .vb | Images: JPEG, PNG, GIF, WebP
                  </span>
                </div>
              )}
            </div>

            <input
              ref={codeFileInputRef}
              type="file"
              accept=".py,.css,.html,.htm,.js,.sql,.txt,.vb,.json,.xml,.csv,image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
              data-testid="input-example-files"
            />
          </div>

          {wireframeMode && onWireframeChange && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <Label className="text-base font-semibold">Example Drawing</Label>
                  <p className="text-sm text-neutral-500">
                    Draw an example of what the student's answer should look like. The AI will compare student submissions against this.
                  </p>
                </div>
                {wireframeExampleData && onWireframeClear && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-500 hover:text-red-600 shrink-0"
                    onClick={onWireframeClear}
                    data-testid="button-clear-wireframe-example"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
              <DiagramEditor
                initialData={wireframeExampleData}
                initialDrawing={wireframeExampleCanvas}
                onChange={onWireframeChange}
                mode={wireframeMode}
                backgroundUrl={wireframeBackgroundUrl}
              />
            </div>
          )}

          {diagramMode && onDiagramChange && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <Label className="text-base font-semibold">Example Diagram (Expected Answer)</Label>
                  <p className="text-sm text-neutral-500">
                    Draw the expected navigation structure diagram. The AI will check student submissions against this - comparing pages, links, and arrow types.
                  </p>
                </div>
                {diagramExampleData && onDiagramClear && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-500 hover:text-red-600 shrink-0"
                    onClick={onDiagramClear}
                    data-testid="button-clear-diagram-example"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
              <DiagramEditor
                initialData={diagramExampleData}
                initialDrawing={diagramExampleCanvas}
                onChange={onDiagramChange}
                mode={diagramMode}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel-guidance">
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save-guidance">
              Save Marking Guidance
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
