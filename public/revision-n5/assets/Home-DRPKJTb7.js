import { c as createLucideIcon, u as useLocation, a as useToast, b as useStudentAuth, r as reactExports, j as jsxRuntimeExports, L as Link, T as TOPICS } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { M as ModeToggle } from "./mode-toggle-Bf7eeVrX.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-DTiCktmM.js";
import { L as Label } from "./label-DXOWQ5Is.js";
import { I as Input } from "./input-BglVfhce.js";
import { C as Checkbox } from "./checkbox-Afzjt1Kk.js";
import { C as ChartColumn } from "./chart-column-Cr8aE8Tc.js";
import { L as LogOut } from "./log-out-Dulq3xVb.js";
import { B as BookOpen } from "./book-open-CHMNkO2H.js";
import { m as motion } from "./proxy-B_4tW7TK.js";
import { G as Globe } from "./globe-DSmc1esR.js";
import { D as Database } from "./database-C7hi9e55.js";
import { C as Code } from "./code-CkVOXEbl.js";
import { A as ArrowRight } from "./arrow-right-BGWMDShP.js";
import { C as Clock } from "./clock-CBMrk16J.js";
import { F as FileText } from "./file-text-7qIELcrq.js";
import "./dropdown-menu-DZfpUsGF.js";
import "./index-D-MpoJPS.js";
import "./Combination-DqZOzdwe.js";
import "./index-Ck6_BvxI.js";
import "./index-C94DArSW.js";
import "./chevron-right-CVWIcf-n.js";
import "./check-tIL4sncn.js";
import "./circle-D4qz0ZWK.js";
import "./index-CxDJjHs5.js";
import "./index-CXp8eGpS.js";
const __iconNode$1 = [
  ["path", { d: "m18 14 4 4-4 4", key: "10pe0f" }],
  ["path", { d: "m18 2 4 4-4 4", key: "pucp1d" }],
  ["path", { d: "M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22", key: "1ailkh" }],
  ["path", { d: "M2 6h1.972a4 4 0 0 1 3.6 2.2", key: "km57vx" }],
  ["path", { d: "M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45", key: "os18l9" }]
];
const Shuffle = createLucideIcon("shuffle", __iconNode$1);
const __iconNode = [
  ["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", key: "975kel" }],
  ["circle", { cx: "12", cy: "7", r: "4", key: "17ys0d" }]
];
const User = createLucideIcon("user", __iconNode);
const icons = {
  sdcs: Code,
  dd: Database,
  wd: Globe
};
function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const studentAuth = useStudentAuth();
  const [isLoggedIn, setIsLoggedIn] = reactExports.useState(false);
  const [randomQuizOpen, setRandomQuizOpen] = reactExports.useState(false);
  const [questions, setQuestions] = reactExports.useState([]);
  const [selectedTopics, setSelectedTopics] = reactExports.useState(["sdcs", "dd", "wd"]);
  const [questionCount, setQuestionCount] = reactExports.useState(5);
  const [hasPublishedAssignments, setHasPublishedAssignments] = reactExports.useState(true);
  reactExports.useEffect(() => {
    const token = localStorage.getItem("teacherToken");
    setIsLoggedIn(!!token);
  }, []);
  reactExports.useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const headers = {};
        const studentToken = localStorage.getItem("studentToken");
        if (studentToken) headers["Authorization"] = `Bearer ${studentToken}`;
        const response = await fetch("/api/questions", { headers });
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.filter((q) => !q.isQuizOnly));
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };
    fetchQuestions();
  }, []);
  reactExports.useEffect(() => {
    const checkPublishedAssignments = async () => {
      try {
        const response = await fetch("/api/assignments");
        if (response.ok) {
          const data = await response.json();
          const published = data.filter((a) => a.isPublished);
          setHasPublishedAssignments(published.length > 0);
        }
      } catch (error) {
        console.error("Error checking assignments:", error);
      }
    };
    checkPublishedAssignments();
  }, []);
  const handleLogout = () => {
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacherTokenExpires");
    setIsLoggedIn(false);
  };
  const toggleTopic = (topicId) => {
    setSelectedTopics(
      (prev) => prev.includes(topicId) ? prev.filter((t) => t !== topicId) : [...prev, topicId]
    );
  };
  const getAvailableQuestionCount = () => {
    return questions.filter((q) => selectedTopics.includes(q.topic)).length;
  };
  const calculateTotalMarks = (questionList) => {
    let total = 0;
    for (const question of questionList) {
      for (const sq of question.subQuestions) {
        if (sq.subParts && sq.subParts.length > 0) {
          for (const part of sq.subParts) {
            total += part.maxMarks || 0;
          }
        } else {
          total += sq.maxMarks || 0;
        }
      }
    }
    return total;
  };
  const getEstimatedTime = () => {
    const availableQuestions = questions.filter((q) => selectedTopics.includes(q.topic));
    const count = Math.min(questionCount, availableQuestions.length);
    const sampleQuestions = availableQuestions.slice(0, count);
    const totalMarks = calculateTotalMarks(sampleQuestions);
    return Math.ceil(totalMarks * 1.125);
  };
  const startRandomQuiz = () => {
    const availableQuestions = questions.filter((q) => selectedTopics.includes(q.topic));
    if (availableQuestions.length === 0) {
      toast({
        title: "No questions available",
        description: "Please select at least one topic with questions.",
        variant: "destructive"
      });
      return;
    }
    const count = Math.min(questionCount, availableQuestions.length);
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, count);
    const totalMarks = calculateTotalMarks(selectedQuestions);
    const calculatedTime = Math.ceil(totalMarks * 1.125);
    const quizId = `random-${Date.now()}`;
    const quiz = {
      id: quizId,
      name: `Random Quiz (${count} questions)`,
      questionIds: selectedQuestions.map((q) => q.id),
      questions: selectedQuestions,
      timeLimit: calculatedTime,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    localStorage.setItem("student_current_quiz", JSON.stringify(quiz));
    setRandomQuizOpen(false);
    setLocation(`/timed-exam/student-quiz/${quizId}`);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center font-sans selection:bg-blue-100 selection:text-blue-900", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full bg-black dark:bg-neutral-800 pt-6 pb-8 mb-12 relative overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: "/revision-n5/Biggar_HS_Logo_1766054584535.png",
          alt: "",
          className: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 md:w-48 md:h-48 object-contain opacity-15 pointer-events-none"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 px-6 mb-10 flex flex-wrap items-center justify-center sm:justify-between gap-y-3 gap-x-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-center gap-2", children: [
          studentAuth.isLoggedIn ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", "data-testid": "student-indicator", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 bg-blue-600/20 border border-blue-400/30 rounded-full px-3 py-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-4 h-4 text-blue-300" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-blue-200 font-medium", "data-testid": "text-student-username", children: studentAuth.username })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: "/my-progress", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                className: "bg-green-600/20 text-green-200 border-green-400/30 hover:bg-green-600/40",
                "data-testid": "link-my-progress",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "w-4 h-4 mr-1" }),
                  "My Progress"
                ]
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                className: "bg-white/10 text-white border-white/20 hover:bg-white/20",
                onClick: () => studentAuth.logout(),
                "data-testid": "button-student-logout",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "w-4 h-4 mr-1" }),
                  "Logout"
                ]
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: "/student/login", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "bg-blue-600/20 text-blue-200 border-blue-400/30 hover:bg-blue-600/40", "data-testid": "link-student-login", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-4 h-4 mr-2" }),
            "Student Login"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: "/my-quizzes", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "bg-purple-600/20 text-purple-200 border-purple-400/30 hover:bg-purple-600/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "w-4 h-4 mr-2" }),
            "My Quizzes"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => setRandomQuizOpen(true),
              variant: "outline",
              className: "bg-orange-500/20 text-orange-200 border-orange-400/30 hover:bg-orange-500/40",
              "data-testid": "button-random-quiz",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Shuffle, { className: "w-4 h-4 mr-2" }),
                "Random Quiz"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/HTML/N5/N5Home.html", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "bg-white/10 text-white border-white/20 hover:bg-white/20", children: "Return to Main Website" }) }),
          isLoggedIn ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: "/teacher/dashboard", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "bg-green-600/20 text-green-200 border-green-400/30 hover:bg-green-600/40 hover:text-white", children: "Teacher Dashboard" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                className: "bg-blue-800/20 text-blue-200 border-blue-400/30 hover:bg-blue-800/40 hover:text-white",
                onClick: handleLogout,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "w-4 h-4 mr-2" }),
                  "Logout"
                ]
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: "/teacher/login", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "bg-white/10 text-white border-white/20 hover:bg-white/20", children: "Teacher Access" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ModeToggle, {})
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: -20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5 },
          className: "w-full flex flex-col items-center space-y-4 relative z-10",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-block bg-red-600 text-white text-sm font-bold px-4 py-1 rounded-full mb-4 uppercase tracking-wider", children: "N5 Level" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl md:text-6xl font-bold tracking-tight text-white", children: "CS Revision Tool" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-400 text-sm", children: "Biggar High School" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-neutral-50 dark:bg-neutral-900/30 py-16", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto px-6 md:px-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.5 },
          className: "mb-12 text-center",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-2", children: "Choose Your Topic" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-600 dark:text-neutral-400 text-lg", children: "Select a subject to start revising for your N5 Computing Science exam" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8 w-full", children: TOPICS.map((topic, index) => {
        const Icon = icons[topic.id];
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: `/revise/${topic.id}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: index * 0.1 + 0.3 },
            className: "group relative h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-10 hover:shadow-2xl hover:border-blue-700/50 dark:hover:border-blue-700/50 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/40 dark:to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-neutral-100 to-transparent dark:from-neutral-800/40 dark:to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 flex flex-col h-full", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-8 p-4 bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 w-fit rounded-2xl group-hover:from-blue-500 group-hover:to-red-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-10 h-10" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-bold text-neutral-900 dark:text-white mb-3 leading-tight", children: topic.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-600 dark:text-neutral-400 mb-8 flex-grow leading-relaxed text-base", children: topic.description }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center text-blue-800 dark:text-blue-400 font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300", children: [
                  "Start Revision",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" })
                ] })
              ] })
            ]
          }
        ) }, topic.id);
      }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-7xl mx-auto px-6 md:px-12 pb-16 flex flex-col items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.4 },
          className: "w-full mt-4",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: "/timed-mode", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-r from-blue-800 to-neutral-900 rounded-2xl p-8 text-white shadow-xl cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 flex items-center justify-between relative overflow-hidden group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3 mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-6 h-6" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-bold mb-2", children: "Timed Exam Mode" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-blue-100 max-w-xl", children: "Simulate real exam conditions. Choose a paper, answer questions against the clock (1 hour 30 minutes), and get graded automatically at the end." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-8 h-8 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" })
          ] }) })
        }
      ),
      hasPublishedAssignments && /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.5 },
          className: "w-full mt-4",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: "/assignments", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-r from-purple-600 to-neutral-900 rounded-2xl p-8 text-white shadow-xl cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 flex items-center justify-between relative overflow-hidden group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3 mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-6 h-6" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-bold mb-2", children: "Coursework Assignment" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-purple-100 max-w-xl", children: "Complete your N5 coursework assignment. 40 marks, 6 hours. Software Design (compulsory) plus Database OR Web Design." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-8 h-8 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" })
          ] }) })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "w-full py-4 px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-right text-neutral-400 text-xs", children: "© C Dunn" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: randomQuizOpen, onOpenChange: setRandomQuizOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Shuffle, { className: "w-5 h-5 text-orange-500" }),
          "Random Quiz"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Generate a quiz with randomly selected questions from your chosen topics." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium", children: "Select Topics" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: TOPICS.map((topic) => {
            const topicQuestionCount = questions.filter((q) => q.topic === topic.id).length;
            const Icon = icons[topic.id];
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Checkbox,
                    {
                      id: `topic-${topic.id}`,
                      checked: selectedTopics.includes(topic.id),
                      onCheckedChange: () => toggleTopic(topic.id),
                      "data-testid": `checkbox-topic-${topic.id}`
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-4 h-4 text-neutral-500" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Label,
                    {
                      htmlFor: `topic-${topic.id}`,
                      className: "flex-1 cursor-pointer text-sm",
                      children: topic.name
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-500", children: [
                    topicQuestionCount,
                    " questions"
                  ] })
                ]
              },
              topic.id
            );
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-neutral-500", children: [
            getAvailableQuestionCount(),
            " questions available from selected topics"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "question-count", className: "text-sm font-medium", children: "Number of Questions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "question-count",
                type: "number",
                min: 1,
                max: Math.max(1, getAvailableQuestionCount()),
                value: questionCount,
                onChange: (e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1)),
                className: "w-24",
                "data-testid": "input-question-count"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-neutral-500", children: [
              "(max: ",
              getAvailableQuestionCount(),
              ")"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Estimated Time" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Based on 1.125 minutes per mark" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-bold text-orange-600", children: [
              getEstimatedTime(),
              " min"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-neutral-500", children: [
              "(~",
              Math.round(getEstimatedTime() / 1.125),
              " marks)"
            ] })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setRandomQuizOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: startRandomQuiz,
            disabled: selectedTopics.length === 0 || getAvailableQuestionCount() === 0,
            className: "bg-orange-600 hover:bg-orange-700",
            "data-testid": "button-start-random-quiz",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Shuffle, { className: "w-4 h-4 mr-2" }),
              "Start Quiz"
            ]
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  Home as default
};
//# sourceMappingURL=Home-DRPKJTb7.js.map
