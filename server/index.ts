import express from 'express';
import path from 'path';
import fs from 'fs';
import { promises as fsp } from 'fs';
import crypto from 'crypto';
import { db, pool, hasDatabase } from './db';
import {
  streamObjectOrFallback,
  readBucketObjectAsString,
  writeBucketObjectFromString,
  deleteBucketObject,
  listBucketKeys,
} from './object-uploads-store';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { registerRoutes as registerRevisionRoutes } from './revision-routes';
import { registerN5Routes, n5Sessions, n5AddSession } from './n5-routes';
import { registerDsRoutes } from './ds-routes';
import { registerProgressRoutes } from './progress-routes';
import { registerClassworkRoutes } from './classwork-routes';
import { registerContentRoutes } from './content-routes';
import { registerCodeProjectsRoutes } from './code-projects-routes';
import { registerDsWorkspaceRoutes } from './ds-workspace-routes';
import { ensureFontsAvailable } from './font-setup';
import { eq } from 'drizzle-orm';
import { sessions as revSessionsTable, users as revUsersTable } from '@shared/revision-schema';

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const app = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');

app.use(express.json());

app.use((req, res, next) => {
  // Data Sculptor embeds are designed to be iframed from anywhere (the
  // production site, the dev workspace, even external pages), so we skip the
  // SAMEORIGIN restriction for those routes only. Everything else stays locked.
  // In development we also need to allow framing globally so the Replit
  // workspace preview pane (a cross-origin iframe) can load the dev server —
  // otherwise the workspace shows "Server artifact encountered an error".
  const isDev = process.env.NODE_ENV !== 'production';
  const isEmbeddable = isDev || req.path.startsWith('/data-sculptor');
  if (!isEmbeddable) {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // frame-src now includes the production domain so pages served from dev /
  // local hosts can also embed iframes that point at the live data-sculptor.
  // frame-ancestors '*' on data-sculptor responses lets it be framed anywhere.
  const frameSrc = "frame-src 'self' https://trinket.io https://www.bhs-computing.co.uk https://bhs-computing.co.uk";
  const frameAncestors = isEmbeddable ? "frame-ancestors *" : "frame-ancestors 'self'";
  res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://static.cloudflareinsights.com blob:; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://cdn.jsdelivr.net https://static.cloudflareinsights.com https://texttospeech.googleapis.com https://generativelanguage.googleapis.com https://api.groq.com; ${frameSrc}; ${frameAncestors}; media-src 'self' blob: data: https:; worker-src 'self' blob:;`);
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

app.use((req, res, next) => {
  const blocked = /\/(\.git|\.env|server|shared|node_modules|drizzle|\.config|\.local|\.replit|replit\.md|package\.json|package-lock\.json|tsconfig\.json|drizzle\.config\.ts)/i;
  if (blocked.test(req.path)) {
    return res.status(404).send('Not found');
  }
  next();
});

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

app.post('/api/tts', async (req, res) => {
  const apiKey = process.env.GOOGLE_TTS_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'TTS service not configured' });
  }
  const text = (req.body?.text || '').substring(0, 2000);
  if (!text) return res.status(400).json({ error: 'No text provided' });

  /* Build SSML with <mark> before each word so we can get timepoints back */
  const words = text.split(/\s+/).filter((w: string) => w.length > 0);
  const ssmlBody = words.map((w: string, i: number) => `<mark name="w${i}"/>${escapeXml(w)}`).join(' ');
  const ssml = `<speak>${ssmlBody}</speak>`;

  const attempts = 3;
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { ssml },
            voice: { languageCode: 'en-GB', name: 'en-GB-Neural2-A' },
            audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 },
            enableTimePointing: ['SSML_MARK']
          })
        }
      );
      if (!response.ok) throw new Error(`TTS API error: ${response.status}`);
      const data = await response.json() as { audioContent: string; timepoints?: { markName: string; timeSeconds: number }[] };
      return res.json({ audioContent: data.audioContent, timepoints: data.timepoints || [] });
    } catch (err) {
      if (i === attempts - 1) {
        return res.status(502).json({ error: 'TTS request failed' });
      }
      await new Promise(r => setTimeout(r, 200));
    }
  }
});

// ---------------------------------------------------------------------------
// Quiz marking endpoint — uses Gemini to mark student answers
// ---------------------------------------------------------------------------
app.post('/api/quiz/mark', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Quiz marking service not configured' });
  }

  const { questions } = req.body as {
    questions: Array<{
      text: string;
      type: string;
      marks: number;
      markingScheme: string;
      answer: string;
    }>;
  };

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'No questions provided' });
  }

  // Cap at 20 questions and 500 chars per answer for safety
  const MAX_QUESTIONS = 20;
  const MAX_ANSWER_LEN = 1000;
  const safeQuestions = questions.slice(0, MAX_QUESTIONS).map(q => ({
    ...q,
    answer: (q.answer || '').substring(0, MAX_ANSWER_LEN),
    marks: Math.min(Math.max(parseInt(String(q.marks)) || 1, 1), 20),
  }));

  const prompt = buildMarkingPrompt(safeQuestions);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const parsed = parseGeminiResponse(text, safeQuestions);
    return res.json({ results: parsed });
  } catch (err) {
    console.error('Gemini marking error:', err);
    return res.status(502).json({ error: 'Marking service temporarily unavailable' });
  }
});

function buildMarkingPrompt(questions: Array<{text: string; type: string; marks: number; markingScheme: string; answer: string}>): string {
  let prompt = `You are a Scottish secondary school Computing Science teacher marking student quiz answers.
Mark each answer strictly according to the marking scheme provided.
Be concise, fair, and encouraging. Do not give more marks than the maximum.
If an answer is blank or clearly irrelevant, award 0 marks.

For each question, respond with EXACTLY this format (no extra text before or after):
QUESTION_1_START
MARKS: <number awarded>/<maximum>
FEEDBACK: <2-4 sentences of constructive feedback>
QUESTION_1_END

Use QUESTION_2_START/END for question 2, etc.

`;

  questions.forEach((q, i) => {
    const n = i + 1;
    prompt += `--- Question ${n} ---\n`;
    prompt += `Type: ${q.type}\n`;
    prompt += `Question: ${q.text}\n`;
    prompt += `Maximum marks: ${q.marks}\n`;
    prompt += `Marking scheme: ${q.markingScheme}\n`;
    prompt += `Student answer:\n${q.answer || '(no answer provided)'}\n\n`;
  });

  return prompt;
}

function parseGeminiResponse(text: string, questions: Array<{marks: number}>): Array<{marksAwarded: number; feedback: string}> {
  return questions.map((q, i) => {
    const n = i + 1;
    const blockRe = new RegExp(`QUESTION_${n}_START([\\s\\S]*?)QUESTION_${n}_END`, 'i');
    const block = text.match(blockRe);
    if (!block) {
      return { marksAwarded: 0, feedback: 'Unable to retrieve feedback for this question.' };
    }
    const content = block[1];

    const marksMatch = content.match(/MARKS:\s*(\d+)\s*\/\s*\d+/i);
    const feedbackMatch = content.match(/FEEDBACK:\s*([\s\S]+)/i);

    const marksAwarded = marksMatch ? Math.min(parseInt(marksMatch[1]), q.marks) : 0;
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'No feedback available.';

    return { marksAwarded, feedback };
  });
}

// ---------------------------------------------------------------------------
// Code quiz marking endpoint (Python coding exercises with AI feedback)
// ---------------------------------------------------------------------------
app.post('/api/quiz/mark-code', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Marking service not configured' });
  }

  const { questions } = req.body as {
    questions: Array<{ text: string; marks: number; markingScheme: string; answer: string; codeType?: string; example?: string }>;
  };

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'No questions provided' });
  }

  const MAX_QUESTIONS = 10;
  const MAX_CODE_LEN  = 2000;
  const safe = questions.slice(0, MAX_QUESTIONS).map(q => ({
    text:          (q.text          || '').substring(0, 500),
    marks:         Math.min(Math.max(parseInt(String(q.marks)) || 1, 1), 20),
    markingScheme: (q.markingScheme || '').substring(0, 500),
    answer:        (q.answer        || '').substring(0, MAX_CODE_LEN),
    codeType:      (q.codeType      || 'python'),
    example:       (q.example       || '').substring(0, 1000),
  }));

  let prompt = `You are a Scottish secondary school Computing Science teacher assessing student code.
For each task you receive: the task description, the student's code, a marking scheme, and optionally an example answer.

MARKING RULES — follow these exactly:
1. The marking scheme lists individual criteria, each worth one mark. Go through each criterion one at a time.
2. Award a mark for EACH criterion the student's code satisfies, regardless of whether other criteria are met.
3. PARTIAL MARKS must be awarded when only some criteria are met — do not round up or down to 0 or full marks unless genuinely warranted.
4. Award 0 only if the code is blank, completely wrong, or meets none of the criteria.
5. Award the maximum only if every criterion is fully met.
6. Do not award more marks than the maximum.
7. Ignore minor stylistic issues (variable names, spacing) unless the marking scheme explicitly penalises them.

After working out the mark, write 2-3 sentences of encouraging, age-appropriate feedback for a 14-16 year old.
Mention specifically what was done well and, if marks were lost, what needs to be fixed.

For each question respond with EXACTLY this format (no extra text before or after):
QUESTION_1_START
MARKS: <number>/<maximum>
FEEDBACK: <2-3 sentences>
QUESTION_1_END

Use QUESTION_2_START/END for question 2, etc.

`;

  safe.forEach((q, i) => {
    const n = i + 1;
    const lang = q.codeType === 'html' ? 'html' : 'python';
    prompt += `--- Question ${n} ---\n`;
    prompt += `Task: ${q.text}\n`;
    prompt += `Maximum marks: ${q.marks}\n`;
    prompt += `Marking scheme: ${q.markingScheme}\n`;
    if (q.example) {
      prompt += `Example answer (for reference — use this to calibrate your marking):\n\`\`\`${lang}\n${q.example}\n\`\`\`\n`;
    }
    prompt += `Student's ${lang.toUpperCase()} code:\n\`\`\`${lang}\n${q.answer || '(no code written)'}\n\`\`\`\n\n`;
  });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model  = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text   = result.response.text();
    const parsed = parseGeminiResponse(text, safe);
    return res.json({ results: parsed });
  } catch (err) {
    console.error('Gemini code-marking error:', err);
    return res.status(502).json({ error: 'Marking service temporarily unavailable' });
  }
});

// ---------------------------------------------------------------------------
// Sandbox API — named collections of starter files for the code runner.
// Sandboxes live in Object Storage at the `sandboxes/` prefix so teacher
// edits and brand-new sandboxes survive every container redeploy. The
// `starters/` directory in git is treated as a one-time seed source: on
// startup, any starter JSON that does NOT yet exist in the bucket is copied
// over. Starters that already exist in the bucket are left alone, so a
// teacher's edited copy is never overwritten by the disk template.
// ---------------------------------------------------------------------------
const STARTERS_DIR = path.join(process.cwd(), 'starters');
const SANDBOX_PREFIX = 'sandboxes/';

async function seedSandboxesFromDiskIfMissing() {
  try {
    const dirEntries = await fsp.readdir(STARTERS_DIR).catch(() => [] as string[]);
    const jsonFiles = dirEntries.filter((f) => f.endsWith('.json'));
    if (jsonFiles.length === 0) return;
    let seeded = 0;
    for (const f of jsonFiles) {
      const key = SANDBOX_PREFIX + f;
      const existing = await readBucketObjectAsString(key);
      if (existing != null) continue;
      const body = await fsp.readFile(path.join(STARTERS_DIR, f), 'utf8');
      await writeBucketObjectFromString(key, body);
      seeded += 1;
    }
    if (seeded > 0) console.log(`[sandboxes] seeded ${seeded} starter sandbox(es) from disk into Object Storage`);
  } catch (err) {
    console.error('[sandboxes] seed-from-disk failed:', err);
  }
}
// Fire-and-forget; failure here is logged but must never block startup.
seedSandboxesFromDiskIfMissing();

const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'bhs-computing';

/* In-memory session tokens — kept for backward-compat but no longer required */
const teacherTokens = new Set<string>();

/* ── HMAC-signed tokens — survive server restarts ─────────────────────────
 * Format: base64url(JSON payload) + '.' + base64url(HMAC-SHA256 signature)
 * Payload: { email, exp }  where exp is a Unix-ms timestamp
 * Tokens are valid for 7 days and are signed with TEACHER_PASSWORD, so they
 * are automatically invalidated if the password changes.                    */
function makeTeacherToken(email: string): string {
  const payload = Buffer.from(JSON.stringify({
    email: email.toLowerCase().trim(),
    exp:   Date.now() + 7 * 24 * 60 * 60 * 1000   // 7 days
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', TEACHER_PASSWORD).update(payload).digest('base64url');
  return payload + '.' + sig;
}

function verifyTeacherToken(token: string): boolean {
  try {
    const dot = token.indexOf('.');
    if (dot === -1) return false;
    const payload = token.slice(0, dot);
    const sig     = token.slice(dot + 1);
    const expected = crypto.createHmac('sha256', TEACHER_PASSWORD).update(payload).digest('base64url');
    if (sig.length !== expected.length) return false;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch { return false; }
}

function requireTeacher(req: express.Request, res: express.Response, next: express.NextFunction) {
  const pw = req.headers['x-teacher-password'] as string | undefined;
  if (pw && (pw === TEACHER_PASSWORD || teacherTokens.has(pw) || verifyTeacherToken(pw))) return next();
  return res.status(401).json({ error: 'Unauthorised' });
}

/* Token exchange: outer dashboard token → revision-app session token.
   Called by the Teacher Dashboard so a single sign-in covers all panels. */
function extractEmailFromOuterToken(tok: string): string {
  try {
    const dot = tok.indexOf('.');
    if (dot === -1) return '';
    const payload = JSON.parse(Buffer.from(tok.slice(0, dot), 'base64url').toString('utf8'));
    return (payload.email as string) || '';
  } catch { return ''; }
}

app.post('/api/revision-auth', requireTeacher, async (req: express.Request, res: express.Response) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    const email = extractEmailFromOuterToken((req.headers['x-teacher-password'] as string) || '');
    let rows = email
      ? await db.select().from(revUsersTable).where(eq(revUsersTable.email, email)).limit(1)
      : await db.select().from(revUsersTable).limit(1);
    if (!rows.length) return res.status(404).json({ error: 'No teacher account found in the revision app. Please log in via the Classes panel.' });
    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(revSessionsTable).values({ token, userId: user.id, username: user.username, expiresAt }).onConflictDoNothing();
    res.json({ token, expiresAt: expiresAt.getTime() });
  } catch (err) {
    console.error('revision-auth exchange error:', err);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

app.post('/api/n5/revision-auth', requireTeacher, async (req: express.Request, res: express.Response) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    const email = extractEmailFromOuterToken((req.headers['x-teacher-password'] as string) || '');
    let rows = email
      ? await db.select().from(revUsersTable).where(eq(revUsersTable.email, email)).limit(1)
      : await db.select().from(revUsersTable).limit(1);
    if (!rows.length) return res.status(404).json({ error: 'No teacher account found in the revision app. Please log in via the Classes panel.' });
    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await n5AddSession(token, { username: user.username, expiresAt: expiresAt.getTime() }, user.id);
    res.json({ token, expiresAt: expiresAt.getTime() });
  } catch (err) {
    console.error('n5 revision-auth exchange error:', err);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

/* Reverse SSO: exchange a valid Higher revision-app token for an outer dashboard HMAC token.
   Also exchanges for the N5 token so all three stay in sync. */
app.post('/api/teacher-auth/from-revision', async (req: express.Request, res: express.Response) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    const revToken = (req.headers['x-revision-token'] as string || '').trim();
    if (!revToken) return res.status(400).json({ error: 'Missing X-Revision-Token header' });

    /* Validate against rev_sessions */
    const sessionRows = await db.select().from(revSessionsTable)
      .where(eq(revSessionsTable.token, revToken))
      .limit(1);
    if (!sessionRows.length) return res.status(401).json({ error: 'Invalid or expired revision token' });
    const session = sessionRows[0];
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({ error: 'Revision token expired' });
    }

    /* Look up the teacher's email */
    const userRows = await db.select().from(revUsersTable)
      .where(eq(revUsersTable.id, session.userId))
      .limit(1);
    if (!userRows.length) return res.status(404).json({ error: 'Teacher account not found' });
    const email = userRows[0].email;

    /* Issue outer HMAC token */
    const outerToken = makeTeacherToken(email);

    /* Also issue fresh N5 token so all three are in sync */
    const n5Token = crypto.randomBytes(32).toString('hex');
    const n5Expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await n5AddSession(n5Token, { username: userRows[0].username, expiresAt: n5Expires.getTime() }, userRows[0].id);

    res.json({ ok: true, token: outerToken, n5Token, n5TokenExpires: n5Expires.getTime() });
  } catch (err) {
    console.error('[from-revision] error:', err);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

function safeName(raw: string): string {
  return raw.replace(/[^a-z0-9_-]/gi, '').substring(0, 80);
}

app.get('/api/sandboxes', requireTeacher, async (_req, res) => {
  try {
    const keys = await listBucketKeys(SANDBOX_PREFIX);
    const jsonKeys = keys.filter((k) => k.endsWith('.json'));
    const entries = await Promise.all(jsonKeys.map(async (k) => {
      const name = k.slice(SANDBOX_PREFIX.length, -'.json'.length);
      const body = await readBucketObjectAsString(k);
      try {
        const data = JSON.parse(body || '{}');
        return { name, type: data.type || 'html', title: data.title || name };
      } catch { return { name, type: 'html', title: name }; }
    }));
    res.json(entries);
  } catch (err) {
    console.error('[sandboxes] list failed:', err);
    res.status(500).json({ error: 'Could not list sandboxes' });
  }
});

app.get('/api/sandboxes/:name', async (req, res) => {
  const name = safeName(req.params.name);
  if (!name) return res.status(404).json({ error: 'Sandbox not found' });
  try {
    const data = await readBucketObjectAsString(`${SANDBOX_PREFIX}${name}.json`);
    if (data == null) return res.status(404).json({ error: 'Sandbox not found' });
    res.type('application/json').send(data);
  } catch (err) {
    console.error('[sandboxes] read failed for', name, err);
    res.status(500).json({ error: 'Could not read sandbox' });
  }
});

app.post('/api/teacher-auth', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.json({ ok: false });

  const emailClean = String(email).toLowerCase().trim();
  const pwClean    = String(password);

  /* ── Master-password shortcut ───────────────────────────────────────────
   * If the submitted password matches the server's TEACHER_PASSWORD env var
   * we issue a token immediately, without touching the database.  This acts
   * as a recovery route when database credentials fall out of sync.        */
  if (pwClean === TEACHER_PASSWORD) {
    const token = makeTeacherToken(emailClean);
    console.log('[teacher-auth] master-password match for', emailClean);
    return res.json({ ok: true, token });
  }

  if (hasDatabase) {
    try {
      const { teachers } = require('../shared/schema');
      const { eq } = require('drizzle-orm');
      const bcrypt = require('bcrypt');
      const rows = await db.select().from(teachers)
        .where(eq(teachers.email, emailClean))
        .limit(1);
      if (!rows.length) return res.json({ ok: false });
      const match = await bcrypt.compare(pwClean, rows[0].passwordHash);
      if (match) {
        const token = makeTeacherToken(emailClean);
        teacherTokens.add(token);
        return res.json({ ok: true, token });
      }
      return res.json({ ok: false });
    } catch (err) {
      console.error('[teacher-auth] error:', err);
      return res.json({ ok: false });
    }
  }

  res.json({ ok: false });
});

app.post('/api/teacher-update', async (req, res) => {
  const { currentEmail, currentPassword, newEmail, newPassword } = req.body;
  if (!currentEmail || !currentPassword) {
    return res.json({ ok: false, error: 'Current email and password are required.' });
  }
  if (!hasDatabase) return res.json({ ok: false, error: 'Database not available.' });

  try {
    const { teachers } = require('../shared/schema');
    const { eq } = require('drizzle-orm');
    const bcrypt = require('bcrypt');

    const rows = await db.select().from(teachers)
      .where(eq(teachers.email, String(currentEmail).toLowerCase().trim()))
      .limit(1);
    if (!rows.length) return res.json({ ok: false, error: 'Incorrect email or password.' });

    /* Allow the server master-password to bypass the bcrypt check so the
       teacher can recover access even when database credentials are stale. */
    const usingMasterPw = String(currentPassword) === TEACHER_PASSWORD;
    if (!usingMasterPw) {
      const match = await bcrypt.compare(String(currentPassword), rows[0].passwordHash);
      if (!match) return res.json({ ok: false, error: 'Incorrect email or password.' });
    }

    const updates: Record<string, string> = {};
    const cleanNewEmail = newEmail ? String(newEmail).toLowerCase().trim() : '';
    const cleanNewPw    = newPassword ? String(newPassword) : '';

    if (cleanNewEmail) updates.email = cleanNewEmail;
    if (cleanNewPw)    updates.passwordHash = await bcrypt.hash(cleanNewPw, 12);

    if (Object.keys(updates).length === 0) {
      return res.json({ ok: false, error: 'No changes provided.' });
    }

    await db.update(teachers).set(updates).where(eq(teachers.id, rows[0].id));
    res.json({ ok: true, newEmail: cleanNewEmail || String(currentEmail).toLowerCase().trim() });
  } catch (err) {
    console.error('Teacher update error:', err);
    res.json({ ok: false, error: 'Update failed. Please try again.' });
  }
});

app.post('/api/sandboxes/:name', requireTeacher, async (req, res) => {
  const name = safeName(req.params.name);
  if (!name) return res.status(400).json({ error: 'Invalid sandbox name' });
  try {
    const sbType = req.body.type || 'html';
    const payload: Record<string, unknown> = { type: sbType, title: req.body.title || name };
    if (sbType === 'python-quiz' || sbType === 'html-quiz') {
      payload.questions = Array.isArray(req.body.questions) ? req.body.questions : [];
    } else {
      payload.files = req.body.files || {};
    }
    await writeBucketObjectFromString(`${SANDBOX_PREFIX}${name}.json`, JSON.stringify(payload, null, 2));
    res.json({ ok: true, name });
  } catch (err) {
    console.error('[sandboxes] save failed for', name, err);
    res.status(500).json({ error: 'Could not save sandbox' });
  }
});

app.delete('/api/sandboxes/:name', requireTeacher, async (req, res) => {
  const name = safeName(req.params.name);
  if (!name) return res.json({ ok: true });
  try {
    await deleteBucketObject(`${SANDBOX_PREFIX}${name}.json`);
  } catch (err) {
    console.error('[sandboxes] delete failed for', name, err);
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Shared /assets/<name> and /resources/<name> handlers backed by Object
// Storage. These replace the per-route express.static mounts that used to live
// inside registerRevisionRoutes / registerN5Routes (which would have raced
// each other and only served disk files anyway). Read order is bucket first,
// then a chain of disk fallbacks for git-tracked legacy files (so the 29
// checked-in resources and the attached_assets references still resolve
// without re-uploading anything).
// ---------------------------------------------------------------------------
const RESOURCES_FORCED_MIME: Record<string, string> = {
  '.txt': 'text/plain', '.sql': 'text/plain', '.py': 'text/plain',
  '.vb': 'text/plain', '.css': 'text/css', '.js': 'application/javascript',
  '.csv': 'text/csv', '.json': 'application/json', '.xml': 'application/xml',
};

app.get('/assets/:name', async (req, res) => {
  const name = req.params.name;
  await streamObjectOrFallback(
    'public/assets/',
    name,
    res,
    [
      path.join(process.cwd(), 'attached_assets', name),
      path.join(process.cwd(), 'public', 'assets', name),
    ],
  );
});

app.get('/resources/:name', async (req, res) => {
  const name = req.params.name;
  const ext = path.extname(name).toLowerCase();
  await streamObjectOrFallback(
    'public/resources/',
    name,
    res,
    [path.join(process.cwd(), 'public', 'resources', name)],
    { forcedContentType: RESOURCES_FORCED_MIME[ext] },
  );
});

const publicRoot = path.resolve('.');
app.use(express.static(publicRoot, {
  dotfiles: 'deny',
  index: ['index.html']
}));

if (false && hasDatabase) {
  const session = require('express-session');
  const bcrypt = require('bcrypt');
  const connectPgSimple = require('connect-pg-simple');
  const { users, classes, classStudents, assignments, submissions } = require('../shared/schema');
  const { eq, and, desc } = require('drizzle-orm');

  const PgSession = connectPgSimple(session);

  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable must be set');
  }

  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      },
    })
  );

} // end if (hasDatabase)

declare module 'express-session' {
  interface SessionData {
    userId: number;
    role: string;
  }
}

if (false && hasDatabase) {
  const { users, classes, classStudents, assignments, submissions } = require('../shared/schema');
  const { eq, and, desc } = require('drizzle-orm');
  const bcrypt = require('bcrypt');

async function isClassOwner(userId: number, classId: number): Promise<boolean> {
  const [cls] = await db.select().from(classes).where(eq(classes.id, classId));
  return cls && cls.teacherId === userId;
}

async function isStudentInClass(userId: number, classId: number): Promise<boolean> {
  const enrollment = await db
    .select()
    .from(classStudents)
    .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, userId)));
  return enrollment.length > 0;
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, fullName, role } = req.body;
    
    const existingUser = await db.select().from(users).where(eq(users.username, username));
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({
      username,
      password: hashedPassword,
      fullName,
      role: 'student',
    }).returning();

    req.session.userId = newUser.id;
    req.session.role = newUser.role;
    
    res.json({ user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, role: newUser.role } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    
    res.json({ user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role } });
});

app.get('/api/classes', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    if (req.session.role === 'teacher') {
      const teacherClasses = await db.select().from(classes).where(eq(classes.teacherId, req.session.userId));
      res.json({ classes: teacherClasses });
    } else {
      const studentClasses = await db
        .select({
          id: classes.id,
          name: classes.name,
          level: classes.level,
          teacherId: classes.teacherId,
          createdAt: classes.createdAt,
        })
        .from(classStudents)
        .innerJoin(classes, eq(classStudents.classId, classes.id))
        .where(eq(classStudents.studentId, req.session.userId));
      
      res.json({ classes: studentClasses });
    }
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Failed to get classes' });
  }
});

app.post('/api/classes', async (req, res) => {
  if (!req.session.userId || req.session.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can create classes' });
  }

  try {
    const { name, level } = req.body;
    const [newClass] = await db.insert(classes).values({
      name,
      level,
      teacherId: req.session.userId,
    }).returning();

    res.json({ class: newClass });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

app.get('/api/classes/:classId/students', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const classId = parseInt(req.params.classId);
    
    const isOwner = await isClassOwner(req.session.userId, classId);
    const isEnrolled = await isStudentInClass(req.session.userId, classId);
    
    if (!isOwner && !isEnrolled) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const enrolledStudents = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        enrolledAt: classStudents.enrolledAt,
      })
      .from(classStudents)
      .innerJoin(users, eq(classStudents.studentId, users.id))
      .where(eq(classStudents.classId, classId));

    res.json({ students: enrolledStudents });
  } catch (error) {
    console.error('Get class students error:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

app.post('/api/classes/:classId/students', async (req, res) => {
  if (!req.session.userId || req.session.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can add students' });
  }

  try {
    const classId = parseInt(req.params.classId);
    
    if (!(await isClassOwner(req.session.userId, classId))) {
      return res.status(403).json({ error: 'Only class owner can add students' });
    }
    
    const { studentUsername } = req.body;

    const [student] = await db.select().from(users).where(eq(users.username, studentUsername));
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ error: 'User is not a student' });
    }

    const existing = await db
      .select()
      .from(classStudents)
      .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, student.id)));

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Student already enrolled' });
    }

    await db.insert(classStudents).values({
      classId,
      studentId: student.id,
    });

    res.json({ message: 'Student added successfully' });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

app.get('/api/classes/:classId/assignments', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const classId = parseInt(req.params.classId);
    
    const isOwner = await isClassOwner(req.session.userId, classId);
    const isEnrolled = await isStudentInClass(req.session.userId, classId);
    
    if (!isOwner && !isEnrolled) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const classAssignments = await db
      .select()
      .from(assignments)
      .where(eq(assignments.classId, classId))
      .orderBy(desc(assignments.createdAt));

    res.json({ assignments: classAssignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

app.post('/api/assignments', async (req, res) => {
  if (!req.session.userId || req.session.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can create assignments' });
  }

  try {
    const { title, description, starterCode, classId, dueDate } = req.body;
    
    if (!(await isClassOwner(req.session.userId, classId))) {
      return res.status(403).json({ error: 'Only class owner can create assignments' });
    }

    const [newAssignment] = await db.insert(assignments).values({
      title,
      description,
      starterCode: starterCode || '',
      classId,
      createdBy: req.session.userId,
      dueDate: dueDate ? new Date(dueDate) : null,
    }).returning();

    res.json({ assignment: newAssignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

app.get('/api/assignments/:assignmentId', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const assignmentId = parseInt(req.params.assignmentId);
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, assignmentId));
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const isOwner = await isClassOwner(req.session.userId, assignment.classId);
    const isEnrolled = await isStudentInClass(req.session.userId, assignment.classId);
    
    if (!isOwner && !isEnrolled) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ assignment });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: 'Failed to get assignment' });
  }
});

app.post('/api/submissions', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { assignmentId, code } = req.body;
    
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, assignmentId));
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    if (!(await isStudentInClass(req.session.userId, assignment.classId))) {
      return res.status(403).json({ error: 'You must be enrolled in this class to submit' });
    }
    
    const existing = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, req.session.userId)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(submissions)
        .set({ code, submittedAt: new Date() })
        .where(eq(submissions.id, existing[0].id))
        .returning();
      
      return res.json({ submission: updated });
    }

    const [newSubmission] = await db.insert(submissions).values({
      assignmentId,
      studentId: req.session.userId,
      code,
    }).returning();

    res.json({ submission: newSubmission });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

app.get('/api/assignments/:assignmentId/submissions', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const assignmentId = parseInt(req.params.assignmentId);
    
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, assignmentId));
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (req.session.role === 'teacher') {
      if (!(await isClassOwner(req.session.userId, assignment.classId))) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const allSubmissions = await db
        .select({
          id: submissions.id,
          code: submissions.code,
          submittedAt: submissions.submittedAt,
          feedback: submissions.feedback,
          feedbackAt: submissions.feedbackAt,
          studentId: users.id,
          studentName: users.fullName,
          studentUsername: users.username,
        })
        .from(submissions)
        .innerJoin(users, eq(submissions.studentId, users.id))
        .where(eq(submissions.assignmentId, assignmentId));

      res.json({ submissions: allSubmissions });
    } else {
      if (!(await isStudentInClass(req.session.userId, assignment.classId))) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const [studentSubmission] = await db
        .select()
        .from(submissions)
        .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, req.session.userId)));

      res.json({ submission: studentSubmission || null });
    }
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

app.post('/api/submissions/:submissionId/feedback', async (req, res) => {
  if (!req.session.userId || req.session.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can provide feedback' });
  }

  try {
    const submissionId = parseInt(req.params.submissionId);
    const { feedback } = req.body;

    const [submission] = await db.select().from(submissions).where(eq(submissions.id, submissionId));
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, submission.assignmentId));
    if (!assignment || !(await isClassOwner(req.session.userId, assignment.classId))) {
      return res.status(403).json({ error: 'Only class owner can provide feedback' });
    }

    const [updated] = await db
      .update(submissions)
      .set({
        feedback,
        feedbackBy: req.session.userId,
        feedbackAt: new Date(),
      })
      .where(eq(submissions.id, submissionId))
      .returning();

    res.json({ submission: updated });
  } catch (error) {
    console.error('Provide feedback error:', error);
    res.status(500).json({ error: 'Failed to provide feedback' });
  }
});

app.get('/api/users/students', async (req, res) => {
  if (!req.session.userId || req.session.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can view students' });
  }

  try {
    const allStudents = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
      })
      .from(users)
      .where(eq(users.role, 'student'));

    res.json({ students: allStudents });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

} // end if (hasDatabase) for API routes

/* ── Seed default teacher account on first run ── */
if (hasDatabase) {
  (async () => {
    try {
      const { teachers } = require('../shared/schema');
      const bcrypt = require('bcrypt');
      const existing = await db.select({ id: teachers.id }).from(teachers).limit(1);
      if (existing.length === 0) {
        const email = (process.env.TEACHER_EMAIL || 'teacher@bhs.sch.uk').toLowerCase();
        const hash  = await bcrypt.hash(TEACHER_PASSWORD, 12);
        await db.insert(teachers).values({ email, passwordHash: hash });
        console.log(`Default teacher account created — email: ${email}`);
      }
    } catch (err) {
      console.error('Teacher account seeding failed:', err);
    }
  })();
}

// ---------------------------------------------------------------------------
// Revision App — register API routes and serve built React SPA from /revision/
// ---------------------------------------------------------------------------
const revisionBuildDir = path.join(path.resolve('.'), 'public', 'revision');

// Both the Higher revision app (/revision/) and the N5 revision app
// (/revision-n5/) historically register many overlapping bare /api/* routes
// (e.g. /api/questions, /api/custom-quizzes, /api/teacher/*). To stop the two
// apps from racing for the same Express paths, we install each app's /api
// routes on its own Router and dispatch requests to the right Router based on
// the Referer header. Static asset mounts (/assets, /resources) and any
// non-/api routes still register on the real app.
const revisionApiRouter = express.Router();
const n5ApiRouter = express.Router();

function makeApiScopedApp(realApp: any, router: any) {
  const verbs = new Set(['get','post','put','patch','delete','options','head','all']);
  return new Proxy(realApp, {
    get(target, prop: string) {
      if (verbs.has(prop)) {
        return (path: any, ...handlers: any[]) => {
          if (typeof path === 'string' && path.startsWith('/api/')) {
            const sub = path.slice(4) || '/';
            return (router as any)[prop](sub, ...handlers);
          }
          return (target as any)[prop](path, ...handlers);
        };
      }
      if (prop === 'use') {
        return (...args: any[]) => {
          const first = args[0];
          if (typeof first === 'string' && first.startsWith('/api/')) {
            const sub = first.slice(4) || '/';
            return (router as any).use(sub, ...args.slice(1));
          }
          return (target as any).use(...args);
        };
      }
      return (target as any)[prop];
    }
  });
}

const revisionScopedApp = makeApiScopedApp(app, revisionApiRouter);
const n5ScopedApp = makeApiScopedApp(app, n5ApiRouter);

// Mount the dispatcher BEFORE registering any /api routes onto the routers.
// Choose router by Referer: anything from /revision-n5/ goes to N5; everything
// else (Higher app, sandbox builder, server-to-server, no referer) goes to the
// Higher (revision) router by default.
app.use('/api', (req, res, next) => {
  const ref = req.get('referer') || '';
  const isN5 = /\/revision-n5(\/|$|\?|#)/.test(ref);
  if (isN5) return n5ApiRouter(req, res, next);
  return revisionApiRouter(req, res, next);
});

// Register revision API routes onto the revision router (via scoped proxy).
registerRevisionRoutes(revisionScopedApp).catch((err: Error) => {
  console.error('Revision routes registration failed:', err);
});

// Serve the built revision React app as static files under /revision/
if (fs.existsSync(revisionBuildDir)) {
  app.use('/revision', express.static(revisionBuildDir, { dotfiles: 'deny' }));
  // SPA fallback — any /revision/* URL that isn't a static asset gets index.html
  app.get('/revision/*splat', (_req, res) => {
    res.sendFile(path.join(revisionBuildDir, 'index.html'));
  });
} else {
  app.get('/revision/*splat', (_req, res) => {
    res.status(503).send('Revision app not built yet. Run: npm run build:revision');
  });
}

// ---------------------------------------------------------------------------
// N5 Revision App — routes + static serving at /revision-n5/
// ---------------------------------------------------------------------------
const n5BuildDir = path.join(path.resolve('.'), 'public', 'revision-n5');

registerN5Routes(n5ScopedApp).catch((err: Error) => {
  console.error('N5 revision routes registration failed:', err);
});

if (fs.existsSync(n5BuildDir)) {
  app.use('/revision-n5', express.static(n5BuildDir, { dotfiles: 'deny' }));
  app.get('/revision-n5/*splat', (_req, res) => {
    res.sendFile(path.join(n5BuildDir, 'index.html'));
  });
} else {
  app.get('/revision-n5/*splat', (_req, res) => {
    res.status(503).send('N5 revision app not built yet. Run: npm run build:n5');
  });
}

// ---------------------------------------------------------------------------
// Data Sculptor — API routes + static serving at /data-sculptor/
// ---------------------------------------------------------------------------
registerDsRoutes(app);

const dsBuildDir = path.join(path.resolve('.'), 'public', 'data-sculptor');

if (fs.existsSync(dsBuildDir)) {
  app.use('/data-sculptor', express.static(dsBuildDir, { dotfiles: 'deny' }));
  app.get('/data-sculptor/*splat', (_req, res) => {
    res.sendFile(path.join(dsBuildDir, 'index.html'));
  });
} else {
  app.get('/data-sculptor/*splat', (_req, res) => {
    res.status(503).send('Data Sculptor not built yet. Run: npm run build:ds');
  });
}

// ---------------------------------------------------------------------------
// Progress Tracker — API routes + static serving at /progress/
// ---------------------------------------------------------------------------
registerProgressRoutes(app);

const progressBuildDir = path.join(path.resolve('.'), 'public', 'progress');

if (fs.existsSync(progressBuildDir)) {
  app.use('/progress', express.static(progressBuildDir, { dotfiles: 'deny' }));
  app.get('/progress/*splat', (_req, res) => {
    res.sendFile(path.join(progressBuildDir, 'index.html'));
  });
} else {
  app.get('/progress/*splat', (_req, res) => {
    res.status(503).send('Progress app not built yet. Run: npm run build:progress');
  });
}

// ---------------------------------------------------------------------------
// BHS Classwork — API routes + static serving at /classwork/
// ---------------------------------------------------------------------------
registerClassworkRoutes(app, requireTeacher);

const classworkBuildDir = path.join(path.resolve('.'), 'public', 'classwork');

if (fs.existsSync(classworkBuildDir)) {
  app.use('/classwork', express.static(classworkBuildDir, { dotfiles: 'deny' }));
  app.get('/classwork/*splat', (_req, res) => {
    res.sendFile(path.join(classworkBuildDir, 'index.html'));
  });
} else {
  app.get('/classwork/*splat', (_req, res) => {
    res.status(503).send('BHS Classwork app not built yet. Run: npm run build:classwork');
  });
}

// ---------------------------------------------------------------------------
// Shared content routes — papers, questions, assignments for both courses
// ---------------------------------------------------------------------------
registerContentRoutes(app, requireTeacher);
registerCodeProjectsRoutes(app);
registerDsWorkspaceRoutes(app);

try {
  const fontResult = ensureFontsAvailable(true);
  console.log(`[startup] fonts ready (${fontResult.linked} new symlinks, ${fontResult.sources.length} nix sources)`);
} catch (err) {
  console.warn('[startup] font setup failed:', err);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
