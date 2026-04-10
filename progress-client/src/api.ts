const BASE = "/api/progress";

function getToken(): string | null {
  return (
    localStorage.getItem("teacher_token") ||
    localStorage.getItem("teacherToken") ||
    null
  );
}

function headers() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: headers() });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
  return res.json();
}

export interface ClassSummary {
  id: string;
  name: string;
  course: string;
  teacherId: string | null;
  createdAt: string;
  studentCount: number;
}

export interface StudentSummary {
  id: string;
  username: string;
  course: string;
  resultCount: number;
  avgPercentage: number | null;
  lastCompleted: string | null;
  activeExam: string | null;
}

export interface ClassDetail {
  class: ClassSummary;
  students: StudentSummary[];
}

export interface ResultItem {
  id: string;
  title: string;
  score: number;
  maxMarks: number;
  percentage: number;
  completedAt: string | null;
  breakdown?: any;
}

export interface ActiveExam {
  title: string;
  answeredCount: number;
  totalQuestions: number;
  timeLeft: number;
}

export interface StudentDetail {
  student: { id: string; username: string; course: string; classId: string };
  class: ClassSummary;
  results: ResultItem[];
  activeExam: ActiveExam | null;
}

export const api = {
  isLoggedIn: () => !!getToken(),

  login: async (email: string, password: string) => {
    const res = await fetch("/api/teacher-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? "Login failed");
    if (data.token) {
      localStorage.setItem("teacher_token", data.token);
      if (data.expires) localStorage.setItem("teacher_token_expires", data.expires);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem("teacher_token");
    localStorage.removeItem("teacher_token_expires");
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacherTokenExpires");
  },

  getClasses: () => get<ClassSummary[]>(`${BASE}/classes`),
  getClass: (classId: string) => get<ClassDetail>(`${BASE}/class/${classId}`),
  getStudent: (studentId: string) => get<StudentDetail>(`${BASE}/student/${studentId}`),
};
