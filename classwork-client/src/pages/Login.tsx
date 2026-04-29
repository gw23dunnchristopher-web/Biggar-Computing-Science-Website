import { useState } from 'react';
import Shell from '@/components/Shell';

/**
 * Unified Classwork sign-in. One form, one Sign in button.
 * - If the entered identifier looks like an email, we try the teacher login
 *   first (the same `/api/teacher-auth` endpoint the Sandbox dashboard uses)
 *   and fall back to student login.
 * - Otherwise we try the student login (`/api/student/login`, same as the
 *   Revision app) first and fall back to the teacher endpoint.
 * Whichever succeeds, we store the matching token and bounce back to /classwork/.
 */
export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function tryTeacher(): Promise<boolean> {
    try {
      const r = await fetch('/api/teacher-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim(), password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!data?.ok || !data?.token) return false;
      const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
      localStorage.setItem('teacher_token', data.token);
      localStorage.setItem('teacher_token_expires', String(expiresAt));
      localStorage.setItem('teacherToken', data.token);
      localStorage.setItem('teacherTokenExpires', String(expiresAt));
      try { localStorage.setItem('bhscs-teacher-auth-email', identifier.toLowerCase().trim()); } catch {}
      return true;
    } catch { return false; }
  }

  async function tryStudent(): Promise<boolean> {
    try {
      const r = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier.trim(), password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.token) return false;
      const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentTokenExpires', String(expiresAt));
      try {
        localStorage.setItem('siteAuthUserCache', JSON.stringify({
          studentId: data.studentId,
          username: data.username || identifier.trim(),
          className: data.className,
          mustChangePassword: data.mustChangePassword,
        }));
      } catch {}
      return true;
    } catch { return false; }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setErr(null);
    setBusy(true);
    try {
      const looksLikeEmail = identifier.includes('@');
      const order = looksLikeEmail ? [tryTeacher, tryStudent] : [tryStudent, tryTeacher];
      for (const fn of order) {
        if (await fn()) {
          window.location.href = '/classwork/';
          return;
        }
      }
      setErr('That username/email and password didn\u2019t match any account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="Sign in">
      <div style={{
        maxWidth: 460, margin: '40px auto', background: 'var(--cw-surface)',
        border: '1px solid var(--cw-border)', borderRadius: 12, padding: 28,
        boxShadow: '0 4px 14px rgba(15,23,42,0.05)',
      }}>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, color: 'var(--cw-muted)', fontSize: 14 }}>
            Students: use your Revision-app username and password.<br />
            Teachers: use the email and password you use for the Sandbox dashboard.
          </p>
          <Field label="Username or email" value={identifier} onChange={setIdentifier} autoFocus />
          <Field label="Password" type="password" value={password} onChange={setPassword} />
          {err && <div style={{ color: 'var(--cw-danger)', fontSize: 14 }}>{err}</div>}
          <SubmitButton busy={busy}>Sign in</SubmitButton>
        </form>
      </div>
    </Shell>
  );
}

function Field({ label, value, onChange, type = 'text', autoFocus = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; autoFocus?: boolean;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14, fontWeight: 600 }}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        style={{
          padding: '10px 12px', border: '1px solid var(--cw-border)',
          borderRadius: 8, fontSize: 15, fontWeight: 400,
        }}
      />
    </label>
  );
}

function SubmitButton({ busy, children }: { busy: boolean; children: any }) {
  return (
    <button
      type="submit"
      disabled={busy}
      style={{
        marginTop: 4, padding: '10px 14px', background: 'var(--cw-accent)',
        color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700,
        cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1,
      }}
    >{busy ? 'Signing in\u2026' : children}</button>
  );
}
