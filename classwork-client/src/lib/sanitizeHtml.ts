// Small DOM-based whitelist sanitiser for pupil notes. Keeps a tight set of
// formatting tags and strips everything else (including script tags, event
// handlers, and javascript: URLs). Safe to feed into dangerouslySetInnerHTML.

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'MARK',
  'SUB', 'SUP', 'H2', 'H3', 'H4',
  'UL', 'OL', 'LI',
  'A', 'BLOCKQUOTE', 'CODE', 'PRE', 'SPAN', 'DIV',
  'IMG', 'FIGURE', 'FIGCAPTION',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
]);

// Tags where we keep a sanitised inline `style` attribute. This lets pupils
// use things like text colour, highlight (background-color), text alignment
// and indentation produced by execCommand without us having to invent a new
// class for every variant.
const STYLE_TAGS = new Set([
  'SPAN', 'P', 'DIV', 'LI', 'UL', 'OL', 'TR', 'TH', 'TD',
  'H2', 'H3', 'H4', 'BLOCKQUOTE', 'B', 'STRONG', 'I', 'EM', 'U', 'MARK',
  'SUB', 'SUP', 'CODE', 'PRE', 'A', 'S', 'STRIKE', 'DEL',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(['href', 'title', 'style']),
  IMG: new Set(['src', 'alt', 'width', 'class']),
  TH: new Set(['colspan', 'rowspan', 'style']),
  TD: new Set(['colspan', 'rowspan', 'style']),
  TABLE: new Set(['class']),
};

// The only classes pupils can persist on images are the alignment classes
// our editor and the jotter both know how to style. Anything else (including
// the editor's transient "selected" outline) is dropped on save.
const ALLOWED_IMG_CLASSES = new Set(['cw-img-left', 'cw-img-center', 'cw-img-right']);

// ---- Style whitelist -----------------------------------------------------
//
// We only persist a small set of CSS declarations, each validated against a
// strict regex so we never let arbitrary CSS (or `expression()`-style attacks)
// reach the DOM.
const COLOR_RE = /^(#[0-9a-f]{3,8}|rgb\(\s*\d{1,3}(\s*,\s*\d{1,3}){2}\s*\)|rgba\(\s*\d{1,3}(\s*,\s*\d{1,3}){2}\s*,\s*(0|1|0?\.\d+)\s*\)|[a-z]+)$/i;
const LENGTH_RE = /^-?\d{1,4}(\.\d+)?(px|em|rem|%)?$/i;

function isColor(v: string): boolean { return COLOR_RE.test(v.trim()); }
function isLength(v: string): boolean { return LENGTH_RE.test(v.trim()); }
function isAlign(v: string): boolean { return /^(left|right|center|justify)$/i.test(v.trim()); }

const STYLE_RULES: Record<string, (v: string) => boolean> = {
  'color': isColor,
  'background-color': isColor,
  'text-align': isAlign,
  'margin-left': isLength,
  'padding-left': isLength,
  'font-weight': (v) => /^(normal|bold|[1-9]00)$/i.test(v.trim()),
  'font-style': (v) => /^(normal|italic|oblique)$/i.test(v.trim()),
  'text-decoration': (v) => /^(none|underline|line-through|underline\s+line-through)$/i.test(v.trim()),
};

function sanitizeStyle(raw: string): string {
  const out: string[] = [];
  for (const decl of (raw || '').split(';')) {
    const idx = decl.indexOf(':');
    if (idx <= 0) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const val = decl.slice(idx + 1).trim();
    if (!val || /[\\(]/.test(val) && prop !== 'color' && prop !== 'background-color') {
      // values containing parens are only allowed for colour functions above
      if (!/^(rgb|rgba)\(/i.test(val)) continue;
    }
    const test = STYLE_RULES[prop];
    if (test && test(val)) out.push(`${prop}: ${val}`);
  }
  return out.join('; ');
}

function safeImgSrc(src: string): string | null {
  const trimmed = (src || '').trim();
  if (!trimmed) return null;
  // Block dangerous schemes and giant inline data: URLs (uploads return a
  // /resources/ path instead).
  if (/^(javascript|vbscript|file|data):/i.test(trimmed)) return null;
  if (/^https?:/i.test(trimmed)) return trimmed;
  if (/^(\/|\.{0,2}\/)/.test(trimmed)) return trimmed;
  return null;
}

function safeHref(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) return null;
  // Block javascript:, data:, vbscript:, etc. Allow http(s), mailto, and
  // protocol-relative + relative URLs.
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return null;
  if (/^(https?:|mailto:|\/|#|\.{0,2}\/)/i.test(trimmed) || !/^[a-z]+:/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function clean(node: Node, out: Node): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      out.appendChild(child.cloneNode(false));
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as Element;
    let tag = el.tagName.toUpperCase();
    // Some browsers emit deprecated <font color="..."> from execCommand.
    // Translate it to <span style="color:..."> so the whitelist accepts it.
    if (tag === 'FONT') {
      const span = document.createElement('span');
      const styles: string[] = [];
      const c = el.getAttribute('color'); if (c) styles.push(`color: ${c}`);
      const f = el.getAttribute('face');  if (f && /^[\w\s,'-]+$/.test(f)) styles.push(`font-family: ${f}`);
      if (styles.length) span.setAttribute('style', sanitizeStyle(styles.join('; ')));
      clean(el, span);
      out.appendChild(span);
      continue;
    }
    if (!ALLOWED_TAGS.has(tag)) {
      // Drop the tag but keep its (cleaned) children.
      clean(el, out);
      continue;
    }
    const replacement = document.createElement(tag.toLowerCase());
    const allowed = ALLOWED_ATTRS[tag] || (STYLE_TAGS.has(tag) ? new Set(['style']) : null);
    if (allowed) {
      for (const { name, value } of Array.from(el.attributes)) {
        const lower = name.toLowerCase();
        if (!allowed.has(lower)) continue;
        if (lower === 'href') {
          const safe = safeHref(value);
          if (safe) replacement.setAttribute('href', safe);
        } else if (lower === 'src' && tag === 'IMG') {
          const safe = safeImgSrc(value);
          if (safe) replacement.setAttribute('src', safe);
        } else if (lower === 'class' && tag === 'IMG') {
          const kept = value.split(/\s+/).filter((c) => ALLOWED_IMG_CLASSES.has(c));
          if (kept.length) replacement.setAttribute('class', kept.join(' '));
        } else if (lower === 'width' && tag === 'IMG') {
          const n = parseInt(value, 10);
          if (Number.isFinite(n) && n > 0 && n <= 4000) replacement.setAttribute('width', String(n));
        } else if ((lower === 'colspan' || lower === 'rowspan') && (tag === 'TH' || tag === 'TD')) {
          const n = parseInt(value, 10);
          if (Number.isFinite(n) && n > 0 && n <= 50) replacement.setAttribute(lower, String(n));
        } else if (lower === 'class' && tag === 'TABLE') {
          replacement.setAttribute('class', 'cw-table');
        } else if (lower === 'style' && STYLE_TAGS.has(tag)) {
          const cleaned = sanitizeStyle(value);
          if (cleaned) replacement.setAttribute('style', cleaned);
        } else {
          replacement.setAttribute(lower, value);
        }
      }
      if (tag === 'A') {
        replacement.setAttribute('rel', 'noopener noreferrer');
        replacement.setAttribute('target', '_blank');
      }
      // Drop images that ended up with no usable src.
      if (tag === 'IMG' && !replacement.getAttribute('src')) continue;
    }
    clean(el, replacement);
    out.appendChild(replacement);
  }
}

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const dst = document.createElement('div');
  clean(tpl.content, dst);
  return dst.innerHTML;
}

// Older notes were saved as plain text. If we get something with no HTML
// tags, turn newlines into <br> and wrap in a single paragraph so the rich
// editor and the jotter both render them sensibly.
export function plainTextToHtml(text: string): string {
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return '<p>' + escaped.replace(/\n/g, '<br>') + '</p>';
}

export function looksLikeHtml(content: string): boolean {
  return /<[a-z][^>]*>/i.test(content || '');
}
