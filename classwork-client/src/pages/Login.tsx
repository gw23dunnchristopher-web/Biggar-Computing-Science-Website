import { useState } from 'react';
import Shell from '@/components/Shell';

/**
 * Combined login page. Students log in with their school credentials; teachers
 * use their dashboard email & password. The same backend endpoints used by
 * the existing apps are reused (no new auth surface).
 */
export default function Login() {
  const [tab, setTab] = useState<'student' | 'teacher'>('student');

  return (
    <Shell title="Sign in">
      <div style={{
        maxWidth: 460, margin: '40px auto', background: '#fff',
        border: '1px solid var(--cw-border)', borderRadius: 12, padding: 28,
        boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <TabButton active={tab === 'student'} onClick={() => setTab('student')}>Student</TabButton>
          <TabButton active={tab === 'teacher'} onClick={() => setTab('teacher')}>Teacher</TabButton>
        </div>
        {tab === 'student' ? <StudentLogin /> : <TeacherLogin />}
      </div>
    </Shell>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: any }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 14px', cursor: 'pointer',
        background: active ? 'var(--cw-accent)' : '#f1f5f9',
        color: active ? '#fff' : 'var(--cw-ink)',
        border: '1px solid var(--cw-border)', borderRadius: 8, fontWeight: 600
      }}
    >{children}</button>
  );
}

function StudentLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json();
      if (!r.ok || !data?.token) {
        throw new Error(data?.message || data?.error || 'Login failed');
      }
      const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentTokenExpires', String(expiresAt));
      try {
        localStorage.setItem('siteAuthUserCache', JSON.stringify({
          studentId: data.studentId, username: data.username || username,
          className: data.className, mustChangePassword: data.mustChangePassword,
        }));
      } catch {}
      window.location.href = '/classwork/';
    } catch (e: any) {
      setErr(e.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, color: 'var(--cw-muted)', fontSize: 14 }}>
        Use the same username and password you use for the Revision app.
      </p>
      <Field label="Username" value={username} onChange={setUsername} autoFocus />
      <Field label="Password" type="password" value={password} onChange={setPassword} />
      {err && <div style={{ color: 'var(--cw-danger)', fontSize: 14 }}>{err}</div>}
      <SubmitButton busy={busy}>Sign in</SubmitButton>
    </form>
  );
}

function TeacherLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch('/api/teacher-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok || !data?.ok || !data?.token) {
        throw new Error('Incorrect email or password');
      }
      const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
      localStorage.setItem('teacher_token', data.token);
      localStorage.setItem('teacher_token_expires', String(expiresAt));
      localStorage.setItem('teacherToken', data.token);
      localStorage.setItem('teacherTokenExpires', String(expiresAt));
      window.location.href = '/classwork/';
    } catch (e: any) {
      setErr(e.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, color: 'var(--cw-muted)', fontSize: 14 }}>
        Use the same credentials you use for the Sandbox dashboard.
      </p>
      <Field label="Email" value={email} onChange={setEmail} autoFocus />
      <Field label="Password" type="password" value={password} onChange={setPassword} />
      {err && <div style={{ color: 'var(--cw-danger)', fontSize: 14 }}>{err}</div>}
      <SubmitButton busy={busy}>Sign in</SubmitButton>
    </form>
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
          padding: '10px 12px', fontSize: 15,
          border: '1px solid var(--cw-border)', borderRadius: 8, fontWeight: 400,
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
        background: 'var(--cw-accent)', color: '#fff', border: 'none',
        padding: '12px 16px', borderRadius: 8, fontWeight: 600, cursor: busy ? 'wait' : 'pointer',
        opacity: busy ? 0.7 : 1
      }}
    >{busy ? 'Please wait…' : children}</button>
  );
}
