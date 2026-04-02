import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [, params] = useRoute("/teacher/reset-password/:token");
  const token = params?.token || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 8 characters.",
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

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/teacher/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsComplete(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to reset password.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to connect to server. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">Verifying reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800">
          <CardContent className="flex flex-col items-center py-12">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400 mb-4">
              <XCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold mb-2">Invalid Reset Link</h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-center mb-6">{errorMessage}</p>
            <Button onClick={() => setLocation("/teacher/login")} className="bg-red-600 hover:bg-red-700">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg border-neutral-200 dark:border-neutral-800">
          <CardContent className="flex flex-col items-center py-12">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400 mb-4">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold mb-2">Password Reset Complete</h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-center mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Button onClick={() => setLocation("/teacher/login")} className="bg-red-600 hover:bg-red-700">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
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
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white dark:bg-neutral-900"
                disabled={isSubmitting}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white dark:bg-neutral-900"
                disabled={isSubmitting}
                required
                minLength={8}
              />
            </div>
            <p className="text-sm text-neutral-500">Password must be at least 8 characters.</p>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
