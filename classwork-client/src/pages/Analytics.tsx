import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import Shell from '@/components/Shell';
import { api, getCurrentRole } from '@/lib/api';

const COURSE_LABELS: Record<string, string> = {
  s1: 'S1', s2: 'S2', s3: 'S3', n4: 'National 4', n5: 'National 5', higher: 'Higher',
};

interface CourseLessonStat {
  lesson_id: string;
  lesson_title: string;
  is_published: boolean;
  unit_id: string;
  unit_title: string;
  question_count: number;
  submission_count: number;
  distinct_students: number;
  marked_count: number;
  avg_percent: number | null;
}

interface CourseStudentStat {
  student_id: string;
  username: string;
  submission_count: number;
  lessons_touched: number;
  last_submitted_at: string | null;
  avg_percent: number | null;
}

interface CourseAnalytics {
  course: string;
  totals: { submission_count: number; distinct_students: number };
  lessons: CourseLessonStat[];
  students: CourseStudentStat[];
}

interface LessonAnalytics {
  lesson: { id: string; title: string; unit_title: string };
  questions: Array<{
    id: string;
    prompt: string;
    question_type: string;
    max_marks: number;
    options: any;
    submission_count: number;
    distinct_students: number;
    avg_mark: number | null;
    avg_percent: number | null;
    // Distinct pupils whose lesson page actually rendered this question
    // card (set by the IntersectionObserver in Lesson.tsx). Lets the
    // teacher distinguish "couldn't access it" from "opened it but
    // didn't finish".
    distinct_viewers: number;
  }>;
  students: Array<{
    student_id: string;
    username: string;
    total_marks: number;
    max_marks: number;
    questions_attempted: number;
    last_submitted_at: string;
  }>;
}

interface StudentAnalytics {
  course: string;
  studentId: string;
  username: string | null;
  submissions: Array<{
    id: string;
    submitted_at: string;
    marks_awarded: number | null;
    ai_feedback: string | null;
    text_answer: string | null;
    selected_option_label: string | null;
    link_url: string | null;
    file_url: string | null;
    question_prompt: string;
    question_type: string;
    question_max_marks: number;
    lesson_id: string;
    lesson_title: string;
    unit_title: string;
  }>;
}

export default function Analytics() {
  const [, params] = useRoute('/analytics/:course');
  const course = params?.course || '';
  const role = getCurrentRole();

  if (role !== 'teacher') {
    return (
      <Shell title="Analytics" back={{ href: `/course/${course}`, label: COURSE_LABELS[course] || 'Back' }}>
        <p style={{ color: 'var(--cw-muted)' }}>Analytics are only available to teachers.</p>
      </Shell>
    );
  }

  const [data, setData] = useState<CourseAnalytics | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<'lessons' | 'students'>('lessons');
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [openStudent, setOpenStudent] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setErr(null);
    api<CourseAnalytics>(`/api/classwork/${course}/analytics/overview`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setErr(e.message || 'Failed to load'); });
    return () => { cancelled = true; };
  }, [course]);

  const [downloading, setDownloading] = useState(false);
  const [downloadErr, setDownloadErr] = useState<string | null>(null);

  async function downloadExcel() {
    setDownloading(true);
    setDownloadErr(null);
    try {
      const teacherToken =
        localStorage.getItem('teacher_token') ||
        localStorage.getItem('teacherToken') || '';
      const res = await fetch(`/api/classwork/${course}/analytics/export.xlsx`, {
        headers: { 'x-teacher-password': teacherToken },
      });
      if (!res.ok) {
        let msg = `Download failed (${res.status})`;
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bhs-classwork-${course}-analytics-${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      setDownloadErr(e?.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Shell title={`Analytics — ${COURSE_LABELS[course] || course}`} back={{ href: `/course/${course}`, label: 'Back to course' }}>
      {err && <p style={{ color: 'var(--cw-danger)' }}>{err}</p>}
      {!data && !err && <p>Loading…</p>}
      {data && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {downloadErr && <span style={{ color: 'var(--cw-danger)', fontSize: 13 }}>{downloadErr}</span>}
            <button
              onClick={downloadExcel}
              disabled={downloading}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid var(--cw-border)',
                background: downloading ? '#e2e8f0' : 'var(--cw-accent)',
                color: downloading ? 'var(--cw-muted)' : '#fff',
                cursor: downloading ? 'wait' : 'pointer', fontWeight: 600, fontSize: 13,
              }}
            >
              {downloading ? 'Building workbook…' : 'Download Excel'}
            </button>
          </div>

          <div style={summaryRow}>
            <Tile label="Students who submitted" value={data.totals.distinct_students} />
            <Tile label="Total submissions" value={data.totals.submission_count} />
            <Tile label="Lessons" value={data.lessons.length} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 24, marginBottom: 12 }}>
            <TabBtn active={tab === 'lessons'} onClick={() => setTab('lessons')}>By lesson</TabBtn>
            <TabBtn active={tab === 'students'} onClick={() => setTab('students')}>By student</TabBtn>
          </div>

          {tab === 'lessons' && (
            <LessonsTable
              lessons={data.lessons}
              openLessonId={openLesson}
              onToggle={(id) => setOpenLesson((cur) => (cur === id ? null : id))}
            />
          )}

          {tab === 'students' && (
            <StudentsTable
              students={data.students}
              course={course}
              openStudentId={openStudent}
              onToggle={(id) => setOpenStudent((cur) => (cur === id ? null : id))}
            />
          )}
        </>
      )}
    </Shell>
  );
}

/* ---------- Summary tiles & shared bits ---------- */

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={tile}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      ...secondaryBtn,
      background: active ? 'var(--cw-accent)' : '#f1f5f9',
      color: active ? '#fff' : 'var(--cw-ink)',
      borderColor: active ? 'var(--cw-accent)' : 'var(--cw-border)',
    }}>{children}</button>
  );
}

function PercentBar({ value }: { value: number | null }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, Math.round(value)));
  const colour = value == null ? '#cbd5e1' : pct >= 70 ? '#16a34a' : pct >= 50 ? '#ca8a04' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
      <div style={{ position: 'relative', flex: 1, height: 8, background: '#e2e8f0', borderRadius: 999 }}>
        <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: colour, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--cw-muted)', width: 44, textAlign: 'right' }}>
        {value == null ? '—' : `${pct}%`}
      </span>
    </div>
  );
}

/* ---------- Lessons table + drill-down ---------- */

function LessonsTable({ lessons, openLessonId, onToggle }: {
  lessons: CourseLessonStat[];
  openLessonId: string | null;
  onToggle: (id: string) => void;
}) {
  if (!lessons.length) return <p style={{ color: 'var(--cw-muted)' }}>No lessons in this course yet.</p>;

  // Group lessons by unit so the table mirrors the Course page layout.
  const grouped = lessons.reduce((acc, l) => {
    (acc[l.unit_title] ||= []).push(l);
    return acc;
  }, {} as Record<string, CourseLessonStat[]>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(grouped).map(([unitTitle, rows]) => (
        <div key={unitTitle} style={card}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{unitTitle}</h3>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>Lesson</th>
                <th style={th}>Status</th>
                <th style={th}>Questions</th>
                <th style={th}>Submissions</th>
                <th style={th}>Students</th>
                <th style={th}>Avg %</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <RowGroup key={r.lesson_id}>
                  <tr>
                    <td style={td}><Link href={`/lesson/${r.lesson_id}`}>{r.lesson_title}</Link></td>
                    <td style={td}>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 999,
                        background: r.is_published ? '#dcfce7' : '#fee2e2',
                        color: r.is_published ? '#166534' : '#991b1b',
                      }}>{r.is_published ? 'Published' : 'Draft'}</span>
                    </td>
                    <td style={td}>{r.question_count}</td>
                    <td style={td}>{r.submission_count}</td>
                    <td style={td}>{r.distinct_students}</td>
                    <td style={td}><PercentBar value={r.avg_percent} /></td>
                    <td style={td}>
                      <button onClick={() => onToggle(r.lesson_id)} style={miniBtn}>
                        {openLessonId === r.lesson_id ? 'Hide' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                  {openLessonId === r.lesson_id && (
                    <tr>
                      <td colSpan={7} style={{ ...td, background: '#fafbfd' }}>
                        <LessonDetail lessonId={r.lesson_id} />
                      </td>
                    </tr>
                  )}
                </RowGroup>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function RowGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function LessonDetail({ lessonId }: { lessonId: string }) {
  const [data, setData] = useState<LessonAnalytics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setErr(null);
    api<LessonAnalytics>(`/api/classwork/lessons/${lessonId}/analytics`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setErr(e.message || 'Failed to load'); });
    return () => { cancelled = true; };
  }, [lessonId]);

  if (err) return <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{err}</p>;
  if (!data) return <p style={{ color: 'var(--cw-muted)', margin: 0 }}>Loading lesson detail…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h4 style={{ margin: '4px 0 8px', fontSize: 14 }}>Per-question</h4>
        {data.questions.length === 0 ? (
          <p style={{ color: 'var(--cw-muted)', margin: 0 }}>No questions in this lesson.</p>
        ) : (
          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Prompt</th>
                <th style={th}>Type</th>
                <th style={th}>Max</th>
                {/* "Opened" = distinct pupils who actually scrolled this
                    task into view in the lesson page. Combined with the
                    Submissions column it tells you who tried but didn't
                    finish vs. who never even saw the task. */}
                <th style={th} title="Pupils who opened this task on the lesson page (whether or not they submitted).">Opened</th>
                <th style={th}>Submissions</th>
                <th style={th}>Avg mark</th>
                <th style={th}>Avg %</th>
              </tr>
            </thead>
            <tbody>
              {data.questions.map((q, i) => (
                <tr key={q.id}>
                  <td style={td}>{i + 1}</td>
                  <td style={{ ...td, maxWidth: 380 }}>
                    <span title={q.prompt}>{shorten(q.prompt, 100)}</span>
                  </td>
                  <td style={td}>{q.question_type}</td>
                  <td style={td}>{q.max_marks}</td>
                  <td style={td} title={
                    q.distinct_viewers > q.distinct_students
                      ? `${q.distinct_viewers - q.distinct_students} pupil(s) opened but didn\u2019t submit.`
                      : undefined
                  }>{q.distinct_viewers}</td>
                  <td style={td}>{q.submission_count}</td>
                  <td style={td}>{q.avg_mark != null ? Number(q.avg_mark).toFixed(1) : '—'}</td>
                  <td style={td}><PercentBar value={q.avg_percent} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h4 style={{ margin: '4px 0 8px', fontSize: 14 }}>Per-student (best attempt)</h4>
        {data.students.length === 0 ? (
          <p style={{ color: 'var(--cw-muted)', margin: 0 }}>No submissions yet.</p>
        ) : (
          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>Student</th>
                <th style={th}>Score</th>
                <th style={th}>%</th>
                <th style={th}>Questions answered</th>
                <th style={th}>Last submitted</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((s) => {
                const pct = s.max_marks > 0 ? (s.total_marks / s.max_marks) * 100 : null;
                return (
                  <tr key={s.student_id}>
                    <td style={td}>{s.username}</td>
                    <td style={td}>{s.total_marks} / {s.max_marks}</td>
                    <td style={td}><PercentBar value={pct} /></td>
                    <td style={td}>{s.questions_attempted}</td>
                    <td style={td}>{s.last_submitted_at ? new Date(s.last_submitted_at).toLocaleString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ---------- Students table + drill-down ---------- */

function StudentsTable({ students, course, openStudentId, onToggle }: {
  students: CourseStudentStat[];
  course: string;
  openStudentId: string | null;
  onToggle: (id: string) => void;
}) {
  if (!students.length) return <p style={{ color: 'var(--cw-muted)' }}>No students have submitted in this course yet.</p>;
  return (
    <div style={card}>
      <table style={tbl}>
        <thead>
          <tr>
            <th style={th}>Student</th>
            <th style={th}>Submissions</th>
            <th style={th}>Lessons touched</th>
            <th style={th}>Avg %</th>
            <th style={th}>Last submitted</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <RowGroup key={s.student_id}>
              <tr>
                <td style={td}>{s.username}</td>
                <td style={td}>{s.submission_count}</td>
                <td style={td}>{s.lessons_touched}</td>
                <td style={td}><PercentBar value={s.avg_percent} /></td>
                <td style={td}>{s.last_submitted_at ? new Date(s.last_submitted_at).toLocaleString() : '—'}</td>
                <td style={td}>
                  <button onClick={() => onToggle(s.student_id)} style={miniBtn}>
                    {openStudentId === s.student_id ? 'Hide' : 'Detail'}
                  </button>
                </td>
              </tr>
              {openStudentId === s.student_id && (
                <tr>
                  <td colSpan={6} style={{ ...td, background: '#fafbfd' }}>
                    <StudentDetail course={course} studentId={s.student_id} />
                  </td>
                </tr>
              )}
            </RowGroup>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentDetail({ course, studentId }: { course: string; studentId: string }) {
  const [data, setData] = useState<StudentAnalytics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setErr(null);
    api<StudentAnalytics>(`/api/classwork/${course}/students/${studentId}/analytics`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setErr(e.message || 'Failed to load'); });
    return () => { cancelled = true; };
  }, [course, studentId]);

  if (err) return <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{err}</p>;
  if (!data) return <p style={{ color: 'var(--cw-muted)', margin: 0 }}>Loading student detail…</p>;

  // Group by lesson so the timeline reads naturally.
  const byLesson = data.submissions.reduce((acc, s) => {
    (acc[s.lesson_id] ||= { title: `${s.unit_title} · ${s.lesson_title}`, rows: [] }).rows.push(s);
    return acc;
  }, {} as Record<string, { title: string; rows: typeof data.submissions }>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Activity calendar always shows, even before the pupil has submitted
          anything — opening a lesson page already counts as activity, so it
          gives teachers an "are they engaging at all?" signal. */}
      <StudentActivityCalendar course={course} studentId={studentId} />
      {!data.submissions.length && (
        <p style={{ color: 'var(--cw-muted)', margin: 0 }}>No submissions yet.</p>
      )}
      {Object.entries(byLesson).map(([lessonId, grp]) => (
        <div key={lessonId}>
          <h4 style={{ margin: '4px 0 6px', fontSize: 14 }}>
            <Link href={`/lesson/${lessonId}`}>{grp.title}</Link>
          </h4>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>Question</th>
                <th style={th}>Type</th>
                <th style={th}>Mark</th>
                <th style={th}>%</th>
                <th style={th}>When</th>
                <th style={th}>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {grp.rows.map((s) => {
                const pct = s.marks_awarded != null && s.question_max_marks > 0
                  ? (s.marks_awarded / s.question_max_marks) * 100 : null;
                return (
                  <tr key={s.id}>
                    <td style={{ ...td, maxWidth: 320 }} title={s.question_prompt}>{shorten(s.question_prompt, 80)}</td>
                    <td style={td}>{s.question_type}</td>
                    <td style={td}>{s.marks_awarded != null ? `${s.marks_awarded} / ${s.question_max_marks}` : 'pending'}</td>
                    <td style={td}><PercentBar value={pct} /></td>
                    <td style={td}>{new Date(s.submitted_at).toLocaleString()}</td>
                    <td style={{ ...td, maxWidth: 280, color: 'var(--cw-muted)' }} title={s.ai_feedback || ''}>
                      {shorten(s.ai_feedback || '', 80) || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

/* ---------- Activity calendar ----------
   Small at-a-glance view of which days the student actually used the app.
   Activity here means: submitted an answer, opened a question card on a
   lesson page, or saved a draft — all derived from existing timestamp
   columns on the server, so this view adds zero new write paths. Teachers
   can flick prev/next through the last twelve months to spot streaks,
   gaps, and "logged in but did nothing" weeks. */
function StudentActivityCalendar({ course, studentId }: { course: string; studentId: string }) {
  const [days, setDays] = useState<Set<string> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // What month is currently shown. Defaults to the current month so the most
  // recent activity is on screen; prev/next clamp to the 12-month window.
  const today = new Date();
  const [view, setView] = useState<{ year: number; month: number }>({
    year: today.getFullYear(), month: today.getMonth(), // month is 0-indexed
  });

  useEffect(() => {
    let cancelled = false;
    setDays(null); setErr(null);
    api<{ days: string[] }>(`/api/classwork/${course}/students/${studentId}/activity-days`)
      .then((d) => { if (!cancelled) setDays(new Set(d.days || [])); })
      .catch((e) => { if (!cancelled) setErr(e.message || 'Failed to load activity'); });
    return () => { cancelled = true; };
  }, [course, studentId]);

  // 12-month navigation cap, calculated from "today" so we don't need to
  // refetch when the teacher pages around. Anything older than that window
  // wasn't fetched anyway.
  const earliest = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const latest   = new Date(today.getFullYear(), today.getMonth(), 1);
  const viewStart = new Date(view.year, view.month, 1);
  const canGoBack = viewStart > earliest;
  const canGoFwd  = viewStart < latest;

  function shift(delta: number) {
    setView((v) => {
      const next = new Date(v.year, v.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  // Build the 6-row grid of cells for the visible month, padded with blanks
  // for the days of the leading/trailing weeks. Week starts on Monday to
  // match UK schools.
  const firstOfMonth = new Date(view.year, view.month, 1);
  const lastOfMonth  = new Date(view.year, view.month + 1, 0);
  const daysInMonth  = lastOfMonth.getDate();
  // JS getDay(): 0=Sun..6=Sat. Convert to Mon=0..Sun=6 for the grid.
  const leadBlanks = (firstOfMonth.getDay() + 6) % 7;
  const cells: ({ d: number; iso: string } | null)[] = [];
  for (let i = 0; i < leadBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ d, iso });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const monthLabel = firstOfMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const activeInMonth = days
    ? cells.filter((c) => c && days.has(c.iso)).length
    : 0;
  const totalActive = days ? days.size : 0;

  return (
    <div style={{
      border: '1px solid var(--cw-border)', borderRadius: 10, padding: 12,
      background: '#fafbff', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Login &amp; activity</div>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={() => shift(-1)} disabled={!canGoBack} style={navBtn(!canGoBack)} aria-label="Previous month">‹</button>
        <div style={{ fontSize: 13, fontWeight: 600, minWidth: 130, textAlign: 'center' }}>{monthLabel}</div>
        <button type="button" onClick={() => shift(1)} disabled={!canGoFwd} style={navBtn(!canGoFwd)} aria-label="Next month">›</button>
      </div>
      {err && <div style={{ fontSize: 12, color: 'var(--cw-danger)' }}>{err}</div>}
      {!err && days === null && <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>Loading activity…</div>}
      {!err && days !== null && (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4,
            fontSize: 11, color: 'var(--cw-muted)', textAlign: 'center',
          }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
              <div key={d} style={{ padding: '2px 0', fontWeight: 600 }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((c, i) => {
              if (!c) return <div key={`b${i}`} style={{ aspectRatio: '1 / 1' }} />;
              const isActive = days.has(c.iso);
              const isToday = c.iso === todayIso;
              const isFuture = c.iso > todayIso;
              return (
                <div
                  key={c.iso}
                  title={isActive ? `Active on ${c.iso}` : isFuture ? '' : `No activity on ${c.iso}`}
                  style={{
                    aspectRatio: '1 / 1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: isActive ? 700 : 500,
                    borderRadius: 6,
                    background: isActive
                      ? 'var(--cw-accent, #2563eb)'
                      : isFuture ? 'transparent' : '#fff',
                    color: isActive ? '#fff' : isFuture ? 'var(--cw-muted)' : 'var(--cw-text, #111827)',
                    border: isToday
                      ? '2px solid var(--cw-accent, #2563eb)'
                      : '1px solid var(--cw-border)',
                    opacity: isFuture ? 0.4 : 1,
                  }}
                >
                  {c.d}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>
            {activeInMonth} active {activeInMonth === 1 ? 'day' : 'days'} this month
            {' · '}
            {totalActive} in the last 12 months
          </div>
        </>
      )}
    </div>
  );
}

function navBtn(disabled: boolean): React.CSSProperties {
  return {
    width: 28, height: 28, borderRadius: 6,
    border: '1px solid var(--cw-border)', background: '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    fontSize: 16, lineHeight: 1, padding: 0,
  };
}

/* ---------- helpers + styles ---------- */

function shorten(s: string, n: number) {
  if (!s) return '';
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--cw-border)', borderRadius: 12, padding: 16,
  boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
};
const summaryRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 };
const tile: React.CSSProperties = { ...card, padding: 16 };
const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 14 };
const th: React.CSSProperties = { textAlign: 'left', padding: '8px 8px', borderBottom: '1px solid var(--cw-border)', fontWeight: 600, color: 'var(--cw-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 };
const td: React.CSSProperties = { padding: '8px 8px', borderBottom: '1px solid var(--cw-border)', verticalAlign: 'top' };
const secondaryBtn: React.CSSProperties = { background: '#f1f5f9', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)', padding: '6px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 };
const miniBtn: React.CSSProperties = { background: '#f1f5f9', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)', padding: '4px 10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 12 };
