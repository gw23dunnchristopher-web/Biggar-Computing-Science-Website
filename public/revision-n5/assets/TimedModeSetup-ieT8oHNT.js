import { c as createLucideIcon, u as useLocation, e as useQuestions, b as useStudentAuth, r as reactExports, j as jsxRuntimeExports } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent } from "./card-D7eXR4Y_.js";
import { R as RadioGroup, a as RadioGroupItem } from "./radio-group-4jj_ebfM.js";
import { L as Label } from "./label-DXOWQ5Is.js";
import { M as ModeToggle } from "./mode-toggle-Bf7eeVrX.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { m as motion } from "./proxy-B_4tW7TK.js";
import { C as Clock } from "./clock-CBMrk16J.js";
import { G as Globe } from "./globe-DSmc1esR.js";
import { D as Database } from "./database-C7hi9e55.js";
import { F as FileText } from "./file-text-7qIELcrq.js";
import "./index-Ck6_BvxI.js";
import "./index-C94DArSW.js";
import "./index-D-MpoJPS.js";
import "./index-CXp8eGpS.js";
import "./circle-D4qz0ZWK.js";
import "./dropdown-menu-DZfpUsGF.js";
import "./Combination-DqZOzdwe.js";
import "./chevron-right-CVWIcf-n.js";
import "./check-tIL4sncn.js";
const __iconNode = [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }]
];
const Calendar = createLucideIcon("calendar", __iconNode);
function TimedModeSetup() {
  const [, setLocation] = useLocation();
  const { questions } = useQuestions();
  const studentAuth = useStudentAuth();
  const isStudentLoggedIn = studentAuth?.isLoggedIn;
  const isTeacherLoggedIn = !!localStorage.getItem("teacherToken");
  const [optionalSection, setOptionalSection] = reactExports.useState("wd");
  const [extraTime, setExtraTime] = reactExports.useState("0");
  const [pausedExam, setPausedExam] = reactExports.useState(null);
  const [publishedPapers, setPublishedPapers] = reactExports.useState([]);
  reactExports.useEffect(() => {
    const saved = localStorage.getItem("paused_exam");
    if (saved) {
      try {
        setPausedExam(JSON.parse(saved));
      } catch (e) {
      }
    }
  }, []);
  reactExports.useEffect(() => {
    if (!isStudentLoggedIn && !isTeacherLoggedIn) return;
    const fetchPublishedPapers = async () => {
      try {
        const response = await fetch("/api/additional-papers/published");
        if (response.ok) {
          const data = await response.json();
          setPublishedPapers(data);
        }
      } catch (e) {
        console.error("Failed to fetch published papers:", e);
      }
    };
    fetchPublishedPapers();
  }, [isStudentLoggedIn, isTeacherLoggedIn]);
  const years = Array.from(new Set(questions.filter((q) => !q.isAdditionalExam && !q.isPractice).map((q) => q.year))).sort((a, b) => b - a);
  const handleResume = () => {
    if (!pausedExam) return;
    setLocation(`/timed-exam/${pausedExam.year}/${pausedExam.optionalSection}?resume=true`);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 md:p-12 font-sans", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", onClick: () => setLocation("/"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
        " Back to Home"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ModeToggle, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        className: "space-y-8",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center p-4 bg-red-100 text-red-700 rounded-full dark:bg-red-900/30 dark:text-red-300 mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-8 h-8" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-bold text-neutral-900 dark:text-white", children: "Timed Exam Mode" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto", children: "Simulate real exam conditions. You will have 1 hour 30 minutes to complete the paper. Your grade will be calculated at the end." })
          ] }),
          pausedExam && /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-red-700 dark:text-red-400", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5" }),
              " Resume Pending Exam"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium text-lg", children: [
                  String(pausedExam.year).startsWith("additional-") ? publishedPapers.find((p) => pausedExam.year === `additional-${p.id}`)?.name || "Additional Paper" : `${pausedExam.year} Paper`,
                  " (",
                  pausedExam.optionalSection === "dd" ? "Database" : "Web",
                  ")"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-neutral-500 text-sm", children: [
                  "Paused on ",
                  new Date(pausedExam.timestamp).toLocaleDateString(),
                  " at ",
                  new Date(pausedExam.timestamp).toLocaleTimeString()
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-neutral-500 text-sm mt-1", children: [
                  "Time remaining: ",
                  Math.floor(pausedExam.timeLeft / 60),
                  " mins"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleResume, className: "bg-red-600 hover:bg-red-700", children: "Resume Exam" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-neutral-200 dark:border-neutral-800 overflow-hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: "Choose Optional Section" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-4 text-neutral-600 dark:text-neutral-400", children: "Software Design and Computer Systems are mandatory. Please choose which optional section you want to attempt:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(RadioGroup, { value: optionalSection, onValueChange: (v) => setOptionalSection(v), className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RadioGroupItem, { value: "wd", id: "wd", className: "peer sr-only" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Label,
                    {
                      htmlFor: "wd",
                      className: "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-600 [&:has([data-state=checked])]:border-red-600 cursor-pointer h-full",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "mb-3 h-6 w-6" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center font-semibold", children: "Web Design & Development" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RadioGroupItem, { value: "dd", id: "dd", className: "peer sr-only" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Label,
                    {
                      htmlFor: "dd",
                      className: "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-600 [&:has([data-state=checked])]:border-red-600 cursor-pointer h-full",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "mb-3 h-6 w-6" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center font-semibold", children: "Database Design & Development" })
                      ]
                    }
                  )
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-neutral-200 dark:border-neutral-800 overflow-hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: "Additional Time (Optional)" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-4 text-neutral-600 dark:text-neutral-400", children: "If you are entitled to additional time, select your allowance below:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(RadioGroup, { value: extraTime, onValueChange: (v) => setExtraTime(v), className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RadioGroupItem, { value: "0", id: "time-0", className: "peer sr-only" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Label,
                    {
                      htmlFor: "time-0",
                      className: "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-600 [&:has([data-state=checked])]:border-red-600 cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: "1h 30m" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-neutral-500", children: "Standard" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RadioGroupItem, { value: "25", id: "time-25", className: "peer sr-only" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Label,
                    {
                      htmlFor: "time-25",
                      className: "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-green-600", children: "+25%" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-neutral-500", children: "1h 53m" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RadioGroupItem, { value: "33", id: "time-33", className: "peer sr-only" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Label,
                    {
                      htmlFor: "time-33",
                      className: "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-green-600", children: "+33%" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-neutral-500", children: "2h" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RadioGroupItem, { value: "50", id: "time-50", className: "peer sr-only" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Label,
                    {
                      htmlFor: "time-50",
                      className: "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-green-600", children: "+50%" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-neutral-500", children: "2h 15m" })
                      ]
                    }
                  )
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [
            publishedPapers.map((paper) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Card,
              {
                className: "hover:shadow-lg transition-all cursor-pointer border-amber-200 dark:border-amber-800 hover:border-amber-500 group",
                onClick: () => setLocation(`/timed-exam/additional-${paper.id}/${optionalSection}?extraTime=${extraTime}`),
                "data-testid": `card-paper-${paper.id}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-3 text-2xl", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-6 h-6 text-amber-400 group-hover:text-amber-500 transition-colors" }),
                    paper.name
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-neutral-500", children: [
                      "Start ",
                      paper.name,
                      " with ",
                      optionalSection === "dd" ? "Database" : "Web"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center text-amber-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity", children: [
                      "Start Exam ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "ml-2 w-4 h-4 rotate-180" })
                    ] })
                  ] })
                ]
              },
              paper.id
            )),
            years.map((year) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Card,
              {
                className: "hover:shadow-lg transition-all cursor-pointer border-neutral-200 dark:border-neutral-800 hover:border-red-500 group",
                onClick: () => setLocation(`/timed-exam/${year}/${optionalSection}?extraTime=${extraTime}`),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-3 text-2xl", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-6 h-6 text-neutral-400 group-hover:text-red-500 transition-colors" }),
                    year,
                    " Paper"
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-neutral-500", children: [
                      "Start ",
                      year,
                      " Exam with ",
                      optionalSection === "dd" ? "Database" : "Web"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center text-red-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity", children: [
                      "Start Exam ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "ml-2 w-4 h-4 rotate-180" })
                    ] })
                  ] })
                ]
              },
              year
            ))
          ] })
        ]
      }
    )
  ] }) });
}
export {
  TimedModeSetup as default
};
//# sourceMappingURL=TimedModeSetup-ieT8oHNT.js.map
