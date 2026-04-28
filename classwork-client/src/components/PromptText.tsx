import { Fragment, ReactNode, useEffect, useState } from 'react';

// Renders a question prompt with light Markdown-style formatting:
//
//   • Headings:   "# Big",  "## Medium",  "### Small"  (line-leading)
//   • Bullets:    "- item"  or  "* item"               (line-leading)
//   • Bold:       **like this**
//   • Italic:     _like this_
//   • Links:      [label](https://…) or a bare https:// URL
//   • Images:     ![alt](https://…) with optional alignment hint
//                 (alignment: ![alt|left](url) / ![alt|right](url),
//                  default centred)
//
// Anything else falls through as plain text. Newlines inside a paragraph are
// preserved (rendered with white-space: pre-wrap on each paragraph block).
// Block elements (headings, bullet lists) need a non-<p> parent to be valid
// HTML, which is why this component returns a <div> wrapper.

const URL_RE = /https?:\/\/[^\s)<>]+[^\s.,;:!?)<>]/g;
const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
// Markdown-style images: ![alt](url). Also supports relative URLs that begin
// with "/" so teacher-uploaded resources (which come back as
// "/uploads/..." paths) render inline as well as fully-qualified URLs.
const MD_IMG_RE = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g;
// Inline emphasis. Bold uses doubled asterisks so it doesn't collide with a
// bare "5 * 5". Italic uses underscores so it doesn't fight the bullet
// syntax ("* item") or sentence asterisks. Both patterns insist the marker
// is paired and reject newlines inside, which keeps surprises to a minimum
// for teachers who haven't read the docs.
const BOLD_RE = /\*\*([^*\n][^\n]*?)\*\*/g;
const ITALIC_RE = /(^|[^A-Za-z0-9_])_([^_\n]+?)_(?![A-Za-z0-9_])/g;

function isSafeHttpUrl(u: string): boolean {
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isSafeImageUrl(u: string): boolean {
  // Allow http(s) absolute URLs (validated by isSafeHttpUrl) plus same-origin
  // relative paths beginning with "/" (e.g. "/uploads/..."). Reject anything
  // else so we never render a `data:` or `javascript:` image source.
  if (u.startsWith('/')) return !u.startsWith('//');
  return isSafeHttpUrl(u);
}

function ExtLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ color: 'var(--cw-accent)', textDecoration: 'underline' }}>
      {label}
    </a>
  );
}

// Image alignment options exposed to teachers. "center" is the default and
// renders as a full-width block with the text breaking before and after the
// image. "left" / "right" float the image so surrounding text wraps around
// it, like a typical word-processor inline image.
export type PromptImageAlign = 'center' | 'left' | 'right';

// Pull an optional alignment hint off the end of the alt text. Teachers
// shouldn't have to learn this syntax — the prompt editor manages it for
// them — but it's deliberately simple so a teacher who *does* read the
// markdown can tweak it by hand. Examples:
//   ![diagram|left](url)   → wrap text on the right
//   ![diagram|right](url)  → wrap text on the left
//   ![diagram](url)        → centered block (default)
// Both UK ("centre") and US ("center") spellings are accepted on input.
export function parsePromptImageAlt(rawAlt: string): { alt: string; align: PromptImageAlign } {
  const m = /^(.*?)\s*\|\s*(left|right|center|centre)\s*$/i.exec(rawAlt);
  if (!m) return { alt: rawAlt, align: 'center' };
  const a = m[2].toLowerCase();
  return {
    alt: m[1],
    align: a === 'left' ? 'left' : a === 'right' ? 'right' : 'center',
  };
}

function PromptImage({
  src, alt, align, onOpen,
}: {
  src: string; alt: string; align: PromptImageAlign;
  onOpen: (src: string, alt: string) => void;
}) {
  const wrapStyle: React.CSSProperties =
    align === 'center'
      ? { display: 'block', margin: '8px auto', textAlign: 'center', clear: 'both' }
      : align === 'left'
        ? { float: 'left', margin: '4px 12px 8px 0', maxWidth: '50%' }
        : { float: 'right', margin: '4px 0 8px 12px', maxWidth: '50%' };
  return (
    <button
      type="button"
      onClick={() => onOpen(src, alt)}
      title="Click to view full size"
      aria-label={alt ? `Open ${alt} full size` : 'Open image full size'}
      style={{
        ...wrapStyle,
        padding: 0, border: 'none', background: 'transparent',
        cursor: 'zoom-in',
      }}
    >
      <img
        src={src}
        alt={alt || 'Image'}
        style={{
          display: 'block',
          maxWidth: '100%', maxHeight: 360, height: 'auto',
          borderRadius: 8, border: '1px solid var(--cw-border)',
          background: '#fff',
        }}
      />
    </button>
  );
}

// Fullscreen lightbox shown when a pupil clicks an image in a prompt.
// Closes on backdrop click, the close button, or pressing Escape. The
// image itself swallows clicks so the pupil can interact with it without
// dismissing the dialog.
function ImageLightbox({
  src, alt, onClose,
}: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt ? `${alt} (full size)` : 'Image (full size)'}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close full-size image"
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 40, height: 40, borderRadius: '50%',
          border: 'none', background: 'rgba(255,255,255,0.15)',
          color: '#fff', fontSize: 22, lineHeight: 1, cursor: 'pointer',
        }}
      >
        ✕
      </button>
      <img
        src={src}
        alt={alt || 'Image'}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '95vw', maxHeight: '85vh',
          width: 'auto', height: 'auto',
          objectFit: 'contain',
          borderRadius: 8, background: '#fff',
          boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
        }}
      />
      {alt && (
        <div style={{
          marginTop: 12, color: '#fff', fontSize: 14,
          textAlign: 'center', maxWidth: '80vw',
        }}>
          {alt}
        </div>
      )}
      <div style={{
        marginTop: 8, color: 'rgba(255,255,255,0.6)', fontSize: 12,
      }}>
        Click anywhere or press Esc to close.
      </div>
    </div>
  );
}

// ─── Block parser ──────────────────────────────────────────────────────────
// Splits a prompt into a stream of blocks: headings (3 sizes), bullet lists
// (collapsed across consecutive lines), and paragraphs (which may themselves
// contain manual line breaks). Blank lines act as paragraph separators.

type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'paragraph'; text: string };

function parseBlocks(text: string): Block[] {
  const lines = text.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Heading lines: "# h1", "## h2", "### h3" — anything beyond ### degrades
    // to a regular paragraph so a stray "####" doesn't disappear silently.
    const h = /^(#{1,3})\s+(.*\S.*)$/.exec(line);
    if (h) {
      blocks.push({
        kind: 'heading',
        level: h[1].length as 1 | 2 | 3,
        text: h[2],
      });
      i++;
      continue;
    }
    // Bullet lines: collapse consecutive "- item" / "* item" rows into one
    // <ul> so they render as a real list rather than three loose paragraphs.
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'bullets', items });
      continue;
    }
    // Blank line — just skip; it's used to separate paragraphs visually.
    if (line.trim() === '') {
      i++;
      continue;
    }
    // Otherwise: a paragraph that runs until the next blank line, heading,
    // or bullet list. Newlines within are preserved as soft line breaks.
    const paraLines: string[] = [];
    while (
      i < lines.length
      && lines[i].trim() !== ''
      && !/^(#{1,3})\s+\S/.test(lines[i])
      && !/^\s*[-*]\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ kind: 'paragraph', text: paraLines.join('\n') });
  }
  return blocks;
}

// ─── Inline parser ─────────────────────────────────────────────────────────
// Walks a single block of text and produces React children with bold,
// italic, links, images and bare URLs converted into the right elements.
// Everything else falls through as plain text. Bold/italic are processed as
// part of the same source-order walk as links/images so they nest correctly
// (a bold span won't accidentally swallow an image's alt-text bracket).

type InlineCtx = {
  onOpenImage: (src: string, alt: string) => void;
};

function renderInline(text: string, ctx: InlineCtx, keyOffset = 0): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  let key = keyOffset;
  // Build fresh regex instances so the per-render lastIndex resets are
  // confined to this call (avoids the global-flag re-entrancy footgun).
  const img = new RegExp(MD_IMG_RE.source, MD_IMG_RE.flags);
  const md = new RegExp(MD_LINK_RE.source, MD_LINK_RE.flags);
  const url = new RegExp(URL_RE.source, URL_RE.flags);
  const bold = new RegExp(BOLD_RE.source, BOLD_RE.flags);
  const italic = new RegExp(ITALIC_RE.source, ITALIC_RE.flags);

  while (i < text.length) {
    img.lastIndex = i;
    md.lastIndex = i;
    url.lastIndex = i;
    bold.lastIndex = i;
    italic.lastIndex = i;
    const imgMatch = img.exec(text);
    const mdMatch = md.exec(text);
    const urlMatch = url.exec(text);
    const boldMatch = bold.exec(text);
    const italicMatch = italic.exec(text);

    type K = 'img' | 'md' | 'url' | 'bold' | 'italic';
    const candidates: { start: number; kind: K }[] = [];
    if (imgMatch) candidates.push({ start: imgMatch.index, kind: 'img' });
    if (mdMatch) candidates.push({ start: mdMatch.index, kind: 'md' });
    if (urlMatch) candidates.push({ start: urlMatch.index, kind: 'url' });
    if (boldMatch) candidates.push({ start: boldMatch.index, kind: 'bold' });
    // Italic match index points at the leading boundary character (or 0),
    // so add 1 (when it's not at the very start) to get the real "_" pos.
    if (italicMatch) {
      const pre = italicMatch[1] || '';
      candidates.push({ start: italicMatch.index + pre.length, kind: 'italic' });
    }
    if (!candidates.length) {
      out.push(<Fragment key={key++}>{text.slice(i)}</Fragment>);
      break;
    }
    candidates.sort((a, b) => a.start - b.start);
    const { start, kind } = candidates[0];
    if (start > i) out.push(<Fragment key={key++}>{text.slice(i, start)}</Fragment>);

    if (kind === 'img' && imgMatch) {
      const [whole, rawAlt, src] = imgMatch;
      if (isSafeImageUrl(src)) {
        const { alt, align } = parsePromptImageAlt(rawAlt);
        out.push(
          <PromptImage
            key={key++}
            src={src}
            alt={alt}
            align={align}
            onOpen={ctx.onOpenImage}
          />,
        );
      } else {
        out.push(<Fragment key={key++}>{whole}</Fragment>);
      }
      i = start + whole.length;
    } else if (kind === 'md' && mdMatch) {
      const [whole, label, href] = mdMatch;
      if (isSafeHttpUrl(href)) {
        out.push(<ExtLink key={key++} href={href} label={label} />);
      } else {
        out.push(<Fragment key={key++}>{whole}</Fragment>);
      }
      i = start + whole.length;
    } else if (kind === 'url' && urlMatch) {
      const [href] = urlMatch;
      if (isSafeHttpUrl(href)) {
        out.push(<ExtLink key={key++} href={href} label={href} />);
      } else {
        out.push(<Fragment key={key++}>{href}</Fragment>);
      }
      i = start + urlMatch[0].length;
    } else if (kind === 'bold' && boldMatch) {
      const inner = boldMatch[1];
      // Recurse so a bold span can still contain italic, links, etc.
      out.push(
        <strong key={key++} style={{ fontWeight: 700 }}>
          {renderInline(inner, ctx, key * 100)}
        </strong>,
      );
      i = boldMatch.index + boldMatch[0].length;
    } else if (kind === 'italic' && italicMatch) {
      const inner = italicMatch[2];
      out.push(
        <em key={key++} style={{ fontStyle: 'italic' }}>
          {renderInline(inner, ctx, key * 100)}
        </em>,
      );
      i = start + 1 + inner.length + 1;
    }
  }
  return out;
}

// ─── Main component ────────────────────────────────────────────────────────

export default function PromptText({ text }: { text: string }) {
  // One lightbox state per PromptText instance: when a pupil clicks an
  // inline image we stash its source + alt text here, which mounts the
  // <ImageLightbox> overlay below. Setting it back to null closes it.
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  if (!text) return null;
  const ctx: InlineCtx = {
    onOpenImage: (src, alt) => setLightbox({ src, alt }),
  };
  const blocks = parseBlocks(text);

  // Heading sizes are deliberately modest — pupils read these in the same
  // visual frame as the regular task prompt, so keeping a tight scale
  // prevents the page from feeling shouty.
  const headingStyle = (level: 1 | 2 | 3): React.CSSProperties => ({
    fontSize: level === 1 ? '1.4em' : level === 2 ? '1.2em' : '1.05em',
    fontWeight: 700,
    margin: '10px 0 4px',
    lineHeight: 1.25,
  });

  return (
    <div style={{ display: 'block' }}>
      {blocks.map((b, idx) => {
        if (b.kind === 'heading') {
          const Tag = (b.level === 1 ? 'h2' : b.level === 2 ? 'h3' : 'h4') as 'h2' | 'h3' | 'h4';
          return (
            <Tag key={idx} style={headingStyle(b.level)}>
              {renderInline(b.text, ctx)}
            </Tag>
          );
        }
        if (b.kind === 'bullets') {
          return (
            <ul key={idx} style={{
              margin: '6px 0 8px',
              paddingLeft: 22,
              lineHeight: 1.45,
            }}>
              {b.items.map((it, j) => (
                <li key={j} style={{ marginBottom: 2 }}>
                  {renderInline(it, ctx)}
                </li>
              ))}
            </ul>
          );
        }
        // Paragraph: pre-wrap preserves manual line breaks within. We use a
        // <div> rather than <p> so floated images can wrap text as expected
        // (browsers treat <p> with floated children inconsistently when
        // pre-wrap is involved).
        return (
          <div key={idx} style={{
            whiteSpace: 'pre-wrap',
            margin: '4px 0',
            lineHeight: 1.5,
          }}>
            {renderInline(b.text, ctx)}
          </div>
        );
      })}
      {/* Float clearfix so a tall floated image can't spill into the next
          question or UI element below the prompt. */}
      <div style={{ clear: 'both' }} />
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
