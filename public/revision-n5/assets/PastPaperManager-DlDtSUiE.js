import { u as useLocation, e as useQuestions, r as reactExports, f as compareQuestionsByNumber, j as jsxRuntimeExports, T as TOPICS } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent } from "./card-D7eXR4Y_.js";
import { I as Input } from "./input-BglVfhce.js";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-Dav9MFAg.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-CwuHQhjb.js";
import { M as ModeToggle } from "./mode-toggle-Bf7eeVrX.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { S as Search } from "./search-CxbrkDLo.js";
import { P as Plus } from "./plus-Bl_GJopp.js";
import { C as ChevronDown } from "./chevron-down-C5HdvL5Z.js";
import { S as SquarePen } from "./square-pen-Xz0XRNBD.js";
import { T as Trash2 } from "./trash-2-bLg5w6uM.js";
import "./index-CxDJjHs5.js";
import "./index-C94DArSW.js";
import "./Combination-DqZOzdwe.js";
import "./dropdown-menu-DZfpUsGF.js";
import "./index-D-MpoJPS.js";
import "./index-Ck6_BvxI.js";
import "./chevron-right-CVWIcf-n.js";
import "./check-tIL4sncn.js";
import "./circle-D4qz0ZWK.js";
function getQuestionPreviewText(question) {
  const scenarioText = question.scenario?.contentBlocks?.find((b) => b.type === "text")?.content || question.scenario?.text;
  if (scenarioText) return scenarioText;
  const firstSubQ = question.subQuestions[0];
  if (firstSubQ) {
    const subQText = firstSubQ.contentBlocks?.find((b) => b.type === "text")?.content || firstSubQ.questionText;
    if (subQText) return subQText;
  }
  return "No scenario text";
}
function calculateTotalMarks(question) {
  let total = 0;
  for (const sq of question.subQuestions) {
    if (sq.subParts && sq.subParts.length > 0) {
      for (const part of sq.subParts) {
        total += part.maxMarks || 0;
      }
    } else {
      total += sq.maxMarks || 0;
    }
  }
  return total;
}
function PastPaperManager() {
  const [, setLocation] = useLocation();
  const { questions, deleteQuestion } = useQuestions();
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  reactExports.useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("teacher_token");
      const expires = localStorage.getItem("teacher_token_expires");
      if (!token || !expires || parseInt(expires) < Date.now()) {
        localStorage.removeItem("teacher_token");
        localStorage.removeItem("teacher_token_expires");
        setLocation("/teacher/login");
        return;
      }
      try {
        const response = await fetch("/api/teacher/verify", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          localStorage.removeItem("teacher_token");
          localStorage.removeItem("teacher_token_expires");
          setLocation("/teacher/login");
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
      }
    };
    verifyAuth();
  }, [setLocation]);
  const getTopicName = (id) => TOPICS.find((t) => t.id === id)?.name || id;
  const filteredQuestions = questions.filter((q) => {
    const term = searchTerm.toLowerCase();
    if (q.title.toLowerCase().includes(term)) return true;
    if (q.year && q.year.toString().includes(searchTerm)) return true;
    if (q.isAdditionalExam && "additional exam".includes(term)) return true;
    const scenarioText = q.scenario?.contentBlocks?.find((b) => b.type === "text")?.content || q.scenario?.text || "";
    if (scenarioText.toLowerCase().includes(term)) return true;
    if (q.subQuestions.some((sq) => {
      const subQText = sq.contentBlocks?.find((b) => b.type === "text")?.content || sq.questionText || "";
      return subQText.toLowerCase().includes(term);
    })) return true;
    if (q.subQuestions.some((sq) => sq.markingScheme.some((ms) => ms.toLowerCase().includes(term)))) return true;
    if (q.subQuestions.some((sq) => sq.keywords?.some((kw) => kw.toLowerCase().includes(term)))) return true;
    return false;
  }).sort(compareQuestionsByNumber);
  const practiceQuestions = filteredQuestions.filter((q) => q.isPractice).sort(compareQuestionsByNumber);
  const additionalExamQuestions = filteredQuestions.filter((q) => q.isAdditionalExam && !q.isPractice).sort(compareQuestionsByNumber);
  const pastPaperQuestions = filteredQuestions.filter((q) => !q.isPractice && !q.isAdditionalExam);
  const questionsByYear = pastPaperQuestions.reduce((acc, q) => {
    const year = q.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(q);
    return acc;
  }, {});
  Object.keys(questionsByYear).forEach((year) => {
    questionsByYear[Number(year)].sort(compareQuestionsByNumber);
  });
  const sortedYears = Object.keys(questionsByYear).map(Number).sort((a, b) => b - a);
  function QuestionCard({ question, badge }) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "hover:shadow-md transition-shadow border-neutral-200 dark:border-neutral-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3 flex flex-row items-start justify-between space-y-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
            badge,
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded bg-neutral-50 dark:bg-neutral-900", children: getTopicName(question.topic) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: question.title })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setLocation(`/teacher/question/${question.id}`), "data-testid": `button-edit-${question.id}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-4 w-4 mr-2" }),
            " Edit"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "text-red-500 hover:bg-red-50 hover:text-red-600", "data-testid": `button-delete-${question.id}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Delete Question?" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
                  'Are you sure you want to delete "',
                  question.title,
                  '"? This action cannot be undone.'
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => deleteQuestion(question.id), className: "bg-red-600 hover:bg-red-700", children: "Delete" })
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-600 dark:text-neutral-300 text-sm line-clamp-2", children: getQuestionPreviewText(question) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 text-xs text-neutral-500", children: [
          question.subQuestions.length,
          " sub-question(s) · ",
          calculateTotalMarks(question),
          " total marks"
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-[200]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto max-w-6xl flex justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: () => setLocation("/teacher/dashboard"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
          " Back"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-neutral-900 dark:text-white", children: "Past Paper Manager" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full", children: [
          questions.length,
          " Questions"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ModeToggle, {})
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "container mx-auto max-w-6xl p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center gap-4 mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full md:w-96", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: "Search questions...",
              className: "pl-10",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              "data-testid": "input-search-questions"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setLocation("/teacher/question/new"), className: "bg-red-600 hover:bg-red-700", "data-testid": "button-add-question", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
          " Add New Question"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-8", children: [
        practiceQuestions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Collapsible, { defaultOpen: true, className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CollapsibleTrigger, { className: "flex items-center gap-2 w-full group cursor-pointer py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-lg px-2 -mx-2 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-5 w-5 text-neutral-400 transition-transform duration-200 group-data-[state=closed]:-rotate-90" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-neutral-800 dark:text-neutral-200", children: "Practice Questions" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 border-b border-neutral-200 dark:border-neutral-700 mt-1 ml-2 group-hover:border-neutral-300 dark:group-hover:border-neutral-600 transition-colors" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-400 font-medium", children: [
              practiceQuestions.length,
              " questions"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { className: "pt-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: practiceQuestions.map((question) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            QuestionCard,
            {
              question,
              badge: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded bg-green-50 dark:bg-green-950/30 font-medium", children: "PRACTICE" })
            },
            question.id
          )) }) })
        ] }),
        additionalExamQuestions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Collapsible, { defaultOpen: false, className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CollapsibleTrigger, { className: "flex items-center gap-2 w-full group cursor-pointer py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-lg px-2 -mx-2 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-5 w-5 text-neutral-400 transition-transform duration-200 group-data-[state=closed]:-rotate-90" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-blue-600 dark:text-blue-400", children: "Additional Exams" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 border-b border-neutral-200 dark:border-neutral-700 mt-1 ml-2 group-hover:border-neutral-300 dark:group-hover:border-neutral-600 transition-colors" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-400 font-medium", children: [
              additionalExamQuestions.length,
              " questions"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { className: "pt-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: additionalExamQuestions.map((question) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            QuestionCard,
            {
              question,
              badge: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-blue-500 border border-blue-200 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700", children: "Additional Exam" })
            },
            question.id
          )) }) })
        ] }),
        sortedYears.map((year) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Collapsible, { defaultOpen: false, className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CollapsibleTrigger, { className: "flex items-center gap-2 w-full group cursor-pointer py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-lg px-2 -mx-2 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-5 w-5 text-neutral-400 transition-transform duration-200 group-data-[state=closed]:-rotate-90" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-neutral-800 dark:text-neutral-200", children: year }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 border-b border-neutral-200 dark:border-neutral-700 mt-1 ml-2 group-hover:border-neutral-300 dark:group-hover:border-neutral-600 transition-colors" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-400 font-medium", children: [
              questionsByYear[year].length,
              " questions"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { className: "pt-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: questionsByYear[year].map((question) => /* @__PURE__ */ jsxRuntimeExports.jsx(QuestionCard, { question }, question.id)) }) })
        ] }, year)),
        filteredQuestions.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-12 text-neutral-500", children: "No questions found matching your search." })
      ] })
    ] })
  ] });
}
export {
  PastPaperManager as default
};
//# sourceMappingURL=PastPaperManager-DlDtSUiE.js.map
