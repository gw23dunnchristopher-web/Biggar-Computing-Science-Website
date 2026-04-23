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
      <h1 style={{ marginTop: 0 }}>Choose a course</h1>
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
          display: 'grid', gap: 16,
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', marginTop: 24
        }}>
          {courses.map((c) => (
            <Link
              key={c.key}
              href={`/course/${c.key}`}
              style={{
                display: 'block', background: '#fff',
                border: '1px solid var(--cw-border)', borderRadius: 12,
                padding: 24, textDecoration: 'none', color: 'inherit',
                boxShadow: '0 2px 8px rgba(15,23,42,0.04)', transition: 'transform .12s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--cw-accent)' }}>{c.label}</div>
              <div style={{ marginTop: 8, color: 'var(--cw-muted)', fontSize: 14 }}>
                Open course
              </div>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}
