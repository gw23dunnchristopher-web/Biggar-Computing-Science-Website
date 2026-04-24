import { c as createLucideIcon, u as useLocation, a as useToast, r as reactExports, j as jsxRuntimeExports, E as Eye } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { C as Card, d as CardContent } from "./card-D7eXR4Y_.js";
import { I as Input } from "./input-BglVfhce.js";
import { L as Label } from "./label-DXOWQ5Is.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-DTiCktmM.js";
import { A as AlertDialog, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-Dav9MFAg.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { P as Plus } from "./plus-Bl_GJopp.js";
import { U as Users } from "./users-DcejMkzk.js";
import { T as Trash2 } from "./trash-2-bLg5w6uM.js";
import { D as Download } from "./download-DGRZihqj.js";
import { P as Pencil } from "./pencil-BpyvL5SV.js";
import { K as KeyRound } from "./key-round-lYYF8l_Q.js";
import { E as EyeOff } from "./eye-off-Ju-xnFEe.js";
import "./index-CxDJjHs5.js";
import "./index-C94DArSW.js";
import "./Combination-DqZOzdwe.js";
const __iconNode$2 = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
];
const Copy = createLucideIcon("copy", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["line", { x1: "19", x2: "19", y1: "8", y2: "14", key: "1bvyxn" }],
  ["line", { x1: "22", x2: "16", y1: "11", y2: "11", key: "1shjgl" }]
];
const UserPlus = createLucideIcon("user-plus", __iconNode$1);
const __iconNode = [
  ["path", { d: "M18 21a8 8 0 0 0-16 0", key: "3ypg7q" }],
  ["circle", { cx: "10", cy: "8", r: "5", key: "o932ke" }],
  ["path", { d: "M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3", key: "10s06x" }]
];
const UsersRound = createLucideIcon("users-round", __iconNode);
function getAuthHeaders() {
  const token = localStorage.getItem("teacherToken") || localStorage.getItem("teacher_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}
function ClassManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [classes, setClasses] = reactExports.useState([]);
  const [selectedClass, setSelectedClass] = reactExports.useState(null);
  const [students, setStudents] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [isCreateClassOpen, setIsCreateClassOpen] = reactExports.useState(false);
  const [newClassName, setNewClassName] = reactExports.useState("");
  const [isAddStudentOpen, setIsAddStudentOpen] = reactExports.useState(false);
  const [studentCount, setStudentCount] = reactExports.useState(1);
  const [credentialModal, setCredentialModal] = reactExports.useState(null);
  const [showPasswords, setShowPasswords] = reactExports.useState(false);
  const [deleteClassTarget, setDeleteClassTarget] = reactExports.useState(null);
  const [deleteStudentTarget, setDeleteStudentTarget] = reactExports.useState(null);
  const [renameTarget, setRenameTarget] = reactExports.useState(null);
  const [renameValue, setRenameValue] = reactExports.useState("");
  reactExports.useEffect(() => {
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
  const fetchStudents = reactExports.useCallback(async (classId) => {
    try {
      const res = await fetch(`/api/teacher/classes/${classId}/students`, { headers: getAuthHeaders() });
      if (res.ok) {
        setStudents(await res.json());
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load students" });
    }
  }, [toast]);
  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    fetchStudents(cls.id);
  };
  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    try {
      const res = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newClassName.trim() })
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
        headers: getAuthHeaders()
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
      let result = [];
      if (count === 1) {
        const res = await fetch(`/api/teacher/classes/${selectedClass.id}/students`, {
          method: "POST",
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          result = [{ username: data.username, password: data.plainPassword }];
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
          body: JSON.stringify({ count })
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
        title: result.length === 1 ? "New Student Created" : `${result.length} Students Created`
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
        headers: getAuthHeaders()
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
  const handleResetPassword = async (student) => {
    try {
      const res = await fetch(`/api/teacher/students/${student.id}/reset-password`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setCredentialModal({
          credentials: [{ username: student.username, password: data.plainPassword }],
          title: "Password Reset"
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
        body: JSON.stringify({ username: renameValue.trim() })
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
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };
  const handleDownloadCsv = (credentials) => {
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
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-[200]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto max-w-6xl flex justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setLocation("/teacher/dashboard"), "data-testid": "button-back-dashboard", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
          " Dashboard"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-neutral-900 dark:text-white", children: "Class Manager" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setIsCreateClassOpen(true), className: "bg-red-600 hover:bg-red-700", "data-testid": "button-create-class", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
        " New Class"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "container mx-auto max-w-6xl p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-1 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-neutral-900 dark:text-white mb-2", children: "Classes" }),
        classes.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 text-center text-neutral-500", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-8 w-8 mx-auto mb-2 opacity-50" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No classes yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "Create your first class to get started" })
        ] }) }) : classes.map((cls) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          Card,
          {
            className: `cursor-pointer transition-all hover:shadow-md ${selectedClass?.id === cls.id ? "ring-2 ring-red-500 border-red-300 dark:border-red-700" : "border-neutral-200 dark:border-neutral-800"}`,
            onClick: () => handleSelectClass(cls),
            "data-testid": `card-class-${cls.id}`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-neutral-900 dark:text-white", "data-testid": `text-class-name-${cls.id}`, children: cls.name }),
                selectedClass?.id === cls.id && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-neutral-500", children: [
                  students.length,
                  " student",
                  students.length !== 1 ? "s" : ""
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  className: "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30",
                  onClick: (e) => {
                    e.stopPropagation();
                    setDeleteClassTarget(cls);
                  },
                  "data-testid": `button-delete-class-${cls.id}`,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
                }
              )
            ] })
          },
          cls.id
        ))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-2", children: selectedClass ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4 flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-semibold text-neutral-900 dark:text-white", children: [
            "Students in ",
            selectedClass.name
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            students.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  const csvRows = ["Username"];
                  students.forEach((s) => csvRows.push(s.username));
                  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = (selectedClass?.name || "class").replace(/[^a-zA-Z0-9]/g, "_") + "_usernames.csv";
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }, 100);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "mr-2 h-4 w-4" }),
                  " Download Usernames"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: () => {
                  setIsAddStudentOpen(true);
                  setStudentCount(1);
                },
                size: "sm",
                className: "bg-green-600 hover:bg-green-700",
                "data-testid": "button-add-student",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(UsersRound, { className: "mr-2 h-4 w-4" }),
                  " Add Students"
                ]
              }
            )
          ] })
        ] }),
        students.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-8 text-center text-neutral-500", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "h-8 w-8 mx-auto mb-2 opacity-50" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No students in this class" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "Add students to get started" })
        ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: students.map((student) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-neutral-200 dark:border-neutral-800", "data-testid": `card-student-${student.id}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-semibold text-neutral-600 dark:text-neutral-300", children: student.username.charAt(0).toUpperCase() }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-neutral-900 dark:text-white", "data-testid": `text-student-username-${student.id}`, children: student.username }),
              student.mustChangePassword && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-amber-600 dark:text-amber-400", children: "Must change password" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  setRenameTarget(student);
                  setRenameValue(student.username);
                },
                "data-testid": `button-rename-student-${student.id}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4 mr-1" }),
                  " Rename"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => handleResetPassword(student),
                "data-testid": `button-reset-password-${student.id}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-4 w-4 mr-1" }),
                  " Reset Password"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                className: "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30",
                onClick: () => setDeleteStudentTarget(student),
                "data-testid": `button-delete-student-${student.id}`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
              }
            )
          ] })
        ] }) }, student.id)) })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-dashed h-full min-h-[200px] flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "text-center text-neutral-500 p-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-10 w-10 mx-auto mb-3 opacity-40" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-medium", children: "Select a class" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "Choose a class from the left to manage its students" })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isCreateClassOpen, onOpenChange: setIsCreateClassOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create New Class" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Enter a name for the new class." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Class Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: "e.g. S4 Computing Science",
            value: newClassName,
            onChange: (e) => setNewClassName(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && handleCreateClass(),
            "data-testid": "input-class-name"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setIsCreateClassOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCreateClass, disabled: !newClassName.trim(), "data-testid": "button-confirm-create-class", children: "Create Class" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isAddStudentOpen, onOpenChange: setIsAddStudentOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Add Students" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Choose how many students to add. Each will get a friendly username and password. You can rename students afterwards." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Number of students" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            min: 1,
            max: 50,
            value: studentCount,
            onChange: (e) => setStudentCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1))),
            onKeyDown: (e) => e.key === "Enter" && handleAddStudents(),
            "data-testid": "input-student-count"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setIsAddStudentOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleAddStudents, "data-testid": "button-confirm-add-student", children: [
          "Add ",
          studentCount,
          " Student",
          studentCount !== 1 ? "s" : ""
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!credentialModal, onOpenChange: () => setCredentialModal(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-lg max-h-[80vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: credentialModal?.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Save these credentials now — passwords cannot be retrieved again." })
      ] }),
      credentialModal && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => setShowPasswords(!showPasswords),
              "data-testid": "button-toggle-password",
              children: [
                showPasswords ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4 mr-1" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4 mr-1" }),
                showPasswords ? "Hide" : "Show",
                " Passwords"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => handleDownloadCsv(credentialModal.credentials),
                "data-testid": "button-download-csv",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 mr-1" }),
                  " Download CSV"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  const text = credentialModal.credentials.map((c) => `${c.username}	${c.password}`).join("\n");
                  copyToClipboard(text, "All credentials");
                },
                "data-testid": "button-copy-all",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4 mr-1" }),
                  " Copy All"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: credentialModal.credentials.map((cred, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-sm font-semibold text-neutral-900 dark:text-white truncate", "data-testid": `text-credential-username-${i}`, children: cred.username }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-sm text-neutral-600 dark:text-neutral-400", "data-testid": `text-credential-password-${i}`, children: showPasswords ? cred.password : "••••••••" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => copyToClipboard(`${cred.username}	${cred.password}`, "Credentials"),
              "data-testid": `button-copy-credential-${i}`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4" })
            }
          )
        ] }, i)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-amber-600 dark:text-amber-400 font-medium", children: "This is the only time passwords will be shown. Please note them down." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setCredentialModal(null), "data-testid": "button-close-credentials", children: "Done" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: !!deleteClassTarget, onOpenChange: () => setDeleteClassTarget(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Delete Class?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
          'This will permanently delete "',
          deleteClassTarget?.name,
          '" and all students in it. This action cannot be undone.'
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: handleDeleteClass, className: "bg-red-600 hover:bg-red-700", "data-testid": "button-confirm-delete-class", children: "Delete" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: !!deleteStudentTarget, onOpenChange: () => setDeleteStudentTarget(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Remove Student?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
          'Are you sure you want to remove "',
          deleteStudentTarget?.username,
          '"? This action cannot be undone.'
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: handleDeleteStudent, className: "bg-red-600 hover:bg-red-700", "data-testid": "button-confirm-delete-student", children: "Remove" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!renameTarget, onOpenChange: (open) => {
      if (!open) setRenameTarget(null);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Rename Student" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Change the username for this student. They will need to use the new username to log in." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Current Username" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-mono text-neutral-500", children: renameTarget?.username })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "New Username" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: renameValue,
              onChange: (e) => setRenameValue(e.target.value),
              onKeyDown: (e) => e.key === "Enter" && handleRenameStudent(),
              placeholder: "e.g. john-smith",
              "data-testid": "input-rename-username"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setRenameTarget(null), children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleRenameStudent, disabled: !renameValue.trim() || renameValue.trim() === renameTarget?.username, "data-testid": "button-confirm-rename", children: "Save Username" })
      ] })
    ] }) })
  ] });
}
export {
  ClassManager as default
};
//# sourceMappingURL=ClassManager-3Sk8aZRu.js.map
