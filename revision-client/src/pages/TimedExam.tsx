import { useState, useEffect, useRef, ReactNode, Fragment } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuestions } from "@/lib/QuestionContext";
import { Question, SubQuestion, ContentBlock, DataTableCell, DataTableCellRole } from "@/lib/past-papers";

// Helper functions for DataTable cells (handles both string and object cells)
const getCellValue = (cell: string | DataTableCell): string => {
  return typeof cell === "string" ? cell : cell.value;
};

const getCellRole = (cell: string | DataTableCell): DataTableCellRole => {
  return typeof cell === "string" ? "data" : (cell.role || "data");
};

const getCellColSpan = (cell: string | DataTableCell): number => {
  return typeof cell === "string" ? 1 : (cell.colSpan || 1);
};

const getCellRowSpan = (cell: string | DataTableCell): number => {
  return typeof cell === "string" ? 1 : (cell.rowSpan || 1);
};

const isCellHidden = (cell: string | DataTableCell): boolean => {
  return typeof cell === "string" ? false : (cell.hidden || false);
};
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DiagramEditor, DiagramItem } from "@/components/ui/diagram-editor";
import { RowLayout, RowLayoutItem } from "@/components/ui/row-layout";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Clock, AlertTriangle, CheckCircle2, Code2, FileEdit, PauseCircle, Upload, X, FileText, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/mode-toggle";

// Helper function to format inline text with **bold**, *italic*, and `code` (monospace)
function formatInlineText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let key = 0;
  
  const combinedRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    const fullMatch = match[0];
    
    if (fullMatch.startsWith('**') && fullMatch.endsWith('**')) {
      parts.push(<strong key={key++}>{fullMatch.slice(2, -2)}</strong>);
    } else if (fullMatch.startsWith('`') && fullMatch.endsWith('`')) {
      parts.push(<code key={key++} className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono text-sm">{fullMatch.slice(1, -1)}</code>);
    } else if (fullMatch.startsWith('*') && fullMatch.endsWith('*')) {
      parts.push(<em key={key++}>{fullMatch.slice(1, -1)}</em>);
    }
    
    lastIndex = match.index + fullMatch.length;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
}

// Helper function to format text with paragraphs, bullet points (with nesting), **bold**, *italic*, and `code`
function formatText(text: string): ReactNode {
  let keyCounter = 0;
  
  const lines = text.split('\n');
  const elements: ReactNode[] = [];
  let currentBulletItems: { content: string; isNumbered: boolean; level: number }[] = [];
  let currentParagraphLines: string[] = [];
  
  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const paragraphText = currentParagraphLines.join('\n');
      elements.push(
        <p key={keyCounter++} className="mb-5">
          {formatInlineText(paragraphText)}
        </p>
      );
      currentParagraphLines = [];
    }
  };
  
  const renderNestedList = (items: { content: string; isNumbered: boolean; level: number }[]): ReactNode => {
    if (items.length === 0) return null;
    
    const result: ReactNode[] = [];
    let i = 0;
    
    while (i < items.length) {
      const item = items[i];
      const currentLevel = item.level;
      
      const nestedItems: { content: string; isNumbered: boolean; level: number }[] = [];
      let j = i + 1;
      while (j < items.length && items[j].level > currentLevel) {
        nestedItems.push(items[j]);
        j++;
      }
      
      result.push(
        <li key={i} className="pl-1">
          {formatInlineText(item.content)}
          {nestedItems.length > 0 && renderNestedList(nestedItems)}
        </li>
      );
      
      i = j;
    }
    
    const isNumbered = items[0].isNumbered;
    const ListTag = isNumbered ? 'ol' : 'ul';
    const listStyle = items[0].level === 0 
      ? `mb-4 ml-5 space-y-1 ${isNumbered ? 'list-decimal' : 'list-disc'}`
      : `mt-1 ml-5 space-y-1 ${isNumbered ? 'list-decimal' : 'list-disc'}`;
    
    return <ListTag key={keyCounter++} className={listStyle}>{result}</ListTag>;
  };
  
  const flushBulletList = () => {
    if (currentBulletItems.length > 0) {
      elements.push(renderNestedList(currentBulletItems));
      currentBulletItems = [];
    }
  };
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    const leadingSpaces = line.match(/^(\s*)/)?.[1] || '';
    const level = Math.floor(leadingSpaces.replace(/\t/g, '  ').length / 2);
    
    const bulletMatch = trimmedLine.match(/^[-•]\s+(.+)$/);
    const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);
    
    if (bulletMatch) {
      flushParagraph();
      currentBulletItems.push({ content: bulletMatch[1], isNumbered: false, level });
    } else if (numberedMatch) {
      flushParagraph();
      currentBulletItems.push({ content: numberedMatch[2], isNumbered: true, level });
    } else if (trimmedLine === '') {
      flushBulletList();
      flushParagraph();
    } else {
      flushBulletList();
      currentParagraphLines.push(line);
    }
  }
  
  flushBulletList();
  flushParagraph();
  
  if (elements.length === 1) {
    return elements[0];
  }
  
  return <div className="space-y-1">{elements}</div>;
}

// Helper function to check if a scenario has any actual content
function hasScenarioContent(scenario: Question["scenario"]): boolean {
  if (!scenario) return false;
  
  // Check new content blocks approach
  if (scenario.contentBlocks && scenario.contentBlocks.length > 0) {
    return scenario.contentBlocks.some(block => block.content && block.content.trim());
  }
  
  // Check legacy fields
  return !!(
    (scenario.text && scenario.text.trim()) ||
    scenario.imageUrl ||
    scenario.codeSnippet ||
    scenario.preCodeText ||
    scenario.postImageText
  );
}

interface StudentQuizData {
  id: string;
  name: string;
  questions: Question[];
  timeLimit: number;
}

export default function TimedExam() {
  const [match, params] = useRoute("/timed-exam/:year/:optionalSection");
  const [additionalMatch, additionalParams] = useRoute("/timed-exam/additional/:examId");
  const [, setLocation] = useLocation();
  const { questions, loading: questionsLoading } = useQuestions();
  const { toast } = useToast();
  
  const isAdditionalExam = !!additionalMatch;
  const additionalExamId = additionalParams?.examId || "";
  const [additionalExamTitle, setAdditionalExamTitle] = useState("");
  
  const year = isAdditionalExam ? 0 : parseInt(params?.year || "0");
  const optionalSection = isAdditionalExam ? undefined : (params?.optionalSection as "dd" | "wd" | undefined);
  
  const isStudentQuiz = !isAdditionalExam && (optionalSection?.startsWith("student-quiz") || params?.year === "student-quiz");
  const studentQuizId = isStudentQuiz ? (params?.optionalSection || "") : "";
  
  const [studentQuizData, setStudentQuizData] = useState<StudentQuizData | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 2 hours in seconds
  const [extraTimeAdded, setExtraTimeAdded] = useState<string | null>(null); // Track which extra time option was used
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({}); // questionId -> subQuestionId -> answer
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isStudentQuiz) {
      const stored = localStorage.getItem("student_current_quiz");
      if (stored) {
        try {
          const data = JSON.parse(stored) as StudentQuizData;
          if (studentQuizId && data.id !== studentQuizId && !studentQuizId.startsWith("random-")) {
            toast({ title: "Quiz mismatch - loading from My Quizzes", variant: "destructive" });
            setLocation("/my-quizzes");
            return;
          }
          setStudentQuizData(data);
          setExamQuestions(data.questions);
          setTimeLeft(data.timeLimit * 60);
        } catch (e) {
          console.error("Failed to load student quiz:", e);
          toast({ title: "Failed to load quiz", variant: "destructive" });
          setLocation("/my-quizzes");
        }
      } else {
        toast({ title: "Quiz not found", variant: "destructive" });
        setLocation("/my-quizzes");
      }
    } else if (isAdditionalExam && additionalExamId) {
      (async () => {
        try {
          const [examRes, qRes] = await Promise.all([
            fetch(`/api/additional-exams/${additionalExamId}`),
            fetch(`/api/additional-exams/${additionalExamId}/questions`)
          ]);
          if (!examRes.ok) throw new Error("Exam not found");
          const examData = await examRes.json();
          const qs = await qRes.json();
          setAdditionalExamTitle(examData.title);
          const sorted = qs.sort((a: any, b: any) => {
            const numA = parseInt(a.title.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.title.replace(/\D/g, '')) || 0;
            return numA - numB;
          });
          if (sorted.length > 0) {
            setExamQuestions(sorted);
            const totalMarks = sorted.reduce((sum: number, q: any) => {
              let total = 0;
              for (const sq of (q.subQuestions || [])) {
                if (sq.subParts && sq.subParts.length > 0) {
                  for (const part of sq.subParts) total += part.maxMarks || 0;
                } else {
                  total += sq.maxMarks || 0;
                }
              }
              return sum + total;
            }, 0);
            const calculatedTime = Math.ceil(totalMarks * 1.125);
            setTimeLeft(calculatedTime * 60);
          } else {
            toast({ title: "No questions found for this exam", variant: "destructive" });
            setLocation("/timed-mode");
          }
        } catch {
          toast({ title: "Failed to load exam", variant: "destructive" });
          setLocation("/timed-mode");
        }
      })();
    } else if (year) {
      const filtered = questions.filter(q => {
        if (q.isPractice) return false;
        if (q.isAdditionalExam) return false;
        if (q.year !== year) return false;
        if (q.topic === "sdcs") return true;
        if (optionalSection && q.topic === optionalSection) return true;
        return false;
      }).sort((a, b) => {
        const numA = parseInt(a.title.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.title.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
      setExamQuestions(filtered);
    }
  }, [year, questions, optionalSection, isStudentQuiz, isAdditionalExam, additionalExamId]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isResuming = urlParams.get("resume") === "true";
    const extraTimeParam = urlParams.get("extraTime");

    if (isResuming) {
        const studentToken = localStorage.getItem("student_token");
        const examType = isAdditionalExam ? "additional-exam" : (isStudentQuiz ? "quiz" : "past-paper");
        const examId = isAdditionalExam ? additionalExamId : (isStudentQuiz ? studentQuizId : String(year));

        const restoreFromLocal = () => {
            if (isStudentQuiz) {
                const saved = localStorage.getItem("paused_student_quiz");
                if (saved) {
                    try {
                        const data = JSON.parse(saved);
                        if (data.quizId === studentQuizId || (studentQuizData && data.quizId === studentQuizData.id)) {
                            setTimeLeft(data.timeLeft);
                            setUserInputs(data.userInputs || {});
                            setCurrentQuestionIndex(data.currentQuestionIndex || 0);
                            toast({ title: "Quiz Resumed", description: "Welcome back! Your progress has been restored." });
                            localStorage.removeItem("paused_student_quiz");
                        }
                    } catch (e) { console.error("Failed to resume student quiz", e); }
                }
            } else {
                const saved = localStorage.getItem("paused_exam");
                if (saved) {
                    try {
                        const data = JSON.parse(saved);
                        if (data.year === year && data.optionalSection === optionalSection) {
                            setTimeLeft(data.timeLeft);
                            setUserInputs(data.userInputs);
                            setCurrentQuestionIndex(data.currentQuestionIndex);
                            if (data.extraTimeAdded) setExtraTimeAdded(data.extraTimeAdded);
                            toast({ title: "Exam Resumed", description: "Welcome back! Your progress has been restored." });
                        }
                    } catch (e) { console.error("Failed to resume exam", e); }
                }
            }
        };

        if (studentToken) {
            fetch("/api/student/exam-progress?examType=" + encodeURIComponent(examType) + "&examIdentifier=" + encodeURIComponent(examId), {
                headers: { Authorization: "Bearer " + studentToken },
            })
            .then(r => r.ok ? r.json() : null)
            .then(serverData => {
                if (serverData && serverData.currentAnswers) {
                    setTimeLeft(serverData.timeLeft ?? serverData.timeLeft);
                    setUserInputs(serverData.currentAnswers || {});
                    setCurrentQuestionIndex(serverData.currentQuestionIndex ?? 0);
                    if (serverData.extraTimeAdded) setExtraTimeAdded(serverData.extraTimeAdded);
                    toast({ title: "Exam Resumed", description: "Welcome back! Your progress has been restored from the server." });
                    if (isStudentQuiz) localStorage.removeItem("paused_student_quiz");
                } else {
                    restoreFromLocal();
                }
            })
            .catch(() => restoreFromLocal());
        } else {
            restoreFromLocal();
        }
    } else if (extraTimeParam && extraTimeParam !== "0" && !isStudentQuiz && !isAdditionalExam) {
        const baseTime = 120 * 60;
        const percentage = parseInt(extraTimeParam);
        if ([25, 33, 50].includes(percentage)) {
            const extraSeconds = Math.round((baseTime * percentage) / 100);
            setTimeLeft(baseTime + extraSeconds);
            setExtraTimeAdded(percentage + "%");
        }
    } else if (extraTimeParam && extraTimeParam !== "0" && isAdditionalExam) {
        const percentage = parseInt(extraTimeParam);
        if ([25, 33, 50].includes(percentage)) {
            setExtraTimeAdded(percentage + "%");
        }
    }
  }, [isStudentQuiz, studentQuizData, isAdditionalExam]);

  const handlePauseExam = () => {
    const studentToken = localStorage.getItem("student_token");
    if (isStudentQuiz && studentQuizData) {
        const state = {
            quizId: studentQuizData.id,
            quizName: studentQuizData.name,
            timeLeft,
            userInputs,
            currentQuestionIndex,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem("paused_student_quiz", JSON.stringify(state));
        if (studentToken) {
            fetch("/api/student/exam-progress", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + studentToken },
                body: JSON.stringify({
                    examType: "quiz",
                    examIdentifier: studentQuizId,
                    examTitle: studentQuizData.name,
                    totalQuestions: examQuestions.length,
                    answeredQuestions: Object.keys(answers).length,
                    currentAnswers: userInputs,
                    timeLeft,
                    currentQuestionIndex,
                    status: "in_progress",
                }),
            }).catch(() => {});
        }
        toast({
            title: "Quiz Paused",
            description: "Your progress has been saved. You can resume later from My Quizzes.",
        });
        setLocation("/my-quizzes");
    } else {
        const state = {
            year,
            optionalSection,
            isAdditionalExam,
            additionalExamTitle: isAdditionalExam ? additionalExamTitle : undefined,
            timeLeft,
            userInputs,
            currentQuestionIndex,
            extraTimeAdded,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem("paused_exam", JSON.stringify(state));
        const examType = isAdditionalExam ? "additional-exam" : "past-paper";
        const examId = isAdditionalExam ? additionalExamId : String(year);
        const title = isAdditionalExam ? additionalExamTitle : String(year) + " Past Paper";
        if (studentToken) {
            fetch("/api/student/exam-progress", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + studentToken },
                body: JSON.stringify({
                    examType,
                    examIdentifier: examId,
                    examTitle: title,
                    totalQuestions: examQuestions.length,
                    answeredQuestions: Object.keys(answers).length,
                    currentAnswers: userInputs,
                    timeLeft,
                    currentQuestionIndex,
                    extraTimeAdded: extraTimeAdded || null,
                    status: "in_progress",
                }),
            }).catch(() => {});
        }
        toast({
            title: "Exam Paused",
            description: "Your progress has been saved. You can resume later from the Timed Exam menu.",
        });
        setLocation("/timed-mode");
    }
  };

  const handleCancelExam = () => {
    const studentToken = localStorage.getItem("student_token");
    if (isStudentQuiz) {
      localStorage.removeItem("paused_student_quiz");
      if (studentToken) {
        fetch("/api/student/exam-progress", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + studentToken },
          body: JSON.stringify({ examType: "quiz", examIdentifier: studentQuizId }),
        }).catch(() => {});
      }
      toast({ title: "Quiz Cancelled", description: "Your answers have been discarded." });
      setLocation("/my-quizzes");
    } else {
      localStorage.removeItem("paused_exam");
      const examType = isAdditionalExam ? "additional-exam" : "past-paper";
      const examId = isAdditionalExam ? additionalExamId : String(year);
      if (studentToken) {
        fetch("/api/student/exam-progress", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + studentToken },
          body: JSON.stringify({ examType, examIdentifier: examId }),
        }).catch(() => {});
      }
      toast({ title: "Exam Cancelled", description: "Your answers have been discarded." });
      setLocation("/timed-mode");
    }
  };

  const handleSubmitExamRef = useRef<() => void>(() => {});

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExamRef.current(); // Auto submit using ref
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const studentToken = localStorage.getItem("student_token");
    if (!studentToken || examQuestions.length === 0) return;

    const examType = isAdditionalExam ? "additional-exam" : (isStudentQuiz ? "quiz" : "past-paper");
    const examId = isAdditionalExam ? additionalExamId : (isStudentQuiz ? studentQuizId : String(year));
    const title = isAdditionalExam ? additionalExamTitle : (isStudentQuiz && studentQuizData ? studentQuizData.name : String(year) + " Past Paper");

    const syncProgress = () => {
      const answeredCount = Object.keys(answers).length;
      const answeredQuestionIds = examQuestions
        .filter((q) => {
          return q.subQuestions.some(sub => {
            const input = userInputs[sub.id];
            return input && (input.main || input.drawing);
          });
        })
        .map(q => ({ id: q.id, label: q.title }));
      fetch("/api/student/exam-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + studentToken },
        body: JSON.stringify({
          examType,
          examIdentifier: examId,
          examTitle: title,
          totalQuestions: examQuestions.length,
          answeredQuestions: answeredCount,
          answeredQuestionIds,
          currentAnswers: userInputs,
          timeLeft,
          currentQuestionIndex,
          extraTimeAdded: extraTimeAdded || null,
        }),
      }).catch(() => {});
    };

    const interval = setInterval(syncProgress, 60000);
    return () => clearInterval(interval);
  }, [examQuestions.length, isAdditionalExam, isStudentQuiz, additionalExamId, studentQuizId, year, additionalExamTitle, studentQuizData]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Refactored answer state handling
  const [userInputs, setUserInputs] = useState<Record<string, Record<string, string>>>({});

  const updateInput = (subId: string, key: string, value: string) => {
    setUserInputs(prev => ({
      ...prev,
      [subId]: {
        ...(prev[subId] || {}),
        [key]: value
      }
    }));
  };

  const makePasteHandler = (subQ: SubQuestion) => (e: React.ClipboardEvent) => {
    if (!subQ.allowFileUpload) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const ext = file.type.split("/")[1] || "png";
        const namedFile = new File([file], `pasted_image_${Date.now()}.${ext}`, { type: file.type });
        const formData = new FormData();
        formData.append("file", namedFile);
        fetch("/api/upload-student-file", { method: "POST", body: formData })
          .then(res => res.ok ? res.json() : Promise.reject())
          .then(result => {
            const currentInput = userInputs[subQ.id] || {};
            const existing: { url: string; name: string }[] = currentInput["uploaded_files"]
              ? (() => { try { return JSON.parse(currentInput["uploaded_files"]); } catch { return []; } })()
              : [];
            existing.push({ url: result.url, name: result.originalName });
            updateInput(subQ.id, "uploaded_files", JSON.stringify(existing));
          })
          .catch(() => {});
        break;
      }
    }
  };

  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    
    // Calculate results using AI - parallel grading for speed
    let totalScore = 0;
    let maxScore = 0;
    const breakdown: any[] = [];

    // Helper function to prepare student answer
    const prepareStudentAnswer = (sub: SubQuestion, inputs: Record<string, string>): string => {
      if (sub.inputStyle === "design-choice") {
        const mode = inputs["design_mode"] || "pseudocode";
        if (mode === "pseudocode") {
          return inputs["main"] || "";
        } else if (mode === "diagram" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
            const textContents = items
              .filter(i => i.content)
              .sort((a, b) => {
                if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
                return a.x - b.x;
              })
              .map(i => {
                if (i.type === "bullet-text" && i.content) {
                  const bulletPoints = i.content.split("\n").filter(line => line.trim());
                  return '[BULLET_LIST: ' + bulletPoints.length + ' bullet points: ' + bulletPoints.map((p, idx) => (idx + 1) + '. "' + p + '"').join(', ') + ']';
                }
                if (i.type === "numbered-text" && i.content) {
                  const numberedItems = i.content.split("\n").filter(line => line.trim());
                  return '[NUMBERED_LIST: ' + numberedItems.length + ' numbered items: ' + numberedItems.map((p, idx) => (idx + 1) + '. "' + p + '"').join(', ') + ']';
                }
                return i.content || "";
              });
            return textContents.join(" ");
          } catch (e) {
            return "";
          }
        }
      } else if (sub.inputStyle === "drawing" && inputs["drawing"]) {
        try {
          const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
          const shapes = items.filter(i => i.type !== "line" && i.type !== "crowfoot");
          const connections = items.filter(i => i.type === "line" || i.type === "crowfoot");
          const sortedShapes = shapes.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
            return a.x - b.x;
          });
          const parts: string[] = [];
          for (const i of sortedShapes) {
            const baseMarker = i.isBaseItem ? " [base]" : "";
            const formatting: string[] = [];
            if (i.isBold) formatting.push("bold");
            if (i.isUnderline || i.type === "link-text") formatting.push("underlined");
            if (i.fontSize && i.fontSize !== "normal") formatting.push(`size-${i.fontSize}`);
            const formatStr = formatting.length > 0 ? ` (${formatting.join(", ")})` : "";
            const posStr = `at approx (${Math.round(i.x)}, ${Math.round(i.y)}), size: ${Math.round(i.width || 100)}x${Math.round(i.height || 40)}`;
            const typeName = i.type?.toUpperCase() || "SHAPE";
            if (i.type === "bullet-text" && i.content) {
              const bulletPoints = i.content.split("\n").filter(line => line.trim());
              parts.push('[BULLET_LIST ' + posStr + ': ' + bulletPoints.length + ' bullet points: ' + bulletPoints.map((p, idx) => (idx + 1) + '. "' + p + '"').join(', ') + formatStr + baseMarker + ']');
            } else if (i.type === "numbered-text" && i.content) {
              const numberedItems = i.content.split("\n").filter(line => line.trim());
              parts.push('[NUMBERED_LIST ' + posStr + ': ' + numberedItems.length + ' numbered items: ' + numberedItems.map((p, idx) => (idx + 1) + '. "' + p + '"').join(', ') + formatStr + baseMarker + ']');
            } else {
              parts.push('[' + typeName + ' ' + posStr + ': "' + (i.content || "(no label)") + '"' + formatStr + baseMarker + ']');
            }
          }
          for (const c of connections) {
            const baseMarker = c.isBaseItem ? " [base]" : "";
            const fromItem = items.find(it => it.id === c.connectedTo1);
            const toItem = items.find(it => it.id === c.connectedTo2);
            const fromName = fromItem?.content || "unknown";
            const toName = toItem?.content || "unknown";
            const arrowDesc = c.type === "crowfoot" ? "crowfoot" : (c.arrowEnd ? "arrow-end" : "no-arrow");
            parts.push('[LINE from "' + fromName + '" to "' + toName + '", ' + arrowDesc + baseMarker + ']');
          }
          return parts.join("\n");
        } catch (e) {
          return "";
        }
      }
      
      // Handle table inputs - include the row labels with answers
      if (sub.inputStyle === "table" && sub.inputConfig) {
        // Handle grid-based table
        if (sub.inputConfig.grid) {
          const grid = sub.inputConfig.grid;
          const gridAnswers: string[] = [];
          grid.rows.forEach((row: { cells: Array<{ key?: string; value?: string; isInput?: boolean }> }, rowIdx: number) => {
            row.cells.forEach((cell: { key?: string; value?: string; isInput?: boolean }, cellIdx: number) => {
              if (cell.isInput) {
                const key = cell.key || `cell_${rowIdx}_${cellIdx}`;
                const header = grid.headers[cellIdx] || `Column ${cellIdx + 1}`;
                gridAnswers.push(`${header}: ${inputs[key] || "(no answer)"}`);
              }
            });
          });
          return gridAnswers.join("\n");
        }
        
        // Handle column-based table
        if (sub.inputConfig.columns) {
          const numRows = sub.inputConfig.inputRows || 1;
          const columnAnswers: string[] = [];
          for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
            const rowAnswers = sub.inputConfig.columns.map((col: { key: string; header: string }) => {
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
        
        // Handle row-based table
        if (sub.inputConfig.rows) {
          const tableAnswers = sub.inputConfig.rows
            .filter((row: { isInput?: boolean; key?: string }) => row.isInput && row.key)
            .map((row: { key?: string; label: string }) => `${row.label}: ${inputs[row.key!] || "(no answer)"}`)
            .join("\n");
          return tableAnswers;
        }
      }
      
      // Handle labeled inputs - include field labels with answers
      if (sub.inputStyle === "labeled-inputs" && sub.inputConfig?.fields) {
        const fieldAnswers = sub.inputConfig.fields
          .map(field => `${field.label}: ${inputs[field.key] || "(no answer)"}`)
          .join("\n");
        return fieldAnswers;
      }
      
      // Handle ERD annotation - describe student's full work
      if (sub.inputStyle === "erd-annotation") {
        const config = sub.inputConfig;
        const descriptions: string[] = [];
        
        // Parse student's diagram
        let studentItems: DiagramItem[] = [];
        if (inputs["erd_diagram"]) {
          try {
            studentItems = JSON.parse(inputs["erd_diagram"]) as DiagramItem[];
          } catch (e) {
            console.error("Failed to parse student ERD diagram", e);
          }
        }
        
        // Describe PK/FK markings on existing attributes (legacy shapes)
        if (config?.erdAttributes) {
          descriptions.push("Attribute Markings:");
          for (const attr of config.erdAttributes) {
            const studentItem = studentItems.find(item => item.id === attr.id);
            const marking = studentItem?.marking || "none";
            const markingLabel = marking === "primary" ? "Primary Key (PK)" : marking === "foreign" ? "Foreign Key (FK)" : "None";
            descriptions.push(`  ${attr.entityName}.${attr.attributeName}: ${markingLabel}`);
          }
        }
        
        // Describe ERD Entity items (new entity boxes with attributes)
        const erdEntities = studentItems.filter(item => item.type === "erd-entity");
        if (erdEntities.length > 0) {
          descriptions.push("ERD Entities:");
          for (const entity of erdEntities) {
            const entityName = entity.entityName || "Unnamed Entity";
            const isStudentAdded = !entity.isBaseItem;
            descriptions.push(`  Entity: ${entityName}${isStudentAdded ? " (student added)" : ""}`);
            if (entity.attributes && entity.attributes.length > 0) {
              for (const attr of entity.attributes) {
                const markingLabel = attr.marking === "primary" ? " [PK - underlined]" : 
                                    attr.marking === "foreign" ? " [FK - asterisk]" : "";
                descriptions.push(`    - ${attr.name || "unnamed"}${markingLabel}`);
              }
            }
          }
        }
        
        // Describe added attributes (non-base items - legacy ellipse/text)
        const addedAttrs = studentItems.filter(item => 
          (item.type === "ellipse" || item.type === "text") && 
          !item.isBaseItem && 
          item.content
        );
        if (addedAttrs.length > 0) {
          descriptions.push("Added Attributes (shapes):");
          for (const attr of addedAttrs) {
            descriptions.push(`  ${attr.content}`);
          }
        }
        
        // Helper to get entity name from an item ID
        const getEntityName = (itemId: string | undefined): string => {
          if (!itemId) return "unknown";
          const item = studentItems.find(i => i.id === itemId);
          if (!item) return "unknown";
          if (item.type === "erd-entity") return item.entityName || "unnamed entity";
          if (item.type === "box" || item.type === "cylinder") return item.content || "unnamed";
          return "unknown";
        };

        // Describe added lines with labels
        const addedLines = studentItems.filter(item => 
          item.type === "line" && !item.isBaseItem
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
        
        // Describe added crowfoot lines with labels and direction
        const addedCrowfoots = studentItems.filter(item => 
          item.type === "crowfoot" && !item.isBaseItem
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
      
      // Handle form-wireframe or webpage-wireframe - describe elements drawn by student
      if ((sub.inputStyle === "form-wireframe" || sub.inputStyle === "webpage-wireframe") && inputs["drawing"]) {
        try {
          const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
          
          const sortedItems = items.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
            return a.x - b.x;
          });
          
          const typeNames: Record<string, string> = {
            "wf-heading": "HEADING", "wf-paragraph": "PARAGRAPH", "wf-audio": "AUDIO PLAYER",
            "wf-video": "VIDEO PLAYER", "wf-div": "CONTAINER/DIV", "wf-annotation": "ANNOTATION",
            "ui-image": "IMAGE", "ui-label": "LABEL", "link-text": "LINK", "bullet-text": "BULLET LIST",
            "text": "TEXT", "box": "BOX", "ui-input": "TEXT INPUT", "ui-textarea": "TEXTAREA",
            "ui-dropdown": "DROPDOWN", "ui-radio": "RADIO BUTTON", "ui-checkbox": "CHECKBOX",
            "ui-submit": "SUBMIT BUTTON", "numbered-text": "NUMBERED LIST",
          };
          
          const formElements: string[] = [];
          const labels = sortedItems.filter(i => i.type === "ui-label" || i.type === "text");
          
          const isRequiredLabel = (labelContent: string | undefined): boolean => {
            return labelContent?.includes("*") || false;
          };
          
          const findNearestLabel = (element: DiagramItem) => {
            let nearest: DiagramItem | null = null;
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
            const posStr = `at (${Math.round(item.x)}, ${Math.round(item.y)}) size ${Math.round(item.width || 100)}x${Math.round(item.height || 30)}`;
            const friendlyType = typeNames[item.type] || item.type?.toUpperCase() || "ELEMENT";
            const baseMarker = item.isBaseItem ? " [base]" : "";
            
            switch (item.type) {
              case "ui-label":
              case "text": {
                const labelContent = item.content || '(no label)';
                const requiredMarker = isRequiredLabel(labelContent) ? " (REQUIRED - has *)" : "";
                formElements.push('[' + friendlyType + ' ' + posStr + ': "' + labelContent + '"' + requiredMarker + baseMarker + ']');
                break;
              }
              case "ui-input": {
                const inputLabel = findNearestLabel(item);
                const inputRequired = inputLabel && isRequiredLabel(inputLabel.content) ? " REQUIRED" : "";
                const inputLabelStr = inputLabel ? ' for "' + (inputLabel.content || 'unlabeled') + '"' : "";
                const inputValidationText = item.content || item.validationMessage || 
                  ((item.validationMin !== undefined || item.validationMax !== undefined) ? (item.validationMin ?? "?") + "-" + (item.validationMax ?? "?") : "");
                const inputContent = inputValidationText ? ' with validation "' + inputValidationText + '"' : "";
                formElements.push('[TEXT INPUT ' + posStr + inputLabelStr + inputRequired + inputContent + baseMarker + ']');
                break;
              }
              case "ui-textarea": {
                const textareaLabel = findNearestLabel(item);
                const textareaRequired = textareaLabel && isRequiredLabel(textareaLabel.content) ? " REQUIRED" : "";
                const textareaLabelStr = textareaLabel ? ' for "' + (textareaLabel.content || 'unlabeled') + '"' : "";
                const textareaValidationText = item.content || item.validationMessage || 
                  ((item.validationMin !== undefined || item.validationMax !== undefined) ? (item.validationMin ?? "?") + "-" + (item.validationMax ?? "?") : "");
                const textareaContent = textareaValidationText ? ' with validation "' + textareaValidationText + '"' : "";
                formElements.push('[TEXTAREA ' + posStr + textareaLabelStr + textareaRequired + textareaContent + baseMarker + ']');
                break;
              }
              case "ui-dropdown": {
                const dropdownLabel = findNearestLabel(item);
                const dropdownRequired = dropdownLabel && isRequiredLabel(dropdownLabel.content) ? " REQUIRED" : "";
                const dropdownLabelStr = dropdownLabel ? ' for "' + (dropdownLabel.content || 'unlabeled') + '"' : "";
                const dropdownOptionText = item.content ? ' showing "' + item.content + '"' : "";
                const dropdownLegacyVal = item.validationMessage || 
                  ((item.validationMin !== undefined || item.validationMax !== undefined) ? (item.validationMin ?? "?") + "-" + (item.validationMax ?? "?") : "");
                const dropdownValidation = dropdownLegacyVal ? ' with validation "' + dropdownLegacyVal + '"' : "";
                formElements.push('[DROPDOWN ' + posStr + dropdownLabelStr + dropdownRequired + dropdownOptionText + dropdownValidation + baseMarker + ']');
                break;
              }
              case "ui-radio":
                formElements.push('[RADIO BUTTON ' + posStr + ': "' + (item.content || 'option') + '"' + baseMarker + ']');
                break;
              case "ui-checkbox":
                formElements.push('[CHECKBOX ' + posStr + ': "' + (item.content || 'option') + '"' + baseMarker + ']');
                break;
              case "ui-submit":
                formElements.push('[SUBMIT BUTTON ' + posStr + ': "' + (item.content || 'Submit') + '"' + baseMarker + ']');
                break;
              default:
                formElements.push('[' + friendlyType + ' ' + posStr + ': "' + (item.content || '(no label)') + '"' + baseMarker + ']');
                break;
            }
          }
          
          const header = sub.inputStyle === "webpage-wireframe" 
            ? "WEBPAGE ELEMENTS (in order from top to bottom):"
            : "FORM ELEMENTS (in order from top to bottom, note: * in a label indicates a REQUIRED field):";
          return `${header}\n${formElements.join("\n")}`;
        } catch (e) {
          return "";
        }
      }
      
      // Handle structure-dataflow diagrams
      if (sub.inputStyle === "structure-dataflow" && inputs["drawing"]) {
        try {
          const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
          const shapes = items.filter(i => i.type !== "line" && i.type !== "crowfoot" && i.type !== "dataflow-up" && i.type !== "dataflow-down");
          const connections = items.filter(i => i.type === "line" || i.type === "crowfoot");
          const dataflows = items.filter(i => i.type === "dataflow-up" || i.type === "dataflow-down");
          
          const sortedShapes = shapes.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
            return a.x - b.x;
          });
          const parts: string[] = [];
          for (const s of sortedShapes) {
            const baseMarker = s.isBaseItem ? " [base]" : "";
            const posStr = `at approx (${Math.round(s.x)}, ${Math.round(s.y)}), size: ${Math.round(s.width || 100)}x${Math.round(s.height || 40)}`;
            const typeName = s.type?.toUpperCase() || "SHAPE";
            parts.push('[' + typeName + ' ' + posStr + ': "' + (s.content || "(no label)") + '"' + baseMarker + ']');
          }
          for (const df of dataflows) {
            const baseMarker = df.isBaseItem ? " [base]" : "";
            const direction = df.type === "dataflow-up" ? "DATAFLOW-UP" : "DATAFLOW-DOWN";
            const parentShape = items.find(it => it.id === df.connectedTo1);
            const parentName = parentShape?.content || "unknown";
            const label = df.content || "(no label)";
            parts.push('[' + direction + ' from "' + parentName + '", label: "' + label + '"' + baseMarker + ']');
          }
          for (const c of connections) {
            const baseMarker = c.isBaseItem ? " [base]" : "";
            const fromItem = items.find(it => it.id === c.connectedTo1);
            const toItem = items.find(it => it.id === c.connectedTo2);
            parts.push('[LINE from "' + (fromItem?.content || "unknown") + '" to "' + (toItem?.content || "unknown") + '", ' + (c.arrowEnd ? "arrow-end" : "no-arrow") + baseMarker + ']');
          }
          return parts.join("\n");
        } catch (e) {
          return "";
        }
      }

      let answer = "";
      for (const [key, val] of Object.entries(inputs)) {
        if (key === "uploaded_files") continue;
        if (val) answer += (answer ? "\n" : "") + val;
      }

      if (inputs["uploaded_files"]) {
        try {
          const files = JSON.parse(inputs["uploaded_files"]) as { url: string; name: string }[];
          if (files.length > 0) {
            answer += `\n\n[Student uploaded ${files.length} file(s): ${files.map(f => f.name).join(", ")}]`;
          }
        } catch {}
      }

      return answer;
    };

    try {
      // Collect all sub-questions for parallel grading
      const allSubQuestions: { q: Question; sub: SubQuestion; inputs: Record<string, string> }[] = [];
      
      for (const q of examQuestions) {
        for (const sub of q.subQuestions) {
          if (sub.maxMarks === 0) continue;
          maxScore += sub.maxMarks;
          const inputs = userInputs[sub.id] || {};
          allSubQuestions.push({ q, sub, inputs });
        }
      }

      // Helper to convert content blocks to text (including data tables for AI grading)
      const contentBlocksToText = (blocks: ContentBlock[] | undefined): string => {
        if (!blocks || blocks.length === 0) return "";
        const processBlock = (b: ContentBlock): string => {
          if (b.type === "text") return b.content || "";
          if (b.type === "code") return "```\n" + (b.content || "") + "\n```";
          if (b.type === "data-table" && b.dataTable) {
            const table = b.dataTable;
            const escapeCell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
            const headers = table.columns.map(c => escapeCell(c.header));
            const headerRow = "| " + headers.join(" | ") + " |";
            const separator = "| " + headers.map(() => "---").join(" | ") + " |";
            const dataRows = table.rows.map(r => 
              "| " + r.cells.map(cell => escapeCell(getCellValue(cell))).join(" | ") + " |"
            ).join("\n");
            return `**Table: ${table.tableName}**\n${headerRow}\n${separator}\n${dataRows}`;
          }
          if (b.type === "code-table" && b.codeSections) {
            return b.codeSections.map(s => `**${s.label}:**\n\`\`\`\n${s.code}\n\`\`\``).join("\n\n");
          }
          if (b.type === "row-layout" && b.children) {
            return b.children.map(processBlock).filter(Boolean).join("\n\n");
          }
          return "";
        };
        return blocks.map(processBlock).filter(Boolean).join("\n\n");
      };

      // Grade all sub-questions in parallel
      const gradingPromises = allSubQuestions.map(async ({ q, sub, inputs }) => {
        const studentAnswer = prepareStudentAnswer(sub, inputs);
        
        // Build context from ALL other sub-questions in the same main question
        // This allows e.g. 6c to reference answers from 6b(i) and 6b(ii)
        const othersInSameQuestion = allSubQuestions.filter(
          item => item.q.id === q.id && item.sub.id !== sub.id && item.sub.maxMarks > 0
        );
        const siblingContext = othersInSameQuestion
          .map(({ sub: other, inputs: otherInputs }) => {
            const otherAnswer = prepareStudentAnswer(other, otherInputs);
            const otherQuestion = contentBlocksToText(other.contentBlocks) || other.questionText || "";
            return `Part ${other.label || "?"}: ${otherQuestion}\nStudent's answer: ${otherAnswer || "(no answer)"}`;
          })
          .join("\n\n");
        
        const questionContent = contentBlocksToText(sub.contentBlocks) || sub.questionText || "";
        
        // Build form wireframe expectations context if applicable
        const formExpectationsContext = sub.inputStyle === "form-wireframe" && sub.inputConfig?.formWireframeExpectations?.length
          ? `\nEXPECTED FORM ELEMENTS (teacher-defined - grade based on these):\n${sub.inputConfig.formWireframeExpectations.map((exp, i) => {
              let desc = `${i + 1}. ${exp.fieldType.toUpperCase()}`;
              if (exp.labelText) desc += ` with label "${exp.labelText}"`;
              if (exp.required) desc += " (REQUIRED - must have *)";
              if (exp.options?.length) desc += ` with options: ${exp.options.join(", ")}`;
              const valText = exp.validationMessage || 
                ((exp.validationMin !== undefined || exp.validationMax !== undefined) ? `${exp.validationMin ?? "?"}-${exp.validationMax ?? "?"}` : "");
              if (valText) desc += ` VALIDATION: "${valText}"`;
              return desc;
            }).join("\n")}`
          : "";
        
        let studentUploadedFiles: { url: string; name: string }[] = [];
        if (sub.requiresStudentCode) {
          for (const other of allSubQuestions) {
            if (other.sub.id === sub.id) continue;
            if (other.inputs["uploaded_files"]) {
              try {
                const files = JSON.parse(other.inputs["uploaded_files"]) as { url: string; name: string }[];
                studentUploadedFiles.push(...files);
              } catch {}
            }
          }
        }

        const fullContext = [
          `${q.title}${sub.label ? ` ${sub.label}` : ""}: ${questionContent}`,
          formExpectationsContext,
          siblingContext ? `\nOTHER PARTS OF THIS QUESTION (for context - grade ONLY the current part):\n${siblingContext}` : ""
        ].filter(Boolean).join("\n\n");
        
        let score = 0;
        if (studentAnswer.trim()) {
          try {
            const referenceFiles = sub.markingGuidanceData?.exampleFiles || [];
            const response = await fetch("/api/grade-answer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                studentAnswer: studentAnswer.trim(),
                markingScheme: sub.markingScheme,
                maxMarks: sub.maxMarks,
                questionContext: fullContext,
                aiGuidance: sub.aiGuidance,
                referenceFiles,
                studentUploadedFiles: studentUploadedFiles.length > 0 ? studentUploadedFiles : undefined
              })
            });

            if (response.ok) {
              const result = await response.json();
              score = result.marks;
              return {
                questionTitle: q.title,
                subLabel: sub.label,
                questionText: sub.questionText || `${q.title}${sub.label ? ` ${sub.label}` : ""}`,
                contentBlocks: sub.contentBlocks || [],
                codeSnippet: sub.codeSnippet || "",
                maxMarks: sub.maxMarks,
                score: score,
                userAnswer: inputs,
                inputStyle: sub.inputStyle,
                feedback: result.feedback || "",
                suggestions: result.suggestions || ""
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
          score: score,
          userAnswer: inputs,
          inputStyle: sub.inputStyle,
          feedback: "",
          suggestions: ""
        };
      });

      // Wait for all grading to complete in parallel
      const results = await Promise.all(gradingPromises);
      
      // Process results
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

    const examTitle = isAdditionalExam ? additionalExamTitle : (isStudentQuiz && studentQuizData ? studentQuizData.name : String(year) + " Past Paper");
    const resultData = {
        year,
        isAdditionalExam,
        additionalExamTitle: isAdditionalExam ? additionalExamTitle : undefined,
        examTitle,
        examType: isAdditionalExam ? 'additional-exam' : (isStudentQuiz ? 'quiz' : 'past-paper'),
        examIdentifier: isAdditionalExam ? additionalExamId : (isStudentQuiz ? studentQuizId : String(year)),
        totalScore,
        maxScore, 
        breakdown,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem("last_exam_result", JSON.stringify(resultData));

    const studentToken = localStorage.getItem("student_token");
    if (studentToken) {
      try {
        const saveRes = await fetch("/api/student/exam-results", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + studentToken,
          },
          body: JSON.stringify({
            examType: resultData.examType,
            examIdentifier: resultData.examIdentifier,
            examTitle: examTitle,
            additionalPaperId: isAdditionalExam ? additionalExamId : null,
            score: totalScore,
            maxMarks: maxScore,
            percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
            timeSpentSeconds: null,
            answers: breakdown,
          }),
        });
        if (!saveRes.ok) {
          console.error("Failed to save exam result:", saveRes.status);
          toast({ title: "Warning", description: "Your result was not saved to your account. You may need to log in again.", variant: "destructive" });
        }
        fetch("/api/student/exam-progress", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
          body: JSON.stringify({ examType: resultData.examType, examIdentifier: resultData.examIdentifier }),
        }).catch(() => {});
      } catch (err) {
        console.error("Failed to save exam result to server:", err);
      }
    }

    setLocation("/exam-results");
  };

  useEffect(() => {
    handleSubmitExamRef.current = handleSubmitExam;
  }, [examQuestions, userInputs, year, isAdditionalExam, additionalExamTitle]);

  // Reusing marking logic from Revision.tsx
  const calculateMarks = (inputs: Record<string, string>, subQ: SubQuestion): number => {
    if (subQ.maxMarks === 0) return 0;

    let combinedAnswer = Object.values(inputs).join("\n").trim().toLowerCase();
    
    if (subQ.inputStyle === "design-choice") {
        const mode = inputs["design_mode"] || "pseudocode";
        if (mode === "pseudocode") {
            combinedAnswer = (inputs["main"] || "").toLowerCase();
        } else if (mode === "diagram" && inputs["drawing"]) {
             try {
                const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
                const textContents = items
                  .filter(i => (i.type === "text" || i.type === "box" || i.type === "ellipse" || i.type === "diamond" || i.type === "parallelogram") && i.content)
                  .sort((a, b) => {
                      // Sort by Y first (with 40px tolerance for "same line"), then X
                      if (Math.abs(a.y - b.y) > 40) {
                          return a.y - b.y;
                      }
                      return a.x - b.x;
                  })
                  .map(i => i.content?.toLowerCase() || "");
                combinedAnswer = textContents.join(" ");
             } catch (e) {
                combinedAnswer = "";
             }
        }
    } else if (subQ.inputStyle === "drawing" && inputs["drawing"]) {
      try {
        const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
        const textContents = items
          .filter(i => (i.type === "text" || i.type === "box" || i.type === "ellipse" || i.type === "diamond" || i.type === "parallelogram") && i.content)
          .sort((a, b) => {
              // Sort by Y first (with 40px tolerance for "same line"), then X
              if (Math.abs(a.y - b.y) > 40) {
                  return a.y - b.y;
              }
              return a.x - b.x;
          })
          .map(i => i.content?.toLowerCase() || "");
        combinedAnswer = textContents.join(" ");
      } catch (e) {}
    }
    // Special handling for ERD annotation
    else if (subQ.inputStyle === "erd-annotation") {
      const config = subQ.inputConfig;
      let totalRequirements = 0;
      let correctCount = 0;
      
      // Parse student's diagram
      let studentItems: DiagramItem[] = [];
      if (inputs["erd_diagram"]) {
        try {
          studentItems = JSON.parse(inputs["erd_diagram"]) as DiagramItem[];
        } catch (e) {
          console.error("Failed to parse student ERD diagram", e);
        }
      }
      
      // 1. Check PK/FK markings on existing attributes
      if (config?.erdAttributes) {
        for (const attr of config.erdAttributes) {
          totalRequirements++;
          const studentItem = studentItems.find(item => item.id === attr.id);
          const studentMarking = studentItem?.marking || "none";
          if (studentMarking === attr.correctMarking) {
            correctCount++;
          }
        }
      }
      
      // 2. Check required additional attributes
      if (config?.erdRequiredAttributes) {
        for (const reqAttr of config.erdRequiredAttributes) {
          totalRequirements++;
          // Look for an ellipse/text item with matching content (case-insensitive)
          const found = studentItems.some(item => 
            (item.type === "ellipse" || item.type === "text") && 
            !item.isBaseItem &&
            item.content?.toLowerCase().includes(reqAttr.attributeName.toLowerCase())
          );
          if (found) {
            correctCount++;
          }
        }
      }
      
      // 3. Check required lines between entities
      if (config?.erdRequiredLines) {
        for (const reqLine of config.erdRequiredLines) {
          totalRequirements++;
          // Find entity shapes by name
          const entity1 = studentItems.find(item => 
            (item.type === "box" || item.type === "cylinder") &&
            item.content?.toLowerCase().includes(reqLine.entity1.toLowerCase())
          );
          const entity2 = studentItems.find(item => 
            (item.type === "box" || item.type === "cylinder") &&
            item.content?.toLowerCase().includes(reqLine.entity2.toLowerCase())
          );
          
          if (entity1 && entity2) {
            // Check if there's a line connecting them
            const hasLine = studentItems.some(item => 
              item.type === "line" &&
              ((item.connectedTo1 === entity1.id && item.connectedTo2 === entity2.id) ||
               (item.connectedTo1 === entity2.id && item.connectedTo2 === entity1.id))
            );
            if (hasLine) {
              correctCount++;
            }
          }
        }
      }
      
      // 4. Check required crowfoot (1:M) lines
      if (config?.erdRequiredCrowfootLines) {
        for (const reqCrowfoot of config.erdRequiredCrowfootLines) {
          totalRequirements++;
          // Find entity shapes by name
          const entity1 = studentItems.find(item => 
            (item.type === "box" || item.type === "cylinder") &&
            item.content?.toLowerCase().includes(reqCrowfoot.entity1.toLowerCase())
          );
          const entity2 = studentItems.find(item => 
            (item.type === "box" || item.type === "cylinder") &&
            item.content?.toLowerCase().includes(reqCrowfoot.entity2.toLowerCase())
          );
          
          if (entity1 && entity2) {
            // Check if there's a crowfoot line connecting them
            const hasCrowfoot = studentItems.some(item => 
              item.type === "crowfoot" &&
              ((item.connectedTo1 === entity1.id && item.connectedTo2 === entity2.id) ||
               (item.connectedTo1 === entity2.id && item.connectedTo2 === entity1.id))
            );
            if (hasCrowfoot) {
              correctCount++;
            }
          }
        }
      }
      
      // Award proportional marks based on correct answers
      if (totalRequirements === 0) return 0;
      return Math.round((correctCount / totalRequirements) * subQ.maxMarks);
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
      const usedKeywords = new Set<string>();
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

  if (isAdditionalExam && !localStorage.getItem("student_token")) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Login Required</h2>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-md">
            You must be logged in to take mock exams. This ensures your results are saved to your account.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setLocation("/timed-mode")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setLocation("/student-login")} className="bg-red-600 hover:bg-red-700 text-white">
              Log In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">Loading exam questions...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">No Questions Found</h2>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-md">
            {isStudentQuiz 
              ? "This quiz has no valid questions. The questions may have been removed from the question bank."
              : `There are no exam questions available for ${year} with the ${optionalSection === "dd" ? "Database Design" : "Web Development"} section.`
            }
          </p>
          <Button variant="outline" onClick={() => setLocation(isStudentQuiz ? "/my-quizzes" : "/timed-mode")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {isStudentQuiz ? "Back to My Quizzes" : "Back to Setup"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-3 py-1">
                {isStudentQuiz && studentQuizData ? studentQuizData.name : isAdditionalExam ? additionalExamTitle : `${year} Paper`}
            </Badge>
            <h1 className="text-xl font-bold hidden md:block">Question {currentQuestionIndex + 1} of {examQuestions.length}</h1>
        </div>
        
        <div className={`flex items-center gap-2 text-xl font-mono font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-neutral-700 dark:text-neutral-200'}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
            {extraTimeAdded && (
                <span className="text-xs text-green-600 dark:text-green-400 font-normal">+{extraTimeAdded}</span>
            )}
        </div>

        <div className="flex gap-2">
            <ModeToggle />

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="text-neutral-500 hover:text-red-600" data-testid="button-cancel-exam">
                        <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Exam?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel? All your answers will be discarded and no result will be saved.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Working</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelExam} className="bg-red-600">Discard & Leave</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" onClick={handlePauseExam} className="border-neutral-300 dark:border-neutral-700">
                <PauseCircle className="mr-2 h-4 w-4" /> Pause & Save
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="default" className="bg-red-600 hover:bg-red-700" data-testid="button-submit-exam">
                        Submit Exam
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Finish Exam?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to submit? You won't be able to change your answers.
                            You have answered {Object.keys(userInputs).length} parts so far.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Working</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmitExam} className="bg-red-600">Submit & Grade</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Question Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto p-4 hidden md:block">
            <h3 className="font-semibold text-neutral-500 mb-4 text-sm uppercase tracking-wider">Questions</h3>
            <div className="space-y-4">
                {(() => {
                    const topicLabels: Record<string, string> = {
                        sdcs: "Section 1 — Software Design",
                        dd: "Section 2 — Database Design",
                        wd: "Section 2 — Web Design",
                    };
                    const groups: { topic: string; label: string; questions: { q: typeof examQuestions[0]; idx: number }[] }[] = [];
                    let currentTopic = "";
                    examQuestions.forEach((q, idx) => {
                        if (q.topic !== currentTopic) {
                            currentTopic = q.topic;
                            groups.push({
                                topic: q.topic,
                                label: topicLabels[q.topic] || q.topic,
                                questions: [],
                            });
                        }
                        groups[groups.length - 1].questions.push({ q, idx });
                    });
                    return groups.map((group) => (
                        <div key={group.topic}>
                            {groups.length > 1 && (
                                <div className="mb-2 pb-1 border-b border-neutral-200 dark:border-neutral-700">
                                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400" data-testid={`sidebar-section-${group.topic}`}>
                                        {group.label}
                                    </span>
                                </div>
                            )}
                            <div className="grid grid-cols-4 gap-2">
                                {group.questions.map(({ q, idx }) => {
                                    const isAnswered = q.subQuestions.some(sub => {
                                        const input = userInputs[sub.id];
                                        return input && (input.main || input.drawing);
                                    });
                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => setCurrentQuestionIndex(idx)}
                                            className={`
                                                h-10 w-10 rounded-md flex items-center justify-center text-sm font-medium transition-colors
                                                ${currentQuestionIndex === idx
                                                    ? 'bg-red-600 text-white'
                                                    : isAnswered
                                                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border border-neutral-900 dark:border-white'
                                                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'}
                                            `}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ));
                })()}
            </div>
        </aside>

        {/* Question Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-24">
            <div className="max-w-4xl mx-auto space-y-8">
                {(() => {
                    const topicLabels: Record<string, { title: string; color: string; bg: string; border: string }> = {
                        sdcs: { title: "Section 1 — Software Design and Computer Systems", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800" },
                        dd: { title: "Section 2 — Database Design and Development", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" },
                        wd: { title: "Section 2 — Web Design and Development", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800" },
                    };
                    const prevTopic = currentQuestionIndex > 0 ? examQuestions[currentQuestionIndex - 1]?.topic : null;
                    const isFirstInSection = currentQuestionIndex === 0 || currentQuestion.topic !== prevTopic;
                    const sectionInfo = topicLabels[currentQuestion.topic];
                    const hasMultipleSections = examQuestions.some(q => q.topic !== examQuestions[0]?.topic);
                    if (!isFirstInSection || !sectionInfo || !hasMultipleSections) return null;
                    return (
                        <div className={`rounded-lg border-2 ${sectionInfo.border} ${sectionInfo.bg} p-4 flex items-center gap-3`} data-testid={`section-banner-${currentQuestion.topic}`}>
                            <div className={`w-1.5 h-10 rounded-full ${currentQuestion.topic === "sdcs" ? "bg-blue-500" : currentQuestion.topic === "dd" ? "bg-emerald-500" : "bg-purple-500"}`} />
                            <div>
                                <h3 className={`text-lg font-bold ${sectionInfo.color}`}>{sectionInfo.title}</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {currentQuestion.topic === "sdcs" ? "Answer all questions in this section." : "Answer all questions in your chosen optional section."}
                                </p>
                            </div>
                        </div>
                    );
                })()}
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">{currentQuestion.title}</h2>
                        {currentQuestion.scenario && hasScenarioContent(currentQuestion.scenario) && (
                            <Card className="mb-6 bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800">
                                <CardContent className="pt-6">
                                    {/* New content blocks approach */}
                                    {currentQuestion.scenario.contentBlocks && currentQuestion.scenario.contentBlocks.length > 0 ? (
                                      <div className="space-y-4">
                                        {currentQuestion.scenario.contentBlocks.map((block: ContentBlock) => (
                                          <div key={block.id}>
                                            {block.type === "text" && (
                                              <div className={cn(
                                                "text-neutral-700 dark:text-neutral-300 leading-relaxed",
                                                block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left",
                                                block.hasBorder && "border border-neutral-300 dark:border-neutral-700 p-3 rounded",
                                                block.hasBorder && block.borderWidth === 2 && "border-2",
                                                block.hasBorder && block.borderWidth === 3 && "border-[3px]",
                                                block.hasBorder && block.borderWidth === 4 && "border-4"
                                              )}>
                                                {formatText(block.content)}
                                              </div>
                                            )}
                                            {block.type === "image" && block.content && (
                                              <div className={cn(
                                                "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                                                block.imageSize === "xs" && "max-w-[150px]",
                                                block.imageSize === "small" && "max-w-xs",
                                                block.imageSize === "medium" && "max-w-md",
                                                block.imageSize === "large" && "max-w-xl",
                                                block.imageSize === "xl" && "max-w-2xl",
                                                block.imageSize === "2xl" && "max-w-4xl",
                                                block.imageSize === "full" && "w-full",
                                                !block.imageSize && "max-w-md"
                                              )}>
                                                <img src={block.content} alt={block.caption || "Scenario image"} className="max-w-full h-auto object-contain" />
                                                {block.caption && <p className="text-sm text-neutral-500 dark:text-neutral-400 p-2">{block.caption}</p>}
                                              </div>
                                            )}
                                            {block.type === "code" && (
                                              <pre className="p-4 bg-neutral-900 text-neutral-50 rounded-lg overflow-x-auto font-mono text-sm border border-neutral-700">
                                                {block.content}
                                              </pre>
                                            )}
                                            {block.type === "code-table" && block.codeSections && (
                                              <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                                {block.codeSections.map((section, sIdx) => (
                                                  <div key={section.id || sIdx}>
                                                    <div className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600">
                                                      {section.label}
                                                    </div>
                                                    <div className="bg-white dark:bg-neutral-900 p-4 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0">
                                                      {section.code}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            {block.type === "data-table" && block.dataTable && (
                                              <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                                <div className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono">
                                                  {block.dataTable.tableName}
                                                </div>
                                                <table className="w-full text-sm">
                                                  <thead>
                                                    <tr className="bg-neutral-100 dark:bg-neutral-800">
                                                      {block.dataTable.columns.map((col) => (
                                                        <th key={col.id} className="px-4 py-2 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0">
                                                          {col.header}
                                                        </th>
                                                      ))}
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {block.dataTable.rows.map((row) => (
                                                      <tr key={row.id} className="border-t border-neutral-300 dark:border-neutral-700">
                                                        {row.cells.map((cell, cellIndex) => {
                                                          if (isCellHidden(cell)) return null;
                                                          const cellRole = getCellRole(cell);
                                                          const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                                                          const colSpan = getCellColSpan(cell);
                                                          const rowSpan = getCellRowSpan(cell);
                                                          return (
                                                            <CellTag 
                                                              key={cellIndex} 
                                                              colSpan={colSpan > 1 ? colSpan : undefined}
                                                              rowSpan={rowSpan > 1 ? rowSpan : undefined}
                                                              className={cn(
                                                                "px-4 py-2 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                                                                cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                                                                cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                                                              )}
                                                            >
                                                              {getCellValue(cell)}
                                                            </CellTag>
                                                          );
                                                        })}
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}
                                            {block.type === "pseudocode" && block.pseudocodeLines && (
                                              <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                                                <pre className="font-mono text-sm whitespace-pre-wrap break-words">{block.pseudocodeLines.map(line => 
                                                  `${String(line.lineNumber).padStart(2, ' ')}  ${'  '.repeat(line.indent)}${line.content}`
                                                ).join('\n')}</pre>
                                              </div>
                                            )}
                                            {block.type === "row-layout" && block.children && (
                                              <RowLayout>
                                                {block.children.map((childBlock) => (
                                                  <RowLayoutItem key={childBlock.id}>
                                                    {childBlock.type === "text" && (
                                                      <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                                        {formatText(childBlock.content)}
                                                      </div>
                                                    )}
                                                    {childBlock.type === "image" && childBlock.content && (
                                                      <div className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
                                                        <img src={childBlock.content} alt={childBlock.caption || ""} className="max-w-full h-auto object-contain" />
                                                        {childBlock.caption && <p className="text-sm text-neutral-500 p-2">{childBlock.caption}</p>}
                                                      </div>
                                                    )}
                                                    {childBlock.type === "code" && (
                                                      <pre className="p-4 bg-neutral-900 text-neutral-50 rounded-lg overflow-x-auto font-mono text-sm border border-neutral-700">
                                                        {childBlock.content}
                                                      </pre>
                                                    )}
                                                    {childBlock.type === "data-table" && childBlock.dataTable && (
                                                      <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                                        {childBlock.dataTable.tableName && (
                                                          <div className="bg-neutral-200 dark:bg-neutral-700 px-3 py-1.5 font-semibold text-sm border-b border-neutral-300 dark:border-neutral-600 font-mono">
                                                            {childBlock.dataTable.tableName}
                                                          </div>
                                                        )}
                                                        <table className="text-sm w-full">
                                                          <thead>
                                                            <tr className="bg-neutral-100 dark:bg-neutral-800">
                                                              {childBlock.dataTable.columns.map((col) => (
                                                                <th key={col.id} className="px-3 py-1.5 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0 text-xs">
                                                                  {col.header}
                                                                </th>
                                                              ))}
                                                            </tr>
                                                          </thead>
                                                          <tbody>
                                                            {childBlock.dataTable.rows.map((row) => (
                                                              <tr key={row.id} className="border-t border-neutral-300 dark:border-neutral-700">
                                                                {row.cells.map((cell, cellIndex) => (
                                                                  <td key={cellIndex} className="px-3 py-1.5 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0 text-xs">
                                                                    {getCellValue(cell)}
                                                                  </td>
                                                                ))}
                                                              </tr>
                                                            ))}
                                                          </tbody>
                                                        </table>
                                                      </div>
                                                    )}
                                                    {childBlock.type === "pseudocode" && childBlock.pseudocodeLines && (
                                                      <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                                                        <pre className="font-mono text-sm whitespace-pre-wrap break-words">{childBlock.pseudocodeLines.map(line => 
                                                          `${String(line.lineNumber).padStart(2, ' ')}  ${'  '.repeat(line.indent)}${line.content}`
                                                        ).join('\n')}</pre>
                                                      </div>
                                                    )}
                                                  </RowLayoutItem>
                                                ))}
                                              </RowLayout>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <>
                                        {currentQuestion.scenario.text && (
                                          <div className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                                              {formatText(currentQuestion.scenario.text)}
                                          </div>
                                        )}
                                        {currentQuestion.scenario.imageUrl && (
                                            <img src={currentQuestion.scenario.imageUrl} alt="Scenario" className="mt-4 rounded-lg max-w-full max-h-96 object-contain" />
                                        )}
                                        {currentQuestion.scenario.preCodeText && (
                                            <div className="mt-4 text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                                {formatText(currentQuestion.scenario.preCodeText)}
                                            </div>
                                        )}
                                        {currentQuestion.scenario.codeSnippet && (
                                            <pre className="mt-4 p-4 bg-neutral-900 text-neutral-50 rounded-lg overflow-x-auto font-mono text-sm border border-neutral-700">
                                                {currentQuestion.scenario.codeSnippet}
                                            </pre>
                                        )}
                                        {currentQuestion.scenario.postImageText && (
                                            <div className="mt-4 text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                                {formatText(currentQuestion.scenario.postImageText)}
                                            </div>
                                        )}
                                      </>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    {currentQuestion.subQuestions.map((subQ) => (
                        <div key={subQ.id} className="space-y-4 border-l-2 border-neutral-200 dark:border-neutral-800 pl-6 py-2">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1 flex-1 w-full min-w-0">
                                    {/* Label */}
                                    {subQ.label && (
                                        <span className="font-bold text-neutral-900 dark:text-neutral-100">{subQ.label}.</span>
                                    )}
                                    
                                    {/* Content blocks or legacy content */}
                                    {subQ.contentBlocks && subQ.contentBlocks.length > 0 ? (
                                      <div className="space-y-3 mt-2">
                                        {subQ.contentBlocks.map((block: ContentBlock) => (
                                          <div key={block.id}>
                                            {block.type === "text" && (
                                              <div className={cn(
                                                "text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap",
                                                block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left",
                                                block.hasBorder && "border border-neutral-300 dark:border-neutral-700 p-3 rounded",
                                                block.hasBorder && block.borderWidth === 2 && "border-2",
                                                block.hasBorder && block.borderWidth === 3 && "border-[3px]",
                                                block.hasBorder && block.borderWidth === 4 && "border-4"
                                              )}>
                                                {formatText(block.content)}
                                              </div>
                                            )}
                                            {block.type === "image" && block.content && (
                                              <div className={cn(
                                                "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                                                block.imageSize === "xs" && "max-w-[150px]",
                                                block.imageSize === "small" && "max-w-xs",
                                                block.imageSize === "medium" && "max-w-md",
                                                block.imageSize === "large" && "max-w-xl",
                                                block.imageSize === "xl" && "max-w-2xl",
                                                block.imageSize === "2xl" && "max-w-4xl",
                                                block.imageSize === "full" && "w-full",
                                                !block.imageSize && "max-w-md"
                                              )}>
                                                <img src={block.content} alt={block.caption || "Question image"} className="max-w-full h-auto object-contain" />
                                                {block.caption && <p className="text-sm text-neutral-500 dark:text-neutral-400 p-2">{block.caption}</p>}
                                              </div>
                                            )}
                                            {block.type === "code" && (
                                              <div className="p-3 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                                                <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{block.content}</pre>
                                              </div>
                                            )}
                                            {block.type === "code-table" && block.codeSections && (
                                              <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                                {block.codeSections.map((section, sIdx) => (
                                                  <div key={section.id || sIdx}>
                                                    <div className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600">
                                                      {section.label}
                                                    </div>
                                                    <div className="bg-white dark:bg-neutral-900 p-4 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0">
                                                      {section.code}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            {block.type === "data-table" && block.dataTable && (
                                              <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                                <div className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono">
                                                  {block.dataTable.tableName}
                                                </div>
                                                <table className="w-full text-sm">
                                                  <thead>
                                                    <tr className="bg-neutral-100 dark:bg-neutral-800">
                                                      {block.dataTable.columns.map((col) => (
                                                        <th key={col.id} className="px-4 py-2 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0">
                                                          {col.header}
                                                        </th>
                                                      ))}
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {block.dataTable.rows.map((row) => (
                                                      <tr key={row.id} className="border-t border-neutral-300 dark:border-neutral-700">
                                                        {row.cells.map((cell, cellIndex) => {
                                                          if (isCellHidden(cell)) return null;
                                                          const cellRole = getCellRole(cell);
                                                          const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                                                          const colSpan = getCellColSpan(cell);
                                                          const rowSpan = getCellRowSpan(cell);
                                                          return (
                                                            <CellTag 
                                                              key={cellIndex} 
                                                              colSpan={colSpan > 1 ? colSpan : undefined}
                                                              rowSpan={rowSpan > 1 ? rowSpan : undefined}
                                                              className={cn(
                                                                "px-4 py-2 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                                                                cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                                                                cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                                                              )}
                                                            >
                                                              {getCellValue(cell)}
                                                            </CellTag>
                                                          );
                                                        })}
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}
                                            {block.type === "pseudocode" && block.pseudocodeLines && (
                                              <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                                                <pre className="font-mono text-sm whitespace-pre-wrap break-words">{block.pseudocodeLines.map(line => 
                                                  `${String(line.lineNumber).padStart(2, ' ')}  ${'  '.repeat(line.indent)}${line.content}`
                                                ).join('\n')}</pre>
                                              </div>
                                            )}
                                            {block.type === "row-layout" && block.children && (
                                              <RowLayout>
                                                {block.children.map((childBlock) => (
                                                  <RowLayoutItem key={childBlock.id}>
                                                    {childBlock.type === "text" && (
                                                      <div className="text-neutral-800 dark:text-neutral-200">{formatText(childBlock.content)}</div>
                                                    )}
                                                    {childBlock.type === "image" && childBlock.content && (
                                                      <div className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
                                                        <img src={childBlock.content} alt={childBlock.caption || ""} className="max-w-full h-auto object-contain" />
                                                      </div>
                                                    )}
                                                    {childBlock.type === "code" && (
                                                      <pre className="p-3 bg-neutral-900 text-neutral-50 rounded-lg overflow-x-auto font-mono text-sm">{childBlock.content}</pre>
                                                    )}
                                                    {childBlock.type === "data-table" && childBlock.dataTable && (
                                                      <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden text-sm">
                                                        {childBlock.dataTable.tableName && <div className="bg-neutral-200 dark:bg-neutral-700 px-3 py-1 font-semibold font-mono">{childBlock.dataTable.tableName}</div>}
                                                        <table className="w-full"><thead><tr className="bg-neutral-100 dark:bg-neutral-800">{childBlock.dataTable.columns.map(col => <th key={col.id} className="px-3 py-1 text-left font-semibold text-xs">{col.header}</th>)}</tr></thead><tbody>{childBlock.dataTable.rows.map(row => <tr key={row.id} className="border-t">{row.cells.map((cell, idx) => <td key={idx} className="px-3 py-1 text-xs">{getCellValue(cell)}</td>)}</tr>)}</tbody></table>
                                                      </div>
                                                    )}
                                                    {childBlock.type === "pseudocode" && childBlock.pseudocodeLines && (
                                                      <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                                                        <pre className="font-mono text-sm whitespace-pre-wrap break-words">{childBlock.pseudocodeLines.map(line => 
                                                          `${String(line.lineNumber).padStart(2, ' ')}  ${'  '.repeat(line.indent)}${line.content}`
                                                        ).join('\n')}</pre>
                                                      </div>
                                                    )}
                                                  </RowLayoutItem>
                                                ))}
                                              </RowLayout>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <>
                                        {subQ.questionText && (
                                          <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{formatText(subQ.questionText)}</p>
                                        )}
                                        {subQ.imageUrl && (
                                            <div className="mt-3">
                                              <img src={subQ.imageUrl} alt="Question Part" className="rounded-lg max-w-full max-h-64 object-contain" />
                                            </div>
                                        )}
                                        {subQ.preCodeText && (
                                            <div className="mt-3 text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                                                {formatText(subQ.preCodeText)}
                                            </div>
                                        )}
                                        {subQ.codeSnippet && (
                                            <div className="mt-3 p-3 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                                                <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{subQ.codeSnippet}</pre>
                                            </div>
                                        )}
                                        {subQ.imageCaption && (
                                            <p className="mt-3 text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{subQ.imageCaption}</p>
                                        )}
                                      </>
                                    )}
                                </div>
                                {subQ.maxMarks > 0 && (
                                    <Badge variant="secondary" className="shrink-0">
                                        {subQ.maxMarks} {subQ.maxMarks === 1 ? 'mark' : 'marks'}
                                    </Badge>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="mt-4" onPaste={makePasteHandler(subQ)}>
                                {renderInput(subQ, userInputs[subQ.id] || {}, (key, val) => updateInput(subQ.id, key, val))}
                                <StudentFileUploadArea subQ={subQ} currentInput={userInputs[subQ.id] || {}} onChange={(key, val) => updateInput(subQ.id, key, val)} />
                            </div>

                            {/* Nested Sub-Parts */}
                            {subQ.subParts && subQ.subParts.length > 0 && (
                              <div className="mt-4 ml-4 pl-4 border-l-2 border-neutral-300 dark:border-neutral-600 space-y-4">
                                {subQ.subParts.map((part) => (
                                  <div key={part.id} className="space-y-3">
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="space-y-1 flex-1">
                                        <span className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">{part.label}</span>
                                        
                                        {/* Content blocks or legacy content for sub-parts */}
                                        {part.contentBlocks && part.contentBlocks.length > 0 ? (
                                          <div className="space-y-2 mt-1">
                                            {part.contentBlocks.map((block: ContentBlock) => (
                                              <div key={block.id}>
                                                {block.type === "text" && (
                                                  <div className={cn(
                                                    "text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap text-sm",
                                                    block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left",
                                                    block.hasBorder && "border border-neutral-300 dark:border-neutral-700 p-3 rounded",
                                                    block.hasBorder && block.borderWidth === 2 && "border-2",
                                                    block.hasBorder && block.borderWidth === 3 && "border-[3px]",
                                                    block.hasBorder && block.borderWidth === 4 && "border-4"
                                                  )}>
                                                    {formatText(block.content)}
                                                  </div>
                                                )}
                                                {block.type === "image" && block.content && (
                                                  <div className={cn(
                                                    "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                                                    block.imageSize === "xs" && "max-w-[150px]",
                                                    block.imageSize === "small" && "max-w-xs",
                                                    block.imageSize === "medium" && "max-w-md",
                                                    block.imageSize === "large" && "max-w-xl",
                                                    block.imageSize === "xl" && "max-w-2xl",
                                                    block.imageSize === "2xl" && "max-w-4xl",
                                                    block.imageSize === "full" && "w-full",
                                                    !block.imageSize && "max-w-md"
                                                  )}>
                                                    <img src={block.content} alt={block.caption || "Question image"} className="max-w-full h-auto object-contain" />
                                                    {block.caption && <p className="text-xs text-neutral-500 dark:text-neutral-400 p-2">{block.caption}</p>}
                                                  </div>
                                                )}
                                                {block.type === "code" && (
                                                  <div className="p-2 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                                                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{block.content}</pre>
                                                  </div>
                                                )}
                                                {block.type === "code-table" && block.codeSections && (
                                                  <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden text-xs">
                                                    {block.codeSections.map((section, sIdx) => (
                                                      <div key={section.id || sIdx}>
                                                        <div className="bg-neutral-200 dark:bg-neutral-700 px-3 py-1.5 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600">
                                                          {section.label}
                                                        </div>
                                                        <div className="bg-white dark:bg-neutral-900 p-3 font-mono text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0">
                                                          {section.code}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                                {block.type === "data-table" && block.dataTable && (
                                                  <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden text-xs">
                                                    <div className="bg-neutral-200 dark:bg-neutral-700 px-3 py-1.5 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono">
                                                      {block.dataTable.tableName}
                                                    </div>
                                                    <table className="w-full">
                                                      <thead>
                                                        <tr className="bg-neutral-100 dark:bg-neutral-800">
                                                          {block.dataTable.columns.map((col) => (
                                                            <th key={col.id} className="px-3 py-1.5 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0">
                                                              {col.header}
                                                            </th>
                                                          ))}
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        {block.dataTable.rows.map((row) => (
                                                          <tr key={row.id} className="border-t border-neutral-300 dark:border-neutral-700">
                                                            {row.cells.map((cell, cellIndex) => {
                                                              if (isCellHidden(cell)) return null;
                                                              const cellRole = getCellRole(cell);
                                                              const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                                                              const colSpan = getCellColSpan(cell);
                                                              const rowSpan = getCellRowSpan(cell);
                                                              return (
                                                                <CellTag 
                                                                  key={cellIndex} 
                                                                  colSpan={colSpan > 1 ? colSpan : undefined}
                                                                  rowSpan={rowSpan > 1 ? rowSpan : undefined}
                                                                  className={cn(
                                                                    "px-3 py-1.5 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                                                                    cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                                                                    cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                                                                  )}
                                                                >
                                                                  {getCellValue(cell)}
                                                                </CellTag>
                                                              );
                                                            })}
                                                          </tr>
                                                        ))}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                )}
                                                {block.type === "pseudocode" && block.pseudocodeLines && (
                                                  <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                                                    <pre className="font-mono text-sm whitespace-pre-wrap break-words">{block.pseudocodeLines.map(line => 
                                                      `${String(line.lineNumber).padStart(2, ' ')}  ${'  '.repeat(line.indent)}${line.content}`
                                                    ).join('\n')}</pre>
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <>
                                            {part.questionText && (
                                              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap text-sm">{formatText(part.questionText)}</p>
                                            )}
                                            {part.imageUrl && (
                                              <div className="mt-2">
                                                <img src={part.imageUrl} alt="Question Part" className="rounded-lg max-w-full max-h-48 object-contain" />
                                              </div>
                                            )}
                                            {part.preCodeText && (
                                              <div className="mt-2 text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm">
                                                {formatText(part.preCodeText)}
                                              </div>
                                            )}
                                            {part.codeSnippet && (
                                              <div className="mt-2 p-2 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                                                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{part.codeSnippet}</pre>
                                              </div>
                                            )}
                                            {part.imageCaption && (
                                              <p className="mt-2 text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap text-sm">{part.imageCaption}</p>
                                            )}
                                          </>
                                        )}
                                      </div>
                                      <Badge variant="secondary" className="shrink-0 text-xs">
                                        {part.maxMarks} {part.maxMarks === 1 ? 'mark' : 'marks'}
                                      </Badge>
                                    </div>
                                    <div className="mt-2" onPaste={makePasteHandler(part)}>
                                      {renderInput(part, userInputs[part.id] || {}, (key, val) => updateInput(part.id, key, val))}
                                      <StudentFileUploadArea subQ={part} currentInput={userInputs[part.id] || {}} onChange={(key, val) => updateInput(part.id, key, val)} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </main>
      </div>

      {/* Footer Navigation */}
      <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4 flex justify-between items-center md:hidden">
        <Button 
            variant="outline" 
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
        >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <span className="font-medium">
            {currentQuestionIndex + 1} / {examQuestions.length}
        </span>
        <Button 
            variant="outline"
            disabled={currentQuestionIndex === examQuestions.length - 1}
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
        >
            Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </footer>
      
      {/* Desktop floating nav */}
      <div className="fixed bottom-8 right-8 hidden md:flex gap-4">
        <Button 
            variant="secondary" 
            size="lg"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            className="shadow-lg"
        >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button 
            variant="default"
            size="lg"
            disabled={currentQuestionIndex === examQuestions.length - 1}
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            className="shadow-lg bg-red-600 hover:bg-red-700"
        >
            Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StudentFileUploadArea({ subQ, currentInput, onChange, disabled }: {
  subQ: SubQuestion;
  currentInput: Record<string, string>;
  onChange: (key: string, val: string) => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  if (!subQ.allowFileUpload) return null;

  const uploadedFiles: { url: string; name: string }[] = currentInput["uploaded_files"]
    ? (() => { try { return JSON.parse(currentInput["uploaded_files"]); } catch { return []; } })()
    : [];

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    const newFiles = [...uploadedFiles];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload-student-file", { method: "POST", body: formData });
        if (res.ok) {
          const result = await res.json();
          newFiles.push({ url: result.url, name: result.originalName });
        }
      } catch (e) {
        console.error("Upload failed", e);
      }
    }
    onChange("uploaded_files", JSON.stringify(newFiles));
    setUploading(false);
  };

  const removeFile = (idx: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== idx);
    onChange("uploaded_files", JSON.stringify(newFiles));
  };

  return (
    <div className="mt-3 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          Upload Evidence Files
        </span>
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleUpload(e.target.files);
                e.target.value = "";
              }
            }}
          />
          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-800 transition-colors">
            {uploading ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="h-3 w-3" /> Upload Files</>
            )}
          </span>
        </label>
      </div>
      <p className="text-xs text-neutral-500 mb-2">Upload screenshots, code files, or other evidence (click, or paste).</p>
      {uploadedFiles.length > 0 && (
        <div className="space-y-1">
          {uploadedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-neutral-50 dark:bg-neutral-800 rounded px-2 py-1.5">
              <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1 truncate">
                {f.name}
              </a>
              {!disabled && (
                <button onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700 p-0.5">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to render inputs (copied/adapted from Revision.tsx)
function renderInput(subQ: SubQuestion, currentInput: Record<string, string>, onChange: (key: string, val: string) => void) {
    if (subQ.maxMarks === 0) return null;

    const getRequirementBadge = (req?: "programming-language" | "design-notation" | "either") => {
        if (req === "programming-language") {
          return (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900/50 w-fit mb-2">
              <Code2 className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Must Use: Programming Language</span>
            </div>
          );
        }
        if (req === "design-notation") {
          return (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900/50 w-fit mb-2">
              <FileEdit className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Must Use: Design Notation</span>
            </div>
          );
        }
        return null;
    };

    if (subQ.inputStyle === "code-editor") {
      const isProgrammingOnly = subQ.codeRequirement === "programming-language";
      const placeholderText = isProgrammingOnly 
        ? "// Write your code here..." 
        : "// Write your code or design notation here...";

      const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const target = e.target as HTMLTextAreaElement;
          const start = target.selectionStart;
          const end = target.selectionEnd;
          const value = target.value;

          if (e.shiftKey) {
            if (value.substring(start - 4, start) === "    ") {
              const newValue = value.substring(0, start - 4) + value.substring(end);
              onChange("main", newValue);
              setTimeout(() => {
                target.selectionStart = target.selectionEnd = start - 4;
              }, 0);
            }
          } else {
            const newValue = value.substring(0, start) + "    " + value.substring(end);
            onChange("main", newValue);
            setTimeout(() => {
              target.selectionStart = target.selectionEnd = start + 4;
            }, 0);
          }
        }
      };

      return (
        <div className="space-y-2 mt-4">
          {getRequirementBadge(subQ.codeRequirement)}
          <div className="relative">
            <Textarea 
              placeholder={placeholderText}
              className="min-h-[200px] text-base font-mono p-4 resize-y bg-neutral-900 text-neutral-100 border-neutral-800 focus:border-red-500"
              value={currentInput["main"] || ""}
              onChange={(e) => onChange("main", e.target.value)}
              onKeyDown={handleCodeKeyDown}
              spellCheck={false}
            />
            <div className="absolute bottom-3 right-3 text-xs text-neutral-500">
              Tab to indent
            </div>
          </div>
        </div>
      );
    }

    if (subQ.inputStyle === "labeled-inputs" && subQ.inputConfig) {
      return (
        <div className="space-y-3 mt-4 w-full">
          {subQ.inputConfig.fields?.map((field, i) => (
            <div key={i} className="flex w-full items-center gap-4">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 shrink-0 whitespace-nowrap">
                {field.label}
              </label>
              <Input 
                value={currentInput[field.key] || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="flex-1 min-w-0 bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm"
              />
            </div>
          ))}
        </div>
      );
    }

    if (subQ.inputStyle === "design-choice") {
        const activeMode = currentInput["design_mode"] || "pseudocode";
        
        return (
            <div className="space-y-4 mt-4">
                <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name={`mode-${subQ.id}`} 
                            checked={activeMode === "pseudocode"}
                            onChange={() => onChange("design_mode", "pseudocode")}
                            className="w-4 h-4 text-red-600"
                        />
                        <span className="text-sm font-medium">Pseudocode</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name={`mode-${subQ.id}`} 
                            checked={activeMode === "diagram"}
                            onChange={() => onChange("design_mode", "diagram")}
                            className="w-4 h-4 text-red-600"
                        />
                        <span className="text-sm font-medium">Structure Diagram</span>
                    </label>
                </div>

                {activeMode === "pseudocode" ? (
                    <Textarea 
                        placeholder="Write your pseudocode here..."
                        className="min-h-[200px] text-base font-mono p-4 bg-neutral-900 text-neutral-100 border-neutral-800"
                        value={currentInput["main"] || ""}
                        onChange={(e) => onChange("main", e.target.value)}
                    />
                ) : (
                    <div className="h-[500px] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
                        <DiagramEditor 
                            initialData={currentInput["drawing"]}
                            initialDrawing={currentInput["drawing_canvas"]}
                            onChange={(data, drawing) => {
                                onChange("drawing", data);
                                onChange("drawing_canvas", drawing);
                            }}
                            backgroundUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
                            mode="structure-diagram"
                        />
                    </div>
                )}
            </div>
        );
    }

    if (subQ.inputStyle === "drawing") {
        // Determine diagram mode based on question content
        const questionText = subQ.questionText.toLowerCase();
        let diagramMode: "flowchart" | "database" | "wireframe" | "general" = "general";
        if (questionText.includes("entity") || questionText.includes("relationship") || questionText.includes("database") || questionText.includes("erd")) {
          diagramMode = "database";
        } else if (questionText.includes("user interface") || questionText.includes("wireframe") || questionText.includes("ui design") || questionText.includes("browser")) {
          diagramMode = "wireframe";
        }
        
        return (
            <div className="space-y-2 mt-4 h-[500px] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
                <DiagramEditor 
                    initialData={currentInput["drawing"]}
                    initialDrawing={currentInput["drawing_canvas"]}
                    onChange={(data, drawing) => {
                        onChange("drawing", data);
                        onChange("drawing_canvas", drawing);
                    }}
                    backgroundUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
                    mode={diagramMode}
                />
            </div>
        );
    }

    if (subQ.inputStyle === "erd-annotation" && subQ.inputConfig?.baseErdDiagram) {
      return (
        <div className="space-y-2 mt-4 h-[500px] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
          <DiagramEditor 
            initialData={currentInput["erd_diagram"]}
            initialDrawing={currentInput["erd_drawing"]}
            baseDiagram={subQ.inputConfig.baseErdDiagram}
            onChange={(data, drawing) => {
              onChange("erd_diagram", data);
              onChange("erd_drawing", drawing);
            }}
            backgroundUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
            mode="erd-annotation"
          />
        </div>
      );
    }

    if (subQ.inputStyle === "nav-structure") {
      return (
        <div className="space-y-2 mt-4 h-[500px] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
          <DiagramEditor 
            initialData={currentInput["drawing"]}
            initialDrawing={currentInput["drawing_canvas"]}
            baseDiagram={subQ.inputConfig?.baseNavDiagram}
            onChange={(data, drawing) => {
              onChange("drawing", data);
              onChange("drawing_canvas", drawing);
            }}
            backgroundUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
            mode="nav-structure"
          />
        </div>
      );
    }

    if (subQ.inputStyle === "nav-structure-higher") {
      return (
        <div className="space-y-2 mt-4 h-[500px] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
          <DiagramEditor 
            initialData={currentInput["drawing"]}
            initialDrawing={currentInput["drawing_canvas"]}
            baseDiagram={subQ.inputConfig?.baseNavDiagram}
            onChange={(data, drawing) => {
              onChange("drawing", data);
              onChange("drawing_canvas", drawing);
            }}
            backgroundUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
            mode="nav-structure-higher"
          />
        </div>
      );
    }

    if (subQ.inputStyle === "structure-dataflow") {
      return (
        <div className="space-y-2 mt-4 h-[500px] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
          <DiagramEditor 
            initialData={currentInput["drawing"]}
            initialDrawing={currentInput["drawing_canvas"]}
            baseDiagram={subQ.inputConfig?.baseStructureDiagram}
            onChange={(data, drawing) => {
              onChange("drawing", data);
              onChange("drawing_canvas", drawing);
            }}
            backgroundUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
            mode="structure-dataflow"
          />
        </div>
      );
    }

    if (subQ.inputStyle === "form-wireframe") {
      return (
        <div className="mt-4">
          <DiagramEditor 
            initialData={currentInput["drawing"]}
            initialDrawing={currentInput["drawing_canvas"]}
            onChange={(dataStr, drawingStr) => {
              onChange("drawing", dataStr);
              onChange("drawing_canvas", drawingStr);
            }}
            backgroundUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
            mode="form-wireframe"
          />
        </div>
      );
    }

    if (subQ.inputStyle === "table" && subQ.inputConfig) {
      if (subQ.inputConfig.grid) {
        const grid = subQ.inputConfig.grid;

        const handleTableCellChange = (cellKey: string, newValue: string, starterText?: string) => {
          if (starterText && !newValue.startsWith(starterText)) {
            if (newValue.length < starterText.length) {
              onChange(cellKey, starterText);
              return;
            }
          }
          let v = newValue;
          v = v.replace(/^(- |(\* ))/gm, "• ");
          onChange(cellKey, v);
        };

        const handleTableKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, cellKey: string, starterText?: string) => {
          const textarea = e.currentTarget;
          const val = textarea.value;
          const pos = textarea.selectionStart;
          const starterLen = starterText ? starterText.length : 0;
          if ((e.key === "Backspace" || e.key === "Delete") && pos <= starterLen) {
            e.preventDefault();
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            const before = val.substring(0, pos);
            const after = val.substring(textarea.selectionEnd);
            const lastLine = before.split("\n").pop() || "";
            const isBulletLine = /^[\s]*(•|- |\* )/.test(lastLine);
            const addBullet = isBulletLine ? "• " : "";
            const newVal = before + "\n" + addBullet + after;
            onChange(cellKey, newVal);
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = pos + 1 + addBullet.length;
            }, 0);
          }
        };

        const colWidths = grid.colWidths as string[] | undefined;
        const rowMinHeights = grid.rowMinHeights as string[] | undefined;
        const showHeaders = grid.showHeaders !== false;

        return (
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4">
            <table className="w-full text-left text-sm">
              {showHeaders && (
                <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <tr>
                    {grid.headers.map((header: string, i: number) => (
                      <th key={i} className="px-4 py-3 font-medium" style={{ ...(colWidths?.[i] && colWidths[i] !== "auto" ? { width: colWidths[i] } : {}), whiteSpace: "pre-wrap", wordWrap: "break-word" }}>{header}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {grid.rows.map((row: { cells: Array<{ key?: string; value?: string; isInput?: boolean; isHeading?: boolean; multiline?: boolean; placeholder?: string; width?: string; starterText?: string; colSpan?: number; rowSpan?: number; hidden?: boolean }> }, rowIdx: number) => {
                  const rowH = rowMinHeights?.[rowIdx];
                  return (
                  <tr key={rowIdx}>
                    {row.cells.map((cell: { key?: string; value?: string; isInput?: boolean; isHeading?: boolean; multiline?: boolean; placeholder?: string; width?: string; starterText?: string; colSpan?: number; rowSpan?: number; hidden?: boolean }, cellIdx: number) => {
                      if (cell.hidden) return null;
                      const cellKey = cell.key || `cell_${rowIdx}_${cellIdx}`;
                      const starter = cell.starterText || "";
                      const colW = colWidths?.[cellIdx];
                      const tdStyle: React.CSSProperties = { verticalAlign: 'top', whiteSpace: "pre-wrap", wordWrap: "break-word" };
                      if (colW && colW !== "auto") tdStyle.width = colW;
                      if (rowH && rowH !== "auto") tdStyle.minHeight = rowH;
                      const spanProps: { colSpan?: number; rowSpan?: number } = {};
                      if (cell.colSpan && cell.colSpan > 1) spanProps.colSpan = cell.colSpan;
                      if (cell.rowSpan && cell.rowSpan > 1) spanProps.rowSpan = cell.rowSpan;

                      if (cell.isHeading) {
                        return (
                          <td key={cellIdx} className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-700 dark:text-neutral-300" style={tdStyle} {...spanProps}>
                            {(cell.value || "").split("\n").map((line, li) => {
                              const isBullet = /^\s*[•\-\*]\s/.test(line);
                              return <div key={li} style={isBullet ? { paddingLeft: "1.2em", textIndent: "-1.2em" } : undefined}>{line || "\u00A0"}</div>;
                            })}
                          </td>
                        );
                      }

                      if (cell.isInput) {
                        const currentVal = currentInput[cellKey] !== undefined ? currentInput[cellKey] : starter;
                        return (
                          <td key={cellIdx} className="px-4 py-2 bg-white dark:bg-neutral-900" style={tdStyle} {...spanProps}>
                            <div className="relative">
                              {cell.key && (
                                <span className="absolute -top-1 -left-1 text-[9px] font-bold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-1 rounded z-10">
                                  {cell.key}
                                </span>
                              )}
                              <Textarea
                                placeholder={cell.placeholder || "Enter answer..."}
                                value={currentVal}
                                onChange={(e) => handleTableCellChange(cellKey, e.target.value, starter)}
                                onKeyDown={(e) => handleTableKeyDown(e, cellKey, starter)}
                                className="min-h-[60px] bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm resize-y text-sm"
                                style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", ...(rowH && rowH !== "auto" ? { minHeight: rowH } : {}) }}
                              />
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={cellIdx} className="px-4 py-3 bg-white dark:bg-neutral-900" style={tdStyle} {...spanProps}>
                          <span className="text-neutral-700 dark:text-neutral-300">
                            {(cell.value || "").split("\n").map((line, li) => {
                              const isBullet = /^\s*[•\-\*]\s/.test(line);
                              return <div key={li} style={isBullet ? { paddingLeft: "1.2em", textIndent: "-1.2em" } : undefined}>{line || "\u00A0"}</div>;
                            })}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
      
      if (subQ.inputConfig.columns) {
        const numRows = subQ.inputConfig.inputRows || 1;
        return (
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                <tr>
                  {subQ.inputConfig.columns.map((col: { key: string; header: string; width?: string }, i: number) => (
                    <th key={i} className="px-4 py-3 font-medium" style={col.width ? { width: col.width } : undefined}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {Array.from({ length: numRows }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="bg-white dark:bg-neutral-900">
                    {subQ.inputConfig!.columns!.map((col: { key: string; header: string; width?: string }, colIdx: number) => {
                      const key = numRows > 1 ? `${col.key}_${rowIdx + 1}` : col.key;
                      return (
                        <td key={colIdx} className="px-4 py-3">
                          <Input
                            placeholder={`Enter ${col.header.toLowerCase()}...`}
                            value={currentInput[key] || ""}
                            onChange={(e) => onChange(key, e.target.value)}
                            className="bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      
      if (subQ.inputConfig.rows) {
        return (
          <div className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4">
            <div className="grid w-full" style={{ gridTemplateColumns: 'max-content 1fr' }}>
              {subQ.inputConfig.rows.map((row: { key?: string; label: string; value?: string; isInput?: boolean; multiline?: boolean }, i: number) => (
                <Fragment key={i}>
                  <div className="px-4 py-3 font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 whitespace-nowrap border-b border-neutral-200 dark:border-neutral-700 flex items-center">
                    {row.label}
                  </div>
                  <div className="px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
                    {row.isInput ? (
                      row.multiline ? (
                        <Textarea
                          placeholder="Enter answer..."
                          value={currentInput[row.key!] || ""}
                          onChange={(e) => onChange(row.key!, e.target.value)}
                          className="w-full min-h-[100px] bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm resize-y"
                        />
                      ) : (
                        <Input
                          placeholder="Enter answer..."
                          value={currentInput[row.key!] || ""}
                          onChange={(e) => onChange(row.key!, e.target.value)}
                          className="w-full bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm"
                        />
                      )
                    ) : (
                      <span className="text-neutral-700 dark:text-neutral-300">{row.value || ""}</span>
                    )}
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        );
      }
    }

    return (
        <Textarea 
            placeholder="Type your answer here..."
            className="min-h-[100px]"
            value={currentInput["main"] || ""}
            onChange={(e) => onChange("main", e.target.value)}
        />
    );
}
