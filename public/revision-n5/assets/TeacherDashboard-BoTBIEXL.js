import { u as useLocation, e as useQuestions, a as useToast, r as reactExports, j as jsxRuntimeExports } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { C as Card, d as CardContent } from "./card-D7eXR4Y_.js";
import { I as Input } from "./input-BglVfhce.js";
import { D as Dialog, f as DialogTrigger, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-DTiCktmM.js";
import { L as Label } from "./label-DXOWQ5Is.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { K as Key } from "./key-DEEIcqry.js";
import { M as Mail } from "./mail-MO6xjxiB.js";
import { L as LogOut } from "./log-out-Dulq3xVb.js";
import "./index-CxDJjHs5.js";
import "./index-C94DArSW.js";
import "./Combination-DqZOzdwe.js";
function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const { questions } = useQuestions();
  const { toast } = useToast();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = reactExports.useState(false);
  const [oldPassword, setOldPassword] = reactExports.useState("");
  const [newPassword, setNewPassword] = reactExports.useState("");
  const [confirmPassword, setConfirmPassword] = reactExports.useState("");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = reactExports.useState(false);
  const [email, setEmail] = reactExports.useState("");
  const [isLoadingEmail, setIsLoadingEmail] = reactExports.useState(false);
  reactExports.useEffect(() => {
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
      toast({ variant: "destructive", title: "Error", description: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "New passwords do not match." });
      return;
    }
    const token = localStorage.getItem("teacherToken");
    try {
      const response = await fetch("/api/teacher/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Success", description: "Password changed successfully." });
        setIsPasswordDialogOpen(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({ variant: "destructive", title: "Error", description: data.message || "Failed to change password." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Unable to connect to server." });
    }
  };
  const loadEmail = async () => {
    const token = localStorage.getItem("teacherToken");
    if (!token) return;
    try {
      const response = await fetch("/api/teacher/email", { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok) setEmail(data.email || "");
    } catch (error) {
      console.error("Failed to load email:", error);
    }
  };
  const handleSaveEmail = async () => {
    const token = localStorage.getItem("teacherToken");
    if (!token) return;
    setIsLoadingEmail(true);
    try {
      const response = await fetch("/api/teacher/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Success", description: "Email updated successfully." });
        setIsEmailDialogOpen(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: data.message || "Failed to update email." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Unable to connect to server." });
    } finally {
      setIsLoadingEmail(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-[200]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto max-w-6xl flex justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-neutral-900 dark:text-white", children: "Teacher Dashboard" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full", children: [
          questions.length,
          " Questions"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setLocation("/teacher/quizzes"), "data-testid": "link-quiz-manager", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "mr-2 h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" }) }),
          "Quizzes"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setLocation("/teacher/classes"), "data-testid": "link-class-manager", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "mr-2 h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }) }),
          "Classes"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setLocation("/"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
          " Student View"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isPasswordDialogOpen, onOpenChange: setIsPasswordDialogOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "text-neutral-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { className: "mr-2 h-4 w-4" }),
            " Password"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Change Password" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Enter your current password and choose a new one." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Current Password" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", value: oldPassword, onChange: (e) => setOldPassword(e.target.value) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "New Password" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Confirm New Password" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setIsPasswordDialogOpen(false), children: "Cancel" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleChangePassword, children: "Change Password" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isEmailDialogOpen, onOpenChange: (open) => {
          setIsEmailDialogOpen(open);
          if (open) loadEmail();
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "text-neutral-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "mr-2 h-4 w-4" }),
            " Email"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Email Settings" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Set your email address to enable password reset functionality." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Email Address" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "email",
                    placeholder: "your.email@example.com",
                    value: email,
                    onChange: (e) => setEmail(e.target.value)
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500", children: "This email will be used to send password reset links if you forget your password." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setIsEmailDialogOpen(false), children: "Cancel" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSaveEmail, disabled: isLoadingEmail, children: isLoadingEmail ? "Saving..." : "Save Email" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: handleLogout, className: "text-red-600 hover:bg-red-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "mr-2 h-4 w-4" }),
          " Logout"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "container mx-auto max-w-6xl p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "cursor-pointer hover:shadow-md transition-shadow border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20", onClick: () => setLocation("/teacher/classes"), "data-testid": "link-class-manager-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-6 h-6 text-teal-600 dark:text-teal-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-neutral-900 dark:text-white", children: "Class Manager" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500", children: "Manage classes and student accounts" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "cursor-pointer hover:shadow-md transition-shadow border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20", onClick: () => setLocation("/teacher/quizzes"), "data-testid": "link-quiz-manager-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-6 h-6 text-purple-600 dark:text-purple-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-neutral-900 dark:text-white", children: "Quiz Manager" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-neutral-500", children: [
            questions.length,
            " questions across all papers"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "cursor-pointer hover:shadow-md transition-shadow border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20", onClick: () => setLocation("/teacher/assignments"), "data-testid": "link-assignment-manager-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-6 h-6 text-orange-600 dark:text-orange-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-neutral-900 dark:text-white", children: "Assignment Manager" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500", children: "Create and manage coursework assignments" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "cursor-pointer hover:shadow-md transition-shadow border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20", onClick: () => setLocation("/teacher/past-papers"), "data-testid": "link-past-paper-manager", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-6 h-6 text-red-600 dark:text-red-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-neutral-900 dark:text-white", children: "Past Papers" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-neutral-500", children: [
            questions.length,
            " questions across all years"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "cursor-pointer hover:shadow-md transition-shadow border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20", onClick: () => setLocation("/teacher/analytics"), "data-testid": "link-analytics-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-6 h-6 text-amber-600 dark:text-amber-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-neutral-900 dark:text-white", children: "Analytics" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500", children: "View class performance and exam results" })
        ] })
      ] }) })
    ] }) })
  ] });
}
export {
  TeacherDashboard as default
};
//# sourceMappingURL=TeacherDashboard-BoTBIEXL.js.map
