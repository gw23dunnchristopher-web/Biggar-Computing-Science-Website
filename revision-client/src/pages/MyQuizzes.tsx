import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQuestions } from "@/lib/QuestionContext";
import { Question, TOPICS, Topic } from "@/lib/past-papers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ModeToggle } from "@/components/mode-toggle";
import { 
  ArrowLeft, Plus, Play, Pencil, Trash2, Clock, FileQuestion, 
  ChevronDown, ChevronRight, Search, Pause, BookOpen
} from "lucide-react";

interface StudentQuiz {
  id: string;
  name: string;
  questionIds: string[];
  createdAt: string;
  timeLimit?: number;
}

interface PausedQuizState {
  quizId: string;
  quizName: string;
  timeLeft: number;
  userInputs: Record<string, any>;
  currentQuestionIndex: number;
}

const STORAGE_KEY = "student_custom_quizzes";
const PAUSED_QUIZ_KEY = "paused_student_quiz";

const calculateTotalMarks = (question: Question): number => {
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
};

const formatTimeLeft = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getQuestionPreviewText = (question: Question): string => {
  const scenarioText = question.scenario?.contentBlocks?.find(b => b.type === "text")?.content 
    || question.scenario?.text;
  if (scenarioText) {
    return scenarioText.length > 100 ? scenarioText.substring(0, 100) + "..." : scenarioText;
  }
  
  const firstSubQ = question.subQuestions[0];
  if (firstSubQ) {
    const text = firstSubQ.contentBlocks?.find(b => b.type === "text")?.content 
      || firstSubQ.questionText || "No preview available";
    return text.length > 100 ? text.substring(0, 100) + "..." : text;
  }
  return "No preview available";
};

export default function MyQuizzes() {
  const [, navigate] = useLocation();
  const { questions, loading } = useQuestions();
  const { toast } = useToast();
  
  const [quizzes, setQuizzes] = useState<StudentQuiz[]>([]);
  const [teacherQuizzes, setTeacherQuizzes] = useState<{id:string;name:string;description:string|null;timeLimitMinutes:number|null;questionIds:string[];isActive:boolean|null}[]>([]);
  const [pausedQuiz, setPausedQuiz] = useState<PausedQuizState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<StudentQuiz | null>(null);
  
  const [quizName, setQuizName] = useState("");
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setQuizzes(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved quizzes:", e);
      }
    }
    
    fetch("/api/custom-quizzes").then(r => r.json()).then(data => {
      setTeacherQuizzes((data || []).filter((q: any) => q.isActive));
    }).catch(() => {});
    
    const paused = localStorage.getItem(PAUSED_QUIZ_KEY);
    if (paused) {
      try {
        setPausedQuiz(JSON.parse(paused));
      } catch (e) {
        console.error("Failed to parse paused quiz:", e);
      }
    }
  }, []);

  const saveQuizzes = (newQuizzes: StudentQuiz[]) => {
    setQuizzes(newQuizzes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newQuizzes));
  };

  const questionsByTopic = useMemo(() => {
    const grouped: Record<Topic, Question[]> = { sdcs: [], dd: [], wd: [] };
    questions.forEach(q => {
      if (grouped[q.topic]) {
        grouped[q.topic].push(q);
      }
    });
    return grouped;
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (topicFilter !== "all" && q.topic !== topicFilter) return false;
      if (searchFilter) {
        const preview = getQuestionPreviewText(q).toLowerCase();
        const title = q.title.toLowerCase();
        const search = searchFilter.toLowerCase();
        if (!preview.includes(search) && !title.includes(search)) return false;
      }
      return true;
    });
  }, [questions, topicFilter, searchFilter]);

  const filteredQuestionsByTopic = useMemo(() => {
    const grouped: Record<Topic, Question[]> = { sdcs: [], dd: [], wd: [] };
    filteredQuestions.forEach(q => {
      if (grouped[q.topic]) {
        grouped[q.topic].push(q);
      }
    });
    return grouped;
  }, [filteredQuestions]);

  const selectedQuestionsData = useMemo(() => {
    const selected = questions.filter(q => selectedQuestionIds.has(q.id));
    const totalMarks = selected.reduce((sum, q) => sum + calculateTotalMarks(q), 0);
    return { count: selected.length, totalMarks };
  }, [questions, selectedQuestionIds]);

  const getQuizStats = (quiz: StudentQuiz) => {
    const quizQuestions = questions.filter(q => quiz.questionIds.includes(q.id));
    const totalMarks = quizQuestions.reduce((sum, q) => sum + calculateTotalMarks(q), 0);
    const validCount = quizQuestions.length;
    return { questionCount: validCount, totalMarks };
  };

  const openCreateDialog = () => {
    setEditingQuiz(null);
    setQuizName("");
    setTimeLimit(30);
    setSelectedQuestionIds(new Set());
    setExpandedTopics(new Set());
    setSearchFilter("");
    setTopicFilter("all");
    setDialogOpen(true);
  };

  const openEditDialog = (quiz: StudentQuiz) => {
    setEditingQuiz(quiz);
    setQuizName(quiz.name);
    setTimeLimit(quiz.timeLimit || 30);
    setSelectedQuestionIds(new Set(quiz.questionIds));
    setExpandedTopics(new Set());
    setSearchFilter("");
    setTopicFilter("all");
    setDialogOpen(true);
  };

  const handleSaveQuiz = () => {
    if (!quizName.trim()) {
      toast({ title: "Please enter a quiz name", variant: "destructive" });
      return;
    }
    if (selectedQuestionIds.size === 0) {
      toast({ title: "Please select at least one question", variant: "destructive" });
      return;
    }

    const quizData: StudentQuiz = {
      id: editingQuiz?.id || `quiz-${Date.now()}`,
      name: quizName.trim(),
      questionIds: Array.from(selectedQuestionIds),
      createdAt: editingQuiz?.createdAt || new Date().toISOString(),
      timeLimit: timeLimit > 0 ? timeLimit : undefined,
    };

    if (editingQuiz) {
      saveQuizzes(quizzes.map(q => q.id === editingQuiz.id ? quizData : q));
      toast({ title: "Quiz updated successfully" });
    } else {
      saveQuizzes([...quizzes, quizData]);
      toast({ title: "Quiz created successfully" });
    }
    setDialogOpen(false);
  };

  const handleDeleteQuiz = (quizId: string) => {
    if (confirm("Are you sure you want to delete this quiz?")) {
      saveQuizzes(quizzes.filter(q => q.id !== quizId));
      if (pausedQuiz?.quizId === quizId) {
        localStorage.removeItem(PAUSED_QUIZ_KEY);
        setPausedQuiz(null);
      }
      toast({ title: "Quiz deleted" });
    }
  };

  const startQuiz = (quiz: StudentQuiz) => {
    const quizQuestions = questions.filter(q => quiz.questionIds.includes(q.id));
    if (quizQuestions.length === 0) {
      toast({ title: "No valid questions in this quiz", variant: "destructive" });
      return;
    }

    localStorage.setItem("student_current_quiz", JSON.stringify({
      id: quiz.id,
      name: quiz.name,
      questions: quizQuestions,
      timeLimit: quiz.timeLimit || Math.ceil(quizQuestions.reduce((sum, q) => sum + calculateTotalMarks(q), 0) * 1.125),
    }));
    navigate(`/timed-exam/student-quiz/${quiz.id}`);
  };

  const resumeQuiz = (quiz: StudentQuiz) => {
    const quizQuestions = questions.filter(q => quiz.questionIds.includes(q.id));
    localStorage.setItem("student_current_quiz", JSON.stringify({
      id: quiz.id,
      name: quiz.name,
      questions: quizQuestions,
      timeLimit: quiz.timeLimit || Math.ceil(quizQuestions.reduce((sum, q) => sum + calculateTotalMarks(q), 0) * 1.125),
    }));
    navigate(`/timed-exam/student-quiz/${quiz.id}?resume=true`);
  };

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const toggleQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestionIds);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestionIds(newSelected);
  };

  const toggleAllInTopic = (topicId: Topic) => {
    const topicQuestions = filteredQuestionsByTopic[topicId];
    const allSelected = topicQuestions.every(q => selectedQuestionIds.has(q.id));
    const newSelected = new Set(selectedQuestionIds);
    
    if (allSelected) {
      topicQuestions.forEach(q => newSelected.delete(q.id));
    } else {
      topicQuestions.forEach(q => newSelected.add(q.id));
    }
    setSelectedQuestionIds(newSelected);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <div className="w-full bg-black dark:bg-neutral-800 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">My Quizzes</h1>
          </div>
          <ModeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {teacherQuizzes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Teacher Quizzes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherQuizzes.map((tq) => {
                const tqQuestions = questions.filter(q => tq.questionIds.includes(q.id));
                const tqMarks = tqQuestions.reduce((sum, q) => sum + calculateTotalMarks(q), 0);
                return (
                  <div key={tq.id} data-testid={`card-teacher-quiz-${tq.id}`} className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">{tq.name}</h3>
                    {tq.description && <p className="text-sm text-neutral-500 mb-3 line-clamp-2">{tq.description}</p>}
                    <div className="space-y-1 mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                      <div className="flex items-center gap-2"><FileQuestion className="w-4 h-4" /><span>{tqQuestions.length} questions</span></div>
                      <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" /><span>{tqMarks} marks</span></div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>{tq.timeLimitMinutes || 60} minutes</span></div>
                    </div>
                    <Button
                      onClick={() => {
                        localStorage.setItem("student_current_quiz", JSON.stringify({
                          id: tq.id, name: tq.name, questions: tqQuestions,
                          timeLimit: tq.timeLimitMinutes || Math.ceil(tqMarks * 1.125),
                        }));
                        navigate(`/timed-exam/student-quiz/${tq.id}`);
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={loading || tqQuestions.length === 0}
                      data-testid={`button-start-teacher-quiz-${tq.id}`}
                    >
                      <Play className="w-4 h-4 mr-2" /> Start Quiz
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">My Custom Quizzes</h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              Create your own quizzes from the question bank
            </p>
          </div>
          <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 animate-pulse">
                <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-4" />
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-2" />
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Create Your First Quiz</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-center max-w-md">
              Build a custom quiz by selecting questions from the question bank. Perfect for focused revision!
            </p>
            <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Quiz
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz, index) => {
              const stats = getQuizStats(quiz);
              const isPaused = pausedQuiz?.quizId === quiz.id;
              const hasValidQuestions = stats.questionCount > 0;

              return (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white dark:bg-neutral-900 rounded-xl p-6 border ${
                    isPaused 
                      ? "border-amber-400 dark:border-amber-500" 
                      : "border-neutral-200 dark:border-neutral-800"
                  } hover:shadow-lg transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white line-clamp-2">
                      {quiz.name}
                    </h3>
                    {isPaused && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm font-medium px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                        <Pause className="w-3 h-3" />
                        Paused
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-2">
                      <FileQuestion className="w-4 h-4" />
                      <span>{stats.questionCount} questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{stats.totalMarks} marks</span>
                    </div>
                    {quiz.timeLimit && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{quiz.timeLimit} minutes</span>
                      </div>
                    )}
                    {isPaused && pausedQuiz && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimeLeft(pausedQuiz.timeLeft)} remaining</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isPaused ? (
                      <Button
                        onClick={() => resumeQuiz(quiz)}
                        className="flex-1 bg-amber-600 hover:bg-amber-700"
                        disabled={loading || !hasValidQuestions}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    ) : (
                      <Button
                        onClick={() => startQuiz(quiz)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={loading || !hasValidQuestions}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(quiz)}
                      disabled={loading}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? "Edit Quiz" : "Create Quiz"}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quiz Name</label>
              <Input
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                placeholder="Enter quiz name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                  className="w-24"
                  min={0}
                />
                <div className="flex gap-1">
                  {[15, 30, 45, 60].map(mins => (
                    <Button
                      key={mins}
                      variant={timeLimit === mins ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeLimit(mins)}
                    >
                      {mins}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Select Questions</label>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {selectedQuestionsData.count} selected ({selectedQuestionsData.totalMarks} marks)
                </span>
              </div>

              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search questions..."
                    className="pl-9"
                  />
                </div>
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {TOPICS.map(topic => (
                      <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg max-h-64 overflow-y-auto">
                {TOPICS.filter(t => topicFilter === "all" || t.id === topicFilter).map(topic => {
                  const topicQuestions = filteredQuestionsByTopic[topic.id as Topic];
                  if (topicQuestions.length === 0) return null;

                  const isExpanded = expandedTopics.has(topic.id);
                  const allSelected = topicQuestions.every(q => selectedQuestionIds.has(q.id));
                  const someSelected = topicQuestions.some(q => selectedQuestionIds.has(q.id));

                  return (
                    <div key={topic.id} className="border-b border-neutral-200 dark:border-neutral-700 last:border-b-0">
                      <div
                        className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        onClick={() => toggleTopic(topic.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-neutral-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        )}
                        <Checkbox
                          checked={allSelected}
                          className={someSelected && !allSelected ? "opacity-50" : ""}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAllInTopic(topic.id as Topic);
                          }}
                        />
                        <span className="font-medium flex-1">{topic.name}</span>
                        <span className="text-sm text-neutral-500">
                          {topicQuestions.length} questions
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                          {topicQuestions.map(question => (
                            <div
                              key={question.id}
                              className="flex items-start gap-3 p-3 pl-10 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 cursor-pointer"
                              onClick={() => toggleQuestion(question.id)}
                            >
                              <Checkbox
                                checked={selectedQuestionIds.has(question.id)}
                                onClick={(e) => e.stopPropagation()}
                                onCheckedChange={() => toggleQuestion(question.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{question.title}</div>
                                <div className="text-xs text-neutral-500 line-clamp-1">
                                  {getQuestionPreviewText(question)}
                                </div>
                              </div>
                              <span className="text-xs text-neutral-500 whitespace-nowrap">
                                {calculateTotalMarks(question)} marks
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuiz} className="bg-purple-600 hover:bg-purple-700">
              {editingQuiz ? "Update Quiz" : "Create Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
