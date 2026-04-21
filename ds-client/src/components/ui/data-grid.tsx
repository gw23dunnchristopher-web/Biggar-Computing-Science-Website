import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TableWithFields, Record as DbRecord, useCreateRecord, useUpdateRecord, getListRecordsQueryKey } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUp, ArrowDown, Pencil, ChevronDown, Paperclip, ExternalLink, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseLookupConfig, parseCalculatedExpr, parseValidation, type LookupConfig } from '@/components/ui/design-grid';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from '@/components/ui/context-menu';

type CtxTarget =
  | { type: 'header'; fieldName: string }
  | { type: 'cell'; recordId: number; fieldName: string; value: any; isPrimaryKey: boolean; record: DbRecord }
  | { type: 'row-selector'; recordId: number; record: DbRecord }
  | { type: 'new-row' }
  | { type: 'totals'; fieldName: string }
  | null;

type FilterDlg = {
  op: string;
  label: string;
  field: string;
  fieldType: string;
  val: string;
  val2: string;
} | null;

type EditingCell = {
  recordId: number;
  fieldName: string;
  rowIdx: number;
  colIdx: number;
} | null;

type FocusedCell = { rowIdx: number; colIdx: number } | null;

const TOTAL_FN_OPTIONS = ['None', 'Count', 'Sum', 'Average', 'Minimum', 'Maximum'] as const;
type TotalFn = typeof TOTAL_FN_OPTIONS[number];

export function evaluateValidationRule(rule: string, value: any, fieldName: string, recordData: Record<string, any>): boolean {
  if (!rule) return true;
  const trimmed = rule.trim();
  if (!trimmed) return true;

  const lenMatch = trimmed.match(/^Len\(\[([^\]]+)\]\)\s*(=|>=|<=|>|<)\s*(\d+)$/i);
  if (lenMatch) {
    const refField = lenMatch[1];
    const op = lenMatch[2];
    const target = parseInt(lenMatch[3], 10);
    const refVal = refField === fieldName ? value : recordData[refField];
    const len = String(refVal ?? '').length;
    if (op === '=') return len === target;
    if (op === '>=') return len >= target;
    if (op === '<=') return len <= target;
    if (op === '>') return len > target;
    if (op === '<') return len < target;
    return true;
  }

  const betweenMatch = trimmed.match(/^Between\s+(-?\d+(?:\.\d+)?)\s+And\s+(-?\d+(?:\.\d+)?)$/i);
  if (betweenMatch) {
    const low = parseFloat(betweenMatch[1]);
    const high = parseFloat(betweenMatch[2]);
    const num = Number(value);
    if (isNaN(num)) return false;
    return num >= low && num <= high;
  }

  const rangeMatch = trimmed.match(/^(>=|<=|>|<|=)\s*(-?\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    const op = rangeMatch[1];
    const target = parseFloat(rangeMatch[2]);
    const num = Number(value);
    if (isNaN(num)) return false;
    if (op === '>=') return num >= target;
    if (op === '<=') return num <= target;
    if (op === '>') return num > target;
    if (op === '<') return num < target;
    if (op === '=') return num === target;
  }

  return true;
}

function validateField(
  field: { name: string; fieldType: string; isRequired: boolean; description: string | null; fieldSize?: number | null },
  value: any,
  recordData: Record<string, any>
): string | null {
  if (field.isRequired && (value === null || value === undefined || value === '')) {
    return `${field.name} is required.`;
  }

  // Field size limit (Short Text only — Access caps Short Text at 255)
  if (field.fieldType === 'text' && field.fieldSize && value != null && value !== '') {
    const max = Number(field.fieldSize);
    if (Number.isFinite(max) && max > 0 && String(value).length > max) {
      return `${field.name} must be ${max} character${max === 1 ? '' : 's'} or fewer.`;
    }
  }

  const { rule, text } = parseValidation(field.description);
  if (rule && value !== null && value !== undefined && value !== '') {
    if (!evaluateValidationRule(rule, value, field.name, recordData)) {
      return text || `Validation failed for ${field.name}: ${rule}`;
    }
  }

  return null;
}

export const DEFAULT_COL_WIDTHS: Record<string, number> = {
  autonumber:  75,
  number:     100,
  boolean:     80,
  date:       130,
  text:       150,
  longtext:   220,
  currency:   110,
  hyperlink:  180,
  attachment:  90,
  calculated: 150,
  lookup:     150,
};

interface DataGridProps {
  table: TableWithFields;
  records: DbRecord[];
  allRecords?: DbRecord[];
  databaseId: number;
  focusNewRowRef?: React.MutableRefObject<(() => void) | null>;
  sortState?: { field: string, dir: 'asc' | 'desc' } | null;
  onSortChange?: (field: string) => void;
  onSortAscending?: (field: string) => void;
  onSortDescending?: (field: string) => void;
  selectedRowId: number | null;
  onSelectRow: (id: number | null) => void;
  selectedFieldName?: string | null;
  onSelectField?: (fieldName: string | null) => void;
  onRenameField?: (fieldName: string, newName: string) => void;
  onFilterBySelection?: (fieldName: string, value: any) => void;
  onFilterExcluding?: (fieldName: string, value: any) => void;
  onRemoveFilter?: () => void;
  onApplyFilter?: (filter: any) => void;
  onFind?: () => void;
  onDeleteRecord?: (recordId: number) => void;
  onDeleteField?: (fieldName: string) => void;
  activeFilter?: string;
  hiddenFields?: string[];
  onHideField?: (fieldName: string) => void;
  showTotals?: boolean;
  totalFns?: Record<string, TotalFn>;
  onTotalFnChange?: (field: string, fn: TotalFn) => void;
  onClickToAdd?: (fieldType: string) => void;
  colWidths?: Record<string, number>;
  onColWidthsChange?: (next: Record<string, number>) => void;
  frozenFields?: string[];
  rowHeightPx?: number;
  cellStyle?: React.CSSProperties;
  onNewRecordAfter?: (recordId: number) => void;
  onCutRecord?: (recordId: number) => void;
  onCopyRecord?: (recordId: number) => void;
  onPasteRecord?: (recordId: number | null) => void;
  onOpenRowHeight?: () => void;
  canPaste?: boolean;
}

const CLICK_TO_ADD_WIDTH = 130;

const CLICK_TO_ADD_TYPES = [
  { value: 'text',        label: 'Short Text' },
  { value: 'number',      label: 'Number' },
  { value: 'currency',    label: 'Currency' },
  { value: 'date',        label: 'Date & Time' },
  { value: 'boolean',     label: 'Yes/No' },
  { value: 'lookup',      label: 'Lookup & Relationship' },
  { value: 'longtext',    label: 'Long Text' },
  { value: 'attachment',  label: 'Attachment' },
  { value: 'hyperlink',   label: 'Hyperlink' },
  { value: 'calculated',  label: 'Calculated Field' },
];

export function DataGrid({
  table, records, allRecords, databaseId, focusNewRowRef, sortState, onSortChange,
  onSortAscending, onSortDescending,
  selectedRowId, onSelectRow,
  selectedFieldName, onSelectField, onRenameField,
  onFilterBySelection, onFilterExcluding, onRemoveFilter, onApplyFilter, onFind, onDeleteRecord, onDeleteField, activeFilter,
  hiddenFields = [], onHideField,
  showTotals = false, totalFns = {}, onTotalFnChange,
  onClickToAdd,
  colWidths: colWidthsProp, onColWidthsChange,
  frozenFields = [],
  rowHeightPx,
  cellStyle,
  onNewRecordAfter, onCutRecord, onCopyRecord, onPasteRecord, onOpenRowHeight, canPaste,
}: DataGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createRecord = useCreateRecord();
  const updateRecord = useUpdateRecord();

  const [newRowData, setNewRowData] = useState<{ [key: string]: any }>({});
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editingHeader, setEditingHeader] = useState<{ name: string; value: string } | null>(null);
  const [editingValue, setEditingValue] = useState<any>(null);
  const [ctxTarget, setCtxTarget] = useState<CtxTarget>(null);
  const [filterDlg, setFilterDlg] = useState<FilterDlg>(null);
  const [focusedCell, setFocusedCell] = useState<FocusedCell>(null);
  const [colWidthsLocal, setColWidthsLocal] = useState<Record<string, number>>({});
  const colWidths = colWidthsProp ?? colWidthsLocal;
  const setColWidths = (updater: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => {
    const next = typeof updater === 'function' ? (updater as any)(colWidths) : updater;
    if (onColWidthsChange) onColWidthsChange(next);
    else setColWidthsLocal(next);
  };
  const [resizing, setResizing] = useState<{ field: string; startX: number; startW: number } | null>(null);
  const [colWidthDlg, setColWidthDlg] = useState<{ field: string; width: number } | null>(null);
  const [unhideDlg, setUnhideDlg] = useState(false);
  const [clickToAddOpen, setClickToAddOpen] = useState(false);
  const clickToAddRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    if (!clickToAddOpen) return;
    const handler = (e: MouseEvent) => {
      if (clickToAddRef.current && !clickToAddRef.current.contains(e.target as Node)) {
        setClickToAddOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [clickToAddOpen]);

  const isCreatingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const newRowTrRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (focusNewRowRef) {
      focusNewRowRef.current = () => {
        const container = containerRef.current;
        const newRowTr = newRowTrRef.current;
        if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        if (newRowTr) {
          const firstInput = newRowTr.querySelector<HTMLInputElement | HTMLSelectElement>('input, select');
          if (firstInput) setTimeout(() => firstInput.focus(), 150);
        }
      };
    }
  }, [focusNewRowRef]);

  const [lookupRecords, setLookupRecords] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const lookupFields = table.fields.filter(f => f.fieldType === 'lookup');
    lookupFields.forEach(f => {
      const cfg = parseLookupConfig(f.description);
      if (cfg?.type === 'table' && cfg.tableId && !lookupRecords[cfg.tableId]) {
        fetch(`/api/ds/databases/${databaseId}/tables/${cfg.tableId}/records`)
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data)) {
              setLookupRecords(prev => ({ ...prev, [cfg.tableId!]: data }));
            }
          })
          .catch(() => {});
      }
    });
  }, [table.fields, databaseId]);

  const getLookupOptions = (cfg: LookupConfig | null): { value: string; display: string }[] => {
    if (!cfg) return [];
    if (cfg.type === 'valuelist') {
      return (cfg.values || []).map(v => ({ value: v, display: v }));
    }
    if (cfg.type === 'table' && cfg.tableId) {
      const recs = lookupRecords[cfg.tableId] || [];
      const valField = cfg.valueField || '';
      const dispField = cfg.displayField || valField;
      return recs.map(r => ({
        value: String(r.data?.[valField] ?? ''),
        display: String(r.data?.[dispField] ?? r.data?.[valField] ?? ''),
      })).filter(o => o.value);
    }
    return [];
  };

  const allFieldsSorted = [...table.fields].sort((a, b) => a.sortOrder - b.sortOrder);
  const visibleFields = allFieldsSorted.filter(f => !hiddenFields.includes(f.name));
  const frozenSet = new Set(frozenFields);
  // Frozen fields render first (in their original order), followed by the rest.
  const fields = [
    ...visibleFields.filter(f => frozenSet.has(f.name)),
    ...visibleFields.filter(f => !frozenSet.has(f.name)),
  ];

  const getColWidth = (fieldName: string, fieldType: string) =>
    colWidths[fieldName] ?? DEFAULT_COL_WIDTHS[fieldType] ?? 150;

  // ── Frozen-column sticky-left offsets ──
  const frozenLeft: Record<string, number> = {};
  {
    let acc = 15; // row-selector column width
    for (const f of fields) {
      if (frozenSet.has(f.name)) {
        frozenLeft[f.name] = acc;
        acc += getColWidth(f.name, f.fieldType);
      } else {
        break;
      }
    }
  }
  const hasFrozen = frozenFields.length > 0;
  const stickyTh = (fieldName: string): React.CSSProperties =>
    frozenLeft[fieldName] !== undefined
      ? { position: 'sticky', left: frozenLeft[fieldName], zIndex: 12 }
      : {};
  const stickyTd = (fieldName: string): React.CSSProperties =>
    frozenLeft[fieldName] !== undefined
      ? { position: 'sticky', left: frozenLeft[fieldName], zIndex: 4, background: 'inherit', boxShadow: undefined }
      : {};

  const getFieldType = (fieldName: string | null) =>
    allFieldsSorted.find(f => f.name === fieldName)?.fieldType ?? 'text';

  // ── Column resize tracking ──
  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const newW = Math.max(10, resizing.startW + e.clientX - resizing.startX);
      setColWidths(prev => ({ ...prev, [resizing.field]: newW }));
    };
    const onUp = () => setResizing(null);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [resizing]);

  // ── Cell navigation helpers ──
  const moveFocus = useCallback((rowIdx: number, colIdx: number) => {
    const clampedRow = Math.max(0, Math.min(records.length - 1, rowIdx));
    const editableFields = fields.filter(f => f.fieldType !== 'autonumber');
    const clampedCol = Math.max(0, Math.min(editableFields.length - 1, colIdx));
    setFocusedCell({ rowIdx: clampedRow, colIdx: clampedCol });
    onSelectRow(records[clampedRow]?.id ?? null);
  }, [records, fields, onSelectRow]);

  const startEditing = useCallback((rowIdx: number, colIdx: number) => {
    const editableFields = fields.filter(f => f.fieldType !== 'autonumber');
    const field = editableFields[colIdx];
    const record = records[rowIdx];
    if (!record || !field || field.fieldType === 'autonumber') return;
    const fullColIdx = fields.findIndex(f => f.name === field.name);
    setEditingCell({ recordId: record.id, fieldName: field.name, rowIdx, colIdx: fullColIdx });
    setEditingValue(record.data[field.name] ?? '');
    setFocusedCell({ rowIdx, colIdx });
    onSelectRow(record.id);
  }, [records, fields, onSelectRow]);

  // ── Container keyboard navigation ──
  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) return;
    if (!focusedCell) return;
    const { rowIdx, colIdx } = focusedCell;
    const editableFields = fields.filter(f => f.fieldType !== 'autonumber');
    const fieldColIdx = editableFields.findIndex((_, i) => i === colIdx);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveFocus(rowIdx + 1, colIdx);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveFocus(rowIdx - 1, colIdx);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveFocus(rowIdx, colIdx + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveFocus(rowIdx, colIdx - 1);
        break;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        startEditing(rowIdx, colIdx);
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) moveFocus(rowIdx, colIdx - 1);
        else moveFocus(rowIdx, colIdx + 1);
        break;
      case 'Delete':
      case 'Backspace': {
        e.preventDefault();
        const field = editableFields[fieldColIdx];
        const record = records[rowIdx];
        if (record && field) handleCellSave(record, field.name, null);
        break;
      }
    }
  };

  // ── Edit input keyboard nav ──
  const handleEditKeyDown = (
    e: React.KeyboardEvent,
    record: DbRecord,
    fieldName: string,
    rowIdx: number,
    fullColIdx: number
  ) => {
    const editableFields = fields.filter(f => f.fieldType !== 'autonumber');
    const editableColIdx = editableFields.findIndex(f => f.name === fieldName);

    if (e.key === 'Tab') {
      e.preventDefault();
      handleCellSave(record, fieldName, editingValue);
      const nextEditableIdx = e.shiftKey ? editableColIdx - 1 : editableColIdx + 1;
      if (nextEditableIdx >= 0 && nextEditableIdx < editableFields.length) {
        const nextField = editableFields[nextEditableIdx];
        setTimeout(() => {
          setEditingCell({ recordId: record.id, fieldName: nextField.name, rowIdx, colIdx: fields.findIndex(f => f.name === nextField.name) });
          setEditingValue(record.data[nextField.name] ?? '');
          setFocusedCell({ rowIdx, colIdx: nextEditableIdx });
        }, 10);
      } else {
        setEditingCell(null);
        setFocusedCell({ rowIdx, colIdx: editableColIdx });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleCellSave(record, fieldName, editingValue);
      const nextRowIdx = rowIdx + 1;
      if (nextRowIdx < records.length) {
        setTimeout(() => {
          const nextRecord = records[nextRowIdx];
          if (nextRecord) {
            setEditingCell({ recordId: nextRecord.id, fieldName, rowIdx: nextRowIdx, colIdx: fullColIdx });
            setEditingValue(nextRecord.data[fieldName] ?? '');
            setFocusedCell({ rowIdx: nextRowIdx, colIdx: editableColIdx });
          }
        }, 10);
      } else {
        setEditingCell(null);
        setFocusedCell({ rowIdx, colIdx: editableColIdx });
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCell(null);
      setEditingValue(null);
      setFocusedCell({ rowIdx, colIdx: editableColIdx });
    }
  };

  const handleCellClick = (recordId: number, fieldName: string, value: any, isPrimaryKey: boolean, rowIdx: number, colIdx: number) => {
    const field = fields.find(f => f.name === fieldName);
    if (field?.fieldType === 'autonumber') return;
    const editableFields = fields.filter(f => f.fieldType !== 'autonumber');
    const editableColIdx = editableFields.findIndex(f => f.name === fieldName);
    setEditingCell({ recordId, fieldName, rowIdx, colIdx });
    setEditingValue(value ?? '');
    setFocusedCell({ rowIdx, colIdx: editableColIdx });
  };

  const handleCellSave = async (record: DbRecord, fieldName: string, value: any) => {
    const originalVal = record.data[fieldName];
    const coerced = value === '' ? null : value;
    if (originalVal === coerced) { setEditingCell(null); return; }

    const field = fields.find(f => f.name === fieldName);
    if (field) {
      const updatedData = { ...record.data, [fieldName]: coerced };
      const error = validateField(field as any, coerced, updatedData);
      if (error) {
        toast({ title: error, variant: "destructive" });
        return;
      }
    }

    try {
      await updateRecord.mutateAsync({
        databaseId,
        tableId: table.id,
        recordId: record.id,
        data: { data: { ...record.data, [fieldName]: coerced } }
      });
      queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey(databaseId, table.id) });
    } catch {
      toast({ title: "Failed to update record", variant: "destructive" });
    }
    setEditingCell(null);
  };

  const handleBooleanToggle = async (record: DbRecord, fieldName: string) => {
    const newVal = !record.data[fieldName];
    try {
      await updateRecord.mutateAsync({
        databaseId, tableId: table.id, recordId: record.id,
        data: { data: { ...record.data, [fieldName]: newVal } }
      });
      queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey(databaseId, table.id) });
    } catch {
      toast({ title: "Failed to update record", variant: "destructive" });
    }
  };

  const handleNewRowSave = useCallback(async () => {
    if (isCreatingRef.current) return;
    const hasData = Object.values(newRowData).some(v => v !== '' && v !== null && v !== undefined);
    if (!hasData) return;

    for (const f of fields) {
      if (f.fieldType === 'autonumber' || f.fieldType === 'calculated') continue;
      const val = newRowData[f.name] ?? null;
      const coerced = val === '' ? null : val;
      const error = validateField(f as any, coerced, newRowData);
      if (error) {
        toast({ title: error, variant: "destructive" });
        return;
      }
    }

    isCreatingRef.current = true;
    try {
      await createRecord.mutateAsync({ databaseId, tableId: table.id, data: { data: newRowData } });
      setNewRowData({});
      queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey(databaseId, table.id) });
    } catch {
      toast({ title: "Failed to create record", variant: "destructive" });
    } finally {
      isCreatingRef.current = false;
    }
  }, [newRowData, databaseId, table.id, fields]);

  const renderCellValue = (type: string, value: any, fieldName?: string, record?: DbRecord) => {
    if (type === 'boolean') return null; // rendered as checkbox
    if (type === 'attachment') return null; // rendered as icon
    if (type === 'hyperlink') return null; // rendered as link
    if (type === 'calculated' && fieldName) {
      const field = table.fields.find(f => f.name === fieldName);
      const rawExpr = parseCalculatedExpr(field?.description);
      if (!rawExpr || !record) return '';
      const expr = rawExpr.replace(/^=/, '');
      const result = expr.replace(/\[([^\]]+)\]/g, (_: string, fn: string) => {
        const v = record.data[fn];
        return v !== null && v !== undefined ? JSON.stringify(String(v)) : '""';
      }).replace(/&/g, '+');
      try { return String(eval(result.trim()) ?? ''); } catch { return result.replace(/["+]/g, '').trim(); }
    }
    if (value === null || value === undefined || value === '') return '';
    if (type === 'currency') {
      const num = Number(value);
      if (isNaN(num)) return String(value);
      return '£' + num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (type === 'date' && value) return String(value).split('T')[0];
    if (type === 'lookup' && fieldName) {
      const field = table.fields.find(f => f.name === fieldName);
      const cfg = parseLookupConfig(field?.description);
      if (cfg?.type === 'valuelist') return String(value);
      if (cfg?.type === 'table' && cfg.tableId) {
        const options = getLookupOptions(cfg);
        const match = options.find(o => o.value === String(value));
        return match ? match.display : String(value);
      }
      return String(value);
    }
    return String(value);
  };

  const blockNonNumeric = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['0','1','2','3','4','5','6','7','8','9','.','-','Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Enter','Escape','Home','End','F2'];
    if (!allowed.includes(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault();
  };

  const renderEditInput = (
    type: string, value: any,
    onChange: (v: any) => void,
    onCommit: () => void,
    record: DbRecord,
    fieldName: string,
    rowIdx: number,
    colIdx: number
  ) => {
    const onKeyDown = (e: React.KeyboardEvent) => handleEditKeyDown(e, record, fieldName, rowIdx, colIdx);
    const baseInput = "w-full bg-white border border-red-400 outline-none px-1 text-sm h-full";

    if (type === 'boolean') {
      return (
        <input type="checkbox" checked={!!value} autoFocus
          onChange={e => { onChange(e.target.checked); onCommit(); }}
          className="w-4 h-4 text-red-600" />
      );
    }
    if (type === 'number' || type === 'currency') {
      return (
        <input type="number" autoFocus value={value ?? ''}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : '')}
          onBlur={onCommit}
          onKeyDown={e => { blockNonNumeric(e); onKeyDown(e); }}
          className={baseInput} />
      );
    }
    if (type === 'date') {
      return (
        <input type="date" autoFocus value={value ? String(value).split('T')[0] : ''}
          onChange={e => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={onKeyDown}
          className={baseInput} />
      );
    }
    if (type === 'longtext') {
      return (
        <textarea autoFocus value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={e => { if (e.key === 'Escape') { onKeyDown(e); } }}
          rows={3}
          className="w-full bg-white border border-red-400 outline-none px-1 text-sm resize-none absolute z-20 shadow-lg min-w-full"
          style={{ top: 0, left: 0 }}
        />
      );
    }
    const fieldDef = table.fields.find(f => f.name === fieldName);
    const textMax = (type === 'text' && fieldDef?.fieldSize)
      ? Number(fieldDef.fieldSize) || undefined
      : undefined;
    const handlePasteOverflow = (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (!textMax) return;
      const pasted = e.clipboardData.getData('text');
      const target = e.currentTarget;
      const current = String(target.value ?? '');
      const selLen = (target.selectionEnd ?? current.length) - (target.selectionStart ?? 0);
      const projected = current.length - selLen + pasted.length;
      if (projected > textMax) {
        toast({
          title: `Text was truncated`,
          description: `${fieldName} only allows ${textMax} character${textMax === 1 ? '' : 's'} (you tried to paste ${pasted.length}).`,
          variant: 'destructive',
        });
      }
    };
    if (type === 'lookup') {
      const field = table.fields.find(f => f.name === fieldName);
      const cfg = parseLookupConfig(field?.description);
      const options = getLookupOptions(cfg);
      if (options.length > 0) {
        return (
          <select autoFocus value={value ?? ''}
            onChange={e => { onChange(e.target.value); onCommit(); }}
            onBlur={onCommit}
            onKeyDown={onKeyDown}
            className={baseInput + ' cursor-pointer'}>
            <option value="">(none)</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.display}</option>)}
          </select>
        );
      }
    }
    if (type === 'calculated' || type === 'attachment') {
      return <span className="text-gray-400 italic text-xs px-1">{type === 'calculated' ? '(calculated)' : '(attachment)'}</span>;
    }
    return (
      <input type="text" autoFocus value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={onKeyDown}
        onPaste={handlePasteOverflow}
        maxLength={textMax}
        className={baseInput} />
    );
  };

  const renderNewRowInput = (type: string, fieldName: string, isPrimaryKey: boolean, defaultValue?: string | null) => {
    if (type === 'autonumber') {
      const hasInput = Object.entries(newRowData).some(([k, v]) => {
        if (k === fieldName) return false;
        return v !== '' && v !== null && v !== undefined;
      });
      let maxVal = 0;
      for (const r of records) {
        const v = parseInt(r.data?.[fieldName] ?? '0');
        if (!isNaN(v) && v > maxVal) maxVal = v;
      }
      const next = maxVal + 1;
      return hasInput
        ? <span className="block text-right text-sm text-gray-600 px-1">{next}</span>
        : <span className="block text-right text-xs italic text-gray-400 px-1">(New)</span>;
    }
    if (type === 'calculated' || type === 'attachment') return <span className="text-gray-300 text-xs px-1 italic">—</span>;
    if (type === 'boolean') {
      return (
        <input type="checkbox" checked={!!newRowData[fieldName]}
          onChange={e => setNewRowData(p => ({ ...p, [fieldName]: e.target.checked }))}
          className="w-4 h-4 text-red-600 m-auto block mt-1" />
      );
    }
    if (type === 'number' || type === 'currency') {
      const numPlaceholder = defaultValue != null && defaultValue !== ''
        ? (type === 'currency' ? '£' + Number(defaultValue).toFixed(2) : defaultValue)
        : (type === 'currency' ? '£0.00' : '0');
      return (
        <input type="number" value={newRowData[fieldName] ?? ''}
          onChange={e => setNewRowData(p => ({ ...p, [fieldName]: e.target.value ? Number(e.target.value) : '' }))}
          onBlur={handleNewRowSave}
          onKeyDown={blockNonNumeric}
          placeholder={numPlaceholder}
          className="w-full bg-transparent outline-none px-1 text-sm placeholder:text-gray-300" />
      );
    }
    if (type === 'date') {
      return (
        <input type="date" value={newRowData[fieldName] ?? ''}
          onChange={e => setNewRowData(p => ({ ...p, [fieldName]: e.target.value }))}
          onBlur={handleNewRowSave}
          className="w-full bg-transparent outline-none px-1 text-sm" />
      );
    }
    if (type === 'lookup') {
      const field = table.fields.find(f => f.name === fieldName);
      const cfg = parseLookupConfig(field?.description);
      const options = getLookupOptions(cfg);
      if (options.length > 0) {
        return (
          <select value={newRowData[fieldName] ?? ''}
            onChange={e => setNewRowData(p => ({ ...p, [fieldName]: e.target.value }))}
            onBlur={handleNewRowSave}
            className="w-full bg-transparent outline-none px-1 text-sm cursor-pointer">
            <option value="">(none)</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.display}</option>)}
          </select>
        );
      }
    }
    const textPlaceholder = defaultValue != null && defaultValue !== '' ? defaultValue : '';
    const newRowFieldDef = table.fields.find(f => f.name === fieldName);
    const newRowMax = (type === 'text' && newRowFieldDef?.fieldSize)
      ? Number(newRowFieldDef.fieldSize) || undefined
      : undefined;
    const handleNewRowPasteOverflow = (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (!newRowMax) return;
      const pasted = e.clipboardData.getData('text');
      const target = e.currentTarget;
      const current = String(target.value ?? '');
      const selLen = (target.selectionEnd ?? current.length) - (target.selectionStart ?? 0);
      const projected = current.length - selLen + pasted.length;
      if (projected > newRowMax) {
        toast({
          title: `Text was truncated`,
          description: `${fieldName} only allows ${newRowMax} character${newRowMax === 1 ? '' : 's'} (you tried to paste ${pasted.length}).`,
          variant: 'destructive',
        });
      }
    };
    return (
      <input type="text" value={newRowData[fieldName] ?? ''}
        onChange={e => setNewRowData(p => ({ ...p, [fieldName]: e.target.value }))}
        onBlur={handleNewRowSave}
        placeholder={textPlaceholder}
        maxLength={newRowMax}
        onPaste={handleNewRowPasteOverflow}
        className="w-full bg-transparent outline-none px-1 text-sm placeholder:text-gray-300" />
    );
  };

  // ── Totals computation ──
  const computeTotal = (fieldName: string, fn: TotalFn): string => {
    if (fn === 'None') return '';
    const source = allRecords ?? records;
    const ft = getFieldType(fieldName);
    const values = source.map(r => r.data[fieldName]).filter(v => v !== null && v !== undefined && v !== '');
    if (fn === 'Count') return values.length.toString();
    const isNumeric = ft === 'number' || ft === 'currency';
    const fmtNum = (n: number) => ft === 'currency'
      ? '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : n.toLocaleString();
    if (fn === 'Sum' && isNumeric) {
      const nums = values.map(Number).filter(n => !isNaN(n));
      return fmtNum(nums.reduce((a, b) => a + b, 0));
    }
    if (fn === 'Average' && isNumeric) {
      const nums = values.map(Number).filter(n => !isNaN(n));
      return nums.length ? fmtNum(nums.reduce((a, b) => a + b, 0) / nums.length) : '';
    }
    if (fn === 'Minimum') {
      if (isNumeric) { const n = values.map(Number).filter(n => !isNaN(n)); return n.length ? fmtNum(Math.min(...n)) : ''; }
      return [...values].sort()[0]?.toString() ?? '';
    }
    if (fn === 'Maximum') {
      if (isNumeric) { const n = values.map(Number).filter(n => !isNaN(n)); return n.length ? fmtNum(Math.max(...n)) : ''; }
      return [...values].sort().reverse()[0]?.toString() ?? '';
    }
    return '';
  };

  const getTotalColWidth = () => 15 + fields.reduce((sum, f) => sum + getColWidth(f.name, f.fieldType), 0) + (onClickToAdd ? CLICK_TO_ADD_WIDTH : 0);

  const getFnOptionsForType = (fieldType: string): TotalFn[] => {
    if (fieldType === 'number' || fieldType === 'currency') return ['None', 'Sum', 'Average', 'Count', 'Minimum', 'Maximum'];
    if (fieldType === 'boolean') return ['None', 'Count'];
    if (fieldType === 'calculated' || fieldType === 'attachment') return ['None'];
    return ['None', 'Count', 'Minimum', 'Maximum'];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const ctxFieldName = ctxTarget && 'fieldName' in ctxTarget ? ctxTarget.fieldName : null;
  const ctxValue = ctxTarget?.type === 'cell' ? ctxTarget.value : null;
  const ctxIsPK = ctxTarget?.type === 'cell' ? ctxTarget.isPrimaryKey : false;
  const ctxRecordId = ctxTarget && 'recordId' in ctxTarget ? ctxTarget.recordId : null;
  const ctxRecord = ctxTarget && 'record' in ctxTarget ? ctxTarget.record : null;

  const displayValue = (val: any, fieldName: string | null) => {
    if (!fieldName || val === null || val === undefined) return '(empty)';
    const field = allFieldsSorted.find(f => f.name === fieldName);
    return renderCellValue(field?.fieldType || 'text', val) || '(empty)';
  };

  const openFilterDlg = (op: string, label: string, field: string, fieldType: string, defaultVal = '') => {
    setFilterDlg({ op, label, field, fieldType, val: defaultVal, val2: '' });
  };

  const applyFilterDlg = () => {
    if (!filterDlg) return;
    const { op, field, fieldType, val, val2 } = filterDlg;
    const coerce = (v: string) => fieldType === 'number' ? Number(v) : v;
    let filter: any = null;
    switch (op) {
      case 'eq':           filter = { type: 'eq', field, value: coerce(val) }; break;
      case 'ne':           filter = { type: 'ne', field, value: coerce(val) }; break;
      case 'lt':           filter = { type: 'lt', field, value: coerce(val) }; break;
      case 'lte':          filter = { type: 'lte', field, value: coerce(val) }; break;
      case 'gt':           filter = { type: 'gt', field, value: coerce(val) }; break;
      case 'gte':          filter = { type: 'gte', field, value: coerce(val) }; break;
      case 'between':      filter = { type: 'between', field, lo: coerce(val), hi: coerce(val2) }; break;
      case 'startsWith':   filter = { type: 'startsWith', field, value: val }; break;
      case 'notStartsWith':filter = { type: 'notStartsWith', field, value: val }; break;
      case 'endsWith':     filter = { type: 'endsWith', field, value: val }; break;
      case 'notEndsWith':  filter = { type: 'notEndsWith', field, value: val }; break;
      case 'contains':     filter = { type: 'contains', field, value: val }; break;
      case 'notContains':  filter = { type: 'notContains', field, value: val }; break;
    }
    if (filter) onApplyFilter?.(filter);
    setFilterDlg(null);
  };

  const applyDateShortcut = (field: string, shortcut: string) => {
    const now = new Date(); now.setHours(0,0,0,0);
    const iso = (d: Date) => d.toISOString().split('T')[0];
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);
    const lastWeekStart = new Date(startOfWeek); lastWeekStart.setDate(startOfWeek.getDate() - 7);
    const lastWeekEnd = new Date(startOfWeek); lastWeekEnd.setDate(startOfWeek.getDate() - 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
    const map: Record<string, any> = {
      today:      { type: 'eq', field, value: iso(now) },
      yesterday:  { type: 'eq', field, value: iso(yesterday) },
      thisWeek:   { type: 'between', field, lo: iso(startOfWeek),   hi: iso(endOfWeek) },
      lastWeek:   { type: 'between', field, lo: iso(lastWeekStart),  hi: iso(lastWeekEnd) },
      thisMonth:  { type: 'between', field, lo: iso(startOfMonth),   hi: iso(endOfMonth) },
      lastMonth:  { type: 'between', field, lo: iso(lastMonthStart), hi: iso(lastMonthEnd) },
      thisYear:   { type: 'between', field, lo: iso(startOfYear),    hi: iso(endOfYear) },
      lastYear:   { type: 'between', field, lo: iso(lastYearStart),  hi: iso(lastYearEnd) },
    };
    if (map[shortcut]) onApplyFilter?.(map[shortcut]);
  };

  const renderTextFilters = (field: string, defaultVal = '') => (
    <ContextMenuSub>
      <ContextMenuSubTrigger>Text Filters</ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-52 text-sm">
        <ContextMenuItem onClick={() => openFilterDlg('eq', 'Equals', field, 'text', defaultVal)}>Equals…</ContextMenuItem>
        <ContextMenuItem onClick={() => openFilterDlg('ne', 'Does Not Equal', field, 'text', defaultVal)}>Does Not Equal…</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => openFilterDlg('startsWith', 'Begins With', field, 'text', defaultVal)}>Begins With…</ContextMenuItem>
        <ContextMenuItem onClick={() => openFilterDlg('notStartsWith', 'Does Not Begin With', field, 'text')}>Does Not Begin With…</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => openFilterDlg('contains', 'Contains', field, 'text', defaultVal)}>Contains…</ContextMenuItem>
        <ContextMenuItem onClick={() => openFilterDlg('notContains', 'Does Not Contain', field, 'text')}>Does Not Contain…</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => openFilterDlg('endsWith', 'Ends With', field, 'text', defaultVal)}>Ends With…</ContextMenuItem>
        <ContextMenuItem onClick={() => openFilterDlg('notEndsWith', 'Does Not End With', field, 'text')}>Does Not End With…</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onApplyFilter?.({ type: 'isEmpty', field })}>Is Empty</ContextMenuItem>
        <ContextMenuItem onClick={() => onApplyFilter?.({ type: 'isNotEmpty', field })}>Is Not Empty</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  );

  const renderNumberFilters = (field: string, defaultVal = '') => (
    <ContextMenuSub>
      <ContextMenuSubTrigger>Number Filters</ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-52 text-sm">
        <ContextMenuItem onClick={() => openFilterDlg('eq', 'Equals', field, 'number', defaultVal)}>Equals…</ContextMenuItem>
        <ContextMenuItem onClick={() => openFilterDlg('ne', 'Does Not Equal', field, 'number', defaultVal)}>Does Not Equal…</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => openFilterDlg('lt', 'Less Than', field, 'number')}>Less Than…</ContextMenuItem>
        <ContextMenuItem onClick={() => openFilterDlg('lte', 'Less Than or Equal To', field, 'number')}>Less Than or Equal To…</ContextMenuItem>
        <ContextMenuItem onClick={() => openFilterDlg('gt', 'Greater Than', field, 'number')}>Greater Than…</ContextMenuItem>
        <ContextMenuItem onClick={() => openFilterDlg('gte', 'Greater Than or Equal To', field, 'number')}>Greater Than or Equal To…</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => openFilterDlg('between', 'Between', field, 'number')}>Between…</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onApplyFilter?.({ type: 'isEmpty', field })}>Is Empty</ContextMenuItem>
        <ContextMenuItem onClick={() => onApplyFilter?.({ type: 'isNotEmpty', field })}>Is Not Empty</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  );

  const renderDateFilters = (field: string, defaultVal = '') => (
    <ContextMenuSub>
      <ContextMenuSubTrigger>Date Filters</ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-52 text-sm">
        <ContextMenuItem onClick={() => openFilterDlg('eq', 'Equals (Date)', field, 'date', defaultVal)}>Equals…</ContextMenuItem>
        <ContextMenuItem onClick={() => openFilterDlg('ne', 'Does Not Equal (Date)', field, 'date', defaultVal)}>Does Not Equal…</ContextMenuItem>
        <ContextMenuItem onClick={() => openFilterDlg('lt', 'Before', field, 'date')}>Before…</ContextMenuItem>
        <ContextMenuItem onClick={() => openFilterDlg('gt', 'After', field, 'date')}>After…</ContextMenuItem>
        <ContextMenuItem onClick={() => openFilterDlg('between', 'Between (Dates)', field, 'date')}>Between…</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => applyDateShortcut(field, 'today')}>Today</ContextMenuItem>
        <ContextMenuItem onClick={() => applyDateShortcut(field, 'yesterday')}>Yesterday</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => applyDateShortcut(field, 'thisWeek')}>This Week</ContextMenuItem>
        <ContextMenuItem onClick={() => applyDateShortcut(field, 'lastWeek')}>Last Week</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => applyDateShortcut(field, 'thisMonth')}>This Month</ContextMenuItem>
        <ContextMenuItem onClick={() => applyDateShortcut(field, 'lastMonth')}>Last Month</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => applyDateShortcut(field, 'thisYear')}>This Year</ContextMenuItem>
        <ContextMenuItem onClick={() => applyDateShortcut(field, 'lastYear')}>Last Year</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onApplyFilter?.({ type: 'isEmpty', field })}>Is Empty</ContextMenuItem>
        <ContextMenuItem onClick={() => onApplyFilter?.({ type: 'isNotEmpty', field })}>Is Not Empty</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  );

  const renderBoolFilters = (field: string) => (
    <ContextMenuSub>
      <ContextMenuSubTrigger>Yes/No Filters</ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-44 text-sm">
        <ContextMenuItem onClick={() => onApplyFilter?.({ type: 'eq', field, value: true })}>Is Yes</ContextMenuItem>
        <ContextMenuItem onClick={() => onApplyFilter?.({ type: 'eq', field, value: false })}>Is No</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onApplyFilter?.({ type: 'isEmpty', field })}>Is Empty (Blank)</ContextMenuItem>
        <ContextMenuItem onClick={() => onApplyFilter?.({ type: 'isNotEmpty', field })}>Is Not Empty</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  );

  const renderTypeFilters = (fieldName: string, cellVal?: any) => {
    const ft = getFieldType(fieldName);
    const dv = cellVal !== null && cellVal !== undefined ? String(cellVal) : '';
    if (ft === 'number')  return renderNumberFilters(fieldName, dv);
    if (ft === 'date')    return renderDateFilters(fieldName, dv);
    if (ft === 'boolean') return renderBoolFilters(fieldName);
    return renderTextFilters(fieldName, dv);
  };

  const isBetweenOp = filterDlg?.op === 'between';
  const isDateInput = filterDlg?.fieldType === 'date';
  const isNumberInput = filterDlg?.fieldType === 'number';

  return (
    <>
      {/* ── Filter Input Dialog ── */}
      {filterDlg && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30" onClick={() => setFilterDlg(null)}>
          <div className="bg-white border border-gray-300 shadow-xl rounded w-80 p-4" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-semibold text-gray-800 mb-3">{filterDlg.label}</div>
            <div className="space-y-2 mb-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">{isBetweenOp ? 'From' : 'Value'}</label>
                <input
                  type={isDateInput ? 'date' : isNumberInput ? 'number' : 'text'}
                  value={filterDlg.val}
                  autoFocus
                  onChange={e => setFilterDlg(d => d ? { ...d, val: e.target.value } : d)}
                  onKeyDown={e => { if (e.key === 'Enter' && !isBetweenOp) applyFilterDlg(); if (e.key === 'Escape') setFilterDlg(null); }}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-[#C42B1C] focus:outline-none"
                />
              </div>
              {isBetweenOp && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">To</label>
                  <input
                    type={isDateInput ? 'date' : isNumberInput ? 'number' : 'text'}
                    value={filterDlg.val2}
                    onChange={e => setFilterDlg(d => d ? { ...d, val2: e.target.value } : d)}
                    onKeyDown={e => { if (e.key === 'Enter') applyFilterDlg(); if (e.key === 'Escape') setFilterDlg(null); }}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-[#C42B1C] focus:outline-none"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setFilterDlg(null)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={applyFilterDlg}
                className="px-3 py-1.5 text-sm bg-[#C42B1C] text-white rounded hover:bg-[#9B2118]">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Column Width Dialog ── */}
      {colWidthDlg && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30" onClick={() => setColWidthDlg(null)}>
          <div className="bg-white border border-gray-300 shadow-xl rounded w-72 p-4" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-semibold text-gray-800 mb-1">Column Width</div>
            <div className="text-xs text-gray-500 mb-3">Field: <strong>{colWidthDlg.field}</strong></div>
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">Width (pixels):</label>
              <input
                type="number" min={40} max={800} autoFocus
                value={colWidthDlg.width}
                onChange={e => setColWidthDlg(d => d ? { ...d, width: Number(e.target.value) } : d)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { setColWidths(p => ({ ...p, [colWidthDlg.field]: colWidthDlg.width })); setColWidthDlg(null); }
                  if (e.key === 'Escape') setColWidthDlg(null);
                }}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-[#C42B1C] focus:outline-none"
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => { setColWidths(p => ({ ...p, [colWidthDlg.field]: DEFAULT_COL_WIDTHS[getFieldType(colWidthDlg.field)] ?? 150 })); setColWidthDlg(null); }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                Best Fit
              </button>
              <div className="flex gap-2">
                <button onClick={() => setColWidthDlg(null)} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                <button
                  onClick={() => { setColWidths(p => ({ ...p, [colWidthDlg.field]: colWidthDlg.width })); setColWidthDlg(null); }}
                  className="px-3 py-1.5 text-sm bg-[#C42B1C] text-white rounded hover:bg-[#9B2118]">OK</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Unhide Columns Dialog ── */}
      {unhideDlg && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30" onClick={() => setUnhideDlg(false)}>
          <div className="bg-white border border-gray-300 shadow-xl rounded w-64 p-4" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-semibold text-gray-800 mb-3">Unhide Columns</div>
            <div className="space-y-1.5 mb-4 max-h-48 overflow-y-auto">
              {allFieldsSorted.map(f => {
                const isHidden = hiddenFields.includes(f.name);
                return (
                  <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-1 rounded">
                    <input
                      type="checkbox"
                      checked={!isHidden}
                      onChange={() => {
                        if (isHidden) {
                          onHideField?.('__unhide__' + f.name as any);
                        } else {
                          onHideField?.(f.name);
                        }
                      }}
                      className="w-3.5 h-3.5"
                    />
                    <span className={isHidden ? 'text-gray-400' : 'text-gray-700'}>{f.name}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setUnhideDlg(false)} className="px-3 py-1.5 text-sm bg-[#C42B1C] text-white rounded hover:bg-[#9B2118]">Close</button>
            </div>
          </div>
        </div>
      )}

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={containerRef}
            tabIndex={0}
            className="w-full h-full overflow-auto bg-white outline-none"
            onKeyDown={handleContainerKeyDown}
            onMouseDown={e => {
              if ((e.target as HTMLElement).closest('td') === null &&
                  (e.target as HTMLElement).closest('th') === null) {
                onSelectRow(null);
                setFocusedCell(null);
              }
            }}
          >
            <table className="text-left border-collapse bg-white text-sm" style={{ tableLayout: 'fixed', width: getTotalColWidth() }}>
              <colgroup>
                <col style={{ width: 15, minWidth: 15, maxWidth: 15 }} />
                {fields.map(f => (
                  <col key={f.id} style={{ width: getColWidth(f.name, f.fieldType) }} />
                ))}
                {onClickToAdd && <col style={{ width: CLICK_TO_ADD_WIDTH, minWidth: CLICK_TO_ADD_WIDTH }} />}
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr>
                  <th
                    className="bg-[#f3f2f1] border-r border-b border-gray-300"
                    style={{ width: 15, minWidth: 15, maxWidth: 15, ...(hasFrozen ? { position: 'sticky', left: 0, zIndex: 13 } : {}) }}
                  />
                  {fields.map((f, fi) => (
                    <th
                      key={f.id}
                      className={`relative border-r border-b border-gray-300 px-2 py-1.5 font-medium text-gray-700 text-xs select-none cursor-pointer hover:bg-gray-200 transition-colors ${selectedFieldName === f.name ? 'bg-[#cce5ff]' : sortState?.field === f.name ? 'bg-red-50' : 'bg-[#f3f2f1]'}`}
                      onClick={() => { if (editingHeader?.name === f.name) return; onSortChange?.(f.name); onSelectField?.(f.name); }}
                      onDoubleClick={(e) => { e.stopPropagation(); onSelectField?.(f.name); setEditingHeader({ name: f.name, value: f.name }); }}
                      onContextMenu={() => { setCtxTarget({ type: 'header', fieldName: f.name }); onSelectField?.(f.name); }}
                      style={stickyTh(f.name)}
                    >
                      <div className="flex items-center gap-1 pr-2 overflow-hidden">
                        {editingHeader?.name === f.name ? (
                          <input
                            type="text"
                            autoFocus
                            value={editingHeader.value}
                            onChange={e => setEditingHeader({ name: f.name, value: e.target.value })}
                            onClick={e => e.stopPropagation()}
                            onDoubleClick={e => e.stopPropagation()}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const newName = editingHeader.value.trim();
                                if (newName && newName !== f.name) onRenameField?.(f.name, newName);
                                setEditingHeader(null);
                              } else if (e.key === 'Escape') {
                                setEditingHeader(null);
                              }
                            }}
                            onBlur={() => {
                              const newName = editingHeader.value.trim();
                              if (newName && newName !== f.name) onRenameField?.(f.name, newName);
                              setEditingHeader(null);
                            }}
                            className="w-full text-xs px-1 py-0.5 border border-[#C42B1C] outline-none bg-white text-gray-800"
                          />
                        ) : (
                          <span className="truncate">{f.name}</span>
                        )}
                        {sortState?.field === f.name && editingHeader?.name !== f.name && (
                          <span className="text-[#C42B1C] flex-none">
                            {sortState?.dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          </span>
                        )}
                      </div>
                      {/* Resize handle */}
                      <div
                        className="absolute top-0 right-0 w-2 h-full cursor-col-resize z-20 hover:bg-[#C42B1C]/30 group"
                        style={{ cursor: resizing?.field === f.name ? 'col-resize' : 'col-resize' }}
                        onMouseDown={e => {
                          e.stopPropagation();
                          e.preventDefault();
                          setResizing({ field: f.name, startX: e.clientX, startW: getColWidth(f.name, f.fieldType) });
                        }}
                      >
                        <div className="absolute right-0 top-1 bottom-1 w-0.5 bg-gray-300 group-hover:bg-[#C42B1C]" />
                      </div>
                    </th>
                  ))}
                  {/* Click to Add column */}
                  {onClickToAdd && (
                    <th
                      ref={clickToAddRef}
                      className="relative border-r border-b border-gray-300 px-2 py-1.5 font-medium text-[11px] select-none cursor-pointer bg-[#fffacc] hover:bg-[#fff5a0] transition-colors"
                      style={{ width: CLICK_TO_ADD_WIDTH, minWidth: CLICK_TO_ADD_WIDTH }}
                      onClick={e => { e.stopPropagation(); setClickToAddOpen(v => !v); }}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">Click to Add</span>
                        <ChevronDown size={11} className="text-gray-500 flex-none" />
                      </div>
                      {clickToAddOpen && (
                        <div
                          className="absolute top-full left-0 z-50 bg-white border border-gray-300 shadow-lg min-w-[190px] py-1"
                          style={{ boxShadow: '2px 4px 12px rgba(0,0,0,0.15)' }}
                          onClick={e => e.stopPropagation()}
                        >
                          {CLICK_TO_ADD_TYPES.map(t => (
                            <button
                              key={t.value}
                              className="w-full text-left px-4 py-1.5 text-xs text-gray-700 hover:bg-[#cce5ff] transition-colors"
                              onClick={() => {
                                setClickToAddOpen(false);
                                onClickToAdd(t.value);
                              }}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {records.map((r, rowIdx) => {
                  const isEditing = editingCell?.recordId === r.id;
                  const isFocused = focusedCell?.rowIdx === rowIdx;
                  const rowBg = selectedRowId === r.id ? '#fef2f2' /* red-50 */ : '#ffffff';
                  return (
                    <tr
                      key={r.id}
                      className={`group border-b border-gray-200 ${selectedRowId === r.id ? 'bg-red-50' : 'hover:bg-red-50/30'}`}
                      onClick={() => { onSelectRow(r.id); setFocusedCell(null); }}
                      style={{ background: rowBg, ...(rowHeightPx ? { height: rowHeightPx } : {}) }}
                    >
                      <td
                        className={`border-r border-gray-300 text-center cursor-pointer flex-none overflow-hidden ${selectedRowId === r.id ? 'bg-[#cce5ff]' : 'bg-[#f3f2f1] group-hover:bg-gray-100'}`}
                        style={{ width: 15, minWidth: 15, maxWidth: 15, height: rowHeightPx ?? 28, ...(hasFrozen ? { position: 'sticky', left: 0, zIndex: 5 } : {}) }}
                        onContextMenu={() => setCtxTarget({ type: 'row-selector', recordId: r.id, record: r })}
                      >
                        {isEditing
                          ? <Pencil className="w-3 h-3 text-gray-500 mx-auto" />
                          : selectedRowId === r.id
                            ? <span className="text-[#C42B1C] font-bold text-xs">▶</span>
                            : null
                        }
                      </td>
                      {fields.map((f, colIdx) => {
                        const isCellEditing = editingCell?.recordId === r.id && editingCell?.fieldName === f.name;
                        const editableColForCell = fields.filter(ef => ef.fieldType !== 'autonumber').findIndex(ef => ef.name === f.name);
                        const isCellFocused = f.fieldType !== 'autonumber' && focusedCell?.rowIdx === rowIdx && focusedCell.colIdx === editableColForCell;
                        const cellValue = r.data[f.name];
                        return (
                          <td
                            key={f.id}
                            tabIndex={0}
                            className={`border-r border-gray-200 overflow-hidden focus:outline-none
                              ${f.fieldType === 'autonumber' || f.fieldType === 'calculated' || f.fieldType === 'attachment' ? 'bg-gray-50 cursor-default' : f.fieldType === 'boolean' ? 'cursor-pointer' : 'cursor-text'}
                              ${isCellEditing ? 'p-0' : 'px-2'}
                              ${isCellFocused && !isCellEditing ? 'ring-1 ring-inset ring-[#C42B1C]' : ''}
                            `}
                            style={{ height: rowHeightPx ?? 28, ...stickyTd(f.name), ...cellStyle }}
                            onDoubleClick={() => {
                              if (f.fieldType !== 'autonumber' && f.fieldType !== 'calculated' && f.fieldType !== 'attachment' && f.fieldType !== 'boolean')
                                handleCellClick(r.id, f.name, cellValue, false, rowIdx, colIdx);
                            }}
                            onClick={() => {
                              onSelectRow(r.id);
                              if (f.fieldType !== 'autonumber' && f.fieldType !== 'calculated' && f.fieldType !== 'attachment') {
                                const editableFields = fields.filter(ef => ef.fieldType !== 'autonumber');
                                const editableColIdx = editableFields.findIndex(ef => ef.name === f.name);
                                setFocusedCell({ rowIdx, colIdx: editableColIdx });
                              }
                            }}
                            onContextMenu={() => setCtxTarget({ type: 'cell', recordId: r.id, fieldName: f.name, value: cellValue, isPrimaryKey: f.isPrimaryKey, record: r })}
                            onFocus={() => {
                              if (f.fieldType !== 'autonumber') {
                                const editableFields = fields.filter(ef => ef.fieldType !== 'autonumber');
                                const editableColIdx = editableFields.findIndex(ef => ef.name === f.name);
                                setFocusedCell({ rowIdx, colIdx: editableColIdx });
                              }
                            }}
                          >
                            {isCellEditing ? (
                              <div className="relative w-full h-full flex items-center">
                                {renderEditInput(f.fieldType, editingValue, setEditingValue,
                                  () => handleCellSave(r, f.name, editingValue),
                                  r, f.name, rowIdx, colIdx)}
                              </div>
                            ) : f.fieldType === 'boolean' ? (
                              <div className="flex items-center justify-center h-full">
                                <input type="checkbox" checked={!!cellValue}
                                  onChange={() => handleBooleanToggle(r, f.name)}
                                  className="w-4 h-4 accent-[#C42B1C] cursor-pointer" />
                              </div>
                            ) : f.fieldType === 'attachment' ? (
                              <div className="flex items-center gap-1 text-gray-400">
                                <Paperclip className="w-3.5 h-3.5" />
                                <span className="text-xs">{cellValue ? '1' : '0'}</span>
                              </div>
                            ) : f.fieldType === 'hyperlink' && cellValue ? (
                              <a
                                href={String(cellValue).startsWith('http') ? String(cellValue) : `https://${cellValue}`}
                                target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-0.5 text-[#C42B1C] underline underline-offset-1 truncate text-sm"
                              >
                                <span className="truncate">{String(cellValue)}</span>
                                <ExternalLink className="w-3 h-3 flex-none" />
                              </a>
                            ) : (
                              <span
                                className={`block truncate ${f.fieldType === 'autonumber' ? 'text-gray-400' : ''} ${f.fieldType === 'number' || f.fieldType === 'currency' || f.fieldType === 'autonumber' ? 'text-right' : ''}`}
                                style={cellStyle ?? { fontSize: 14 }}
                              >
                                {renderCellValue(f.fieldType, cellValue, f.name, r)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      {onClickToAdd && <td className="border-r border-gray-200 h-7" />}
                    </tr>
                  );
                })}

                {/* New Record Row */}
                <tr
                  ref={newRowTrRef}
                  className="border-b border-gray-200 bg-white"
                  onContextMenu={() => setCtxTarget({ type: 'new-row' })}
                  style={{ background: '#ffffff' }}
                >
                  <td
                    className="border-r border-gray-300 bg-[#f3f2f1] text-center overflow-hidden"
                    style={{ width: 15, minWidth: 15, maxWidth: 15, height: rowHeightPx ?? 28, ...(hasFrozen ? { position: 'sticky', left: 0, zIndex: 5 } : {}) }}
                  />
                  {fields.map(f => (
                    <td
                      key={f.id}
                      className="border-r border-gray-200 px-1"
                      style={{ height: rowHeightPx ?? 28, ...stickyTd(f.name) }}
                    >
                      {renderNewRowInput(f.fieldType, f.name, f.isPrimaryKey, f.defaultValue)}
                    </td>
                  ))}
                  {onClickToAdd && <td className="border-r border-gray-200" style={{ height: rowHeightPx ?? 28 }} />}
                </tr>

                {/* Placeholder "*" row — visual cue that another new record can be added */}
                {Object.values(newRowData).some(v => v !== '' && v !== null && v !== undefined) && (
                  <tr
                    className="border-b border-gray-200 bg-white cursor-text"
                    style={{ background: '#ffffff' }}
                    onClick={() => {
                      const firstEditable = newRowTrRef.current?.querySelector('input, select, textarea') as HTMLElement | null;
                      firstEditable?.focus();
                    }}
                  >
                    <td
                      className="border-r border-gray-300 bg-[#f3f2f1] text-center overflow-hidden text-gray-500"
                      style={{ width: 15, minWidth: 15, maxWidth: 15, height: rowHeightPx ?? 28, fontSize: 11, ...(hasFrozen ? { position: 'sticky', left: 0, zIndex: 5 } : {}) }}
                    >
                      *
                    </td>
                    {fields.map(f => (
                      <td
                        key={f.id}
                        className="border-r border-gray-200 px-1"
                        style={{ height: rowHeightPx ?? 28, ...stickyTd(f.name) }}
                      >
                        {f.fieldType === 'autonumber' ? (
                          <span className="block text-right text-xs italic text-gray-400 px-1">(New)</span>
                        ) : null}
                      </td>
                    ))}
                    {onClickToAdd && <td className="border-r border-gray-200" style={{ height: rowHeightPx ?? 28 }} />}
                  </tr>
                )}

                {/* Totals Row */}
                {showTotals && (
                  <tr className="border-t-2 border-gray-400 bg-[#f3f2f1] sticky bottom-0 z-[5]" style={{ background: '#f3f2f1' }}>
                    <td
                      className="border-r border-gray-300 text-center h-7 overflow-hidden bg-[#f3f2f1]"
                      style={{ width: 15, minWidth: 15, maxWidth: 15, ...(hasFrozen ? { position: 'sticky', left: 0, zIndex: 6 } : {}) }}
                    />
                    {fields.map(f => {
                      const fn = totalFns[f.name] ?? 'None';
                      const fnOptions = getFnOptionsForType(f.fieldType);
                      const total = computeTotal(f.name, fn);
                      return (
                        <td
                          key={f.id}
                          className="border-r border-gray-300 h-7 px-1 cursor-pointer"
                          onContextMenu={() => setCtxTarget({ type: 'totals', fieldName: f.name })}
                          onClick={() => setCtxTarget({ type: 'totals', fieldName: f.name })}
                          style={stickyTd(f.name)}
                        >
                          <div className="flex items-center justify-between gap-1 h-full">
                            <span className="text-xs font-semibold text-gray-700 truncate">
                              {fn !== 'None' && <span className="text-[10px] text-gray-400 mr-1">{fn}</span>}
                              {total}
                            </span>
                            <ChevronDown className="w-3 h-3 text-gray-400 flex-none" />
                          </div>
                        </td>
                      );
                    })}
                    {onClickToAdd && <td className="border-r border-gray-300 h-7 bg-[#f3f2f1]" />}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-64 text-sm">
          {/* ── HEADER context ── */}
          {ctxTarget?.type === 'header' && (
            <>
              <ContextMenuLabel className="text-xs text-gray-500 font-normal px-2 py-1">{ctxFieldName}</ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => {
                if (onSortAscending) onSortAscending(ctxFieldName!);
                else onSortChange?.(ctxFieldName!);
              }}>
                Sort A → Z <ContextMenuShortcut>↑</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => {
                if (onSortDescending) onSortDescending(ctxFieldName!);
                else { onSortChange?.(ctxFieldName!); onSortChange?.(ctxFieldName!); }
              }}>
                Sort Z → A <ContextMenuShortcut>↓</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              {ctxFieldName && renderTypeFilters(ctxFieldName)}
              <ContextMenuItem onClick={() => onApplyFilter?.({ type: 'isEmpty', field: ctxFieldName })}>
                Filter by Empty
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onApplyFilter?.({ type: 'isNotEmpty', field: ctxFieldName })}>
                Filter by Not Empty
              </ContextMenuItem>
              {activeFilter && (
                <ContextMenuItem onClick={onRemoveFilter}>Remove Filter / Sort</ContextMenuItem>
              )}
              <ContextMenuSeparator />
              <ContextMenuItem onClick={onFind}>
                Find… <ContextMenuShortcut>Ctrl+F</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => { if (ctxFieldName) onHideField?.(ctxFieldName); }}>
                Hide Field
              </ContextMenuItem>
              <ContextMenuItem onClick={() => {
                if (ctxFieldName) setColWidthDlg({ field: ctxFieldName, width: getColWidth(ctxFieldName, getFieldType(ctxFieldName)) });
              }}>
                Column Width…
              </ContextMenuItem>
              <ContextMenuItem onClick={() => setUnhideDlg(true)}>
                Unhide Columns…
              </ContextMenuItem>
              {onDeleteField && (() => {
                const isPK = allFieldsSorted.find(f => f.name === ctxFieldName)?.isPrimaryKey;
                return (
                  <>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      disabled={!!isPK}
                      className={isPK ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 focus:text-red-600 focus:bg-red-50'}
                      onClick={() => { if (ctxFieldName && !isPK) onDeleteField(ctxFieldName); }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete Column
                    </ContextMenuItem>
                  </>
                );
              })()}
            </>
          )}

          {/* ── CELL context ── */}
          {ctxTarget?.type === 'cell' && (
            <>
              <ContextMenuLabel className="text-xs text-gray-500 font-normal px-2 py-1">
                {ctxFieldName}: <span className="font-medium text-gray-700">{displayValue(ctxValue, ctxFieldName)}</span>
              </ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => copyToClipboard(displayValue(ctxValue, ctxFieldName))}>
                Copy <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
              </ContextMenuItem>
              {!ctxIsPK && (
                <ContextMenuItem onClick={() => {
                  const r = records.findIndex(rec => rec.id === ctxRecordId);
                  const c = fields.findIndex(f => f.name === ctxFieldName);
                  if (ctxRecordId && r >= 0 && c >= 0) handleCellClick(ctxRecordId, ctxFieldName!, ctxValue, false, r, c);
                }}>
                  Edit Cell <ContextMenuShortcut>F2</ContextMenuShortcut>
                </ContextMenuItem>
              )}
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => {
                if (onSortAscending) onSortAscending(ctxFieldName!);
                else onSortChange?.(ctxFieldName!);
              }}>
                Sort A → Z <ContextMenuShortcut>↑</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => {
                if (onSortDescending) onSortDescending(ctxFieldName!);
                else { onSortChange?.(ctxFieldName!); onSortChange?.(ctxFieldName!); }
              }}>
                Sort Z → A <ContextMenuShortcut>↓</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              {!ctxIsPK && ctxValue !== null && ctxValue !== undefined && ctxValue !== '' && (
                <>
                  <ContextMenuItem onClick={() => onFilterBySelection?.(ctxFieldName!, ctxValue)}>
                    Filter by Selection
                    <ContextMenuShortcut className="text-[10px] max-w-[80px] truncate">{displayValue(ctxValue, ctxFieldName)}</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onFilterExcluding?.(ctxFieldName!, ctxValue)}>
                    Filter Excluding
                    <ContextMenuShortcut className="text-[10px] max-w-[80px] truncate">≠ {displayValue(ctxValue, ctxFieldName)}</ContextMenuShortcut>
                  </ContextMenuItem>
                </>
              )}
              {!ctxIsPK && ctxFieldName && renderTypeFilters(ctxFieldName, ctxValue)}
              {activeFilter && (
                <ContextMenuItem onClick={onRemoveFilter}>Remove Filter</ContextMenuItem>
              )}
              <ContextMenuSeparator />
              <ContextMenuItem onClick={onFind}>
                Find… <ContextMenuShortcut>Ctrl+F</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => ctxRecordId && onDeleteRecord?.(ctxRecordId)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                Delete Record
              </ContextMenuItem>
            </>
          )}

          {/* ── ROW SELECTOR context ── */}
          {ctxTarget?.type === 'row-selector' && (
            <>
              <ContextMenuItem onClick={() => ctxRecordId && onNewRecordAfter?.(ctxRecordId)}>
                New Record
              </ContextMenuItem>
              <ContextMenuItem onClick={() => ctxRecordId && onDeleteRecord?.(ctxRecordId)}>
                Delete Record
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => ctxRecordId && onCutRecord?.(ctxRecordId)}>
                Cut
              </ContextMenuItem>
              <ContextMenuItem onClick={() => ctxRecordId && onCopyRecord?.(ctxRecordId)}>
                Copy
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onPasteRecord?.(ctxRecordId)}
                disabled={!canPaste}
              >
                Paste
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => onOpenRowHeight?.()}>
                Row Height…
              </ContextMenuItem>
            </>
          )}

          {/* ── NEW ROW context ── */}
          {ctxTarget?.type === 'new-row' && (
            <>
              <ContextMenuLabel className="text-xs text-gray-500 font-normal px-2 py-1">New Record</ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => setNewRowData({})}>Clear New Row</ContextMenuItem>
            </>
          )}

          {/* ── TOTALS context ── */}
          {ctxTarget?.type === 'totals' && ctxFieldName && (
            <>
              <ContextMenuLabel className="text-xs text-gray-500 font-normal px-2 py-1">
                Totals: {ctxFieldName}
              </ContextMenuLabel>
              <ContextMenuSeparator />
              {getFnOptionsForType(getFieldType(ctxFieldName)).map(fn => (
                <ContextMenuItem
                  key={fn}
                  onClick={() => onTotalFnChange?.(ctxFieldName, fn)}
                  className={(totalFns[ctxFieldName] ?? 'None') === fn ? 'font-semibold text-[#C42B1C]' : ''}
                >
                  {fn}
                  {(totalFns[ctxFieldName] ?? 'None') === fn && <ContextMenuShortcut>✓</ContextMenuShortcut>}
                </ContextMenuItem>
              ))}
            </>
          )}

          {/* ── fallback ── */}
          {ctxTarget === null && (
            <>
              <ContextMenuItem onClick={onFind}>Find… <ContextMenuShortcut>Ctrl+F</ContextMenuShortcut></ContextMenuItem>
              {activeFilter && <ContextMenuItem onClick={onRemoveFilter}>Remove Filter</ContextMenuItem>}
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}
