import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
// Vite resolves `?url` to a final asset URL at build time; the worker is
// shipped as a separate file so the main thread isn't blocked while pages
// rasterise.
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Modal, { modalSecondaryBtn, modalPrimaryBtn } from './Modal';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface ManifestSection { name: string; startSlide: number }
interface ManifestV1Slide { index: number; url: string }
interface Manifest {
  version: number;
  // v2 (current uploads): single PDF rendered with PDF.js for fidelity +
  // clickable links.
  pdfUrl?: string;
  // v1 (legacy uploads): per-slide PNG URLs + total count.
  slides?: ManifestV1Slide[];
  slideCount?: number;
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
 * Modal slide viewer. Loads the per-unit manifest JSON and either:
 *   - v2: renders the linked PDF one page at a time with PDF.js, sized to
 *     the available stage and overlaid with transparent <a> tags so any
 *     hyperlinks the teacher placed in PowerPoint stay clickable.
 *   - v1 (legacy): falls back to <img> rendering of the per-slide PNGs we
 *     used to ship before the PDF pipeline existed, so old uploads keep
 *     working without re-uploading.
 *
 * Keyboard nav while the modal is open: ←/→/PageUp/PageDown/Space and
 * Home/End. The page-jump number input doesn't hijack arrow keys (so users
 * can edit the value) but Enter still commits the jump.
 */
export default function PresentationViewer({ open, pagesUrl, unitTitle, filename, onClose }: Props) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [slideCount, setSlideCount] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [jumpInput, setJumpInput] = useState('1');
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [pageRendering, setPageRendering] = useState(false);

  // Refs for the DOM nodes we draw into. The stage div is what
  // ResizeObserver watches; the canvas + link layer are sized to fit
  // inside it.
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const linkLayerRef = useRef<HTMLDivElement | null>(null);
  // Wraps the slide stage + controls so we can request the browser's
  // native fullscreen on just the viewer (not the whole page).
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Bumped on every render request so a stale render that finishes after
  // the user has paged away can detect it should drop its results instead
  // of painting over the new slide.
  const renderTokenRef = useRef(0);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Eagerly load the manifest and PDF as soon as pagesUrl is known — don't
  // wait for the modal to open. This way the first slide is ready to paint the
  // instant the user clicks "View slides" rather than after a visible fetch
  // round-trip. We still gate on pagesUrl so nothing loads when no deck is set.
  useEffect(() => {
    if (!pagesUrl) return;
    let cancelled = false;
    setManifest(null);
    setPdfDoc((prev) => { if (prev) prev.destroy(); return null; });
    setSlideCount(0);
    setLoadErr(null);
    setLoading(true);
    (async () => {
      try {
        const r = await fetch(pagesUrl, { credentials: 'same-origin' });
        if (!r.ok) throw new Error(`Failed to load slides (${r.status})`);
        const m: Manifest = await r.json();
        if (cancelled) return;
        setManifest(m);
        if ((m.version ?? 1) >= 2 && m.pdfUrl) {
          const loadingTask = pdfjsLib.getDocument({
            url: m.pdfUrl,
            // useSystemFonts defaults to true in the browser build, which
            // covers the standard PostScript fonts LibreOffice typically
            // embeds. We deliberately omit cMapUrl/standardFontDataUrl
            // here to avoid an extra CDN dependency; if a deck ever needs
            // them we can copy them out of node_modules at build time.
          });
          const doc = await loadingTask.promise;
          if (cancelled) { doc.destroy(); return; }
          setPdfDoc(doc);
          setSlideCount(doc.numPages);
        } else {
          setSlideCount(m.slideCount || m.slides?.length || 0);
        }
      } catch (e: any) {
        if (!cancelled) setLoadErr(e?.message || 'Could not load slides');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pagesUrl]);

  // Reset to slide 1 each time the modal opens so re-opening always starts
  // from the beginning (the PDF doc itself stays loaded in memory).
  useEffect(() => {
    if (!open) return;
    setSlideIdx(0);
    setJumpInput('1');
  }, [open]);

  // Tear the PDF doc down when the pagesUrl is cleared (unit removed/changed).
  useEffect(() => {
    if (pagesUrl) return;
    setPdfDoc((prev) => { if (prev) prev.destroy(); return null; });
  }, [pagesUrl]);

  // Sync the page-jump input when the user navigates by other means.
  useEffect(() => { setJumpInput(String(slideIdx + 1)); }, [slideIdx]);

  // Track the stage's available size so we can scale the slide to fit.
  // ResizeObserver fires once on attach so this also seeds the initial
  // size — no need for a separate measurement pass.
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const r = e.contentRect;
        setStageSize({ w: r.width, h: r.height });
      }
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [pdfDoc, manifest]); // re-attach if we swap renderers

  // Render the current PDF page (v2 only) onto the canvas + build the
  // link overlay. v1 (img-based) doesn't run this effect because pdfDoc
  // stays null.
  useEffect(() => {
    if (!pdfDoc) return;
    if (stageSize.w <= 0 || stageSize.h <= 0) return;
    const canvas = canvasRef.current;
    const linkLayer = linkLayerRef.current;
    if (!canvas || !linkLayer) return;
    const token = ++renderTokenRef.current;
    let renderTask: RenderTask | null = null;
    setPageRendering(true);
    (async () => {
      try {
        const page = await pdfDoc.getPage(slideIdx + 1);
        if (token !== renderTokenRef.current) return;
        // Fit the page inside the stage (preserve aspect ratio). Pick the
        // smaller scale of width-fit vs height-fit so the slide is always
        // fully visible without scrolling inside the stage.
        const baseViewport = page.getViewport({ scale: 1 });
        const fitScale = Math.min(
          stageSize.w / baseViewport.width,
          stageSize.h / baseViewport.height,
        );
        const viewport = page.getViewport({ scale: fitScale });
        // Use devicePixelRatio for sharp text on hi-dpi screens, then size
        // the canvas via CSS to the on-screen viewport size so layout
        // measurements match.
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.round(viewport.width * dpr));
        canvas.height = Math.max(1, Math.round(viewport.height * dpr));
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderTask = page.render({ canvasContext: ctx as any, viewport, canvas });
        await renderTask.promise;
        if (token !== renderTokenRef.current) return;

        // Build the link overlay. We deliberately don't use PDF.js's
        // AnnotationLayer here — we only need link annotations and the
        // overlay is much simpler (and sturdier across pdfjs versions)
        // when we just position our own <a> elements.
        const annotations = await page.getAnnotations();
        if (token !== renderTokenRef.current) return;
        linkLayer.innerHTML = '';
        linkLayer.style.width = `${viewport.width}px`;
        linkLayer.style.height = `${viewport.height}px`;
        for (const ann of annotations as any[]) {
          if (ann.subtype !== 'Link') continue;
          const url: string | undefined = ann.url;
          if (!url) continue; // skip internal Goto/Named destinations for now
          const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(ann.rect);
          const left = Math.min(x1, x2);
          const top = Math.min(y1, y2);
          const w = Math.abs(x2 - x1);
          const h = Math.abs(y2 - y1);
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.title = url;
          a.setAttribute('aria-label', `Open link: ${url}`);
          a.style.cssText = [
            'position:absolute',
            `left:${left}px`,
            `top:${top}px`,
            `width:${w}px`,
            `height:${h}px`,
            'pointer-events:auto',
            'border:1px solid transparent',
            'border-radius:3px',
            'transition:background-color 120ms,border-color 120ms',
            'cursor:pointer',
          ].join(';');
          a.onmouseenter = () => {
            a.style.backgroundColor = 'rgba(37, 99, 235, 0.16)';
            a.style.borderColor = 'rgba(37, 99, 235, 0.55)';
          };
          a.onmouseleave = () => {
            a.style.backgroundColor = '';
            a.style.borderColor = 'transparent';
          };
          linkLayer.appendChild(a);
        }
      } catch (e: any) {
        if (e?.name === 'RenderingCancelledException') return;
        // eslint-disable-next-line no-console
        console.error('[PresentationViewer] render error:', e);
      } finally {
        if (token === renderTokenRef.current) setPageRendering(false);
      }
    })();
    return () => { try { renderTask?.cancel(); } catch { /* noop */ } };
  }, [pdfDoc, slideIdx, stageSize.w, stageSize.h]);


  // Keyboard nav while the modal is open. We bail out when the user is
  // typing in the page-jump input so number keys don't get hijacked.
  useEffect(() => {
    if (!open || slideCount <= 0) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setSlideIdx((i) => Math.min(slideCount - 1, i + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setSlideIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setSlideIdx(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setSlideIdx(slideCount - 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, slideCount]);

  function go(n: number) {
    if (slideCount <= 0) return;
    setSlideIdx(Math.max(0, Math.min(slideCount - 1, n)));
  }
  function commitJump() {
    const n = parseInt(jumpInput, 10);
    if (Number.isFinite(n) && n >= 1) go(n - 1);
    else setJumpInput(String(slideIdx + 1));
  }

  // Track native fullscreen state so the toggle button label/icon stays in
  // sync even when the user exits via Esc or the browser UI.
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Make sure we exit fullscreen when the modal closes — otherwise the
  // browser keeps the now-empty container fullscreened.
  useEffect(() => {
    if (open) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { /* ignore */ });
    }
  }, [open]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    } catch {
      /* user cancelled or unsupported; nothing else to do */
    }
  }

  // v1 fallback: legacy <img> renderer for decks uploaded before the PDF
  // pipeline existed. Computed up here so popOut() can reference it.
  const isLegacy = manifest && (manifest.version ?? 1) < 2;
  const legacySlide = isLegacy && manifest?.slides ? manifest.slides[slideIdx] : null;

  function popOut() {
    // Prefer the underlying PDF for v2 decks (full browser PDF viewer with
    // built-in zoom, search, print). Fall back to the current slide image
    // for legacy v1 uploads so kids can still get a standalone tab.
    const target = manifest?.pdfUrl || legacySlide?.url;
    if (!target) return;
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  const headerTitle = filename ? `${unitTitle} — ${filename}` : `${unitTitle} — Presentation`;

  return (
    <Modal open={open} title={headerTitle} onClose={onClose} width={1200} fillHeight>
      {loading && <p>Loading slides…</p>}
      {loadErr && <p style={{ color: 'var(--cw-danger)' }}>{loadErr}</p>}
      {!loading && manifest && slideCount === 0 && (
        <p style={{ color: 'var(--cw-muted)' }}>This presentation has no slides.</p>
      )}
      {manifest && slideCount > 0 && (
        <div
          ref={containerRef}
          style={{
            display: 'flex', flexDirection: 'column', gap: 12,
            height: '100%', minHeight: 0,
            // When the browser hands us a fullscreen surface it has no
            // styling of its own, so we paint our own background and add a
            // little padding to keep slides from touching the edges.
            ...(isFullscreen ? {
              background: 'var(--cw-surface, #0f172a)',
              padding: 16,
              boxSizing: 'border-box',
            } : null),
          }}
        >
          {/* Slide stage. The flex:1 + minHeight:0 combo is what lets the
              ResizeObserver report a real height inside a flex column. */}
          <div
            ref={stageRef}
            style={{
              flex: 1, minHeight: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#0f172a', borderRadius: 8, overflow: 'hidden', padding: 8,
              position: 'relative',
            }}
          >
            {pdfDoc ? (
              // PDF.js path: canvas with absolutely-positioned link overlay
              // sitting on top of it. The wrapping div keeps them perfectly
              // aligned regardless of the stage's flex centering.
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '100%' }}>
                <canvas
                  ref={canvasRef}
                  aria-label={`Slide ${slideIdx + 1} of ${slideCount}`}
                  style={{
                    display: 'block', background: '#fff',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  }}
                />
                <div
                  ref={linkLayerRef}
                  aria-hidden={false}
                  style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                />
                {pageRendering && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(15,23,42,0.7)', color: '#fff',
                    padding: '2px 8px', borderRadius: 4, fontSize: 12,
                  }}>Rendering…</div>
                )}
              </div>
            ) : legacySlide ? (
              // v1 legacy renderer (per-slide PNG). No clickable links —
              // teachers can re-upload the deck to get them back.
              <img
                key={slideIdx}
                src={legacySlide.url}
                alt={`Slide ${slideIdx + 1} of ${slideCount}`}
                style={{
                  maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)', background: '#fff',
                }}
              />
            ) : null}
          </div>

          {/* Controls row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '4px 0' }}>
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
              disabled={slideIdx >= slideCount - 1}
              style={{ ...modalPrimaryBtn, opacity: slideIdx >= slideCount - 1 ? 0.5 : 1 }}
              title="Next slide (→ key)"
              aria-label="Next slide"
            >Next ›</button>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
              <span style={{ color: 'var(--cw-muted)', fontSize: 14 }}>Slide</span>
              <input
                type="number"
                min={1}
                max={slideCount}
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
              <span style={{ color: 'var(--cw-muted)', fontSize: 14 }}>of {slideCount}</span>
            </span>

            {/* Spacer pushes the view-mode controls to the right side. */}
            <span style={{ flex: 1 }} />

            <button
              type="button"
              onClick={popOut}
              style={modalSecondaryBtn}
              title="Open the presentation in a new browser tab"
              aria-label="Open in new tab"
            >⤴ Pop out</button>
            <button
              type="button"
              onClick={toggleFullscreen}
              style={modalSecondaryBtn}
              title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >{isFullscreen ? '⤡ Exit fullscreen' : '⛶ Fullscreen'}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
