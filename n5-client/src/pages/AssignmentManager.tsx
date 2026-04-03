import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, ArrowLeft, Clock, FileText, Upload, Download, ChevronDown, ChevronRight, Save, X, HelpCircle, ArrowUp, ArrowDown, Loader2, ClipboardList, Type, Image, Code, Table, Check, Pencil, FileCode, Eye, Columns, Clipboard, Unlink } from "lucide-react";
import AssignmentQuestionEditor, { AssignmentQuestion } from "@/components/AssignmentQuestionEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/RichTextEditor";
import RichTextBlock from "@/components/RichTextBlock";

interface AssignmentResource {
  id: string;
  partId: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  description: string | null;
}

interface ContentBlock {
  id: string;
  type: "text" | "image" | "code" | "data-table" | "pseudocode" | "heading" | "row-layout";
  content: string;
  caption?: string;
  imageSize?: string;
  dataTable?: any;
  pseudocode?: {
    heading: string;
    lines: { id: string; label: string; code: string }[];
  };
  pseudocodeLines?: { id: string; lineLabel: string; content: string }[];
  children?: ContentBlock[];
}

interface MarkingGuidanceRow {
  id: string;
  expectedResponse: string;
  additionalGuidance: string;
  marks: number;
}

interface MarkingGuidanceData {
  rows: MarkingGuidanceRow[];
  exampleAnswer: string;
}

interface AssignmentPart {
  id: string;
  sectionId: string;
  partLabel: string;
  title: string | null;
  instructions: string | null;
  contentBlocks?: ContentBlock[] | null;
  maxMarks: number;
  orderIndex: number;
  isPractical: boolean;
  requiresUpload: boolean;
  inputStyle?: string | null;
  aiGradingGuidance: string | null;
  markingGuidanceData?: MarkingGuidanceData | null;
  subQuestions: any;
  resources?: AssignmentResource[];
}

interface AssignmentSection {
  id: string;
  assignmentId: string;
  sectionType: string;
  title: string;
  isCompulsory: boolean;
  orderIndex: number;
  informationSheet?: ContentBlock[] | null;
  parts?: AssignmentPart[];
}

interface ChecklistItem {
  id: string;
  sectionType: string;
  partLabel: string;
  questionNumber: string;
  description: string;
}

interface Assignment {
  id: string;
  year: number;
  title: string;
  totalMarks: number;
  totalTimeMinutes: number;
  isPublished: boolean;
  evidenceChecklist?: ChecklistItem[] | null;
  createdAt: string;
  sections?: AssignmentSection[];
}

const SECTION_TYPES = [
  { id: "sdd", name: "Software Design and Development", compulsory: true },
  { id: "database", name: "Database Design and Development", compulsory: false },
  { id: "web", name: "Web Design and Development", compulsory: false },
];

export default function AssignmentManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loadingSections, setLoadingSections] = useState<Set<string>>(new Set());
  const [expandingSection, setExpandingSection] = useState<string | null>(null);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editingSection, setEditingSection] = useState<{ assignmentId: string; section?: AssignmentSection } | null>(null);
  const [editingPart, setEditingPart] = useState<{ sectionId: string; part?: AssignmentPart } | null>(null);
  const [checklistEditorOpen, setChecklistEditorOpen] = useState(false);
  const [editingChecklistAssignment, setEditingChecklistAssignment] = useState<Assignment | null>(null);
  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newChecklistSection, setNewChecklistSection] = useState("sdd");
  const [newChecklistPartLabel, setNewChecklistPartLabel] = useState("A");
  const [newChecklistQuestionNumber, setNewChecklistQuestionNumber] = useState("");
  const [editingChecklistItem, setEditingChecklistItem] = useState<ChecklistItem | null>(null);
  const [editingInfoSheet, setEditingInfoSheet] = useState<{ sectionId: string; assignmentId: string; blocks: ContentBlock[] } | null>(null);
  const [infoSheetPreview, setInfoSheetPreview] = useState(false);
  
  const [newAssignment, setNewAssignment] = useState({
    year: new Date().getFullYear(),
    title: "",
    totalMarks: 40,
    totalTimeMinutes: 360,
    isPublished: false, // Start as draft
  });
  
  const [newSection, setNewSection] = useState({
    sectionType: "sdd",
    title: "",
    isCompulsory: true,
    orderIndex: 0,
  });
  
  const [newPart, setNewPart] = useState({
    partLabel: "A",
    title: "",
    instructions: "",
    contentBlocks: [] as ContentBlock[],
    maxMarks: 0,
    orderIndex: 0,
    isPractical: false,
    requiresUpload: true,
    inputStyle: "text" as string,
    aiGradingGuidance: "",
    subQuestions: [] as AssignmentQuestion[],
  });

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("teacherToken");
      const expires = localStorage.getItem("teacherTokenExpires");
      
      if (!token || !expires || parseInt(expires) < Date.now()) {
        localStorage.removeItem("teacherToken");
        localStorage.removeItem("teacherTokenExpires");
        setLocation("/teacher/login");
        return;
      }

      try {
        const response = await fetch("/api/teacher/verify", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          setLocation("/teacher/login");
          return;
        }
        fetchAssignments();
      } catch {
        setLocation("/teacher/login");
      }
    };

    verifyAuth();
  }, [setLocation]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/n5/assignments");
      if (!response.ok) throw new Error("Failed to fetch assignments");
      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load assignments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentDetails = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/n5/assignments/${assignmentId}`);
      if (!response.ok) throw new Error("Failed to fetch assignment details");
      const data = await response.json();
      setAssignments(prev => prev.map(a => a.id === assignmentId ? data : a));
    } catch (error) {
      toast({ title: "Error", description: "Failed to load assignment details", variant: "destructive" });
    }
  };

  const handleCreateAssignment = async () => {
    try {
      const response = await fetch("/api/n5/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAssignment),
      });
      if (!response.ok) throw new Error("Failed to create assignment");
      const created = await response.json();
      setAssignments(prev => [...prev, created]);
      setIsCreateDialogOpen(false);
      setNewAssignment({ year: new Date().getFullYear(), title: "", totalMarks: 40, totalTimeMinutes: 360, isPublished: false });
      toast({ title: "Success", description: "Assignment created" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create assignment", variant: "destructive" });
    }
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;
    try {
      const { sections, ...assignmentData } = editingAssignment;
      const response = await fetch(`/api/n5/assignments/${editingAssignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignmentData),
      });
      if (!response.ok) throw new Error("Failed to update assignment");
      const updated = await response.json();
      setAssignments(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
      setEditingAssignment(null);
      toast({ title: "Success", description: "Assignment updated" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update assignment", variant: "destructive" });
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      const response = await fetch(`/api/n5/assignments/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete assignment");
      setAssignments(prev => prev.filter(a => a.id !== id));
      toast({ title: "Success", description: "Assignment deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete assignment", variant: "destructive" });
    }
  };

  const handleCreateSection = async () => {
    if (!editingSection?.assignmentId) return;
    try {
      const sectionData = {
        ...newSection,
        title: newSection.title || SECTION_TYPES.find(s => s.id === newSection.sectionType)?.name || newSection.sectionType,
        isCompulsory: newSection.sectionType === "sdd",
      };
      const response = await fetch(`/api/n5/assignments/${editingSection.assignmentId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sectionData),
      });
      if (!response.ok) throw new Error("Failed to create section");
      await fetchAssignmentDetails(editingSection.assignmentId);
      setEditingSection(null);
      setNewSection({ sectionType: "sdd", title: "", isCompulsory: true, orderIndex: 0 });
      toast({ title: "Success", description: "Section created" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create section", variant: "destructive" });
    }
  };

  const handleDeleteSection = async (sectionId: string, assignmentId: string) => {
    try {
      const response = await fetch(`/api/n5/assignment-sections/${sectionId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete section");
      await fetchAssignmentDetails(assignmentId);
      toast({ title: "Success", description: "Section deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete section", variant: "destructive" });
    }
  };

  const handleUpdateEvidenceChecklist = async (assignmentId: string, checklist: ChecklistItem[]) => {
    try {
      const response = await fetch(`/api/n5/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidenceChecklist: checklist }),
      });
      if (!response.ok) throw new Error("Failed to update checklist");
      setAssignments(prev => prev.map(a => 
        a.id === assignmentId ? { ...a, evidenceChecklist: checklist } : a
      ));
      if (editingChecklistAssignment?.id === assignmentId) {
        setEditingChecklistAssignment(prev => prev ? { ...prev, evidenceChecklist: checklist } : null);
      }
      toast({ title: "Success", description: "Evidence checklist updated" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update checklist", variant: "destructive" });
    }
  };

  const addChecklistItem = () => {
    if (!editingChecklistAssignment || !newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      sectionType: newChecklistSection,
      partLabel: newChecklistPartLabel.trim().toUpperCase(),
      questionNumber: newChecklistQuestionNumber.trim(),
      description: newChecklistItem.trim(),
    };
    const checklist = [...(editingChecklistAssignment.evidenceChecklist || []), newItem];
    handleUpdateEvidenceChecklist(editingChecklistAssignment.id, checklist);
    setNewChecklistItem("");
    setNewChecklistQuestionNumber("");
  };

  const updateChecklistItem = (updatedItem: ChecklistItem) => {
    if (!editingChecklistAssignment) return;
    const checklist = (editingChecklistAssignment.evidenceChecklist || []).map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    handleUpdateEvidenceChecklist(editingChecklistAssignment.id, checklist);
    setEditingChecklistItem(null);
  };

  const removeChecklistItem = (itemId: string) => {
    if (!editingChecklistAssignment) return;
    const checklist = (editingChecklistAssignment.evidenceChecklist || []).filter(item => item.id !== itemId);
    handleUpdateEvidenceChecklist(editingChecklistAssignment.id, checklist);
  };

  const openChecklistEditor = (assignment: Assignment) => {
    setEditingChecklistAssignment(assignment);
    setChecklistEditorOpen(true);
  };

  const handleReorderSection = async (assignmentId: string, sectionId: string, direction: "up" | "down") => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment?.sections) return;
    
    const sortedSections = [...assignment.sections].sort((a, b) => a.orderIndex - b.orderIndex);
    const currentIndex = sortedSections.findIndex(s => s.id === sectionId);
    
    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === sortedSections.length - 1) return;
    
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const currentSection = sortedSections[currentIndex];
    const swapSection = sortedSections[swapIndex];
    
    setLoadingSections(prev => new Set([...Array.from(prev), sectionId, swapSection.id]));
    
    try {
      const [response1, response2] = await Promise.all([
        fetch(`/api/n5/assignment-sections/${currentSection.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIndex: swapSection.orderIndex }),
        }),
        fetch(`/api/n5/assignment-sections/${swapSection.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIndex: currentSection.orderIndex }),
        }),
      ]);
      
      if (!response1.ok || !response2.ok) {
        throw new Error("One or both PATCH requests failed");
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchAssignmentDetails(assignmentId);
    } catch (error) {
      toast({ title: "Error", description: "Failed to reorder sections", variant: "destructive" });
    } finally {
      setLoadingSections(prev => {
        const next = new Set(prev);
        next.delete(sectionId);
        next.delete(swapSection.id);
        return next;
      });
    }
  };

  const handleCreatePart = async () => {
    if (!editingPart?.sectionId) return;
    try {
      const response = await fetch(`/api/n5/assignment-sections/${editingPart.sectionId}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPart),
      });
      if (!response.ok) throw new Error("Failed to create part");
      const section = assignments.flatMap(a => a.sections || []).find(s => s.id === editingPart.sectionId);
      if (section) {
        await fetchAssignmentDetails(section.assignmentId);
      }
      setEditingPart(null);
      setQuestionsModalOpen(false);
      setNewPart({ partLabel: "A", title: "", instructions: "", contentBlocks: [], maxMarks: 0, orderIndex: 0, isPractical: false, requiresUpload: true, inputStyle: "text", aiGradingGuidance: "", subQuestions: [] });
      toast({ title: "Success", description: "Part created" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create part", variant: "destructive" });
    }
  };

  const handleUpdatePart = async () => {
    if (!editingPart?.part) return;
    try {
      const response = await fetch(`/api/n5/assignment-parts/${editingPart.part.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPart.part),
      });
      if (!response.ok) throw new Error("Failed to update part");
      const section = assignments.flatMap(a => a.sections || []).find(s => s.id === editingPart.sectionId);
      if (section) {
        await fetchAssignmentDetails(section.assignmentId);
      }
      setEditingPart(null);
      setQuestionsModalOpen(false);
      toast({ title: "Success", description: "Part updated" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update part", variant: "destructive" });
    }
  };

  const handleDeletePart = async (partId: string, sectionId: string) => {
    try {
      const response = await fetch(`/api/n5/assignment-parts/${partId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete part");
      const section = assignments.flatMap(a => a.sections || []).find(s => s.id === sectionId);
      if (section) {
        await fetchAssignmentDetails(section.assignmentId);
      }
      toast({ title: "Success", description: "Part deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete part", variant: "destructive" });
    }
  };

  const handleUploadResource = async (partId: string, file: File, description: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description);
    
    try {
      const response = await fetch(`/api/n5/assignment-parts/${partId}/resources`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload resource");
      const part = assignments.flatMap(a => a.sections || []).flatMap(s => s.parts || []).find(p => p.id === partId);
      if (part) {
        const section = assignments.flatMap(a => a.sections || []).find(s => s.id === part.sectionId);
        if (section) {
          await fetchAssignmentDetails(section.assignmentId);
        }
      }
      toast({ title: "Success", description: "Resource uploaded" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload resource", variant: "destructive" });
    }
  };

  const handleDeleteResource = async (resourceId: string, partId: string) => {
    try {
      const response = await fetch(`/api/n5/assignment-resources/${resourceId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete resource");
      const part = assignments.flatMap(a => a.sections || []).flatMap(s => s.parts || []).find(p => p.id === partId);
      if (part) {
        const section = assignments.flatMap(a => a.sections || []).find(s => s.id === part.sectionId);
        if (section) {
          await fetchAssignmentDetails(section.assignmentId);
        }
      }
      toast({ title: "Success", description: "Resource deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete resource", variant: "destructive" });
    }
  };

  const toggleExpandAssignment = (assignmentId: string) => {
    if (expandedAssignment === assignmentId) {
      setExpandedAssignment(null);
    } else {
      setExpandedAssignment(assignmentId);
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment?.sections) {
        fetchAssignmentDetails(assignmentId);
      }
    }
  };

  const toggleExpandSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const isCurrentlyExpanded = prev.has(sectionId);
      const next = new Set(prev);
      
      if (isCurrentlyExpanded) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
        setExpandingSection(sectionId);
        setTimeout(() => setExpandingSection(null), 300);
      }
      
      return next;
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/teacher/dashboard")}
              data-testid="back-button"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Assignment Manager
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Create and manage N5 coursework assignments
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            data-testid="create-assignment-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
              <h3 className="text-lg font-medium mb-2">No Assignments Yet</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Create your first assignment to get started
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {[...assignments].sort((a, b) => b.year - a.year).map(assignment => (
              <Card key={assignment.id} data-testid={`assignment-card-${assignment.id}`}>
                <Collapsible
                  open={expandedAssignment === assignment.id}
                  onOpenChange={() => toggleExpandAssignment(assignment.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedAssignment === assignment.id ? (
                            <ChevronDown className="h-5 w-5 text-neutral-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-neutral-500" />
                          )}
                          <div>
                            <CardTitle className="text-lg">
                              {assignment.year} - {assignment.title}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(assignment.totalTimeMinutes)}
                              </span>
                              <span>{assignment.totalMarks} marks</span>
                              <span className={assignment.isPublished ? "text-green-600" : "text-amber-500"}>
                                {assignment.isPublished ? "Published" : "Draft"}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(`/teacher/assignment-preview/${assignment.id}`, '_blank')}
                            title="Preview as student"
                            data-testid={`preview-assignment-${assignment.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingAssignment(assignment)}
                            data-testid={`edit-assignment-${assignment.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`delete-assignment-${assignment.id}`}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the {assignment.year} assignment and all its sections, parts, and resources.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAssignment(assignment.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 border-t">
                      <div className="py-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Sections</h4>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openChecklistEditor(assignment)}
                              data-testid={`manage-checklist-${assignment.id}`}
                            >
                              <ClipboardList className="h-4 w-4 mr-1" />
                              Manage Checklist
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingSection({ assignmentId: assignment.id })}
                              data-testid={`add-section-${assignment.id}`}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Section
                            </Button>
                          </div>
                        </div>
                        
                        {(!assignment.sections || assignment.sections.length === 0) ? (
                          <p className="text-neutral-500 text-sm py-4 text-center">
                            No sections yet. Add sections for SDD, Database, and Web.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {[...assignment.sections].sort((a, b) => a.orderIndex - b.orderIndex).map((section, sectionIndex, sortedSections) => (
                              <div key={section.id} className={`border rounded-lg ${loadingSections.has(section.id) ? "opacity-50" : ""}`} data-testid={`section-${section.id}`}>
                                <Collapsible
                                  open={expandedSections.has(section.id)}
                                  onOpenChange={() => toggleExpandSection(section.id)}
                                >
                                  <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                                      <div className="flex items-center gap-2">
                                        {loadingSections.has(section.id) || expandingSection === section.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : expandedSections.has(section.id) ? (
                                          <ChevronDown className="h-4 w-4" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4" />
                                        )}
                                        <span className="font-medium">Task {sectionIndex + 1} - {section.title}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                          section.isCompulsory 
                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                        }`}>
                                          {section.isCompulsory ? "Compulsory" : "Optional"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleReorderSection(assignment.id, section.id, "up")}
                                          disabled={sectionIndex === 0 || loadingSections.has(section.id)}
                                          title="Move up"
                                        >
                                          <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleReorderSection(assignment.id, section.id, "down")}
                                          disabled={sectionIndex === sortedSections.length - 1 || loadingSections.has(section.id)}
                                          title="Move down"
                                        >
                                          <ArrowDown className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                              <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Section?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This will delete the {section.title} section and all its parts.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => handleDeleteSection(section.id, assignment.id)}
                                                className="bg-red-600 hover:bg-red-700"
                                              >
                                                Delete
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="p-3 pt-0 border-t bg-neutral-50 dark:bg-neutral-900/20">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-purple-500" />
                                          <span className="text-sm font-medium">Information Sheet</span>
                                          {section.informationSheet && section.informationSheet.length > 0 && (
                                            <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                              {section.informationSheet.length} block{section.informationSheet.length !== 1 ? "s" : ""}
                                            </span>
                                          )}
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setEditingInfoSheet({
                                            sectionId: section.id,
                                            assignmentId: assignment.id,
                                            blocks: section.informationSheet ? [...section.informationSheet] : [],
                                          })}
                                          data-testid={`button-edit-info-sheet-${section.id}`}
                                        >
                                          <Edit className="h-3 w-3 mr-1" />
                                          {section.informationSheet && section.informationSheet.length > 0 ? "Edit" : "Add"}
                                        </Button>
                                      </div>
                                      <p className="text-xs text-neutral-500 mb-4">
                                        Reference material students can access across all parts (A, B, C) in this section.
                                      </p>
                                      {/* Parts Section */}
                                      <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium">Parts</span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setEditingPart({ sectionId: section.id })}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Part
                                        </Button>
                                      </div>
                                      
                                      {(!section.parts || section.parts.length === 0) ? (
                                        <p className="text-neutral-500 text-sm py-2">
                                          No parts yet. Add Part A, B, C as needed.
                                        </p>
                                      ) : (
                                        <div className="space-y-2">
                                          {[...section.parts].sort((a, b) => a.orderIndex - b.orderIndex).map(part => (
                                            <PartCard
                                              key={part.id}
                                              part={part}
                                              onEdit={() => setEditingPart({ sectionId: section.id, part })}
                                              onDelete={() => handleDeletePart(part.id, section.id)}
                                              onUploadResource={(file, desc) => handleUploadResource(part.id, file, desc)}
                                              onDeleteResource={(resourceId) => handleDeleteResource(resourceId, part.id)}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>
                Add a new N5 coursework assignment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={newAssignment.year}
                    onChange={e => setNewAssignment({ ...newAssignment, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    data-testid="input-assignment-year"
                  />
                </div>
                <div>
                  <Label>Total Marks</Label>
                  <Input
                    type="number"
                    value={newAssignment.totalMarks}
                    onChange={e => setNewAssignment({ ...newAssignment, totalMarks: parseInt(e.target.value) || 40 })}
                    data-testid="input-assignment-marks"
                  />
                </div>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={newAssignment.title}
                  onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="e.g., N5 Computing Science Assignment"
                  data-testid="input-assignment-title"
                />
              </div>
              <div>
                <Label>Time Limit (minutes)</Label>
                <Input
                  type="number"
                  value={newAssignment.totalTimeMinutes}
                  onChange={e => setNewAssignment({ ...newAssignment, totalTimeMinutes: parseInt(e.target.value) || 360 })}
                  data-testid="input-assignment-time"
                />
                <p className="text-xs text-neutral-500 mt-1">Default: 360 minutes (6 hours)</p>
              </div>
              <div className="flex items-center justify-between">
                <Label>Publish (visible to students)</Label>
                <Switch
                  checked={newAssignment.isPublished}
                  onCheckedChange={checked => setNewAssignment({ ...newAssignment, isPublished: checked })}
                  data-testid="switch-assignment-published"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAssignment} data-testid="submit-create-assignment">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Assignment</DialogTitle>
            </DialogHeader>
            {editingAssignment && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={editingAssignment.year}
                      onChange={e => setEditingAssignment({ ...editingAssignment, year: parseInt(e.target.value) || editingAssignment.year })}
                    />
                  </div>
                  <div>
                    <Label>Total Marks</Label>
                    <Input
                      type="number"
                      value={editingAssignment.totalMarks}
                      onChange={e => setEditingAssignment({ ...editingAssignment, totalMarks: parseInt(e.target.value) || editingAssignment.totalMarks })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={editingAssignment.title}
                    onChange={e => setEditingAssignment({ ...editingAssignment, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    value={editingAssignment.totalTimeMinutes}
                    onChange={e => setEditingAssignment({ ...editingAssignment, totalTimeMinutes: parseInt(e.target.value) || editingAssignment.totalTimeMinutes })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Publish (visible to students)</Label>
                  <Switch
                    checked={editingAssignment.isPublished}
                    onCheckedChange={checked => setEditingAssignment({ ...editingAssignment, isPublished: checked })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingAssignment(null)}>Cancel</Button>
              <Button onClick={handleUpdateAssignment}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Section</DialogTitle>
              <DialogDescription>
                Add a new section to the assignment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Section Type</Label>
                <Select
                  value={newSection.sectionType}
                  onValueChange={value => setNewSection({ 
                    ...newSection, 
                    sectionType: value,
                    isCompulsory: value === "sdd",
                    title: SECTION_TYPES.find(s => s.id === value)?.name || value,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} {type.compulsory && "(Required)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Order Index</Label>
                <Input
                  type="number"
                  value={newSection.orderIndex}
                  onChange={e => setNewSection({ ...newSection, orderIndex: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-neutral-500 mt-1">Lower numbers appear first</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
              <Button onClick={handleCreateSection}>Add Section</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingInfoSheet} onOpenChange={() => { setEditingInfoSheet(null); setInfoSheetPreview(false); }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Information Sheet{infoSheetPreview ? " — Preview" : ""}</DialogTitle>
                <Button
                  type="button"
                  variant={infoSheetPreview ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInfoSheetPreview(!infoSheetPreview)}
                  data-testid="button-toggle-info-sheet-preview"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {infoSheetPreview ? "Back to Editor" : "Preview"}
                </Button>
              </div>
              <DialogDescription>
                {infoSheetPreview
                  ? "This is how the information sheet will appear to students."
                  : "Build reference material that students can access across all parts (A, B, C) in this section. You can paste images from your clipboard."}
              </DialogDescription>
            </DialogHeader>
            {infoSheetPreview ? (
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto border rounded-lg p-4 bg-white dark:bg-neutral-950">
                {editingInfoSheet && editingInfoSheet.blocks.length === 0 && (
                  <p className="text-sm text-neutral-500 py-4 text-center">No content blocks to preview.</p>
                )}
                {editingInfoSheet && (() => {
                  const renderPreviewBlock = (block: ContentBlock, idx: number): React.ReactNode => (
                    <div key={block.id || idx}>
                      {block.type === "heading" && block.content && (
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-4 mb-2">{block.content}</h3>
                      )}
                      {block.type === "text" && (
                        <RichTextBlock content={block.content} />
                      )}
                      {block.type === "image" && block.content && (
                        <figure className="my-4">
                          <img
                            src={block.content}
                            alt={block.caption || "Information sheet image"}
                            className={`rounded-lg ${
                              block.imageSize === "small" ? "max-w-xs" :
                              block.imageSize === "medium" ? "max-w-md" :
                              block.imageSize === "large" ? "max-w-2xl" : "max-w-full"
                            }`}
                          />
                          {block.caption && (
                            <figcaption className="text-sm text-neutral-500 mt-2">{block.caption}</figcaption>
                          )}
                        </figure>
                      )}
                      {block.type === "code" && (
                        <pre className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg overflow-x-auto my-4">
                          <code className="text-sm font-mono">{block.content}</code>
                        </pre>
                      )}
                      {block.type === "data-table" && block.dataTable && (
                        <div className="my-6 overflow-x-auto">
                          {(block.dataTable.title || block.dataTable.tableName) && (
                            <p className="font-medium mb-2">{block.dataTable.title || block.dataTable.tableName}</p>
                          )}
                          <table className="min-w-full border border-neutral-200 dark:border-neutral-700">
                            {!block.dataTable.hideHeaders && (
                            <thead>
                              <tr className="bg-neutral-100 dark:bg-neutral-800">
                                {(block.dataTable.headers || block.dataTable.columns)?.map((header: any, i: number) => {
                                  const headerText = typeof header === 'string' ? header : header.header;
                                  return (
                                    <th key={header.id || i} className="px-3 py-2 text-left text-sm font-medium border-b">
                                      {headerText}
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            )}
                            <tbody>
                              {block.dataTable.rows?.map((row: any, rowIndex: number) => {
                                const cells = Array.isArray(row) ? row : (row.cells || []);
                                return (
                                  <tr key={row.id || rowIndex} className={rowIndex % 2 === 0 ? "" : "bg-neutral-50 dark:bg-neutral-800/50"}>
                                    {cells.map((cell: string, cellIndex: number) => (
                                      <td key={cellIndex} className="px-3 py-2 text-sm border-b whitespace-pre-wrap">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {block.type === "pseudocode" && block.pseudocode && (
                        <div className="my-4 border rounded-lg overflow-hidden">
                          {block.pseudocode.heading && (
                            <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 font-medium text-sm border-b">
                              {block.pseudocode.heading}
                            </div>
                          )}
                          <div className="p-4 font-mono text-sm bg-neutral-50 dark:bg-neutral-900">
                            {block.pseudocode.lines.map((line, lineIdx) => (
                              <div key={line.id || lineIdx} className="flex gap-4">
                                <span className="text-neutral-400 w-8 text-right select-none">{line.label}</span>
                                <span>{line.code}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {block.type === "row-layout" && block.children && (
                        <div className="flex flex-col md:flex-row gap-4 items-start my-4">
                          {block.children.map((child, childIdx) => (
                            <div key={child.id || childIdx} className="flex-1 min-w-0">
                              {renderPreviewBlock(child, childIdx)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                  return editingInfoSheet.blocks.map((block, idx) => renderPreviewBlock(block, idx));
                })()}
              </div>
            ) : (
            <div
              className="space-y-4 py-4 max-h-[60vh] overflow-y-auto"
              onPaste={(e) => {
                if (!editingInfoSheet) return;
                const items = e.clipboardData?.items;
                if (!items) return;
                for (let i = 0; i < items.length; i++) {
                  if (items[i].type.startsWith("image/")) {
                    e.preventDefault();
                    const file = items[i].getAsFile();
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const base64 = event.target?.result as string;
                      const blocks = [...editingInfoSheet.blocks];
                      const emptyImageIdx = blocks.findIndex(b => b.type === "image" && !b.content);
                      if (emptyImageIdx !== -1) {
                        blocks[emptyImageIdx] = { ...blocks[emptyImageIdx], content: base64, imageSize: blocks[emptyImageIdx].imageSize || "medium" };
                        setEditingInfoSheet({ ...editingInfoSheet, blocks });
                        toast({ title: "Image pasted", description: "Image added to empty image block" });
                      } else {
                        setEditingInfoSheet({
                          ...editingInfoSheet,
                          blocks: [...editingInfoSheet.blocks, {
                            id: `block-${Date.now()}`,
                            type: "image",
                            content: base64,
                            imageSize: "medium"
                          }]
                        });
                        toast({ title: "Image pasted", description: "New image block added from clipboard" });
                      }
                    };
                    reader.readAsDataURL(file);
                    return;
                  }
                }
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <Label className="text-base font-medium">Content Blocks</Label>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    if (!editingInfoSheet) return;
                    setEditingInfoSheet({ ...editingInfoSheet, blocks: [...editingInfoSheet.blocks, { id: `block-${Date.now()}`, type: "heading", content: "" }] });
                  }} data-testid="info-sheet-add-heading"><Type className="w-3 h-3 mr-1" />Heading</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    if (!editingInfoSheet) return;
                    setEditingInfoSheet({ ...editingInfoSheet, blocks: [...editingInfoSheet.blocks, { id: `block-${Date.now()}`, type: "text", content: "" }] });
                  }} data-testid="info-sheet-add-text"><FileText className="w-3 h-3 mr-1" />Text</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    if (!editingInfoSheet) return;
                    setEditingInfoSheet({ ...editingInfoSheet, blocks: [...editingInfoSheet.blocks, { id: `block-${Date.now()}`, type: "image", content: "" }] });
                  }} data-testid="info-sheet-add-image"><Image className="w-3 h-3 mr-1" />Image</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    if (!editingInfoSheet) return;
                    setEditingInfoSheet({ ...editingInfoSheet, blocks: [...editingInfoSheet.blocks, { id: `block-${Date.now()}`, type: "code", content: "// Enter code here..." }] });
                  }} data-testid="info-sheet-add-code"><Code className="w-3 h-3 mr-1" />Code</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    if (!editingInfoSheet) return;
                    setEditingInfoSheet({ ...editingInfoSheet, blocks: [...editingInfoSheet.blocks, { id: `block-${Date.now()}`, type: "data-table", content: "", dataTable: { tableName: "", columns: [{ id: "col1", header: "Column 1" }], rows: [{ id: "row1", cells: [""] }] } }] });
                  }} data-testid="info-sheet-add-table"><Table className="w-3 h-3 mr-1" />Table</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    if (!editingInfoSheet) return;
                    setEditingInfoSheet({ ...editingInfoSheet, blocks: [...editingInfoSheet.blocks, { id: `block-${Date.now()}`, type: "pseudocode", content: "", pseudocode: { heading: "", lines: [{ id: `line-${Date.now()}`, label: "1", code: "" }] } }] });
                  }} data-testid="info-sheet-add-pseudocode"><FileCode className="w-3 h-3 mr-1" />Pseudocode</Button>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <Clipboard className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs text-blue-700 dark:text-blue-400">Tip: Add an Image block first, then paste (Ctrl+V / Cmd+V) to fill it. Or paste anywhere to add a new image at the end.</span>
              </div>

              {editingInfoSheet && editingInfoSheet.blocks.length === 0 && (
                <p className="text-sm text-neutral-500 py-4 text-center">No content blocks yet. Add blocks above or paste an image to get started.</p>
              )}

              {editingInfoSheet && editingInfoSheet.blocks.map((block, index) => {
                const renderBlockEditor = (blk: ContentBlock, blockIndex: number, updateBlock: (updated: ContentBlock) => void, removeBlock: () => void, moveUp?: () => void, moveDown?: () => void, canGroup?: boolean, onGroup?: () => void, isChild?: boolean) => (
                  <div key={blk.id} className={`border rounded-lg p-3 ${isChild ? "bg-white dark:bg-neutral-950" : "bg-neutral-50 dark:bg-neutral-900"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium uppercase text-neutral-500">
                        {blk.type === "heading" && "Heading"}
                        {blk.type === "text" && "Text Block"}
                        {blk.type === "image" && "Image Block"}
                        {blk.type === "code" && "Code Block"}
                        {blk.type === "data-table" && "Table Block"}
                        {blk.type === "pseudocode" && "Pseudocode Block"}
                        {blk.type === "row-layout" && "Side-by-Side Group"}
                      </span>
                      <div className="flex gap-1">
                        {canGroup && onGroup && (
                          <Button type="button" variant="ghost" size="sm" title="Group with next block (side-by-side)" onClick={onGroup}>
                            <Columns className="w-3 h-3 text-blue-500" />
                          </Button>
                        )}
                        {moveUp && (
                          <Button type="button" variant="ghost" size="sm" onClick={moveUp}><ArrowUp className="w-3 h-3" /></Button>
                        )}
                        {moveDown && (
                          <Button type="button" variant="ghost" size="sm" onClick={moveDown}><ArrowDown className="w-3 h-3" /></Button>
                        )}
                        <Button type="button" variant="ghost" size="sm" onClick={removeBlock}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                      </div>
                    </div>
                    {blk.type === "heading" && (
                      <Input
                        value={blk.content}
                        onChange={e => updateBlock({ ...blk, content: e.target.value })}
                        className="font-medium"
                        placeholder="Section heading"
                      />
                    )}
                    {blk.type === "text" && (
                      <RichTextEditor
                        content={blk.content}
                        onChange={(html) => updateBlock({ ...blk, content: html })}
                      />
                    )}
                    {blk.type === "image" && (
                      <div
                        className="space-y-2"
                        onPaste={(e) => {
                          const items = e.clipboardData?.items;
                          if (!items) return;
                          for (const item of Array.from(items)) {
                            if (item.type.startsWith("image/")) {
                              e.preventDefault();
                              e.stopPropagation();
                              const file = item.getAsFile();
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                updateBlock({ ...blk, content: ev.target?.result as string, imageSize: blk.imageSize || "medium" });
                              };
                              reader.readAsDataURL(file);
                              return;
                            }
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith("image/")) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              updateBlock({ ...blk, content: ev.target?.result as string, imageSize: blk.imageSize || "medium" });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        {!blk.content ? (
                          <div
                            className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-4 text-center text-sm text-neutral-500 dark:text-neutral-400 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                            tabIndex={0}
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/*";
                              input.onchange = (ev) => {
                                const file = (ev.target as HTMLInputElement).files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (re) => {
                                  updateBlock({ ...blk, content: re.target?.result as string, imageSize: blk.imageSize || "medium" });
                                };
                                reader.readAsDataURL(file);
                              };
                              input.click();
                            }}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <Upload className="h-5 w-5" />
                              <span>Drag & drop, paste, or click to upload</span>
                              <span className="text-xs text-neutral-400">Or enter URL below</span>
                            </div>
                          </div>
                        ) : (
                          <div className="border rounded-md p-2 w-fit bg-white dark:bg-neutral-800">
                            <img src={blk.content} alt={blk.caption || "Preview"} className="max-h-32 object-contain rounded" />
                          </div>
                        )}
                        <div className="flex gap-2 items-center">
                          <Input
                            value={blk.content.startsWith("data:") ? "(pasted image)" : blk.content}
                            onChange={e => updateBlock({ ...blk, content: e.target.value })}
                            placeholder="Image URL"
                            className="flex-1 text-sm"
                            readOnly={blk.content.startsWith("data:")}
                          />
                          <label className="inline-flex items-center gap-1 px-3 py-1 text-sm border rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800">
                            <Upload className="w-3 h-3" /> Upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  updateBlock({ ...blk, content: ev.target?.result as string });
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                          {blk.content && (
                            <Button type="button" variant="outline" size="sm" onClick={() => updateBlock({ ...blk, content: "" })}>
                              <X className="w-3 h-3 mr-1" /> Clear
                            </Button>
                          )}
                        </div>
                        <Input
                          value={blk.caption || ""}
                          onChange={e => updateBlock({ ...blk, caption: e.target.value })}
                          placeholder="Caption (optional)"
                        />
                        <Select
                          value={blk.imageSize || "medium"}
                          onValueChange={value => updateBlock({ ...blk, imageSize: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                            <SelectItem value="full">Full Width</SelectItem>
                          </SelectContent>
                        </Select>
                        {blk.content && <img src={blk.content} alt={blk.caption || ""} className="max-w-xs rounded mt-2" />}
                      </div>
                    )}
                    {blk.type === "code" && (
                      <Textarea
                        value={blk.content}
                        onChange={e => updateBlock({ ...blk, content: e.target.value })}
                        className="font-mono text-sm"
                        rows={5}
                      />
                    )}
                    {blk.type === "data-table" && blk.dataTable && (
                      <div className="space-y-2">
                        <Input
                          value={blk.dataTable.tableName || ""}
                          onChange={e => updateBlock({ ...blk, dataTable: { ...blk.dataTable, tableName: e.target.value } })}
                          placeholder="Table name"
                        />
                        <p className="text-xs text-neutral-500">Edit columns and rows in the table editor above.</p>
                      </div>
                    )}
                    {blk.type === "pseudocode" && blk.pseudocode && (
                      <div className="space-y-2">
                        <Input
                          value={blk.pseudocode.heading || ""}
                          onChange={e => updateBlock({ ...blk, pseudocode: { ...blk.pseudocode!, heading: e.target.value } })}
                          placeholder="Pseudocode heading"
                        />
                        {blk.pseudocode.lines.map((line, lineIdx) => (
                          <div key={line.id} className="flex gap-2 items-center">
                            <Input
                              value={line.label}
                              onChange={e => {
                                const lines = [...blk.pseudocode!.lines];
                                lines[lineIdx] = { ...lines[lineIdx], label: e.target.value };
                                updateBlock({ ...blk, pseudocode: { ...blk.pseudocode!, lines } });
                              }}
                              className="w-16"
                              placeholder="#"
                            />
                            <Input
                              value={line.code}
                              onChange={e => {
                                const lines = [...blk.pseudocode!.lines];
                                lines[lineIdx] = { ...lines[lineIdx], code: e.target.value };
                                updateBlock({ ...blk, pseudocode: { ...blk.pseudocode!, lines } });
                              }}
                              className="font-mono text-sm flex-1"
                              placeholder="Code line"
                            />
                            <Button type="button" variant="ghost" size="sm" onClick={() => {
                              const lines = blk.pseudocode!.lines.filter((_, i) => i !== lineIdx);
                              updateBlock({ ...blk, pseudocode: { ...blk.pseudocode!, lines } });
                            }}><X className="w-3 h-3" /></Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          const lines = [...blk.pseudocode!.lines, { id: `line-${Date.now()}`, label: String(blk.pseudocode!.lines.length + 1), code: "" }];
                          updateBlock({ ...blk, pseudocode: { ...blk.pseudocode!, lines } });
                        }}>
                          <Plus className="w-3 h-3 mr-1" /> Add Line
                        </Button>
                      </div>
                    )}
                    {blk.type === "row-layout" && blk.children && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-blue-600 dark:text-blue-400">These blocks display side-by-side to students.</span>
                          <Button type="button" variant="outline" size="sm" onClick={() => {
                            if (!editingInfoSheet || !blk.children) return;
                            const blocks = [...editingInfoSheet.blocks];
                            const newBlocks = [
                              ...blocks.slice(0, blockIndex),
                              ...blk.children,
                              ...blocks.slice(blockIndex + 1)
                            ];
                            setEditingInfoSheet({ ...editingInfoSheet, blocks: newBlocks });
                            toast({ title: "Ungrouped", description: "Blocks are now displayed separately." });
                          }}>
                            <Unlink className="w-3 h-3 mr-1" /> Ungroup
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {blk.children.map((child, childIdx) =>
                            renderBlockEditor(
                              child,
                              childIdx,
                              (updated) => {
                                const blocks = [...editingInfoSheet.blocks];
                                const children = [...(blocks[blockIndex].children || [])];
                                children[childIdx] = updated;
                                blocks[blockIndex] = { ...blocks[blockIndex], children };
                                setEditingInfoSheet({ ...editingInfoSheet, blocks });
                              },
                              () => {
                                const blocks = [...editingInfoSheet.blocks];
                                const children = (blocks[blockIndex].children || []).filter((_, i) => i !== childIdx);
                                if (children.length <= 1) {
                                  const newBlocks = [
                                    ...blocks.slice(0, blockIndex),
                                    ...(children.length === 1 ? children : []),
                                    ...blocks.slice(blockIndex + 1)
                                  ];
                                  setEditingInfoSheet({ ...editingInfoSheet, blocks: newBlocks });
                                  toast({ title: "Group dissolved", description: "Remaining block ungrouped automatically." });
                                } else {
                                  blocks[blockIndex] = { ...blocks[blockIndex], children };
                                  setEditingInfoSheet({ ...editingInfoSheet, blocks });
                                }
                              },
                              undefined,
                              undefined,
                              false,
                              undefined,
                              true
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );

                const nextBlock = editingInfoSheet.blocks[index + 1];
                const canGroup = block.type !== "row-layout" && nextBlock && nextBlock.type !== "row-layout";

                return renderBlockEditor(
                  block,
                  index,
                  (updated) => {
                    const blocks = [...editingInfoSheet.blocks];
                    blocks[index] = updated;
                    setEditingInfoSheet({ ...editingInfoSheet, blocks });
                  },
                  () => {
                    setEditingInfoSheet({ ...editingInfoSheet, blocks: editingInfoSheet.blocks.filter((_, i) => i !== index) });
                  },
                  index > 0 ? () => {
                    const blocks = [...editingInfoSheet.blocks];
                    [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]];
                    setEditingInfoSheet({ ...editingInfoSheet, blocks });
                  } : undefined,
                  index < editingInfoSheet.blocks.length - 1 ? () => {
                    const blocks = [...editingInfoSheet.blocks];
                    [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
                    setEditingInfoSheet({ ...editingInfoSheet, blocks });
                  } : undefined,
                  canGroup,
                  canGroup ? () => {
                    const blocks = [...editingInfoSheet.blocks];
                    const block1 = blocks[index];
                    const block2 = blocks[index + 1];
                    const rowLayout: ContentBlock = {
                      id: `row-layout-${Date.now()}`,
                      type: "row-layout",
                      content: "",
                      children: [block1, block2]
                    };
                    const newBlocks = [
                      ...blocks.slice(0, index),
                      rowLayout,
                      ...blocks.slice(index + 2)
                    ];
                    setEditingInfoSheet({ ...editingInfoSheet, blocks: newBlocks });
                    toast({ title: "Blocks grouped", description: "Blocks will now display side-by-side." });
                  } : undefined
                );
              })}
            </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditingInfoSheet(null); setInfoSheetPreview(false); }}>Cancel</Button>
              <Button onClick={async () => {
                if (!editingInfoSheet) return;
                try {
                  const response = await fetch(`/api/n5/assignment-sections/${editingInfoSheet.sectionId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ informationSheet: editingInfoSheet.blocks }),
                  });
                  if (!response.ok) throw new Error("Failed to save");
                  await fetchAssignmentDetails(editingInfoSheet.assignmentId);
                  setEditingInfoSheet(null);
                  setInfoSheetPreview(false);
                  toast({ title: "Success", description: "Information sheet saved" });
                } catch (error) {
                  toast({ title: "Error", description: "Failed to save information sheet", variant: "destructive" });
                }
              }} data-testid="button-save-info-sheet">
                <Save className="w-4 h-4 mr-1" />
                Save Information Sheet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingPart} onOpenChange={() => { setEditingPart(null); setQuestionsModalOpen(false); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPart?.part ? "Edit Part" : "Add Part"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Part Label</Label>
                  <Select
                    value={editingPart?.part?.partLabel || newPart.partLabel}
                    onValueChange={value => {
                      if (editingPart?.part) {
                        setEditingPart({ ...editingPart, part: { ...editingPart.part, partLabel: value } });
                      } else {
                        setNewPart({ ...newPart, partLabel: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Part A</SelectItem>
                      <SelectItem value="B">Part B</SelectItem>
                      <SelectItem value="C">Part C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Max Marks</Label>
                  <Input
                    type="number"
                    value={editingPart?.part?.maxMarks ?? newPart.maxMarks}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      if (editingPart?.part) {
                        setEditingPart({ ...editingPart, part: { ...editingPart.part, maxMarks: val } });
                      } else {
                        setNewPart({ ...newPart, maxMarks: val });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={editingPart?.part?.orderIndex ?? newPart.orderIndex}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      if (editingPart?.part) {
                        setEditingPart({ ...editingPart, part: { ...editingPart.part, orderIndex: val } });
                      } else {
                        setNewPart({ ...newPart, orderIndex: val });
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={editingPart?.part?.title ?? newPart.title}
                  onChange={e => {
                    if (editingPart?.part) {
                      setEditingPart({ ...editingPart, part: { ...editingPart.part, title: e.target.value } });
                    } else {
                      setNewPart({ ...newPart, title: e.target.value });
                    }
                  }}
                  placeholder="e.g., Analysis and Design"
                />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingPart?.part?.isPractical ?? newPart.isPractical}
                    onCheckedChange={checked => {
                      if (editingPart?.part) {
                        setEditingPart({ ...editingPart, part: { ...editingPart.part, isPractical: checked } });
                      } else {
                        setNewPart({ ...newPart, isPractical: checked });
                      }
                    }}
                  />
                  <Label>Practical Work</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingPart?.part?.requiresUpload ?? newPart.requiresUpload}
                    onCheckedChange={checked => {
                      if (editingPart?.part) {
                        setEditingPart({ ...editingPart, part: { ...editingPart.part, requiresUpload: checked } });
                      } else {
                        setNewPart({ ...newPart, requiresUpload: checked });
                      }
                    }}
                  />
                  <Label>Requires Upload (screenshots/documents)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Input Style:</Label>
                  <Select
                    value={editingPart?.part?.inputStyle ?? newPart.inputStyle ?? "text"}
                    onValueChange={val => {
                      if (editingPart?.part) {
                        setEditingPart({ ...editingPart, part: { ...editingPart.part, inputStyle: val } });
                      } else {
                        setNewPart({ ...newPart, inputStyle: val });
                      }
                    }}
                  >
                    <SelectTrigger className="w-44 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Answer</SelectItem>
                      <SelectItem value="html-upload">HTML File Upload</SelectItem>
                      <SelectItem value="py-upload">Python File Upload</SelectItem>
                      <SelectItem value="design-choice">Design Choice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <Label className="text-base font-medium">Content Blocks</Label>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                        const newBlock: ContentBlock = { id: `block-${Date.now()}`, type: "heading", content: "" };
                        blocks.push(newBlock);
                        if (editingPart?.part) {
                          setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                        } else {
                          setNewPart({ ...newPart, contentBlocks: blocks });
                        }
                      }}
                      data-testid="add-heading-block"
                    >
                      <Type className="w-3 h-3 mr-1" />
                      Heading
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                        const newBlock: ContentBlock = { id: `block-${Date.now()}`, type: "text", content: "" };
                        blocks.push(newBlock);
                        if (editingPart?.part) {
                          setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                        } else {
                          setNewPart({ ...newPart, contentBlocks: blocks });
                        }
                      }}
                      data-testid="add-text-block"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Text
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                        const newBlock: ContentBlock = { id: `block-${Date.now()}`, type: "image", content: "" };
                        blocks.push(newBlock);
                        if (editingPart?.part) {
                          setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                        } else {
                          setNewPart({ ...newPart, contentBlocks: blocks });
                        }
                      }}
                      data-testid="add-image-block"
                    >
                      <Image className="w-3 h-3 mr-1" />
                      Image
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                        const newBlock: ContentBlock = { id: `block-${Date.now()}`, type: "code", content: "// Enter code here..." };
                        blocks.push(newBlock);
                        if (editingPart?.part) {
                          setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                        } else {
                          setNewPart({ ...newPart, contentBlocks: blocks });
                        }
                      }}
                      data-testid="add-code-block"
                    >
                      <Code className="w-3 h-3 mr-1" />
                      Code
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                        const newBlock: ContentBlock = { 
                          id: `block-${Date.now()}`, 
                          type: "data-table", 
                          content: "",
                          dataTable: {
                            tableName: "",
                            columns: [{ id: "col1", header: "Column 1" }],
                            rows: [{ id: "row1", cells: [""] }]
                          }
                        };
                        blocks.push(newBlock);
                        if (editingPart?.part) {
                          setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                        } else {
                          setNewPart({ ...newPart, contentBlocks: blocks });
                        }
                      }}
                      data-testid="add-table-block"
                    >
                      <Table className="w-3 h-3 mr-1" />
                      Table
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                        const newBlock: ContentBlock = { 
                          id: `block-${Date.now()}`, 
                          type: "pseudocode", 
                          content: "",
                          pseudocode: {
                            heading: "",
                            lines: [{ id: `line-${Date.now()}`, label: "1", code: "" }]
                          }
                        };
                        blocks.push(newBlock);
                        if (editingPart?.part) {
                          setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                        } else {
                          setNewPart({ ...newPart, contentBlocks: blocks });
                        }
                      }}
                      data-testid="add-pseudocode-block"
                    >
                      <FileCode className="w-3 h-3 mr-1" />
                      Pseudocode
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mb-3">
                  Add context, images, code snippets that students will see before the tasks.
                </p>
                
                {((editingPart?.part?.contentBlocks || newPart.contentBlocks) || []).length > 0 && (
                  <div className="space-y-3 mb-4">
                    {((editingPart?.part?.contentBlocks || newPart.contentBlocks) || []).map((block, index) => (
                      <div key={block.id} className="border rounded-lg p-3 bg-neutral-50 dark:bg-neutral-900">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium uppercase text-neutral-500">
                            {block.type === "heading" && "Heading"}
                            {block.type === "text" && "Text Block"}
                            {block.type === "image" && "Image Block"}
                            {block.type === "code" && "Code Block"}
                            {block.type === "data-table" && "Table Block"}
                            {block.type === "pseudocode" && "Pseudocode Block"}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])].filter((_, i) => i !== index);
                              if (editingPart?.part) {
                                setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                              } else {
                                setNewPart({ ...newPart, contentBlocks: blocks });
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                        {block.type === "heading" && (
                          <Input
                            value={block.content}
                            onChange={e => {
                              const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                              blocks[index] = { ...blocks[index], content: e.target.value };
                              if (editingPart?.part) {
                                setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                              } else {
                                setNewPart({ ...newPart, contentBlocks: blocks });
                              }
                            }}
                            className="font-medium"
                            placeholder="Section heading (e.g., Program Design (Pseudocode))"
                          />
                        )}
                        {block.type === "text" && (
                          <RichTextEditor
                            content={block.content}
                            onChange={(html) => {
                              const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                              blocks[index] = { ...blocks[index], content: html };
                              if (editingPart?.part) {
                                setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                              } else {
                                setNewPart({ ...newPart, contentBlocks: blocks });
                              }
                            }}
                            placeholder="Enter text content..."
                          />
                        )}
                        {block.type === "image" && (
                          <div
                            className="space-y-2"
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const file = e.dataTransfer.files[0];
                              if (file && file.type.startsWith("image/")) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                  blocks[index] = { ...blocks[index], content: ev.target?.result as string };
                                  if (editingPart?.part) {
                                    setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                  } else {
                                    setNewPart({ ...newPart, contentBlocks: blocks });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            onDragOver={(e) => e.preventDefault()}
                          >
                            {!block.content && (
                              <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-4 text-center text-sm text-neutral-500 dark:text-neutral-400 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors mb-2"
                                tabIndex={0}
                              >
                                Drop image here, paste (Ctrl+V), or use upload button
                              </div>
                            )}
                            {block.content && (
                              <div className="border rounded-md p-2 w-fit bg-white dark:bg-neutral-800 mb-2">
                                <img src={block.content} alt={block.caption || "Preview"} className="max-h-32 object-contain rounded" />
                              </div>
                            )}
                            <div className="flex gap-2 items-center">
                              <Input
                                placeholder="Paste image URL or paste image (Ctrl+V)..."
                                value={block.content?.startsWith("data:") ? "(pasted image)" : (block.content || "")}
                                onChange={e => {
                                  const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                  blocks[index] = { ...blocks[index], content: e.target.value };
                                  if (editingPart?.part) {
                                    setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                  } else {
                                    setNewPart({ ...newPart, contentBlocks: blocks });
                                  }
                                }}
                                onPaste={(e) => {
                                  const items = e.clipboardData?.items;
                                  if (!items) return;
                                  for (const item of Array.from(items)) {
                                    if (item.type.startsWith("image/")) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const file = item.getAsFile();
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                        blocks[index] = { ...blocks[index], content: ev.target?.result as string };
                                        if (editingPart?.part) {
                                          setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                        } else {
                                          setNewPart({ ...newPart, contentBlocks: blocks });
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                      return;
                                    }
                                  }
                                }}
                                className="flex-1 h-8 text-sm"
                                readOnly={block.content?.startsWith("data:")}
                              />
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                      blocks[index] = { ...blocks[index], content: ev.target?.result as string };
                                      if (editingPart?.part) {
                                        setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                      } else {
                                        setNewPart({ ...newPart, contentBlocks: blocks });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                />
                                <Button variant="outline" size="sm" type="button">
                                  <Upload className="h-3 w-3" />
                                </Button>
                              </div>
                              {block.content && (
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                  const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                  blocks[index] = { ...blocks[index], content: "" };
                                  if (editingPart?.part) {
                                    setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                  } else {
                                    setNewPart({ ...newPart, contentBlocks: blocks });
                                  }
                                }}>
                                  <X className="w-3 h-3 mr-1" /> Clear
                                </Button>
                              )}
                            </div>
                            <Input
                              value={block.caption || ""}
                              onChange={e => {
                                const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                blocks[index] = { ...blocks[index], caption: e.target.value };
                                if (editingPart?.part) {
                                  setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                } else {
                                  setNewPart({ ...newPart, contentBlocks: blocks });
                                }
                              }}
                              placeholder="Caption (optional)..."
                            />
                          </div>
                        )}
                        {block.type === "code" && (
                          <Textarea
                            value={block.content}
                            onChange={e => {
                              const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                              blocks[index] = { ...blocks[index], content: e.target.value };
                              if (editingPart?.part) {
                                setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                              } else {
                                setNewPart({ ...newPart, contentBlocks: blocks });
                              }
                            }}
                            placeholder="Enter code..."
                            rows={4}
                            className="font-mono text-sm"
                          />
                        )}
                        {block.type === "data-table" && (
                          <div className="space-y-3">
                            <div className="flex gap-3 items-center">
                              <Input
                                value={block.dataTable?.tableName || ""}
                                onChange={e => {
                                  const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                  blocks[index] = { ...blocks[index], dataTable: { ...blocks[index].dataTable, tableName: e.target.value } };
                                  if (editingPart?.part) {
                                    setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                  } else {
                                    setNewPart({ ...newPart, contentBlocks: blocks });
                                  }
                                }}
                                placeholder="Table name (optional)..."
                                className="flex-1"
                              />
                              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={block.dataTable?.hideHeaders || false}
                                  onChange={e => {
                                    const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                    blocks[index] = { ...blocks[index], dataTable: { ...blocks[index].dataTable, hideHeaders: e.target.checked } };
                                    if (editingPart?.part) {
                                      setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                    } else {
                                      setNewPart({ ...newPart, contentBlocks: blocks });
                                    }
                                  }}
                                  className="rounded"
                                />
                                Hide headers
                              </label>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="min-w-full border">
                                {!block.dataTable?.hideHeaders && (
                                <thead>
                                  <tr className="bg-neutral-100 dark:bg-neutral-800">
                                    {(block.dataTable?.columns || []).map((col: any, colIdx: number) => (
                                      <th key={col.id} className="border px-2 py-1">
                                        <Input
                                          value={col.header}
                                          onChange={e => {
                                            const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                            const newCols = [...(blocks[index].dataTable?.columns || [])];
                                            newCols[colIdx] = { ...newCols[colIdx], header: e.target.value };
                                            blocks[index] = { ...blocks[index], dataTable: { ...blocks[index].dataTable, columns: newCols } };
                                            if (editingPart?.part) {
                                              setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                            } else {
                                              setNewPart({ ...newPart, contentBlocks: blocks });
                                            }
                                          }}
                                          className="h-7 text-sm min-w-20"
                                          placeholder="Header"
                                        />
                                      </th>
                                    ))}
                                    <th className="border px-1 w-8">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                          const newCols = [...(blocks[index].dataTable?.columns || []), { id: `col-${Date.now()}`, header: "" }];
                                          const newRows = (blocks[index].dataTable?.rows || []).map((r: any) => ({ ...r, cells: [...r.cells, ""] }));
                                          blocks[index] = { ...blocks[index], dataTable: { ...blocks[index].dataTable, columns: newCols, rows: newRows } };
                                          if (editingPart?.part) {
                                            setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                          } else {
                                            setNewPart({ ...newPart, contentBlocks: blocks });
                                          }
                                        }}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </th>
                                  </tr>
                                </thead>
                                )}
                                <tbody>
                                  {(block.dataTable?.rows || []).map((row: any, rowIdx: number) => (
                                    <tr key={row.id}>
                                      {(row.cells || []).map((cell: string, cellIdx: number) => (
                                        <td key={cellIdx} className="border px-1 py-1 align-top">
                                          <Textarea
                                            value={cell}
                                            onChange={e => {
                                              const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                              const newRows = [...(blocks[index].dataTable?.rows || [])];
                                              const newCells = [...newRows[rowIdx].cells];
                                              newCells[cellIdx] = e.target.value;
                                              newRows[rowIdx] = { ...newRows[rowIdx], cells: newCells };
                                              blocks[index] = { ...blocks[index], dataTable: { ...blocks[index].dataTable, rows: newRows } };
                                              if (editingPart?.part) {
                                                setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                              } else {
                                                setNewPart({ ...newPart, contentBlocks: blocks });
                                              }
                                            }}
                                            className="text-sm min-w-20 min-h-[32px] resize-y"
                                            rows={1}
                                          />
                                        </td>
                                      ))}
                                      <td className="border px-1 w-8">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                            const newRows = blocks[index].dataTable?.rows.filter((_: any, i: number) => i !== rowIdx) || [];
                                            blocks[index] = { ...blocks[index], dataTable: { ...blocks[index].dataTable, rows: newRows } };
                                            if (editingPart?.part) {
                                              setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                            } else {
                                              setNewPart({ ...newPart, contentBlocks: blocks });
                                            }
                                          }}
                                        >
                                          <X className="w-3 h-3 text-red-500" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                const colCount = blocks[index].dataTable?.columns?.length || 1;
                                const newRow = { id: `row-${Date.now()}`, cells: Array(colCount).fill("") };
                                const newRows = [...(blocks[index].dataTable?.rows || []), newRow];
                                blocks[index] = { ...blocks[index], dataTable: { ...blocks[index].dataTable, rows: newRows } };
                                if (editingPart?.part) {
                                  setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                } else {
                                  setNewPart({ ...newPart, contentBlocks: blocks });
                                }
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Row
                            </Button>
                          </div>
                        )}
                        {block.type === "pseudocode" && (
                          <div className="space-y-2">
                            <div className="overflow-x-auto">
                              <table className="w-full border border-collapse font-mono text-sm">
                                <thead>
                                  <tr>
                                    <th colSpan={2} className="border px-3 py-2 text-left bg-neutral-100 dark:bg-neutral-800">
                                      <Input
                                        value={block.pseudocode?.heading || ""}
                                        onChange={e => {
                                          const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                          blocks[index] = { 
                                            ...blocks[index], 
                                            pseudocode: { 
                                              ...blocks[index].pseudocode!, 
                                              heading: e.target.value 
                                            } 
                                          };
                                          if (editingPart?.part) {
                                            setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                          } else {
                                            setNewPart({ ...newPart, contentBlocks: blocks });
                                          }
                                        }}
                                        className="h-8 text-sm font-mono"
                                        placeholder="Heading (e.g., PROCEDURE showWinner)"
                                      />
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(block.pseudocode?.lines || []).map((line, lineIdx) => (
                                    <tr key={line.id}>
                                      <td className="border px-2 py-1 w-20 text-right align-top">
                                        <Input
                                          value={line.label}
                                          onChange={e => {
                                            const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                            const newLines = [...(blocks[index].pseudocode?.lines || [])];
                                            newLines[lineIdx] = { ...newLines[lineIdx], label: e.target.value };
                                            blocks[index] = { 
                                              ...blocks[index], 
                                              pseudocode: { ...blocks[index].pseudocode!, lines: newLines } 
                                            };
                                            if (editingPart?.part) {
                                              setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                            } else {
                                              setNewPart({ ...newPart, contentBlocks: blocks });
                                            }
                                          }}
                                          className="h-7 text-sm font-mono w-16 text-right"
                                          placeholder="#"
                                        />
                                      </td>
                                      <td className="border px-2 py-1">
                                        <div className="flex gap-1">
                                          <Input
                                            value={line.code}
                                            onChange={e => {
                                              const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                              const newLines = [...(blocks[index].pseudocode?.lines || [])];
                                              newLines[lineIdx] = { ...newLines[lineIdx], code: e.target.value };
                                              blocks[index] = { 
                                                ...blocks[index], 
                                                pseudocode: { ...blocks[index].pseudocode!, lines: newLines } 
                                              };
                                              if (editingPart?.part) {
                                                setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                              } else {
                                                setNewPart({ ...newPart, contentBlocks: blocks });
                                              }
                                            }}
                                            onKeyDown={e => {
                                              if (e.key === 'Tab') {
                                                e.preventDefault();
                                                const input = e.target as HTMLInputElement;
                                                const start = input.selectionStart || 0;
                                                const end = input.selectionEnd || 0;
                                                const indent = '    ';
                                                const newValue = line.code.substring(0, start) + indent + line.code.substring(end);
                                                const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                                const newLines = [...(blocks[index].pseudocode?.lines || [])];
                                                newLines[lineIdx] = { ...newLines[lineIdx], code: newValue };
                                                blocks[index] = { 
                                                  ...blocks[index], 
                                                  pseudocode: { ...blocks[index].pseudocode!, lines: newLines } 
                                                };
                                                if (editingPart?.part) {
                                                  setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                                } else {
                                                  setNewPart({ ...newPart, contentBlocks: blocks });
                                                }
                                                setTimeout(() => {
                                                  input.selectionStart = input.selectionEnd = start + indent.length;
                                                }, 0);
                                              }
                                            }}
                                            className="h-7 text-sm font-mono flex-1"
                                            placeholder="Code line..."
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => {
                                              const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                              const newLines = (blocks[index].pseudocode?.lines || []).filter((_: any, i: number) => i !== lineIdx);
                                              blocks[index] = { 
                                                ...blocks[index], 
                                                pseudocode: { ...blocks[index].pseudocode!, lines: newLines } 
                                              };
                                              if (editingPart?.part) {
                                                setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                              } else {
                                                setNewPart({ ...newPart, contentBlocks: blocks });
                                              }
                                            }}
                                          >
                                            <X className="w-3 h-3 text-red-500" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const blocks = [...((editingPart?.part?.contentBlocks || newPart.contentBlocks) || [])];
                                const currentLines = blocks[index].pseudocode?.lines || [];
                                const lastLabel = currentLines.length > 0 ? currentLines[currentLines.length - 1].label : "0";
                                let nextLabel = String(currentLines.length + 1);
                                
                                // Smart increment: handle refinement numbers like 1.1 -> 1.2
                                if (lastLabel.includes('.')) {
                                  const parts = lastLabel.split('.');
                                  const lastPart = parseInt(parts[parts.length - 1], 10);
                                  if (!isNaN(lastPart)) {
                                    parts[parts.length - 1] = String(lastPart + 1);
                                    nextLabel = parts.join('.');
                                  }
                                } else {
                                  const num = parseInt(lastLabel, 10);
                                  if (!isNaN(num)) {
                                    nextLabel = String(num + 1);
                                  }
                                }
                                
                                const newLine = { id: `line-${Date.now()}`, label: nextLabel, code: "" };
                                const newLines = [...currentLines, newLine];
                                blocks[index] = { 
                                  ...blocks[index], 
                                  pseudocode: { ...blocks[index].pseudocode!, lines: newLines } 
                                };
                                if (editingPart?.part) {
                                  setEditingPart({ ...editingPart, part: { ...editingPart.part, contentBlocks: blocks } });
                                } else {
                                  setNewPart({ ...newPart, contentBlocks: blocks });
                                }
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Line
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Tasks</span>
                    {((editingPart?.part?.subQuestions || newPart.subQuestions || []).length > 0) && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        {(editingPart?.part?.subQuestions || newPart.subQuestions || []).length} tasks
                        ({(editingPart?.part?.subQuestions || newPart.subQuestions || []).reduce((sum: number, q: AssignmentQuestion) => sum + q.maxMarks, 0)} marks)
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestionsModalOpen(true)}
                    data-testid="button-open-questions-modal"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {(editingPart?.part?.subQuestions || newPart.subQuestions || []).length > 0 ? "Edit" : "Add"} Tasks
                  </Button>
                </div>
                {(editingPart?.part?.subQuestions || newPart.subQuestions || []).length === 0 && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Click "Add Tasks" to add tasks with content blocks, marking criteria, and AI guidance.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditingPart(null); setQuestionsModalOpen(false); }}>Cancel</Button>
              <Button onClick={editingPart?.part ? handleUpdatePart : handleCreatePart}>
                {editingPart?.part ? "Save" : "Add Part"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Questions Editor Modal */}
        <Dialog open={questionsModalOpen} onOpenChange={setQuestionsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Tasks - Part {editingPart?.part?.partLabel || newPart.partLabel}
              </DialogTitle>
              <DialogDescription>
                Add tasks with content blocks, marking criteria, and AI guidance
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <AssignmentQuestionEditor
                questions={editingPart?.part?.subQuestions || newPart.subQuestions || []}
                onChange={(questions) => {
                  const totalMarks = questions.reduce((sum, q) => sum + q.maxMarks, 0);
                  if (editingPart?.part) {
                    setEditingPart({ 
                      ...editingPart, 
                      part: { 
                        ...editingPart.part, 
                        subQuestions: questions,
                        maxMarks: totalMarks
                      } 
                    });
                  } else {
                    setNewPart({ 
                      ...newPart, 
                      subQuestions: questions,
                      maxMarks: totalMarks
                    });
                  }
                }}
                isAssignment={true}
                questionNumberPrefix={(() => {
                  if (!editingPart?.sectionId) return undefined;
                  const assignment = assignments.find(a => a.sections?.some(s => s.id === editingPart.sectionId));
                  if (!assignment?.sections) return undefined;
                  const sorted = [...assignment.sections].sort((a, b) => a.orderIndex - b.orderIndex);
                  const idx = sorted.findIndex(s => s.id === editingPart.sectionId);
                  return idx >= 0 ? idx + 1 : undefined;
                })()}
                questionStartIndex={(() => {
                  if (!editingPart?.sectionId) return 0;
                  const section = assignments.flatMap(a => a.sections || []).find(s => s.id === editingPart.sectionId);
                  if (!section?.parts) return 0;
                  const sortedParts = [...section.parts].sort((a, b) => a.orderIndex - b.orderIndex);
                  if (editingPart?.part?.id) {
                    const currentPartIndex = sortedParts.findIndex(p => p.id === editingPart.part!.id);
                    if (currentPartIndex <= 0) return 0;
                    let count = 0;
                    for (let i = 0; i < currentPartIndex; i++) {
                      count += (sortedParts[i].subQuestions?.length || 0);
                    }
                    return count;
                  }
                  let count = 0;
                  for (const p of sortedParts) {
                    count += (p.subQuestions?.length || 0);
                  }
                  return count;
                })()}
              />
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                setQuestionsModalOpen(false);
                if (editingPart?.part?.id) {
                  try {
                    const response = await fetch(`/api/n5/assignment-parts/${editingPart.part.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(editingPart.part),
                    });
                    if (!response.ok) throw new Error("Failed to save");
                    const section = assignments.flatMap(a => a.sections || []).find(s => s.id === editingPart.sectionId);
                    if (section) {
                      await fetchAssignmentDetails(section.assignmentId);
                    }
                    toast({ title: "Saved", description: "Tasks saved successfully" });
                  } catch (error) {
                    toast({ title: "Error", description: "Failed to save tasks", variant: "destructive" });
                  }
                }
              }}>
                <Save className="w-4 h-4 mr-1" />
                Save Questions
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Evidence Checklist Editor Dialog */}
        <Dialog open={checklistEditorOpen} onOpenChange={(open) => {
          setChecklistEditorOpen(open);
          if (!open) {
            setEditingChecklistAssignment(null);
            setNewChecklistItem("");
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Evidence Checklist
              </DialogTitle>
              <DialogDescription>
                Define the evidence students need to provide for each section
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Add new item */}
              <div className="flex gap-2 flex-wrap">
                <Select value={newChecklistSection} onValueChange={setNewChecklistSection}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map(st => (
                      <SelectItem key={st.id} value={st.id}>{st.id.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Part"
                  value={newChecklistPartLabel}
                  onChange={(e) => setNewChecklistPartLabel(e.target.value.toUpperCase())}
                  className="w-16"
                  data-testid="input-new-checklist-part"
                />
                <Input
                  placeholder="Q#"
                  value={newChecklistQuestionNumber}
                  onChange={(e) => setNewChecklistQuestionNumber(e.target.value)}
                  className="w-16"
                  data-testid="input-new-checklist-question"
                />
                <Input
                  placeholder="Enter evidence description..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  className="flex-1 min-w-48"
                  data-testid="input-new-checklist-item"
                  onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                />
                <Button onClick={addChecklistItem} disabled={!newChecklistItem.trim()} data-testid="button-add-checklist-item">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Checklist items by section and part */}
              {SECTION_TYPES.map(st => {
                const sectionItems = (editingChecklistAssignment?.evidenceChecklist || []).filter(item => item.sectionType === st.id);
                if (sectionItems.length === 0) return null;
                const partLabels = Array.from(new Set(sectionItems.map(item => item.partLabel || "A"))).sort();
                return (
                  <div key={st.id} className="space-y-3">
                    <h4 className="font-medium text-sm text-neutral-600 dark:text-neutral-400">{st.name}</h4>
                    {partLabels.map(partLabel => {
                      const partItems = sectionItems.filter(item => (item.partLabel || "A") === partLabel);
                      return (
                        <div key={partLabel} className="ml-2">
                          <h5 className="text-xs font-semibold text-neutral-500 mb-1">Part {partLabel}</h5>
                          <table className="w-full border rounded">
                            <thead>
                              <tr className="bg-neutral-100 dark:bg-neutral-800">
                                <th className="text-left px-3 py-2 text-sm font-medium w-20">Q#</th>
                                <th className="text-left px-3 py-2 text-sm font-medium">Evidence Required</th>
                                <th className="w-20"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {partItems.map(item => (
                                <tr key={item.id} className="border-t">
                                  {editingChecklistItem?.id === item.id ? (
                                    <>
                                      <td className="px-2 py-1">
                                        <Input
                                          value={editingChecklistItem.questionNumber}
                                          onChange={(e) => setEditingChecklistItem({...editingChecklistItem, questionNumber: e.target.value})}
                                          className="w-12 h-8 text-sm"
                                        />
                                      </td>
                                      <td className="px-2 py-1">
                                        <Input
                                          value={editingChecklistItem.description}
                                          onChange={(e) => setEditingChecklistItem({...editingChecklistItem, description: e.target.value})}
                                          className="h-8 text-sm"
                                        />
                                      </td>
                                      <td className="px-2 flex gap-1">
                                        <Button size="sm" variant="ghost" onClick={() => updateChecklistItem(editingChecklistItem)}>
                                          <Check className="h-4 w-4 text-green-500" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingChecklistItem(null)}>
                                          <X className="h-4 w-4 text-neutral-500" />
                                        </Button>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="px-3 py-2 text-sm font-medium w-20">{item.questionNumber || "-"}</td>
                                      <td className="px-3 py-2 text-sm">{item.description}</td>
                                      <td className="px-2 flex gap-1">
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          onClick={() => setEditingChecklistItem({...item})}
                                          data-testid={`button-edit-checklist-${item.id}`}
                                        >
                                          <Pencil className="h-4 w-4 text-neutral-500" />
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          onClick={() => removeChecklistItem(item.id)}
                                          data-testid={`button-remove-checklist-${item.id}`}
                                        >
                                          <X className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              
              {(!editingChecklistAssignment?.evidenceChecklist || editingChecklistAssignment.evidenceChecklist.length === 0) && (
                <p className="text-neutral-500 text-sm text-center py-4 border border-dashed rounded">
                  No checklist items yet. Add evidence requirements above.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChecklistEditorOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function PartCard({
  part,
  onEdit,
  onDelete,
  onUploadResource,
  onDeleteResource,
}: {
  part: AssignmentPart;
  onEdit: () => void;
  onDelete: () => void;
  onUploadResource: (file: File, description: string) => void;
  onDeleteResource: (resourceId: string) => void;
}) {
  const [uploadDescription, setUploadDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const allowedExtensions = ".accdb,.mdb,.html,.htm,.css,.js,.sql,.txt,.pdf,.zip,.py,.vb,.jpg,.jpeg,.png,.gif";

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    await onUploadResource(file, uploadDescription);
    setIsUploading(false);
    setUploadDescription("");
  }, [onUploadResource, uploadDescription]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await uploadFile(files[i]);
      }
      e.target.value = "";
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await uploadFile(files[i]);
      }
    }
  }, [uploadFile]);

  return (
    <div className="border rounded p-3 bg-white dark:bg-neutral-900" data-testid={`part-${part.id}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">Part {part.partLabel}</span>
          {part.title && <span className="text-neutral-500">- {part.title}</span>}
          <span className="text-sm text-neutral-500">{part.maxMarks} marks</span>
          {part.isPractical && (
            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded">
              Practical
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Part {part.partLabel}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete this part and all its resources.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t">
        <span className="text-sm font-medium mb-2 block">Starter Files</span>

        <div className="flex items-center gap-2 mb-2">
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`
              flex items-center gap-2 border border-dashed rounded px-3 py-2 cursor-pointer transition-colors flex-1
              ${isDragOver
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500"
              }
              ${isUploading ? "opacity-60 pointer-events-none" : ""}
            `}
            data-testid={`dropzone-starter-files-${part.id}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
              accept={allowedExtensions}
              multiple
            />
            <Upload className={`h-4 w-4 shrink-0 ${isDragOver ? "text-blue-500" : "text-neutral-400"}`} />
            {isUploading ? (
              <span className="text-sm text-neutral-500">Uploading...</span>
            ) : isDragOver ? (
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Drop files here</span>
            ) : (
              <span className="text-sm text-neutral-500">
                Drop files or <span className="text-blue-600 dark:text-blue-400 font-medium">browse</span>
              </span>
            )}
          </div>
          <Input
            type="text"
            value={uploadDescription}
            onChange={e => setUploadDescription(e.target.value)}
            placeholder="Description (optional)"
            className="h-9 text-xs w-40 shrink-0"
            data-testid={`input-resource-description-${part.id}`}
          />
        </div>
        
        {part.resources && part.resources.length > 0 ? (
          <div className="space-y-1">
            {part.resources.map(resource => (
              <div key={resource.id} className="flex items-center justify-between text-sm bg-neutral-50 dark:bg-neutral-800 p-2 rounded">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-neutral-500" />
                  <a
                    href={resource.fileUrl}
                    download={resource.fileName}
                    className="text-blue-600 hover:underline"
                  >
                    {resource.fileName}
                  </a>
                  {resource.description && (
                    <span className="text-neutral-500">- {resource.description}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteResource(resource.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No starter files uploaded</p>
        )}
      </div>
    </div>
  );
}
