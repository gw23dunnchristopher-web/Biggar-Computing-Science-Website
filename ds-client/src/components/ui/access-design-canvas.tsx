import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface FieldStyle {
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  color?: string;
  bgColor?: string;
  borderColor?: string;
}

export interface DesignFieldDef {
  fieldName: string;
  label: string;
  visible: boolean;
  sortOrder: number;
  fieldType?: string;
  section?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  labelX?: number;
  labelY?: number;
  labelWidth?: number;
  labelHeight?: number;
  labelStyle?: FieldStyle;
  controlStyle?: FieldStyle;
}

export interface DesignImageDef {
  id: string;
  src: string;
  section?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DesignLabelDef {
  id: string;
  text: string;
  section: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style?: FieldStyle;
}

interface SectionDef {
  id: string;
  name: string;
  height: number;
  collapsed: boolean;
}

interface Props {
  mode: 'form' | 'report';
  objectName: string;
  fields: DesignFieldDef[];
  images?: DesignImageDef[];
  freeLabels?: DesignLabelDef[];
  accentColor?: string;
  onSave: (fields: DesignFieldDef[], images: DesignImageDef[], freeLabels: DesignLabelDef[]) => void;
  isSaving: boolean;
}

const GRID = 8;
const CANVAS_W = 700;
const DEFAULT_LBL_W = 100;
const DEFAULT_CTRL_W = 180;
const DEFAULT_H = 24;
const ROW_GAP = 36;
const MIN_W = 16;
const MIN_H = 16;
const SECTION_BAR_H = 22;

function snap(v: number) { return Math.round(v / GRID) * GRID; }
function clampW(v: number) { return Math.max(MIN_W, snap(v)); }
function clampH(v: number) { return Math.max(MIN_H, snap(v)); }
function clampX(v: number) { return Math.max(0, snap(v)); }
function clampY(v: number) { return Math.max(0, snap(v)); }

const HANDLES: { id: string; style: React.CSSProperties; cursor: string }[] = [
  { id: 'nw', style: { top: -3, left: -3 }, cursor: 'nw-resize' },
  { id: 'n', style: { top: -3, left: '50%', transform: 'translateX(-50%)' }, cursor: 'n-resize' },
  { id: 'ne', style: { top: -3, right: -3 }, cursor: 'ne-resize' },
  { id: 'e', style: { right: -3, top: '50%', transform: 'translateY(-50%)' }, cursor: 'e-resize' },
  { id: 'se', style: { bottom: -3, right: -3 }, cursor: 'se-resize' },
  { id: 's', style: { bottom: -3, left: '50%', transform: 'translateX(-50%)' }, cursor: 's-resize' },
  { id: 'sw', style: { bottom: -3, left: -3 }, cursor: 'sw-resize' },
  { id: 'w', style: { left: -3, top: '50%', transform: 'translateY(-50%)' }, cursor: 'w-resize' },
];

type DragMode = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragState {
  id: string;
  mode: DragMode;
  sx: number; sy: number;
  ox: number; oy: number;
  ow: number; oh: number;
}

function getDefaultSections(mode: 'form' | 'report'): SectionDef[] {
  if (mode === 'form') {
    return [
      { id: 'formHeader', name: 'Form Header', height: 40, collapsed: false },
      { id: 'detail', name: 'Detail', height: 280, collapsed: false },
      { id: 'formFooter', name: 'Form Footer', height: 32, collapsed: false },
    ];
  }
  return [
    { id: 'reportHeader', name: 'Report Header', height: 48, collapsed: false },
    { id: 'pageHeader', name: 'Page Header', height: 28, collapsed: false },
    { id: 'detail', name: 'Detail', height: 240, collapsed: false },
    { id: 'pageFooter', name: 'Page Footer', height: 28, collapsed: false },
    { id: 'reportFooter', name: 'Report Footer', height: 28, collapsed: false },
  ];
}

function migrateField(f: DesignFieldDef, i: number): DesignFieldDef {
  const baseY = i * ROW_GAP + 8;
  if (f.labelX !== undefined && f.section !== undefined) return f;
  const lw = f.labelWidth ?? DEFAULT_LBL_W;
  const h = f.height ?? DEFAULT_H;
  return {
    ...f,
    section: f.section ?? 'detail',
    labelX: f.labelX ?? 8,
    labelY: f.labelY ?? baseY,
    labelWidth: lw,
    labelHeight: f.labelHeight ?? h,
    x: f.x ?? (lw + 16),
    y: f.y ?? baseY,
    width: f.width ?? DEFAULT_CTRL_W,
    height: h,
  };
}

export function AccessDesignCanvas({ mode, objectName, fields, images = [], freeLabels = [], accentColor = '#5d4037', onSave, isSaving }: Props) {
  const [sections, setSections] = useState<SectionDef[]>(() => getDefaultSections(mode));
  const [designFields, setDesignFields] = useState<DesignFieldDef[]>(() =>
    fields.map((f, i) => migrateField(f, i))
  );
  const [designImages, setDesignImages] = useState<DesignImageDef[]>(images);
  const [designLabels, setDesignLabels] = useState<DesignLabelDef[]>(freeLabels);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [sectionResize, setSectionResize] = useState<{ sectionId: string; startY: number; startH: number } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingLabelId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingLabelId]);

  const startInteraction = useCallback((id: string, dragMode: DragMode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);

    let ox = 0, oy = 0, ow = 0, oh = 0;
    if (id.startsWith('lbl-')) {
      const fn = id.slice(4);
      const f = designFields.find(f => f.fieldName === fn);
      if (f) { ox = f.labelX ?? 8; oy = f.labelY ?? 8; ow = f.labelWidth ?? DEFAULT_LBL_W; oh = f.labelHeight ?? DEFAULT_H; }
    } else if (id.startsWith('ctl-')) {
      const fn = id.slice(4);
      const f = designFields.find(f => f.fieldName === fn);
      if (f) { ox = f.x ?? 8; oy = f.y ?? 8; ow = f.width ?? DEFAULT_CTRL_W; oh = f.height ?? DEFAULT_H; }
    } else if (id.startsWith('img-')) {
      const img = designImages.find(i => i.id === id.slice(4));
      if (img) { ox = img.x; oy = img.y; ow = img.width; oh = img.height; }
    } else if (id.startsWith('flbl-')) {
      const fl = designLabels.find(l => l.id === id.slice(5));
      if (fl) { ox = fl.x; oy = fl.y; ow = fl.width; oh = fl.height; }
    }
    setDrag({ id, mode: dragMode, sx: e.clientX, sy: e.clientY, ox, oy, ow, oh });
  }, [designFields, designImages, designLabels]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (sectionResize) {
      const dy = e.clientY - sectionResize.startY;
      setSections(prev => prev.map(s =>
        s.id === sectionResize.sectionId ? { ...s, height: Math.max(20, sectionResize.startH + dy) } : s
      ));
      return;
    }
    if (!drag) return;
    const rawDx = e.clientX - drag.sx;
    const rawDy = e.clientY - drag.sy;

    let nx = drag.ox, ny = drag.oy, nw = drag.ow, nh = drag.oh;

    if (drag.mode === 'move') {
      nx = clampX(drag.ox + rawDx);
      ny = clampY(drag.oy + rawDy);
    } else {
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
    } else if (id.startsWith('flbl-')) {
      const lblId = id.slice(5);
      setDesignLabels(prev => prev.map(l => l.id === lblId
        ? { ...l, x: nx, y: ny, width: nw, height: nh } : l));
    }
  }, [drag, sectionResize]);

  const stopDrag = useCallback(() => {
    setDrag(null);
    setSectionResize(null);
  }, []);

  useEffect(() => {
    if (!drag && !sectionResize) return;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, [drag, sectionResize, onMouseMove, stopDrag]);

  const updateField = (fn: string, u: Partial<DesignFieldDef>) =>
    setDesignFields(prev => prev.map(f => f.fieldName === fn ? { ...f, ...u } : f));

  const handleDoubleClickLabel = (id: string, currentText: string) => {
    setEditingLabelId(id);
    setEditingText(currentText);
  };

  const commitLabelEdit = () => {
    if (!editingLabelId) return;
    if (editingLabelId.startsWith('lbl-')) {
      const fn = editingLabelId.slice(4);
      updateField(fn, { label: editingText });
    } else if (editingLabelId.startsWith('flbl-')) {
      const lblId = editingLabelId.slice(5);
      setDesignLabels(prev => prev.map(l => l.id === lblId ? { ...l, text: editingText } : l));
    }
    setEditingLabelId(null);
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s));
  };

  const addFreeLabel = () => {
    const id = `fl${Date.now()}`;
    setDesignLabels(prev => [...prev, {
      id, text: 'Label', section: 'detail',
      x: 8, y: 8, width: 80, height: DEFAULT_H,
    }]);
    setSelectedId(`flbl-${id}`);
  };

  const addTextBox = () => {
    const name = `TextBox${Date.now()}`;
    setDesignFields(prev => [...prev, {
      fieldName: name,
      label: name,
      visible: true,
      sortOrder: prev.length,
      fieldType: 'text',
      section: 'detail',
      x: DEFAULT_LBL_W + 16,
      y: 8,
      width: DEFAULT_CTRL_W,
      height: DEFAULT_H,
      labelX: 8,
      labelY: 8,
      labelWidth: DEFAULT_LBL_W,
      labelHeight: DEFAULT_H,
    }]);
    setSelectedId(`ctl-${name}`);
  };

  const handleSave = () => {
    onSave(designFields, designImages, designLabels);
  };

  const renderHandles = (id: string) => (
    <>
      {HANDLES.map(h => (
        <div
          key={h.id}
          style={{
            position: 'absolute', width: 7, height: 7,
            backgroundColor: '#ff8c00', border: '1px solid #c55a11',
            cursor: h.cursor, zIndex: 100,
            ...h.style,
          }}
          onMouseDown={ev => startInteraction(id, h.id as DragMode, ev)}
        />
      ))}
    </>
  );

  const selFieldName = selectedId?.startsWith('lbl-') ? selectedId.slice(4)
    : selectedId?.startsWith('ctl-') ? selectedId.slice(4) : null;
  const selPart: 'label' | 'control' | null = selectedId?.startsWith('lbl-') ? 'label'
    : selectedId?.startsWith('ctl-') ? 'control' : null;
  const selField = selFieldName ? designFields.find(f => f.fieldName === selFieldName) ?? null : null;
  const selFreeLabel = selectedId?.startsWith('flbl-') ? designLabels.find(l => l.id === selectedId.slice(5)) ?? null : null;

  const renderSectionContent = (section: SectionDef) => {
    const sectionFields = designFields.filter(f => f.visible && (f.section || 'detail') === section.id);
    const sectionImages = designImages.filter(i => (i.section || 'detail') === section.id);
    const sectionLabels = designLabels.filter(l => l.section === section.id);

    return (
      <div
        style={{
          position: 'relative',
          width: CANVAS_W,
          height: section.height,
          backgroundColor: '#fff',
          backgroundImage: 'radial-gradient(circle, #b8cfe5 0.8px, transparent 0.8px)',
          backgroundSize: `${GRID}px ${GRID}px`,
        }}
        onClick={e => { e.stopPropagation(); setSelectedId(null); }}
      >
        {sectionFields.map(fd => {
          const lx = fd.labelX ?? 8;
          const ly = fd.labelY ?? 8;
          const lw = fd.labelWidth ?? DEFAULT_LBL_W;
          const lh = fd.labelHeight ?? DEFAULT_H;
          const cx = fd.x ?? 8;
          const cy = fd.y ?? 8;
          const cw = fd.width ?? DEFAULT_CTRL_W;
          const ch = fd.height ?? DEFAULT_H;
          const ls = fd.labelStyle ?? {};
          const cs = fd.controlStyle ?? {};
          const lblSelected = selectedId === `lbl-${fd.fieldName}`;
          const ctlSelected = selectedId === `ctl-${fd.fieldName}`;
          const isEditingThisLabel = editingLabelId === `lbl-${fd.fieldName}`;

          return (
            <React.Fragment key={fd.fieldName}>
              <div
                style={{
                  position: 'absolute', left: lx, top: ly, width: lw, height: lh,
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  paddingRight: 4, boxSizing: 'border-box', cursor: 'move',
                  fontWeight: ls.bold ? 'bold' : 'normal', fontStyle: ls.italic ? 'italic' : 'normal',
                  fontSize: ls.fontSize ?? 11, color: ls.color ?? '#000',
                  backgroundColor: ls.bgColor ?? 'transparent',
                  outline: lblSelected ? '2px solid #000' : 'none',
                  zIndex: lblSelected ? 20 : 2,
                }}
                onMouseDown={e => startInteraction(`lbl-${fd.fieldName}`, 'move', e)}
                onClick={e => { e.stopPropagation(); setSelectedId(`lbl-${fd.fieldName}`); }}
                onDoubleClick={e => { e.stopPropagation(); handleDoubleClickLabel(`lbl-${fd.fieldName}`, fd.label); }}
              >
                {isEditingThisLabel ? (
                  <input
                    ref={editInputRef}
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    onBlur={commitLabelEdit}
                    onKeyDown={e => { if (e.key === 'Enter') commitLabelEdit(); if (e.key === 'Escape') setEditingLabelId(null); }}
                    style={{ width: '100%', height: '100%', fontSize: ls.fontSize ?? 11, textAlign: 'right', border: '1px solid #4a90d9', outline: 'none', padding: '0 2px', background: '#fff' }}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                  />
                ) : (
                  <span style={{ userSelect: 'none' }}>{fd.label}</span>
                )}
                {lblSelected && !isEditingThisLabel && renderHandles(`lbl-${fd.fieldName}`)}
              </div>

              <div
                style={{
                  position: 'absolute', left: cx, top: cy, width: cw, height: ch,
                  display: 'flex', alignItems: 'center', paddingLeft: 4,
                  boxSizing: 'border-box', cursor: 'move', overflow: 'hidden',
                  border: `1px solid ${ctlSelected ? '#000' : '#999'}`,
                  backgroundColor: cs.bgColor ?? '#fff',
                  fontSize: cs.fontSize ?? 11, color: cs.color ?? '#000',
                  outline: ctlSelected ? '2px solid #000' : 'none',
                  zIndex: ctlSelected ? 20 : 2,
                }}
                onMouseDown={e => startInteraction(`ctl-${fd.fieldName}`, 'move', e)}
                onClick={e => { e.stopPropagation(); setSelectedId(`ctl-${fd.fieldName}`); }}
              >
                {fd.fieldType === 'boolean'
                  ? <input type="checkbox" disabled className="w-3 h-3 pointer-events-none" />
                  : <span style={{ fontSize: 11, color: '#000', userSelect: 'none' }}>
                      {fd.fieldType === 'autonumber' ? '' : fd.fieldName}
                    </span>
                }
                {ctlSelected && renderHandles(`ctl-${fd.fieldName}`)}
              </div>
            </React.Fragment>
          );
        })}

        {sectionLabels.map(fl => {
          const isSelected = selectedId === `flbl-${fl.id}`;
          const isEditing = editingLabelId === `flbl-${fl.id}`;
          const ls = fl.style ?? {};
          return (
            <div
              key={fl.id}
              style={{
                position: 'absolute', left: fl.x, top: fl.y, width: fl.width, height: fl.height,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                paddingLeft: 4, boxSizing: 'border-box', cursor: 'move',
                fontWeight: ls.bold ? 'bold' : 'normal', fontStyle: ls.italic ? 'italic' : 'normal',
                fontSize: ls.fontSize ?? 11, color: ls.color ?? '#000',
                backgroundColor: ls.bgColor ?? 'transparent',
                outline: isSelected ? '2px solid #000' : 'none',
                zIndex: isSelected ? 20 : 2,
              }}
              onMouseDown={e => startInteraction(`flbl-${fl.id}`, 'move', e)}
              onClick={e => { e.stopPropagation(); setSelectedId(`flbl-${fl.id}`); }}
              onDoubleClick={e => { e.stopPropagation(); handleDoubleClickLabel(`flbl-${fl.id}`, fl.text); }}
            >
              {isEditing ? (
                <input
                  ref={editInputRef}
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  onBlur={commitLabelEdit}
                  onKeyDown={e => { if (e.key === 'Enter') commitLabelEdit(); if (e.key === 'Escape') setEditingLabelId(null); }}
                  style={{ width: '100%', height: '100%', fontSize: ls.fontSize ?? 11, border: '1px solid #4a90d9', outline: 'none', padding: '0 2px', background: '#fff' }}
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                />
              ) : (
                <span style={{ userSelect: 'none' }}>{fl.text}</span>
              )}
              {isSelected && !isEditing && renderHandles(`flbl-${fl.id}`)}
            </div>
          );
        })}

        {sectionImages.map(img => {
          const isSelected = selectedId === `img-${img.id}`;
          return (
            <div
              key={img.id}
              style={{
                position: 'absolute', left: img.x, top: img.y, width: img.width, height: img.height,
                cursor: 'move', overflow: 'hidden', zIndex: isSelected ? 20 : 2,
                outline: isSelected ? '2px solid #000' : 'none',
              }}
              onMouseDown={e => startInteraction(`img-${img.id}`, 'move', e)}
              onClick={e => { e.stopPropagation(); setSelectedId(`img-${img.id}`); }}
            >
              <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }} />
              {isSelected && renderHandles(`img-${img.id}`)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderRuler = () => {
    const ticks: React.ReactNode[] = [];
    for (let i = 0; i <= CANVAS_W; i += 80) {
      const inch = i / 80;
      ticks.push(
        <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: i, top: 0, width: 1, height: 14, backgroundColor: '#666' }} />
          <div style={{ position: 'absolute', left: i + 3, top: 1, fontSize: 9, color: '#555', userSelect: 'none' }}>{inch}</div>
        </React.Fragment>
      );
      if (i + 40 <= CANVAS_W) {
        ticks.push(
          <div key={`${i}-mid`} style={{ position: 'absolute', left: i + 40, top: 4, width: 1, height: 8, backgroundColor: '#999' }} />
        );
      }
    }
    return (
      <div style={{ position: 'relative', height: 16, width: CANVAS_W, backgroundColor: '#f0f0f0', borderBottom: '1px solid #999', marginBottom: 0, flexShrink: 0 }}>
        {ticks}
      </div>
    );
  };

  return (
    <div className="flex h-full overflow-hidden select-none" style={{ fontFamily: 'Segoe UI, Tahoma, sans-serif' }}>
      <div className="flex-1 overflow-auto" style={{ background: '#a0a0a0' }}>
        <div style={{ padding: '8px 12px', minWidth: CANVAS_W + 24 }}>
          {renderRuler()}

          <div ref={canvasRef} style={{ width: CANVAS_W, border: '1px solid #666' }}>
            {sections.map((section, si) => (
              <React.Fragment key={section.id}>
                <div
                  style={{
                    height: SECTION_BAR_H,
                    backgroundColor: '#d4d0c8',
                    borderTop: si > 0 ? '1px solid #808080' : 'none',
                    borderBottom: '1px solid #808080',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 4,
                    cursor: 'default',
                    userSelect: 'none',
                  }}
                >
                  <span
                    onClick={() => toggleSection(section.id)}
                    style={{ cursor: 'pointer', fontSize: 10, marginRight: 4, color: '#333', fontFamily: 'monospace' }}
                  >
                    {section.collapsed ? '►' : '▼'}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#000' }}>{section.name}</span>
                </div>

                {!section.collapsed && (
                  <>
                    {renderSectionContent(section)}
                    <div
                      style={{
                        height: 4,
                        cursor: 'ns-resize',
                        backgroundColor: '#c0c0c0',
                        borderBottom: '1px solid #808080',
                      }}
                      onMouseDown={e => {
                        e.preventDefault();
                        setSectionResize({ sectionId: section.id, startY: e.clientY, startH: section.height });
                      }}
                    />
                  </>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="w-56 flex-none bg-[#f0efe9] border-l border-gray-400 overflow-y-auto flex flex-col text-xs">
        <div style={{ backgroundColor: '#d4d0c8', borderBottom: '1px solid #808080', padding: '4px 8px', fontSize: 11, fontWeight: 600, color: '#000' }}>
          Property Sheet
        </div>

        {!selectedId && !selFreeLabel && (
          <div style={{ padding: 12, color: '#666', fontSize: 11 }}>
            Select a control to view its properties.
          </div>
        )}

        {selField && selPart === 'label' && (() => {
          const fn = selField.fieldName;
          const ls = selField.labelStyle ?? {};
          return (
            <div style={{ padding: 8 }} className="space-y-2">
              <div style={{ fontWeight: 700, fontSize: 11, color: '#333', borderBottom: '1px solid #ccc', paddingBottom: 4 }}>
                Label: {fn}
              </div>
              <PropRow label="Caption">
                <input type="text" value={selField.label}
                  onChange={e => updateField(fn, { label: e.target.value })}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Left">
                <input type="number" min={0} step={GRID} value={selField.labelX ?? 8}
                  onChange={e => updateField(fn, { labelX: Number(e.target.value) })}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Top">
                <input type="number" min={0} step={GRID} value={selField.labelY ?? 8}
                  onChange={e => updateField(fn, { labelY: Number(e.target.value) })}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Width">
                <input type="number" min={MIN_W} step={GRID} value={selField.labelWidth ?? DEFAULT_LBL_W}
                  onChange={e => updateField(fn, { labelWidth: Number(e.target.value) })}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Height">
                <input type="number" min={MIN_H} step={GRID} value={selField.labelHeight ?? DEFAULT_H}
                  onChange={e => updateField(fn, { labelHeight: Number(e.target.value) })}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Font Size">
                <input type="number" min={8} max={36} value={ls.fontSize ?? 11}
                  onChange={e => updateField(fn, { labelStyle: { ...ls, fontSize: Number(e.target.value) } })}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Font Weight">
                <select value={ls.bold ? 'bold' : 'normal'}
                  onChange={e => updateField(fn, { labelStyle: { ...ls, bold: e.target.value === 'bold' } })}
                  className="prop-input">
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                </select>
              </PropRow>
              <PropRow label="Fore Color">
                <input type="color" value={ls.color ?? '#000000'}
                  onChange={e => updateField(fn, { labelStyle: { ...ls, color: e.target.value } })}
                  className="w-full h-5 border border-gray-400 cursor-pointer p-0" />
              </PropRow>
              <PropRow label="Back Color">
                <input type="color" value={ls.bgColor ?? '#ffffff'}
                  onChange={e => updateField(fn, { labelStyle: { ...ls, bgColor: e.target.value } })}
                  className="w-full h-5 border border-gray-400 cursor-pointer p-0" />
              </PropRow>
              <PropRow label="Section">
                <select value={selField.section || 'detail'}
                  onChange={e => updateField(fn, { section: e.target.value })}
                  className="prop-input">
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </PropRow>
              <PropRow label="Visible">
                <select value={selField.visible ? 'Yes' : 'No'}
                  onChange={e => updateField(fn, { visible: e.target.value === 'Yes' })}
                  className="prop-input">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </PropRow>
            </div>
          );
        })()}

        {selField && selPart === 'control' && (() => {
          const fn = selField.fieldName;
          const cs = selField.controlStyle ?? {};
          return (
            <div style={{ padding: 8 }} className="space-y-2">
              <div style={{ fontWeight: 700, fontSize: 11, color: '#333', borderBottom: '1px solid #ccc', paddingBottom: 4 }}>
                Text Box: {fn}
              </div>
              <PropRow label="Name">
                <input type="text" value={fn} readOnly className="prop-input bg-gray-100" />
              </PropRow>
              <PropRow label="Left">
                <input type="number" min={0} step={GRID} value={selField.x ?? 8}
                  onChange={e => updateField(fn, { x: Number(e.target.value) })}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Top">
                <input type="number" min={0} step={GRID} value={selField.y ?? 8}
                  onChange={e => updateField(fn, { y: Number(e.target.value) })}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Width">
                <input type="number" min={MIN_W} step={GRID} value={selField.width ?? DEFAULT_CTRL_W}
                  onChange={e => updateField(fn, { width: Number(e.target.value) })}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Height">
                <input type="number" min={MIN_H} step={GRID} value={selField.height ?? DEFAULT_H}
                  onChange={e => updateField(fn, { height: Number(e.target.value) })}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Font Size">
                <input type="number" min={8} max={36} value={cs.fontSize ?? 11}
                  onChange={e => updateField(fn, { controlStyle: { ...cs, fontSize: Number(e.target.value) } })}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Fore Color">
                <input type="color" value={cs.color ?? '#000000'}
                  onChange={e => updateField(fn, { controlStyle: { ...cs, color: e.target.value } })}
                  className="w-full h-5 border border-gray-400 cursor-pointer p-0" />
              </PropRow>
              <PropRow label="Back Color">
                <input type="color" value={cs.bgColor ?? '#ffffff'}
                  onChange={e => updateField(fn, { controlStyle: { ...cs, bgColor: e.target.value } })}
                  className="w-full h-5 border border-gray-400 cursor-pointer p-0" />
              </PropRow>
              <PropRow label="Border Color">
                <input type="color" value={cs.borderColor ?? '#999999'}
                  onChange={e => updateField(fn, { controlStyle: { ...cs, borderColor: e.target.value } })}
                  className="w-full h-5 border border-gray-400 cursor-pointer p-0" />
              </PropRow>
              <PropRow label="Section">
                <select value={selField.section || 'detail'}
                  onChange={e => updateField(fn, { section: e.target.value })}
                  className="prop-input">
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </PropRow>
              <PropRow label="Visible">
                <select value={selField.visible ? 'Yes' : 'No'}
                  onChange={e => updateField(fn, { visible: e.target.value === 'Yes' })}
                  className="prop-input">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </PropRow>
            </div>
          );
        })()}

        {selFreeLabel && (() => {
          const fl = selFreeLabel;
          const ls = fl.style ?? {};
          return (
            <div style={{ padding: 8 }} className="space-y-2">
              <div style={{ fontWeight: 700, fontSize: 11, color: '#333', borderBottom: '1px solid #ccc', paddingBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span>Label: {fl.text}</span>
                <button onClick={() => { setDesignLabels(prev => prev.filter(l => l.id !== fl.id)); setSelectedId(null); }}
                  style={{ color: '#c00', cursor: 'pointer', fontSize: 11 }}>Delete</button>
              </div>
              <PropRow label="Caption">
                <input type="text" value={fl.text}
                  onChange={e => setDesignLabels(prev => prev.map(l => l.id === fl.id ? { ...l, text: e.target.value } : l))}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Left">
                <input type="number" min={0} step={GRID} value={fl.x}
                  onChange={e => setDesignLabels(prev => prev.map(l => l.id === fl.id ? { ...l, x: Number(e.target.value) } : l))}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Top">
                <input type="number" min={0} step={GRID} value={fl.y}
                  onChange={e => setDesignLabels(prev => prev.map(l => l.id === fl.id ? { ...l, y: Number(e.target.value) } : l))}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Width">
                <input type="number" min={MIN_W} step={GRID} value={fl.width}
                  onChange={e => setDesignLabels(prev => prev.map(l => l.id === fl.id ? { ...l, width: Number(e.target.value) } : l))}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Height">
                <input type="number" min={MIN_H} step={GRID} value={fl.height}
                  onChange={e => setDesignLabels(prev => prev.map(l => l.id === fl.id ? { ...l, height: Number(e.target.value) } : l))}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Font Size">
                <input type="number" min={8} max={36} value={ls.fontSize ?? 11}
                  onChange={e => setDesignLabels(prev => prev.map(l => l.id === fl.id ? { ...l, style: { ...ls, fontSize: Number(e.target.value) } } : l))}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Section">
                <select value={fl.section}
                  onChange={e => setDesignLabels(prev => prev.map(l => l.id === fl.id ? { ...l, section: e.target.value } : l))}
                  className="prop-input">
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </PropRow>
            </div>
          );
        })()}

        {selectedId?.startsWith('img-') && (() => {
          const img = designImages.find(i => i.id === selectedId!.slice(4));
          if (!img) return null;
          return (
            <div style={{ padding: 8 }} className="space-y-2">
              <div style={{ fontWeight: 700, fontSize: 11, color: '#333', borderBottom: '1px solid #ccc', paddingBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span>Image</span>
                <button onClick={() => { setDesignImages(prev => prev.filter(i => i.id !== img.id)); setSelectedId(null); }}
                  style={{ color: '#c00', cursor: 'pointer', fontSize: 11 }}>Delete</button>
              </div>
              <PropRow label="Picture">
                <input type="url" value={img.src}
                  onChange={e => setDesignImages(prev => prev.map(i => i.id === img.id ? { ...i, src: e.target.value } : i))}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Left">
                <input type="number" min={0} step={GRID} value={img.x}
                  onChange={e => setDesignImages(prev => prev.map(i => i.id === img.id ? { ...i, x: Number(e.target.value) } : i))}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Top">
                <input type="number" min={0} step={GRID} value={img.y}
                  onChange={e => setDesignImages(prev => prev.map(i => i.id === img.id ? { ...i, y: Number(e.target.value) } : i))}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Width">
                <input type="number" min={MIN_W} step={GRID} value={img.width}
                  onChange={e => setDesignImages(prev => prev.map(i => i.id === img.id ? { ...i, width: Number(e.target.value) } : i))}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Height">
                <input type="number" min={MIN_H} step={GRID} value={img.height}
                  onChange={e => setDesignImages(prev => prev.map(i => i.id === img.id ? { ...i, height: Number(e.target.value) } : i))}
                  className="prop-input" />
              </PropRow>
              <PropRow label="Section">
                <select value={img.section || 'detail'}
                  onChange={e => setDesignImages(prev => prev.map(i => i.id === img.id ? { ...i, section: e.target.value } : i))}
                  className="prop-input">
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </PropRow>
            </div>
          );
        })()}

        <div style={{ padding: 8, marginTop: 'auto', borderTop: '1px solid #808080' }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              width: '100%', padding: '5px 0', fontSize: 11, fontWeight: 600,
              backgroundColor: isSaving ? '#999' : accentColor,
              color: '#fff', border: 'none', cursor: isSaving ? 'default' : 'pointer',
            }}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <style>{`
        .prop-input {
          width: 100%;
          border: 1px solid #999;
          padding: 1px 4px;
          font-size: 11px;
          background: #fff;
          font-family: inherit;
        }
        .prop-input:focus {
          outline: none;
          border-color: #4a90d9;
        }
      `}</style>
    </div>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <label style={{ width: 70, flexShrink: 0, fontSize: 11, color: '#333', textAlign: 'right', paddingRight: 4 }}>{label}</label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
