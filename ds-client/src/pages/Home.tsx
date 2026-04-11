import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useLocalUser } from '@/hooks/use-local-user';
import { useListDatabases, useCreateDatabase, useCreateTable, getListDatabasesQueryKey } from '@/api';
import { format } from 'date-fns';
import { Database, PlusCircle, DatabaseBackup, Trash2, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { SandboxesPage } from './SandboxesPage';

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers as any) }
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

export function Home() {
  const userId = useLocalUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'databases' | 'sandboxes'>('databases');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDbName, setNewDbName] = useState('Database1');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; dbId: number | null; dbName: string }>({ open: false, dbId: null, dbName: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: databases, isLoading } = useListDatabases({ userId: userId || '' }, {
    query: { enabled: !!userId }
  });

  const createDb = useCreateDatabase();
  const createTable = useCreateTable();

  const handleCreate = async () => {
    if (!userId || !newDbName.trim()) return;
    try {
      const db = await createDb.mutateAsync({ data: { name: newDbName, userId } });
      const tbl = await createTable.mutateAsync({
        databaseId: db.id,
        data: {
          name: 'Table1',
          fields: [
            { name: 'ID', fieldType: 'autonumber', isPrimaryKey: true, isRequired: true, sortOrder: 0 },
            { name: 'Field1', fieldType: 'text', isPrimaryKey: false, isRequired: false, sortOrder: 1 },
          ],
        },
      });
      toast({ title: 'Database created successfully' });
      setLocation(`/databases/${db.id}/tables/${tbl.id}/data`);
    } catch (e) {
      toast({ title: 'Failed to create database', variant: 'destructive' });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, dbId: number, dbName: string) => {
    e.stopPropagation();
    setDeleteConfirm({ open: true, dbId, dbName });
  };

  const doDeleteDatabase = async () => {
    if (!deleteConfirm.dbId) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/ds/databases/${deleteConfirm.dbId}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: getListDatabasesQueryKey({ userId: userId || '' }) });
      toast({ title: `"${deleteConfirm.dbName}" deleted` });
      setDeleteConfirm({ open: false, dbId: null, dbName: '' });
    } catch {
      toast({ title: 'Failed to delete database', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!userId || isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#f3f3f3]">Loading Workspace...</div>;
  }

  return (
    <div className="min-h-screen w-full bg-[#f3f2f1] flex flex-col overflow-hidden text-sm">
      {/* Header */}
      <div className="h-12 bg-[#C42B1C] flex items-center px-6 text-white font-semibold text-lg shadow-md z-10 flex-shrink-0">
        <DatabaseBackup className="w-6 h-6 mr-3" />
        Access Learning Tool
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 flex items-end gap-1 shadow-sm">
        <button
          onClick={() => setTab('databases')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'databases'
              ? 'border-[#C42B1C] text-[#C42B1C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Database size={15} />
          My Databases
        </button>
        <button
          onClick={() => setTab('sandboxes')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'sandboxes'
              ? 'border-[#C42B1C] text-[#C42B1C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FlaskConical size={15} />
          Student Sandboxes
        </button>
      </div>

      {/* Content */}
      {tab === 'sandboxes' ? (
        <SandboxesPage />
      ) : (
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-8 border-b border-gray-300 pb-4">
              <div>
                <h1 className="text-3xl font-light text-gray-800 tracking-tight">Good evening</h1>
                <p className="text-gray-500 mt-1">Select a database to open or create a new one.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="hover:shadow-lg cursor-pointer border-dashed border-2 border-red-300 bg-red-50/50 flex flex-col items-center justify-center h-48 rounded-xl text-red-600 hover:bg-red-100 hover:border-red-400 transition-all duration-300 group"
              >
                <PlusCircle className="w-12 h-12 mb-4 text-red-400 group-hover:text-red-600 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-semibold text-base">Blank Database</span>
              </button>

              {databases?.map(db => (
                <div
                  key={db.id}
                  className="relative hover:shadow-xl transition-all duration-300 h-48 flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 text-left hover:-translate-y-1 group cursor-pointer"
                  onClick={() => setLocation(`/databases/${db.id}`)}
                >
                  <div className="flex-1 bg-gradient-to-br from-[#C42B1C] to-red-300 opacity-90 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors"></div>
                    <img src={`${import.meta.env.BASE_URL}images/access-hero.png`} alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60" />
                    <Database className="absolute bottom-4 left-4 w-8 h-8 text-white drop-shadow-md" />
                    <button
                      onClick={e => handleDeleteClick(e, db.id, db.name)}
                      className="absolute top-2 right-2 p-1.5 rounded bg-black/20 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600/80 transition-all"
                      title="Delete database"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 border-t bg-white">
                    <h3 className="font-bold text-gray-800 truncate">{db.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">Updated {format(new Date(db.updatedAt), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Database Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Blank Database</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">File Name</label>
            <Input
              value={newDbName}
              onChange={e => setNewDbName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="border-gray-300 focus-visible:ring-[#C42B1C]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createDb.isPending} className="bg-[#C42B1C] hover:bg-[#9B2118]">
              {createDb.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Database Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onOpenChange={open => !open && setDeleteConfirm({ open: false, dbId: null, dbName: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700">Delete Database</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>"{deleteConfirm.dbName}"</strong>?
              This will delete all tables, records, queries, forms, and reports inside it.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, dbId: null, dbName: '' })} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={doDeleteDatabase}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete Database'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
