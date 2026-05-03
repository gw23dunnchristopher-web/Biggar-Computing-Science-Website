import type { Express } from "express";
import { db } from "./db";
import {
  dsDatabases, dsTables, dsFields, dsRecords,
  dsEmbeds, dsStudentSessions, dsQueries, dsForms, dsReports, dsRelationships
} from "@shared/ds-schema";
import { eq, and, or, inArray } from "drizzle-orm";
import crypto from "crypto";
import alasql from "alasql";
import { GoogleGenAI } from "@google/genai";

const gemini = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

/* ────────────────────────────────────────────────────────────────────────────
   SHARED AI GRADER HELPERS
   These are exported so other parts of the site (e.g. BHS Classwork) can
   delegate marking to the SAME prompt the Data Sculptor sandbox uses, instead
   of running their own copy. The HTTP routes `/api/ds/grade-sandbox` and
   `/api/ds/grade-database` further down are now thin wrappers over these.
   ──────────────────────────────────────────────────────────────────────────── */

export interface DsGradeResult {
  feedback: string;
  mark: number | null;
  maxMark: number;
}

/** Mark a pupil's SQL query against a task description (the DS sandbox / N4
 *  embed grader). `databaseId` is optional and only used to look up a stored
 *  task description if `taskDescription` isn't supplied. `results` is the
 *  optional output of running the query. `maxMark` defaults to 4 so the DS
 *  embed keeps its existing behaviour; pass a different value (e.g. from a
 *  Classwork question's max_marks) to scale the marking. */
export async function gradeSandboxSql(args: {
  sql: string;
  taskDescription?: string;
  databaseId?: number | string | null;
  results?: any;
  maxMark?: number;
}): Promise<DsGradeResult> {
  const { sql, results } = args;
  if (!sql || !sql.trim()) throw new Error('sql is required');
  if (!gemini) throw new Error('AI grading is not available (no API key configured)');
  const maxMark = Math.max(1, Math.round(args.maxMark ?? 4));

  let taskDescription = args.taskDescription || '';
  if (!taskDescription && args.databaseId != null && db) {
    const dbId = typeof args.databaseId === 'string' ? parseInt(args.databaseId) : args.databaseId;
    if (!Number.isNaN(dbId)) {
      const [dbRow] = await db.select({ taskDescription: dsDatabases.taskDescription })
        .from(dsDatabases).where(eq(dsDatabases.id, dbId));
      taskDescription = dbRow?.taskDescription || '';
    }
  }

  const resultSummary = results
    ? (results.columns && results.rows
        ? `Columns: ${results.columns.join(', ')}\nRows (first 10):\n${results.rows.slice(0, 10).map((r: any) => JSON.stringify(r)).join('\n')}`
        : results.isDml
          ? `${results.statementType?.toUpperCase()} successful — ${results.rowsAffected} row(s) affected`
          : 'No results')
    : 'Query was not run';

  const prompt = `You are a Computing Science teacher marking a student's SQL query exercise.

${taskDescription ? `TASK: ${taskDescription}\n` : ''}STUDENT'S SQL QUERY:
\`\`\`sql
${sql.length > 8000 ? sql.slice(0, 8000) + '\n-- (truncated)' : sql}
\`\`\`

QUERY RESULTS:
${resultSummary}

Please mark this SQL query. Your response must be structured as follows:
1. **Mark**: Give a whole-number mark out of ${maxMark} (0–${maxMark}) based on correctness and efficiency. Write the mark on its own line in the EXACT form "Mark: X / ${maxMark}".
2. **Feedback**: 2–4 sentences of specific, constructive feedback written for a Computing Science student. Mention what was done well and what could be improved.
3. **Suggestions**: One or two practical improvements the student could make.

Be encouraging but honest. Use British English spelling.`;

  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  const feedback = response.text || '';
  // Parse the "Mark: X / N" line; fall back to the LAST X/N pattern in the text.
  let mark: number | null = null;
  const explicit = feedback.match(/\*?\*?Mark\*?\*?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i);
  const allMatches = [...feedback.matchAll(/(\d+(?:\.\d+)?)\s*\/\s*(\d+)/g)];
  const chosen = explicit || (allMatches.length ? allMatches[allMatches.length - 1] : null);
  if (chosen) {
    const parsed = Math.round(parseFloat(chosen[1]));
    mark = Math.max(0, Math.min(maxMark, parsed));
  }
  return { feedback, mark, maxMark };
}

/** Mark a pupil's database structure (tables / fields / sample data) against a
 *  bullet-pointed task description and optional data dictionary. This is the
 *  N4 / "design a database" grader used by the Data Sculptor embed. */
export async function gradeDatabaseStructure(args: {
  sandboxDatabaseId: number | string;
  taskDescription?: string;
}): Promise<DsGradeResult> {
  if (!gemini) throw new Error('AI marking is not available (no API key configured)');
  if (!db) throw new Error('Database not available');
  const dbId = typeof args.sandboxDatabaseId === 'string' ? parseInt(args.sandboxDatabaseId) : args.sandboxDatabaseId;
  if (!dbId || Number.isNaN(dbId)) throw new Error('sandboxDatabaseId is required');

  const [dbRow] = await db.select().from(dsDatabases).where(eq(dsDatabases.id, dbId));
  if (!dbRow) throw new Error('Database not found');

  const taskDescription = args.taskDescription || dbRow.taskDescription || '';
  const dataDictionary = dbRow.dataDictionary || '';

  // Each bullet point in the task description = 1 mark.
  const bulletLines = taskDescription
    .split(/\r?\n/)
    .map((l: string) => l.replace(/^[\s•\-\*\u2022]+/, '').trim())
    .filter((l: string) => l.length > 0);
  const maxMark = bulletLines.length > 0 ? bulletLines.length : 4;
  const numberedBullets = bulletLines.length > 0
    ? bulletLines.map((b: string, i: number) => `${i + 1}. ${b}`).join('\n')
    : '';

  const tables = await db.select().from(dsTables).where(eq(dsTables.databaseId, dbId)).orderBy(dsTables.createdAt);
  const tableDetails = await Promise.all(tables.map(async (t: any) => {
    const fields = await db!.select().from(dsFields).where(eq(dsFields.tableId, t.id)).orderBy(dsFields.sortOrder);
    const records = await db!.select().from(dsRecords).where(and(eq(dsRecords.tableId, t.id), eq(dsRecords.databaseId, dbId)));
    const sampleRows = records.slice(0, 5).map((r: any) => r.data);
    return { name: t.name, fields: fields.map((f: any) => ({ name: f.name, type: f.fieldType, isPrimaryKey: f.isPrimaryKey, isRequired: f.isRequired, fieldSize: f.fieldSize ?? null, defaultValue: f.defaultValue ?? null, description: f.description ?? null })), rowCount: records.length, sampleRows };
  }));

  const dbSummary = tableDetails.map(t =>
    `Table: ${t.name} (${t.rowCount} row${t.rowCount !== 1 ? 's' : ''})\n  Fields: ${t.fields.map((f: any) => {
      const parts: string[] = [f.type];
      if (f.isPrimaryKey) parts.push('PK');
      if (f.isRequired) parts.push('required');
      if (f.fieldSize != null) parts.push(`field size ${f.fieldSize}`);
      if (f.defaultValue != null && f.defaultValue !== '') parts.push(`default "${f.defaultValue}"`);
      if (f.description) parts.push(`description "${f.description}"`);
      return `${f.name} (${parts.join(', ')})`;
    }).join(', ')}\n  Sample data: ${t.sampleRows.length > 0 ? t.sampleRows.map((r: any) => JSON.stringify(r)).join('; ') : 'none'}`
  ).join('\n\n');

  // Deterministic data-dictionary audit (server-side, not by the AI).
  function parseDataDictionary(text: string): { table: string; fields: string[] }[] {
    const lines = text.split(/\r?\n/);
    const out: { table: string; fields: string[] }[] = [];
    let current: { table: string; fields: string[] } | null = null;
    const cleanFieldName = (s: string): string | null => {
      let t = s.trim().replace(/^[\-*•●·]+\s*/, '').replace(/^\d+\.\s*/, '');
      t = t.split(/[(:|—–\-]/)[0].trim();
      t = t.replace(/[*_`]/g, '').trim();
      if (!t) return null;
      if (!/^[A-Za-z][A-Za-z0-9 _]*$/.test(t)) return null;
      if (/^(table|fields?|data type|type|name|description|primary key|key|required|format|example|notes?|validation|constraints?)$/i.test(t)) return null;
      return t;
    };
    const cleanTableName = (s: string): string | null => {
      let t = s.trim().replace(/^[\-*•●·]+\s*/, '').replace(/^\d+\.\s*/, '');
      t = t.replace(/^table\s*[:\-]?\s*/i, '');
      t = t.replace(/[*_`:]/g, '').trim();
      if (!t) return null;
      if (!/^[A-Za-z][A-Za-z0-9 _]*$/.test(t)) return null;
      return t;
    };
    for (const raw of lines) {
      if (!raw.trim()) continue;
      const indented = /^(\s{2,}|\t|\s*[-*•●·])/.test(raw);
      if (indented && current) {
        const f = cleanFieldName(raw);
        if (f) current.fields.push(f);
      } else {
        const t = cleanTableName(raw);
        if (t) {
          current = { table: t, fields: [] };
          out.push(current);
        }
      }
    }
    return out.filter(t => t.fields.length > 0);
  }

  const expectedTables = dataDictionary ? parseDataDictionary(dataDictionary) : [];
  const studentFieldsByTable = new Map<string, Set<string>>();
  for (const t of tableDetails) {
    studentFieldsByTable.set(t.name.toLowerCase().trim(), new Set(t.fields.map((f: any) => f.name.toLowerCase().trim())));
  }
  type AuditRow = { table: string; field: string; tablePresent: boolean; fieldPresent: boolean };
  const auditRows: AuditRow[] = [];
  for (const et of expectedTables) {
    const studentSet = studentFieldsByTable.get(et.table.toLowerCase().trim());
    for (const ef of et.fields) {
      auditRows.push({
        table: et.table,
        field: ef,
        tablePresent: !!studentSet,
        fieldPresent: !!studentSet?.has(ef.toLowerCase().trim()),
      });
    }
  }
  const totalExpectedFields = auditRows.length;
  const presentFields = auditRows.filter(r => r.fieldPresent).length;
  const completeness = totalExpectedFields > 0 ? presentFields / totalExpectedFields : 1;

  const auditBlock = auditRows.length > 0
    ? 'AUTOMATIC SCHEMA AUDIT (computed by the server — these results are authoritative; do NOT contradict them):\n' +
      expectedTables.map(et => {
        const rows = auditRows.filter(r => r.table === et.table);
        const tablePresent = rows[0]?.tablePresent;
        const header = `• Table "${et.table}": ${tablePresent ? 'PRESENT' : 'MISSING'}`;
        const fieldLines = rows.map(r => `    - ${r.field}: ${r.fieldPresent ? 'PRESENT' : 'MISSING'}`).join('\n');
        return `${header}\n${fieldLines}`;
      }).join('\n') +
      `\n\nSchema completeness: ${presentFields} / ${totalExpectedFields} expected fields present (${Math.round(completeness * 100)}%).\n`
    : '';

  const taskBlock = numberedBullets
    ? `TASK (each numbered bullet is worth 1 mark, for a total of ${maxMark} mark${maxMark !== 1 ? 's' : ''}):\n${numberedBullets}\n\n`
    : (taskDescription ? `TASK: ${taskDescription}\n\n` : '');

  const markingRubric = numberedBullets
    ? `Award 1 mark for each of the ${maxMark} numbered bullet${maxMark !== 1 ? 's' : ''} in the task that the student has clearly satisfied. Partial attempts may be awarded ½-mark style discretion only by rounding to whole marks. The total mark MUST be a whole number between 0 and ${maxMark} inclusive.`
    : `Give a mark out of 4 (0–4).`;

  const prompt = dataDictionary
    ? `You are a STRICT Computing Science teacher marking an N4 Computing Science database exercise against a fixed data dictionary. You must not be lenient.

${taskBlock}EXPECTED DATA DICTIONARY (this is the correct, expected design — the student MUST reproduce it):
${dataDictionary}

STUDENT'S ACTUAL DATABASE (what they submitted):
${dbSummary}

${auditBlock}
The server has already completed an authoritative schema audit above. You must accept its PRESENT/MISSING verdicts and silently base your marking on them. Apply these STRICT rules when deciding bullets:
  • A bullet that asks the student to "create a table" or "create a database with fields X, Y, Z" is ONLY achieved (✔) if EVERY field listed in the data dictionary for that table is PRESENT in the student's submission.
  • A bullet that asks for specific data types is ONLY achieved if those types are correct.
  • A bullet that asks the student to set field sizes (or "set the field size to N", "use a field size of N", "configure field sizes as per the data dictionary") is achieved if the student's "field size N" values match what the data dictionary specifies for the relevant text fields. Look at the "field size N" annotations included in the student's submission above when judging this — DO NOT mark this bullet wrong simply because the data dictionary section above does not repeat the size; cross-reference the actual student submission.
  • A bullet about entering sample data is ONLY achieved if at least one record actually exists. CRITICAL: Do NOT deduct any marks for missing sample data unless one of the numbered task bullets above EXPLICITLY asks the student to create, enter, add or insert records / sample data / test data. If no bullet asks for it, the absence of records is irrelevant — ignore it completely and award the bullets purely on whether the schema requirements were met.
  • An auto-generated ID field that the student did NOT explicitly create from the dictionary does NOT count toward the mark unless the dictionary itself lists an ID field.
  • Do NOT give credit for "having a table" if the table is mostly empty of the expected fields. Missing the majority of expected fields = bullet ✘, even if the table name is correct.
  • Extra fields the student added that are NOT in the dictionary earn NO marks but also do NOT cost marks.

Do NOT include the expected schema or the audit in your reply — the student does not need to see those. Your reply must contain ONLY the following sections, in this exact order:

1. **Mark**: ${markingRubric} Write the mark on its own line in the EXACT form "Mark: X / ${maxMark}".
2. **Per-Bullet Breakdown**: ${numberedBullets ? `For each of the ${maxMark} task bullets, write one line in the form "Bullet N: ✔" or "Bullet N: ✘ — short reason citing what was missing".` : 'Skip this section.'}
3. **Feedback**: 2–4 sentences naming the specific expected tables/fields that are missing or have the wrong type.
4. **Suggestions**: One or two practical improvements.

Be encouraging in tone but absolutely honest and strict about the marks. Use British English spelling.`
    : `You are a Computing Science teacher marking an N4 Computing Science database exercise.

${taskBlock}STUDENT'S DATABASE:
${dbSummary}

There is no fixed expected data dictionary for this task — the student is expected to design their own data dictionary that suits the task. Mark the database on the merits of the student's own design choices and how well they meet the task. Your response must be structured EXACTLY as follows, with the Mark line first:
1. **Mark**: ${markingRubric} Write the mark on its own line in the form "X / ${maxMark}".
2. **Per-Bullet Breakdown**: ${numberedBullets ? `For each of the ${maxMark} task bullets, write one line in the form "Bullet N: ✔" (achieved) or "Bullet N: ✘ — short reason" (not achieved).` : 'Skip this section.'}
3. **Feedback**: 2–4 sentences of specific, constructive feedback for a Computing Science student. Comment on the suitability of their table structure, field names, data types and any sample data entered, in the context of the task.
4. **Suggestions**: One or two practical improvements the student could make to their database design.

Be encouraging but honest. Use British English spelling.`;

  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  let feedback = response.text || '';
  let mark: number | null = null;
  const explicit = feedback.match(/\*?\*?Mark\*?\*?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i);
  const allMatches = [...feedback.matchAll(/(\d+(?:\.\d+)?)\s*\/\s*(\d+)/g)];
  const chosen = explicit || (allMatches.length ? allMatches[allMatches.length - 1] : null);
  if (chosen) {
    const parsed = Math.round(parseFloat(chosen[1]));
    mark = Math.max(0, Math.min(maxMark, parsed));
  }
  if (totalExpectedFields > 0 && mark !== null) {
    const cap = Math.ceil(maxMark * completeness);
    if (mark > cap) {
      feedback += `\n\n*(Mark automatically capped from ${mark} to ${cap} based on schema completeness: ${presentFields}/${totalExpectedFields} expected fields present.)*`;
      mark = cap;
    }
  }
  return { feedback, mark, maxMark };
}

function ts(d: Date) { return d.toISOString(); }
function tsFmt(obj: any, ...keys: string[]) {
  const out = { ...obj };
  for (const k of keys) if (out[k] instanceof Date) out[k] = out[k].toISOString();
  return out;
}

/* Embed-URL hosts.
   – `getPublicHost` is the CANONICAL host that goes into embedUrl/iframeCode
     (what teachers copy onto their live pages). It is always the production
     domain, regardless of where the dashboard was opened from, so a snippet
     created in dev keeps working when the page goes live.
   – `getPreviewHost` is the host the dashboard itself is being served from,
     used for the "Open" / "Test embed" button so dev previews still load
     even before the production site is reachable.
   Override either with the PUBLIC_URL env var. */
const PRODUCTION_HOST = 'https://www.bhs-computing.co.uk';
function getPublicHost(_req?: any): string {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  return PRODUCTION_HOST;
}
function getPreviewHost(req?: any): string {
  const fwdHost = req?.headers?.['x-forwarded-host'] as string | undefined;
  const host = fwdHost || req?.headers?.host;
  if (host) {
    const proto = (req.headers['x-forwarded-proto'] as string | undefined)
      || (host.includes('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  }
  return getPublicHost(req);
}

/* Build the iframe snippet teachers paste onto their pages.
   It loads the production embed first; if no "ready" postMessage arrives
   within 6 seconds (e.g. the production site is unreachable), it falls back
   to the secondary URL automatically. Self-contained — no external deps. */
function buildIframeCode(primary: string, fallback: string, token: string): string {
  const id = `ds-embed-${token}`;
  const sameUrl = primary === fallback;
  if (sameUrl) {
    return `<iframe src="${primary}" width="100%" height="600" frameborder="0" style="border:1px solid #ccc;border-radius:4px;"></iframe>`;
  }
  return `<div style="position:relative;width:100%;">
  <iframe id="${id}" src="${primary}" width="100%" height="600" frameborder="0" style="border:1px solid #ccc;border-radius:4px;"></iframe>
  <script>(function(){var f=document.getElementById('${id}'),done=false;
    function ready(e){if(e&&e.data&&e.data.type==='ds-embed-ready'&&e.data.token==='${token}'){done=true;window.removeEventListener('message',ready);}}
    window.addEventListener('message',ready);
    setTimeout(function(){if(!done){f.src='${fallback}';}},6000);
  })();</script>
</div>`;
}

/* ── Deep copy a teacher database for a student sandbox ── */
async function deepCopyDatabase(sourceDatabaseId: number, newUserId: string): Promise<number> {
  if (!db) throw new Error("Database not available");

  // ── Step 1: Fetch all source data in parallel ──
  const [
    [sourceDb], sourceTables, sourceRels, sourceQueries, sourceForms, sourceReports, sourceRecordsAll
  ] = await Promise.all([
    db.select().from(dsDatabases).where(eq(dsDatabases.id, sourceDatabaseId)),
    db.select().from(dsTables).where(eq(dsTables.databaseId, sourceDatabaseId)),
    db.select().from(dsRelationships).where(eq(dsRelationships.databaseId, sourceDatabaseId)),
    db.select().from(dsQueries).where(eq(dsQueries.databaseId, sourceDatabaseId)),
    db.select().from(dsForms).where(eq(dsForms.databaseId, sourceDatabaseId)),
    db.select().from(dsReports).where(eq(dsReports.databaseId, sourceDatabaseId)),
    db.select().from(dsRecords).where(eq(dsRecords.databaseId, sourceDatabaseId)),
  ]);
  if (!sourceDb) throw new Error("Source database not found");

  // ── Step 2: Fetch all fields for all source tables in one query ──
  const sourceTableIds = sourceTables.map((t: any) => t.id);
  const sourceFieldsAll = sourceTableIds.length > 0
    ? await db.select().from(dsFields).where(inArray(dsFields.tableId, sourceTableIds))
    : [];

  // Group fields and records by tableId for O(1) lookup
  const fieldsByTable = new Map<number, typeof sourceFieldsAll>();
  for (const f of sourceFieldsAll) {
    if (!fieldsByTable.has(f.tableId)) fieldsByTable.set(f.tableId, []);
    fieldsByTable.get(f.tableId)!.push(f);
  }
  const recordsByTable = new Map<number, typeof sourceRecordsAll>();
  for (const r of sourceRecordsAll) {
    if (!recordsByTable.has(r.tableId)) recordsByTable.set(r.tableId, []);
    recordsByTable.get(r.tableId)!.push(r);
  }

  // ── Step 3: Create the new sandbox database ──
  const [newDb] = await db.insert(dsDatabases).values({
    name: `[Student Copy] ${sourceDb.name}`,
    userId: newUserId,
    taskDescription: sourceDb.taskDescription,
    dataDictionary: sourceDb.dataDictionary,
    theme: sourceDb.theme,
  }).returning();

  // ── Step 4: Copy all tables in parallel, batch-inserting their fields and records ──
  const tableIdMap: Record<number, number> = {};
  const fieldIdMap: Record<number, number> = {};

  await Promise.all(sourceTables.map(async (t: any) => {
    const [newTable] = await db!.insert(dsTables).values({ name: t.name, databaseId: newDb.id }).returning();
    tableIdMap[t.id] = newTable.id;

    const fields = fieldsByTable.get(t.id) ?? [];
    const records = recordsByTable.get(t.id) ?? [];

    await Promise.all([
      // Batch-insert all fields for this table at once
      (async () => {
        if (fields.length > 0) {
          const newFields = await db!.insert(dsFields).values(
            fields.map((f: any) => ({
              name: f.name, fieldType: f.fieldType, isRequired: f.isRequired,
              isPrimaryKey: f.isPrimaryKey, sortOrder: f.sortOrder, tableId: newTable.id,
              caption: f.caption, defaultValue: f.defaultValue, fieldSize: f.fieldSize, description: f.description,
            }))
          ).returning();
          // Map old→new field IDs (returning() preserves insert order)
          fields.forEach((oldF: any, i: number) => { fieldIdMap[oldF.id] = newFields[i].id; });
        }
      })(),
      // Batch-insert all records for this table at once
      records.length > 0
        ? db!.insert(dsRecords).values(records.map((r: any) => ({ tableId: newTable.id, databaseId: newDb.id, data: r.data })))
        : Promise.resolve(),
    ]);
  }));

  // ── Step 5: Batch-insert relationships, queries, forms, reports in parallel ──
  const validRels = sourceRels.filter((rel: any) =>
    tableIdMap[rel.fromTableId] && tableIdMap[rel.toTableId] &&
    fieldIdMap[rel.fromFieldId] && fieldIdMap[rel.toFieldId]
  );

  await Promise.all([
    validRels.length > 0 ? db!.insert(dsRelationships).values(validRels.map((rel: any) => ({
      databaseId: newDb.id,
      fromTableId: tableIdMap[rel.fromTableId], fromFieldId: fieldIdMap[rel.fromFieldId],
      toTableId: tableIdMap[rel.toTableId],     toFieldId: fieldIdMap[rel.toFieldId],
      relationshipType: rel.relationshipType,
    }))) : Promise.resolve(),
    sourceQueries.length > 0 ? db!.insert(dsQueries).values(sourceQueries.map((q: any) => ({ name: q.name, databaseId: newDb.id, definition: q.definition }))) : Promise.resolve(),
    sourceForms.length > 0   ? db!.insert(dsForms).values(sourceForms.map((f: any) => ({ name: f.name, databaseId: newDb.id, definition: f.definition })))     : Promise.resolve(),
    sourceReports.length > 0 ? db!.insert(dsReports).values(sourceReports.map((r: any) => ({ name: r.name, databaseId: newDb.id, definition: r.definition })))  : Promise.resolve(),
  ]);

  return newDb.id;
}

/* ── SQL helpers ── */
const BLOCKED_SQL = [/\bDROP\s+DATABASE\b/i, /\bCREATE\s+DATABASE\b/i, /\bEXEC\b/i, /\bEXECUTE\b/i];

function stripComments(sql: string) {
  return sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
}
function validateSql(sql: string) {
  if (!stripComments(sql)) return "Empty query.";
  for (const p of BLOCKED_SQL) if (p.test(sql)) return "That operation is not permitted in this SQL editor.";
  return null;
}
function stmtType(sql: string): "select"|"insert"|"update"|"delete"|"other" {
  const f = stripComments(sql).trimStart().toUpperCase();
  if (/^SELECT\b|^WITH\b/.test(f)) return "select";
  if (/^INSERT\b/.test(f)) return "insert";
  if (/^UPDATE\b/.test(f)) return "update";
  if (/^DELETE\b/.test(f)) return "delete";
  return "other";
}
function safeIdent(name: string) { return name.replace(/[^a-zA-Z0-9_]/g, "_"); }

/** Strip Access date-hash notation: #12/12/2023# → the inner string */
function stripDateHash(s: string) { return s.replace(/^#(.+)#$/, "$1"); }

/** Convert an Access LIKE pattern string to a JS RegExp-ready pattern (not a SQL pattern) */
function accessLikeToRegex(pattern: string) {
  return pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
}

function preprocessSql(sql: string, aliasMap: Record<string, string>) {
  const aliasPlaceholders: string[] = [];

  // ── 1. Extract AS "alias" and AS [alias] placeholders ──
  sql = sql.replace(/\bAS\s+"([^"]+)"/gi, (_, name) => {
    aliasPlaceholders.push(name);
    return `AS __ALIAS_${aliasPlaceholders.length - 1}__`;
  });
  sql = sql.replace(/\bAS\s+\[([^\]]+)\]/gi, (_, name) => {
    aliasPlaceholders.push(name);
    return `AS __ALIAS_${aliasPlaceholders.length - 1}__`;
  });

  // ── 2. Access date literals: #dd/mm/yyyy# → 'dd/mm/yyyy' ──
  sql = sql.replace(/#([^#\n]+)#/g, "'$1'");

  // ── 3. Convert LIKE wildcards: Access * → %, ? → _ (in string literals) ──
  //    Must run BEFORE "..." identifier conversion so double-quoted patterns are caught
  sql = sql.replace(/\bLIKE\s+'([^']*)'/gi, (_, pat) =>
    `LIKE '${pat.replace(/\*/g, "%").replace(/\?/g, "_")}'`
  );
  sql = sql.replace(/\bLIKE\s+"([^"]*)"/gi, (_, pat) =>
    `LIKE '${pat.replace(/\*/g, "%").replace(/\?/g, "_")}'`
  );

  // ── 4. Convert double-quoted string values in comparison/IN contexts → single-quoted ──
  //    Matches: = "val", <> "val", > "val", < "val", >= "val", <= "val"
  sql = sql.replace(/((?:=|<>|>=|<=|>|<)\s*)"([^"]+)"/g, (_, op, val) => `${op}'${val}'`);
  //    Matches: IN ("a", "b") or IN ("a")
  sql = sql.replace(/\bIN\s*\(\s*"([^"]+)"(\s*,\s*"([^"]+)")*\s*\)/gi, (match) =>
    match.replace(/"([^"]+)"/g, "'$1'")
  );

  // ── 5. Convert remaining "identifier" and [identifier] to safe names ──
  sql = sql.replace(/"([^"]+)"/g, (_, i) => { const k = i.toLowerCase(); return aliasMap[k] ?? safeIdent(i); });
  sql = sql.replace(/\[([^\]]+)\]/g, (_, i) => { const k = i.toLowerCase(); return aliasMap[k] ?? safeIdent(i); });

  // ── 6. Restore AS alias placeholders ──
  for (let idx = 0; idx < aliasPlaceholders.length; idx++) {
    sql = sql.replace(`__ALIAS_${idx}__`, `[${aliasPlaceholders[idx]}]`);
  }
  return sql;
}

/* ── Query Design criteria matching (Access syntax) ── */
function matchesCriteria(value: any, criteria: string): boolean {
  if (!criteria.trim()) return true;
  const c = criteria.trim();
  const sv = String(value ?? "");

  // Like "pattern" (Access wildcards * and ?)
  const likeM = c.match(/^Like\s+"(.*)"\s*$/i);
  if (likeM) { return new RegExp(`^${accessLikeToRegex(likeM[1])}$`, "i").test(sv); }

  // Not Like "pattern"
  const notLikeM = c.match(/^Not\s+Like\s+"(.*)"\s*$/i);
  if (notLikeM) { return !new RegExp(`^${accessLikeToRegex(notLikeM[1])}$`, "i").test(sv); }

  // Not "value" or Not value
  const notValM = c.match(/^Not\s+"?([^"]+)"?\s*$/i);
  if (notValM) {
    const raw = stripDateHash(notValM[1]);
    return sv.toLowerCase() !== raw.toLowerCase() && String(value) !== raw;
  }

  // Between X And Y  (supports #date# literals)
  const betweenM = c.match(/^Between\s+(.+?)\s+And\s+(.+)$/i);
  if (betweenM) {
    const lo = stripDateHash(betweenM[1].trim().replace(/^"(.*)"$/, "$1"));
    const hi = stripDateHash(betweenM[2].trim().replace(/^"(.*)"$/, "$1"));
    const nv = Number(value); const nlo = Number(lo); const nhi = Number(hi);
    if (!isNaN(nv) && !isNaN(nlo) && !isNaN(nhi)) return nv >= nlo && nv <= nhi;
    return sv >= lo && sv <= hi;
  }

  // In(val1, val2, ...) — Access In() function
  const inM = c.match(/^In\s*\((.+)\)$/i);
  if (inM) {
    const items = inM[1].split(",").map(s => stripDateHash(s.trim().replace(/^"(.*)"$/, "$1").replace(/^#(.*)#$/, "$1")));
    return items.some(item => sv.toLowerCase() === item.toLowerCase() || sv === item);
  }

  if (/^Is Null$/i.test(c)) return value === null || value === undefined || value === "";
  if (/^Is Not Null$/i.test(c)) return value !== null && value !== undefined && value !== "";

  // Comparison operators: =, <>, <, >, <=, >= (supports #date# literals)
  const cmpM = c.match(/^(>=|<=|<>|>|<|=)\s*(.+)$/);
  if (cmpM) {
    const op = cmpM[1];
    const raw = stripDateHash(cmpM[2].trim().replace(/^"(.*)"$/, "$1"));
    const nv = Number(value); const nc = Number(raw);
    if (!isNaN(nv) && !isNaN(nc)) {
      if (op === ">") return nv > nc; if (op === "<") return nv < nc;
      if (op === ">=") return nv >= nc; if (op === "<=") return nv <= nc;
      if (op === "<>") return nv !== nc; if (op === "=") return nv === nc;
    }
    const sraw = raw.toLowerCase();
    if (op === "<>") return sv.toLowerCase() !== sraw;
    if (op === "=") return sv.toLowerCase() === sraw;
    if (op === "<") return sv < raw; if (op === ">") return sv > raw;
    if (op === "<=") return sv <= raw; if (op === ">=") return sv >= raw;
  }

  // Plain value: exact match (strips quotes and date hashes)
  const plain = stripDateHash(c.replace(/^"(.*)"$/, "$1"));
  return sv.toLowerCase() === plain.toLowerCase();
}

export function registerDsRoutes(app: Express) {
  if (!db) return;

  /* ── Databases ── */
  app.get("/api/ds/databases", async (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") return res.status(400).json({ error: "userId is required" });
    const rows = await db!.select().from(dsDatabases).where(eq(dsDatabases.userId, userId)).orderBy(dsDatabases.createdAt);
    res.json(rows.map((d: any) => tsFmt(d, "createdAt", "updatedAt")));
  });

  app.post("/api/ds/databases", async (req, res) => {
    const { name, userId } = req.body;
    if (!name || !userId) return res.status(400).json({ error: "name and userId are required" });
    const [d] = await db!.insert(dsDatabases).values({ name, userId }).returning();
    res.status(201).json(tsFmt(d, "createdAt", "updatedAt"));
  });

  app.get("/api/ds/databases/:dbId", async (req, res) => {
    const id = parseInt(req.params.dbId);
    const [d] = await db!.select().from(dsDatabases).where(eq(dsDatabases.id, id));
    if (!d) return res.status(404).json({ error: "Database not found" });
    res.json(tsFmt(d, "createdAt", "updatedAt"));
  });

  app.put("/api/ds/databases/:dbId", async (req, res) => {
    const id = parseInt(req.params.dbId);
    const { name, taskDescription, dataDictionary } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const updateData: any = { name, updatedAt: new Date() };
    if (taskDescription !== undefined) updateData.taskDescription = taskDescription || null;
    if (dataDictionary !== undefined) updateData.dataDictionary = dataDictionary || null;
    const [d] = await db!.update(dsDatabases).set(updateData).where(eq(dsDatabases.id, id)).returning();
    if (!d) return res.status(404).json({ error: "Database not found" });
    res.json(tsFmt(d, "createdAt", "updatedAt"));
  });

  app.get("/api/ds/databases/:dbId/theme", async (req, res) => {
    const id = parseInt(req.params.dbId);
    const [d] = await db!.select().from(dsDatabases).where(eq(dsDatabases.id, id));
    if (!d) return res.status(404).json({ error: "Database not found" });
    res.json(d.theme || null);
  });

  app.put("/api/ds/databases/:dbId/theme", async (req, res) => {
    const id = parseInt(req.params.dbId);
    const theme = req.body;
    const [d] = await db!.update(dsDatabases).set({ theme, updatedAt: new Date() })
      .where(eq(dsDatabases.id, id)).returning();
    if (!d) return res.status(404).json({ error: "Database not found" });
    res.json(d.theme);
  });

  app.delete("/api/ds/databases/:dbId", async (req, res) => {
    const id = parseInt(req.params.dbId);
    await db!.delete(dsRecords).where(eq(dsRecords.databaseId, id));
    const tables = await db!.select({ id: dsTables.id }).from(dsTables).where(eq(dsTables.databaseId, id));
    for (const t of tables) await db!.delete(dsFields).where(eq(dsFields.tableId, t.id));
    await db!.delete(dsTables).where(eq(dsTables.databaseId, id));
    await db!.delete(dsQueries).where(eq(dsQueries.databaseId, id));
    await db!.delete(dsForms).where(eq(dsForms.databaseId, id));
    await db!.delete(dsReports).where(eq(dsReports.databaseId, id));
    await db!.delete(dsRelationships).where(eq(dsRelationships.databaseId, id));
    await db!.delete(dsDatabases).where(eq(dsDatabases.id, id));
    res.status(204).send();
  });

  /* ── Tables ── */
  app.get("/api/ds/databases/:dbId/tables", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tables = await db!.select().from(dsTables).where(eq(dsTables.databaseId, databaseId)).orderBy(dsTables.createdAt);
    res.json(tables.map((t: any) => tsFmt(t, "createdAt", "updatedAt")));
  });

  app.post("/api/ds/databases/:dbId/tables", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const { name, fields } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const [table] = await db!.insert(dsTables).values({ name, databaseId }).returning();
    if (fields && fields.length > 0) {
      await db!.insert(dsFields).values(fields.map((f: any, idx: number) => ({
        name: f.name, fieldType: f.fieldType, isRequired: f.isRequired ?? false,
        isPrimaryKey: f.isPrimaryKey ?? false, sortOrder: f.sortOrder ?? idx,
        tableId: table.id, caption: f.caption ?? null, defaultValue: f.defaultValue ?? null,
        fieldSize: f.fieldSize ?? null, description: f.description ?? null,
      })));
    } else {
      // Access behaviour: every new blank table starts with an ID AutoNumber primary-key field
      await db!.insert(dsFields).values({
        name: "ID", fieldType: "autonumber", isRequired: true, isPrimaryKey: true,
        sortOrder: 0, tableId: table.id,
        caption: null, defaultValue: null, fieldSize: null, description: null,
      });
    }
    const tableFields = await db!.select().from(dsFields).where(eq(dsFields.tableId, table.id)).orderBy(dsFields.sortOrder);
    res.status(201).json({ ...tsFmt(table, "createdAt", "updatedAt"), fields: tableFields.map((f: any) => tsFmt(f, "createdAt", "updatedAt")) });
  });

  app.get("/api/ds/databases/:dbId/tables/:tableId", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    const [table] = await db!.select().from(dsTables).where(and(eq(dsTables.id, tableId), eq(dsTables.databaseId, databaseId)));
    if (!table) return res.status(404).json({ error: "Table not found" });
    const fields = await db!.select().from(dsFields).where(eq(dsFields.tableId, tableId)).orderBy(dsFields.sortOrder);
    res.json({ ...tsFmt(table, "createdAt", "updatedAt"), fields: fields.map((f: any) => tsFmt(f, "createdAt", "updatedAt")) });
  });

  app.put("/api/ds/databases/:dbId/tables/:tableId", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    const { name, fields } = req.body;
    const [table] = await db!.update(dsTables).set({ name, updatedAt: new Date() }).where(and(eq(dsTables.id, tableId), eq(dsTables.databaseId, databaseId))).returning();
    if (!table) return res.status(404).json({ error: "Table not found" });
    await db!.delete(dsFields).where(eq(dsFields.tableId, tableId));
    if (fields && fields.length > 0) {
      await db!.insert(dsFields).values(fields.map((f: any, idx: number) => ({
        name: f.name, fieldType: f.fieldType, isRequired: f.isRequired ?? false,
        isPrimaryKey: f.isPrimaryKey ?? false, sortOrder: f.sortOrder ?? idx,
        tableId, caption: f.caption ?? null, defaultValue: f.defaultValue ?? null,
        fieldSize: f.fieldSize ?? null, description: f.description ?? null,
      })));
    }
    const updatedFields = await db!.select().from(dsFields).where(eq(dsFields.tableId, tableId)).orderBy(dsFields.sortOrder);
    res.json({ ...tsFmt(table, "createdAt", "updatedAt"), fields: updatedFields.map((f: any) => tsFmt(f, "createdAt", "updatedAt")) });
  });

  // Lightweight rename / metadata update — does NOT touch fields.
  app.patch("/api/ds/databases/:dbId/tables/:tableId", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: "Valid 'name' is required" });
    }
    const [table] = await db!.update(dsTables)
      .set({ name: name.trim(), updatedAt: new Date() })
      .where(and(eq(dsTables.id, tableId), eq(dsTables.databaseId, databaseId)))
      .returning();
    if (!table) return res.status(404).json({ error: "Table not found" });
    const fields = await db!.select().from(dsFields).where(eq(dsFields.tableId, tableId)).orderBy(dsFields.sortOrder);
    res.json({ ...tsFmt(table, "createdAt", "updatedAt"), fields: fields.map((f: any) => tsFmt(f, "createdAt", "updatedAt")) });
  });

  app.delete("/api/ds/databases/:dbId/tables/:tableId", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    // Clean up any relationships that reference this table before deleting it
    await db!.delete(dsRelationships).where(
      and(
        eq(dsRelationships.databaseId, databaseId),
        or(eq(dsRelationships.fromTableId, tableId), eq(dsRelationships.toTableId, tableId))
      )
    );
    await db!.delete(dsRecords).where(eq(dsRecords.tableId, tableId));
    await db!.delete(dsFields).where(eq(dsFields.tableId, tableId));
    await db!.delete(dsTables).where(and(eq(dsTables.id, tableId), eq(dsTables.databaseId, databaseId)));
    res.status(204).send();
  });

  /* ── Records ── */
  app.get("/api/ds/databases/:dbId/tables/:tableId/records", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    const { sortField, sortDirection, search } = req.query as Record<string, string>;
    let records = await db!.select().from(dsRecords).where(and(eq(dsRecords.tableId, tableId), eq(dsRecords.databaseId, databaseId)));
    if (search?.trim()) {
      const s = search.toLowerCase();
      records = records.filter((r: any) => Object.values(r.data as any).some((v: any) => v !== null && String(v).toLowerCase().includes(s)));
    }
    if (sortField) {
      const dir = sortDirection === "desc" ? -1 : 1;
      records = records.sort((a: any, b: any) => {
        const av = (a.data as any)[sortField] ?? ""; const bv = (b.data as any)[sortField] ?? "";
        return av < bv ? -dir : av > bv ? dir : 0;
      });
    } else {
      records = records.sort((a: any, b: any) => a.id - b.id);
    }
    res.json(records.map((r: any) => tsFmt(r, "createdAt", "updatedAt")));
  });

  app.post("/api/ds/databases/:dbId/tables/:tableId/records", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    const { data } = req.body;
    if (!data || typeof data !== "object") return res.status(400).json({ error: "data is required" });
    const fields = await db!.select().from(dsFields).where(eq(dsFields.tableId, tableId));
    const autoFields = fields.filter((f: any) => f.fieldType === "autonumber");
    const processedData = { ...data };
    for (const af of autoFields) {
      const existing = await db!.select().from(dsRecords).where(eq(dsRecords.tableId, tableId));
      let maxVal = 0;
      for (const r of existing) { const v = parseInt((r.data as any)[af.name] ?? "0"); if (!isNaN(v) && v > maxVal) maxVal = v; }
      processedData[af.name] = maxVal + 1;
    }
    const [record] = await db!.insert(dsRecords).values({ tableId, databaseId, data: processedData }).returning();
    res.status(201).json(tsFmt(record, "createdAt", "updatedAt"));
  });

  app.put("/api/ds/databases/:dbId/tables/:tableId/records/:recordId", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    const recordId = parseInt(req.params.recordId);
    const { data } = req.body;
    if (!data || typeof data !== "object") return res.status(400).json({ error: "data is required" });
    const [record] = await db!.update(dsRecords).set({ data, updatedAt: new Date() }).where(and(eq(dsRecords.id, recordId), eq(dsRecords.tableId, tableId), eq(dsRecords.databaseId, databaseId))).returning();
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(tsFmt(record, "createdAt", "updatedAt"));
  });

  app.delete("/api/ds/databases/:dbId/tables/:tableId/records/:recordId", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    const recordId = parseInt(req.params.recordId);
    await db!.delete(dsRecords).where(and(eq(dsRecords.id, recordId), eq(dsRecords.tableId, tableId), eq(dsRecords.databaseId, databaseId)));
    res.status(204).send();
  });

  /* ── Sandboxes (databases with embed tokens) ── */
  app.get("/api/ds/sandboxes", async (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") return res.status(400).json({ error: "userId is required" });
    const host = getPublicHost(req);
    const previewHost = getPreviewHost(req);
    const databases = await db!.select().from(dsDatabases).where(eq(dsDatabases.userId, userId)).orderBy(dsDatabases.createdAt);
    const embeds = await db!.select().from(dsEmbeds).where(eq(dsEmbeds.userId, userId));
    const embedByDbId = new Map(embeds.map((e: any) => [e.databaseId, e]));
    const sandboxes = databases
      .filter((d: any) => embedByDbId.has(d.id))
      .map((d: any) => {
        const embed = embedByDbId.get(d.id) as any;
        const embedUrl = `${host}/data-sculptor/?embed=${embed.token}`;
        const previewUrl = `${previewHost}/data-sculptor/?embed=${embed.token}`;
        const iframeCode = buildIframeCode(embedUrl, previewUrl, embed.token);
        return { ...tsFmt(d, "createdAt", "updatedAt"), token: embed.token, embedUrl, previewUrl, iframeCode };
      });
    res.json(sandboxes);
  });

  app.post("/api/ds/sandboxes", async (req, res) => {
    const { name, userId, taskDescription, dataDictionary } = req.body;
    if (!name || !userId) return res.status(400).json({ error: "name and userId are required" });
    const host = getPublicHost(req);
    const previewHost = getPreviewHost(req);
    const [d] = await db!.insert(dsDatabases).values({
      name,
      userId,
      taskDescription: taskDescription?.trim() || null,
      dataDictionary: dataDictionary?.trim() || null,
    }).returning();
    const token = crypto.randomBytes(16).toString("hex");
    await db!.insert(dsEmbeds).values({ token, databaseId: d.id, userId }).returning();
    const embedUrl = `${host}/data-sculptor/?embed=${token}`;
    const previewUrl = `${previewHost}/data-sculptor/?embed=${token}`;
    const iframeCode = buildIframeCode(embedUrl, previewUrl, token);
    res.status(201).json({ ...tsFmt(d, "createdAt", "updatedAt"), token, embedUrl, previewUrl, iframeCode });
  });

  app.delete("/api/ds/sandboxes/:dbId", async (req, res) => {
    const id = parseInt(req.params.dbId);
    await db!.delete(dsEmbeds).where(eq(dsEmbeds.databaseId, id));
    await db!.delete(dsStudentSessions).where(eq(dsStudentSessions.sandboxDatabaseId, id));
    await db!.delete(dsRecords).where(eq(dsRecords.databaseId, id));
    const tables = await db!.select({ id: dsTables.id }).from(dsTables).where(eq(dsTables.databaseId, id));
    for (const t of tables) {
      await db!.delete(dsFields).where(eq(dsFields.tableId, t.id));
    }
    await db!.delete(dsTables).where(eq(dsTables.databaseId, id));
    await db!.delete(dsDatabases).where(eq(dsDatabases.id, id));
    res.status(204).send();
  });

  /* ── Embeds ── */
  app.post("/api/ds/embeds", async (req, res) => {
    const { databaseId, userId } = req.body;
    if (!databaseId || !userId) return res.status(400).json({ error: "databaseId and userId are required" });
    const token = crypto.randomBytes(16).toString("hex");
    const [embed] = await db!.insert(dsEmbeds).values({ token, databaseId, userId }).returning();
    const host = getPublicHost(req);
    const previewHost = getPreviewHost(req);
    const embedUrl = `${host}/data-sculptor/?embed=${token}`;
    const previewUrl = `${previewHost}/data-sculptor/?embed=${token}`;
    const iframeCode = buildIframeCode(embedUrl, previewUrl, token);
    res.status(201).json({ token: embed.token, databaseId: embed.databaseId, embedUrl, previewUrl, iframeCode, createdAt: embed.createdAt.toISOString() });
  });

  app.get("/api/ds/embeds/:token", async (req, res) => {
    const { token } = req.params;
    const sessionKey = req.headers["x-session-key"] as string | undefined;
    const [embed] = await db!.select().from(dsEmbeds).where(eq(dsEmbeds.token, token));
    if (!embed) return res.status(404).json({ error: "Embed not found" });
    let sandboxDatabaseId: number;
    if (sessionKey) {
      const [session] = await db!.select().from(dsStudentSessions).where(and(eq(dsStudentSessions.sessionKey, sessionKey), eq(dsStudentSessions.token, token)));
      if (session) {
        sandboxDatabaseId = session.sandboxDatabaseId;
      } else {
        sandboxDatabaseId = await deepCopyDatabase(embed.databaseId, `student-session-${sessionKey}`);
        await db!.insert(dsStudentSessions).values({ token, sessionKey, sandboxDatabaseId });
      }
    } else {
      sandboxDatabaseId = await deepCopyDatabase(embed.databaseId, `student-anon-${Date.now()}`);
    }
    const [[database], [originalDb], tables] = await Promise.all([
      db!.select().from(dsDatabases).where(eq(dsDatabases.id, sandboxDatabaseId)),
      db!.select({ taskDescription: dsDatabases.taskDescription }).from(dsDatabases).where(eq(dsDatabases.id, embed.databaseId)),
      db!.select().from(dsTables).where(eq(dsTables.databaseId, sandboxDatabaseId)).orderBy(dsTables.createdAt),
    ]);
    if (!database) return res.status(404).json({ error: "Sandbox database not found" });
    const allFields = tables.length > 0
      ? await db!.select().from(dsFields).where(inArray(dsFields.tableId, tables.map((t: any) => t.id))).orderBy(dsFields.sortOrder)
      : [];
    const fieldsByTable = new Map<number, typeof allFields>();
    for (const f of allFields) {
      if (!fieldsByTable.has(f.tableId)) fieldsByTable.set(f.tableId, []);
      fieldsByTable.get(f.tableId)!.push(f);
    }
    const tablesWithFields = tables.map((table: any) => ({
      ...tsFmt(table, "createdAt", "updatedAt"),
      fields: (fieldsByTable.get(table.id) ?? []).map((f: any) => tsFmt(f, "createdAt", "updatedAt")),
    }));
    res.json({
      database: { ...tsFmt(database, "createdAt", "updatedAt"), taskDescription: originalDb?.taskDescription ?? null },
      tables: tablesWithFields,
    });
  });

  app.post("/api/ds/embeds/:token/reset", async (req, res) => {
    const { token } = req.params;
    const sessionKey = req.headers["x-session-key"] as string | undefined;
    if (!sessionKey) return res.status(400).json({ error: "No session key" });
    const [session] = await db!.select().from(dsStudentSessions).where(and(eq(dsStudentSessions.sessionKey, sessionKey), eq(dsStudentSessions.token, token)));
    if (!session) return res.status(404).json({ error: "Session not found" });
    const dbId = session.sandboxDatabaseId;
    const tableIds = await db!.select({ id: dsTables.id }).from(dsTables).where(eq(dsTables.databaseId, dbId));
    await Promise.all([
      db!.delete(dsStudentSessions).where(and(eq(dsStudentSessions.sessionKey, sessionKey), eq(dsStudentSessions.token, token))),
      db!.delete(dsRecords).where(eq(dsRecords.databaseId, dbId)),
      tableIds.length > 0 ? db!.delete(dsFields).where(inArray(dsFields.tableId, tableIds.map((t: any) => t.id))) : Promise.resolve(),
      db!.delete(dsQueries).where(eq(dsQueries.databaseId, dbId)),
      db!.delete(dsForms).where(eq(dsForms.databaseId, dbId)),
      db!.delete(dsReports).where(eq(dsReports.databaseId, dbId)),
      db!.delete(dsRelationships).where(eq(dsRelationships.databaseId, dbId)),
    ]);
    await db!.delete(dsTables).where(eq(dsTables.databaseId, dbId));
    await db!.delete(dsDatabases).where(eq(dsDatabases.id, dbId));
    res.json({ ok: true });
  });

  /* ── Queries ── */
  app.get("/api/ds/databases/:dbId/queries", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    res.json(await db!.select().from(dsQueries).where(eq(dsQueries.databaseId, databaseId)));
  });

  app.post("/api/ds/databases/:dbId/queries", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const { name, definition } = req.body;
    const [q] = await db!.insert(dsQueries).values({ name: name || "Query1", databaseId, definition: definition || {} }).returning();
    res.status(201).json(q);
  });

  app.get("/api/ds/databases/:dbId/queries/:queryId", async (req, res) => {
    const [q] = await db!.select().from(dsQueries).where(eq(dsQueries.id, parseInt(req.params.queryId)));
    if (!q) return res.status(404).json({ error: "Query not found" });
    res.json(q);
  });

  app.put("/api/ds/databases/:dbId/queries/:queryId", async (req, res) => {
    const { name, definition } = req.body;
    const [q] = await db!.update(dsQueries).set({ name, definition, updatedAt: new Date() }).where(eq(dsQueries.id, parseInt(req.params.queryId))).returning();
    if (!q) return res.status(404).json({ error: "Query not found" });
    res.json(q);
  });

  app.delete("/api/ds/databases/:dbId/queries/:queryId", async (req, res) => {
    await db!.delete(dsQueries).where(eq(dsQueries.id, parseInt(req.params.queryId)));
    res.status(204).send();
  });

  app.post("/api/ds/databases/:dbId/queries/:queryId/run", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const queryId = parseInt(req.params.queryId);
    const [qRow] = await db!.select().from(dsQueries).where(eq(dsQueries.id, queryId));
    if (!qRow) return res.status(404).json({ error: "Query not found" });
    const definition = qRow.definition as any;
    const tables = Array.isArray(definition.tables) ? definition.tables : [];
    const columns = Array.isArray(definition.columns) ? definition.columns : [];
    const tableData: Record<number, any[]> = {};
    for (const t of tables) {
      const records = await db!.select().from(dsRecords).where(and(eq(dsRecords.tableId, t.tableId), eq(dsRecords.databaseId, databaseId)));
      tableData[t.tableId] = records.map((r: any) => r.data);
    }
    let resultRows: Record<string, any>[] = [];
    if (tables.length === 1) {
      const t = tables[0];
      resultRows = (tableData[t.tableId] || []).map(row => {
        const out: Record<string,any> = {};
        for (const c of columns) if (c.tableId === t.tableId) out[`${c.tableName}.${c.fieldName}`] = (row as any)[c.fieldName];
        return out;
      });
    }
    for (const col of columns) {
      if (col.criteria) resultRows = resultRows.filter(row => matchesCriteria(row[`${col.tableName}.${col.fieldName}`], col.criteria));
    }
    const sortColumns = columns.filter((c: any) => c.sort);
    if (sortColumns.length > 0) {
      resultRows.sort((a, b) => {
        for (const col of sortColumns) {
          const k = `${col.tableName}.${col.fieldName}`;
          const av = a[k]; const bv = b[k]; const aStr = String(av??""); const bStr = String(bv??"");
          const an = Number(av); const bn = Number(bv); let cmp = 0;
          if (!isNaN(an) && !isNaN(bn)) cmp = an - bn; else cmp = aStr.localeCompare(bStr);
          if (cmp !== 0) return col.sort === "asc" ? cmp : -cmp;
        }
        return 0;
      });
    }
    const showCols = columns.filter((c: any) => c.show);
    const outputCols = showCols.map((c: any) => ({ key: `${c.tableName}.${c.fieldName}`, label: c.alias || c.fieldName, fieldName: c.fieldName, tableName: c.tableName }));
    const outputRows = resultRows.map(row => { const out: Record<string,any> = {}; for (const c of outputCols) out[c.key] = row[c.key]; return out; });
    res.json({ columns: outputCols, rows: outputRows });
  });

  /* ── Forms ── */
  app.get("/api/ds/databases/:dbId/forms", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    res.json(await db!.select().from(dsForms).where(eq(dsForms.databaseId, databaseId)));
  });

  app.post("/api/ds/databases/:dbId/forms", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const { name, definition } = req.body;
    const [f] = await db!.insert(dsForms).values({ name: name || "Form1", databaseId, definition: definition || {} }).returning();
    res.status(201).json(f);
  });

  app.get("/api/ds/databases/:dbId/forms/:formId", async (req, res) => {
    const [f] = await db!.select().from(dsForms).where(eq(dsForms.id, parseInt(req.params.formId)));
    if (!f) return res.status(404).json({ error: "Form not found" });
    res.json(f);
  });

  app.put("/api/ds/databases/:dbId/forms/:formId", async (req, res) => {
    const { name, definition } = req.body;
    const [f] = await db!.update(dsForms).set({ name, definition, updatedAt: new Date() }).where(eq(dsForms.id, parseInt(req.params.formId))).returning();
    if (!f) return res.status(404).json({ error: "Form not found" });
    res.json(f);
  });

  app.delete("/api/ds/databases/:dbId/forms/:formId", async (req, res) => {
    await db!.delete(dsForms).where(eq(dsForms.id, parseInt(req.params.formId)));
    res.status(204).send();
  });

  /* ── Reports ── */
  app.get("/api/ds/databases/:dbId/reports", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    res.json(await db!.select().from(dsReports).where(eq(dsReports.databaseId, databaseId)));
  });

  app.post("/api/ds/databases/:dbId/reports", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const { name, definition } = req.body;
    const [r] = await db!.insert(dsReports).values({ name: name || "Report1", databaseId, definition: definition || {} }).returning();
    res.status(201).json(r);
  });

  app.get("/api/ds/databases/:dbId/reports/:reportId", async (req, res) => {
    const [r] = await db!.select().from(dsReports).where(eq(dsReports.id, parseInt(req.params.reportId)));
    if (!r) return res.status(404).json({ error: "Report not found" });
    res.json(r);
  });

  app.put("/api/ds/databases/:dbId/reports/:reportId", async (req, res) => {
    const { name, definition } = req.body;
    const [r] = await db!.update(dsReports).set({ name, definition, updatedAt: new Date() }).where(eq(dsReports.id, parseInt(req.params.reportId))).returning();
    if (!r) return res.status(404).json({ error: "Report not found" });
    res.json(r);
  });

  app.delete("/api/ds/databases/:dbId/reports/:reportId", async (req, res) => {
    await db!.delete(dsReports).where(eq(dsReports.id, parseInt(req.params.reportId)));
    res.status(204).send();
  });

  /* ── Relationships ── */
  app.get("/api/ds/databases/:dbId/relationships", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const rows = await db!.select().from(dsRelationships).where(eq(dsRelationships.databaseId, databaseId));
    res.json(rows.map((r: any) => tsFmt(r, "createdAt")));
  });

  app.post("/api/ds/databases/:dbId/relationships", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const { fromTableId, fromFieldId, toTableId, toFieldId, relationshipType, enforceIntegrity, cascadeUpdate, cascadeDelete, joinType } = req.body;
    if (!fromTableId || !fromFieldId || !toTableId || !toFieldId) return res.status(400).json({ error: "fromTableId, fromFieldId, toTableId, toFieldId are required" });
    const [r] = await db!.insert(dsRelationships).values({
      databaseId, fromTableId, fromFieldId, toTableId, toFieldId,
      relationshipType: relationshipType || "one-to-many",
      enforceIntegrity: !!enforceIntegrity,
      cascadeUpdate: !!cascadeUpdate,
      cascadeDelete: !!cascadeDelete,
      joinType: typeof joinType === 'number' ? joinType : 1,
    }).returning();
    res.status(201).json(tsFmt(r, "createdAt"));
  });

  app.put("/api/ds/databases/:dbId/relationships/:relId", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const relId = parseInt(req.params.relId);
    const { fromTableId, fromFieldId, toTableId, toFieldId, relationshipType, enforceIntegrity, cascadeUpdate, cascadeDelete, joinType } = req.body;
    const updates: any = {};
    if (fromTableId !== undefined) updates.fromTableId = fromTableId;
    if (fromFieldId !== undefined) updates.fromFieldId = fromFieldId;
    if (toTableId !== undefined) updates.toTableId = toTableId;
    if (toFieldId !== undefined) updates.toFieldId = toFieldId;
    if (relationshipType !== undefined) updates.relationshipType = relationshipType;
    if (enforceIntegrity !== undefined) updates.enforceIntegrity = !!enforceIntegrity;
    if (cascadeUpdate !== undefined) updates.cascadeUpdate = !!cascadeUpdate;
    if (cascadeDelete !== undefined) updates.cascadeDelete = !!cascadeDelete;
    if (joinType !== undefined) updates.joinType = joinType;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "no fields to update" });
    const [r] = await db!.update(dsRelationships).set(updates)
      .where(and(eq(dsRelationships.id, relId), eq(dsRelationships.databaseId, databaseId)))
      .returning();
    if (!r) return res.status(404).json({ error: "Relationship not found" });
    res.json(tsFmt(r, "createdAt"));
  });

  app.delete("/api/ds/databases/:dbId/relationships/:relId", async (req, res) => {
    const dbId = parseInt(req.params.dbId);
    const relId = parseInt(req.params.relId);
    // Look up the relationship before deleting so we can also strip the
    // lookup-dropdown config from the FK field, restoring it to a plain
    // text/number/etc. cell in the data view.
    const [rel] = await db!.select().from(dsRelationships).where(and(eq(dsRelationships.id, relId), eq(dsRelationships.databaseId, dbId)));
    await db!.delete(dsRelationships).where(and(eq(dsRelationships.id, relId), eq(dsRelationships.databaseId, dbId)));
    if (rel?.toFieldId) {
      const [fkField] = await db!.select().from(dsFields).where(eq(dsFields.id, rel.toFieldId));
      if (fkField?.description?.startsWith('__lookup__:')) {
        await db!.update(dsFields).set({ description: null }).where(eq(dsFields.id, rel.toFieldId));
      }
    }
    res.status(204).send();
  });

  /* ── SQL ── */
  app.post("/api/ds/databases/:dbId/sql", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const { sql: rawSql } = req.body;
    if (!rawSql || typeof rawSql !== "string") return res.status(400).json({ error: "sql is required" });
    const err = validateSql(rawSql);
    if (err) return res.status(400).json({ error: err });
    try {
      const start = Date.now();
      const tables = await db!.select().from(dsTables).where(eq(dsTables.databaseId, databaseId));
      if (tables.length === 0) return res.status(400).json({ error: "No tables found in this database. Create a table first." });
      const aliasMap: Record<string, string> = {};
      for (const t of tables) aliasMap[t.name.toLowerCase()] = safeIdent(t.name);
      const processedSql = preprocessSql(rawSql.trim(), aliasMap);
      const type = stmtType(rawSql);
      const instanceDb = `ds_${databaseId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      alasql(`CREATE DATABASE ${instanceDb}`);
      alasql(`USE ${instanceDb}`);
      try {
        const tableFieldMap: Map<number, typeof dsFields.$inferSelect[]> = new Map();
        for (const table of tables) {
          const safeName = safeIdent(table.name);
          const fields = await db!.select().from(dsFields).where(eq(dsFields.tableId, table.id)).orderBy(dsFields.sortOrder);
          tableFieldMap.set(table.id, fields);
          const records = await db!.select().from(dsRecords).where(and(eq(dsRecords.tableId, table.id), eq(dsRecords.databaseId, databaseId)));
          if (fields.length === 0) { alasql(`CREATE TABLE ${safeName} (id INT)`); continue; }
          const colDefs = fields.map((f: any) => {
            const safeFld = safeIdent(f.name);
            let typ = "STRING";
            if (f.fieldType === "number" || f.fieldType === "autonumber" || f.fieldType === "currency") typ = "NUMBER";
            else if (f.fieldType === "date/time") typ = "STRING";
            else if (f.fieldType === "yes/no") typ = "BOOLEAN";
            return `${safeFld} ${typ}`;
          });
          alasql(`CREATE TABLE ${safeName} (${colDefs.join(", ")})`);
          if (records.length > 0) {
            const dataRows = records.map((r: any) => {
              const out: Record<string,any> = {};
              for (const f of fields) out[safeIdent(f.name)] = (r.data as any)[f.name] ?? null;
              return out;
            });
            alasql(`INSERT INTO ${safeName} SELECT * FROM ?`, [dataRows]);
          }
        }
        const result = alasql(processedSql);
        const elapsed = Date.now() - start;
        if (type === "select") {
          const rows = Array.isArray(result) ? result : [];
          const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
          return res.json({ columns: cols, rows, rowCount: rows.length, executionTimeMs: elapsed });
        }
        // DML: write changes back to PostgreSQL so the next query sees updated data
        const rowsAffected = typeof result === "number" ? result : 1;
        for (const table of tables) {
          const safeName = safeIdent(table.name);
          const fields = tableFieldMap.get(table.id) ?? [];
          if (fields.length === 0) continue;
          try {
            const currentRows = alasql(`SELECT * FROM ${safeName}`) as any[];
            await db!.delete(dsRecords).where(and(eq(dsRecords.tableId, table.id), eq(dsRecords.databaseId, databaseId)));
            for (const row of currentRows) {
              const data: Record<string, any> = {};
              for (const f of fields) data[f.name] = row[safeIdent(f.name)] ?? null;
              await db!.insert(dsRecords).values({ tableId: table.id, databaseId, data });
            }
          } catch (_) { /* ignore individual table sync errors */ }
        }
        return res.json({ isDml: true, rowsAffected, statementType: type, executionTimeMs: elapsed });
      } finally {
        try { alasql(`DROP DATABASE ${instanceDb}`); } catch {}
      }
    } catch (e: any) {
      const tableNames = (await db!.select({ name: dsTables.name }).from(dsTables).where(eq(dsTables.databaseId, databaseId))).map((t: any) => t.name);
      let msg = e?.message || "Query execution failed";
      if (/table.*not.*(exist|found)|no such table/i.test(msg)) msg = `Table not found. Available: ${tableNames.join(", ")}. Check spelling.`;
      else if (/column.*not.*(found|exist)/i.test(msg)) msg = "Column not found. Check the field name spelling.";
      else if (/syntax error/i.test(msg)) msg = `Syntax error: ${msg}`;
      return res.status(400).json({ error: msg });
    }
  });

  app.get("/api/ds/databases/:dbId/sql/schema", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tables = await db!.select().from(dsTables).where(eq(dsTables.databaseId, databaseId));
    const schema = await Promise.all(tables.map(async (table: any) => {
      const fields = await db!.select().from(dsFields).where(eq(dsFields.tableId, table.id));
      return { id: table.id, name: table.name, fields: fields.sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((f: any) => ({ name: f.name, fieldType: f.fieldType, isPrimaryKey: f.isPrimaryKey })) };
    }));
    res.json(schema);
  });

  /* ── Tools: Analyse ── */
  app.get("/api/ds/databases/:dbId/analyse", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tables = await db!.select().from(dsTables).where(eq(dsTables.databaseId, databaseId));
    const tableStats = await Promise.all(tables.map(async (table: any) => {
      const fields = await db!.select().from(dsFields).where(eq(dsFields.tableId, table.id));
      const records = await db!.select().from(dsRecords).where(and(eq(dsRecords.tableId, table.id), eq(dsRecords.databaseId, databaseId)));
      const rowCount = records.length;
      const fieldStats = fields.sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((f: any) => {
        const emptyCount = records.filter((r: any) => { const v = (r.data as any)[f.name]; return v === null || v === undefined || v === ""; }).length;
        return { id: f.id, name: f.name, fieldType: f.fieldType, isPrimaryKey: f.isPrimaryKey, emptyCount, fillRate: rowCount > 0 ? Math.round(((rowCount - emptyCount)/rowCount)*100) : 100 };
      });
      return { id: table.id, name: table.name, rowCount, fieldCount: fields.length, fieldStats, createdAt: table.createdAt.toISOString() };
    }));
    res.json({ tables: tableStats, totalTables: tables.length, totalRecords: tableStats.reduce((s,t) => s+t.rowCount, 0) });
  });

  app.post("/api/ds/databases/:dbId/compact", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tables = await db!.select({ id: dsTables.id }).from(dsTables).where(eq(dsTables.databaseId, databaseId));
    const validIds = new Set(tables.map((t: any) => t.id));
    const allRecords = await db!.select({ id: dsRecords.id, tableId: dsRecords.tableId }).from(dsRecords).where(eq(dsRecords.databaseId, databaseId));
    const orphans = allRecords.filter((r: any) => !validIds.has(r.tableId));
    for (const r of orphans) await db!.delete(dsRecords).where(eq(dsRecords.id, r.id));
    res.json({ message: "Compact & Repair complete", tablesChecked: tables.length, orphanedRecordsRemoved: orphans.length, status: "healthy" });
  });


  /* ── AI Database Structure Grading (for student embed / N4 mode) ──
     Thin wrapper around the shared `gradeDatabaseStructure` helper. */
  app.post("/api/ds/grade-database", async (req, res) => {
    const { sandboxDatabaseId, taskDescription: clientTaskDesc } = req.body;
    if (!sandboxDatabaseId) return res.status(400).json({ error: "sandboxDatabaseId is required" });
    try {
      const result = await gradeDatabaseStructure({ sandboxDatabaseId, taskDescription: clientTaskDesc });
      res.json(result);
    } catch (err: any) {
      const msg = err?.message || "AI marking failed";
      if (msg === "Database not found") return res.status(404).json({ error: msg });
      if (/AI marking is not available/i.test(msg)) return res.status(503).json({ error: msg });
      console.error("DS database grading error:", msg);
      res.status(500).json({ error: "AI marking failed. Please try again." });
    }
  });

  /* ── AI SQL Grading ──
     Thin wrapper around the shared `gradeSandboxSql` helper. The DS embed only
     reads `feedback`; the extra `mark` / `maxMark` fields are additive and used
     by other callers (e.g. BHS Classwork). */
  app.post("/api/ds/grade-sandbox", async (req, res) => {
    const { databaseId, sql, results, taskDescription: clientTaskDesc } = req.body;
    if (!sql) return res.status(400).json({ error: "sql is required" });
    try {
      const result = await gradeSandboxSql({ databaseId, sql, results, taskDescription: clientTaskDesc });
      res.json(result);
    } catch (err: any) {
      const msg = err?.message || "AI grading failed";
      if (/AI grading is not available/i.test(msg)) return res.status(503).json({ error: msg });
      console.error("DS grading error:", msg);
      res.status(500).json({ error: "AI grading failed. Please try again." });
    }
  });
}
