import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api, getCurrentRole } from '@/lib/api';

interface ClassRow { id: string; name: string; course: string | null; }
interface StudentRow { id: string; username: string; classId: string; initialPassword: string | null; mustChangePassword: boolean; }

const YEAR_OPTIONS: { value: string; label: string }[] = [
  { value: 's1', label: 'S1' },
  { value: 's2', label: 'S2' },
  { value: 's3', label: 'S3' },
  { value: 'n5', label: 'National 5' },
  { value: 'higher', label: 'Higher' },
];
function yearLabel(course: string | null): string {
  if (!course) return 'No year set';
  return YEAR_OPTIONS.find((y) => y.value === course)?.label || course;
}

export default function Students() {
  const role = getCurrentRole();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [bulkCount, setBulkCount] = useState('5');
  const [busy, setBusy] = useState(false);
  const [lastCreated, setLastCreated] = useState<{ username: string; plainPassword: string }[]>([]);

  async function loadClasses() {
    setLoadingClasses(true);
    setErr(null);
    try {
      const cs = await api<ClassRow[]>('/api/classwork/teacher/classes');
      setClasses(cs);
      if (!selectedId && cs.length) setSelectedId(cs[0].id);
    } catch (e: any) { setErr(e.message || 'Failed to load classes'); }
    finally { setLoadingClasses(false); }
  }

  async function loadStudents(classId: string) {
    setLoadingStudents(true);
    try {
      const s = await api<StudentRow[]>(`/api/classwork/teacher/classes/${classId}/students`);
      setStudents(s);
    } catch (e: any) { setErr(e.message || 'Failed to load students'); }
    finally { setLoadingStudents(false); }
  }

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => { if (selectedId) loadStudents(selectedId); }, [selectedId]);

  async function addClass() {
    const name = prompt('Class name? (e.g. "Mr Dunn 1A")');
    if (!name || !name.trim()) return;
    const yearAns = prompt('Year? Type one of: s1, s2, s3, n5, higher');
    const course = (yearAns || '').trim().toLowerCase();
    if (course && !YEAR_OPTIONS.some((y) => y.value === course)) {
      alert('Year must be s1, s2, s3, n5 or higher.');
      return;
    }
    try {
      const c = await api<ClassRow>('/api/classwork/teacher/classes', {
        method: 'POST', body: JSON.stringify({ name: name.trim(), course: course || null }),
      });
      await loadClasses();
      setSelectedId(c.id);
      setLastCreated([]);
    } catch (e: any) { alert(e.message); }
  }

  async function changeYear(c: ClassRow) {
    const ans = prompt(`Year for "${c.name}"? Type one of: s1, s2, s3, n5, higher (or leave blank for none)`, c.course || '');
    if (ans === null) return;
    const course = ans.trim().toLowerCase();
    if (course && !YEAR_OPTIONS.some((y) => y.value === course)) {
      alert('Year must be s1, s2, s3, n5 or higher.');
      return;
    }
    try {
      await api(`/api/classwork/teacher/classes/${c.id}`, {
        method: 'PATCH', body: JSON.stringify({ course: course || null }),
      });
      loadClasses();
    } catch (e: any) { alert(e.message); }
  }

  async function moveStudent(s: StudentRow) {
    const choices = classes.filter((c) => c.id !== s.classId);
    if (!choices.length) { alert('No other classes to move them to. Create another class first.'); return; }
    const list = choices.map((c, i) => `${i + 1}. ${c.name}${c.course ? ' (' + yearLabel(c.course) + ')' : ''}`).join('\n');
    const ans = prompt(`Move ${s.username} to which class?\n\n${list}\n\nType the number:`);
    const idx = parseInt((ans || '').trim(), 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= choices.length) return;
    const target = choices[idx];
    try {
      await api(`/api/classwork/teacher/students/${s.id}`, {
        method: 'PATCH', body: JSON.stringify({ classId: target.id }),
      });
      if (selectedId) loadStudents(selectedId);
    } catch (e: any) { alert(e.message); }
  }

  async function removeClass(c: ClassRow) {
    if (!confirm(`Delete class "${c.name}"? Students in this class will also be removed.`)) return;
    try {
      await api(`/api/classwork/teacher/classes/${c.id}`, { method: 'DELETE' });
      if (selectedId === c.id) setSelectedId(null);
      setStudents([]);
      setLastCreated([]);
      loadClasses();
    } catch (e: any) { alert(e.message); }
  }

  async function bulkAdd() {
    if (!selectedId) return;
    const n = parseInt(bulkCount, 10);
    if (!n || n < 1 || n > 50) { alert('Enter a number between 1 and 50.'); return; }
    setBusy(true);
    setLastCreated([]);
    try {
      const r = await api<{ created: { username: string; plainPassword: string }[] }>(
        `/api/classwork/teacher/classes/${selectedId}/students/bulk`,
        { method: 'POST', body: JSON.stringify({ count: n }) }
      );
      setLastCreated(r.created);
      loadStudents(selectedId);
    } catch (e: any) { alert(e.message); }
    finally { setBusy(false); }
  }

  async function resetPassword(s: StudentRow) {
    if (!confirm(`Reset password for ${s.username}? They'll be asked to set a new one on next login.`)) return;
    try {
      const r = await api<{ plainPassword: string }>(`/api/classwork/teacher/students/${s.id}/reset-password`, { method: 'POST' });
      alert(`New password for ${s.username}:\n\n${r.plainPassword}\n\nWrite this down — they'll change it on next login.`);
      if (selectedId) loadStudents(selectedId);
    } catch (e: any) { alert(e.message); }
  }

  async function removeStudent(s: StudentRow) {
    if (!confirm(`Delete student ${s.username}? This cannot be undone.`)) return;
    try {
      await api(`/api/classwork/teacher/students/${s.id}`, { method: 'DELETE' });
      if (selectedId) loadStudents(selectedId);
    } catch (e: any) { alert(e.message); }
  }

  function copyCreated() {
    const txt = lastCreated.map((c) => `${c.username}\t${c.plainPassword}`).join('\n');
    navigator.clipboard?.writeText(txt).then(
      () => alert('Copied! Paste into a spreadsheet — username and password are tab-separated.'),
      () => alert('Could not copy. Select the text manually.')
    );
  }

  if (role !== 'teacher') {
    return (
      <Shell title="Students" back={{ href: '/', label: 'Back to home' }}>
        <p>This page is for teachers only.</p>
      </Shell>
    );
  }

  const selectedClass = classes.find((c) => c.id === selectedId) || null;

  return (
    <Shell title="Students &amp; classes" back={{ href: '/', label: 'Back to home' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Students &amp; classes</h1>
        <button onClick={addClass} style={primaryBtn}>+ New class</button>
      </div>
      <p style={{ color: 'var(--cw-muted)', marginTop: 0 }}>
        Classes here are shared with the N5 and Higher revision apps. Use a clear name like
        <em> "S1 Mr Dunn 1A"</em> so you can spot it in any teacher dashboard.
      </p>

      {err && <p style={{ color: 'var(--cw-danger)' }}>{err}</p>}
      {loadingClasses && <p>Loading classes…</p>}

      {!loadingClasses && classes.length === 0 && (
        <p style={{ color: 'var(--cw-muted)' }}>No classes yet. Click <strong>+ New class</strong> to create one.</p>
      )}

      {classes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Classes</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {classes.map((c) => (
                <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => { setSelectedId(c.id); setLastCreated([]); }}
                    style={{
                      flex: 1, textAlign: 'left',
                      background: selectedId === c.id ? 'var(--cw-accent)' : '#f1f5f9',
                      color: selectedId === c.id ? '#fff' : 'var(--cw-ink)',
                      border: '1px solid var(--cw-border)', borderRadius: 6,
                      padding: '8px 10px', cursor: 'pointer', fontWeight: 600,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span>{c.name}</span>
                    <span style={{
                      fontSize: 11, padding: '1px 6px', borderRadius: 999,
                      background: c.course ? (selectedId === c.id ? 'rgba(255,255,255,0.25)' : '#dbeafe') : (selectedId === c.id ? 'rgba(255,255,255,0.18)' : '#fee2e2'),
                      color: c.course ? (selectedId === c.id ? '#fff' : '#1e3a8a') : (selectedId === c.id ? '#fff' : '#991b1b'),
                    }}>{yearLabel(c.course)}</span>
                  </button>
                  <button onClick={() => changeYear(c)} style={secondaryBtn} title="Change year">Yr</button>
                  <button onClick={() => removeClass(c)} style={dangerBtn} title="Delete class">×</button>
                </li>
              ))}
            </ul>
          </div>

          <div style={card}>
            {!selectedClass ? (
              <p style={{ color: 'var(--cw-muted)' }}>Pick a class on the left.</p>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ margin: 0 }}>{selectedClass.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ fontSize: 13 }}>Add</label>
                    <input
                      type="number" min={1} max={50} value={bulkCount}
                      onChange={(e) => setBulkCount(e.target.value)}
                      style={{ width: 60, padding: '6px 8px', border: '1px solid var(--cw-border)', borderRadius: 6 }}
                    />
                    <button onClick={bulkAdd} disabled={busy} style={primaryBtn}>
                      {busy ? 'Adding…' : 'Add students'}
                    </button>
                  </div>
                </div>

                {lastCreated.length > 0 && (
                  <div style={{ marginTop: 12, padding: 12, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <strong>Just created — copy these now:</strong>
                      <button onClick={copyCreated} style={secondaryBtn}>Copy as table</button>
                    </div>
                    <table style={{ width: '100%', fontSize: 13, fontFamily: 'monospace' }}>
                      <thead><tr><th align="left">Username</th><th align="left">Password</th></tr></thead>
                      <tbody>
                        {lastCreated.map((c) => (
                          <tr key={c.username}><td>{c.username}</td><td>{c.plainPassword}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  {loadingStudents ? (
                    <p>Loading students…</p>
                  ) : students.length === 0 ? (
                    <p style={{ color: 'var(--cw-muted)' }}>No students in this class yet.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th align="left" style={th}>Username</th>
                          <th align="left" style={th}>Initial password</th>
                          <th align="left" style={th}>Status</th>
                          <th align="right" style={th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => (
                          <tr key={s.id} style={{ borderTop: '1px solid var(--cw-border)' }}>
                            <td style={td}><code>{s.username}</code></td>
                            <td style={td}>{s.mustChangePassword && s.initialPassword ? <code>{s.initialPassword}</code> : <span style={{ color: 'var(--cw-muted)' }}>changed</span>}</td>
                            <td style={td}>
                              {s.mustChangePassword
                                ? <span style={{ color: '#92400e' }}>Hasn't changed yet</span>
                                : <span style={{ color: '#166534' }}>Set own password</span>}
                            </td>
                            <td style={{ ...td, textAlign: 'right' }}>
                              <button onClick={() => moveStudent(s)} style={secondaryBtn}>Move</button>{' '}
                              <button onClick={() => resetPassword(s)} style={secondaryBtn}>Reset password</button>{' '}
                              <button onClick={() => removeStudent(s)} style={dangerBtn}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--cw-border)', borderRadius: 12, padding: 16,
  boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
};
const primaryBtn: React.CSSProperties = {
  background: 'var(--cw-accent)', color: '#fff', border: 'none',
  padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
  background: '#f1f5f9', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
  padding: '6px 10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13,
};
const dangerBtn: React.CSSProperties = {
  background: '#fee2e2', color: 'var(--cw-danger)', border: '1px solid #fecaca',
  padding: '6px 10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13,
};
const th: React.CSSProperties = { padding: '8px 10px', fontSize: 13, color: 'var(--cw-muted)' };
const td: React.CSSProperties = { padding: '8px 10px' };
