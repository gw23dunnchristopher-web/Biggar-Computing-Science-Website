import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { Shell } from '@/components/layout/Shell';
import { Sidebar } from '@/components/layout/Sidebar';
import { Ribbon, RibbonGroup, RibbonButton, RibbonDropdownButton, RibbonContextSection } from '@/components/layout/Ribbon';
import { CreateTabContent, ExternalDataTabContent, DatabaseToolsTabContent } from '@/components/layout/AccessRibbonTabs';
import { Database, Table as TableType } from '@/api';
import {
  Play, Grid3X3, Plus, Trash2, ChevronLeft, ChevronRight,
  Save, Table, Eye, List, Sigma, Code2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DesignViewIcon } from '@/components/ui/design-view-icon';

interface QueryColumn {
  tableId: number;
  tableName: string;
  fieldName: string;
  alias: string;
  show: boolean;
  sort: 'asc' | 'desc' | null;
  criteria: string;
}

interface QueryDefinition {
  tables: { tableId: number; tableName: string }[];
  columns: QueryColumn[];
}

interface QueryRow { id: number; name: string; databaseId: number; definition: any; }
interface Field { id: number; name: string; fieldType: string; isPrimaryKey: boolean; sortOrder: number; }
interface TableWithFields { id: number; name: string; fields: Field[]; }

interface ItemRow { id: number; name: string; databaseId: number; }

interface Props {
  databaseId: number;
  queryId: number;
  db: Database;
  tables: TableType[];
  onDeleteTable?: (id: number) => void;
  isStudentMode?: boolean;
  initialView?: 'design' | 'sql';
  queries?: ItemRow[];
  forms?: ItemRow[];
  reports?: ItemRow[];
  onSelectTable?: (id: number) => void;
  onSelectQuery?: (id: number) => void;
  onDeleteQuery?: (id: number) => void;
  onDeleteForm?: (id: number) => void;
  onDeleteReport?: (id: number) => void;
  onRefresh?: () => void;
  onCreateTable?: () => void;
  onCreateQuery?: () => void;
  onQueryWizard?: () => void;
  onCreateSqlQuery?: () => void;
  onCreateForm?: () => void;
  onCreateBlankForm?: () => void;
  onCreateAutoForm?: () => void;
  onCreateReport?: () => void;
  onCreateBlankReport?: () => void;
  onCreateAutoReport?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
}


/** Syntax-highlight an SQL string, returning an HTML string (light theme). */
function highlightSQL(text: string): string {
  const KEYWORDS = new Set([
    'SELECT','FROM','WHERE','AND','OR','NOT','ORDER','BY','ASC','DESC',
    'GROUP','HAVING','INNER','OUTER','LEFT','RIGHT','FULL','CROSS','JOIN','ON',
    'INSERT','INTO','VALUES','UPDATE','SET','DELETE','DISTINCT','AS','LIKE',
    'IN','BETWEEN','IS','NULL','COUNT','SUM','AVG','MAX','MIN','ROUND',
    'UPPER','LOWER','ALL','ANY','EXISTS','UNION','CASE','WHEN','THEN','ELSE',
    'END','LIMIT','OFFSET','CREATE','DROP','ALTER','TABLE','DATABASE','WITH','USING',
  ]);

  function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightCode(code: string): string {
    return code.replace(/(\b[A-Za-z_][A-Za-z0-9_]*\b|\d+(?:\.\d+)?|[&<>])/g, (m) => {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      if (/^\d/.test(m)) return `<span style="color:#098658">${m}</span>`;
      if (KEYWORDS.has(m.toUpperCase())) return `<span style="color:#0000ff;font-weight:500">${m.toUpperCase()}</span>`;
      return m;
    });
  }

  let result = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] === '-' && text[i + 1] === '-') {
      const end = text.indexOf('\n', i);
      const chunk = end === -1 ? text.slice(i) : text.slice(i, end);
      result += `<span style="color:#008000">${esc(chunk)}</span>`;
      i = end === -1 ? text.length : end;
    } else if (text[i] === "'") {
      let j = i + 1;
      while (j < text.length) {
        if (text[j] === "'" && text[j + 1] === "'") { j += 2; continue; }
        if (text[j] === "'") { j++; break; }
        j++;
      }
      result += `<span style="color:#a31515">${esc(text.slice(i, j))}</span>`;
      i = j;
    } else {
      let j = i;
      while (j < text.length && text[j] !== "'" && !(text[j] === '-' && text[j + 1] === '-')) j++;
      result += highlightCode(text.slice(i, j));
      i = j;
    }
  }
  return result;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts?.headers as any) };
  const sessionKey = sessionStorage.getItem('student_session_key');
  if (sessionKey) headers['x-session-key'] = sessionKey;
  const res = await fetch(path, { ...opts, headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

function sqlName(name: string): string {
  return /[^a-zA-Z0-9_]/.test(name) ? `"${name}"` : name;
}

function buildQuerySql(definition: QueryDefinition): string {
  if (definition.tables.length === 0) return '';
  const multiTable = definition.tables.length > 1;
  const showCols = definition.columns.filter(c => c.show);
  const selectParts = showCols.length > 0
    ? showCols.map(c => {
        const field = multiTable ? `${sqlName(c.tableName)}.${sqlName(c.fieldName)}` : sqlName(c.fieldName);
        return c.alias ? `${field} AS ${sqlName(c.alias)}` : field;
      })
    : ['*'];
  let sql = `SELECT ${selectParts.join(', ')}\nFROM ${definition.tables.map(t => sqlName(t.tableName)).join(', ')}`;
  const criteriaCols = definition.columns.filter(c => c.criteria.trim());
  if (criteriaCols.length > 0) {
    sql += '\nWHERE ' + criteriaCols.map(c => {
      const ref = multiTable ? `${sqlName(c.tableName)}.${sqlName(c.fieldName)}` : sqlName(c.fieldName);
      return `${ref} = ${c.criteria}`;
    }).join('\n  AND ');
  }
  const sortCols = definition.columns.filter(c => c.sort);
  if (sortCols.length > 0) {
    sql += '\nORDER BY ' + sortCols.map(c => {
      const ref = multiTable ? `${sqlName(c.tableName)}.${sqlName(c.fieldName)}` : sqlName(c.fieldName);
      return `${ref} ${c.sort === 'asc' ? 'ASC' : 'DESC'}`;
    }).join(', ');
  }
  return sql;
}

export function QueryDesignView({
  databaseId, queryId, db, tables, onDeleteTable, isStudentMode, initialView,
  queries = [], forms = [], reports = [], onSelectTable, onSelectQuery, onDeleteQuery, onDeleteForm, onDeleteReport,
  onRefresh,
  onCreateTable, onCreateQuery, onQueryWizard, onCreateSqlQuery,
  onCreateForm, onCreateBlankForm, onCreateAutoForm,
  onCreateReport, onCreateBlankReport, onCreateAutoReport,
  onShare, onSettings
}: Props) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [view, setView] = useState<'design' | 'datasheet' | 'sql'>(initialView ?? 'design');
  const [queryName, setQueryName] = useState('');
  const [definition, setDefinition] = useState<QueryDefinition>({ tables: [], columns: [] });
  const [tableDetails, setTableDetails] = useState<Record<number, TableWithFields>>({});
  const [results, setResults] = useState<{ columns: { key: string; label: string; fieldName?: string; tableName?: string }[]; rows: Record<string, any>[] } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showTotals, setShowTotals] = useState(false);

  // SQL view state
  const [sqlText, setSqlText] = useState('');
  const [sqlUserEdited, setSqlUserEdited] = useState(false);
  const [sqlResults, setSqlResults] = useState<{ columns: string[]; rows: Record<string, any>[] } | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [isSqlRunning, setIsSqlRunning] = useState(false);
  const sqlRef = useRef<HTMLTextAreaElement>(null);
  const sqlGutterRef = useRef<HTMLDivElement>(null);
  const sqlHighlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch(`/api/ds/databases/${databaseId}/queries/${queryId}`)
      .then((q: QueryRow) => {
        setQueryName(q.name);
        setNameInput(q.name);
        const def = q.definition && typeof q.definition === 'object' ? q.definition as QueryDefinition : { tables: [], columns: [] };
        setDefinition({ tables: def.tables || [], columns: def.columns || [] });
        if (initialView === 'sql') {
          const sql = def.tables && def.tables.length > 0 ? buildQuerySql({ tables: def.tables || [], columns: def.columns || [] }) : 'SELECT;';
          setSqlText(sql);
        }
      })
      .catch(() => toast({ title: 'Failed to load query', variant: 'destructive' }));
  }, [queryId]);

  useEffect(() => {
    definition.tables.forEach(t => {
      if (!tableDetails[t.tableId]) {
        apiFetch(`/api/ds/databases/${databaseId}/tables/${t.tableId}`)
          .then((td: TableWithFields) => setTableDetails(prev => ({ ...prev, [t.tableId]: td })))
          .catch(() => {});
      }
    });
  }, [definition.tables]);

  const handleAddTable = async (tableId: number, tableName: string) => {
    if (definition.tables.find(t => t.tableId === tableId)) return;
    const td = await apiFetch(`/api/ds/databases/${databaseId}/tables/${tableId}`).catch(() => null);
    if (td) setTableDetails(prev => ({ ...prev, [tableId]: td }));
    setDefinition(prev => ({ ...prev, tables: [...prev.tables, { tableId, tableName }] }));
  };

  const handleRemoveTable = (tableId: number) => {
    setDefinition(prev => ({
      tables: prev.tables.filter(t => t.tableId !== tableId),
      columns: prev.columns.filter(c => c.tableId !== tableId)
    }));
  };

  const handleAddField = (tableId: number, tableName: string, fieldName: string) => {
    if (definition.columns.find(c => c.tableId === tableId && c.fieldName === fieldName)) return;
    setDefinition(prev => ({
      ...prev,
      columns: [...prev.columns, { tableId, tableName, fieldName, alias: '', show: true, sort: null, criteria: '' }]
    }));
  };

  const handleAddAllFields = (tableId: number, tableName: string) => {
    const td = tableDetails[tableId];
    if (!td) return;
    [...td.fields].sort((a, b) => a.sortOrder - b.sortOrder).forEach(f => handleAddField(tableId, tableName, f.name));
  };

  const handleRemoveColumn = (idx: number) => {
    setDefinition(prev => { const cols = [...prev.columns]; cols.splice(idx, 1); return { ...prev, columns: cols }; });
  };

  const handleMoveColumn = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= definition.columns.length) return;
    setDefinition(prev => {
      const cols = [...prev.columns];
      [cols[idx], cols[newIdx]] = [cols[newIdx], cols[idx]];
      return { ...prev, columns: cols };
    });
  };

  const updateColumn = (idx: number, patch: Partial<QueryColumn>) => {
    setDefinition(prev => {
      const cols = [...prev.columns];
      cols[idx] = { ...cols[idx], ...patch };
      return { ...prev, columns: cols };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiFetch(`/api/ds/databases/${databaseId}/queries/${queryId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: queryName, definition })
      });
      toast({ title: 'Query saved' });
    } catch {
      toast({ title: 'Failed to save query', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  /** Look up a column's field type from tableDetails */
  const getQueryColType = (col: { fieldName?: string; tableName?: string }): string => {
    if (!col.fieldName) return 'text';
    const tableEntry = definition.tables.find(t => t.tableName === col.tableName);
    if (!tableEntry) return 'text';
    const td = tableDetails[tableEntry.tableId];
    return td?.fields.find(f => f.name === col.fieldName)?.fieldType ?? 'text';
  };

  /** Format a value for display based on its field type */
  const formatQueryValue = (fieldType: string, value: any): React.ReactNode => {
    if (value === null || value === undefined || value === '') return '';
    if (fieldType === 'currency') {
      const num = Number(value);
      if (isNaN(num)) return String(value);
      return '£' + num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (fieldType === 'boolean') return value ? 'Yes' : 'No';
    if (fieldType === 'date') return String(value).split('T')[0];
    return String(value);
  };

  const handleRun = async () => {
    await handleSave();
    setIsRunning(true);
    try {
      const data = await apiFetch(`/api/ds/databases/${databaseId}/queries/${queryId}/run`, { method: 'POST' });
      setResults(data);
      setView('datasheet');
    } catch {
      toast({ title: 'Failed to run query', variant: 'destructive' });
    } finally {
      setIsRunning(false);
    }
  };

  const switchView = (next: 'design' | 'datasheet' | 'sql') => {
    if (next === 'sql') {
      if (definition.tables.length > 0) {
        // Regenerate from the design grid
        setSqlText(buildQuerySql(definition));
        setSqlUserEdited(false);
      } else if (!sqlUserEdited) {
        // No tables in design and user hasn't typed their own SQL —
        // start with the same blank SQL that MS Access shows
        setSqlText('SELECT;');
      }
      // If sqlUserEdited is true and definition has no tables, keep whatever the user typed
      setSqlResults(null);
      setSqlError(null);
    } else if (next === 'datasheet') {
      handleRun();
      return;
    } else if (next === 'design') {
      // Reset the "user edited" flag when returning to design view
      // so that next time they switch to SQL the definition drives the content
      setSqlUserEdited(false);
    }
    setView(next);
  };

  const handleRunSql = async () => {
    if (!sqlText.trim() || isSqlRunning) return;
    setIsSqlRunning(true);
    setSqlError(null);
    setSqlResults(null);
    try {
      const data = await apiFetch(`/api/ds/databases/${databaseId}/sql`, {
        method: 'POST',
        body: JSON.stringify({ sql: sqlText }),
      });
      if (data?.columns) setSqlResults(data);
      else setSqlResults({ columns: [], rows: [] });
    } catch (e: any) {
      setSqlError(e.message || 'Query failed');
    } finally {
      setIsSqlRunning(false);
    }
  };

  const handleSqlKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRunSql(); }
    if (e.key === 'F5') { e.preventDefault(); handleRunSql(); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const s = ta.selectionStart; const end = ta.selectionEnd;
      const v = sqlText.substring(0, s) + '  ' + sqlText.substring(end);
      setSqlText(v);
      setSqlUserEdited(true);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 2; }, 0);
    }
  };

  const handleRenameSave = async () => {
    if (!nameInput.trim()) return;
    setQueryName(nameInput);
    setEditingName(false);
    try {
      await apiFetch(`/api/ds/databases/${databaseId}/queries/${queryId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: nameInput, definition })
      });
    } catch {}
  };

  const commonTabProps = {
    onCreateTable: onCreateTable || (() => {}),
    onCreateQuery: onCreateQuery || (() => {}),
    onQueryWizard,
    onCreateSqlQuery,
    onCreateForm,
    onCreateBlankForm,
    onCreateAutoForm,
    onCreateReport,
    onCreateBlankReport,
    onCreateAutoReport,
    onShare,
    onSettings,
  };

  // Query context tabs — purple view switchers
  const contextSection: RibbonContextSection = {
    color: '#6c3eb5',
    defaultTab: 'Query Design',
    tabs: [
      {
        name: 'Query Design',
        content: (
          <>
            <RibbonGroup name="Results">
              <RibbonButton
                icon={<Play size={22} />}
                label="Run"
                onClick={view === 'sql' ? handleRunSql : handleRun}
                disabled={view === 'sql' ? (!sqlText.trim() || isSqlRunning) : (isRunning || definition.tables.length === 0)}
                active
              />
            </RibbonGroup>
            <RibbonGroup name="Query Type">
              <RibbonButton icon={<Table size={22} />} label="Select" active />
              <RibbonButton icon={<Table size={22} />} label="Make Table" disabled />
              <RibbonButton icon={<Table size={22} />} label="Append" disabled />
              <RibbonButton icon={<Table size={22} />} label="Update" disabled />
              <RibbonButton icon={<Trash2 size={22} />} label="Delete" disabled />
              <RibbonButton icon={<Grid3X3 size={22} />} label="Crosstab" disabled />
            </RibbonGroup>
            <RibbonGroup name="Query Setup">
              <RibbonButton icon={<Plus size={22} />} label="Show Table" onClick={() => {}} disabled={tables.filter(t => !definition.tables.find(dt => dt.tableId === t.id)).length === 0} />
              <RibbonButton icon={<List size={22} />} label="Return: All" disabled />
              <RibbonButton icon={<List size={22} />} label="Parameters" disabled />
            </RibbonGroup>
            <RibbonGroup name="Show/Hide">
              <RibbonButton icon={<Eye size={22} />} label="Table Names" active />
              <RibbonButton icon={<Sigma size={22} />} label="Totals" onClick={() => setShowTotals(!showTotals)} active={showTotals} />
              <RibbonButton icon={<Eye size={22} />} label="Property Sheet" disabled />
            </RibbonGroup>
            <RibbonGroup name="Save">
              <RibbonButton icon={<Save size={22} />} label="Save" onClick={handleSave} disabled={isSaving} />
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
        <RibbonGroup name="View">
          <RibbonDropdownButton
            icon={view === 'datasheet' ? <Grid3X3 size={22} /> : view === 'sql' ? <Code2 size={22} /> : <DesignViewIcon size={22} />}
            label={view === 'sql' ? 'SQL' : view === 'datasheet' ? 'Datasheet' : 'Design'}
          >
            <RibbonButton icon={<DesignViewIcon size={22} />} label="Design" onClick={() => switchView('design')} active={view === 'design'} />
            <RibbonButton icon={<Grid3X3 size={22} />} label="Datasheet" onClick={() => switchView('datasheet')} active={view === 'datasheet'} />
            <RibbonButton icon={<Code2 size={22} />} label="SQL" onClick={() => switchView('sql')} active={view === 'sql'} />
          </RibbonDropdownButton>
        </RibbonGroup>
      }
      tabs={[
        {
          name: 'Home',
          content: (
            <RibbonGroup name="Query">
              <RibbonButton icon={<Play size={22} />} label="Run" onClick={handleRun} disabled={isRunning} />
              <RibbonButton icon={<Save size={22} />} label="Save" onClick={handleSave} disabled={isSaving} />
            </RibbonGroup>
          )
        },
        {
          name: 'Create',
          content: <CreateTabContent {...commonTabProps} />
        },
        {
          name: 'External Data',
          content: <ExternalDataTabContent {...commonTabProps} />
        },
        {
          name: 'Database Tools',
          content: <DatabaseToolsTabContent {...commonTabProps} />
        }
      ]}
    />
  );

  return (
    <Shell
      title={db.name}
      ribbon={ribbon}
      isEmbed={isStudentMode}
      sidebar={
        <Sidebar
          tables={tables}
          databaseId={databaseId}
          onDeleteTable={onDeleteTable}
          isStudentMode={isStudentMode}
          activeQueryId={queryId}
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
      <div className="flex flex-col h-full">
        {/* Query name tab */}
        <div className="flex items-center h-7 bg-[#f3f2f1] border-b border-gray-300 px-2 gap-2 flex-none">
          {editingName ? (
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onBlur={handleRenameSave}
              onKeyDown={e => e.key === 'Enter' && handleRenameSave()}
              className="text-sm font-semibold border border-red-400 rounded px-1 outline-none"
            />
          ) : (
            <span
              className="text-sm font-semibold text-gray-700 border-b-2 border-[#6c3eb5] px-2 pb-0.5 cursor-pointer"
              onDoubleClick={() => { setNameInput(queryName); setEditingName(true); }}
              title="Double-click to rename"
            >
              {queryName || 'Query'}
            </span>
          )}
          <span className="text-xs text-gray-400">({view === 'design' ? 'Design View' : view === 'sql' ? 'SQL View' : 'Datasheet View'})</span>
        </div>

        {view === 'design' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Table pane */}
            <div className="flex-none h-52 border-b-2 border-gray-400 bg-[#f9f9f9] flex gap-3 p-3 overflow-x-auto">
              {/* Add Table box */}
              <div className="flex-none w-40 border border-gray-300 rounded bg-white shadow-sm flex flex-col">
                <div className="text-xs font-bold text-gray-500 px-2 py-1.5 bg-gray-100 border-b border-gray-300 rounded-t">Add Table</div>
                <div className="flex-1 overflow-y-auto py-1">
                  {tables.filter(t => !definition.tables.find(dt => dt.tableId === t.id)).map(t => (
                    <button key={t.id} onClick={() => handleAddTable(t.id, t.name)} className="w-full text-left px-2 py-1 text-xs hover:bg-red-50 flex items-center gap-1">
                      <Plus size={10} className="text-[#C42B1C]" />{t.name}
                    </button>
                  ))}
                  {tables.filter(t => !definition.tables.find(dt => dt.tableId === t.id)).length === 0 && (
                    <div className="text-xs text-gray-400 italic px-2 py-1">All tables added</div>
                  )}
                </div>
              </div>

              {/* Table boxes */}
              {definition.tables.map(dt => {
                const td = tableDetails[dt.tableId];
                return (
                  <div key={dt.tableId} className="flex-none w-44 border border-gray-400 rounded bg-white shadow flex flex-col">
                    <div className="flex items-center justify-between bg-[#6c3eb5] text-white px-2 py-1 rounded-t text-xs font-semibold">
                      <span className="truncate">{dt.tableName}</span>
                      <button onClick={() => handleRemoveTable(dt.tableId)} className="hover:opacity-70 ml-1 flex-none"><Trash2 size={10} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {td ? (
                        <>
                          <button onClick={() => handleAddAllFields(dt.tableId, dt.tableName)} className="w-full text-left px-2 py-1 text-xs italic text-[#6c3eb5] hover:bg-purple-50 border-b border-gray-100">
                            * (All Fields)
                          </button>
                          {[...td.fields].sort((a, b) => a.sortOrder - b.sortOrder).map(f => (
                            <button key={f.id} onClick={() => handleAddField(dt.tableId, dt.tableName, f.name)} className="w-full text-left px-2 py-1 text-xs hover:bg-purple-50 flex items-center gap-1">
                              {f.isPrimaryKey && <span className="text-[8px]">🔑</span>}
                              {f.name}
                            </button>
                          ))}
                        </>
                      ) : <div className="text-xs text-gray-400 p-2">Loading...</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* QBE Grid */}
            <div className="flex-1 overflow-auto">
              {definition.columns.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-gray-400 italic">
                  Click a field in the table above, or click "Add Table" to get started
                </div>
              ) : (
                <table className="border-collapse text-xs min-w-full">
                  <thead>
                    <tr>
                      <th className="w-24 bg-[#f3f2f1] border border-gray-300 px-2 py-1 text-left text-gray-600 font-semibold sticky left-0 z-10"></th>
                      {definition.columns.map((col, idx) => (
                        <th key={idx} className="min-w-[130px] bg-[#f3f2f1] border border-gray-300 px-1 py-1">
                          <div className="flex items-center gap-0.5 justify-between">
                            <span className="font-semibold text-gray-700 truncate">{col.alias || col.fieldName}</span>
                            <div className="flex gap-0.5 flex-none">
                              <button onClick={() => handleMoveColumn(idx, -1)} disabled={idx === 0} className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronLeft size={10} /></button>
                              <button onClick={() => handleMoveColumn(idx, 1)} disabled={idx === definition.columns.length - 1} className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronRight size={10} /></button>
                              <button onClick={() => handleRemoveColumn(idx)} className="p-0.5 hover:bg-red-100 rounded text-red-400"><Trash2 size={10} /></button>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Field row */}
                    <tr>
                      <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-600 sticky left-0 z-10">Field:</td>
                      {definition.columns.map((col, idx) => (
                        <td key={idx} className="border border-gray-300 px-1 py-0.5">
                          <select
                            value={`${col.tableId}::${col.fieldName}`}
                            onChange={e => {
                              const [tid, fname] = e.target.value.split('::');
                              const tableId = parseInt(tid);
                              const t = definition.tables.find(t => t.tableId === tableId);
                              if (t) updateColumn(idx, { tableId, tableName: t.tableName, fieldName: fname });
                            }}
                            className="w-full text-xs outline-none bg-white border border-gray-200 rounded px-1"
                          >
                            {definition.tables.map(dt =>
                              (tableDetails[dt.tableId]?.fields || []).sort((a, b) => a.sortOrder - b.sortOrder).map(f => (
                                <option key={`${dt.tableId}::${f.name}`} value={`${dt.tableId}::${f.name}`}>{f.name} ({dt.tableName})</option>
                              ))
                            )}
                          </select>
                        </td>
                      ))}
                    </tr>
                    {/* Table row */}
                    <tr>
                      <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-600 sticky left-0 z-10">Table:</td>
                      {definition.columns.map((col, idx) => (
                        <td key={idx} className="border border-gray-300 px-1 py-0.5 text-gray-500">{col.tableName}</td>
                      ))}
                    </tr>
                    {/* Sort row */}
                    <tr>
                      <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-600 sticky left-0 z-10">Sort:</td>
                      {definition.columns.map((col, idx) => (
                        <td key={idx} className="border border-gray-300 px-1 py-0.5">
                          <select value={col.sort || ''} onChange={e => updateColumn(idx, { sort: (e.target.value as any) || null })} className="w-full text-xs outline-none bg-white border border-gray-200 rounded px-1">
                            <option value="">(not sorted)</option>
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                          </select>
                        </td>
                      ))}
                    </tr>
                    {/* Show row */}
                    <tr>
                      <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-600 sticky left-0 z-10">Show:</td>
                      {definition.columns.map((col, idx) => (
                        <td key={idx} className="border border-gray-300 px-1 py-0.5 text-center">
                          <input type="checkbox" checked={col.show} onChange={e => updateColumn(idx, { show: e.target.checked })} className="w-3.5 h-3.5 text-red-600" />
                        </td>
                      ))}
                    </tr>
                    {/* Criteria row */}
                    <tr>
                      <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-600 sticky left-0 z-10">Criteria:</td>
                      {definition.columns.map((col, idx) => (
                        <td key={idx} className="border border-gray-300 px-0.5 py-0.5">
                          <input type="text" value={col.criteria} onChange={e => updateColumn(idx, { criteria: e.target.value })} placeholder='e.g. "Smith" or >5' className="w-full text-xs outline-none px-1 py-0.5 bg-white focus:bg-purple-50 border-0" />
                        </td>
                      ))}
                    </tr>
                    {/* Or row */}
                    <tr>
                      <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-400 sticky left-0 z-10">Or:</td>
                      {definition.columns.map((_, idx) => (
                        <td key={idx} className="border border-gray-300 px-0.5 py-0.5">
                          <input type="text" readOnly className="w-full text-xs outline-none px-1 py-0.5 bg-white border-0 text-gray-300" />
                        </td>
                      ))}
                    </tr>
                    {/* Alias row */}
                    <tr>
                      <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-600 sticky left-0 z-10">Alias:</td>
                      {definition.columns.map((col, idx) => (
                        <td key={idx} className="border border-gray-300 px-0.5 py-0.5">
                          <input type="text" value={col.alias} onChange={e => updateColumn(idx, { alias: e.target.value })} placeholder={col.fieldName} className="w-full text-xs outline-none px-1 py-0.5 bg-white focus:bg-purple-50 border-0" />
                        </td>
                      ))}
                    </tr>
                    {/* Totals row (conditionally shown) */}
                    {showTotals && (
                      <tr>
                        <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-600 sticky left-0 z-10">Total:</td>
                        {definition.columns.map((_, idx) => (
                          <td key={idx} className="border border-gray-300 px-1 py-0.5">
                            <select className="w-full text-xs outline-none bg-white border border-gray-200 rounded px-1">
                              <option>Group By</option>
                              <option>Sum</option>
                              <option>Avg</option>
                              <option>Min</option>
                              <option>Max</option>
                              <option>Count</option>
                              <option>Where</option>
                            </select>
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Datasheet View ── */}
        {view === 'datasheet' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {isRunning ? (
              <div className="p-4 text-sm text-gray-500">Running query...</div>
            ) : results ? (
              <>
                <div className="flex-1 overflow-auto">
                  {results.columns.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm italic">No columns to display. Add fields in Design View.</div>
                  ) : (
                    <table className="border-collapse text-sm min-w-full bg-white">
                      <thead className="sticky top-0 z-10">
                        <tr>
                          <th className="w-8 bg-[#f3f2f1] border-r border-b border-gray-300" />
                          {results.columns.map(col => (
                            <th key={col.key} className="bg-[#f3f2f1] border-r border-b border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-700 text-left whitespace-nowrap">
                              {col.label}
                            </th>
                          ))}
                          <th className="bg-[#f3f2f1] border-b border-gray-300 w-full" />
                        </tr>
                      </thead>
                      <tbody>
                        {results.rows.map((row, ri) => (
                          <tr key={ri} className="border-b border-gray-200 hover:bg-red-50/30">
                            <td className="w-8 bg-[#f3f2f1] border-r border-gray-300 text-center text-xs text-gray-400 h-7">{ri + 1}</td>
                            {results.columns.map(col => {
                              const ft = getQueryColType(col);
                              const isNumeric = ft === 'number' || ft === 'currency';
                              return (
                                <td key={col.key} className={`border-r border-gray-200 px-2 h-7 text-sm max-w-[200px] truncate${isNumeric ? ' text-right' : ''}`}>
                                  {formatQueryValue(ft, row[col.key])}
                                </td>
                              );
                            })}
                            <td className="w-full" />
                          </tr>
                        ))}
                        {results.rows.length === 0 && (
                          <tr>
                            <td colSpan={results.columns.length + 2} className="px-4 py-6 text-center text-gray-400 italic text-sm">
                              No records match the criteria
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="h-7 bg-[#f3f2f1] border-t border-gray-300 flex items-center px-3 text-xs text-gray-600 flex-none">
                  {results.rows.length} record(s) returned
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-gray-400 text-sm italic">Press Run to execute this query</div>
            )}
          </div>
        )}

        {/* ── SQL View ── */}
        {view === 'sql' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Line numbers + Editor */}
            <div className="flex-1 flex overflow-hidden border-b border-gray-300 min-h-0">
              <div
                ref={sqlGutterRef}
                className="bg-[#f5f5f5] border-r border-gray-300 py-3 px-2 text-right text-xs font-mono text-gray-400 select-none overflow-hidden flex-none leading-[1.375rem] whitespace-pre-wrap"
                style={{ minWidth: '2.5rem' }}
              >
                {sqlText.split('\n').map((_, i) => `${i + 1}\n`).join('')}
              </div>
              {/* Editor wrapper: highlight overlay + transparent textarea */}
              <div className="flex-1 relative overflow-hidden">
                {/* Syntax highlight backdrop */}
                <div
                  ref={sqlHighlightRef}
                  className="absolute inset-0 py-3 px-2 font-mono text-sm leading-[1.375rem] whitespace-pre-wrap break-words pointer-events-none overflow-hidden bg-white"
                  dangerouslySetInnerHTML={{ __html: highlightSQL(sqlText) + '\u200b' }}
                  aria-hidden
                />
                {/* Placeholder when textarea is empty */}
                {!sqlText && (
                  <div className="absolute top-0 left-0 py-3 px-2 font-mono text-sm leading-[1.375rem] text-gray-400 pointer-events-none select-none">
                    SELECT * FROM TableName
                  </div>
                )}
                <textarea
                  ref={sqlRef}
                  value={sqlText}
                  onChange={e => { setSqlText(e.target.value); setSqlUserEdited(true); }}
                  onKeyDown={handleSqlKeyDown}
                  onScroll={() => {
                    if (sqlGutterRef.current && sqlRef.current) sqlGutterRef.current.scrollTop = sqlRef.current.scrollTop;
                    if (sqlHighlightRef.current && sqlRef.current) { sqlHighlightRef.current.scrollTop = sqlRef.current.scrollTop; sqlHighlightRef.current.scrollLeft = sqlRef.current.scrollLeft; }
                  }}
                  className="absolute inset-0 w-full h-full py-3 px-2 font-mono text-sm resize-none outline-none bg-transparent leading-[1.375rem]"
                  style={{ color: 'transparent', caretColor: '#333' }}
                  spellCheck={false}
                />
              </div>
            </div>
            {/* Run bar */}
            <div className="flex-none flex items-center gap-2 px-3 py-2 bg-[#f3f2f1] border-t border-gray-300">
              <button
                onClick={handleRunSql}
                disabled={isSqlRunning}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#e1dfdd] border border-gray-400 text-gray-700 text-xs rounded hover:bg-[#d2d0ce] disabled:opacity-50"
              >
                <Play size={12} /> {isSqlRunning ? 'Running...' : 'Run'}
              </button>
              <span className="text-xs text-gray-400">Ctrl+Enter or F5 to run</span>
            </div>
            {/* Results */}
            {sqlError && (
              <div className="flex-none mx-3 my-2 p-2 bg-red-50 border border-red-300 rounded text-xs text-red-700 font-mono">
                {sqlError}
              </div>
            )}
            {sqlResults && !sqlError && (
              <div className="flex flex-col flex-none max-h-64 overflow-auto border-t border-gray-300">
                {sqlResults.columns.length === 0 ? (
                  <div className="p-4 text-xs text-gray-400 italic">No results</div>
                ) : (
                  <table className="border-collapse text-xs min-w-full bg-white">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        {sqlResults.columns.map(col => (
                          <th key={col} className="bg-[#f3f2f1] border-r border-b border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-left whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sqlResults.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-gray-200 hover:bg-gray-50">
                          {sqlResults!.columns.map(col => (
                            <td key={col} className="border-r border-gray-200 px-2 py-1 max-w-[200px] truncate">
                              {row[col] === null || row[col] === undefined ? <span className="text-gray-400 italic">null</span> : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div className="h-6 bg-[#f3f2f1] border-t border-gray-300 flex items-center px-3 text-xs text-gray-600 flex-none">
                  {sqlResults.rows.length} row(s)
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
