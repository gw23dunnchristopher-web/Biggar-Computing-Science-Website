import { c as createLucideIcon, u as useLocation, a as useToast, r as reactExports, f as compareQuestionsByNumber, j as jsxRuntimeExports, X, T as TOPICS, h as Type } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle, c as CardDescription } from "./card-D7eXR4Y_.js";
import { I as Input } from "./input-BglVfhce.js";
import { L as Label } from "./label-DXOWQ5Is.js";
import { T as Textarea } from "./textarea-DVZKhD5j.js";
import { C as Checkbox } from "./checkbox-Afzjt1Kk.js";
import { S as Switch, G as GripVertical } from "./switch-BlpTyINT.js";
import { S as Save, a as Select, b as SelectTrigger, c as SelectValue, d as SelectContent, e as SelectItem } from "./select-BoXHqBzp.js";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-Dav9MFAg.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-DTiCktmM.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-CwuHQhjb.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { P as Plus } from "./plus-Bl_GJopp.js";
import { F as FileQuestionMark } from "./file-question-mark-HvuCEkoL.js";
import { S as SquarePen } from "./square-pen-Xz0XRNBD.js";
import { T as Trash2 } from "./trash-2-bLg5w6uM.js";
import { C as Clock } from "./clock-CBMrk16J.js";
import { C as CirclePlus } from "./circle-plus-RFmo1F9l.js";
import { S as Search } from "./search-CxbrkDLo.js";
import { C as ChevronDown } from "./chevron-down-C5HdvL5Z.js";
import { C as Code } from "./code-CkVOXEbl.js";
import "./index-CXp8eGpS.js";
import "./check-tIL4sncn.js";
import "./index-D-MpoJPS.js";
import "./Combination-DqZOzdwe.js";
import "./index-C94DArSW.js";
import "./chevron-up-BGYeYs9P.js";
import "./index-CxDJjHs5.js";
const __iconNode = [
  ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
  ["path", { d: "M10 14 21 3", key: "gplh6r" }],
  ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", key: "a6xqqp" }]
];
const ExternalLink = createLucideIcon("external-link", __iconNode);
const INPUT_TYPES = [
  { id: "text", name: "Text Answer", description: "Free-form text response" },
  { id: "code-editor", name: "Code Editor", description: "Code input with syntax highlighting" },
  { id: "labeled-inputs", name: "Labeled Inputs", description: "Multiple labeled text fields" },
  { id: "fill-in-blanks", name: "Fill in Blanks", description: "Code with blanks to complete" },
  { id: "table", name: "Table", description: "Grid-based answer input" }
];
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
function QuizManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [questions, setQuestions] = reactExports.useState([]);
  const [questionsLoading, setQuestionsLoading] = reactExports.useState(true);
  const [quizzes, setQuizzes] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [isDialogOpen, setIsDialogOpen] = reactExports.useState(false);
  const [editingQuiz, setEditingQuiz] = reactExports.useState(null);
  const [quizName, setQuizName] = reactExports.useState("");
  const [quizDescription, setQuizDescription] = reactExports.useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = reactExports.useState(60);
  const [selectedQuestionIds, setSelectedQuestionIds] = reactExports.useState([]);
  const [isActive, setIsActive] = reactExports.useState(true);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = reactExports.useState(false);
  const [newQuestionTitle, setNewQuestionTitle] = reactExports.useState("");
  const [newQuestionTopic, setNewQuestionTopic] = reactExports.useState("");
  const [newQuestionText, setNewQuestionText] = reactExports.useState("");
  const [newQuestionMaxMarks, setNewQuestionMaxMarks] = reactExports.useState(2);
  const [newQuestionAnswer, setNewQuestionAnswer] = reactExports.useState("");
  const [creatingQuestion, setCreatingQuestion] = reactExports.useState(false);
  const [newQuestionInputType, setNewQuestionInputType] = reactExports.useState("text");
  const [newQuestionStarterCode, setNewQuestionStarterCode] = reactExports.useState("");
  const [newQuestionLabeledFields, setNewQuestionLabeledFields] = reactExports.useState([
    { key: "field1", label: "Field 1" }
  ]);
  const [newQuestionFillBlanksCode, setNewQuestionFillBlanksCode] = reactExports.useState("");
  const [newQuestionTableRows, setNewQuestionTableRows] = reactExports.useState(3);
  const [newQuestionTableCols, setNewQuestionTableCols] = reactExports.useState(2);
  const [newQuestionTableHeaders, setNewQuestionTableHeaders] = reactExports.useState(["Column 1", "Column 2"]);
  const [newQuestionContentBlocks, setNewQuestionContentBlocks] = reactExports.useState([
    { id: `cb-${Date.now()}`, type: "text", content: "" }
  ]);
  reactExports.useEffect(() => {
    const fetchAllQuestions = async () => {
      try {
        const response = await fetch("/api/questions/all");
        if (response.ok) {
          const data = await response.json();
          setQuestions(data);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setQuestionsLoading(false);
      }
    };
    fetchAllQuestions();
  }, []);
  const getToken = () => localStorage.getItem("teacherToken");
  reactExports.useEffect(() => {
    const verifyAuth = async () => {
      const token = getToken();
      const expires = localStorage.getItem("teacherTokenExpires");
      if (!token || !expires || parseInt(expires) < Date.now()) {
        localStorage.removeItem("teacherToken");
        localStorage.removeItem("teacherTokenExpires");
        setLocation("/teacher/login");
        return;
      }
      try {
        const response = await fetch("/api/teacher/verify", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          localStorage.removeItem("teacherToken");
          localStorage.removeItem("teacherTokenExpires");
          setLocation("/teacher/login");
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
      }
    };
    verifyAuth();
    fetchQuizzes();
  }, [setLocation]);
  const fetchQuizzes = async () => {
    try {
      const response = await fetch("/api/custom-quizzes");
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
  const resetForm = () => {
    setQuizName("");
    setQuizDescription("");
    setTimeLimitMinutes(60);
    setSelectedQuestionIds([]);
    setIsActive(true);
    setEditingQuiz(null);
    setSearchTerm("");
  };
  const resetQuestionForm = () => {
    setNewQuestionTitle("");
    setNewQuestionTopic("");
    setNewQuestionText("");
    setNewQuestionMaxMarks(2);
    setNewQuestionAnswer("");
    setNewQuestionInputType("text");
    setNewQuestionStarterCode("");
    setNewQuestionLabeledFields([{ key: "field1", label: "Field 1" }]);
    setNewQuestionFillBlanksCode("");
    setNewQuestionTableRows(3);
    setNewQuestionTableCols(2);
    setNewQuestionTableHeaders(["Column 1", "Column 2"]);
    setNewQuestionContentBlocks([{ id: `cb-${Date.now()}`, type: "text", content: "" }]);
  };
  const addContentBlock = (type) => {
    const newBlock = {
      id: `cb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: ""
    };
    setNewQuestionContentBlocks([...newQuestionContentBlocks, newBlock]);
  };
  const updateContentBlock = (index, content) => {
    const updated = [...newQuestionContentBlocks];
    updated[index] = { ...updated[index], content };
    setNewQuestionContentBlocks(updated);
  };
  const removeContentBlock = (index) => {
    if (newQuestionContentBlocks.length > 1) {
      setNewQuestionContentBlocks(newQuestionContentBlocks.filter((_, i) => i !== index));
    }
  };
  const handleCreateQuestion = async () => {
    const nonEmptyBlocks = newQuestionContentBlocks.filter((b) => b.content.trim());
    if (!newQuestionTitle.trim() || !newQuestionTopic || nonEmptyBlocks.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in title, topic, and at least one content block" });
      return;
    }
    if (newQuestionInputType === "fill-in-blanks" && !newQuestionFillBlanksCode.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Fill-in-blanks questions require code with blanks" });
      return;
    }
    if (newQuestionInputType === "labeled-inputs") {
      const hasEmptyLabels = newQuestionLabeledFields.some((f) => !f.label.trim());
      if (hasEmptyLabels || newQuestionLabeledFields.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "All input fields must have labels" });
        return;
      }
    }
    if (newQuestionInputType === "table") {
      if (newQuestionTableRows < 1 || newQuestionTableCols < 1) {
        toast({ variant: "destructive", title: "Error", description: "Table must have at least 1 row and 1 column" });
        return;
      }
      const hasEmptyHeaders = newQuestionTableHeaders.slice(0, newQuestionTableCols).some((h) => !h.trim());
      if (hasEmptyHeaders) {
        toast({ variant: "destructive", title: "Error", description: "All column headers must have names" });
        return;
      }
    }
    setCreatingQuestion(true);
    try {
      const questionId = `quiz-q-${Date.now()}`;
      let inputConfig;
      let starterCode;
      if (newQuestionInputType === "code-editor" && newQuestionStarterCode.trim()) {
        starterCode = newQuestionStarterCode.trim();
      } else if (newQuestionInputType === "labeled-inputs") {
        inputConfig = { fields: newQuestionLabeledFields };
      } else if (newQuestionInputType === "fill-in-blanks" && newQuestionFillBlanksCode.trim()) {
        inputConfig = { code: newQuestionFillBlanksCode.trim() };
      } else if (newQuestionInputType === "table") {
        inputConfig = {
          tableType: "flexible",
          rows: newQuestionTableRows,
          columns: newQuestionTableHeaders.slice(0, newQuestionTableCols).map((header, i) => ({
            id: `col-${i}`,
            header
          }))
        };
      }
      const firstTextBlock = nonEmptyBlocks.find((b) => b.type === "text");
      const questionTextLegacy = firstTextBlock?.content || nonEmptyBlocks[0].content;
      const newQuestion = {
        id: questionId,
        year: 0,
        topic: newQuestionTopic,
        title: newQuestionTitle.trim(),
        isPractice: true,
        isQuizOnly: true,
        subQuestions: [{
          id: `${questionId}-a`,
          label: "(a)",
          questionText: questionTextLegacy,
          contentBlocks: nonEmptyBlocks,
          maxMarks: newQuestionMaxMarks,
          markingScheme: newQuestionAnswer.trim() ? [newQuestionAnswer.trim()] : [],
          inputStyle: newQuestionInputType,
          ...starterCode && { starterCode },
          ...inputConfig && { inputConfig }
        }]
      };
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion)
      });
      if (response.ok) {
        const createdQuestion = await response.json();
        setQuestions((prev) => [...prev, createdQuestion]);
        setSelectedQuestionIds((prev) => [...prev, createdQuestion.id]);
        toast({ title: "Success", description: "Question created and added to quiz" });
        setIsQuestionDialogOpen(false);
        resetQuestionForm();
      } else {
        const data = await response.json();
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to create question" });
      }
    } catch (error) {
      console.error("Error creating question:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to create question" });
    } finally {
      setCreatingQuestion(false);
    }
  };
  const openNewQuizDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };
  const openEditQuizDialog = (quiz) => {
    setEditingQuiz(quiz);
    setQuizName(quiz.name);
    setQuizDescription(quiz.description || "");
    setTimeLimitMinutes(quiz.timeLimitMinutes);
    setSelectedQuestionIds(quiz.questionIds);
    setIsActive(quiz.isActive);
    setIsDialogOpen(true);
  };
  const handleSaveQuiz = async () => {
    if (!quizName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Quiz name is required" });
      return;
    }
    if (selectedQuestionIds.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Select at least one question" });
      return;
    }
    const token = getToken();
    if (!token) {
      setLocation("/teacher/login");
      return;
    }
    try {
      const body = {
        name: quizName.trim(),
        description: quizDescription.trim() || null,
        timeLimitMinutes,
        questionIds: selectedQuestionIds,
        isActive
      };
      const url = editingQuiz ? `/api/custom-quizzes/${editingQuiz.id}` : "/api/custom-quizzes";
      const method = editingQuiz ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: editingQuiz ? "Quiz updated successfully" : "Quiz created successfully"
        });
        setIsDialogOpen(false);
        resetForm();
        fetchQuizzes();
      } else {
        const data = await response.json();
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to save quiz" });
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to save quiz" });
    }
  };
  const handleDeleteQuiz = async (quizId) => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await fetch(`/api/custom-quizzes/${quizId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        toast({ title: "Success", description: "Quiz deleted successfully" });
        fetchQuizzes();
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete quiz" });
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete quiz" });
    }
  };
  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestionIds(
      (prev) => prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };
  const getTopicName = (id) => TOPICS.find((t) => t.id === id)?.name || id;
  const sortedQuestions = [...questions].sort(compareQuestionsByNumber);
  const filteredQuestions = sortedQuestions.filter((q) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return q.title.toLowerCase().includes(term) || q.year.toString().includes(term) || getTopicName(q.topic).toLowerCase().includes(term);
  });
  const questionsByYear = filteredQuestions.reduce((acc, q) => {
    const year = q.isPractice ? 0 : q.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(q);
    return acc;
  }, {});
  const sortedYears = Object.keys(questionsByYear).map(Number).sort((a, b) => {
    if (a === 0) return -1;
    if (b === 0) return 1;
    return b - a;
  });
  const calculateQuizTotalMarks = (questionIds) => {
    return questionIds.reduce((total, id) => {
      const q = questions.find((q2) => q2.id === id);
      return total + (q ? calculateTotalMarks(q) : 0);
    }, 0);
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-neutral-500", children: "Loading quizzes..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-[200]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto max-w-6xl flex justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-neutral-900 dark:text-white", children: "Custom Quiz Manager" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full", children: [
          quizzes.length,
          " Quizzes"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => setLocation("/teacher/dashboard"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
        " Back to Dashboard"
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "container mx-auto max-w-6xl p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end mb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNewQuizDialog, className: "bg-purple-600 hover:bg-purple-700", "data-testid": "button-create-quiz", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
        " Create New Quiz"
      ] }) }),
      quizzes.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileQuestionMark, { className: "mx-auto h-12 w-12 text-neutral-300 mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2", children: "No Custom Quizzes Yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-500 mb-4", children: "Create custom practice quizzes by selecting questions from your question bank." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNewQuizDialog, className: "bg-purple-600 hover:bg-purple-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
          " Create Your First Quiz"
        ] })
      ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: quizzes.map((quiz) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `hover:shadow-md transition-shadow ${!quiz.isActive ? "opacity-60" : ""}`, "data-testid": `card-quiz-${quiz.id}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3 flex flex-row items-start justify-between space-y-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
              !quiz.isActive && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 font-medium", children: "INACTIVE" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 font-medium", children: [
                quiz.questionIds.length,
                " Questions"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: quiz.name }),
            quiz.description && /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "mt-1", children: quiz.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => openEditQuizDialog(quiz), "data-testid": `button-edit-quiz-${quiz.id}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-4 w-4 mr-2" }),
              " Edit"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "text-red-500 hover:bg-red-50 hover:text-red-600", "data-testid": `button-delete-quiz-${quiz.id}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Delete Quiz?" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
                    'Are you sure you want to delete "',
                    quiz.name,
                    '"? This action cannot be undone.'
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => handleDeleteQuiz(quiz.id), className: "bg-red-600 hover:bg-red-700", children: "Delete" })
                ] })
              ] })
            ] })
          ] })
        ] }),
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
              calculateQuizTotalMarks(quiz.questionIds),
              " total marks"
            ] })
          ] })
        ] }) })
      ] }, quiz.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isDialogOpen, onOpenChange: (open) => {
      if (!open) resetForm();
      setIsDialogOpen(open);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      DialogContent,
      {
        className: "max-h-[90vh] overflow-y-auto overflow-x-hidden",
        style: { maxWidth: "min(42rem, calc(100vw - 2rem))", width: "100%", boxSizing: "border-box" },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editingQuiz ? "Edit Quiz" : "Create New Quiz" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Configure your quiz settings and select questions to include." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 py-4", style: { width: "100%", maxWidth: "100%", overflow: "hidden" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "quizName", children: "Quiz Name *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "quizName",
                    value: quizName,
                    onChange: (e) => setQuizName(e.target.value),
                    placeholder: "e.g., Week 5 Practice Quiz",
                    "data-testid": "input-quiz-name"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "timeLimit", children: "Time Limit (minutes)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "timeLimit",
                    type: "number",
                    min: 1,
                    value: timeLimitMinutes,
                    onChange: (e) => setTimeLimitMinutes(parseInt(e.target.value) || 60),
                    "data-testid": "input-time-limit"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "quizDescription", children: "Description (optional)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  id: "quizDescription",
                  value: quizDescription,
                  onChange: (e) => setQuizDescription(e.target.value),
                  placeholder: "Brief description of the quiz purpose or topic focus...",
                  rows: 2,
                  "data-testid": "input-quiz-description"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Make Active" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Active quizzes are visible to students" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: isActive, onCheckedChange: setIsActive, "data-testid": "switch-quiz-active" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", style: { width: "100%", maxWidth: "100%", overflow: "hidden" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 w-full", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "shrink-0", children: [
                  "Select Questions (",
                  selectedQuestionIds.length,
                  " selected)"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap shrink-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setIsQuestionDialogOpen(true), className: "text-purple-600", "data-testid": "button-create-question", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlus, { className: "h-4 w-4 mr-1" }),
                    " New"
                  ] }),
                  selectedQuestionIds.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: () => setSelectedQuestionIds([]), className: "text-neutral-500", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4 mr-1" }),
                    " Clear"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
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
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-lg max-h-[300px] overflow-y-auto", style: { width: "100%", maxWidth: "100%", overflowX: "hidden" }, children: sortedYears.map((year) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Collapsible, { defaultOpen: sortedYears.length <= 3, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CollapsibleTrigger, { className: "flex items-center gap-2 w-full px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 border-b", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4 text-neutral-400" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: year === 0 ? "Practice Questions" : year }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-400 ml-auto", children: [
                    questionsByYear[year].length,
                    " questions"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { children: questionsByYear[year].map((question) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `flex items-start gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/30 ${selectedQuestionIds.includes(question.id) ? "bg-purple-50 dark:bg-purple-950/20" : ""}`,
                    onClick: () => toggleQuestionSelection(question.id),
                    "data-testid": `checkbox-question-${question.id}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Checkbox,
                        {
                          checked: selectedQuestionIds.includes(question.id),
                          onCheckedChange: () => toggleQuestionSelection(question.id),
                          className: "mt-1"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 overflow-hidden", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1 flex-wrap", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded whitespace-nowrap", children: getTopicName(question.topic) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-400 whitespace-nowrap", children: [
                            calculateTotalMarks(question),
                            " marks"
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm truncate", children: question.title }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 truncate", children: getQuestionPreviewText(question) })
                      ] })
                    ]
                  },
                  question.id
                )) })
              ] }, year)) }),
              selectedQuestionIds.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-neutral-600 dark:text-neutral-400 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg", children: [
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
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSaveQuiz, className: "bg-purple-600 hover:bg-purple-700", "data-testid": "button-save-quiz", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
              editingQuiz ? "Update Quiz" : "Create Quiz"
            ] })
          ] })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isQuestionDialogOpen, onOpenChange: (open) => {
      if (!open) resetQuestionForm();
      setIsQuestionDialogOpen(open);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[85vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create Quiz Question" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Create a new question specifically for this quiz. These questions will only appear in custom quizzes." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 py-4", style: { width: "100%", maxWidth: "100%", overflow: "hidden" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "question-title", children: "Question Title *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "question-title",
                placeholder: "e.g., Variables Question 1",
                value: newQuestionTitle,
                onChange: (e) => setNewQuestionTitle(e.target.value),
                "data-testid": "input-question-title"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "question-topic", children: "Topic *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: newQuestionTopic, onValueChange: setNewQuestionTopic, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { "data-testid": "select-question-topic", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select a topic" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: TOPICS.map((topic) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: topic.id, children: topic.name }, topic.id)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "question-type", children: "Answer Input Type" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: newQuestionInputType, onValueChange: (v) => setNewQuestionInputType(v), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { "data-testid": "select-question-type", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select input type" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: INPUT_TYPES.map((type) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: type.id, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: type.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-500", children: type.description })
            ] }) }, type.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Question Content *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => addContentBlock("text"),
                  "data-testid": "button-add-text-block",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "h-4 w-4 mr-1" }),
                    " Text"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => addContentBlock("code"),
                  "data-testid": "button-add-code-block",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-4 w-4 mr-1" }),
                    " Code"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: newQuestionContentBlocks.map((block, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative group", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 mt-2 text-neutral-400", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(GripVertical, { className: "h-4 w-4" }),
              block.type === "text" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-4 w-4" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                placeholder: block.type === "text" ? "Enter text content..." : "Enter code snippet...",
                value: block.content,
                onChange: (e) => updateContentBlock(index, e.target.value),
                rows: block.type === "code" ? 4 : 2,
                className: block.type === "code" ? "font-mono text-sm" : "",
                "data-testid": `input-content-block-${index}`
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => removeContentBlock(index),
                disabled: newQuestionContentBlocks.length <= 1,
                className: "opacity-0 group-hover:opacity-100 transition-opacity",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
              }
            )
          ] }) }, block.id)) })
        ] }),
        newQuestionInputType === "code-editor" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "starter-code", children: "Starter Code (optional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "starter-code",
              placeholder: "# Enter starter code that students will see...",
              value: newQuestionStarterCode,
              onChange: (e) => setNewQuestionStarterCode(e.target.value),
              rows: 4,
              className: "font-mono text-sm",
              "data-testid": "input-starter-code"
            }
          )
        ] }),
        newQuestionInputType === "labeled-inputs" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Input Fields" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            newQuestionLabeledFields.map((field, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  placeholder: "Field label",
                  value: field.label,
                  onChange: (e) => {
                    const updated = [...newQuestionLabeledFields];
                    updated[index] = { ...field, label: e.target.value, key: `field${index + 1}` };
                    setNewQuestionLabeledFields(updated);
                  },
                  className: "flex-1",
                  "data-testid": `input-field-label-${index}`
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  onClick: () => {
                    if (newQuestionLabeledFields.length > 1) {
                      setNewQuestionLabeledFields(newQuestionLabeledFields.filter((_, i) => i !== index));
                    }
                  },
                  disabled: newQuestionLabeledFields.length <= 1,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
                }
              )
            ] }, index)),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => setNewQuestionLabeledFields([
                  ...newQuestionLabeledFields,
                  { key: `field${newQuestionLabeledFields.length + 1}`, label: `Field ${newQuestionLabeledFields.length + 1}` }
                ]),
                "data-testid": "button-add-field",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
                  " Add Field"
                ]
              }
            )
          ] })
        ] }),
        newQuestionInputType === "fill-in-blanks" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "blanks-code", children: "Code with Blanks" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Use _____ (5+ underscores) to indicate blanks students must fill in." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "blanks-code",
              placeholder: "name = _____\nprint('Hello', _____)",
              value: newQuestionFillBlanksCode,
              onChange: (e) => setNewQuestionFillBlanksCode(e.target.value),
              rows: 5,
              className: "font-mono text-sm",
              "data-testid": "input-blanks-code"
            }
          )
        ] }),
        newQuestionInputType === "table" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "table-rows", children: "Number of Rows" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "table-rows",
                  type: "number",
                  min: 1,
                  max: 20,
                  value: newQuestionTableRows,
                  onChange: (e) => setNewQuestionTableRows(parseInt(e.target.value) || 1),
                  "data-testid": "input-table-rows"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "table-cols", children: "Number of Columns" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "table-cols",
                  type: "number",
                  min: 1,
                  max: 10,
                  value: newQuestionTableCols,
                  onChange: (e) => {
                    const cols = Math.min(10, Math.max(1, parseInt(e.target.value) || 1));
                    setNewQuestionTableCols(cols);
                    const headers = [...newQuestionTableHeaders];
                    while (headers.length < cols) headers.push(`Column ${headers.length + 1}`);
                    setNewQuestionTableHeaders(headers.slice(0, cols));
                  },
                  "data-testid": "input-table-cols"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Column Headers" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: newQuestionTableHeaders.slice(0, newQuestionTableCols).map((header, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                placeholder: `Column ${index + 1}`,
                value: header,
                onChange: (e) => {
                  const updated = [...newQuestionTableHeaders];
                  updated[index] = e.target.value;
                  setNewQuestionTableHeaders(updated);
                },
                className: "w-32",
                "data-testid": `input-table-header-${index}`
              },
              index
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "question-marks", children: "Maximum Marks" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "question-marks",
              type: "number",
              min: 1,
              max: 20,
              value: newQuestionMaxMarks,
              onChange: (e) => setNewQuestionMaxMarks(parseInt(e.target.value) || 1),
              "data-testid": "input-question-marks"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "question-answer", children: "Model Answer (optional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "question-answer",
              placeholder: "Enter the expected answer...",
              value: newQuestionAnswer,
              onChange: (e) => setNewQuestionAnswer(e.target.value),
              rows: 2,
              "data-testid": "input-question-answer"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: "Used for AI grading guidance." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-amber-800 dark:text-amber-200 mb-2", children: "Need advanced question types?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-700 dark:text-amber-300 mb-2", children: "For drawing, ERD, navigation, or diagram-based questions, use the full Question Editor." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => {
                setIsQuestionDialogOpen(false);
                setLocation("/teacher/questions?createQuizOnly=true");
              },
              className: "text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-4 w-4 mr-1" }),
                " Open Question Editor"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => {
          resetQuestionForm();
          setIsQuestionDialogOpen(false);
        }, children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: handleCreateQuestion,
            className: "bg-purple-600 hover:bg-purple-700",
            disabled: creatingQuestion,
            "data-testid": "button-save-question",
            children: creatingQuestion ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }),
              "Creating..."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
              "Create Question"
            ] })
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  QuizManager as default
};
//# sourceMappingURL=QuizManager-CC1WGsES.js.map
