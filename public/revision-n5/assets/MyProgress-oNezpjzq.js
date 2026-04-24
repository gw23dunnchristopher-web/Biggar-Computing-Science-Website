import { c as createLucideIcon, u as useLocation, b as useStudentAuth, r as reactExports, j as jsxRuntimeExports, L as Link } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { C as Card, d as CardContent } from "./card-D7eXR4Y_.js";
import { B as Badge } from "./badge-CTdnfMqk.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CtGyirbS.js";
import { L as LoaderCircle } from "./loader-circle-BUW4OaHl.js";
import { C as CircleAlert } from "./circle-alert-DWz_G-vq.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { F as FileText } from "./file-text-7qIELcrq.js";
import { B as BookOpen } from "./book-open-CHMNkO2H.js";
import { C as ChevronUp } from "./chevron-up-BGYeYs9P.js";
import { C as ChevronDown } from "./chevron-down-C5HdvL5Z.js";
import "./index-Ck6_BvxI.js";
import "./index-C94DArSW.js";
import "./index-D-MpoJPS.js";
const __iconNode = [
  ["path", { d: "m10 17 5-5-5-5", key: "1bsop3" }],
  ["path", { d: "M15 12H3", key: "6jk70r" }],
  ["path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", key: "u53s6r" }]
];
const LogIn = createLucideIcon("log-in", __iconNode);
function getStudentHeaders() {
  const token = localStorage.getItem("studentToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function gradeColor(grade) {
  switch (grade) {
    case "A":
      return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
    case "B":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
    case "C":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
    case "D":
      return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400";
    default:
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
  }
}
function formatAnswer(answer) {
  if (!answer) return "No answer provided";
  if (typeof answer === "string") return answer;
  if (typeof answer === "object") {
    try {
      return JSON.stringify(answer, null, 2);
    } catch {
      return String(answer);
    }
  }
  return String(answer);
}
function ExamResultCard({ result }) {
  const [expanded, setExpanded] = reactExports.useState(false);
  const percentage = result.maxScore > 0 ? Math.round(result.score / result.maxScore * 100) : 0;
  let label = result.year === 0 ? "Additional Paper" : `${result.year} Paper`;
  if (result.optionalSection) {
    label += ` (${result.optionalSection === "dd" ? "Database" : result.optionalSection === "wd" ? "Web" : result.optionalSection})`;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden", "data-testid": `exam-result-${result.id}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900",
        onClick: () => setExpanded(!expanded),
        "data-testid": `exam-result-toggle-${result.id}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-5 w-5 text-neutral-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-sm", children: label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-neutral-500", children: formatDate(result.timestamp) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: gradeColor(result.grade), "data-testid": `exam-grade-${result.id}`, children: result.grade }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", "data-testid": `exam-score-${result.id}`, children: [
              result.score,
              "/",
              result.maxScore
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-500", children: [
              "(",
              percentage,
              "%)"
            ] }),
            expanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" })
          ] })
        ]
      }
    ),
    expanded && result.breakdown && result.breakdown.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "border-t pt-4 space-y-3", children: result.breakdown.map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg p-3 space-y-2", "data-testid": `exam-breakdown-${result.id}-${idx}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm", children: item.questionTitle }),
          item.subLabel && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-500 ml-2", children: item.subLabel })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: item.score >= item.maxMarks ? "default" : "secondary", children: [
          item.score,
          "/",
          item.maxMarks
        ] })
      ] }),
      item.questionText && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-600 dark:text-neutral-400", children: item.questionText }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-neutral-50 dark:bg-neutral-800 rounded p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-neutral-500 mb-1", children: "Your Answer:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm whitespace-pre-wrap", children: formatAnswer(item.userAnswer) })
      ] }),
      item.feedback && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50 dark:bg-blue-950/30 rounded p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-blue-600 dark:text-blue-400 mb-1", children: "AI Feedback:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-blue-800 dark:text-blue-300", children: item.feedback })
      ] }),
      item.suggestions && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-amber-50 dark:bg-amber-950/30 rounded p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-amber-600 dark:text-amber-400 mb-1", children: "Suggestions:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-amber-800 dark:text-amber-300", children: item.suggestions })
      ] })
    ] }, idx)) }),
    expanded && (!result.breakdown || result.breakdown.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "border-t pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 text-center py-2", children: "No detailed breakdown available for this result." }) })
  ] });
}
function AssignmentAttemptCard({ attempt }) {
  const [expanded, setExpanded] = reactExports.useState(false);
  const [responses, setResponses] = reactExports.useState([]);
  const [loadingResponses, setLoadingResponses] = reactExports.useState(false);
  const totalMarks = responses.reduce((sum, r) => sum + (r.marksAwarded || 0), 0);
  const [responseError, setResponseError] = reactExports.useState(null);
  const handleToggle = async () => {
    if (!expanded && responses.length === 0 && !responseError) {
      setLoadingResponses(true);
      setResponseError(null);
      try {
        const res = await fetch(`/api/student/assignment-attempts/${attempt.id}/responses`, {
          headers: getStudentHeaders()
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden", "data-testid": `assignment-attempt-${attempt.id}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900",
        onClick: handleToggle,
        "data-testid": `assignment-attempt-toggle-${attempt.id}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-5 w-5 text-neutral-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-sm", children: attempt.assignmentTitle || "Assignment" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-neutral-500", children: attempt.completedAt ? formatDate(attempt.completedAt) : attempt.startedAt ? `Started ${formatDate(attempt.startedAt)}` : "" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: attempt.status === "completed" ? "default" : "secondary", children: attempt.status === "in_progress" ? "In Progress" : attempt.status === "paused" ? "Paused" : "Completed" }),
            expanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" })
          ] })
        ]
      }
    ),
    expanded && /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "border-t pt-4 space-y-3", children: [
      loadingResponses && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin text-neutral-400" }) }),
      !loadingResponses && responseError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-red-600 dark:text-red-400 text-sm py-2 justify-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4" }),
        responseError
      ] }),
      !loadingResponses && !responseError && responses.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 text-center py-2", children: "No responses recorded yet." }),
      !loadingResponses && responses.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-medium text-neutral-600 dark:text-neutral-400", children: [
          responses.length,
          " response",
          responses.length !== 1 ? "s" : "",
          " — Total marks: ",
          totalMarks
        ] }),
        responses.map((resp, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg p-3 space-y-2", "data-testid": `response-${resp.id}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
              "Response ",
              idx + 1
            ] }),
            resp.marksAwarded !== null && resp.marksAwarded !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "default", children: [
              resp.marksAwarded,
              " mark",
              resp.marksAwarded !== 1 ? "s" : ""
            ] })
          ] }),
          resp.textAnswer && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-neutral-50 dark:bg-neutral-800 rounded p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-neutral-500 mb-1", children: "Answer:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm whitespace-pre-wrap", children: resp.textAnswer })
          ] }),
          resp.codeAnswer && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-neutral-900 dark:bg-neutral-800 rounded p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-neutral-400 mb-1", children: "Code:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-sm text-green-400 whitespace-pre-wrap font-mono", children: resp.codeAnswer })
          ] }),
          resp.aiFeedback && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50 dark:bg-blue-950/30 rounded p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-blue-600 dark:text-blue-400 mb-1", children: "AI Feedback:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-blue-800 dark:text-blue-300", children: resp.aiFeedback })
          ] })
        ] }, resp.id))
      ] })
    ] })
  ] });
}
function MyProgress() {
  const [, setLocation] = useLocation();
  const studentAuth = useStudentAuth();
  const [examResults, setExamResults] = reactExports.useState([]);
  const [assignments, setAssignments] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [sessionExpired, setSessionExpired] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (studentAuth.isLoading) return;
    if (!studentAuth.isLoggedIn) {
      setSessionExpired(true);
      setLoading(false);
      return;
    }
    const headers = getStudentHeaders();
    Promise.all([
      fetch("/api/student/exam-results", { headers }).then(async (res) => {
        if (res.status === 401) {
          setSessionExpired(true);
          return [];
        }
        if (!res.ok) return [];
        return res.json();
      }),
      fetch("/api/student/assignment-attempts", { headers }).then(async (res) => {
        if (res.status === 401) {
          setSessionExpired(true);
          return [];
        }
        if (!res.ok) return [];
        return res.json();
      })
    ]).then(([exams, assigns]) => {
      setExamResults(exams);
      setAssignments(assigns);
    }).catch(console.error).finally(() => setLoading(false));
  }, [studentAuth.isLoggedIn, studentAuth.isLoading]);
  if (studentAuth.isLoading || loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-neutral-400" }) });
  }
  if (sessionExpired || !studentAuth.isLoggedIn) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "max-w-md w-full mx-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 text-center space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-12 w-12 text-amber-500 mx-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold", children: "Session Expired" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-500", children: "Your session has expired or you're not signed in. Please sign in to view your progress." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: "/student/login", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "gap-2", "data-testid": "button-signin-redirect", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LogIn, { className: "h-4 w-4" }),
        "Sign In"
      ] }) })
    ] }) }) });
  }
  const sortedExams = [...examResults].sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
  const sortedAssignments = [...assignments].sort((a, b) => (b.completedAt || b.startedAt || "").localeCompare(a.completedAt || a.startedAt || ""));
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => setLocation("/"), "data-testid": "button-back-home", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "My Progress" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500", children: studentAuth.username })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "exams", className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "w-full", "data-testid": "tabs-progress", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "exams", className: "flex-1", "data-testid": "tab-exams", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4 mr-2" }),
          "Exam Results (",
          sortedExams.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "assignments", className: "flex-1", "data-testid": "tab-assignments", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-4 w-4 mr-2" }),
          "Assignments (",
          sortedAssignments.length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "exams", className: "space-y-3", "data-testid": "content-exams", children: sortedExams.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-8 text-center text-neutral-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-10 w-10 mx-auto mb-3 text-neutral-300" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No exam results yet. Complete a timed exam to see your results here." })
      ] }) }) : sortedExams.map((result) => /* @__PURE__ */ jsxRuntimeExports.jsx(ExamResultCard, { result }, result.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "assignments", className: "space-y-3", "data-testid": "content-assignments", children: sortedAssignments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-8 text-center text-neutral-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-10 w-10 mx-auto mb-3 text-neutral-300" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No assignment attempts yet. Start an assignment to track your progress here." })
      ] }) }) : sortedAssignments.map((attempt) => /* @__PURE__ */ jsxRuntimeExports.jsx(AssignmentAttemptCard, { attempt }, attempt.id)) })
    ] })
  ] }) });
}
export {
  MyProgress as default
};
//# sourceMappingURL=MyProgress-oNezpjzq.js.map
