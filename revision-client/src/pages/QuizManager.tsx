import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQuestions } from "@/lib/QuestionContext";
import { Question, TOPICS, Topic } from "@/lib/past-papers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/mode-toggle";
import {
  ArrowLeft, Plus, Pencil, Trash2, Clock, FileQuestion,
  ChevronDown, ChevronRight, Search, BookOpen, Eye, EyeOff
} from "lucide-react";

interface DbQuiz {
  id: string;
  name: string;
  description: string | null;
  timeLimitMinutes: number | null;
  questionIds: string[];
  isActive: boolean | null;
  createdAt: string | null;
}

const calculateTotalMarks = (question: Question): number => {
  let total = 0;
  for (const sq of question.subQuestions) {
    if (sq.subParts && sq.subParts.length > 0) {
      for (const part of sq.subParts) total += part.maxMarks || 0;
    } else {
      total += sq.maxMarks || 0;
    }
  }
  return total;
};

const getQuestionPreviewText = (question: Question): string => {
  const scenarioText = question.scenario?.contentBlocks?.find(b => b.type === "text")?.content
    || question.scenario?.text;
  if (scenarioText) return scenarioText.length > 100 ? scenarioText.substring(0, 100) + "..." : scenarioText;
  const firstSubQ = question.subQuestions[0];
  if (firstSubQ) {
    const text = firstSubQ.contentBlocks?.find(b => b.type === "text")?.content
      || firstSubQ.questionText || "No preview available";
    return text.length > 100 ? text.substring(0, 100) + "..." : text;
  }
  return "No preview available";
};

export default function QuizManager() {
  const [, navigate] = useLocation();
  const { questions, loading } = useQuestions();
  const { toast } = useToast();

  const [quizzes, setQuizzes] = useState<DbQuiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<DbQuiz | null>(null);

  const [quizName, setQuizName] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [isActive, setIsActive] = useState(true);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");

  useEffect(() => {
    const token = localStorage.getItem("teacher_token");
    if (!token) { navigate("/teacher/login"); return; }
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch("/api/custom-quizzes");
      if (res.ok) setQuizzes(await res.json());
    } catch (e) {
      console.error("Failed to fetch quizzes:", e);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const filteredQuestionsByTopic = useMemo(() => {
    const grouped: Record<Topic, Question[]> = { sdcs: [], dd: [], wd: [] };
    questions.forEach(q => {
      if (topicFilter !== "all" && q.topic !== topicFilter) return;
      if (searchFilter) {
        const preview = getQuestionPreviewText(q).toLowerCase();
        const title = q.title.toLowerCase();
        const search = searchFilter.toLowerCase();
        if (!preview.includes(search) && !title.includes(search)) return;
      }
      if (grouped[q.topic]) grouped[q.topic].push(q);
    });
    return grouped;
  }, [questions, topicFilter, searchFilter]);

  const selectedQuestionsData = useMemo(() => {
    const selected = questions.filter(q => selectedQuestionIds.has(q.id));
    const totalMarks = selected.reduce((sum, q) => sum + calculateTotalMarks(q), 0);
    return { count: selected.length, totalMarks };
  }, [questions, selectedQuestionIds]);

  const openCreateDialog = () => {
    setEditingQuiz(null);
    setQuizName("");
    setQuizDescription("");
    setTimeLimit(30);
    setIsActive(true);
    setSelectedQuestionIds(new Set());
    setExpandedTopics(new Set());
    setSearchFilter("");
    setTopicFilter("all");
    setDialogOpen(true);
  };

  const openEditDialog = (quiz: DbQuiz) => {
    setEditingQuiz(quiz);
    setQuizName(quiz.name);
    setQuizDescription(quiz.description || "");
    setTimeLimit(quiz.timeLimitMinutes || 30);
    setIsActive(quiz.isActive !== false);
    setSelectedQuestionIds(new Set(quiz.questionIds));
    setExpandedTopics(new Set());
    setSearchFilter("");
    setTopicFilter("all");
    setDialogOpen(true);
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("teacher_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  };

  const handleSave = async () => {
    if (!quizName.trim()) {
      toast({ title: "Please enter a quiz name", variant: "destructive" });
      return;
    }
    if (selectedQuestionIds.size === 0) {
      toast({ title: "Please select at least one question", variant: "destructive" });
      return;
    }

    const body = {
      name: quizName.trim(),
      description: quizDescription.trim() || null,
      timeLimitMinutes: timeLimit > 0 ? timeLimit : 60,
      questionIds: Array.from(selectedQuestionIds),
      isActive,
    };

    try {
      const url = editingQuiz ? `/api/custom-quizzes/${editingQuiz.id}` : "/api/custom-quizzes";
      const method = editingQuiz ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({ title: editingQuiz ? "Quiz updated" : "Quiz created" });
        setDialogOpen(false);
        fetchQuizzes();
      } else {
        toast({ title: "Failed to save quiz", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error saving quiz", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    try {
      const res = await fetch(`/api/custom-quizzes/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) {
        toast({ title: "Quiz deleted" });
        fetchQuizzes();
      }
    } catch (e) {
      toast({ title: "Failed to delete quiz", variant: "destructive" });
    }
  };

  const toggleActive = async (quiz: DbQuiz) => {
    try {
      const res = await fetch(`/api/custom-quizzes/${quiz.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ isActive: !quiz.isActive }),
      });
      if (res.ok) fetchQuizzes();
    } catch (e) {
      console.error("Failed to toggle quiz:", e);
    }
  };

  const getQuizStats = (quiz: DbQuiz) => {
    const quizQuestions = questions.filter(q => quiz.questionIds.includes(q.id));
    return {
      questionCount: quizQuestions.length,
      totalMarks: quizQuestions.reduce((sum, q) => sum + calculateTotalMarks(q), 0),
    };
  };

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) newExpanded.delete(topicId); else newExpanded.add(topicId);
    setExpandedTopics(newExpanded);
  };

  const toggleQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestionIds);
    if (newSelected.has(questionId)) newSelected.delete(questionId); else newSelected.add(questionId);
    setSelectedQuestionIds(newSelected);
  };

  const toggleAllInTopic = (topicId: Topic) => {
    const topicQuestions = filteredQuestionsByTopic[topicId];
    const allSelected = topicQuestions.every(q => selectedQuestionIds.has(q.id));
    const newSelected = new Set(selectedQuestionIds);
    if (allSelected) topicQuestions.forEach(q => newSelected.delete(q.id));
    else topicQuestions.forEach(q => newSelected.add(q.id));
    setSelectedQuestionIds(newSelected);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <div className="w-full bg-black dark:bg-neutral-800 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/teacher/dashboard">
              <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="link-back-dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Quiz Manager</h1>
          </div>
          <ModeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-neutral-600 dark:text-neutral-400">
            Create and manage quizzes for students. Active quizzes appear in the student quiz selection.
          </p>
          <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700" data-testid="button-create-quiz">
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
          </Button>
        </div>

        {loadingQuizzes || loading ? (
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
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">No Quizzes Yet</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-center max-w-md">
              Create a quiz by selecting questions from the question bank. Students will see active quizzes in their quiz list.
            </p>
            <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Quiz
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const stats = getQuizStats(quiz);
              return (
                <div
                  key={quiz.id}
                  data-testid={`card-quiz-${quiz.id}`}
                  className={`bg-white dark:bg-neutral-900 rounded-xl p-6 border ${
                    quiz.isActive ? "border-neutral-200 dark:border-neutral-800" : "border-neutral-300 dark:border-neutral-700 opacity-60"
                  } hover:shadow-lg transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white line-clamp-2">{quiz.name}</h3>
                    <button onClick={() => toggleActive(quiz)} className="flex-shrink-0 ml-2" title={quiz.isActive ? "Hide from students" : "Show to students"}>
                      {quiz.isActive ? <Eye className="w-5 h-5 text-green-600" /> : <EyeOff className="w-5 h-5 text-neutral-400" />}
                    </button>
                  </div>
                  {quiz.description && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3 line-clamp-2">{quiz.description}</p>
                  )}
                  <div className="space-y-1 mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-2">
                      <FileQuestion className="w-4 h-4" />
                      <span>{stats.questionCount} questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{stats.totalMarks} marks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{quiz.timeLimitMinutes || 60} minutes</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(quiz)} className="flex-1" data-testid={`button-edit-quiz-${quiz.id}`}>
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(quiz.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" data-testid={`button-delete-quiz-${quiz.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
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
              <Input value={quizName} onChange={(e) => setQuizName(e.target.value)} placeholder="Enter quiz name..." data-testid="input-quiz-name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description (optional)</label>
              <Textarea value={quizDescription} onChange={(e) => setQuizDescription(e.target.value)} placeholder="Brief description for students..." rows={2} data-testid="input-quiz-description" />
            </div>
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
                <div className="flex gap-2 items-center">
                  <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)} className="w-24" min={0} data-testid="input-quiz-time" />
                  <div className="flex gap-1">
                    {[15, 30, 45, 60].map(mins => (
                      <Button key={mins} variant={timeLimit === mins ? "default" : "outline"} size="sm" onClick={() => setTimeLimit(mins)}>{mins}</Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-quiz-active" />
                <label className="text-sm font-medium">Visible to students</label>
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
                  <Input value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder="Search questions..." className="pl-9" />
                </div>
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="All Topics" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {TOPICS.map(topic => <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>)}
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
                      <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800" onClick={() => toggleTopic(topic.id)}>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                        <Checkbox checked={allSelected} className={someSelected && !allSelected ? "opacity-50" : ""} onClick={(e) => { e.stopPropagation(); toggleAllInTopic(topic.id as Topic); }} />
                        <span className="font-medium flex-1">{topic.name}</span>
                        <span className="text-sm text-neutral-500">{topicQuestions.length} questions</span>
                      </div>
                      {isExpanded && (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                          {topicQuestions.map(question => (
                            <div key={question.id} className="flex items-start gap-3 p-3 pl-10 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 cursor-pointer" onClick={() => toggleQuestion(question.id)}>
                              <Checkbox checked={selectedQuestionIds.has(question.id)} onClick={(e) => e.stopPropagation()} onCheckedChange={() => toggleQuestion(question.id)} />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{question.title}</div>
                                <div className="text-xs text-neutral-500 line-clamp-1">{getQuestionPreviewText(question)}</div>
                              </div>
                              <span className="text-xs text-neutral-500 whitespace-nowrap">{calculateTotalMarks(question)} marks</span>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700" data-testid="button-save-quiz">{editingQuiz ? "Update Quiz" : "Create Quiz"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
