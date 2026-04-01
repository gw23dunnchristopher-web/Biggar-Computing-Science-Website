import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuestions } from "@/lib/QuestionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Calendar, Database, Globe, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/mode-toggle";
import { useStudentAuth } from "@/components/student-auth-context";

export default function TimedModeSetup() {
  const [, setLocation] = useLocation();
  const { questions } = useQuestions();
  const { student } = useStudentAuth();
  const [optionalSection, setOptionalSection] = useState<"dd" | "wd">("dd");
  const [extraTime, setExtraTime] = useState<"0" | "25" | "33" | "50">("0");
  const [pausedExam, setPausedExam] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("paused_exam");
    if (saved) {
        try {
            setPausedExam(JSON.parse(saved));
        } catch (e) {}
    }
  }, []);
  
  const years = Array.from(new Set(questions.filter(q => !q.isAdditionalExam && q.year).map(q => q.year))).sort((a, b) => b - a);

  const isLoggedIn = !!student || !!localStorage.getItem("teacher_token");
  const [publishedExams, setPublishedExams] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/additional-exams/published")
      .then(r => r.json())
      .then(setPublishedExams)
      .catch(() => {});
  }, [isLoggedIn]);

  const handleResume = () => {
    if (!pausedExam) return;
    setLocation(`/timed-exam/${pausedExam.year}/${pausedExam.optionalSection}?resume=true`);
  };

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
             <div className="inline-flex items-center justify-center p-4 bg-red-100 text-red-700 rounded-full dark:bg-red-900/30 dark:text-red-300 mb-4">
                <Clock className="w-8 h-8" />
             </div>
             <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">Timed Exam Mode</h1>
             <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Simulate real exam conditions. You will have 2 hours to complete the paper. 
                Your grade will be calculated at the end.
             </p>
          </div>

          {pausedExam && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <Clock className="w-5 h-5" /> Resume Pending Exam
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-lg">{pausedExam.year} Paper ({pausedExam.optionalSection === "dd" ? "Database" : "Web"})</p>
                            <p className="text-neutral-500 text-sm">Paused on {new Date(pausedExam.timestamp).toLocaleDateString()} at {new Date(pausedExam.timestamp).toLocaleTimeString()}</p>
                            <p className="text-neutral-500 text-sm mt-1">Time remaining: {Math.floor(pausedExam.timeLeft / 60)} mins</p>
                        </div>
                        <Button onClick={handleResume} className="bg-red-600 hover:bg-red-700">
                            Resume Exam
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
          )}

          {/* Optional Section Selection */}
          <Card className="border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <CardHeader className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                <CardTitle className="text-lg">Choose Optional Section</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <p className="mb-4 text-neutral-600 dark:text-neutral-400">
                    Software Design and Computer Systems are mandatory. Please choose which optional section you want to attempt:
                </p>
                <RadioGroup value={optionalSection} onValueChange={(v) => setOptionalSection(v as "dd" | "wd")} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <RadioGroupItem value="dd" id="dd" className="peer sr-only" />
                        <Label 
                            htmlFor="dd" 
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-600 [&:has([data-state=checked])]:border-red-600 cursor-pointer h-full"
                        >
                            <Database className="mb-3 h-6 w-6" />
                            <div className="text-center font-semibold">Database Design & Development</div>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="wd" id="wd" className="peer sr-only" />
                        <Label 
                            htmlFor="wd" 
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-600 [&:has([data-state=checked])]:border-red-600 cursor-pointer h-full"
                        >
                            <Globe className="mb-3 h-6 w-6" />
                            <div className="text-center font-semibold">Web Design & Development</div>
                        </Label>
                    </div>
                </RadioGroup>
            </CardContent>
          </Card>

          {/* Extra Time Selection */}
          <Card className="border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <CardHeader className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                <CardTitle className="text-lg">Additional Time (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <p className="mb-4 text-neutral-600 dark:text-neutral-400">
                    If you are entitled to additional time, select your allowance below:
                </p>
                <RadioGroup value={extraTime} onValueChange={(v) => setExtraTime(v as "0" | "25" | "33" | "50")} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <RadioGroupItem value="0" id="time-0" className="peer sr-only" />
                        <Label 
                            htmlFor="time-0" 
                            className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-600 [&:has([data-state=checked])]:border-red-600 cursor-pointer"
                        >
                            <div className="text-2xl font-bold">2h</div>
                            <div className="text-sm text-neutral-500">Standard</div>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="25" id="time-25" className="peer sr-only" />
                        <Label 
                            htmlFor="time-25" 
                            className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 cursor-pointer"
                        >
                            <div className="text-2xl font-bold text-green-600">+25%</div>
                            <div className="text-sm text-neutral-500">2h 30m</div>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="33" id="time-33" className="peer sr-only" />
                        <Label 
                            htmlFor="time-33" 
                            className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 cursor-pointer"
                        >
                            <div className="text-2xl font-bold text-green-600">+33%</div>
                            <div className="text-sm text-neutral-500">2h 40m</div>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="50" id="time-50" className="peer sr-only" />
                        <Label 
                            htmlFor="time-50" 
                            className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 cursor-pointer"
                        >
                            <div className="text-2xl font-bold text-green-600">+50%</div>
                            <div className="text-sm text-neutral-500">3h</div>
                        </Label>
                    </div>
                </RadioGroup>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {years.map((year) => (
              <Card 
                key={year} 
                className="hover:shadow-lg transition-all cursor-pointer border-neutral-200 dark:border-neutral-800 hover:border-red-500 group"
                onClick={() => setLocation(`/timed-exam/${year}/${optionalSection}?extraTime=${extraTime}`)}
                data-testid={`card-exam-year-${year}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Calendar className="w-6 h-6 text-neutral-400 group-hover:text-red-500 transition-colors" />
                    {year} Paper
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-500">
                    Start {year} Exam with {optionalSection === 'dd' ? 'Database' : 'Web'}
                  </p>
                  <div className="mt-4 flex items-center text-red-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    Start Exam <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {publishedExams.length > 0 && (
            <>
              <div className="mt-12 mb-6 text-center">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white" data-testid="text-additional-exams-section">Additional Exams</h2>
                <p className="text-neutral-500 mt-1">Teacher-created exams for extra practice</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedExams.map((exam) => (
                  <Card 
                    key={exam.id} 
                    className="hover:shadow-lg transition-all cursor-pointer border-neutral-200 dark:border-neutral-800 hover:border-blue-500 group"
                    onClick={() => setLocation(`/timed-exam/additional/${exam.id}?extraTime=${extraTime}`)}
                    data-testid={`card-additional-exam-${exam.id}`}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <FileText className="w-6 h-6 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                        {exam.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neutral-500">
                        Start additional exam
                      </p>
                      <div className="mt-4 flex items-center text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        Start Exam <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
