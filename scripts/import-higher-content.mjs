import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'node:fs';

neonConfig.webSocketConstructor = ws;

const data = JSON.parse(fs.readFileSync('attached_assets/database-export_1776782728916.json', 'utf8'));
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

const J = (v) => v == null ? null : (typeof v === 'string' ? v : JSON.stringify(v));

try {
  await client.query('BEGIN');

  await client.query(`DELETE FROM bhs_assignment_resources WHERE part_id IN (
    SELECT p.id FROM bhs_assignment_parts p
    JOIN bhs_assignment_sections s ON s.id = p.section_id
    JOIN bhs_assignments a ON a.id = s.assignment_id WHERE a.course='higher')`);
  await client.query(`DELETE FROM bhs_assignment_parts WHERE section_id IN (
    SELECT s.id FROM bhs_assignment_sections s
    JOIN bhs_assignments a ON a.id = s.assignment_id WHERE a.course='higher')`);
  await client.query(`DELETE FROM bhs_assignment_sections WHERE assignment_id IN (
    SELECT id FROM bhs_assignments WHERE course='higher')`);
  await client.query(`DELETE FROM bhs_assignments WHERE course='higher'`);
  await client.query(`DELETE FROM bhs_questions WHERE course='higher'`);
  await client.query(`DELETE FROM bhs_papers WHERE course='higher'`);
  console.log('Deleted existing higher content.');

  let n = 0;
  for (const q of data.questions) {
    await client.query(
      `INSERT INTO bhs_questions (id, course, year, topic, title, is_practice, is_quiz_only, is_additional_exam, additional_paper_id, scenario, sub_questions)
       VALUES ($1,'higher',$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb)`,
      [q.id, q.year ?? null, q.topic, q.title, !!q.is_practice, !!q.is_quiz_only,
       !!q.is_additional_exam, q.additional_exam_id ?? q.additional_paper_id ?? null,
       J(q.scenario), J(q.sub_questions)]);
    n++;
  }
  console.log(`Inserted ${n} questions.`);

  // Papers (none in this export, but support if present)
  const papers = data.additional_exams ?? data.papers ?? [];
  for (const p of papers) {
    await client.query(
      `INSERT INTO bhs_papers (id, course, title, year, is_published, created_at)
       VALUES ($1,'higher',$2,$3,$4,COALESCE($5::timestamp, NOW()))`,
      [p.id, p.title ?? p.name, p.year ?? null, !!p.is_published, p.created_at ?? null]);
  }
  console.log(`Inserted ${papers.length} papers.`);

  let aN = 0;
  for (const a of data.assignments) {
    await client.query(
      `INSERT INTO bhs_assignments (id, course, year, title, total_marks, total_time_minutes, is_active, evidence_checklist, created_at)
       VALUES ($1,'higher',$2,$3,$4,$5,$6,$7::jsonb,COALESCE($8::timestamp, NOW()))`,
      [a.id, a.year, a.title, a.total_marks ?? 40, a.total_time_minutes ?? 360,
       !!a.is_active, J(a.evidence_checklist), a.created_at ?? null]);
    aN++;
  }
  console.log(`Inserted ${aN} assignments.`);

  let sN = 0;
  for (const s of data.assignment_sections) {
    await client.query(
      `INSERT INTO bhs_assignment_sections (id, assignment_id, section_type, title, is_compulsory, order_index, information_sheet)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [s.id, s.assignment_id, s.section_type, s.title, !!s.is_compulsory,
       s.order_index ?? 0, J(s.information_sheet)]);
    sN++;
  }
  console.log(`Inserted ${sN} sections.`);

  let pN = 0;
  for (const p of data.assignment_parts) {
    await client.query(
      `INSERT INTO bhs_assignment_parts (id, section_id, part_label, title, instructions, content_blocks, max_marks, order_index, is_practical, ai_grading_guidance, sub_questions, requires_upload, input_style)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11::jsonb,$12,$13)`,
      [p.id, p.section_id, p.part_label, p.title ?? null, p.instructions ?? null,
       J(p.content_blocks), p.max_marks ?? 0, p.order_index ?? 0, !!p.is_practical,
       p.ai_grading_guidance ?? null, J(p.sub_questions),
       p.requires_upload !== false, p.input_style ?? 'text']);
    pN++;
  }
  console.log(`Inserted ${pN} parts.`);

  let rN = 0;
  for (const r of data.assignment_resources) {
    await client.query(
      `INSERT INTO bhs_assignment_resources (id, part_id, file_name, file_url, file_type, description, uploaded_at)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::timestamp, NOW()))`,
      [r.id, r.part_id, r.file_name, r.file_url, r.file_type ?? null,
       r.description ?? null, r.uploaded_at ?? null]);
    rN++;
  }
  console.log(`Inserted ${rN} resources.`);

  await client.query('COMMIT');
  console.log('Done.');
} catch (e) {
  await client.query('ROLLBACK');
  console.error('FAILED:', e);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
