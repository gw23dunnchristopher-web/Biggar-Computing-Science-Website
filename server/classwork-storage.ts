import { pool, hasDatabase } from './db';
import crypto from 'crypto';

export const CLASSWORK_COURSES = ['s1', 's2', 's3', 'n5', 'higher'] as const;
export type ClassworkCourse = (typeof CLASSWORK_COURSES)[number];

export const CLASSWORK_COURSE_LABELS: Record<ClassworkCourse, string> = {
  s1: 'S1',
  s2: 'S2',
  s3: 'S3',
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
      await client.query(`CREATE INDEX IF NOT EXISTS idx_classwork_subs_q ON bhs_classwork_submissions(question_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_classwork_subs_student ON bhs_classwork_submissions(student_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_classwork_subs_lesson ON bhs_classwork_submissions(lesson_id);`);
    } finally {
      client.release();
    }
  })();
  return initPromise;
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
    `SELECT id, unit_id, course, title, description, order_index, is_published, created_at
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
    `SELECT id, unit_id, course, title, description, order_index, is_published, created_at
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

export async function updateLesson(id: string, fields: { title?: string; description?: string; orderIndex?: number; isPublished?: boolean }) {
  await ensureClassworkSchema();
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;
  if (fields.title !== undefined) { sets.push(`title = $${i++}`); vals.push(fields.title); }
  if (fields.description !== undefined) { sets.push(`description = $${i++}`); vals.push(fields.description); }
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

/* ---------- Questions ---------- */

export async function listQuestions(lessonId: string) {
  await ensureClassworkSchema();
  const r = await pool.query(
    `SELECT id, lesson_id, course, order_index, question_type, prompt, marking_scheme,
            ai_grading_guidance, max_marks, options, config, created_at
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
            ai_grading_guidance, max_marks, options, config, created_at
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
}

export async function createQuestion(input: CreateQuestionInput) {
  await ensureClassworkSchema();
  const id = newId('q');
  const r = await pool.query(
    `INSERT INTO bhs_classwork_questions
       (id, lesson_id, course, order_index, question_type, prompt, marking_scheme,
        ai_grading_guidance, max_marks, options, config)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
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
