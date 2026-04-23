import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import Shell from '@/components/Shell';
import { api, getCurrentRole } from '@/lib/api';

interface Question {
  id: string;
  lesson_id: string;
  course: string;
  order_index: number;
  question_type: string;
  prompt: string;
  marking_scheme: string | null;
  ai_grading_guidance: string | null;
  max_marks: number;
  options: any;
  config: any;
}

interface Submission {
  id: string;
  question_id: string;
  text_answer: string | null;
  selected_option_label: string | null;
  link_url: string | null;
  file_url: string | null;
  marks_awarded: number | null;
  ai_feedback: string | null;
  submitted_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  short: 'Short answer',
  long: 'Long answer',
  code: 'Code',
  multiple_choice: 'Multiple choice',
  screenshot: 'Screenshot upload',
  scratch_link: 'Scratch project link',
  makecode_link: 'MakeCode project link',
  google_sites_link: 'Google Sites link',
  project: 'Long-form project',
};

export default function Lesson() {
  const [, params] = useRoute('/lesson/:id');
  const lessonId = params?.id || '';
  const role = getCurrentRole();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [previewAsStudent, setPreviewAsStudent] = useState(false);
  const showStudentView = role === 'student' || (role === 'teacher' && previewAsStudent);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const qs = await api<Question[]>(`/api/classwork/lessons/${lessonId}/questions`);
      setQuestions(qs);
      if (role === 'student') {
        try {
          const subs = await api<Submission[]>(`/api/classwork/lessons/${lessonId}/my-submissions`);
          setSubmissions(subs);
        } catch { /* student may have no submissions */ }
      }
    } catch (e: any) {
      setErr(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [lessonId]);

  return (
    <Shell title="Lesson" back={{ href: '/', label: 'All courses' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Questions</h1>
        {role === 'teacher' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setPreviewAsStudent((v) => !v)}
              style={{
                background: previewAsStudent ? 'var(--cw-accent)' : '#f1f5f9',
                color: previewAsStudent ? '#fff' : 'var(--cw-ink)',
                border: '1px solid ' + (previewAsStudent ? 'var(--cw-accent)' : 'var(--cw-border)'),
                padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
              }}
              title="Show this lesson exactly as a student would see it"
            >
              {previewAsStudent ? 'Exit student preview' : 'Preview as student'}
            </button>
            {!previewAsStudent && <NewQuestionButton lessonId={lessonId} onCreated={refresh} />}
          </div>
        )}
      </div>

      {role === 'teacher' && previewAsStudent && (
        <div style={{
          marginTop: 12, padding: '8px 12px', background: '#fef3c7', border: '1px solid #fde68a',
          color: '#854d0e', borderRadius: 8, fontSize: 13,
        }}>
          You are previewing this lesson as a student. Answers won&rsquo;t actually be submitted.
        </div>
      )}

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: 'var(--cw-danger)' }}>{err}</p>}
      {!loading && !err && questions.length === 0 && (
        <p style={{ color: 'var(--cw-muted)', marginTop: 24 }}>
          {role === 'teacher' ? 'No questions yet — add the first one above.' : 'Your teacher hasn\u2019t added any questions yet.'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
        {questions.map((q, i) => {
          const mySubs = submissions.filter(s => s.question_id === q.id);
          return (
            <div key={q.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontWeight: 700 }}>Q{i + 1} · {TYPE_LABELS[q.question_type] || q.question_type}</div>
                <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>{q.max_marks} mark{q.max_marks === 1 ? '' : 's'}</div>
              </div>
              <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{q.prompt}</p>

              {role === 'teacher' && !previewAsStudent && (
                <details style={{ marginTop: 8, fontSize: 14, color: 'var(--cw-muted)' }}>
                  <summary style={{ cursor: 'pointer' }}>Marking scheme &amp; AI guidance</summary>
                  <div style={{ marginTop: 8 }}>
                    <div><strong>Marking scheme:</strong> {q.marking_scheme || '—'}</div>
                    <div style={{ marginTop: 4 }}><strong>AI guidance:</strong> {q.ai_grading_guidance || '—'}</div>
                  </div>
                </details>
              )}

              {showStudentView && (
                <StudentAnswer
                  question={q}
                  previousSubmissions={mySubs}
                  onSubmitted={refresh}
                  preview={role === 'teacher' && previewAsStudent}
                />
              )}
              {role === 'guest' && (
                <p style={{ marginTop: 8, color: 'var(--cw-muted)', fontSize: 14 }}>
                  Sign in as a student to answer this question.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

function StudentAnswer({ question, previousSubmissions, onSubmitted, preview = false }: {
  question: Question;
  previousSubmissions: Submission[];
  onSubmitted: () => void;
  preview?: boolean;
}) {
  const last = previousSubmissions[0];
  const [text, setText] = useState('');
  const [option, setOption] = useState<string>('');
  const [url, setUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const t = question.question_type;
  const uploadKind: 'screenshot' | 'project' | null =
    t === 'screenshot' ? 'screenshot' : t === 'project' ? 'project' : null;
  const acceptAttr = uploadKind === 'screenshot'
    ? 'image/*'
    : '.jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.sql,.py,.vb,.html,.htm,.css,.js,.ts,.json,.xml,.md,.sb3,.hex,.zip,.docx,.pptx,.xlsx';

  async function pickFile(file: File) {
    if (!uploadKind) return;
    if (preview) {
      setFileUrl('preview://' + file.name);
      setFileName(file.name);
      setMsg(`Selected ${file.name} (preview only — not uploaded).`);
      return;
    }
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('studentToken');
      const r = await fetch(`/api/classwork/upload/${uploadKind}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Upload failed');
      setFileUrl(data.url);
      setFileName(data.filename || file.name);
      setMsg(`Uploaded ${data.filename || file.name}.`);
    } catch (e: any) {
      setMsg(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (preview) {
      setMsg('Preview only — your answer wasn\u2019t submitted.');
      return;
    }
    setBusy(true);
    setMsg('Submitting and marking…');
    try {
      const body: any = {};
      if (t === 'multiple_choice') body.selectedOptionLabel = option;
      else if (['scratch_link', 'makecode_link', 'google_sites_link'].includes(t)) body.linkUrl = url;
      else if (t === 'screenshot') body.fileUrl = fileUrl;
      else if (t === 'project') {
        if (fileUrl) body.fileUrl = fileUrl;
        if (url) body.linkUrl = url;
      } else body.textAnswer = text;
      const result = await api<Submission>(`/api/classwork/questions/${question.id}/submit`, {
        method: 'POST', body: JSON.stringify(body),
      });
      if (result.marks_awarded != null) {
        setMsg(`Marked: ${result.marks_awarded}/${question.max_marks}`);
      } else {
        setMsg('Submitted — your teacher will mark this soon.');
      }
      setText(''); setOption(''); setUrl(''); setFileUrl(''); setFileName('');
      onSubmitted();
    } catch (e: any) {
      setMsg(e.message || 'Failed to submit');
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    t === 'multiple_choice' ? !!option :
    t === 'screenshot' ? !!fileUrl :
    t === 'project' ? !!(fileUrl || url) :
    ['scratch_link', 'makecode_link', 'google_sites_link'].includes(t) ? !!url :
    !!text.trim();
  return (
    <div style={{ marginTop: 12, padding: 12, border: '1px dashed var(--cw-border)', borderRadius: 8, background: '#fafbfd' }}>
      {t === 'multiple_choice' && Array.isArray(question.options) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {question.options.map((opt: any, i: number) => (
            <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="radio" name={`mc-${question.id}`} value={opt.label || String(i)}
                checked={option === (opt.label || String(i))}
                onChange={(e) => setOption(e.target.value)} />
              <span>{opt.text || opt.label || `Option ${i + 1}`}</span>
            </label>
          ))}
        </div>
      )}

      {(t === 'scratch_link' || t === 'makecode_link' || t === 'google_sites_link') && (
        <input type="url" placeholder="https://…" value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--cw-border)' }} />
      )}

      {(t === 'short' || t === 'long' || t === 'code') && (
        <textarea
          rows={t === 'short' ? 3 : 8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--cw-border)', fontFamily: t === 'code' ? 'JetBrains Mono, monospace' : 'inherit' }}
        />
      )}

      {uploadKind && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="file"
            accept={acceptAttr}
            disabled={uploading || busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickFile(f);
            }}
          />
          {fileName && (
            <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
              Attached: <strong>{fileName}</strong>{' '}
              <button type="button" onClick={() => { setFileUrl(''); setFileName(''); }}
                style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--cw-accent)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                remove
              </button>
            </div>
          )}
          {t === 'project' && (
            <input
              type="url"
              placeholder="Or paste a project link (Scratch, MakeCode, Google Sites, …) — optional"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--cw-border)' }}
            />
          )}
        </div>
      )}

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={submit} disabled={busy || uploading || !canSubmit} style={{
          background: 'var(--cw-accent)', color: '#fff', border: 'none',
          padding: '8px 14px', borderRadius: 8, fontWeight: 600,
          cursor: (busy || uploading || !canSubmit) ? 'not-allowed' : 'pointer',
          opacity: (busy || uploading || !canSubmit) ? 0.6 : 1,
        }}>{busy ? 'Submitting…' : uploading ? 'Uploading…' : 'Submit'}</button>
        {msg && <span style={{ fontSize: 14, color: 'var(--cw-muted)' }}>{msg}</span>}
      </div>

      {last && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--cw-muted)' }}>
          Last attempt: {new Date(last.submitted_at).toLocaleString()}
          {last.marks_awarded != null && <> · {last.marks_awarded}/{question.max_marks} marks</>}
          {last.ai_feedback && <div style={{ marginTop: 4, color: 'var(--cw-ink)' }}>{last.ai_feedback}</div>}
        </div>
      )}
    </div>
  );
}

function NewQuestionButton({ lessonId, onCreated }: { lessonId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        background: 'var(--cw-accent)', color: '#fff', border: 'none',
        padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
      }}>+ New question</button>
      {open && <NewQuestionModal lessonId={lessonId} onClose={() => setOpen(false)} onCreated={() => { setOpen(false); onCreated(); }} />}
    </>
  );
}

function NewQuestionModal({ lessonId, onClose, onCreated }: { lessonId: string; onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState('short');
  const [prompt, setPrompt] = useState('');
  const [maxMarks, setMaxMarks] = useState(1);
  const [markingScheme, setMarkingScheme] = useState('');
  const [aiGuidance, setAiGuidance] = useState('');
  const [options, setOptions] = useState<{ label: string; text: string; isCorrect: boolean }[]>([
    { label: 'A', text: '', isCorrect: false },
    { label: 'B', text: '', isCorrect: false },
  ]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const body: any = {
        questionType: type, prompt, maxMarks, markingScheme, aiGradingGuidance: aiGuidance,
      };
      if (type === 'multiple_choice') body.options = options;
      await api(`/api/classwork/lessons/${lessonId}/questions`, {
        method: 'POST', body: JSON.stringify(body),
      });
      onCreated();
    } catch (e: any) {
      setErr(e.message || 'Failed to save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>New question</h2>
        <label style={fieldLabel}>Type
          <select value={type} onChange={(e) => setType(e.target.value)} style={input}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label style={fieldLabel}>Question / prompt
          <textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} style={input} />
        </label>
        <label style={fieldLabel}>Max marks
          <input type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(parseInt(e.target.value) || 1)} style={input} />
        </label>
        {type === 'multiple_choice' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Options</div>
            {options.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input value={o.label} onChange={(e) => { const a = [...options]; a[i].label = e.target.value; setOptions(a); }} style={{ ...input, width: 60 }} />
                <input placeholder="Option text" value={o.text} onChange={(e) => { const a = [...options]; a[i].text = e.target.value; setOptions(a); }} style={{ ...input, flex: 1 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  <input type="checkbox" checked={o.isCorrect} onChange={(e) => { const a = [...options]; a[i].isCorrect = e.target.checked; setOptions(a); }} />
                  Correct
                </label>
                <button onClick={() => setOptions(options.filter((_, j) => j !== i))} style={{ ...input, width: 40, cursor: 'pointer' }}>×</button>
              </div>
            ))}
            <button onClick={() => setOptions([...options, { label: String.fromCharCode(65 + options.length), text: '', isCorrect: false }])}
              style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', cursor: 'pointer' }}>
              + Add option
            </button>
          </div>
        )}
        <label style={fieldLabel}>Marking scheme (teacher view only)
          <textarea rows={2} value={markingScheme} onChange={(e) => setMarkingScheme(e.target.value)} style={input} />
        </label>
        <label style={fieldLabel}>AI grading guidance (used by AI marker — Phase 2)
          <textarea rows={2} value={aiGuidance} onChange={(e) => setAiGuidance(e.target.value)} style={input} />
        </label>
        {err && <div style={{ color: 'var(--cw-danger)', fontSize: 14, marginTop: 6 }}>{err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--cw-border)', background: '#fff', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={busy} style={{
            background: 'var(--cw-accent)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
          }}>{busy ? 'Saving…' : 'Save question'}</button>
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--cw-border)', borderRadius: 12, padding: 20,
  boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
};
const modal: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 24, maxWidth: 560, width: '92%',
  maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
};
const fieldLabel: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 600, fontSize: 14, marginTop: 12,
};
const input: React.CSSProperties = {
  padding: '8px 10px', fontSize: 14, fontWeight: 400,
  border: '1px solid var(--cw-border)', borderRadius: 8, fontFamily: 'inherit',
};
