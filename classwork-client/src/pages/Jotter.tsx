import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import Shell from '@/components/Shell';
import { api, getCurrentRole } from '@/lib/api';
import { sanitizeHtml, plainTextToHtml, looksLikeHtml } from '@/lib/sanitizeHtml';

// State for the image lightbox (declared outside the component definition so
// the hook's useState typing stays simple). null = closed; { src, alt } = open.
interface Lightbox { src: string; alt: string; }

interface UnitNotes {
  unitId: string;
  unitTitle: string;
  content: string;
  updatedAt: number | null;
}
interface Jotter {
  studentId: string;
  course: string;
  courseLabel: string;
  units: UnitNotes[];
  username?: string;
}

export default function JotterPage() {
  // /jotter                 -> the signed-in pupil's own jotter
  // /jotter/:studentId      -> teacher viewing a specific pupil's jotter
  // /jotter?course=<course> -> teacher's own demo jotter for that course
  const [, params] = useRoute('/jotter/:studentId');
  const studentId = params?.studentId || null;
  const role = getCurrentRole();
  // Read ?course= directly off the URL (set once on mount; teachers reach
  // this page via a fresh navigation from the course / lesson header).
  const teacherCourse = (() => {
    if (studentId || role !== 'teacher') return null;
    try { return new URLSearchParams(window.location.search).get('course'); }
    catch { return null; }
  })();
  const isTeacherDemo = role === 'teacher' && !studentId && !!teacherCourse;
  const [jotter, setJotter] = useState<Jotter | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);
  // Track whether the lightbox is showing the image at its full natural size
  // (zoomed) or fitted to the screen. Toggled by clicking the image.
  const [zoomed, setZoomed] = useState(false);

  // Close the lightbox with Escape — standard expectation for any modal.
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setLightbox(null); setZoomed(false); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  // Reset zoom whenever a different image is opened.
  useEffect(() => { setZoomed(false); }, [lightbox?.src]);

  // Event delegation: a single double-click handler on each unit card opens
  // any image inside that card in the lightbox. Avoids attaching listeners to
  // every <img> after dangerouslySetInnerHTML, and survives re-renders.
  function onBodyDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement;
    if (t && t.tagName === 'IMG') {
      const img = t as HTMLImageElement;
      setLightbox({ src: img.currentSrc || img.src, alt: img.alt || '' });
    }
  }

  useEffect(() => {
    setLoading(true);
    setErr(null);
    const url = studentId
      ? `/api/classwork/students/${encodeURIComponent(studentId)}/jotter`
      : (isTeacherDemo
          ? `/api/classwork/teacher-jotter/${encodeURIComponent(teacherCourse!)}`
          : `/api/classwork/me/jotter`);
    api<Jotter>(url)
      .then(setJotter)
      .catch((e: any) => setErr(e.message || 'Failed to load jotter'))
      .finally(() => setLoading(false));
  }, [studentId, isTeacherDemo, teacherCourse]);

  const back = studentId
    ? { href: '/students', label: 'Back to students' }
    : (isTeacherDemo
        ? { href: `/course/${teacherCourse}`, label: 'Back to course' }
        : (jotter?.course ? { href: `/course/${jotter.course}`, label: 'Back to your course' } : { href: '/', label: 'Home' }));

  return (
    <Shell title="Notes jotter" back={back}>
      <style>{`
        @media print {
          .cw-no-print { display: none !important; }
          body { background: #fff !important; }
          .cw-jotter-card { break-inside: avoid; box-shadow: none !important; border: 1px solid #cbd5e1 !important; }
        }
        .cw-jotter-body h2 { font-size: 22px; margin: 12px 0 6px; }
        .cw-jotter-body h3 { font-size: 18px; margin: 10px 0 6px; }
        .cw-jotter-body h4 { font-size: 16px; margin: 10px 0 6px; }
        .cw-jotter-body p  { margin: 6px 0; }
        .cw-jotter-body ul, .cw-jotter-body ol { padding-left: 24px; margin: 6px 0; }
        .cw-jotter-body blockquote { margin: 8px 0; padding: 4px 12px; border-left: 3px solid #cbd5e1; color: #475569; }
        .cw-jotter-body a { color: var(--cw-accent); text-decoration: underline; }
        .cw-jotter-body img { max-width: 100%; height: auto; border-radius: 4px; cursor: zoom-in; }
        @media print { .cw-jotter-body img { cursor: auto; } }
        .cw-jotter-body img.cw-img-left   { float: left;  margin: 4px 12px 4px 0; max-width: 50%; }
        .cw-jotter-body img.cw-img-right  { float: right; margin: 4px 0 4px 12px; max-width: 50%; }
        .cw-jotter-body img.cw-img-center { display: block; margin: 8px auto; max-width: 100%; clear: both; }
        .cw-jotter-body::after { content: ''; display: block; clear: both; }
        .cw-jotter-body table.cw-table { border-collapse: collapse; margin: 8px 0; width: auto; max-width: 100%; }
        .cw-jotter-body table.cw-table th, .cw-jotter-body table.cw-table td { border: 1px solid #cbd5e1; padding: 6px 10px; vertical-align: top; }
        .cw-jotter-body table.cw-table th { background: #f1f5f9; text-align: left; font-weight: 600; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>
          {studentId
            ? 'Pupil notes jotter'
            : isTeacherDemo
              ? 'Demo jotter (teacher view)'
              : 'Your notes jotter for the year'}
        </h1>
        <div className="cw-no-print" style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              background: '#f1f5f9', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
              padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}
            title="Print or save as PDF"
          >Print / save as PDF</button>
        </div>
      </div>

      {jotter && (
        <p style={{ color: 'var(--cw-muted)', marginTop: 0 }}>
          {studentId
            ? <>Viewing {jotter.username ? <strong>{jotter.username}</strong> : 'this pupil'}&rsquo;s notes for <strong>{jotter.courseLabel}</strong>.</>
            : isTeacherDemo
              ? <>This is your shared <strong>demo jotter</strong> for <strong>{jotter.courseLabel}</strong> &mdash; use it during lessons to show pupils how their own jotter works. Pupils can&rsquo;t see this.</>
              : <>All the notes you&rsquo;ve written across <strong>{jotter.courseLabel}</strong>, gathered into one document.</>}
        </p>
      )}

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: 'var(--cw-danger)' }}>{err}</p>}

      {!loading && !err && jotter && jotter.units.length === 0 && (
        <p style={{ color: 'var(--cw-muted)' }}>
          {studentId
            ? 'This pupil hasn\u2019t written any notes yet.'
            : isTeacherDemo
              ? 'No demo notes yet. Open any unit on the course page and click "Demo notes" to write some \u2014 they\u2019ll appear here.'
              : 'You haven\u2019t written any notes yet. Open any unit and click "My notes" to start your jotter.'}
          {role === 'student' && (
            <> {' '}<Link href="/" style={{ color: 'var(--cw-accent)' }}>Back to home</Link></>
          )}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
        {(jotter?.units || []).map((u) => (
          <div key={u.unitId} className="cw-jotter-card" style={card}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{u.unitTitle}</h2>
              {u.updatedAt && (
                <span style={{ fontSize: 12, color: 'var(--cw-muted)' }}>
                  Last updated {new Date(u.updatedAt).toLocaleString()}
                </span>
              )}
            </div>
            <div
              className="cw-jotter-body"
              style={{
                marginTop: 12, wordBreak: 'break-word',
                fontFamily: 'inherit', fontSize: 15, lineHeight: 1.6, color: 'var(--cw-ink)',
              }}
              onDoubleClick={onBodyDoubleClick}
              title="Double-click an image to zoom in"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(looksLikeHtml(u.content) ? u.content : plainTextToHtml(u.content)),
              }}
            />
          </div>
        ))}
      </div>

      {/* Image lightbox: dark fullscreen overlay; click backdrop or press
          Escape to close; click image to toggle 1:1 zoom (with scroll-to-pan
          when the natural size is larger than the screen). */}
      {lightbox && (
        <div
          className="cw-no-print"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => { setLightbox(null); setZoomed(false); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 24, overflow: 'auto',
            cursor: zoomed ? 'zoom-out' : 'zoom-in',
          }}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); setZoomed(false); }}
            aria-label="Close image preview"
            title="Close (Esc)"
            style={{
              position: 'fixed', top: 16, right: 20, zIndex: 10000,
              background: 'rgba(255,255,255,0.92)', color: 'var(--cw-ink)',
              border: 'none', borderRadius: '50%',
              width: 40, height: 40, fontSize: 22, lineHeight: 1, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >&times;</button>
          <div style={{
            position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(15,23,42,0.7)', color: '#fff', fontSize: 12,
            padding: '6px 12px', borderRadius: 999, pointerEvents: 'none',
          }}>
            Click image to {zoomed ? 'fit to screen' : 'view full size'} &middot; Click background or press Esc to close
          </div>
          <img
            src={lightbox.src}
            alt={lightbox.alt}
            onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}
            style={zoomed
              ? { maxWidth: 'none', maxHeight: 'none', cursor: 'zoom-out', borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }
              : { maxWidth: '95vw', maxHeight: '90vh', cursor: 'zoom-in', borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }
            }
          />
        </div>
      )}
    </Shell>
  );
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--cw-border)', borderRadius: 12, padding: 20,
  boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
};
