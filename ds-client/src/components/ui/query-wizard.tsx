/**
 * Simple Query Wizard — step-by-step query builder for students.
 * Simple step-through query wizard.
 */
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { ChevronRight, ChevronLeft, ArrowRight, ArrowLeft, ChevronsRight, ChevronsLeft, Check } from 'lucide-react';

interface Field { id: number; name: string; fieldType: string; sortOrder: number; isPrimaryKey: boolean; }
interface TableInfo { id: number; name: string; fields: Field[]; }

interface SelectedField { tableId: number; tableName: string; fieldName: string; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: { id: number; name: string }[];
  databaseId: number;
  onFinish: (name: string, definition: any, openMode: 'view' | 'modify') => void;
  apiFetch: (path: string, opts?: RequestInit) => Promise<any>;
}

export function QueryWizard({ open, onOpenChange, tables, databaseId, onFinish, apiFetch }: Props) {
  const [step, setStep] = useState(1);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [tableDetails, setTableDetails] = useState<Record<number, TableInfo>>({});
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
  const [queryName, setQueryName] = useState('Query1');
  const [openMode, setOpenMode] = useState<'view' | 'modify'>('view');
  const [highlightAvail, setHighlightAvail] = useState<string | null>(null);
  const [highlightSel, setHighlightSel] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedTableId(null);
      setSelectedFields([]);
      setQueryName('Query1');
      setHighlightAvail(null);
      setHighlightSel(null);
    }
  }, [open]);

  useEffect(() => {
    if (!selectedTableId) return setAvailableFields([]);
    if (tableDetails[selectedTableId]) {
      setAvailableFields([...tableDetails[selectedTableId].fields].sort((a, b) => a.sortOrder - b.sortOrder));
    } else {
      apiFetch(`/api/ds/databases/${databaseId}/tables/${selectedTableId}`)
        .then((td: TableInfo) => {
          setTableDetails(prev => ({ ...prev, [td.id]: td }));
          setAvailableFields([...td.fields].sort((a, b) => a.sortOrder - b.sortOrder));
        })
        .catch(() => {});
    }
  }, [selectedTableId]);

  const currentTable = tables.find(t => t.id === selectedTableId);

  const handleAddField = (field: Field) => {
    if (!currentTable) return;
    if (selectedFields.find(sf => sf.tableId === selectedTableId && sf.fieldName === field.name)) return;
    setSelectedFields(prev => [...prev, { tableId: selectedTableId!, tableName: currentTable.name, fieldName: field.name }]);
    setHighlightAvail(null);
  };

  const handleAddAll = () => {
    if (!currentTable) return;
    availableFields.forEach(f => {
      if (!selectedFields.find(sf => sf.tableId === selectedTableId && sf.fieldName === f.name)) {
        setSelectedFields(prev => [...prev, { tableId: selectedTableId!, tableName: currentTable.name, fieldName: f.name }]);
      }
    });
  };

  const handleRemoveField = (idx: number) => {
    setSelectedFields(prev => prev.filter((_, i) => i !== idx));
    setHighlightSel(null);
  };

  const handleRemoveAll = () => {
    setSelectedFields([]);
    setHighlightSel(null);
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    setSelectedFields(prev => { const a = [...prev]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a; });
    setHighlightSel(idx - 1);
  };

  const handleMoveDown = (idx: number) => {
    if (idx >= selectedFields.length - 1) return;
    setSelectedFields(prev => { const a = [...prev]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return a; });
    setHighlightSel(idx + 1);
  };

  const handleFinish = () => {
    const definition = {
      tables: Array.from(new Set(selectedFields.map(sf => sf.tableId))).map(tid => ({
        tableId: tid,
        tableName: selectedFields.find(sf => sf.tableId === tid)!.tableName
      })),
      columns: selectedFields.map(sf => ({
        tableId: sf.tableId,
        tableName: sf.tableName,
        fieldName: sf.fieldName,
        alias: '',
        show: true,
        sort: null,
        criteria: ''
      }))
    };
    onFinish(queryName.trim() || 'Query1', definition, openMode);
    onOpenChange(false);
  };

  const canNext = step === 1 ? selectedFields.length > 0 : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <span className="text-[#C42B1C]">Simple Query Wizard</span>
            <span className="text-gray-400 text-sm font-normal">— Step {step} of 2</span>
          </DialogTitle>
          {step === 1 && (
            <DialogDescription>
              Select the table you want to query and choose which fields to include.
            </DialogDescription>
          )}
          {step === 2 && (
            <DialogDescription>
              Give your query a name and choose how to open it when finished.
            </DialogDescription>
          )}
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-2">
            {/* Table selector */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Tables/Queries:</label>
              <select
                value={selectedTableId ?? ''}
                onChange={e => { setSelectedTableId(Number(e.target.value)); setHighlightAvail(null); }}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#C42B1C] bg-white"
              >
                <option value="" disabled>— Select a table —</option>
                {tables.map(t => <option key={t.id} value={t.id}>Table: {t.name}</option>)}
              </select>
            </div>

            {/* Field picker */}
            <div className="flex gap-3 items-center">
              {/* Available fields */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Available Fields:</label>
                <div className="border border-gray-300 rounded h-48 overflow-y-auto bg-white">
                  {availableFields.map(f => (
                    <div
                      key={f.name}
                      onDoubleClick={() => handleAddField(f)}
                      onClick={() => setHighlightAvail(f.name)}
                      className={`px-3 py-1 text-sm cursor-default select-none hover:bg-red-50 ${highlightAvail === f.name ? 'bg-[#C42B1C] text-white' : ''} ${selectedFields.find(sf => sf.tableId === selectedTableId && sf.fieldName === f.name) ? 'text-gray-300' : ''}`}
                    >
                      {f.isPrimaryKey && '🔑 '}{f.name}
                    </div>
                  ))}
                  {!selectedTableId && <div className="text-xs text-gray-400 italic p-3">Select a table first</div>}
                  {selectedTableId && availableFields.length === 0 && <div className="text-xs text-gray-400 italic p-3">No fields</div>}
                </div>
              </div>

              {/* Transfer buttons */}
              <div className="flex flex-col gap-1.5 items-center flex-none">
                <button onClick={() => highlightAvail && handleAddField(availableFields.find(f => f.name === highlightAvail)!)} disabled={!highlightAvail} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed text-gray-600" title="Add selected field">
                  <ArrowRight size={14} />
                </button>
                <button onClick={handleAddAll} disabled={!selectedTableId} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed text-gray-600" title="Add all fields">
                  <ChevronsRight size={14} />
                </button>
                <button onClick={() => highlightSel !== null && handleRemoveField(highlightSel)} disabled={highlightSel === null} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed text-gray-600" title="Remove selected field">
                  <ArrowLeft size={14} />
                </button>
                <button onClick={handleRemoveAll} disabled={selectedFields.length === 0} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed text-gray-600" title="Remove all fields">
                  <ChevronsLeft size={14} />
                </button>
                <div className="w-px h-2" />
                <button onClick={() => highlightSel !== null && handleMoveUp(highlightSel)} disabled={highlightSel === null || highlightSel === 0} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed text-gray-600" title="Move up">
                  <ChevronLeft size={14} className="rotate-90" />
                </button>
                <button onClick={() => highlightSel !== null && handleMoveDown(highlightSel)} disabled={highlightSel === null || highlightSel >= selectedFields.length - 1} className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed text-gray-600" title="Move down">
                  <ChevronRight size={14} className="rotate-90" />
                </button>
              </div>

              {/* Selected fields */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Selected Fields:</label>
                <div className="border border-gray-300 rounded h-48 overflow-y-auto bg-white">
                  {selectedFields.map((sf, i) => (
                    <div
                      key={i}
                      onDoubleClick={() => handleRemoveField(i)}
                      onClick={() => setHighlightSel(i)}
                      className={`px-3 py-1 text-sm cursor-default select-none hover:bg-red-50 ${highlightSel === i ? 'bg-[#C42B1C] text-white' : ''}`}
                    >
                      {sf.fieldName} <span className={`text-xs ${highlightSel === i ? 'text-red-200' : 'text-gray-400'}`}>({sf.tableName})</span>
                    </div>
                  ))}
                  {selectedFields.length === 0 && <div className="text-xs text-gray-400 italic p-3">No fields selected yet</div>}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400">Tip: Double-click a field to move it. Use the arrow buttons to reorder selected fields.</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">What do you want to name your query?</label>
              <Input
                value={queryName}
                onChange={e => setQueryName(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleFinish()}
                className="max-w-xs"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Do you want to open the query or modify its design?</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="openMode" value="view" checked={openMode === 'view'} onChange={() => setOpenMode('view')} className="accent-[#C42B1C]" />
                  <span className="text-sm text-gray-700">Open the query to view information</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="openMode" value="modify" checked={openMode === 'modify'} onChange={() => setOpenMode('modify')} className="accent-[#C42B1C]" />
                  <span className="text-sm text-gray-700">Modify the query design</span>
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-600">
              <strong>Summary:</strong> {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} from {Array.from(new Set(selectedFields.map(sf => sf.tableName))).join(', ') || '—'}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 border-t pt-4 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
          )}
          {step < 2 ? (
            <Button disabled={!canNext} onClick={() => setStep(s => s + 1)} className="bg-[#C42B1C] hover:bg-[#9B2118]">
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="bg-[#C42B1C] hover:bg-[#9B2118]">
              <Check size={16} className="mr-1" /> Finish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
