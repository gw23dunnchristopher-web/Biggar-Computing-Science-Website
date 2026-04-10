import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { api, ClassSummary } from "../api";

function CourseBadge({ course }: { course: string }) {
  return <span className={`course-badge ${course}`}>{course.toUpperCase()}</span>;
}

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getClasses()
      .then(setClasses)
      .catch(e => {
        if (e.message?.includes("401") || e.message?.toLowerCase().includes("auth")) {
          api.logout();
          navigate("/login");
        } else {
          setError(e.message);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function signOut() {
    api.logout();
    navigate("/login");
  }

  const grouped: Record<string, ClassSummary[]> = {};
  for (const cls of classes) {
    if (!grouped[cls.course]) grouped[cls.course] = [];
    grouped[cls.course].push(cls);
  }

  const courseOrder = ["higher", "n5", "n4"];
  const courseLabels: Record<string, string> = {
    higher: "Higher Computing Science",
    n5:     "National 5 Computing Science",
    n4:     "National 4 Computing Science",
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon">📊</div>
          BHS Progress Tracker
        </div>
        <div className="spacer" />
        <button className="signout-btn" onClick={signOut}>Sign Out</button>
      </header>

      <main className="app-content">
        {loading && <div className="loading-center"><div className="spinner" /></div>}
        {error && <div className="error-msg" style={{ marginBottom: "1rem" }}>{error}</div>}
        {!loading && classes.length === 0 && !error && (
          <div className="empty-state">No classes found.</div>
        )}

        {courseOrder
          .filter(c => grouped[c]?.length)
          .map(course => (
            <div key={course} style={{ marginBottom: "2rem" }}>
              <p className="section-heading">{courseLabels[course] ?? course}</p>
              <div className="class-grid">
                {grouped[course].map(cls => (
                  <div
                    key={cls.id}
                    className="class-card"
                    onClick={() => navigate(`/class/${cls.id}`)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <CourseBadge course={cls.course} />
                      <span className="class-name">{cls.name}</span>
                    </div>
                    <div className="class-meta">
                      <span>👤 {cls.studentCount} student{cls.studentCount !== 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span>Created {new Date(cls.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                      Click to view student progress →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </main>
    </div>
  );
}
