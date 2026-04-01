import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuestions } from "@/lib/QuestionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, ArrowLeft, Key, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const { questions } = useQuestions();
  const { toast } = useToast();

  // Password change state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Email settings state
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);

  // Check auth
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

  const handleLogout = async () => {
    const token = localStorage.getItem("teacher_token");
    
    if (token) {
      try {
        await fetch("/api/teacher/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }

    localStorage.removeItem("teacher_token");
    localStorage.removeItem("teacher_token_expires");
    setLocation("/");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "New password must be at least 8 characters.",
        });
        return;
    }

    if (newPassword !== confirmPassword) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "New passwords do not match.",
        });
        return;
    }

    const token = localStorage.getItem("teacher_token");
    
    try {
      const response = await fetch("/api/teacher/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully.",
        });
        setIsPasswordDialogOpen(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to change password.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to connect to server.",
      });
    }

  };

  const loadEmail = async () => {
    const token = localStorage.getItem("teacher_token");
    if (!token) return;

    try {
      const response = await fetch("/api/teacher/email", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setEmail(data.email || "");
      }
    } catch (error) {
      console.error("Failed to load email:", error);
    }
  };

  const handleOpenEmailDialog = () => {
    loadEmail();
    setIsEmailDialogOpen(true);
  };

  const handleSaveEmail = async () => {
    const token = localStorage.getItem("teacher_token");
    if (!token) return;

    setIsLoadingEmail(true);
    try {
      const response = await fetch("/api/teacher/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Email updated successfully.",
        });
        setIsEmailDialogOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to update email.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to connect to server.",
      });
    } finally {
      setIsLoadingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-[200]">
        <div className="container mx-auto max-w-6xl flex justify-between items-center">
          <div className="flex items-center gap-4">
             <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Teacher Dashboard</h1>
             <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                {questions.length} Questions
             </span>
          </div>
          
          <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" onClick={() => setLocation("/teacher/quizzes")} data-testid="link-quiz-manager">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                Quizzes
             </Button>
             <Button variant="outline" size="sm" onClick={() => setLocation("/teacher/classes")} data-testid="link-class-manager">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Classes
             </Button>

             <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" />

             <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Student View
             </Button>
             
             <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-neutral-600">
                        <Key className="mr-2 h-4 w-4" /> Password
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter your current password and choose a new one.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <Input 
                                type="password" 
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input 
                                type="password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <Input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleChangePassword}>Change Password</Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>

             <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-neutral-600" onClick={handleOpenEmailDialog}>
                        <Mail className="mr-2 h-4 w-4" /> Email
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Email Settings</DialogTitle>
                        <DialogDescription>
                            Set your email address to enable password reset functionality.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input 
                                type="email" 
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                data-testid="input-email-settings"
                            />
                        </div>
                        <p className="text-sm text-neutral-500">
                            This email will be used to send password reset links if you forget your password.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEmail} disabled={isLoadingEmail}>
                            {isLoadingEmail ? "Saving..." : "Save Email"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>

             <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" /> Logout
             </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" onClick={() => setLocation("/teacher/assignments")} data-testid="link-assignment-manager">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">Assignment Manager</h3>
                <p className="text-sm text-neutral-500">Create coursework assignments with sections and parts</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20" onClick={() => setLocation("/teacher/additional-exams")} data-testid="link-additional-exams">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">Additional Exams</h3>
                <p className="text-sm text-neutral-500">Create and manage teacher-authored exam papers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20" onClick={() => setLocation("/teacher/progress")} data-testid="link-student-progress">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">Student Progress</h3>
                <p className="text-sm text-neutral-500">View class performance and exam analytics</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" onClick={() => setLocation("/teacher/past-papers")} data-testid="link-past-paper-manager">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">Past Papers</h3>
                <p className="text-sm text-neutral-500">{questions.length} questions across all years</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
