import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuestions, compareQuestionsByNumber } from "@/lib/QuestionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, LogOut, ArrowLeft, Search, ChevronDown, Key, FileQuestion, Mail, Users, BarChart3, Eye, EyeOff } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { TOPICS, Question } from "@/lib/past-papers";
import { useToast } from "@/hooks/use-toast";
import type { AdditionalPaper } from "@shared/schema";

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

export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const { questions, deleteQuestion } = useQuestions();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Password change state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Email settings state
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isEmailSaving, setIsEmailSaving] = useState(false);

  // Additional papers state
  const [additionalPapers, setAdditionalPapers] = useState<(AdditionalPaper & { questionCount?: number })[]>([]);
  const [isCreatePaperDialogOpen, setIsCreatePaperDialogOpen] = useState(false);
  const [newPaperName, setNewPaperName] = useState("");
  const [isCreatingPaper, setIsCreatingPaper] = useState(false);

  const fetchAdditionalPapers = useCallback(async () => {
    const token = localStorage.getItem("teacherToken");
    if (!token) return;
    try {
      const response = await fetch("/api/teacher/additional-papers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAdditionalPapers(data);
      }
    } catch (error) {
      console.error("Failed to fetch additional papers:", error);
    }
  }, []);

  const handleCreatePaper = async () => {
    if (!newPaperName.trim()) return;
    setIsCreatingPaper(true);
    const token = localStorage.getItem("teacherToken");
    try {
      const response = await fetch("/api/teacher/additional-papers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newPaperName.trim() })
      });
      if (response.ok) {
        toast({ title: "Success", description: "Paper created successfully." });
        setNewPaperName("");
        setIsCreatePaperDialogOpen(false);
        fetchAdditionalPapers();
      } else {
        const data = await response.json();
        toast({ variant: "destructive", title: "Error", description: data.message || "Failed to create paper." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Unable to connect to server." });
    } finally {
      setIsCreatingPaper(false);
    }
  };

  const handleTogglePublish = async (paperId: string, currentlyPublished: boolean) => {
    const token = localStorage.getItem("teacherToken");
    try {
      const response = await fetch(`/api/teacher/additional-papers/${paperId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isPublished: !currentlyPublished })
      });
      if (response.ok) {
        toast({ title: "Success", description: `Paper ${!currentlyPublished ? "published" : "unpublished"} successfully.` });
        fetchAdditionalPapers();
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update paper." });
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    const token = localStorage.getItem("teacherToken");
    try {
      const response = await fetch(`/api/teacher/additional-papers/${paperId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        toast({ title: "Success", description: "Paper and its questions deleted." });
        fetchAdditionalPapers();
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete paper." });
    }
  };

  // Check auth
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("teacherToken");
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
  }, [setLocation]);

  useEffect(() => {
    fetchAdditionalPapers();
  }, [fetchAdditionalPapers]);

  const handleLogout = async () => {
    const token = localStorage.getItem("teacherToken");
    
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

    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacherTokenExpires");
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

    const token = localStorage.getItem("teacherToken");
    
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

  const fetchEmail = async () => {
    const token = localStorage.getItem("teacherToken");
    if (!token) return;
    
    try {
      const response = await fetch("/api/teacher/email", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmail(data.email || "");
      }
    } catch (error) {
      console.error("Failed to fetch email:", error);
    }
  };

  const handleSaveEmail = async () => {
    setIsEmailSaving(true);
    const token = localStorage.getItem("teacherToken");
    
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
      setIsEmailSaving(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const term = searchTerm.toLowerCase();
    
    // Search in title
    if (q.title.toLowerCase().includes(term)) return true;
    
    // Search in year
    if (q.year.toString().includes(searchTerm)) return true;
    
    // Search in scenario text (both contentBlocks and legacy)
    const scenarioText = q.scenario?.contentBlocks?.find(b => b.type === "text")?.content || q.scenario?.text || "";
    if (scenarioText.toLowerCase().includes(term)) return true;
    
    // Search in subquestion text (both contentBlocks and legacy)
    if (q.subQuestions.some(sq => {
      const subQText = sq.contentBlocks?.find(b => b.type === "text")?.content || sq.questionText || "";
      return subQText.toLowerCase().includes(term);
    })) return true;
    
    // Search in marking scheme
    if (q.subQuestions.some(sq => sq.markingScheme.some(ms => ms.toLowerCase().includes(term)))) return true;
    
    // Search in keywords
    if (q.subQuestions.some(sq => sq.keywords?.some(kw => kw.toLowerCase().includes(term)))) return true;
    
    return false;
  }).sort(compareQuestionsByNumber); // Sort by question number

  const getTopicName = (id: string) => TOPICS.find(t => t.id === id)?.name || id;

  // Separate practice questions, additional exam questions, and past paper questions
  const practiceQuestions = filteredQuestions.filter(q => q.isPractice).sort(compareQuestionsByNumber);
  const additionalExamQuestions = filteredQuestions.filter(q => q.isAdditionalExam && !q.isPractice).sort(compareQuestionsByNumber);
  const pastPaperQuestions = filteredQuestions.filter(q => !q.isPractice && !q.isAdditionalExam);

  // Group past paper questions by year, then sort each group by title
  const questionsByYear = pastPaperQuestions.reduce((acc, q) => {
    const year = q.year;
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(q);
    return acc;
  }, {} as Record<number, typeof questions>);

  // Sort questions within each year by question number
  Object.keys(questionsByYear).forEach(year => {
    questionsByYear[Number(year)].sort(compareQuestionsByNumber);
  });

  const sortedYears = Object.keys(questionsByYear).map(Number).sort((a, b) => b - a);

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
          
          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={() => setLocation("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Student View
             </Button>
             
             <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="text-neutral-600">
                        <Key className="mr-2 h-4 w-4" /> Change Password
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

             <Dialog open={isEmailDialogOpen} onOpenChange={(open) => {
                setIsEmailDialogOpen(open);
                if (open) fetchEmail();
             }}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="text-neutral-600">
                        <Mail className="mr-2 h-4 w-4" /> Email Settings
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Email Settings</DialogTitle>
                        <DialogDescription>
                            Set your email address for password reset.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input 
                                type="email" 
                                placeholder="teacher@school.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEmail} disabled={isEmailSaving}>
                            {isEmailSaving ? "Saving..." : "Save Email"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>

             <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" /> Logout
             </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -tranneutral-y-1/2 h-4 w-4 text-neutral-400" />
                <Input 
                    placeholder="Search questions..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <Button onClick={() => setLocation("/teacher/quizzes")} variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30" data-testid="button-manage-quizzes">
                <FileQuestion className="mr-2 h-4 w-4" /> Manage Quizzes
            </Button>
            <Button onClick={() => setLocation("/teacher/classes")} variant="outline" className="border-teal-300 text-teal-600 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950/30" data-testid="button-manage-classes">
                <Users className="mr-2 h-4 w-4" /> Manage Classes
            </Button>
            <Button onClick={() => setLocation("/teacher/assignments")} variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30" data-testid="button-manage-assignments">
                <FileQuestion className="mr-2 h-4 w-4" /> Manage Assignments
            </Button>
            <Button onClick={() => setLocation("/teacher/analytics")} variant="outline" className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/30" data-testid="button-analytics">
                <BarChart3 className="mr-2 h-4 w-4" /> Analytics
            </Button>
            <Button onClick={() => setLocation("/teacher/question/new")} className="bg-red-600 hover:bg-red-700">
                <Plus className="mr-2 h-4 w-4" /> Add New Question
            </Button>
        </div>

        <div className="grid gap-8">
            {practiceQuestions.length > 0 && (
              <Collapsible defaultOpen={false} className="space-y-2">
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
                        <Card key={question.id} className="hover:shadow-md transition-shadow border-neutral-200 dark:border-neutral-800">
                            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded bg-neutral-50 dark:bg-neutral-900">
                                            {getTopicName(question.topic)}
                                        </span>
                                        <span className="text-xs text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded bg-green-50 dark:bg-green-950/30 font-medium">
                                            PRACTICE
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg">{question.title}</CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setLocation(`/teacher/question/${question.id}`)}>
                                        <Edit className="h-4 w-4 mr-2" /> Edit
                                    </Button>
                                    
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600">
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
                                    {question.subQuestions.length} sub-question(s) • {calculateTotalMarks(question)} total marks
                                </div>
                            </CardContent>
                        </Card>
                      ))}
                    </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            <Collapsible defaultOpen={false} className="space-y-2">
              <CollapsibleTrigger className="flex items-center gap-2 w-full group cursor-pointer py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-lg px-2 -mx-2 transition-colors">
                  <ChevronDown className="h-5 w-5 text-neutral-400 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                  <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                    Additional Papers
                  </h2>
                  <div className="flex-1 border-b border-neutral-200 dark:border-neutral-700 mt-1 ml-2 group-hover:border-neutral-300 dark:group-hover:border-neutral-600 transition-colors"></div>
                  <span className="text-xs text-neutral-400 font-medium">
                      {additionalPapers.length} paper(s)
                  </span>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pt-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  <div className="mb-4">
                    <Dialog open={isCreatePaperDialogOpen} onOpenChange={setIsCreatePaperDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-amber-600 hover:bg-amber-700" data-testid="button-create-paper">
                          <Plus className="mr-2 h-4 w-4" /> Create New Paper
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Additional Paper</DialogTitle>
                          <DialogDescription>
                            Enter a name for the new additional exam paper.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Paper Name</Label>
                            <Input 
                              placeholder="e.g. Mock Exam 2025"
                              value={newPaperName}
                              onChange={(e) => setNewPaperName(e.target.value)}
                              data-testid="input-paper-name"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCreatePaperDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleCreatePaper} disabled={isCreatingPaper || !newPaperName.trim()} data-testid="button-confirm-create-paper">
                            {isCreatingPaper ? "Creating..." : "Create Paper"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {additionalPapers.length === 0 && (
                    <div className="text-center py-8 text-neutral-500">
                      No additional papers yet. Create one to get started.
                    </div>
                  )}

                  <div className="grid gap-4">
                    {additionalPapers.map((paper) => {
                      const paperQuestions = additionalExamQuestions.filter(q => q.additionalPaperId === paper.id);
                      const totalMarks = paperQuestions.reduce((sum, q) => sum + calculateTotalMarks(q), 0);
                      return (
                        <Collapsible key={paper.id} className="border border-neutral-200 dark:border-neutral-800 rounded-lg" data-testid={`card-paper-${paper.id}`}>
                          <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 rounded-t-lg">
                            <CollapsibleTrigger className="flex items-center gap-3 flex-1 cursor-pointer group">
                              <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200" data-testid={`text-paper-name-${paper.id}`}>{paper.name}</h3>
                                <span className="text-xs text-neutral-500 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded" data-testid={`text-paper-question-count-${paper.id}`}>
                                  {paper.questionCount ?? paperQuestions.length} question(s) • {totalMarks} marks
                                </span>
                                {paper.isPublished ? (
                                  <span className="text-xs text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded bg-green-50 dark:bg-green-950/30 font-medium flex items-center gap-1" data-testid={`status-published-${paper.id}`}>
                                    <Eye className="h-3 w-3" /> Published
                                  </span>
                                ) : (
                                  <span className="text-xs text-neutral-500 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded bg-neutral-50 dark:bg-neutral-900 font-medium flex items-center gap-1" data-testid={`status-unpublished-${paper.id}`}>
                                    <EyeOff className="h-3 w-3" /> Unpublished
                                  </span>
                                )}
                              </div>
                            </CollapsibleTrigger>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`publish-${paper.id}`} className="text-xs text-neutral-500">
                                  {paper.isPublished ? "Published" : "Draft"}
                                </Label>
                                <Switch
                                  id={`publish-${paper.id}`}
                                  checked={!!paper.isPublished}
                                  onCheckedChange={() => handleTogglePublish(paper.id, !!paper.isPublished)}
                                  data-testid={`switch-publish-${paper.id}`}
                                />
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLocation(`/teacher/question/new?paperId=${paper.id}`)}
                                data-testid={`button-add-question-${paper.id}`}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Add Question
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600" data-testid={`button-delete-paper-${paper.id}`}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Paper?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{paper.name}" and all its questions? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePaper(paper.id)} className="bg-red-600 hover:bg-red-700">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          <CollapsibleContent>
                            <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 space-y-3 bg-neutral-50 dark:bg-neutral-950/50 rounded-b-lg">
                              {paperQuestions.length === 0 ? (
                                <div className="text-center py-4 text-neutral-500 text-sm">
                                  No questions in this paper yet.
                                </div>
                              ) : (
                                paperQuestions.map((question) => (
                                  <Card key={question.id} className="hover:shadow-md transition-shadow border-neutral-200 dark:border-neutral-800">
                                    <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                                      <div>
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded bg-neutral-50 dark:bg-neutral-900">
                                            {getTopicName(question.topic)}
                                          </span>
                                        </div>
                                        <CardTitle className="text-lg">{question.title}</CardTitle>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setLocation(`/teacher/question/${question.id}`)}>
                                          <Edit className="h-4 w-4 mr-2" /> Edit
                                        </Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600">
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
                                        {question.subQuestions.length} sub-question(s) • {calculateTotalMarks(question)} total marks
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
              </CollapsibleContent>
            </Collapsible>
            
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
                        <Card key={question.id} className="hover:shadow-md transition-shadow border-neutral-200 dark:border-neutral-800">
                            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded bg-neutral-50 dark:bg-neutral-900">
                                            {getTopicName(question.topic)}
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg">{question.title}</CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setLocation(`/teacher/question/${question.id}`)}>
                                        <Edit className="h-4 w-4 mr-2" /> Edit
                                    </Button>
                                    
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600">
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
                                    {question.subQuestions.length} sub-question(s) • {calculateTotalMarks(question)} total marks
                                </div>
                            </CardContent>
                        </Card>
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
