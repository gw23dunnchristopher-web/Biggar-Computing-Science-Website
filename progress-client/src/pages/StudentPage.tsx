import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { api, StudentDetail, AnswerItem } from "../api";
import BarChart from "../components/BarChart";

function ScorePill({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="score-pill none">—</span>;
  const cls = pct >= 70 ? "green" : pct >= 40 ? "amber" : "red";
  return <span className={`score-pill ${cls}`}>{pct}%</span>;
}

function CourseBadge({ course }: { course: string }) {
  return <span className={`course-badge ${course}`}>{course.toUpperCase()}</span>;
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function questionLabel(q: AnswerItem) {
  const base = q.questionTitle ?? q.questionText ?? "Question";
  return q.subLabel ? `${base} ${q.subLabel}` : base;
}

function QuestionBreakdown({ answers }: { answers: AnswerItem[] }) {
  // Group by questionTitle so we don't repeat the heading
  return (
    <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg)", padding: "0.75rem 1.25rem" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "0.6rem",
      }}>
        {answers.map((q, i) => {
          const pct = q.maxMarks > 0 ? Math.round((q.score / q.maxMarks) * 100) : 0;
          const barColour = q.score === q.maxMarks
            ? "#238636"
            : q.score > 0
            ? "#b08800"
            : "#da3633";
          const answerText = Object.values(q.userAnswer ?? {}).filter(Boolean).join(" / ");
          return (
            <div key={i} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              overflow: "hidden",
            }}>
              {/* Question header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.6rem 1rem",
                borderBottom: (q.feedback || q.suggestions) ? "1px solid var(--border)" : "none",
              }}>
                {/* Mini score badge */}
                <div style={{
                  minWidth: 48,
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: q.score === q.maxMarks ? "#4ade80" : q.score > 0 ? "#fbbf24" : "#f87171",
                  flexShrink: 0,
                }}>
                  {q.score}/{q.maxMarks}
                </div>
                {/* Mini progress bar */}
                <div style={{ width: 60, height: 5, background: "var(--border)", borderRadius: 3, flexShrink: 0 }}>
                  <div style={{
                    height: "100%",
                    width: `${q.maxMarks > 0 ? (q.score / q.maxMarks) * 100 : 0}%`,
                    background: barColour,
                    borderRadius: 3,
                  }} />
                </div>
                {/* Question label */}
                <div style={{ flex: 1, fontSize: "0.82rem", fontWeight: 500, color: "var(--text)" }}>
                  {questionLabel(q)}
                </div>
                {/* Answer preview */}
                {answerText && (
                  <div style={{
                    fontSize: "0.75rem",
                    color: "var(--muted)",
                    maxWidth: 220,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }} title={answerText}>
                    "{answerText}"
                  </div>
                )}
              </div>

              {/* Feedback + suggestions */}
              {(q.feedback || q.suggestions) && (
                <div style={{ padding: "0.6rem 1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {q.feedback && q.feedback.trim() && (
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.5 }}>
                      <span style={{
                        display: "inline-block",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "#4ade80",
                        marginRight: "0.5rem",
                      }}>Feedback</span>
                      {q.feedback}
                    </div>
                  )}
                  {q.suggestions && q.suggestions.trim() && (
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.5 }}>
                      <span style={{
                        display: "inline-block",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "#fbbf24",
                        marginRight: "0.5rem",
                      }}>Improve</span>
                      {q.suggestions}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StudentPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params.studentId;
  const [, navigate] = useLocation();
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!studentId) return;
    api.getStudent(studentId)
      .then(setData)
      .catch(e => {
        if (e.message?.includes("401")) { api.logout(); navigate("/login"); }
        else setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (loading) return (
    <div className="app-layout">
      <header className="app-header">
        <button className="back-btn" onClick={() => history.back()}>← Back</button>
        <div className="spacer" />
      </header>
      <main className="app-content"><div className="loading-center"><div className="spinner" /></div></main>
    </div>
  );

  if (error || !data) return (
    <div className="app-layout">
      <header className="app-header">
        <button className="back-btn" onClick={() => history.back()}>← Back</button>
        <div className="spacer" />
      </header>
      <main className="app-content"><div className="error-msg">{error || "Not found"}</div></main>
    </div>
  );

  const { student, class: cls, results, activeExam } = data;

  const avgPct = results.length
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : null;

  const best = results.reduce(
    (b, r) => r.percentage > (b?.percentage ?? -1) ? r : b,
    null as typeof results[0] | null
  );

  const chartBars = results.map(r => ({
    label: r.title,
    value: r.percentage,
  }));

  return (
    <div className="app-layout">
      <header className="app-header">
        <button className="back-btn" onClick={() => navigate(`/class/${student.classId}`)}>← Back</button>
        <div className="breadcrumb">
          <span className="crumb" onClick={() => navigate("/")}>All Classes</span>
          <span className="sep">›</span>
          <span className="crumb" onClick={() => navigate(`/class/${student.classId}`)}>{cls?.name ?? "Class"}</span>
          <span className="sep">›</span>
          <span className="crumb active">{student.username}</span>
        </div>
        <CourseBadge course={student.course} />
        <div className="spacer" />
        <button className="signout-btn" onClick={() => { api.logout(); navigate("/login"); }}>Sign Out</button>
      </header>

      <main className="app-content">
        {/* Active exam banner */}
        {activeExam && (
          <div style={{
            background: "rgba(35,134,54,0.1)",
            border: "1px solid rgba(74,222,128,0.3)",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}>
            <span className="active-dot" style={{ width: 10, height: 10 }} />
            <div>
              <div style={{ fontWeight: 600, color: "#4ade80", fontSize: "0.9rem" }}>
                Currently Working On: {activeExam.title}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                {activeExam.answeredCount} / {activeExam.totalQuestions} questions answered
                {activeExam.timeLeft > 0 && ` · ${fmtTime(activeExam.timeLeft)} remaining`}
              </div>
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="stat-row">
          <div className="stat-card">
            <div className={`stat-value ${avgPct === null ? "score-none" : avgPct >= 70 ? "score-green" : avgPct >= 40 ? "score-amber" : "score-red"}`}>
              {avgPct !== null ? `${avgPct}%` : "—"}
            </div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{results.length}</div>
            <div className="stat-label">Papers Completed</div>
          </div>
          {best && (
            <div className="stat-card">
              <div className="stat-value score-green">{best.percentage}%</div>
              <div className="stat-label">Best Result</div>
            </div>
          )}
          {results.length > 0 && (
            <div className="stat-card">
              <div className={`stat-value ${results[0].percentage >= 70 ? "score-green" : results[0].percentage >= 40 ? "score-amber" : "score-red"}`}>
                {results[0].percentage}%
              </div>
              <div className="stat-label">Most Recent</div>
            </div>
          )}
        </div>

        {/* Bar chart */}
        {chartBars.length > 0 && (
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div className="card-header">
              <h2>Past Paper Results</h2>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", marginLeft: "auto" }}>
                {results.length} completed
              </span>
            </div>
            <div className="card-body">
              <BarChart
                bars={chartBars}
                height={240}
                barWidth={Math.max(32, Math.min(60, Math.floor(700 / Math.max(chartBars.length, 1)) - 14))}
                gap={12}
              />
            </div>
          </div>
        )}

        {/* Results list with expandable breakdown */}
        <div className="card">
          <div className="card-header">
            <h2>Completed Past Papers</h2>
            {results.some(r => r.answers?.length) && (
              <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginLeft: "auto" }}>
                Click a paper to see question-by-question breakdown
              </span>
            )}
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              {student.username} hasn't completed any past papers yet.
            </div>
          ) : (
            results.map((r, i) => {
              const isOpen = expanded.has(r.id);
              const hasBreakdown = !!(r.answers?.length);
              return (
                <div key={r.id}>
                  {/* Result row */}
                  <div
                    className="result-row"
                    onClick={() => hasBreakdown && toggleExpand(r.id)}
                    style={{ cursor: hasBreakdown ? "pointer" : "default" }}
                  >
                    {/* Rank */}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "var(--surface2)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: "0.75rem", color: "var(--muted)", flexShrink: 0,
                    }}>{i + 1}</div>

                    <div style={{ flex: 1 }}>
                      <div className="result-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {r.title}
                        {hasBreakdown && (
                          <span style={{
                            fontSize: "0.68rem",
                            color: "var(--muted)",
                            border: "1px solid var(--border2)",
                            borderRadius: "4px",
                            padding: "0.05rem 0.35rem",
                          }}>
                            {r.answers!.length} questions
                          </span>
                        )}
                      </div>
                      <div className="result-meta">
                        {r.score} / {r.maxMarks} marks
                        {r.completedAt && (
                          <span style={{ marginLeft: "0.75rem" }}>
                            {new Date(r.completedAt).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric"
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: 100, flexShrink: 0 }}>
                      <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", marginBottom: "0.25rem" }}>
                        <div style={{
                          height: "100%",
                          width: `${r.percentage}%`,
                          background: r.percentage >= 70 ? "#238636" : r.percentage >= 40 ? "#b08800" : "#da3633",
                          borderRadius: 3,
                          transition: "width 0.4s ease",
                        }} />
                      </div>
                    </div>

                    <ScorePill pct={r.percentage} />

                    {/* Expand chevron */}
                    {hasBreakdown && (
                      <span style={{
                        color: "var(--muted)",
                        fontSize: "0.8rem",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        flexShrink: 0,
                      }}>▼</span>
                    )}
                  </div>

                  {/* Expandable question breakdown */}
                  {hasBreakdown && isOpen && (
                    <QuestionBreakdown answers={r.answers!} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
