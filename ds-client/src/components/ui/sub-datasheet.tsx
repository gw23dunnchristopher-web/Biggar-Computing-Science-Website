/**
 * SubDatasheet — Access-style nested grid showing related child records
 * underneath an expanded parent row.
 *
 * Given the current parent row and a child relationship, this component
 * fetches the child table's schema and the records that link back to the
 * parent (child.fkField === parent.pkValue), and displays them in a small
 * read-only grid. The linking field is hidden because the parent row already
 * makes it obvious.
 */
import React, { useEffect, useState } from 'react';

interface ChildField {
  id: number;
  name: string;
  fieldType: string;
  isPrimaryKey: boolean;
  sortOrder: number;
}

interface ChildRecord { id: number; data: Record<string, any>; }

interface Props {
  databaseId: number;
  childTableId: number;
  childTableName: string;
  childFieldId: number;            // FK field id in child table
  parentValue: any;                // value of parent.PK on this row
  onOpenChildTable?: (childTableId: number) => void;
}

export function SubDatasheet({
  databaseId, childTableId, childTableName, childFieldId, parentValue, onOpenChildTable,
}: Props) {
  const [childFieldName, setChildFieldName] = useState<string>('');
  const [fields, setFields] = useState<ChildField[]>([]);
  const [records, setRecords] = useState<ChildRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [tableRes, recordsRes] = await Promise.all([
          fetch(`/api/ds/databases/${databaseId}/tables/${childTableId}`, {
            headers: { 'Content-Type': 'application/json' },
          }),
          fetch(`/api/ds/databases/${databaseId}/tables/${childTableId}/records`, {
            headers: { 'Content-Type': 'application/json' },
          }),
        ]);
        if (!tableRes.ok || !recordsRes.ok) throw new Error('Failed to load child records');
        const tableData = await tableRes.json();
        const recordsData = await recordsRes.json();
        if (cancelled) return;
        const allFields = ((tableData?.fields ?? []) as ChildField[])
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder);
        const fkField = allFields.find(f => f.id === childFieldId);
        const fkName = fkField?.name ?? '';
        const all: ChildRecord[] = Array.isArray(recordsData) ? recordsData : [];
        // The child rows that link back to this parent. Compare values
        // loosely (number/string) since lookup values can be stored either
        // way depending on how the field was created.
        const parentStr = parentValue === null || parentValue === undefined ? '' : String(parentValue);
        const linked = fkName
          ? all.filter(r => {
              const v = r.data?.[fkName];
              if (v === null || v === undefined || v === '') return false;
              return String(v) === parentStr;
            })
          : [];
        setChildFieldName(fkName);
        setFields(allFields);
        setRecords(linked);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [databaseId, childTableId, childFieldName, parentValue]);

  // Hide the FK field — it's the same as the parent's PK by definition
  const visibleFields = fields.filter(f => f.name !== childFieldName);

  const renderCell = (val: any, fieldType: string): React.ReactNode => {
    if (val === null || val === undefined || val === '') return <span className="text-gray-300">—</span>;
    if (fieldType === 'boolean') {
      return <input type="checkbox" disabled checked={!!val} className="w-3.5 h-3.5 accent-[#7b1fa2]" />;
    }
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="bg-white border-t border-b border-gray-300 pl-8 pr-2 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide">
          Related {childTableName} ({records.length})
        </div>
        {onOpenChildTable && (
          <button
            onClick={() => onOpenChildTable(childTableId)}
            className="text-[11px] text-purple-700 hover:underline"
          >
            Open {childTableName} →
          </button>
        )}
      </div>
      {loading ? (
        <div className="text-xs text-gray-500 px-2 py-1.5">Loading…</div>
      ) : error ? (
        <div className="text-xs text-red-600 px-2 py-1.5">{error}</div>
      ) : records.length === 0 ? (
        <div className="text-xs text-gray-500 italic px-2 py-1.5">No related records.</div>
      ) : (
        <div className="overflow-auto border border-gray-300 rounded-sm bg-white">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr>
                {visibleFields.map(f => (
                  <th
                    key={f.id}
                    className="border-b border-r border-gray-300 bg-[#f3f2f1] px-2 py-1 text-left font-medium text-gray-700 whitespace-nowrap"
                  >
                    {f.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="hover:bg-purple-50/40">
                  {visibleFields.map(f => (
                    <td
                      key={f.id}
                      className="border-b border-r border-gray-200 px-2 py-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[260px]"
                      title={r.data?.[f.name] != null ? String(r.data[f.name]) : ''}
                    >
                      {renderCell(r.data?.[f.name], f.fieldType)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
