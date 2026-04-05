import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Ribbon } from '@/components/layout/Ribbon';
import { Sidebar } from '@/components/layout/Sidebar';
import { TableDataView } from './TableDataView';
import { TableDesignView } from './TableDesignView';
import { QueryDesignView } from './QueryDesignView';
import { FormView } from './FormView';
import { ReportView } from './ReportView';
import { FormWizard } from '@/components/ui/form-wizard';
import { ReportWizard } from '@/components/ui/report-wizard';
import { QueryWizard } from '@/components/ui/query-wizard';
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

type ActiveView = 'datasheet' | 'design' | 'sql' | 'form' | 'report';

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
  const [activeView, setActiveView] = useState<ActiveView>(initialMode === 'sql' ? 'sql' : 'datasheet');
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

  // SQL mode: temp query for QueryDesignView
  const [tempQueryId, setTempQueryId] = useState<number | null>(null);
  const [tempQueryName] = useState('Query1');
  // When inside SQL mode, navigate between the query editor, a table's datasheet, and design view
  const [sqlSubView, setSqlSubView] = useState<'query' | 'table' | 'design'>('query');

  const dbId = snapshot?.database.id;

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
        if (initialMode !== 'sql') {
          setActiveTableId(data.tables?.[0]?.id ?? null);
        } else {
          // Create a temp query in the sandboxed database
          try {
            const res = await fetch(`/api/ds/databases/${data.database.id}/queries`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: 'Query1', definition: { tables: [], columns: [] } })
            });
            if (res.ok) {
              const q = await res.json();
              setTempQueryId(q.id);
            }
          } catch {}
        }
        setIsLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setIsLoading(false);
      });
  }, [token, resetKey]);

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
    setActiveView(initialMode === 'sql' ? 'sql' : 'datasheet');
    setForms([]);
    setReports([]);
    setQueries([]);
    setActiveFormId(null);
    setActiveReportId(null);
    setResetKey(k => k + 1);
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
      if (openMode === 'view' && form?.id) {
        setActiveFormId(form.id);
        setActiveView('form');
      }
    } catch {
      toast({ title: 'Failed to create form', variant: 'destructive' });
    }
  }

  async function handleReportWizardFinish(name: string, definition: any, openMode: 'view' | 'modify') {
    if (!dbId) return;
    try {
      const report = await apiFetch(`/api/ds/databases/${dbId}/reports`, {
        method: 'POST',
        body: JSON.stringify({ name, definition })
      });
      await loadReports(dbId);
      setReportWizardOpen(false);
      if (openMode === 'view' && report?.id) {
        setActiveReportId(report.id);
        setActiveView('report');
      }
    } catch {
      toast({ title: 'Failed to create report', variant: 'destructive' });
    }
  }

  async function handleQueryWizardFinish(name: string, definition: any) {
    if (!dbId) return;
    try {
      await apiFetch(`/api/ds/databases/${dbId}/queries`, {
        method: 'POST',
        body: JSON.stringify({ name, definition })
      });
      await loadQueries(dbId);
      setQueryWizardOpen(false);
    } catch {
      toast({ title: 'Failed to create query', variant: 'destructive' });
    }
  }

  // ── Shared wizard callbacks ──────────────────────────────────────────────
  const wizardProps = {
    onQueryWizard: () => setQueryWizardOpen(true),
    onCreateForm: () => setFormWizardOpen(true),
    onCreateReport: () => setReportWizardOpen(true),
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
    </>
  );

  // ── Form view ──────────────────────────────────────────────────────────────
  if (activeView === 'form' && activeFormId) {
    return (
      <>
        <FormView
          databaseId={snapshot.database.id}
          formId={activeFormId}
          db={snapshot.database}
          tables={snapshot.tables}
          forms={forms}
          reports={reports}
          queries={queries}
          isStudentMode={true}
          onDeleteForm={() => { setActiveFormId(null); setActiveView('datasheet'); loadForms(snapshot.database.id); }}
          {...wizardProps}
        />
        {wizardDialogs}
      </>
    );
  }

  // ── Report view ────────────────────────────────────────────────────────────
  if (activeView === 'report' && activeReportId) {
    return (
      <>
        <ReportView
          databaseId={snapshot.database.id}
          reportId={activeReportId}
          db={snapshot.database}
          tables={snapshot.tables}
          forms={forms}
          reports={reports}
          queries={queries}
          isStudentMode={true}
          onDeleteReport={() => { setActiveReportId(null); setActiveView('datasheet'); loadReports(snapshot.database.id); }}
          {...wizardProps}
        />
        {wizardDialogs}
      </>
    );
  }

  // ── SQL mode ──────────────────────────────────────────────────────────────
  if (activeView === 'sql') {
    if (!tempQueryId) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-[#f3f2f1] font-bold text-gray-500">
          Loading query editor...
        </div>
      );
    }

    // Student clicked "Design View" from a table in SQL mode
    if (sqlSubView === 'design' && activeTableId) {
      return (
        <>
          <TableDesignView
            databaseId={snapshot.database.id}
            tableId={activeTableId}
            db={snapshot.database}
            tables={snapshot.tables}
            onDeleteTable={() => {}}
            isStudentMode={true}
            onSwitchToDatasheet={() => setSqlSubView('table')}
            onReset={handleReset}
            {...wizardProps}
          />
          {wizardDialogs}
        </>
      );
    }

    // Student clicked a table from the SQL view — show its datasheet
    if (sqlSubView === 'table' && activeTableId) {
      return (
        <>
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
          {wizardDialogs}
        </>
      );
    }

    // Default SQL sub-view: the Query Design View in SQL mode
    return (
      <>
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
        {wizardDialogs}
      </>
    );
  }

  // ── Table datasheet / design mode ─────────────────────────────────────────
  if (activeTableId) {
    if (activeView === 'design') {
      return (
        <>
          <TableDesignView
            databaseId={snapshot.database.id}
            tableId={activeTableId}
            db={snapshot.database}
            tables={snapshot.tables}
            onDeleteTable={() => {}}
            isStudentMode={true}
            onSwitchToDatasheet={() => setActiveView('datasheet')}
            onReset={handleReset}
            {...wizardProps}
          />
          {wizardDialogs}
        </>
      );
    }
    return (
      <>
        <TableDataView
          databaseId={snapshot.database.id}
          tableId={activeTableId}
          db={snapshot.database}
          tables={snapshot.tables}
          isStudentMode={true}
          onSelectTable={(id) => { setActiveTableId(id); setActiveView('datasheet'); }}
          forms={forms}
          reports={reports}
          queries={queries}
          onReset={handleReset}
          onSwitchToDesign={() => setActiveView('design')}
          {...wizardProps}
        />
        {wizardDialogs}
      </>
    );
  }

  // ── No table selected — default landing ───────────────────────────────────
  const ribbon = (
    <Ribbon
      title={snapshot.database.name}
      tabs={[{
        name: 'Home',
        content: (
          <div className="text-gray-400 p-2 italic text-sm">
            Select a table from the left panel to begin
          </div>
        )
      }]}
    />
  );

  return (
    <>
      <Shell
        title={snapshot.database.name}
        ribbon={ribbon}
        isEmbed={true}
        sidebar={
          <Sidebar
            tables={snapshot.tables}
            databaseId={snapshot.database.id}
            isStudentMode={true}
            onSelectTable={setActiveTableId}
            forms={forms}
            reports={reports}
            queries={queries}
            onSelectForm={(id) => { setActiveFormId(id); setActiveView('form'); }}
            onSelectReport={(id) => { setActiveReportId(id); setActiveView('report'); }}
          />
        }
      >
        <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 bg-[#f3f2f1] p-8 text-center">
          <h2 className="text-2xl text-gray-500 font-light mb-4">Select a table to begin</h2>
          <p className="max-w-md text-gray-400">
            Choose a table from the navigation pane on the left to start viewing and editing data.
          </p>
        </div>
      </Shell>
      {wizardDialogs}
    </>
  );
}
