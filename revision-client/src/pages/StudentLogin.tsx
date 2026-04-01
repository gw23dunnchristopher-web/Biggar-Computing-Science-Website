import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, GraduationCap, User, Lock, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStudentAuth } from "@/components/student-auth-context";

export default function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, changePassword, student } = useStudentAuth();

  if (student && !student.mustChangePassword) {
    setLocation("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(username, password);

    if (result.success) {
      if (result.mustChangePassword) {
        setShowChangePassword(true);
        toast({
          title: "Password Change Required",
          description: "Please set a new password before continuing.",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        setLocation("/");
      }
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: result.error || "Invalid username or password.",
      });
    }

    setIsLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 4) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 4 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match.",
      });
      return;
    }

    setIsChangingPassword(true);
    const result = await changePassword(newPassword);

    if (result.success) {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setLocation("/");
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to change password.",
      });
    }

    setIsChangingPassword(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
      <div className="absolute top-6 left-6">
        <Button variant="ghost" onClick={() => setLocation("/")} data-testid="button-back-home">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </div>

      {showChangePassword ? (
        <Card className="w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800" data-testid="card-change-password">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
                <KeyRound className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-bold" data-testid="text-change-password-title">
              Set New Password
            </CardTitle>
            <CardDescription className="text-center">
              You must change your password before continuing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white dark:bg-neutral-900 pl-10"
                    disabled={isChangingPassword}
                    data-testid="input-new-password"
                    required
                    minLength={4}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white dark:bg-neutral-900 pl-10"
                    disabled={isChangingPassword}
                    data-testid="input-confirm-password"
                    required
                    minLength={4}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={isChangingPassword}
                data-testid="button-change-password"
              >
                {isChangingPassword ? "Changing..." : "Set New Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800" data-testid="card-student-login">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                <GraduationCap className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-bold" data-testid="text-student-login-title">
              Student Login
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to track your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white dark:bg-neutral-900 pl-10"
                    disabled={isLoading}
                    data-testid="input-student-username"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white dark:bg-neutral-900 pl-10"
                    disabled={isLoading}
                    data-testid="input-student-password"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
                data-testid="button-student-login"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
