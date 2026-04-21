import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
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

export interface LookupConfig {
  type: 'valuelist' | 'table';
  values?: string[];
  tableId?: number;
  valueField?: string;
  displayField?: string;
  selectedFields?: string[];
  sortFields?: { field: string; dir: 'asc' | 'desc' }[];
  label?: string;
  enableIntegrity?: boolean;
  cascadeDelete?: boolean;
  limitToList?: boolean;
  allowMultipleValues?: boolean;
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

interface FieldMeta {
  format?: string;
  inputMask?: string;
  numberFieldSize?: string;
  numberFormat?: string;
  decimalPlaces?: string;
  currencyFormat?: string;
  dateFormat?: string;
  yesNoFormat?: string;
  textFormat?: string;
  appendOnly?: boolean;
  newValues?: string;
  autoFieldSize?: string;
  allowZeroLength?: boolean;
  indexed?: string;
  unicodeCompression?: boolean;
}

export function parseFieldMeta(description: string | null | undefined): FieldMeta {
  if (!description) return {};
  if (description.startsWith('__meta__:')) {
    try { return JSON.parse(description.slice('__meta__:'.length)); } catch { return {}; }
  }
  if (description.startsWith('__validation__:')) {
    try { return (JSON.parse(description.slice('__validation__:'.length))._meta ?? {}); } catch { return {}; }
  }
  return {};
}
export function encodeFieldMeta(meta: FieldMeta, currentDescription: string | null | undefined): string | null {
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v !== undefined && v !== '' && v !== false) cleaned[k] = v;
  }
  if (currentDescription?.startsWith('__validation__:')) {
    try {
      const parsed = JSON.parse(currentDescription.slice('__validation__:'.length));
      if (Object.keys(cleaned).length === 0) delete parsed._meta;
      else parsed._meta = cleaned;
      return '__validation__:' + JSON.stringify(parsed);
    } catch { /* fall through */ }
  }
  if (Object.keys(cleaned).length === 0) return null;
  return '__meta__:' + JSON.stringify(cleaned);
}

interface DesignGridProps {
  fields: UpdateFieldRequest[];
  onChange: (fields: UpdateFieldRequest[]) => void;
  selectedIndex?: number | null;
  onSelectedIndexChange?: (i: number | null) => void;
  tables?: { id: number; name: string; fields?: { id?: number; name: string }[] }[];
  databaseId?: number;
  tableId?: number;
  onBeforeTypeChange?: (fieldIdx: number, oldType: string, newType: string) => Promise<boolean>;
  onBeforeRemoveField?: (field: UpdateFieldRequest) => Promise<boolean>;
  showPropertySheet?: boolean;
  onCreateRelationship?: (fromTableId: number, fromFieldName: string, toTableId: number, toFieldName: string, relType: string) => void;
}

export interface DesignGridHandle {
  openLookupWizard: (fieldIdx: number) => void;
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

export const DesignGrid = forwardRef<DesignGridHandle, DesignGridProps>(function DesignGrid({ fields, onChange, selectedIndex: controlledIdx, onSelectedIndexChange, tables = [], databaseId, tableId, onBeforeTypeChange, onBeforeRemoveField, showPropertySheet = true, onCreateRelationship }: DesignGridProps, ref) {
  const [localIdx, setLocalIdx] = useState<number | null>(null);
  const selectedIndex = controlledIdx !== undefined ? controlledIdx : localIdx;
  const setSelectedIndex = (i: number | null) => { setLocalIdx(i); onSelectedIndexChange?.(i); };
  const [ctxFieldIdx, setCtxFieldIdx] = useState<number | null>(null);
  const selectedField = selectedIndex !== null && selectedIndex !== undefined ? fields[selectedIndex] : null;

  // ── Column resize ──
  const [colWidths, setColWidths] = useState<Record<string, number>>({ name: 240, type: 180, desc: 9999 });
  const [propsPaneHeight, setPropsPaneHeight] = useState<number>(160);
  const propsResizeRef = useRef<{ startY: number; startH: number } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!propsResizeRef.current) return;
      const dy = propsResizeRef.current.startY - e.clientY;
      const next = Math.max(80, Math.min(800, propsResizeRef.current.startH + dy));
      setPropsPaneHeight(next);
    };
    const onUp = () => { propsResizeRef.current = null; document.body.style.cursor = ''; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);
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
  const [lwOriginalType, setLwOriginalType] = useState<string>('text');
  const [lwSourceType, setLwSourceType] = useState<'table' | 'valuelist'>('table');
  const [lwValues, setLwValues] = useState<string[][]>([['']]);
  const [lwNumCols, setLwNumCols] = useState(1);
  const [lwTableId, setLwTableId] = useState<number | null>(null);
  const [lwValueField, setLwValueField] = useState('');
  const [lwDisplayField, setLwDisplayField] = useState('');
  const [lwSelectedFields, setLwSelectedFields] = useState<string[]>([]);
  const [lwSortFields, setLwSortFields] = useState<{ field: string; dir: 'asc' | 'desc' }[]>([
    { field: '', dir: 'asc' }, { field: '', dir: 'asc' }, { field: '', dir: 'asc' }, { field: '', dir: 'asc' }
  ]);
  const [lwEnforceIntegrity, setLwEnforceIntegrity] = useState(false);
  const [lwCascadeDelete, setLwCascadeDelete] = useState(false);
  const [lwLabel, setLwLabel] = useState('');
  const [lwLimitToList, setLwLimitToList] = useState(false);
  const [lwAllowMultiple, setLwAllowMultiple] = useState(false);
  const [lwViewFilter, setLwViewFilter] = useState<'tables' | 'queries' | 'both'>('tables');
  // Fields fetched lazily for tables that don't include `fields` in the parent prop.
  const [lwFetchedFields, setLwFetchedFields] = useState<{ [tableId: number]: any[] }>({});

  useEffect(() => {
    if (!lookupWizardOpen || lwSourceType !== 'table' || lwTableId == null || databaseId == null) return;
    const existing = tables.find(t => t.id === lwTableId);
    if (existing && Array.isArray((existing as any).fields) && (existing as any).fields.length > 0) return;
    if (lwFetchedFields[lwTableId]) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/ds/databases/${databaseId}/tables/${lwTableId}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setLwFetchedFields(prev => ({ ...prev, [lwTableId]: data.fields ?? [] }));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [lookupWizardOpen, lwSourceType, lwTableId, databaseId, tables, lwFetchedFields]);

  const openLookupWizard = useCallback((fieldIdx: number) => {
    setLwFieldIdx(fieldIdx);
    const existing = parseLookupConfig(fields[fieldIdx]?.description);
    const fieldName = fields[fieldIdx]?.name || '';
    const currentType = (fields[fieldIdx]?.fieldType as string) || 'text';
    setLwOriginalType(currentType === 'lookup' ? 'text' : currentType);
    if (existing?.type === 'valuelist') {
      setLwSourceType('valuelist');
      const vals = existing.values && existing.values.length > 0 ? existing.values : [''];
      setLwValues(vals.map(v => [v]));
      setLwNumCols(1);
      setLwLabel(existing.label ?? fieldName);
      setLwLimitToList(existing.limitToList ?? false);
      setLwAllowMultiple(existing.allowMultipleValues ?? false);
    } else if (existing?.type === 'table') {
      setLwSourceType('table');
      setLwTableId(existing.tableId ?? null);
      setLwValueField(existing.valueField ?? '');
      setLwDisplayField(existing.displayField ?? '');
      setLwSelectedFields(existing.selectedFields ?? []);
      setLwSortFields(existing.sortFields && existing.sortFields.length > 0
        ? [...existing.sortFields, ...Array(4 - existing.sortFields.length).fill({ field: '', dir: 'asc' })].slice(0, 4)
        : [{ field: '', dir: 'asc' }, { field: '', dir: 'asc' }, { field: '', dir: 'asc' }, { field: '', dir: 'asc' }]
      );
      setLwEnforceIntegrity(existing.enableIntegrity ?? false);
      setLwCascadeDelete(existing.cascadeDelete ?? false);
      setLwLabel(existing.label ?? fieldName);
      setLwAllowMultiple(existing.allowMultipleValues ?? false);
    } else {
      setLwSourceType('table');
      setLwValues([['']]);
      setLwNumCols(1);
      setLwTableId(null);
      setLwValueField('');
      setLwDisplayField('');
      setLwSelectedFields([]);
      setLwSortFields([{ field: '', dir: 'asc' }, { field: '', dir: 'asc' }, { field: '', dir: 'asc' }, { field: '', dir: 'asc' }]);
      setLwEnforceIntegrity(false);
      setLwCascadeDelete(false);
      setLwLabel(fieldName);
      setLwLimitToList(false);
      setLwAllowMultiple(false);
    }
    setLwStep(1);
    setLwViewFilter('tables');
    setLookupWizardOpen(true);
  }, [fields]);

  useImperativeHandle(ref, () => ({ openLookupWizard }), [openLookupWizard]);

  const finishLookupWizard = () => {
    if (lwFieldIdx === null) return;
    let cfg: LookupConfig;
    if (lwSourceType === 'valuelist') {
      const flatValues = lwValues.map(row => row[0] || '').filter(v => v.trim() !== '');
      cfg = {
        type: 'valuelist',
        values: flatValues,
        label: lwLabel,
        limitToList: lwLimitToList,
        allowMultipleValues: lwAllowMultiple,
      };
    } else {
      const selFields = lwSelectedFields.length > 0 ? lwSelectedFields : (lwValueField ? [lwValueField] : []);
      const primaryField = selFields[0] || lwValueField;
      cfg = {
        type: 'table',
        tableId: lwTableId!,
        valueField: primaryField,
        displayField: selFields.length > 1 ? selFields[1] : primaryField,
        selectedFields: selFields,
        sortFields: lwSortFields.filter(s => s.field),
        label: lwLabel,
        enableIntegrity: lwEnforceIntegrity,
        cascadeDelete: lwCascadeDelete,
        allowMultipleValues: lwAllowMultiple,
      };
      if (lwEnforceIntegrity && lwTableId && primaryField && tableId && onCreateRelationship) {
        const currentFieldName = fields[lwFieldIdx]?.name || lwLabel;
        onCreateRelationship(lwTableId, primaryField, tableId, currentFieldName, 'one-to-many');
      }
    }
    const newFields = [...fields];
    const preservedType = (lwOriginalType && lwOriginalType !== 'lookup') ? lwOriginalType : 'text';
    newFields[lwFieldIdx] = { ...newFields[lwFieldIdx], fieldType: preservedType as any, description: encodeLookupConfig(cfg) };
    if (lwLabel && lwLabel !== newFields[lwFieldIdx].name) {
      newFields[lwFieldIdx] = { ...newFields[lwFieldIdx], caption: lwLabel };
    }
    onChange(newFields);
    setLookupWizardOpen(false);
  };

  const lwSelectedTable = tables.find(t => t.id === lwTableId);
  const lwTableFields: any[] = (lwSelectedTable?.fields && lwSelectedTable.fields.length > 0)
    ? lwSelectedTable.fields
    : (lwTableId != null ? (lwFetchedFields[lwTableId] ?? []) : []);
  const lwAvailableFields = lwTableFields.filter((f: any) => !lwSelectedFields.includes(f.name));

  const lwTotalStepsTable = 6;
  const lwTotalStepsValueList = 3;

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

  const nameInputsRef = useRef<Map<number, HTMLInputElement>>(new Map());
  const pendingFocusIdxRef = useRef<number | null>(null);

  const addField = () => {
    const newIdx = fields.length;
    onChange([...fields, {
      name: '', fieldType: 'text' as any, isRequired: false,
      isPrimaryKey: fields.length === 0, sortOrder: fields.length,
      caption: null, defaultValue: null, fieldSize: null, description: null,
    }]);
    setSelectedIndex(newIdx);
    pendingFocusIdxRef.current = newIdx;
  };

  useEffect(() => {
    const idx = pendingFocusIdxRef.current;
    if (idx === null) return;
    const el = nameInputsRef.current.get(idx);
    if (el) {
      el.focus();
      el.select();
      pendingFocusIdxRef.current = null;
    }
  }, [fields.length]);

  const removeField = async (index: number) => {
    const f = fields[index];
    if (!f || f.isPrimaryKey) return;
    if (onBeforeRemoveField) {
      const ok = await onBeforeRemoveField(f);
      if (!ok) return;
    }
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
  const fieldMeta = selectedField ? parseFieldMeta(selectedField.description) : {};

  const updateValidation = (rule: string, text: string) => {
    const encoded = encodeValidation(rule, text);
    if (encoded && Object.keys(fieldMeta).length > 0) {
      try {
        const parsed = JSON.parse(encoded.slice('__validation__:'.length));
        parsed._meta = fieldMeta;
        updateSelected('description', '__validation__:' + JSON.stringify(parsed));
        return;
      } catch { /* fall through */ }
    }
    updateSelected('description', encoded);
  };

  const updateMeta = (patch: Partial<typeof fieldMeta>) => {
    const next = { ...fieldMeta, ...patch };
    updateSelected('description', encodeFieldMeta(next, selectedField?.description));
  };

  return (
    <div className="w-full h-full flex flex-col bg-white select-none">
      {/* ── Lookup Wizard Modal ── */}
      {lookupWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-[#f0f0f0] border border-gray-500 shadow-2xl w-[520px] flex flex-col" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
            <div className="flex items-center justify-between bg-[#7b5b3a] text-white px-3 py-1.5 select-none">
              <span className="font-semibold text-sm">Lookup Wizard</span>
              <button onClick={() => setLookupWizardOpen(false)} className="hover:bg-white/20 rounded p-0.5"><X size={14} /></button>
            </div>

            <div className="flex">
              <div className="w-[110px] flex-none flex items-start justify-center pt-4 pb-4 bg-[#f0f0f0]">
                <svg width="90" height="110" viewBox="0 0 90 110">
                  <rect x="5" y="10" width="70" height="85" rx="3" fill="#f5d98e" stroke="#c9a84c" strokeWidth="1.5" />
                  <rect x="12" y="18" width="56" height="10" rx="1" fill="#edc64b" stroke="#c9a84c" strokeWidth="0.5" />
                  <rect x="12" y="32" width="56" height="10" rx="1" fill="#edc64b" stroke="#c9a84c" strokeWidth="0.5" />
                  <rect x="12" y="46" width="56" height="10" rx="1" fill="#edc64b" stroke="#c9a84c" strokeWidth="0.5" />
                  <rect x="12" y="60" width="56" height="10" rx="1" fill="#edc64b" stroke="#c9a84c" strokeWidth="0.5" />
                  <polygon points="60,72 72,82 60,92" fill="#c9a84c" />
                  {lwStep >= (lwSourceType === 'table' ? lwTotalStepsTable : lwTotalStepsValueList) && (
                    <>
                      <rect x="50" y="65" width="28" height="28" rx="3" fill="#f5d98e" stroke="#c9a84c" strokeWidth="1.5" />
                      <polyline points="56,79 63,86 76,71" fill="none" stroke="#7b5b3a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  )}
                </svg>
              </div>

              <div className="flex-1 p-4 min-h-[280px] bg-[#f0f0f0]">
                {/* Step 1: Source type */}
                {lwStep === 1 && (
                  <>
                    <p className="text-sm text-gray-800 mb-1 font-semibold leading-relaxed">
                      This wizard creates a lookup field, which displays a list of values you can choose from. How do you want your lookup field to get its values?
                    </p>
                    <div className="space-y-3 mt-4">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="radio" className="mt-0.5 accent-[#316AC5]" checked={lwSourceType === 'table'} onChange={() => setLwSourceType('table')} />
                        <span className="text-sm">I want the lookup field to get the values from another table or query.</span>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="radio" className="mt-0.5 accent-[#316AC5]" checked={lwSourceType === 'valuelist'} onChange={() => setLwSourceType('valuelist')} />
                        <span className="text-sm">I will type in the values that I want.</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Table path — Step 2: Choose table */}
                {lwStep === 2 && lwSourceType === 'table' && (
                  <>
                    <p className="text-sm text-gray-800 font-semibold mb-3">
                      Which table or query should provide the values for your lookup field?
                    </p>
                    <div className="border border-gray-400 bg-white h-[140px] overflow-y-auto mb-3">
                      {tables.map(t => (
                        <div
                          key={t.id}
                          onClick={() => { setLwTableId(t.id); setLwSelectedFields([]); setLwValueField(''); setLwDisplayField(''); }}
                          className={`px-2 py-1 text-sm cursor-pointer ${lwTableId === t.id ? 'bg-[#316AC5] text-white' : 'hover:bg-blue-50'}`}
                        >
                          Table: {t.name}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium text-gray-700">View</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" className="accent-[#316AC5]" checked={lwViewFilter === 'tables'} onChange={() => setLwViewFilter('tables')} />
                        <span>Tables</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" className="accent-[#316AC5]" checked={lwViewFilter === 'queries'} onChange={() => setLwViewFilter('queries')} />
                        <span>Queries</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" className="accent-[#316AC5]" checked={lwViewFilter === 'both'} onChange={() => setLwViewFilter('both')} />
                        <span>Both</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Table path — Step 3: Choose fields */}
                {lwStep === 3 && lwSourceType === 'table' && (
                  <>
                    <p className="text-sm text-gray-800 font-semibold mb-3">
                      Which fields of {lwSelectedTable?.name || 'the table'} contain the values you want included in your lookup field? The fields you select become columns in your lookup field.
                    </p>
                    <div className="flex gap-2 items-stretch">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-700 mb-1">Available Fields:</div>
                        <div className="border border-gray-400 bg-white h-[160px] overflow-y-auto">
                          {lwAvailableFields.map((f: any) => (
                            <div
                              key={f.name}
                              className="px-2 py-1 text-sm cursor-pointer hover:bg-blue-50"
                              onDoubleClick={() => setLwSelectedFields([...lwSelectedFields, f.name])}
                            >
                              {f.name}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col justify-center gap-1">
                        <button
                          onClick={() => {
                            const first = lwAvailableFields[0];
                            if (first) setLwSelectedFields([...lwSelectedFields, first.name]);
                          }}
                          disabled={lwAvailableFields.length === 0}
                          className="w-8 h-7 border border-gray-400 bg-white hover:bg-gray-100 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                        >&gt;</button>
                        <button
                          onClick={() => setLwSelectedFields(lwTableFields.map((f: any) => f.name))}
                          disabled={lwAvailableFields.length === 0}
                          className="w-8 h-7 border border-gray-400 bg-white hover:bg-gray-100 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                        >&gt;&gt;</button>
                        <button
                          onClick={() => setLwSelectedFields(lwSelectedFields.slice(0, -1))}
                          disabled={lwSelectedFields.length === 0}
                          className="w-8 h-7 border border-gray-400 bg-white hover:bg-gray-100 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                        >&lt;</button>
                        <button
                          onClick={() => setLwSelectedFields([])}
                          disabled={lwSelectedFields.length === 0}
                          className="w-8 h-7 border border-gray-400 bg-white hover:bg-gray-100 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                        >&lt;&lt;</button>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-700 mb-1">Selected Fields:</div>
                        <div className="border border-gray-400 bg-white h-[160px] overflow-y-auto">
                          {lwSelectedFields.map((fname, i) => (
                            <div key={i} className="px-2 py-1 text-sm cursor-pointer hover:bg-blue-50"
                              onDoubleClick={() => setLwSelectedFields(lwSelectedFields.filter((_, j) => j !== i))}
                            >
                              {fname}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Table path — Step 4: Sort order */}
                {lwStep === 4 && lwSourceType === 'table' && (
                  <>
                    <p className="text-sm text-gray-800 font-semibold mb-2">
                      What sort order do you want for the items in your list box?
                    </p>
                    <p className="text-xs text-gray-600 mb-3">
                      You can sort records by up to four fields, in either ascending or descending order.
                    </p>
                    <div className="space-y-2">
                      {lwSortFields.map((sf, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-4 text-sm font-medium text-gray-600">{i + 1}</span>
                          <select
                            value={sf.field}
                            onChange={e => {
                              const next = [...lwSortFields];
                              next[i] = { ...next[i], field: e.target.value };
                              setLwSortFields(next);
                            }}
                            className="flex-1 border border-gray-400 bg-white px-2 py-1 text-sm outline-none"
                          >
                            <option value=""></option>
                            {(lwSelectedFields.length > 0 ? lwSelectedFields : lwTableFields.map((f: any) => f.name)).map(fname => (
                              <option key={fname} value={fname}>{fname}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const next = [...lwSortFields];
                              next[i] = { ...next[i], dir: next[i].dir === 'asc' ? 'desc' : 'asc' };
                              setLwSortFields(next);
                            }}
                            disabled={!sf.field}
                            className="border border-gray-400 bg-white px-3 py-1 text-sm disabled:opacity-40 hover:bg-gray-100 min-w-[90px]"
                          >
                            {sf.dir === 'asc' ? 'Ascending' : 'Descending'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Table path — Step 5: Column width preview */}
                {lwStep === 5 && lwSourceType === 'table' && (
                  <>
                    <p className="text-sm text-gray-800 font-semibold mb-2">
                      How wide would you like the columns in your lookup field?
                    </p>
                    <p className="text-xs text-gray-600 mb-3">
                      To adjust the width of a column, drag its right edge to the width you want, or double-click the right edge of the column heading to get the best fit.
                    </p>
                    <div className="border border-gray-400 bg-white h-[160px] overflow-auto">
                      <table className="text-sm border-collapse w-full">
                        <thead>
                          <tr>
                            {(lwSelectedFields.length > 0 ? lwSelectedFields : ['(field)']).map((fname, i) => (
                              <th key={i} className="border-b border-r border-gray-300 bg-[#f3f2f1] px-2 py-1 text-left text-xs font-medium text-gray-700">{fname}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[0,1,2,3,4,5].map(r => (
                            <tr key={r}>
                              {(lwSelectedFields.length > 0 ? lwSelectedFields : ['(field)']).map((_, ci) => (
                                <td key={ci} className="border-b border-r border-gray-200 px-2 py-1 text-gray-300 text-xs">&nbsp;</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Table path — Step 6: Label + integrity */}
                {lwStep === 6 && lwSourceType === 'table' && (
                  <>
                    <p className="text-sm text-gray-800 font-semibold mb-2">
                      What label would you like for your lookup field?
                    </p>
                    <input
                      value={lwLabel}
                      onChange={e => setLwLabel(e.target.value)}
                      className="w-full border border-gray-400 bg-white px-2 py-1 text-sm outline-none mb-3"
                    />
                    <p className="text-sm text-gray-700 mb-2">Do you want to enable data integrity between these tables?</p>
                    <label className="flex items-center gap-2 cursor-pointer mb-1">
                      <input type="checkbox" className="accent-[#316AC5]" checked={lwEnforceIntegrity} onChange={e => { setLwEnforceIntegrity(e.target.checked); if (!e.target.checked) setLwCascadeDelete(false); }} />
                      <span className="text-sm font-medium">Enable Data Integrity</span>
                    </label>
                    {lwEnforceIntegrity && (
                      <div className="ml-6 space-y-1 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" className="accent-[#316AC5]" checked={lwCascadeDelete} onChange={() => setLwCascadeDelete(true)} />
                          <span className="text-sm">Cascade Delete</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" className="accent-[#316AC5]" checked={!lwCascadeDelete} onChange={() => setLwCascadeDelete(false)} />
                          <span className="text-sm">Restrict Delete</span>
                        </label>
                      </div>
                    )}
                    <p className="text-sm text-gray-700 mb-2">Do you want to store multiple values for this lookup?</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="accent-[#316AC5]" checked={lwAllowMultiple} onChange={e => setLwAllowMultiple(e.target.checked)} />
                      <span className="text-sm">Allow Multiple Values</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-4">Those are all the answers the wizard needs to create your lookup field.</p>
                  </>
                )}

                {/* Value list — Step 2: Enter values in grid */}
                {lwStep === 2 && lwSourceType === 'valuelist' && (
                  <>
                    <p className="text-sm text-gray-800 font-semibold mb-1">
                      What values do you want to see in your lookup field? Enter the number of columns you want in the list, and then type the values you want in each cell.
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      To adjust the width of a column, drag its right edge to the width you want, or double-click the right edge of the column heading to get the best fit.
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-700">Number of columns:</span>
                      <input
                        type="number" min={1} max={10} value={lwNumCols}
                        onChange={e => {
                          const n = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                          setLwNumCols(n);
                          setLwValues(prev => prev.map(row => {
                            const newRow = [...row];
                            while (newRow.length < n) newRow.push('');
                            return newRow.slice(0, n);
                          }));
                        }}
                        className="w-12 border border-gray-400 bg-white px-1 py-0.5 text-sm text-center outline-none"
                      />
                    </div>
                    <div className="border border-gray-400 bg-white max-h-[150px] overflow-auto">
                      <table className="text-sm border-collapse w-full">
                        <thead>
                          <tr>
                            <th className="w-6 border-b border-r border-gray-300 bg-[#f3f2f1]"></th>
                            {Array.from({ length: lwNumCols }, (_, ci) => (
                              <th key={ci} className="border-b border-r border-gray-300 bg-[#f3f2f1] px-2 py-1 text-left text-xs font-medium text-gray-700">Col{ci + 1}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {lwValues.map((row, ri) => (
                            <tr key={ri}>
                              <td className="border-b border-r border-gray-200 bg-[#f3f2f1] text-center text-xs text-gray-400 w-6">
                                {ri < lwValues.length - 1 || row.some(v => v) ? '✎' : '✱'}
                              </td>
                              {row.map((cell, ci) => (
                                <td key={ci} className="border-b border-r border-gray-200 p-0">
                                  <input
                                    value={cell}
                                    onChange={e => {
                                      const next = lwValues.map(r => [...r]);
                                      next[ri][ci] = e.target.value;
                                      if (ri === lwValues.length - 1 && e.target.value) {
                                        next.push(Array(lwNumCols).fill(''));
                                      }
                                      setLwValues(next);
                                    }}
                                    className="w-full px-1 py-0.5 text-sm outline-none bg-transparent"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Value list — Step 3: Label + options */}
                {lwStep === 3 && lwSourceType === 'valuelist' && (
                  <>
                    <p className="text-sm text-gray-800 font-semibold mb-2">
                      What label would you like for your lookup field?
                    </p>
                    <input
                      value={lwLabel}
                      onChange={e => setLwLabel(e.target.value)}
                      className="w-full border border-gray-400 bg-white px-2 py-1 text-sm outline-none mb-3"
                    />
                    <p className="text-sm text-gray-700 mb-2">Do you want to limit entries to the choices?</p>
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input type="checkbox" className="accent-[#316AC5]" checked={lwLimitToList} onChange={e => setLwLimitToList(e.target.checked)} />
                      <span className="text-sm">Limit To List</span>
                    </label>
                    <p className="text-sm text-gray-700 mb-2">Do you want to store multiple values for this lookup?</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="accent-[#316AC5]" checked={lwAllowMultiple} onChange={e => setLwAllowMultiple(e.target.checked)} />
                      <span className="text-sm">Allow Multiple Values</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-4">Those are all the answers the wizard needs to create your lookup field.</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-400 bg-[#f0f0f0]">
              <button onClick={() => setLookupWizardOpen(false)} className="px-4 py-1 border border-gray-400 bg-white hover:bg-gray-100 text-sm">Cancel</button>
              <div className="flex gap-2">
                {lwStep > 1 && (
                  <button onClick={() => setLwStep(s => s - 1)} className="px-4 py-1 border border-gray-400 bg-white hover:bg-gray-100 text-sm">
                    &lt; Back
                  </button>
                )}
                {(() => {
                  const isLastStep = lwSourceType === 'table'
                    ? lwStep === lwTotalStepsTable
                    : lwStep === lwTotalStepsValueList;
                  const canNext = lwStep === 1 ? true
                    : lwStep === 2 && lwSourceType === 'table' ? !!lwTableId
                    : lwStep === 3 && lwSourceType === 'table' ? lwSelectedFields.length > 0
                    : lwStep === 2 && lwSourceType === 'valuelist' ? lwValues.some(r => r.some(v => v.trim()))
                    : true;
                  return isLastStep ? (
                    <button
                      onClick={finishLookupWizard}
                      className="px-4 py-1 border border-gray-400 bg-white hover:bg-gray-100 text-sm font-medium"
                    >
                      Finish
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setLwStep(s => s + 1)}
                        disabled={!canNext}
                        className="px-4 py-1 border border-gray-400 bg-white hover:bg-gray-100 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next &gt;
                      </button>
                      <button disabled className="px-4 py-1 border border-gray-400 bg-white text-sm opacity-40 cursor-not-allowed">Finish</button>
                    </>
                  );
                })()}
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
                      ref={el => {
                        if (el) nameInputsRef.current.set(i, el);
                        else nameInputsRef.current.delete(i);
                      }}
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
                      <optgroup label="Text">
                        <option value="text">Short Text</option>
                        <option value="longtext">Long Text</option>
                      </optgroup>
                      <optgroup label="Numeric">
                        <option value="number">Number</option>
                        <option value="currency">Currency</option>
                      </optgroup>
                      <optgroup label="Date / Boolean">
                        <option value="date">Date/Time</option>
                        <option value="boolean">Yes/No</option>
                      </optgroup>
                      <optgroup label="Special">
                        <option value="autonumber">AutoNumber</option>
                        <option value="hyperlink">Hyperlink</option>
                        <option value="attachment">Attachment</option>
                        <option value="calculated">Calculated</option>
                        <option value="lookup">Lookup Wizard…</option>
                      </optgroup>
                    </select>
                  </td>
                  <td className="border-r border-gray-300 p-0 overflow-hidden">
                    {f.fieldType === 'calculated' ? (
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
                  readOnly
                  placeholder="Click to add new field..."
                  onMouseDown={e => { e.preventDefault(); addField(); }}
                  className="w-full px-3 py-1.5 outline-none bg-transparent italic text-gray-500 cursor-pointer"
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

      {/* ── Field Properties pane (height is user-resizable) ── */}
      {showPropertySheet && <>
        <div
          role="separator"
          aria-orientation="horizontal"
          title="Drag to resize"
          onMouseDown={e => {
            propsResizeRef.current = { startY: e.clientY, startH: propsPaneHeight };
            document.body.style.cursor = 'row-resize';
            e.preventDefault();
          }}
          className="h-1.5 bg-gray-300 hover:bg-[#C42B1C]/60 cursor-row-resize flex-none border-t border-gray-400 z-10"
        />
      </>}
      {showPropertySheet && <div style={{ height: propsPaneHeight }} className="border-t border-gray-400 bg-[#f3f2f1] flex flex-col flex-none">
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
                {/* ── Primary Key (all types) ── */}
                <tr className="border-b border-gray-300 hover:bg-gray-100 bg-yellow-50">
                  <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-yellow-100 border-r border-gray-300 select-none whitespace-nowrap">
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

                {/* ── SHORT TEXT ── */}
                {selectedField.fieldType === 'text' && (<>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Field Size</td>
                    <td className="px-2 py-0.5 flex items-center gap-2">
                      <input type="number" min={1} max={255}
                        value={selectedField.fieldSize ?? ''}
                        onChange={e => updateSelected('fieldSize', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-20 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm"
                        placeholder="255" />
                      <span className="text-gray-400">max characters (1–255)</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Format</td>
                    <td className="px-2 py-0.5">
                      <input value={fieldMeta.format ?? ''} onChange={e => updateMeta({ format: e.target.value })}
                        className="w-40 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm font-mono"
                        placeholder='e.g. > for uppercase' />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Input Mask</td>
                    <td className="px-2 py-0.5">
                      <input value={fieldMeta.inputMask ?? ''} onChange={e => updateMeta({ inputMask: e.target.value })}
                        className="w-48 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm font-mono"
                        placeholder='e.g. 00/00/0000 or (999) 000-0000' />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Caption</td>
                    <td className="px-2 py-0.5">
                      <input value={selectedField.caption ?? ''} onChange={e => updateSelected('caption', e.target.value || null)}
                        className="w-48 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm"
                        placeholder={selectedField.name} />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Default Value</td>
                    <td className="px-2 py-0.5">
                      <input value={selectedField.defaultValue ?? ''} onChange={e => updateSelected('defaultValue', e.target.value || null)}
                        className="w-48 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Validation Rule</td>
                    <td className="px-2 py-0.5">
                      <input value={validation.rule} onChange={e => updateValidation(e.target.value, validation.text)}
                        className="w-full max-w-sm bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm font-mono"
                        placeholder='e.g. "A" Or "B" Or "C"' />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Validation Text</td>
                    <td className="px-2 py-0.5">
                      <input value={validation.text} onChange={e => updateValidation(validation.rule, e.target.value)}
                        disabled={!validation.rule}
                        className="w-full max-w-sm bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm disabled:opacity-50"
                        placeholder="Message shown when validation fails" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Required</td>
                    <td className="px-2 py-0.5">
                      <select value={selectedField.isRequired ? 'Yes' : 'No'} onChange={e => updateSelected('isRequired', e.target.value === 'Yes')}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option value="No">No</option><option value="Yes">Yes</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Allow Zero Length</td>
                    <td className="px-2 py-0.5">
                      <select value={fieldMeta.allowZeroLength ? 'Yes' : 'No'} onChange={e => updateMeta({ allowZeroLength: e.target.value === 'Yes' })}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option value="Yes">Yes</option><option value="No">No</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Indexed</td>
                    <td className="px-2 py-0.5">
                      <select value={selectedField.isPrimaryKey ? 'Yes (No Duplicates)' : (fieldMeta.indexed ?? 'No')}
                        onChange={e => updateMeta({ indexed: e.target.value })}
                        disabled={selectedField.isPrimaryKey}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm disabled:opacity-50">
                        <option>No</option>
                        <option>Yes (Duplicates OK)</option>
                        <option>Yes (No Duplicates)</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Unicode Compression</td>
                    <td className="px-2 py-0.5">
                      <select disabled className="bg-white border border-gray-300 px-2 py-0.5 outline-none text-xs rounded-sm opacity-70"><option>Yes</option></select>
                    </td>
                  </tr>
                </>)}

                {/* ── LONG TEXT ── */}
                {selectedField.fieldType === 'longtext' && (<>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Append Only</td>
                    <td className="px-2 py-0.5">
                      <select value={fieldMeta.appendOnly ? 'Yes' : 'No'} onChange={e => updateMeta({ appendOnly: e.target.value === 'Yes' })}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option value="No">No</option><option value="Yes">Yes</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Text Format</td>
                    <td className="px-2 py-0.5">
                      <select value={fieldMeta.textFormat ?? 'Plain Text'} onChange={e => updateMeta({ textFormat: e.target.value })}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option>Plain Text</option><option>Rich Text</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Allow Zero Length</td>
                    <td className="px-2 py-0.5">
                      <select value={fieldMeta.allowZeroLength ? 'Yes' : 'No'} onChange={e => updateMeta({ allowZeroLength: e.target.value === 'Yes' })}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option value="Yes">Yes</option><option value="No">No</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Format</td>
                    <td className="px-2 py-0.5">
                      <input value={fieldMeta.format ?? ''} onChange={e => updateMeta({ format: e.target.value })}
                        className="w-48 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm font-mono" placeholder='e.g. > for uppercase' />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Caption</td>
                    <td className="px-2 py-0.5">
                      <input value={selectedField.caption ?? ''} onChange={e => updateSelected('caption', e.target.value || null)}
                        className="w-48 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm" placeholder={selectedField.name} />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Default Value</td>
                    <td className="px-2 py-0.5">
                      <input value={selectedField.defaultValue ?? ''} onChange={e => updateSelected('defaultValue', e.target.value || null)}
                        className="w-48 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Validation Rule</td>
                    <td className="px-2 py-0.5">
                      <input value={validation.rule} onChange={e => updateValidation(e.target.value, validation.text)}
                        className="w-full max-w-sm bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm font-mono" placeholder='e.g. Is Not Null' />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Validation Text</td>
                    <td className="px-2 py-0.5">
                      <input value={validation.text} onChange={e => updateValidation(validation.rule, e.target.value)}
                        disabled={!validation.rule}
                        className="w-full max-w-sm bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm disabled:opacity-50"
                        placeholder="Message shown when validation fails" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Required</td>
                    <td className="px-2 py-0.5">
                      <select value={selectedField.isRequired ? 'Yes' : 'No'} onChange={e => updateSelected('isRequired', e.target.value === 'Yes')}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option value="No">No</option><option value="Yes">Yes</option>
                      </select>
                    </td>
                  </tr>
                </>)}

                {/* ── NUMBER ── */}
                {selectedField.fieldType === 'number' && (<>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Field Size</td>
                    <td className="px-2 py-0.5">
                      <select value={fieldMeta.numberFieldSize ?? 'Long Integer'} onChange={e => updateMeta({ numberFieldSize: e.target.value })}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option>Byte</option>
                        <option>Integer</option>
                        <option>Long Integer</option>
                        <option>Single</option>
                        <option>Double</option>
                        <option>Replication ID</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Format</td>
                    <td className="px-2 py-0.5">
                      <select value={fieldMeta.numberFormat ?? 'General Number'} onChange={e => updateMeta({ numberFormat: e.target.value })}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option>General Number</option>
                        <option>Fixed</option>
                        <option>Standard</option>
                        <option>Scientific</option>
                        <option>Percent</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Decimal Places</td>
                    <td className="px-2 py-0.5">
                      <select value={fieldMeta.decimalPlaces ?? 'Auto'} onChange={e => updateMeta({ decimalPlaces: e.target.value })}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option>Auto</option>
                        {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => <option key={n}>{n}</option>)}
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Default Value</td>
                    <td className="px-2 py-0.5">
                      <input value={selectedField.defaultValue ?? ''} onChange={e => updateSelected('defaultValue', e.target.value || null)}
                        className="w-40 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm" placeholder="0" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Validation Rule</td>
                    <td className="px-2 py-0.5">
                      <input value={validation.rule} onChange={e => updateValidation(e.target.value, validation.text)}
                        className="w-full max-w-sm bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm font-mono" placeholder='e.g. >0' />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Validation Text</td>
                    <td className="px-2 py-0.5">
                      <input value={validation.text} onChange={e => updateValidation(validation.rule, e.target.value)}
                        disabled={!validation.rule}
                        className="w-full max-w-sm bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm disabled:opacity-50"
                        placeholder="Message shown when validation fails" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Required</td>
                    <td className="px-2 py-0.5">
                      <select value={selectedField.isRequired ? 'Yes' : 'No'} onChange={e => updateSelected('isRequired', e.target.value === 'Yes')}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option value="No">No</option><option value="Yes">Yes</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Indexed</td>
                    <td className="px-2 py-0.5">
                      <select value={selectedField.isPrimaryKey ? 'Yes (No Duplicates)' : (fieldMeta.indexed ?? 'No')}
                        onChange={e => updateMeta({ indexed: e.target.value })}
                        disabled={selectedField.isPrimaryKey}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm disabled:opacity-50">
                        <option>No</option>
                        <option>Yes (Duplicates OK)</option>
                        <option>Yes (No Duplicates)</option>
                      </select>
                    </td>
                  </tr>
                </>)}

                {/* ── DATE/TIME ── */}
                {selectedField.fieldType === 'date' && (<>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Format</td>
                    <td className="px-2 py-0.5">
                      <select value={fieldMeta.dateFormat ?? ''} onChange={e => updateMeta({ dateFormat: e.target.value })}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
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
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Input Mask</td>
                    <td className="px-2 py-0.5">
                      <input value={fieldMeta.inputMask ?? ''} onChange={e => updateMeta({ inputMask: e.target.value })}
                        className="w-48 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm font-mono"
                        placeholder='e.g. 00/00/0000' />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Default Value</td>
                    <td className="px-2 py-0.5">
                      <input value={selectedField.defaultValue ?? ''} onChange={e => updateSelected('defaultValue', e.target.value || null)}
                        className="w-48 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm font-mono"
                        placeholder='e.g. Date()' />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Required</td>
                    <td className="px-2 py-0.5">
                      <select value={selectedField.isRequired ? 'Yes' : 'No'} onChange={e => updateSelected('isRequired', e.target.value === 'Yes')}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option value="No">No</option><option value="Yes">Yes</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Indexed</td>
                    <td className="px-2 py-0.5">
                      <select value={selectedField.isPrimaryKey ? 'Yes (No Duplicates)' : (fieldMeta.indexed ?? 'No')}
                        onChange={e => updateMeta({ indexed: e.target.value })}
                        disabled={selectedField.isPrimaryKey}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm disabled:opacity-50">
                        <option>No</option>
                        <option>Yes (Duplicates OK)</option>
                        <option>Yes (No Duplicates)</option>
                      </select>
                    </td>
                  </tr>
                </>)}

                {/* ── CURRENCY ── */}
                {selectedField.fieldType === 'currency' && (<>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Format</td>
                    <td className="px-2 py-0.5">
                      <select value={fieldMeta.currencyFormat ?? 'Currency'} onChange={e => updateMeta({ currencyFormat: e.target.value })}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option>Currency</option>
                        <option>Euro</option>
                        <option>Fixed</option>
                        <option>Standard</option>
                        <option>Percent</option>
                        <option>Scientific</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Decimal Places</td>
                    <td className="px-2 py-0.5">
                      <select value={fieldMeta.decimalPlaces ?? 'Auto'} onChange={e => updateMeta({ decimalPlaces: e.target.value })}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option>Auto</option>
                        {[0,1,2,3,4].map(n => <option key={n}>{n}</option>)}
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Default Value</td>
                    <td className="px-2 py-0.5">
                      <input value={selectedField.defaultValue ?? ''} onChange={e => updateSelected('defaultValue', e.target.value || null)}
                        className="w-40 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm" placeholder="0.00" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Validation Rule</td>
                    <td className="px-2 py-0.5">
                      <input value={validation.rule} onChange={e => updateValidation(e.target.value, validation.text)}
                        className="w-full max-w-sm bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm font-mono" placeholder='e.g. >=0' />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Validation Text</td>
                    <td className="px-2 py-0.5">
                      <input value={validation.text} onChange={e => updateValidation(validation.rule, e.target.value)}
                        disabled={!validation.rule}
                        className="w-full max-w-sm bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm disabled:opacity-50"
                        placeholder="Message shown when validation fails" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Indexed</td>
                    <td className="px-2 py-0.5">
                      <select value={selectedField.isPrimaryKey ? 'Yes (No Duplicates)' : (fieldMeta.indexed ?? 'No')}
                        onChange={e => updateMeta({ indexed: e.target.value })}
                        disabled={selectedField.isPrimaryKey}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm disabled:opacity-50">
                        <option>No</option>
                        <option>Yes (Duplicates OK)</option>
                        <option>Yes (No Duplicates)</option>
                      </select>
                    </td>
                  </tr>
                </>)}

                {/* ── AUTONUMBER ── */}
                {selectedField.fieldType === 'autonumber' && (<>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">New Values</td>
                    <td className="px-2 py-0.5">
                      <select value={fieldMeta.newValues ?? 'Increment'} onChange={e => updateMeta({ newValues: e.target.value })}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option>Increment</option>
                        <option>Random</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Field Size</td>
                    <td className="px-2 py-0.5">
                      <select value={fieldMeta.autoFieldSize ?? 'Long Integer'} onChange={e => updateMeta({ autoFieldSize: e.target.value })}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option>Long Integer</option>
                        <option>Replication ID</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Caption</td>
                    <td className="px-2 py-0.5">
                      <input value={selectedField.caption ?? ''} onChange={e => updateSelected('caption', e.target.value || null)}
                        className="w-48 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm" placeholder={selectedField.name} />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Indexed</td>
                    <td className="px-2 py-0.5">
                      <select disabled className="bg-white border border-gray-300 px-2 py-0.5 outline-none text-xs rounded-sm opacity-50 cursor-not-allowed">
                        <option>Yes (No Duplicates)</option>
                      </select>
                      <span className="ml-2 text-gray-400 italic">Always indexed, no duplicates</span>
                    </td>
                  </tr>
                </>)}

                {/* ── YES/NO ── */}
                {selectedField.fieldType === 'boolean' && (<>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Format</td>
                    <td className="px-2 py-0.5">
                      <select value={fieldMeta.yesNoFormat ?? 'Yes/No'} onChange={e => updateMeta({ yesNoFormat: e.target.value })}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option>Yes/No</option>
                        <option>True/False</option>
                        <option>On/Off</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Default Value</td>
                    <td className="px-2 py-0.5">
                      <select value={selectedField.defaultValue ?? 'No'} onChange={e => updateSelected('defaultValue', e.target.value)}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Required</td>
                    <td className="px-2 py-0.5">
                      <select value={selectedField.isRequired ? 'Yes' : 'No'} onChange={e => updateSelected('isRequired', e.target.value === 'Yes')}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option value="No">No</option><option value="Yes">Yes</option>
                      </select>
                    </td>
                  </tr>
                </>)}

                {/* ── HYPERLINK ── */}
                {selectedField.fieldType === 'hyperlink' && (<>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Caption</td>
                    <td className="px-2 py-0.5">
                      <input value={selectedField.caption ?? ''} onChange={e => updateSelected('caption', e.target.value || null)}
                        className="w-48 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm" placeholder={selectedField.name} />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Required</td>
                    <td className="px-2 py-0.5">
                      <select value={selectedField.isRequired ? 'Yes' : 'No'} onChange={e => updateSelected('isRequired', e.target.value === 'Yes')}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option value="No">No</option><option value="Yes">Yes</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Allow Zero Length</td>
                    <td className="px-2 py-0.5">
                      <select value={fieldMeta.allowZeroLength ? 'Yes' : 'No'} onChange={e => updateMeta({ allowZeroLength: e.target.value === 'Yes' })}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option value="Yes">Yes</option><option value="No">No</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Unicode Compression</td>
                    <td className="px-2 py-0.5">
                      <select disabled className="bg-white border border-gray-300 px-2 py-0.5 outline-none text-xs rounded-sm opacity-70"><option>Yes</option></select>
                    </td>
                  </tr>
                </>)}

                {/* ── ATTACHMENT ── */}
                {selectedField.fieldType === 'attachment' && (<>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Display Control</td>
                    <td className="px-2 py-0.5">
                      <select disabled className="bg-white border border-gray-300 px-2 py-0.5 outline-none text-xs rounded-sm opacity-70"><option>Attachment</option></select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Caption</td>
                    <td className="px-2 py-0.5">
                      <input value={selectedField.caption ?? ''} onChange={e => updateSelected('caption', e.target.value || null)}
                        className="w-48 bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm" placeholder={selectedField.name} />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Required</td>
                    <td className="px-2 py-0.5">
                      <select value={selectedField.isRequired ? 'Yes' : 'No'} onChange={e => updateSelected('isRequired', e.target.value === 'Yes')}
                        className="bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm">
                        <option value="No">No</option><option value="Yes">Yes</option>
                      </select>
                    </td>
                  </tr>
                </>)}

                {/* ── LOOKUP WIZARD ── */}
                {selectedField.fieldType === 'lookup' && (<>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Row Source Type</td>
                    <td className="px-2 py-0.5 text-gray-600">
                      {lookupConfig?.type === 'valuelist' ? 'Value List' : lookupConfig?.type === 'table' ? 'Table/Query' : '—'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Row Source</td>
                    <td className="px-2 py-0.5 text-gray-600 truncate max-w-xs">
                      {lookupConfig?.type === 'valuelist'
                        ? (lookupConfig.values?.join('; ') || '—')
                        : lookupConfig?.type === 'table'
                        ? (tables.find(t => t.id === lookupConfig.tableId)?.name ?? lookupConfig.tableId ?? '—')
                        : '—'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Bound Column</td>
                    <td className="px-2 py-0.5 text-gray-600">
                      {lookupConfig?.type === 'table' ? (lookupConfig.valueField || '—') : '1'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Column Count</td>
                    <td className="px-2 py-0.5 text-gray-600">
                      {lookupConfig?.type === 'table'
                        ? (lookupConfig.selectedFields?.length ?? 1)
                        : lookupConfig?.type === 'valuelist'
                        ? (lookupConfig.values && lookupConfig.values.length > 0 ? 1 : '—')
                        : '—'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-gray-200 border-r border-gray-300 select-none whitespace-nowrap">Allow Multiple Values</td>
                    <td className="px-2 py-0.5 text-gray-600">
                      {lookupConfig?.allowMultipleValues ? 'Yes' : 'No'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-red-100 border-r border-gray-300 select-none whitespace-nowrap">Edit Wizard</td>
                    <td className="px-2 py-0.5">
                      <button onClick={() => selectedIndex !== null && openLookupWizard(selectedIndex)}
                        className="text-xs text-[#C42B1C] underline hover:no-underline">
                        Open Lookup Wizard…
                      </button>
                    </td>
                  </tr>
                </>)}

                {/* ── CALCULATED ── */}
                {selectedField.fieldType === 'calculated' && (<>
                  <tr className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="w-48 px-4 py-1.5 font-medium text-gray-700 bg-purple-100 border-r border-gray-300 select-none whitespace-nowrap">Expression</td>
                    <td className="px-2 py-0.5">
                      <input value={calcExpr} onChange={e => updateSelected('description', encodeCalculatedExpr(e.target.value))}
                        className="w-full max-w-lg bg-white border border-gray-300 px-2 py-0.5 outline-none focus:border-[#C42B1C] text-xs rounded-sm font-mono"
                        placeholder='=[FirstName] & " " & [LastName]' />
                      <span className="ml-2 text-gray-400">Use =[FieldName] to reference other fields</span>
                    </td>
                  </tr>
                </>)}

              </tbody>
            </table>
          </div>
        )}
      </div>}
    </div>
  );
});
