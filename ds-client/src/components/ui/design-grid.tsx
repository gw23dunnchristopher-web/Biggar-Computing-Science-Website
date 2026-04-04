import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UpdateFieldRequest } from '@/api';
import { Trash2, ChevronRight, X, Plus } from 'lucide-react';
import keyIconSrc from '@assets/key-icon-2_1773991711720.jpg';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface LookupConfig {
  type: 'valuelist' | 'table';
  values?: string[];
  tableId?: number;
  valueField?: string;
  displayField?: string;
}

export function parseLookupConfig(description: string | null | undefined): LookupConfig | null {
  if (!description?.startsWith('__lookup__:')) return null;
  try { return JSON.parse(description.slice('__lookup__:'.length)); } catch { return null; }
}
export function encodeLookupConfig(cfg: LookupConfig): string {
  return '__lookup__:' + JSON.stringify(cfg);
}
export function parseCalculatedExpr(description: string | null | undefined): string {
  if (!description?.startsWith('__calc__:')) return '';
  return description.slice('__calc__:'.length);
}
export function encodeCalculatedExpr(expr: string): string {
  return '__calc__:' + expr;
}
export function parseValidation(description: string | null | undefined): { rule: string; text: string } {
  if (!description?.startsWith('__validation__:')) return { rule: '', text: '' };
  try {
    const { rule = '', text = '' } = JSON.parse(description.slice('__validation__:'.length));
    return { rule, text };
  } catch { return { rule: '', text: '' }; }
}
export function encodeValidation(rule: string, text: string): string | null {
  if (!rule && !text) return null;
  return '__validation__:' + JSON.stringify({ rule, text });
}

interface DesignGridProps {
  fields: UpdateFieldRequest[];
  onChange: (fields: UpdateFieldRequest[]) => void;
  selectedIndex?: number | null;
  onSelectedIndexChange?: (i: number | null) => void;
  tables?: { id: number; name: string; fields?: { name: string }[] }[];
  databaseId?: number;
  onBeforeTypeChange?: (fieldIdx: number, oldType: string, newType: string) => Promise<boolean>;
}

type FieldTypeInfo = {
  value: string;
  label: string;
  group: string;
  description: string;
  icon: string;
};

const FIELD_TYPES: FieldTypeInfo[] = [
  { value: 'text',        label: 'Short Text',     group: 'Text',     description: 'Up to 255 characters',                   icon: 'AB' },
  { value: 'longtext',    label: 'Long Text',       group: 'Text',     description: 'Large amounts of text (Memo)',            icon: '¶' },
  { value: 'number',      label: 'Number',          group: 'Numeric',  description: 'Numeric data for calculations',           icon: '12' },
  { value: 'currency',    label: 'Currency',        group: 'Numeric',  description: 'Monetary values with £ symbol',          icon: '£' },
  { value: 'date',        label: 'Date/Time',       group: 'Date',     description: 'Date and time values',                   icon: '📅' },
  { value: 'autonumber',  label: 'AutoNumber',      group: 'Special',  description: 'Unique sequential ID (read-only)',       icon: '#' },
  { value: 'boolean',     label: 'Yes/No',          group: 'Special',  description: 'True/False check box',                  icon: '☑' },
  { value: 'hyperlink',   label: 'Hyperlink',       group: 'Text',     description: 'Clickable web address or email',         icon: '🔗' },
  { value: 'attachment',  label: 'Attachment',      group: 'Special',  description: 'Files and images attached to a record',  icon: '📎' },
  { value: 'calculated',  label: 'Calculated',      group: 'Special',  description: 'Value computed from an expression',      icon: 'ƒ' },
  { value: 'lookup',      label: 'Lookup Wizard…',  group: 'Special',  description: 'Dropdown from a list or another table', icon: '▼' },
];

const FIELD_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  FIELD_TYPES.map(t => [t.value, t.label])
);

export function DesignGrid({ fields, onChange, selectedIndex: controlledIdx, onSelectedIndexChange, tables = [], databaseId, onBeforeTypeChange }: DesignGridProps) {
  const [localIdx, setLocalIdx] = useState<number | null>(null);
  const selectedIndex = controlledIdx !== undefined ? controlledIdx : localIdx;
  const setSelectedIndex = (i: number | null) => { setLocalIdx(i); onSelectedIndexChange?.(i); };
  const [ctxFieldIdx, setCtxFieldIdx] = useState<number | null>(null);
  const selectedField = selectedIndex !== null && selectedIndex !== undefined ? fields[selectedIndex] : null;

  // ── Column resize ──
  const [colWidths, setColWidths] = useState<Record<string, number>>({ name: 240, type: 180, desc: 9999 });
  const [resizing, setResizing] = useState<{ col: string; startX: number; startW: number } | null>(null);

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const newW = Math.max(80, resizing.startW + e.clientX - resizing.startX);
      setColWidths(prev => ({ ...prev, [resizing.col]: newW }));
    };
    const onUp = () => setResizing(null);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [resizing]);

  // ── Lookup Wizard ──
  const [lookupWizardOpen, setLookupWizardOpen] = useState(false);
  const [lwStep, setLwStep] = useState(1);
  const [lwFieldIdx, setLwFieldIdx] = useState<number | null>(null);
  const [lwSourceType, setLwSourceType] = useState<'valuelist' | 'table'>('valuelist');
  const [lwValues, setLwValues] = useState<string[]>(['', '', '']);
  const [lwTableId, setLwTableId] = useState<number | null>(null);
  const [lwValueField, setLwValueField] = useState('');
  const [lwDisplayField, setLwDisplayField] = useState('');
  const [lwEnforceIntegrity, setLwEnforceIntegrity] = useState(false);
  const [lwSortField, setLwSortField] = useState('');
  const [lwSortDir, setLwSortDir] = useState<'asc' | 'desc'>('asc');

  const openLookupWizard = useCallback((fieldIdx: number) => {
    setLwFieldIdx(fieldIdx);
    const existing = parseLookupConfig(fields[fieldIdx]?.description);
    if (existing?.type === 'valuelist') {
      setLwSourceType('valuelist');
      setLwValues(existing.values && existing.values.length > 0 ? existing.values : ['', '', '']);
    } else if (existing?.type === 'table') {
      setLwSourceType('table');
      setLwTableId(existing.tableId ?? null);
      setLwValueField(existing.valueField ?? '');
      setLwDisplayField(existing.displayField ?? '');
    } else {
      setLwSourceType('valuelist');
      setLwValues(['', '', '']);
      setLwTableId(null);
      setLwValueField('');
      setLwDisplayField('');
    }
    setLwStep(1);
    setLwEnforceIntegrity(false);
    setLwSortField('');
    setLwSortDir('asc');
    setLookupWizardOpen(true);
  }, [fields]);

  const finishLookupWizard = () => {
    if (lwFieldIdx === null) return;
    let cfg: LookupConfig;
    if (lwSourceType === 'valuelist') {
      cfg = { type: 'valuelist', values: lwValues.filter(v => v.trim() !== '') };
    } else {
      cfg = { type: 'table', tableId: lwTableId!, valueField: lwValueField, displayField: lwDisplayField || lwValueField };
    }
    const newFields = [...fields];
    newFields[lwFieldIdx] = { ...newFields[lwFieldIdx], fieldType: 'lookup', description: encodeLookupConfig(cfg) };
    onChange(newFields);
    setLookupWizardOpen(false);
  };

  const lwSelectedTable = tables.find(t => t.id === lwTableId);
  const lwTableFields = lwSelectedTable?.fields ?? [];

  // ── Field mutation ──
  const updateField = (index: number, key: keyof UpdateFieldRequest, value: any) => {
    const newFields = [...fields];
    if (key === 'isPrimaryKey' && value === true) newFields.forEach(f => { f.isPrimaryKey = false; });
    newFields[index] = { ...newFields[index], [key]: value };
    onChange(newFields);
  };
  const updateSelected = (key: keyof UpdateFieldRequest, value: any) => {
    if (selectedIndex === null || selectedIndex === undefined) return;
    updateField(selectedIndex, key, value);
  };

  const addField = () => {
    const newIdx = fields.length;
    onChange([...fields, {
      name: '', fieldType: 'text' as any, isRequired: false,
      isPrimaryKey: fields.length === 0, sortOrder: fields.length,
      caption: null, defaultValue: null, fieldSize: null, description: null,
    }]);
    setSelectedIndex(newIdx);
  };

  const removeField = (index: number) => {
    if (fields[index]?.isPrimaryKey) return;
    onChange(fields.filter((_, i) => i !== index));
    setSelectedIndex(null);
  };

  const handleTypeChange = async (idx: number, value: string) => {
    const oldType = fields[idx]?.fieldType ?? '';
    if (oldType === value) return;
    if (onBeforeTypeChange) {
      const ok = await onBeforeTypeChange(idx, oldType, value);
      if (!ok) return;
    }
    if (value === 'lookup') {
      openLookupWizard(idx);
    } else if (value === 'calculated') {
      const newFields = [...fields];
      const existingExpr = parseCalculatedExpr(fields[idx]?.description);
      newFields[idx] = { ...newFields[idx], fieldType: 'calculated' as any, description: encodeCalculatedExpr(existingExpr) };
      onChange(newFields);
    } else {
      updateField(idx, 'fieldType', value);
    }
  };

  // ── Field Properties: type-specific helpers ──
  const lookupConfig = selectedField ? parseLookupConfig(selectedField.description) : null;
  const calcExpr = selectedField ? parseCalculatedExpr(selectedField.description) : '';
  const validation = selectedField ? parseValidation(selectedField.description) : { rule: '', text: '' };

  const updateValidation = (rule: string, text: string) => {
    updateSelected('description', encodeValidation(rule, text));
  };

  return (
    <div className="w-full h-full flex flex-col bg-white select-none">
      {/* ── Lookup Wizard Modal ── */}
      {lookupWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-gray-400 shadow-2xl w-[520px] flex flex-col" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
            {/* Title bar */}
            <div className="flex items-center justify-between bg-[#C42B1C] text-white px-3 py-1.5 select-none">
              <span className="font-semibold text-sm">Lookup Wizard</span>
              <button onClick={() => setLookupWizardOpen(false)} className="hover:bg-white/20 rounded p-0.5"><X size={14} /></button>
            </div>

            {/* Wizard graphic stripe */}
            <div className="flex">
              <div className="w-28 bg-[#cce5ff] flex flex-col items-center justify-start pt-6 border-r border-gray-300 flex-none">
                <div className="text-4xl mb-2">🧙</div>
                <div className="text-[10px] text-center text-gray-600 px-2 leading-tight">Lookup Wizard</div>
              </div>

              <div className="flex-1 p-4 min-h-[260px]">
                {lwStep === 1 && (
                  <>
                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                      This wizard creates a lookup field, which displays a list of values you can choose from. How do you want your lookup field to get its values?
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="radio" className="mt-0.5" checked={lwSourceType === 'table'} onChange={() => setLwSourceType('table')} />
                        <div>
                          <div className="text-sm font-medium">I want the lookup field to get the values from another table or query.</div>
                          <div className="text-xs text-gray-500">Creates a foreign key relationship to another table.</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="radio" className="mt-0.5" checked={lwSourceType === 'valuelist'} onChange={() => setLwSourceType('valuelist')} />
                        <div>
                          <div className="text-sm font-medium">I will type in the values that I want.</div>
                          <div className="text-xs text-gray-500">Creates a fixed list of choices (e.g., Small, Medium, Large).</div>
                        </div>
                      </label>
                    </div>
                  </>
                )}

                {lwStep === 2 && lwSourceType === 'valuelist' && (
                  <>
                    <p className="text-sm text-gray-700 mb-3">What values do you want to see in your lookup field? Enter each value on a separate row.</p>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {lwValues.map((v, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-5 text-right text-xs text-gray-400 flex-none">{i + 1}</span>
                          <input
                            value={v}
                            onChange={e => { const next = [...lwValues]; next[i] = e.target.value; setLwValues(next); }}
                            placeholder="Enter value..."
                            className="flex-1 border border-gray-300 px-2 py-0.5 text-sm outline-none focus:border-[#C42B1C] rounded-sm"
                          />
                          {lwValues.length > 1 && (
                            <button onClick={() => setLwValues(lwValues.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setLwValues([...lwValues, ''])}
                      className="mt-2 text-xs text-[#C42B1C] hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Add another value
                    </button>
                  </>
                )}

                {lwStep === 2 && lwSourceType === 'table' && (
                  <>
                    <p className="text-sm text-gray-700 mb-3">Which table or query should provide the values for your lookup field?</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Source Table</label>
                        <select
                          value={lwTableId ?? ''}
                          onChange={e => { setLwTableId(Number(e.target.value)); setLwValueField(''); setLwDisplayField(''); }}
                          className="w-full border border-gray-300 px-2 py-1 text-sm outline-none focus:border-[#C42B1C] rounded-sm"
                        >
                          <option value="">— Choose a table —</option>
                          {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      {lwSelectedTable && (
                        <>
                          <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Value Field (stored in this field)</label>
                            <select
                              value={lwValueField}
                              onChange={e => setLwValueField(e.target.value)}
                              className="w-full border border-gray-300 px-2 py-1 text-sm outline-none focus:border-[#C42B1C] rounded-sm"
                            >
                              <option value="">— Choose a field —</option>
                              {lwTableFields.map((f: any) => <option key={f.name} value={f.name}>{f.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Display Field (shown to users)</label>
                            <select
                              value={lwDisplayField}
                              onChange={e => setLwDisplayField(e.target.value)}
                              className="w-full border border-gray-300 px-2 py-1 text-sm outline-none focus:border-[#C42B1C] rounded-sm"
                            >
                              <option value="">— Same as value field —</option>
                              {lwTableFields.map((f: any) => <option key={f.name} value={f.name}>{f.name}</option>)}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                {lwStep === 3 && lwSourceType === 'table' && (
                  <>
                    <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                      What sort order do you want for the items in your lookup list?
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Sort Field</label>
                        <select
                          value={lwSortField}
                          onChange={e => setLwSortField(e.target.value)}
                          className="w-full border border-gray-300 px-2 py-1 text-sm outline-none focus:border-[#C42B1C] rounded-sm"
                        >
                          <option value="">(none)</option>
                          {lwTableFields.map((f: any) => <option key={f.name} value={f.name}>{f.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Sort Order</label>
                        <select
                          value={lwSortDir}
                          onChange={e => setLwSortDir(e.target.value as 'asc' | 'desc')}
                          className="w-full border border-gray-300 px-2 py-1 text-sm outline-none focus:border-[#C42B1C] rounded-sm"
                          disabled={!lwSortField}
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {lwStep === 4 && lwSourceType === 'table' && (
                  <>
                    <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                      Do you want to enable data integrity between these tables?
                    </p>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-[#C42B1C]"
                        checked={lwEnforceIntegrity}
                        onChange={e => setLwEnforceIntegrity(e.target.checked)}
                      />
                      <div>
                        <div className="text-sm font-medium">Enable Data Integrity</div>
                        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                          Prevents invalid links between tables. You cannot enter a value in this lookup field unless a matching record exists in the source table.
                        </div>
                      </div>
                    </label>
                    <p className="text-xs text-gray-400 mt-4">
                      What label would you like for your lookup field?
                    </p>
                    <input
                      defaultValue={lwValueField}
                      className="mt-1 w-full border border-gray-300 px-2 py-1 text-sm outline-none focus:border-[#C42B1C] rounded-sm"
                      placeholder="Label for the lookup column..."
                    />
                  </>
                )}
              </div>
            </div>

            {/* Wizard nav buttons */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-300 bg-[#f3f2f1]">
              <Button variant="outline" size="sm" onClick={() => setLookupWizardOpen(false)}>Cancel</Button>
              <div className="flex gap-2">
                {lwStep > 1 && (
                  <Button variant="outline" size="sm" onClick={() => setLwStep(s => s - 1)}>← Back</Button>
                )}
                {lwStep === 1 ? (
                  <Button size="sm" className="bg-[#C42B1C] hover:bg-[#9B2118]" onClick={() => setLwStep(2)}>
                    Next <ChevronRight size={14} className="ml-1" />
                  </Button>
                ) : lwStep === 2 && lwSourceType === 'table' ? (
                  <Button
                    size="sm"
                    className="bg-[#C42B1C] hover:bg-[#9B2118]"
                    disabled={!lwTableId || !lwValueField}
                    onClick={() => setLwStep(3)}
                  >
                    Next <ChevronRight size={14} className="ml-1" />
                  </Button>
                ) : lwStep === 3 && lwSourceType === 'table' ? (
                  <Button
                    size="sm"
                    className="bg-[#C42B1C] hover:bg-[#9B2118]"
                    onClick={() => setLwStep(4)}
                  >
                    Next <ChevronRight size={14} className="ml-1" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-[#C42B1C] hover:bg-[#9B2118]"
                    disabled={lwSourceType === 'valuelist' ? lwValues.filter(v => v.trim()).length === 0 : false}
                    onClick={finishLookupWizard}
                  >
                    Finish
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Field grid ── */}
      <ContextMenu>
      <ContextMenuTrigger asChild>
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-left border-collapse bg-white text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 40 }} />
            <col style={{ width: colWidths.name }} />
            <col style={{ width: colWidths.type }} />
            <col style={{ width: colWidths.desc }} />
            <col style={{ width: 48 }} />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="bg-[#f3f2f1] border-r border-b border-gray-300 w-10" />
              <th className="relative bg-[#f3f2f1] border-r border-b border-gray-300 px-3 py-1.5 font-medium text-gray-700 text-xs">
                Field Name
                <div
                  className="absolute top-0 right-0 w-2 h-full cursor-col-resize z-20 hover:bg-[#C42B1C]/30 group"
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setResizing({ col: 'name', startX: e.clientX, startW: colWidths.name }); }}
                >
                  <div className="absolute right-0 top-1 bottom-1 w-0.5 bg-gray-300 group-hover:bg-[#C42B1C]" />
                </div>
              </th>
              <th className="relative bg-[#f3f2f1] border-r border-b border-gray-300 px-3 py-1.5 font-medium text-gray-700 text-xs">
                Data Type
                <div
                  className="absolute top-0 right-0 w-2 h-full cursor-col-resize z-20 hover:bg-[#C42B1C]/30 group"
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setResizing({ col: 'type', startX: e.clientX, startW: colWidths.type }); }}
                >
                  <div className="absolute right-0 top-1 bottom-1 w-0.5 bg-gray-300 group-hover:bg-[#C42B1C]" />
                </div>
              </th>
              <th className="bg-[#f3f2f1] border-r border-b border-gray-300 px-3 py-1.5 font-medium text-gray-700 text-xs">Description (Optional)</th>
              <th className="w-12 bg-[#f3f2f1] border-b border-gray-300 text-center" />
            </tr>
          </thead>
          <tbody>
            {fields.map((f, i) => {
              const cfg = parseLookupConfig(f.description);
              const descDisplay = f.fieldType === 'lookup'
                ? (cfg?.type === 'valuelist' ? `Value list: ${(cfg.values || []).join(', ')}` : cfg ? `→ Table ${cfg.tableId}: ${cfg.displayField || cfg.valueField}` : '')
                : f.fieldType === 'calculated'
                ? parseCalculatedExpr(f.description)
                : f.description ?? '';

              return (
                <tr
                  key={i}
                  className={`group border-b border-gray-200 cursor-pointer ${selectedIndex === i ? 'bg-[#cce5ff]' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedIndex(i)}
                  onContextMenu={() => { setCtxFieldIdx(i); setSelectedIndex(i); }}
                >
                  <td
                    className="w-10 border-r border-gray-300 bg-[#f3f2f1] text-center py-1 group/pk"
                    onClick={e => { e.stopPropagation(); if (!f.isPrimaryKey) { updateField(i, 'isPrimaryKey', true); setSelectedIndex(i); } }}
                    title={f.isPrimaryKey ? 'Primary Key' : 'Click to set as Primary Key'}
                  >
                    {f.isPrimaryKey && (
                      <img src={keyIconSrc} alt="Primary Key" className="w-4 h-4 mx-auto object-contain" />
                    )}
                  </td>
                  <td className="border-r border-gray-300 p-0 focus-within:ring-2 focus-within:ring-[#C42B1C] focus-within:ring-inset overflow-hidden">
                    <input
                      value={f.name}
                      onChange={e => updateField(i, 'name', e.target.value)}
                      onClick={() => setSelectedIndex(i)}
                      className="w-full px-3 py-1.5 outline-none bg-transparent"
                      placeholder="Enter field name"
                    />
                  </td>
                  <td className="border-r border-gray-300 p-0 focus-within:ring-2 focus-within:ring-[#C42B1C] focus-within:ring-inset overflow-hidden">
                    <select
                      value={f.fieldType}
                      onChange={e => handleTypeChange(i, e.target.value)}
                      onClick={() => setSelectedIndex(i)}
                      className="w-full px-2 py-1.5 outline-none bg-transparent cursor-pointer"
                    >
                      <option value="attachment">Attachment</option>
                      <option value="autonumber">AutoNumber</option>
                      <option value="calculated">Calculated</option>
                      <option value="currency">Currency</option>
                      <option value="date">Date/Time</option>
                      <option value="hyperlink">Hyperlink</option>
                      <option value="longtext">Long Text</option>
                      <option value="lookup">Lookup Wizard…</option>
                      <option value="number">Number</option>
                      <option value="text">Short Text</option>
                      <option value="boolean">Yes/No</option>
                    </select>
                  </td>
                  <td className="border-r border-gray-300 p-0 overflow-hidden">
                    {f.fieldType === 'lookup' ? (
                      <div className="px-3 py-1.5 text-xs text-[#C42B1C] italic truncate flex items-center gap-1">
                        <span>▼</span>
                        <span className="truncate">{descDisplay || 'Not configured'}</span>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedIndex(i); openLookupWizard(i); }}
                          className="ml-auto flex-none text-[10px] underline hover:no-underline"
                        >Edit</button>
                      </div>
                    ) : f.fieldType === 'calculated' ? (
                      <div className="px-3 py-1.5 text-xs text-purple-600 italic truncate">ƒ {descDisplay || 'Enter expression in Field Properties'}</div>
                    ) : (
                      <input
                        value={f.description && !f.description.startsWith('__') ? f.description : ''}
                        onChange={e => updateField(i, 'description', e.target.value || null)}
                        onClick={() => setSelectedIndex(i)}
                        className="w-full px-3 py-1.5 outline-none bg-transparent text-gray-500"
                        placeholder="Description..."
                      />
                    )}
                  </td>
                  <td className="text-center">
                    {!f.isPrimaryKey && (
                      <button
                        onClick={e => { e.stopPropagation(); removeField(i); }}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded mx-auto transition-colors"
                        title="Delete Field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr className="border-b border-gray-200">
              <td className="w-10 border-r border-gray-300 bg-[#f3f2f1] text-center">
                <span className="text-[#C42B1C] font-bold text-lg">*</span>
              </td>
              <td className="border-r border-gray-300 p-0">
                <input
                  placeholder="Click to add new field..."
                  onFocus={addField}
                  className="w-full px-3 py-1.5 outline-none bg-transparent italic text-gray-500"
                />
              </td>
              <td colSpan={3} />
            </tr>
          </tbody>
        </table>
      </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52 text-sm">
        {ctxFieldIdx !== null && fields[ctxFieldIdx] && (
          <>
            <ContextMenuLabel className="text-xs text-gray-500 font-normal px-2 py-1 truncate">
              {fields[ctxFieldIdx].name || '(unnamed field)'}
            </ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuItem
              disabled={!!fields[ctxFieldIdx]?.isPrimaryKey}
              className={fields[ctxFieldIdx]?.isPrimaryKey ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 focus:text-red-600 focus:bg-red-50'}
              onClick={() => { if (ctxFieldIdx !== null) removeField(ctxFieldIdx); }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete Rows
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
      </ContextMenu>

      {/* ── Field Properties pane ── */}
      <div className="h-64 border-t-2 border-gray-400 bg-[#f3f2f1] flex flex-col flex-none">
        <div className="px-4 py-1.5 bg-gray-300 border-b border-gray-400 text-xs font-semibold text-gray-800 select-none">
          Field Properties
          {selectedField && (
            <span className="ml-2 font-normal text-gray-500">
              — {selectedField.name || '(unnamed)'} · {FIELD_TYPE_LABELS[selectedField.fieldType] || selectedField.fieldType}
            </span>
          )}
        </div>

        {!selectedField ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic">
            Click a field row above to view and edit its properties
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-xs">
              <tbody>
                {/* Primary Key */}
                <tr className="border-b border-gray-300 hover:bg-gray-100 bg-yellow-50">
                  <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-yellow-100 border-r border-gray-300 select-none">
                    <img src={keyIconSrc} alt="Key" className="w-3.5 h-3.5 inline-block mr-1.5 object-contain" />Primary Key
                  </td>
                  <td className="px-2 py-0.5">
                    <select
                      value={selectedField.isPrimaryKey ? 'Yes' : 'No'}
                      onChange={e => updateSelected('isPrimaryKey', e.target.value === 'Yes')}
                      className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                    {selectedField.isPrimaryKey && (
                      <span className="ml-3 text-xs text-yellow-700 font-medium">Uniquely identifies each record</span>
                    )}
                  </td>
                </tr>

                {/* Field Size — text and longtext */}
                {(selectedField.fieldType === 'text' || selectedField.fieldType === 'longtext') && (
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none">Field Size</td>
                    <td className="px-2 py-0.5">
                      {selectedField.fieldType === 'text' ? (
                        <>
                          <input
                            type="number" min={1} max={255}
                            value={selectedField.fieldSize ?? ''}
                            onChange={e => updateSelected('fieldSize', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-24 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm"
                            placeholder="255"
                          />
                          <span className="ml-2 text-gray-400">characters (max 255)</span>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">Unlimited (up to 65,535 characters)</span>
                      )}
                    </td>
                  </tr>
                )}

                {/* Field Size — number */}
                {selectedField.fieldType === 'number' && (
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none">Field Size</td>
                    <td className="px-2 py-0.5">
                      <select className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option>Long Integer</option>
                        <option>Single</option>
                        <option>Double</option>
                        <option>Decimal</option>
                      </select>
                    </td>
                  </tr>
                )}

                {/* Currency format */}
                {selectedField.fieldType === 'currency' && (
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none">Format</td>
                    <td className="px-2 py-0.5">
                      <select className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option>Pound (£ 1,234.56)</option>
                        <option>Euro (€ 1,234.56)</option>
                        <option>Dollar ($ 1,234.56)</option>
                      </select>
                    </td>
                  </tr>
                )}

                {/* Date/Time format */}
                {selectedField.fieldType === 'date' && (
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none">Format</td>
                    <td className="px-2 py-0.5">
                      <select className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option value="">General Date (16/04/2025 15:24:00)</option>
                        <option value="longdate">Long Date (16 April 2025)</option>
                        <option value="mediumdate">Medium Date (16-Apr-25)</option>
                        <option value="shortdate">Short Date (16/04/2025)</option>
                        <option value="longtime">Long Time (15:24:00)</option>
                        <option value="mediumtime">Medium Time (03:24 PM)</option>
                        <option value="shorttime">Short Time (15:24)</option>
                      </select>
                    </td>
                  </tr>
                )}

                {/* Yes/No format */}
                {selectedField.fieldType === 'boolean' && (
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none">Format</td>
                    <td className="px-2 py-0.5">
                      <select className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option>Yes/No</option>
                        <option>True/False</option>
                        <option>On/Off</option>
                      </select>
                    </td>
                  </tr>
                )}

                {/* Number decimal places */}
                {(selectedField.fieldType === 'number' || selectedField.fieldType === 'currency') && (
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none">Decimal Places</td>
                    <td className="px-2 py-0.5">
                      <select className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option value="auto">Auto</option>
                        {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                  </tr>
                )}

                {/* Caption */}
                <tr className="border-b border-gray-300 hover:bg-gray-100">
                  <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none">Caption</td>
                  <td className="px-2 py-0.5">
                    <input
                      value={selectedField.caption ?? ''}
                      onChange={e => updateSelected('caption', e.target.value || null)}
                      className="w-full max-w-xs bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm"
                      placeholder={selectedField.name}
                    />
                  </td>
                </tr>

                {/* Default Value — not for autonumber/calculated/attachment */}
                {!['autonumber', 'calculated', 'attachment'].includes(selectedField.fieldType) && (
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none">Default Value</td>
                    <td className="px-2 py-0.5">
                      <input
                        value={selectedField.defaultValue ?? ''}
                        onChange={e => updateSelected('defaultValue', e.target.value || null)}
                        className="w-full max-w-xs bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm"
                        placeholder={selectedField.fieldType === 'boolean' ? 'No' : selectedField.fieldType === 'currency' ? '0.00' : ''}
                      />
                    </td>
                  </tr>
                )}

                {/* Calculated Expression */}
                {selectedField.fieldType === 'calculated' && (
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-purple-100 border-r border-gray-300 select-none">Expression</td>
                    <td className="px-2 py-0.5">
                      <input
                        value={calcExpr}
                        onChange={e => updateSelected('description', encodeCalculatedExpr(e.target.value))}
                        className="w-full max-w-lg bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm font-mono"
                        placeholder='=[FirstName] & " " & [LastName]'
                      />
                      <span className="ml-2 text-gray-400">Use =[FieldName] to reference other fields</span>
                    </td>
                  </tr>
                )}

                {/* Lookup config */}
                {selectedField.fieldType === 'lookup' && (
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-red-100 border-r border-gray-300 select-none">Lookup Source</td>
                    <td className="px-2 py-0.5 flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        {lookupConfig?.type === 'valuelist'
                          ? `Value list (${lookupConfig.values?.length ?? 0} items)`
                          : lookupConfig?.type === 'table'
                          ? `Table → ${tables.find(t => t.id === lookupConfig.tableId)?.name ?? lookupConfig.tableId}`
                          : 'Not configured'}
                      </span>
                      <button
                        onClick={() => selectedIndex !== null && openLookupWizard(selectedIndex)}
                        className="text-xs text-[#C42B1C] underline hover:no-underline"
                      >
                        Edit Lookup Wizard…
                      </button>
                    </td>
                  </tr>
                )}

                {/* Required */}
                <tr className="border-b border-gray-300 hover:bg-gray-100">
                  <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none">Required</td>
                  <td className="px-2 py-0.5">
                    <select
                      value={selectedField.isRequired ? 'Yes' : 'No'}
                      onChange={e => updateSelected('isRequired', e.target.value === 'Yes')}
                      disabled={selectedField.fieldType === 'autonumber' || selectedField.isPrimaryKey}
                      className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </td>
                </tr>

                {/* Validation Rule */}
                {!['autonumber', 'calculated', 'attachment', 'lookup'].includes(selectedField.fieldType) && (
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none">Validation Rule</td>
                    <td className="px-2 py-0.5">
                      <input
                        value={validation.rule}
                        onChange={e => updateValidation(e.target.value, validation.text)}
                        className="w-full max-w-lg bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm font-mono"
                        placeholder='e.g. >0 or "A" Or "B" Or "C"'
                      />
                    </td>
                  </tr>
                )}

                {/* Validation Text */}
                {!['autonumber', 'calculated', 'attachment', 'lookup'].includes(selectedField.fieldType) && (
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none">Validation Text</td>
                    <td className="px-2 py-0.5">
                      <input
                        value={validation.text}
                        onChange={e => updateValidation(validation.rule, e.target.value)}
                        className="w-full max-w-lg bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm"
                        placeholder="Message shown when validation fails"
                        disabled={!validation.rule}
                        title={!validation.rule ? 'Enter a Validation Rule first' : ''}
                      />
                    </td>
                  </tr>
                )}

                {/* Allow Zero Length */}
                {(selectedField.fieldType === 'text' || selectedField.fieldType === 'longtext') && (
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none">Allow Zero Length</td>
                    <td className="px-2 py-0.5">
                      <select className="bg-white border border-gray-300 px-2 py-0.5 outline-none text-xs rounded-sm">
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </td>
                  </tr>
                )}

                {/* Indexed */}
                <tr className="border-b border-gray-300 hover:bg-gray-100">
                  <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none">Indexed</td>
                  <td className="px-2 py-0.5">
                    <select disabled className="bg-white border border-gray-300 px-2 py-0.5 outline-none text-xs rounded-sm opacity-50 cursor-not-allowed">
                      <option>{selectedField.isPrimaryKey ? 'Yes (No Duplicates)' : 'No'}</option>
                    </select>
                  </td>
                </tr>

                {/* Unicode Compression (text types) */}
                {['text', 'longtext', 'hyperlink'].includes(selectedField.fieldType) && (
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none">Unicode Compression</td>
                    <td className="px-2 py-0.5">
                      <select disabled className="bg-white border border-gray-300 px-2 py-0.5 outline-none text-xs rounded-sm opacity-70">
                        <option>Yes</option>
                      </select>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
