import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  UserPlus,
  KeyRound,
  Copy,
  Eye,
  EyeOff,
  Download,
  Pencil,
  UsersRound,
} from "lucide-react";

interface ClassInfo {
  id: string;
  name: string;
  createdAt: string;
}

interface StudentInfo {
  id: string;
  username: string;
  classId: string;
  mustChangePassword: boolean;
  createdAt: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem("teacherToken") || localStorage.getItem("teacher_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export default function ClassManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [studentCount, setStudentCount] = useState(1);

  const [credentialModal, setCredentialModal] = useState<{
    credentials: { username: string; password: string }[];
    title: string;
  } | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const [deleteClassTarget, setDeleteClassTarget] = useState<ClassInfo | null>(null);
  const [deleteStudentTarget, setDeleteStudentTarget] = useState<StudentInfo | null>(null);

  const [renameTarget, setRenameTarget] = useState<StudentInfo | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("teacherToken") || localStorage.getItem("teacher_token");
    const expires = localStorage.getItem("teacherTokenExpires") || localStorage.getItem("teacher_token_expires");
    if (!token || !expires || parseInt(expires) < Date.now()) {
      setLocation("/teacher/login");
      return;
    }
    fetchClasses();
  }, [setLocation]);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/teacher/classes", { headers: getAuthHeaders() });
      if (res.ok) {
        setClasses(await res.json());
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load classes" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = useCallback(async (classId: string) => {
    try {
      const res = await fetch(`/api/teacher/classes/${classId}/students`, { headers: getAuthHeaders() });
      if (res.ok) {
        setStudents(await res.json());
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load students" });
    }
  }, [toast]);

  const handleSelectClass = (cls: ClassInfo) => {
    setSelectedClass(cls);
    fetchStudents(cls.id);
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    try {
      const res = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newClassName.trim() }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Class created" });
        setNewClassName("");
        setIsCreateClassOpen(false);
        fetchClasses();
      } else {
        const data = await res.json();
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to create class" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Unable to connect to server" });
    }
  };

  const handleDeleteClass = async () => {
    if (!deleteClassTarget) return;
    try {
      const res = await fetch(`/api/teacher/classes/${deleteClassTarget.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Class deleted" });
        if (selectedClass?.id === deleteClassTarget.id) {
          setSelectedClass(null);
          setStudents([]);
        }
        fetchClasses();
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete class" });
    } finally {
      setDeleteClassTarget(null);
    }
  };

  const handleAddStudents = async () => {
    if (!selectedClass) return;
    try {
      const count = studentCount;
      let result: { username: string; plainPassword: string }[] = [];

      if (count === 1) {
        const res = await fetch(`/api/teacher/classes/${selectedClass.id}/students`, {
          method: "POST",
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          result = [{ username: data.username, password: data.plainPassword } as any];
          result = [{ username: data.username, plainPassword: data.plainPassword }];
        } else {
          const data = await res.json();
          toast({ variant: "destructive", title: "Error", description: data.error || "Failed to add student" });
          return;
        }
      } else {
        const res = await fetch(`/api/teacher/classes/${selectedClass.id}/students/bulk`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ count }),
        });
        if (res.ok) {
          const data = await res.json();
          result = data.students;
        } else {
          const data = await res.json();
          toast({ variant: "destructive", title: "Error", description: data.error || "Failed to add students" });
          return;
        }
      }

      setIsAddStudentOpen(false);
      setStudentCount(1);
      setCredentialModal({
        credentials: result.map((s) => ({ username: s.username, password: s.plainPassword })),
        title: result.length === 1 ? "New Student Created" : `${result.length} Students Created`,
      });
      setShowPasswords(false);
      fetchStudents(selectedClass.id);
      fetchClasses();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Unable to connect to server" });
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentTarget || !selectedClass) return;
    try {
      const res = await fetch(`/api/teacher/students/${deleteStudentTarget.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Student removed" });
        fetchStudents(selectedClass.id);
        fetchClasses();
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove student" });
    } finally {
      setDeleteStudentTarget(null);
    }
  };

  const handleResetPassword = async (student: StudentInfo) => {
    try {
      const res = await fetch(`/api/teacher/students/${student.id}/reset-password`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCredentialModal({
          credentials: [{ username: student.username, password: data.plainPassword }],
          title: "Password Reset",
        });
        setShowPasswords(false);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to reset password" });
    }
  };

  const handleRenameStudent = async () => {
    if (!renameTarget || !selectedClass || !renameValue.trim()) return;
    try {
      const res = await fetch(`/api/teacher/students/${renameTarget.id}/username`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ username: renameValue.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: "Success", description: `Username changed to "${data.username}"` });
        setRenameTarget(null);
        fetchStudents(selectedClass.id);
      } else {
        const data = await res.json();
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to rename student" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Unable to connect to server" });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  const handleDownloadCsv = (credentials: { username: string; password: string }[]) => {
    const className = selectedClass?.name || "Class";
    const csvRows = ["Username,Initial Password"];
    for (const c of credentials) {
      csvRows.push(`${c.username},${c.password}`);
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = className.replace(/[^a-zA-Z0-9]/g, "_") + "_credentials.csv";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-[200]">
        <div className="container mx-auto max-w-6xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setLocation("/teacher/dashboard")} data-testid="button-back-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
            </Button>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Class Manager</h1>
          </div>
          <Button onClick={() => setIsCreateClassOpen(true)} className="bg-red-600 hover:bg-red-700" data-testid="button-create-class">
            <Plus className="mr-2 h-4 w-4" /> New Class
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Classes</h2>
            {classes.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-neutral-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No classes yet</p>
                  <p className="text-sm">Create your first class to get started</p>
                </CardContent>
              </Card>
            ) : (
              classes.map((cls) => (
                <Card
                  key={cls.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedClass?.id === cls.id
                      ? "ring-2 ring-red-500 border-red-300 dark:border-red-700"
                      : "border-neutral-200 dark:border-neutral-800"
                  }`}
                  onClick={() => handleSelectClass(cls)}
                  data-testid={`card-class-${cls.id}`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white" data-testid={`text-class-name-${cls.id}`}>
                        {cls.name}
                      </h3>
                      {selectedClass?.id === cls.id && (
                        <p className="text-sm text-neutral-500">
                          {students.length} student{students.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteClassTarget(cls);
                      }}
                      data-testid={`button-delete-class-${cls.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedClass ? (
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Students in {selectedClass.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    {students.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const csvRows = ["Username"];
                          students.forEach(s => csvRows.push(s.username));
                          const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = (selectedClass?.name || "class").replace(/[^a-zA-Z0-9]/g, "_") + "_usernames.csv";
                          document.body.appendChild(a);
                          a.click();
                          setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" /> Download Usernames
                      </Button>
                    )}
                    <Button
                      onClick={() => { setIsAddStudentOpen(true); setStudentCount(1); }}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-add-student"
                    >
                      <UsersRound className="mr-2 h-4 w-4" /> Add Students
                    </Button>
                  </div>
                </div>

                {students.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center text-neutral-500">
                      <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No students in this class</p>
                      <p className="text-sm">Add students to get started</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {students.map((student) => (
                      <Card key={student.id} className="border-neutral-200 dark:border-neutral-800" data-testid={`card-student-${student.id}`}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                              {student.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-white" data-testid={`text-student-username-${student.id}`}>
                                {student.username}
                              </p>
                              {student.mustChangePassword && (
                                <span className="text-xs text-amber-600 dark:text-amber-400">
                                  Must change password
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRenameTarget(student);
                                setRenameValue(student.username);
                              }}
                              data-testid={`button-rename-student-${student.id}`}
                            >
                              <Pencil className="h-4 w-4 mr-1" /> Rename
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetPassword(student)}
                              data-testid={`button-reset-password-${student.id}`}
                            >
                              <KeyRound className="h-4 w-4 mr-1" /> Reset Password
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => setDeleteStudentTarget(student)}
                              data-testid={`button-delete-student-${student.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Card className="border-dashed h-full min-h-[200px] flex items-center justify-center">
                <CardContent className="text-center text-neutral-500 p-8">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium">Select a class</p>
                  <p className="text-sm">Choose a class from the left to manage its students</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Dialog open={isCreateClassOpen} onOpenChange={setIsCreateClassOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>Enter a name for the new class.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Class Name</Label>
              <Input
                placeholder="e.g. S4 Computing Science"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateClass()}
                data-testid="input-class-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateClassOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateClass} disabled={!newClassName.trim()} data-testid="button-confirm-create-class">
              Create Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Students</DialogTitle>
            <DialogDescription>
              Choose how many students to add. Each will get a friendly username and password. You can rename students afterwards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Number of students</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={studentCount}
                onChange={(e) => setStudentCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                onKeyDown={(e) => e.key === "Enter" && handleAddStudents()}
                data-testid="input-student-count"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStudentOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStudents} data-testid="button-confirm-add-student">
              Add {studentCount} Student{studentCount !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!credentialModal} onOpenChange={() => setCredentialModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{credentialModal?.title}</DialogTitle>
            <DialogDescription>
              Save these credentials now — passwords cannot be retrieved again.
            </DialogDescription>
          </DialogHeader>
          {credentialModal && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswords(!showPasswords)}
                  data-testid="button-toggle-password"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showPasswords ? "Hide" : "Show"} Passwords
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadCsv(credentialModal.credentials)}
                    data-testid="button-download-csv"
                  >
                    <Download className="h-4 w-4 mr-1" /> Download CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const text = credentialModal.credentials
                        .map(c => `${c.username}\t${c.password}`)
                        .join("\n");
                      copyToClipboard(text, "All credentials");
                    }}
                    data-testid="button-copy-all"
                  >
                    <Copy className="h-4 w-4 mr-1" /> Copy All
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {credentialModal.credentials.map((cred, i) => (
                  <div key={i} className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-white truncate" data-testid={`text-credential-username-${i}`}>
                        {cred.username}
                      </p>
                      <p className="font-mono text-sm text-neutral-600 dark:text-neutral-400" data-testid={`text-credential-password-${i}`}>
                        {showPasswords ? cred.password : "••••••••"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`${cred.username}\t${cred.password}`, "Credentials")}
                      data-testid={`button-copy-credential-${i}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                This is the only time passwords will be shown. Please note them down.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCredentialModal(null)} data-testid="button-close-credentials">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteClassTarget} onOpenChange={() => setDeleteClassTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteClassTarget?.name}" and all students in it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete-class">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteStudentTarget} onOpenChange={() => setDeleteStudentTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deleteStudentTarget?.username}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete-student">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!renameTarget} onOpenChange={(open) => { if (!open) setRenameTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Student</DialogTitle>
            <DialogDescription>
              Change the username for this student. They will need to use the new username to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Username</Label>
              <p className="text-sm font-mono text-neutral-500">{renameTarget?.username}</p>
            </div>
            <div className="space-y-2">
              <Label>New Username</Label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameStudent()}
                placeholder="e.g. john-smith"
                data-testid="input-rename-username"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancel</Button>
            <Button onClick={handleRenameStudent} disabled={!renameValue.trim() || renameValue.trim() === renameTarget?.username} data-testid="button-confirm-rename">
              Save Username
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
