import { c as createLucideIcon, t as useParams, u as useLocation, a as useToast, r as reactExports, j as jsxRuntimeExports } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle, c as CardDescription } from "./card-D7eXR4Y_.js";
import { T as Textarea } from "./textarea-DVZKhD5j.js";
import { r as renderQuestionInput } from "./QuestionInput-KmSAPMhQ.js";
import { R as RichTextBlock } from "./RichTextBlock-B5hwZVHB.js";
import { R as ResponsiveDataTable } from "./responsive-data-table-CZUpIuB-.js";
import { A as AlertDialog, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-Dav9MFAg.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-DTiCktmM.js";
import { C as CircleAlert } from "./circle-alert-DWz_G-vq.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { C as Clock } from "./clock-CBMrk16J.js";
import { P as Play } from "./play-D5zzeji7.js";
import { C as CircleX } from "./circle-x-DWAGdAys.js";
import { L as Lock } from "./lock-CyeBs8h_.js";
import { F as FileText } from "./file-text-7qIELcrq.js";
import { C as Code } from "./code-CkVOXEbl.js";
import { D as Download } from "./download-DGRZihqj.js";
import { U as Upload, I as Image } from "./upload-BqUh_JkD.js";
import { C as ChevronRight } from "./chevron-right-CVWIcf-n.js";
import { C as CircleCheckBig } from "./circle-check-big-B9xfjmGM.js";
import "./input-BglVfhce.js";
import "./diagram-editor-YPWk6RIh.js";
import "./pencil-BpyvL5SV.js";
import "./trash-2-bLg5w6uM.js";
import "./circle-D4qz0ZWK.js";
import "./database-C7hi9e55.js";
import "./list-CSQ5KgpQ.js";
import "./chevron-down-C5HdvL5Z.js";
import "./check-tIL4sncn.js";
import "./file-pen-D6Iuyym7.js";
import "./purify.es-DdxQyCyd.js";
import "./index-CxDJjHs5.js";
import "./index-C94DArSW.js";
import "./Combination-DqZOzdwe.js";
const __iconNode = [
  ["rect", { x: "14", y: "3", width: "5", height: "18", rx: "1", key: "kaeet6" }],
  ["rect", { x: "5", y: "3", width: "5", height: "18", rx: "1", key: "1wsw3u" }]
];
const Pause = createLucideIcon("pause", __iconNode);
function StudentAssignmentFlow() {
  const { id: assignmentId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [assignment, setAssignment] = reactExports.useState(null);
  const [attempt, setAttempt] = reactExports.useState(null);
  const [responses, setResponses] = reactExports.useState(/* @__PURE__ */ new Map());
  const [loading, setLoading] = reactExports.useState(true);
  const [isPaused, setIsPaused] = reactExports.useState(false);
  const [timeRemaining, setTimeRemaining] = reactExports.useState(0);
  const timerRef = reactExports.useRef(null);
  const [showSectionChoice, setShowSectionChoice] = reactExports.useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = reactExports.useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = reactExports.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = reactExports.useState(false);
  const [showChecklist, setShowChecklist] = reactExports.useState(false);
  const [showInfoSheet, setShowInfoSheet] = reactExports.useState(false);
  const infoSheetSeenSectionsRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const [currentPart, setCurrentPart] = reactExports.useState(null);
  const [currentSection, setCurrentSection] = reactExports.useState(null);
  const [textAnswer, setTextAnswer] = reactExports.useState("");
  const [codeAnswer, setCodeAnswer] = reactExports.useState("");
  const [designChoice, setDesignChoice] = reactExports.useState("pseudocode");
  const [diagramAnswer, setDiagramAnswer] = reactExports.useState("");
  const [isDraggingHtml, setIsDraggingHtml] = reactExports.useState(false);
  const [isDraggingPy, setIsDraggingPy] = reactExports.useState(false);
  const [isSaving, setIsSaving] = reactExports.useState(false);
  const [userInputs, setUserInputs] = reactExports.useState({});
  const getOrCreateStudentId = reactExports.useCallback(() => {
    let studentId = localStorage.getItem("local_student_id");
    if (!studentId) {
      studentId = `student_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("local_student_id", studentId);
    }
    return studentId;
  }, []);
  reactExports.useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);
  reactExports.useEffect(() => {
    if (attempt && !isPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
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
      }, 1e3);
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
      const response = await fetch(`/api/n5/assignments/${assignmentId}`);
      if (!response.ok) throw new Error("Failed to fetch assignment");
      const data = await response.json();
      setAssignment(data);
      const localStudentId = getOrCreateStudentId();
      let attemptData = null;
      try {
        const serverAttemptsResponse = await fetch(`/api/n5/assignment-attempts/student/${localStudentId}`);
        if (serverAttemptsResponse.ok) {
          const serverAttempts = await serverAttemptsResponse.json();
          const matchingAttempt = serverAttempts.find((a) => a.assignmentId === assignmentId && a.status !== "cancelled");
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
          } catch {
          }
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
  const maybeShowInfoSheet = (section) => {
    if (section.informationSheet && section.informationSheet.length > 0 && !infoSheetSeenSectionsRef.current.has(section.id)) {
      infoSheetSeenSectionsRef.current.add(section.id);
      setShowInfoSheet(true);
    }
  };
  const loadCurrentPartState = (assignment2, attempt2) => {
    if (!assignment2.sections) return;
    const relevantSections = assignment2.sections.filter(
      (s) => s.isCompulsory || s.sectionType === attempt2.chosenOptionalSection
    ).sort((a, b) => a.orderIndex - b.orderIndex);
    const allParts = relevantSections.flatMap(
      (section) => (section.parts || []).sort((a, b) => a.orderIndex - b.orderIndex).map((part) => ({
        ...part,
        sectionRef: section
      }))
    );
    const completedPartIds = attempt2.completedPartIds || [];
    const nextAllowedPart = allParts.find((p) => !completedPartIds.includes(p.id));
    if (!nextAllowedPart) {
      return;
    }
    const isCurrentPartValid = attempt2.currentPartId === nextAllowedPart.id;
    if (isCurrentPartValid || !attempt2.currentPartId) {
      setCurrentSection(nextAllowedPart.sectionRef);
      setCurrentPart(nextAllowedPart);
      loadResponseForPart(attempt2.id, nextAllowedPart.id);
      maybeShowInfoSheet(nextAllowedPart.sectionRef);
      if (!isCurrentPartValid && attempt2.currentPartId !== nextAllowedPart.id) {
        const updatedAttempt = { ...attempt2, currentPartId: nextAllowedPart.id, currentSectionId: nextAllowedPart.sectionRef.id };
        setAttempt(updatedAttempt);
        localStorage.setItem(`assignment_attempt_${assignment2.id}`, JSON.stringify(updatedAttempt));
      }
    } else {
      setCurrentSection(nextAllowedPart.sectionRef);
      setCurrentPart(nextAllowedPart);
      loadResponseForPart(attempt2.id, nextAllowedPart.id);
      maybeShowInfoSheet(nextAllowedPart.sectionRef);
      const updatedAttempt = { ...attempt2, currentPartId: nextAllowedPart.id, currentSectionId: nextAllowedPart.sectionRef.id };
      setAttempt(updatedAttempt);
      localStorage.setItem(`assignment_attempt_${assignment2.id}`, JSON.stringify(updatedAttempt));
    }
  };
  const loadResponseForPart = async (attemptId, partId) => {
    try {
      const response = await fetch(`/api/n5/assignment-attempts/${attemptId}/responses`);
      if (response.ok) {
        const data = await response.json();
        const partResponses = data.filter((r) => r.partId === partId);
        if (partResponses.length > 0) {
          const subQuestionResponses = partResponses.filter((r) => r.subQuestionId);
          const mainResponse = partResponses.find((r) => !r.subQuestionId);
          if (subQuestionResponses.length > 0) {
            const rebuiltInputs = {};
            for (const subResp of subQuestionResponses) {
              if (subResp.userInputs && typeof subResp.userInputs === "object") {
                rebuiltInputs[subResp.subQuestionId] = subResp.userInputs;
              }
              setResponses((prev) => new Map(prev).set(`${partId}:${subResp.subQuestionId}`, subResp));
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
            setResponses((prev) => new Map(prev).set(partId, mainResponse));
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
  const handleStartWithSection = async (optionalSection) => {
    if (!assignment) return;
    const localStudentId = getOrCreateStudentId();
    const studentToken = localStorage.getItem("studentToken");
    try {
      const bodyData = {
        assignmentId: assignment.id,
        localStudentId,
        chosenOptionalSection: optionalSection
      };
      const headers = { "Content-Type": "application/json" };
      if (studentToken) headers["Authorization"] = `Bearer ${studentToken}`;
      const response = await fetch("/api/n5/assignment-attempts/start", {
        method: "POST",
        headers,
        body: JSON.stringify(bodyData)
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
      status: isPaused ? "paused" : "in_progress"
    };
    localStorage.setItem(`assignment_attempt_${attempt.assignmentId}`, JSON.stringify(updatedAttempt));
    try {
      await fetch(`/api/n5/assignment-attempts/${attempt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeRemainingSeconds: timeRemaining,
          status: isPaused ? "paused" : "in_progress"
        })
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
      ...attempt,
      timeRemainingSeconds: timeRemaining,
      status: "in_progress"
    };
    localStorage.setItem(`assignment_attempt_${attempt.assignmentId}`, JSON.stringify(updatedAttempt));
    setAttempt(updatedAttempt);
    try {
      await fetch(`/api/n5/assignment-attempts/${attempt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" })
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
        await fetch(`/api/n5/assignment-attempts/${attempt.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" })
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
      const subQuestions = currentPart.subQuestions;
      const flattenLeafSubs = (qs) => {
        const leaves = [];
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
            } catch (e) {
            }
          }
          formData.append("userInputs", JSON.stringify(subQInputs));
          const response = await fetch("/api/n5/assignment-responses", {
            method: "POST",
            body: formData
          });
          if (!response.ok) throw new Error("Failed to save sub-question response");
          const savedResponse = await response.json();
          setResponses((prev) => new Map(prev).set(`${currentPart.id}:${subQ.id}`, savedResponse));
        }
      } else {
        const formData = new FormData();
        formData.append("attemptId", attempt.id);
        formData.append("partId", currentPart.id);
        if (textAnswer) formData.append("textAnswer", textAnswer);
        if (codeAnswer) formData.append("codeAnswer", codeAnswer);
        if (Object.keys(userInputs).length > 0) formData.append("userInputs", JSON.stringify(userInputs));
        const response = await fetch("/api/n5/assignment-responses", {
          method: "POST",
          body: formData
        });
        if (!response.ok) throw new Error("Failed to save response");
        const savedResponse = await response.json();
        setResponses((prev) => new Map(prev).set(currentPart.id, savedResponse));
      }
    } catch (error) {
      console.error("Failed to save response:", error);
    } finally {
      setIsSaving(false);
    }
  };
  const handleHtmlDrop = async (e) => {
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
  const handlePyDrop = async (e) => {
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
  const handleSubQuestionFileUpload = reactExports.useCallback(async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });
    if (!response.ok) throw new Error("Failed to upload file");
    const data = await response.json();
    return data.url;
  }, []);
  const preventDefaults = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleSubmitPart = () => {
    setShowConfirmSubmit(true);
  };
  const confirmSubmitPart = async () => {
    if (!attempt || !currentPart || !currentSection || !assignment) return;
    await saveCurrentResponse();
    const completedPartIds = [...attempt.completedPartIds || [], currentPart.id];
    const currentSectionParts = currentSection.parts?.sort((a, b) => a.orderIndex - b.orderIndex) || [];
    const currentPartIndex = currentSectionParts.findIndex((p) => p.id === currentPart.id);
    let nextPart = null;
    let nextSection = null;
    if (currentPartIndex < currentSectionParts.length - 1) {
      nextPart = currentSectionParts[currentPartIndex + 1];
      nextSection = currentSection;
    } else {
      const relevantSections = assignment.sections?.filter(
        (s) => s.isCompulsory || s.sectionType === attempt.chosenOptionalSection
      ).sort((a, b) => a.orderIndex - b.orderIndex) || [];
      const currentSectionIndex = relevantSections.findIndex((s) => s.id === currentSection.id);
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
      status: nextPart ? "in_progress" : "completed"
    };
    localStorage.setItem(`assignment_attempt_${assignment.id}`, JSON.stringify(updatedAttempt));
    setAttempt(updatedAttempt);
    try {
      await fetch(`/api/n5/assignment-attempts/${attempt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedPartIds,
          currentPartId: nextPart?.id || null,
          currentSectionId: nextSection?.id || null,
          timeRemainingSeconds: timeRemaining,
          status: nextPart ? "in_progress" : "completed"
        })
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
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" }) });
  }
  if (!assignment) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-12 w-12 mx-auto mb-4 text-red-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium", children: "Assignment Not Found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setLocation("/assignments"), className: "mt-4", children: "Back to Assignments" })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `fixed top-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-b shadow-sm ${isPaused ? "bg-yellow-50 dark:bg-yellow-950/30" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-6xl mx-auto px-4 py-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            onClick: () => setLocation("/assignments"),
            "data-testid": "back-button",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-5 w-5" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-semibold text-lg", children: [
            assignment.year,
            " - Assignment"
          ] }),
          currentSection && currentPart && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-neutral-600 dark:text-neutral-400", children: [
            currentSection.title,
            " - Part ",
            currentPart.partLabel
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-2 text-lg font-mono ${timeRemaining < 1800 ? "text-red-600" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5 w-5" }),
          formatTime(timeRemaining)
        ] }),
        isPaused ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleResume, className: "bg-green-600 hover:bg-green-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4 mr-2" }),
          "Resume"
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handlePause, variant: "outline", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { className: "h-4 w-4 mr-2" }),
          "Pause"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: () => setShowCancelConfirm(true),
            variant: "outline",
            className: "text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30",
            "data-testid": "button-cancel-assignment",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4 mr-2" }),
              "Cancel"
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-20 pb-8 px-4 max-w-4xl mx-auto", children: [
      isPaused && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "mb-6 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { className: "h-6 w-6 text-yellow-600" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-yellow-800 dark:text-yellow-200", children: "Assignment Paused" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-yellow-700 dark:text-yellow-300", children: "Timer stopped. Click Resume to continue." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleResume, className: "bg-green-600 hover:bg-green-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4 mr-2" }),
          "Resume"
        ] })
      ] }) }),
      currentPart && currentSection && attempt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        (() => {
          const relevantSections = assignment?.sections?.filter(
            (s) => s.isCompulsory || s.sectionType === attempt.chosenOptionalSection
          ).sort((a, b) => a.orderIndex - b.orderIndex) || [];
          const allParts = relevantSections.flatMap(
            (section, sIdx) => (section.parts || []).sort((a, b) => a.orderIndex - b.orderIndex).map((part) => ({
              ...part,
              sectionTitle: `Task ${sIdx + 1} - ${section.title}`,
              sectionId: section.id
            }))
          );
          const completedPartIds = attempt.completedPartIds || [];
          const currentPartIndex = allParts.findIndex((p) => p.id === currentPart.id);
          const visibleParts = allParts.filter((_, index) => index <= currentPartIndex);
          const remainingCount = allParts.length - visibleParts.length;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-neutral-50 dark:bg-neutral-900/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-neutral-600 dark:text-neutral-400", children: "Progress:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-neutral-500", children: [
                completedPartIds.length,
                " of ",
                allParts.length,
                " parts completed"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              visibleParts.map((part) => {
                const isCompleted = completedPartIds.includes(part.id);
                const isCurrent = part.id === currentPart.id;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isCompleted ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400"}`,
                    "data-testid": `progress-part-${part.partLabel}`,
                    children: [
                      isCompleted && /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-3 w-3" }),
                      isCurrent && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2 h-2 rounded-full bg-blue-500 animate-pulse" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        "Part ",
                        part.partLabel
                      ] })
                    ]
                  },
                  part.id
                );
              }),
              remainingCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-3 w-3" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  remainingCount,
                  " more part",
                  remainingCount > 1 ? "s" : ""
                ] })
              ] })
            ] }),
            completedPartIds.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-neutral-500 dark:text-neutral-400 mt-3 flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-3 w-3" }),
              "Submitted parts are locked and cannot be changed"
            ] })
          ] }) });
        })(),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { children: [
                "Part ",
                currentPart.partLabel,
                ": ",
                currentPart.title || ""
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
                currentSection.title,
                " | ",
                currentPart.maxMarks,
                " marks",
                currentPart.isPractical && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-orange-600 dark:text-orange-400", children: "(Practical Work)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              currentSection?.informationSheet && currentSection.informationSheet.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "default",
                  size: "sm",
                  onClick: () => setShowInfoSheet(true),
                  className: "flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white animate-pulse hover:animate-none",
                  "data-testid": "button-view-info-sheet",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4" }),
                    "View Info Sheet"
                  ]
                }
              ),
              assignment?.evidenceChecklist && assignment.evidenceChecklist.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => setShowChecklist(true),
                  className: "flex items-center gap-2",
                  "data-testid": "button-view-checklist",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4" }),
                    "View Checklist"
                  ]
                }
              ),
              currentPart.isPractical && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-4 w-4 text-orange-600" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-orange-700 dark:text-orange-300", children: "Practical" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
            currentPart.contentBlocks && currentPart.contentBlocks.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-6 space-y-4", children: currentPart.contentBlocks.map((block, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              block.type === "heading" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-4 mb-2", children: block.content }),
              block.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx(RichTextBlock, { content: block.content }),
              block.type === "image" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("figure", { className: "my-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: block.content,
                    alt: block.caption || "Assignment image",
                    className: `rounded-lg ${block.imageSize === "small" ? "max-w-xs" : block.imageSize === "medium" ? "max-w-md" : block.imageSize === "large" ? "max-w-2xl" : "max-w-full"}`
                  }
                ),
                block.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("figcaption", { className: "text-sm text-neutral-500 mt-2", children: block.caption })
              ] }),
              block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg overflow-x-auto my-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-sm font-mono", children: block.content }) }),
              block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveDataTable, { dataTable: block.dataTable }) }),
              block.type === "pseudocode" && (() => {
                if (block.pseudocodeLines && block.pseudocodeLines.length > 0) {
                  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full border-collapse border border-neutral-200 dark:border-neutral-700 font-mono text-sm", children: [
                    block.content && /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("th", { colSpan: 2, className: "px-3 py-2 text-left font-medium border-b border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800", children: block.content }) }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocodeLines.map((line) => {
                      const isBlank = !line.lineLabel?.trim() && !line.content?.trim();
                      const text = line.content || "";
                      const leadingSpaces = text.match(/^( *)/)?.[1]?.length || 0;
                      const indentRem = leadingSpaces * 0.5;
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `px-2 text-right align-top border-r border-neutral-200 dark:border-neutral-700 text-neutral-500 whitespace-nowrap w-1 ${isBlank ? "py-3" : "py-1"} ${isBlank ? "" : "border-b"}`, children: line.lineLabel }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "td",
                          {
                            className: `border-neutral-200 dark:border-neutral-700 ${isBlank ? "py-3" : "py-1"} ${isBlank ? "" : "border-b"}`,
                            style: { paddingLeft: `${0.75 + indentRem}rem`, wordBreak: "break-word" },
                            children: text.trimStart()
                          }
                        )
                      ] }, line.id);
                    }) })
                  ] }) });
                }
                if (!block.pseudocode) return null;
                return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full border-collapse border border-neutral-200 dark:border-neutral-700 font-mono text-sm", children: [
                  block.pseudocode.heading && /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("th", { colSpan: 2, className: "px-3 py-2 text-left font-semibold bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700", children: block.pseudocode.heading }) }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocode.lines.map((line) => {
                    const isBlank = !line.label?.trim() && !line.code?.trim();
                    const text = line.code || "";
                    const leadingSpaces = text.match(/^( *)/)?.[1]?.length || 0;
                    const indentRem = leadingSpaces * 0.5;
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `px-2 text-right align-top border-r border-neutral-200 dark:border-neutral-700 text-neutral-500 whitespace-nowrap w-1 ${isBlank ? "py-3" : "py-1"} ${isBlank ? "" : "border-b"}`, children: line.label }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "td",
                        {
                          className: `border-neutral-200 dark:border-neutral-700 ${isBlank ? "py-3" : "py-1"} ${isBlank ? "" : "border-b"}`,
                          style: { paddingLeft: `${0.75 + indentRem}rem`, wordBreak: "break-word" },
                          children: text.trimStart()
                        }
                      )
                    ] }, line.id);
                  }) })
                ] }) });
              })()
            ] }, block.id || idx)) }),
            currentPart.resources && currentPart.resources.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-medium mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
                "Starter Files"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: currentPart.resources.map((resource) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: resource.fileUrl,
                  download: resource.fileName,
                  className: "flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4 text-blue-600" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-700 dark:text-blue-300", children: resource.fileName }),
                    resource.description && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-neutral-500 text-sm", children: [
                      "- ",
                      resource.description
                    ] })
                  ]
                },
                resource.id
              )) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
              currentPart.subQuestions && Array.isArray(currentPart.subQuestions) && currentPart.subQuestions.length > 0 ? (() => {
                const renderSubQuestion = (subQ, idx, depth = 0) => {
                  const hasNested = subQ.subParts && subQ.subParts.length > 0;
                  const displayLabel = (() => {
                    if (!subQ.label) return `Task ${idx + 1}`;
                    if (depth > 0) {
                      const romanMatch = subQ.label.match(/\(([ivxlc]+)\)\s*$/i);
                      if (romanMatch) return `(${romanMatch[1]})`;
                    }
                    return subQ.label;
                  })();
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 ${depth > 0 ? "ml-4 border-blue-200 dark:border-blue-800" : ""}`, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-neutral-900 dark:text-neutral-100 mb-1", children: displayLabel }),
                        subQ.contentBlocks && subQ.contentBlocks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 mb-2", children: subQ.contentBlocks.map((block, bIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          block.type === "heading" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-4 mb-2", children: block.content }),
                          block.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx(RichTextBlock, { content: block.content }),
                          block.type === "image" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("figure", { className: "my-4", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "img",
                              {
                                src: block.content,
                                alt: block.caption || "Assignment image",
                                className: `rounded-lg ${block.imageSize === "small" ? "max-w-xs" : block.imageSize === "medium" ? "max-w-md" : block.imageSize === "large" ? "max-w-2xl" : "max-w-full"}`
                              }
                            ),
                            block.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("figcaption", { className: "text-sm text-neutral-500 mt-2", children: block.caption })
                          ] }),
                          block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg overflow-x-auto my-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-sm font-mono", children: block.content }) }),
                          block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveDataTable, { dataTable: block.dataTable }) }),
                          block.type === "pseudocode" && (() => {
                            if (block.pseudocodeLines && block.pseudocodeLines.length > 0) {
                              return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full border-collapse border border-neutral-200 dark:border-neutral-700 font-mono text-sm", children: [
                                block.content && /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("th", { colSpan: 2, className: "px-3 py-2 text-left font-medium border-b border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800", children: block.content }) }) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocodeLines.map((line) => {
                                  const isBlank = !line.lineLabel?.trim() && !line.content?.trim();
                                  const text = line.content || "";
                                  const leadingSpaces = text.match(/^( *)/)?.[1]?.length || 0;
                                  const indentRem = leadingSpaces * 0.5;
                                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `px-2 text-right align-top border-r border-neutral-200 dark:border-neutral-700 text-neutral-500 whitespace-nowrap w-1 ${isBlank ? "py-3" : "py-1"} ${isBlank ? "" : "border-b"}`, children: line.lineLabel }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                                      "td",
                                      {
                                        className: `border-neutral-200 dark:border-neutral-700 ${isBlank ? "py-3" : "py-1"} ${isBlank ? "" : "border-b"}`,
                                        style: { paddingLeft: `${0.75 + indentRem}rem`, wordBreak: "break-word" },
                                        children: text.trimStart()
                                      }
                                    )
                                  ] }, line.id);
                                }) })
                              ] }) });
                            }
                            if (!block.pseudocode) return null;
                            return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full border-collapse border border-neutral-200 dark:border-neutral-700 font-mono text-sm", children: [
                              block.pseudocode.heading && /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("th", { colSpan: 2, className: "px-3 py-2 text-left font-semibold bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700", children: block.pseudocode.heading }) }) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocode.lines.map((line) => {
                                const isBlank = !line.label?.trim() && !line.code?.trim();
                                const text = line.code || "";
                                const leadingSpaces = text.match(/^( *)/)?.[1]?.length || 0;
                                const indentRem = leadingSpaces * 0.5;
                                return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `px-2 text-right align-top border-r border-neutral-200 dark:border-neutral-700 text-neutral-500 whitespace-nowrap w-1 ${isBlank ? "py-3" : "py-1"} ${isBlank ? "" : "border-b"}`, children: line.label }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    "td",
                                    {
                                      className: `border-neutral-200 dark:border-neutral-700 ${isBlank ? "py-3" : "py-1"} ${isBlank ? "" : "border-b"}`,
                                      style: { paddingLeft: `${0.75 + indentRem}rem`, wordBreak: "break-word" },
                                      children: text.trimStart()
                                    }
                                  )
                                ] }, line.id);
                              }) })
                            ] }) });
                          })()
                        ] }, block.id || bIdx)) }) : subQ.questionText ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap", children: subQ.questionText }) : null
                      ] }),
                      !hasNested && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-neutral-500 ml-4 shrink-0", children: [
                        subQ.maxMarks,
                        " mark",
                        subQ.maxMarks !== 1 ? "s" : ""
                      ] })
                    ] }),
                    hasNested ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4 mt-2", children: subQ.subParts.map((nested, nIdx) => renderSubQuestion(nested, nIdx, depth + 1)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: isPaused ? "opacity-50 pointer-events-none" : "", children: renderQuestionInput(
                      subQ,
                      userInputs[subQ.id] || {},
                      (key, val) => {
                        setUserInputs((prev) => ({
                          ...prev,
                          [subQ.id]: { ...prev[subQ.id] || {}, [key]: val }
                        }));
                      },
                      void 0,
                      handleSubQuestionFileUpload
                    ) })
                  ] }, subQ.id || idx);
                };
                return currentPart.subQuestions.map((subQ, idx) => renderSubQuestion(subQ, idx));
              })() : currentPart.inputStyle === "html-upload" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block font-medium mb-2 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-4 w-4" }),
                  "Upload HTML File"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 mb-3", children: "Upload your edited HTML file. The AI will review your code to mark your answer." }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    onDragOver: (e) => {
                      preventDefaults(e);
                      setIsDraggingHtml(true);
                    },
                    onDragEnter: (e) => {
                      preventDefaults(e);
                      setIsDraggingHtml(true);
                    },
                    onDragLeave: (e) => {
                      preventDefaults(e);
                      setIsDraggingHtml(false);
                    },
                    onDrop: handleHtmlDrop,
                    className: `border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDraggingHtml ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "file",
                          accept: ".html,.htm",
                          className: "hidden",
                          disabled: isPaused,
                          id: "html-file-upload-input",
                          onChange: async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const text = await file.text();
                            setCodeAnswer(text);
                            toast({ title: "File loaded", description: `${file.name} uploaded successfully` });
                            e.target.value = "";
                          },
                          "data-testid": "html-file-upload"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: `h-8 w-8 mx-auto mb-3 ${isDraggingHtml ? "text-blue-500" : "text-neutral-400"}` }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-600 dark:text-neutral-400 mb-3", children: isDraggingHtml ? "Drop your HTML file here" : "Drag and drop your HTML file here, or" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          variant: "outline",
                          disabled: isPaused,
                          type: "button",
                          onClick: () => document.getElementById("html-file-upload-input")?.click(),
                          children: codeAnswer ? "Replace HTML File" : "Choose HTML File"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-400 mt-2", children: "Accepts .html and .htm files" })
                    ]
                  }
                ),
                codeAnswer && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4 text-green-600" }),
                      "HTML file loaded (",
                      codeAnswer.length,
                      " characters)"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        variant: "ghost",
                        size: "sm",
                        onClick: () => setCodeAnswer(""),
                        disabled: isPaused,
                        className: "text-red-600 hover:text-red-700",
                        children: "Remove"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-100 dark:bg-neutral-800 border rounded p-3 text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap", children: codeAnswer })
                ] })
              ] }) : currentPart.inputStyle === "py-upload" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block font-medium mb-2 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "h-4 w-4" }),
                  "Upload Python File"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 mb-3", children: "Upload your Python (.py) file. The AI will review your code to mark your answer." }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    onDragOver: (e) => {
                      preventDefaults(e);
                      setIsDraggingPy(true);
                    },
                    onDragEnter: (e) => {
                      preventDefaults(e);
                      setIsDraggingPy(true);
                    },
                    onDragLeave: (e) => {
                      preventDefaults(e);
                      setIsDraggingPy(false);
                    },
                    onDrop: handlePyDrop,
                    className: `border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDraggingPy ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "file",
                          accept: ".py",
                          className: "hidden",
                          disabled: isPaused,
                          id: "py-file-upload-input",
                          onChange: async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const text = await file.text();
                            setCodeAnswer(text);
                            toast({ title: "File loaded", description: `${file.name} uploaded successfully` });
                            e.target.value = "";
                          },
                          "data-testid": "py-file-upload"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: `h-8 w-8 mx-auto mb-3 ${isDraggingPy ? "text-blue-500" : "text-neutral-400"}` }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-600 dark:text-neutral-400 mb-3", children: isDraggingPy ? "Drop your Python file here" : "Drag and drop your Python file here, or" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          variant: "outline",
                          disabled: isPaused,
                          type: "button",
                          onClick: () => document.getElementById("py-file-upload-input")?.click(),
                          "data-testid": "button-choose-py-file",
                          children: codeAnswer ? "Replace Python File" : "Choose Python File"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-400 mt-2", children: "Accepts .py files" })
                    ]
                  }
                ),
                codeAnswer && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4 text-green-600" }),
                      "Python file loaded (",
                      codeAnswer.split("\n").length,
                      " lines, ",
                      codeAnswer.length,
                      " characters)"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        variant: "ghost",
                        size: "sm",
                        onClick: () => setCodeAnswer(""),
                        disabled: isPaused,
                        className: "text-red-600 hover:text-red-700",
                        children: "Remove"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-900 text-green-400 border rounded p-3 text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap", children: codeAnswer })
                ] })
              ] }) : currentPart.inputStyle === "design-choice" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block font-medium mb-2", children: "Your Answer" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: designChoice === "pseudocode" ? "default" : "outline",
                      onClick: () => setDesignChoice("pseudocode"),
                      disabled: isPaused,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { className: "w-4 h-4 mr-2" }),
                        "Pseudocode"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: designChoice === "diagram" ? "default" : "outline",
                      onClick: () => setDesignChoice("diagram"),
                      disabled: isPaused,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "w-4 h-4 mr-2" }),
                        "Structure Diagram"
                      ]
                    }
                  )
                ] }),
                designChoice === "pseudocode" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "Write your pseudocode below:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Textarea,
                    {
                      value: textAnswer,
                      onChange: (e) => setTextAnswer(e.target.value),
                      placeholder: "PROCEDURE name\n  SET variable TO value\n  IF condition THEN\n    ...\n  END IF\nEND PROCEDURE",
                      rows: 12,
                      disabled: isPaused,
                      className: "font-mono text-sm",
                      onKeyDown: (e) => {
                        if (e.key === "Tab") {
                          e.preventDefault();
                          const target = e.target;
                          const start = target.selectionStart;
                          const end = target.selectionEnd;
                          const value = target.value;
                          const newValue = value.substring(0, start) + "    " + value.substring(end);
                          setTextAnswer(newValue);
                          setTimeout(() => {
                            target.selectionStart = target.selectionEnd = start + 4;
                          }, 0);
                        }
                      },
                      "data-testid": "pseudocode-answer-input"
                    }
                  )
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "Describe your structure diagram or upload a screenshot:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Textarea,
                    {
                      value: diagramAnswer,
                      onChange: (e) => setDiagramAnswer(e.target.value),
                      placeholder: "Describe your structure diagram here, or upload a screenshot below...",
                      rows: 6,
                      disabled: isPaused,
                      className: "font-mono text-sm",
                      "data-testid": "diagram-answer-input"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "Use the upload section below to attach your structure diagram image." })
                ] })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block font-medium mb-2", children: "Your Answer" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Textarea,
                  {
                    value: textAnswer,
                    onChange: (e) => setTextAnswer(e.target.value),
                    placeholder: "Type your answer here...",
                    rows: 8,
                    disabled: isPaused,
                    className: "font-mono",
                    onKeyDown: (e) => {
                      if (e.key === "Tab") {
                        e.preventDefault();
                        const target = e.target;
                        const start = target.selectionStart;
                        const end = target.selectionEnd;
                        const value = target.value;
                        const newValue = value.substring(0, start) + "  " + value.substring(end);
                        setTextAnswer(newValue);
                        setTimeout(() => {
                          target.selectionStart = target.selectionEnd = start + 2;
                        }, 0);
                      }
                    },
                    "data-testid": "text-answer-input"
                  }
                )
              ] }),
              currentPart.isPractical && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block font-medium mb-2", children: "Code Submission" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Textarea,
                  {
                    value: codeAnswer,
                    onChange: (e) => setCodeAnswer(e.target.value),
                    placeholder: "Paste your code here...",
                    rows: 10,
                    disabled: isPaused,
                    className: "font-mono text-sm",
                    onKeyDown: (e) => {
                      if (e.key === "Tab") {
                        e.preventDefault();
                        const target = e.target;
                        const start = target.selectionStart;
                        const end = target.selectionEnd;
                        const value = target.value;
                        const newValue = value.substring(0, start) + "  " + value.substring(end);
                        setCodeAnswer(newValue);
                        setTimeout(() => {
                          target.selectionStart = target.selectionEnd = start + 2;
                        }, 0);
                      }
                    },
                    "data-testid": "code-answer-input"
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              onClick: saveCurrentResponse,
              disabled: isPaused || isSaving,
              children: isSaving ? "Saving..." : "Save Progress"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handleSubmitPart,
              disabled: isPaused,
              className: "bg-green-600 hover:bg-green-700",
              "data-testid": "submit-part-button",
              children: [
                "Submit Part ",
                currentPart.partLabel,
                " & Continue",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4 ml-2" })
              ]
            }
          )
        ] })
      ] }),
      attempt?.status === "completed" && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-16 w-16 mx-auto mb-4 text-green-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-2", children: "Assignment Complete!" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-600 dark:text-neutral-400 mb-6", children: "You have successfully completed all parts of this assignment." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setLocation("/assignments"), children: "Back to Assignments" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showSectionChoice, onOpenChange: setShowSectionChoice, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Choose Your Optional Section" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "You will complete the Software Design section (compulsory) plus one of the following:" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            className: "w-full h-auto py-4 flex flex-col items-start",
            variant: "outline",
            onClick: () => handleStartWithSection("database"),
            "data-testid": "choose-database",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Database Design and Development" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-neutral-500", children: "Work with databases, SQL queries, and data manipulation" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            className: "w-full h-auto py-4 flex flex-col items-start",
            variant: "outline",
            onClick: () => handleStartWithSection("web"),
            "data-testid": "choose-web",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Web Design and Development" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-neutral-500", children: "Work with HTML, CSS, and web page design" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: () => setLocation("/assignments"), children: "Cancel" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: showConfirmSubmit, onOpenChange: setShowConfirmSubmit, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-5 w-5 text-amber-500" }),
          "Submit Part ",
          currentPart?.partLabel,
          "?"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "Once you submit this part, it will be ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "locked" }),
            " and you will not be able to view or edit your answers."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-amber-600 dark:text-amber-400", children: "Make sure you have completed all tasks before submitting." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Continue Working" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: confirmSubmitPart, className: "bg-green-600 hover:bg-green-700", children: "Submit & Continue" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: showPauseConfirm, onOpenChange: setShowPauseConfirm, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Pause Assignment?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "Your progress will be saved and the timer will stop. You can resume at any time." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Keep Working" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: confirmPause, children: "Pause & Save" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: showCancelConfirm, onOpenChange: setShowCancelConfirm, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogTitle, { className: "flex items-center gap-2 text-red-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-5 w-5" }),
          "Cancel Assignment?"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Are you sure you want to cancel this assignment? This will end your attempt and you will not be able to resume it." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-red-600", children: "Any answers you have already submitted will still be saved, but unsubmitted work will be lost." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Keep Working" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: confirmCancelAssignment, className: "bg-red-600 hover:bg-red-700", children: "Cancel Assignment" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showChecklist, onOpenChange: setShowChecklist, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[80vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-5 w-5" }),
          "Evidence Checklist"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Evidence you need to provide for this assignment" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 py-4", "data-testid": "checklist-content", children: [
        (() => {
          const sddItems = assignment?.evidenceChecklist?.filter((item) => item.sectionType === "sdd") || [];
          if (sddItems.length === 0) return null;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-sm text-neutral-600 dark:text-neutral-400 mb-2", children: "Software Design and Development" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full border rounded", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-3 py-2 text-sm font-medium", children: "Evidence Required" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: sddItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t", children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-sm", children: item.description }) }, item.id)) })
            ] })
          ] });
        })(),
        (() => {
          const dbItems = assignment?.evidenceChecklist?.filter((item) => item.sectionType === "database") || [];
          if (dbItems.length === 0) return null;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-sm text-neutral-600 dark:text-neutral-400 mb-2", children: "Database Design and Development" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full border rounded", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-3 py-2 text-sm font-medium", children: "Evidence Required" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: dbItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t", children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-sm", children: item.description }) }, item.id)) })
            ] })
          ] });
        })(),
        (() => {
          const webItems = assignment?.evidenceChecklist?.filter((item) => item.sectionType === "web") || [];
          if (webItems.length === 0) return null;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-sm text-neutral-600 dark:text-neutral-400 mb-2", children: "Web Design and Development" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full border rounded", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-3 py-2 text-sm font-medium", children: "Evidence Required" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: webItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t", children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-sm", children: item.description }) }, item.id)) })
            ] })
          ] });
        })()
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setShowChecklist(false), "data-testid": "button-close-checklist", children: "Close" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showInfoSheet, onOpenChange: setShowInfoSheet, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-3xl max-h-[80vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-5 w-5 text-purple-600" }),
          "Information Sheet"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
          "Reference material for ",
          currentSection?.title || "this section"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4 py-4", "data-testid": "info-sheet-content", children: (() => {
        const renderInfoBlock = (block, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          block.type === "heading" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-4 mb-2", children: block.content }),
          block.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx(RichTextBlock, { content: block.content }),
          block.type === "image" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("figure", { className: "my-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: block.content,
                alt: block.caption || "Information sheet image",
                className: `rounded-lg ${block.imageSize === "small" ? "max-w-xs" : block.imageSize === "medium" ? "max-w-md" : block.imageSize === "large" ? "max-w-2xl" : "max-w-full"}`
              }
            ),
            block.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("figcaption", { className: "text-sm text-neutral-500 mt-2", children: block.caption })
          ] }),
          block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg overflow-x-auto my-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-sm font-mono", children: block.content }) }),
          block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveDataTable, { dataTable: block.dataTable }) }),
          block.type === "pseudocode" && block.pseudocode && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-4 border rounded-lg overflow-hidden", children: [
            block.pseudocode.heading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-100 dark:bg-neutral-800 px-4 py-2 font-medium text-sm border-b", children: block.pseudocode.heading }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 font-mono text-sm bg-neutral-50 dark:bg-neutral-900", children: block.pseudocode.lines.map((line, lineIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-400 w-8 text-right select-none", children: line.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: line.code })
            ] }, line.id || lineIdx)) })
          ] }),
          block.type === "row-layout" && block.children && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col md:flex-row gap-4 items-start my-4", children: block.children.map((child, childIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: renderInfoBlock(child, childIdx) }, child.id || childIdx)) })
        ] }, block.id || idx);
        return currentSection?.informationSheet?.map((block, idx) => renderInfoBlock(block, idx));
      })() }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setShowInfoSheet(false), "data-testid": "button-close-info-sheet", children: "Close" }) })
    ] }) })
  ] });
}
export {
  StudentAssignmentFlow as default
};
//# sourceMappingURL=StudentAssignmentFlow-B7WtIKDu.js.map
