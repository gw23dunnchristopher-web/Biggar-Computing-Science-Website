import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import Shell from '@/components/Shell';
import { api, getCurrentRole } from '@/lib/api';

interface Course { key: string; label: string; }

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const role = getCurrentRole();

  useEffect(() => {
    api<Course[]>('/api/classwork/courses')
      .then(setCourses)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell title="Home">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Choose a course</h1>
        {role === 'teacher' && (
          <Link href="/students" style={{
            background: '#f1f5f9', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
            padding: '8px 14px', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 14,
          }}>Manage students &amp; classes</Link>
        )}
      </div>
      <p style={{ color: 'var(--cw-muted)' }}>
        {role === 'teacher'
          ? 'Pick the year group you want to manage. You can add units, lessons and questions inside each.'
          : role === 'student'
            ? 'Open your year group to see the lessons your teacher has set.'
            : 'You are browsing as a guest. Sign in to save your work.'}
      </p>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div style={{
          display: 'grid', gap: 12,
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', marginTop: 24
        }}
        className="cw-home-grid">
          {courses.map((c) => (
            <Link
              key={c.key}
              href={`/course/${c.key}`}
              style={{
                display: 'block', background: '#fff',
                border: '1px solid var(--cw-border)', borderRadius: 12,
                padding: '16px 12px', textDecoration: 'none', color: 'inherit',
                boxShadow: '0 2px 8px rgba(15,23,42,0.04)', transition: 'transform .12s ease',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cw-accent)' }}>{c.label}</div>
              <div style={{ marginTop: 4, color: 'var(--cw-muted)', fontSize: 12 }}>
                Open
              </div>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}
