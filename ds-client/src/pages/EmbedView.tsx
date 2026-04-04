import React, { useState, useEffect, useRef } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Ribbon } from '@/components/layout/Ribbon';
import { Sidebar } from '@/components/layout/Sidebar';
import { TableDataView } from './TableDataView';
import { Sparkles, X, Info, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [grading, setGrading] = useState(false);
  const [gradingFeedback, setGradingFeedback] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [taskBannerDismissed, setTaskBannerDismissed] = useState(false);
  const [feedbackCollapsed, setFeedbackCollapsed] = useState(false);

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

  const handleMarkWork = async () => {
    if (!snapshot || grading) return;
    setGrading(true);
    setGradingFeedback(null);
    setFeedbackOpen(true);
    setFeedbackCollapsed(false);
    try {
      const res = await fetch('/api/ds/grade-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxDatabaseId: snapshot.database.id,
          taskDescription: snapshot.database.taskDescription || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Marking failed');
      setGradingFeedback(data.feedback || 'No feedback received.');
    } catch (e: any) {
      setGradingFeedback(`Error: ${e.message || 'Could not get feedback.'}`);
    } finally {
      setGrading(false);
    }
  };

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

  const overlay = (
    <>
      {taskDescription && !taskBannerDismissed && (
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
      )}

      <button
        onClick={handleMarkWork}
        disabled={grading}
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9001 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold shadow-lg transition-colors disabled:opacity-60"
        title="Submit your database for AI marking"
      >
        <Sparkles size={15} />
        {grading ? 'Marking…' : 'Submit for Marking'}
      </button>

      {feedbackOpen && (
        <div
          style={{ position: 'fixed', bottom: 72, right: 20, zIndex: 9000, width: '360px' }}
          className="bg-white rounded-xl shadow-2xl border border-purple-200 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-700 text-white">
            <Sparkles size={13} />
            <span className="text-xs font-semibold flex-1">AI Marking Feedback</span>
            <button
              onClick={() => setFeedbackCollapsed(c => !c)}
              className="text-purple-200 hover:text-white"
              aria-label={feedbackCollapsed ? 'Expand feedback' : 'Collapse feedback'}
            >
              {feedbackCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={() => setFeedbackOpen(false)}
              className="text-purple-200 hover:text-white ml-1"
              aria-label="Close feedback"
            >
              <X size={14} />
            </button>
          </div>

          {!feedbackCollapsed && (
            <div className="p-3 text-sm text-gray-800 max-h-56 overflow-y-auto">
              {grading ? (
                <div className="flex items-center gap-2 text-purple-600 py-2">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Analysing your database…
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{gradingFeedback}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  if (activeTableId) {
    return (
      <>
        {overlay}
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
      {overlay}
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
