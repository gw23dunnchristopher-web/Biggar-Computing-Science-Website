import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { compareQuestionsByNumber } from "@/lib/QuestionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, ArrowLeft, Clock, FileQuestion, Search, X, Save, PlusCircle } from "lucide-react";
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
import { TOPICS, Question, ContentBlock } from "@/lib/past-papers";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Type, Code, Trash2 as TrashIcon, GripVertical } from "lucide-react";

const INPUT_TYPES = [
  { id: "text", name: "Text Answer", description: "Free-form text response" },
  { id: "code-editor", name: "Code Editor", description: "Code input with syntax highlighting" },
  { id: "labeled-inputs", name: "Labeled Inputs", description: "Multiple labeled text fields" },
  { id: "fill-in-blanks", name: "Fill in Blanks", description: "Code with blanks to complete" },
  { id: "table", name: "Table", description: "Grid-based answer input" },
] as const;

const ADVANCED_INPUT_TYPES = [
  { id: "drawing", name: "Drawing/Diagram", description: "Freehand drawing canvas" },
  { id: "erd-annotation", name: "ERD Annotation", description: "Entity-Relationship diagram marking" },
  { id: "nav-structure", name: "Navigation Structure", description: "Website navigation diagrams" },
  { id: "tag-matching", name: "Tag Matching", description: "Connect tags to zones on image" },
  { id: "structure-dataflow", name: "Structure Dataflow", description: "Data flow diagrams" },
  { id: "form-wireframe", name: "Form Wireframe", description: "Web form design" },
  { id: "structure-diagram", name: "Structure Diagram", description: "Process/decision diagrams" },
  { id: "database-schema", name: "Database Schema", description: "Database design diagrams" },
] as const;

type SimpleInputType = typeof INPUT_TYPES[number]["id"];

interface CustomQuiz {
  id: string;
  name: string;
  description: string | null;
  timeLimitMinutes: number;
  questionIds: string[];
  isActive: boolean;
  createdAt: string;
}

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

export default function QuizManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<CustomQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<CustomQuiz | null>(null);
  
  const [quizName, setQuizName] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionTopic, setNewQuestionTopic] = useState<string>("");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionMaxMarks, setNewQuestionMaxMarks] = useState(2);
  const [newQuestionAnswer, setNewQuestionAnswer] = useState("");
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [newQuestionInputType, setNewQuestionInputType] = useState<SimpleInputType>("text");
  const [newQuestionStarterCode, setNewQuestionStarterCode] = useState("");
  const [newQuestionLabeledFields, setNewQuestionLabeledFields] = useState<{key: string, label: string}[]>([
    { key: "field1", label: "Field 1" }
  ]);
  const [newQuestionFillBlanksCode, setNewQuestionFillBlanksCode] = useState("");
  const [newQuestionTableRows, setNewQuestionTableRows] = useState(3);
  const [newQuestionTableCols, setNewQuestionTableCols] = useState(2);
  const [newQuestionTableHeaders, setNewQuestionTableHeaders] = useState<string[]>(["Column 1", "Column 2"]);
  const [newQuestionContentBlocks, setNewQuestionContentBlocks] = useState<ContentBlock[]>([
    { id: `cb-${Date.now()}`, type: "text", content: "" }
  ]);
  
  // Fetch all questions including quiz-only questions
  useEffect(() => {
    const fetchAllQuestions = async () => {
      try {
        const response = await fetch('/api/questions/all');
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

  useEffect(() => {
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

  const addContentBlock = (type: "text" | "code") => {
    const newBlock: ContentBlock = {
      id: `cb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: ""
    };
    setNewQuestionContentBlocks([...newQuestionContentBlocks, newBlock]);
  };

  const updateContentBlock = (index: number, content: string) => {
    const updated = [...newQuestionContentBlocks];
    updated[index] = { ...updated[index], content };
    setNewQuestionContentBlocks(updated);
  };

  const removeContentBlock = (index: number) => {
    if (newQuestionContentBlocks.length > 1) {
      setNewQuestionContentBlocks(newQuestionContentBlocks.filter((_, i) => i !== index));
    }
  };

  const handleCreateQuestion = async () => {
    // Validate content blocks - at least one must have content
    const nonEmptyBlocks = newQuestionContentBlocks.filter(b => b.content.trim());
    if (!newQuestionTitle.trim() || !newQuestionTopic || nonEmptyBlocks.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in title, topic, and at least one content block" });
      return;
    }

    // Per-input-type validation
    if (newQuestionInputType === "fill-in-blanks" && !newQuestionFillBlanksCode.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Fill-in-blanks questions require code with blanks" });
      return;
    }
    if (newQuestionInputType === "labeled-inputs") {
      const hasEmptyLabels = newQuestionLabeledFields.some(f => !f.label.trim());
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
      const hasEmptyHeaders = newQuestionTableHeaders.slice(0, newQuestionTableCols).some(h => !h.trim());
      if (hasEmptyHeaders) {
        toast({ variant: "destructive", title: "Error", description: "All column headers must have names" });
        return;
      }
    }

    setCreatingQuestion(true);
    try {
      const questionId = `quiz-q-${Date.now()}`;
      
      // Build input config based on input type
      let inputConfig: Record<string, unknown> | undefined;
      let starterCode: string | undefined;
      
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
            header: header
          }))
        };
      }

      // Get first text content for legacy questionText field
      const firstTextBlock = nonEmptyBlocks.find(b => b.type === "text");
      const questionTextLegacy = firstTextBlock?.content || nonEmptyBlocks[0].content;

      const newQuestion: Question = {
        id: questionId,
        year: 0,
        topic: newQuestionTopic as Question["topic"],
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
          ...(starterCode && { starterCode }),
          ...(inputConfig && { inputConfig })
        }]
      };

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      });

      if (response.ok) {
        const createdQuestion = await response.json();
        setQuestions(prev => [...prev, createdQuestion]);
        setSelectedQuestionIds(prev => [...prev, createdQuestion.id]);
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

  const openEditQuizDialog = (quiz: CustomQuiz) => {
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
        isActive,
      };

      const url = editingQuiz 
        ? `/api/custom-quizzes/${editingQuiz.id}` 
        : "/api/custom-quizzes";
      
      const method = editingQuiz ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
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

  const handleDeleteQuiz = async (quizId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`/api/custom-quizzes/${quizId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const getTopicName = (id: string) => TOPICS.find(t => t.id === id)?.name || id;

  const sortedQuestions = [...questions].sort(compareQuestionsByNumber);
  
  const filteredQuestions = sortedQuestions.filter(q => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      q.title.toLowerCase().includes(term) ||
      q.year.toString().includes(term) ||
      getTopicName(q.topic).toLowerCase().includes(term)
    );
  });

  const questionsByYear = filteredQuestions.reduce((acc, q) => {
    const year = q.isPractice ? 0 : q.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(q);
    return acc;
  }, {} as Record<number, Question[]>);

  const sortedYears = Object.keys(questionsByYear).map(Number).sort((a, b) => {
    if (a === 0) return -1;
    if (b === 0) return 1;
    return b - a;
  });

  const calculateQuizTotalMarks = (questionIds: string[]) => {
    return questionIds.reduce((total, id) => {
      const q = questions.find(q => q.id === id);
      return total + (q ? calculateTotalMarks(q) : 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-neutral-500">Loading quizzes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-[200]">
        <div className="container mx-auto max-w-6xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Custom Quiz Manager</h1>
            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
              {quizzes.length} Quizzes
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setLocation("/teacher/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl p-6">
        <div className="flex justify-end mb-8">
          <Button onClick={openNewQuizDialog} className="bg-purple-600 hover:bg-purple-700" data-testid="button-create-quiz">
            <Plus className="mr-2 h-4 w-4" /> Create New Quiz
          </Button>
        </div>

        {quizzes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileQuestion className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">No Custom Quizzes Yet</h3>
              <p className="text-neutral-500 mb-4">Create custom practice quizzes by selecting questions from your question bank.</p>
              <Button onClick={openNewQuizDialog} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-2 h-4 w-4" /> Create Your First Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className={`hover:shadow-md transition-shadow ${!quiz.isActive ? 'opacity-60' : ''}`} data-testid={`card-quiz-${quiz.id}`}>
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {!quiz.isActive && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 font-medium">
                          INACTIVE
                        </span>
                      )}
                      <span className="text-xs text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 font-medium">
                        {quiz.questionIds.length} Questions
                      </span>
                    </div>
                    <CardTitle className="text-lg">{quiz.name}</CardTitle>
                    {quiz.description && (
                      <CardDescription className="mt-1">{quiz.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditQuizDialog(quiz)} data-testid={`button-edit-quiz-${quiz.id}`}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600" data-testid={`button-delete-quiz-${quiz.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{quiz.name}"? This action cannot be undone.
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
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-neutral-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{quiz.timeLimitMinutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileQuestion className="h-4 w-4" />
                      <span>{calculateQuizTotalMarks(quiz.questionIds)} total marks</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
        <DialogContent 
            className="max-h-[90vh] overflow-y-auto overflow-x-hidden" 
            style={{ maxWidth: "min(42rem, calc(100vw - 2rem))", width: "100%", boxSizing: "border-box" }}
          >
          <DialogHeader>
            <DialogTitle>{editingQuiz ? "Edit Quiz" : "Create New Quiz"}</DialogTitle>
            <DialogDescription>
              Configure your quiz settings and select questions to include.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4" style={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="quizName">Quiz Name *</Label>
                <Input
                  id="quizName"
                  value={quizName}
                  onChange={(e) => setQuizName(e.target.value)}
                  placeholder="e.g., Week 5 Practice Quiz"
                  data-testid="input-quiz-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min={1}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 60)}
                  data-testid="input-time-limit"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quizDescription">Description (optional)</Label>
              <Textarea
                id="quizDescription"
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                placeholder="Brief description of the quiz purpose or topic focus..."
                rows={2}
                data-testid="input-quiz-description"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Make Active</Label>
                <p className="text-xs text-neutral-500">Active quizzes are visible to students</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-quiz-active" />
            </div>

            <div className="space-y-4" style={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
              <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                <Label className="shrink-0">Select Questions ({selectedQuestionIds.length} selected)</Label>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setIsQuestionDialogOpen(true)} className="text-purple-600" data-testid="button-create-question">
                    <PlusCircle className="h-4 w-4 mr-1" /> New
                  </Button>
                  {selectedQuestionIds.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedQuestionIds([])} className="text-neutral-500">
                      <X className="h-4 w-4 mr-1" /> Clear
                    </Button>
                  )}
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search questions..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-questions"
                />
              </div>

              <div className="border rounded-lg max-h-[300px] overflow-y-auto" style={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
                {sortedYears.map((year) => (
                  <Collapsible key={year} defaultOpen={sortedYears.length <= 3}>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 border-b">
                      <ChevronDown className="h-4 w-4 text-neutral-400" />
                      <span className="font-medium">
                        {year === 0 ? "Practice Questions" : year}
                      </span>
                      <span className="text-xs text-neutral-400 ml-auto">
                        {questionsByYear[year].length} questions
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {questionsByYear[year].map((question) => (
                        <div
                          key={question.id}
                          className={`flex items-start gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/30 ${
                            selectedQuestionIds.includes(question.id) ? 'bg-purple-50 dark:bg-purple-950/20' : ''
                          }`}
                          onClick={() => toggleQuestionSelection(question.id)}
                          data-testid={`checkbox-question-${question.id}`}
                        >
                          <Checkbox
                            checked={selectedQuestionIds.includes(question.id)}
                            onCheckedChange={() => toggleQuestionSelection(question.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded whitespace-nowrap">
                                {getTopicName(question.topic)}
                              </span>
                              <span className="text-xs text-neutral-400 whitespace-nowrap">
                                {calculateTotalMarks(question)} marks
                              </span>
                            </div>
                            <p className="font-medium text-sm truncate">{question.title}</p>
                            <p className="text-xs text-neutral-500 truncate">
                              {getQuestionPreviewText(question)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>

              {selectedQuestionIds.length > 0 && (
                <div className="text-sm text-neutral-600 dark:text-neutral-400 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <strong>Selected:</strong> {selectedQuestionIds.length} questions • {calculateQuizTotalMarks(selectedQuestionIds)} total marks
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsDialogOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuiz} className="bg-purple-600 hover:bg-purple-700" data-testid="button-save-quiz">
              <Save className="mr-2 h-4 w-4" />
              {editingQuiz ? "Update Quiz" : "Create Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => { if (!open) resetQuestionForm(); setIsQuestionDialogOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Quiz Question</DialogTitle>
            <DialogDescription>
              Create a new question specifically for this quiz. These questions will only appear in custom quizzes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4" style={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="question-title">Question Title *</Label>
                <Input
                  id="question-title"
                  placeholder="e.g., Variables Question 1"
                  value={newQuestionTitle}
                  onChange={(e) => setNewQuestionTitle(e.target.value)}
                  data-testid="input-question-title"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="question-topic">Topic *</Label>
                <Select value={newQuestionTopic} onValueChange={setNewQuestionTopic}>
                  <SelectTrigger data-testid="select-question-topic">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPICS.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="question-type">Answer Input Type</Label>
              <Select value={newQuestionInputType} onValueChange={(v) => setNewQuestionInputType(v as SimpleInputType)}>
                <SelectTrigger data-testid="select-question-type">
                  <SelectValue placeholder="Select input type" />
                </SelectTrigger>
                <SelectContent>
                  {INPUT_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex flex-col">
                        <span>{type.name}</span>
                        <span className="text-xs text-neutral-500">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Question Content *</Label>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock("text")}
                    data-testid="button-add-text-block"
                  >
                    <Type className="h-4 w-4 mr-1" /> Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock("code")}
                    data-testid="button-add-code-block"
                  >
                    <Code className="h-4 w-4 mr-1" /> Code
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {newQuestionContentBlocks.map((block, index) => (
                  <div key={block.id} className="relative group">
                    <div className="flex items-start gap-2">
                      <div className="flex items-center gap-1 mt-2 text-neutral-400">
                        <GripVertical className="h-4 w-4" />
                        {block.type === "text" ? <Type className="h-4 w-4" /> : <Code className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <Textarea
                          placeholder={block.type === "text" ? "Enter text content..." : "Enter code snippet..."}
                          value={block.content}
                          onChange={(e) => updateContentBlock(index, e.target.value)}
                          rows={block.type === "code" ? 4 : 2}
                          className={block.type === "code" ? "font-mono text-sm" : ""}
                          data-testid={`input-content-block-${index}`}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeContentBlock(index)}
                        disabled={newQuestionContentBlocks.length <= 1}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {newQuestionInputType === "code-editor" && (
              <div className="grid gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                <Label htmlFor="starter-code">Starter Code (optional)</Label>
                <Textarea
                  id="starter-code"
                  placeholder="# Enter starter code that students will see..."
                  value={newQuestionStarterCode}
                  onChange={(e) => setNewQuestionStarterCode(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                  data-testid="input-starter-code"
                />
              </div>
            )}

            {newQuestionInputType === "labeled-inputs" && (
              <div className="grid gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                <Label>Input Fields</Label>
                <div className="space-y-2">
                  {newQuestionLabeledFields.map((field, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Field label"
                        value={field.label}
                        onChange={(e) => {
                          const updated = [...newQuestionLabeledFields];
                          updated[index] = { ...field, label: e.target.value, key: `field${index + 1}` };
                          setNewQuestionLabeledFields(updated);
                        }}
                        className="flex-1"
                        data-testid={`input-field-label-${index}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (newQuestionLabeledFields.length > 1) {
                            setNewQuestionLabeledFields(newQuestionLabeledFields.filter((_, i) => i !== index));
                          }
                        }}
                        disabled={newQuestionLabeledFields.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewQuestionLabeledFields([
                      ...newQuestionLabeledFields,
                      { key: `field${newQuestionLabeledFields.length + 1}`, label: `Field ${newQuestionLabeledFields.length + 1}` }
                    ])}
                    data-testid="button-add-field"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Field
                  </Button>
                </div>
              </div>
            )}

            {newQuestionInputType === "fill-in-blanks" && (
              <div className="grid gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                <Label htmlFor="blanks-code">Code with Blanks</Label>
                <p className="text-xs text-neutral-500">Use _____ (5+ underscores) to indicate blanks students must fill in.</p>
                <Textarea
                  id="blanks-code"
                  placeholder="name = _____&#10;print('Hello', _____)"
                  value={newQuestionFillBlanksCode}
                  onChange={(e) => setNewQuestionFillBlanksCode(e.target.value)}
                  rows={5}
                  className="font-mono text-sm"
                  data-testid="input-blanks-code"
                />
              </div>
            )}

            {newQuestionInputType === "table" && (
              <div className="grid gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="table-rows">Number of Rows</Label>
                    <Input
                      id="table-rows"
                      type="number"
                      min={1}
                      max={20}
                      value={newQuestionTableRows}
                      onChange={(e) => setNewQuestionTableRows(parseInt(e.target.value) || 1)}
                      data-testid="input-table-rows"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="table-cols">Number of Columns</Label>
                    <Input
                      id="table-cols"
                      type="number"
                      min={1}
                      max={10}
                      value={newQuestionTableCols}
                      onChange={(e) => {
                        const cols = Math.min(10, Math.max(1, parseInt(e.target.value) || 1));
                        setNewQuestionTableCols(cols);
                        const headers = [...newQuestionTableHeaders];
                        while (headers.length < cols) headers.push(`Column ${headers.length + 1}`);
                        setNewQuestionTableHeaders(headers.slice(0, cols));
                      }}
                      data-testid="input-table-cols"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Column Headers</Label>
                  <div className="flex flex-wrap gap-2">
                    {newQuestionTableHeaders.slice(0, newQuestionTableCols).map((header, index) => (
                      <Input
                        key={index}
                        placeholder={`Column ${index + 1}`}
                        value={header}
                        onChange={(e) => {
                          const updated = [...newQuestionTableHeaders];
                          updated[index] = e.target.value;
                          setNewQuestionTableHeaders(updated);
                        }}
                        className="w-32"
                        data-testid={`input-table-header-${index}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="question-marks">Maximum Marks</Label>
                <Input
                  id="question-marks"
                  type="number"
                  min={1}
                  max={20}
                  value={newQuestionMaxMarks}
                  onChange={(e) => setNewQuestionMaxMarks(parseInt(e.target.value) || 1)}
                  data-testid="input-question-marks"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="question-answer">Model Answer (optional)</Label>
              <Textarea
                id="question-answer"
                placeholder="Enter the expected answer..."
                value={newQuestionAnswer}
                onChange={(e) => setNewQuestionAnswer(e.target.value)}
                rows={2}
                data-testid="input-question-answer"
              />
              <p className="text-xs text-neutral-500">Used for AI grading guidance.</p>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">Need advanced question types?</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                For drawing, ERD, navigation, or diagram-based questions, use the full Question Editor.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsQuestionDialogOpen(false);
                  setLocation("/teacher/questions?createQuizOnly=true");
                }}
                className="text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900"
              >
                <ExternalLink className="h-4 w-4 mr-1" /> Open Question Editor
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetQuestionForm(); setIsQuestionDialogOpen(false); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateQuestion} 
              className="bg-purple-600 hover:bg-purple-700" 
              disabled={creatingQuestion}
              data-testid="button-save-question"
            >
              {creatingQuestion ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Question
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
