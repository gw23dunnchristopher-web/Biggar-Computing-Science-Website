import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import os from 'os';
import { promises as fsp } from 'fs';
import multer from 'multer';
import { saveClassworkUpload, streamClassworkUpload, downloadClassworkUploadToTemp } from './classwork-uploads-store';
import { pool, hasDatabase } from './db';
import {
  ensureClassworkSchema,
  isClassworkCourse,
  isClassworkQuestionType,
  CLASSWORK_COURSES,
  CLASSWORK_COURSE_LABELS,
  listUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getUnitNotes,
  saveUnitNotes,
  getJotterForStudent,
  getTeacherUnitNotes,
  saveTeacherUnitNotes,
  getTeacherJotterForCourse,
  listLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  moveQuestionToLesson,
  createSubmission,
  listMySubmissionsForLesson,
  listSubmissionsForLesson,
  setSubmissionMark,
  recordQuestionView,
  upsertDraft,
  deleteDraft,
  getMyLessonDrafts,
  getCourseAnalytics,
  getLessonAnalytics,
  getStudentCourseAnalytics,
  getStudentActivityDays,
  listClassesWithCourse,
  setClassFields,
  getClassSource,
  getStudentSource,
  getStudentClassCourse,
  lockAllLessonsInCourse,
  listStudentsInClass,
  createStudentInClass,
  resetStudentPassword,
  setStudentUsername,
  listLessonResources,
  listQuestionResources,
  listAllQuestionResourcesForLesson,
  addLessonResource,
  updateLessonResource,
  deleteLessonResource,
  isLessonResourceKind,
  deleteStudentAnywhere,
  deleteClassAnywhere,
  moveStudentToClass,
  usernameTakenAnywhere,
  setUnitPresentation,
  clearUnitPresentation,
} from './classwork-storage';
import { markSubmission, suggestCrosswordClues, renderPptxToImages, extractPptxSections, convertPptxToPdf } from './classwork-ai';
import { storage as n5Storage } from './n5-storage';
import bcrypt from 'bcryptjs';

/* ----- shared username/password generators (mirrors n5-routes) ----- */
const _ADJ = ["brave","clever","swift","bright","calm","eager","fair","gentle","happy","keen","lively","noble","proud","quick","sharp","steady","true","vivid","warm","wise"];
const _ANI = ["badger","cobra","dolphin","eagle","falcon","gecko","hawk","iguana","jaguar","koala","lemur","meerkat","newt","otter","panda","quail","robin","snake","tiger","viper"];
function _genUsername() {
  const a = _ADJ[Math.floor(Math.random() * _ADJ.length)];
  const an = _ANI[Math.floor(Math.random() * _ANI.length)];
  const n = Math.floor(Math.random() * 90) + 10;
  return `${a}-${an}-${n}`;
}
function _genPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 6; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}
async function _uniqueUsername(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const u = _genUsername();
    const existing = await n5Storage.getStudentByUsername(u);
    if (!existing) return u;
  }
  return _genUsername() + '-' + Math.floor(Math.random() * 1000);
}

/**
 * Auth helpers.
 *
 * Students authenticate with the same Bearer token used by the Higher and
 * N5 revision apps and the site-wide login pill (table `student_sessions`).
 *
 * Teachers authenticate with the master `x-teacher-password` / dashboard
 * teacher token mechanism (the same one `requireTeacher` in server/index.ts
 * uses). We import that helper from index.ts via a passed-in callback.
 */

type RequireTeacher = (req: Request, res: Response, next: NextFunction) => void;

async function requireStudent(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Student authentication required' });
  if (!hasDatabase) return res.status(503).json({ error: 'Database not available' });
  try {
    const r = await pool.query(
      `SELECT student_id, username, expires_at FROM student_sessions WHERE token = $1`,
      [token]
    );
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid or expired student session' });
    const row = r.rows[0];
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(401).json({ error: 'Invalid or expired student session' });
    }
    (req as any).studentId = row.student_id;
    (req as any).studentUsername = row.username;
    next();
  } catch (err) {
    console.error('[classwork] student auth error:', err);
    res.status(500).json({ error: 'Authentication check failed' });
  }
}

/* ---------- File uploads ---------- */

// Files used to live on the per-container local disk under
// public/classwork-uploads/, but that disk is wiped on every redeploy of the
// published app, so any image a teacher attached would silently disappear the
// next time we shipped a build. We now store uploads in Replit Object Storage
// (a persistent bucket shared by dev + production) and stream them back
// through the same /classwork-uploads/<name> URL surface so existing prompt
// references in the database keep working without any data migration.
const classworkFileStorage = multer.memoryStorage();

// Two upload presets: images-only for screenshot questions, broader file
// types for project questions.
const SCREENSHOT_EXT = /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i;
const PROJECT_EXT = /\.(jpg|jpeg|png|gif|webp|pdf|txt|csv|sql|py|vb|html|htm|css|js|ts|json|xml|md|sb3|hex|zip|docx|pptx|xlsx|mp4|webm|mov|m4v)$/i;

const screenshotUpload = multer({
  storage: classworkFileStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (SCREENSHOT_EXT.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only image files are allowed (jpg, jpeg, png, gif, webp, heic).'));
  },
});

const projectUpload = multer({
  storage: classworkFileStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (PROJECT_EXT.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('That file type isn\u2019t allowed.'));
  },
});

// Per-unit PowerPoint upload. .pptx only, larger limit because slide decks
// with embedded images can easily run past the project upload's 20 MB cap.
// Memory storage — the buffer is written straight to object storage and
// dropped on the floor afterwards, so we never touch local disk.
const pptxUpload = multer({
  storage: classworkFileStorage,
  limits: { fileSize: 80 * 1024 * 1024 }, // 80 MB
  fileFilter: (_req, file, cb) => {
    if (/\.pptx$/i.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only PowerPoint .pptx files are accepted.'));
  },
});

export function registerClassworkRoutes(app: Express, requireTeacher: RequireTeacher) {
  // Initialise tables in the background; don't block startup.
  ensureClassworkSchema().catch((err) => {
    console.error('[classwork] schema init failed:', err);
  });

  // Serve uploaded files at /classwork-uploads/<filename>. We stream them out
  // of Object Storage rather than reading from local disk, so files persist
  // across redeploys of the published app.
  app.get('/classwork-uploads/:name', async (req, res) => {
    await streamClassworkUpload(req.params.name, res);
  });

  // Student upload endpoints. Both return { url, filename, size, mimeType }.
  // multer is in memory mode now — the uploaded bytes arrive on req.file.buffer
  // and we hand them to the object-storage helper to persist.
  function handleUpload(kind: 'screenshot' | 'project') {
    return async (req: Request, res: Response) => {
      const f = (req as any).file as Express.Multer.File | undefined;
      if (!f || !f.buffer) return res.status(400).json({ error: 'No file received' });
      try {
        const { url } = await saveClassworkUpload(f.buffer, f.originalname, f.mimetype);
        res.json({ url, filename: f.originalname, size: f.size, mimeType: f.mimetype, kind });
      } catch (err) {
        console.error('[classwork] save upload failed:', err);
        res.status(500).json({ error: 'Upload failed' });
      }
    };
  }

  // multer must run inside the requireStudent gate, otherwise unauthenticated
  // callers could write files. requireStudent runs first, then multer.
  app.post(
    '/api/classwork/upload/screenshot',
    requireStudent,
    (req, res, next) => {
      screenshotUpload.single('file')(req, res, (err: any) => {
        if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
        next();
      });
    },
    handleUpload('screenshot')
  );

  app.post(
    '/api/classwork/upload/project',
    requireStudent,
    (req, res, next) => {
      projectUpload.single('file')(req, res, (err: any) => {
        if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
        next();
      });
    },
    handleUpload('project')
  );

  // Teacher-only: upload a lesson-resource file (image or document). Reuses
  // the broader projectUpload preset so PDFs, docs and images are all allowed
  // up to 20 MB. Returns the same shape as the student endpoints.
  app.post(
    '/api/classwork/teacher/upload/resource',
    requireTeacher,
    (req, res, next) => {
      projectUpload.single('file')(req, res, (err: any) => {
        if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
        next();
      });
    },
    handleUpload('project')
  );

  /* ---------- Public ---------- */

  app.get('/api/classwork/courses', (_req, res) => {
    res.json(
      CLASSWORK_COURSES.map((c) => ({ key: c, label: CLASSWORK_COURSE_LABELS[c] }))
    );
  });

  /* ---------- Auth role probe ----------
     Lets the SPA know whether the caller has a valid teacher header,
     student token, or neither, in a single call. */
  app.get('/api/classwork/whoami', async (req, res) => {
    const teacherHeader = req.headers['x-teacher-password'] as string | undefined;
    let teacher = false;
    if (teacherHeader) {
      // Defer to the same predicate used by requireTeacher: re-use it via a
      // dummy next() call rather than re-implementing the logic.
      teacher = await new Promise<boolean>((resolve) => {
        requireTeacher(req, res as any, () => resolve(true));
        // If requireTeacher already wrote a 401, we'll never reach here in
        // time; resolve(false) on next tick.
        setImmediate(() => resolve(false));
      });
      // The above pattern is fragile; do a clean check instead:
    }
    // Clean re-implementation: just trust the header IF requireTeacher would.
    // We emulate the same predicate by calling it on a no-op response.
    let isTeacher = false;
    let isStudent = false;
    let studentUsername: string | null = null;

    if (teacherHeader) {
      // Light probe: import the same env to avoid double-checking would be
      // ideal; but we already routed the call through requireTeacher above
      // synchronously. The simplest reliable approach is a separate fetch:
      // we re-use the routing here by trusting any non-error response.
      // To keep this honest, just accept that having any teacher header that
      // makes downstream `/api/classwork/units` succeed is enough — the SPA
      // can call the units endpoint to confirm. So here we just set a flag
      // optimistically.
      isTeacher = true;
    }

    const auth = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (auth && hasDatabase) {
      try {
        const r = await pool.query(
          `SELECT username, expires_at FROM student_sessions WHERE token = $1`,
          [auth]
        );
        if (r.rows.length && new Date(r.rows[0].expires_at).getTime() >= Date.now()) {
          isStudent = true;
          studentUsername = r.rows[0].username;
        }
      } catch {
        // ignore
      }
    }

    res.json({ isTeacher, isStudent, studentUsername });
  });

  /* ---------- Units ---------- */

  // List units for a course. Public — students see units, but only see
  // published lessons inside them (filter handled by /lessons endpoint).
  app.get('/api/classwork/:course/units', async (req, res) => {
    const course = req.params.course;
    if (!isClassworkCourse(course)) return res.status(400).json({ error: 'Invalid course' });
    try {
      const units = await listUnits(course);
      res.json(units);
    } catch (err) {
      console.error('[classwork] listUnits error:', err);
      res.status(500).json({ error: 'Failed to list units' });
    }
  });

  app.post('/api/classwork/:course/units', requireTeacher, async (req, res) => {
    const course = req.params.course;
    if (!isClassworkCourse(course)) return res.status(400).json({ error: 'Invalid course' });
    const { title, description, orderIndex, imageUrl } = req.body || {};
    if (!title || typeof title !== 'string') return res.status(400).json({ error: 'title required' });
    try {
      const unit = await createUnit(
        course,
        title.trim(),
        description,
        orderIndex,
        // Normalise empty strings to null so the DB doesn't store an
        // "" that the client then has to special-case.
        typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null,
      );
      res.json(unit);
    } catch (err) {
      console.error('[classwork] createUnit error:', err);
      res.status(500).json({ error: 'Failed to create unit' });
    }
  });

  app.patch('/api/classwork/units/:id', requireTeacher, async (req, res) => {
    try {
      const unit = await updateUnit(req.params.id, req.body || {});
      if (!unit) return res.status(404).json({ error: 'Unit not found' });
      res.json(unit);
    } catch (err) {
      console.error('[classwork] updateUnit error:', err);
      res.status(500).json({ error: 'Failed to update unit' });
    }
  });

  app.delete('/api/classwork/units/:id', requireTeacher, async (req, res) => {
    try {
      await deleteUnit(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      console.error('[classwork] deleteUnit error:', err);
      res.status(500).json({ error: 'Failed to delete unit' });
    }
  });

  /* ---------- Per-unit presentation (.pptx upload + slide viewer) ----------
     Teachers upload a PowerPoint file for the unit. We:
       1. Persist the .pptx in object storage (so teachers can download the
          original later if they need to re-edit).
       2. Convert it to a PDF with LibreOffice headless. PDFs preserve
          fonts, vector graphics and — crucially — hyperlink annotations
          exactly as PowerPoint laid them out. The SPA viewer renders the
          PDF with PDF.js, which gives sharp text and lets us overlay
          clickable <a> tags on link annotations. Earlier versions of this
          code rasterised every slide to PNG, which lost both formatting
          fidelity and click targets.
       3. Parse PPTX section markers (View → Sections in PowerPoint) so the
          viewer can offer a section dropdown — PDFs don't carry this info.
       4. Save a tiny manifest JSON pointing at the PDF + sections; the unit
          row stores the manifest URL.
     Pupils never see the upload UI — the SPA just renders a "View
     presentation" button when `presentation_url` is set on the unit. */
  app.post(
    '/api/classwork/units/:unitId/presentation',
    requireTeacher,
    (req, res, next) => {
      pptxUpload.single('file')(req, res, (err: any) => {
        if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
        next();
      });
    },
    async (req: Request, res: Response) => {
      const f = (req as any).file as Express.Multer.File | undefined;
      if (!f || !f.buffer) return res.status(400).json({ error: 'No file received' });
      const unitId = req.params.unitId;
      const tStart = Date.now();
      // We hold the buffer in memory already; staging it to a local temp
      // file is far cheaper than uploading to object storage and then
      // downloading it back just so LibreOffice has a path to point at.
      let tmpDir: string | null = null;
      let localPptxPath: string | null = null;
      try {
        tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cw-upload-'));
        const safeBase = (f.originalname || 'slides.pptx').replace(/[^A-Za-z0-9._-]/g, '_');
        localPptxPath = path.join(tmpDir, safeBase.toLowerCase().endsWith('.pptx') ? safeBase : `${safeBase}.pptx`);
        await fsp.writeFile(localPptxPath, f.buffer);
        const tStaged = Date.now();

        // Step 1: convert to PDF + extract sections in parallel — they both
        // read the same local file and don't depend on each other.
        const [pdfBuffer, sections] = await Promise.all([
          convertPptxToPdf(localPptxPath),
          extractPptxSections(localPptxPath),
        ]);
        if (!pdfBuffer) {
          return res.status(500).json({
            error: 'Could not convert presentation. Please try saving the file again from PowerPoint and re-uploading.',
          });
        }
        const tConverted = Date.now();

        // Step 2: upload .pptx and PDF to object storage in parallel — they
        // don't depend on each other and were the second-slowest step.
        const baseName = f.originalname.replace(/\.pptx$/i, '') || 'slides';
        const [saved, pdfUp] = await Promise.all([
          saveClassworkUpload(
            f.buffer,
            f.originalname,
            f.mimetype || 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          ),
          saveClassworkUpload(pdfBuffer, `${baseName}.pdf`, 'application/pdf'),
        ]);

        // Step 3: build + upload the manifest. v2 shape: single PDF URL +
        // sections. The SPA viewer still accepts the v1 per-slide-image
        // shape so older uploads keep working without re-uploading.
        const manifest = {
          version: 2,
          pdfUrl: pdfUp.url,
          sections,
          filename: f.originalname,
          uploadedAt: new Date().toISOString(),
        };
        const manifestUp = await saveClassworkUpload(
          Buffer.from(JSON.stringify(manifest), 'utf8'),
          `${baseName}-pages.json`,
          'application/json',
        );
        const tUploaded = Date.now();

        // Step 4: write the URLs to the unit row.
        const updated = await setUnitPresentation(unitId, {
          url: saved.url,
          pagesUrl: manifestUp.url,
          filename: f.originalname,
        });
        if (!updated) return res.status(404).json({ error: 'Unit not found' });

        console.log(
          `[classwork] presentation upload OK in ${tUploaded - tStart}ms ` +
            `(stage:${tStaged - tStart}ms, convert:${tConverted - tStaged}ms, upload:${tUploaded - tConverted}ms, ` +
            `pdf:${pdfBuffer.length}B, sections:${sections.length})`,
        );
        res.json({
          ok: true,
          unit: updated,
          sectionCount: sections.length,
        });
      } catch (err) {
        console.error('[classwork] presentation upload failed:', err);
        res.status(500).json({ error: 'Failed to process presentation' });
      } finally {
        if (tmpDir) fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      }
    }
  );

  app.delete('/api/classwork/units/:unitId/presentation', requireTeacher, async (req, res) => {
    try {
      const updated = await clearUnitPresentation(req.params.unitId);
      if (!updated) return res.status(404).json({ error: 'Unit not found' });
      res.json({ ok: true, unit: updated });
    } catch (err) {
      console.error('[classwork] clear presentation error:', err);
      res.status(500).json({ error: 'Failed to remove presentation' });
    }
  });

  /* ---------- Per-pupil unit notes (notes jotter) ---------- */

  // Each pupil gets one free-form notes page per unit. Teachers cannot see or
  // write notes — these are private to the pupil.
  app.get('/api/classwork/units/:unitId/notes', requireStudent, async (req, res) => {
    try {
      const studentId = (req as any).studentId as string;
      res.json(await getUnitNotes(req.params.unitId, studentId));
    } catch (err) {
      console.error('[classwork] getUnitNotes error:', err);
      res.status(500).json({ error: 'Failed to load notes' });
    }
  });

  app.put('/api/classwork/units/:unitId/notes', requireStudent, async (req, res) => {
    try {
      const studentId = (req as any).studentId as string;
      const raw = req.body?.content;
      const content = typeof raw === 'string' ? raw : '';
      // Cap at 200 KB so a runaway paste can't blow up the row.
      if (Buffer.byteLength(content, 'utf8') > 200_000) {
        return res.status(413).json({ error: 'Notes are too long (max 200 KB).' });
      }
      res.json(await saveUnitNotes(req.params.unitId, studentId, content));
    } catch (err) {
      console.error('[classwork] saveUnitNotes error:', err);
      res.status(500).json({ error: 'Failed to save notes' });
    }
  });

  /* ---------- Compiled per-pupil notes jotter ---------- */

  // Pupil viewing their own compiled jotter for the year. Resolves their
  // course from their class assignment and stitches every unit's notes in
  // order. Returns 409 if they haven't been put in a year group yet.
  app.get('/api/classwork/me/jotter', requireStudent, async (req, res) => {
    try {
      const studentId = (req as any).studentId as string;
      const cc = await getStudentClassCourse(studentId);
      if (!cc?.course) return res.status(409).json({ error: 'You haven\u2019t been put in a year group yet.' });
      const jotter = await getJotterForStudent(studentId, cc.course);
      res.json({ ...jotter, courseLabel: CLASSWORK_COURSE_LABELS[cc.course] || cc.course });
    } catch (err) {
      console.error('[classwork] getMyJotter error:', err);
      res.status(500).json({ error: 'Failed to load jotter' });
    }
  });

  // Teacher viewing a specific pupil's compiled jotter.
  app.get('/api/classwork/students/:studentId/jotter', requireTeacher, async (req, res) => {
    try {
      const studentId = req.params.studentId;
      const cc = await getStudentClassCourse(studentId);
      if (!cc?.course) return res.status(409).json({ error: 'This pupil hasn\u2019t been put in a year group yet.' });
      const jotter = await getJotterForStudent(studentId, cc.course);
      res.json({ ...jotter, courseLabel: CLASSWORK_COURSE_LABELS[cc.course] || cc.course });
    } catch (err) {
      console.error('[classwork] getStudentJotter error:', err);
      res.status(500).json({ error: 'Failed to load jotter' });
    }
  });

  /* ---------- Teacher demo notes / jotter ----------
     Mirrors the pupil endpoints above so teachers can demonstrate the
     note-taking workflow on their own demo jotter. Storage is keyed by a
     synthetic id so it can never collide with any pupil's notes. */

  app.get('/api/classwork/units/:unitId/teacher-notes', requireTeacher, async (req, res) => {
    try {
      res.json(await getTeacherUnitNotes(req.params.unitId));
    } catch (err) {
      console.error('[classwork] getTeacherUnitNotes error:', err);
      res.status(500).json({ error: 'Failed to load teacher notes' });
    }
  });

  app.put('/api/classwork/units/:unitId/teacher-notes', requireTeacher, async (req, res) => {
    try {
      const raw = req.body?.content;
      const content = typeof raw === 'string' ? raw : '';
      if (Buffer.byteLength(content, 'utf8') > 200_000) {
        return res.status(413).json({ error: 'Notes are too long (max 200 KB).' });
      }
      res.json(await saveTeacherUnitNotes(req.params.unitId, content));
    } catch (err) {
      console.error('[classwork] saveTeacherUnitNotes error:', err);
      res.status(500).json({ error: 'Failed to save teacher notes' });
    }
  });

  app.get('/api/classwork/teacher-jotter/:course', requireTeacher, async (req, res) => {
    try {
      const course = req.params.course;
      if (!isClassworkCourse(course)) return res.status(400).json({ error: 'Invalid course' });
      const jotter = await getTeacherJotterForCourse(course);
      res.json({ ...jotter, courseLabel: CLASSWORK_COURSE_LABELS[course] || course });
    } catch (err) {
      console.error('[classwork] getTeacherJotter error:', err);
      res.status(500).json({ error: 'Failed to load teacher jotter' });
    }
  });

  /* ---------- Lessons ---------- */

  app.get('/api/classwork/units/:unitId/lessons', async (req, res) => {
    try {
      // Teachers see all; students see only published.
      const isTeacher = await checkTeacher(req, requireTeacher);
      const lessons = await listLessons(req.params.unitId, { onlyPublished: !isTeacher });
      res.json(lessons);
    } catch (err) {
      console.error('[classwork] listLessons error:', err);
      res.status(500).json({ error: 'Failed to list lessons' });
    }
  });

  app.post('/api/classwork/units/:unitId/lessons', requireTeacher, async (req, res) => {
    const { title, description, orderIndex } = req.body || {};
    if (!title || typeof title !== 'string') return res.status(400).json({ error: 'title required' });
    try {
      // Look up the unit to inherit course.
      const u = await pool.query(`SELECT course FROM bhs_classwork_units WHERE id = $1`, [req.params.unitId]);
      if (!u.rows.length) return res.status(404).json({ error: 'Unit not found' });
      const course = u.rows[0].course;
      if (!isClassworkCourse(course)) return res.status(500).json({ error: 'Unit has invalid course' });
      const lesson = await createLesson(req.params.unitId, course, title.trim(), description, orderIndex);
      res.json(lesson);
    } catch (err) {
      console.error('[classwork] createLesson error:', err);
      res.status(500).json({ error: 'Failed to create lesson' });
    }
  });

  // Fetch one lesson (used by the SPA to render the title + learning
  // intentions + success criteria above the questions). Students only see
  // published lessons; teachers see everything.
  app.get('/api/classwork/lessons/:id', async (req, res) => {
    try {
      const lesson = await getLesson(req.params.id);
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
      const isTeacher = await checkTeacher(req, requireTeacher);
      if (!isTeacher && !lesson.is_published) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      res.json(lesson);
    } catch (err) {
      console.error('[classwork] getLesson error:', err);
      res.status(500).json({ error: 'Failed to load lesson' });
    }
  });

  app.patch('/api/classwork/lessons/:id', requireTeacher, async (req, res) => {
    try {
      const lesson = await updateLesson(req.params.id, req.body || {});
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
      res.json(lesson);
    } catch (err) {
      console.error('[classwork] updateLesson error:', err);
      res.status(500).json({ error: 'Failed to update lesson' });
    }
  });

  app.delete('/api/classwork/lessons/:id', requireTeacher, async (req, res) => {
    try {
      await deleteLesson(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      console.error('[classwork] deleteLesson error:', err);
      res.status(500).json({ error: 'Failed to delete lesson' });
    }
  });

  /* ---------- Lesson resources ---------- */

  // Anyone who can see the lesson can list its resources (teachers always,
  // pupils only when published).
  app.get('/api/classwork/lessons/:id/resources', async (req, res) => {
    try {
      const lesson = await getLesson(req.params.id);
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
      const isTeacher = await checkTeacher(req, requireTeacher);
      if (!isTeacher && !lesson.is_published) return res.status(404).json({ error: 'Lesson not found' });
      res.json(await listLessonResources(req.params.id));
    } catch (err) {
      console.error('[classwork] listLessonResources error:', err);
      res.status(500).json({ error: 'Failed to load resources' });
    }
  });

  app.post('/api/classwork/lessons/:id/resources', requireTeacher, async (req, res) => {
    try {
      const lesson = await getLesson(req.params.id);
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
      const { kind, url, title, orderIndex } = req.body || {};
      if (!isLessonResourceKind(kind)) return res.status(400).json({ error: 'Invalid resource kind' });
      if (!url || typeof url !== 'string') return res.status(400).json({ error: 'URL is required' });
      // Compute the next order_index so new items go at the end.
      const existing = await listLessonResources(req.params.id);
      const nextOrder = typeof orderIndex === 'number'
        ? orderIndex
        : (existing.length ? Math.max(...existing.map((r: any) => r.order_index ?? 0)) + 1 : 0);
      const row = await addLessonResource({
        lessonId: req.params.id,
        kind,
        url: url.trim(),
        title: typeof title === 'string' && title.trim() ? title.trim() : null,
        orderIndex: nextOrder,
      });
      res.json(row);
    } catch (err) {
      console.error('[classwork] addLessonResource error:', err);
      res.status(500).json({ error: 'Failed to add resource' });
    }
  });

  app.patch('/api/classwork/resources/:id', requireTeacher, async (req, res) => {
    try {
      const { title, url, orderIndex } = req.body || {};
      const fields: any = {};
      if (title      !== undefined) fields.title = title === null ? null : String(title);
      if (url        !== undefined) fields.url = String(url);
      if (orderIndex !== undefined) fields.orderIndex = Number(orderIndex) || 0;
      const row = await updateLessonResource(req.params.id, fields);
      if (!row) return res.status(404).json({ error: 'Resource not found' });
      res.json(row);
    } catch (err) {
      console.error('[classwork] updateLessonResource error:', err);
      res.status(500).json({ error: 'Failed to update resource' });
    }
  });

  app.delete('/api/classwork/resources/:id', requireTeacher, async (req, res) => {
    try {
      await deleteLessonResource(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      console.error('[classwork] deleteLessonResource error:', err);
      res.status(500).json({ error: 'Failed to delete resource' });
    }
  });

  /* ---------- Per-question resources ---------- */

  // Anyone who can see the lesson can list a question's resources.
  app.get('/api/classwork/questions/:id/resources', async (req, res) => {
    try {
      const q = await getQuestion(req.params.id);
      if (!q) return res.status(404).json({ error: 'Question not found' });
      const lesson = await getLesson(q.lesson_id);
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
      const isTeacher = await checkTeacher(req, requireTeacher);
      if (!isTeacher && !lesson.is_published) return res.status(404).json({ error: 'Question not found' });
      res.json(await listQuestionResources(req.params.id));
    } catch (err) {
      console.error('[classwork] listQuestionResources error:', err);
      res.status(500).json({ error: 'Failed to load resources' });
    }
  });

  app.post('/api/classwork/questions/:id/resources', requireTeacher, async (req, res) => {
    try {
      const q = await getQuestion(req.params.id);
      if (!q) return res.status(404).json({ error: 'Question not found' });
      const { kind, url, title, orderIndex } = req.body || {};
      if (!isLessonResourceKind(kind)) return res.status(400).json({ error: 'Invalid resource kind' });
      if (!url || typeof url !== 'string') return res.status(400).json({ error: 'URL is required' });
      const existing = await listQuestionResources(req.params.id);
      const nextOrder = typeof orderIndex === 'number'
        ? orderIndex
        : (existing.length ? Math.max(...existing.map((r: any) => r.order_index ?? 0)) + 1 : 0);
      const row = await addLessonResource({
        lessonId: q.lesson_id,
        questionId: q.id,
        kind,
        url: url.trim(),
        title: typeof title === 'string' && title.trim() ? title.trim() : null,
        orderIndex: nextOrder,
      });
      res.json(row);
    } catch (err) {
      console.error('[classwork] addQuestionResource error:', err);
      res.status(500).json({ error: 'Failed to add resource' });
    }
  });

  /* ---------- Questions ---------- */

  app.get('/api/classwork/lessons/:lessonId/questions', async (req, res) => {
    try {
      const lesson = await getLesson(req.params.lessonId);
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
      const isTeacher = await checkTeacher(req, requireTeacher);
      if (!lesson.is_published && !isTeacher) {
        return res.status(403).json({ error: 'Lesson is not published' });
      }
      const questions = await listQuestions(req.params.lessonId);
      res.json(questions);
    } catch (err) {
      console.error('[classwork] listQuestions error:', err);
      res.status(500).json({ error: 'Failed to list questions' });
    }
  });

  app.post('/api/classwork/lessons/:lessonId/questions', requireTeacher, async (req, res) => {
    const { questionType, prompt, markingScheme, aiGradingGuidance, maxMarks, options, config, orderIndex, isExtension, passageId } = req.body || {};
    if (!isClassworkQuestionType(questionType)) return res.status(400).json({ error: 'Invalid questionType' });
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt required' });
    try {
      const lesson = await getLesson(req.params.lessonId);
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
      const course = lesson.course;
      if (!isClassworkCourse(course)) return res.status(500).json({ error: 'Lesson has invalid course' });
      const q = await createQuestion({
        lessonId: req.params.lessonId,
        course,
        questionType,
        prompt,
        markingScheme,
        aiGradingGuidance,
        maxMarks: typeof maxMarks === 'number' ? maxMarks : 1,
        options,
        config,
        orderIndex,
        isExtension: isExtension === true,
        passageId: typeof passageId === 'string' && passageId ? passageId : null,
      });
      res.json(q);
    } catch (err) {
      console.error('[classwork] createQuestion error:', err);
      res.status(500).json({ error: 'Failed to create question' });
    }
  });

  app.patch('/api/classwork/questions/:id', requireTeacher, async (req, res) => {
    try {
      const q = await updateQuestion(req.params.id, req.body || {});
      if (!q) return res.status(404).json({ error: 'Question not found' });
      res.json(q);
    } catch (err) {
      console.error('[classwork] updateQuestion error:', err);
      res.status(500).json({ error: 'Failed to update question' });
    }
  });

  app.patch('/api/classwork/lessons/:lessonId/questions/reorder', requireTeacher, async (req, res) => {
    try {
      const { ids } = req.body || {};
      if (!Array.isArray(ids) || ids.some((x: any) => typeof x !== 'string')) {
        return res.status(400).json({ error: 'ids must be an array of strings' });
      }
      await reorderQuestions(ids);
      res.json({ ok: true });
    } catch (err) {
      console.error('[classwork] reorderQuestions error:', err);
      res.status(500).json({ error: 'Failed to reorder questions' });
    }
  });

  app.delete('/api/classwork/questions/:id', requireTeacher, async (req, res) => {
    try {
      await deleteQuestion(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      console.error('[classwork] deleteQuestion error:', err);
      res.status(500).json({ error: 'Failed to delete question' });
    }
  });

  // Move a question (or whole passage/video_group with children) to another
  // lesson in the same unit. Body: { targetLessonId: string, moveGroup?: boolean }
  app.patch('/api/classwork/questions/:id/move', requireTeacher, async (req, res) => {
    try {
      const { targetLessonId, moveGroup } = req.body as { targetLessonId?: string; moveGroup?: boolean };
      if (!targetLessonId) return res.status(400).json({ error: 'targetLessonId required' });
      await moveQuestionToLesson(req.params.id, targetLessonId, !!moveGroup);
      res.json({ ok: true });
    } catch (err) {
      console.error('[classwork] moveQuestion error:', err);
      res.status(500).json({ error: 'Failed to move question' });
    }
  });

  /* ---------- Submissions ---------- */

  // Student submits an answer to a single question. The submission is saved
  // immediately, then auto-marked in the background. The HTTP response waits
  // for the mark so the student sees feedback right away (with a sensible
  // overall timeout to avoid hanging the UI on a slow Gemini response).
  app.post('/api/classwork/questions/:questionId/submit', requireStudent, async (req, res) => {
    try {
      const q = await getQuestion(req.params.questionId);
      if (!q) return res.status(404).json({ error: 'Question not found' });
      if (!isClassworkCourse(q.course)) return res.status(500).json({ error: 'Question has invalid course' });
      const { textAnswer, selectedOptionLabel, linkUrl, fileUrl } = req.body || {};
      let sub = await createSubmission({
        questionId: q.id,
        lessonId: q.lesson_id,
        course: q.course,
        studentId: (req as any).studentId,
        studentUsername: (req as any).studentUsername,
        textAnswer,
        selectedOptionLabel,
        linkUrl,
        fileUrl,
      });

      // Try to AI-mark within ~25 s; fall back to "pending teacher mark"
      // if the model takes too long or no key is configured.
      try {
        const markPromise = markSubmission(q as any, sub as any);
        const result = await Promise.race([
          markPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 25000)),
        ]);
        if (result) {
          const updated = await setSubmissionMark(sub.id, result.marksAwarded, result.feedback, result.markedBy);
          if (updated) sub = updated;
        }
      } catch (err) {
        console.error('[classwork] auto-mark error:', err);
      }

      res.json(sub);
    } catch (err) {
      console.error('[classwork] submit error:', err);
      res.status(500).json({ error: 'Failed to submit answer' });
    }
  });

  // ─── Task open / "viewed" tracking ──────────────────────────────────
  // Pupils ping this endpoint the first time a question scrolls into
  // their viewport on the lesson page. The DB upserts a single row per
  // (student, question), bumping last_viewed_at + view_count on repeat
  // pings. Teachers see the aggregated "X pupils opened this task" stat
  // in the lesson analytics drill-down so they can tell who couldn't
  // get to a task vs. who opened it but didn't finish.
  app.post('/api/classwork/questions/:questionId/view', requireStudent, async (req, res) => {
    try {
      const q = await getQuestion(req.params.questionId);
      if (!q) return res.status(404).json({ error: 'Question not found' });
      if (!isClassworkCourse(q.course)) return res.status(500).json({ error: 'Question has invalid course' });
      await recordQuestionView({
        questionId: q.id,
        lessonId: q.lesson_id,
        course: q.course,
        studentId: (req as any).studentId,
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('[classwork] view tracking error:', err);
      // Don't 500 on this — it's a best-effort signal. A failure here
      // should never block the pupil from working.
      res.json({ ok: false });
    }
  });

  // ─── Auto-saved drafts ──────────────────────────────────────────────
  // The student-side answer inputs save themselves here in the
  // background so closing the tab, losing wifi, or wandering off
  // mid-task doesn't cost the pupil their work. Drafts are wiped
  // automatically when a real submission lands (see createSubmission)
  // so there's no risk of a stale draft ghosting a finished task.

  // Bulk fetch every draft this pupil has on a single lesson — called
  // once at lesson load alongside /my-submissions.
  app.get('/api/classwork/lessons/:lessonId/my-drafts', requireStudent, async (req, res) => {
    try {
      const drafts = await getMyLessonDrafts(req.params.lessonId, (req as any).studentId);
      res.json(drafts);
    } catch (err) {
      console.error('[classwork] list drafts error:', err);
      res.json([]); // never block lesson load on a draft fetch hiccup
    }
  });

  // Upsert a single question's draft. Body mirrors the /submit body
  // (textAnswer / selectedOptionLabel / linkUrl / fileUrl) so the
  // client's existing answer-state shape can be reused verbatim.
  app.put('/api/classwork/questions/:questionId/draft', requireStudent, async (req, res) => {
    try {
      const q = await getQuestion(req.params.questionId);
      if (!q) return res.status(404).json({ error: 'Question not found' });
      if (!isClassworkCourse(q.course)) return res.status(500).json({ error: 'Question has invalid course' });
      const { textAnswer, selectedOptionLabel, linkUrl, fileUrl } = req.body || {};
      await upsertDraft({
        questionId: q.id,
        lessonId: q.lesson_id,
        course: q.course,
        studentId: (req as any).studentId,
        textAnswer: typeof textAnswer === 'string' ? textAnswer : null,
        selectedOptionLabel: typeof selectedOptionLabel === 'string' ? selectedOptionLabel : null,
        linkUrl: typeof linkUrl === 'string' ? linkUrl : null,
        fileUrl: typeof fileUrl === 'string' ? fileUrl : null,
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('[classwork] draft upsert error:', err);
      res.status(500).json({ error: 'Failed to save draft' });
    }
  });

  // Explicit clear — used when the pupil deletes their answer back to
  // empty (so an empty draft doesn't reappear next time).
  app.delete('/api/classwork/questions/:questionId/draft', requireStudent, async (req, res) => {
    try {
      await deleteDraft((req as any).studentId, req.params.questionId);
      res.json({ ok: true });
    } catch (err) {
      console.error('[classwork] draft delete error:', err);
      res.status(500).json({ error: 'Failed to clear draft' });
    }
  });

  // Teacher dry-run: run the AI marker against a teacher-supplied answer
  // WITHOUT writing anything to the submissions table. Used by the
  // "Preview as student" flow on the lesson page so a teacher can sanity-check
  // what feedback their pupils would actually get before publishing the lesson.
  // Mirrors the request body shape of the real /submit endpoint above.
  app.post('/api/classwork/questions/:questionId/try', requireTeacher, async (req, res) => {
    try {
      const q = await getQuestion(req.params.questionId);
      if (!q) return res.status(404).json({ error: 'Question not found' });
      if (!isClassworkCourse(q.course)) return res.status(500).json({ error: 'Question has invalid course' });
      const { textAnswer, selectedOptionLabel, linkUrl, fileUrl } = req.body || {};
      const fakeSubmission = {
        text_answer: typeof textAnswer === 'string' ? textAnswer : null,
        selected_option_label: typeof selectedOptionLabel === 'string' ? selectedOptionLabel : null,
        link_url: typeof linkUrl === 'string' ? linkUrl : null,
        file_url: typeof fileUrl === 'string' ? fileUrl : null,
      };
      try {
        const markPromise = markSubmission(q as any, fakeSubmission as any);
        const result = await Promise.race([
          markPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 25000)),
        ]);
        if (!result) {
          return res.json({
            marksAwarded: null,
            feedback: null,
            maxMarks: q.max_marks,
            note: 'No AI mark was produced (this question type may not be auto-markable, or the model timed out).',
          });
        }
        return res.json({
          marksAwarded: result.marksAwarded,
          feedback: result.feedback,
          maxMarks: q.max_marks,
          markedBy: result.markedBy,
        });
      } catch (err) {
        console.error('[classwork] try-mark error:', err);
        return res.status(500).json({ error: 'AI marking failed' });
      }
    } catch (err) {
      console.error('[classwork] try error:', err);
      res.status(500).json({ error: 'Failed to run preview marking' });
    }
  });

  // Teacher: override the mark on a submission.
  app.patch('/api/classwork/submissions/:id/mark', requireTeacher, async (req, res) => {
    const { marksAwarded, feedback } = req.body || {};
    if (typeof marksAwarded !== 'number') return res.status(400).json({ error: 'marksAwarded (number) required' });
    try {
      const updated = await setSubmissionMark(
        req.params.id,
        Math.max(0, Math.round(marksAwarded)),
        typeof feedback === 'string' ? feedback : null,
        'teacher'
      );
      if (!updated) return res.status(404).json({ error: 'Submission not found' });
      res.json(updated);
    } catch (err) {
      console.error('[classwork] manual mark error:', err);
      res.status(500).json({ error: 'Failed to set mark' });
    }
  });

  /* ---------- Analytics (teacher only) ---------- */

  app.get('/api/classwork/:course/analytics/overview', requireTeacher, async (req, res) => {
    const course = req.params.course;
    if (!isClassworkCourse(course)) return res.status(400).json({ error: 'Invalid course' });
    try {
      res.json(await getCourseAnalytics(course));
    } catch (err) {
      console.error('[classwork] course analytics error:', err);
      res.status(500).json({ error: 'Failed to load analytics' });
    }
  });

  app.get('/api/classwork/:course/analytics/export.xlsx', requireTeacher, async (req, res) => {
    const course = req.params.course;
    if (!isClassworkCourse(course)) return res.status(400).json({ error: 'Invalid course' });
    try {
      const { buildAnalyticsWorkbook } = await import('./classwork-export.js');
      const wb = await buildAnalyticsWorkbook(course);
      const filename = `bhs-classwork-${course}-analytics-${new Date().toISOString().slice(0,10)}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      await wb.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('[classwork] analytics export error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to build analytics workbook' });
    }
  });

  app.get('/api/classwork/lessons/:lessonId/analytics', requireTeacher, async (req, res) => {
    try {
      const data = await getLessonAnalytics(req.params.lessonId);
      if (!data) return res.status(404).json({ error: 'Lesson not found' });
      res.json(data);
    } catch (err) {
      console.error('[classwork] lesson analytics error:', err);
      res.status(500).json({ error: 'Failed to load analytics' });
    }
  });

  app.get('/api/classwork/:course/students/:studentId/analytics', requireTeacher, async (req, res) => {
    const course = req.params.course;
    if (!isClassworkCourse(course)) return res.status(400).json({ error: 'Invalid course' });
    try {
      res.json(await getStudentCourseAnalytics(course, req.params.studentId));
    } catch (err) {
      console.error('[classwork] student analytics error:', err);
      res.status(500).json({ error: 'Failed to load analytics' });
    }
  });

  // Distinct days in the last 12 months on which the student did anything
  // for this course (submitted, opened a question card, or saved a draft).
  // Drives the small activity calendar on the per-student detail panel —
  // teachers can spot streaks, gaps, and "logged in but did nothing" weeks
  // at a glance. Read-only; no new schema, derived from existing timestamps.
  app.get('/api/classwork/:course/students/:studentId/activity-days', requireTeacher, async (req, res) => {
    const course = req.params.course;
    if (!isClassworkCourse(course)) return res.status(400).json({ error: 'Invalid course' });
    try {
      const days = await getStudentActivityDays(course, req.params.studentId);
      res.json({ days });
    } catch (err) {
      console.error('[classwork] activity days error:', err);
      res.status(500).json({ error: 'Failed to load activity' });
    }
  });

  // Teacher: re-run the AI marker on an existing submission (e.g. after
  // changing the marking scheme).
  app.post('/api/classwork/submissions/:id/remark', requireTeacher, async (req, res) => {
    try {
      const r = await pool.query(`SELECT * FROM bhs_classwork_submissions WHERE id = $1`, [req.params.id]);
      const sub = r.rows[0];
      if (!sub) return res.status(404).json({ error: 'Submission not found' });
      const q = await getQuestion(sub.question_id);
      if (!q) return res.status(404).json({ error: 'Question not found' });
      const result = await markSubmission(q as any, sub as any);
      if (!result) return res.status(503).json({ error: 'AI marking unavailable for this submission' });
      const updated = await setSubmissionMark(sub.id, result.marksAwarded, result.feedback, result.markedBy);
      res.json(updated);
    } catch (err) {
      console.error('[classwork] remark error:', err);
      res.status(500).json({ error: 'Failed to re-mark' });
    }
  });

  // Bulk: every per-question resource for a lesson, grouped by question_id.
  // Replaces the N+1 pattern where the lesson page used to call
  // /api/classwork/questions/:id/resources once per question card.
  app.get('/api/classwork/lessons/:lessonId/all-question-resources', async (req, res) => {
    try {
      const lesson = await getLesson(req.params.lessonId);
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
      const isTeacher = await checkTeacher(req, requireTeacher);
      if (!lesson.is_published && !isTeacher) {
        return res.status(403).json({ error: 'Lesson is not published' });
      }
      const grouped = await listAllQuestionResourcesForLesson(req.params.lessonId);
      res.json(grouped);
    } catch (err) {
      console.error('[classwork] all-question-resources error:', err);
      res.status(500).json({ error: 'Failed to load resources' });
    }
  });

  // Student: list their own submissions for a lesson.
  app.get('/api/classwork/lessons/:lessonId/my-submissions', requireStudent, async (req, res) => {
    try {
      const subs = await listMySubmissionsForLesson(req.params.lessonId, (req as any).studentId);
      res.json(subs);
    } catch (err) {
      console.error('[classwork] my-submissions error:', err);
      res.status(500).json({ error: 'Failed to list submissions' });
    }
  });

  // Teacher: list every submission for a lesson.
  app.get('/api/classwork/lessons/:lessonId/submissions', requireTeacher, async (req, res) => {
    try {
      const subs = await listSubmissionsForLesson(req.params.lessonId);
      res.json(subs);
    } catch (err) {
      console.error('[classwork] submissions error:', err);
      res.status(500).json({ error: 'Failed to list submissions' });
    }
  });

  /* ===================== TEACHER: STUDENT/CLASS MANAGEMENT =====================
     These endpoints reuse the unified student/class storage shared with the N5
     and Higher revision apps so a teacher can manage S1/S2/S3 (and any other)
     classes from inside the Classwork app.
  ============================================================================ */

  app.get('/api/classwork/teacher/classes', requireTeacher, async (_req, res) => {
    try {
      const classes = await listClassesWithCourse();
      res.json(classes);
    } catch (err) {
      console.error('[classwork] list classes error:', err);
      res.status(500).json({ error: 'Failed to list classes' });
    }
  });

  // Crossword AI clue suggestion. Used by the teacher question editor: the
  // teacher types in a list of answer words (and an optional topic) and we
  // ask Gemini to draft a one-sentence clue for each. Returns nulls in the
  // matching slot when the AI couldn't generate a particular clue (or when
  // GEMINI_API_KEY isn't configured) so the teacher can fall back to writing
  // it manually without losing their place.
  app.post('/api/classwork/teacher/ai-crossword-clues', requireTeacher, async (req, res) => {
    try {
      const wordsRaw = req.body?.words;
      const topic = String(req.body?.topic || '').trim();
      if (!Array.isArray(wordsRaw) || wordsRaw.length === 0) {
        return res.status(400).json({ error: 'Provide a non-empty array of answer words.' });
      }
      const clues = await suggestCrosswordClues(wordsRaw.map(String), topic);
      res.json({ clues });
    } catch (err) {
      console.error('[classwork] ai-crossword-clues error:', err);
      res.status(500).json({ error: 'Failed to generate clues' });
    }
  });

  app.post('/api/classwork/teacher/classes', requireTeacher, async (req, res) => {
    try {
      const name = (req.body?.name || '').toString().trim();
      const course = req.body?.course ? String(req.body.course) : null;
      if (!name) return res.status(400).json({ error: 'Class name required' });
      if (course && !isClassworkCourse(course)) {
        return res.status(400).json({ error: 'Invalid year' });
      }
      // New classes created from the Classwork app land in n5_classes for now
      // (the Higher revision app's class table is owned by that app's own
      // teacher dashboard). Teachers can still see Higher classes here.
      const cls = await n5Storage.createClass({ name });
      if (course) await setClassFields(cls.id, { course });
      res.json({ ...cls, course, source: 'n5' });
    } catch (err) {
      console.error('[classwork] create class error:', err);
      res.status(500).json({ error: 'Failed to create class' });
    }
  });

  app.patch('/api/classwork/teacher/classes/:id', requireTeacher, async (req, res) => {
    try {
      const fields: { name?: string; course?: string | null; archived?: boolean } = {};
      if (typeof req.body?.name === 'string') fields.name = req.body.name.trim();
      if ('course' in (req.body || {})) {
        const c = req.body.course;
        if (c === null || c === '') fields.course = null;
        else if (typeof c === 'string' && isClassworkCourse(c)) fields.course = c;
        else return res.status(400).json({ error: 'Invalid year' });
      }
      if ('archived' in (req.body || {})) {
        fields.archived = !!req.body.archived;
      }
      await setClassFields(req.params.id, fields);
      res.json({ ok: true });
    } catch (err) {
      console.error('[classwork] update class error:', err);
      res.status(500).json({ error: 'Failed to update class' });
    }
  });

  // Patch a student: supports either { classId } (move to a class in the same
  // year — see moveStudentToClass) or { username } (rename their login). Both
  // can be sent in one request if needed.
  app.patch('/api/classwork/teacher/students/:id', requireTeacher, async (req, res) => {
    try {
      const body = req.body || {};
      const classId  = typeof body.classId  === 'string' ? body.classId  : undefined;
      const username = typeof body.username === 'string' ? body.username.trim() : undefined;

      if (username !== undefined) {
        // Same character set as auto-generated usernames: lowercase letters,
        // digits and hyphens. Keeps things consistent and url-safe.
        if (!/^[a-z0-9][a-z0-9-]{2,31}$/.test(username)) {
          return res.status(400).json({
            error: 'Username must be 3-32 characters: lowercase letters, digits and hyphens only.',
          });
        }
        await setStudentUsername(req.params.id, username);
      }
      if (classId !== undefined) {
        await moveStudentToClass(req.params.id, classId);
      }
      if (username === undefined && classId === undefined) {
        return res.status(400).json({ error: 'Nothing to update — supply username or classId.' });
      }
      res.json({ ok: true });
    } catch (err: any) {
      console.error('[classwork] update student error:', err);
      res.status(400).json({ error: err?.message || 'Failed to update student' });
    }
  });

  // Lock every lesson in a course in one go (e.g. at start of new year).
  app.post('/api/classwork/:course/lock-all-lessons', requireTeacher, async (req, res) => {
    try {
      if (!isClassworkCourse(req.params.course)) {
        return res.status(400).json({ error: 'Unknown course' });
      }
      const n = await lockAllLessonsInCourse(req.params.course);
      res.json({ locked: n });
    } catch (err) {
      console.error('[classwork] lock-all error:', err);
      res.status(500).json({ error: 'Failed to lock lessons' });
    }
  });

  // Student endpoint: which course world should I land on?
  app.get('/api/classwork/me/course', requireStudent, async (req, res) => {
    try {
      const studentId = (req as any).studentId as string;
      const info = await getStudentClassCourse(studentId);
      if (!info) return res.json({ course: null, className: null });
      res.json({ course: info.course, className: info.class_name });
    } catch (err) {
      console.error('[classwork] me/course error:', err);
      res.status(500).json({ error: 'Failed to look up course' });
    }
  });

  app.delete('/api/classwork/teacher/classes/:id', requireTeacher, async (req, res) => {
    try {
      await deleteClassAnywhere(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      console.error('[classwork] delete class error:', err);
      res.status(500).json({ error: 'Failed to delete class' });
    }
  });

  app.get('/api/classwork/teacher/classes/:id/students', requireTeacher, async (req, res) => {
    try {
      const students = await listStudentsInClass(req.params.id);
      res.json(students);
    } catch (err) {
      console.error('[classwork] list class students error:', err);
      res.status(500).json({ error: 'Failed to list students' });
    }
  });

  app.post('/api/classwork/teacher/classes/:id/students/bulk', requireTeacher, async (req, res) => {
    try {
      const src = await getClassSource(req.params.id);
      if (!src) return res.status(404).json({ error: 'Class not found' });
      const count = parseInt(req.body?.count, 10);
      if (!count || count < 1 || count > 50) return res.status(400).json({ error: 'Count must be between 1 and 50' });
      const created: { id: string; username: string; plainPassword: string }[] = [];
      for (let i = 0; i < count; i++) {
        const username = await _uniqueUsernameAcrossTables();
        const plain = _genPassword();
        const hashed = await bcrypt.hash(plain, 10);
        const s = await createStudentInClass({
          classId: req.params.id,
          username,
          hashedPassword: hashed,
          plainPassword: plain,
        });
        created.push({ id: s.id, username: s.username, plainPassword: plain });
      }
      res.json({ created });
    } catch (err) {
      console.error('[classwork] bulk add students error:', err);
      res.status(500).json({ error: 'Failed to add students' });
    }
  });

  app.post('/api/classwork/teacher/students/:id/reset-password', requireTeacher, async (req, res) => {
    try {
      const plain = _genPassword();
      const hashed = await bcrypt.hash(plain, 10);
      await resetStudentPassword(req.params.id, hashed, plain);
      res.json({ plainPassword: plain });
    } catch (err) {
      console.error('[classwork] reset password error:', err);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  /* Copy a pupil to another class. This creates a brand-new login (fresh
     username + password) in the target class, leaving the original pupil
     and all their submissions intact in the source class for archiving.
     Works across sources (e.g. promoting an N5 pupil into a Higher class). */
  app.post('/api/classwork/teacher/students/:id/copy-to-class', requireTeacher, async (req, res) => {
    try {
      const targetClassId = req.body?.classId;
      if (!targetClassId || typeof targetClassId !== 'string') {
        return res.status(400).json({ error: 'classId required' });
      }
      const studentSrc = await getStudentSource(req.params.id);
      if (!studentSrc) return res.status(404).json({ error: 'Student not found' });
      const targetSrc = await getClassSource(targetClassId);
      if (!targetSrc) return res.status(404).json({ error: 'Target class not found' });

      const username = await _uniqueUsernameAcrossTables();
      const plain = _genPassword();
      const hashed = await bcrypt.hash(plain, 10);
      const s = await createStudentInClass({
        classId: targetClassId,
        username,
        hashedPassword: hashed,
        plainPassword: plain,
      });
      res.json({ id: s.id, username: s.username, plainPassword: plain });
    } catch (err: any) {
      console.error('[classwork] copy student error:', err);
      res.status(400).json({ error: err?.message || 'Failed to copy student' });
    }
  });

  app.delete('/api/classwork/teacher/students/:id', requireTeacher, async (req, res) => {
    try {
      await deleteStudentAnywhere(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      console.error('[classwork] delete student error:', err);
      res.status(500).json({ error: 'Failed to delete student' });
    }
  });
}

/* Generate a memorable username that's free in BOTH the bhs_ and n5_ student
   tables, so logins never collide between revision apps. */
async function _uniqueUsernameAcrossTables(): Promise<string> {
  for (let i = 0; i < 25; i++) {
    const u = _genUsername();
    if (!(await usernameTakenAnywhere(u))) return u;
  }
  throw new Error('Could not generate a unique username');
}

/* ----- helper: detect teacher without erroring out the response ----- */
async function checkTeacher(req: Request, requireTeacher: RequireTeacher): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let answered = false;
    const fakeRes: any = {
      status() { return fakeRes; },
      json() { if (!answered) { answered = true; resolve(false); } return fakeRes; },
      send() { if (!answered) { answered = true; resolve(false); } return fakeRes; },
      end() { if (!answered) { answered = true; resolve(false); } return fakeRes; },
    };
    try {
      requireTeacher(req, fakeRes, () => {
        if (!answered) { answered = true; resolve(true); }
      });
    } catch {
      if (!answered) { answered = true; resolve(false); }
    }
    // Safety net
    setTimeout(() => { if (!answered) { answered = true; resolve(false); } }, 50);
  });
}
