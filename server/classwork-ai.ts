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

  const prompt = [
    `You are marking a Scottish secondary school pupil's PowerPoint presentation for a Computing Science task.`,
    `You cannot see the visual layout, fonts or colours of the slides — only the text on each slide, the number of embedded images, and any speaker notes. Be honest about what you can and can\u2019t judge.`,
    '',
    `Question (worth up to ${q.max_marks} mark${q.max_marks === 1 ? '' : 's'} in total):`,
    q.prompt,
    q.marking_scheme ? `\nGeneral marking scheme:\n${q.marking_scheme}` : '',
    q.ai_grading_guidance ? `\nAdditional guidance:\n${q.ai_grading_guidance}` : '',
    '',
    `Rubric (mark each criterion separately, then sum — total cannot exceed ${cappedTotal}):`,
    rubricBlock,
    '',
    `Deck summary:`,
    `  Total slides: ${summary.slideCount}`,
    `  Total embedded media files: ${summary.imageCount}`,
    '',
    `Per-slide content:`,
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
