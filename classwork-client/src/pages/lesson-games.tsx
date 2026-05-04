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

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

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

/* ============================================================================
   BATCH 2 — convert_relay, url_anatomy, truth_table, field_type_sort,
   io_sort, html_match. Same pattern as the original 10 games.
   ============================================================================ */

const CONVERT_MODE_LABEL: Record<string, string> = {
  dec_to_bin: 'Decimal → Binary',
  bin_to_dec: 'Binary → Decimal',
  dec_to_hex: 'Decimal → Hex',
  hex_to_dec: 'Hex → Decimal',
  bits_to_bytes: 'Bits → Bytes',
  bytes_to_bits: 'Bytes → Bits',
  b_to_kb: 'Bytes → Kilobytes',
  kb_to_b: 'Kilobytes → Bytes',
  kb_to_mb: 'Kilobytes → Megabytes',
  mb_to_kb: 'Megabytes → Kilobytes',
  mb_to_gb: 'Megabytes → Gigabytes',
  gb_to_mb: 'Gigabytes → Megabytes',
};
export const CONVERT_ALL_MODES = Object.keys(CONVERT_MODE_LABEL);

export type ConvertProblem = { mode: string; prompt: string; expected: string; hint: string };
export function generateConvertRelayProblems(cfg: any, seed: string): ConvertProblem[] {
  const rounds = Math.max(1, Math.min(40, Number(cfg?.rounds) || 10));
  const maxValue = Math.max(10, Math.min(9999, Number(cfg?.maxValue) || 200));
  const modes: string[] = (Array.isArray(cfg?.modes) && cfg.modes.length)
    ? cfg.modes.filter((m: any) => CONVERT_ALL_MODES.includes(m))
    : CONVERT_ALL_MODES.slice(0, 6);
  if (modes.length === 0) modes.push('dec_to_bin');
  const rng = _mulberry32(_stringHash(seed));
  const out: ConvertProblem[] = [];
  for (let i = 0; i < rounds; i++) {
    const mode = modes[Math.floor(rng() * modes.length)];
    const m = Math.max(1, Math.floor(rng() * maxValue) + 1);
    let prompt = '', expected = '';
    if (mode === 'dec_to_bin') { prompt = `${m}`; expected = m.toString(2); }
    else if (mode === 'bin_to_dec') { prompt = m.toString(2); expected = String(m); }
    else if (mode === 'dec_to_hex') { prompt = `${m}`; expected = m.toString(16).toUpperCase(); }
    else if (mode === 'hex_to_dec') { prompt = m.toString(16).toUpperCase(); expected = String(m); }
    else if (mode === 'bits_to_bytes') { prompt = `${m * 8} bits`; expected = String(m); }
    else if (mode === 'bytes_to_bits') { prompt = `${m} bytes`; expected = String(m * 8); }
    else if (mode === 'b_to_kb') { prompt = `${m * 1000} bytes`; expected = String(m); }
    else if (mode === 'kb_to_b') { prompt = `${m} KB`; expected = String(m * 1000); }
    else if (mode === 'kb_to_mb') { prompt = `${m * 1000} KB`; expected = String(m); }
    else if (mode === 'mb_to_kb') { prompt = `${m} MB`; expected = String(m * 1000); }
    else if (mode === 'mb_to_gb') { prompt = `${m * 1000} MB`; expected = String(m); }
    else if (mode === 'gb_to_mb') { prompt = `${m} GB`; expected = String(m * 1000); }
    out.push({ mode, prompt, expected, hint: CONVERT_MODE_LABEL[mode] });
  }
  return out;
}

export type UrlSeg = { text: string; label: string | null };
export const URL_LABELS = ['protocol', 'subdomain', 'domain', 'port', 'path', 'query', 'fragment'];
export function parseUrlSegments(url: string): UrlSeg[] | null {
  const m = String(url || '').trim().match(/^([a-zA-Z][a-zA-Z0-9+\-.]*):\/\/([^\/:?#]+)(?::(\d+))?([^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/);
  if (!m) return null;
  const protocol = m[1], host = m[2], port = m[3], path = m[4], query = m[5], fragment = m[6];
  const hostParts = host.split('.');
  let subdomain = '', domain = host;
  if (hostParts.length >= 3) {
    subdomain = hostParts.slice(0, -2).join('.');
    domain = hostParts.slice(-2).join('.');
  }
  const segs: UrlSeg[] = [];
  segs.push({ text: protocol, label: 'protocol' });
  segs.push({ text: '://', label: null });
  if (subdomain) {
    segs.push({ text: subdomain, label: 'subdomain' });
    segs.push({ text: '.', label: null });
  }
  segs.push({ text: domain, label: 'domain' });
  if (port) {
    segs.push({ text: ':', label: null });
    segs.push({ text: port, label: 'port' });
  }
  if (path) segs.push({ text: path, label: 'path' });
  if (query !== undefined) {
    segs.push({ text: '?', label: null });
    segs.push({ text: query, label: 'query' });
  }
  if (fragment !== undefined) {
    segs.push({ text: '#', label: null });
    segs.push({ text: fragment, label: 'fragment' });
  }
  return segs;
}

export type TtNode =
  | { kind: 'var'; name: string }
  | { kind: 'not'; inner: TtNode }
  | { kind: 'and'; left: TtNode; right: TtNode }
  | { kind: 'or'; left: TtNode; right: TtNode };
export function parseTruthExpr(input: string): { ast: TtNode; vars: string[] } | { error: string } {
  const tokens: string[] = [];
  const src = String(input || '').replace(/\s+/g, ' ').trim();
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ') { i++; continue; }
    if (ch === '(' || ch === ')') { tokens.push(ch); i++; continue; }
    if (/[A-Za-z]/.test(ch)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      tokens.push(src.slice(i, j).toUpperCase());
      i = j;
      continue;
    }
    return { error: `Unexpected '${ch}' at position ${i}` };
  }
  let p = 0;
  const peek = () => tokens[p];
  const eat = (t: string) => { if (tokens[p] !== t) throw new Error(`Expected '${t}' but got '${tokens[p] || 'end'}'`); p++; };
  const vars = new Set<string>();
  function parseOr(): TtNode {
    let left = parseAnd();
    while (peek() === 'OR') { p++; left = { kind: 'or', left, right: parseAnd() }; }
    return left;
  }
  function parseAnd(): TtNode {
    let left = parseNot();
    while (peek() === 'AND') { p++; left = { kind: 'and', left, right: parseNot() }; }
    return left;
  }
  function parseNot(): TtNode {
    if (peek() === 'NOT') { p++; return { kind: 'not', inner: parseNot() }; }
    return parseAtom();
  }
  function parseAtom(): TtNode {
    const t = peek();
    if (t === '(') { p++; const inner = parseOr(); eat(')'); return inner; }
    if (t && /^[A-Z][A-Z0-9_]*$/.test(t) && t !== 'AND' && t !== 'OR' && t !== 'NOT') {
      p++; vars.add(t); return { kind: 'var', name: t };
    }
    throw new Error(`Unexpected token '${t || 'end'}'`);
  }
  try {
    const ast = parseOr();
    if (p !== tokens.length) return { error: `Trailing token '${tokens[p]}'` };
    return { ast, vars: Array.from(vars).sort() };
  } catch (err: any) {
    return { error: String(err?.message || err) };
  }
}
export function evalTruthExpr(ast: TtNode, env: Record<string, boolean>): boolean {
  if (ast.kind === 'var') return !!env[ast.name];
  if (ast.kind === 'not') return !evalTruthExpr(ast.inner, env);
  if (ast.kind === 'and') return evalTruthExpr(ast.left, env) && evalTruthExpr(ast.right, env);
  return evalTruthExpr(ast.left, env) || evalTruthExpr(ast.right, env);
}
export function buildTruthRows(input: string): { vars: string[]; rows: { env: Record<string, boolean>; expected: boolean }[] } | null {
  const parsed = parseTruthExpr(input);
  if ('error' in parsed) return null;
  const { ast, vars } = parsed;
  const rows: { env: Record<string, boolean>; expected: boolean }[] = [];
  const N = vars.length;
  const total = N === 0 ? 1 : (1 << N);
  for (let r = 0; r < total; r++) {
    const env: Record<string, boolean> = {};
    vars.forEach((v, k) => { env[v] = !!((r >> (N - 1 - k)) & 1); });
    rows.push({ env, expected: evalTruthExpr(ast, env) });
  }
  return { vars, rows };
}

/* ---------- ConvertRelay ---------- */
export function ConvertRelayPupilUI({ config, cellAnswers, setCellAnswers, questionId }: {
  config: any; cellAnswers: any; setCellAnswers: (v: any) => void; questionId?: string;
}) {
  const probs = useMemo(() => generateConvertRelayProblems(config?.convertRelay || {}, `cr-${questionId || ''}`), [config?.convertRelay, questionId]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>{probs.length} round{probs.length === 1 ? '' : 's'} — convert each one in your head, no calculator. Use 1 KB = 1000 B, 1 MB = 1000 KB, 1 GB = 1000 MB and 1 byte = 8 bits.</div>
      {probs.map((p, i) => (
        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--cw-surface-soft)', borderRadius: 6 }}>
          <span style={{ width: 26, textAlign: 'right', color: 'var(--cw-muted)', fontSize: 12 }}>{i + 1}.</span>
          <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
            <strong>{p.prompt}</strong> <span style={{ color: 'var(--cw-muted)' }}>· {p.hint}</span>
          </span>
          <input
            value={String(cellAnswers[String(i)] || '')}
            onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}
            style={{ width: 140, padding: '4px 8px', fontFamily: 'JetBrains Mono, monospace' }}
            placeholder="answer"
          />
        </label>
      ))}
    </div>
  );
}
export function ConvertRelayEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const modes: string[] = Array.isArray(cfg.modes) ? cfg.modes : [];
  const toggle = (m: string) => {
    const next = modes.includes(m) ? modes.filter((x) => x !== m) : [...modes, m];
    setCfg({ ...cfg, modes: next });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 13 }}>
        Rounds <input type="number" min={1} max={40} value={Number(cfg.rounds) || 10} onChange={(e) => setCfg({ ...cfg, rounds: Number(e.target.value) })} style={{ width: 80, marginLeft: 6 }} />
      </label>
      <label style={{ fontSize: 13 }}>
        Max value <input type="number" min={10} max={9999} value={Number(cfg.maxValue) || 200} onChange={(e) => setCfg({ ...cfg, maxValue: Number(e.target.value) })} style={{ width: 100, marginLeft: 6 }} />
        <span style={{ color: 'var(--cw-muted)', fontSize: 12, marginLeft: 6 }}>(used as the "from" side of each conversion)</span>
      </label>
      <div style={{ fontSize: 13, fontWeight: 600 }}>Modes</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
        {CONVERT_ALL_MODES.map((m) => (
          <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={modes.includes(m)} onChange={() => toggle(m)} />
            {CONVERT_MODE_LABEL[m]}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ---------- UrlAnatomy ---------- */
export function UrlAnatomyPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: any; setCellAnswers: (v: any) => void;
}) {
  const items: any[] = config?.urlAnatomy?.items || [];
  const setSeg = (i: number, segIdx: number, label: string) => {
    const cur = (cellAnswers[String(i)] && typeof cellAnswers[String(i)] === 'object') ? cellAnswers[String(i)] : {};
    setCellAnswers({ ...cellAnswers, [String(i)]: { ...cur, [String(segIdx)]: label } });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map((it, i) => {
        const segs = parseUrlSegments(String(it?.url || '')) || [];
        const ans = (cellAnswers[String(i)] && typeof cellAnswers[String(i)] === 'object') ? cellAnswers[String(i)] : {};
        return (
          <div key={i} style={{ background: 'var(--cw-surface-soft)', padding: 10, borderRadius: 6 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all', marginBottom: 8, fontSize: 14 }}>
              {segs.map((s, j) => s.label === null
                ? <span key={j} style={{ color: 'var(--cw-muted)' }}>{s.text}</span>
                : <span key={j} style={{ background: '#fff', padding: '2px 4px', borderRadius: 3, border: '1px solid var(--cw-border)', margin: '0 1px' }}>{s.text}</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {segs.map((s, j) => s.label === null ? null : (
                <label key={j} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                  <code style={{ minWidth: 140 }}>{s.text}</code>
                  <select value={String(ans[String(j)] || '')} onChange={(e) => setSeg(i, j, e.target.value)}>
                    <option value="">— pick label —</option>
                    {URL_LABELS.map((L) => <option key={L} value={L}>{L}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function UrlAnatomyEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg.items) ? cfg.items : [];
  const upd = (i: number, url: string) => {
    const next = items.slice();
    next[i] = { url };
    setCfg({ ...cfg, items: next });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>One URL per row. Each is auto-split into segments and pupils pick the correct label for every meaningful part. Mix in subdomains, ports, paths, queries and fragments so all labels appear.</div>
      {items.map((it, i) => {
        const segs = parseUrlSegments(String(it?.url || ''));
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, background: 'var(--cw-surface-soft)', borderRadius: 6 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input value={String(it?.url || '')} onChange={(e) => upd(i, e.target.value)} placeholder="https://www.bbc.co.uk/news/technology?topic=ai#section1" style={{ flex: 1, padding: '4px 8px', fontFamily: 'JetBrains Mono, monospace' }} />
              <button type="button" onClick={() => setCfg({ ...cfg, items: items.filter((_, k) => k !== i) })} style={{ padding: '4px 8px' }}>×</button>
            </div>
            <div style={{ fontSize: 12, color: segs ? 'var(--cw-muted)' : '#b91c1c' }}>
              {segs ? segs.filter((s) => s.label).map((s) => `${s.label}=${s.text}`).join(' · ') : 'Could not parse — must start with protocol://'}
            </div>
          </div>
        );
      })}
      <button type="button" onClick={() => setCfg({ ...cfg, items: [...items, { url: '' }] })} style={{ alignSelf: 'flex-start', padding: '6px 10px' }}>+ Add URL</button>
    </div>
  );
}

/* ---------- TruthTable ---------- */
export function TruthTablePupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: any; setCellAnswers: (v: any) => void;
}) {
  const expr = String(config?.truthTable?.expression || '');
  const built = useMemo(() => buildTruthRows(expr), [expr]);
  if (!built) return <div style={{ color: '#b91c1c' }}>Invalid Boolean expression — ask your teacher to fix it.</div>;
  const { vars, rows } = built;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14 }}>{expr}</div>
      <table style={{ borderCollapse: 'collapse', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
        <thead>
          <tr>
            {vars.map((v) => <th key={v} style={{ border: '1px solid var(--cw-border)', padding: '4px 10px' }}>{v}</th>)}
            <th style={{ border: '1px solid var(--cw-border)', padding: '4px 10px', background: 'var(--cw-surface-soft)' }}>Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {vars.map((v) => <td key={v} style={{ border: '1px solid var(--cw-border)', padding: '4px 10px', textAlign: 'center' }}>{row.env[v] ? 1 : 0}</td>)}
              <td style={{ border: '1px solid var(--cw-border)', padding: '2px 4px', textAlign: 'center' }}>
                <input
                  value={String(cellAnswers[String(ri)] || '')}
                  onChange={(e) => setCellAnswers({ ...cellAnswers, [String(ri)]: e.target.value.replace(/[^01]/g, '').slice(0, 1) })}
                  style={{ width: 36, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}
                  placeholder="?"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function TruthTableEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const expr = String(cfg.expression || '');
  const parsed = useMemo(() => parseTruthExpr(expr), [expr]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 13 }}>
        Expression <input value={expr} onChange={(e) => setCfg({ ...cfg, expression: e.target.value })} placeholder="A AND (B OR NOT C)" style={{ width: '100%', padding: '4px 8px', fontFamily: 'JetBrains Mono, monospace' }} />
      </label>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>Use uppercase letters as variables and the operators AND, OR, NOT. Parentheses are allowed.</div>
      {'error' in parsed
        ? <div style={{ color: '#b91c1c', fontSize: 13 }}>Parse error: {parsed.error}</div>
        : <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>Variables: {parsed.vars.join(', ') || '(none)'} — pupils will fill {parsed.vars.length === 0 ? 1 : (1 << parsed.vars.length)} row{parsed.vars.length === 0 ? '' : 's'}.</div>
      }
    </div>
  );
}

/* ---------- FieldTypeSort ---------- */
const FIELD_TYPES = ['integer', 'real', 'text', 'boolean', 'date'];
export function FieldTypeSortPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: any; setCellAnswers: (v: any) => void;
}) {
  const items: any[] = config?.fieldTypeSort?.items || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>For each value, pick the field type that best stores it.</div>
      {items.map((it, i) => (
        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, background: 'var(--cw-surface-soft)', borderRadius: 6 }}>
          <code style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace' }}>{String(it?.value ?? '')}</code>
          <select value={String(cellAnswers[String(i)] || '')} onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}>
            <option value="">— pick type —</option>
            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
export function FieldTypeSortEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg.items) ? cfg.items : [];
  const upd = (i: number, patch: any) => {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    setCfg({ ...cfg, items: next });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>Add a value (as pupils will see it) plus its correct field type.</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={String(it?.value ?? '')} onChange={(e) => upd(i, { value: e.target.value })} placeholder='e.g. 07/05/2024 or 42' style={{ flex: 1, padding: '4px 8px', fontFamily: 'JetBrains Mono, monospace' }} />
          <select value={String(it?.type || 'text')} onChange={(e) => upd(i, { type: e.target.value })}>
            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button type="button" onClick={() => setCfg({ ...cfg, items: items.filter((_, k) => k !== i) })} style={{ padding: '4px 8px' }}>×</button>
        </div>
      ))}
      <button type="button" onClick={() => setCfg({ ...cfg, items: [...items, { value: '', type: 'text' }] })} style={{ alignSelf: 'flex-start', padding: '6px 10px' }}>+ Add value</button>
    </div>
  );
}

/* ---------- IoSort ---------- */
const IO_CATEGORIES = ['input', 'output', 'storage', 'both'];
export function IoSortPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: any; setCellAnswers: (v: any) => void;
}) {
  const items: any[] = config?.ioSort?.items || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>Categorise each device. "Both" = it does input <em>and</em> output (e.g. touchscreen).</div>
      {items.map((it, i) => (
        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, background: 'var(--cw-surface-soft)', borderRadius: 6 }}>
          <span style={{ flex: 1 }}>{String(it?.name || '')}</span>
          <select value={String(cellAnswers[String(i)] || '')} onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}>
            <option value="">— pick —</option>
            {IO_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
export function IoSortEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg.items) ? cfg.items : [];
  const upd = (i: number, patch: any) => {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    setCfg({ ...cfg, items: next });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={String(it?.name || '')} onChange={(e) => upd(i, { name: e.target.value })} placeholder="e.g. Touchscreen" style={{ flex: 1, padding: '4px 8px' }} />
          <select value={String(it?.category || 'input')} onChange={(e) => upd(i, { category: e.target.value })}>
            {IO_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="button" onClick={() => setCfg({ ...cfg, items: items.filter((_, k) => k !== i) })} style={{ padding: '4px 8px' }}>×</button>
        </div>
      ))}
      <button type="button" onClick={() => setCfg({ ...cfg, items: [...items, { name: '', category: 'input' }] })} style={{ alignSelf: 'flex-start', padding: '6px 10px' }}>+ Add device</button>
    </div>
  );
}

/* ---------- HtmlMatch ---------- */
const COMMON_HTML_TAGS = ['h1','h2','h3','p','a','img','ul','ol','li','div','span','button','input','form','table','tr','td','th','nav','header','footer','section','article','main','video','audio','br'];
export function HtmlMatchPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: any; setCellAnswers: (v: any) => void;
}) {
  const items: any[] = config?.htmlMatch?.items || [];
  const tags = Array.from(new Set([...items.map((it: any) => String(it?.tag || '').toLowerCase()).filter(Boolean), ...COMMON_HTML_TAGS])).sort();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>Pick the HTML tag that matches each description.</div>
      {items.map((it, i) => (
        <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 6, background: 'var(--cw-surface-soft)', borderRadius: 6 }}>
          <span style={{ flex: 1 }}>{String(it?.description || '')}</span>
          <select value={String(cellAnswers[String(i)] || '')} onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}>
            <option value="">— pick tag —</option>
            {tags.map((t) => <option key={t} value={t}>&lt;{t}&gt;</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
export function HtmlMatchEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg.items) ? cfg.items : [];
  const upd = (i: number, patch: any) => {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    setCfg({ ...cfg, items: next });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>Description (what the element does) plus the correct tag (no angle brackets).</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={String(it?.description || '')} onChange={(e) => upd(i, { description: e.target.value })} placeholder="A clickable hyperlink" style={{ flex: 2, padding: '4px 8px' }} />
          <input value={String(it?.tag || '')} onChange={(e) => upd(i, { tag: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })} placeholder="a" style={{ width: 80, padding: '4px 8px', fontFamily: 'JetBrains Mono, monospace' }} />
          <button type="button" onClick={() => setCfg({ ...cfg, items: items.filter((_, k) => k !== i) })} style={{ padding: '4px 8px' }}>×</button>
        </div>
      ))}
      <button type="button" onClick={() => setCfg({ ...cfg, items: [...items, { description: '', tag: '' }] })} style={{ alignSelf: 'flex-start', padding: '6px 10px' }}>+ Add element</button>
    </div>
  );
}

/* ============================================================================
   BATCH 3 — password_forge, privacy_radar, validation_rules, find_duplicate,
   bin_search, box_model.
   ============================================================================ */

const PASSWORD_RULES: { id: string; label: string; check: (pw: string) => boolean }[] = [
  { id: 'min_length_8', label: '≥ 8 characters', check: (pw) => pw.length >= 8 },
  { id: 'min_length_12', label: '≥ 12 characters', check: (pw) => pw.length >= 12 },
  { id: 'min_length_16', label: '≥ 16 characters', check: (pw) => pw.length >= 16 },
  { id: 'has_upper', label: 'Has UPPERCASE letter', check: (pw) => /[A-Z]/.test(pw) },
  { id: 'has_lower', label: 'Has lowercase letter', check: (pw) => /[a-z]/.test(pw) },
  { id: 'has_digit', label: 'Has digit (0–9)', check: (pw) => /\d/.test(pw) },
  { id: 'has_symbol', label: 'Has symbol (!@#…)', check: (pw) => /[^A-Za-z0-9]/.test(pw) },
  { id: 'no_spaces', label: 'No spaces', check: (pw) => pw.length > 0 && !/\s/.test(pw) },
  { id: 'no_common_word', label: 'Not a common password', check: (pw) => {
    const lower = pw.toLowerCase();
    const bad = ['password','passw0rd','qwerty','12345','11111','letmein','admin','welcome','iloveyou','dragon','monkey','football','abc123','000000','starwars'];
    return !bad.some((b) => lower.includes(b));
  } },
];
export const PASSWORD_RULE_IDS = PASSWORD_RULES.map((r) => r.id);

export function checkPassword(pw: string, ruleIds: string[]): { id: string; label: string; ok: boolean }[] {
  return PASSWORD_RULES.filter((r) => ruleIds.includes(r.id)).map((r) => ({ id: r.id, label: r.label, ok: r.check(pw) }));
}

export function PasswordForgePupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: any; setCellAnswers: (v: any) => void;
}) {
  const ruleIds: string[] = (config?.passwordForge?.rules || []).filter((r: any) => PASSWORD_RULE_IDS.includes(r));
  const pw = String(cellAnswers.password || '');
  const checks = checkPassword(pw, ruleIds);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        value={pw}
        onChange={(e) => setCellAnswers({ ...cellAnswers, password: e.target.value })}
        style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 14, border: '1px solid var(--cw-border)', borderRadius: 6 }}
        placeholder="Type your strong password…"
        autoComplete="off"
        spellCheck={false}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {checks.map((c) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ width: 18, color: c.ok ? '#16a34a' : '#94a3b8' }}>{c.ok ? '✓' : '○'}</span>
            <span style={{ color: c.ok ? '#166534' : 'var(--cw-muted)' }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
export function PasswordForgeEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const rules: string[] = Array.isArray(cfg.rules) ? cfg.rules : [];
  const toggle = (id: string) => {
    const next = rules.includes(id) ? rules.filter((r) => r !== id) : [...rules, id];
    setCfg({ ...cfg, rules: next });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>Pick the rules pupils' password must satisfy. Each tick is worth one mark.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 4 }}>
        {PASSWORD_RULES.map((r) => (
          <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={rules.includes(r.id)} onChange={() => toggle(r.id)} />
            {r.label}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ---------- PrivacyRadar ---------- */
const PRIVACY_LEVELS = ['low', 'medium', 'high'];
export function PrivacyRadarPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: any; setCellAnswers: (v: any) => void;
}) {
  const items: any[] = config?.privacyRadar?.items || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>How risky is each thing to share online? Pick low / medium / high.</div>
      {items.map((it, i) => (
        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, background: 'var(--cw-surface-soft)', borderRadius: 6 }}>
          <span style={{ flex: 1 }}>{String(it?.text || '')}</span>
          <select value={String(cellAnswers[String(i)] || '')} onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}>
            <option value="">— pick —</option>
            {PRIVACY_LEVELS.map((L) => <option key={L} value={L}>{L}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
export function PrivacyRadarEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg.items) ? cfg.items : [];
  const upd = (i: number, patch: any) => { const next = items.slice(); next[i] = { ...next[i], ...patch }; setCfg({ ...cfg, items: next }); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={String(it?.text || '')} onChange={(e) => upd(i, { text: e.target.value })} placeholder="e.g. Posting your home address publicly" style={{ flex: 1, padding: '4px 8px' }} />
          <select value={String(it?.risk || 'low')} onChange={(e) => upd(i, { risk: e.target.value })}>
            {PRIVACY_LEVELS.map((L) => <option key={L} value={L}>{L}</option>)}
          </select>
          <button type="button" onClick={() => setCfg({ ...cfg, items: items.filter((_, k) => k !== i) })} style={{ padding: '4px 8px' }}>×</button>
        </div>
      ))}
      <button type="button" onClick={() => setCfg({ ...cfg, items: [...items, { text: '', risk: 'low' }] })} style={{ alignSelf: 'flex-start', padding: '6px 10px' }}>+ Add scenario</button>
    </div>
  );
}

/* ---------- ValidationRules ---------- */
const VALIDATION_RULE_TYPES = ['presence', 'range', 'length', 'format', 'lookup'];
const VALIDATION_RULE_LABEL: Record<string, string> = {
  presence: 'Presence (must not be blank)',
  range: 'Range (between two numbers/dates)',
  length: 'Length (min/max characters)',
  format: 'Format / pattern (e.g. postcode, email)',
  lookup: 'Lookup / restricted choice (from a list)',
};
export function ValidationRulesPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: any; setCellAnswers: (v: any) => void;
}) {
  const items: any[] = config?.validationRules?.items || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>Match each rule to the validation type it best illustrates.</div>
      {items.map((it, i) => (
        <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 6, background: 'var(--cw-surface-soft)', borderRadius: 6 }}>
          <span style={{ flex: 1 }}>{String(it?.scenario || '')}</span>
          <select value={String(cellAnswers[String(i)] || '')} onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}>
            <option value="">— pick rule —</option>
            {VALIDATION_RULE_TYPES.map((R) => <option key={R} value={R}>{R}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
export function ValidationRulesEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg.items) ? cfg.items : [];
  const upd = (i: number, patch: any) => { const next = items.slice(); next[i] = { ...next[i], ...patch }; setCfg({ ...cfg, items: next }); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>{Object.entries(VALIDATION_RULE_LABEL).map(([k,v]) => `${k}: ${v}`).join(' · ')}</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={String(it?.scenario || '')} onChange={(e) => upd(i, { scenario: e.target.value })} placeholder="e.g. Pupil's age must be between 5 and 18" style={{ flex: 1, padding: '4px 8px' }} />
          <select value={String(it?.rule || 'presence')} onChange={(e) => upd(i, { rule: e.target.value })}>
            {VALIDATION_RULE_TYPES.map((R) => <option key={R} value={R}>{R}</option>)}
          </select>
          <button type="button" onClick={() => setCfg({ ...cfg, items: items.filter((_, k) => k !== i) })} style={{ padding: '4px 8px' }}>×</button>
        </div>
      ))}
      <button type="button" onClick={() => setCfg({ ...cfg, items: [...items, { scenario: '', rule: 'presence' }] })} style={{ alignSelf: 'flex-start', padding: '6px 10px' }}>+ Add scenario</button>
    </div>
  );
}

/* ---------- FindDuplicate ---------- */
export function findDuplicateRows(rows: string[][]): Set<number> {
  const seen = new Map<string, number[]>();
  rows.forEach((row, i) => {
    const key = row.map((c) => String(c).trim().toLowerCase()).join('||');
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(i);
  });
  const out = new Set<number>();
  seen.forEach((idxs) => { if (idxs.length > 1) idxs.forEach((i) => out.add(i)); });
  return out;
}
export function FindDuplicatePupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: any; setCellAnswers: (v: any) => void;
}) {
  const items: any[] = config?.findDuplicate?.items || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>One row in each table is a duplicate. Click the duplicate row.</div>
      {items.map((it, i) => {
        const headers: string[] = Array.isArray(it?.headers) ? it.headers : [];
        const rows: string[][] = Array.isArray(it?.rows) ? it.rows : [];
        const sel = String(cellAnswers[String(i)] || '');
        return (
          <div key={i} style={{ background: 'var(--cw-surface-soft)', padding: 8, borderRadius: 6 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ padding: 4, border: '1px solid var(--cw-border)', width: 40 }}>#</th>
                  {headers.map((h, k) => <th key={k} style={{ padding: 4, border: '1px solid var(--cw-border)', textAlign: 'left' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} onClick={() => setCellAnswers({ ...cellAnswers, [String(i)]: String(ri) })} style={{ cursor: 'pointer', background: sel === String(ri) ? '#fde68a' : undefined }}>
                    <td style={{ padding: 4, border: '1px solid var(--cw-border)', textAlign: 'center' }}>
                      <input type="radio" checked={sel === String(ri)} onChange={() => setCellAnswers({ ...cellAnswers, [String(i)]: String(ri) })} />
                    </td>
                    {row.map((c, k) => <td key={k} style={{ padding: 4, border: '1px solid var(--cw-border)' }}>{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
export function FindDuplicateEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg.items) ? cfg.items : [];
  const updItem = (i: number, patch: any) => { const next = items.slice(); next[i] = { ...next[i], ...patch }; setCfg({ ...cfg, items: next }); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>For each table, list headers (comma-separated) and rows (one row per line, cells comma-separated). Make sure exactly one row is duplicated.</div>
      {items.map((it, i) => {
        const headers: string[] = Array.isArray(it?.headers) ? it.headers : [];
        const rows: string[][] = Array.isArray(it?.rows) ? it.rows : [];
        const dups = findDuplicateRows(rows);
        return (
          <div key={i} style={{ background: 'var(--cw-surface-soft)', padding: 8, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input value={headers.join(', ')} onChange={(e) => updItem(i, { headers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="Name, Age, Subject" style={{ padding: '4px 8px' }} />
            <textarea
              value={rows.map((r) => r.join(', ')).join('\n')}
              onChange={(e) => updItem(i, { rows: e.target.value.split('\n').map((line) => line.split(',').map((c) => c.trim())).filter((row) => row.some((c) => c)) })}
              rows={5}
              placeholder={'Alice, 10, Maths\nBob, 11, English\nAlice, 10, Maths\nCarol, 9, Art'}
              style={{ padding: '4px 8px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}
            />
            <div style={{ fontSize: 12, color: dups.size === 0 ? '#b91c1c' : 'var(--cw-muted)' }}>
              {dups.size === 0 ? 'No duplicate detected — add a repeated row.' : `Duplicate row indices: ${Array.from(dups).sort((a, b) => a - b).join(', ')}`}
            </div>
            <button type="button" onClick={() => setCfg({ ...cfg, items: items.filter((_, k) => k !== i) })} style={{ alignSelf: 'flex-start', padding: '4px 8px' }}>Remove table</button>
          </div>
        );
      })}
      <button type="button" onClick={() => setCfg({ ...cfg, items: [...items, { headers: ['Name', 'Age', 'Subject'], rows: [['Alice','10','Maths'], ['Bob','11','English'], ['Alice','10','Maths'], ['Carol','9','Art']] }] })} style={{ alignSelf: 'flex-start', padding: '6px 10px' }}>+ Add table</button>
    </div>
  );
}

/* ---------- BinSearch ---------- */
export function simulateBinSearch(list: number[], target: number): { mids: number[]; found: boolean; foundIndex: number } {
  let lo = 0, hi = list.length - 1;
  const mids: number[] = [];
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    mids.push(mid);
    if (list[mid] === target) return { mids, found: true, foundIndex: mid };
    if (list[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return { mids, found: false, foundIndex: -1 };
}
export function BinSearchPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: any; setCellAnswers: (v: any) => void;
}) {
  const items: any[] = config?.binSearch?.items || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>For each sorted list and target, type the indices the binary-search algorithm checks (in order, comma-separated). Indices start at 0.</div>
      {items.map((it, i) => {
        const list: number[] = Array.isArray(it?.list) ? it.list.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n)) : [];
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, background: 'var(--cw-surface-soft)', borderRadius: 6 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>List: [{list.join(', ')}] — indices 0 to {list.length - 1}</div>
            <div style={{ fontSize: 13 }}>Target: <code>{Number(it?.target)}</code></div>
            <input
              value={String(cellAnswers[String(i)] || '')}
              onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}
              placeholder="e.g. 3, 1, 2"
              style={{ padding: '4px 8px', fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>
        );
      })}
    </div>
  );
}
export function BinSearchEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg.items) ? cfg.items : [];
  const upd = (i: number, patch: any) => { const next = items.slice(); next[i] = { ...next[i], ...patch }; setCfg({ ...cfg, items: next }); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>Each item is a sorted list (comma-separated) plus a target. The expected sequence of mid indices is computed automatically.</div>
      {items.map((it, i) => {
        const list: number[] = Array.isArray(it?.list) ? it.list.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n)) : [];
        const target = Number(it?.target);
        const sim = list.length > 0 && Number.isFinite(target) ? simulateBinSearch(list, target) : null;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, background: 'var(--cw-surface-soft)', borderRadius: 6 }}>
            <input
              value={Array.isArray(it?.list) ? it.list.join(', ') : ''}
              onChange={(e) => upd(i, { list: e.target.value.split(/[,\s]+/).map((x) => Number(x)).filter((n) => Number.isFinite(n)) })}
              placeholder="1, 3, 5, 7, 9, 11, 13, 15"
              style={{ padding: '4px 8px', fontFamily: 'JetBrains Mono, monospace' }}
            />
            <input
              type="number"
              value={Number.isFinite(target) ? target : ''}
              onChange={(e) => upd(i, { target: Number(e.target.value) })}
              placeholder="target"
              style={{ width: 120, padding: '4px 8px' }}
            />
            <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>
              {sim ? `Expected mids: ${sim.mids.join(', ')}${sim.found ? ` (found at ${sim.foundIndex})` : ' (not found)'}` : 'Add list and target'}
            </div>
            <button type="button" onClick={() => setCfg({ ...cfg, items: items.filter((_, k) => k !== i) })} style={{ alignSelf: 'flex-start', padding: '4px 8px' }}>Remove</button>
          </div>
        );
      })}
      <button type="button" onClick={() => setCfg({ ...cfg, items: [...items, { list: [1, 3, 5, 7, 9, 11, 13, 15], target: 11 }] })} style={{ alignSelf: 'flex-start', padding: '6px 10px' }}>+ Add list</button>
    </div>
  );
}

/* ---------- BoxModel ---------- */
export function BoxModelPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: any; setCellAnswers: (v: any) => void;
}) {
  const items: any[] = config?.boxModel?.items || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>For each CSS box, work out the total <em>outer</em> width in pixels: <code>content + 2×(padding + border + margin)</code>.</div>
      {items.map((it, i) => {
        const c = Number(it?.content) || 0, p = Number(it?.padding) || 0, b = Number(it?.border) || 0, mg = Number(it?.margin) || 0;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'var(--cw-surface-soft)', borderRadius: 6 }}>
            <div style={{ display: 'inline-block', position: 'relative', padding: mg, background: '#fef3c7', flexShrink: 0 }}>
              <div style={{ padding: b, background: '#0f172a' }}>
                <div style={{ padding: p, background: '#bbf7d0' }}>
                  <div style={{ width: c, height: 24, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{c}px</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13 }}>
              <div>content: <code>{c}px</code> · padding: <code>{p}px</code> · border: <code>{b}px</code> · margin: <code>{mg}px</code></div>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                Outer width:
                <input
                  type="number"
                  value={String(cellAnswers[String(i)] || '')}
                  onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}
                  style={{ width: 100, padding: '4px 8px' }}
                />
                px
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function BoxModelEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg.items) ? cfg.items : [];
  const upd = (i: number, patch: any) => { const next = items.slice(); next[i] = { ...next[i], ...patch }; setCfg({ ...cfg, items: next }); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((it, i) => {
        const c = Number(it?.content) || 0, p = Number(it?.padding) || 0, b = Number(it?.border) || 0, mg = Number(it?.margin) || 0;
        const total = c + 2 * (p + b + mg);
        return (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <label style={{ fontSize: 12 }}>content<input type="number" value={c} onChange={(e) => upd(i, { content: Number(e.target.value) })} style={{ width: 70, marginLeft: 4 }} /></label>
            <label style={{ fontSize: 12 }}>padding<input type="number" value={p} onChange={(e) => upd(i, { padding: Number(e.target.value) })} style={{ width: 60, marginLeft: 4 }} /></label>
            <label style={{ fontSize: 12 }}>border<input type="number" value={b} onChange={(e) => upd(i, { border: Number(e.target.value) })} style={{ width: 60, marginLeft: 4 }} /></label>
            <label style={{ fontSize: 12 }}>margin<input type="number" value={mg} onChange={(e) => upd(i, { margin: Number(e.target.value) })} style={{ width: 60, marginLeft: 4 }} /></label>
            <span style={{ fontSize: 12, color: 'var(--cw-muted)' }}>= {total}px</span>
            <button type="button" onClick={() => setCfg({ ...cfg, items: items.filter((_, k) => k !== i) })} style={{ padding: '4px 8px' }}>×</button>
          </div>
        );
      })}
      <button type="button" onClick={() => setCfg({ ...cfg, items: [...items, { content: 200, padding: 10, border: 2, margin: 8 }] })} style={{ alignSelf: 'flex-start', padding: '6px 10px' }}>+ Add box</button>
    </div>
  );
}

/* ============================================================================
   BATCH 4 — pick-list pattern games (shared helper).
   friend_or_fake, dm_danger, malware_triage, 2fa_escape, a11y_audit, fetch_execute
   ============================================================================ */

export function PickListPupilUI({ items, options, hint, textKey, cellAnswers, setCellAnswers, labelMap }: {
  items: any[]; options: string[]; hint: string; textKey: string;
  cellAnswers: any; setCellAnswers: (v: any) => void;
  labelMap?: Record<string, string>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--cw-muted)' }}>{hint}</div>
      {items.map((it, i) => (
        <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 6, background: 'var(--cw-surface-soft)', borderRadius: 6 }}>
          <span style={{ flex: 1 }}>{String(it?.[textKey] || '')}</span>
          <select value={String(cellAnswers[String(i)] || '')} onChange={(e) => setCellAnswers({ ...cellAnswers, [String(i)]: e.target.value })}>
            <option value="">— pick —</option>
            {options.map((o) => <option key={o} value={o}>{labelMap?.[o] || o}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

export function PickListEditor({ cfg, setCfg, options, textKey, valueKey, textPlaceholder, labelMap }: {
  cfg: any; setCfg: (v: any) => void;
  options: string[]; textKey: string; valueKey: string; textPlaceholder: string;
  labelMap?: Record<string, string>;
}) {
  const items: any[] = Array.isArray(cfg.items) ? cfg.items : [];
  const upd = (i: number, patch: any) => { const next = items.slice(); next[i] = { ...next[i], ...patch }; setCfg({ ...cfg, items: next }); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={String(it?.[textKey] || '')} onChange={(e) => upd(i, { [textKey]: e.target.value })} placeholder={textPlaceholder} style={{ flex: 1, padding: '4px 8px' }} />
          <select value={String(it?.[valueKey] || options[0])} onChange={(e) => upd(i, { [valueKey]: e.target.value })}>
            {options.map((o) => <option key={o} value={o}>{labelMap?.[o] || o}</option>)}
          </select>
          <button type="button" onClick={() => setCfg({ ...cfg, items: items.filter((_, k) => k !== i) })} style={{ padding: '4px 8px' }}>×</button>
        </div>
      ))}
      <button type="button" onClick={() => setCfg({ ...cfg, items: [...items, { [textKey]: '', [valueKey]: options[0] }] })} style={{ alignSelf: 'flex-start', padding: '6px 10px' }}>+ Add item</button>
    </div>
  );
}

const FRIEND_OR_FAKE_OPTS = ['real', 'fake'];
const DM_DANGER_OPTS = ['safe', 'risky', 'dangerous'];
const MALWARE_OPTS = ['virus', 'worm', 'trojan', 'ransomware', 'spyware', 'adware'];
const TFA_OPTS = ['password_only', 'sms', 'email', 'authenticator', 'hardware'];
const TFA_LABELS: Record<string, string> = { password_only: 'Password only', sms: 'SMS code', email: 'Email link', authenticator: 'Authenticator app', hardware: 'Hardware key' };
const A11Y_OPTS = ['contrast', 'alt_text', 'labels', 'keyboard', 'heading_order', 'focus_indicator'];
const A11Y_LABELS: Record<string, string> = { contrast: 'Poor colour contrast', alt_text: 'Missing alt text', labels: 'Missing form labels', keyboard: 'Keyboard trap / not reachable', heading_order: 'Heading order skips levels', focus_indicator: 'No focus indicator' };
const FETCH_EXECUTE_OPTS = ['fetch', 'decode', 'execute'];

export const FriendOrFakePupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.friendOrFake?.items || []} options={FRIEND_OR_FAKE_OPTS} hint="Decide if each social-media profile is genuine or fake." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />;
export const FriendOrFakeEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={FRIEND_OR_FAKE_OPTS} textKey="text" valueKey="verdict" textPlaceholder="e.g. New profile, no posts, asks personal questions" />;

export const DmDangerPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.dmDanger?.items || []} options={DM_DANGER_OPTS} hint="Rate each direct message: safe, risky, or dangerous." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />;
export const DmDangerEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={DM_DANGER_OPTS} textKey="text" valueKey="risk" textPlaceholder="e.g. Stranger asks for your home address" />;

const UPSTANDER_OPTS = ['report', 'support', 'block', 'ignore'];
const UPSTANDER_LABELS: Record<string, string> = {
  report: '🚨 Report it',
  support: '💬 Support the target',
  block: '🚫 Block & ignore',
  ignore: '😶 Do nothing',
};
const UPSTANDER_BTN_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  report:  { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  support: { color: '#0d9488', bg: '#f0fdfa', border: '#5eead4' },
  block:   { color: '#7c3aed', bg: '#faf5ff', border: '#c4b5fd' },
  ignore:  { color: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
};
export function UpstanderPupilUI({ config, cellAnswers, setCellAnswers }: any) {
  const items: any[] = config?.upstander?.items || [];
  const opts = UPSTANDER_OPTS;
  const allAnswered = items.length > 0 && items.every((_: any, i: number) => !!cellAnswers[String(i)]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        borderRadius: 14, padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 14, color: '#fff',
      }}>
        <span style={{ fontSize: 36 }}>🦸</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>Be an Upstander!</div>
          <div style={{ fontSize: 13, opacity: 0.88, marginTop: 2 }}>Read each scenario and pick the best action to take.</div>
        </div>
        {allAnswered && (
          <div style={{ marginLeft: 'auto', background: '#fff2', borderRadius: 999, padding: '4px 14px', fontSize: 13, fontWeight: 700 }}>
            ✅ All done!
          </div>
        )}
      </div>
      {items.map((it: any, i: number) => {
        const chosen = String(cellAnswers[String(i)] || '');
        return (
          <div key={i} style={{
            background: 'var(--cw-surface)', borderRadius: 14,
            border: `2px solid ${chosen ? UPSTANDER_BTN_STYLES[chosen]?.border || 'var(--cw-border)' : 'var(--cw-border)'}`,
            overflow: 'hidden', transition: 'border-color 0.2s',
          }}>
            <div style={{
              background: 'linear-gradient(90deg,#6366f108,#a855f708)',
              borderBottom: '1px solid var(--cw-border)',
              padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{
                flexShrink: 0, width: 26, height: 26,
                background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                color: '#fff', borderRadius: 999, fontSize: 12, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{i + 1}</span>
              <span style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--cw-ink)' }}>{String(it?.scenario || '')}</span>
            </div>
            <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {opts.map((o) => {
                const sel = chosen === o;
                const s = UPSTANDER_BTN_STYLES[o];
                return (
                  <button key={o} type="button"
                    onClick={() => setCellAnswers({ ...cellAnswers, [String(i)]: o })}
                    style={{
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      background: sel ? s.color : s.bg,
                      color: sel ? '#fff' : s.color,
                      border: `2px solid ${sel ? s.color : s.border}`,
                      fontWeight: sel ? 700 : 500, fontSize: 13,
                      transition: 'all 0.15s',
                      boxShadow: sel ? `0 2px 10px ${s.color}44` : 'none',
                      transform: sel ? 'scale(1.03)' : 'none',
                    }}
                  >{UPSTANDER_LABELS[o]}</button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function UpstanderEditor({ cfg, setCfg }: { cfg: any; setCfg: (v: any) => void }) {
  const items: any[] = Array.isArray(cfg.items) ? cfg.items : [];
  const upd = (i: number, scenario: string) => {
    const next = items.slice(); next[i] = { scenario }; setCfg({ ...cfg, items: next });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--cw-muted)', minWidth: 20, textAlign: 'right' }}>{i + 1}.</span>
          <input
            value={String(it?.scenario || '')}
            onChange={(e) => upd(i, e.target.value)}
            placeholder="e.g. A classmate is posting mean comments on someone's photo"
            style={{ flex: 1, padding: '4px 8px' }}
          />
          <button type="button" onClick={() => setCfg({ ...cfg, items: items.filter((_, k) => k !== i) })} style={{ padding: '4px 8px' }}>×</button>
        </div>
      ))}
      <button type="button" onClick={() => setCfg({ ...cfg, items: [...items, { scenario: '' }] })} style={{ alignSelf: 'flex-start', padding: '6px 10px' }}>+ Add scenario</button>
    </div>
  );
}

export const MalwareTriagePupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.malwareTriage?.items || []} options={MALWARE_OPTS} hint="Match each description to the type of malware." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />;
export const MalwareTriageEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={MALWARE_OPTS} textKey="text" valueKey="kind" textPlaceholder="e.g. Encrypts your files and demands payment" />;

export const TwoFactorEscapePupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.twoFactorEscape?.items || []} options={TFA_OPTS} hint="Pick the most appropriate authentication method for each scenario." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={TFA_LABELS} />;
export const TwoFactorEscapeEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={TFA_OPTS} textKey="text" valueKey="method" textPlaceholder="e.g. Online banking on a personal phone" labelMap={TFA_LABELS} />;

export const A11yAuditPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.a11yAudit?.items || []} options={A11Y_OPTS} hint="Identify the accessibility issue in each web-page snippet." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={A11Y_LABELS} />;
export const A11yAuditEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={A11Y_OPTS} textKey="text" valueKey="issue" textPlaceholder='e.g. <img src="logo.png"> with no alt' labelMap={A11Y_LABELS} />;

export const FetchExecutePupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.fetchExecute?.items || []} options={FETCH_EXECUTE_OPTS} hint="Which stage of the fetch–decode–execute cycle does each action belong to?" textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />;
export const FetchExecuteEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={FETCH_EXECUTE_OPTS} textKey="text" valueKey="step" textPlaceholder="e.g. The PC's address is sent to memory" />;

/* ---------- BATCH 5 — more pick-list games ---------- */
const SCREEN_TIME_OPTS = ['healthy', 'balanced', 'unhealthy'];
const FOOTPRINT_OPTS = ['private', 'personal', 'public'];
const FOOTPRINT_LABELS: Record<string, string> = { private: 'Keep private', personal: 'Personal (close friends)', public: 'OK to be public' };
const SOCIAL_ENG_OPTS = ['phishing', 'pretexting', 'baiting', 'quid_pro_quo', 'tailgating', 'shoulder_surfing'];
const SOCIAL_ENG_LABELS: Record<string, string> = { phishing: 'Phishing', pretexting: 'Pretexting', baiting: 'Baiting', quid_pro_quo: 'Quid pro quo', tailgating: 'Tailgating', shoulder_surfing: 'Shoulder surfing' };
const CIPHER_OPTS = ['caesar', 'substitution', 'vigenere', 'transposition', 'aes'];
const CIPHER_LABELS: Record<string, string> = { caesar: 'Caesar shift', substitution: 'Substitution cipher', vigenere: 'Vigenère cipher', transposition: 'Transposition cipher', aes: 'AES (modern symmetric)' };
const NORMALISE_OPTS = ['breaks_1nf', 'breaks_2nf', 'breaks_3nf', 'normalised'];
const NORMALISE_LABELS: Record<string, string> = { breaks_1nf: 'Breaks 1NF (repeating groups)', breaks_2nf: 'Breaks 2NF (partial dependency)', breaks_3nf: 'Breaks 3NF (transitive dependency)', normalised: 'Already in 3NF' };
const SUBNET_OPTS = ['class_a', 'class_b', 'class_c', 'class_d', 'class_e', 'private', 'loopback'];
const SUBNET_LABELS: Record<string, string> = { class_a: 'Class A (public)', class_b: 'Class B (public)', class_c: 'Class C (public)', class_d: 'Class D (multicast)', class_e: 'Class E (reserved)', private: 'Private range', loopback: 'Loopback (127.x.x.x)' };

export const ScreenTimePupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.screenTime?.items || []} options={SCREEN_TIME_OPTS} hint="Rate each daily habit: healthy, balanced, or unhealthy." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} />;
export const ScreenTimeEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={SCREEN_TIME_OPTS} textKey="text" valueKey="rating" textPlaceholder="e.g. 6 hours of TikTok before bed every night" />;

export const FootprintTrailPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.footprintTrail?.items || []} options={FOOTPRINT_OPTS} hint="Decide what should stay private, personal, or be OK to make public." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={FOOTPRINT_LABELS} />;
export const FootprintTrailEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={FOOTPRINT_OPTS} textKey="text" valueKey="visibility" textPlaceholder="e.g. Your bank card PIN" labelMap={FOOTPRINT_LABELS} />;

export const SocialEngineerPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.socialEngineer?.items || []} options={SOCIAL_ENG_OPTS} hint="Match each scam scenario to the social-engineering technique it uses." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={SOCIAL_ENG_LABELS} />;
export const SocialEngineerEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={SOCIAL_ENG_OPTS} textKey="text" valueKey="kind" textPlaceholder="e.g. Email pretending to be from your bank" labelMap={SOCIAL_ENG_LABELS} />;

export const CipherQuestPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.cipherQuest?.items || []} options={CIPHER_OPTS} hint="Identify which cipher each description matches." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={CIPHER_LABELS} />;
export const CipherQuestEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={CIPHER_OPTS} textKey="text" valueKey="cipher" textPlaceholder="e.g. Each letter is shifted by a fixed amount" labelMap={CIPHER_LABELS} />;

export const NormaliseItPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.normaliseIt?.items || []} options={NORMALISE_OPTS} hint="Look at each table description and decide what (if anything) it breaks." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={NORMALISE_LABELS} />;
export const NormaliseItEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={NORMALISE_OPTS} textKey="text" valueKey="violation" textPlaceholder="e.g. Pupil(id, name, subject1, subject2, subject3)" labelMap={NORMALISE_LABELS} />;

export const SubnetCalcPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.subnetCalc?.items || []} options={SUBNET_OPTS} hint="Classify each IP address by its network class or special use." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={SUBNET_LABELS} />;
export const SubnetCalcEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={SUBNET_OPTS} textKey="text" valueKey="kind" textPlaceholder="e.g. 192.168.1.10" labelMap={SUBNET_LABELS} />;

/* ---------- BATCH 6 (final) — pick-list games ---------- */
const PHISH_INBOX_OPTS = ['legitimate', 'phishing', 'spam', 'scam'];
const PHISH_INBOX_LABELS: Record<string, string> = { legitimate: 'Legitimate', phishing: 'Phishing', spam: 'Spam', scam: 'Scam / fraud' };
const BUILD_PC_OPTS = ['cpu', 'gpu', 'ram', 'storage', 'psu', 'motherboard', 'cooling', 'case'];
const BUILD_PC_LABELS: Record<string, string> = { cpu: 'CPU (processor)', gpu: 'GPU (graphics card)', ram: 'RAM', storage: 'SSD / HDD', psu: 'PSU (power supply)', motherboard: 'Motherboard', cooling: 'Cooling fan / heatsink', case: 'Case / chassis' };
const OS_SCHED_OPTS = ['fcfs', 'sjf', 'round_robin', 'priority'];
const OS_SCHED_LABELS: Record<string, string> = { fcfs: 'First-come-first-served', sjf: 'Shortest-job-first', round_robin: 'Round-robin', priority: 'Priority scheduling' };
const QUERY_VISUAL_OPTS = ['select', 'project', 'join', 'filter', 'sort', 'group_by'];
const QUERY_VISUAL_LABELS: Record<string, string> = { select: 'SELECT (rows)', project: 'PROJECT (columns)', join: 'JOIN (combine tables)', filter: 'WHERE (filter rows)', sort: 'ORDER BY (sort)', group_by: 'GROUP BY (aggregate)' };
const SCHEMA_ARCH_OPTS = ['one_to_one', 'one_to_many', 'many_to_many'];
const SCHEMA_ARCH_LABELS: Record<string, string> = { one_to_one: 'One-to-one', one_to_many: 'One-to-many', many_to_many: 'Many-to-many' };
const TAG_SOUP_OPTS = ['unclosed', 'wrong_nesting', 'missing_attribute', 'self_close_misuse', 'wrong_tag'];
const TAG_SOUP_LABELS: Record<string, string> = { unclosed: 'Tag not closed', wrong_nesting: 'Tags wrongly nested', missing_attribute: 'Missing required attribute', self_close_misuse: 'Self-closing tag misused', wrong_tag: 'Wrong tag for the job' };
const SELECTOR_GOLF_OPTS = ['id', 'class', 'element', 'descendant', 'child', 'attribute'];
const SELECTOR_GOLF_LABELS: Record<string, string> = { id: 'ID selector (#id)', class: 'Class selector (.class)', element: 'Element selector (p, h1)', descendant: 'Descendant (a b)', child: 'Direct child (a > b)', attribute: 'Attribute ([type="x"])' };
const CSS_SLIDERS_OPTS = ['width', 'height', 'padding', 'margin', 'border', 'color', 'background', 'font_size'];
const CSS_SLIDERS_LABELS: Record<string, string> = { width: 'width', height: 'height', padding: 'padding', margin: 'margin', border: 'border', color: 'color (text)', background: 'background-color', font_size: 'font-size' };

export const PhishInboxPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.phishInbox?.items || []} options={PHISH_INBOX_OPTS} hint="Triage your inbox: is each email legitimate, phishing, spam, or a scam?" textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={PHISH_INBOX_LABELS} />;
export const PhishInboxEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={PHISH_INBOX_OPTS} textKey="text" valueKey="verdict" textPlaceholder='e.g. "Your parcel needs £1.99 — click here"' labelMap={PHISH_INBOX_LABELS} />;

export const BuildPcPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.buildPc?.items || []} options={BUILD_PC_OPTS} hint="Match each description to the PC component it describes." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={BUILD_PC_LABELS} />;
export const BuildPcEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={BUILD_PC_OPTS} textKey="text" valueKey="part" textPlaceholder="e.g. Volatile fast memory used while a program runs" labelMap={BUILD_PC_LABELS} />;

export const OsSchedPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.osSched?.items || []} options={OS_SCHED_OPTS} hint="Pick the scheduling algorithm that best fits each scenario." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={OS_SCHED_LABELS} />;
export const OsSchedEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={OS_SCHED_OPTS} textKey="text" valueKey="algo" textPlaceholder="e.g. Each process gets a fixed time-slice in turn" labelMap={OS_SCHED_LABELS} />;

export const QueryVisualPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.queryVisual?.items || []} options={QUERY_VISUAL_OPTS} hint="Identify the SQL operation each step performs." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={QUERY_VISUAL_LABELS} />;
export const QueryVisualEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={QUERY_VISUAL_OPTS} textKey="text" valueKey="op" textPlaceholder='e.g. Combine Pupils and Marks on pupilId' labelMap={QUERY_VISUAL_LABELS} />;

export const SchemaArchPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.schemaArch?.items || []} options={SCHEMA_ARCH_OPTS} hint="Decide the relationship type between each pair of entities." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={SCHEMA_ARCH_LABELS} />;
export const SchemaArchEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={SCHEMA_ARCH_OPTS} textKey="text" valueKey="rel" textPlaceholder="e.g. Pupils and Classes (a pupil is in many classes, a class has many pupils)" labelMap={SCHEMA_ARCH_LABELS} />;

export const TagSoupRepairPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.tagSoupRepair?.items || []} options={TAG_SOUP_OPTS} hint="Spot the HTML mistake in each snippet." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={TAG_SOUP_LABELS} />;
export const TagSoupRepairEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={TAG_SOUP_OPTS} textKey="text" valueKey="bug" textPlaceholder='e.g. <p>Hello <b>world</p></b>' labelMap={TAG_SOUP_LABELS} />;

export const SelectorGolfPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.selectorGolf?.items || []} options={SELECTOR_GOLF_OPTS} hint="Identify which kind of CSS selector is being used." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={SELECTOR_GOLF_LABELS} />;
export const SelectorGolfEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={SELECTOR_GOLF_OPTS} textKey="text" valueKey="kind" textPlaceholder='e.g. nav > li' labelMap={SELECTOR_GOLF_LABELS} />;

export const CssSlidersPupilUI = ({ config, cellAnswers, setCellAnswers }: any) =>
  <PickListPupilUI items={config?.cssSliders?.items || []} options={CSS_SLIDERS_OPTS} hint="Pick which CSS property would change to match each effect." textKey="text" cellAnswers={cellAnswers} setCellAnswers={setCellAnswers} labelMap={CSS_SLIDERS_LABELS} />;
export const CssSlidersEditor = ({ cfg, setCfg }: any) =>
  <PickListEditor cfg={cfg} setCfg={setCfg} options={CSS_SLIDERS_OPTS} textKey="text" valueKey="prop" textPlaceholder="e.g. Make the box twice as wide" labelMap={CSS_SLIDERS_LABELS} />;

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

  if (type === 'convert_relay') {
    const probs = generateConvertRelayProblems(cfg.convertRelay || {}, `cr-${questionId || ''}`);
    return (
      <div style={wrap}>
        {probs.map((p, i) => {
          const got = String(parsed[String(i)] || '').trim();
          const ok = _normCmp(got, p.expected);
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={tickCell(ok)}>{ok ? '✓' : '✗'}</span>
              <span><code>{p.prompt}</code> <span style={reviewMuted}>· {p.hint}</span></span>
              <span style={reviewMuted}>got <code>{got || '(blank)'}</code> · expected <code>{p.expected}</code></span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'url_anatomy') {
    const items: any[] = cfg.urlAnatomy?.items || [];
    return (
      <div style={wrap}>
        {items.map((it, i) => {
          const segs = parseUrlSegments(String(it?.url || '')) || [];
          const ans = (parsed[String(i)] && typeof parsed[String(i)] === 'object') ? parsed[String(i)] : {};
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <code style={{ fontSize: 12 }}>{String(it?.url || '')}</code>
              {segs.map((s, j) => s.label === null ? null : (
                <div key={j} style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginLeft: 12 }}>
                  <span style={tickCell(String(ans[String(j)] || '') === s.label)}>{String(ans[String(j)] || '') === s.label ? '✓' : '✗'}</span>
                  <code>{s.text}</code>
                  <span style={reviewMuted}>got <code>{String(ans[String(j)] || '(blank)')}</code> · expected <code>{s.label}</code></span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'truth_table') {
    const built = buildTruthRows(String(cfg.truthTable?.expression || ''));
    if (!built) return <span style={reviewMuted}>(invalid expression)</span>;
    return (
      <div style={wrap}>
        {built.rows.map((row, ri) => {
          const got = String(parsed[String(ri)] || '');
          const expectedStr = row.expected ? '1' : '0';
          const ok = got === expectedStr;
          return (
            <div key={ri} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={tickCell(ok)}>{ok ? '✓' : '✗'}</span>
              <code>{built.vars.map((v) => row.env[v] ? 1 : 0).join(' ')}</code>
              <span style={reviewMuted}>got <code>{got || '(blank)'}</code> · expected <code>{expectedStr}</code></span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'upstander') {
    const items: any[] = cfg.upstander?.items || [];
    const UPSTANDER_REVIEW_LABELS: Record<string, string> = {
      report: '🚨 Report it', support: '💬 Support them', block: '🚫 Block & ignore', ignore: '😶 Do nothing',
    };
    return (
      <div style={wrap}>
        {items.map((it: any, i: number) => {
          const got = String(parsed[String(i)] || '');
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, flex: 1 }}>{String(it?.scenario || '')}</span>
              <span style={{
                padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: got ? 'var(--cw-surface-soft)' : 'transparent',
                color: 'var(--cw-ink)',
              }}>{got ? UPSTANDER_REVIEW_LABELS[got] || got : <span style={reviewMuted}>(not answered)</span>}</span>
            </div>
          );
        })}
      </div>
    );
  }

  const PICK_LIST_META: Record<string, { itemsPath: string; expectedKey: string; labelKey: string }> = {
    field_type_sort: { itemsPath: 'fieldTypeSort', expectedKey: 'type', labelKey: 'value' },
    io_sort: { itemsPath: 'ioSort', expectedKey: 'category', labelKey: 'name' },
    html_match: { itemsPath: 'htmlMatch', expectedKey: 'tag', labelKey: 'description' },
    privacy_radar: { itemsPath: 'privacyRadar', expectedKey: 'risk', labelKey: 'text' },
    validation_rules: { itemsPath: 'validationRules', expectedKey: 'rule', labelKey: 'scenario' },
    friend_or_fake: { itemsPath: 'friendOrFake', expectedKey: 'verdict', labelKey: 'text' },
    dm_danger: { itemsPath: 'dmDanger', expectedKey: 'risk', labelKey: 'text' },
    malware_triage: { itemsPath: 'malwareTriage', expectedKey: 'kind', labelKey: 'text' },
    '2fa_escape': { itemsPath: 'twoFactorEscape', expectedKey: 'method', labelKey: 'text' },
    a11y_audit: { itemsPath: 'a11yAudit', expectedKey: 'issue', labelKey: 'text' },
    fetch_execute: { itemsPath: 'fetchExecute', expectedKey: 'step', labelKey: 'text' },
    screen_time: { itemsPath: 'screenTime', expectedKey: 'rating', labelKey: 'text' },
    footprint_trail: { itemsPath: 'footprintTrail', expectedKey: 'visibility', labelKey: 'text' },
    social_engineer: { itemsPath: 'socialEngineer', expectedKey: 'kind', labelKey: 'text' },
    cipher_quest: { itemsPath: 'cipherQuest', expectedKey: 'cipher', labelKey: 'text' },
    normalise_it: { itemsPath: 'normaliseIt', expectedKey: 'violation', labelKey: 'text' },
    subnet_calc: { itemsPath: 'subnetCalc', expectedKey: 'kind', labelKey: 'text' },
    phish_inbox: { itemsPath: 'phishInbox', expectedKey: 'verdict', labelKey: 'text' },
    build_pc: { itemsPath: 'buildPc', expectedKey: 'part', labelKey: 'text' },
    os_sched: { itemsPath: 'osSched', expectedKey: 'algo', labelKey: 'text' },
    upstander_noop: { itemsPath: 'upstander', expectedKey: '_none_', labelKey: 'scenario' },
    query_visual: { itemsPath: 'queryVisual', expectedKey: 'op', labelKey: 'text' },
    schema_arch: { itemsPath: 'schemaArch', expectedKey: 'rel', labelKey: 'text' },
    tag_soup_repair: { itemsPath: 'tagSoupRepair', expectedKey: 'bug', labelKey: 'text' },
    selector_golf: { itemsPath: 'selectorGolf', expectedKey: 'kind', labelKey: 'text' },
    css_sliders: { itemsPath: 'cssSliders', expectedKey: 'prop', labelKey: 'text' },
  };
  if (PICK_LIST_META[type]) {
    const meta = PICK_LIST_META[type];
    const items: any[] = cfg[meta.itemsPath]?.items || [];
    const expectedKey = meta.expectedKey;
    const labelOf = (it: any) => String(it?.[meta.labelKey] ?? it?.value ?? it?.name ?? '');
    return (
      <div style={wrap}>
        {items.map((it, i) => {
          const expected = String((it as any)?.[expectedKey] || '').toLowerCase();
          const got = String(parsed[String(i)] || '').toLowerCase();
          const ok = got === expected && !!expected;
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={tickCell(ok)}>{ok ? '✓' : '✗'}</span>
              <span style={{ flex: 1 }}>{labelOf(it)}</span>
              <span style={reviewMuted}>got <code>{got || '(blank)'}</code> · expected <code>{expected}</code></span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'password_forge') {
    const ruleIds: string[] = (cfg.passwordForge?.rules || []).filter((r: any) => PASSWORD_RULE_IDS.includes(r));
    const pw = String(parsed.password || '');
    const checks = checkPassword(pw, ruleIds);
    return (
      <div style={wrap}>
        <div style={{ fontSize: 13 }}>Password: <code>{pw || '(blank)'}</code></div>
        {checks.map((c) => (
          <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={tickCell(c.ok)}>{c.ok ? '✓' : '✗'}</span>
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'find_duplicate') {
    const items: any[] = cfg.findDuplicate?.items || [];
    return (
      <div style={wrap}>
        {items.map((it, i) => {
          const rows: string[][] = Array.isArray(it?.rows) ? it.rows : [];
          const dups = findDuplicateRows(rows);
          const got = String(parsed[String(i)] || '');
          const gotIdx = parseInt(got, 10);
          const ok = !isNaN(gotIdx) && dups.has(gotIdx);
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={tickCell(ok)}>{ok ? '✓' : '✗'}</span>
              <span>Table {i + 1}</span>
              <span style={reviewMuted}>got row <code>{got || '(blank)'}</code> · duplicates at <code>{Array.from(dups).sort((a, b) => a - b).join(', ')}</code></span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'bin_search') {
    const items: any[] = cfg.binSearch?.items || [];
    return (
      <div style={wrap}>
        {items.map((it, i) => {
          const list: number[] = Array.isArray(it?.list) ? it.list.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n)) : [];
          const target = Number(it?.target);
          const sim = list.length > 0 && Number.isFinite(target) ? simulateBinSearch(list, target) : null;
          const expected = sim ? sim.mids.join(',') : '';
          const got = String(parsed[String(i)] || '').split(/[,\s]+/).map((x) => x.trim()).filter(Boolean).join(',');
          const ok = got === expected;
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={tickCell(ok)}>{ok ? '✓' : '✗'}</span>
              <span>Target {target}</span>
              <span style={reviewMuted}>got <code>{got || '(blank)'}</code> · expected <code>{expected}</code></span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'box_model') {
    const items: any[] = cfg.boxModel?.items || [];
    return (
      <div style={wrap}>
        {items.map((it, i) => {
          const c = Number(it?.content) || 0, p = Number(it?.padding) || 0, b = Number(it?.border) || 0, mg = Number(it?.margin) || 0;
          const expected = c + 2 * (p + b + mg);
          const got = Number(parsed[String(i)]);
          const ok = Number.isFinite(got) && got === expected;
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={tickCell(ok)}>{ok ? '✓' : '✗'}</span>
              <span>c{c} p{p} b{b} m{mg}</span>
              <span style={reviewMuted}>got <code>{Number.isFinite(got) ? got : '(blank)'}</code> · expected <code>{expected}</code></span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'mindmap') {
    const central = cfg.mindmap?.central || 'Topic';
    let branches: MindmapBranch[] = [];
    try { branches = JSON.parse(parsed['mindmap_tree'] || '[]'); } catch {}
    if (!Array.isArray(branches)) branches = [];
    return (
      <div style={wrap}>
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>📍 {central}</div>
        {branches.length === 0
          ? <span style={reviewMuted}>(no branches added)</span>
          : branches.map((b, bi) => (
            <div key={bi} style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>↳ {b.label || <em style={reviewMuted}>(blank)</em>}</div>
              {(b.children || []).map((c, ci) => (
                <div key={ci} style={{ marginLeft: 20, fontSize: 12, color: 'var(--cw-muted)' }}>· {c.label || <em>(blank)</em>}</div>
              ))}
            </div>
          ))
        }
      </div>
    );
  }

  return <span style={reviewMuted}>(no review for this game type)</span>;
}

// ─── Mindmap types ────────────────────────────────────────────────────────────

interface MindmapBranch {
  id: string;
  label: string;
  children: { id: string; label: string }[];
}

// ─── Mindmap live SVG visual ──────────────────────────────────────────────────

const BRANCH_COLORS = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

// Word-wrap into lines no longer than maxChars, splitting on word boundaries.
function wrapLabel(text: string, maxChars: number): string[] {
  const t = (text || '').trim() || '—';
  if (t.length <= maxChars) return [t];
  const words = t.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) { cur = w; continue; }
    if ((cur + ' ' + w).length <= maxChars) { cur += ' ' + w; }
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [t];
}

// Pill dimensions: width capped at maxW (grows taller if text wraps).
// charW ≈ fontSize × 0.60 for system-ui.
function pillSize(lines: string[], fontSize: number, padX: number, padY: number, maxW: number) {
  const longestChars = Math.max(...lines.map(l => l.length));
  const w = Math.min(maxW, Math.ceil(longestChars * fontSize * 0.60) + padX * 2);
  const lineH = fontSize + 7;
  const h = lines.length * lineH + padY * 2;
  return { w, h, lineH };
}

// Multi-line centred SVG text block.
// SVG text y = baseline, so we add ~0.36 × fontSize to reach the optical centre
// of capital letters (cap-height ≈ 72% of fontSize → centre ≈ 0.36 × fontSize above baseline).
function MindmapText({ nx, ny, lines, fontSize, fill, fontWeight, lineH }: {
  nx: number; ny: number; lines: string[]; fontSize: number;
  fill: string; fontWeight: string; lineH: number;
}) {
  const capCorrection = fontSize * 0.36;
  const topY = ny + capCorrection - ((lines.length - 1) * lineH) / 2;
  return (
    <text textAnchor="middle" fontFamily="system-ui,sans-serif"
      fontWeight={fontWeight} fontSize={fontSize} fill={fill}>
      {lines.map((line, li) => (
        <tspan key={li} x={nx} y={topY + li * lineH}>{line}</tspan>
      ))}
    </text>
  );
}

// Smooth S-curve elbow connector.
function elbow(x1: number, y1: number, x2: number, y2: number) {
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY} ${x2} ${midY} ${x2} ${y2}`;
}

function MindmapSvg({ central, branches }: { central: string; branches: MindmapBranch[] }) {
  // ── Font sizes ─────────────────────────────────────────
  const FC = 17, FB = 16, FS = 14;
  // ── Max pill widths ────────────────────────────────────
  const MW_C = 220, MW_B = 200, MW_S = 180;
  // ── Padding inside each pill ───────────────────────────
  const PX_C = 26, PY_C = 13;
  const PX_B = 22, PY_B = 11;
  const PX_S = 18, PY_S = 9;
  // ── Max chars per line (derived from max width & font) ─
  const MC_C = Math.floor((MW_C - PX_C * 2) / (FC * 0.60)); // ≈16
  const MC_B = Math.floor((MW_B - PX_B * 2) / (FB * 0.60)); // ≈16
  const MC_S = Math.floor((MW_S - PX_S * 2) / (FS * 0.60)); // ≈17

  const n = branches.length;
  // Radii: keep adjacent branch arcs ≥ 150 px apart
  const R1 = n <= 1 ? 155 : Math.max(155, Math.ceil(23 * n));
  const R2 = 135;
  const FAN = (27 * Math.PI) / 180;

  // ── Pre-compute all node positions & sizes (centre = 0,0) ──
  const centralLines = wrapLabel(central || 'Central Topic', MC_C);
  const { w: CW, h: CH, lineH: CLH } = pillSize(centralLines, FC, PX_C, PY_C, MW_C);

  interface SNode { sx: number; sy: number; lines: string[]; w: number; h: number; lineH: number }
  interface BNode {
    x: number; y: number; angle: number; color: string; branch: MindmapBranch;
    lines: string[]; w: number; h: number; lineH: number; subs: SNode[];
  }

  const bpos: BNode[] = branches.map((b, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const bLines = wrapLabel(b.label, MC_B);
    const { w, h, lineH } = pillSize(bLines, FB, PX_B, PY_B, MW_B);
    const bx = R1 * Math.cos(angle), by = R1 * Math.sin(angle);
    const m = b.children.length;
    const subs: SNode[] = b.children.map((child, ci) => {
      const subAngle = angle + (ci - (m - 1) / 2) * FAN;
      const sx = (R1 + R2) * Math.cos(subAngle);
      const sy = (R1 + R2) * Math.sin(subAngle);
      const sLines = wrapLabel(child.label, MC_S);
      const { w: sw, h: sh, lineH: slh } = pillSize(sLines, FS, PX_S, PY_S, MW_S);
      return { sx, sy, lines: sLines, w: sw, h: sh, lineH: slh };
    });
    return {
      x: bx, y: by, angle,
      color: BRANCH_COLORS[i % BRANCH_COLORS.length],
      branch: b, lines: bLines, w, h, lineH, subs,
    };
  });

  // ── Dynamic viewBox: bounding box of all nodes + padding ──
  const PAD = 28;
  let minX = -CW / 2, maxX = CW / 2, minY = -CH / 2, maxY = CH / 2;
  for (const bp of bpos) {
    minX = Math.min(minX, bp.x - bp.w / 2);
    maxX = Math.max(maxX, bp.x + bp.w / 2);
    minY = Math.min(minY, bp.y - bp.h / 2);
    maxY = Math.max(maxY, bp.y + bp.h / 2);
    for (const s of bp.subs) {
      minX = Math.min(minX, s.sx - s.w / 2);
      maxX = Math.max(maxX, s.sx + s.w / 2);
      minY = Math.min(minY, s.sy - s.h / 2);
      maxY = Math.max(maxY, s.sy + s.h / 2);
    }
  }
  // Enforce a minimum canvas size so the diagram never blows up when nearly empty.
  const MIN_VW = 700, MIN_VH = 460;
  const rawVw = maxX - minX + PAD * 2, rawVh = maxY - minY + PAD * 2;
  const vw = Math.max(MIN_VW, rawVw), vh = Math.max(MIN_VH, rawVh);
  // Re-centre if the content is smaller than the minimum canvas.
  const extraX = (vw - rawVw) / 2, extraY = (vh - rawVh) / 2;
  const vx = minX - PAD - extraX, vy = minY - PAD - extraY;

  return (
    <svg
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      style={{ width: '100%', maxHeight: 540, borderRadius: 10,
        background: '#fff', border: '1.5px solid var(--cw-border, #e2e8f0)' }}
    >
      {/* Connectors: centre → branch */}
      {bpos.map((bp, bi) => (
        <path key={`cl-${bi}`} d={elbow(0, 0, bp.x, bp.y)}
          fill="none" stroke={bp.color} strokeWidth={2.5} strokeLinecap="round" opacity={0.5} />
      ))}

      {/* Connectors: branch → sub-branch */}
      {bpos.map((bp, bi) =>
        bp.subs.map((s, ci) => (
          <path key={`sl-${bi}-${ci}`} d={elbow(bp.x, bp.y, s.sx, s.sy)}
            fill="none" stroke={bp.color} strokeWidth={1.8} strokeLinecap="round" opacity={0.35} />
        ))
      )}

      {/* Sub-branch pills */}
      {bpos.map((bp, bi) =>
        bp.subs.map((s, ci) => (
          <g key={`sn-${bi}-${ci}`}>
            <rect x={s.sx - s.w / 2} y={s.sy - s.h / 2} width={s.w} height={s.h} rx={s.h / 2}
              fill={bp.color} fillOpacity={0.25} stroke={bp.color} strokeWidth={1.5} strokeOpacity={0.7} />
            <MindmapText nx={s.sx} ny={s.sy} lines={s.lines} fontSize={FS}
              fill={bp.color} fontWeight="600" lineH={s.lineH} />
          </g>
        ))
      )}

      {/* Branch pills */}
      {bpos.map((bp, bi) => (
        <g key={`bn-${bi}`}>
          <rect x={bp.x - bp.w / 2} y={bp.y - bp.h / 2} width={bp.w} height={bp.h} rx={bp.h / 2}
            fill={bp.color} />
          <MindmapText nx={bp.x} ny={bp.y} lines={bp.lines} fontSize={FB}
            fill="#fff" fontWeight="700" lineH={bp.lineH} />
        </g>
      ))}

      {/* Central pill */}
      <rect x={-CW / 2} y={-CH / 2} width={CW} height={CH} rx={CH / 2} fill="#1e293b" />
      <MindmapText nx={0} ny={0} lines={centralLines} fontSize={FC}
        fill="#fff" fontWeight="700" lineH={CLH} />

      {/* Empty-state hint */}
      {n === 0 && (
        <text x={0} y={CH / 2 + 32} textAnchor="middle" fontSize={FS}
          fill="#94a3b8" fontFamily="system-ui,sans-serif">
          Use the editor below to add branches
        </text>
      )}
    </svg>
  );
}

// ─── MindmapPupilUI ───────────────────────────────────────────────────────────

export function MindmapPupilUI({ config, cellAnswers, setCellAnswers }: {
  config: any; cellAnswers: Record<string, any>; setCellAnswers: (v: Record<string, any>) => void;
}) {
  const central = (config as any)?.mindmap?.central || 'Central Topic';

  function getTree(): MindmapBranch[] {
    try {
      const t = JSON.parse(cellAnswers['mindmap_tree'] || '[]');
      return Array.isArray(t) ? t : [];
    } catch { return []; }
  }

  function setTree(next: MindmapBranch[]) {
    setCellAnswers({ ...cellAnswers, mindmap_tree: JSON.stringify(next) });
  }

  const tree = getTree();

  function addBranch() {
    setTree([...tree, { id: `b${Date.now()}`, label: '', children: [] }]);
  }
  function removeBranch(bi: number) {
    setTree(tree.filter((_, i) => i !== bi));
  }
  function updateBranch(bi: number, label: string) {
    setTree(tree.map((b, i) => i === bi ? { ...b, label } : b));
  }
  function addChild(bi: number) {
    setTree(tree.map((b, i) => i === bi ? { ...b, children: [...b.children, { id: `b${bi}c${Date.now()}`, label: '' }] } : b));
  }
  function removeChild(bi: number, ci: number) {
    setTree(tree.map((b, i) => i === bi ? { ...b, children: b.children.filter((_, j) => j !== ci) } : b));
  }
  function updateChild(bi: number, ci: number, label: string) {
    setTree(tree.map((b, i) => i === bi ? { ...b, children: b.children.map((c, j) => j === ci ? { ...c, label } : c) } : b));
  }

  const inp: React.CSSProperties = {
    flex: 1, padding: '4px 8px', fontSize: 13,
    border: '1px solid var(--cw-border, #e2e8f0)', borderRadius: 6,
    background: 'var(--cw-bg, #fff)', color: 'var(--cw-text, #111)',
  };
  const btn: React.CSSProperties = {
    padding: '3px 10px', fontSize: 12, borderRadius: 5, cursor: 'pointer',
    border: '1px solid var(--cw-border, #e2e8f0)',
    background: 'var(--cw-surface, #f8fafc)', color: 'var(--cw-text, #111)',
  };
  const rmBtn: React.CSSProperties = { ...btn, color: '#b91c1c', borderColor: '#fca5a5' };

  return (
    <div style={{ marginTop: 8 }}>
      {/* ── Live visual mindmap ── */}
      <MindmapSvg central={central} branches={tree} />

      {/* ── Edit panel ── */}
      <div style={{ marginTop: 12 }}>
        {tree.map((branch, bi) => (
          <div key={branch.id} style={{
            borderLeft: `4px solid ${BRANCH_COLORS[bi % BRANCH_COLORS.length]}`,
            paddingLeft: 10, marginBottom: 10,
            background: 'var(--cw-surface, #fff)',
            borderRadius: '0 6px 6px 0',
            padding: '8px 10px 8px 10px',
            border: '1px solid var(--cw-border, #e2e8f0)',
            borderLeftWidth: 4,
            borderLeftColor: BRANCH_COLORS[bi % BRANCH_COLORS.length],
          }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <span style={{
                width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                background: BRANCH_COLORS[bi % BRANCH_COLORS.length],
                display: 'inline-block',
              }} />
              <input
                style={inp}
                value={branch.label}
                onChange={(e) => updateBranch(bi, e.target.value)}
                placeholder="Branch label…"
                autoFocus={branch.label === ''}
              />
              <button style={rmBtn} onClick={() => removeBranch(bi)}>✕</button>
            </div>
            {branch.children.map((child, ci) => (
              <div key={child.id} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, marginLeft: 18 }}>
                <span style={{ fontSize: 11, color: 'var(--cw-muted)', flexShrink: 0 }}>└</span>
                <input
                  style={{ ...inp, fontSize: 12 }}
                  value={child.label}
                  onChange={(e) => updateChild(bi, ci, e.target.value)}
                  placeholder="Sub-branch…"
                />
                <button style={rmBtn} onClick={() => removeChild(bi, ci)}>✕</button>
              </div>
            ))}
            <button style={{ ...btn, marginLeft: 18, marginTop: 4, fontSize: 11 }} onClick={() => addChild(bi)}>
              + Sub-branch
            </button>
          </div>
        ))}
        <button style={{ ...btn, padding: '6px 14px', marginTop: 4 }} onClick={addBranch}>
          + Add branch
        </button>
      </div>
    </div>
  );
}

// ─── MindmapEditor ────────────────────────────────────────────────────────────

export function MindmapEditor({ cfg, setCfg }: { cfg: any; setCfg: (c: any) => void }) {
  const label: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--cw-muted)' };
  const inp: React.CSSProperties = {
    padding: '5px 8px', fontSize: 13, borderRadius: 6,
    border: '1px solid var(--cw-border, #e2e8f0)',
    background: 'var(--cw-bg, #fff)', color: 'var(--cw-text, #111)',
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={label}>
        <span style={lbl}>Central topic <span style={{ color: '#b91c1c' }}>*</span></span>
        <input
          style={inp}
          value={cfg.central || ''}
          onChange={(e) => setCfg({ ...cfg, central: e.target.value })}
          placeholder="e.g. Computer Systems"
        />
      </div>
      <div style={label}>
        <span style={lbl}>Expected branches (guidance for AI marking)</span>
        <input
          style={inp}
          value={cfg.expectedBranches || ''}
          onChange={(e) => setCfg({ ...cfg, expectedBranches: e.target.value })}
          placeholder="e.g. CPU, Memory, Storage, Input/Output"
        />
        <span style={{ fontSize: 11, color: 'var(--cw-muted)' }}>Comma-separated list of branches you expect pupils to include.</span>
      </div>
      <div style={label}>
        <span style={lbl}>Marking guidance (optional)</span>
        <textarea
          style={{ ...inp, resize: 'vertical', minHeight: 60 }}
          value={cfg.guidance || ''}
          onChange={(e) => setCfg({ ...cfg, guidance: e.target.value })}
          placeholder="e.g. Award marks for each correct branch and for relevant sub-branches. Do not penalise unusual but valid answers."
        />
      </div>
    </div>
  );
}
