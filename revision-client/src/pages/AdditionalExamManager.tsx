import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, FileText, Pencil } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { useToast } from "@/hooks/use-toast";
import { useQuestions } from "@/lib/QuestionContext";

interface AdditionalExam {
  id: string;
  title: string;
  isPublished: boolean;
  createdAt: string;
}

export default function AdditionalExamManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { questions } = useQuestions();
  const [exams, setExams] = useState<AdditionalExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<AdditionalExam | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editTitle, setEditTitle] = useState("");

  const token = localStorage.getItem("teacher_token");

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/additional-exams");
      if (res.ok) setExams(await res.json());
    } catch {
      toast({ title: "Failed to load exams", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { setLocation("/teacher/login"); return; }
    fetchExams();
  }, []);

  const getQuestionCount = (examId: string) => {
    return questions.filter((q: any) => q.additionalExamId === examId).length;
  };

  const getTotalMarks = (examId: string) => {
    return questions
      .filter((q: any) => q.additionalExamId === examId)
      .reduce((sum, q) => {
        let total = 0;
        for (const sq of q.subQuestions) {
          if (sq.subParts && sq.subParts.length > 0) {
            for (const part of sq.subParts) total += part.maxMarks || 0;
          } else {
            total += sq.maxMarks || 0;
          }
        }
        return sum + total;
      }, 0);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch("/api/additional-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        toast({ title: "Exam created" });
        setCreateOpen(false);
        setNewTitle("");
        fetchExams();
      }
    } catch {
      toast({ title: "Failed to create exam", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!editingExam || !editTitle.trim()) return;
    try {
      const res = await fetch(`/api/additional-exams/${editingExam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (res.ok) {
        toast({ title: "Exam updated" });
        setEditOpen(false);
        setEditingExam(null);
        fetchExams();
      }
    } catch {
      toast({ title: "Failed to update exam", variant: "destructive" });
    }
  };

  const handleTogglePublish = async (exam: AdditionalExam) => {
    const endpoint = exam.isPublished ? "unpublish" : "publish";
    try {
      const res = await fetch(`/api/additional-exams/${exam.id}/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: exam.isPublished ? "Exam hidden from students" : "Exam published to students" });
        fetchExams();
      }
    } catch {
      toast({ title: "Failed to update publish status", variant: "destructive" });
    }
  };

  const handleDelete = async (exam: AdditionalExam) => {
    const qCount = getQuestionCount(exam.id);
    const msg = qCount > 0
      ? `Delete "${exam.title}" and its ${qCount} question${qCount !== 1 ? 's' : ''}? This cannot be undone.`
      : `Delete "${exam.title}"? This cannot be undone.`;
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/additional-exams/${exam.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Exam deleted" });
        fetchExams();
      }
    } catch {
      toast({ title: "Failed to delete exam", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={() => setLocation("/teacher/dashboard")} data-testid="button-back-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <ModeToggle />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white" data-testid="text-page-title">Additional Exams</h1>
            <p className="text-neutral-500 mt-1">Create exam papers and assign questions to them</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-red-600 hover:bg-red-700" data-testid="button-create-exam">
            <Plus className="mr-2 h-4 w-4" /> New Exam
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-500">Loading...</div>
        ) : exams.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">No additional exams yet</h3>
              <p className="text-neutral-500 mb-4">Create an exam paper, then add questions to it from the Question Editor.</p>
              <Button onClick={() => setCreateOpen(true)} variant="outline" data-testid="button-create-exam-empty">
                <Plus className="mr-2 h-4 w-4" /> Create First Exam
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => {
              const qCount = getQuestionCount(exam.id);
              const marks = getTotalMarks(exam.id);
              const time = Math.ceil(marks * 1.125);
              return (
                <Card key={exam.id} className="border-neutral-200 dark:border-neutral-800" data-testid={`card-exam-${exam.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${exam.isPublished ? 'bg-green-100 dark:bg-green-900/30' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                          <FileText className={`w-6 h-6 ${exam.isPublished ? 'text-green-600' : 'text-neutral-400'}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{exam.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                            <span>{qCount} question{qCount !== 1 ? 's' : ''}</span>
                            <span>{marks} marks</span>
                            <span>~{time} min</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${exam.isPublished ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                              {exam.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublish(exam)}
                          data-testid={`button-toggle-publish-${exam.id}`}
                        >
                          {exam.isPublished ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
                          {exam.isPublished ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setEditingExam(exam); setEditTitle(exam.title); setEditOpen(true); }}
                          data-testid={`button-edit-${exam.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleDelete(exam)}
                          data-testid={`button-delete-${exam.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Exam title (e.g. Practice Paper 1)"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                data-testid="input-exam-title"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newTitle.trim()} data-testid="button-confirm-create">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Exam Title</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Exam title"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleUpdate()}
                data-testid="input-edit-title"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={!editTitle.trim()} data-testid="button-confirm-edit">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
