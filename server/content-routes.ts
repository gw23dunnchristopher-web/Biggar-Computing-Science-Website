import type { Express, Request, Response, NextFunction } from 'express';
import { db } from './db';
import { eq, and, asc } from 'drizzle-orm';
import {
  bhsPapers, bhsQuestions, bhsAssignments,
  bhsAssignmentSections, bhsAssignmentParts,
} from '@shared/bhs-schema';

type Course = 'higher' | 'n5';

function getCourse(req: Request, res: Response): Course | null {
  const c = (req.query.course || req.body?.course || '') as string;
  if (c !== 'higher' && c !== 'n5') {
    res.status(400).json({ error: 'course must be "higher" or "n5"' });
    return null;
  }
  return c as Course;
}

export function registerContentRoutes(
  app: Express,
  requireTeacher: (req: Request, res: Response, next: NextFunction) => void,
) {
  if (!db) return;

  /* ── PAPERS ─────────────────────────────────────────────────────────── */

  app.get('/api/content/papers', requireTeacher, async (req, res) => {
    try {
      const course = getCourse(req, res); if (!course) return;
      const rows = await db!.select().from(bhsPapers)
        .where(eq(bhsPapers.course, course))
        .orderBy(asc(bhsPapers.createdAt));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/content/papers', requireTeacher, async (req, res) => {
    try {
      const course = getCourse(req, res); if (!course) return;
      const { title, isPublished = false } = req.body;
      if (!title) return res.status(400).json({ error: 'title is required' });
      const [row] = await db!.insert(bhsPapers)
        .values({ course, title, isPublished })
        .returning();
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/content/papers/:id', requireTeacher, async (req, res) => {
    try {
      const course = getCourse(req, res); if (!course) return;
      const { title, isPublished } = req.body;
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (isPublished !== undefined) updates.isPublished = isPublished;
      const [row] = await db!.update(bhsPapers).set(updates)
        .where(and(eq(bhsPapers.id, req.params.id), eq(bhsPapers.course, course)))
        .returning();
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/content/papers/:id', requireTeacher, async (req, res) => {
    try {
      const course = getCourse(req, res); if (!course) return;
      await db!.update(bhsQuestions)
        .set({ additionalPaperId: null, isAdditionalExam: false })
        .where(and(eq(bhsQuestions.additionalPaperId, req.params.id), eq(bhsQuestions.course, course)));
      await db!.delete(bhsPapers)
        .where(and(eq(bhsPapers.id, req.params.id), eq(bhsPapers.course, course)));
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  /* ── QUESTIONS ───────────────────────────────────────────────────────── */

  app.get('/api/content/questions', requireTeacher, async (req, res) => {
    try {
      const course = getCourse(req, res); if (!course) return;
      const rows = await db!.select().from(bhsQuestions)
        .where(eq(bhsQuestions.course, course))
        .orderBy(asc(bhsQuestions.year));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/content/questions/:id', requireTeacher, async (req, res) => {
    try {
      const course = getCourse(req, res); if (!course) return;
      const [row] = await db!.select().from(bhsQuestions)
        .where(and(eq(bhsQuestions.id, req.params.id), eq(bhsQuestions.course, course)));
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/content/questions', requireTeacher, async (req, res) => {
    try {
      const course = getCourse(req, res); if (!course) return;
      const q = req.body;
      if (!q.id || !q.year || !q.topic || !q.subQuestions) {
        return res.status(400).json({ error: 'id, year, topic, subQuestions are required' });
      }
      const [row] = await db!.insert(bhsQuestions)
        .values({ ...q, course })
        .returning();
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/content/questions/:id', requireTeacher, async (req, res) => {
    try {
      const course = getCourse(req, res); if (!course) return;
      const { id: _id, course: _c, ...updates } = req.body;
      const [row] = await db!.update(bhsQuestions).set(updates)
        .where(and(eq(bhsQuestions.id, req.params.id), eq(bhsQuestions.course, course)))
        .returning();
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/content/questions/:id', requireTeacher, async (req, res) => {
    try {
      const course = getCourse(req, res); if (!course) return;
      await db!.delete(bhsQuestions)
        .where(and(eq(bhsQuestions.id, req.params.id), eq(bhsQuestions.course, course)));
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  /* ── ASSIGNMENTS ─────────────────────────────────────────────────────── */

  app.get('/api/content/assignments', requireTeacher, async (req, res) => {
    try {
      const course = getCourse(req, res); if (!course) return;
      const rows = await db!.select().from(bhsAssignments)
        .where(eq(bhsAssignments.course, course))
        .orderBy(asc(bhsAssignments.year));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/content/assignments', requireTeacher, async (req, res) => {
    try {
      const course = getCourse(req, res); if (!course) return;
      const { title, year, totalMarks, totalTimeMinutes, isPublished, evidenceChecklist } = req.body;
      if (!title) return res.status(400).json({ error: 'title is required' });
      const [row] = await db!.insert(bhsAssignments)
        .values({
          course, title,
          year: year ?? new Date().getFullYear(),
          totalMarks: totalMarks ?? 40,
          totalTimeMinutes: totalTimeMinutes ?? 360,
          isPublished: isPublished ?? false,
          evidenceChecklist: evidenceChecklist ?? null,
        })
        .returning();
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/content/assignments/:id', requireTeacher, async (req, res) => {
    try {
      const course = getCourse(req, res); if (!course) return;
      const { title, year, totalMarks, totalTimeMinutes, isPublished, evidenceChecklist } = req.body;
      const updates: any = {};
      if (title !== undefined)            updates.title = title;
      if (year !== undefined)             updates.year = year;
      if (totalMarks !== undefined)       updates.totalMarks = totalMarks;
      if (totalTimeMinutes !== undefined) updates.totalTimeMinutes = totalTimeMinutes;
      if (isPublished !== undefined)      updates.isPublished = isPublished;
      if (evidenceChecklist !== undefined) updates.evidenceChecklist = evidenceChecklist;
      const [row] = await db!.update(bhsAssignments).set(updates)
        .where(and(eq(bhsAssignments.id, req.params.id), eq(bhsAssignments.course, course)))
        .returning();
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/content/assignments/:id', requireTeacher, async (req, res) => {
    try {
      const course = getCourse(req, res); if (!course) return;
      const sections = await db!.select({ id: bhsAssignmentSections.id })
        .from(bhsAssignmentSections).where(eq(bhsAssignmentSections.assignmentId, req.params.id));
      for (const s of sections) {
        await db!.delete(bhsAssignmentParts).where(eq(bhsAssignmentParts.sectionId, s.id));
      }
      await db!.delete(bhsAssignmentSections).where(eq(bhsAssignmentSections.assignmentId, req.params.id));
      await db!.delete(bhsAssignments)
        .where(and(eq(bhsAssignments.id, req.params.id), eq(bhsAssignments.course, course)));
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  /* ── ASSIGNMENT SECTIONS ─────────────────────────────────────────────── */

  app.get('/api/content/assignments/:assignmentId/sections', requireTeacher, async (req, res) => {
    try {
      const rows = await db!.select().from(bhsAssignmentSections)
        .where(eq(bhsAssignmentSections.assignmentId, req.params.assignmentId))
        .orderBy(asc(bhsAssignmentSections.orderIndex));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/content/assignments/:assignmentId/sections', requireTeacher, async (req, res) => {
    try {
      const { id: _id, ...rest } = req.body;
      const [row] = await db!.insert(bhsAssignmentSections)
        .values({ ...rest, assignmentId: req.params.assignmentId })
        .returning();
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/content/sections/:id', requireTeacher, async (req, res) => {
    try {
      const { id: _id, ...updates } = req.body;
      const [row] = await db!.update(bhsAssignmentSections).set(updates)
        .where(eq(bhsAssignmentSections.id, req.params.id))
        .returning();
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/content/sections/:id', requireTeacher, async (req, res) => {
    try {
      await db!.delete(bhsAssignmentParts).where(eq(bhsAssignmentParts.sectionId, req.params.id));
      await db!.delete(bhsAssignmentSections).where(eq(bhsAssignmentSections.id, req.params.id));
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  /* ── ASSIGNMENT PARTS ────────────────────────────────────────────────── */

  app.get('/api/content/sections/:sectionId/parts', requireTeacher, async (req, res) => {
    try {
      const rows = await db!.select().from(bhsAssignmentParts)
        .where(eq(bhsAssignmentParts.sectionId, req.params.sectionId))
        .orderBy(asc(bhsAssignmentParts.orderIndex));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/content/sections/:sectionId/parts', requireTeacher, async (req, res) => {
    try {
      const { id: _id, ...rest } = req.body;
      const [row] = await db!.insert(bhsAssignmentParts)
        .values({ ...rest, sectionId: req.params.sectionId })
        .returning();
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/content/parts/:id', requireTeacher, async (req, res) => {
    try {
      const { id: _id, ...updates } = req.body;
      const [row] = await db!.update(bhsAssignmentParts).set(updates)
        .where(eq(bhsAssignmentParts.id, req.params.id))
        .returning();
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/content/parts/:id', requireTeacher, async (req, res) => {
    try {
      await db!.delete(bhsAssignmentParts).where(eq(bhsAssignmentParts.id, req.params.id));
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
}
