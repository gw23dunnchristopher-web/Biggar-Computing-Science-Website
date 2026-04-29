import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import Shell from '@/components/Shell';
import { api, getCurrentRole } from '@/lib/api';

interface Course { key: string; label: string; }

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const role = getCurrentRole();
  const [, navigate] = useLocation();
  const [myCourse, setMyCourse] = useState<{ course: string | null; className: string | null } | null>(null);

  useEffect(() => {
    api<Course[]>('/api/classwork/courses')
      .then(setCourses)
      .finally(() => setLoading(false));
  }, []);

  // Students with a year set get whisked straight to their course world.
  useEffect(() => {
    if (role !== 'student') return;
    api<{ course: string | null; className: string | null }>('/api/classwork/me/course')
      .then((r) => {
        setMyCourse(r);
        if (r?.course) navigate(`/course/${r.course}`, { replace: true });
      })
      .catch(() => { /* ignore — fallback to manual picker */ });
  }, [role]);

  return (
    <Shell title="Home">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Choose a course</h1>
        {role === 'teacher' && (
          <Link href="/students" style={{
            background: 'var(--cw-surface-muted)', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
            padding: '8px 14px', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 14,
          }}>Manage students &amp; classes</Link>
        )}
      </div>
      <p style={{ color: 'var(--cw-muted)' }}>
        {role === 'teacher'
          ? 'Pick the year group you want to manage. You can add units, lessons and questions inside each.'
          : role === 'student'
            ? (myCourse && !myCourse.course
                ? "You haven't been put in a year group yet — please ask your teacher to add you to a class. In the meantime you can browse below."
                : 'Taking you to your year group…')
            : 'You are browsing as a guest. Sign in to save your work.'}
      </p>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div style={{
          display: 'grid', gap: 12,
          gridTemplateColumns: `repeat(${Math.max(courses.length, 1)}, minmax(0, 1fr))`,
          marginTop: 24,
        }}
        className="cw-home-grid">
          {courses.map((c) => (
            <Link
              key={c.key}
              href={`/course/${c.key}`}
              style={{
                display: 'block', background: 'var(--cw-surface)',
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
