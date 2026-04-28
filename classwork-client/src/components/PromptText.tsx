import { Fragment, ReactNode, useEffect, useState } from 'react';

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
  // Inline image embedded in a prompt. Constrained to a reasonable size so a
  // huge screenshot can't blow out the layout, and clickable so pupils can
  // open it full-size in an in-page lightbox.
  //
  // Centered images take a full block of their own. Left/right alignment
  // floats the image so the prompt text flows around it; the max width is
  // capped at 50% so there's always enough space for at least one column of
  // text alongside.
  //
  // We use a transparent <button> so the click target is keyboard-focusable
  // (Enter/Space activate it) and screen-reader-friendly. The visible style
  // is provided by the inner <img>; the wrapper just owns the float/centre
  // layout.
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
// dismissing the dialog. Rendered with role="dialog" so assistive
// technology announces it correctly.
function ImageLightbox({
  src, alt, onClose,
}: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // Lock body scroll while the lightbox is open so scrolling the
    // backdrop doesn't move the page underneath.
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
  // One lightbox state per PromptText instance: when a pupil clicks an
  // inline image we stash its source + alt text here, which mounts the
  // <ImageLightbox> overlay below. Setting it back to null closes it.
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
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
      const [whole, rawAlt, src] = imgMatch;
      if (isSafeImageUrl(src)) {
        const { alt, align } = parsePromptImageAlt(rawAlt);
        out.push(
          <PromptImage
            key={key++}
            src={src}
            alt={alt}
            align={align}
            onOpen={(s, a) => setLightbox({ src: s, alt: a })}
          />,
        );
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

  // Wrap in a block-level span so floated images are contained within the
  // prompt's bounding box: the trailing zero-height div with `clear: both`
  // is a classic float clearfix that stops a tall floated image from
  // spilling text into the next prompt or UI element below. The lightbox
  // is rendered as a sibling at the end so it sits above everything else
  // when active.
  return (
    <span style={{ display: 'block' }}>
      {out}
      <span style={{ display: 'block', clear: 'both' }} />
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </span>
  );
}
