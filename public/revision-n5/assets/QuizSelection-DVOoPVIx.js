import { c as createLucideIcon, u as useLocation, r as reactExports, j as jsxRuntimeExports } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent, c as CardDescription } from "./card-D7eXR4Y_.js";
import { R as RadioGroup, a as RadioGroupItem } from "./radio-group-4jj_ebfM.js";
import { L as Label } from "./label-DXOWQ5Is.js";
import { M as ModeToggle } from "./mode-toggle-Bf7eeVrX.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { m as motion } from "./proxy-B_4tW7TK.js";
import { F as FileQuestionMark } from "./file-question-mark-HvuCEkoL.js";
import { C as Clock } from "./clock-CBMrk16J.js";
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
  [
    "path",
    {
      d: "M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z",
      key: "kmsa83"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]
];
const CirclePlay = createLucideIcon("circle-play", __iconNode);
function QuizSelection() {
  const [, setLocation] = useLocation();
  const [quizzes, setQuizzes] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [selectedQuiz, setSelectedQuiz] = reactExports.useState(null);
  const [extraTime, setExtraTime] = reactExports.useState("0");
  const [pausedQuiz, setPausedQuiz] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const saved = localStorage.getItem("paused_quiz");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.isQuiz) {
          setPausedQuiz(data);
        }
      } catch (e) {
        console.error("Error parsing paused quiz:", e);
      }
    }
    const fetchQuizzes = async () => {
      try {
        const response = await fetch("/api/custom-quizzes/active");
        if (response.ok) {
          const data = await response.json();
          setQuizzes(data);
        }
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);
  const handleResumeQuiz = () => {
    if (!pausedQuiz) return;
    setLocation(`/timed-exam/quiz/${pausedQuiz.quizId}?resume=true`);
  };
  const calculateAdjustedTime = (baseMinutes) => {
    const multiplier = 1 + parseInt(extraTime) / 100;
    return Math.round(baseMinutes * multiplier);
  };
  const handleStartQuiz = () => {
    if (!selectedQuiz) return;
    const adjustedTime = calculateAdjustedTime(selectedQuiz.timeLimitMinutes);
    localStorage.setItem("quiz_session", JSON.stringify({
      quizId: selectedQuiz.id,
      quizName: selectedQuiz.name,
      timeLimit: adjustedTime * 60,
      startedAt: Date.now(),
      extraTimePercent: parseInt(extraTime)
    }));
    setLocation(`/timed-exam/quiz/${selectedQuiz.id}`);
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-neutral-500", children: "Loading quizzes..." })
    ] }) });
  }
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
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center p-4 bg-purple-100 text-purple-700 rounded-full dark:bg-purple-900/30 dark:text-purple-300 mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileQuestionMark, { className: "w-8 h-8" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-bold text-neutral-900 dark:text-white", children: "Practice Quizzes" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto", children: "Select a quiz created by your teacher. Each quiz has a time limit and will be graded automatically." })
          ] }),
          pausedQuiz && /* @__PURE__ */ jsxRuntimeExports.jsx(
            motion.div,
            {
              initial: { opacity: 0, y: -10 },
              animate: { opacity: 1, y: 0 },
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5 w-5 text-amber-600" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg text-amber-700 dark:text-amber-400", children: "Resume Paused Quiz" })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-neutral-800 dark:text-neutral-200", children: pausedQuiz.quizName }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-neutral-500", children: [
                      "Time remaining: ",
                      Math.floor(pausedQuiz.timeLeft / 60),
                      ":",
                      (pausedQuiz.timeLeft % 60).toString().padStart(2, "0"),
                      pausedQuiz.extraTimeAdded && ` (${pausedQuiz.extraTimeAdded} extra time)`
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      onClick: handleResumeQuiz,
                      className: "bg-amber-600 hover:bg-amber-700",
                      "data-testid": "button-resume-quiz",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlay, { className: "mr-2 h-4 w-4" }),
                        " Resume"
                      ]
                    }
                  )
                ] }) })
              ] })
            }
          ),
          quizzes.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-12 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileQuestionMark, { className: "mx-auto h-12 w-12 text-neutral-300 mb-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2", children: "No Quizzes Available" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-500", children: "Your teacher hasn't created any practice quizzes yet. Check back later!" })
          ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: quizzes.map((quiz, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              motion.div,
              {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: index * 0.1 },
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Card,
                  {
                    className: `cursor-pointer transition-all hover:shadow-lg ${selectedQuiz?.id === quiz.id ? "border-2 border-purple-500 bg-purple-50/50 dark:bg-purple-950/20" : "border-neutral-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-700"}`,
                    onClick: () => setSelectedQuiz(quiz),
                    "data-testid": `card-quiz-${quiz.id}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-xl", children: quiz.name }),
                          quiz.description && /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "mt-1", children: quiz.description })
                        ] }),
                        selectedQuiz?.id === quiz.id && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium", children: "Selected" })
                      ] }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6 text-sm text-neutral-500", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                            quiz.timeLimitMinutes,
                            " minutes"
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(FileQuestionMark, { className: "h-4 w-4" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                            quiz.questionIds.length,
                            " questions"
                          ] })
                        ] })
                      ] }) })
                    ]
                  }
                )
              },
              quiz.id
            )) }),
            selectedQuiz && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              motion.div,
              {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                className: "space-y-6",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-neutral-200 dark:border-neutral-800 overflow-hidden", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: "Additional Time (Optional)" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-4 text-neutral-600 dark:text-neutral-400", children: "If you are entitled to additional time, select your allowance below:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        RadioGroup,
                        {
                          value: extraTime,
                          onValueChange: (v) => setExtraTime(v),
                          className: "grid grid-cols-2 md:grid-cols-4 gap-4",
                          children: [
                            { value: "0", label: "Standard Time" },
                            { value: "25", label: "+25% Time" },
                            { value: "33", label: "+33% Time" },
                            { value: "50", label: "+50% Time" }
                          ].map((option) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(RadioGroupItem, { value: option.value, id: `time-${option.value}`, className: "peer sr-only" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Label,
                              {
                                htmlFor: `time-${option.value}`,
                                className: "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 cursor-pointer text-center",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: option.label }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-500 mt-1", children: [
                                    calculateAdjustedTime(selectedQuiz.timeLimitMinutes),
                                    " mins"
                                  ] })
                                ]
                              }
                            )
                          ] }, option.value))
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-purple-600 to-purple-800 text-white border-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold mb-1", children: selectedQuiz.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-purple-200", children: [
                        selectedQuiz.questionIds.length,
                        " questions • ",
                        calculateAdjustedTime(selectedQuiz.timeLimitMinutes),
                        " minutes"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        onClick: handleStartQuiz,
                        size: "lg",
                        className: "bg-white text-purple-700 hover:bg-purple-100",
                        "data-testid": "button-start-quiz",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlay, { className: "mr-2 h-5 w-5" }),
                          "Start Quiz"
                        ]
                      }
                    )
                  ] }) }) })
                ]
              }
            )
          ] })
        ]
      }
    )
  ] }) });
}
export {
  QuizSelection as default
};
//# sourceMappingURL=QuizSelection-DVOoPVIx.js.map
