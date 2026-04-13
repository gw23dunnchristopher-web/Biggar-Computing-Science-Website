/**
 * Report Wizard — mirrors the Microsoft Access Report Wizard exactly.
 * Step 1: Pick table + fields (shuttle interface)
 * Step 2: Add grouping levels
 * Step 3: Sort order (up to 4 fields, asc/desc)
 * Step 4: Layout + orientation
 * Step 5: Name + finish options
 */
import React, { useState, useEffect } from 'react';

interface Field { id: number; name: string; fieldType: string; sortOrder: number; isPrimaryKey: boolean; }
interface SelectedField { tableId: number; tableName: string; fieldName: string; fieldType: string; }

type LayoutOption = 'columnar' | 'tabular' | 'justified';
type Orientation = 'portrait' | 'landscape';
type SortDir = 'asc' | 'desc';

interface SortRow { fieldName: string; dir: SortDir; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: { id: number; name: string }[];
  databaseId: number;
  onFinish: (name: string, definition: any, openMode: 'preview' | 'modify') => void;
  apiFetch: (path: string, opts?: RequestInit) => Promise<any>;
}

const TOTAL_STEPS = 5;
const EMPTY_SORT: SortRow = { fieldName: '', dir: 'asc' };

function Step1Art() {
  return (
    <svg viewBox="0 0 130 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="rw-bg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5c842" />
          <stop offset="100%" stopColor="#e08a00" />
        </linearGradient>
      </defs>
      <rect width="130" height="220" fill="url(#rw-bg1)" />
      <rect x="10" y="25" width="50" height="8" rx="1" fill="#fff" opacity="0.85" />
      <rect x="10" y="37" width="50" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="10" y="47" width="50" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="10" y="57" width="50" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="10" y="67" width="50" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="10" y="77" width="50" height="6" rx="1" fill="#fff" opacity="0.6" />
      <text x="68" y="50" fontSize="16" fill="#7a3800" fontWeight="bold" fontFamily="Arial">&#x2192;</text>
      <text x="68" y="70" fontSize="16" fill="#7a3800" fontWeight="bold" fontFamily="Arial">&#x2192;</text>
      <rect x="86" y="25" width="36" height="8" rx="1" fill="#fff" opacity="0.85" />
      <rect x="86" y="42" width="36" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="86" y="52" width="36" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="86" y="62" width="36" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="10" y="100" width="112" height="8" rx="1" fill="#fff" opacity="0.7" />
      {[0,1,2,3,4].map(i => (
        <g key={i}>
          <rect x="10" y={113 + i * 10} width="50" height="6" rx="1" fill="#fff" opacity="0.5" />
          <rect x="64" y={113 + i * 10} width="58" height="6" rx="1" fill="#fff" opacity="0.5" />
        </g>
      ))}
    </svg>
  );
}

function Step3Art() {
  return (
    <svg viewBox="0 0 130 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="rw-bg3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5c842" />
          <stop offset="100%" stopColor="#e08a00" />
        </linearGradient>
      </defs>
      <rect width="130" height="220" fill="url(#rw-bg3)" />
      <rect x="15" y="20" width="100" height="8" rx="1" fill="#fff" opacity="0.8" />
      {[0,1,2,3,4,5,6].map(i => (
        <g key={i}>
          <rect x="15" y={35 + i * 12} width="45" height="7" rx="1" fill="#fff" opacity="0.5" />
          <rect x="64" y={35 + i * 12} width="51" height="7" rx="1" fill="#fff" opacity="0.5" />
        </g>
      ))}
      <text x="30" y="145" fontSize="20" fill="#7a3800" fontFamily="Arial">&#x2195;</text>
      <text x="55" y="145" fontSize="20" fill="#7a3800" fontFamily="Arial">&#x2195;</text>
      <text x="80" y="145" fontSize="20" fill="#7a3800" fontFamily="Arial">&#x2195;</text>
    </svg>
  );
}

function Step4Art({ layout, orientation }: { layout: LayoutOption; orientation: Orientation }) {
  const isLandscape = orientation === 'landscape';
  const vw = isLandscape ? 220 : 160;
  const vh = isLandscape ? 160 : 220;
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="rw-bg4" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5c842" />
          <stop offset="100%" stopColor="#e08a00" />
        </linearGradient>
      </defs>
      <rect width={vw} height={vh} fill="url(#rw-bg4)" />
      <rect x="8" y="8" width={vw - 16} height={vh - 16} rx="2" fill="#fff" opacity="0.2" />
      {layout === 'columnar' && (
        <g>
          {[0,1,2,3,4].map(i => (
            <g key={i}>
              <rect x="16" y={20 + i * 28} width={isLandscape ? 50 : 40} height="8" rx="1" fill="#fff" opacity="0.9" />
              <rect x={isLandscape ? 72 : 62} y={20 + i * 28} width={isLandscape ? 120 : 80} height="8" rx="1" fill="#fff" opacity="0.6" />
            </g>
          ))}
        </g>
      )}
      {layout === 'tabular' && (
        <g>
          <g>
            {[0,1,2].map(c => (
              <rect key={c} x={16 + c * (isLandscape ? 62 : 42)} y="20" width={isLandscape ? 56 : 36} height="8" rx="1" fill="#fff" opacity="0.9" />
            ))}
          </g>
          {[0,1,2,3,4,5].map(r => (
            <g key={r}>
              {[0,1,2].map(c => (
                <rect key={c} x={16 + c * (isLandscape ? 62 : 42)} y={34 + r * 14} width={isLandscape ? 56 : 36} height="7" rx="1" fill="#fff" opacity="0.5" />
              ))}
            </g>
          ))}
        </g>
      )}
      {layout === 'justified' && (
        <g>
          {[0,1,2,3].map(i => (
            <g key={i}>
              <rect x="16" y={20 + i * 40} width={isLandscape ? 50 : 35} height="7" rx="1" fill="#fff" opacity="0.9" />
              <rect x="16" y={30 + i * 40} width={vw - 32} height="8" rx="1" fill="#fff" opacity="0.5" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

function Step5Art() {
  return (
    <svg viewBox="0 0 130 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="rw-bg5" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5c842" />
          <stop offset="100%" stopColor="#e08a00" />
        </linearGradient>
      </defs>
      <rect width="130" height="220" fill="url(#rw-bg5)" />
      <rect x="20" y="30" width="90" height="70" rx="3" fill="#fff" opacity="0.3" />
      <rect x="30" y="42" width="70" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="30" y="54" width="70" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="30" y="66" width="70" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="30" y="78" width="70" height="6" rx="1" fill="#fff" opacity="0.6" />
      <rect x="35" y="115" width="60" height="60" rx="5" fill="none" stroke="#7a3800" strokeWidth="3" />
      <polyline points="45,148 58,162 85,130" fill="none" stroke="#7a3800" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WizBtn({ onClick, disabled, children, primary }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 border text-[12px] select-none min-w-[70px]
        ${disabled ? 'text-gray-400 border-gray-300 bg-[#f0f0f0] cursor-default'
          : primary ? 'text-black border-[#0078d7] bg-[#e1ecf7] hover:bg-[#cde0f7] focus:outline-none focus:ring-1 focus:ring-[#0078d7]'
          : 'text-black border-gray-400 bg-[#e1e1e1] hover:bg-[#d5d5d5] active:bg-[#c8c8c8] focus:outline-none focus:ring-1 focus:ring-gray-500'}`}
      style={{ fontFamily: 'Segoe UI, Tahoma, sans-serif' }}
    >
      {children}
    </button>
  );
}

export function ReportWizard({ open, onOpenChange, tables, databaseId, onFinish, apiFetch }: Props) {
  const [step, setStep] = useState(1);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [tableFields, setTableFields] = useState<Record<number, Field[]>>({});
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
  const [highlightAvail, setHighlightAvail] = useState<string | null>(null);
  const [highlightSel, setHighlightSel] = useState<number | null>(null);

  const [groupFields, setGroupFields] = useState<string[]>([]);
  const [highlightAvailGroup, setHighlightAvailGroup] = useState<string | null>(null);
  const [highlightGroup, setHighlightGroup] = useState<string | null>(null);

  const [sortRows, setSortRows] = useState<SortRow[]>([EMPTY_SORT, EMPTY_SORT, EMPTY_SORT, EMPTY_SORT]);

  const [layout, setLayout] = useState<LayoutOption>('tabular');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [fitToPage, setFitToPage] = useState(true);

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
      setHighlightAvailGroup(null);
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
      if (tbl) setReportName(tbl.name);
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

  const availableToGroup = selectedFields.filter(sf => !groupFields.includes(sf.fieldName));

  const addGroupField = (name: string) => { setGroupFields(prev => [...prev, name]); setHighlightAvailGroup(null); };
  const removeGroupField = (name: string) => { setGroupFields(prev => prev.filter(g => g !== name)); setHighlightGroup(null); };
  const moveGroupUp = (i: number) => {
    if (i === 0) return;
    setGroupFields(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
  };
  const moveGroupDown = (i: number) => {
    if (i >= groupFields.length - 1) return;
    setGroupFields(prev => { const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });
  };

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

  const canNext1 = selectedFields.length > 0;

  const nonGroupedFields = selectedFields.filter(sf => !groupFields.includes(sf.fieldName));
  const groupingPreviewText = nonGroupedFields.map(sf => sf.fieldName).join(', ');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-[#f0f0f0] border border-gray-500 shadow-2xl flex flex-col"
        style={{ width: 520, fontFamily: 'Segoe UI, Tahoma, Geneva, sans-serif', fontSize: 13 }}
      >
        {/* Title bar */}
        <div className="flex items-center px-3 py-1.5 bg-[#f0f0f0] border-b border-gray-300 select-none">
          <span className="font-semibold text-[13px] text-black">Report Wizard</span>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0" style={{ minHeight: 300 }}>

          {/* ── Step 1: Field picker ── */}
          {step === 1 && (
            <>
              <div className="flex-none w-[130px]" style={{ background: 'linear-gradient(135deg,#f5c842,#e08a00)' }}>
                <Step1Art />
              </div>
              <div className="flex-1 flex flex-col px-5 pt-4 pb-3 overflow-hidden">
                <p className="text-[13px] font-semibold text-black mb-0.5">Which fields do you want on your report?</p>
                <p className="text-[12px] text-black mb-3">You can choose from more than one table or query.</p>

                <div className="mb-2">
                  <div className="text-[12px] mb-0.5 underline">Tables/Queries</div>
                  <select
                    value={selectedTableId ?? ''}
                    onChange={e => { setSelectedTableId(Number(e.target.value)); setHighlightAvail(null); setSelectedFields([]); setGroupFields([]); setReportName(''); }}
                    className="w-full border border-gray-500 px-1 py-0.5 text-[12px] bg-white focus:outline-none"
                    style={{ height: 22 }}
                  >
                    {tables.map(t => <option key={t.id} value={t.id}>Table: {t.name}</option>)}
                  </select>
                </div>

                <div className="flex gap-1 flex-1 min-h-0">
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

          {/* ── Step 2: Grouping ── */}
          {step === 2 && (
            <div className="flex-1 flex flex-col px-5 pt-4 pb-3">
              <p className="text-[13px] font-semibold text-black mb-3">Do you want to add any grouping levels?</p>
              <div className="flex gap-2 flex-1 min-h-0">
                <div className="flex flex-col min-h-0" style={{ width: 120 }}>
                  <div className="flex-1 border border-gray-500 bg-white overflow-y-auto">
                    {availableToGroup.map(sf => (
                      <div
                        key={sf.fieldName}
                        onDoubleClick={() => addGroupField(sf.fieldName)}
                        onClick={() => setHighlightAvailGroup(sf.fieldName)}
                        className="px-2 py-px text-[12px] cursor-default select-none leading-5"
                        style={{ background: highlightAvailGroup === sf.fieldName ? '#000080' : 'transparent', color: highlightAvailGroup === sf.fieldName ? '#fff' : '#000' }}
                      >
                        {sf.fieldName}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1 items-center justify-center flex-none">
                  <WizBtn onClick={() => highlightAvailGroup && addGroupField(highlightAvailGroup)} disabled={!highlightAvailGroup}>
                    &gt;
                  </WizBtn>
                  <WizBtn onClick={() => highlightGroup && removeGroupField(highlightGroup)} disabled={!highlightGroup}>
                    &lt;
                  </WizBtn>
                  <div className="my-1">
                    <WizBtn onClick={() => { const i = groupFields.indexOf(highlightGroup || ''); if (i >= 0) moveGroupUp(i); }} disabled={!highlightGroup || groupFields.indexOf(highlightGroup || '') <= 0}>
                      &#x25B2;
                    </WizBtn>
                  </div>
                  <div className="text-[11px] text-black font-semibold">Priority</div>
                  <WizBtn onClick={() => { const i = groupFields.indexOf(highlightGroup || ''); if (i >= 0) moveGroupDown(i); }} disabled={!highlightGroup || groupFields.indexOf(highlightGroup || '') >= groupFields.length - 1}>
                    &#x25BC;
                  </WizBtn>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 border-2 border-[#e0a800] bg-white overflow-y-auto p-2">
                    {groupFields.length > 0 ? (
                      <div className="space-y-1">
                        {groupFields.map((g, i) => (
                          <div
                            key={g}
                            onClick={() => setHighlightGroup(g)}
                            className="px-2 py-0.5 text-[12px] cursor-default select-none"
                            style={{
                              marginLeft: i * 16,
                              background: highlightGroup === g ? '#000080' : 'transparent',
                              color: highlightGroup === g ? '#fff' : '#000',
                              fontWeight: 'bold'
                            }}
                          >
                            {g}
                          </div>
                        ))}
                        <div
                          className="text-[12px] text-black px-2 py-0.5"
                          style={{ marginLeft: groupFields.length * 16 }}
                        >
                          {groupingPreviewText}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[12px] text-black px-2 py-0.5">
                        {selectedFields.map(sf => sf.fieldName).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <WizBtn disabled>Grouping Options ...</WizBtn>
              </div>
            </div>
          )}

          {/* ── Step 3: Sort order ── */}
          {step === 3 && (
            <>
              <div className="flex-none w-[130px]" style={{ background: 'linear-gradient(135deg,#f5c842,#e08a00)' }}>
                <Step3Art />
              </div>
              <div className="flex-1 flex flex-col px-5 pt-4 pb-3">
                <p className="text-[13px] font-semibold text-black mb-1">What sort order do you want for your records?</p>
                <p className="text-[12px] text-black mb-4">You can sort records by up to four fields, in either ascending or descending order.</p>
                <div className="space-y-3">
                  {sortRows.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[13px] text-black w-4 flex-shrink-0 font-semibold">{i + 1}</span>
                      <select
                        value={row.fieldName}
                        onChange={e => setSortField(i, e.target.value)}
                        className="flex-1 border border-gray-500 px-1 py-0.5 text-[12px] bg-white focus:outline-none"
                        style={{ height: 22 }}
                        disabled={i > 0 && !sortRows[i - 1].fieldName}
                      >
                        <option value=""></option>
                        {sortableFields
                          .filter(fn => fn === row.fieldName || !sortRows.some((r, ri) => ri !== i && r.fieldName === fn))
                          .map(fn => <option key={fn} value={fn}>{fn}</option>)}
                      </select>
                      <button
                        onClick={() => toggleSortDir(i)}
                        disabled={!row.fieldName}
                        className="border border-gray-400 bg-[#e1e1e1] hover:bg-[#d5d5d5] px-2 py-0.5 text-[12px] min-w-[80px] disabled:text-gray-400 disabled:bg-[#f0f0f0] disabled:cursor-default select-none"
                        style={{ fontFamily: 'Segoe UI, Tahoma, sans-serif' }}
                      >
                        {row.dir === 'asc' ? 'Ascending' : 'Descending'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Step 4: Layout + orientation ── */}
          {step === 4 && (
            <div className="flex-1 flex flex-col px-5 pt-4 pb-3">
              <p className="text-[13px] font-semibold text-black mb-3">How would you like to lay out your report?</p>
              <div className="flex gap-4 flex-1 min-h-0">
                <div className="flex-none" style={{ width: 170, height: 190, background: 'linear-gradient(135deg,#f5c842,#e08a00)', border: '2px solid #c87800' }}>
                  <Step4Art layout={layout} orientation={orientation} />
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  <div>
                    <div className="text-[12px] font-semibold text-black mb-1 border-b border-gray-400 pb-0.5">Layout</div>
                    <div className="space-y-1 mt-1">
                      {(['columnar', 'tabular', 'justified'] as LayoutOption[]).map(l => (
                        <label key={l} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="rptLayout" value={l} checked={layout === l} onChange={() => setLayout(l)} style={{ accentColor: '#000080' }} />
                          <span className="text-[13px] text-black">{l.charAt(0).toUpperCase() + l.slice(1)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[12px] font-semibold text-black mb-1 border-b border-gray-400 pb-0.5">Orientation</div>
                    <div className="flex items-start gap-3 mt-1">
                      <div className="space-y-1">
                        {(['portrait', 'landscape'] as Orientation[]).map(o => (
                          <label key={o} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="rptOrientation" value={o} checked={orientation === o} onChange={() => setOrientation(o)} style={{ accentColor: '#000080' }} />
                            <span className="text-[13px] text-black">{o.charAt(0).toUpperCase() + o.slice(1)}</span>
                          </label>
                        ))}
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {orientation === 'portrait' ? (
                          <div className="border-2 border-gray-500 bg-white flex items-center justify-center" style={{ width: 28, height: 36 }}>
                            <span className="text-[14px] font-serif text-gray-600">A</span>
                          </div>
                        ) : (
                          <div className="border-2 border-gray-500 bg-white flex items-center justify-center" style={{ width: 36, height: 28 }}>
                            <span className="text-[14px] font-serif text-gray-600">A</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-3">
                <input type="checkbox" checked={fitToPage} onChange={e => setFitToPage(e.target.checked)} style={{ accentColor: '#000080' }} />
                <span className="text-[12px] text-black">Adjust the field width so all fields fit on a page.</span>
              </label>
            </div>
          )}

          {/* ── Step 5: Name + finish ── */}
          {step === 5 && (
            <>
              <div className="flex-none w-[130px]" style={{ background: 'linear-gradient(135deg,#f5c842,#e08a00)' }}>
                <Step5Art />
              </div>
              <div className="flex-1 flex flex-col px-5 pt-4 pb-3">
                <p className="text-[13px] font-semibold text-black mb-2">What title do you want for your report?</p>
                <input
                  type="text"
                  value={reportName}
                  onChange={e => setReportName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFinish()}
                  autoFocus
                  className="border border-gray-500 px-1.5 py-0.5 text-[13px] bg-white focus:outline-none w-full mb-4"
                  style={{ height: 22 }}
                />
                <p className="text-[12px] text-black mb-3">
                  That's all the information the wizard needs to create your report.
                  <br /><br />
                  Do you want to preview the report or modify the report's design?
                </p>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input type="radio" name="reportOpenMode" value="preview" checked={openMode === 'preview'} onChange={() => setOpenMode('preview')} style={{ accentColor: '#000080' }} />
                  <span className="text-[13px] text-black">Preview the report.</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="reportOpenMode" value="modify" checked={openMode === 'modify'} onChange={() => setOpenMode('modify')} style={{ accentColor: '#000080' }} />
                  <span className="text-[13px] text-black">Modify the report's design.</span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-400 bg-[#f0f0f0] px-3 py-2 flex items-center justify-end gap-2">
          <WizBtn onClick={() => onOpenChange(false)}>Cancel</WizBtn>
          <WizBtn onClick={() => setStep(s => s - 1)} disabled={step === 1}>&lt; Back</WizBtn>
          <WizBtn onClick={() => setStep(s => s + 1)} disabled={step === TOTAL_STEPS || (step === 1 && !canNext1)} primary={step < TOTAL_STEPS}>Next &gt;</WizBtn>
          <WizBtn onClick={handleFinish} disabled={!selectedTableId || selectedFields.length === 0} primary={step === TOTAL_STEPS}>Finish</WizBtn>
        </div>
      </div>
    </div>
  );
}
