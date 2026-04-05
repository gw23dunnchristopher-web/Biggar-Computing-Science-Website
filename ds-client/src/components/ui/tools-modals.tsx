/**
 * Database Tools modals: Analyse Table, Database Documenter,
 * Object Dependencies, Export Data (CSV download).
 * All purely client-side — data is fetched from the existing APIs.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './dialog';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart2, FileText, GitBranch, Download, Printer,
  Table2, Hash, Type, Calendar, ToggleLeft, KeyRound,
  CheckCircle2, AlertCircle, Loader2, ChevronRight
} from 'lucide-react';

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

function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function rowsToCSV(columns: string[], rows: Record<string, any>[]): string {
  const escape = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map(escape).join(',');
  const body = rows.map(r => columns.map(c => escape(r[c])).join(',')).join('\n');
  return header + '\n' + body;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <Type size={12} className="text-red-500" />,
  number: <Hash size={12} className="text-green-500" />,
  autonumber: <Hash size={12} className="text-gray-400" />,
  date: <Calendar size={12} className="text-orange-500" />,
  boolean: <ToggleLeft size={12} className="text-purple-500" />,
};

// ─────────────────────────────────────────────────────
// Analyse Table Modal
// ─────────────────────────────────────────────────────
interface AnalyseData {
  tables: {
    id: number; name: string; rowCount: number; fieldCount: number;
    fieldTypeCounts: Record<string, number>;
    fieldStats: { name: string; fieldType: string; isPrimaryKey: boolean; emptyCount: number; fillRate: number }[];
  }[];
  totalTables: number; totalRecords: number;
}

export function AnalyseModal({ open, onOpenChange, databaseId }: { open: boolean; onOpenChange: (v: boolean) => void; databaseId: number }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyseData | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiFetch(`/api/ds/databases/${databaseId}/analyse`).then(d => { setData(d); setExpanded(new Set(d?.tables?.map((t: any) => t.id) ?? [])); }).finally(() => setLoading(false));
  }, [open, databaseId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BarChart2 size={18} className="text-red-600" /> Analyse Table</DialogTitle>
          <DialogDescription>Statistics and health overview for each table in this database.</DialogDescription>
        </DialogHeader>
        {loading && <div className="py-8 flex justify-center"><Loader2 size={24} className="animate-spin text-red-500" /></div>}
        {data && !loading && (
          <div className="space-y-3 py-2">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Tables', value: data.totalTables, color: 'bg-red-50 text-red-700' },
                { label: 'Total Records', value: data.totalRecords, color: 'bg-green-50 text-green-700' },
                { label: 'Avg Records/Table', value: data.totalTables > 0 ? Math.round(data.totalRecords / data.totalTables) : 0, color: 'bg-purple-50 text-purple-700' },
              ].map(s => (
                <div key={s.label} className={`rounded-lg p-3 ${s.color}`}>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Per-table breakdown */}
            {data.tables.map(table => (
              <div key={table.id} className="border rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-left"
                  onClick={() => setExpanded(prev => { const s = new Set(prev); s.has(table.id) ? s.delete(table.id) : s.add(table.id); return s; })}
                >
                  <ChevronRight size={14} className={`text-gray-400 transition-transform ${expanded.has(table.id) ? 'rotate-90' : ''}`} />
                  <Table2 size={14} className="text-[#C42B1C]" />
                  <span className="font-medium text-sm">{table.name}</span>
                  <span className="ml-auto text-xs text-gray-500">{table.rowCount} rows · {table.fieldCount} fields</span>
                </button>
                {expanded.has(table.id) && (
                  <div className="border-t">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-1.5 text-left font-medium text-gray-600">Field</th>
                          <th className="px-3 py-1.5 text-left font-medium text-gray-600">Type</th>
                          <th className="px-3 py-1.5 text-left font-medium text-gray-600">PK</th>
                          <th className="px-3 py-1.5 text-left font-medium text-gray-600">Empty</th>
                          <th className="px-3 py-1.5 text-left font-medium text-gray-600">Fill Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.fieldStats.map(f => (
                          <tr key={f.name} className="border-b last:border-0">
                            <td className="px-3 py-1.5 flex items-center gap-1.5">
                              {f.isPrimaryKey ? <KeyRound size={10} className="text-yellow-500" /> : (TYPE_ICONS[f.fieldType] ?? <Type size={10} />)}
                              {f.name}
                            </td>
                            <td className="px-3 py-1.5 text-gray-500">{f.fieldType}</td>
                            <td className="px-3 py-1.5">{f.isPrimaryKey ? '✓' : ''}</td>
                            <td className="px-3 py-1.5 text-gray-500">{f.emptyCount}</td>
                            <td className="px-3 py-1.5">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-16">
                                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${f.fillRate}%` }} />
                                </div>
                                <span className="text-gray-600">{f.fillRate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
            {data.tables.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No tables found.</p>}
          </div>
        )}
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────
// Database Documenter Modal
// ─────────────────────────────────────────────────────
interface SchemaField { name: string; fieldType: string; isPrimaryKey: boolean; }
interface SchemaTable { id: number; name: string; fields: SchemaField[]; }

export function DocumenterModal({ open, onOpenChange, databaseId, dbName }: {
  open: boolean; onOpenChange: (v: boolean) => void; databaseId: number; dbName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<SchemaTable[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiFetch(`/api/ds/databases/${databaseId}/sql/schema`).then(d => setSchema(d || [])).finally(() => setLoading(false));
  }, [open, databaseId]);

  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText size={18} className="text-amber-600" /> Database Documenter</DialogTitle>
          <DialogDescription>Full schema documentation for <strong>{dbName}</strong>. Use Print to save as PDF.</DialogDescription>
        </DialogHeader>
        {loading && <div className="py-8 flex justify-center"><Loader2 size={24} className="animate-spin text-amber-500" /></div>}
        {!loading && (
          <div className="space-y-4 py-2" id="schema-doc">
            <div className="border rounded-lg p-4 bg-amber-50">
              <h2 className="text-lg font-bold text-amber-900">{dbName}</h2>
              <p className="text-sm text-amber-700 mt-1">{schema.length} table{schema.length !== 1 ? 's' : ''}</p>
            </div>
            {schema.map((table, ti) => (
              <div key={table.id} className="border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-[#C42B1C] text-white flex items-center gap-2">
                  <span className="text-xs text-red-200 w-5">{ti + 1}.</span>
                  <Table2 size={14} />
                  <span className="font-semibold">{table.name}</span>
                  <span className="ml-auto text-xs text-red-200">{table.fields.length} field{table.fields.length !== 1 ? 's' : ''}</span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">#</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Field Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Data Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Primary Key</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.fields.map((f, fi) => (
                      <tr key={f.name} className="border-b last:border-0">
                        <td className="px-4 py-2 text-gray-400 text-xs">{fi + 1}</td>
                        <td className="px-4 py-2 font-medium flex items-center gap-1.5">
                          {f.isPrimaryKey ? <KeyRound size={11} className="text-yellow-500" /> : (TYPE_ICONS[f.fieldType] ?? <Type size={11} />)}
                          {f.name}
                        </td>
                        <td className="px-4 py-2 text-gray-600 capitalize">{f.fieldType}</td>
                        <td className="px-4 py-2">{f.isPrimaryKey ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-gray-400">No</span>}</td>
                        <td className="px-4 py-2 text-gray-400 text-xs italic">
                          {f.fieldType === 'autonumber' ? 'Auto-increments; do not enter manually' :
                           f.fieldType === 'boolean' ? 'Yes or No value' :
                           f.fieldType === 'date' ? 'Date value (YYYY-MM-DD)' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {schema.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No tables to document.</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handlePrint}><Printer size={14} className="mr-1" /> Print / Save PDF</Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────
// Object Dependencies Modal
// ─────────────────────────────────────────────────────
interface DepTable { id: number; name: string; }
interface DepObject { id: number; name: string; type: 'query' | 'form' | 'report'; tables: number[]; }

export function DependenciesModal({ open, onOpenChange, databaseId, tables, queries, forms, reports }: {
  open: boolean; onOpenChange: (v: boolean) => void; databaseId: number;
  tables: DepTable[];
  queries: { id: number; name: string; definition?: any }[];
  forms: { id: number; name: string; definition?: any }[];
  reports: { id: number; name: string; definition?: any }[];
}) {
  const objects: DepObject[] = [
    ...queries.map(q => ({
      id: q.id, name: q.name, type: 'query' as const,
      tables: (q.definition?.tables || []).map((t: any) => typeof t === 'object' ? t.id : t)
    })),
    ...forms.map(f => ({
      id: f.id, name: f.name, type: 'form' as const,
      tables: f.definition?.tableId ? [f.definition.tableId] : []
    })),
    ...reports.map(r => ({
      id: r.id, name: r.name, type: 'report' as const,
      tables: r.definition?.tableId ? [r.definition.tableId] : []
    })),
  ];

  const tableMap = new Map(tables.map(t => [t.id, t.name]));

  const TYPE_COLORS = {
    query: 'bg-purple-100 text-purple-700',
    form: 'bg-green-100 text-green-700',
    report: 'bg-amber-100 text-amber-700',
  };
  const TYPE_LABELS = { query: 'Query', form: 'Form', report: 'Report' };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[75vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><GitBranch size={18} className="text-purple-600" /> Object Dependencies</DialogTitle>
          <DialogDescription>Shows which tables are used by each query, form, and report.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {objects.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No queries, forms, or reports yet.</p>
          )}
          {objects.map(obj => (
            <div key={`${obj.type}-${obj.id}`} className="border rounded-lg p-3 flex items-start gap-3">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${TYPE_COLORS[obj.type]}`}>
                {TYPE_LABELS[obj.type]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800">{obj.name}</div>
                {obj.tables.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {obj.tables.map(tid => (
                      <span key={tid} className="text-[11px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200">
                        {tableMap.get(tid) || `Table ${tid}`}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">No table references detected</p>
                )}
              </div>
            </div>
          ))}
        </div>
        {objects.length > 0 && (
          <div className="border-t pt-3 mt-1">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Tables referenced by objects</p>
            <div className="space-y-1">
              {tables.map(t => {
                const users = objects.filter(o => o.tables.includes(t.id));
                return (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <Table2 size={12} className="text-[#C42B1C] flex-shrink-0" />
                    <span className="font-medium text-gray-700">{t.name}</span>
                    <span className="text-gray-400 text-xs">← used by {users.length} object{users.length !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <DialogFooter><Button onClick={() => onOpenChange(false)}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────
// Export Data Modal (CSV download)
// ─────────────────────────────────────────────────────
export function ExportDataModal({ open, onOpenChange, databaseId, tables }: {
  open: boolean; onOpenChange: (v: boolean) => void; databaseId: number;
  tables: { id: number; name: string }[];
}) {
  const { toast } = useToast();
  const [selectedTableId, setSelectedTableId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && tables.length > 0) setSelectedTableId(String(tables[0].id));
  }, [open, tables]);

  const handleExport = async () => {
    if (!selectedTableId) return;
    setLoading(true);
    try {
      const tableId = parseInt(selectedTableId);
      const tableObj = tables.find(t => t.id === tableId);

      // Fetch fields to get column order
      const tableData = await apiFetch(`/api/ds/databases/${databaseId}/tables/${tableId}`);
      const fields: { name: string }[] = tableData?.fields || [];
      const columns = fields.map(f => f.name);

      // Fetch records
      const records = await apiFetch(`/api/ds/databases/${databaseId}/tables/${tableId}/records`);
      const rows: Record<string, any>[] = (records || []).map((r: any) => r.data || r);

      const csv = rowsToCSV(columns, rows);
      downloadCSV(`${tableObj?.name || 'export'}.csv`, csv);
      toast({ title: `Exported "${tableObj?.name}" as CSV (${rows.length} rows)` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: `Export failed: ${e.message}`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Download size={18} className="text-green-600" /> Export Data as CSV</DialogTitle>
          <DialogDescription>Choose a table to export all its records to a CSV file.</DialogDescription>
        </DialogHeader>
        <div className="py-3">
          <label className="text-sm font-medium block mb-2">Table to export</label>
          <select
            value={selectedTableId}
            onChange={e => setSelectedTableId(e.target.value)}
            className="w-full text-sm border rounded px-3 py-2"
          >
            {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {tables.length === 0 && <p className="text-xs text-gray-400 mt-1">No tables available.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={!selectedTableId || loading} className="bg-green-700 hover:bg-green-800">
            {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Download size={14} className="mr-1" />}
            Download CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
