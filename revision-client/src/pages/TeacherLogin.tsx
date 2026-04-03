import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lock, ArrowLeft, User, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TeacherLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isRequestingReset, setIsRequestingReset] = useState(false);

  useEffect(() => {
    const checkExistingSession = async () => {
      // Check both token key-pairs (Higher and N5) — same session table
      const token = localStorage.getItem("teacher_token")
        || localStorage.getItem("teacherToken");
      const expires = localStorage.getItem("teacher_token_expires")
        || localStorage.getItem("teacherTokenExpires");
      
      if (token && expires && parseInt(expires) > Date.now()) {
        try {
          const response = await fetch("/api/teacher/verify", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            setLocation("/teacher/dashboard");
          }
        } catch (error) {
          console.error("Session check failed:", error);
        }
      }
    };
    checkExistingSession();
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
        // Store under both key-pairs so N5 app also recognises the session
        localStorage.setItem("teacher_token", data.token);
        localStorage.setItem("teacher_token_expires", data.expiresAt.toString());
        localStorage.setItem("teacherToken", data.token);
        localStorage.setItem("teacherTokenExpires", data.expiresAt.toString());
        toast({
          title: "Login Successful",
          description: "Welcome to the Teacher Dashboard",
        });
        setLocation("/teacher/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: data.message || "Invalid username/email or password.",
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

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your email address.",
      });
      return;
    }

    setIsRequestingReset(true);

    try {
      const response = await fetch("/api/teacher/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Reset Link Sent",
          description: "If an account exists with this email, you will receive a password reset link.",
        });
        setForgotDialogOpen(false);
        setResetEmail("");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to connect to server. Please try again.",
      });
    } finally {
      setIsRequestingReset(false);
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
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  type="text"
                  placeholder="Username or Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white dark:bg-neutral-900 pl-10"
                  disabled={isLoading}
                  data-testid="input-username"
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
                  data-testid="input-password"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700" 
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Dialog open={forgotDialogOpen} onOpenChange={setForgotDialogOpen}>
              <DialogTrigger asChild>
                <button 
                  type="button"
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
                  data-testid="button-forgot-password"
                >
                  Forgot your password?
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                    Enter your email address and we'll send you a link to reset your password.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10"
                      disabled={isRequestingReset}
                      data-testid="input-reset-email"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setForgotDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleForgotPassword} 
                    disabled={isRequestingReset}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isRequestingReset ? "Sending..." : "Send Reset Link"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
