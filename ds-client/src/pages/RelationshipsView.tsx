/**
 * RelationshipsView — Visual ER-style diagram showing table relationships.
 * Teachers create and manage FK links between tables.
 * Students can see the diagram (read-only in student mode).
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Sidebar } from '@/components/layout/Sidebar';
import { Ribbon, RibbonGroup, RibbonButton, RibbonContextSection } from '@/components/layout/Ribbon';
import { CreateTabContent, ExternalDataTabContent, DatabaseToolsTabContent } from '@/components/layout/AccessRibbonTabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { GitBranch, Plus, Trash2, Link2, Info, KeyRound, Hash, Type, Calendar, ToggleLeft } from 'lucide-react';
import type { Database, Table } from '@/api';
import type { QueryRow } from '@/components/layout/Sidebar';


async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers as any) }
  });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `API error ${res.status}`);
  return json;
}

interface Field { id: number; name: string; fieldType: string; isPrimaryKey: boolean; sortOrder: number; }
interface TableWithFields { id: number; name: string; fields: Field[]; }
interface Relationship { id: number; fromTableId: number; fromFieldId: number; toTableId: number; toFieldId: number; relationshipType: string; }
interface BoxPos { x: number; y: number; }

const FIELD_ICONS: Record<string, React.ReactNode> = {
  text: <Type size={11} className="text-red-500" />,
  number: <Hash size={11} className="text-green-500" />,
  autonumber: <Hash size={11} className="text-gray-400" />,
  date: <Calendar size={11} className="text-orange-500" />,
  boolean: <ToggleLeft size={11} className="text-purple-500" />,
};

const REL_TYPE_LABELS: Record<string, string> = {
  'one-to-many': '1 : ∞',
  'one-to-one': '1 : 1',
  'many-to-many': '∞ : ∞',
};

interface Props {
  databaseId: number;
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
  onSelectTable?: (id: number) => void;
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
  onImportCSV?: () => void;
  onExportData?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  onOpenSql?: () => void;
  onOpenRelationships?: () => void;
  onCompact?: () => void;
  onAnalyse?: () => void;
  onDocumenter?: () => void;
  onObjectDependencies?: () => void;
}

const TABLE_BOX_WIDTH = 180;
const TABLE_HEADER_H = 32;
const TABLE_FIELD_H = 24;

export function RelationshipsView({
  databaseId, db, tables, queries = [], forms = [], reports = [],
  onDeleteTable, onDeleteQuery, onDeleteForm, onDeleteReport, onRefresh,
  isStudentMode, onSelectTable, onCreateTable, onCreateQuery, onQueryWizard, onCreateSqlQuery,
  onCreateForm, onCreateBlankForm, onCreateAutoForm,
  onCreateReport, onCreateBlankReport, onCreateAutoReport,
  onImportCSV, onExportData, onShare, onSettings, onOpenSql, onOpenRelationships,
  onCompact, onAnalyse, onDocumenter, onObjectDependencies,
}: Props) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [schema, setSchema] = useState<TableWithFields[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [boxPositions, setBoxPositions] = useState<Record<number, BoxPos>>({});
  const [selectedRel, setSelectedRel] = useState<number | null>(null);

  // Add relationship dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({ fromTableId: '', fromFieldId: '', toTableId: '', toFieldId: '', relationshipType: 'one-to-many' });

  // Drag state
  const dragRef = useRef<{ tableId: number; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const loadSchema = useCallback(async () => {
    const ts = await Promise.all(
      (tables || []).map(async t => {
        const tableData = await apiFetch(`/api/ds/databases/${databaseId}/tables/${t.id}`).catch(() => null);
        const fields: Field[] = tableData?.fields || [];
        return { id: t.id, name: t.name, fields: fields.sort((a: Field, b: Field) => a.sortOrder - b.sortOrder) };
      })
    );
    setSchema(ts);

    // Auto-layout: grid
    const positions: Record<number, BoxPos> = {};
    const cols = Math.max(1, Math.ceil(Math.sqrt(ts.length)));
    ts.forEach((t, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions[t.id] = { x: 40 + col * 240, y: 40 + row * 280 };
    });
    setBoxPositions(prev => {
      const merged: Record<number, BoxPos> = { ...positions };
      Object.keys(prev).forEach(k => { if (merged[+k]) merged[+k] = prev[+k]; });
      return merged;
    });
  }, [databaseId, tables]);

  const loadRelationships = useCallback(async () => {
    const data = await apiFetch(`/api/ds/databases/${databaseId}/relationships`).catch(() => []);
    setRelationships(data || []);
  }, [databaseId]);

  useEffect(() => { loadSchema(); loadRelationships(); }, [loadSchema, loadRelationships]);

  const handleAddRelationship = async () => {
    if (!addForm.fromTableId || !addForm.fromFieldId || !addForm.toTableId || !addForm.toFieldId) {
      toast({ title: 'All fields are required', variant: 'destructive' }); return;
    }
    try {
      await apiFetch(`/api/ds/databases/${databaseId}/relationships`, {
        method: 'POST',
        body: JSON.stringify({
          fromTableId: parseInt(addForm.fromTableId),
          fromFieldId: parseInt(addForm.fromFieldId),
          toTableId: parseInt(addForm.toTableId),
          toFieldId: parseInt(addForm.toFieldId),
          relationshipType: addForm.relationshipType,
        })
      });
      await loadRelationships();
      setAddDialogOpen(false);
      setAddForm({ fromTableId: '', fromFieldId: '', toTableId: '', toFieldId: '', relationshipType: 'one-to-many' });
      toast({ title: 'Relationship added' });
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteRelationship = async (id: number) => {
    try {
      await apiFetch(`/api/ds/databases/${databaseId}/relationships/${id}`, { method: 'DELETE' });
      await loadRelationships();
      setSelectedRel(null);
    } catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  // Dragging table boxes
  const startDrag = (e: React.MouseEvent, tableId: number) => {
    e.preventDefault();
    const pos = boxPositions[tableId] || { x: 0, y: 0 };
    dragRef.current = { tableId, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setBoxPositions(prev => ({
        ...prev,
        [dragRef.current!.tableId]: {
          x: Math.max(0, dragRef.current!.origX + dx),
          y: Math.max(0, dragRef.current!.origY + dy),
        }
      }));
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Compute SVG relationship lines
  const getFieldY = (table: TableWithFields, fieldId: number, boxY: number): number => {
    const idx = table.fields.findIndex(f => f.id === fieldId);
    if (idx === -1) return boxY + TABLE_HEADER_H + 12;
    return boxY + TABLE_HEADER_H + idx * TABLE_FIELD_H + TABLE_FIELD_H / 2;
  };

  const getTableHeight = (t: TableWithFields) => TABLE_HEADER_H + t.fields.length * TABLE_FIELD_H + 8;

  // Compute canvas size
  const canvasW = Math.max(900, ...Object.values(boxPositions).map(p => p.x + TABLE_BOX_WIDTH + 60));
  const canvasH = Math.max(600, ...schema.map(t => (boxPositions[t.id]?.y || 0) + getTableHeight(t) + 60));

  const fromTableFields = schema.find(t => t.id === parseInt(addForm.fromTableId))?.fields || [];
  const toTableFields = schema.find(t => t.id === parseInt(addForm.toTableId))?.fields || [];

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
    onImportCSV,
    onExportData,
    onShare,
    onSettings,
    onOpenSql,
    onOpenRelationships,
    onCompact,
    onAnalyse,
    onDocumenter,
    onObjectDependencies,
  };

  const contextSection: RibbonContextSection = {
    color: '#7b1fa2',
    defaultTab: 'Relationships',
    tabs: [{
      name: 'Relationships',
      content: (
        <RibbonGroup name="Relationships">
          {!isStudentMode && (
            <RibbonButton
              icon={<Plus size={22} />}
              label="Add Relationship"
              onClick={() => setAddDialogOpen(true)}
            />
          )}
          {selectedRel !== null && !isStudentMode && (
            <RibbonButton
              icon={<Trash2 size={22} />}
              label="Delete"
              onClick={() => handleDeleteRelationship(selectedRel)}
            />
          )}
        </RibbonGroup>
      )
    }]
  };

  const sidebarEl = (
    <Sidebar
      tables={tables || []}
      databaseId={databaseId}
      onDeleteTable={onDeleteTable}
      onSelectTable={onSelectTable}
      queries={queries}
      onDeleteQuery={onDeleteQuery}
      forms={forms}
      onDeleteForm={onDeleteForm}
      reports={reports}
      onDeleteReport={onDeleteReport}
      onRefresh={onRefresh}
      isStudentMode={isStudentMode}
    />
  );

  const ribbonEl = (
    <Ribbon
      title={db.name}
      allDatabasesLink={isStudentMode ? undefined : '/'}
      contextSection={contextSection}
      tabs={[
        { name: 'Home', content: <RibbonGroup name="View"><RibbonButton icon={<GitBranch size={22} />} label="Relationships" active /></RibbonGroup> },
        { name: 'Create', content: <CreateTabContent {...commonTabProps} /> },
        { name: 'External Data', content: <ExternalDataTabContent {...commonTabProps} /> },
        { name: 'Database Tools', content: <DatabaseToolsTabContent {...commonTabProps} /> },
      ]}
    />
  );

  return (
    <Shell title={db.name} ribbon={ribbonEl} sidebar={sidebarEl}>
      <div className="flex flex-col h-full bg-[#f3f2f1] overflow-hidden">
        {/* Hint bar */}
        <div className="flex items-center gap-2 px-4 py-1.5 bg-[#7b1fa2] text-white text-xs">
          <GitBranch size={13} />
          <span className="font-medium">Relationships</span>
          <span className="text-purple-200 ml-1">· Drag table boxes to rearrange · Click a link to select it</span>
          {!isStudentMode && <span className="text-purple-200">· Use "Add Relationship" in the ribbon to connect tables</span>}
          {schema.length === 0 && <span className="text-purple-300 ml-auto">No tables yet — create tables first</span>}
          <span className="ml-auto text-purple-200">{relationships.length} relationship{relationships.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto" ref={canvasRef}>
          <div className="relative" style={{ width: canvasW, height: canvasH, minWidth: '100%', minHeight: '100%' }}>
            {/* SVG relationship lines */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={canvasW}
              height={canvasH}
              style={{ zIndex: 1 }}
            >
              <defs>
                <marker id="arrow-many" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#7b1fa2" />
                </marker>
                <marker id="arrow-one" markerWidth="8" markerHeight="8" refX="0" refY="3" orient="auto">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#7b1fa2" strokeWidth="2" />
                </marker>
                <marker id="arrow-many-sel" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#e91e63" />
                </marker>
              </defs>

              {relationships.map(rel => {
                const fromTable = schema.find(t => t.id === rel.fromTableId);
                const toTable = schema.find(t => t.id === rel.toTableId);
                if (!fromTable || !toTable) return null;

                const fromPos = boxPositions[fromTable.id];
                const toPos = boxPositions[toTable.id];
                if (!fromPos || !toPos) return null;

                const fromY = getFieldY(fromTable, rel.fromFieldId, fromPos.y);
                const toY = getFieldY(toTable, rel.toFieldId, toPos.y);

                const fromRight = fromPos.x + TABLE_BOX_WIDTH;
                const toLeft = toPos.x;
                const fromLeft = fromPos.x;
                const toRight = toPos.x + TABLE_BOX_WIDTH;

                let x1: number, x2: number, cx1: number, cx2: number;
                if (fromRight < toLeft) {
                  x1 = fromRight; x2 = toLeft; cx1 = x1 + 60; cx2 = x2 - 60;
                } else if (toRight < fromLeft) {
                  x1 = fromLeft; x2 = toRight; cx1 = x1 - 60; cx2 = x2 + 60;
                } else {
                  x1 = fromRight; x2 = toRight; cx1 = x1 + 60; cx2 = x2 + 60;
                }

                const isSelected = selectedRel === rel.id;
                const color = isSelected ? '#e91e63' : '#7b1fa2';

                const relType = rel.relationshipType || 'one-to-many';
                const fromSymbol = relType === 'many-to-many' ? '∞' : '1';
                const toSymbol = relType === 'one-to-one' ? '1' : relType === 'many-to-many' ? '∞' : '∞';

                const fromLabelX = x1 + (x1 < x2 ? 8 : -8);
                const toLabelX = x2 + (x1 < x2 ? -8 : 8);

                return (
                  <g key={rel.id} className="cursor-pointer" style={{ pointerEvents: 'all' }}
                    onClick={() => setSelectedRel(isSelected ? null : rel.id)}>
                    <path
                      d={`M ${x1} ${fromY} C ${cx1} ${fromY}, ${cx2} ${toY}, ${x2} ${toY}`}
                      fill="none" stroke="transparent" strokeWidth="16"
                    />
                    <path
                      d={`M ${x1} ${fromY} C ${cx1} ${fromY}, ${cx2} ${toY}, ${x2} ${toY}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text
                      x={fromLabelX}
                      y={fromY - 6}
                      textAnchor={x1 < x2 ? 'start' : 'end'}
                      fontSize="13"
                      fill={color}
                      fontWeight="700"
                      className="select-none"
                    >
                      {fromSymbol}
                    </text>
                    <text
                      x={toLabelX}
                      y={toY - 6}
                      textAnchor={x1 < x2 ? 'end' : 'start'}
                      fontSize="13"
                      fill={color}
                      fontWeight="700"
                      className="select-none"
                    >
                      {toSymbol}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Table boxes */}
            {schema.map(table => {
              const pos = boxPositions[table.id] || { x: 40, y: 40 };
              const tableH = getTableHeight(table);
              return (
                <div
                  key={table.id}
                  className="absolute select-none rounded shadow-md border border-gray-300 bg-white overflow-hidden"
                  style={{ left: pos.x, top: pos.y, width: TABLE_BOX_WIDTH, zIndex: 2 }}
                >
                  {/* Header */}
                  <div
                    className="flex items-center gap-1.5 px-2 cursor-grab active:cursor-grabbing bg-[#7b1fa2] text-white"
                    style={{ height: TABLE_HEADER_H }}
                    onMouseDown={e => startDrag(e, table.id)}
                  >
                    <GitBranch size={12} className="flex-shrink-0" />
                    <span className="text-xs font-bold truncate">{table.name}</span>
                  </div>
                  {/* Fields */}
                  {table.fields.map(field => (
                    <div
                      key={field.id}
                      className="flex items-center gap-1.5 px-2 border-b border-gray-100 last:border-0"
                      style={{ height: TABLE_FIELD_H }}
                    >
                      {field.isPrimaryKey
                        ? <KeyRound size={10} className="text-yellow-500 flex-shrink-0" />
                        : (FIELD_ICONS[field.fieldType] ?? <Type size={10} className="text-gray-400" />)
                      }
                      <span className="text-xs text-gray-700 truncate flex-1">{field.name}</span>
                      <span className="text-[9px] text-gray-400 flex-shrink-0">{field.fieldType}</span>
                    </div>
                  ))}
                  {table.fields.length === 0 && (
                    <div className="px-2 py-1 text-[10px] text-gray-400 italic">No fields</div>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {schema.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <GitBranch size={40} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No tables yet. Create tables to see the diagram.</p>
                </div>
              </div>
            )}

            {/* Selected relationship info panel */}
            {selectedRel !== null && (() => {
              const rel = relationships.find(r => r.id === selectedRel);
              if (!rel) return null;
              const fromTable = schema.find(t => t.id === rel.fromTableId);
              const toTable = schema.find(t => t.id === rel.toTableId);
              const fromField = fromTable?.fields.find(f => f.id === rel.fromFieldId);
              const toField = toTable?.fields.find(f => f.id === rel.toFieldId);
              return (
                <div className="absolute bottom-4 right-4 bg-white border border-purple-200 rounded-lg shadow-lg p-3 min-w-48" style={{ zIndex: 10 }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Link2 size={13} className="text-purple-700" />
                    <span className="text-xs font-semibold text-purple-700">Relationship</span>
                    {!isStudentMode && (
                      <button
                        onClick={() => handleDeleteRelationship(rel.id)}
                        className="ml-auto text-red-500 hover:text-red-700"
                        title="Delete relationship"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-gray-700 space-y-1">
                    <div><span className="font-medium">{fromTable?.name}</span>.{fromField?.name}</div>
                    <div className="text-purple-600 text-center font-bold">{REL_TYPE_LABELS[rel.relationshipType]}</div>
                    <div><span className="font-medium">{toTable?.name}</span>.{toField?.name}</div>
                  </div>
                  <div className="mt-1.5 text-[10px] text-gray-400 text-center">{rel.relationshipType.replace(/-/g, ' ')}</div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Add Relationship Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 size={18} className="text-purple-700" /> Add Relationship
            </DialogTitle>
            <DialogDescription>Define how two tables are related by linking their fields.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* From side */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Primary Table (One side)</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Table</label>
                  <select
                    value={addForm.fromTableId}
                    onChange={e => setAddForm(f => ({ ...f, fromTableId: e.target.value, fromFieldId: '' }))}
                    className="w-full text-sm border rounded px-2 py-1.5"
                  >
                    <option value="">— select —</option>
                    {schema.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Field (FK source)</label>
                  <select
                    value={addForm.fromFieldId}
                    onChange={e => setAddForm(f => ({ ...f, fromFieldId: e.target.value }))}
                    className="w-full text-sm border rounded px-2 py-1.5"
                    disabled={!addForm.fromTableId}
                  >
                    <option value="">— select —</option>
                    {fromTableFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <select
                value={addForm.relationshipType}
                onChange={e => setAddForm(f => ({ ...f, relationshipType: e.target.value }))}
                className="text-xs border rounded px-2 py-1 text-purple-700 font-semibold"
              >
                <option value="one-to-many">One-to-Many (1:∞)</option>
                <option value="one-to-one">One-to-One (1:1)</option>
                <option value="many-to-many">Many-to-Many (∞:∞)</option>
              </select>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* To side */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Related Table (Many side)</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Table</label>
                  <select
                    value={addForm.toTableId}
                    onChange={e => setAddForm(f => ({ ...f, toTableId: e.target.value, toFieldId: '' }))}
                    className="w-full text-sm border rounded px-2 py-1.5"
                  >
                    <option value="">— select —</option>
                    {schema.filter(t => t.id !== parseInt(addForm.fromTableId)).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Field (FK target)</label>
                  <select
                    value={addForm.toFieldId}
                    onChange={e => setAddForm(f => ({ ...f, toFieldId: e.target.value }))}
                    className="w-full text-sm border rounded px-2 py-1.5"
                    disabled={!addForm.toTableId}
                  >
                    <option value="">— select —</option>
                    {toTableFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRelationship} className="bg-[#7b1fa2] hover:bg-[#6a1b9a]">
              <Link2 size={14} className="mr-1" /> Add Relationship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
