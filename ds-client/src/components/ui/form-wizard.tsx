/**
 * Form Wizard — mirrors the Microsoft Access Form Wizard exactly.
 * Step 1: Pick table + fields (shuttle interface)
 * Step 2: Choose layout (Columnar, Tabular, Datasheet, Justified)
 * Step 3: Name the form + finish options
 */
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { ChevronRight, ChevronLeft, ArrowRight, ArrowLeft, ChevronsRight, ChevronsLeft, Check, LayoutTemplate } from 'lucide-react';

interface Field { id: number; name: string; fieldType: string; sortOrder: number; isPrimaryKey: boolean; }
interface SelectedField { tableId: number; tableName: string; fieldName: string; fieldType: string; }

type LayoutOption = 'columnar' | 'tabular' | 'datasheet' | 'justified';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: { id: number; name: string }[];
  databaseId: number;
  onFinish: (name: string, definition: any) => void;
  apiFetch: (path: string, opts?: RequestInit) => Promise<any>;
}

const TOTAL_STEPS = 3;

const LAYOUTS: { id: LayoutOption; label: string; preview: React.ReactNode }[] = [
  {
    id: 'columnar',
    label: 'Columnar',
    preview: (
      <div className="w-full h-24 border border-gray-300 bg-white p-1.5 rounded text-[7px] space-y-1 overflow-hidden">
        {['Field 1', 'Field 2', 'Field 3'].map(f => (
          <div key={f} className="flex gap-1 items-center">
            <div className="bg-[#cce0ff] rounded-sm px-1 py-px w-10 flex-shrink-0 text-[6px] text-red-800 font-medium truncate">{f}</div>
            <div className="border border-gray-300 rounded-sm flex-1 h-3 bg-white" />
          </div>
        ))}
      </div>
    )
  },
  {
    id: 'tabular',
    label: 'Tabular',
    preview: (
      <div className="w-full h-24 border border-gray-300 bg-white p-1 rounded overflow-hidden">
        <div className="flex gap-0.5 mb-0.5">
          {['F1', 'F2', 'F3'].map(f => <div key={f} className="flex-1 bg-[#cce0ff] text-[6px] text-red-800 font-medium px-0.5 py-px rounded-sm text-center">{f}</div>)}
        </div>
        {[0,1,2,3].map(r => (
          <div key={r} className={`flex gap-0.5 mb-0.5 ${r % 2 === 1 ? 'bg-gray-50' : ''}`}>
            {[0,1,2].map(c => <div key={c} className="flex-1 border border-gray-200 h-3 bg-white rounded-sm" />)}
          </div>
        ))}
      </div>
    )
  },
  {
    id: 'datasheet',
    label: 'Datasheet',
    preview: (
      <div className="w-full h-24 border border-gray-300 bg-white rounded overflow-hidden">
        <div className="flex border-b border-gray-300 bg-[#f0f0f0]">
          {['F1','F2','F3'].map(f => <div key={f} className="flex-1 text-[6px] font-medium text-gray-600 border-r border-gray-300 px-1 py-0.5">{f}</div>)}
        </div>
        {[0,1,2,3,4].map(r => (
          <div key={r} className="flex border-b border-gray-200">
            {[0,1,2].map(c => <div key={c} className="flex-1 border-r border-gray-200 h-3" />)}
          </div>
        ))}
      </div>
    )
  },
  {
    id: 'justified',
    label: 'Justified',
    preview: (
      <div className="w-full h-24 border border-gray-300 bg-white p-1.5 rounded overflow-hidden">
        <div className="flex gap-1 mb-1">
          {['Field 1','Field 2'].map(f => (
            <div key={f} className="flex-1 space-y-0.5">
              <div className="bg-[#cce0ff] rounded-sm px-1 py-px text-[6px] text-red-800 font-medium truncate">{f}</div>
              <div className="border border-gray-300 rounded-sm h-3 bg-white" />
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {['Field 3','Field 4','Field 5'].map(f => (
            <div key={f} className="flex-1 space-y-0.5">
              <div className="bg-[#cce0ff] rounded-sm px-1 py-px text-[6px] text-red-800 font-medium truncate">{f}</div>
              <div className="border border-gray-300 rounded-sm h-3 bg-white" />
            </div>
          ))}
        </div>
      </div>
    )
  }
];

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
      setStep(1);
      setSelectedTableId(null);
      setSelectedFields([]);
      setHighlightAvail(null);
      setHighlightSel(null);
      setLayout('columnar');
      setFormName('');
      setOpenMode('view');
    }
  }, [open]);

  useEffect(() => {
    if (!open && tables.length > 0) setSelectedTableId(tables[0].id);
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
      if (tbl) setFormName(prev => prev || `${tbl.name} Form`);
    }
  }, [selectedTableId]);

  const currentTable = tables.find(t => t.id === selectedTableId);

  const alreadySelected = (f: Field) =>
    !!selectedFields.find(sf => sf.tableId === selectedTableId && sf.fieldName === f.name);

  const addField = (f: Field) => {
    if (!currentTable || alreadySelected(f)) return;
    setSelectedFields(prev => [...prev, { tableId: selectedTableId!, tableName: currentTable.name, fieldName: f.name, fieldType: f.fieldType }]);
    setHighlightAvail(null);
  };

  const addAll = () => {
    if (!currentTable) return;
    availableFields.forEach(f => {
      if (!alreadySelected(f)) {
        setSelectedFields(prev => [...prev, { tableId: selectedTableId!, tableName: currentTable.name, fieldName: f.name, fieldType: f.fieldType }]);
      }
    });
  };

  const removeField = (idx: number) => { setSelectedFields(prev => prev.filter((_, i) => i !== idx)); setHighlightSel(null); };
  const removeAll = () => { setSelectedFields([]); setHighlightSel(null); };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setSelectedFields(prev => { const a = [...prev]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a; });
    setHighlightSel(idx - 1);
  };
  const moveDown = (idx: number) => {
    if (idx >= selectedFields.length - 1) return;
    setSelectedFields(prev => { const a = [...prev]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a; });
    setHighlightSel(idx + 1);
  };

  const handleFinish = () => {
    const tbl = tables.find(t => t.id === selectedTableId);
    const name = formName.trim() || (tbl ? `${tbl.name} Form` : 'Form1');

    // Compute independent canvas positions for label and control based on layout type.
    // Canvas is 700px wide. Label (labelX/Y/W/H) and control (x/y/width/height) are separate.
    const fieldsWithPositions = selectedFields.map((sf, i) => {
      let labelX: number, labelY: number, labelWidth: number, labelHeight: number;
      let x: number, y: number, width: number, height: number;

      if (layout === 'columnar') {
        // Single column: label on left, control on right
        labelX = 10; labelY = 20 + i * 38; labelWidth = 120; labelHeight = 28;
        x = 134;    y = 20 + i * 38;       width = 320;      height = 28;
      } else if (layout === 'tabular') {
        // Two-column grid: pairs alternate left/right
        const col = i % 2, row = Math.floor(i / 2);
        labelX = 10 + col * 350; labelY = 20 + row * 38; labelWidth = 100; labelHeight = 28;
        x = 114 + col * 350;     y = 20 + row * 38;      width = 220;      height = 28;
      } else if (layout === 'datasheet') {
        // Two-column grid, compact 22px row height
        const col = i % 2, row = Math.floor(i / 2);
        labelX = 10 + col * 350; labelY = 10 + row * 30; labelWidth = 100; labelHeight = 22;
        x = 114 + col * 350;     y = 10 + row * 30;      width = 220;      height = 22;
      } else {
        // Justified: three-column grid, controls fill width
        const col = i % 3, row = Math.floor(i / 3);
        labelX = 10 + col * 233;  labelY = 20 + row * 38; labelWidth = 80; labelHeight = 28;
        x = 94 + col * 233;       y = 20 + row * 38;      width = 130;     height = 28;
      }
      return {
        fieldName: sf.fieldName,
        label: sf.fieldName,
        visible: true,
        sortOrder: i,
        fieldType: sf.fieldType,
        x, y, width, height,
        labelX, labelY, labelWidth, labelHeight,
      };
    });

    const definition = {
      tableId: selectedTableId!,
      tableName: tbl?.name || '',
      layout,
      fields: fieldsWithPositions,
    };
    onFinish(name, definition, openMode);
    onOpenChange(false);
  };

  const canNext1 = selectedFields.length > 0;

  const stepTitle = ['Which fields do you want on your form?', 'What layout would you like for your form?', 'What title do you want for your form?'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <LayoutTemplate size={18} className="text-[#2e7d32]" />
            <DialogTitle className="text-base">
              <span className="text-[#2e7d32]">Form Wizard</span>
              <span className="text-gray-400 text-sm font-normal ml-2">— Step {step} of {TOTAL_STEPS}</span>
            </DialogTitle>
          </div>
          <DialogDescription>{stepTitle[step - 1]}</DialogDescription>
        </DialogHeader>

        {/* Step 1 — Field picker */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Tables/Queries:</label>
              <select
                value={selectedTableId ?? ''}
                onChange={e => { setSelectedTableId(Number(e.target.value)); setHighlightAvail(null); setSelectedFields([]); setFormName(''); }}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#2e7d32] bg-white"
              >
                <option value="" disabled>— Select a table —</option>
                {tables.map(t => <option key={t.id} value={t.id}>Table: {t.name}</option>)}
              </select>
            </div>

            <div className="flex gap-3 items-center">
              {/* Available */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Available Fields:</label>
                <div className="border border-gray-300 rounded h-48 overflow-y-auto bg-white">
                  {availableFields.map(f => (
                    <div
                      key={f.name}
                      onDoubleClick={() => addField(f)}
                      onClick={() => setHighlightAvail(f.name)}
                      className={`px-3 py-1 text-sm cursor-default select-none hover:bg-green-50 ${highlightAvail === f.name ? 'bg-[#2e7d32] text-white' : ''} ${alreadySelected(f) ? 'text-gray-300' : ''}`}
                    >
                      {f.isPrimaryKey && '🔑 '}{f.name}
                    </div>
                  ))}
                  {!selectedTableId && <div className="text-xs text-gray-400 italic p-3">Select a table first</div>}
                  {selectedTableId && availableFields.length === 0 && <div className="text-xs text-gray-400 italic p-3">No fields</div>}
                </div>
              </div>

              {/* Shuttle buttons */}
              <div className="flex flex-col gap-1.5 items-center flex-none">
                <button onClick={() => highlightAvail && addField(availableFields.find(f => f.name === highlightAvail)!)} disabled={!highlightAvail || alreadySelected(availableFields.find(f => f.name === highlightAvail)!)} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed" title="Add"><ArrowRight size={14} /></button>
                <button onClick={addAll} disabled={!selectedTableId} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed" title="Add all"><ChevronsRight size={14} /></button>
                <button onClick={() => highlightSel !== null && removeField(highlightSel)} disabled={highlightSel === null} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed" title="Remove"><ArrowLeft size={14} /></button>
                <button onClick={removeAll} disabled={selectedFields.length === 0} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed" title="Remove all"><ChevronsLeft size={14} /></button>
                <div className="w-px h-2" />
                <button onClick={() => highlightSel !== null && moveUp(highlightSel)} disabled={highlightSel === null || highlightSel === 0} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed" title="Move up"><ChevronLeft size={14} className="rotate-90" /></button>
                <button onClick={() => highlightSel !== null && moveDown(highlightSel)} disabled={highlightSel === null || highlightSel >= selectedFields.length - 1} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed" title="Move down"><ChevronRight size={14} className="rotate-90" /></button>
              </div>

              {/* Selected */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Selected Fields:</label>
                <div className="border border-gray-300 rounded h-48 overflow-y-auto bg-white">
                  {selectedFields.map((sf, i) => (
                    <div
                      key={i}
                      onDoubleClick={() => removeField(i)}
                      onClick={() => setHighlightSel(i)}
                      className={`px-3 py-1 text-sm cursor-default select-none hover:bg-green-50 ${highlightSel === i ? 'bg-[#2e7d32] text-white' : ''}`}
                    >
                      {sf.fieldName}
                    </div>
                  ))}
                  {selectedFields.length === 0 && <div className="text-xs text-gray-400 italic p-3">No fields selected</div>}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400">Tip: Double-click a field to move it. Use the arrow buttons to reorder.</p>
          </div>
        )}

        {/* Step 2 — Layout picker */}
        {step === 2 && (
          <div className="py-3">
            <div className="grid grid-cols-4 gap-3">
              {LAYOUTS.map(l => (
                <button
                  key={l.id}
                  onClick={() => setLayout(l.id)}
                  className={`flex flex-col gap-2 p-2 rounded border-2 text-center transition-all ${layout === l.id ? 'border-[#2e7d32] bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                >
                  {l.preview}
                  <div className="flex items-center gap-1 justify-center">
                    <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${layout === l.id ? 'border-[#2e7d32] bg-[#2e7d32]' : 'border-gray-400'}`}>
                      {layout === l.id && <div className="w-1.5 h-1.5 bg-white rounded-full m-auto" />}
                    </div>
                    <span className="text-xs font-medium text-gray-700">{l.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">The layout controls how fields are arranged on the form.</p>
          </div>
        )}

        {/* Step 3 — Name + finish */}
        {step === 3 && (
          <div className="space-y-5 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">What title do you want for your form?</label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleFinish()}
                className="max-w-xs"
              />
              <p className="text-xs text-gray-400 mt-1">This title will appear at the top of the form.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Do you want to open the form or modify its design?</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="formOpenMode" value="view" checked={openMode === 'view'} onChange={() => setOpenMode('view')} className="accent-[#2e7d32]" />
                  <span className="text-sm text-gray-700">Open the form to view or enter information</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="formOpenMode" value="modify" checked={openMode === 'modify'} onChange={() => setOpenMode('modify')} className="accent-[#2e7d32]" />
                  <span className="text-sm text-gray-700">Modify the form's design</span>
                </label>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-600 space-y-0.5">
              <div><strong>Fields:</strong> {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} from {currentTable?.name || '—'}</div>
              <div><strong>Layout:</strong> {LAYOUTS.find(l => l.id === layout)?.label}</div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 border-t pt-4 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button disabled={step === 1 && !canNext1} onClick={() => setStep(s => s + 1)} className="bg-[#2e7d32] hover:bg-[#1b5e20]">
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={!selectedTableId} className="bg-[#2e7d32] hover:bg-[#1b5e20]">
              <Check size={16} className="mr-1" /> Finish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
