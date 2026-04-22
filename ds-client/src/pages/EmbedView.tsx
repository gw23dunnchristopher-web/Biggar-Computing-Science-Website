import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Ribbon, RibbonGroup, RibbonButton, ExtraRibbonTabsProvider } from '@/components/layout/Ribbon';
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
import { ClipboardList, Send, Loader2, Sparkles } from 'lucide-react';
import { DS_ICON_SIZE_LARGE } from '@/components/ui/ds-icons';

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

  // Task / submit-for-marking panel
  const [taskOpen, setTaskOpen] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [markScore, setMarkScore] = useState<{ mark: number | null; maxMark: number } | null>(null);

  const taskBullets = useMemo(() => {
    const raw = (snapshot?.database?.taskDescription || '').trim();
    if (!raw) return [] as string[];
    return raw.split(/\r?\n/)
      .map(l => l.replace(/^[\s•\-\*\u2022]+/, '').trim())
      .filter(Boolean);
  }, [snapshot?.database?.taskDescription]);

  const extraRibbonTabs = useMemo(() => {
    if (taskBullets.length === 0) return [];
    const content = (
      <RibbonGroup name="Task">
        <RibbonButton
          icon={<ClipboardList size={DS_ICON_SIZE_LARGE} />}
          label="View Task"
          onClick={() => setTaskOpen(true)}
          title="Show the task instructions for this sandbox"
        />
        <RibbonButton
          icon={submitting ? <Loader2 size={DS_ICON_SIZE_LARGE} className="animate-spin" /> : <Send size={DS_ICON_SIZE_LARGE} />}
          label={submitting ? 'Marking…' : (feedback ? 'Resubmit' : 'Submit for Marking')}
          onClick={() => setConfirmSubmitOpen(true)}
          disabled={submitting}
          title="Send your current database to the AI for marking"
          wide
        />
        {feedback && (
          <RibbonButton
            icon={<Sparkles size={DS_ICON_SIZE_LARGE} />}
            label="View Feedback"
            onClick={() => setTaskOpen(true)}
            title="Open the most recent AI feedback"
          />
        )}
      </RibbonGroup>
    );
    return [{ name: 'Task', content }];
  }, [taskBullets.length, submitting, feedback]);

  async function handleSubmitForMarking() {
    if (!snapshot) return;
    setSubmitting(true);
    setFeedback(null);
    setMarkScore(null);
    try {
      const res = await fetch('/api/ds/grade-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-key': getOrCreateSessionKey() },
        body: JSON.stringify({
          sandboxDatabaseId: snapshot.database.id,
          taskDescription: snapshot.database.taskDescription || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Marking failed');
      setFeedback(data.feedback || 'No feedback returned.');
      if (typeof data.maxMark === 'number') {
        setMarkScore({ mark: typeof data.mark === 'number' ? data.mark : null, maxMark: data.maxMark });
      }
    } catch (e: any) {
      setFeedback(`⚠️ ${e?.message || 'Could not submit for marking. Please try again.'}`);
    } finally {
      setSubmitting(false);
    }
  }

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
    setActiveFormId(null);
    setActiveReportId(null);
    setActiveQueryId(null);
    setActiveView('datasheet');
  }, [snapshot, addTab]);

  const refreshSnapshot = useCallback(async () => {
    try {
      const sessionKey = sessionStorage.getItem(SESSION_KEY_STORAGE);
      const fresh = await apiFetch(`/api/ds/embeds/${token}`, {
        headers: sessionKey ? { 'x-session-key': sessionKey } : {},
      });
      if (fresh) {
        setSnapshot(fresh);
        await Promise.all([
          loadForms(fresh.database.id),
          loadReports(fresh.database.id),
          loadQueries(fresh.database.id),
        ]);
      }
    } catch {}
  }, [token]);

  const selectTableDesign = useCallback((id: number) => {
    console.log('[DataSculptor] selectTableDesign called for table id', id);
    const tbl = snapshot?.tables.find(t => t.id === id);
    const label = tbl?.name ?? 'Table';
    addTab(`table-${id}`, label, 'table');
    setActiveTableId(id);
    setActiveFormId(null);
    setActiveReportId(null);
    setActiveQueryId(null);
    setActiveView('design');
  }, [snapshot, addTab]);

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

  const [deleteTableDialog, setDeleteTableDialog] = useState<{ id: number; name: string } | null>(null);
  const [isDeletingTable, setIsDeletingTable] = useState(false);

  const handleDeleteTableEmbed = useCallback((id: number) => {
    if (!snapshot) return;
    const tbl = snapshot.tables.find(t => t.id === id);
    setDeleteTableDialog({ id, name: tbl?.name ?? 'Table' });
  }, [snapshot]);

  const confirmDeleteTable = useCallback(async () => {
    if (!snapshot || !deleteTableDialog) return;
    const { id } = deleteTableDialog;
    setIsDeletingTable(true);
    try {
      await apiFetch(`/api/ds/databases/${snapshot.database.id}/tables/${id}`, { method: 'DELETE' });
      setOpenTabs(prev => prev.filter(t => t.key !== `table-${id}`));
      if (activeTableId === id) {
        setActiveTableId(null);
        setActiveView('datasheet');
      }
      const sessionKey = sessionStorage.getItem(SESSION_KEY_STORAGE);
      const fresh = await apiFetch(`/api/ds/embeds/${token}`, {
        headers: sessionKey ? { 'x-session-key': sessionKey } : {},
      });
      if (fresh) setSnapshot(fresh);
      setDeleteTableDialog(null);
    } catch (e) {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setIsDeletingTable(false);
    }
  }, [snapshot, deleteTableDialog, activeTableId, token, toast]);

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
    let cancelled = false;
    const sessionKey = getOrCreateSessionKey();
    setIsLoading(true);
    setError(null);

    const attempt = async (tryNum: number): Promise<void> => {
      try {
        const r = await fetch(`/api/ds/embeds/${token}`, {
          headers: { 'Content-Type': 'application/json', 'x-session-key': sessionKey }
        });
        if (!r.ok) {
          throw new Error(r.status === 404 ? 'not-found' : `http-${r.status}`);
        }
        const data: EmbedSnapshot = await r.json();
        if (cancelled) return;
        setSnapshot(data);
        try { window.parent?.postMessage({ type: 'ds-embed-ready', token }, '*'); } catch {}
        await Promise.all([loadForms(data.database.id), loadReports(data.database.id), loadQueries(data.database.id)]);
        if (cancelled) return;
        const firstTable = data.tables?.[0];
        if (firstTable) {
          setActiveTableId(firstTable.id);
          setActiveView('datasheet');
          setOpenTabs([{ key: `table-${firstTable.id}`, url: '', label: firstTable.name, objectType: 'table' }]);
        }
        setIsLoading(false);
      } catch (e: any) {
        // Retry once on transient/network errors (common on slow mobile data).
        const msg = String(e?.message || e);
        const transient = msg !== 'not-found' && tryNum < 2;
        if (transient && !cancelled) {
          await new Promise(r => setTimeout(r, 800));
          if (!cancelled) return attempt(tryNum + 1);
        }
        if (!cancelled) {
          setError(msg);
          setIsLoading(false);
        }
      }
    };
    attempt(1);
    return () => { cancelled = true; };
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
    setFeedback(null);
    setMarkScore(null);
    setTaskOpen(false);
    setConfirmSubmitOpen(false);
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
        setActiveView('datasheet');
      }
    } catch {
      toast({ title: 'Could not create table', variant: 'destructive' });
    } finally {
      setIsCreatingTable(false);
    }
  }

  // ── "Name this table" dialog (shown when switching to Design View for the
  //    first time on an auto-named Table) ────────
  const [nameTableDialog, setNameTableDialog] = useState<{ tableId: number } | null>(null);
  const [nameTableInput, setNameTableInput] = useState('');

  function handleSwitchToDesign() {
    if (!activeTableId || !snapshot) { setActiveView('design'); return; }
    const tbl = snapshot.tables.find(t => t.id === activeTableId);
    if (tbl && /^Table\d+$/i.test(tbl.name)) {
      setNameTableInput(tbl.name);
      setNameTableDialog({ tableId: tbl.id });
    } else {
      setActiveView('design');
    }
  }

  async function confirmNameTable() {
    if (!nameTableDialog || !dbId) return;
    const name = nameTableInput.trim();
    if (!name) return;
    try {
      await apiFetch(`/api/ds/databases/${dbId}/tables/${nameTableDialog.tableId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      setSnapshot(prev => prev ? {
        ...prev,
        tables: prev.tables.map(t => t.id === nameTableDialog.tableId ? { ...t, name } : t)
      } : prev);
      addTab(`table-${nameTableDialog.tableId}`, name, 'table');
      setNameTableDialog(null);
      setActiveView('design');
    } catch {
      toast({ title: 'Could not save table name', variant: 'destructive' });
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
    onCreateTable: handleCreateTable,
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
    const isNotFound = error === 'not-found';
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="text-red-600 font-bold mb-2">
          {isNotFound
            ? 'This database exercise is no longer available.'
            : "Couldn't load the database."}
        </div>
        <div className="text-sm text-gray-600 mb-4">
          {isNotFound
            ? 'The embed token in this page is missing from the server. Please refresh the lesson page.'
            : 'This usually means the connection dropped. Try again in a moment.'}
        </div>
        {!isNotFound && (
          <button
            onClick={() => { setError(null); setResetKey(k => k + 1); }}
            className="px-4 py-2 bg-[#C42B1C] text-white rounded font-semibold hover:bg-[#9B2118]"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  const hasTask = taskBullets.length > 0;

  const taskDialogs = hasTask ? (
    <>
      {/* Instructions / feedback panel */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList size={18} className="text-[#C42B1C]" />
              Task Instructions
            </DialogTitle>
            <DialogDescription>
              Complete each requirement in your sandbox, then use the Submit button on the Task ribbon to send it for AI marking.
            </DialogDescription>
          </DialogHeader>

          <div className="border border-amber-200 bg-amber-50 rounded-md p-3">
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800 marker:text-amber-700">
              {taskBullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>

          {markScore && markScore.mark !== null && (
            <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50 rounded-md px-4 py-3">
              <div className="text-sm font-medium text-emerald-900">Your mark</div>
              <div className="text-2xl font-bold text-emerald-700 tabular-nums">
                {markScore.mark} <span className="text-emerald-500 font-medium">/ {markScore.maxMark}</span>
              </div>
            </div>
          )}

          {feedback && (
            <div className="border border-blue-200 bg-blue-50 rounded-md p-3 max-h-72 overflow-y-auto">
              <div className="flex items-center gap-2 text-blue-800 font-medium text-sm mb-2">
                <Sparkles size={14} /> AI Feedback
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {feedback.replace(/^\s*\**\s*\d*\.?\s*\**\s*Mark\**\s*:?.*?(\n|$)\s*\d+\s*\/\s*\d+\s*(\n|$)?/i, '')
                         .replace(/^\s*\**\s*\d*\.?\s*\**\s*Mark\**\s*:?[^\n]*\n?/i, '')
                         .trim()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* "Are you sure?" submission confirmation */}
      <Dialog open={confirmSubmitOpen} onOpenChange={(o) => { if (!submitting) setConfirmSubmitOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send size={18} className="text-[#C42B1C]" />
              Submit for AI Marking?
            </DialogTitle>
            <DialogDescription>
              This will send the current state of your database to the AI marker.
              {feedback ? ' Your previous feedback will be replaced.' : ''} Make sure you have completed all the bullet points in the task before submitting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmSubmitOpen(false)} disabled={submitting}>Cancel</Button>
            <Button
              onClick={async () => {
                setConfirmSubmitOpen(false);
                await handleSubmitForMarking();
                setTaskOpen(true);
              }}
              disabled={submitting}
              className="bg-[#C42B1C] hover:bg-[#9B2118] text-white"
              data-testid="button-confirm-submit-marking"
            >
              {submitting ? (<><Loader2 size={14} className="mr-1.5 animate-spin" /> Marking…</>)
                          : (<><Send size={14} className="mr-1.5" /> Yes, submit</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  ) : null;

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

      {/* "Save Table" name prompt — shown on first switch to Design View */}
      {nameTableDialog && (
        <Dialog open onOpenChange={v => { if (!v) setNameTableDialog(null); }}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Save Table</DialogTitle>
              <DialogDescription>
                You must save the table before you can switch to Design View. Enter a name for the table.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Input
                value={nameTableInput}
                onChange={e => setNameTableInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmNameTable(); }}
                autoFocus
                placeholder="e.g. Designers"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setNameTableDialog(null)}>Cancel</Button>
              <Button
                onClick={confirmNameTable}
                disabled={!nameTableInput.trim()}
                className="bg-[#C42B1C] hover:bg-[#9B2118]"
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete table confirmation */}
      {deleteTableDialog && (
        <Dialog open onOpenChange={v => { if (!v && !isDeletingTable) setDeleteTableDialog(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete table</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the table <strong>"{deleteTableDialog.name}"</strong>?
                This will permanently remove the table and all of its records. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteTableDialog(null)} disabled={isDeletingTable}>
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteTable}
                disabled={isDeletingTable}
                className="bg-[#C42B1C] hover:bg-[#9B2118]"
              >
                {isDeletingTable ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
          onSelectTableDesign={selectTableDesign}
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
          onSelectTableDesign={selectTableDesign}
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
          onSelectTableDesign={selectTableDesign}
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
            onDeleteTable={handleDeleteTableEmbed}
            isStudentMode={true}
            onSwitchToDatasheet={() => setSqlSubView('table')}
            onReset={handleReset}
            onSelectTable={selectTable}
            onSelectTableDesign={selectTableDesign}
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
          onSelectTableDesign={selectTableDesign}
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
            onDeleteTable={handleDeleteTableEmbed}
            isStudentMode={true}
            onSwitchToDatasheet={() => setActiveView('datasheet')}
            onReset={handleReset}
            onSelectTable={selectTable}
            onSelectTableDesign={selectTableDesign}
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
          onDeleteTable={handleDeleteTableEmbed}
          onRefresh={refreshSnapshot}
          onSelectTable={selectTable}
          onSelectTableDesign={selectTableDesign}
          onSelectQuery={selectQuery}
          forms={forms}
          reports={reports}
          queries={queries}
          onReset={handleReset}
          onSwitchToDesign={handleSwitchToDesign}
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
            onSelectTableDesign={selectTableDesign}
            onDeleteTable={handleDeleteTableEmbed}
            forms={forms}
            reports={reports}
            queries={queries}
            onSelectForm={selectForm}
            onSelectReport={selectReport}
            onSelectQuery={selectQuery}
            onRefresh={refreshSnapshot}
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
      <ExtraRibbonTabsProvider tabs={extraRibbonTabs}>
        {renderContent()}
      </ExtraRibbonTabsProvider>
      {wizardDialogs}
      {taskDialogs}
    </TabBarProvider>
  );
}
