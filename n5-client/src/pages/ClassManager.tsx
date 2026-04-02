import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, Plus, Trash2, ChevronDown, UserPlus, KeyRound, Copy, Users, UserMinus, Download, UsersRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClassItem {
  id: string;
  name: string;
  createdAt: string;
}

interface StudentItem {
  id: string;
  username: string;
  classId: string;
  mustChangePassword: boolean;
  createdAt: string;
}

export default function ClassManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState("");
  const [creatingClass, setCreatingClass] = useState(false);

  const [studentsByClass, setStudentsByClass] = useState<Record<string, StudentItem[]>>({});
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const [credentialsDialog, setCredentialsDialog] = useState<{ open: boolean; username: string; password: string }>({
    open: false, username: "", password: ""
  });
  const [resetDialog, setResetDialog] = useState<{ open: boolean; username: string; password: string }>({
    open: false, username: "", password: ""
  });
  const [bulkDialog, setBulkDialog] = useState<{ open: boolean; classId: string; className: string }>({
    open: false, classId: "", className: ""
  });
  const [bulkCount, setBulkCount] = useState("5");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ open: boolean; students: { username: string; plainPassword: string }[]; className: string }>({
    open: false, students: [], className: ""
  });

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
    fetchClasses();
  }, [setLocation]);

  const fetchClasses = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/teacher/classes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = useCallback(async (classId: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/teacher/classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStudentsByClass(prev => ({ ...prev, [classId]: data }));
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  }, []);

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    setCreatingClass(true);
    try {
      const token = getToken();
      const response = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newClassName.trim() })
      });
      if (response.ok) {
        toast({ title: "Success", description: "Class created successfully" });
        setNewClassName("");
        fetchClasses();
      } else {
        const data = await response.json();
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to create class" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Unable to connect to server" });
    } finally {
      setCreatingClass(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/teacher/classes/${classId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        toast({ title: "Success", description: "Class deleted successfully" });
        fetchClasses();
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete class" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Unable to connect to server" });
    }
  };

  const handleAddStudent = async (classId: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/teacher/classes/${classId}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCredentialsDialog({ open: true, username: data.username, password: data.plainPassword });
        fetchStudents(classId);
        fetchClasses();
      } else {
        const data = await response.json();
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to add student" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Unable to connect to server" });
    }
  };

  const handleBulkAddStudents = async () => {
    const count = parseInt(bulkCount);
    if (!count || count < 1 || count > 50) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a number between 1 and 50" });
      return;
    }
    setBulkLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/teacher/classes/${bulkDialog.classId}/students/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ count })
      });
      if (response.ok) {
        const data = await response.json();
        setBulkDialog({ open: false, classId: "", className: "" });
        setBulkResults({ open: true, students: data.students, className: bulkDialog.className });
        fetchStudents(bulkDialog.classId);
        fetchClasses();
      } else {
        const data = await response.json();
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to add students" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Unable to connect to server" });
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadBulkCredentials = () => {
    const rows = bulkResults.students.map(s => `${s.username},${s.plainPassword}`);
    const csv = "Username,Password\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bulkResults.className.replace(/\s+/g, "_")}_new_students.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetPassword = async (studentId: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/teacher/students/${studentId}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResetDialog({ open: true, username: data.username, password: data.plainPassword });
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to reset password" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Unable to connect to server" });
    }
  };

  const handleRemoveStudent = async (studentId: string, classId: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/teacher/students/${studentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        toast({ title: "Success", description: "Student removed successfully" });
        fetchStudents(classId);
        fetchClasses();
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to remove student" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Unable to connect to server" });
    }
  };

  const copyCredentials = (username: string, password: string) => {
    navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`);
    toast({ title: "Copied", description: "Credentials copied to clipboard" });
  };

  const handleDownloadCredentials = async (classId: string, className: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/teacher/classes/${classId}/credentials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch credentials" });
        return;
      }
      const data = await response.json();
      const rows = [["Username", "Password"]];
      for (const s of data.students) {
        if (s.hasChangedPassword) {
          rows.push([s.username, "(password changed by student)"]);
        } else if (s.initialPassword) {
          rows.push([s.username, s.initialPassword]);
        } else {
          rows.push([s.username, "(no initial password stored)"]);
        }
      }
      const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${className.replace(/[^a-zA-Z0-9]/g, "_")}_credentials.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Credentials CSV downloaded" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Unable to download credentials" });
    }
  };

  const handleToggleClass = (classId: string) => {
    if (expandedClassId === classId) {
      setExpandedClassId(null);
    } else {
      setExpandedClassId(classId);
      if (!studentsByClass[classId]) {
        fetchStudents(classId);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-neutral-500">Loading classes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-[200]">
        <div className="container mx-auto max-w-6xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white" data-testid="text-page-title">Class Manager</h1>
            <span className="px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 rounded-full" data-testid="text-class-count">
              {classes.length} Classes
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setLocation("/teacher/dashboard")} data-testid="button-back-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl p-6">
        <div className="flex gap-3 mb-8">
          <Input
            placeholder="New class name..."
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateClass()}
            className="max-w-sm"
            data-testid="input-new-class-name"
          />
          <Button
            onClick={handleCreateClass}
            disabled={creatingClass || !newClassName.trim()}
            className="bg-teal-600 hover:bg-teal-700"
            data-testid="button-create-class"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Class
          </Button>
        </div>

        {classes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2" data-testid="text-empty-state">No Classes Yet</h3>
              <p className="text-neutral-500">Create your first class to start managing students.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {classes.map((cls) => {
              const students = studentsByClass[cls.id] || [];
              const isExpanded = expandedClassId === cls.id;

              return (
                <Collapsible
                  key={cls.id}
                  open={isExpanded}
                  onOpenChange={() => handleToggleClass(cls.id)}
                >
                  <Card className="border-neutral-200 dark:border-neutral-800" data-testid={`card-class-${cls.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CollapsibleTrigger className="flex items-center gap-3 cursor-pointer group flex-1">
                          <ChevronDown className={`h-5 w-5 text-neutral-400 transition-transform duration-200 ${!isExpanded ? '-rotate-90' : ''}`} />
                          <CardTitle className="text-lg" data-testid={`text-class-name-${cls.id}`}>{cls.name}</CardTitle>
                          <span className="px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 rounded-full" data-testid={`text-student-count-${cls.id}`}>
                            {students.length} students
                          </span>
                        </CollapsibleTrigger>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDownloadCredentials(cls.id, cls.name); }}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
                            data-testid={`button-download-credentials-${cls.id}`}
                          >
                            <Download className="h-4 w-4 mr-1" /> Download Logins
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleAddStudent(cls.id); }}
                            className="border-teal-300 text-teal-600 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950/30"
                            data-testid={`button-add-student-${cls.id}`}
                          >
                            <UserPlus className="h-4 w-4 mr-1" /> Add Student
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setBulkDialog({ open: true, classId: cls.id, className: cls.name }); setBulkCount("5"); }}
                            className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30"
                            data-testid={`button-bulk-add-${cls.id}`}
                          >
                            <UsersRound className="h-4 w-4 mr-1" /> Bulk Add
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                data-testid={`button-delete-class-${cls.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Class?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{cls.name}"? This will also remove all students in this class. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteClass(cls.id)} className="bg-red-600 hover:bg-red-700">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {students.length === 0 ? (
                          <p className="text-sm text-neutral-500 py-4 text-center" data-testid={`text-no-students-${cls.id}`}>
                            No students in this class yet. Click "Add Student" to create one.
                          </p>
                        ) : (
                          <div className="border rounded-lg divide-y border-neutral-200 dark:border-neutral-700 divide-neutral-200 dark:divide-neutral-700">
                            {students.map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center justify-between px-4 py-3"
                                data-testid={`row-student-${student.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <Users className="h-4 w-4 text-neutral-400" />
                                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200" data-testid={`text-student-username-${student.id}`}>
                                    {student.username}
                                  </span>
                                  {student.mustChangePassword && (
                                    <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                                      New
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResetPassword(student.id)}
                                    data-testid={`button-reset-password-${student.id}`}
                                  >
                                    <KeyRound className="h-3.5 w-3.5 mr-1" /> Reset Password
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                        data-testid={`button-remove-student-${student.id}`}
                                      >
                                        <UserMinus className="h-3.5 w-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Student?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to remove "{student.username}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleRemoveStudent(student.id, cls.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Remove
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={credentialsDialog.open} onOpenChange={(open) => setCredentialsDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Created</DialogTitle>
            <DialogDescription>
              Share these credentials with the student. They will be asked to change their password on first login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 font-mono text-sm space-y-2">
              <div>
                <span className="text-neutral-500">Username: </span>
                <span className="font-semibold text-neutral-900 dark:text-white" data-testid="text-new-username">{credentialsDialog.username}</span>
              </div>
              <div>
                <span className="text-neutral-500">Password: </span>
                <span className="font-semibold text-neutral-900 dark:text-white" data-testid="text-new-password">{credentialsDialog.password}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => copyCredentials(credentialsDialog.username, credentialsDialog.password)}
              data-testid="button-copy-credentials"
            >
              <Copy className="h-4 w-4 mr-2" /> Copy Credentials
            </Button>
            <Button onClick={() => setCredentialsDialog(prev => ({ ...prev, open: false }))} data-testid="button-close-credentials">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetDialog.open} onOpenChange={(open) => setResetDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset</DialogTitle>
            <DialogDescription>
              The password for {resetDialog.username} has been reset. Share the new password with the student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 font-mono text-sm space-y-2">
              <div>
                <span className="text-neutral-500">Username: </span>
                <span className="font-semibold text-neutral-900 dark:text-white" data-testid="text-reset-username">{resetDialog.username}</span>
              </div>
              <div>
                <span className="text-neutral-500">New Password: </span>
                <span className="font-semibold text-neutral-900 dark:text-white" data-testid="text-reset-password">{resetDialog.password}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => copyCredentials(resetDialog.username, resetDialog.password)}
              data-testid="button-copy-reset-credentials"
            >
              <Copy className="h-4 w-4 mr-2" /> Copy Credentials
            </Button>
            <Button onClick={() => setResetDialog(prev => ({ ...prev, open: false }))} data-testid="button-close-reset">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDialog.open} onOpenChange={(open) => setBulkDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Add Students</DialogTitle>
            <DialogDescription>
              Choose how many students to add to "{bulkDialog.className}". Each student will get an auto-generated username and password.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
              Number of students
            </label>
            <Input
              type="number"
              min="1"
              max="50"
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
              placeholder="e.g. 10"
              data-testid="input-bulk-count"
            />
            <p className="text-xs text-neutral-500 mt-1">Between 1 and 50 students</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(prev => ({ ...prev, open: false }))} data-testid="button-cancel-bulk">
              Cancel
            </Button>
            <Button
              onClick={handleBulkAddStudents}
              disabled={bulkLoading}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-confirm-bulk"
            >
              {bulkLoading ? "Creating..." : `Add ${bulkCount} Student${parseInt(bulkCount) !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkResults.open} onOpenChange={(open) => setBulkResults(prev => ({ ...prev, open }))}>
        <DialogContent style={{ maxWidth: "550px" }}>
          <DialogHeader>
            <DialogTitle>{bulkResults.students.length} Students Created</DialogTitle>
            <DialogDescription>
              The following students have been added to "{bulkResults.className}". Download the CSV to share their login credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-64 overflow-y-auto">
            <div className="border rounded-lg divide-y border-neutral-200 dark:border-neutral-700 divide-neutral-200 dark:divide-neutral-700">
              <div className="flex items-center px-4 py-2 bg-neutral-50 dark:bg-neutral-800 font-medium text-sm">
                <span className="flex-1">Username</span>
                <span className="w-32 text-right">Password</span>
              </div>
              {bulkResults.students.map((s, i) => (
                <div key={i} className="flex items-center px-4 py-2 font-mono text-sm" data-testid={`row-bulk-student-${i}`}>
                  <span className="flex-1">{s.username}</span>
                  <span className="w-32 text-right">{s.plainPassword}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={downloadBulkCredentials}
              data-testid="button-download-bulk"
            >
              <Download className="h-4 w-4 mr-2" /> Download CSV
            </Button>
            <Button onClick={() => setBulkResults(prev => ({ ...prev, open: false }))} data-testid="button-close-bulk">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
