/**
 * Tiny fetch wrapper that adds the appropriate auth headers based on what is
 * currently in localStorage. Endpoints that need teacher rights look at
 * `teacher_token` / `teacherToken`; student endpoints use the same Bearer
 * token (`studentToken`) shared with the Higher and N5 revision apps.
 */

export type Role = 'student' | 'teacher' | 'guest';

function readTeacherToken(): string | null {
  return (
    localStorage.getItem('teacher_token') ||
    localStorage.getItem('teacherToken') ||
    null
  );
}

function readStudentToken(): string | null {
  const t = localStorage.getItem('studentToken');
  if (!t) return null;
  const exp = parseInt(localStorage.getItem('studentTokenExpires') || '0', 10);
  if (exp && Date.now() > exp) return null;
  return t;
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = readTeacherToken();
  if (t) headers['x-teacher-password'] = t;
  const s = readStudentToken();
  if (s) headers['Authorization'] = `Bearer ${s}`;
  if (extra) Object.assign(headers, extra as Record<string, string>);
  return headers;
}

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: buildHeaders(init?.headers),
  });
  if (!res.ok) {
    if (res.status === 401) {
      // Session has expired server-side — clear stale tokens and bounce to login.
      logoutTeacher();
      logoutStudent();
      window.dispatchEvent(new CustomEvent('classwork:session-expired'));
    }
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch { /* non-JSON body */ }
    throw new Error(message);
  }
  if (res.status === 204) return null as any;
  return res.json();
}

export function getCurrentRole(): Role {
  if (readTeacherToken()) return 'teacher';
  if (readStudentToken()) return 'student';
  return 'guest';
}

export function getStudentUsername(): string | null {
  try {
    const cache = localStorage.getItem('siteAuthUserCache');
    if (!cache) return null;
    const u = JSON.parse(cache);
    return u?.username || null;
  } catch { return null; }
}

export function logoutTeacher() {
  localStorage.removeItem('teacher_token');
  localStorage.removeItem('teacher_token_expires');
  localStorage.removeItem('teacherToken');
  localStorage.removeItem('teacherTokenExpires');
}

export function logoutStudent() {
  localStorage.removeItem('studentToken');
  localStorage.removeItem('studentTokenExpires');
  localStorage.removeItem('siteAuthUserCache');
}
