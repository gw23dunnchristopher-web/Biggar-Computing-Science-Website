import { useEffect, type ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export default function Modal({ open, title, onClose, children, footer, width = 460 }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div onMouseDown={onClose} style={overlay} role="dialog" aria-modal="true" aria-label={title}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          ...dialog,
          maxWidth: width,
          // Never allow the dialog to overflow the viewport. The body scrolls
          // instead, keeping the header and footer pinned in view so users can
          // always see the title and Save / Done buttons.
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={header}>
          <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={closeBtn}>×</button>
        </div>
        <div style={{
          padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12,
          overflowY: 'auto', minHeight: 0, flex: 1,
        }}>
          {children}
        </div>
        {footer && <div style={footerBar}>{footer}</div>}
      </div>
    </div>
  );
}

export const modalPrimaryBtn: React.CSSProperties = {
  background: 'var(--cw-accent)', color: '#fff', border: 'none',
  padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
};
export const modalSecondaryBtn: React.CSSProperties = {
  background: '#f1f5f9', color: 'var(--cw-ink)', border: '1px solid var(--cw-border)',
  padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
};
export const modalDangerBtn: React.CSSProperties = {
  background: 'var(--cw-danger, #dc2626)', color: '#fff', border: 'none',
  padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
};
export const modalLabel: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--cw-muted)',
};
export const modalInput: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid var(--cw-border)',
  borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
};

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: 16,
};
const dialog: React.CSSProperties = {
  width: '100%', background: '#fff', borderRadius: 12,
  boxShadow: '0 20px 60px rgba(15,23,42,0.25)', overflow: 'hidden',
};
const header: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 18px', borderBottom: '1px solid var(--cw-border)',
};
const closeBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', fontSize: 22, lineHeight: 1,
  cursor: 'pointer', color: 'var(--cw-muted)', padding: 0,
};
const footerBar: React.CSSProperties = {
  display: 'flex', justifyContent: 'flex-end', gap: 8,
  padding: '12px 18px', borderTop: '1px solid var(--cw-border)', background: '#f8fafc',
};
