import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface StudentAuth {
  token: string;
  studentId: number;
  username: string;
  className: string;
  mustChangePassword: boolean;
}

interface StudentAuthContextType {
  student: StudentAuth | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; mustChangePassword?: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  clearMustChangePassword: () => void;
}

const StudentAuthContext = createContext<StudentAuthContextType | null>(null);

function syncLocalExamResults(token: string) {
  try {
    const results: any[] = [];
    const lastResult = localStorage.getItem("last_exam_result");
    if (lastResult) {
      try { results.push(JSON.parse(lastResult)); } catch {}
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("exam_result_")) {
        try { results.push(JSON.parse(localStorage.getItem(key)!)); } catch {}
      }
    }
    if (results.length === 0) return;
    fetch("/api/student/sync-exam-results", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ results }),
    }).catch(() => {});
  } catch {}
}

export function StudentAuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<StudentAuth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("student_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetch("/api/student/verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.valid) {
          setStudent({
            token,
            studentId: data.studentId,
            username: data.username,
            className: data.className,
            mustChangePassword: data.mustChangePassword,
          });
          syncLocalExamResults(token);
        } else {
          localStorage.removeItem("student_token");
        }
      })
      .catch(() => {
        localStorage.removeItem("student_token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }
      localStorage.setItem("student_token", data.token);
      setStudent({
        token: data.token,
        studentId: data.studentId,
        username: data.username,
        className: data.className,
        mustChangePassword: data.mustChangePassword,
      });

      syncLocalExamResults(data.token);

      return { success: true, mustChangePassword: data.mustChangePassword };
    } catch {
      return { success: false, error: "Unable to connect to server" };
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem("student_token");
    if (token) {
      try {
        await fetch("/api/student/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    localStorage.removeItem("student_token");
    setStudent(null);
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    const token = localStorage.getItem("student_token");
    if (!token) return { success: false, error: "Not logged in" };
    try {
      const res = await fetch("/api/student/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to change password" };
      }
      setStudent((prev) => (prev ? { ...prev, mustChangePassword: false } : null));
      return { success: true };
    } catch {
      return { success: false, error: "Unable to connect to server" };
    }
  }, []);

  const clearMustChangePassword = useCallback(() => {
    setStudent((prev) => (prev ? { ...prev, mustChangePassword: false } : null));
  }, []);

  return (
    <StudentAuthContext.Provider value={{ student, isLoading, login, logout, changePassword, clearMustChangePassword }}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const ctx = useContext(StudentAuthContext);
  if (!ctx) throw new Error("useStudentAuth must be used within StudentAuthProvider");
  return ctx;
}
