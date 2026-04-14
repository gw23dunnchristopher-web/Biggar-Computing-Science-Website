/**
 * FormView — single-record form with record navigation (Access style).
 * Form view: renders fields at their designed canvas positions (or falls back to a vertical list).
 * Design view: visual drag-and-drop canvas for positioning, styling, and adding images.
 * Attachment fields that hold image URLs are displayed as images.
 * Both teachers and students can customise the layout of their own sandboxed copy.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearch } from 'wouter';
import { Shell } from '@/components/layout/Shell';
import { Sidebar } from '@/components/layout/Sidebar';
import { Ribbon, RibbonGroup, RibbonButton, RibbonDropdownButton, RibbonContextSection } from '@/components/layout/Ribbon';
import { CreateTabContent, ExternalDataTabContent, DatabaseToolsTabContent } from '@/components/layout/AccessRibbonTabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { DesignViewIcon } from '@/components/ui/design-view-icon';
import { AccessDesignCanvas } from '@/components/ui/access-design-canvas';
import type { DesignFieldDef, DesignImageDef, DesignLabelDef, DesignCanvasHandle } from '@/components/ui/access-design-canvas';
import { parseLookupConfig } from '@/components/ui/design-grid';
import {
  ChevronFirst, ChevronLast, ChevronLeft, ChevronRight,
  Plus, Trash2, Save, X, ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import {
  DsRptLayoutViewIcon,
  DsRptThemesIcon, DsRptColorsIcon, DsRptFontsIcon,
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
  DsFrmFormViewIcon, DsFrmNavigationIcon, DsFrmDatasheetIcon,
} from '@/components/ui/ds-icons';
import type { Database, Table } from '@/api';
import type { QueryRow } from '@/components/layout/Sidebar';
import {
  ThemePickerModal, ColorPickerModal, FontPickerModal,
  getDefaultTheme,
} from '@/components/ui/theme-modals';
import type { DatabaseTheme, ThemeColors, ThemeFonts } from '@/components/ui/theme-modals';


async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers as any) }
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

interface FormDefinition {
  tableId: number;
  tableName: string;
  fields: DesignFieldDef[];
  images?: DesignImageDef[];
  freeLabels?: DesignLabelDef[];
  formBgColor?: string;
}

interface Props {
  databaseId: number;
  formId: number;
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
  onSelectTable?: (id: number) => void;
  onSelectForm?: (id: number) => void;
  onSelectReport?: (id: number) => void;
  onSelectQuery?: (id: number) => void;
}

/** True if the value looks like an image URL or data-URI */
function isImageUrl(val: unknown): boolean {
  if (typeof val !== 'string' || !val) return false;
  return /^https?:\/\/.+\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i.test(val)
    || val.startsWith('data:image/');
}

export function FormView({
  databaseId, formId, db, tables, queries = [], forms = [], reports = [],
  onDeleteTable, onDeleteQuery, onDeleteForm, onDeleteReport, onRefresh,
  isStudentMode, onCreateTable, onCreateQuery, onQueryWizard, onCreateSqlQuery,
  onCreateForm, onCreateBlankForm, onCreateAutoForm,
  onCreateReport, onCreateBlankReport, onCreateAutoReport,
  onShare, onSettings,
  onSelectTable, onSelectForm, onSelectReport, onSelectQuery
}: Props) {
  const search = useSearch();
  const { toast } = useToast();
  const canvasRef = useRef<DesignCanvasHandle>(null);

  const [view, setView] = useState<'form' | 'design'>(
    new URLSearchParams(search).get('design') === '1' ? 'design' : 'form'
  );
  const [formMeta, setFormMeta] = useState<{ id: number; name: string; definition: any } | null>(null);
  const [definition, setDefinition] = useState<FormDefinition | null>(null);
  const [tableFields, setTableFields] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [cursor, setCursor] = useState(0);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDesignSaving, setIsDesignSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [dbTheme, setDbTheme] = useState<DatabaseTheme | null>(null);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showFontModal, setShowFontModal] = useState(false);

  const loadForm = useCallback(async () => {
    const f = await apiFetch(`/api/ds/databases/${databaseId}/forms/${formId}`);
    setFormMeta(f);
    setDefinition(f.definition as FormDefinition);
  }, [databaseId, formId]);

  const loadRecords = useCallback(async (def: FormDefinition) => {
    const [recs, tbl] = await Promise.all([
      apiFetch(`/api/ds/databases/${databaseId}/tables/${def.tableId}/records`),
      apiFetch(`/api/ds/databases/${databaseId}/tables/${def.tableId}`)
    ]);
    setRecords(recs || []);
    setTableFields(tbl?.fields || []);
    setCursor(0);
  }, [databaseId]);

  useEffect(() => {
    loadForm().catch(() => toast({ title: 'Failed to load form', variant: 'destructive' }));
  }, [loadForm]);

  useEffect(() => {
    if (definition?.tableId) loadRecords(definition).catch(() => {});
  }, [definition, loadRecords]);

  useEffect(() => {
    apiFetch(`/api/ds/databases/${databaseId}/theme`).then(t => {
      if (t) setDbTheme(t as DatabaseTheme);
    }).catch(() => {});
  }, [databaseId]);

  const saveTheme = async (theme: DatabaseTheme) => {
    setDbTheme(theme);
    try {
      await apiFetch(`/api/ds/databases/${databaseId}/theme`, {
        method: 'PUT', body: JSON.stringify(theme),
      });
      toast({ title: `Theme updated to "${theme.themeName}"` });
    } catch { toast({ title: 'Failed to save theme', variant: 'destructive' }); }
  };

  const handleThemeApply = (theme: DatabaseTheme) => saveTheme(theme);
  const handleColorsApply = (colors: ThemeColors) => {
    const cur = dbTheme || getDefaultTheme();
    saveTheme({ ...cur, colors });
  };
  const handleFontsApply = (fonts: ThemeFonts) => {
    const cur = dbTheme || getDefaultTheme();
    saveTheme({ ...cur, fonts });
  };

  const currentRecord = records[cursor] ?? null;

  const navigateTo = (idx: number) => {
    if (isDirty) { toast({ title: 'Unsaved changes — save or discard first.' }); return; }
    setCursor(Math.max(0, Math.min(idx, records.length - 1)));
    setEditValues({});
    setIsDirty(false);
  };

  const handleNewRecord = async () => {
    if (isDirty) { toast({ title: 'Save or discard current changes first.' }); return; }
    if (!definition) return;
    // Only send editable fields — skip autonumber/pk so the server assigns them
    const emptyData: Record<string, any> = {};
    definition.fields.forEach(f => {
      const tf = tableFields.find(t => t.name === f.fieldName);
      if (tf?.fieldType !== 'autonumber' && !tf?.isPrimaryKey) {
        emptyData[f.fieldName] = '';
      }
    });
    try {
      const created = await apiFetch(`/api/ds/databases/${databaseId}/tables/${definition.tableId}/records`, {
        method: 'POST', body: JSON.stringify({ data: emptyData })
      });
      const newRecs = [...records, created];
      setRecords(newRecs);
      setCursor(newRecs.length - 1);
      // Clear editValues so the form reads straight from the created record (shows the real autonumber)
      setEditValues({});
      setIsDirty(false);
    } catch {
      toast({ title: 'Failed to create record', variant: 'destructive' });
    }
  };

  const handleDeleteRecord = () => { if (!currentRecord) return; setDeleteConfirm(true); };
  const doDeleteRecord = async () => {
    if (!currentRecord || !definition) return;
    try {
      await apiFetch(`/api/ds/databases/${databaseId}/tables/${definition.tableId}/records/${currentRecord.id}`, { method: 'DELETE' });
      const newRecs = records.filter(r => r.id !== currentRecord.id);
      setRecords(newRecs);
      setCursor(Math.min(cursor, newRecs.length - 1));
      setEditValues({});
      setIsDirty(false);
    } catch {
      toast({ title: 'Failed to delete record', variant: 'destructive' });
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setEditValues(prev => ({ ...prev, [fieldName]: value }));
    setIsDirty(true);
  };

  /** Block non-numeric keystrokes in number/currency inputs */
  const blockNonNumeric = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['0','1','2','3','4','5','6','7','8','9','.','-','Backspace','Delete',
      'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Enter','Escape','Home','End'];
    if (!allowed.includes(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault();
  };

  const handleSave = async () => {
    if (!currentRecord || !definition || !isDirty) return;
    // Validate required fields before saving
    const missing = visibleFields.filter(fd => {
      const tf = tableFields.find(t => t.name === fd.fieldName);
      if (!tf?.isRequired || tf.fieldType === 'autonumber' || tf.isPrimaryKey) return false;
      const val = getFieldValue(fd.fieldName);
      return val === '' || val === null || val === undefined;
    });
    if (missing.length > 0) {
      toast({
        title: `Required fields are empty: ${missing.map(f => f.label).join(', ')}`,
        variant: 'destructive'
      });
      return;
    }
    setIsSaving(true);
    try {
      const updatedData = { ...(currentRecord.data || {}), ...editValues };
      const updated = await apiFetch(
        `/api/ds/databases/${databaseId}/tables/${definition.tableId}/records/${currentRecord.id}`,
        { method: 'PUT', body: JSON.stringify({ data: updatedData }) }
      );
      const newRecs = [...records];
      newRecs[cursor] = updated;
      setRecords(newRecs);
      setEditValues({});
      setIsDirty(false);
      toast({ title: 'Record saved' });
    } catch {
      toast({ title: 'Failed to save record', variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  const handleDiscard = () => { setEditValues({}); setIsDirty(false); };

  const getFieldValue = (fieldName: string) =>
    fieldName in editValues ? editValues[fieldName] : (currentRecord?.data?.[fieldName] ?? '');

  const getFieldType = (fieldName: string) =>
    tableFields.find(f => f.name === fieldName)?.fieldType
    || definition?.fields.find(f => f.fieldName === fieldName)?.fieldType
    || 'text';

  const handleSaveDesign = async (
    newFields: DesignFieldDef[],
    newImages: DesignImageDef[],
    newFreeLabels: DesignLabelDef[]
  ) => {
    if (!definition || !formMeta) return;
    setIsDesignSaving(true);
    const newDef: FormDefinition = {
      ...definition,
      fields: newFields.map((f, i) => ({ ...f, sortOrder: i })),
      images: newImages,
      freeLabels: newFreeLabels,
    };
    try {
      await apiFetch(`/api/ds/databases/${databaseId}/forms/${formId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: formMeta.name, definition: newDef })
      });
      setDefinition(newDef);
      toast({ title: 'Form design saved' });
    } catch {
      toast({ title: 'Failed to save design', variant: 'destructive' });
    } finally { setIsDesignSaving(false); }
  };

  const visibleFields = definition?.fields
    .filter(f => f.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder) || [];

  const hasAbsoluteLayout = visibleFields.some(f => f.x !== undefined || f.y !== undefined);
  const formImages: DesignImageDef[] = definition?.images ?? [];
  const formFreeLabels: DesignLabelDef[] = definition?.freeLabels ?? [];
  const formBgColor = definition?.formBgColor || '#ffffff';

  const commonTabProps = {
    onCreateTable: onCreateTable || (() => {}),
    onCreateQuery: onCreateQuery || (() => {}),
    onQueryWizard, onCreateSqlQuery, onCreateForm, onCreateBlankForm, onCreateAutoForm,
    onCreateReport, onCreateBlankReport, onCreateAutoReport, onShare, onSettings,
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
    color: '#2e7d32',
    defaultTab: view === 'form' ? 'Form View' : 'Form Design',
    tabs: [
      {
        name: 'Form View',
        content: (
          <RibbonGroup name="Records">
            <RibbonButton icon={<Plus size={22} />} label="New Record" onClick={handleNewRecord} />
            <RibbonButton icon={<Trash2 size={22} />} label="Delete" onClick={handleDeleteRecord} disabled={!currentRecord} />
            <RibbonButton icon={<Save size={22} />} label="Save" onClick={handleSave} disabled={!isDirty || isSaving} />
            <RibbonButton icon={<X size={22} />} label="Discard" onClick={handleDiscard} disabled={!isDirty} />
          </RibbonGroup>
        )
      },
      {
        name: 'Form Design',
        content: (
          <>
            <RibbonGroup name="Themes">
              <div className="flex items-start gap-0.5">
                <RibbonButton icon={<DsRptThemesIcon />} label="Themes" onClick={() => setShowThemeModal(true)} />
                <div className="flex flex-col gap-0.5 pt-1">
                  {smallBtn(<DsRptColorsIcon size={14} />, 'Colors', () => setShowColorModal(true))}
                  {smallBtn(<DsRptFontsIcon size={14} />, 'Fonts', () => setShowFontModal(true))}
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
                    {tinyBtn(<DsRptSubFormSubReportIcon size={20} />, 'Subform', noop)}
                    {tinyBtn(<DsRptAttachmentIcon size={20} />, 'Attachment', noop)}
                    {tinyBtn(<DsRptLinkIcon size={20} />, 'Hyperlink', noop)}
                    {tinyBtn(<DsRptLineIcon size={20} />, 'Line', () => canvasRef.current?.addLine())}
                    {tinyBtn(<DsRptRectangleIcon size={20} />, 'Rectangle', () => canvasRef.current?.addRectangle())}
                    {tinyBtn(<DsRptOptionGroupIcon size={20} />, 'Option Group', noop)}
                    {tinyBtn(<DsRptBoundObjectFrameIcon size={20} />, 'Bound Frame', noop)}
                    {tinyBtn(<DsRptUnboundObjectFrameIcon size={20} />, 'Unbound Frame', noop)}
                    {tinyBtn(<DsRptEdgeBrowserIcon size={20} />, 'Web Browser', noop)}
                    {tinyBtn(<DsFrmNavigationIcon size={20} />, 'Navigation', noop)}
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
        )
      }
    ]
  };

  const ribbon = (
    <Ribbon
      title={formMeta?.name || 'Form'}
      allDatabasesLink="/"
      pinnedContent={
        <RibbonGroup name="Views">
          <RibbonDropdownButton
            icon={view === 'form' ? <DsFrmFormViewIcon size={40} /> : <DesignViewIcon size={40} />}
            label="View"
          >
            <RibbonButton icon={<DsFrmFormViewIcon size={16} />} label="Form View" active={view === 'form'} onClick={() => setView('form')} />
            <RibbonButton icon={<DsFrmDatasheetIcon size={16} />} label="Datasheet View" active={false} onClick={() => setView('form')} />
            <RibbonButton icon={<DsRptLayoutViewIcon size={16} />} label="Layout View" active={false} onClick={() => setView('form')} />
            <RibbonButton icon={<DesignViewIcon size={16} />} label="Design View" active={view === 'design'} onClick={() => setView('design')} />
          </RibbonDropdownButton>
        </RibbonGroup>
      }
      tabs={[
        { name: 'Home', content: null },
        { name: 'Create', content: <CreateTabContent {...commonTabProps} /> },
        { name: 'External Data', content: <ExternalDataTabContent {...commonTabProps} onShare={onShare} /> },
        { name: 'Database Tools', content: <DatabaseToolsTabContent {...commonTabProps} onSettings={onSettings} /> }
      ]}
      contextSection={contextSection}
    />
  );

  const sidebar = (
    <Sidebar
      tables={tables} databaseId={databaseId} isStudentMode={isStudentMode}
      onDeleteTable={onDeleteTable} queries={queries} onDeleteQuery={onDeleteQuery}
      forms={forms} onDeleteForm={onDeleteForm} reports={reports} onDeleteReport={onDeleteReport}
      onRefresh={onRefresh}
      onSelectTable={onSelectTable} onSelectForm={onSelectForm} onSelectReport={onSelectReport} onSelectQuery={onSelectQuery}
      activeFormId={formId}
    />
  );

  if (!definition) {
    return <Shell title={formMeta?.name || 'Form'} ribbon={ribbon} sidebar={sidebar}><div className="p-8 text-gray-500">Loading form…</div></Shell>;
  }

  // ── Render a single field's input control ──────────────────────────
  const renderControl = (fd: FormFieldDef, cs?: Record<string, any>) => {
    const fieldType = getFieldType(fd.fieldName);
    const val = getFieldValue(fd.fieldName);
    const tf = tableFields.find(f => f.name === fd.fieldName);
    const w = fd.width;
    const h = fd.height ?? 28;
    const isRequired = tf?.isRequired;

    const themeColors = dbTheme?.colors;
    const themeFonts = dbTheme?.fonts;
    const baseStyle: React.CSSProperties = {
      fontWeight: cs?.bold ? 'bold' : 'normal',
      fontStyle: cs?.italic ? 'italic' : 'normal',
      fontSize: cs?.fontSize ?? 13,
      color: cs?.color ?? themeColors?.text,
      backgroundColor: cs?.bgColor ?? themeColors?.controlBg,
      borderColor: cs?.borderColor ?? themeColors?.controlBorder,
      fontFamily: themeFonts?.body,
      height: h,
      ...(w ? { width: w } : {}),
    };
    const ringColor = themeColors?.primary || '#2e7d32';
    const cls = `rounded border px-2 focus:outline-none focus:ring-1${isRequired && (val === '' || val === null || val === undefined) ? ' border-orange-300' : ''}`;
    const flexOrWidth = w ? {} : { flex: 1 as any };

    // ── Read-only: AutoNumber / Primary Key ──────────────────────────
    if (fieldType === 'autonumber' || tf?.isPrimaryKey) {
      return (
        <div style={{ ...baseStyle, height: undefined }} className="px-3 py-1.5 bg-gray-100 rounded border border-gray-200 text-sm text-gray-500 font-mono min-h-[28px] flex items-center">
          {(val !== '' && val !== null && val !== undefined) ? String(val) : '(Auto)'}
        </div>
      );
    }

    // ── Read-only: Calculated ────────────────────────────────────────
    if (fieldType === 'calculated') {
      return (
        <div style={{ ...baseStyle, height: undefined }} className="px-3 py-1.5 bg-gray-100 rounded border border-gray-200 text-sm text-gray-400 italic min-h-[28px] flex items-center">
          (calculated)
        </div>
      );
    }

    // ── Boolean ──────────────────────────────────────────────────────
    if (fieldType === 'boolean') {
      return (
        <div className="flex items-center" style={{ height: h }}>
          <input type="checkbox" checked={!!val}
            onChange={e => handleFieldChange(fd.fieldName, e.target.checked)}
            className="w-4 h-4 accent-[#2e7d32]" />
        </div>
      );
    }

    // ── Attachment (image URL) ───────────────────────────────────────
    if (fieldType === 'attachment') {
      const strVal = String(val ?? '');
      if (isImageUrl(strVal)) {
        return (
          <div style={w ? { width: w } : { flex: 1 }}>
            <img src={strVal} alt={fd.label}
              className="max-w-full rounded border border-gray-200 object-contain mb-1"
              style={{ maxHeight: 200 }} />
            <input type="url" value={strVal}
              onChange={e => handleFieldChange(fd.fieldName, e.target.value)}
              placeholder="Paste image URL…"
              style={{ fontSize: 11, height: 22, width: '100%' }}
              className="rounded border border-gray-200 px-2 text-xs focus:outline-none focus:border-[#2e7d32]" />
          </div>
        );
      }
      return (
        <input type="url" value={strVal}
          onChange={e => handleFieldChange(fd.fieldName, e.target.value)}
          placeholder="Paste image URL (https://…)"
          style={{ ...baseStyle, ...flexOrWidth }}
          className={cls} />
      );
    }

    // ── Number / Currency ────────────────────────────────────────────
    if (fieldType === 'number' || fieldType === 'currency') {
      const isFocused = focusedField === fd.fieldName;
      const hasVal = val !== '' && val !== null && val !== undefined;

      // Display mode: formatted value, click to edit
      if (!isFocused) {
        let displayVal = '';
        if (hasVal) {
          displayVal = fieldType === 'currency'
            ? '£' + Number(val).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : String(Number(val));
        }
        return (
          <div
            onClick={() => setFocusedField(fd.fieldName)}
            style={{ ...baseStyle, ...flexOrWidth, cursor: 'text' }}
            className={`${cls} flex items-center`}
            title="Click to edit"
          >
            {displayVal
              ? <span>{displayVal}</span>
              : <span className="text-gray-400 select-none">{fieldType === 'currency' ? '£0.00' : '0'}</span>
            }
          </div>
        );
      }

      // Edit mode: number input (auto-focused)
      return (
        <div className="flex items-center gap-1" style={{ ...flexOrWidth, height: h }}>
          {fieldType === 'currency' && <span className="text-sm text-gray-500 flex-none">£</span>}
          <input type="number"
            autoFocus
            value={val === '' || val === null || val === undefined ? '' : val}
            step={fieldType === 'currency' ? '0.01' : 'any'}
            onChange={e => handleFieldChange(fd.fieldName, e.target.value !== '' ? Number(e.target.value) : '')}
            onKeyDown={blockNonNumeric}
            onBlur={() => setFocusedField(null)}
            placeholder={fieldType === 'currency' ? '0.00' : '0'}
            style={{ ...baseStyle, flex: 1, height: '100%' }}
            className={cls} />
        </div>
      );
    }

    // ── Date ─────────────────────────────────────────────────────────
    if (fieldType === 'date') {
      return (
        <input type="date"
          value={val ? String(val).split('T')[0] : ''}
          onChange={e => handleFieldChange(fd.fieldName, e.target.value)}
          style={{ ...baseStyle, ...flexOrWidth }}
          className={cls} />
      );
    }

    // ── Long Text ────────────────────────────────────────────────────
    if (fieldType === 'longtext') {
      return (
        <textarea
          value={val ?? ''}
          onChange={e => handleFieldChange(fd.fieldName, e.target.value)}
          rows={3}
          placeholder={tf?.defaultValue || ''}
          style={{ ...baseStyle, height: undefined, minHeight: Math.max(h, 60), ...flexOrWidth }}
          className={`${cls} resize-y`} />
      );
    }

    // ── Hyperlink ────────────────────────────────────────────────────
    if (fieldType === 'hyperlink') {
      return (
        <input type="url"
          value={val ?? ''}
          onChange={e => handleFieldChange(fd.fieldName, e.target.value)}
          placeholder="https://…"
          style={{ ...baseStyle, ...flexOrWidth }}
          className={cls} />
      );
    }

    // ── Lookup ───────────────────────────────────────────────────────
    if (fieldType === 'lookup') {
      const cfg = parseLookupConfig(tf?.description);
      if (cfg?.type === 'valuelist' && cfg.values?.length > 0) {
        return (
          <select
            value={val ?? ''}
            onChange={e => handleFieldChange(fd.fieldName, e.target.value)}
            style={{ ...baseStyle, ...flexOrWidth }}
            className={`${cls} bg-white cursor-pointer`}>
            <option value="">(none)</option>
            {cfg.values.map((v: string) => <option key={v} value={v}>{v}</option>)}
          </select>
        );
      }
    }

    // ── Default: Short Text ──────────────────────────────────────────
    return (
      <input type="text"
        value={val ?? ''}
        onChange={e => handleFieldChange(fd.fieldName, e.target.value)}
        placeholder={tf?.defaultValue || ''}
        style={{ ...baseStyle, ...flexOrWidth }}
        className={cls} />
    );
  };

  return (
    <>
      <Shell title={formMeta?.name || 'Form'} ribbon={ribbon} sidebar={sidebar}>

        {view === 'design' && (
          <div className="flex-1 overflow-hidden">
            <AccessDesignCanvas
              ref={canvasRef}
              mode="form"
              objectName={formMeta?.name || 'Form'}
              fields={definition.fields.sort((a, b) => a.sortOrder - b.sortOrder)}
              images={formImages}
              freeLabels={formFreeLabels}
              accentColor="#2e7d32"
              onSave={handleSaveDesign}
              isSaving={isDesignSaving}
            />
          </div>
        )}

        {/* ── Form View ────────────────────────────────────────────────── */}
        {view === 'form' && (
          <div className="flex flex-col h-full bg-[#f3f2f1]">
            {/* Header */}
            <div style={{ backgroundColor: dbTheme?.colors?.primary || '#2e7d32', color: dbTheme?.colors?.headerText || '#ffffff' }} className="px-4 py-2 flex items-center gap-2 flex-none">
              <LayoutTemplate size={16} />
              <span className="font-semibold text-sm" style={{ fontFamily: dbTheme?.fonts?.heading }}>{formMeta?.name}</span>
              {isDirty && <span className="ml-2 text-xs bg-white/20 rounded px-2 py-0.5">Unsaved changes</span>}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center">
              {hasAbsoluteLayout ? (
                /* ── Absolute-positioned canvas layout (label & control independent) ── */
                <div className="relative border border-gray-200 shadow-md"
                  style={{
                    width: 700,
                    minHeight: Math.max(
                      400,
                      ...visibleFields.flatMap(f => [
                        (f.labelX !== undefined ? (f.labelY ?? 0) + (f.labelHeight ?? 28) : (f.y ?? 0) + (f.height ?? 28)),
                        (f.y ?? 0) + (f.height ?? 28),
                      ]).map(v => v + 60),
                      ...formImages.map(i => i.y + i.height + 40),
                      ...formFreeLabels.map(l => l.y + l.height + 40)
                    ),
                    backgroundColor: dbTheme?.colors?.background || formBgColor,
                  }}
                >
                  {/* Free labels from design */}
                  {formFreeLabels.map(fl => (
                    <div key={fl.id} style={{
                      position: 'absolute', left: fl.x, top: fl.y, width: fl.width, height: fl.height,
                      display: 'flex', alignItems: 'center',
                      fontSize: fl.style?.fontSize ?? 13,
                      color: fl.style?.color ?? dbTheme?.colors?.text ?? '#333',
                      fontFamily: dbTheme?.fonts?.body,
                      backgroundColor: fl.style?.bgColor ?? 'transparent',
                      border: fl.style?.borderColor ? `1px solid ${fl.style.borderColor}` : 'none',
                      fontWeight: fl.style?.bold ? 'bold' : 'normal',
                      fontStyle: fl.style?.italic ? 'italic' : 'normal',
                      boxSizing: 'border-box',
                    }}>
                      {fl.text}
                    </div>
                  ))}
                  {/* Static images */}
                  {formImages.map(img => (
                    <div key={img.id} style={{ position: 'absolute', left: img.x, top: img.y, width: img.width, height: img.height }}>
                      <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                    </div>
                  ))}
                  {/* Fields — label and control rendered as independent absolute elements */}
                  {visibleFields.map(fd => {
                    const ls = fd.labelStyle ?? {};
                    const cs = fd.controlStyle ?? {};
                    // New format: labelX is set → fully independent positions
                    // Old format: labelX undefined → label at fd.x, control offset by 124px
                    const isNewFmt = fd.labelX !== undefined;
                    const lx = isNewFmt ? (fd.labelX ?? 10) : (fd.x ?? 10);
                    const ly = isNewFmt ? (fd.labelY ?? fd.y ?? 10) : (fd.y ?? 10);
                    const lw = fd.labelWidth ?? 120;
                    const lh = fd.labelHeight ?? (fd.height ?? 28);
                    const cx = isNewFmt ? (fd.x ?? 10) : ((fd.x ?? 10) + lw + 4);
                    const cy = fd.y ?? 10;
                    return (
                      <React.Fragment key={fd.fieldName}>
                        {/* Label */}
                        <div style={{
                          position: 'absolute', left: lx, top: ly,
                          width: lw, height: lh,
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'flex-end', paddingRight: 4, boxSizing: 'border-box',
                          fontWeight: ls.bold ? 'bold' : 'normal', fontStyle: ls.italic ? 'italic' : 'normal',
                          fontSize: ls.fontSize ?? 13, color: ls.color ?? dbTheme?.colors?.text ?? '#333',
                          fontFamily: ls.fontFamily ?? dbTheme?.fonts?.body,
                          backgroundColor: ls.bgColor ?? 'transparent',
                        }}>
                          {fd.label}:
                        </div>
                        {/* Control */}
                        <div style={{ position: 'absolute', left: cx, top: cy }}>
                          {renderControl(fd, cs)}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                /* ── Vertical list fallback (no positions set yet) ── */
                <div className="rounded shadow-md w-full max-w-xl border border-gray-200" style={{ backgroundColor: dbTheme?.colors?.background || '#ffffff' }}>
                  <div className="border-b border-gray-200 px-4 py-2 text-sm font-medium rounded-t" style={{ backgroundColor: dbTheme?.colors?.primary ? `${dbTheme.colors.primary}20` : '#e8f5e9', color: dbTheme?.colors?.primary || '#2e7d32', fontFamily: dbTheme?.fonts?.heading }}>
                    {definition.tableName}
                  </div>
                  <div className="p-5 space-y-3">
                    {visibleFields.map(fd => (
                      <div key={fd.fieldName} className="flex items-start gap-3">
                        <label className="w-36 flex-none text-sm font-medium text-gray-700 pt-2 text-right">{fd.label}:</label>
                        {renderControl(fd)}
                      </div>
                    ))}
                  </div>
                  {isDirty && (
                    <div className="px-5 pb-4 flex gap-2">
                      <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-[#2e7d32] hover:bg-[#1b5e20]">
                        <Save size={14} className="mr-1" /> Save
                      </Button>
                      <Button onClick={handleDiscard} size="sm" variant="outline">
                        <X size={14} className="mr-1" /> Discard
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Record nav bar */}
            <div className="flex-none bg-white border-t border-gray-300 px-4 py-2 flex items-center gap-2 text-sm">
              <button onClick={() => navigateTo(0)} disabled={cursor <= 0 || records.length === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronFirst size={18} />
              </button>
              <button onClick={() => navigateTo(cursor - 1)} disabled={cursor <= 0 || records.length === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs text-gray-600 bg-gray-100 border border-gray-300 rounded px-3 py-1 font-mono min-w-[90px] text-center">
                {records.length === 0 ? '(New)' : `${cursor + 1} of ${records.length}`}
              </span>
              <button onClick={() => navigateTo(cursor + 1)} disabled={cursor >= records.length - 1 || records.length === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight size={18} />
              </button>
              <button onClick={() => navigateTo(records.length - 1)} disabled={cursor >= records.length - 1 || records.length === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLast size={18} />
              </button>
              <div className="ml-2 h-4 border-l border-gray-300" />
              <Button onClick={handleNewRecord} size="sm" variant="outline" className="h-7 text-xs">
                <Plus size={13} className="mr-1" /> New Record
              </Button>
              {isDirty && (
                <>
                  <Button onClick={handleSave} size="sm" disabled={isSaving} className="h-7 text-xs bg-[#2e7d32] hover:bg-[#1b5e20] text-white">
                    <Save size={13} className="mr-1" /> Save
                  </Button>
                  <Button onClick={handleDiscard} size="sm" variant="outline" className="h-7 text-xs">
                    <X size={13} className="mr-1" /> Discard
                  </Button>
                </>
              )}
              <div className="ml-auto text-xs text-gray-400">{definition.tableName}</div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={deleteConfirm} onOpenChange={setDeleteConfirm}
          title="Delete Record"
          description="Are you sure you want to delete this record? This cannot be undone."
          confirmLabel="Delete Record"
          onConfirm={doDeleteRecord}
        />

        <ThemePickerModal open={showThemeModal} onOpenChange={setShowThemeModal} currentTheme={dbTheme} onApply={handleThemeApply} />
        <ColorPickerModal open={showColorModal} onOpenChange={setShowColorModal} currentTheme={dbTheme} onApply={handleColorsApply} />
        <FontPickerModal open={showFontModal} onOpenChange={setShowFontModal} currentTheme={dbTheme} onApply={handleFontsApply} />
      </Shell>
    </>
  );
}
