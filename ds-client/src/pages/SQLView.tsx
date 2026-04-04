/**
 * SQLView — SQL editor for the Access Learning Tool.
 * Students write SELECT queries against their sandboxed database.
 * Left panel: schema browser. Right: editor + results grid.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Sidebar } from '@/components/layout/Sidebar';
import { Ribbon, RibbonGroup, RibbonButton, RibbonContextSection } from '@/components/layout/Ribbon';
import { CreateTabContent, ExternalDataTabContent, DatabaseToolsTabContent } from '@/components/layout/AccessRibbonTabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Play, Square, Code2, Trash2, ChevronRight, ChevronDown,
  Table2, Hash, Type, Calendar, ToggleLeft, KeyRound, Clock,
  Copy, AlertCircle, CheckCircle2, Info, Sparkles, X
} from 'lucide-react';
import type { Database, Table } from '@/api';
import type { QueryRow } from '@/components/layout/Sidebar';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers as any) }
  });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `API error ${res.status}`);
  return json;
}

interface SchemaField { name: string; fieldType: string; isPrimaryKey: boolean; }
interface SchemaTable { id: number; name: string; fields: SchemaField[]; }

interface QueryResult {
  // SELECT results
  columns?: string[];
  rows?: Record<string, any>[];
  rowCount?: number;
  // DML results
  isDml?: boolean;
  rowsAffected?: number;
  statementType?: string;
  // Common
  executionTimeMs: number;
}

interface Props {
  databaseId: number;
  db: Database;
  tables: Table[];
  queries?: QueryRow[];
  forms?: { id: number; name: string; databaseId: number }[];
  reports?: { id: number; name: string; databaseId: number }[];
  onDeleteTable?: (id: number) => void;
  onDeleteQuery?: (id: number) => void;
  onDeleteForm?: (id: number) => void;
  onDeleteReport?: (id: number) => void;
  onRefresh?: () => void;
  isStudentMode?: boolean;
  onCreateTable?: () => void;
  onCreateQuery?: () => void;
  onQueryWizard?: () => void;
  onCreateForm?: () => void;
  onCreateBlankForm?: () => void;
  onCreateAutoForm?: () => void;
  onCreateReport?: () => void;
  onCreateBlankReport?: () => void;
  onCreateAutoReport?: () => void;
  onImportCSV?: () => void;
  onExportData?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  onOpenSql?: () => void;
  onOpenRelationships?: () => void;
  onCompact?: () => void;
  onAnalyse?: () => void;
  onDocumenter?: () => void;
  onObjectDependencies?: () => void;
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  text: <Type size={12} className="text-red-500" />,
  number: <Hash size={12} className="text-green-500" />,
  autonumber: <Hash size={12} className="text-gray-400" />,
  date: <Calendar size={12} className="text-orange-500" />,
  boolean: <ToggleLeft size={12} className="text-purple-500" />,
};

/** Wrap a name in double quotes if it contains spaces or special characters */
function sqlName(name: string): string {
  return /[^a-zA-Z0-9_]/.test(name) ? `"${name}"` : name;
}

const EXAMPLE_QUERIES = [
  { label: 'Select all', template: (t: string) => `SELECT *\nFROM ${sqlName(t)}` },
  { label: 'Select cols', template: (t: string, fields: SchemaField[]) => `SELECT ${fields.slice(0, 3).map(f => sqlName(f.name)).join(', ')}\nFROM ${sqlName(t)}` },
  { label: 'With condition', template: (t: string, fields: SchemaField[]) => `SELECT *\nFROM ${sqlName(t)}\nWHERE ${sqlName(fields[1]?.name || 'Field1')} = 'value'` },
  { label: 'Order by', template: (t: string, fields: SchemaField[]) => `SELECT *\nFROM ${sqlName(t)}\nORDER BY ${sqlName(fields[1]?.name || 'Field1')} ASC` },
  { label: 'Count rows', template: (t: string) => `SELECT COUNT(*) AS TotalRows\nFROM ${sqlName(t)}` },
  { label: 'Insert row', template: (t: string, fields: SchemaField[]) => {
    const insertFields = fields.filter(f => f.fieldType !== 'autonumber');
    const cols = insertFields.map(f => sqlName(f.name)).join(', ');
    const vals = insertFields.map(f => f.fieldType === 'number' ? '0' : `'value'`).join(', ');
    return `INSERT INTO ${sqlName(t)} (${cols})\nVALUES (${vals})`;
  }},
  { label: 'Update rows', template: (t: string, fields: SchemaField[]) => {
    const nonKey = fields.find(f => f.fieldType !== 'autonumber' && !f.isPrimaryKey);
    return `UPDATE ${sqlName(t)}\nSET ${sqlName(nonKey?.name || 'Field')} = 'new value'\nWHERE ${sqlName(nonKey?.name || 'Field')} = 'old value'`;
  }},
  { label: 'Delete rows', template: (t: string, fields: SchemaField[]) => {
    const nonKey = fields.find(f => !f.isPrimaryKey && f.fieldType !== 'autonumber');
    return `DELETE FROM ${sqlName(t)}\nWHERE ${sqlName(nonKey?.name || 'Field')} = 'value'`;
  }},
];

export function SQLView({
  databaseId, db, tables, queries = [], forms = [], reports = [],
  onDeleteTable, onDeleteQuery, onDeleteForm, onDeleteReport, onRefresh,
  isStudentMode, onCreateTable, onCreateQuery, onQueryWizard,
  onCreateForm, onCreateBlankForm, onCreateAutoForm,
  onCreateReport, onCreateBlankReport, onCreateAutoReport,
  onImportCSV, onExportData, onShare, onSettings, onOpenSql, onOpenRelationships,
  onCompact, onAnalyse, onDocumenter, onObjectDependencies,
}: Props) {
  const { toast } = useToast();
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const [sql, setSql] = useState('SELECT *\nFROM TableName');
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [expandedTables, setExpandedTables] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [grading, setGrading] = useState(false);
  const [gradingFeedback, setGradingFeedback] = useState<string | null>(null);

  // Load schema
  const loadSchema = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/databases/${databaseId}/sql/schema`);
      setSchema(data || []);
      // Auto-expand first table
      if (data?.length > 0) setExpandedTables(new Set([data[0].id]));
      // Replace placeholder with first real table
      if (data?.length > 0) {
        setSql(prev => prev.replace('TableName', data[0].name));
      }
    } catch {}
  }, [databaseId]);

  useEffect(() => { loadSchema(); }, [loadSchema]);

  const runQuery = async () => {
    if (!sql.trim() || running) return;
    setRunning(true);
    setError(null);
    setResult(null);
    setHasRun(true);
    try {
      const data = await apiFetch(`/api/databases/${databaseId}/sql`, {
        method: 'POST',
        body: JSON.stringify({ sql }),
      });
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'An error occurred');
    } finally {
      setRunning(false);
    }
  };

  const gradeQuery = async () => {
    if (!sql.trim() || grading) return;
    setGrading(true);
    setGradingFeedback(null);
    try {
      const res = await apiFetch(`/api/ds/grade-sandbox`, {
        method: 'POST',
        body: JSON.stringify({ databaseId, sql, results: result, taskDescription: db.taskDescription || "" }),
      });
      setGradingFeedback(res?.feedback || "No feedback received.");
    } catch (e: any) {
      setGradingFeedback(`Error: ${e.message || "Could not get feedback."}`);
    } finally {
      setGrading(false);
    }
  };

  // Ctrl+Enter / F5 to run
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runQuery();
    }
    if (e.key === 'F5') {
      e.preventDefault();
      runQuery();
    }
    // Tab inserts 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = editorRef.current!;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = sql.substring(0, start) + '  ' + sql.substring(end);
      setSql(newVal);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2; }, 0);
    }
  };

  const insertText = (text: string) => {
    const ta = editorRef.current;
    if (!ta) { setSql(prev => prev + text); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = sql.substring(0, start) + text + sql.substring(end);
    setSql(newVal);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + text.length;
    }, 0);
  };

  const insertTableExample = (table: SchemaTable) => {
    setSql(`SELECT *\nFROM ${sqlName(table.name)}`);
    editorRef.current?.focus();
  };

  const toggleTable = (id: number) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const lines = sql.split('\n');

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
    onOpenSql,
    onOpenRelationships,
    onCompact,
    onAnalyse,
    onDocumenter,
    onObjectDependencies,
  };

  const contextSection: RibbonContextSection = {
    color: '#1a237e',
    defaultTab: 'SQL View',
    tabs: [
      {
        name: 'SQL View',
        content: (
          <RibbonGroup name="Run">
            <RibbonButton
              icon={<Play size={22} />}
              label="Run"
              onClick={runQuery}
              disabled={running || !sql.trim()}
            />
            <RibbonButton
              icon={<Square size={22} />}
              label="Clear"
              onClick={() => { setSql(''); setResult(null); setError(null); setHasRun(false); editorRef.current?.focus(); }}
            />
          </RibbonGroup>
        )
      }
    ]
  };

  const sidebarEl = (
    <Sidebar
      tables={tables || []}
      databaseId={databaseId}
      onDeleteTable={onDeleteTable}
      queries={queries}
      onDeleteQuery={onDeleteQuery}
      forms={forms}
      onDeleteForm={onDeleteForm}
      reports={reports}
      onDeleteReport={onDeleteReport}
      onRefresh={onRefresh}
    />
  );

  const ribbonEl = (
    <Ribbon
      title={db.name}
      allDatabasesLink="/"
      contextSection={contextSection}
      tabs={[
        { name: 'Home', content: <RibbonGroup name="Create"><RibbonButton icon={<Code2 size={22} />} label="SQL" active /></RibbonGroup> },
        { name: 'Create', content: <CreateTabContent {...commonTabProps} /> },
        { name: 'External Data', content: <ExternalDataTabContent {...commonTabProps} onShare={onShare} /> },
        { name: 'Database Tools', content: <DatabaseToolsTabContent {...commonTabProps} onSettings={onSettings} /> },
      ]}
    />
  );

  return (
    <Shell title={db.name} ribbon={ribbonEl} sidebar={sidebarEl}>
      <div className="flex h-full bg-[#f3f2f1] overflow-hidden">

        {/* ── Schema Browser ─────────────────────────────────────── */}
        <div className="w-52 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Schema</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {schema.length === 0 ? (
              <div className="p-3 text-xs text-gray-400 italic">No tables yet. Create a table to get started.</div>
            ) : (
              schema.map(table => (
                <div key={table.id}>
                  {/* Table row */}
                  <button
                    onClick={() => toggleTable(table.id)}
                    className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-red-50 text-left group"
                  >
                    {expandedTables.has(table.id)
                      ? <ChevronDown size={12} className="text-gray-400 flex-shrink-0" />
                      : <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
                    }
                    <Table2 size={13} className="text-[#1a237e] flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-800 truncate">{table.name}</span>
                    <button
                      onClick={e => { e.stopPropagation(); insertTableExample(table); }}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-[10px] text-red-600 hover:text-red-800 flex-shrink-0"
                      title="Insert SELECT * query"
                    >
                      SELECT
                    </button>
                  </button>
                  {/* Fields */}
                  {expandedTables.has(table.id) && (
                    <div className="ml-4 border-l border-gray-100">
                      {table.fields.map(f => (
                        <button
                          key={f.name}
                          onClick={() => insertText(sqlName(f.name))}
                          className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-red-50 text-left"
                          title={`Click to insert ${sqlName(f.name)}`}
                        >
                          {f.isPrimaryKey
                            ? <KeyRound size={11} className="text-yellow-500 flex-shrink-0" />
                            : (FIELD_ICONS[f.fieldType] ?? <Type size={11} className="text-gray-400" />)
                          }
                          <span className="text-xs text-gray-700 truncate">{f.name}</span>
                          <span className="ml-auto text-[9px] text-gray-400 flex-shrink-0">{f.fieldType}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick examples */}
          {schema.length > 0 && (
            <div className="border-t border-gray-200 p-2">
              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Examples</p>
              <div className="space-y-0.5">
                {EXAMPLE_QUERIES.map(ex => (
                  <button
                    key={ex.label}
                    onClick={() => {
                      const t = schema[0];
                      setSql((ex.template as any)(t.name, t.fields));
                      editorRef.current?.focus();
                    }}
                    className="w-full text-left text-[11px] text-red-600 hover:text-red-800 hover:bg-red-50 px-1.5 py-0.5 rounded truncate"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Main Editor + Results ────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Task description banner (student mode) */}
          {isStudentMode && db.taskDescription && (
            <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-900">
              <Info size={13} className="flex-shrink-0 mt-0.5 text-amber-600" />
              <span><strong>Task:</strong> {db.taskDescription}</span>
            </div>
          )}

          {/* Editor header */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a237e] text-white text-xs">
            <Code2 size={14} />
            <span className="font-medium">SQL Query Editor</span>
            <span className="text-red-300 ml-1">· SELECT · INSERT · UPDATE · DELETE</span>
            <div className="ml-auto flex items-center gap-2 text-red-200 text-[11px]">
              <span>Ctrl+Enter to run</span>
              <span>·</span>
              <span>F5 to run</span>
              <span>·</span>
              <span>Click schema fields to insert</span>
            </div>
          </div>

          {/* Editor area */}
          <div className="flex bg-[#1e1e1e] border-b border-gray-700" style={{ minHeight: '180px', maxHeight: '320px' }}>
            {/* Line numbers */}
            <div className="flex-shrink-0 select-none bg-[#1e1e1e] text-gray-500 text-xs font-mono py-3 pl-3 pr-2 text-right leading-[22px]" style={{ minWidth: '36px' }}>
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* Textarea */}
            <textarea
              ref={editorRef}
              value={sql}
              onChange={e => setSql(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="flex-1 bg-transparent text-gray-100 text-sm font-mono resize-none outline-none py-3 pr-3 leading-[22px] placeholder-gray-600"
              placeholder="SELECT * FROM TableName"
              style={{ caretColor: '#7dd3fc' }}
            />
          </div>

          {/* Run toolbar */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2d2d2d] border-b border-gray-700">
            <Button
              size="sm"
              onClick={runQuery}
              disabled={running || !sql.trim()}
              className="bg-[#388e3c] hover:bg-[#2e7d32] text-white h-7 px-3 text-xs gap-1.5"
            >
              <Play size={13} />
              {running ? 'Running…' : 'Run Query'}
            </Button>
            {isStudentMode && hasRun && (
              <Button
                size="sm"
                onClick={gradeQuery}
                disabled={grading || !sql.trim()}
                className="bg-[#6a1b9a] hover:bg-[#4a148c] text-white h-7 px-3 text-xs gap-1.5"
              >
                <Sparkles size={13} />
                {grading ? 'Marking…' : 'Submit for Marking'}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setSql(''); setResult(null); setError(null); setHasRun(false); setGradingFeedback(null); editorRef.current?.focus(); }}
              className="h-7 px-3 text-xs border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 bg-transparent gap-1.5"
            >
              <Trash2 size={12} />
              Clear
            </Button>
            {/* SQL keyword helpers */}
            <div className="ml-3 flex items-center gap-1 flex-wrap">
              {[
                { kw: 'SELECT', color: 'text-cyan-300' },
                { kw: 'FROM', color: 'text-cyan-300' },
                { kw: 'WHERE', color: 'text-cyan-300' },
                { kw: 'ORDER BY', color: 'text-cyan-300' },
                { kw: 'GROUP BY', color: 'text-cyan-300' },
                { kw: 'HAVING', color: 'text-cyan-300' },
                { kw: 'JOIN', color: 'text-cyan-300' },
                { kw: 'AND', color: 'text-cyan-300' },
                { kw: 'OR', color: 'text-cyan-300' },
                { kw: 'LIKE', color: 'text-cyan-300' },
                { kw: 'IN', color: 'text-cyan-300' },
                { kw: 'COUNT(*)', color: 'text-cyan-300' },
                { kw: 'INSERT INTO', color: 'text-emerald-300' },
                { kw: 'VALUES', color: 'text-emerald-300' },
                { kw: 'UPDATE', color: 'text-yellow-300' },
                { kw: 'SET', color: 'text-yellow-300' },
                { kw: 'DELETE FROM', color: 'text-red-300' },
              ].map(({ kw, color }) => (
                <button
                  key={kw}
                  onClick={() => insertText(kw + ' ')}
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-700 ${color} hover:bg-gray-600 transition-colors`}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* AI Marking feedback panel */}
          {gradingFeedback && (
            <div className="border-t border-purple-200 bg-purple-50 flex flex-col" style={{ maxHeight: '260px', overflowY: 'auto' }}>
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-100 border-b border-purple-200 flex-shrink-0">
                <Sparkles size={13} className="text-purple-600" />
                <span className="text-xs font-semibold text-purple-800">AI Marking Feedback</span>
                <button
                  onClick={() => setGradingFeedback(null)}
                  className="ml-auto text-purple-400 hover:text-purple-700"
                  aria-label="Dismiss feedback"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">{gradingFeedback}</div>
            </div>
          )}

          {/* Results area */}
          <div className="flex-1 overflow-hidden flex flex-col bg-white">
            {!hasRun && (
              <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-2">
                <Code2 size={32} className="text-gray-300" />
                <p className="text-sm">Write a SQL query and click <strong className="text-[#1a237e]">Run Query</strong> to see results.</p>
                <p className="text-xs text-gray-400">Try: <code className="bg-gray-100 px-1 rounded">SELECT * FROM TableName</code> — use <code className="bg-gray-100 px-1 rounded">"double quotes"</code> for names with spaces</p>
              </div>
            )}

            {running && (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#1a237e] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Executing query…</span>
                </div>
              </div>
            )}

            {!running && error && (
              <div className="m-4 rounded border border-red-200 bg-red-50 p-4 flex gap-3">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-1">Query Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                  <div className="mt-2 text-xs text-red-500 space-y-0.5">
                    <p>• Table and field names are case-sensitive: <code className="bg-red-100 px-1 rounded">SELECT * FROM Students</code></p>
                    <p>• Use <code className="bg-red-100 px-1 rounded">"double quotes"</code> for names that contain spaces, e.g. <code className="bg-red-100 px-1 rounded">"First Name"</code></p>
                    <p>• Click table/field names in the schema panel to insert them automatically</p>
                  </div>
                </div>
              </div>
            )}

            {!running && result && (
              <>
                {/* DML result */}
                {result.isDml ? (
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-3 px-3 py-1.5 border-b border-gray-200 bg-gray-50 text-xs text-gray-600 flex-shrink-0">
                      <CheckCircle2 size={13} className="text-green-600" />
                      <span className="font-medium text-green-700">
                        {result.statementType === 'insert' && 'INSERT successful'}
                        {result.statementType === 'update' && 'UPDATE successful'}
                        {result.statementType === 'delete' && 'DELETE successful'}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-700">{result.rowsAffected} row{result.rowsAffected !== 1 ? 's' : ''} affected</span>
                      <span className="text-gray-400">·</span>
                      <Clock size={12} />
                      <span>{result.executionTimeMs}ms</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center flex-col gap-2 text-gray-500">
                      <CheckCircle2 size={32} className="text-green-500" />
                      <p className="text-sm font-medium text-green-700">
                        {result.statementType === 'insert' && `${result.rowsAffected} row${result.rowsAffected !== 1 ? 's' : ''} inserted`}
                        {result.statementType === 'update' && `${result.rowsAffected} row${result.rowsAffected !== 1 ? 's' : ''} updated`}
                        {result.statementType === 'delete' && `${result.rowsAffected} row${result.rowsAffected !== 1 ? 's' : ''} deleted`}
                      </p>
                      <p className="text-xs text-gray-400">Changes saved. Run a SELECT query to see the updated data.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* SELECT result */}
                    <div className="flex items-center gap-3 px-3 py-1.5 border-b border-gray-200 bg-gray-50 text-xs text-gray-600 flex-shrink-0">
                      <CheckCircle2 size={13} className="text-green-600" />
                      <span className="font-medium text-green-700">{result.rowCount ?? 0} row{result.rowCount !== 1 ? 's' : ''} returned</span>
                      <span className="text-gray-400">·</span>
                      <Clock size={12} />
                      <span>{result.executionTimeMs}ms</span>
                      {(result.rowCount ?? 0) === 0 && (
                        <>
                          <span className="text-gray-400">·</span>
                          <span className="text-amber-600 flex items-center gap-1"><Info size={12} /> No rows matched — check your WHERE condition.</span>
                        </>
                      )}
                    </div>

                    {/* Results grid */}
                    {(result.columns?.length ?? 0) > 0 ? (
                      <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead className="sticky top-0 z-10">
                            <tr>
                              <th className="w-8 text-center bg-gray-100 border border-gray-300 px-1 py-1 text-xs text-gray-400 font-normal">#</th>
                              {(result.columns ?? []).map(col => (
                                <th key={col} className="bg-[#e8eaf6] border border-gray-300 px-3 py-1.5 text-left text-xs font-semibold text-[#1a237e] whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(result.rows ?? []).map((row, ri) => (
                              <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="border border-gray-200 px-1 py-1 text-center text-xs text-gray-400 select-none">{ri + 1}</td>
                                {(result.columns ?? []).map(col => (
                                  <td key={col} className="border border-gray-200 px-3 py-1 text-gray-800 whitespace-nowrap max-w-xs truncate" title={String(row[col] ?? '')}>
                                    {row[col] === null || row[col] === undefined
                                      ? <span className="text-gray-400 italic text-xs">null</span>
                                      : typeof row[col] === 'boolean'
                                        ? <span className={`text-xs font-medium ${row[col] ? 'text-green-600' : 'text-red-500'}`}>{row[col] ? 'Yes' : 'No'}</span>
                                        : String(row[col])
                                    }
                                  </td>
                                ))}
                              </tr>
                            ))}
                            {(result.rows?.length ?? 0) === 0 && (
                              <tr>
                                <td colSpan={(result.columns?.length ?? 0) + 1} className="text-center text-gray-400 italic py-6 text-sm">
                                  No rows match your query.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                        Query returned no columns.
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
