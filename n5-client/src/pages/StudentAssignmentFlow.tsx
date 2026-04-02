import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, Pause, Play, ChevronRight, Upload, FileText, Download, Image, Code, AlertCircle, CheckCircle, Lock, XCircle } from "lucide-react";
import { renderQuestionInput, SubQuestion } from "@/components/QuestionInput";
import RichTextBlock from "@/components/RichTextBlock";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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
  requiresUpload?: boolean;
  inputStyle?: string | null;
  aiGradingGuidance: string | null;
  subQuestions: any;
  resources?: AssignmentResource[];
}

interface ChecklistItem {
  id: string;
  sectionType: string;
  description: string;
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

interface Assignment {
  id: string;
  year: number;
  title: string;
  totalMarks: number;
  totalTimeMinutes: number;
  isActive: boolean;
  evidenceChecklist?: ChecklistItem[];
  sections?: AssignmentSection[];
}

interface AssignmentAttempt {
  id: string;
  assignmentId: string;
  localStudentId: string;
  chosenOptionalSection: string;
  status: string;
  timeRemainingSeconds: number;
  currentSectionId: string | null;
  currentPartId: string | null;
  completedPartIds: string[];
}

interface AssignmentResponse {
  id: string;
  attemptId: string;
  partId: string;
  subQuestionId: string | null;
  textAnswer: string | null;
  codeAnswer: string | null;
  screenshotUrls: string[];
  drawingData: string | null;
  userInputs: any;
}

export default function StudentAssignmentFlow() {
  const { id: assignmentId } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [attempt, setAttempt] = useState<AssignmentAttempt | null>(null);
  const [responses, setResponses] = useState<Map<string, AssignmentResponse>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [showSectionChoice, setShowSectionChoice] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const infoSheetSeenSectionsRef = useRef<Set<string>>(new Set());
  
  const [currentPart, setCurrentPart] = useState<AssignmentPart | null>(null);
  const [currentSection, setCurrentSection] = useState<AssignmentSection | null>(null);
  
  const [textAnswer, setTextAnswer] = useState("");
  const [codeAnswer, setCodeAnswer] = useState("");
  const [designChoice, setDesignChoice] = useState<"pseudocode" | "diagram">("pseudocode");
  const [diagramAnswer, setDiagramAnswer] = useState("");
  const [isDraggingHtml, setIsDraggingHtml] = useState(false);
  const [isDraggingPy, setIsDraggingPy] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userInputs, setUserInputs] = useState<Record<string, Record<string, string>>>({});

  const getOrCreateStudentId = useCallback((): string => {
    let studentId = localStorage.getItem("local_student_id");
    if (!studentId) {
      studentId = `student_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("local_student_id", studentId);
    }
    return studentId;
  }, []);

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  useEffect(() => {
    if (attempt && !isPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            handleTimeUp();
            return 0;
          }
          if (newTime % 60 === 0) {
            saveProgress();
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [attempt, isPaused]);

  const fetchAssignment = async () => {
    if (!assignmentId) return;
    
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`);
      if (!response.ok) throw new Error("Failed to fetch assignment");
      const data = await response.json();
      setAssignment(data);

      const localStudentId = getOrCreateStudentId();
      
      let attemptData: AssignmentAttempt | null = null;
      
      try {
        const serverAttemptsResponse = await fetch(`/api/assignment-attempts/student/${localStudentId}`);
        if (serverAttemptsResponse.ok) {
          const serverAttempts = await serverAttemptsResponse.json();
          const matchingAttempt = serverAttempts.find((a: AssignmentAttempt) => a.assignmentId === assignmentId && a.status !== "cancelled");
          if (matchingAttempt) {
            attemptData = matchingAttempt;
            localStorage.setItem(`assignment_attempt_${assignmentId}`, JSON.stringify(matchingAttempt));
          }
        }
      } catch (e) {
        console.warn("Failed to fetch server attempts, checking localStorage:", e);
      }
      
      if (!attemptData) {
        const storedAttempt = localStorage.getItem(`assignment_attempt_${assignmentId}`);
        if (storedAttempt) {
          try {
            attemptData = JSON.parse(storedAttempt);
          } catch {}
        }
      }
      
      if (attemptData) {
        setAttempt(attemptData);
        setTimeRemaining(attemptData.timeRemainingSeconds);
        setIsPaused(attemptData.status === "paused");
        loadCurrentPartState(data, attemptData);
      } else {
        setShowSectionChoice(true);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load assignment", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const maybeShowInfoSheet = (section: AssignmentSection) => {
    if (section.informationSheet && section.informationSheet.length > 0 && !infoSheetSeenSectionsRef.current.has(section.id)) {
      infoSheetSeenSectionsRef.current.add(section.id);
      setShowInfoSheet(true);
    }
  };

  const loadCurrentPartState = (assignment: Assignment, attempt: AssignmentAttempt) => {
    if (!assignment.sections) return;
    
    const relevantSections = assignment.sections.filter(s => 
      s.isCompulsory || s.sectionType === attempt.chosenOptionalSection
    ).sort((a, b) => a.orderIndex - b.orderIndex);
    
    const allParts = relevantSections.flatMap(section => 
      (section.parts || []).sort((a, b) => a.orderIndex - b.orderIndex).map(part => ({
        ...part,
        sectionRef: section
      }))
    );
    
    const completedPartIds = attempt.completedPartIds || [];
    
    const nextAllowedPart = allParts.find(p => !completedPartIds.includes(p.id));
    
    if (!nextAllowedPart) {
      return;
    }
    
    const isCurrentPartValid = attempt.currentPartId === nextAllowedPart.id;
    
    if (isCurrentPartValid || !attempt.currentPartId) {
      setCurrentSection(nextAllowedPart.sectionRef);
      setCurrentPart(nextAllowedPart);
      loadResponseForPart(attempt.id, nextAllowedPart.id);
      maybeShowInfoSheet(nextAllowedPart.sectionRef);
      
      if (!isCurrentPartValid && attempt.currentPartId !== nextAllowedPart.id) {
        const updatedAttempt = { ...attempt, currentPartId: nextAllowedPart.id, currentSectionId: nextAllowedPart.sectionRef.id };
        setAttempt(updatedAttempt);
        localStorage.setItem(`assignment_attempt_${assignment.id}`, JSON.stringify(updatedAttempt));
      }
    } else {
      setCurrentSection(nextAllowedPart.sectionRef);
      setCurrentPart(nextAllowedPart);
      loadResponseForPart(attempt.id, nextAllowedPart.id);
      maybeShowInfoSheet(nextAllowedPart.sectionRef);
      
      const updatedAttempt = { ...attempt, currentPartId: nextAllowedPart.id, currentSectionId: nextAllowedPart.sectionRef.id };
      setAttempt(updatedAttempt);
      localStorage.setItem(`assignment_attempt_${assignment.id}`, JSON.stringify(updatedAttempt));
    }
  };

  const loadResponseForPart = async (attemptId: string, partId: string) => {
    try {
      const response = await fetch(`/api/assignment-attempts/${attemptId}/responses`);
      if (response.ok) {
        const data = await response.json();
        const partResponses = data.filter((r: AssignmentResponse) => r.partId === partId);
        
        if (partResponses.length > 0) {
          const subQuestionResponses = partResponses.filter((r: AssignmentResponse) => r.subQuestionId);
          const mainResponse = partResponses.find((r: AssignmentResponse) => !r.subQuestionId);
          
          if (subQuestionResponses.length > 0) {
            const rebuiltInputs: Record<string, Record<string, string>> = {};
            for (const subResp of subQuestionResponses) {
              if (subResp.userInputs && typeof subResp.userInputs === 'object') {
                rebuiltInputs[subResp.subQuestionId!] = subResp.userInputs as Record<string, string>;
              }
              setResponses(prev => new Map(prev).set(`${partId}:${subResp.subQuestionId}`, subResp));
            }
            setUserInputs(rebuiltInputs);
            setTextAnswer("");
            setCodeAnswer("");
          } else if (mainResponse) {
            setTextAnswer(mainResponse.textAnswer || "");
            setCodeAnswer(mainResponse.codeAnswer || "");
            if (mainResponse.userInputs) {
              setUserInputs(mainResponse.userInputs);
            } else {
              setUserInputs({});
            }
            setResponses(prev => new Map(prev).set(partId, mainResponse));
          }
        } else {
          setTextAnswer("");
          setCodeAnswer("");
          setUserInputs({});
        }
      }
    } catch (error) {
      console.error("Failed to load response:", error);
    }
  };

  const handleStartWithSection = async (optionalSection: "database" | "web") => {
    if (!assignment) return;
    
    const localStudentId = getOrCreateStudentId();
    const studentToken = localStorage.getItem("studentToken");
    
    try {
      const bodyData: any = {
        assignmentId: assignment.id,
        localStudentId,
        chosenOptionalSection: optionalSection,
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (studentToken) headers["Authorization"] = `Bearer ${studentToken}`;

      const response = await fetch("/api/assignment-attempts/start", {
        method: "POST",
        headers,
        body: JSON.stringify(bodyData),
      });
      
      if (!response.ok) throw new Error("Failed to start assignment");
      const attemptData = await response.json();
      
      localStorage.setItem(`assignment_attempt_${assignment.id}`, JSON.stringify(attemptData));
      setAttempt(attemptData);
      setTimeRemaining(attemptData.timeRemainingSeconds);
      setShowSectionChoice(false);
      
      loadCurrentPartState(assignment, attemptData);
    } catch (error) {
      toast({ title: "Error", description: "Failed to start assignment", variant: "destructive" });
    }
  };

  const handleTimeUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    toast({ title: "Time's Up!", description: "Your assignment time has expired.", variant: "destructive" });
    saveProgress();
    handleSubmitAssignment();
  };

  const saveProgress = async () => {
    if (!attempt) return;
    
    const updatedAttempt = {
      ...attempt,
      timeRemainingSeconds: timeRemaining,
      status: isPaused ? "paused" : "in_progress",
    };
    
    localStorage.setItem(`assignment_attempt_${attempt.assignmentId}`, JSON.stringify(updatedAttempt));
    
    try {
      await fetch(`/api/assignment-attempts/${attempt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeRemainingSeconds: timeRemaining,
          status: isPaused ? "paused" : "in_progress",
        }),
      });
    } catch (error) {
      console.error("Failed to save progress to server:", error);
    }
  };

  const handlePause = () => {
    setShowPauseConfirm(true);
  };

  const confirmPause = async () => {
    setIsPaused(true);
    setShowPauseConfirm(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    await saveProgress();
    await saveCurrentResponse();
    
    toast({ title: "Assignment Paused", description: "Your progress has been saved. You can resume anytime." });
  };

  const handleResume = async () => {
    setIsPaused(false);
    
    const updatedAttempt = {
      ...attempt!,
      timeRemainingSeconds: timeRemaining,
      status: "in_progress",
    };
    
    localStorage.setItem(`assignment_attempt_${attempt!.assignmentId}`, JSON.stringify(updatedAttempt));
    setAttempt(updatedAttempt);
    
    try {
      await fetch(`/api/assignment-attempts/${attempt!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      });
    } catch (error) {
      console.error("Failed to update attempt status:", error);
    }
  };

  const confirmCancelAssignment = async () => {
    setShowCancelConfirm(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (attempt) {
      localStorage.removeItem(`assignment_attempt_${attempt.assignmentId}`);
      try {
        await fetch(`/api/assignment-attempts/${attempt.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        });
      } catch (error) {
        console.error("Failed to cancel attempt:", error);
      }
      toast({ title: "Assignment Cancelled", description: "Your attempt has been cancelled." });
      setLocation("/assignments");
    }
  };

  const saveCurrentResponse = async () => {
    if (!attempt || !currentPart) return;
    
    setIsSaving(true);
    try {
      const subQuestions = currentPart.subQuestions as any[] | undefined;
      
      const flattenLeafSubs = (qs: any[]): any[] => {
        const leaves: any[] = [];
        for (const q of qs) {
          if (q.subParts && q.subParts.length > 0) {
            leaves.push(...flattenLeafSubs(q.subParts));
          } else {
            leaves.push(q);
          }
        }
        return leaves;
      };
      
      if (subQuestions && Array.isArray(subQuestions) && subQuestions.length > 0) {
        const leafSubs = flattenLeafSubs(subQuestions);
        for (const subQ of leafSubs) {
          const subQInputs = userInputs[subQ.id] || {};
          if (Object.keys(subQInputs).length === 0) continue;
          
          const formData = new FormData();
          formData.append("attemptId", attempt.id);
          formData.append("partId", currentPart.id);
          formData.append("subQuestionId", subQ.id);
          
          const mainText = subQInputs["main"] || "";
          if (mainText) formData.append("textAnswer", mainText);
          
          if (subQInputs["screenshots"]) {
            try {
              const screenshotData = JSON.parse(subQInputs["screenshots"]);
              if (Array.isArray(screenshotData) && screenshotData.length > 0) {
                formData.append("existingScreenshots", subQInputs["screenshots"]);
              }
            } catch (e) {}
          }
          
          formData.append("userInputs", JSON.stringify(subQInputs));
          
          const response = await fetch("/api/assignment-responses", {
            method: "POST",
            body: formData,
          });
          
          if (!response.ok) throw new Error("Failed to save sub-question response");
          const savedResponse = await response.json();
          setResponses(prev => new Map(prev).set(`${currentPart.id}:${subQ.id}`, savedResponse));
        }
      } else {
        const formData = new FormData();
        formData.append("attemptId", attempt.id);
        formData.append("partId", currentPart.id);
        if (textAnswer) formData.append("textAnswer", textAnswer);
        if (codeAnswer) formData.append("codeAnswer", codeAnswer);
        if (Object.keys(userInputs).length > 0) formData.append("userInputs", JSON.stringify(userInputs));
        
        const response = await fetch("/api/assignment-responses", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) throw new Error("Failed to save response");
        const savedResponse = await response.json();
        setResponses(prev => new Map(prev).set(currentPart.id, savedResponse));
      }
    } catch (error) {
      console.error("Failed to save response:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleHtmlDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingHtml(false);
    if (isPaused) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(html|htm)$/i)) {
      toast({ title: "Invalid file", description: "Please drop an HTML file (.html or .htm)", variant: "destructive" });
      return;
    }
    const text = await file.text();
    setCodeAnswer(text);
    toast({ title: "File loaded", description: `${file.name} uploaded successfully` });
  };

  const handlePyDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPy(false);
    if (isPaused) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.py$/i)) {
      toast({ title: "Invalid file", description: "Please drop a Python file (.py)", variant: "destructive" });
      return;
    }
    const text = await file.text();
    setCodeAnswer(text);
    toast({ title: "File loaded", description: `${file.name} uploaded successfully` });
  };

  const handleSubQuestionFileUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Failed to upload file");
    const data = await response.json();
    return data.url;
  }, []);

  const preventDefaults = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSubmitPart = () => {
    setShowConfirmSubmit(true);
  };

  const confirmSubmitPart = async () => {
    if (!attempt || !currentPart || !currentSection || !assignment) return;
    
    await saveCurrentResponse();
    
    const completedPartIds = [...(attempt.completedPartIds || []), currentPart.id];
    
    const currentSectionParts = currentSection.parts?.sort((a, b) => a.orderIndex - b.orderIndex) || [];
    const currentPartIndex = currentSectionParts.findIndex(p => p.id === currentPart.id);
    
    let nextPart: AssignmentPart | null = null;
    let nextSection: AssignmentSection | null = null;
    
    if (currentPartIndex < currentSectionParts.length - 1) {
      nextPart = currentSectionParts[currentPartIndex + 1];
      nextSection = currentSection;
    } else {
      const relevantSections = assignment.sections?.filter(s => 
        s.isCompulsory || s.sectionType === attempt.chosenOptionalSection
      ).sort((a, b) => a.orderIndex - b.orderIndex) || [];
      
      const currentSectionIndex = relevantSections.findIndex(s => s.id === currentSection.id);
      
      if (currentSectionIndex < relevantSections.length - 1) {
        nextSection = relevantSections[currentSectionIndex + 1];
        nextPart = nextSection.parts?.sort((a, b) => a.orderIndex - b.orderIndex)[0] || null;
      }
    }
    
    const updatedAttempt = {
      ...attempt,
      completedPartIds,
      currentPartId: nextPart?.id || null,
      currentSectionId: nextSection?.id || null,
      timeRemainingSeconds: timeRemaining,
      status: nextPart ? "in_progress" : "completed",
    };
    
    localStorage.setItem(`assignment_attempt_${assignment.id}`, JSON.stringify(updatedAttempt));
    setAttempt(updatedAttempt);
    
    try {
      await fetch(`/api/assignment-attempts/${attempt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedPartIds,
          currentPartId: nextPart?.id || null,
          currentSectionId: nextSection?.id || null,
          timeRemainingSeconds: timeRemaining,
          status: nextPart ? "in_progress" : "completed",
        }),
      });
    } catch (error) {
      console.error("Failed to update attempt:", error);
    }
    
    setShowConfirmSubmit(false);
    
    if (nextPart && nextSection) {
      setCurrentPart(nextPart);
      setCurrentSection(nextSection);
      setTextAnswer("");
      setCodeAnswer("");
      setUserInputs({});
      loadResponseForPart(attempt.id, nextPart.id);
      maybeShowInfoSheet(nextSection);
      toast({ title: "Part Submitted", description: `Moving to Part ${nextPart.partLabel}` });
    } else {
      handleSubmitAssignment();
    }
  };

  const handleSubmitAssignment = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (attempt) {
      localStorage.removeItem(`assignment_result_${attempt.id}`);
      toast({ title: "Assignment Complete!", description: "Your answers are being graded..." });
      setLocation(`/assignment-results/${attempt.id}`);
    } else {
      setLocation("/assignments");
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium">Assignment Not Found</h3>
            <Button onClick={() => setLocation("/assignments")} className="mt-4">
              Back to Assignments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className={`fixed top-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-b shadow-sm ${isPaused ? "bg-yellow-50 dark:bg-yellow-950/30" : ""}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/assignments")}
              data-testid="back-button"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">{assignment.year} - Assignment</h1>
              {currentSection && currentPart && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {currentSection.title} - Part {currentPart.partLabel}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-lg font-mono ${timeRemaining < 1800 ? "text-red-600" : ""}`}>
              <Clock className="h-5 w-5" />
              {formatTime(timeRemaining)}
            </div>
            
            {isPaused ? (
              <Button onClick={handleResume} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            ) : (
              <Button onClick={handlePause} variant="outline">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            <Button
              onClick={() => setShowCancelConfirm(true)}
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
              data-testid="button-cancel-assignment"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-20 pb-8 px-4 max-w-4xl mx-auto">
        {isPaused && (
          <Card className="mb-6 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-700">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pause className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Assignment Paused</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Timer stopped. Click Resume to continue.</p>
                </div>
              </div>
              <Button onClick={handleResume} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            </CardContent>
          </Card>
        )}

        {currentPart && currentSection && attempt && (
          <div className="space-y-6">
            {(() => {
              const relevantSections = assignment?.sections?.filter(s => 
                s.isCompulsory || s.sectionType === attempt.chosenOptionalSection
              ).sort((a, b) => a.orderIndex - b.orderIndex) || [];
              
              const allParts = relevantSections.flatMap((section, sIdx) => 
                (section.parts || []).sort((a, b) => a.orderIndex - b.orderIndex).map(part => ({
                  ...part,
                  sectionTitle: `Task ${sIdx + 1} - ${section.title}`,
                  sectionId: section.id
                }))
              );
              
              const completedPartIds = attempt.completedPartIds || [];
              
              const currentPartIndex = allParts.findIndex(p => p.id === currentPart.id);
              const visibleParts = allParts.filter((_, index) => index <= currentPartIndex);
              const remainingCount = allParts.length - visibleParts.length;
              
              return (
                <Card className="bg-neutral-50 dark:bg-neutral-900/50">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Progress:</span>
                      <span className="text-sm text-neutral-500">
                        {completedPartIds.length} of {allParts.length} parts completed
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {visibleParts.map((part) => {
                        const isCompleted = completedPartIds.includes(part.id);
                        const isCurrent = part.id === currentPart.id;
                        
                        return (
                          <div
                            key={part.id}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              isCompleted 
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" 
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400"
                            }`}
                            data-testid={`progress-part-${part.partLabel}`}
                          >
                            {isCompleted && <Lock className="h-3 w-3" />}
                            {isCurrent && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                            <span>Part {part.partLabel}</span>
                          </div>
                        );
                      })}
                      {remainingCount > 0 && (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500">
                          <Lock className="h-3 w-3" />
                          <span>{remainingCount} more part{remainingCount > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                    {completedPartIds.length > 0 && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Submitted parts are locked and cannot be changed
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Part {currentPart.partLabel}: {currentPart.title || ""}</CardTitle>
                    <CardDescription>
                      {currentSection.title} | {currentPart.maxMarks} marks
                      {currentPart.isPractical && (
                        <span className="ml-2 text-orange-600 dark:text-orange-400">(Practical Work)</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentSection?.informationSheet && currentSection.informationSheet.length > 0 && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowInfoSheet(true)}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white animate-pulse hover:animate-none"
                        data-testid="button-view-info-sheet"
                      >
                        <FileText className="h-4 w-4" />
                        View Info Sheet
                      </Button>
                    )}
                    {assignment?.evidenceChecklist && assignment.evidenceChecklist.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowChecklist(true)}
                        className="flex items-center gap-2"
                        data-testid="button-view-checklist"
                      >
                        <FileText className="h-4 w-4" />
                        View Checklist
                      </Button>
                    )}
                    {currentPart.isPractical && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                        <Code className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-orange-700 dark:text-orange-300">Practical</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {currentPart.contentBlocks && currentPart.contentBlocks.length > 0 && (
                  <div className="mb-6 space-y-4">
                    {currentPart.contentBlocks.map((block, idx) => (
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
                              alt={block.caption || "Assignment image"}
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
                          <div className="my-6">
                            <ResponsiveDataTable dataTable={block.dataTable} />
                          </div>
                        )}
                        {block.type === "pseudocode" && (() => {
                          if (block.pseudocodeLines && block.pseudocodeLines.length > 0) {
                            return (
                              <div className="my-4">
                                <table className="w-full border-collapse border border-neutral-200 dark:border-neutral-700 font-mono text-sm">
                                  {block.content && (
                                    <thead>
                                      <tr>
                                        <th colSpan={2} className="px-3 py-2 text-left font-medium border-b border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
                                          {block.content}
                                        </th>
                                      </tr>
                                    </thead>
                                  )}
                                  <tbody>
                                    {block.pseudocodeLines.map((line) => {
                                      const isBlank = !line.lineLabel?.trim() && !line.content?.trim();
                                      const text = line.content || '';
                                      const leadingSpaces = text.match(/^( *)/)?.[1]?.length || 0;
                                      const indentRem = leadingSpaces * 0.5;
                                      return (
                                        <tr key={line.id}>
                                          <td className={`px-2 text-right align-top border-r border-neutral-200 dark:border-neutral-700 text-neutral-500 whitespace-nowrap w-1 ${isBlank ? 'py-3' : 'py-1'} ${isBlank ? '' : 'border-b'}`}>
                                            {line.lineLabel}
                                          </td>
                                          <td
                                            className={`border-neutral-200 dark:border-neutral-700 ${isBlank ? 'py-3' : 'py-1'} ${isBlank ? '' : 'border-b'}`}
                                            style={{ paddingLeft: `${0.75 + indentRem}rem`, wordBreak: 'break-word' }}
                                          >
                                            {text.trimStart()}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            );
                          }
                          if (!block.pseudocode) return null;
                          return (
                            <div className="my-4">
                              <table className="w-full border-collapse border border-neutral-200 dark:border-neutral-700 font-mono text-sm">
                                {block.pseudocode.heading && (
                                  <thead>
                                    <tr>
                                      <th colSpan={2} className="px-3 py-2 text-left font-semibold bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                                        {block.pseudocode.heading}
                                      </th>
                                    </tr>
                                  </thead>
                                )}
                                <tbody>
                                  {block.pseudocode.lines.map((line) => {
                                    const isBlank = !line.label?.trim() && !line.code?.trim();
                                    const text = line.code || '';
                                    const leadingSpaces = text.match(/^( *)/)?.[1]?.length || 0;
                                    const indentRem = leadingSpaces * 0.5;
                                    return (
                                      <tr key={line.id}>
                                        <td className={`px-2 text-right align-top border-r border-neutral-200 dark:border-neutral-700 text-neutral-500 whitespace-nowrap w-1 ${isBlank ? 'py-3' : 'py-1'} ${isBlank ? '' : 'border-b'}`}>
                                          {line.label}
                                        </td>
                                        <td
                                          className={`border-neutral-200 dark:border-neutral-700 ${isBlank ? 'py-3' : 'py-1'} ${isBlank ? '' : 'border-b'}`}
                                          style={{ paddingLeft: `${0.75 + indentRem}rem`, wordBreak: 'break-word' }}
                                        >
                                          {text.trimStart()}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}

                {currentPart.resources && currentPart.resources.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Starter Files
                    </h4>
                    <div className="space-y-2">
                      {currentPart.resources.map(resource => (
                        <a
                          key={resource.id}
                          href={resource.fileUrl}
                          download={resource.fileName}
                          className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-700 dark:text-blue-300">{resource.fileName}</span>
                          {resource.description && (
                            <span className="text-neutral-500 text-sm">- {resource.description}</span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {currentPart.subQuestions && Array.isArray(currentPart.subQuestions) && currentPart.subQuestions.length > 0 ? (
                    (() => {
                      const renderSubQuestion = (subQ: SubQuestion, idx: number, depth: number = 0): React.ReactNode => {
                        const hasNested = subQ.subParts && subQ.subParts.length > 0;
                        const displayLabel = (() => {
                          if (!subQ.label) return `Task ${idx + 1}`;
                          if (depth > 0) {
                            const romanMatch = subQ.label.match(/\(([ivxlc]+)\)\s*$/i);
                            if (romanMatch) return `(${romanMatch[1]})`;
                          }
                          return subQ.label;
                        })();
                        return (
                          <div key={subQ.id || idx} className={`border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 ${depth > 0 ? "ml-4 border-blue-200 dark:border-blue-800" : ""}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                                  {displayLabel}
                                </div>
                                {subQ.contentBlocks && subQ.contentBlocks.length > 0 ? (
                                  <div className="space-y-3 mb-2">
                                    {subQ.contentBlocks.map((block: any, bIdx: number) => (
                                      <div key={block.id || bIdx}>
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
                                              alt={block.caption || "Assignment image"}
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
                                          <div className="my-6">
                                            <ResponsiveDataTable dataTable={block.dataTable} />
                                          </div>
                                        )}
                                        {block.type === "pseudocode" && (() => {
                                          if (block.pseudocodeLines && block.pseudocodeLines.length > 0) {
                                            return (
                                              <div className="my-4">
                                                <table className="w-full border-collapse border border-neutral-200 dark:border-neutral-700 font-mono text-sm">
                                                  {block.content && (
                                                    <thead>
                                                      <tr>
                                                        <th colSpan={2} className="px-3 py-2 text-left font-medium border-b border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
                                                          {block.content}
                                                        </th>
                                                      </tr>
                                                    </thead>
                                                  )}
                                                  <tbody>
                                                    {block.pseudocodeLines.map((line: any) => {
                                                      const isBlank = !line.lineLabel?.trim() && !line.content?.trim();
                                                      const text = line.content || '';
                                                      const leadingSpaces = text.match(/^( *)/)?.[1]?.length || 0;
                                                      const indentRem = leadingSpaces * 0.5;
                                                      return (
                                                        <tr key={line.id}>
                                                          <td className={`px-2 text-right align-top border-r border-neutral-200 dark:border-neutral-700 text-neutral-500 whitespace-nowrap w-1 ${isBlank ? 'py-3' : 'py-1'} ${isBlank ? '' : 'border-b'}`}>
                                                            {line.lineLabel}
                                                          </td>
                                                          <td
                                                            className={`border-neutral-200 dark:border-neutral-700 ${isBlank ? 'py-3' : 'py-1'} ${isBlank ? '' : 'border-b'}`}
                                                            style={{ paddingLeft: `${0.75 + indentRem}rem`, wordBreak: 'break-word' }}
                                                          >
                                                            {text.trimStart()}
                                                          </td>
                                                        </tr>
                                                      );
                                                    })}
                                                  </tbody>
                                                </table>
                                              </div>
                                            );
                                          }
                                          if (!block.pseudocode) return null;
                                          return (
                                            <div className="my-4">
                                              <table className="w-full border-collapse border border-neutral-200 dark:border-neutral-700 font-mono text-sm">
                                                {block.pseudocode.heading && (
                                                  <thead>
                                                    <tr>
                                                      <th colSpan={2} className="px-3 py-2 text-left font-semibold bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                                                        {block.pseudocode.heading}
                                                      </th>
                                                    </tr>
                                                  </thead>
                                                )}
                                                <tbody>
                                                  {block.pseudocode.lines.map((line: any) => {
                                                    const isBlank = !line.label?.trim() && !line.code?.trim();
                                                    const text = line.code || '';
                                                    const leadingSpaces = text.match(/^( *)/)?.[1]?.length || 0;
                                                    const indentRem = leadingSpaces * 0.5;
                                                    return (
                                                      <tr key={line.id}>
                                                        <td className={`px-2 text-right align-top border-r border-neutral-200 dark:border-neutral-700 text-neutral-500 whitespace-nowrap w-1 ${isBlank ? 'py-3' : 'py-1'} ${isBlank ? '' : 'border-b'}`}>
                                                          {line.label}
                                                        </td>
                                                        <td
                                                          className={`border-neutral-200 dark:border-neutral-700 ${isBlank ? 'py-3' : 'py-1'} ${isBlank ? '' : 'border-b'}`}
                                                          style={{ paddingLeft: `${0.75 + indentRem}rem`, wordBreak: 'break-word' }}
                                                        >
                                                          {text.trimStart()}
                                                        </td>
                                                      </tr>
                                                    );
                                                  })}
                                                </tbody>
                                              </table>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    ))}
                                  </div>
                                ) : subQ.questionText ? (
                                  <div className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                                    {subQ.questionText}
                                  </div>
                                ) : null}
                              </div>
                              {!hasNested && (
                              <span className="text-sm text-neutral-500 ml-4 shrink-0">
                                {subQ.maxMarks} mark{subQ.maxMarks !== 1 ? "s" : ""}
                              </span>
                              )}
                            </div>
                            {hasNested ? (
                              <div className="space-y-4 mt-2">
                                {subQ.subParts!.map((nested, nIdx) => renderSubQuestion(nested, nIdx, depth + 1))}
                              </div>
                            ) : (
                              <div className={isPaused ? "opacity-50 pointer-events-none" : ""}>
                                {renderQuestionInput(
                                  subQ,
                                  userInputs[subQ.id] || {},
                                  (key, val) => {
                                    setUserInputs(prev => ({
                                      ...prev,
                                      [subQ.id]: { ...(prev[subQ.id] || {}), [key]: val }
                                    }));
                                  },
                                  undefined,
                                  handleSubQuestionFileUpload
                                )}
                              </div>
                            )}
                          </div>
                        );
                      };
                      return currentPart.subQuestions.map((subQ: SubQuestion, idx: number) => renderSubQuestion(subQ, idx));
                    })()
                  ) : currentPart.inputStyle === "html-upload" ? (
                    <div className="space-y-4">
                      <label className="block font-medium mb-2 flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Upload HTML File
                      </label>
                      <p className="text-sm text-neutral-500 mb-3">
                        Upload your edited HTML file. The AI will review your code to mark your answer.
                      </p>
                      
                      <div
                        onDragOver={(e) => { preventDefaults(e); setIsDraggingHtml(true); }}
                        onDragEnter={(e) => { preventDefaults(e); setIsDraggingHtml(true); }}
                        onDragLeave={(e) => { preventDefaults(e); setIsDraggingHtml(false); }}
                        onDrop={handleHtmlDrop}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          isDraggingHtml
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                            : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500"
                        }`}
                      >
                        <input
                          type="file"
                          accept=".html,.htm"
                          className="hidden"
                          disabled={isPaused}
                          id="html-file-upload-input"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const text = await file.text();
                            setCodeAnswer(text);
                            toast({ title: "File loaded", description: `${file.name} uploaded successfully` });
                            e.target.value = "";
                          }}
                          data-testid="html-file-upload"
                        />
                        <Upload className={`h-8 w-8 mx-auto mb-3 ${isDraggingHtml ? "text-blue-500" : "text-neutral-400"}`} />
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                          {isDraggingHtml ? "Drop your HTML file here" : "Drag and drop your HTML file here, or"}
                        </p>
                        <Button
                          variant="outline"
                          disabled={isPaused}
                          type="button"
                          onClick={() => document.getElementById("html-file-upload-input")?.click()}
                        >
                          {codeAnswer ? "Replace HTML File" : "Choose HTML File"}
                        </Button>
                        <p className="text-xs text-neutral-400 mt-2">Accepts .html and .htm files</p>
                      </div>
                      
                      {codeAnswer && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4 text-green-600" />
                              HTML file loaded ({codeAnswer.length} characters)
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCodeAnswer("")}
                              disabled={isPaused}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                          <pre className="bg-neutral-100 dark:bg-neutral-800 border rounded p-3 text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap">
                            {codeAnswer}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : currentPart.inputStyle === "py-upload" ? (
                    <div className="space-y-4">
                      <label className="block font-medium mb-2 flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Upload Python File
                      </label>
                      <p className="text-sm text-neutral-500 mb-3">
                        Upload your Python (.py) file. The AI will review your code to mark your answer.
                      </p>
                      
                      <div
                        onDragOver={(e) => { preventDefaults(e); setIsDraggingPy(true); }}
                        onDragEnter={(e) => { preventDefaults(e); setIsDraggingPy(true); }}
                        onDragLeave={(e) => { preventDefaults(e); setIsDraggingPy(false); }}
                        onDrop={handlePyDrop}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          isDraggingPy
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                            : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500"
                        }`}
                      >
                        <input
                          type="file"
                          accept=".py"
                          className="hidden"
                          disabled={isPaused}
                          id="py-file-upload-input"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const text = await file.text();
                            setCodeAnswer(text);
                            toast({ title: "File loaded", description: `${file.name} uploaded successfully` });
                            e.target.value = "";
                          }}
                          data-testid="py-file-upload"
                        />
                        <Upload className={`h-8 w-8 mx-auto mb-3 ${isDraggingPy ? "text-blue-500" : "text-neutral-400"}`} />
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                          {isDraggingPy ? "Drop your Python file here" : "Drag and drop your Python file here, or"}
                        </p>
                        <Button
                          variant="outline"
                          disabled={isPaused}
                          type="button"
                          onClick={() => document.getElementById("py-file-upload-input")?.click()}
                          data-testid="button-choose-py-file"
                        >
                          {codeAnswer ? "Replace Python File" : "Choose Python File"}
                        </Button>
                        <p className="text-xs text-neutral-400 mt-2">Accepts .py files</p>
                      </div>
                      
                      {codeAnswer && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4 text-green-600" />
                              Python file loaded ({codeAnswer.split('\n').length} lines, {codeAnswer.length} characters)
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCodeAnswer("")}
                              disabled={isPaused}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                          <pre className="bg-neutral-900 text-green-400 border rounded p-3 text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap">
                            {codeAnswer}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : currentPart.inputStyle === "design-choice" ? (
                    <div className="space-y-4">
                      <label className="block font-medium mb-2">Your Answer</label>
                      <div className="flex gap-2 mb-4">
                        <Button
                          type="button"
                          variant={designChoice === "pseudocode" ? "default" : "outline"}
                          onClick={() => setDesignChoice("pseudocode")}
                          disabled={isPaused}
                        >
                          <Code className="w-4 h-4 mr-2" />
                          Pseudocode
                        </Button>
                        <Button
                          type="button"
                          variant={designChoice === "diagram" ? "default" : "outline"}
                          onClick={() => setDesignChoice("diagram")}
                          disabled={isPaused}
                        >
                          <Image className="w-4 h-4 mr-2" />
                          Structure Diagram
                        </Button>
                      </div>
                      
                      {designChoice === "pseudocode" ? (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Write your pseudocode below:</p>
                          <Textarea
                            value={textAnswer}
                            onChange={e => setTextAnswer(e.target.value)}
                            placeholder="PROCEDURE name&#10;  SET variable TO value&#10;  IF condition THEN&#10;    ...&#10;  END IF&#10;END PROCEDURE"
                            rows={12}
                            disabled={isPaused}
                            className="font-mono text-sm"
                            onKeyDown={e => {
                              if (e.key === "Tab") {
                                e.preventDefault();
                                const target = e.target as HTMLTextAreaElement;
                                const start = target.selectionStart;
                                const end = target.selectionEnd;
                                const value = target.value;
                                const newValue = value.substring(0, start) + "    " + value.substring(end);
                                setTextAnswer(newValue);
                                setTimeout(() => {
                                  target.selectionStart = target.selectionEnd = start + 4;
                                }, 0);
                              }
                            }}
                            data-testid="pseudocode-answer-input"
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Describe your structure diagram or upload a screenshot:</p>
                          <Textarea
                            value={diagramAnswer}
                            onChange={e => setDiagramAnswer(e.target.value)}
                            placeholder="Describe your structure diagram here, or upload a screenshot below..."
                            rows={6}
                            disabled={isPaused}
                            className="font-mono text-sm"
                            data-testid="diagram-answer-input"
                          />
                          <p className="text-sm text-muted-foreground mt-2">
                            Use the upload section below to attach your structure diagram image.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block font-medium mb-2">Your Answer</label>
                      <Textarea
                        value={textAnswer}
                        onChange={e => setTextAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        rows={8}
                        disabled={isPaused}
                        className="font-mono"
                        onKeyDown={e => {
                          if (e.key === "Tab") {
                            e.preventDefault();
                            const target = e.target as HTMLTextAreaElement;
                            const start = target.selectionStart;
                            const end = target.selectionEnd;
                            const value = target.value;
                            const newValue = value.substring(0, start) + "  " + value.substring(end);
                            setTextAnswer(newValue);
                            setTimeout(() => {
                              target.selectionStart = target.selectionEnd = start + 2;
                            }, 0);
                          }
                        }}
                        data-testid="text-answer-input"
                      />
                    </div>
                  )}

                  {currentPart.isPractical && (
                    <div>
                      <label className="block font-medium mb-2">Code Submission</label>
                      <Textarea
                        value={codeAnswer}
                        onChange={e => setCodeAnswer(e.target.value)}
                        placeholder="Paste your code here..."
                        rows={10}
                        disabled={isPaused}
                        className="font-mono text-sm"
                        onKeyDown={e => {
                          if (e.key === "Tab") {
                            e.preventDefault();
                            const target = e.target as HTMLTextAreaElement;
                            const start = target.selectionStart;
                            const end = target.selectionEnd;
                            const value = target.value;
                            const newValue = value.substring(0, start) + "  " + value.substring(end);
                            setCodeAnswer(newValue);
                            setTimeout(() => {
                              target.selectionStart = target.selectionEnd = start + 2;
                            }, 0);
                          }
                        }}
                        data-testid="code-answer-input"
                      />
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={saveCurrentResponse}
                disabled={isPaused || isSaving}
              >
                {isSaving ? "Saving..." : "Save Progress"}
              </Button>
              
              <Button
                onClick={handleSubmitPart}
                disabled={isPaused}
                className="bg-green-600 hover:bg-green-700"
                data-testid="submit-part-button"
              >
                Submit Part {currentPart.partLabel} & Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {attempt?.status === "completed" && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold mb-2">Assignment Complete!</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                You have successfully completed all parts of this assignment.
              </p>
              <Button onClick={() => setLocation("/assignments")}>
                Back to Assignments
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showSectionChoice} onOpenChange={setShowSectionChoice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Your Optional Section</DialogTitle>
            <DialogDescription>
              You will complete the Software Design section (compulsory) plus one of the following:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Button
              className="w-full h-auto py-4 flex flex-col items-start"
              variant="outline"
              onClick={() => handleStartWithSection("database")}
              data-testid="choose-database"
            >
              <span className="font-medium">Database Design and Development</span>
              <span className="text-sm text-neutral-500">Work with databases, SQL queries, and data manipulation</span>
            </Button>
            <Button
              className="w-full h-auto py-4 flex flex-col items-start"
              variant="outline"
              onClick={() => handleStartWithSection("web")}
              data-testid="choose-web"
            >
              <span className="font-medium">Web Design and Development</span>
              <span className="text-sm text-neutral-500">Work with HTML, CSS, and web page design</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLocation("/assignments")}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Submit Part {currentPart?.partLabel}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Once you submit this part, it will be <strong>locked</strong> and you will not be able to view or edit your answers.</p>
              <p className="text-amber-600 dark:text-amber-400">Make sure you have completed all tasks before submitting.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Working</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmitPart} className="bg-green-600 hover:bg-green-700">
              Submit & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPauseConfirm} onOpenChange={setShowPauseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be saved and the timer will stop. You can resume at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Working</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPause}>
              Pause & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Cancel Assignment?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to cancel this assignment? This will end your attempt and you will not be able to resume it.</p>
              <p className="font-medium text-red-600">Any answers you have already submitted will still be saved, but unsubmitted work will be lost.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Working</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelAssignment} className="bg-red-600 hover:bg-red-700">
              Cancel Assignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showChecklist} onOpenChange={setShowChecklist}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Evidence Checklist
            </DialogTitle>
            <DialogDescription>
              Evidence you need to provide for this assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4" data-testid="checklist-content">
            {/* SDD Section */}
            {(() => {
              const sddItems = assignment?.evidenceChecklist?.filter(item => item.sectionType === "sdd") || [];
              if (sddItems.length === 0) return null;
              return (
                <div>
                  <h4 className="font-medium text-sm text-neutral-600 dark:text-neutral-400 mb-2">Software Design and Development</h4>
                  <table className="w-full border rounded">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-neutral-800">
                        <th className="text-left px-3 py-2 text-sm font-medium">Evidence Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sddItems.map(item => (
                        <tr key={item.id} className="border-t">
                          <td className="px-3 py-2 text-sm">{item.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
            
            {/* Database Section */}
            {(() => {
              const dbItems = assignment?.evidenceChecklist?.filter(item => item.sectionType === "database") || [];
              if (dbItems.length === 0) return null;
              return (
                <div>
                  <h4 className="font-medium text-sm text-neutral-600 dark:text-neutral-400 mb-2">Database Design and Development</h4>
                  <table className="w-full border rounded">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-neutral-800">
                        <th className="text-left px-3 py-2 text-sm font-medium">Evidence Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbItems.map(item => (
                        <tr key={item.id} className="border-t">
                          <td className="px-3 py-2 text-sm">{item.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
            
            {/* Web Section */}
            {(() => {
              const webItems = assignment?.evidenceChecklist?.filter(item => item.sectionType === "web") || [];
              if (webItems.length === 0) return null;
              return (
                <div>
                  <h4 className="font-medium text-sm text-neutral-600 dark:text-neutral-400 mb-2">Web Design and Development</h4>
                  <table className="w-full border rounded">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-neutral-800">
                        <th className="text-left px-3 py-2 text-sm font-medium">Evidence Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {webItems.map(item => (
                        <tr key={item.id} className="border-t">
                          <td className="px-3 py-2 text-sm">{item.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowChecklist(false)} data-testid="button-close-checklist">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showInfoSheet} onOpenChange={setShowInfoSheet}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Information Sheet
            </DialogTitle>
            <DialogDescription>
              Reference material for {currentSection?.title || "this section"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4" data-testid="info-sheet-content">
            {(() => {
              const renderInfoBlock = (block: ContentBlock, idx: number): React.ReactNode => (
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
                    <div className="my-6">
                      <ResponsiveDataTable dataTable={block.dataTable} />
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
                          {renderInfoBlock(child, childIdx)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
              return currentSection?.informationSheet?.map((block, idx) => renderInfoBlock(block, idx));
            })()}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowInfoSheet(false)} data-testid="button-close-info-sheet">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
