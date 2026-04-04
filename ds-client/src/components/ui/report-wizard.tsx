/**
 * Report Wizard — mirrors the Microsoft Access Report Wizard exactly.
 * Step 1: Pick table + fields (shuttle interface)
 * Step 2: Add grouping levels
 * Step 3: Sort order (up to 4 fields, asc/desc)
 * Step 4: Layout + orientation
 * Step 5: Name + finish options
 */
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { ChevronRight, ChevronLeft, ArrowRight, ArrowLeft, ChevronsRight, ChevronsLeft, Check, FileText, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Field { id: number; name: string; fieldType: string; sortOrder: number; isPrimaryKey: boolean; }
interface SelectedField { tableId: number; tableName: string; fieldName: string; fieldType: string; }

type LayoutOption = 'columnar' | 'tabular' | 'justified' | 'outline';
type Orientation = 'portrait' | 'landscape';
type SortDir = 'asc' | 'desc';

interface SortRow { fieldName: string; dir: SortDir; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: { id: number; name: string }[];
  databaseId: number;
  onFinish: (name: string, definition: any) => void;
  apiFetch: (path: string, opts?: RequestInit) => Promise<any>;
}

const TOTAL_STEPS = 5;

const REPORT_LAYOUTS: { id: LayoutOption; label: string; preview: React.ReactNode }[] = [
  {
    id: 'columnar',
    label: 'Columnar',
    preview: (
      <div className="w-full h-20 border border-gray-300 bg-white p-1.5 rounded text-[7px] space-y-1 overflow-hidden">
        {['Field 1', 'Field 2', 'Field 3'].map(f => (
          <div key={f} className="flex gap-1 items-center">
            <div className="bg-[#d4c5e8] rounded-sm px-1 py-px w-10 flex-shrink-0 text-[6px] text-purple-900 font-medium truncate">{f}</div>
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
      <div className="w-full h-20 border border-gray-300 bg-white p-1 rounded overflow-hidden">
        <div className="flex gap-0.5 mb-0.5">
          {['F1','F2','F3'].map(f => <div key={f} className="flex-1 bg-[#c8b4a0] text-[6px] text-amber-900 font-medium px-0.5 py-px rounded-sm text-center">{f}</div>)}
        </div>
        {[0,1,2,3].map(r => (
          <div key={r} className={`flex gap-0.5 mb-0.5 ${r % 2 === 1 ? 'bg-amber-50' : ''}`}>
            {[0,1,2].map(c => <div key={c} className="flex-1 border border-gray-200 h-3 bg-white rounded-sm" />)}
          </div>
        ))}
      </div>
    )
  },
  {
    id: 'justified',
    label: 'Justified',
    preview: (
      <div className="w-full h-20 border border-gray-300 bg-white p-1.5 rounded overflow-hidden">
        <div className="flex gap-1 mb-1">
          {['F1','F2'].map(f => (
            <div key={f} className="flex-1 space-y-0.5">
              <div className="bg-[#d4c5e8] rounded-sm px-1 py-px text-[6px] text-purple-900 font-medium">{f}</div>
              <div className="border border-gray-300 rounded-sm h-3 bg-white" />
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {['F3','F4','F5'].map(f => (
            <div key={f} className="flex-1 space-y-0.5">
              <div className="bg-[#d4c5e8] rounded-sm px-1 py-px text-[6px] text-purple-900 font-medium">{f}</div>
              <div className="border border-gray-300 rounded-sm h-3 bg-white" />
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'outline',
    label: 'Outline',
    preview: (
      <div className="w-full h-20 border border-gray-300 bg-white p-1.5 rounded overflow-hidden">
        <div className="bg-[#c8b4a0] rounded-sm px-1 py-0.5 text-[6px] text-amber-900 font-bold mb-1">Group Value</div>
        <div className="pl-2 space-y-0.5">
          {['F1','F2','F3'].map(f => (
            <div key={f} className="flex gap-1 items-center">
              <div className="bg-gray-100 rounded-sm px-1 py-px w-6 text-[5px] text-gray-500 font-medium">{f}</div>
              <div className="border border-gray-200 rounded-sm flex-1 h-2.5 bg-white" />
            </div>
          ))}
        </div>
      </div>
    )
  }
];

const EMPTY_SORT: SortRow = { fieldName: '', dir: 'asc' };

export function ReportWizard({ open, onOpenChange, tables, databaseId, onFinish, apiFetch }: Props) {
  const [step, setStep] = useState(1);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [tableFields, setTableFields] = useState<Record<number, Field[]>>({});
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
  const [highlightAvail, setHighlightAvail] = useState<string | null>(null);
  const [highlightSel, setHighlightSel] = useState<number | null>(null);

  // Step 2 — grouping
  const [groupFields, setGroupFields] = useState<string[]>([]);
  const [highlightGroup, setHighlightGroup] = useState<string | null>(null);

  // Step 3 — sort
  const [sortRows, setSortRows] = useState<SortRow[]>([EMPTY_SORT, EMPTY_SORT, EMPTY_SORT, EMPTY_SORT]);

  // Step 4 — layout
  const [layout, setLayout] = useState<LayoutOption>('tabular');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [fitToPage, setFitToPage] = useState(true);

  // Step 5
  const [reportName, setReportName] = useState('');
  const [openMode, setOpenMode] = useState<'preview' | 'modify'>('preview');

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedTableId(null);
      setSelectedFields([]);
      setHighlightAvail(null);
      setHighlightSel(null);
      setGroupFields([]);
      setHighlightGroup(null);
      setSortRows([EMPTY_SORT, EMPTY_SORT, EMPTY_SORT, EMPTY_SORT]);
      setLayout('tabular');
      setOrientation('portrait');
      setFitToPage(true);
      setReportName('');
      setOpenMode('preview');
    }
  }, [open]);

  useEffect(() => {
    if (!selectedTableId) return setAvailableFields([]);
    if (tableFields[selectedTableId]) {
      setAvailableFields([...tableFields[selectedTableId]].sort((a, b) => a.sortOrder - b.sortOrder));
    } else {
      apiFetch(`/api/databases/${databaseId}/tables/${selectedTableId}`)
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
      if (tbl) setReportName(prev => prev || `${tbl.name} Report`);
    }
  }, [selectedTableId]);

  const currentTable = tables.find(t => t.id === selectedTableId);

  const alreadySelected = (f: Field) =>
    !!selectedFields.find(sf => sf.tableId === selectedTableId && sf.fieldName === f.name);

  // Step 1 actions
  const addField = (f: Field) => {
    if (!currentTable || alreadySelected(f)) return;
    setSelectedFields(prev => [...prev, { tableId: selectedTableId!, tableName: currentTable.name, fieldName: f.name, fieldType: f.fieldType }]);
    setHighlightAvail(null);
  };
  const addAll = () => {
    if (!currentTable) return;
    availableFields.forEach(f => {
      if (!alreadySelected(f))
        setSelectedFields(prev => [...prev, { tableId: selectedTableId!, tableName: currentTable.name, fieldName: f.name, fieldType: f.fieldType }]);
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

  // Step 2 — grouping
  const availableToGroup = selectedFields.filter(sf => !groupFields.includes(sf.fieldName));
  const [highlightAvailGroup, setHighlightAvailGroup] = useState<string | null>(null);

  const addGroupField = (name: string) => {
    setGroupFields(prev => [...prev, name]);
    setHighlightAvailGroup(null);
  };
  const removeGroupField = (name: string) => setGroupFields(prev => prev.filter(g => g !== name));
  const moveGroupUp = (i: number) => {
    if (i === 0) return;
    setGroupFields(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
    setHighlightGroup(groupFields[i - 1]);
  };
  const moveGroupDown = (i: number) => {
    if (i >= groupFields.length - 1) return;
    setGroupFields(prev => { const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });
    setHighlightGroup(groupFields[i + 1]);
  };

  // Step 3 — sort
  const sortableFields = selectedFields.map(sf => sf.fieldName);
  const toggleSortDir = (i: number) =>
    setSortRows(prev => prev.map((r, idx) => idx === i ? { ...r, dir: r.dir === 'asc' ? 'desc' : 'asc' } : r));
  const setSortField = (i: number, name: string) =>
    setSortRows(prev => prev.map((r, idx) => idx === i ? { ...r, fieldName: name } : r));

  const handleFinish = () => {
    const tbl = tables.find(t => t.id === selectedTableId);
    const name = reportName.trim() || (tbl ? `${tbl.name} Report` : 'Report1');
    const activeSorts = sortRows.filter(r => r.fieldName);
    const definition = {
      tableId: selectedTableId!,
      tableName: tbl?.name || '',
      title: name,
      layout,
      orientation,
      fitToPage,
      groupFields,
      sortRows: activeSorts,
      // Backwards compat single sort
      sortField: activeSorts[0]?.fieldName || undefined,
      sortDir: activeSorts[0]?.dir || undefined,
      groupField: groupFields[0] || undefined,
      fields: selectedFields.map((sf, i) => ({
        fieldName: sf.fieldName,
        label: sf.fieldName,
        visible: true,
        sortOrder: i,
        fieldType: sf.fieldType,
      }))
    };
    onFinish(name, definition, openMode);
    onOpenChange(false);
  };

  const stepTitles = [
    'Which fields do you want on your report?',
    'Do you want to add any grouping levels?',
    'What sort order do you want for your records?',
    'How would you like to lay out your report?',
    'What title do you want for your report?'
  ];

  const canNext1 = selectedFields.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[#5d4037]" />
            <DialogTitle className="text-base">
              <span className="text-[#5d4037]">Report Wizard</span>
              <span className="text-gray-400 text-sm font-normal ml-2">— Step {step} of {TOTAL_STEPS}</span>
            </DialogTitle>
          </div>
          <DialogDescription>{stepTitles[step - 1]}</DialogDescription>
        </DialogHeader>

        {/* ── Step 1: Field picker ─────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Tables/Queries:</label>
              <select
                value={selectedTableId ?? ''}
                onChange={e => { setSelectedTableId(Number(e.target.value)); setHighlightAvail(null); setSelectedFields([]); setGroupFields([]); setReportName(''); }}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#5d4037] bg-white"
              >
                <option value="" disabled>— Select a table —</option>
                {tables.map(t => <option key={t.id} value={t.id}>Table: {t.name}</option>)}
              </select>
            </div>

            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Available Fields:</label>
                <div className="border border-gray-300 rounded h-48 overflow-y-auto bg-white">
                  {availableFields.map(f => (
                    <div key={f.name} onDoubleClick={() => addField(f)} onClick={() => setHighlightAvail(f.name)}
                      className={`px-3 py-1 text-sm cursor-default select-none hover:bg-amber-50 ${highlightAvail === f.name ? 'bg-[#5d4037] text-white' : ''} ${alreadySelected(f) ? 'text-gray-300' : ''}`}>
                      {f.isPrimaryKey && '🔑 '}{f.name}
                    </div>
                  ))}
                  {!selectedTableId && <div className="text-xs text-gray-400 italic p-3">Select a table first</div>}
                  {selectedTableId && availableFields.length === 0 && <div className="text-xs text-gray-400 italic p-3">No fields</div>}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 items-center flex-none">
                <button onClick={() => highlightAvail && addField(availableFields.find(f => f.name === highlightAvail)!)} disabled={!highlightAvail || alreadySelected(availableFields.find(f => f.name === highlightAvail)!)} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"><ArrowRight size={14} /></button>
                <button onClick={addAll} disabled={!selectedTableId} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"><ChevronsRight size={14} /></button>
                <button onClick={() => highlightSel !== null && removeField(highlightSel)} disabled={highlightSel === null} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"><ArrowLeft size={14} /></button>
                <button onClick={removeAll} disabled={selectedFields.length === 0} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"><ChevronsLeft size={14} /></button>
                <div className="w-px h-2" />
                <button onClick={() => highlightSel !== null && moveUp(highlightSel)} disabled={highlightSel === null || highlightSel === 0} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"><ChevronLeft size={14} className="rotate-90" /></button>
                <button onClick={() => highlightSel !== null && moveDown(highlightSel)} disabled={highlightSel === null || highlightSel >= selectedFields.length - 1} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"><ChevronRight size={14} className="rotate-90" /></button>
              </div>

              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Selected Fields:</label>
                <div className="border border-gray-300 rounded h-48 overflow-y-auto bg-white">
                  {selectedFields.map((sf, i) => (
                    <div key={i} onDoubleClick={() => removeField(i)} onClick={() => setHighlightSel(i)}
                      className={`px-3 py-1 text-sm cursor-default select-none hover:bg-amber-50 ${highlightSel === i ? 'bg-[#5d4037] text-white' : ''}`}>
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

        {/* ── Step 2: Grouping ──────────────────────────────────────── */}
        {step === 2 && (
          <div className="py-3 space-y-4">
            <div className="flex gap-3">
              {/* Available to group */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Available fields:</label>
                <div className="border border-gray-300 rounded h-40 overflow-y-auto bg-white">
                  {availableToGroup.map(sf => (
                    <div key={sf.fieldName} onDoubleClick={() => addGroupField(sf.fieldName)} onClick={() => setHighlightAvailGroup(sf.fieldName)}
                      className={`px-3 py-1 text-sm cursor-default select-none hover:bg-amber-50 ${highlightAvailGroup === sf.fieldName ? 'bg-[#5d4037] text-white' : ''}`}>
                      {sf.fieldName}
                    </div>
                  ))}
                  {availableToGroup.length === 0 && <div className="text-xs text-gray-400 italic p-3">{groupFields.length > 0 ? 'All fields grouped' : 'No fields available'}</div>}
                </div>
              </div>

              {/* Add/remove buttons */}
              <div className="flex flex-col gap-1.5 items-center justify-center flex-none">
                <button onClick={() => highlightAvailGroup && addGroupField(highlightAvailGroup)} disabled={!highlightAvailGroup}
                  className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"><ArrowRight size={14} /></button>
                <button onClick={() => highlightGroup && removeGroupField(highlightGroup)} disabled={!highlightGroup}
                  className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"><ArrowLeft size={14} /></button>
              </div>

              {/* Grouping preview box */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Grouping levels:</label>
                <div className="border border-gray-300 rounded h-40 overflow-y-auto bg-white">
                  {groupFields.map((g, i) => (
                    <div key={g} onClick={() => setHighlightGroup(g)}
                      className={`px-3 py-1 text-sm cursor-default select-none flex items-center justify-between hover:bg-amber-50 ${highlightGroup === g ? 'bg-[#5d4037] text-white' : ''}`}>
                      <span>{g}</span>
                      <div className="flex gap-0.5 ml-2">
                        <button onClick={e => { e.stopPropagation(); moveGroupUp(i); }} disabled={i === 0}
                          className="p-0.5 hover:bg-black/10 rounded disabled:opacity-30"><ChevronLeft size={12} className="rotate-90" /></button>
                        <button onClick={e => { e.stopPropagation(); moveGroupDown(i); }} disabled={i >= groupFields.length - 1}
                          className="p-0.5 hover:bg-black/10 rounded disabled:opacity-30"><ChevronRight size={12} className="rotate-90" /></button>
                      </div>
                    </div>
                  ))}
                  {groupFields.length === 0 && <div className="text-xs text-gray-400 italic p-3">No grouping (double-click a field to add)</div>}
                </div>
              </div>
            </div>

            {/* Grouping preview panel */}
            {groupFields.length > 0 && (
              <div className="border border-gray-300 rounded p-3 bg-[#faf9f8]">
                <p className="text-xs font-semibold text-gray-500 mb-2">Grouping preview:</p>
                <div className="space-y-1">
                  {groupFields.map((g, i) => (
                    <div key={g} style={{ paddingLeft: `${i * 12}px` }}>
                      <div className="inline-block bg-[#c8b4a0] text-[#3e2723] text-xs font-medium rounded px-2 py-0.5">{g}</div>
                    </div>
                  ))}
                  <div style={{ paddingLeft: `${groupFields.length * 12}px` }}>
                    <div className="text-xs text-gray-400 italic">(data rows)</div>
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400">Grouping organises records together by a common field value. Double-click a field to add it as a grouping level.</p>
          </div>
        )}

        {/* ── Step 3: Sort order ──────────────────────────────────── */}
        {step === 3 && (
          <div className="py-3 space-y-3">
            <p className="text-sm text-gray-600">You can sort records by up to four fields, in either ascending or descending order.</p>
            <div className="space-y-2">
              {sortRows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-4 flex-shrink-0">{i + 1}</span>
                  <select
                    value={row.fieldName}
                    onChange={e => setSortField(i, e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#5d4037] bg-white"
                    disabled={i > 0 && !sortRows[i - 1].fieldName}
                  >
                    <option value="">(none)</option>
                    {sortableFields
                      .filter(fn => fn === row.fieldName || !sortRows.some((r, ri) => ri !== i && r.fieldName === fn))
                      .map(fn => <option key={fn} value={fn}>{fn}</option>)}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!row.fieldName}
                    onClick={() => toggleSortDir(i)}
                    className={`w-28 flex-shrink-0 gap-1 text-xs ${!row.fieldName ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {row.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {row.dir === 'asc' ? 'Ascending' : 'Descending'}
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">Click the Ascending / Descending button to toggle the sort direction for each field.</p>
          </div>
        )}

        {/* ── Step 4: Layout + orientation ────────────────────────── */}
        {step === 4 && (
          <div className="py-3 flex gap-6">
            {/* Layout */}
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Layout</label>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_LAYOUTS.map(l => (
                  <button key={l.id} onClick={() => setLayout(l.id)}
                    className={`flex flex-col gap-1.5 p-1.5 rounded border-2 text-center transition-all ${layout === l.id ? 'border-[#5d4037] bg-amber-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    {l.preview}
                    <div className="flex items-center gap-1 justify-center">
                      <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${layout === l.id ? 'border-[#5d4037] bg-[#5d4037]' : 'border-gray-400'}`}>
                        {layout === l.id && <div className="w-1.5 h-1.5 bg-white rounded-full m-auto" />}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{l.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation */}
            <div className="w-36 flex-shrink-0">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Orientation</label>
              <div className="space-y-3">
                {(['portrait', 'landscape'] as Orientation[]).map(o => (
                  <label key={o} onClick={() => setOrientation(o)}
                    className={`flex items-center gap-2 p-2 border-2 rounded cursor-pointer transition-all ${orientation === o ? 'border-[#5d4037] bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="orientation" value={o} checked={orientation === o} onChange={() => setOrientation(o)} className="accent-[#5d4037]" />
                    <span className="flex flex-col items-center gap-1">
                      {o === 'portrait'
                        ? <span className="inline-block w-6 h-8 border-2 border-current rounded-sm bg-white" />
                        : <span className="inline-block w-8 h-6 border-2 border-current rounded-sm bg-white" />}
                      <span className="text-xs font-medium capitalize">{o}</span>
                    </span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={fitToPage} onChange={e => setFitToPage(e.target.checked)} className="accent-[#5d4037]" />
                  <span className="text-xs text-gray-600">Adjust field widths to fit all on one page</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Name + finish ────────────────────────────────── */}
        {step === 5 && (
          <div className="space-y-5 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">What title do you want for your report?</label>
              <Input value={reportName} onChange={e => setReportName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleFinish()} className="max-w-xs" />
              <p className="text-xs text-gray-400 mt-1">This title will appear at the top of the report.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Do you want to preview the report or modify its design?</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="reportOpenMode" value="preview" checked={openMode === 'preview'} onChange={() => setOpenMode('preview')} className="accent-[#5d4037]" />
                  <span className="text-sm text-gray-700">Preview the report</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="reportOpenMode" value="modify" checked={openMode === 'modify'} onChange={() => setOpenMode('modify')} className="accent-[#5d4037]" />
                  <span className="text-sm text-gray-700">Modify the report's design</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-600 space-y-0.5">
              <div><strong>Fields:</strong> {selectedFields.length} from {currentTable?.name || '—'}</div>
              {groupFields.length > 0 && <div><strong>Grouping:</strong> {groupFields.join(' → ')}</div>}
              {sortRows.filter(r => r.fieldName).length > 0 && (
                <div><strong>Sort:</strong> {sortRows.filter(r => r.fieldName).map(r => `${r.fieldName} (${r.dir})`).join(', ')}</div>
              )}
              <div><strong>Layout:</strong> {REPORT_LAYOUTS.find(l => l.id === layout)?.label} · {orientation}</div>
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
            <Button disabled={step === 1 && !canNext1} onClick={() => setStep(s => s + 1)} className="bg-[#5d4037] hover:bg-[#4e342e]">
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={!selectedTableId} className="bg-[#5d4037] hover:bg-[#4e342e]">
              <Check size={16} className="mr-1" /> Finish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
