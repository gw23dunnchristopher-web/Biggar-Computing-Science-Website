import { ReactNode } from 'react';
import { Link } from 'wouter';
import { getCurrentRole, getStudentUsername, logoutStudent, logoutTeacher } from '@/lib/api';

interface Props {
  title: string;
  back?: { href: string; label: string };
  children: ReactNode;
}

export default function Shell({ title, back, children }: Props) {
  const role = getCurrentRole();
  const username = getStudentUsername();

  function handleLogout() {
    if (role === 'teacher') logoutTeacher();
    if (role === 'student') logoutStudent();
    window.location.href = '/classwork/';
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'var(--cw-accent)',
        color: '#fff',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
      }}>
        <Link href="/" style={{ color: '#fff', fontWeight: 700, fontSize: 18, textDecoration: 'none' }}>
          BHS Classwork
        </Link>
        <div style={{ flex: 1, fontSize: 16, opacity: 0.9 }}>{title}</div>
        {role !== 'guest' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
            {role === 'teacher' && <span style={{ background: 'rgba(255,255,255,0.18)', padding: '4px 10px', borderRadius: 999 }}>Teacher</span>}
            {role === 'student' && username && <span>{username}</span>}
            <button onClick={handleLogout} style={{
              background: 'rgba(255,255,255,0.18)', color: '#fff',
              border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer'
            }}>Log out</button>
          </div>
        )}
      </header>
      {back && (
        <div style={{ padding: '8px 24px', background: '#fff', borderBottom: '1px solid var(--cw-border)' }}>
          <Link href={back.href} style={{ fontSize: 14 }}>← {back.label}</Link>
        </div>
      )}
      <main style={{ flex: 1, padding: '24px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        {children}
      </main>
      <footer style={{ padding: 16, textAlign: 'center', color: 'var(--cw-muted)', fontSize: 13 }}>
        Biggar High School · Computing Science
      </footer>
    </div>
  );
}
