import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRoute, useLocation, Switch, Route } from 'wouter';
import { ObjectTabBar, ObjectTab } from '@/components/ui/object-tab-bar';
import { TabBarProvider } from '@/contexts/tab-bar-context';
import { useGetDatabase, useListTables, useDeleteTable, getListTablesQueryKey, useCreateTable, useUpdateDatabase } from '@/api';
import { Shell } from '@/components/layout/Shell';
import { Sidebar } from '@/components/layout/Sidebar';
import { Ribbon, RibbonGroup, RibbonButton, RibbonDropdownButton } from '@/components/layout/Ribbon';
import { CreateTabContent, ExternalDataTabContent, DatabaseToolsTabContent } from '@/components/layout/AccessRibbonTabs';
import { TableDesignView } from './TableDesignView';
import { TableDataView } from './TableDataView';
import { QueryDesignView } from './QueryDesignView';
import { FormView } from './FormView';
import { ReportView } from './ReportView';
import { SQLView } from './SQLView';
import { RelationshipsView } from './RelationshipsView';
import { CSVImportModal } from '@/components/ui/csv-import-modal';
import { AnalyseModal, DocumenterModal, DependenciesModal, ExportDataModal } from '@/components/ui/tools-modals';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { QueryWizard } from '@/components/ui/query-wizard';
import { FormWizard } from '@/components/ui/form-wizard';
import { ReportWizard } from '@/components/ui/report-wizard';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateEmbed } from '@/api';
import {
  Table, List, LayoutTemplate, FileText,
  ClipboardPaste, Scissors, Copy, Paintbrush,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Highlighter, Grid3X3,
} from 'lucide-react';
import {
  DsFilterIcon, DsAscendingIcon, DsDescendingIcon, DsAdvancedFilterIcon,
  DsSelectionIcon, DsRemoveSortIcon, DsToggleFilterIcon,
  DsRefreshAllIcon,
  DsRecordsNewIcon, DsRecordsSaveIcon, DsRecordsSpellingIcon,
  DsRecordsDeleteIcon, DsRecordsMoreIcon, DsRecordsTotalsIcon,
  DsFindIcon, DsFindReplaceIcon, DsFindGoToIcon, DsFindSelectIcon,
} from '@/components/ui/ds-icons';

function DisabledTextFormattingGroup() {
  return (
    <RibbonGroup name="Text Formatting">
      <div className="flex flex-col gap-0.5 pt-0.5 opacity-40 pointer-events-none">
        <div className="flex items-center gap-1">
          <select disabled className="h-7 text-[12px] border border-gray-300 rounded px-1 bg-white min-w-[120px]">
            <option>Aptos (Detail)</option>
          </select>
          <select disabled className="h-7 text-[12px] border border-gray-300 rounded px-1 bg-white w-12">
            <option>11</option>
          </select>
        </div>
        <div className="flex items-center gap-0.5">
          <button disabled className="w-7 h-7 flex items-center justify-center rounded text-gray-700"><Bold size={14} /></button>
          <button disabled className="w-7 h-7 flex items-center justify-center rounded italic text-gray-700"><Italic size={14} /></button>
          <button disabled className="w-7 h-7 flex items-center justify-center rounded underline text-gray-700"><Underline size={14} /></button>
          <span className="w-px h-5 bg-gray-200 mx-0.5" />
          <button disabled className="w-7 h-7 flex items-center justify-center rounded">
            <div className="flex flex-col items-center gap-px">
              <span className="text-[11px] font-bold text-gray-700 leading-none">A</span>
              <span className="w-4 h-0.5 rounded-full bg-[#C42B1C]" />
            </div>
          </button>
          <button disabled className="w-7 h-7 flex items-center justify-center rounded"><Highlighter size={14} className="text-yellow-500" /></button>
        </div>
        <div className="flex items-center gap-0.5">
          <button disabled className="w-7 h-7 flex items-center justify-center rounded text-gray-700"><AlignLeft size={14} /></button>
          <button disabled className="w-7 h-7 flex items-center justify-center rounded text-gray-700"><AlignCenter size={14} /></button>
          <button disabled className="w-7 h-7 flex items-center justify-center rounded text-gray-700"><AlignRight size={14} /></button>
          <span className="w-px h-5 bg-gray-200 mx-0.5" />
          <button disabled className="w-7 h-7 flex items-center justify-center rounded"><Paintbrush size={14} className="text-gray-600" /></button>
          <button disabled className="w-7 h-7 flex items-center justify-center rounded"><Grid3X3 size={14} className="text-gray-600" /></button>
        </div>
      </div>
    </RibbonGroup>
  );
}

function BlankHomeTab() {
  return (
    <>
      <RibbonGroup name="Clipboard">
        <RibbonButton icon={<ClipboardPaste size={32} />} label="Paste" disabled />
        <div className="flex flex-col justify-start gap-0 h-full pt-0.5">
          <RibbonButton size="small" icon={<Scissors size={16} />} label="Cut" disabled />
          <RibbonButton size="small" icon={<Copy size={16} />} label="Copy" disabled />
          <RibbonButton size="small" icon={<Paintbrush size={16} />} label="Format Painter" disabled />
        </div>
      </RibbonGroup>

      <RibbonGroup name="Sort &amp; Filter">
        <RibbonButton icon={<DsFilterIcon size={32} />} label="Filter" disabled />
        <div className="flex flex-col justify-start gap-0 h-full pt-0.5">
          <RibbonButton size="small" icon={<DsAscendingIcon size={16} />} label="Ascending" disabled />
          <RibbonButton size="small" icon={<DsDescendingIcon size={16} />} label="Descending" disabled />
          <RibbonDropdownButton compact icon={<DsAdvancedFilterIcon size={16} />} label="Advanced" disabled>
            <RibbonButton icon={<DsAdvancedFilterIcon size={16} />} label="Advanced Filter/Sort" disabled />
          </RibbonDropdownButton>
        </div>
        <div className="flex flex-col justify-start gap-0 h-full pt-0.5">
          <RibbonDropdownButton compact icon={<DsSelectionIcon size={16} />} label="Selection" disabled>
            <RibbonButton icon={<DsSelectionIcon size={16} />} label="Equals" disabled />
          </RibbonDropdownButton>
          <RibbonButton size="small" icon={<DsRemoveSortIcon size={16} />} label="Remove Sort" disabled />
          <RibbonButton size="small" icon={<DsToggleFilterIcon size={16} />} label="Toggle Filter" disabled />
        </div>
      </RibbonGroup>

      <RibbonGroup name="Records">
        <RibbonDropdownButton icon={<DsRefreshAllIcon size={32} />} label="Refresh All" disabled>
          <RibbonButton icon={<DsRefreshAllIcon size={16} />} label="Refresh" disabled />
        </RibbonDropdownButton>
        <div className="flex flex-col justify-start gap-0 h-full pt-0.5">
          <RibbonButton size="small" icon={<DsRecordsNewIcon size={16} />} label="New" disabled />
          <RibbonButton size="small" icon={<DsRecordsSaveIcon size={16} />} label="Save" disabled />
          <RibbonButton size="small" icon={<DsRecordsSpellingIcon size={16} />} label="Spelling" disabled />
        </div>
        <div className="flex flex-col justify-start gap-0 h-full pt-0.5">
          <RibbonDropdownButton compact icon={<DsRecordsDeleteIcon size={16} />} label="Delete" disabled>
            <RibbonButton icon={<DsRecordsDeleteIcon size={16} />} label="Delete Record" disabled />
          </RibbonDropdownButton>
          <RibbonDropdownButton compact icon={<DsRecordsMoreIcon size={16} />} label="More" disabled>
            <RibbonButton icon={<DsRecordsTotalsIcon size={16} />} label="Totals" disabled />
          </RibbonDropdownButton>
        </div>
      </RibbonGroup>

      <RibbonGroup name="Find">
        <RibbonButton icon={<DsFindIcon size={32} />} label="Find" disabled />
        <div className="flex flex-col justify-start gap-0 h-full pt-0.5">
          <RibbonButton size="small" icon={<DsFindReplaceIcon size={16} />} label="Replace" disabled />
          <RibbonDropdownButton compact icon={<DsFindGoToIcon size={16} />} label="Go To" disabled>
            <RibbonButton icon={<DsFindGoToIcon size={16} />} label="First" disabled />
          </RibbonDropdownButton>
          <RibbonDropdownButton compact icon={<DsFindSelectIcon size={16} />} label="Select" disabled>
            <RibbonButton icon={<DsFindSelectIcon size={16} />} label="Select All" disabled />
          </RibbonDropdownButton>
        </div>
      </RibbonGroup>

      <DisabledTextFormattingGroup />
    </>
  );
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers as any) }
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

type ItemRow = { id: number; name: string; databaseId: number };

export function DatabaseView() {
  const [, params] = useRoute('/databases/:id/*?');
  const databaseId = params?.id ? parseInt(params.id) : 0;
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: db, isLoading: dbLoading } = useGetDatabase(databaseId, { query: { enabled: !!databaseId } });
  const { data: tables, isLoading: tablesLoading } = useListTables(databaseId, { query: { enabled: !!databaseId } });

  const deleteTable = useDeleteTable();
  const createTable = useCreateTable();
  const embedMutation = useCreateEmbed();
  const updateDb = useUpdateDatabase();

  // Collections
  const [queries, setQueries] = useState<ItemRow[]>([]);
  const [forms, setForms] = useState<ItemRow[]>([]);
  const [reports, setReports] = useState<ItemRow[]>([]);

  // Track tables created in this session that haven't been explicitly named yet
  const [newlyCreatedTableId, setNewlyCreatedTableId] = useState<number | null>(null);

  // Dialogs
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dbName, setDbName] = useState('');
  const [dbTaskDescription, setDbTaskDescription] = useState('');

  // Confirm-delete dialogs
  const [deleteTableConfirm, setDeleteTableConfirm] = useState<{ open: boolean; tableId: number | null; tableName: string }>({ open: false, tableId: null, tableName: '' });
  const [deleteQueryConfirm, setDeleteQueryConfirm] = useState<{ open: boolean; queryId: number | null; queryName: string }>({ open: false, queryId: null, queryName: '' });
  const [deleteFormConfirm, setDeleteFormConfirm] = useState<{ open: boolean; formId: number | null; formName: string }>({ open: false, formId: null, formName: '' });
  const [deleteReportConfirm, setDeleteReportConfirm] = useState<{ open: boolean; reportId: number | null; reportName: string }>({ open: false, reportId: null, reportName: '' });

  // Form / Report wizard
  const [formWizardOpen, setFormWizardOpen] = useState(false);
  const [reportWizardOpen, setReportWizardOpen] = useState(false);

  // Quick-create (blank / auto) dialog — shared for forms and reports
  const [quickCreate, setQuickCreate] = useState<{
    type: 'blankForm' | 'autoForm' | 'blankReport' | 'autoReport';
    tableId: number | null;
    name: string;
    busy: boolean;
  } | null>(null);

  // Create naming dialogs

  // Query Wizard
  const [queryWizardOpen, setQueryWizardOpen] = useState(false);

  // CSV Import
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  // Tools modals
  const [analyseOpen, setAnalyseOpen] = useState(false);
  const [documenterOpen, setDocumenterOpen] = useState(false);
  const [dependenciesOpen, setDependenciesOpen] = useState(false);
  const [exportDataOpen, setExportDataOpen] = useState(false);

  // Loaders
  const loadQueries = useCallback(async () => {
    if (!databaseId) return;
    try { setQueries(await apiFetch(`/api/ds/databases/${databaseId}/queries`) || []); } catch {}
  }, [databaseId]);

  const loadForms = useCallback(async () => {
    if (!databaseId) return;
    try { setForms(await apiFetch(`/api/ds/databases/${databaseId}/forms`) || []); } catch {}
  }, [databaseId]);

  const loadReports = useCallback(async () => {
    if (!databaseId) return;
    try { setReports(await apiFetch(`/api/ds/databases/${databaseId}/reports`) || []); } catch {}
  }, [databaseId]);

  const loadData = useCallback(async () => {
    await Promise.all([loadQueries(), loadForms(), loadReports()]);
  }, [loadQueries, loadForms, loadReports]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Object tabs ─────────────────────────────────────────────
  const [openTabs, setOpenTabs] = useState<ObjectTab[]>([]);

  const parseLocation = (loc: string): { key: string; objectType: ObjectTab['objectType']; objectId?: number } | null => {
    let m = loc.match(/\/databases\/\d+\/tables\/(\d+)\/(data|design)/);
    if (m) return { key: `table-${m[1]}`, objectType: 'table', objectId: parseInt(m[1]) };
    m = loc.match(/\/databases\/\d+\/queries\/(\d+)/);
    if (m) return { key: `query-${m[1]}`, objectType: 'query', objectId: parseInt(m[1]) };
    m = loc.match(/\/databases\/\d+\/forms\/(\d+)/);
    if (m) return { key: `form-${m[1]}`, objectType: 'form', objectId: parseInt(m[1]) };
    m = loc.match(/\/databases\/\d+\/reports\/(\d+)/);
    if (m) return { key: `report-${m[1]}`, objectType: 'report', objectId: parseInt(m[1]) };
    if (/\/databases\/\d+\/sql/.test(loc)) return { key: 'sql', objectType: 'sql' };
    return null;
  };

  const getTabLabel = (objectType: string, objectId?: number): string => {
    switch (objectType) {
      case 'table':  return tables?.find(t => t.id === objectId)?.name ?? 'Table';
      case 'query':  return queries.find(q => q.id === objectId)?.name ?? 'Query';
      case 'form':   return forms.find(f => f.id === objectId)?.name ?? 'Form';
      case 'report': return reports.find(r => r.id === objectId)?.name ?? 'Report';
      case 'sql':    return 'SQL View';
      default:       return 'Object';
    }
  };

  useEffect(() => {
    const parsed = parseLocation(location);
    if (!parsed) return;
    const { key, objectType, objectId } = parsed;
    const label = getTabLabel(objectType, objectId);
    setOpenTabs(prev => {
      const idx = prev.findIndex(t => t.key === key);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], url: location, label };
        return updated;
      }
      return [...prev, { key, url: location, label, objectType }];
    });
  }, [location, tables, queries, forms, reports]);

  const activeTabKey = useMemo(() => parseLocation(location)?.key ?? null, [location]);

  const handleTabSelect = (tab: ObjectTab) => setLocation(tab.url);

  const handleTabClose = (key: string) => {
    setOpenTabs(prev => {
      const idx = prev.findIndex(t => t.key === key);
      const next = prev.filter(t => t.key !== key);
      if (key === activeTabKey) {
        if (next.length > 0) setLocation(next[Math.min(idx, next.length - 1)].url);
        else setLocation(`/databases/${databaseId}`);
      }
      return next;
    });
  };

  // ── Table handlers ──────────────────────────────────────────
  const handleDeleteTable = (tableId: number) => {
    const table = tables?.find(t => t.id === tableId);
    setDeleteTableConfirm({ open: true, tableId, tableName: table?.name || 'this table' });
  };
  const doDeleteTable = async () => {
    if (!deleteTableConfirm.tableId) return;
    try {
      await deleteTable.mutateAsync({ databaseId, tableId: deleteTableConfirm.tableId });
      queryClient.invalidateQueries({ queryKey: getListTablesQueryKey(databaseId) });
      handleTabClose(`table-${deleteTableConfirm.tableId}`);
    } catch { toast({ title: 'Failed to delete table', variant: 'destructive' }); }
  };

  const handleCreateTable = async () => {
    const name = `Table${(tables?.length || 0) + 1}`;
    try {
      const res = await createTable.mutateAsync({
        databaseId,
        data: {
          name,
          fields: [
            { name: 'ID', fieldType: 'autonumber', isPrimaryKey: true, isRequired: true, sortOrder: 0 },
            { name: 'Field1', fieldType: 'text', isPrimaryKey: false, isRequired: false, sortOrder: 1 }
          ]
        }
      });
      queryClient.invalidateQueries({ queryKey: getListTablesQueryKey(databaseId) });
      setNewlyCreatedTableId(res.id);
      setLocation(`/databases/${databaseId}/tables/${res.id}/data`);
    } catch {
      toast({ title: 'Failed to create table', variant: 'destructive' });
    }
  };

  // ── Query handlers ──────────────────────────────────────────
  const handleDeleteQuery = (queryId: number) => {
    const q = queries.find(q => q.id === queryId);
    setDeleteQueryConfirm({ open: true, queryId, queryName: q?.name || 'this query' });
  };
  const doDeleteQuery = async () => {
    if (!deleteQueryConfirm.queryId) return;
    try {
      await apiFetch(`/api/ds/databases/${databaseId}/queries/${deleteQueryConfirm.queryId}`, { method: 'DELETE' });
      await loadQueries();
      handleTabClose(`query-${deleteQueryConfirm.queryId}`);
    } catch { toast({ title: 'Failed to delete query', variant: 'destructive' }); }
  };

  const handleCreateQuery = async () => {
    const name = `Query${queries.length + 1}`;
    try {
      const q = await apiFetch(`/api/ds/databases/${databaseId}/queries`, {
        method: 'POST',
        body: JSON.stringify({ name, definition: { tables: [], columns: [] } })
      });
      await loadQueries();
      setLocation(`/databases/${databaseId}/queries/${q.id}`);
    } catch {
      toast({ title: 'Failed to create query', variant: 'destructive' });
    }
  };

  const handleCreateSqlQuery = async () => {
    const name = `Query${queries.length + 1}`;
    try {
      const q = await apiFetch(`/api/ds/databases/${databaseId}/queries`, {
        method: 'POST',
        body: JSON.stringify({ name, definition: { tables: [], columns: [] } })
      });
      await loadQueries();
      setLocation(`/databases/${databaseId}/queries/${q.id}?view=sql`);
    } catch {
      toast({ title: 'Failed to create SQL query', variant: 'destructive' });
    }
  };

  const handleQueryWizardFinish = async (name: string, definition: any, openMode: 'view' | 'modify') => {
    try {
      const q = await apiFetch(`/api/ds/databases/${databaseId}/queries`, {
        method: 'POST',
        body: JSON.stringify({ name, definition })
      });
      await loadQueries();
      const path = `/databases/${databaseId}/queries/${q.id}`;
      setLocation(openMode === 'view' ? `${path}?view=datasheet` : path);
    } catch { toast({ title: 'Failed to create query from wizard', variant: 'destructive' }); }
  };

  // ── Form handlers ───────────────────────────────────────────
  const openCreateForm = () => setFormWizardOpen(true);

  const handleDeleteForm = (formId: number) => {
    const f = forms.find(f => f.id === formId);
    setDeleteFormConfirm({ open: true, formId, formName: f?.name || 'this form' });
  };
  const doDeleteForm = async () => {
    if (!deleteFormConfirm.formId) return;
    try {
      await apiFetch(`/api/ds/databases/${databaseId}/forms/${deleteFormConfirm.formId}`, { method: 'DELETE' });
      await loadForms();
      handleTabClose(`form-${deleteFormConfirm.formId}`);
    } catch { toast({ title: 'Failed to delete form', variant: 'destructive' }); }
  };

  const handleFormWizardFinish = async (name: string, definition: any, openMode: 'view' | 'modify') => {
    try {
      const created = await apiFetch(`/api/ds/databases/${databaseId}/forms`, {
        method: 'POST',
        body: JSON.stringify({ name, definition })
      });
      await loadForms();
      const path = `/databases/${databaseId}/forms/${created.id}`;
      setLocation(openMode === 'modify' ? `${path}?design=1` : path);
    } catch { toast({ title: 'Failed to create form', variant: 'destructive' }); }
  };

  // ── Report handlers ─────────────────────────────────────────
  const openCreateReport = () => setReportWizardOpen(true);

  const handleDeleteReport = (reportId: number) => {
    const r = reports.find(r => r.id === reportId);
    setDeleteReportConfirm({ open: true, reportId, reportName: r?.name || 'this report' });
  };
  const doDeleteReport = async () => {
    if (!deleteReportConfirm.reportId) return;
    try {
      await apiFetch(`/api/ds/databases/${databaseId}/reports/${deleteReportConfirm.reportId}`, { method: 'DELETE' });
      await loadReports();
      handleTabClose(`report-${deleteReportConfirm.reportId}`);
    } catch { toast({ title: 'Failed to delete report', variant: 'destructive' }); }
  };

  const handleReportWizardFinish = async (name: string, definition: any, openMode: 'preview' | 'modify') => {
    try {
      const created = await apiFetch(`/api/ds/databases/${databaseId}/reports`, {
        method: 'POST',
        body: JSON.stringify({ name, definition })
      });
      await loadReports();
      const path = `/databases/${databaseId}/reports/${created.id}`;
      setLocation(openMode === 'modify' ? `${path}?design=1` : path);
    } catch { toast({ title: 'Failed to create report', variant: 'destructive' }); }
  };

  // ── Quick-create handlers (Blank Form, Auto Form, Blank Report, Auto Report) ───
  const openQuickCreate = (type: 'blankForm' | 'autoForm' | 'blankReport' | 'autoReport') => {
    const isForm = type === 'blankForm' || type === 'autoForm';
    const baseName = isForm ? 'Form' : 'Report';
    const collection = isForm ? forms : reports;
    const n = collection.length + 1;
    const defaultName = `${baseName}${n}`;
    const firstTable = tables?.[0];
    setQuickCreate({ type, tableId: firstTable?.id ?? null, name: defaultName, busy: false });
  };

  const doQuickCreate = async () => {
    if (!quickCreate || !quickCreate.tableId) return;
    setQuickCreate(q => q ? { ...q, busy: true } : q);
    try {
      const { type, tableId, name } = quickCreate;
      const isForm = type === 'blankForm' || type === 'autoForm';
      const isBlank = type === 'blankForm' || type === 'blankReport';

      // For auto-create, load the table's fields
      let fields: any[] = [];
      if (!isBlank) {
        try {
          const td = await apiFetch(`/api/ds/databases/${databaseId}/tables/${tableId}`);
          const rawFields = [...(td.fields || [])].sort((a: any, b: any) => a.sortOrder - b.sortOrder);
          fields = rawFields.map((f: any, i: number) => ({
            id: f.id, fieldName: f.name, name: f.name, label: f.name, visible: true, sortOrder: i
          }));
        } catch { /* keep fields empty on error */ }
      }

      const definition = isForm
        ? { tableId, layout: 'columnar', title: name, fields }
        : { tableId, layout: 'tabular', title: name, fields, sortBy: null, groupBy: null };

      if (isForm) {
        const created = await apiFetch(`/api/ds/databases/${databaseId}/forms`, {
          method: 'POST', body: JSON.stringify({ name, definition })
        });
        await loadForms();
        const path = `/databases/${databaseId}/forms/${created.id}`;
        setLocation(isBlank ? `${path}?design=1` : path);
      } else {
        const created = await apiFetch(`/api/ds/databases/${databaseId}/reports`, {
          method: 'POST', body: JSON.stringify({ name, definition })
        });
        await loadReports();
        const path = `/databases/${databaseId}/reports/${created.id}`;
        setLocation(isBlank ? `${path}?design=1` : path);
      }
      setQuickCreate(null);
    } catch {
      toast({ title: 'Failed to create', variant: 'destructive' });
      setQuickCreate(q => q ? { ...q, busy: false } : q);
    }
  };

  // ── Share / Settings ────────────────────────────────────────
  const handleShare = async () => {
    if (!db) return;
    setIsShareOpen(true);
    if (!embedMutation.data) {
      try { await embedMutation.mutateAsync({ data: { databaseId, userId: db.userId } }); }
      catch { toast({ title: 'Failed to generate link', variant: 'destructive' }); }
    }
  };

  const handleSaveSettings = async () => {
    if (!dbName.trim()) return;
    try {
      await updateDb.mutateAsync({ databaseId, data: { name: dbName, taskDescription: dbTaskDescription.trim() || null } });
      toast({ title: 'Database updated' });
      setIsSettingsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/databases', databaseId] });
    } catch { toast({ title: 'Update failed', variant: 'destructive' }); }
  };

  const openSettings = () => { setDbName(db?.name || ''); setDbTaskDescription(db?.taskDescription || ''); setIsSettingsOpen(true); };

  const handleCompact = async () => {
    try {
      const result = await apiFetch(`/api/ds/databases/${databaseId}/compact`, { method: 'POST' });
      toast({
        title: 'Compact & Repair complete',
        description: `${result.tablesChecked} table${result.tablesChecked !== 1 ? 's' : ''} checked · ${result.orphanedRecordsRemoved} orphaned record${result.orphanedRecordsRemoved !== 1 ? 's' : ''} removed · Status: ${result.status}`,
      });
    } catch { toast({ title: 'Compact failed', variant: 'destructive' }); }
  };

  // ── Common prop bundles ─────────────────────────────────────
  const commonRibbonProps = {
    onCreateTable: handleCreateTable,
    onCreateQuery: handleCreateQuery,
    onQueryWizard: () => setQueryWizardOpen(true),
    onCreateForm: openCreateForm,
    onCreateBlankForm: () => openQuickCreate('blankForm'),
    onCreateAutoForm: () => openQuickCreate('autoForm'),
    onCreateReport: openCreateReport,
    onCreateBlankReport: () => openQuickCreate('blankReport'),
    onCreateAutoReport: () => openQuickCreate('autoReport'),
    onShare: handleShare,
    onSettings: openSettings,
    onOpenSql: () => setLocation(`/databases/${databaseId}/sql`),
    onCreateSqlQuery: handleCreateSqlQuery,
    onImportCSV: () => setCsvImportOpen(true),
    onOpenRelationships: () => setLocation(`/databases/${databaseId}/relationships`),
    onCompact: handleCompact,
    onAnalyse: () => setAnalyseOpen(true),
    onDocumenter: () => setDocumenterOpen(true),
    onObjectDependencies: () => setDependenciesOpen(true),
    onExportData: () => setExportDataOpen(true),
  };

  const sharedProps = {
    ...commonRibbonProps,
    forms,
    reports,
    queries,
    onDeleteTable: handleDeleteTable,
    onDeleteQuery: handleDeleteQuery,
    onDeleteForm: handleDeleteForm,
    onDeleteReport: handleDeleteReport,
    onRefresh: loadData,
  };

  if (dbLoading || tablesLoading) return <div className="p-8">Loading Database...</div>;
  if (!db) return <div className="p-8">Database not found.</div>;

  const defaultRibbon = (
    <Ribbon
      title={db.name}
      allDatabasesLink="/"
      tabs={[
        {
          name: 'Home',
          content: <BlankHomeTab />,
        },
        { name: 'Create', content: <CreateTabContent {...commonRibbonProps} /> },
        { name: 'External Data', content: <ExternalDataTabContent {...commonRibbonProps} onShare={handleShare} /> },
        { name: 'Database Tools', content: <DatabaseToolsTabContent {...commonRibbonProps} onSettings={openSettings} /> }
      ]}
    />
  );

  const sidebarProps = {
    tables: tables || [],
    databaseId,
    onDeleteTable: handleDeleteTable,
    queries,
    onDeleteQuery: handleDeleteQuery,
    forms,
    onDeleteForm: handleDeleteForm,
    reports,
    onDeleteReport: handleDeleteReport,
    onRefresh: loadData,
  };

  const tabBarEl = (
    <ObjectTabBar
      tabs={openTabs}
      activeKey={activeTabKey}
      onSelect={handleTabSelect}
      onClose={handleTabClose}
    />
  );

  return (
    <TabBarProvider value={tabBarEl}>
    <>
      <Switch>
        <Route path="/databases/:id">
          <Shell title={db.name} ribbon={defaultRibbon} sidebar={<Sidebar {...sidebarProps} />}>
            <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 bg-[#f3f2f1] p-8 text-center">
              <h2 className="text-xl text-gray-600 mb-2">Ready to design.</h2>
              <p className="max-w-md text-sm">Use the <strong>Create</strong> tab to create Tables, Queries, Forms and Reports.</p>
              <div className="flex flex-wrap gap-3 mt-6 justify-center">
                <Button onClick={handleCreateTable} className="bg-[#C42B1C] hover:bg-[#9B2118]">
                  <Table className="w-4 h-4 mr-2" /> Create Table
                </Button>
                <Button onClick={handleCreateQuery} variant="outline" className="border-[#c55a11] text-[#c55a11] hover:bg-orange-50">
                  <List className="w-4 h-4 mr-2" /> Create Query
                </Button>
                <Button onClick={openCreateForm} variant="outline" className="border-[#2e7d32] text-[#2e7d32] hover:bg-green-50">
                  <LayoutTemplate className="w-4 h-4 mr-2" /> Create Form
                </Button>
                <Button onClick={openCreateReport} variant="outline" className="border-[#5d4037] text-[#5d4037] hover:bg-amber-50">
                  <FileText className="w-4 h-4 mr-2" /> Create Report
                </Button>
              </div>
            </div>
          </Shell>
        </Route>

        <Route path="/databases/:id/tables/:tableId/design">
          {(p) => (
            <TableDesignView
              databaseId={databaseId}
              tableId={parseInt(p.tableId)}
              db={db}
              tables={tables || []}
              {...sharedProps}
            />
          )}
        </Route>

        <Route path="/databases/:id/tables/:tableId/data">
          {(p) => (
            <TableDataView
              databaseId={databaseId}
              tableId={parseInt(p.tableId)}
              db={db}
              tables={tables || []}
              isNewTable={newlyCreatedTableId === parseInt(p.tableId)}
              onNameConfirmed={() => setNewlyCreatedTableId(null)}
              {...sharedProps}
            />
          )}
        </Route>

        <Route path="/databases/:id/queries/:queryId">
          {(p) => (
            <QueryDesignView
              key={parseInt(p.queryId)}
              databaseId={databaseId}
              queryId={parseInt(p.queryId)}
              db={db}
              tables={tables || []}
              {...sharedProps}
            />
          )}
        </Route>

        <Route path="/databases/:id/forms/:formId">
          {(p) => (
            <FormView
              databaseId={databaseId}
              formId={parseInt(p.formId)}
              db={db}
              tables={tables || []}
              {...sharedProps}
            />
          )}
        </Route>

        <Route path="/databases/:id/reports/:reportId">
          {(p) => (
            <ReportView
              databaseId={databaseId}
              reportId={parseInt(p.reportId)}
              db={db}
              tables={tables || []}
              {...sharedProps}
            />
          )}
        </Route>

        <Route path="/databases/:id/sql">
          <SQLView
            databaseId={databaseId}
            db={db}
            tables={tables || []}
            {...sharedProps}
          />
        </Route>

        <Route path="/databases/:id/relationships">
          <RelationshipsView
            databaseId={databaseId}
            db={db}
            tables={tables || []}
            {...sharedProps}
          />
        </Route>
      </Switch>

      {/* ── Confirm Dialogs ── */}
      <ConfirmDialog
        open={deleteTableConfirm.open}
        onOpenChange={open => setDeleteTableConfirm(s => ({ ...s, open }))}
        title="Delete Table"
        description={`Are you sure you want to delete "${deleteTableConfirm.tableName}"? This will permanently remove the table and all its records.`}
        confirmLabel="Delete Table"
        onConfirm={doDeleteTable}
      />
      <ConfirmDialog
        open={deleteQueryConfirm.open}
        onOpenChange={open => setDeleteQueryConfirm(s => ({ ...s, open }))}
        title="Delete Query"
        description={`Are you sure you want to delete "${deleteQueryConfirm.queryName}"?`}
        confirmLabel="Delete Query"
        onConfirm={doDeleteQuery}
      />
      <ConfirmDialog
        open={deleteFormConfirm.open}
        onOpenChange={open => setDeleteFormConfirm(s => ({ ...s, open }))}
        title="Delete Form"
        description={`Are you sure you want to delete "${deleteFormConfirm.formName}"?`}
        confirmLabel="Delete Form"
        onConfirm={doDeleteForm}
      />
      <ConfirmDialog
        open={deleteReportConfirm.open}
        onOpenChange={open => setDeleteReportConfirm(s => ({ ...s, open }))}
        title="Delete Report"
        description={`Are you sure you want to delete "${deleteReportConfirm.reportName}"?`}
        confirmLabel="Delete Report"
        onConfirm={doDeleteReport}
      />

      {/* ── Query Wizard ── */}
      <QueryWizard
        open={queryWizardOpen}
        onOpenChange={setQueryWizardOpen}
        tables={tables || []}
        databaseId={databaseId}
        onFinish={handleQueryWizardFinish}
        apiFetch={apiFetch}
      />

      {/* ── Form Wizard ── */}
      <FormWizard
        open={formWizardOpen}
        onOpenChange={setFormWizardOpen}
        tables={tables || []}
        databaseId={databaseId}
        onFinish={handleFormWizardFinish}
        apiFetch={apiFetch}
      />

      {/* ── Report Wizard ── */}
      <ReportWizard
        open={reportWizardOpen}
        onOpenChange={setReportWizardOpen}
        tables={tables || []}
        databaseId={databaseId}
        onFinish={handleReportWizardFinish}
        apiFetch={apiFetch}
      />

      {/* ── Quick Create Dialog (Blank Form / Auto Form / Blank Report / Auto Report) ── */}
      {quickCreate && (() => {
        const isForm = quickCreate.type === 'blankForm' || quickCreate.type === 'autoForm';
        const isBlank = quickCreate.type === 'blankForm' || quickCreate.type === 'blankReport';
        const titles: Record<string, string> = {
          blankForm: 'Create Blank Form',
          autoForm: 'Create Auto Form',
          blankReport: 'Create Report Design',
          autoReport: 'Create Auto Report',
        };
        const descs: Record<string, string> = {
          blankForm: 'Creates an empty form with no fields. Open Design View to add fields manually.',
          autoForm: 'Creates a form with all fields from the selected table already included.',
          blankReport: 'Creates an empty report with no fields. Open Design View to add fields manually.',
          autoReport: 'Creates a report with all fields from the selected table already included.',
        };
        return (
          <Dialog open onOpenChange={v => !v && setQuickCreate(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{titles[quickCreate.type]}</DialogTitle>
                <DialogDescription>{descs[quickCreate.type]}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    {isForm ? 'Form' : 'Report'} Name
                  </label>
                  <Input
                    value={quickCreate.name}
                    onChange={e => setQuickCreate(q => q ? { ...q, name: e.target.value } : q)}
                    autoFocus
                    placeholder={`e.g. ${isForm ? 'StudentForm' : 'StudentReport'}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Table</label>
                  <select
                    value={quickCreate.tableId ?? ''}
                    onChange={e => setQuickCreate(q => q ? { ...q, tableId: Number(e.target.value) || null } : q)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-[#C42B1C]"
                  >
                    <option value="">Select a table…</option>
                    {(tables || []).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                {isBlank && (
                  <p className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                    The {isForm ? 'form' : 'report'} will open in Design View so you can choose which fields to include.
                  </p>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setQuickCreate(null)}>Cancel</Button>
                <Button
                  onClick={doQuickCreate}
                  disabled={quickCreate.busy || !quickCreate.tableId || !quickCreate.name.trim()}
                  className="bg-[#C42B1C] hover:bg-[#9B2118]"
                >
                  {quickCreate.busy ? 'Creating…' : `Create ${isForm ? 'Form' : 'Report'}`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* ── CSV Import Modal ── */}
      <CSVImportModal
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        databaseId={databaseId}
        onSuccess={tableName => {
          queryClient.invalidateQueries({ queryKey: getListTablesQueryKey(databaseId) });
          toast({ title: `Table "${tableName}" imported successfully` });
          setCsvImportOpen(false);
        }}
      />

      {/* ── Analyse Table Modal ── */}
      <AnalyseModal
        open={analyseOpen}
        onOpenChange={setAnalyseOpen}
        databaseId={databaseId}
      />

      {/* ── Database Documenter Modal ── */}
      <DocumenterModal
        open={documenterOpen}
        onOpenChange={setDocumenterOpen}
        databaseId={databaseId}
        dbName={db?.name || ''}
      />

      {/* ── Object Dependencies Modal ── */}
      <DependenciesModal
        open={dependenciesOpen}
        onOpenChange={setDependenciesOpen}
        databaseId={databaseId}
        tables={tables || []}
        queries={queries}
        forms={forms}
        reports={reports}
      />

      {/* ── Export Data Modal ── */}
      <ExportDataModal
        open={exportDataOpen}
        onOpenChange={setExportDataOpen}
        databaseId={databaseId}
        tables={tables || []}
      />

      {/* ── Share Dialog ── */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share with Students</DialogTitle>
            <DialogDescription>Students get a sandboxed copy — their changes don't affect your original.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {embedMutation.isPending && <div className="text-sm text-gray-500">Generating secure link...</div>}
            {embedMutation.data && (
              <>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Shareable Link</label>
                  <Input readOnly value={embedMutation.data.embedUrl} className="mt-1 font-mono text-xs bg-gray-50" onClick={e => e.currentTarget.select()} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Iframe Embed Code</label>
                  <textarea readOnly value={embedMutation.data.iframeCode} className="mt-1 font-mono text-xs bg-gray-50 w-full border rounded p-2 h-20 resize-none" onClick={e => e.currentTarget.select()} />
                </div>
              </>
            )}
          </div>
          <DialogFooter><Button onClick={() => setIsShareOpen(false)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Settings Dialog ── */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Database Settings</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Database Name</label>
              <Input value={dbName} onChange={e => setDbName(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Task Description <span className="text-gray-400 font-normal text-xs">(shown to students for AI marking)</span></label>
              <textarea
                value={dbTaskDescription}
                onChange={e => setDbTaskDescription(e.target.value)}
                rows={4}
                placeholder="Describe what students should do with this database, e.g. 'Write a query to find all customers who placed an order in the last 30 days.'"
                className="w-full border border-gray-200 rounded-md text-sm p-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#C42B1C]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings} disabled={updateDb.isPending} className="bg-[#C42B1C]">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </>
    </TabBarProvider>
  );
}
