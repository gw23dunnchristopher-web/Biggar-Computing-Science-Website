/**
 * FormDesignCanvas — visual drag-and-drop form designer (Access Design View style).
 * Labels and controls are independently draggable, resizable, and styleable.
 * 8 resize handles per element (4 corners + 4 edges), snapped to 8px grid.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Save, ImageIcon, Trash2, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FieldStyle {
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  color?: string;
  bgColor?: string;
  borderColor?: string;
}

export interface FormFieldDef {
  fieldName: string;
  label: string;
  visible: boolean;
  sortOrder: number;
  fieldType?: string;
  // Control position & size
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // Label position & size (independent from control)
  labelX?: number;
  labelY?: number;
  labelWidth?: number;
  labelHeight?: number;
  labelStyle?: FieldStyle;
  controlStyle?: FieldStyle;
}

export interface FormImageDef {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  fields: FormFieldDef[];
  images: FormImageDef[];
  formBgColor?: string;
  accentColor?: string;
  onSave: (fields: FormFieldDef[], images: FormImageDef[], bgColor: string) => Promise<void>;
  isSaving: boolean;
}

const GRID = 8;
const CANVAS_W = 700;
const DEFAULT_LBL_W = 120;
const DEFAULT_CTRL_W = 200;
const DEFAULT_H = 28;
const ROW_GAP = 52;
const MIN_W = 24;
const MIN_H = 16;

function snap(v: number) { return Math.round(v / GRID) * GRID; }
function clampW(v: number) { return Math.max(MIN_W, snap(v)); }
function clampH(v: number) { return Math.max(MIN_H, snap(v)); }
function clampX(v: number) { return Math.max(0, snap(v)); }
function clampY(v: number) { return Math.max(0, snap(v)); }

// 8 resize handle descriptors: [dx affects x/w?, dy affects y/h?, cursor]
const HANDLES: { id: string; style: React.CSSProperties; cursor: string }[] = [
  { id: 'nw', style: { top: -4, left: -4 },                                           cursor: 'nw-resize' },
  { id: 'n',  style: { top: -4, left: '50%', transform: 'translateX(-50%)' },         cursor: 'n-resize'  },
  { id: 'ne', style: { top: -4, right: -4 },                                          cursor: 'ne-resize' },
  { id: 'e',  style: { right: -4, top: '50%', transform: 'translateY(-50%)' },        cursor: 'e-resize'  },
  { id: 'se', style: { bottom: -4, right: -4 },                                       cursor: 'se-resize' },
  { id: 's',  style: { bottom: -4, left: '50%', transform: 'translateX(-50%)' },      cursor: 's-resize'  },
  { id: 'sw', style: { bottom: -4, left: -4 },                                        cursor: 'sw-resize' },
  { id: 'w',  style: { left: -4, top: '50%', transform: 'translateY(-50%)' },         cursor: 'w-resize'  },
];

type DragMode = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragState {
  id: string;
  mode: DragMode;
  sx: number; sy: number;   // start mouse
  ox: number; oy: number;   // original x, y
  ow: number; oh: number;   // original width, height
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      {children}
    </div>
  );
}

function StyleButtons({ style, onChange }: { style: FieldStyle; onChange: (u: Partial<FieldStyle>) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <button
        onClick={() => onChange({ bold: !style.bold })}
        title="Bold"
        className={`w-6 h-6 rounded border text-xs font-bold ${style.bold ? 'bg-gray-200 border-gray-400' : 'border-gray-200 hover:bg-gray-50'}`}
      >B</button>
      <button
        onClick={() => onChange({ italic: !style.italic })}
        title="Italic"
        className={`w-6 h-6 rounded border text-xs italic ${style.italic ? 'bg-gray-200 border-gray-400' : 'border-gray-200 hover:bg-gray-50'}`}
      >I</button>
      <input
        type="number" min={8} max={36} value={style.fontSize ?? 13}
        onChange={e => onChange({ fontSize: Number(e.target.value) })}
        className="w-12 border border-gray-200 rounded px-1 py-0.5 text-xs"
        title="Font size"
      />
      <input
        type="color" value={style.color ?? '#222222'}
        onChange={e => onChange({ color: e.target.value })}
        className="w-6 h-6 rounded border border-gray-200 cursor-pointer p-0"
        title="Text colour"
      />
    </div>
  );
}

/** Migrate old-format field (x = pair left) to new independent format */
function migrateField(f: FormFieldDef, i: number): FormFieldDef {
  const baseY = i * ROW_GAP + 20;
  if (f.labelX !== undefined) {
    return {
      ...f,
      x: f.x ?? 10,
      y: f.y ?? baseY,
      width: f.width ?? DEFAULT_CTRL_W,
      height: f.height ?? DEFAULT_H,
      labelWidth: f.labelWidth ?? DEFAULT_LBL_W,
      labelHeight: f.labelHeight ?? (f.height ?? DEFAULT_H),
    };
  }
  // Old format: x was the pair left edge
  const pairX = f.x ?? 10;
  const pairY = f.y ?? baseY;
  const lw = DEFAULT_LBL_W;
  const h = f.height ?? DEFAULT_H;
  return {
    ...f,
    labelX: pairX,
    labelY: pairY,
    labelWidth: lw,
    labelHeight: h,
    x: pairX + lw + 4,
    y: pairY,
    width: f.width ?? DEFAULT_CTRL_W,
    height: h,
  };
}

export function FormDesignCanvas({ fields, images, formBgColor = '#ffffff', accentColor = '#2e7d32', onSave, isSaving }: Props) {
  const [designFields, setDesignFields] = useState<FormFieldDef[]>(() =>
    fields.map((f, i) => migrateField(f, i))
  );
  const [designImages, setDesignImages] = useState<FormImageDef[]>(images);
  const [bgColor, setBgColor] = useState(formBgColor || '#ffffff');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [showAddImg, setShowAddImg] = useState(false);
  const [newImgUrl, setNewImgUrl] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Drag / resize state machine ─────────────────────────────────────
  const startInteraction = useCallback((id: string, mode: DragMode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);

    let ox = 0, oy = 0, ow = 0, oh = 0;
    if (id.startsWith('lbl-')) {
      const fn = id.slice(4);
      const f = designFields.find(f => f.fieldName === fn);
      if (f) { ox = f.labelX ?? 10; oy = f.labelY ?? 10; ow = f.labelWidth ?? DEFAULT_LBL_W; oh = f.labelHeight ?? DEFAULT_H; }
    } else if (id.startsWith('ctl-')) {
      const fn = id.slice(4);
      const f = designFields.find(f => f.fieldName === fn);
      if (f) { ox = f.x ?? 10; oy = f.y ?? 10; ow = f.width ?? DEFAULT_CTRL_W; oh = f.height ?? DEFAULT_H; }
    } else if (id.startsWith('img-')) {
      const img = designImages.find(i => i.id === id.slice(4));
      if (img) { ox = img.x; oy = img.y; ow = img.width; oh = img.height; }
    }
    setDrag({ id, mode, sx: e.clientX, sy: e.clientY, ox, oy, ow, oh });
  }, [designFields, designImages]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!drag) return;
    const rawDx = e.clientX - drag.sx;
    const rawDy = e.clientY - drag.sy;

    let nx = drag.ox, ny = drag.oy, nw = drag.ow, nh = drag.oh;

    if (drag.mode === 'move') {
      nx = clampX(drag.ox + rawDx);
      ny = clampY(drag.oy + rawDy);
    } else {
      // Resize
      if (drag.mode === 'nw' || drag.mode === 'sw' || drag.mode === 'w') {
        const dw = snap(rawDx);
        nw = Math.max(MIN_W, drag.ow - dw);
        if (nw !== drag.ow) nx = clampX(drag.ox + drag.ow - nw);
      }
      if (drag.mode === 'ne' || drag.mode === 'se' || drag.mode === 'e') {
        nw = clampW(drag.ow + rawDx);
      }
      if (drag.mode === 'nw' || drag.mode === 'ne' || drag.mode === 'n') {
        const dh = snap(rawDy);
        nh = Math.max(MIN_H, drag.oh - dh);
        if (nh !== drag.oh) ny = clampY(drag.oy + drag.oh - nh);
      }
      if (drag.mode === 'sw' || drag.mode === 'se' || drag.mode === 's') {
        nh = clampH(drag.oh + rawDy);
      }
    }

    const { id } = drag;
    if (id.startsWith('lbl-')) {
      const fn = id.slice(4);
      setDesignFields(prev => prev.map(f => f.fieldName === fn
        ? { ...f, labelX: nx, labelY: ny, labelWidth: nw, labelHeight: nh } : f));
    } else if (id.startsWith('ctl-')) {
      const fn = id.slice(4);
      setDesignFields(prev => prev.map(f => f.fieldName === fn
        ? { ...f, x: nx, y: ny, width: nw, height: nh } : f));
    } else if (id.startsWith('img-')) {
      const imgId = id.slice(4);
      setDesignImages(prev => prev.map(i => i.id === imgId
        ? { ...i, x: nx, y: ny, width: nw, height: nh } : i));
    }
  }, [drag]);

  const stopDrag = useCallback(() => setDrag(null), []);

  useEffect(() => {
    if (!drag) return;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, [drag, onMouseMove, stopDrag]);

  // ── Helpers ─────────────────────────────────────────────────────────
  const updateField = (fn: string, u: Partial<FormFieldDef>) =>
    setDesignFields(prev => prev.map(f => f.fieldName === fn ? { ...f, ...u } : f));

  const patchStyle = (fn: string, part: 'labelStyle' | 'controlStyle', u: Partial<FieldStyle>) =>
    setDesignFields(prev => prev.map(f => f.fieldName === fn ? { ...f, [part]: { ...(f[part] ?? {}), ...u } } : f));

  const updateImage = (id: string, u: Partial<FormImageDef>) =>
    setDesignImages(prev => prev.map(i => i.id === id ? { ...i, ...u } : i));

  const addImage = () => {
    const url = newImgUrl.trim();
    if (!url) return;
    const maxY = Math.max(20,
      ...designFields.filter(f => f.visible).map(f => (f.y ?? 0) + (f.height ?? DEFAULT_H) + 20),
      ...designImages.map(i => i.y + i.height + 20)
    );
    const id = `im${Date.now()}`;
    setDesignImages(prev => [...prev, { id, src: url, x: 10, y: maxY, width: 160, height: 120 }]);
    setSelectedId(`img-${id}`);
    setNewImgUrl('');
    setShowAddImg(false);
  };

  // ── Derived selection ─────────────────────────────────────────────
  const selFieldName = selectedId?.startsWith('lbl-') ? selectedId.slice(4)
    : selectedId?.startsWith('ctl-') ? selectedId.slice(4) : null;
  const selPart: 'label' | 'control' | null = selectedId?.startsWith('lbl-') ? 'label'
    : selectedId?.startsWith('ctl-') ? 'control' : null;
  const selField = selFieldName ? designFields.find(f => f.fieldName === selFieldName) ?? null : null;
  const selImage = selectedId?.startsWith('img-') ? designImages.find(i => i.id === selectedId.slice(4)) ?? null : null;

  const canvasMinH = Math.max(
    480,
    ...designFields.filter(f => f.visible).flatMap(f => [
      (f.labelY ?? 0) + (f.labelHeight ?? DEFAULT_H) + 60,
      (f.y ?? 0) + (f.height ?? DEFAULT_H) + 60,
    ]),
    ...designImages.map(i => i.y + i.height + 40)
  );

  const hiddenFields = designFields.filter(f => !f.visible);

  // ── Render a draggable element with 8 resize handles ──────────────
  const renderHandles = (id: string, e: React.MouseEvent<HTMLElement> | null, forElement: true) => (
    <>
      {HANDLES.map(h => (
        <div
          key={h.id}
          style={{
            position: 'absolute', width: 8, height: 8,
            backgroundColor: '#ff8c00', border: '1px solid #c55a11',
            cursor: h.cursor, zIndex: 100,
            ...h.style,
          }}
          onMouseDown={ev => startInteraction(id, h.id as DragMode, ev)}
        />
      ))}
    </>
  );

  return (
    <div className="flex h-full overflow-hidden select-none" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Design canvas area ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-4" style={{ background: '#c0c0c0' }}>

        {/* Toolbar */}
        <div className="mb-2 flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => setShowAddImg(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm"
          >
            <ImageIcon size={12} /> Add Image
          </button>
          <label className="flex items-center gap-1.5 text-gray-600">
            Background:
            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
              className="w-6 h-6 rounded border border-gray-300 cursor-pointer p-0" title="Form background colour" />
          </label>
          {hiddenFields.length > 0 && (
            <div className="flex items-center gap-1 text-gray-500">
              <span className="font-medium">Show:</span>
              {hiddenFields.map(f => (
                <button key={f.fieldName} onClick={() => updateField(f.fieldName, { visible: true })}
                  className="px-1.5 py-0.5 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                  {f.label}
                </button>
              ))}
            </div>
          )}
          <div className="ml-auto">
            <Button size="sm" onClick={() => onSave(designFields, designImages, bgColor)} disabled={isSaving}
              className="h-7 text-xs text-white hover:opacity-90" style={{ backgroundColor: accentColor }}>
              <Save size={13} className="mr-1" />
              {isSaving ? 'Saving…' : 'Save Design'}
            </Button>
          </div>
        </div>

        {/* Add-image URL bar */}
        {showAddImg && (
          <div className="mb-2 flex items-center gap-2 bg-white border border-gray-300 rounded px-3 py-2 shadow-sm">
            <input type="url" value={newImgUrl} onChange={e => setNewImgUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addImage()}
              placeholder="Paste image URL (https://…)"
              className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400" autoFocus />
            <button onClick={addImage} className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Add</button>
            <button onClick={() => setShowAddImg(false)} className="text-gray-400 hover:text-gray-700 text-sm px-1">✕</button>
          </div>
        )}

        {/* Canvas */}
        <div ref={canvasRef} className="relative border border-gray-500 shadow-xl"
          style={{
            width: CANVAS_W, minHeight: canvasMinH, backgroundColor: bgColor,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
          onClick={() => setSelectedId(null)}
        >

          {/* Visible fields — label and control rendered as separate absolute elements */}
          {designFields.filter(f => f.visible).map(fd => {
            const lx = fd.labelX ?? 10;
            const ly = fd.labelY ?? 10;
            const lw = fd.labelWidth ?? DEFAULT_LBL_W;
            const lh = fd.labelHeight ?? DEFAULT_H;
            const cx = fd.x ?? 10;
            const cy = fd.y ?? 10;
            const cw = fd.width ?? DEFAULT_CTRL_W;
            const ch = fd.height ?? DEFAULT_H;
            const ls = fd.labelStyle ?? {};
            const cs = fd.controlStyle ?? {};
            const lblSelected = selectedId === `lbl-${fd.fieldName}`;
            const ctlSelected = selectedId === `ctl-${fd.fieldName}`;

            return (
              <React.Fragment key={fd.fieldName}>
                {/* Label */}
                <div
                  style={{
                    position: 'absolute', left: lx, top: ly, width: lw, height: lh,
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    paddingRight: 4, boxSizing: 'border-box', cursor: 'move',
                    fontWeight: ls.bold ? 'bold' : 'normal', fontStyle: ls.italic ? 'italic' : 'normal',
                    fontSize: ls.fontSize ?? 13, color: ls.color ?? '#222',
                    backgroundColor: ls.bgColor ?? 'transparent',
                    outline: lblSelected ? '2px solid #ff8c00' : '1px dashed rgba(0,0,0,0.15)',
                    outlineOffset: 1, zIndex: lblSelected ? 20 : 2,
                  }}
                  onMouseDown={e => startInteraction(`lbl-${fd.fieldName}`, 'move', e)}
                  onClick={e => { e.stopPropagation(); setSelectedId(`lbl-${fd.fieldName}`); }}
                >
                  {fd.label}:
                  {lblSelected && renderHandles(`lbl-${fd.fieldName}`, null, true)}
                </div>

                {/* Control */}
                <div
                  style={{
                    position: 'absolute', left: cx, top: cy, width: cw, height: ch,
                    display: 'flex', alignItems: 'center', paddingLeft: 5, paddingRight: 4,
                    boxSizing: 'border-box', cursor: 'move', overflow: 'hidden',
                    border: `1px solid ${ctlSelected ? '#ff8c00' : (cs.borderColor ?? '#aaa')}`,
                    backgroundColor: cs.bgColor ?? '#fff',
                    fontWeight: cs.bold ? 'bold' : 'normal', fontStyle: cs.italic ? 'italic' : 'normal',
                    fontSize: cs.fontSize ?? 13, color: cs.color ?? '#555',
                    outline: ctlSelected ? '2px solid #ff8c00' : 'none',
                    outlineOffset: 1, zIndex: ctlSelected ? 20 : 2,
                  }}
                  onMouseDown={e => startInteraction(`ctl-${fd.fieldName}`, 'move', e)}
                  onClick={e => { e.stopPropagation(); setSelectedId(`ctl-${fd.fieldName}`); }}
                >
                  {fd.fieldType === 'boolean'
                    ? <input type="checkbox" disabled className="w-3.5 h-3.5 pointer-events-none" />
                    : fd.fieldType === 'attachment'
                    ? <span className="text-xs text-blue-400 italic">🖼 [Image]</span>
                    : <span className="text-xs text-gray-400 truncate">
                        {fd.fieldType === 'autonumber' ? '(Auto)' : `${fd.label}…`}
                      </span>
                  }
                  {ctlSelected && renderHandles(`ctl-${fd.fieldName}`, null, true)}
                </div>
              </React.Fragment>
            );
          })}

          {/* Images */}
          {designImages.map(img => {
            const isSelected = selectedId === `img-${img.id}`;
            return (
              <div key={img.id}
                style={{
                  position: 'absolute', left: img.x, top: img.y, width: img.width, height: img.height,
                  cursor: 'move', overflow: 'hidden', zIndex: isSelected ? 20 : 2,
                  outline: isSelected ? '2px solid #ff8c00' : 'none', outlineOffset: 1,
                }}
                onMouseDown={e => startInteraction(`img-${img.id}`, 'move', e)}
                onClick={e => { e.stopPropagation(); setSelectedId(`img-${img.id}`); }}
              >
                <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }} />
                {isSelected && renderHandles(`img-${img.id}`, null, true)}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Properties panel ────────────────────────────────────────────── */}
      <div className="w-60 flex-none bg-white border-l border-gray-300 overflow-y-auto flex flex-col text-xs">
        <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
          Properties
        </div>

        {!selectedId && (
          <div className="p-3 text-gray-400 italic text-xs">
            Click a <strong>label</strong> or <strong>control</strong> to select it independently.
          </div>
        )}

        {/* ── Label properties ── */}
        {selField && selPart === 'label' && (() => {
          const fn = selField.fieldName;
          const ls = selField.labelStyle ?? {};
          return (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#ff8c00]">Label — {fn}</span>
                <button onClick={() => { updateField(fn, { visible: false }); setSelectedId(null); }}
                  className="text-gray-400 hover:text-red-500" title="Hide field">
                  <EyeOff size={13} />
                </button>
              </div>

              <PropRow label="Label text">
                <input type="text" value={selField.label}
                  onChange={e => updateField(fn, { label: e.target.value })}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-orange-400" />
              </PropRow>

              <PropRow label="Font">
                <StyleButtons style={ls} onChange={u => patchStyle(fn, 'labelStyle', u)} />
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-gray-400">Fill:</span>
                  <input type="color" value={ls.bgColor ?? '#ffffff00'}
                    onChange={e => patchStyle(fn, 'labelStyle', { bgColor: e.target.value })}
                    className="w-6 h-6 rounded border border-gray-200 cursor-pointer p-0" title="Label background" />
                </div>
              </PropRow>

              <PropRow label="Size (px)">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-gray-400">W:</span>
                  <input type="number" min={24} max={500} step={8} value={selField.labelWidth ?? DEFAULT_LBL_W}
                    onChange={e => updateField(fn, { labelWidth: Number(e.target.value) })}
                    className="w-16 border border-gray-200 rounded px-1 py-0.5 text-xs" />
                  <span className="text-gray-400">H:</span>
                  <input type="number" min={16} max={200} step={8} value={selField.labelHeight ?? DEFAULT_H}
                    onChange={e => updateField(fn, { labelHeight: Number(e.target.value) })}
                    className="w-14 border border-gray-200 rounded px-1 py-0.5 text-xs" />
                </div>
              </PropRow>

              <PropRow label="Position (px)">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-gray-400">X:</span>
                  <input type="number" min={0} max={CANVAS_W - 20} step={8} value={selField.labelX ?? 10}
                    onChange={e => updateField(fn, { labelX: Number(e.target.value) })}
                    className="w-16 border border-gray-200 rounded px-1 py-0.5 text-xs" />
                  <span className="text-gray-400">Y:</span>
                  <input type="number" min={0} max={2000} step={8} value={selField.labelY ?? 10}
                    onChange={e => updateField(fn, { labelY: Number(e.target.value) })}
                    className="w-14 border border-gray-200 rounded px-1 py-0.5 text-xs" />
                </div>
              </PropRow>

              <div className="pt-1 border-t border-gray-100">
                <button
                  onClick={() => setSelectedId(`ctl-${fn}`)}
                  className="text-xs text-blue-500 hover:underline"
                >→ Select control instead</button>
              </div>
            </div>
          );
        })()}

        {/* ── Control properties ── */}
        {selField && selPart === 'control' && (() => {
          const fn = selField.fieldName;
          const cs = selField.controlStyle ?? {};
          return (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#2563eb]">Control — {fn}</span>
                <button onClick={() => { updateField(fn, { visible: false }); setSelectedId(null); }}
                  className="text-gray-400 hover:text-red-500" title="Hide field">
                  <EyeOff size={13} />
                </button>
              </div>

              <PropRow label="Font">
                <StyleButtons style={cs} onChange={u => patchStyle(fn, 'controlStyle', u)} />
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-gray-400">Fill:</span>
                  <input type="color" value={cs.bgColor ?? '#ffffff'}
                    onChange={e => patchStyle(fn, 'controlStyle', { bgColor: e.target.value })}
                    className="w-6 h-6 rounded border border-gray-200 cursor-pointer p-0" title="Control background" />
                  <span className="text-gray-400">Border:</span>
                  <input type="color" value={cs.borderColor ?? '#aaaaaa'}
                    onChange={e => patchStyle(fn, 'controlStyle', { borderColor: e.target.value })}
                    className="w-6 h-6 rounded border border-gray-200 cursor-pointer p-0" title="Control border" />
                </div>
              </PropRow>

              <PropRow label="Size (px)">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-gray-400">W:</span>
                  <input type="number" min={24} max={560} step={8} value={selField.width ?? DEFAULT_CTRL_W}
                    onChange={e => updateField(fn, { width: Number(e.target.value) })}
                    className="w-16 border border-gray-200 rounded px-1 py-0.5 text-xs" />
                  <span className="text-gray-400">H:</span>
                  <input type="number" min={16} max={200} step={8} value={selField.height ?? DEFAULT_H}
                    onChange={e => updateField(fn, { height: Number(e.target.value) })}
                    className="w-14 border border-gray-200 rounded px-1 py-0.5 text-xs" />
                </div>
              </PropRow>

              <PropRow label="Position (px)">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-gray-400">X:</span>
                  <input type="number" min={0} max={CANVAS_W - 20} step={8} value={selField.x ?? 10}
                    onChange={e => updateField(fn, { x: Number(e.target.value) })}
                    className="w-16 border border-gray-200 rounded px-1 py-0.5 text-xs" />
                  <span className="text-gray-400">Y:</span>
                  <input type="number" min={0} max={2000} step={8} value={selField.y ?? 10}
                    onChange={e => updateField(fn, { y: Number(e.target.value) })}
                    className="w-14 border border-gray-200 rounded px-1 py-0.5 text-xs" />
                </div>
              </PropRow>

              <div className="pt-1 border-t border-gray-100">
                <button
                  onClick={() => setSelectedId(`lbl-${fn}`)}
                  className="text-xs text-orange-500 hover:underline"
                >→ Select label instead</button>
              </div>
            </div>
          );
        })()}

        {/* ── Image properties ── */}
        {selImage && (() => {
          const img = selImage;
          return (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Image</span>
                <button onClick={() => { setDesignImages(prev => prev.filter(i => i.id !== img.id)); setSelectedId(null); }}
                  className="text-gray-400 hover:text-red-500" title="Remove image">
                  <Trash2 size={13} />
                </button>
              </div>
              <PropRow label="URL">
                <input type="url" value={img.src} onChange={e => updateImage(img.id, { src: e.target.value })}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400" />
              </PropRow>
              <PropRow label="Size (px)">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">W:</span>
                  <input type="number" min={20} max={680} step={8} value={img.width}
                    onChange={e => updateImage(img.id, { width: Number(e.target.value) })}
                    className="w-16 border border-gray-200 rounded px-1 py-0.5 text-xs" />
                  <span className="text-gray-400">H:</span>
                  <input type="number" min={20} max={600} step={8} value={img.height}
                    onChange={e => updateImage(img.id, { height: Number(e.target.value) })}
                    className="w-14 border border-gray-200 rounded px-1 py-0.5 text-xs" />
                </div>
              </PropRow>
              <PropRow label="Position (px)">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">X:</span>
                  <input type="number" min={0} step={8} value={img.x}
                    onChange={e => updateImage(img.id, { x: Number(e.target.value) })}
                    className="w-16 border border-gray-200 rounded px-1 py-0.5 text-xs" />
                  <span className="text-gray-400">Y:</span>
                  <input type="number" min={0} step={8} value={img.y}
                    onChange={e => updateImage(img.id, { y: Number(e.target.value) })}
                    className="w-14 border border-gray-200 rounded px-1 py-0.5 text-xs" />
                </div>
              </PropRow>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
