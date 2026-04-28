import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import Shell from '@/components/Shell';
import PromptText from '@/components/PromptText';
import { api, getCurrentRole } from '@/lib/api';

interface LessonInfo {
  id: string;
  title: string;
  learning_intentions: string | null;
  success_criteria: string | null;
  is_published: boolean;
  // Returned by GET /api/classwork/lessons/:id (selected by getLesson()) but
  // previously not declared on the client. Used here to power the "My jotter"
  // link in the lesson header so teachers can demo it to a class.
  course?: string;
  unit_id?: string;
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
  is_extension?: boolean;
  passage_id?: string | null;
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
  passage: 'Reading passage (with attached tasks)',
  info_only: 'Information note (no answer needed)',
  fill_in_blanks: 'Fill in the blanks',
  table: 'Complete the table',
  labeled_inputs: 'Labelled inputs (multi-field answer)',
  section_header: 'Section divider (groups the tasks below)',
  text_only: 'Offline task (work in your jotter)',
};

export default function Lesson() {
  const [, params] = useRoute('/lesson/:id');
  const lessonId = params?.id || '';
  const role = getCurrentRole();
  const [lesson, setLesson] = useState<LessonInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allSubs, setAllSubs] = useState<Submission[]>([]);
  // Pre-fetched per-question resources, keyed by question_id. Populated by a
  // single bulk request so that each <QuestionResources> card doesn't have to
  // make its own HTTP call on mount (used to be N+1 — one per question).
  const [resourcesByQuestion, setResourcesByQuestion] = useState<Record<string, LessonResource[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [previewAsStudent, setPreviewAsStudent] = useState(false);
  const showStudentView = role === 'student' || (role === 'teacher' && previewAsStudent);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      // Fire EVERY initial request in parallel — info, questions, the bulk
      // resource map, AND the role-appropriate submissions list. Previously
      // submissions were awaited only after info+questions returned, so the
      // page sat blank for an extra round-trip on slow connections.
      const submissionsP: Promise<Submission[]> = role === 'student'
        ? api<Submission[]>(`/api/classwork/lessons/${lessonId}/my-submissions`).catch(() => [])
        : role === 'teacher'
          ? api<Submission[]>(`/api/classwork/lessons/${lessonId}/submissions`).catch(() => [])
          : Promise.resolve([]);
      const [info, qs, resMap, subs] = await Promise.all([
        api<LessonInfo>(`/api/classwork/lessons/${lessonId}`).catch(() => null),
        api<Question[]>(`/api/classwork/lessons/${lessonId}/questions`),
        api<Record<string, LessonResource[]>>(`/api/classwork/lessons/${lessonId}/all-question-resources`).catch(() => ({})),
        submissionsP,
      ]);
      setLesson(info);
      setQuestions(qs);
      setResourcesByQuestion(resMap || {});
      if (role === 'student') setSubmissions(subs);
      else if (role === 'teacher') setAllSubs(subs);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: lesson ? 16 : 0 }}>
        <h1 style={{ margin: 0 }}>Tasks</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* "Open my jotter" — visible to BOTH pupils and teachers. Teachers
              get their own demo jotter (server keys it as "teacher:demo") so
              they can model note-taking in front of a class without writing
              into any pupil's notes. */}
          {(role === 'student' || role === 'teacher') && (
            <Link
              href={role === 'teacher' && lesson?.course ? `/jotter?course=${lesson.course}` : '/jotter'}
              style={{
                display: 'inline-block',
                background: '#ecfeff', color: '#0e7490', border: '1px solid #67e8f9',
                padding: '8px 14px', borderRadius: 8, fontWeight: 600, textDecoration: 'none',
              }}
              title={role === 'teacher'
                ? 'Open your demo jotter — what pupils see when they click "My jotter"'
                : 'Open your year-long notes jotter'}
            >
              {role === 'teacher' ? 'Open demo jotter' : 'Open my jotter'}
            </Link>
          )}
          {role === 'teacher' && (
          <>
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
            {!previewAsStudent && <NewQuestionButton
              lessonId={lessonId}
              passages={questions.filter((q) => q.question_type === 'passage')}
              onCreated={refresh}
            />}
          </>
          )}
        </div>
      </div>

      {role === 'teacher' && previewAsStudent && (
        <div style={{
          marginTop: 12, padding: '8px 12px', background: '#fef3c7', border: '1px solid #fde68a',
          color: '#854d0e', borderRadius: 8, fontSize: 13,
        }}>
          You are previewing this lesson as a student. Submit any answer to see
          the AI feedback your pupils would get &mdash; nothing is saved to the
          submissions table.
        </div>
      )}

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: 'var(--cw-danger)' }}>{err}</p>}
      {!loading && !err && questions.length === 0 && (
        <p style={{ color: 'var(--cw-muted)', marginTop: 24 }}>
          {role === 'teacher' ? 'No tasks yet — add the first one above.' : 'Your teacher hasn\u2019t added any tasks yet.'}
        </p>
      )}

      {(() => {
        const mainQs = questions.filter((q) => !q.is_extension);
        const extQs  = questions.filter((q) => !!q.is_extension);

        // Build a render plan: each passage groups any later-or-earlier questions
        // whose passage_id matches it. Standalone (non-passage, non-attached)
        // questions render as before. Passages whose id no-one references still
        // render as a single passage card.
        type Item = { type: 'standalone'; q: Question } | { type: 'group'; passage: Question; children: Question[] };
        const buildItems = (qs: Question[]): Item[] => {
          const consumed = new Set<string>();
          const items: Item[] = [];
          for (const q of qs) {
            if (consumed.has(q.id)) continue;
            if (q.question_type === 'passage') {
              const children = qs.filter((c) =>
                c.id !== q.id && c.question_type !== 'passage' && c.passage_id === q.id && !consumed.has(c.id)
              );
              children.forEach((c) => consumed.add(c.id));
              consumed.add(q.id);
              items.push({ type: 'group', passage: q, children });
            } else {
              consumed.add(q.id);
              items.push({ type: 'standalone', q });
            }
          }
          return items;
        };

        // A simple counter so non-passage questions across standalones AND
        // groups share one continuous Q1, Q2, Q3… numbering.
        const renderQuestionCard = (q: Question, label: string, isExt: boolean) => {
          const mySubs = submissions.filter((s) => s.question_id === q.id);
          const isInfo = q.question_type === 'info_only';
          const isTextOnly = q.question_type === 'text_only';
          // Both info_only and text_only are "no answer" cards. Treat them
          // uniformly for the gates that hide the answer area, but use a
          // distinct cyan tint for text_only so pupils can spot offline tasks
          // at a glance.
          const isNoAnswer = isInfo || isTextOnly;
          return (
            <div key={q.id} style={{
              ...card,
              ...(isExt ? { borderColor: '#c084fc', background: '#faf5ff' } : {}),
              ...(isInfo ? { borderColor: '#93c5fd', background: '#eff6ff' } : {}),
              ...(isTextOnly ? { borderColor: '#67e8f9', background: '#ecfeff' } : {}),
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {q.question_type !== 'passage' && !isInfo && (
                    <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>{q.max_marks} mark{q.max_marks === 1 ? '' : 's'}</div>
                  )}
                  {role === 'teacher' && !previewAsStudent && (
                    <EditQuestionButton
                      question={q}
                      passages={questions.filter((x) => x.question_type === 'passage')}
                      onChanged={refresh}
                    />
                  )}
                </div>
              </div>
              <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}><PromptText text={q.prompt} /></p>

              {q.question_type === 'video_question' && <VideoQuestionPlayer config={q.config} />}

              {q.question_type === 'presentation' && q.config && typeof q.config === 'object' && (q.config as any).starterFileUrl && (
                <div style={{
                  marginTop: 8, padding: '10px 12px', borderRadius: 8,
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                }}>
                  <span style={{ fontWeight: 600 }}>Starter presentation:</span>
                  <a
                    href={(q.config as any).starterFileUrl}
                    download={(q.config as any).starterFileName || undefined}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 6,
                      background: '#fff', border: '1px solid #bfdbfe',
                      color: '#1e40af', fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    Download {((q.config as any).starterFileName as string | undefined) || 'starter.pptx'}
                  </a>
                  <span style={{ fontSize: 12, color: 'var(--cw-muted)' }}>
                    Open it in PowerPoint, edit it, then upload your finished version below.
                  </span>
                </div>
              )}

              <QuestionResources
                questionId={q.id}
                isTeacher={role === 'teacher' && !previewAsStudent}
                initialResources={resourcesByQuestion[q.id] || []}
              />

              {role === 'teacher' && !previewAsStudent && !isNoAnswer && (
                <details style={{ marginTop: 8, fontSize: 14, color: 'var(--cw-muted)' }}>
                  <summary style={{ cursor: 'pointer' }}>Marking scheme &amp; AI guidance</summary>
                  <div style={{ marginTop: 8 }}>
                    <div><strong>Marking scheme:</strong> {q.marking_scheme || '—'}</div>
                    <div style={{ marginTop: 4 }}><strong>AI guidance:</strong> {q.ai_grading_guidance || '—'}</div>
                  </div>
                </details>
              )}

              {/* Offline-task callout: visible to pupils AND to teachers
                  (so a teacher previewing or browsing the lesson sees the
                  exact same prompt-and-jotter-link experience pupils get). */}
              {isTextOnly && (
                <div style={{
                  marginTop: 12, padding: '12px 14px', borderRadius: 8,
                  background: '#fff', border: '1px dashed #67e8f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 12, flexWrap: 'wrap',
                }}>
                  <span style={{ color: '#0e7490', fontSize: 14 }}>
                    No answer to type here &mdash; do this task in your jotter
                    (writing, sketches, screenshots&hellip;).
                  </span>
                  <Link
                    href="/jotter"
                    style={{
                      display: 'inline-block',
                      background: '#0891b2', color: '#fff', border: '1px solid #0891b2',
                      padding: '6px 14px', borderRadius: 6, fontWeight: 600, textDecoration: 'none',
                      fontSize: 14,
                    }}
                  >
                    {role === 'teacher' ? 'Open demo jotter' : 'Open my jotter'}
                  </Link>
                </div>
              )}

              {showStudentView && !isNoAnswer && (
                <StudentAnswer
                  question={q}
                  previousSubmissions={mySubs}
                  onSubmitted={refresh}
                  preview={role === 'teacher' && previewAsStudent}
                />
              )}
              {role === 'teacher' && !previewAsStudent && !isNoAnswer && (
                <TeacherSubmissions
                  question={q}
                  submissions={allSubs.filter((s) => s.question_id === q.id)}
                  onChanged={refreshSubmissions}
                />
              )}
              {role === 'guest' && !isNoAnswer && (
                <p style={{ marginTop: 8, color: 'var(--cw-muted)', fontSize: 14 }}>
                  Sign in as a student to answer this task.
                </p>
              )}
            </div>
          );
        };

        // The passage panel: a card with the passage prompt + its own resources.
        // No marks, no marking scheme, no answer area — it's reading material only.
        const renderPassagePanel = (p: Question, label: string) => (
          <div style={{
            ...card,
            background: '#fffbeb', borderColor: '#fcd34d',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#92400e' }}>
              <span style={{
                fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase',
                padding: '2px 8px', borderRadius: 999, background: '#f59e0b', color: '#fff',
              }}>Passage</span>
              <span>{label}</span>
            </div>
            <p style={{ marginTop: 8, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
              <PromptText text={p.prompt} />
            </p>
            <QuestionResources
              questionId={p.id}
              isTeacher={role === 'teacher' && !previewAsStudent}
              initialResources={resourcesByQuestion[p.id] || []}
            />
          </div>
        );

        // A section divider — purely visual grouping. No marks, no answer area,
        // no resources. Used by teachers to break a long lesson into "Section A",
        // "Section B" etc. Question numbering continues across sections so
        // existing analytics (which key off question_id) stay correct.
        const renderSectionHeader = (s: Question) => {
          const title = (s.prompt || '').trim() || 'Section';
          return (
            <div key={s.id} style={{
              marginTop: 18, padding: '10px 14px', borderRadius: 8,
              background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)',
              border: '1px solid #cbd5e1', borderLeft: '4px solid var(--cw-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
            }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{title}</div>
              {role === 'teacher' && !previewAsStudent && (
                <EditQuestionButton
                  question={s}
                  passages={questions.filter((x) => x.question_type === 'passage')}
                  onChanged={refresh}
                />
              )}
            </div>
          );
        };

        // Run buildItems on main and extension lists separately so extensions stay
        // in their own section. Numbering (qIdx, pIdx) is shared so pupils see
        // a single continuous Q-sequence within each section.
        const renderItems = (items: Item[], isExt: boolean, prefix: 'Q' | 'E') => {
          let qIdx = 0;
          let pIdx = 0;
          const totalPassages = items.filter((it) => it.type === 'group').length;
          return items.map((it) => {
            if (it.type === 'standalone') {
              if (it.q.question_type === 'info_only') {
                return renderQuestionCard(it.q, 'Note', isExt);
              }
              if (it.q.question_type === 'text_only') {
                // Use a "Task" label (instead of "Q1, Q2…") so it's clearly
                // an offline activity, not a markable question. Counter is
                // not bumped — text_only is ignored in analytics.
                return renderQuestionCard(it.q, 'Task', isExt);
              }
              if (it.q.question_type === 'section_header') {
                return renderSectionHeader(it.q);
              }
              qIdx++;
              return renderQuestionCard(it.q, `${prefix}${qIdx}`, isExt);
            }
            pIdx++;
            const passageLabel = totalPassages > 1 ? `Passage ${pIdx}` : 'Passage';
            // Two-column sticky layout on desktop; stacks on narrow screens via
            // the global @media block at the bottom of this file. Passage stays
            // visible on the left while pupils scroll the questions on the right.
            return (
              <div
                key={it.passage.id}
                className="cw-passage-group"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(280px, 38%) 1fr',
                  gap: 16,
                  alignItems: 'start',
                }}
              >
                <div style={{ position: 'sticky', top: 16 }}>
                  {renderPassagePanel(it.passage, passageLabel)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {it.children.length === 0 ? (
                    <p style={{ color: 'var(--cw-muted)', fontStyle: 'italic', margin: 0 }}>
                      No tasks are attached to this passage yet.
                    </p>
                  ) : it.children.map((c) => {
                    qIdx++;
                    return renderQuestionCard(c, `${prefix}${qIdx}`, isExt);
                  })}
                </div>
              </div>
            );
          });
        };

        return (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
              {renderItems(buildItems(mainQs), false, 'Q')}
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
                  {renderItems(buildItems(extQs), true, 'E')}
                </div>
              </div>
            )}
          </>
        );
      })()}
      <style>{`
        @media (max-width: 800px) {
          .cw-passage-group { grid-template-columns: 1fr !important; }
          .cw-passage-group > div:first-child { position: static !important; }
        }
      `}</style>
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
  // fill_in_blanks / table / labeled_inputs: a flat object keyed by blank id
  // ("1", "2") for fill_in_blanks, "row,col" for table, or field index ("0",
  // "1") for labeled_inputs. Submitted as JSON in textAnswer so the marker
  // can compare each cell against its expected answers.
  const [cellAnswers, setCellAnswers] = useState<Record<string, string>>({});

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

  // Holds the AI feedback the teacher sees after pressing Submit in preview
  // mode. Kept separate from `msg` (the one-line status) and from `last` (the
  // pupil's real previous submission, which preview must never overwrite).
  // Cleared whenever the question is re-attempted.
  const [previewResult, setPreviewResult] = useState<
    { marksAwarded: number | null; feedback: string | null; maxMarks: number; note?: string } | null
  >(null);

  async function submit() {
    setBusy(true);
    setMsg(preview ? 'Running AI marker…' : 'Submitting and marking…');
    if (preview) setPreviewResult(null);
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
        // python_task / html_task — in real submission we pull the latest code
        // from the chosen project. In preview mode the teacher hasn't picked
        // (or created) a project, so we just send whatever they've typed in
        // the textarea below as a quick code sample for the AI to mark.
        if (preview) {
          body.textAnswer = text;
        } else {
          if (!selectedProjectId) throw new Error('Please pick a project to submit.');
          const token = localStorage.getItem('studentToken') || '';
          const r = await fetch(`/api/code-projects/${codeProjectKind}/${encodeURIComponent(selectedProjectId)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (!r.ok) throw new Error('Could not load that project.');
          const data = await r.json();
          body.textAnswer = String(data?.code ?? '');
          body.linkUrl = `${selectedProjectId}|${data?.name || ''}`;
        }
      } else if (t === 'fill_in_blanks' || t === 'table' || t === 'labeled_inputs') {
        // Send the cell answers as JSON so the deterministic marker can
        // compare each one against the expected answers in the question config.
        body.textAnswer = JSON.stringify(cellAnswers);
      } else if (t === 'database_task') {
        // Resolve the pupil's DS embed sandbox from their session key
        // (mirrored to localStorage by the embed app on the same origin).
        // In preview mode the teacher has no DS sandbox of their own, so we
        // skip the AI call and tell them up front rather than 500ing.
        if (preview) {
          setPreviewResult({
            marksAwarded: null, feedback: null, maxMarks: question.max_marks,
            note: 'Database tasks need a real pupil sandbox to mark, so this task type can\u2019t be tried in preview. Open the database link to sanity-check it manually.',
          });
          setMsg(null);
          return;
        }
        if (!dbEmbedToken) throw new Error('This task is missing its database link. Ask your teacher to add one.');
        const sessionKey = localStorage.getItem('student_session_key');
        if (!sessionKey) throw new Error('Please open the database first, do your work, then come back and submit.');
        body.linkUrl = `${dbEmbedToken}|${sessionKey}`;
      } else body.textAnswer = text; // short / long / code / video_question / sql_task

      if (preview) {
        // Dry-run: hit the teacher-only /try endpoint which runs the same AI
        // marker but does NOT touch the submissions table.
        const tryResult = await api<{
          marksAwarded: number | null; feedback: string | null; maxMarks: number; note?: string;
        }>(`/api/classwork/questions/${question.id}/try`, {
          method: 'POST', body: JSON.stringify(body),
        });
        setPreviewResult(tryResult);
        setMsg(null);
        // Note: do NOT clear inputs or call onSubmitted() — the teacher may
        // want to tweak their answer and re-run the marker to see how the
        // feedback changes.
        return;
      }

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
    (t === 'fill_in_blanks' || t === 'table' || t === 'labeled_inputs')
      ? Object.values(cellAnswers).some((v) => String(v || '').trim()) :
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

      {t === 'fill_in_blanks' && (() => {
        const cfg = (question as any).config;
        const blanks: { id: string }[] = cfg && Array.isArray(cfg.blanks)
          ? cfg.blanks.map((b: any) => ({ id: String(b?.id ?? '') })).filter((b: any) => b.id)
          : [];
        if (blanks.length === 0) {
          return <span style={{ color: 'var(--cw-muted)', fontSize: 13 }}>This task has no blanks set up yet. Ask your teacher to fix it.</span>;
        }
        // Render the prompt with text inputs substituted in for each {{n}}
        // marker. Anything between markers is plain text shown around them.
        const parts = (question.prompt || '').split(/(\{\{\s*[A-Za-z0-9_]+\s*\}\})/g);
        const usedIds = new Set<string>();
        return (
          <div style={{ display: 'block', lineHeight: 2.2, fontSize: 15 }}>
            {parts.map((part, i) => {
              const m = part.match(/^\{\{\s*([A-Za-z0-9_]+)\s*\}\}$/);
              if (!m) return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
              const id = m[1];
              usedIds.add(id);
              return (
                <input
                  key={i}
                  type="text"
                  value={cellAnswers[id] || ''}
                  onChange={(e) => setCellAnswers({ ...cellAnswers, [id]: e.target.value })}
                  placeholder={`(${id})`}
                  style={{
                    display: 'inline-block', minWidth: 90, margin: '0 4px',
                    padding: '4px 8px', borderRadius: 6,
                    border: '2px solid var(--cw-accent)', background: '#fff',
                    fontSize: 14,
                  }}
                />
              );
            })}
            {/* Any blanks that aren't referenced from the prompt still need an input */}
            {blanks.filter((b) => !usedIds.has(b.id)).length > 0 && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--cw-muted)' }}>
                Extra blanks:
                {blanks.filter((b) => !usedIds.has(b.id)).map((b) => (
                  <span key={b.id} style={{ marginLeft: 8 }}>
                    {b.id}:&nbsp;
                    <input
                      type="text" value={cellAnswers[b.id] || ''}
                      onChange={(e) => setCellAnswers({ ...cellAnswers, [b.id]: e.target.value })}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--cw-border)' }}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {t === 'table' && (() => {
        const cfg = (question as any).config;
        const table = cfg && cfg.table;
        if (!table || !Array.isArray(table.headers) || !Array.isArray(table.rows)) {
          return <span style={{ color: 'var(--cw-muted)', fontSize: 13 }}>This table isn't set up yet. Ask your teacher to fix it.</span>;
        }
        return (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
              <thead>
                <tr>
                  {table.headers.map((h: string, i: number) => (
                    <th key={i} style={{
                      border: '1px solid var(--cw-border)', padding: '8px 10px',
                      background: '#1e3a8a', color: '#fff', textAlign: 'left',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row: any[], r: number) => (
                  <tr key={r}>
                    {Array.isArray(row) && row.map((cell: any, c: number) => (
                      <td key={c} style={{
                        border: '1px solid var(--cw-border)', padding: '6px 8px',
                        background: cell?.blank ? '#fffbeb' : '#fff',
                      }}>
                        {cell?.blank ? (
                          <input
                            type="text"
                            value={cellAnswers[`${r},${c}`] || ''}
                            onChange={(e) => setCellAnswers({ ...cellAnswers, [`${r},${c}`]: e.target.value })}
                            style={{
                              width: '100%', padding: '4px 6px', borderRadius: 4,
                              border: '2px solid var(--cw-accent)', background: '#fff', fontSize: 14,
                            }}
                          />
                        ) : (
                          <span>{String(cell?.value ?? '')}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}

      {t === 'labeled_inputs' && (() => {
        const cfg = (question as any).config;
        const fields: { label: string }[] = cfg && Array.isArray(cfg.fields)
          ? cfg.fields.map((f: any) => ({ label: String(f?.label || '') }))
          : [];
        if (fields.length === 0) {
          return <span style={{ color: 'var(--cw-muted)', fontSize: 13 }}>No fields are set up yet. Ask your teacher to fix it.</span>;
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fields.map((f, i) => (
              <label key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
                <span style={{ fontWeight: 600 }}>{f.label || `Field ${i + 1}`}</span>
                <input
                  type="text"
                  value={cellAnswers[String(i)] || ''}
                  onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}
                  style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--cw-border)' }}
                />
              </label>
            ))}
          </div>
        );
      })()}

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

      {preview && previewResult && (
        <div style={{
          marginTop: 12, padding: '10px 12px', background: '#ecfeff',
          border: '1px solid #a5f3fc', borderRadius: 8, fontSize: 13,
          color: 'var(--cw-ink)',
        }}>
          <strong style={{ color: '#155e75' }}>Preview AI feedback</strong>
          {previewResult.marksAwarded != null && (
            <> &middot; {previewResult.marksAwarded}/{previewResult.maxMarks} marks</>
          )}
          {previewResult.feedback && (
            <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{previewResult.feedback}</div>
          )}
          {previewResult.note && (
            <div style={{ marginTop: 6, color: 'var(--cw-muted)', fontStyle: 'italic' }}>
              {previewResult.note}
            </div>
          )}
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

  if (t === 'fill_in_blanks' || t === 'table' || t === 'labeled_inputs') {
    let parsed: Record<string, string> = {};
    try { parsed = JSON.parse(s.text_answer || '{}') || {}; } catch {}
    const keys = Object.keys(parsed);
    if (keys.length === 0) return <span style={muted}>Nothing submitted.</span>;
    // For labelled inputs we can show field labels alongside the indices.
    const labels: Record<string, string> = {};
    if (t === 'labeled_inputs') {
      const cfg = (question as any).config;
      const fields = cfg && Array.isArray(cfg.fields) ? cfg.fields : [];
      fields.forEach((f: any, i: number) => { labels[String(i)] = String(f?.label || `Field ${i + 1}`); });
    }
    return (
      <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <tbody>
          {keys.map((k) => (
            <tr key={k}>
              <td style={{ padding: '3px 8px', color: 'var(--cw-muted)', verticalAlign: 'top' }}>
                {labels[k] || k}
              </td>
              <td style={{ padding: '3px 8px' }}>{parsed[k] || <em style={muted}>(blank)</em>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
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

function NewQuestionButton({ lessonId, passages, onCreated }: { lessonId: string; passages: Question[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        background: 'var(--cw-accent)', color: '#fff', border: 'none',
        padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
      }}>+ New task</button>
      {open && <NewQuestionModal lessonId={lessonId} passages={passages} onClose={() => setOpen(false)} onCreated={() => { setOpen(false); onCreated(); }} />}
    </>
  );
}

/* Edit-question entry point: same modal, just pre-populated with the existing
   values and saving via PATCH instead of POST. Lives next to each question
   card for teachers (not in pupil-preview mode). */
function EditQuestionButton({ question, passages, onChanged }: { question: Question; passages: Question[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} title="Edit this task" style={{
        background: '#fff', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
        padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>Edit</button>
      {open && <NewQuestionModal
        lessonId={question.lesson_id}
        passages={passages.filter((p) => p.id !== question.id)}
        existing={question}
        onClose={() => setOpen(false)}
        onCreated={() => { setOpen(false); onChanged(); }}
      />}
    </>
  );
}

function NewQuestionModal({ lessonId, passages, existing, onClose, onCreated }: { lessonId: string; passages: Question[]; existing?: Question; onClose: () => void; onCreated: () => void }) {
  const isEdit = !!existing;
  const cfg = (existing && existing.config && typeof existing.config === 'object') ? existing.config as any : {};
  const [type, setType] = useState(existing?.question_type || 'short');
  const [prompt, setPrompt] = useState(existing?.prompt || '');
  // For non-passage types, optionally attach this new question to an existing
  // passage in the lesson so they render together as a stimulus group.
  const [passageId, setPassageId] = useState<string>(existing?.passage_id || '');
  const [maxMarks, setMaxMarks] = useState(existing?.max_marks ?? 1);
  const [markingScheme, setMarkingScheme] = useState(existing?.marking_scheme || '');
  const [aiGuidance, setAiGuidance] = useState(existing?.ai_grading_guidance || '');
  const [options, setOptions] = useState<{ label: string; text: string; isCorrect: boolean }[]>(
    Array.isArray(existing?.options) && existing!.options.length
      ? (existing!.options as any[]).map((o, i) => ({
          label: String(o?.label || String.fromCharCode(65 + i)),
          text: String(o?.text || ''),
          isCorrect: !!o?.isCorrect,
        }))
      : [
          { label: 'A', text: '', isCorrect: false },
          { label: 'B', text: '', isCorrect: false },
        ]
  );
  const [rubric, setRubric] = useState<{ label: string; marks: number }[]>(
    Array.isArray(cfg.rubric) ? cfg.rubric.map((r: any) => ({
      label: String(r?.label || ''), marks: Math.max(0, Math.round(Number(r?.marks) || 0)),
    })) : []
  );
  const [useRubric, setUseRubric] = useState(Array.isArray(cfg.rubric) && cfg.rubric.length > 0);
  const [visualMarking, setVisualMarking] = useState(!!cfg.visualMarking);
  // Optional starter .pptx for presentation questions: pupils download it,
  // edit it and upload their version. The marker uses it as a baseline so
  // the AI only credits the pupil's additions, not the original starter.
  const [starterFileUrl, setStarterFileUrl] = useState(typeof cfg.starterFileUrl === 'string' ? cfg.starterFileUrl : '');
  const [starterFileName, setStarterFileName] = useState(typeof cfg.starterFileName === 'string' ? cfg.starterFileName : '');
  const [starterUploading, setStarterUploading] = useState(false);
  const [sqlDatabaseUrl, setSqlDatabaseUrl] = useState(typeof cfg.databaseUrl === 'string' ? cfg.databaseUrl : '');
  const [dbEmbedInput, setDbEmbedInput] = useState(typeof cfg.embedUrl === 'string' ? cfg.embedUrl : (typeof cfg.embedToken === 'string' ? cfg.embedToken : ''));
  const [isExtension, setIsExtension] = useState(!!existing?.is_extension);
  const [videoKind, setVideoKind] = useState<'youtube' | 'mp4'>(
    cfg.video && cfg.video.kind === 'mp4' ? 'mp4' : 'youtube'
  );
  const [videoUrl, setVideoUrl] = useState(cfg.video && typeof cfg.video.url === 'string' ? cfg.video.url : '');
  const [videoFileName, setVideoFileName] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  // Resources staged inside the New-question modal. Each entry is the same
  // shape as a saved resource minus the id; once the question is created we
  // POST each one to /api/classwork/questions/:newId/resources. In edit mode
  // this state is unused — we mount the live <QuestionResources> panel for
  // the existing question id instead.
  const [pendingResources, setPendingResources] = useState<{ kind: LessonResource['kind']; title: string; url: string }[]>([]);
  // fill_in_blanks: each blank has an `id` (referenced from the prompt as
  // `{{id}}`) and a comma-separated list of accepted answers (case- and
  // whitespace-insensitive on the marker side).
  const [blanks, setBlanks] = useState<{ id: string; accept: string; aiGuidance: string }[]>(
    Array.isArray(cfg.blanks)
      ? cfg.blanks.map((b: any) => ({
          id: String(b?.id ?? ''),
          accept: Array.isArray(b?.accept) ? b.accept.join(', ') : '',
          aiGuidance: String(b?.aiGuidance || ''),
        }))
      : [{ id: '1', accept: '', aiGuidance: '' }, { id: '2', accept: '', aiGuidance: '' }]
  );
  // table: a 2D grid. Each cell is either a fixed value (shown to pupils as
  // text) or a blank with a comma-separated list of accepted answers.
  type TblCell = { value: string; blank: boolean; accept: string; aiGuidance: string };
  const initTable = (() => {
    const t = cfg.table;
    if (t && Array.isArray(t.headers) && Array.isArray(t.rows)) {
      return {
        headers: t.headers.map((h: any) => String(h || '')),
        rows: t.rows.map((row: any[]) =>
          (Array.isArray(row) ? row : []).map((c: any) => ({
            value: String(c?.value ?? ''),
            blank: !!c?.blank,
            accept: Array.isArray(c?.accept) ? c.accept.join(', ') : '',
            aiGuidance: String(c?.aiGuidance || ''),
          }))
        ),
      };
    }
    return {
      headers: ['Column 1', 'Column 2'],
      rows: [
        [{ value: '', blank: false, accept: '', aiGuidance: '' }, { value: '', blank: true, accept: '', aiGuidance: '' }],
        [{ value: '', blank: false, accept: '', aiGuidance: '' }, { value: '', blank: true, accept: '', aiGuidance: '' }],
      ] as TblCell[][],
    };
  })();
  const [tblHeaders, setTblHeaders] = useState<string[]>(initTable.headers);
  const [tblRows, setTblRows] = useState<TblCell[][]>(initTable.rows);
  // labeled_inputs: a list of fields, each with a label and a comma-separated
  // list of accepted answers.
  const [fields, setFields] = useState<{ label: string; accept: string; aiGuidance: string }[]>(
    Array.isArray(cfg.fields)
      ? cfg.fields.map((f: any) => ({
          label: String(f?.label || ''),
          accept: Array.isArray(f?.accept) ? f.accept.join(', ') : '',
          aiGuidance: String(f?.aiGuidance || ''),
        }))
      : [{ label: 'Forename', accept: '', aiGuidance: '' }, { label: 'Surname', accept: '', aiGuidance: '' }]
  );
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
      const noAnswerType = type === 'passage' || type === 'info_only' || type === 'section_header' || type === 'text_only';
      const body: any = {
        questionType: type, prompt,
        // Passages and info-only notes have no marks / marking scheme / AI
        // guidance / answer area — they're reading material only, so we send
        // neutral defaults so the server doesn't reject them and analytics
        // ignores them.
        maxMarks: noAnswerType ? 0 : maxMarks,
        markingScheme: noAnswerType ? '' : markingScheme,
        aiGradingGuidance: noAnswerType ? '' : aiGuidance,
        isExtension,
      };
      // Only non-passage types can be attached to a passage (a passage
      // attaching to itself doesn't make sense).
      if (type !== 'passage' && passageId) body.passageId = passageId;
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
        if (starterFileUrl) {
          cfg.starterFileUrl = starterFileUrl;
          if (starterFileName) cfg.starterFileName = starterFileName;
        }
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
      if (type === 'fill_in_blanks') {
        const cleaned = blanks
          .map((b) => {
            const row: any = {
              id: String(b.id || '').trim(),
              accept: b.accept.split(',').map((s) => s.trim()).filter(Boolean),
            };
            const ai = String(b.aiGuidance || '').trim();
            if (ai) row.aiGuidance = ai;
            return row;
          })
          .filter((b) => b.id);
        if (cleaned.length === 0) throw new Error('Add at least one blank.');
        body.config = { blanks: cleaned };
      }
      if (type === 'table') {
        const cleanedHeaders = tblHeaders.map((h) => String(h || '').trim());
        const cleanedRows = tblRows.map((row) =>
          row.map((c) => {
            const cell: any = { value: String(c.value || '') };
            if (c.blank) {
              cell.blank = true;
              const accept = c.accept.split(',').map((s) => s.trim()).filter(Boolean);
              if (accept.length) cell.accept = accept;
              const ai = String(c.aiGuidance || '').trim();
              if (ai) cell.aiGuidance = ai;
            }
            return cell;
          })
        );
        const blankCount = cleanedRows.flat().filter((c: any) => c.blank).length;
        if (blankCount === 0) throw new Error('Mark at least one cell as a blank for pupils to fill in.');
        body.config = { table: { headers: cleanedHeaders, rows: cleanedRows } };
      }
      if (type === 'labeled_inputs') {
        const cleaned = fields
          .map((f) => {
            const row: any = {
              label: String(f.label || '').trim(),
              accept: f.accept.split(',').map((s) => s.trim()).filter(Boolean),
            };
            const ai = String(f.aiGuidance || '').trim();
            if (ai) row.aiGuidance = ai;
            return row;
          })
          .filter((f) => f.label);
        if (cleaned.length === 0) throw new Error('Add at least one labelled field.');
        body.config = { fields: cleaned };
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
      if (isEdit) {
        await api(`/api/classwork/questions/${existing!.id}`, {
          method: 'PATCH', body: JSON.stringify(body),
        });
      } else {
        const created = await api<{ id: string }>(`/api/classwork/lessons/${lessonId}/questions`, {
          method: 'POST', body: JSON.stringify(body),
        });
        // Flush any resources the teacher attached inside the modal before
        // saving. Failures are surfaced but the question itself is already
        // created, so we still close the modal and let them retry from the
        // per-question resources panel on the lesson page.
        if (created?.id && pendingResources.length > 0) {
          for (const r of pendingResources) {
            try {
              await api(`/api/classwork/questions/${created.id}/resources`, {
                method: 'POST',
                body: JSON.stringify({ kind: r.kind, url: r.url, title: r.title || null }),
              });
            } catch (err) {
              console.error('[classwork] failed to attach pending resource', err);
            }
          }
        }
      }
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
        <h2 style={{ marginTop: 0 }}>{isEdit ? 'Edit task' : 'New task'}</h2>
        <label style={fieldLabel}>Type
          <select value={type} onChange={(e) => onTypeChange(e.target.value)} style={input}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label style={fieldLabel}>{
            type === 'passage' ? 'Passage text (what pupils read)'
            : type === 'info_only' ? 'Note text (shown to pupils, no answer required)'
            : type === 'text_only' ? 'Task description (what pupils should do in their jotter)'
            : type === 'section_header' ? 'Section title (shown as a divider, e.g. "Section A: Comprehension")'
            : type === 'fill_in_blanks' ? 'Sentence (use {{1}}, {{2}} etc. for each blank)'
            : 'Task / prompt'}
          <textarea
            rows={type === 'passage' ? 8 : 3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={input}
          />
          <span style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>
            {type === 'passage'
              ? 'Type or paste the paragraph pupils have to read. It will sit in a sticky panel beside its attached tasks, so pupils can refer back to it as they answer.'
              : type === 'info_only'
                ? 'A non-interactive note. Use it for instructions, a reminder or a sub-heading between tasks. Pupils don\u2019t answer it and it doesn\u2019t count for marks.'
                : type === 'fill_in_blanks'
                  ? <>Write the sentence/code with placeholders. For example: <code>The capital of France is &#123;&#123;1&#125;&#125;.</code> Each <code>&#123;&#123;id&#125;&#125;</code> becomes a text box pupils fill in.</>
                  : <>Tip: paste a URL (e.g. https://bbc.co.uk/bitesize) and it will appear as a clickable link that opens in a new window. For a friendlier label, write <code>[Bitesize lesson](https://bbc.co.uk/bitesize)</code>.</>}
          </span>
        </label>
        {type !== 'passage' && passages.length > 0 && (
          <label style={fieldLabel}>Attach to passage (optional)
            <select value={passageId} onChange={(e) => setPassageId(e.target.value)} style={input}>
              <option value="">— None (standalone task) —</option>
              {passages.map((p, i) => (
                <option key={p.id} value={p.id}>
                  {passages.length > 1 ? `Passage ${i + 1}: ` : 'Passage: '}
                  {(p.prompt || '').slice(0, 60)}{(p.prompt || '').length > 60 ? '…' : ''}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>
              Group this task with a reading passage so pupils see the passage in a sticky panel beside it while they answer.
            </span>
          </label>
        )}
        {type !== 'passage' && type !== 'info_only' && type !== 'text_only' && (
          <label style={fieldLabel}>Max marks
            <input type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(parseInt(e.target.value) || 1)} style={input} />
            {(type === 'fill_in_blanks' || type === 'table' || type === 'labeled_inputs') && (
              <span style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>
                Marks are awarded in proportion to how many cells the pupil gets right. Tip: set Max marks to the number of blanks for one mark per cell.
              </span>
            )}
          </label>
        )}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={isExtension} onChange={(e) => setIsExtension(e.target.checked)} style={{ marginTop: 3 }} />
          <span>
            <span style={{ fontWeight: 600 }}>Extension activity</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--cw-muted)' }}>
              Pupils still get AI feedback and a mark, but this task is hidden from class
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
              Tip: write your task instructions as a bullet-pointed list in the Task field
              above and (optionally) a data dictionary in the marking scheme — that's what gives
              the AI marker its rubric.
            </div>
          </div>
        )}
        {type === 'sql_task' && (
          <div style={fieldLabel as any}>
            <div style={{ fontSize: 13, color: 'var(--cw-muted)', marginBottom: 6 }}>
              Pupils write a SQL query against a Data Sculptor database. Paste the database's
              share link below — it will appear as an "Open the database" button on the task
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
            <div style={{ marginTop: 12, padding: 10, border: '1px solid var(--cw-border)', borderRadius: 8, background: '#fff' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Starter presentation (optional)</div>
              <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginBottom: 8 }}>
                Upload a PowerPoint (.pptx) for pupils to download and edit. The AI marker
                will treat its content as a baseline and only credit the pupil's additions
                and changes against your success criteria.
              </div>
              {starterFileUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <a href={starterFileUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>
                    {starterFileName || 'Starter file'}
                  </a>
                  <button
                    onClick={() => { setStarterFileUrl(''); setStarterFileName(''); }}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--cw-border)', background: '#fff', cursor: 'pointer', fontSize: 12 }}
                  >Remove</button>
                </div>
              ) : (
                <input
                  type="file"
                  accept=".pptx"
                  disabled={starterUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setStarterUploading(true);
                    setErr(null);
                    try {
                      const fd = new FormData();
                      fd.append('file', file);
                      const teacherToken = (() => {
                        try { return localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken') || ''; } catch { return ''; }
                      })();
                      const headers: Record<string, string> = {};
                      if (teacherToken) headers['x-teacher-password'] = teacherToken;
                      const r = await fetch('/api/classwork/teacher/upload/resource', { method: 'POST', headers, body: fd });
                      const data = await r.json();
                      if (!r.ok) throw new Error(data?.error || 'Upload failed');
                      setStarterFileUrl(data.url);
                      setStarterFileName(data.filename || file.name);
                    } catch (e: any) {
                      setErr(e.message || 'Starter upload failed');
                    } finally {
                      setStarterUploading(false);
                    }
                  }}
                />
              )}
              {starterUploading && <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>Uploading…</div>}
            </div>
          </div>
        )}
        {type === 'fill_in_blanks' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Blanks &amp; accepted answers</div>
            <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 2, marginBottom: 6 }}>
              Each row matches a <code>&#123;&#123;id&#125;&#125;</code> placeholder in the sentence above.
              For short answers, list acceptable answers separated by commas — matching is
              case-insensitive and ignores extra spaces. For sentence-style answers, leave the
              accepted-answers box blank and write a short marking note in the AI judge box
              instead — the marker will use it to award the mark.
            </div>
            {blanks.map((b, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8,
                padding: 8, border: '1px solid var(--cw-border)', borderRadius: 6, background: '#fff',
              }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--cw-muted)' }}>&#123;&#123;</span>
                  <input
                    value={b.id}
                    placeholder="id"
                    onChange={(e) => { const a = [...blanks]; a[i].id = e.target.value; setBlanks(a); }}
                    style={{ ...input, width: 70 }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--cw-muted)' }}>&#125;&#125;</span>
                  <input
                    value={b.accept}
                    placeholder="Accepted answers (comma-sep) — for short answers"
                    onChange={(e) => { const a = [...blanks]; a[i].accept = e.target.value; setBlanks(a); }}
                    style={{ ...input, flex: 1 }}
                  />
                  <button
                    onClick={() => setBlanks(blanks.filter((_, j) => j !== i))}
                    style={{ ...input, width: 40, cursor: 'pointer' }}
                  >×</button>
                </div>
                <textarea
                  rows={1}
                  value={b.aiGuidance}
                  placeholder="AI judge note (optional) — e.g. 'Award if they mention worst-case O(n²)'"
                  onChange={(e) => { const a = [...blanks]; a[i].aiGuidance = e.target.value; setBlanks(a); }}
                  style={{ ...input, fontSize: 13 }}
                />
              </div>
            ))}
            <button
              onClick={() => {
                const nextId = String(blanks.length + 1);
                setBlanks([...blanks, { id: nextId, accept: '', aiGuidance: '' }]);
              }}
              style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', cursor: 'pointer' }}
            >+ Add blank</button>
          </div>
        )}
        {type === 'labeled_inputs' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Labelled fields</div>
            <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 2, marginBottom: 6 }}>
              Each field becomes a labelled text box for the pupil. For short answers, list
              acceptable answers separated by commas (case-insensitive, ignores extra spaces).
              For sentence-style answers, leave Accepted answers blank and add a marking note
              in the AI judge box; otherwise leave both blank to mark by hand.
            </div>
            {fields.map((f, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8,
                padding: 8, border: '1px solid var(--cw-border)', borderRadius: 6, background: '#fff',
              }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    value={f.label}
                    placeholder="Label (e.g. Forename)"
                    onChange={(e) => { const a = [...fields]; a[i].label = e.target.value; setFields(a); }}
                    style={{ ...input, width: 180 }}
                  />
                  <input
                    value={f.accept}
                    placeholder="Accepted answers (comma-sep) — for short answers"
                    onChange={(e) => { const a = [...fields]; a[i].accept = e.target.value; setFields(a); }}
                    style={{ ...input, flex: 1 }}
                  />
                  <button
                    onClick={() => setFields(fields.filter((_, j) => j !== i))}
                    style={{ ...input, width: 40, cursor: 'pointer' }}
                  >×</button>
                </div>
                <textarea
                  rows={1}
                  value={f.aiGuidance}
                  placeholder="AI judge note (optional) — e.g. 'Award if the explanation mentions binary'"
                  onChange={(e) => { const a = [...fields]; a[i].aiGuidance = e.target.value; setFields(a); }}
                  style={{ ...input, fontSize: 13 }}
                />
              </div>
            ))}
            <button
              onClick={() => setFields([...fields, { label: '', accept: '', aiGuidance: '' }])}
              style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', cursor: 'pointer' }}
            >+ Add field</button>
          </div>
        )}
        {type === 'table' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Table</div>
            <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 2, marginBottom: 6 }}>
              Build the grid pupils will see. Tick "Blank" to turn a cell into an input box; in
              that case put the accepted answers (comma-separated) in the value field, or for
              sentence-style cells leave it blank and add a marking note in the AI judge box that
              appears beneath. Otherwise the cell is shown to pupils as fixed text.
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    {tblHeaders.map((h, c) => (
                      <th key={c} style={{ padding: 4, border: '1px solid var(--cw-border)', background: '#f1f5f9' }}>
                        <input
                          value={h}
                          onChange={(e) => {
                            const a = [...tblHeaders]; a[c] = e.target.value; setTblHeaders(a);
                          }}
                          style={{ ...input, width: '100%' }}
                        />
                      </th>
                    ))}
                    <th style={{ padding: 4, border: '1px solid var(--cw-border)', background: '#f1f5f9', width: 40 }}>
                      <button
                        title="Add column"
                        onClick={() => {
                          setTblHeaders([...tblHeaders, `Column ${tblHeaders.length + 1}`]);
                          setTblRows(tblRows.map((row) => [...row, { value: '', blank: false, accept: '' }]));
                        }}
                        style={{ ...input, cursor: 'pointer', width: '100%' }}
                      >+</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tblRows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c} style={{ padding: 4, border: '1px solid var(--cw-border)', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <input
                              value={cell.blank ? cell.accept : cell.value}
                              placeholder={cell.blank ? 'Accepted answers (comma-sep)' : 'Cell text'}
                              onChange={(e) => {
                                const a = tblRows.map((rr) => rr.map((cc) => ({ ...cc })));
                                if (a[r][c].blank) a[r][c].accept = e.target.value;
                                else a[r][c].value = e.target.value;
                                setTblRows(a);
                              }}
                              style={{ ...input, width: '100%' }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--cw-muted)' }}>
                              <input
                                type="checkbox" checked={cell.blank}
                                onChange={(e) => {
                                  const a = tblRows.map((rr) => rr.map((cc) => ({ ...cc })));
                                  a[r][c].blank = e.target.checked;
                                  setTblRows(a);
                                }}
                              /> Blank for pupil
                            </label>
                            {cell.blank && (
                              <textarea
                                rows={1}
                                value={cell.aiGuidance}
                                placeholder="AI judge note (optional)"
                                onChange={(e) => {
                                  const a = tblRows.map((rr) => rr.map((cc) => ({ ...cc })));
                                  a[r][c].aiGuidance = e.target.value;
                                  setTblRows(a);
                                }}
                                style={{ ...input, width: '100%', fontSize: 12 }}
                              />
                            )}
                          </div>
                        </td>
                      ))}
                      <td style={{ padding: 4, border: '1px solid var(--cw-border)', textAlign: 'center' }}>
                        <button
                          onClick={() => setTblRows(tblRows.filter((_, i) => i !== r))}
                          style={{ ...input, cursor: 'pointer', width: '100%' }}
                          title="Delete row"
                        >×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button
                onClick={() =>
                  setTblRows([
                    ...tblRows,
                    tblHeaders.map(() => ({ value: '', blank: false, accept: '' })),
                  ])
                }
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', cursor: 'pointer' }}
              >+ Add row</button>
              {tblHeaders.length > 1 && (
                <button
                  onClick={() => {
                    setTblHeaders(tblHeaders.slice(0, -1));
                    setTblRows(tblRows.map((row) => row.slice(0, -1)));
                  }}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', cursor: 'pointer' }}
                >− Remove last column</button>
              )}
            </div>
          </div>
        )}
        {type !== 'section_header' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ ...fieldLabel, marginBottom: 4 }}>Resources for this task</div>
            <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginBottom: 6 }}>
              Attach images, documents, YouTube clips, links or embeds. Pupils see them above the answer area on this task only.
            </div>
            {isEdit ? (
              <QuestionResources questionId={existing!.id} isTeacher={true} />
            ) : (
              <PendingResourcesEditor
                items={pendingResources}
                onChange={setPendingResources}
              />
            )}
          </div>
        )}
        {type !== 'passage' && type !== 'info_only' && type !== 'text_only' && (
          <>
            <label style={fieldLabel}>Marking scheme (teacher view only)
              <textarea rows={2} value={markingScheme} onChange={(e) => setMarkingScheme(e.target.value)} style={input} />
            </label>
            <label style={fieldLabel}>AI grading guidance (used by AI marker — Phase 2)
              <textarea rows={2} value={aiGuidance} onChange={(e) => setAiGuidance(e.target.value)} style={input} />
            </label>
          </>
        )}
        {err && <div style={{ color: 'var(--cw-danger)', fontSize: 14, marginTop: 6 }}>{err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--cw-border)', background: '#fff', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={busy} style={{
            background: 'var(--cw-accent)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
          }}>{busy ? 'Saving…' : (isEdit ? 'Save changes' : 'Save task')}</button>
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
        No video has been attached to this task yet.
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
          title="Video task"
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

/* ---------- Per-question resources ----------
   Lets a teacher attach images / documents / YouTube videos / generic links /
   embed URLs to one specific question. Pupils see them rendered above the
   answer area; teachers also get + Add / × Remove controls. The actual list
   item rendering is shared with the legacy LessonResources block via
   `renderResource()` so both look identical. */

function renderResource(r: LessonResource): React.ReactNode {
  const title = r.title || r.url;
  if (r.kind === 'youtube') {
    const id = youtubeIdFromUrl(r.url);
    if (!id) {
      return <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cw-accent)' }}>{title}</a>;
    }
    return (
      <figure key={r.id} style={{ margin: 0 }}>
        {r.title && <figcaption style={{ fontWeight: 600, marginBottom: 6 }}>{r.title}</figcaption>}
        <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
          <iframe src={`https://www.youtube.com/embed/${id}`} title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
        </div>
      </figure>
    );
  }
  if (r.kind === 'embed') {
    return (
      <figure key={r.id} style={{ margin: 0 }}>
        {r.title && <figcaption style={{ fontWeight: 600, marginBottom: 6 }}>{r.title}</figcaption>}
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#000', border: '1px solid var(--cw-border)', height: 600, maxHeight: '80vh' }}>
          <iframe src={r.url} title={title} loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-pointer-lock allow-downloads"
            allow="autoplay; fullscreen; clipboard-write; gamepad; microphone; camera; geolocation"
            allowFullScreen referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#fff' }} />
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
        <img src={r.url} alt={title} style={{ maxWidth: '100%', maxHeight: 480, borderRadius: 8, border: '1px solid var(--cw-border)', display: 'block' }} />
        {r.title && <figcaption style={{ marginTop: 6, fontSize: 13, color: 'var(--cw-muted)' }}>{r.title}</figcaption>}
      </figure>
    );
  }
  if (r.kind === 'link') {
    // Render as a big, obvious clickable card. Younger pupils were struggling
    // to see plain inline links, so this gives them a button-style preview
    // with the title (or URL) up top and the URL underneath, and a small
    // "Open in new tab" hint on the right.
    let host = '';
    try { host = new URL(r.url).hostname.replace(/^www\./, ''); } catch { host = r.url; }
    const display = r.title || host;
    return (
      <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
         style={{
           display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
           background: '#fff', border: '1px solid var(--cw-border)', borderRadius: 10,
           color: 'var(--cw-ink)', textDecoration: 'none', maxWidth: 480,
           boxShadow: '0 1px 2px rgba(0,0,0,0.04)', transition: 'box-shadow .15s, border-color .15s',
         }}
         onMouseOver={(e) => {
           (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
           (e.currentTarget as HTMLElement).style.borderColor = 'var(--cw-accent)';
         }}
         onMouseOut={(e) => {
           (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
           (e.currentTarget as HTMLElement).style.borderColor = 'var(--cw-border)';
         }}
      >
        <div style={{
          flex: '0 0 auto', width: 40, height: 40, borderRadius: 8,
          background: '#e0e7ff', color: '#3730a3',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700,
        }} aria-hidden="true">↗</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, color: '#1d4ed8', textDecoration: 'underline',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{display}</div>
          <div style={{
            fontSize: 13, color: 'var(--cw-muted)', marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{r.url}</div>
        </div>
      </a>
    );
  }
  // Document download — same look so it reads as a clickable button.
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
        background: '#fef3c7', color: '#92400e',
        textTransform: 'uppercase', flex: '0 0 auto',
      }}>Document</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        Open: {title}
      </span>
    </a>
  );
}

/* Lightweight resources editor used inside the New-question modal where the
   question doesn't have an id yet. Mirrors the look of <QuestionResources>
   but stages everything in local state; the parent modal POSTs each entry
   to /api/classwork/questions/:newId/resources after the question is saved. */
function PendingResourcesEditor({
  items,
  onChange,
}: {
  items: { kind: LessonResource['kind']; title: string; url: string }[];
  onChange: (next: { kind: LessonResource['kind']; title: string; url: string }[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState<LessonResource['kind']>('image');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const teacherToken = (() => {
        try { return localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken') || ''; } catch { return ''; }
      })();
      const headers: Record<string, string> = {};
      if (teacherToken) headers['x-teacher-password'] = teacherToken;
      const r = await fetch('/api/classwork/teacher/upload/resource', { method: 'POST', headers, body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Upload failed');
      setUrl(data.url);
      if (!title) setTitle(data.filename || file.name);
    } catch (e: any) {
      setErr(e.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  function add() {
    if (!url.trim()) { setErr('Please provide a URL or upload a file.'); return; }
    onChange([...items, { kind, title: title.trim(), url: url.trim() }]);
    setKind('image'); setTitle(''); setUrl(''); setErr(null); setShowForm(false);
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div>
      {items.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          padding: 10, background: '#f8fafc', border: '1px solid var(--cw-border)', borderRadius: 8,
          marginBottom: 8,
        }}>
          {items.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                <strong>{r.kind}</strong>{r.title ? ` — ${r.title}` : ''}
                <div style={{ color: 'var(--cw-muted)', fontSize: 12, wordBreak: 'break-all' }}>{r.url}</div>
              </div>
              <button onClick={() => remove(i)} title="Remove"
                style={{
                  border: '1px solid var(--cw-border)', background: '#fff', borderRadius: 6,
                  padding: '4px 8px', cursor: 'pointer', color: 'var(--cw-danger)', fontWeight: 700,
                }}>×</button>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--cw-muted)' }}>These will be attached when you click <em>Save task</em>.</div>
        </div>
      )}
      {!showForm ? (
        <button type="button" onClick={() => setShowForm(true)} style={{
          fontSize: 13, padding: '6px 10px', border: '1px dashed var(--cw-border)',
          background: '#fff', borderRadius: 6, cursor: 'pointer', color: 'var(--cw-muted)',
        }}>+ Add resource to this task</button>
      ) : (
        <div style={{ padding: 10, border: '1px solid var(--cw-border)', borderRadius: 8, background: '#fff' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={kind} onChange={(e) => { setKind(e.target.value as any); setUrl(''); }} style={input}>
              <option value="image">Image (upload)</option>
              <option value="document">Document (upload)</option>
              <option value="youtube">YouTube link</option>
              <option value="link">Web link</option>
              <option value="embed">Embed (iframe URL)</option>
            </select>
            <input
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ ...input, flex: '1 1 200px' }}
            />
          </div>
          {(kind === 'image' || kind === 'document') ? (
            <div style={{ marginTop: 6 }}>
              <input type="file"
                accept={kind === 'image' ? 'image/*' : '.pdf,.docx,.pptx,.xlsx,.txt,.csv,.zip'}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
              />
              {url && <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>Uploaded: <code>{url}</code></div>}
            </div>
          ) : (
            <input
              placeholder={kind === 'youtube' ? 'https://www.youtube.com/watch?v=…' : 'https://…'}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ ...input, marginTop: 6, width: '100%' }}
            />
          )}
          {err && <div style={{ color: 'var(--cw-danger)', fontSize: 13, marginTop: 6 }}>{err}</div>}
          <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setShowForm(false); setErr(null); setUrl(''); setTitle(''); }}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', background: '#fff', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="button" onClick={add} disabled={busy} style={{
              padding: '6px 12px', borderRadius: 6, border: 'none',
              background: 'var(--cw-accent)', color: '#fff', fontWeight: 600, cursor: 'pointer',
            }}>{busy ? 'Uploading…' : 'Add'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionResources({ questionId, isTeacher, initialResources }: { questionId: string; isTeacher: boolean; initialResources?: LessonResource[] }) {
  // If the parent has already pre-fetched the bulk resource map for the whole
  // lesson, seed our state from that and skip the on-mount HTTP call. Without
  // this every question card would fire its own /resources request — N+1.
  const [resources, setResources] = useState<LessonResource[] | null>(
    initialResources !== undefined ? initialResources : null
  );
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState<LessonResource['kind']>('image');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const list = await api<LessonResource[]>(`/api/classwork/questions/${questionId}/resources`);
      setResources(list || []);
    } catch {
      setResources([]);
    }
  }
  useEffect(() => {
    // Only fetch when the parent didn't seed us. Teacher add/remove handlers
    // below still call load() directly to refresh after a write.
    if (initialResources === undefined) load();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [questionId]);

  async function uploadFile(file: File) {
    setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const teacherToken = (() => {
        try { return localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken') || ''; } catch { return ''; }
      })();
      const headers: Record<string, string> = {};
      if (teacherToken) headers['x-teacher-password'] = teacherToken;
      const r = await fetch('/api/classwork/teacher/upload/resource', { method: 'POST', headers, body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Upload failed');
      setUrl(data.url);
      if (!title) setTitle(data.filename || file.name);
    } catch (e: any) {
      setErr(e.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    if (!url.trim()) { setErr('Please provide a URL or upload a file.'); return; }
    setBusy(true); setErr(null);
    try {
      await api(`/api/classwork/questions/${questionId}/resources`, {
        method: 'POST',
        body: JSON.stringify({ kind, url: url.trim(), title: title.trim() || null }),
      });
      setUrl(''); setTitle(''); setKind('image'); setShowForm(false);
      await load();
    } catch (e: any) {
      setErr(e.message || 'Failed to add resource');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Remove this resource?')) return;
    try {
      await api(`/api/classwork/resources/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      window.alert(e.message || 'Failed to remove');
    }
  }

  if (!resources) return null;
  if (!isTeacher && resources.length === 0) return null;

  return (
    <div style={{ marginTop: 12 }}>
      {resources.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          padding: 12, background: '#f8fafc', border: '1px solid var(--cw-border)', borderRadius: 8,
        }}>
          {resources.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>{renderResource(r)}</div>
              {isTeacher && (
                <button onClick={() => remove(r.id)} title="Remove resource"
                  style={{
                    border: '1px solid var(--cw-border)', background: '#fff', borderRadius: 6,
                    padding: '4px 8px', cursor: 'pointer', color: 'var(--cw-danger)', fontWeight: 700,
                  }}>×</button>
              )}
            </div>
          ))}
        </div>
      )}
      {isTeacher && (
        <div style={{ marginTop: 8 }}>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} style={{
              fontSize: 13, padding: '6px 10px', border: '1px dashed var(--cw-border)',
              background: '#fff', borderRadius: 6, cursor: 'pointer', color: 'var(--cw-muted)',
            }}>+ Add resource to this task</button>
          ) : (
            <div style={{ padding: 10, border: '1px solid var(--cw-border)', borderRadius: 8, background: '#fff' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={kind} onChange={(e) => setKind(e.target.value as any)} style={input}>
                  <option value="image">Image (upload)</option>
                  <option value="document">Document (upload)</option>
                  <option value="youtube">YouTube link</option>
                  <option value="link">Web link</option>
                  <option value="embed">Embed (iframe URL)</option>
                </select>
                <input
                  placeholder="Title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ ...input, flex: '1 1 200px' }}
                />
              </div>
              {(kind === 'image' || kind === 'document') ? (
                <div style={{ marginTop: 6 }}>
                  <input type="file"
                    accept={kind === 'image' ? 'image/*' : '.pdf,.docx,.pptx,.xlsx,.txt,.csv,.zip'}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
                  />
                  {url && <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>Uploaded: <code>{url}</code></div>}
                </div>
              ) : (
                <input
                  placeholder={kind === 'youtube' ? 'https://www.youtube.com/watch?v=…' : 'https://…'}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ ...input, marginTop: 6, width: '100%' }}
                />
              )}
              {err && <div style={{ color: 'var(--cw-danger)', fontSize: 13, marginTop: 6 }}>{err}</div>}
              <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowForm(false); setErr(null); setUrl(''); setTitle(''); }}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', background: '#fff', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={add} disabled={busy} style={{
                  padding: '6px 12px', borderRadius: 6, border: 'none',
                  background: 'var(--cw-accent)', color: '#fff', fontWeight: 600, cursor: 'pointer',
                }}>{busy ? 'Saving…' : 'Add'}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Kept for reference but no longer mounted: lesson-level resources have been
// retired in favour of per-question attachments (see QuestionResources).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _LessonResources_legacy({ resources }: { resources: LessonResource[] }) {
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
