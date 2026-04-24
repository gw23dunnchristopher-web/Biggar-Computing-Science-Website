import { r as reactExports, u as useLocation, a as useToast, j as jsxRuntimeExports } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { I as Input } from "./input-BglVfhce.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-D7eXR4Y_.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-DTiCktmM.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { L as Lock } from "./lock-CyeBs8h_.js";
import { M as Mail } from "./mail-MO6xjxiB.js";
import "./index-CxDJjHs5.js";
import "./index-C94DArSW.js";
import "./Combination-DqZOzdwe.js";
function TeacherLogin() {
  const [username, setUsername] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const [showResetDialog, setShowResetDialog] = reactExports.useState(false);
  const [resetEmail, setResetEmail] = reactExports.useState("");
  const [isResetting, setIsResetting] = reactExports.useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  reactExports.useEffect(() => {
    const token = localStorage.getItem("teacherToken") || localStorage.getItem("teacher_token");
    const expiresAt = localStorage.getItem("teacherTokenExpires") || localStorage.getItem("teacher_token_expires");
    if (token && expiresAt) {
      const now = Date.now();
      if (now < parseInt(expiresAt)) {
        setLocation("/teacher/dashboard");
      } else {
        localStorage.removeItem("teacherToken");
        localStorage.removeItem("teacherTokenExpires");
        localStorage.removeItem("teacher_token");
        localStorage.removeItem("teacher_token_expires");
      }
    }
  }, [setLocation]);
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("teacherToken", data.token);
        localStorage.setItem("teacherTokenExpires", data.expiresAt.toString());
        localStorage.setItem("teacher_token", data.token);
        localStorage.setItem("teacher_token_expires", data.expiresAt.toString());
        toast({
          title: "Login Successful",
          description: "Welcome to the Teacher Dashboard"
        });
        setLocation("/teacher/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: data.message || "Incorrect password. Please try again."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to connect to server. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setIsResetting(true);
    try {
      const response = await fetch("/api/teacher/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Password Reset Email Sent",
          description: "Check your email for your new password."
        });
        setShowResetDialog(false);
        setResetEmail("");
      } else {
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description: data.message || "Unable to reset password. Please try again."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to connect to server. Please try again."
      });
    } finally {
      setIsResetting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-6 left-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", onClick: () => setLocation("/"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
      " Back to Home"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-8 h-8" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-2xl text-center font-bold", children: "Teacher Access" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-center", children: "Enter your credentials to access the question editor" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "text",
            placeholder: "Username or Email",
            value: username,
            onChange: (e) => setUsername(e.target.value),
            className: "bg-white dark:bg-neutral-900",
            disabled: isLoading,
            required: true
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "password",
            placeholder: "Password",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            className: "bg-white dark:bg-neutral-900",
            disabled: isLoading,
            required: true
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full bg-red-600 hover:bg-red-700", disabled: isLoading, children: isLoading ? "Signing in..." : "Sign In" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "link",
            className: "text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
            onClick: () => setShowResetDialog(true),
            children: "Forgot password?"
          }
        ) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showResetDialog, onOpenChange: setShowResetDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-5 w-5" }),
          "Reset Password"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Enter your email address and we'll send you a link to reset your password." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handlePasswordReset, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "email",
            placeholder: "Email address",
            value: resetEmail,
            onChange: (e) => setResetEmail(e.target.value),
            className: "bg-white dark:bg-neutral-900",
            disabled: isResetting,
            required: true
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setShowResetDialog(false), children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "bg-red-600 hover:bg-red-700", disabled: isResetting, children: isResetting ? "Sending..." : "Send Reset Email" })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  TeacherLogin as default
};
//# sourceMappingURL=TeacherLogin-1eepiwFt.js.map
