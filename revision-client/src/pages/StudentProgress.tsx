import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, ClipboardList, ChevronDown, ChevronUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { useStudentAuth } from "@/components/student-auth-context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ExamResult {
  id: string;
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

interface AssignmentAttempt {
  attemptId: string;
  assignmentId: string;
  assignmentTitle: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  completedParts: number;
  totalResponses: number;
  gradedResponses: number;
  totalScore: number;
}

interface AttemptResponse {
  id: string;
  partId: string;
  partLabel: string;
  partTitle: string | null;
  sectionTitle: string | null;
  inputStyle: string;
  textAnswer: string | null;
  codeAnswer: string | null;
  marksAwarded: number | null;
  aiFeedback: string | null;
}

function getAuthHeaders() {
  const token = localStorage.getItem("student_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function getGrade(pct: number) {
  if (pct >= 70) return { grade: "A", color: "text-green-600 dark:text-green-400" };
  if (pct >= 60) return { grade: "B", color: "text-blue-600 dark:text-blue-400" };
  if (pct >= 50) return { grade: "C", color: "text-amber-600 dark:text-amber-400" };
  if (pct >= 40) return { grade: "D", color: "text-orange-600 dark:text-orange-400" };
  return { grade: "No Award", color: "text-red-600 dark:text-red-400" };
}

function FormattedAnswer({ answer }: { answer: string }) {
  try {
    const parsed = JSON.parse(answer);
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
  } catch {}
  const display = answer.length > 500 ? answer.substring(0, 500) + "..." : answer;
  return <span className="whitespace-pre-wrap">{display}</span>;
}

export default function StudentProgress() {
  const { student } = useStudentAuth();
  const [tab, setTab] = useState<"exams" | "assignments">("exams");
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [assignmentAttempts, setAssignmentAttempts] = useState<AssignmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
  const [attemptResponses, setAttemptResponses] = useState<Record<string, AttemptResponse[]>>({});

  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      setLoading(false);
      return;
    }
    Promise.allSettled([
      fetch("/api/student/my-results", { headers }).then(r => {
        if (r.status === 401) throw new Error("auth");
        return r.ok ? r.json() : [];
      }),
      fetch("/api/student/my-assignment-attempts", { headers }).then(r => {
        if (r.status === 401) throw new Error("auth");
        return r.ok ? r.json() : [];
      }),
    ]).then(([examRes, attRes]) => {
      const authFailed = (examRes.status === "rejected" && examRes.reason?.message === "auth") ||
                          (attRes.status === "rejected" && attRes.reason?.message === "auth");
      if (authFailed) {
        setFetchError(true);
      }
      setExamResults(examRes.status === "fulfilled" ? examRes.value : []);
      setAssignmentAttempts(attRes.status === "fulfilled" ? attRes.value : []);
      setLoading(false);
    });
  }, []);

  const loadResponses = (attemptId: string) => {
    if (attemptResponses[attemptId]) {
      setExpandedAttempt(expandedAttempt === attemptId ? null : attemptId);
      return;
    }
    fetch(`/api/student/assignment-attempts/${attemptId}/responses`, { headers: getAuthHeaders() as any })
      .then(r => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then(data => {
        setAttemptResponses(prev => ({ ...prev, [attemptId]: Array.isArray(data) ? data : [] }));
        setExpandedAttempt(attemptId);
      })
      .catch(() => {
        setAttemptResponses(prev => ({ ...prev, [attemptId]: [] }));
        setExpandedAttempt(attemptId);
      });
  };

  if (!student) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-amber-500" />
            <h2 className="text-xl font-bold">Sign In Required</h2>
            <p className="text-neutral-500">You need to be signed in as a student to view your progress.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/student/login">
                <Button data-testid="button-go-login">Sign In</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" data-testid="button-go-home">Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
            <h2 className="text-xl font-bold">Session Expired</h2>
            <p className="text-neutral-500">Your session has expired. Please sign in again to view your progress.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/student/login">
                <Button data-testid="button-relogin">Sign In Again</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pastPaperResults = examResults.filter(r => r.examType === "past-paper");
  const additionalExamResults = examResults.filter(r => r.examType === "additional-exam");
  const assignmentResults = examResults.filter(r => r.examType === "assignment");

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950" data-testid="student-progress-page">
      <div className="bg-black dark:bg-neutral-800 text-white py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Home
            </Button>
          </Link>
          <h1 className="text-lg font-bold">My Progress</h1>
          <Badge variant="outline" className="border-blue-400/30 text-blue-200">{student.username}</Badge>
        </div>
        <ModeToggle />
      </div>

      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        <div className="flex gap-2">
          <Button
            variant={tab === "exams" ? "default" : "outline"}
            onClick={() => setTab("exams")}
            data-testid="tab-exams"
          >
            <Trophy className="w-4 h-4 mr-2" /> Exam Results
          </Button>
          <Button
            variant={tab === "assignments" ? "default" : "outline"}
            onClick={() => setTab("assignments")}
            data-testid="tab-assignments"
          >
            <ClipboardList className="w-4 h-4 mr-2" /> Assignments
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "exams" ? (
          <ExamResultsTab
            pastPapers={pastPaperResults}
            additionalExams={additionalExamResults}
            assignmentResults={assignmentResults}
            expandedId={expandedExam}
            onToggle={setExpandedExam}
          />
        ) : (
          <AssignmentAttemptsTab
            attempts={assignmentAttempts}
            expandedId={expandedAttempt}
            onToggle={loadResponses}
            responses={attemptResponses}
          />
        )}
      </div>
    </div>
  );
}

function ExamResultCard({ result, isExpanded, onToggle }: { result: ExamResult; isExpanded: boolean; onToggle: () => void }) {
  const { grade, color } = getGrade(result.percentage);
  const answers = result.answers as any[] | null;

  return (
    <Card data-testid={`card-exam-${result.id}`}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-bold ${color}`}>{grade}</div>
                <div>
                  <p className="font-medium">{result.examTitle || result.examIdentifier}</p>
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <span>{result.score}/{result.maxMarks} ({result.percentage}%)</span>
                    {result.timeSpentSeconds && (
                      <>
                        <span className="text-neutral-300 dark:text-neutral-600">|</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(result.timeSpentSeconds)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">{formatDateTime(result.completedAt)}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-4 pb-4 pt-3 space-y-3">
            {answers && answers.length > 0 ? (
              answers.map((q: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium">{q.questionTitle || q.title} {q.subLabel || q.label || ""}</p>
                    <Badge variant={q.marksAwarded > 0 || q.score > 0 ? "default" : "destructive"} className="text-xs">
                      {q.marksAwarded ?? q.score ?? 0}/{q.maxMarks || q.maxScore || 0}
                    </Badge>
                  </div>
                  {(q.userAnswer || q.answer) && (
                    <div className="text-sm mb-2">
                      <p className="text-xs text-neutral-500 mb-1">Your answer:</p>
                      <div className="bg-white dark:bg-neutral-950 p-2 rounded border text-neutral-800 dark:text-neutral-200 text-sm">
                        <FormattedAnswer answer={q.userAnswer || q.answer || ""} />
                      </div>
                    </div>
                  )}
                  {(q.feedback || q.aiFeedback) && (
                    <div className="text-sm">
                      <p className="text-xs text-neutral-500 mb-1">Feedback:</p>
                      <p className="text-neutral-600 dark:text-neutral-400 text-xs whitespace-pre-wrap">
                        {q.feedback || q.aiFeedback}
                      </p>
                    </div>
                  )}
                  {q.suggestions && (
                    <div className="text-sm mt-1">
                      <p className="text-xs text-neutral-500 mb-1">Suggestions:</p>
                      <p className="text-neutral-600 dark:text-neutral-400 text-xs whitespace-pre-wrap">{q.suggestions}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500 text-center py-2">Detailed breakdown not available for this result.</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function ExamResultsTab({
  pastPapers, additionalExams, assignmentResults, expandedId, onToggle,
}: {
  pastPapers: ExamResult[];
  additionalExams: ExamResult[];
  assignmentResults: ExamResult[];
  expandedId: string | null;
  onToggle: (id: string | null) => void;
}) {
  const total = pastPapers.length + additionalExams.length + assignmentResults.length;
  if (total === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-neutral-500">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No exam results yet.</p>
          <p className="text-sm mt-1">Complete an exam to see your results here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {pastPapers.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Past Papers</h2>
          <div className="space-y-3">
            {pastPapers.map(r => (
              <ExamResultCard key={r.id} result={r} isExpanded={expandedId === r.id} onToggle={() => onToggle(expandedId === r.id ? null : r.id)} />
            ))}
          </div>
        </div>
      )}
      {additionalExams.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Additional Exams</h2>
          <div className="space-y-3">
            {additionalExams.map(r => (
              <ExamResultCard key={r.id} result={r} isExpanded={expandedId === r.id} onToggle={() => onToggle(expandedId === r.id ? null : r.id)} />
            ))}
          </div>
        </div>
      )}
      {assignmentResults.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Assignment Results</h2>
          <div className="space-y-3">
            {assignmentResults.map(r => (
              <ExamResultCard key={r.id} result={r} isExpanded={expandedId === r.id} onToggle={() => onToggle(expandedId === r.id ? null : r.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentAttemptsTab({
  attempts, expandedId, onToggle, responses,
}: {
  attempts: AssignmentAttempt[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  responses: Record<string, AttemptResponse[]>;
}) {
  if (attempts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-neutral-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No assignment attempts yet.</p>
          <p className="text-sm mt-1">Start an assignment to see your progress here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {attempts.map(att => (
        <Card key={att.attemptId} data-testid={`card-attempt-${att.attemptId}`}>
          <Collapsible open={expandedId === att.attemptId} onOpenChange={() => onToggle(att.attemptId)}>
            <CollapsibleTrigger asChild>
              <CardContent className="p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {att.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium">{att.assignmentTitle}</p>
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Badge
                          variant={att.status === "completed" ? "default" : "secondary"}
                          className={att.status === "in_progress" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" : ""}
                        >
                          {att.status === "completed" ? "Completed" : "In Progress"}
                        </Badge>
                        <span>{att.totalResponses} responses</span>
                        {att.gradedResponses > 0 && <span>Score: {att.totalScore}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <span>{att.startedAt ? formatDateTime(att.startedAt) : ""}</span>
                    {expandedId === att.attemptId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t px-4 pb-4 pt-3 space-y-3">
                {(!responses[att.attemptId] || responses[att.attemptId].length === 0) ? (
                  <p className="text-sm text-neutral-500 text-center py-2">No responses recorded yet.</p>
                ) : (
                  responses[att.attemptId].map(resp => (
                    <div key={resp.id} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
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
                          <p className="text-xs text-neutral-500 mb-1">Your answer:</p>
                          <div className="bg-white dark:bg-neutral-950 p-2 rounded border text-neutral-800 dark:text-neutral-200">
                            <FormattedAnswer answer={resp.textAnswer} />
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
                          <p className="text-xs text-neutral-500 mb-1">Feedback:</p>
                          <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap text-xs">{resp.aiFeedback}</p>
                        </div>
                      )}
                      {!resp.textAnswer && !resp.codeAnswer && resp.marksAwarded === null && (
                        <p className="text-xs text-neutral-400 italic">No answer submitted yet</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
