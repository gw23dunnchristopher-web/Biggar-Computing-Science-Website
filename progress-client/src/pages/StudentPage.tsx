import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { api, StudentDetail } from "../api";
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

export default function StudentPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params.studentId;
  const [, navigate] = useLocation();
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    label: r.title.length > 12 ? r.title.slice(0, 11) + "…" : r.title,
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
                height={220}
                barWidth={Math.max(32, Math.min(60, Math.floor(700 / Math.max(chartBars.length, 1)) - 14))}
                gap={12}
              />
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2>Completed Past Papers</h2>
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              {student.username} hasn't completed any past papers yet.
            </div>
          ) : (
            results.map((r, i) => (
              <div key={r.id} className="result-row">
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "var(--surface2)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", color: "var(--muted)", flexShrink: 0,
                }}>{i + 1}</div>

                <div style={{ flex: 1 }}>
                  <div className="result-title">{r.title}</div>
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

                <div style={{ width: 120, flexShrink: 0 }}>
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
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
