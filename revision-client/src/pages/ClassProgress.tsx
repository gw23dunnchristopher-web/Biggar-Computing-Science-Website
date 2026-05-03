import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, BarChart3, TrendingUp, Clock, ChevronRight, AlertTriangle, FileText, Loader2, Star, Eye, Save, X, Pencil, GraduationCap, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function FormattedAnswer({ answer, inputStyle }: { answer: string; inputStyle?: string }) {
  const tryParseJson = (str: string): any => {
    try { return JSON.parse(str); } catch { return null; }
  };

  const parsed = tryParseJson(answer);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    if (parsed.design_mode) {
      return (
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs">{parsed.design_mode}</Badge>
          {parsed.main && <p className="whitespace-pre-wrap">{parsed.main}</p>}
        </div>
      );
    }

    const entries = Object.entries(parsed).filter(([_, v]) => v && String(v).trim());
    if (entries.length > 0) {
      return (
        <div className="space-y-1.5">
          {entries.map(([key, value]) => (
            <div key={key}>
              <span className="font-medium text-xs text-neutral-500 uppercase">{key}: </span>
              <span className="whitespace-pre-wrap">{String(value)}</span>
            </div>
          ))}
        </div>
      );
    }
  }

  if (parsed && Array.isArray(parsed)) {
    const items = parsed.filter(item => typeof item === "object" && item !== null);
    if (items.length > 0) {
      return (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              {Object.entries(item).filter(([_, v]) => v && String(v).trim()).map(([key, value]) => (
                <span key={key}><span className="text-xs text-neutral-500">{key}:</span> {String(value)}</span>
              ))}
            </div>
          ))}
        </div>
      );
    }
  }

  const text = typeof answer === "string" ? answer : String(answer);
  const display = text.length > 500 ? text.substring(0, 500) + "..." : text;
  return <span>{display}</span>;
}

interface StudentProgress {
  id: string;
  username: string;
  examCount: number;
  averageScore: number;
  examsInProgress: number;
  assignmentsInProgress: number;
  assignmentsCompleted: number;
  lastActive: string | null;
}

interface AssignmentAttemptInfo {
  attemptId: string;
  assignmentId: string;
  assignmentTitle: string;
  status: string | null;
  startedAt: string | null;
  completedAt: string | null;
  timeRemainingSeconds: number;
  completedParts: number;
  totalScore: number;
  maxMarks: number;
  percentage: number;
  gradedResponses: number;
  totalResponses: number;
}

interface ExamProgressInfo {
  id: string;
  studentId: string;
  examType: string;
  examIdentifier: string;
  examTitle: string | null;
  totalQuestions: number | null;
  answeredQuestions: number | null;
  answeredQuestionIds: string[] | null;
  currentAnswers: Record<string, Record<string, string>> | null;
  status: string | null;
  startedAt: string | null;
  updatedAt: string | null;
}

interface AssignmentResponseInfo {
  id: string;
  partId: string;
  textAnswer: string | null;
  marksAwarded: number | null;
  aiFeedback: string | null;
  submittedAt: string | null;
  sectionTitle?: string | null;
  partLabel?: string | null;
  partTitle?: string | null;
  inputStyle?: string | null;
  codeAnswer?: string | null;
}

interface ClassInfo {
  id: string;
  name: string;
}

interface ExamResult {
  id: string;
  studentId: string;
  examType: string;
  examIdentifier: string;
  examTitle: string | null;
  score: number;
  maxMarks: number;
  percentage: number;
  timeSpentSeconds: number | null;
  answers: any;
  completedAt: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem("teacher_token") || localStorage.getItem("teacherToken");
  return { Authorization: `Bearer ${token}` };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatTime(seconds: number | null) {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function getScoreColor(pct: number) {
  if (pct >= 70) return "text-green-600 dark:text-green-400";
  if (pct >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBadgeVariant(pct: number): "default" | "secondary" | "destructive" | "outline" {
  if (pct >= 70) return "default";
  if (pct >= 50) return "secondary";
  return "destructive";
}

function ScoreBar({ score, maxMarks, showLabel = true }: { score: number; maxMarks: number; showLabel?: boolean }) {
  const pct = maxMarks > 0 ? Math.round((score / maxMarks) * 100) : 0;
  const barColor = pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className={`text-xs font-medium min-w-[4rem] text-right ${getScoreColor(pct)}`}>
          {score}/{maxMarks} ({pct}%)
        </span>
      )}
    </div>
  );
}

function ExamBarChart({ data }: { data: { label: string; pct: number }[] }) {
  if (data.length === 0) return null;
  const BAR_H = 120;
  const BAR_W = 36;
  const GAP = 12;
  const LABEL_H = 56;
  const TOP_PAD = 28;
  const LEFT_PAD = 32;
  const totalW = LEFT_PAD + data.length * (BAR_W + GAP) + GAP;
  const totalH = TOP_PAD + BAR_H + LABEL_H;
  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(totalW, 200)} height={totalH} aria-label="Student score chart">
        {[25, 50, 75, 100].map(pct => {
          const y = TOP_PAD + BAR_H - (pct / 100) * BAR_H;
          return (
            <g key={pct}>
              <line x1={LEFT_PAD} y1={y} x2={totalW} y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
              <text x={LEFT_PAD - 4} y={y + 4} fontSize="9" fill="currentColor" fillOpacity="0.5" textAnchor="end">{pct}%</text>
            </g>
          );
        })}
        {data.map((item, i) => {
          const x = LEFT_PAD + GAP + i * (BAR_W + GAP);
          const barH = Math.max((item.pct / 100) * BAR_H, item.pct > 0 ? 3 : 0);
          const y = TOP_PAD + BAR_H - barH;
          const color = item.pct >= 70 ? "#22c55e" : item.pct >= 40 ? "#f59e0b" : "#ef4444";
          return (
            <g key={item.label}>
              <rect x={x} y={y} width={BAR_W} height={barH} fill={color} fillOpacity="0.85" rx="3" />
              <text x={x + BAR_W / 2} y={y - 5} fontSize="10" fontWeight="600" fill="currentColor" textAnchor="middle">{item.pct}%</text>
              <text
                x={x + BAR_W / 2}
                y={TOP_PAD + BAR_H + 10}
                fontSize="9"
                fill="currentColor"
                fillOpacity="0.75"
                textAnchor="end"
                transform={`rotate(-45, ${x + BAR_W / 2}, ${TOP_PAD + BAR_H + 10})`}
              >
                {item.label.length > 14 ? item.label.slice(0, 13) + "…" : item.label}
              </text>
            </g>
          );
        })}
        <line x1={LEFT_PAD} y1={TOP_PAD + BAR_H} x2={totalW} y2={TOP_PAD + BAR_H} stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

interface BreakdownItem {
  questionLabel?: string;
  label?: string;
  marks?: number;
  score?: number;
  maxMarks?: number;
  studentAnswer?: string;
  feedback?: string;
  suggestions?: string;
  inputStyle?: string;
}

function ExamResultReviewDialog({
  open,
  onOpenChange,
  result,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ExamResult | null;
  onSaved?: (updated: ExamResult) => void;
}) {
  const { toast } = useToast();
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (result?.answers && Array.isArray(result.answers)) {
      setBreakdown(result.answers.map((a: any) => ({ ...a })));
      setDirty(false);
      setEditingIdx(null);
    }
  }, [result]);

  const updateItem = (idx: number, field: string, value: string | number) => {
    setBreakdown(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const resp = await fetch(`/api/teacher/exam-results/${result.id}`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ answers: breakdown }),
      });
      if (!resp.ok) throw new Error("Save failed");
      const updated = await resp.json();
      toast({ title: "Saved", description: "Marks and feedback updated" });
      setDirty(false);
      setEditingIdx(null);
      onSaved?.(updated);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to save changes" });
    } finally {
      setSaving(false);
    }
  };

  if (!result) return null;

  const totalScore = breakdown.reduce((s, b) => s + (b.marks ?? b.score ?? 0), 0);
  const totalMax = breakdown.reduce((s, b) => s + (b.maxMarks ?? 0), 0);
  const totalPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="dialog-exam-review">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>{result.examTitle || result.examIdentifier}</span>
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold ${getScoreColor(totalPct)}`}>
                {totalScore}/{totalMax} ({totalPct}%)
              </span>
              {dirty && (
                <Button size="sm" onClick={handleSave} disabled={saving} data-testid="button-save-review">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  Save
                </Button>
              )}
            </div>
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
            <span>Date: {formatDateTime(result.completedAt)}</span>
            {result.timeSpentSeconds && <span>Time: {formatTime(result.timeSpentSeconds)}</span>}
            <Badge variant="outline">
              {result.examType === "past-paper" ? "Past Paper" : result.examType === "additional-exam" ? "Additional Exam" : "Quiz"}
            </Badge>
          </div>
          <ScoreBar score={totalScore} maxMarks={totalMax} showLabel={false} />
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mt-4" data-testid="review-breakdown-list">
          {breakdown.length === 0 ? (
            <p className="text-center text-neutral-500 py-8">No breakdown available</p>
          ) : breakdown.map((item, idx) => {
            const isEditing = editingIdx === idx;
            const itemMarks = item.marks ?? item.score ?? 0;
            const itemMax = item.maxMarks ?? 0;
            const itemPct = itemMax > 0 ? Math.round((itemMarks / itemMax) * 100) : 0;
            return (
              <Card key={idx} className={`border ${isEditing ? "border-blue-400 dark:border-blue-600" : ""}`} data-testid={`review-item-${idx}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">
                        {item.questionLabel || item.label || `Question ${idx + 1}`}
                      </h4>
                      {item.inputStyle && (
                        <Badge variant="outline" className="text-[10px]">{item.inputStyle}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={itemMax}
                            value={itemMarks}
                            onChange={e => updateItem(idx, "marks", Number(e.target.value))}
                            className="w-16 h-7 text-sm text-center"
                            data-testid={`input-marks-${idx}`}
                          />
                          <span className="text-sm text-neutral-500">/ {itemMax}</span>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingIdx(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditingIdx(idx)}>
                          <Badge variant={getScoreBadgeVariant(itemPct)} data-testid={`badge-marks-${idx}`}>
                            {itemMarks}/{itemMax}
                          </Badge>
                          <Pencil className="h-3 w-3 text-neutral-400 hover:text-neutral-600" />
                        </div>
                      )}
                    </div>
                  </div>

                  <ScoreBar score={itemMarks} maxMarks={itemMax} showLabel={false} />

                  {item.studentAnswer && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-neutral-500 mb-1">Student Answer:</p>
                      <div className="text-sm bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded border max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {item.studentAnswer.length > 500 ? item.studentAnswer.substring(0, 500) + "..." : item.studentAnswer}
                      </div>
                    </div>
                  )}

                  {isEditing ? (
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-xs font-medium text-neutral-500 mb-1">Feedback:</p>
                        <Textarea
                          value={item.feedback || ""}
                          onChange={e => updateItem(idx, "feedback", e.target.value)}
                          rows={2}
                          className="text-sm"
                          data-testid={`textarea-feedback-${idx}`}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-500 mb-1">Suggestions:</p>
                        <Textarea
                          value={item.suggestions || ""}
                          onChange={e => updateItem(idx, "suggestions", e.target.value)}
                          rows={2}
                          className="text-sm"
                          data-testid={`textarea-suggestions-${idx}`}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      {item.feedback && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-neutral-500 mb-0.5">Feedback:</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {item.feedback.length > 200 ? item.feedback.substring(0, 200) + "..." : item.feedback}
                          </p>
                        </div>
                      )}
                      {item.suggestions && (
                        <div className="mt-1">
                          <p className="text-xs font-medium text-neutral-500 mb-0.5">Suggestions:</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            {item.suggestions.length > 200 ? item.suggestions.substring(0, 200) + "..." : item.suggestions}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StudentResultEntry {
  id: string;
  studentId: string;
  username: string;
  examType: string;
  examIdentifier: string;
  examTitle: string | null;
  score: number;
  maxMarks: number;
  percentage: number;
  timeSpentSeconds: number | null;
  answers: any;
  completedAt: string;
}

function StudentResultsTab({ classId }: { classId: string }) {
  const { toast } = useToast();
  const [results, setResults] = useState<StudentResultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterExam, setFilterExam] = useState<string>("");
  const [filterStudent, setFilterStudent] = useState<string>("");
  const [reviewResult, setReviewResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/classes/${classId}/progress`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(async (students: StudentProgress[]) => {
        const allRes: StudentResultEntry[] = [];
        for (const s of students) {
          try {
            const r = await fetch(`/api/students/${s.id}/results`, { headers: getAuthHeaders() });
            const data = await r.json();
            if (Array.isArray(data)) {
              for (const d of data) {
                allRes.push({ ...d, username: s.username });
              }
            }
          } catch {}
        }
        allRes.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        setResults(allRes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [classId]);

  const examOptions = Array.from(new Set(results.map(r => r.examIdentifier))).map(id => {
    const sample = results.find(r => r.examIdentifier === id);
    return { identifier: id, label: sample?.examTitle || id };
  });

  const studentOptions = Array.from(new Set(results.map(r => r.username))).sort();

  const filtered = results.filter(r => {
    if (filterExam && r.examIdentifier !== filterExam) return false;
    if (filterStudent && r.username !== filterStudent) return false;
    return true;
  });

  const avgPct = filtered.length > 0
    ? Math.round(filtered.reduce((s, r) => s + r.percentage, 0) / filtered.length)
    : 0;

  const handleResultUpdated = (updated: ExamResult) => {
    setResults(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
    setReviewResult(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Select value={filterExam} onValueChange={v => setFilterExam(v === "all" ? "" : v)}>
          <SelectTrigger className="w-60" data-testid="select-filter-exam">
            <SelectValue placeholder="All exams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All exams</SelectItem>
            {examOptions.map(opt => (
              <SelectItem key={opt.identifier} value={opt.identifier}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStudent} onValueChange={v => setFilterStudent(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48" data-testid="select-filter-student">
            <SelectValue placeholder="All students" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All students</SelectItem>
            {studentOptions.map(u => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-neutral-500">Results</p>
            <p className="text-2xl font-bold" data-testid="text-results-count">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-neutral-500">Average</p>
            <p className={`text-2xl font-bold ${getScoreColor(avgPct)}`} data-testid="text-results-avg">{avgPct}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-neutral-500">Students</p>
            <p className="text-2xl font-bold" data-testid="text-results-students">{new Set(filtered.map(r => r.username)).size}</p>
          </CardContent>
        </Card>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-neutral-500">
            No exam results found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="w-40">Performance</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id} data-testid={`row-result-entry-${r.id}`}>
                    <TableCell className="font-medium">{r.username}</TableCell>
                    <TableCell>{r.examTitle || r.examIdentifier}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {r.examType === "past-paper" ? "Past Paper" : r.examType === "additional-exam" ? "Additional" : "Quiz"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold ${getScoreColor(r.percentage)}`}>
                        {r.score}/{r.maxMarks}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ScoreBar score={r.score} maxMarks={r.maxMarks} showLabel={false} />
                    </TableCell>
                    <TableCell className="text-sm text-neutral-500">{formatTime(r.timeSpentSeconds)}</TableCell>
                    <TableCell className="text-sm text-neutral-500">{formatDate(r.completedAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReviewResult(r)}
                        data-testid={`button-review-${r.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ExamResultReviewDialog
        open={!!reviewResult}
        onOpenChange={(open) => { if (!open) setReviewResult(null); }}
        result={reviewResult}
        onSaved={handleResultUpdated}
      />
    </div>
  );
}

function ClassOverview({ classId, className, onSelectStudent }: { classId: string; className: string; onSelectStudent: (id: string, username: string) => void }) {
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/classes/${classId}/progress`, { headers: getAuthHeaders() })
      .then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(data => { setProgress(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setProgress([]); setLoading(false); });
  }, [classId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalExams = progress.reduce((s, p) => s + p.examCount, 0);
  const classAvg = progress.length > 0 && totalExams > 0
    ? Math.round(progress.filter(p => p.examCount > 0).reduce((s, p) => s + p.averageScore, 0) / progress.filter(p => p.examCount > 0).length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-stat-students">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Students</p>
              <p className="text-2xl font-bold" data-testid="text-student-count">{progress.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-exams">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Total Exams Taken</p>
              <p className="text-2xl font-bold" data-testid="text-total-exams">{totalExams}</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-average">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Class Average</p>
              <p className={`text-2xl font-bold ${getScoreColor(classAvg)}`} data-testid="text-class-average">{classAvg}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {progress.filter(p => p.examCount > 0).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Class Score Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExamBarChart
              data={progress
                .filter(p => p.examCount > 0)
                .sort((a, b) => b.averageScore - a.averageScore)
                .map(p => ({ label: p.username, pct: p.averageScore }))}
            />
          </CardContent>
        </Card>
      )}

      {progress.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-neutral-500">
            No students in this class yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Student Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead className="text-center">Exams Completed</TableHead>
                  <TableHead className="text-center">Average Score</TableHead>
                  <TableHead className="text-center">Assignments</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progress.map(student => (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                    onClick={() => onSelectStudent(student.id, student.username)}
                    data-testid={`row-student-${student.id}`}
                  >
                    <TableCell className="font-medium" data-testid={`text-username-${student.id}`}>{student.username}</TableCell>
                    <TableCell className="text-center" data-testid={`text-exam-count-${student.id}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        {student.examCount}
                        {student.examsInProgress > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 text-xs flex items-center gap-0.5">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {student.examsInProgress}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {student.examCount > 0 ? (
                        <span className={`font-semibold ${getScoreColor(student.averageScore)}`} data-testid={`text-avg-score-${student.id}`}>
                          {student.averageScore}%
                        </span>
                      ) : (
                        <span className="text-neutral-400" data-testid={`text-avg-score-${student.id}`}>—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center" data-testid={`text-assignments-${student.id}`}>
                      {student.assignmentsCompleted + student.assignmentsInProgress > 0 ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-green-600 dark:text-green-400 font-medium">{student.assignmentsCompleted}</span>
                          {student.assignmentsInProgress > 0 && (
                            <span className="text-amber-600 dark:text-amber-400 text-xs flex items-center gap-0.5">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              {student.assignmentsInProgress}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-last-active-${student.id}`}>{formatDate(student.lastActive)}</TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-neutral-400" />
                    </TableCell>
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

function StudentDetail({ studentId, studentUsername, onBack, onViewAttempt }: { studentId: string; studentUsername: string; onBack: () => void; onViewAttempt: (result: ExamResult) => void }) {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [assignmentAttempts, setAssignmentAttempts] = useState<AssignmentAttemptInfo[]>([]);
  const [examProgress, setExamProgress] = useState<ExamProgressInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailTab, setDetailTab] = useState<"exams" | "assignments">("exams");
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
  const [attemptResponses, setAttemptResponses] = useState<Record<string, AssignmentResponseInfo[]>>({});
  const [showOrphans, setShowOrphans] = useState(false);
  const [orphanedResults, setOrphanedResults] = useState<ExamResult[]>([]);
  const [orphanLoading, setOrphanLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    Promise.allSettled([
      fetch(`/api/students/${studentId}/results`, { headers: getAuthHeaders() }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`/api/students/${studentId}/assignment-attempts`, { headers: getAuthHeaders() }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`/api/students/${studentId}/exam-progress`, { headers: getAuthHeaders() }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    ])
      .then(([examResult, attemptResult, progressResult]) => {
        const examData = examResult.status === "fulfilled" && Array.isArray(examResult.value) ? examResult.value : [];
        const attemptData = attemptResult.status === "fulfilled" && Array.isArray(attemptResult.value) ? attemptResult.value : [];
        const progressData = progressResult.status === "fulfilled" && Array.isArray(progressResult.value) ? progressResult.value : [];
        setResults(examData);
        setAssignmentAttempts(attemptData);
        setExamProgress(progressData);
        setLoading(false);
      });
  }, [studentId]);

  const loadAttemptResponses = (attemptId: string) => {
    if (attemptResponses[attemptId]) {
      setExpandedAttempt(expandedAttempt === attemptId ? null : attemptId);
      return;
    }
    fetch(`/api/assignment-attempts/${attemptId}/responses`, { headers: getAuthHeaders() })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        setAttemptResponses(prev => ({ ...prev, [attemptId]: Array.isArray(data) ? data : [] }));
        setExpandedAttempt(attemptId);
      })
      .catch(() => setExpandedAttempt(attemptId));
  };

  const loadOrphanedResults = () => {
    setShowOrphans(!showOrphans);
    if (!showOrphans) {
      setOrphanLoading(true);
      fetch("/api/teacher/orphaned-exam-results", { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(data => { setOrphanedResults(Array.isArray(data) ? data : []); setOrphanLoading(false); })
        .catch(() => { setOrphanLoading(false); });
    }
  };

  const linkOrphanToStudent = (examResultId: string) => {
    fetch("/api/teacher/link-exam-result", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ examResultId, studentId }),
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => {
        setOrphanedResults(prev => prev.filter(r => r.id !== examResultId));
        fetch("/api/students/" + studentId + "/results", { headers: getAuthHeaders() })
          .then(r => r.json())
          .then(data => { if (Array.isArray(data)) setResults(data); });
        toast({ title: "Linked", description: "Exam result has been linked to " + studentUsername });
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Error", description: "Failed to link exam result" });
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : 0;
  const bestScore = results.length > 0
    ? Math.round(Math.max(...results.map(r => r.percentage)))
    : 0;
  const inProgressCount = assignmentAttempts.filter(a => a.status === "in_progress").length;
  const completedAssignCount = assignmentAttempts.filter(a => a.status === "completed").length;
  const completedAssignments = assignmentAttempts.filter(a => a.status === "completed");
  const gradedAssignments = completedAssignments.filter(a => a.gradedResponses > 0);
  const assignmentAvg = gradedAssignments.length > 0
    ? Math.round(gradedAssignments.reduce((s, a) => s + a.percentage, 0) / gradedAssignments.length)
    : 0;
  const overallAvg = (() => {
    const allPercentages: number[] = [];
    results.forEach(r => allPercentages.push(r.percentage));
    gradedAssignments.forEach(a => allPercentages.push(a.percentage));
    return allPercentages.length > 0 ? Math.round(allPercentages.reduce((s, v) => s + v, 0) / allPercentages.length) : 0;
  })();

  const handleDeleteExamResult = (resultId: string, examName: string) => {
    if (!window.confirm("Are you sure you want to remove the result for \"" + examName + "\"? This cannot be undone.")) return;
    fetch("/api/teacher/exam-results/" + resultId, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => {
        setResults(prev => prev.filter(r => r.id !== resultId));
        toast({ title: "Removed", description: "Exam result has been removed." });
      })
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to remove exam result." }));
  };

  const handleDeleteAssignmentAttempt = (attemptId: string, assignmentTitle: string) => {
    if (!window.confirm("Are you sure you want to remove the assignment attempt for \"" + assignmentTitle + "\"? This cannot be undone.")) return;
    fetch("/api/teacher/assignment-attempts/" + attemptId, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => {
        setAssignmentAttempts(prev => prev.filter(a => a.attemptId !== attemptId));
        toast({ title: "Removed", description: "Assignment attempt has been removed." });
      })
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to remove assignment attempt." }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-to-class">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Class
        </Button>
        <h2 className="text-xl font-bold" data-testid="text-student-detail-name">{studentUsername}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-neutral-500">Exams Taken</p>
            <p className="text-2xl font-bold" data-testid="text-total-attempts">{results.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-neutral-500">Exam Average</p>
            <p className={`text-2xl font-bold ${getScoreColor(avgScore)}`} data-testid="text-avg-score">{results.length > 0 ? avgScore + "%" : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-neutral-500">Assignment Average</p>
            <p className={`text-2xl font-bold ${getScoreColor(assignmentAvg)}`} data-testid="text-assignment-avg">{gradedAssignments.length > 0 ? assignmentAvg + "%" : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-neutral-500">Overall Average</p>
            <p className={`text-2xl font-bold ${getScoreColor(overallAvg)}`} data-testid="text-overall-avg">{(results.length + completedAssignments.length) > 0 ? overallAvg + "%" : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-neutral-500">Assignments</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-assignments-completed">{completedAssignCount} <span className="text-sm font-normal text-neutral-400">done</span> {inProgressCount > 0 && <span className="text-sm font-normal text-amber-500">{inProgressCount} active</span>}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={detailTab === "exams" ? "default" : "outline"}
          size="sm"
          onClick={() => setDetailTab("exams")}
          data-testid="tab-student-exams"
        >
          <BarChart3 className="h-4 w-4 mr-2" /> Exams ({results.length})
        </Button>
        <Button
          variant={detailTab === "assignments" ? "default" : "outline"}
          size="sm"
          onClick={() => setDetailTab("assignments")}
          data-testid="tab-student-assignments"
        >
          <FileText className="h-4 w-4 mr-2" /> Assignments ({assignmentAttempts.length})
        </Button>
      </div>

      {detailTab === "exams" && (
        <>
          {examProgress.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                  Currently Working On
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {examProgress.map(ep => (
                    <div key={ep.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40" data-testid={`card-exam-progress-${ep.id}`}>
                      <div>
                        <p className="font-medium">{ep.examTitle || ep.examIdentifier}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                          <Badge variant="outline" className="text-xs">
                            {ep.examType === "past-paper" ? "Past Paper" : ep.examType === "additional-exam" ? "Additional Exam" : "Quiz"}
                          </Badge>
                          <span>{ep.answeredQuestions || 0} of {ep.totalQuestions || "?"} questions answered</span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-neutral-500">
                        {ep.totalQuestions && ep.totalQuestions > 0 && (
                          <div className="mb-1">
                            <Progress value={((ep.answeredQuestions || 0) / ep.totalQuestions) * 100} className="w-24 h-2" />
                          </div>
                        )}
                        <span>Updated {ep.updatedAt ? formatDateTime(ep.updatedAt) : "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {results.length === 0 && examProgress.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-neutral-500">
                This student has not started any exams yet.
              </CardContent>
            </Card>
          ) : results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Completed Exams</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Percentage</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map(result => (
                      <TableRow
                        key={result.id}
                        className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                        onClick={() => onViewAttempt(result)}
                        data-testid={`row-result-${result.id}`}
                      >
                        <TableCell className="font-medium" data-testid={`text-exam-name-${result.id}`}>
                          {result.examTitle || result.examIdentifier}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-exam-type-${result.id}`}>
                            {result.examType === "past-paper" ? "Past Paper" : result.examType === "additional-exam" ? "Additional Exam" : result.examType === "assignment" ? "Assignment" : "Quiz"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center" data-testid={`text-score-${result.id}`}>
                          {result.score}/{result.maxMarks}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${getScoreColor(result.percentage)}`} data-testid={`text-pct-${result.id}`}>
                            {Math.round(result.percentage)}%
                          </span>
                        </TableCell>
                        <TableCell data-testid={`text-time-${result.id}`}>{formatTime(result.timeSpentSeconds)}</TableCell>
                        <TableCell data-testid={`text-date-${result.id}`}>{formatDateTime(result.completedAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ChevronRight className="h-4 w-4 text-neutral-400" />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-neutral-400 hover:text-red-600"
                              data-testid={"button-delete-result-" + result.id}
                              onClick={(e) => { e.stopPropagation(); handleDeleteExamResult(result.id, result.examTitle || result.examIdentifier); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Button variant="outline" size="sm" onClick={loadOrphanedResults} data-testid="button-link-orphans" className="mt-2">
            <GraduationCap className="h-4 w-4 mr-2" /> {showOrphans ? "Hide" : "Link Unlinked Exam Results"}
          </Button>

          {showOrphans && (
            <Card className="mt-3">
              <CardContent className="p-4">
                {orphanLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                  </div>
                ) : orphanedResults.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-4">No unlinked exam results found.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-500 mb-3">Select a result to link to {studentUsername}:</p>
                    {orphanedResults.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700" data-testid={"orphan-result-" + r.id}>
                        <div>
                          <p className="font-medium text-sm">{r.examTitle || r.examIdentifier}</p>
                          <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                            <Badge variant="outline" className="text-xs">{r.examType === "past-paper" ? "Past Paper" : r.examType === "additional-exam" ? "Additional" : "Quiz"}</Badge>
                            <span>{r.score}/{r.maxMarks} ({Math.round(r.percentage)}%)</span>
                            <span>{r.completedAt ? formatDateTime(r.completedAt) : ""}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => linkOrphanToStudent(r.id)} data-testid={"button-link-" + r.id}>
                          Link to Student
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {detailTab === "assignments" && (
        <>
          {assignmentAttempts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-neutral-500">
                This student has not started any assignments yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assignmentAttempts.map(attempt => (
                <Card key={attempt.attemptId} data-testid={`card-assignment-${attempt.attemptId}`}>
                  <CardContent className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => loadAttemptResponses(attempt.attemptId)}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{attempt.assignmentTitle}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
                            <Badge
                              variant={attempt.status === "completed" ? "default" : "secondary"}
                              className={attempt.status === "in_progress" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" : ""}
                            >
                              {attempt.status === "completed" ? "Completed" : "In Progress"}
                            </Badge>
                            <span>{attempt.completedParts} parts done</span>
                            <span>{attempt.totalResponses} responses</span>
                            {attempt.gradedResponses > 0 && <span>Score: {attempt.totalScore}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <span>{attempt.startedAt ? formatDateTime(attempt.startedAt) : ""}</span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${expandedAttempt === attempt.attemptId ? "rotate-90" : ""}`} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-neutral-400 hover:text-red-600"
                          data-testid={"button-delete-attempt-" + attempt.attemptId}
                          onClick={(e) => { e.stopPropagation(); handleDeleteAssignmentAttempt(attempt.attemptId, attempt.assignmentTitle); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {expandedAttempt === attempt.attemptId && (
                      <div className="mt-4 border-t pt-4 space-y-3">
                        {(!attemptResponses[attempt.attemptId] || attemptResponses[attempt.attemptId].length === 0) ? (
                          <p className="text-sm text-neutral-500 text-center py-2">No responses recorded yet.</p>
                        ) : (
                          attemptResponses[attempt.attemptId].map((resp, idx) => (
                            <div key={resp.id} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800" data-testid={`response-${resp.id}`}>
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                                    {resp.sectionTitle && <span className="text-neutral-500 dark:text-neutral-400">{resp.sectionTitle} — </span>}
                                    {resp.partLabel || resp.partId}
                                  </span>
                                  {resp.partTitle && (
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{resp.partTitle}</p>
                                  )}
                                </div>
                                {resp.marksAwarded !== null && (
                                  <Badge variant={resp.marksAwarded > 0 ? "default" : "destructive"} className="text-xs">
                                    {resp.marksAwarded} marks
                                  </Badge>
                                )}
                              </div>
                              {resp.textAnswer && (
                                <div className="text-sm mb-2">
                                  <p className="text-xs text-neutral-500 mb-1">Answer:</p>
                                  <div className="whitespace-pre-wrap bg-white dark:bg-neutral-950 p-2 rounded border text-neutral-800 dark:text-neutral-200">
                                    <FormattedAnswer answer={resp.textAnswer} inputStyle={resp.inputStyle ?? undefined} />
                                  </div>
                                </div>
                              )}
                              {resp.codeAnswer && (
                                <div className="text-sm mb-2">
                                  <p className="text-xs text-neutral-500 mb-1">Code:</p>
                                  <pre className="whitespace-pre-wrap bg-neutral-900 text-green-400 p-2 rounded border text-xs font-mono overflow-x-auto">
                                    {resp.codeAnswer}
                                  </pre>
                                </div>
                              )}
                              {resp.aiFeedback && (
                                <div className="text-sm">
                                  <p className="text-xs text-neutral-500 mb-1">AI Feedback:</p>
                                  <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap text-xs">
                                    {resp.aiFeedback.length > 300 ? resp.aiFeedback.substring(0, 300) + "..." : resp.aiFeedback}
                                  </p>
                                </div>
                              )}
                              {!resp.textAnswer && !resp.codeAnswer && resp.marksAwarded === null && (
                                <p className="text-xs text-neutral-400 italic">No answer submitted yet</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AttemptDetail({ result, onBack }: { result: ExamResult; onBack: () => void }) {
  const [currentResult, setCurrentResult] = useState(result);
  const [reviewOpen, setReviewOpen] = useState(false);
  const answers = currentResult.answers as any[] | null;

  const totalScore = answers ? answers.reduce((s: number, a: any) => s + (a.marks ?? a.score ?? 0), 0) : currentResult.score;
  const totalMax = answers ? answers.reduce((s: number, a: any) => s + (a.maxMarks ?? 0), 0) : currentResult.maxMarks;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-to-student">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Results
          </Button>
          <h2 className="text-xl font-bold" data-testid="text-attempt-title">
            {currentResult.examTitle || currentResult.examIdentifier}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => setReviewOpen(true)} data-testid="button-edit-result">
          <Pencil className="h-4 w-4 mr-1" /> Edit Marks
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-neutral-500">Score</p>
            <p className={`text-lg font-bold ${getScoreColor(currentResult.percentage)}`} data-testid="text-attempt-score">
              {totalScore}/{totalMax}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-neutral-500">Percentage</p>
            <p className={`text-lg font-bold ${getScoreColor(currentResult.percentage)}`} data-testid="text-attempt-pct">
              {totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-neutral-500">Time Spent</p>
            <p className="text-lg font-bold" data-testid="text-attempt-time">{formatTime(currentResult.timeSpentSeconds)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-neutral-500">Date</p>
            <p className="text-lg font-bold" data-testid="text-attempt-date">{formatDate(currentResult.completedAt)}</p>
          </CardContent>
        </Card>
      </div>

      <ScoreBar score={totalScore} maxMarks={totalMax} />

      {answers && answers.length > 0 ? (
        <div className="space-y-4">
          {answers.map((answer: any, idx: number) => {
            const itemMarks = answer.marks ?? answer.score ?? 0;
            const itemMax = answer.maxMarks ?? 0;
            return (
              <Card key={idx} data-testid={`card-answer-${idx}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">
                        {answer.questionLabel || answer.label || `Question ${idx + 1}`}
                      </h3>
                      {answer.inputStyle && (
                        <Badge variant="outline" className="text-[10px]">{answer.inputStyle}</Badge>
                      )}
                    </div>
                    <Badge variant={getScoreBadgeVariant(itemMax > 0 ? (itemMarks / itemMax) * 100 : 0)}>
                      {itemMarks}/{itemMax}
                    </Badge>
                  </div>
                  <ScoreBar score={itemMarks} maxMarks={itemMax} showLabel={false} />
                  {answer.studentAnswer && (
                    <div className="mt-3 mb-2">
                      <p className="text-xs font-medium text-neutral-500 mb-1">Student Answer:</p>
                      <div className="text-sm bg-neutral-50 dark:bg-neutral-900 p-2 rounded border text-neutral-700 dark:text-neutral-300 max-h-40 overflow-y-auto whitespace-pre-wrap" data-testid={`text-student-answer-${idx}`}>
                        {answer.studentAnswer}
                      </div>
                    </div>
                  )}
                  {answer.feedback && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-neutral-500 mb-1">AI Feedback:</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap" data-testid={`text-feedback-${idx}`}>
                        {answer.feedback}
                      </p>
                    </div>
                  )}
                  {answer.suggestions && (
                    <div>
                      <p className="text-xs font-medium text-neutral-500 mb-1">Suggestions:</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-wrap" data-testid={`text-suggestions-${idx}`}>
                        {answer.suggestions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-neutral-500">
            No detailed answer breakdown available for this attempt.
          </CardContent>
        </Card>
      )}

      <ExamResultReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        result={currentResult}
        onSaved={(updated) => setCurrentResult(updated)}
      />
    </div>
  );
}

function ExamAnalysis({ classId }: { classId: string }) {
  const [allResults, setAllResults] = useState<ExamResult[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/classes/${classId}/progress`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(async (students: StudentProgress[]) => {
        const allRes: ExamResult[] = [];
        for (const s of students) {
          try {
            const r = await fetch(`/api/students/${s.id}/results`, { headers: getAuthHeaders() });
            const data = await r.json();
            allRes.push(...data);
          } catch {}
        }
        setAllResults(allRes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [classId]);

  const examOptions = Array.from(new Set(allResults.map(r => r.examIdentifier))).map(id => {
    const sample = allResults.find(r => r.examIdentifier === id);
    return {
      identifier: id,
      label: sample?.examTitle || id,
      type: sample?.examType || "past-paper",
    };
  });

  useEffect(() => {
    if (!selectedExam) {
      setExamResults([]);
      return;
    }
    setAnalysisLoading(true);
    fetch(`/api/results/exam/${encodeURIComponent(selectedExam)}`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => { setExamResults(data); setAnalysisLoading(false); })
      .catch(() => setAnalysisLoading(false));
  }, [selectedExam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const questionStats: { label: string; totalScore: number; totalMaxMarks: number; attempts: number; belowHalf: number }[] = [];
  if (examResults.length > 0) {
    const qMap = new Map<string, { totalScore: number; totalMaxMarks: number; attempts: number; belowHalf: number }>();
    for (const r of examResults) {
      const answers = r.answers as any[] | null;
      if (!answers) continue;
      for (const a of answers) {
        const label = a.questionLabel || a.label || "Unknown";
        const marks = a.marks ?? a.score ?? 0;
        const maxMarks = a.maxMarks ?? 1;
        const existing = qMap.get(label) || { totalScore: 0, totalMaxMarks: 0, attempts: 0, belowHalf: 0 };
        existing.totalScore += marks;
        existing.totalMaxMarks += maxMarks;
        existing.attempts += 1;
        if (maxMarks > 0 && (marks / maxMarks) < 0.5) {
          existing.belowHalf += 1;
        }
        qMap.set(label, existing);
      }
    }
    qMap.forEach((stats, label) => {
      questionStats.push({ label, ...stats });
    });
  }

  const overallAvg = examResults.length > 0
    ? Math.round(examResults.reduce((s, r) => s + r.percentage, 0) / examResults.length)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exam Difficulty Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger data-testid="select-exam-analysis">
              <SelectValue placeholder="Select an exam to analyse..." />
            </SelectTrigger>
            <SelectContent>
              {examOptions.length === 0 ? (
                <SelectItem value="none" disabled>No exams taken yet</SelectItem>
              ) : (
                examOptions.map(opt => (
                  <SelectItem key={opt.identifier} value={opt.identifier} data-testid={`option-exam-${opt.identifier}`}>
                    {opt.label} ({opt.type === "past-paper" ? "Past Paper" : opt.type === "additional-exam" ? "Additional Exam" : "Quiz"})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {analysisLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {selectedExam && !analysisLoading && examResults.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-neutral-500">Attempts</p>
                <p className="text-2xl font-bold" data-testid="text-analysis-attempts">{examResults.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-neutral-500">Average Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(overallAvg)}`} data-testid="text-analysis-avg">{overallAvg}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-neutral-500">Questions Analysed</p>
                <p className="text-2xl font-bold" data-testid="text-analysis-questions">{questionStats.length}</p>
              </CardContent>
            </Card>
          </div>

          {questionStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Question-by-Question Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead className="text-center">Attempts</TableHead>
                      <TableHead className="text-center">Avg Score</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questionStats.sort((a, b) => {
                      const avgA = a.attempts > 0 ? (a.totalScore / a.totalMaxMarks) * 100 : 0;
                      const avgB = b.attempts > 0 ? (b.totalScore / b.totalMaxMarks) * 100 : 0;
                      return avgA - avgB;
                    }).map(q => {
                      const avgPct = q.attempts > 0 ? Math.round((q.totalScore / q.totalMaxMarks) * 100) : 0;
                      const belowHalfPct = q.attempts > 0 ? (q.belowHalf / q.attempts) * 100 : 0;
                      const isDifficult = belowHalfPct > 50;
                      return (
                        <TableRow
                          key={q.label}
                          className={isDifficult ? "bg-red-50/50 dark:bg-red-950/20" : ""}
                          data-testid={`row-question-${q.label}`}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {q.label}
                              {isDifficult && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{q.attempts}</TableCell>
                          <TableCell className="text-center">
                            <span className={`font-semibold ${getScoreColor(avgPct)}`}>
                              {avgPct}%
                            </span>
                          </TableCell>
                          <TableCell className="w-48">
                            <div className="flex items-center gap-2">
                              <Progress value={avgPct} className="flex-1 h-2" />
                              <span className="text-xs text-neutral-500 w-10">{avgPct}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isDifficult && (
                              <Badge variant="destructive" className="text-xs" data-testid={`badge-difficult-${q.label}`}>
                                {Math.round(belowHalfPct)}% below 50%
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {selectedExam && !analysisLoading && examResults.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-neutral-500">
            No results found for this exam.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type ViewMode = "overview" | "student" | "attempt" | "analysis";

export default function ClassProgress() {
  const [, setLocation] = useLocation();
  const params = useParams<{ classId?: string }>();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(params.classId || "");
  const [selectedClassName, setSelectedClassName] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStudentUsername, setSelectedStudentUsername] = useState("");
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"progress" | "analysis" | "results">("progress");

  useEffect(() => {
    const token = localStorage.getItem("teacher_token") || localStorage.getItem("teacherToken");
    if (!token) {
      setLocation("/teacher/login");
      return;
    }
    fetch("/api/classes", { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        setClasses(data);
        if (params.classId) {
          const cls = data.find((c: ClassInfo) => c.id === params.classId);
          if (cls) {
            setSelectedClassId(cls.id);
            setSelectedClassName(cls.name);
          }
        } else if (data.length > 0) {
          setSelectedClassId(data[0].id);
          setSelectedClassName(data[0].name);
        }
        setLoading(false);
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Error", description: "Failed to load classes" });
        setLoading(false);
      });
  }, []);

  const handleClassChange = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    setSelectedClassId(classId);
    setSelectedClassName(cls?.name || "");
    setViewMode("overview");
    setActiveTab("progress");
  };

  const handleSelectStudent = (id: string, username: string) => {
    setSelectedStudentId(id);
    setSelectedStudentUsername(username);
    setViewMode("student");
  };

  const handleViewAttempt = (result: ExamResult) => {
    setSelectedResult(result);
    setViewMode("attempt");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-[200]">
        <div className="container mx-auto max-w-6xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/teacher/dashboard")} data-testid="button-back-dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Button>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Student Progress</h1>
          </div>

          <div className="flex items-center gap-3">
            {classes.length === 1 ? (
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{classes[0].name}</span>
            ) : classes.length > 1 ? (
              <div className="flex gap-1">
                {classes.map(cls => (
                  <Button
                    key={cls.id}
                    variant={selectedClassId === cls.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleClassChange(cls.id)}
                    data-testid={"button-class-" + cls.id}
                  >
                    {cls.name}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl p-6">
        {classes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Classes Yet</h2>
              <p className="text-neutral-500 mb-4">Create a class first to start tracking student progress.</p>
              <Button onClick={() => setLocation("/teacher/classes")} data-testid="button-create-class">
                Create a Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === "overview" && (
              <div className="space-y-6">
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === "progress" ? "default" : "outline"}
                    onClick={() => setActiveTab("progress")}
                    data-testid="tab-progress"
                  >
                    <Users className="h-4 w-4 mr-2" /> Student Progress
                  </Button>
                  <Button
                    variant={activeTab === "analysis" ? "default" : "outline"}
                    onClick={() => setActiveTab("analysis")}
                    data-testid="tab-analysis"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" /> Exam Analysis
                  </Button>
                  <Button
                    variant={activeTab === "results" ? "default" : "outline"}
                    onClick={() => setActiveTab("results")}
                    data-testid="tab-results"
                  >
                    <GraduationCap className="h-4 w-4 mr-2" /> Student Results
                  </Button>
                </div>

                {activeTab === "progress" ? (
                  <ClassOverview
                    classId={selectedClassId}
                    className={selectedClassName}
                    onSelectStudent={handleSelectStudent}
                  />
                ) : activeTab === "analysis" ? (
                  <ExamAnalysis classId={selectedClassId} />
                ) : (
                  <StudentResultsTab classId={selectedClassId} />
                )}
              </div>
            )}

            {viewMode === "student" && (
              <StudentDetail
                studentId={selectedStudentId}
                studentUsername={selectedStudentUsername}
                onBack={() => setViewMode("overview")}
                onViewAttempt={handleViewAttempt}
              />
            )}

            {viewMode === "attempt" && selectedResult && (
              <AttemptDetail
                result={selectedResult}
                onBack={() => setViewMode("student")}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
