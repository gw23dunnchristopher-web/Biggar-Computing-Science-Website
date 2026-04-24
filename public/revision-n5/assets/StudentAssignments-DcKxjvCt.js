import { u as useLocation, r as reactExports, j as jsxRuntimeExports } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle, c as CardDescription } from "./card-D7eXR4Y_.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { F as FileText } from "./file-text-7qIELcrq.js";
import { C as Clock } from "./clock-CBMrk16J.js";
import { P as Play } from "./play-D5zzeji7.js";
import { C as CirclePause } from "./circle-pause-DkpsFpZH.js";
import { C as CircleCheck } from "./circle-check-CfjmjGXe.js";
function StudentAssignments() {
  const [, setLocation] = useLocation();
  const [assignments, setAssignments] = reactExports.useState([]);
  const [attempts, setAttempts] = reactExports.useState(/* @__PURE__ */ new Map());
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    fetchAssignments();
  }, []);
  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/n5/assignments/active");
      if (!response.ok) throw new Error("Failed to fetch assignments");
      const data = await response.json();
      setAssignments(data);
      const localStudentId = getOrCreateStudentId();
      const attemptMap = /* @__PURE__ */ new Map();
      try {
        const attemptsResponse = await fetch(`/api/n5/assignment-attempts/student/${localStudentId}`);
        if (attemptsResponse.ok) {
          const serverAttempts = await attemptsResponse.json();
          for (const attempt of serverAttempts) {
            if (attempt.status === "cancelled") continue;
            attemptMap.set(attempt.assignmentId, attempt);
            localStorage.setItem(`assignment_attempt_${attempt.assignmentId}`, JSON.stringify(attempt));
          }
        }
      } catch (e) {
        console.warn("Failed to fetch server attempts, using localStorage:", e);
        for (const assignment of data) {
          const attemptKey = `assignment_attempt_${assignment.id}`;
          const stored = localStorage.getItem(attemptKey);
          if (stored) {
            try {
              const attemptData = JSON.parse(stored);
              attemptMap.set(assignment.id, attemptData);
            } catch {
            }
          }
        }
      }
      setAttempts(attemptMap);
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoading(false);
    }
  };
  const getOrCreateStudentId = () => {
    let studentId = localStorage.getItem("local_student_id");
    if (!studentId) {
      studentId = `student_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("local_student_id", studentId);
    }
    return studentId;
  };
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours} hours ${mins > 0 ? `${mins} minutes` : ""}` : `${mins} minutes`;
  };
  const formatTimeRemaining = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor(seconds % 3600 / 60);
    return hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`;
  };
  const handleStartAssignment = (assignmentId) => {
    setLocation(`/assignment/${assignmentId}`);
  };
  const handleContinueAssignment = (assignmentId) => {
    setLocation(`/assignment/${assignmentId}`);
  };
  const getAttemptStatus = (assignment) => {
    const attempt = attempts.get(assignment.id);
    if (!attempt || attempt.status === "cancelled") return { status: "not_started" };
    return {
      status: attempt.status,
      attempt
    };
  };
  const sortedAssignments = [...assignments].sort((a, b) => b.year - a.year);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 py-8 px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "icon",
          onClick: () => setLocation("/"),
          "data-testid": "back-button",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-5 w-5" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-neutral-900 dark:text-neutral-100", children: "N5 Coursework Assignments" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-600 dark:text-neutral-400", children: "Complete your coursework assignment worth 40 marks (6 hours)" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "mb-8 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-blue-900 dark:text-blue-100 mb-2", children: "Assignment Information" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-blue-800 dark:text-blue-200 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "The assignment is worth 40 marks and you have 6 hours to complete it." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "There are three sections - SDD, DDD, and WDD." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "You must complete the Software Design and Development Section." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "You can then choose ONE of: Database Design and Development OR Web Design and Development." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Each section is divided into parts, once you complete a part and move on you cannot go back to is." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "You can pause and resume at any time - your progress is saved." })
      ] })
    ] }) }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" }) }) : assignments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-12 w-12 mx-auto mb-4 text-neutral-400" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium mb-2", children: "No Assignments Available" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-600 dark:text-neutral-400", children: "Check back later for available assignments" })
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: sortedAssignments.map((assignment) => {
      const { status, attempt } = getAttemptStatus(assignment);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-testid": `assignment-card-${assignment.id}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { children: [
              assignment.year,
              " - Assignment"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "flex items-center gap-4 mt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }),
                formatTime(assignment.totalTimeMinutes)
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                assignment.totalMarks,
                " marks"
              ] })
            ] })
          ] }),
          status === "not_started" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => handleStartAssignment(assignment.id),
              className: "bg-green-600 hover:bg-green-700",
              "data-testid": `start-assignment-${assignment.id}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4 mr-2" }),
                "Start Assignment"
              ]
            }
          ),
          status === "in_progress" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }),
              formatTimeRemaining(attempt.timeRemainingSeconds)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                onClick: () => handleContinueAssignment(assignment.id),
                className: "bg-orange-600 hover:bg-orange-700",
                "data-testid": `continue-assignment-${assignment.id}`,
                children: "Continue"
              }
            )
          ] }),
          status === "paused" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePause, { className: "h-4 w-4" }),
              "Paused - ",
              formatTimeRemaining(attempt.timeRemainingSeconds)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                onClick: () => handleContinueAssignment(assignment.id),
                variant: "outline",
                "data-testid": `resume-assignment-${assignment.id}`,
                children: "Resume"
              }
            )
          ] }),
          status === "completed" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-green-600 dark:text-green-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-5 w-5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Completed" })
          ] })
        ] }) }),
        (status === "in_progress" || status === "paused") && attempt && /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-0 border-t", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-neutral-600 dark:text-neutral-400", children: [
            "Optional section: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium capitalize", children: attempt.chosenOptionalSection })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-neutral-600 dark:text-neutral-400", children: [
            "Parts completed: ",
            attempt.completedPartIds?.length || 0
          ] })
        ] }) })
      ] }, assignment.id);
    }) })
  ] }) });
}
export {
  StudentAssignments as default
};
//# sourceMappingURL=StudentAssignments-DcKxjvCt.js.map
