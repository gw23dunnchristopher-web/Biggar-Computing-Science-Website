import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Link, useRoute } from 'wouter';
import Shell from '@/components/Shell';
import Modal, { modalPrimaryBtn, modalSecondaryBtn } from '@/components/Modal';
import RichTextEditor from '@/components/RichTextEditor';
import PromptText, { parsePromptImageAlt, type PromptImageAlign } from '@/components/PromptText';
import { api, getCurrentRole } from '@/lib/api';
import {
  HangmanPupilUI, HangmanEditor,
  SpeedRoundPupilUI, SpeedRoundEditor,
  OrderingPupilUI, OrderingEditor,
  CaesarPupilUI, CaesarEditor,
  SpotPhishPupilUI, SpotPhishEditor,
  BinaryHexPupilUI, BinaryHexEditor,
  BitOpsPupilUI, BitOpsEditor,
  CodeTracerPupilUI, CodeTracerEditor,
  FlowchartPupilUI, FlowchartEditor,
  SortingRacePupilUI, SortingRaceEditor,
  ConvertRelayPupilUI, ConvertRelayEditor,
  UrlAnatomyPupilUI, UrlAnatomyEditor,
  TruthTablePupilUI, TruthTableEditor,
  FieldTypeSortPupilUI, FieldTypeSortEditor,
  IoSortPupilUI, IoSortEditor,
  HtmlMatchPupilUI, HtmlMatchEditor,
  PasswordForgePupilUI, PasswordForgeEditor,
  PrivacyRadarPupilUI, PrivacyRadarEditor,
  ValidationRulesPupilUI, ValidationRulesEditor,
  FindDuplicatePupilUI, FindDuplicateEditor,
  BinSearchPupilUI, BinSearchEditor,
  BoxModelPupilUI, BoxModelEditor,
  FriendOrFakePupilUI, FriendOrFakeEditor,
  DmDangerPupilUI, DmDangerEditor,
  UpstanderPupilUI, UpstanderEditor,
  MalwareTriagePupilUI, MalwareTriageEditor,
  TwoFactorEscapePupilUI, TwoFactorEscapeEditor,
  A11yAuditPupilUI, A11yAuditEditor,
  FetchExecutePupilUI, FetchExecuteEditor,
  ScreenTimePupilUI, ScreenTimeEditor,
  FootprintTrailPupilUI, FootprintTrailEditor,
  SocialEngineerPupilUI, SocialEngineerEditor,
  CipherQuestPupilUI, CipherQuestEditor,
  NormaliseItPupilUI, NormaliseItEditor,
  SubnetCalcPupilUI, SubnetCalcEditor,
  PhishInboxPupilUI, PhishInboxEditor,
  BuildPcPupilUI, BuildPcEditor,
  OsSchedPupilUI, OsSchedEditor,
  QueryVisualPupilUI, QueryVisualEditor,
  SchemaArchPupilUI, SchemaArchEditor,
  TagSoupRepairPupilUI, TagSoupRepairEditor,
  SelectorGolfPupilUI, SelectorGolfEditor,
  CssSlidersPupilUI, CssSlidersEditor,
  MindmapPupilUI, MindmapEditor,
  GameReview,
} from './lesson-games';

interface LessonInfo {
  id: string;
  title: string;
  learning_intentions: string | null;
  success_criteria: string | null;
  is_published: boolean;
  is_test?: boolean;
  // Returned by GET /api/classwork/lessons/:id (selected by getLesson()) but
  // previously not declared on the client. Used here to power the "My jotter"
  // link in the lesson header so teachers can demo it to a class.
  course?: string;
  unit_id?: string;
}

interface LessonResource {
  id: string;
  lesson_id: string;
  kind: 'image' | 'document' | 'youtube' | 'link' | 'embed';
  title: string | null;
  url: string;
  order_index: number;
}

interface Question {
  id: string;
  lesson_id: string;
  course: string;
  order_index: number;
  question_type: string;
  prompt: string;
  marking_scheme: string | null;
  ai_grading_guidance: string | null;
  max_marks: number;
  options: any;
  config: any;
  is_extension?: boolean;
  passage_id?: string | null;
  created_at?: string;
}

interface Submission {
  id: string;
  question_id: string;
  student_id?: string;
  student_username?: string | null;
  text_answer: string | null;
  selected_option_label: string | null;
  link_url: string | null;
  file_url: string | null;
  marks_awarded: number | null;
  ai_feedback: string | null;
  marked_by?: 'ai' | 'teacher' | null;
  marked_at?: string | null;
  submitted_at: string;
}

// In-progress, auto-saved answer for one (pupil, question). Mirrors the
// shape of a submission's answer fields so StudentAnswer can rehydrate
// directly without remapping. The server clears the draft as soon as a
// real submission lands, so a draft showing up here always means
// "unsubmitted work I started but didn't finish".
interface Draft {
  question_id: string;
  text_answer: string | null;
  selected_option_label: string | null;
  link_url: string | null;
  file_url: string | null;
  updated_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  // Written answers
  short: 'Short answer',
  long: 'Long answer',
  code: 'Code',
  multiple_choice: 'Multiple choice',
  fill_in_blanks: 'Fill in the blanks',
  table: 'Complete the table',
  labeled_inputs: 'Labelled inputs (multi-field)',
  // File & project uploads
  screenshot: 'Screenshot upload',
  file_upload: 'File upload (text / code)',
  presentation: 'Presentation (.pptx)',
  project: 'Long-form project (URL or file)',
  scratch_link: 'Scratch project link',
  makecode_link: 'MakeCode project link',
  google_sites_link: 'Google Sites link',
  // Embedded tools
  python_task: 'Python project (in-site editor)',
  html_task: 'HTML/CSS project (in-site editor)',
  sql_task: 'SQL task (Data Sculptor)',
  database_task: 'Database task (Data Sculptor sandbox)',
  // Video, reading & file groups
  video_group: 'Video (add questions underneath, or leave standalone)',
  passage: 'Reading passage (add questions underneath)',
  file_task: 'File task (students upload a file, then answer follow-ups)',
  mc_group: 'Multiple choice group (a, b, c… all answered & submitted together)',
  group: 'Question group (any types shown together — replaces passage & video)',
  // Fun activities
  crossword: 'Crossword puzzle',
  word_search: 'Word search',
  matching: 'Matching pairs',
  anagrams: 'Anagrams',
  // Games
  hangman: 'Hangman',
  speed_round: 'Speed round (timed Q&A)',
  ordering: 'Ordering / sequencing',
  caesar_cipher: 'Caesar cipher challenge',
  spot_phish: 'Spot the phish',
  binary_hex: 'Binary / hex blitz',
  bit_ops: 'Bit manipulation puzzle',
  code_tracer: 'Code tracer',
  flowchart_seq: 'Flowchart sequencer',
  sorting_race: 'Sorting race',
  convert_relay: 'Convert-it relay (units & bases)',
  url_anatomy: 'URL anatomy',
  truth_table: 'Truth table builder',
  field_type_sort: 'Field-type sorter',
  io_sort: 'Input / output sorter',
  html_match: 'HTML element matcher',
  password_forge: 'Password forge',
  privacy_radar: 'Privacy radar (risk levels)',
  validation_rules: 'Validation-rule matcher',
  find_duplicate: 'Find the duplicate row',
  bin_search: 'Binary-search trace',
  box_model: 'CSS box model',
  friend_or_fake: 'Friend or fake (profile spotter)',
  dm_danger: 'DM danger (message rating)',
  upstander: 'Be an Upstander (cyberbullying)',
  malware_triage: 'Malware triage',
  '2fa_escape': '2FA escape (auth method picker)',
  a11y_audit: 'Accessibility audit',
  fetch_execute: 'Fetch–decode–execute sorter',
  screen_time: 'Screen-time check',
  footprint_trail: 'Digital footprint trail',
  social_engineer: 'Social-engineering scams',
  cipher_quest: 'Cipher quest',
  normalise_it: 'Normalise it (1NF/2NF/3NF)',
  subnet_calc: 'IP-address classifier',
  phish_inbox: 'Phish-inbox triage',
  build_pc: 'Build-a-PC parts',
  os_sched: 'OS scheduling algorithms',
  query_visual: 'SQL operation identifier',
  schema_arch: 'Schema relationships',
  tag_soup_repair: 'Tag-soup HTML repair',
  selector_golf: 'CSS-selector golf',
  css_sliders: 'CSS-property sliders',
  mindmap: 'Mindmap activity',
  // No answer needed
  info_only: 'Information note (no answer needed)',
  text_only: 'Jotter task (answer in jotter, no digital submission)',
  section_header: 'Section divider',
  // Legacy — still renders for existing questions, not offered for new ones
  video_question: 'Watch a video and answer',
};

// Grouped structure for the type picker — video_question excluded since
// video_group covers the same need (attach 0 or more questions underneath).
const TYPE_GROUPS: { label: string; types: string[] }[] = [
  { label: 'Written answers', types: ['short', 'long', 'code', 'multiple_choice', 'fill_in_blanks', 'table', 'labeled_inputs', 'mc_group'] },
  { label: 'File & project uploads', types: ['screenshot', 'file_upload', 'presentation', 'project', 'scratch_link', 'makecode_link', 'google_sites_link'] },
  { label: 'Embedded tools', types: ['python_task', 'html_task', 'sql_task', 'database_task'] },
  { label: 'Groups (show questions together)', types: ['group', 'video_group', 'passage', 'file_task', 'mc_group'] },
  { label: 'Fun activities', types: ['crossword', 'word_search', 'matching', 'anagrams', 'mindmap'] },
  { label: 'Games · Word & puzzle', types: ['hangman', 'speed_round', 'ordering'] },
  { label: 'Games · Internet Safety', types: ['spot_phish', 'phish_inbox', 'friend_or_fake', 'dm_danger', 'upstander', 'screen_time', 'footprint_trail', 'social_engineer'] },
  { label: 'Games · Cyber Security', types: ['caesar_cipher', 'cipher_quest', 'password_forge', '2fa_escape', 'privacy_radar', 'malware_triage'] },
  { label: 'Games · Databases', types: ['field_type_sort', 'validation_rules', 'find_duplicate', 'normalise_it', 'query_visual', 'schema_arch'] },
  { label: 'Games · Web Development', types: ['url_anatomy', 'html_match', 'tag_soup_repair', 'selector_golf', 'box_model', 'css_sliders', 'a11y_audit'] },
  { label: 'Games · Computer Systems', types: ['binary_hex', 'convert_relay', 'bit_ops', 'truth_table', 'io_sort', 'build_pc', 'fetch_execute', 'os_sched', 'code_tracer', 'flowchart_seq', 'sorting_race', 'bin_search', 'subnet_calc'] },
  { label: 'No answer needed', types: ['info_only', 'text_only', 'section_header'] },
];

// Two-level type picker: group headings on the left, types for the active
// group on the right. Rendered inline (no absolute positioning) so it is
// never clipped by the modal's overflow:auto.
function TypePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const defaultGroup = Math.max(0, TYPE_GROUPS.findIndex((g) => g.types.includes(value)));
  const [open, setOpen]           = useState(false);
  const [activeGroup, setActiveGroup] = useState(defaultGroup);

  // Re-sync the active group whenever the value changes from outside.
  useEffect(() => {
    const idx = TYPE_GROUPS.findIndex((g) => g.types.includes(value));
    if (idx >= 0) setActiveGroup(idx);
  }, [value]);

  const groupLabel = TYPE_GROUPS[activeGroup]?.label || '';
  const typeLabel  = TYPE_LABELS[value] || value;
  const valueGroup = TYPE_GROUPS.findIndex((g) => g.types.includes(value));

  return (
    <div>
      {/* Trigger button — shows current selection, toggles the panel */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: '8px 10px', fontSize: 14, fontWeight: 400,
          border: '1px solid var(--cw-border)', borderRadius: 8, fontFamily: 'inherit',
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', cursor: 'pointer',
          background: 'var(--cw-surface)', textAlign: 'left', gap: 8,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {valueGroup >= 0 && (
            <span style={{ color: 'var(--cw-muted)', fontWeight: 400 }}>
              {TYPE_GROUPS[valueGroup].label}{' › '}
            </span>
          )}
          {typeLabel}
        </span>
        <span style={{ flexShrink: 0, color: 'var(--cw-muted)', fontSize: 12 }}>
          {open ? '▴' : '▾'}
        </span>
      </button>

      {/* Inline split panel — no absolute positioning, never clipped by modal */}
      {open && (
        <div style={{
          display: 'flex', marginTop: 4,
          border: '1px solid var(--cw-border)', borderRadius: 10,
          overflow: 'hidden', fontSize: 13,
          boxShadow: '0 4px 14px rgba(15,23,42,0.10)',
        }}>
          {/* Left column: group headings */}
          <div style={{
            flexShrink: 0, width: 195,
            borderRight: '1px solid var(--cw-border)',
            background: 'var(--cw-surface-soft, var(--cw-surface-muted))',
          }}>
            {TYPE_GROUPS.map((g, i) => (
              <div
                key={g.label}
                onMouseEnter={() => setActiveGroup(i)}
                onClick={() => setActiveGroup(i)}
                style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px', cursor: 'default',
                  fontWeight: activeGroup === i ? 700 : 600,
                  background: activeGroup === i ? 'var(--cw-accent)' : 'transparent',
                  color: activeGroup === i ? '#fff'
                    : valueGroup === i ? 'var(--cw-accent)' : 'var(--cw-ink)',
                  borderLeft: valueGroup === i && activeGroup !== i
                    ? '3px solid var(--cw-accent)' : '3px solid transparent',
                }}
              >
                <span>{g.label}</span>
                <span style={{ opacity: 0.55, fontSize: 11 }}>›</span>
              </div>
            ))}
          </div>

          {/* Right column: types within the active group */}
          <div style={{ flex: 1, minWidth: 0, background: 'var(--cw-surface)' }}>
            {(TYPE_GROUPS[activeGroup]?.types ?? []).map((k) => {
              const isCurrent = value === k;
              return (
                <div
                  key={k}
                  onClick={() => { onChange(k); setOpen(false); }}
                  style={{
                    padding: '9px 14px', cursor: 'pointer',
                    fontWeight: isCurrent ? 600 : 400,
                    background: isCurrent ? '#eff6ff' : 'transparent',
                    color: isCurrent ? '#1d4ed8' : 'var(--cw-ink)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = 'var(--cw-surface-muted)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isCurrent ? '#eff6ff' : 'transparent';
                  }}
                >
                  {isCurrent && <span style={{ fontSize: 10 }}>✓</span>}
                  {TYPE_LABELS[k]}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Lesson() {
  const [, params] = useRoute('/lesson/:id');
  const lessonId = params?.id || '';
  const role = getCurrentRole();
  const [lesson, setLesson] = useState<LessonInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allSubs, setAllSubs] = useState<Submission[]>([]);
  // Question IDs the teacher has unlocked for this student to resubmit.
  const [unlockedQIds, setUnlockedQIds] = useState<Set<string>>(new Set());
  // Teacher view: all active unlock records for the lesson.
  const [teacherUnlocks, setTeacherUnlocks] = useState<{ student_id: string; question_id: string }[]>([]);
  // Pupil-only auto-saved drafts, keyed by question_id for O(1) lookup.
  // Loaded once at lesson open; from then on each StudentAnswer manages
  // its own write-back so we don't need to refetch on every save.
  const [draftsByQuestion, setDraftsByQuestion] = useState<Record<string, Draft>>({});
  // Pre-fetched per-question resources, keyed by question_id. Populated by a
  // single bulk request so that each <QuestionResources> card doesn't have to
  // make its own HTTP call on mount (used to be N+1 — one per question).
  const [resourcesByQuestion, setResourcesByQuestion] = useState<Record<string, LessonResource[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [previewAsStudent, setPreviewAsStudent] = useState(false);
  const previewSessionRef = useRef(0);
  const [previewAnsweredQIds, setPreviewAnsweredQIds] = useState<Set<string>>(new Set());

  // Drag-and-drop reordering state (teacher mode only).
  // We use a ref for the source so it doesn't trigger re-renders mid-drag,
  // and useState for the hover target so the drop-zone indicator updates.
  const dragSrcIdRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Tab-based navigation — one question card at a time in student view.
  const [tabIdx, setTabIdx] = useState(0);

  // Confetti fires once when the lesson is fully answered.
  const confettiFiredRef = useRef(false);

  // Teacher-only: set of group passage IDs whose child questions are collapsed.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  // Per video_group: which child question is currently visible (0-based index).
  const [vgStep, setVgStep] = useState<Record<string, number>>({});
  const toggleGroup = (id: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Edit-notes modal: opens directly from the in-lesson "My Jotter" button so
  // pupils don't have to leave the lesson to jot something into their unit
  // notes. Pupils edit their own per-unit notes; teachers (browsing or
  // previewing the lesson) edit the shared demo notes for the unit.
  const [editing, setEditing] = useState<{ unitId: string; title: string; lessonTitle?: string } | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editSavedAt, setEditSavedAt] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('idle');
  const [editErr, setEditErr] = useState<string | null>(null);
  // Set when the jotter is opened from a specific lesson question; cleared after scroll.
  const [editScrollTarget, setEditScrollTarget] = useState<string | null>(null);

  function notesEndpoint(unitId: string): string {
    return role === 'teacher'
      ? `/api/classwork/units/${encodeURIComponent(unitId)}/teacher-notes`
      : `/api/classwork/units/${encodeURIComponent(unitId)}/notes`;
  }

  function openEditNotes(unitId: string, unitTitle: string, lessonTitle?: string) {
    setEditContent(''); setEditSavedAt(null); setEditErr(null);
    setEditStatus('loading');
    setEditing({ unitId, title: unitTitle, lessonTitle });
    if (lessonTitle) setEditScrollTarget(lessonTitle);
    api<{ content: string; updatedAt: number | null }>(notesEndpoint(unitId))
      .then((r) => {
        let content = r.content || '';
        if (lessonTitle) {
          // Ensure a heading for this lesson exists; if not, append it so the
          // student's notes are automatically organised under the lesson topic.
          const esc = lessonTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const heading = `<h2>${esc}</h2>`;
          if (!content.includes(heading)) {
            content = content ? `${content}\n${heading}\n<p><br></p>` : `${heading}\n<p><br></p>`;
          }
        }
        setEditContent(content);
        setEditSavedAt(r.updatedAt);
        setEditStatus('idle');
      })
      .catch((e: any) => { setEditStatus('error'); setEditErr(e.message || 'Failed to load notes'); });
  }

  async function saveEditNotes(unitId: string, content: string) {
    setEditStatus('saving'); setEditErr(null);
    try {
      const r = await api<{ content: string; updatedAt: number }>(notesEndpoint(unitId), {
        method: 'PUT', body: JSON.stringify({ content }),
      });
      setEditSavedAt(r.updatedAt);
      setEditStatus('saved');
    } catch (e: any) {
      setEditStatus('error');
      setEditErr(e.message || 'Failed to save notes');
    }
  }

  // Debounced auto-save while typing in the editor.
  useEffect(() => {
    if (!editing) return;
    if (editStatus === 'loading') return;
    const unitId = editing.unitId;
    const handle = window.setTimeout(() => { saveEditNotes(unitId, editContent); }, 1200);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editContent, editing?.unitId]);

  // After loading finishes, scroll to the lesson heading in the editor (once).
  useEffect(() => {
    if (editStatus !== 'idle' || !editScrollTarget) return;
    const target = editScrollTarget;
    setEditScrollTarget(null); // clear immediately so this only fires once
    window.setTimeout(() => {
      const editor = document.querySelector('[aria-label="Unit notes"]') as HTMLElement | null;
      if (!editor) return;
      for (const h of Array.from(editor.querySelectorAll('h2'))) {
        if ((h as HTMLElement).textContent?.trim() === target.trim()) {
          (h as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        }
      }
    }, 150);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editStatus, editScrollTarget]);

  function closeEditNotes() {
    const wasEditing = editing;
    const lastContent = editContent;
    setEditing(null);
    if (wasEditing) {
      // Best-effort flush of the latest text in case the user closed within
      // the 1.2s debounce window.
      saveEditNotes(wasEditing.unitId, lastContent);
    }
  }
  const showStudentView = role === 'student' || (role === 'teacher' && previewAsStudent);

  // Progress tracking — counts answerable, non-extension questions only.
  // Excludes: passage, video_group (container cards), info_only, section_header, text_only.
  const mainCountableQs = questions.filter(
    (q) => !q.is_extension && !['passage', 'video_group', 'file_task', 'mc_group', 'group', 'info_only', 'section_header', 'text_only'].includes(q.question_type)
  );
  const mainAnsweredCount = mainCountableQs.filter(
    (q) => submissions.some((s) => s.question_id === q.id) || previewAnsweredQIds.has(q.id)
  ).length;
  const progressPct = mainCountableQs.length > 0
    ? Math.round(mainAnsweredCount / mainCountableQs.length * 100)
    : 0;

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      // Fire EVERY initial request in parallel — info, questions, the bulk
      // resource map, AND the role-appropriate submissions list. Previously
      // submissions were awaited only after info+questions returned, so the
      // page sat blank for an extra round-trip on slow connections.
      const submissionsP: Promise<Submission[]> = role === 'student'
        ? api<Submission[]>(`/api/classwork/lessons/${lessonId}/my-submissions`).catch(() => [])
        : role === 'teacher'
          ? api<Submission[]>(`/api/classwork/lessons/${lessonId}/submissions`).catch(() => [])
          : Promise.resolve([]);
      // Pupils additionally pull every auto-saved draft they have on
      // this lesson, in the same parallel batch so a slow draft fetch
      // never delays the page paint. Teachers don't have drafts.
      const draftsP: Promise<Draft[]> = role === 'student'
        ? api<Draft[]>(`/api/classwork/lessons/${lessonId}/my-drafts`).catch(() => [])
        : Promise.resolve([]);
      // Student: fetch their unlock set; teacher: fetch all lesson unlocks.
      const unlocksP =
        role === 'student'
          ? api<string[]>(`/api/classwork/lessons/${lessonId}/my-unlocks`).catch(() => [] as string[])
          : role === 'teacher'
            ? api<{ student_id: string; question_id: string }[]>(`/api/classwork/lessons/${lessonId}/unlocks`).catch(() => [] as { student_id: string; question_id: string }[])
            : Promise.resolve([] as string[]);
      const [info, qs, resMap, subs, drafts, unlocks] = await Promise.all([
        api<LessonInfo>(`/api/classwork/lessons/${lessonId}`).catch(() => null),
        api<Question[]>(`/api/classwork/lessons/${lessonId}/questions`),
        api<Record<string, LessonResource[]>>(`/api/classwork/lessons/${lessonId}/all-question-resources`).catch(() => ({})),
        submissionsP,
        draftsP,
        unlocksP,
      ]);
      setLesson(info);
      setQuestions(qs);
      setResourcesByQuestion(resMap || {});
      if (role === 'student') setSubmissions(subs);
      else if (role === 'teacher') setAllSubs(subs);
      if (role === 'student') {
        const map: Record<string, Draft> = {};
        for (const d of drafts) map[d.question_id] = d;
        setDraftsByQuestion(map);
        setUnlockedQIds(new Set(unlocks as string[]));
      } else if (role === 'teacher') {
        setTeacherUnlocks(unlocks as { student_id: string; question_id: string }[]);
      }
    } catch (e: any) {
      setErr(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function refreshSubmissions() {
    if (role !== 'teacher') return;
    try {
      const [subs, unlocks] = await Promise.all([
        api<Submission[]>(`/api/classwork/lessons/${lessonId}/submissions`),
        api<{ student_id: string; question_id: string }[]>(`/api/classwork/lessons/${lessonId}/unlocks`).catch(() => []),
      ]);
      setAllSubs(subs);
      setTeacherUnlocks(unlocks);
    } catch { /* ignore */ }
  }

  useEffect(() => { refresh(); }, [lessonId]);

  // Fire confetti once when a student reaches 100% completion.
  // Reset the "fired" flag if questions change (e.g. teacher removes a question).
  useEffect(() => {
    if (!showStudentView) return;
    if (progressPct >= 100 && mainCountableQs.length > 0 && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      confetti({
        particleCount: 180,
        spread: 110,
        origin: { y: 0.35 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899'],
      });
    }
    if (progressPct < 100) confettiFiredRef.current = false;
  }, [progressPct, mainCountableQs.length, showStudentView]);

  // Reorders questions within one section (main or extension) by computing
  // new order_index values from the drag-and-drop result and PATCHing the
  // server. The local questions state is updated optimistically so the UI
  // doesn't flicker, with a refresh() fallback on network error.
  type DragItem = { type: 'standalone'; q: Question } | { type: 'group'; passage: Question; children: Question[] };
  // destId = null means "move to the very end of the list".
  async function handleReorder(items: DragItem[], srcId: string, destId: string | null) {
    const getId = (it: DragItem) => it.type === 'standalone' ? it.q.id : it.passage.id;
    const srcIdx = items.findIndex((it) => getId(it) === srcId);
    if (srcIdx === -1) return;

    const newItems = [...items];
    const [moved] = newItems.splice(srcIdx, 1);

    if (destId === null) {
      // Append to the very end.
      newItems.push(moved);
    } else {
      const destIdx = items.findIndex((it) => getId(it) === destId);
      if (destIdx === -1 || srcIdx === destIdx) return;
      // When dragging forward the splice shifts everything left by one,
      // so the insertion index is already correct after the splice.
      const insertAt = srcIdx < destIdx ? destIdx - 1 : destIdx;
      newItems.splice(insertAt, 0, moved);
    }

    // Flatten to an ordered list of question IDs (passage children immediately
    // follow their passage so they stay grouped).
    const orderedIds: string[] = [];
    for (const it of newItems) {
      if (it.type === 'standalone') {
        orderedIds.push(it.q.id);
      } else {
        orderedIds.push(it.passage.id);
        it.children.forEach((c) => orderedIds.push(c.id));
      }
    }

    // Optimistic update so the card moves instantly.
    const idToOrder = new Map(orderedIds.map((id, i) => [id, i * 10]));
    setQuestions((prev) =>
      [...prev]
        .map((q) => idToOrder.has(q.id) ? { ...q, order_index: idToOrder.get(q.id)! } : q)
        .sort((a, b) => a.order_index - b.order_index || (a.created_at || '').localeCompare(b.created_at || ''))
    );

    try {
      await api(`/api/classwork/lessons/${lessonId}/questions/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: orderedIds }),
      });
    } catch {
      refresh();
    }
  }

  // ─── Mark questions "viewed" when they scroll into the pupil's
  // viewport ────────────────────────────────────────────────────────────
  // Lets teachers tell, on the analytics page, who just couldn't access
  // a task from who actually opened it but didn't finish. We only fire
  // ONE POST per (question, page-load), tracked via a ref-set. Teachers
  // and the teacher's "preview as student" toggle are excluded so they
  // don't pollute pupil view counts.
  const viewedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (role !== 'student') return;
    if (questions.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const qid = (entry.target as HTMLElement).dataset.classworkQuestionId;
          if (!qid || viewedRef.current.has(qid)) continue;
          viewedRef.current.add(qid);
          // Stop watching this card — we only need the first sighting.
          io.unobserve(entry.target);
          // Best-effort POST. Failures are silently swallowed by the
          // server route too; nothing here should ever block the pupil.
          const token = localStorage.getItem('studentToken') || '';
          void fetch(`/api/classwork/questions/${qid}/view`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            keepalive: true,
          }).catch(() => {});
        }
      },
      // Fire once at least 30% of the card is on screen — generous
      // enough that pupils who scroll past quickly still get counted,
      // strict enough that a question barely peeking from the bottom
      // doesn't count as "opened".
      { threshold: 0.3 }
    );
    const nodes = document.querySelectorAll<HTMLElement>('[data-classwork-question-id]');
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [role, questions]);

  return (
    <Shell title="Lesson" back={{ href: lesson?.course ? `/course/${lesson.course}` : '/', label: 'Units' }}>
      {lesson && (lesson.title || lesson.learning_intentions || lesson.success_criteria) && (
        <LessonHeader lesson={lesson} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: lesson ? 16 : 0 }}>
        <h1 style={{ margin: 0 }}>Tasks</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* "Open my jotter" — visible to BOTH pupils and teachers. Teachers
              get their own demo jotter (server keys it as "teacher:demo") so
              they can model note-taking in front of a class without writing
              into any pupil's notes. */}
          {(role === 'student' || role === 'teacher') && (
            <Link
              href={role === 'teacher' && lesson?.course ? `/jotter?course=${lesson.course}` : '/jotter'}
              style={{
                display: 'inline-block',
                background: 'var(--cw-tint-textonly-bg)', color: 'var(--cw-tint-textonly-ink)', border: '1px solid var(--cw-tint-textonly-border)',
                padding: '8px 14px', borderRadius: 8, fontWeight: 600, textDecoration: 'none',
              }}
              title={role === 'teacher'
                ? 'Open your demo jotter — what pupils see when they click "My jotter"'
                : 'Open your year-long notes jotter'}
            >
              Open Jotter View
            </Link>
          )}
          {role === 'teacher' && (
          <>
            <button
              type="button"
              onClick={() => setPreviewAsStudent((v) => { if (!v) { previewSessionRef.current += 1; } else { setPreviewAnsweredQIds(new Set()); } return !v; })}
              style={{
                background: previewAsStudent ? 'var(--cw-accent)' : 'var(--cw-surface-muted)',
                color: previewAsStudent ? '#fff' : 'var(--cw-ink)',
                border: '1px solid ' + (previewAsStudent ? 'var(--cw-accent)' : 'var(--cw-border)'),
                padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
              }}
              title="Show this lesson exactly as a student would see it"
            >
              {previewAsStudent ? 'Exit student preview' : 'Preview as student'}
            </button>
            {!previewAsStudent && <NewQuestionButton
              lessonId={lessonId}
              passages={questions.filter((q) => q.question_type === 'passage' || q.question_type === 'video_group' || q.question_type === 'file_task' || q.question_type === 'mc_group' || q.question_type === 'group')}
              onCreated={refresh}
            />}
          </>
          )}
        </div>
      </div>

      {role === 'teacher' && previewAsStudent && (
        <div style={{
          marginTop: 12, padding: '8px 12px', background: '#fef3c7', border: '1px solid #fde68a',
          color: '#854d0e', borderRadius: 8, fontSize: 13,
        }}>
          You are previewing this lesson as a student. Submit any answer to see
          the AI feedback your pupils would get &mdash; nothing is saved to the
          submissions table.
        </div>
      )}

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: 'var(--cw-danger)' }}>{err}</p>}
      {!loading && !err && questions.length === 0 && (
        <p style={{ color: 'var(--cw-muted)', marginTop: 24 }}>
          {role === 'teacher' ? 'No tasks yet — add the first one above.' : 'Your teacher hasn\u2019t added any tasks yet.'}
        </p>
      )}

      {(() => {
        // All questions rendered in one unified list; is_extension drives
        // label prefix (Ex1, Ex2…) and card tint but not section splits.

        // Build a render plan: each passage groups any later-or-earlier questions
        // whose passage_id matches it. Standalone (non-passage, non-attached)
        // questions render as before. Passages whose id no-one references still
        // render as a single passage card.
        type Item = { type: 'standalone'; q: Question } | { type: 'group'; passage: Question; children: Question[] };
        const buildItems = (qs: Question[]): Item[] => {
          const consumed = new Set<string>();
          const items: Item[] = [];
          for (const q of qs) {
            if (consumed.has(q.id)) continue;
            if (q.question_type === 'passage' || q.question_type === 'video_group' || q.question_type === 'file_task' || q.question_type === 'mc_group' || q.question_type === 'group') {
              const children = qs.filter((c) =>
                c.id !== q.id && c.question_type !== 'passage' && c.question_type !== 'video_group' && c.question_type !== 'file_task' && c.question_type !== 'mc_group' && c.question_type !== 'group' && c.passage_id === q.id && !consumed.has(c.id)
              );
              children.forEach((c) => consumed.add(c.id));
              consumed.add(q.id);
              items.push({ type: 'group', passage: q, children });
            } else {
              consumed.add(q.id);
              items.push({ type: 'standalone', q });
            }
          }
          return items;
        };

        // A simple counter so non-passage questions across standalones AND
        // groups share one continuous Q1, Q2, Q3… numbering.
        const renderQuestionCard = (q: Question, label: string, isExt: boolean) => {
          const mySubs = submissions.filter((s) => s.question_id === q.id);
          const isInfo = q.question_type === 'info_only';
          const isTextOnly = q.question_type === 'text_only';
          // Both info_only and text_only are "no answer" cards. Treat them
          // uniformly for the gates that hide the answer area, but use a
          // distinct cyan tint for text_only so pupils can spot jotter tasks
          // at a glance.
          const isNoAnswer = isInfo || isTextOnly;
          return (
            // data-classwork-question-id is the hook the IntersectionObserver
            // uses to record "pupil has seen this task" — see the
            // viewedRef effect higher up in this file.
            <div key={q.id} data-classwork-question-id={q.id} style={{
              ...card,
              ...(isExt ? { borderColor: 'var(--cw-tint-extension-border)', background: 'var(--cw-tint-extension-bg)' } : {}),
              ...(isInfo ? { borderColor: 'var(--cw-tint-info-border)', background: 'var(--cw-tint-info-bg)' } : {}),
              ...(isTextOnly ? { borderColor: 'var(--cw-tint-textonly-border)', background: 'var(--cw-tint-textonly-bg)' } : {}),
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                  {role === 'teacher' && !previewAsStudent && (
                    <span
                      title="Drag to reorder"
                      style={{
                        cursor: 'grab', color: 'var(--cw-muted)', fontSize: 16,
                        lineHeight: 1, userSelect: 'none', opacity: 0.55,
                        letterSpacing: -1,
                      }}
                    >⠿</span>
                  )}
                  <span>{label}{!isInfo && !isTextOnly ? ` · ${TYPE_LABELS[q.question_type] || q.question_type}` : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {q.question_type !== 'passage' && !isInfo && (
                    <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>{q.max_marks} mark{q.max_marks === 1 ? '' : 's'}</div>
                  )}
                  {/* Jotter shortcut on every question — students open their unit
                      notes without leaving the lesson; the heading for this lesson
                      is auto-inserted if it doesn't already exist. */}
                  {lesson?.unit_id && !isTextOnly && (role === 'student' || previewAsStudent) && (
                    <button
                      type="button"
                      onClick={() => openEditNotes(lesson.unit_id!, lesson.title || 'this unit', lesson.title || undefined)}
                      title={role === 'teacher' ? 'Open demo jotter for this unit' : 'Add notes to your jotter for this lesson'}
                      style={{
                        background: 'none', border: '1px solid var(--cw-border, #e2e8f0)',
                        borderRadius: 5, padding: '2px 8px', fontSize: 12,
                        cursor: 'pointer', color: 'var(--cw-muted)', display: 'flex',
                        alignItems: 'center', gap: 3, whiteSpace: 'nowrap',
                      }}
                    >
                      📓 Jotter
                    </button>
                  )}
                  {role === 'teacher' && !previewAsStudent && (
                    <>
                      <EditQuestionButton
                        question={q}
                        passages={questions.filter((x) => x.question_type === 'passage' || x.question_type === 'video_group' || x.question_type === 'file_task' || x.question_type === 'group')}
                        onChanged={refresh}
                      />
                      {lesson?.unit_id && (
                        <MoveQuestionButton
                          questionId={q.id}
                          unitId={lesson.unit_id}
                          currentLessonId={lessonId}
                          onMoved={refresh}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 8 }}><PromptText text={q.prompt} /></div>

              {q.question_type === 'video_question' && <VideoQuestionPlayer config={q.config} />}

              {q.question_type === 'presentation' && q.config && typeof q.config === 'object' && (q.config as any).starterFileUrl && (
                <div style={{
                  marginTop: 8, padding: '10px 12px', borderRadius: 8,
                  background: 'var(--cw-tint-info-bg)', border: '1px solid var(--cw-tint-info-border)',
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                }}>
                  <span style={{ fontWeight: 600 }}>Starter presentation:</span>
                  <a
                    href={(q.config as any).starterFileUrl}
                    download={(q.config as any).starterFileName || undefined}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 6,
                      background: 'var(--cw-surface)', border: '1px solid var(--cw-tint-info-border)',
                      color: 'var(--cw-tint-info-ink)', fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    Download {((q.config as any).starterFileName as string | undefined) || 'starter.pptx'}
                  </a>
                  <span style={{ fontSize: 12, color: 'var(--cw-muted)' }}>
                    Open it in PowerPoint, edit it, then upload your finished version below.
                  </span>
                </div>
              )}

              <QuestionResources
                questionId={q.id}
                isTeacher={role === 'teacher' && !previewAsStudent}
                initialResources={resourcesByQuestion[q.id] || []}
              />

              {role === 'teacher' && !previewAsStudent && !isNoAnswer && (
                <details style={{ marginTop: 8, fontSize: 14, color: 'var(--cw-muted)' }}>
                  <summary style={{ cursor: 'pointer' }}>Marking scheme &amp; AI guidance</summary>
                  <div style={{ marginTop: 8 }}>
                    <div><strong>Marking scheme:</strong> {q.marking_scheme || '—'}</div>
                    <div style={{ marginTop: 4 }}><strong>AI guidance:</strong> {q.ai_grading_guidance || '—'}</div>
                  </div>
                </details>
              )}

              {/* Offline-task callout: visible to pupils AND to teachers
                  (so a teacher previewing or browsing the lesson sees the
                  exact same prompt-and-jotter-link experience pupils get). */}
              {isTextOnly && (
                <div style={{
                  marginTop: 12, padding: '12px 14px', borderRadius: 8,
                  background: 'var(--cw-surface)', border: '1px dashed var(--cw-tint-textonly-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 12, flexWrap: 'wrap',
                }}>
                  <span style={{ color: 'var(--cw-tint-textonly-ink)', fontSize: 14 }}>
                    <strong>Jotter task</strong> &mdash; write your answer in
                    your jotter (typed notes, sketches, screenshots&hellip;)
                    instead of typing it here.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      // Open the editable notes modal for THIS lesson's unit
                      // so pupils can jot something straight away without
                      // navigating away from the lesson.
                      if (!lesson?.unit_id) return;
                      openEditNotes(lesson.unit_id, lesson.title || 'this unit', lesson.title || undefined);
                    }}
                    disabled={!lesson?.unit_id}
                    title={role === 'teacher'
                      ? 'Edit the demo notes for this unit'
                      : 'Open your jotter notes for this unit'}
                    style={{
                      display: 'inline-block',
                      background: '#0891b2', color: '#fff', border: '1px solid #0891b2',
                      padding: '6px 14px', borderRadius: 6, fontWeight: 600,
                      fontSize: 14, cursor: lesson?.unit_id ? 'pointer' : 'not-allowed',
                      opacity: lesson?.unit_id ? 1 : 0.6,
                    }}
                  >
                    My Jotter
                  </button>
                </div>
              )}

              {showStudentView && !isNoAnswer && (
                <StudentAnswer
                  question={q}
                  previousSubmissions={mySubs}
                  isUnlocked={unlockedQIds.has(q.id)}
                  draft={role === 'student' ? (draftsByQuestion[q.id] || null) : null}
                  onSubmitted={() => {
                    // The server clears the draft as part of createSubmission,
                    // so drop it locally too — otherwise the next render of
                    // this card would try to rehydrate from a stale draft.
                    setDraftsByQuestion((m) => {
                      if (!m[q.id]) return m;
                      const { [q.id]: _, ...rest } = m;
                      return rest;
                    });
                    // Consume the unlock locally so the UI snaps to locked
                    // immediately — the server already deleted the row.
                    setUnlockedQIds((prev) => {
                      const next = new Set(prev);
                      next.delete(q.id);
                      return next;
                    });
                    refresh();
                  }}
                  preview={role === 'teacher' && previewAsStudent}
                />
              )}
              {role === 'teacher' && !previewAsStudent && !isNoAnswer && (
                <TeacherSubmissions
                  question={q}
                  submissions={allSubs.filter((s) => s.question_id === q.id)}
                  unlockedStudentIds={new Set(teacherUnlocks.filter((u) => u.question_id === q.id).map((u) => u.student_id))}
                  onChanged={refreshSubmissions}
                />
              )}
              {role === 'guest' && !isNoAnswer && (
                <p style={{ marginTop: 8, color: 'var(--cw-muted)', fontSize: 14 }}>
                  Sign in as a student to answer this task.
                </p>
              )}
            </div>
          );
        };

        // The passage panel: a card with the passage prompt + its own resources.
        // No marks, no marking scheme, no answer area — it's reading material only.
        // Also handles the generic `group` type (any contextMode).
        const renderPassagePanel = (p: Question, label: string) => {
          const isVG = p.question_type === 'video_group';
          const isGroup = p.question_type === 'group';
          const groupCfg = isGroup ? ((p.config && typeof p.config === 'object') ? p.config as any : {}) : null;
          const contextMode: string = groupCfg ? (groupCfg.contextMode || 'none') : '';
          const groupBadgeColor = '#0ea5e9';
          const bgColor = isVG ? 'var(--cw-surface)' : isGroup ? 'rgba(14,165,233,0.06)' : 'var(--cw-tint-amber-bg)';
          const borderColor = isVG ? 'var(--cw-border)' : isGroup ? '#0ea5e9' : 'var(--cw-tint-amber-border)';
          const fgColor = isVG ? 'var(--cw-ink)' : isGroup ? 'var(--cw-ink)' : 'var(--cw-tint-amber-ink)';
          const badgeBg = isVG ? '#6366f1' : isGroup ? groupBadgeColor : '#f59e0b';
          const badgeLabel = isVG ? '▶ Video' : isGroup ? '⊞ Group' : 'Passage';
          const addLabel = isVG ? '+ Add question to this video'
            : isGroup ? '+ Add question to this group'
            : '+ Add question to this passage';
          return (
            <div style={{ ...card, background: bgColor, borderColor }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: fgColor, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: 999,
                  background: badgeBg, color: '#fff',
                }}>{badgeLabel}</span>
                <span>{label}</span>
                {role === 'teacher' && !previewAsStudent && (
                  <>
                    <EditQuestionButton
                      question={p}
                      passages={questions.filter((x) => (x.question_type === 'passage' || x.question_type === 'video_group' || x.question_type === 'group') && x.id !== p.id)}
                      onChanged={refresh}
                    />
                    {lesson?.unit_id && (
                      <MoveQuestionButton
                        questionId={p.id}
                        unitId={lesson.unit_id}
                        currentLessonId={lessonId}
                        isGroup
                        onMoved={refresh}
                      />
                    )}
                    <NewQuestionButton
                      lessonId={lessonId}
                      passages={questions.filter((x) => x.question_type === 'passage' || x.question_type === 'video_group' || x.question_type === 'file_task' || x.question_type === 'mc_group' || x.question_type === 'group')}
                      initialPassageId={p.id}
                      label={addLabel}
                      compact
                      onCreated={refresh}
                    />
                  </>
                )}
              </div>
              {isVG ? (
                <VideoQuestionPlayer config={p.config} compact />
              ) : isGroup ? (
                <>
                  {contextMode === 'video' && groupCfg.video ? (
                    <VideoQuestionPlayer config={{ video: groupCfg.video }} compact />
                  ) : contextMode === 'image' && groupCfg.imageUrl ? (
                    <div style={{ marginTop: 8 }}>
                      <img
                        src={groupCfg.imageUrl}
                        alt="Group context"
                        style={{ maxWidth: '100%', borderRadius: 6, border: '1px solid var(--cw-border)' }}
                      />
                    </div>
                  ) : contextMode === 'text' && p.prompt ? (
                    <>
                      <div style={{ marginTop: 8, lineHeight: 1.55 }}>
                        <PromptText text={p.prompt} />
                      </div>
                      <QuestionResources
                        questionId={p.id}
                        isTeacher={role === 'teacher' && !previewAsStudent}
                        initialResources={resourcesByQuestion[p.id] || []}
                      />
                    </>
                  ) : p.prompt ? (
                    <div style={{ marginTop: 8, lineHeight: 1.55 }}>
                      <PromptText text={p.prompt} />
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div style={{ marginTop: 8, lineHeight: 1.55 }}>
                    <PromptText text={p.prompt} />
                  </div>
                  <QuestionResources
                    questionId={p.id}
                    isTeacher={role === 'teacher' && !previewAsStudent}
                    initialResources={resourcesByQuestion[p.id] || []}
                  />
                </>
              )}
            </div>
          );
        };

        // The mc_group panel: a card with a question stem / instructions.
        // Children are multiple_choice questions answered and submitted together
        // as a group — the student sees them all at once with a single submit.
        const renderMcGroupPanel = (p: Question, label: string) => {
          return (
            <div style={{
              ...card,
              background: 'var(--cw-tint-extension-bg)',
              borderColor: 'var(--cw-tint-extension-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--cw-ink)', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: 999,
                  background: '#7c3aed', color: '#fff',
                }}>Multi-part MC</span>
                <span>{label}</span>
                {role === 'teacher' && !previewAsStudent && (
                  <>
                    <EditQuestionButton
                      question={p}
                      passages={[]}
                      onChanged={refresh}
                    />
                    {lesson?.unit_id && (
                      <MoveQuestionButton
                        questionId={p.id}
                        unitId={lesson.unit_id}
                        currentLessonId={lessonId}
                        isGroup
                        onMoved={refresh}
                      />
                    )}
                    <NewQuestionButton
                      lessonId={lessonId}
                      passages={questions.filter((x) => x.question_type === 'passage' || x.question_type === 'video_group' || x.question_type === 'file_task' || x.question_type === 'mc_group' || x.question_type === 'group')}
                      initialPassageId={p.id}
                      label="+ Add MC question to this group"
                      compact
                      onCreated={refresh}
                    />
                  </>
                )}
              </div>
              {p.prompt && (
                <div style={{ marginTop: 8, lineHeight: 1.55 }}>
                  <PromptText text={p.prompt} />
                </div>
              )}
              <QuestionResources
                questionId={p.id}
                isTeacher={role === 'teacher' && !previewAsStudent}
                initialResources={resourcesByQuestion[p.id] || []}
              />
            </div>
          );
        };

        // The file task panel: like a passage card but with a file upload student
        // answer area instead of reading text.  Child questions appear below it.
        const renderFileTaskPanel = (p: Question, label: string) => {
          const mySubs = submissions.filter((s) => s.question_id === p.id);
          const myDraft = draftsByQuestion[p.id] ?? null;
          return (
            <div style={{
              ...card,
              background: 'var(--cw-tint-success-bg)',
              borderColor: 'var(--cw-tint-success-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: 999,
                  background: '#16a34a', color: '#fff',
                }}>📎 File task</span>
                <span style={{ color: 'var(--cw-tint-success-ink)' }}>{label}</span>
                {role === 'teacher' && !previewAsStudent && (
                  <>
                    <EditQuestionButton
                      question={p}
                      passages={questions.filter((x) => (x.question_type === 'passage' || x.question_type === 'video_group' || x.question_type === 'file_task' || x.question_type === 'group') && x.id !== p.id)}
                      onChanged={refresh}
                    />
                    {lesson?.unit_id && (
                      <MoveQuestionButton
                        questionId={p.id}
                        unitId={lesson.unit_id}
                        currentLessonId={lessonId}
                        isGroup
                        onMoved={refresh}
                      />
                    )}
                    <NewQuestionButton
                      lessonId={lessonId}
                      passages={questions.filter((x) => x.question_type === 'passage' || x.question_type === 'video_group' || x.question_type === 'file_task' || x.question_type === 'group')}
                      initialPassageId={p.id}
                      label="+ Add question to this file task"
                      compact
                      onCreated={refresh}
                    />
                  </>
                )}
              </div>
              {p.prompt && (
                <div style={{ marginTop: 8, lineHeight: 1.55 }}>
                  <PromptText text={p.prompt} />
                </div>
              )}
              <QuestionResources
                questionId={p.id}
                isTeacher={role === 'teacher' && !previewAsStudent}
                initialResources={resourcesByQuestion[p.id] || []}
              />
              {/* Student and preview-as-student: show the file upload answer area */}
              {(role === 'student' || previewAsStudent) && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--cw-tint-success-ink)' }}>
                    Step 1 — upload your file or paste a share link below before answering the questions.
                  </p>
                  <StudentAnswer
                    question={p}
                    previousSubmissions={mySubs}
                    isUnlocked={unlockedQIds.has(p.id)}
                    draft={myDraft}
                    onSubmitted={() => {
                      setUnlockedQIds((prev) => {
                        const next = new Set(prev);
                        next.delete(p.id);
                        return next;
                      });
                      refresh();
                    }}
                    preview={previewAsStudent}
                  />
                </div>
              )}
              {/* Teacher viewing a student's work: show the submitted file */}
              {role === 'teacher' && !previewAsStudent && mySubs.length > 0 && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--cw-border)', paddingTop: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: 'var(--cw-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Uploaded file</p>
                  <TeacherSubmissions
                    question={p}
                    submissions={mySubs}
                    unlockedStudentIds={new Set(teacherUnlocks.filter((u) => u.question_id === p.id).map((u) => u.student_id))}
                    onChanged={refreshSubmissions}
                  />
                </div>
              )}
            </div>
          );
        };

        // A section divider — purely visual grouping. No marks, no answer area,
        // no resources. Used by teachers to break a long lesson into "Section A",
        // "Section B" etc. Question numbering continues across sections so
        // existing analytics (which key off question_id) stay correct.
        const renderSectionHeader = (s: Question) => {
          const title = (s.prompt || '').trim() || 'Section';
          return (
            <div key={s.id} style={{
              marginTop: 18, padding: '10px 14px', borderRadius: 8,
              background: 'linear-gradient(180deg, var(--cw-surface-muted) 0%, var(--cw-border) 100%)',
              border: '1px solid var(--cw-border-strong)', borderLeft: '4px solid var(--cw-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
            }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--cw-ink)' }}>{title}</div>
              {role === 'teacher' && !previewAsStudent && (
                <EditQuestionButton
                  question={s}
                  passages={questions.filter((x) => x.question_type === 'passage' || x.question_type === 'video_group' || x.question_type === 'file_task' || x.question_type === 'group')}
                  onChanged={refresh}
                />
              )}
            </div>
          );
        };

        // Single unified render pass — Q counter for main questions,
        // Ex counter for extension questions, both start from 1.
        const renderItems = (items: Item[]) => {
          let qIdx = 0;
          let exIdx = 0;
          const isTeacherDrag = role === 'teacher' && !previewAsStudent;

          return items.map((it) => {
            const itemId = it.type === 'standalone' ? it.q.id : it.passage.id;
            const isDragOver = dragOverId === itemId;
            const isExt = it.type === 'standalone'
              ? !!it.q.is_extension
              : !!it.passage.is_extension;

            let content: React.ReactNode;
            if (it.type === 'standalone') {
              if (it.q.question_type === 'section_header') {
                content = renderSectionHeader(it.q);
              } else if (isExt) {
                exIdx++;
                content = renderQuestionCard(it.q, 'Extension', isExt);
              } else if (it.q.question_type === 'info_only') {
                content = renderQuestionCard(it.q, 'Note', isExt);
              } else if (it.q.question_type === 'text_only') {
                content = renderQuestionCard(it.q, 'Task', isExt);
              } else {
                qIdx++;
                content = renderQuestionCard(it.q, `Q${qIdx}`, isExt);
              }
            } else {
              // Group (passage / video_group): counts as one Q or Ex.
              // Children are sub-labelled a), b), c) … within that Q.
              if (isExt) { exIdx++; } else { qIdx++; }
              const groupLabel = isExt ? 'Extension' : `Q${qIdx}`;
              const gid = it.passage.id;
              const collapsed = isTeacherDrag && collapsedGroups.has(gid);
              const childCount = it.children.length;
              content = (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {it.passage.question_type === 'file_task'
                    ? renderFileTaskPanel(it.passage, groupLabel)
                    : it.passage.question_type === 'mc_group'
                      ? renderMcGroupPanel(it.passage, groupLabel)
                      : renderPassagePanel(it.passage, groupLabel)}
                  {/* Collapse toggle — teacher only */}
                  {isTeacherDrag && childCount > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleGroup(gid); }}
                      style={{
                        alignSelf: 'flex-start',
                        background: 'none', border: '1px solid var(--cw-border)',
                        borderRadius: 6, padding: '3px 10px',
                        fontSize: 12, color: 'var(--cw-muted)',
                        cursor: 'pointer', userSelect: 'none',
                      }}
                    >
                      {collapsed
                        ? `▶ Show ${childCount} question${childCount !== 1 ? 's' : ''}`
                        : `▲ Collapse questions`}
                    </button>
                  )}
                  {!collapsed && (
                    it.children.length === 0 ? (
                      <p style={{ color: 'var(--cw-muted)', fontStyle: 'italic', margin: 0 }}>
                        No tasks are attached to this {it.passage.question_type === 'video_group' ? 'video' : it.passage.question_type === 'file_task' ? 'file task' : (it.passage.question_type === 'mc_group' || it.passage.question_type === 'group') ? 'group' : 'passage'} yet.
                      </p>
                    ) : it.children.map((c, ci) =>
                      renderQuestionCard(c, `${String.fromCharCode(97 + ci)})`, isExt)
                    )
                  )}
                </div>
              );
            }

            // In teacher mode wrap each item so it can be dragged to a new position.
            // Students see a plain fragment with no extra DOM node.
            if (!isTeacherDrag) return <React.Fragment key={itemId}>{content}</React.Fragment>;

            return (
              <div
                key={itemId}
                draggable
                onDragStart={(e) => {
                  dragSrcIdRef.current = itemId;
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  if (!dragSrcIdRef.current || dragSrcIdRef.current === itemId) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverId !== itemId) setDragOverId(itemId);
                }}
                onDragLeave={(e) => {
                  // Only clear when the pointer actually leaves this wrapper,
                  // not when it moves into a child element.
                  if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
                  if (dragOverId === itemId) setDragOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const src = dragSrcIdRef.current;
                  dragSrcIdRef.current = null;
                  setDragOverId(null);
                  if (!src || src === itemId) return;
                  handleReorder(items, src, itemId);
                }}
                onDragEnd={() => {
                  dragSrcIdRef.current = null;
                  setDragOverId(null);
                }}
                style={{
                  borderRadius: 12,
                  outline: isDragOver ? '2px dashed var(--cw-accent, #4f46e5)' : 'none',
                  outlineOffset: 3,
                  transition: 'outline 80ms',
                }}
              >
                {content}
              </div>
            );
          });
        };

        const allItems = buildItems(questions);
        const isTeacherDrag = role === 'teacher' && !previewAsStudent;

        // A drop zone rendered after the last card so teachers can drag
        // any question to the very bottom of a section.
        const DropTail = ({ items, sentinel }: { items: DragItem[]; sentinel: string }) => {
          if (!isTeacherDrag) return null;
          const isOver = dragOverId === sentinel;
          return (
            <div
              onDragOver={(e) => {
                if (!dragSrcIdRef.current) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverId !== sentinel) setDragOverId(sentinel);
              }}
              onDragLeave={(e) => {
                if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
                if (dragOverId === sentinel) setDragOverId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const src = dragSrcIdRef.current;
                dragSrcIdRef.current = null;
                setDragOverId(null);
                if (!src) return;
                handleReorder(items, src, null);
              }}
              style={{
                marginTop: 8,
                height: isOver ? 40 : 20,
                borderRadius: 8,
                border: isOver ? '2px dashed var(--cw-accent, #4f46e5)' : '2px dashed transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cw-accent, #4f46e5)',
                fontSize: 12,
                transition: 'height 80ms, border-color 80ms',
              }}
            >
              {isOver && 'Move to bottom'}
            </div>
          );
        };

        // ────────────────────────────────────────────────────────────────────
        // Teacher vertical scroll view (unchanged layout)
        // ────────────────────────────────────────────────────────────────────
        if (!showStudentView) {
          return (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                {renderItems(allItems)}
              </div>
              <DropTail items={allItems} sentinel="__tail__" />
            </>
          );
        }

        // ────────────────────────────────────────────────────────────────────
        // Student tab navigation view — one card at a time
        // ────────────────────────────────────────────────────────────────────

        // Clamp the current index to valid range (handles question removal).
        const safeIdx = allItems.length === 0 ? 0 : Math.max(0, Math.min(tabIdx, allItems.length - 1));

        // Build tab labels and answered state in a single pass.
        let qCount = 0;
        let exCount = 0;
        let tCount = 0;
        const tabLabels: string[]  = [];
        const tabAnswered: (boolean | null)[] = []; // null = non-answerable

        for (const it of allItems) {
          const itIsExt = it.type === 'standalone' ? !!it.q.is_extension : !!it.passage.is_extension;
          if (it.type === 'standalone') {
            const qt = it.q.question_type;
            if (qt === 'section_header')      { tabLabels.push('—');              tabAnswered.push(null); }
            else if (itIsExt) {
              exCount++;
              tabLabels.push(`Ex${exCount}`);
              tabAnswered.push(submissions.some((s) => s.question_id === it.q.id));
            } else if (qt === 'info_only')    { tabLabels.push('Note');           tabAnswered.push(null); }
            else if (qt === 'text_only')      { tCount++; tabLabels.push(`Task ${tCount}`); tabAnswered.push(null); }
            else {
              qCount++;
              tabLabels.push(`Q${qCount}`);
              tabAnswered.push(submissions.some((s) => s.question_id === it.q.id));
            }
          } else {
            // Group counts as ONE Q or Ex; children get sub-labels a/b/c on the same tab.
            if (itIsExt) { exCount++; tabLabels.push(`Ex${exCount}`); }
            else { qCount++; tabLabels.push(`Q${qCount}`); }
            tabAnswered.push(
              it.children.length === 0
                ? null
                : it.children.every((c) => submissions.some((s) => s.question_id === c.id))
            );
          }
        }

        // Render the card for the currently-active tab.
        let curContent: React.ReactNode = null;
        if (allItems.length > 0) {
          const curItem = allItems[safeIdx];
          const curLabel = tabLabels[safeIdx];
          const curIsExt = curItem.type === 'standalone'
            ? !!curItem.q.is_extension
            : !!curItem.passage.is_extension;
          if (curItem.type === 'standalone') {
            if (curItem.q.question_type === 'section_header') {
              curContent = renderSectionHeader(curItem.q);
            } else {
              curContent = renderQuestionCard(curItem.q, curIsExt ? 'Extension' : curLabel, curIsExt);
            }
          } else {
            // Group: video/passage pinned to the top, questions scroll below.
            // Both video_group and passage show one child question at a time
            // with the lettered pill-button nav (a / b / c …).
            // mc_group shows all children at once with a single submit.
            const isVG = curItem.passage.question_type === 'video_group';
            const isPassage = curItem.passage.question_type === 'passage';
            const isFT = curItem.passage.question_type === 'file_task';
            const isMCG = curItem.passage.question_type === 'mc_group';
            const isGroup = curItem.passage.question_type === 'group';
            const useStepped = isVG || isPassage || isGroup;
            const totalChildren = curItem.children.length;
            const rawStep = vgStep[curItem.passage.id] ?? 0;
            const curStep = Math.min(rawStep, Math.max(0, totalChildren - 1));
            curContent = (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  {isFT
                    ? renderFileTaskPanel(curItem.passage, curIsExt ? 'Extension' : curLabel)
                    : isMCG
                      ? renderMcGroupPanel(curItem.passage, curIsExt ? 'Extension' : curLabel)
                      : renderPassagePanel(curItem.passage, curIsExt ? 'Extension' : curLabel)}
                </div>
                {totalChildren === 0 ? (
                  <p style={{ color: 'var(--cw-muted)', fontStyle: 'italic', margin: 0, fontSize: 14 }}>
                    No questions are attached to this {isVG ? 'video' : isFT ? 'file task' : (isMCG || isGroup) ? 'group' : 'passage'} yet.
                  </p>
                ) : isMCG ? (
                  (role === 'student' || previewAsStudent) ? (
                    <McGroupAnswer
                      key={`${curItem.passage.id}-${previewSessionRef.current}`}
                      group={curItem.passage}
                      childQuestions={curItem.children}
                      submissions={submissions}
                      unlockedQIds={unlockedQIds}
                      preview={!!previewAsStudent}
                      onPreviewAnswered={(ids) => setPreviewAnsweredQIds((prev) => { const next = new Set(prev); ids.forEach((id) => next.add(id)); return next; })}
                      onSubmitted={() => {
                        setUnlockedQIds((prev) => {
                          const next = new Set(prev);
                          curItem.children.forEach((c) => next.delete(c.id));
                          return next;
                        });
                        refresh();
                      }}
                    />
                  ) : (
                    curItem.children.map((c, ci) =>
                      renderQuestionCard(c, `${String.fromCharCode(97 + ci)})`, false)
                    )
                  )
                ) : useStepped ? (
                  <>
                    {renderQuestionCard(curItem.children[curStep], `${String.fromCharCode(97 + curStep)})`, false)}
                    {totalChildren > 1 && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 6, padding: '10px 0', borderTop: '1px solid var(--cw-border)',
                        flexWrap: 'wrap',
                      }}>
                        <span style={{ fontSize: 12, color: 'var(--cw-muted)', marginRight: 4, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>Part:</span>
                        {curItem.children.map((_, ci) => {
                          const isCur = ci === curStep;
                          return (
                            <button
                              key={ci}
                              onClick={() => setVgStep((p) => ({ ...p, [curItem.passage.id]: ci }))}
                              style={{
                                minWidth: 34, height: 34, borderRadius: '50%', padding: '0 5px',
                                border: isCur ? '2px solid var(--cw-accent)' : '2px solid var(--cw-border)',
                                background: isCur ? 'var(--cw-accent)' : 'var(--cw-surface)',
                                color: isCur ? '#fff' : 'var(--cw-muted)',
                                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 150ms',
                              }}
                            >
                              {String.fromCharCode(97 + ci)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  curItem.children.map((c, ci) =>
                    renderQuestionCard(c, `${String.fromCharCode(97 + ci)})`, false)
                  )
                )}
              </div>
            );
          }
        }

        // Shared nav-button style helper — solid accent fill so these are clearly
        // the main question-level controls, distinct from the sub-question pill strip.
        const navBtnStyle = (disabled: boolean): React.CSSProperties => ({
          padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
          border: 'none',
          background: disabled ? 'var(--cw-surface)' : 'var(--cw-accent)',
          color: disabled ? 'var(--cw-muted)' : '#fff',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          transition: 'opacity 150ms',
          userSelect: 'none',
          flexShrink: 0,
        });


        return (
          <>
            {/* ── Progress bar ── */}
            {mainCountableQs.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 13, color: 'var(--cw-muted)', marginBottom: 5,
                }}>
                  <span style={{ fontWeight: 600 }}>Lesson progress</span>
                  <span style={{ fontWeight: 600, color: progressPct >= 100 ? '#10b981' : 'inherit' }}>
                    {mainAnsweredCount} / {mainCountableQs.length} answered
                    {progressPct >= 100 ? ' · 100% ✓' : ` · ${progressPct}%`}
                  </span>
                </div>
                <div style={{
                  background: 'var(--cw-border)', borderRadius: 999,
                  height: 10, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${progressPct}%`, height: '100%',
                    background: progressPct >= 100 ? '#10b981' : 'var(--cw-accent)',
                    borderRadius: 999,
                    transition: 'width 500ms ease, background 300ms ease',
                  }} />
                </div>
                {progressPct >= 100 && (
                  <div style={{
                    textAlign: 'center', marginTop: 10,
                    color: '#10b981', fontWeight: 700, fontSize: 15,
                  }}>
                    🎉 All done — great work!
                  </div>
                )}
              </div>
            )}

            {/* ── Tab navigation strip ── */}
            {allItems.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginTop: mainCountableQs.length > 0 ? 14 : 16,
                flexWrap: 'wrap',
              }}>
                {/* Prev button */}
                <button
                  disabled={safeIdx === 0}
                  onClick={() => setTabIdx(Math.max(0, safeIdx - 1))}
                  style={navBtnStyle(safeIdx === 0)}
                >← Prev</button>

                {/* Dot strip */}
                <div style={{
                  display: 'flex', gap: 5, flex: 1,
                  flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
                }}>
                  {allItems.map((_, i) => {
                    const isCurrent  = i === safeIdx;
                    const ans        = tabAnswered[i];
                    const lbl        = tabLabels[i];
                    const isSection  = lbl === '—';
                    return (
                      <button
                        key={i}
                        onClick={() => setTabIdx(i)}
                        title={lbl}
                        style={{
                          minWidth: isSection ? 22 : 34, height: 34,
                          borderRadius: isSection ? 4 : '50%',
                          padding: '0 5px',
                          border: isCurrent
                            ? '2px solid var(--cw-accent)'
                            : ans === true
                              ? '2px solid #10b981'
                              : '2px solid var(--cw-border)',
                          background: isCurrent
                            ? 'var(--cw-accent)'
                            : ans === true
                              ? '#10b981'
                              : 'var(--cw-surface)',
                          color: (isCurrent || ans === true) ? '#fff' : 'var(--cw-muted)',
                          fontSize: 11, fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 150ms',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                          opacity: ans === null && !isCurrent ? 0.7 : 1,
                        }}
                      >
                        {ans === true && !isCurrent ? '✓' : lbl}
                      </button>
                    );
                  })}
                </div>

                {/* Next button */}
                <button
                  disabled={safeIdx === allItems.length - 1}
                  onClick={() => setTabIdx(Math.min(allItems.length - 1, safeIdx + 1))}
                  style={navBtnStyle(safeIdx === allItems.length - 1)}
                >Next →</button>
              </div>
            )}

            {/* ── Current question card ── */}
            <div style={{ marginTop: 16 }}>{curContent}</div>
          </>
        );
      })()}
      <style>{`
        @media (max-width: 800px) {
          .cw-passage-group { grid-template-columns: 1fr !important; }
          .cw-passage-group > div:first-child { position: static !important; }
        }
      `}</style>

      {/* Edit-notes modal opened from the in-lesson "My Jotter" button so the
          pupil can jot something into their unit notes without leaving the
          lesson. Same RichTextEditor and auto-save behaviour as the Course
          and Jotter pages. */}
      <Modal
        open={!!editing}
        title={editing ? `${role === 'teacher' ? 'Demo notes' : 'My jotter notes'} \u2014 ${editing.title}` : ''}
        width={1100}
        fillHeight
        onClose={closeEditNotes}
        footer={<>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--cw-muted)' }}>
            {editStatus === 'saving' ? 'Saving\u2026'
              : editStatus === 'saved' && editSavedAt ? `Saved at ${new Date(editSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : editStatus === 'error' ? 'Couldn\u2019t save'
              : editSavedAt ? `Last saved ${new Date(editSavedAt).toLocaleString()}`
              : 'Not saved yet'}
          </span>
          <button
            onClick={() => editing && saveEditNotes(editing.unitId, editContent)}
            disabled={editStatus === 'loading' || editStatus === 'saving'}
            style={modalSecondaryBtn}
          >Save now</button>
          <button onClick={closeEditNotes} style={modalPrimaryBtn}>Done</button>
        </>}
      >
        {editStatus === 'loading' ? (
          <p style={{ margin: 0, color: 'var(--cw-muted)' }}>Loading your notes…</p>
        ) : (
          <>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--cw-muted)' }}>
              {role === 'teacher'
                ? 'These are the shared demo notes pupils see when you model note-taking in class. They save automatically as you type.'
                : 'Your notes for this unit. Use the toolbar to add headings, bold, lists and links. Notes save automatically as you type.'}
            </p>
            <RichTextEditor
              autoFocus
              value={editContent}
              onChange={setEditContent}
              placeholder={'Jot anything you want to remember about this unit \u2014 definitions, examples, questions to ask your teacher, exam tips, etc.'}
              fillHeight
              minHeight={360}
              ariaLabel="Unit notes"
            />
          </>
        )}
        {editErr && <p style={{ color: 'var(--cw-danger)', margin: '8px 0 0' }}>{editErr}</p>}
      </Modal>
    </Shell>
  );
}

function StudentAnswer({ question, previousSubmissions, isUnlocked = false, draft, onSubmitted, preview = false }: {
  question: Question;
  previousSubmissions: Submission[];
  // true when the teacher has granted this student a one-shot resubmit.
  isUnlocked?: boolean;
  // The pupil's auto-saved in-progress answer for this question, if any.
  // Loaded once at lesson open by the parent; mutations from this
  // component don't need to update it because we own the latest state
  // locally from then on.
  draft?: Draft | null;
  onSubmitted: () => void;
  preview?: boolean;
}) {
  const last = previousSubmissions[0];
  const [text, setText] = useState('');
  const [option, setOption] = useState<string>('');
  const [url, setUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileDragOver, setFileDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // "Saved · just now" indicator under the answer area. Driven by the
  // auto-save effect below so the pupil can see at a glance that their
  // work is safely on the server.
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  // python_task / html_task: list the pupil's saved code projects so they
  // can pick one and submit its latest code with one click.
  const [codeProjects, setCodeProjects] = useState<{ id: string; name: string; updatedAt: number | null }[] | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  // fill_in_blanks / table / labeled_inputs: a flat object keyed by blank id
  // ("1", "2") for fill_in_blanks, "row,col" for table, or field index ("0",
  // "1") for labeled_inputs. Submitted as JSON in textAnswer so the marker
  // can compare each cell against its expected answers.
  // Generic per-cell answer bag used by every JSON-into-text_answer task type
  // (fill_in_blanks, table, labeled_inputs, plus the four fun-activity types).
  // Loosely typed because word_search stores an array of found words and the
  // matching/anagrams renderers store strings — JSON.stringify handles both.
  const [cellAnswers, setCellAnswers] = useState<Record<string, any>>({});

  const t = question.question_type;
  const codeProjectKind: 'python' | 'html' | null =
    t === 'python_task' ? 'python' : t === 'html_task' ? 'html' : null;
  const editorHref = (id: string) => codeProjectKind === 'python'
    ? `/HTML/Tools/PythonEditor.html?project=${encodeURIComponent(id)}`
    : codeProjectKind === 'html'
      ? `/HTML/Tools/HTMLEditor.html?project=${encodeURIComponent(id)}`
      : '#';
  const sqlDbUrl: string = (() => {
    if (t !== 'sql_task') return '';
    const cfg = (question as any).config;
    return cfg && typeof cfg === 'object' && typeof cfg.databaseUrl === 'string' ? cfg.databaseUrl : '';
  })();
  // database_task: the teacher pastes a Data Sculptor embed URL (or just the
  // token). Pupils open it, get a forked sandbox via the standard DS embed
  // flow, work in it, and on Submit we send "<token>|<sessionKey>" so the
  // server can resolve their sandbox and call the DS structure grader.
  const dbEmbedToken: string = (() => {
    if (t !== 'database_task') return '';
    const cfg = (question as any).config;
    if (!cfg || typeof cfg !== 'object') return '';
    if (typeof cfg.embedToken === 'string' && cfg.embedToken) return cfg.embedToken;
    if (typeof cfg.embedUrl === 'string' && cfg.embedUrl) {
      const m = cfg.embedUrl.match(/[?&]embed=([A-Za-z0-9_-]+)/);
      return m ? m[1] : '';
    }
    return '';
  })();
  const dbEmbedUrl: string = dbEmbedToken
    ? `/data-sculptor/?embed=${encodeURIComponent(dbEmbedToken)}`
    : '';

  // For python_task / html_task we now embed the editor itself inline as a
  // sandbox (mirroring the Data Sculptor flow). The first time a pupil opens
  // the question we look for the per-question project — identified by a name
  // starting with the marker `[CW q<questionId>]` — and create it if it
  // doesn't exist. selectedProjectId then drives both the iframe src and the
  // existing submit() path (which already pulls the latest code from
  // /api/code-projects/<kind>/<id>).
  const cwProjectMarker = `[CW q${question.id.slice(0, 8)}]`;
  const cwProjectName = `${cwProjectMarker} ${(question.prompt || 'classwork task').slice(0, 60)}`;
  useEffect(() => {
    if (!codeProjectKind || preview) return;
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem('studentToken') || '';
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      try {
        const r = await fetch(`/api/code-projects/${codeProjectKind}`, { headers });
        if (!r.ok) { if (!cancelled) setCodeProjects([]); return; }
        const data = await r.json();
        const list: { id: string; name: string; updatedAt: number | null }[] = Array.isArray(data) ? data : [];
        let mine = list.find((p) => typeof p.name === 'string' && p.name.startsWith(cwProjectMarker));
        if (!mine) {
          const cr = await fetch(`/api/code-projects/${codeProjectKind}`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: cwProjectName, code: '' }),
          });
          if (cr.ok) {
            const created = await cr.json();
            mine = { id: created.id, name: created.name, updatedAt: created.updatedAt ?? null };
            list.unshift(mine);
          }
        }
        if (cancelled) return;
        setCodeProjects(list);
        if (mine) setSelectedProjectId(mine.id);
      } catch {
        if (!cancelled) setCodeProjects([]);
      }
    })();
    return () => { cancelled = true; };
  }, [codeProjectKind, preview, question.id]);
  const uploadKind: 'screenshot' | 'project' | null =
    t === 'screenshot' ? 'screenshot'
      : t === 'project' || t === 'presentation' ? 'project'
      : null;
  const acceptAttr = uploadKind === 'screenshot'
    ? 'image/*'
    : t === 'presentation'
      ? '.pptx'
      : '.jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.sql,.py,.vb,.html,.htm,.css,.js,.ts,.json,.xml,.md,.sb3,.hex,.zip,.docx,.pptx,.xlsx';

  async function pickFile(file: File) {
    if (!uploadKind) return;
    if (preview) {
      setFileUrl('preview://' + file.name);
      setFileName(file.name);
      setMsg(`Selected ${file.name} (preview only — not uploaded).`);
      return;
    }
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('studentToken');
      const r = await fetch(`/api/classwork/upload/${uploadKind}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Upload failed');
      setFileUrl(data.url);
      setFileName(data.filename || file.name);
      setMsg(`Uploaded ${data.filename || file.name}.`);
    } catch (e: any) {
      setMsg(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // Holds the AI feedback the teacher sees after pressing Submit in preview
  // mode. Kept separate from `msg` (the one-line status) and from `last` (the
  // pupil's real previous submission, which preview must never overwrite).
  // Cleared whenever the question is re-attempted.
  const [previewResult, setPreviewResult] = useState<
    { marksAwarded: number | null; feedback: string | null; maxMarks: number; note?: string } | null
  >(null);

  // ─── Auto-save in-progress drafts ────────────────────────────────────
  // Question types whose answer surface is a normal field that we own
  // (text/option/url/file/cell-grid). For everything else — code editor
  // tasks, the database sandbox, no-answer notes — the data either
  // persists in its own store already or there's nothing to save.
  const draftableTypes: string[] = [
    'short', 'long', 'code', 'multiple_choice', 'video_question', 'sql_task',
    'scratch_link', 'makecode_link', 'google_sites_link',
    'screenshot', 'project', 'presentation',
    'fill_in_blanks', 'table', 'labeled_inputs',
    // Fun-activity types — same JSON-into-text_answer storage as fill-in-blanks
    // so the cell-grid draft path picks them up for free.
    'crossword', 'word_search', 'matching', 'anagrams',
    // Games — same JSON-into-text_answer storage as fun activities.
    'hangman', 'speed_round', 'ordering', 'caesar_cipher', 'spot_phish',
    'binary_hex', 'bit_ops', 'code_tracer', 'flowchart_seq', 'sorting_race',
    'convert_relay', 'url_anatomy', 'truth_table', 'field_type_sort', 'io_sort', 'html_match',
    'password_forge', 'privacy_radar', 'validation_rules', 'find_duplicate', 'bin_search', 'box_model',
    'friend_or_fake', 'dm_danger', 'upstander', 'malware_triage', '2fa_escape', 'a11y_audit', 'fetch_execute',
    'screen_time', 'footprint_trail', 'social_engineer', 'cipher_quest', 'normalise_it', 'subnet_calc',
    'phish_inbox', 'build_pc', 'os_sched', 'query_visual', 'schema_arch', 'tag_soup_repair', 'selector_golf', 'css_sliders',
    'mindmap',
    // File upload — file content stored as JSON in text_answer.
    'file_upload',
  ];
  const draftEnabled = !preview && draftableTypes.includes(t);

  // Compute what would be saved right now from the live input state.
  // Mirrors the field-routing in submit() so a draft round-trips back
  // into exactly the same input slots when the pupil reloads.
  function currentDraftPayload(): {
    textAnswer: string | null;
    selectedOptionLabel: string | null;
    linkUrl: string | null;
    fileUrl: string | null;
  } {
    const empty = { textAnswer: null, selectedOptionLabel: null, linkUrl: null, fileUrl: null };
    if (t === 'multiple_choice') return { ...empty, selectedOptionLabel: option || null };
    if (['scratch_link', 'makecode_link', 'google_sites_link'].includes(t)) {
      return { ...empty, linkUrl: url || null };
    }
    if (t === 'screenshot' || t === 'presentation') {
      return { ...empty, fileUrl: fileUrl || null };
    }
    if (t === 'project') {
      return { ...empty, fileUrl: fileUrl || null, linkUrl: url || null };
    }
    if (t === 'fill_in_blanks' || t === 'table' || t === 'labeled_inputs'
        || t === 'crossword' || t === 'word_search' || t === 'matching' || t === 'anagrams' || t === 'hangman' || t === 'speed_round' || t === 'ordering' || t === 'caesar_cipher' || t === 'spot_phish' || t === 'binary_hex' || t === 'bit_ops' || t === 'code_tracer' || t === 'flowchart_seq' || t === 'sorting_race' || t === 'convert_relay' || t === 'url_anatomy' || t === 'truth_table' || t === 'field_type_sort' || t === 'io_sort' || t === 'html_match' || t === 'password_forge' || t === 'privacy_radar' || t === 'validation_rules' || t === 'find_duplicate' || t === 'bin_search' || t === 'box_model' || t === 'friend_or_fake' || t === 'dm_danger' || t === 'malware_triage' || t === '2fa_escape' || t === 'a11y_audit' || t === 'fetch_execute' || t === 'screen_time' || t === 'footprint_trail' || t === 'social_engineer' || t === 'cipher_quest' || t === 'normalise_it' || t === 'subnet_calc' || t === 'phish_inbox' || t === 'build_pc' || t === 'os_sched' || t === 'query_visual' || t === 'schema_arch' || t === 'tag_soup_repair' || t === 'selector_golf' || t === 'css_sliders' || t === 'upstander' || t === 'mindmap') {
      const filled = Object.values(cellAnswers).some((v) => {
        if (Array.isArray(v)) return v.length > 0;
        return String(v || '').trim();
      });
      return { ...empty, textAnswer: filled ? JSON.stringify(cellAnswers) : null };
    }
    if (t === 'file_upload' || t === 'file_task') {
      return {
        ...empty,
        textAnswer: (fileName && text) ? JSON.stringify({ filename: fileName, content: text }) : null,
        linkUrl: url.trim() || null,
      };
    }
    // short / long / code / video_question / sql_task — plain textarea.
    return { ...empty, textAnswer: text || null };
  }
  function isPayloadEmpty(p: ReturnType<typeof currentDraftPayload>): boolean {
    return !p.textAnswer && !p.selectedOptionLabel && !p.linkUrl && !p.fileUrl;
  }

  // Tracks "have we copied the server-side draft into our inputs yet"
  // so the auto-save effect doesn't immediately re-PUT the same data
  // back, and so a late draft prop arrival doesn't clobber what the
  // pupil has just started typing.
  const draftHydrated = useRef(false);
  // JSON of the most recent payload we sent — used to short-circuit
  // identical re-saves and to power the visibility/unload flush check.
  const lastSavedJson = useRef<string>(JSON.stringify({
    textAnswer: null, selectedOptionLabel: null, linkUrl: null, fileUrl: null,
  }));

  // One-shot draft → inputs hydration. Runs the first time we see the
  // draft prop after mount. If there's no draft, we simply mark
  // ourselves hydrated so the auto-save effect can take over.
  useEffect(() => {
    if (!draftEnabled || draftHydrated.current) return;
    if (draft) {
      if (draft.text_answer != null) {
        if (t === 'fill_in_blanks' || t === 'table' || t === 'labeled_inputs'
            || t === 'crossword' || t === 'word_search' || t === 'matching' || t === 'anagrams' || t === 'hangman' || t === 'speed_round' || t === 'ordering' || t === 'caesar_cipher' || t === 'spot_phish' || t === 'binary_hex' || t === 'bit_ops' || t === 'code_tracer' || t === 'flowchart_seq' || t === 'sorting_race' || t === 'convert_relay' || t === 'url_anatomy' || t === 'truth_table' || t === 'field_type_sort' || t === 'io_sort' || t === 'html_match' || t === 'password_forge' || t === 'privacy_radar' || t === 'validation_rules' || t === 'find_duplicate' || t === 'bin_search' || t === 'box_model' || t === 'friend_or_fake' || t === 'dm_danger' || t === 'malware_triage' || t === '2fa_escape' || t === 'a11y_audit' || t === 'fetch_execute' || t === 'screen_time' || t === 'footprint_trail' || t === 'social_engineer' || t === 'cipher_quest' || t === 'normalise_it' || t === 'subnet_calc' || t === 'phish_inbox' || t === 'build_pc' || t === 'os_sched' || t === 'query_visual' || t === 'schema_arch' || t === 'tag_soup_repair' || t === 'selector_golf' || t === 'css_sliders' || t === 'upstander' || t === 'mindmap') {
          try {
            const parsed = JSON.parse(draft.text_answer);
            if (parsed && typeof parsed === 'object') setCellAnswers(parsed);
          } catch { /* malformed — discard silently */ }
        } else if (t === 'file_upload') {
          try {
            const parsed = JSON.parse(draft.text_answer);
            if (parsed?.filename) setFileName(parsed.filename);
            if (parsed?.content) setText(parsed.content);
          } catch { /* malformed — discard silently */ }
        } else {
          setText(draft.text_answer);
        }
      }
      if (draft.selected_option_label != null) setOption(draft.selected_option_label);
      if (draft.link_url != null) setUrl(draft.link_url);
      if (draft.file_url != null) {
        setFileUrl(draft.file_url);
        setFileName(draft.file_url.split('/').pop() || 'attachment');
      }
      lastSavedJson.current = JSON.stringify({
        textAnswer: draft.text_answer,
        selectedOptionLabel: draft.selected_option_label,
        linkUrl: draft.link_url,
        fileUrl: draft.file_url,
      });
      setDraftStatus('saved');
    }
    draftHydrated.current = true;
  }, [draft, draftEnabled, t]);

  // When the teacher unlocks this question while the student already has the
  // page open, pre-fill the inputs from their last submission so they can see
  // what they wrote and revise it. Only fires once per unlock event; a draft
  // that already exists (from an earlier auto-save) takes priority over the
  // stale submission data.
  const unlockHydrated = useRef(false);
  useEffect(() => {
    if (!isUnlocked || !last || unlockHydrated.current) return;
    if (draft) { unlockHydrated.current = true; return; } // draft wins
    if (!draftEnabled) { unlockHydrated.current = true; return; } // non-text type
    // Hydrate inputs from the previous submission.
    if (last.text_answer != null) {
      if (t === 'fill_in_blanks' || t === 'table' || t === 'labeled_inputs'
          || t === 'crossword' || t === 'word_search' || t === 'matching' || t === 'anagrams' || t === 'hangman' || t === 'speed_round' || t === 'ordering' || t === 'caesar_cipher' || t === 'spot_phish' || t === 'binary_hex' || t === 'bit_ops' || t === 'code_tracer' || t === 'flowchart_seq' || t === 'sorting_race' || t === 'convert_relay' || t === 'url_anatomy' || t === 'truth_table' || t === 'field_type_sort' || t === 'io_sort' || t === 'html_match' || t === 'password_forge' || t === 'privacy_radar' || t === 'validation_rules' || t === 'find_duplicate' || t === 'bin_search' || t === 'box_model' || t === 'friend_or_fake' || t === 'dm_danger' || t === 'malware_triage' || t === '2fa_escape' || t === 'a11y_audit' || t === 'fetch_execute' || t === 'screen_time' || t === 'footprint_trail' || t === 'social_engineer' || t === 'cipher_quest' || t === 'normalise_it' || t === 'subnet_calc' || t === 'phish_inbox' || t === 'build_pc' || t === 'os_sched' || t === 'query_visual' || t === 'schema_arch' || t === 'tag_soup_repair' || t === 'selector_golf' || t === 'css_sliders' || t === 'upstander' || t === 'mindmap') {
        try {
          const parsed = JSON.parse(last.text_answer);
          if (parsed && typeof parsed === 'object') setCellAnswers(parsed);
        } catch { /* malformed */ }
      } else if (t === 'file_upload') {
        try {
          const parsed = JSON.parse(last.text_answer);
          if (parsed?.filename) setFileName(parsed.filename);
          if (parsed?.content) setText(parsed.content);
        } catch { /* malformed */ }
      } else {
        setText(last.text_answer);
      }
    }
    if (last.selected_option_label != null) setOption(last.selected_option_label);
    if (last.link_url != null) setUrl(last.link_url);
    if (last.file_url != null) {
      setFileUrl(last.file_url);
      setFileName(last.file_url.split('/').pop() || 'attachment');
    }
    unlockHydrated.current = true;
  }, [isUnlocked, last, draft, draftEnabled, t]);

  // Centralised draft writer used by both the debounced save and the
  // visibility/unload flush. `keepalive` lets the request finish even
  // when the page is being torn down.
  async function writeDraft(payload: ReturnType<typeof currentDraftPayload>, keepalive: boolean): Promise<boolean> {
    const token = localStorage.getItem('studentToken') || '';
    const empty = isPayloadEmpty(payload);
    try {
      const res = await fetch(`/api/classwork/questions/${question.id}/draft`, {
        method: empty ? 'DELETE' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: empty ? undefined : JSON.stringify(payload),
        keepalive,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Debounced auto-save — fires ~1.2 s after the pupil's last keystroke
  // or input change. Skips identical resaves so an idle textarea never
  // hits the server.
  const draftTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!draftEnabled || !draftHydrated.current) return;
    const payload = currentDraftPayload();
    const json = JSON.stringify(payload);
    if (json === lastSavedJson.current) return;
    setDraftStatus('saving');
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(async () => {
      const ok = await writeDraft(payload, false);
      if (ok) {
        lastSavedJson.current = json;
        setDraftStatus('saved');
      } else {
        setDraftStatus('error');
      }
    }, 1200);
    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, option, url, fileUrl, fileName, cellAnswers, draftEnabled]);

  // Force-flush on tab close / page hide so a pupil who slams the lid
  // mid-sentence still keeps their work. Listeners are registered once;
  // the flush function reads the current input state via a ref so we
  // don't need to re-attach on every keystroke.
  const flushRef = useRef<() => void>(() => {});
  flushRef.current = () => {
    if (!draftEnabled || !draftHydrated.current) return;
    if (draftTimer.current) {
      window.clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    const payload = currentDraftPayload();
    const json = JSON.stringify(payload);
    if (json === lastSavedJson.current) return;
    // keepalive = true so the request survives the navigation/unload.
    void writeDraft(payload, true);
    lastSavedJson.current = json;
  };
  useEffect(() => {
    if (!draftEnabled) return;
    const onPageHide = () => flushRef.current();
    const onVisibility = () => { if (document.visibilityState === 'hidden') flushRef.current(); };
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      // Final flush when the answer card unmounts (e.g. the lesson
      // re-renders after a sibling submit) so nothing in flight is lost.
      flushRef.current();
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [draftEnabled]);

  async function submit() {
    setBusy(true);
    setMsg(preview ? 'Running AI marker…' : 'Submitting and marking…');
    if (preview) setPreviewResult(null);
    try {
      const body: any = {};
      if (t === 'multiple_choice') body.selectedOptionLabel = option;
      else if (['scratch_link', 'makecode_link', 'google_sites_link'].includes(t)) body.linkUrl = url;
      else if (t === 'screenshot') body.fileUrl = fileUrl;
      else if (t === 'presentation') body.fileUrl = fileUrl;
      else if (t === 'project') {
        if (fileUrl) body.fileUrl = fileUrl;
        if (url) body.linkUrl = url;
      } else if (codeProjectKind) {
        // python_task / html_task — in real submission we pull the latest code
        // from the chosen project. In preview mode the teacher hasn't picked
        // (or created) a project, so we just send whatever they've typed in
        // the textarea below as a quick code sample for the AI to mark.
        if (preview) {
          body.textAnswer = text;
        } else {
          if (!selectedProjectId) throw new Error('Please pick a project to submit.');
          const token = localStorage.getItem('studentToken') || '';
          const r = await fetch(`/api/code-projects/${codeProjectKind}/${encodeURIComponent(selectedProjectId)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (!r.ok) throw new Error('Could not load that project.');
          const data = await r.json();
          body.textAnswer = String(data?.code ?? '');
          body.linkUrl = `${selectedProjectId}|${data?.name || ''}`;
        }
      } else if (t === 'fill_in_blanks' || t === 'table' || t === 'labeled_inputs'
                 || t === 'crossword' || t === 'word_search' || t === 'matching' || t === 'anagrams' || t === 'hangman' || t === 'speed_round' || t === 'ordering' || t === 'caesar_cipher' || t === 'spot_phish' || t === 'binary_hex' || t === 'bit_ops' || t === 'code_tracer' || t === 'flowchart_seq' || t === 'sorting_race' || t === 'convert_relay' || t === 'url_anatomy' || t === 'truth_table' || t === 'field_type_sort' || t === 'io_sort' || t === 'html_match' || t === 'password_forge' || t === 'privacy_radar' || t === 'validation_rules' || t === 'find_duplicate' || t === 'bin_search' || t === 'box_model' || t === 'friend_or_fake' || t === 'dm_danger' || t === 'malware_triage' || t === '2fa_escape' || t === 'a11y_audit' || t === 'fetch_execute' || t === 'screen_time' || t === 'footprint_trail' || t === 'social_engineer' || t === 'cipher_quest' || t === 'normalise_it' || t === 'subnet_calc' || t === 'phish_inbox' || t === 'build_pc' || t === 'os_sched' || t === 'query_visual' || t === 'schema_arch' || t === 'tag_soup_repair' || t === 'selector_golf' || t === 'css_sliders' || t === 'upstander' || t === 'mindmap') {
        // Send the cell answers as JSON so the deterministic marker can
        // compare each one against the expected answers in the question config.
        // Same path serves the four fun-activity types — each renderer above
        // packs its own shape into cellAnswers and the server picks it apart.
        body.textAnswer = JSON.stringify(cellAnswers);
      } else if (t === 'database_task') {
        // Resolve the pupil's DS embed sandbox from their session key
        // (mirrored to localStorage by the embed app on the same origin).
        // In preview mode the teacher has no DS sandbox of their own, so we
        // skip the AI call and tell them up front rather than 500ing.
        if (preview) {
          setPreviewResult({
            marksAwarded: null, feedback: null, maxMarks: question.max_marks,
            note: 'Database tasks need a real pupil sandbox to mark, so this task type can\u2019t be tried in preview. Open the database link to sanity-check it manually.',
          });
          setMsg(null);
          return;
        }
        if (!dbEmbedToken) throw new Error('This task is missing its database link. Ask your teacher to add one.');
        const sessionKey = localStorage.getItem('student_session_key');
        if (!sessionKey) throw new Error('Please open the database first, do your work, then come back and submit.');
        body.linkUrl = `${dbEmbedToken}|${sessionKey}`;
      } else if (t === 'file_upload' || t === 'file_task') {
        if (!fileName && !url.trim()) throw new Error('Please upload a file or paste a share link.');
        if (fileName && text) body.textAnswer = JSON.stringify({ filename: fileName, content: text });
        if (url.trim()) body.linkUrl = url.trim();
      } else body.textAnswer = text; // short / long / code / video_question / sql_task

      if (preview) {
        // Dry-run: hit the teacher-only /try endpoint which runs the same AI
        // marker but does NOT touch the submissions table.
        const tryResult = await api<{
          marksAwarded: number | null; feedback: string | null; maxMarks: number; note?: string;
        }>(`/api/classwork/questions/${question.id}/try`, {
          method: 'POST', body: JSON.stringify(body),
        });
        setPreviewResult(tryResult);
        setMsg(null);
        // Note: do NOT clear inputs or call onSubmitted() — the teacher may
        // want to tweak their answer and re-run the marker to see how the
        // feedback changes.
        return;
      }

      const result = await api<Submission>(`/api/classwork/questions/${question.id}/submit`, {
        method: 'POST', body: JSON.stringify(body),
      });
      if (result.marks_awarded != null) {
        setMsg(`Marked: ${result.marks_awarded}/${question.max_marks}`);
      } else {
        setMsg('Submitted — your teacher will mark this soon.');
      }
      setText(''); setOption(''); setUrl(''); setFileUrl(''); setFileName('');
      setCellAnswers({});
      // The server's createSubmission() already wiped the draft row, so
      // reset our local "what did we last save" trackers to match. That
      // way the auto-save effect doesn't try to PUT an empty draft on
      // top of nothing on the next render.
      lastSavedJson.current = JSON.stringify({
        textAnswer: null, selectedOptionLabel: null, linkUrl: null, fileUrl: null,
      });
      setDraftStatus('idle');
      onSubmitted();
    } catch (e: any) {
      setMsg(e.message || 'Failed to submit');
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    t === 'multiple_choice' ? !!option :
    t === 'screenshot' ? !!fileUrl :
    t === 'presentation' ? !!fileUrl :
    t === 'project' ? !!(fileUrl || url) :
    t === 'file_upload' || t === 'file_task' ? !!(fileName && text) || !!url.trim() :
    ['scratch_link', 'makecode_link', 'google_sites_link'].includes(t) ? !!url :
    codeProjectKind ? !!selectedProjectId :
    t === 'database_task' ? !!dbEmbedToken :
    (t === 'fill_in_blanks' || t === 'table' || t === 'labeled_inputs'
      || t === 'crossword' || t === 'word_search' || t === 'matching' || t === 'anagrams' || t === 'hangman' || t === 'speed_round' || t === 'ordering' || t === 'caesar_cipher' || t === 'spot_phish' || t === 'binary_hex' || t === 'bit_ops' || t === 'code_tracer' || t === 'flowchart_seq' || t === 'sorting_race' || t === 'convert_relay' || t === 'url_anatomy' || t === 'truth_table' || t === 'field_type_sort' || t === 'io_sort' || t === 'html_match' || t === 'password_forge' || t === 'privacy_radar' || t === 'validation_rules' || t === 'find_duplicate' || t === 'bin_search' || t === 'box_model' || t === 'friend_or_fake' || t === 'dm_danger' || t === 'malware_triage' || t === '2fa_escape' || t === 'a11y_audit' || t === 'fetch_execute' || t === 'screen_time' || t === 'footprint_trail' || t === 'social_engineer' || t === 'cipher_quest' || t === 'normalise_it' || t === 'subnet_calc' || t === 'phish_inbox' || t === 'build_pc' || t === 'os_sched' || t === 'query_visual' || t === 'schema_arch' || t === 'tag_soup_repair' || t === 'selector_golf' || t === 'css_sliders' || t === 'upstander' || t === 'mindmap')
      ? Object.values(cellAnswers).some((v) => {
          if (Array.isArray(v)) return v.length > 0;
          return !!String(v || '').trim();
        }) :
    !!text.trim();
  // ── Locked state ─────────────────────────────────────────────────────────
  // Once a student has submitted, hide the answer form entirely. Only show it
  // again if the teacher has explicitly unlocked this question for them.
  if (last && !isUnlocked && !preview) {
    return (
      <div style={{
        marginTop: 12, padding: '14px 16px',
        border: '1.5px solid var(--cw-tint-success-border)', borderRadius: 8,
        background: 'var(--cw-tint-success-bg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>✅</span>
          <span style={{ fontWeight: 700, color: 'var(--cw-tint-success-ink)', fontSize: 14 }}>
            Submitted {new Date(last.submitted_at).toLocaleString()}
            {last.marks_awarded != null && (
              <> &middot; {last.marks_awarded}/{question.max_marks} mark{question.max_marks === 1 ? '' : 's'}</>
            )}
          </span>
        </div>
        {last.ai_feedback && (
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--cw-ink)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {last.ai_feedback}
          </div>
        )}
        <p style={{ marginTop: 10, marginBottom: 0, fontSize: 12, color: 'var(--cw-muted)' }}>
          Your answer is locked. Ask your teacher if you need to revise it.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12, padding: 12, border: '1px dashed var(--cw-border)', borderRadius: 8, background: 'var(--cw-surface-soft)' }}>
      {/* ── Unlocked banner ── shown when teacher has allowed a resubmit */}
      {isUnlocked && last && (
        <div style={{
          marginBottom: 12, padding: '8px 12px',
          background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 8,
          fontSize: 13, color: '#1e40af', display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1.2, flexShrink: 0 }}>🔓</span>
          <span>Your teacher has unlocked this question. Revise your answer below and resubmit when you&rsquo;re ready.</span>
        </div>
      )}
      {t === 'multiple_choice' && Array.isArray(question.options) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {question.options.map((opt: any, i: number) => (
            <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="radio" name={`mc-${question.id}`} value={opt.label || String(i)}
                checked={option === (opt.label || String(i))}
                onChange={(e) => setOption(e.target.value)} />
              <span>{opt.text || opt.label || `Option ${i + 1}`}</span>
            </label>
          ))}
        </div>
      )}

      {(t === 'scratch_link' || t === 'makecode_link' || t === 'google_sites_link') && (
        <input type="url" placeholder="https://…" value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--cw-border)' }} />
      )}

      {t === 'fill_in_blanks' && (() => {
        const cfg = (question as any).config;
        const blanks: { id: string }[] = cfg && Array.isArray(cfg.blanks)
          ? cfg.blanks.map((b: any) => ({ id: String(b?.id ?? '') })).filter((b: any) => b.id)
          : [];
        if (blanks.length === 0) {
          return <span style={{ color: 'var(--cw-muted)', fontSize: 13 }}>This task has no blanks set up yet. Ask your teacher to fix it.</span>;
        }
        // Render the prompt with text inputs substituted in for each {{n}}
        // marker. Anything between markers is plain text shown around them.
        const parts = (question.prompt || '').split(/(\{\{\s*[A-Za-z0-9_]+\s*\}\})/g);
        const usedIds = new Set<string>();
        return (
          <div style={{ display: 'block', lineHeight: 2.2, fontSize: 15 }}>
            {parts.map((part, i) => {
              const m = part.match(/^\{\{\s*([A-Za-z0-9_]+)\s*\}\}$/);
              if (!m) return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
              const id = m[1];
              usedIds.add(id);
              return (
                <input
                  key={i}
                  type="text"
                  value={cellAnswers[id] || ''}
                  onChange={(e) => setCellAnswers({ ...cellAnswers, [id]: e.target.value })}
                  placeholder={`(${id})`}
                  style={{
                    display: 'inline-block', minWidth: 90, margin: '0 4px',
                    padding: '4px 8px', borderRadius: 6,
                    border: '2px solid var(--cw-accent)', background: 'var(--cw-surface)',
                    fontSize: 14,
                  }}
                />
              );
            })}
            {/* Any blanks that aren't referenced from the prompt still need an input */}
            {blanks.filter((b) => !usedIds.has(b.id)).length > 0 && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--cw-muted)' }}>
                Extra blanks:
                {blanks.filter((b) => !usedIds.has(b.id)).map((b) => (
                  <span key={b.id} style={{ marginLeft: 8 }}>
                    {b.id}:&nbsp;
                    <input
                      type="text" value={cellAnswers[b.id] || ''}
                      onChange={(e) => setCellAnswers({ ...cellAnswers, [b.id]: e.target.value })}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--cw-border)' }}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {t === 'table' && (() => {
        const cfg = (question as any).config;
        const table = cfg && cfg.table;
        if (!table || !Array.isArray(table.headers) || !Array.isArray(table.rows)) {
          return <span style={{ color: 'var(--cw-muted)', fontSize: 13 }}>This table isn't set up yet. Ask your teacher to fix it.</span>;
        }
        return (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
              <thead>
                <tr>
                  {table.headers.map((h: string, i: number) => (
                    <th key={i} style={{
                      border: '1px solid var(--cw-border)', padding: '8px 10px',
                      background: '#1e3a8a', color: '#fff', textAlign: 'left',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row: any[], r: number) => (
                  <tr key={r}>
                    {Array.isArray(row) && row.map((cell: any, c: number) => (
                      <td key={c} style={{
                        border: '1px solid var(--cw-border)', padding: '6px 8px',
                        background: cell?.blank ? 'var(--cw-tint-amber-bg)' : 'var(--cw-surface)',
                      }}>
                        {cell?.blank ? (
                          <input
                            type="text"
                            value={cellAnswers[`${r},${c}`] || ''}
                            onChange={(e) => setCellAnswers({ ...cellAnswers, [`${r},${c}`]: e.target.value })}
                            style={{
                              width: '100%', padding: '4px 6px', borderRadius: 4,
                              border: '2px solid var(--cw-accent)', background: 'var(--cw-surface)', fontSize: 14,
                            }}
                          />
                        ) : (
                          <span>{String(cell?.value ?? '')}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}

      {t === 'labeled_inputs' && (() => {
        const cfg = (question as any).config;
        const fields: { label: string; multiline?: boolean } [] = cfg && Array.isArray(cfg.fields)
          ? cfg.fields.map((f: any) => ({ label: String(f?.label || ''), multiline: !!f?.multiline }))
          : [];
        if (fields.length === 0) {
          return <span style={{ color: 'var(--cw-muted)', fontSize: 13 }}>No fields are set up yet. Ask your teacher to fix it.</span>;
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fields.map((f, i) => (
              <label key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
                <span style={{ fontWeight: 600 }}>{f.label || `Field ${i + 1}`}</span>
                {f.multiline ? (
                  <textarea
                    rows={3}
                    value={cellAnswers[String(i)] || ''}
                    onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}
                    placeholder=""
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }}
                  />
                ) : (
                  <input
                    type="text"
                    value={cellAnswers[String(i)] || ''}
                    onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--cw-border)' }}
                  />
                )}
              </label>
            ))}
          </div>
        );
      })()}

      {/* ---- Fun activities (auto-marked) ---------------------------- */}
      {t === 'crossword' && (
        <CrosswordPupilGrid
          config={(question as any).config}
          cellAnswers={cellAnswers}
          setCellAnswers={setCellAnswers}
        />
      )}
      {t === 'word_search' && (
        <WordSearchPupilGrid
          config={(question as any).config}
          cellAnswers={cellAnswers}
          setCellAnswers={setCellAnswers}
        />
      )}
      {t === 'matching' && (
        <MatchingPupilUI
          config={(question as any).config}
          cellAnswers={cellAnswers}
          setCellAnswers={setCellAnswers}
        />
      )}
      {t === 'anagrams' && (
        <AnagramsPupilUI
          config={(question as any).config}
          cellAnswers={cellAnswers}
          setCellAnswers={setCellAnswers}
        />
      )}
      {t === 'hangman' && (
        <HangmanPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'speed_round' && (
        <SpeedRoundPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'ordering' && (
        <OrderingPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} questionId={question.id} />
      )}
      {t === 'caesar_cipher' && (
        <CaesarPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'spot_phish' && (
        <SpotPhishPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'binary_hex' && (
        <BinaryHexPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} questionId={question.id} />
      )}
      {t === 'bit_ops' && (
        <BitOpsPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} questionId={question.id} />
      )}
      {t === 'code_tracer' && (
        <CodeTracerPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'flowchart_seq' && (
        <FlowchartPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} questionId={question.id} />
      )}
      {t === 'sorting_race' && (
        <SortingRacePupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'convert_relay' && (
        <ConvertRelayPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} questionId={question.id} />
      )}
      {t === 'url_anatomy' && (
        <UrlAnatomyPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'truth_table' && (
        <TruthTablePupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'field_type_sort' && (
        <FieldTypeSortPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'io_sort' && (
        <IoSortPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'html_match' && (
        <HtmlMatchPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'password_forge' && (
        <PasswordForgePupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'privacy_radar' && (
        <PrivacyRadarPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'validation_rules' && (
        <ValidationRulesPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'find_duplicate' && (
        <FindDuplicatePupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'bin_search' && (
        <BinSearchPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'box_model' && (
        <BoxModelPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'friend_or_fake' && (
        <FriendOrFakePupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'dm_danger' && (
        <DmDangerPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'upstander' && (
        <UpstanderPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'malware_triage' && (
        <MalwareTriagePupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === '2fa_escape' && (
        <TwoFactorEscapePupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'a11y_audit' && (
        <A11yAuditPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'fetch_execute' && (
        <FetchExecutePupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'screen_time' && (
        <ScreenTimePupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'footprint_trail' && (
        <FootprintTrailPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'social_engineer' && (
        <SocialEngineerPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'cipher_quest' && (
        <CipherQuestPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'normalise_it' && (
        <NormaliseItPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'subnet_calc' && (
        <SubnetCalcPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'phish_inbox' && (
        <PhishInboxPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'build_pc' && (
        <BuildPcPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'os_sched' && (
        <OsSchedPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'query_visual' && (
        <QueryVisualPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'schema_arch' && (
        <SchemaArchPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'tag_soup_repair' && (
        <TagSoupRepairPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'selector_golf' && (
        <SelectorGolfPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'css_sliders' && (
        <CssSlidersPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}
      {t === 'mindmap' && (
        <MindmapPupilUI config={(question as any).config} cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />
      )}

      {(t === 'short' || t === 'long' || t === 'code' || t === 'video_question') && (
        <textarea
          rows={t === 'short' ? 3 : 8}
          placeholder={t === 'video_question' ? 'Watch the video above, then write your answer here…' : undefined}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--cw-border)', fontFamily: t === 'code' ? 'JetBrains Mono, monospace' : 'inherit' }}
        />
      )}

      {codeProjectKind && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
            Write and run your {codeProjectKind === 'python' ? 'Python' : 'HTML/CSS'} below.
            Your work is auto-saved to your account. When you're done, click Submit and the AI
            will mark your latest saved code.
          </div>
          {codeProjects === null || !selectedProjectId ? (
            <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>Loading your editor…</div>
          ) : (
            <>
              <div style={{ width: '100%', height: 560, border: '1px solid var(--cw-border)', borderRadius: 8, overflow: 'hidden', background: 'var(--cw-surface)' }}>
                <iframe
                  src={`${editorHref(selectedProjectId)}&embed=1`}
                  title={`${codeProjectKind === 'python' ? 'Python' : 'HTML/CSS'} editor`}
                  style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                  allow="clipboard-read; clipboard-write"
                />
              </div>
              <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>
                Need more space?{' '}
                <a
                  href={editorHref(selectedProjectId)}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--cw-accent)' }}
                >Open this project in a full editor tab</a>
                . Your saves sync both ways.
              </div>
            </>
          )}
        </div>
      )}

      {t === 'database_task' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
            {dbEmbedUrl
              ? 'Open the database in Data Sculptor and complete the task in there. When you\u2019re done, come back to this page and click Submit \u2014 the AI will mark the database you built.'
              : 'This task is missing a database link. Ask your teacher to add one.'}
          </div>
          {dbEmbedUrl && (
            <div>
              <a
                href={dbEmbedUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '8px 12px', borderRadius: 8, background: 'var(--cw-accent)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
              >Open the database</a>
            </div>
          )}
        </div>
      )}

      {t === 'sql_task' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
            {sqlDbUrl
              ? 'Open the database in Data Sculptor, work out and run your query, then paste the SQL below.'
              : 'Write your SQL query below and submit it for marking.'}
          </div>
          {sqlDbUrl && (
            <div>
              <a
                href={sqlDbUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '8px 12px', borderRadius: 8, background: 'var(--cw-accent)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
              >Open the database</a>
            </div>
          )}
          <textarea
            rows={6}
            placeholder="SELECT * FROM table_name WHERE …"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--cw-border)', fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: 13 }}
          />
        </div>
      )}

      {uploadKind && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="file"
            accept={acceptAttr}
            disabled={uploading || busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickFile(f);
            }}
          />
          {fileName && (
            <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
              Attached: <strong>{fileName}</strong>{' '}
              <button type="button" onClick={() => { setFileUrl(''); setFileName(''); }}
                style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--cw-accent)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                remove
              </button>
            </div>
          )}
          {t === 'project' && (
            <input
              type="url"
              placeholder="Or paste a project link (Scratch, MakeCode, Google Sites, …) — optional"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--cw-border)' }}
            />
          )}
        </div>
      )}

      {(t === 'file_upload' || t === 'file_task') && (() => {
        const ACCEPTED = '.txt,.py,.csv,.html,.htm,.js';
        async function handleFile(f: File) {
          if (f.size > 200 * 1024) {
            setMsg('File too large — please keep it under 200 KB.');
            return;
          }
          try {
            const content = await f.text();
            setText(content);
            setFileName(f.name);
            setMsg(null);
          } catch {
            setMsg('Could not read the file. Make sure it is a plain text or code file.');
          }
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Drop zone — click or drag a file onto it */}
            <label
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setFileDragOver(true); }}
              onDragLeave={(e) => { if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setFileDragOver(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setFileDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '28px 20px', borderRadius: 10, cursor: busy ? 'not-allowed' : 'pointer',
                border: `2px dashed ${fileDragOver ? 'var(--cw-accent)' : 'var(--cw-border)'}`,
                background: fileDragOver ? 'var(--cw-tint-info-bg)' : 'var(--cw-surface-soft)',
                transition: 'border-color 150ms, background 150ms',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: 32, lineHeight: 1 }}>📂</span>
              <span style={{ fontWeight: 600, color: 'var(--cw-ink)', fontSize: 14 }}>
                {fileDragOver ? 'Drop to attach' : fileName ? 'Drop a new file to replace' : 'Drag & drop your file here'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--cw-muted)' }}>
                or click to browse — <strong>.txt .py .csv .html .js</strong> · max 200 KB
              </span>
              <input
                type="file"
                accept={ACCEPTED}
                disabled={busy}
                style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </label>

            {fileName && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 8,
                background: 'var(--cw-tint-success-bg)', border: '1px solid var(--cw-tint-success-border)',
                fontSize: 13,
              }}>
                <span style={{ fontSize: 16 }}>✓</span>
                <span style={{ fontWeight: 600, color: 'var(--cw-tint-success-ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
                <span style={{ color: 'var(--cw-muted)', flexShrink: 0 }}>{text.length.toLocaleString()} chars</span>
                <button
                  type="button"
                  onClick={() => { setText(''); setFileName(''); setMsg(null); }}
                  style={{ marginLeft: 4, background: 'none', border: 'none', color: 'var(--cw-accent)', cursor: 'pointer', textDecoration: 'underline', padding: 0, flexShrink: 0 }}
                >
                  remove
                </button>
              </div>
            )}

            {text && fileName && (
              <details>
                <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--cw-muted)' }}>
                  Preview contents
                </summary>
                <pre style={{
                  marginTop: 6, padding: '10px 12px', borderRadius: 8,
                  background: 'var(--cw-surface)', border: '1px solid var(--cw-border)',
                  fontSize: 12, lineHeight: 1.5, overflow: 'auto', maxHeight: 200,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>
                  {text.length > 2000 ? text.slice(0, 2000) + '\n… (preview truncated)' : text}
                </pre>
              </details>
            )}

            {/* Google Docs / Sheets / Drive share link alternative */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--cw-border)' }} />
              <span style={{ fontSize: 12, color: 'var(--cw-muted)', whiteSpace: 'nowrap' }}>OR paste a share link</span>
              <div style={{ flex: 1, height: 1, background: 'var(--cw-border)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                type="url"
                placeholder="Paste a Google Docs, Sheets or Drive share link…"
                value={url}
                disabled={busy}
                onChange={(e) => setUrl(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 14,
                  border: `1.5px solid ${url.trim() ? 'var(--cw-accent)' : 'var(--cw-border)'}`,
                  background: 'var(--cw-surface)', color: 'var(--cw-ink)',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 150ms',
                }}
              />
              <p style={{ margin: 0, fontSize: 12, color: 'var(--cw-muted)' }}>
                Make sure sharing is set to <strong>"Anyone with the link can view"</strong> before submitting.
              </p>
            </div>
          </div>
        );
      })()}

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={submit} disabled={busy || uploading || !canSubmit} style={{
          background: 'var(--cw-accent)', color: '#fff', border: 'none',
          padding: '8px 14px', borderRadius: 8, fontWeight: 600,
          cursor: (busy || uploading || !canSubmit) ? 'not-allowed' : 'pointer',
          opacity: (busy || uploading || !canSubmit) ? 0.6 : 1,
        }}>{busy ? 'Submitting…' : uploading ? 'Uploading…' : 'Submit'}</button>
        {msg && <span style={{ fontSize: 14, color: 'var(--cw-muted)' }}>{msg}</span>}
        {/* "Your draft is safe" indicator. Only shown for question types
            where we actually run the auto-save (draftEnabled), and only
            once we've started saving — otherwise idle answer cards would
            sport a confusing perpetual badge. */}
        {draftEnabled && draftStatus !== 'idle' && (
          <span style={{
            fontSize: 12,
            padding: '3px 8px',
            borderRadius: 999,
            border: '1px solid',
            ...(draftStatus === 'saving'
              ? { color: 'var(--cw-tint-amber-ink)', background: 'var(--cw-tint-amber-bg)', borderColor: 'var(--cw-tint-amber-border)' }
              : draftStatus === 'saved'
                ? { color: 'var(--cw-tint-success-ink)', background: 'var(--cw-tint-success-bg)', borderColor: 'var(--cw-tint-success-border)' }
                : { color: 'var(--cw-tint-danger-ink)', background: 'var(--cw-tint-danger-bg)', borderColor: 'var(--cw-tint-danger-border)' }),
          }} title="Your work is saved automatically as you type. If you close the tab, your answer will still be here when you come back.">
            {draftStatus === 'saving' ? 'Saving…' : draftStatus === 'saved' ? 'Draft saved' : 'Couldn\u2019t save draft'}
          </span>
        )}
      </div>

      {last && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--cw-muted)' }}>
          Last attempt: {new Date(last.submitted_at).toLocaleString()}
          {last.marks_awarded != null && <> · {last.marks_awarded}/{question.max_marks} marks</>}
          {last.ai_feedback && <div style={{ marginTop: 4, color: 'var(--cw-ink)' }}>{last.ai_feedback}</div>}
        </div>
      )}

      {preview && previewResult && (
        <div style={{
          marginTop: 12, padding: '10px 12px', background: 'var(--cw-tint-textonly-bg)',
          border: '1px solid var(--cw-tint-textonly-border)', borderRadius: 8, fontSize: 13,
          color: 'var(--cw-ink)',
        }}>
          <strong style={{ color: 'var(--cw-tint-textonly-ink)' }}>Preview AI feedback</strong>
          {previewResult.marksAwarded != null && (
            <> &middot; {previewResult.marksAwarded}/{previewResult.maxMarks} marks</>
          )}
          {previewResult.feedback && (
            <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{previewResult.feedback}</div>
          )}
          {previewResult.note && (
            <div style={{ marginTop: 6, color: 'var(--cw-muted)', fontStyle: 'italic' }}>
              {previewResult.note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   Fun-activity components (crossword / word search / matching / anagrams)

   Each activity has two surfaces:
     – A pupil-facing renderer used inside <StudentAnswer/> and only ever reads
       from `config` and writes into the shared `cellAnswers` bag.
     – A teacher-facing editor used inside <NewQuestionModal/> that builds the
       config that the pupil renderer will eventually consume.

   Pupil submissions are JSON-serialised into `text_answer` (same path as
   fill_in_blanks/table/labeled_inputs); the server-side markers in
   classwork-ai.ts are the source of truth for awarded marks.
   ============================================================================ */

// Tiny seedable PRNG so generated word-search grids and shuffled matching
// definitions are stable across renders (avoids React thrash and means a
// pupil sees the same layout if they reload mid-task).
function _gameRng(seed: string): () => number {
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) | 0;
  return () => {
    // Use positive-modulo trick: JS % can return negative values when s is
    // negative (which happens after 32-bit overflow in the seed loop), which
    // would make the Fisher-Yates swap index negative and corrupt the array.
    s = ((s * 9301 + 49297) % 233280 + 233280) % 233280;
    return s / 233280;
  };
}

function _scrambleWord(word: string, salt = ''): string {
  const upper = String(word).toUpperCase();
  // Multi-word: scramble each word independently so spaces are preserved and
  // each word's letters stay within that word (same length, same letters).
  if (upper.includes(' ')) {
    return upper
      .split(' ')
      .map((w, idx) => _scrambleWord(w, salt + idx))
      .join(' ');
  }
  const letters = upper.replace(/[^A-Z]/g, '').split('');
  if (letters.length < 2) return letters.join('');
  const rng = _gameRng(word + '|' + salt);
  // Keep scrambling until we get a different ordering than the original
  // (otherwise a short word can land on itself and look unscrambled).
  for (let attempt = 0; attempt < 8; attempt++) {
    const arr = letters.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (arr.join('') !== letters.join('')) return arr.join('');
  }
  // Fallback: rotate by one
  return letters.slice(1).concat(letters[0]).join('');
}

interface WSPlacement { word: string; r: number; c: number; dr: number; dc: number; reversed: boolean; }
function _generateWordSearchGrid(
  rows: number, cols: number, words: string[],
  opts: { allowDiagonals?: boolean; allowReverse?: boolean; seed?: string } = {},
): { grid: string[][]; placements: WSPlacement[]; skipped: string[] } {
  const allowDiagonals = opts.allowDiagonals !== false;
  const allowReverse = opts.allowReverse !== false;
  const rng = _gameRng(opts.seed || (rows + 'x' + cols + ':' + words.join('|')));
  const grid: string[][] = Array.from({ length: rows }, () => Array(cols).fill(''));
  const placements: WSPlacement[] = [];
  const skipped: string[] = [];
  const baseDirs: [number, number][] = allowDiagonals
    ? [[0, 1], [1, 0], [1, 1], [1, -1]]
    : [[0, 1], [1, 0]];
  // Try the longer words first — they're harder to place, fewer collisions.
  const ordered = words
    .map((w) => String(w).toUpperCase().replace(/[^A-Z]/g, ''))
    .filter((w) => w.length >= 2 && w.length <= Math.max(rows, cols))
    .sort((a, b) => b.length - a.length);
  for (const word of ordered) {
    let placed = false;
    for (let attempt = 0; attempt < 250 && !placed; attempt++) {
      const [dr, dc] = baseDirs[Math.floor(rng() * baseDirs.length)];
      const reversed = allowReverse && rng() < 0.5;
      const w = reversed ? word.split('').reverse().join('') : word;
      const r0 = Math.floor(rng() * rows);
      const c0 = Math.floor(rng() * cols);
      const r1 = r0 + dr * (w.length - 1);
      const c1 = c0 + dc * (w.length - 1);
      if (r1 < 0 || r1 >= rows || c1 < 0 || c1 >= cols) continue;
      let ok = true;
      for (let k = 0; k < w.length; k++) {
        const cell = grid[r0 + dr * k][c0 + dc * k];
        if (cell && cell !== w[k]) { ok = false; break; }
      }
      if (!ok) continue;
      for (let k = 0; k < w.length; k++) grid[r0 + dr * k][c0 + dc * k] = w[k];
      placements.push({ word, r: r0, c: c0, dr, dc, reversed });
      placed = true;
    }
    if (!placed) skipped.push(word);
  }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) grid[r][c] = alphabet[Math.floor(rng() * 26)];
    }
  }
  return { grid, placements, skipped };
}

const _gameMutedStyle: React.CSSProperties = { color: 'var(--cw-muted)', fontStyle: 'italic', fontSize: 13 };

/* ---- Crossword (pupil) ---- */
function CrosswordPupilGrid({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void;
}) {
  const cw = config?.crossword;
  const entries: any[] = cw && Array.isArray(cw.entries) ? cw.entries : [];
  if (entries.length === 0) {
    return <span style={_gameMutedStyle}>This crossword isn't set up yet — ask your teacher to add some clues.</span>;
  }
  let maxR = 0, maxC = 0;
  for (const e of entries) {
    const len = String(e?.answer || '').length;
    const rEnd = e?.direction === 'down' ? Number(e.row) + len : Number(e.row) + 1;
    const cEnd = e?.direction === 'across' ? Number(e.col) + len : Number(e.col) + 1;
    if (rEnd > maxR) maxR = rEnd;
    if (cEnd > maxC) maxC = cEnd;
  }
  const rows = Math.max(Number(cw.rows) || 0, maxR);
  const cols = Math.max(Number(cw.cols) || 0, maxC);
  const active: Record<string, true> = {};
  const starts: Record<string, number> = {};
  for (const e of entries) {
    const len = String(e?.answer || '').length;
    for (let k = 0; k < len; k++) {
      const r = e?.direction === 'down' ? Number(e.row) + k : Number(e.row);
      const c = e?.direction === 'across' ? Number(e.col) + k : Number(e.col);
      active[`${r},${c}`] = true;
    }
    const sk = `${e.row},${e.col}`;
    if (e?.number != null && starts[sk] == null) starts[sk] = Number(e.number);
  }
  return (
    <div>
      <div style={{ display: 'inline-block', border: '2px solid #1e293b', background: '#1e293b' }}>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} style={{ display: 'flex' }}>
            {Array.from({ length: cols }, (_, c) => {
              const key = `${r},${c}`;
              if (!active[key]) {
                return <div key={c} style={{ width: 32, height: 32, background: '#1e293b' }} />;
              }
              return (
                <div key={c} style={{ position: 'relative', width: 32, height: 32, background: 'var(--cw-surface)', borderRight: '1px solid var(--cw-border-strong)', borderBottom: '1px solid var(--cw-border-strong)' }}>
                  {starts[key] != null && (
                    <span style={{ position: 'absolute', top: 1, left: 2, fontSize: 9, color: 'var(--cw-muted)', fontWeight: 700, lineHeight: 1, pointerEvents: 'none' }}>
                      {starts[key]}
                    </span>
                  )}
                  <input
                    type="text" maxLength={1}
                    value={String(cellAnswers[key] || '')}
                    onChange={(ev) => {
                      const v = ev.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
                      setCellAnswers({ ...cellAnswers, [key]: v });
                    }}
                    style={{
                      width: '100%', height: '100%', textAlign: 'center',
                      border: 'none', outline: 'none',
                      fontSize: 16, fontWeight: 600,
                      textTransform: 'uppercase', background: 'transparent',
                      padding: 0,
                    }}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {(['across', 'down'] as const).map((dir) => {
          const list = entries.filter((e) => e.direction === dir).sort((a, b) => Number(a.number) - Number(b.number));
          if (list.length === 0) return <div key={dir} />;
          return (
            <div key={dir}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, textTransform: 'capitalize', color: 'var(--cw-ink)' }}>{dir}</div>
              {list.map((e, i) => (
                <div key={`${e.number}-${dir}-${i}`} style={{ fontSize: 13, marginBottom: 2 }}>
                  <strong>{e.number}.</strong> {e.clue || <em style={{ color: 'var(--cw-muted)' }}>(no clue)</em>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Word search (pupil) ---- */
function WordSearchPupilGrid({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void;
}) {
  const ws = config?.wordSearch;
  const grid: string[][] = ws && Array.isArray(ws.grid) ? ws.grid : [];
  const words: string[] = ws && Array.isArray(ws.words) ? ws.words.map((w: any) => String(w).toUpperCase()) : [];
  const found: string[] = Array.isArray(cellAnswers.found) ? cellAnswers.found : [];
  const paths: Record<string, { r: number; c: number }[]> = (cellAnswers.paths && typeof cellAnswers.paths === 'object') ? cellAnswers.paths : {};
  const [selecting, setSelecting] = useState<{ r: number; c: number }[]>([]);
  const [dragging, setDragging] = useState(false);

  if (grid.length === 0 || words.length === 0) {
    return <span style={_gameMutedStyle}>This word search isn't set up yet — ask your teacher to add some words.</span>;
  }

  function pathBetween(start: { r: number; c: number }, end: { r: number; c: number }) {
    const dr = Math.sign(end.r - start.r);
    const dc = Math.sign(end.c - start.c);
    if (dr === 0 && dc === 0) return [{ r: start.r, c: start.c }];
    if (dr !== 0 && dc !== 0 && Math.abs(end.r - start.r) !== Math.abs(end.c - start.c)) return null;
    const len = Math.max(Math.abs(end.r - start.r), Math.abs(end.c - start.c)) + 1;
    const out: { r: number; c: number }[] = [];
    for (let k = 0; k < len; k++) out.push({ r: start.r + dr * k, c: start.c + dc * k });
    return out;
  }
  function commit() {
    setDragging(false);
    if (selecting.length < 2) { setSelecting([]); return; }
    const word = selecting.map((p) => grid[p.r]?.[p.c] || '').join('').toUpperCase();
    const reversed = word.split('').reverse().join('');
    const matched = words.includes(word) ? word : (words.includes(reversed) ? reversed : null);
    if (matched && !found.includes(matched)) {
      setCellAnswers({
        ...cellAnswers,
        found: [...found, matched],
        paths: { ...paths, [matched]: selecting.slice() },
      });
    }
    setSelecting([]);
  }
  // Latest-state ref so the global mouseup listener always reads fresh values.
  const commitRef = useRef(commit);
  commitRef.current = commit;
  useEffect(() => {
    const fn = () => { if (dragging) commitRef.current(); };
    window.addEventListener('mouseup', fn);
    return () => window.removeEventListener('mouseup', fn);
  }, [dragging]);

  const inSelecting = (r: number, c: number) => selecting.some((p) => p.r === r && p.c === c);
  const inFound = (r: number, c: number) => {
    for (const w of found) {
      const path = paths[w];
      if (Array.isArray(path)) {
        for (const p of path) if (p.r === r && p.c === c) return true;
      }
    }
    return false;
  };

  return (
    <div>
      <div
        style={{ display: 'inline-block', userSelect: 'none', border: '1px solid var(--cw-border-strong)', background: 'var(--cw-surface)' }}
        onMouseLeave={() => { if (dragging) commit(); }}
      >
        {grid.map((row, r) => (
          <div key={r} style={{ display: 'flex' }}>
            {row.map((ch, c) => {
              const sel = inSelecting(r, c);
              const fnd = inFound(r, c);
              return (
                <div key={c}
                  onMouseDown={(e) => { e.preventDefault(); setDragging(true); setSelecting([{ r, c }]); }}
                  onMouseEnter={() => {
                    if (!dragging || selecting.length === 0) return;
                    const p = pathBetween(selecting[0], { r, c });
                    if (p) setSelecting(p);
                  }}
                  style={{
                    width: 28, height: 28, lineHeight: '28px', textAlign: 'center',
                    fontSize: 15, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                    background: sel ? '#fde68a' : fnd ? '#bbf7d0' : 'var(--cw-surface)',
                    borderRight: '1px solid var(--cw-border)', borderBottom: '1px solid var(--cw-border)',
                    cursor: 'pointer',
                  }}
                >{ch}</div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 13 }}>
        <strong>Find:</strong>{' '}
        {words.map((w) => (
          <span key={w} style={{
            display: 'inline-block', margin: '2px 4px', padding: '2px 8px',
            borderRadius: 999, fontSize: 12, fontWeight: 600,
            background: found.includes(w) ? '#dcfce7' : 'var(--cw-surface-muted)',
            color: found.includes(w) ? '#166534' : 'var(--cw-ink)',
            textDecoration: found.includes(w) ? 'line-through' : 'none',
          }}>{w}</span>
        ))}
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: 'var(--cw-muted)' }}>
        Click and drag across the letters to select a word. Across, down or diagonal.
      </div>
    </div>
  );
}

/* ---- Matching pairs (pupil) ---- */
function MatchingPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void;
}) {
  const m = config?.matching;
  const pairs: any[] = m && Array.isArray(m.pairs) ? m.pairs : [];
  const seed = pairs.map((p) => String(p?.term || '')).join('|') || 'matching';
  const order = useMemo(() => {
    const idx = pairs.map((_, i) => i);
    const rng = _gameRng(seed);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, pairs.length]);

  if (pairs.length === 0) {
    return <span style={_gameMutedStyle}>This matching task isn't set up yet — ask your teacher to add some pairs.</span>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {pairs.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ minWidth: 160, fontWeight: 600 }}>{p.term}</span>
          <select
            value={String(cellAnswers[String(i)] ?? '')}
            onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}
            style={{ flex: 1, padding: '6px 8px', border: '2px solid var(--cw-accent)', borderRadius: 6, background: 'var(--cw-surface)' }}
          >
            <option value="">— pick a definition —</option>
            {order.map((j) => (
              <option key={j} value={String(j)}>{pairs[j]?.definition}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

/* ---- Anagrams (pupil) ---- */
function AnagramsPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void;
}) {
  const a = config?.anagrams;
  const items: any[] = a && Array.isArray(a.items) ? a.items : [];
  if (items.length === 0) {
    return <span style={_gameMutedStyle}>This anagrams task isn't set up yet — ask your teacher to add some words.</span>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((it, i) => (
        <div key={i} style={{
          display: 'flex', flexDirection: 'column', gap: 6,
          padding: '10px 14px', borderRadius: 8,
          border: '1px solid var(--cw-border)', background: 'var(--cw-surface)',
        }}>
          {/* Scrambled word — stacked above the input so any length fits */}
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: 3,
            fontSize: 18, fontWeight: 700, color: 'var(--cw-ink)',
            wordBreak: 'break-word', lineHeight: 1.4,
          }}>{it?.scrambled}</div>
          <input
            type="text"
            placeholder="Type the unscrambled answer…"
            value={String(cellAnswers[String(i)] || '')}
            onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value.toUpperCase() })}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '7px 10px', border: '2px solid var(--cw-accent)',
              borderRadius: 6, textTransform: 'uppercase', fontSize: 14,
            }}
          />
          {it?.hint && <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>Hint: {it.hint}</div>}
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
   Teacher editors for the four fun-activity types.
   Each one takes a controlled `cfg` + `setCfg` pair so the parent modal
   keeps the source of truth and can serialise it straight into the question
   config at save time.
   ============================================================================ */

interface CrosswordEntryDraft { number: number; direction: 'across' | 'down'; row: number; col: number; answer: string; clue: string; }

function CrosswordEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [aiTopic, setAiTopic] = useState('');
  const rows = Math.max(3, Number(cfg?.rows) || 10);
  const cols = Math.max(3, Number(cfg?.cols) || 10);
  const entries: CrosswordEntryDraft[] = Array.isArray(cfg?.entries) ? cfg.entries : [];

  function update(patch: any) { setCfg({ rows, cols, entries, ...cfg, ...patch }); }
  function setEntries(next: CrosswordEntryDraft[]) { setCfg({ ...cfg, rows, cols, entries: next }); }

  async function suggestClues() {
    setAiErr(null);
    const targets = entries.filter((e) => String(e?.answer || '').trim());
    if (targets.length === 0) { setAiErr('Add some answer words first.'); return; }
    setAiBusy(true);
    try {
      const teacherToken = (() => {
        try { return localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken') || ''; } catch { return ''; }
      })();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (teacherToken) headers['x-teacher-password'] = teacherToken;
      const r = await fetch('/api/classwork/teacher/ai-crossword-clues', {
        method: 'POST', headers,
        body: JSON.stringify({ words: targets.map((e) => e.answer), topic: aiTopic }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'AI clue suggestion failed');
      const clues: (string | null)[] = Array.isArray(data?.clues) ? data.clues : [];
      // Splice each suggested clue back into the matching entry, leaving any
      // clue the teacher had already written untouched (so a re-run only
      // fills the empty ones).
      let ti = 0;
      const next = entries.map((e) => {
        if (!String(e?.answer || '').trim()) return e;
        const suggestion = clues[ti++];
        if (suggestion && !String(e.clue || '').trim()) return { ...e, clue: suggestion };
        return e;
      });
      setEntries(next);
    } catch (err: any) {
      setAiErr(err?.message || 'AI clue suggestion failed');
    } finally {
      setAiBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = { padding: '4px 8px', border: '1px solid var(--cw-border)', borderRadius: 6, fontSize: 13 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>
        Build the crossword by listing each word's start cell, direction and answer. The grid auto-sizes to fit.
        Numbers shown to pupils come from the "Number" column — share a number across an across+down pair that starts on the same square (e.g. 1A and 1D).
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontSize: 12 }}>Rows
          <input type="number" min={3} max={25} value={rows}
            onChange={(e) => update({ rows: Math.max(3, Math.min(25, Number(e.target.value) || rows)) })}
            style={{ ...inputStyle, width: 60, marginLeft: 4 }} />
        </label>
        <label style={{ fontSize: 12 }}>Cols
          <input type="number" min={3} max={25} value={cols}
            onChange={(e) => update({ cols: Math.max(3, Math.min(25, Number(e.target.value) || cols)) })}
            style={{ ...inputStyle, width: 60, marginLeft: 4 }} />
        </label>
      </div>
      <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--cw-surface-muted)' }}>
            <th style={{ padding: 4, textAlign: 'left', width: 50 }}>#</th>
            <th style={{ padding: 4, textAlign: 'left', width: 80 }}>Direction</th>
            <th style={{ padding: 4, textAlign: 'left', width: 50 }}>Row</th>
            <th style={{ padding: 4, textAlign: 'left', width: 50 }}>Col</th>
            <th style={{ padding: 4, textAlign: 'left' }}>Answer</th>
            <th style={{ padding: 4, textAlign: 'left' }}>Clue</th>
            <th style={{ padding: 4, width: 30 }} />
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i}>
              <td style={{ padding: 2 }}>
                <input type="number" min={1} value={e.number ?? ''} onChange={(ev) => {
                  const next = entries.slice(); next[i] = { ...e, number: Number(ev.target.value) || 0 }; setEntries(next);
                }} style={{ ...inputStyle, width: 50 }} />
              </td>
              <td style={{ padding: 2 }}>
                <select value={e.direction || 'across'} onChange={(ev) => {
                  const next = entries.slice(); next[i] = { ...e, direction: ev.target.value as any }; setEntries(next);
                }} style={{ ...inputStyle, width: 80 }}>
                  <option value="across">Across</option>
                  <option value="down">Down</option>
                </select>
              </td>
              <td style={{ padding: 2 }}>
                <input type="number" min={0} value={e.row ?? 0} onChange={(ev) => {
                  const next = entries.slice(); next[i] = { ...e, row: Math.max(0, Number(ev.target.value) || 0) }; setEntries(next);
                }} style={{ ...inputStyle, width: 50 }} />
              </td>
              <td style={{ padding: 2 }}>
                <input type="number" min={0} value={e.col ?? 0} onChange={(ev) => {
                  const next = entries.slice(); next[i] = { ...e, col: Math.max(0, Number(ev.target.value) || 0) }; setEntries(next);
                }} style={{ ...inputStyle, width: 50 }} />
              </td>
              <td style={{ padding: 2 }}>
                <input type="text" value={e.answer || ''} placeholder="ANSWER"
                  onChange={(ev) => {
                    const next = entries.slice(); next[i] = { ...e, answer: ev.target.value.toUpperCase().replace(/[^A-Z]/g, '') }; setEntries(next);
                  }}
                  style={{ ...inputStyle, width: '100%', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }} />
              </td>
              <td style={{ padding: 2 }}>
                <input type="text" value={e.clue || ''} placeholder="Clue shown to pupils"
                  onChange={(ev) => {
                    const next = entries.slice(); next[i] = { ...e, clue: ev.target.value }; setEntries(next);
                  }}
                  style={{ ...inputStyle, width: '100%' }} />
              </td>
              <td style={{ padding: 2 }}>
                <button type="button" onClick={() => setEntries(entries.filter((_, j) => j !== i))}
                  style={{ ...inputStyle, cursor: 'pointer' }} title="Remove this entry">×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={() => {
          const nextNum = (entries.reduce((m, e) => Math.max(m, Number(e.number) || 0), 0) || 0) + 1;
          setEntries([...entries, { number: nextNum, direction: 'across', row: 0, col: 0, answer: '', clue: '' }]);
        }} style={{ padding: '6px 12px', border: '1px solid var(--cw-border)', borderRadius: 6, cursor: 'pointer', background: 'var(--cw-surface)' }}>
          + Add entry
        </button>
        <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--cw-border)' }} />
        <input type="text" placeholder="Topic for AI clues (optional, e.g. 'binary numbers')"
          value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        <button type="button" onClick={suggestClues} disabled={aiBusy}
          style={{
            padding: '6px 12px', border: 'none', borderRadius: 6,
            background: aiBusy ? 'var(--cw-muted-soft)' : '#7c3aed', color: '#fff', cursor: aiBusy ? 'wait' : 'pointer',
            fontWeight: 600, fontSize: 13,
          }}>{aiBusy ? 'Asking AI…' : 'Suggest clues with AI'}</button>
      </div>
      {aiErr && <div style={{ fontSize: 12, color: '#991b1b' }}>{aiErr}</div>}
    </div>
  );
}

function WordSearchEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const rows = Math.max(5, Number(cfg?.rows) || 12);
  const cols = Math.max(5, Number(cfg?.cols) || 12);
  const allowDiagonals = cfg?.allowDiagonals !== false;
  const allowReverse = cfg?.allowReverse !== false;
  const wordsText: string = typeof cfg?._wordsText === 'string'
    ? cfg._wordsText
    : (Array.isArray(cfg?.words) ? cfg.words.join('\n') : '');
  const grid: string[][] = Array.isArray(cfg?.grid) ? cfg.grid : [];
  const skipped: string[] = Array.isArray(cfg?.skipped) ? cfg.skipped : [];

  function update(patch: any) { setCfg({ rows, cols, allowDiagonals, allowReverse, _wordsText: wordsText, ...cfg, ...patch }); }
  function regenerate() {
    const words = wordsText.split(/[\n,]/).map((w) => w.trim()).filter(Boolean);
    const out = _generateWordSearchGrid(rows, cols, words, {
      allowDiagonals, allowReverse, seed: Date.now() + ':' + words.join('|'),
    });
    update({
      grid: out.grid,
      words: out.placements.map((p) => p.word),
      skipped: out.skipped,
    });
  }

  const inputStyle: React.CSSProperties = { padding: '4px 8px', border: '1px solid var(--cw-border)', borderRadius: 6, fontSize: 13 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>
        Type one word per line (or comma-separated). Click "Regenerate" to lay them out — pupils select letters by dragging across the grid.
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontSize: 12 }}>Rows
          <input type="number" min={5} max={20} value={rows}
            onChange={(e) => update({ rows: Math.max(5, Math.min(20, Number(e.target.value) || rows)) })}
            style={{ ...inputStyle, width: 60, marginLeft: 4 }} />
        </label>
        <label style={{ fontSize: 12 }}>Cols
          <input type="number" min={5} max={20} value={cols}
            onChange={(e) => update({ cols: Math.max(5, Math.min(20, Number(e.target.value) || cols)) })}
            style={{ ...inputStyle, width: 60, marginLeft: 4 }} />
        </label>
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={allowDiagonals} onChange={(e) => update({ allowDiagonals: e.target.checked })} />
          Allow diagonals
        </label>
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={allowReverse} onChange={(e) => update({ allowReverse: e.target.checked })} />
          Allow reversed
        </label>
        <button type="button" onClick={regenerate}
          style={{ padding: '6px 12px', border: 'none', borderRadius: 6, background: 'var(--cw-accent)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          Regenerate grid
        </button>
      </div>
      <textarea
        rows={6}
        placeholder={'PYTHON\nVARIABLE\nLOOP\nBOOLEAN'}
        value={wordsText}
        onChange={(e) => update({ _wordsText: e.target.value })}
        style={{ ...inputStyle, width: '100%', fontFamily: 'JetBrains Mono, monospace' }}
      />
      {grid.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginBottom: 4 }}>Preview:</div>
          <div style={{ display: 'inline-block', border: '1px solid var(--cw-border-strong)' }}>
            {grid.map((row, r) => (
              <div key={r} style={{ display: 'flex' }}>
                {row.map((ch, c) => (
                  <div key={c} style={{
                    width: 22, height: 22, lineHeight: '22px', textAlign: 'center',
                    fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
                    borderRight: '1px solid var(--cw-border)', borderBottom: '1px solid var(--cw-border)',
                  }}>{ch}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {skipped.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--cw-tint-amber-ink)', background: 'var(--cw-tint-amber-bg)', border: '1px solid var(--cw-tint-amber-border)', padding: '6px 8px', borderRadius: 6 }}>
          Couldn't fit these into the grid (try a bigger grid or shorter words): {skipped.join(', ')}
        </div>
      )}
    </div>
  );
}

function MatchingEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const pairs: { term: string; definition: string }[] = Array.isArray(cfg?.pairs) ? cfg.pairs : [];
  function setPairs(next: { term: string; definition: string }[]) { setCfg({ ...cfg, pairs: next }); }
  const inputStyle: React.CSSProperties = { padding: '4px 8px', border: '1px solid var(--cw-border)', borderRadius: 6, fontSize: 13, width: '100%' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>
        Pupils see each term in order with a dropdown of definitions in shuffled order. Each row = one matching pair.
      </div>
      {pairs.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="text" value={p.term || ''} placeholder="Term"
            onChange={(e) => { const a = pairs.slice(); a[i] = { ...p, term: e.target.value }; setPairs(a); }}
            style={{ ...inputStyle, width: 180, flex: 'none' }} />
          <span style={{ color: 'var(--cw-muted)' }}>↔</span>
          <input type="text" value={p.definition || ''} placeholder="Definition"
            onChange={(e) => { const a = pairs.slice(); a[i] = { ...p, definition: e.target.value }; setPairs(a); }}
            style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={() => setPairs(pairs.filter((_, j) => j !== i))}
            style={{ ...inputStyle, cursor: 'pointer', width: 36, flex: 'none' }} title="Remove this pair">×</button>
        </div>
      ))}
      <button type="button" onClick={() => setPairs([...pairs, { term: '', definition: '' }])}
        style={{ padding: '6px 12px', border: '1px solid var(--cw-border)', borderRadius: 6, cursor: 'pointer', background: 'var(--cw-surface)', alignSelf: 'flex-start' }}>
        + Add pair
      </button>
    </div>
  );
}

function AnagramsEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: { answer: string; scrambled: string; hint: string }[] = Array.isArray(cfg?.items) ? cfg.items : [];
  function setItems(next: { answer: string; scrambled: string; hint: string }[]) { setCfg({ ...cfg, items: next }); }
  function reshuffle(i: number) {
    const a = items.slice();
    a[i] = { ...a[i], scrambled: _scrambleWord(a[i].answer || '', String(Date.now() + i)) };
    setItems(a);
  }
  const inputStyle: React.CSSProperties = { padding: '4px 8px', border: '1px solid var(--cw-border)', borderRadius: 6, fontSize: 13 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>
        Type each answer word — the scrambled version is generated automatically. Hit "Re-scramble" if you want a different jumble.
      </div>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, border: '1px solid var(--cw-border)', borderRadius: 6, background: 'var(--cw-surface)' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="text" value={it.answer || ''} placeholder="Answer (e.g. PYTHON or WATER CYCLE)"
              onChange={(e) => {
                const a = items.slice();
                // Allow spaces for multi-word answers; strip everything else non-alpha.
                const ans = e.target.value.toUpperCase().replace(/[^A-Z ]/g, '').replace(/  +/g, ' ');
                a[i] = { ...it, answer: ans, scrambled: _scrambleWord(ans.trim(), String(i)) };
                setItems(a);
              }}
              style={{ ...inputStyle, width: 200, textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }} />
            <span style={{ color: 'var(--cw-muted)', fontSize: 13 }}>→</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: 3, fontSize: 14, fontWeight: 700, color: 'var(--cw-ink)' }}>
              {it.scrambled || '—'}
            </span>
            <button type="button" onClick={() => reshuffle(i)}
              style={{ ...inputStyle, cursor: 'pointer' }}>Re-scramble</button>
            <span style={{ flex: 1 }} />
            <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))}
              style={{ ...inputStyle, cursor: 'pointer', width: 36 }} title="Remove">×</button>
          </div>
          <input type="text" value={it.hint || ''} placeholder="Optional hint (shown beneath the scrambled letters)"
            onChange={(e) => { const a = items.slice(); a[i] = { ...it, hint: e.target.value }; setItems(a); }}
            style={{ ...inputStyle, width: '100%' }} />
        </div>
      ))}
      <button type="button" onClick={() => setItems([...items, { answer: '', scrambled: '', hint: '' }])}
        style={{ padding: '6px 12px', border: '1px solid var(--cw-border)', borderRadius: 6, cursor: 'pointer', background: 'var(--cw-surface)', alignSelf: 'flex-start' }}>
        + Add anagram
      </button>
    </div>
  );
}

function TeacherSubmissions({ question, submissions, unlockedStudentIds = new Set(), onChanged }: {
  question: Question;
  submissions: Submission[];
  // Student IDs that currently have an active unlock for this question.
  unlockedStudentIds?: Set<string>;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (submissions.length === 0) {
    return (
      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--cw-muted)' }}>
        No student submissions yet.
      </div>
    );
  }
  // Sort newest first.
  const sorted = [...submissions].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );
  return (
    <details open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      style={{ marginTop: 10 }}>
      <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
        Student submissions ({submissions.length})
      </summary>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((s) => (
          <SubmissionRow
            key={s.id}
            question={question}
            submission={s}
            isUnlocked={unlockedStudentIds.has(s.student_id || '')}
            onChanged={onChanged}
          />
        ))}
      </div>
    </details>
  );
}

function SubmissionRow({ question, submission, isUnlocked: initUnlocked = false, onChanged }: {
  question: Question;
  submission: Submission;
  // Whether the teacher has currently granted this student a resubmit unlock.
  isUnlocked?: boolean;
  onChanged: () => void;
}) {
  const s = submission;
  const [marks, setMarks] = useState<string>(s.marks_awarded != null ? String(s.marks_awarded) : '');
  const [feedback, setFeedback] = useState<string>(s.ai_feedback || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // Local unlock state — synced from parent on mount, then managed locally
  // so toggling feels instant without waiting for a full refresh.
  const [unlocked, setUnlocked] = useState(initUnlocked);
  useEffect(() => { setUnlocked(initUnlocked); }, [initUnlocked]);

  async function save() {
    const n = parseInt(marks, 10);
    if (isNaN(n) || n < 0) {
      setMsg('Mark must be a number ≥ 0.');
      return;
    }
    setBusy(true); setMsg(null);
    try {
      await api(`/api/classwork/submissions/${s.id}/mark`, {
        method: 'PATCH',
        body: JSON.stringify({ marksAwarded: n, feedback }),
      });
      setMsg('Saved.');
      onChanged();
    } catch (e: any) {
      setMsg(e.message || 'Failed to save');
    } finally { setBusy(false); }
  }

  async function remark() {
    setBusy(true); setMsg('Asking the AI to mark again…');
    try {
      const updated = await api<Submission>(`/api/classwork/submissions/${s.id}/remark`, { method: 'POST' });
      setMarks(updated.marks_awarded != null ? String(updated.marks_awarded) : '');
      setFeedback(updated.ai_feedback || '');
      setMsg('AI re-marked.');
      onChanged();
    } catch (e: any) {
      setMsg(e.message || 'Re-mark failed');
    } finally { setBusy(false); }
  }

  async function toggleUnlock() {
    setBusy(true); setMsg(null);
    try {
      const next = !unlocked;
      await api(
        `/api/classwork/questions/${s.question_id}/unlock/${s.student_id}`,
        { method: next ? 'POST' : 'DELETE' },
      );
      setUnlocked(next);
      setMsg(next ? 'Unlocked — student can now revise and resubmit.' : 'Locked again.');
      onChanged();
    } catch (e: any) {
      setMsg(e.message || 'Failed to update lock');
    } finally { setBusy(false); }
  }

  return (
    <div style={{ border: `1px solid ${unlocked ? '#bfdbfe' : 'var(--cw-border)'}`, borderRadius: 8, padding: 12, background: unlocked ? '#f0f9ff' : 'var(--cw-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 13 }}>
        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          {s.student_username || s.student_id || 'Unknown student'}
          {unlocked && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: '#bfdbfe', color: '#1e40af' }}>
              Unlocked
            </span>
          )}
        </div>
        <div style={{ color: 'var(--cw-muted)' }}>
          Submitted {new Date(s.submitted_at).toLocaleString()}
          {s.marked_by && <> · marked by {s.marked_by === 'teacher' ? 'teacher' : 'AI'}</>}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <SubmissionAnswer question={question} submission={s} />
      </div>

      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'start' }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Mark<br />
          <span style={{ color: 'var(--cw-muted)', fontWeight: 400, fontSize: 12 }}>out of {question.max_marks}</span>
        </label>
        <input
          type="number" min={0} max={question.max_marks} value={marks}
          onChange={(e) => setMarks(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--cw-border)', borderRadius: 6, width: 100 }}
        />
        <label style={{ fontSize: 13, fontWeight: 600 }}>Feedback</label>
        <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--cw-border)', borderRadius: 6, width: '100%', fontFamily: 'inherit' }} />
      </div>

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={save} disabled={busy} style={{
          background: 'var(--cw-accent)', color: '#fff', border: 'none',
          padding: '6px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13,
        }}>{busy ? 'Working…' : 'Save override'}</button>
        <button onClick={remark} disabled={busy} style={{
          background: 'var(--cw-surface-muted)', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
          padding: '6px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13,
        }}>Re-mark with AI</button>
        <button onClick={toggleUnlock} disabled={busy} style={{
          background: unlocked ? '#fef3c7' : 'var(--cw-surface-muted)',
          color: unlocked ? '#92400e' : 'var(--cw-ink)',
          border: `1px solid ${unlocked ? '#fde68a' : 'var(--cw-border)'}`,
          padding: '6px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13,
        }}>{unlocked ? '🔒 Lock again' : '🔓 Allow resubmit'}</button>
        {msg && <span style={{ fontSize: 13, color: 'var(--cw-muted)' }}>{msg}</span>}
      </div>
    </div>
  );
}

function SubmissionAnswer({ question, submission }: { question: Question; submission: Submission }) {
  const s = submission;
  const t = question.question_type;
  const muted: React.CSSProperties = { color: 'var(--cw-muted)', fontStyle: 'italic' };

  if (t === 'multiple_choice') {
    const opts = Array.isArray(question.options) ? question.options : [];
    const chosen = opts.find((o: any) => (o.label || '') === (s.selected_option_label || ''));
    return (
      <div style={{ fontSize: 14 }}>
        Selected: <strong>{s.selected_option_label || '—'}</strong>
        {chosen?.text && <> — {chosen.text}</>}
        {chosen && typeof chosen.isCorrect === 'boolean' && (
          <span style={{
            marginLeft: 8, fontSize: 11, padding: '1px 6px', borderRadius: 999,
            background: chosen.isCorrect ? '#dcfce7' : '#fee2e2',
            color: chosen.isCorrect ? '#166534' : '#991b1b',
          }}>{chosen.isCorrect ? 'correct' : 'incorrect'}</span>
        )}
      </div>
    );
  }

  if (['scratch_link', 'makecode_link', 'google_sites_link'].includes(t)) {
    return s.link_url
      ? <a href={s.link_url} target="_blank" rel="noopener noreferrer">{s.link_url}</a>
      : <span style={muted}>No link submitted.</span>;
  }

  if (t === 'screenshot') {
    return s.file_url
      ? <a href={s.file_url} target="_blank" rel="noopener noreferrer">
          <img src={s.file_url} alt="Screenshot" style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 6, border: '1px solid var(--cw-border)' }} />
        </a>
      : <span style={muted}>No screenshot uploaded.</span>;
  }

  if (t === 'file_upload') {
    if (!s.text_answer && !s.link_url) return <span style={muted}>No file or link submitted.</span>;
    let filename = '';
    let content = '';
    if (s.text_answer) {
      try {
        const parsed = JSON.parse(s.text_answer);
        filename = String(parsed.filename || 'file');
        content = String(parsed.content || '');
      } catch {
        content = s.text_answer;
      }
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filename && (
          <div style={{ fontSize: 13 }}>
            <strong>File:</strong> {filename}
            {content && <span style={{ marginLeft: 8, color: 'var(--cw-muted)' }}>({content.length.toLocaleString()} characters)</span>}
          </div>
        )}
        {content && (
          <pre style={{
            padding: '10px 12px', borderRadius: 8, margin: 0,
            background: 'var(--cw-surface)', border: '1px solid var(--cw-border)',
            fontSize: 12, lineHeight: 1.5, overflow: 'auto', maxHeight: 320,
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>
            {content.length > 4000 ? content.slice(0, 4000) + '\n… (truncated for display)' : content}
          </pre>
        )}
        {s.link_url && (
          <div style={{ fontSize: 13 }}>
            <strong>Shared link:</strong>{' '}
            <a href={s.link_url} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--cw-accent)', wordBreak: 'break-all' }}>
              {s.link_url}
            </a>
          </div>
        )}
      </div>
    );
  }

  if (t === 'project') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {s.file_url && <a href={s.file_url} target="_blank" rel="noopener noreferrer">Download attached file</a>}
        {s.link_url && <a href={s.link_url} target="_blank" rel="noopener noreferrer">{s.link_url}</a>}
        {!s.file_url && !s.link_url && <span style={muted}>Nothing submitted.</span>}
      </div>
    );
  }

  if (t === 'presentation') {
    return s.file_url
      ? <a href={s.file_url} target="_blank" rel="noopener noreferrer">Download .pptx</a>
      : <span style={muted}>No file uploaded.</span>;
  }

  if (t === 'fill_in_blanks' || t === 'table' || t === 'labeled_inputs') {
    let parsed: Record<string, string> = {};
    try { parsed = JSON.parse(s.text_answer || '{}') || {}; } catch {}
    const keys = Object.keys(parsed);
    if (keys.length === 0) return <span style={muted}>Nothing submitted.</span>;
    // For labelled inputs we can show field labels alongside the indices.
    const labels: Record<string, string> = {};
    if (t === 'labeled_inputs') {
      const cfg = (question as any).config;
      const fields = cfg && Array.isArray(cfg.fields) ? cfg.fields : [];
      fields.forEach((f: any, i: number) => { labels[String(i)] = String(f?.label || `Field ${i + 1}`); });
    }
    return (
      <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <tbody>
          {keys.map((k) => (
            <tr key={k}>
              <td style={{ padding: '3px 8px', color: 'var(--cw-muted)', verticalAlign: 'top' }}>
                {labels[k] || k}
              </td>
              <td style={{ padding: '3px 8px' }}>{parsed[k] || <em style={muted}>(blank)</em>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (t === 'crossword' || t === 'word_search' || t === 'matching' || t === 'anagrams') {
    let parsed: Record<string, any> = {};
    try { parsed = JSON.parse(s.text_answer || '{}') || {}; } catch {}
    const cfg = (question as any).config;
    if (t === 'crossword') {
      const entries = cfg?.crossword?.entries || [];
      if (!Array.isArray(entries) || entries.length === 0) return <span style={muted}>No clues set up.</span>;
      return (
        <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {entries.map((e: any) => {
              let pupil = '';
              const len = String(e?.answer || '').length;
              for (let k = 0; k < len; k++) {
                const rr = e?.direction === 'down' ? Number(e.row) + k : Number(e.row);
                const cc = e?.direction === 'across' ? Number(e.col) + k : Number(e.col);
                pupil += String(parsed[`${rr},${cc}`] || '·');
              }
              const ok = pupil.toUpperCase() === String(e?.answer || '').toUpperCase();
              return (
                <tr key={e.id}>
                  <td style={{ padding: '3px 8px', color: 'var(--cw-muted)' }}>{e.id}</td>
                  <td style={{ padding: '3px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{pupil || '—'}</td>
                  <td style={{ padding: '3px 8px', color: ok ? '#166534' : '#991b1b' }}>{ok ? '✓' : `✗ ${e.answer}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }
    if (t === 'word_search') {
      const target: string[] = (cfg?.wordSearch?.words || []).map((w: any) => String(w).toUpperCase());
      const found: string[] = Array.isArray(parsed.found) ? parsed.found.map((w: any) => String(w).toUpperCase()) : [];
      if (target.length === 0) return <span style={muted}>No words to find.</span>;
      return (
        <div style={{ fontSize: 13 }}>
          <div style={{ marginBottom: 4, color: 'var(--cw-muted)' }}>Found {found.length} of {target.length}:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {target.map((w) => {
              const ok = found.includes(w);
              return (
                <span key={w} style={{
                  padding: '2px 8px', borderRadius: 999, fontSize: 12,
                  background: ok ? '#dcfce7' : '#fee2e2',
                  color: ok ? '#166534' : '#991b1b',
                  textDecoration: ok ? 'none' : 'line-through',
                }}>{w}</span>
              );
            })}
          </div>
        </div>
      );
    }
    if (t === 'matching') {
      const pairs: any[] = cfg?.matching?.pairs || [];
      if (!pairs.length) return <span style={muted}>No pairs set up.</span>;
      return (
        <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {pairs.map((p, i) => {
              const pickedIdx = parseInt(String(parsed[String(i)] ?? ''), 10);
              const pickedDef = isNaN(pickedIdx) ? '—' : (pairs[pickedIdx]?.definition || '?');
              const ok = pickedIdx === i;
              return (
                <tr key={i}>
                  <td style={{ padding: '3px 8px', fontWeight: 600 }}>{p.term}</td>
                  <td style={{ padding: '3px 8px' }}>→ {pickedDef}</td>
                  <td style={{ padding: '3px 8px', color: ok ? '#166534' : '#991b1b' }}>{ok ? '✓' : '✗'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }
    // anagrams
    const items: any[] = cfg?.anagrams?.items || [];
    if (!items.length) return <span style={muted}>No anagrams set up.</span>;
    return (
      <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <tbody>
          {items.map((it, i) => {
            const got = String(parsed[String(i)] || '');
            const expected = String(it?.answer || '').toUpperCase();
            const ok = got.toUpperCase().trim() === expected;
            return (
              <tr key={i}>
                <td style={{ padding: '3px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{it.scrambled}</td>
                <td style={{ padding: '3px 8px' }}>{got || <em style={muted}>(blank)</em>}</td>
                <td style={{ padding: '3px 8px', color: ok ? '#166534' : '#991b1b' }}>{ok ? '✓' : `✗ ${expected}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  if (t === 'hangman' || t === 'speed_round' || t === 'ordering' || t === 'caesar_cipher' || t === 'spot_phish' || t === 'binary_hex' || t === 'bit_ops' || t === 'code_tracer' || t === 'flowchart_seq' || t === 'sorting_race' || t === 'convert_relay' || t === 'url_anatomy' || t === 'truth_table' || t === 'field_type_sort' || t === 'io_sort' || t === 'html_match' || t === 'password_forge' || t === 'privacy_radar' || t === 'validation_rules' || t === 'find_duplicate' || t === 'bin_search' || t === 'box_model' || t === 'friend_or_fake' || t === 'dm_danger' || t === 'malware_triage' || t === '2fa_escape' || t === 'a11y_audit' || t === 'fetch_execute' || t === 'screen_time' || t === 'footprint_trail' || t === 'social_engineer' || t === 'cipher_quest' || t === 'normalise_it' || t === 'subnet_calc' || t === 'phish_inbox' || t === 'build_pc' || t === 'os_sched' || t === 'query_visual' || t === 'schema_arch' || t === 'tag_soup_repair' || t === 'selector_golf' || t === 'css_sliders' || t === 'mindmap' || t === 'upstander') {
    let parsed: any = {};
    try { parsed = JSON.parse(s.text_answer || '{}') || {}; } catch {}
    return <GameReview type={t} cfg={(question as any).config} parsed={parsed} questionId={String(question.id)} />;
  }

  // short / long / code
  const text = s.text_answer || '';
  if (!text) return <span style={muted}>Empty answer.</span>;
  return (
    <pre style={{
      whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, padding: 8,
      background: 'var(--cw-surface-soft)', border: '1px solid var(--cw-border)', borderRadius: 6,
      fontFamily: t === 'code' ? 'JetBrains Mono, monospace' : 'inherit',
      fontSize: t === 'code' ? 13 : 14, maxHeight: 280, overflow: 'auto',
    }}>{text}</pre>
  );
}

function NewQuestionButton({ lessonId, passages, onCreated, initialPassageId, label, compact }: { lessonId: string; passages: Question[]; onCreated: () => void; initialPassageId?: string; label?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const btnStyle: React.CSSProperties = compact
    ? { background: 'var(--cw-surface)', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
        padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
    : { background: 'var(--cw-accent)', color: '#fff', border: 'none',
        padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' };
  return (
    <>
      <button onClick={() => setOpen(true)} style={btnStyle}>{label ?? '+ New task'}</button>
      {open && <NewQuestionModal
        lessonId={lessonId}
        passages={passages}
        initialPassageId={initialPassageId}
        onClose={() => setOpen(false)}
        onCreated={() => { setOpen(false); onCreated(); }}
      />}
    </>
  );
}

/* Move-to-lesson button: lets teachers relocate a question (or whole group)
   to another lesson in the same unit without deleting and recreating it. */
function MoveQuestionButton({ questionId, unitId, currentLessonId, isGroup, onMoved }: {
  questionId: string;
  unitId: string;
  currentLessonId: string;
  isGroup?: boolean;
  onMoved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [lessons, setLessons] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);

  async function loadLessons() {
    if (lessons.length) return;
    setLoading(true);
    try {
      const all = await api<{ id: string; title: string }[]>(`/api/classwork/units/${unitId}/lessons`);
      setLessons(all.filter((l) => l.id !== currentLessonId));
    } finally {
      setLoading(false);
    }
  }

  async function moveTo(targetLessonId: string) {
    setMoving(true);
    try {
      await api(`/api/classwork/questions/${questionId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ targetLessonId, moveGroup: isGroup }),
      });
      setOpen(false);
      onMoved();
    } finally {
      setMoving(false);
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        title={isGroup ? 'Move this whole group to another lesson' : 'Move to another lesson'}
        onClick={() => { setOpen((o) => !o); if (!open) loadLessons(); }}
        style={{
          background: 'var(--cw-surface)', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
          padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >Move →</button>
      {open && (
        <>
          {/* Invisible backdrop to close on outside click */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 998 }}
          />
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 999, marginTop: 4,
            background: 'var(--cw-surface)', border: '1px solid var(--cw-border)',
            borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.13)',
            minWidth: 220, padding: 6,
          }}>
            {loading ? (
              <div style={{ padding: '8px 12px', color: 'var(--cw-muted)', fontSize: 13 }}>Loading…</div>
            ) : lessons.length === 0 ? (
              <div style={{ padding: '8px 12px', color: 'var(--cw-muted)', fontSize: 13 }}>No other lessons in this unit</div>
            ) : (
              <>
                <div style={{ padding: '4px 12px 6px', fontSize: 11, color: 'var(--cw-muted)', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 700 }}>
                  Move to lesson
                </div>
                {lessons.map((l) => (
                  <button
                    key={l.id}
                    disabled={moving}
                    onClick={() => moveTo(l.id)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '7px 12px', borderRadius: 6, border: 'none',
                      background: 'none', color: 'var(--cw-ink)', cursor: 'pointer',
                      fontSize: 13, opacity: moving ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => { if (!moving) e.currentTarget.style.background = 'var(--cw-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    {l.title || '(Untitled lesson)'}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* Edit-question entry point: same modal, just pre-populated with the existing
   values and saving via PATCH instead of POST. Lives next to each question
   card for teachers (not in pupil-preview mode). */
function EditQuestionButton({ question, passages, onChanged }: { question: Question; passages: Question[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} title="Edit this task" style={{
        background: 'var(--cw-surface)', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
        padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>Edit</button>
      {open && <NewQuestionModal
        lessonId={question.lesson_id}
        passages={passages.filter((p) => p.id !== question.id)}
        existing={question}
        onClose={() => setOpen(false)}
        onCreated={() => { setOpen(false); onChanged(); }}
      />}
    </>
  );
}

function NewQuestionModal({ lessonId, passages, existing, initialPassageId, onClose, onCreated }: { lessonId: string; passages: Question[]; existing?: Question; initialPassageId?: string; onClose: () => void; onCreated: () => void }) {
  const isEdit = !!existing;
  const cfg = (existing && existing.config && typeof existing.config === 'object') ? existing.config as any : {};
  const [type, setType] = useState(existing?.question_type || 'short');
  const [prompt, setPrompt] = useState(existing?.prompt || '');
  // For non-passage types, optionally attach this new question to an existing
  // passage / video_group in the lesson so they render together as a stimulus
  // group. `initialPassageId` lets the "+ Add question" button on a passage
  // or video panel pre-select that container.
  const [passageId, setPassageId] = useState<string>(existing?.passage_id || initialPassageId || '');
  const [maxMarks, setMaxMarks] = useState(existing?.max_marks ?? 1);
  const [markingScheme, setMarkingScheme] = useState(existing?.marking_scheme || '');
  const [aiGuidance, setAiGuidance] = useState(existing?.ai_grading_guidance || '');
  const [options, setOptions] = useState<{ label: string; text: string; isCorrect: boolean }[]>(
    Array.isArray(existing?.options) && existing!.options.length
      ? (existing!.options as any[]).map((o, i) => ({
          label: String(o?.label || String.fromCharCode(65 + i)),
          text: String(o?.text || ''),
          isCorrect: !!o?.isCorrect,
        }))
      : [
          { label: 'A', text: '', isCorrect: false },
          { label: 'B', text: '', isCorrect: false },
        ]
  );
  const [rubric, setRubric] = useState<{ label: string; marks: number }[]>(
    Array.isArray(cfg.rubric) ? cfg.rubric.map((r: any) => ({
      label: String(r?.label || ''), marks: Math.max(0, Math.round(Number(r?.marks) || 0)),
    })) : []
  );
  const [useRubric, setUseRubric] = useState(Array.isArray(cfg.rubric) && cfg.rubric.length > 0);
  const [visualMarking, setVisualMarking] = useState(!!cfg.visualMarking);
  // Optional starter .pptx for presentation questions: pupils download it,
  // edit it and upload their version. The marker uses it as a baseline so
  // the AI only credits the pupil's additions, not the original starter.
  const [starterFileUrl, setStarterFileUrl] = useState(typeof cfg.starterFileUrl === 'string' ? cfg.starterFileUrl : '');
  const [starterFileName, setStarterFileName] = useState(typeof cfg.starterFileName === 'string' ? cfg.starterFileName : '');
  const [starterUploading, setStarterUploading] = useState(false);
  const [sqlDatabaseUrl, setSqlDatabaseUrl] = useState(typeof cfg.databaseUrl === 'string' ? cfg.databaseUrl : '');
  const [dbEmbedInput, setDbEmbedInput] = useState(typeof cfg.embedUrl === 'string' ? cfg.embedUrl : (typeof cfg.embedToken === 'string' ? cfg.embedToken : ''));
  const [isExtension, setIsExtension] = useState(!!existing?.is_extension);
  const [videoKind, setVideoKind] = useState<'youtube' | 'mp4'>(
    cfg.video && cfg.video.kind === 'mp4' ? 'mp4' : 'youtube'
  );
  const [videoUrl, setVideoUrl] = useState(cfg.video && typeof cfg.video.url === 'string' ? cfg.video.url : '');
  const [videoFileName, setVideoFileName] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  // group type: contextMode and optional image URL (video uses the shared videoUrl/videoKind state)
  const [groupContextMode, setGroupContextMode] = useState<'none' | 'text' | 'video' | 'image'>(
    typeof cfg.contextMode === 'string' ? (cfg.contextMode as any) : 'none'
  );
  const [groupImageUrl, setGroupImageUrl] = useState(typeof cfg.imageUrl === 'string' ? cfg.imageUrl : '');
  // Resources staged inside the New-question modal. Each entry is the same
  // shape as a saved resource minus the id; once the question is created we
  // POST each one to /api/classwork/questions/:newId/resources. In edit mode
  // this state is unused — we mount the live <QuestionResources> panel for
  // the existing question id instead.
  const [pendingResources, setPendingResources] = useState<{ kind: LessonResource['kind']; title: string; url: string }[]>([]);
  // Lets save() sweep up any in-progress draft (e.g. a teacher pasted a
  // YouTube URL but never clicked the inner "Add" button) before POSTing
  // resources to the freshly-created question. See PendingResourcesEditor
  // for the flush() contract.
  const pendingEditorRef = useRef<PendingResourcesEditorHandle>(null);
  // fill_in_blanks: each blank has an `id` (referenced from the prompt as
  // `{{id}}`) and a comma-separated list of accepted answers (case- and
  // whitespace-insensitive on the marker side).
  const [blanks, setBlanks] = useState<{ id: string; accept: string; aiGuidance: string }[]>(
    Array.isArray(cfg.blanks)
      ? cfg.blanks.map((b: any) => ({
          id: String(b?.id ?? ''),
          accept: Array.isArray(b?.accept) ? b.accept.join(', ') : '',
          aiGuidance: String(b?.aiGuidance || ''),
        }))
      : [{ id: '1', accept: '', aiGuidance: '' }, { id: '2', accept: '', aiGuidance: '' }]
  );
  // table: a 2D grid. Each cell is either a fixed value (shown to pupils as
  // text) or a blank with a comma-separated list of accepted answers.
  type TblCell = { value: string; blank: boolean; accept: string; aiGuidance: string };
  const initTable = (() => {
    const t = cfg.table;
    if (t && Array.isArray(t.headers) && Array.isArray(t.rows)) {
      return {
        headers: t.headers.map((h: any) => String(h || '')),
        rows: t.rows.map((row: any[]) =>
          (Array.isArray(row) ? row : []).map((c: any) => ({
            value: String(c?.value ?? ''),
            blank: !!c?.blank,
            accept: Array.isArray(c?.accept) ? c.accept.join(', ') : '',
            aiGuidance: String(c?.aiGuidance || ''),
          }))
        ),
      };
    }
    return {
      headers: ['Column 1', 'Column 2'],
      rows: [
        [{ value: '', blank: false, accept: '', aiGuidance: '' }, { value: '', blank: true, accept: '', aiGuidance: '' }],
        [{ value: '', blank: false, accept: '', aiGuidance: '' }, { value: '', blank: true, accept: '', aiGuidance: '' }],
      ] as TblCell[][],
    };
  })();
  const [tblHeaders, setTblHeaders] = useState<string[]>(initTable.headers);
  const [tblRows, setTblRows] = useState<TblCell[][]>(initTable.rows);
  // labeled_inputs: a list of fields, each with a label, optional accepted
  // answers (exact match), AI guidance note, and a multiline flag that
  // switches the student UI from a single-line input to a textarea.
  const [fields, setFields] = useState<{ label: string; accept: string; aiGuidance: string; multiline: boolean }[]>(
    Array.isArray(cfg.fields)
      ? cfg.fields.map((f: any) => ({
          label: String(f?.label || ''),
          accept: Array.isArray(f?.accept) ? f.accept.join(', ') : '',
          aiGuidance: String(f?.aiGuidance || ''),
          multiline: !!f?.multiline,
        }))
      : [{ label: 'Forename', accept: '', aiGuidance: '', multiline: false }, { label: 'Surname', accept: '', aiGuidance: '', multiline: false }]
  );
  // ─── Fun-activity config slots ────────────────────────────────────────
  // Each one is the controlled state for the matching editor component
  // above; they live as separate `useState`s so save() can serialise just
  // the relevant slot for the chosen question type.
  const [crosswordCfg, setCrosswordCfg] = useState<any>(() =>
    cfg.crossword && typeof cfg.crossword === 'object'
      ? { rows: cfg.crossword.rows || 10, cols: cfg.crossword.cols || 10, entries: Array.isArray(cfg.crossword.entries) ? cfg.crossword.entries : [] }
      : { rows: 10, cols: 10, entries: [] }
  );
  const [wordSearchCfg, setWordSearchCfg] = useState<any>(() =>
    cfg.wordSearch && typeof cfg.wordSearch === 'object'
      ? {
          rows: cfg.wordSearch.rows || 12,
          cols: cfg.wordSearch.cols || 12,
          allowDiagonals: cfg.wordSearch.allowDiagonals !== false,
          allowReverse: cfg.wordSearch.allowReverse !== false,
          words: Array.isArray(cfg.wordSearch.words) ? cfg.wordSearch.words : [],
          grid: Array.isArray(cfg.wordSearch.grid) ? cfg.wordSearch.grid : [],
          _wordsText: Array.isArray(cfg.wordSearch.words) ? cfg.wordSearch.words.join('\n') : '',
        }
      : { rows: 12, cols: 12, allowDiagonals: true, allowReverse: true, words: [], grid: [], _wordsText: '' }
  );
  const [matchingCfg, setMatchingCfg] = useState<any>(() =>
    cfg.matching && Array.isArray(cfg.matching.pairs)
      ? { pairs: cfg.matching.pairs.map((p: any) => ({ term: String(p?.term || ''), definition: String(p?.definition || '') })) }
      : { pairs: [{ term: '', definition: '' }, { term: '', definition: '' }] }
  );
  const [anagramsCfg, setAnagramsCfg] = useState<any>(() =>
    cfg.anagrams && Array.isArray(cfg.anagrams.items)
      ? { items: cfg.anagrams.items.map((it: any) => ({
          answer: String(it?.answer || '').toUpperCase(),
          scrambled: String(it?.scrambled || ''),
          hint: String(it?.hint || ''),
        })) }
      : { items: [{ answer: '', scrambled: '', hint: '' }] }
  );
  // ─── Game config slots ───────────────────────────────────────────────
  const [hangmanCfg, setHangmanCfg] = useState<any>(() =>
    (cfg.hangman && Array.isArray(cfg.hangman.items))
      ? { items: cfg.hangman.items.map((it: any) => ({ word: String(it?.word || '').toUpperCase(), hint: String(it?.hint || '') })) }
      : { items: [{ word: '', hint: '' }] }
  );
  const [speedRoundCfg, setSpeedRoundCfg] = useState<any>(() =>
    (cfg.speedRound && Array.isArray(cfg.speedRound.items))
      ? { items: cfg.speedRound.items.map((it: any) => ({ q: String(it?.q || ''), a: String(it?.a || '') })), seconds: Number(cfg.speedRound.seconds) || 60 }
      : { items: [{ q: '', a: '' }], seconds: 60 }
  );
  const [orderingCfg, setOrderingCfg] = useState<any>(() =>
    (cfg.ordering && Array.isArray(cfg.ordering.items))
      ? { prompt: String(cfg.ordering.prompt || ''), items: cfg.ordering.items.map((it: any) => ({ label: String(it?.label || '') })) }
      : { prompt: '', items: [{ label: '' }, { label: '' }, { label: '' }] }
  );
  const [caesarCfg, setCaesarCfg] = useState<any>(() =>
    (cfg.caesar && Array.isArray(cfg.caesar.items))
      ? { items: cfg.caesar.items.map((it: any) => ({ text: String(it?.text || '').toUpperCase(), shift: Number(it?.shift) || 0, mode: it?.mode === 'decode' ? 'decode' : 'encode' })) }
      : { items: [{ text: '', shift: 3, mode: 'encode' }] }
  );
  const [spotPhishCfg, setSpotPhishCfg] = useState<any>(() =>
    (cfg.spotPhish && Array.isArray(cfg.spotPhish.items))
      ? { items: cfg.spotPhish.items.map((it: any) => ({ text: String(it?.text || ''), isPhish: !!it?.isPhish, why: String(it?.why || '') })) }
      : { items: [{ text: '', isPhish: false, why: '' }] }
  );
  const [binaryHexCfg, setBinaryHexCfg] = useState<any>(() =>
    cfg.binaryHex && typeof cfg.binaryHex === 'object'
      ? { rounds: Number(cfg.binaryHex.rounds) || 10, maxValue: Number(cfg.binaryHex.maxValue) || 255, modes: Array.isArray(cfg.binaryHex.modes) ? cfg.binaryHex.modes : ['dec_to_bin','bin_to_dec','dec_to_hex','hex_to_dec'] }
      : { rounds: 10, maxValue: 255, modes: ['dec_to_bin','bin_to_dec','dec_to_hex','hex_to_dec'] }
  );
  const [bitOpsCfg, setBitOpsCfg] = useState<any>(() =>
    cfg.bitOps && typeof cfg.bitOps === 'object'
      ? { rounds: Number(cfg.bitOps.rounds) || 6, bitWidth: Number(cfg.bitOps.bitWidth) || 8, ops: Array.isArray(cfg.bitOps.ops) ? cfg.bitOps.ops : ['AND','OR','XOR','NOT','SHL','SHR'] }
      : { rounds: 6, bitWidth: 8, ops: ['AND','OR','XOR','NOT','SHL','SHR'] }
  );
  const [codeTracerCfg, setCodeTracerCfg] = useState<any>(() =>
    cfg.codeTracer && typeof cfg.codeTracer === 'object'
      ? { language: cfg.codeTracer.language === 'pseudocode' ? 'pseudocode' : 'python', code: String(cfg.codeTracer.code || ''), steps: Array.isArray(cfg.codeTracer.steps) ? cfg.codeTracer.steps.map((s: any) => ({ note: String(s?.note || ''), vars: Array.isArray(s?.vars) ? s.vars.map((v: any) => ({ name: String(v?.name || ''), value: String(v?.value || '') })) : [] })) : [] }
      : { language: 'python', code: '', steps: [{ note: '', vars: [{ name: '', value: '' }] }] }
  );
  const [flowchartCfg, setFlowchartCfg] = useState<any>(() =>
    (cfg.flowchartSeq && Array.isArray(cfg.flowchartSeq.blocks))
      ? { prompt: String(cfg.flowchartSeq.prompt || ''), blocks: cfg.flowchartSeq.blocks.map((b: any) => ({ shape: ['process','decision','io','terminator'].includes(b?.shape) ? b.shape : 'process', label: String(b?.label || '') })) }
      : { prompt: '', blocks: [{ shape: 'terminator', label: 'Start' }, { shape: 'process', label: '' }, { shape: 'terminator', label: 'End' }] }
  );
  const [sortingRaceCfg, setSortingRaceCfg] = useState<any>(() => {
    const list = (cfg.sortingRace && Array.isArray(cfg.sortingRace.list)) ? cfg.sortingRace.list.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n)) : [5, 3, 8, 1, 4, 2];
    return { algorithm: ['bubble','selection','insertion'].includes(cfg.sortingRace?.algorithm) ? cfg.sortingRace.algorithm : 'bubble', list, _listText: list.join(', ') };
  });
  const [convertRelayCfg, setConvertRelayCfg] = useState<any>(() =>
    cfg.convertRelay && typeof cfg.convertRelay === 'object'
      ? { rounds: Number(cfg.convertRelay.rounds) || 10, maxValue: Number(cfg.convertRelay.maxValue) || 200, modes: Array.isArray(cfg.convertRelay.modes) ? cfg.convertRelay.modes : ['dec_to_bin','bin_to_dec','b_to_kb','kb_to_b','kb_to_mb','mb_to_kb'] }
      : { rounds: 10, maxValue: 200, modes: ['dec_to_bin','bin_to_dec','b_to_kb','kb_to_b','kb_to_mb','mb_to_kb'] }
  );
  const [urlAnatomyCfg, setUrlAnatomyCfg] = useState<any>(() =>
    (cfg.urlAnatomy && Array.isArray(cfg.urlAnatomy.items))
      ? { items: cfg.urlAnatomy.items.map((it: any) => ({ url: String(it?.url || '') })) }
      : { items: [{ url: 'https://www.bbc.co.uk/news/technology?topic=ai#section1' }] }
  );
  const [truthTableCfg, setTruthTableCfg] = useState<any>(() =>
    (cfg.truthTable && typeof cfg.truthTable === 'object')
      ? { expression: String(cfg.truthTable.expression || '') }
      : { expression: 'A AND (B OR NOT C)' }
  );
  const [fieldTypeSortCfg, setFieldTypeSortCfg] = useState<any>(() =>
    (cfg.fieldTypeSort && Array.isArray(cfg.fieldTypeSort.items))
      ? { items: cfg.fieldTypeSort.items.map((it: any) => ({ value: String(it?.value ?? ''), type: String(it?.type || 'text') })) }
      : { items: [{ value: '42', type: 'integer' }, { value: '"hello"', type: 'text' }, { value: 'True', type: 'boolean' }, { value: '3.14', type: 'real' }, { value: '07/05/2024', type: 'date' }] }
  );
  const [ioSortCfg, setIoSortCfg] = useState<any>(() =>
    (cfg.ioSort && Array.isArray(cfg.ioSort.items))
      ? { items: cfg.ioSort.items.map((it: any) => ({ name: String(it?.name || ''), category: String(it?.category || 'input') })) }
      : { items: [{ name: 'Keyboard', category: 'input' }, { name: 'Monitor', category: 'output' }, { name: 'SSD', category: 'storage' }, { name: 'Touchscreen', category: 'both' }] }
  );
  const [htmlMatchCfg, setHtmlMatchCfg] = useState<any>(() =>
    (cfg.htmlMatch && Array.isArray(cfg.htmlMatch.items))
      ? { items: cfg.htmlMatch.items.map((it: any) => ({ description: String(it?.description || ''), tag: String(it?.tag || '') })) }
      : { items: [{ description: 'Top-level page heading', tag: 'h1' }, { description: 'A clickable hyperlink', tag: 'a' }, { description: 'An unordered (bulleted) list', tag: 'ul' }, { description: 'A paragraph of text', tag: 'p' }] }
  );
  const [passwordForgeCfg, setPasswordForgeCfg] = useState<any>(() =>
    (cfg.passwordForge && Array.isArray(cfg.passwordForge.rules))
      ? { rules: cfg.passwordForge.rules }
      : { rules: ['min_length_12', 'has_upper', 'has_lower', 'has_digit', 'has_symbol', 'no_common_word'] }
  );
  const [privacyRadarCfg, setPrivacyRadarCfg] = useState<any>(() =>
    (cfg.privacyRadar && Array.isArray(cfg.privacyRadar.items))
      ? { items: cfg.privacyRadar.items.map((it: any) => ({ text: String(it?.text || ''), risk: String(it?.risk || 'low') })) }
      : { items: [
          { text: 'Posting your full home address publicly', risk: 'high' },
          { text: 'Sharing your favourite colour with friends', risk: 'low' },
          { text: 'Posting a photo of your school ID badge', risk: 'high' },
          { text: 'Adding your birthday year to a profile', risk: 'medium' },
        ] }
  );
  const [validationRulesCfg, setValidationRulesCfg] = useState<any>(() =>
    (cfg.validationRules && Array.isArray(cfg.validationRules.items))
      ? { items: cfg.validationRules.items.map((it: any) => ({ scenario: String(it?.scenario || ''), rule: String(it?.rule || 'presence') })) }
      : { items: [
          { scenario: "Pupil's age must be between 5 and 18", rule: 'range' },
          { scenario: 'Surname must not be left blank', rule: 'presence' },
          { scenario: 'Postcode must look like AB12 3CD', rule: 'format' },
          { scenario: 'Year group must be S1, S2, S3, S4, S5 or S6', rule: 'lookup' },
          { scenario: 'Password must be 8 to 32 characters', rule: 'length' },
        ] }
  );
  const [findDuplicateCfg, setFindDuplicateCfg] = useState<any>(() =>
    (cfg.findDuplicate && Array.isArray(cfg.findDuplicate.items))
      ? { items: cfg.findDuplicate.items.map((it: any) => ({ headers: Array.isArray(it?.headers) ? it.headers : [], rows: Array.isArray(it?.rows) ? it.rows : [] })) }
      : { items: [{ headers: ['Name', 'Age', 'Subject'], rows: [['Alice','10','Maths'], ['Bob','11','English'], ['Alice','10','Maths'], ['Carol','9','Art']] }] }
  );
  const [binSearchCfg, setBinSearchCfg] = useState<any>(() =>
    (cfg.binSearch && Array.isArray(cfg.binSearch.items))
      ? { items: cfg.binSearch.items.map((it: any) => ({ list: Array.isArray(it?.list) ? it.list : [], target: Number(it?.target) })) }
      : { items: [{ list: [1, 3, 5, 7, 9, 11, 13, 15], target: 11 }, { list: [2, 4, 6, 8, 10, 12, 14, 16], target: 4 }] }
  );
  const [boxModelCfg, setBoxModelCfg] = useState<any>(() =>
    (cfg.boxModel && Array.isArray(cfg.boxModel.items))
      ? { items: cfg.boxModel.items.map((it: any) => ({ content: Number(it?.content) || 0, padding: Number(it?.padding) || 0, border: Number(it?.border) || 0, margin: Number(it?.margin) || 0 })) }
      : { items: [{ content: 200, padding: 10, border: 2, margin: 8 }, { content: 100, padding: 20, border: 4, margin: 0 }] }
  );
  const [friendOrFakeCfg, setFriendOrFakeCfg] = useState<any>(() =>
    (cfg.friendOrFake && Array.isArray(cfg.friendOrFake.items))
      ? { items: cfg.friendOrFake.items.map((it: any) => ({ text: String(it?.text || ''), verdict: String(it?.verdict || 'real') })) }
      : { items: [
          { text: 'Profile is 7 years old, posts about hobbies, has many real friends as connections', verdict: 'real' },
          { text: 'Account created 2 days ago, no profile picture, sends friend requests to many strangers', verdict: 'fake' },
          { text: 'Photos look like a celebrity, asks for your phone number in DMs', verdict: 'fake' },
          { text: 'School friend tagged in classmates\' posts going back years', verdict: 'real' },
        ] }
  );
  const [upstanderCfg, setUpstanderCfg] = useState<any>(() =>
    (cfg.upstander && Array.isArray(cfg.upstander.items))
      ? { items: cfg.upstander.items.map((it: any) => ({ scenario: String(it?.scenario || ''), action: String(it?.action || 'report') })) }
      : { items: [
          { scenario: 'A classmate is being sent cruel messages by a group of people who are also threatening to share embarrassing photos of them.', action: 'report' },
          { scenario: 'Your friend messages you saying they feel awful because people at school have been posting horrible things about them online.', action: 'support' },
          { scenario: 'A stranger you have never met keeps sending you unwanted messages even after you have told them to stop.', action: 'block' },
          { scenario: 'A group chat you are in starts sharing edited photos of a classmate to make them look ridiculous.', action: 'report' },
          { scenario: 'A classmate tells you they have been deliberately left out of every group chat in your year and feel completely isolated.', action: 'support' },
          { scenario: 'Someone posts a cruel online poll asking who is the "most annoying" person in your year, with real names listed.', action: 'report' },
          { scenario: 'An unknown account starts leaving rude, one-word replies on everything you post, but stops as soon as you do not respond.', action: 'ignore' },
          { scenario: 'A classmate\'s ex-boyfriend is sharing private photos of her on social media without her permission.', action: 'report' },
          { scenario: 'A stranger sends you a single offensive comment on a public post, clearly just trying to get a reaction from you.', action: 'ignore' },
          { scenario: 'A friend tells you they are scared to open their phone because of the constant hurtful comments they keep receiving.', action: 'support' },
          { scenario: 'Someone has created a fake account pretending to be a classmate and is using it to spread false rumours about them.', action: 'report' },
          { scenario: 'Someone you had an argument with at school keeps tagging you in embarrassing posts and refuses to stop.', action: 'block' },
          { scenario: 'A group of students creates a mean hashtag using a classmate\'s name and encourages others to post hurtful comments under it.', action: 'report' },
          { scenario: 'Your friend breaks down at lunch and shows you dozens of hurtful anonymous messages they have been receiving every night.', action: 'support' },
          { scenario: 'Someone is using a gaming platform\'s chat to threaten a classmate, saying they will "sort them out" after school.', action: 'report' },
          { scenario: 'A user you do not recognise starts sending you unsolicited voice notes calling you names and making fun of how you look.', action: 'block' },
          { scenario: 'A school group chat is being used to mock a classmate\'s reading difficulties by sharing screenshots of their messages as jokes.', action: 'report' },
          { scenario: 'A classmate pulls you aside and says they are being threatened online by someone in your year but are too frightened to tell a teacher.', action: 'support' },
          { scenario: 'Someone is live-streaming themselves reading out a classmate\'s private messages for their followers to laugh at.', action: 'report' },
          { scenario: 'Someone dares you in a group chat to write something mean on a classmate\'s social media profile.', action: 'ignore' },
        ] }
  );
  const [dmDangerCfg, setDmDangerCfg] = useState<any>(() =>
    (cfg.dmDanger && Array.isArray(cfg.dmDanger.items))
      ? { items: cfg.dmDanger.items.map((it: any) => ({ text: String(it?.text || ''), risk: String(it?.risk || 'safe') })) }
      : { items: [
          { text: 'A school friend asks what time PE finishes today', risk: 'safe' },
          { text: 'A stranger says "you\'ve won £1000! Click this link to claim"', risk: 'dangerous' },
          { text: 'Someone you met in a game asks for your home address', risk: 'dangerous' },
          { text: 'A new follower asks where you live (just the town)', risk: 'risky' },
        ] }
  );
  const [malwareTriageCfg, setMalwareTriageCfg] = useState<any>(() =>
    (cfg.malwareTriage && Array.isArray(cfg.malwareTriage.items))
      ? { items: cfg.malwareTriage.items.map((it: any) => ({ text: String(it?.text || ''), kind: String(it?.kind || 'virus') })) }
      : { items: [
          { text: 'Encrypts your files and demands payment to unlock them', kind: 'ransomware' },
          { text: 'Spreads itself across a network without user action', kind: 'worm' },
          { text: 'Pretends to be a useful program but hides a payload', kind: 'trojan' },
          { text: 'Records what you type and sends it to attackers', kind: 'spyware' },
          { text: 'Shows pop-up adverts and slows down your browser', kind: 'adware' },
          { text: 'Attaches itself to other programs and runs when they do', kind: 'virus' },
        ] }
  );
  const [twoFactorEscapeCfg, setTwoFactorEscapeCfg] = useState<any>(() =>
    (cfg.twoFactorEscape && Array.isArray(cfg.twoFactorEscape.items))
      ? { items: cfg.twoFactorEscape.items.map((it: any) => ({ text: String(it?.text || ''), method: String(it?.method || 'password_only') })) }
      : { items: [
          { text: 'A bank protecting customers\' money online', method: 'hardware' },
          { text: 'A pupil signing into a low-risk school quiz site', method: 'password_only' },
          { text: 'A teacher\'s email account containing pupil data', method: 'authenticator' },
          { text: 'Confirming a phone bill payment using a one-time code on the phone', method: 'sms' },
        ] }
  );
  const [a11yAuditCfg, setA11yAuditCfg] = useState<any>(() =>
    (cfg.a11yAudit && Array.isArray(cfg.a11yAudit.items))
      ? { items: cfg.a11yAudit.items.map((it: any) => ({ text: String(it?.text || ''), issue: String(it?.issue || 'contrast') })) }
      : { items: [
          { text: 'Light grey text (#bbb) on a white background', issue: 'contrast' },
          { text: '<img src="logo.png"> with no alt attribute', issue: 'alt_text' },
          { text: 'A search box with no <label> and no placeholder', issue: 'labels' },
          { text: 'Page jumps from <h1> straight to <h4>', issue: 'heading_order' },
          { text: 'Custom button styled to remove the dotted outline on focus', issue: 'focus_indicator' },
          { text: 'A modal dialog you can\'t close using only the keyboard', issue: 'keyboard' },
        ] }
  );
  const [fetchExecuteCfg, setFetchExecuteCfg] = useState<any>(() =>
    (cfg.fetchExecute && Array.isArray(cfg.fetchExecute.items))
      ? { items: cfg.fetchExecute.items.map((it: any) => ({ text: String(it?.text || ''), step: String(it?.step || 'fetch') })) }
      : { items: [
          { text: 'The address in the program counter is sent to memory', step: 'fetch' },
          { text: 'The instruction is copied from memory into the CIR', step: 'fetch' },
          { text: 'The control unit interprets the opcode', step: 'decode' },
          { text: 'Operands are read from registers', step: 'decode' },
          { text: 'The ALU adds two numbers', step: 'execute' },
          { text: 'The result is written back to a register', step: 'execute' },
        ] }
  );
  const [screenTimeCfg, setScreenTimeCfg] = useState<any>(() =>
    (cfg.screenTime && Array.isArray(cfg.screenTime.items))
      ? { items: cfg.screenTime.items.map((it: any) => ({ text: String(it?.text || ''), rating: String(it?.rating || 'healthy') })) }
      : { items: [
          { text: '20 minutes of online homework after school', rating: 'healthy' },
          { text: '6 hours of TikTok every night until midnight', rating: 'unhealthy' },
          { text: '1 hour of gaming with friends after exercise outside', rating: 'balanced' },
          { text: 'Phone in bedroom checking notifications all night', rating: 'unhealthy' },
        ] }
  );
  const [footprintTrailCfg, setFootprintTrailCfg] = useState<any>(() =>
    (cfg.footprintTrail && Array.isArray(cfg.footprintTrail.items))
      ? { items: cfg.footprintTrail.items.map((it: any) => ({ text: String(it?.text || ''), visibility: String(it?.visibility || 'private') })) }
      : { items: [
          { text: 'Your bank card PIN', visibility: 'private' },
          { text: 'Your home address', visibility: 'private' },
          { text: 'A photo of your art project at school', visibility: 'public' },
          { text: 'Your favourite hobbies', visibility: 'public' },
          { text: 'Your phone number', visibility: 'personal' },
          { text: 'Your school class timetable', visibility: 'personal' },
        ] }
  );
  const [socialEngineerCfg, setSocialEngineerCfg] = useState<any>(() =>
    (cfg.socialEngineer && Array.isArray(cfg.socialEngineer.items))
      ? { items: cfg.socialEngineer.items.map((it: any) => ({ text: String(it?.text || ''), kind: String(it?.kind || 'phishing') })) }
      : { items: [
          { text: 'An email pretending to be from your bank, asking to "verify" details via a link', kind: 'phishing' },
          { text: 'A USB stick labelled "Salaries 2026" left in the staffroom', kind: 'baiting' },
          { text: 'Caller pretends to be IT support and asks for your password', kind: 'pretexting' },
          { text: '"Free 1-month subscription if you give us your school email"', kind: 'quid_pro_quo' },
          { text: 'Someone follows a teacher through a card-locked door', kind: 'tailgating' },
          { text: 'Someone watches you type your code at the till', kind: 'shoulder_surfing' },
        ] }
  );
  const [cipherQuestCfg, setCipherQuestCfg] = useState<any>(() =>
    (cfg.cipherQuest && Array.isArray(cfg.cipherQuest.items))
      ? { items: cfg.cipherQuest.items.map((it: any) => ({ text: String(it?.text || ''), cipher: String(it?.cipher || 'caesar') })) }
      : { items: [
          { text: 'Each letter is shifted by a fixed amount (e.g. +3)', cipher: 'caesar' },
          { text: 'Each letter is replaced using a secret one-to-one alphabet', cipher: 'substitution' },
          { text: 'A keyword decides a different shift for each letter', cipher: 'vigenere' },
          { text: 'Letters of the message are rearranged into a grid', cipher: 'transposition' },
          { text: 'Modern symmetric block cipher used to secure web traffic', cipher: 'aes' },
        ] }
  );
  const [normaliseItCfg, setNormaliseItCfg] = useState<any>(() =>
    (cfg.normaliseIt && Array.isArray(cfg.normaliseIt.items))
      ? { items: cfg.normaliseIt.items.map((it: any) => ({ text: String(it?.text || ''), violation: String(it?.violation || 'normalised') })) }
      : { items: [
          { text: 'Pupil(id, name, subject1, subject2, subject3) — three subject columns per row', violation: 'breaks_1nf' },
          { text: 'BookLoan(bookId, pupilId, bookTitle) where bookTitle depends only on bookId, not the whole key', violation: 'breaks_2nf' },
          { text: 'Pupil(id, name, formClass, formTeacher) where formTeacher depends on formClass, not on id', violation: 'breaks_3nf' },
          { text: 'Pupil(id, name, dob) with no repeating groups or partial/transitive dependencies', violation: 'normalised' },
        ] }
  );
  const [subnetCalcCfg, setSubnetCalcCfg] = useState<any>(() =>
    (cfg.subnetCalc && Array.isArray(cfg.subnetCalc.items))
      ? { items: cfg.subnetCalc.items.map((it: any) => ({ text: String(it?.text || ''), kind: String(it?.kind || 'class_c') })) }
      : { items: [
          { text: '10.0.0.5', kind: 'private' },
          { text: '127.0.0.1', kind: 'loopback' },
          { text: '192.168.1.10', kind: 'private' },
          { text: '8.8.8.8', kind: 'class_a' },
          { text: '172.217.16.142', kind: 'class_b' },
          { text: '224.0.0.1', kind: 'class_d' },
        ] }
  );
  const [phishInboxCfg, setPhishInboxCfg] = useState<any>(() =>
    (cfg.phishInbox && Array.isArray(cfg.phishInbox.items))
      ? { items: cfg.phishInbox.items.map((it: any) => ({ text: String(it?.text || ''), verdict: String(it?.verdict || 'legitimate') })) }
      : { items: [
          { text: 'Order confirmation from a shop you really used yesterday', verdict: 'legitimate' },
          { text: '"Your parcel is held — pay £1.99 to release"', verdict: 'phishing' },
          { text: '"Hi friend, urgent help needed, can you send £200?"', verdict: 'scam' },
          { text: 'Daily newsletter you signed up for and rarely read', verdict: 'spam' },
          { text: '"Your Apple ID has been suspended. Click here to verify"', verdict: 'phishing' },
        ] }
  );
  const [buildPcCfg, setBuildPcCfg] = useState<any>(() =>
    (cfg.buildPc && Array.isArray(cfg.buildPc.items))
      ? { items: cfg.buildPc.items.map((it: any) => ({ text: String(it?.text || ''), part: String(it?.part || 'cpu') })) }
      : { items: [
          { text: 'Carries out arithmetic and logic on every instruction', part: 'cpu' },
          { text: 'Volatile fast memory used while a program is running', part: 'ram' },
          { text: 'Renders 3-D graphics for games and video', part: 'gpu' },
          { text: 'Long-term non-volatile place to keep your files', part: 'storage' },
          { text: 'Converts mains electricity to DC for the components', part: 'psu' },
          { text: 'Main board everything plugs into', part: 'motherboard' },
          { text: 'Keeps the CPU temperature down', part: 'cooling' },
          { text: 'Metal/plastic shell that holds everything', part: 'case' },
        ] }
  );
  const [osSchedCfg, setOsSchedCfg] = useState<any>(() =>
    (cfg.osSched && Array.isArray(cfg.osSched.items))
      ? { items: cfg.osSched.items.map((it: any) => ({ text: String(it?.text || ''), algo: String(it?.algo || 'fcfs') })) }
      : { items: [
          { text: 'Each process gets a fixed time-slice in turn', algo: 'round_robin' },
          { text: 'Whichever process arrived first runs to completion', algo: 'fcfs' },
          { text: 'Always pick the process with the smallest expected runtime', algo: 'sjf' },
          { text: 'A nurse-call system: more important alarms run first', algo: 'priority' },
        ] }
  );
  const [queryVisualCfg, setQueryVisualCfg] = useState<any>(() =>
    (cfg.queryVisual && Array.isArray(cfg.queryVisual.items))
      ? { items: cfg.queryVisual.items.map((it: any) => ({ text: String(it?.text || ''), op: String(it?.op || 'select') })) }
      : { items: [
          { text: 'Show only the rows where mark > 50', op: 'filter' },
          { text: 'Show only the columns name and mark', op: 'project' },
          { text: 'Combine Pupils and Marks on pupilId', op: 'join' },
          { text: 'Sort the result by mark, highest first', op: 'sort' },
          { text: 'Average mark per class', op: 'group_by' },
          { text: 'Choose all the rows from the Pupils table', op: 'select' },
        ] }
  );
  const [schemaArchCfg, setSchemaArchCfg] = useState<any>(() =>
    (cfg.schemaArch && Array.isArray(cfg.schemaArch.items))
      ? { items: cfg.schemaArch.items.map((it: any) => ({ text: String(it?.text || ''), rel: String(it?.rel || 'one_to_many') })) }
      : { items: [
          { text: 'Pupil and Locker (each pupil has exactly one locker; each locker has one pupil)', rel: 'one_to_one' },
          { text: 'Class and Pupil (a class has many pupils; a pupil is in one class)', rel: 'one_to_many' },
          { text: 'Pupil and Club (pupils join many clubs; clubs have many pupils)', rel: 'many_to_many' },
          { text: 'Author and Book (one author writes many books; a book has one author)', rel: 'one_to_many' },
        ] }
  );
  const [tagSoupRepairCfg, setTagSoupRepairCfg] = useState<any>(() =>
    (cfg.tagSoupRepair && Array.isArray(cfg.tagSoupRepair.items))
      ? { items: cfg.tagSoupRepair.items.map((it: any) => ({ text: String(it?.text || ''), bug: String(it?.bug || 'unclosed') })) }
      : { items: [
          { text: '<p>Hello world', bug: 'unclosed' },
          { text: '<p>Hello <b>world</p></b>', bug: 'wrong_nesting' },
          { text: '<img src="cat.jpg">', bug: 'missing_attribute' },
          { text: '<br></br>', bug: 'self_close_misuse' },
          { text: '<b>My page title</b> at the top of the page', bug: 'wrong_tag' },
        ] }
  );
  const [selectorGolfCfg, setSelectorGolfCfg] = useState<any>(() =>
    (cfg.selectorGolf && Array.isArray(cfg.selectorGolf.items))
      ? { items: cfg.selectorGolf.items.map((it: any) => ({ text: String(it?.text || ''), kind: String(it?.kind || 'class') })) }
      : { items: [
          { text: '#header', kind: 'id' },
          { text: '.btn-primary', kind: 'class' },
          { text: 'h1', kind: 'element' },
          { text: 'nav a', kind: 'descendant' },
          { text: 'ul > li', kind: 'child' },
          { text: 'input[type="email"]', kind: 'attribute' },
        ] }
  );
  const [cssSlidersCfg, setCssSlidersCfg] = useState<any>(() =>
    (cfg.cssSliders && Array.isArray(cfg.cssSliders.items))
      ? { items: cfg.cssSliders.items.map((it: any) => ({ text: String(it?.text || ''), prop: String(it?.prop || 'width') })) }
      : { items: [
          { text: 'Make the box twice as wide', prop: 'width' },
          { text: 'Add space between this element and its neighbour', prop: 'margin' },
          { text: 'Add space inside the box, around the text', prop: 'padding' },
          { text: 'Make the headline text bigger', prop: 'font_size' },
          { text: 'Change the text colour to red', prop: 'color' },
          { text: 'Give the card a yellow background', prop: 'background' },
          { text: 'Add a thin black outline around the card', prop: 'border' },
          { text: 'Make the box taller', prop: 'height' },
        ] }
  );
  const [mindmapCfg, setMindmapCfg] = useState<any>(() =>
    cfg.mindmap && typeof cfg.mindmap === 'object'
      ? { central: String(cfg.mindmap.central || ''), expectedBranches: String(cfg.mindmap.expectedBranches || ''), guidance: String(cfg.mindmap.guidance || '') }
      : { central: '', expectedBranches: '', guidance: '' }
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Inline image upload state for the prompt textarea: lets a teacher paste
  // (Ctrl/Cmd+V) or drag-and-drop an image straight into the prompt and have
  // it inserted as ![image](url) at the cursor position. The flag drives a
  // "Uploading…" hint and disables Save while in flight; promptDragOver
  // shows a dashed outline when the teacher hovers a file over the box.
  const [promptImageBusy, setPromptImageBusy] = useState(false);
  const [promptImageErr, setPromptImageErr] = useState<string | null>(null);
  const [promptDragOver, setPromptDragOver] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  // Shared upload helper for prompt images: hits the same teacher resource
  // upload endpoint already used elsewhere in the modal, returns the public
  // URL of the saved image. Throws on any non-OK response.
  async function uploadPromptImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file, file.name || 'pasted-image.png');
    const teacherToken = (() => {
      try { return localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken') || ''; } catch { return ''; }
    })();
    const headers: Record<string, string> = {};
    if (teacherToken) headers['x-teacher-password'] = teacherToken;
    const r = await fetch('/api/classwork/teacher/upload/resource', {
      method: 'POST', headers, body: fd,
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || 'Upload failed');
    return data.url as string;
  }

  // Insert markdown for the uploaded image at the textarea's caret. If the
  // ref isn't available (theoretically impossible, but TS still wants the
  // guard) we fall back to appending at the end so the teacher never loses
  // their pasted image.
  function insertImageMarkdown(url: string, alt: string) {
    const md = `![${alt || 'image'}](${url})`;
    const el = promptRef.current;
    setPrompt((cur) => {
      if (!el) return (cur ? cur + (cur.endsWith('\n') ? '' : '\n') : '') + md + '\n';
      const start = el.selectionStart ?? cur.length;
      const end   = el.selectionEnd   ?? cur.length;
      const before = cur.slice(0, start);
      const after  = cur.slice(end);
      // Add a leading newline if we're mid-line so the image sits on its own
      // line (cleaner rendering and matches what teachers expect from the
      // similar paste behaviour in the rich text editor elsewhere).
      const sep = before && !before.endsWith('\n') ? '\n' : '';
      const next = before + sep + md + '\n' + after;
      // Restore the caret after the inserted markdown on the next tick so
      // the teacher can keep typing where they left off.
      const caret = (before + sep + md + '\n').length;
      requestAnimationFrame(() => {
        if (promptRef.current) {
          promptRef.current.focus();
          promptRef.current.setSelectionRange(caret, caret);
        }
      });
      return next;
    });
  }

  // ─── Prompt formatting helpers ────────────────────────────────────────
  // Wrap the current textarea selection with prefix/suffix (or, if nothing
  // is selected, insert prefix + placeholder + suffix and select the
  // placeholder so the teacher can immediately type over it). Used by the
  // Bold and Italic toolbar buttons.
  function wrapPromptSelection(prefix: string, suffix: string, placeholder: string) {
    const el = promptRef.current;
    setPrompt((cur) => {
      if (!el) return cur + prefix + placeholder + suffix;
      const start = el.selectionStart ?? cur.length;
      const end = el.selectionEnd ?? cur.length;
      const selected = cur.slice(start, end);
      const inner = selected || placeholder;
      const next = cur.slice(0, start) + prefix + inner + suffix + cur.slice(end);
      const innerStart = start + prefix.length;
      const innerEnd = innerStart + inner.length;
      requestAnimationFrame(() => {
        if (promptRef.current) {
          promptRef.current.focus();
          promptRef.current.setSelectionRange(innerStart, innerEnd);
        }
      });
      return next;
    });
  }

  // Toggle a line-leading prefix (like "- " or "## ") on every line that
  // overlaps the current selection. If a line already has that prefix it
  // gets stripped (toggle off); otherwise any *other* heading/bullet
  // prefix is replaced. Used by the Bullet, Heading and Subheading
  // toolbar buttons.
  function togglePromptLinePrefix(prefix: string) {
    const el = promptRef.current;
    setPrompt((cur) => {
      const start = el?.selectionStart ?? cur.length;
      const end = el?.selectionEnd ?? cur.length;
      const lineStart = cur.lastIndexOf('\n', start - 1) + 1;
      const lineEndIdx = cur.indexOf('\n', end);
      const lineEnd = lineEndIdx === -1 ? cur.length : lineEndIdx;
      const block = cur.slice(lineStart, lineEnd) || '';
      // For an empty selection on an empty line, give the teacher
      // something to type into.
      const sourceLines = block === '' ? [''] : block.split('\n');
      const transformed = sourceLines.map((line) => {
        if (line.startsWith(prefix)) {
          // Already has this prefix → toggle it off.
          return line.slice(prefix.length);
        }
        // Strip any competing heading/bullet prefix first so we don't
        // end up with "- ## item".
        const stripped = line.replace(/^(#{1,3}\s+|[-*]\s+)/, '');
        return prefix + stripped;
      });
      const newBlock = transformed.join('\n');
      const next = cur.slice(0, lineStart) + newBlock + cur.slice(lineEnd);
      const newCaret = lineStart + newBlock.length;
      requestAnimationFrame(() => {
        if (promptRef.current) {
          promptRef.current.focus();
          promptRef.current.setSelectionRange(lineStart, newCaret);
        }
      });
      return next;
    });
  }

  // Add/remove ordered-list prefixes (1. 2. 3. …) on the selected lines.
  // Toggles off if every selected line already starts with a number+dot.
  function toggleOrderedList() {
    const el = promptRef.current;
    setPrompt((cur) => {
      const start = el?.selectionStart ?? cur.length;
      const end = el?.selectionEnd ?? cur.length;
      const lineStart = cur.lastIndexOf('\n', start - 1) + 1;
      const lineEndIdx = cur.indexOf('\n', end);
      const lineEnd = lineEndIdx === -1 ? cur.length : lineEndIdx;
      const block = cur.slice(lineStart, lineEnd) || '';
      const sourceLines = block === '' ? [''] : block.split('\n');
      const allNumbered = sourceLines.every((l) => /^\s*\d+\.\s+/.test(l));
      const transformed = allNumbered
        ? sourceLines.map((l) => l.replace(/^\s*\d+\.\s+/, ''))
        : sourceLines.map((l, idx) => {
            const stripped = l.replace(/^(#{1,3}\s+|[-*]\s+|\d+\.\s+)/, '');
            return `${idx + 1}. ${stripped}`;
          });
      const newBlock = transformed.join('\n');
      const next = cur.slice(0, lineStart) + newBlock + cur.slice(lineEnd);
      const newCaret = lineStart + newBlock.length;
      requestAnimationFrame(() => {
        if (promptRef.current) {
          promptRef.current.focus();
          promptRef.current.setSelectionRange(lineStart, newCaret);
        }
      });
      return next;
    });
  }

  async function handlePromptImageFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    setPromptImageErr(null);
    setPromptImageBusy(true);
    try {
      // Upload sequentially so the inserted markdown lines up in the order
      // the teacher dropped/pasted the files.
      for (const file of images) {
        const url = await uploadPromptImage(file);
        insertImageMarkdown(url, file.name?.replace(/\.[a-z0-9]+$/i, '') || 'image');
      }
    } catch (e: any) {
      setPromptImageErr(e?.message || 'Could not upload image.');
    } finally {
      setPromptImageBusy(false);
    }
  }

  async function uploadVideo(file: File) {
    setVideoUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const teacherToken = (() => {
        try { return localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken') || ''; } catch { return ''; }
      })();
      const headers: Record<string, string> = {};
      if (teacherToken) headers['x-teacher-password'] = teacherToken;
      const r = await fetch('/api/classwork/teacher/upload/resource', {
        method: 'POST', headers, body: fd,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Upload failed');
      setVideoUrl(data.url);
      setVideoFileName(data.filename || file.name);
    } catch (e: any) {
      setErr(e.message || 'Video upload failed');
    } finally {
      setVideoUploading(false);
    }
  }

  // Seed a sensible default rubric the first time the teacher switches to a
  // presentation question so they aren't faced with an empty list.
  function onTypeChange(next: string) {
    setType(next);
    if (next === 'presentation' && rubric.length === 0) {
      setRubric([
        { label: 'Title slide and clear structure', marks: 1 },
        { label: 'Accurate and well-explained content', marks: 2 },
        { label: 'Use of images, diagrams or examples', marks: 1 },
        { label: 'Clear writing with few mistakes', marks: 1 },
      ]);
      setMaxMarks(5);
    }
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const noAnswerType = type === 'passage' || type === 'video_group' || type === 'file_task' || type === 'mc_group' || type === 'group' || type === 'info_only' || type === 'section_header' || type === 'text_only';
      const body: any = {
        questionType: type, prompt,
        // Passages and info-only notes have no marks / marking scheme / AI
        // guidance / answer area — they're reading material only, so we send
        // neutral defaults so the server doesn't reject them and analytics
        // ignores them.
        maxMarks: noAnswerType ? 0 : maxMarks,
        markingScheme: noAnswerType ? '' : markingScheme,
        aiGradingGuidance: noAnswerType ? '' : aiGuidance,
        isExtension,
      };
      // Only non-container types can be attached to a container group.
      if (type !== 'passage' && type !== 'video_group' && type !== 'file_task' && type !== 'mc_group' && type !== 'group' && passageId) body.passageId = passageId;
      if (type === 'multiple_choice') body.options = options;
      if (type === 'presentation') {
        const cfg: any = {};
        if (useRubric) {
          const cleaned = rubric
            .map((r) => ({ label: r.label.trim(), marks: Math.max(0, Math.round(r.marks || 0)) }))
            .filter((r) => r.label && r.marks > 0);
          if (cleaned.length) cfg.rubric = cleaned;
        }
        if (visualMarking) cfg.visualMarking = true;
        if (starterFileUrl) {
          cfg.starterFileUrl = starterFileUrl;
          if (starterFileName) cfg.starterFileName = starterFileName;
        }
        if (Object.keys(cfg).length) body.config = cfg;
      }
      if (type === 'sql_task' && sqlDatabaseUrl.trim()) {
        body.config = { databaseUrl: sqlDatabaseUrl.trim() };
      }
      if (type === 'database_task') {
        const raw = dbEmbedInput.trim();
        if (!raw) throw new Error('Please paste a Data Sculptor embed link or token.');
        // Accept either a full embed URL ("…/data-sculptor/?embed=TOKEN") or
        // just the bare token. Reject anything that doesn't look like one.
        let token = raw;
        const m = raw.match(/[?&]embed=([A-Za-z0-9_-]+)/);
        if (m) token = m[1];
        if (!/^[A-Za-z0-9_-]{8,}$/.test(token)) {
          throw new Error('That doesn\u2019t look like a Data Sculptor embed link or token.');
        }
        body.config = { embedToken: token, embedUrl: raw };
      }
      if (type === 'fill_in_blanks') {
        const cleaned = blanks
          .map((b) => {
            const row: any = {
              id: String(b.id || '').trim(),
              accept: b.accept.split(',').map((s) => s.trim()).filter(Boolean),
            };
            const ai = String(b.aiGuidance || '').trim();
            if (ai) row.aiGuidance = ai;
            return row;
          })
          .filter((b) => b.id);
        if (cleaned.length === 0) throw new Error('Add at least one blank.');
        body.config = { blanks: cleaned };
      }
      if (type === 'table') {
        const cleanedHeaders = tblHeaders.map((h) => String(h || '').trim());
        const cleanedRows = tblRows.map((row) =>
          row.map((c) => {
            const cell: any = { value: String(c.value || '') };
            if (c.blank) {
              cell.blank = true;
              const accept = c.accept.split(',').map((s) => s.trim()).filter(Boolean);
              if (accept.length) cell.accept = accept;
              const ai = String(c.aiGuidance || '').trim();
              if (ai) cell.aiGuidance = ai;
            }
            return cell;
          })
        );
        const blankCount = cleanedRows.flat().filter((c: any) => c.blank).length;
        if (blankCount === 0) throw new Error('Mark at least one cell as a blank for pupils to fill in.');
        body.config = { table: { headers: cleanedHeaders, rows: cleanedRows } };
      }
      if (type === 'labeled_inputs') {
        const cleaned = fields
          .map((f) => {
            const row: any = {
              label: String(f.label || '').trim(),
              accept: f.accept.split(',').map((s) => s.trim()).filter(Boolean),
            };
            const ai = String(f.aiGuidance || '').trim();
            if (ai) row.aiGuidance = ai;
            if (f.multiline) row.multiline = true;
            return row;
          })
          .filter((f) => f.label);
        if (cleaned.length === 0) throw new Error('Add at least one labelled field.');
        body.config = { fields: cleaned };
      }
      if (type === 'video_question' || type === 'video_group') {
        if (!videoUrl.trim()) {
          throw new Error(videoKind === 'youtube'
            ? 'Please paste a YouTube URL.'
            : 'Please upload a video file.');
        }
        if (videoKind === 'youtube' && !youtubeIdFromUrl(videoUrl)) {
          throw new Error('That doesn\u2019t look like a YouTube URL.');
        }
        body.config = { video: { kind: videoKind, url: videoUrl.trim() } };
      }
      if (type === 'group') {
        const gcfg: any = { contextMode: groupContextMode };
        if (groupContextMode === 'video') {
          if (!videoUrl.trim()) throw new Error('Please paste a YouTube URL or upload a video for this group.');
          if (videoKind === 'youtube' && !youtubeIdFromUrl(videoUrl)) throw new Error('That doesn\u2019t look like a YouTube URL.');
          gcfg.video = { kind: videoKind, url: videoUrl.trim() };
        } else if (groupContextMode === 'image') {
          if (groupImageUrl.trim()) gcfg.imageUrl = groupImageUrl.trim();
        }
        body.config = gcfg;
      }
      if (type === 'crossword') {
        const entries = (Array.isArray(crosswordCfg.entries) ? crosswordCfg.entries : [])
          .map((e: any) => ({
            number: Math.max(1, Number(e?.number) || 0),
            direction: e?.direction === 'down' ? 'down' : 'across',
            row: Math.max(0, Number(e?.row) || 0),
            col: Math.max(0, Number(e?.col) || 0),
            answer: String(e?.answer || '').toUpperCase().replace(/[^A-Z]/g, ''),
            clue: String(e?.clue || '').trim(),
          }))
          .filter((e: any) => e.answer.length >= 2 && e.number > 0);
        if (entries.length === 0) throw new Error('Add at least one crossword entry with an answer of 2 or more letters.');
        const missingClues = entries.filter((e: any) => !e.clue);
        if (missingClues.length > 0) {
          throw new Error(`Every entry needs a clue (missing ${missingClues.length}). Type one in or hit "Suggest clues with AI".`);
        }
        body.config = {
          crossword: {
            rows: Math.max(3, Number(crosswordCfg.rows) || 10),
            cols: Math.max(3, Number(crosswordCfg.cols) || 10),
            entries,
          },
        };
      }
      if (type === 'word_search') {
        // Resolve the editor-only `_wordsText` textarea into the actual word
        // list that gets stored — mirrors what the WordSearchEditor regenerate
        // button would do, in case the teacher edited the text but never hit
        // "Regenerate grid" before saving.
        const wordsFromText = String(wordSearchCfg._wordsText || '').split(/[\n,]/).map((w: string) => w.trim()).filter(Boolean);
        let grid: string[][] = Array.isArray(wordSearchCfg.grid) ? wordSearchCfg.grid : [];
        let placedWords: string[] = Array.isArray(wordSearchCfg.words) ? wordSearchCfg.words : [];
        let skipped: string[] = Array.isArray(wordSearchCfg.skipped) ? wordSearchCfg.skipped : [];
        // Regenerate if the text doesn't match what's been placed, or there's
        // no grid yet — saves the teacher one click.
        const placedSet = new Set(placedWords.map((w) => String(w).toUpperCase()));
        const desiredSet = new Set(wordsFromText.map((w) => w.toUpperCase().replace(/[^A-Z]/g, '')));
        const drift = grid.length === 0 || placedSet.size !== desiredSet.size || Array.from(desiredSet).some((w) => !placedSet.has(w));
        if (drift) {
          const out = _generateWordSearchGrid(
            Math.max(5, Number(wordSearchCfg.rows) || 12),
            Math.max(5, Number(wordSearchCfg.cols) || 12),
            wordsFromText,
            {
              allowDiagonals: wordSearchCfg.allowDiagonals !== false,
              allowReverse: wordSearchCfg.allowReverse !== false,
              seed: 'save:' + wordsFromText.join('|'),
            },
          );
          grid = out.grid;
          placedWords = out.placements.map((p) => p.word);
          skipped = out.skipped;
        }
        if (placedWords.length === 0) throw new Error('Add at least one word for the word search.');
        body.config = {
          wordSearch: {
            rows: grid.length,
            cols: grid[0]?.length || 0,
            allowDiagonals: wordSearchCfg.allowDiagonals !== false,
            allowReverse: wordSearchCfg.allowReverse !== false,
            words: placedWords,
            grid,
            skipped,
          },
        };
      }
      if (type === 'matching') {
        const cleaned = (Array.isArray(matchingCfg.pairs) ? matchingCfg.pairs : [])
          .map((p: any) => ({ term: String(p?.term || '').trim(), definition: String(p?.definition || '').trim() }))
          .filter((p: any) => p.term && p.definition);
        if (cleaned.length < 2) throw new Error('Add at least two complete term/definition pairs.');
        body.config = { matching: { pairs: cleaned } };
      }
      if (type === 'anagrams') {
        const cleaned = (Array.isArray(anagramsCfg.items) ? anagramsCfg.items : [])
          .map((it: any, i: number) => {
            // Preserve spaces for multi-word answers; strip other non-alpha chars.
            const answer = String(it?.answer || '').toUpperCase().replace(/[^A-Z ]/g, '').replace(/  +/g, ' ').trim();
            const scrambled = (String(it?.scrambled || '').toUpperCase().replace(/[^A-Z ]/g, '').trim()) || _scrambleWord(answer, String(i));
            return { answer, scrambled, hint: String(it?.hint || '').trim() };
          })
          .filter((it: any) => it.answer.replace(/\s/g, '').length >= 2);
        if (cleaned.length === 0) throw new Error('Add at least one anagram with an answer of 2 or more letters.');
        body.config = { anagrams: { items: cleaned } };
      }
      if (type === 'hangman') {
        const items = (Array.isArray(hangmanCfg.items) ? hangmanCfg.items : [])
          .map((it: any) => ({ word: String(it?.word || '').toUpperCase().replace(/[^A-Z ]/g, '').trim(), hint: String(it?.hint || '').trim() }))
          .filter((it: any) => it.word.replace(/\s/g, '').length >= 2);
        if (items.length === 0) throw new Error('Add at least one hangman word of 2 or more letters.');
        body.config = { hangman: { items } };
      }
      if (type === 'speed_round') {
        const items = (Array.isArray(speedRoundCfg.items) ? speedRoundCfg.items : [])
          .map((it: any) => ({ q: String(it?.q || '').trim(), a: String(it?.a || '').trim() }))
          .filter((it: any) => it.q && it.a);
        if (items.length === 0) throw new Error('Add at least one speed-round question with an answer.');
        body.config = { speedRound: { items, seconds: Math.max(5, Math.min(600, Number(speedRoundCfg.seconds) || 60)) } };
      }
      if (type === 'ordering') {
        const items = (Array.isArray(orderingCfg.items) ? orderingCfg.items : [])
          .map((it: any) => ({ label: String(it?.label || '').trim() }))
          .filter((it: any) => it.label);
        if (items.length < 2) throw new Error('Add at least two steps in their correct order.');
        body.config = { ordering: { prompt: String(orderingCfg.prompt || '').trim(), items } };
      }
      if (type === 'caesar_cipher') {
        const items = (Array.isArray(caesarCfg.items) ? caesarCfg.items : [])
          .map((it: any) => ({ text: String(it?.text || '').toUpperCase().replace(/[^A-Z ]/g, ''), shift: Number(it?.shift) || 0, mode: it?.mode === 'decode' ? 'decode' : 'encode' }))
          .filter((it: any) => it.text.length >= 2);
        if (items.length === 0) throw new Error('Add at least one Caesar cipher message of 2 or more letters.');
        body.config = { caesar: { items } };
      }
      if (type === 'spot_phish') {
        const items = (Array.isArray(spotPhishCfg.items) ? spotPhishCfg.items : [])
          .map((it: any) => ({ text: String(it?.text || '').trim(), isPhish: !!it?.isPhish, why: String(it?.why || '').trim() }))
          .filter((it: any) => it.text);
        if (items.length === 0) throw new Error('Add at least one phishing example.');
        body.config = { spotPhish: { items } };
      }
      if (type === 'binary_hex') {
        const allModes = ['dec_to_bin', 'bin_to_dec', 'dec_to_hex', 'hex_to_dec'];
        const modes = (Array.isArray(binaryHexCfg.modes) ? binaryHexCfg.modes : []).filter((m: any) => allModes.includes(m));
        if (modes.length === 0) throw new Error('Pick at least one conversion mode.');
        body.config = { binaryHex: {
          rounds: Math.max(1, Math.min(50, Number(binaryHexCfg.rounds) || 10)),
          maxValue: Math.max(15, Math.min(65535, Number(binaryHexCfg.maxValue) || 255)),
          modes,
        } };
      }
      if (type === 'bit_ops') {
        const allOps = ['AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR'];
        const ops = (Array.isArray(bitOpsCfg.ops) ? bitOpsCfg.ops : []).filter((o: any) => allOps.includes(o));
        if (ops.length === 0) throw new Error('Pick at least one bitwise operation.');
        body.config = { bitOps: {
          rounds: Math.max(1, Math.min(30, Number(bitOpsCfg.rounds) || 6)),
          bitWidth: Math.max(4, Math.min(16, Number(bitOpsCfg.bitWidth) || 8)),
          ops,
        } };
      }
      if (type === 'code_tracer') {
        const code = String(codeTracerCfg.code || '').trim();
        if (!code) throw new Error('Paste the code snippet pupils should trace.');
        const steps = (Array.isArray(codeTracerCfg.steps) ? codeTracerCfg.steps : [])
          .map((s: any) => ({
            note: String(s?.note || '').trim(),
            vars: (Array.isArray(s?.vars) ? s.vars : [])
              .map((v: any) => ({ name: String(v?.name || '').trim(), value: String(v?.value || '').trim() }))
              .filter((v: any) => v.name),
          }))
          .filter((s: any) => s.vars.length > 0);
        if (steps.length === 0) throw new Error('Add at least one trace step with a variable.');
        body.config = { codeTracer: { language: codeTracerCfg.language === 'pseudocode' ? 'pseudocode' : 'python', code, steps } };
      }
      if (type === 'flowchart_seq') {
        const blocks = (Array.isArray(flowchartCfg.blocks) ? flowchartCfg.blocks : [])
          .map((b: any) => ({ shape: ['process','decision','io','terminator'].includes(b?.shape) ? b.shape : 'process', label: String(b?.label || '').trim() }))
          .filter((b: any) => b.label);
        if (blocks.length < 2) throw new Error('Add at least two flowchart blocks in correct order.');
        body.config = { flowchartSeq: { prompt: String(flowchartCfg.prompt || '').trim(), blocks } };
      }
      if (type === 'sorting_race') {
        const list = (typeof sortingRaceCfg._listText === 'string' ? sortingRaceCfg._listText : (Array.isArray(sortingRaceCfg.list) ? sortingRaceCfg.list.join(',') : ''))
          .split(/[,\s]+/).map((x: string) => Number(x)).filter((n: number) => Number.isFinite(n));
        if (list.length < 2) throw new Error('Enter a list of at least 2 numbers to sort.');
        const algorithm = ['bubble','selection','insertion'].includes(sortingRaceCfg.algorithm) ? sortingRaceCfg.algorithm : 'bubble';
        body.config = { sortingRace: { list, algorithm } };
      }
      if (type === 'convert_relay') {
        const allModes = ['dec_to_bin','bin_to_dec','dec_to_hex','hex_to_dec','bits_to_bytes','bytes_to_bits','b_to_kb','kb_to_b','kb_to_mb','mb_to_kb','mb_to_gb','gb_to_mb'];
        const modes = (Array.isArray(convertRelayCfg.modes) ? convertRelayCfg.modes : []).filter((m: any) => allModes.includes(m));
        if (modes.length === 0) throw new Error('Pick at least one conversion mode.');
        body.config = { convertRelay: {
          rounds: Math.max(1, Math.min(40, Number(convertRelayCfg.rounds) || 10)),
          maxValue: Math.max(10, Math.min(9999, Number(convertRelayCfg.maxValue) || 200)),
          modes,
        } };
      }
      if (type === 'url_anatomy') {
        const items = (Array.isArray(urlAnatomyCfg.items) ? urlAnatomyCfg.items : [])
          .map((it: any) => ({ url: String(it?.url || '').trim() }))
          .filter((it: any) => it.url);
        if (items.length === 0) throw new Error('Add at least one URL.');
        body.config = { urlAnatomy: { items } };
      }
      if (type === 'truth_table') {
        const expression = String(truthTableCfg.expression || '').trim();
        if (!expression) throw new Error('Enter a Boolean expression (e.g. A AND (B OR NOT C)).');
        body.config = { truthTable: { expression } };
      }
      if (type === 'field_type_sort') {
        const items = (Array.isArray(fieldTypeSortCfg.items) ? fieldTypeSortCfg.items : [])
          .map((it: any) => ({ value: String(it?.value ?? ''), type: ['integer','real','text','boolean','date'].includes(it?.type) ? it.type : 'text' }))
          .filter((it: any) => it.value !== '');
        if (items.length === 0) throw new Error('Add at least one value to classify.');
        body.config = { fieldTypeSort: { items } };
      }
      if (type === 'io_sort') {
        const items = (Array.isArray(ioSortCfg.items) ? ioSortCfg.items : [])
          .map((it: any) => ({ name: String(it?.name || '').trim(), category: ['input','output','storage','both'].includes(it?.category) ? it.category : 'input' }))
          .filter((it: any) => it.name);
        if (items.length === 0) throw new Error('Add at least one device.');
        body.config = { ioSort: { items } };
      }
      if (type === 'html_match') {
        const items = (Array.isArray(htmlMatchCfg.items) ? htmlMatchCfg.items : [])
          .map((it: any) => ({ description: String(it?.description || '').trim(), tag: String(it?.tag || '').toLowerCase().replace(/[^a-z0-9]/g, '') }))
          .filter((it: any) => it.description && it.tag);
        if (items.length === 0) throw new Error('Add at least one description with a matching tag.');
        body.config = { htmlMatch: { items } };
      }
      if (type === 'password_forge') {
        const allRuleIds = ['min_length_8','min_length_12','min_length_16','has_upper','has_lower','has_digit','has_symbol','no_spaces','no_common_word'];
        const rules = (Array.isArray(passwordForgeCfg.rules) ? passwordForgeCfg.rules : []).filter((r: any) => allRuleIds.includes(r));
        if (rules.length === 0) throw new Error('Pick at least one password rule.');
        body.config = { passwordForge: { rules } };
      }
      if (type === 'privacy_radar') {
        const items = (Array.isArray(privacyRadarCfg.items) ? privacyRadarCfg.items : [])
          .map((it: any) => ({ text: String(it?.text || '').trim(), risk: ['low','medium','high'].includes(it?.risk) ? it.risk : 'low' }))
          .filter((it: any) => it.text);
        if (items.length === 0) throw new Error('Add at least one privacy scenario.');
        body.config = { privacyRadar: { items } };
      }
      if (type === 'validation_rules') {
        const items = (Array.isArray(validationRulesCfg.items) ? validationRulesCfg.items : [])
          .map((it: any) => ({ scenario: String(it?.scenario || '').trim(), rule: ['presence','range','length','format','lookup'].includes(it?.rule) ? it.rule : 'presence' }))
          .filter((it: any) => it.scenario);
        if (items.length === 0) throw new Error('Add at least one validation scenario.');
        body.config = { validationRules: { items } };
      }
      if (type === 'find_duplicate') {
        const items = (Array.isArray(findDuplicateCfg.items) ? findDuplicateCfg.items : [])
          .map((it: any) => ({
            headers: (Array.isArray(it?.headers) ? it.headers : []).map((h: any) => String(h)),
            rows: (Array.isArray(it?.rows) ? it.rows : []).map((row: any) => (Array.isArray(row) ? row.map((c: any) => String(c)) : [])),
          }))
          .filter((it: any) => it.rows.length >= 2);
        if (items.length === 0) throw new Error('Add at least one table with rows.');
        for (const it of items) {
          const seen = new Map<string, number>();
          let hasDup = false;
          for (const row of it.rows) {
            const k = row.map((c: string) => c.trim().toLowerCase()).join('||');
            if (seen.has(k)) { hasDup = true; break; }
            seen.set(k, 1);
          }
          if (!hasDup) throw new Error('Each table needs exactly one duplicate row.');
        }
        body.config = { findDuplicate: { items } };
      }
      if (type === 'bin_search') {
        const items = (Array.isArray(binSearchCfg.items) ? binSearchCfg.items : [])
          .map((it: any) => ({
            list: (Array.isArray(it?.list) ? it.list : []).map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n)),
            target: Number(it?.target),
          }))
          .filter((it: any) => it.list.length >= 2 && Number.isFinite(it.target));
        for (const it of items) {
          const sorted = [...it.list].sort((a, b) => a - b);
          if (sorted.some((v, i) => v !== it.list[i])) throw new Error('Each binary-search list must already be sorted in ascending order.');
        }
        if (items.length === 0) throw new Error('Add at least one sorted list with a target.');
        body.config = { binSearch: { items } };
      }
      if (type === 'box_model') {
        const items = (Array.isArray(boxModelCfg.items) ? boxModelCfg.items : [])
          .map((it: any) => ({
            content: Math.max(0, Math.round(Number(it?.content) || 0)),
            padding: Math.max(0, Math.round(Number(it?.padding) || 0)),
            border: Math.max(0, Math.round(Number(it?.border) || 0)),
            margin: Math.max(0, Math.round(Number(it?.margin) || 0)),
          }))
          .filter((it: any) => it.content > 0);
        if (items.length === 0) throw new Error('Add at least one CSS box (content width must be > 0).');
        body.config = { boxModel: { items } };
      }
      const PICKLIST_SAVE: Record<string, { src: any; configKey: string; valueKey: string; allowed: string[] }> = {
        friend_or_fake: { src: friendOrFakeCfg, configKey: 'friendOrFake', valueKey: 'verdict', allowed: ['real','fake'] },
        dm_danger: { src: dmDangerCfg, configKey: 'dmDanger', valueKey: 'risk', allowed: ['safe','risky','dangerous'] },
        upstander: { src: upstanderCfg, configKey: 'upstander', valueKey: 'action', allowed: ['report','support','block','ignore'] },
        malware_triage: { src: malwareTriageCfg, configKey: 'malwareTriage', valueKey: 'kind', allowed: ['virus','worm','trojan','ransomware','spyware','adware'] },
        '2fa_escape': { src: twoFactorEscapeCfg, configKey: 'twoFactorEscape', valueKey: 'method', allowed: ['password_only','sms','email','authenticator','hardware'] },
        a11y_audit: { src: a11yAuditCfg, configKey: 'a11yAudit', valueKey: 'issue', allowed: ['contrast','alt_text','labels','keyboard','heading_order','focus_indicator'] },
        fetch_execute: { src: fetchExecuteCfg, configKey: 'fetchExecute', valueKey: 'step', allowed: ['fetch','decode','execute'] },
        screen_time: { src: screenTimeCfg, configKey: 'screenTime', valueKey: 'rating', allowed: ['healthy','balanced','unhealthy'] },
        footprint_trail: { src: footprintTrailCfg, configKey: 'footprintTrail', valueKey: 'visibility', allowed: ['private','personal','public'] },
        social_engineer: { src: socialEngineerCfg, configKey: 'socialEngineer', valueKey: 'kind', allowed: ['phishing','pretexting','baiting','quid_pro_quo','tailgating','shoulder_surfing'] },
        cipher_quest: { src: cipherQuestCfg, configKey: 'cipherQuest', valueKey: 'cipher', allowed: ['caesar','substitution','vigenere','transposition','aes'] },
        normalise_it: { src: normaliseItCfg, configKey: 'normaliseIt', valueKey: 'violation', allowed: ['breaks_1nf','breaks_2nf','breaks_3nf','normalised'] },
        subnet_calc: { src: subnetCalcCfg, configKey: 'subnetCalc', valueKey: 'kind', allowed: ['class_a','class_b','class_c','class_d','class_e','private','loopback'] },
        phish_inbox: { src: phishInboxCfg, configKey: 'phishInbox', valueKey: 'verdict', allowed: ['legitimate','phishing','spam','scam'] },
        build_pc: { src: buildPcCfg, configKey: 'buildPc', valueKey: 'part', allowed: ['cpu','gpu','ram','storage','psu','motherboard','cooling','case'] },
        os_sched: { src: osSchedCfg, configKey: 'osSched', valueKey: 'algo', allowed: ['fcfs','sjf','round_robin','priority'] },
        query_visual: { src: queryVisualCfg, configKey: 'queryVisual', valueKey: 'op', allowed: ['select','project','join','filter','sort','group_by'] },
        schema_arch: { src: schemaArchCfg, configKey: 'schemaArch', valueKey: 'rel', allowed: ['one_to_one','one_to_many','many_to_many'] },
        tag_soup_repair: { src: tagSoupRepairCfg, configKey: 'tagSoupRepair', valueKey: 'bug', allowed: ['unclosed','wrong_nesting','missing_attribute','self_close_misuse','wrong_tag'] },
        selector_golf: { src: selectorGolfCfg, configKey: 'selectorGolf', valueKey: 'kind', allowed: ['id','class','element','descendant','child','attribute'] },
        css_sliders: { src: cssSlidersCfg, configKey: 'cssSliders', valueKey: 'prop', allowed: ['width','height','padding','margin','border','color','background','font_size'] },
      };
      if (type === 'mindmap') {
        const central = mindmapCfg.central?.trim() || '';
        if (!central) throw new Error('Enter a central topic for the mindmap.');
        body.config = { mindmap: {
          central,
          expectedBranches: String(mindmapCfg.expectedBranches || '').trim(),
          guidance: String(mindmapCfg.guidance || '').trim(),
        } };
      }
      if (PICKLIST_SAVE[type]) {
        const meta = PICKLIST_SAVE[type];
        const items = (Array.isArray(meta.src.items) ? meta.src.items : [])
          .map((it: any) => ({ text: String(it?.text || '').trim(), [meta.valueKey]: meta.allowed.includes(it?.[meta.valueKey]) ? it[meta.valueKey] : meta.allowed[0] }))
          .filter((it: any) => it.text);
        if (items.length === 0) throw new Error('Add at least one item.');
        body.config = { [meta.configKey]: { items } };
      }
      if (isEdit) {
        await api(`/api/classwork/questions/${existing!.id}`, {
          method: 'PATCH', body: JSON.stringify(body),
        });
      } else {
        // Sweep up any in-progress draft from the resources editor (e.g. a
        // teacher pasted a YouTube URL but never clicked the inner "Add"
        // button). flush() returns the final list synchronously so we don't
        // race React's setState batching here.
        const finalResources = pendingEditorRef.current?.flush() ?? pendingResources;
        const created = await api<{ id: string }>(`/api/classwork/lessons/${lessonId}/questions`, {
          method: 'POST', body: JSON.stringify(body),
        });
        // Flush any resources the teacher attached inside the modal before
        // saving. Failures are surfaced but the question itself is already
        // created, so we still close the modal and let them retry from the
        // per-question resources panel on the lesson page.
        if (created?.id && finalResources.length > 0) {
          for (const r of finalResources) {
            try {
              await api(`/api/classwork/questions/${created.id}/resources`, {
                method: 'POST',
                body: JSON.stringify({ kind: r.kind, url: r.url, title: r.title || null }),
              });
            } catch (err) {
              console.error('[classwork] failed to attach pending resource', err);
            }
          }
        }
      }
      onCreated();
    } catch (e: any) {
      setErr(e.message || 'Failed to save');
    } finally {
      setBusy(false);
    }
  }

  const rubricTotal = rubric.reduce((a, r) => a + (Number(r.marks) || 0), 0);

  // When this question is attached to an mc_group container, it must be a
  // multiple_choice question — lock the type selector automatically.
  const selectedPassage = passages.find((p) => p.id === passageId);
  const isAttachedToMCG = selectedPassage?.question_type === 'mc_group';
  useEffect(() => {
    if (isAttachedToMCG && type !== 'multiple_choice') setType('multiple_choice');
  }, [isAttachedToMCG]);

  return (
    <div style={modalOverlay}>
      <div style={modal}>
        <h2 style={{ marginTop: 0 }}>{isEdit ? 'Edit task' : 'New task'}</h2>
        <label style={fieldLabel}>Type
          {isAttachedToMCG ? (
            <div style={{ padding: '6px 10px', background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 8, fontSize: 13, color: '#5b21b6', fontWeight: 400 }}>
              Multiple choice <span style={{ color: 'var(--cw-muted)' }}>(fixed — children of a MC group must be multiple choice questions)</span>
            </div>
          ) : (
            <TypePicker value={type} onChange={onTypeChange} />
          )}
        </label>
        <label style={fieldLabel}>{
            type === 'passage' ? 'Passage text (what pupils read)'
            : type === 'video_group' ? 'Description (optional — shown above the video)'
            : type === 'mc_group' ? 'Question stem / instructions (optional — shown above all sub-questions)'
            : type === 'info_only' ? 'Note text (shown to pupils, no answer required)'
            : type === 'text_only' ? 'Task description (what pupils should do in their jotter)'
            : type === 'section_header' ? 'Section title (shown as a divider, e.g. "Section A: Comprehension")'
            : type === 'fill_in_blanks' ? 'Sentence (use {{1}}, {{2}} etc. for each blank)'
            : 'Task / prompt'}
          {type !== 'section_header' && type !== 'fill_in_blanks' && (() => {
            // Lightweight formatting toolbar. Each button uses
            // `onMouseDown` with `preventDefault` so the textarea keeps its
            // selection when the teacher clicks (otherwise a normal button
            // click steals focus, the selection collapses, and "wrap with
            // **" wraps an empty caret instead of the highlighted text).
            const toolBtn: React.CSSProperties = {
              padding: '4px 9px', fontSize: 12, lineHeight: 1.2,
              borderRadius: 6, border: '1px solid var(--cw-border)',
              background: 'var(--cw-surface)', cursor: 'pointer',
              color: 'var(--cw-fg)',
            };
            const grab = (fn: () => void) => (e: React.MouseEvent) => {
              e.preventDefault();
              fn();
            };
            return (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 4,
                marginTop: 4, marginBottom: 4,
              }}>
                <button type="button" style={{ ...toolBtn, fontWeight: 700 }}
                  title="Bold (wraps **selection**)"
                  onMouseDown={grab(() => wrapPromptSelection('**', '**', 'bold text'))}>
                  B
                </button>
                <button type="button" style={{ ...toolBtn, fontStyle: 'italic' }}
                  title="Italic (wraps _selection_)"
                  onMouseDown={grab(() => wrapPromptSelection('_', '_', 'italic text'))}>
                  I
                </button>
                <span style={{ width: 1, background: 'var(--cw-border)', margin: '0 4px' }} />
                <button type="button" style={toolBtn}
                  title="Bullet list (prefixes each line with -)"
                  onMouseDown={grab(() => togglePromptLinePrefix('- '))}>
                  • List
                </button>
                <button type="button" style={toolBtn}
                  title="Numbered list (prefixes each selected line with 1. 2. 3. …)"
                  onMouseDown={grab(() => toggleOrderedList())}>
                  1. List
                </button>
                <span style={{ width: 1, background: 'var(--cw-border)', margin: '0 4px' }} />
                <button type="button" style={{ ...toolBtn, fontWeight: 700, fontSize: 14 }}
                  title="Large heading (prefixes the line with #)"
                  onMouseDown={grab(() => togglePromptLinePrefix('# '))}>
                  H
                </button>
                <button type="button" style={{ ...toolBtn, fontWeight: 700, fontSize: 12 }}
                  title="Heading (prefixes the line with ##)"
                  onMouseDown={grab(() => togglePromptLinePrefix('## '))}>
                  H₂
                </button>
                <button type="button" style={{ ...toolBtn, fontWeight: 700, fontSize: 11 }}
                  title="Subheading (prefixes the line with ###)"
                  onMouseDown={grab(() => togglePromptLinePrefix('### '))}>
                  H₃
                </button>
              </div>
            );
          })()}
          <textarea
            ref={promptRef}
            rows={type === 'passage' ? 8 : 3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onPaste={(e) => {
              // Hunt for image data on the clipboard. We only intercept the
              // paste when an image is actually present so plain text paste
              // continues to behave normally.
              const items = Array.from(e.clipboardData?.items || []);
              const files: File[] = [];
              for (const it of items) {
                if (it.kind === 'file') {
                  const f = it.getAsFile();
                  if (f && f.type.startsWith('image/')) files.push(f);
                }
              }
              if (files.length) {
                e.preventDefault();
                handlePromptImageFiles(files);
              }
            }}
            onDragEnter={(e) => {
              if (Array.from(e.dataTransfer?.types || []).includes('Files')) {
                e.preventDefault();
                setPromptDragOver(true);
              }
            }}
            onDragOver={(e) => {
              if (Array.from(e.dataTransfer?.types || []).includes('Files')) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                setPromptDragOver(true);
              }
            }}
            onDragLeave={() => setPromptDragOver(false)}
            onDrop={(e) => {
              const files = Array.from(e.dataTransfer?.files || []);
              const images = files.filter((f) => f.type.startsWith('image/'));
              if (images.length) {
                e.preventDefault();
                setPromptDragOver(false);
                handlePromptImageFiles(images);
              }
            }}
            style={{
              ...input,
              outline: promptDragOver ? '2px dashed var(--cw-accent)' : undefined,
              outlineOffset: promptDragOver ? 2 : undefined,
              background: promptDragOver ? 'rgba(34,211,238,0.06)' : (input as any).background,
            }}
          />
          {(promptImageBusy || promptImageErr) && (
            <span style={{
              fontSize: 12, marginTop: 4,
              color: promptImageErr ? 'var(--cw-danger, #b91c1c)' : 'var(--cw-accent)',
            }}>
              {promptImageBusy ? 'Uploading image…' : promptImageErr}
            </span>
          )}
          {(() => {
            // Find every image markdown tag currently in the prompt and
            // render a small row of alignment controls per image. We
            // re-scan on every render (the prompt is short, and this keeps
            // the controls perfectly in sync with manual edits to the
            // markdown). The teacher can preview the image, see its alt
            // text and pick one of three layouts: centered (block, the
            // default), wrap left (image floats left, text wraps right) or
            // wrap right (mirror).
            const re = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g;
            const found: { whole: string; alt: string; src: string; align: PromptImageAlign }[] = [];
            let m: RegExpExecArray | null;
            while ((m = re.exec(prompt)) !== null) {
              const { alt, align } = parsePromptImageAlt(m[1]);
              found.push({ whole: m[0], alt, src: m[2], align });
            }
            if (!found.length) return null;
            const setAlign = (img: { whole: string; alt: string; src: string }, next: PromptImageAlign) => {
              const altPiece = img.alt || 'image';
              const newAlt = next === 'center' ? altPiece : `${altPiece}|${next}`;
              const replacement = `![${newAlt}](${img.src})`;
              setPrompt((cur) => cur.replace(img.whole, replacement));
            };
            const removeImage = (img: { whole: string }) => {
              setPrompt((cur) => {
                // Strip the markdown plus a single trailing newline if
                // present so removal doesn't leave an empty line behind.
                const idx = cur.indexOf(img.whole);
                if (idx === -1) return cur;
                const end = idx + img.whole.length;
                const swallowNewline = cur[end] === '\n' ? 1 : 0;
                return cur.slice(0, idx) + cur.slice(end + swallowNewline);
              });
            };
            const btnBase: React.CSSProperties = {
              padding: '4px 8px', fontSize: 11, borderRadius: 6,
              border: '1px solid var(--cw-border)', background: 'var(--cw-surface)',
              cursor: 'pointer', lineHeight: 1.2,
            };
            const btnActive: React.CSSProperties = {
              ...btnBase,
              background: 'var(--cw-accent)', color: '#0b1220',
              borderColor: 'var(--cw-accent)', fontWeight: 600,
            };
            return (
              <div style={{
                marginTop: 8, padding: 8, borderRadius: 8,
                border: '1px solid var(--cw-border)', background: 'rgba(15,23,42,0.02)',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <span style={{ fontSize: 12, color: 'var(--cw-muted)', fontWeight: 600 }}>
                  Image layout ({found.length} image{found.length === 1 ? '' : 's'} in this task)
                </span>
                {found.map((img, idx) => (
                  <div key={`${img.src}-${idx}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: 6, borderRadius: 6, background: 'var(--cw-surface)',
                    border: '1px solid var(--cw-border)',
                  }}>
                    <img
                      src={img.src}
                      alt=""
                      style={{
                        width: 56, height: 40, objectFit: 'cover',
                        borderRadius: 4, border: '1px solid var(--cw-border)',
                        background: 'var(--cw-surface)', flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--cw-muted)' }}>
                      <div style={{
                        whiteSpace: 'nowrap', overflow: 'hidden',
                        textOverflow: 'ellipsis', color: 'var(--cw-fg)',
                      }}>
                        {img.alt || <em>image</em>}
                      </div>
                      <div style={{
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {img.src}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button type="button"
                        onClick={() => setAlign(img, 'left')}
                        title="Wrap text on the right (image floats left)"
                        style={img.align === 'left' ? btnActive : btnBase}>
                        ⇦ Left
                      </button>
                      <button type="button"
                        onClick={() => setAlign(img, 'center')}
                        title="Centered, full-width block"
                        style={img.align === 'center' ? btnActive : btnBase}>
                        ▭ Centre
                      </button>
                      <button type="button"
                        onClick={() => setAlign(img, 'right')}
                        title="Wrap text on the left (image floats right)"
                        style={img.align === 'right' ? btnActive : btnBase}>
                        Right ⇨
                      </button>
                      <button type="button"
                        onClick={() => removeImage(img)}
                        title="Remove this image from the task"
                        style={{ ...btnBase, color: 'var(--cw-danger, #b91c1c)' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          <span style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>
            <strong>Tip:</strong> paste a screenshot (Ctrl/Cmd+V) or drag an image file straight into this box and it will be uploaded and inserted automatically. Each image gets its own layout chooser below — pick centred, wrap-left or wrap-right.
          </span>
          <span style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>
            {type === 'passage'
              ? 'Type or paste the paragraph pupils have to read. It will sit in a sticky panel beside its attached tasks, so pupils can refer back to it as they answer.'
              : type === 'video_group'
                ? <>This card is just the video — there\u2019s no answer area on it. <strong>After saving</strong>, click <strong>+ Add question to this video</strong> on the video panel (or use <em>+ New task</em> and pick this video in <em>Attach to passage or video</em>) to add the questions pupils answer underneath it.</>
              : type === 'group'
                ? groupContextMode === 'text'
                  ? 'Type the reading material or stimulus text that pupils will see pinned at the top of this group.'
                  : groupContextMode === 'video' || groupContextMode === 'image'
                    ? 'Optional: add an extra text description or caption above the video/image (leave blank if not needed).'
                    : 'Optional title or description for the group (leave blank for no heading).'
              : type === 'info_only'
                ? 'A non-interactive note. Use it for instructions, a reminder or a sub-heading between tasks. Pupils don\u2019t answer it and it doesn\u2019t count for marks.'
                : type === 'fill_in_blanks'
                  ? <>Write the sentence/code with placeholders. For example: <code>The capital of France is &#123;&#123;1&#125;&#125;.</code> Each <code>&#123;&#123;id&#125;&#125;</code> becomes a text box pupils fill in.</>
                  : <>Tip: paste a URL (e.g. https://bbc.co.uk/bitesize) and it will appear as a clickable link that opens in a new window. For a friendlier label, write <code>[Bitesize lesson](https://bbc.co.uk/bitesize)</code>.</>}
          </span>
        </label>
        {type === 'group' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={fieldLabel}>Context shown at top of group
              <select value={groupContextMode} onChange={(e) => setGroupContextMode(e.target.value as any)} style={input}>
                <option value="none">None — just the question title/description above</option>
                <option value="text">Reading passage — text pupils refer to while answering</option>
                <option value="video">Video — pupils watch it, then answer questions below</option>
                <option value="image">Image — a diagram or photo shown above the questions</option>
              </select>
            </label>
            {groupContextMode === 'video' && (
              <label style={fieldLabel}>Video URL (YouTube)
                <input
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  style={input}
                />
                <span style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>
                  Paste a YouTube URL. The video will be embedded at the top of the group panel.
                </span>
              </label>
            )}
            {groupContextMode === 'image' && (
              <label style={fieldLabel}>Image URL
                <input
                  placeholder="https://example.com/image.png"
                  value={groupImageUrl}
                  onChange={(e) => setGroupImageUrl(e.target.value)}
                  style={input}
                />
                <span style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>
                  Paste a public image URL. You can also upload an image via the prompt box above and copy the resulting URL from there.
                </span>
              </label>
            )}
          </div>
        )}
        {type !== 'passage' && type !== 'video_group' && type !== 'file_task' && type !== 'mc_group' && type !== 'group' && passages.length > 0 && (
          <label style={fieldLabel}>Attach to passage, video, file task, MC group, or group (optional)
            <select value={passageId} onChange={(e) => setPassageId(e.target.value)} style={input}>
              <option value="">— None (standalone task) —</option>
              {passages.map((p) => {
                const isVid = p.question_type === 'video_group';
                const isFT = p.question_type === 'file_task';
                const isMCG = p.question_type === 'mc_group';
                const isGrp = p.question_type === 'group';
                const preview = (p.prompt || '').slice(0, 60);
                const prefix = isVid ? '▶ Video: ' : isFT ? '📎 File task: ' : isMCG ? '☰ MC group: ' : isGrp ? '⊞ Group: ' : 'Passage: ';
                const fallback = '(no description)';
                return (
                  <option key={p.id} value={p.id}>
                    {prefix}{preview || fallback}{(p.prompt || '').length > 60 ? '…' : ''}
                  </option>
                );
              })}
            </select>
            <span style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>
              Group this task with a reading passage, video, file task, MC group, or generic group so pupils see the stimulus alongside their answer area.
            </span>
          </label>
        )}
        {type !== 'passage' && type !== 'video_group' && type !== 'file_task' && type !== 'mc_group' && type !== 'group' && type !== 'info_only' && type !== 'text_only' && (
          <label style={fieldLabel}>Max marks
            <input type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(parseInt(e.target.value) || 1)} style={input} />
            {(type === 'fill_in_blanks' || type === 'table' || type === 'labeled_inputs') && (
              <span style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>
                Marks are awarded in proportion to how many cells the pupil gets right. Tip: set Max marks to the number of blanks for one mark per cell.
              </span>
            )}
          </label>
        )}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={isExtension} onChange={(e) => setIsExtension(e.target.checked)} style={{ marginTop: 3 }} />
          <span>
            <span style={{ fontWeight: 600 }}>Extension activity</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--cw-muted)' }}>
              Pupils still get AI feedback and a mark, but this task is hidden from class
              analytics — it won't drag the class average down or count as missing work.
            </span>
          </span>
        </label>
        {type === 'multiple_choice' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Options</div>
            {options.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input value={o.label} onChange={(e) => { const a = [...options]; a[i].label = e.target.value; setOptions(a); }} style={{ ...input, width: 60 }} />
                <input placeholder="Option text" value={o.text} onChange={(e) => { const a = [...options]; a[i].text = e.target.value; setOptions(a); }} style={{ ...input, flex: 1 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  <input type="checkbox" checked={o.isCorrect} onChange={(e) => { const a = [...options]; a[i].isCorrect = e.target.checked; setOptions(a); }} />
                  Correct
                </label>
                <button onClick={() => setOptions(options.filter((_, j) => j !== i))} style={{ ...input, width: 40, cursor: 'pointer' }}>×</button>
              </div>
            ))}
            <button onClick={() => setOptions([...options, { label: String.fromCharCode(65 + options.length), text: '', isCorrect: false }])}
              style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', cursor: 'pointer' }}>
              + Add option
            </button>
          </div>
        )}
        {type === 'database_task' && (
          <div style={fieldLabel as any}>
            <div style={{ fontSize: 13, color: 'var(--cw-muted)', marginBottom: 6 }}>
              Pupils open a Data Sculptor sandbox and either design or populate a database in
              there. Each pupil gets their own forked copy of the database you paste below. Paste
              the embed link from Data Sculptor — pupils click "Open the database", do the work,
              then come back and click Submit. The same AI grader the DS embed uses will mark
              their work against your task description (one mark per bullet point).
            </div>
            <input
              type="text"
              placeholder="https://www.bhs-computing.co.uk/data-sculptor/?embed=…  (or just the token)"
              value={dbEmbedInput}
              onChange={(e) => setDbEmbedInput(e.target.value)}
              style={input}
            />
            <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>
              Tip: write your task instructions as a bullet-pointed list in the Task field
              above and (optionally) a data dictionary in the marking scheme — that's what gives
              the AI marker its rubric.
            </div>
          </div>
        )}
        {type === 'sql_task' && (
          <div style={fieldLabel as any}>
            <div style={{ fontSize: 13, color: 'var(--cw-muted)', marginBottom: 6 }}>
              Pupils write a SQL query against a Data Sculptor database. Paste the database's
              share link below — it will appear as an "Open the database" button on the task
              so pupils can run their query in DS, then paste the SQL back to submit.
            </div>
            <input
              type="url"
              placeholder="https://…/data-sculptor/?embed=… (or any Data Sculptor URL)"
              value={sqlDatabaseUrl}
              onChange={(e) => setSqlDatabaseUrl(e.target.value)}
              style={input}
            />
            <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>
              Optional — leave blank if pupils should write SQL without an attached database.
              The AI marks the SQL itself, not the result, so be specific in your marking scheme.
            </div>
          </div>
        )}
        {(type === 'python_task' || type === 'html_task') && (
          <div style={fieldLabel as any}>
            <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
              Pupils pick one of their saved {type === 'python_task' ? 'Python' : 'HTML/CSS'} projects
              from the in-site editor and submit it. The AI reads the code (it doesn't run it) and
              marks against your marking scheme. Make sure your marking scheme spells out what the
              code should do.
            </div>
          </div>
        )}
        {(type === 'video_question' || type === 'video_group') && (
          <div style={fieldLabel as any}>
            <div style={{ fontSize: 13, color: 'var(--cw-muted)', marginBottom: 6 }}>
              {type === 'video_group' ? (
                <>
                  Students watch the video then answer the questions attached to this card.
                  Save it first, then add questions to it using <strong>Add question → Attach to passage</strong>.
                </>
              ) : (
                <>
                  Pupils watch the video then type their answer below it. The AI marker reads the
                  pupil's written answer against your marking scheme — it does not watch the video,
                  so make sure your marking points are clear.
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                <input type="radio" name="vk" checked={videoKind === 'youtube'}
                  onChange={() => { setVideoKind('youtube'); setVideoUrl(''); setVideoFileName(''); }} />
                YouTube link
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                <input type="radio" name="vk" checked={videoKind === 'mp4'}
                  onChange={() => { setVideoKind('mp4'); setVideoUrl(''); setVideoFileName(''); }} />
                Upload a video file (.mp4 / .webm / .mov, up to 20 MB)
              </label>
            </div>
            {videoKind === 'youtube' ? (
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=…"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                style={input}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  type="file"
                  accept=".mp4,.webm,.mov,.m4v,video/mp4,video/webm,video/quicktime"
                  disabled={videoUploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadVideo(f); }}
                />
                {videoFileName && (
                  <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
                    Attached: <strong>{videoFileName}</strong>
                  </div>
                )}
                {videoUploading && <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>Uploading…</div>}
              </div>
            )}
          </div>
        )}
        {type === 'presentation' && (
          <div style={fieldLabel as any}>
            <div style={{ fontSize: 13, color: 'var(--cw-muted)', marginBottom: 6 }}>
              Pupils upload a PowerPoint (.pptx). By default the AI marker reads slide text,
              speaker notes and counts embedded images — it can't see colours, fonts or layout
              unless you turn on visual marking below.
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input type="checkbox" checked={useRubric} onChange={(e) => setUseRubric(e.target.checked)} />
              Use a rubric (mark each criterion separately)
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, marginTop: 6 }}>
              <input
                type="checkbox" checked={visualMarking}
                onChange={(e) => setVisualMarking(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                Visual marking (slower, more accurate)
                <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 2 }}>
                  Renders every slide to an image and lets the AI see layout, colour and pictures.
                  Marking takes ~10-30 seconds per pupil and uses more API tokens. First 25 slides only.
                </div>
              </span>
            </label>
            {useRubric && (
              <div style={{ marginTop: 8 }}>
                {rubric.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <input
                      placeholder="Criterion (e.g. Accurate content)"
                      value={r.label}
                      onChange={(e) => { const a = [...rubric]; a[i].label = e.target.value; setRubric(a); }}
                      style={{ ...input, flex: 1 }}
                    />
                    <input
                      type="number" min={0}
                      value={r.marks}
                      onChange={(e) => { const a = [...rubric]; a[i].marks = parseInt(e.target.value) || 0; setRubric(a); }}
                      style={{ ...input, width: 80 }}
                    />
                    <button onClick={() => setRubric(rubric.filter((_, j) => j !== i))}
                      style={{ ...input, width: 40, cursor: 'pointer' }}>×</button>
                  </div>
                ))}
                <button onClick={() => setRubric([...rubric, { label: '', marks: 1 }])}
                  style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', cursor: 'pointer' }}>
                  + Add criterion
                </button>
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--cw-muted)' }}>
                  Rubric total: <strong>{rubricTotal}</strong> · Max marks: <strong>{maxMarks}</strong>
                  {rubricTotal !== maxMarks && (
                    <> — these don't match. The AI marker will cap the total at {Math.min(rubricTotal, maxMarks)}.</>
                  )}
                </div>
              </div>
            )}
            {!useRubric && (
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--cw-muted)' }}>
                Without a rubric the AI gives one holistic mark out of {maxMarks}.
              </div>
            )}
            <div style={{ marginTop: 12, padding: 10, border: '1px solid var(--cw-border)', borderRadius: 8, background: 'var(--cw-surface)' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Starter presentation (optional)</div>
              <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginBottom: 8 }}>
                Upload a PowerPoint (.pptx) for pupils to download and edit. The AI marker
                will treat its content as a baseline and only credit the pupil's additions
                and changes against your success criteria.
              </div>
              {starterFileUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <a href={starterFileUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>
                    {starterFileName || 'Starter file'}
                  </a>
                  <button
                    onClick={() => { setStarterFileUrl(''); setStarterFileName(''); }}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--cw-border)', background: 'var(--cw-surface)', cursor: 'pointer', fontSize: 12 }}
                  >Remove</button>
                </div>
              ) : (
                <input
                  type="file"
                  accept=".pptx"
                  disabled={starterUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setStarterUploading(true);
                    setErr(null);
                    try {
                      const fd = new FormData();
                      fd.append('file', file);
                      const teacherToken = (() => {
                        try { return localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken') || ''; } catch { return ''; }
                      })();
                      const headers: Record<string, string> = {};
                      if (teacherToken) headers['x-teacher-password'] = teacherToken;
                      const r = await fetch('/api/classwork/teacher/upload/resource', { method: 'POST', headers, body: fd });
                      const data = await r.json();
                      if (!r.ok) throw new Error(data?.error || 'Upload failed');
                      setStarterFileUrl(data.url);
                      setStarterFileName(data.filename || file.name);
                    } catch (e: any) {
                      setErr(e.message || 'Starter upload failed');
                    } finally {
                      setStarterUploading(false);
                    }
                  }}
                />
              )}
              {starterUploading && <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>Uploading…</div>}
            </div>
          </div>
        )}
        {type === 'fill_in_blanks' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Blanks &amp; accepted answers</div>
            <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 2, marginBottom: 6 }}>
              Each row matches a <code>&#123;&#123;id&#125;&#125;</code> placeholder in the sentence above.
              For short answers, list acceptable answers separated by commas — matching is
              case-insensitive and ignores extra spaces. For sentence-style answers, leave the
              accepted-answers box blank and write a short marking note in the AI judge box
              instead — the marker will use it to award the mark.
            </div>
            {blanks.map((b, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8,
                padding: 8, border: '1px solid var(--cw-border)', borderRadius: 6, background: 'var(--cw-surface)',
              }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--cw-muted)' }}>&#123;&#123;</span>
                  <input
                    value={b.id}
                    placeholder="id"
                    onChange={(e) => { const a = [...blanks]; a[i].id = e.target.value; setBlanks(a); }}
                    style={{ ...input, width: 70 }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--cw-muted)' }}>&#125;&#125;</span>
                  <input
                    value={b.accept}
                    placeholder="Accepted answers (comma-sep) — for short answers"
                    onChange={(e) => { const a = [...blanks]; a[i].accept = e.target.value; setBlanks(a); }}
                    style={{ ...input, flex: 1 }}
                  />
                  <button
                    onClick={() => setBlanks(blanks.filter((_, j) => j !== i))}
                    style={{ ...input, width: 40, cursor: 'pointer' }}
                  >×</button>
                </div>
                <textarea
                  rows={1}
                  value={b.aiGuidance}
                  placeholder="AI judge note (optional) — e.g. 'Award if they mention worst-case O(n²)'"
                  onChange={(e) => { const a = [...blanks]; a[i].aiGuidance = e.target.value; setBlanks(a); }}
                  style={{ ...input, fontSize: 13 }}
                />
              </div>
            ))}
            <button
              onClick={() => {
                const nextId = String(blanks.length + 1);
                setBlanks([...blanks, { id: nextId, accept: '', aiGuidance: '' }]);
              }}
              style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', cursor: 'pointer' }}
            >+ Add blank</button>
          </div>
        )}
        {type === 'labeled_inputs' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Labelled fields</div>
            <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 2, marginBottom: 6 }}>
              Each field becomes a labelled input for the pupil. Tick <strong>Multi-line</strong> to
              show a text area instead of a single-line box — useful when pupils may list several
              items per field (e.g. multiple programs per category). For short exact answers, list
              accepted values separated by commas. For open answers, leave that blank and add an
              AI judge note; leave both blank to mark by hand.
            </div>
            <button
              type="button"
              onClick={() => setFields([
                { label: 'Communication', accept: '', multiline: true, aiGuidance: 'Award 1 mark if the student names at least one real software application used for communication (e.g. Zoom, Teams, Gmail, WhatsApp, Skype). Any genuine relevant example counts.' },
                { label: 'Education', accept: '', multiline: true, aiGuidance: 'Award 1 mark if the student names at least one real software application used in education (e.g. Google Classroom, Moodle, Duolingo, Khan Academy, Microsoft Teams). Any genuine relevant example counts.' },
                { label: 'Healthcare', accept: '', multiline: true, aiGuidance: 'Award 1 mark if the student names at least one real software application used in healthcare (e.g. SystmOne, EMIS, MyChart, NHS App, Babylon Health). Any genuine relevant example counts.' },
                { label: 'Finance', accept: '', multiline: true, aiGuidance: 'Award 1 mark if the student names at least one real software application used in finance (e.g. Xero, QuickBooks, Sage, Monzo, PayPal, Barclays app). Any genuine relevant example counts.' },
                { label: 'Entertainment', accept: '', multiline: true, aiGuidance: 'Award 1 mark if the student names at least one real software application used for entertainment (e.g. Netflix, Spotify, Steam, YouTube, Disney+, iPlayer). Any genuine relevant example counts.' },
              ])}
              style={{ marginBottom: 8, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--cw-accent)', color: 'var(--cw-accent)', background: 'transparent', cursor: 'pointer', fontSize: 13 }}
            >⚡ Quick setup: Technology categories</button>
            {fields.map((f, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8,
                padding: 8, border: '1px solid var(--cw-border)', borderRadius: 6, background: 'var(--cw-surface)',
              }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    value={f.label}
                    placeholder="Label (e.g. Communication)"
                    onChange={(e) => { const a = [...fields]; a[i] = { ...a[i], label: e.target.value }; setFields(a); }}
                    style={{ ...input, width: 160 }}
                  />
                  <input
                    value={f.accept}
                    placeholder="Accepted answers (comma-sep) — for short exact answers"
                    onChange={(e) => { const a = [...fields]; a[i] = { ...a[i], accept: e.target.value }; setFields(a); }}
                    style={{ ...input, flex: 1 }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!f.multiline}
                      onChange={(e) => { const a = [...fields]; a[i] = { ...a[i], multiline: e.target.checked }; setFields(a); }}
                    />
                    Multi-line
                  </label>
                  <button
                    onClick={() => setFields(fields.filter((_, j) => j !== i))}
                    style={{ ...input, width: 40, cursor: 'pointer' }}
                  >×</button>
                </div>
                <textarea
                  rows={2}
                  value={f.aiGuidance}
                  placeholder="AI judge note (optional) — e.g. 'Award 1 mark if the student names at least one relevant program for this category'"
                  onChange={(e) => { const a = [...fields]; a[i] = { ...a[i], aiGuidance: e.target.value }; setFields(a); }}
                  style={{ ...input, fontSize: 13 }}
                />
              </div>
            ))}
            <button
              onClick={() => setFields([...fields, { label: '', accept: '', aiGuidance: '', multiline: false }])}
              style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', cursor: 'pointer' }}
            >+ Add field</button>
          </div>
        )}
        {type === 'table' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Table</div>
            <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 2, marginBottom: 6 }}>
              Build the grid pupils will see. Tick "Blank" to turn a cell into an input box; in
              that case put the accepted answers (comma-separated) in the value field, or for
              sentence-style cells leave it blank and add a marking note in the AI judge box that
              appears beneath. Otherwise the cell is shown to pupils as fixed text.
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    {tblHeaders.map((h, c) => (
                      <th key={c} style={{ padding: 4, border: '1px solid var(--cw-border)', background: 'var(--cw-surface-muted)' }}>
                        <input
                          value={h}
                          onChange={(e) => {
                            const a = [...tblHeaders]; a[c] = e.target.value; setTblHeaders(a);
                          }}
                          style={{ ...input, width: '100%' }}
                        />
                      </th>
                    ))}
                    <th style={{ padding: 4, border: '1px solid var(--cw-border)', background: 'var(--cw-surface-muted)', width: 40 }}>
                      <button
                        title="Add column"
                        onClick={() => {
                          setTblHeaders([...tblHeaders, `Column ${tblHeaders.length + 1}`]);
                          setTblRows(tblRows.map((row) => [...row, { value: '', blank: false, accept: '', aiGuidance: '' }]));
                        }}
                        style={{ ...input, cursor: 'pointer', width: '100%' }}
                      >+</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tblRows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c} style={{ padding: 4, border: '1px solid var(--cw-border)', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <input
                              value={cell.blank ? cell.accept : cell.value}
                              placeholder={cell.blank ? 'Accepted answers (comma-sep)' : 'Cell text'}
                              onChange={(e) => {
                                const a = tblRows.map((rr) => rr.map((cc) => ({ ...cc })));
                                if (a[r][c].blank) a[r][c].accept = e.target.value;
                                else a[r][c].value = e.target.value;
                                setTblRows(a);
                              }}
                              style={{ ...input, width: '100%' }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--cw-muted)' }}>
                              <input
                                type="checkbox" checked={cell.blank}
                                onChange={(e) => {
                                  const a = tblRows.map((rr) => rr.map((cc) => ({ ...cc })));
                                  a[r][c].blank = e.target.checked;
                                  setTblRows(a);
                                }}
                              /> Blank for pupil
                            </label>
                            {cell.blank && (
                              <textarea
                                rows={1}
                                value={cell.aiGuidance}
                                placeholder="AI judge note (optional)"
                                onChange={(e) => {
                                  const a = tblRows.map((rr) => rr.map((cc) => ({ ...cc })));
                                  a[r][c].aiGuidance = e.target.value;
                                  setTblRows(a);
                                }}
                                style={{ ...input, width: '100%', fontSize: 12 }}
                              />
                            )}
                          </div>
                        </td>
                      ))}
                      <td style={{ padding: 4, border: '1px solid var(--cw-border)', textAlign: 'center' }}>
                        <button
                          onClick={() => setTblRows(tblRows.filter((_, i) => i !== r))}
                          style={{ ...input, cursor: 'pointer', width: '100%' }}
                          title="Delete row"
                        >×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button
                onClick={() =>
                  setTblRows([
                    ...tblRows,
                    tblHeaders.map(() => ({ value: '', blank: false, accept: '', aiGuidance: '' })),
                  ])
                }
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', cursor: 'pointer' }}
              >+ Add row</button>
              {tblHeaders.length > 1 && (
                <button
                  onClick={() => {
                    setTblHeaders(tblHeaders.slice(0, -1));
                    setTblRows(tblRows.map((row) => row.slice(0, -1)));
                  }}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', cursor: 'pointer' }}
                >− Remove last column</button>
              )}
            </div>
          </div>
        )}
        {type === 'crossword' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Crossword</div>
            <CrosswordEditor cfg={crosswordCfg} setCfg={setCrosswordCfg} />
          </div>
        )}
        {type === 'word_search' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Word search</div>
            <WordSearchEditor cfg={wordSearchCfg} setCfg={setWordSearchCfg} />
          </div>
        )}
        {type === 'matching' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Matching pairs</div>
            <MatchingEditor cfg={matchingCfg} setCfg={setMatchingCfg} />
          </div>
        )}
        {type === 'anagrams' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Anagrams</div>
            <AnagramsEditor cfg={anagramsCfg} setCfg={setAnagramsCfg} />
          </div>
        )}
        {type === 'hangman' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Hangman</div>
            <HangmanEditor cfg={hangmanCfg} setCfg={setHangmanCfg} />
          </div>
        )}
        {type === 'speed_round' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Speed round</div>
            <SpeedRoundEditor cfg={speedRoundCfg} setCfg={setSpeedRoundCfg} />
          </div>
        )}
        {type === 'ordering' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Ordering / sequencing</div>
            <OrderingEditor cfg={orderingCfg} setCfg={setOrderingCfg} />
          </div>
        )}
        {type === 'caesar_cipher' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Caesar cipher</div>
            <CaesarEditor cfg={caesarCfg} setCfg={setCaesarCfg} />
          </div>
        )}
        {type === 'spot_phish' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Spot the phish</div>
            <SpotPhishEditor cfg={spotPhishCfg} setCfg={setSpotPhishCfg} />
          </div>
        )}
        {type === 'binary_hex' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Binary / hex blitz</div>
            <BinaryHexEditor cfg={binaryHexCfg} setCfg={setBinaryHexCfg} />
          </div>
        )}
        {type === 'bit_ops' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Bit-manipulation puzzle</div>
            <BitOpsEditor cfg={bitOpsCfg} setCfg={setBitOpsCfg} />
          </div>
        )}
        {type === 'code_tracer' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Code tracer</div>
            <CodeTracerEditor cfg={codeTracerCfg} setCfg={setCodeTracerCfg} />
          </div>
        )}
        {type === 'flowchart_seq' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Flowchart sequencer</div>
            <FlowchartEditor cfg={flowchartCfg} setCfg={setFlowchartCfg} />
          </div>
        )}
        {type === 'sorting_race' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Sorting race</div>
            <SortingRaceEditor cfg={sortingRaceCfg} setCfg={setSortingRaceCfg} />
          </div>
        )}
        {type === 'convert_relay' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Convert-it relay</div>
            <ConvertRelayEditor cfg={convertRelayCfg} setCfg={setConvertRelayCfg} />
          </div>
        )}
        {type === 'url_anatomy' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>URL anatomy</div>
            <UrlAnatomyEditor cfg={urlAnatomyCfg} setCfg={setUrlAnatomyCfg} />
          </div>
        )}
        {type === 'truth_table' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Truth table builder</div>
            <TruthTableEditor cfg={truthTableCfg} setCfg={setTruthTableCfg} />
          </div>
        )}
        {type === 'field_type_sort' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Field-type sorter</div>
            <FieldTypeSortEditor cfg={fieldTypeSortCfg} setCfg={setFieldTypeSortCfg} />
          </div>
        )}
        {type === 'io_sort' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Input / output sorter</div>
            <IoSortEditor cfg={ioSortCfg} setCfg={setIoSortCfg} />
          </div>
        )}
        {type === 'html_match' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>HTML element matcher</div>
            <HtmlMatchEditor cfg={htmlMatchCfg} setCfg={setHtmlMatchCfg} />
          </div>
        )}
        {type === 'password_forge' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Password forge</div>
            <PasswordForgeEditor cfg={passwordForgeCfg} setCfg={setPasswordForgeCfg} />
          </div>
        )}
        {type === 'privacy_radar' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Privacy radar</div>
            <PrivacyRadarEditor cfg={privacyRadarCfg} setCfg={setPrivacyRadarCfg} />
          </div>
        )}
        {type === 'validation_rules' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Validation-rule matcher</div>
            <ValidationRulesEditor cfg={validationRulesCfg} setCfg={setValidationRulesCfg} />
          </div>
        )}
        {type === 'find_duplicate' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Find the duplicate row</div>
            <FindDuplicateEditor cfg={findDuplicateCfg} setCfg={setFindDuplicateCfg} />
          </div>
        )}
        {type === 'bin_search' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Binary-search trace</div>
            <BinSearchEditor cfg={binSearchCfg} setCfg={setBinSearchCfg} />
          </div>
        )}
        {type === 'box_model' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>CSS box model</div>
            <BoxModelEditor cfg={boxModelCfg} setCfg={setBoxModelCfg} />
          </div>
        )}
        {type === 'friend_or_fake' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Friend or fake</div>
            <FriendOrFakeEditor cfg={friendOrFakeCfg} setCfg={setFriendOrFakeCfg} />
          </div>
        )}
        {type === 'dm_danger' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>DM danger</div>
            <DmDangerEditor cfg={dmDangerCfg} setCfg={setDmDangerCfg} />
          </div>
        )}
        {type === 'upstander' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Be an Upstander</div>
            <UpstanderEditor cfg={upstanderCfg} setCfg={setUpstanderCfg} />
          </div>
        )}
        {type === 'malware_triage' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Malware triage</div>
            <MalwareTriageEditor cfg={malwareTriageCfg} setCfg={setMalwareTriageCfg} />
          </div>
        )}
        {type === '2fa_escape' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>2FA escape</div>
            <TwoFactorEscapeEditor cfg={twoFactorEscapeCfg} setCfg={setTwoFactorEscapeCfg} />
          </div>
        )}
        {type === 'a11y_audit' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Accessibility audit</div>
            <A11yAuditEditor cfg={a11yAuditCfg} setCfg={setA11yAuditCfg} />
          </div>
        )}
        {type === 'fetch_execute' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Fetch–decode–execute</div>
            <FetchExecuteEditor cfg={fetchExecuteCfg} setCfg={setFetchExecuteCfg} />
          </div>
        )}
        {type === 'screen_time' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Screen-time check</div>
            <ScreenTimeEditor cfg={screenTimeCfg} setCfg={setScreenTimeCfg} />
          </div>
        )}
        {type === 'footprint_trail' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Digital footprint trail</div>
            <FootprintTrailEditor cfg={footprintTrailCfg} setCfg={setFootprintTrailCfg} />
          </div>
        )}
        {type === 'social_engineer' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Social-engineering scams</div>
            <SocialEngineerEditor cfg={socialEngineerCfg} setCfg={setSocialEngineerCfg} />
          </div>
        )}
        {type === 'cipher_quest' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Cipher quest</div>
            <CipherQuestEditor cfg={cipherQuestCfg} setCfg={setCipherQuestCfg} />
          </div>
        )}
        {type === 'normalise_it' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Normalise it</div>
            <NormaliseItEditor cfg={normaliseItCfg} setCfg={setNormaliseItCfg} />
          </div>
        )}
        {type === 'subnet_calc' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>IP-address classifier</div>
            <SubnetCalcEditor cfg={subnetCalcCfg} setCfg={setSubnetCalcCfg} />
          </div>
        )}
        {type === 'phish_inbox' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Phish-inbox triage</div>
            <PhishInboxEditor cfg={phishInboxCfg} setCfg={setPhishInboxCfg} />
          </div>
        )}
        {type === 'build_pc' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Build-a-PC parts</div>
            <BuildPcEditor cfg={buildPcCfg} setCfg={setBuildPcCfg} />
          </div>
        )}
        {type === 'os_sched' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>OS scheduling algorithms</div>
            <OsSchedEditor cfg={osSchedCfg} setCfg={setOsSchedCfg} />
          </div>
        )}
        {type === 'query_visual' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>SQL operation identifier</div>
            <QueryVisualEditor cfg={queryVisualCfg} setCfg={setQueryVisualCfg} />
          </div>
        )}
        {type === 'schema_arch' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Schema relationships</div>
            <SchemaArchEditor cfg={schemaArchCfg} setCfg={setSchemaArchCfg} />
          </div>
        )}
        {type === 'tag_soup_repair' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Tag-soup HTML repair</div>
            <TagSoupRepairEditor cfg={tagSoupRepairCfg} setCfg={setTagSoupRepairCfg} />
          </div>
        )}
        {type === 'selector_golf' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>CSS-selector golf</div>
            <SelectorGolfEditor cfg={selectorGolfCfg} setCfg={setSelectorGolfCfg} />
          </div>
        )}
        {type === 'css_sliders' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>CSS-property sliders</div>
            <CssSlidersEditor cfg={cssSlidersCfg} setCfg={setCssSlidersCfg} />
          </div>
        )}
        {type === 'mindmap' && (
          <div style={fieldLabel as any}>
            <div style={{ fontWeight: 600 }}>Mindmap activity</div>
            <MindmapEditor cfg={mindmapCfg} setCfg={setMindmapCfg} />
          </div>
        )}
        {type !== 'section_header' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ ...fieldLabel, marginBottom: 4 }}>Resources for this task</div>
            <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginBottom: 6 }}>
              Attach images, documents, YouTube clips, links or embeds. Pupils see them above the answer area on this task only.
            </div>
            {isEdit ? (
              <QuestionResources questionId={existing!.id} isTeacher={true} />
            ) : (
              <PendingResourcesEditor
                ref={pendingEditorRef}
                items={pendingResources}
                onChange={setPendingResources}
              />
            )}
          </div>
        )}
        {type !== 'passage' && type !== 'video_group' && type !== 'file_task' && type !== 'mc_group' && type !== 'group' && type !== 'info_only' && type !== 'text_only' && type !== 'section_header' && (
          <>
            <label style={fieldLabel}>Marking scheme (teacher view only)
              <textarea rows={2} value={markingScheme} onChange={(e) => setMarkingScheme(e.target.value)} style={input} />
            </label>
            <label style={fieldLabel}>
              {type === 'multiple_choice'
                ? 'AI feedback guidance (optional — extra context for the AI explanation)'
                : 'AI grading guidance (used by the AI marker)'}
              <textarea rows={2} value={aiGuidance} onChange={(e) => setAiGuidance(e.target.value)} style={input} />
              {type === 'multiple_choice' && (
                <span style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>
                  The AI always explains why the answer is right or wrong. Add extra context here (e.g. "Binary uses base 2 because…") to make the explanation richer.
                </span>
              )}
            </label>
          </>
        )}
        {type === 'text_only' && (
          // Friendly explanation so the teacher understands why the marking
          // scheme and AI guidance fields are deliberately absent for an
          // offline / jotter task: there's nothing to auto-mark, so neither
          // field is collected, stored, or required.
          <div style={{
            marginTop: 12, padding: '10px 12px', borderRadius: 8,
            background: 'var(--cw-tint-textonly-bg)', border: '1px solid var(--cw-tint-textonly-border)',
            color: 'var(--cw-tint-textonly-ink)', fontSize: 13, lineHeight: 1.45,
          }}>
            <strong>No marking needed.</strong> Jotter tasks don’t need a
            marking scheme or AI guidance — pupils write the answer in their
            jotter and there’s nothing for the AI marker to score, so those
            fields are skipped.
          </div>
        )}
        {err && <div style={{ color: 'var(--cw-danger)', fontSize: 14, marginTop: 6 }}>{err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--cw-border)', background: 'var(--cw-surface)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={busy} style={{
            background: 'var(--cw-accent)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
          }}>{busy ? 'Saving…' : (isEdit ? 'Save changes' : 'Save task')}</button>
        </div>
      </div>
    </div>
  );
}

function youtubeIdFromUrl(url: string): string | null {
  // Accepts watch?v=, youtu.be/, embed/, shorts/.
  const patterns = [
    /youtu\.be\/([\w-]{6,})/i,
    /[?&]v=([\w-]{6,})/i,
    /youtube\.com\/embed\/([\w-]{6,})/i,
    /youtube\.com\/shorts\/([\w-]{6,})/i,
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

function VideoQuestionPlayer({ config, compact }: { config: any; compact?: boolean }) {
  const v = config && typeof config === 'object' ? config.video : null;
  if (!v || typeof v !== 'object' || !v.url) {
    return (
      <div style={{ marginTop: 10, padding: 10, border: '1px dashed var(--cw-border)', borderRadius: 8, fontSize: 14, color: 'var(--cw-muted)' }}>
        No video has been attached to this task yet.
      </div>
    );
  }
  const maxW = 560;
  if (v.kind === 'youtube') {
    const id = youtubeIdFromUrl(String(v.url));
    if (!id) {
      return (
        <div style={{ marginTop: 10, fontSize: 14, color: 'var(--cw-danger)' }}>
          The attached YouTube link couldn't be read. <a href={v.url} target="_blank" rel="noopener noreferrer">Open it in a new tab.</a>
        </div>
      );
    }
    return (
      <div style={{ marginTop: 10 }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title="Video task"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ display: 'block', width: '100%', maxWidth: maxW, aspectRatio: '16 / 9', border: 0, borderRadius: 8, background: '#000', margin: '0 auto' }}
        />
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--cw-muted)', maxWidth: maxW, margin: '6px auto 0' }}>
          Can't see the video?{' '}
          <a href={v.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cw-accent)' }}>
            Open it in YouTube ↗
          </a>
        </div>
      </div>
    );
  }
  // mp4 / webm / mov — browser preserves native aspect ratio automatically
  return (
    <video
      controls
      preload="metadata"
      src={v.url}
      style={{ display: 'block', marginTop: 10, width: '100%', maxWidth: maxW, borderRadius: 8, background: '#000', marginLeft: 'auto', marginRight: 'auto' }}
    >
      Your browser can't play this video. <a href={v.url} target="_blank" rel="noopener noreferrer">Download it</a>.
    </video>
  );
}

/* ---------- Per-question resources ----------
   Lets a teacher attach images / documents / YouTube videos / generic links /
   embed URLs to one specific question. Pupils see them rendered above the
   answer area; teachers also get + Add / × Remove controls. The actual list
   item rendering is shared with the legacy LessonResources block via
   `renderResource()` so both look identical. */

function renderResource(r: LessonResource): React.ReactNode {
  const title = r.title || r.url;
  if (r.kind === 'youtube') {
    const id = youtubeIdFromUrl(r.url);
    if (!id) {
      return <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cw-accent)' }}>{title}</a>;
    }
    return (
      <figure key={r.id} style={{ margin: 0 }}>
        {r.title && <figcaption style={{ fontWeight: 600, marginBottom: 6 }}>{r.title}</figcaption>}
        <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
          <iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--cw-muted)' }}>
          Can't see the video?{' '}
          <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cw-accent)' }}>
            Open in YouTube ↗
          </a>
        </div>
      </figure>
    );
  }
  if (r.kind === 'embed') {
    return (
      <figure key={r.id} style={{ margin: 0 }}>
        {r.title && <figcaption style={{ fontWeight: 600, marginBottom: 6 }}>{r.title}</figcaption>}
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#000', border: '1px solid var(--cw-border)', height: 600, maxHeight: '80vh' }}>
          <iframe src={r.url} title={title} loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-pointer-lock allow-downloads"
            allow="autoplay; fullscreen; clipboard-write; gamepad; microphone; camera; geolocation"
            allowFullScreen referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', border: 0, display: 'block', background: 'var(--cw-surface)' }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--cw-muted)' }}>
          Trouble loading? <a href={r.url} target="_blank" rel="noopener noreferrer">Open in a new tab</a>.
        </div>
      </figure>
    );
  }
  if (r.kind === 'image') {
    return (
      <figure key={r.id} style={{ margin: 0 }}>
        <img src={r.url} alt={title} style={{ maxWidth: '100%', maxHeight: 480, borderRadius: 8, border: '1px solid var(--cw-border)', display: 'block' }} />
        {r.title && <figcaption style={{ marginTop: 6, fontSize: 13, color: 'var(--cw-muted)' }}>{r.title}</figcaption>}
      </figure>
    );
  }
  if (r.kind === 'link') {
    // Render as a big, obvious clickable card. Younger pupils were struggling
    // to see plain inline links, so this gives them a button-style preview
    // with the title (or URL) up top and the URL underneath, and a small
    // "Open in new tab" hint on the right.
    let host = '';
    try { host = new URL(r.url).hostname.replace(/^www\./, ''); } catch { host = r.url; }
    const display = r.title || host;
    return (
      <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
         style={{
           display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
           background: 'var(--cw-surface)', border: '1px solid var(--cw-border)', borderRadius: 10,
           color: 'var(--cw-ink)', textDecoration: 'none', maxWidth: 480,
           boxShadow: '0 1px 2px rgba(0,0,0,0.04)', transition: 'box-shadow .15s, border-color .15s',
         }}
         onMouseOver={(e) => {
           (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
           (e.currentTarget as HTMLElement).style.borderColor = 'var(--cw-accent)';
         }}
         onMouseOut={(e) => {
           (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
           (e.currentTarget as HTMLElement).style.borderColor = 'var(--cw-border)';
         }}
      >
        <div style={{
          flex: '0 0 auto', width: 40, height: 40, borderRadius: 8,
          background: '#e0e7ff', color: '#3730a3',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700,
        }} aria-hidden="true">↗</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, color: '#1d4ed8', textDecoration: 'underline',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{display}</div>
          <div style={{
            fontSize: 13, color: 'var(--cw-muted)', marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{r.url}</div>
        </div>
      </a>
    );
  }
  // Document download — same look so it reads as a clickable button.
  return (
    <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
       style={{
         display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px',
         background: 'var(--cw-surface-soft)', border: '1px solid var(--cw-border)', borderRadius: 8,
         color: 'var(--cw-ink)', textDecoration: 'none', fontWeight: 600,
         alignSelf: 'flex-start', maxWidth: '100%',
       }}>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
        background: 'var(--cw-tint-amber-bg)', color: 'var(--cw-tint-amber-ink)',
        border: '1px solid var(--cw-tint-amber-border)',
        textTransform: 'uppercase', flex: '0 0 auto',
      }}>Document</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        Open: {title}
      </span>
    </a>
  );
}

/* Lightweight resources editor used inside the New-question modal where the
   question doesn't have an id yet. Mirrors the look of <QuestionResources>
   but stages everything in local state; the parent modal POSTs each entry
   to /api/classwork/questions/:newId/resources after the question is saved.

   Two safety nets prevent the "I added a resource but it didn't appear"
   bug class:
     - Uploaded files (image/document) are auto-staged the moment the
       upload succeeds — picking a file IS the "I want this" signal, so
       making teachers click an extra "Add" button is needless friction.
     - The parent modal can call `flush()` via the exposed ref right
       before saving the task; that grabs the open URL/embed/youtube
       form's draft (if any) and appends it to the staged list, so a
       teacher who types a URL and hits Save without clicking Add still
       gets their resource attached. flush() returns the final list
       synchronously so the parent doesn't have to wait on a setState. */
type PendingResource = { kind: LessonResource['kind']; title: string; url: string };
export type PendingResourcesEditorHandle = { flush: () => PendingResource[] };

const PendingResourcesEditor = forwardRef<PendingResourcesEditorHandle, {
  items: PendingResource[];
  onChange: (next: PendingResource[]) => void;
}>(function PendingResourcesEditor({ items, onChange }, ref) {
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState<LessonResource['kind']>('image');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Expose a flush handle so the parent's Save handler can sweep up any
  // resource the teacher composed but never clicked "Add" on. Returns the
  // resulting list synchronously so the parent doesn't have to dance
  // around setState batching.
  useImperativeHandle(ref, () => ({
    flush: () => {
      const trimmedUrl = url.trim();
      // Only flush a draft for the URL-paste kinds. Image/document drafts
      // are auto-staged at upload time, so a leftover `url` here would
      // already be in `items`.
      const draftable = kind === 'youtube' || kind === 'link' || kind === 'embed';
      if (showForm && draftable && trimmedUrl) {
        const next = [...items, { kind, title: title.trim(), url: trimmedUrl }];
        onChange(next);
        setShowForm(false); setUrl(''); setTitle(''); setKind('image'); setErr(null);
        return next;
      }
      return items;
    },
  }), [items, showForm, url, kind, title, onChange]);

  async function uploadFile(file: File) {
    setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const teacherToken = (() => {
        try { return localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken') || ''; } catch { return ''; }
      })();
      const headers: Record<string, string> = {};
      if (teacherToken) headers['x-teacher-password'] = teacherToken;
      const r = await fetch('/api/classwork/teacher/upload/resource', { method: 'POST', headers, body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Upload failed');
      // Auto-stage: a successful upload IS the "Add" action for files.
      // Without this, teachers commonly upload a file then click the
      // outer Save without hitting the inner Add button, and the
      // resource silently never gets attached.
      const stagedTitle = (title.trim() || data.filename || file.name);
      onChange([...items, { kind, title: stagedTitle, url: data.url }]);
      setShowForm(false); setKind('image'); setTitle(''); setUrl('');
    } catch (e: any) {
      setErr(e.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  function add() {
    if (!url.trim()) { setErr('Please provide a URL or upload a file.'); return; }
    onChange([...items, { kind, title: title.trim(), url: url.trim() }]);
    setKind('image'); setTitle(''); setUrl(''); setErr(null); setShowForm(false);
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div>
      {items.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          padding: 10, background: 'var(--cw-surface-soft)', border: '1px solid var(--cw-border)', borderRadius: 8,
          marginBottom: 8,
        }}>
          {items.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                <strong>{r.kind}</strong>{r.title ? ` — ${r.title}` : ''}
                <div style={{ color: 'var(--cw-muted)', fontSize: 12, wordBreak: 'break-all' }}>{r.url}</div>
              </div>
              <button onClick={() => remove(i)} title="Remove"
                style={{
                  border: '1px solid var(--cw-border)', background: 'var(--cw-surface)', borderRadius: 6,
                  padding: '4px 8px', cursor: 'pointer', color: 'var(--cw-danger)', fontWeight: 700,
                }}>×</button>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--cw-muted)' }}>These will be attached when you click <em>Save task</em>.</div>
        </div>
      )}
      {!showForm ? (
        <button type="button" onClick={() => setShowForm(true)} style={{
          fontSize: 13, padding: '6px 10px', border: '1px dashed var(--cw-border)',
          background: 'var(--cw-surface)', borderRadius: 6, cursor: 'pointer', color: 'var(--cw-muted)',
        }}>+ Add resource to this task</button>
      ) : (
        <div style={{ padding: 10, border: '1px solid var(--cw-border)', borderRadius: 8, background: 'var(--cw-surface)' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={kind} onChange={(e) => { setKind(e.target.value as any); setUrl(''); }} style={input}>
              <option value="image">Image (upload)</option>
              <option value="document">Document (upload)</option>
              <option value="youtube">YouTube link</option>
              <option value="link">Web link</option>
              <option value="embed">Embed (iframe URL)</option>
            </select>
            <input
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ ...input, flex: '1 1 200px' }}
            />
          </div>
          {(kind === 'image' || kind === 'document') ? (
            <div style={{ marginTop: 6 }}>
              <input type="file"
                accept={kind === 'image' ? 'image/*' : '.pdf,.docx,.pptx,.xlsx,.txt,.csv,.zip'}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
              />
              {url && <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>Uploaded: <code>{url}</code></div>}
            </div>
          ) : (
            <input
              placeholder={kind === 'youtube' ? 'https://www.youtube.com/watch?v=…' : 'https://…'}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ ...input, marginTop: 6, width: '100%' }}
            />
          )}
          {err && <div style={{ color: 'var(--cw-danger)', fontSize: 13, marginTop: 6 }}>{err}</div>}
          <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setShowForm(false); setErr(null); setUrl(''); setTitle(''); }}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', background: 'var(--cw-surface)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="button" onClick={add} disabled={busy} style={{
              padding: '6px 12px', borderRadius: 6, border: 'none',
              background: 'var(--cw-accent)', color: '#fff', fontWeight: 600, cursor: 'pointer',
            }}>{busy ? 'Uploading…' : 'Add'}</button>
          </div>
        </div>
      )}
    </div>
  );
});

function QuestionResources({ questionId, isTeacher, initialResources }: { questionId: string; isTeacher: boolean; initialResources?: LessonResource[] }) {
  // If the parent has already pre-fetched the bulk resource map for the whole
  // lesson, seed our state from that and skip the on-mount HTTP call. Without
  // this every question card would fire its own /resources request — N+1.
  const [resources, setResources] = useState<LessonResource[] | null>(
    initialResources !== undefined ? initialResources : null
  );
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState<LessonResource['kind']>('image');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const list = await api<LessonResource[]>(`/api/classwork/questions/${questionId}/resources`);
      setResources(list || []);
    } catch {
      setResources([]);
    }
  }
  useEffect(() => {
    // Only fetch when the parent didn't seed us. Teacher add/remove handlers
    // below still call load() directly to refresh after a write.
    if (initialResources === undefined) load();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [questionId]);

  async function uploadFile(file: File) {
    setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const teacherToken = (() => {
        try { return localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken') || ''; } catch { return ''; }
      })();
      const headers: Record<string, string> = {};
      if (teacherToken) headers['x-teacher-password'] = teacherToken;
      const r = await fetch('/api/classwork/teacher/upload/resource', { method: 'POST', headers, body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Upload failed');
      setUrl(data.url);
      if (!title) setTitle(data.filename || file.name);
    } catch (e: any) {
      setErr(e.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    if (!url.trim()) { setErr('Please provide a URL or upload a file.'); return; }
    setBusy(true); setErr(null);
    try {
      await api(`/api/classwork/questions/${questionId}/resources`, {
        method: 'POST',
        body: JSON.stringify({ kind, url: url.trim(), title: title.trim() || null }),
      });
      setUrl(''); setTitle(''); setKind('image'); setShowForm(false);
      await load();
    } catch (e: any) {
      setErr(e.message || 'Failed to add resource');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Remove this resource?')) return;
    try {
      await api(`/api/classwork/resources/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      window.alert(e.message || 'Failed to remove');
    }
  }

  if (!resources) return null;
  if (!isTeacher && resources.length === 0) return null;

  return (
    <div style={{ marginTop: 12 }}>
      {resources.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          padding: 12, background: 'var(--cw-surface-soft)', border: '1px solid var(--cw-border)', borderRadius: 8,
        }}>
          {resources.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>{renderResource(r)}</div>
              {isTeacher && (
                <button onClick={() => remove(r.id)} title="Remove resource"
                  style={{
                    border: '1px solid var(--cw-border)', background: 'var(--cw-surface)', borderRadius: 6,
                    padding: '4px 8px', cursor: 'pointer', color: 'var(--cw-danger)', fontWeight: 700,
                  }}>×</button>
              )}
            </div>
          ))}
        </div>
      )}
      {isTeacher && (
        <div style={{ marginTop: 8 }}>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} style={{
              fontSize: 13, padding: '6px 10px', border: '1px dashed var(--cw-border)',
              background: 'var(--cw-surface)', borderRadius: 6, cursor: 'pointer', color: 'var(--cw-muted)',
            }}>+ Add resource to this task</button>
          ) : (
            <div style={{ padding: 10, border: '1px solid var(--cw-border)', borderRadius: 8, background: 'var(--cw-surface)' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={kind} onChange={(e) => setKind(e.target.value as any)} style={input}>
                  <option value="image">Image (upload)</option>
                  <option value="document">Document (upload)</option>
                  <option value="youtube">YouTube link</option>
                  <option value="link">Web link</option>
                  <option value="embed">Embed (iframe URL)</option>
                </select>
                <input
                  placeholder="Title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ ...input, flex: '1 1 200px' }}
                />
              </div>
              {(kind === 'image' || kind === 'document') ? (
                <div style={{ marginTop: 6 }}>
                  <input type="file"
                    accept={kind === 'image' ? 'image/*' : '.pdf,.docx,.pptx,.xlsx,.txt,.csv,.zip'}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
                  />
                  {url && <div style={{ fontSize: 12, color: 'var(--cw-muted)', marginTop: 4 }}>Uploaded: <code>{url}</code></div>}
                </div>
              ) : (
                <input
                  placeholder={kind === 'youtube' ? 'https://www.youtube.com/watch?v=…' : 'https://…'}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ ...input, marginTop: 6, width: '100%' }}
                />
              )}
              {err && <div style={{ color: 'var(--cw-danger)', fontSize: 13, marginTop: 6 }}>{err}</div>}
              <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowForm(false); setErr(null); setUrl(''); setTitle(''); }}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--cw-border)', background: 'var(--cw-surface)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={add} disabled={busy} style={{
                  padding: '6px 12px', borderRadius: 6, border: 'none',
                  background: 'var(--cw-accent)', color: '#fff', fontWeight: 600, cursor: 'pointer',
                }}>{busy ? 'Saving…' : 'Add'}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Kept for reference but no longer mounted: lesson-level resources have been
// retired in favour of per-question attachments (see QuestionResources).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _LessonResources_legacy({ resources }: { resources: LessonResource[] }) {
  return (
    <div style={{
      background: 'var(--cw-surface)', border: '1px solid var(--cw-border)', borderRadius: 12,
      padding: 18, marginTop: 14, boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
    }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--cw-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Resources
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {resources.map((r) => {
          const title = r.title || r.url;
          if (r.kind === 'youtube') {
            const id = youtubeIdFromUrl(r.url);
            if (!id) {
              return (
                <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                   style={{ color: 'var(--cw-accent)' }}>{title}</a>
              );
            }
            return (
              <figure key={r.id} style={{ margin: 0 }}>
                {r.title && <figcaption style={{ fontWeight: 600, marginBottom: 6 }}>{r.title}</figcaption>}
                <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                  />
                </div>
              </figure>
            );
          }
          if (r.kind === 'embed') {
            return (
              <figure key={r.id} style={{ margin: 0 }}>
                {r.title && <figcaption style={{ fontWeight: 600, marginBottom: 6 }}>{r.title}</figcaption>}
                <div style={{
                  position: 'relative', borderRadius: 8, overflow: 'hidden',
                  background: '#000', border: '1px solid var(--cw-border)',
                  height: 600, maxHeight: '80vh',
                }}>
                  <iframe
                    src={r.url}
                    title={title}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-pointer-lock allow-downloads"
                    allow="autoplay; fullscreen; clipboard-write; gamepad; microphone; camera; geolocation"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', border: 0, display: 'block', background: 'var(--cw-surface)' }}
                  />
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--cw-muted)' }}>
                  Trouble loading? <a href={r.url} target="_blank" rel="noopener noreferrer">Open in a new tab</a>.
                </div>
              </figure>
            );
          }
          if (r.kind === 'image') {
            return (
              <figure key={r.id} style={{ margin: 0 }}>
                <img
                  src={r.url} alt={title}
                  style={{ maxWidth: '100%', maxHeight: 480, borderRadius: 8, border: '1px solid var(--cw-border)', display: 'block' }}
                />
                {r.title && (
                  <figcaption style={{ marginTop: 6, fontSize: 13, color: 'var(--cw-muted)' }}>{r.title}</figcaption>
                )}
              </figure>
            );
          }
          // document or generic link
          const isDoc = r.kind === 'document';
          return (
            <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
               style={{
                 display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                 background: 'var(--cw-surface-soft)', border: '1px solid var(--cw-border)', borderRadius: 8,
                 color: 'var(--cw-ink)', textDecoration: 'none', fontWeight: 600,
                 alignSelf: 'flex-start', maxWidth: '100%',
               }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: isDoc ? 'var(--cw-tint-amber-bg)' : 'var(--cw-tint-indigo-bg)',
                color: isDoc ? 'var(--cw-tint-amber-ink)' : 'var(--cw-tint-indigo-ink)',
                border: `1px solid ${isDoc ? 'var(--cw-tint-amber-border)' : 'var(--cw-tint-indigo-ink)'}`,
                textTransform: 'uppercase', flex: '0 0 auto',
              }}>{isDoc ? 'Document' : 'Link'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isDoc ? `Open: ${title}` : title}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function LessonHeader({ lesson }: { lesson: LessonInfo }) {
  // Split a textarea blob into bullet-style lines, ignoring blank lines and
  // any leading "- ", "* " or numbered prefix the teacher may have pasted.
  const toLines = (raw: string | null | undefined): string[] => {
    if (!raw) return [];
    return raw.split(/\r?\n/)
      .map((s) => s.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
      .filter(Boolean);
  };
  const li = lesson.is_test ? [] : toLines(lesson.learning_intentions);
  const sc = lesson.is_test ? [] : toLines(lesson.success_criteria);
  return (
    <div style={{
      background: 'var(--cw-surface)', border: '1px solid var(--cw-border)', borderRadius: 12,
      padding: 18, boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
    }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>{lesson.title}</h1>
      {(li.length > 0 || sc.length > 0) && (
        <div style={{
          display: 'grid', gridTemplateColumns: li.length && sc.length ? '1fr 1fr' : '1fr',
          gap: 18, marginTop: 14,
        }}>
          {li.length > 0 && (
            <section style={{
              background: 'var(--cw-tint-info-bg)', border: '1px solid var(--cw-tint-info-border)',
              borderRadius: 8, padding: '12px 14px',
            }}>
              <h2 style={{ margin: 0, fontSize: 14, color: 'var(--cw-tint-info-ink)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Learning intentions
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--cw-tint-info-ink)', fontStyle: 'italic' }}>
                We are learning about…
              </p>
              <ul style={{ margin: '8px 0 0', paddingLeft: 22, color: 'var(--cw-ink)', fontSize: 15, lineHeight: 1.5 }}>
                {li.map((line, i) => <li key={i} style={{ marginBottom: i < li.length - 1 ? 10 : 0 }}>{line}</li>)}
              </ul>
            </section>
          )}
          {sc.length > 0 && (
            <section style={{
              background: 'var(--cw-tint-success-bg)', border: '1px solid var(--cw-tint-success-border)',
              borderRadius: 8, padding: '12px 14px',
            }}>
              <h2 style={{ margin: 0, fontSize: 14, color: 'var(--cw-tint-success-ink)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Success criteria
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--cw-tint-success-ink)', fontStyle: 'italic' }}>
                I am looking for you to…
              </p>
              <ul style={{ margin: '8px 0 0', paddingLeft: 22, color: 'var(--cw-ink)', fontSize: 15, lineHeight: 1.5 }}>
                {sc.map((line, i) => <li key={i} style={{ marginBottom: i < sc.length - 1 ? 10 : 0 }}>{line}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ── McGroupAnswer ─────────────────────────────────────────────────────────────
// Student-facing component for mc_group questions.  All child multiple_choice
// questions are displayed together with a single "Submit answers" button.
function McGroupAnswer({
  group,
  childQuestions,
  submissions,
  unlockedQIds,
  preview,
  onPreviewAnswered,
  onSubmitted,
}: {
  group: Question;
  childQuestions: Question[];
  submissions: Submission[];
  unlockedQIds: Set<string>;
  preview: boolean;
  onPreviewAnswered: (ids: string[]) => void;
  onSubmitted: () => void;
}) {
  // Most recent submission per child question.
  const lastByQid = useMemo(() => {
    const map: Record<string, Submission> = {};
    const ids = new Set(childQuestions.map((c) => c.id));
    for (const s of submissions) {
      if (!ids.has(s.question_id)) continue;
      if (!map[s.question_id] || new Date(s.submitted_at) > new Date(map[s.question_id].submitted_at)) {
        map[s.question_id] = s;
      }
    }
    return map;
  }, [submissions, childQuestions]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [previewResults, setPreviewResults] = useState<Record<string, { marksAwarded: number | null; feedback: string | null; maxMarks: number }> | null>(null);

  // Pre-fill from last submissions on first render.
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const init: Record<string, string> = {};
    for (const c of childQuestions) {
      const sub = lastByQid[c.id];
      if (sub?.selected_option_label) init[c.id] = sub.selected_option_label;
    }
    if (Object.keys(init).length) setAnswers((a) => ({ ...init, ...a }));
  }, [lastByQid, childQuestions]);

  // Re-fill when teacher grants an unlock.
  const unlockHydrated = useRef(false);
  const anyUnlocked = childQuestions.some((c) => unlockedQIds.has(c.id));
  useEffect(() => {
    if (!anyUnlocked || unlockHydrated.current) return;
    unlockHydrated.current = true;
    setJustSubmitted(false);
    const init: Record<string, string> = {};
    for (const c of childQuestions) {
      const sub = lastByQid[c.id];
      if (sub?.selected_option_label) init[c.id] = sub.selected_option_label;
    }
    if (Object.keys(init).length) setAnswers((a) => ({ ...init, ...a }));
  }, [anyUnlocked, lastByQid, childQuestions]);

  const allSubmitted = childQuestions.every((c) => !!lastByQid[c.id]);
  // Children that still need a submission (or have been unlocked for re-submit).
  const activeChildren = childQuestions.filter((c) => !lastByQid[c.id] || unlockedQIds.has(c.id));
  const isLocked = (allSubmitted || justSubmitted) && !anyUnlocked && !preview;
  const canSubmit = activeChildren.length > 0 && activeChildren.every((c) => !!(answers[c.id] || '').trim());

  async function submitAll() {
    if (busy) return;
    setBusy(true);
    setMsg(preview ? 'Running AI marker…' : null);
    if (preview) setPreviewResults(null);
    const token = localStorage.getItem('studentToken') || '';
    try {
      if (preview) {
        // Dry-run: use the teacher-auth /try endpoint — no submissions stored.
        const results: Record<string, { marksAwarded: number | null; feedback: string | null; maxMarks: number }> = {};
        for (const child of activeChildren) {
          const selected = answers[child.id] || '';
          if (!selected) continue;
          const r = await api<{ marksAwarded: number | null; feedback: string | null; maxMarks: number }>(
            `/api/classwork/questions/${child.id}/try`,
            { method: 'POST', body: JSON.stringify({ selectedOptionLabel: selected }) },
          );
          results[child.id] = r;
        }
        setPreviewResults(results);
        setMsg(null);
        onPreviewAnswered(Object.keys(results));
      } else {
        for (const child of activeChildren) {
          const selected = answers[child.id] || '';
          if (!selected) continue;
          const res = await fetch(`/api/classwork/questions/${child.id}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ selectedOptionLabel: selected }),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error((j as any)?.error || `Submit failed (${res.status})`);
          }
        }
        setJustSubmitted(true);
        onSubmitted();
      }
    } catch (e: any) {
      setMsg(e.message || 'Submission failed');
    } finally {
      setBusy(false);
    }
  }

  // ── Locked (all submitted, none unlocked) ──────────────────────────────────
  if (isLocked) {
    const totalMarks = childQuestions.reduce((s, c) => s + (c.max_marks || 0), 0);
    const awarded = childQuestions.reduce((s, c) => s + (lastByQid[c.id]?.marks_awarded ?? 0), 0);
    return (
      <div style={{
        marginTop: 4, padding: '14px 16px',
        border: '1.5px solid var(--cw-tint-success-border)', borderRadius: 8,
        background: 'var(--cw-tint-success-bg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <span style={{ fontWeight: 700, color: 'var(--cw-tint-success-ink)', fontSize: 14 }}>
            Submitted · {awarded}/{totalMarks} mark{totalMarks === 1 ? '' : 's'}
          </span>
        </div>
        {childQuestions.map((c, ci) => {
          const sub = lastByQid[c.id];
          const opts: any[] = Array.isArray(c.options) ? c.options : [];
          const optText = opts.find((o: any) => o.label === sub?.selected_option_label)?.text;
          return (
            <div key={c.id} style={{
              marginBottom: 20, paddingBottom: 20,
              borderBottom: ci < childQuestions.length - 1 ? '1px solid var(--cw-tint-success-border)' : 'none',
            }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                {String.fromCharCode(97 + ci)}) {c.prompt}
              </div>
              {sub && (
                <div style={{ fontSize: 13, color: 'var(--cw-ink)' }}>
                  <strong>Your answer:</strong> {optText || sub.selected_option_label}
                  {sub.marks_awarded != null && (
                    <span style={{ marginLeft: 8, color: 'var(--cw-muted)' }}>
                      ({sub.marks_awarded}/{c.max_marks} mark{c.max_marks === 1 ? '' : 's'})
                    </span>
                  )}
                </div>
              )}
              {sub?.ai_feedback && (
                <div style={{ marginTop: 4, fontSize: 13, color: 'var(--cw-ink)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {sub.ai_feedback}
                </div>
              )}
            </div>
          );
        })}
        <p style={{ margin: 0, fontSize: 12, color: 'var(--cw-muted)' }}>
          Your answers are locked. Ask your teacher if you need to revise.
        </p>
      </div>
    );
  }

  // ── Active form ────────────────────────────────────────────────────────────
  return (
    <div style={{
      marginTop: 4, padding: 20,
      border: '1px dashed var(--cw-border)', borderRadius: 8,
      background: 'var(--cw-surface-soft)',
    }}>
      {anyUnlocked && allSubmitted && (
        <div style={{
          marginBottom: 20, padding: '8px 12px',
          background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 8,
          fontSize: 13, color: '#1e40af', display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <span style={{ flexShrink: 0 }}>🔓</span>
          <span>Your teacher has unlocked this question — revise your answers below and resubmit.</span>
        </div>
      )}
      {childQuestions.map((c, ci) => {
        const sub = lastByQid[c.id];
        const isActive = !sub || unlockedQIds.has(c.id);
        const opts: any[] = Array.isArray(c.options) ? c.options : [];
        return (
          <div key={c.id} style={{
            marginBottom: 28, paddingBottom: 28,
            borderBottom: ci < childQuestions.length - 1 ? '1px solid var(--cw-border)' : 'none',
          }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
              {String.fromCharCode(97 + ci)}) {c.prompt}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {opts.map((opt: any, oi: number) => {
                const val: string = opt.label || String(oi);
                return (
                  <label key={oi} style={{
                    display: 'flex', gap: 8, alignItems: 'center',
                    cursor: isActive ? 'pointer' : 'default',
                    opacity: !isActive ? 0.6 : 1,
                  }}>
                    <input
                      type="radio"
                      name={`mcg-${group.id}-${c.id}`}
                      value={val}
                      checked={answers[c.id] === val}
                      onChange={(e) => setAnswers((a) => ({ ...a, [c.id]: e.target.value }))}
                      disabled={!isActive}
                    />
                    <span>{opt.text || opt.label || `Option ${oi + 1}`}</span>
                  </label>
                );
              })}
            </div>
            {!isActive && sub && (
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--cw-muted)', fontStyle: 'italic' }}>
                Already submitted
                {sub.marks_awarded != null && ` · ${sub.marks_awarded}/${c.max_marks} mark${c.max_marks === 1 ? '' : 's'}`}
              </div>
            )}
            {preview && previewResults?.[c.id] && (
              <div style={{
                marginTop: 10, padding: '8px 12px', borderRadius: 8,
                background: 'var(--cw-tint-info-bg)', border: '1px solid var(--cw-tint-info-border)',
                fontSize: 13,
              }}>
                {previewResults[c.id].marksAwarded != null && (
                  <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--cw-tint-info-ink)' }}>
                    {previewResults[c.id].marksAwarded}/{previewResults[c.id].maxMarks} mark{previewResults[c.id].maxMarks === 1 ? '' : 's'}
                  </div>
                )}
                {previewResults[c.id].feedback && (
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: 'var(--cw-ink)' }}>
                    {previewResults[c.id].feedback}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
        <button
          onClick={submitAll}
          disabled={busy || !canSubmit}
          style={{
            background: canSubmit && !busy ? 'var(--cw-accent)' : 'var(--cw-surface-muted)',
            color: canSubmit && !busy ? '#fff' : 'var(--cw-muted)',
            border: 'none', padding: '9px 18px', borderRadius: 8,
            fontWeight: 700, cursor: canSubmit && !busy ? 'pointer' : 'not-allowed', fontSize: 14,
          }}
        >
          {busy ? 'Submitting…' : 'Submit answers'}
        </button>
        {msg && <span style={{ color: 'var(--cw-danger)', fontSize: 13 }}>{msg}</span>}
        {activeChildren.length > 0 && !canSubmit && (
          <span style={{ color: 'var(--cw-muted)', fontSize: 13 }}>
            Choose an answer for each question first.
          </span>
        )}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: 'var(--cw-surface)', border: '1px solid var(--cw-border)', borderRadius: 12, padding: 20,
  boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
};
const modal: React.CSSProperties = {
  background: 'var(--cw-surface)', borderRadius: 12, padding: 24, maxWidth: 560, width: '92%',
  maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
};
const fieldLabel: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 600, fontSize: 14, marginTop: 12,
};
const input: React.CSSProperties = {
  padding: '8px 10px', fontSize: 14, fontWeight: 400,
  border: '1px solid var(--cw-border)', borderRadius: 8, fontFamily: 'inherit',
};
