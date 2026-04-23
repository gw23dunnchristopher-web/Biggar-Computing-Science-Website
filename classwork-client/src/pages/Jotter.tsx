import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import Shell from '@/components/Shell';
import { api, getCurrentRole } from '@/lib/api';
import { sanitizeHtml, plainTextToHtml, looksLikeHtml } from '@/lib/sanitizeHtml';

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
  // /jotter            -> the signed-in pupil's own jotter
  // /jotter/:studentId -> teacher viewing a specific pupil's jotter
  const [, params] = useRoute('/jotter/:studentId');
  const studentId = params?.studentId || null;
  const role = getCurrentRole();
  const [jotter, setJotter] = useState<Jotter | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    const url = studentId
      ? `/api/classwork/students/${encodeURIComponent(studentId)}/jotter`
      : `/api/classwork/me/jotter`;
    api<Jotter>(url)
      .then(setJotter)
      .catch((e: any) => setErr(e.message || 'Failed to load jotter'))
      .finally(() => setLoading(false));
  }, [studentId]);

  const back = studentId
    ? { href: '/students', label: 'Back to students' }
    : (jotter?.course ? { href: `/course/${jotter.course}`, label: 'Back to your course' } : { href: '/', label: 'Home' });

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
        .cw-jotter-body img { max-width: 100%; height: auto; border-radius: 4px; }
        .cw-jotter-body img.cw-img-left   { float: left;  margin: 4px 12px 4px 0; max-width: 50%; }
        .cw-jotter-body img.cw-img-right  { float: right; margin: 4px 0 4px 12px; max-width: 50%; }
        .cw-jotter-body img.cw-img-center { display: block; margin: 8px auto; max-width: 100%; clear: both; }
        .cw-jotter-body::after { content: ''; display: block; clear: both; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>
          {studentId ? 'Pupil notes jotter' : 'Your notes jotter for the year'}
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
            : <>All the notes you&rsquo;ve written across <strong>{jotter.courseLabel}</strong>, gathered into one document.</>}
        </p>
      )}

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: 'var(--cw-danger)' }}>{err}</p>}

      {!loading && !err && jotter && jotter.units.length === 0 && (
        <p style={{ color: 'var(--cw-muted)' }}>
          {studentId
            ? 'This pupil hasn\u2019t written any notes yet.'
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
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(looksLikeHtml(u.content) ? u.content : plainTextToHtml(u.content)),
              }}
            />
          </div>
        ))}
      </div>
    </Shell>
  );
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--cw-border)', borderRadius: 12, padding: 20,
  boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
};
