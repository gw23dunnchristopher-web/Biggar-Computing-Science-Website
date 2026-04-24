import { c as createLucideIcon, d as useRoute, u as useLocation, e as useQuestions, a as useToast, b as useStudentAuth, r as reactExports, j as jsxRuntimeExports, g as cn } from "./index-DZjJp9Jo.js";
import { h as handleTabKey } from "./QuestionInput-KmSAPMhQ.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { C as Card, d as CardContent } from "./card-D7eXR4Y_.js";
import { T as Textarea } from "./textarea-DVZKhD5j.js";
import { I as Input } from "./input-BglVfhce.js";
import { B as Badge } from "./badge-CTdnfMqk.js";
import { D as DiagramImageInput, a as DIAGRAM_HINTS } from "./diagram-image-input-BvTCIJFA.js";
import { R as RowLayout, a as RowLayoutItem } from "./row-layout-Cx0Djyld.js";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-Dav9MFAg.js";
import { M as ModeToggle } from "./mode-toggle-Bf7eeVrX.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { C as Clock } from "./clock-CBMrk16J.js";
import { C as CircleX } from "./circle-x-DWAGdAys.js";
import { C as CirclePause } from "./circle-pause-DkpsFpZH.js";
import { A as ArrowRight } from "./arrow-right-BGWMDShP.js";
import { C as CodeXml, F as FilePen } from "./file-pen-D6Iuyym7.js";
import "./diagram-editor-YPWk6RIh.js";
import "./pencil-BpyvL5SV.js";
import "./trash-2-bLg5w6uM.js";
import "./circle-D4qz0ZWK.js";
import "./database-C7hi9e55.js";
import "./list-CSQ5KgpQ.js";
import "./chevron-down-C5HdvL5Z.js";
import "./check-tIL4sncn.js";
import "./upload-BqUh_JkD.js";
import "./download-DGRZihqj.js";
import "./index-CxDJjHs5.js";
import "./index-C94DArSW.js";
import "./Combination-DqZOzdwe.js";
import "./dropdown-menu-DZfpUsGF.js";
import "./index-D-MpoJPS.js";
import "./index-Ck6_BvxI.js";
import "./chevron-right-CVWIcf-n.js";
const __iconNode = [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      key: "wmoenq"
    }
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
];
const TriangleAlert = createLucideIcon("triangle-alert", __iconNode);
const getCellValue = (cell) => {
  return typeof cell === "string" ? cell : cell.value;
};
const getCellRole = (cell) => {
  return typeof cell === "string" ? "data" : cell.role || "data";
};
const getCellColSpan = (cell) => {
  return typeof cell === "string" ? 1 : cell.colSpan || 1;
};
const getCellRowSpan = (cell) => {
  return typeof cell === "string" ? 1 : cell.rowSpan || 1;
};
const isCellHidden = (cell) => {
  return typeof cell === "string" ? false : cell.hidden || false;
};
function formatInlineText(text) {
  const parts = [];
  let key = 0;
  const combinedRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\^([^^]+?)\^)/g;
  let lastIndex = 0;
  let match;
  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const fullMatch = match[0];
    if (fullMatch.startsWith("**") && fullMatch.endsWith("**")) {
      parts.push(/* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: fullMatch.slice(2, -2) }, key++));
    } else if (fullMatch.startsWith("`") && fullMatch.endsWith("`")) {
      parts.push(/* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono text-sm", children: fullMatch.slice(1, -1) }, key++));
    } else if (fullMatch.startsWith("^") && fullMatch.endsWith("^")) {
      parts.push(/* @__PURE__ */ jsxRuntimeExports.jsx("sup", { children: fullMatch.slice(1, -1) }, key++));
    } else if (fullMatch.startsWith("*") && fullMatch.endsWith("*")) {
      parts.push(/* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: fullMatch.slice(1, -1) }, key++));
    }
    lastIndex = match.index + fullMatch.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
}
function extractAlignment(line) {
  if (line.startsWith("[center]")) {
    return { content: line.slice(8), align: "center" };
  } else if (line.startsWith("[right]")) {
    return { content: line.slice(7), align: "right" };
  } else if (line.startsWith("[left]")) {
    return { content: line.slice(6), align: "left" };
  }
  return { content: line, align: "left" };
}
function formatText(text) {
  let keyCounter = 0;
  const lines = text.split("\n");
  const elements = [];
  let currentBulletItems = [];
  let currentParagraphLines = [];
  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      let currentAlign = currentParagraphLines[0].align;
      let currentGroup = [];
      for (const line of currentParagraphLines) {
        if (line.align === currentAlign) {
          currentGroup.push(line.content);
        } else {
          if (currentGroup.length > 0) {
            const alignClass = currentAlign === "center" ? "text-center" : currentAlign === "right" ? "text-right" : "";
            elements.push(
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mb-5 ${alignClass}`, children: formatInlineText(currentGroup.join("\n")) }, keyCounter++)
            );
          }
          currentAlign = line.align;
          currentGroup = [line.content];
        }
      }
      if (currentGroup.length > 0) {
        const alignClass = currentAlign === "center" ? "text-center" : currentAlign === "right" ? "text-right" : "";
        elements.push(
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mb-5 ${alignClass}`, children: formatInlineText(currentGroup.join("\n")) }, keyCounter++)
        );
      }
      currentParagraphLines = [];
    }
  };
  const renderNestedList = (items) => {
    if (items.length === 0) return null;
    const result = [];
    let i = 0;
    while (i < items.length) {
      const item = items[i];
      const currentLevel = item.level;
      const nestedItems = [];
      let j = i + 1;
      while (j < items.length && items[j].level > currentLevel) {
        nestedItems.push(items[j]);
        j++;
      }
      result.push(
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "pl-1", children: [
          formatInlineText(item.content),
          nestedItems.length > 0 && renderNestedList(nestedItems)
        ] }, i)
      );
      i = j;
    }
    const isNumbered = items[0].isNumbered;
    const ListTag = isNumbered ? "ol" : "ul";
    const listStyle = items[0].level === 0 ? `mb-4 ml-5 space-y-1 ${isNumbered ? "list-decimal" : "list-disc"}` : `mt-1 ml-5 space-y-1 ${isNumbered ? "list-decimal" : "list-disc"}`;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ListTag, { className: listStyle, children: result }, keyCounter++);
  };
  const flushBulletList = () => {
    if (currentBulletItems.length > 0) {
      elements.push(renderNestedList(currentBulletItems));
      currentBulletItems = [];
    }
  };
  for (const line of lines) {
    const trimmedLine = line.trim();
    const leadingSpaces = line.match(/^(\s*)/)?.[1] || "";
    const level = Math.floor(leadingSpaces.replace(/\t/g, "  ").length / 2);
    const bulletMatch = trimmedLine.match(/^[-•]\s+(.+)$/);
    const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      currentBulletItems.push({ content: bulletMatch[1], isNumbered: false, level });
    } else if (numberedMatch) {
      flushParagraph();
      currentBulletItems.push({ content: numberedMatch[2], isNumbered: true, level });
    } else if (trimmedLine === "") {
      flushBulletList();
      flushParagraph();
    } else {
      flushBulletList();
      const { content, align } = extractAlignment(line);
      currentParagraphLines.push({ content, align });
    }
  }
  flushBulletList();
  flushParagraph();
  if (elements.length === 1) {
    return elements[0];
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: elements });
}
function hasScenarioContent(scenario) {
  if (!scenario) return false;
  if (scenario.contentBlocks && scenario.contentBlocks.length > 0) {
    return scenario.contentBlocks.some((block) => block.content && block.content.trim());
  }
  return !!(scenario.text && scenario.text.trim() || scenario.imageUrl || scenario.codeSnippet || scenario.preCodeText || scenario.postImageText);
}
function TimedExam() {
  const [match, params] = useRoute("/timed-exam/:year/:optionalSection");
  const [, setLocation] = useLocation();
  const { questions, loading: questionsLoading } = useQuestions();
  const { toast } = useToast();
  const { isLoggedIn: studentLoggedIn, studentId: authStudentId } = useStudentAuth();
  const isQuizMode = params?.year === "quiz";
  const isStudentQuizMode = params?.year === "student-quiz";
  const isAdditionalExamMode = params?.year?.startsWith("additional-") || params?.year === "additional";
  const additionalPaperId = params?.year?.startsWith("additional-") ? params.year.replace("additional-", "") : void 0;
  const quizId = isQuizMode || isStudentQuizMode ? params?.optionalSection : void 0;
  const year = isQuizMode || isStudentQuizMode || isAdditionalExamMode ? 0 : parseInt(params?.year || "0");
  const optionalSection = isQuizMode || isStudentQuizMode ? void 0 : params?.optionalSection;
  const [examQuestions, setExamQuestions] = reactExports.useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = reactExports.useState(0);
  const [timeLeft, setTimeLeft] = reactExports.useState(90 * 60);
  const [extraTimeAdded, setExtraTimeAdded] = reactExports.useState(null);
  const [answers, setAnswers] = reactExports.useState({});
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const [gradingProgress, setGradingProgress] = reactExports.useState(0);
  const [gradingTotal, setGradingTotal] = reactExports.useState(0);
  const [quizName, setQuizName] = reactExports.useState("");
  const [additionalPaperName, setAdditionalPaperName] = reactExports.useState("");
  const quizInitializedRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (isQuizMode && quizId) {
      if (quizInitializedRef.current) return;
      quizInitializedRef.current = true;
      const fetchQuizQuestions = async () => {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const isResuming = urlParams.get("resume") === "true";
          if (isResuming) {
            const token = localStorage.getItem("studentToken");
            let resumedFromServer = false;
            if (token) {
              try {
                const serverRes = await fetch("/api/student/exam-progress", {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (serverRes.ok) {
                  const serverData = await serverRes.json();
                  if (serverData && serverData.userInputs && serverData.examType === "quiz" && serverData.examIdentifier === quizId) {
                    const response2 = await fetch(`/api/custom-quizzes/${quizId}/questions`);
                    if (response2.ok) {
                      const data = await response2.json();
                      setQuizName(data.quiz.name);
                      setExamQuestions(data.questions);
                      setTimeLeft(serverData.timeLeft);
                      setUserInputs(serverData.userInputs);
                      setCurrentQuestionIndex(serverData.currentQuestion || 0);
                      if (serverData.extraTimeAdded) setExtraTimeAdded(serverData.extraTimeAdded);
                      toast({ title: "Quiz Resumed", description: "Your progress has been restored from your account." });
                      localStorage.removeItem("paused_quiz");
                      resumedFromServer = true;
                      return;
                    }
                  }
                }
              } catch (e) {
                console.error("Failed to resume quiz from server:", e);
              }
            }
            if (!resumedFromServer) {
              const pausedQuiz = localStorage.getItem("paused_quiz");
              if (pausedQuiz) {
                try {
                  const pausedData = JSON.parse(pausedQuiz);
                  if (pausedData.quizId === quizId) {
                    const response2 = await fetch(`/api/custom-quizzes/${quizId}/questions`);
                    if (response2.ok) {
                      const data = await response2.json();
                      setQuizName(data.quiz.name);
                      setExamQuestions(data.questions);
                      setTimeLeft(pausedData.timeLeft);
                      setUserInputs(pausedData.userInputs || {});
                      setCurrentQuestionIndex(pausedData.currentQuestionIndex || 0);
                      if (pausedData.extraTimeAdded) setExtraTimeAdded(pausedData.extraTimeAdded);
                      toast({ title: "Quiz Resumed", description: "Welcome back! Your progress has been restored." });
                      localStorage.removeItem("paused_quiz");
                      return;
                    }
                  }
                } catch (e) {
                  console.error("Failed to resume quiz", e);
                }
              }
            }
          }
          const response = await fetch(`/api/custom-quizzes/${quizId}/questions`);
          if (response.ok) {
            const data = await response.json();
            setExamQuestions(data.questions);
            setQuizName(data.quiz.name);
            const quizSession = localStorage.getItem("quiz_session");
            if (quizSession) {
              const session = JSON.parse(quizSession);
              if (session.quizId === quizId) {
                setTimeLeft(session.timeLimit);
                if (session.extraTimePercent > 0) {
                  setExtraTimeAdded(`${session.extraTimePercent}%`);
                }
                localStorage.removeItem("quiz_session");
              }
            } else {
              const baseTime = data.quiz.timeLimitMinutes * 60;
              setTimeLeft(baseTime);
            }
          }
        } catch (error) {
          console.error("Error fetching quiz questions:", error);
        }
      };
      fetchQuizQuestions();
    } else if (isStudentQuizMode && quizId) {
      if (quizInitializedRef.current) return;
      quizInitializedRef.current = true;
      const loadStudentQuiz = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const isResuming = urlParams.get("resume") === "true";
        if (isResuming) {
          const token = localStorage.getItem("studentToken");
          let resumedFromServer = false;
          if (token) {
            try {
              const serverRes = await fetch("/api/student/exam-progress", {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (serverRes.ok) {
                const serverData = await serverRes.json();
                if (serverData && serverData.userInputs && serverData.examType === "student-quiz" && serverData.examIdentifier === quizId) {
                  const storedQuiz2 = localStorage.getItem("student_current_quiz");
                  if (storedQuiz2) {
                    const quizData = JSON.parse(storedQuiz2);
                    if (quizData.id === quizId) {
                      setExamQuestions(quizData.questions || []);
                      setQuizName(quizData.name || "My Quiz");
                      setTimeLeft(serverData.timeLeft);
                      setUserInputs(serverData.userInputs);
                      setCurrentQuestionIndex(serverData.currentQuestion || 0);
                      if (serverData.extraTimeAdded) setExtraTimeAdded(serverData.extraTimeAdded);
                      toast({ title: "Quiz Resumed", description: "Your progress has been restored from your account." });
                      localStorage.removeItem("paused_student_quiz");
                      resumedFromServer = true;
                      return;
                    }
                  }
                }
              }
            } catch (e) {
              console.error("Failed to resume student quiz from server:", e);
            }
          }
          if (!resumedFromServer) {
            const pausedQuiz = localStorage.getItem("paused_student_quiz");
            if (pausedQuiz) {
              try {
                const pausedData = JSON.parse(pausedQuiz);
                if (pausedData.quizId === quizId) {
                  const storedQuiz2 = localStorage.getItem("student_current_quiz");
                  if (storedQuiz2) {
                    const quizData = JSON.parse(storedQuiz2);
                    if (quizData.id === quizId) {
                      setExamQuestions(quizData.questions || []);
                      setQuizName(pausedData.quizName || quizData.name || "My Quiz");
                      setTimeLeft(pausedData.timeLeft);
                      setUserInputs(pausedData.userInputs || {});
                      setCurrentQuestionIndex(pausedData.currentQuestionIndex || 0);
                      if (pausedData.extraTimeAdded) setExtraTimeAdded(pausedData.extraTimeAdded);
                      toast({ title: "Quiz Resumed", description: "Welcome back! Your progress has been restored." });
                      localStorage.removeItem("paused_student_quiz");
                      return;
                    }
                  }
                }
              } catch (e) {
                console.error("Failed to resume student quiz", e);
              }
            }
          }
        }
        const storedQuiz = localStorage.getItem("student_current_quiz");
        if (storedQuiz) {
          try {
            const quizData = JSON.parse(storedQuiz);
            if (quizData.id === quizId) {
              setExamQuestions(quizData.questions || []);
              setQuizName(quizData.name || "My Quiz");
              const timeLimitMinutes = quizData.timeLimit || 30;
              setTimeLeft(timeLimitMinutes * 60);
            }
          } catch (e) {
            console.error("Failed to load student quiz", e);
          }
        }
      };
      loadStudentQuiz();
    } else if (isAdditionalExamMode && additionalPaperId) {
      fetch("/api/additional-papers/published").then((r) => r.json()).then((papers) => {
        const paper = papers.find((p) => p.id === additionalPaperId);
        if (paper) setAdditionalPaperName(paper.name);
      }).catch(() => {
      });
      const fetchExamQuestions = async () => {
        try {
          const headers = {};
          const studentToken = localStorage.getItem("studentToken");
          if (studentToken) headers["Authorization"] = `Bearer ${studentToken}`;
          const resp = await fetch(`/api/questions?forExamPaper=${additionalPaperId}`, { headers });
          if (resp.ok) {
            const allQs = await resp.json();
            const filtered = allQs.filter((q) => {
              if (q.additionalPaperId !== additionalPaperId) return false;
              if (q.isPractice) return false;
              if (q.topic === "sdcs") return true;
              if (optionalSection && q.topic === optionalSection) return true;
              return false;
            }).sort((a, b) => {
              const numA = parseInt(a.title.replace(/\D/g, "")) || 0;
              const numB = parseInt(b.title.replace(/\D/g, "")) || 0;
              return numA - numB;
            });
            setExamQuestions(filtered);
          }
        } catch (err) {
          console.error("Failed to fetch additional paper questions:", err);
        }
      };
      fetchExamQuestions();
    } else if (isAdditionalExamMode) {
      const fetchExamQuestions = async () => {
        try {
          const headers = {};
          const studentToken = localStorage.getItem("studentToken");
          if (studentToken) headers["Authorization"] = `Bearer ${studentToken}`;
          const resp = await fetch(`/api/questions?forExamPaper=all`, { headers });
          if (resp.ok) {
            const allQs = await resp.json();
            const filtered = allQs.filter((q) => {
              if (!q.isAdditionalExam) return false;
              if (q.isPractice) return false;
              if (q.topic === "sdcs") return true;
              if (optionalSection && q.topic === optionalSection) return true;
              return false;
            }).sort((a, b) => {
              const numA = parseInt(a.title.replace(/\D/g, "")) || 0;
              const numB = parseInt(b.title.replace(/\D/g, "")) || 0;
              return numA - numB;
            });
            setExamQuestions(filtered);
          }
        } catch (err) {
          console.error("Failed to fetch additional paper questions:", err);
        }
      };
      fetchExamQuestions();
    } else if (year) {
      const filtered = questions.filter((q) => {
        if (q.isPractice) return false;
        if (q.isAdditionalExam) return false;
        if (q.year !== year) return false;
        if (q.topic === "sdcs") return true;
        if (optionalSection && q.topic === optionalSection) return true;
        return false;
      }).sort((a, b) => {
        const numA = parseInt(a.title.replace(/\D/g, "")) || 0;
        const numB = parseInt(b.title.replace(/\D/g, "")) || 0;
        return numA - numB;
      });
      setExamQuestions(filtered);
    }
  }, [year, questions, optionalSection, isQuizMode, isStudentQuizMode, isAdditionalExamMode, additionalPaperId, quizId]);
  reactExports.useEffect(() => {
    const params2 = new URLSearchParams(window.location.search);
    const isResuming = params2.get("resume") === "true";
    const extraTimeParam = params2.get("extraTime");
    if (isResuming) {
      const tryResumeFromServer = async () => {
        const token = localStorage.getItem("studentToken");
        const expectedExamType = isAdditionalExamMode ? "additional-paper" : "past-paper";
        const expectedIdentifier = isAdditionalExamMode ? additionalPaperId || null : null;
        if (token) {
          try {
            const res = await fetch("/api/student/exam-progress", {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const serverData = await res.json();
              if (serverData && serverData.userInputs && serverData.examType === expectedExamType && (expectedIdentifier === null || serverData.examIdentifier === expectedIdentifier)) {
                setTimeLeft(serverData.timeLeft);
                setUserInputs(serverData.userInputs);
                setCurrentQuestionIndex(serverData.currentQuestion || 0);
                if (serverData.extraTimeAdded) {
                  setExtraTimeAdded(serverData.extraTimeAdded);
                }
                toast({
                  title: "Exam Resumed",
                  description: "Welcome back! Your progress has been restored from your account."
                });
                return;
              }
            }
          } catch (e) {
            console.error("Failed to resume from server:", e);
          }
        }
        const saved = localStorage.getItem("paused_exam");
        if (saved) {
          try {
            const data = JSON.parse(saved);
            const currentExamKey = isAdditionalExamMode ? additionalPaperId ? `additional-${additionalPaperId}` : "additional" : year;
            if (data.year === currentExamKey && data.optionalSection === optionalSection) {
              setTimeLeft(data.timeLeft);
              setUserInputs(data.userInputs);
              setCurrentQuestionIndex(data.currentQuestionIndex);
              if (data.extraTimeAdded) {
                setExtraTimeAdded(data.extraTimeAdded);
              }
              toast({
                title: "Exam Resumed",
                description: "Welcome back! Your progress has been restored."
              });
            }
          } catch (e) {
            console.error("Failed to resume exam", e);
          }
        }
      };
      tryResumeFromServer();
    } else if (extraTimeParam && extraTimeParam !== "0") {
      const baseTime = 90 * 60;
      const percentage = parseInt(extraTimeParam);
      if ([25, 33, 50].includes(percentage)) {
        const extraSeconds = Math.round(baseTime * percentage / 100);
        setTimeLeft(baseTime + extraSeconds);
        setExtraTimeAdded(`${percentage}%`);
      }
    }
  }, []);
  const saveProgressToServer = async (examType, examIdentifier) => {
    const token = localStorage.getItem("studentToken");
    if (!token) return;
    try {
      await fetch("/api/student/exam-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          year: typeof year === "number" ? year : 0,
          optionalSection: optionalSection || null,
          timeLeft,
          currentQuestion: currentQuestionIndex,
          answeredCount: Object.keys(userInputs).length,
          totalQuestions: examQuestions.length,
          answeredQuestionIds: null,
          userInputs,
          examType,
          examIdentifier,
          extraTimeAdded: extraTimeAdded || null
        })
      });
    } catch (e) {
      console.error("Failed to save progress to server:", e);
    }
  };
  const handleCancelExam = async () => {
    let serverCleared = true;
    if (studentLoggedIn && authStudentId) {
      try {
        const res = await fetch("/api/student/exam-progress", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("studentToken")}`
          }
        });
        if (!res.ok) serverCleared = false;
      } catch (e) {
        console.error("Failed to delete server progress:", e);
        serverCleared = false;
      }
    }
    if (isQuizMode) {
      try {
        localStorage.removeItem("paused_quiz");
      } catch {
      }
      setLocation("/practice-quizzes");
    } else if (isStudentQuizMode) {
      try {
        localStorage.removeItem("paused_student_quiz");
      } catch {
      }
      setLocation("/my-quizzes");
    } else {
      try {
        localStorage.removeItem("paused_exam");
      } catch {
      }
      setLocation("/timed-mode");
    }
    if (!serverCleared) {
      toast({ title: "Exam cancelled", description: "Local progress cleared, but server progress may not have been removed.", variant: "destructive" });
    } else {
      toast({ title: "Exam cancelled", description: "Your progress has been discarded." });
    }
  };
  const handlePauseExam = async () => {
    if (isQuizMode) {
      const state = {
        isQuiz: true,
        quizId,
        quizName,
        timeLeft,
        userInputs,
        currentQuestionIndex,
        extraTimeAdded,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      try {
        localStorage.setItem("paused_quiz", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save paused quiz:", e);
      }
      if (studentLoggedIn) await saveProgressToServer("quiz", quizId || null);
      toast({
        title: "Quiz Paused",
        description: studentLoggedIn ? "Your progress has been saved to your account. You can resume on any device." : "Your progress has been saved. You can resume later from the Practice Quizzes page."
      });
      setLocation("/practice-quizzes");
    } else if (isStudentQuizMode) {
      const state = {
        isStudentQuiz: true,
        quizId,
        quizName,
        timeLeft,
        userInputs,
        currentQuestionIndex,
        extraTimeAdded,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      try {
        localStorage.setItem("paused_student_quiz", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save paused quiz:", e);
      }
      if (studentLoggedIn) await saveProgressToServer("student-quiz", quizId || null);
      toast({
        title: "Quiz Paused",
        description: studentLoggedIn ? "Your progress has been saved to your account. You can resume on any device." : "Your progress has been saved. You can resume later from My Quizzes."
      });
      setLocation("/my-quizzes");
    } else {
      const examKey = isAdditionalExamMode ? additionalPaperId ? `additional-${additionalPaperId}` : "additional" : year;
      const state = {
        year: examKey,
        optionalSection,
        timeLeft,
        userInputs,
        currentQuestionIndex,
        extraTimeAdded,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      try {
        localStorage.setItem("paused_exam", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save paused exam:", e);
      }
      if (studentLoggedIn) {
        const examType = isAdditionalExamMode ? "additional-paper" : "past-paper";
        const examIdentifier = isAdditionalExamMode ? additionalPaperId || null : null;
        await saveProgressToServer(examType, examIdentifier);
      }
      toast({
        title: "Exam Paused",
        description: studentLoggedIn ? "Your progress has been saved to your account. You can resume on any device." : "Your progress has been saved. You can resume later from the Timed Exam menu."
      });
      setLocation("/timed-mode");
    }
  };
  const handleSubmitExamRef = reactExports.useRef(() => {
  });
  reactExports.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExamRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1e3);
    return () => clearInterval(timer);
  }, []);
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };
  const [userInputs, setUserInputs] = reactExports.useState({});
  const progressStateRef = reactExports.useRef({ timeLeft: 0, currentQuestionIndex: 0, userInputs: {}, examQuestions: [], extraTimeAdded: null });
  progressStateRef.current = { timeLeft, currentQuestionIndex, userInputs, examQuestions, extraTimeAdded };
  reactExports.useEffect(() => {
    if (!studentLoggedIn || !authStudentId || examQuestions.length === 0) return;
    const sendProgress = () => {
      const token = localStorage.getItem("studentToken");
      if (!token) return;
      const state = progressStateRef.current;
      const answeredIds = [];
      for (const q of state.examQuestions) {
        for (const sub of q.subQuestions || []) {
          if (sub.maxMarks > 0) {
            const inputs = state.userInputs[sub.id];
            const hasAnswer = inputs && Object.values(inputs).some((v) => v && v.trim().length > 0);
            if (hasAnswer) {
              answeredIds.push({ id: sub.id, label: `${q.title} ${sub.label || ""}`.trim() });
            }
          }
          if (sub.subParts && sub.subParts.length > 0) {
            for (const part of sub.subParts) {
              if (part.maxMarks > 0) {
                const inputs = state.userInputs[part.id];
                const hasAnswer = inputs && Object.values(inputs).some((v) => v && v.trim().length > 0);
                if (hasAnswer) {
                  answeredIds.push({ id: part.id, label: `${q.title} ${sub.label || ""}${part.label || ""}`.trim() });
                }
              }
            }
          }
        }
      }
      const examType = isQuizMode ? "quiz" : isStudentQuizMode ? "student-quiz" : isAdditionalExamMode ? "additional-paper" : "past-paper";
      const examIdentifier = isQuizMode || isStudentQuizMode ? quizId || null : isAdditionalExamMode ? additionalPaperId || null : null;
      fetch("/api/student/exam-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          year,
          optionalSection: optionalSection || null,
          timeLeft: state.timeLeft,
          currentQuestion: state.currentQuestionIndex,
          answeredCount: answeredIds.length,
          totalQuestions: state.examQuestions.reduce((acc, q) => acc + (q.subQuestions?.length || 0), 0),
          answeredQuestionIds: answeredIds,
          userInputs: state.userInputs,
          examType,
          examIdentifier,
          extraTimeAdded: state.extraTimeAdded || null
        })
      }).catch(() => {
      });
    };
    sendProgress();
    const interval = setInterval(sendProgress, 6e4);
    return () => clearInterval(interval);
  }, [studentLoggedIn, authStudentId, examQuestions.length]);
  const updateInput = (subId, key, value) => {
    setUserInputs((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId] || {},
        [key]: value
      }
    }));
  };
  const handleCodeKeyDown = (e, subId) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      if (e.shiftKey) {
        if (value.substring(start - 2, start) === "  ") {
          const newValue = value.substring(0, start - 2) + value.substring(end);
          updateInput(subId, "main", newValue);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start - 2;
          }, 0);
        }
      } else {
        const newValue = value.substring(0, start) + "  " + value.substring(end);
        updateInput(subId, "main", newValue);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        }, 0);
      }
    }
  };
  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    let totalScore = 0;
    let maxScore = 0;
    const breakdown = [];
    const prepareStudentAnswer = (sub, inputs) => {
      if (sub.inputStyle === "design-choice") {
        const mode = inputs["design_mode"] || "pseudocode";
        if (mode === "pseudocode") {
          return inputs["main"] || "";
        } else if (mode === "diagram" && inputs["diagram_image"]) {
          return "Student submitted a diagram image (see attached image for visual grading).";
        } else if (mode === "diagram" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]);
            const textContents = items.filter((i) => i.content).sort((a, b) => {
              if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
              return a.x - b.x;
            }).map((i) => {
              if (i.type === "bullet-text" && i.content) {
                const bulletPoints = i.content.split("\n").filter((line) => line.trim());
                return `[BULLET_LIST: ${bulletPoints.length} bullet points: ${bulletPoints.map((p, idx) => `${idx + 1}. "${p}"`).join(", ")}]`;
              }
              if (i.type === "numbered-text" && i.content) {
                const numberedItems = i.content.split("\n").filter((line) => line.trim());
                return `[NUMBERED_LIST: ${numberedItems.length} numbered items: ${numberedItems.map((p, idx) => `${idx + 1}. "${p}"`).join(", ")}]`;
              }
              return i.content || "";
            });
            return textContents.join(" ");
          } catch (e) {
            return "";
          }
        }
      } else if ((sub.inputStyle === "drawing" || sub.inputStyle === "structure-dataflow") && inputs["drawing"]) {
        try {
          const items = JSON.parse(inputs["drawing"]);
          const shapeItems = items.filter((i) => i.type !== "line" && i.type !== "crowfoot" && i.type !== "dataflow-arrow");
          const lineItems = items.filter((i) => i.type === "line" || i.type === "crowfoot" || i.type === "dataflow-arrow");
          const sortedShapes = shapeItems.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
            return a.x - b.x;
          });
          const shapeDescriptions = sortedShapes.map((i) => {
            const formatting = [];
            if (i.isBold) formatting.push("bold");
            if (i.isUnderline || i.type === "link-text") formatting.push("underlined");
            if (i.fontSize && i.fontSize !== "normal") formatting.push(`size-${i.fontSize}`);
            const formatStr = formatting.length > 0 ? `, formatting: ${formatting.join("+")}` : "";
            const posStr = `at approx (${Math.round(i.x)}, ${Math.round(i.y)})`;
            const baseTag = !i.isBaseItem ? "" : " [base]";
            if (i.type === "bullet-text" && i.content) {
              const bulletPoints = i.content.split("\n").filter((line) => line.trim());
              return `[BULLET_LIST ${posStr}: ${bulletPoints.length} bullet points: ${bulletPoints.map((p, idx) => `${idx + 1}. "${p}"`).join(", ")}${formatStr}]`;
            }
            if (i.type === "numbered-text" && i.content) {
              const numberedItems = i.content.split("\n").filter((line) => line.trim());
              return `[NUMBERED_LIST ${posStr}: ${numberedItems.length} numbered items: ${numberedItems.map((p, idx) => `${idx + 1}. "${p}"`).join(", ")}${formatStr}]`;
            }
            const shapeLabel = i.type === "box" ? "BOX" : i.type === "ellipse" ? "ELLIPSE" : i.type === "diamond" ? "DIAMOND" : i.type === "parallelogram" ? "PARALLELOGRAM" : i.type === "circle" ? "CIRCLE" : i.type === "cylinder" ? "CYLINDER" : i.type === "hexagon" ? "HEXAGON" : i.type === "trapezoid" ? "TRAPEZOID" : i.type === "document" ? "DOCUMENT" : i.type === "text" ? "TEXT" : i.type.toUpperCase();
            const sizeStr = i.width && i.height ? `, size: ${Math.round(i.width)}x${Math.round(i.height)}` : "";
            return `[${shapeLabel}${baseTag} ${posStr}${sizeStr}: "${i.content || ""}"${formatStr}]`;
          });
          const lineDescriptions = lineItems.map((i) => {
            const getLabel = (id) => {
              if (!id) return "?";
              const target = items.find((t) => t.id === id);
              return target?.content || target?.entityName || target?.type || "?";
            };
            if (i.type === "dataflow-arrow") {
              const dir = i.dataflowDirection || "up";
              const semantic = dir === "up" ? "DATA-IN" : "DATA-OUT";
              const origin = i.originFunctionId ? getLabel(i.originFunctionId) : "?";
              const label = items.find((t) => t.attachedArrowId === i.id)?.content || "";
              return `[${semantic} (arrow ${dir}) for function "${origin}"${label ? `, label: "${label}"` : ""}]`;
            }
            if (i.type === "crowfoot") {
              const oneEntity = i.connectedTo1 ? getLabel(i.connectedTo1) : "?";
              const manyEntity = i.connectedTo2 ? getLabel(i.connectedTo2) : "?";
              const label = i.relationshipLabel ? `, label: "${i.relationshipLabel}"` : "";
              return `[CROWFOOT: "${oneEntity}" (ONE) to "${manyEntity}" (MANY)${label}]`;
            }
            const from = i.connectedTo1 ? getLabel(i.connectedTo1) : `(${Math.round(i.x)},${Math.round(i.y)})`;
            const to = i.connectedTo2 ? getLabel(i.connectedTo2) : `(${Math.round(i.x2 || 0)},${Math.round(i.y2 || 0)})`;
            const arrows = [];
            if (i.arrowStart) arrows.push("arrow-start");
            if (i.arrowEnd) arrows.push("arrow-end");
            const arrowStr = arrows.length > 0 ? `, ${arrows.join("+")}` : "";
            return `[LINE from "${from}" to "${to}"${arrowStr}]`;
          });
          const parts = [];
          if (shapeDescriptions.length > 0) parts.push("SHAPES:\n" + shapeDescriptions.join("\n"));
          if (lineDescriptions.length > 0) parts.push("CONNECTIONS:\n" + lineDescriptions.join("\n"));
          return parts.join("\n\n");
        } catch (e) {
          return "";
        }
      }
      if (sub.inputStyle === "table" && sub.inputConfig) {
        if (sub.inputConfig.grid) {
          const grid = sub.inputConfig.grid;
          const gridAnswers = [];
          grid.rows.forEach((row, rowIdx) => {
            row.cells.forEach((cell, cellIdx) => {
              if (cell.isInput) {
                const key = cell.key || `cell_${rowIdx}_${cellIdx}`;
                const header = grid.headers[cellIdx] || `Column ${cellIdx + 1}`;
                gridAnswers.push(`${header}: ${inputs[key] || "(no answer)"}`);
              }
            });
          });
          return gridAnswers.join("\n");
        }
        if (sub.inputConfig.columns) {
          const numRows = sub.inputConfig.inputRows || 1;
          const columnAnswers = [];
          for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
            const rowAnswers = sub.inputConfig.columns.map((col) => {
              const key = numRows > 1 ? `${col.key}_${rowIdx + 1}` : col.key;
              return `${col.header}: ${inputs[key] || "(no answer)"}`;
            });
            if (numRows > 1) {
              columnAnswers.push(`Row ${rowIdx + 1}: ${rowAnswers.join(", ")}`);
            } else {
              columnAnswers.push(rowAnswers.join("\n"));
            }
          }
          return columnAnswers.join("\n");
        }
        if (sub.inputConfig.rows) {
          const tableAnswers = sub.inputConfig.rows.filter((row) => row.isInput && row.key).map((row) => `${row.label}: ${inputs[row.key] || "(no answer)"}`).join("\n");
          return tableAnswers;
        }
      }
      if (sub.inputStyle === "labeled-inputs" && sub.inputConfig?.fields) {
        const fieldAnswers = sub.inputConfig.fields.map((field) => `${field.label}: ${inputs[field.key] || "(no answer)"}`).join("\n");
        return fieldAnswers;
      }
      if (sub.inputStyle === "erd-annotation") {
        const config = sub.inputConfig;
        const descriptions = [];
        let studentItems = [];
        if (inputs["erd_diagram"]) {
          try {
            studentItems = JSON.parse(inputs["erd_diagram"]);
          } catch (e) {
            console.error("Failed to parse student ERD diagram", e);
          }
        }
        if (config?.erdAttributes) {
          descriptions.push("Attribute Markings:");
          for (const attr of config.erdAttributes) {
            const studentItem = studentItems.find((item) => item.id === attr.id);
            const marking = studentItem?.marking || "none";
            const markingLabel = marking === "primary" ? "Primary Key (PK)" : marking === "foreign" ? "Foreign Key (FK)" : "None";
            descriptions.push(`  ${attr.entityName}.${attr.attributeName}: ${markingLabel}`);
          }
        }
        const erdEntities = studentItems.filter((item) => item.type === "erd-entity");
        if (erdEntities.length > 0) {
          descriptions.push("ERD Entities:");
          for (const entity of erdEntities) {
            const entityName = entity.entityName || "Unnamed Entity";
            const isStudentAdded = !entity.isBaseItem;
            descriptions.push(`  Entity: ${entityName}${isStudentAdded ? " (student added)" : ""}`);
            if (entity.attributes && entity.attributes.length > 0) {
              for (const attr of entity.attributes) {
                const markingLabel = attr.marking === "primary" ? " [PK - underlined]" : attr.marking === "foreign" ? " [FK - asterisk]" : "";
                descriptions.push(`    - ${attr.name || "unnamed"}${markingLabel}`);
              }
            }
          }
        }
        const addedAttrs = studentItems.filter(
          (item) => (item.type === "ellipse" || item.type === "text") && !item.isBaseItem && item.content
        );
        if (addedAttrs.length > 0) {
          descriptions.push("Added Attributes (shapes):");
          for (const attr of addedAttrs) {
            descriptions.push(`  ${attr.content}`);
          }
        }
        const getEntityName = (itemId) => {
          if (!itemId) return "unknown";
          const item = studentItems.find((i) => i.id === itemId);
          if (!item) return "unknown";
          if (item.type === "erd-entity") return item.entityName || "unnamed entity";
          if (item.type === "box" || item.type === "cylinder") return item.content || "unnamed";
          return "unknown";
        };
        const addedLines = studentItems.filter(
          (item) => item.type === "line" && !item.isBaseItem
        );
        if (addedLines.length > 0) {
          descriptions.push("Added Relationship Lines:");
          for (const line of addedLines) {
            const label = line.relationshipLabel ? `"${line.relationshipLabel}"` : "(no label)";
            const from = getEntityName(line.connectedTo1);
            const to = getEntityName(line.connectedTo2);
            descriptions.push(`  Line from "${from}" to "${to}", label: ${label}`);
          }
        }
        const addedCrowfoots = studentItems.filter(
          (item) => item.type === "crowfoot" && !item.isBaseItem
        );
        if (addedCrowfoots.length > 0) {
          descriptions.push("Added 1:M Relationships (crowfoot lines):");
          for (const line of addedCrowfoots) {
            const label = line.relationshipLabel ? `"${line.relationshipLabel}"` : "(no label)";
            const oneEntity = getEntityName(line.connectedTo1);
            const manyEntity = getEntityName(line.connectedTo2);
            descriptions.push(`  Crowfoot line: "${oneEntity}" (ONE side, plain end) ---> "${manyEntity}" (MANY side, forked end), label: ${label}`);
          }
        }
        return descriptions.join("\n");
      }
      if (sub.inputStyle === "form-wireframe" && inputs["drawing"]) {
        try {
          const items = JSON.parse(inputs["drawing"]);
          const sortedItems = items.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
            return a.x - b.x;
          });
          const formElements = [];
          const labels = sortedItems.filter((i) => i.type === "ui-label" || i.type === "text");
          const isRequiredLabel = (labelContent) => {
            return labelContent?.includes("*") || false;
          };
          const findNearestLabel = (element) => {
            let nearest = null;
            let minDist = 100;
            for (const label of labels) {
              const labelCenterY = label.y + (label.height || 20) / 2;
              const elemCenterY = element.y + (element.height || 30) / 2;
              const yDist = Math.abs(labelCenterY - elemCenterY);
              const isLeftOrAbove = label.x <= element.x || label.y < element.y - 10;
              if (yDist < minDist && isLeftOrAbove) {
                minDist = yDist;
                nearest = label;
              }
            }
            return nearest;
          };
          for (const item of sortedItems) {
            switch (item.type) {
              case "ui-label":
              case "text":
                const labelContent = item.content || "unnamed";
                const requiredMarker = isRequiredLabel(labelContent) ? " (REQUIRED - has *)" : "";
                formElements.push(`[LABEL: "${labelContent}"${requiredMarker}]`);
                break;
              case "ui-input":
                const inputLabel = findNearestLabel(item);
                const inputRequired = inputLabel && isRequiredLabel(inputLabel.content) ? " REQUIRED" : "";
                const inputLabelStr = inputLabel ? ` for "${inputLabel.content || "unlabeled"}"` : "";
                const inputValidationText = item.content || item.validationMessage || (item.validationMin !== void 0 || item.validationMax !== void 0 ? `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}` : "");
                const inputContent = inputValidationText ? ` with validation "${inputValidationText}"` : "";
                formElements.push(`[TEXT INPUT${inputLabelStr}${inputRequired}${inputContent}]`);
                break;
              case "ui-textarea":
                const textareaLabel = findNearestLabel(item);
                const textareaRequired = textareaLabel && isRequiredLabel(textareaLabel.content) ? " REQUIRED" : "";
                const textareaLabelStr = textareaLabel ? ` for "${textareaLabel.content || "unlabeled"}"` : "";
                const textareaValidationText = item.content || item.validationMessage || (item.validationMin !== void 0 || item.validationMax !== void 0 ? `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}` : "");
                const textareaContent = textareaValidationText ? ` with validation "${textareaValidationText}"` : "";
                formElements.push(`[TEXTAREA${textareaLabelStr}${textareaRequired}${textareaContent}]`);
                break;
              case "ui-dropdown":
                const dropdownLabel = findNearestLabel(item);
                const dropdownRequired = dropdownLabel && isRequiredLabel(dropdownLabel.content) ? " REQUIRED" : "";
                const dropdownLabelStr = dropdownLabel ? ` for "${dropdownLabel.content || "unlabeled"}"` : "";
                const dropdownOptionText = item.content ? ` showing "${item.content}"` : "";
                const dropdownLegacyVal = item.validationMessage || (item.validationMin !== void 0 || item.validationMax !== void 0 ? `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}` : "");
                const dropdownValidation = dropdownLegacyVal ? ` with validation "${dropdownLegacyVal}"` : "";
                formElements.push(`[DROPDOWN${dropdownLabelStr}${dropdownRequired}${dropdownOptionText}${dropdownValidation}]`);
                break;
              case "ui-radio":
                formElements.push(`[RADIO BUTTON: "${item.content || "option"}"]`);
                break;
              case "ui-checkbox":
                formElements.push(`[CHECKBOX: "${item.content || "option"}"]`);
                break;
              case "ui-submit":
                formElements.push(`[SUBMIT BUTTON: "${item.content || "Submit"}"]`);
                break;
            }
          }
          return `FORM ELEMENTS (in order from top to bottom, note: * in a label indicates a REQUIRED field):
${formElements.join("\n")}`;
        } catch (e) {
          return "";
        }
      }
      if (sub.inputStyle === "webpage-wireframe" && inputs["drawing"]) {
        try {
          const items = JSON.parse(inputs["drawing"]);
          const sortedItems = [...items].filter((i) => i.type !== "line").sort((a, b) => {
            if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
            return a.x - b.x;
          });
          const pageElements = [];
          for (const item of sortedItems) {
            const pos = `at (${Math.round(item.x)}, ${Math.round(item.y)})`;
            const size = item.width && item.height ? ` size ${Math.round(item.width)}x${Math.round(item.height)}` : "";
            switch (item.type) {
              case "wf-heading":
                pageElements.push(`[HEADING ${pos}${size}: "${item.content || "untitled"}"]`);
                break;
              case "wf-paragraph":
                pageElements.push(`[PARAGRAPH ${pos}${size}]`);
                break;
              case "ui-image":
                pageElements.push(`[IMAGE ${pos}${size}: "${item.content || "image"}"]`);
                break;
              case "link-text":
                pageElements.push(`[LINK ${pos}: "${item.content || "link"}"]`);
                break;
              case "bullet-text":
                pageElements.push(`[BULLET LIST ${pos}: "${item.content || "list"}"]`);
                break;
              case "numbered-text":
                pageElements.push(`[NUMBERED LIST ${pos}: "${item.content || "list"}"]`);
                break;
              case "wf-audio":
                pageElements.push(`[AUDIO PLAYER ${pos}${size}: "${item.content || "audio"}"]`);
                break;
              case "wf-video":
                pageElements.push(`[VIDEO PLAYER ${pos}${size}: "${item.content || "video"}"]`);
                break;
              case "wf-div":
                pageElements.push(`[CONTAINER/DIV ${pos}${size}: "${item.content || ""}"]`);
                break;
              case "wf-annotation":
                pageElements.push(`[ANNOTATION ${pos}: "${item.content || ""}"]`);
                break;
              case "ui-label":
                pageElements.push(`[LABEL ${pos}: "${item.content || ""}"]`);
                break;
              case "text":
                pageElements.push(`[TEXT ${pos}: "${item.content || "(no label)"}"]`);
                break;
              case "box":
                pageElements.push(`[BOX ${pos}${size}: "${item.content || "(no label)"}"]`);
                break;
              default:
                pageElements.push(`[${item.type.toUpperCase()} ${pos}: "${item.content || "(no label)"}"]`);
                break;
            }
          }
          return `WEBPAGE WIREFRAME ELEMENTS (in order from top to bottom):
${pageElements.join("\n")}
Total elements: ${pageElements.length}`;
        } catch (e) {
          return "";
        }
      }
      if (inputs["diagram_image"]) {
        return "Student submitted a diagram image (see attached image for visual grading).";
      }
      return Object.entries(inputs).filter(([key]) => key !== "diagram_image").map(([, val]) => val).join("\n");
    };
    try {
      const allSubQuestions = [];
      for (const q of examQuestions) {
        for (const sub of q.subQuestions) {
          if (sub.maxMarks > 0) {
            maxScore += sub.maxMarks;
            const inputs = userInputs[sub.id] || {};
            allSubQuestions.push({ q, sub, inputs });
          }
          if (sub.subParts && sub.subParts.length > 0) {
            for (const part of sub.subParts) {
              if (part.maxMarks > 0) {
                maxScore += part.maxMarks;
                const inputs = userInputs[part.id] || {};
                allSubQuestions.push({ q, sub: part, inputs });
              }
            }
          }
        }
      }
      const contentBlocksToText = (blocks) => {
        if (!blocks || blocks.length === 0) return "";
        const processBlock = (b) => {
          if (b.type === "text") return b.content || "";
          if (b.type === "code") return "```\n" + (b.content || "") + "\n```";
          if (b.type === "data-table" && b.dataTable) {
            const table = b.dataTable;
            const escapeCell = (s) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
            const headers = table.columns.map((c) => escapeCell(c.header));
            const headerRow = "| " + headers.join(" | ") + " |";
            const separator = "| " + headers.map(() => "---").join(" | ") + " |";
            const dataRows = table.rows.map(
              (r) => "| " + r.cells.map((cell) => escapeCell(getCellValue(cell))).join(" | ") + " |"
            ).join("\n");
            return `**Table: ${table.tableName}**
${headerRow}
${separator}
${dataRows}`;
          }
          if (b.type === "code-table" && b.codeSections) {
            return b.codeSections.map((s) => `**${s.label}:**
\`\`\`
${s.code}
\`\`\``).join("\n\n");
          }
          if (b.type === "row-layout" && b.children) {
            return b.children.map(processBlock).filter(Boolean).join("\n\n");
          }
          return "";
        };
        return blocks.map(processBlock).filter(Boolean).join("\n\n");
      };
      setGradingTotal(allSubQuestions.length);
      setGradingProgress(0);
      const gradeSubQuestion = async ({ q, sub, inputs }) => {
        const studentAnswer = prepareStudentAnswer(sub, inputs);
        const othersInSameQuestion = allSubQuestions.filter(
          (item) => item.q.id === q.id && item.sub.id !== sub.id && item.sub.maxMarks > 0
        );
        const siblingContext = othersInSameQuestion.map(({ sub: other, inputs: otherInputs }) => {
          const otherAnswer = prepareStudentAnswer(other, otherInputs);
          const otherQuestion = contentBlocksToText(other.contentBlocks) || other.questionText || "";
          return `Part ${other.label || "?"}: ${otherQuestion}
Student's answer: ${otherAnswer || "(no answer)"}`;
        }).join("\n\n");
        const questionContent = contentBlocksToText(sub.contentBlocks) || sub.questionText || "";
        const formExpectationsContext = sub.inputStyle === "form-wireframe" && sub.inputConfig?.formWireframeExpectations?.length ? `
EXPECTED FORM ELEMENTS (teacher-defined - grade based on these):
${sub.inputConfig.formWireframeExpectations.map((exp, i) => {
          let desc = `${i + 1}. ${exp.fieldType.toUpperCase()}`;
          if (exp.labelText) desc += ` with label "${exp.labelText}"`;
          if (exp.required) desc += " (REQUIRED - must have *)";
          if (exp.options?.length) desc += ` with options: ${exp.options.join(", ")}`;
          const valText = exp.validationMessage || (exp.validationMin !== void 0 || exp.validationMax !== void 0 ? `${exp.validationMin ?? "?"}-${exp.validationMax ?? "?"}` : "");
          if (valText) desc += ` VALIDATION: "${valText}"`;
          return desc;
        }).join("\n")}` : "";
        const navExampleContext = sub.inputStyle === "nav-structure" && sub.inputConfig?.navExampleData ? (() => {
          try {
            const items = JSON.parse(sub.inputConfig.navExampleData);
            const pages = items.filter((i) => i.type === "nav-page" || i.type === "box").sort((a, b) => {
              if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
              return a.x - b.x;
            });
            const lines = items.filter((i) => i.type === "line");
            const pageDescs = pages.map((p) => `"${p.content || "unnamed"}"`);
            const connections = lines.map((line) => {
              const from = pages.find((p) => p.id === line.connectedTo1);
              const to = pages.find((p) => p.id === line.connectedTo2);
              const arrowDesc = line.arrowEnd === "both" ? "<->" : "->";
              return `"${from?.content || "?"}" ${arrowDesc} "${to?.content || "?"}"`;
            });
            return `
EXPECTED NAVIGATION STRUCTURE (teacher-defined example answer - compare student answer to this):
Expected Pages: ${pageDescs.join(", ")}
Expected Links: ${connections.join(", ") || "none"}`;
          } catch (e) {
            return "";
          }
        })() : "";
        let wireframeExampleContext = "";
        if ((sub.inputStyle === "webpage-wireframe" || sub.inputStyle === "form-wireframe") && sub.inputConfig?.wireframeExampleData) {
          try {
            const exampleItems = JSON.parse(sub.inputConfig.wireframeExampleData);
            const sorted = exampleItems.sort((a, b) => {
              if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
              return a.x - b.x;
            });
            const descriptions = [];
            for (const item of sorted) {
              const pos = `at (${Math.round(item.x)}, ${Math.round(item.y)})`;
              const size = item.width && item.height ? ` size ${Math.round(item.width)}x${Math.round(item.height)}` : "";
              switch (item.type) {
                case "wf-heading":
                  descriptions.push(`[HEADING ${pos}${size}: "${item.content || ""}"]`);
                  break;
                case "wf-paragraph":
                  descriptions.push(`[PARAGRAPH ${pos}${size}]`);
                  break;
                case "wf-audio":
                  descriptions.push(`[AUDIO PLAYER ${pos}${size}: "${item.content || ""}"]`);
                  break;
                case "wf-video":
                  descriptions.push(`[VIDEO PLAYER ${pos}${size}: "${item.content || ""}"]`);
                  break;
                case "wf-div":
                  descriptions.push(`[CONTAINER/DIV ${pos}${size}: "${item.content || ""}"]`);
                  break;
                case "wf-annotation":
                  descriptions.push(`[ANNOTATION ${pos}: "${item.content || ""}"]`);
                  break;
                case "ui-image":
                  descriptions.push(`[IMAGE ${pos}${size}: "${item.content || ""}"]`);
                  break;
                case "link-text":
                  descriptions.push(`[LINK ${pos}: "${item.content || ""}"]`);
                  break;
                case "bullet-text":
                  descriptions.push(`[BULLET LIST ${pos}: "${item.content || ""}"]`);
                  break;
                case "numbered-text":
                  descriptions.push(`[NUMBERED LIST ${pos}: "${item.content || ""}"]`);
                  break;
                case "ui-label":
                  descriptions.push(`[LABEL ${pos}: "${item.content || ""}"]`);
                  break;
                case "text":
                  descriptions.push(`[TEXT ${pos}: "${item.content || ""}"]`);
                  break;
                case "box":
                  descriptions.push(`[BOX ${pos}${size}: "${item.content || ""}"]`);
                  break;
                case "ui-input":
                  descriptions.push(`[TEXT INPUT ${pos}: "${item.content || ""}"]`);
                  break;
                case "ui-textarea":
                  descriptions.push(`[TEXTAREA ${pos}: "${item.content || ""}"]`);
                  break;
                case "ui-dropdown":
                  descriptions.push(`[DROPDOWN ${pos}: "${item.content || ""}"]`);
                  break;
                case "ui-radio":
                  descriptions.push(`[RADIO ${pos}: "${item.content || ""}"]`);
                  break;
                case "ui-checkbox":
                  descriptions.push(`[CHECKBOX ${pos}: "${item.content || ""}"]`);
                  break;
                case "ui-submit":
                  descriptions.push(`[SUBMIT BUTTON ${pos}: "${item.content || ""}"]`);
                  break;
                default:
                  descriptions.push(`[${item.type.toUpperCase()} ${pos}: "${item.content || ""}"]`);
              }
            }
            if (descriptions.length > 0) {
              wireframeExampleContext = `
TEACHER'S EXAMPLE WIREFRAME (expected answer - the student should have the same types of elements in approximately the same positions):
${descriptions.join("\n")}
Total expected elements: ${descriptions.length}`;
            }
          } catch (e) {
          }
        }
        const fullContext = [
          `${q.title}${sub.label ? ` ${sub.label}` : ""}: ${questionContent}`,
          formExpectationsContext,
          wireframeExampleContext,
          navExampleContext,
          siblingContext ? `
OTHER PARTS OF THIS QUESTION (for context - grade ONLY the current part):
${siblingContext}` : ""
        ].filter(Boolean).join("\n\n");
        let score = 0;
        if (studentAnswer.trim()) {
          try {
            const diagramInputStyles = ["drawing", "structure-dataflow", "erd-annotation", "form-wireframe", "webpage-wireframe", "nav-structure", "nav-structure-higher", "design-choice", "structure-diagram", "entity-occurrence-diagram"];
            const isDiagram = diagramInputStyles.includes(sub.inputStyle || "");
            const studentDiagramImage = isDiagram ? inputs["diagram_image"] || "" : "";
            const response = await fetch("/api/grade-answer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                studentAnswer: studentAnswer.trim(),
                markingScheme: sub.markingScheme,
                maxMarks: sub.maxMarks,
                questionContext: fullContext,
                aiGuidance: sub.aiGuidance,
                studentDiagramImage: studentDiagramImage || void 0
              })
            });
            if (response.ok) {
              const result = await response.json();
              score = result.marks;
              const normFeedback = (v) => !v ? "" : typeof v === "string" ? v : Array.isArray(v) ? v.join("\n") : String(v);
              return {
                questionTitle: q.title,
                subLabel: sub.label,
                questionText: sub.questionText || `${q.title}${sub.label ? ` ${sub.label}` : ""}`,
                contentBlocks: sub.contentBlocks || [],
                codeSnippet: sub.codeSnippet || "",
                maxMarks: sub.maxMarks,
                score,
                userAnswer: inputs,
                inputStyle: sub.inputStyle,
                feedback: normFeedback(result.feedback),
                suggestions: normFeedback(result.suggestions)
              };
            } else {
              score = calculateMarks(inputs, sub);
            }
          } catch (error) {
            score = calculateMarks(inputs, sub);
          }
        }
        return {
          questionTitle: q.title,
          subLabel: sub.label,
          questionText: sub.questionText || `${q.title}${sub.label ? ` ${sub.label}` : ""}`,
          contentBlocks: sub.contentBlocks || [],
          codeSnippet: sub.codeSnippet || "",
          maxMarks: sub.maxMarks,
          score,
          userAnswer: inputs,
          inputStyle: sub.inputStyle,
          feedback: "",
          suggestions: ""
        };
      };
      const BATCH_SIZE = 5;
      const results = [];
      for (let i = 0; i < allSubQuestions.length; i += BATCH_SIZE) {
        const batch = allSubQuestions.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(gradeSubQuestion));
        results.push(...batchResults);
        setGradingProgress(Math.min(i + BATCH_SIZE, allSubQuestions.length));
      }
      for (const result of results) {
        totalScore += result.score;
        breakdown.push(result);
      }
    } catch (error) {
      console.error("Error grading exam:", error);
      toast({
        title: "Grading Error",
        description: "There was an issue grading your exam. Using fallback marking.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
    const cleanBreakdown = breakdown.map((item) => {
      if (item.userAnswer && typeof item.userAnswer === "object" && !Array.isArray(item.userAnswer)) {
        const { drawing_canvas, ...rest } = item.userAnswer;
        return { ...item, userAnswer: rest };
      }
      return item;
    });
    const examTitle = isQuizMode || isStudentQuizMode ? quizName || "Quiz" : isAdditionalExamMode ? additionalPaperName || "Mock Exam" : `${year}`;
    const resultData = {
      year,
      examTitle,
      totalScore,
      maxScore,
      breakdown: cleanBreakdown,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      localStorage.setItem("last_exam_result", JSON.stringify(resultData));
    } catch (e) {
      console.error("Failed to save exam results to localStorage:", e);
    }
    try {
      const headers = { "Content-Type": "application/json" };
      const studentToken = localStorage.getItem("studentToken");
      if (studentToken) headers["Authorization"] = `Bearer ${studentToken}`;
      const grade = totalScore >= maxScore * 0.7 ? "A" : totalScore >= maxScore * 0.6 ? "B" : totalScore >= maxScore * 0.5 ? "C" : totalScore >= maxScore * 0.4 ? "D" : "No Award";
      await fetch("/api/exam-results", {
        method: "POST",
        headers,
        body: JSON.stringify({
          year: typeof year === "string" ? parseInt(year) || 0 : year,
          optionalSection: optionalSection || null,
          score: totalScore,
          maxScore,
          grade,
          breakdown,
          additionalPaperId: isAdditionalExamMode ? additionalPaperId || null : null
        })
      });
    } catch (err) {
      console.error("Failed to save exam results to server:", err);
    }
    if (studentLoggedIn) {
      const progressToken = localStorage.getItem("studentToken");
      if (progressToken) {
        fetch("/api/student/exam-progress", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${progressToken}` }
        }).catch(() => {
        });
      }
    }
    setLocation("/exam-results");
  };
  reactExports.useEffect(() => {
    handleSubmitExamRef.current = handleSubmitExam;
  }, [examQuestions, userInputs, year]);
  const calculateMarks = (inputs, subQ) => {
    if (subQ.maxMarks === 0) return 0;
    let combinedAnswer = Object.values(inputs).join("\n").trim().toLowerCase();
    if (subQ.inputStyle === "design-choice") {
      const mode = inputs["design_mode"] || "pseudocode";
      if (mode === "pseudocode") {
        combinedAnswer = (inputs["main"] || "").toLowerCase();
      } else if (mode === "diagram" && inputs["drawing"]) {
        try {
          const items = JSON.parse(inputs["drawing"]);
          const textContents = items.filter((i) => (i.type === "text" || i.type === "box" || i.type === "ellipse" || i.type === "diamond" || i.type === "parallelogram") && i.content).sort((a, b) => {
            if (Math.abs(a.y - b.y) > 40) {
              return a.y - b.y;
            }
            return a.x - b.x;
          }).map((i) => i.content?.toLowerCase() || "");
          combinedAnswer = textContents.join(" ");
        } catch (e) {
          combinedAnswer = "";
        }
      }
    } else if (subQ.inputStyle === "drawing" && inputs["drawing"]) {
      try {
        const items = JSON.parse(inputs["drawing"]);
        const textContents = items.filter((i) => (i.type === "text" || i.type === "box" || i.type === "ellipse" || i.type === "diamond" || i.type === "parallelogram") && i.content).sort((a, b) => {
          if (Math.abs(a.y - b.y) > 40) {
            return a.y - b.y;
          }
          return a.x - b.x;
        }).map((i) => i.content?.toLowerCase() || "");
        combinedAnswer = textContents.join(" ");
      } catch (e) {
      }
    } else if (subQ.inputStyle === "erd-annotation") {
      const config = subQ.inputConfig;
      let totalRequirements = 0;
      let correctCount = 0;
      let studentItems = [];
      if (inputs["erd_diagram"]) {
        try {
          studentItems = JSON.parse(inputs["erd_diagram"]);
        } catch (e) {
          console.error("Failed to parse student ERD diagram", e);
        }
      }
      if (config?.erdAttributes) {
        for (const attr of config.erdAttributes) {
          totalRequirements++;
          const studentItem = studentItems.find((item) => item.id === attr.id);
          const studentMarking = studentItem?.marking || "none";
          if (studentMarking === attr.correctMarking) {
            correctCount++;
          }
        }
      }
      if (config?.erdRequiredAttributes) {
        for (const reqAttr of config.erdRequiredAttributes) {
          totalRequirements++;
          const found = studentItems.some(
            (item) => (item.type === "ellipse" || item.type === "text") && !item.isBaseItem && item.content?.toLowerCase().includes(reqAttr.attributeName.toLowerCase())
          );
          if (found) {
            correctCount++;
          }
        }
      }
      if (config?.erdRequiredLines) {
        for (const reqLine of config.erdRequiredLines) {
          totalRequirements++;
          const entity1 = studentItems.find(
            (item) => (item.type === "box" || item.type === "cylinder") && item.content?.toLowerCase().includes(reqLine.entity1.toLowerCase())
          );
          const entity2 = studentItems.find(
            (item) => (item.type === "box" || item.type === "cylinder") && item.content?.toLowerCase().includes(reqLine.entity2.toLowerCase())
          );
          if (entity1 && entity2) {
            const hasLine = studentItems.some(
              (item) => item.type === "line" && (item.connectedTo1 === entity1.id && item.connectedTo2 === entity2.id || item.connectedTo1 === entity2.id && item.connectedTo2 === entity1.id)
            );
            if (hasLine) {
              correctCount++;
            }
          }
        }
      }
      if (config?.erdRequiredCrowfootLines) {
        for (const reqCrowfoot of config.erdRequiredCrowfootLines) {
          totalRequirements++;
          const entity1 = studentItems.find(
            (item) => (item.type === "box" || item.type === "cylinder") && item.content?.toLowerCase().includes(reqCrowfoot.entity1.toLowerCase())
          );
          const entity2 = studentItems.find(
            (item) => (item.type === "box" || item.type === "cylinder") && item.content?.toLowerCase().includes(reqCrowfoot.entity2.toLowerCase())
          );
          if (entity1 && entity2) {
            const hasCrowfoot = studentItems.some(
              (item) => item.type === "crowfoot" && (item.connectedTo1 === entity1.id && item.connectedTo2 === entity2.id || item.connectedTo1 === entity2.id && item.connectedTo2 === entity1.id)
            );
            if (hasCrowfoot) {
              correctCount++;
            }
          }
        }
      }
      if (totalRequirements === 0) return 0;
      return Math.round(correctCount / totalRequirements * subQ.maxMarks);
    }
    if (subQ.acceptedAnswers) {
      for (const accepted of subQ.acceptedAnswers) {
        if (combinedAnswer === accepted.toLowerCase() || new RegExp(`\\b${accepted.toLowerCase()}\\b`).test(combinedAnswer)) {
          return subQ.maxMarks;
        }
      }
    }
    if (subQ.keywords) {
      let keywordsFound = 0;
      const usedKeywords = /* @__PURE__ */ new Set();
      for (const keyword of subQ.keywords) {
        if (combinedAnswer.includes(keyword.toLowerCase()) && !usedKeywords.has(keyword.toLowerCase())) {
          keywordsFound++;
          usedKeywords.add(keyword.toLowerCase());
        }
      }
      return Math.min(keywordsFound, subQ.maxMarks);
    }
    return 0;
  };
  const currentQuestion = examQuestions[currentQuestionIndex];
  if (isAdditionalExamMode && !studentLoggedIn) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-4 p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-12 h-12 text-amber-500 mx-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-neutral-900 dark:text-white", children: "Login Required" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-600 dark:text-neutral-400 max-w-md", children: "You need to be logged in to take mock exams. Your results will be saved to your account so your teacher can track your progress." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 justify-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => setLocation("/timed-mode"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
          " Back to Setup"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setLocation("/student/login"), children: "Log In" })
      ] })
    ] }) });
  }
  if (questionsLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg text-neutral-600 dark:text-neutral-400", children: "Loading exam questions..." })
    ] }) });
  }
  if (!currentQuestion) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-4 p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-12 h-12 text-amber-500 mx-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-neutral-900 dark:text-white", children: "No Questions Found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-600 dark:text-neutral-400 max-w-md", children: isQuizMode || isStudentQuizMode ? "There are no questions available for this quiz." : `There are no exam questions available for ${year} with the ${optionalSection === "dd" ? "Database Design" : "Web Development"} section.` }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => setLocation(isStudentQuizMode ? "/my-quizzes" : isQuizMode ? "/practice-quizzes" : "/timed-mode"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
        " Back to Setup"
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col h-screen", children: [
    isSubmitting && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "w-8 h-8 text-red-600 dark:text-red-400 animate-spin", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-neutral-900 dark:text-white mb-2", children: "Checking Your Answers" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-600 dark:text-neutral-400", children: "Please wait while we grade your exam..." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-4 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-300 ease-out",
            style: { width: gradingTotal > 0 ? `${gradingProgress / gradingTotal * 100}%` : "0%" }
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm text-neutral-600 dark:text-neutral-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Checking answer ",
            gradingProgress,
            " of ",
            gradingTotal
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
            gradingTotal > 0 ? Math.round(gradingProgress / gradingTotal * 100) : 0,
            "%"
          ] })
        ] })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex justify-between items-center z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: `text-lg px-3 py-1 ${isQuizMode ? "border-purple-500 text-purple-700 dark:text-purple-400" : isStudentQuizMode ? "border-blue-500 text-blue-700 dark:text-blue-400" : ""}`, children: isQuizMode || isStudentQuizMode ? quizName : `${year} Paper` }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl font-bold hidden md:block", children: [
          "Question ",
          currentQuestionIndex + 1,
          " of ",
          examQuestions.length
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-2 text-xl font-mono font-bold ${timeLeft < 300 ? "text-red-600 animate-pulse" : "text-neutral-700 dark:text-neutral-200"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5" }),
        formatTime(timeLeft),
        extraTimeAdded && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-green-600 dark:text-green-400 font-normal", children: [
          "+",
          extraTimeAdded
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ModeToggle, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", className: "text-neutral-500 hover:text-red-600", "data-testid": "btn-cancel-exam", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "mr-2 h-4 w-4" }),
            " Cancel"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Cancel Exam?" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "This will discard all your progress and answers. You will not receive a grade. Are you sure you want to cancel?" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Keep Working" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: handleCancelExam, className: "bg-red-600", children: "Cancel Exam" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: handlePauseExam, className: "border-neutral-300 dark:border-neutral-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePause, { className: "mr-2 h-4 w-4" }),
          " Pause & Save"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "default", className: "bg-red-600 hover:bg-red-700", children: "Submit Exam" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Finish Exam?" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
                "Are you sure you want to submit? You won't be able to change your answers. You have answered ",
                Object.keys(userInputs).length,
                " parts so far."
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Keep Working" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: handleSubmitExam, className: "bg-red-600", children: "Submit & Grade" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-hidden flex flex-col md:flex-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "w-full md:w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto p-4 hidden md:block", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-neutral-500 mb-4 text-sm uppercase tracking-wider", children: "Questions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-2", children: examQuestions.map((q, idx) => {
          const prevQuestion = idx > 0 ? examQuestions[idx - 1] : null;
          const isNewSection = !prevQuestion || prevQuestion.topic !== q.topic;
          const sectionLabel = q.topic === "sdcs" ? "Section 1: Software Design & Development" : q.topic === "dd" ? "Section 2: Database Design & Development" : q.topic === "wd" ? "Section 2: Web Design & Development" : q.topic === "cs" ? "Section 1: Computer Systems" : "Section";
          const hasAnswer = (input) => {
            return input && (input.main?.trim() || input.drawing?.trim() || Object.values(input).some((v) => v?.trim()));
          };
          const answerableParts = [];
          q.subQuestions.forEach((sub) => {
            if (sub.subParts && sub.subParts.length > 0) {
              sub.subParts.forEach((part) => {
                if (part.maxMarks > 0) answerableParts.push({ id: part.id });
              });
            } else if (sub.maxMarks > 0) {
              answerableParts.push({ id: sub.id });
            }
          });
          const answeredCount = answerableParts.filter((part) => hasAnswer(userInputs[part.id])).length;
          const totalParts = answerableParts.length;
          const isFullyAnswered = totalParts > 0 && answeredCount === totalParts;
          const isPartiallyAnswered = answeredCount > 0 && answeredCount < totalParts;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
            isNewSection && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-4 mt-3 mb-1 first:mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-xs font-bold uppercase tracking-wider px-2 py-1.5 rounded ${q.topic === "sdcs" || q.topic === "cs" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : q.topic === "dd" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"}`, children: sectionLabel }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setCurrentQuestionIndex(idx),
                className: `
                                    h-10 w-10 rounded-md flex items-center justify-center text-sm font-medium transition-colors relative overflow-hidden
                                    ${currentQuestionIndex === idx ? "bg-red-600 text-white" : isFullyAnswered ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border border-neutral-900 dark:border-white" : isPartiallyAnswered ? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-2 border-neutral-400 dark:border-neutral-500" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"}
                                `,
                title: totalParts > 0 ? `${answeredCount}/${totalParts} parts answered` : "No answerable parts",
                children: [
                  idx + 1,
                  isPartiallyAnswered && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 left-0 right-0 h-1 bg-amber-500 dark:bg-amber-400" })
                ]
              }
            )
          ] }, q.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 overflow-y-auto p-6 md:p-8 pb-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto space-y-8", children: [
        (() => {
          const prevQ = currentQuestionIndex > 0 ? examQuestions[currentQuestionIndex - 1] : null;
          const isFirstInSection = !prevQ || prevQ.topic !== currentQuestion.topic;
          if (!isFirstInSection) return null;
          const sLabel = currentQuestion.topic === "sdcs" ? "Section 1: Software Design & Development" : currentQuestion.topic === "dd" ? "Section 2: Database Design & Development" : currentQuestion.topic === "wd" ? "Section 2: Web Design & Development" : currentQuestion.topic === "cs" ? "Section 1: Computer Systems" : "";
          if (!sLabel) return null;
          const colorClass = currentQuestion.topic === "sdcs" || currentQuestion.topic === "cs" ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40" : currentQuestion.topic === "dd" ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/40" : "border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/40";
          const textColor = currentQuestion.topic === "sdcs" || currentQuestion.topic === "cs" ? "text-blue-800 dark:text-blue-200" : currentQuestion.topic === "dd" ? "text-green-800 dark:text-green-200" : "text-purple-800 dark:text-purple-200";
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `border-2 rounded-lg px-5 py-3 ${colorClass}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm font-bold uppercase tracking-wider ${textColor}`, children: sLabel }) });
        })(),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-between items-start", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3 mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${currentQuestion.year === 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`, children: currentQuestion.year === 0 ? "Practice" : currentQuestion.year }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-neutral-900 dark:text-white mb-2", children: currentQuestion.title }),
          currentQuestion.scenario && hasScenarioContent(currentQuestion.scenario) && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "mb-6 bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: currentQuestion.scenario.contentBlocks && currentQuestion.scenario.contentBlocks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: currentQuestion.scenario.contentBlocks.map((block) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            block.type === "text" && (block.hasBorder ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
              "border border-neutral-300 dark:border-neutral-600 rounded-lg p-4",
              block.borderWidth === "xs" && "max-w-[200px]",
              block.borderWidth === "sm" && "max-w-xs",
              (!block.borderWidth || block.borderWidth === "md") && "max-w-md",
              block.borderWidth === "lg" && "max-w-lg",
              block.borderWidth === "xl" && "max-w-xl",
              block.borderWidth === "full" && "w-full"
            ), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-neutral-700 dark:text-neutral-300 leading-relaxed", children: formatText(block.content) }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-neutral-700 dark:text-neutral-300 leading-relaxed", children: formatText(block.content) })),
            block.type === "image" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
              "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
              block.imageSize === "xs" && "max-w-[150px]",
              block.imageSize === "small" && "max-w-xs",
              block.imageSize === "medium" && "max-w-md",
              block.imageSize === "large" && "max-w-xl",
              block.imageSize === "xl" && "max-w-2xl",
              block.imageSize === "2xl" && "max-w-4xl",
              block.imageSize === "full" && "w-full",
              !block.imageSize && "max-w-md"
            ), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: block.content, alt: block.caption || "Scenario image", className: "max-w-full h-auto object-contain" }),
              block.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 dark:text-neutral-400 p-2", children: block.caption })
            ] }),
            block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "p-4 bg-neutral-900 text-neutral-50 rounded-lg overflow-x-auto font-mono text-sm border border-neutral-700", children: block.content }),
            block.type === "pseudocode" && block.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
            ] }, line.id || idx)) }) }),
            block.type === "code-table" && block.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: block.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-neutral-900 p-4 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0", children: section.code })
            ] }, section.id || sIdx)) }),
            block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono", children: block.dataTable.tableName }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: block.dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0", children: col.header }, col.id)) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-neutral-300 dark:border-neutral-700", children: row.cells.map((cell, cellIndex) => {
                  if (isCellHidden(cell)) return null;
                  const cellRole = getCellRole(cell);
                  const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                  const colSpan = getCellColSpan(cell);
                  const rowSpan = getCellRowSpan(cell);
                  return /* @__PURE__ */ jsxRuntimeExports.jsx(
                    CellTag,
                    {
                      colSpan: colSpan > 1 ? colSpan : void 0,
                      rowSpan: rowSpan > 1 ? rowSpan : void 0,
                      className: cn(
                        "px-4 py-2 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                        cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                        cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                      ),
                      children: getCellValue(cell)
                    },
                    cellIndex
                  );
                }) }, row.id)) })
              ] })
            ] }),
            block.type === "row-layout" && block.children && /* @__PURE__ */ jsxRuntimeExports.jsx(RowLayout, { children: block.children.map((childBlock) => /* @__PURE__ */ jsxRuntimeExports.jsxs(RowLayoutItem, { children: [
              childBlock.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-neutral-700 dark:text-neutral-300 leading-relaxed", children: formatText(childBlock.content) }),
              childBlock.type === "image" && childBlock.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: childBlock.content, alt: childBlock.caption || "", className: "max-w-full h-auto object-contain" }),
                childBlock.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 p-2", children: childBlock.caption })
              ] }),
              childBlock.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "p-4 bg-neutral-900 text-neutral-50 rounded-lg overflow-x-auto font-mono text-sm border border-neutral-700", children: childBlock.content }),
              childBlock.type === "pseudocode" && childBlock.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: childBlock.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
              ] }, line.id || idx)) }) }),
              childBlock.type === "data-table" && childBlock.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: [
                childBlock.dataTable.tableName && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-3 py-1.5 font-semibold text-sm border-b border-neutral-300 dark:border-neutral-600 font-mono", children: childBlock.dataTable.tableName }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "text-sm w-full", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: childBlock.dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-1.5 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0 text-xs", children: col.header }, col.id)) }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: childBlock.dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-neutral-300 dark:border-neutral-700", children: row.cells.map((cell, cellIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-1.5 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0 text-xs", children: getCellValue(cell) }, cellIndex)) }, row.id)) })
                ] })
              ] }),
              childBlock.type === "code-table" && childBlock.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: childBlock.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-3 py-2 font-semibold text-sm border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-900 text-neutral-100 p-3 text-sm font-mono overflow-x-auto", children: section.code })
              ] }, section.id || sIdx)) })
            ] }, childBlock.id)) })
          ] }, block.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            currentQuestion.scenario.text && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "leading-relaxed text-neutral-700 dark:text-neutral-300", children: formatText(currentQuestion.scenario.text) }),
            currentQuestion.scenario.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: currentQuestion.scenario.imageUrl, alt: "Scenario", className: "mt-4 rounded-lg max-w-full max-h-96 object-contain" }),
            currentQuestion.scenario.preCodeText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 text-neutral-700 dark:text-neutral-300 leading-relaxed", children: formatText(currentQuestion.scenario.preCodeText) }),
            currentQuestion.scenario.codeSnippet && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "mt-4 p-4 bg-neutral-900 text-neutral-50 rounded-lg overflow-x-auto font-mono text-sm border border-neutral-700", children: currentQuestion.scenario.codeSnippet }),
            currentQuestion.scenario.postImageText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 text-neutral-700 dark:text-neutral-300 leading-relaxed", children: formatText(currentQuestion.scenario.postImageText) })
          ] }) }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-8", children: currentQuestion.subQuestions.map((subQ) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 border-l-2 border-neutral-200 dark:border-neutral-800 pl-6 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 flex-1 w-full min-w-0", children: [
              subQ.label && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-neutral-900 dark:text-neutral-100", children: [
                subQ.label,
                "."
              ] }),
              subQ.contentBlocks && subQ.contentBlocks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 mt-2", children: subQ.contentBlocks.map((block) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                block.type === "text" && (block.hasBorder ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
                  "border border-neutral-300 dark:border-neutral-600 rounded-lg p-4",
                  block.borderWidth === "xs" && "max-w-[200px]",
                  block.borderWidth === "sm" && "max-w-xs",
                  (!block.borderWidth || block.borderWidth === "md") && "max-w-md",
                  block.borderWidth === "lg" && "max-w-lg",
                  block.borderWidth === "xl" && "max-w-xl",
                  block.borderWidth === "full" && "w-full"
                ), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap", children: formatText(block.content) }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap", children: formatText(block.content) })),
                block.type === "image" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
                  "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                  block.imageSize === "xs" && "max-w-[150px]",
                  block.imageSize === "small" && "max-w-xs",
                  block.imageSize === "medium" && "max-w-md",
                  block.imageSize === "large" && "max-w-xl",
                  block.imageSize === "xl" && "max-w-2xl",
                  block.imageSize === "2xl" && "max-w-4xl",
                  block.imageSize === "full" && "w-full",
                  !block.imageSize && "max-w-md"
                ), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: block.content, alt: block.caption || "Question image", className: "max-w-full h-auto object-contain" }),
                  block.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 dark:text-neutral-400 p-2", children: block.caption })
                ] }),
                block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-sm text-green-400 font-mono whitespace-pre-wrap", children: block.content }) }),
                block.type === "pseudocode" && block.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
                ] }, line.id || idx)) }) }),
                block.type === "code-table" && block.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: block.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-neutral-900 p-4 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0", children: section.code })
                ] }, section.id || sIdx)) }),
                block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono", children: block.dataTable.tableName }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: block.dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0", children: col.header }, col.id)) }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-neutral-300 dark:border-neutral-700", children: row.cells.map((cell, cellIndex) => {
                      if (isCellHidden(cell)) return null;
                      const cellRole = getCellRole(cell);
                      const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                      const colSpan = getCellColSpan(cell);
                      const rowSpan = getCellRowSpan(cell);
                      return /* @__PURE__ */ jsxRuntimeExports.jsx(
                        CellTag,
                        {
                          colSpan: colSpan > 1 ? colSpan : void 0,
                          rowSpan: rowSpan > 1 ? rowSpan : void 0,
                          className: cn(
                            "px-4 py-2 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                            cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                            cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                          ),
                          children: getCellValue(cell)
                        },
                        cellIndex
                      );
                    }) }, row.id)) })
                  ] })
                ] }),
                block.type === "row-layout" && block.children && /* @__PURE__ */ jsxRuntimeExports.jsx(RowLayout, { children: block.children.map((childBlock) => /* @__PURE__ */ jsxRuntimeExports.jsxs(RowLayoutItem, { children: [
                  childBlock.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-neutral-800 dark:text-neutral-200", children: formatText(childBlock.content) }),
                  childBlock.type === "image" && childBlock.content && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: childBlock.content, alt: childBlock.caption || "", className: "max-w-full h-auto object-contain" }) }),
                  childBlock.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "p-3 bg-neutral-900 text-neutral-50 rounded-lg overflow-x-auto font-mono text-sm", children: childBlock.content }),
                  childBlock.type === "pseudocode" && childBlock.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: childBlock.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
                  ] }, line.id || idx)) }) }),
                  childBlock.type === "data-table" && childBlock.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden text-sm", children: [
                    childBlock.dataTable.tableName && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-3 py-1 font-semibold font-mono", children: childBlock.dataTable.tableName }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: childBlock.dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-1 text-left font-semibold text-xs", children: col.header }, col.id)) }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: childBlock.dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t", children: row.cells.map((cell, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-1 text-xs", children: getCellValue(cell) }, idx)) }, row.id)) })
                    ] })
                  ] }),
                  childBlock.type === "code-table" && childBlock.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: childBlock.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-3 py-2 font-semibold text-sm border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-900 text-neutral-100 p-3 text-sm font-mono overflow-x-auto", children: section.code })
                  ] }, section.id || sIdx)) })
                ] }, childBlock.id)) })
              ] }, block.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                subQ.questionText && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap", children: formatText(subQ.questionText) }),
                subQ.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: subQ.imageUrl, alt: "Question Part", className: "rounded-lg max-w-full max-h-64 object-contain" }) }),
                subQ.preCodeText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap", children: formatText(subQ.preCodeText) }),
                subQ.codeSnippet && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 p-3 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-sm text-green-400 font-mono whitespace-pre-wrap", children: subQ.codeSnippet }) }),
                subQ.imageCaption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap", children: subQ.imageCaption })
              ] })
            ] }),
            subQ.maxMarks > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "shrink-0", children: [
              subQ.maxMarks,
              " ",
              subQ.maxMarks === 1 ? "mark" : "marks"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: renderInput(subQ, userInputs[subQ.id] || {}, (key, val) => updateInput(subQ.id, key, val), (e) => handleCodeKeyDown(e, subQ.id)) }),
          subQ.subParts && subQ.subParts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 ml-4 pl-4 border-l-2 border-neutral-300 dark:border-neutral-600 space-y-4", children: subQ.subParts.map((part) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-neutral-800 dark:text-neutral-200 text-sm", children: part.label }),
                part.contentBlocks && part.contentBlocks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 mt-1", children: part.contentBlocks.map((block) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  block.type === "text" && (block.hasBorder ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
                    "border border-neutral-300 dark:border-neutral-600 rounded-lg p-3",
                    block.borderWidth === "xs" && "max-w-[200px]",
                    block.borderWidth === "sm" && "max-w-xs",
                    (!block.borderWidth || block.borderWidth === "md") && "max-w-md",
                    block.borderWidth === "lg" && "max-w-lg",
                    block.borderWidth === "xl" && "max-w-xl",
                    block.borderWidth === "full" && "w-full"
                  ), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap text-sm", children: formatText(block.content) }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap text-sm", children: formatText(block.content) })),
                  block.type === "image" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
                    "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                    block.imageSize === "xs" && "max-w-[150px]",
                    block.imageSize === "small" && "max-w-xs",
                    block.imageSize === "medium" && "max-w-md",
                    block.imageSize === "large" && "max-w-xl",
                    block.imageSize === "xl" && "max-w-2xl",
                    block.imageSize === "2xl" && "max-w-4xl",
                    block.imageSize === "full" && "w-full",
                    !block.imageSize && "max-w-md"
                  ), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: block.content, alt: block.caption || "Question image", className: "max-w-full h-auto object-contain" }),
                    block.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 dark:text-neutral-400 p-2", children: block.caption })
                  ] }),
                  block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-xs text-green-400 font-mono whitespace-pre-wrap", children: block.content }) }),
                  block.type === "pseudocode" && block.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-3 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
                  ] }, line.id || idx)) }) }),
                  block.type === "code-table" && block.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden text-xs", children: block.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-3 py-1.5 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-neutral-900 p-3 font-mono text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0", children: section.code })
                  ] }, section.id || sIdx)) }),
                  block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden text-xs", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-3 py-1.5 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono", children: block.dataTable.tableName }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: block.dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-1.5 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0", children: col.header }, col.id)) }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-neutral-300 dark:border-neutral-700", children: row.cells.map((cell, cellIndex) => {
                        if (isCellHidden(cell)) return null;
                        const cellRole = getCellRole(cell);
                        const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                        const colSpan = getCellColSpan(cell);
                        const rowSpan = getCellRowSpan(cell);
                        return /* @__PURE__ */ jsxRuntimeExports.jsx(
                          CellTag,
                          {
                            colSpan: colSpan > 1 ? colSpan : void 0,
                            rowSpan: rowSpan > 1 ? rowSpan : void 0,
                            className: cn(
                              "px-3 py-1.5 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                              cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                              cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                            ),
                            children: getCellValue(cell)
                          },
                          cellIndex
                        );
                      }) }, row.id)) })
                    ] })
                  ] })
                ] }, block.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  part.questionText && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap text-sm", children: formatText(part.questionText) }),
                  part.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: part.imageUrl, alt: "Question Part", className: "rounded-lg max-w-full max-h-48 object-contain" }) }),
                  part.preCodeText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm", children: formatText(part.preCodeText) }),
                  part.codeSnippet && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 p-2 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-xs text-green-400 font-mono whitespace-pre-wrap", children: part.codeSnippet }) }),
                  part.imageCaption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap text-sm", children: part.imageCaption })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "shrink-0 text-xs", children: [
                part.maxMarks,
                " ",
                part.maxMarks === 1 ? "mark" : "marks"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: renderInput(part, userInputs[part.id] || {}, (key, val) => updateInput(part.id, key, val), (e) => handleCodeKeyDown(e, part.id)) })
          ] }, part.id)) })
        ] }, subQ.id)) })
      ] }, currentQuestion.id) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4 flex justify-between items-center md:hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          disabled: currentQuestionIndex === 0,
          onClick: () => setCurrentQuestionIndex((prev) => prev - 1),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            " Previous"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
        currentQuestionIndex + 1,
        " / ",
        examQuestions.length
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          disabled: currentQuestionIndex === examQuestions.length - 1,
          onClick: () => setCurrentQuestionIndex((prev) => prev + 1),
          children: [
            "Next ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "ml-2 h-4 w-4" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed bottom-8 right-8 hidden md:flex gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "secondary",
          size: "lg",
          disabled: currentQuestionIndex === 0,
          onClick: () => setCurrentQuestionIndex((prev) => prev - 1),
          className: "shadow-lg",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            " Previous"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "default",
          size: "lg",
          disabled: currentQuestionIndex === examQuestions.length - 1,
          onClick: () => setCurrentQuestionIndex((prev) => prev + 1),
          className: "shadow-lg bg-red-600 hover:bg-red-700",
          children: [
            "Next ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "ml-2 h-4 w-4" })
          ]
        }
      )
    ] })
  ] });
}
function renderInput(subQ, currentInput, onChange, onCodeKeyDown) {
  if (subQ.maxMarks === 0) return null;
  const getRequirementBadge = (req) => {
    if (req === "programming-language") {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900/50 w-fit mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CodeXml, { className: "w-4 h-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-wider", children: "Must Use: Programming Language" })
      ] });
    }
    if (req === "design-notation") {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900/50 w-fit mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FilePen, { className: "w-4 h-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-wider", children: "Must Use: Design Notation" })
      ] });
    }
    return null;
  };
  if (subQ.inputStyle === "code-editor") {
    const isProgrammingOnly = subQ.codeRequirement === "programming-language";
    const placeholderText = isProgrammingOnly ? "// Write your code here..." : "// Write your code or design notation here...";
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 mt-4", children: [
      getRequirementBadge(subQ.codeRequirement),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          placeholder: placeholderText,
          className: "min-h-[200px] text-base font-mono p-4 resize-y bg-neutral-900 text-neutral-100 border-neutral-800 focus:border-red-500",
          value: currentInput["main"] || "",
          onChange: (e) => onChange("main", e.target.value),
          onKeyDown: onCodeKeyDown
        }
      )
    ] });
  }
  if (subQ.inputStyle === "labeled-inputs" && subQ.inputConfig) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 mt-4 w-full", children: subQ.inputConfig.fields?.map((field, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-neutral-700 dark:text-neutral-300 shrink-0 whitespace-nowrap", children: field.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          value: currentInput[field.key] || "",
          onChange: (e) => onChange(field.key, e.target.value),
          className: "flex-1 min-w-0 bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm"
        }
      )
    ] }, i)) });
  }
  if (subQ.inputStyle === "design-choice") {
    const activeMode = currentInput["design_mode"] || "pseudocode";
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "radio",
              name: `mode-${subQ.id}`,
              checked: activeMode === "pseudocode",
              onChange: () => onChange("design_mode", "pseudocode"),
              className: "w-4 h-4 text-red-600"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Pseudocode" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "radio",
              name: `mode-${subQ.id}`,
              checked: activeMode === "diagram",
              onChange: () => onChange("design_mode", "diagram"),
              className: "w-4 h-4 text-red-600"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Structure Diagram" })
        ] })
      ] }),
      activeMode === "pseudocode" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          placeholder: "Write your SQL code here...",
          className: "min-h-[200px] text-base font-mono p-4 bg-neutral-900 text-neutral-100 border-neutral-800",
          value: currentInput["main"] || "",
          onChange: (e) => onChange("main", e.target.value),
          onKeyDown: (e) => handleTabKey(e, onChange)
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        DiagramImageInput,
        {
          value: currentInput["diagram_image"] || "",
          onChange: (val) => onChange("diagram_image", val),
          startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
          hint: DIAGRAM_HINTS["drawing"]
        }
      )
    ] });
  }
  if (subQ.inputStyle === "drawing") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      DiagramImageInput,
      {
        value: currentInput["diagram_image"] || "",
        onChange: (val) => onChange("diagram_image", val),
        startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
        hint: DIAGRAM_HINTS["drawing"]
      }
    );
  }
  if (subQ.inputStyle === "erd-annotation") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      DiagramImageInput,
      {
        value: currentInput["diagram_image"] || "",
        onChange: (val) => onChange("diagram_image", val),
        startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
        hint: DIAGRAM_HINTS["erd-annotation"]
      }
    );
  }
  if (subQ.inputStyle === "nav-structure") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      DiagramImageInput,
      {
        value: currentInput["diagram_image"] || "",
        onChange: (val) => onChange("diagram_image", val),
        startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
        hint: DIAGRAM_HINTS["nav-structure"]
      }
    );
  }
  if (subQ.inputStyle === "nav-structure-higher") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      DiagramImageInput,
      {
        value: currentInput["diagram_image"] || "",
        onChange: (val) => onChange("diagram_image", val),
        startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
        hint: DIAGRAM_HINTS["nav-structure-higher"]
      }
    );
  }
  if (subQ.inputStyle === "structure-dataflow") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      DiagramImageInput,
      {
        value: currentInput["diagram_image"] || "",
        onChange: (val) => onChange("diagram_image", val),
        startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
        hint: DIAGRAM_HINTS["structure-dataflow"]
      }
    );
  }
  if (subQ.inputStyle === "form-wireframe") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      DiagramImageInput,
      {
        value: currentInput["diagram_image"] || "",
        onChange: (val) => onChange("diagram_image", val),
        startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
        hint: DIAGRAM_HINTS["form-wireframe"]
      }
    );
  }
  if (subQ.inputStyle === "webpage-wireframe") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      DiagramImageInput,
      {
        value: currentInput["diagram_image"] || "",
        onChange: (val) => onChange("diagram_image", val),
        startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
        hint: DIAGRAM_HINTS["form-wireframe"]
      }
    );
  }
  if (subQ.inputStyle === "table" && subQ.inputConfig) {
    if (subQ.inputConfig.grid) {
      const grid = subQ.inputConfig.grid;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: grid.headers.map((header, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-medium", children: header }, i)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-neutral-200 dark:divide-neutral-700", children: grid.rows.map((row, rowIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-white dark:bg-neutral-900", children: row.cells.map((cell, cellIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", style: { verticalAlign: cell.multiline ? "top" : void 0 }, children: cell.isInput ? cell.multiline ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            placeholder: cell.placeholder || "Enter answer...",
            value: currentInput[cell.key || `cell_${rowIdx}_${cellIdx}`] || "",
            onChange: (e) => onChange(cell.key || `cell_${rowIdx}_${cellIdx}`, e.target.value),
            className: "min-h-[100px] bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm resize-y",
            style: cell.width && cell.width !== "auto" ? { width: cell.width } : void 0
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: cell.placeholder || "Enter answer...",
            value: currentInput[cell.key || `cell_${rowIdx}_${cellIdx}`] || "",
            onChange: (e) => onChange(cell.key || `cell_${rowIdx}_${cellIdx}`, e.target.value),
            className: "bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm",
            style: cell.width && cell.width !== "auto" ? { width: cell.width } : void 0
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-700 dark:text-neutral-300", children: cell.value || "" }) }, cellIdx)) }, rowIdx)) })
      ] }) });
    }
    if (subQ.inputConfig.columns) {
      const numRows = subQ.inputConfig.inputRows || 1;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: subQ.inputConfig.columns.map((col, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-medium", style: col.width ? { width: col.width } : void 0, children: col.header }, i)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-neutral-200 dark:divide-neutral-700", children: Array.from({ length: numRows }).map((_, rowIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-white dark:bg-neutral-900", children: subQ.inputConfig.columns.map((col, colIdx) => {
          const key = numRows > 1 ? `${col.key}_${rowIdx + 1}` : col.key;
          return /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: `Enter ${col.header.toLowerCase()}...`,
              value: currentInput[key] || "",
              onChange: (e) => onChange(key, e.target.value),
              className: "bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm"
            }
          ) }, colIdx);
        }) }, rowIdx)) })
      ] }) });
    }
    if (subQ.inputConfig.rows) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid w-full", style: { gridTemplateColumns: "max-content 1fr" }, children: subQ.inputConfig.rows.map((row, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 whitespace-nowrap border-b border-neutral-200 dark:border-neutral-700 flex items-center", children: row.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 flex items-center", children: row.isInput ? row.multiline ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            placeholder: "Enter answer...",
            value: currentInput[row.key] || "",
            onChange: (e) => onChange(row.key, e.target.value),
            className: "w-full min-h-[100px] bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm resize-y"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: "Enter answer...",
            value: currentInput[row.key] || "",
            onChange: (e) => onChange(row.key, e.target.value),
            className: "w-full bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-700 dark:text-neutral-300", children: row.value || "" }) })
      ] }, i)) }) });
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Textarea,
    {
      placeholder: "Type your answer here...",
      className: "min-h-[100px]",
      value: currentInput["main"] || "",
      onChange: (e) => onChange("main", e.target.value),
      onKeyDown: onCodeKeyDown
    }
  );
}
export {
  TimedExam as default
};
//# sourceMappingURL=TimedExam-B1RJCXzV.js.map
