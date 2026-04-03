
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TeacherLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if already logged in and redirect to dashboard
  useEffect(() => {
    // Accept both N5 and Higher key-pairs — same session table
    const token = localStorage.getItem("teacherToken")
      || localStorage.getItem("teacher_token");
    const expiresAt = localStorage.getItem("teacherTokenExpires")
      || localStorage.getItem("teacher_token_expires");
    
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store under both key-pairs so Higher app also recognises the session
        localStorage.setItem("teacherToken", data.token);
        localStorage.setItem("teacherTokenExpires", data.expiresAt.toString());
        localStorage.setItem("teacher_token", data.token);
        localStorage.setItem("teacher_token_expires", data.expiresAt.toString());
        toast({
          title: "Login Successful",
          description: "Welcome to the Teacher Dashboard",
        });
        setLocation("/teacher/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: data.message || "Incorrect password. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to connect to server. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    try {
      const response = await fetch("/api/teacher/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Password Reset Email Sent",
          description: "Check your email for your new password.",
        });
        setShowResetDialog(false);
        setResetEmail("");
      } else {
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description: data.message || "Unable to reset password. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to connect to server. Please try again.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
      <div className="absolute top-6 left-6">
        <Button variant="ghost" onClick={() => setLocation("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold">Teacher Access</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the question editor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Username or Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white dark:bg-neutral-900"
                disabled={isLoading}
                required
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
              />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                onClick={() => setShowResetDialog(true)}
              >
                Forgot password?
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset}>
            <div className="space-y-4 py-4">
              <Input
                type="email"
                placeholder="Email address"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="bg-white dark:bg-neutral-900"
                disabled={isResetting}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowResetDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isResetting}>
                {isResetting ? "Sending..." : "Send Reset Email"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
