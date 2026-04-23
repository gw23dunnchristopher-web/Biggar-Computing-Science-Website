import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import Shell from '@/components/Shell';
import { api, getCurrentRole } from '@/lib/api';

interface Unit { id: string; title: string; description: string | null; course: string; }
interface Lesson { id: string; unit_id: string; title: string; description: string | null; is_published: boolean; }

const COURSE_LABELS: Record<string, string> = {
  s1: 'S1', s2: 'S2', s3: 'S3', n5: 'National 5', higher: 'Higher',
};

export default function Course() {
  const [, params] = useRoute('/course/:course');
  const course = params?.course || '';
  const role = getCurrentRole();
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessonsByUnit, setLessonsByUnit] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const u = await api<Unit[]>(`/api/classwork/${course}/units`);
      setUnits(u);
      const entries = await Promise.all(
        u.map(async (unit) => {
          const lessons = await api<Lesson[]>(`/api/classwork/units/${unit.id}/lessons`);
          return [unit.id, lessons] as const;
        })
      );
      setLessonsByUnit(Object.fromEntries(entries));
    } catch (e: any) {
      setErr(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [course]);

  async function addUnit() {
    const title = prompt('Unit title?');
    if (!title) return;
    try {
      await api(`/api/classwork/${course}/units`, {
        method: 'POST', body: JSON.stringify({ title, orderIndex: units.length }),
      });
      refresh();
    } catch (e: any) { alert(e.message); }
  }

  async function addLesson(unitId: string) {
    const title = prompt('Lesson title?');
    if (!title) return;
    try {
      await api(`/api/classwork/units/${unitId}/lessons`, {
        method: 'POST', body: JSON.stringify({ title, orderIndex: (lessonsByUnit[unitId] || []).length }),
      });
      refresh();
    } catch (e: any) { alert(e.message); }
  }

  async function togglePublish(lesson: Lesson) {
    try {
      await api(`/api/classwork/lessons/${lesson.id}`, {
        method: 'PATCH', body: JSON.stringify({ isPublished: !lesson.is_published }),
      });
      refresh();
    } catch (e: any) { alert(e.message); }
  }

  async function deleteLesson(lesson: Lesson) {
    if (!confirm(`Delete lesson "${lesson.title}"? This also deletes its questions and submissions.`)) return;
    try {
      await api(`/api/classwork/lessons/${lesson.id}`, { method: 'DELETE' });
      refresh();
    } catch (e: any) { alert(e.message); }
  }

  async function deleteUnit(unit: Unit) {
    if (!confirm(`Delete unit "${unit.title}" and all its lessons?`)) return;
    try {
      await api(`/api/classwork/units/${unit.id}`, { method: 'DELETE' });
      refresh();
    } catch (e: any) { alert(e.message); }
  }

  return (
    <Shell title={COURSE_LABELS[course] || course} back={{ href: '/', label: 'All courses' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Units</h1>
        {role === 'teacher' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/analytics/${course}`} style={{
              display: 'inline-block',
              background: '#f1f5f9', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
              padding: '8px 14px', borderRadius: 8, fontWeight: 600, textDecoration: 'none',
            }}>Analytics</Link>
            <button onClick={addUnit} style={primaryBtn}>+ New unit</button>
          </div>
        )}
      </div>

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: 'var(--cw-danger)' }}>{err}</p>}
      {!loading && !err && units.length === 0 && (
        <p style={{ color: 'var(--cw-muted)' }}>
          {role === 'teacher' ? 'No units yet. Add the first one above.' : 'No units published yet — check back soon.'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {units.map((u) => {
          const lessons = lessonsByUnit[u.id] || [];
          return (
            <div key={u.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{u.title}</h2>
                {role === 'teacher' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => addLesson(u.id)} style={secondaryBtn}>+ Lesson</button>
                    <button onClick={() => deleteUnit(u)} style={dangerBtn}>Delete unit</button>
                  </div>
                )}
              </div>
              {u.description && <p style={{ color: 'var(--cw-muted)', marginTop: 6 }}>{u.description}</p>}
              {lessons.length === 0 ? (
                <p style={{ color: 'var(--cw-muted)', marginTop: 12 }}>
                  {role === 'teacher' ? 'No lessons in this unit yet.' : 'No lessons here yet.'}
                </p>
              ) : (
                <ul style={{ marginTop: 12, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lessons.map((l) => (
                    <li key={l.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 12, border: '1px solid var(--cw-border)', borderRadius: 8, background: '#fafbfd'
                    }}>
                      <Link href={`/lesson/${l.id}`} style={{ fontWeight: 600 }}>{l.title}</Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {role === 'teacher' && (
                          <>
                            <span title={l.is_published ? 'Students can see this lesson' : 'Hidden from students — safe to edit'} style={{
                              fontSize: 12, padding: '2px 8px', borderRadius: 999,
                              background: l.is_published ? '#dcfce7' : '#fee2e2',
                              color: l.is_published ? '#166534' : '#991b1b'
                            }}>{l.is_published ? 'Published' : 'Locked (draft)'}</span>
                            <button
                              onClick={() => togglePublish(l)}
                              style={secondaryBtn}
                              title={l.is_published ? 'Lock this lesson so students can\'t see it while you edit' : 'Publish this lesson so students can see it'}
                            >
                              {l.is_published ? 'Lock' : 'Publish'}
                            </button>
                            <button onClick={() => deleteLesson(l)} style={dangerBtn}>Delete</button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--cw-border)', borderRadius: 12, padding: 20,
  boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
};
const primaryBtn: React.CSSProperties = {
  background: 'var(--cw-accent)', color: '#fff', border: 'none',
  padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
  background: '#f1f5f9', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
  padding: '6px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13,
};
const dangerBtn: React.CSSProperties = {
  background: '#fee2e2', color: 'var(--cw-danger)', border: '1px solid #fecaca',
  padding: '6px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13,
};
