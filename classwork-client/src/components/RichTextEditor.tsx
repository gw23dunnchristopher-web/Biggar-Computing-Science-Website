import { useEffect, useRef, useState } from 'react';
import { sanitizeHtml, plainTextToHtml, looksLikeHtml } from '@/lib/sanitizeHtml';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  autoFocus?: boolean;
  ariaLabel?: string;
  // When true the editor stretches to fill its flex parent's remaining
  // height (toolbar pinned, editable area scrolls internally). Used inside
  // modals so the writing surface gets as tall as the viewport allows.
  fillHeight?: boolean;
}

// Lightweight rich text editor built on a contentEditable div with a small
// toolbar. Uses document.execCommand: it's officially deprecated but still
// implemented in every browser we care about and is the simplest way to give
// pupils bold/italic/lists/headings/images without pulling in a 100kB editor
// lib. The output is sanitised both before it leaves the editor (onChange)
// and when it's rendered elsewhere, so we never trust the raw HTML.
export default function RichTextEditor({
  value, onChange, placeholder, minHeight = 320, autoFocus, ariaLabel, fillHeight,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const lastValueRef = useRef<string>('');
  const selectedImgRef = useRef<HTMLImageElement | null>(null);
  const [hasSelectedImg, setHasSelectedImg] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [inTableCell, setInTableCell] = useState(false);
  // Custom right-click menu shown over the editor. Coords are in viewport
  // (clientX/clientY) because the menu is rendered with position: fixed.
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [ctxMsg, setCtxMsg] = useState<string | null>(null);

  // Track whether the caret is inside a table cell so the table-edit buttons
  // (add row, delete column, etc.) only light up when they make sense.
  useEffect(() => {
    function onSelChange() {
      const sel = window.getSelection();
      const root = ref.current;
      if (!sel || !sel.anchorNode || !root) { setInTableCell(false); return; }
      let node: Node | null = sel.anchorNode;
      let inside = false;
      while (node && node !== root) {
        if (node.nodeType === 1) {
          const tag = (node as Element).tagName;
          if (tag === 'TD' || tag === 'TH') { inside = true; break; }
        }
        node = node.parentNode;
      }
      setInTableCell(inside && root.contains(sel.anchorNode));
    }
    document.addEventListener('selectionchange', onSelChange);
    return () => document.removeEventListener('selectionchange', onSelChange);
  }, []);

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

  // Tell browsers to emit inline `style` attributes (e.g.
  // `<span style="color: red">`) instead of the deprecated `<font>` tag.
  // Means colour, highlight and indent commands round-trip cleanly through
  // our sanitiser. Re-applied on every focus because some browsers reset it.
  function ensureStyleWithCSS() {
    try { document.execCommand('styleWithCSS', false, true as any); } catch { /* ignore */ }
  }

  function setColor(color: string) { ensureStyleWithCSS(); exec('foreColor', color); }
  function setHighlight(color: string) {
    ensureStyleWithCSS();
    // Chrome / Firefox use hiliteColor; Safari and older IE use backColor.
    // Try both — execCommand silently ignores the one it doesn't support.
    try { document.execCommand('hiliteColor', false, color); } catch { /* ignore */ }
    try { document.execCommand('backColor', false, color); } catch { /* ignore */ }
    handleInput();
  }
  function clearHighlight() { setHighlight('transparent'); }

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

  // Unified alignment: when an image is selected the L/C/R buttons re-align
  // the image; otherwise they align the current paragraph. This lets one set
  // of buttons cover both cases so we don't need a second toolbar row just
  // for image alignment.
  function smartAlign(dir: 'left' | 'center' | 'right') {
    if (hasSelectedImg) alignImage(dir);
    else exec('justify' + dir.charAt(0).toUpperCase() + dir.slice(1));
  }
  /* ---- Table helpers ---- */

  function currentCell(): HTMLTableCellElement | null {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !ref.current) return null;
    let node: Node | null = sel.anchorNode;
    while (node && node !== ref.current) {
      if (node.nodeType === 1) {
        const tag = (node as Element).tagName;
        if (tag === 'TD' || tag === 'TH') return node as HTMLTableCellElement;
      }
      node = node.parentNode;
    }
    return null;
  }

  function insertTable() {
    const rowsStr = window.prompt('How many rows? (1\u201320)', '3');
    if (!rowsStr) return;
    const colsStr = window.prompt('How many columns? (1\u201310)', '3');
    if (!colsStr) return;
    const rows = Math.max(1, Math.min(20, parseInt(rowsStr, 10) || 0));
    const cols = Math.max(1, Math.min(10, parseInt(colsStr, 10) || 0));
    if (!rows || !cols) return;
    let html = '<table class="cw-table"><thead><tr>';
    for (let c = 0; c < cols; c++) html += '<th>Heading</th>';
    html += '</tr></thead><tbody>';
    for (let r = 0; r < rows - 1; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) html += '<td>&nbsp;</td>';
      html += '</tr>';
    }
    html += '</tbody></table><p><br></p>';
    ref.current?.focus();
    try { document.execCommand('insertHTML', false, html); } catch { /* ignore */ }
    handleInput();
  }

  function addRowBelow() {
    const cell = currentCell();
    const row = cell?.parentElement as HTMLTableRowElement | null;
    const table = row?.closest('table');
    if (!cell || !row || !table) return;
    const colCount = Array.from(row.cells).reduce((n, c) => n + (c.colSpan || 1), 0);
    const newRow = document.createElement('tr');
    for (let i = 0; i < colCount; i++) {
      const td = document.createElement('td');
      td.innerHTML = '&nbsp;';
      newRow.appendChild(td);
    }
    row.parentNode?.insertBefore(newRow, row.nextSibling);
    handleInput();
  }
  function addColRight() {
    const cell = currentCell();
    const table = cell?.closest('table');
    if (!cell || !table) return;
    const cellIndex = cell.cellIndex;
    Array.from(table.rows).forEach((r) => {
      const reference = r.cells[cellIndex];
      const isHeader = reference?.tagName === 'TH';
      const fresh = document.createElement(isHeader ? 'th' : 'td');
      fresh.innerHTML = isHeader ? 'Heading' : '&nbsp;';
      r.insertBefore(fresh, reference?.nextSibling || null);
    });
    handleInput();
  }
  function deleteRow() {
    const cell = currentCell();
    const row = cell?.parentElement as HTMLTableRowElement | null;
    const table = row?.closest('table');
    if (!cell || !row || !table) return;
    if (table.rows.length <= 1) { deleteTable(); return; }
    row.remove();
    handleInput();
  }
  function deleteCol() {
    const cell = currentCell();
    const table = cell?.closest('table');
    if (!cell || !table) return;
    const cellIndex = cell.cellIndex;
    const firstRow = table.rows[0];
    if (firstRow && firstRow.cells.length <= 1) { deleteTable(); return; }
    Array.from(table.rows).forEach((r) => { r.cells[cellIndex]?.remove(); });
    handleInput();
  }
  function deleteTable() {
    const cell = currentCell();
    const table = cell?.closest('table');
    if (!table) return;
    table.remove();
    handleInput();
  }

  function removeImage() {
    const img = selectedImgRef.current;
    if (!img) return;
    img.remove();
    selectImage(null);
    handleInput();
  }

  /* ---- Right-click context menu helpers ---- */

  // Open the friendly Cut/Copy/Paste menu at the click location instead of
  // the browser's default menu. Pupils who don't use keyboard shortcuts can
  // do all three from a single right-click.
  function openContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setCtxMsg(null);
    // Keep the menu inside the viewport even when the click is near the edge.
    const menuW = 180, menuH = 130;
    const x = Math.min(e.clientX, window.innerWidth - menuW - 8);
    const y = Math.min(e.clientY, window.innerHeight - menuH - 8);
    setCtxMenu({ x, y });
  }
  function closeContextMenu() { setCtxMenu(null); setCtxMsg(null); }

  function ctxCut() {
    ref.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { setCtxMsg('Select some text first.'); return; }
    try {
      const ok = document.execCommand('cut');
      if (!ok) { setCtxMsg('Your browser blocked Cut. Use Ctrl+X instead.'); return; }
    } catch { setCtxMsg('Cut isn\u2019t available here. Use Ctrl+X instead.'); return; }
    handleInput();
    closeContextMenu();
  }
  function ctxCopy() {
    ref.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { setCtxMsg('Select some text first.'); return; }
    try {
      const ok = document.execCommand('copy');
      if (!ok) { setCtxMsg('Your browser blocked Copy. Use Ctrl+C instead.'); return; }
    } catch { setCtxMsg('Copy isn\u2019t available here. Use Ctrl+C instead.'); return; }
    closeContextMenu();
  }
  // execCommand('paste') is blocked in every modern browser for security, so
  // we read the system clipboard via the async Clipboard API. That requires
  // a user gesture (the right-click counts) and clipboard-read permission.
  // If permission is denied or the API is missing, prompt for Ctrl+V — which
  // routes through the existing onPaste handler that supports images too.
  async function ctxPaste() {
    ref.current?.focus();
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      setCtxMsg('Your browser doesn\u2019t allow pasting from a menu. Use Ctrl+V instead.');
      return;
    }
    try {
      // Try image-aware paste first when the API supports it (Chrome / Edge).
      const anyClipboard: any = navigator.clipboard as any;
      if (typeof anyClipboard.read === 'function') {
        try {
          const items = await anyClipboard.read();
          for (const item of items) {
            const imgType = (item.types || []).find((t: string) => t.startsWith('image/'));
            if (imgType) {
              const blob = await item.getType(imgType);
              const file = new File([blob], 'pasted.png', { type: imgType });
              await uploadAndInsertImage(file);
              closeContextMenu();
              return;
            }
          }
        } catch { /* fall through to text */ }
      }
      const text = await navigator.clipboard.readText();
      if (!text) { setCtxMsg('Your clipboard is empty.'); return; }
      try { document.execCommand('insertText', false, text); } catch { /* ignore */ }
      handleInput();
      closeContextMenu();
    } catch {
      setCtxMsg('Your browser blocked clipboard access. Use Ctrl+V instead.');
    }
  }

  // Dismiss the menu on any outside click or the Escape key — same pattern
  // every native context menu uses.
  useEffect(() => {
    if (!ctxMenu) return;
    function onDown(e: MouseEvent) {
      const menu = document.getElementById('cw-rte-ctx-menu');
      if (menu && menu.contains(e.target as Node)) return;
      closeContextMenu();
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeContextMenu(); }
    function onScroll() { closeContextMenu(); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [ctxMenu]);

  // Tooltips for the L/C/R buttons change to reflect dual behaviour: when an
  // image is selected they re-align the image; otherwise they align the
  // current paragraph. Saves a whole toolbar row.
  const alignTitle = (dir: 'left' | 'centre' | 'right') => hasSelectedImg
    ? `Align image ${dir}` + (dir === 'left' ? ' (text wraps right)' : dir === 'right' ? ' (text wraps left)' : '')
    : `Align text ${dir}`;

  return (
    <div style={fillHeight ? { ...wrap, ...wrapFill } : wrap}>
      <div style={toolbar} role="toolbar" aria-label="Formatting">
        <ToolBtn onClick={() => exec('undo')} title="Undo (Ctrl+Z)">&#x21B6;</ToolBtn>
        <ToolBtn onClick={() => exec('redo')} title="Redo (Ctrl+Y)">&#x21B7;</ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)"><b>B</b></ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)"><i>I</i></ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)"><u>U</u></ToolBtn>
        <ToolBtn onClick={() => exec('strikeThrough')} title="Strikethrough"><s>S</s></ToolBtn>
        <ToolBtn onClick={() => exec('superscript')} title="Superscript">x<sup>2</sup></ToolBtn>
        <ToolBtn onClick={() => exec('subscript')} title="Subscript">x<sub>2</sub></ToolBtn>
        <Sep />
        <ColorBtn label="A" title="Text colour" onPick={setColor} onReset={() => setColor('#0f172a')} />
        <ColorBtn label={'\u25A0'} title="Highlight colour" defaultColor="#fff59d" onPick={setHighlight} onReset={clearHighlight} />
        <Sep />
        <ToolBtn onClick={() => exec('formatBlock', '<h2>')} title="Big heading">H1</ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<h3>')} title="Medium heading">H2</ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<h4>')} title="Small heading">H3</ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<p>')} title="Plain paragraph">P</ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bulleted list">&bull; List</ToolBtn>
        <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered list">1. List</ToolBtn>
        <ToolBtn onClick={() => { ensureStyleWithCSS(); exec('indent'); }} title="Indent (Tab)">&#x21E5;</ToolBtn>
        <ToolBtn onClick={() => { ensureStyleWithCSS(); exec('outdent'); }} title="Outdent (Shift+Tab)">&#x21E4;</ToolBtn>
        <Sep />
        {/* L/C/R align an image when one is selected, otherwise the current
            paragraph. Justify is text-only (no image equivalent). */}
        <ToolBtn onClick={() => smartAlign('left')} title={alignTitle('left')}>&#x2630;&#x2190;</ToolBtn>
        <ToolBtn onClick={() => smartAlign('center')} title={alignTitle('centre')}>&#x2261;</ToolBtn>
        <ToolBtn onClick={() => smartAlign('right')} title={alignTitle('right')}>&#x2192;&#x2630;</ToolBtn>
        <ToolBtn onClick={() => exec('justifyFull')} title="Justify text" disabled={hasSelectedImg}>&#x2630;</ToolBtn>
        <ToolBtn onClick={removeImage} title="Remove the selected image" disabled={!hasSelectedImg}>&times; Img</ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec('formatBlock', '<blockquote>')} title="Quote block">&ldquo; &rdquo;</ToolBtn>
        <ToolBtn onClick={addLink} title="Insert link">Link</ToolBtn>
        <ToolBtn onClick={() => exec('removeFormat')} title="Clear formatting">Clear</ToolBtn>
        <Sep />
        {/* Table group — Insert is always enabled; the editing buttons light up
            only when the caret is inside a table cell. */}
        <ToolBtn onClick={insertTable} title="Insert a new table">Table</ToolBtn>
        <ToolBtn onClick={addRowBelow} title={inTableCell ? 'Add a new row below this one' : 'Click inside a table to add a row'} disabled={!inTableCell}>+ Row</ToolBtn>
        <ToolBtn onClick={addColRight} title={inTableCell ? 'Add a new column to the right' : 'Click inside a table to add a column'} disabled={!inTableCell}>+ Col</ToolBtn>
        <ToolBtn onClick={deleteRow} title={inTableCell ? 'Delete this row' : 'Click inside a table to delete a row'} disabled={!inTableCell}>&minus; Row</ToolBtn>
        <ToolBtn onClick={deleteCol} title={inTableCell ? 'Delete this column' : 'Click inside a table to delete a column'} disabled={!inTableCell}>&minus; Col</ToolBtn>
        <ToolBtn onClick={deleteTable} title={inTableCell ? 'Delete the whole table' : 'Click inside a table to remove it'} disabled={!inTableCell}>&times; Table</ToolBtn>
        {(uploading || uploadErr) && (
          <span style={{
            marginLeft: 'auto', fontSize: 12,
            color: uploadErr ? 'var(--cw-danger)' : 'var(--cw-muted)',
          }}>
            {uploading ? 'Uploading image\u2026' : uploadErr}
          </span>
        )}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        onContextMenu={openContextMenu}
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (t && t.tagName === 'IMG') selectImage(t as HTMLImageElement);
          else selectImage(null);
        }}
        onKeyDown={(e) => {
          // Tab indents the current block (or moves between table cells when
          // inside a table) — same as Word / Google Docs. Without this, Tab
          // moves focus out of the editor entirely, which surprises pupils.
          if (e.key === 'Tab') {
            const cell = currentCell();
            if (cell) {
              e.preventDefault();
              const table = cell.closest('table');
              if (!table) return;
              const cells = Array.from(table.querySelectorAll('th, td')) as HTMLTableCellElement[];
              const idx = cells.indexOf(cell);
              let target: HTMLTableCellElement | null = null;
              if (e.shiftKey) {
                target = cells[idx - 1] || null;
              } else {
                target = cells[idx + 1] || null;
                if (!target) {
                  // Past the last cell with Tab → add a new row and jump to its
                  // first cell, mirroring Word's "Tab in last cell" behaviour.
                  const lastRow = table.rows[table.rows.length - 1];
                  if (lastRow) {
                    const colCount = Array.from(lastRow.cells).reduce((n, c) => n + (c.colSpan || 1), 0);
                    const tr = document.createElement('tr');
                    for (let i = 0; i < colCount; i++) {
                      const td = document.createElement('td');
                      td.innerHTML = '&nbsp;';
                      tr.appendChild(td);
                    }
                    lastRow.parentNode?.insertBefore(tr, lastRow.nextSibling);
                    target = tr.cells[0] || null;
                    handleInput();
                  }
                }
              }
              if (target) {
                const range = document.createRange();
                range.selectNodeContents(target);
                range.collapse(true);
                const sel = window.getSelection();
                sel?.removeAllRanges(); sel?.addRange(range);
                (target as HTMLElement).focus();
              }
              return;
            }
            e.preventDefault();
            ensureStyleWithCSS();
            exec(e.shiftKey ? 'outdent' : 'indent');
          }
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
        style={fillHeight
          ? { ...editor, flex: 1, minHeight: 0, overflowY: 'auto' }
          : { ...editor, minHeight }}
        className="cw-rte"
      />
      {/* Custom right-click menu — three friendly buttons covering the full
          edit/share workflow without requiring keyboard shortcuts. */}
      {ctxMenu && (
        <div
          id="cw-rte-ctx-menu"
          role="menu"
          aria-label="Editing actions"
          style={{
            position: 'fixed', top: ctxMenu.y, left: ctxMenu.x,
            background: '#fff', border: '1px solid var(--cw-border)',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
            padding: 6, minWidth: 180, zIndex: 9999,
            display: 'flex', flexDirection: 'column', gap: 2,
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <CtxItem onClick={ctxCut} icon="\u2702" label="Cut" hint="Ctrl+X" />
          <CtxItem onClick={ctxCopy} icon="\u29C9" label="Copy" hint="Ctrl+C" />
          <CtxItem onClick={ctxPaste} icon="\u{1F4CB}" label="Paste" hint="Ctrl+V" />
          {ctxMsg && (
            <div style={{ fontSize: 12, color: 'var(--cw-danger)', padding: '6px 10px 2px' }}>
              {ctxMsg}
            </div>
          )}
        </div>
      )}
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
        .cw-rte table.cw-table { border-collapse: collapse; margin: 8px 0; width: auto; max-width: 100%; }
        .cw-rte table.cw-table th, .cw-rte table.cw-table td { border: 1px solid #cbd5e1; padding: 6px 10px; vertical-align: top; min-width: 40px; }
        .cw-rte table.cw-table th { background: #f1f5f9; text-align: left; font-weight: 600; }
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

// Single row in the right-click menu — wide click target, label on the left,
// keyboard hint greyed out on the right (so pupils gradually learn the
// shortcut). onMouseDown stops the surrounding "click outside" handler from
// firing before the action runs.
function CtxItem({ icon, label, hint, onClick }: { icon: string; label: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', border: 'none', background: 'transparent',
        borderRadius: 6, cursor: 'pointer', textAlign: 'left',
        color: 'var(--cw-ink)', fontSize: 14, width: '100%',
      }}
      onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'; }}
      onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      <span style={{ width: 20, textAlign: 'center', fontSize: 14 }} aria-hidden="true">{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--cw-muted)' }}>{hint}</span>
    </button>
  );
}

// A toolbar button that pairs a label (e.g. "A" for text colour, square for
// highlight) with the OS-native colour picker. The button itself applies the
// last-chosen colour; clicking the small ▾ opens a fresh picker; clicking
// the × resets to the default. The native picker is far smaller and more
// accessible than a custom palette and works the same on every device.
function ColorBtn({
  label, title, defaultColor, onPick, onReset,
}: {
  label: string; title: string; defaultColor?: string;
  onPick: (color: string) => void; onReset: () => void;
}) {
  const [color, setColor] = useState(defaultColor || '#fbbf24');
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'stretch' }}
      onMouseDown={(e) => e.preventDefault()}
      title={title}
    >
      <button
        type="button"
        onClick={() => onPick(color)}
        style={{
          ...btn, borderTopRightRadius: 0, borderBottomRightRadius: 0,
          borderRight: 'none', minWidth: 32,
          textDecoration: 'underline', textDecorationColor: color, textDecorationThickness: 3,
        }}
      >{label}</button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{ ...btn, borderRadius: 0, borderRight: 'none', padding: '4px 4px', fontSize: 11 }}
        title="Pick colour"
      >&#x25BE;</button>
      <button
        type="button"
        onClick={onReset}
        style={{ ...btn, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '4px 6px', fontSize: 11 }}
        title="Reset"
      >&times;</button>
      <input
        ref={inputRef}
        type="color"
        value={color}
        onChange={(e) => { setColor(e.target.value); onPick(e.target.value); }}
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />
    </span>
  );
}

const wrap: React.CSSProperties = {
  border: '1px solid var(--cw-border)', borderRadius: 8, overflow: 'hidden', background: '#fff',
};
// Extra styling layered on top of `wrap` when `fillHeight` is true: turns the
// outer box into a flex column that fills its parent so the editable area
// (set to flex:1) expands and the toolbar stays pinned at the top.
const wrapFill: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
};
const toolbar: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 4, padding: 6, alignItems: 'center',
  borderBottom: '1px solid var(--cw-border)', background: '#f8fafc',
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
