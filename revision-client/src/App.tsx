import { Switch, Route, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuestionProvider } from "@/lib/QuestionContext";
import { ThemeProvider } from "@/components/theme-provider";
import { StudentAuthProvider } from "@/components/student-auth-context";
import { AccessibilityProvider } from "@/components/AccessibilityContext";
import AccessibilityPanel from "@/components/AccessibilityPanel";
import ReadingGuide from "@/components/ReadingGuide";
import TTSHandler from "@/components/TTSHandler";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("@/pages/Home"));
const Revision = lazy(() => import("@/pages/Revision"));
const TeacherLogin = lazy(() => import("@/pages/TeacherLogin"));
const StudentLogin = lazy(() => import("@/pages/StudentLogin"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const TeacherDashboard = lazy(() => import("@/pages/TeacherDashboard"));
const QuestionEditor = lazy(() => import("@/pages/QuestionEditor"));
const TimedModeSetup = lazy(() => import("@/pages/TimedModeSetup"));
const TimedExam = lazy(() => import("@/pages/TimedExam"));
const ExamResults = lazy(() => import("@/pages/ExamResults"));
const MyQuizzes = lazy(() => import("@/pages/MyQuizzes"));
const QuizManager = lazy(() => import("@/pages/QuizManager"));
const AssignmentManager = lazy(() => import("@/pages/AssignmentManager"));
const AssignmentView = lazy(() => import("@/pages/AssignmentView"));
const StudentProgress = lazy(() => import("@/pages/StudentProgress"));
const ClassManager = lazy(() => import("@/pages/ClassManager"));
const AdditionalExamManager = lazy(() => import("@/pages/AdditionalExamManager"));
const ClassProgress = lazy(() => import("@/pages/ClassProgress"));
const PastPaperManager = lazy(() => import("@/pages/PastPaperManager"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Sync both teacher token key-pairs on startup so switching between
// the Higher and N5 apps does not require re-login
;(function syncTeacherTokens() {
  const higherToken = localStorage.getItem("teacher_token");
  const higherExpires = localStorage.getItem("teacher_token_expires");
  const n5Token = localStorage.getItem("teacherToken");
  const n5Expires = localStorage.getItem("teacherTokenExpires");
  if (higherToken && higherExpires && (!n5Token || !n5Expires)) {
    localStorage.setItem("teacherToken", higherToken);
    localStorage.setItem("teacherTokenExpires", higherExpires);
  } else if (n5Token && n5Expires && (!higherToken || !higherExpires)) {
    localStorage.setItem("teacher_token", n5Token);
    localStorage.setItem("teacher_token_expires", n5Expires);
  }
})();

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-neutral-500">Loading...</span>
      </div>
    </div>
  );
}

function AppRouter() {
  return (
    <Router base="/revision">
      <Suspense fallback={<LoadingSpinner />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/revise/:topic" component={Revision} />
          <Route path="/timed-mode" component={TimedModeSetup} />
          <Route path="/timed-exam/additional/:examId" component={TimedExam} />
          <Route path="/timed-exam/:year/:optionalSection" component={TimedExam} />
          <Route path="/exam-results" component={ExamResults} />
          <Route path="/my-quizzes" component={MyQuizzes} />
          <Route path="/my-progress" component={StudentProgress} />
          <Route path="/student/login" component={StudentLogin} />
          <Route path="/teacher/login" component={TeacherLogin} />
          <Route path="/teacher/reset-password/:token" component={ResetPassword} />
          <Route path="/teacher/dashboard" component={TeacherDashboard} />
          <Route path="/teacher/quizzes" component={QuizManager} />
          <Route path="/assignments" component={AssignmentView} />
          <Route path="/assignment/:id/task/:sectionId" component={AssignmentView} />
          <Route path="/assignment/:id" component={AssignmentView} />
          <Route path="/teacher/classes" component={ClassManager} />
          <Route path="/teacher/progress/:classId" component={ClassProgress} />
          <Route path="/teacher/progress" component={ClassProgress} />
          <Route path="/teacher/additional-exams" component={AdditionalExamManager} />
          <Route path="/teacher/past-papers" component={PastPaperManager} />
          <Route path="/teacher/assignments" component={AssignmentManager} />
          <Route path="/teacher/question/:id" component={QuestionEditor} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AccessibilityProvider>
          <StudentAuthProvider>
            <QuestionProvider>
              <TooltipProvider>
                <Toaster />
                <AppRouter />
                <AccessibilityPanel />
                <ReadingGuide />
                <TTSHandler />
              </TooltipProvider>
            </QuestionProvider>
          </StudentAuthProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
