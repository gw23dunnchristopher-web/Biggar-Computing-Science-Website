import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [invalidMessage, setInvalidMessage] = useState("");
  const [resetComplete, setResetComplete] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const params = useParams();

  const token = params.token;

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        setIsValid(false);
        setInvalidMessage("No reset token provided");
        return;
      }

      try {
        const response = await fetch(`/api/teacher/verify-reset-token?token=${token}`);
        const data = await response.json();
        
        setIsValid(data.valid);
        if (!data.valid) {
          setInvalidMessage(data.message || "Invalid or expired reset link");
        }
      } catch (error) {
        setIsValid(false);
        setInvalidMessage("Unable to verify reset link");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 8 characters.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/teacher/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetComplete(true);
      } else {
        toast({
          variant: "destructive",
          title: "Reset Failed",
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
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <p className="text-neutral-600 dark:text-neutral-400">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                <XCircle className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-bold">Invalid Link</CardTitle>
            <CardDescription className="text-center">
              {invalidMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
              Password reset links expire after 1 hour and can only be used once.
            </p>
            <Button 
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => setLocation("/forgot-password")}
              data-testid="button-request-new-link"
            >
              Request New Reset Link
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setLocation("/teacher/login")}
              data-testid="button-back-to-login"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resetComplete) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-bold">Password Reset</CardTitle>
            <CardDescription className="text-center">
              Your password has been successfully reset.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => setLocation("/teacher/login")}
              data-testid="button-login-now"
            >
              Sign In Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
      <div className="absolute top-6 left-6">
        <Button variant="ghost" onClick={() => setLocation("/teacher/login")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold">Set New Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white dark:bg-neutral-900 pl-10"
                  disabled={isLoading}
                  data-testid="input-new-password"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white dark:bg-neutral-900 pl-10"
                  disabled={isLoading}
                  data-testid="input-confirm-password"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Password must be at least 8 characters
            </p>
            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700" 
              disabled={isLoading}
              data-testid="button-reset-password"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
