import { useEffect, useMemo, useRef, useState } from 'react';
import Modal, { modalSecondaryBtn, modalPrimaryBtn } from './Modal';

interface ManifestSlide { index: number; url: string }
interface ManifestSection { name: string; startSlide: number }
interface Manifest {
  version: number;
  slideCount: number;
  slides: ManifestSlide[];
  sections: ManifestSection[];
  filename?: string;
  uploadedAt?: string;
}

interface Props {
  open: boolean;
  pagesUrl: string | null;
  unitTitle: string;
  filename?: string | null;
  onClose: () => void;
}

/**
 * Modal slide viewer for a unit's PowerPoint presentation. Loads a manifest
 * JSON listing every slide image (and any PowerPoint section markers), then
 * renders a slide at a time with prev/next, page-jump and a section
 * dropdown. Keyboard nav: ←/→ for prev/next, Home/End for first/last,
 * PageUp/PageDown also work.
 *
 * Lazy: the manifest only loads on first open, then the slide images load
 * one at a time as the user navigates. We also pre-fetch the next slide so
 * arrow-key paging feels instant.
 */
export default function PresentationViewer({ open, pagesUrl, unitTitle, filename, onClose }: Props) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0); // 0-based into manifest.slides
  const [jumpInput, setJumpInput] = useState('1');

  // Reset when the modal opens against a new file.
  useEffect(() => {
    if (!open || !pagesUrl) return;
    let cancelled = false;
    setManifest(null);
    setLoadErr(null);
    setLoading(true);
    setSlideIdx(0);
    setJumpInput('1');
    fetch(pagesUrl, { credentials: 'same-origin' })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load slides (${r.status})`);
        return r.json();
      })
      .then((m: Manifest) => {
        if (cancelled) return;
        setManifest(m);
      })
      .catch((e: any) => { if (!cancelled) setLoadErr(e.message || 'Could not load slides'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, pagesUrl]);

  // Keep the jump input in sync as the user navigates by other means.
  useEffect(() => { setJumpInput(String(slideIdx + 1)); }, [slideIdx]);

  // Derived: what section does the current slide belong to?
  const currentSectionIdx = useMemo(() => {
    if (!manifest || manifest.sections.length === 0) return -1;
    const slideNum = slideIdx + 1; // 1-based
    let idx = -1;
    for (let i = 0; i < manifest.sections.length; i++) {
      if (manifest.sections[i].startSlide <= slideNum) idx = i;
      else break;
    }
    return idx;
  }, [manifest, slideIdx]);

  // Pre-fetch the next slide image so paging feels instant.
  const preloadRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!manifest) return;
    const next = manifest.slides[slideIdx + 1];
    if (!next) return;
    const img = new Image();
    img.src = next.url;
    preloadRef.current = img;
  }, [manifest, slideIdx]);

  // Keyboard nav while the modal is open.
  useEffect(() => {
    if (!open || !manifest) return;
    function onKey(e: KeyboardEvent) {
      // Don't hijack typing inside the page-jump input.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setSlideIdx((i) => Math.min(manifest!.slideCount - 1, i + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setSlideIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setSlideIdx(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setSlideIdx(manifest!.slideCount - 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, manifest]);

  function go(n: number) {
    if (!manifest) return;
    const clamped = Math.max(0, Math.min(manifest.slideCount - 1, n));
    setSlideIdx(clamped);
  }

  function commitJump() {
    const n = parseInt(jumpInput, 10);
    if (Number.isFinite(n) && n >= 1) go(n - 1);
    else setJumpInput(String(slideIdx + 1));
  }

  // Title shows the deck filename when we have one, otherwise the unit title.
  const headerTitle = filename
    ? `${unitTitle} — ${filename}`
    : `${unitTitle} — Presentation`;

  return (
    <Modal open={open} title={headerTitle} onClose={onClose} width={1200} fillHeight>
      {loading && <p>Loading slides…</p>}
      {loadErr && <p style={{ color: 'var(--cw-danger)' }}>{loadErr}</p>}
      {manifest && manifest.slideCount === 0 && (
        <p style={{ color: 'var(--cw-muted)' }}>This presentation has no slides.</p>
      )}
      {manifest && manifest.slideCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', minHeight: 0 }}>
          {/* Slide canvas */}
          <div style={{
            flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0f172a', borderRadius: 8, overflow: 'hidden', padding: 8,
          }}>
            <img
              key={slideIdx}
              src={manifest.slides[slideIdx].url}
              alt={`Slide ${slideIdx + 1} of ${manifest.slideCount}`}
              style={{
                maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)', background: '#fff',
              }}
            />
          </div>

          {/* Controls row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            padding: '4px 0',
          }}>
            <button
              type="button"
              onClick={() => go(slideIdx - 1)}
              disabled={slideIdx === 0}
              style={{ ...modalSecondaryBtn, opacity: slideIdx === 0 ? 0.5 : 1 }}
              title="Previous slide (← key)"
              aria-label="Previous slide"
            >‹ Prev</button>
            <button
              type="button"
              onClick={() => go(slideIdx + 1)}
              disabled={slideIdx >= manifest.slideCount - 1}
              style={{ ...modalPrimaryBtn, opacity: slideIdx >= manifest.slideCount - 1 ? 0.5 : 1 }}
              title="Next slide (→ key)"
              aria-label="Next slide"
            >Next ›</button>

            {/* Page jump. Submit on Enter or blur; clamps invalid values back
                to the current slide so users see their bad input rejected. */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
              <span style={{ color: 'var(--cw-muted)', fontSize: 14 }}>Slide</span>
              <input
                type="number"
                min={1}
                max={manifest.slideCount}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitJump(); } }}
                onBlur={commitJump}
                style={{
                  width: 64, padding: '6px 8px', borderRadius: 6,
                  border: '1px solid var(--cw-border)', textAlign: 'right', fontSize: 14,
                }}
                aria-label="Jump to slide"
              />
              <span style={{ color: 'var(--cw-muted)', fontSize: 14 }}>of {manifest.slideCount}</span>
            </span>

            {/* Section dropdown only appears when the deck has sections. */}
            {manifest.sections.length > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                <label htmlFor="cw-pres-section" style={{ color: 'var(--cw-muted)', fontSize: 14 }}>Section</label>
                <select
                  id="cw-pres-section"
                  value={currentSectionIdx >= 0 ? currentSectionIdx : ''}
                  onChange={(e) => {
                    const i = parseInt(e.target.value, 10);
                    if (Number.isFinite(i) && manifest.sections[i]) {
                      go(manifest.sections[i].startSlide - 1);
                    }
                  }}
                  style={{
                    padding: '6px 8px', borderRadius: 6,
                    border: '1px solid var(--cw-border)', fontSize: 14, maxWidth: 240,
                  }}
                >
                  {currentSectionIdx === -1 && (
                    <option value="">— before first section —</option>
                  )}
                  {manifest.sections.map((s, i) => (
                    <option key={i} value={i}>
                      {s.name} (slide {s.startSlide})
                    </option>
                  ))}
                </select>
              </span>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
