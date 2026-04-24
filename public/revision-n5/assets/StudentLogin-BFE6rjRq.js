import { r as reactExports, u as useLocation, b as useStudentAuth, j as jsxRuntimeExports } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { I as Input } from "./input-BglVfhce.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-D7eXR4Y_.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { K as KeyRound } from "./key-round-lYYF8l_Q.js";
import { L as Lock } from "./lock-CyeBs8h_.js";
function StudentLogin() {
  const [username, setUsername] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const [showChangePassword, setShowChangePassword] = reactExports.useState(false);
  const [newPassword, setNewPassword] = reactExports.useState("");
  const [confirmPassword, setConfirmPassword] = reactExports.useState("");
  const [changeError, setChangeError] = reactExports.useState("");
  const [isChanging, setIsChanging] = reactExports.useState(false);
  const [, setLocation] = useLocation();
  const { login, changePassword } = useStudentAuth();
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error || "Login failed");
      setIsLoading(false);
      return;
    }
    if (result.mustChangePassword) {
      setShowChangePassword(true);
      setIsLoading(false);
      return;
    }
    setLocation("/");
  };
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangeError("");
    if (newPassword.length < 4) {
      setChangeError("Password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError("Passwords do not match");
      return;
    }
    setIsChanging(true);
    const result = await changePassword(newPassword);
    if (!result.success) {
      setChangeError(result.error || "Failed to change password");
      setIsChanging(false);
      return;
    }
    setLocation("/");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-6 left-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", onClick: () => setLocation("/"), "data-testid": "link-back-home", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
      " Back to Home"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400", children: showChangePassword ? /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "w-8 h-8" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-8 h-8" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-2xl text-center font-bold", "data-testid": "text-login-title", children: showChangePassword ? "Change Password" : "Student Login" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-center", children: showChangePassword ? "You must set a new password before continuing" : "Enter your credentials to log in" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: !showChangePassword ? /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "text",
            placeholder: "Username",
            value: username,
            onChange: (e) => setUsername(e.target.value),
            className: "bg-white dark:bg-neutral-900",
            disabled: isLoading,
            required: true,
            "data-testid": "input-username"
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
            required: true,
            "data-testid": "input-password"
          }
        ) }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600 dark:text-red-400", "data-testid": "text-login-error", children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "submit",
            className: "w-full bg-blue-600 hover:bg-blue-700",
            disabled: isLoading,
            "data-testid": "button-login",
            children: isLoading ? "Signing in..." : "Sign In"
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleChangePassword, className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "password",
            placeholder: "New password",
            value: newPassword,
            onChange: (e) => setNewPassword(e.target.value),
            className: "bg-white dark:bg-neutral-900",
            disabled: isChanging,
            required: true,
            "data-testid": "input-new-password"
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
            disabled: isChanging,
            required: true,
            "data-testid": "input-confirm-password"
          }
        ) }),
        changeError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600 dark:text-red-400", "data-testid": "text-change-error", children: changeError }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "submit",
            className: "w-full bg-blue-600 hover:bg-blue-700",
            disabled: isChanging,
            "data-testid": "button-change-password",
            children: isChanging ? "Changing..." : "Set New Password"
          }
        )
      ] }) })
    ] })
  ] });
}
export {
  StudentLogin as default
};
//# sourceMappingURL=StudentLogin-BFE6rjRq.js.map
