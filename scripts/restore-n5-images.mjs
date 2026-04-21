import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const root = 'Images/N5RevisionImages';
const folderMap = {
  past_paper_2022: { year: 2022, isAdditional: false },
  past_paper_2023: { year: 2023, isAdditional: false },
  past_paper_2024: { year: 2024, isAdditional: false },
  past_paper_2025: { year: 2025, isAdditional: false },
  'additional_Mock_Exam_2025-2026': { year: 0, isAdditional: true },
};

const mimeFor = (ext) => ({ '.png':'image/png', '.gif':'image/gif', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml' }[ext.toLowerCase()] || 'application/octet-stream');
const isInt = (s) => /^\d+$/.test(s);

function parseFilename(name) {
  const ext = path.extname(name);
  const base = name.slice(0, -ext.length);
  const tokens = base.split('_');
  if (!isInt(tokens[tokens.length-1])) return null;
  tokens.pop();
  let kind, identTokens, pathTokens;
  if (tokens[0] === 'Question' && isInt(tokens[1])) {
    kind = 'numbered';
    identTokens = [tokens[1]];
    pathTokens = tokens.slice(2);
  } else if (tokens[0] === 'Practice') {
    kind = 'practice';
    let idx = -1;
    for (let i = 1; i < tokens.length; i++) {
      if (tokens[i] === 'scenario' || tokens[i] === 'subQuestions') { idx = i; break; }
    }
    if (idx === -1) return null;
    identTokens = tokens.slice(1, idx);
    pathTokens = tokens.slice(idx);
  } else return null;
  const out = pathTokens.map(t => isInt(t) ? parseInt(t,10) : t);
  return { kind, identTokens, path: out, ext };
}

function findQuestion(questions, parsed, folder) {
  const meta = folderMap[folder];
  if (parsed.kind === 'numbered') {
    const wantTitle = `Question ${parsed.identTokens[0]}`;
    return questions.find(q =>
      q.title === wantTitle &&
      (meta.isAdditional ? q.is_additional_exam : (q.year === meta.year && !q.is_additional_exam && !q.is_practice))
    );
  } else {
    const norm = (s) => s.replace(/[:\-]/g,'').replace(/\bPractice\b/g,'').replace(/\s+/g,' ').trim().toLowerCase();
    const target = norm(parsed.identTokens.join(' '));
    return questions.find(q => q.is_practice && q.year === meta.year && norm(q.title) === target);
  }
}

function setPath(obj, p, value) {
  let cur = obj;
  for (let i = 0; i < p.length - 1; i++) {
    const k = p[i];
    if (cur == null) return false;
    if (cur[k] == null) cur[k] = typeof p[i+1] === 'number' ? [] : {};
    cur = cur[k];
  }
  if (cur == null) return false;
  cur[p[p.length-1]] = value;
  return true;
}

async function main() {
  const { rows: questions } = await pool.query(
    `SELECT id, year, title, is_practice, is_additional_exam FROM bhs_questions WHERE course='n5'`
  );
  const matchedList = [];
  const unmatched = [];
  let total = 0;
  for (const folder of Object.keys(folderMap)) {
    const dir = path.join(root, folder);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      total++;
      const parsed = parseFilename(f);
      if (!parsed) { unmatched.push([folder,f,'parse']); continue; }
      const q = findQuestion(questions, parsed, folder);
      if (!q) { unmatched.push([folder,f,'no-question']); continue; }
      matchedList.push({ folder, f, qId: q.id, path: parsed.path, ext: parsed.ext });
    }
  }
  console.log(`Files: ${total}, matched: ${matchedList.length}, unmatched: ${unmatched.length}`);
  if (unmatched.length) console.log('Unmatched samples:', unmatched.slice(0,5));

  const byQ = new Map();
  for (const m of matchedList) {
    if (!byQ.has(m.qId)) byQ.set(m.qId, []);
    byQ.get(m.qId).push(m);
  }

  let updated = 0, missingPaths = 0;
  for (const [qId, items] of byQ) {
    const { rows } = await pool.query(
      `SELECT scenario, sub_questions FROM bhs_questions WHERE id=$1 AND course='n5'`,
      [qId]
    );
    if (!rows.length) continue;
    let scenario = rows[0].scenario;
    let subQs = rows[0].sub_questions || [];

    for (const it of items) {
      const fp = path.join(root, it.folder, it.f);
      const buf = fs.readFileSync(fp);
      const dataUri = `data:${mimeFor(it.ext)};base64,${buf.toString('base64')}`;
      const p = it.path.slice();
      let target;
      if (p[0] === 'scenario') {
        if (!scenario) scenario = {};
        target = scenario;
        p.shift();
      } else if (p[0] === 'subQuestions') {
        target = subQs;
        p.shift();
      }
      if (!setPath(target, p, dataUri)) {
        missingPaths++;
        console.log('  missing path in', qId, it.f);
      }
    }

    await pool.query(
      `UPDATE bhs_questions SET scenario=$1::jsonb, sub_questions=$2::jsonb WHERE id=$3 AND course='n5'`,
      [scenario === null ? null : JSON.stringify(scenario), JSON.stringify(subQs), qId]
    );
    updated++;
  }
  console.log(`Updated ${updated} questions. Missing paths: ${missingPaths}`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
