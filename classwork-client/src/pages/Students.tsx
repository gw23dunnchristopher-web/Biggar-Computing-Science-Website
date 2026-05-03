import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import Modal, { modalPrimaryBtn, modalSecondaryBtn, modalDangerBtn, modalLabel, modalInput } from '@/components/Modal';
import Menu from '@/components/Menu';
import { api, getCurrentRole } from '@/lib/api';

interface ClassRow { id: string; name: string; course: string | null; archived?: boolean; }
interface StudentRow { id: string; username: string; classId: string; initialPassword: string | null; mustChangePassword: boolean; }

const YEAR_OPTIONS: { value: string; label: string; short: string }[] = [
  { value: 's1', label: 'S1', short: 'S1' },
  { value: 's2', label: 'S2', short: 'S2' },
  { value: 's3', label: 'S3', short: 'S3' },
  { value: 'n4', label: 'National 4', short: 'N4' },
  { value: 'n5', label: 'National 5', short: 'N5' },
  { value: 'higher', label: 'Higher', short: 'Higher' },
];
function yearLabel(course: string | null): string {
  if (!course) return 'No year set';
  return YEAR_OPTIONS.find((y) => y.value === course)?.label || course;
}
function yearShort(course: string | null): string {
  if (!course) return 'Set year';
  return YEAR_OPTIONS.find((y) => y.value === course)?.short || course;
}

type ModalState =
  | { kind: 'none' }
  | { kind: 'addClass' }
  | { kind: 'editYear'; cls: ClassRow }
  | { kind: 'renameClass'; cls: ClassRow }
  | { kind: 'moveStudent'; student: StudentRow }
  | { kind: 'renameStudent'; student: StudentRow }
  | { kind: 'deleteClass'; cls: ClassRow }
  | { kind: 'deleteStudent'; student: StudentRow }
  | { kind: 'resetPassword'; student: StudentRow }
  | { kind: 'showPassword'; username: string; password: string }
  | { kind: 'info'; title: string; message: string };

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

  const [modal, setModal] = useState<ModalState>({ kind: 'none' });
  const closeModal = () => setModal({ kind: 'none' });

  // form state for the various modals (reset every time the modal opens)
  const [newClassName, setNewClassName] = useState('');
  const [newClassYear, setNewClassYear] = useState('');
  const [editYearValue, setEditYearValue] = useState('');
  const [renameClassValue, setRenameClassValue] = useState('');
  const [renameStudentValue, setRenameStudentValue] = useState('');
  const [moveTargetId, setMoveTargetId] = useState('');
  const [modalErr, setModalErr] = useState<string | null>(null);

  function openAddClass() {
    setNewClassName(''); setNewClassYear(''); setModalErr(null);
    setModal({ kind: 'addClass' });
  }
  function openEditYear(cls: ClassRow) {
    setEditYearValue(cls.course || ''); setModalErr(null);
    setModal({ kind: 'editYear', cls });
  }
  function openRenameClass(cls: ClassRow) {
    setRenameClassValue(cls.name); setModalErr(null);
    setModal({ kind: 'renameClass', cls });
  }
  function openRenameStudent(s: StudentRow) {
    setRenameStudentValue(s.username); setModalErr(null);
    setModal({ kind: 'renameStudent', student: s });
  }
  function openMoveStudent(s: StudentRow) {
    const choices = classes.filter((c) => c.id !== s.classId);
    if (!choices.length) {
      setModal({ kind: 'info', title: 'No other classes', message: 'You only have one class. Create another class first, then you can move pupils into it.' });
      return;
    }
    setMoveTargetId(choices[0].id); setModalErr(null);
    setModal({ kind: 'moveStudent', student: s });
  }

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

  async function submitAddClass() {
    const name = newClassName.trim();
    if (!name) { setModalErr('Class name is required.'); return; }
    try {
      const c = await api<ClassRow>('/api/classwork/teacher/classes', {
        method: 'POST', body: JSON.stringify({ name, course: newClassYear || null }),
      });
      await loadClasses();
      setSelectedId(c.id);
      setLastCreated([]);
      closeModal();
    } catch (e: any) { setModalErr(e.message); }
  }

  async function submitEditYear(cls: ClassRow) {
    try {
      await api(`/api/classwork/teacher/classes/${cls.id}`, {
        method: 'PATCH', body: JSON.stringify({ course: editYearValue || null }),
      });
      await loadClasses();
      closeModal();
    } catch (e: any) { setModalErr(e.message); }
  }

  async function submitRenameClass(cls: ClassRow) {
    const name = renameClassValue.trim();
    if (!name) { setModalErr('Class name is required.'); return; }
    if (name === cls.name) { closeModal(); return; }
    try {
      await api(`/api/classwork/teacher/classes/${cls.id}`, {
        method: 'PATCH', body: JSON.stringify({ name }),
      });
      await loadClasses();
      closeModal();
    } catch (e: any) { setModalErr(e.message); }
  }

  async function submitRenameStudent(s: StudentRow) {
    const username = renameStudentValue.trim().toLowerCase();
    if (!username) { setModalErr('Username is required.'); return; }
    if (username === s.username) { closeModal(); return; }
    try {
      await api(`/api/classwork/teacher/students/${s.id}`, {
        method: 'PATCH', body: JSON.stringify({ username }),
      });
      if (selectedId) loadStudents(selectedId);
      closeModal();
    } catch (e: any) { setModalErr(e.message); }
  }

  // Helper: are the source class (the one the pupil is currently in) and the
  // chosen target class in the same year? If yes → straight move. If no →
  // copy (creates a fresh login in the target, leaves the original behind so
  // the old class can be archived with all the pupil's work intact).
  function isSameYear(sourceClassId: string, targetClassId: string): boolean {
    const a = classes.find((c) => c.id === sourceClassId);
    const b = classes.find((c) => c.id === targetClassId);
    if (!a || !b) return false;
    // Treat "no year set" on either side as same-year, so the teacher just gets
    // the simpler move action and isn't surprised by an unexpected copy.
    if (!a.course || !b.course) return true;
    return a.course === b.course;
  }

  async function submitMoveStudent(s: StudentRow) {
    if (!moveTargetId) { setModalErr('Pick a class.'); return; }
    const sameYear = isSameYear(s.classId, moveTargetId);
    try {
      if (sameYear) {
        await api(`/api/classwork/teacher/students/${s.id}`, {
          method: 'PATCH', body: JSON.stringify({ classId: moveTargetId }),
        });
        if (selectedId) loadStudents(selectedId);
        closeModal();
      } else {
        const r = await api<{ id: string; username: string; plainPassword: string }>(
          `/api/classwork/teacher/students/${s.id}/copy-to-class`,
          { method: 'POST', body: JSON.stringify({ classId: moveTargetId }) }
        );
        // Refresh so a new pupil shows up if the teacher is viewing the target class.
        if (selectedId) loadStudents(selectedId);
        // Surface the new credentials so the teacher can hand them over.
        setModal({ kind: 'showPassword', username: r.username, password: r.plainPassword });
      }
    } catch (e: any) { setModalErr(e.message); }
  }

  async function toggleArchiveClass(c: ClassRow) {
    try {
      await api(`/api/classwork/teacher/classes/${c.id}`, {
        method: 'PATCH', body: JSON.stringify({ archived: !c.archived }),
      });
      // If we just archived the currently-selected class, clear the right pane
      // so the teacher isn't staring at pupils from a class they can't see.
      if (!c.archived && selectedId === c.id) { setSelectedId(null); setStudents([]); }
      loadClasses();
    } catch (e: any) {
      setModal({ kind: 'info', title: 'Archive failed', message: e.message });
    }
  }

  async function confirmDeleteClass(c: ClassRow) {
    try {
      await api(`/api/classwork/teacher/classes/${c.id}`, { method: 'DELETE' });
      if (selectedId === c.id) setSelectedId(null);
      setStudents([]);
      setLastCreated([]);
      loadClasses();
      closeModal();
    } catch (e: any) { setModalErr(e.message); }
  }

  async function bulkAdd() {
    if (!selectedId) return;
    const n = parseInt(bulkCount, 10);
    if (!n || n < 1 || n > 50) {
      setModal({ kind: 'info', title: 'Out of range', message: 'Enter a number between 1 and 50.' });
      return;
    }
    setBusy(true);
    setLastCreated([]);
    try {
      const r = await api<{ created: { username: string; plainPassword: string }[] }>(
        `/api/classwork/teacher/classes/${selectedId}/students/bulk`,
        { method: 'POST', body: JSON.stringify({ count: n }) }
      );
      setLastCreated(r.created);
      loadStudents(selectedId);
    } catch (e: any) {
      setModal({ kind: 'info', title: 'Could not add students', message: e.message });
    }
    finally { setBusy(false); }
  }

  async function confirmResetPassword(s: StudentRow) {
    try {
      const r = await api<{ plainPassword: string }>(`/api/classwork/teacher/students/${s.id}/reset-password`, { method: 'POST' });
      if (selectedId) loadStudents(selectedId);
      setModal({ kind: 'showPassword', username: s.username, password: r.plainPassword });
    } catch (e: any) { setModalErr(e.message); }
  }

  async function confirmDeleteStudent(s: StudentRow) {
    try {
      await api(`/api/classwork/teacher/students/${s.id}`, { method: 'DELETE' });
      if (selectedId) loadStudents(selectedId);
      closeModal();
    } catch (e: any) { setModalErr(e.message); }
  }

  function copyCreated() {
    const txt = lastCreated.map((c) => `${c.username}\t${c.plainPassword}`).join('\n');
    navigator.clipboard?.writeText(txt).then(
      () => setModal({ kind: 'info', title: 'Copied', message: 'Paste into a spreadsheet — username and password are tab-separated.' }),
      () => setModal({ kind: 'info', title: 'Copy failed', message: 'Could not copy. Select the text manually.' })
    );
  }

  function printCredentials() {
    if (!selectedClass || students.length === 0) return;
    const loginUrl = `${window.location.origin}/classwork/`;
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const yearStr = selectedClass.course ? ` — ${yearLabel(selectedClass.course)}` : '';

    const rows = students.map((s) => {
      const pwd = s.initialPassword || '—';
      const status = s.mustChangePassword ? 'Not changed yet' : 'Changed own password';
      const statusStyle = s.mustChangePassword
        ? 'color:#92400e'
        : 'color:#6b7280;font-style:italic';
      return `<tr>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:11pt">${s.username}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:11pt">${s.mustChangePassword ? pwd : `<span style="color:#9ca3af">${pwd}</span>`}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:10pt;${statusStyle}">${status}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${selectedClass.name} — Login Credentials</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:12pt;color:#111;padding:16mm 18mm}
    h1{font-size:17pt;font-weight:700;margin-bottom:4px}
    .meta{font-size:10pt;color:#6b7280;margin-bottom:18px}
    table{width:100%;border-collapse:collapse}
    thead tr{background:#f3f4f6}
    th{text-align:left;padding:8px 10px;border-bottom:2px solid #d1d5db;font-size:10pt;color:#374151;font-weight:700}
    .note{margin-top:20px;font-size:9pt;color:#9ca3af}
    @media print{@page{margin:12mm}}
  </style>
</head>
<body>
  <h1>${selectedClass.name}${yearStr}</h1>
  <div class="meta">Printed ${dateStr} &nbsp;·&nbsp; ${students.length} pupil${students.length !== 1 ? 's' : ''} &nbsp;·&nbsp; Login: <strong>${loginUrl}</strong></div>
  <table>
    <thead>
      <tr>
        <th>Username</th>
        <th>Initial password</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="note">Pupils who have already set their own password are shown in grey — their initial password is shown for your records only.</p>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
      setModal({ kind: 'info', title: 'Pop-up blocked', message: 'Please allow pop-ups for this site, then try again.' });
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
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
        <button onClick={openAddClass} style={primaryBtn}>+ New class</button>
      </div>
      <p style={{ color: 'var(--cw-muted)', marginTop: 0 }}>
        Classes here are shared with the N5 and Higher revision apps. Use a clear name like
        <em> "Mr Dunn 1A"</em> so you can spot it in any teacher dashboard.
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
            {(() => {
              // Render a year-grouped, collapsible list for the given set of
              // classes. Used twice — once for active classes, once for the
              // archived ones. All groups start collapsed.
              const groupOrder: { key: string; label: string }[] = [
                { key: 'higher', label: 'Higher' },
                { key: 'n5',     label: 'National 5' },
                { key: 'n4',     label: 'National 4' },
                { key: 's3',     label: 'S3' },
                { key: 's2',     label: 'S2' },
                { key: 's1',     label: 'S1' },
                { key: '__none', label: 'No year set' },
              ];
              const renderClassRow = (c: ClassRow) => {
                const isSel = selectedId === c.id;
                return (
                  <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => { setSelectedId(c.id); setLastCreated([]); }}
                      style={{
                        flex: 1, textAlign: 'left', minWidth: 0,
                        background: isSel ? 'var(--cw-accent)' : 'var(--cw-surface-muted)',
                        color: isSel ? '#fff' : 'var(--cw-ink)',
                        border: '1px solid var(--cw-border)', borderRadius: 6,
                        padding: '8px 10px', cursor: 'pointer', fontWeight: 600,
                        opacity: c.archived ? 0.7 : 1,
                      }}
                    >
                      <span style={{
                        display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{c.name}</span>
                    </button>
                    <button
                      onClick={() => openEditYear(c)}
                      title={c.course ? `Year: ${yearLabel(c.course)} — click to change` : 'Set year'}
                      style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 999,
                        whiteSpace: 'nowrap', cursor: 'pointer', minWidth: 44, textAlign: 'center',
                        background: c.course ? '#dbeafe' : '#fee2e2',
                        color: c.course ? '#1e3a8a' : '#991b1b',
                        border: c.course ? '1px solid #bfdbfe' : '1px solid #fecaca',
                      }}
                    >{yearShort(c.course)}</button>
                    <Menu
                      title="Class actions"
                      items={[
                        { label: 'Rename class…',          onClick: () => openRenameClass(c) },
                        { label: 'Change year…',           onClick: () => openEditYear(c) },
                        { label: c.archived ? 'Unarchive' : 'Archive', onClick: () => toggleArchiveClass(c) },
                        { label: 'Delete class…',          onClick: () => setModal({ kind: 'deleteClass', cls: c }), danger: true },
                      ]}
                    />
                  </li>
                );
              };
              const renderGroupedList = (rows: ClassRow[]) => {
                const groups = new Map<string, ClassRow[]>();
                for (const c of rows) {
                  const k = c.course || '__none';
                  if (!groups.has(k)) groups.set(k, []);
                  groups.get(k)!.push(c);
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {groupOrder.map((g) => {
                      const items = groups.get(g.key);
                      if (!items || items.length === 0) return null;
                      return (
                        <details key={g.key} style={{
                          border: '1px solid var(--cw-border)', borderRadius: 8, background: 'var(--cw-surface)',
                        }}>
                          <summary style={{
                            cursor: 'pointer', padding: '8px 10px', fontWeight: 700,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            listStyle: 'revert',
                          }}>
                            <span>{g.label}</span>
                            <span style={{ fontSize: 12, color: 'var(--cw-muted)', fontWeight: 600 }}>
                              {items.length}
                            </span>
                          </summary>
                          <ul style={{
                            listStyle: 'none', padding: '6px 8px 8px', margin: 0,
                            display: 'flex', flexDirection: 'column', gap: 6,
                          }}>
                            {items.map(renderClassRow)}
                          </ul>
                        </details>
                      );
                    })}
                  </div>
                );
              };

              const active   = classes.filter((c) => !c.archived);
              const archived = classes.filter((c) =>  c.archived);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {active.length === 0
                    ? <p style={{ color: 'var(--cw-muted)', margin: 0, fontSize: 13 }}>No active classes.</p>
                    : renderGroupedList(active)}
                  {archived.length > 0 && (
                    <details style={{
                      border: '1px dashed var(--cw-border)', borderRadius: 8,
                      background: 'var(--cw-surface-soft)', padding: '4px 6px',
                    }}>
                      <summary style={{
                        cursor: 'pointer', padding: '6px 6px', fontWeight: 700,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        color: 'var(--cw-muted)', listStyle: 'revert',
                      }}>
                        <span>Archived</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{archived.length}</span>
                      </summary>
                      <div style={{ padding: '6px 2px 2px' }}>
                        {renderGroupedList(archived)}
                      </div>
                    </details>
                  )}
                </div>
              );
            })()}
          </div>

          <div style={card}>
            {!selectedClass ? (
              <p style={{ color: 'var(--cw-muted)' }}>Pick a class on the left.</p>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ margin: 0 }}>{selectedClass.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {students.length > 0 && (
                      <button
                        onClick={printCredentials}
                        title="Open a print-ready credentials sheet for this class"
                        style={secondaryBtn}
                      >
                        Print logins
                      </button>
                    )}
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
                        <tr style={{ background: 'var(--cw-surface-soft)' }}>
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
                              <Menu
                                title="Student actions"
                                items={[
                                  { label: 'View notes jotter…', onClick: () => { window.location.href = `/classwork/jotter/${encodeURIComponent(s.id)}`; } },
                                  { label: 'Rename username…', onClick: () => openRenameStudent(s) },
                                  { label: 'Move or copy…',    onClick: () => openMoveStudent(s) },
                                  { label: 'Reset password…',  onClick: () => { setModalErr(null); setModal({ kind: 'resetPassword', student: s }); } },
                                  { label: 'Delete student…',  onClick: () => { setModalErr(null); setModal({ kind: 'deleteStudent', student: s }); }, danger: true },
                                ]}
                              />
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

      {/* ---------- Modals ---------- */}

      <Modal
        open={modal.kind === 'addClass'}
        title="New class"
        onClose={closeModal}
        footer={<>
          <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
          <button onClick={submitAddClass} style={modalPrimaryBtn}>Create class</button>
        </>}
      >
        <div>
          <label style={modalLabel}>Class name</label>
          <input
            autoFocus value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitAddClass(); }}
            placeholder="e.g. Mr Dunn 1A"
            style={modalInput}
          />
        </div>
        <div>
          <label style={modalLabel}>Year</label>
          <select value={newClassYear} onChange={(e) => setNewClassYear(e.target.value)} style={modalInput}>
            <option value="">— Choose a year —</option>
            {YEAR_OPTIONS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
          </select>
          <p style={{ fontSize: 12, color: 'var(--cw-muted)', margin: '4px 0 0' }}>
            Students added to this class will be sent straight to this year's lessons.
          </p>
        </div>
        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{modalErr}</p>}
      </Modal>

      <Modal
        open={modal.kind === 'renameClass'}
        title={modal.kind === 'renameClass' ? `Rename "${modal.cls.name}"` : ''}
        onClose={closeModal}
        footer={<>
          <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
          <button onClick={() => modal.kind === 'renameClass' && submitRenameClass(modal.cls)} style={modalPrimaryBtn}>Save name</button>
        </>}
      >
        <div>
          <label style={modalLabel}>Class name</label>
          <input
            type="text"
            value={renameClassValue}
            onChange={(e) => setRenameClassValue(e.target.value)}
            placeholder="e.g. Mr Dunn 1A"
            style={modalInput}
            autoFocus
          />
        </div>
        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{modalErr}</p>}
      </Modal>

      <Modal
        open={modal.kind === 'renameStudent'}
        title={modal.kind === 'renameStudent' ? `Rename ${modal.student.username}` : ''}
        onClose={closeModal}
        footer={<>
          <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
          <button onClick={() => modal.kind === 'renameStudent' && submitRenameStudent(modal.student)} style={modalPrimaryBtn}>Save username</button>
        </>}
      >
        <div>
          <label style={modalLabel}>New username</label>
          <input
            type="text"
            value={renameStudentValue}
            onChange={(e) => setRenameStudentValue(e.target.value.toLowerCase())}
            placeholder="lower-case-with-hyphens"
            style={{ ...modalInput, fontFamily: 'monospace' }}
            autoFocus
          />
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--cw-muted)' }}>
            3-32 characters: lowercase letters, digits and hyphens only. The pupil's password is unchanged.
          </p>
        </div>
        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{modalErr}</p>}
      </Modal>

      <Modal
        open={modal.kind === 'editYear'}
        title={modal.kind === 'editYear' ? `Year for "${modal.cls.name}"` : ''}
        onClose={closeModal}
        footer={<>
          <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
          <button onClick={() => modal.kind === 'editYear' && submitEditYear(modal.cls)} style={modalPrimaryBtn}>Save</button>
        </>}
      >
        <div>
          <label style={modalLabel}>Year</label>
          <select value={editYearValue} onChange={(e) => setEditYearValue(e.target.value)} style={modalInput}>
            <option value="">— No year —</option>
            {YEAR_OPTIONS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
          </select>
        </div>
        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{modalErr}</p>}
      </Modal>

      {(() => {
        // Decide button label + helper text based on whether the chosen target
        // class is in the same year as the pupil's current class.
        const moving = modal.kind === 'moveStudent' ? modal.student : null;
        const sameYear = moving && moveTargetId ? isSameYear(moving.classId, moveTargetId) : true;
        const targetCls = classes.find((c) => c.id === moveTargetId) || null;
        const sourceCls = moving ? classes.find((c) => c.id === moving.classId) || null : null;
        return (
          <Modal
            open={modal.kind === 'moveStudent'}
            title={moving ? `Move or copy ${moving.username}` : ''}
            onClose={closeModal}
            footer={<>
              <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
              <button onClick={() => moving && submitMoveStudent(moving)} style={modalPrimaryBtn}>
                {sameYear ? 'Move student' : 'Copy to new class'}
              </button>
            </>}
          >
            <div>
              <label style={modalLabel}>{sameYear ? 'Move to class' : 'Copy to class'}</label>
              <select value={moveTargetId} onChange={(e) => setMoveTargetId(e.target.value)} style={modalInput}>
                {classes.filter((c) => moving && c.id !== moving.classId).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.course ? ` — ${yearLabel(c.course)}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--cw-muted)', lineHeight: 1.4 }}>
              {sameYear
                ? `Same year — the pupil will be moved into ${targetCls?.name || 'the chosen class'}. Their existing work stays with them.`
                : `Different year — a brand-new login will be created in ${targetCls?.name || 'the new class'}. ${sourceCls ? `The original pupil and all their work stay in ${sourceCls.name}` : 'The original pupil stays where they are'}, so you can archive that class once the year is over.`
              }
            </p>
            {modalErr && <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{modalErr}</p>}
          </Modal>
        );
      })()}

      <Modal
        open={modal.kind === 'deleteClass'}
        title="Delete class?"
        onClose={closeModal}
        footer={<>
          <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
          <button onClick={() => modal.kind === 'deleteClass' && confirmDeleteClass(modal.cls)} style={modalDangerBtn}>Delete class</button>
        </>}
      >
        <p style={{ margin: 0 }}>
          Delete <strong>{modal.kind === 'deleteClass' ? modal.cls.name : ''}</strong>? Every student in this class will be removed too.
          This can't be undone.
        </p>
        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{modalErr}</p>}
      </Modal>

      <Modal
        open={modal.kind === 'deleteStudent'}
        title="Delete student?"
        onClose={closeModal}
        footer={<>
          <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
          <button onClick={() => modal.kind === 'deleteStudent' && confirmDeleteStudent(modal.student)} style={modalDangerBtn}>Delete student</button>
        </>}
      >
        <p style={{ margin: 0 }}>
          Delete <code>{modal.kind === 'deleteStudent' ? modal.student.username : ''}</code>? This can't be undone.
        </p>
        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{modalErr}</p>}
      </Modal>

      <Modal
        open={modal.kind === 'resetPassword'}
        title="Reset password?"
        onClose={closeModal}
        footer={<>
          <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
          <button onClick={() => modal.kind === 'resetPassword' && confirmResetPassword(modal.student)} style={modalPrimaryBtn}>Reset password</button>
        </>}
      >
        <p style={{ margin: 0 }}>
          Give <code>{modal.kind === 'resetPassword' ? modal.student.username : ''}</code> a brand-new password? They'll be asked to change it the next time they log in.
        </p>
        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{modalErr}</p>}
      </Modal>

      <Modal
        open={modal.kind === 'showPassword'}
        title="New password"
        onClose={closeModal}
        footer={<button onClick={closeModal} style={modalPrimaryBtn}>Done</button>}
      >
        <p style={{ margin: 0 }}>
          New password for <code>{modal.kind === 'showPassword' ? modal.username : ''}</code>:
        </p>
        <div style={{
          padding: 12, fontFamily: 'monospace', fontSize: 18, fontWeight: 700,
          background: 'var(--cw-surface-muted)', border: '1px solid var(--cw-border)', borderRadius: 8, textAlign: 'center',
        }}>{modal.kind === 'showPassword' ? modal.password : ''}</div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--cw-muted)' }}>
          Write this down now — they'll be asked to set their own password the next time they log in.
        </p>
      </Modal>

      <Modal
        open={modal.kind === 'info'}
        title={modal.kind === 'info' ? modal.title : ''}
        onClose={closeModal}
        footer={<button onClick={closeModal} style={modalPrimaryBtn}>OK</button>}
      >
        <p style={{ margin: 0 }}>{modal.kind === 'info' ? modal.message : ''}</p>
      </Modal>
    </Shell>
  );
}

const card: React.CSSProperties = {
  background: 'var(--cw-surface)', border: '1px solid var(--cw-border)', borderRadius: 12, padding: 16,
  boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
};
const primaryBtn: React.CSSProperties = {
  background: 'var(--cw-accent)', color: '#fff', border: 'none',
  padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
  background: 'var(--cw-surface-muted)', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
  padding: '6px 10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13,
};
const dangerBtn: React.CSSProperties = {
  background: '#fee2e2', color: 'var(--cw-danger)', border: '1px solid #fecaca',
  padding: '6px 10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13,
};
const th: React.CSSProperties = { padding: '8px 10px', fontSize: 13, color: 'var(--cw-muted)' };
const td: React.CSSProperties = { padding: '8px 10px' };
