/**
 * ReportView — read-only formatted report with print support (Access style).
 * Shows all records from a table in a structured tabular layout.
 * Design View lets anyone control which fields appear, labels, grouping, sorting, and add images.
 * Attachment fields that hold image URLs are displayed as thumbnail images.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearch } from 'wouter';
import { Shell } from '@/components/layout/Shell';
import { Sidebar } from '@/components/layout/Sidebar';
import { Ribbon, RibbonGroup, RibbonButton, RibbonDropdownButton, RibbonContextSection } from '@/components/layout/Ribbon';
import { CreateTabContent, ExternalDataTabContent, DatabaseToolsTabContent } from '@/components/layout/AccessRibbonTabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DesignViewIcon } from '@/components/ui/design-view-icon';
import {
  FileText, Printer, Save,
  Eye, EyeOff, ArrowUp, ArrowDown, GripVertical,
  ChevronsUpDown, ChevronUp, ChevronDown
} from 'lucide-react';
import type { Database, Table } from '@/api';
import type { QueryRow } from '@/components/layout/Sidebar';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers as any) }
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

interface ReportFieldDef {
  fieldName: string;
  label: string;
  visible: boolean;
  sortOrder: number;
  fieldType?: string;
  colWidth?: number;
}

/** True if a value looks like an image URL or data-URI */
function isImageUrl(val: unknown): boolean {
  if (typeof val !== 'string' || !val) return false;
  return /^https?:\/\/.+\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i.test(val)
    || val.startsWith('data:image/');
}

interface ReportDefinition {
  tableId: number;
  tableName: string;
  title?: string;
  layout?: 'tabular' | 'columnar' | 'justified' | 'outline';
  orientation?: string;
  fields: ReportFieldDef[];
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  groupField?: string;
  groupFields?: string[];
  headerImageUrl?: string;
}

interface Props {
  databaseId: number;
  reportId: number;
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
  onShare?: () => void;
  onSettings?: () => void;
}

export function ReportView({
  databaseId, reportId, db, tables, queries = [], forms = [], reports = [],
  onDeleteTable, onDeleteQuery, onDeleteForm, onDeleteReport, onRefresh,
  isStudentMode, onCreateTable, onCreateQuery, onQueryWizard,
  onCreateForm, onCreateBlankForm, onCreateAutoForm,
  onCreateReport, onCreateBlankReport, onCreateAutoReport,
  onShare, onSettings
}: Props) {
  const { toast } = useToast();
  const search = useSearch();
  const printRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<'report' | 'design'>(
    new URLSearchParams(search).get('design') === '1' ? 'design' : 'report'
  );
  const [reportMeta, setReportMeta] = useState<{ id: number; name: string; definition: any } | null>(null);
  const [definition, setDefinition] = useState<ReportDefinition | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [designFields, setDesignFields] = useState<ReportFieldDef[]>([]);
  const [designSortField, setDesignSortField] = useState('');
  const [designSortDir, setDesignSortDir] = useState<'asc' | 'desc'>('asc');
  const [designGroupField, setDesignGroupField] = useState('');
  const [designTitle, setDesignTitle] = useState('');
  const [designHeaderImage, setDesignHeaderImage] = useState('');
  const [isDesignSaving, setIsDesignSaving] = useState(false);

  const loadReport = useCallback(async () => {
    const r = await apiFetch(`/api/databases/${databaseId}/reports/${reportId}`);
    setReportMeta(r);
    const def: ReportDefinition = r.definition as ReportDefinition;
    setDefinition(def);
    setDesignFields(def?.fields ? [...def.fields].sort((a, b) => a.sortOrder - b.sortOrder) : []);
    setDesignSortField(def?.sortField || '');
    setDesignSortDir(def?.sortDir || 'asc');
    setDesignGroupField(def?.groupField || '');
    setDesignTitle(def?.title || r.name);
    setDesignHeaderImage(def?.headerImageUrl || '');
  }, [databaseId, reportId]);

  const loadRecords = useCallback(async (def: ReportDefinition) => {
    const recs = await apiFetch(`/api/databases/${databaseId}/tables/${def.tableId}/records`);
    setRecords(recs || []);
  }, [databaseId]);

  useEffect(() => {
    loadReport().catch(() => toast({ title: 'Failed to load report', variant: 'destructive' }));
  }, [loadReport]);

  useEffect(() => {
    if (definition?.tableId) {
      loadRecords(definition).catch(() => {});
    }
  }, [definition, loadRecords]);

  const handlePrint = () => {
    window.print();
  };

  const handleToggleField = (idx: number) => {
    setDesignFields(prev => prev.map((f, i) => i === idx ? { ...f, visible: !f.visible } : f));
  };
  const handleLabelChange = (idx: number, label: string) => {
    setDesignFields(prev => prev.map((f, i) => i === idx ? { ...f, label } : f));
  };
  const handleColWidthChange = (idx: number, colWidth: number | undefined) => {
    setDesignFields(prev => prev.map((f, i) => i === idx ? { ...f, colWidth } : f));
  };
  const handleMoveField = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= designFields.length) return;
    setDesignFields(prev => {
      const a = [...prev];
      [a[idx], a[newIdx]] = [a[newIdx], a[idx]];
      return a.map((f, i) => ({ ...f, sortOrder: i }));
    });
  };

  const handleSaveDesign = async () => {
    if (!definition || !reportMeta) return;
    setIsDesignSaving(true);
    const newDef: ReportDefinition = {
      ...definition,
      title: designTitle,
      fields: designFields.map((f, i) => ({ ...f, sortOrder: i })),
      sortField: designSortField || undefined,
      sortDir: designSortDir,
      groupField: designGroupField || undefined,
      headerImageUrl: designHeaderImage || undefined,
    };
    try {
      await apiFetch(`/api/databases/${databaseId}/reports/${reportId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: reportMeta.name, definition: newDef })
      });
      setDefinition(newDef);
      toast({ title: 'Report design saved' });
    } catch {
      toast({ title: 'Failed to save design', variant: 'destructive' });
    } finally {
      setIsDesignSaving(false);
    }
  };

  // Sort and group records
  const processedRecords = (() => {
    if (!definition) return [];
    let recs = [...records];
    if (definition.sortField) {
      recs.sort((a, b) => {
        const av = a.data?.[definition.sortField!] ?? '';
        const bv = b.data?.[definition.sortField!] ?? '';
        const n1 = Number(av), n2 = Number(bv);
        let cmp = (!isNaN(n1) && !isNaN(n2)) ? n1 - n2 : String(av).localeCompare(String(bv));
        return definition.sortDir === 'desc' ? -cmp : cmp;
      });
    }
    return recs;
  })();

  const visibleFields = definition?.fields.filter(f => f.visible).sort((a, b) => a.sortOrder - b.sortOrder) || [];
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  // Group records if groupField is set
  const grouped: { key: string; rows: any[] }[] = (() => {
    if (!definition?.groupField) return [{ key: '', rows: processedRecords }];
    const map = new Map<string, any[]>();
    for (const r of processedRecords) {
      const k = String(r.data?.[definition.groupField] ?? '(blank)');
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return Array.from(map.entries()).map(([key, rows]) => ({ key, rows }));
  })();

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
    onShare,
    onSettings,
  };

  const contextSection: RibbonContextSection = {
    color: '#5d4037',
    defaultTab: view === 'report' ? 'Report View' : 'Design View',
    tabs: [
      {
        name: 'Report View',
        content: (
          <RibbonGroup name="Print">
            <RibbonButton icon={<Printer size={22} />} label="Print" onClick={handlePrint} />
          </RibbonGroup>
        )
      },
      {
        name: 'Design View',
        content: (
          <RibbonGroup name="Design">
            <RibbonButton icon={<Save size={22} />} label="Save Design" onClick={handleSaveDesign} disabled={isDesignSaving} />
            <RibbonButton icon={<Printer size={22} />} label="Print Preview" onClick={() => setView('report')} />
          </RibbonGroup>
        )
      }
    ]
  };

  const ribbon = (
    <Ribbon
      title={reportMeta?.name || 'Report'}
      allDatabasesLink="/"
      pinnedContent={
        <RibbonGroup name="View">
          <RibbonDropdownButton
            icon={view === 'report' ? <FileText size={22} /> : <DesignViewIcon size={22} />}
            label={view === 'report' ? 'Report' : 'Design'}
          >
            <RibbonButton icon={<FileText size={22} />} label="Report" active={view === 'report'} onClick={() => setView('report')} />
            <RibbonButton icon={<DesignViewIcon size={22} />} label="Design" active={view === 'design'} onClick={() => setView('design')} />
          </RibbonDropdownButton>
        </RibbonGroup>
      }
      tabs={[
        { name: 'Home', content: <RibbonGroup name="Print"><RibbonButton icon={<Printer size={22} />} label="Print" onClick={handlePrint} /></RibbonGroup> },
        { name: 'Create', content: <CreateTabContent {...commonTabProps} /> },
        { name: 'External Data', content: <ExternalDataTabContent {...commonTabProps} onShare={onShare} /> },
        { name: 'Database Tools', content: <DatabaseToolsTabContent {...commonTabProps} onSettings={onSettings} /> }
      ]}
      contextSection={contextSection}
    />
  );

  const sidebar = (
    <Sidebar
      tables={tables}
      databaseId={databaseId}
      isStudentMode={isStudentMode}
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

  if (!definition) {
    return <Shell title={reportMeta?.name || 'Report'} ribbon={ribbon} sidebar={sidebar}><div className="p-8 text-gray-500">Loading report...</div></Shell>;
  }

  return (
    <Shell title={reportMeta?.name || 'Report'} ribbon={ribbon} sidebar={sidebar}>
      {view === 'report' ? (
        <div className="flex flex-col h-full bg-[#f3f2f1]">
          {/* Report toolbar */}
          <div className="bg-[#5d4037] text-white px-4 py-2 flex items-center gap-2 flex-none print:hidden">
            <FileText size={16} />
            <span className="font-semibold text-sm">{definition.title || reportMeta?.name}</span>
            <span className="ml-auto text-xs text-white/60">{processedRecords.length} record{processedRecords.length !== 1 ? 's' : ''}</span>
            <Button onClick={handlePrint} size="sm" variant="ghost" className="text-white hover:bg-white/20 h-7 text-xs">
              <Printer size={13} className="mr-1" /> Print
            </Button>
          </div>

          {/* Report body (printable) */}
          <div className="flex-1 overflow-y-auto p-6" ref={printRef}>
            <div className="bg-white shadow-md rounded max-w-5xl mx-auto border border-gray-200 print:shadow-none print:rounded-none print:border-0">
              {/* Report header */}
              <div className="px-8 pt-6 pb-4 border-b border-gray-200">
                <div className="flex items-end justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    {definition.headerImageUrl && (
                      <img
                        src={definition.headerImageUrl} alt="Report header"
                        className="h-16 w-auto object-contain flex-none rounded"
                      />
                    )}
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800">{definition.title || reportMeta?.name}</h1>
                      <p className="text-sm text-gray-500 mt-0.5">{definition.tableName}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400 flex-none">
                    <div>{today}</div>
                    <div>{processedRecords.length} record{processedRecords.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              </div>

              {/* Data body — layout-aware */}
              {visibleFields.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No fields visible. Open Design View to configure fields.</div>
              ) : (
                <div className="px-8 py-4">
                  {grouped.map((group, gi) => {
                    const layout = definition.layout || 'tabular';
                    return (
                      <div key={gi} className={gi > 0 ? 'mt-8' : ''}>
                        {/* Group heading */}
                        {definition.groupField && group.key && (
                          <div className="mb-3 pb-1 border-b-2 border-[#5d4037]">
                            <span className="font-semibold text-sm text-[#5d4037]">{definition.groupField}: {group.key}</span>
                            <span className="ml-2 text-xs text-gray-400">({group.rows.length} record{group.rows.length !== 1 ? 's' : ''})</span>
                          </div>
                        )}

                        {/* ── Tabular: headers + striped rows ── */}
                        {(layout === 'tabular') && (
                          <table className="text-sm border-collapse" style={{ width: '100%', tableLayout: visibleFields.some(f => f.colWidth) ? 'fixed' : 'auto' }}>
                            {(gi === 0 || !!definition.groupField) && (
                              <thead>
                                <tr className="border-b-2 border-gray-800">
                                  {visibleFields.map(fd => (
                                    <th key={fd.fieldName} className="text-left pb-2 pr-4 font-semibold text-gray-700 text-xs uppercase tracking-wide"
                                      style={fd.colWidth ? { width: fd.colWidth } : undefined}>
                                      {fd.label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                            )}
                            <tbody>
                              {group.rows.length === 0 ? (
                                <tr><td colSpan={visibleFields.length} className="py-4 text-center text-gray-400 italic text-sm">No records</td></tr>
                              ) : group.rows.map((rec, ri) => (
                                <tr key={rec.id} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  {visibleFields.map(fd => {
                                    const v = rec.data?.[fd.fieldName];
                                    return (
                                      <td key={fd.fieldName} className="py-1.5 pr-4 text-gray-700 align-top border-b border-gray-100 overflow-hidden"
                                        style={fd.colWidth ? { width: fd.colWidth, maxWidth: fd.colWidth } : undefined}>
                                        {fd.fieldType === 'boolean' ? (
                                          <span className={`inline-block w-3 h-3 rounded-sm border ${v ? 'bg-[#5d4037] border-[#5d4037]' : 'border-gray-400'}`} />
                                        ) : fd.fieldType === 'attachment' && isImageUrl(v) ? (
                                          <img src={String(v)} alt={fd.label} className="h-12 w-auto max-w-[120px] object-contain rounded border border-gray-200" />
                                        ) : String(v ?? '')}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        {/* ── Columnar: one card per record ── */}
                        {layout === 'columnar' && (
                          <div className="space-y-4">
                            {group.rows.length === 0 && (
                              <div className="py-4 text-center text-gray-400 italic text-sm">No records</div>
                            )}
                            {group.rows.map((rec, ri) => (
                              <div key={rec.id} className={`border border-gray-200 rounded p-4 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Record {ri + 1}</div>
                                <div className="space-y-1.5">
                                  {visibleFields.map(fd => {
                                    const v = rec.data?.[fd.fieldName];
                                    return (
                                      <div key={fd.fieldName} className="flex gap-3 items-start">
                                        <span className="text-xs font-semibold text-[#5d4037] w-36 flex-none text-right pt-0.5">{fd.label}:</span>
                                        <span className="text-sm text-gray-800">
                                          {fd.fieldType === 'boolean' ? (
                                            <span className={`inline-block w-3 h-3 rounded-sm border ${v ? 'bg-[#5d4037] border-[#5d4037]' : 'border-gray-400'}`} />
                                          ) : fd.fieldType === 'attachment' && isImageUrl(v) ? (
                                            <img src={String(v)} alt={fd.label} className="h-16 w-auto max-w-[160px] object-contain rounded border border-gray-200" />
                                          ) : String(v ?? '')}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ── Justified: fully-bordered grid ── */}
                        {layout === 'justified' && (
                          <table className="w-full text-sm border-collapse border border-gray-300">
                            {(gi === 0 || !!definition.groupField) && (
                              <thead>
                                <tr className="bg-[#efebe9]">
                                  {visibleFields.map(fd => (
                                    <th key={fd.fieldName} className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-[#5d4037] whitespace-nowrap">
                                      {fd.label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                            )}
                            <tbody>
                              {group.rows.length === 0 ? (
                                <tr><td colSpan={visibleFields.length} className="border border-gray-300 py-4 text-center text-gray-400 italic text-sm">No records</td></tr>
                              ) : group.rows.map((rec, ri) => (
                                <tr key={rec.id} className={ri % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'}>
                                  {visibleFields.map(fd => {
                                    const v = rec.data?.[fd.fieldName];
                                    return (
                                      <td key={fd.fieldName} className="border border-gray-300 px-3 py-2 text-gray-700 align-top">
                                        {fd.fieldType === 'boolean' ? (
                                          <span className={`inline-block w-3 h-3 rounded-sm border ${v ? 'bg-[#5d4037] border-[#5d4037]' : 'border-gray-400'}`} />
                                        ) : fd.fieldType === 'attachment' && isImageUrl(v) ? (
                                          <img src={String(v)} alt={fd.label} className="h-12 w-auto max-w-[120px] object-contain rounded border border-gray-200" />
                                        ) : String(v ?? '')}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        {/* ── Outline: numbered records, 2-column field list ── */}
                        {layout === 'outline' && (
                          <div className="space-y-3">
                            {group.rows.length === 0 && (
                              <div className="py-4 text-center text-gray-400 italic text-sm">No records</div>
                            )}
                            {group.rows.map((rec, ri) => (
                              <div key={rec.id} className={`flex gap-3 border-b border-gray-100 pb-3 ${ri % 2 === 0 ? '' : 'bg-gray-50/60 rounded px-2'}`}>
                                <div className="w-8 flex-none text-xs font-bold text-[#5d4037] pt-0.5 text-right">{ri + 1}.</div>
                                <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1">
                                  {visibleFields.map(fd => {
                                    const v = rec.data?.[fd.fieldName];
                                    return (
                                      <div key={fd.fieldName} className="flex gap-1.5 items-start min-w-0">
                                        <span className="text-[11px] font-semibold text-gray-500 flex-none w-28 truncate text-right">{fd.label}:</span>
                                        <span className="text-[11px] text-gray-800 min-w-0 truncate">
                                          {fd.fieldType === 'boolean' ? (
                                            <span className={`inline-block w-3 h-3 rounded-sm border ${v ? 'bg-[#5d4037] border-[#5d4037]' : 'border-gray-400'}`} />
                                          ) : fd.fieldType === 'attachment' && isImageUrl(v) ? (
                                            <img src={String(v)} alt={fd.label} className="h-8 w-auto max-w-[80px] object-contain rounded" />
                                          ) : String(v ?? '')}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Footer */}
                  <div className="mt-6 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-400">
                    <span>{definition.title || reportMeta?.name}</span>
                    <span>Total: {processedRecords.length} record{processedRecords.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Design View */
        <div className="flex flex-col h-full bg-[#f3f2f1]">
          <div className="bg-[#5d4037] text-white px-4 py-2 flex items-center gap-2 flex-none">
            <DesignViewIcon size={16} />
            <span className="font-semibold text-sm">{reportMeta?.name} — Design View</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex gap-6 justify-center">
            {/* Fields panel */}
            <div className="bg-white rounded shadow-md border border-gray-200 w-80 flex-none">
              <div className="bg-[#efebe9] border-b border-gray-200 px-4 py-2 text-sm font-medium text-[#5d4037] rounded-t flex items-center justify-between">
                <span>Fields</span>
                <span className="text-xs text-gray-500">{designFields.filter(f => f.visible).length} visible</span>
              </div>
              <div className="divide-y divide-gray-100">
                {designFields.map((fd, i) => (
                  <div key={fd.fieldName} className="px-3 py-1.5 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-1.5">
                      <GripVertical size={13} className="text-gray-300 flex-none" />
                      <button onClick={() => handleMoveField(i, -1)} disabled={i === 0} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 flex-none">
                        <ArrowUp size={12} />
                      </button>
                      <button onClick={() => handleMoveField(i, 1)} disabled={i === designFields.length - 1} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 flex-none">
                        <ArrowDown size={12} />
                      </button>
                      <span className="text-[10px] text-gray-400 w-16 flex-none font-mono truncate">{fd.fieldName}</span>
                      <input
                        type="text"
                        value={fd.label}
                        onChange={e => handleLabelChange(i, e.target.value)}
                        className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#5d4037] min-w-0"
                        title="Column heading"
                      />
                      <button onClick={() => handleToggleField(i)} className={`flex-none p-1 rounded ${fd.visible ? 'text-[#5d4037]' : 'text-gray-300'} hover:bg-gray-100`}>
                        {fd.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 pl-12">
                      <span className="text-[10px] text-gray-400">Col width:</span>
                      <input
                        type="number"
                        min={40} max={600} step={10}
                        value={fd.colWidth ?? ''}
                        onChange={e => handleColWidthChange(i, e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="auto"
                        className="w-16 border border-gray-200 rounded px-1 py-0.5 text-[10px] focus:outline-none focus:border-[#5d4037]"
                        title="Fixed column width in px (leave blank for auto)"
                      />
                      <span className="text-[10px] text-gray-400">px</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Options panel */}
            <div className="bg-white rounded shadow-md border border-gray-200 flex-1 max-w-xs">
              <div className="bg-[#efebe9] border-b border-gray-200 px-4 py-2 text-sm font-medium text-[#5d4037] rounded-t">
                Report Options
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Report Title</label>
                  <input
                    type="text"
                    value={designTitle}
                    onChange={e => setDesignTitle(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-[#5d4037]"
                    placeholder={reportMeta?.name}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Header Image URL</label>
                  <input
                    type="url"
                    value={designHeaderImage}
                    onChange={e => setDesignHeaderImage(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-[#5d4037]"
                    placeholder="https://…"
                  />
                  {designHeaderImage && isImageUrl(designHeaderImage) && (
                    <img src={designHeaderImage} alt="Preview" className="mt-1.5 h-10 w-auto object-contain rounded border border-gray-200" />
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Sort By</label>
                  <div className="flex gap-2">
                    <select
                      value={designSortField}
                      onChange={e => setDesignSortField(e.target.value)}
                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-[#5d4037] bg-white"
                    >
                      <option value="">(none)</option>
                      {designFields.map(f => <option key={f.fieldName} value={f.fieldName}>{f.label}</option>)}
                    </select>
                    <button
                      onClick={() => setDesignSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                      className="p-1.5 border border-gray-300 rounded hover:bg-gray-50"
                      title={designSortDir === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      {designSortDir === 'asc' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Group By</label>
                  <select
                    value={designGroupField}
                    onChange={e => setDesignGroupField(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-[#5d4037] bg-white"
                  >
                    <option value="">(none)</option>
                    {designFields.map(f => <option key={f.fieldName} value={f.fieldName}>{f.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="px-4 pb-4">
                <Button onClick={handleSaveDesign} disabled={isDesignSaving} className="bg-[#5d4037] hover:bg-[#4e342e] w-full">
                  <Save size={14} className="mr-2" /> Save Design
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
