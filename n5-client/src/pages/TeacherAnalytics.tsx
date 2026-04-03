import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, BarChart3, Users, FileText, BookOpen, Loader2, Activity, Clock, ChevronDown, ChevronUp, CheckCircle2, Eye, Save, Pencil, ClipboardList, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DiagramEditor } from "@/components/ui/diagram-editor";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("teacherToken") || localStorage.getItem("teacher_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchWithAuth(url: string) {
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

type StudentOverview = {
  id: string;
  username: string;
  examResults: Array<{ id?: string; year: number; score: number; maxScore: number; grade: string; timestamp?: string }>;
  assignmentAttempts: Array<{ id?: string; assignmentId: string; status: string; completedAt?: string }>;
};

type StudentDetail = {
  student: { id: string; username: string };
  examResults: Array<{ id: string; year: number; optionalSection?: string; score: number; maxScore: number; grade: string; timestamp?: string }>;
  assignments: Array<{
    attempt: { id: string; assignmentId: string; assignmentTitle: string; status: string; completedAt?: string };
    responses: Array<{ id: string; partId: string; subQuestionId?: string; textAnswer?: string; codeAnswer?: string; marksAwarded?: number; aiFeedback?: string }>;
  }>;
};

type ExamAnalytics = {
  year: number;
  totalResults: number;
  questions: Array<{ questionId: string; averageScore: number; maxScore: number; totalAttempts: number; difficulty: number }>;
};

type AssignmentAnalytics = {
  assignmentId: string;
  title: string;
  questions: Array<{ questionId: string; label: string; averageScore: number; maxScore: number; totalAttempts: number; difficulty: number }>;
};

type ActiveProgress = {
  studentId: string;
  username: string;
  type: "exam" | "assignment";
  label: string;
  timeLeft: number;
  currentQuestion: number;
  answeredCount: number;
  totalQuestions: number;
  answeredQuestionIds?: { id: string; label: string }[];
  updatedAt: string;
};

type ClassInfo = { id: string; name: string };
type AssignmentInfo = { id: string; title: string };

function ScoreBar({ score, maxScore, label }: { score: number; maxScore: number; label?: string }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const color = pct >= 70
    ? "bg-green-500 dark:bg-green-600"
    : pct >= 40
      ? "bg-amber-500 dark:bg-amber-500"
      : "bg-red-500 dark:bg-red-500";

  return (
    <div className="flex items-center gap-2 min-w-[140px]" data-testid="score-bar">
      <div className="flex-1 h-5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-800 dark:text-neutral-100 mix-blend-normal drop-shadow-sm">
          {label ?? `${score}/${maxScore}`}
        </span>
      </div>
      <span className="text-xs text-neutral-500 w-9 text-right">{pct}%</span>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: number }) {
  if (difficulty < 30) {
    return <Badge data-testid="badge-difficulty-easy" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 hover:bg-green-100">Easy ({difficulty}%)</Badge>;
  }
  if (difficulty <= 60) {
    return <Badge data-testid="badge-difficulty-medium" className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 hover:bg-amber-100">Medium ({difficulty}%)</Badge>;
  }
  return <Badge data-testid="badge-difficulty-hard" className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 hover:bg-red-100">Hard ({difficulty}%)</Badge>;
}

function formatTimeLeft(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
  return `${mins}m ${secs}s`;
}

type BreakdownItem = {
  questionTitle: string;
  subLabel: string;
  questionText: string;
  contentBlocks?: any[];
  maxMarks: number;
  score: number;
  userAnswer: Record<string, string> | string;
  inputStyle?: string;
  feedback?: string;
  suggestions?: string;
};

const DIAGRAM_INPUT_STYLES = new Set([
  "drawing", "structure-dataflow", "form-wireframe", "webpage-wireframe",
  "erd-annotation", "nav-structure", "nav-structure-higher", "design-choice"
]);

const INPUT_STYLE_TO_MODE: Record<string, string> = {
  "drawing": "flowchart",
  "structure-dataflow": "structure-dataflow",
  "form-wireframe": "form-wireframe",
  "webpage-wireframe": "webpage-wireframe",
  "erd-annotation": "erd-annotation",
  "nav-structure": "nav-structure",
  "nav-structure-higher": "nav-structure-higher",
  "design-choice": "structure-diagram",
};

function isDiagramAnswer(item: BreakdownItem): boolean {
  if (item.inputStyle && DIAGRAM_INPUT_STYLES.has(item.inputStyle)) return true;
  if (typeof item.userAnswer === "object" && item.userAnswer !== null) {
    const keys = Object.keys(item.userAnswer);
    if (keys.includes("drawing") || keys.includes("erd_diagram") || keys.includes("drawing_canvas")) {
      return true;
    }
  }
  return false;
}

function DiagramAnswerViewer({ item }: { item: BreakdownItem }) {
  const answer = typeof item.userAnswer === "object" ? item.userAnswer : {};
  const diagramData = answer["drawing"] || answer["erd_diagram"] || "";
  const drawingData = answer["drawing_canvas"] || answer["erd_drawing"] || "";
  const inputStyle = item.inputStyle || "";

  const hasVisualData = (diagramData && diagramData.startsWith("[")) || (drawingData && drawingData.startsWith("data:"));

  if (!hasVisualData) return null;

  let mode = INPUT_STYLE_TO_MODE[inputStyle] || "flowchart";

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-900" data-testid="diagram-viewer">
      <div className="h-[350px]">
        <DiagramEditor
          initialData={diagramData}
          initialDrawing={drawingData}
          disabled={true}
          mode={mode as any}
        />
      </div>
    </div>
  );
}

function ExamResultReviewDialog({ examResultId, open, onOpenChange, onUpdated }: {
  examResultId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [editedBreakdown, setEditedBreakdown] = useState<BreakdownItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!examResultId || !open) {
      setResult(null);
      setEditedBreakdown([]);
      return;
    }
    setLoading(true);
    setHasChanges(false);
    setResult(null);
    setEditedBreakdown([]);
    fetchWithAuth(`/api/teacher/exam-results/${examResultId}`)
      .then((data) => {
        setResult(data);
        setEditedBreakdown(data.breakdown || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [examResultId, open]);

  const [editingFeedback, setEditingFeedback] = useState<number | null>(null);

  const updateScore = (index: number, newScore: number) => {
    setEditedBreakdown(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], score: Math.max(0, Math.min(newScore, updated[index].maxMarks)) };
      return updated;
    });
    setHasChanges(true);
  };

  const updateFeedback = (index: number, newFeedback: string) => {
    setEditedBreakdown(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], feedback: newFeedback };
      return updated;
    });
    setHasChanges(true);
  };

  const totalScore = editedBreakdown.reduce((sum, q) => sum + (q.score || 0), 0);
  const totalMax = editedBreakdown.reduce((sum, q) => sum + (q.maxMarks || 0), 0);
  const pct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
  const computedGrade = pct >= 85 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 50 ? "D" : "No Award";

  const handleSave = async () => {
    if (!examResultId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/exam-results/${examResultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ breakdown: editedBreakdown }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setResult(updated);
      setHasChanges(false);
      toast({ title: "Marks updated", description: `New score: ${totalScore}/${totalMax} (${computedGrade})` });
      onUpdated?.();
    } catch (e) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const formatAnswer = (answer: Record<string, string> | string): string => {
    if (typeof answer === "string") return answer;
    if (!answer || typeof answer !== "object") return "";
    return Object.entries(answer)
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden" style={{ width: "100%", maxWidth: "64rem" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between" data-testid="text-exam-review-title">
            <span>Exam Result Review</span>
            {result && (
              <div className="flex items-center gap-2 text-sm font-normal">
                <span>{totalScore}/{totalMax}</span>
                <Badge variant="outline">{hasChanges ? computedGrade : (result.grade || computedGrade)}</Badge>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {!loading && result && editedBreakdown.length > 0 && (
          <div className="space-y-4 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">
                {result.year > 0 ? `${result.year} Paper` : "Additional Paper"}
                {result.optionalSection ? ` (${result.optionalSection === "dd" ? "Database" : "Web"})` : ""}
              </p>
              {hasChanges && (
                <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1" data-testid="button-save-marks">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save Changes
                </Button>
              )}
            </div>

            {editedBreakdown.map((item, idx) => (
              <Card key={idx} className="border-neutral-200 dark:border-neutral-800" data-testid={`card-question-${idx}`}>
                <CardHeader className="py-3 px-4 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {item.questionTitle} {item.subLabel ? `(${item.subLabel})` : ""}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={item.maxMarks}
                        value={item.score}
                        onChange={(e) => updateScore(idx, parseInt(e.target.value) || 0)}
                        className="w-16 h-7 text-center text-sm"
                        data-testid={`input-score-${idx}`}
                      />
                      <span className="text-sm text-neutral-500">/ {item.maxMarks}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-3 px-4 space-y-3 min-w-0">
                  {item.questionText && (
                    <div>
                      <p className="text-xs font-medium text-neutral-400 mb-1">Question</p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{item.questionText}</p>
                    </div>
                  )}
                  {item.contentBlocks && item.contentBlocks.length > 0 && !item.questionText && (
                    <div>
                      <p className="text-xs font-medium text-neutral-400 mb-1">Question</p>
                      <div className="text-sm text-neutral-700 dark:text-neutral-300">
                        {item.contentBlocks.filter((b: any) => b.type === "text").map((b: any, bi: number) => (
                          <p key={bi}>{b.content}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-neutral-400 mb-1">Student Answer</p>
                    {isDiagramAnswer(item) ? (
                      <DiagramAnswerViewer item={item} />
                    ) : (
                      <pre className="text-sm bg-neutral-100 dark:bg-neutral-800 rounded p-2 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
                        {formatAnswer(item.userAnswer) || <span className="text-neutral-400 italic">No answer provided</span>}
                      </pre>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-neutral-400">Feedback</p>
                      <button
                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                        onClick={() => setEditingFeedback(editingFeedback === idx ? null : idx)}
                        data-testid={`button-edit-feedback-${idx}`}
                      >
                        <Pencil className="h-3 w-3" />
                        {editingFeedback === idx ? "Done" : "Edit"}
                      </button>
                    </div>
                    {editingFeedback === idx ? (
                      <Textarea
                        value={item.feedback || ""}
                        onChange={(e) => updateFeedback(idx, e.target.value)}
                        className="text-sm min-h-[80px] w-full"
                        data-testid={`textarea-feedback-${idx}`}
                      />
                    ) : (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap" style={{ overflowWrap: "anywhere" }}>{item.feedback || <span className="italic text-neutral-400">No feedback</span>}</p>
                    )}
                  </div>
                  {item.suggestions && (
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-blue-400 mb-1">Suggestions</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400" style={{ overflowWrap: "anywhere" }}>{item.suggestions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {hasChanges && (
              <div className="sticky bottom-0 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between rounded-b-lg">
                <div className="text-sm">
                  <span className="font-medium">New Total: {totalScore}/{totalMax}</span>
                  <Badge variant="outline" className="ml-2">{computedGrade}</Badge>
                </div>
                <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        )}

        {!loading && result && editedBreakdown.length === 0 && (
          <p className="text-sm text-neutral-500 py-4">No detailed breakdown available for this result.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ClassOverviewTab() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [overview, setOverview] = useState<StudentOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeProgress, setActiveProgress] = useState<ActiveProgress[]>([]);
  const [expandedProgress, setExpandedProgress] = useState<Set<string>>(new Set());
  const [reviewExamId, setReviewExamId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [orphanedResults, setOrphanedResults] = useState<any[]>([]);
  const [orphansLoading, setOrphansLoading] = useState(false);
  const [showOrphans, setShowOrphans] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWithAuth("/api/teacher/classes").then((data: ClassInfo[]) => {
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedClassId) { setOverview([]); setActiveProgress([]); return; }
    setLoading(true);
    fetchWithAuth(`/api/teacher/classes/${selectedClassId}/overview`)
      .then(setOverview)
      .catch(console.error)
      .finally(() => setLoading(false));

    fetchWithAuth(`/api/teacher/classes/${selectedClassId}/active-progress`)
      .then(setActiveProgress)
      .catch(console.error);

    const interval = setInterval(() => {
      fetchWithAuth(`/api/teacher/classes/${selectedClassId}/active-progress`)
        .then(setActiveProgress)
        .catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedClassId]);

  const loadStudentDetail = useCallback(async (studentId: string) => {
    try {
      const detail = await fetchWithAuth(`/api/teacher/students/${studentId}/detail`);
      setSelectedStudent(detail);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadOrphanedResults = useCallback(async () => {
    setOrphansLoading(true);
    try {
      const results = await fetchWithAuth("/api/teacher/orphaned-exam-results");
      setOrphanedResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setOrphansLoading(false);
    }
  }, []);

  const handleLinkResult = useCallback(async (examResultId: string, studentId: string) => {
    setLinkingId(examResultId);
    try {
      const res = await fetch("/api/teacher/link-exam-result", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ examResultId, studentId }),
      });
      if (!res.ok) throw new Error("Failed to link result");
      toast({ title: "Result linked successfully" });
      setOrphanedResults(prev => prev.filter(r => r.id !== examResultId));
      await loadStudentDetail(studentId);
    } catch (e) {
      toast({ title: "Failed to link result", variant: "destructive" });
    } finally {
      setLinkingId(null);
    }
  }, [loadStudentDetail, toast]);

  const openStudentDetail = useCallback(async (studentId: string) => {
    setDetailLoading(true);
    setDetailOpen(true);
    setShowOrphans(false);
    setOrphanedResults([]);
    try {
      await loadStudentDetail(studentId);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  }, [loadStudentDetail]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {classes.length > 1 ? (
          <div className="flex gap-2">
            {classes.map(c => (
              <Button
                key={c.id}
                variant={selectedClassId === c.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedClassId(c.id)}
                data-testid={`btn-class-${c.id}`}
              >
                {c.name}
              </Button>
            ))}
          </div>
        ) : classes.length === 1 ? (
          <h3 className="text-lg font-semibold" data-testid="text-class-name">{classes[0].name}</h3>
        ) : null}
      </div>

      {!loading && selectedClassId && activeProgress.length > 0 && (
        <Card className="border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-green-600" />
              Currently Active ({activeProgress.length} student{activeProgress.length !== 1 ? "s" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3">
              {activeProgress.map((ap) => {
                const isStale = new Date().getTime() - new Date(ap.updatedAt).getTime() > 5 * 60 * 1000;
                const progressKey = ap.studentId + ap.type + ap.label;
                const isExpanded = expandedProgress.has(progressKey);
                const hasQuestionDetail = ap.answeredQuestionIds && ap.answeredQuestionIds.length > 0;
                return (
                  <div
                    key={progressKey}
                    className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden"
                    data-testid={`active-progress-${ap.studentId}`}
                  >
                    <div
                      className={`flex items-center justify-between px-4 py-3 ${hasQuestionDetail ? "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50" : ""}`}
                      onClick={() => {
                        if (!hasQuestionDetail) return;
                        setExpandedProgress(prev => {
                          const next = new Set(prev);
                          if (next.has(progressKey)) next.delete(progressKey);
                          else next.add(progressKey);
                          return next;
                        });
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="font-medium text-sm">{ap.username}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className={ap.type === "exam" ? "border-blue-300 text-blue-600" : "border-amber-300 text-amber-600"}>
                              {ap.type === "exam" ? "Exam" : "Assignment"}
                            </Badge>
                            <span className="text-xs text-neutral-500">{ap.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeLeft(ap.timeLeft)}</span>
                          </div>
                          <div className="text-xs text-neutral-500">
                            Q{ap.currentQuestion + 1} of {ap.totalQuestions} ({ap.answeredCount} answered)
                          </div>
                        </div>
                        {isStale && (
                          <Badge variant="outline" className="border-orange-300 text-orange-500 text-xs">
                            Idle
                          </Badge>
                        )}
                        {hasQuestionDetail && (
                          isExpanded ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />
                        )}
                      </div>
                    </div>
                    {isExpanded && hasQuestionDetail && (
                      <div className="px-4 pb-3 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                        <p className="text-xs font-medium text-neutral-500 mb-2">Answered Questions:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ap.answeredQuestionIds!.map((q) => (
                            <Badge key={q.id} variant="secondary" className="text-xs gap-1 font-normal">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              {q.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
        </div>
      )}

      {!loading && selectedClassId && overview.length === 0 && (
        <div className="text-center py-12 text-neutral-500" data-testid="text-no-students">No students found in this class.</div>
      )}

      {!loading && overview.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table data-testid="table-class-overview">
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Latest Exam Score</TableHead>
                  <TableHead>Exams Completed</TableHead>
                  <TableHead>Assignments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.map(student => {
                  const latestExam = student.examResults.length > 0
                    ? student.examResults.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""))[0]
                    : null;
                  const completedAssignments = student.assignmentAttempts.filter(a => a.status === "completed").length;
                  const inProgressAssignments = student.assignmentAttempts.filter(a => a.status === "in_progress" || a.status === "paused").length;

                  return (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
                      onClick={() => openStudentDetail(student.id)}
                      data-testid={`row-student-${student.id}`}
                    >
                      <TableCell className="font-medium" data-testid={`text-username-${student.id}`}>{student.username}</TableCell>
                      <TableCell data-testid={`text-exam-score-${student.id}`}>
                        {latestExam ? (
                          <ScoreBar score={latestExam.score} maxScore={latestExam.maxScore} label={`${latestExam.score}/${latestExam.maxScore} (${latestExam.grade})`} />
                        ) : "—"}
                      </TableCell>
                      <TableCell data-testid={`text-exams-count-${student.id}`}>
                        {student.examResults.length > 0 ? (
                          <Badge variant="default">{student.examResults.length}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell data-testid={`text-status-${student.id}`}>
                        {student.assignmentAttempts.length > 0 ? (
                          <div className="flex gap-1">
                            {completedAssignments > 0 && (
                              <Badge variant="default">{completedAssignments} done</Badge>
                            )}
                            {inProgressAssignments > 0 && (
                              <Badge variant="secondary">{inProgressAssignments} in progress</Badge>
                            )}
                          </div>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-student-detail-title">
              {selectedStudent ? `Student: ${selectedStudent.student.username}` : "Student Detail"}
            </DialogTitle>
          </DialogHeader>

          {detailLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
            </div>
          )}

          {!detailLoading && selectedStudent && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Exam Results</h3>
                {selectedStudent.examResults.length === 0 ? (
                  <p className="text-sm text-neutral-500">No exam results yet.</p>
                ) : (
                  <div className="space-y-2" data-testid="list-exam-results">
                    {selectedStudent.examResults.map((er, i) => (
                      <div
                        key={er.id || i}
                        className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group"
                        data-testid={`exam-result-${i}`}
                        onClick={() => {
                          if (er.id) {
                            setReviewExamId(er.id);
                            setReviewOpen(true);
                          }
                        }}
                      >
                        <span className="font-medium">{er.year > 0 ? er.year : "Additional"}{er.optionalSection ? ` (${er.optionalSection === "dd" ? "Database" : er.optionalSection === "wd" ? "Web" : er.optionalSection})` : ""}</span>
                        <div className="flex-1 max-w-[180px] mx-4">
                          <ScoreBar score={er.score} maxScore={er.maxScore} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{er.grade}</Badge>
                          <Eye className="h-3.5 w-3.5 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                {!showOrphans ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowOrphans(true); loadOrphanedResults(); }}
                    data-testid="btn-show-orphans"
                  >
                    Link Unlinked Exam Results
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Unlinked Exam Results</h3>
                    <p className="text-xs text-neutral-500">These results were saved without a student account. Click "Link" to assign one to this student.</p>
                    {orphansLoading && <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />}
                    {!orphansLoading && orphanedResults.length === 0 && (
                      <p className="text-sm text-neutral-500">No unlinked results found.</p>
                    )}
                    {!orphansLoading && orphanedResults.length > 0 && (
                      <div className="space-y-2">
                        {orphanedResults.map((or) => (
                          <div key={or.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" data-testid={`orphan-result-${or.id}`}>
                            <div>
                              <span className="font-medium text-sm">{or.year > 0 ? `${or.year} Paper` : "Mock Exam"}</span>
                              {or.optionalSection && <span className="text-xs text-neutral-500 ml-1">({or.optionalSection === "dd" ? "Database" : "Web"})</span>}
                              <span className="text-sm ml-2">{or.score}/{or.maxScore} ({or.grade})</span>
                              {or.timestamp && <span className="text-xs text-neutral-400 ml-2">{new Date(or.timestamp).toLocaleDateString()}</span>}
                            </div>
                            <Button
                              size="sm"
                              variant="default"
                              disabled={linkingId === or.id}
                              onClick={() => selectedStudent && handleLinkResult(or.id, selectedStudent.student.id)}
                              data-testid={`btn-link-${or.id}`}
                            >
                              {linkingId === or.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Link to Student"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Assignment Attempts</h3>
                {selectedStudent.assignments.length === 0 ? (
                  <p className="text-sm text-neutral-500">No assignment attempts yet.</p>
                ) : (
                  <div className="space-y-3" data-testid="list-assignment-attempts">
                    {selectedStudent.assignments.map((a, i) => (
                      <Card key={a.attempt.id || i} data-testid={`assignment-attempt-${i}`}>
                        <CardHeader className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{a.attempt.assignmentTitle}</CardTitle>
                            <Badge variant={a.attempt.status === "completed" ? "default" : "secondary"}>
                              {a.attempt.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        {a.responses.length > 0 && (
                          <CardContent className="py-2 px-4">
                            <div className="space-y-1">
                              {a.responses.map((r, ri) => (
                                <div key={r.id || ri} className="text-xs flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                                  <span className="text-neutral-500">Q{ri + 1}</span>
                                  <span>{r.marksAwarded !== null && r.marksAwarded !== undefined ? `${r.marksAwarded} marks` : "Not graded"}</span>
                                  {r.aiFeedback && (
                                    <span className="text-neutral-400 truncate max-w-[200px]" title={r.aiFeedback}>{r.aiFeedback}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ExamResultReviewDialog
        examResultId={reviewExamId}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onUpdated={() => {
          if (selectedStudent) {
            loadStudentDetail(selectedStudent.student.id);
          }
          if (selectedClassId) {
            fetchWithAuth(`/api/teacher/classes/${selectedClassId}/overview`)
              .then(setOverview)
              .catch(console.error);
          }
        }}
      />
    </div>
  );
}

function StudentResultsTab() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [students, setStudents] = useState<StudentOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null);
  const [paperBreakdown, setPaperBreakdown] = useState<BreakdownItem[]>([]);
  const [paperLoading, setPaperLoading] = useState(false);
  const [editedBreakdown, setEditedBreakdown] = useState<BreakdownItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingFeedbackIdx, setEditingFeedbackIdx] = useState<number | null>(null);
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(null);

  useEffect(() => {
    fetchWithAuth("/api/teacher/classes").then((data: ClassInfo[]) => {
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedClassId) { setStudents([]); return; }
    setLoading(true);
    setExpandedStudent(null);
    setStudentDetail(null);
    setExpandedPaper(null);
    fetchWithAuth(`/api/teacher/classes/${selectedClassId}/overview`)
      .then(setStudents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedClassId]);

  const toggleStudent = async (studentId: string) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
      setStudentDetail(null);
      setExpandedPaper(null);
      return;
    }
    setExpandedStudent(studentId);
    setExpandedPaper(null);
    setDetailLoading(true);
    try {
      const detail = await fetchWithAuth(`/api/teacher/students/${studentId}/detail`);
      setStudentDetail(detail);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const loadPaperBreakdown = async (examResultId: string) => {
    if (expandedPaper === examResultId) {
      setExpandedPaper(null);
      setPaperBreakdown([]);
      setEditedBreakdown([]);
      setHasChanges(false);
      setCurrentPaperId(null);
      setEditingFeedbackIdx(null);
      return;
    }
    setExpandedPaper(examResultId);
    setCurrentPaperId(examResultId);
    setPaperLoading(true);
    setHasChanges(false);
    setEditingFeedbackIdx(null);
    try {
      const data = await fetchWithAuth(`/api/teacher/exam-results/${examResultId}`);
      setPaperBreakdown(data.breakdown || []);
      setEditedBreakdown(data.breakdown || []);
    } catch (e) {
      console.error(e);
    } finally {
      setPaperLoading(false);
    }
  };

  const updateScore = (index: number, newScore: number) => {
    setEditedBreakdown(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], score: Math.max(0, Math.min(newScore, updated[index].maxMarks)) };
      return updated;
    });
    setHasChanges(true);
  };

  const updateFeedback = (index: number, newFeedback: string) => {
    setEditedBreakdown(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], feedback: newFeedback };
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!currentPaperId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/exam-results/${currentPaperId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ breakdown: editedBreakdown }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setPaperBreakdown(updated.breakdown || []);
      setEditedBreakdown(updated.breakdown || []);
      setHasChanges(false);
      const totalScore = (updated.breakdown || []).reduce((s: number, q: any) => s + (q.score || 0), 0);
      const totalMax = (updated.breakdown || []).reduce((s: number, q: any) => s + (q.maxMarks || 0), 0);
      toast({ title: "Changes saved", description: `Score: ${updated.score}/${updated.maxScore} (${updated.grade})` });
      if (expandedStudent) {
        fetchWithAuth(`/api/teacher/classes/${selectedClassId}/overview`)
          .then(setStudents)
          .catch(console.error);
        fetchWithAuth(`/api/teacher/students/${expandedStudent}/detail`)
          .then(setStudentDetail)
          .catch(console.error);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExamResult = async (examResultId: string) => {
    try {
      const res = await fetch(`/api/teacher/exam-results/${examResultId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Exam result removed" });
      if (expandedPaper === examResultId) {
        setExpandedPaper(null);
        setPaperBreakdown([]);
        setEditedBreakdown([]);
      }
      if (expandedStudent) {
        const detail = await fetchWithAuth(`/api/teacher/students/${expandedStudent}/detail`);
        setStudentDetail(detail);
        fetchWithAuth(`/api/teacher/classes/${selectedClassId}/overview`).then(setStudents).catch(console.error);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to remove exam result", variant: "destructive" });
    }
  };

  const handleDeleteAssignmentAttempt = async (attemptId: string) => {
    try {
      const res = await fetch(`/api/teacher/assignment-attempts/${attemptId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Assignment attempt removed" });
      if (expandedStudent) {
        const detail = await fetchWithAuth(`/api/teacher/students/${expandedStudent}/detail`);
        setStudentDetail(detail);
        fetchWithAuth(`/api/teacher/classes/${selectedClassId}/overview`).then(setStudents).catch(console.error);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to remove assignment attempt", variant: "destructive" });
    }
  };

  const formatAnswer = (answer: Record<string, string> | string): string => {
    if (typeof answer === "string") return answer;
    if (!answer || typeof answer !== "object") return "";
    return Object.entries(answer)
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  };

  const totalScore = editedBreakdown.reduce((sum, q) => sum + (q.score || 0), 0);
  const totalMax = editedBreakdown.reduce((sum, q) => sum + (q.maxMarks || 0), 0);
  const pct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
  const computedGrade = pct >= 85 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 50 ? "D" : "No Award";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {classes.length > 1 ? (
          <div className="flex gap-2">
            {classes.map(c => (
              <Button
                key={c.id}
                variant={selectedClassId === c.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedClassId(c.id)}
                data-testid={`btn-results-class-${c.id}`}
              >
                {c.name}
              </Button>
            ))}
          </div>
        ) : classes.length === 1 ? (
          <h3 className="text-lg font-semibold" data-testid="text-results-class-name">{classes[0].name}</h3>
        ) : null}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
        </div>
      )}

      {!loading && selectedClassId && students.length === 0 && (
        <div className="text-center py-12 text-neutral-500">No students found in this class.</div>
      )}

      {!loading && students.length > 0 && (
        <div className="space-y-3">
          {students.map(student => {
            const isExpanded = expandedStudent === student.id;
            const examCount = student.examResults.length;
            const assignmentCount = student.assignmentAttempts.filter(a => a.status === "completed").length;
            const totalItems = examCount + assignmentCount;
            const latestExam = examCount > 0
              ? student.examResults.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""))[0]
              : null;
            const avgPct = examCount > 0
              ? Math.round(student.examResults.reduce((sum, er) => sum + (er.maxScore > 0 ? (er.score / er.maxScore) * 100 : 0), 0) / examCount)
              : null;

            return (
              <Card key={student.id} className="overflow-hidden" data-testid={`student-card-${student.id}`}>
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                  onClick={() => toggleStudent(student.id)}
                  data-testid={`student-toggle-${student.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-neutral-400" />
                    <span className="font-medium text-sm" data-testid={`student-name-${student.id}`}>{student.username}</span>
                    {totalItems > 0 && (
                      <Badge variant="secondary" className="text-xs" data-testid={`student-count-${student.id}`}>
                        {examCount > 0 ? `${examCount} paper${examCount !== 1 ? "s" : ""}` : ""}
                        {examCount > 0 && assignmentCount > 0 ? ", " : ""}
                        {assignmentCount > 0 ? `${assignmentCount} assignment${assignmentCount !== 1 ? "s" : ""}` : ""}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {avgPct !== null && (
                      <span className="text-sm text-neutral-500" data-testid={`student-avg-${student.id}`}>
                        Avg: {avgPct}%
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-neutral-200 dark:border-neutral-800">
                    {detailLoading && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
                      </div>
                    )}

                    {!detailLoading && studentDetail && (
                      <div className="p-4 space-y-3">
                        {(() => {
                          const exams = studentDetail.examResults;
                          const completedAssignments = studentDetail.assignments.filter(a => a.attempt.status === "completed");
                          const examAvg = exams.length > 0
                            ? Math.round(exams.reduce((sum, er) => sum + (er.maxScore > 0 ? (er.score / er.maxScore) * 100 : 0), 0) / exams.length)
                            : null;
                          return (exams.length > 0 || completedAssignments.length > 0) ? (
                            <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-lg px-4 py-3 flex flex-wrap gap-4 items-center" data-testid="student-average-summary">
                              {examAvg !== null && (
                                <div className="text-sm">
                                  <span className="text-neutral-500">Exam Average:</span>{" "}
                                  <span className="font-semibold">{examAvg}%</span>
                                  <span className="text-neutral-400 ml-1">({exams.length} paper{exams.length !== 1 ? "s" : ""})</span>
                                </div>
                              )}
                              {completedAssignments.length > 0 && (
                                <div className="text-sm">
                                  <span className="text-neutral-500">Assignments:</span>{" "}
                                  <span className="font-semibold">{completedAssignments.length} completed</span>
                                </div>
                              )}
                            </div>
                          ) : null;
                        })()}

                        {studentDetail.examResults.length === 0 && (
                          <p className="text-sm text-neutral-500">No exam results.</p>
                        )}

                        {studentDetail.examResults
                          .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""))
                          .map((er) => {
                            const paperLabel = er.year > 0
                              ? `${er.year} Paper${er.optionalSection ? ` (${er.optionalSection === "dd" ? "Database" : er.optionalSection === "wd" ? "Web" : er.optionalSection})` : ""}`
                              : `Additional Paper${er.optionalSection ? ` (${er.optionalSection === "dd" ? "Database" : er.optionalSection === "wd" ? "Web" : er.optionalSection})` : ""}`;
                            const isPaperExpanded = expandedPaper === er.id;

                            return (
                              <div key={er.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden" data-testid={`paper-card-${er.id}`}>
                                <div
                                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                  onClick={() => loadPaperBreakdown(er.id)}
                                  data-testid={`paper-toggle-${er.id}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-medium">{paperLabel}</span>
                                    {er.timestamp && (
                                      <span className="text-xs text-neutral-400">{new Date(er.timestamp).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-[140px]">
                                      <ScoreBar score={er.score} maxScore={er.maxScore} />
                                    </div>
                                    <Badge variant="outline">{er.grade}</Badge>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <button
                                          className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                                          onClick={(e) => e.stopPropagation()}
                                          data-testid={`btn-delete-exam-${er.id}`}
                                          title="Remove this exam result"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Remove Exam Result?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently remove the {paperLabel} result ({er.score}/{er.maxScore}) from this student's record. This cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteExamResult(er.id)} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                    {isPaperExpanded ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
                                  </div>
                                </div>

                                {isPaperExpanded && (
                                  <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                                    {paperLoading && (
                                      <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                      </div>
                                    )}

                                    {!paperLoading && editedBreakdown.length === 0 && (
                                      <p className="text-sm text-neutral-500 p-4">No detailed breakdown available.</p>
                                    )}

                                    {!paperLoading && editedBreakdown.length > 0 && (
                                      <div className="p-4 space-y-3">
                                        {hasChanges && (
                                          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
                                            <div className="text-sm">
                                              <span className="font-medium">Updated Total: {totalScore}/{totalMax}</span>
                                              <Badge variant="outline" className="ml-2">{computedGrade}</Badge>
                                            </div>
                                            <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1" data-testid="button-save-results">
                                              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                              Save Changes
                                            </Button>
                                          </div>
                                        )}

                                        {editedBreakdown.map((item, idx) => (
                                          <Card key={idx} className="border-neutral-200 dark:border-neutral-700" data-testid={`result-question-${idx}`}>
                                            <CardHeader className="py-2 px-4 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                                              <div className="flex items-center justify-between">
                                                <CardTitle className="text-sm font-medium">
                                                  {item.questionTitle} {item.subLabel ? `(${item.subLabel})` : ""}
                                                </CardTitle>
                                                <div className="flex items-center gap-2">
                                                  <Input
                                                    type="number"
                                                    min={0}
                                                    max={item.maxMarks}
                                                    value={item.score}
                                                    onChange={(e) => updateScore(idx, parseInt(e.target.value) || 0)}
                                                    className="w-16 h-7 text-center text-sm"
                                                    data-testid={`result-score-${idx}`}
                                                  />
                                                  <span className="text-sm text-neutral-500">/ {item.maxMarks}</span>
                                                </div>
                                              </div>
                                            </CardHeader>
                                            <CardContent className="py-3 px-4 space-y-3">
                                              {item.questionText && (
                                                <div>
                                                  <p className="text-xs font-medium text-neutral-400 mb-1">Question</p>
                                                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{item.questionText}</p>
                                                </div>
                                              )}
                                              {item.contentBlocks && item.contentBlocks.length > 0 && !item.questionText && (
                                                <div>
                                                  <p className="text-xs font-medium text-neutral-400 mb-1">Question</p>
                                                  <div className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    {item.contentBlocks.filter((b: any) => b.type === "text").map((b: any, bi: number) => (
                                                      <p key={bi}>{b.content}</p>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              <div>
                                                <p className="text-xs font-medium text-neutral-400 mb-1">Student Answer</p>
                                                {isDiagramAnswer(item) ? (
                                                  <DiagramAnswerViewer item={item} />
                                                ) : (
                                                  <pre className="text-sm bg-neutral-100 dark:bg-neutral-800 rounded p-2 whitespace-pre-wrap break-words font-mono max-h-40 overflow-y-auto">
                                                    {formatAnswer(item.userAnswer) || <span className="text-neutral-400 italic">No answer provided</span>}
                                                  </pre>
                                                )}
                                              </div>
                                              <div>
                                                <div className="flex items-center justify-between mb-1">
                                                  <p className="text-xs font-medium text-neutral-400">Feedback</p>
                                                  <button
                                                    className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                                                    onClick={() => setEditingFeedbackIdx(editingFeedbackIdx === idx ? null : idx)}
                                                    data-testid={`result-edit-feedback-${idx}`}
                                                  >
                                                    <Pencil className="h-3 w-3" />
                                                    {editingFeedbackIdx === idx ? "Done" : "Edit"}
                                                  </button>
                                                </div>
                                                {editingFeedbackIdx === idx ? (
                                                  <Textarea
                                                    value={item.feedback || ""}
                                                    onChange={(e) => updateFeedback(idx, e.target.value)}
                                                    className="text-sm min-h-[80px]"
                                                    data-testid={`result-feedback-textarea-${idx}`}
                                                  />
                                                ) : (
                                                  <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{item.feedback || <span className="italic text-neutral-400">No feedback</span>}</p>
                                                )}
                                              </div>
                                              {item.suggestions && (
                                                <div>
                                                  <p className="text-xs font-medium text-blue-400 mb-1">Suggestions</p>
                                                  <p className="text-sm text-blue-600 dark:text-blue-400">{item.suggestions}</p>
                                                </div>
                                              )}
                                            </CardContent>
                                          </Card>
                                        ))}

                                        {hasChanges && (
                                          <div className="sticky bottom-0 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 flex items-center justify-between shadow-lg">
                                            <div className="text-sm">
                                              <span className="font-medium">Total: {totalScore}/{totalMax}</span>
                                              <Badge variant="outline" className="ml-2">{computedGrade}</Badge>
                                            </div>
                                            <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1">
                                              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                              Save Changes
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                        {studentDetail.assignments.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Assignments</h4>
                            {studentDetail.assignments.map((a, i) => (
                              <div key={a.attempt.id || i} className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-3 mb-2" data-testid={`assignment-card-${i}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">{a.attempt.assignmentTitle}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={a.attempt.status === "completed" ? "default" : "secondary"}>
                                      {a.attempt.status}
                                    </Badge>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <button
                                          className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                                          data-testid={`btn-delete-assignment-${a.attempt.id}`}
                                          title="Remove this assignment attempt"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Remove Assignment Attempt?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently remove the "{a.attempt.assignmentTitle}" attempt from this student's record. This cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteAssignmentAttempt(a.attempt.id)} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                                {a.responses.length > 0 && (
                                  <div className="space-y-1">
                                    {a.responses.map((r, ri) => (
                                      <div key={r.id || ri} className="text-xs flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                                        <span className="text-neutral-500">Q{ri + 1}</span>
                                        <span>{r.marksAwarded !== null && r.marksAwarded !== undefined ? `${r.marksAwarded} marks` : "Not graded"}</span>
                                        {r.aiFeedback && (
                                          <span className="text-neutral-400 truncate max-w-[250px]" title={r.aiFeedback}>{r.aiFeedback}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PaperAnalyticsTab() {
  const [year, setYear] = useState<string>("");
  const [analytics, setAnalytics] = useState<ExamAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const years = [2022, 2023, 2024, 2025];

  useEffect(() => {
    if (!year) { setAnalytics(null); return; }
    setLoading(true);
    fetchWithAuth(`/api/teacher/analytics/exam/${year}`)
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-48" data-testid="select-exam-year">
            <SelectValue placeholder="Select year..." />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={y.toString()} data-testid={`select-year-${y}`}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {analytics && (
          <span className="text-sm text-neutral-500" data-testid="text-total-results">{analytics.totalResults} total results</span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
        </div>
      )}

      {!loading && analytics && analytics.questions.length === 0 && (
        <div className="text-center py-12 text-neutral-500" data-testid="text-no-exam-data">No exam data available for this year.</div>
      )}

      {!loading && analytics && analytics.questions.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table data-testid="table-exam-analytics">
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Max Score</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Difficulty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.questions.map(q => (
                  <TableRow key={q.questionId} data-testid={`row-exam-question-${q.questionId}`}>
                    <TableCell className="font-medium">{q.questionId}</TableCell>
                    <TableCell><ScoreBar score={q.averageScore} maxScore={q.maxScore} /></TableCell>
                    <TableCell>{q.maxScore}</TableCell>
                    <TableCell>{q.totalAttempts}</TableCell>
                    <TableCell><DifficultyBadge difficulty={q.difficulty} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AssignmentAnalyticsTab() {
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [analytics, setAnalytics] = useState<AssignmentAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/n5/assignments").then(r => r.json()).then(setAssignments).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedId) { setAnalytics(null); return; }
    setLoading(true);
    fetchWithAuth(`/api/teacher/analytics/assignment/${selectedId}`)
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-80" data-testid="select-assignment">
            <SelectValue placeholder="Select assignment..." />
          </SelectTrigger>
          <SelectContent>
            {assignments.map(a => (
              <SelectItem key={a.id} value={a.id} data-testid={`select-assignment-${a.id}`}>{a.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
        </div>
      )}

      {!loading && analytics && analytics.questions.length === 0 && (
        <div className="text-center py-12 text-neutral-500" data-testid="text-no-assignment-data">No analytics data available for this assignment.</div>
      )}

      {!loading && analytics && analytics.questions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base" data-testid="text-assignment-title">{analytics.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table data-testid="table-assignment-analytics">
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Max Score</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Difficulty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.questions.map(q => (
                  <TableRow key={q.questionId} data-testid={`row-assignment-question-${q.questionId}`}>
                    <TableCell className="font-medium">{q.questionId.slice(0, 8)}</TableCell>
                    <TableCell>{q.label || "—"}</TableCell>
                    <TableCell><ScoreBar score={q.averageScore} maxScore={q.maxScore} /></TableCell>
                    <TableCell>{q.maxScore}</TableCell>
                    <TableCell>{q.totalAttempts}</TableCell>
                    <TableCell><DifficultyBadge difficulty={q.difficulty} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function TeacherAnalytics() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("teacherToken") || localStorage.getItem("teacher_token");
    const expires = localStorage.getItem("teacherTokenExpires") || localStorage.getItem("teacher_token_expires");
    if (!token || !expires || parseInt(expires) < Date.now()) {
      localStorage.removeItem("teacherToken");
      localStorage.removeItem("teacherTokenExpires");
      localStorage.removeItem("teacher_token");
      localStorage.removeItem("teacher_token_expires");
      setLocation("/teacher/login");
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-[200]">
        <div className="container mx-auto max-w-6xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/teacher/dashboard")} data-testid="button-back-dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Button>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white" data-testid="text-analytics-title">Analytics</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl p-6">
        <Tabs defaultValue="class-overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-analytics">
            <TabsTrigger value="class-overview" className="flex items-center gap-2" data-testid="tab-class-overview">
              <Users className="h-4 w-4" /> Class Overview
            </TabsTrigger>
            <TabsTrigger value="student-results" className="flex items-center gap-2" data-testid="tab-student-results">
              <ClipboardList className="h-4 w-4" /> Student Results
            </TabsTrigger>
            <TabsTrigger value="paper-analytics" className="flex items-center gap-2" data-testid="tab-paper-analytics">
              <FileText className="h-4 w-4" /> Paper Analytics
            </TabsTrigger>
            <TabsTrigger value="assignment-analytics" className="flex items-center gap-2" data-testid="tab-assignment-analytics">
              <BookOpen className="h-4 w-4" /> Assignment Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="class-overview">
            <ClassOverviewTab />
          </TabsContent>

          <TabsContent value="student-results">
            <StudentResultsTab />
          </TabsContent>

          <TabsContent value="paper-analytics">
            <PaperAnalyticsTab />
          </TabsContent>

          <TabsContent value="assignment-analytics">
            <AssignmentAnalyticsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
