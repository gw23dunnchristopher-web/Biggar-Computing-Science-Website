import { Fragment, ReactNode } from 'react';

// Renders a question prompt as plain text but auto-converts URLs into
// clickable links that open in a new window. Two link styles are supported:
//   1. Bare URLs:           https://example.com
//   2. Markdown-style:      [some label](https://example.com)
// Anything else is rendered as plain text (newlines preserved by the
// surrounding white-space: pre-wrap on the host element).

const URL_RE = /https?:\/\/[^\s)<>]+[^\s.,;:!?)<>]/g;
const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

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

// Walk the text, picking out [label](url) and bare URLs in source order.
// Avoids double-matching by tracking the next index of each kind.
export default function PromptText({ text }: { text: string }) {
  if (!text) return null;
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;
  // Reset both regexes between renders.
  const md = new RegExp(MD_LINK_RE.source, MD_LINK_RE.flags);
  const url = new RegExp(URL_RE.source, URL_RE.flags);

  while (i < text.length) {
    md.lastIndex = i;
    url.lastIndex = i;
    const mdMatch = md.exec(text);
    const urlMatch = url.exec(text);

    // Pick whichever comes first; markdown wins on a tie because it starts
    // with '[' which the bare URL regex won't match anyway.
    let nextStart = -1;
    let kind: 'md' | 'url' | null = null;
    if (mdMatch && (urlMatch ? mdMatch.index <= urlMatch.index : true)) {
      nextStart = mdMatch.index; kind = 'md';
    } else if (urlMatch) {
      nextStart = urlMatch.index; kind = 'url';
    }

    if (nextStart === -1) {
      out.push(<Fragment key={key++}>{text.slice(i)}</Fragment>);
      break;
    }
    if (nextStart > i) out.push(<Fragment key={key++}>{text.slice(i, nextStart)}</Fragment>);

    if (kind === 'md' && mdMatch) {
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
