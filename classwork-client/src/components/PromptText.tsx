import { Fragment, ReactNode } from 'react';

// Renders a question prompt as plain text but auto-converts URLs into
// clickable links that open in a new window. Two link styles are supported:
//   1. Bare URLs:           https://example.com
//   2. Markdown-style:      [some label](https://example.com)
// Anything else is rendered as plain text (newlines preserved by the
// surrounding white-space: pre-wrap on the host element).

const URL_RE = /https?:\/\/[^\s)<>]+[^\s.,;:!?)<>]/g;
const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
// Markdown-style images: ![alt](url). Also supports relative URLs that begin
// with "/" so teacher-uploaded resources (which come back as
// "/uploads/..." paths) render inline as well as fully-qualified URLs.
const MD_IMG_RE = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g;

function isSafeHttpUrl(u: string): boolean {
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function ExtLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ color: 'var(--cw-accent)', textDecoration: 'underline' }}>
      {label}
    </a>
  );
}

function PromptImage({ src, alt }: { src: string; alt: string }) {
  // Inline image embedded in a prompt. Constrained to a reasonable size so a
  // huge screenshot can't blow out the layout, and clickable so pupils can
  // open it full-size in a new tab.
  return (
    <a href={src} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', margin: '8px 0' }}>
      <img
        src={src}
        alt={alt || 'Image'}
        style={{
          maxWidth: '100%', maxHeight: 360, height: 'auto',
          borderRadius: 8, border: '1px solid var(--cw-border)',
          background: '#fff', cursor: 'zoom-in',
        }}
      />
    </a>
  );
}

function isSafeImageUrl(u: string): boolean {
  // Allow http(s) absolute URLs (validated by isSafeHttpUrl) plus same-origin
  // relative paths beginning with "/" (e.g. "/uploads/..."). Reject anything
  // else so we never render a `data:` or `javascript:` image source.
  if (u.startsWith('/')) return !u.startsWith('//');
  return isSafeHttpUrl(u);
}

// Walk the text, picking out [label](url) and bare URLs in source order.
// Avoids double-matching by tracking the next index of each kind.
export default function PromptText({ text }: { text: string }) {
  if (!text) return null;
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;
  // Reset all three regexes between renders.
  const md = new RegExp(MD_LINK_RE.source, MD_LINK_RE.flags);
  const img = new RegExp(MD_IMG_RE.source, MD_IMG_RE.flags);
  const url = new RegExp(URL_RE.source, URL_RE.flags);

  while (i < text.length) {
    md.lastIndex = i;
    img.lastIndex = i;
    url.lastIndex = i;
    const imgMatch = img.exec(text);
    const mdMatch = md.exec(text);
    const urlMatch = url.exec(text);

    // Pick whichever match comes first in source order. Image syntax
    // (`![alt](url)`) wins ties over the link syntax (`[label](url)`)
    // because they both start with `[` after the optional `!`.
    let nextStart = -1;
    let kind: 'img' | 'md' | 'url' | null = null;
    const candidates: { start: number; kind: 'img' | 'md' | 'url' }[] = [];
    if (imgMatch) candidates.push({ start: imgMatch.index, kind: 'img' });
    if (mdMatch)  candidates.push({ start: mdMatch.index,  kind: 'md'  });
    if (urlMatch) candidates.push({ start: urlMatch.index, kind: 'url' });
    if (candidates.length) {
      candidates.sort((a, b) => a.start - b.start || (a.kind === 'img' ? -1 : 1));
      nextStart = candidates[0].start;
      kind = candidates[0].kind;
    }

    if (nextStart === -1) {
      out.push(<Fragment key={key++}>{text.slice(i)}</Fragment>);
      break;
    }
    if (nextStart > i) out.push(<Fragment key={key++}>{text.slice(i, nextStart)}</Fragment>);

    if (kind === 'img' && imgMatch) {
      const [whole, alt, src] = imgMatch;
      if (isSafeImageUrl(src)) {
        out.push(<PromptImage key={key++} src={src} alt={alt} />);
      } else {
        out.push(<Fragment key={key++}>{whole}</Fragment>);
      }
      i = nextStart + whole.length;
    } else if (kind === 'md' && mdMatch) {
      const [whole, label, href] = mdMatch;
      if (isSafeHttpUrl(href)) {
        out.push(<ExtLink key={key++} href={href} label={label} />);
      } else {
        out.push(<Fragment key={key++}>{whole}</Fragment>);
      }
      i = nextStart + whole.length;
    } else if (kind === 'url' && urlMatch) {
      const [href] = urlMatch;
      if (isSafeHttpUrl(href)) {
        out.push(<ExtLink key={key++} href={href} label={href} />);
      } else {
        out.push(<Fragment key={key++}>{href}</Fragment>);
      }
      i = nextStart + urlMatch[0].length;
    }
  }

  return <>{out}</>;
}
