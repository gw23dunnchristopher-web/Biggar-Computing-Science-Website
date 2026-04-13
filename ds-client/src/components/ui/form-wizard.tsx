/**
 * Form Wizard — mirrors the Microsoft Access Form Wizard exactly.
 * Step 1: Pick table + fields (shuttle interface)
 * Step 2: Choose layout (Columnar, Tabular, Datasheet, Justified)
 * Step 3: Name the form + finish options
 */
import React, { useState, useEffect } from 'react';
import { Input } from './input';

interface Field { id: number; name: string; fieldType: string; sortOrder: number; isPrimaryKey: boolean; }
interface SelectedField { tableId: number; tableName: string; fieldName: string; fieldType: string; }

type LayoutOption = 'columnar' | 'tabular' | 'datasheet' | 'justified';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: { id: number; name: string }[];
  databaseId: number;
  onFinish: (name: string, definition: any, openMode: 'view' | 'modify') => void;
  apiFetch: (path: string, opts?: RequestInit) => Promise<any>;
}

// ── Left-panel SVG illustrations ────────────────────────────────────────────

function Step1Art() {
  return (
    <svg viewBox="0 0 130 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5c842" />
          <stop offset="100%" stopColor="#e08a00" />
        </linearGradient>
      </defs>
      <rect width="130" height="220" fill="url(#bg1)" />
      {/* Left table */}
      <rect x="8" y="30" width="44" height="8" rx="1" fill="#fff" opacity="0.85" />
      <rect x="8" y="42" width="44" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="8" y="52" width="44" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="8" y="62" width="44" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="8" y="72" width="44" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="8" y="82" width="44" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="8" y="92" width="44" height="6" rx="1" fill="#fff" opacity="0.6" />
      {/* Arrows */}
      <text x="62" y="56" fontSize="18" fill="#7a3800" fontWeight="bold" fontFamily="Arial">→</text>
      <text x="62" y="78" fontSize="18" fill="#7a3800" fontWeight="bold" fontFamily="Arial">→</text>
      <text x="62" y="100" fontSize="18" fill="#7a3800" fontWeight="bold" fontFamily="Arial">→</text>
      {/* Right form */}
      <rect x="86" y="30" width="38" height="8" rx="1" fill="#fff" opacity="0.85" />
      <rect x="86" y="48" width="38" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="86" y="58" width="38" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="86" y="68" width="38" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="86" y="78" width="38" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="86" y="88" width="38" height="6" rx="1" fill="#fff" opacity="0.6" />
      {/* Table grid lower */}
      <rect x="8" y="120" width="60" height="8" rx="1" fill="#fff" opacity="0.7" />
      {[0,1,2,3,4].map(i => (
        <g key={i}>
          <rect x="8" y={133 + i * 10} width="28" height="6" rx="1" fill="#fff" opacity="0.5" />
          <rect x="40" y={133 + i * 10} width="28" height="6" rx="1" fill="#fff" opacity="0.5" />
        </g>
      ))}
    </svg>
  );
}

function Step2Art({ layout }: { layout: LayoutOption }) {
  return (
    <svg viewBox="0 0 220 190" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5c842" />
          <stop offset="100%" stopColor="#e08a00" />
        </linearGradient>
      </defs>
      <rect width="220" height="190" fill="url(#bg2)" />
      <rect x="10" y="10" width="200" height="170" rx="3" fill="#fff" opacity="0.15" />
      {layout === 'columnar' && (
        <g>
          {[0,1,2,3,4].map(i => (
            <g key={i}>
              <rect x="20" y={25 + i * 28} width="55" height="16" rx="2" fill="#e08a00" opacity="0.7" />
              <rect x="82" y={25 + i * 28} width="120" height="16" rx="2" fill="#fff" opacity="0.8" />
            </g>
          ))}
          <rect x="82" y={25 + 3 * 28} width="80" height="30" rx="2" fill="#fff" opacity="0.8" />
        </g>
      )}
      {layout === 'tabular' && (
        <g>
          {[0,1,2].map(c => (
            <rect key={c} x={20 + c * 65} y="20" width="58" height="14" rx="2" fill="#e08a00" opacity="0.7" />
          ))}
          {[0,1,2,3,4].map(r => [0,1,2].map(c => (
            <rect key={`${r}-${c}`} x={20 + c * 65} y={40 + r * 24} width="58" height="16" rx="1" fill="#fff" opacity={r % 2 === 0 ? 0.8 : 0.55} />
          )))}
        </g>
      )}
      {layout === 'datasheet' && (
        <g>
          <rect x="15" y="18" width="190" height="14" fill="#e08a00" opacity="0.7" />
          {[0,1,2,3].map(c => (
            <text key={c} x={22 + c * 47} y="29" fontSize="9" fill="#fff" fontFamily="Arial">F{c+1}</text>
          ))}
          {[0,1,2,3,4,5,6].map(r => (
            <g key={r}>
              <rect x="15" y={36 + r * 18} width="190" height="16" fill={r % 2 === 0 ? '#ffffff' : '#f5f5f5'} opacity="0.75" />
              {[0,1,2,3].map(c => (
                <rect key={c} x={20 + c * 47} y={40 + r * 18} width="38" height="8" rx="1" fill="#ccc" opacity="0.5" />
              ))}
            </g>
          ))}
        </g>
      )}
      {layout === 'justified' && (
        <g>
          {[0,1,2].map(i => (
            <g key={i}>
              <rect x={20 + i * 65} y="25" width="58" height="12" rx="2" fill="#e08a00" opacity="0.7" />
              <rect x={20 + i * 65} y="41" width="58" height="14" rx="2" fill="#fff" opacity="0.8" />
            </g>
          ))}
          {[0,1].map(i => (
            <g key={i}>
              <rect x={20 + i * 100} y="68" width="90" height="12" rx="2" fill="#e08a00" opacity="0.7" />
              <rect x={20 + i * 100} y="84" width="90" height="14" rx="2" fill="#fff" opacity="0.8" />
            </g>
          ))}
          {[0,1,2].map(i => (
            <g key={i}>
              <rect x={20 + i * 65} y="112" width="58" height="12" rx="2" fill="#e08a00" opacity="0.7" />
              <rect x={20 + i * 65} y="128" width="58" height="14" rx="2" fill="#fff" opacity="0.8" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

function Step3Art() {
  return (
    <svg viewBox="0 0 130 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5c842" />
          <stop offset="100%" stopColor="#e08a00" />
        </linearGradient>
      </defs>
      <rect width="130" height="220" fill="url(#bg3)" />
      {/* Form card */}
      <rect x="14" y="20" width="102" height="130" rx="4" fill="#fff" opacity="0.88" />
      <rect x="14" y="20" width="102" height="16" rx="4" fill="#e08a00" opacity="0.8" />
      {[0,1,2,3,4].map(i => (
        <g key={i}>
          <rect x="22" y={48 + i * 20} width="32" height="8" rx="1" fill="#f5c842" opacity="0.8" />
          <rect x="60" y={48 + i * 20} width="48" height="8" rx="1" fill="#ddd" opacity="0.9" />
        </g>
      ))}
      {/* Checkmark circle */}
      <circle cx="65" cy="175" r="26" fill="#fff" opacity="0.9" />
      <circle cx="65" cy="175" r="22" fill="#e08a00" opacity="0.7" />
      <text x="65" y="183" textAnchor="middle" fontSize="28" fill="#fff" fontWeight="bold" fontFamily="Arial">✓</text>
    </svg>
  );
}

// ── Wizard button ────────────────────────────────────────────────────────────

function WizBtn({ onClick, disabled = false, primary = false, children }: { onClick: () => void; disabled?: boolean; primary?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-1 text-sm border min-w-[72px] ${
        primary
          ? 'border-[#0066cc] bg-white text-black font-semibold shadow-[inset_1px_1px_0_#fff,inset_-1px_-1px_0_#999] hover:bg-[#f0f0f0]'
          : 'border-gray-400 bg-[#f0f0f0] text-black hover:bg-[#e0e0e0] shadow-[inset_1px_1px_0_#fff,inset_-1px_-1px_0_#aaa]'
      } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none active:shadow-[inset_1px_1px_0_#aaa,inset_-1px_-1px_0_#fff]`}
      style={{ fontFamily: 'Segoe UI, Tahoma, sans-serif' }}
    >
      {children}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function FormWizard({ open, onOpenChange, tables, databaseId, onFinish, apiFetch }: Props) {
  const [step, setStep] = useState(1);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [tableFields, setTableFields] = useState<Record<number, Field[]>>({});
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
  const [highlightAvail, setHighlightAvail] = useState<string | null>(null);
  const [highlightSel, setHighlightSel] = useState<number | null>(null);
  const [layout, setLayout] = useState<LayoutOption>('columnar');
  const [formName, setFormName] = useState('');
  const [openMode, setOpenMode] = useState<'view' | 'modify'>('view');

  useEffect(() => {
    if (!open) {
      setStep(1); setSelectedTableId(null); setSelectedFields([]);
      setHighlightAvail(null); setHighlightSel(null);
      setLayout('columnar'); setFormName(''); setOpenMode('view');
    }
  }, [open]);

  useEffect(() => {
    if (open && tables.length > 0 && !selectedTableId) setSelectedTableId(tables[0].id);
  }, [open, tables]);

  useEffect(() => {
    if (!selectedTableId) return setAvailableFields([]);
    if (tableFields[selectedTableId]) {
      setAvailableFields([...tableFields[selectedTableId]].sort((a, b) => a.sortOrder - b.sortOrder));
    } else {
      apiFetch(`/api/ds/databases/${databaseId}/tables/${selectedTableId}`)
        .then((td: any) => {
          const fields = td.fields || [];
          setTableFields(prev => ({ ...prev, [selectedTableId]: fields }));
          setAvailableFields([...fields].sort((a: Field, b: Field) => a.sortOrder - b.sortOrder));
        })
        .catch(() => {});
    }
  }, [selectedTableId]);

  useEffect(() => {
    if (selectedTableId && tables.length > 0) {
      const tbl = tables.find(t => t.id === selectedTableId);
      if (tbl) setFormName(tbl.name);
    }
  }, [selectedTableId]);

  const currentTable = tables.find(t => t.id === selectedTableId);
  const alreadySelected = (f: Field) => !!selectedFields.find(sf => sf.tableId === selectedTableId && sf.fieldName === f.name);

  const addField = (f: Field) => {
    if (!currentTable || alreadySelected(f)) return;
    setSelectedFields(prev => [...prev, { tableId: selectedTableId!, tableName: currentTable.name, fieldName: f.name, fieldType: f.fieldType }]);
    setHighlightAvail(null);
  };
  const addAll = () => {
    if (!currentTable) return;
    const toAdd = availableFields.filter(f => !alreadySelected(f));
    setSelectedFields(prev => [...prev, ...toAdd.map(f => ({ tableId: selectedTableId!, tableName: currentTable.name, fieldName: f.name, fieldType: f.fieldType }))]);
  };
  const removeField = (idx: number) => { setSelectedFields(prev => prev.filter((_, i) => i !== idx)); setHighlightSel(null); };
  const removeAll = () => { setSelectedFields([]); setHighlightSel(null); };

  const handleFinish = () => {
    const tbl = tables.find(t => t.id === selectedTableId);
    const name = formName.trim() || (tbl ? tbl.name : 'Form1');
    const fieldsWithPositions = selectedFields.map((sf, i) => {
      let labelX: number, labelY: number, labelWidth: number, labelHeight: number;
      let x: number, y: number, width: number, height: number;
      if (layout === 'columnar') {
        labelX = 10; labelY = 20 + i * 38; labelWidth = 120; labelHeight = 28;
        x = 134;    y = 20 + i * 38;       width = 320;      height = 28;
      } else if (layout === 'tabular') {
        const col = i % 2, row = Math.floor(i / 2);
        labelX = 10 + col * 350; labelY = 20 + row * 38; labelWidth = 100; labelHeight = 28;
        x = 114 + col * 350;     y = 20 + row * 38;      width = 220;      height = 28;
      } else if (layout === 'datasheet') {
        const col = i % 2, row = Math.floor(i / 2);
        labelX = 10 + col * 350; labelY = 10 + row * 30; labelWidth = 100; labelHeight = 22;
        x = 114 + col * 350;     y = 10 + row * 30;      width = 220;      height = 22;
      } else {
        const col = i % 3, row = Math.floor(i / 3);
        labelX = 10 + col * 233;  labelY = 20 + row * 38; labelWidth = 80; labelHeight = 28;
        x = 94 + col * 233;       y = 20 + row * 38;      width = 130;     height = 28;
      }
      return { fieldName: sf.fieldName, label: sf.fieldName, visible: true, sortOrder: i, fieldType: sf.fieldType, x, y, width, height, labelX, labelY, labelWidth, labelHeight };
    });
    const definition = { tableId: selectedTableId!, tableName: tbl?.name || '', layout, fields: fieldsWithPositions };
    onFinish(name, definition, openMode);
    onOpenChange(false);
  };

  const canNext1 = selectedFields.length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-[#f0f0f0] border border-gray-500 shadow-2xl flex flex-col"
        style={{ width: 500, fontFamily: 'Segoe UI, Tahoma, Geneva, sans-serif', fontSize: 13 }}
      >
        {/* Title bar */}
        <div className="flex items-center px-3 py-1.5 bg-[#f0f0f0] border-b border-gray-300 select-none">
          <span className="font-semibold text-[13px] text-black">Form Wizard</span>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0" style={{ minHeight: 260 }}>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              {/* Left art panel */}
              <div className="flex-none w-[130px]" style={{ background: 'linear-gradient(135deg,#f5c842,#e08a00)' }}>
                <Step1Art />
              </div>
              {/* Right content */}
              <div className="flex-1 flex flex-col px-5 pt-4 pb-3 overflow-hidden">
                <p className="text-[13px] font-semibold text-black mb-0.5">Which fields do you want on your form?</p>
                <p className="text-[12px] text-black mb-3">You can choose from more than one table or query.</p>

                <div className="mb-2">
                  <div className="text-[12px] mb-0.5 underline">Tables/Queries</div>
                  <select
                    value={selectedTableId ?? ''}
                    onChange={e => { setSelectedTableId(Number(e.target.value)); setHighlightAvail(null); setSelectedFields([]); setFormName(''); }}
                    className="w-full border border-gray-500 px-1 py-0.5 text-[12px] bg-white focus:outline-none"
                    style={{ height: 22 }}
                  >
                    {tables.map(t => <option key={t.id} value={t.id}>Table: {t.name}</option>)}
                  </select>
                </div>

                <div className="flex gap-1 flex-1 min-h-0">
                  {/* Available */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="text-[12px] underline mb-0.5">Available Fields:</div>
                    <div className="flex-1 border border-gray-500 bg-white overflow-y-auto" style={{ minHeight: 100 }}>
                      {availableFields.map(f => (
                        <div
                          key={f.name}
                          onDoubleClick={() => addField(f)}
                          onClick={() => setHighlightAvail(f.name)}
                          className="px-2 py-px text-[12px] cursor-default select-none leading-5"
                          style={{ background: highlightAvail === f.name ? '#000080' : 'transparent', color: highlightAvail === f.name ? '#fff' : (alreadySelected(f) ? '#aaa' : '#000') }}
                        >
                          {f.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shuttle buttons */}
                  <div className="flex flex-col gap-1 justify-center flex-none px-1">
                    <WizBtn onClick={() => { const f = availableFields.find(f => f.name === highlightAvail); if (f) addField(f); }} disabled={!highlightAvail || alreadySelected(availableFields.find(f => f.name === highlightAvail)!)}>
                      &gt;
                    </WizBtn>
                    <WizBtn onClick={addAll} disabled={!selectedTableId || availableFields.every(f => alreadySelected(f))}>
                      &gt;&gt;
                    </WizBtn>
                    <WizBtn onClick={() => highlightSel !== null && removeField(highlightSel)} disabled={highlightSel === null}>
                      &lt;
                    </WizBtn>
                    <WizBtn onClick={removeAll} disabled={selectedFields.length === 0}>
                      &lt;&lt;
                    </WizBtn>
                  </div>

                  {/* Selected */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="text-[12px] underline mb-0.5">Selected Fields:</div>
                    <div className="flex-1 border border-gray-500 bg-white overflow-y-auto" style={{ minHeight: 100 }}>
                      {selectedFields.map((sf, i) => (
                        <div
                          key={i}
                          onDoubleClick={() => removeField(i)}
                          onClick={() => setHighlightSel(i)}
                          className="px-2 py-px text-[12px] cursor-default select-none leading-5"
                          style={{ background: highlightSel === i ? '#000080' : 'transparent', color: highlightSel === i ? '#fff' : '#000' }}
                        >
                          {sf.fieldName}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className="flex flex-col flex-1">
              <p className="text-[13px] font-semibold text-black px-5 pt-4 pb-2">What layout would you like for your form?</p>
              <div className="flex flex-1 min-h-0">
                {/* Left: layout preview */}
                <div className="flex-none px-4 pb-4" style={{ width: 260 }}>
                  <div style={{ background: 'linear-gradient(135deg,#f5c842,#e08a00)', border: '2px solid #c87800', height: '100%', minHeight: 150 }}>
                    <Step2Art layout={layout} />
                  </div>
                </div>
                {/* Right: radio options */}
                <div className="flex-1 flex flex-col justify-center px-4 pb-4 gap-3">
                  {(['columnar', 'tabular', 'datasheet', 'justified'] as LayoutOption[]).map(l => (
                    <label key={l} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="formLayout"
                        value={l}
                        checked={layout === l}
                        onChange={() => setLayout(l)}
                        className="cursor-pointer"
                        style={{ accentColor: '#000080' }}
                      />
                      <span className="text-[13px] text-black">{l.charAt(0).toUpperCase() + l.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <>
              {/* Left art */}
              <div className="flex-none w-[130px]" style={{ background: 'linear-gradient(135deg,#f5c842,#e08a00)' }}>
                <Step3Art />
              </div>
              {/* Right content */}
              <div className="flex-1 flex flex-col px-5 pt-4 pb-3">
                <p className="text-[13px] font-semibold text-black mb-2">What title do you want for your form?</p>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFinish()}
                  autoFocus
                  className="border border-gray-500 px-1.5 py-0.5 text-[13px] bg-white focus:outline-none w-full mb-4"
                  style={{ height: 22 }}
                />
                <p className="text-[12px] text-black mb-3">
                  That's all the information the wizard needs to create your form.
                  <br /><br />
                  Do you want to open the form or modify the form's design?
                </p>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input type="radio" name="formOpenMode" value="view" checked={openMode === 'view'} onChange={() => setOpenMode('view')} style={{ accentColor: '#000080' }} />
                  <span className="text-[13px] text-black">Open the form to view or enter information.</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="formOpenMode" value="modify" checked={openMode === 'modify'} onChange={() => setOpenMode('modify')} style={{ accentColor: '#000080' }} />
                  <span className="text-[13px] text-black">Modify the form's design.</span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-400 bg-[#f0f0f0] px-3 py-2 flex items-center justify-end gap-2">
          <WizBtn onClick={() => onOpenChange(false)}>Cancel</WizBtn>
          <WizBtn onClick={() => setStep(s => s - 1)} disabled={step === 1}>&lt; Back</WizBtn>
          <WizBtn onClick={() => setStep(s => s + 1)} disabled={step === 3 || (step === 1 && !canNext1)} primary={step < 3}>Next &gt;</WizBtn>
          <WizBtn onClick={handleFinish} disabled={!selectedTableId || selectedFields.length === 0} primary={step === 3}>Finish</WizBtn>
        </div>
      </div>
    </div>
  );
}
