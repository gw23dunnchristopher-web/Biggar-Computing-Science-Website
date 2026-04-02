import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useStudentAuth } from "@/components/StudentAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, FileText, ChevronDown, ChevronUp, Loader2, AlertCircle, LogIn } from "lucide-react";

function getStudentHeaders(): Record<string, string> {
  const token = localStorage.getItem("studentToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type BreakdownItem = {
  questionTitle: string;
  subLabel: string;
  questionText?: string;
  maxMarks: number;
  score: number;
  userAnswer: any;
  feedback?: string;
  suggestions?: string;
};

type ExamResult = {
  id: string;
  year: number;
  optionalSection?: string;
  score: number;
  maxScore: number;
  grade: string;
  breakdown?: BreakdownItem[];
  timestamp?: string;
};

type AssignmentResponse = {
  id: string;
  partId: string;
  subQuestionId?: string;
  textAnswer?: string;
  codeAnswer?: string;
  marksAwarded?: number;
  aiFeedback?: string;
  submittedAt?: string;
};

type AssignmentAttempt = {
  id: string;
  assignmentId: string;
  assignmentTitle?: string;
  status: string;
  completedAt?: string;
  startedAt?: string;
  responses?: AssignmentResponse[];
};

function formatDate(ts?: string): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function gradeColor(grade: string): string {
  switch (grade) {
    case "A": return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
    case "B": return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
    case "C": return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
    case "D": return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400";
    default: return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
  }
}

function formatAnswer(answer: any): string {
  if (!answer) return "No answer provided";
  if (typeof answer === "string") return answer;
  if (typeof answer === "object") {
    try { return JSON.stringify(answer, null, 2); } catch { return String(answer); }
  }
  return String(answer);
}

function ExamResultCard({ result }: { result: ExamResult }) {
  const [expanded, setExpanded] = useState(false);
  const percentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;

  let label = result.year === 0 ? "Additional Paper" : `${result.year} Paper`;
  if (result.optionalSection) {
    label += ` (${result.optionalSection === "dd" ? "Database" : result.optionalSection === "wd" ? "Web" : result.optionalSection})`;
  }

  return (
    <Card className="overflow-hidden" data-testid={`exam-result-${result.id}`}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
        onClick={() => setExpanded(!expanded)}
        data-testid={`exam-result-toggle-${result.id}`}
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-neutral-400" />
          <div>
            <div className="font-medium text-sm">{label}</div>
            <div className="text-xs text-neutral-500">{formatDate(result.timestamp)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={gradeColor(result.grade)} data-testid={`exam-grade-${result.id}`}>{result.grade}</Badge>
          <span className="text-sm font-medium" data-testid={`exam-score-${result.id}`}>{result.score}/{result.maxScore}</span>
          <span className="text-xs text-neutral-500">({percentage}%)</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && result.breakdown && result.breakdown.length > 0 && (
        <CardContent className="border-t pt-4 space-y-3">
          {result.breakdown.map((item, idx) => (
            <div key={idx} className="border rounded-lg p-3 space-y-2" data-testid={`exam-breakdown-${result.id}-${idx}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{item.questionTitle}</span>
                  {item.subLabel && <span className="text-xs text-neutral-500 ml-2">{item.subLabel}</span>}
                </div>
                <Badge variant={item.score >= item.maxMarks ? "default" : "secondary"}>
                  {item.score}/{item.maxMarks}
                </Badge>
              </div>
              {item.questionText && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400">{item.questionText}</p>
              )}
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded p-2">
                <div className="text-xs font-medium text-neutral-500 mb-1">Your Answer:</div>
                <div className="text-sm whitespace-pre-wrap">{formatAnswer(item.userAnswer)}</div>
              </div>
              {item.feedback && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-2">
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">AI Feedback:</div>
                  <div className="text-sm text-blue-800 dark:text-blue-300">{item.feedback}</div>
                </div>
              )}
              {item.suggestions && (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded p-2">
                  <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Suggestions:</div>
                  <div className="text-sm text-amber-800 dark:text-amber-300">{item.suggestions}</div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      )}

      {expanded && (!result.breakdown || result.breakdown.length === 0) && (
        <CardContent className="border-t pt-4">
          <p className="text-sm text-neutral-500 text-center py-2">No detailed breakdown available for this result.</p>
        </CardContent>
      )}
    </Card>
  );
}

function AssignmentAttemptCard({ attempt }: { attempt: AssignmentAttempt }) {
  const [expanded, setExpanded] = useState(false);
  const [responses, setResponses] = useState<AssignmentResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const totalMarks = responses.reduce((sum, r) => sum + (r.marksAwarded || 0), 0);

  const [responseError, setResponseError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (!expanded && responses.length === 0 && !responseError) {
      setLoadingResponses(true);
      setResponseError(null);
      try {
        const res = await fetch(`/api/student/assignment-attempts/${attempt.id}/responses`, {
          headers: getStudentHeaders(),
        });
        if (res.status === 401 || res.status === 403) {
          setResponseError("Session expired or access denied.");
        } else if (!res.ok) {
          setResponseError("Failed to load responses.");
        } else {
          const data = await res.json();
          setResponses(data);
        }
      } catch (e) {
        console.error(e);
        setResponseError("Network error loading responses.");
      } finally {
        setLoadingResponses(false);
      }
    }
    setExpanded(!expanded);
  };

  return (
    <Card className="overflow-hidden" data-testid={`assignment-attempt-${attempt.id}`}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
        onClick={handleToggle}
        data-testid={`assignment-attempt-toggle-${attempt.id}`}
      >
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-neutral-400" />
          <div>
            <div className="font-medium text-sm">{attempt.assignmentTitle || "Assignment"}</div>
            <div className="text-xs text-neutral-500">
              {attempt.completedAt ? formatDate(attempt.completedAt) : attempt.startedAt ? `Started ${formatDate(attempt.startedAt)}` : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={attempt.status === "completed" ? "default" : "secondary"}>
            {attempt.status === "in_progress" ? "In Progress" : attempt.status === "paused" ? "Paused" : "Completed"}
          </Badge>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <CardContent className="border-t pt-4 space-y-3">
          {loadingResponses && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
            </div>
          )}

          {!loadingResponses && responseError && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm py-2 justify-center">
              <AlertCircle className="h-4 w-4" />
              {responseError}
            </div>
          )}

          {!loadingResponses && !responseError && responses.length === 0 && (
            <p className="text-sm text-neutral-500 text-center py-2">No responses recorded yet.</p>
          )}

          {!loadingResponses && responses.length > 0 && (
            <>
              <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {responses.length} response{responses.length !== 1 ? "s" : ""} — Total marks: {totalMarks}
              </div>
              {responses.map((resp, idx) => (
                <div key={resp.id} className="border rounded-lg p-3 space-y-2" data-testid={`response-${resp.id}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response {idx + 1}</span>
                    {resp.marksAwarded !== null && resp.marksAwarded !== undefined && (
                      <Badge variant="default">{resp.marksAwarded} mark{resp.marksAwarded !== 1 ? "s" : ""}</Badge>
                    )}
                  </div>

                  {resp.textAnswer && (
                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded p-2">
                      <div className="text-xs font-medium text-neutral-500 mb-1">Answer:</div>
                      <div className="text-sm whitespace-pre-wrap">{resp.textAnswer}</div>
                    </div>
                  )}

                  {resp.codeAnswer && (
                    <div className="bg-neutral-900 dark:bg-neutral-800 rounded p-2">
                      <div className="text-xs font-medium text-neutral-400 mb-1">Code:</div>
                      <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono">{resp.codeAnswer}</pre>
                    </div>
                  )}

                  {resp.aiFeedback && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-2">
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">AI Feedback:</div>
                      <div className="text-sm text-blue-800 dark:text-blue-300">{resp.aiFeedback}</div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function MyProgress() {
  const [, setLocation] = useLocation();
  const studentAuth = useStudentAuth();
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [assignments, setAssignments] = useState<AssignmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (studentAuth.isLoading) return;

    if (!studentAuth.isLoggedIn) {
      setSessionExpired(true);
      setLoading(false);
      return;
    }

    const headers = getStudentHeaders();

    Promise.all([
      fetch("/api/student/exam-results", { headers }).then(async (res) => {
        if (res.status === 401) { setSessionExpired(true); return []; }
        if (!res.ok) return [];
        return res.json();
      }),
      fetch("/api/student/assignment-attempts", { headers }).then(async (res) => {
        if (res.status === 401) { setSessionExpired(true); return []; }
        if (!res.ok) return [];
        return res.json();
      }),
    ])
      .then(([exams, assigns]) => {
        setExamResults(exams);
        setAssignments(assigns);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentAuth.isLoggedIn, studentAuth.isLoading]);

  if (studentAuth.isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (sessionExpired || !studentAuth.isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-semibold">Session Expired</h2>
            <p className="text-neutral-500">Your session has expired or you're not signed in. Please sign in to view your progress.</p>
            <Link href="/student/login">
              <Button className="gap-2" data-testid="button-signin-redirect">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedExams = [...examResults].sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
  const sortedAssignments = [...assignments].sort((a, b) => (b.completedAt || b.startedAt || "").localeCompare(a.completedAt || a.startedAt || ""));

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back-home">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Progress</h1>
            <p className="text-sm text-neutral-500">{studentAuth.username}</p>
          </div>
        </div>

        <Tabs defaultValue="exams" className="space-y-4">
          <TabsList className="w-full" data-testid="tabs-progress">
            <TabsTrigger value="exams" className="flex-1" data-testid="tab-exams">
              <FileText className="h-4 w-4 mr-2" />
              Exam Results ({sortedExams.length})
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex-1" data-testid="tab-assignments">
              <BookOpen className="h-4 w-4 mr-2" />
              Assignments ({sortedAssignments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exams" className="space-y-3" data-testid="content-exams">
            {sortedExams.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-neutral-500">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
                  <p>No exam results yet. Complete a timed exam to see your results here.</p>
                </CardContent>
              </Card>
            ) : (
              sortedExams.map((result) => (
                <ExamResultCard key={result.id} result={result} />
              ))
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-3" data-testid="content-assignments">
            {sortedAssignments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-neutral-500">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
                  <p>No assignment attempts yet. Start an assignment to track your progress here.</p>
                </CardContent>
              </Card>
            ) : (
              sortedAssignments.map((attempt) => (
                <AssignmentAttemptCard key={attempt.id} attempt={attempt} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
