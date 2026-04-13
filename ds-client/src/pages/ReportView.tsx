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
  FileText, Printer, Save, ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
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
  DsRptChartSettingsIcon,
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

  const [view, setView] = useState<'report' | 'layout' | 'design'>(
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
    if (def.fields) {
      def.fields = def.fields.map(f => ({
        ...f,
        fieldName: f.fieldName || (f as any).name || '',
      }));
    }
    if (def.tableId && !def.tableName) {
      try {
        const td = await apiFetch(`/api/ds/databases/${databaseId}/tables/${def.tableId}`);
        def.tableName = td.name;
      } catch {}
    }
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
      className="flex items-center justify-center w-[28px] h-[28px] rounded hover:bg-[#e8e6e3] active:bg-[#d6d3ce] cursor-pointer border border-transparent hover:border-gray-300"
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

  const designRibbonContent = (
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#e8e6e3] active:bg-[#d6d3ce] cursor-pointer border border-transparent hover:border-gray-300 h-[60px]">
              <div className="grid grid-cols-4 gap-[3px]">
                {[
                  <DsRptSelectIcon size={18} />, <DsRptTextBoxIcon size={18} />,
                  <DsRptLabelIcon size={18} />, <DsRptButtonIcon size={18} />,
                  <DsRptComboBoxIcon size={18} />, <DsRptCheckBoxIcon size={18} />,
                  <DsRptInsertImageIcon size={18} />, <DsRptLineIcon size={18} />,
                ].map((icon, i) => <span key={i} className="w-[20px] h-[20px] flex items-center justify-center">{icon}</span>)}
              </div>
              <ChevronDown size={12} className="text-gray-500 ml-0.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-2 w-auto">
            <div className="grid grid-cols-8 gap-1">
              {tinyBtn(<DsRptSelectIcon size={20} />, 'Select', noop)}
              {tinyBtn(<DsRptTextBoxIcon size={20} />, 'Text Box', () => canvasRef.current?.addTextBox())}
              {tinyBtn(<DsRptLabelIcon size={20} />, 'Label', () => canvasRef.current?.addLabel())}
              {tinyBtn(<DsRptButtonIcon size={20} />, 'Button', noop)}
              {tinyBtn(<DsRptComboBoxIcon size={20} />, 'Combo Box', noop)}
              {tinyBtn(<DsRptCheckBoxIcon size={20} />, 'Check Box', () => canvasRef.current?.addCheckBox())}
              {tinyBtn(<DsRptOptionButtonIcon size={20} />, 'Option Button', noop)}
              {tinyBtn(<DsRptToggleButtonIcon size={20} />, 'Toggle Button', noop)}
              {tinyBtn(<DsRptListBoxIcon size={20} />, 'List Box', noop)}
              {tinyBtn(<DsRptTabControlIcon size={20} />, 'Tab Control', noop)}
              {tinyBtn(<DsRptSubFormSubReportIcon size={20} />, 'Subreport', noop)}
              {tinyBtn(<DsRptAttachmentIcon size={20} />, 'Attachment', noop)}
              {tinyBtn(<DsRptLinkIcon size={20} />, 'Hyperlink', noop)}
              {tinyBtn(<DsRptLineIcon size={20} />, 'Line', () => canvasRef.current?.addLine())}
              {tinyBtn(<DsRptRectangleIcon size={20} />, 'Rectangle', () => canvasRef.current?.addRectangle())}
              {tinyBtn(<DsRptOptionGroupIcon size={20} />, 'Option Group', noop)}
              {tinyBtn(<DsRptBoundObjectFrameIcon size={20} />, 'Bound Frame', noop)}
              {tinyBtn(<DsRptUnboundObjectFrameIcon size={20} />, 'Unbound Frame', noop)}
              {tinyBtn(<DsRptEdgeBrowserIcon size={20} />, 'Web Browser', noop)}
              {tinyBtn(<DsRptInsertPageBreakIcon size={20} />, 'Page Break', () => canvasRef.current?.addPageBreak())}
              {tinyBtn(<DsRptInsertImageIcon size={20} />, 'Insert Image', () => canvasRef.current?.addImage())}
              {tinyBtn(<DsRptInsertModernChartIcon size={20} />, 'Insert Modern Chart', noop)}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
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
  );

  const contextTabName = view === 'report' ? 'Report View' : view === 'layout' ? 'Report Layout Design' : 'Report Design';

  const contextSection: RibbonContextSection = {
    color: '#5d4037',
    defaultTab: contextTabName,
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
        name: 'Report Layout Design',
        content: designRibbonContent,
      },
      {
        name: 'Report Design',
        content: designRibbonContent,
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
            icon={view === 'report' ? <DsRptReportViewIcon size={40} /> : view === 'layout' ? <DsRptLayoutViewIcon size={40} /> : <DesignViewIcon size={40} />}
            label="View"
          >
            <RibbonButton icon={<DsRptReportViewIcon size={16} />} label="Report View" active={view === 'report'} onClick={() => setView('report')} />
            <RibbonButton icon={<DsRptPrintPreviewIcon size={16} />} label="Print Preview" active={false} onClick={handlePrint} />
            <RibbonButton icon={<DsRptLayoutViewIcon size={16} />} label="Layout View" active={view === 'layout'} onClick={() => setView('layout')} />
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

  const renderAccessReport = (isLayout: boolean) => {
    const reportWidth = 700;
    const designFields = allFields.filter(f => f.visible) as (ReportFieldDef & DesignFieldDef)[];
    const isHdr = (s?: string) => s === 'reportHeader' || s === 'header' || s === 'pageHeader';
    const isDtl = (s?: string) => !s || s === 'detail';
    const isFtr = (s?: string) => s === 'reportFooter' || s === 'footer' || s === 'pageFooter';
    const headerFields = designFields.filter(f => isHdr(f.section));
    const detailFields = designFields.filter(f => isDtl(f.section));
    const footerFields = designFields.filter(f => isFtr(f.section));

    const headerLabels = (definition.designLabels || []).filter(l => isHdr(l.section));
    const detailLabels = (definition.designLabels || []).filter(l => isDtl(l.section));
    const footerLabels = (definition.designLabels || []).filter(l => isFtr(l.section));
    const headerImages = (definition.designImages || []).filter(i => isHdr(i.section));
    const detailImages = (definition.designImages || []).filter(i => isDtl(i.section));

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
                border: isLayout ? '1px solid #b0b0b0' : 'none',
                padding: '0 4px', boxSizing: 'border-box',
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

    const renderAutoDetail = (record: any, ri: number) => {
      let yOff = 4;
      return (
        <div className="relative" style={{
          minHeight: visibleFields.length * 24 + 8,
          width: reportWidth,
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: ri % 2 === 0 ? '#fff' : '#fafaf8',
        }}>
          {visibleFields.map((fd, fi) => {
            const y = fi * 24 + 4;
            const val = record.data?.[fd.fieldName];
            return (
              <React.Fragment key={fd.fieldName}>
                <div style={{
                  position: 'absolute', left: 4, top: y, width: 120, height: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  paddingRight: 6, fontSize: 12, color: '#333', fontWeight: 500,
                }}>
                  {fd.label}
                </div>
                <div style={{
                  position: 'absolute', left: 130, top: y, width: 200, height: 22,
                  display: 'flex', alignItems: 'center',
                  fontSize: 12, color: '#000',
                  border: isLayout ? '1px solid #b0b0b0' : 'none',
                  padding: '0 4px', boxSizing: 'border-box',
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}>
                  {fd.fieldType === 'boolean' ? (
                    <span className={`inline-block w-3 h-3 rounded-sm border ${val ? 'bg-[#5d4037] border-[#5d4037]' : 'border-gray-400'}`} />
                  ) : fd.fieldType === 'attachment' && isImageUrl(val) ? (
                    <img src={String(val)} alt={fd.label} style={{ height: 18, width: 'auto', objectFit: 'contain' }} />
                  ) : String(val ?? '')}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      );
    };

    const hasDesign = hasDesignLayout;

    const detailH = hasDesign ? Math.max(
      36,
      ...detailFields.flatMap(f => [(f.y ?? 0) + (f.height ?? 24), (f.labelY ?? f.y ?? 0) + (f.labelHeight ?? 24)]),
      ...detailLabels.map(l => l.y + l.height),
      ...detailImages.map(i => i.y + i.height)
    ) + 4 : 0;

    const headerH = hasDesign && (headerFields.length > 0 || headerLabels.length > 0 || headerImages.length > 0)
      ? Math.max(36, ...headerFields.flatMap(f => [(f.y ?? 0) + (f.height ?? 24)]),
          ...headerLabels.map(l => l.y + l.height), ...headerImages.map(i => i.y + i.height)) + 4
      : 0;

    const footerH = hasDesign && footerFields.length > 0
      ? Math.max(36, ...footerFields.flatMap(f => [(f.y ?? 0) + (f.height ?? 24)])) + 4
      : 0;

    const titleName = definition.title || reportMeta?.name || 'Report';

    const hasHeaderContent = headerFields.length > 0 || headerLabels.length > 0 || headerImages.length > 0;
    const detailRows = processedRecords.length > 0
      ? processedRecords
      : [{ id: '__empty__', data: {} }];

    return (
      <div className="flex-1 overflow-y-auto p-4" ref={printRef}>
        <div style={{ width: reportWidth, margin: '0 auto' }}>
          {/* Report Header — only if the design actually has header content */}
          {hasDesign && hasHeaderContent ? (
            <div className="relative" style={{
              height: headerH, width: reportWidth,
              backgroundColor: '#d6e4f0',
            }}>
              {renderDesignElements(headerFields, headerLabels, headerImages)}
            </div>
          ) : !hasDesign ? (
            <div style={{
              width: reportWidth, padding: '12px 16px',
              backgroundColor: '#d6e4f0',
            }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', fontStyle: 'italic', color: '#333' }}>
                {titleName}
              </div>
            </div>
          ) : null}

          {/* Detail rows */}
          {visibleFields.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No fields visible. Open Design View to configure fields.</div>
          ) : detailRows.map((rec, ri) => (
            hasDesign ? (
              <div key={rec.id} className="relative" style={{
                height: detailH, width: reportWidth,
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: ri % 2 === 0 ? '#fff' : '#fafaf8',
              }}>
                {renderDesignElements(detailFields, detailLabels, detailImages, rec)}
              </div>
            ) : renderAutoDetail(rec, ri)
          ))}

          {/* Report Footer */}
          {hasDesign && footerH > 0 ? (
            <div className="relative" style={{
              height: footerH, width: reportWidth,
              borderTop: '1px solid #ccc',
              backgroundColor: '#fff',
            }}>
              {renderDesignElements(footerFields, footerLabels, [])}
            </div>
          ) : !hasDesign ? (
            <div style={{
              width: reportWidth, padding: '8px 16px',
              borderTop: '1px solid #ccc',
              display: 'flex', justifyContent: 'space-between',
              fontSize: 11, color: '#777',
            }}>
              <span>{today}</span>
              <span>Page 1 of 1</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <Shell title={reportMeta?.name || 'Report'} ribbon={ribbon} sidebar={sidebar}>
      {(view === 'report' || view === 'layout') ? (
        <div className="flex flex-col h-full bg-[#f3f2f1]">
          {view === 'report' && (
            <div className="bg-[#5d4037] text-white px-4 py-2 flex items-center gap-2 flex-none print:hidden">
              <FileText size={16} />
              <span className="font-semibold text-sm">{definition.title || reportMeta?.name}</span>
              <span className="ml-auto text-xs text-white/60">{processedRecords.length} record{processedRecords.length !== 1 ? 's' : ''}</span>
              <Button onClick={handlePrint} size="sm" variant="ghost" className="text-white hover:bg-white/20 h-7 text-xs">
                <Printer size={13} className="mr-1" /> Print
              </Button>
            </div>
          )}
          {renderAccessReport(view === 'layout')}
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
            autoSave
          />
        </div>
      )}
    </Shell>
  );
}
