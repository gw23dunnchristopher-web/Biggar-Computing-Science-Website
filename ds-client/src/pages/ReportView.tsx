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
import { AccessDesignCanvas } from '@/components/ui/access-design-canvas';
import type { DesignFieldDef, DesignImageDef, DesignLabelDef } from '@/components/ui/access-design-canvas';
import {
  FileText, Printer, Save, Eye,
  Type, TextCursorInput, ImageIcon,
} from 'lucide-react';
import type { Database, Table } from '@/api';
import type { QueryRow } from '@/components/layout/Sidebar';


async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
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
  designImages?: DesignImageDef[];
  designLabels?: DesignLabelDef[];
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

export function ReportView({
  databaseId, reportId, db, tables, queries = [], forms = [], reports = [],
  onDeleteTable, onDeleteQuery, onDeleteForm, onDeleteReport, onRefresh,
  isStudentMode, onCreateTable, onCreateQuery, onQueryWizard, onCreateSqlQuery,
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
  const [isDesignSaving, setIsDesignSaving] = useState(false);

  const loadReport = useCallback(async () => {
    const r = await apiFetch(`/api/ds/databases/${databaseId}/reports/${reportId}`);
    setReportMeta(r);
    const def: ReportDefinition = r.definition as ReportDefinition;
    setDefinition(def);
  }, [databaseId, reportId]);

  const loadRecords = useCallback(async (def: ReportDefinition) => {
    const recs = await apiFetch(`/api/ds/databases/${databaseId}/tables/${def.tableId}/records`);
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

  const handleSaveDesign = async (
    newFields: DesignFieldDef[],
    newImages: DesignImageDef[],
    newFreeLabels: DesignLabelDef[]
  ) => {
    if (!definition || !reportMeta) return;
    setIsDesignSaving(true);
    const newDef: ReportDefinition = {
      ...definition,
      fields: newFields.map((f, i) => ({ ...f, sortOrder: i })) as ReportFieldDef[],
      designImages: newImages,
      designLabels: newFreeLabels,
    };
    try {
      await apiFetch(`/api/ds/databases/${databaseId}/reports/${reportId}`, {
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

  const contextSection: RibbonContextSection = {
    color: '#5d4037',
    defaultTab: view === 'report' ? 'Report View' : 'Report Design',
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
        name: 'Report Design',
        content: (
          <>
            <RibbonGroup name="Controls">
              <RibbonButton icon={<Type size={18} />} label="Label" onClick={() => {}} />
              <RibbonButton icon={<TextCursorInput size={18} />} label="Text Box" onClick={() => {}} />
              <RibbonButton icon={<ImageIcon size={18} />} label="Image" onClick={() => {}} />
            </RibbonGroup>
          </>
        )
      }
    ]
  };

  const ribbon = (
    <Ribbon
      title={reportMeta?.name || 'Report'}
      allDatabasesLink="/"
      pinnedContent={
        <RibbonGroup name="Views">
          <RibbonDropdownButton
            icon={view === 'report' ? <FileText size={40} /> : <DesignViewIcon size={40} />}
            label="View"
          >
            <RibbonButton icon={<FileText size={16} />} label="Report View" active={view === 'report'} onClick={() => setView('report')} />
            <RibbonButton icon={<Printer size={16} />} label="Print Preview" active={false} onClick={handlePrint} />
            <RibbonButton icon={<Eye size={16} />} label="Layout View" active={false} onClick={() => setView('report')} />
            <RibbonButton icon={<DesignViewIcon size={16} />} label="Design View" active={view === 'design'} onClick={() => setView('design')} />
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
        <div className="flex-1 overflow-hidden">
          <AccessDesignCanvas
            mode="report"
            objectName={reportMeta?.name || 'Report'}
            fields={definition.fields as DesignFieldDef[]}
            images={definition.designImages}
            freeLabels={definition.designLabels}
            accentColor="#5d4037"
            onSave={handleSaveDesign}
            isSaving={isDesignSaving}
          />
        </div>
      )}
    </Shell>
  );
}
