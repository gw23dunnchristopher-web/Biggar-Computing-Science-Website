/**
 * CSV Import Modal — upload a CSV file and create a new table with its data.
 * Parses CSV in-browser, auto-detects types, lets user confirm field names/types,
 * then creates the table and bulk-inserts records via the API.
 */
import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

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

interface ColumnDef {
  name: string;
  fieldType: 'text' | 'number' | 'date' | 'boolean' | 'autonumber';
  isPrimaryKey: boolean;
  sample: string[];
}

interface ParsedCSV {
  tableName: string;
  columns: ColumnDef[];
  rows: Record<string, string>[];
  totalRows: number;
}

/** Detect field type from sample values */
function detectType(values: string[]): 'text' | 'number' | 'date' | 'boolean' {
  const nonEmpty = values.filter(v => v.trim() !== '');
  if (nonEmpty.length === 0) return 'text';

  const boolPat = /^(yes|no|true|false|1|0|y|n)$/i;
  if (nonEmpty.every(v => boolPat.test(v.trim()))) return 'boolean';

  if (nonEmpty.every(v => !isNaN(Number(v.trim())) && v.trim() !== '')) return 'number';

  const datePat = /^\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}$/;
  if (nonEmpty.every(v => datePat.test(v.trim()))) return 'date';

  return 'text';
}

/** Parse CSV text into headers + rows */
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

function csvToTableName(filename: string): string {
  return filename
    .replace(/\.csv$/i, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  databaseId: number;
  onSuccess: (tableName: string) => void;
}

type Step = 'upload' | 'preview' | 'importing' | 'done';

export function CSVImportModal({ open, onOpenChange, databaseId, onSuccess }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showPreviewRows, setShowPreviewRows] = useState(false);

  const reset = () => {
    setStep('upload');
    setParsed(null);
    setImporting(false);
    setImportProgress(0);
    setShowPreviewRows(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({ title: 'Please select a CSV file', variant: 'destructive' }); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) {
        toast({ title: 'CSV file appears to be empty', variant: 'destructive' }); return;
      }

      // Build column definitions
      const SAMPLE_SIZE = 20;
      const columns: ColumnDef[] = headers.map((h, i) => {
        const samples = rows.slice(0, SAMPLE_SIZE).map(r => r[i] ?? '');
        const type = detectType(samples);
        return {
          name: h || `Column${i + 1}`,
          fieldType: type,
          isPrimaryKey: false,
          sample: samples.filter(s => s.trim()).slice(0, 3),
        };
      });

      // Auto-mark first column as PK if it looks like an ID
      if (columns.length > 0) {
        const firstName = columns[0].name.toLowerCase();
        if (firstName === 'id' || firstName.endsWith('id') || firstName.endsWith('_id')) {
          columns[0].isPrimaryKey = true;
          if (columns[0].fieldType === 'number') columns[0].fieldType = 'autonumber';
        }
      }

      const objectRows = rows.map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h || `Column${i + 1}`] = row[i] ?? ''; });
        return obj;
      });

      setParsed({
        tableName: csvToTableName(file.name),
        columns,
        rows: objectRows,
        totalRows: rows.length,
      });
      setStep('preview');
    };
    reader.readAsText(file);
  }, [toast]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    setImportProgress(5);
    try {
      // 1. Create table
      const tableData = {
        name: parsed.tableName,
        fields: parsed.columns.map((col, i) => ({
          name: col.name,
          fieldType: col.fieldType,
          isPrimaryKey: col.isPrimaryKey,
          isRequired: col.isPrimaryKey,
          sortOrder: i,
        }))
      };
      const createdTable = await apiFetch(`/api/ds/databases/${databaseId}/tables`, {
        method: 'POST',
        body: JSON.stringify(tableData),
      });
      setImportProgress(20);

      // 2. Insert records in batches
      const nonAutoFields = parsed.columns.filter(c => c.fieldType !== 'autonumber');
      const BATCH = 50;
      const total = parsed.rows.length;
      for (let i = 0; i < total; i += BATCH) {
        const batch = parsed.rows.slice(i, i + BATCH);
        await Promise.all(batch.map(row => {
          const data: Record<string, any> = {};
          nonAutoFields.forEach(col => {
            let val: any = row[col.name] ?? '';
            if (col.fieldType === 'number') val = val !== '' ? Number(val) : null;
            else if (col.fieldType === 'boolean') {
              val = /^(yes|true|1|y)$/i.test(val) ? 'Yes' : 'No';
            }
            data[col.name] = val;
          });
          return apiFetch(`/api/ds/databases/${databaseId}/tables/${createdTable.id}/records`, {
            method: 'POST',
            body: JSON.stringify({ data }),
          });
        }));
        setImportProgress(20 + Math.round(((i + BATCH) / total) * 78));
      }

      setImportProgress(100);
      setStep('done');
      onSuccess(parsed.tableName);
    } catch (e: any) {
      toast({ title: `Import failed: ${e.message}`, variant: 'destructive' });
      setImporting(false);
    }
  };

  const updateColumn = (i: number, updates: Partial<ColumnDef>) => {
    setParsed(prev => {
      if (!prev) return prev;
      const cols = [...prev.columns];
      cols[i] = { ...cols[i], ...updates };
      return { ...prev, columns: cols };
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); } onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-[#C42B1C]" />
            Import CSV File
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to create a new table with all its data imported automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="py-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:border-[#C42B1C] hover:bg-red-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <Upload size={40} className="mx-auto mb-3 text-gray-400" />
              <p className="font-medium text-gray-700">Click to choose a CSV file, or drag and drop here</p>
              <p className="text-sm text-gray-400 mt-1">The first row should contain column names</p>
              <Button className="mt-4 bg-[#C42B1C]" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <Upload size={14} className="mr-1" /> Choose File
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        )}

        {/* Step: Preview / configure */}
        {step === 'preview' && parsed && (
          <div className="py-2 space-y-4">
            {/* Table name */}
            <div>
              <label className="text-sm font-medium block mb-1">Table Name</label>
              <Input
                value={parsed.tableName}
                onChange={e => setParsed(p => p ? { ...p, tableName: e.target.value } : p)}
                className="max-w-xs"
              />
            </div>

            {/* Column config */}
            <div>
              <p className="text-sm font-medium mb-2">Columns ({parsed.columns.length}) — {parsed.totalRows} rows to import</p>
              <div className="rounded border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-xs text-gray-600">Column Name</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-gray-600">Data Type</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-gray-600">Primary Key</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-gray-600">Sample Values</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.columns.map((col, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          <Input
                            value={col.name}
                            onChange={e => updateColumn(i, { name: e.target.value })}
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={col.fieldType}
                            onChange={e => updateColumn(i, { fieldType: e.target.value as any })}
                            className="text-xs border rounded px-2 py-1 w-full"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="boolean">Yes/No</option>
                            <option value="autonumber">AutoNumber</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={col.isPrimaryKey}
                            onChange={e => updateColumn(i, { isPrimaryKey: e.target.checked })}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {col.sample.slice(0, 2).join(', ')}
                          {col.sample.length > 2 && '…'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Data preview */}
            <div>
              <button
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                onClick={() => setShowPreviewRows(v => !v)}
              >
                {showPreviewRows ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showPreviewRows ? 'Hide' : 'Preview'} first 5 rows
              </button>
              {showPreviewRows && (
                <div className="mt-2 overflow-x-auto rounded border border-gray-200">
                  <table className="text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {parsed.columns.map(c => (
                          <th key={c.name} className="px-2 py-1 text-left border-r font-medium">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 5).map((row, ri) => (
                        <tr key={ri} className="border-t">
                          {parsed.columns.map(c => (
                            <td key={c.name} className="px-2 py-1 border-r text-gray-700 whitespace-nowrap max-w-xs truncate">
                              {row[c.name] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: importing */}
        {step === 'importing' && (
          <div className="py-8 text-center">
            <div className="w-12 h-12 border-4 border-[#C42B1C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-medium text-gray-700">Importing {parsed?.totalRows} rows…</p>
            <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-[#C42B1C] h-2 rounded-full transition-all"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{importProgress}%</p>
          </div>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <div className="py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Check size={28} className="text-green-600" />
            </div>
            <p className="font-semibold text-gray-800 text-lg">Import Complete!</p>
            <p className="text-sm text-gray-500 mt-1">
              Table <strong>{parsed?.tableName}</strong> created with {parsed?.totalRows} records.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => { reset(); }}>← Back</Button>
              <Button onClick={() => { setStep('importing'); handleImport(); }} disabled={!parsed?.tableName.trim()} className="bg-[#C42B1C]">
                <Upload size={14} className="mr-1" /> Import {parsed?.totalRows} Rows
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={() => { reset(); onOpenChange(false); }} className="bg-[#C42B1C]">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
