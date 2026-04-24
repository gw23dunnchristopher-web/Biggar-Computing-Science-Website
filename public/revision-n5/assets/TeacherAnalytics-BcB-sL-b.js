import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, g as cn, u as useLocation, a as useToast, E as Eye } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent } from "./card-D7eXR4Y_.js";
import { S as Save, a as Select, b as SelectTrigger, c as SelectValue, d as SelectContent, e as SelectItem } from "./select-BoXHqBzp.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle } from "./dialog-DTiCktmM.js";
import { B as Badge } from "./badge-CTdnfMqk.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CtGyirbS.js";
import { T as Textarea } from "./textarea-DVZKhD5j.js";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-Dav9MFAg.js";
import { I as Input } from "./input-BglVfhce.js";
import { D as DiagramEditor } from "./diagram-editor-YPWk6RIh.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { U as Users } from "./users-DcejMkzk.js";
import { C as ClipboardList } from "./clipboard-list-CmHQQSTg.js";
import { F as FileText } from "./file-text-7qIELcrq.js";
import { B as BookOpen } from "./book-open-CHMNkO2H.js";
import { C as Clock } from "./clock-CBMrk16J.js";
import { C as ChevronUp } from "./chevron-up-BGYeYs9P.js";
import { C as ChevronDown } from "./chevron-down-C5HdvL5Z.js";
import { C as CircleCheck } from "./circle-check-CfjmjGXe.js";
import { L as LoaderCircle } from "./loader-circle-BUW4OaHl.js";
import { C as ChartColumn } from "./chart-column-Cr8aE8Tc.js";
import { T as Trash2 } from "./trash-2-bLg5w6uM.js";
import { P as Pencil } from "./pencil-BpyvL5SV.js";
import "./index-D-MpoJPS.js";
import "./Combination-DqZOzdwe.js";
import "./index-C94DArSW.js";
import "./index-CXp8eGpS.js";
import "./check-tIL4sncn.js";
import "./index-CxDJjHs5.js";
import "./index-Ck6_BvxI.js";
import "./circle-D4qz0ZWK.js";
import "./database-C7hi9e55.js";
import "./list-CSQ5KgpQ.js";
const __iconNode = [
  [
    "path",
    {
      d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
      key: "169zse"
    }
  ]
];
const Activity = createLucideIcon("activity", __iconNode);
const Table = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  "table",
  {
    ref,
    className: cn("w-full caption-bottom text-sm", className),
    ...props
  }
) }));
Table.displayName = "Table";
const TableHeader = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { ref, className: cn("[&_tr]:border-b", className), ...props }));
TableHeader.displayName = "TableHeader";
const TableBody = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "tbody",
  {
    ref,
    className: cn("[&_tr:last-child]:border-0", className),
    ...props
  }
));
TableBody.displayName = "TableBody";
const TableFooter = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "tfoot",
  {
    ref,
    className: cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    ),
    ...props
  }
));
TableFooter.displayName = "TableFooter";
const TableRow = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "tr",
  {
    ref,
    className: cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    ),
    ...props
  }
));
TableRow.displayName = "TableRow";
const TableHead = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "th",
  {
    ref,
    className: cn(
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    ),
    ...props
  }
));
TableHead.displayName = "TableHead";
const TableCell = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "td",
  {
    ref,
    className: cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    ),
    ...props
  }
));
TableCell.displayName = "TableCell";
const TableCaption = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "caption",
  {
    ref,
    className: cn("mt-4 text-sm text-muted-foreground", className),
    ...props
  }
));
TableCaption.displayName = "TableCaption";
function getAuthHeaders() {
  const token = localStorage.getItem("teacherToken") || localStorage.getItem("teacher_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
async function fetchWithAuth(url) {
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}
function ScoreBar({ score, maxScore, label }) {
  const pct = maxScore > 0 ? Math.round(score / maxScore * 100) : 0;
  const color = pct >= 70 ? "bg-green-500 dark:bg-green-600" : pct >= 40 ? "bg-amber-500 dark:bg-amber-500" : "bg-red-500 dark:bg-red-500";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-[140px]", "data-testid": "score-bar", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 h-5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `h-full rounded-full transition-all duration-300 ${color}`,
          style: { width: `${Math.max(pct, 2)}%` }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-800 dark:text-neutral-100 mix-blend-normal drop-shadow-sm", children: label ?? `${score}/${maxScore}` })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-500 w-9 text-right", children: [
      pct,
      "%"
    ] })
  ] });
}
function ExamBarChart({ data }) {
  if (data.length === 0) return null;
  const BAR_H = 120;
  const BAR_W = 36;
  const GAP = 12;
  const LABEL_H = 56;
  const TOP_PAD = 28;
  const LEFT_PAD = 32;
  const totalW = LEFT_PAD + data.length * (BAR_W + GAP) + GAP;
  const totalH = TOP_PAD + BAR_H + LABEL_H;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: Math.max(totalW, 200), height: totalH, "aria-label": "Student score chart", children: [
    [25, 50, 75, 100].map((pct) => {
      const y = TOP_PAD + BAR_H - pct / 100 * BAR_H;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: LEFT_PAD, y1: y, x2: totalW, y2: y, stroke: "currentColor", strokeOpacity: "0.1", strokeWidth: "1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("text", { x: LEFT_PAD - 4, y: y + 4, fontSize: "9", fill: "currentColor", fillOpacity: "0.5", textAnchor: "end", children: [
          pct,
          "%"
        ] })
      ] }, pct);
    }),
    data.map((item, i) => {
      const x = LEFT_PAD + GAP + i * (BAR_W + GAP);
      const barH = Math.max(item.pct / 100 * BAR_H, item.pct > 0 ? 3 : 0);
      const y = TOP_PAD + BAR_H - barH;
      const color = item.pct >= 70 ? "#22c55e" : item.pct >= 40 ? "#f59e0b" : "#ef4444";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x, y, width: BAR_W, height: barH, fill: color, fillOpacity: "0.85", rx: "3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("text", { x: x + BAR_W / 2, y: y - 5, fontSize: "10", fontWeight: "600", fill: "currentColor", textAnchor: "middle", children: [
          item.pct,
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: x + BAR_W / 2,
            y: TOP_PAD + BAR_H + 10,
            fontSize: "9",
            fill: "currentColor",
            fillOpacity: "0.75",
            textAnchor: "end",
            transform: `rotate(-45, ${x + BAR_W / 2}, ${TOP_PAD + BAR_H + 10})`,
            children: item.label.length > 14 ? item.label.slice(0, 13) + "…" : item.label
          }
        )
      ] }, item.label);
    }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: LEFT_PAD, y1: TOP_PAD + BAR_H, x2: totalW, y2: TOP_PAD + BAR_H, stroke: "currentColor", strokeOpacity: "0.2", strokeWidth: "1.5" })
  ] }) });
}
function DifficultyBadge({ difficulty }) {
  if (difficulty < 30) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { "data-testid": "badge-difficulty-easy", className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 hover:bg-green-100", children: [
      "Easy (",
      difficulty,
      "%)"
    ] });
  }
  if (difficulty <= 60) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { "data-testid": "badge-difficulty-medium", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 hover:bg-amber-100", children: [
      "Medium (",
      difficulty,
      "%)"
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { "data-testid": "badge-difficulty-hard", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 hover:bg-red-100", children: [
    "Hard (",
    difficulty,
    "%)"
  ] });
}
function formatTimeLeft(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
  return `${mins}m ${secs}s`;
}
const DIAGRAM_INPUT_STYLES = /* @__PURE__ */ new Set([
  "drawing",
  "structure-dataflow",
  "form-wireframe",
  "webpage-wireframe",
  "erd-annotation",
  "nav-structure",
  "nav-structure-higher",
  "design-choice"
]);
const INPUT_STYLE_TO_MODE = {
  "drawing": "flowchart",
  "structure-dataflow": "structure-dataflow",
  "form-wireframe": "form-wireframe",
  "webpage-wireframe": "webpage-wireframe",
  "erd-annotation": "erd-annotation",
  "nav-structure": "nav-structure",
  "nav-structure-higher": "nav-structure-higher",
  "design-choice": "structure-diagram"
};
function isDiagramAnswer(item) {
  if (item.inputStyle && DIAGRAM_INPUT_STYLES.has(item.inputStyle)) return true;
  if (typeof item.userAnswer === "object" && item.userAnswer !== null) {
    const keys = Object.keys(item.userAnswer);
    if (keys.includes("drawing") || keys.includes("erd_diagram") || keys.includes("drawing_canvas")) {
      return true;
    }
  }
  return false;
}
function DiagramAnswerViewer({ item }) {
  const answer = typeof item.userAnswer === "object" ? item.userAnswer : {};
  const diagramData = answer["drawing"] || answer["erd_diagram"] || "";
  const drawingData = answer["drawing_canvas"] || answer["erd_drawing"] || "";
  const inputStyle = item.inputStyle || "";
  const hasVisualData = diagramData && diagramData.startsWith("[") || drawingData && drawingData.startsWith("data:");
  if (!hasVisualData) return null;
  let mode = INPUT_STYLE_TO_MODE[inputStyle] || "flowchart";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-900", "data-testid": "diagram-viewer", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-[350px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    DiagramEditor,
    {
      initialData: diagramData,
      initialDrawing: drawingData,
      disabled: true,
      mode
    }
  ) }) });
}
function ExamResultReviewDialog({ examResultId, open, onOpenChange, onUpdated }) {
  const { toast } = useToast();
  const [loading, setLoading] = reactExports.useState(false);
  const [saving, setSaving] = reactExports.useState(false);
  const [result, setResult] = reactExports.useState(null);
  const [editedBreakdown, setEditedBreakdown] = reactExports.useState([]);
  const [hasChanges, setHasChanges] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!examResultId || !open) {
      setResult(null);
      setEditedBreakdown([]);
      return;
    }
    setLoading(true);
    setHasChanges(false);
    setResult(null);
    setEditedBreakdown([]);
    fetchWithAuth(`/api/teacher/exam-results/${examResultId}`).then((data) => {
      setResult(data);
      setEditedBreakdown(data.breakdown || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [examResultId, open]);
  const [editingFeedback, setEditingFeedback] = reactExports.useState(null);
  const updateScore = (index, newScore) => {
    setEditedBreakdown((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], score: Math.max(0, Math.min(newScore, updated[index].maxMarks)) };
      return updated;
    });
    setHasChanges(true);
  };
  const updateFeedback = (index, newFeedback) => {
    setEditedBreakdown((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], feedback: newFeedback };
      return updated;
    });
    setHasChanges(true);
  };
  const totalScore = editedBreakdown.reduce((sum, q) => sum + (q.score || 0), 0);
  const totalMax = editedBreakdown.reduce((sum, q) => sum + (q.maxMarks || 0), 0);
  const pct = totalMax > 0 ? totalScore / totalMax * 100 : 0;
  const computedGrade = pct >= 85 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 50 ? "D" : "No Award";
  const handleSave = async () => {
    if (!examResultId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/exam-results/${examResultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ breakdown: editedBreakdown })
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setResult(updated);
      setHasChanges(false);
      toast({ title: "Marks updated", description: `New score: ${totalScore}/${totalMax} (${computedGrade})` });
      onUpdated?.();
    } catch (e) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  const formatAnswer = (answer) => {
    if (typeof answer === "string") return answer;
    if (!answer || typeof answer !== "object") return "";
    return Object.entries(answer).filter(([, v]) => v && v.trim()).map(([k, v]) => `${k}: ${v}`).join("\n");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-[95vw] sm:max-w-[90vw] lg:max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden", style: { width: "100%", maxWidth: "64rem" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center justify-between", "data-testid": "text-exam-review-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Exam Result Review" }),
      result && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-normal", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          totalScore,
          "/",
          totalMax
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: hasChanges ? computedGrade : result.grade || computedGrade })
      ] })
    ] }) }),
    loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin" }) }),
    !loading && result && editedBreakdown.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-neutral-500", children: [
          result.year > 0 ? `${result.year} Paper` : "Additional Paper",
          result.optionalSection ? ` (${result.optionalSection === "dd" ? "Database" : "Web"})` : ""
        ] }),
        hasChanges && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSave, disabled: saving, size: "sm", className: "gap-1", "data-testid": "button-save-marks", children: [
          saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3 w-3" }),
          "Save Changes"
        ] })
      ] }),
      editedBreakdown.map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-neutral-200 dark:border-neutral-800", "data-testid": `card-question-${idx}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "py-3 px-4 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm font-medium", children: [
            item.questionTitle,
            " ",
            item.subLabel ? `(${item.subLabel})` : ""
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                min: 0,
                max: item.maxMarks,
                value: item.score,
                onChange: (e) => updateScore(idx, parseInt(e.target.value) || 0),
                className: "w-16 h-7 text-center text-sm",
                "data-testid": `input-score-${idx}`
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-neutral-500", children: [
              "/ ",
              item.maxMarks
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-3 px-4 space-y-3 min-w-0", children: [
          item.questionText && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-neutral-400 mb-1", children: "Question" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-700 dark:text-neutral-300", children: item.questionText })
          ] }),
          item.contentBlocks && item.contentBlocks.length > 0 && !item.questionText && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-neutral-400 mb-1", children: "Question" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-neutral-700 dark:text-neutral-300", children: item.contentBlocks.filter((b) => b.type === "text").map((b, bi) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: b.content }, bi)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-neutral-400 mb-1", children: "Student Answer" }),
            isDiagramAnswer(item) ? /* @__PURE__ */ jsxRuntimeExports.jsx(DiagramAnswerViewer, { item }) : /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-sm bg-neutral-100 dark:bg-neutral-800 rounded p-2 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto", style: { overflowWrap: "anywhere", wordBreak: "break-word" }, children: formatAnswer(item.userAnswer) || /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-400 italic", children: "No answer provided" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-neutral-400", children: "Feedback" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  className: "text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1",
                  onClick: () => setEditingFeedback(editingFeedback === idx ? null : idx),
                  "data-testid": `button-edit-feedback-${idx}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3" }),
                    editingFeedback === idx ? "Done" : "Edit"
                  ]
                }
              )
            ] }),
            editingFeedback === idx ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                value: item.feedback || "",
                onChange: (e) => updateFeedback(idx, e.target.value),
                className: "text-sm min-h-[80px] w-full",
                "data-testid": `textarea-feedback-${idx}`
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap", style: { overflowWrap: "anywhere" }, children: item.feedback || /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic text-neutral-400", children: "No feedback" }) })
          ] }),
          item.suggestions && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-blue-400 mb-1", children: "Suggestions" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-blue-600 dark:text-blue-400", style: { overflowWrap: "anywhere" }, children: item.suggestions })
          ] })
        ] })
      ] }, idx)),
      hasChanges && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky bottom-0 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between rounded-b-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
            "New Total: ",
            totalScore,
            "/",
            totalMax
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "ml-2", children: computedGrade })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSave, disabled: saving, size: "sm", className: "gap-1", children: [
          saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3 w-3" }),
          "Save Changes"
        ] })
      ] })
    ] }),
    !loading && result && editedBreakdown.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 py-4", children: "No detailed breakdown available for this result." })
  ] }) });
}
function ClassOverviewTab() {
  const [classes, setClasses] = reactExports.useState([]);
  const [selectedClassId, setSelectedClassId] = reactExports.useState("");
  const [overview, setOverview] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [selectedStudent, setSelectedStudent] = reactExports.useState(null);
  const [detailOpen, setDetailOpen] = reactExports.useState(false);
  const [detailLoading, setDetailLoading] = reactExports.useState(false);
  const [activeProgress, setActiveProgress] = reactExports.useState([]);
  const [expandedProgress, setExpandedProgress] = reactExports.useState(/* @__PURE__ */ new Set());
  const [reviewExamId, setReviewExamId] = reactExports.useState(null);
  const [reviewOpen, setReviewOpen] = reactExports.useState(false);
  const [orphanedResults, setOrphanedResults] = reactExports.useState([]);
  const [orphansLoading, setOrphansLoading] = reactExports.useState(false);
  const [showOrphans, setShowOrphans] = reactExports.useState(false);
  const [linkingId, setLinkingId] = reactExports.useState(null);
  const { toast } = useToast();
  reactExports.useEffect(() => {
    fetchWithAuth("/api/teacher/classes").then((data) => {
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    }).catch(console.error);
  }, []);
  reactExports.useEffect(() => {
    if (!selectedClassId) {
      setOverview([]);
      setActiveProgress([]);
      return;
    }
    setLoading(true);
    fetchWithAuth(`/api/teacher/classes/${selectedClassId}/overview`).then(setOverview).catch(console.error).finally(() => setLoading(false));
    fetchWithAuth(`/api/teacher/classes/${selectedClassId}/active-progress`).then(setActiveProgress).catch(console.error);
    const interval = setInterval(() => {
      fetchWithAuth(`/api/teacher/classes/${selectedClassId}/active-progress`).then(setActiveProgress).catch(console.error);
    }, 3e4);
    return () => clearInterval(interval);
  }, [selectedClassId]);
  const loadStudentDetail = reactExports.useCallback(async (studentId) => {
    try {
      const detail = await fetchWithAuth(`/api/teacher/students/${studentId}/detail`);
      setSelectedStudent(detail);
    } catch (e) {
      console.error(e);
    }
  }, []);
  const loadOrphanedResults = reactExports.useCallback(async () => {
    setOrphansLoading(true);
    try {
      const results = await fetchWithAuth("/api/teacher/orphaned-exam-results");
      setOrphanedResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setOrphansLoading(false);
    }
  }, []);
  const handleLinkResult = reactExports.useCallback(async (examResultId, studentId) => {
    setLinkingId(examResultId);
    try {
      const res = await fetch("/api/teacher/link-exam-result", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ examResultId, studentId })
      });
      if (!res.ok) throw new Error("Failed to link result");
      toast({ title: "Result linked successfully" });
      setOrphanedResults((prev) => prev.filter((r) => r.id !== examResultId));
      await loadStudentDetail(studentId);
    } catch (e) {
      toast({ title: "Failed to link result", variant: "destructive" });
    } finally {
      setLinkingId(null);
    }
  }, [loadStudentDetail, toast]);
  const openStudentDetail = reactExports.useCallback(async (studentId) => {
    setDetailLoading(true);
    setDetailOpen(true);
    setShowOrphans(false);
    setOrphanedResults([]);
    try {
      await loadStudentDetail(studentId);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  }, [loadStudentDetail]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-4", children: classes.length > 1 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: classes.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        variant: selectedClassId === c.id ? "default" : "outline",
        size: "sm",
        onClick: () => setSelectedClassId(c.id),
        "data-testid": `btn-class-${c.id}`,
        children: c.name
      },
      c.id
    )) }) : classes.length === 1 ? /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", "data-testid": "text-class-name", children: classes[0].name }) : null }),
    !loading && selectedClassId && activeProgress.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-950/10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "h-4 w-4 text-green-600" }),
        "Currently Active (",
        activeProgress.length,
        " student",
        activeProgress.length !== 1 ? "s" : "",
        ")"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: activeProgress.map((ap) => {
        const isStale = (/* @__PURE__ */ new Date()).getTime() - new Date(ap.updatedAt).getTime() > 5 * 60 * 1e3;
        const progressKey = ap.studentId + ap.type + ap.label;
        const isExpanded = expandedProgress.has(progressKey);
        const hasQuestionDetail = ap.answeredQuestionIds && ap.answeredQuestionIds.length > 0;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden",
            "data-testid": `active-progress-${ap.studentId}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `flex items-center justify-between px-4 py-3 ${hasQuestionDetail ? "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50" : ""}`,
                  onClick: () => {
                    if (!hasQuestionDetail) return;
                    setExpandedProgress((prev) => {
                      const next = new Set(prev);
                      if (next.has(progressKey)) next.delete(progressKey);
                      else next.add(progressKey);
                      return next;
                    });
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm", children: ap.username }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: ap.type === "exam" ? "border-blue-300 text-blue-600" : "border-amber-300 text-amber-600", children: ap.type === "exam" ? "Exam" : "Assignment" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-500", children: ap.label })
                      ] })
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-neutral-600 dark:text-neutral-400", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTimeLeft(ap.timeLeft) })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-neutral-500", children: [
                          "Q",
                          ap.currentQuestion + 1,
                          " of ",
                          ap.totalQuestions,
                          " (",
                          ap.answeredCount,
                          " answered)"
                        ] })
                      ] }),
                      isStale && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "border-orange-300 text-orange-500 text-xs", children: "Idle" }),
                      hasQuestionDetail && (isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-4 w-4 text-neutral-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4 text-neutral-400" }))
                    ] })
                  ]
                }
              ),
              isExpanded && hasQuestionDetail && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-3 pt-1 border-t border-neutral-100 dark:border-neutral-800", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-neutral-500 mb-2", children: "Answered Questions:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: ap.answeredQuestionIds.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "text-xs gap-1 font-normal", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3 w-3 text-green-500" }),
                  q.label
                ] }, q.id)) })
              ] })
            ]
          },
          progressKey
        );
      }) }) })
    ] }),
    loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-neutral-500" }) }),
    !loading && selectedClassId && overview.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-12 text-neutral-500", "data-testid": "text-no-students", children: "No students found in this class." }),
    !loading && overview.filter((s) => s.examResults.length > 0).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "w-4 h-4" }),
        "Class Score Overview"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        ExamBarChart,
        {
          data: overview.filter((s) => s.examResults.length > 0).map((s) => {
            const totalScore = s.examResults.reduce((sum, r) => sum + r.score, 0);
            const totalMax = s.examResults.reduce((sum, r) => sum + r.maxScore, 0);
            const pct = totalMax > 0 ? Math.round(totalScore / totalMax * 100) : 0;
            return { label: s.username, pct };
          }).sort((a, b) => b.pct - a.pct)
        }
      ) })
    ] }),
    !loading && overview.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-testid": "table-class-overview", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Username" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Latest Exam Score" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Exams Completed" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Assignments" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: overview.map((student) => {
        const latestExam = student.examResults.length > 0 ? student.examResults.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""))[0] : null;
        const completedAssignments = student.assignmentAttempts.filter((a) => a.status === "completed").length;
        const inProgressAssignments = student.assignmentAttempts.filter((a) => a.status === "in_progress" || a.status === "paused").length;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          TableRow,
          {
            className: "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900",
            onClick: () => openStudentDetail(student.id),
            "data-testid": `row-student-${student.id}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", "data-testid": `text-username-${student.id}`, children: student.username }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { "data-testid": `text-exam-score-${student.id}`, children: latestExam ? /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreBar, { score: latestExam.score, maxScore: latestExam.maxScore, label: `${latestExam.score}/${latestExam.maxScore} (${latestExam.grade})` }) : "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { "data-testid": `text-exams-count-${student.id}`, children: student.examResults.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "default", children: student.examResults.length }) : "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { "data-testid": `text-status-${student.id}`, children: student.assignmentAttempts.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
                completedAssignments > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "default", children: [
                  completedAssignments,
                  " done"
                ] }),
                inProgressAssignments > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
                  inProgressAssignments,
                  " in progress"
                ] })
              ] }) : "—" })
            ]
          },
          student.id
        );
      }) })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: detailOpen, onOpenChange: setDetailOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[80vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { "data-testid": "text-student-detail-title", children: selectedStudent ? `Student: ${selectedStudent.student.username}` : "Student Detail" }) }),
      detailLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-neutral-500" }) }),
      !detailLoading && selectedStudent && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2", children: "Exam Results" }),
          selectedStudent.examResults.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500", children: "No exam results yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", "data-testid": "list-exam-results", children: selectedStudent.examResults.map((er, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group",
              "data-testid": `exam-result-${i}`,
              onClick: () => {
                if (er.id) {
                  setReviewExamId(er.id);
                  setReviewOpen(true);
                }
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
                  er.year > 0 ? er.year : "Additional",
                  er.optionalSection ? ` (${er.optionalSection === "dd" ? "Database" : er.optionalSection === "wd" ? "Web" : er.optionalSection})` : ""
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 max-w-[180px] mx-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreBar, { score: er.score, maxScore: er.maxScore }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: er.grade }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3.5 w-3.5 text-neutral-400 group-hover:text-blue-500 transition-colors" })
                ] })
              ]
            },
            er.id || i
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: !showOrphans ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => {
              setShowOrphans(true);
              loadOrphanedResults();
            },
            "data-testid": "btn-show-orphans",
            children: "Link Unlinked Exam Results"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-neutral-700 dark:text-neutral-300", children: "Unlinked Exam Results" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500", children: 'These results were saved without a student account. Click "Link" to assign one to this student.' }),
          orphansLoading && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin text-neutral-500" }),
          !orphansLoading && orphanedResults.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500", children: "No unlinked results found." }),
          !orphansLoading && orphanedResults.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: orphanedResults.map((or) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800", "data-testid": `orphan-result-${or.id}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm", children: or.year > 0 ? `${or.year} Paper` : "Mock Exam" }),
              or.optionalSection && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-500 ml-1", children: [
                "(",
                or.optionalSection === "dd" ? "Database" : "Web",
                ")"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm ml-2", children: [
                or.score,
                "/",
                or.maxScore,
                " (",
                or.grade,
                ")"
              ] }),
              or.timestamp && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-400 ml-2", children: new Date(or.timestamp).toLocaleDateString() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "sm",
                variant: "default",
                disabled: linkingId === or.id,
                onClick: () => selectedStudent && handleLinkResult(or.id, selectedStudent.student.id),
                "data-testid": `btn-link-${or.id}`,
                children: linkingId === or.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin" }) : "Link to Student"
              }
            )
          ] }, or.id)) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2", children: "Assignment Attempts" }),
          selectedStudent.assignments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500", children: "No assignment attempts yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", "data-testid": "list-assignment-attempts", children: selectedStudent.assignments.map((a, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-testid": `assignment-attempt-${i}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "py-3 px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: a.attempt.assignmentTitle }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: a.attempt.status === "completed" ? "default" : "secondary", children: a.attempt.status })
            ] }) }),
            a.responses.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "py-2 px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: a.responses.map((r, ri) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-neutral-500", children: [
                "Q",
                ri + 1
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: r.marksAwarded !== null && r.marksAwarded !== void 0 ? `${r.marksAwarded} marks` : "Not graded" }),
              r.aiFeedback && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-400 truncate max-w-[200px]", title: r.aiFeedback, children: r.aiFeedback })
            ] }, r.id || ri)) }) })
          ] }, a.attempt.id || i)) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ExamResultReviewDialog,
      {
        examResultId: reviewExamId,
        open: reviewOpen,
        onOpenChange: setReviewOpen,
        onUpdated: () => {
          if (selectedStudent) {
            loadStudentDetail(selectedStudent.student.id);
          }
          if (selectedClassId) {
            fetchWithAuth(`/api/teacher/classes/${selectedClassId}/overview`).then(setOverview).catch(console.error);
          }
        }
      }
    )
  ] });
}
function StudentResultsTab() {
  const { toast } = useToast();
  const [classes, setClasses] = reactExports.useState([]);
  const [selectedClassId, setSelectedClassId] = reactExports.useState("");
  const [students, setStudents] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [expandedStudent, setExpandedStudent] = reactExports.useState(null);
  const [studentDetail, setStudentDetail] = reactExports.useState(null);
  const [detailLoading, setDetailLoading] = reactExports.useState(false);
  const [expandedPaper, setExpandedPaper] = reactExports.useState(null);
  const [paperBreakdown, setPaperBreakdown] = reactExports.useState([]);
  const [paperLoading, setPaperLoading] = reactExports.useState(false);
  const [editedBreakdown, setEditedBreakdown] = reactExports.useState([]);
  const [hasChanges, setHasChanges] = reactExports.useState(false);
  const [saving, setSaving] = reactExports.useState(false);
  const [editingFeedbackIdx, setEditingFeedbackIdx] = reactExports.useState(null);
  const [currentPaperId, setCurrentPaperId] = reactExports.useState(null);
  reactExports.useEffect(() => {
    fetchWithAuth("/api/teacher/classes").then((data) => {
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    }).catch(console.error);
  }, []);
  reactExports.useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      return;
    }
    setLoading(true);
    setExpandedStudent(null);
    setStudentDetail(null);
    setExpandedPaper(null);
    fetchWithAuth(`/api/teacher/classes/${selectedClassId}/overview`).then(setStudents).catch(console.error).finally(() => setLoading(false));
  }, [selectedClassId]);
  const toggleStudent = async (studentId) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
      setStudentDetail(null);
      setExpandedPaper(null);
      return;
    }
    setExpandedStudent(studentId);
    setExpandedPaper(null);
    setDetailLoading(true);
    try {
      const detail = await fetchWithAuth(`/api/teacher/students/${studentId}/detail`);
      setStudentDetail(detail);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };
  const loadPaperBreakdown = async (examResultId) => {
    if (expandedPaper === examResultId) {
      setExpandedPaper(null);
      setPaperBreakdown([]);
      setEditedBreakdown([]);
      setHasChanges(false);
      setCurrentPaperId(null);
      setEditingFeedbackIdx(null);
      return;
    }
    setExpandedPaper(examResultId);
    setCurrentPaperId(examResultId);
    setPaperLoading(true);
    setHasChanges(false);
    setEditingFeedbackIdx(null);
    try {
      const data = await fetchWithAuth(`/api/teacher/exam-results/${examResultId}`);
      setPaperBreakdown(data.breakdown || []);
      setEditedBreakdown(data.breakdown || []);
    } catch (e) {
      console.error(e);
    } finally {
      setPaperLoading(false);
    }
  };
  const updateScore = (index, newScore) => {
    setEditedBreakdown((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], score: Math.max(0, Math.min(newScore, updated[index].maxMarks)) };
      return updated;
    });
    setHasChanges(true);
  };
  const updateFeedback = (index, newFeedback) => {
    setEditedBreakdown((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], feedback: newFeedback };
      return updated;
    });
    setHasChanges(true);
  };
  const handleSave = async () => {
    if (!currentPaperId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/exam-results/${currentPaperId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ breakdown: editedBreakdown })
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setPaperBreakdown(updated.breakdown || []);
      setEditedBreakdown(updated.breakdown || []);
      setHasChanges(false);
      const totalScore2 = (updated.breakdown || []).reduce((s, q) => s + (q.score || 0), 0);
      const totalMax2 = (updated.breakdown || []).reduce((s, q) => s + (q.maxMarks || 0), 0);
      toast({ title: "Changes saved", description: `Score: ${updated.score}/${updated.maxScore} (${updated.grade})` });
      if (expandedStudent) {
        fetchWithAuth(`/api/teacher/classes/${selectedClassId}/overview`).then(setStudents).catch(console.error);
        fetchWithAuth(`/api/teacher/students/${expandedStudent}/detail`).then(setStudentDetail).catch(console.error);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteExamResult = async (examResultId) => {
    try {
      const res = await fetch(`/api/teacher/exam-results/${examResultId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Exam result removed" });
      if (expandedPaper === examResultId) {
        setExpandedPaper(null);
        setPaperBreakdown([]);
        setEditedBreakdown([]);
      }
      if (expandedStudent) {
        const detail = await fetchWithAuth(`/api/teacher/students/${expandedStudent}/detail`);
        setStudentDetail(detail);
        fetchWithAuth(`/api/teacher/classes/${selectedClassId}/overview`).then(setStudents).catch(console.error);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to remove exam result", variant: "destructive" });
    }
  };
  const handleDeleteAssignmentAttempt = async (attemptId) => {
    try {
      const res = await fetch(`/api/teacher/assignment-attempts/${attemptId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Assignment attempt removed" });
      if (expandedStudent) {
        const detail = await fetchWithAuth(`/api/teacher/students/${expandedStudent}/detail`);
        setStudentDetail(detail);
        fetchWithAuth(`/api/teacher/classes/${selectedClassId}/overview`).then(setStudents).catch(console.error);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to remove assignment attempt", variant: "destructive" });
    }
  };
  const formatAnswer = (answer) => {
    if (typeof answer === "string") return answer;
    if (!answer || typeof answer !== "object") return "";
    return Object.entries(answer).filter(([, v]) => v && v.trim()).map(([k, v]) => `${k}: ${v}`).join("\n");
  };
  const totalScore = editedBreakdown.reduce((sum, q) => sum + (q.score || 0), 0);
  const totalMax = editedBreakdown.reduce((sum, q) => sum + (q.maxMarks || 0), 0);
  const pct = totalMax > 0 ? totalScore / totalMax * 100 : 0;
  const computedGrade = pct >= 85 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 50 ? "D" : "No Award";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-4", children: classes.length > 1 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: classes.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        variant: selectedClassId === c.id ? "default" : "outline",
        size: "sm",
        onClick: () => setSelectedClassId(c.id),
        "data-testid": `btn-results-class-${c.id}`,
        children: c.name
      },
      c.id
    )) }) : classes.length === 1 ? /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", "data-testid": "text-results-class-name", children: classes[0].name }) : null }),
    loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-neutral-500" }) }),
    !loading && selectedClassId && students.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-12 text-neutral-500", children: "No students found in this class." }),
    !loading && students.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: students.map((student) => {
      const isExpanded = expandedStudent === student.id;
      const examCount = student.examResults.length;
      const assignmentCount = student.assignmentAttempts.filter((a) => a.status === "completed").length;
      const totalItems = examCount + assignmentCount;
      examCount > 0 ? student.examResults.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""))[0] : null;
      const avgPct = examCount > 0 ? Math.round(student.examResults.reduce((sum, er) => sum + (er.maxScore > 0 ? er.score / er.maxScore * 100 : 0), 0) / examCount) : null;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden", "data-testid": `student-card-${student.id}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors",
            onClick: () => toggleStudent(student.id),
            "data-testid": `student-toggle-${student.id}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4 text-neutral-400" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm", "data-testid": `student-name-${student.id}`, children: student.username }),
                totalItems > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "text-xs", "data-testid": `student-count-${student.id}`, children: [
                  examCount > 0 ? `${examCount} paper${examCount !== 1 ? "s" : ""}` : "",
                  examCount > 0 && assignmentCount > 0 ? ", " : "",
                  assignmentCount > 0 ? `${assignmentCount} assignment${assignmentCount !== 1 ? "s" : ""}` : ""
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                avgPct !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-neutral-500", "data-testid": `student-avg-${student.id}`, children: [
                  "Avg: ",
                  avgPct,
                  "%"
                ] }),
                isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-4 w-4 text-neutral-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4 text-neutral-400" })
              ] })
            ]
          }
        ),
        isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-neutral-200 dark:border-neutral-800", children: [
          detailLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin text-neutral-500" }) }),
          !detailLoading && studentDetail && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-3", children: [
            (() => {
              const exams = studentDetail.examResults;
              const completedAssignments = studentDetail.assignments.filter((a) => a.attempt.status === "completed");
              const examAvg = exams.length > 0 ? Math.round(exams.reduce((sum, er) => sum + (er.maxScore > 0 ? er.score / er.maxScore * 100 : 0), 0) / exams.length) : null;
              return exams.length > 0 || completedAssignments.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-neutral-100 dark:bg-neutral-800/50 rounded-lg px-4 py-3 flex flex-wrap gap-4 items-center", "data-testid": "student-average-summary", children: [
                examAvg !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-500", children: "Exam Average:" }),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", children: [
                    examAvg,
                    "%"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-neutral-400 ml-1", children: [
                    "(",
                    exams.length,
                    " paper",
                    exams.length !== 1 ? "s" : "",
                    ")"
                  ] })
                ] }),
                completedAssignments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-500", children: "Assignments:" }),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", children: [
                    completedAssignments.length,
                    " completed"
                  ] })
                ] })
              ] }) : null;
            })(),
            studentDetail.examResults.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500", children: "No exam results." }),
            studentDetail.examResults.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || "")).map((er) => {
              const paperLabel = er.year > 0 ? `${er.year} Paper${er.optionalSection ? ` (${er.optionalSection === "dd" ? "Database" : er.optionalSection === "wd" ? "Web" : er.optionalSection})` : ""}` : `Additional Paper${er.optionalSection ? ` (${er.optionalSection === "dd" ? "Database" : er.optionalSection === "wd" ? "Web" : er.optionalSection})` : ""}`;
              const isPaperExpanded = expandedPaper === er.id;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden", "data-testid": `paper-card-${er.id}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors",
                    onClick: () => loadPaperBreakdown(er.id),
                    "data-testid": `paper-toggle-${er.id}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4 text-blue-500" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: paperLabel }),
                        er.timestamp && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-400", children: new Date(er.timestamp).toLocaleDateString() })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-[140px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreBar, { score: er.score, maxScore: er.maxScore }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: er.grade }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              className: "text-neutral-400 hover:text-red-500 transition-colors p-1",
                              onClick: (e) => e.stopPropagation(),
                              "data-testid": `btn-delete-exam-${er.id}`,
                              title: "Remove this exam result",
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
                            }
                          ) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Remove Exam Result?" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
                                "This will permanently remove the ",
                                paperLabel,
                                " result (",
                                er.score,
                                "/",
                                er.maxScore,
                                ") from this student's record. This cannot be undone."
                              ] })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => handleDeleteExamResult(er.id), className: "bg-red-600 hover:bg-red-700", children: "Remove" })
                            ] })
                          ] })
                        ] }),
                        isPaperExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-4 w-4 text-neutral-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4 text-neutral-400" })
                      ] })
                    ]
                  }
                ),
                isPaperExpanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30", children: [
                  paperLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) }),
                  !paperLoading && editedBreakdown.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 p-4", children: "No detailed breakdown available." }),
                  !paperLoading && editedBreakdown.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-3", children: [
                    hasChanges && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
                          "Updated Total: ",
                          totalScore,
                          "/",
                          totalMax
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "ml-2", children: computedGrade })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSave, disabled: saving, size: "sm", className: "gap-1", "data-testid": "button-save-results", children: [
                        saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3 w-3" }),
                        "Save Changes"
                      ] })
                    ] }),
                    editedBreakdown.map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-neutral-200 dark:border-neutral-700", "data-testid": `result-question-${idx}`, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "py-2 px-4 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm font-medium", children: [
                          item.questionTitle,
                          " ",
                          item.subLabel ? `(${item.subLabel})` : ""
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              type: "number",
                              min: 0,
                              max: item.maxMarks,
                              value: item.score,
                              onChange: (e) => updateScore(idx, parseInt(e.target.value) || 0),
                              className: "w-16 h-7 text-center text-sm",
                              "data-testid": `result-score-${idx}`
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-neutral-500", children: [
                            "/ ",
                            item.maxMarks
                          ] })
                        ] })
                      ] }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-3 px-4 space-y-3", children: [
                        item.questionText && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-neutral-400 mb-1", children: "Question" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-700 dark:text-neutral-300", children: item.questionText })
                        ] }),
                        item.contentBlocks && item.contentBlocks.length > 0 && !item.questionText && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-neutral-400 mb-1", children: "Question" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-neutral-700 dark:text-neutral-300", children: item.contentBlocks.filter((b) => b.type === "text").map((b, bi) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: b.content }, bi)) })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-neutral-400 mb-1", children: "Student Answer" }),
                          isDiagramAnswer(item) ? /* @__PURE__ */ jsxRuntimeExports.jsx(DiagramAnswerViewer, { item }) : /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-sm bg-neutral-100 dark:bg-neutral-800 rounded p-2 whitespace-pre-wrap break-words font-mono max-h-40 overflow-y-auto", children: formatAnswer(item.userAnswer) || /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-400 italic", children: "No answer provided" }) })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-neutral-400", children: "Feedback" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              "button",
                              {
                                className: "text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1",
                                onClick: () => setEditingFeedbackIdx(editingFeedbackIdx === idx ? null : idx),
                                "data-testid": `result-edit-feedback-${idx}`,
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3" }),
                                  editingFeedbackIdx === idx ? "Done" : "Edit"
                                ]
                              }
                            )
                          ] }),
                          editingFeedbackIdx === idx ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Textarea,
                            {
                              value: item.feedback || "",
                              onChange: (e) => updateFeedback(idx, e.target.value),
                              className: "text-sm min-h-[80px]",
                              "data-testid": `result-feedback-textarea-${idx}`
                            }
                          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap", children: item.feedback || /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic text-neutral-400", children: "No feedback" }) })
                        ] }),
                        item.suggestions && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-blue-400 mb-1", children: "Suggestions" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-blue-600 dark:text-blue-400", children: item.suggestions })
                        ] })
                      ] })
                    ] }, idx)),
                    hasChanges && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky bottom-0 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 flex items-center justify-between shadow-lg", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
                          "Total: ",
                          totalScore,
                          "/",
                          totalMax
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "ml-2", children: computedGrade })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSave, disabled: saving, size: "sm", className: "gap-1", children: [
                        saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3 w-3" }),
                        "Save Changes"
                      ] })
                    ] })
                  ] })
                ] })
              ] }, er.id);
            }),
            studentDetail.assignments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2", children: "Assignments" }),
              studentDetail.assignments.map((a, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-3 mb-2", "data-testid": `assignment-card-${i}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: a.attempt.assignmentTitle }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: a.attempt.status === "completed" ? "default" : "secondary", children: a.attempt.status }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          className: "text-neutral-400 hover:text-red-500 transition-colors p-1",
                          "data-testid": `btn-delete-assignment-${a.attempt.id}`,
                          title: "Remove this assignment attempt",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" })
                        }
                      ) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Remove Assignment Attempt?" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
                            'This will permanently remove the "',
                            a.attempt.assignmentTitle,
                            `" attempt from this student's record. This cannot be undone.`
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => handleDeleteAssignmentAttempt(a.attempt.id), className: "bg-red-600 hover:bg-red-700", children: "Remove" })
                        ] })
                      ] })
                    ] })
                  ] })
                ] }),
                a.responses.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: a.responses.map((r, ri) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-neutral-500", children: [
                    "Q",
                    ri + 1
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: r.marksAwarded !== null && r.marksAwarded !== void 0 ? `${r.marksAwarded} marks` : "Not graded" }),
                  r.aiFeedback && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-400 truncate max-w-[250px]", title: r.aiFeedback, children: r.aiFeedback })
                ] }, r.id || ri)) })
              ] }, a.attempt.id || i))
            ] })
          ] })
        ] })
      ] }, student.id);
    }) })
  ] });
}
function PaperAnalyticsTab() {
  const [year, setYear] = reactExports.useState("");
  const [analytics, setAnalytics] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  const years = [2022, 2023, 2024, 2025];
  reactExports.useEffect(() => {
    if (!year) {
      setAnalytics(null);
      return;
    }
    setLoading(true);
    fetchWithAuth(`/api/teacher/analytics/exam/${year}`).then(setAnalytics).catch(console.error).finally(() => setLoading(false));
  }, [year]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: year, onValueChange: setYear, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-48", "data-testid": "select-exam-year", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select year..." }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: years.map((y) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: y.toString(), "data-testid": `select-year-${y}`, children: y }, y)) })
      ] }),
      analytics && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-neutral-500", "data-testid": "text-total-results", children: [
        analytics.totalResults,
        " total results"
      ] })
    ] }),
    loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-neutral-500" }) }),
    !loading && analytics && analytics.questions.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-12 text-neutral-500", "data-testid": "text-no-exam-data", children: "No exam data available for this year." }),
    !loading && analytics && analytics.questions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-testid": "table-exam-analytics", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Question" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Avg Score" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Max Score" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Attempts" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Difficulty" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: analytics.questions.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { "data-testid": `row-exam-question-${q.questionId}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: q.questionId }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreBar, { score: q.averageScore, maxScore: q.maxScore }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: q.maxScore }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: q.totalAttempts }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DifficultyBadge, { difficulty: q.difficulty }) })
      ] }, q.questionId)) })
    ] }) }) })
  ] });
}
function AssignmentAnalyticsTab() {
  const [assignments, setAssignments] = reactExports.useState([]);
  const [selectedId, setSelectedId] = reactExports.useState("");
  const [analytics, setAnalytics] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    fetch("/api/n5/assignments").then((r) => r.json()).then(setAssignments).catch(console.error);
  }, []);
  reactExports.useEffect(() => {
    if (!selectedId) {
      setAnalytics(null);
      return;
    }
    setLoading(true);
    fetchWithAuth(`/api/teacher/analytics/assignment/${selectedId}`).then(setAnalytics).catch(console.error).finally(() => setLoading(false));
  }, [selectedId]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedId, onValueChange: setSelectedId, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-80", "data-testid": "select-assignment", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select assignment..." }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: assignments.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: a.id, "data-testid": `select-assignment-${a.id}`, children: a.title }, a.id)) })
    ] }) }),
    loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-neutral-500" }) }),
    !loading && analytics && analytics.questions.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-12 text-neutral-500", "data-testid": "text-no-assignment-data", children: "No analytics data available for this assignment." }),
    !loading && analytics && analytics.questions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", "data-testid": "text-assignment-title", children: analytics.title }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-testid": "table-assignment-analytics", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Question" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Label" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Avg Score" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Max Score" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Attempts" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Difficulty" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: analytics.questions.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { "data-testid": `row-assignment-question-${q.questionId}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: q.questionId.slice(0, 8) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: q.label || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreBar, { score: q.averageScore, maxScore: q.maxScore }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: q.maxScore }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: q.totalAttempts }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DifficultyBadge, { difficulty: q.difficulty }) })
        ] }, q.questionId)) })
      ] }) })
    ] })
  ] });
}
function TeacherAnalytics() {
  const [, setLocation] = useLocation();
  reactExports.useEffect(() => {
    const token = localStorage.getItem("teacherToken") || localStorage.getItem("teacher_token");
    const expires = localStorage.getItem("teacherTokenExpires") || localStorage.getItem("teacher_token_expires");
    if (!token || !expires || parseInt(expires) < Date.now()) {
      localStorage.removeItem("teacherToken");
      localStorage.removeItem("teacherTokenExpires");
      localStorage.removeItem("teacher_token");
      localStorage.removeItem("teacher_token_expires");
      setLocation("/teacher/login");
    }
  }, [setLocation]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-[200]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto max-w-6xl flex justify-between items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: () => setLocation("/teacher/dashboard"), "data-testid": "button-back-dashboard", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }),
        " Dashboard"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-neutral-900 dark:text-white", "data-testid": "text-analytics-title", children: "Analytics" })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "container mx-auto max-w-6xl p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "class-overview", className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-4", "data-testid": "tabs-analytics", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "class-overview", className: "flex items-center gap-2", "data-testid": "tab-class-overview", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
          " Class Overview"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "student-results", className: "flex items-center gap-2", "data-testid": "tab-student-results", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "h-4 w-4" }),
          " Student Results"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "paper-analytics", className: "flex items-center gap-2", "data-testid": "tab-paper-analytics", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4" }),
          " Paper Analytics"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "assignment-analytics", className: "flex items-center gap-2", "data-testid": "tab-assignment-analytics", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-4 w-4" }),
          " Assignment Analytics"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "class-overview", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ClassOverviewTab, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "student-results", children: /* @__PURE__ */ jsxRuntimeExports.jsx(StudentResultsTab, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "paper-analytics", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaperAnalyticsTab, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "assignment-analytics", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AssignmentAnalyticsTab, {}) })
    ] }) })
  ] });
}
export {
  TeacherAnalytics as default
};
//# sourceMappingURL=TeacherAnalytics-BcB-sL-b.js.map
