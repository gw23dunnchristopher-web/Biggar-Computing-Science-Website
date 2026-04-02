import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Clock, FileQuestion, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/mode-toggle";

interface CustomQuiz {
  id: string;
  name: string;
  description: string | null;
  timeLimitMinutes: number;
  questionIds: string[];
  isActive: boolean;
  createdAt: string;
}

interface PausedQuiz {
  quizId: string;
  quizName: string;
  timeLeft: number;
  currentQuestionIndex: number;
  extraTimeAdded: string | null;
  timestamp: string;
}

export default function QuizSelection() {
  const [, setLocation] = useLocation();
  const [quizzes, setQuizzes] = useState<CustomQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<CustomQuiz | null>(null);
  const [extraTime, setExtraTime] = useState<"0" | "25" | "33" | "50">("0");
  const [pausedQuiz, setPausedQuiz] = useState<PausedQuiz | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("paused_quiz");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.isQuiz) {
          setPausedQuiz(data);
        }
      } catch (e) {
        console.error("Error parsing paused quiz:", e);
      }
    }

    const fetchQuizzes = async () => {
      try {
        const response = await fetch("/api/custom-quizzes/active");
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

    fetchQuizzes();
  }, []);

  const handleResumeQuiz = () => {
    if (!pausedQuiz) return;
    setLocation(`/timed-exam/quiz/${pausedQuiz.quizId}?resume=true`);
  };

  const calculateAdjustedTime = (baseMinutes: number) => {
    const multiplier = 1 + parseInt(extraTime) / 100;
    return Math.round(baseMinutes * multiplier);
  };

  const handleStartQuiz = () => {
    if (!selectedQuiz) return;
    
    const adjustedTime = calculateAdjustedTime(selectedQuiz.timeLimitMinutes);
    localStorage.setItem("quiz_session", JSON.stringify({
      quizId: selectedQuiz.id,
      quizName: selectedQuiz.name,
      timeLimit: adjustedTime * 60,
      startedAt: Date.now(),
      extraTimePercent: parseInt(extraTime),
    }));
    
    setLocation(`/timed-exam/quiz/${selectedQuiz.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-neutral-500">Loading quizzes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
          <ModeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 bg-purple-100 text-purple-700 rounded-full dark:bg-purple-900/30 dark:text-purple-300 mb-4">
              <FileQuestion className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">Practice Quizzes</h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Select a quiz created by your teacher. Each quiz has a time limit and will be graded automatically.
            </p>
          </div>

          {pausedQuiz && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <CardTitle className="text-lg text-amber-700 dark:text-amber-400">Resume Paused Quiz</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">{pausedQuiz.quizName}</p>
                      <p className="text-sm text-neutral-500">
                        Time remaining: {Math.floor(pausedQuiz.timeLeft / 60)}:{(pausedQuiz.timeLeft % 60).toString().padStart(2, "0")}
                        {pausedQuiz.extraTimeAdded && ` (${pausedQuiz.extraTimeAdded} extra time)`}
                      </p>
                    </div>
                    <Button
                      onClick={handleResumeQuiz}
                      className="bg-amber-600 hover:bg-amber-700"
                      data-testid="button-resume-quiz"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" /> Resume
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {quizzes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <FileQuestion className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">No Quizzes Available</h3>
                <p className="text-neutral-500">Your teacher hasn't created any practice quizzes yet. Check back later!</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4">
                {quizzes.map((quiz, index) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedQuiz?.id === quiz.id
                          ? "border-2 border-purple-500 bg-purple-50/50 dark:bg-purple-950/20"
                          : "border-neutral-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-700"
                      }`}
                      onClick={() => setSelectedQuiz(quiz)}
                      data-testid={`card-quiz-${quiz.id}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{quiz.name}</CardTitle>
                            {quiz.description && (
                              <CardDescription className="mt-1">{quiz.description}</CardDescription>
                            )}
                          </div>
                          {selectedQuiz?.id === quiz.id && (
                            <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Selected
                            </div>
                          )}
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
                            <span>{quiz.questionIds.length} questions</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {selectedQuiz && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="border-neutral-200 dark:border-neutral-800 overflow-hidden">
                    <CardHeader className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                      <CardTitle className="text-lg">Additional Time (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="mb-4 text-neutral-600 dark:text-neutral-400">
                        If you are entitled to additional time, select your allowance below:
                      </p>
                      <RadioGroup
                        value={extraTime}
                        onValueChange={(v) => setExtraTime(v as typeof extraTime)}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                      >
                        {[
                          { value: "0", label: "Standard Time" },
                          { value: "25", label: "+25% Time" },
                          { value: "33", label: "+33% Time" },
                          { value: "50", label: "+50% Time" },
                        ].map((option) => (
                          <div key={option.value}>
                            <RadioGroupItem value={option.value} id={`time-${option.value}`} className="peer sr-only" />
                            <Label
                              htmlFor={`time-${option.value}`}
                              className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 cursor-pointer text-center"
                            >
                              <span className="font-semibold">{option.label}</span>
                              <span className="text-xs text-neutral-500 mt-1">
                                {calculateAdjustedTime(selectedQuiz.timeLimitMinutes)} mins
                              </span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-purple-600 to-purple-800 text-white border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{selectedQuiz.name}</h3>
                          <p className="text-purple-200">
                            {selectedQuiz.questionIds.length} questions • {calculateAdjustedTime(selectedQuiz.timeLimitMinutes)} minutes
                          </p>
                        </div>
                        <Button
                          onClick={handleStartQuiz}
                          size="lg"
                          className="bg-white text-purple-700 hover:bg-purple-100"
                          data-testid="button-start-quiz"
                        >
                          <PlayCircle className="mr-2 h-5 w-5" />
                          Start Quiz
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
