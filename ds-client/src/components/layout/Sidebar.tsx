import React, { useState } from 'react';
import { Table2, ChevronDown, ChevronRight, Trash2, List, LayoutTemplate, FileText, Copy, Pencil, Grid3X3, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { DesignViewIcon } from '@/components/ui/design-view-icon';
import { Link, useLocation } from 'wouter';
import { Table, useUpdateTable, useCreateTable, getListTablesQueryKey, getGetTableQueryKey } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
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
        const tbl = tables.find(t => t.id === id);
        if (!tbl) return;
        await updateTable.mutateAsync({
          databaseId, tableId: id,
          data: { name: renameName.trim(), fields: tbl.fields.map(f => ({ ...f })) },
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
          <span>All Access Objects</span>
          <button
            onClick={() => setCollapsed(true)}
            title="Hide Navigation Pane"
            className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ml-1"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">

          {/* ── Tables ── */}
          <div>
            <SectionHeader label="Tables" open={tablesOpen} onToggle={() => setTablesOpen(v => !v)} />
            {tablesOpen && (
              <div className="mt-0.5 space-y-0.5 ml-2">
                {tables.length === 0 && <div className="text-xs text-gray-400 italic px-4 py-1">No tables yet</div>}
                {tables.map(t => (
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
                          <Link
                            href={`/databases/${databaseId}/tables/${t.id}/data`}
                            className={`flex-1 flex items-center px-2 py-1.5 rounded text-xs transition-colors ${isTableActive(t.id) ? 'bg-red-100 text-[#C42B1C] font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                          >
                            <Table2 className={`w-3.5 h-3.5 mr-1.5 flex-none ${isTableActive(t.id) ? 'text-[#C42B1C]' : 'text-[#C42B1C]/70'}`} />
                            <span className="truncate">{t.name}</span>
                          </Link>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    {true && (
                      <ContextMenuContent className="w-48 text-sm">
                        <ContextMenuLabel className="text-xs font-normal text-gray-500 px-2 py-1">{t.name}</ContextMenuLabel>
                        <ContextMenuSeparator />
                        <ContextMenuItem asChild>
                          <Link href={`/databases/${databaseId}/tables/${t.id}/data`} className="flex items-center cursor-pointer">
                            <Grid3X3 className="w-3.5 h-3.5 mr-2 text-gray-500" />
                            Open (Datasheet)
                          </Link>
                        </ContextMenuItem>
                        {onSelectTableDesign ? (
                          <ContextMenuItem onClick={() => onSelectTableDesign(t.id)} className="cursor-pointer">
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
                        <ContextMenuItem onClick={() => openRename('table', t.id, t.name)}>
                          <Pencil className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          Rename…
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => doCopy('table', t.id, t.name)}>
                          <Copy className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          Copy
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => onDeleteTable?.(t.id)}
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
              <div className="mt-0.5 space-y-0.5 ml-2">
                {queries.length === 0 && <div className="text-xs text-gray-400 italic px-4 py-1">No queries yet</div>}
                {queries.map(q => (
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
                          <Link
                            href={`/databases/${databaseId}/queries/${q.id}`}
                            className={`flex-1 flex items-center px-2 py-1.5 rounded text-xs transition-colors ${isQueryActive(q.id) ? 'bg-red-100 text-[#C42B1C] font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                          >
                            <List className={`w-3.5 h-3.5 mr-1.5 flex-none ${isQueryActive(q.id) ? 'text-[#C42B1C]' : 'text-amber-500'}`} />
                            <span className="truncate">{q.name}</span>
                          </Link>
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
              <div className="mt-0.5 space-y-0.5 ml-2">
                {forms.length === 0 && <div className="text-xs text-gray-400 italic px-4 py-1">No forms yet</div>}
                {forms.map(f => (
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
                          <Link
                            href={`/databases/${databaseId}/forms/${f.id}`}
                            className={`flex-1 flex items-center px-2 py-1.5 rounded text-xs transition-colors ${isFormActive(f.id) ? 'bg-green-100 text-[#2e7d32] font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                          >
                            <LayoutTemplate className={`w-3.5 h-3.5 mr-1.5 flex-none ${isFormActive(f.id) ? 'text-[#2e7d32]' : 'text-[#2e7d32]/70'}`} />
                            <span className="truncate">{f.name}</span>
                          </Link>
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
              <div className="mt-0.5 space-y-0.5 ml-2">
                {reports.length === 0 && <div className="text-xs text-gray-400 italic px-4 py-1">No reports yet</div>}
                {reports.map(r => (
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
                          <Link
                            href={`/databases/${databaseId}/reports/${r.id}`}
                            className={`flex-1 flex items-center px-2 py-1.5 rounded text-xs transition-colors ${isReportActive(r.id) ? 'bg-amber-50 text-[#5d4037] font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                          >
                            <FileText className={`w-3.5 h-3.5 mr-1.5 flex-none ${isReportActive(r.id) ? 'text-[#5d4037]' : 'text-[#5d4037]/70'}`} />
                            <span className="truncate">{r.name}</span>
                          </Link>
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
