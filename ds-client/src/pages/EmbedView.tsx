import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Ribbon } from '@/components/layout/Ribbon';
import { Sidebar } from '@/components/layout/Sidebar';
import { TableDataView } from './TableDataView';
import { TableDesignView } from './TableDesignView';
import { QueryDesignView } from './QueryDesignView';

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

function getOrCreateSessionKey(): string {
  let key = sessionStorage.getItem(SESSION_KEY_STORAGE);
  if (!key) {
    key = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY_STORAGE, key);
  }
  return key;
}

export function EmbedView({ token, initialMode }: Props) {
  const [snapshot, setSnapshot] = useState<EmbedSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'datasheet' | 'design' | 'sql'>(initialMode === 'sql' ? 'sql' : 'datasheet');
  const [resetKey, setResetKey] = useState(0);

  // SQL mode: temp query for QueryDesignView
  const [tempQueryId, setTempQueryId] = useState<number | null>(null);
  const [tempQueryName] = useState('Query1');
  // When inside SQL mode, navigate between the query editor, a table's datasheet, and design view
  const [sqlSubView, setSqlSubView] = useState<'query' | 'table' | 'design'>('query');

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
          } catch {
            // If query creation fails, we'll show an error gracefully
          }
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
    setResetKey(k => k + 1);
  }

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
        <TableDesignView
          databaseId={snapshot.database.id}
          tableId={activeTableId}
          db={snapshot.database}
          tables={snapshot.tables}
          onDeleteTable={() => {}}
          isStudentMode={true}
          onSwitchToDatasheet={() => setSqlSubView('table')}
          onReset={handleReset}
        />
      );
    }

    // Student clicked a table from the SQL view — show its datasheet
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
          onReset={handleReset}
          onSwitchToDesign={() => setSqlSubView('design')}
        />
      );
    }

    // Default SQL sub-view: the Query Design View in SQL mode
    return (
      <QueryDesignView
        databaseId={snapshot.database.id}
        queryId={tempQueryId}
        db={snapshot.database as any}
        tables={snapshot.tables as any}
        isStudentMode={true}
        initialView="sql"
        queries={[{ id: tempQueryId, name: tempQueryName, databaseId: snapshot.database.id }]}
        onSelectTable={(id) => { setActiveTableId(id); setSqlSubView('table'); }}
        onSelectQuery={() => setSqlSubView('query')}
      />
    );
  }

  // ── Table datasheet / design mode ─────────────────────────────────────────
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
        onSelectTable={(id) => { setActiveTableId(id); setActiveView('datasheet'); }}
        onReset={handleReset}
        onSwitchToDesign={() => setActiveView('design')}
      />
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
  );
}
