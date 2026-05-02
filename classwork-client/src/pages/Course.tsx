import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import Shell from '@/components/Shell';
import RichTextEditor from '@/components/RichTextEditor';
import Modal, { modalPrimaryBtn, modalSecondaryBtn, modalDangerBtn, modalLabel, modalInput } from '@/components/Modal';
import PresentationViewer from '@/components/PresentationViewer';
import { api, getCurrentRole } from '@/lib/api';

interface Unit {
  id: string;
  title: string;
  description: string | null;
  course: string;
  // Optional small thumbnail rendered to the left of the unit title in
  // the course view. Set by teachers via the New/Edit unit modal — they
  // can either paste an existing URL or upload a fresh image which the
  // server stores under /uploads.
  image_url: string | null;
  // Per-unit PowerPoint presentation. `presentation_url` points at the
  // original .pptx (download for teachers); `presentation_pages_url`
  // points at the rendered slide manifest used by the viewer. Both are
  // null until a teacher uploads a deck.
  presentation_url?: string | null;
  presentation_pages_url?: string | null;
  presentation_filename?: string | null;
  presentation_uploaded_at?: string | null;
  // OneDrive / SharePoint embed URL. When set, the unit shows a second
  // "View slides" button that opens the presentation in a full-screen iframe
  // rather than the local PDF viewer. Updates in OneDrive are reflected
  // automatically since the iframe always loads the live embed.
  onedrive_embed_url?: string | null;
  // Server-resolved form of onedrive_embed_url. The raw URL is often a
  // /:p:/g/personal/… sharing link whose query params (wdStartOn etc.) are
  // discarded in a server-side redirect. The server follows that redirect once
  // at save-time and stores the final /_layouts/15/doc2.aspx?sourcedoc=…
  // URL here. buildOdSrc uses this for slide navigation when it's present.
  od_resolved_url?: string | null;
  // Manually-defined section markers for the OneDrive viewer. Each entry has
  // a display name and the 1-based slide number where the section starts.
  // Stored as JSONB on the unit row so they are always independent of any
  // uploaded PPTX file and stay accurate even when the OneDrive copy changes.
  od_sections?: { name: string; startSlide: number }[] | null;
}
interface Lesson {
  id: string; unit_id: string; title: string; description: string | null;
  learning_intentions?: string | null;
  success_criteria?: string | null;
  is_published: boolean;
  is_test?: boolean;
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
  | { kind: 'editUnit'; unit: Unit }
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
  // Drag-and-drop reorder state for lessons (teacher only). We track which
  // lesson is being dragged + which one we're hovering over so we can show
  // a clear "this is where it'll land" indicator and persist the new order
  // when the drop happens. `dragOverPos` tells us whether the indicator
  // sits above (`'before'`) or below (`'after'`) the hovered lesson row.
  const [dragLessonId, setDragLessonId] = useState<string | null>(null);
  const [dragOverLessonId, setDragOverLessonId] = useState<string | null>(null);
  const [dragOverPos, setDragOverPos] = useState<'before' | 'after'>('before');
  const [titleInput, setTitleInput] = useState('');
  // Shared by both the New unit and Edit unit modals — these capture the
  // optional description and thumbnail image that decorate each unit
  // header on the course page. `unitImageUploading` drives the disabled
  // state on the upload button while a file is in flight.
  const [unitDescInput, setUnitDescInput] = useState('');
  const [unitImageUrl, setUnitImageUrl] = useState('');
  const [unitImageUploading, setUnitImageUploading] = useState(false);
  const [editLessonTitle, setEditLessonTitle] = useState('');
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

  // Per-unit presentation viewer + upload state. `presViewerUnit` is set
  // when the slide modal is open. `presBusy` is keyed by unit id so the
  // page can show a per-unit "Uploading…" state without locking up other
  // units (a teacher might queue uploads on multiple units in different
  // tabs). `presErr` likewise stores per-unit error messages for inline
  // display under the upload button.
  const [presViewerUnit, setPresViewerUnit] = useState<Unit | null>(null);
  const [presBusy, setPresBusy] = useState<Record<string, boolean>>({});
  const [presErr, setPresErr] = useState<Record<string, string>>({});
  // OneDrive embed state — keyed by unit id.
  const [odInput, setOdInput] = useState<Record<string, string>>({}); // pending text field value
  const [odBusy, setOdBusy] = useState<Record<string, boolean>>({});
  const [odErr, setOdErr] = useState<Record<string, string>>({});
  const [odViewerUnit, setOdViewerUnit] = useState<Unit | null>(null); // open iframe modal
  // Section editor state (teacher only, per-unit).
  const [odSecOpen, setOdSecOpen] = useState<Record<string, boolean>>({});
  const [odSecDraft, setOdSecDraft] = useState<Record<string, { name: string; startSlide: string }[]>>({});
  const [odSecBusy, setOdSecBusy] = useState<Record<string, boolean>>({});

  // Per-unit collapse state. Stored client-side only and persisted in
  // localStorage scoped per course so each user's chosen layout (e.g.
  // collapse all but the unit they're currently teaching) survives refreshes
  // and navigations within the SPA. Defaults to "everything expanded" so
  // the page looks the same on first visit as it always did.
  const collapseStorageKey = course ? `cw-course-collapsed:${course}` : null;
  const [collapsedUnits, setCollapsedUnits] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!collapseStorageKey) { setCollapsedUnits(new Set()); return; }
    try {
      const raw = localStorage.getItem(collapseStorageKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          setCollapsedUnits(new Set(arr.filter((x): x is string => typeof x === 'string')));
          return;
        }
      }
    } catch { /* ignore corrupt storage */ }
    setCollapsedUnits(new Set());
  }, [collapseStorageKey]);
  function toggleUnitCollapsed(unitId: string) {
    setCollapsedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId); else next.add(unitId);
      try {
        if (collapseStorageKey) localStorage.setItem(collapseStorageKey, JSON.stringify([...next]));
      } catch { /* localStorage may be full or disabled */ }
      return next;
    });
  }
  function setAllUnitsCollapsed(collapsed: boolean) {
    const next: Set<string> = collapsed ? new Set(units.map((u) => u.id)) : new Set();
    setCollapsedUnits(next);
    try {
      if (collapseStorageKey) localStorage.setItem(collapseStorageKey, JSON.stringify([...next]));
    } catch { /* ignore */ }
  }

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
    setTitleInput(''); setUnitDescInput(''); setUnitImageUrl('');
    setModalErr(null);
    setModal({ kind: 'addUnit' });
  }
  function openEditUnit(unit: Unit) {
    setTitleInput(unit.title);
    setUnitDescInput(unit.description || '');
    setUnitImageUrl(unit.image_url || '');
    setModalErr(null);
    setModal({ kind: 'editUnit', unit });
  }

  // Compress an image file client-side before uploading. Resizes to ≤ maxPx on
  // the longest side and re-encodes as JPEG. Falls back to the original file
  // if the Canvas API isn't available (e.g. in jsdom tests).
  function compressImage(file: File, maxPx = 800, quality = 0.85): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new Image();
      const blobUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(blobUrl);
        const scale = Math.min(1, maxPx / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
        const w = Math.round((img.naturalWidth || 1) * scale);
        const h = Math.round((img.naturalHeight || 1) * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(file); };
      img.src = blobUrl;
    });
  }

  // unit's `image_url`. Surfaces failures via `modalErr` so the
  // currently-open New/Edit unit modal shows the message inline.
  async function uploadUnitImage(file: File) {
    setModalErr(null);
    if (!file.type.startsWith('image/')) {
      setModalErr('Please choose an image file (PNG, JPG, GIF, …).');
      return;
    }
    // Show a local blob preview instantly so the teacher sees the image
    // straight away instead of staring at a spinner during the network round-trip.
    const localPreview = URL.createObjectURL(file);
    setUnitImageUrl(localPreview);
    setUnitImageUploading(true);
    try {
      // Compress to ≤ 800 px on the longest side — more than enough for a
      // course thumbnail and typically 10-20× smaller than a raw phone photo.
      const blob = await compressImage(file, 800, 0.85);
      const safeName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      const fd = new FormData();
      fd.append('file', blob, safeName);
      const teacherToken = (() => {
        try { return localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken') || ''; }
        catch { return ''; }
      })();
      const headers: Record<string, string> = {};
      if (teacherToken) headers['x-teacher-password'] = teacherToken;
      const res = await fetch('/api/classwork/teacher/upload/resource', {
        method: 'POST', headers, body: fd,
      });
      if (!res.ok) {
        let msg = `Upload failed (${res.status})`;
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      const up = await res.json() as { url: string; filename: string };
      URL.revokeObjectURL(localPreview);
      setUnitImageUrl(up.url);
    } catch (e: any) {
      URL.revokeObjectURL(localPreview);
      setUnitImageUrl('');
      setModalErr(e.message || 'Upload failed');
    } finally {
      setUnitImageUploading(false);
    }
  }
  // Read the teacher token (used for x-teacher-password on direct fetch
  // calls that don't go through the `api()` helper). Same lookup as
  // uploadUnitImage above.
  function teacherTokenHeader(): Record<string, string> {
    try {
      const t = localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken') || '';
      return t ? { 'x-teacher-password': t } : {};
    } catch { return {}; }
  }

  // Teacher: upload (or replace) a unit's PowerPoint deck. The server does
  // the heavy work — convert .pptx → per-slide PNGs via LibreOffice, parse
  // section markers, build a manifest JSON, persist everything in object
  // storage and write the URLs back to the unit row. We then patch the
  // unit in local state so the "View presentation" button appears
  // immediately without a full refresh.
  async function uploadPresentation(unitId: string, file: File) {
    if (!/\.pptx$/i.test(file.name)) {
      setPresErr((e) => ({ ...e, [unitId]: 'Please choose a PowerPoint file ending in .pptx.' }));
      return;
    }
    setPresBusy((b) => ({ ...b, [unitId]: true }));
    setPresErr((e) => { const n = { ...e }; delete n[unitId]; return n; });
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/classwork/units/${unitId}/presentation`, {
        method: 'POST',
        headers: teacherTokenHeader(),
        body: fd,
      });
      if (!res.ok) {
        let msg = `Upload failed (${res.status})`;
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      const data = await res.json() as { unit: Unit };
      setUnits((us) => us.map((u) => (u.id === unitId ? { ...u, ...data.unit } : u)));
    } catch (e: any) {
      setPresErr((er) => ({ ...er, [unitId]: e?.message || 'Upload failed' }));
    } finally {
      setPresBusy((b) => { const n = { ...b }; delete n[unitId]; return n; });
    }
  }

  async function removePresentation(unitId: string) {
    if (!window.confirm('Remove the presentation from this unit? Pupils will no longer see the View presentation button.')) return;
    setPresBusy((b) => ({ ...b, [unitId]: true }));
    setPresErr((e) => { const n = { ...e }; delete n[unitId]; return n; });
    try {
      const res = await fetch(`/api/classwork/units/${unitId}/presentation`, {
        method: 'DELETE',
        headers: teacherTokenHeader(),
      });
      if (!res.ok) {
        let msg = `Remove failed (${res.status})`;
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      const data = await res.json() as { unit: Unit };
      setUnits((us) => us.map((u) => (u.id === unitId ? { ...u, ...data.unit } : u)));
    } catch (e: any) {
      setPresErr((er) => ({ ...er, [unitId]: e?.message || 'Remove failed' }));
    } finally {
      setPresBusy((b) => { const n = { ...b }; delete n[unitId]; return n; });
    }
  }

  // Best-effort conversion of a OneDrive/SharePoint share URL to an embed URL.
  // If the URL is already an embed URL (contains "action=embedview" or is the
  // onedrive.live.com/embed path) it is returned unchanged.
  function toOnedriveEmbedUrl(raw: string): string {
    try {
      const u = new URL(raw.trim());
      const host = u.hostname.toLowerCase();
      // SharePoint / OneDrive for Business
      if (host.endsWith('sharepoint.com')) {
        if (u.searchParams.get('action') !== 'embedview') {
          u.searchParams.set('action', 'embedview');
        }
        return u.toString();
      }
      // Personal OneDrive — convert view.aspx to embed path
      if (host === 'onedrive.live.com') {
        if (u.pathname.toLowerCase().includes('view.aspx') || u.pathname === '/') {
          u.pathname = '/embed';
          if (!u.searchParams.has('action')) u.searchParams.set('action', 'embedview');
          return u.toString();
        }
      }
      return raw.trim();
    } catch {
      return raw.trim();
    }
  }

  // Build the final iframe src for a given 1-based slide number.
  //
  // Prefers `resolvedUrl` (the server-resolved /_layouts/15/doc2.aspx?sourcedoc=…
  // URL) because that form passes wdStartOn directly to the Office Online viewer
  // without any redirect that would strip query params.  Falls back to `raw`
  // (the teacher-pasted sharing link) with action=embedview when no resolved
  // URL is available — slide navigation won't work in that case but the viewer
  // itself still loads fine.
  function buildOdSrc(raw: string, resolvedUrl?: string | null): string {
    // SharePoint's embed renderer ignores wdStartOn / wdSlideIndex when loaded
    // inside a third-party iframe (its inline initialiser is blocked by
    // SharePoint's own page CSP). We can't auto-jump to a slide; the viewer
    // always opens at slide 1 and pupils navigate manually using the section
    // reference list shown above the iframe.
    return resolvedUrl ? resolvedUrl : toOnedriveEmbedUrl(raw);
  }

  async function saveOnedriveUrl(unitId: string) {
    const url = (odInput[unitId] || '').trim();
    if (!url.startsWith('http')) {
      setOdErr((e) => ({ ...e, [unitId]: 'Please enter a valid URL starting with https://' }));
      return;
    }
    setOdBusy((b) => ({ ...b, [unitId]: true }));
    setOdErr((e) => { const n = { ...e }; delete n[unitId]; return n; });
    try {
      const res = await fetch(`/api/classwork/units/${unitId}/onedrive-url`, {
        method: 'PUT',
        headers: { ...teacherTokenHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        let msg = `Failed (${res.status})`;
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      const data = await res.json() as { unit: Unit };
      setUnits((us) => us.map((u) => (u.id === unitId ? { ...u, ...data.unit } : u)));
      setOdInput((inp) => { const n = { ...inp }; delete n[unitId]; return n; });
    } catch (e: any) {
      setOdErr((er) => ({ ...er, [unitId]: e?.message || 'Save failed' }));
    } finally {
      setOdBusy((b) => { const n = { ...b }; delete n[unitId]; return n; });
    }
  }

  async function removeOnedriveUrl(unitId: string) {
    if (!window.confirm('Remove the OneDrive link from this unit? Pupils will no longer see the "View slides" button.')) return;
    setOdBusy((b) => ({ ...b, [unitId]: true }));
    setOdErr((e) => { const n = { ...e }; delete n[unitId]; return n; });
    try {
      const res = await fetch(`/api/classwork/units/${unitId}/onedrive-url`, {
        method: 'DELETE',
        headers: teacherTokenHeader(),
      });
      if (!res.ok) {
        let msg = `Failed (${res.status})`;
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      const data = await res.json() as { unit: Unit };
      setUnits((us) => us.map((u) => (u.id === unitId ? { ...u, ...data.unit } : u)));
    } catch (e: any) {
      setOdErr((er) => ({ ...er, [unitId]: e?.message || 'Remove failed' }));
    } finally {
      setOdBusy((b) => { const n = { ...b }; delete n[unitId]; return n; });
    }
  }

  // ── Section editor helpers (teacher only) ─────────────────────────────────

  function openSectionEditor(u: Unit) {
    const existing = (u.od_sections || []).map((s) => ({
      name: s.name,
      startSlide: String(s.startSlide),
    }));
    setOdSecDraft((d) => ({ ...d, [u.id]: existing }));
    setOdSecOpen((o) => ({ ...o, [u.id]: true }));
  }

  function closeSectionEditor(unitId: string) {
    setOdSecOpen((o) => ({ ...o, [unitId]: false }));
  }

  function addSectionRow(unitId: string) {
    setOdSecDraft((d) => ({ ...d, [unitId]: [...(d[unitId] || []), { name: '', startSlide: '' }] }));
  }

  function updateSectionRow(unitId: string, idx: number, field: 'name' | 'startSlide', value: string) {
    setOdSecDraft((d) => {
      const rows = [...(d[unitId] || [])];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...d, [unitId]: rows };
    });
  }

  function removeSectionRow(unitId: string, idx: number) {
    setOdSecDraft((d) => {
      const rows = [...(d[unitId] || [])];
      rows.splice(idx, 1);
      return { ...d, [unitId]: rows };
    });
  }

  async function saveSections(unitId: string) {
    const rows = odSecDraft[unitId] || [];
    const sections = rows
      .filter((r) => r.name.trim() && Number.isFinite(parseInt(r.startSlide, 10)))
      .map((r) => ({ name: r.name.trim(), startSlide: parseInt(r.startSlide, 10) }));
    setOdSecBusy((b) => ({ ...b, [unitId]: true }));
    try {
      const res = await fetch(`/api/classwork/units/${unitId}/od-sections`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...teacherTokenHeader() },
        body: JSON.stringify({ sections }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const data = await res.json() as { unit: Unit };
      setUnits((us) => us.map((u) => (u.id === unitId ? { ...u, ...data.unit } : u)));
      // Also update the viewer unit so the dropdown reflects immediately if
      // the teacher saves while the modal is open on this unit.
      setOdViewerUnit((prev) => prev?.id === unitId ? { ...prev, ...data.unit } : prev);
      closeSectionEditor(unitId);
    } catch (e: any) {
      alert(e?.message || 'Could not save sections');
    } finally {
      setOdSecBusy((b) => { const n = { ...b }; delete n[unitId]; return n; });
    }
  }

  function openAddLesson(unitId: string) {
    setTitleInput(''); setModalErr(null);
    setModal({ kind: 'addLesson', unitId });
  }
  function openEditLesson(l: Lesson) {
    setEditLessonTitle(l.title || '');
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
    if (!editLessonTitle.trim()) { setModalErr('Lesson name is required.'); return; }
    try {
      await api(`/api/classwork/lessons/${l.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editLessonTitle.trim(),
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
        method: 'POST',
        body: JSON.stringify({
          title,
          description: unitDescInput.trim() || null,
          imageUrl: unitImageUrl.trim() || null,
          orderIndex: units.length,
        }),
      });
      closeModal();
      refresh();
    } catch (e: any) { setModalErr(e.message); }
  }

  async function submitEditUnit(unit: Unit) {
    const title = titleInput.trim();
    if (!title) { setModalErr('Title is required.'); return; }
    try {
      await api(`/api/classwork/units/${unit.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          description: unitDescInput.trim() || null,
          // Pass `null` to clear, a URL to set. The server's updateUnit
          // whitelists this field.
          imageUrl: unitImageUrl.trim() || null,
        }),
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

  // Persist a new order for a unit's lessons. We update local state first so
  // the list visibly snaps into place, then PATCH every lesson whose
  // orderIndex actually changed (parallel for snappiness). If the server
  // call fails we re-fetch from scratch so the screen matches reality.
  async function persistLessonOrder(unitId: string, reordered: Lesson[]) {
    const previous = lessonsByUnit[unitId] || [];
    setLessonsByUnit((prev) => ({ ...prev, [unitId]: reordered }));
    try {
      const before = new Map(previous.map((l, i) => [l.id, i]));
      await Promise.all(
        reordered.map((l, i) =>
          before.get(l.id) === i
            ? Promise.resolve()
            : api(`/api/classwork/lessons/${l.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ orderIndex: i }),
              })
        )
      );
    } catch (e: any) {
      // Roll back the optimistic order and surface the failure.
      setLessonsByUnit((prev) => ({ ...prev, [unitId]: previous }));
      setModal({ kind: 'info', title: 'Could not save new order', message: e.message || 'Reorder failed' });
    }
  }

  // Drop handler: move dragLessonId to the position of overLessonId (above
  // or below, based on `dragOverPos`) within the same unit. Cross-unit
  // drags are intentionally ignored — units are independent.
  function handleLessonDrop(unitId: string, overLessonId: string) {
    const dragId = dragLessonId;
    setDragLessonId(null);
    setDragOverLessonId(null);
    if (!dragId || dragId === overLessonId) return;
    const lessons = lessonsByUnit[unitId] || [];
    const fromIdx = lessons.findIndex((l) => l.id === dragId);
    const overIdx = lessons.findIndex((l) => l.id === overLessonId);
    if (fromIdx < 0 || overIdx < 0) return;
    const next = lessons.slice();
    const [moved] = next.splice(fromIdx, 1);
    let target = lessons.findIndex((l) => l.id === overLessonId);
    if (fromIdx < target) target -= 1;
    const insertAt = dragOverPos === 'after' ? target + 1 : target;
    next.splice(insertAt, 0, moved);
    if (next.every((l, i) => l.id === lessons[i].id)) return;
    persistLessonOrder(unitId, next);
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

  async function toggleTest(lesson: Lesson) {
    try {
      await api(`/api/classwork/lessons/${lesson.id}`, {
        method: 'PATCH', body: JSON.stringify({ isTest: !lesson.is_test }),
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
              background: 'var(--cw-surface-muted)', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
              padding: '8px 14px', borderRadius: 8, fontWeight: 600, textDecoration: 'none',
            }} title="Open all your notes for the year in one place">My jotter</Link>
          )}
          {role === 'teacher' && (
            <>
              {/* Teachers get their own course-scoped jotter so they can
                  model note-taking in lessons without touching any pupil's
                  notes. Stored under a synthetic id on the server. The
                  label matches the pupil's button so the teacher experience
                  is symmetric — for them, this *is* "My jotter". */}
              <Link href={`/jotter?course=${course}`} style={{
                display: 'inline-block',
                background: '#ecfeff', color: '#0e7490', border: '1px solid #67e8f9',
                padding: '8px 14px', borderRadius: 8, fontWeight: 600, textDecoration: 'none',
              }} title="Open your own jotter for this course — the same notes view your pupils get when they click 'My jotter'">My jotter</Link>
              <Link href={`/analytics/${course}`} style={{
                display: 'inline-block',
                background: 'var(--cw-surface-muted)', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
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

      {/* Expand-all / Collapse-all convenience controls. Only shown once
          there's more than one unit — for a single-unit course the per-unit
          chevron is enough and these would just be noise. */}
      {units.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, margin: '4px 0 8px' }}>
          <button
            type="button"
            onClick={() => setAllUnitsCollapsed(false)}
            disabled={collapsedUnits.size === 0}
            style={{ ...secondaryBtn, padding: '4px 10px', fontSize: 13 }}
            title="Show every unit's lessons"
          >Expand all</button>
          <button
            type="button"
            onClick={() => setAllUnitsCollapsed(true)}
            disabled={collapsedUnits.size === units.length}
            style={{ ...secondaryBtn, padding: '4px 10px', fontSize: 13 }}
            title="Hide every unit's lessons"
          >Collapse all</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {units.map((u) => {
          const lessons = lessonsByUnit[u.id] || [];
          const collapsed = collapsedUnits.has(u.id);
          const bodyId = `cw-unit-body-${u.id}`;
          return (
            <div key={u.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                {/* Collapse/expand toggle. Keyboard-accessible button on the
                    far left handles a11y; clicking the title block also
                    toggles for sighted mouse users (purely a UX nicety,
                    the button is the canonical interactive control). */}
                <button
                  type="button"
                  onClick={() => toggleUnitCollapsed(u.id)}
                  aria-expanded={!collapsed}
                  aria-controls={bodyId}
                  aria-label={collapsed ? `Expand ${u.title}` : `Collapse ${u.title}`}
                  title={collapsed ? 'Expand unit to show its lessons' : 'Collapse unit to hide its lessons'}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, flexShrink: 0,
                    background: 'transparent', border: '1px solid var(--cw-border)', borderRadius: 6,
                    color: 'var(--cw-muted)', cursor: 'pointer', padding: 0,
                  }}
                >
                  <span aria-hidden="true" style={{
                    display: 'inline-block', fontSize: 14, lineHeight: 1,
                    transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 120ms ease',
                  }}>▾</span>
                </button>
                {/* Title + thumbnail. The image sits flush to the left of
                    the heading so the unit list reads like a card grid even
                    on a single column. If a unit has no image_url we render
                    a soft placeholder square (initial letter) so every row
                    keeps the same alignment and rhythm. */}
                <div
                  onClick={() => toggleUnitCollapsed(u.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1, cursor: 'pointer' }}
                >
                  <UnitThumb url={u.image_url} title={u.title} />
                  <h2 style={{ margin: 0, fontSize: 20, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.title}</h2>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
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
                      <button
                        onClick={() => openEditUnit(u)}
                        style={secondaryBtn}
                        title="Change the unit title, description or image"
                      >Edit unit</button>
                      <button onClick={() => { setModalErr(null); setModal({ kind: 'deleteUnit', unit: u }); }} style={dangerBtn}>Delete unit</button>
                    </>
                  )}
                </div>
              </div>
              {/* Collapsible body — wrapped in a div so we can hide it via
                  the `hidden` attribute (preserves DOM/state, doesn't unmount
                  the lessons list) and link it to the toggle via aria-controls. */}
              <div id={bodyId} hidden={collapsed}>
              {u.description && <p style={{ color: 'var(--cw-muted)', marginTop: 6 }}>{u.description}</p>}

              {/* Per-unit PowerPoint strip. Pupils only see this band when
                  a deck has actually been uploaded — otherwise the strip is
                  hidden so empty-state placeholders don't clutter their
                  course page. Teachers always see the band so they can
                  upload, replace or remove a deck. */}
              {(u.presentation_url || u.onedrive_embed_url || role === 'teacher') && (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 8,
                  marginTop: 12, padding: '10px 12px',
                  border: '1px solid var(--cw-border)', borderRadius: 8,
                  background: 'var(--cw-surface-soft)',
                }}>
                  {/* ── Row 1: PPTX upload / viewer ── */}
                  {(u.presentation_url || role === 'teacher') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>📊</span>
                      {u.presentation_url ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setPresViewerUnit(u)}
                            style={primaryBtn}
                            title="Open the slides in a viewer"
                          >View slides (PDF)</button>
                          <span style={{ color: 'var(--cw-muted)', fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {u.presentation_filename || 'Slides'}
                          </span>
                          {role === 'teacher' && (
                            <>
                              <a
                                href={u.presentation_url}
                                download={u.presentation_filename || true}
                                style={{ ...secondaryBtn, textDecoration: 'none' }}
                                title="Download the original .pptx"
                              >Download</a>
                              <label style={{ ...secondaryBtn, cursor: presBusy[u.id] ? 'wait' : 'pointer', opacity: presBusy[u.id] ? 0.6 : 1 }}>
                                {presBusy[u.id] ? 'Uploading…' : 'Replace'}
                                <input
                                  type="file"
                                  accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                                  hidden
                                  disabled={!!presBusy[u.id]}
                                  onChange={(e) => {
                                    const f = e.currentTarget.files?.[0];
                                    e.currentTarget.value = '';
                                    if (f) uploadPresentation(u.id, f);
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => removePresentation(u.id)}
                                style={dangerBtn}
                                disabled={!!presBusy[u.id]}
                              >Remove</button>
                            </>
                          )}
                        </>
                      ) : role === 'teacher' && (
                        <>
                          <span style={{ fontWeight: 600, color: 'var(--cw-ink)', fontSize: 13 }}>Upload PPTX</span>
                          <label style={{ ...secondaryBtn, cursor: presBusy[u.id] ? 'wait' : 'pointer', opacity: presBusy[u.id] ? 0.6 : 1 }}
                                 title="Convert a PowerPoint deck so pupils can flip through the slides on this page">
                            {presBusy[u.id] ? 'Uploading…' : 'Choose .pptx file'}
                            <input
                              type="file"
                              accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                              hidden
                              disabled={!!presBusy[u.id]}
                              onChange={(e) => {
                                const f = e.currentTarget.files?.[0];
                                e.currentTarget.value = '';
                                if (f) uploadPresentation(u.id, f);
                              }}
                            />
                          </label>
                        </>
                      )}
                      {presErr[u.id] && (
                        <span style={{ color: 'var(--cw-danger)', fontSize: 13, width: '100%' }}>
                          {presErr[u.id]}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── Row 2: OneDrive / SharePoint embed link ── */}
                  {(u.onedrive_embed_url || role === 'teacher') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>☁️</span>
                      {u.onedrive_embed_url ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setOdViewerUnit(u)}
                            style={primaryBtn}
                            title="Open the live OneDrive presentation"
                          >View slides (OneDrive)</button>
                          {role === 'teacher' && (
                            <button
                              type="button"
                              onClick={() => removeOnedriveUrl(u.id)}
                              style={dangerBtn}
                              disabled={!!odBusy[u.id]}
                            >{odBusy[u.id] ? 'Removing…' : 'Remove link'}</button>
                          )}
                        </>
                      ) : role === 'teacher' && (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 220 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <input
                                type="url"
                                placeholder="Paste OneDrive or SharePoint embed URL…"
                                value={odInput[u.id] || ''}
                                onChange={(e) => setOdInput((inp) => ({ ...inp, [u.id]: e.target.value }))}
                                style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--cw-border)', borderRadius: 6, fontSize: 13 }}
                                onKeyDown={(e) => { if (e.key === 'Enter') saveOnedriveUrl(u.id); }}
                              />
                              <button
                                type="button"
                                onClick={() => saveOnedriveUrl(u.id)}
                                style={secondaryBtn}
                                disabled={!!odBusy[u.id] || !(odInput[u.id] || '').trim()}
                              >{odBusy[u.id] ? 'Saving…' : 'Save'}</button>
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--cw-muted)', lineHeight: 1.4 }}>
                              In OneDrive/SharePoint: open the presentation → Share → Embed → copy the <em>src</em> URL from the iframe code.
                            </span>
                          </div>
                        </>
                      )}
                      {odErr[u.id] && (
                        <span style={{ color: 'var(--cw-danger)', fontSize: 13, width: '100%' }}>
                          {odErr[u.id]}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── Section editor (teacher only, when OneDrive link is set) ── */}
                  {u.onedrive_embed_url && role === 'teacher' && (
                    <div style={{ marginTop: 6 }}>
                      {!odSecOpen[u.id] ? (
                        <button
                          type="button"
                          onClick={() => openSectionEditor(u)}
                          style={{ fontSize: 12, background: 'none', border: '1px solid var(--cw-border)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', color: 'var(--cw-muted)' }}
                        >
                          ☰ {(u.od_sections?.length ?? 0) > 0 ? `Sections (${u.od_sections!.length})` : 'Add sections'}
                        </button>
                      ) : (
                        <div style={{ border: '1px solid var(--cw-border)', borderRadius: 8, padding: 12, background: 'var(--cw-bg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>Sections</span>
                          <span style={{ fontSize: 11, color: 'var(--cw-muted)' }}>
                            Each section needs a name and the slide number it starts on. Slide numbers must match the live OneDrive presentation.
                          </span>
                          {(odSecDraft[u.id] || []).map((row, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <input
                                type="text"
                                placeholder="Section name"
                                value={row.name}
                                onChange={(e) => updateSectionRow(u.id, idx, 'name', e.target.value)}
                                style={{ flex: 3, padding: '4px 8px', border: '1px solid var(--cw-border)', borderRadius: 6, fontSize: 13 }}
                              />
                              <input
                                type="number"
                                placeholder="Slide"
                                value={row.startSlide}
                                min={1}
                                onChange={(e) => updateSectionRow(u.id, idx, 'startSlide', e.target.value)}
                                style={{ flex: 1, minWidth: 60, padding: '4px 8px', border: '1px solid var(--cw-border)', borderRadius: 6, fontSize: 13 }}
                              />
                              <button
                                type="button"
                                onClick={() => removeSectionRow(u.id, idx)}
                                style={{ background: 'none', border: 'none', color: 'var(--cw-danger)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}
                                title="Remove section"
                              >✕</button>
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => addSectionRow(u.id)}
                              style={{ fontSize: 12, background: 'none', border: '1px solid var(--cw-border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: 'var(--cw-text)' }}
                            >+ Add section</button>
                            <button
                              type="button"
                              onClick={() => saveSections(u.id)}
                              disabled={!!odSecBusy[u.id]}
                              style={{ ...secondaryBtn, fontSize: 12, padding: '4px 14px' }}
                            >{odSecBusy[u.id] ? 'Saving…' : 'Save'}</button>
                            <button
                              type="button"
                              onClick={() => closeSectionEditor(u.id)}
                              style={{ fontSize: 12, background: 'none', border: 'none', color: 'var(--cw-muted)', cursor: 'pointer', padding: '4px 6px' }}
                            >Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {lessons.length === 0 ? (
                <p style={{ color: 'var(--cw-muted)', marginTop: 12 }}>
                  {role === 'teacher' ? 'No lessons in this unit yet.' : 'No lessons here yet.'}
                </p>
              ) : (
                <ul style={{ marginTop: 12, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lessons.map((l, idx) => {
                    const isDragging   = dragLessonId === l.id;
                    const isDragOver   = dragOverLessonId === l.id && dragLessonId && dragLessonId !== l.id;
                    const showTopLine  = isDragOver && dragOverPos === 'before';
                    const showBotLine  = isDragOver && dragOverPos === 'after';
                    return (
                      <li
                        key={l.id}
                        // Only the drag handle is draggable, but we attach the
                        // drop targets to the whole row so it's an easy aim.
                        onDragOver={(e) => {
                          if (role !== 'teacher' || !dragLessonId) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const half = r.top + r.height / 2;
                          setDragOverLessonId(l.id);
                          setDragOverPos(e.clientY < half ? 'before' : 'after');
                        }}
                        onDragLeave={(e) => {
                          // Only clear if we're actually leaving the row, not
                          // just moving across one of its children.
                          const next = e.relatedTarget as Node | null;
                          if (!next || !(e.currentTarget as HTMLElement).contains(next)) {
                            setDragOverLessonId((cur) => (cur === l.id ? null : cur));
                          }
                        }}
                        onDrop={(e) => {
                          if (role !== 'teacher') return;
                          e.preventDefault();
                          handleLessonDrop(u.id, l.id);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                          padding: 12, borderRadius: 8,
                          border: l.is_test ? '1px solid var(--cw-tint-amber-border)' : '1px solid var(--cw-border)',
                          background: l.is_test ? 'var(--cw-tint-amber-bg)' : 'var(--cw-surface-soft)',
                          opacity: isDragging ? 0.4 : 1,
                          boxShadow: showTopLine
                            ? 'inset 0 3px 0 0 var(--cw-accent)'
                            : showBotLine
                              ? 'inset 0 -3px 0 0 var(--cw-accent)'
                              : 'none',
                          transition: 'box-shadow 80ms linear',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          {role === 'teacher' && (
                            <span
                              draggable
                              onDragStart={(e) => {
                                setDragLessonId(l.id);
                                e.dataTransfer.effectAllowed = 'move';
                                // Some browsers require non-empty data to
                                // start a drag at all.
                                try { e.dataTransfer.setData('text/plain', l.id); } catch { /* ignore */ }
                              }}
                              onDragEnd={() => { setDragLessonId(null); setDragOverLessonId(null); }}
                              title="Drag to reorder lessons in this unit"
                              style={{
                                cursor: 'grab', userSelect: 'none', color: 'var(--cw-muted)',
                                fontSize: 16, lineHeight: 1, padding: '0 2px',
                              }}
                              aria-label="Drag handle"
                            >⋮⋮</span>
                          )}
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            minWidth: 26, height: 22, padding: '0 6px',
                            borderRadius: 6, background: 'var(--cw-border)', color: 'var(--cw-ink-soft)',
                            fontSize: 12, fontWeight: 700, flexShrink: 0,
                          }}>{idx + 1}</span>
                          <Link
                            href={`/lesson/${l.id}`}
                            style={{
                              fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap', minWidth: 0,
                            }}
                          >{l.title}</Link>
                          {l.is_test && (
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                              background: 'var(--cw-tint-amber-border)', color: 'var(--cw-tint-amber-ink)',
                              flexShrink: 0, letterSpacing: '0.04em', textTransform: 'uppercase',
                            }}>Test</span>
                          )}
                        </div>
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
                              <button
                                onClick={() => toggleTest(l)}
                                style={secondaryBtn}
                                title={l.is_test ? 'Remove test flag from this lesson' : 'Mark this lesson as a test'}
                              >
                                {l.is_test ? 'Unmark test' : 'Mark as test'}
                              </button>
                              <button onClick={() => openEditLesson(l)} style={secondaryBtn}
                                title={l.is_test ? 'Edit lesson title and resources' : 'Edit lesson title, learning intentions and success criteria'}>
                                Edit
                              </button>
                              <button onClick={() => { setModalErr(null); setModal({ kind: 'deleteLesson', lesson: l }); }} style={dangerBtn}>Delete</button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              </div>
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
          <button onClick={submitAddUnit} style={modalPrimaryBtn} disabled={unitImageUploading}>Create unit</button>
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
        <div style={{ marginTop: 12 }}>
          <label style={modalLabel}>Description (optional)</label>
          <input
            value={unitDescInput}
            onChange={(e) => setUnitDescInput(e.target.value)}
            placeholder="A short blurb shown under the unit title"
            style={modalInput}
          />
        </div>
        <UnitImageField
          imageUrl={unitImageUrl}
          uploading={unitImageUploading}
          onUrlChange={setUnitImageUrl}
          onPickFile={uploadUnitImage}
          onClear={() => setUnitImageUrl('')}
        />
        {modalErr && <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{modalErr}</p>}
      </Modal>

      <Modal
        open={modal.kind === 'editUnit'}
        title={modal.kind === 'editUnit' ? `Edit "${modal.unit.title}"` : ''}
        onClose={closeModal}
        footer={<>
          <button onClick={closeModal} style={modalSecondaryBtn}>Cancel</button>
          <button
            onClick={() => modal.kind === 'editUnit' && submitEditUnit(modal.unit)}
            style={modalPrimaryBtn}
            disabled={unitImageUploading}
          >Save unit</button>
        </>}
      >
        <div>
          <label style={modalLabel}>Unit title</label>
          <input
            autoFocus value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && modal.kind === 'editUnit') submitEditUnit(modal.unit); }}
            style={modalInput}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={modalLabel}>Description (optional)</label>
          <input
            value={unitDescInput}
            onChange={(e) => setUnitDescInput(e.target.value)}
            placeholder="A short blurb shown under the unit title"
            style={modalInput}
          />
        </div>
        <UnitImageField
          imageUrl={unitImageUrl}
          uploading={unitImageUploading}
          onUrlChange={setUnitImageUrl}
          onPickFile={uploadUnitImage}
          onClear={() => setUnitImageUrl('')}
        />
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
        {modal.kind === 'editLesson' && (
          <div style={{ marginBottom: 16 }}>
            <label style={modalLabel}>Lesson name</label>
            <input
              type="text"
              value={editLessonTitle}
              onChange={(e) => setEditLessonTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitEditLesson(modal.lesson); }}
              placeholder="e.g. Variables and data types"
              style={modalInput}
              autoFocus
            />
          </div>
        )}

        {modal.kind === 'editLesson' && !modal.lesson.is_test && (
          <>
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
          </>
        )}

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
                    padding: '6px 10px', border: '1px solid var(--cw-border)', borderRadius: 8, background: 'var(--cw-surface-soft)',
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                      background: 'var(--cw-border)', color: 'var(--cw-ink)', textTransform: 'uppercase',
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
              <div style={{ marginTop: 4, padding: 10, border: '1px solid var(--cw-border)', borderRadius: 8, background: 'var(--cw-surface)' }}>
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

      {/* Slide viewer. Mounted at the page root so it overlays everything
          else; controlled by `presViewerUnit` so opening/closing is just
          state on this component. */}
      <PresentationViewer
        open={!!presViewerUnit && !!presViewerUnit.presentation_pages_url}
        pagesUrl={presViewerUnit?.presentation_pages_url || null}
        unitTitle={presViewerUnit?.title || ''}
        filename={presViewerUnit?.presentation_filename || null}
        onClose={() => setPresViewerUnit(null)}
      />

      {/* OneDrive / SharePoint iframe modal */}
      {odViewerUnit?.onedrive_embed_url && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOdViewerUnit(null); }}
        >
          <div style={{
            display: 'flex', flexDirection: 'column',
            width: '100%', maxWidth: 1600, height: '92vh',
            borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          }}>
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              padding: '10px 16px', background: '#1e293b', color: '#f1f5f9',
              flexShrink: 0,
            }}>
              <span style={{ fontWeight: 700, fontSize: 15, marginRight: 4 }}>
                ☁️ {odViewerUnit.title}
              </span>
              <span style={{ flex: 1 }} />
              <button
                onClick={() => setOdViewerUnit(null)}
                style={{
                  background: 'transparent', color: '#94a3b8', border: '1px solid #334155',
                  borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                }}
              >✕ Close</button>
            </div>
            {/* Section reference list — shown when the unit has manually-defined
                sections. SharePoint's embedded viewer can't be navigated via URL
                params from a third-party iframe (its CSP blocks the slide-nav
                initialiser), so we display section names + slide numbers as a
                hint and pupils navigate using the viewer's own controls. */}
            {(odViewerUnit.od_sections?.length ?? 0) > 0 && (
              <div style={{
                padding: '10px 16px',
                background: '#f1f5f9', color: '#1e293b',
                borderBottom: '1px solid #cbd5e1',
                fontSize: 13,
                flexShrink: 0,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  Sections — use the slide controls below to jump to:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
                  {odViewerUnit.od_sections!.map((s, i) => (
                    <span key={i}>
                      <strong>{s.name}</strong>
                      <span style={{ color: '#475569' }}> — slide {s.startSlide}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Embedded presentation. SharePoint always opens at slide 1; pupils
                navigate manually using the viewer's own slide controls. */}
            <iframe
              src={buildOdSrc(odViewerUnit.onedrive_embed_url, odViewerUnit.od_resolved_url)}
              style={{ flex: 1, border: 'none', width: '100%' }}
              allowFullScreen
              title={`${odViewerUnit.title} — OneDrive slides`}
            />
          </div>
        </div>
      )}
    </Shell>
  );
}

const card: React.CSSProperties = {
  background: 'var(--cw-surface)', border: '1px solid var(--cw-border)', borderRadius: 12, padding: 20,
  boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
};
const primaryBtn: React.CSSProperties = {
  background: 'var(--cw-accent)', color: '#fff', border: 'none',
  padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
  background: 'var(--cw-surface-muted)', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
  padding: '6px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13,
};
const dangerBtn: React.CSSProperties = {
  background: '#fee2e2', color: 'var(--cw-danger)', border: '1px solid #fecaca',
  padding: '6px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13,
};

// Small square thumbnail rendered to the left of every unit title on the
// course page. When a unit has no image set we fall back to a soft
// placeholder showing the unit's first letter so every row stays visually
// aligned (no awkward "missing image" gap).
function UnitThumb({ url, title }: { url: string | null; title: string }) {
  const size = 56;
  const base: React.CSSProperties = {
    width: size, height: size, borderRadius: 10, flexShrink: 0,
    border: '1px solid var(--cw-border)', overflow: 'hidden',
  };
  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={{ ...base, objectFit: 'cover', display: 'block', background: 'var(--cw-surface-soft)' }}
      />
    );
  }
  const letter = (title || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      aria-hidden="true"
      style={{
        ...base,
        background: 'linear-gradient(135deg, var(--cw-border), var(--cw-border-strong))',
        color: 'var(--cw-ink-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 22,
      }}
    >{letter}</div>
  );
}

// The shared image-picker block used inside both the New unit and Edit
// unit modals. Teachers can either paste an existing URL or upload a
// fresh image file (which goes through the standard teacher upload
// endpoint). A live preview reassures them the URL actually resolves
// before they hit Save.
function UnitImageField(props: {
  imageUrl: string;
  uploading: boolean;
  onUrlChange: (url: string) => void;
  onPickFile: (file: File) => void;
  onClear: () => void;
}) {
  const { imageUrl, uploading, onUrlChange, onPickFile, onClear } = props;
  return (
    <div style={{ marginTop: 12 }}>
      <label style={modalLabel}>Unit image (optional)</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Unit thumbnail preview"
            style={{
              width: 56, height: 56, borderRadius: 10,
              border: '1px solid var(--cw-border)', objectFit: 'cover',
              background: 'var(--cw-surface-soft)', flexShrink: 0,
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{
              width: 56, height: 56, borderRadius: 10, flexShrink: 0,
              border: '1px dashed var(--cw-border)',
              background: 'var(--cw-surface-soft)', color: 'var(--cw-muted-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, textAlign: 'center', padding: 4,
            }}
          >No image</div>
        )}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            value={imageUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="Paste an image URL, or use Upload →"
            style={modalInput}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label style={{ ...modalSecondaryBtn, cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
              {uploading ? 'Uploading…' : 'Upload image'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  // Reset the input so the same file can be re-picked
                  // after a failed upload.
                  e.target.value = '';
                  if (f) onPickFile(f);
                }}
              />
            </label>
            {imageUrl && (
              <button type="button" onClick={onClear} style={modalSecondaryBtn} disabled={uploading}>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--cw-muted)' }}>
        Shown as a small thumbnail beside the unit title. Square or landscape images work best.
      </p>
    </div>
  );
}
