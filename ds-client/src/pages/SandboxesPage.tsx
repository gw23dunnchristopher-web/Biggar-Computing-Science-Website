import React, { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useLocalUser } from '@/hooks/use-local-user';
import { useToast } from '@/hooks/use-toast';
import {
  PlusCircle, Code2, Copy, Check, Pencil, Trash2,
  FlaskConical, ExternalLink, Info, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Sandbox {
  id: number;
  name: string;
  userId: string;
  taskDescription: string | null;
  token: string;
  embedUrl: string;
  previewUrl?: string;
  iframeCode: string;
  createdAt: string;
  updatedAt: string;
}

async function sandboxFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers as any) },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

export function SandboxesPage() {
  const userId = useLocalUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null; name: string }>({ open: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  const { data: sandboxes = [], isLoading } = useQuery<Sandbox[]>({
    queryKey: ['/api/ds/sandboxes', userId],
    queryFn: () => sandboxFetch(`/api/ds/sandboxes?userId=${encodeURIComponent(userId || '')}`),
    enabled: !!userId,
  });

  const handleCreate = async () => {
    if (!userId || !newName.trim()) return;
    setCreating(true);
    try {
      const sb = await sandboxFetch('/api/ds/sandboxes', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), userId, taskDescription: newTaskDesc.trim() || null }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ds/sandboxes', userId] });
      toast({ title: `"${newName.trim()}" sandbox created` });
      setCreateOpen(false);
      setNewName('');
      setNewTaskDesc('');
      setLocation(`/databases/${sb.id}`);
    } catch {
      toast({ title: 'Failed to create sandbox', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      await sandboxFetch(`/api/ds/sandboxes/${deleteConfirm.id}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ['/api/ds/sandboxes', userId] });
      toast({ title: `"${deleteConfirm.name}" deleted` });
      setDeleteConfirm({ open: false, id: null, name: '' });
    } catch {
      toast({ title: 'Failed to delete sandbox', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  if (!userId || isLoading) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">Loading sandboxes…</div>;
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b border-gray-300 pb-4">
          <div>
            <h1 className="text-2xl font-light text-gray-800 tracking-tight flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-[#C42B1C]" />
              Student Sandboxes
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Create database templates for students. Each student gets their own copy — embed the code into any lesson page.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#C42B1C] hover:bg-[#9B2118] flex items-center gap-2"
          >
            <PlusCircle size={16} />
            New Sandbox
          </Button>
        </div>

        {sandboxes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FlaskConical className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-1">No sandboxes yet</h3>
            <p className="text-sm text-gray-400 max-w-sm">
              Create a sandbox to set up a database task for your students. You'll get an embed code to paste into any lesson page.
            </p>
            <Button onClick={() => setCreateOpen(true)} className="mt-6 bg-[#C42B1C] hover:bg-[#9B2118]">
              <PlusCircle size={15} className="mr-1.5" />
              Create your first sandbox
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sandboxes.map(sb => (
              <div key={sb.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                    <FlaskConical size={18} className="text-[#C42B1C]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{sb.name}</h3>
                    {sb.taskDescription ? (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        <span className="font-medium text-amber-700">Task: </span>{sb.taskDescription}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5 italic">No task description set</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === sb.id ? null : sb.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                      title="Show embed code"
                    >
                      <Code2 size={13} />
                      Embed Code
                    </button>
                    <button
                      onClick={() => window.open(sb.previewUrl || sb.embedUrl, '_blank')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                      title="Preview student view"
                    >
                      <ExternalLink size={13} />
                      Preview
                    </button>
                    <button
                      onClick={() => setLocation(`/databases/${sb.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C42B1C] hover:bg-[#9B2118] text-white transition-colors"
                      title="Edit database structure"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ open: true, id: sb.id, name: sb.name })}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete sandbox"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {expandedId === sb.id && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                      <Info size={12} />
                      Paste the iframe code below into any HTML page on the BHS Computing Science site to embed this sandbox for students.
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Shareable Link</span>
                        <CopyButton text={sb.embedUrl} label="Copy Link" />
                      </div>
                      <input
                        readOnly
                        value={sb.embedUrl}
                        className="w-full text-xs font-mono bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 select-all focus:outline-none"
                        onClick={e => e.currentTarget.select()}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Iframe Embed Code</span>
                        <CopyButton text={sb.iframeCode} label="Copy Code" />
                      </div>
                      <textarea
                        readOnly
                        value={sb.iframeCode}
                        rows={3}
                        className="w-full text-xs font-mono bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 resize-none focus:outline-none select-all"
                        onClick={e => e.currentTarget.select()}
                      />
                    </div>

                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      <BookOpen size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">
                        Copy the iframe code above and paste it into the relevant lesson page HTML on the BHS Computing Science site.
                        Each student who opens the page will automatically get their own private copy of this database to work in.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Sandbox Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical size={18} className="text-[#C42B1C]" />
              New Student Sandbox
            </DialogTitle>
            <DialogDescription>
              Set up a database template for your students. You'll be taken to the database editor to add tables and data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Sandbox Name</label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Library Database Task"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleCreate()}
                className="focus-visible:ring-[#C42B1C]"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Task Description
                <span className="text-gray-400 font-normal text-xs ml-1">(one bullet per requirement — shown to students &amp; used for AI marking)</span>
              </label>
              <textarea
                value={newTaskDesc}
                onFocus={() => { if (!newTaskDesc) setNewTaskDesc('• '); }}
                onChange={e => setNewTaskDesc(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const ta = e.currentTarget;
                    const { selectionStart: s, selectionEnd: en, value: v } = ta;
                    const next = v.slice(0, s) + '\n• ' + v.slice(en);
                    setNewTaskDesc(next);
                    requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 3; });
                  }
                }}
                rows={5}
                placeholder={'• Create a Books table with fields: ISBN, Title, Author, Genre\n• Add at least 5 valid book records\n• Make ISBN the primary key'}
                className="w-full border border-gray-200 rounded-md text-sm p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#C42B1C] placeholder:text-gray-300 font-mono leading-6"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="bg-[#C42B1C] hover:bg-[#9B2118]"
            >
              {creating ? 'Creating…' : 'Create & Open Editor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <Dialog open={deleteConfirm.open} onOpenChange={open => !open && setDeleteConfirm({ open: false, id: null, name: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700">Delete Sandbox</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>"{deleteConfirm.name}"</strong>, all its tables and data, and the student embed link.
              Any students who already have a session will lose access. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete Sandbox'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
