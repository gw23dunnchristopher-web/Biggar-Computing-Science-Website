import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { TOPICS, Topic, Question } from "@/lib/past-papers";
import { useQuestions } from "@/lib/QuestionContext";
import { Code, Cpu, Database, Globe, ArrowRight, Clock, Shuffle, BookOpen, ClipboardList, FileText, GraduationCap, LogOut, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useStudentAuth } from "@/components/student-auth-context";

const icons = {
  sdcs: Code,
  dd: Database,
  wd: Globe,
};

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

export default function Home() {
  const [, navigate] = useLocation();
  const { questions, loading } = useQuestions();
  const { toast } = useToast();
  const { student, logout } = useStudentAuth();
  
  const [randomQuizOpen, setRandomQuizOpen] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<Set<Topic>>(new Set<Topic>(["sdcs", "dd", "wd"]));
  const [questionCount, setQuestionCount] = useState(10);

  const questionsByTopic = useMemo(() => {
    const grouped: Record<Topic, Question[]> = { sdcs: [], dd: [], wd: [] };
    questions.forEach(q => {
      if (grouped[q.topic]) {
        grouped[q.topic].push(q);
      }
    });
    return grouped;
  }, [questions]);

  const isLoggedIn = !!student || !!localStorage.getItem("teacher_token");
  const [publishedExams, setPublishedExams] = useState<Array<{ id: string; title: string; isPublished: boolean; createdAt: string }>>([]);
  const [examQuestionCounts, setExamQuestionCounts] = useState<Record<string, { count: number; marks: number }>>({});

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/additional-exams/published")
      .then(r => r.json())
      .then(async (exams) => {
        setPublishedExams(exams);
        const counts: Record<string, { count: number; marks: number }> = {};
        for (const exam of exams) {
          try {
            const qRes = await fetch(`/api/additional-exams/${exam.id}/questions`);
            const qs = await qRes.json();
            const marks = qs.reduce((sum: number, q: any) => {
              let total = 0;
              for (const sq of (q.subQuestions || [])) {
                if (sq.subParts?.length > 0) {
                  for (const p of sq.subParts) total += p.maxMarks || 0;
                } else {
                  total += sq.maxMarks || 0;
                }
              }
              return sum + total;
            }, 0);
            counts[exam.id] = { count: qs.length, marks };
          } catch { counts[exam.id] = { count: 0, marks: 0 }; }
        }
        setExamQuestionCounts(counts);
      })
      .catch(() => {});
  }, [isLoggedIn]);

  const availableQuestions = useMemo(() => {
    return questions.filter(q => selectedTopics.has(q.topic));
  }, [questions, selectedTopics]);

  const maxQuestions = availableQuestions.length;

  const estimatedStats = useMemo(() => {
    const count = Math.min(questionCount, availableQuestions.length);
    if (count === 0) return { marks: 0, time: 0 };
    
    const sorted = [...availableQuestions].sort(() => Math.random() - 0.5);
    const selected = sorted.slice(0, count);
    const totalMarks = selected.reduce((sum, q) => sum + calculateTotalMarks(q), 0);
    const calculatedTime = Math.ceil(totalMarks * 1.125);
    
    return { marks: totalMarks, time: calculatedTime };
  }, [availableQuestions, questionCount]);

  const toggleTopic = (topic: Topic) => {
    const newSelected = new Set(selectedTopics);
    if (newSelected.has(topic)) {
      newSelected.delete(topic);
    } else {
      newSelected.add(topic);
    }
    setSelectedTopics(newSelected);
  };

  const startRandomQuiz = () => {
    if (availableQuestions.length === 0) {
      toast({ title: "No questions available", variant: "destructive" });
      return;
    }

    const count = Math.min(questionCount, availableQuestions.length);
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, count);
    
    const totalMarks = selectedQuestions.reduce((sum, q) => sum + calculateTotalMarks(q), 0);
    const calculatedTime = Math.ceil(totalMarks * 1.125);
    
    const quizId = `random-${Date.now()}`;
    localStorage.setItem("student_current_quiz", JSON.stringify({
      id: quizId,
      name: `Random Quiz (${count} questions)`,
      questions: selectedQuestions,
      timeLimit: calculatedTime,
    }));
    
    setRandomQuizOpen(false);
    navigate(`/timed-exam/student-quiz/${quizId}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center font-sans selection:bg-blue-100 selection:text-blue-900">

      <div className="w-full bg-black dark:bg-neutral-800 pt-6 pb-8 mb-12 relative overflow-hidden">
        <img
          src="/revision/Biggar_HS_Logo_1766054584535.png"
          alt=""
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 md:w-48 md:h-48 object-contain opacity-15 pointer-events-none"
        />
        <div className="relative z-10 px-6 mb-10 flex flex-wrap items-center justify-center sm:justify-between gap-y-3 gap-x-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {student ? (
            <div className="flex items-center gap-2" data-testid="student-indicator">
              <div className="flex items-center gap-2 bg-blue-600/20 border border-blue-400/30 rounded-full px-3 py-1.5">
                <GraduationCap className="w-4 h-4 text-blue-300" />
                <span className="text-sm text-blue-200 font-medium" data-testid="text-student-username">{student.username}</span>
              </div>
              <Link href="/my-progress">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-600/20 text-green-200 border-green-400/30 hover:bg-green-600/40"
                  data-testid="button-my-progress"
                >
                  <Trophy className="w-4 h-4 mr-1" />
                  My Progress
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={logout}
                data-testid="button-student-logout"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/student/login">
              <Button variant="outline" className="bg-blue-600/20 text-blue-200 border-blue-400/30 hover:bg-blue-600/40" data-testid="button-student-login">
                <GraduationCap className="w-4 h-4 mr-2" />
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
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Random Quiz
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <a href="/HTML/Higher/HigherHome.html">
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Return to Main Website
            </Button>
          </a>

          <Link href="/teacher/login">
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Teacher Access
            </Button>
          </Link>

          <ModeToggle />
        </div>
        </div>
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full flex flex-col items-center space-y-4 relative z-10">
            <div className="inline-block bg-red-600 text-white text-sm font-bold px-4 py-1 rounded-full mb-4 uppercase tracking-wider">
              Higher Level
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
              Select a subject to start revising for your Higher Computing Science exam
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

      {publishedExams.length > 0 && (
        <div className="w-full bg-neutral-50 dark:bg-neutral-900/30 py-12">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8 text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-2" data-testid="text-additional-exams-heading">
                Additional Exams
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                Teacher-created exams to help you prepare
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {publishedExams.map((exam, index) => {
                const info = examQuestionCounts[exam.id] || { count: 0, marks: 0 };
                const estimatedTime = Math.ceil(info.marks * 1.125);
                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={`/timed-exam/additional/${exam.id}`}>
                      <div
                        className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 hover:shadow-xl hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
                        data-testid={`card-additional-exam-${index}`}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                            <FileText className="w-6 h-6 text-blue-600 group-hover:text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{exam.title}</h3>
                            <p className="text-sm text-neutral-500">{info.count} question{info.count !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-500">
                          <span>{info.marks} marks</span>
                          <span>~{estimatedTime} min</span>
                        </div>
                        <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          Start Exam <ArrowRight className="ml-2 w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-16 flex flex-col items-center gap-6">
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
                          Simulate real exam conditions. Choose a paper, answer questions against the clock (2 hours), and get graded automatically at the end.
                      </p>
                  </div>
                  <ArrowRight className="w-8 h-8 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full"
        >
          <Link href="/assignments">
              <div className="bg-gradient-to-r from-purple-600 to-neutral-900 rounded-2xl p-8 text-white shadow-xl cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 flex items-center justify-between relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                  <div className="relative z-10 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                          <ClipboardList className="w-6 h-6" />
                      </div>
                      <h2 className="text-3xl font-bold mb-2">Assignments</h2>
                      <p className="text-purple-100 max-w-xl">
                          Complete your coursework assignment. Work through tasks at your own pace with a built-in timer.
                      </p>
                  </div>
                  <ArrowRight className="w-8 h-8 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
          </Link>
        </motion.div>
      </div>

      <footer className="w-full py-4 px-6">
        <p className="text-right text-neutral-400 text-xs">© C Dunn</p>
      </footer>

      <Dialog open={randomQuizOpen} onOpenChange={setRandomQuizOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-orange-500" />
              Random Quiz
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <label className="block text-sm font-medium mb-3">Select Topics</label>
              <div className="space-y-2">
                {TOPICS.map(topic => {
                  const count = questionsByTopic[topic.id as Topic]?.length || 0;
                  return (
                    <div
                      key={topic.id}
                      className="flex items-center gap-3 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                      onClick={() => toggleTopic(topic.id as Topic)}
                    >
                      <Checkbox
                        checked={selectedTopics.has(topic.id as Topic)}
                        onCheckedChange={() => toggleTopic(topic.id as Topic)}
                      />
                      <span className="flex-1 font-medium">{topic.name}</span>
                      <span className="text-sm text-neutral-500">{count} questions</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Number of Questions</label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.max(1, Math.min(parseInt(e.target.value) || 1, maxQuestions)))}
                  className="w-24"
                  min={1}
                  max={maxQuestions}
                />
                <span className="text-sm text-neutral-500">
                  Max: {maxQuestions} available
                </span>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Estimated marks:</span>
                <span className="font-semibold">~{estimatedStats.marks} marks</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-neutral-600 dark:text-neutral-400">Estimated time:</span>
                <span className="font-semibold flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  ~{estimatedStats.time} minutes
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRandomQuizOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={startRandomQuiz}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={selectedTopics.size === 0 || maxQuestions === 0 || loading}
            >
              Start Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}