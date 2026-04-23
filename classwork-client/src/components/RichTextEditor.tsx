import { useEffect, useRef, useState } from 'react';
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
// pupils bold/italic/lists/headings/images without pulling in a 100kB editor
// lib. The output is sanitised both before it leaves the editor (onChange)
// and when it's rendered elsewhere, so we never trust the raw HTML.
export default function RichTextEditor({
  value, onChange, placeholder, minHeight = 320, autoFocus, ariaLabel,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const lastValueRef = useRef<string>('');
  const selectedImgRef = useRef<HTMLImageElement | null>(null);
  const [hasSelectedImg, setHasSelectedImg] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  // Push value into the editor only when it differs from what we last wrote
  // ourselves, so we don't fight the user's caret on every keystroke.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const incoming = looksLikeHtml(value) ? value : plainTextToHtml(value);
    if (incoming !== lastValueRef.current) {
      el.innerHTML = incoming;
      lastValueRef.current = incoming;
      selectedImgRef.current = null;
      setHasSelectedImg(false);
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
    // Strip the transient "selected image" outline before saving — it's only
    // a visual hint inside the editor.
    el.querySelectorAll('img.cw-img-selected').forEach((img) => img.classList.remove('cw-img-selected'));
    if (selectedImgRef.current) selectedImgRef.current.classList.add('cw-img-selected');
    const cleaned = sanitizeHtml(el.innerHTML);
    lastValueRef.current = cleaned;
    onChange(cleaned);
  }

  function addLink() {
    const url = window.prompt('Link to which URL?', 'https://');
    if (!url) return;
    exec('createLink', url);
  }

  async function uploadAndInsertImage(file: File) {
    setUploadErr(null);
    if (!file.type.startsWith('image/')) {
      setUploadErr('That clipboard item isn\u2019t an image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadErr('Image is too big (max 10 MB).');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file, file.name || 'pasted-image.png');
      const r = await fetch('/api/upload-student-file', { method: 'POST', body: fd });
      if (!r.ok) {
        const msg = await r.json().catch(() => ({}));
        throw new Error(msg.message || 'Upload failed');
      }
      const { url } = await r.json();
      ref.current?.focus();
      // Insert as a centered image by default — pupils can re-align with the
      // toolbar after clicking it.
      const html = `<img src="${url}" alt="" class="cw-img-center">`;
      try { document.execCommand('insertHTML', false, html); } catch { /* ignore */ }
      handleInput();
    } catch (e: any) {
      setUploadErr(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function selectImage(img: HTMLImageElement | null) {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll('img.cw-img-selected').forEach((i) => i.classList.remove('cw-img-selected'));
    selectedImgRef.current = img;
    if (img) img.classList.add('cw-img-selected');
    setHasSelectedImg(!!img);
  }

  function alignImage(align: 'left' | 'center' | 'right') {
    const img = selectedImgRef.current;
    if (!img) return;
    img.classList.remove('cw-img-left', 'cw-img-center', 'cw-img-right');
    img.classList.add('cw-img-' + align);
    handleInput();
  }
  function removeImage() {
    const img = selectedImgRef.current;
    if (!img) return;
    img.remove();
    selectImage(null);
    handleInput();
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

      {/* Image alignment row — only enabled when a pasted image is selected. */}
      <div style={imgBar} role="toolbar" aria-label="Image">
        <span style={{ fontSize: 12, color: 'var(--cw-muted)', marginRight: 4 }}>
          {hasSelectedImg ? 'Image selected — align it:' : 'Paste an image, then click it to align:'}
        </span>
        <ToolBtn onClick={() => alignImage('left')} title="Align image left (text wraps right)" disabled={!hasSelectedImg}>Left</ToolBtn>
        <ToolBtn onClick={() => alignImage('center')} title="Centre image" disabled={!hasSelectedImg}>Centre</ToolBtn>
        <ToolBtn onClick={() => alignImage('right')} title="Align image right (text wraps left)" disabled={!hasSelectedImg}>Right</ToolBtn>
        <ToolBtn onClick={removeImage} title="Remove this image" disabled={!hasSelectedImg}>Remove</ToolBtn>
        {uploading && <span style={{ fontSize: 12, color: 'var(--cw-muted)', marginLeft: 'auto' }}>Uploading image…</span>}
        {uploadErr && <span style={{ fontSize: 12, color: 'var(--cw-danger)', marginLeft: 'auto' }}>{uploadErr}</span>}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (t && t.tagName === 'IMG') selectImage(t as HTMLImageElement);
          else selectImage(null);
        }}
        onPaste={(e) => {
          // Pull any image off the clipboard first; otherwise fall back to
          // a plain-text paste so kids don't accidentally import giant blobs
          // of styled HTML from Word/Google Docs.
          const items = Array.from(e.clipboardData.items || []);
          const imgItem = items.find((it) => it.kind === 'file' && it.type.startsWith('image/'));
          if (imgItem) {
            e.preventDefault();
            const file = imgItem.getAsFile();
            if (file) void uploadAndInsertImage(file);
            return;
          }
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
        .cw-rte img { max-width: 100%; height: auto; cursor: pointer; border-radius: 4px; }
        .cw-rte img.cw-img-left   { float: left;  margin: 4px 12px 4px 0; max-width: 50%; }
        .cw-rte img.cw-img-right  { float: right; margin: 4px 0 4px 12px; max-width: 50%; }
        .cw-rte img.cw-img-center { display: block; margin: 8px auto; max-width: 100%; clear: both; }
        .cw-rte img.cw-img-selected { outline: 2px solid var(--cw-accent); outline-offset: 2px; }
        .cw-rte::after { content: ''; display: block; clear: both; }
      `}</style>
    </div>
  );
}

function ToolBtn({ children, onClick, title, disabled }: { children: React.ReactNode; onClick: () => void; title: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault() /* keep selection in the editor */}
      title={title}
      disabled={disabled}
      style={{ ...btn, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
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
const imgBar: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 4, padding: '4px 6px', alignItems: 'center',
  borderBottom: '1px solid var(--cw-border)', background: '#fff',
};
const btn: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--cw-border)', borderRadius: 6,
  padding: '4px 8px', fontSize: 13, color: 'var(--cw-ink)',
  minWidth: 28,
};
const editor: React.CSSProperties = {
  padding: 12, fontFamily: 'inherit', fontSize: 15, lineHeight: 1.6,
  color: 'var(--cw-ink)', wordBreak: 'break-word',
};
