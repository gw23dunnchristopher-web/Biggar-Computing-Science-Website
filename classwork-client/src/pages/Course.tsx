import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import Shell from '@/components/Shell';
import RichTextEditor from '@/components/RichTextEditor';
import Modal, { modalPrimaryBtn, modalSecondaryBtn, modalDangerBtn, modalLabel, modalInput } from '@/components/Modal';
import { api, getCurrentRole } from '@/lib/api';

interface Unit { id: string; title: string; description: string | null; course: string; }
interface Lesson {
  id: string; unit_id: string; title: string; description: string | null;
  learning_intentions?: string | null;
  success_criteria?: string | null;
  is_published: boolean;
}

interface Resource {
  id: string; lesson_id: string;
  kind: 'image' | 'document' | 'youtube' | 'link' | 'embed';
  title: string | null; url: string; order_index: number;
}

const COURSE_LABELS: Record<string, string> = {
  s1: 'S1', s2: 'S2', s3: 'S3', n4: 'National 4', n5: 'National 5', higher: 'Higher',
};

type ModalState =
  | { kind: 'none' }
  | { kind: 'addUnit' }
  | { kind: 'addLesson'; unitId: string }
  | { kind: 'editLesson'; lesson: Lesson }
  | { kind: 'deleteUnit'; unit: Unit }
  | { kind: 'deleteLesson'; lesson: Lesson }
  | { kind: 'lockAll' }
  | { kind: 'notes'; unit: Unit }
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
  const [editLI, setEditLI] = useState('');
  const [editSC, setEditSC] = useState('');
  const [editResources, setEditResources] = useState<Resource[]>([]);
  const [resourceBusy, setResourceBusy] = useState(false);
  const [resourceErr, setResourceErr] = useState<string | null>(null);
  // Inline "add resource" form state inside the Edit lesson modal.
  const [addResKind, setAddResKind] = useState<'youtube' | 'link' | 'embed' | null>(null);
  const [addResUrl, setAddResUrl] = useState('');
  const [addResTitle, setAddResTitle] = useState('');
  const [modalErr, setModalErr] = useState<string | null>(null);
  // Per-unit notes jotter state. Loaded when the notes modal opens, saved
  // explicitly via a button or implicitly on a debounce as the pupil types.
  const [notesContent, setNotesContent] = useState('');
  const [notesSavedAt, setNotesSavedAt] = useState<number | null>(null);
  const [notesStatus, setNotesStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('idle');
  const closeModal = () => setModal({ kind: 'none' });

  // Route between the pupil notes endpoint (per signed-in pupil) and the
  // teacher demo notes endpoint (single shared "teacher:demo" jotter on the
  // server). Both have the same shape so the modal can drive either.
  function notesEndpoint(unit: Unit) {
    return role === 'teacher'
      ? `/api/classwork/units/${unit.id}/teacher-notes`
      : `/api/classwork/units/${unit.id}/notes`;
  }

  function openNotes(unit: Unit) {
    setNotesContent(''); setNotesSavedAt(null);
    setNotesStatus('loading'); setModalErr(null);
    setModal({ kind: 'notes', unit });
    api<{ content: string; updatedAt: number | null }>(notesEndpoint(unit))
      .then((r) => { setNotesContent(r.content || ''); setNotesSavedAt(r.updatedAt); setNotesStatus('idle'); })
      .catch((e: any) => { setNotesStatus('error'); setModalErr(e.message || 'Failed to load notes'); });
  }

  async function saveNotes(unit: Unit, content: string) {
    setNotesStatus('saving'); setModalErr(null);
    try {
      const r = await api<{ content: string; updatedAt: number }>(notesEndpoint(unit), {
        method: 'PUT', body: JSON.stringify({ content }),
      });
      setNotesSavedAt(r.updatedAt);
      setNotesStatus('saved');
    } catch (e: any) {
      setNotesStatus('error');
      setModalErr(e.message || 'Failed to save notes');
    }
  }

  // Debounced auto-save while the pupil types in the notes modal.
  useEffect(() => {
    if (modal.kind !== 'notes') return;
    if (notesStatus === 'loading') return;
    const unit = modal.unit;
    const handle = window.setTimeout(() => { saveNotes(unit, notesContent); }, 1200);
    return () => window.clearTimeout(handle);
  }, [notesContent, modal.kind]);

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
  function openEditLesson(l: Lesson) {
    setEditLI(l.learning_intentions || '');
    setEditSC(l.success_criteria || '');
    setEditResources([]);
    setResourceErr(null);
    setAddResKind(null); setAddResUrl(''); setAddResTitle('');
    setModalErr(null);
    setModal({ kind: 'editLesson', lesson: l });
    // Load this lesson's resources in the background.
    api<Resource[]>(`/api/classwork/lessons/${l.id}/resources`)
      .then(setEditResources)
      .catch((e: any) => setResourceErr(e.message || 'Failed to load resources'));
  }

  async function refreshResources(lessonId: string) {
    try {
      const list = await api<Resource[]>(`/api/classwork/lessons/${lessonId}/resources`);
      setEditResources(list);
    } catch (e: any) { setResourceErr(e.message || 'Failed to load resources'); }
  }

  async function addInlineResource(lessonId: string) {
    const url = addResUrl.trim();
    const title = addResTitle.trim();
    if (!url) { setResourceErr('A URL is required.'); return; }
    if (addResKind === 'youtube' && !/youtu\.?be/i.test(url)) {
      setResourceErr('That doesn\u2019t look like a YouTube URL.');
      return;
    }
    if (addResKind === 'embed' && !/^https:\/\//i.test(url)) {
      setResourceErr('Embeds must be served over https:// so they can load inside the lesson page.');
      return;
    }
    setResourceBusy(true); setResourceErr(null);
    try {
      await api(`/api/classwork/lessons/${lessonId}/resources`, {
        method: 'POST',
        body: JSON.stringify({ kind: addResKind, url, title: title || null }),
      });
      setAddResKind(null); setAddResUrl(''); setAddResTitle('');
      await refreshResources(lessonId);
    } catch (e: any) { setResourceErr(e.message || 'Failed to add resource'); }
    finally { setResourceBusy(false); }
  }

  async function uploadResource(lessonId: string, kind: 'image' | 'document', file: File) {
    setResourceBusy(true); setResourceErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      // Use raw fetch so the browser sets the multipart boundary itself; the
      // shared api() helper forces Content-Type: application/json.
      const teacherToken = (() => { try { return localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken') || ''; } catch { return ''; } })();
      const headers: Record<string, string> = {};
      if (teacherToken) headers['x-teacher-password'] = teacherToken;
      const res = await fetch(`/api/classwork/teacher/upload/resource`, {
        method: 'POST', headers, body: fd,
      });
      if (!res.ok) {
        let msg = `Upload failed (${res.status})`;
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      const up = await res.json() as { url: string; filename: string };
      await api(`/api/classwork/lessons/${lessonId}/resources`, {
        method: 'POST',
        body: JSON.stringify({ kind, url: up.url, title: file.name }),
      });
      await refreshResources(lessonId);
    } catch (e: any) { setResourceErr(e.message || 'Upload failed'); }
    finally { setResourceBusy(false); }
  }

  async function deleteResource(lessonId: string, resourceId: string) {
    setResourceBusy(true); setResourceErr(null);
    try {
      await api(`/api/classwork/resources/${resourceId}`, { method: 'DELETE' });
      await refreshResources(lessonId);
    } catch (e: any) { setResourceErr(e.message || 'Failed to delete'); }
    finally { setResourceBusy(false); }
  }

  async function submitEditLesson(l: Lesson) {
    try {
      await api(`/api/classwork/lessons/${l.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          // Empty textarea → clear the field on the server.
          learningIntentions: editLI.trim() ? editLI : null,
          successCriteria:    editSC.trim() ? editSC : null,
        }),
      });
      closeModal();
      refresh();
    } catch (e: any) { setModalErr(e.message); }
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
        <div style={{ display: 'flex', gap: 8 }}>
          {role === 'student' && (
            <Link href="/jotter" style={{
              display: 'inline-block',
              background: '#f1f5f9', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
              padding: '8px 14px', borderRadius: 8, fontWeight: 600, textDecoration: 'none',
            }} title="Open all your notes for the year in one place">My jotter</Link>
          )}
          {role === 'teacher' && (
            <>
              {/* Teachers get their own demo jotter (course-scoped) so they
                  can model note-taking in lessons without touching any pupil's
                  notes. Stored under a synthetic id on the server. */}
              <Link href={`/jotter?course=${course}`} style={{
                display: 'inline-block',
                background: '#ecfeff', color: '#0e7490', border: '1px solid #67e8f9',
                padding: '8px 14px', borderRadius: 8, fontWeight: 600, textDecoration: 'none',
              }} title="Open your demo jotter for this course — what pupils see when they click their own 'My jotter'">Demo jotter</Link>
              <Link href={`/analytics/${course}`} style={{
                display: 'inline-block',
                background: '#f1f5f9', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
                padding: '8px 14px', borderRadius: 8, fontWeight: 600, textDecoration: 'none',
              }}>Analytics</Link>
              <button onClick={() => { setModalErr(null); setModal({ kind: 'lockAll' }); }} style={dangerBtn} title="Hide every lesson from students at once">Lock all</button>
              <button onClick={openAddUnit} style={primaryBtn}>+ New unit</button>
            </>
          )}
        </div>
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
                <div style={{ display: 'flex', gap: 8 }}>
                  {role === 'student' && (
                    <button
                      onClick={() => openNotes(u)}
                      style={secondaryBtn}
                      title="Open your private notes jotter for this unit"
                    >My notes</button>
                  )}
                  {role === 'teacher' && (
                    <>
                      {/* Same modal as the pupil's "My notes", but reads/writes
                          the shared teacher demo jotter — useful for showing a
                          class how to take notes mid-lesson. */}
                      <button
                        onClick={() => openNotes(u)}
                        style={secondaryBtn}
                        title="Open the demo notes for this unit — what pupils see when they click their own 'My notes'"
                      >Demo notes</button>
                      <button onClick={() => openAddLesson(u.id)} style={secondaryBtn}>+ Lesson</button>
                      <button onClick={() => { setModalErr(null); setModal({ kind: 'deleteUnit', unit: u }); }} style={dangerBtn}>Delete unit</button>
                    </>
                  )}
                </div>
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
                            <button onClick={() => openEditLesson(l)} style={secondaryBtn}
                              title="Edit lesson title, learning intentions and success criteria">
                              Edit
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
        open={modal.kind === 'editLesson'}
        title={modal.kind === 'editLesson' ? `Edit "${modal.lesson.title}"` : ''}
        onClose={closeModal}
        footer={<>
          <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
          <button onClick={() => modal.kind === 'editLesson' && submitEditLesson(modal.lesson)} style={modalPrimaryBtn}>Save lesson</button>
        </>}
      >
        <div>
          <label style={modalLabel}>Learning intentions</label>
          <textarea
            rows={4}
            value={editLI}
            onChange={(e) => setEditLI(e.target.value)}
            placeholder={'One per line, e.g.\nUnderstand what a variable is\nIdentify suitable data types'}
            style={{ ...modalInput, fontFamily: 'inherit', resize: 'vertical' }}
          />
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--cw-muted)' }}>
            One bullet per line. Leave blank to hide.
          </p>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={modalLabel}>Success criteria</label>
          <textarea
            rows={4}
            value={editSC}
            onChange={(e) => setEditSC(e.target.value)}
            placeholder={'One per line, e.g.\nI can declare a variable\nI can choose the right data type for a value'}
            style={{ ...modalInput, fontFamily: 'inherit', resize: 'vertical' }}
          />
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--cw-muted)' }}>
            One bullet per line. Leave blank to hide.
          </p>
        </div>

        {modal.kind === 'editLesson' && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--cw-border)' }}>
            <label style={{ ...modalLabel, marginBottom: 8 }}>Resources for pupils</label>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--cw-muted)' }}>
              Attach images, documents, YouTube videos, web links or live embeds (e.g. a Scratch game, a Blooket / Kahoot link, a code.org puzzle). Pupils see these above the questions on the lesson page.
            </p>

            {editResources.length === 0 ? (
              <p style={{ margin: '4px 0 10px', fontSize: 13, color: 'var(--cw-muted)' }}>No resources yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {editResources.map((r) => (
                  <li key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', border: '1px solid var(--cw-border)', borderRadius: 8, background: '#f8fafc',
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                      background: '#e2e8f0', color: 'var(--cw-ink)', textTransform: 'uppercase',
                    }}>{r.kind}</span>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" style={{
                      flex: 1, color: 'var(--cw-accent)', textDecoration: 'none',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13,
                    }}>{r.title || r.url}</a>
                    <button
                      onClick={() => deleteResource(modal.lesson.id, r.id)}
                      disabled={resourceBusy}
                      style={{ ...modalDangerBtn, padding: '4px 10px', fontSize: 12 }}
                    >Remove</button>
                  </li>
                ))}
              </ul>
            )}

            {addResKind === null ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <label style={{ ...modalSecondaryBtn, cursor: 'pointer' }}>
                  Add image
                  <input
                    type="file" accept="image/*" style={{ display: 'none' }} disabled={resourceBusy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && modal.kind === 'editLesson') uploadResource(modal.lesson.id, 'image', f);
                      e.target.value = '';
                    }}
                  />
                </label>
                <label style={{ ...modalSecondaryBtn, cursor: 'pointer' }}>
                  Add document
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.md"
                    style={{ display: 'none' }}
                    disabled={resourceBusy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && modal.kind === 'editLesson') uploadResource(modal.lesson.id, 'document', f);
                      e.target.value = '';
                    }}
                  />
                </label>
                <button
                  onClick={() => { setAddResKind('youtube'); setAddResUrl(''); setAddResTitle(''); setResourceErr(null); }}
                  style={modalSecondaryBtn}
                >Add YouTube video</button>
                <button
                  onClick={() => { setAddResKind('link'); setAddResUrl(''); setAddResTitle(''); setResourceErr(null); }}
                  style={modalSecondaryBtn}
                >Add web link</button>
                <button
                  onClick={() => { setAddResKind('embed'); setAddResUrl(''); setAddResTitle(''); setResourceErr(null); }}
                  style={modalSecondaryBtn}
                  title="Embed an interactive page (game, simulation, etc.) inside the lesson"
                >Add embed</button>
              </div>
            ) : (
              <div style={{ marginTop: 4, padding: 10, border: '1px solid var(--cw-border)', borderRadius: 8, background: '#fff' }}>
                <label style={modalLabel}>{
                  addResKind === 'youtube' ? 'YouTube URL'
                    : addResKind === 'embed' ? 'Embed URL'
                    : 'Web link URL'
                }</label>
                <input
                  autoFocus value={addResUrl}
                  onChange={(e) => setAddResUrl(e.target.value)}
                  placeholder={
                    addResKind === 'youtube' ? 'https://www.youtube.com/watch?v=...'
                      : addResKind === 'embed' ? 'https://scratch.mit.edu/projects/123456789/embed'
                      : 'https://...'
                  }
                  style={modalInput}
                />
                {addResKind === 'embed' && (
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--cw-muted)' }}>
                    Use the site's "embed" link if it offers one. The page must load over https
                    and must allow being embedded in an iframe — some sites (e.g. Google search,
                    BBC) block this.
                  </p>
                )}
                <label style={{ ...modalLabel, marginTop: 8 }}>Title shown to pupils (optional)</label>
                <input
                  value={addResTitle}
                  onChange={(e) => setAddResTitle(e.target.value)}
                  placeholder="e.g. Intro video"
                  style={modalInput}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button
                    onClick={() => modal.kind === 'editLesson' && addInlineResource(modal.lesson.id)}
                    disabled={resourceBusy} style={modalPrimaryBtn}
                  >Add</button>
                  <button onClick={() => { setAddResKind(null); setResourceErr(null); }} style={modalSecondaryBtn}>Cancel</button>
                </div>
              </div>
            )}

            {resourceErr && <p style={{ color: 'var(--cw-danger)', margin: '8px 0 0', fontSize: 13 }}>{resourceErr}</p>}
          </div>
        )}

        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: '8px 0 0' }}>{modalErr}</p>}
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
        open={modal.kind === 'notes'}
        title={modal.kind === 'notes'
          ? `${role === 'teacher' ? 'Demo notes' : 'Notes'} for: ${modal.unit.title}`
          : ''}
        width={1100}
        fillHeight
        onClose={closeModal}
        footer={<>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--cw-muted)' }}>
            {notesStatus === 'saving' ? 'Saving…'
              : notesStatus === 'saved' && notesSavedAt ? `Saved at ${new Date(notesSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : notesStatus === 'error' ? 'Couldn\u2019t save'
              : notesSavedAt ? `Last saved ${new Date(notesSavedAt).toLocaleString()}`
              : 'Not saved yet'}
          </span>
          <button
            onClick={() => modal.kind === 'notes' && saveNotes(modal.unit, notesContent)}
            disabled={notesStatus === 'loading' || notesStatus === 'saving'}
            style={modalSecondaryBtn}
          >Save now</button>
          <button onClick={closeModal} style={modalPrimaryBtn}>Done</button>
        </>}
      >
        {notesStatus === 'loading' ? (
          <p style={{ margin: 0, color: 'var(--cw-muted)' }}>Loading your notes…</p>
        ) : (
          <>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--cw-muted)' }}>
              Your notes for this unit. Use the toolbar to add headings, bold, lists and links.
              Your notes save automatically as you type. Your teacher can see your compiled jotter.
            </p>
            <RichTextEditor
              autoFocus
              value={notesContent}
              onChange={setNotesContent}
              placeholder={'Jot anything you want to remember about this unit\u2014 definitions, examples, questions to ask your teacher, exam tips, etc.'}
              fillHeight
              minHeight={360}
              ariaLabel="Unit notes"
            />
          </>
        )}
        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: '8px 0 0' }}>{modalErr}</p>}
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
