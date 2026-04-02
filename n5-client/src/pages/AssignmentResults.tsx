import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Loader2, Download } from "lucide-react";
import confetti from "canvas-confetti";
import { ModeToggle } from "@/components/mode-toggle";
import { generateResultsPDF } from "@/lib/generate-results-pdf";

interface BreakdownItem {
  partLabel: string;
  sectionTitle: string;
  questionLabel: string;
  questionText: string;
  contentBlocks?: any[];
  maxMarks: number;
  score: number;
  userAnswer: any;
  feedback: string;
  suggestions: string;
}

interface AssignmentResult {
  assignmentTitle: string;
  totalScore: number;
  maxScore: number;
  breakdown: BreakdownItem[];
  timestamp: string;
}

export default function AssignmentResults() {
  const [, setLocation] = useLocation();
  const params = useParams<{ attemptId: string }>();
  const [result, setResult] = useState<AssignmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [gradingProgress, setGradingProgress] = useState(0);
  const [studentName, setStudentName] = useState("");

  const generatePDF = () => {
    if (!result) return;
    const name = studentName.trim() || "Student";
    generateResultsPDF({
      title: result.assignmentTitle,
      studentName: name,
      date: new Date(result.timestamp).toLocaleDateString(),
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      questionLabel: "Task",
      breakdown: result.breakdown.map((item, idx) => {
        const qText = item.contentBlocks && item.contentBlocks.length > 0
          ? item.contentBlocks
              .filter((b: any) => b.type === "text" || b.type === "code")
              .map((b: any) => b.content || "")
              .join("\n")
          : item.questionText || "";
        return {
          label: item.questionLabel || `Task ${idx + 1}`,
          questionText: qText || undefined,
          maxMarks: item.maxMarks,
          score: item.score,
          userAnswer: formatUserAnswer(item.userAnswer),
          feedback: item.feedback || undefined,
          suggestions: item.suggestions || undefined,
        };
      }),
    });
  };

  useEffect(() => {
    const cacheKey = `assignment_result_${params.attemptId}`;
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setResult(parsed);
        setLoading(false);
        setTimeout(() => {
          if (!document.documentElement.classList.contains("reduced-motion")) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#dc2626", "#000000", "#ffffff"],
            });
          }
        }, 500);
        return;
      } catch {}
    }

    if (params.attemptId) {
      gradeAssignment(params.attemptId);
    } else {
      setError("No assignment attempt found.");
      setLoading(false);
    }
  }, [params.attemptId]);

  const gradeAssignment = async (attemptId: string) => {
    setLoading(true);
    setGradingProgress(10);

    const progressInterval = setInterval(() => {
      setGradingProgress((prev) => Math.min(prev + 5, 90));
    }, 2000);

    try {
      const response = await fetch(`/api/assignment-attempts/${attemptId}/grade-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      clearInterval(progressInterval);
      setGradingProgress(100);

      if (!response.ok) throw new Error("Failed to grade assignment");
      const data = await response.json();

      setResult(data);
      localStorage.setItem(`assignment_result_${attemptId}`, JSON.stringify(data));

      setTimeout(() => {
        if (!document.documentElement.classList.contains("reduced-motion")) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#dc2626", "#000000", "#ffffff"],
          });
        }
      }, 500);
    } catch (err) {
      setError("Failed to grade assignment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const formatUserAnswer = (userAnswer: any): string => {
    if (!userAnswer) return "No answer provided";
    if (typeof userAnswer === "string") {
      if (userAnswer.startsWith("data:image/") || userAnswer.startsWith("[{") || userAnswer.startsWith("{")) {
        return "[Diagram submitted]";
      }
      return userAnswer;
    }
    if (typeof userAnswer === "object") {
      const entries = Object.entries(userAnswer).filter(([_, v]) => v);
      if (entries.length === 0) return "No answer provided";
      const diagramKeys = ["drawing", "drawing_canvas", "erd_diagram", "erd_drawing"];
      const hasDiagram = entries.some(([key]) => diagramKeys.includes(key));
      if (hasDiagram) return "[Diagram submitted]";
      return entries
        .map(([key, value]) => {
          if (key.includes("canvas") || key.includes("drawing")) return null;
          if (key === "design_mode") return `Mode: ${value}`;
          const strValue = String(value);
          if (strValue.length > 500) return "[Complex data submitted]";
          return `${strValue}`;
        })
        .filter(Boolean)
        .join("\n");
    }
    return String(userAnswer);
  };

  const renderContentBlock = (block: any): React.ReactNode => {
    if (!block) return null;
    if (block.type === "text") {
      return <p key={block.id} className="whitespace-pre-wrap">{block.content}</p>;
    }
    if (block.type === "image") {
      return <img key={block.id} src={block.content} alt="Task" className="max-w-full max-h-48 rounded-lg" />;
    }
    if (block.type === "code") {
      return (
        <pre key={block.id} className="bg-neutral-800 text-neutral-100 p-3 rounded-lg overflow-x-auto text-xs font-mono">
          {block.content}
        </pre>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md w-full">
          <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Grading Your Assignment</h2>
          <p className="text-neutral-500">The AI is reviewing your answers and providing feedback. This may take a minute...</p>
          <div className="space-y-2">
            <Progress value={gradingProgress} className="h-3" />
            <p className="text-sm text-neutral-400">{gradingProgress}% complete</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Grading Error</h2>
          <p className="text-neutral-500">{error || "Something went wrong."}</p>
          <Button onClick={() => setLocation("/assignments")} data-testid="button-back-assignments">
            Back to Assignments
          </Button>
        </div>
      </div>
    );
  }

  const percentage = result.maxScore > 0 ? Math.round((result.totalScore / result.maxScore) * 100) : 0;

  let grade = "No Award";
  let color = "text-neutral-500";
  if (percentage >= 70) { grade = "A"; color = "text-green-600"; }
  else if (percentage >= 60) { grade = "B"; color = "text-blue-600"; }
  else if (percentage >= 50) { grade = "C"; color = "text-yellow-600"; }
  else if (percentage >= 40) { grade = "D"; color = "text-orange-600"; }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={() => setLocation("/assignments")} data-testid="button-back-assignments">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assignments
          </Button>
          <ModeToggle />
        </div>

        <div className="text-center space-y-2 mb-12">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white" data-testid="text-assignment-title">
            {result.assignmentTitle} — Results
          </h1>
          <p className="text-neutral-500">
            Completed on {new Date(result.timestamp).toLocaleDateString()}
          </p>
        </div>

        <Card className="overflow-hidden border-t-4 border-t-red-500 shadow-lg">
          <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4 flex-1">
              <h2 className="text-xl font-medium text-neutral-500 uppercase tracking-wide">Final Grade</h2>
              <div className={`text-8xl font-black ${color}`} data-testid="text-grade">{grade}</div>
              <p className="text-lg font-medium text-neutral-600 dark:text-neutral-300">
                You achieved {percentage}%
              </p>
            </div>

            <div className="flex-1 w-full max-w-xs space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span>Total Score</span>
                <span data-testid="text-total-score">{result.totalScore} / {result.maxScore}</span>
              </div>
              <Progress value={percentage} className="h-4" />
              <div className="grid grid-cols-2 gap-4 text-sm text-neutral-500 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div> A: 70%+
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div> B: 60-69%
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div> C: 50-59%
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div> D: 40-49%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-3">Download Results as PDF</h3>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
                  Your Name
                </label>
                <Input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your name for the report..."
                  data-testid="input-student-name"
                />
              </div>
              <Button onClick={generatePDF} className="gap-2" data-testid="button-download-pdf">
                <Download className="w-4 h-4" /> Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">Detailed Breakdown</h3>
          <p className="text-neutral-500 text-sm">Click on a task to see the full details and your answer</p>

          {result.breakdown.map((item, index) => {
            const isExpanded = expandedItems.has(index);
            const questionTitle = `Part ${item.partLabel}${item.questionLabel ? ` — ${item.questionLabel}` : ""}`;

            return (
              <Collapsible key={index} open={isExpanded} onOpenChange={() => toggleItem(index)}>
                <Card
                  className={`border-l-4 ${
                    item.score === item.maxMarks
                      ? "border-l-green-500"
                      : item.score > 0
                      ? "border-l-yellow-500"
                      : "border-l-red-500"
                  } transition-all hover:shadow-md`}
                  data-testid={`card-result-${index}`}
                >
                  <CollapsibleTrigger className="w-full text-left">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{questionTitle}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {item.score === item.maxMarks ? (
                              <span className="flex items-center text-green-600 text-sm font-medium">
                                <CheckCircle className="w-4 h-4 mr-1" /> Full Marks
                              </span>
                            ) : item.score > 0 ? (
                              <span className="flex items-center text-yellow-600 text-sm font-medium">
                                <AlertCircle className="w-4 h-4 mr-1" /> Partial Marks
                              </span>
                            ) : (
                              <span className="flex items-center text-red-600 text-sm font-medium">
                                <XCircle className="w-4 h-4 mr-1" /> No Marks
                              </span>
                            )}
                            <span className="text-neutral-400 text-sm">•</span>
                            <span className="text-neutral-600 dark:text-neutral-400 text-sm">
                              {item.score} / {item.maxMarks} marks
                            </span>
                          </div>
                        </div>
                        <div className="text-neutral-400">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="px-6 pb-6 pt-0 border-t border-neutral-200 dark:border-neutral-800">
                      <div className="space-y-4 pt-4">
                        {(item.questionText || (item.contentBlocks && item.contentBlocks.length > 0)) && (
                          <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                            <h5 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Task</h5>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                              {item.contentBlocks && item.contentBlocks.length > 0
                                ? item.contentBlocks.map(renderContentBlock)
                                : item.questionText && <p className="whitespace-pre-wrap">{item.questionText}</p>}
                            </div>
                          </div>
                        )}

                        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                          <h5 className="font-semibold text-sm text-amber-700 dark:text-amber-300 mb-2">Your Answer</h5>
                          <p className="text-sm text-amber-600 dark:text-amber-400 whitespace-pre-wrap">
                            {formatUserAnswer(item.userAnswer)}
                          </p>
                        </div>

                        {item.feedback && (
                          <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                            <h5 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Feedback</h5>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                              {(typeof item.feedback === "string" ? item.feedback : Array.isArray(item.feedback) ? (item.feedback as string[]).join("\n") : String(item.feedback)).split(/\n/).map((line, i) => {
                                const bulletMatch = line.match(/^(\s*[-•*]\s*)(.*)/);
                                if (bulletMatch) {
                                  return <div key={i} className="flex gap-1.5 ml-2"><span>•</span><span>{bulletMatch[2]}</span></div>;
                                }
                                const numMatch = line.match(/^(\s*\d+[.)]\s*)(.*)/);
                                if (numMatch) {
                                  return <div key={i} className="flex gap-1.5 ml-2"><span>{numMatch[1].trim()}</span><span>{numMatch[2]}</span></div>;
                                }
                                return line.trim() ? <p key={i}>{line}</p> : <div key={i} className="h-1" />;
                              })}
                            </div>
                          </div>
                        )}

                        {item.suggestions && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h5 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-2">How to Improve</h5>
                            <div className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                              {(typeof item.suggestions === "string" ? item.suggestions : Array.isArray(item.suggestions) ? (item.suggestions as string[]).join("\n") : String(item.suggestions)).split(/\n/).map((line, i) => {
                                const bulletMatch = line.match(/^(\s*[-•*]\s*)(.*)/);
                                if (bulletMatch) {
                                  return <div key={i} className="flex gap-1.5 ml-2"><span>•</span><span>{bulletMatch[2]}</span></div>;
                                }
                                const numMatch = line.match(/^(\s*\d+[.)]\s*)(.*)/);
                                if (numMatch) {
                                  return <div key={i} className="flex gap-1.5 ml-2"><span>{numMatch[1].trim()}</span><span>{numMatch[2]}</span></div>;
                                }
                                return line.trim() ? <p key={i}>{line}</p> : <div key={i} className="h-1" />;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
}
