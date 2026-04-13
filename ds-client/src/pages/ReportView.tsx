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
import type { DesignFieldDef, DesignImageDef, DesignLabelDef, DesignCanvasHandle } from '@/components/ui/access-design-canvas';
import {
  FileText, Printer, Save,
} from 'lucide-react';
import {
  DsRptReportViewIcon, DsRptPrintPreviewIcon, DsRptLayoutViewIcon,
  DsRptThemesIcon, DsRptColorsIcon, DsRptFontsIcon,
  DsRptGroupSortIcon, DsRptTotalsIcon, DsRptHideDetailsIcon,
  DsRptSelectIcon, DsRptLabelIcon, DsRptTextBoxIcon, DsRptButtonIcon,
  DsRptInsertImageIcon, DsRptAttachmentIcon, DsRptLinkIcon,
  DsRptLineIcon, DsRptRectangleIcon, DsRptCheckBoxIcon,
  DsRptOptionButtonIcon, DsRptToggleButtonIcon, DsRptComboBoxIcon,
  DsRptListBoxIcon, DsRptSubFormSubReportIcon, DsRptInsertModernChartIcon,
  DsRptInsertPageBreakIcon, DsRptOptionGroupIcon,
  DsRptBoundObjectFrameIcon, DsRptUnboundObjectFrameIcon,
  DsRptTabControlIcon, DsRptEdgeBrowserIcon,
  DsRptLogoIcon, DsRptTitleIcon, DsRptDateAndTimeIcon,
  DsRptAddExistingFieldsIcon, DsRptPropertySheetIcon, DsRptTabOrderIcon,
} from '@/components/ui/ds-icons';
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
  const canvasRef = useRef<DesignCanvasHandle>(null);

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
  const allFields = (definition?.fields || []) as (ReportFieldDef & DesignFieldDef)[];
  const hasDesignLayout = allFields.some(f => f.x !== undefined && f.y !== undefined);
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

  const noop = () => {};

  const tinyBtn = (icon: React.ReactNode, label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center justify-center w-[22px] h-[22px] rounded hover:bg-[#e8e6e3] active:bg-[#d6d3ce] cursor-pointer border border-transparent hover:border-gray-300"
    >
      {icon}
    </button>
  );

  const smallBtn = (icon: React.ReactNode, label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center gap-1 px-1.5 h-[22px] rounded hover:bg-[#e8e6e3] active:bg-[#d6d3ce] cursor-pointer text-[10px] text-gray-700 whitespace-nowrap border border-transparent hover:border-gray-300"
    >
      <span className="flex-none">{icon}</span>
      <span>{label}</span>
    </button>
  );

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
            <RibbonGroup name="Themes">
              <div className="flex items-start gap-0.5">
                <RibbonButton icon={<DsRptThemesIcon />} label="Themes" onClick={noop} />
                <div className="flex flex-col gap-0.5 pt-1">
                  {smallBtn(<DsRptColorsIcon size={14} />, 'Colors', noop)}
                  {smallBtn(<DsRptFontsIcon size={14} />, 'Fonts', noop)}
                </div>
              </div>
            </RibbonGroup>
            <RibbonGroup name="Grouping & Totals">
              <div className="flex items-start gap-0.5">
                <RibbonButton icon={<DsRptGroupSortIcon />} label="Group & Sort" onClick={noop} />
                <div className="flex flex-col gap-0.5 pt-1">
                  {smallBtn(<DsRptTotalsIcon size={14} />, 'Totals', noop)}
                  {smallBtn(<DsRptHideDetailsIcon size={14} />, 'Hide Details', noop)}
                </div>
              </div>
            </RibbonGroup>
            <RibbonGroup name="Controls">
              <div className="flex items-start gap-1">
                <div className="grid grid-cols-9 gap-[2px] pt-1">
                  {tinyBtn(<DsRptSelectIcon size={16} />, 'Select', noop)}
                  {tinyBtn(<DsRptTextBoxIcon size={16} />, 'Text Box', () => canvasRef.current?.addTextBox())}
                  {tinyBtn(<DsRptLabelIcon size={16} />, 'Label', () => canvasRef.current?.addLabel())}
                  {tinyBtn(<DsRptButtonIcon size={16} />, 'Button', noop)}
                  {tinyBtn(<DsRptComboBoxIcon size={16} />, 'Combo Box', noop)}
                  {tinyBtn(<DsRptCheckBoxIcon size={16} />, 'Check Box', () => canvasRef.current?.addCheckBox())}
                  {tinyBtn(<DsRptOptionButtonIcon size={16} />, 'Option Button', noop)}
                  {tinyBtn(<DsRptToggleButtonIcon size={16} />, 'Toggle Button', noop)}
                  {tinyBtn(<DsRptListBoxIcon size={16} />, 'List Box', noop)}
                  {tinyBtn(<DsRptTabControlIcon size={16} />, 'Tab Control', noop)}
                  {tinyBtn(<DsRptSubFormSubReportIcon size={16} />, 'Subreport', noop)}
                  {tinyBtn(<DsRptAttachmentIcon size={16} />, 'Attachment', noop)}
                  {tinyBtn(<DsRptLinkIcon size={16} />, 'Hyperlink', noop)}
                  {tinyBtn(<DsRptLineIcon size={16} />, 'Line', () => canvasRef.current?.addLine())}
                  {tinyBtn(<DsRptRectangleIcon size={16} />, 'Rectangle', () => canvasRef.current?.addRectangle())}
                  {tinyBtn(<DsRptOptionGroupIcon size={16} />, 'Option Group', noop)}
                  {tinyBtn(<DsRptBoundObjectFrameIcon size={16} />, 'Bound Frame', noop)}
                  {tinyBtn(<DsRptUnboundObjectFrameIcon size={16} />, 'Unbound Frame', noop)}
                  {tinyBtn(<DsRptEdgeBrowserIcon size={16} />, 'Web Browser', noop)}
                  {tinyBtn(<DsRptInsertPageBreakIcon size={16} />, 'Page Break', () => canvasRef.current?.addPageBreak())}
                </div>
                <div className="flex items-start gap-[2px] pl-1 border-l border-gray-200 pt-1">
                  {tinyBtn(<DsRptInsertImageIcon size={16} />, 'Insert Image', () => canvasRef.current?.addImage())}
                  {tinyBtn(<DsRptInsertModernChartIcon size={16} />, 'Insert Modern Chart', noop)}
                </div>
              </div>
            </RibbonGroup>
            <RibbonGroup name="Header / Footer">
              <div className="flex items-start gap-0.5">
                <RibbonButton icon={<DsRptLogoIcon />} label="Logo" onClick={noop} />
                <div className="flex flex-col gap-0.5 pt-1">
                  {smallBtn(<DsRptTitleIcon size={14} />, 'Title', noop)}
                  {smallBtn(<DsRptDateAndTimeIcon size={14} />, 'Date and Time', noop)}
                </div>
              </div>
            </RibbonGroup>
            <RibbonGroup name="Tools">
              <div className="flex items-start gap-0.5">
                <RibbonButton icon={<DsRptAddExistingFieldsIcon />} label="Add Existing Fields" onClick={noop} />
                <RibbonButton icon={<DsRptPropertySheetIcon />} label="Property Sheet" onClick={() => canvasRef.current?.togglePropertySheet()} />
                <div className="flex flex-col gap-0.5 pt-1">
                  {smallBtn(<DsRptTabOrderIcon size={14} />, 'Tab Order', noop)}
                  {smallBtn(<DsRptChartSettingsIcon size={14} />, 'Chart Settings', noop)}
                </div>
              </div>
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
            icon={view === 'report' ? <DsRptReportViewIcon size={40} /> : <DesignViewIcon size={40} />}
            label="View"
          >
            <RibbonButton icon={<DsRptReportViewIcon size={16} />} label="Report View" active={view === 'report'} onClick={() => setView('report')} />
            <RibbonButton icon={<DsRptPrintPreviewIcon size={16} />} label="Print Preview" active={false} onClick={handlePrint} />
            <RibbonButton icon={<DsRptLayoutViewIcon size={16} />} label="Layout View" active={false} onClick={() => setView('report')} />
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
              ) : hasDesignLayout ? (
                /* ── Design-aware layout: positions match Design View ── */
                <div className="px-4 py-4">
                  {(() => {
                    const designFields = allFields.filter(f => f.visible) as (ReportFieldDef & DesignFieldDef)[];
                    const headerFields = designFields.filter(f => f.section === 'reportHeader' || f.section === 'header');
                    const detailFields = designFields.filter(f => !f.section || f.section === 'detail');
                    const footerFields = designFields.filter(f => f.section === 'reportFooter' || f.section === 'footer');

                    const headerLabels = (definition.designLabels || []).filter(l => l.section === 'reportHeader' || l.section === 'header');
                    const detailLabels = (definition.designLabels || []).filter(l => !l.section || l.section === 'detail');
                    const footerLabels = (definition.designLabels || []).filter(l => l.section === 'reportFooter' || l.section === 'footer');
                    const headerImages = (definition.designImages || []).filter(i => i.section === 'reportHeader' || i.section === 'header');
                    const detailImages = (definition.designImages || []).filter(i => !i.section || i.section === 'detail');

                    const detailH = Math.max(
                      36,
                      ...detailFields.flatMap(f => [(f.y ?? 0) + (f.height ?? 24), (f.labelY ?? f.y ?? 0) + (f.labelHeight ?? 24)]),
                      ...detailLabels.map(l => l.y + l.height),
                      ...detailImages.map(i => i.y + i.height)
                    ) + 4;
                    const headerH = headerFields.length > 0 || headerLabels.length > 0 || headerImages.length > 0
                      ? Math.max(36, ...headerFields.flatMap(f => [(f.y ?? 0) + (f.height ?? 24)]),
                          ...headerLabels.map(l => l.y + l.height), ...headerImages.map(i => i.y + i.height)) + 4
                      : 0;

                    const renderDesignElements = (
                      fields: (ReportFieldDef & DesignFieldDef)[],
                      labels: DesignLabelDef[],
                      images: DesignImageDef[],
                      record?: any,
                    ) => (
                      <>
                        {images.map(img => (
                          <div key={img.id} style={{ position: 'absolute', left: img.x, top: img.y, width: img.width, height: img.height }}>
                            <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                        ))}
                        {labels.map(fl => (
                          <div key={fl.id} style={{
                            position: 'absolute', left: fl.x, top: fl.y, width: fl.width, height: fl.height,
                            display: 'flex', alignItems: 'center',
                            fontSize: fl.style?.fontSize ?? 12, color: fl.style?.color ?? '#333',
                            backgroundColor: fl.style?.bgColor ?? 'transparent',
                            border: fl.style?.borderColor ? `1px solid ${fl.style.borderColor}` : 'none',
                            fontWeight: fl.style?.bold ? 'bold' : 'normal',
                            fontStyle: fl.style?.italic ? 'italic' : 'normal',
                            boxSizing: 'border-box',
                          }}>
                            {fl.text}
                          </div>
                        ))}
                        {fields.map(fd => {
                          const ls = fd.labelStyle ?? {};
                          const cs = fd.controlStyle ?? {};
                          const isNew = fd.labelX !== undefined;
                          const lx = isNew ? (fd.labelX ?? 0) : (fd.x ?? 0);
                          const ly = isNew ? (fd.labelY ?? fd.y ?? 0) : (fd.y ?? 0);
                          const lw = fd.labelWidth ?? 100;
                          const lh = fd.labelHeight ?? (fd.height ?? 24);
                          const cx = isNew ? (fd.x ?? 0) : ((fd.x ?? 0) + lw + 4);
                          const cy = fd.y ?? 0;
                          const cw = fd.width ?? 180;
                          const ch = fd.height ?? 24;
                          const val = record ? record.data?.[fd.fieldName] : '';
                          return (
                            <React.Fragment key={fd.fieldName}>
                              <div style={{
                                position: 'absolute', left: lx, top: ly, width: lw, height: lh,
                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                paddingRight: 4, boxSizing: 'border-box',
                                fontWeight: ls.bold ? 'bold' : 'normal', fontStyle: ls.italic ? 'italic' : 'normal',
                                fontSize: ls.fontSize ?? 12, color: ls.color ?? '#333',
                                backgroundColor: ls.bgColor ?? 'transparent',
                              }}>
                                {fd.label}
                              </div>
                              <div style={{
                                position: 'absolute', left: cx, top: cy, width: cw, height: ch,
                                display: 'flex', alignItems: 'center',
                                fontSize: cs.fontSize ?? 12, color: cs.color ?? '#000',
                                backgroundColor: cs.bgColor ?? 'transparent',
                                border: '1px solid #d0d0d0', padding: '0 4px', boxSizing: 'border-box',
                                fontWeight: cs.bold ? 'bold' : 'normal', fontStyle: cs.italic ? 'italic' : 'normal',
                                overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                              }}>
                                {fd.fieldType === 'boolean' ? (
                                  <span className={`inline-block w-3 h-3 rounded-sm border ${val ? 'bg-[#5d4037] border-[#5d4037]' : 'border-gray-400'}`} />
                                ) : fd.fieldType === 'attachment' && isImageUrl(val) ? (
                                  <img src={String(val)} alt={fd.label} style={{ height: ch - 4, width: 'auto', objectFit: 'contain' }} />
                                ) : String(val ?? '')}
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </>
                    );

                    return (
                      <>
                        {headerH > 0 && (
                          <div className="relative border-b border-gray-200 mb-2" style={{ height: headerH, width: 700 }}>
                            {renderDesignElements(headerFields, headerLabels, headerImages)}
                          </div>
                        )}
                        {processedRecords.map((rec, ri) => (
                          <div key={rec.id} className="relative" style={{
                            height: detailH, width: 700,
                            borderBottom: '1px solid #eee',
                            backgroundColor: ri % 2 === 0 ? '#fff' : '#fafaf8',
                          }}>
                            {renderDesignElements(detailFields, detailLabels, detailImages, rec)}
                          </div>
                        ))}
                        {footerFields.length > 0 && (
                          <div className="relative border-t border-gray-200 mt-2" style={{
                            height: Math.max(36, ...footerFields.flatMap(f => [(f.y ?? 0) + (f.height ?? 24)])) + 4,
                            width: 700,
                          }}>
                            {renderDesignElements(footerFields, footerLabels, [])}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
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
            ref={canvasRef}
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
