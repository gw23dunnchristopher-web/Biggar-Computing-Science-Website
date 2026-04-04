import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Database, Table as TableType, UpdateFieldRequest, useGetTable, useUpdateTable, getGetTableQueryKey, getListRecordsQueryKey } from '@/api';
import { Shell } from '@/components/layout/Shell';
import { Sidebar } from '@/components/layout/Sidebar';
import { Ribbon, RibbonGroup, RibbonButton, RibbonDropdownButton, RibbonContextSection } from '@/components/layout/Ribbon';
import { CreateTabContent, ExternalDataTabContent, DatabaseToolsTabContent } from '@/components/layout/AccessRibbonTabs';
import { DesignGrid } from '@/components/ui/design-grid';
import { Save, Grid3X3, Key, PlusSquare, MinusSquare, Eye, List, Settings2, AlertTriangle } from 'lucide-react';
import { DesignViewIcon } from '@/components/ui/design-view-icon';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(BASE + path, { ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

const TYPE_LABELS: Record<string, string> = {
  text: 'Short Text', longtext: 'Long Text', number: 'Number', currency: 'Currency',
  date: 'Date/Time', boolean: 'Yes/No', autonumber: 'AutoNumber',
  hyperlink: 'Hyperlink', attachment: 'Attachment', calculated: 'Calculated', lookup: 'Lookup',
};

const NUMERIC = new Set(['number', 'currency']);
const TEXTUAL = new Set(['text', 'longtext', 'hyperlink']);

/** Returns true when data can be automatically preserved / converted */
function isCompatibleConversion(from: string, to: string): boolean {
  if (from === to) return true;
  if (NUMERIC.has(from) && NUMERIC.has(to)) return true;   // number ↔ currency
  if (TEXTUAL.has(from) && TEXTUAL.has(to)) return true;   // text ↔ longtext ↔ hyperlink
  if (NUMERIC.has(from) && TEXTUAL.has(to)) return true;   // number → text
  if (TEXTUAL.has(from) && NUMERIC.has(to)) return true;   // text → number (best-effort)
  if (TEXTUAL.has(from) && to === 'date') return true;     // text → date (best-effort)
  if (from === 'boolean' && TEXTUAL.has(to)) return true;  // boolean → text
  if (from === 'boolean' && NUMERIC.has(to)) return true;  // boolean → number
  if (from === 'date' && TEXTUAL.has(to)) return true;     // date → text
  return false;
}

/** Convert a stored value from one type to another, returning null on failure */
function convertValue(value: any, from: string, to: string): any {
  if (value === null || value === undefined || value === '') return null;
  if (NUMERIC.has(from) && NUMERIC.has(to)) return value;           // number ↔ currency: no change
  if (TEXTUAL.has(from) && TEXTUAL.has(to)) return String(value);   // text variants: keep string
  if (NUMERIC.has(from) && TEXTUAL.has(to)) return String(Number(value)); // number → text
  if (TEXTUAL.has(from) && NUMERIC.has(to)) {                       // text → number
    const n = Number(value);
    return isNaN(n) ? null : n;
  }
  if (TEXTUAL.has(from) && to === 'date') {                         // text → date
    const d = new Date(String(value));
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }
  if (from === 'boolean' && TEXTUAL.has(to)) return value ? 'Yes' : 'No';
  if (from === 'boolean' && NUMERIC.has(to)) return value ? 1 : 0;
  if (from === 'date' && TEXTUAL.has(to)) return String(value).split('T')[0];
  return null;
}

interface ItemRow { id: number; name: string; databaseId: number; }
interface TypeChangePending { fieldName: string; oldType: string; newType: string; affectedCount: number; }

interface Props {
  databaseId: number;
  tableId: number;
  db: Database;
  tables: TableType[];
  onDeleteTable: (id: number) => void;
  queries?: ItemRow[];
  forms?: ItemRow[];
  reports?: ItemRow[];
  onDeleteQuery?: (id: number) => void;
  onDeleteForm?: (id: number) => void;
  onDeleteReport?: (id: number) => void;
  onRefresh?: () => void;
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

export function TableDesignView({ databaseId, tableId, db, tables, onDeleteTable, queries = [], forms = [], reports = [], onDeleteQuery, onDeleteForm, onDeleteReport, onRefresh, onCreateTable, onCreateQuery, onQueryWizard, onCreateForm, onCreateBlankForm, onCreateAutoForm, onCreateReport, onCreateBlankReport, onCreateAutoReport, onShare, onSettings }: Props) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: table, isLoading } = useGetTable(databaseId, tableId);
  const updateTable = useUpdateTable();

  const [fields, setFields] = useState<UpdateFieldRequest[]>([]);
  const [tableName, setTableName] = useState('');
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);

  // ── Type-change warning ──
  const [typeChangeDialog, setTypeChangeDialog] = useState<TypeChangePending | null>(null);
  const [typeChangeBusy, setTypeChangeBusy] = useState(false);
  const typeChangeResolveRef = useRef<((ok: boolean) => void) | null>(null);

  const onBeforeTypeChange = useCallback(async (fieldIdx: number, oldType: string, newType: string): Promise<boolean> => {
    const fieldName = fields[fieldIdx]?.name ?? '';

    // Fetch records that have data for this field
    let recs: { id: number; data: Record<string, any> }[] = [];
    try {
      const data = await apiFetch(`/api/databases/${databaseId}/tables/${tableId}/records`);
      recs = data.records ?? data ?? [];
    } catch { /* skip if can't fetch */ }

    const affected = recs.filter(r => {
      const v = r.data[fieldName];
      return v !== null && v !== undefined && v !== '';
    });
    if (affected.length === 0) {
      // No data to convert — just persist the field type change immediately
      try {
        const updatedFields = fields.map((f, i) =>
          i === fieldIdx ? { ...f, fieldType: newType as any } : f
        );
        await apiFetch(`/api/databases/${databaseId}/tables/${tableId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: tableName, fields: updatedFields }),
        });
        queryClient.invalidateQueries({ queryKey: getGetTableQueryKey(databaseId, tableId) });
      } catch { /* best-effort */ }
      return true;
    }

    if (isCompatibleConversion(oldType, newType)) {
      // Auto-convert silently — no dialog, no data loss
      setTypeChangeBusy(true);
      try {
        // 1. Convert existing record values
        for (const rec of affected) {
          const original = rec.data[fieldName];
          const converted = convertValue(original, oldType, newType);
          await apiFetch(`/api/databases/${databaseId}/tables/${tableId}/records/${rec.id}`, {
            method: 'PUT',
            body: JSON.stringify({ data: { ...rec.data, [fieldName]: converted } }),
          });
        }
        // 2. Immediately persist the field type change in the table definition
        //    so the user doesn't have to click Save separately
        const updatedFields = fields.map((f, i) =>
          i === fieldIdx ? { ...f, fieldType: newType as any } : f
        );
        await apiFetch(`/api/databases/${databaseId}/tables/${tableId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: tableName, fields: updatedFields }),
        });
        // 3. Refresh caches so both views update immediately
        queryClient.invalidateQueries({ queryKey: getGetTableQueryKey(databaseId, tableId) });
        queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey(databaseId, tableId) });
      } catch { /* best-effort */ }
      setTypeChangeBusy(false);
      return true;
    }

    // Incompatible conversion: show warning
    return new Promise<boolean>(resolve => {
      typeChangeResolveRef.current = resolve;
      setTypeChangeDialog({ fieldName, oldType, newType, affectedCount: affected.length });
    });
  }, [databaseId, tableId, fields]);

  const handleTypeChangeConfirm = async () => {
    if (!typeChangeDialog) return;
    setTypeChangeBusy(true);
    try {
      const data = await apiFetch(`/api/databases/${databaseId}/tables/${tableId}/records`);
      const recs: { id: number; data: Record<string, any> }[] = data.records ?? data ?? [];
      for (const rec of recs) {
        const v = rec.data[typeChangeDialog.fieldName];
        if (v !== null && v !== undefined && v !== '') {
          await apiFetch(`/api/databases/${databaseId}/tables/${tableId}/records/${rec.id}`, {
            method: 'PUT',
            body: JSON.stringify({ data: { ...rec.data, [typeChangeDialog.fieldName]: null } }),
          });
        }
      }
    } catch { /* ignore errors */ }
    setTypeChangeBusy(false);
    setTypeChangeDialog(null);
    typeChangeResolveRef.current?.(true);
    typeChangeResolveRef.current = null;
  };

  const handleTypeChangeCancel = () => {
    setTypeChangeDialog(null);
    typeChangeResolveRef.current?.(false);
    typeChangeResolveRef.current = null;
  };

  useEffect(() => {
    if (table) {
      setFields(table.fields.map(f => ({ ...f })));
      setTableName(table.name);
    }
  }, [table]);

  const handleSave = async () => {
    if (!tableName.trim()) return toast({ title: 'Table name required', variant: 'destructive' });
    if (fields.length === 0) return toast({ title: 'At least one field required', variant: 'destructive' });
    try {
      await updateTable.mutateAsync({ databaseId, tableId, data: { name: tableName, fields } });
      toast({ title: 'Table saved' });
      queryClient.invalidateQueries({ queryKey: getGetTableQueryKey(databaseId, tableId) });
      queryClient.invalidateQueries({ queryKey: ['/api/databases', databaseId, 'tables'] });
    } catch {
      toast({ title: 'Failed to save table', variant: 'destructive' });
    }
  };

  const handleInsertRow = () => {
    setFields(prev => [...prev, {
      name: `Field${prev.length + 1}`,
      fieldType: 'text',
      isPrimaryKey: false,
      isRequired: false,
      sortOrder: prev.length
    }]);
  };

  const handleDeleteRow = () => {
    const nonPK = fields.filter(f => !f.isPrimaryKey);
    if (nonPK.length === 0) return toast({ title: 'Cannot delete the only field', variant: 'destructive' });
    setFields(prev => prev.slice(0, -1));
  };

  const handleSetPrimaryKey = () => {
    if (selectedFieldIndex === null) return;
    setFields(prev => prev.map((f, i) => ({ ...f, isPrimaryKey: i === selectedFieldIndex })));
    toast({ title: `"${fields[selectedFieldIndex]?.name || 'Field'}" set as Primary Key` });
  };

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
    color: '#c55a11',
    defaultTab: 'Table Design',
    tabs: [
      {
        name: 'Table Design',
        content: (
          <>
            <RibbonGroup name="Tools">
              <RibbonButton
                icon={<Key size={22} />}
                label="Primary Key"
                active={selectedFieldIndex !== null && fields[selectedFieldIndex]?.isPrimaryKey}
                onClick={handleSetPrimaryKey}
                disabled={selectedFieldIndex === null || fields[selectedFieldIndex]?.isPrimaryKey}
              />
              <RibbonButton icon={<Save size={22} />} label="Save" onClick={handleSave} disabled={updateTable.isPending} />
            </RibbonGroup>
            <RibbonGroup name="Field Rows">
              <RibbonButton icon={<PlusSquare size={22} />} label="Insert Rows" onClick={handleInsertRow} />
              <RibbonButton icon={<MinusSquare size={22} />} label="Delete Rows" onClick={handleDeleteRow} />
            </RibbonGroup>
            <RibbonGroup name="Show/Hide">
              <RibbonButton icon={<Eye size={22} />} label="Property Sheet" disabled />
              <RibbonButton icon={<List size={22} />} label="Indexes" disabled />
            </RibbonGroup>
          </>
        )
      }
    ]
  };

  const ribbon = (
    <Ribbon
      title={db.name}
      homeLink={`/databases/${databaseId}`}
      allDatabasesLink="/"
      contextSection={contextSection}
      pinnedContent={
        <RibbonGroup name="View">
          <RibbonDropdownButton icon={<DesignViewIcon size={22} />} label="Design">
            <RibbonButton icon={<Grid3X3 size={22} />} label="Datasheet" onClick={() => setLocation(`/databases/${databaseId}/tables/${tableId}/data`)} />
            <RibbonButton icon={<DesignViewIcon size={22} />} label="Design" active />
          </RibbonDropdownButton>
        </RibbonGroup>
      }
      tabs={[
        {
          name: 'Home',
          content: (
            <RibbonGroup name="Action">
              <RibbonButton icon={<Save size={22} />} label="Save" onClick={handleSave} disabled={updateTable.isPending} />
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

  if (isLoading) return <Shell title={db.name} ribbon={ribbon}>Loading...</Shell>;

  const statusBar = (
    <div className="flex items-center justify-between w-full h-full px-2">
      <span className="text-gray-600 text-[11px]">Design View</span>
      <div className="flex items-center gap-1">
        <button
          title="Datasheet View"
          onClick={() => setLocation(`/databases/${databaseId}/tables/${tableId}/data`)}
          className="p-0.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
        >
          <Grid3X3 size={13} />
        </button>
        <button
          title="Design View"
          className="p-0.5 rounded bg-[#C42B1C] text-white"
        >
          <Settings2 size={13} />
        </button>
      </div>
    </div>
  );

  return (
    <Shell
      title={db.name}
      ribbon={ribbon}
      statusBar={statusBar}
      sidebar={
        <Sidebar
          tables={tables}
          databaseId={databaseId}
          onDeleteTable={onDeleteTable}
          queries={queries}
          onDeleteQuery={onDeleteQuery}
          forms={forms}
          onDeleteForm={onDeleteForm}
          reports={reports}
          onDeleteReport={onDeleteReport}
          onRefresh={onRefresh}
        />
      }
    >
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center h-7 bg-[#f3f2f1] border-b border-gray-300 px-2 shadow-sm z-10 flex-none gap-3">
          <span className="font-semibold text-gray-600 text-sm px-2 border-b-2 border-[#c55a11] pb-0.5">{tableName || 'Table Design'}</span>
        </div>
        <div className="p-3 bg-gray-100 border-b border-gray-300 flex items-center shadow-sm z-10">
          <span className="text-gray-600 font-semibold mr-4 text-sm">Table Name:</span>
          <Input value={tableName} onChange={e => setTableName(e.target.value)} className="w-64 h-8 bg-white" />
        </div>
        <div className="flex-1 overflow-hidden">
          <DesignGrid
            fields={fields}
            onChange={setFields}
            selectedIndex={selectedFieldIndex}
            onSelectedIndexChange={setSelectedFieldIndex}
            tables={tables.map((t: any) => ({ id: t.id, name: t.name, fields: t.fields ?? [] }))}
            databaseId={databaseId}
            onBeforeTypeChange={onBeforeTypeChange}
          />
        </div>
      </div>

      {/* ── Data Type Change Warning Dialog ── */}
      {typeChangeDialog && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40">
          <div className="bg-white border border-gray-300 shadow-2xl w-[460px] rounded-sm" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
            <div className="flex items-center gap-2 bg-[#c55a11] text-white px-4 py-2.5 rounded-t-sm">
              <AlertTriangle size={16} />
              <span className="font-semibold text-sm">Microsoft Access</span>
            </div>
            <div className="p-5">
              <div className="flex gap-3 items-start mb-4">
                <AlertTriangle className="text-yellow-500 flex-none mt-0.5" size={22} />
                <div className="text-sm text-gray-800 leading-relaxed">
                  <p className="mb-2">
                    You are changing the data type of the <strong>"{typeChangeDialog.fieldName}"</strong> field
                    from <strong>{TYPE_LABELS[typeChangeDialog.oldType] ?? typeChangeDialog.oldType}</strong> to{' '}
                    <strong>{TYPE_LABELS[typeChangeDialog.newType] ?? typeChangeDialog.newType}</strong>.
                  </p>
                  <p className="mb-2 text-red-700 font-medium">
                    {typeChangeDialog.affectedCount} record{typeChangeDialog.affectedCount !== 1 ? 's' : ''} contain
                    data that may not be valid for the new type and will be <strong>deleted</strong>.
                  </p>
                  <p>Do you want to continue anyway?</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleTypeChangeCancel}
                  disabled={typeChangeBusy}
                  className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  No
                </button>
                <button
                  onClick={handleTypeChangeConfirm}
                  disabled={typeChangeBusy}
                  className="px-4 py-1.5 text-sm bg-[#c55a11] text-white rounded hover:bg-[#a04a0d] disabled:opacity-50 flex items-center gap-1.5"
                >
                  {typeChangeBusy ? <span className="animate-spin">⏳</span> : null}
                  Yes, Delete Data &amp; Change Type
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
