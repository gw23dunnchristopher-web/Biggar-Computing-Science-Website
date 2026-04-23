import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import Shell from '@/components/Shell';
import { api, getCurrentRole } from '@/lib/api';

interface LessonInfo {
  id: string;
  title: string;
  learning_intentions: string | null;
  success_criteria: string | null;
  is_published: boolean;
}

interface LessonResource {
  id: string;
  lesson_id: string;
  kind: 'image' | 'document' | 'youtube' | 'link' | 'embed';
  title: string | null;
  url: string;
  order_index: number;
}

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
  student_id?: string;
  student_username?: string | null;
  text_answer: string | null;
  selected_option_label: string | null;
  link_url: string | null;
  file_url: string | null;
  marks_awarded: number | null;
  ai_feedback: string | null;
  marked_by?: 'ai' | 'teacher' | null;
  marked_at?: string | null;
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
  presentation: 'Presentation (.pptx)',
  video_question: 'Watch a video and answer',
  python_task: 'Python project (in-site editor)',
  html_task: 'HTML/CSS project (in-site editor)',
  sql_task: 'SQL task (Data Sculptor)',
  database_task: 'Database task (Data Sculptor sandbox)',
};

export default function Lesson() {
  const [, params] = useRoute('/lesson/:id');
  const lessonId = params?.id || '';
  const role = getCurrentRole();
  const [lesson, setLesson] = useState<LessonInfo | null>(null);
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allSubs, setAllSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [previewAsStudent, setPreviewAsStudent] = useState(false);
  const showStudentView = role === 'student' || (role === 'teacher' && previewAsStudent);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const [info, qs, res] = await Promise.all([
        api<LessonInfo>(`/api/classwork/lessons/${lessonId}`).catch(() => null),
        api<Question[]>(`/api/classwork/lessons/${lessonId}/questions`),
        api<LessonResource[]>(`/api/classwork/lessons/${lessonId}/resources`).catch(() => [] as LessonResource[]),
      ]);
      setLesson(info);
      setQuestions(qs);
      setResources(res || []);
      if (role === 'student') {
        try {
          const subs = await api<Submission[]>(`/api/classwork/lessons/${lessonId}/my-submissions`);
          setSubmissions(subs);
        } catch { /* student may have no submissions */ }
      } else if (role === 'teacher') {
        try {
          const subs = await api<Submission[]>(`/api/classwork/lessons/${lessonId}/submissions`);
          setAllSubs(subs);
        } catch { /* none yet */ }
      }
    } catch (e: any) {
      setErr(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function refreshSubmissions() {
    if (role !== 'teacher') return;
    try {
      const subs = await api<Submission[]>(`/api/classwork/lessons/${lessonId}/submissions`);
      setAllSubs(subs);
    } catch { /* ignore */ }
  }

  useEffect(() => { refresh(); }, [lessonId]);

  return (
    <Shell title="Lesson" back={{ href: '/', label: 'All courses' }}>
      {lesson && (lesson.title || lesson.learning_intentions || lesson.success_criteria) && (
        <LessonHeader lesson={lesson} />
      )}
      {resources.length > 0 && (
        <LessonResources resources={resources} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: lesson ? 16 : 0 }}>
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

      {(() => {
        const mainQs = questions.filter((q) => !q.is_extension);
        const extQs  = questions.filter((q) => !!q.is_extension);
        const renderQuestion = (q: any, label: string, isExt: boolean) => {
          const mySubs = submissions.filter(s => s.question_id === q.id);
          return (
            <div key={q.id} style={{
              ...card,
              ...(isExt ? { borderColor: '#c084fc', background: '#faf5ff' } : {}),
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                  <span>{label} · {TYPE_LABELS[q.question_type] || q.question_type}</span>
                  {isExt && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: 999, background: '#7c3aed', color: '#fff',
                    }}>Extension</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>{q.max_marks} mark{q.max_marks === 1 ? '' : 's'}</div>
              </div>
              <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{q.prompt}</p>

              {q.question_type === 'video_question' && <VideoQuestionPlayer config={q.config} />}

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
              {role === 'teacher' && !previewAsStudent && (
                <TeacherSubmissions
                  question={q}
                  submissions={allSubs.filter((s) => s.question_id === q.id)}
                  onChanged={refreshSubmissions}
                />
              )}
              {role === 'guest' && (
                <p style={{ marginTop: 8, color: 'var(--cw-muted)', fontSize: 14 }}>
                  Sign in as a student to answer this question.
                </p>
              )}
            </div>
          );
        };
        return (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
              {mainQs.map((q, i) => renderQuestion(q, `Q${i + 1}`, false))}
            </div>
            {extQs.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                  paddingBottom: 8, borderBottom: '2px solid #e9d5ff',
                }}>
                  <h2 style={{ margin: 0, fontSize: 18, color: '#6b21a8' }}>Extension activities</h2>
                  <span style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
                    Optional — these are marked but don't count towards class analytics.
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {extQs.map((q, i) => renderQuestion(q, `E${i + 1}`, true))}
                </div>
              </div>
            )}
          </>
        );
      })()}
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
  // python_task / html_task: list the pupil's saved code projects so they
  // can pick one and submit its latest code with one click.
  const [codeProjects, setCodeProjects] = useState<{ id: string; name: string; updatedAt: number | null }[] | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const t = question.question_type;
  const codeProjectKind: 'python' | 'html' | null =
    t === 'python_task' ? 'python' : t === 'html_task' ? 'html' : null;
  const editorHref = (id: string) => codeProjectKind === 'python'
    ? `/HTML/Tools/PythonEditor.html?project=${encodeURIComponent(id)}`
    : codeProjectKind === 'html'
      ? `/HTML/Tools/HTMLEditor.html?project=${encodeURIComponent(id)}`
      : '#';
  const sqlDbUrl: string = (() => {
    if (t !== 'sql_task') return '';
    const cfg = (question as any).config;
    return cfg && typeof cfg === 'object' && typeof cfg.databaseUrl === 'string' ? cfg.databaseUrl : '';
  })();
  // database_task: the teacher pastes a Data Sculptor embed URL (or just the
  // token). Pupils open it, get a forked sandbox via the standard DS embed
  // flow, work in it, and on Submit we send "<token>|<sessionKey>" so the
  // server can resolve their sandbox and call the DS structure grader.
  const dbEmbedToken: string = (() => {
    if (t !== 'database_task') return '';
    const cfg = (question as any).config;
    if (!cfg || typeof cfg !== 'object') return '';
    if (typeof cfg.embedToken === 'string' && cfg.embedToken) return cfg.embedToken;
    if (typeof cfg.embedUrl === 'string' && cfg.embedUrl) {
      const m = cfg.embedUrl.match(/[?&]embed=([A-Za-z0-9_-]+)/);
      return m ? m[1] : '';
    }
    return '';
  })();
  const dbEmbedUrl: string = dbEmbedToken
    ? `/data-sculptor/?embed=${encodeURIComponent(dbEmbedToken)}`
    : '';

  // For python_task / html_task we now embed the editor itself inline as a
  // sandbox (mirroring the Data Sculptor flow). The first time a pupil opens
  // the question we look for the per-question project — identified by a name
  // starting with the marker `[CW q<questionId>]` — and create it if it
  // doesn't exist. selectedProjectId then drives both the iframe src and the
  // existing submit() path (which already pulls the latest code from
  // /api/code-projects/<kind>/<id>).
  const cwProjectMarker = `[CW q${question.id.slice(0, 8)}]`;
  const cwProjectName = `${cwProjectMarker} ${(question.prompt || 'classwork task').slice(0, 60)}`;
  useEffect(() => {
    if (!codeProjectKind || preview) return;
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem('studentToken') || '';
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      try {
        const r = await fetch(`/api/code-projects/${codeProjectKind}`, { headers });
        if (!r.ok) { if (!cancelled) setCodeProjects([]); return; }
        const data = await r.json();
        const list: { id: string; name: string; updatedAt: number | null }[] = Array.isArray(data) ? data : [];
        let mine = list.find((p) => typeof p.name === 'string' && p.name.startsWith(cwProjectMarker));
        if (!mine) {
          const cr = await fetch(`/api/code-projects/${codeProjectKind}`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: cwProjectName, code: '' }),
          });
          if (cr.ok) {
            const created = await cr.json();
            mine = { id: created.id, name: created.name, updatedAt: created.updatedAt ?? null };
            list.unshift(mine);
          }
        }
        if (cancelled) return;
        setCodeProjects(list);
        if (mine) setSelectedProjectId(mine.id);
      } catch {
        if (!cancelled) setCodeProjects([]);
      }
    })();
    return () => { cancelled = true; };
  }, [codeProjectKind, preview, question.id]);
  const uploadKind: 'screenshot' | 'project' | null =
    t === 'screenshot' ? 'screenshot'
      : t === 'project' || t === 'presentation' ? 'project'
      : null;
  const acceptAttr = uploadKind === 'screenshot'
    ? 'image/*'
    : t === 'presentation'
      ? '.pptx'
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
      else if (t === 'presentation') body.fileUrl = fileUrl;
      else if (t === 'project') {
        if (fileUrl) body.fileUrl = fileUrl;
        if (url) body.linkUrl = url;
      } else if (codeProjectKind) {
        // python_task / html_task — pull the latest code from the chosen
        // project and submit it as the text answer; stash the project id in
        // link_url so the server can re-fetch the latest version at marking time.
        if (!selectedProjectId) throw new Error('Please pick a project to submit.');
        const token = localStorage.getItem('studentToken') || '';
        const r = await fetch(`/api/code-projects/${codeProjectKind}/${encodeURIComponent(selectedProjectId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!r.ok) throw new Error('Could not load that project.');
        const data = await r.json();
        body.textAnswer = String(data?.code ?? '');
        body.linkUrl = `${selectedProjectId}|${data?.name || ''}`;
      } else if (t === 'database_task') {
        // Resolve the pupil's DS embed sandbox from their session key
        // (mirrored to localStorage by the embed app on the same origin).
        if (!dbEmbedToken) throw new Error('This task is missing its database link. Ask your teacher to add one.');
        const sessionKey = localStorage.getItem('student_session_key');
        if (!sessionKey) throw new Error('Please open the database first, do your work, then come back and submit.');
        body.linkUrl = `${dbEmbedToken}|${sessionKey}`;
      } else body.textAnswer = text; // short / long / code / video_question / sql_task
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
    t === 'presentation' ? !!fileUrl :
    t === 'project' ? !!(fileUrl || url) :
    ['scratch_link', 'makecode_link', 'google_sites_link'].includes(t) ? !!url :
    codeProjectKind ? !!selectedProjectId :
    t === 'database_task' ? !!dbEmbedToken :
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

      {(t === 'short' || t === 'long' || t === 'code' || t === 'video_question') && (
        <textarea
          rows={t === 'short' ? 3 : 8}
          placeholder={t === 'video_question' ? 'Watch the video above, then write your answer here…' : undefined}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--cw-border)', fontFamily: t === 'code' ? 'JetBrains Mono, monospace' : 'inherit' }}
        />
      )}

      {codeProjectKind && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
            Write and run your {codeProjectKind === 'python' ? 'Python' : 'HTML/CSS'} below.
            Your work is auto-saved to your account. When you're done, click Submit and the AI
            will mark your latest saved code.
          </div>
          {codeProjects === null || !selectedProjectId ? (
            <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>Loading your editor…</div>
          ) : (
            <>
              <div style={{ width: '100%', height: 560, border: '1px solid var(--cw-border)', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                <iframe
                  src={`${editorHref(selectedProjectId)}&embed=1`}
                  title={`${codeProjectKind === 'python' ? 'Python' : 'HTML/CSS'} editor`}
                  style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                  allow="clipboard-read; clipboard-write"
                />
              </div>
              <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>
                Need more space?{' '}
                <a
                  href={editorHref(selectedProjectId)}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--cw-accent)' }}
                >Open this project in a full editor tab</a>
                . Your saves sync both ways.
              </div>
            </>
          )}
        </div>
      )}

      {t === 'database_task' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
            {dbEmbedUrl
              ? 'Open the database in Data Sculptor and complete the task in there. When you\u2019re done, come back to this page and click Submit \u2014 the AI will mark the database you built.'
              : 'This task is missing a database link. Ask your teacher to add one.'}
          </div>
          {dbEmbedUrl && (
            <div>
              <a
                href={dbEmbedUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '8px 12px', borderRadius: 8, background: 'var(--cw-accent)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
              >Open the database</a>
            </div>
          )}
        </div>
      )}

      {t === 'sql_task' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
            {sqlDbUrl
              ? 'Open the database in Data Sculptor, work out and run your query, then paste the SQL below.'
              : 'Write your SQL query below and submit it for marking.'}
          </div>
          {sqlDbUrl && (
            <div>
              <a
                href={sqlDbUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '8px 12px', borderRadius: 8, background: 'var(--cw-accent)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
              >Open the database</a>
            </div>
          )}
          <textarea
            rows={6}
            placeholder="SELECT * FROM table_name WHERE …"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--cw-border)', fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: 13 }}
          />
        </div>
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

function TeacherSubmissions({ question, submissions, onChanged }: {
  question: Question;
  submissions: Submission[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (submissions.length === 0) {
    return (
      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--cw-muted)' }}>
        No student submissions yet.
      </div>
    );
  }
  // Sort newest first.
  const sorted = [...submissions].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );
  return (
    <details open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      style={{ marginTop: 10 }}>
      <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
        Student submissions ({submissions.length})
      </summary>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((s) => (
          <SubmissionRow key={s.id} question={question} submission={s} onChanged={onChanged} />
        ))}
      </div>
    </details>
  );
}

function SubmissionRow({ question, submission, onChanged }: {
  question: Question;
  submission: Submission;
  onChanged: () => void;
}) {
  const s = submission;
  const [marks, setMarks] = useState<string>(s.marks_awarded != null ? String(s.marks_awarded) : '');
  const [feedback, setFeedback] = useState<string>(s.ai_feedback || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    const n = parseInt(marks, 10);
    if (isNaN(n) || n < 0) {
      setMsg('Mark must be a number ≥ 0.');
      return;
    }
    setBusy(true); setMsg(null);
    try {
      await api(`/api/classwork/submissions/${s.id}/mark`, {
        method: 'PATCH',
        body: JSON.stringify({ marksAwarded: n, feedback }),
      });
      setMsg('Saved.');
      onChanged();
    } catch (e: any) {
      setMsg(e.message || 'Failed to save');
    } finally { setBusy(false); }
  }

  async function remark() {
    setBusy(true); setMsg('Asking the AI to mark again…');
    try {
      const updated = await api<Submission>(`/api/classwork/submissions/${s.id}/remark`, { method: 'POST' });
      setMarks(updated.marks_awarded != null ? String(updated.marks_awarded) : '');
      setFeedback(updated.ai_feedback || '');
      setMsg('AI re-marked.');
      onChanged();
    } catch (e: any) {
      setMsg(e.message || 'Re-mark failed');
    } finally { setBusy(false); }
  }

  return (
    <div style={{ border: '1px solid var(--cw-border)', borderRadius: 8, padding: 12, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 13 }}>
        <div style={{ fontWeight: 700 }}>
          {s.student_username || s.student_id || 'Unknown student'}
        </div>
        <div style={{ color: 'var(--cw-muted)' }}>
          Submitted {new Date(s.submitted_at).toLocaleString()}
          {s.marked_by && <> · marked by {s.marked_by === 'teacher' ? 'teacher' : 'AI'}</>}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <SubmissionAnswer question={question} submission={s} />
      </div>

      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'start' }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Mark<br />
          <span style={{ color: 'var(--cw-muted)', fontWeight: 400, fontSize: 12 }}>out of {question.max_marks}</span>
        </label>
        <input
          type="number" min={0} max={question.max_marks} value={marks}
          onChange={(e) => setMarks(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--cw-border)', borderRadius: 6, width: 100 }}
        />
        <label style={{ fontSize: 13, fontWeight: 600 }}>Feedback</label>
        <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--cw-border)', borderRadius: 6, width: '100%', fontFamily: 'inherit' }} />
      </div>

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={save} disabled={busy} style={{
          background: 'var(--cw-accent)', color: '#fff', border: 'none',
          padding: '6px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13,
        }}>{busy ? 'Working…' : 'Save override'}</button>
        <button onClick={remark} disabled={busy} style={{
          background: '#f1f5f9', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
          padding: '6px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13,
        }}>Re-mark with AI</button>
        {msg && <span style={{ fontSize: 13, color: 'var(--cw-muted)' }}>{msg}</span>}
      </div>
    </div>
  );
}

function SubmissionAnswer({ question, submission }: { question: Question; submission: Submission }) {
  const s = submission;
  const t = question.question_type;
  const muted: React.CSSProperties = { color: 'var(--cw-muted)', fontStyle: 'italic' };

  if (t === 'multiple_choice') {
    const opts = Array.isArray(question.options) ? question.options : [];
    const chosen = opts.find((o: any) => (o.label || '') === (s.selected_option_label || ''));
    return (
      <div style={{ fontSize: 14 }}>
        Selected: <strong>{s.selected_option_label || '—'}</strong>
        {chosen?.text && <> — {chosen.text}</>}
        {chosen && typeof chosen.isCorrect === 'boolean' && (
          <span style={{
            marginLeft: 8, fontSize: 11, padding: '1px 6px', borderRadius: 999,
            background: chosen.isCorrect ? '#dcfce7' : '#fee2e2',
            color: chosen.isCorrect ? '#166534' : '#991b1b',
          }}>{chosen.isCorrect ? 'correct' : 'incorrect'}</span>
        )}
      </div>
    );
  }

  if (['scratch_link', 'makecode_link', 'google_sites_link'].includes(t)) {
    return s.link_url
      ? <a href={s.link_url} target="_blank" rel="noopener noreferrer">{s.link_url}</a>
      : <span style={muted}>No link submitted.</span>;
  }

  if (t === 'screenshot') {
    return s.file_url
      ? <a href={s.file_url} target="_blank" rel="noopener noreferrer">
          <img src={s.file_url} alt="Screenshot" style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 6, border: '1px solid var(--cw-border)' }} />
        </a>
      : <span style={muted}>No screenshot uploaded.</span>;
  }

  if (t === 'project') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {s.file_url && <a href={s.file_url} target="_blank" rel="noopener noreferrer">Download attached file</a>}
        {s.link_url && <a href={s.link_url} target="_blank" rel="noopener noreferrer">{s.link_url}</a>}
        {!s.file_url && !s.link_url && <span style={muted}>Nothing submitted.</span>}
      </div>
    );
  }

  if (t === 'presentation') {
    return s.file_url
      ? <a href={s.file_url} target="_blank" rel="noopener noreferrer">Download .pptx</a>
      : <span style={muted}>No file uploaded.</span>;
  }

  // short / long / code
  const text = s.text_answer || '';
  if (!text) return <span style={muted}>Empty answer.</span>;
  return (
    <pre style={{
      whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, padding: 8,
      background: '#f8fafc', border: '1px solid var(--cw-border)', borderRadius: 6,
      fontFamily: t === 'code' ? 'JetBrains Mono, monospace' : 'inherit',
      fontSize: t === 'code' ? 13 : 14, maxHeight: 280, overflow: 'auto',
    }}>{text}</pre>
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
  const [rubric, setRubric] = useState<{ label: string; marks: number }[]>([]);
  const [useRubric, setUseRubric] = useState(false);
  const [visualMarking, setVisualMarking] = useState(false);
  const [sqlDatabaseUrl, setSqlDatabaseUrl] = useState('');
  const [dbEmbedInput, setDbEmbedInput] = useState('');
  const [isExtension, setIsExtension] = useState(false);
  const [videoKind, setVideoKind] = useState<'youtube' | 'mp4'>('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFileName, setVideoFileName] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function uploadVideo(file: File) {
    setVideoUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const teacherToken = (() => {
        try { return localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken') || ''; } catch { return ''; }
      })();
      const headers: Record<string, string> = {};
      if (teacherToken) headers['x-teacher-password'] = teacherToken;
      const r = await fetch('/api/classwork/teacher/upload/resource', {
        method: 'POST', headers, body: fd,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Upload failed');
      setVideoUrl(data.url);
      setVideoFileName(data.filename || file.name);
    } catch (e: any) {
      setErr(e.message || 'Video upload failed');
    } finally {
      setVideoUploading(false);
    }
  }

  // Seed a sensible default rubric the first time the teacher switches to a
  // presentation question so they aren't faced with an empty list.
  function onTypeChange(next: string) {
    setType(next);
    if (next === 'presentation' && rubric.length === 0) {
      setRubric([
        { label: 'Title slide and clear structure', marks: 1 },
        { label: 'Accurate and well-explained content', marks: 2 },
        { label: 'Use of images, diagrams or examples', marks: 1 },
        { label: 'Clear writing with few mistakes', marks: 1 },
      ]);
      setMaxMarks(5);
    }
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const body: any = {
        questionType: type, prompt, maxMarks, markingScheme, aiGradingGuidance: aiGuidance,
        isExtension,
      };
      if (type === 'multiple_choice') body.options = options;
      if (type === 'presentation') {
        const cfg: any = {};
        if (useRubric) {
          const cleaned = rubric
            .map((r) => ({ label: r.label.trim(), marks: Math.max(0, Math.round(r.marks || 0)) }))
            .filter((r) => r.label && r.marks > 0);
          if (cleaned.length) cfg.rubric = cleaned;
        }
        if (visualMarking) cfg.visualMarking = true;
        if (Object.keys(cfg).length) body.config = cfg;
      }
      if (type === 'sql_task' && sqlDatabaseUrl.trim()) {
        body.config = { databaseUrl: sqlDatabaseUrl.trim() };
      }
      if (type === 'database_task') {
        const raw = dbEmbedInput.trim();
        if (!raw) throw new Error('Please paste a Data Sculptor embed link or token.');
        // Accept either a full embed URL ("…/data-sculptor/?embed=TOKEN") or
        // just the bare token. Reject anything that doesn't look like one.
        let token = raw;
        const m = raw.match(/[?&]embed=([A-Za-z0-9_-]+)/);
        if (m) token = m[1];
        if (!/^[A-Za-z0-9_-]{8,}$/.test(token)) {
          throw new Error('That doesn\u2019t look like a Data Sculptor embed link or token.');
        }
        body.config = { embedToken: token, embedUrl: raw };
      }
      if (type === 'video_question') {
        if (!videoUrl.trim()) {
          throw new Error(videoKind === 'youtube'
            ? 'Please paste a YouTube URL.'
            : 'Please upload a video file.');
        }
        if (videoKind === 'youtube' && !youtubeIdFromUrl(videoUrl)) {
          throw new Error('That doesn\u2019t look like a YouTube URL.');
        }
        body.config = { video: { kind: videoKind, url: videoUrl.trim() } };
      }
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

  const rubricTotal = rubric.reduce((a, r) => a + (Number(r.marks) || 0), 0);

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>New question</h2>
        <label style={fieldLabel}>Type
          <select value={type} onChange={(e) => onTypeChange(e.target.value)} style={input}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label style={fieldLabel}>Question / prompt
          <textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} style={input} />
        </label>
        <label style={fieldLabel}>Max marks
          <input type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(parseInt(e.target.value) || 1)} style={input} />
        </label>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={isExtension} onChange={(e) => setIsExtension(e.target.checked)} style={{ marginTop: 3 }} />
          <span>
            <span style={{ fontWeight: 600 }}>Extension activity</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--cw-muted)' }}>
              Pupils still get AI feedback and a mark, but this question is hidden from class
              analytics — it won't drag the class average down or count as missing work.
            </span>
          </span>
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
        {type === 'database_task' && (
          <div style={fieldLabel as any}>
            <div style={{ fontSize: 13, color: 'var(--cw-muted)', marginBottom: 6 }}>
              Pupils open a Data Sculptor sandbox and either design or populate a database in
              there. Each pupil gets their own forked copy of the database you paste below. Paste
              the embed link from Data Sculptor — pupils click "Open the database", do the work,
              then come back and click Submit. The same AI grader the DS embed uses will mark
              their work against your task description (one mark per bullet point).
            </div>
            <input
              type="text"
              placeholder="https://www.bhs-computing.co.uk/data-sculptor/?embed=…  (or just the token)"
              value={dbEmbedInput}
              onChange={(e) => setDbEmbedInput(e.target.value)}
              style={input}
            />
            <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>
              Tip: write your task instructions as a bullet-pointed list in the Question field
              above and (optionally) a data dictionary in the marking scheme — that's what gives
              the AI marker its rubric.
            </div>
          </div>
        )}
        {type === 'sql_task' && (
          <div style={fieldLabel as any}>
            <div style={{ fontSize: 13, color: 'var(--cw-muted)', marginBottom: 6 }}>
              Pupils write a SQL query against a Data Sculptor database. Paste the database's
              share link below — it will appear as an "Open the database" button on the question
              so pupils can run their query in DS, then paste the SQL back to submit.
            </div>
            <input
              type="url"
              placeholder="https://…/data-sculptor/?embed=… (or any Data Sculptor URL)"
              value={sqlDatabaseUrl}
              onChange={(e) => setSqlDatabaseUrl(e.target.value)}
              style={input}
            />
            <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>
              Optional — leave blank if pupils should write SQL without an attached database.
              The AI marks the SQL itself, not the result, so be specific in your marking scheme.
            </div>
          </div>
        )}
        {(type === 'python_task' || type === 'html_task') && (
          <div style={fieldLabel as any}>
            <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
              Pupils pick one of their saved {type === 'python_task' ? 'Python' : 'HTML/CSS'} projects
              from the in-site editor and submit it. The AI reads the code (it doesn't run it) and
              marks against your marking scheme. Make sure your marking scheme spells out what the
              code should do.
            </div>
          </div>
        )}
        {type === 'video_question' && (
          <div style={fieldLabel as any}>
            <div style={{ fontSize: 13, color: 'var(--cw-muted)', marginBottom: 6 }}>
              Pupils watch the video then type their answer below it. The AI marker reads the
              pupil's written answer against your marking scheme — it does not watch the video,
              so make sure your marking points are clear.
            </div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                <input type="radio" name="vk" checked={videoKind === 'youtube'}
                  onChange={() => { setVideoKind('youtube'); setVideoUrl(''); setVideoFileName(''); }} />
                YouTube link
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                <input type="radio" name="vk" checked={videoKind === 'mp4'}
                  onChange={() => { setVideoKind('mp4'); setVideoUrl(''); setVideoFileName(''); }} />
                Upload a video file (.mp4 / .webm / .mov, up to 20 MB)
              </label>
            </div>
            {videoKind === 'youtube' ? (
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=…"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                style={input}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  type="file"
                  accept=".mp4,.webm,.mov,.m4v,video/mp4,video/webm,video/quicktime"
                  disabled={videoUploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadVideo(f); }}
                />
                {videoFileName && (
                  <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
                    Attached: <strong>{videoFileName}</strong>
                  </div>
                )}
                {videoUploading && <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>Uploading…</div>}
              </div>
            )}
          </div>
        )}
        {type === 'presentation' && (
          <div style={fieldLabel as any}>
            <div style={{ fontSize: 13, color: 'var(--cw-muted)', marginBottom: 6 }}>
              Pupils upload a PowerPoint (.pptx). By default the AI marker reads slide text,
              speaker notes and counts embedded images — it can't see colours, fonts or layout
              unless you turn on visual marking below.
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input type="checkbox" checked={useRubric} onChange={(e) => setUseRubric(e.target.checked)} />
              Use a rubric (mark each criterion separately)
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, marginTop: 6 }}>
              <input
                type="checkbox" checked={visualMarking}
                onChange={(e) => setVisualMarking(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                Visual marking (slower, more accurate)
                <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 2 }}>
                  Renders every slide to an image and lets the AI see layout, colour and pictures.
                  Marking takes ~10-30 seconds per pupil and uses more API tokens. First 25 slides only.
                </div>
              </span>
            </label>
            {useRubric && (
              <div style={{ marginTop: 8 }}>
                {rubric.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <input
                      placeholder="Criterion (e.g. Accurate content)"
                      value={r.label}
                      onChange={(e) => { const a = [...rubric]; a[i].label = e.target.value; setRubric(a); }}
                      style={{ ...input, flex: 1 }}
                    />
                    <input
                      type="number" min={0}
                      value={r.marks}
                      onChange={(e) => { const a = [...rubric]; a[i].marks = parseInt(e.target.value) || 0; setRubric(a); }}
                      style={{ ...input, width: 80 }}
                    />
                    <button onClick={() => setRubric(rubric.filter((_, j) => j !== i))}
                      style={{ ...input, width: 40, cursor: 'pointer' }}>×</button>
                  </div>
                ))}
                <button onClick={() => setRubric([...rubric, { label: '', marks: 1 }])}
                  style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', cursor: 'pointer' }}>
                  + Add criterion
                </button>
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--cw-muted)' }}>
                  Rubric total: <strong>{rubricTotal}</strong> · Max marks: <strong>{maxMarks}</strong>
                  {rubricTotal !== maxMarks && (
                    <> — these don't match. The AI marker will cap the total at {Math.min(rubricTotal, maxMarks)}.</>
                  )}
                </div>
              </div>
            )}
            {!useRubric && (
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--cw-muted)' }}>
                Without a rubric the AI gives one holistic mark out of {maxMarks}.
              </div>
            )}
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

function youtubeIdFromUrl(url: string): string | null {
  // Accepts watch?v=, youtu.be/, embed/, shorts/.
  const patterns = [
    /youtu\.be\/([\w-]{6,})/i,
    /[?&]v=([\w-]{6,})/i,
    /youtube\.com\/embed\/([\w-]{6,})/i,
    /youtube\.com\/shorts\/([\w-]{6,})/i,
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

function VideoQuestionPlayer({ config }: { config: any }) {
  const v = config && typeof config === 'object' ? config.video : null;
  if (!v || typeof v !== 'object' || !v.url) {
    return (
      <div style={{ marginTop: 10, padding: 10, border: '1px dashed var(--cw-border)', borderRadius: 8, fontSize: 14, color: 'var(--cw-muted)' }}>
        No video has been attached to this question yet.
      </div>
    );
  }
  if (v.kind === 'youtube') {
    const id = youtubeIdFromUrl(String(v.url));
    if (!id) {
      return (
        <div style={{ marginTop: 10, fontSize: 14, color: 'var(--cw-danger)' }}>
          The attached YouTube link couldn't be read. <a href={v.url} target="_blank" rel="noopener noreferrer">Open it in a new tab.</a>
        </div>
      );
    }
    return (
      <div style={{ marginTop: 10, position: 'relative', paddingTop: '56.25%', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title="Video question"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      </div>
    );
  }
  // mp4 / webm / mov
  return (
    <video
      controls
      preload="metadata"
      src={v.url}
      style={{ marginTop: 10, width: '100%', maxHeight: 480, borderRadius: 8, background: '#000' }}
    >
      Your browser can't play this video. <a href={v.url} target="_blank" rel="noopener noreferrer">Download it</a>.
    </video>
  );
}

function LessonResources({ resources }: { resources: LessonResource[] }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--cw-border)', borderRadius: 12,
      padding: 18, marginTop: 14, boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
    }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--cw-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Resources
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {resources.map((r) => {
          const title = r.title || r.url;
          if (r.kind === 'youtube') {
            const id = youtubeIdFromUrl(r.url);
            if (!id) {
              return (
                <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                   style={{ color: 'var(--cw-accent)' }}>{title}</a>
              );
            }
            return (
              <figure key={r.id} style={{ margin: 0 }}>
                {r.title && <figcaption style={{ fontWeight: 600, marginBottom: 6 }}>{r.title}</figcaption>}
                <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${id}`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                  />
                </div>
              </figure>
            );
          }
          if (r.kind === 'embed') {
            return (
              <figure key={r.id} style={{ margin: 0 }}>
                {r.title && <figcaption style={{ fontWeight: 600, marginBottom: 6 }}>{r.title}</figcaption>}
                <div style={{
                  position: 'relative', borderRadius: 8, overflow: 'hidden',
                  background: '#000', border: '1px solid var(--cw-border)',
                  height: 600, maxHeight: '80vh',
                }}>
                  <iframe
                    src={r.url}
                    title={title}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-pointer-lock allow-downloads"
                    allow="autoplay; fullscreen; clipboard-write; gamepad; microphone; camera; geolocation"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#fff' }}
                  />
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--cw-muted)' }}>
                  Trouble loading? <a href={r.url} target="_blank" rel="noopener noreferrer">Open in a new tab</a>.
                </div>
              </figure>
            );
          }
          if (r.kind === 'image') {
            return (
              <figure key={r.id} style={{ margin: 0 }}>
                <img
                  src={r.url} alt={title}
                  style={{ maxWidth: '100%', maxHeight: 480, borderRadius: 8, border: '1px solid var(--cw-border)', display: 'block' }}
                />
                {r.title && (
                  <figcaption style={{ marginTop: 6, fontSize: 13, color: 'var(--cw-muted)' }}>{r.title}</figcaption>
                )}
              </figure>
            );
          }
          // document or generic link
          const isDoc = r.kind === 'document';
          return (
            <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
               style={{
                 display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                 background: '#f8fafc', border: '1px solid var(--cw-border)', borderRadius: 8,
                 color: 'var(--cw-ink)', textDecoration: 'none', fontWeight: 600,
                 alignSelf: 'flex-start', maxWidth: '100%',
               }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: isDoc ? '#fef3c7' : '#e0e7ff',
                color: isDoc ? '#92400e' : '#3730a3',
                textTransform: 'uppercase', flex: '0 0 auto',
              }}>{isDoc ? 'Document' : 'Link'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isDoc ? `Open: ${title}` : title}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function LessonHeader({ lesson }: { lesson: LessonInfo }) {
  // Split a textarea blob into bullet-style lines, ignoring blank lines and
  // any leading "- ", "* " or numbered prefix the teacher may have pasted.
  const toLines = (raw: string | null | undefined): string[] => {
    if (!raw) return [];
    return raw.split(/\r?\n/)
      .map((s) => s.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
      .filter(Boolean);
  };
  const li = toLines(lesson.learning_intentions);
  const sc = toLines(lesson.success_criteria);
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--cw-border)', borderRadius: 12,
      padding: 18, boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
    }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>{lesson.title}</h1>
      {(li.length > 0 || sc.length > 0) && (
        <div style={{
          display: 'grid', gridTemplateColumns: li.length && sc.length ? '1fr 1fr' : '1fr',
          gap: 18, marginTop: 14,
        }}>
          {li.length > 0 && (
            <section style={{
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 8, padding: '12px 14px',
            }}>
              <h2 style={{ margin: 0, fontSize: 14, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Learning intentions
              </h2>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--cw-ink)', fontSize: 14, lineHeight: 1.5 }}>
                {li.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </section>
          )}
          {sc.length > 0 && (
            <section style={{
              background: '#ecfdf5', border: '1px solid #a7f3d0',
              borderRadius: 8, padding: '12px 14px',
            }}>
              <h2 style={{ margin: 0, fontSize: 14, color: '#065f46', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Success criteria
              </h2>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--cw-ink)', fontSize: 14, lineHeight: 1.5 }}>
                {sc.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
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
