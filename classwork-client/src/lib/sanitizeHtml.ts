// Small DOM-based whitelist sanitiser for pupil notes. Keeps a tight set of
// formatting tags and strips everything else (including script tags, event
// handlers, and javascript: URLs). Safe to feed into dangerouslySetInnerHTML.

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U',
  'H2', 'H3', 'H4',
  'UL', 'OL', 'LI',
  'A', 'BLOCKQUOTE', 'CODE', 'PRE', 'SPAN', 'DIV',
  'IMG', 'FIGURE', 'FIGCAPTION',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(['href', 'title']),
  IMG: new Set(['src', 'alt', 'width', 'class']),
  TH: new Set(['colspan', 'rowspan']),
  TD: new Set(['colspan', 'rowspan']),
  TABLE: new Set(['class']),
};

// The only classes pupils can persist on images are the alignment classes
// our editor and the jotter both know how to style. Anything else (including
// the editor's transient "selected" outline) is dropped on save.
const ALLOWED_IMG_CLASSES = new Set(['cw-img-left', 'cw-img-center', 'cw-img-right']);

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
    const tag = el.tagName.toUpperCase();
    if (!ALLOWED_TAGS.has(tag)) {
      // Drop the tag but keep its (cleaned) children.
      clean(el, out);
      continue;
    }
    const replacement = document.createElement(tag.toLowerCase());
    const allowed = ALLOWED_ATTRS[tag];
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
