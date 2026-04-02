import { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Plus, Trash2, Key, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SchemaField {
  id: string;
  name: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
}

interface SchemaTable {
  id: string;
  name: string;
  fields: SchemaField[];
}

interface DatabaseSchema {
  tables: SchemaTable[];
}

interface DatabaseSchemaEditorProps {
  value?: DatabaseSchema;
  onChange: (schema: DatabaseSchema) => void;
  disabled?: boolean;
}

export function DatabaseSchemaEditor({ value, onChange, disabled }: DatabaseSchemaEditorProps) {
  const [tables, setTables] = useState<SchemaTable[]>(value?.tables || []);

  useEffect(() => {
    if (value?.tables) {
      setTables(value.tables);
    }
  }, [value]);

  const generateId = () => Math.random().toString(36).substring(2, 10);

  const updateTables = (newTables: SchemaTable[]) => {
    setTables(newTables);
    onChange({ tables: newTables });
  };

  const addTable = () => {
    const newTable: SchemaTable = {
      id: generateId(),
      name: "NewTable",
      fields: [
        { id: generateId(), name: "id", isPrimaryKey: true }
      ]
    };
    updateTables([...tables, newTable]);
  };

  const removeTable = (tableId: string) => {
    updateTables(tables.filter(t => t.id !== tableId));
  };

  const updateTableName = (tableId: string, name: string) => {
    updateTables(tables.map(t => t.id === tableId ? { ...t, name } : t));
  };

  const addField = (tableId: string) => {
    updateTables(tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          fields: [...t.fields, { id: generateId(), name: "newField" }]
        };
      }
      return t;
    }));
  };

  const removeField = (tableId: string, fieldId: string) => {
    updateTables(tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          fields: t.fields.filter(f => f.id !== fieldId)
        };
      }
      return t;
    }));
  };

  const updateFieldName = (tableId: string, fieldId: string, name: string) => {
    updateTables(tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          fields: t.fields.map(f => f.id === fieldId ? { ...f, name } : f)
        };
      }
      return t;
    }));
  };

  const togglePrimaryKey = (tableId: string, fieldId: string) => {
    updateTables(tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          fields: t.fields.map(f => f.id === fieldId ? { ...f, isPrimaryKey: !f.isPrimaryKey } : f)
        };
      }
      return t;
    }));
  };

  const toggleForeignKey = (tableId: string, fieldId: string) => {
    updateTables(tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          fields: t.fields.map(f => f.id === fieldId ? { ...f, isForeignKey: !f.isForeignKey } : f)
        };
      }
      return t;
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Database Schema Tables</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTable}
          disabled={disabled}
          data-testid="add-table-btn"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Table
        </Button>
      </div>

      {tables.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">
          No tables defined. Click "Add Table" to create a database table.
        </p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 min-w-[180px]"
              data-testid={`table-${table.id}`}
            >
              <div className="border-b border-neutral-300 dark:border-neutral-600 px-3 py-2 flex items-center gap-2 bg-neutral-50 dark:bg-neutral-700">
                <Input
                  value={table.name}
                  onChange={(e) => updateTableName(table.id, e.target.value)}
                  className="h-7 text-sm font-bold flex-1 min-w-0"
                  disabled={disabled}
                  data-testid={`table-name-${table.id}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTable(table.id)}
                  disabled={disabled}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  data-testid={`remove-table-${table.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="divide-y divide-neutral-200 dark:divide-neutral-600">
                {table.fields.map((field) => (
                  <div
                    key={field.id}
                    className="px-3 py-1.5 flex items-center gap-2"
                    data-testid={`field-${field.id}`}
                  >
                    <Input
                      value={field.name}
                      onChange={(e) => updateFieldName(table.id, field.id, e.target.value)}
                      className={cn(
                        "h-6 text-sm flex-1 min-w-0 border-0 bg-transparent p-0 focus:ring-0",
                        field.isPrimaryKey && "underline font-medium"
                      )}
                      disabled={disabled}
                      data-testid={`field-name-${field.id}`}
                    />
                    {field.isForeignKey && (
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">*</span>
                    )}
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePrimaryKey(table.id, field.id)}
                        disabled={disabled}
                        className={cn(
                          "h-6 w-6 p-0",
                          field.isPrimaryKey ? "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30" : "text-neutral-400"
                        )}
                        title="Primary Key (underlined)"
                        data-testid={`pk-toggle-${field.id}`}
                      >
                        <Key className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleForeignKey(table.id, field.id)}
                        disabled={disabled}
                        className={cn(
                          "h-6 w-6 p-0",
                          field.isForeignKey ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30" : "text-neutral-400"
                        )}
                        title="Foreign Key (*)"
                        data-testid={`fk-toggle-${field.id}`}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(table.id, field.id)}
                        disabled={disabled}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                        data-testid={`remove-field-${field.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-3 py-2 border-t border-neutral-200 dark:border-neutral-600">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addField(table.id)}
                  disabled={disabled}
                  className="h-6 text-xs w-full"
                  data-testid={`add-field-${table.id}`}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Field
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded border border-neutral-200 dark:border-neutral-700">
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          <Key className="w-3 h-3 inline mr-1 text-yellow-600" /> = Primary Key (underlined)
          <span className="mx-3">|</span>
          <Link2 className="w-3 h-3 inline mr-1 text-blue-600" /> = Foreign Key (*)
        </p>
      </div>
    </div>
  );
}

export function DatabaseSchemaDisplay({ schema, className }: { schema?: DatabaseSchema; className?: string }) {
  if (!schema?.tables || schema.tables.length === 0) {
    return null;
  }

  // Calculate uniform width based on number of tables
  const tableCount = schema.tables.length;
  const tableWidth = tableCount <= 3 ? "min-w-[140px] flex-1" : "min-w-[120px] w-[140px]";

  return (
    <div className={cn("flex flex-wrap gap-4 justify-center items-stretch", className)}>
      {schema.tables.map((table) => (
        <div
          key={table.id}
          className={cn("border border-neutral-400 dark:border-neutral-500 bg-white dark:bg-neutral-800 flex flex-col", tableWidth)}
          data-testid={`schema-table-${table.id}`}
        >
          {table.name && table.name.trim() !== "" && (
            <div className="border-b border-neutral-400 dark:border-neutral-500 px-4 py-1.5 text-sm font-bold text-neutral-500 dark:text-white bg-neutral-200 dark:bg-neutral-700">
              {table.name}
            </div>
          )}
          <div className="flex-1">
            {table.fields.map((field) => (
              <div
                key={field.id}
                className="px-4 py-0.5 text-sm"
                data-testid={`schema-field-${field.id}`}
              >
                <span className={field.isPrimaryKey ? "underline" : ""}>
                  {field.name}
                </span>
                {field.isForeignKey && <span className="text-neutral-600 dark:text-neutral-400">*</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
