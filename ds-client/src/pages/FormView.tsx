/**
 * FormView — single-record form with record navigation (Access style).
 * Form view: renders fields at their designed canvas positions (or falls back to a vertical list).
 * Design view: visual drag-and-drop canvas for positioning, styling, and adding images.
 * Attachment fields that hold image URLs are displayed as images.
 * Both teachers and students can customise the layout of their own sandboxed copy.
 */
import React, { useState, useEffect, useCallback } from 'react';
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
import { FormDesignCanvas } from '@/components/ui/form-design-canvas';
import type { FormFieldDef, FormImageDef } from '@/components/ui/form-design-canvas';
import { parseLookupConfig } from '@/components/ui/design-grid';
import {
  LayoutTemplate,
  ChevronFirst, ChevronLast, ChevronLeft, ChevronRight,
  Plus, Trash2, Save, X,
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

interface FormDefinition {
  tableId: number;
  tableName: string;
  fields: FormFieldDef[];
  images?: FormImageDef[];
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
  onShare, onSettings
}: Props) {
  const search = useSearch();
  const { toast } = useToast();

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

  /** Save design from canvas — called with new fields/images/bgColor */
  const handleSaveDesign = async (
    newFields: FormFieldDef[],
    newImages: FormImageDef[],
    bgColor: string
  ) => {
    if (!definition || !formMeta) return;
    setIsDesignSaving(true);
    const newDef: FormDefinition = {
      ...definition,
      fields: newFields.map((f, i) => ({ ...f, sortOrder: i })),
      images: newImages,
      formBgColor: bgColor,
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
  const formImages: FormImageDef[] = definition?.images ?? [];
  const formBgColor = definition?.formBgColor || '#ffffff';

  // ── Ribbon ─────────────────────────────────────────────────────────
  const commonTabProps = {
    onCreateTable: onCreateTable || (() => {}),
    onCreateQuery: onCreateQuery || (() => {}),
    onQueryWizard, onCreateSqlQuery, onCreateForm, onCreateBlankForm, onCreateAutoForm,
    onCreateReport, onCreateBlankReport, onCreateAutoReport, onShare, onSettings,
  };

  const contextSection: RibbonContextSection = {
    color: '#2e7d32',
    defaultTab: view === 'form' ? 'Form View' : 'Design View',
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
        name: 'Design View',
        content: (
          <RibbonGroup name="Design">
            <RibbonButton icon={<Save size={22} />} label="Save Design" onClick={() => {}} disabled={isDesignSaving} />
          </RibbonGroup>
        )
      }
    ]
  };

  const ribbon = (
    <Ribbon
      title={formMeta?.name || 'Form'}
      allDatabasesLink="/"
      pinnedContent={
        <RibbonGroup name="View">
          <RibbonDropdownButton
            icon={view === 'form' ? <LayoutTemplate size={40} /> : <DesignViewIcon size={40} />}
            label={view === 'form' ? 'Form' : 'Design'}
          >
            <RibbonButton icon={<LayoutTemplate size={16} />} label="Form" active={view === 'form'} onClick={() => setView('form')} />
            <RibbonButton icon={<DesignViewIcon size={16} />} label="Design" active={view === 'design'} onClick={() => setView('design')} />
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

    const baseStyle: React.CSSProperties = {
      fontWeight: cs?.bold ? 'bold' : 'normal',
      fontStyle: cs?.italic ? 'italic' : 'normal',
      fontSize: cs?.fontSize ?? 13,
      color: cs?.color,
      backgroundColor: cs?.bgColor,
      borderColor: cs?.borderColor,
      height: h,
      ...(w ? { width: w } : {}),
    };
    const cls = `rounded border px-2 focus:outline-none focus:ring-1 focus:ring-[#2e7d32] focus:border-[#2e7d32]${isRequired && (val === '' || val === null || val === undefined) ? ' border-orange-300' : ''}`;
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

        {/* ── Design View ──────────────────────────────────────────────── */}
        {view === 'design' && (
          <div className="flex flex-col h-full">
            <div className="bg-[#2e7d32] text-white px-4 py-2 flex items-center gap-2 flex-none">
              <DesignViewIcon size={16} />
              <span className="font-semibold text-sm">{formMeta?.name} — Design View</span>
              <span className="ml-2 text-xs bg-white/15 rounded px-2 py-0.5">Drag fields to reposition • Click to select • Use the panel to style</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <FormDesignCanvas
                fields={definition.fields.sort((a, b) => a.sortOrder - b.sortOrder)}
                images={formImages}
                formBgColor={formBgColor}
                accentColor="#2e7d32"
                onSave={handleSaveDesign}
                isSaving={isDesignSaving}
              />
            </div>
          </div>
        )}

        {/* ── Form View ────────────────────────────────────────────────── */}
        {view === 'form' && (
          <div className="flex flex-col h-full bg-[#f3f2f1]">
            {/* Header */}
            <div className="bg-[#2e7d32] text-white px-4 py-2 flex items-center gap-2 flex-none">
              <LayoutTemplate size={16} />
              <span className="font-semibold text-sm">{formMeta?.name}</span>
              {isDirty && <span className="ml-2 text-xs bg-white/20 rounded px-2 py-0.5">Unsaved changes</span>}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center">
              {records.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <p className="mb-4">No records yet.</p>
                  <Button onClick={handleNewRecord} className="bg-[#2e7d32] hover:bg-[#1b5e20]">
                    <Plus size={16} className="mr-2" /> Add First Record
                  </Button>
                </div>
              ) : hasAbsoluteLayout ? (
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
                      ...formImages.map(i => i.y + i.height + 40)
                    ),
                    backgroundColor: formBgColor,
                  }}
                >
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
                          fontSize: ls.fontSize ?? 13, color: ls.color ?? '#333',
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
                <div className="bg-white rounded shadow-md w-full max-w-xl border border-gray-200">
                  <div className="bg-[#e8f5e9] border-b border-gray-200 px-4 py-2 text-sm font-medium text-[#2e7d32] rounded-t">
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
      </Shell>
    </>
  );
}
