import { useState, useEffect, useRef, ReactNode, Fragment } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuestions } from "@/lib/QuestionContext";
import { Question, SubQuestion, ContentBlock, DataTableCell, DataTableCellRole } from "@/lib/past-papers";
import { handleTabKey } from "@/components/QuestionInput";

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
import { Badge } from "@/components/ui/badge";
import type { DiagramItem } from "@/components/ui/diagram-editor";
import { DiagramImageInput, DIAGRAM_HINTS } from "@/components/ui/diagram-image-input";
import { RowLayout, RowLayoutItem } from "@/components/ui/row-layout";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Clock, AlertTriangle, CheckCircle2, Code2, FileEdit, PauseCircle, XCircle } from "lucide-react";
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
import { useStudentAuth } from "@/components/StudentAuthContext";

// Helper function to format inline text with **bold**, *italic*, and `code` (monospace)
function formatInlineText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let key = 0;
  
  const combinedRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\^([^^]+?)\^)/g;
  
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
    } else if (fullMatch.startsWith('^') && fullMatch.endsWith('^')) {
      parts.push(<sup key={key++}>{fullMatch.slice(1, -1)}</sup>);
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

// Helper to extract alignment from line
function extractAlignment(line: string): { content: string; align: "left" | "center" | "right" } {
  if (line.startsWith("[center]")) {
    return { content: line.slice(8), align: "center" };
  } else if (line.startsWith("[right]")) {
    return { content: line.slice(7), align: "right" };
  } else if (line.startsWith("[left]")) {
    return { content: line.slice(6), align: "left" };
  }
  return { content: line, align: "left" };
}

// Helper function to format text with paragraphs, bullet points (with nesting), **bold**, *italic*, `code`, and alignment
function formatText(text: string): ReactNode {
  let keyCounter = 0;
  
  const lines = text.split('\n');
  const elements: ReactNode[] = [];
  let currentBulletItems: { content: string; isNumbered: boolean; level: number }[] = [];
  let currentParagraphLines: { content: string; align: "left" | "center" | "right" }[] = [];
  
  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      // Group consecutive lines with same alignment
      let currentAlign = currentParagraphLines[0].align;
      let currentGroup: string[] = [];
      
      for (const line of currentParagraphLines) {
        if (line.align === currentAlign) {
          currentGroup.push(line.content);
        } else {
          // Flush current group
          if (currentGroup.length > 0) {
            const alignClass = currentAlign === "center" ? "text-center" : currentAlign === "right" ? "text-right" : "";
            elements.push(
              <p key={keyCounter++} className={`mb-5 ${alignClass}`}>
                {formatInlineText(currentGroup.join('\n'))}
              </p>
            );
          }
          currentAlign = line.align;
          currentGroup = [line.content];
        }
      }
      // Flush remaining
      if (currentGroup.length > 0) {
        const alignClass = currentAlign === "center" ? "text-center" : currentAlign === "right" ? "text-right" : "";
        elements.push(
          <p key={keyCounter++} className={`mb-5 ${alignClass}`}>
            {formatInlineText(currentGroup.join('\n'))}
          </p>
        );
      }
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
      const { content, align } = extractAlignment(line);
      currentParagraphLines.push({ content, align });
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

export default function TimedExam() {
  const [match, params] = useRoute("/timed-exam/:year/:optionalSection");
  const [, setLocation] = useLocation();
  const { questions, loading: questionsLoading } = useQuestions();
  const { toast } = useToast();
  const { isLoggedIn: studentLoggedIn, studentId: authStudentId } = useStudentAuth();
  
  const isQuizMode = params?.year === "quiz";
  const isStudentQuizMode = params?.year === "student-quiz";
  const isAdditionalExamMode = params?.year?.startsWith("additional-") || params?.year === "additional";
  const additionalPaperId = params?.year?.startsWith("additional-") ? params.year.replace("additional-", "") : undefined;
  const quizId = (isQuizMode || isStudentQuizMode) ? params?.optionalSection : undefined;
  const year = (isQuizMode || isStudentQuizMode || isAdditionalExamMode) ? 0 : parseInt(params?.year || "0");
  const optionalSection = (isQuizMode || isStudentQuizMode) ? undefined : params?.optionalSection as "dd" | "wd" | undefined;
  
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 1 hour 30 minutes in seconds
  const [extraTimeAdded, setExtraTimeAdded] = useState<string | null>(null); // Track which extra time option was used
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({}); // questionId -> subQuestionId -> answer
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingProgress, setGradingProgress] = useState(0);
  const [gradingTotal, setGradingTotal] = useState(0);
  const [quizName, setQuizName] = useState<string>("");
  const [additionalPaperName, setAdditionalPaperName] = useState<string>("");
  const quizInitializedRef = useRef(false);

  useEffect(() => {
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
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (serverRes.ok) {
                  const serverData = await serverRes.json();
                  if (serverData && serverData.userInputs && serverData.examType === "quiz" && serverData.examIdentifier === quizId) {
                    const response = await fetch(`/api/custom-quizzes/${quizId}/questions`);
                    if (response.ok) {
                      const data = await response.json();
                      setQuizName(data.quiz.name);
                      setExamQuestions(data.questions);
                      setTimeLeft(serverData.timeLeft);
                      setUserInputs(serverData.userInputs as Record<string, Record<string, string>>);
                      setCurrentQuestionIndex(serverData.currentQuestion || 0);
                      if (serverData.extraTimeAdded) setExtraTimeAdded(serverData.extraTimeAdded);
                      toast({ title: "Quiz Resumed", description: "Your progress has been restored from your account." });
                      localStorage.removeItem("paused_quiz");
                      resumedFromServer = true;
                      return;
                    }
                  }
                }
              } catch (e) { console.error("Failed to resume quiz from server:", e); }
            }
            if (!resumedFromServer) {
              const pausedQuiz = localStorage.getItem("paused_quiz");
              if (pausedQuiz) {
                try {
                  const pausedData = JSON.parse(pausedQuiz);
                  if (pausedData.quizId === quizId) {
                    const response = await fetch(`/api/custom-quizzes/${quizId}/questions`);
                    if (response.ok) {
                      const data = await response.json();
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
                } catch (e) { console.error("Failed to resume quiz", e); }
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
              headers: { Authorization: `Bearer ${token}` },
            });
            if (serverRes.ok) {
              const serverData = await serverRes.json();
              if (serverData && serverData.userInputs && serverData.examType === "student-quiz" && serverData.examIdentifier === quizId) {
                const storedQuiz = localStorage.getItem("student_current_quiz");
                if (storedQuiz) {
                  const quizData = JSON.parse(storedQuiz);
                  if (quizData.id === quizId) {
                    setExamQuestions(quizData.questions || []);
                    setQuizName(quizData.name || "My Quiz");
                    setTimeLeft(serverData.timeLeft);
                    setUserInputs(serverData.userInputs as Record<string, Record<string, string>>);
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
          } catch (e) { console.error("Failed to resume student quiz from server:", e); }
        }
        if (!resumedFromServer) {
          const pausedQuiz = localStorage.getItem("paused_student_quiz");
          if (pausedQuiz) {
            try {
              const pausedData = JSON.parse(pausedQuiz);
              if (pausedData.quizId === quizId) {
                const storedQuiz = localStorage.getItem("student_current_quiz");
                if (storedQuiz) {
                  const quizData = JSON.parse(storedQuiz);
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
            } catch (e) { console.error("Failed to resume student quiz", e); }
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
            // Use the student's custom time limit (in minutes), default to 30 if not set
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
      fetch("/api/additional-papers/published").then(r => r.json()).then((papers: any[]) => {
        const paper = papers.find((p: any) => p.id === additionalPaperId);
        if (paper) setAdditionalPaperName(paper.name);
      }).catch(() => {});
      const fetchExamQuestions = async () => {
        try {
          const headers: Record<string, string> = {};
          const studentToken = localStorage.getItem("studentToken");
          if (studentToken) headers["Authorization"] = `Bearer ${studentToken}`;
          const resp = await fetch(`/api/questions?forExamPaper=${additionalPaperId}`, { headers });
          if (resp.ok) {
            const allQs = await resp.json();
            const filtered = allQs.filter((q: any) => {
              if (q.additionalPaperId !== additionalPaperId) return false;
              if (q.isPractice) return false;
              if (q.topic === "sdcs") return true;
              if (optionalSection && q.topic === optionalSection) return true;
              return false;
            }).sort((a: any, b: any) => {
              const numA = parseInt(a.title.replace(/\D/g, '')) || 0;
              const numB = parseInt(b.title.replace(/\D/g, '')) || 0;
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
          const headers: Record<string, string> = {};
          const studentToken = localStorage.getItem("studentToken");
          if (studentToken) headers["Authorization"] = `Bearer ${studentToken}`;
          const resp = await fetch(`/api/questions?forExamPaper=all`, { headers });
          if (resp.ok) {
            const allQs = await resp.json();
            const filtered = allQs.filter((q: any) => {
              if (!q.isAdditionalExam) return false;
              if (q.isPractice) return false;
              if (q.topic === "sdcs") return true;
              if (optionalSection && q.topic === optionalSection) return true;
              return false;
            }).sort((a: any, b: any) => {
              const numA = parseInt(a.title.replace(/\D/g, '')) || 0;
              const numB = parseInt(b.title.replace(/\D/g, '')) || 0;
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
  }, [year, questions, optionalSection, isQuizMode, isStudentQuizMode, isAdditionalExamMode, additionalPaperId, quizId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isResuming = params.get("resume") === "true";
    const extraTimeParam = params.get("extraTime");

    if (isResuming) {
      const tryResumeFromServer = async () => {
        const token = localStorage.getItem("studentToken");
        const expectedExamType = isAdditionalExamMode ? "additional-paper" : "past-paper";
        const expectedIdentifier = isAdditionalExamMode ? (additionalPaperId || null) : null;
        if (token) {
          try {
            const res = await fetch("/api/student/exam-progress", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const serverData = await res.json();
              if (serverData && serverData.userInputs && serverData.examType === expectedExamType
                  && (expectedIdentifier === null || serverData.examIdentifier === expectedIdentifier)) {
                setTimeLeft(serverData.timeLeft);
                setUserInputs(serverData.userInputs as Record<string, Record<string, string>>);
                setCurrentQuestionIndex(serverData.currentQuestion || 0);
                if (serverData.extraTimeAdded) {
                  setExtraTimeAdded(serverData.extraTimeAdded);
                }
                toast({
                  title: "Exam Resumed",
                  description: "Welcome back! Your progress has been restored from your account.",
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
            const currentExamKey = isAdditionalExamMode ? (additionalPaperId ? `additional-${additionalPaperId}` : "additional") : year;
            if (data.year === currentExamKey && data.optionalSection === optionalSection) {
              setTimeLeft(data.timeLeft);
              setUserInputs(data.userInputs);
              setCurrentQuestionIndex(data.currentQuestionIndex);
              if (data.extraTimeAdded) {
                setExtraTimeAdded(data.extraTimeAdded);
              }
              toast({
                title: "Exam Resumed",
                description: "Welcome back! Your progress has been restored.",
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
            const extraSeconds = Math.round((baseTime * percentage) / 100);
            setTimeLeft(baseTime + extraSeconds);
            setExtraTimeAdded(`${percentage}%`);
        }
    }
  }, []);

  const saveProgressToServer = async (examType: string, examIdentifier: string | null) => {
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
          extraTimeAdded: extraTimeAdded || null,
        }),
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
            Authorization: `Bearer ${localStorage.getItem("studentToken")}`,
          },
        });
        if (!res.ok) serverCleared = false;
      } catch (e) {
        console.error("Failed to delete server progress:", e);
        serverCleared = false;
      }
    }
    if (isQuizMode) {
      try { localStorage.removeItem("paused_quiz"); } catch {}
      setLocation("/practice-quizzes");
    } else if (isStudentQuizMode) {
      try { localStorage.removeItem("paused_student_quiz"); } catch {}
      setLocation("/my-quizzes");
    } else {
      try { localStorage.removeItem("paused_exam"); } catch {}
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
        timestamp: new Date().toISOString()
      };
      try { localStorage.setItem("paused_quiz", JSON.stringify(state)); } catch (e) { console.error("Failed to save paused quiz:", e); }
      if (studentLoggedIn) await saveProgressToServer("quiz", quizId || null);
      toast({
        title: "Quiz Paused",
        description: studentLoggedIn
          ? "Your progress has been saved to your account. You can resume on any device."
          : "Your progress has been saved. You can resume later from the Practice Quizzes page.",
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
        timestamp: new Date().toISOString()
      };
      try { localStorage.setItem("paused_student_quiz", JSON.stringify(state)); } catch (e) { console.error("Failed to save paused quiz:", e); }
      if (studentLoggedIn) await saveProgressToServer("student-quiz", quizId || null);
      toast({
        title: "Quiz Paused",
        description: studentLoggedIn
          ? "Your progress has been saved to your account. You can resume on any device."
          : "Your progress has been saved. You can resume later from My Quizzes.",
      });
      setLocation("/my-quizzes");
    } else {
      const examKey = isAdditionalExamMode ? (additionalPaperId ? `additional-${additionalPaperId}` : "additional") : year;
      const state = {
        year: examKey,
        optionalSection,
        timeLeft,
        userInputs,
        currentQuestionIndex,
        extraTimeAdded,
        timestamp: new Date().toISOString()
      };
      try { localStorage.setItem("paused_exam", JSON.stringify(state)); } catch (e) { console.error("Failed to save paused exam:", e); }
      if (studentLoggedIn) {
        const examType = isAdditionalExamMode ? "additional-paper" : "past-paper";
        const examIdentifier = isAdditionalExamMode ? (additionalPaperId || null) : null;
        await saveProgressToServer(examType, examIdentifier);
      }
      toast({
        title: "Exam Paused",
        description: studentLoggedIn
          ? "Your progress has been saved to your account. You can resume on any device."
          : "Your progress has been saved. You can resume later from the Timed Exam menu.",
      });
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

  // ... (rest of component)

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Refactored answer state handling
  const [userInputs, setUserInputs] = useState<Record<string, Record<string, string>>>({});

  const progressStateRef = useRef({ timeLeft: 0, currentQuestionIndex: 0, userInputs: {} as Record<string, Record<string, string>>, examQuestions: [] as Question[], extraTimeAdded: null as string | null });
  progressStateRef.current = { timeLeft, currentQuestionIndex, userInputs, examQuestions, extraTimeAdded };

  useEffect(() => {
    if (!studentLoggedIn || !authStudentId || examQuestions.length === 0) return;

    const sendProgress = () => {
      const token = localStorage.getItem("studentToken");
      if (!token) return;
      const state = progressStateRef.current;

      const answeredIds: { id: string; label: string }[] = [];
      for (const q of state.examQuestions) {
        for (const sub of (q.subQuestions || [])) {
          if (sub.maxMarks > 0) {
            const inputs = state.userInputs[sub.id];
            const hasAnswer = inputs && Object.values(inputs).some(v => v && v.trim().length > 0);
            if (hasAnswer) {
              answeredIds.push({ id: sub.id, label: `${q.title} ${sub.label || ""}`.trim() });
            }
          }
          if (sub.subParts && sub.subParts.length > 0) {
            for (const part of sub.subParts) {
              if (part.maxMarks > 0) {
                const inputs = state.userInputs[part.id];
                const hasAnswer = inputs && Object.values(inputs).some(v => v && v.trim().length > 0);
                if (hasAnswer) {
                  answeredIds.push({ id: part.id, label: `${q.title} ${sub.label || ""}${part.label || ""}`.trim() });
                }
              }
            }
          }
        }
      }

      const examType = isQuizMode ? "quiz" : isStudentQuizMode ? "student-quiz" : isAdditionalExamMode ? "additional-paper" : "past-paper";
      const examIdentifier = (isQuizMode || isStudentQuizMode) ? (quizId || null) : isAdditionalExamMode ? (additionalPaperId || null) : null;

      fetch("/api/student/exam-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
          extraTimeAdded: state.extraTimeAdded || null,
        }),
      }).catch(() => {});
    };

    sendProgress();
    const interval = setInterval(sendProgress, 60000);

    return () => clearInterval(interval);
  }, [studentLoggedIn, authStudentId, examQuestions.length]);

  const updateInput = (subId: string, key: string, value: string) => {
    setUserInputs(prev => ({
      ...prev,
      [subId]: {
        ...(prev[subId] || {}),
        [key]: value
      }
    }));
  };

  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, subId: string) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
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
        } else if (mode === "diagram" && inputs["diagram_image"]) {
          return "Student submitted a diagram image (see attached image for visual grading).";
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
                  return `[BULLET_LIST: ${bulletPoints.length} bullet points: ${bulletPoints.map((p, idx) => `${idx + 1}. "${p}"`).join(", ")}]`;
                }
                if (i.type === "numbered-text" && i.content) {
                  const numberedItems = i.content.split("\n").filter(line => line.trim());
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
          const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
          const shapeItems = items.filter(i => i.type !== "line" && i.type !== "crowfoot" && i.type !== "dataflow-arrow");
          const lineItems = items.filter(i => i.type === "line" || i.type === "crowfoot" || i.type === "dataflow-arrow");

          const sortedShapes = shapeItems.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
            return a.x - b.x;
          });

          const shapeDescriptions = sortedShapes.map(i => {
            const formatting: string[] = [];
            if (i.isBold) formatting.push("bold");
            if (i.isUnderline || i.type === "link-text") formatting.push("underlined");
            if (i.fontSize && i.fontSize !== "normal") formatting.push(`size-${i.fontSize}`);
            const formatStr = formatting.length > 0 ? `, formatting: ${formatting.join("+")}` : "";
            const posStr = `at approx (${Math.round(i.x)}, ${Math.round(i.y)})`;
            const baseTag = !i.isBaseItem ? "" : " [base]";

            if (i.type === "bullet-text" && i.content) {
              const bulletPoints = i.content.split("\n").filter(line => line.trim());
              return `[BULLET_LIST ${posStr}: ${bulletPoints.length} bullet points: ${bulletPoints.map((p, idx) => `${idx + 1}. "${p}"`).join(", ")}${formatStr}]`;
            }
            if (i.type === "numbered-text" && i.content) {
              const numberedItems = i.content.split("\n").filter(line => line.trim());
              return `[NUMBERED_LIST ${posStr}: ${numberedItems.length} numbered items: ${numberedItems.map((p, idx) => `${idx + 1}. "${p}"`).join(", ")}${formatStr}]`;
            }

            const shapeLabel = i.type === "box" ? "BOX" : i.type === "ellipse" ? "ELLIPSE" : i.type === "diamond" ? "DIAMOND" : i.type === "parallelogram" ? "PARALLELOGRAM" : i.type === "circle" ? "CIRCLE" : i.type === "cylinder" ? "CYLINDER" : i.type === "hexagon" ? "HEXAGON" : i.type === "trapezoid" ? "TRAPEZOID" : i.type === "document" ? "DOCUMENT" : i.type === "text" ? "TEXT" : i.type.toUpperCase();
            const sizeStr = i.width && i.height ? `, size: ${Math.round(i.width)}x${Math.round(i.height)}` : "";
            return `[${shapeLabel}${baseTag} ${posStr}${sizeStr}: "${i.content || ''}"${formatStr}]`;
          });

          const lineDescriptions = lineItems.map(i => {
            const getLabel = (id: string | undefined) => {
              if (!id) return "?";
              const target = items.find(t => t.id === id);
              return target?.content || target?.entityName || target?.type || "?";
            };
            if (i.type === "dataflow-arrow") {
              const dir = i.dataflowDirection || "up";
              const semantic = dir === "up" ? "DATA-IN" : "DATA-OUT";
              const origin = i.originFunctionId ? getLabel(i.originFunctionId) : "?";
              const label = items.find(t => t.attachedArrowId === i.id)?.content || "";
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

          const parts: string[] = [];
          if (shapeDescriptions.length > 0) parts.push("SHAPES:\n" + shapeDescriptions.join("\n"));
          if (lineDescriptions.length > 0) parts.push("CONNECTIONS:\n" + lineDescriptions.join("\n"));
          return parts.join("\n\n");
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
      
      // Handle form-wireframe - describe form elements drawn by student
      if (sub.inputStyle === "form-wireframe" && inputs["drawing"]) {
        try {
          const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
          
          // Sort items by position (top to bottom, left to right)
          const sortedItems = items.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
            return a.x - b.x;
          });
          
          const formElements: string[] = [];
          
          // Track labels to associate with nearby input elements
          const labels = sortedItems.filter(i => i.type === "ui-label" || i.type === "text");
          
          // Helper to check if a label indicates required field (contains *)
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
            switch (item.type) {
              case "ui-label":
              case "text":
                const labelContent = item.content || 'unnamed';
                const requiredMarker = isRequiredLabel(labelContent) ? " (REQUIRED - has *)" : "";
                formElements.push(`[LABEL: "${labelContent}"${requiredMarker}]`);
                break;
              case "ui-input":
                const inputLabel = findNearestLabel(item);
                const inputRequired = inputLabel && isRequiredLabel(inputLabel.content) ? " REQUIRED" : "";
                const inputLabelStr = inputLabel ? ` for "${inputLabel.content || 'unlabeled'}"` : "";
                const inputValidationText = item.content || item.validationMessage || 
                  ((item.validationMin !== undefined || item.validationMax !== undefined) ? `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}` : "");
                const inputContent = inputValidationText ? ` with validation "${inputValidationText}"` : "";
                formElements.push(`[TEXT INPUT${inputLabelStr}${inputRequired}${inputContent}]`);
                break;
              case "ui-textarea":
                const textareaLabel = findNearestLabel(item);
                const textareaRequired = textareaLabel && isRequiredLabel(textareaLabel.content) ? " REQUIRED" : "";
                const textareaLabelStr = textareaLabel ? ` for "${textareaLabel.content || 'unlabeled'}"` : "";
                const textareaValidationText = item.content || item.validationMessage || 
                  ((item.validationMin !== undefined || item.validationMax !== undefined) ? `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}` : "");
                const textareaContent = textareaValidationText ? ` with validation "${textareaValidationText}"` : "";
                formElements.push(`[TEXTAREA${textareaLabelStr}${textareaRequired}${textareaContent}]`);
                break;
              case "ui-dropdown":
                const dropdownLabel = findNearestLabel(item);
                const dropdownRequired = dropdownLabel && isRequiredLabel(dropdownLabel.content) ? " REQUIRED" : "";
                const dropdownLabelStr = dropdownLabel ? ` for "${dropdownLabel.content || 'unlabeled'}"` : "";
                const dropdownOptionText = item.content ? ` showing "${item.content}"` : "";
                const dropdownLegacyVal = item.validationMessage || 
                  ((item.validationMin !== undefined || item.validationMax !== undefined) ? `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}` : "");
                const dropdownValidation = dropdownLegacyVal ? ` with validation "${dropdownLegacyVal}"` : "";
                formElements.push(`[DROPDOWN${dropdownLabelStr}${dropdownRequired}${dropdownOptionText}${dropdownValidation}]`);
                break;
              case "ui-radio":
                formElements.push(`[RADIO BUTTON: "${item.content || 'option'}"]`);
                break;
              case "ui-checkbox":
                formElements.push(`[CHECKBOX: "${item.content || 'option'}"]`);
                break;
              case "ui-submit":
                formElements.push(`[SUBMIT BUTTON: "${item.content || 'Submit'}"]`);
                break;
            }
          }
          
          return `FORM ELEMENTS (in order from top to bottom, note: * in a label indicates a REQUIRED field):\n${formElements.join("\n")}`;
        } catch (e) {
          return "";
        }
      }

      if (sub.inputStyle === "webpage-wireframe" && inputs["drawing"]) {
        try {
          const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
          const sortedItems = [...items].filter(i => i.type !== "line").sort((a, b) => {
            if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
            return a.x - b.x;
          });
          const pageElements: string[] = [];
          for (const item of sortedItems) {
            const pos = `at (${Math.round(item.x)}, ${Math.round(item.y)})`;
            const size = item.width && item.height ? ` size ${Math.round(item.width)}x${Math.round(item.height)}` : "";
            switch (item.type) {
              case "wf-heading":
                pageElements.push(`[HEADING ${pos}${size}: "${item.content || 'untitled'}"]`);
                break;
              case "wf-paragraph":
                pageElements.push(`[PARAGRAPH ${pos}${size}]`);
                break;
              case "ui-image":
                pageElements.push(`[IMAGE ${pos}${size}: "${item.content || 'image'}"]`);
                break;
              case "link-text":
                pageElements.push(`[LINK ${pos}: "${item.content || 'link'}"]`);
                break;
              case "bullet-text":
                pageElements.push(`[BULLET LIST ${pos}: "${item.content || 'list'}"]`);
                break;
              case "numbered-text":
                pageElements.push(`[NUMBERED LIST ${pos}: "${item.content || 'list'}"]`);
                break;
              case "wf-audio":
                pageElements.push(`[AUDIO PLAYER ${pos}${size}: "${item.content || 'audio'}"]`);
                break;
              case "wf-video":
                pageElements.push(`[VIDEO PLAYER ${pos}${size}: "${item.content || 'video'}"]`);
                break;
              case "wf-div":
                pageElements.push(`[CONTAINER/DIV ${pos}${size}: "${item.content || ''}"]`);
                break;
              case "wf-annotation":
                pageElements.push(`[ANNOTATION ${pos}: "${item.content || ''}"]`);
                break;
              case "ui-label":
                pageElements.push(`[LABEL ${pos}: "${item.content || ''}"]`);
                break;
              case "text":
                pageElements.push(`[TEXT ${pos}: "${item.content || '(no label)'}"]`);
                break;
              case "box":
                pageElements.push(`[BOX ${pos}${size}: "${item.content || '(no label)'}"]`);
                break;
              default:
                pageElements.push(`[${item.type.toUpperCase()} ${pos}: "${item.content || '(no label)'}"]`);
                break;
            }
          }
          return `WEBPAGE WIREFRAME ELEMENTS (in order from top to bottom):\n${pageElements.join("\n")}\nTotal elements: ${pageElements.length}`;
        } catch (e) {
          return "";
        }
      }
      
      if (inputs["diagram_image"]) {
        return "Student submitted a diagram image (see attached image for visual grading).";
      }
      return Object.entries(inputs)
        .filter(([key]) => key !== "diagram_image")
        .map(([, val]) => val)
        .join("\n");
    };

    try {
      // Collect all sub-questions for parallel grading
      const allSubQuestions: { q: Question; sub: SubQuestion; inputs: Record<string, string> }[] = [];
      
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

      // Initialize progress tracking
      setGradingTotal(allSubQuestions.length);
      setGradingProgress(0);

      // Grade helper function
      const gradeSubQuestion = async ({ q, sub, inputs }: { q: Question; sub: SubQuestion; inputs: Record<string, string> }) => {
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
        
        // Build nav-structure (N5) example answer context if applicable
        const navExampleContext = sub.inputStyle === "nav-structure" && sub.inputConfig?.navExampleData
          ? (() => {
              try {
                const items = JSON.parse(sub.inputConfig.navExampleData!) as DiagramItem[];
                const pages = items
                  .filter((i: any) => i.type === "nav-page" || i.type === "box")
                  .sort((a: any, b: any) => {
                    if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
                    return a.x - b.x;
                  });
                const lines = items.filter((i: any) => i.type === "line");
                const pageDescs = pages.map((p: any) => `"${p.content || "unnamed"}"`);
                const connections = lines.map((line: any) => {
                  const from = pages.find((p: any) => p.id === line.connectedTo1);
                  const to = pages.find((p: any) => p.id === line.connectedTo2);
                  const arrowDesc = line.arrowEnd === "both" ? "<->" : "->";
                  return `"${from?.content || "?"}" ${arrowDesc} "${to?.content || "?"}"`;
                });
                return `\nEXPECTED NAVIGATION STRUCTURE (teacher-defined example answer - compare student answer to this):\nExpected Pages: ${pageDescs.join(", ")}\nExpected Links: ${connections.join(", ") || "none"}`;
              } catch (e) {
                return "";
              }
            })()
          : "";

        let wireframeExampleContext = "";
        if ((sub.inputStyle === "webpage-wireframe" || sub.inputStyle === "form-wireframe") && sub.inputConfig?.wireframeExampleData) {
          try {
            const exampleItems = JSON.parse(sub.inputConfig.wireframeExampleData) as DiagramItem[];
            const sorted = exampleItems.sort((a, b) => {
              if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
              return a.x - b.x;
            });
            const descriptions: string[] = [];
            for (const item of sorted) {
              const pos = `at (${Math.round(item.x)}, ${Math.round(item.y)})`;
              const size = item.width && item.height ? ` size ${Math.round(item.width)}x${Math.round(item.height)}` : "";
              switch (item.type) {
                case "wf-heading": descriptions.push(`[HEADING ${pos}${size}: "${item.content || ''}"]`); break;
                case "wf-paragraph": descriptions.push(`[PARAGRAPH ${pos}${size}]`); break;
                case "wf-audio": descriptions.push(`[AUDIO PLAYER ${pos}${size}: "${item.content || ''}"]`); break;
                case "wf-video": descriptions.push(`[VIDEO PLAYER ${pos}${size}: "${item.content || ''}"]`); break;
                case "wf-div": descriptions.push(`[CONTAINER/DIV ${pos}${size}: "${item.content || ''}"]`); break;
                case "wf-annotation": descriptions.push(`[ANNOTATION ${pos}: "${item.content || ''}"]`); break;
                case "ui-image": descriptions.push(`[IMAGE ${pos}${size}: "${item.content || ''}"]`); break;
                case "link-text": descriptions.push(`[LINK ${pos}: "${item.content || ''}"]`); break;
                case "bullet-text": descriptions.push(`[BULLET LIST ${pos}: "${item.content || ''}"]`); break;
                case "numbered-text": descriptions.push(`[NUMBERED LIST ${pos}: "${item.content || ''}"]`); break;
                case "ui-label": descriptions.push(`[LABEL ${pos}: "${item.content || ''}"]`); break;
                case "text": descriptions.push(`[TEXT ${pos}: "${item.content || ''}"]`); break;
                case "box": descriptions.push(`[BOX ${pos}${size}: "${item.content || ''}"]`); break;
                case "ui-input": descriptions.push(`[TEXT INPUT ${pos}: "${item.content || ''}"]`); break;
                case "ui-textarea": descriptions.push(`[TEXTAREA ${pos}: "${item.content || ''}"]`); break;
                case "ui-dropdown": descriptions.push(`[DROPDOWN ${pos}: "${item.content || ''}"]`); break;
                case "ui-radio": descriptions.push(`[RADIO ${pos}: "${item.content || ''}"]`); break;
                case "ui-checkbox": descriptions.push(`[CHECKBOX ${pos}: "${item.content || ''}"]`); break;
                case "ui-submit": descriptions.push(`[SUBMIT BUTTON ${pos}: "${item.content || ''}"]`); break;
                default: descriptions.push(`[${item.type.toUpperCase()} ${pos}: "${item.content || ''}"]`);
              }
            }
            if (descriptions.length > 0) {
              wireframeExampleContext = `\nTEACHER'S EXAMPLE WIREFRAME (expected answer - the student should have the same types of elements in approximately the same positions):\n${descriptions.join("\n")}\nTotal expected elements: ${descriptions.length}`;
            }
          } catch (e) {}
        }

        const fullContext = [
          `${q.title}${sub.label ? ` ${sub.label}` : ""}: ${questionContent}`,
          formExpectationsContext,
          wireframeExampleContext,
          navExampleContext,
          siblingContext ? `\nOTHER PARTS OF THIS QUESTION (for context - grade ONLY the current part):\n${siblingContext}` : ""
        ].filter(Boolean).join("\n\n");
        
        let score = 0;
        if (studentAnswer.trim()) {
          try {
            const diagramInputStyles = ["drawing", "structure-dataflow", "erd-annotation", "form-wireframe", "webpage-wireframe", "nav-structure", "nav-structure-higher", "design-choice", "structure-diagram", "entity-occurrence-diagram"];
            const isDiagram = diagramInputStyles.includes(sub.inputStyle || "");
            const studentDiagramImage = isDiagram ? (inputs["diagram_image"] || "") : "";

            const response = await fetch("/api/grade-answer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                studentAnswer: studentAnswer.trim(),
                markingScheme: sub.markingScheme,
                maxMarks: sub.maxMarks,
                questionContext: fullContext,
                aiGuidance: sub.aiGuidance,
                studentDiagramImage: studentDiagramImage || undefined
              })
            });

            if (response.ok) {
              const result = await response.json();
              score = result.marks;
              const normFeedback = (v: any) => !v ? "" : typeof v === "string" ? v : Array.isArray(v) ? v.join("\n") : String(v);
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
          score: score,
          userAnswer: inputs,
          inputStyle: sub.inputStyle,
          feedback: "",
          suggestions: ""
        };
      };

      // Grade sub-questions in batches of 5 for speed while showing progress
      const BATCH_SIZE = 5;
      const results: Awaited<ReturnType<typeof gradeSubQuestion>>[] = [];
      
      for (let i = 0; i < allSubQuestions.length; i += BATCH_SIZE) {
        const batch = allSubQuestions.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(gradeSubQuestion));
        results.push(...batchResults);
        setGradingProgress(Math.min(i + BATCH_SIZE, allSubQuestions.length));
      }
      
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

    // Save results to localStorage to retrieve in results page
    // Strip drawing_canvas base64 data to avoid exceeding localStorage quota
    const cleanBreakdown = breakdown.map((item: any) => {
      if (item.userAnswer && typeof item.userAnswer === "object" && !Array.isArray(item.userAnswer)) {
        const { drawing_canvas, ...rest } = item.userAnswer;
        return { ...item, userAnswer: rest };
      }
      return item;
    });
    const examTitle = isQuizMode || isStudentQuizMode
        ? (quizName || "Quiz")
        : isAdditionalExamMode
        ? (additionalPaperName || "Mock Exam")
        : `${year}`;
    const resultData = {
        year,
        examTitle,
        totalScore,
        maxScore, 
        breakdown: cleanBreakdown,
        timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem("last_exam_result", JSON.stringify(resultData));
    } catch (e) {
      console.error("Failed to save exam results to localStorage:", e);
    }

    // Save exam results to server (for logged-in students, result is linked to their account)
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
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
          additionalPaperId: isAdditionalExamMode ? (additionalPaperId || null) : null,
        }),
      });
    } catch (err) {
      console.error("Failed to save exam results to server:", err);
    }

    if (studentLoggedIn) {
      const progressToken = localStorage.getItem("studentToken");
      if (progressToken) {
        fetch("/api/student/exam-progress", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${progressToken}` },
        }).catch(() => {});
      }
    }

    setLocation("/exam-results");
  };

  // Update ref whenever handleSubmitExam changes (or its dependencies)
  useEffect(() => {
    handleSubmitExamRef.current = handleSubmitExam;
  }, [examQuestions, userInputs, year]); // Add dependencies used in handleSubmitExam

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

  if (isAdditionalExamMode && !studentLoggedIn) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Login Required</h2>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-md">
            You need to be logged in to take mock exams. Your results will be saved to your account so your teacher can track your progress.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setLocation("/timed-mode")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Setup
            </Button>
            <Button onClick={() => setLocation("/student/login")}>
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
            {(isQuizMode || isStudentQuizMode)
              ? "There are no questions available for this quiz."
              : `There are no exam questions available for ${year} with the ${optionalSection === "dd" ? "Database Design" : "Web Development"} section.`
            }
          </p>
          <Button variant="outline" onClick={() => setLocation(isStudentQuizMode ? "/my-quizzes" : isQuizMode ? "/practice-quizzes" : "/timed-mode")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col h-screen">
      {/* Grading Progress Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Checking Your Answers</h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Please wait while we grade your exam...
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: gradingTotal > 0 ? `${(gradingProgress / gradingTotal) * 100}%` : '0%' }}
                  />
                </div>
                <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                  <span>Checking answer {gradingProgress} of {gradingTotal}</span>
                  <span className="font-medium">{gradingTotal > 0 ? Math.round((gradingProgress / gradingTotal) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
            <Badge variant="outline" className={`text-lg px-3 py-1 ${isQuizMode ? 'border-purple-500 text-purple-700 dark:text-purple-400' : isStudentQuizMode ? 'border-blue-500 text-blue-700 dark:text-blue-400' : ''}`}>
                {(isQuizMode || isStudentQuizMode) ? quizName : `${year} Paper`}
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
                    <Button variant="ghost" className="text-neutral-500 hover:text-red-600" data-testid="btn-cancel-exam">
                        <XCircle className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Exam?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will discard all your progress and answers. You will not receive a grade. Are you sure you want to cancel?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Working</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelExam} className="bg-red-600">Cancel Exam</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" onClick={handlePauseExam} className="border-neutral-300 dark:border-neutral-700">
                <PauseCircle className="mr-2 h-4 w-4" /> Pause & Save
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="default" className="bg-red-600 hover:bg-red-700">
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
            <div className="grid grid-cols-4 gap-2">
                {examQuestions.map((q, idx) => {
                    const prevQuestion = idx > 0 ? examQuestions[idx - 1] : null;
                    const isNewSection = !prevQuestion || prevQuestion.topic !== q.topic;
                    const sectionLabel = q.topic === 'sdcs' ? 'Section 1: Software Design & Development'
                        : q.topic === 'dd' ? 'Section 2: Database Design & Development'
                        : q.topic === 'wd' ? 'Section 2: Web Design & Development'
                        : q.topic === 'cs' ? 'Section 1: Computer Systems'
                        : 'Section';

                    const hasAnswer = (input: Record<string, string> | undefined) => {
                        return input && (input.main?.trim() || input.drawing?.trim() || Object.values(input).some(v => v?.trim()));
                    };
                    
                    const answerableParts: { id: string }[] = [];
                    q.subQuestions.forEach(sub => {
                        if (sub.subParts && sub.subParts.length > 0) {
                            sub.subParts.forEach(part => {
                                if (part.maxMarks > 0) answerableParts.push({ id: part.id });
                            });
                        } else if (sub.maxMarks > 0) {
                            answerableParts.push({ id: sub.id });
                        }
                    });
                    
                    const answeredCount = answerableParts.filter(part => hasAnswer(userInputs[part.id])).length;
                    const totalParts = answerableParts.length;
                    
                    const isFullyAnswered = totalParts > 0 && answeredCount === totalParts;
                    const isPartiallyAnswered = answeredCount > 0 && answeredCount < totalParts;
                    
                    return (
                        <Fragment key={q.id}>
                            {isNewSection && (
                                <div className="col-span-4 mt-3 mb-1 first:mt-0">
                                    <div className={`text-xs font-bold uppercase tracking-wider px-2 py-1.5 rounded ${
                                        q.topic === 'sdcs' || q.topic === 'cs'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                            : q.topic === 'dd'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                    }`}>
                                        {sectionLabel}
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`
                                    h-10 w-10 rounded-md flex items-center justify-center text-sm font-medium transition-colors relative overflow-hidden
                                    ${currentQuestionIndex === idx 
                                        ? 'bg-red-600 text-white' 
                                        : isFullyAnswered 
                                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border border-neutral-900 dark:border-white' 
                                            : isPartiallyAnswered
                                                ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-2 border-neutral-400 dark:border-neutral-500'
                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'}
                                `}
                                title={totalParts > 0 ? `${answeredCount}/${totalParts} parts answered` : 'No answerable parts'}
                            >
                                {idx + 1}
                                {isPartiallyAnswered && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 dark:bg-amber-400" />
                                )}
                            </button>
                        </Fragment>
                    );
                })}
            </div>
        </aside>

        {/* Question Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-24">
            <div key={currentQuestion.id} className="max-w-4xl mx-auto space-y-8">
                {(() => {
                    const prevQ = currentQuestionIndex > 0 ? examQuestions[currentQuestionIndex - 1] : null;
                    const isFirstInSection = !prevQ || prevQ.topic !== currentQuestion.topic;
                    if (!isFirstInSection) return null;
                    const sLabel = currentQuestion.topic === 'sdcs' ? 'Section 1: Software Design & Development'
                        : currentQuestion.topic === 'dd' ? 'Section 2: Database Design & Development'
                        : currentQuestion.topic === 'wd' ? 'Section 2: Web Design & Development'
                        : currentQuestion.topic === 'cs' ? 'Section 1: Computer Systems'
                        : '';
                    if (!sLabel) return null;
                    const colorClass = currentQuestion.topic === 'sdcs' || currentQuestion.topic === 'cs'
                        ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40'
                        : currentQuestion.topic === 'dd'
                            ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/40'
                            : 'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/40';
                    const textColor = currentQuestion.topic === 'sdcs' || currentQuestion.topic === 'cs'
                        ? 'text-blue-800 dark:text-blue-200'
                        : currentQuestion.topic === 'dd'
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-purple-800 dark:text-purple-200';
                    return (
                        <div className={`border-2 rounded-lg px-5 py-3 ${colorClass}`}>
                            <p className={`text-sm font-bold uppercase tracking-wider ${textColor}`}>{sLabel}</p>
                        </div>
                    );
                })()}
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                currentQuestion.year === 0 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                                {currentQuestion.year === 0 ? 'Practice' : currentQuestion.year}
                            </span>
                        </div>
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
                                              block.hasBorder ? (
                                                <div className="flex justify-center">
                                                  <div className={cn(
                                                    "border border-neutral-300 dark:border-neutral-600 rounded-lg p-4",
                                                    block.borderWidth === "xs" && "max-w-[200px]",
                                                    block.borderWidth === "sm" && "max-w-xs",
                                                    (!block.borderWidth || block.borderWidth === "md") && "max-w-md",
                                                    block.borderWidth === "lg" && "max-w-lg",
                                                    block.borderWidth === "xl" && "max-w-xl",
                                                    block.borderWidth === "full" && "w-full"
                                                  )}>
                                                    <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                                      {formatText(block.content)}
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                                  {formatText(block.content)}
                                                </div>
                                              )
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
                                            {block.type === "pseudocode" && block.pseudocodeLines && (
                                              <table className="font-mono text-sm">
                                                <tbody>
                                                  {block.pseudocodeLines.map((line, idx) => (
                                                    <tr key={line.id || idx}>
                                                      <td className="pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap">{line.lineLabel}</td>
                                                      <td className="text-neutral-900 dark:text-neutral-100 whitespace-pre">{line.content}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
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
                                                    {childBlock.type === "pseudocode" && childBlock.pseudocodeLines && (
                                                      <table className="font-mono text-sm">
                                                        <tbody>
                                                          {childBlock.pseudocodeLines.map((line, idx) => (
                                                            <tr key={line.id || idx}>
                                                              <td className="pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap">{line.lineLabel}</td>
                                                              <td className="text-neutral-900 dark:text-neutral-100 whitespace-pre">{line.content}</td>
                                                            </tr>
                                                          ))}
                                                        </tbody>
                                                      </table>
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
                                                    {childBlock.type === "code-table" && childBlock.codeSections && (
                                                      <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                                        {childBlock.codeSections.map((section, sIdx) => (
                                                          <div key={section.id || sIdx}>
                                                            <div className="bg-neutral-200 dark:bg-neutral-700 px-3 py-2 font-semibold text-sm border-b border-neutral-300 dark:border-neutral-600">{section.label}</div>
                                                            <pre className="bg-neutral-900 text-neutral-100 p-3 text-sm font-mono overflow-x-auto">{section.code}</pre>
                                                          </div>
                                                        ))}
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
                                              block.hasBorder ? (
                                                <div className="flex justify-center">
                                                  <div className={cn(
                                                    "border border-neutral-300 dark:border-neutral-600 rounded-lg p-4",
                                                    block.borderWidth === "xs" && "max-w-[200px]",
                                                    block.borderWidth === "sm" && "max-w-xs",
                                                    (!block.borderWidth || block.borderWidth === "md") && "max-w-md",
                                                    block.borderWidth === "lg" && "max-w-lg",
                                                    block.borderWidth === "xl" && "max-w-xl",
                                                    block.borderWidth === "full" && "w-full"
                                                  )}>
                                                    <div className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                                                      {formatText(block.content)}
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                                                  {formatText(block.content)}
                                                </div>
                                              )
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
                                            {block.type === "pseudocode" && block.pseudocodeLines && (
                                              <table className="font-mono text-sm">
                                                <tbody>
                                                  {block.pseudocodeLines.map((line, idx) => (
                                                    <tr key={line.id || idx}>
                                                      <td className="pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap">{line.lineLabel}</td>
                                                      <td className="text-neutral-900 dark:text-neutral-100 whitespace-pre">{line.content}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
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
                                                    {childBlock.type === "pseudocode" && childBlock.pseudocodeLines && (
                                                      <table className="font-mono text-sm">
                                                        <tbody>
                                                          {childBlock.pseudocodeLines.map((line, idx) => (
                                                            <tr key={line.id || idx}>
                                                              <td className="pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap">{line.lineLabel}</td>
                                                              <td className="text-neutral-900 dark:text-neutral-100 whitespace-pre">{line.content}</td>
                                                            </tr>
                                                          ))}
                                                        </tbody>
                                                      </table>
                                                    )}
                                                    {childBlock.type === "data-table" && childBlock.dataTable && (
                                                      <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden text-sm">
                                                        {childBlock.dataTable.tableName && <div className="bg-neutral-200 dark:bg-neutral-700 px-3 py-1 font-semibold font-mono">{childBlock.dataTable.tableName}</div>}
                                                        <table className="w-full"><thead><tr className="bg-neutral-100 dark:bg-neutral-800">{childBlock.dataTable.columns.map(col => <th key={col.id} className="px-3 py-1 text-left font-semibold text-xs">{col.header}</th>)}</tr></thead><tbody>{childBlock.dataTable.rows.map(row => <tr key={row.id} className="border-t">{row.cells.map((cell, idx) => <td key={idx} className="px-3 py-1 text-xs">{getCellValue(cell)}</td>)}</tr>)}</tbody></table>
                                                      </div>
                                                    )}
                                                    {childBlock.type === "code-table" && childBlock.codeSections && (
                                                      <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                                        {childBlock.codeSections.map((section, sIdx) => (
                                                          <div key={section.id || sIdx}>
                                                            <div className="bg-neutral-200 dark:bg-neutral-700 px-3 py-2 font-semibold text-sm border-b border-neutral-300 dark:border-neutral-600">{section.label}</div>
                                                            <pre className="bg-neutral-900 text-neutral-100 p-3 text-sm font-mono overflow-x-auto">{section.code}</pre>
                                                          </div>
                                                        ))}
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
                            <div className="mt-4">
                                {renderInput(subQ, userInputs[subQ.id] || {}, (key, val) => updateInput(subQ.id, key, val), (e) => handleCodeKeyDown(e, subQ.id))}
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
                                                  block.hasBorder ? (
                                                    <div className="flex justify-center">
                                                      <div className={cn(
                                                        "border border-neutral-300 dark:border-neutral-600 rounded-lg p-3",
                                                        block.borderWidth === "xs" && "max-w-[200px]",
                                                        block.borderWidth === "sm" && "max-w-xs",
                                                        (!block.borderWidth || block.borderWidth === "md") && "max-w-md",
                                                        block.borderWidth === "lg" && "max-w-lg",
                                                        block.borderWidth === "xl" && "max-w-xl",
                                                        block.borderWidth === "full" && "w-full"
                                                      )}>
                                                        <div className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap text-sm">
                                                          {formatText(block.content)}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap text-sm">
                                                      {formatText(block.content)}
                                                    </div>
                                                  )
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
                                                {block.type === "pseudocode" && block.pseudocodeLines && (
                                                  <table className="font-mono text-xs">
                                                    <tbody>
                                                      {block.pseudocodeLines.map((line, idx) => (
                                                        <tr key={line.id || idx}>
                                                          <td className="pr-3 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap">{line.lineLabel}</td>
                                                          <td className="text-neutral-900 dark:text-neutral-100 whitespace-pre">{line.content}</td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
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
                                    <div className="mt-2">
                                      {renderInput(part, userInputs[part.id] || {}, (key, val) => updateInput(part.id, key, val), (e) => handleCodeKeyDown(e, part.id))}
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

// Helper to render inputs (copied/adapted from Revision.tsx)
function renderInput(
  subQ: SubQuestion, 
  currentInput: Record<string, string>, 
  onChange: (key: string, val: string) => void,
  onCodeKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
) {
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

      return (
        <div className="space-y-2 mt-4">
          {getRequirementBadge(subQ.codeRequirement)}
          <Textarea 
            placeholder={placeholderText}
            className="min-h-[200px] text-base font-mono p-4 resize-y bg-neutral-900 text-neutral-100 border-neutral-800 focus:border-red-500"
            value={currentInput["main"] || ""}
            onChange={(e) => onChange("main", e.target.value)}
            onKeyDown={onCodeKeyDown}
          />
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
                        placeholder="Write your SQL code here..."
                        className="min-h-[200px] text-base font-mono p-4 bg-neutral-900 text-neutral-100 border-neutral-800"
                        value={currentInput["main"] || ""}
                        onChange={(e) => onChange("main", e.target.value)}
                        onKeyDown={(e) => handleTabKey(e, onChange)}
                    />
                ) : (
                    <DiagramImageInput
                        value={currentInput["diagram_image"] || ""}
                        onChange={(val) => onChange("diagram_image", val)}
                        startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
                        hint={DIAGRAM_HINTS["drawing"]}
                    />
                )}
            </div>
        );
    }

    if (subQ.inputStyle === "image-paste") {
        const startingImg = (subQ.inputConfig as any)?.startingImage || subQ.drawingBackgroundUrl || subQ.imageUrl;
        return (
            <DiagramImageInput
                value={currentInput["diagram_image"] || ""}
                onChange={(val) => onChange("diagram_image", val)}
                startingImageUrl={startingImg}
                hint={DIAGRAM_HINTS["image-paste"]}
            />
        );
    }

    if (subQ.inputStyle === "drawing") {
        return (
            <DiagramImageInput
                value={currentInput["diagram_image"] || ""}
                onChange={(val) => onChange("diagram_image", val)}
                startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
                hint={DIAGRAM_HINTS["drawing"]}
            />
        );
    }

    if (subQ.inputStyle === "erd-annotation") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => onChange("diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["erd-annotation"]}
        />
      );
    }

    if (subQ.inputStyle === "nav-structure") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => onChange("diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["nav-structure"]}
        />
      );
    }

    if (subQ.inputStyle === "nav-structure-higher") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => onChange("diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["nav-structure-higher"]}
        />
      );
    }

    if (subQ.inputStyle === "structure-dataflow") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => onChange("diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["structure-dataflow"]}
        />
      );
    }

    if (subQ.inputStyle === "form-wireframe") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => onChange("diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["form-wireframe"]}
        />
      );
    }

    if (subQ.inputStyle === "webpage-wireframe") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => onChange("diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["form-wireframe"]}
        />
      );
    }

    if (subQ.inputStyle === "table" && subQ.inputConfig) {
      if (subQ.inputConfig.grid) {
        const grid = subQ.inputConfig.grid;
        return (
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                <tr>
                  {grid.headers.map((header: string, i: number) => (
                    <th key={i} className="px-4 py-3 font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {grid.rows.map((row: { cells: Array<{ key?: string; value?: string; isInput?: boolean; multiline?: boolean; placeholder?: string; width?: string }> }, rowIdx: number) => (
                  <tr key={rowIdx} className="bg-white dark:bg-neutral-900">
                    {row.cells.map((cell: { key?: string; value?: string; isInput?: boolean; multiline?: boolean; placeholder?: string; width?: string }, cellIdx: number) => (
                      <td key={cellIdx} className="px-4 py-3" style={{ verticalAlign: cell.multiline ? 'top' : undefined }}>
                        {cell.isInput ? (
                          cell.multiline ? (
                            <Textarea
                              placeholder={cell.placeholder || "Enter answer..."}
                              value={currentInput[cell.key || `cell_${rowIdx}_${cellIdx}`] || ""}
                              onChange={(e) => onChange(cell.key || `cell_${rowIdx}_${cellIdx}`, e.target.value)}
                              className="min-h-[100px] bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm resize-y"
                              style={cell.width && cell.width !== "auto" ? { width: cell.width } : undefined}
                            />
                          ) : (
                            <Input
                              placeholder={cell.placeholder || "Enter answer..."}
                              value={currentInput[cell.key || `cell_${rowIdx}_${cellIdx}`] || ""}
                              onChange={(e) => onChange(cell.key || `cell_${rowIdx}_${cellIdx}`, e.target.value)}
                              className="bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm"
                              style={cell.width && cell.width !== "auto" ? { width: cell.width } : undefined}
                            />
                          )
                        ) : (
                          <span className="text-neutral-700 dark:text-neutral-300">{cell.value || ""}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
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
            onKeyDown={onCodeKeyDown}
        />
    );
}
