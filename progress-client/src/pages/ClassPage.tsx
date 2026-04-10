import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { api, ClassDetail, StudentSummary } from "../api";
import BarChart from "../components/BarChart";

function ScorePill({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="score-pill none">—</span>;
  const cls = pct >= 70 ? "green" : pct >= 40 ? "amber" : "red";
  return <span className={`score-pill ${cls}`}>{pct}%</span>;
}

function CourseBadge({ course }: { course: string }) {
  return <span className={`course-badge ${course}`}>{course.toUpperCase()}</span>;
}

export default function ClassPage() {
  const params = useParams<{ classId: string }>();
  const classId = params.classId;
  const [, navigate] = useLocation();
  const [data, setData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<"name" | "score" | "papers">("score");

  useEffect(() => {
    if (!classId) return;
    api.getClass(classId)
      .then(setData)
      .catch(e => {
        if (e.message?.includes("401")) { api.logout(); navigate("/login"); }
        else setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) return (
    <div className="app-layout">
      <header className="app-header">
        <button className="back-btn" onClick={() => navigate("/")}>← Back</button>
        <div className="spacer" />
      </header>
      <main className="app-content"><div className="loading-center"><div className="spinner" /></div></main>
    </div>
  );

  if (error || !data) return (
    <div className="app-layout">
      <header className="app-header">
        <button className="back-btn" onClick={() => navigate("/")}>← Back</button>
        <div className="spacer" />
      </header>
      <main className="app-content"><div className="error-msg">{error || "Not found"}</div></main>
    </div>
  );

  const { class: cls, students } = data;

  const sorted = [...students].sort((a, b) => {
    if (sort === "name")   return a.username.localeCompare(b.username);
    if (sort === "score")  return (b.avgPercentage ?? -1) - (a.avgPercentage ?? -1);
    if (sort === "papers") return b.resultCount - a.resultCount;
    return 0;
  });

  const withResults = students.filter(s => s.avgPercentage !== null);
  const classAvg = withResults.length
    ? Math.round(withResults.reduce((s, x) => s + (x.avgPercentage ?? 0), 0) / withResults.length)
    : null;
  const activeCount = students.filter(s => s.activeExam).length;

  const chartBars = [...students]
    .sort((a, b) => (b.avgPercentage ?? -1) - (a.avgPercentage ?? -1))
    .map(s => ({ label: s.username, value: s.avgPercentage, active: !!s.activeExam }));

  return (
    <div className="app-layout">
      <header className="app-header">
        <button className="back-btn" onClick={() => navigate("/")}>← Back</button>
        <div className="breadcrumb">
          <span className="crumb" onClick={() => navigate("/")}>All Classes</span>
          <span className="sep">›</span>
          <span className="crumb active">{cls.name}</span>
        </div>
        <CourseBadge course={cls.course} />
        <div className="spacer" />
        <button className="signout-btn" onClick={() => { api.logout(); navigate("/login"); }}>Sign Out</button>
      </header>

      <main className="app-content">
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-value">{students.length}</div>
            <div className="stat-label">Students</div>
          </div>
          <div className="stat-card">
            <div className={`stat-value ${classAvg === null ? "score-none" : classAvg >= 70 ? "score-green" : classAvg >= 40 ? "score-amber" : "score-red"}`}>
              {classAvg !== null ? `${classAvg}%` : "—"}
            </div>
            <div className="stat-label">Class Average</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{students.reduce((s, x) => s + x.resultCount, 0)}</div>
            <div className="stat-label">Past Papers Done</div>
          </div>
          {activeCount > 0 && (
            <div className="stat-card">
              <div className="stat-value score-green">{activeCount}</div>
              <div className="stat-label">Currently Active</div>
            </div>
          )}
        </div>

        {chartBars.length > 0 && (
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div className="card-header">
              <h2>Average Score Per Student</h2>
              {activeCount > 0 && (
                <span style={{ fontSize: "0.75rem", color: "#4ade80" }}>
                  <span className="active-dot" />active now
                </span>
              )}
            </div>
            <div className="card-body">
              <BarChart
                bars={chartBars}
                height={220}
                barWidth={Math.max(28, Math.min(48, Math.floor(700 / chartBars.length) - 14))}
                gap={12}
              />
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2>Students</h2>
            <div style={{ display: "flex", gap: "0.4rem", marginLeft: "auto" }}>
              {(["score", "papers", "name"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  style={{
                    background: sort === s ? "var(--accent)" : "none",
                    border: "1px solid var(--border2)",
                    color: sort === s ? "#fff" : "var(--muted)",
                    borderRadius: "6px",
                    padding: "0.2rem 0.6rem",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {s === "score" ? "Avg Score" : s === "papers" ? "Papers" : "Name"}
                </button>
              ))}
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="empty-state">No students in this class yet.</div>
          ) : (
            <table className="student-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Avg Score</th>
                  <th>Papers Done</th>
                  <th>Last Activity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => (
                  <tr key={s.id} onClick={() => navigate(`/student/${s.id}`)}>
                    <td style={{ fontWeight: 500 }}>{s.username}</td>
                    <td><ScorePill pct={s.avgPercentage} /></td>
                    <td style={{ color: s.resultCount === 0 ? "var(--muted)" : "var(--text)" }}>
                      {s.resultCount === 0 ? "None yet" : s.resultCount}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                      {s.lastCompleted
                        ? new Date(s.lastCompleted).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td>
                      {s.activeExam ? (
                        <span style={{ color: "#4ade80", fontSize: "0.8rem" }}>
                          <span className="active-dot" />
                          {s.activeExam}
                        </span>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
