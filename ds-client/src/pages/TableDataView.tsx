import React, { useState, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  Database, Table as TableType,
  useGetTable, useListRecords, useDeleteRecord, useUpdateTable,
  getListRecordsQueryKey, getGetTableQueryKey, getListTablesQueryKey, UpdateFieldRequest
} from '@/api';
import { Shell } from '@/components/layout/Shell';
import { Sidebar } from '@/components/layout/Sidebar';
import { Ribbon, RibbonGroup, RibbonButton, RibbonDropdownButton, RibbonContextSection } from '@/components/layout/Ribbon';
import { CreateTabContent, ExternalDataTabContent, DatabaseToolsTabContent } from '@/components/layout/AccessRibbonTabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataGrid } from '@/components/ui/data-grid';
import { DesignViewIcon } from '@/components/ui/design-view-icon';
import {
  Grid3X3, Trash2, RefreshCw, SortAsc, SortDesc, Search,
  Download, Filter, FilterX, ChevronFirst, ChevronLast, ChevronLeft,
  ChevronRight as ChevronRightIcon, Copy, Scissors, ClipboardPaste,
  PlusCircle, Save, Sigma, CheckSquare, AlignLeft, ChevronDown, EyeOff, RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ItemRow { id: number; name: string; databaseId: number; }

interface Props {
  databaseId: number;
  tableId: number;
  db: Database;
  tables: TableType[];
  onDeleteTable?: (id: number) => void;
  isStudentMode?: boolean;
  onSelectTable?: (id: number) => void;
  queries?: ItemRow[];
  forms?: ItemRow[];
  reports?: ItemRow[];
  onSelectQuery?: (id: number) => void;
  onDeleteQuery?: (id: number) => void;
  onDeleteForm?: (id: number) => void;
  onDeleteReport?: (id: number) => void;
  onRefresh?: () => void;
  onCreateTable?: () => void;
  onCreateQuery?: () => void;
  onQueryWizard?: () => void;
  onCreateForm?: () => void;
  onCreateBlankForm?: () => void;
  onCreateAutoForm?: () => void;
  onCreateReport?: () => void;
  onCreateBlankReport?: () => void;
  onCreateAutoReport?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  onImportCSV?: () => void;
  onExportData?: () => void;
  onOpenRelationships?: () => void;
  onCompact?: () => void;
  onAnalyse?: () => void;
  onDocumenter?: () => void;
  onObjectDependencies?: () => void;
  onReset?: () => void;
  onSwitchToDesign?: () => void;
}

type FieldFilter =
  | { type: 'search'; text: string }
  | { type: 'eq'; field: string; value: any }
  | { type: 'ne'; field: string; value: any }
  | { type: 'lt'; field: string; value: any }
  | { type: 'lte'; field: string; value: any }
  | { type: 'gt'; field: string; value: any }
  | { type: 'gte'; field: string; value: any }
  | { type: 'between'; field: string; lo: any; hi: any }
  | { type: 'startsWith'; field: string; value: string }
  | { type: 'notStartsWith'; field: string; value: string }
  | { type: 'endsWith'; field: string; value: string }
  | { type: 'notEndsWith'; field: string; value: string }
  | { type: 'contains'; field: string; value: string }
  | { type: 'notContains'; field: string; value: string }
  | { type: 'isEmpty'; field: string }
  | { type: 'isNotEmpty'; field: string }
  | null;

type FieldOpDialog = 'rename' | 'defaultValue' | 'fieldSize' | 'addMore' | null;

export function TableDataView({
  databaseId, tableId, db, tables, onDeleteTable, isStudentMode,
  onSelectTable, queries = [], forms = [], reports = [], onSelectQuery, onDeleteQuery, onDeleteForm, onDeleteReport,
  onRefresh,
  onCreateTable, onCreateQuery, onQueryWizard,
  onCreateForm, onCreateBlankForm, onCreateAutoForm,
  onCreateReport, onCreateBlankReport, onCreateAutoReport,
  onShare, onSettings,
  onImportCSV, onExportData, onOpenRelationships, onCompact, onAnalyse, onDocumenter, onObjectDependencies,
  onReset, onSwitchToDesign,
}: Props) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const focusNewRowRef = useRef<(() => void) | null>(null);

  const [sortState, setSortState] = useState<{ field: string; dir: 'asc' | 'desc' } | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [selectedFieldName, setSelectedFieldName] = useState<string | null>(null);
  const [fieldFilter, setFieldFilter] = useState<FieldFilter>(null);
  const [findOpen, setFindOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100);
  const [deleteRecordConfirm, setDeleteRecordConfirm] = useState(false);
  const [deleteFieldConfirm, setDeleteFieldConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  const [showTotals, setShowTotals] = useState(false);
  const [totalFns, setTotalFns] = useState<Record<string, 'None' | 'Count' | 'Sum' | 'Average' | 'Minimum' | 'Maximum'>>({});
  const [jumpRecordInput, setJumpRecordInput] = useState('');
  const jumpInputRef = useRef<HTMLInputElement>(null);

  // Field operation dialogs
  const [fieldOpDialog, setFieldOpDialog] = useState<FieldOpDialog>(null);
  const [fieldOpName, setFieldOpName] = useState('');
  const [fieldOpCaption, setFieldOpCaption] = useState('');
  const [fieldOpValue, setFieldOpValue] = useState('');
  const [fieldOpSize, setFieldOpSize] = useState('');
  const [addMoreType, setAddMoreType] = useState<string>('text');

  // Filter menu state
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterInputState, setFilterInputState] = useState<{ op: string; label: string; fieldType: string; val: string; val2: string } | null>(null);

  const { data: table, isLoading: tableLoading } = useGetTable(databaseId, tableId);
  const { data: allRecords, isLoading: recordsLoading } = useListRecords(databaseId, tableId, {});
  const deleteRecord = useDeleteRecord();
  const updateTable = useUpdateTable();

  const fields = useMemo(() => {
    if (!table) return [];
    return [...table.fields].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [table]);

  const selectedField = useMemo(() =>
    fields.find(f => f.name === selectedFieldName) ?? null
  , [fields, selectedFieldName]);

  const sortedRecords = useMemo(() => {
    const recs = allRecords || [];
    if (!sortState) return recs;
    return [...recs].sort((a, b) => {
      const av = a.data[sortState.field];
      const bv = b.data[sortState.field];
      const cmp = av == null ? -1 : bv == null ? 1 : av < bv ? -1 : av > bv ? 1 : 0;
      return sortState.dir === 'asc' ? cmp : -cmp;
    });
  }, [allRecords, sortState]);

  const filteredRecords = useMemo(() => {
    if (!fieldFilter) return sortedRecords;
    const f = fieldFilter;
    if (f.type === 'search') {
      const q = f.text.toLowerCase();
      return sortedRecords.filter(r => Object.values(r.data).some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    const strVal = (r: any) => String(r.data[f.field] ?? '');
    const numVal = (r: any) => Number(r.data[f.field]);
    const raw = (r: any) => r.data[(f as any).field];
    if (f.type === 'eq') return sortedRecords.filter(r => String(raw(r) ?? '') === String(f.value ?? ''));
    if (f.type === 'ne') return sortedRecords.filter(r => String(raw(r) ?? '') !== String(f.value ?? ''));
    if (f.type === 'lt') return sortedRecords.filter(r => numVal(r) < Number(f.value));
    if (f.type === 'lte') return sortedRecords.filter(r => numVal(r) <= Number(f.value));
    if (f.type === 'gt') return sortedRecords.filter(r => numVal(r) > Number(f.value));
    if (f.type === 'gte') return sortedRecords.filter(r => numVal(r) >= Number(f.value));
    if (f.type === 'between') return sortedRecords.filter(r => { const n = numVal(r); return n >= Number(f.lo) && n <= Number(f.hi); });
    if (f.type === 'startsWith') return sortedRecords.filter(r => strVal(r).toLowerCase().startsWith(f.value.toLowerCase()));
    if (f.type === 'notStartsWith') return sortedRecords.filter(r => !strVal(r).toLowerCase().startsWith(f.value.toLowerCase()));
    if (f.type === 'endsWith') return sortedRecords.filter(r => strVal(r).toLowerCase().endsWith(f.value.toLowerCase()));
    if (f.type === 'notEndsWith') return sortedRecords.filter(r => !strVal(r).toLowerCase().endsWith(f.value.toLowerCase()));
    if (f.type === 'contains') return sortedRecords.filter(r => strVal(r).toLowerCase().includes(f.value.toLowerCase()));
    if (f.type === 'notContains') return sortedRecords.filter(r => !strVal(r).toLowerCase().includes(f.value.toLowerCase()));
    if (f.type === 'isEmpty') return sortedRecords.filter(r => { const v = raw(r); return v === null || v === undefined || v === ''; });
    if (f.type === 'isNotEmpty') return sortedRecords.filter(r => { const v = raw(r); return v !== null && v !== undefined && v !== ''; });
    return sortedRecords;
  }, [sortedRecords, fieldFilter]);

  const totalRecords = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const pagedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSortChange = (field: string) => {
    setSortState(prev => {
      if (!prev || prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc') return { field, dir: 'desc' };
      return null;
    });
  };

  const handleSortAscending = (field: string) => setSortState({ field, dir: 'asc' });
  const handleSortDescending = (field: string) => setSortState({ field, dir: 'desc' });

  const handleHideField = (fieldName: string) => {
    if (fieldName.startsWith('__unhide__')) {
      const actualName = fieldName.slice('__unhide__'.length);
      setHiddenFields(prev => prev.filter(f => f !== actualName));
    } else {
      setHiddenFields(prev => [...prev.filter(f => f !== fieldName), fieldName]);
    }
  };

  const handleTotalFnChange = (field: string, fn: 'None' | 'Count' | 'Sum' | 'Average' | 'Minimum' | 'Maximum') => {
    setTotalFns(prev => ({ ...prev, [field]: fn }));
  };

  const handleJumpToRecord = () => {
    const n = parseInt(jumpRecordInput, 10);
    if (isNaN(n) || n < 1) return;
    const page = Math.ceil(n / pageSize);
    setCurrentPage(Math.min(totalPages, Math.max(1, page)));
    setJumpRecordInput('');
  };

  const handleDeleteById = (id: number) => {
    setPendingDeleteId(id);
    setDeleteRecordConfirm(true);
  };

  const doDeleteRecord = async () => {
    const id = pendingDeleteId || selectedRowId;
    if (!id) return;
    try {
      await deleteRecord.mutateAsync({ databaseId, tableId, recordId: id });
      setSelectedRowId(null);
      setPendingDeleteId(null);
      queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey(databaseId, tableId) });
    } catch {
      toast({ title: 'Failed to delete record', variant: 'destructive' });
    }
  };

  const handleDeleteSelectedRecord = () => {
    if (!selectedRowId) return;
    setPendingDeleteId(selectedRowId);
    setDeleteRecordConfirm(true);
  };

  const saveFields = async (newFields: UpdateFieldRequest[]) => {
    if (!table) return;
    try {
      await updateTable.mutateAsync({ databaseId, tableId, data: { name: table.name, fields: newFields } });
      queryClient.invalidateQueries({ queryKey: getGetTableQueryKey(databaseId, tableId) });
      queryClient.invalidateQueries({ queryKey: getListTablesQueryKey(databaseId) });
    } catch {
      toast({ title: 'Failed to update table', variant: 'destructive' });
    }
  };

  const handleAddField = async (type: string) => {
    if (!table) return;
    const baseName = type === 'text' ? 'Field' : type === 'number' ? 'Number' : type === 'boolean' ? 'YesNo' : type === 'date' ? 'Date' : 'Field';
    const existing = fields.map(f => f.name);
    let name = baseName;
    let i = 1;
    while (existing.includes(name)) { name = `${baseName}${i++}`; }
    const newFields: UpdateFieldRequest[] = [
      ...fields.map(f => ({ ...f, id: f.id })),
      { name, fieldType: type as any, isRequired: false, isPrimaryKey: false, sortOrder: fields.length, caption: null, defaultValue: null, fieldSize: null, description: null }
    ];
    await saveFields(newFields);
    setSelectedFieldName(name);
    toast({ title: `Field "${name}" added` });
  };

  const doDeleteField = async () => {
    if (!selectedField || selectedField.isPrimaryKey) return;
    const newFields = fields
      .filter(f => f.name !== selectedFieldName)
      .map((f, i) => ({ ...f, sortOrder: i }));
    await saveFields(newFields);
    setSelectedFieldName(null);
    toast({ title: `Field "${selectedFieldName}" deleted` });
  };

  const doRenameField = async () => {
    if (!selectedField) return;
    const newName = fieldOpName.trim();
    const newCaption = fieldOpCaption.trim() || null;
    if (!newName) return toast({ title: 'Field name cannot be empty', variant: 'destructive' });
    const newFields = fields.map(f =>
      f.name === selectedFieldName ? { ...f, name: newName, caption: newCaption } : f
    );
    await saveFields(newFields);
    setSelectedFieldName(newName);
    setFieldOpDialog(null);
    toast({ title: 'Field renamed' });
  };

  const doSetDefaultValue = async () => {
    if (!selectedField) return;
    const val = fieldOpValue.trim() || null;
    const newFields = fields.map(f =>
      f.name === selectedFieldName ? { ...f, defaultValue: val } : f
    );
    await saveFields(newFields);
    setFieldOpDialog(null);
    toast({ title: 'Default value updated' });
  };

  const doSetFieldSize = async () => {
    if (!selectedField) return;
    const size = fieldOpSize ? parseInt(fieldOpSize) : null;
    if (size !== null && (isNaN(size) || size < 1 || size > 255)) {
      return toast({ title: 'Field size must be 1–255', variant: 'destructive' });
    }
    const newFields = fields.map(f =>
      f.name === selectedFieldName ? { ...f, fieldSize: size } : f
    );
    await saveFields(newFields);
    setFieldOpDialog(null);
    toast({ title: 'Field size updated' });
  };

  const doAddMoreField = async () => {
    await handleAddField(addMoreType);
    setFieldOpDialog(null);
  };

  const openRenameDialog = () => {
    if (!selectedField) return;
    setFieldOpName(selectedField.name);
    setFieldOpCaption(selectedField.caption ?? '');
    setFieldOpDialog('rename');
  };

  const openDefaultValueDialog = () => {
    if (!selectedField) return;
    setFieldOpValue(selectedField.defaultValue ?? '');
    setFieldOpDialog('defaultValue');
  };

  const openFieldSizeDialog = () => {
    if (!selectedField) return;
    setFieldOpSize(selectedField.fieldSize ? String(selectedField.fieldSize) : '');
    setFieldOpDialog('fieldSize');
  };

  const handleFilterBySelection = (fieldName: string, value: any) => {
    setFieldFilter({ type: 'eq', field: fieldName, value });
    setCurrentPage(1);
  };

  const handleFilterExcluding = (fieldName: string, value: any) => {
    setFieldFilter({ type: 'ne', field: fieldName, value });
    setCurrentPage(1);
  };

  const handleRemoveFilter = () => {
    setFieldFilter(null);
    setSortState(null);
    setCurrentPage(1);
  };

  const openFilterInput = (op: string, label: string) => {
    const ft = selectedField?.fieldType ?? 'text';
    setFilterMenuOpen(false);
    setFilterInputState({ op, label, fieldType: ft, val: '', val2: '' });
  };

  const applyFilterInput = () => {
    if (!filterInputState || !selectedFieldName) return;
    const { op, fieldType, val, val2 } = filterInputState;
    const coerce = (v: string) => (fieldType === 'number' || fieldType === 'currency') ? Number(v) : v;
    let filter: FieldFilter = null;
    if (op === 'eq') filter = { type: 'eq', field: selectedFieldName, value: coerce(val) };
    else if (op === 'ne') filter = { type: 'ne', field: selectedFieldName, value: coerce(val) };
    else if (op === 'lt') filter = { type: 'lt', field: selectedFieldName, value: coerce(val) };
    else if (op === 'lte') filter = { type: 'lte', field: selectedFieldName, value: coerce(val) };
    else if (op === 'gt') filter = { type: 'gt', field: selectedFieldName, value: coerce(val) };
    else if (op === 'gte') filter = { type: 'gte', field: selectedFieldName, value: coerce(val) };
    else if (op === 'between') filter = { type: 'between', field: selectedFieldName, lo: coerce(val), hi: coerce(val2) };
    else if (op === 'startsWith') filter = { type: 'startsWith', field: selectedFieldName, value: val };
    else if (op === 'notStartsWith') filter = { type: 'notStartsWith', field: selectedFieldName, value: val };
    else if (op === 'endsWith') filter = { type: 'endsWith', field: selectedFieldName, value: val };
    else if (op === 'notEndsWith') filter = { type: 'notEndsWith', field: selectedFieldName, value: val };
    else if (op === 'contains') filter = { type: 'contains', field: selectedFieldName, value: val };
    else if (op === 'notContains') filter = { type: 'notContains', field: selectedFieldName, value: val };
    if (filter) { handleApplyFilter(filter); setFilterInputState(null); }
  };

  const handleExportCSV = () => {
    if (!table || !filteredRecords.length) return;
    const flds = [...table.fields].sort((a, b) => a.sortOrder - b.sortOrder);
    const header = flds.map(f => f.name).join(',');
    const rows = filteredRecords.map(r =>
      flds.map(f => {
        const v = r.data[f.name];
        if (v === null || v === undefined) return '';
        const s = String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${table?.name || 'export'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const refreshData = () => queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey(databaseId, tableId) });

  const handleApplyFilter = (filter: FieldFilter) => {
    setFieldFilter(filter);
    setCurrentPage(1);
  };

  const filterLabel = (() => {
    if (!fieldFilter) return null;
    const f = fieldFilter;
    if (f.type === 'search') return `Search: "${f.text}"`;
    if (f.type === 'eq') return `${f.field} = "${f.value}"`;
    if (f.type === 'ne') return `${f.field} ≠ "${f.value}"`;
    if (f.type === 'lt') return `${f.field} < ${f.value}`;
    if (f.type === 'lte') return `${f.field} ≤ ${f.value}`;
    if (f.type === 'gt') return `${f.field} > ${f.value}`;
    if (f.type === 'gte') return `${f.field} ≥ ${f.value}`;
    if (f.type === 'between') return `${f.field} between ${f.lo} and ${f.hi}`;
    if (f.type === 'startsWith') return `${f.field} begins with "${f.value}"`;
    if (f.type === 'notStartsWith') return `${f.field} doesn't begin with "${f.value}"`;
    if (f.type === 'endsWith') return `${f.field} ends with "${f.value}"`;
    if (f.type === 'notEndsWith') return `${f.field} doesn't end with "${f.value}"`;
    if (f.type === 'contains') return `${f.field} contains "${f.value}"`;
    if (f.type === 'notContains') return `${f.field} doesn't contain "${f.value}"`;
    if (f.type === 'isEmpty') return `${f.field} is empty`;
    if (f.type === 'isNotEmpty') return `${f.field} is not empty`;
    return null;
  })();

  const canDeleteField = !!selectedField && !selectedField.isPrimaryKey && !isStudentMode;
  const canEditFieldProps = !!selectedField && !isStudentMode;
  const canSetFieldSize = canEditFieldProps && selectedField?.fieldType === 'text';

  const commonTabProps = {
    onCreateTable: onCreateTable || (() => {}),
    onCreateQuery: onCreateQuery || (() => {}),
    onQueryWizard,
    onCreateForm,
    onCreateBlankForm,
    onCreateAutoForm,
    onCreateReport,
    onCreateBlankReport,
    onCreateAutoReport,
    onImportCSV,
    onExportData,
    onShare,
    onSettings,
    onOpenRelationships,
    onCompact,
    onAnalyse,
    onDocumenter,
    onObjectDependencies,
  };

  const contextSection: RibbonContextSection | undefined = isStudentMode ? undefined : {
    color: '#c55a11',
    defaultTab: 'Table Fields',
    tabs: [
      {
        name: 'Table Fields',
        content: (
          <>
            <RibbonGroup name="Add &amp; Delete">
              <RibbonButton icon={<AlignLeft size={22} />} label="Short Text" onClick={() => handleAddField('text')} />
              <RibbonButton icon={<Sigma size={22} />} label="Number" onClick={() => handleAddField('number')} />
              <RibbonButton icon={<CheckSquare size={22} />} label="Yes/No" onClick={() => handleAddField('boolean')} />
              <RibbonButton icon={<ChevronDown size={22} />} label="More Fields" onClick={() => setFieldOpDialog('addMore')} />
              <RibbonButton icon={<Trash2 size={22} />} label="Delete" onClick={() => setDeleteFieldConfirm(true)} disabled={!canDeleteField} />
            </RibbonGroup>
            <RibbonGroup name="Properties">
              <RibbonButton icon={<AlignLeft size={22} />} label="Name &amp; Caption" onClick={openRenameDialog} disabled={!canEditFieldProps} />
              <RibbonButton icon={<AlignLeft size={22} />} label="Default Value" onClick={openDefaultValueDialog} disabled={!canEditFieldProps || selectedField?.fieldType === 'autonumber'} />
              <RibbonButton icon={<AlignLeft size={22} />} label="Field Size" onClick={openFieldSizeDialog} disabled={!canSetFieldSize} />
            </RibbonGroup>
          </>
        )
      }
    ]
  };

  const ribbon = (
    <Ribbon
      title={db.name}
      homeLink={isStudentMode ? undefined : `/databases/${databaseId}`}
      allDatabasesLink={isStudentMode ? undefined : '/'}
      contextSection={isStudentMode ? undefined : contextSection}
      pinnedContent={
        <>
          <RibbonGroup name="View">
            <RibbonDropdownButton icon={<Grid3X3 size={22} />} label="Datasheet">
              <RibbonButton icon={<Grid3X3 size={22} />} label="Datasheet" active />
              <RibbonButton icon={<DesignViewIcon size={22} />} label="Design" onClick={() => onSwitchToDesign ? onSwitchToDesign() : setLocation(`/databases/${databaseId}/tables/${tableId}/design`)} />
            </RibbonDropdownButton>
          </RibbonGroup>
          {onReset && (
            <RibbonGroup name="Sandbox">
              <RibbonButton icon={<RotateCcw size={22} />} label="Reset" onClick={() => setResetConfirm(true)} />
            </RibbonGroup>
          )}
        </>
      }
      tabs={[
        {
          name: 'Home',
          content: (
            <>
              <RibbonGroup name="Clipboard">
                <RibbonDropdownButton icon={<ClipboardPaste size={22} />} label="Clipboard">
                  <RibbonButton icon={<ClipboardPaste size={22} />} label="Paste" disabled />
                  <RibbonButton icon={<Scissors size={22} />} label="Cut" disabled />
                  <RibbonButton icon={<Copy size={22} />} label="Copy" disabled />
                </RibbonDropdownButton>
              </RibbonGroup>
              <RibbonGroup name="Sort &amp; Filter">
                <RibbonButton icon={<Filter size={22} />} label="Filter"
                  active={!!fieldFilter || filterMenuOpen}
                  onClick={() => { if (fieldFilter) { setFieldFilter(null); setCurrentPage(1); } else if (filterMenuOpen) { setFilterMenuOpen(false); } else if (selectedFieldName) { setFilterMenuOpen(true); } }}
                  disabled={!fieldFilter && !selectedFieldName} />
                <div className="flex flex-col justify-start gap-0 h-full pt-0.5">
                  <RibbonButton size="small" icon={<SortAsc size={14} />} label="Ascending"
                    onClick={() => { const f = selectedFieldName || sortState?.field; if (f) setSortState({ field: f, dir: 'asc' }); }}
                    active={sortState?.dir === 'asc'}
                    disabled={!selectedFieldName && !sortState} />
                  <RibbonButton size="small" icon={<SortDesc size={14} />} label="Descending"
                    onClick={() => { const f = selectedFieldName || sortState?.field; if (f) setSortState({ field: f, dir: 'desc' }); }}
                    active={sortState?.dir === 'desc'}
                    disabled={!selectedFieldName && !sortState} />
                  <RibbonButton size="small" icon={<FilterX size={14} />} label="Remove Sort"
                    onClick={() => setSortState(null)}
                    disabled={!sortState} />
                </div>
                <div className="flex flex-col justify-start gap-0 h-full pt-0.5">
                  <RibbonButton size="small" icon={<CheckSquare size={14} />} label="Selection"
                    onClick={() => { if (selectedFieldName && selectedRowId) { const rec = filteredRecords.find(r => r.id === selectedRowId); if (rec) handleFilterBySelection(selectedFieldName, rec.data[selectedFieldName]); } }}
                    disabled={!selectedFieldName || !selectedRowId} />
                  <RibbonButton size="small" icon={<AlignLeft size={14} />} label="Advanced"
                    disabled />
                  <RibbonButton size="small" icon={<Filter size={14} />} label="Toggle Filter"
                    active={!!fieldFilter}
                    onClick={() => { setFieldFilter(null); setCurrentPage(1); }}
                    disabled={!fieldFilter} />
                </div>
              </RibbonGroup>
              <RibbonGroup name="Records">
                <RibbonButton icon={<PlusCircle size={22} />} label="New" onClick={() => focusNewRowRef.current?.()} />
                <RibbonButton icon={<Trash2 size={22} />} label="Delete" onClick={handleDeleteSelectedRecord} disabled={!selectedRowId || deleteRecord.isPending} />
                <RibbonDropdownButton icon={<RefreshCw size={22} />} label="More">
                  <RibbonButton icon={<Save size={22} />} label="Save" disabled />
                  <RibbonButton icon={<RefreshCw size={22} />} label="Refresh All" onClick={refreshData} />
                  <RibbonButton icon={<Sigma size={22} />} label="Totals" active={showTotals} onClick={() => setShowTotals(v => !v)} />
                  {hiddenFields.length > 0 && (
                    <RibbonButton icon={<EyeOff size={22} />} label={`Show ${hiddenFields.length} Hidden`}
                      onClick={() => setHiddenFields([])} title="Click to show all hidden fields" />
                  )}
                </RibbonDropdownButton>
              </RibbonGroup>
              <RibbonGroup name="Find">
                <RibbonButton icon={<Search size={22} />} label="Find" onClick={() => setFindOpen(true)} />
              </RibbonGroup>
              <RibbonGroup name="Export">
                <RibbonButton icon={<Download size={22} />} label="Export CSV" onClick={handleExportCSV} />
              </RibbonGroup>
            </>
          )
        },
        { name: 'Create', content: <CreateTabContent {...commonTabProps} /> },
        { name: 'External Data', content: <ExternalDataTabContent {...commonTabProps} /> },
        { name: 'Database Tools', content: <DatabaseToolsTabContent {...commonTabProps} /> },
      ]}
    />
  );

  if (tableLoading) return <Shell title={db.name} ribbon={ribbon} isEmbed={isStudentMode}>Loading...</Shell>;
  if (!table) return <Shell title={db.name} ribbon={ribbon} isEmbed={isStudentMode}>Table not found</Shell>;

  const statusBar = (
    <div className="flex items-center gap-3 w-full">
      <span className="text-gray-500 font-medium">Datasheet View</span>
      {fieldFilter && (
        <>
          <span className="w-px h-3 bg-gray-300" />
          <span className="text-[#c55a11]">Filtered</span>
        </>
      )}
      {sortState && (
        <>
          <span className="w-px h-3 bg-gray-300" />
          <span className="text-gray-400">Sorted: {sortState.field} {sortState.dir === 'asc' ? '↑' : '↓'}</span>
        </>
      )}
      {hiddenFields.length > 0 && (
        <>
          <span className="w-px h-3 bg-gray-300" />
          <span className="text-gray-400">{hiddenFields.length} field{hiddenFields.length !== 1 ? 's' : ''} hidden</span>
        </>
      )}
      <span className="flex-1" />
      <div className="flex items-center gap-1">
        <button title="Datasheet View" className="w-5 h-4 flex items-center justify-center bg-white border border-gray-400 rounded-sm text-[#C42B1C]">
          <Grid3X3 className="w-3 h-3" />
        </button>
        <button
          title="Design View"
          onClick={() => onSwitchToDesign ? onSwitchToDesign() : setLocation(`/databases/${databaseId}/tables/${tableId}/design`)}
          className="w-5 h-4 flex items-center justify-center hover:bg-gray-200 border border-transparent rounded-sm text-gray-500"
        >
          <DesignViewIcon size={12} />
        </button>
      </div>
    </div>
  );

  return (
    <Shell
      title={db.name}
      ribbon={ribbon}
      isEmbed={isStudentMode}
      statusBar={statusBar}
      sidebar={
        <Sidebar
          tables={tables}
          databaseId={databaseId}
          onDeleteTable={onDeleteTable}
          isStudentMode={isStudentMode}
          activeTableId={tableId}
          onSelectTable={onSelectTable}
          queries={queries}
          onSelectQuery={onSelectQuery}
          onDeleteQuery={onDeleteQuery}
          forms={forms}
          onDeleteForm={onDeleteForm}
          reports={reports}
          onDeleteReport={onDeleteReport}
          onRefresh={onRefresh}
        />
      }
    >
      <div className="flex flex-col h-full bg-white relative">
        {/* Document tab bar */}
        <div className="flex items-center h-7 bg-[#f3f2f1] border-b border-gray-300 px-2 shadow-sm z-10 flex-none gap-2">
          <span className="font-semibold text-gray-600 text-sm px-2 border-b-2 border-[#c55a11] pb-0.5">{table.name}</span>
          <span className="flex-1" />
          {selectedFieldName && !isStudentMode && (
            <div className="text-xs text-gray-500 bg-[#cce5ff] px-2 py-0.5 rounded border border-red-300 select-none">
              Field: <span className="font-semibold text-gray-700">{selectedFieldName}</span>
              {selectedField?.fieldType && (
                <span className="ml-1 text-gray-400">
                  ({({'text':'Short Text','longtext':'Long Text','number':'Number','currency':'Currency','date':'Date/Time','boolean':'Yes/No','autonumber':'AutoNumber','hyperlink':'Hyperlink','attachment':'Attachment','calculated':'Calculated','lookup':'Lookup'} as Record<string,string>)[selectedField.fieldType] ?? selectedField.fieldType})
                </span>
              )}
            </div>
          )}
          {filterLabel && (
            <div className="flex items-center gap-1 text-xs text-[#c55a11]">
              <Filter size={11} />
              <span className="font-medium">{filterLabel}</span>
              <button onClick={handleRemoveFilter} className="ml-1 text-gray-400 hover:text-red-500 p-0.5 rounded" title="Remove filter">
                <FilterX size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden bg-white">
          {recordsLoading ? (
            <div className="p-4 text-gray-500 text-sm">Loading records...</div>
          ) : (
            <DataGrid
              table={table}
              records={pagedRecords}
              allRecords={filteredRecords}
              databaseId={databaseId}
              focusNewRowRef={focusNewRowRef}
              sortState={sortState}
              onSortChange={handleSortChange}
              onSortAscending={handleSortAscending}
              onSortDescending={handleSortDescending}
              selectedRowId={selectedRowId}
              onSelectRow={setSelectedRowId}
              selectedFieldName={selectedFieldName}
              onSelectField={setSelectedFieldName}
              onFilterBySelection={handleFilterBySelection}
              onFilterExcluding={handleFilterExcluding}
              onRemoveFilter={handleRemoveFilter}
              onApplyFilter={handleApplyFilter}
              onFind={() => setFindOpen(true)}
              onDeleteRecord={handleDeleteById}
              activeFilter={filterLabel || undefined}
              hiddenFields={hiddenFields}
              onHideField={handleHideField}
              onDeleteField={(fieldName) => { setSelectedFieldName(fieldName); setDeleteFieldConfirm(true); }}
              showTotals={showTotals}
              totalFns={totalFns}
              onTotalFnChange={handleTotalFnChange}
            />
          )}
        </div>

        {/* Access-style record navigation bar */}
        <div className="h-7 bg-[#f3f2f1] border-t border-gray-300 flex items-center px-2 text-xs text-gray-600 flex-none gap-0.5 select-none">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage <= 1} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" title="First Record">
            <ChevronFirst size={14} />
          </button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Previous Record">
            <ChevronLeft size={14} />
          </button>
          <div className="flex items-center gap-1 px-2 border-x border-gray-300 mx-1">
            <span className="text-gray-500">Record</span>
            <input
              ref={jumpInputRef}
              type="text"
              value={jumpRecordInput || String(totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1)}
              title="Click to jump to a record number"
              onFocus={e => { setJumpRecordInput(String((currentPage - 1) * pageSize + 1)); e.target.select(); }}
              onChange={e => setJumpRecordInput(e.target.value)}
              onBlur={() => { if (jumpRecordInput) handleJumpToRecord(); setJumpRecordInput(''); }}
              onKeyDown={e => { if (e.key === 'Enter') { handleJumpToRecord(); jumpInputRef.current?.blur(); } if (e.key === 'Escape') { setJumpRecordInput(''); jumpInputRef.current?.blur(); } }}
              className="font-semibold text-gray-700 text-center bg-white border border-gray-300 rounded px-1 focus:border-[#C42B1C] focus:outline-none cursor-pointer hover:border-gray-400"
              style={{ width: Math.max(28, String(totalRecords).length * 8 + 8) }}
            />
            <span className="text-gray-400">of</span>
            <span className="font-semibold text-gray-700">{totalRecords}</span>
            {fieldFilter && <span className="text-[#c55a11] font-medium ml-1">(filtered)</span>}
          </div>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Next Record">
            <ChevronRightIcon size={14} />
          </button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Last Record">
            <ChevronLast size={14} />
          </button>
          <button
            onClick={() => {}}
            className="p-0.5 rounded hover:bg-gray-200 ml-0.5 text-[#C42B1C] font-bold text-sm leading-none"
            title="New (blank) Record"
          >
            *
          </button>
          <div className="w-px h-4 bg-gray-300 mx-2" />
          <span className={fieldFilter ? 'text-[#c55a11] font-medium' : 'text-gray-400'}>
            {fieldFilter ? 'Filtered' : 'No Filter'}
          </span>
          <div className="w-px h-4 bg-gray-300 mx-2" />
          <input
            type="text"
            placeholder="Search…"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const q = (e.target as HTMLInputElement).value.trim();
                if (q) { handleApplyFilter({ type: 'search', text: q } as any); (e.target as HTMLInputElement).value = ''; }
                else handleRemoveFilter();
              }
            }}
            className="h-4 border border-gray-300 rounded px-1.5 text-xs bg-white focus:border-[#C42B1C] focus:outline-none w-28 placeholder-gray-400"
          />
          <span className="flex-1" />
          {sortState && (
            <span className="text-gray-400">Sorted: <strong>{sortState.field}</strong> {sortState.dir === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      </div>

      {/* ── Find Dialog ── */}
      <Dialog open={findOpen} onOpenChange={setFindOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Find</DialogTitle>
            <DialogDescription>Search through records in this table.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1 block">Find What:</Label>
              <Input value={findText} onChange={e => setFindText(e.target.value)} placeholder="Enter search text..." autoFocus
                onKeyDown={e => { if (e.key === 'Enter') { setFieldFilter({ type: 'search', text: findText }); setCurrentPage(1); setFindOpen(false); } }} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setFindOpen(false)}>Cancel</Button>
            <Button onClick={() => { setFieldFilter({ type: 'search', text: findText }); setCurrentPage(1); setFindOpen(false); }} className="bg-[#C42B1C] hover:bg-[#9B2118]">
              Find All
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Filter Menu Panel ── */}
      {filterMenuOpen && (
        <div className="fixed inset-0 z-[150]" onClick={() => setFilterMenuOpen(false)}>
          <div
            className="absolute bg-white border border-gray-300 shadow-xl rounded w-56 text-sm overflow-hidden"
            style={{ top: 90, left: 200 }}
            onClick={e => e.stopPropagation()}
          >
            {(() => {
              const ft = selectedField?.fieldType ?? 'text';
              const isNumber = ft === 'number' || ft === 'currency';
              const isDate = ft === 'date';
              const isBool = ft === 'boolean';
              if (isBool) return (
                <>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">Yes/No Filters</div>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => { setFilterMenuOpen(false); handleApplyFilter({ type: 'eq', field: selectedFieldName!, value: true }); }}>Is Yes</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => { setFilterMenuOpen(false); handleApplyFilter({ type: 'eq', field: selectedFieldName!, value: false }); }}>Is No</button>
                  <div className="border-t border-gray-200" />
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => { setFilterMenuOpen(false); handleApplyFilter({ type: 'isEmpty', field: selectedFieldName! }); }}>Is Empty (Blank)</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => { setFilterMenuOpen(false); handleApplyFilter({ type: 'isNotEmpty', field: selectedFieldName! }); }}>Is Not Empty</button>
                </>
              );
              if (isDate) return (
                <>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">Date Filters</div>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('eq', 'Equals (Date)')}>Equals…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('ne', 'Does Not Equal (Date)')}>Does Not Equal…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('lt', 'Before')}>Before…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('gt', 'After')}>After…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('between', 'Between (Dates)')}>Between…</button>
                  <div className="border-t border-gray-200" />
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => { setFilterMenuOpen(false); handleApplyFilter({ type: 'isEmpty', field: selectedFieldName! }); }}>Is Empty (Blank)</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => { setFilterMenuOpen(false); handleApplyFilter({ type: 'isNotEmpty', field: selectedFieldName! }); }}>Is Not Empty</button>
                </>
              );
              if (isNumber) return (
                <>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">Number Filters</div>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('eq', 'Equals')}>Equals…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('ne', 'Does Not Equal')}>Does Not Equal…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('lt', 'Less Than')}>Less Than…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('lte', 'Less Than or Equal To')}>Less Than or Equal To…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('gt', 'Greater Than')}>Greater Than…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('gte', 'Greater Than or Equal To')}>Greater Than or Equal To…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('between', 'Between')}>Between…</button>
                  <div className="border-t border-gray-200" />
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => { setFilterMenuOpen(false); handleApplyFilter({ type: 'isEmpty', field: selectedFieldName! }); }}>Is Empty (Blank)</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => { setFilterMenuOpen(false); handleApplyFilter({ type: 'isNotEmpty', field: selectedFieldName! }); }}>Is Not Empty</button>
                </>
              );
              return (
                <>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">Text Filters</div>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('eq', 'Equals')}>Equals…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('ne', 'Does Not Equal')}>Does Not Equal…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('startsWith', 'Begins With')}>Begins With…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('notStartsWith', 'Does Not Begin With')}>Does Not Begin With…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('contains', 'Contains')}>Contains…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('notContains', 'Does Not Contain')}>Does Not Contain…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('endsWith', 'Ends With')}>Ends With…</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => openFilterInput('notEndsWith', 'Does Not End With')}>Does Not End With…</button>
                  <div className="border-t border-gray-200" />
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => { setFilterMenuOpen(false); handleApplyFilter({ type: 'isEmpty', field: selectedFieldName! }); }}>Is Empty (Blank)</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#ddeeff]" onClick={() => { setFilterMenuOpen(false); handleApplyFilter({ type: 'isNotEmpty', field: selectedFieldName! }); }}>Is Not Empty</button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Filter Input Dialog ── */}
      {filterInputState && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30" onClick={() => setFilterInputState(null)}>
          <div className="bg-white border border-gray-300 shadow-xl rounded w-80 p-4" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-semibold text-gray-800 mb-1">{filterInputState.label}</div>
            <div className="text-xs text-gray-500 mb-3">Field: <strong>{selectedFieldName}</strong></div>
            <div className="space-y-2 mb-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">{filterInputState.op === 'between' ? 'From' : 'Value'}</label>
                <input
                  type={filterInputState.fieldType === 'date' ? 'date' : (filterInputState.fieldType === 'number' || filterInputState.fieldType === 'currency') ? 'number' : 'text'}
                  value={filterInputState.val}
                  autoFocus
                  onChange={e => setFilterInputState(s => s ? { ...s, val: e.target.value } : s)}
                  onKeyDown={e => { if (e.key === 'Enter' && filterInputState.op !== 'between') applyFilterInput(); if (e.key === 'Escape') setFilterInputState(null); }}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-[#C42B1C] focus:outline-none"
                />
              </div>
              {filterInputState.op === 'between' && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">To</label>
                  <input
                    type={filterInputState.fieldType === 'date' ? 'date' : (filterInputState.fieldType === 'number' || filterInputState.fieldType === 'currency') ? 'number' : 'text'}
                    value={filterInputState.val2}
                    onChange={e => setFilterInputState(s => s ? { ...s, val2: e.target.value } : s)}
                    onKeyDown={e => { if (e.key === 'Enter') applyFilterInput(); if (e.key === 'Escape') setFilterInputState(null); }}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-[#C42B1C] focus:outline-none"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setFilterInputState(null)} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={applyFilterInput} className="px-3 py-1.5 text-sm bg-[#C42B1C] text-white rounded hover:bg-[#9B2118]">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Name & Caption Dialog ── */}
      <Dialog open={fieldOpDialog === 'rename'} onOpenChange={v => !v && setFieldOpDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Name &amp; Caption</DialogTitle>
            <DialogDescription>Change the field name and optional display caption.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1 block">Field Name</Label>
              <Input value={fieldOpName} onChange={e => setFieldOpName(e.target.value)} autoFocus placeholder="e.g. StudentName" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1 block">Caption (display label)</Label>
              <Input value={fieldOpCaption} onChange={e => setFieldOpCaption(e.target.value)} placeholder={fieldOpName || 'Optional caption…'} />
              <p className="text-[11px] text-gray-400 mt-1">Caption is shown in column headers instead of the field name.</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setFieldOpDialog(null)}>Cancel</Button>
            <Button onClick={doRenameField} className="bg-[#C42B1C] hover:bg-[#9B2118]">Apply</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Default Value Dialog ── */}
      <Dialog open={fieldOpDialog === 'defaultValue'} onOpenChange={v => !v && setFieldOpDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Default Value</DialogTitle>
            <DialogDescription>Set the default value for new records in field "{selectedFieldName}".</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs font-medium text-gray-600 mb-1 block">Default Value</Label>
            <Input value={fieldOpValue} onChange={e => setFieldOpValue(e.target.value)} autoFocus
              placeholder={selectedField?.fieldType === 'number' ? '0' : selectedField?.fieldType === 'date' ? 'e.g. 2024-01-01' : 'e.g. Unknown'} />
            <p className="text-[11px] text-gray-400 mt-1">Leave blank to have no default (field will start empty).</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setFieldOpDialog(null)}>Cancel</Button>
            <Button onClick={doSetDefaultValue} className="bg-[#C42B1C] hover:bg-[#9B2118]">Apply</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Field Size Dialog ── */}
      <Dialog open={fieldOpDialog === 'fieldSize'} onOpenChange={v => !v && setFieldOpDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Field Size</DialogTitle>
            <DialogDescription>Set the maximum number of characters for "{selectedFieldName}".</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs font-medium text-gray-600 mb-1 block">Maximum Characters</Label>
            <Input type="number" min={1} max={255} value={fieldOpSize} onChange={e => setFieldOpSize(e.target.value)} autoFocus placeholder="255" />
            <p className="text-[11px] text-gray-400 mt-1">Short Text fields can hold up to 255 characters. Leave blank for no limit.</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setFieldOpDialog(null)}>Cancel</Button>
            <Button onClick={doSetFieldSize} className="bg-[#C42B1C] hover:bg-[#9B2118]">Apply</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── More Fields Dialog ── */}
      <Dialog open={fieldOpDialog === 'addMore'} onOpenChange={v => !v && setFieldOpDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>More Fields</DialogTitle>
            <DialogDescription>Choose the type of field to add to the table.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs font-medium text-gray-600 mb-1 block">Field Type</Label>
            <select
              value={addMoreType}
              onChange={e => setAddMoreType(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-[#C42B1C]"
            >
              <optgroup label="Text">
                <option value="text">Short Text</option>
                <option value="longtext">Long Text</option>
                <option value="hyperlink">Hyperlink</option>
              </optgroup>
              <optgroup label="Numeric">
                <option value="number">Number</option>
                <option value="currency">Currency</option>
              </optgroup>
              <optgroup label="Date">
                <option value="date">Date/Time</option>
              </optgroup>
              <optgroup label="Special">
                <option value="boolean">Yes/No</option>
                <option value="autonumber">AutoNumber</option>
                <option value="attachment">Attachment</option>
                <option value="calculated">Calculated</option>
                <option value="lookup">Lookup (Value List)</option>
              </optgroup>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setFieldOpDialog(null)}>Cancel</Button>
            <Button onClick={doAddMoreField} className="bg-[#C42B1C] hover:bg-[#9B2118]">Add Field</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Field Confirm ── */}
      <ConfirmDialog
        open={deleteFieldConfirm}
        onOpenChange={setDeleteFieldConfirm}
        title="Delete Field"
        description={`Are you sure you want to delete the field "${selectedFieldName}"? All data in this column will be permanently lost.`}
        confirmLabel="Delete Field"
        onConfirm={doDeleteField}
      />

      {/* ── Delete Record Confirm ── */}
      <ConfirmDialog
        open={deleteRecordConfirm}
        onOpenChange={setDeleteRecordConfirm}
        title="Delete Record"
        description="Are you sure you want to delete this record? This action cannot be undone."
        confirmLabel="Delete Record"
        onConfirm={doDeleteRecord}
      />

      {/* ── Reset Sandbox Confirm ── */}
      {onReset && (
        <ConfirmDialog
          open={resetConfirm}
          onOpenChange={setResetConfirm}
          title="Reset Sandbox"
          description="This will delete all your changes and restore the sandbox to its original state. Are you sure?"
          confirmLabel="Reset"
          onConfirm={onReset}
        />
      )}
    </Shell>
  );
}
