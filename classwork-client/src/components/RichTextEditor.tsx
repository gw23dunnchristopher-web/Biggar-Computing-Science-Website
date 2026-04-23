import { useEffect, useRef } from 'react';
import { sanitizeHtml, plainTextToHtml, looksLikeHtml } from '@/lib/sanitizeHtml';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  autoFocus?: boolean;
  ariaLabel?: string;
}

// Lightweight rich text editor built on a contentEditable div with a small
// toolbar. Uses document.execCommand: it's officially deprecated but still
// implemented in every browser we care about and is the simplest way to give
// pupils bold/italic/lists/headings without pulling in a 100kB editor lib.
// The output is sanitised both before it leaves the editor (onChange) and
// when it's rendered elsewhere, so we never trust the raw HTML.
export default function RichTextEditor({
  value, onChange, placeholder, minHeight = 320, autoFocus, ariaLabel,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const lastValueRef = useRef<string>('');

  // Push value into the editor only when it differs from what we last wrote
  // ourselves, so we don't fight the user's caret on every keystroke.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const incoming = looksLikeHtml(value) ? value : plainTextToHtml(value);
    if (incoming !== lastValueRef.current) {
      el.innerHTML = incoming;
      lastValueRef.current = incoming;
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  function exec(cmd: string, arg?: string) {
    ref.current?.focus();
    try { document.execCommand(cmd, false, arg); } catch { /* ignore */ }
    handleInput();
  }

  function handleInput() {
    const el = ref.current;
    if (!el) return;
    const cleaned = sanitizeHtml(el.innerHTML);
    lastValueRef.current = cleaned;
    onChange(cleaned);
  }

  function addLink() {
    const url = window.prompt('Link to which URL?', 'https://');
    if (!url) return;
    exec('createLink', url);
  }

  return (
    <div style={wrap}>
      <div style={toolbar} role="toolbar" aria-label="Formatting">
        <ToolBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)"><b>B</b></ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)"><i>I</i></ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)"><u>U</u></ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec('formatBlock', '<h2>')} title="Big heading">H1</ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<h3>')} title="Medium heading">H2</ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<h4>')} title="Small heading">H3</ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<p>')} title="Plain paragraph">P</ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bulleted list">&bull; List</ToolBtn>
        <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered list">1. List</ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<blockquote>')} title="Quote block">&ldquo; &rdquo;</ToolBtn>
        <Sep />
        <ToolBtn onClick={addLink} title="Insert link">Link</ToolBtn>
        <ToolBtn onClick={() => exec('removeFormat')} title="Clear formatting">Clear</ToolBtn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        onPaste={(e) => {
          // Strip formatting from pasted content so kids don't accidentally
          // import giant blobs of styled HTML from Word/Google Docs.
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
        }}
        aria-label={ariaLabel || 'Notes editor'}
        data-placeholder={placeholder || ''}
        style={{ ...editor, minHeight }}
        className="cw-rte"
      />
      <style>{`
        .cw-rte:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        .cw-rte:focus { outline: 2px solid var(--cw-accent); outline-offset: -2px; }
        .cw-rte h2 { font-size: 22px; margin: 12px 0 6px; }
        .cw-rte h3 { font-size: 18px; margin: 10px 0 6px; }
        .cw-rte h4 { font-size: 16px; margin: 10px 0 6px; }
        .cw-rte p  { margin: 6px 0; }
        .cw-rte ul, .cw-rte ol { padding-left: 24px; margin: 6px 0; }
        .cw-rte blockquote { margin: 8px 0; padding: 4px 12px; border-left: 3px solid #cbd5e1; color: #475569; }
        .cw-rte a { color: var(--cw-accent); text-decoration: underline; }
      `}</style>
    </div>
  );
}

function ToolBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault() /* keep selection in the editor */}
      title={title}
      style={btn}
    >{children}</button>
  );
}
function Sep() { return <span style={{ width: 1, alignSelf: 'stretch', background: '#e2e8f0', margin: '0 2px' }} />; }

const wrap: React.CSSProperties = {
  border: '1px solid var(--cw-border)', borderRadius: 8, overflow: 'hidden', background: '#fff',
};
const toolbar: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 4, padding: 6, alignItems: 'center',
  borderBottom: '1px solid var(--cw-border)', background: '#f8fafc',
};
const btn: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--cw-border)', borderRadius: 6,
  padding: '4px 8px', fontSize: 13, cursor: 'pointer', color: 'var(--cw-ink)',
  minWidth: 28,
};
const editor: React.CSSProperties = {
  padding: 12, fontFamily: 'inherit', fontSize: 15, lineHeight: 1.6,
  color: 'var(--cw-ink)', wordBreak: 'break-word',
};
