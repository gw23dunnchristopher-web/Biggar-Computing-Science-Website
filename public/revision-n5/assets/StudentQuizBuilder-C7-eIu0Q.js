import { u as useLocation, a as useToast, r as reactExports, T as TOPICS, j as jsxRuntimeExports, x as RotateCcw } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle, c as CardDescription } from "./card-D7eXR4Y_.js";
import { I as Input } from "./input-BglVfhce.js";
import { L as Label } from "./label-DXOWQ5Is.js";
import { C as Checkbox } from "./checkbox-Afzjt1Kk.js";
import { a as Select, b as SelectTrigger, c as SelectValue, d as SelectContent, e as SelectItem, S as Save } from "./select-BoXHqBzp.js";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-Dav9MFAg.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-DTiCktmM.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-CwuHQhjb.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { P as Plus } from "./plus-Bl_GJopp.js";
import { F as FileQuestionMark } from "./file-question-mark-HvuCEkoL.js";
import { C as Clock } from "./clock-CBMrk16J.js";
import { P as Play } from "./play-D5zzeji7.js";
import { T as Trash2 } from "./trash-2-bLg5w6uM.js";
import { S as Search } from "./search-CxbrkDLo.js";
import { C as ChevronDown } from "./chevron-down-C5HdvL5Z.js";
import "./index-CXp8eGpS.js";
import "./check-tIL4sncn.js";
import "./index-D-MpoJPS.js";
import "./Combination-DqZOzdwe.js";
import "./index-C94DArSW.js";
import "./chevron-up-BGYeYs9P.js";
import "./index-CxDJjHs5.js";
const STORAGE_KEY = "student_custom_quizzes";
function getQuestionPreviewText(question) {
  const scenarioText = question.scenario?.contentBlocks?.find((b) => b.type === "text")?.content || question.scenario?.text;
  if (scenarioText) return scenarioText;
  const firstSubQ = question.subQuestions[0];
  if (firstSubQ) {
    const subQText = firstSubQ.contentBlocks?.find((b) => b.type === "text")?.content || firstSubQ.questionText;
    if (subQText) return subQText;
  }
  return "No preview available";
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
function StudentQuizBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [questions, setQuestions] = reactExports.useState([]);
  const [questionsLoading, setQuestionsLoading] = reactExports.useState(true);
  const [savedQuizzes, setSavedQuizzes] = reactExports.useState([]);
  const [isDialogOpen, setIsDialogOpen] = reactExports.useState(false);
  const [editingQuiz, setEditingQuiz] = reactExports.useState(null);
  const [quizName, setQuizName] = reactExports.useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = reactExports.useState([]);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [topicFilter, setTopicFilter] = reactExports.useState("all");
  const [expandedTopics, setExpandedTopics] = reactExports.useState([]);
  const [timeLimit, setTimeLimit] = reactExports.useState(30);
  const [pausedQuizId, setPausedQuizId] = reactExports.useState(null);
  const [pausedQuizTimeLeft, setPausedQuizTimeLeft] = reactExports.useState(null);
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
      } finally {
        setQuestionsLoading(false);
      }
    };
    fetchQuestions();
  }, []);
  reactExports.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedQuizzes(JSON.parse(stored));
      } catch {
        setSavedQuizzes([]);
      }
    }
  }, []);
  reactExports.useEffect(() => {
    const paused = localStorage.getItem("paused_student_quiz");
    if (paused) {
      try {
        const pausedData = JSON.parse(paused);
        setPausedQuizId(pausedData.quizId);
        setPausedQuizTimeLeft(pausedData.timeLeft);
      } catch {
        setPausedQuizId(null);
        setPausedQuizTimeLeft(null);
      }
    }
  }, []);
  const handleResumeQuiz = (quizId) => {
    const quiz = savedQuizzes.find((q) => q.id === quizId);
    if (quiz) {
      const existingQuiz = localStorage.getItem("student_current_quiz");
      if (!existingQuiz || JSON.parse(existingQuiz).id !== quizId) {
        localStorage.setItem("student_current_quiz", JSON.stringify({
          ...quiz,
          questions: questions.filter((q) => quiz.questionIds.includes(q.id)),
          timeLimit: quiz.timeLimit || 30
        }));
      }
      setLocation(`/timed-exam/student-quiz/${quizId}?resume=true`);
    }
  };
  const formatTimeLeft = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const saveQuizzesToStorage = (quizzes) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
    setSavedQuizzes(quizzes);
  };
  const resetForm = () => {
    setQuizName("");
    setSelectedQuestionIds([]);
    setEditingQuiz(null);
    setSearchTerm("");
    setTopicFilter("all");
    setTimeLimit(30);
  };
  const openNewQuizDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };
  const openEditQuizDialog = (quiz) => {
    setEditingQuiz(quiz);
    setQuizName(quiz.name);
    setSelectedQuestionIds(quiz.questionIds);
    setTimeLimit(quiz.timeLimit || 30);
    setIsDialogOpen(true);
  };
  const handleSaveQuiz = () => {
    if (!quizName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Quiz name is required" });
      return;
    }
    if (selectedQuestionIds.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Select at least one question" });
      return;
    }
    if (editingQuiz) {
      const updated = savedQuizzes.map(
        (q) => q.id === editingQuiz.id ? { ...q, name: quizName.trim(), questionIds: selectedQuestionIds, timeLimit } : q
      );
      saveQuizzesToStorage(updated);
      toast({ title: "Success", description: "Quiz updated!" });
    } else {
      const newQuiz = {
        id: `student-quiz-${Date.now()}`,
        name: quizName.trim(),
        questionIds: selectedQuestionIds,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        timeLimit
      };
      saveQuizzesToStorage([...savedQuizzes, newQuiz]);
      toast({ title: "Success", description: "Quiz created!" });
    }
    setIsDialogOpen(false);
    resetForm();
  };
  const handleDeleteQuiz = (quizId) => {
    const updated = savedQuizzes.filter((q) => q.id !== quizId);
    saveQuizzesToStorage(updated);
    toast({ title: "Deleted", description: "Quiz removed" });
  };
  const handleStartQuiz = (quiz) => {
    localStorage.setItem("student_current_quiz", JSON.stringify({
      ...quiz,
      questions: questions.filter((q) => quiz.questionIds.includes(q.id)),
      timeLimit: quiz.timeLimit || 30
    }));
    setLocation(`/timed-exam/student-quiz/${quiz.id}`);
  };
  const toggleSelectAllInTopic = (topicId) => {
    const topicQuestionIds = questionsByTopic[topicId]?.map((q) => q.id) || [];
    const allSelected = topicQuestionIds.every((id) => selectedQuestionIds.includes(id));
    if (allSelected) {
      setSelectedQuestionIds((prev) => prev.filter((id) => !topicQuestionIds.includes(id)));
    } else {
      setSelectedQuestionIds((prev) => Array.from(/* @__PURE__ */ new Set([...prev, ...topicQuestionIds])));
    }
  };
  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestionIds(
      (prev) => prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };
  const toggleTopic = (topicId) => {
    setExpandedTopics(
      (prev) => prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = searchTerm === "" || q.title.toLowerCase().includes(searchTerm.toLowerCase()) || getQuestionPreviewText(q).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = topicFilter === "all" || q.topic === topicFilter;
    return matchesSearch && matchesTopic;
  });
  const questionsByTopic = TOPICS.reduce((acc, topic) => {
    acc[topic.id] = filteredQuestions.filter((q) => q.topic === topic.id);
    return acc;
  }, {});
  const calculateQuizTotalMarks = (questionIds) => {
    return questionIds.reduce((total, id) => {
      const q = questions.find((q2) => q2.id === id);
      return total + (q ? calculateTotalMarks(q) : 0);
    }, 0);
  };
  const getQuizQuestionCount = (quiz) => {
    return quiz.questionIds.filter((id) => questions.some((q) => q.id === id)).length;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", onClick: () => setLocation("/"), "data-testid": "button-back", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            "Home"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold text-neutral-900 dark:text-white", children: "My Practice Quizzes" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-500", children: "Create your own quizzes from past paper questions" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNewQuizDialog, className: "bg-blue-600 hover:bg-blue-700", "data-testid": "button-create-quiz", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
          "Create Quiz"
        ] })
      ] }),
      savedQuizzes.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "text-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileQuestionMark, { className: "w-16 h-16 mx-auto mb-4 text-neutral-300" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold mb-2", children: "No Quizzes Yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-500 mb-4", children: "Create your first practice quiz by selecting questions from past papers." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNewQuizDialog, className: "bg-blue-600 hover:bg-blue-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
          "Create Your First Quiz"
        ] })
      ] }) }) : questionsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: savedQuizzes.map((quiz) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "hover:shadow-lg transition-shadow animate-pulse", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: quiz.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 bg-neutral-200 dark:bg-neutral-700 rounded" }) })
      ] }, quiz.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: savedQuizzes.map((quiz) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: quiz.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
            getQuizQuestionCount(quiz),
            " questions • ",
            calculateQuizTotalMarks(quiz.questionIds),
            " marks • ",
            quiz.timeLimit || 30,
            " mins"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          pausedQuizId === quiz.id && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-3 p-2 bg-amber-50 dark:bg-amber-900/30 rounded-md border border-amber-200 dark:border-amber-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }),
            "Paused - ",
            pausedQuizTimeLeft ? formatTimeLeft(pausedQuizTimeLeft) : "",
            " remaining"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            pausedQuizId === quiz.id ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                className: "flex-1 bg-amber-600 hover:bg-amber-700",
                onClick: () => handleResumeQuiz(quiz.id),
                disabled: questionsLoading || getQuizQuestionCount(quiz) === 0,
                "data-testid": `button-resume-quiz-${quiz.id}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "mr-2 h-4 w-4" }),
                  "Resume"
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                className: "flex-1 bg-green-600 hover:bg-green-700",
                onClick: () => handleStartQuiz(quiz),
                disabled: questionsLoading || getQuizQuestionCount(quiz) === 0,
                "data-testid": `button-start-quiz-${quiz.id}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "mr-2 h-4 w-4" }),
                  "Start"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => openEditQuizDialog(quiz), disabled: questionsLoading, children: "Edit" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-red-500" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Delete Quiz?" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
                    'This will permanently delete "',
                    quiz.name,
                    '". This action cannot be undone.'
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => handleDeleteQuiz(quiz.id), className: "bg-red-600 hover:bg-red-700", children: "Delete" })
                ] })
              ] })
            ] })
          ] })
        ] })
      ] }, quiz.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isDialogOpen, onOpenChange: (open) => {
      if (!open) resetForm();
      setIsDialogOpen(open);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editingQuiz ? "Edit Quiz" : "Create Practice Quiz" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Select questions from past papers to build your custom practice quiz." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto py-4 space-y-4", style: { minHeight: 0 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "quiz-name", children: "Quiz Name *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "quiz-name",
                placeholder: "e.g., My Variables Practice",
                value: quizName,
                onChange: (e) => setQuizName(e.target.value),
                "data-testid": "input-quiz-name"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "time-limit", children: "Time Limit (minutes)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "time-limit",
                type: "number",
                min: 5,
                max: 180,
                value: timeLimit,
                onChange: (e) => setTimeLimit(Math.max(5, Math.min(180, parseInt(e.target.value) || 30))),
                "data-testid": "input-time-limit"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Select Questions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  placeholder: "Search questions...",
                  value: searchTerm,
                  onChange: (e) => setSearchTerm(e.target.value),
                  className: "pl-10",
                  "data-testid": "input-search-questions"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: topicFilter, onValueChange: setTopicFilter, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-48", "data-testid": "select-topic-filter", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Filter by topic" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Topics" }),
                TOPICS.map((topic) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: topic.id, children: topic.name }, topic.id))
              ] })
            ] })
          ] }),
          questionsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-neutral-500", children: "Loading questions..." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-lg max-h-[40vh] overflow-y-auto", children: TOPICS.filter((t) => questionsByTopic[t.id]?.length > 0).map((topic) => {
            const topicQuestionIds = questionsByTopic[topic.id]?.map((q) => q.id) || [];
            const allTopicSelected = topicQuestionIds.length > 0 && topicQuestionIds.every((id) => selectedQuestionIds.includes(id));
            const someTopicSelected = topicQuestionIds.some((id) => selectedQuestionIds.includes(id));
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Collapsible,
              {
                open: expandedTopics.includes(topic.id),
                onOpenChange: () => toggleTopic(topic.id),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between w-full p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(CollapsibleTrigger, { className: "flex items-center gap-2 flex-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: `h-4 w-4 transition-transform ${expandedTopics.includes(topic.id) ? "rotate-180" : ""}` }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: topic.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-neutral-500", children: [
                        "(",
                        questionsByTopic[topic.id].length,
                        ")"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-blue-600", children: [
                        questionsByTopic[topic.id].filter((q) => selectedQuestionIds.includes(q.id)).length,
                        " selected"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "div",
                        {
                          className: "flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400",
                          onClick: (e) => e.stopPropagation(),
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Checkbox,
                              {
                                checked: allTopicSelected,
                                ref: void 0,
                                onCheckedChange: () => toggleSelectAllInTopic(topic.id),
                                "data-testid": `checkbox-select-all-${topic.id}`,
                                className: someTopicSelected && !allTopicSelected ? "data-[state=unchecked]:bg-blue-200" : ""
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "All" })
                          ]
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { children: questionsByTopic[topic.id].map((question) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "flex items-start gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 border-b last:border-b-0 cursor-pointer",
                      onClick: () => toggleQuestionSelection(question.id),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Checkbox,
                          {
                            checked: selectedQuestionIds.includes(question.id),
                            onCheckedChange: () => toggleQuestionSelection(question.id),
                            onClick: (e) => e.stopPropagation(),
                            "data-testid": `checkbox-question-${question.id}`
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm truncate", children: question.title }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 truncate", children: getQuestionPreviewText(question) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-blue-600 mt-1", children: [
                            calculateTotalMarks(question),
                            " marks"
                          ] })
                        ] })
                      ]
                    },
                    question.id
                  )) })
                ]
              },
              topic.id
            );
          }) }),
          selectedQuestionIds.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-neutral-600 dark:text-neutral-400 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Selected:" }),
            " ",
            selectedQuestionIds.length,
            " questions • ",
            calculateQuizTotalMarks(selectedQuestionIds),
            " total marks"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => {
          resetForm();
          setIsDialogOpen(false);
        }, children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSaveQuiz, className: "bg-blue-600 hover:bg-blue-700", "data-testid": "button-save-quiz", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
          editingQuiz ? "Update Quiz" : "Create Quiz"
        ] })
      ] })
    ] }) })
  ] });
}
export {
  StudentQuizBuilder as default
};
//# sourceMappingURL=StudentQuizBuilder-C7-eIu0Q.js.map
