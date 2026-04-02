import { Link, useLocation } from "wouter";
import { TOPICS, Topic, Question } from "@/lib/past-papers";
import { Code, Database, Globe, ArrowRight, Clock, BookOpen, LogOut, Shuffle, FileText, User, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useStudentAuth } from "@/components/StudentAuthContext";

const icons = {
  sdcs: Code,
  dd: Database,
  wd: Globe,
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const studentAuth = useStudentAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [randomQuizOpen, setRandomQuizOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["sdcs", "dd", "wd"]);
  const [questionCount, setQuestionCount] = useState(5);
  const [hasPublishedAssignments, setHasPublishedAssignments] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("teacherToken");
    setIsLoggedIn(!!token);
  }, []);

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
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    const checkPublishedAssignments = async () => {
      try {
        const response = await fetch('/api/assignments');
        if (response.ok) {
          const data = await response.json();
          const published = data.filter((a: { isPublished: boolean }) => a.isPublished);
          setHasPublishedAssignments(published.length > 0);
        }
      } catch (error) {
        console.error("Error checking assignments:", error);
      }
    };
    checkPublishedAssignments();
  }, []);


  const handleLogout = () => {
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacherTokenExpires");
    setIsLoggedIn(false);
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(t => t !== topicId)
        : [...prev, topicId]
    );
  };

  const getAvailableQuestionCount = () => {
    return questions.filter(q => selectedTopics.includes(q.topic)).length;
  };

  const calculateTotalMarks = (questionList: Question[]): number => {
    let total = 0;
    for (const question of questionList) {
      for (const sq of question.subQuestions) {
        if (sq.subParts && sq.subParts.length > 0) {
          for (const part of sq.subParts) {
            total += part.maxMarks || 0;
          }
        } else {
          total += sq.maxMarks || 0;
        }
      }
    }
    return total;
  };

  const getEstimatedTime = (): number => {
    const availableQuestions = questions.filter(q => selectedTopics.includes(q.topic));
    const count = Math.min(questionCount, availableQuestions.length);
    const sampleQuestions = availableQuestions.slice(0, count);
    const totalMarks = calculateTotalMarks(sampleQuestions);
    return Math.ceil(totalMarks * 1.125);
  };

  const startRandomQuiz = () => {
    const availableQuestions = questions.filter(q => selectedTopics.includes(q.topic));
    
    if (availableQuestions.length === 0) {
      toast({
        title: "No questions available",
        description: "Please select at least one topic with questions.",
        variant: "destructive"
      });
      return;
    }

    const count = Math.min(questionCount, availableQuestions.length);
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, count);

    const totalMarks = calculateTotalMarks(selectedQuestions);
    const calculatedTime = Math.ceil(totalMarks * 1.125);

    const quizId = `random-${Date.now()}`;
    const quiz = {
      id: quizId,
      name: `Random Quiz (${count} questions)`,
      questionIds: selectedQuestions.map(q => q.id),
      questions: selectedQuestions,
      timeLimit: calculatedTime,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem("student_current_quiz", JSON.stringify(quiz));
    setRandomQuizOpen(false);
    setLocation(`/timed-exam/student-quiz/${quizId}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center font-sans selection:bg-blue-100 selection:text-blue-900">

      <div className="w-full bg-black dark:bg-neutral-800 pt-20 pb-8 mb-12 relative overflow-hidden">
        <img
          src="/revision-n5/Biggar_HS_Logo_1766054584535.png"
          alt=""
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 md:w-48 md:h-48 object-contain opacity-15 pointer-events-none"
        />
        <div className="absolute top-6 left-6 flex items-center gap-4">
          {studentAuth.isLoggedIn ? (
            <div className="flex items-center gap-2" data-testid="student-indicator">
              <div className="flex items-center gap-2 bg-blue-600/20 border border-blue-400/30 rounded-full px-3 py-1.5">
                <User className="w-4 h-4 text-blue-300" />
                <span className="text-sm text-blue-200 font-medium" data-testid="text-student-username">{studentAuth.username}</span>
              </div>
              <Link href="/my-progress">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-600/20 text-green-200 border-green-400/30 hover:bg-green-600/40"
                  data-testid="link-my-progress"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  My Progress
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => studentAuth.logout()}
                data-testid="button-student-logout"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/student/login">
              <Button variant="outline" className="bg-blue-600/20 text-blue-200 border-blue-400/30 hover:bg-blue-600/40" data-testid="link-student-login">
                <User className="w-4 h-4 mr-2" />
                Student Login
              </Button>
            </Link>
          )}

          <Link href="/my-quizzes">
            <Button variant="outline" className="bg-purple-600/20 text-purple-200 border-purple-400/30 hover:bg-purple-600/40">
              <BookOpen className="w-4 h-4 mr-2" />
              My Quizzes
            </Button>
          </Link>

          <Button
            onClick={() => setRandomQuizOpen(true)}
            variant="outline"
            className="bg-orange-500/20 text-orange-200 border-orange-400/30 hover:bg-orange-500/40"
            data-testid="button-random-quiz"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Random Quiz
          </Button>
        </div>

        <div className="absolute top-6 right-6 flex items-center gap-4">
            <a href="/HTML/N5/N5Home.html">
              <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Return to Main Website
              </Button>
            </a>

            {isLoggedIn ? (
              <>
                <Link href="/teacher/dashboard">
                  <Button variant="outline" className="bg-green-600/20 text-green-200 border-green-400/30 hover:bg-green-600/40 hover:text-white">
                    Teacher Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="bg-blue-800/20 text-blue-200 border-blue-400/30 hover:bg-blue-800/40 hover:text-white"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/teacher/login">
                <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Teacher Access
                </Button>
              </Link>
            )}

            <ModeToggle />
          </div>
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full flex flex-col items-center space-y-4 relative z-10">
            <div className="inline-block bg-blue-800 text-white text-sm font-bold px-4 py-1 rounded-full mb-4 uppercase tracking-wider">
              N5 Level
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            CS Revision Tool
            </h1>
            <p className="text-neutral-400 text-sm">Biggar High School</p>
        </motion.div>
      </div>

      <div className="w-full bg-neutral-50 dark:bg-neutral-900/30 py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              Choose Your Topic
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-lg">
              Select a subject to start revising for your N5 Computing Science exam
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {TOPICS.map((topic, index) => {
              const Icon = icons[topic.id as Topic];
              return (
                <Link key={topic.id} href={`/revise/${topic.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="group relative h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-10 hover:shadow-2xl hover:border-blue-700/50 dark:hover:border-blue-700/50 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                  >
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/40 dark:to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-neutral-100 to-transparent dark:from-neutral-800/40 dark:to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="mb-8 p-4 bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 w-fit rounded-2xl group-hover:from-blue-500 group-hover:to-red-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md">
                        <Icon className="w-10 h-10" />
                      </div>

                      <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3 leading-tight">
                        {topic.name}
                      </h3>

                      <p className="text-neutral-600 dark:text-neutral-400 mb-8 flex-grow leading-relaxed text-base">
                        {topic.description}
                      </p>

                      <div className="flex items-center text-blue-800 dark:text-blue-400 font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
                        Start Revision
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-16 flex flex-col items-center">
        {/* Timed Mode CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full mt-4"
        >
          <Link href="/timed-mode">
              <div className="bg-gradient-to-r from-blue-800 to-neutral-900 rounded-2xl p-8 text-white shadow-xl cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 flex items-center justify-between relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                  <div className="relative z-10 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                          <Clock className="w-6 h-6" />
                      </div>
                      <h2 className="text-3xl font-bold mb-2">Timed Exam Mode</h2>
                      <p className="text-blue-100 max-w-xl">
                          Simulate real exam conditions. Choose a paper, answer questions against the clock (1 hour 30 minutes), and get graded automatically at the end.
                      </p>
                  </div>
                  <ArrowRight className="w-8 h-8 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
          </Link>
        </motion.div>

        {hasPublishedAssignments && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full mt-4"
          >
            <Link href="/assignments">
              <div className="bg-gradient-to-r from-purple-600 to-neutral-900 rounded-2xl p-8 text-white shadow-xl cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Coursework Assignment</h2>
                  <p className="text-purple-100 max-w-xl">
                    Complete your N5 coursework assignment. 40 marks, 6 hours. Software Design (compulsory) plus Database OR Web Design.
                  </p>
                </div>
                <ArrowRight className="w-8 h-8 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </motion.div>
        )}

        </div>

      <footer className="w-full py-4 px-6">
        <p className="text-right text-neutral-400 text-xs">© C Dunn</p>
      </footer>

      <Dialog open={randomQuizOpen} onOpenChange={setRandomQuizOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-orange-500" />
              Random Quiz
            </DialogTitle>
            <DialogDescription>
              Generate a quiz with randomly selected questions from your chosen topics.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Topics</Label>
              <div className="space-y-2">
                {TOPICS.map(topic => {
                  const topicQuestionCount = questions.filter(q => q.topic === topic.id).length;
                  const Icon = icons[topic.id as Topic];
                  return (
                    <div 
                      key={topic.id} 
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Checkbox 
                        id={`topic-${topic.id}`}
                        checked={selectedTopics.includes(topic.id)}
                        onCheckedChange={() => toggleTopic(topic.id)}
                        data-testid={`checkbox-topic-${topic.id}`}
                      />
                      <Icon className="w-4 h-4 text-neutral-500" />
                      <Label 
                        htmlFor={`topic-${topic.id}`} 
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {topic.name}
                      </Label>
                      <span className="text-xs text-neutral-500">
                        {topicQuestionCount} questions
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-500">
                {getAvailableQuestionCount()} questions available from selected topics
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question-count" className="text-sm font-medium">
                Number of Questions
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="question-count"
                  type="number"
                  min={1}
                  max={Math.max(1, getAvailableQuestionCount())}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24"
                  data-testid="input-question-count"
                />
                <span className="text-sm text-neutral-500">
                  (max: {getAvailableQuestionCount()})
                </span>
              </div>
            </div>

            <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Estimated Time</p>
                  <p className="text-xs text-neutral-500">Based on 1.125 minutes per mark</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{getEstimatedTime()} min</p>
                  <p className="text-xs text-neutral-500">
                    (~{Math.round(getEstimatedTime() / 1.125)} marks)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRandomQuizOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={startRandomQuiz}
              disabled={selectedTopics.length === 0 || getAvailableQuestionCount() === 0}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="button-start-random-quiz"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Start Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}