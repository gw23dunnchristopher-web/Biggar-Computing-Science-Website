import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Ribbon, RibbonGroup, RibbonButton } from '@/components/layout/Ribbon';
import { Sidebar } from '@/components/layout/Sidebar';
import { Table as TableIcon } from 'lucide-react';
import { TableDataView } from './TableDataView';
import { TableDesignView } from './TableDesignView';
import { QueryDesignView } from './QueryDesignView';
import { FormView } from './FormView';
import { ReportView } from './ReportView';
import { RelationshipsView } from './RelationshipsView';
import { FormWizard } from '@/components/ui/form-wizard';
import { ReportWizard } from '@/components/ui/report-wizard';
import { QueryWizard } from '@/components/ui/query-wizard';
import { CSVImportModal } from '@/components/ui/csv-import-modal';
import { ObjectTabBar, ObjectTab } from '@/components/ui/object-tab-bar';
import { TabBarProvider } from '@/contexts/tab-bar-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const SESSION_KEY_STORAGE = 'student_session_key';

interface Props {
  token: string;
  initialMode?: 'sql';
}

interface EmbedSnapshot {
  database: {
    id: number;
    name: string;
    userId: string;
    taskDescription?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  tables: Array<{
    id: number;
    name: string;
    databaseId: number;
    fields: Array<{ id: number; name: string; fieldType: string; isRequired: boolean; isPrimaryKey: boolean; sortOrder: number; createdAt: string; updatedAt: string }>;
    createdAt: string;
    updatedAt: string;
  }>;
}

type ActiveView = 'datasheet' | 'design' | 'sql' | 'form' | 'report' | 'relationships' | 'query';

function getOrCreateSessionKey(): string {
  let key = sessionStorage.getItem(SESSION_KEY_STORAGE);
  if (!key) {
    key = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY_STORAGE, key);
  }
  return key;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers as any) },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

export function EmbedView({ token, initialMode }: Props) {
  const { toast } = useToast();
  const [snapshot, setSnapshot] = useState<EmbedSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('datasheet');
  const [resetKey, setResetKey] = useState(0);

  // Forms / Reports / Queries
  const [forms, setForms] = useState<{ id: number; name: string; databaseId: number }[]>([]);
  const [reports, setReports] = useState<{ id: number; name: string; databaseId: number }[]>([]);
  const [queries, setQueries] = useState<{ id: number; name: string; databaseId: number }[]>([]);
  const [activeFormId, setActiveFormId] = useState<number | null>(null);
  const [activeReportId, setActiveReportId] = useState<number | null>(null);

  // Wizard state
  const [formWizardOpen, setFormWizardOpen] = useState(false);
  const [reportWizardOpen, setReportWizardOpen] = useState(false);
  const [queryWizardOpen, setQueryWizardOpen] = useState(false);

  // Quick create (Blank/Auto Form & Report)
  const [quickCreate, setQuickCreate] = useState<{
    type: 'blankForm' | 'autoForm' | 'blankReport' | 'autoReport';
    tableId: number | null;
    name: string;
    busy: boolean;
  } | null>(null);

  // CSV import
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  // SQL mode: temp query for QueryDesignView
  const [tempQueryId, setTempQueryId] = useState<number | null>(null);
  const [tempQueryName] = useState('Query1');
  // When inside SQL mode, navigate between the query editor, a table's datasheet, and design view
  const [sqlSubView, setSqlSubView] = useState<'query' | 'table' | 'design'>('query');

  // Active query for query design view (non-SQL mode)
  const [activeQueryId, setActiveQueryId] = useState<number | null>(null);

  // Object tabs
  const [openTabs, setOpenTabs] = useState<ObjectTab[]>([]);

  const dbId = snapshot?.database.id;

  const getActiveTabKey = useCallback((): string | null => {
    if (activeView === 'form' && activeFormId) return `form-${activeFormId}`;
    if (activeView === 'report' && activeReportId) return `report-${activeReportId}`;
    if (activeView === 'sql') return 'sql';
    if (activeView === 'relationships') return 'relationships';
    if (activeView === 'query' && activeQueryId) return `query-${activeQueryId}`;
    if (activeTableId) return `table-${activeTableId}`;
    return null;
  }, [activeView, activeTableId, activeFormId, activeReportId, activeQueryId]);

  const activeTabKey = useMemo(() => getActiveTabKey(), [getActiveTabKey]);

  const addTab = useCallback((key: string, label: string, objectType: ObjectTab['objectType']) => {
    setOpenTabs(prev => {
      const idx = prev.findIndex(t => t.key === key);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], label };
        return updated;
      }
      return [...prev, { key, url: '', label, objectType }];
    });
  }, []);

  const navigateToObject = useCallback((key: string, objectType: ObjectTab['objectType'], objectId?: number) => {
    switch (objectType) {
      case 'table':
        if (objectId) { setActiveTableId(objectId); setActiveView('datasheet'); }
        break;
      case 'query':
        if (objectId) { setActiveQueryId(objectId); setActiveView('query'); }
        break;
      case 'form':
        if (objectId) { setActiveFormId(objectId); setActiveView('form'); }
        break;
      case 'report':
        if (objectId) { setActiveReportId(objectId); setActiveView('report'); }
        break;
      case 'sql':
        setActiveView('sql');
        break;
    }
  }, []);

  const handleTabSelect = useCallback((tab: ObjectTab) => {
    const parts = tab.key.split('-');
    const objectType = parts[0] as ObjectTab['objectType'];
    const objectId = parts.length > 1 ? parseInt(parts[1]) : undefined;
    navigateToObject(tab.key, objectType, objectId);
  }, [navigateToObject]);

  const handleTabClose = useCallback((key: string) => {
    setOpenTabs(prev => {
      const idx = prev.findIndex(t => t.key === key);
      const next = prev.filter(t => t.key !== key);
      if (key === getActiveTabKey()) {
        if (next.length > 0) {
          const switchTo = next[Math.min(idx, next.length - 1)];
          const parts = switchTo.key.split('-');
          const objectType = parts[0] as ObjectTab['objectType'];
          const objectId = parts.length > 1 ? parseInt(parts[1]) : undefined;
          navigateToObject(switchTo.key, objectType, objectId);
        } else {
          setActiveTableId(null);
          setActiveFormId(null);
          setActiveReportId(null);
          setActiveQueryId(null);
          setActiveView('datasheet');
        }
      }
      return next;
    });
  }, [getActiveTabKey, navigateToObject]);

  const selectTable = useCallback((id: number) => {
    const tbl = snapshot?.tables.find(t => t.id === id);
    const label = tbl?.name ?? 'Table';
    addTab(`table-${id}`, label, 'table');
    setActiveTableId(id);
    if (activeView !== 'design') setActiveView('datasheet');
  }, [snapshot, addTab, activeView]);

  const selectForm = useCallback((id: number) => {
    const f = forms.find(f => f.id === id);
    addTab(`form-${id}`, f?.name ?? 'Form', 'form');
    setActiveFormId(id);
    setActiveView('form');
  }, [forms, addTab]);

  const selectReport = useCallback((id: number) => {
    const r = reports.find(r => r.id === id);
    addTab(`report-${id}`, r?.name ?? 'Report', 'report');
    setActiveReportId(id);
    setActiveView('report');
  }, [reports, addTab]);

  const selectQuery = useCallback((id: number) => {
    const q = queries.find(q => q.id === id);
    addTab(`query-${id}`, q?.name ?? 'Query', 'query');
    setActiveQueryId(id);
    setActiveView('query');
  }, [queries, addTab]);

  async function loadForms(id: number) {
    try { const r = await apiFetch(`/api/ds/databases/${id}/forms`); setForms(r || []); } catch {}
  }
  async function loadReports(id: number) {
    try { const r = await apiFetch(`/api/ds/databases/${id}/reports`); setReports(r || []); } catch {}
  }
  async function loadQueries(id: number) {
    try { const r = await apiFetch(`/api/ds/databases/${id}/queries`); setQueries(r || []); } catch {}
  }

  useEffect(() => {
    const sessionKey = getOrCreateSessionKey();
    setIsLoading(true);
    setError(null);
    fetch(`/api/ds/embeds/${token}`, {
      headers: { 'Content-Type': 'application/json', 'x-session-key': sessionKey }
    })
      .then(r => {
        if (!r.ok) throw new Error('Invalid embed');
        return r.json();
      })
      .then(async (data: EmbedSnapshot) => {
        setSnapshot(data);
        // Load forms/reports/queries for the database
        await Promise.all([loadForms(data.database.id), loadReports(data.database.id), loadQueries(data.database.id)]);
        setActiveTableId(data.tables?.[0]?.id ?? null);
        setIsLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setIsLoading(false);
      });
  }, [token, resetKey]);

  // ── Quick-create (Blank/Auto Form & Report) ─────────────────────────────
  const openQuickCreate = (type: 'blankForm' | 'autoForm' | 'blankReport' | 'autoReport') => {
    if (!snapshot) return;
    const isForm = type === 'blankForm' || type === 'autoForm';
    const baseName = isForm ? 'Form' : 'Report';
    const collection = isForm ? forms : reports;
    const defaultName = `${baseName}${collection.length + 1}`;
    const firstTable = snapshot.tables?.[0];
    setQuickCreate({ type, tableId: firstTable?.id ?? null, name: defaultName, busy: false });
  };

  const doQuickCreate = async () => {
    if (!quickCreate || !quickCreate.tableId || !dbId) return;
    setQuickCreate(q => q ? { ...q, busy: true } : q);
    try {
      const { type, tableId, name } = quickCreate;
      const isForm = type === 'blankForm' || type === 'autoForm';
      const isBlank = type === 'blankForm' || type === 'blankReport';
      let fields: any[] = [];
      if (!isBlank) {
        try {
          const td = await apiFetch(`/api/ds/databases/${dbId}/tables/${tableId}`);
          const rawFields = [...(td.fields || [])].sort((a: any, b: any) => a.sortOrder - b.sortOrder);
          fields = rawFields.map((f: any, i: number) => ({ id: f.id, name: f.name, label: f.name, visible: true, sortOrder: i }));
        } catch { /* keep empty */ }
      }
      const definition = isForm
        ? { tableId, layout: 'columnar', title: name, fields }
        : { tableId, layout: 'tabular', title: name, fields, sortBy: null, groupBy: null };
      if (isForm) {
        const created = await apiFetch(`/api/ds/databases/${dbId}/forms`, { method: 'POST', body: JSON.stringify({ name, definition }) });
        await loadForms(dbId);
        setQuickCreate(null);
        if (created?.id) { addTab(`form-${created.id}`, name, 'form'); setActiveFormId(created.id); setActiveView('form'); }
      } else {
        const created = await apiFetch(`/api/ds/databases/${dbId}/reports`, { method: 'POST', body: JSON.stringify({ name, definition }) });
        await loadReports(dbId);
        setQuickCreate(null);
        if (created?.id) { addTab(`report-${created.id}`, name, 'report'); setActiveReportId(created.id); setActiveView('report'); }
      }
    } catch {
      toast({ title: 'Failed to create', variant: 'destructive' });
      setQuickCreate(q => q ? { ...q, busy: false } : q);
    }
  };

  async function handleReset() {
    const sessionKey = sessionStorage.getItem(SESSION_KEY_STORAGE);
    if (sessionKey) {
      await fetch(`/api/ds/embeds/${token}/reset`, {
        method: 'POST',
        headers: { 'x-session-key': sessionKey }
      });
      sessionStorage.removeItem(SESSION_KEY_STORAGE);
    }
    setSnapshot(null);
    setActiveTableId(null);
    setTempQueryId(null);
    setSqlSubView('query');
    setActiveView('datasheet');
    setForms([]);
    setReports([]);
    setQueries([]);
    setActiveFormId(null);
    setActiveReportId(null);
    setResetKey(k => k + 1);
  }

  // ── Create a new table (for empty-database state) ───────────────────────
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  async function handleCreateTable() {
    if (!dbId || isCreatingTable) return;
    setIsCreatingTable(true);
    try {
      const newTable = await apiFetch(`/api/ds/databases/${dbId}/tables`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Table1' }),
      });
      // Reload snapshot to pick up the new table
      const sessionKey = sessionStorage.getItem(SESSION_KEY_STORAGE);
      const updated: EmbedSnapshot = await fetch(`/api/ds/embeds/${token}`, {
        headers: { 'Content-Type': 'application/json', ...(sessionKey ? { 'x-session-key': sessionKey } : {}) }
      }).then(r => r.json());
      setSnapshot(updated);
      // Auto-navigate to Design View for the new table
      const tbl = updated.tables.find((t: any) => t.id === newTable.id) ?? updated.tables[0];
      if (tbl) {
        addTab(`table-${tbl.id}`, tbl.name, 'table');
        setActiveTableId(tbl.id);
        setActiveView('design');
      }
    } catch {
      toast({ title: 'Could not create table', variant: 'destructive' });
    } finally {
      setIsCreatingTable(false);
    }
  }

  // ── Wizard finish handlers ───────────────────────────────────────────────
  async function handleFormWizardFinish(name: string, definition: any, openMode: 'view' | 'modify') {
    if (!dbId) return;
    try {
      const form = await apiFetch(`/api/ds/databases/${dbId}/forms`, {
        method: 'POST',
        body: JSON.stringify({ name, definition })
      });
      await loadForms(dbId);
      setFormWizardOpen(false);
      if (form?.id) {
        addTab(`form-${form.id}`, name, 'form');
        setActiveFormId(form.id);
        setActiveView('form');
      }
    } catch {
      toast({ title: 'Failed to create form', variant: 'destructive' });
    }
  }

  async function handleReportWizardFinish(name: string, definition: any, openMode: 'preview' | 'modify') {
    if (!dbId) return;
    try {
      const report = await apiFetch(`/api/ds/databases/${dbId}/reports`, {
        method: 'POST',
        body: JSON.stringify({ name, definition })
      });
      await loadReports(dbId);
      setReportWizardOpen(false);
      if (report?.id) {
        addTab(`report-${report.id}`, name, 'report');
        setActiveReportId(report.id);
        setActiveView('report');
      }
    } catch {
      toast({ title: 'Failed to create report', variant: 'destructive' });
    }
  }

  async function handleQueryWizardFinish(name: string, definition: any, openMode: 'view' | 'modify') {
    if (!dbId) return;
    try {
      const q = await apiFetch(`/api/ds/databases/${dbId}/queries`, {
        method: 'POST',
        body: JSON.stringify({ name, definition })
      });
      await loadQueries(dbId);
      setQueryWizardOpen(false);
      if (q?.id) {
        addTab(`query-${q.id}`, name, 'query');
        setActiveQueryId(q.id);
        setActiveView('query');
      }
    } catch {
      toast({ title: 'Failed to create query', variant: 'destructive' });
    }
  }

  // ── Create SQL query and switch to SQL editor ───────────────────────────
  async function handleCreateSqlQuery() {
    if (!dbId) return;
    if (tempQueryId) {
      addTab('sql', 'SQL View', 'sql');
      setSqlSubView('query');
      setActiveView('sql');
      return;
    }
    try {
      const res = await fetch(`/api/ds/databases/${dbId}/queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Query1', definition: { tables: [], columns: [] } })
      });
      if (res.ok) {
        const q = await res.json();
        setTempQueryId(q.id);
        addTab('sql', 'SQL View', 'sql');
        setSqlSubView('query');
        setActiveView('sql');
      }
    } catch {
      toast({ title: 'Failed to open SQL editor', variant: 'destructive' });
    }
  }

  // ── Shared wizard callbacks ──────────────────────────────────────────────
  const wizardProps = {
    onQueryWizard: () => setQueryWizardOpen(true),
    onCreateSqlQuery: handleCreateSqlQuery,
    onCreateForm: () => setFormWizardOpen(true),
    onCreateBlankForm: () => openQuickCreate('blankForm'),
    onCreateAutoForm: () => openQuickCreate('autoForm'),
    onCreateReport: () => setReportWizardOpen(true),
    onCreateBlankReport: () => openQuickCreate('blankReport'),
    onCreateAutoReport: () => openQuickCreate('autoReport'),
    onOpenRelationships: () => setActiveView('relationships'),
    onImportCSV: () => setCsvImportOpen(true),
    onExportData: async () => {
      if (!snapshot || !activeTableId || !dbId) return;
      const tbl = snapshot.tables.find(t => t.id === activeTableId);
      if (!tbl) return;
      try {
        const data = await apiFetch(`/api/ds/databases/${dbId}/tables/${activeTableId}/records`);
        const records: any[] = data?.records || data || [];
        const flds = [...tbl.fields].sort((a, b) => a.sortOrder - b.sortOrder);
        const header = flds.map(f => f.name).join(',');
        const rows = records.map((r: any) => {
          const rec = r.data || r;
          return flds.map(f => {
            const v = rec[f.name];
            if (v === null || v === undefined) return '';
            const s = String(v);
            return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
          }).join(',');
        });
        const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${tbl.name}.csv`; a.click();
        URL.revokeObjectURL(url);
      } catch { toast({ title: 'Export failed', variant: 'destructive' }); }
    },
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f3f2f1] font-bold text-gray-500">
        Loading...
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Error: Invalid or expired embed token.
      </div>
    );
  }

  const wizardDialogs = (
    <>
      {formWizardOpen && (
        <FormWizard
          open={formWizardOpen}
          onOpenChange={setFormWizardOpen}
          tables={snapshot.tables}
          databaseId={snapshot.database.id}
          apiFetch={apiFetch}
          onFinish={handleFormWizardFinish}
        />
      )}
      {reportWizardOpen && (
        <ReportWizard
          open={reportWizardOpen}
          onOpenChange={setReportWizardOpen}
          tables={snapshot.tables}
          databaseId={snapshot.database.id}
          apiFetch={apiFetch}
          onFinish={handleReportWizardFinish}
        />
      )}
      {queryWizardOpen && (
        <QueryWizard
          open={queryWizardOpen}
          onOpenChange={setQueryWizardOpen}
          tables={snapshot.tables}
          databaseId={snapshot.database.id}
          apiFetch={apiFetch}
          onFinish={handleQueryWizardFinish}
        />
      )}

      {/* Quick Create (Blank/Auto Form & Report) */}
      {quickCreate && (() => {
        const isForm = quickCreate.type === 'blankForm' || quickCreate.type === 'autoForm';
        const isBlank = quickCreate.type === 'blankForm' || quickCreate.type === 'blankReport';
        const titles: Record<string, string> = {
          blankForm: 'Create Blank Form', autoForm: 'Create Auto Form',
          blankReport: 'Create Report Design', autoReport: 'Create Auto Report',
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
                    {(snapshot.tables || []).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                {isBlank && (
                  <p className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                    The {isForm ? 'form' : 'report'} will open so you can view and then switch to Design View to add fields.
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

      {/* CSV Import */}
      {csvImportOpen && dbId && (
        <CSVImportModal
          open={csvImportOpen}
          onOpenChange={setCsvImportOpen}
          databaseId={dbId}
          onSuccess={() => {
            setCsvImportOpen(false);
            if (dbId) {
              apiFetch(`/api/ds/embeds/${token}`).then(d => d && setSnapshot(d)).catch(() => {});
            }
          }}
        />
      )}
    </>
  );

  const tabBarEl = (
    <ObjectTabBar
      tabs={openTabs}
      activeKey={activeTabKey}
      onSelect={handleTabSelect}
      onClose={handleTabClose}
    />
  );

  const renderContent = () => {
    // ── Form view ──────────────────────────────────────────────────────────
    if (activeView === 'form' && activeFormId) {
      return (
        <FormView
          databaseId={snapshot.database.id}
          formId={activeFormId}
          db={snapshot.database}
          tables={snapshot.tables}
          forms={forms}
          reports={reports}
          queries={queries}
          isStudentMode={true}
          onSelectTable={selectTable}
          onSelectForm={selectForm}
          onSelectReport={selectReport}
          onSelectQuery={selectQuery}
          onDeleteForm={() => { handleTabClose(`form-${activeFormId}`); loadForms(snapshot.database.id); }}
          {...wizardProps}
        />
      );
    }

    // ── Report view ────────────────────────────────────────────────────────
    if (activeView === 'report' && activeReportId) {
      return (
        <ReportView
          databaseId={snapshot.database.id}
          reportId={activeReportId}
          db={snapshot.database}
          tables={snapshot.tables}
          forms={forms}
          reports={reports}
          queries={queries}
          isStudentMode={true}
          onSelectTable={selectTable}
          onSelectForm={selectForm}
          onSelectReport={selectReport}
          onSelectQuery={selectQuery}
          onDeleteReport={() => { handleTabClose(`report-${activeReportId}`); loadReports(snapshot.database.id); }}
          {...wizardProps}
        />
      );
    }

    // ── Query design view (non-SQL mode) ────────────────────────────────────
    if (activeView === 'query' && activeQueryId) {
      return (
        <QueryDesignView
          databaseId={snapshot.database.id}
          queryId={activeQueryId}
          db={snapshot.database as any}
          tables={snapshot.tables as any}
          isStudentMode={true}
          queries={queries}
          forms={forms}
          reports={reports}
          onSelectTable={selectTable}
          onSelectQuery={selectQuery}
          {...wizardProps}
        />
      );
    }

    // ── SQL mode ──────────────────────────────────────────────────────────
    if (activeView === 'sql') {
      if (!tempQueryId) {
        return (
          <div className="h-screen w-screen flex items-center justify-center bg-[#f3f2f1] font-bold text-gray-500">
            Loading query editor...
          </div>
        );
      }

      if (sqlSubView === 'design' && activeTableId) {
        return (
          <TableDesignView
            databaseId={snapshot.database.id}
            tableId={activeTableId}
            db={snapshot.database}
            tables={snapshot.tables}
            onDeleteTable={() => {}}
            isStudentMode={true}
            onSwitchToDatasheet={() => setSqlSubView('table')}
            onReset={handleReset}
            onSelectTable={selectTable}
            queries={queries}
            forms={forms}
            reports={reports}
            {...wizardProps}
          />
        );
      }

      if (sqlSubView === 'table' && activeTableId) {
        return (
          <TableDataView
            databaseId={snapshot.database.id}
            tableId={activeTableId}
            db={snapshot.database}
            tables={snapshot.tables}
            isStudentMode={true}
            onSelectTable={(id) => setActiveTableId(id)}
            onSelectQuery={() => setSqlSubView('query')}
            queries={[{ id: tempQueryId, name: tempQueryName, databaseId: snapshot.database.id }]}
            forms={forms}
            reports={reports}
            onReset={handleReset}
            onSwitchToDesign={() => setSqlSubView('design')}
            {...wizardProps}
          />
        );
      }

      return (
        <QueryDesignView
          databaseId={snapshot.database.id}
          queryId={tempQueryId}
          db={snapshot.database as any}
          tables={snapshot.tables as any}
          isStudentMode={true}
          initialView="sql"
          queries={[{ id: tempQueryId, name: tempQueryName, databaseId: snapshot.database.id }]}
          forms={forms}
          reports={reports}
          onSelectTable={(id) => { setActiveTableId(id); setSqlSubView('table'); }}
          onSelectQuery={() => setSqlSubView('query')}
          {...wizardProps}
        />
      );
    }

    // ── Relationships view ──────────────────────────────────────────────────
    if (activeView === 'relationships') {
      return (
        <RelationshipsView
          databaseId={snapshot.database.id}
          db={snapshot.database}
          tables={snapshot.tables as any}
          forms={forms}
          reports={reports}
          queries={queries}
          isStudentMode={true}
          onSelectTable={selectTable}
          {...wizardProps}
        />
      );
    }

    // ── Table datasheet / design mode ────────────────────────────────────────
    if (activeTableId) {
      if (activeView === 'design') {
        return (
          <TableDesignView
            databaseId={snapshot.database.id}
            tableId={activeTableId}
            db={snapshot.database}
            tables={snapshot.tables}
            onDeleteTable={() => {}}
            isStudentMode={true}
            onSwitchToDatasheet={() => setActiveView('datasheet')}
            onReset={handleReset}
            onSelectTable={selectTable}
            queries={queries}
            forms={forms}
            reports={reports}
            {...wizardProps}
          />
        );
      }
      return (
        <TableDataView
          databaseId={snapshot.database.id}
          tableId={activeTableId}
          db={snapshot.database}
          tables={snapshot.tables}
          isStudentMode={true}
          onSelectTable={selectTable}
          onSelectQuery={selectQuery}
          forms={forms}
          reports={reports}
          queries={queries}
          onReset={handleReset}
          onSwitchToDesign={() => setActiveView('design')}
          onSelectForm={selectForm}
          onSelectReport={selectReport}
          {...wizardProps}
        />
      );
    }

    // ── No table selected — default landing ─────────────────────────────────
    const noTables = snapshot.tables.length === 0;

    const ribbon = (
      <Ribbon
        title={snapshot.database.name}
        tabs={[{
          name: 'Home',
          content: noTables ? (
            <RibbonGroup name="Tables">
              <RibbonButton
                icon={<TableIcon size={32} />}
                label={isCreatingTable ? 'Creating…' : 'Table Design'}
                onClick={handleCreateTable}
                disabled={isCreatingTable}
                title="Create a new blank table in Design View"
              />
            </RibbonGroup>
          ) : (
            <div className="text-gray-400 p-2 italic text-sm">
              Select a table from the left panel to begin
            </div>
          )
        }]}
      />
    );

    return (
      <Shell
        title={snapshot.database.name}
        ribbon={ribbon}
        isEmbed={true}
        sidebar={
          <Sidebar
            tables={snapshot.tables}
            databaseId={snapshot.database.id}
            isStudentMode={true}
            onSelectTable={selectTable}
            forms={forms}
            reports={reports}
            queries={queries}
            onSelectForm={selectForm}
            onSelectReport={selectReport}
            onSelectQuery={selectQuery}
          />
        }
      >
        {noTables ? (
          <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 bg-[#f3f2f1] p-8 text-center">
            <TableIcon size={48} className="mb-4 text-gray-300" />
            <h2 className="text-2xl text-gray-500 font-light mb-3">No tables yet</h2>
            <p className="max-w-sm text-gray-400 mb-6">
              This database is empty. Click <strong className="text-gray-500">Table Design</strong> in the ribbon above to create your first table.
            </p>
            <button
              onClick={handleCreateTable}
              disabled={isCreatingTable}
              className="px-5 py-2 bg-[#C42B1C] text-white rounded text-sm font-medium hover:bg-[#9B2118] disabled:opacity-50 transition-colors"
            >
              {isCreatingTable ? 'Creating…' : 'Create Table'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 bg-[#f3f2f1] p-8 text-center">
            <h2 className="text-2xl text-gray-500 font-light mb-4">Select a table to begin</h2>
            <p className="max-w-md text-gray-400">
              Choose a table from the navigation pane on the left to start viewing and editing data.
            </p>
          </div>
        )}
      </Shell>
    );
  };

  return (
    <TabBarProvider value={tabBarEl}>
      {renderContent()}
      {wizardDialogs}
    </TabBarProvider>
  );
}
