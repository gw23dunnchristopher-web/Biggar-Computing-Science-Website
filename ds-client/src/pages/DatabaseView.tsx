import React, { useState, useEffect, useCallback } from 'react';
import { useRoute, useLocation, Switch, Route } from 'wouter';
import { useGetDatabase, useListTables, useDeleteTable, getListTablesQueryKey, useCreateTable, useUpdateDatabase } from '@/api';
import { Shell } from '@/components/layout/Shell';
import { Sidebar } from '@/components/layout/Sidebar';
import { Ribbon, RibbonGroup, RibbonButton } from '@/components/layout/Ribbon';
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
import { Table, List, LayoutTemplate, FileText } from 'lucide-react';


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
  const [, setLocation] = useLocation();
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
      setLocation(`/databases/${databaseId}`);
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
      setLocation(`/databases/${databaseId}`);
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

  const handleQueryWizardFinish = async (name: string, definition: any) => {
    try {
      const q = await apiFetch(`/api/ds/databases/${databaseId}/queries`, {
        method: 'POST',
        body: JSON.stringify({ name, definition })
      });
      await loadQueries();
      setLocation(`/databases/${databaseId}/queries/${q.id}`);
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
      setLocation(`/databases/${databaseId}`);
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
      setLocation(`/databases/${databaseId}`);
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
            id: f.id, name: f.name, label: f.name, visible: true, sortOrder: i
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
          content: (
            <RibbonGroup name="Create">
              <RibbonButton icon={<Table size={22} />} label="Table" onClick={handleCreateTable} />
              <RibbonButton icon={<List size={22} />} label="Query" onClick={handleCreateQuery} />
              <RibbonButton icon={<LayoutTemplate size={22} />} label="Form" onClick={openCreateForm} />
              <RibbonButton icon={<FileText size={22} />} label="Report" onClick={openCreateReport} />
            </RibbonGroup>
          )
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

  return (
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
              {...sharedProps}
            />
          )}
        </Route>

        <Route path="/databases/:id/queries/:queryId">
          {(p) => (
            <QueryDesignView
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
  );
}
