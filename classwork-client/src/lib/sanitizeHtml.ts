// Small DOM-based whitelist sanitiser for pupil notes. Keeps a tight set of
// formatting tags and strips everything else (including script tags, event
// handlers, and javascript: URLs). Safe to feed into dangerouslySetInnerHTML.

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U',
  'H2', 'H3', 'H4',
  'UL', 'OL', 'LI',
  'A', 'BLOCKQUOTE', 'CODE', 'PRE', 'SPAN', 'DIV',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(['href', 'title']),
};

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
        } else {
          replacement.setAttribute(lower, value);
        }
      }
      if (tag === 'A') {
        replacement.setAttribute('rel', 'noopener noreferrer');
        replacement.setAttribute('target', '_blank');
      }
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
