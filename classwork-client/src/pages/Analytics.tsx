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
    question_id: string;
    question_prompt: string;
    question_type: string;
    question_max_marks: number;
    lesson_id: string;
    lesson_title: string;
    unit_id: string;
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
  // Tracks which submission rows have their question text / answer / feedback
  // expanded. Keyed by submission id so resubmissions of the same question
  // toggle independently. Survives across re-renders within the panel.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  function toggleRow(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }
  // Per-unit collapse state. Default behaviour: only the first unit is open
  // when the panel mounts — subsequent units stay collapsed because a busy
  // course can have a dozen+ units and rendering every lesson table at
  // once buries the headers. `null` means "use default", `true`/`false`
  // means the teacher has explicitly toggled it.
  const [unitOpen, setUnitOpen] = useState<Record<string, boolean>>({});
  function toggleUnit(id: string, defaultOpen: boolean) {
    setUnitOpen((u) => ({ ...u, [id]: !(id in u ? u[id] : defaultOpen) }));
  }

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setErr(null);
    setExpanded({});
    api<StudentAnalytics>(`/api/classwork/${course}/students/${studentId}/analytics`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setErr(e.message || 'Failed to load'); });
    return () => { cancelled = true; };
  }, [course, studentId]);

  if (err) return <p style={{ color: 'var(--cw-danger)', margin: 0 }}>{err}</p>;
  if (!data) return <p style={{ color: 'var(--cw-muted)', margin: 0 }}>Loading student detail…</p>;

  // Build a two-level grouping (unit → lesson → submissions) while
  // preserving the natural curriculum order. The server already returns
  // submissions sorted by `unit.order_index, lesson.order_index,
  // question.order_index`, so iterating once and appending to the most
  // recently-seen unit / lesson keeps everything in syllabus order without
  // a second sort pass.
  type Row = StudentAnalytics['submissions'][number];
  type LessonGroup = { lessonId: string; lessonTitle: string; rows: Row[] };
  type UnitGroup = { unitId: string; unitTitle: string; lessons: LessonGroup[]; lessonIndex: Map<string, LessonGroup> };
  const units: UnitGroup[] = [];
  const unitIndex = new Map<string, UnitGroup>();
  for (const s of data.submissions) {
    let u = unitIndex.get(s.unit_id);
    if (!u) {
      u = { unitId: s.unit_id, unitTitle: s.unit_title, lessons: [], lessonIndex: new Map() };
      unitIndex.set(s.unit_id, u);
      units.push(u);
    }
    let l = u.lessonIndex.get(s.lesson_id);
    if (!l) {
      l = { lessonId: s.lesson_id, lessonTitle: s.lesson_title, rows: [] };
      u.lessonIndex.set(s.lesson_id, l);
      u.lessons.push(l);
    }
    l.rows.push(s);
  }

  // Quick per-unit roll-up so the unit heading can show "X / Y marks · Z%"
  // at a glance — saves the teacher having to add columns up by eye.
  function rollUp(rows: Row[]) {
    let got = 0, max = 0;
    for (const r of rows) {
      if (r.marks_awarded != null) { got += r.marks_awarded; max += r.question_max_marks; }
    }
    const pct = max > 0 ? (got / max) * 100 : null;
    return { got, max, pct };
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Activity calendar always shows, even before the pupil has submitted
          anything — opening a lesson page already counts as activity, so it
          gives teachers an "are they engaging at all?" signal. */}
      <StudentActivityCalendar course={course} studentId={studentId} />
      {!data.submissions.length && (
        <p style={{ color: 'var(--cw-muted)', margin: 0 }}>No submissions yet.</p>
      )}
      {units.map((u, uIdx) => {
        const unitRoll = rollUp(u.lessons.flatMap((l) => l.rows));
        // First unit is open by default to give an immediate at-a-glance
        // view; later units stay collapsed until the teacher clicks them.
        const defaultOpen = uIdx === 0;
        const isUnitOpen = u.unitId in unitOpen ? unitOpen[u.unitId] : defaultOpen;
        const lessonCount = u.lessons.length;
        return (
          <div key={u.unitId} style={unitGroupStyle}>
            {/* Whole header is one big button so the entire bar is a click
                target — easier than aiming at a tiny chevron when there are
                a dozen units stacked up. */}
            <button
              type="button"
              onClick={() => toggleUnit(u.unitId, defaultOpen)}
              aria-expanded={isUnitOpen}
              style={{
                ...unitHeaderStyle,
                width: '100%', textAlign: 'left',
                border: 'none', cursor: 'pointer', font: 'inherit',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <span aria-hidden="true" style={{
                display: 'inline-block', width: 14, color: 'var(--cw-muted)',
                fontSize: 11, transform: isUnitOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 120ms ease',
              }}>▶</span>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--cw-ink)', flex: 1 }}>{u.unitTitle}</h3>
              <span style={{ fontSize: 12, color: 'var(--cw-muted)' }}>
                {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
                {' · '}
                {unitRoll.max > 0
                  ? <>{unitRoll.got} / {unitRoll.max} marks · {unitRoll.pct!.toFixed(0)}%</>
                  : <>No marks yet</>}
              </span>
            </button>
            {isUnitOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
              {u.lessons.map((l) => {
                const lessonRoll = rollUp(l.rows);
                // Each unique question_id gets a stable 1-based number within
                // its lesson, matching the Q1 / Q2 / Q3 numbering pupils see
                // when they open the lesson page itself. We assign by first
                // appearance — server already returns rows in question
                // order_index — so a question that was resubmitted twice
                // shares the same number across both rows.
                const qNumByQid = new Map<string, number>();
                for (const r of l.rows) {
                  if (!qNumByQid.has(r.question_id)) qNumByQid.set(r.question_id, qNumByQid.size + 1);
                }
                return (
                  <div key={l.lessonId}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                        <Link href={`/lesson/${l.lessonId}`} style={{ color: 'var(--cw-accent)' }}>{l.lessonTitle}</Link>
                      </h4>
                      <span style={{ fontSize: 11, color: 'var(--cw-muted)' }}>
                        {l.rows.length} {l.rows.length === 1 ? 'question' : 'questions'}
                        {lessonRoll.max > 0 && <> · {lessonRoll.got} / {lessonRoll.max} · {lessonRoll.pct!.toFixed(0)}%</>}
                      </span>
                    </div>
                    <table style={tbl}>
                      <thead>
                        <tr>
                          <th style={{ ...th, width: 56 }}>Q</th>
                          <th style={th}>Type</th>
                          <th style={th}>Mark</th>
                          <th style={th}>%</th>
                          <th style={th}>When</th>
                          <th style={{ ...th, width: 72 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {l.rows.map((s) => {
                          const pct = s.marks_awarded != null && s.question_max_marks > 0
                            ? (s.marks_awarded / s.question_max_marks) * 100 : null;
                          const isOpen = !!expanded[s.id];
                          const qNum = qNumByQid.get(s.question_id);
                          return (
                            <RowGroup key={s.id}>
                              <tr>
                                <td style={td}>
                                  <strong style={{ fontSize: 14 }}>Q{qNum}</strong>
                                </td>
                                <td style={td}>{s.question_type}</td>
                                <td style={td}>{s.marks_awarded != null ? `${s.marks_awarded} / ${s.question_max_marks}` : 'pending'}</td>
                                <td style={td}><PercentBar value={pct} /></td>
                                <td style={td}>{new Date(s.submitted_at).toLocaleString()}</td>
                                <td style={td}>
                                  <button
                                    type="button"
                                    onClick={() => toggleRow(s.id)}
                                    style={miniBtn}
                                    aria-expanded={isOpen}
                                    aria-label={isOpen ? 'Hide question details' : 'Show question, answer and feedback'}
                                    title={isOpen ? 'Hide details' : 'Show question, answer and feedback'}
                                  >
                                    {isOpen ? '▾ Hide' : '▸ Show'}
                                  </button>
                                </td>
                              </tr>
                              {isOpen && (
                                <tr>
                                  <td colSpan={6} style={{ ...td, background: '#fafbfd', padding: '10px 12px' }}>
                                    <SubmissionDetails s={s} />
                                  </td>
                                </tr>
                              )}
                            </RowGroup>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const unitGroupStyle: React.CSSProperties = {
  border: '1px solid var(--cw-border)', borderRadius: 10, background: '#fff',
  overflow: 'hidden',
};
const unitHeaderStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
  flexWrap: 'wrap', gap: 8,
  padding: '8px 12px',
  background: '#eef2ff', borderBottom: '1px solid var(--cw-border)',
};

/* ---------- Per-submission expanded details ---------- */

// Renders the full question prompt, the student's actual answer (whatever
// shape it took for that question type) and the AI feedback in a clean
// label/value grid. Shown inside a row that's been expanded via the "Show"
// toggle — kept collapsed by default so the table stays compact and the
// teacher only loads the heavy text for whichever questions they're
// actually inspecting.
function SubmissionDetails({ s }: { s: StudentAnalytics['submissions'][number] }) {
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
    color: 'var(--cw-muted)',
  };
  const valueStyle: React.CSSProperties = {
    fontSize: 13, color: 'var(--cw-ink)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  };

  // Stitch together whichever answer field(s) the question type populated.
  // Most question types use exactly one of these; a few (e.g. link + note)
  // use two, hence the array-and-join approach instead of a switch.
  const answerParts: React.ReactNode[] = [];
  if (s.text_answer) {
    answerParts.push(<div key="t" style={valueStyle}>{s.text_answer}</div>);
  }
  if (s.selected_option_label) {
    answerParts.push(
      <div key="o" style={valueStyle}>
        <em style={{ color: 'var(--cw-muted)' }}>Selected option:</em> {s.selected_option_label}
      </div>
    );
  }
  if (s.link_url) {
    answerParts.push(
      <div key="l" style={valueStyle}>
        <a href={s.link_url} target="_blank" rel="noreferrer" style={{ color: 'var(--cw-accent)' }}>{s.link_url}</a>
      </div>
    );
  }
  if (s.file_url) {
    answerParts.push(
      <div key="f" style={valueStyle}>
        <a href={s.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--cw-accent)' }}>View uploaded file</a>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'minmax(80px, max-content) 1fr',
      gap: '6px 14px', alignItems: 'start',
    }}>
      <div style={labelStyle}>Question</div>
      <div style={valueStyle}>{s.question_prompt || <em style={{ color: 'var(--cw-muted)' }}>(no prompt)</em>}</div>
      <div style={labelStyle}>Answer</div>
      <div>
        {answerParts.length > 0
          ? answerParts
          : <em style={{ color: 'var(--cw-muted)', fontSize: 13 }}>No answer recorded.</em>}
      </div>
      <div style={labelStyle}>Feedback</div>
      <div style={valueStyle}>
        {s.ai_feedback || <em style={{ color: 'var(--cw-muted)' }}>No feedback recorded.</em>}
      </div>
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

  // Fixed cell size keeps the whole grid compact regardless of how wide the
  // surrounding StudentDetail panel happens to be — without this the cells
  // stretch to fill the row and the calendar dominates the panel. We size
  // the panel to fit its grid exactly and use `margin: 0 auto` so it sits
  // centred within whatever StudentDetail column it's rendered into.
  const CELL = 28;
  const GAP = 4;
  const gridWidth = CELL * 7 + GAP * 6;

  return (
    <div style={{
      border: '1px solid var(--cw-border)', borderRadius: 8, padding: 10,
      background: '#fafbff', display: 'flex', flexDirection: 'column', gap: 6,
      width: 'fit-content', margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: gridWidth }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>Activity</div>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={() => shift(-1)} disabled={!canGoBack} style={navBtn(!canGoBack)} aria-label="Previous month">‹</button>
        <div style={{ fontSize: 11, fontWeight: 600, minWidth: 96, textAlign: 'center' }}>{monthLabel}</div>
        <button type="button" onClick={() => shift(1)} disabled={!canGoFwd} style={navBtn(!canGoFwd)} aria-label="Next month">›</button>
      </div>
      {err && <div style={{ fontSize: 11, color: 'var(--cw-danger)' }}>{err}</div>}
      {!err && days === null && <div style={{ fontSize: 11, color: 'var(--cw-muted)' }}>Loading activity…</div>}
      {!err && days !== null && (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: `repeat(7, ${CELL}px)`, gap: GAP,
            fontSize: 9, color: 'var(--cw-muted)', textAlign: 'center',
          }}>
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} style={{ padding: '1px 0', fontWeight: 600 }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${CELL}px)`, gap: GAP }}>
            {cells.map((c, i) => {
              if (!c) return <div key={`b${i}`} style={{ width: CELL, height: CELL }} />;
              const isActive = days.has(c.iso);
              const isToday = c.iso === todayIso;
              const isFuture = c.iso > todayIso;
              return (
                <div
                  key={c.iso}
                  title={isActive ? `Active on ${c.iso}` : isFuture ? '' : `No activity on ${c.iso}`}
                  style={{
                    width: CELL, height: CELL,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: isActive ? 700 : 500,
                    borderRadius: 4,
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
          <div style={{ fontSize: 10, color: 'var(--cw-muted)', width: gridWidth, lineHeight: 1.3 }}>
            {activeInMonth} {activeInMonth === 1 ? 'day' : 'days'} this month · {totalActive} in 12 months
          </div>
        </>
      )}
    </div>
  );
}

function navBtn(disabled: boolean): React.CSSProperties {
  return {
    width: 20, height: 20, borderRadius: 4,
    border: '1px solid var(--cw-border)', background: '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    fontSize: 13, lineHeight: 1, padding: 0,
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
// Single-line ellipsis cell. `<td>` `maxWidth` is unreliable on its own —
// browsers happily widen table columns to fit content. Wrapping the cell's
// contents in a fixed-width inner div with overflow:hidden + ellipsis is
// what actually keeps long question prompts and AI feedback in their lane.
function ellipsisCell(maxPx: number): React.CSSProperties {
  return { maxWidth: maxPx, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
}
