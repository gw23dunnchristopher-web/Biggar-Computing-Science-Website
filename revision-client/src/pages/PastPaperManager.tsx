import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuestions, compareQuestionsByNumber } from "@/lib/QuestionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, ArrowLeft, Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TOPICS, Question } from "@/lib/past-papers";
import { ModeToggle } from "@/components/mode-toggle";

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

  return "No scenario text";
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

export default function PastPaperManager() {
  const [, setLocation] = useLocation();
  const { questions, deleteQuestion } = useQuestions();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("teacher_token");
      const expires = localStorage.getItem("teacher_token_expires");
      if (!token || !expires || parseInt(expires) < Date.now()) {
        localStorage.removeItem("teacher_token");
        localStorage.removeItem("teacher_token_expires");
        setLocation("/teacher/login");
        return;
      }
      try {
        const response = await fetch("/api/teacher/verify", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          localStorage.removeItem("teacher_token");
          localStorage.removeItem("teacher_token_expires");
          setLocation("/teacher/login");
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
      }
    };
    verifyAuth();
  }, [setLocation]);

  const getTopicName = (id: string) => TOPICS.find(t => t.id === id)?.name || id;

  const filteredQuestions = questions.filter(q => {
    const term = searchTerm.toLowerCase();
    if (q.title.toLowerCase().includes(term)) return true;
    if (q.year && q.year.toString().includes(searchTerm)) return true;
    if (q.isAdditionalExam && "additional exam".includes(term)) return true;
    const scenarioText = q.scenario?.contentBlocks?.find(b => b.type === "text")?.content || q.scenario?.text || "";
    if (scenarioText.toLowerCase().includes(term)) return true;
    if (q.subQuestions.some(sq => {
      const subQText = sq.contentBlocks?.find(b => b.type === "text")?.content || sq.questionText || "";
      return subQText.toLowerCase().includes(term);
    })) return true;
    if (q.subQuestions.some(sq => sq.markingScheme.some(ms => ms.toLowerCase().includes(term)))) return true;
    if (q.subQuestions.some(sq => sq.keywords?.some(kw => kw.toLowerCase().includes(term)))) return true;
    return false;
  }).sort(compareQuestionsByNumber);

  const practiceQuestions = filteredQuestions.filter(q => q.isPractice).sort(compareQuestionsByNumber);
  const additionalExamQuestions = filteredQuestions.filter(q => q.isAdditionalExam && !q.isPractice).sort(compareQuestionsByNumber);
  const pastPaperQuestions = filteredQuestions.filter(q => !q.isPractice && !q.isAdditionalExam);

  const questionsByYear = pastPaperQuestions.reduce((acc, q) => {
    const year = q.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(q);
    return acc;
  }, {} as Record<number, typeof questions>);

  Object.keys(questionsByYear).forEach(year => {
    questionsByYear[Number(year)].sort(compareQuestionsByNumber);
  });

  const sortedYears = Object.keys(questionsByYear).map(Number).sort((a, b) => b - a);

  function QuestionCard({ question, badge }: { question: Question; badge?: React.ReactNode }) {
    return (
      <Card className="hover:shadow-md transition-shadow border-neutral-200 dark:border-neutral-800">
        <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {badge}
              <span className="text-sm text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded bg-neutral-50 dark:bg-neutral-900">
                {getTopicName(question.topic)}
              </span>
            </div>
            <CardTitle className="text-lg">{question.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation(`/teacher/question/${question.id}`)} data-testid={`button-edit-${question.id}`}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600" data-testid={`button-delete-${question.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{question.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteQuestion(question.id)} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600 dark:text-neutral-300 text-sm line-clamp-2">
            {getQuestionPreviewText(question)}
          </p>
          <div className="mt-4 text-xs text-neutral-500">
            {question.subQuestions.length} sub-question(s) · {calculateTotalMarks(question)} total marks
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-[200]">
        <div className="container mx-auto max-w-6xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/teacher/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Past Paper Manager</h1>
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              {questions.length} Questions
            </span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="container mx-auto max-w-6xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search questions..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-questions"
            />
          </div>
          <Button onClick={() => setLocation("/teacher/question/new")} className="bg-red-600 hover:bg-red-700" data-testid="button-add-question">
            <Plus className="mr-2 h-4 w-4" /> Add New Question
          </Button>
        </div>

        <div className="grid gap-8">
          {practiceQuestions.length > 0 && (
            <Collapsible defaultOpen={true} className="space-y-2">
              <CollapsibleTrigger className="flex items-center gap-2 w-full group cursor-pointer py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-lg px-2 -mx-2 transition-colors">
                <ChevronDown className="h-5 w-5 text-neutral-400 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                  Practice Questions
                </h2>
                <div className="flex-1 border-b border-neutral-200 dark:border-neutral-700 mt-1 ml-2 group-hover:border-neutral-300 dark:group-hover:border-neutral-600 transition-colors"></div>
                <span className="text-xs text-neutral-400 font-medium">
                  {practiceQuestions.length} questions
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <div className="grid gap-4">
                  {practiceQuestions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      badge={
                        <span className="text-xs text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded bg-green-50 dark:bg-green-950/30 font-medium">
                          PRACTICE
                        </span>
                      }
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {additionalExamQuestions.length > 0 && (
            <Collapsible defaultOpen={false} className="space-y-2">
              <CollapsibleTrigger className="flex items-center gap-2 w-full group cursor-pointer py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-lg px-2 -mx-2 transition-colors">
                <ChevronDown className="h-5 w-5 text-neutral-400 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  Additional Exams
                </h2>
                <div className="flex-1 border-b border-neutral-200 dark:border-neutral-700 mt-1 ml-2 group-hover:border-neutral-300 dark:group-hover:border-neutral-600 transition-colors"></div>
                <span className="text-xs text-neutral-400 font-medium">
                  {additionalExamQuestions.length} questions
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <div className="grid gap-4">
                  {additionalExamQuestions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      badge={
                        <span className="text-sm text-blue-500 border border-blue-200 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700">
                          Additional Exam
                        </span>
                      }
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {sortedYears.map((year) => (
            <Collapsible key={year} defaultOpen={false} className="space-y-2">
              <CollapsibleTrigger className="flex items-center gap-2 w-full group cursor-pointer py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-lg px-2 -mx-2 transition-colors">
                <ChevronDown className="h-5 w-5 text-neutral-400 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                  {year}
                </h2>
                <div className="flex-1 border-b border-neutral-200 dark:border-neutral-700 mt-1 ml-2 group-hover:border-neutral-300 dark:group-hover:border-neutral-600 transition-colors"></div>
                <span className="text-xs text-neutral-400 font-medium">
                  {questionsByYear[year].length} questions
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <div className="grid gap-4">
                  {questionsByYear[year].map((question) => (
                    <QuestionCard key={question.id} question={question} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              No questions found matching your search.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
