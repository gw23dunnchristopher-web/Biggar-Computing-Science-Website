import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import Shell from '@/components/Shell';
import Modal, { modalPrimaryBtn, modalSecondaryBtn, modalDangerBtn, modalLabel, modalInput } from '@/components/Modal';
import { api, getCurrentRole } from '@/lib/api';

interface Unit { id: string; title: string; description: string | null; course: string; }
interface Lesson { id: string; unit_id: string; title: string; description: string | null; is_published: boolean; }

const COURSE_LABELS: Record<string, string> = {
  s1: 'S1', s2: 'S2', s3: 'S3', n4: 'National 4', n5: 'National 5', higher: 'Higher',
};

type ModalState =
  | { kind: 'none' }
  | { kind: 'addUnit' }
  | { kind: 'addLesson'; unitId: string }
  | { kind: 'deleteUnit'; unit: Unit }
  | { kind: 'deleteLesson'; lesson: Lesson }
  | { kind: 'lockAll' }
  | { kind: 'info'; title: string; message: string };

export default function Course() {
  const [, params] = useRoute('/course/:course');
  const course = params?.course || '';
  const role = getCurrentRole();
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessonsByUnit, setLessonsByUnit] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalState>({ kind: 'none' });
  const [titleInput, setTitleInput] = useState('');
  const [modalErr, setModalErr] = useState<string | null>(null);
  const closeModal = () => setModal({ kind: 'none' });

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

  function openAddUnit() {
    setTitleInput(''); setModalErr(null);
    setModal({ kind: 'addUnit' });
  }
  function openAddLesson(unitId: string) {
    setTitleInput(''); setModalErr(null);
    setModal({ kind: 'addLesson', unitId });
  }

  async function submitAddUnit() {
    const title = titleInput.trim();
    if (!title) { setModalErr('Title is required.'); return; }
    try {
      await api(`/api/classwork/${course}/units`, {
        method: 'POST', body: JSON.stringify({ title, orderIndex: units.length }),
      });
      closeModal();
      refresh();
    } catch (e: any) { setModalErr(e.message); }
  }

  async function submitAddLesson(unitId: string) {
    const title = titleInput.trim();
    if (!title) { setModalErr('Title is required.'); return; }
    try {
      await api(`/api/classwork/units/${unitId}/lessons`, {
        method: 'POST', body: JSON.stringify({ title, orderIndex: (lessonsByUnit[unitId] || []).length }),
      });
      closeModal();
      refresh();
    } catch (e: any) { setModalErr(e.message); }
  }

  async function togglePublish(lesson: Lesson) {
    try {
      await api(`/api/classwork/lessons/${lesson.id}`, {
        method: 'PATCH', body: JSON.stringify({ isPublished: !lesson.is_published }),
      });
      refresh();
    } catch (e: any) {
      setModal({ kind: 'info', title: 'Could not update lesson', message: e.message });
    }
  }

  async function confirmDeleteLesson(lesson: Lesson) {
    try {
      await api(`/api/classwork/lessons/${lesson.id}`, { method: 'DELETE' });
      closeModal();
      refresh();
    } catch (e: any) { setModalErr(e.message); }
  }

  async function confirmDeleteUnit(unit: Unit) {
    try {
      await api(`/api/classwork/units/${unit.id}`, { method: 'DELETE' });
      closeModal();
      refresh();
    } catch (e: any) { setModalErr(e.message); }
  }

  async function confirmLockAll() {
    try {
      const r = await api<{ locked: number }>(`/api/classwork/${course}/lock-all-lessons`, { method: 'POST' });
      closeModal();
      setModal({ kind: 'info', title: 'All lessons locked', message: `Locked ${r.locked} lesson${r.locked === 1 ? '' : 's'}. Use the Publish button on any lesson to release it to students.` });
      refresh();
    } catch (e: any) { setModalErr(e.message); }
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
            <button onClick={() => { setModalErr(null); setModal({ kind: 'lockAll' }); }} style={dangerBtn} title="Hide every lesson from students at once">Lock all</button>
            <button onClick={openAddUnit} style={primaryBtn}>+ New unit</button>
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
                    <button onClick={() => openAddLesson(u.id)} style={secondaryBtn}>+ Lesson</button>
                    <button onClick={() => { setModalErr(null); setModal({ kind: 'deleteUnit', unit: u }); }} style={dangerBtn}>Delete unit</button>
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
                            <button onClick={() => { setModalErr(null); setModal({ kind: 'deleteLesson', lesson: l }); }} style={dangerBtn}>Delete</button>
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

      {/* ---------- Modals ---------- */}

      <Modal
        open={modal.kind === 'addUnit'}
        title="New unit"
        onClose={closeModal}
        footer={<>
          <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
          <button onClick={submitAddUnit} style={modalPrimaryBtn}>Create unit</button>
        </>}
      >
        <div>
          <label style={modalLabel}>Unit title</label>
          <input
            autoFocus value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitAddUnit(); }}
            placeholder="e.g. Programming basics"
            style={modalInput}
          />
        </div>
        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{modalErr}</p>}
      </Modal>

      <Modal
        open={modal.kind === 'addLesson'}
        title="New lesson"
        onClose={closeModal}
        footer={<>
          <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
          <button onClick={() => modal.kind === 'addLesson' && submitAddLesson(modal.unitId)} style={modalPrimaryBtn}>Create lesson</button>
        </>}
      >
        <div>
          <label style={modalLabel}>Lesson title</label>
          <input
            autoFocus value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && modal.kind === 'addLesson') submitAddLesson(modal.unitId); }}
            placeholder="e.g. Variables and data types"
            style={modalInput}
          />
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--cw-muted)' }}>
          New lessons start <strong>Locked</strong>. Use the Publish button when you're ready for pupils to see it.
        </p>
        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{modalErr}</p>}
      </Modal>

      <Modal
        open={modal.kind === 'deleteUnit'}
        title="Delete unit?"
        onClose={closeModal}
        footer={<>
          <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
          <button onClick={() => modal.kind === 'deleteUnit' && confirmDeleteUnit(modal.unit)} style={modalDangerBtn}>Delete unit</button>
        </>}
      >
        <p style={{ margin: 0 }}>
          Delete <strong>{modal.kind === 'deleteUnit' ? modal.unit.title : ''}</strong> and every lesson inside it? This can't be undone.
        </p>
        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{modalErr}</p>}
      </Modal>

      <Modal
        open={modal.kind === 'deleteLesson'}
        title="Delete lesson?"
        onClose={closeModal}
        footer={<>
          <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
          <button onClick={() => modal.kind === 'deleteLesson' && confirmDeleteLesson(modal.lesson)} style={modalDangerBtn}>Delete lesson</button>
        </>}
      >
        <p style={{ margin: 0 }}>
          Delete <strong>{modal.kind === 'deleteLesson' ? modal.lesson.title : ''}</strong>? Its questions and pupil submissions will be removed too.
        </p>
        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{modalErr}</p>}
      </Modal>

      <Modal
        open={modal.kind === 'lockAll'}
        title="Lock every lesson?"
        onClose={closeModal}
        footer={<>
          <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
          <button onClick={confirmLockAll} style={modalDangerBtn}>Lock all lessons</button>
        </>}
      >
        <p style={{ margin: 0 }}>
          Hide every lesson in <strong>{COURSE_LABELS[course] || course}</strong> from pupils. You can then click <strong>Publish</strong> on individual lessons to release them as the year goes on.
        </p>
        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{modalErr}</p>}
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
