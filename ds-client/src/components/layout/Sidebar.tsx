import React, { useState } from 'react';
import { Table2, ChevronDown, ChevronRight, Trash2, List, LayoutTemplate, FileText, Copy, Pencil, Grid3X3, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { DesignViewIcon } from '@/components/ui/design-view-icon';
import { Link, useLocation } from 'wouter';
import { guardedNavigate } from '@/lib/design-guard';
import { Table, useUpdateTable, useCreateTable, getListTablesQueryKey, getGetTableQueryKey } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
} from '@/components/ui/context-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    ...opts,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

export interface QueryRow  { id: number; name: string; databaseId: number; }
export interface FormRow   { id: number; name: string; databaseId: number; }
export interface ReportRow { id: number; name: string; databaseId: number; }

type ObjType = 'table' | 'query' | 'form' | 'report';

interface RenameDialog { type: ObjType; id: number; currentName: string; }

interface SidebarProps {
  tables: Table[];
  databaseId: number;
  isStudentMode?: boolean;
  onDeleteTable?: (id: number) => void;
  activeTableId?: number;
  activeQueryId?: number;
  activeFormId?: number;
  activeReportId?: number;
  onSelectTable?: (id: number) => void;
  onSelectTableDesign?: (id: number) => void;
  onSelectQuery?: (id: number) => void;
  onSelectForm?: (id: number) => void;
  onSelectReport?: (id: number) => void;
  onDeleteQuery?: (id: number) => void;
  onDeleteForm?: (id: number) => void;
  onDeleteReport?: (id: number) => void;
  queries?: QueryRow[];
  forms?: FormRow[];
  reports?: ReportRow[];
  onRefresh?: () => void;
}

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center w-full text-left px-1 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded uppercase tracking-wide"
    >
      {open ? <ChevronDown className="w-3 h-3 mr-1 flex-none" /> : <ChevronRight className="w-3 h-3 mr-1 flex-none" />}
      {label}
    </button>
  );
}

export function Sidebar({
  tables, databaseId, isStudentMode,
  onDeleteTable, activeTableId, activeQueryId, activeFormId, activeReportId,
  onSelectTable, onSelectTableDesign, onSelectQuery, onSelectForm, onSelectReport,
  onDeleteQuery, onDeleteForm, onDeleteReport,
  queries = [], forms = [], reports = [],
  onRefresh,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [tablesOpen, setTablesOpen]   = useState(true);
  const [queriesOpen, setQueriesOpen] = useState(true);
  const [formsOpen, setFormsOpen]     = useState(true);
  const [reportsOpen, setReportsOpen] = useState(true);

  type CategoryOpt = 'relatedViews' | 'objectType' | 'created' | 'modified';
  type SortByOpt = 'name' | 'type' | 'created' | 'modified';
  type ViewByOpt = 'details' | 'icons' | 'list';
  const lsRead = (k: string, fallback: string) => {
    try { return localStorage.getItem(`ds-sidebar-${k}`) || fallback; } catch { return fallback; }
  };
  const lsWrite = (k: string, v: string) => {
    try { localStorage.setItem(`ds-sidebar-${k}`, v); } catch {}
  };
  const [category, setCategory] = useState<CategoryOpt>(() => lsRead('category', 'objectType') as CategoryOpt);
  const [sortBy, setSortBy] = useState<SortByOpt>(() => lsRead('sortBy', 'name') as SortByOpt);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | 'none'>(() => lsRead('sortDir', 'asc') as any);
  const [viewBy, setViewBy] = useState<ViewByOpt>(() => lsRead('viewBy', 'details') as ViewByOpt);
  React.useEffect(() => { lsWrite('category', category); }, [category]);
  React.useEffect(() => { lsWrite('sortBy', sortBy); }, [sortBy]);
  React.useEffect(() => { lsWrite('sortDir', sortDir); }, [sortDir]);
  React.useEffect(() => { lsWrite('viewBy', viewBy); }, [viewBy]);

  const sortItems = <T extends { id: number; name: string }>(arr: T[], typeOrder = 0): T[] => {
    if (sortDir === 'none') return arr;
    const dir = sortDir === 'desc' ? -1 : 1;
    const sorted = [...arr];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'type': cmp = typeOrder; break;
        case 'created':
        case 'modified': cmp = a.id - b.id; break;
      }
      if (cmp === 0) cmp = a.name.localeCompare(b.name);
      return cmp * dir;
    });
    return sorted;
  };
  const sortedTables  = sortItems(tables);
  const sortedQueries = sortItems(queries);
  const sortedForms   = sortItems(forms);
  const sortedReports = sortItems(reports);

  // viewBy controls the row layout / icon size for object items
  const itemRowClass =
    viewBy === 'icons' ? 'flex flex-col items-center px-1 py-2 rounded text-[10px] transition-colors text-center'
    : viewBy === 'list' ? 'flex items-center px-2 py-0.5 rounded text-xs transition-colors'
    : 'flex items-center px-2 py-1.5 rounded text-xs transition-colors';
  const itemIconClass =
    viewBy === 'icons' ? 'w-6 h-6 mb-1 flex-none'
    : viewBy === 'list' ? 'w-3 h-3 mr-1 flex-none'
    : 'w-3.5 h-3.5 mr-1.5 flex-none';
  const groupContainerClass =
    viewBy === 'icons' ? 'mt-0.5 grid grid-cols-3 gap-1 ml-1'
    : 'mt-0.5 space-y-0.5 ml-2';
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateTable = useUpdateTable();
  const createTable = useCreateTable();

  const [renameDialog, setRenameDialog] = useState<RenameDialog | null>(null);
  const [renameName, setRenameName]     = useState('');
  const [busy, setBusy] = useState(false);

  const isTableActive  = (id: number) => activeTableId  === id || location.includes(`/tables/${id}/`);
  const isQueryActive  = (id: number) => activeQueryId  === id || location.includes(`/queries/${id}`);
  const isFormActive   = (id: number) => activeFormId   === id || location.includes(`/forms/${id}`);
  const isReportActive = (id: number) => activeReportId === id || location.includes(`/reports/${id}`);

  const openRename = (type: ObjType, id: number, currentName: string) => {
    setRenameDialog({ type, id, currentName });
    setRenameName(currentName);
  };

  const doRename = async () => {
    if (!renameDialog || !renameName.trim()) return;
    setBusy(true);
    try {
      const { type, id } = renameDialog;
      if (type === 'table') {
        // The list endpoint returns tables WITHOUT their fields, so we must
        // fetch the full table before sending the update — otherwise the
        // PUT replaces the field list with an empty array.
        const full = await apiFetch(`/api/ds/databases/${databaseId}/tables/${id}`);
        const fields = (full?.fields ?? []).map((f: any) => ({
          id: f.id,
          name: f.name,
          fieldType: f.fieldType,
          isRequired: !!f.isRequired,
          isPrimaryKey: !!f.isPrimaryKey,
          sortOrder: f.sortOrder,
          caption: f.caption ?? null,
          defaultValue: f.defaultValue ?? null,
          fieldSize: f.fieldSize ?? null,
          description: f.description ?? null,
        }));
        await updateTable.mutateAsync({
          databaseId, tableId: id,
          data: { name: renameName.trim(), fields },
        });
        queryClient.invalidateQueries({ queryKey: getListTablesQueryKey(databaseId) });
        queryClient.invalidateQueries({ queryKey: getGetTableQueryKey(databaseId, id) });
      } else if (type === 'query') {
        const q = queries.find(x => x.id === id);
        const full = await apiFetch(`/api/ds/databases/${databaseId}/queries/${id}`);
        await apiFetch(`/api/ds/databases/${databaseId}/queries/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: renameName.trim(), definition: full?.definition ?? {} }),
        });
        onRefresh?.();
      } else if (type === 'form') {
        const full = await apiFetch(`/api/ds/databases/${databaseId}/forms/${id}`);
        await apiFetch(`/api/ds/databases/${databaseId}/forms/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: renameName.trim(), definition: full?.definition ?? {} }),
        });
        onRefresh?.();
      } else if (type === 'report') {
        const full = await apiFetch(`/api/ds/databases/${databaseId}/reports/${id}`);
        await apiFetch(`/api/ds/databases/${databaseId}/reports/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: renameName.trim(), definition: full?.definition ?? {} }),
        });
        onRefresh?.();
      }
      toast({ title: `Renamed to "${renameName.trim()}"` });
      setRenameDialog(null);
    } catch {
      toast({ title: 'Rename failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const doCopy = async (type: ObjType, id: number, currentName: string) => {
    setBusy(true);
    try {
      const copyName = `Copy of ${currentName}`;
      if (type === 'table') {
        const full = await apiFetch(`/api/ds/databases/${databaseId}/tables/${id}`);
        await createTable.mutateAsync({
          databaseId,
          data: {
            name: copyName,
            fields: (full?.fields ?? []).map((f: any, i: number) => ({
              name: f.name, fieldType: f.fieldType, isPrimaryKey: f.isPrimaryKey,
              isRequired: f.isRequired, sortOrder: i,
              caption: f.caption ?? null, defaultValue: f.defaultValue ?? null,
              fieldSize: f.fieldSize ?? null, description: f.description ?? null,
            })),
          },
        });
        queryClient.invalidateQueries({ queryKey: getListTablesQueryKey(databaseId) });
        onRefresh?.();
      } else if (type === 'query') {
        const full = await apiFetch(`/api/ds/databases/${databaseId}/queries/${id}`);
        await apiFetch(`/api/ds/databases/${databaseId}/queries`, {
          method: 'POST',
          body: JSON.stringify({ name: copyName, definition: full?.definition ?? {} }),
        });
        onRefresh?.();
      } else if (type === 'form') {
        const full = await apiFetch(`/api/ds/databases/${databaseId}/forms/${id}`);
        await apiFetch(`/api/ds/databases/${databaseId}/forms`, {
          method: 'POST',
          body: JSON.stringify({ name: copyName, definition: full?.definition ?? {} }),
        });
        onRefresh?.();
      } else if (type === 'report') {
        const full = await apiFetch(`/api/ds/databases/${databaseId}/reports/${id}`);
        await apiFetch(`/api/ds/databases/${databaseId}/reports`, {
          method: 'POST',
          body: JSON.stringify({ name: copyName, definition: full?.definition ?? {} }),
        });
        onRefresh?.();
      }
      toast({ title: `"${copyName}" created` });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (collapsed) {
    return (
      <>
        <div className="flex-none border-r border-gray-300 bg-gray-50 flex flex-col items-center pt-2 h-full shadow-sm z-10 w-8">
          <button
            onClick={() => setCollapsed(false)}
            title="Show Navigation Pane"
            className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="w-56 flex-none border-r border-gray-300 bg-gray-50 flex flex-col h-full shadow-sm z-10">
        <div className="px-3 py-2 bg-white border-b border-gray-200 text-xs font-semibold text-gray-700 flex justify-between items-center shadow-sm">
          <span>All Database Objects</span>
          <button
            onClick={() => setCollapsed(true)}
            title="Hide Navigation Pane"
            className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ml-1"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>

        <ContextMenu>
        <ContextMenuTrigger asChild>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">

          {/* ── Tables ── */}
          <div>
            <SectionHeader label="Tables" open={tablesOpen} onToggle={() => setTablesOpen(v => !v)} />
            {tablesOpen && (
              <div className={groupContainerClass}>
                {tables.length === 0 && <div className="text-xs text-gray-400 italic px-4 py-1">No tables yet</div>}
                {sortedTables.map(t => (
                  <ContextMenu key={t.id}>
                    <ContextMenuTrigger asChild>
                      <div className="flex items-center rounded overflow-hidden">
                        {onSelectTable ? (
                          <button
                            onClick={() => onSelectTable(t.id)}
                            className={`flex-1 flex items-center px-2 py-1.5 rounded text-xs transition-colors ${isTableActive(t.id) ? 'bg-red-100 text-[#C42B1C] font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                          >
                            <Table2 className={`w-3.5 h-3.5 mr-1.5 flex-none ${isTableActive(t.id) ? 'text-[#C42B1C]' : 'text-[#C42B1C]/70'}`} />
                            <span className="truncate">{t.name}</span>
                          </button>
                        ) : (
                          <a
                            href={`/databases/${databaseId}/tables/${t.id}/data`}
                            onClick={(e) => { e.preventDefault(); guardedNavigate(setLocation, `/databases/${databaseId}/tables/${t.id}/data`); }}
                            className={`flex-1 flex items-center px-2 py-1.5 rounded text-xs transition-colors ${isTableActive(t.id) ? 'bg-red-100 text-[#C42B1C] font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                          >
                            <Table2 className={`w-3.5 h-3.5 mr-1.5 flex-none ${isTableActive(t.id) ? 'text-[#C42B1C]' : 'text-[#C42B1C]/70'}`} />
                            <span className="truncate">{t.name}</span>
                          </a>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    {true && (
                      <ContextMenuContent className="w-48 text-sm">
                        <ContextMenuLabel className="text-xs font-normal text-gray-500 px-2 py-1">{t.name}</ContextMenuLabel>
                        <ContextMenuSeparator />
                        {onSelectTable ? (
                          <ContextMenuItem onSelect={(e) => { e.preventDefault(); console.log('[DataSculptor] menu Open clicked', t.id); onSelectTable(t.id); }} className="cursor-pointer">
                            <Grid3X3 className="w-3.5 h-3.5 mr-2 text-gray-500" />
                            Open (Datasheet)
                          </ContextMenuItem>
                        ) : (
                          <ContextMenuItem asChild>
                            <Link href={`/databases/${databaseId}/tables/${t.id}/data`} className="flex items-center cursor-pointer">
                              <Grid3X3 className="w-3.5 h-3.5 mr-2 text-gray-500" />
                              Open (Datasheet)
                            </Link>
                          </ContextMenuItem>
                        )}
                        {onSelectTableDesign ? (
                          <ContextMenuItem onSelect={(e) => { e.preventDefault(); console.log('[DataSculptor] menu Design View clicked', t.id); onSelectTableDesign(t.id); }} className="cursor-pointer">
                            <DesignViewIcon size={14} className="mr-2 flex-shrink-0" />
                            Design View
                          </ContextMenuItem>
                        ) : (
                          <ContextMenuItem asChild>
                            <Link href={`/databases/${databaseId}/tables/${t.id}/design`} className="flex items-center cursor-pointer">
                              <DesignViewIcon size={14} className="mr-2 flex-shrink-0" />
                              Design View
                            </Link>
                          </ContextMenuItem>
                        )}
                        <ContextMenuSeparator />
                        <ContextMenuItem onSelect={(e) => { e.preventDefault(); openRename('table', t.id, t.name); }}>
                          <Pencil className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          Rename…
                        </ContextMenuItem>
                        <ContextMenuItem onSelect={(e) => { e.preventDefault(); console.log('[DataSculptor] menu Copy clicked', t.id); doCopy('table', t.id, t.name); }}>
                          <Copy className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          Copy
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onSelect={(e) => { e.preventDefault(); console.log('[DataSculptor] menu Delete clicked', t.id); onDeleteTable?.(t.id); }}
                          className="text-red-600 focus:text-red-700 focus:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    )}
                  </ContextMenu>
                ))}
              </div>
            )}
          </div>

          {/* ── Queries ── */}
          {queries.length > 0 && <div>
            <SectionHeader label="Queries" open={queriesOpen} onToggle={() => setQueriesOpen(v => !v)} />
            {queriesOpen && (
              <div className={groupContainerClass}>
                {queries.length === 0 && <div className="text-xs text-gray-400 italic px-4 py-1">No queries yet</div>}
                {sortedQueries.map(q => (
                  <ContextMenu key={q.id}>
                    <ContextMenuTrigger asChild>
                      <div className="flex items-center rounded overflow-hidden">
                        {onSelectQuery ? (
                          <button
                            onClick={() => onSelectQuery(q.id)}
                            className={`flex-1 flex items-center px-2 py-1.5 rounded text-xs transition-colors ${isQueryActive(q.id) ? 'bg-red-100 text-[#C42B1C] font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                          >
                            <List className={`w-3.5 h-3.5 mr-1.5 flex-none ${isQueryActive(q.id) ? 'text-[#C42B1C]' : 'text-amber-500'}`} />
                            <span className="truncate">{q.name}</span>
                          </button>
                        ) : (
                          <a
                            href={`/databases/${databaseId}/queries/${q.id}`}
                            onClick={(e) => { e.preventDefault(); guardedNavigate(setLocation, `/databases/${databaseId}/queries/${q.id}`); }}
                            className={`flex-1 flex items-center px-2 py-1.5 rounded text-xs transition-colors ${isQueryActive(q.id) ? 'bg-red-100 text-[#C42B1C] font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                          >
                            <List className={`w-3.5 h-3.5 mr-1.5 flex-none ${isQueryActive(q.id) ? 'text-[#C42B1C]' : 'text-amber-500'}`} />
                            <span className="truncate">{q.name}</span>
                          </a>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    {true && (
                      <ContextMenuContent className="w-48 text-sm">
                        <ContextMenuLabel className="text-xs font-normal text-gray-500 px-2 py-1">{q.name}</ContextMenuLabel>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => onSelectQuery ? onSelectQuery(q.id) : setLocation(`/databases/${databaseId}/queries/${q.id}`)}>
                          <List className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          Open
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => openRename('query', q.id, q.name)}>
                          <Pencil className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          Rename…
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => doCopy('query', q.id, q.name)}>
                          <Copy className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          Copy
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => onDeleteQuery?.(q.id)}
                          className="text-red-600 focus:text-red-700 focus:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    )}
                  </ContextMenu>
                ))}
              </div>
            )}
          </div>}

          {/* ── Forms ── */}
          {forms.length > 0 && <div>
            <SectionHeader label="Forms" open={formsOpen} onToggle={() => setFormsOpen(v => !v)} />
            {formsOpen && (
              <div className={groupContainerClass}>
                {forms.length === 0 && <div className="text-xs text-gray-400 italic px-4 py-1">No forms yet</div>}
                {sortedForms.map(f => (
                  <ContextMenu key={f.id}>
                    <ContextMenuTrigger asChild>
                      <div className="flex items-center rounded overflow-hidden">
                        {onSelectForm ? (
                          <button
                            onClick={() => onSelectForm(f.id)}
                            className={`flex-1 flex items-center px-2 py-1.5 rounded text-xs transition-colors ${isFormActive(f.id) ? 'bg-green-100 text-[#2e7d32] font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                          >
                            <LayoutTemplate className={`w-3.5 h-3.5 mr-1.5 flex-none ${isFormActive(f.id) ? 'text-[#2e7d32]' : 'text-[#2e7d32]/70'}`} />
                            <span className="truncate">{f.name}</span>
                          </button>
                        ) : (
                          <a
                            href={`/databases/${databaseId}/forms/${f.id}`}
                            onClick={(e) => { e.preventDefault(); guardedNavigate(setLocation, `/databases/${databaseId}/forms/${f.id}`); }}
                            className={`flex-1 flex items-center px-2 py-1.5 rounded text-xs transition-colors ${isFormActive(f.id) ? 'bg-green-100 text-[#2e7d32] font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                          >
                            <LayoutTemplate className={`w-3.5 h-3.5 mr-1.5 flex-none ${isFormActive(f.id) ? 'text-[#2e7d32]' : 'text-[#2e7d32]/70'}`} />
                            <span className="truncate">{f.name}</span>
                          </a>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    {true && (
                      <ContextMenuContent className="w-48 text-sm">
                        <ContextMenuLabel className="text-xs font-normal text-gray-500 px-2 py-1">{f.name}</ContextMenuLabel>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => onSelectForm ? onSelectForm(f.id) : setLocation(`/databases/${databaseId}/forms/${f.id}`)}>
                          <LayoutTemplate className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          Open
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => openRename('form', f.id, f.name)}>
                          <Pencil className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          Rename…
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => doCopy('form', f.id, f.name)}>
                          <Copy className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          Copy
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => onDeleteForm?.(f.id)}
                          className="text-red-600 focus:text-red-700 focus:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    )}
                  </ContextMenu>
                ))}
              </div>
            )}
          </div>}

          {/* ── Reports ── */}
          {reports.length > 0 && <div>
            <SectionHeader label="Reports" open={reportsOpen} onToggle={() => setReportsOpen(v => !v)} />
            {reportsOpen && (
              <div className={groupContainerClass}>
                {reports.length === 0 && <div className="text-xs text-gray-400 italic px-4 py-1">No reports yet</div>}
                {sortedReports.map(r => (
                  <ContextMenu key={r.id}>
                    <ContextMenuTrigger asChild>
                      <div className="flex items-center rounded overflow-hidden">
                        {onSelectReport ? (
                          <button
                            onClick={() => onSelectReport(r.id)}
                            className={`flex-1 flex items-center px-2 py-1.5 rounded text-xs transition-colors ${isReportActive(r.id) ? 'bg-amber-50 text-[#5d4037] font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                          >
                            <FileText className={`w-3.5 h-3.5 mr-1.5 flex-none ${isReportActive(r.id) ? 'text-[#5d4037]' : 'text-[#5d4037]/70'}`} />
                            <span className="truncate">{r.name}</span>
                          </button>
                        ) : (
                          <a
                            href={`/databases/${databaseId}/reports/${r.id}`}
                            onClick={(e) => { e.preventDefault(); guardedNavigate(setLocation, `/databases/${databaseId}/reports/${r.id}`); }}
                            className={`flex-1 flex items-center px-2 py-1.5 rounded text-xs transition-colors ${isReportActive(r.id) ? 'bg-amber-50 text-[#5d4037] font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                          >
                            <FileText className={`w-3.5 h-3.5 mr-1.5 flex-none ${isReportActive(r.id) ? 'text-[#5d4037]' : 'text-[#5d4037]/70'}`} />
                            <span className="truncate">{r.name}</span>
                          </a>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    {true && (
                      <ContextMenuContent className="w-48 text-sm">
                        <ContextMenuLabel className="text-xs font-normal text-gray-500 px-2 py-1">{r.name}</ContextMenuLabel>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => onSelectReport ? onSelectReport(r.id) : setLocation(`/databases/${databaseId}/reports/${r.id}`)}>
                          <FileText className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          Open
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => openRename('report', r.id, r.name)}>
                          <Pencil className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          Rename…
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => doCopy('report', r.id, r.name)}>
                          <Copy className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          Copy
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => onDeleteReport?.(r.id)}
                          className="text-red-600 focus:text-red-700 focus:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    )}
                  </ContextMenu>
                ))}
              </div>
            )}
          </div>}

        </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56 text-sm">
          <ContextMenuSub>
            <ContextMenuSubTrigger className="text-xs">Category</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-56">
              <ContextMenuRadioGroup value={category} onValueChange={(v) => setCategory(v as CategoryOpt)}>
                <ContextMenuRadioItem value="relatedViews" className="text-xs">Tables and Related Views</ContextMenuRadioItem>
                <ContextMenuRadioItem value="objectType" className="text-xs">Object Type</ContextMenuRadioItem>
                <ContextMenuRadioItem value="created" className="text-xs">Created Date</ContextMenuRadioItem>
                <ContextMenuRadioItem value="modified" className="text-xs">Modified Date</ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSub>
            <ContextMenuSubTrigger className="text-xs">Sort By</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-56">
              <ContextMenuItem className="text-xs" onSelect={() => setSortDir('asc')}>Sort Ascending</ContextMenuItem>
              <ContextMenuItem className="text-xs" onSelect={() => setSortDir('desc')}>Sort Descending</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortByOpt)}>
                <ContextMenuRadioItem value="name" className="text-xs">Name</ContextMenuRadioItem>
                <ContextMenuRadioItem value="type" className="text-xs">Type</ContextMenuRadioItem>
                <ContextMenuRadioItem value="created" className="text-xs">Created Date</ContextMenuRadioItem>
                <ContextMenuRadioItem value="modified" className="text-xs">Modified Date</ContextMenuRadioItem>
              </ContextMenuRadioGroup>
              <ContextMenuSeparator />
              <ContextMenuItem className="text-xs" onSelect={() => setSortDir('none')}>Remove Automatic Sort</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSub>
            <ContextMenuSubTrigger className="text-xs">View By</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-40">
              <ContextMenuRadioGroup value={viewBy} onValueChange={(v) => setViewBy(v as ViewByOpt)}>
                <ContextMenuRadioItem value="details" className="text-xs">Details</ContextMenuRadioItem>
                <ContextMenuRadioItem value="icons" className="text-xs">Icons</ContextMenuRadioItem>
                <ContextMenuRadioItem value="list" className="text-xs">List</ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
        </ContextMenu>
      </div>

      {/* ── Rename Dialog ── */}
      <Dialog open={!!renameDialog} onOpenChange={v => !v && setRenameDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename {renameDialog ? renameDialog.type.charAt(0).toUpperCase() + renameDialog.type.slice(1) : ''}</DialogTitle>
            <DialogDescription>Enter a new name for "{renameDialog?.currentName}".</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs font-medium text-gray-600 mb-1 block">New name</Label>
            <Input
              value={renameName}
              onChange={e => setRenameName(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') setRenameDialog(null); }}
              className="h-8"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setRenameDialog(null)} disabled={busy}>Cancel</Button>
            <Button onClick={doRename} disabled={busy || !renameName.trim()} className="bg-[#C42B1C] hover:bg-[#9B2118]">
              {busy ? 'Saving…' : 'Rename'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
