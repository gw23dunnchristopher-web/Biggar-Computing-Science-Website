import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface StudentAuthState {
  studentId: string | null;
  username: string | null;
  isLoggedIn: boolean;
  mustChangePassword: boolean;
  isLoading: boolean;
}

interface StudentAuthContextType extends StudentAuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; mustChangePassword?: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const StudentAuthContext = createContext<StudentAuthContextType | null>(null);

export function StudentAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudentAuthState>({
    studentId: null,
    username: null,
    isLoggedIn: false,
    mustChangePassword: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("studentToken");
    const expires = localStorage.getItem("studentTokenExpires");

    if (!token || !expires || Date.now() > parseInt(expires)) {
      localStorage.removeItem("studentToken");
      localStorage.removeItem("studentTokenExpires");
      setState(s => ({ ...s, isLoading: false }));
      return;
    }

    fetch("/api/student/verify", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then(data => {
        setState({
          studentId: data.studentId,
          username: data.username,
          isLoggedIn: true,
          mustChangePassword: !!data.mustChangePassword,
          isLoading: false,
        });
      })
      .catch(() => {
        localStorage.removeItem("studentToken");
        localStorage.removeItem("studentTokenExpires");
        setState(s => ({ ...s, isLoading: false }));
      });
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

      localStorage.setItem("studentToken", data.token);
      localStorage.setItem("studentTokenExpires", data.expiresAt.toString());

      setState({
        studentId: data.studentId,
        username: data.username,
        isLoggedIn: true,
        mustChangePassword: !!data.mustChangePassword,
        isLoading: false,
      });

      return { success: true, mustChangePassword: !!data.mustChangePassword };
    } catch {
      return { success: false, error: "Unable to connect to server" };
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem("studentToken");
    try {
      await fetch("/api/student/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {}
    localStorage.removeItem("studentToken");
    localStorage.removeItem("studentTokenExpires");
    setState({
      studentId: null,
      username: null,
      isLoggedIn: false,
      mustChangePassword: false,
      isLoading: false,
    });
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    const token = localStorage.getItem("studentToken");
    if (!token) return { success: false, error: "Not authenticated" };

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

      setState(s => ({ ...s, mustChangePassword: false }));
      return { success: true };
    } catch {
      return { success: false, error: "Unable to connect to server" };
    }
  }, []);

  return (
    <StudentAuthContext.Provider value={{ ...state, login, logout, changePassword }}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const ctx = useContext(StudentAuthContext);
  if (!ctx) throw new Error("useStudentAuth must be used within StudentAuthProvider");
  return ctx;
}
