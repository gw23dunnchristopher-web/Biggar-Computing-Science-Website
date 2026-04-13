import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Shell } from '@/components/layout/Shell';
import { Sidebar } from '@/components/layout/Sidebar';
import { Ribbon, RibbonGroup, RibbonButton, RibbonDropdownButton, RibbonContextSection } from '@/components/layout/Ribbon';
import { CreateTabContent, ExternalDataTabContent, DatabaseToolsTabContent } from '@/components/layout/AccessRibbonTabs';
import { Database, Table as TableType } from '@/api';
import {
  Play, Plus, Trash2, ChevronLeft, ChevronRight, Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DesignViewIcon } from '@/components/ui/design-view-icon';
import {
  DsDatasheetIcon, DsQueriesSQLQueryIcon,
  DsQueryTypeSelectIcon, DsQueryTypeMakeTableIcon, DsQueryTypeAppendIcon,
  DsQueryTypeUpdateIcon, DsQueryTypeDeleteIcon, DsQueryTypeCrosstabIcon,
  DsQueryTypeUnionIcon, DsQueryTypePassThroughIcon, DsQueryTypeDataDefinitionIcon,
  DsQuerySetupAddTablesIcon, DsQuerySetupBuilderIcon,
  DsQuerySetupDeleteColumnsIcon, DsQuerySetupDeleteRowsIcon,
  DsQuerySetupInsertColumnsIcon, DsQuerySetupInsertRowsIcon,
  DsQuerySetupDeleteReturnIcon,
  DsShowHideParametersIcon, DsShowHidePropertySheetIcon,
  DsShowHideTableNamesIcon, DsShowHideTotalsIcon,
  DsRecordsSaveIcon,
} from '@/components/ui/ds-icons';

type TotalFn = 'Group By' | 'Sum' | 'Avg' | 'Min' | 'Max' | 'Count' | 'Where' | '';
interface QueryColumn {
  tableId: number;
  tableName: string;
  fieldName: string;
  alias: string;
  show: boolean;
  sort: 'asc' | 'desc' | null;
  criteria: string;
  totalFn?: TotalFn;
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
  initialView?: 'design' | 'sql' | 'datasheet';
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

function applyAggregate(fn: TotalFn | undefined, expr: string): string {
  if (!fn || fn === 'Group By' || fn === '') return expr;
  const upper = fn.toUpperCase();
  return `${upper}(${expr})`;
}

function buildQuerySql(definition: QueryDefinition): string {
  if (definition.tables.length === 0) return '';
  const multiTable = definition.tables.length > 1;
  const hasTotals = definition.columns.some(c => c.totalFn && c.totalFn !== 'Group By' && c.totalFn !== '');

  const fieldRef = (c: QueryColumn) =>
    multiTable ? `${sqlName(c.tableName)}.${sqlName(c.fieldName)}` : sqlName(c.fieldName);

  // Columns that participate in SELECT (shown, or with an aggregate function that isn't 'Where')
  const showCols = definition.columns.filter(c => c.show && c.totalFn !== 'Where');
  const selectParts = showCols.length > 0
    ? showCols.map(c => {
        const expr = hasTotals ? applyAggregate(c.totalFn, fieldRef(c)) : fieldRef(c);
        const label = c.alias || (hasTotals && c.totalFn && c.totalFn !== 'Group By' && c.totalFn !== '' ? `${c.totalFn}_${c.fieldName}` : null);
        return label ? `${expr} AS ${sqlName(label)}` : expr;
      })
    : ['*'];

  let sql = `SELECT ${selectParts.join(', ')}\nFROM ${definition.tables.map(t => sqlName(t.tableName)).join(', ')}`;

  // WHERE: criteria columns + 'Where'-totalFn columns
  const whereCols = definition.columns.filter(c => c.criteria.trim());
  if (whereCols.length > 0) {
    sql += '\nWHERE ' + whereCols.map(c => {
      const ref = fieldRef(c);
      const crit = c.criteria.trim();
      // If criteria is a bare word/number without operator prefix, wrap in quotes for string comparison
      if (/^[=<>!]/.test(crit)) return `${ref} ${crit}`;
      if (/^".*"$/.test(crit) || /^'.*'$/.test(crit)) return `${ref} = ${crit}`;
      if (/^\d+(\.\d+)?$/.test(crit)) return `${ref} = ${crit}`;
      return `${ref} = '${crit.replace(/'/g, "''")}'`;
    }).join('\n  AND ');
  }

  // GROUP BY: columns with 'Group By' totalFn (only when totals are active)
  if (hasTotals) {
    const groupByCols = definition.columns.filter(c => !c.totalFn || c.totalFn === 'Group By' || c.totalFn === '');
    if (groupByCols.length > 0) {
      sql += '\nGROUP BY ' + groupByCols.map(c => fieldRef(c)).join(', ');
    }
  }

  // ORDER BY
  const sortCols = definition.columns.filter(c => c.sort);
  if (sortCols.length > 0) {
    sql += '\nORDER BY ' + sortCols.map(c => {
      const expr = hasTotals ? applyAggregate(c.totalFn, fieldRef(c)) : fieldRef(c);
      return `${expr} ${c.sort === 'asc' ? 'ASC' : 'DESC'}`;
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
  const search = useSearch();
  const { toast } = useToast();

  const urlView = new URLSearchParams(search).get('view');
  const resolvedInitialView: 'design' | 'datasheet' | 'sql' =
    urlView === 'datasheet' ? 'datasheet' : urlView === 'sql' ? 'sql' : (initialView ?? 'design');

  const [view, setView] = useState<'design' | 'datasheet' | 'sql'>(resolvedInitialView);
  const [queryName, setQueryName] = useState('');
  const [definition, setDefinition] = useState<QueryDefinition>({ tables: [], columns: [] });
  const [tableDetails, setTableDetails] = useState<Record<number, TableWithFields>>({});
  const [results, setResults] = useState<{ columns: { key: string; label: string; fieldName?: string; tableName?: string }[]; rows: Record<string, any>[] } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showTotals, setShowTotals] = useState(false);
  const [showTableRow, setShowTableRow] = useState(true);
  const [showAddTablesSidebar, setShowAddTablesSidebar] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [tablePositions, setTablePositions] = useState<Record<number, { x: number; y: number }>>({});
  const [returnLimit, setReturnLimit] = useState('All');
  const [tablePaneHeight, setTablePaneHeight] = useState(280);
  const dragRef = useRef<{ tableId: number; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startY: number; origHeight: number } | null>(null);

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
        if (resolvedInitialView === 'sql') {
          const sql = def.tables && def.tables.length > 0 ? buildQuerySql({ tables: def.tables || [], columns: def.columns || [] }) : 'SELECT;';
          setSqlText(sql);
        } else if (resolvedInitialView === 'datasheet') {
          // Auto-run the query to show results immediately
          setIsRunning(true);
          apiFetch(`/api/ds/databases/${databaseId}/queries/${queryId}/run`, { method: 'POST' })
            .then(data => { setResults(data); setView('datasheet'); })
            .catch(() => toast({ title: 'Failed to run query', variant: 'destructive' }))
            .finally(() => setIsRunning(false));
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

  const handleTableDragStart = useCallback((tableId: number, e: React.MouseEvent) => {
    e.preventDefault();
    const pos = tablePositions[tableId] || { x: 0, y: 0 };
    dragRef.current = { tableId, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    const handleMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      setTablePositions(prev => ({ ...prev, [dragRef.current!.tableId]: { x: dragRef.current!.origX + dx, y: dragRef.current!.origY + dy } }));
    };
    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [tablePositions]);

  const handleQbeResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { startY: e.clientY, origHeight: tablePaneHeight };
    const handleMove = (me: MouseEvent) => {
      if (!resizeRef.current) return;
      const next = resizeRef.current.origHeight + (me.clientY - resizeRef.current.startY);
      setTablePaneHeight(Math.max(180, Math.min(520, next)));
    };
    const handleUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [tablePaneHeight]);

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

  const qbeSlots = 8;
  const blankColumns = Array.from({ length: qbeSlots }, (_, idx) => definition.columns[idx] ?? null);

  const updateColumn = (idx: number, patch: Partial<QueryColumn>) => {
    setDefinition(prev => {
      const cols = [...prev.columns];
      if (!cols[idx]) {
        cols[idx] = { tableId: 0, tableName: '', fieldName: '', alias: '', show: true, sort: null, criteria: '' };
      }
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
                icon={<span className="text-[#C42B1C] font-black text-[28px] leading-none">!</span>}
                label="Run"
                onClick={view === 'sql' ? handleRunSql : handleRun}
                disabled={view === 'sql' ? (!sqlText.trim() || isSqlRunning) : (isRunning || definition.tables.length === 0)}
              />
            </RibbonGroup>
            <RibbonGroup name="Query Type">
              <RibbonButton icon={<DsQueryTypeSelectIcon size={32} />} label="Select" active />
              <RibbonButton icon={<DsQueryTypeMakeTableIcon size={32} />} label="Make Table" disabled />
              <RibbonButton icon={<DsQueryTypeAppendIcon size={32} />} label="Append" disabled />
              <RibbonButton icon={<DsQueryTypeUpdateIcon size={32} />} label="Update" disabled />
              <RibbonButton icon={<DsQueryTypeDeleteIcon size={32} />} label="Delete" disabled />
              <RibbonButton icon={<DsQueryTypeCrosstabIcon size={32} />} label="Crosstab" disabled />
              <div className="flex flex-col justify-around h-full pb-5 pt-1">
                <RibbonButton size="small" icon={<DsQueryTypeUnionIcon size={16} />} label="Union" disabled />
                <RibbonButton size="small" icon={<DsQueryTypePassThroughIcon size={16} />} label="Pass-Through" disabled />
                <RibbonButton size="small" icon={<DsQueryTypeDataDefinitionIcon size={16} />} label="Data Definition" disabled />
              </div>
            </RibbonGroup>
            <RibbonGroup name="Query Setup">
              <RibbonButton icon={<DsQuerySetupAddTablesIcon size={32} />} label="Add Tables" onClick={() => setShowAddTablesSidebar(s => !s)} active={showAddTablesSidebar} />
              <div className="flex flex-col justify-around h-full pb-5 pt-1">
                <RibbonButton size="small" icon={<DsQuerySetupInsertRowsIcon size={16} />} label="Insert Rows" disabled />
                <RibbonButton size="small" icon={<DsQuerySetupDeleteRowsIcon size={16} />} label="Delete Rows" disabled />
              </div>
              <div className="flex flex-col justify-around h-full pb-5 pt-1">
                <RibbonButton size="small" icon={<DsQuerySetupInsertColumnsIcon size={16} />} label="Insert Columns" disabled />
                <RibbonButton size="small" icon={<DsQuerySetupDeleteColumnsIcon size={16} />} label="Delete Columns" disabled />
              </div>
              <div className="flex flex-col justify-around h-full pb-5 pt-1">
                <RibbonButton size="small" icon={<DsQuerySetupBuilderIcon size={16} />} label="Builder" disabled />
                <div className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700">
                  <span>Return:</span>
                  <select value={returnLimit} onChange={e => setReturnLimit(e.target.value)} className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white outline-none cursor-pointer">
                    <option value="5">5</option>
                    <option value="25">25</option>
                    <option value="100">100</option>
                    <option value="5%">5%</option>
                    <option value="25%">25%</option>
                    <option value="All">All</option>
                  </select>
                </div>
              </div>
            </RibbonGroup>
            <RibbonGroup name="Show/Hide">
              <RibbonButton icon={<DsShowHideTotalsIcon size={32} />} label="Totals" onClick={() => setShowTotals(!showTotals)} active={showTotals} />
              <RibbonButton icon={<DsShowHideParametersIcon size={32} />} label="Parameters" disabled />
              <div className="flex flex-col justify-around h-full pb-5 pt-1">
                <RibbonButton size="small" icon={<DsShowHidePropertySheetIcon size={16} />} label="Property Sheet" disabled />
                <RibbonButton size="small" icon={<DsShowHideTableNamesIcon size={16} />} label="Table Names" onClick={() => setShowTableRow(s => !s)} active={showTableRow} />
              </div>
            </RibbonGroup>
            <RibbonGroup name="Save">
              <RibbonButton icon={<DsRecordsSaveIcon size={32} />} label="Save" onClick={handleSave} disabled={isSaving} />
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
            icon={view === 'datasheet' ? <DsDatasheetIcon size={32} /> : view === 'sql' ? <span className="text-[18px] font-semibold leading-none">SQL</span> : <DesignViewIcon size={32} />}
            label={view === 'sql' ? 'SQL' : view === 'datasheet' ? 'Datasheet' : 'Design'}
          >
            <RibbonButton icon={<DesignViewIcon size={16} />} label="Design" onClick={() => switchView('design')} active={view === 'design'} />
            <RibbonButton icon={<DsDatasheetIcon size={16} />} label="Datasheet" onClick={() => switchView('datasheet')} active={view === 'datasheet'} />
            <RibbonButton icon={<span className="text-[14px] font-semibold leading-none">SQL</span>} label="SQL" onClick={() => switchView('sql')} active={view === 'sql'} />
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
            {/* Table pane + Add Tables sidebar */}
            <div className="flex flex-none border-b-2 border-gray-400" style={{ height: tablePaneHeight }}>
              <div className="flex-1 bg-[#e8e8e8] relative overflow-auto" onClick={() => setSelectedTableId(null)}>
                {definition.tables.map((dt, idx) => {
                  const td = tableDetails[dt.tableId];
                  const pos = tablePositions[dt.tableId] || { x: 16 + idx * 180, y: 16 };
                  const isSelected = selectedTableId === dt.tableId;
                  return (
                    <div
                      key={dt.tableId}
                      className={`absolute w-44 border bg-white shadow-sm flex flex-col ${isSelected ? 'border-[#E8A317] ring-2 ring-[#E8A317]/40' : 'border-gray-400'}`}
                      style={{ left: pos.x, top: pos.y }}
                      onClick={e => { e.stopPropagation(); setSelectedTableId(dt.tableId); }}
                    >
                      <div
                        className="flex items-center justify-between bg-white border-b border-gray-300 px-2 py-1 text-xs font-semibold text-gray-800 cursor-move select-none"
                        onMouseDown={e => handleTableDragStart(dt.tableId, e)}
                      >
                        <span className="truncate">{dt.tableName}</span>
                        <button onClick={e => { e.stopPropagation(); handleRemoveTable(dt.tableId); }} className="hover:text-red-500 ml-1 flex-none"><Trash2 size={10} /></button>
                      </div>
                      <div className="max-h-36 overflow-y-auto">
                        {td ? (
                          <>
                            <button onClick={() => handleAddAllFields(dt.tableId, dt.tableName)} className="w-full text-left px-2 py-1 text-xs italic text-gray-500 hover:bg-blue-50 border-b border-gray-100 bg-red-50/40">
                              *
                            </button>
                            {[...td.fields].sort((a, b) => a.sortOrder - b.sortOrder).map(f => (
                              <button key={f.id} onClick={() => handleAddField(dt.tableId, dt.tableName, f.name)} className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 flex items-center gap-1">
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
                {definition.tables.length === 0 && (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400 italic">Add tables using the sidebar or the "Add Tables" button</div>
                )}
              </div>
              {showAddTablesSidebar && (
                <div className="w-48 border-l border-gray-400 bg-white flex flex-col flex-none">
                  <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 border-b border-gray-300 text-xs font-semibold text-gray-700">
                    <span>Add Tables</span>
                    <button onClick={() => setShowAddTablesSidebar(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200 text-[10px] text-gray-500">
                    <span className="font-semibold text-gray-700 border-b border-[#C42B1C] pb-0.5">Tables</span>
                  </div>
                  <div className="flex-1 overflow-y-auto py-0.5">
                    {tables.map(t => {
                      const alreadyAdded = !!definition.tables.find(dt => dt.tableId === t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => !alreadyAdded && handleAddTable(t.id, t.name)}
                          className={`w-full text-left px-2 py-1 text-xs ${alreadyAdded ? 'bg-[#C42B1C] text-white' : 'hover:bg-red-50 text-gray-700'}`}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="px-2 py-1.5 border-t border-gray-200">
                    <button
                      onClick={() => {
                        const available = tables.filter(t => !definition.tables.find(dt => dt.tableId === t.id));
                        if (available.length > 0) handleAddTable(available[0].id, available[0].name);
                      }}
                      disabled={tables.filter(t => !definition.tables.find(dt => dt.tableId === t.id)).length === 0}
                      className="w-full text-xs py-1 px-2 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Add Selected Tables
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div
              className="h-2 bg-gray-300 hover:bg-[#C42B1C] cursor-row-resize flex-none"
              onMouseDown={handleQbeResizeStart}
            />

            {/* QBE Grid */}
            <div className="flex-1 overflow-auto">
              <table className="border-collapse text-xs min-w-full">
                  <thead>
                    <tr>
                      <th className="w-24 bg-[#f3f2f1] border border-gray-300 px-2 py-1 text-left text-gray-600 font-semibold sticky left-0 z-10"></th>
                      {blankColumns.map((col, idx) => (
                        <th key={idx} className="min-w-[130px] w-[130px] bg-[#f3f2f1] border border-gray-300 px-1 py-1">
                          <div className="flex items-center gap-0.5 justify-between">
                            <span className="font-semibold text-gray-700 truncate">{col ? (col.alias || col.fieldName) : ''}</span>
                            <div className="flex gap-0.5 flex-none">
                              {col && (
                                <>
                                  <button onClick={() => handleMoveColumn(idx, -1)} disabled={idx === 0} className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronLeft size={10} /></button>
                                  <button onClick={() => handleMoveColumn(idx, 1)} disabled={idx === definition.columns.length - 1} className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronRight size={10} /></button>
                                  <button onClick={() => handleRemoveColumn(idx)} className="p-0.5 hover:bg-red-100 rounded text-red-400"><Trash2 size={10} /></button>
                                </>
                              )}
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
                      {blankColumns.map((col, idx) => (
                        <td key={idx} className="border border-gray-300 px-1 py-0.5">
                          {col ? (
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
                          ) : (
                            <input
                              type="text"
                              className="w-full text-xs outline-none bg-white border border-gray-200 rounded px-1 py-0.5"
                              placeholder=""
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                    {showTableRow && (
                      <tr>
                        <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-600 sticky left-0 z-10">Table:</td>
                        {blankColumns.map((col, idx) => (
                          <td key={idx} className="border border-gray-300 px-1 py-0.5 text-gray-500">{col?.tableName || ''}</td>
                        ))}
                      </tr>
                    )}
                    {/* Sort row */}
                    <tr>
                      <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-600 sticky left-0 z-10">Sort:</td>
                      {blankColumns.map((col, idx) => (
                        <td key={idx} className="border border-gray-300 px-1 py-0.5">
                          {col ? (
                            <select value={col.sort || ''} onChange={e => updateColumn(idx, { sort: (e.target.value as any) || null })} className="w-full text-xs outline-none bg-white border border-gray-200 rounded px-1">
                              <option value="">(not sorted)</option>
                              <option value="asc">Ascending</option>
                              <option value="desc">Descending</option>
                            </select>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                    {/* Show row */}
                    <tr>
                      <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-600 sticky left-0 z-10">Show:</td>
                      {blankColumns.map((col, idx) => (
                        <td key={idx} className="border border-gray-300 px-1 py-0.5 text-center">
                          {col ? <input type="checkbox" checked={col.show} onChange={e => updateColumn(idx, { show: e.target.checked })} className="w-3.5 h-3.5 text-red-600" /> : null}
                        </td>
                      ))}
                    </tr>
                    {/* Criteria row */}
                    <tr>
                      <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-600 sticky left-0 z-10">Criteria:</td>
                      {blankColumns.map((col, idx) => (
                        <td key={idx} className="border border-gray-300 px-0.5 py-0.5">
                          {col ? <input type="text" value={col.criteria} onChange={e => updateColumn(idx, { criteria: e.target.value })} placeholder='e.g. "Smith" or >5' className="w-full text-xs outline-none px-1 py-0.5 bg-white focus:bg-purple-50 border-0" /> : <input type="text" className="w-full text-xs outline-none px-1 py-0.5 bg-white border-0" />}
                        </td>
                      ))}
                    </tr>
                    {/* Or row */}
                    <tr>
                      <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-400 sticky left-0 z-10">Or:</td>
                      {blankColumns.map((_, idx) => (
                        <td key={idx} className="border border-gray-300 px-0.5 py-0.5">
                          <input type="text" readOnly className="w-full text-xs outline-none px-1 py-0.5 bg-white border-0 text-gray-300" />
                        </td>
                      ))}
                    </tr>
                    {/* Alias row */}
                    <tr>
                      <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-600 sticky left-0 z-10">Alias:</td>
                      {blankColumns.map((col, idx) => (
                        <td key={idx} className="border border-gray-300 px-0.5 py-0.5">
                          {col ? <input type="text" value={col.alias} onChange={e => updateColumn(idx, { alias: e.target.value })} placeholder={col.fieldName} className="w-full text-xs outline-none px-1 py-0.5 bg-white focus:bg-purple-50 border-0" /> : <input type="text" className="w-full text-xs outline-none px-1 py-0.5 bg-white border-0" />}
                        </td>
                      ))}
                    </tr>
                    {/* Totals row (conditionally shown) */}
                    {showTotals && (
                      <tr>
                        <td className="bg-[#eee] border border-gray-300 px-2 py-1 font-semibold text-gray-600 sticky left-0 z-10">Total:</td>
                        {blankColumns.map((col, idx) => (
                          <td key={idx} className="border border-gray-300 px-1 py-0.5">
                            {col ? (
                              <select
                                className="w-full text-xs outline-none bg-white border border-gray-200 rounded px-1"
                                value={col.totalFn ?? 'Group By'}
                                onChange={e => updateColumn(idx, { totalFn: e.target.value as TotalFn })}
                              >
                                <option value="Group By">Group By</option>
                                <option value="Sum">Sum</option>
                                <option value="Avg">Avg</option>
                                <option value="Min">Min</option>
                                <option value="Max">Max</option>
                                <option value="Count">Count</option>
                                <option value="Where">Where</option>
                              </select>
                            ) : (
                              <select className="w-full text-xs outline-none bg-white border border-gray-200 rounded px-1" disabled>
                                <option>Group By</option>
                              </select>
                            )}
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              <div className="h-4" />
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
