/* ============================================================================
   Lesson games — 10 game-style fun-activity question types.

   Each game has two exported components:
     • Foo<X>PupilUI({ config, cellAnswers, setCellAnswers, questionId? })
       - reads its config from question.config.<key>
       - reads/writes pupil state into cellAnswers (which gets JSON-stringified
         into the same text_answer column as the existing fun activities)
     • Foo<X>Editor({ cfg, setCfg })
       - controlled config editor used inside the QuestionEditor modal

   Storage shapes (config.<key> on the question, cellAnswers on the pupil row):

     hangman:       { items: [{ word, hint }] }
                    cellAnswers[i] = { guessed: ['A','B',...] }
     speedRound:    { items: [{ q, a }], seconds }
                    cellAnswers[i] = "answer"
     ordering:      { prompt, items: [{ label }] }       (items in correct order)
                    cellAnswers.order = [origIdx,...]    (pupil's permutation)
     caesar:        { items: [{ text, shift, mode: 'encode'|'decode' }] }
                    cellAnswers[i] = "answer"
     spotPhish:     { items: [{ text, isPhish, why }] }
                    cellAnswers[i] = 'phish' | 'safe'
     binaryHex:     { rounds, maxValue, modes:[...] }    (problems generated
                    cellAnswers[i] = "answer"             from question.id seed)
     bitOps:        { rounds, ops:[...], bitWidth }
                    cellAnswers[i] = "binary string"
     codeTracer:    { language, code, steps:[{ note, vars:[{name,value}] }] }
                    cellAnswers["s.varname"] = "value"
     flowchartSeq:  { prompt, blocks:[{shape,label}] }   (blocks in correct order)
                    cellAnswers.order = [origIdx,...]
     sortingRace:   { list:[...], algorithm }
                    cellAnswers = { comparisons, swaps, sorted }
   ============================================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';

const muted: React.CSSProperties = { color: 'var(--cw-muted)', fontStyle: 'italic', fontSize: 13 };
const card: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 8,
  border: '1px solid var(--cw-border)', background: 'var(--cw-surface)',
  display: 'flex', flexDirection: 'column', gap: 6,
};
const inputStyle: React.CSSProperties = {
  padding: '6px 10px', border: '1px solid var(--cw-border)',
  borderRadius: 6, fontSize: 14, fontFamily: 'inherit',
};
const editorInput: React.CSSProperties = {
  padding: '4px 8px', border: '1px solid var(--cw-border)',
  borderRadius: 6, fontSize: 13,
};
const ghostBtn: React.CSSProperties = {
  padding: '4px 10px', border: '1px solid var(--cw-border)',
  borderRadius: 6, background: 'var(--cw-surface)', cursor: 'pointer', fontSize: 13,
};
const accentBtn: React.CSSProperties = {
  padding: '6px 12px', border: 'none', borderRadius: 6,
  background: 'var(--cw-accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
};

/* ── Deterministic PRNG so every pupil sees the same scrambled order /
   the same generated number-base problems for a given question. ─── */
export function _stringHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h >>> 0;
}
export function _mulberry32(seedNum: number) {
  let s = seedNum >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function _seededShuffle<T>(arr: T[], seed: string): T[] {
  const rng = _mulberry32(_stringHash(seed));
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function caesarShift(text: string, shift: number): string {
  const s = ((Math.round(shift) % 26) + 26) % 26;
  return String(text || '').toUpperCase().replace(/[A-Z]/g, (c) =>
    String.fromCharCode(((c.charCodeAt(0) - 65 + s) % 26) + 65)
  );
}

export type SortStep = { array: number[]; comparing: number[]; swapped: boolean };
export type SortTrace = { steps: SortStep[]; comparisons: number; swaps: number; sorted: number[] };

export function simulateSort(input: number[], algorithm: string): SortTrace {
  const a = input.slice();
  const steps: SortStep[] = [{ array: a.slice(), comparing: [], swapped: false }];
  let comparisons = 0, swaps = 0;
  if (algorithm === 'selection') {
    for (let i = 0; i < a.length - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < a.length; j++) {
        comparisons++;
        steps.push({ array: a.slice(), comparing: [minIdx, j], swapped: false });
        if (a[j] < a[minIdx]) minIdx = j;
      }
      if (minIdx !== i) {
        [a[i], a[minIdx]] = [a[minIdx], a[i]];
        swaps++;
        steps.push({ array: a.slice(), comparing: [i, minIdx], swapped: true });
      }
    }
  } else if (algorithm === 'insertion') {
    for (let i = 1; i < a.length; i++) {
      let j = i;
      while (j > 0) {
        comparisons++;
        steps.push({ array: a.slice(), comparing: [j - 1, j], swapped: false });
        if (a[j - 1] > a[j]) {
          [a[j - 1], a[j]] = [a[j], a[j - 1]];
          swaps++;
          steps.push({ array: a.slice(), comparing: [j - 1, j], swapped: true });
          j--;
        } else break;
      }
    }
  } else {
    // bubble sort (default)
    for (let i = 0; i < a.length - 1; i++) {
      for (let j = 0; j < a.length - 1 - i; j++) {
        comparisons++;
        steps.push({ array: a.slice(), comparing: [j, j + 1], swapped: false });
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          swaps++;
          steps.push({ array: a.slice(), comparing: [j, j + 1], swapped: true });
        }
      }
    }
  }
  return { steps, comparisons, swaps, sorted: a };
}

/* ============================================================================
   1. HANGMAN
   ============================================================================ */

export function HangmanPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void;
}) {
  const items: any[] = config?.hangman?.items || [];
  if (!items.length) return <span style={muted}>This hangman game isn't set up yet — ask your teacher to add some words.</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((it, i) => {
        const word = String(it?.word || '').toUpperCase();
        const state = (cellAnswers[String(i)] && typeof cellAnswers[String(i)] === 'object') ? cellAnswers[String(i)] : { guessed: [] };
        const guessed: string[] = Array.isArray(state.guessed) ? state.guessed : [];
        const guessedSet = new Set(guessed);
        const wordLetters = new Set(word.split('').filter((ch) => /[A-Z]/.test(ch)));
        const wrong = guessed.filter((g) => !wordLetters.has(g));
        const won = Array.from(wordLetters).every((l) => guessedSet.has(l));
        const lost = wrong.length >= 6;
        const finished = won || lost;
        function press(L: string) {
          if (finished || guessedSet.has(L)) return;
          setCellAnswers({ ...cellAnswers, [String(i)]: { guessed: [...guessed, L] } });
        }
        return (
          <div key={i} style={card}>
            <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
              Word {i + 1} of {items.length}{it?.hint ? ` · Hint: ${it.hint}` : ''}
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 22, letterSpacing: 4,
              fontWeight: 700, padding: '6px 0',
            }}>
              {word.split('').map((ch, k) => {
                if (ch === ' ') return <span key={k} style={{ display: 'inline-block', width: 18 }}> </span>;
                const reveal = guessedSet.has(ch) || lost;
                return <span key={k} style={{ display: 'inline-block', width: 22, textAlign: 'center', borderBottom: '2px solid var(--cw-border)', marginRight: 4, color: reveal ? 'var(--cw-ink)' : 'transparent' }}>{reveal ? ch : '·'}</span>;
              })}
            </div>
            <div style={{ fontSize: 13, color: wrong.length >= 5 ? 'var(--cw-danger)' : 'var(--cw-muted)' }}>
              Wrong guesses: {wrong.length}/6{wrong.length > 0 && ` — ${wrong.join(', ')}`}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((L) => {
                const used = guessedSet.has(L);
                const inWord = wordLetters.has(L);
                return (
                  <button key={L} type="button" onClick={() => press(L)} disabled={finished || used}
                    style={{
                      width: 30, height: 30, padding: 0, fontSize: 13, fontWeight: 600,
                      borderRadius: 4, cursor: (finished || used) ? 'default' : 'pointer',
                      border: '1px solid var(--cw-border)',
                      background: used ? (inWord ? '#dcfce7' : '#fee2e2') : 'var(--cw-surface)',
                      color: used ? (inWord ? '#166534' : '#991b1b') : 'var(--cw-ink)',
                      opacity: (finished && !used) ? 0.4 : 1,
                    }}>{L}</button>
                );
              })}
            </div>
            {won && <div style={{ color: '#166534', fontWeight: 600, fontSize: 13 }}>✓ Solved!</div>}
            {lost && <div style={{ color: '#991b1b', fontWeight: 600, fontSize: 13 }}>✗ Out of guesses — answer was <strong>{word}</strong></div>}
          </div>
        );
      })}
    </div>
  );
}

export function HangmanEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg?.items) ? cfg.items : [];
  function setItems(next: any[]) { setCfg({ ...cfg, items: next }); }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={muted}>Each row is one hangman word — pupils get 6 wrong guesses per word. Hints are optional.</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="text" placeholder="Word (e.g. ALGORITHM or BUBBLE SORT)" value={String(it?.word || '')}
            onChange={(e) => { const a = items.slice(); a[i] = { ...it, word: e.target.value.toUpperCase().replace(/[^A-Z ]/g, '') }; setItems(a); }}
            style={{ ...editorInput, width: 220, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }} />
          <input type="text" placeholder="Optional hint" value={String(it?.hint || '')}
            onChange={(e) => { const a = items.slice(); a[i] = { ...it, hint: e.target.value }; setItems(a); }}
            style={{ ...editorInput, flex: 1 }} />
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ ...editorInput, cursor: 'pointer', width: 36 }} title="Remove">×</button>
        </div>
      ))}
      <button type="button" onClick={() => setItems([...items, { word: '', hint: '' }])}
        style={{ ...ghostBtn, alignSelf: 'flex-start' }}>+ Add word</button>
    </div>
  );
}

/* ============================================================================
   2. SPEED ROUND
   ============================================================================ */

export function SpeedRoundPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void;
}) {
  const sr = config?.speedRound || {};
  const items: any[] = Array.isArray(sr.items) ? sr.items : [];
  const seconds = Math.max(5, Math.min(600, Number(sr.seconds) || 60));
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [endsAt]);
  if (!items.length) return <span style={muted}>This speed round isn't set up yet — ask your teacher to add some questions.</span>;
  const remaining = endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : seconds;
  const expired = endsAt != null && remaining <= 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{
          padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700,
          background: expired ? '#fee2e2' : (endsAt ? '#dcfce7' : 'var(--cw-surface-soft)'),
          color: expired ? '#991b1b' : (endsAt ? '#166534' : 'var(--cw-ink)'),
          border: '1px solid var(--cw-border)',
        }}>
          ⏱ {endsAt ? remaining : seconds}s {expired ? '— time up!' : (endsAt ? 'left' : 'ready')}
        </div>
        {!endsAt && <button type="button" style={accentBtn} onClick={() => setEndsAt(Date.now() + seconds * 1000)}>Start timer</button>}
        <span style={{ fontSize: 12, color: 'var(--cw-muted)' }}>
          Type as many answers as you can. Submitting after time-up still counts what you've typed.
        </span>
      </div>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontWeight: 700, minWidth: 24, paddingTop: 6 }}>{i + 1}.</span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 14 }}>{it?.q || <em style={muted}>(no question)</em>}</div>
            <input type="text" disabled={expired}
              placeholder={expired ? 'Time up' : 'Your answer…'}
              value={String(cellAnswers[String(i)] || '')}
              onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}
              style={{ ...inputStyle, opacity: expired ? 0.5 : 1 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SpeedRoundEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg?.items) ? cfg.items : [];
  const seconds = Math.max(5, Math.min(600, Number(cfg?.seconds) || 60));
  function setItems(next: any[]) { setCfg({ ...cfg, items: next, seconds }); }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={muted}>Quick-fire short answers with a countdown. Pupils start the timer themselves and type as many as they can. List acceptable alternatives separated by commas (case-insensitive match).</div>
      <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
        Seconds:
        <input type="number" min={5} max={600} value={seconds}
          onChange={(e) => setCfg({ ...cfg, items, seconds: Math.max(5, Math.min(600, Number(e.target.value) || 60)) })}
          style={{ ...editorInput, width: 80 }} />
      </label>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--cw-muted)', width: 22 }}>{i + 1}.</span>
          <input type="text" placeholder="Question" value={String(it?.q || '')}
            onChange={(e) => { const a = items.slice(); a[i] = { ...it, q: e.target.value }; setItems(a); }}
            style={{ ...editorInput, flex: 1 }} />
          <input type="text" placeholder="Answer (comma-separated alternatives)" value={String(it?.a || '')}
            onChange={(e) => { const a = items.slice(); a[i] = { ...it, a: e.target.value }; setItems(a); }}
            style={{ ...editorInput, flex: 1 }} />
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ ...editorInput, cursor: 'pointer', width: 36 }} title="Remove">×</button>
        </div>
      ))}
      <button type="button" onClick={() => setItems([...items, { q: '', a: '' }])} style={{ ...ghostBtn, alignSelf: 'flex-start' }}>+ Add question</button>
    </div>
  );
}

/* ============================================================================
   3. ORDERING / SEQUENCING
   ============================================================================ */

function ReorderListUI({ labels, value, onChange }: {
  labels: React.ReactNode[]; value: number[]; onChange: (next: number[]) => void;
}) {
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {value.map((origIdx, i) => (
        <div key={i} style={{ ...card, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, color: 'var(--cw-muted)', width: 24 }}>{i + 1}.</span>
          <div style={{ flex: 1 }}>{labels[origIdx]}</div>
          <button type="button" disabled={i === 0} onClick={() => move(i, -1)} style={{ ...ghostBtn, opacity: i === 0 ? 0.3 : 1 }}>↑</button>
          <button type="button" disabled={i === value.length - 1} onClick={() => move(i, +1)} style={{ ...ghostBtn, opacity: i === value.length - 1 ? 0.3 : 1 }}>↓</button>
        </div>
      ))}
    </div>
  );
}

export function OrderingPupilUI({ config, cellAnswers, setCellAnswers, questionId }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void; questionId?: string | number;
}) {
  const items: any[] = config?.ordering?.items || [];
  const initial = useMemo(
    () => _seededShuffle(items.map((_, i) => i), `order-${questionId || ''}-${items.length}`),
    [items.length, questionId]
  );
  if (!items.length) return <span style={muted}>This sequencing task isn't set up yet — ask your teacher to add some steps.</span>;
  const order: number[] = (Array.isArray(cellAnswers.order) && cellAnswers.order.length === items.length) ? cellAnswers.order : initial;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {config?.ordering?.prompt && <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>{config.ordering.prompt}</div>}
      <ReorderListUI
        labels={items.map((it: any) => <span style={{ fontSize: 14 }}>{it?.label || <em style={muted}>(blank)</em>}</span>)}
        value={order}
        onChange={(next) => setCellAnswers({ ...cellAnswers, order: next })}
      />
    </div>
  );
}

export function OrderingEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg?.items) ? cfg.items : [];
  function setItems(next: any[]) { setCfg({ ...cfg, items: next, prompt: cfg?.prompt || '' }); }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={muted}>List the steps in their CORRECT order — pupils see them shuffled and must reorder.</div>
      <input type="text" placeholder="Optional intro (e.g. 'Order the stages of the software development process')"
        value={String(cfg?.prompt || '')}
        onChange={(e) => setCfg({ ...cfg, items, prompt: e.target.value })} style={editorInput} />
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--cw-muted)', width: 22 }}>{i + 1}.</span>
          <input type="text" placeholder="Step text" value={String(it?.label || '')}
            onChange={(e) => { const a = items.slice(); a[i] = { ...it, label: e.target.value }; setItems(a); }}
            style={{ ...editorInput, flex: 1 }} />
          <button type="button" disabled={i === 0} onClick={() => { const a = items.slice(); [a[i - 1], a[i]] = [a[i], a[i - 1]]; setItems(a); }} style={{ ...editorInput, cursor: 'pointer', width: 30, opacity: i === 0 ? 0.3 : 1 }}>↑</button>
          <button type="button" disabled={i === items.length - 1} onClick={() => { const a = items.slice(); [a[i], a[i + 1]] = [a[i + 1], a[i]]; setItems(a); }} style={{ ...editorInput, cursor: 'pointer', width: 30, opacity: i === items.length - 1 ? 0.3 : 1 }}>↓</button>
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ ...editorInput, cursor: 'pointer', width: 36 }} title="Remove">×</button>
        </div>
      ))}
      <button type="button" onClick={() => setItems([...items, { label: '' }])} style={{ ...ghostBtn, alignSelf: 'flex-start' }}>+ Add step</button>
    </div>
  );
}

/* ============================================================================
   4. CAESAR CIPHER
   ============================================================================ */

export function CaesarPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void;
}) {
  const items: any[] = config?.caesar?.items || [];
  if (!items.length) return <span style={muted}>This Caesar cipher task isn't set up yet — ask your teacher to add some messages.</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((it, i) => {
        const mode = (it?.mode === 'decode') ? 'decode' : 'encode';
        const shift = Number(it?.shift) || 0;
        const plain = String(it?.text || '').toUpperCase();
        const cipher = caesarShift(plain, shift);
        const source = mode === 'encode' ? plain : cipher;
        const sourceLabel = mode === 'encode' ? 'Plaintext' : 'Ciphertext';
        const askLabel = mode === 'encode' ? 'Encode it (your answer):' : 'Decode it (your answer):';
        return (
          <div key={i} style={card}>
            <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>Message {i + 1} · shift = {shift}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{sourceLabel}:</span>
              <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, padding: '2px 6px', background: 'var(--cw-surface-soft)', borderRadius: 4 }}>{source}</code>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13 }}>{askLabel}</span>
              <input type="text" value={String(cellAnswers[String(i)] || '')}
                onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value.toUpperCase() })}
                style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }} />
            </label>
          </div>
        );
      })}
    </div>
  );
}

export function CaesarEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg?.items) ? cfg.items : [];
  function setItems(next: any[]) { setCfg({ ...cfg, items: next }); }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={muted}>Type the plaintext for each message and pick a shift. Choose "encode" to make pupils encrypt it, or "decode" to make them break the cipher (pupils see the ciphertext instead).</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--cw-muted)', width: 22 }}>{i + 1}.</span>
          <input type="text" placeholder="Plaintext message" value={String(it?.text || '')}
            onChange={(e) => { const a = items.slice(); a[i] = { ...it, text: e.target.value.toUpperCase() }; setItems(a); }}
            style={{ ...editorInput, flex: 1, minWidth: 180, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }} />
          <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            shift
            <input type="number" value={Number(it?.shift) || 0}
              onChange={(e) => { const a = items.slice(); a[i] = { ...it, shift: Number(e.target.value) || 0 }; setItems(a); }}
              style={{ ...editorInput, width: 60 }} />
          </label>
          <select value={(it?.mode === 'decode') ? 'decode' : 'encode'}
            onChange={(e) => { const a = items.slice(); a[i] = { ...it, mode: e.target.value }; setItems(a); }}
            style={{ ...editorInput, cursor: 'pointer' }}>
            <option value="encode">Encode</option>
            <option value="decode">Decode</option>
          </select>
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ ...editorInput, cursor: 'pointer', width: 36 }} title="Remove">×</button>
        </div>
      ))}
      <button type="button" onClick={() => setItems([...items, { text: '', shift: 3, mode: 'encode' }])} style={{ ...ghostBtn, alignSelf: 'flex-start' }}>+ Add message</button>
    </div>
  );
}

/* ============================================================================
   5. SPOT THE PHISH
   ============================================================================ */

export function SpotPhishPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void;
}) {
  const items: any[] = config?.spotPhish?.items || [];
  if (!items.length) return <span style={muted}>This phishing-spotter task isn't set up yet — ask your teacher to add some examples.</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((it, i) => {
        const pick = String(cellAnswers[String(i)] || '');
        function set(v: 'phish' | 'safe') { setCellAnswers({ ...cellAnswers, [String(i)]: v }); }
        const btnStyle = (v: 'phish' | 'safe', active: boolean): React.CSSProperties => ({
          padding: '8px 14px', border: '2px solid', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
          borderColor: active ? (v === 'phish' ? '#dc2626' : '#16a34a') : 'var(--cw-border)',
          background: active ? (v === 'phish' ? '#fee2e2' : '#dcfce7') : 'var(--cw-surface)',
          color: active ? (v === 'phish' ? '#991b1b' : '#166534') : 'var(--cw-ink)',
        });
        return (
          <div key={i} style={card}>
            <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>Example {i + 1} of {items.length}</div>
            <div style={{
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
              padding: 10, background: 'var(--cw-surface-soft)',
              border: '1px dashed var(--cw-border)', borderRadius: 6,
            }}>{it?.text || <em style={muted}>(blank)</em>}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => set('phish')} style={btnStyle('phish', pick === 'phish')}>🚩 Phishing</button>
              <button type="button" onClick={() => set('safe')} style={btnStyle('safe', pick === 'safe')}>✓ Genuine</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SpotPhishEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg?.items) ? cfg.items : [];
  function setItems(next: any[]) { setCfg({ ...cfg, items: next }); }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={muted}>Paste an email, URL or message in each box and tick whether it's phishing. The "Why?" note is shown to pupils as feedback after they pick.</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, border: '1px solid var(--cw-border)', borderRadius: 6, background: 'var(--cw-surface)' }}>
          <textarea rows={3} placeholder="Email / URL / message text" value={String(it?.text || '')}
            onChange={(e) => { const a = items.slice(); a[i] = { ...it, text: e.target.value }; setItems(a); }}
            style={{ ...editorInput, fontFamily: 'JetBrains Mono, monospace', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={!!it?.isPhish}
                onChange={(e) => { const a = items.slice(); a[i] = { ...it, isPhish: e.target.checked }; setItems(a); }} />
              This is phishing
            </label>
            <input type="text" placeholder="Why? (shown as feedback)" value={String(it?.why || '')}
              onChange={(e) => { const a = items.slice(); a[i] = { ...it, why: e.target.value }; setItems(a); }}
              style={{ ...editorInput, flex: 1 }} />
            <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ ...editorInput, cursor: 'pointer', width: 36 }} title="Remove">×</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setItems([...items, { text: '', isPhish: false, why: '' }])} style={{ ...ghostBtn, alignSelf: 'flex-start' }}>+ Add example</button>
    </div>
  );
}

/* ============================================================================
   6. BINARY / HEX BLITZ  (auto-generated problems)
   ============================================================================ */

export type BinHexProblem = { value: string; fromLabel: string; toLabel: string; expected: string };

export function generateBinaryHexProblems(cfg: any, seed: string): BinHexProblem[] {
  const rounds = Math.max(1, Math.min(50, Number(cfg?.rounds) || 10));
  const maxValue = Math.max(15, Math.min(65535, Number(cfg?.maxValue) || 255));
  const allModes = ['dec_to_bin', 'bin_to_dec', 'dec_to_hex', 'hex_to_dec'];
  const modes: string[] = (Array.isArray(cfg?.modes) && cfg.modes.length)
    ? cfg.modes.filter((m: any) => allModes.includes(m))
    : allModes;
  if (modes.length === 0) modes.push('dec_to_bin');
  const rng = _mulberry32(_stringHash(seed));
  const out: BinHexProblem[] = [];
  for (let i = 0; i < rounds; i++) {
    const mode = modes[Math.floor(rng() * modes.length)];
    const n = 1 + Math.floor(rng() * (maxValue - 1));
    if (mode === 'dec_to_bin') out.push({ value: String(n), fromLabel: 'denary', toLabel: 'binary', expected: n.toString(2) });
    else if (mode === 'bin_to_dec') out.push({ value: n.toString(2), fromLabel: 'binary', toLabel: 'denary', expected: String(n) });
    else if (mode === 'dec_to_hex') out.push({ value: String(n), fromLabel: 'denary', toLabel: 'hex', expected: n.toString(16).toUpperCase() });
    else out.push({ value: n.toString(16).toUpperCase(), fromLabel: 'hex', toLabel: 'denary', expected: String(n) });
  }
  return out;
}

export function BinaryHexPupilUI({ config, cellAnswers, setCellAnswers, questionId }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void; questionId?: string | number;
}) {
  const cfg = config?.binaryHex || {};
  const probs = useMemo(() => generateBinaryHexProblems(cfg, `bh-${questionId || ''}`), [questionId, JSON.stringify(cfg)]);
  if (!probs.length) return <span style={muted}>This Binary/Hex Blitz isn't set up yet — ask your teacher to enable some modes.</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={muted}>Convert each value into the requested base. Binary is base 2, hex is base 16 (A–F).</div>
      {probs.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, minWidth: 30, color: 'var(--cw-muted)' }}>{i + 1}.</span>
          <span style={{ fontSize: 14 }}>Convert <code style={{ fontFamily: 'JetBrains Mono, monospace', padding: '1px 5px', background: 'var(--cw-surface-soft)', borderRadius: 3 }}>{p.value}</code> ({p.fromLabel}) to {p.toLabel}:</span>
          <input type="text" value={String(cellAnswers[String(i)] || '')}
            onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}
            style={{ ...inputStyle, width: 140, fontFamily: 'JetBrains Mono, monospace' }} />
        </div>
      ))}
    </div>
  );
}

export function BinaryHexEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const rounds = Math.max(1, Math.min(50, Number(cfg?.rounds) || 10));
  const maxValue = Math.max(15, Math.min(65535, Number(cfg?.maxValue) || 255));
  const allModes = [
    { id: 'dec_to_bin', label: 'Denary → Binary' },
    { id: 'bin_to_dec', label: 'Binary → Denary' },
    { id: 'dec_to_hex', label: 'Denary → Hex' },
    { id: 'hex_to_dec', label: 'Hex → Denary' },
  ];
  const enabled: string[] = (Array.isArray(cfg?.modes) && cfg.modes.length) ? cfg.modes : allModes.map((m) => m.id);
  function toggle(id: string) {
    const next = enabled.includes(id) ? enabled.filter((x) => x !== id) : [...enabled, id];
    setCfg({ ...cfg, rounds, maxValue, modes: next.length ? next : [id] });
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={muted}>Problems are generated automatically (and stay the same for every pupil on this question, so you can mark consistently). Pick the conversion modes and difficulty.</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13 }}>Rounds <input type="number" min={1} max={50} value={rounds}
          onChange={(e) => setCfg({ ...cfg, modes: enabled, maxValue, rounds: Math.max(1, Math.min(50, Number(e.target.value) || 10)) })}
          style={{ ...editorInput, width: 70, marginLeft: 6 }} /></label>
        <label style={{ fontSize: 13 }}>Max value <input type="number" min={15} max={65535} value={maxValue}
          onChange={(e) => setCfg({ ...cfg, modes: enabled, rounds, maxValue: Math.max(15, Math.min(65535, Number(e.target.value) || 255)) })}
          style={{ ...editorInput, width: 90, marginLeft: 6 }} /></label>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {allModes.map((m) => (
          <label key={m.id} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={enabled.includes(m.id)} onChange={() => toggle(m.id)} />
            {m.label}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   7. BIT MANIPULATION PUZZLE
   ============================================================================ */

export type BitProblem = { display: string; expected: string; bitWidth: number };

function _padBin(n: number, width: number): string {
  let s = (n >>> 0).toString(2);
  if (s.length > width) s = s.slice(-width);
  while (s.length < width) s = '0' + s;
  return s;
}

export function generateBitOpsProblems(cfg: any, seed: string): BitProblem[] {
  const rounds = Math.max(1, Math.min(30, Number(cfg?.rounds) || 6));
  const bitWidth = Math.max(4, Math.min(16, Number(cfg?.bitWidth) || 8));
  const allOps = ['AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR'];
  const ops: string[] = (Array.isArray(cfg?.ops) && cfg.ops.length)
    ? cfg.ops.filter((o: any) => allOps.includes(o))
    : allOps;
  if (ops.length === 0) ops.push('AND');
  const mask = (1 << bitWidth) - 1;
  const rng = _mulberry32(_stringHash(seed));
  const out: BitProblem[] = [];
  for (let i = 0; i < rounds; i++) {
    const op = ops[Math.floor(rng() * ops.length)];
    const a = Math.floor(rng() * (mask + 1));
    const b = Math.floor(rng() * (mask + 1));
    const shift = 1 + Math.floor(rng() * Math.min(4, bitWidth - 1));
    if (op === 'AND') out.push({ display: `${_padBin(a, bitWidth)} AND ${_padBin(b, bitWidth)}`, expected: _padBin(a & b, bitWidth), bitWidth });
    else if (op === 'OR') out.push({ display: `${_padBin(a, bitWidth)} OR ${_padBin(b, bitWidth)}`, expected: _padBin(a | b, bitWidth), bitWidth });
    else if (op === 'XOR') out.push({ display: `${_padBin(a, bitWidth)} XOR ${_padBin(b, bitWidth)}`, expected: _padBin(a ^ b, bitWidth), bitWidth });
    else if (op === 'NOT') out.push({ display: `NOT ${_padBin(a, bitWidth)}`, expected: _padBin((~a) & mask, bitWidth), bitWidth });
    else if (op === 'SHL') out.push({ display: `${_padBin(a, bitWidth)} << ${shift}`, expected: _padBin((a << shift) & mask, bitWidth), bitWidth });
    else out.push({ display: `${_padBin(a, bitWidth)} >> ${shift}`, expected: _padBin(a >> shift, bitWidth), bitWidth });
  }
  return out;
}

export function BitOpsPupilUI({ config, cellAnswers, setCellAnswers, questionId }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void; questionId?: string | number;
}) {
  const cfg = config?.bitOps || {};
  const probs = useMemo(() => generateBitOpsProblems(cfg, `bo-${questionId || ''}`), [questionId, JSON.stringify(cfg)]);
  if (!probs.length) return <span style={muted}>This Bit-ops puzzle isn't set up yet — ask your teacher to enable some operations.</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={muted}>Compute each binary expression. Answers are {probs[0].bitWidth}-bit binary strings (use 0s and 1s).</div>
      {probs.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, minWidth: 30, color: 'var(--cw-muted)' }}>{i + 1}.</span>
          <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, padding: '2px 6px', background: 'var(--cw-surface-soft)', borderRadius: 4 }}>{p.display}</code>
          <span>=</span>
          <input type="text" value={String(cellAnswers[String(i)] || '')}
            onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value.replace(/[^01]/g, '') })}
            placeholder={'0'.repeat(p.bitWidth)}
            maxLength={p.bitWidth}
            style={{ ...inputStyle, width: 8 * p.bitWidth + 20, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2 }} />
        </div>
      ))}
    </div>
  );
}

export function BitOpsEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const rounds = Math.max(1, Math.min(30, Number(cfg?.rounds) || 6));
  const bitWidth = Math.max(4, Math.min(16, Number(cfg?.bitWidth) || 8));
  const allOps = ['AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR'];
  const enabled: string[] = (Array.isArray(cfg?.ops) && cfg.ops.length) ? cfg.ops : allOps;
  function toggle(o: string) {
    const next = enabled.includes(o) ? enabled.filter((x) => x !== o) : [...enabled, o];
    setCfg({ ...cfg, rounds, bitWidth, ops: next.length ? next : [o] });
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={muted}>Problems are generated automatically (consistent for every pupil on this question). Pick which bitwise operations to include.</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13 }}>Rounds <input type="number" min={1} max={30} value={rounds}
          onChange={(e) => setCfg({ ...cfg, ops: enabled, bitWidth, rounds: Math.max(1, Math.min(30, Number(e.target.value) || 6)) })}
          style={{ ...editorInput, width: 70, marginLeft: 6 }} /></label>
        <label style={{ fontSize: 13 }}>Bit width <input type="number" min={4} max={16} value={bitWidth}
          onChange={(e) => setCfg({ ...cfg, ops: enabled, rounds, bitWidth: Math.max(4, Math.min(16, Number(e.target.value) || 8)) })}
          style={{ ...editorInput, width: 70, marginLeft: 6 }} /></label>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {allOps.map((o) => (
          <label key={o} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={enabled.includes(o)} onChange={() => toggle(o)} />
            {o === 'SHL' ? 'Shift left (<<)' : o === 'SHR' ? 'Shift right (>>)' : o}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   8. CODE TRACER
   ============================================================================ */

export function CodeTracerPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void;
}) {
  const ct = config?.codeTracer || {};
  const code = String(ct.code || '');
  const steps: any[] = Array.isArray(ct.steps) ? ct.steps : [];
  if (!code || !steps.length) return <span style={muted}>This Code Tracer isn't set up yet — ask your teacher to add code and trace steps.</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <pre style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.5,
        padding: 10, background: 'var(--cw-surface-soft)', border: '1px solid var(--cw-border)',
        borderRadius: 6, margin: 0, overflowX: 'auto', whiteSpace: 'pre',
      }}>{code.split('\n').map((line, i) => (
        <div key={i}><span style={{ color: 'var(--cw-muted)', userSelect: 'none', display: 'inline-block', width: 30, textAlign: 'right', paddingRight: 8 }}>{i + 1}</span>{line}</div>
      ))}</pre>
      <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
        <thead>
          <tr style={{ background: 'var(--cw-surface-soft)' }}>
            <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--cw-border)' }}>Step</th>
            <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--cw-border)' }}>Variable</th>
            <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--cw-border)' }}>Value at this step</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s, si) => {
            const vars: any[] = Array.isArray(s?.vars) ? s.vars : [];
            if (vars.length === 0) return null;
            return vars.map((v, vi) => (
              <tr key={`${si}-${vi}`}>
                {vi === 0 && (
                  <td rowSpan={vars.length} style={{ padding: '6px 8px', verticalAlign: 'top', borderBottom: '1px solid var(--cw-border)' }}>
                    <strong>{si + 1}.</strong> {s?.note || <em style={muted}>(no description)</em>}
                  </td>
                )}
                <td style={{ padding: '6px 8px', borderBottom: vi === vars.length - 1 ? '1px solid var(--cw-border)' : '1px dashed var(--cw-border)', fontFamily: 'JetBrains Mono, monospace' }}>{v?.name}</td>
                <td style={{ padding: '6px 8px', borderBottom: vi === vars.length - 1 ? '1px solid var(--cw-border)' : '1px dashed var(--cw-border)' }}>
                  <input type="text" value={String(cellAnswers[`${si}.${v?.name}`] || '')}
                    onChange={(e) => setCellAnswers({ ...cellAnswers, [`${si}.${v?.name}`]: e.target.value })}
                    style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', width: '100%', maxWidth: 200 }} />
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CodeTracerEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const language = cfg?.language === 'pseudocode' ? 'pseudocode' : 'python';
  const code = String(cfg?.code || '');
  const steps: any[] = Array.isArray(cfg?.steps) ? cfg.steps : [];
  function setSteps(next: any[]) { setCfg({ ...cfg, language, code, steps: next }); }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={muted}>Paste a short snippet, then list each "step" the pupil should trace. For each step add the variables you want them to predict and the expected value.</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ fontSize: 13 }}>Language
          <select value={language} onChange={(e) => setCfg({ ...cfg, language: e.target.value, code, steps })}
            style={{ ...editorInput, marginLeft: 6 }}>
            <option value="python">Python</option>
            <option value="pseudocode">Pseudocode</option>
          </select>
        </label>
      </div>
      <textarea rows={8} value={code} placeholder={'x = 0\nfor i in range(3):\n    x = x + i\nprint(x)'}
        onChange={(e) => setCfg({ ...cfg, language, steps, code: e.target.value })}
        style={{ ...editorInput, fontFamily: 'JetBrains Mono, monospace', resize: 'vertical' }} />
      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>Trace steps</div>
      {steps.map((s, si) => {
        const vars: any[] = Array.isArray(s?.vars) ? s.vars : [];
        function setVars(next: any[]) { const a = steps.slice(); a[si] = { ...s, vars: next }; setSteps(a); }
        return (
          <div key={si} style={{ padding: 8, border: '1px solid var(--cw-border)', borderRadius: 6, background: 'var(--cw-surface)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--cw-muted)', width: 22 }}>{si + 1}.</span>
              <input type="text" placeholder="Step description (e.g. 'After the first loop iteration')"
                value={String(s?.note || '')}
                onChange={(e) => { const a = steps.slice(); a[si] = { ...s, note: e.target.value }; setSteps(a); }}
                style={{ ...editorInput, flex: 1 }} />
              <button type="button" onClick={() => setSteps(steps.filter((_, j) => j !== si))} style={{ ...editorInput, cursor: 'pointer', width: 36 }} title="Remove step">×</button>
            </div>
            {vars.map((v, vi) => (
              <div key={vi} style={{ display: 'flex', gap: 6, alignItems: 'center', paddingLeft: 28 }}>
                <input type="text" placeholder="Variable name (e.g. x)" value={String(v?.name || '')}
                  onChange={(e) => { const a = vars.slice(); a[vi] = { ...v, name: e.target.value }; setVars(a); }}
                  style={{ ...editorInput, width: 140, fontFamily: 'JetBrains Mono, monospace' }} />
                <span style={{ color: 'var(--cw-muted)' }}>=</span>
                <input type="text" placeholder="Expected value (e.g. 3)" value={String(v?.value || '')}
                  onChange={(e) => { const a = vars.slice(); a[vi] = { ...v, value: e.target.value }; setVars(a); }}
                  style={{ ...editorInput, flex: 1, fontFamily: 'JetBrains Mono, monospace' }} />
                <button type="button" onClick={() => setVars(vars.filter((_, j) => j !== vi))} style={{ ...editorInput, cursor: 'pointer', width: 36 }} title="Remove variable">×</button>
              </div>
            ))}
            <button type="button" onClick={() => setVars([...vars, { name: '', value: '' }])}
              style={{ ...ghostBtn, alignSelf: 'flex-start', marginLeft: 28 }}>+ Add variable</button>
          </div>
        );
      })}
      <button type="button" onClick={() => setSteps([...steps, { note: '', vars: [{ name: '', value: '' }] }])}
        style={{ ...ghostBtn, alignSelf: 'flex-start' }}>+ Add step</button>
    </div>
  );
}

/* ============================================================================
   9. FLOWCHART SEQUENCER
   ============================================================================ */

function FlowchartShape({ shape, label }: { shape: string; label: string }) {
  const text = label || '(blank)';
  const base: React.CSSProperties = {
    padding: '10px 18px', minWidth: 180, maxWidth: 320, textAlign: 'center',
    fontSize: 13, lineHeight: 1.3, background: '#fff', color: '#0f172a',
    border: '2px solid #1e293b', display: 'inline-block', wordBreak: 'break-word',
  };
  if (shape === 'decision') {
    return <div style={{ ...base, padding: '18px 28px', clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)', minWidth: 220, background: '#fef3c7', borderColor: '#b45309' }}>{text}</div>;
  }
  if (shape === 'io') {
    return <div style={{ ...base, clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)', padding: '10px 30px', background: '#dbeafe', borderColor: '#1e40af' }}>{text}</div>;
  }
  if (shape === 'terminator') {
    return <div style={{ ...base, borderRadius: 999, background: '#dcfce7', borderColor: '#166534' }}>{text}</div>;
  }
  return <div style={base}>{text}</div>;
}

export function FlowchartPupilUI({ config, cellAnswers, setCellAnswers, questionId }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void; questionId?: string | number;
}) {
  const blocks: any[] = config?.flowchartSeq?.blocks || [];
  const initial = useMemo(
    () => _seededShuffle(blocks.map((_, i) => i), `fc-${questionId || ''}-${blocks.length}`),
    [blocks.length, questionId]
  );
  if (!blocks.length) return <span style={muted}>This flowchart sequencer isn't set up yet — ask your teacher to add some blocks.</span>;
  const order: number[] = (Array.isArray(cellAnswers.order) && cellAnswers.order.length === blocks.length) ? cellAnswers.order : initial;
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = order.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setCellAnswers({ ...cellAnswers, order: next });
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
      {config?.flowchartSeq?.prompt && <div style={{ fontSize: 13, color: 'var(--cw-muted)', marginBottom: 4 }}>{config.flowchartSeq.prompt}</div>}
      {order.map((origIdx, i) => {
        const b = blocks[origIdx] || {};
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlowchartShape shape={String(b?.shape || 'process')} label={String(b?.label || '')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)}
                  style={{ ...ghostBtn, padding: '2px 8px', opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                <button type="button" disabled={i === order.length - 1} onClick={() => move(i, +1)}
                  style={{ ...ghostBtn, padding: '2px 8px', opacity: i === order.length - 1 ? 0.3 : 1 }}>↓</button>
              </div>
            </div>
            {i < order.length - 1 && <div style={{ fontSize: 22, color: '#475569', lineHeight: 1, padding: '2px 0' }}>↓</div>}
          </div>
        );
      })}
    </div>
  );
}

export function FlowchartEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const blocks: any[] = Array.isArray(cfg?.blocks) ? cfg.blocks : [];
  function setBlocks(next: any[]) { setCfg({ ...cfg, blocks: next, prompt: cfg?.prompt || '' }); }
  const shapes = [
    { id: 'terminator', label: 'Terminator (Start/End)' },
    { id: 'process', label: 'Process' },
    { id: 'io', label: 'Input / Output' },
    { id: 'decision', label: 'Decision' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={muted}>Build the flowchart in CORRECT order. Pupils see it shuffled and must reorder. Use Terminator for Start/End, Decision for Yes/No branches, etc.</div>
      <input type="text" placeholder="Optional intro" value={String(cfg?.prompt || '')}
        onChange={(e) => setCfg({ ...cfg, blocks, prompt: e.target.value })} style={editorInput} />
      {blocks.map((b, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--cw-muted)', width: 22 }}>{i + 1}.</span>
          <select value={String(b?.shape || 'process')}
            onChange={(e) => { const a = blocks.slice(); a[i] = { ...b, shape: e.target.value }; setBlocks(a); }}
            style={{ ...editorInput, cursor: 'pointer' }}>
            {shapes.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <input type="text" placeholder="Block text" value={String(b?.label || '')}
            onChange={(e) => { const a = blocks.slice(); a[i] = { ...b, label: e.target.value }; setBlocks(a); }}
            style={{ ...editorInput, flex: 1 }} />
          <button type="button" disabled={i === 0} onClick={() => { const a = blocks.slice(); [a[i - 1], a[i]] = [a[i], a[i - 1]]; setBlocks(a); }} style={{ ...editorInput, cursor: 'pointer', width: 30, opacity: i === 0 ? 0.3 : 1 }}>↑</button>
          <button type="button" disabled={i === blocks.length - 1} onClick={() => { const a = blocks.slice(); [a[i], a[i + 1]] = [a[i + 1], a[i]]; setBlocks(a); }} style={{ ...editorInput, cursor: 'pointer', width: 30, opacity: i === blocks.length - 1 ? 0.3 : 1 }}>↓</button>
          <button type="button" onClick={() => setBlocks(blocks.filter((_, j) => j !== i))} style={{ ...editorInput, cursor: 'pointer', width: 36 }} title="Remove">×</button>
        </div>
      ))}
      <button type="button" onClick={() => setBlocks([...blocks, { shape: 'process', label: '' }])} style={{ ...ghostBtn, alignSelf: 'flex-start' }}>+ Add block</button>
    </div>
  );
}

/* ============================================================================
  10. SORTING RACE
   ============================================================================ */

export function SortingRacePupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void;
}) {
  const sr = config?.sortingRace || {};
  const list: number[] = Array.isArray(sr.list) ? sr.list.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n)) : [];
  const algorithm = ['bubble', 'selection', 'insertion'].includes(sr.algorithm) ? sr.algorithm : 'bubble';
  const trace = useMemo(() => simulateSort(list, algorithm), [JSON.stringify(list), algorithm]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(playing);
  playRef.current = playing;
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setStep((s) => {
        if (s + 1 >= trace.steps.length) {
          if (playRef.current) setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 600);
    return () => window.clearInterval(id);
  }, [playing, trace.steps.length]);
  if (!list.length) return <span style={muted}>This Sorting Race isn't set up yet — ask your teacher to add a list and pick an algorithm.</span>;
  const cur = trace.steps[step] || trace.steps[0];
  const maxV = Math.max(1, ...list);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, color: 'var(--cw-muted)' }}>
        Algorithm: <strong style={{ color: 'var(--cw-ink)' }}>{algorithm} sort</strong> · Step {step + 1} of {trace.steps.length}
        {cur.swapped && <span style={{ color: '#16a34a', marginLeft: 8 }}>· swap!</span>}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', minHeight: 120, padding: '8px 4px', background: 'var(--cw-surface-soft)', borderRadius: 6 }}>
        {cur.array.map((n, i) => {
          const active = cur.comparing.includes(i);
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{
                width: 36, height: Math.max(12, (n / maxV) * 100),
                background: active ? (cur.swapped ? '#16a34a' : '#f59e0b') : 'var(--cw-accent)',
                color: '#fff', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '4px 4px 0 0', transition: 'background 0.2s',
              }}>{n}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" style={ghostBtn} onClick={() => { setStep(0); setPlaying(false); }}>⏮ Reset</button>
        <button type="button" style={ghostBtn} onClick={() => setStep((s) => Math.max(0, s - 1))}>◀ Step</button>
        <button type="button" style={accentBtn} onClick={() => setPlaying((p) => !p)}>{playing ? '⏸ Pause' : '▶ Play'}</button>
        <button type="button" style={ghostBtn} onClick={() => setStep((s) => Math.min(trace.steps.length - 1, s + 1))}>Step ▶</button>
        <button type="button" style={ghostBtn} onClick={() => { setStep(trace.steps.length - 1); setPlaying(false); }}>End ⏭</button>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>After watching, fill in:</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span style={{ minWidth: 180 }}>Total comparisons:</span>
          <input type="number" value={String(cellAnswers.comparisons || '')}
            onChange={(e) => setCellAnswers({ ...cellAnswers, comparisons: e.target.value })}
            style={{ ...inputStyle, width: 100 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span style={{ minWidth: 180 }}>Total swaps:</span>
          <input type="number" value={String(cellAnswers.swaps || '')}
            onChange={(e) => setCellAnswers({ ...cellAnswers, swaps: e.target.value })}
            style={{ ...inputStyle, width: 100 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span style={{ minWidth: 180 }}>Final sorted list (comma-separated):</span>
          <input type="text" value={String(cellAnswers.sorted || '')}
            onChange={(e) => setCellAnswers({ ...cellAnswers, sorted: e.target.value })}
            style={{ ...inputStyle, flex: 1 }} placeholder="e.g. 1, 2, 3, 4, 5" />
        </label>
      </div>
    </div>
  );
}

export function SortingRaceEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const algorithm = ['bubble', 'selection', 'insertion'].includes(cfg?.algorithm) ? cfg.algorithm : 'bubble';
  const listText = (cfg && cfg._listText != null)
    ? String(cfg._listText)
    : (Array.isArray(cfg?.list) ? cfg.list.join(', ') : '5, 3, 8, 1, 4');
  const list = listText.split(/[,\s]+/).map((s: string) => Number(s)).filter((n: number) => Number.isFinite(n));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={muted}>Pupils watch the algorithm step through your list, then enter the totals + final sorted output. Keep the list short (5-10 numbers) so the run is followable.</div>
      <label style={{ fontSize: 13 }}>List (comma- or space-separated numbers)
        <input type="text" value={listText}
          onChange={(e) => setCfg({ ...cfg, algorithm, _listText: e.target.value, list: e.target.value.split(/[,\s]+/).map((x) => Number(x)).filter((n) => Number.isFinite(n)) })}
          style={{ ...editorInput, width: '100%', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }} />
      </label>
      <label style={{ fontSize: 13 }}>Algorithm
        <select value={algorithm}
          onChange={(e) => setCfg({ ...cfg, _listText: listText, list, algorithm: e.target.value })}
          style={{ ...editorInput, marginLeft: 6 }}>
          <option value="bubble">Bubble sort</option>
          <option value="selection">Selection sort</option>
          <option value="insertion">Insertion sort</option>
        </select>
      </label>
      {list.length > 0 && (() => {
        const trace = simulateSort(list, algorithm);
        return (
          <div style={{ fontSize: 12, color: 'var(--cw-muted)', padding: '6px 8px', background: 'var(--cw-surface-soft)', borderRadius: 6 }}>
            Preview — pupils will need to enter: <strong>{trace.comparisons} comparisons</strong>, <strong>{trace.swaps} swaps</strong>, sorted = [{trace.sorted.join(', ')}]
          </div>
        );
      })()}
    </div>
  );
}

/* ============================================================================
   GameReview — compact teacher-side review of one pupil's submission for
   any of the 10 game types. Shown in the marker-preview panel.
   ============================================================================ */

const reviewMuted: React.CSSProperties = { color: 'var(--cw-muted)', fontSize: 12 };
function tickCell(ok: boolean): React.CSSProperties {
  return {
    padding: '3px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
    background: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#166534' : '#991b1b',
    border: '1px solid', borderColor: ok ? '#86efac' : '#fca5a5',
  };
}
function _normCmp(a: any, b: any): boolean {
  return String(a == null ? '' : a).trim().toUpperCase().replace(/\s+/g, ' ')
       === String(b == null ? '' : b).trim().toUpperCase().replace(/\s+/g, ' ');
}

export function GameReview({ type, cfg, parsed, questionId }: {
  type: string; cfg: any; parsed: any; questionId?: string;
}) {
  if (!cfg) return <span style={reviewMuted}>(no question config)</span>;
  const wrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 };

  if (type === 'hangman') {
    const items: any[] = cfg.hangman?.items || [];
    return (
      <div style={wrap}>
        {items.map((it, i) => {
          const word = String(it?.word || '').toUpperCase();
          const state = parsed[String(i)] || {};
          const guessed: string[] = Array.isArray(state.guessed) ? state.guessed : [];
          const wordLetters = new Set(word.split('').filter((ch) => /[A-Z]/.test(ch)));
          const wrong = guessed.filter((g) => !wordLetters.has(g));
          const won = Array.from(wordLetters).every((l) => guessed.includes(l));
          const ok = won && wrong.length < 6;
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={tickCell(ok)}>{ok ? '✓' : '✗'}</span>
              <code>{word}</code>
              <span style={reviewMuted}>· {wrong.length}/6 wrong{guessed.length ? ` · guessed: ${guessed.join('')}` : ' · not attempted'}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'speed_round') {
    const items: any[] = cfg.speedRound?.items || [];
    return (
      <div style={wrap}>
        {items.map((it, i) => {
          const expected = String(it?.a || '');
          const accepts = expected.split(',').map((x) => x.trim()).filter(Boolean);
          const got = String(parsed[String(i)] || '');
          const ok = accepts.some((acc) => _normCmp(got, acc));
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={tickCell(ok)}>{ok ? '✓' : '✗'}</span>
              <span>{i + 1}. {it?.q}</span>
              <span style={reviewMuted}>got <code>{got || '(blank)'}</code> · expected <code>{expected}</code></span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'ordering' || type === 'flowchart_seq') {
    const items: any[] = (type === 'ordering' ? cfg.ordering?.items : cfg.flowchartSeq?.blocks) || [];
    const labelOf = (it: any) => type === 'ordering' ? String(it?.label || '') : `[${it?.shape || 'process'}] ${it?.label || ''}`;
    const order: number[] = Array.isArray(parsed.order) ? parsed.order : items.map((_, i) => i);
    return (
      <div style={wrap}>
        {order.map((origIdx, i) => {
          const ok = origIdx === i;
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={tickCell(ok)}>{i + 1}.</span>
              <span>{labelOf(items[origIdx])}</span>
              {!ok && <span style={reviewMuted}>· should be position {origIdx + 1}</span>}
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'caesar_cipher') {
    const items: any[] = cfg.caesar?.items || [];
    return (
      <div style={wrap}>
        {items.map((it, i) => {
          const mode = it?.mode === 'decode' ? 'decode' : 'encode';
          const plain = String(it?.text || '').toUpperCase();
          const cipher = caesarShift(plain, Number(it?.shift) || 0);
          const expected = mode === 'encode' ? cipher : plain;
          const got = String(parsed[String(i)] || '');
          const ok = _normCmp(got, expected);
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={tickCell(ok)}>{ok ? '✓' : '✗'}</span>
              <span>{i + 1}. ({mode}, shift {it?.shift})</span>
              <span style={reviewMuted}>got <code>{got || '(blank)'}</code> · expected <code>{expected}</code></span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'spot_phish') {
    const items: any[] = cfg.spotPhish?.items || [];
    return (
      <div style={wrap}>
        {items.map((it, i) => {
          const expected = it?.isPhish ? 'phish' : 'safe';
          const got = String(parsed[String(i)] || '');
          const ok = got === expected;
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={tickCell(ok)}>{ok ? '✓' : '✗'}</span>
              <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{String(it?.text || '').slice(0, 80)}{String(it?.text || '').length > 80 ? '…' : ''}</span>
              <span style={reviewMuted}>got <code>{got || '?'}</code> · expected <code>{expected}</code></span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'binary_hex') {
    const probs = generateBinaryHexProblems(cfg.binaryHex || {}, `bh-${questionId || ''}`);
    return (
      <div style={wrap}>
        {probs.map((p, i) => {
          const got = String(parsed[String(i)] || '').trim().toUpperCase();
          const ok = got === p.expected.toUpperCase();
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={tickCell(ok)}>{ok ? '✓' : '✗'}</span>
              <span><code>{p.value}</code> ({p.fromLabel}) → {p.toLabel}</span>
              <span style={reviewMuted}>got <code>{got || '(blank)'}</code> · expected <code>{p.expected}</code></span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'bit_ops') {
    const probs = generateBitOpsProblems(cfg.bitOps || {}, `bo-${questionId || ''}`);
    return (
      <div style={wrap}>
        {probs.map((p, i) => {
          const got = String(parsed[String(i)] || '').replace(/[^01]/g, '');
          const ok = got === p.expected;
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={tickCell(ok)}>{ok ? '✓' : '✗'}</span>
              <code>{p.display} =</code>
              <span style={reviewMuted}>got <code>{got || '(blank)'}</code> · expected <code>{p.expected}</code></span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'code_tracer') {
    const steps: any[] = cfg.codeTracer?.steps || [];
    const rows: { si: number; name: string; expected: string; got: string; ok: boolean }[] = [];
    steps.forEach((s, si) => {
      (Array.isArray(s?.vars) ? s.vars : []).forEach((v: any) => {
        const expected = String(v?.value || '');
        const got = String(parsed[`${si}.${v?.name}`] || '');
        rows.push({ si, name: String(v?.name || ''), expected, got, ok: _normCmp(got, expected) });
      });
    });
    return (
      <div style={wrap}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={tickCell(r.ok)}>{r.ok ? '✓' : '✗'}</span>
            <span>step {r.si + 1} · <code>{r.name}</code></span>
            <span style={reviewMuted}>got <code>{r.got || '(blank)'}</code> · expected <code>{r.expected}</code></span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'sorting_race') {
    const list: number[] = (cfg.sortingRace?.list || []).map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n));
    const algorithm = ['bubble', 'selection', 'insertion'].includes(cfg.sortingRace?.algorithm) ? cfg.sortingRace.algorithm : 'bubble';
    const trace = simulateSort(list, algorithm);
    const expectedSorted = trace.sorted.join(',');
    const gotSortedRaw = String(parsed.sorted || '');
    const gotSorted = gotSortedRaw.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean).join(',');
    const cmpOk = String(parsed.comparisons || '').trim() === String(trace.comparisons);
    const swapOk = String(parsed.swaps || '').trim() === String(trace.swaps);
    const sortOk = gotSorted === expectedSorted;
    return (
      <div style={wrap}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
          <span style={tickCell(cmpOk)}>{cmpOk ? '✓' : '✗'}</span>
          <span>Comparisons</span>
          <span style={reviewMuted}>got <code>{String(parsed.comparisons || '(blank)')}</code> · expected <code>{trace.comparisons}</code></span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
          <span style={tickCell(swapOk)}>{swapOk ? '✓' : '✗'}</span>
          <span>Swaps</span>
          <span style={reviewMuted}>got <code>{String(parsed.swaps || '(blank)')}</code> · expected <code>{trace.swaps}</code></span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
          <span style={tickCell(sortOk)}>{sortOk ? '✓' : '✗'}</span>
          <span>Sorted list</span>
          <span style={reviewMuted}>got <code>{gotSortedRaw || '(blank)'}</code> · expected <code>{trace.sorted.join(', ')}</code></span>
        </div>
      </div>
    );
  }

  return <span style={reviewMuted}>(no review for this game type)</span>;
}
