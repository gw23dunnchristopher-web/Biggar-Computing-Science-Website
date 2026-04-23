/**
 * AI marking for BHS Classwork submissions.
 *
 * `markSubmission(question, submission)` returns the marks awarded plus a
 * short feedback string. The strategy depends on the question type:
 *
 *   multiple_choice    → deterministic (no AI needed)
 *   short / long / code → Gemini text prompt with the marking scheme
 *   scratch_link       → fetch project metadata from the Scratch API + Gemini
 *   makecode_link      → fetch the project source via MakeCode share API + Gemini
 *   google_sites_link  → fetch the page HTML, extract text, and send to Gemini
 *   screenshot         → Gemini Vision (works once a file URL is provided)
 *   project            → if a link is supplied, route to the relevant handler;
 *                        if a file is uploaded, defer (Phase 3)
 *
 * If the AI call fails or no API key is configured we return null so the
 * submission is left unmarked for the teacher to grade by hand.
 */

import { GoogleGenAI } from '@google/genai';
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { spawn } from 'child_process';
import crypto from 'crypto';
import { pool, hasDatabase } from './db';
import { gradeSandboxSql, gradeDatabaseStructure } from './ds-routes';

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const MODEL = 'gemini-2.5-flash';

export interface AIQuestion {
  id: string;
  question_type: string;
  prompt: string;
  marking_scheme: string | null;
  ai_grading_guidance: string | null;
  max_marks: number;
  options: any;
  config: any;
}

export interface AISubmission {
  text_answer: string | null;
  selected_option_label: string | null;
  link_url: string | null;
  file_url: string | null;
}

export interface AIMarkResult {
  marksAwarded: number;
  feedback: string;
  markedBy: 'ai' | 'teacher';
}

export async function markSubmission(
  q: AIQuestion,
  s: AISubmission
): Promise<AIMarkResult | null> {
  try {
    switch (q.question_type) {
      case 'multiple_choice':
        return markMultipleChoice(q, s);
      case 'short':
      case 'long':
      case 'code':
        return await markText(q, s);
      case 'scratch_link':
        return await markScratchLink(q, s);
      case 'makecode_link':
        return await markMakeCodeLink(q, s);
      case 'google_sites_link':
        return await markGoogleSiteLink(q, s);
      case 'screenshot':
        return await markScreenshot(q, s);
      case 'project':
        return await markProject(q, s);
      case 'presentation':
        return await markPresentation(q, s);
      case 'video_question':
        return await markVideoQuestion(q, s);
      case 'python_task':
        return await markCodeProject(q, s, 'python');
      case 'html_task':
        return await markCodeProject(q, s, 'html');
      case 'sql_task':
        return await markSqlTask(q, s);
      case 'database_task':
        return await markDatabaseTask(q, s);
      default:
        return null;
    }
  } catch (err) {
    console.error('[classwork-ai] mark failed:', err);
    return null;
  }
}

/* ---------- 1. Multiple choice (deterministic) ---------- */

function markMultipleChoice(q: AIQuestion, s: AISubmission): AIMarkResult | null {
  const options = Array.isArray(q.options) ? q.options : null;
  if (!options || !s.selected_option_label) return null;
  const picked = options.find((o: any) => String(o.label) === String(s.selected_option_label));
  if (!picked) {
    return {
      marksAwarded: 0,
      feedback: 'No matching option selected.',
      markedBy: 'ai',
    };
  }
  if (picked.isCorrect) {
    return {
      marksAwarded: q.max_marks,
      feedback: `Correct — ${picked.text || picked.label} is the right answer.`,
      markedBy: 'ai',
    };
  }
  const correct = options.find((o: any) => o.isCorrect);
  return {
    marksAwarded: 0,
    feedback: correct
      ? `Not quite — the correct answer is ${correct.label}: ${correct.text}.`
      : 'That isn\u2019t the correct option.',
    markedBy: 'ai',
  };
}

/* ---------- 2. Free-text answers ---------- */

async function markText(q: AIQuestion, s: AISubmission): Promise<AIMarkResult | null> {
  if (!s.text_answer || !gemini) return null;
  const prompt = buildTextPrompt(q, s.text_answer);
  return await callGeminiForMark(prompt, q.max_marks);
}

function buildTextPrompt(q: AIQuestion, answer: string): string {
  return [
    `You are a Scottish secondary school Computing Science teacher marking a student's classwork answer.`,
    `Question (worth ${q.max_marks} mark${q.max_marks === 1 ? '' : 's'}):`,
    q.prompt,
    '',
    q.marking_scheme ? `Marking scheme:\n${q.marking_scheme}` : '',
    q.ai_grading_guidance ? `Additional guidance:\n${q.ai_grading_guidance}` : '',
    '',
    `Student's answer:\n"""\n${answer}\n"""`,
    '',
    `Award a whole number of marks from 0 to ${q.max_marks} and write 1-2 sentences of constructive feedback aimed directly at the student. Be encouraging but accurate.`,
    `Return ONLY a JSON object: {"marks": <number>, "feedback": "<string>"}.`,
  ].filter(Boolean).join('\n');
}

async function callGeminiForMark(prompt: string, maxMarks: number): Promise<AIMarkResult | null> {
  if (!gemini) return null;
  try {
    const resp = await gemini.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const txt = resp.text || '';
    const parsed = safeParseJson(txt);
    if (!parsed) return null;
    let marks = Number(parsed.marks);
    if (!Number.isFinite(marks)) marks = 0;
    marks = Math.max(0, Math.min(maxMarks, Math.round(marks)));
    const feedback = String(parsed.feedback || '').trim() || 'Marked by AI.';
    return { marksAwarded: marks, feedback, markedBy: 'ai' };
  } catch (err) {
    console.error('[classwork-ai] gemini call failed:', err);
    return null;
  }
}

function safeParseJson(text: string): any {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  // Try to extract the first {...} block.
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch {}
  }
  return null;
}

/* ---------- 3. Scratch ---------- */

interface ScratchMeta {
  id: string;
  title: string;
  description: string;
  instructions: string;
  author: string;
}

function extractScratchId(url: string): string | null {
  const m = url.match(/scratch\.mit\.edu\/projects\/(\d+)/);
  return m ? m[1] : null;
}

async function fetchScratchMeta(id: string): Promise<ScratchMeta | null> {
  try {
    const r = await fetch(`https://api.scratch.mit.edu/projects/${id}`, {
      headers: { 'User-Agent': 'BHS-Classwork/1.0' },
    });
    if (!r.ok) return null;
    const data: any = await r.json();
    return {
      id: String(data.id ?? id),
      title: String(data.title ?? ''),
      description: String(data.description ?? ''),
      instructions: String(data.instructions ?? ''),
      author: String(data.author?.username ?? ''),
    };
  } catch {
    return null;
  }
}

async function markScratchLink(q: AIQuestion, s: AISubmission): Promise<AIMarkResult | null> {
  if (!s.link_url || !gemini) return null;
  const id = extractScratchId(s.link_url);
  if (!id) {
    return {
      marksAwarded: 0,
      feedback: 'That doesn\u2019t look like a Scratch project link (expected scratch.mit.edu/projects/…).',
      markedBy: 'ai',
    };
  }
  const meta = await fetchScratchMeta(id);
  if (!meta) {
    return {
      marksAwarded: 0,
      feedback: 'Couldn\u2019t open that Scratch project. Make sure it has been shared (not just saved).',
      markedBy: 'ai',
    };
  }
  const prompt = [
    `You are marking a student's Scratch project for a Scottish Computing Science classwork question.`,
    `Question (worth ${q.max_marks} mark${q.max_marks === 1 ? '' : 's'}):`,
    q.prompt,
    q.marking_scheme ? `\nMarking scheme:\n${q.marking_scheme}` : '',
    q.ai_grading_guidance ? `\nAdditional guidance:\n${q.ai_grading_guidance}` : '',
    '',
    `The student linked to this Scratch project:`,
    `Title: ${meta.title}`,
    `Author: ${meta.author}`,
    `Instructions: ${meta.instructions || '(none)'}`,
    `Description: ${meta.description || '(none)'}`,
    `URL: ${s.link_url}`,
    '',
    `Award a whole number of marks from 0 to ${q.max_marks} based on what you can tell from the project's title, instructions and description. If you can't tell whether a requirement is met, say so honestly. Write 1-2 sentences of constructive feedback aimed at the student.`,
    `Return ONLY JSON: {"marks": <number>, "feedback": "<string>"}.`,
  ].filter(Boolean).join('\n');
  return await callGeminiForMark(prompt, q.max_marks);
}

/* ---------- 4. MakeCode ---------- */

function extractMakeCodeId(url: string): string | null {
  // MakeCode share URLs look like https://makecode.com/_abcDEF1234 or
  // https://arcade.makecode.com/abcDEF1234
  const m = url.match(/makecode\.com\/(?:_)?([A-Za-z0-9]{8,20})/);
  return m ? m[1] : null;
}

async function fetchMakeCodeProject(id: string): Promise<{ files: Record<string, string> } | null> {
  try {
    const r = await fetch(`https://makecode.com/api/${id}/text`, {
      headers: { 'User-Agent': 'BHS-Classwork/1.0' },
    });
    if (!r.ok) return null;
    const data: any = await r.json();
    if (data && typeof data === 'object') return { files: data };
    return null;
  } catch {
    return null;
  }
}

async function markMakeCodeLink(q: AIQuestion, s: AISubmission): Promise<AIMarkResult | null> {
  if (!s.link_url || !gemini) return null;
  const id = extractMakeCodeId(s.link_url);
  if (!id) {
    return {
      marksAwarded: 0,
      feedback: 'That doesn\u2019t look like a MakeCode share link.',
      markedBy: 'ai',
    };
  }
  const proj = await fetchMakeCodeProject(id);
  if (!proj) {
    return {
      marksAwarded: 0,
      feedback: 'Couldn\u2019t open that MakeCode project. Make sure the link is a published share link.',
      markedBy: 'ai',
    };
  }
  // Only send the most useful files to Gemini (cap size).
  const interesting = ['main.ts', 'main.blocks', 'main.py', 'pxt.json'];
  const snippets = interesting
    .filter((name) => proj.files[name])
    .map((name) => `--- ${name} ---\n${proj.files[name].slice(0, 4000)}`);
  const prompt = [
    `You are marking a student's MakeCode project for a Scottish Computing Science classwork question.`,
    `Question (worth ${q.max_marks} mark${q.max_marks === 1 ? '' : 's'}):`,
    q.prompt,
    q.marking_scheme ? `\nMarking scheme:\n${q.marking_scheme}` : '',
    q.ai_grading_guidance ? `\nAdditional guidance:\n${q.ai_grading_guidance}` : '',
    '',
    `Project URL: ${s.link_url}`,
    `Project files:`,
    snippets.join('\n\n') || '(no recognised source files found)',
    '',
    `Award a whole number from 0 to ${q.max_marks} marks based on whether the project meets the requirements. Write 1-2 sentences of feedback aimed at the student.`,
    `Return ONLY JSON: {"marks": <number>, "feedback": "<string>"}.`,
  ].filter(Boolean).join('\n');
  return await callGeminiForMark(prompt, q.max_marks);
}

/* ---------- 5. Google Sites ---------- */

async function fetchSiteText(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BHS-Classwork/1.0)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (!r.ok) return null;
    const html = await r.text();
    return extractText(html).slice(0, 8000);
  } catch {
    return null;
  }
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function markGoogleSiteLink(q: AIQuestion, s: AISubmission): Promise<AIMarkResult | null> {
  if (!s.link_url || !gemini) return null;
  if (!/sites\.google\.com/.test(s.link_url)) {
    return {
      marksAwarded: 0,
      feedback: 'That doesn\u2019t look like a Google Sites link (expected sites.google.com/…).',
      markedBy: 'ai',
    };
  }
  const text = await fetchSiteText(s.link_url);
  if (!text) {
    return {
      marksAwarded: 0,
      feedback: 'Couldn\u2019t open that Google Sites page. Make sure it has been published and is set to "anyone with the link can view".',
      markedBy: 'ai',
    };
  }
  const prompt = [
    `You are marking a student's Google Sites webpage for a Scottish Computing Science classwork question.`,
    `Question (worth ${q.max_marks} mark${q.max_marks === 1 ? '' : 's'}):`,
    q.prompt,
    q.marking_scheme ? `\nMarking scheme:\n${q.marking_scheme}` : '',
    q.ai_grading_guidance ? `\nAdditional guidance:\n${q.ai_grading_guidance}` : '',
    '',
    `URL: ${s.link_url}`,
    `Page text content (extracted):\n"""\n${text}\n"""`,
    '',
    `Award a whole number from 0 to ${q.max_marks} marks based on whether the webpage meets the requirements. Write 1-2 sentences of feedback aimed at the student.`,
    `Return ONLY JSON: {"marks": <number>, "feedback": "<string>"}.`,
  ].filter(Boolean).join('\n');
  return await callGeminiForMark(prompt, q.max_marks);
}

/* ---------- 6. Screenshot (image) ---------- */

async function markScreenshot(q: AIQuestion, s: AISubmission): Promise<AIMarkResult | null> {
  if (!s.file_url || !gemini) return null;
  // Fetch the image and pass it to Gemini Vision as inline data.
  let mimeType = 'image/png';
  let base64 = '';
  try {
    const r = await fetch(s.file_url);
    if (!r.ok) return null;
    mimeType = r.headers.get('content-type') || mimeType;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 4 * 1024 * 1024) return null; // 4 MB cap
    base64 = buf.toString('base64');
  } catch {
    return null;
  }
  const promptText = [
    `You are marking a screenshot a student has submitted for a Scottish Computing Science classwork question.`,
    `Question (worth ${q.max_marks} mark${q.max_marks === 1 ? '' : 's'}):`,
    q.prompt,
    q.marking_scheme ? `\nMarking scheme:\n${q.marking_scheme}` : '',
    q.ai_grading_guidance ? `\nAdditional guidance:\n${q.ai_grading_guidance}` : '',
    '',
    `Look at the attached screenshot and decide whether it satisfies the question. Award a whole number from 0 to ${q.max_marks} marks and write 1-2 sentences of feedback aimed at the student.`,
    `Return ONLY JSON: {"marks": <number>, "feedback": "<string>"}.`,
  ].filter(Boolean).join('\n');
  try {
    const resp = await gemini.models.generateContent({
      model: MODEL,
      contents: [
        { text: promptText },
        { inlineData: { data: base64, mimeType } },
      ] as any,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const parsed = safeParseJson(resp.text || '');
    if (!parsed) return null;
    let marks = Math.max(0, Math.min(q.max_marks, Math.round(Number(parsed.marks) || 0)));
    return {
      marksAwarded: marks,
      feedback: String(parsed.feedback || '').trim() || 'Marked by AI.',
      markedBy: 'ai',
    };
  } catch (err) {
    console.error('[classwork-ai] screenshot mark failed:', err);
    return null;
  }
}

/* ---------- 7. Long-form project (link or file) ---------- */

async function markProject(q: AIQuestion, s: AISubmission): Promise<AIMarkResult | null> {
  if (s.link_url) {
    if (extractScratchId(s.link_url)) return await markScratchLink(q, s);
    if (extractMakeCodeId(s.link_url)) return await markMakeCodeLink(q, s);
    if (/sites\.google\.com/.test(s.link_url)) return await markGoogleSiteLink(q, s);
    // Fall back to fetching the page text.
    return await markGenericLink(q, s);
  }
  // File-based project marking lands when uploads ship.
  return null;
}

/* ---------- 9. Watch a video and answer ---------- */

// The teacher attaches a YouTube link or an .mp4/.webm file to the question
// (stored in q.config.video). The student watches the video in the SPA and
// submits a written answer. The AI marks the *written answer* against the
// question and marking scheme — it does not watch the video itself, and the
// prompt makes that limitation explicit.
async function markVideoQuestion(q: AIQuestion, s: AISubmission): Promise<AIMarkResult | null> {
  if (!s.text_answer || !gemini) return null;
  const cfg = q.config && typeof q.config === 'object' ? q.config : {};
  const video = cfg.video && typeof cfg.video === 'object' ? cfg.video : {};
  const videoKind = video.kind === 'mp4' ? 'an uploaded video clip' : 'a YouTube video';
  const prompt = [
    `You are a Scottish secondary school Computing Science teacher marking a pupil's written answer to a question about ${videoKind}.`,
    `You have NOT watched the video yourself, so you must judge the answer purely against the question and marking scheme. If the answer is plausible and addresses the marking points, award marks; if it clearly contradicts the question or marking scheme, deduct marks. Be honest in your feedback that you couldn't watch the video.`,
    '',
    `Question (worth ${q.max_marks} mark${q.max_marks === 1 ? '' : 's'}):`,
    q.prompt,
    q.marking_scheme ? `\nMarking scheme:\n${q.marking_scheme}` : '',
    q.ai_grading_guidance ? `\nAdditional guidance:\n${q.ai_grading_guidance}` : '',
    '',
    `Pupil's written answer:\n"""\n${s.text_answer}\n"""`,
    '',
    `Award a whole number from 0 to ${q.max_marks} and write 2-3 sentences of constructive feedback aimed at the pupil.`,
    `Return ONLY a JSON object: {"marks": <number>, "feedback": "<string>"}.`,
  ].filter(Boolean).join('\n');
  return await callGeminiForMark(prompt, q.max_marks);
}

/* ---------- 8. Presentation (.pptx) ---------- */

interface PptxSlide {
  index: number;
  text: string;
  notes: string;
  imageCount: number;
}

interface PptxSummary {
  slideCount: number;
  imageCount: number;
  slides: PptxSlide[];
  warnings: string[];
}

// Extract every <a:t>...</a:t> text run from a slide XML blob.
function extractTextRuns(xml: string): string {
  const out: string[] = [];
  const re = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const t = m[1]
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
    if (t.trim()) out.push(t);
  }
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

// Resolve /classwork-uploads/<file> to an absolute path on disk.
function resolveUploadPath(fileUrl: string): string | null {
  // Accept full URLs too (strip origin).
  let p = fileUrl;
  try { const u = new URL(fileUrl); p = u.pathname; } catch { /* relative */ }
  if (!p.startsWith('/classwork-uploads/')) return null;
  const base = path.join(process.cwd(), 'public', 'classwork-uploads');
  const name = path.basename(p);
  return path.join(base, name);
}

async function summarisePptx(filePath: string): Promise<PptxSummary | null> {
  try {
    const buf = await fs.readFile(filePath);
    if (buf.length > 25 * 1024 * 1024) {
      return { slideCount: 0, imageCount: 0, slides: [], warnings: ['File too large to analyse (>25 MB).'] };
    }
    const zip = await JSZip.loadAsync(buf);
    const slideKeys = Object.keys(zip.files)
      .filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)\.xml/)![1], 10);
        const nb = parseInt(b.match(/slide(\d+)\.xml/)![1], 10);
        return na - nb;
      });
    const slides: PptxSlide[] = [];
    for (const key of slideKeys) {
      const idx = parseInt(key.match(/slide(\d+)\.xml/)![1], 10);
      const xml = await zip.files[key].async('string');
      const text = extractTextRuns(xml);
      // Count picture references on this slide (p:pic elements).
      const imageCount = (xml.match(/<p:pic[\s>]/g) || []).length;
      // Speaker notes file mirrors the slide number.
      let notes = '';
      const notesKey = `ppt/notesSlides/notesSlide${idx}.xml`;
      if (zip.files[notesKey]) {
        try { notes = extractTextRuns(await zip.files[notesKey].async('string')); } catch {}
      }
      slides.push({ index: idx, text, notes, imageCount });
    }
    // Total embedded media files (images, video posters, etc.) under ppt/media.
    const mediaCount = Object.keys(zip.files).filter((k) => /^ppt\/media\//.test(k)).length;
    return {
      slideCount: slides.length,
      imageCount: mediaCount,
      slides,
      warnings: slides.length ? [] : ['No slides could be read from the file.'],
    };
  } catch (err) {
    console.error('[classwork-ai] pptx parse failed:', err);
    return null;
  }
}

interface RubricRow { label: string; marks: number; }

function getRubric(q: AIQuestion): RubricRow[] {
  const cfg = q.config && typeof q.config === 'object' ? q.config : {};
  const raw = Array.isArray(cfg.rubric) ? cfg.rubric : [];
  const rows: RubricRow[] = raw
    .map((r: any) => ({
      label: String(r?.label ?? '').trim(),
      marks: Math.max(0, Math.round(Number(r?.marks) || 0)),
    }))
    .filter((r: RubricRow) => r.label && r.marks > 0);
  if (rows.length) return rows;
  // Sensible default: one holistic criterion worth the question's max marks.
  return [{ label: 'Overall presentation quality', marks: q.max_marks }];
}

/**
 * Render a .pptx to one PNG per slide using LibreOffice headless + pdftoppm.
 * Returns an array of PNG buffers (in slide order), or null on any failure.
 * Caller is responsible for capping how many slides actually get sent to the
 * model. Conversion happens inside an isolated temp directory which is
 * cleaned up before returning.
 */
async function renderPptxToImages(pptxPath: string, opts: { dpi?: number; maxSlides?: number } = {}): Promise<Buffer[] | null> {
  const dpi = opts.dpi ?? 100;
  const maxSlides = opts.maxSlides ?? 25;
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cw-pptx-'));
  const profile = path.join(tmp, 'lo-profile');
  await fs.mkdir(profile, { recursive: true });
  const run = (cmd: string, args: string[], timeoutMs: number) => new Promise<{ code: number; stderr: string }>((resolve) => {
    const child = spawn(cmd, args, {
      env: { ...process.env, HOME: tmp },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    const t = setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, timeoutMs);
    child.on('exit', (code) => { clearTimeout(t); resolve({ code: code ?? 1, stderr }); });
    child.on('error', () => { clearTimeout(t); resolve({ code: 1, stderr: 'spawn error' }); });
  });
  try {
    const pdfRes = await run('soffice', [
      '--headless', '--norestore', '--nolockcheck', '--nodefault', '--nofirststartwizard',
      `-env:UserInstallation=file://${profile}`,
      '--convert-to', 'pdf', '--outdir', tmp, pptxPath,
    ], 90_000);
    if (pdfRes.code !== 0) {
      console.error('[classwork-ai] soffice failed:', pdfRes.stderr.slice(0, 400));
      return null;
    }
    const base = path.basename(pptxPath).replace(/\.pptx$/i, '.pdf');
    const pdfPath = path.join(tmp, base);
    try { await fs.access(pdfPath); } catch {
      console.error('[classwork-ai] expected pdf not found:', pdfPath);
      return null;
    }
    const ppmRes = await run('pdftoppm', [
      '-png', '-r', String(dpi), '-l', String(maxSlides),
      pdfPath, path.join(tmp, 'slide'),
    ], 60_000);
    if (ppmRes.code !== 0) {
      console.error('[classwork-ai] pdftoppm failed:', ppmRes.stderr.slice(0, 400));
      return null;
    }
    const files = (await fs.readdir(tmp))
      .filter((n) => /^slide-\d+\.png$/i.test(n))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide-(\d+)/i)![1], 10);
        const nb = parseInt(b.match(/slide-(\d+)/i)![1], 10);
        return na - nb;
      });
    const out: Buffer[] = [];
    for (const f of files) {
      out.push(await fs.readFile(path.join(tmp, f)));
    }
    return out;
  } catch (err) {
    console.error('[classwork-ai] renderPptxToImages error:', err);
    return null;
  } finally {
    fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * True visual marking: render every slide to a PNG and pass them all to
 * Gemini Vision in one multimodal request alongside the text/notes summary.
 * Falls back to null on any failure so the caller can use the text-only path.
 */
async function markPresentationVisual(
  q: AIQuestion,
  pptxPath: string,
  summary: PptxSummary,
  rubric: RubricRow[],
  cappedTotal: number,
  starter: { summary: PptxSummary; images: Buffer[] } | null,
): Promise<AIMarkResult | null> {
  if (!gemini) return null;
  const SLIDE_LIMIT = 25;
  const images = await renderPptxToImages(pptxPath, { dpi: 100, maxSlides: SLIDE_LIMIT });
  if (!images || images.length === 0) return null;

  const trimSlide = (t: string, max = 400) => t.length > max ? t.slice(0, max) + '…' : t;
  const slidesBlock = summary.slides.slice(0, images.length).map((sl) => {
    const parts = [`Pupil slide ${sl.index}:`,
      sl.text ? `  Text: ${trimSlide(sl.text)}` : '  Text: (no text)'];
    if (sl.notes) parts.push(`  Speaker notes: ${trimSlide(sl.notes, 200)}`);
    return parts.join('\n');
  }).join('\n');
  const omitted = Math.max(0, summary.slideCount - images.length);
  const rubricBlock = rubric
    .map((r, i) => `  ${i + 1}. ${r.label} — up to ${r.marks} mark${r.marks === 1 ? '' : 's'}`)
    .join('\n');

  const starterSlidesBlock = starter
    ? starter.summary.slides.slice(0, starter.images.length).map((sl) => {
        const parts = [`Starter slide ${sl.index}:`,
          sl.text ? `  Text: ${trimSlide(sl.text)}` : '  Text: (no text)'];
        if (sl.notes) parts.push(`  Speaker notes: ${trimSlide(sl.notes, 200)}`);
        return parts.join('\n');
      }).join('\n')
    : '';

  const promptText = [
    `You are marking a Scottish secondary school pupil's PowerPoint presentation for a Computing Science task.`,
    `You can SEE the slides — each slide has been rendered as an image and attached in order. Use the visual layout (titles, structure, images, diagrams, colour, balance, neatness) AS WELL AS the text/notes shown below to mark fairly.`,
    omitted > 0 ? `Note: only the first ${images.length} of ${summary.slideCount} slides were rendered; mark on what you can see and mention the missing slides briefly.` : '',
    starter
      ? `IMPORTANT: The pupil started from a STARTER deck the teacher provided. The first ${starter.images.length} image(s) attached are the STARTER slides — these are NOT the pupil's work, and you must NOT credit any content (text, layout, images, design) that already appears in the starter. The remaining ${images.length} image(s) are the PUPIL'S submission, in order. Mark only the additions, changes and improvements the pupil has made on top of the starter, judged against the success criteria. If the pupil has made very few changes, say so honestly and award accordingly.`
      : '',
    '',
    `Question (worth up to ${q.max_marks} mark${q.max_marks === 1 ? '' : 's'} in total):`,
    q.prompt,
    q.marking_scheme ? `\nGeneral marking scheme (success criteria):\n${q.marking_scheme}` : '',
    q.ai_grading_guidance ? `\nAdditional guidance:\n${q.ai_grading_guidance}` : '',
    '',
    `Rubric (mark each criterion separately, then sum — total cannot exceed ${cappedTotal}):`,
    rubricBlock,
    '',
    starter ? `Starter deck — text/notes (already provided to the pupil; ignore for credit):\n${starterSlidesBlock}\n` : '',
    `Pupil's deck — text and speaker notes (for cross-reference; the images are authoritative for layout/visuals):`,
    slidesBlock,
    '',
    `Be encouraging but accurate. In your feedback, list a brief breakdown by criterion and one concrete improvement.`,
    `Return ONLY a JSON object: {"marks": <integer total>, "feedback": "<string>"}.`,
  ].filter(Boolean).join('\n');

  const parts: any[] = [{ text: promptText }];
  if (starter) {
    parts.push({ text: '--- STARTER SLIDES (do not credit, ignore for marks) ---' });
    for (const buf of starter.images) {
      parts.push({ inlineData: { data: buf.toString('base64'), mimeType: 'image/png' } });
    }
    parts.push({ text: '--- PUPIL SUBMISSION (mark only this, on top of the starter above) ---' });
  }
  for (const buf of images) {
    parts.push({ inlineData: { data: buf.toString('base64'), mimeType: 'image/png' } });
  }
  try {
    const resp = await gemini.models.generateContent({
      model: MODEL,
      contents: parts as any,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const parsed = safeParseJson(resp.text || '');
    if (!parsed) return null;
    const marks = Math.max(0, Math.min(cappedTotal, Math.round(Number(parsed.marks) || 0)));
    return {
      marksAwarded: marks,
      feedback: String(parsed.feedback || '').trim() || 'Marked by AI (visual).',
      markedBy: 'ai',
    };
  } catch (err) {
    console.error('[classwork-ai] visual presentation mark failed:', err);
    return null;
  }
}

async function markPresentation(q: AIQuestion, s: AISubmission): Promise<AIMarkResult | null> {
  if (!s.file_url || !gemini) return null;
  const onDisk = resolveUploadPath(s.file_url);
  if (!onDisk) {
    return { marksAwarded: 0, feedback: 'The uploaded file couldn\u2019t be located on the server.', markedBy: 'ai' };
  }
  // Quick sanity check on the extension.
  if (!/\.pptx$/i.test(onDisk)) {
    return {
      marksAwarded: 0,
      feedback: 'Please upload a PowerPoint (.pptx) file. Other formats can\u2019t be auto-marked.',
      markedBy: 'ai',
    };
  }
  const summary = await summarisePptx(onDisk);
  if (!summary || summary.slideCount === 0) {
    return {
      marksAwarded: 0,
      feedback: 'I couldn\u2019t read any slides out of that .pptx file. Please re-export it from PowerPoint or Google Slides and try again.',
      markedBy: 'ai',
    };
  }
  const rubricRows = getRubric(q);
  const rubricRowsTotal = rubricRows.reduce((a, r) => a + r.marks, 0);
  const visualCappedTotal = Math.min(q.max_marks, rubricRowsTotal);
  // Optional starter file: if the teacher attached a baseline .pptx, summarise
  // it (and render its slides to images for the visual path) so the marker can
  // tell the AI what was already there and credit only the pupil's additions.
  const starterUrl = (q.config && typeof q.config === 'object' && typeof (q.config as any).starterFileUrl === 'string')
    ? (q.config as any).starterFileUrl as string
    : '';
  let starterSummary: PptxSummary | null = null;
  let starterImages: Buffer[] | null = null;
  if (starterUrl) {
    const starterPath = resolveUploadPath(starterUrl);
    if (starterPath && /\.pptx$/i.test(starterPath)) {
      try {
        starterSummary = await summarisePptx(starterPath);
      } catch { starterSummary = null; }
    }
    // Visual rendering of the starter is only useful if we're also doing the
    // visual path; we render it lazily below.
    void starterPath;
  }
  // Visual marking is opt-in per question (config.visualMarking === true).
  // It renders every slide to a PNG via LibreOffice headless + pdftoppm and
  // hands them to Gemini Vision so the model can judge layout, colour and
  // images, not just the raw text. On any failure we silently fall through
  // to the text-only path below so the pupil still gets a mark.
  const wantVisual = !!(q.config && typeof q.config === 'object' && (q.config as any).visualMarking === true);
  if (wantVisual) {
    let starterPair: { summary: PptxSummary; images: Buffer[] } | null = null;
    if (starterUrl && starterSummary) {
      const starterPath = resolveUploadPath(starterUrl);
      if (starterPath) {
        starterImages = await renderPptxToImages(starterPath, { dpi: 100, maxSlides: 25 });
        if (starterImages && starterImages.length) {
          starterPair = { summary: starterSummary, images: starterImages };
        }
      }
    }
    const visual = await markPresentationVisual(q, onDisk, summary, rubricRows, visualCappedTotal, starterPair);
    if (visual) return visual;
  }
  // Cap text per slide so very long decks still fit in the prompt.
  const trimSlide = (t: string, max = 600) => t.length > max ? t.slice(0, max) + '…' : t;
  const slidesBlock = summary.slides.map((sl) => {
    const parts = [`Slide ${sl.index}:`, sl.text ? `  Text: ${trimSlide(sl.text)}` : '  Text: (no text)'];
    if (sl.imageCount > 0) parts.push(`  Images on slide: ${sl.imageCount}`);
    if (sl.notes) parts.push(`  Speaker notes: ${trimSlide(sl.notes, 300)}`);
    return parts.join('\n');
  }).join('\n');

  const rubric = getRubric(q);
  const rubricBlock = rubric
    .map((r, i) => `  ${i + 1}. ${r.label} — up to ${r.marks} mark${r.marks === 1 ? '' : 's'}`)
    .join('\n');
  const totalRubricMarks = rubric.reduce((a, r) => a + r.marks, 0);
  const cappedTotal = Math.min(q.max_marks, totalRubricMarks);

  const trimStarterSlide = (t: string, max = 400) => t.length > max ? t.slice(0, max) + '…' : t;
  const starterTextBlock = starterSummary
    ? starterSummary.slides.map((sl) => {
        const parts = [`Starter slide ${sl.index}:`, sl.text ? `  Text: ${trimStarterSlide(sl.text)}` : '  Text: (no text)'];
        if (sl.notes) parts.push(`  Speaker notes: ${trimStarterSlide(sl.notes, 200)}`);
        return parts.join('\n');
      }).join('\n')
    : '';

  const prompt = [
    `You are marking a Scottish secondary school pupil's PowerPoint presentation for a Computing Science task.`,
    `You cannot see the visual layout, fonts or colours of the slides — only the text on each slide, the number of embedded images, and any speaker notes. Be honest about what you can and can\u2019t judge.`,
    starterSummary
      ? `IMPORTANT: The pupil started from a STARTER deck the teacher provided. Below you'll see two decks — first the STARTER (already given to the pupil; do NOT credit any text or content that appears in it), then the PUPIL'S submission. Mark only the additions and changes the pupil has made on top of the starter, judged against the success criteria. If the pupil has made very few changes, say so honestly and award accordingly.`
      : '',
    '',
    `Question (worth up to ${q.max_marks} mark${q.max_marks === 1 ? '' : 's'} in total):`,
    q.prompt,
    q.marking_scheme ? `\nGeneral marking scheme (success criteria):\n${q.marking_scheme}` : '',
    q.ai_grading_guidance ? `\nAdditional guidance:\n${q.ai_grading_guidance}` : '',
    '',
    `Rubric (mark each criterion separately, then sum — total cannot exceed ${cappedTotal}):`,
    rubricBlock,
    '',
    starterSummary
      ? `Starter deck (${starterSummary.slideCount} slide${starterSummary.slideCount === 1 ? '' : 's'}, ${starterSummary.imageCount} embedded media — ignore for credit):\n${starterTextBlock}\n`
      : '',
    `Pupil's deck summary:`,
    `  Total slides: ${summary.slideCount}`,
    `  Total embedded media files: ${summary.imageCount}`,
    '',
    `Pupil's per-slide content:`,
    slidesBlock,
    '',
    `Award marks fairly. Be encouraging but accurate. Explain in 2-4 sentences what worked well and one concrete improvement, and list a brief breakdown by criterion.`,
    `Return ONLY a JSON object of the form:`,
    `{"marks": <integer total>, "feedback": "<string with the breakdown and overall comment>"}`,
  ].filter(Boolean).join('\n');

  return await callGeminiForMark(prompt, Math.min(q.max_marks, cappedTotal));
}

async function markGenericLink(q: AIQuestion, s: AISubmission): Promise<AIMarkResult | null> {
  if (!s.link_url || !gemini) return null;
  const text = await fetchSiteText(s.link_url);
  if (!text) {
    return {
      marksAwarded: 0,
      feedback: 'Couldn\u2019t open that link. Please check it is publicly accessible.',
      markedBy: 'ai',
    };
  }
  const prompt = [
    `You are marking a student's project link for a Scottish Computing Science classwork question.`,
    `Question (worth ${q.max_marks} mark${q.max_marks === 1 ? '' : 's'}):`,
    q.prompt,
    q.marking_scheme ? `\nMarking scheme:\n${q.marking_scheme}` : '',
    q.ai_grading_guidance ? `\nAdditional guidance:\n${q.ai_grading_guidance}` : '',
    '',
    `URL: ${s.link_url}`,
    `Page text:\n"""\n${text}\n"""`,
    '',
    `Award 0-${q.max_marks} marks. Return ONLY JSON: {"marks": <number>, "feedback": "<string>"}.`,
  ].filter(Boolean).join('\n');
  return await callGeminiForMark(prompt, q.max_marks);
}

/* ---------- 10. Code-editor projects (Python / HTML) ---------- */

// The pupil picks one of their saved projects in the SPA. The client fetches
// the full project from /api/code-projects/<kind>/<id> (which it can do because
// it's the pupil's own project and they're signed in) and sends the code as
// `text_answer`. We DO still re-fetch the project here from the database when
// possible, so the AI marks the latest committed version, not whatever was in
// the textarea when they hit submit.
async function markCodeProject(
  q: AIQuestion,
  s: AISubmission,
  kind: 'python' | 'html',
): Promise<AIMarkResult | null> {
  if (!gemini) return null;
  let code = (s.text_answer || '').trim();
  let projectName = '';
  // The client puts "<projectId>" or "<projectId>|<name>" into link_url so we
  // can re-load the latest code server-side.
  if (s.link_url && hasDatabase) {
    const [pid] = String(s.link_url).split('|');
    if (pid) {
      try {
        const r = await pool.query(
          `SELECT name, code FROM code_projects WHERE id = $1 AND kind = $2`,
          [pid, kind],
        );
        if (r.rows[0]) {
          code = String(r.rows[0].code || '').trim();
          projectName = String(r.rows[0].name || '');
        }
      } catch (err) {
        console.error('[classwork-ai] code-project fetch failed:', err);
      }
    }
  }
  if (!code) {
    return {
      marksAwarded: 0,
      feedback: kind === 'python'
        ? 'Your project looks empty. Save some code in the Python editor and submit again.'
        : 'Your project looks empty. Save some HTML/CSS in the editor and submit again.',
      markedBy: 'ai',
    };
  }
  // Hard cap so we don't blow the prompt budget.
  const MAX_CODE = 15_000;
  const truncated = code.length > MAX_CODE;
  const codeForPrompt = truncated ? code.slice(0, MAX_CODE) + '\n… (truncated)' : code;
  const langLabel = kind === 'python' ? 'Python' : 'HTML/CSS (single-file web page)';
  const fence = kind === 'python' ? 'python' : 'html';
  const prompt = [
    `You are a Scottish secondary school Computing Science teacher marking a pupil's ${langLabel} project, written in the BHS in-browser code editor.`,
    projectName ? `Pupil's project name: "${projectName}"` : '',
    truncated ? '(The code was longer than 15 000 characters and has been truncated for marking — judge what you can see and mention this if it matters.)' : '',
    '',
    `Question (worth ${q.max_marks} mark${q.max_marks === 1 ? '' : 's'}):`,
    q.prompt,
    q.marking_scheme ? `\nMarking scheme:\n${q.marking_scheme}` : '',
    q.ai_grading_guidance ? `\nAdditional guidance:\n${q.ai_grading_guidance}` : '',
    '',
    `Pupil's code:`,
    `\`\`\`${fence}`,
    codeForPrompt,
    `\`\`\``,
    '',
    `Mark the code against the question and marking scheme. You CAN see the source but you have NOT run it — judge correctness by reading. Be encouraging but accurate. Write 2-4 sentences of feedback for the pupil and one concrete next step.`,
    `Return ONLY a JSON object: {"marks": <integer>, "feedback": "<string>"}.`,
  ].filter(Boolean).join('\n');
  return await callGeminiForMark(prompt, q.max_marks);
}

/* ---------- 11. Data Sculptor SQL task ---------- */

// The teacher attaches a Data Sculptor database (its embed/share URL is stored
// on the question as config.databaseUrl). Pupils open it in a new tab, write
// and run their query in DS, then paste the SQL back into the submission box.
// We delegate the actual marking to the SAME helper used by the Data Sculptor
// embed (`/api/ds/grade-sandbox`) so the prompt, behaviour and any future
// improvements stay in lock-step with the rest of the site.
async function markSqlTask(q: AIQuestion, s: AISubmission): Promise<AIMarkResult | null> {
  if (!s.text_answer || !gemini) return null;
  const sql = s.text_answer.trim();
  if (!sql) return null;
  const taskDescription = [
    q.prompt,
    q.marking_scheme ? `\nMarking scheme:\n${q.marking_scheme}` : '',
    q.ai_grading_guidance ? `\nAdditional guidance:\n${q.ai_grading_guidance}` : '',
  ].filter(Boolean).join('\n');
  try {
    const result = await gradeSandboxSql({
      sql,
      taskDescription,
      maxMark: q.max_marks,
    });
    return {
      marksAwarded: result.mark ?? 0,
      feedback: result.feedback || 'No feedback returned.',
      markedBy: 'ai',
    };
  } catch (err) {
    console.error('[classwork-ai] sql_task delegation failed:', err);
    return null;
  }
}

/* ---------- 12. Data Sculptor database design / population task ---------- */

// The teacher attaches a Data Sculptor embed (its token is stored on the
// question as config.embedToken). Pupils open the embed in a new tab — the
// existing DS embed flow forks them a personal sandbox copy of the teacher's
// template database, keyed by (token, sessionKey). When the pupil hits Submit
// in classwork, the client passes back "<embedToken>|<sessionKey>" in
// link_url so we can resolve their forked sandbox here and delegate the
// marking to the SAME helper the DS embed uses (`/api/ds/grade-database`),
// which marks each bullet of the task description and applies the schema
// audit + cap. The numeric mark and feedback then flow back into classwork
// analytics like any other AI-marked submission.
async function markDatabaseTask(q: AIQuestion, s: AISubmission): Promise<AIMarkResult | null> {
  if (!s.link_url || !hasDatabase) return null;
  const [embedToken, sessionKey] = String(s.link_url).split('|');
  if (!embedToken || !sessionKey) return null;
  let sandboxDatabaseId: number | null = null;
  try {
    const r = await pool.query(
      `SELECT sandbox_database_id FROM ds_student_sessions WHERE token = $1 AND session_key = $2`,
      [embedToken, sessionKey],
    );
    if (r.rows[0]) sandboxDatabaseId = Number(r.rows[0].sandbox_database_id);
  } catch (err) {
    console.error('[classwork-ai] database_task session lookup failed:', err);
    return null;
  }
  if (!sandboxDatabaseId) {
    return {
      marksAwarded: 0,
      feedback: 'We couldn\u2019t find your database. Please open the database first, do your work in Data Sculptor, then come back and submit again.',
      markedBy: 'ai',
    };
  }
  const taskDescription = [
    q.prompt,
    q.marking_scheme ? `\nMarking scheme:\n${q.marking_scheme}` : '',
    q.ai_grading_guidance ? `\nAdditional guidance:\n${q.ai_grading_guidance}` : '',
  ].filter(Boolean).join('\n');
  try {
    const result = await gradeDatabaseStructure({
      sandboxDatabaseId,
      taskDescription,
    });
    return {
      marksAwarded: result.mark ?? 0,
      feedback: result.feedback || 'No feedback returned.',
      markedBy: 'ai',
    };
  } catch (err) {
    console.error('[classwork-ai] database_task delegation failed:', err);
    return null;
  }
}
