import { d as useRoute, u as useLocation, a as useToast, r as reactExports, j as jsxRuntimeExports } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { I as Input } from "./input-BglVfhce.js";
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle, c as CardDescription } from "./card-D7eXR4Y_.js";
import { L as LoaderCircle } from "./loader-circle-BUW4OaHl.js";
import { C as CircleX } from "./circle-x-DWAGdAys.js";
import { C as CircleCheckBig } from "./circle-check-big-B9xfjmGM.js";
import { L as Lock } from "./lock-CyeBs8h_.js";
function ResetPassword() {
  const [, params] = useRoute("/teacher/reset-password/:token");
  const token = params?.token || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = reactExports.useState(true);
  const [isValid, setIsValid] = reactExports.useState(false);
  const [errorMessage, setErrorMessage] = reactExports.useState("");
  const [newPassword, setNewPassword] = reactExports.useState("");
  const [confirmPassword, setConfirmPassword] = reactExports.useState("");
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const [isComplete, setIsComplete] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/teacher/reset-password/${token}`);
        const data = await response.json();
        if (data.valid) {
          setIsValid(true);
        } else {
          setErrorMessage(data.message || "Invalid or expired reset link");
        }
      } catch (error) {
        setErrorMessage("Unable to verify reset link. Please try again.");
      } finally {
        setIsValidating(false);
      }
    };
    if (token) {
      validateToken();
    } else {
      setIsValidating(false);
      setErrorMessage("Invalid reset link");
    }
  }, [token]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 8 characters."
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match."
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teacher/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setIsComplete(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to reset password."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to connect to server. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isValidating) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col items-center py-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-12 h-12 text-red-600 animate-spin mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-600 dark:text-neutral-400", children: "Verifying reset link..." })
    ] }) }) });
  }
  if (!isValid) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col items-center py-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400 mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "w-12 h-12" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold mb-2", children: "Invalid Reset Link" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-600 dark:text-neutral-400 text-center mb-6", children: errorMessage }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setLocation("/teacher/login"), className: "bg-red-600 hover:bg-red-700", children: "Back to Login" })
    ] }) }) });
  }
  if (isComplete) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col items-center py-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400 mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-12 h-12" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold mb-2", children: "Password Reset Complete" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-600 dark:text-neutral-400 text-center mb-6", children: "Your password has been successfully reset. You can now log in with your new password." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setLocation("/teacher/login"), className: "bg-red-600 hover:bg-red-700", children: "Go to Login" })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-8 h-8" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-2xl text-center font-bold", children: "Set New Password" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-center", children: "Enter your new password below" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          type: "password",
          placeholder: "New password",
          value: newPassword,
          onChange: (e) => setNewPassword(e.target.value),
          className: "bg-white dark:bg-neutral-900",
          disabled: isSubmitting,
          required: true,
          minLength: 8
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          type: "password",
          placeholder: "Confirm new password",
          value: confirmPassword,
          onChange: (e) => setConfirmPassword(e.target.value),
          className: "bg-white dark:bg-neutral-900",
          disabled: isSubmitting,
          required: true,
          minLength: 8
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500", children: "Password must be at least 8 characters." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full bg-red-600 hover:bg-red-700", disabled: isSubmitting, children: isSubmitting ? "Resetting..." : "Reset Password" })
    ] }) })
  ] }) });
}
export {
  ResetPassword as default
};
//# sourceMappingURL=ResetPassword-CK_JK8Y6.js.map
