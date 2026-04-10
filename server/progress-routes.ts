import { Express, Request, Response, NextFunction } from "express";
import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "./db";
import { sessions as revSessions } from "@shared/revision-schema";
import { studentExamResults, studentExamProgress } from "@shared/revision-schema";
import { examResults as n5ExamResults, activeExamProgress as n5ActiveExam } from "@shared/n5-schema";
import { bhsClasses, bhsStudents } from "@shared/bhs-schema";

async function requireTeacher(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const rows = await db.select().from(revSessions).where(eq(revSessions.token, token));
    const session = rows[0];
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    next();
  } catch (err) {
    console.error("[progress] auth error:", err);
    res.status(500).json({ error: "Auth check failed" });
  }
}

export function registerProgressRoutes(app: Express) {

  // ── All classes (both courses) ────────────────────────────────────────────
  app.get("/api/progress/classes", requireTeacher, async (_req, res) => {
    try {
      const classes = await db.select().from(bhsClasses).orderBy(bhsClasses.course, bhsClasses.name);
      const result = await Promise.all(classes.map(async (cls) => {
        const studs = await db.select({ id: bhsStudents.id })
          .from(bhsStudents).where(eq(bhsStudents.classId, cls.id));
        return { ...cls, studentCount: studs.length };
      }));
      res.json(result);
    } catch (err) {
      console.error("[progress] /classes error:", err);
      res.status(500).json({ error: "Failed to load classes" });
    }
  });

  // ── Students in a class with their result summaries ───────────────────────
  app.get("/api/progress/class/:classId", requireTeacher, async (req, res) => {
    try {
      const { classId } = req.params;
      const [cls] = await db.select().from(bhsClasses).where(eq(bhsClasses.id, classId));
      if (!cls) return res.status(404).json({ error: "Class not found" });

      const studs = await db.select().from(bhsStudents)
        .where(eq(bhsStudents.classId, classId))
        .orderBy(bhsStudents.username);

      const students = await Promise.all(studs.map(async (s) => {
        let results: { score: number; maxMarks: number; percentage: number; title: string; completedAt: Date }[] = [];
        let activeExam: string | null = null;

        if (cls.course === "higher") {
          const rows = await db.select().from(studentExamResults)
            .where(eq(studentExamResults.studentId, s.id))
            .orderBy(desc(studentExamResults.completedAt));
          results = rows.map(r => ({
            score: r.score ?? 0,
            maxMarks: r.maxMarks ?? 0,
            percentage: r.percentage ?? 0,
            title: r.examTitle ?? r.examIdentifier ?? "",
            completedAt: r.completedAt ?? new Date(),
          }));
          const [prog] = await db.select().from(studentExamProgress)
            .where(and(eq(studentExamProgress.studentId, s.id), eq(studentExamProgress.status, "in_progress")));
          if (prog) activeExam = prog.examTitle ?? prog.examIdentifier ?? "Exam in progress";
        } else {
          const rows = await db.select().from(n5ExamResults)
            .where(eq(n5ExamResults.studentId, s.id))
            .orderBy(desc(n5ExamResults.timestamp));
          results = rows.map(r => ({
            score: r.score ?? 0,
            maxMarks: r.maxScore ?? 0,
            percentage: r.maxScore ? Math.round((r.score / r.maxScore) * 100) : 0,
            title: r.additionalPaperId ? `Additional Paper (${r.year ?? ""})` : `${r.year ?? "Past Paper"}`,
            completedAt: r.timestamp ?? new Date(),
          }));
          const [prog] = await db.select().from(n5ActiveExam)
            .where(eq(n5ActiveExam.studentId, s.id))
            .orderBy(desc(n5ActiveExam.updatedAt))
            .limit(1);
          if (prog) activeExam = prog.examIdentifier ?? `${prog.year ?? ""} Paper`;
        }

        const avgPct = results.length
          ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
          : null;

        return {
          id: s.id,
          username: s.username,
          course: s.course,
          resultCount: results.length,
          avgPercentage: avgPct,
          lastCompleted: results[0]?.completedAt ?? null,
          activeExam,
        };
      }));

      res.json({ class: cls, students });
    } catch (err) {
      console.error("[progress] /class/:id error:", err);
      res.status(500).json({ error: "Failed to load class" });
    }
  });

  // ── Individual student detail ─────────────────────────────────────────────
  app.get("/api/progress/student/:studentId", requireTeacher, async (req, res) => {
    try {
      const { studentId } = req.params;
      const [student] = await db.select().from(bhsStudents).where(eq(bhsStudents.id, studentId));
      if (!student) return res.status(404).json({ error: "Student not found" });

      const [cls] = await db.select().from(bhsClasses).where(eq(bhsClasses.id, student.classId));

      let results: {
        id: string; title: string; score: number; maxMarks: number;
        percentage: number; completedAt: Date | null; breakdown?: any;
      }[] = [];
      let activeExam: { title: string; answeredCount: number; totalQuestions: number; timeLeft: number } | null = null;

      if (student.course === "higher") {
        const rows = await db.select().from(studentExamResults)
          .where(eq(studentExamResults.studentId, studentId))
          .orderBy(desc(studentExamResults.completedAt));
        results = rows.map(r => ({
          id: r.id,
          title: r.examTitle ?? r.examIdentifier ?? "Past Paper",
          score: r.score ?? 0,
          maxMarks: r.maxMarks ?? 0,
          percentage: r.percentage ?? 0,
          completedAt: r.completedAt ?? null,
        }));
        const [prog] = await db.select().from(studentExamProgress)
          .where(and(eq(studentExamProgress.studentId, studentId), eq(studentExamProgress.status, "in_progress")));
        if (prog) activeExam = {
          title: prog.examTitle ?? prog.examIdentifier ?? "Exam in progress",
          answeredCount: prog.answeredQuestions ?? 0,
          totalQuestions: prog.totalQuestions ?? 0,
          timeLeft: prog.timeLeft ?? 0,
        };
      } else {
        const rows = await db.select().from(n5ExamResults)
          .where(eq(n5ExamResults.studentId, studentId))
          .orderBy(desc(n5ExamResults.timestamp));
        results = rows.map(r => ({
          id: r.id,
          title: r.additionalPaperId ? `Additional Paper (${r.year ?? ""})` : `${r.year ?? "Past Paper"} Past Paper`,
          score: r.score ?? 0,
          maxMarks: r.maxScore ?? 0,
          percentage: r.maxScore ? Math.round((r.score / r.maxScore) * 100) : 0,
          completedAt: r.timestamp ?? null,
          breakdown: r.breakdown,
        }));
        const [prog] = await db.select().from(n5ActiveExam)
          .where(eq(n5ActiveExam.studentId, studentId))
          .orderBy(desc(n5ActiveExam.updatedAt)).limit(1);
        if (prog) activeExam = {
          title: prog.examIdentifier ?? `${prog.year ?? ""} Paper`,
          answeredCount: prog.answeredCount ?? 0,
          totalQuestions: prog.totalQuestions ?? 0,
          timeLeft: prog.timeLeft ?? 0,
        };
      }

      res.json({ student, class: cls, results, activeExam });
    } catch (err) {
      console.error("[progress] /student/:id error:", err);
      res.status(500).json({ error: "Failed to load student" });
    }
  });
}
