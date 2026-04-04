import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Ribbon } from '@/components/layout/Ribbon';
import { Sidebar } from '@/components/layout/Sidebar';
import { TableDataView } from './TableDataView';
import { X, Info } from 'lucide-react';

const SESSION_KEY_STORAGE = 'student_session_key';

interface Props {
  token: string;
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

export function EmbedView({ token }: Props) {
  const [snapshot, setSnapshot] = useState<EmbedSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  const [taskBannerDismissed, setTaskBannerDismissed] = useState(false);

  useEffect(() => {
    const sessionKey = getOrCreateSessionKey();
    fetch(`/api/ds/embeds/${token}`, {
      headers: { 'Content-Type': 'application/json', 'x-session-key': sessionKey }
    })
      .then(r => {
        if (!r.ok) throw new Error('Invalid embed');
        return r.json();
      })
      .then(data => {
        setSnapshot(data);
        setActiveTableId(data.tables?.[0]?.id ?? null);
        setIsLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setIsLoading(false);
      });
  }, [token]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f3f2f1] font-bold text-gray-500">
        Loading Student Environment...
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

  const taskDescription = snapshot.database.taskDescription;

  const taskBanner = taskDescription && !taskBannerDismissed && (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000 }}
      className="flex items-start gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-300 shadow-sm"
    >
      <Info size={14} className="flex-shrink-0 mt-0.5 text-amber-600" />
      <p className="flex-1 text-xs text-amber-900 leading-snug">
        <strong className="font-semibold">Task: </strong>{taskDescription}
      </p>
      <button
        onClick={() => setTaskBannerDismissed(true)}
        className="text-amber-400 hover:text-amber-700 flex-shrink-0"
        aria-label="Dismiss task banner"
      >
        <X size={13} />
      </button>
    </div>
  );

  if (activeTableId) {
    return (
      <>
        {taskBanner}
        <TableDataView
          databaseId={snapshot.database.id}
          tableId={activeTableId}
          db={snapshot.database}
          tables={snapshot.tables}
          isStudentMode={true}
          onSelectTable={setActiveTableId}
        />
      </>
    );
  }

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
      {taskBanner}
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
          <h2 className="text-2xl text-gray-500 font-light mb-4">Welcome to Your Student Sandbox</h2>
          <p className="max-w-md text-gray-400">
            Select a table from the navigation pane on the left to start viewing and editing data.
            Your changes are isolated — they won't affect your teacher's original database.
          </p>
        </div>
      </Shell>
    </>
  );
}
