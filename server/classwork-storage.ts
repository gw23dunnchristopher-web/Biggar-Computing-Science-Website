import { pool, hasDatabase } from './db';
import crypto from 'crypto';

export const CLASSWORK_COURSES = ['s1', 's2', 's3', 'n4', 'n5', 'higher'] as const;
export type ClassworkCourse = (typeof CLASSWORK_COURSES)[number];

export const CLASSWORK_COURSE_LABELS: Record<ClassworkCourse, string> = {
  s1: 'S1',
  s2: 'S2',
  s3: 'S3',
  n4: 'National 4',
  n5: 'National 5',
  higher: 'Higher',
};

export const CLASSWORK_QUESTION_TYPES = [
  'short',
  'long',
  'code',
  'multiple_choice',
  'screenshot',
  'scratch_link',
  'makecode_link',
  'google_sites_link',
  'project',
  'presentation',
  'video_question',
  'python_task',
  'html_task',
  'sql_task',
  'database_task',
] as const;
export type ClassworkQuestionType = (typeof CLASSWORK_QUESTION_TYPES)[number];

export function isClassworkCourse(v: unknown): v is ClassworkCourse {
  return typeof v === 'string' && (CLASSWORK_COURSES as readonly string[]).includes(v);
}

export function isClassworkQuestionType(v: unknown): v is ClassworkQuestionType {
  return typeof v === 'string' && (CLASSWORK_QUESTION_TYPES as readonly string[]).includes(v);
}

let initPromise: Promise<void> | null = null;

export function ensureClassworkSchema(): Promise<void> {
  if (!hasDatabase) return Promise.resolve();
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS bhs_classwork_units (
          id VARCHAR(64) PRIMARY KEY,
          course VARCHAR(16) NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          order_index INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_classwork_units_course ON bhs_classwork_units(course);`);

      await client.query(`
        CREATE TABLE IF NOT EXISTS bhs_classwork_lessons (
          id VARCHAR(64) PRIMARY KEY,
          unit_id VARCHAR(64) NOT NULL REFERENCES bhs_classwork_units(id) ON DELETE CASCADE,
          course VARCHAR(16) NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          order_index INTEGER DEFAULT 0,
          is_published BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_classwork_lessons_unit ON bhs_classwork_lessons(unit_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_classwork_lessons_course ON bhs_classwork_lessons(course);`);

      await client.query(`
        CREATE TABLE IF NOT EXISTS bhs_classwork_questions (
          id VARCHAR(64) PRIMARY KEY,
          lesson_id VARCHAR(64) NOT NULL REFERENCES bhs_classwork_lessons(id) ON DELETE CASCADE,
          course VARCHAR(16) NOT NULL,
          order_index INTEGER DEFAULT 0,
          question_type VARCHAR(32) NOT NULL,
          prompt TEXT NOT NULL,
          marking_scheme TEXT,
          ai_grading_guidance TEXT,
          max_marks INTEGER DEFAULT 1,
          options JSONB,
          config JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_classwork_questions_lesson ON bhs_classwork_questions(lesson_id);`);

      await client.query(`
        CREATE TABLE IF NOT EXISTS bhs_classwork_submissions (
          id VARCHAR(64) PRIMARY KEY,
          question_id VARCHAR(64) NOT NULL REFERENCES bhs_classwork_questions(id) ON DELETE CASCADE,
          lesson_id VARCHAR(64) NOT NULL,
          course VARCHAR(16) NOT NULL,
          student_id VARCHAR(64) NOT NULL,
          student_username TEXT NOT NULL,
          text_answer TEXT,
          selected_option_label TEXT,
          link_url TEXT,
          file_url TEXT,
          marks_awarded INTEGER,
          ai_feedback TEXT,
          marked_by VARCHAR(16),
          marked_at TIMESTAMP,
          submitted_at TIMESTAMP DEFAULT NOW()
        );
      `);
      // Per-pupil free-form notes jotter, one per (unit, student). Pupils only.
      await client.query(`
        CREATE TABLE IF NOT EXISTS bhs_classwork_unit_notes (
          unit_id    VARCHAR(64) NOT NULL REFERENCES bhs_classwork_units(id) ON DELETE CASCADE,
          student_id VARCHAR(64) NOT NULL,
          content    TEXT NOT NULL DEFAULT '',
          updated_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (unit_id, student_id)
        );
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_classwork_unit_notes_student ON bhs_classwork_unit_notes(student_id);`);

      await client.query(`CREATE INDEX IF NOT EXISTS idx_classwork_subs_q ON bhs_classwork_submissions(question_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_classwork_subs_student ON bhs_classwork_submissions(student_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_classwork_subs_lesson ON bhs_classwork_submissions(lesson_id);`);

      // Add a nullable `course` (year group) column to the shared classes table.
      // Idempotent and safe to run on every boot. Existing rows get NULL until
      // a teacher tags them with a year via the Classwork students page.
      await client.query(`ALTER TABLE IF EXISTS n5_classes ADD COLUMN IF NOT EXISTS course VARCHAR(16);`);
      // Archive flag: lets teachers hide last year's classes without deleting
      // them (so all the pupils' work stays intact for reference). Idempotent.
      await client.query(`ALTER TABLE IF EXISTS n5_classes  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;`);
      await client.query(`ALTER TABLE IF EXISTS bhs_classes ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;`);

      // Extension-activity flag on questions. Extension questions are still
      // submitted and AI-marked (so the pupil gets feedback), but they're
      // excluded from every analytics aggregate so they don't drag the class
      // average down or show up as "missing" work for pupils who skip them.
      // Idempotent.
      await client.query(`ALTER TABLE IF EXISTS bhs_classwork_questions ADD COLUMN IF NOT EXISTS is_extension BOOLEAN NOT NULL DEFAULT FALSE;`);

      // Learning intentions + success criteria for each lesson. Stored as
      // free-form TEXT (one bullet per line — kept simple so teachers can paste
      // straight from a planner). Idempotent.
      await client.query(`ALTER TABLE IF EXISTS bhs_classwork_lessons ADD COLUMN IF NOT EXISTS learning_intentions TEXT;`);
      await client.query(`ALTER TABLE IF EXISTS bhs_classwork_lessons ADD COLUMN IF NOT EXISTS success_criteria   TEXT;`);

      // Per-lesson resources (image, document, youtube video, plain link).
      // These are shown above the questions on the lesson page so pupils can
      // read / watch / refer to them. `url` is either an external URL (for
      // youtube/link) or `/classwork-uploads/<file>` for uploaded images and
      // documents. `kind` is constrained at the application layer.
      await client.query(`
        CREATE TABLE IF NOT EXISTS bhs_classwork_lesson_resources (
          id VARCHAR(64) PRIMARY KEY,
          lesson_id VARCHAR(64) NOT NULL REFERENCES bhs_classwork_lessons(id) ON DELETE CASCADE,
          kind VARCHAR(16) NOT NULL,
          title TEXT,
          url TEXT NOT NULL,
          order_index INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_classwork_resources_lesson ON bhs_classwork_lesson_resources(lesson_id);`);
    } finally {
      client.release();
    }
  })();
  return initPromise;
}

/* ---------- Cross-app helpers for classes + students ---------------------
   The Higher revision app uses `bhs_classes` + `bhs_students`, while the N5
   revision app uses `n5_classes` + `n5_students`. The Classwork app needs to
   surface both, so every helper either takes the table source explicitly or
   detects it on the fly. Each helper returns/uses a `source: 'bhs' | 'n5'`.
------------------------------------------------------------------------- */

export type ClassSource = 'bhs' | 'n5';
const studentTbl = (s: ClassSource) => s === 'bhs' ? 'bhs_students' : 'n5_students';
const classTbl   = (s: ClassSource) => s === 'bhs' ? 'bhs_classes'  : 'n5_classes';

export async function listClassesWithCourse() {
  await ensureClassworkSchema();
  // If the same id exists in both tables (legacy/migrated rows), prefer the
  // n5 row — that's where the pupils for it actually live in this codebase.
  const r = await pool.query(
    `SELECT id, name, course, is_archived, 'bhs'::text AS source FROM bhs_classes b
        WHERE NOT EXISTS (SELECT 1 FROM n5_classes n WHERE n.id = b.id)
     UNION ALL
     SELECT id, name, course, is_archived, 'n5'::text  AS source FROM n5_classes
     ORDER BY course NULLS LAST, name ASC`
  );
  return r.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    course: row.course,
    source: row.source as ClassSource,
    archived: !!row.is_archived,
  }));
}

export async function getClassSource(classId: string): Promise<ClassSource | null> {
  await ensureClassworkSchema();
  // n5 wins on collision (matches listClassesWithCourse).
  const r = await pool.query(
    `SELECT 'n5'::text  AS src FROM n5_classes  WHERE id = $1
     UNION ALL
     SELECT 'bhs'::text AS src FROM bhs_classes WHERE id = $1
     LIMIT 1`,
    [classId]
  );
  return (r.rows[0]?.src as ClassSource) ?? null;
}

export async function getStudentSource(studentId: string): Promise<ClassSource | null> {
  await ensureClassworkSchema();
  const r = await pool.query(
    `SELECT 'bhs'::text AS src FROM bhs_students WHERE id = $1
     UNION ALL
     SELECT 'n5'::text  AS src FROM n5_students WHERE id = $1
     LIMIT 1`,
    [studentId]
  );
  return (r.rows[0]?.src as ClassSource) ?? null;
}

export async function setClassFields(classId: string, fields: { name?: string; course?: string | null; archived?: boolean }) {
  const src = await getClassSource(classId);
  if (!src) return;
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;
  if (fields.name !== undefined)     { sets.push(`name = $${i++}`);        vals.push(fields.name); }
  if (fields.course !== undefined)   { sets.push(`course = $${i++}`);      vals.push(fields.course); }
  if (fields.archived !== undefined) { sets.push(`is_archived = $${i++}`); vals.push(fields.archived); }
  if (sets.length === 0) return;
  vals.push(classId);
  await pool.query(`UPDATE ${classTbl(src)} SET ${sets.join(', ')} WHERE id = $${i}`, vals);
}

/* Listing pupils in a class — works for either source. */
export async function listStudentsInClass(classId: string) {
  const src = await getClassSource(classId);
  if (!src) return [];
  const r = await pool.query(
    `SELECT id, username, class_id, initial_password, must_change_password
       FROM ${studentTbl(src)}
      WHERE class_id = $1
      ORDER BY username ASC`,
    [classId]
  );
  return r.rows.map((s: any) => ({
    id: s.id,
    username: s.username,
    classId: s.class_id,
    initialPassword: s.initial_password,
    mustChangePassword: s.must_change_password,
  }));
}

/* Username uniqueness is checked across both tables so a teacher can't
   accidentally collide a Higher pupil's login with an N5 pupil's. */
export async function usernameTakenAnywhere(username: string): Promise<boolean> {
  await ensureClassworkSchema();
  const r = await pool.query(
    `SELECT 1 FROM bhs_students WHERE username = $1
     UNION ALL
     SELECT 1 FROM n5_students  WHERE username = $1
     LIMIT 1`,
    [username]
  );
  return (r.rowCount ?? 0) > 0;
}

export async function createStudentInClass(opts: {
  classId: string;
  username: string;
  hashedPassword: string;
  plainPassword: string;
}) {
  const src = await getClassSource(opts.classId);
  if (!src) throw new Error('Class not found');
  const id = newId('stu');
  if (src === 'bhs') {
    // bhs_students has an extra `course` column — copy it from the parent class.
    const c = await pool.query(`SELECT course FROM bhs_classes WHERE id = $1`, [opts.classId]);
    const course = c.rows[0]?.course || 'higher';
    const r = await pool.query(
      `INSERT INTO bhs_students (id, username, password, initial_password, course, class_id, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id, username, class_id`,
      [id, opts.username, opts.hashedPassword, opts.plainPassword, course, opts.classId]
    );
    return { id: r.rows[0].id, username: r.rows[0].username };
  } else {
    const r = await pool.query(
      `INSERT INTO n5_students (id, username, password, initial_password, class_id, must_change_password)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, username, class_id`,
      [id, opts.username, opts.hashedPassword, opts.plainPassword, opts.classId]
    );
    return { id: r.rows[0].id, username: r.rows[0].username };
  }
}

export async function setStudentUsername(studentId: string, newUsername: string) {
  const src = await getStudentSource(studentId);
  if (!src) throw new Error('Student not found');
  // Reject if the username is already in use anywhere (across both tables).
  // We have to be careful to allow setting it to its own current value (rename
  // to itself is a no-op, not a clash).
  const cur = await pool.query(
    `SELECT username FROM ${studentTbl(src)} WHERE id = $1`,
    [studentId]
  );
  if (cur.rows[0]?.username === newUsername) return;
  if (await usernameTakenAnywhere(newUsername)) {
    throw new Error('That username is already taken — pick a different one.');
  }
  await pool.query(
    `UPDATE ${studentTbl(src)} SET username = $1 WHERE id = $2`,
    [newUsername, studentId]
  );
}

export async function resetStudentPassword(studentId: string, hashed: string, plain: string) {
  const src = await getStudentSource(studentId);
  if (!src) throw new Error('Student not found');
  await pool.query(
    `UPDATE ${studentTbl(src)} SET password = $1, initial_password = $2, must_change_password = TRUE WHERE id = $3`,
    [hashed, plain, studentId]
  );
}

export async function deleteStudentAnywhere(studentId: string) {
  const src = await getStudentSource(studentId);
  if (!src) return;
  await pool.query(`DELETE FROM ${studentTbl(src)} WHERE id = $1`, [studentId]);
}

export async function deleteClassAnywhere(classId: string) {
  const src = await getClassSource(classId);
  if (!src) return;
  // Wipe pupils first — these tables don't all have ON DELETE CASCADE.
  await pool.query(`DELETE FROM ${studentTbl(src)} WHERE class_id = $1`, [classId]);
  await pool.query(`DELETE FROM ${classTbl(src)}   WHERE id       = $1`, [classId]);
}

/* Move a pupil to another class. Both classes must live in the same source
   table (bhs↔bhs or n5↔n5) — the underlying revision apps store progress
   keyed to a specific student_id and table, so cross-table moves would
   stranded their submissions. We surface a clear error in that case. */
export async function moveStudentToClass(studentId: string, targetClassId: string) {
  const studentSrc = await getStudentSource(studentId);
  const classSrc   = await getClassSource(targetClassId);
  if (!studentSrc) throw new Error('Student not found');
  if (!classSrc)   throw new Error('Target class not found');
  if (studentSrc !== classSrc) {
    throw new Error(
      "Sorry — pupils can't be moved between Higher and the other year groups yet. " +
      "Create a fresh login for them in the new class instead."
    );
  }
  await pool.query(
    `UPDATE ${studentTbl(studentSrc)} SET class_id = $1 WHERE id = $2`,
    [targetClassId, studentId]
  );
}

export async function getStudentClassCourse(studentId: string) {
  await ensureClassworkSchema();
  const r = await pool.query(
    `SELECT c.course AS course, c.id AS class_id, c.name AS class_name
       FROM bhs_students s JOIN bhs_classes c ON c.id = s.class_id WHERE s.id = $1
     UNION ALL
     SELECT c.course AS course, c.id AS class_id, c.name AS class_name
       FROM n5_students s JOIN n5_classes c ON c.id = s.class_id WHERE s.id = $1
     LIMIT 1`,
    [studentId]
  );
  return r.rows[0] as { course: string | null; class_id: string; class_name: string } | undefined;
}

export async function lockAllLessonsInCourse(course: string) {
  await ensureClassworkSchema();
  const r = await pool.query(
    `UPDATE bhs_classwork_lessons SET is_published = FALSE WHERE course = $1`,
    [course]
  );
  return r.rowCount ?? 0;
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

/* ---------- Units ---------- */

export async function listUnits(course: ClassworkCourse) {
  await ensureClassworkSchema();
  const r = await pool.query(
    `SELECT id, course, title, description, order_index, created_at
       FROM bhs_classwork_units
      WHERE course = $1
      ORDER BY order_index ASC, created_at ASC`,
    [course]
  );
  return r.rows;
}

export async function createUnit(course: ClassworkCourse, title: string, description?: string, orderIndex?: number) {
  await ensureClassworkSchema();
  const id = newId('unit');
  const r = await pool.query(
    `INSERT INTO bhs_classwork_units (id, course, title, description, order_index)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, course, title, description, order_index, created_at`,
    [id, course, title, description ?? null, orderIndex ?? 0]
  );
  return r.rows[0];
}

export async function updateUnit(id: string, fields: { title?: string; description?: string; orderIndex?: number }) {
  await ensureClassworkSchema();
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;
  if (fields.title !== undefined) { sets.push(`title = $${i++}`); vals.push(fields.title); }
  if (fields.description !== undefined) { sets.push(`description = $${i++}`); vals.push(fields.description); }
  if (fields.orderIndex !== undefined) { sets.push(`order_index = $${i++}`); vals.push(fields.orderIndex); }
  if (!sets.length) return null;
  vals.push(id);
  const r = await pool.query(
    `UPDATE bhs_classwork_units SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  );
  return r.rows[0] || null;
}

export async function deleteUnit(id: string) {
  await ensureClassworkSchema();
  await pool.query(`DELETE FROM bhs_classwork_units WHERE id = $1`, [id]);
}

/* ---------- Lessons ---------- */

export async function listLessons(unitId: string, opts: { onlyPublished?: boolean } = {}) {
  await ensureClassworkSchema();
  const where = opts.onlyPublished
    ? 'WHERE unit_id = $1 AND is_published = TRUE'
    : 'WHERE unit_id = $1';
  const r = await pool.query(
    `SELECT id, unit_id, course, title, description,
            learning_intentions, success_criteria,
            order_index, is_published, created_at
       FROM bhs_classwork_lessons
       ${where}
      ORDER BY order_index ASC, created_at ASC`,
    [unitId]
  );
  return r.rows;
}

export async function getLesson(id: string) {
  await ensureClassworkSchema();
  const r = await pool.query(
    `SELECT id, unit_id, course, title, description,
            learning_intentions, success_criteria,
            order_index, is_published, created_at
       FROM bhs_classwork_lessons WHERE id = $1`,
    [id]
  );
  return r.rows[0] || null;
}

export async function createLesson(unitId: string, course: ClassworkCourse, title: string, description?: string, orderIndex?: number) {
  await ensureClassworkSchema();
  const id = newId('lesson');
  const r = await pool.query(
    `INSERT INTO bhs_classwork_lessons (id, unit_id, course, title, description, order_index)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, unitId, course, title, description ?? null, orderIndex ?? 0]
  );
  return r.rows[0];
}

export async function updateLesson(id: string, fields: {
  title?: string;
  description?: string;
  learningIntentions?: string | null;
  successCriteria?: string | null;
  orderIndex?: number;
  isPublished?: boolean;
}) {
  await ensureClassworkSchema();
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;
  if (fields.title !== undefined) { sets.push(`title = $${i++}`); vals.push(fields.title); }
  if (fields.description !== undefined) { sets.push(`description = $${i++}`); vals.push(fields.description); }
  if (fields.learningIntentions !== undefined) { sets.push(`learning_intentions = $${i++}`); vals.push(fields.learningIntentions); }
  if (fields.successCriteria    !== undefined) { sets.push(`success_criteria    = $${i++}`); vals.push(fields.successCriteria); }
  if (fields.orderIndex !== undefined) { sets.push(`order_index = $${i++}`); vals.push(fields.orderIndex); }
  if (fields.isPublished !== undefined) { sets.push(`is_published = $${i++}`); vals.push(fields.isPublished); }
  if (!sets.length) return null;
  vals.push(id);
  const r = await pool.query(
    `UPDATE bhs_classwork_lessons SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  );
  return r.rows[0] || null;
}

export async function deleteLesson(id: string) {
  await ensureClassworkSchema();
  await pool.query(`DELETE FROM bhs_classwork_lessons WHERE id = $1`, [id]);
}

/* ---------- Lesson resources ---------- */

export type LessonResourceKind = 'image' | 'document' | 'youtube' | 'link' | 'embed';
const RESOURCE_KINDS: LessonResourceKind[] = ['image', 'document', 'youtube', 'link', 'embed'];
export const isLessonResourceKind = (k: any): k is LessonResourceKind =>
  typeof k === 'string' && (RESOURCE_KINDS as string[]).includes(k);

export async function listLessonResources(lessonId: string) {
  await ensureClassworkSchema();
  const r = await pool.query(
    `SELECT id, lesson_id, kind, title, url, order_index, created_at
       FROM bhs_classwork_lesson_resources
      WHERE lesson_id = $1
      ORDER BY order_index ASC, created_at ASC`,
    [lessonId]
  );
  return r.rows;
}

export async function addLessonResource(input: {
  lessonId: string;
  kind: LessonResourceKind;
  title?: string | null;
  url: string;
  orderIndex?: number;
}) {
  await ensureClassworkSchema();
  const id = newId('res');
  const r = await pool.query(
    `INSERT INTO bhs_classwork_lesson_resources (id, lesson_id, kind, title, url, order_index)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id, input.lessonId, input.kind, input.title ?? null, input.url, input.orderIndex ?? 0]
  );
  return r.rows[0];
}

export async function updateLessonResource(id: string, fields: { title?: string | null; url?: string; orderIndex?: number }) {
  await ensureClassworkSchema();
  const sets: string[] = []; const vals: any[] = []; let i = 1;
  if (fields.title      !== undefined) { sets.push(`title = $${i++}`);       vals.push(fields.title); }
  if (fields.url        !== undefined) { sets.push(`url = $${i++}`);         vals.push(fields.url); }
  if (fields.orderIndex !== undefined) { sets.push(`order_index = $${i++}`); vals.push(fields.orderIndex); }
  if (!sets.length) return null;
  vals.push(id);
  const r = await pool.query(
    `UPDATE bhs_classwork_lesson_resources SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  );
  return r.rows[0] || null;
}

export async function deleteLessonResource(id: string) {
  await ensureClassworkSchema();
  await pool.query(`DELETE FROM bhs_classwork_lesson_resources WHERE id = $1`, [id]);
}

/* ---------- Questions ---------- */

export async function listQuestions(lessonId: string) {
  await ensureClassworkSchema();
  const r = await pool.query(
    `SELECT id, lesson_id, course, order_index, question_type, prompt, marking_scheme,
            ai_grading_guidance, max_marks, options, config, is_extension, created_at
       FROM bhs_classwork_questions
      WHERE lesson_id = $1
      ORDER BY order_index ASC, created_at ASC`,
    [lessonId]
  );
  return r.rows;
}

export async function getQuestion(id: string) {
  await ensureClassworkSchema();
  const r = await pool.query(
    `SELECT id, lesson_id, course, order_index, question_type, prompt, marking_scheme,
            ai_grading_guidance, max_marks, options, config, is_extension, created_at
       FROM bhs_classwork_questions WHERE id = $1`,
    [id]
  );
  return r.rows[0] || null;
}

export interface CreateQuestionInput {
  lessonId: string;
  course: ClassworkCourse;
  questionType: ClassworkQuestionType;
  prompt: string;
  markingScheme?: string;
  aiGradingGuidance?: string;
  maxMarks?: number;
  options?: any;
  config?: any;
  orderIndex?: number;
  isExtension?: boolean;
}

export async function createQuestion(input: CreateQuestionInput) {
  await ensureClassworkSchema();
  const id = newId('q');
  const r = await pool.query(
    `INSERT INTO bhs_classwork_questions
       (id, lesson_id, course, order_index, question_type, prompt, marking_scheme,
        ai_grading_guidance, max_marks, options, config, is_extension)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      id,
      input.lessonId,
      input.course,
      input.orderIndex ?? 0,
      input.questionType,
      input.prompt,
      input.markingScheme ?? null,
      input.aiGradingGuidance ?? null,
      input.maxMarks ?? 1,
      input.options ? JSON.stringify(input.options) : null,
      input.config ? JSON.stringify(input.config) : null,
      input.isExtension === true,
    ]
  );
  return r.rows[0];
}

export async function updateQuestion(id: string, fields: Partial<Omit<CreateQuestionInput, 'lessonId' | 'course'>>) {
  await ensureClassworkSchema();
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;
  if (fields.questionType !== undefined) { sets.push(`question_type = $${i++}`); vals.push(fields.questionType); }
  if (fields.prompt !== undefined) { sets.push(`prompt = $${i++}`); vals.push(fields.prompt); }
  if (fields.markingScheme !== undefined) { sets.push(`marking_scheme = $${i++}`); vals.push(fields.markingScheme); }
  if (fields.aiGradingGuidance !== undefined) { sets.push(`ai_grading_guidance = $${i++}`); vals.push(fields.aiGradingGuidance); }
  if (fields.maxMarks !== undefined) { sets.push(`max_marks = $${i++}`); vals.push(fields.maxMarks); }
  if (fields.options !== undefined) { sets.push(`options = $${i++}`); vals.push(fields.options ? JSON.stringify(fields.options) : null); }
  if (fields.config !== undefined) { sets.push(`config = $${i++}`); vals.push(fields.config ? JSON.stringify(fields.config) : null); }
  if (fields.orderIndex !== undefined) { sets.push(`order_index = $${i++}`); vals.push(fields.orderIndex); }
  if (fields.isExtension !== undefined) { sets.push(`is_extension = $${i++}`); vals.push(fields.isExtension === true); }
  if (!sets.length) return null;
  vals.push(id);
  const r = await pool.query(
    `UPDATE bhs_classwork_questions SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  );
  return r.rows[0] || null;
}

export async function deleteQuestion(id: string) {
  await ensureClassworkSchema();
  await pool.query(`DELETE FROM bhs_classwork_questions WHERE id = $1`, [id]);
}

/* ---------- Submissions ---------- */

export interface CreateSubmissionInput {
  questionId: string;
  lessonId: string;
  course: ClassworkCourse;
  studentId: string;
  studentUsername: string;
  textAnswer?: string;
  selectedOptionLabel?: string;
  linkUrl?: string;
  fileUrl?: string;
}

export async function createSubmission(input: CreateSubmissionInput) {
  await ensureClassworkSchema();
  const id = newId('sub');
  const r = await pool.query(
    `INSERT INTO bhs_classwork_submissions
       (id, question_id, lesson_id, course, student_id, student_username,
        text_answer, selected_option_label, link_url, file_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      id,
      input.questionId,
      input.lessonId,
      input.course,
      input.studentId,
      input.studentUsername,
      input.textAnswer ?? null,
      input.selectedOptionLabel ?? null,
      input.linkUrl ?? null,
      input.fileUrl ?? null,
    ]
  );
  return r.rows[0];
}

export async function listMySubmissionsForLesson(lessonId: string, studentId: string) {
  await ensureClassworkSchema();
  const r = await pool.query(
    `SELECT * FROM bhs_classwork_submissions
      WHERE lesson_id = $1 AND student_id = $2
      ORDER BY submitted_at DESC`,
    [lessonId, studentId]
  );
  return r.rows;
}

export async function listSubmissionsForLesson(lessonId: string) {
  await ensureClassworkSchema();
  const r = await pool.query(
    `SELECT * FROM bhs_classwork_submissions
      WHERE lesson_id = $1
      ORDER BY submitted_at DESC`,
    [lessonId]
  );
  return r.rows;
}

/* ---------- Analytics ---------- */

/**
 * Course-wide overview: per-lesson totals plus the list of students who have
 * ever submitted anything in the course. Designed for the teacher analytics
 * landing page.
 */
export async function getCourseAnalytics(course: ClassworkCourse) {
  await ensureClassworkSchema();

  // Per-lesson aggregate. Average percentage is computed from each
  // submission's marks_awarded / question.max_marks so multi-question lessons
  // weight every question equally.
  const lessons = await pool.query(
    `SELECT
        l.id              AS lesson_id,
        l.title           AS lesson_title,
        l.is_published    AS is_published,
        u.id              AS unit_id,
        u.title           AS unit_title,
        COALESCE(qstat.question_count, 0)        AS question_count,
        COALESCE(sstat.submission_count, 0)      AS submission_count,
        COALESCE(sstat.distinct_students, 0)     AS distinct_students,
        COALESCE(sstat.marked_count, 0)          AS marked_count,
        sstat.avg_percent                         AS avg_percent
       FROM bhs_classwork_lessons l
       JOIN bhs_classwork_units u ON u.id = l.unit_id
       LEFT JOIN (
         SELECT lesson_id, COUNT(*)::int AS question_count
           FROM bhs_classwork_questions
          WHERE is_extension = FALSE
          GROUP BY lesson_id
       ) qstat ON qstat.lesson_id = l.id
       LEFT JOIN (
         SELECT s.lesson_id,
                COUNT(*)::int                                 AS submission_count,
                COUNT(DISTINCT s.student_id)::int             AS distinct_students,
                COUNT(s.marks_awarded)::int                   AS marked_count,
                AVG(
                  CASE WHEN s.marks_awarded IS NOT NULL AND q.max_marks > 0
                       THEN (s.marks_awarded::float / q.max_marks) * 100
                  END
                )                                              AS avg_percent
           FROM bhs_classwork_submissions s
           JOIN bhs_classwork_questions q ON q.id = s.question_id
          WHERE s.course = $1 AND q.is_extension = FALSE
          GROUP BY s.lesson_id
       ) sstat ON sstat.lesson_id = l.id
      WHERE l.course = $1
      ORDER BY u.order_index, l.order_index`,
    [course]
  );

  // Distinct students who have submitted anything in this course, with their
  // overall average percentage.
  const students = await pool.query(
    `SELECT s.student_id,
            MAX(s.student_username)                              AS username,
            COUNT(*)::int                                        AS submission_count,
            COUNT(DISTINCT s.lesson_id)::int                     AS lessons_touched,
            MAX(s.submitted_at)                                  AS last_submitted_at,
            AVG(
              CASE WHEN s.marks_awarded IS NOT NULL AND q.max_marks > 0
                   THEN (s.marks_awarded::float / q.max_marks) * 100
              END
            )                                                    AS avg_percent
       FROM bhs_classwork_submissions s
       JOIN bhs_classwork_questions q ON q.id = s.question_id
      WHERE s.course = $1 AND q.is_extension = FALSE
      GROUP BY s.student_id
      ORDER BY MAX(s.student_username) ASC`,
    [course]
  );

  // Course-wide totals. Extension-question submissions are excluded so
  // optional enrichment work doesn't inflate the headline numbers.
  const totals = await pool.query(
    `SELECT COUNT(*)::int                              AS submission_count,
            COUNT(DISTINCT s.student_id)::int          AS distinct_students
       FROM bhs_classwork_submissions s
       JOIN bhs_classwork_questions q ON q.id = s.question_id
      WHERE s.course = $1 AND q.is_extension = FALSE`,
    [course]
  );

  return {
    course,
    totals: totals.rows[0] || { submission_count: 0, distinct_students: 0 },
    lessons: lessons.rows,
    students: students.rows,
  };
}

/**
 * Per-lesson breakdown: each question's stats, plus each student's score on
 * that lesson. Multi-attempt students are scored on their best attempt.
 */
export async function getLessonAnalytics(lessonId: string) {
  await ensureClassworkSchema();

  const lesson = await pool.query(
    `SELECT l.*, u.title AS unit_title
       FROM bhs_classwork_lessons l
       JOIN bhs_classwork_units u ON u.id = l.unit_id
      WHERE l.id = $1`,
    [lessonId]
  );
  if (!lesson.rows.length) return null;

  const questions = await pool.query(
    `SELECT q.id, q.prompt, q.question_type, q.max_marks, q.order_index, q.options,
            COALESCE(s.submission_count, 0)  AS submission_count,
            COALESCE(s.distinct_students, 0) AS distinct_students,
            s.avg_mark                       AS avg_mark,
            s.avg_percent                    AS avg_percent
       FROM bhs_classwork_questions q
       LEFT JOIN (
         SELECT question_id,
                COUNT(*)::int                              AS submission_count,
                COUNT(DISTINCT student_id)::int            AS distinct_students,
                AVG(marks_awarded)                          AS avg_mark,
                AVG(
                  CASE WHEN marks_awarded IS NOT NULL
                       THEN (marks_awarded::float /
                             NULLIF((SELECT max_marks FROM bhs_classwork_questions WHERE id = question_id), 0)
                            ) * 100
                  END
                )                                           AS avg_percent
           FROM bhs_classwork_submissions
          WHERE lesson_id = $1
          GROUP BY question_id
       ) s ON s.question_id = q.id
      WHERE q.lesson_id = $1 AND q.is_extension = FALSE
      ORDER BY q.order_index, q.id`,
    [lessonId]
  );

  // Per-student best attempt for each question, summed.
  const students = await pool.query(
    `WITH best AS (
       SELECT DISTINCT ON (s.student_id, s.question_id)
              s.student_id,
              s.student_username,
              s.question_id,
              s.marks_awarded,
              s.submitted_at,
              q.max_marks
         FROM bhs_classwork_submissions s
         JOIN bhs_classwork_questions q ON q.id = s.question_id
        WHERE s.lesson_id = $1 AND q.is_extension = FALSE
        ORDER BY s.student_id, s.question_id, s.marks_awarded DESC NULLS LAST, s.submitted_at DESC
     )
     SELECT student_id,
            MAX(student_username)                AS username,
            SUM(COALESCE(marks_awarded, 0))::int AS total_marks,
            SUM(max_marks)::int                  AS max_marks,
            COUNT(*)::int                        AS questions_attempted,
            MAX(submitted_at)                    AS last_submitted_at
       FROM best
      GROUP BY student_id
      ORDER BY MAX(student_username) ASC`,
    [lessonId]
  );

  return { lesson: lesson.rows[0], questions: questions.rows, students: students.rows };
}

/**
 * Detailed view of one student's work in one course: every submission, joined
 * with the parent question/lesson/unit.
 */
export async function getStudentCourseAnalytics(course: ClassworkCourse, studentId: string) {
  await ensureClassworkSchema();
  const r = await pool.query(
    `SELECT s.*,
            q.prompt        AS question_prompt,
            q.question_type AS question_type,
            q.max_marks     AS question_max_marks,
            l.id            AS lesson_id,
            l.title         AS lesson_title,
            u.id            AS unit_id,
            u.title         AS unit_title
       FROM bhs_classwork_submissions s
       JOIN bhs_classwork_questions q ON q.id = s.question_id
       JOIN bhs_classwork_lessons   l ON l.id = s.lesson_id
       JOIN bhs_classwork_units     u ON u.id = l.unit_id
      WHERE s.course = $1 AND s.student_id = $2 AND q.is_extension = FALSE
      ORDER BY u.order_index, l.order_index, q.order_index, s.submitted_at DESC`,
    [course, studentId]
  );
  const username = r.rows[0]?.student_username || null;
  return { course, studentId, username, submissions: r.rows };
}

export async function setSubmissionMark(id: string, marksAwarded: number, aiFeedback: string | null, markedBy: 'ai' | 'teacher') {
  await ensureClassworkSchema();
  const r = await pool.query(
    `UPDATE bhs_classwork_submissions
        SET marks_awarded = $1, ai_feedback = $2, marked_by = $3, marked_at = NOW()
      WHERE id = $4
      RETURNING *`,
    [marksAwarded, aiFeedback, markedBy, id]
  );
  return r.rows[0] || null;
}

/* ---------- Per-pupil unit notes (notes jotter) ---------- */

export async function getUnitNotes(unitId: string, studentId: string): Promise<{ content: string; updatedAt: number | null }> {
  await ensureClassworkSchema();
  const r = await pool.query(
    `SELECT content, updated_at FROM bhs_classwork_unit_notes WHERE unit_id = $1 AND student_id = $2`,
    [unitId, studentId]
  );
  if (!r.rows[0]) return { content: '', updatedAt: null };
  return {
    content: r.rows[0].content || '',
    updatedAt: r.rows[0].updated_at ? new Date(r.rows[0].updated_at).getTime() : null,
  };
}

export async function saveUnitNotes(unitId: string, studentId: string, content: string): Promise<{ content: string; updatedAt: number }> {
  await ensureClassworkSchema();
  const r = await pool.query(
    `INSERT INTO bhs_classwork_unit_notes (unit_id, student_id, content, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (unit_id, student_id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
     RETURNING content, updated_at`,
    [unitId, studentId, content]
  );
  return {
    content: r.rows[0].content || '',
    updatedAt: new Date(r.rows[0].updated_at).getTime(),
  };
}
