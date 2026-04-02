import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ArrowLeft, Clock, FileQuestion, Search, X, Save, Trash2, Play, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { TOPICS, Question } from "@/lib/past-papers";
import { useToast } from "@/hooks/use-toast";

interface StudentQuiz {
  id: string;
  name: string;
  questionIds: string[];
  createdAt: string;
  timeLimit?: number; // in minutes
}

const STORAGE_KEY = "student_custom_quizzes";

function getQuestionPreviewText(question: Question): string {
  const scenarioText = question.scenario?.contentBlocks?.find(b => b.type === "text")?.content 
    || question.scenario?.text;
  if (scenarioText) return scenarioText;
  
  const firstSubQ = question.subQuestions[0];
  if (firstSubQ) {
    const subQText = firstSubQ.contentBlocks?.find(b => b.type === "text")?.content 
      || firstSubQ.questionText;
    if (subQText) return subQText;
  }
  
  return "No preview available";
}

function calculateTotalMarks(question: Question): number {
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

export default function StudentQuizBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [savedQuizzes, setSavedQuizzes] = useState<StudentQuiz[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<StudentQuiz | null>(null);
  
  const [quizName, setQuizName] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState<number>(30); // default 30 minutes
  const [pausedQuizId, setPausedQuizId] = useState<string | null>(null);
  const [pausedQuizTimeLeft, setPausedQuizTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const headers: Record<string, string> = {};
        const studentToken = localStorage.getItem("studentToken");
        if (studentToken) headers["Authorization"] = `Bearer ${studentToken}`;
        const response = await fetch('/api/questions', { headers });
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.filter((q: Question) => !q.isQuizOnly));
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setQuestionsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedQuizzes(JSON.parse(stored));
      } catch {
        setSavedQuizzes([]);
      }
    }
  }, []);

  // Check for paused student quiz
  useEffect(() => {
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

  const handleResumeQuiz = (quizId: string) => {
    // Find the quiz to get its questions
    const quiz = savedQuizzes.find(q => q.id === quizId);
    if (quiz) {
      // Check if there's already a stored quiz with the same ID - don't overwrite it
      const existingQuiz = localStorage.getItem("student_current_quiz");
      if (!existingQuiz || JSON.parse(existingQuiz).id !== quizId) {
        localStorage.setItem("student_current_quiz", JSON.stringify({
          ...quiz,
          questions: questions.filter(q => quiz.questionIds.includes(q.id)),
          timeLimit: quiz.timeLimit || 30
        }));
      }
      setLocation(`/timed-exam/student-quiz/${quizId}?resume=true`);
    }
  };

  const formatTimeLeft = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const saveQuizzesToStorage = (quizzes: StudentQuiz[]) => {
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

  const openEditQuizDialog = (quiz: StudentQuiz) => {
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
      const updated = savedQuizzes.map(q => 
        q.id === editingQuiz.id 
          ? { ...q, name: quizName.trim(), questionIds: selectedQuestionIds, timeLimit }
          : q
      );
      saveQuizzesToStorage(updated);
      toast({ title: "Success", description: "Quiz updated!" });
    } else {
      const newQuiz: StudentQuiz = {
        id: `student-quiz-${Date.now()}`,
        name: quizName.trim(),
        questionIds: selectedQuestionIds,
        createdAt: new Date().toISOString(),
        timeLimit
      };
      saveQuizzesToStorage([...savedQuizzes, newQuiz]);
      toast({ title: "Success", description: "Quiz created!" });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteQuiz = (quizId: string) => {
    const updated = savedQuizzes.filter(q => q.id !== quizId);
    saveQuizzesToStorage(updated);
    toast({ title: "Deleted", description: "Quiz removed" });
  };

  const handleStartQuiz = (quiz: StudentQuiz) => {
    localStorage.setItem("student_current_quiz", JSON.stringify({
      ...quiz,
      questions: questions.filter(q => quiz.questionIds.includes(q.id)),
      timeLimit: quiz.timeLimit || 30
    }));
    setLocation(`/timed-exam/student-quiz/${quiz.id}`);
  };

  const toggleSelectAllInTopic = (topicId: string) => {
    const topicQuestionIds = questionsByTopic[topicId]?.map(q => q.id) || [];
    const allSelected = topicQuestionIds.every(id => selectedQuestionIds.includes(id));
    
    if (allSelected) {
      setSelectedQuestionIds(prev => prev.filter(id => !topicQuestionIds.includes(id)));
    } else {
      setSelectedQuestionIds(prev => Array.from(new Set([...prev, ...topicQuestionIds])));
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = searchTerm === "" || 
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getQuestionPreviewText(q).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = topicFilter === "all" || q.topic === topicFilter;
    return matchesSearch && matchesTopic;
  });

  const questionsByTopic = TOPICS.reduce((acc, topic) => {
    acc[topic.id] = filteredQuestions.filter(q => q.topic === topic.id);
    return acc;
  }, {} as Record<string, Question[]>);

  const calculateQuizTotalMarks = (questionIds: string[]) => {
    return questionIds.reduce((total, id) => {
      const q = questions.find(q => q.id === id);
      return total + (q ? calculateTotalMarks(q) : 0);
    }, 0);
  };

  const getQuizQuestionCount = (quiz: StudentQuiz) => {
    return quiz.questionIds.filter(id => questions.some(q => q.id === id)).length;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/")} data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">My Practice Quizzes</h1>
              <p className="text-neutral-500">Create your own quizzes from past paper questions</p>
            </div>
          </div>
          <Button onClick={openNewQuizDialog} className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-quiz">
            <Plus className="mr-2 h-4 w-4" />
            Create Quiz
          </Button>
        </div>

        {savedQuizzes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileQuestion className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
              <h3 className="text-xl font-semibold mb-2">No Quizzes Yet</h3>
              <p className="text-neutral-500 mb-4">Create your first practice quiz by selecting questions from past papers.</p>
              <Button onClick={openNewQuizDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Quiz
              </Button>
            </CardContent>
          </Card>
        ) : questionsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow animate-pulse">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{quiz.name}</CardTitle>
                  <CardDescription>
                    <span className="inline-block h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded"></span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-9 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{quiz.name}</CardTitle>
                  <CardDescription>
                    {getQuizQuestionCount(quiz)} questions • {calculateQuizTotalMarks(quiz.questionIds)} marks • {quiz.timeLimit || 30} mins
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pausedQuizId === quiz.id && (
                    <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/30 rounded-md border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Paused - {pausedQuizTimeLeft ? formatTimeLeft(pausedQuizTimeLeft) : ""} remaining
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {pausedQuizId === quiz.id ? (
                      <Button 
                        className="flex-1 bg-amber-600 hover:bg-amber-700" 
                        onClick={() => handleResumeQuiz(quiz.id)}
                        disabled={questionsLoading || getQuizQuestionCount(quiz) === 0}
                        data-testid={`button-resume-quiz-${quiz.id}`}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Resume
                      </Button>
                    ) : (
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700" 
                        onClick={() => handleStartQuiz(quiz)}
                        disabled={questionsLoading || getQuizQuestionCount(quiz) === 0}
                        data-testid={`button-start-quiz-${quiz.id}`}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => openEditQuizDialog(quiz)} disabled={questionsLoading}>
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{quiz.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteQuiz(quiz.id)} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? "Edit Quiz" : "Create Practice Quiz"}</DialogTitle>
            <DialogDescription>
              Select questions from past papers to build your custom practice quiz.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4" style={{ minHeight: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quiz-name">Quiz Name *</Label>
                <Input
                  id="quiz-name"
                  placeholder="e.g., My Variables Practice"
                  value={quizName}
                  onChange={(e) => setQuizName(e.target.value)}
                  data-testid="input-quiz-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                <Input
                  id="time-limit"
                  type="number"
                  min={5}
                  max={180}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Math.max(5, Math.min(180, parseInt(e.target.value) || 30)))}
                  data-testid="input-time-limit"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Select Questions</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-questions"
                  />
                </div>
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger className="w-48" data-testid="select-topic-filter">
                    <SelectValue placeholder="Filter by topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {TOPICS.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {questionsLoading ? (
                <div className="text-center py-8 text-neutral-500">Loading questions...</div>
              ) : (
                <div className="border rounded-lg max-h-[40vh] overflow-y-auto">
                  {TOPICS.filter(t => questionsByTopic[t.id]?.length > 0).map((topic) => {
                    const topicQuestionIds = questionsByTopic[topic.id]?.map(q => q.id) || [];
                    const allTopicSelected = topicQuestionIds.length > 0 && topicQuestionIds.every(id => selectedQuestionIds.includes(id));
                    const someTopicSelected = topicQuestionIds.some(id => selectedQuestionIds.includes(id));
                    
                    return (
                    <Collapsible
                      key={topic.id}
                      open={expandedTopics.includes(topic.id)}
                      onOpenChange={() => toggleTopic(topic.id)}
                    >
                      <div className="flex items-center justify-between w-full p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b">
                        <CollapsibleTrigger className="flex items-center gap-2 flex-1">
                          <ChevronDown className={`h-4 w-4 transition-transform ${expandedTopics.includes(topic.id) ? "rotate-180" : ""}`} />
                          <span className="font-medium">{topic.name}</span>
                          <span className="text-sm text-neutral-500">({questionsByTopic[topic.id].length})</span>
                        </CollapsibleTrigger>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-blue-600">
                            {questionsByTopic[topic.id].filter(q => selectedQuestionIds.includes(q.id)).length} selected
                          </span>
                          <div 
                            className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={allTopicSelected}
                              ref={undefined}
                              onCheckedChange={() => toggleSelectAllInTopic(topic.id)}
                              data-testid={`checkbox-select-all-${topic.id}`}
                              className={someTopicSelected && !allTopicSelected ? "data-[state=unchecked]:bg-blue-200" : ""}
                            />
                            <span className="text-xs">All</span>
                          </div>
                        </div>
                      </div>
                      <CollapsibleContent>
                        {questionsByTopic[topic.id].map((question) => (
                          <div
                            key={question.id}
                            className="flex items-start gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 border-b last:border-b-0 cursor-pointer"
                            onClick={() => toggleQuestionSelection(question.id)}
                          >
                            <Checkbox
                              checked={selectedQuestionIds.includes(question.id)}
                              onCheckedChange={() => toggleQuestionSelection(question.id)}
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`checkbox-question-${question.id}`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{question.title}</p>
                              <p className="text-xs text-neutral-500 truncate">
                                {getQuestionPreviewText(question)}
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                {calculateTotalMarks(question)} marks
                              </p>
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  );})}
                </div>
              )}

              {selectedQuestionIds.length > 0 && (
                <div className="text-sm text-neutral-600 dark:text-neutral-400 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <strong>Selected:</strong> {selectedQuestionIds.length} questions • {calculateQuizTotalMarks(selectedQuestionIds)} total marks
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsDialogOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuiz} className="bg-blue-600 hover:bg-blue-700" data-testid="button-save-quiz">
              <Save className="mr-2 h-4 w-4" />
              {editingQuiz ? "Update Quiz" : "Create Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
