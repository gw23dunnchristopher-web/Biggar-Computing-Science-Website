import { useState, useEffect, useCallback, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ModeToggle } from "@/components/mode-toggle";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { DiagramEditor } from "@/components/ui/diagram-editor";
import { DatabaseSchemaDisplay } from "@/components/ui/database-schema-editor";
import {
  ArrowLeft, ArrowRight, FileText, Download, BookOpen, Lock, CheckCircle2,
  Code, Database, Globe, ClipboardList, Clock, AlertTriangle, Upload, ImageIcon, X, Paperclip, Send, Loader2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { generateResultsPDF } from "@/lib/generate-pdf";
import { useStudentAuth } from "@/components/student-auth-context";

interface ContentBlock {
  id: string;
  type: "text" | "image" | "code" | "data-table" | "pseudocode" | "heading" | "row-layout" | "database-schema";
  content: string;
  caption?: string;
  imageSize?: string;
  dataTable?: {
    tableName: string;
    columns: { id: string; header: string; align?: string; width?: string }[];
    rows: { id: string; cells: (string | { value: string; role?: string; colSpan?: number; rowSpan?: number; hidden?: boolean })[] }[];
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

interface AssignmentResource {
  id: string;
  partId: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  description: string | null;
}

interface GridCell {
  key?: string;
  value: string;
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
}

interface MarkingGuidanceRow {
  criterion: string;
  marks: number;
}

interface MarkingGuidanceData {
  rows: MarkingGuidanceRow[];
  exampleAnswer: string;
  exampleImages?: string[];
  exampleFiles?: { url: string; originalName: string }[];
}

interface AssignmentQuestion {
  id: string;
  label: string;
  questionText: string;
  contentBlocks?: ContentBlock[];
  maxMarks: number;
  inputStyle: string;
  markingScheme: string[];
  aiGuidance?: string;
  markingGuidanceData?: MarkingGuidanceData | null;
  allowFileUpload?: boolean;
  subParts?: AssignmentQuestion[];
  inputConfig?: {
    grid?: GridConfig;
    grids?: GridConfig[];
    erdStarterDiagram?: string;
    erdModelAnswer?: string;
    baseErdDiagram?: string;
    baseNavDiagram?: string;
    navModelAnswer?: string;
  };
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
  subQuestions: AssignmentQuestion[] | null;
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
  sections?: AssignmentSection[];
}

interface StudentAnswer {
  text: string;
  uploadedFiles: { url: string; originalName: string }[];
}

interface StudentProgress {
  chosenOptionalType: string | null;
  completedParts: Record<string, string[]>;
  currentPartIndex: Record<string, number>;
  elapsedMs: number;
  sessionStartedAt: number | null;
  answers: Record<string, StudentAnswer>;
}

const SECTION_TYPE_NAMES: Record<string, string> = {
  sdd: "Software Design and Development",
  database: "Database Design and Development",
  web: "Web Design and Development",
};

const SECTION_TYPE_SHORT: Record<string, string> = {
  sdd: "SDD",
  database: "DDD",
  web: "WDD",
};

const SECTION_ICONS: Record<string, typeof Code> = {
  sdd: Code,
  database: Database,
  web: Globe,
};

function getProgressKey(assignmentId: string) {
  return `assignment_progress_${assignmentId}`;
}

function loadProgress(assignmentId: string): StudentProgress {
  try {
    const raw = localStorage.getItem(getProgressKey(assignmentId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { chosenOptionalType: null, completedParts: {}, currentPartIndex: {}, elapsedMs: 0, sessionStartedAt: null, answers: {} };
}

function saveProgress(assignmentId: string, progress: StudentProgress) {
  localStorage.setItem(getProgressKey(assignmentId), JSON.stringify(progress));
}

const DEFAULT_TIME_MINUTES = 360;

function getElapsedNow(progress: StudentProgress): number {
  if (progress.sessionStartedAt) {
    return progress.elapsedMs + (Date.now() - progress.sessionStartedAt);
  }
  return progress.elapsedMs;
}

const FRESH_PROGRESS: StudentProgress = { chosenOptionalType: null, completedParts: {}, currentPartIndex: {}, elapsedMs: 0, sessionStartedAt: null, answers: {} };

function syncToServer(assignmentId: string, progress: StudentProgress, totalMs: number, gradingResults?: any[], freshStart?: boolean) {
  const token = localStorage.getItem("student_token");
  if (!token) return;
  const elapsed = progress.sessionStartedAt
    ? progress.elapsedMs + (Date.now() - progress.sessionStartedAt)
    : progress.elapsedMs;
  const body: Record<string, unknown> = {
    assignmentId,
    chosenOptionalSection: progress.chosenOptionalType || "none",
    elapsedMs: elapsed,
    totalMs,
    answers: progress.answers,
    completedParts: progress.completedParts,
  };
  if (gradingResults) body.gradingResults = gradingResults;
  if (freshStart) body.freshStart = true;
  fetch("/api/student/assignment-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  }).catch(() => {});
}

function resetServerAttempt(assignmentId: string) {
  const token = localStorage.getItem("student_token");
  if (!token) return;
  fetch(`/api/student/assignment-attempt/${assignmentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}

function extractDesignChoiceAnswer(answerText: string): string {
  try {
    const parsed = JSON.parse(answerText);
    const mode = parsed["design_mode"] || "pseudocode";
    if (mode === "pseudocode") {
      return parsed["main"]?.trim() || "No answer provided";
    }
    if (mode === "diagram" && parsed["drawing"]) {
      try {
        const items = JSON.parse(parsed["drawing"]);
        if (!Array.isArray(items) || items.length === 0) return "No answer provided";
        const textContents = items
          .filter((i: any) => i.content)
          .sort((a: any, b: any) => Math.abs(a.y - b.y) > 40 ? a.y - b.y : a.x - b.x)
          .map((i: any) => i.content || "");
        const combined = textContents.join(" ").trim();
        return combined ? `[Structure Diagram] ${combined}` : "No answer provided";
      } catch { return "No answer provided"; }
    }
    return "No answer provided";
  } catch {
    return answerText?.trim() || "No answer provided";
  }
}

function useAssignmentTimer(assignmentId: string, assignment: Assignment) {
  const [progress, setProgress] = useState<StudentProgress>(() => loadProgress(assignmentId));
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const quitRef = useRef(false);
  const serverLoadedRef = useRef(false);
  const hydrationCompleteRef = useRef(false);

  const totalMs = (assignment.totalTimeMinutes ?? DEFAULT_TIME_MINUTES) * 60 * 1000;

  useEffect(() => {
    if (serverLoadedRef.current) return;
    serverLoadedRef.current = true;
    const token = localStorage.getItem("student_token");
    if (!token) {
      hydrationCompleteRef.current = true;
      return;
    }
    fetch(`/api/student/assignment-progress/${assignmentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.found) {
          const local = progressRef.current;
          const localElapsed = getElapsedNow(local);
          const serverElapsed = data.elapsedMs || 0;
          const localHasAnswers = local.answers && Object.keys(local.answers).length > 0;
          const serverHasAnswers = data.answers && Object.keys(data.answers).length > 0;
          if (serverHasAnswers && (serverElapsed > localElapsed || !localHasAnswers)) {
            const merged: StudentProgress = {
              chosenOptionalType: data.chosenOptionalSection || local.chosenOptionalType,
              completedParts: { ...data.completedParts, ...local.completedParts },
              currentPartIndex: local.currentPartIndex,
              elapsedMs: Math.max(serverElapsed, localElapsed),
              sessionStartedAt: local.sessionStartedAt ? Date.now() : null,
              answers: { ...data.answers, ...local.answers },
            };
            setProgress(merged);
            progressRef.current = merged;
            saveProgress(assignmentId, merged);
          }
        }
        hydrationCompleteRef.current = true;
      })
      .catch(() => { hydrationCompleteRef.current = true; });
  }, [assignmentId]);

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("student_token");
    if (!token) return;
    const startSync = () => {
      if (!quitRef.current) {
        syncToServer(assignmentId, progressRef.current, totalMs);
      }
    };
    const initialDelay = setTimeout(() => {
      if (hydrationCompleteRef.current) {
        startSync();
      }
    }, 2000);
    const interval = setInterval(startSync, 30000);
    return () => { clearTimeout(initialDelay); clearInterval(interval); };
  }, [assignmentId, totalMs]);

  const saveAndUpdate = useCallback((newProgress: StudentProgress) => {
    if (quitRef.current) return;
    setProgress(newProgress);
    saveProgress(assignmentId, newProgress);
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncToServer(assignmentId, newProgress, totalMs);
    }, 5000);
  }, [assignmentId, totalMs]);

  const resetProgress = useCallback(() => {
    quitRef.current = true;
    localStorage.removeItem(getProgressKey(assignmentId));
    setProgress({ ...FRESH_PROGRESS });
    progressRef.current = { ...FRESH_PROGRESS };
    resetServerAttempt(assignmentId);
  }, [assignmentId]);

  const resume = useCallback(() => {
    const p = progressRef.current;
    if (p.sessionStartedAt) return;
    if (p.elapsedMs >= totalMs) return;
    saveAndUpdate({ ...p, sessionStartedAt: Date.now() });
  }, [saveAndUpdate, totalMs]);

  const pause = useCallback(() => {
    const p = progressRef.current;
    if (!p.sessionStartedAt) return;
    const sessionElapsed = Date.now() - p.sessionStartedAt;
    saveAndUpdate({ ...p, elapsedMs: p.elapsedMs + sessionElapsed, sessionStartedAt: null });
  }, [saveAndUpdate]);

  useEffect(() => {
    resume();

    const handleBeforeUnload = () => {
      if (quitRef.current) return;
      const p = progressRef.current;
      if (p.sessionStartedAt) {
        const sessionElapsed = Date.now() - p.sessionStartedAt;
        const updated = { ...p, elapsedMs: p.elapsedMs + sessionElapsed, sessionStartedAt: null };
        localStorage.setItem(getProgressKey(assignmentId), JSON.stringify(updated));
      }
    };

    const handleVisibilityChange = () => {
      if (quitRef.current) return;
      if (document.hidden) {
        handleBeforeUnload();
      } else {
        const fresh = loadProgress(assignmentId);
        setProgress(fresh);
        progressRef.current = fresh;
        if (!fresh.sessionStartedAt && fresh.elapsedMs < totalMs) {
          const resumed = { ...fresh, sessionStartedAt: Date.now() };
          setProgress(resumed);
          progressRef.current = resumed;
          saveProgress(assignmentId, resumed);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (!quitRef.current) handleBeforeUnload();
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [assignmentId, resume, totalMs]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const isTimeExpired = getElapsedNow(progress) >= totalMs;

  useEffect(() => {
    if (isTimeExpired && progress.sessionStartedAt) {
      pause();
    }
  }, [isTimeExpired, progress.sessionStartedAt, pause]);

  return { progress, setProgress: saveAndUpdate, pause, resume, totalMs, resetProgress, isTimeExpired };
}

function AssignmentTimer({ progress, totalMs, onPause, onResume }: {
  progress: StudentProgress;
  totalMs: number;
  onPause: () => void;
  onResume: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const isRunning = progress.sessionStartedAt !== null;

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const elapsed = getElapsedNow(progress);
  const remaining = Math.max(0, totalMs - elapsed);
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isLow = remaining < 30 * 60 * 1000;
  const isExpired = remaining === 0;
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-2" data-testid="assignment-timer">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${
          isExpired
            ? "bg-red-600/30 text-red-300 border border-red-500/50"
            : isLow
            ? "bg-orange-600/20 text-orange-300 border border-orange-500/40 animate-pulse"
            : isRunning
            ? "bg-white/10 text-white border border-white/20"
            : "bg-yellow-600/20 text-yellow-300 border border-yellow-500/40"
        }`}
      >
        {isExpired ? (
          <AlertTriangle className="w-4 h-4" />
        ) : !isRunning ? (
          <span className="text-xs">PAUSED</span>
        ) : isLow ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
        {isExpired ? (
          <span>TIME UP</span>
        ) : (
          <span>{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
        )}
      </div>
      {!isExpired && (
        <Button
          variant="ghost"
          size="sm"
          onClick={isRunning ? onPause : onResume}
          className="text-white hover:bg-white/10 px-2"
          data-testid="button-pause-resume"
        >
          {isRunning ? "Pause" : "Resume"}
        </Button>
      )}
    </div>
  );
}

const TEXT_INPUT_STYLES = new Set(["text", "code-editor", "labeled-inputs"]);

function QuestionAnswerInput({
  questionId,
  inputStyle,
  allowFileUpload,
  inputConfig,
  answer,
  onAnswerChange,
  disabled,
}: {
  questionId: string;
  inputStyle?: string;
  allowFileUpload?: boolean;
  inputConfig?: AssignmentQuestion["inputConfig"];
  answer: StudentAnswer;
  onAnswerChange: (answer: StudentAnswer) => void;
  disabled?: boolean;
}) {
  const showTextBox = TEXT_INPUT_STYLES.has(inputStyle || "text");
  const isTable = inputStyle === "table";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dragCounter = useRef(0);

  const answerRef = useRef(answer);
  const onAnswerChangeRef = useRef(onAnswerChange);
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);
  useEffect(() => {
    onAnswerChangeRef.current = onAnswerChange;
  }, [onAnswerChange]);

  const handleDiagramAnswerChange = useCallback((data: string) => {
    onAnswerChangeRef.current({ ...answerRef.current, text: data });
  }, []);

  const handleDesignChoiceDrawingChange = useCallback((data: string) => {
    let parsedNow: Record<string, string> = {};
    if (answerRef.current.text) {
      try {
        parsedNow = JSON.parse(answerRef.current.text);
      } catch {
        parsedNow = { design_mode: "pseudocode", main: answerRef.current.text };
      }
    }
    const updated = { ...parsedNow, drawing: data };
    onAnswerChangeRef.current({ ...answerRef.current, text: JSON.stringify(updated) });
  }, []);

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploading(true);
    try {
      for (const file of fileArray) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload-student-file", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const result = await res.json();
          onAnswerChange({
            ...answer,
            uploadedFiles: [...answer.uploadedFiles, { url: result.url, originalName: result.originalName }],
          });
        }
      }
    } catch (e) {
      console.error("Upload failed", e);
    }
    setUploading(false);
  };

  const removeFile = (idx: number) => {
    onAnswerChange({
      ...answer,
      uploadedFiles: answer.uploadedFiles.filter((_, i) => i !== idx),
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled || !allowFileUpload) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const ext = file.type.split("/")[1] || "png";
        const namedFile = new File([file], `pasted_image_${Date.now()}.${ext}`, { type: file.type });
        handleFileUpload([namedFile]);
        break;
      }
    }
  };

  const gridData = isTable ? inputConfig?.grid : undefined;
  const parsedGridAnswers: Record<string, string> = (() => {
    if (!isTable || !answer.text) return {};
    try { return JSON.parse(answer.text); } catch { return {}; }
  })();

  const gridInitRef = useRef(false);
  if (isTable && gridData && !gridInitRef.current) {
    gridInitRef.current = true;
    const initial: Record<string, string> = { ...parsedGridAnswers };
    let changed = false;
    gridData.rows.forEach((row, ri) => {
      row.cells.forEach((cell, ci) => {
        if (cell.isInput && cell.starterText) {
          const key = cell.key || `r${ri}c${ci}`;
          if (!(key in initial)) {
            initial[key] = cell.starterText;
            changed = true;
          }
        }
      });
    });
    if (changed) {
      Promise.resolve().then(() => onAnswerChange({ ...answer, text: JSON.stringify(initial) }));
    }
  }

  const getStarterText = (cell: GridCell) => cell.starterText || "";

  const getInitialCellValue = (cellKey: string, cell: GridCell) => {
    if (cellKey in parsedGridAnswers) return parsedGridAnswers[cellKey];
    const starter = getStarterText(cell);
    return starter || "";
  };

  const handleGridCellChange = (cellKey: string, newValue: string, cell: GridCell) => {
    const starter = getStarterText(cell);
    if (starter && !newValue.startsWith(starter)) {
      if (newValue.length < starter.length) return;
      const withoutStarter = newValue.replace(starter, "");
      newValue = starter + withoutStarter;
    }
    const updated = { ...parsedGridAnswers, [cellKey]: newValue };
    onAnswerChange({ ...answer, text: JSON.stringify(updated) });
  };

  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, cellKey: string, cell: GridCell) => {
    const textarea = e.currentTarget;
    const starter = getStarterText(cell);
    const starterLen = starter.length;
    if (starterLen > 0 && textarea.selectionStart <= starterLen) {
      if (e.key === "Backspace" || e.key === "Delete") {
        if (textarea.selectionStart < starterLen || (e.key === "Backspace" && textarea.selectionEnd <= starterLen)) {
          e.preventDefault();
          return;
        }
      }
      if (e.key === "Home" || (e.key === "a" && (e.ctrlKey || e.metaKey))) {
        // allow normal behavior
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const pos = textarea.selectionStart;
      const val = textarea.value;
      const before = val.substring(0, pos);
      const after = val.substring(textarea.selectionEnd);
      const lastLine = before.split("\n").pop() || "";
      const bulletMatch = lastLine.match(/^(\s*[•\-]\s*)/);
      const newLine = bulletMatch ? "\n" + bulletMatch[1] : "\n";
      const newVal = before + newLine + after;
      handleGridCellChange(cellKey, newVal, cell);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = pos + newLine.length;
      });
    }
  };

  const handleGridClick = (e: React.MouseEvent<HTMLTextAreaElement>, cell: GridCell) => {
    const textarea = e.currentTarget;
    const starter = getStarterText(cell);
    if (starter && textarea.selectionStart < starter.length) {
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = starter.length;
      });
    }
  };

  return (
    <div className="mt-3 space-y-3" onPaste={handlePaste}>
      {showTextBox && (
        <textarea
          value={answer.text}
          onChange={(e) => onAnswerChange({ ...answer, text: e.target.value })}
          disabled={disabled}
          placeholder={inputStyle === "code-editor" ? "Paste your code here..." : "Type your answer here..."}
          className={`w-full min-h-[100px] p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-sm resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${inputStyle === "code-editor" ? "font-mono" : ""}`}
          data-testid={`input-answer-${questionId}`}
        />
      )}

      {isTable && gridData && (
        <div className="overflow-x-auto" data-testid={`table-input-${questionId}`}>
          <table className="w-full border-collapse text-sm">
            {gridData.showHeaders !== false && (
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800">
                  {gridData.headers.map((h, i) => (
                    <th
                      key={i}
                      className="border border-neutral-300 dark:border-neutral-600 p-2 text-left font-semibold"
                      style={{ width: gridData.colWidths?.[i] !== "auto" ? gridData.colWidths?.[i] : undefined }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {gridData.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.cells.map((cell, ci) => {
                    if (cell.hidden) return null;
                    const cellKey = cell.key || `r${ri}c${ci}`;
                    if (cell.isHeading) {
                      return (
                        <td
                          key={ci}
                          className="border border-neutral-300 dark:border-neutral-600 p-2 font-bold bg-neutral-50 dark:bg-neutral-800/50"
                          colSpan={cell.colSpan}
                          rowSpan={cell.rowSpan}
                        >
                          {cell.value}
                        </td>
                      );
                    }
                    if (cell.isInput) {
                      const cellVal = getInitialCellValue(cellKey, cell);
                      const starter = getStarterText(cell);
                      return (
                        <td
                          key={ci}
                          className="border border-neutral-300 dark:border-neutral-600 p-1"
                          colSpan={cell.colSpan}
                          rowSpan={cell.rowSpan}
                          style={{ minHeight: gridData.rowMinHeights?.[ri] !== "auto" ? gridData.rowMinHeights?.[ri] : undefined }}
                        >
                          {starter && (
                            <div className="px-2 pt-1 text-[10px] text-neutral-400 select-none">Starter text is locked</div>
                          )}
                          <textarea
                            value={cellVal}
                            onChange={(e) => handleGridCellChange(cellKey, e.target.value, cell)}
                            onKeyDown={(e) => handleGridKeyDown(e, cellKey, cell)}
                            onClick={(e) => handleGridClick(e, cell)}
                            onSelect={(e) => {
                              const ta = e.currentTarget;
                              if (starter && ta.selectionStart < starter.length && ta.selectionEnd <= starter.length) {
                                ta.selectionStart = ta.selectionEnd = starter.length;
                              }
                            }}
                            disabled={disabled}
                            placeholder={cell.placeholder || "Type your answer here..."}
                            className="w-full min-h-[80px] p-2 bg-white dark:bg-neutral-900 text-sm resize-y border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:opacity-50 disabled:cursor-not-allowed whitespace-pre-wrap"
                            data-testid={`table-cell-${questionId}-${cellKey}`}
                          />
                        </td>
                      );
                    }
                    return (
                      <td
                        key={ci}
                        className="border border-neutral-300 dark:border-neutral-600 p-2"
                        colSpan={cell.colSpan}
                        rowSpan={cell.rowSpan}
                      >
                        {cell.value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inputStyle === "erd-diagram" && (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950">
          <DiagramEditor
            initialData={answer.text || "[]"}
            baseDiagram={inputConfig?.erdStarterDiagram || inputConfig?.baseErdDiagram}
            mode="erd-annotation"
            disabled={disabled}
            onChange={handleDiagramAnswerChange}
          />
        </div>
      )}

      {inputStyle === "nav-structure" && (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950">
          <DiagramEditor
            initialData={answer.text || "[]"}
            baseDiagram={inputConfig?.baseNavDiagram}
            mode="nav-structure-higher"
            disabled={disabled}
            onChange={handleDiagramAnswerChange}
          />
        </div>
      )}

      {inputStyle === "design-choice" && (() => {
        let parsed: Record<string, string> = {};
        if (answer.text) {
          try { parsed = JSON.parse(answer.text); } catch { parsed = { design_mode: "pseudocode", main: answer.text }; }
        }
        const activeMode = parsed["design_mode"] || "pseudocode";
        const updateField = (key: string, value: string) => {
          const updated = { ...parsed, [key]: value };
          onAnswerChange({ ...answer, text: JSON.stringify(updated) });
        };
        return (
          <div className="space-y-4" data-testid={`design-choice-${questionId}`}>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`design-mode-${questionId}`}
                  checked={activeMode === "pseudocode"}
                  onChange={() => updateField("design_mode", "pseudocode")}
                  disabled={disabled}
                  className="w-4 h-4 text-red-600"
                />
                <span className="text-sm font-medium">Pseudocode</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`design-mode-${questionId}`}
                  checked={activeMode === "diagram"}
                  onChange={() => updateField("design_mode", "diagram")}
                  disabled={disabled}
                  className="w-4 h-4 text-red-600"
                />
                <span className="text-sm font-medium">Structure Diagram</span>
              </label>
            </div>
            {activeMode === "pseudocode" ? (
              <textarea
                placeholder="Write your pseudocode here..."
                className="w-full min-h-[200px] p-4 bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-lg text-sm font-mono resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                value={parsed["main"] || ""}
                onChange={(e) => updateField("main", e.target.value)}
                disabled={disabled}
                data-testid={`input-pseudocode-${questionId}`}
              />
            ) : (
              <div className="h-[500px] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
                <DiagramEditor
                  initialData={parsed["drawing"] || "[]"}
                  mode="structure-diagram"
                  disabled={disabled}
                  onChange={handleDesignChoiceDrawingChange}
                />
              </div>
            )}
          </div>
        );
      })()}

      {allowFileUpload && (
        <div>
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-neutral-300 dark:border-neutral-600 hover:border-blue-400"
            } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault(); e.stopPropagation();
              dragCounter.current = 0; setIsDragging(false);
              if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files);
            }}
            data-testid={`upload-zone-${questionId}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.csv,.sql,.py,.html,.css,.js"
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
            <div className="pointer-events-none">
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-neutral-500">
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">
                    {isDragging ? "Drop files here" : "Upload screenshots or files (drag & drop, click, or paste)"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {answer.uploadedFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {answer.uploadedFiles.map((f, idx) => {
                const isImage = /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(f.originalName);
                return (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg group">
                    {isImage ? (
                      <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <Paperclip className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    )}
                    <span className="text-xs truncate flex-1">{f.originalName}</span>
                    {isImage && (
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex-shrink-0">
                        Preview
                      </a>
                    )}
                    {!disabled && (
                      <button
                        onClick={() => removeFile(idx)}
                        className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        data-testid={`button-remove-file-${idx}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContentBlockPreview({ blocks }: { blocks: ContentBlock[] }) {
  const renderBlock = (block: ContentBlock): React.ReactNode => {
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

function syncLocalProgressToServer(assignments: Assignment[]) {
  const token = localStorage.getItem("student_token");
  if (!token) return;
  for (const a of assignments) {
    const key = `assignment_progress_${a.id}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const progress: StudentProgress = JSON.parse(raw);
      const hasAnswers = progress.answers && Object.keys(progress.answers).some(k => {
        const ans = progress.answers[k];
        return ans && (ans.text?.trim() || (ans.uploadedFiles && ans.uploadedFiles.length > 0));
      });
      const hasCompleted = progress.completedParts && Object.values(progress.completedParts).some(arr => arr && arr.length > 0);
      if (!hasAnswers && !hasCompleted && !progress.elapsedMs) continue;
      const totalMs = (a.totalTimeMinutes ?? 360) * 60 * 1000;
      const elapsed = progress.sessionStartedAt
        ? progress.elapsedMs + (Date.now() - progress.sessionStartedAt)
        : progress.elapsedMs;
      fetch("/api/student/assignment-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          assignmentId: a.id,
          chosenOptionalSection: progress.chosenOptionalType || "none",
          elapsedMs: elapsed,
          totalMs,
          answers: progress.answers,
          completedParts: progress.completedParts,
        }),
      }).catch(() => {});
    } catch {}
  }
}

function AssignmentListPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assignments/published")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setAssignments(data);
        setLoading(false);
        syncLocalProgressToServer(data);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950" data-testid="assignment-list">
      <div className="bg-black dark:bg-neutral-800 text-white py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Assignments</h1>
        </div>
        <ModeToggle />
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No assignments available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((a) => (
              <Link key={a.id} href={`/assignment/${a.id}`}>
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 hover:shadow-lg hover:border-red-400/50 dark:hover:border-red-500/50 transition-all cursor-pointer group" data-testid={`link-assignment-${a.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{a.title}</h2>
                      <p className="text-sm text-neutral-500 mt-1">{a.year} &middot; {a.totalMarks} marks</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-neutral-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface GradingResult {
  sectionName: string;
  partLabel: string;
  questionId: string;
  questionLabel: string;
  questionText: string;
  maxMarks: number;
  score: number;
  feedback: string;
  suggestions: string;
  userAnswer: string;
}

function collectGradableItems(
  assignment: Assignment,
  progress: StudentProgress
): { sectionName: string; partLabel: string; question: AssignmentQuestion; answer: StudentAnswer }[] {
  const items: { sectionName: string; partLabel: string; question: AssignmentQuestion; answer: StudentAnswer }[] = [];
  const sections = (assignment.sections || []).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  for (const section of sections) {
    if (!section.isCompulsory && section.sectionType !== progress.chosenOptionalType) continue;
    const sectionName = SECTION_TYPE_SHORT[section.sectionType] || section.title;
    const parts = (section.parts || []).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    for (const part of parts) {
      const questions = part.subQuestions || [];
      for (const q of questions) {
        if (q.inputStyle === "info-only" || q.maxMarks === 0) continue;
        const allQs = q.subParts && q.subParts.length > 0 ? q.subParts : [q];
        for (const sq of allQs) {
          if (sq.inputStyle === "info-only" || sq.maxMarks === 0) continue;
          const answer = progress.answers[sq.id] || { text: "", uploadedFiles: [] };
          items.push({ sectionName, partLabel: part.partLabel, question: sq, answer });
        }
      }
    }
  }
  return items;
}

function TaskSelectionPage({ assignment }: { assignment: Assignment }) {
  const [, navigate] = useLocation();
  const timer = useAssignmentTimer(assignment.id, assignment);
  const { progress } = timer;
  const [infoSheetOpen, setInfoSheetOpen] = useState(false);
  const [infoSheetSection, setInfoSheetSection] = useState<AssignmentSection | null>(null);
  const [autoShownSheets, setAutoShownSheets] = useState<Set<string>>(new Set());
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [confirmTurnIn, setConfirmTurnIn] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingProgress, setGradingProgress] = useState({ current: 0, total: 0 });
  const [gradingResults, setGradingResults] = useState<GradingResult[] | null>(null);

  const handleQuitAssignment = () => {
    timer.resetProgress();
    navigate("/assignments");
  };

  const sections = (assignment.sections || []).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  const compulsorySections = sections.filter(s => s.isCompulsory);
  const optionalSections = sections.filter(s => !s.isCompulsory);

  const isSectionLocked = (section: AssignmentSection) => {
    if (section.isCompulsory) return false;
    if (!progress.chosenOptionalType) return false;
    return section.sectionType !== progress.chosenOptionalType;
  };

  const getSectionStatus = (section: AssignmentSection) => {
    const parts = (section.parts || []).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    const completed = progress.completedParts[section.id] || [];
    if (parts.length === 0) return "empty";
    if (completed.length >= parts.length) return "completed";
    if (completed.length > 0 || (progress.currentPartIndex[section.id] ?? 0) > 0) return "in_progress";
    return "not_started";
  };

  const handleSelectTask = (section: AssignmentSection) => {
    if (isSectionLocked(section) || timer.isTimeExpired) return;

    if (!section.isCompulsory && !progress.chosenOptionalType) {
      timer.setProgress({ ...progress, chosenOptionalType: section.sectionType });
    }

    if (
      section.informationSheet &&
      section.informationSheet.length > 0 &&
      !autoShownSheets.has(section.id)
    ) {
      setInfoSheetSection(section);
      setInfoSheetOpen(true);
      setAutoShownSheets(prev => new Set(prev).add(section.id));
    }

    navigate(`/assignment/${assignment.id}/task/${section.id}`);
  };

  const openInfoSheet = (section: AssignmentSection) => {
    setInfoSheetSection(section);
    setInfoSheetOpen(true);
  };

  const allCompulsoryDone = compulsorySections.every(s => getSectionStatus(s) === "completed");
  const chosenOptional = optionalSections.find(s => s.sectionType === progress.chosenOptionalType);
  const chosenOptionalDone = chosenOptional ? getSectionStatus(chosenOptional) === "completed" : false;
  const allSectionsDone = allCompulsoryDone && chosenOptionalDone;
  const canTurnIn = (allSectionsDone || timer.isTimeExpired) && !gradingResults;

  useEffect(() => {
    if (allSectionsDone && !gradingResults) {
      timer.pause();
    }
  }, [allSectionsDone, gradingResults, timer.pause]);

  const handleTurnIn = async () => {
    setConfirmTurnIn(false);
    setIsGrading(true);
    timer.pause();

    const items = collectGradableItems(assignment, progress);
    setGradingProgress({ current: 0, total: items.length });
    let completed = 0;

    const peerAnswers = new Map<string, string[]>();
    for (const { sectionName, partLabel, question, answer } of items) {
      const key = `${sectionName}||${partLabel}`;
      if (!peerAnswers.has(key)) peerAnswers.set(key, []);
      let txt = answer.text?.trim() || "";
      if (txt && question.inputStyle === "design-choice") {
        txt = extractDesignChoiceAnswer(txt);
        if (txt === "No answer provided") txt = "";
      }
      if (txt) peerAnswers.get(key)!.push(`${question.label}: ${txt}`);
    }

    const gradePromises = items.map(({ sectionName, partLabel, question, answer }) => {
      const questionText = question.contentBlocks?.find(b => b.type === "text")?.content || question.questionText || "";
      const answerText = answer.text?.trim() || "";
      const hasFiles = answer.uploadedFiles.length > 0;

      if (!answerText && !hasFiles) {
        completed++;
        setGradingProgress({ current: completed, total: items.length });
        return Promise.resolve({
          sectionName, partLabel,
          questionId: question.id,
          questionLabel: question.label,
          questionText,
          maxMarks: question.maxMarks,
          score: 0,
          feedback: "No answer was provided.",
          suggestions: "Attempt to answer the question in future.",
          userAnswer: "No answer provided",
        } as GradingResult);
      }

      let studentAnswerForGrading = answerText
        ? answerText
        : hasFiles
          ? `[Student submitted ${answer.uploadedFiles.length} file(s): ${answer.uploadedFiles.map(f => f.originalName).join(", ")}]`
          : "No answer provided";

      if (question.inputStyle === "design-choice" && answerText) {
        studentAnswerForGrading = extractDesignChoiceAnswer(answerText);
      }

      const markingScheme = question.markingGuidanceData?.rows?.length
        ? question.markingGuidanceData.rows.map(r => `${r.criterion} (${r.marks} mark${r.marks !== 1 ? "s" : ""})`).join("\n")
        : question.markingScheme.join("\n");

      const key = `${sectionName}||${partLabel}`;
      const peers = (peerAnswers.get(key) || []).filter(p => !p.startsWith(`${question.label}:`));
      let priorContext = "";
      if (peers.length > 0) {
        priorContext = "\n\nSTUDENT'S OTHER ANSWERS IN THIS SECTION (for context):\n" + peers.join("\n");
      }

      const body: Record<string, unknown> = {
        studentAnswer: studentAnswerForGrading,
        markingScheme,
        maxMarks: question.maxMarks,
        questionContext: `${sectionName} - Part ${partLabel} - ${question.label}: ${questionText}${priorContext}`,
        aiGuidance: question.aiGuidance || "",
      };

      if (question.markingGuidanceData?.exampleFiles?.length) {
        body.referenceFiles = question.markingGuidanceData.exampleFiles;
      }
      if (answer.uploadedFiles.length > 0) {
        body.studentUploadedFiles = answer.uploadedFiles;
      }
      if (question.inputStyle === "erd-diagram" && question.inputConfig?.erdModelAnswer) {
        body.erdModelAnswer = question.inputConfig.erdModelAnswer;
      }
      if (question.inputStyle === "nav-structure" && question.inputConfig?.navModelAnswer) {
        body.navModelAnswer = question.inputConfig.navModelAnswer;
      }

      return fetch("/api/grade-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then(async (resp) => {
          completed++;
          setGradingProgress({ current: completed, total: items.length });
          if (resp.ok) {
            const data = await resp.json();
            return {
              sectionName, partLabel,
              questionId: question.id,
              questionLabel: question.label,
              questionText,
              maxMarks: question.maxMarks,
              score: Math.min(data.marks ?? 0, question.maxMarks),
              feedback: data.feedback || "",
              suggestions: data.suggestions || "",
              userAnswer: studentAnswerForGrading,
            } as GradingResult;
          }
          return {
            sectionName, partLabel,
            questionId: question.id,
            questionLabel: question.label,
            questionText,
            maxMarks: question.maxMarks,
            score: 0,
            feedback: "Could not grade this answer. Please review manually.",
            suggestions: "",
            userAnswer: studentAnswerForGrading,
          } as GradingResult;
        })
        .catch(() => {
          completed++;
          setGradingProgress({ current: completed, total: items.length });
          return {
            sectionName, partLabel,
            questionId: question.id,
            questionLabel: question.label,
            questionText,
            maxMarks: question.maxMarks,
            score: 0,
            feedback: "Grading error occurred.",
            suggestions: "",
            userAnswer: studentAnswerForGrading,
          } as GradingResult;
        });
    });

    const results = await Promise.all(gradePromises);
    setGradingResults(results);
    setIsGrading(false);

    syncToServer(assignment.id, progress, timer.totalMs, results);
  };

  const totalScore = gradingResults?.reduce((s, r) => s + r.score, 0) ?? 0;
  const totalMaxMarks = gradingResults?.reduce((s, r) => s + r.maxMarks, 0) ?? 0;
  const resultPercentage = totalMaxMarks > 0 ? Math.round((totalScore / totalMaxMarks) * 100) : 0;
  const resultGrade = resultPercentage >= 70 ? "A" : resultPercentage >= 60 ? "B" : resultPercentage >= 50 ? "C" : resultPercentage >= 40 ? "D" : "No Award";

  const handleDownloadResultsPDF = () => {
    if (!gradingResults) return;
    generateResultsPDF({
      title: assignment.title,
      subtitle: "Assignment Results",
      date: new Date().toLocaleDateString(),
      totalScore,
      maxScore: totalMaxMarks,
      grade: resultGrade,
      percentage: resultPercentage,
      breakdown: gradingResults.map(r => ({
        questionTitle: `${r.sectionName} - Part ${r.partLabel}`,
        subLabel: r.questionLabel,
        questionText: r.questionText,
        maxMarks: r.maxMarks,
        score: r.score,
        userAnswer: r.userAnswer,
        feedback: r.feedback,
        suggestions: r.suggestions,
      })),
    });
  };

  if (gradingResults) {
    const gradeColor = resultGrade === "A" ? "text-green-600" :
      resultGrade === "B" ? "text-blue-600" :
      resultGrade === "C" ? "text-yellow-600" :
      resultGrade === "D" ? "text-orange-600" : "text-neutral-500";

    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950" data-testid="assignment-results">
        <div className="bg-black dark:bg-neutral-800 text-white py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/assignments">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Assignments
              </Button>
            </Link>
            <h1 className="text-lg font-bold">{assignment.title} — Results</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleDownloadResultsPDF} className="text-white border-white/20 hover:bg-white/10" data-testid="button-download-pdf">
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
            <ModeToggle />
          </div>
        </div>

        <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
          <div className="bg-white dark:bg-neutral-900 border rounded-xl p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Assignment Submitted</h2>
            <div className={`text-6xl font-black mb-2 ${gradeColor}`}>{resultGrade}</div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
              {totalScore} / {totalMaxMarks} marks ({resultPercentage}%)
            </p>
            <Progress value={resultPercentage} className="h-3 max-w-xs mx-auto" />
          </div>

          <h3 className="text-lg font-bold">Question Breakdown</h3>
          <div className="space-y-3">
            {gradingResults.map((r, i) => {
              const statusColor = r.score === r.maxMarks ? "border-l-green-500" : r.score > 0 ? "border-l-yellow-500" : "border-l-red-500";
              return (
                <div key={i} className={`bg-white dark:bg-neutral-900 border border-l-4 ${statusColor} rounded-lg p-4`} data-testid={`card-result-${i}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-medium text-neutral-500">{r.sectionName} — Part {r.partLabel}</span>
                      <h4 className="font-bold">{r.questionLabel}</h4>
                    </div>
                    <span className={`font-bold text-sm ${r.score === r.maxMarks ? "text-green-600" : r.score > 0 ? "text-yellow-600" : "text-red-600"}`}>
                      {r.score} / {r.maxMarks}
                    </span>
                  </div>
                  {r.questionText && (
                    <p className="text-xs text-neutral-500 italic mb-2">{r.questionText.substring(0, 200)}{r.questionText.length > 200 ? "..." : ""}</p>
                  )}
                  {r.feedback && (
                    <div className="text-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-3 mb-2">
                      <span className="font-semibold text-blue-700 dark:text-blue-300 text-xs">Feedback</span>
                      <div className="text-neutral-700 dark:text-neutral-300 mt-1 whitespace-pre-line">{r.feedback}</div>
                    </div>
                  )}
                  {r.suggestions && (
                    <div className="text-sm bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded p-3">
                      <span className="font-semibold text-green-700 dark:text-green-300 text-xs">How to Improve</span>
                      <div className="text-neutral-700 dark:text-neutral-300 mt-1 whitespace-pre-line">{r.suggestions}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button onClick={handleDownloadResultsPDF} className="flex-1" variant="outline" data-testid="button-download-pdf-bottom">
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
            <Link href="/assignments" className="flex-1">
              <Button className="w-full bg-red-600 hover:bg-red-700">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assignments
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950" data-testid="task-selection">
      <div className="bg-black dark:bg-neutral-800 text-white py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assignments">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Assignments
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold" data-testid="text-assignment-title">{assignment.title}</h1>
            <p className="text-xs text-neutral-400">{assignment.year} &middot; {assignment.totalMarks} marks</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AssignmentTimer progress={progress} totalMs={timer.totalMs} onPause={timer.pause} onResume={timer.resume} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmQuit(true)}
            className="text-red-400 border-red-400/30 hover:bg-red-900/20 hover:text-red-300"
            data-testid="button-quit-assignment"
          >
            Quit Assignment
          </Button>
          <ModeToggle />
        </div>
      </div>

      <AlertDialog open={confirmQuit} onOpenChange={setConfirmQuit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Quit Assignment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all of your progress, including all answers, completed tasks, and your chosen optional section. Your timer will also be reset. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleQuitAssignment}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-quit"
            >
              Quit and Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            You must complete <strong>{compulsorySections.map(s => SECTION_TYPE_SHORT[s.sectionType] || s.title).join(", ")}</strong> and 
            choose <strong>one</strong> of: {optionalSections.map(s => SECTION_TYPE_SHORT[s.sectionType] || s.title).join(" or ")}.
            You can work on tasks in any order.
            {progress.chosenOptionalType && (
              <span className="block mt-1 font-semibold">
                You have chosen: {SECTION_TYPE_NAMES[progress.chosenOptionalType] || progress.chosenOptionalType}
              </span>
            )}
          </p>
        </div>

        {compulsorySections.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Compulsory Task</h2>
            <div className="space-y-3">
              {compulsorySections.map(section => {
                const status = getSectionStatus(section);
                const Icon = SECTION_ICONS[section.sectionType] || Code;
                const hasInfoSheet = section.informationSheet && section.informationSheet.length > 0;
                const parts = (section.parts || []);
                const completedCount = (progress.completedParts[section.id] || []).length;
                return (
                  <div key={section.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden" data-testid={`card-task-${section.id}`}>
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${status === "completed" ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{SECTION_TYPE_NAMES[section.sectionType] || section.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded font-medium">Compulsory</span>
                              <span className="text-xs text-neutral-500">{parts.length} part{parts.length !== 1 ? "s" : ""}</span>
                              {status === "completed" && (
                                <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle2 className="w-3 h-3" /> Complete</span>
                              )}
                              {status === "in_progress" && (
                                <span className="text-xs text-amber-600 font-medium">In Progress ({completedCount}/{parts.length})</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {hasInfoSheet && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openInfoSheet(section); }}
                            className="text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            data-testid={`button-info-sheet-${section.id}`}
                          >
                            <BookOpen className="w-4 h-4 mr-1" />
                            Info Sheet
                          </Button>
                        )}
                      </div>
                      <div className="mt-4">
                        <Button
                          onClick={() => handleSelectTask(section)}
                          disabled={timer.isTimeExpired}
                          className={status === "completed" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                          data-testid={`button-start-task-${section.id}`}
                        >
                          {timer.isTimeExpired ? <Lock className="w-4 h-4 mr-2" /> : null}
                          {timer.isTimeExpired ? "Locked" : status === "completed" ? "Review" : status === "in_progress" ? "Continue" : "Start Task"}
                          {!timer.isTimeExpired && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {optionalSections.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              Choose One Task
            </h2>
            <div className="space-y-3">
              {optionalSections.map(section => {
                const locked = isSectionLocked(section);
                const status = getSectionStatus(section);
                const Icon = SECTION_ICONS[section.sectionType] || Code;
                const hasInfoSheet = section.informationSheet && section.informationSheet.length > 0;
                const parts = (section.parts || []);
                const completedCount = (progress.completedParts[section.id] || []).length;
                const isChosen = progress.chosenOptionalType === section.sectionType;
                return (
                  <div
                    key={section.id}
                    className={`bg-white dark:bg-neutral-900 border rounded-xl overflow-hidden transition-all ${
                      locked
                        ? "border-neutral-300 dark:border-neutral-700 opacity-50"
                        : isChosen
                          ? "border-blue-400 dark:border-blue-600 ring-2 ring-blue-200 dark:ring-blue-900"
                          : "border-neutral-200 dark:border-neutral-800"
                    }`}
                    data-testid={`card-task-${section.id}`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${
                            locked
                              ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-400"
                              : status === "completed"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                          }`}>
                            {locked ? <Lock className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg ${locked ? "text-neutral-400" : ""}`}>
                              {SECTION_TYPE_NAMES[section.sectionType] || section.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              {locked ? (
                                <span className="text-xs text-neutral-400">
                                  Locked — you chose {SECTION_TYPE_SHORT[progress.chosenOptionalType!]}
                                </span>
                              ) : (
                                <>
                                  <span className="text-xs text-neutral-500">{parts.length} part{parts.length !== 1 ? "s" : ""}</span>
                                  {isChosen && <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded font-medium">Your Choice</span>}
                                  {status === "completed" && (
                                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle2 className="w-3 h-3" /> Complete</span>
                                  )}
                                  {status === "in_progress" && (
                                    <span className="text-xs text-amber-600 font-medium">In Progress ({completedCount}/{parts.length})</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {!locked && hasInfoSheet && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openInfoSheet(section); }}
                            className="text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            data-testid={`button-info-sheet-${section.id}`}
                          >
                            <BookOpen className="w-4 h-4 mr-1" />
                            Info Sheet
                          </Button>
                        )}
                      </div>
                      {!locked && (
                        <div className="mt-4">
                          <Button
                            onClick={() => handleSelectTask(section)}
                            disabled={timer.isTimeExpired}
                            className={status === "completed" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                            data-testid={`button-start-task-${section.id}`}
                          >
                            {timer.isTimeExpired ? <Lock className="w-4 h-4 mr-2" /> : null}
                            {timer.isTimeExpired ? "Locked" : status === "completed" ? "Review" : status === "in_progress" ? "Continue" : "Start Task"}
                            {!timer.isTimeExpired && <ArrowRight className="w-4 h-4 ml-2" />}
                          </Button>
                          {!progress.chosenOptionalType && !timer.isTimeExpired && (
                            <p className="text-xs text-amber-600 mt-2">Starting this task will lock you out of the other optional task.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {canTurnIn && (
          <div className={`mt-8 ${timer.isTimeExpired && !allSectionsDone ? "bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700" : "bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700"} rounded-xl p-6 text-center`}>
            {timer.isTimeExpired && !allSectionsDone ? (
              <>
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-1">Time's Up</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Your time has run out. Turn in your assignment now to receive marks for the questions you have completed.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-1">Ready to Turn In</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  All required sections are complete. Turn in your assignment to receive your marks and feedback.
                </p>
              </>
            )}
            <Button
              size="lg"
              onClick={() => setConfirmTurnIn(true)}
              className={timer.isTimeExpired && !allSectionsDone ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              data-testid="button-turn-in"
            >
              <Send className="w-4 h-4 mr-2" /> Turn In Assignment
            </Button>
          </div>
        )}
      </div>

      {isGrading && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-8 max-w-md w-full mx-4 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto" />
            <h3 className="text-xl font-bold">Grading Your Assignment</h3>
            <p className="text-sm text-neutral-500">
              Marking question {gradingProgress.current} of {gradingProgress.total}...
            </p>
            <Progress value={gradingProgress.total > 0 ? (gradingProgress.current / gradingProgress.total) * 100 : 0} className="h-2" />
            <p className="text-xs text-neutral-400">This may take a minute. Please don't close this page.</p>
          </div>
        </div>
      )}

      <AlertDialog open={confirmTurnIn} onOpenChange={setConfirmTurnIn}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-500" />
              Turn In Assignment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your answers will be graded by AI. You will receive marks and feedback for each question. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTurnIn} className="bg-green-600 hover:bg-green-700" data-testid="button-confirm-turn-in">
              Turn In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={infoSheetOpen} onOpenChange={setInfoSheetOpen}>
        <DialogContent
          className="max-w-3xl max-h-[85vh] overflow-y-auto"
          onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = "auto"; }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Information Sheet
              {infoSheetSection && (
                <span className="text-sm font-normal text-neutral-500">
                  — {SECTION_TYPE_NAMES[infoSheetSection.sectionType] || infoSheetSection.title}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {infoSheetSection?.informationSheet && infoSheetSection.informationSheet.length > 0 ? (
              <ContentBlockPreview blocks={infoSheetSection.informationSheet} />
            ) : (
              <p className="text-neutral-500 text-sm">No information sheet content.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskWorkPage({ assignment, sectionId }: { assignment: Assignment; sectionId: string }) {
  const [, navigate] = useLocation();
  const timer = useAssignmentTimer(assignment.id, assignment);
  const { progress } = timer;
  const [infoSheetOpen, setInfoSheetOpen] = useState(false);
  const infoSheetAutoShown = useRef(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.isTimeExpired && !redirectTimeoutRef.current) {
      redirectTimeoutRef.current = setTimeout(() => {
        navigate(`/assignment/${assignment.id}`);
      }, 3000);
    }
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [timer.isTimeExpired, navigate, assignment.id]);

  const handleGoToTurnIn = () => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    navigate(`/assignment/${assignment.id}`);
  };

  const handleQuitAssignment = () => {
    timer.resetProgress();
    navigate("/assignments");
  };

  const section = assignment.sections?.find(s => s.id === sectionId);
  const parts = (section?.parts || []).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  const completedParts = progress.completedParts[sectionId] || [];
  const currentIndex = progress.currentPartIndex[sectionId] ?? 0;
  const currentPart = parts[currentIndex];
  const hasInfoSheet = section?.informationSheet && section.informationSheet.length > 0;

  useEffect(() => {
    if (hasInfoSheet && !infoSheetAutoShown.current) {
      setInfoSheetOpen(true);
      infoSheetAutoShown.current = true;
    }
  }, [hasInfoSheet]);

  if (!section) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center space-y-4">
          <p className="text-lg text-red-600">Task not found</p>
          <Link href={`/assignment/${assignment.id}`}>
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Tasks</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPartCompleted = (partId: string) => completedParts.includes(partId);
  const allCompleted = parts.length > 0 && completedParts.length >= parts.length;

  const getAnswer = (questionId: string): StudentAnswer => {
    return progress.answers?.[questionId] || { text: "", uploadedFiles: [] };
  };

  const updateAnswer = useCallback((questionId: string, answer: StudentAnswer) => {
    const newAnswers = { ...progress.answers, [questionId]: answer };
    timer.setProgress({ ...progress, answers: newAnswers });
  }, [progress, timer]);

  const handleSubmitPart = () => {
    if (!currentPart) return;
    const newCompleted = [...completedParts, currentPart.id];
    const nextIndex = currentIndex + 1;
    timer.setProgress({
      ...progress,
      completedParts: { ...progress.completedParts, [sectionId]: newCompleted },
      currentPartIndex: { ...progress.currentPartIndex, [sectionId]: nextIndex },
    });
    setConfirmSubmit(false);
  };

  const handleExitTask = () => {
    timer.pause();
    navigate(`/assignment/${assignment.id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950" data-testid="task-work">
      {timer.isTimeExpired && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-8 max-w-md w-full mx-4 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-xl font-bold">Time's Up!</h3>
            <p className="text-sm text-neutral-500">
              Your time has run out. You will be redirected to turn in your assignment.
            </p>
            <Button onClick={handleGoToTurnIn} className="bg-red-600 hover:bg-red-700">
              Go to Turn In
            </Button>
          </div>
        </div>
      )}
      <div className="bg-black dark:bg-neutral-800 text-white py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={handleExitTask}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit Task
            </Button>
            <div>
              <h1 className="text-sm font-bold">{SECTION_TYPE_NAMES[section.sectionType] || section.title}</h1>
              <p className="text-xs text-neutral-400">{assignment.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AssignmentTimer progress={progress} totalMs={timer.totalMs} onPause={timer.pause} onResume={timer.resume} />
            {hasInfoSheet && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInfoSheetOpen(true)}
                className="bg-purple-600/20 text-purple-300 border-purple-500/40 hover:bg-purple-600/30 hover:text-white"
                data-testid="button-info-sheet-header"
              >
                <BookOpen className="w-4 h-4 mr-1" />
                Information Sheet
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmQuit(true)}
              className="text-red-400 border-red-400/30 hover:bg-red-900/20 hover:text-red-300"
              data-testid="button-quit-assignment"
            >
              Quit
            </Button>
            <ModeToggle />
          </div>
        </div>
      </div>

      <AlertDialog open={confirmQuit} onOpenChange={setConfirmQuit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Quit Assignment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all of your progress, including all answers, completed tasks, and your chosen optional section. Your timer will also be reset. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleQuitAssignment}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-quit"
            >
              Quit and Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="border-b bg-white dark:bg-neutral-900 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          {parts.map((part, idx) => {
            const completed = isPartCompleted(part.id);
            const isCurrent = idx === currentIndex && !allCompleted;
            const isFuture = idx > currentIndex && !completed;
            return (
              <div key={part.id} className="flex items-center gap-2">
                {idx > 0 && <div className={`w-6 h-0.5 ${completed || isCurrent ? "bg-green-400" : "bg-neutral-300 dark:bg-neutral-700"}`} />}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    completed
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : isCurrent
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-2 ring-red-300 dark:ring-red-700"
                        : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                  }`}
                >
                  {completed ? <CheckCircle2 className="w-3 h-3" /> : isFuture ? <Lock className="w-3 h-3" /> : null}
                  Part {part.partLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6 px-4">
        {allCompleted ? (
          <div className="text-center py-16 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Task Complete!</h2>
            <p className="text-neutral-500">You have completed all parts of {SECTION_TYPE_NAMES[section.sectionType] || section.title}.</p>
            <Button onClick={handleExitTask} className="bg-red-600 hover:bg-red-700 mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Task Selection
            </Button>
          </div>
        ) : currentPart ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Part {currentPart.partLabel}</h2>
                {currentPart.title && <p className="text-sm text-neutral-500">{currentPart.title}</p>}
              </div>
              <div className="flex items-center gap-2">
                {currentPart.isPractical && (
                  <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded">Practical</span>
                )}
                <span className="text-sm bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded font-medium">{currentPart.maxMarks || 0} marks</span>
              </div>
            </div>

            {currentPart.contentBlocks && currentPart.contentBlocks.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border p-5">
                <ContentBlockPreview blocks={currentPart.contentBlocks} />
              </div>
            )}

            {currentPart.resources && currentPart.resources.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Starter Files
                </h4>
                <div className="space-y-1">
                  {currentPart.resources.map((resource) => (
                    <button
                      key={resource.id}
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
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
                            alert('Failed to download "' + resource.fileName + '". Please try again or contact your teacher.');
                          }
                        } catch {
                          alert('Failed to download "' + resource.fileName + '". Please check your connection and try again.');
                        }
                      }}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-1 cursor-pointer"
                      data-testid={`link-resource-${resource.id}`}
                    >
                      <Download className="w-3 h-3" />
                      {resource.fileName}
                      {resource.description && <span className="text-xs text-neutral-500">({resource.description})</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentPart.subQuestions && currentPart.subQuestions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Tasks</h3>
                {currentPart.subQuestions.map((q) => (
                  <div key={q.id} className="bg-white dark:bg-neutral-900 border rounded-xl p-5" data-testid={`card-task-${q.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="font-bold">{q.label}</span>
                      {q.inputStyle !== "info-only" && q.maxMarks > 0 && (
                        <span className="text-xs bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded">{q.maxMarks} mark{q.maxMarks !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                    {q.contentBlocks && q.contentBlocks.length > 0 ? (
                      <ContentBlockPreview blocks={q.contentBlocks} />
                    ) : q.questionText ? (
                      <RichTextDisplay content={q.questionText} className="text-sm" />
                    ) : null}
                    {q.subParts && q.subParts.length > 0 ? (
                      <div className="mt-3 ml-4 pl-3 border-l-2 border-neutral-200 dark:border-neutral-700 space-y-3">
                        {q.subParts.map((sp) => (
                          <div key={sp.id} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50" data-testid={`card-subtask-${sp.id}`}>
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-sm font-bold">{sp.label}</span>
                              <span className="text-xs bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded">{sp.maxMarks} mark{sp.maxMarks !== 1 ? "s" : ""}</span>
                            </div>
                            {sp.contentBlocks && sp.contentBlocks.length > 0 ? (
                              <ContentBlockPreview blocks={sp.contentBlocks} />
                            ) : sp.questionText ? (
                              <RichTextDisplay content={sp.questionText} className="text-xs" />
                            ) : null}
                            <QuestionAnswerInput
                              questionId={sp.id}
                              inputStyle={sp.inputStyle}
                              allowFileUpload={sp.allowFileUpload}
                              inputConfig={sp.inputConfig}
                              answer={getAnswer(sp.id)}
                              onAnswerChange={(ans) => updateAnswer(sp.id, ans)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : q.inputStyle !== "info-only" ? (
                      <QuestionAnswerInput
                        questionId={q.id}
                        inputStyle={q.inputStyle}
                        allowFileUpload={q.allowFileUpload}
                        inputConfig={q.inputConfig}
                        answer={getAnswer(q.id)}
                        onAnswerChange={(ans) => updateAnswer(q.id, ans)}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleExitTask}>
                Save & Exit Task
              </Button>
              <Button
                onClick={() => setConfirmSubmit(true)}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-submit-part"
              >
                Submit Part {currentPart.partLabel} & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Part {currentPart?.partLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              Once you submit this part, you will move to the next part and cannot return to Part {currentPart?.partLabel}. Make sure you have completed all tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitPart} className="bg-green-600 hover:bg-green-700">
              Submit & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={infoSheetOpen} onOpenChange={setInfoSheetOpen}>
        <DialogContent
          className="max-w-3xl max-h-[85vh] overflow-y-auto"
          onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = "auto"; }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Information Sheet
              <span className="text-sm font-normal text-neutral-500">
                — {SECTION_TYPE_NAMES[section?.sectionType || ""] || section?.title}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {section?.informationSheet && section.informationSheet.length > 0 ? (
              <ContentBlockPreview blocks={section.informationSheet} />
            ) : (
              <p className="text-neutral-500 text-sm">No information sheet content.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AssignmentView() {
  const [matchList] = useRoute("/assignments");
  const [matchDetail, detailParams] = useRoute("/assignment/:id");
  const [matchTask, taskParams] = useRoute("/assignment/:id/task/:sectionId");

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignmentId = taskParams?.id || detailParams?.id;

  useEffect(() => {
    if (!assignmentId) return;
    setLoading(true);
    fetch(`/api/assignments/${assignmentId}/full`)
      .then(r => {
        if (!r.ok) throw new Error("Assignment not found");
        return r.json();
      })
      .then(data => {
        setAssignment(data);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  if (matchList) {
    return <AssignmentListPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-neutral-500">Loading assignment...</span>
        </div>
      </div>
    );
  }

  if (error || (!assignment && assignmentId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center space-y-4">
          <p className="text-lg text-red-600">{error || "Assignment not found"}</p>
          <Link href="/assignments">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Assignments</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (matchTask && assignment && taskParams?.sectionId) {
    return <TaskWorkPage assignment={assignment} sectionId={taskParams.sectionId} />;
  }

  if (matchDetail && assignment) {
    return <TaskSelectionPage assignment={assignment} />;
  }

  return <AssignmentListPage />;
}
