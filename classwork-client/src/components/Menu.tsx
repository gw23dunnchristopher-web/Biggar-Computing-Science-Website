import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export interface MenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface Props {
  items: MenuItem[];
  label?: ReactNode;
  title?: string;
  buttonStyle?: CSSProperties;
  align?: 'left' | 'right';
}

export default function Menu({ items, label = '⋯', title = 'Actions', buttonStyle, align = 'right' }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const defaultBtn: CSSProperties = {
    background: '#f1f5f9', color: 'var(--cw-ink)',
    border: '1px solid var(--cw-border)', borderRadius: 6,
    padding: '4px 8px', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', lineHeight: 1, minWidth: 28,
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        style={{ ...defaultBtn, ...buttonStyle }}
      >
        {label}
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', zIndex: 50,
            [align]: 0,
            minWidth: 160, background: '#fff',
            border: '1px solid var(--cw-border)', borderRadius: 8,
            boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
            padding: 4, display: 'flex', flexDirection: 'column',
          } as CSSProperties}
        >
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => { setOpen(false); it.onClick(); }}
              style={{
                textAlign: 'left', background: 'transparent', border: 'none',
                padding: '8px 10px', borderRadius: 6, cursor: it.disabled ? 'not-allowed' : 'pointer',
                color: it.danger ? 'var(--cw-danger)' : 'var(--cw-ink)',
                fontSize: 13, fontWeight: 600, opacity: it.disabled ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { if (!it.disabled) (e.currentTarget.style.background = '#f1f5f9'); }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
