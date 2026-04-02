import { useState } from "react";
import { useLocation } from "wouter";
import { useStudentAuth } from "@/components/StudentAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowLeft, KeyRound } from "lucide-react";

export default function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [, setLocation] = useLocation();
  const { login, changePassword } = useStudentAuth();

  const handleLogin = async (e: React.FormEvent) => {
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

  const handleChangePassword = async (e: React.FormEvent) => {
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
      <div className="absolute top-6 left-6">
        <Button variant="ghost" onClick={() => setLocation("/")} data-testid="link-back-home">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
              {showChangePassword ? <KeyRound className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold" data-testid="text-login-title">
            {showChangePassword ? "Change Password" : "Student Login"}
          </CardTitle>
          <CardDescription className="text-center">
            {showChangePassword
              ? "You must set a new password before continuing"
              : "Enter your credentials to log in"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showChangePassword ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white dark:bg-neutral-900"
                  disabled={isLoading}
                  required
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white dark:bg-neutral-900"
                  disabled={isLoading}
                  required
                  data-testid="input-password"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400" data-testid="text-login-error">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white dark:bg-neutral-900"
                  disabled={isChanging}
                  required
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white dark:bg-neutral-900"
                  disabled={isChanging}
                  required
                  data-testid="input-confirm-password"
                />
              </div>
              {changeError && (
                <p className="text-sm text-red-600 dark:text-red-400" data-testid="text-change-error">
                  {changeError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isChanging}
                data-testid="button-change-password"
              >
                {isChanging ? "Changing..." : "Set New Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
