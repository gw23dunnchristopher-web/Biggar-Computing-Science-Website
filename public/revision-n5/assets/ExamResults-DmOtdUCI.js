import { u as useLocation, r as reactExports, j as jsxRuntimeExports } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { C as Card, d as CardContent } from "./card-D7eXR4Y_.js";
import { P as Progress, g as generateResultsPDF } from "./generate-results-pdf-ByiaaCop.js";
import { I as Input } from "./input-BglVfhce.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-CwuHQhjb.js";
import { c as confetti } from "./confetti.module-CcsmJSab.js";
import { M as ModeToggle } from "./mode-toggle-Bf7eeVrX.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { D as Download } from "./download-DGRZihqj.js";
import { C as CircleCheckBig } from "./circle-check-big-B9xfjmGM.js";
import { C as CircleAlert } from "./circle-alert-DWz_G-vq.js";
import { C as CircleX } from "./circle-x-DWAGdAys.js";
import { C as ChevronUp } from "./chevron-up-BGYeYs9P.js";
import { C as ChevronDown } from "./chevron-down-C5HdvL5Z.js";
import "./index-C94DArSW.js";
import "./dropdown-menu-DZfpUsGF.js";
import "./index-D-MpoJPS.js";
import "./Combination-DqZOzdwe.js";
import "./index-Ck6_BvxI.js";
import "./chevron-right-CVWIcf-n.js";
import "./check-tIL4sncn.js";
import "./circle-D4qz0ZWK.js";
function ExamResults() {
  const [, setLocation] = useLocation();
  const [result, setResult] = reactExports.useState(null);
  const [expandedItems, setExpandedItems] = reactExports.useState(/* @__PURE__ */ new Set());
  const [studentName, setStudentName] = reactExports.useState("");
  reactExports.useEffect(() => {
    const saved = localStorage.getItem("last_exam_result");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed || !Array.isArray(parsed.breakdown)) {
          throw new Error("Invalid result data");
        }
        setResult(parsed);
      } catch {
        localStorage.removeItem("last_exam_result");
        setLocation("/");
        return;
      }
      setTimeout(() => {
        if (!document.documentElement.classList.contains("reduced-motion")) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#dc2626", "#000000", "#ffffff"]
          });
        }
      }, 500);
    } else {
      setLocation("/");
    }
  }, [setLocation]);
  const toggleItem = (index) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };
  const formatUserAnswer = (userAnswer) => {
    if (!userAnswer) return "No answer provided";
    if (typeof userAnswer === "string") {
      if (userAnswer.startsWith("data:image/") || userAnswer.startsWith("[{") || userAnswer.startsWith("{")) {
        return "[Diagram submitted]";
      }
      return userAnswer;
    }
    if (typeof userAnswer === "object") {
      const entries = Object.entries(userAnswer).filter(([_, v]) => v);
      if (entries.length === 0) return "No answer provided";
      const diagramKeys = ["drawing", "drawing_canvas", "erd_diagram", "erd_drawing"];
      const hasDiagram = entries.some(([key]) => diagramKeys.includes(key));
      if (hasDiagram) return "[Diagram submitted]";
      return entries.map(([key, value]) => {
        if (key.includes("canvas") || key.includes("drawing")) return null;
        if (key === "design_mode") return `Mode: ${value}`;
        const strValue = String(value);
        if (strValue.length > 500) return "[Complex data submitted]";
        return `${strValue}`;
      }).filter(Boolean).join("\n");
    }
    return String(userAnswer);
  };
  const generatePDF = () => {
    if (!result) return;
    const name = studentName.trim() || "Student";
    generateResultsPDF({
      title: result.examTitle || `${result.year} Exam`,
      studentName: name,
      date: new Date(result.timestamp).toLocaleDateString(),
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      breakdown: result.breakdown.map((item, idx) => {
        const qText = item.contentBlocks && item.contentBlocks.length > 0 ? item.contentBlocks.filter((b) => b.type === "text" || b.type === "code").map((b) => b.content || "").join("\n") : item.questionText || "";
        return {
          label: `${item.questionTitle}${item.subLabel ? ` - ${item.subLabel}` : ""}`,
          questionText: qText || void 0,
          maxMarks: item.maxMarks,
          score: item.score,
          userAnswer: formatUserAnswer(item.userAnswer),
          feedback: item.feedback || void 0,
          suggestions: item.suggestions || void 0
        };
      })
    });
  };
  if (!result) return null;
  const percentage = Math.round(result.totalScore / result.maxScore * 100);
  let grade = "No Award";
  let color = "text-neutral-500";
  if (percentage >= 70) {
    grade = "A";
    color = "text-green-600";
  } else if (percentage >= 60) {
    grade = "B";
    color = "text-blue-600";
  } else if (percentage >= 50) {
    grade = "C";
    color = "text-yellow-600";
  } else if (percentage >= 40) {
    grade = "D";
    color = "text-orange-600";
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 md:p-12 font-sans", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", onClick: () => setLocation("/"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
        " Back to Home"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ModeToggle, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-2 mb-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold text-neutral-900 dark:text-white", children: result.examTitle ? `${result.examTitle} Results` : `${result.year} Exam Results` }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-neutral-500", children: [
        "Completed on ",
        new Date(result.timestamp).toLocaleDateString()
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden border-t-4 border-t-red-500 shadow-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center md:text-left space-y-4 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-medium text-neutral-500 uppercase tracking-wide", children: "Final Grade" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-8xl font-black ${color}`, children: grade }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-medium text-neutral-600 dark:text-neutral-300", children: [
          "You achieved ",
          percentage,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 w-full max-w-xs space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm font-medium", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Total Score" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            result.totalScore,
            " / ",
            result.maxScore
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: percentage, className: "h-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm text-neutral-500 mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-3 h-3 rounded-full bg-green-500" }),
            " A: 70%+"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-3 h-3 rounded-full bg-blue-500" }),
            " B: 60-69%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-3 h-3 rounded-full bg-yellow-500" }),
            " C: 50-59%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-3 h-3 rounded-full bg-orange-500" }),
            " D: 40-49%"
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-neutral-900 dark:text-white mb-3", children: "Download Results as PDF" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-3 items-end", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 w-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1 block", children: "Your Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: studentName,
              onChange: (e) => setStudentName(e.target.value),
              placeholder: "Enter your name for the report...",
              "data-testid": "input-student-name"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: generatePDF, className: "gap-2", "data-testid": "button-download-pdf", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4" }),
          " Download PDF"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-bold text-neutral-900 dark:text-white", children: "Detailed Breakdown" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-500 text-sm", children: "Click on a question to see the full details and your answer" }),
      result.breakdown.map((item, index) => {
        const isExpanded = expandedItems.has(index);
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Collapsible, { open: isExpanded, onOpenChange: () => toggleItem(index), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `border-l-4 ${item.score === item.maxMarks ? "border-l-green-500" : item.score > 0 ? "border-l-yellow-500" : "border-l-red-500"} transition-all hover:shadow-md`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleTrigger, { className: "w-full text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-bold text-lg", children: [
                item.questionTitle,
                item.subLabel ? ` - Part ${item.subLabel}` : ""
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
                item.score === item.maxMarks ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center text-green-600 text-sm font-medium", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-4 h-4 mr-1" }),
                  " Full Marks"
                ] }) : item.score > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center text-yellow-600 text-sm font-medium", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-4 h-4 mr-1" }),
                  " Partial Marks"
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center text-red-600 text-sm font-medium", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "w-4 h-4 mr-1" }),
                  " No Marks"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-400 text-sm", children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-neutral-600 dark:text-neutral-400 text-sm", children: [
                  item.score,
                  " / ",
                  item.maxMarks,
                  " marks"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-neutral-400", children: isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "w-5 h-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-5 h-5" }) })
          ] }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "px-6 pb-6 pt-0 border-t border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 pt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: "font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2", children: "Question" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-neutral-600 dark:text-neutral-400 space-y-2", children: [
                item.contentBlocks && item.contentBlocks.length > 0 ? item.contentBlocks.map((block) => {
                  if (block.type === "text") {
                    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap", children: block.content }, block.id);
                  } else if (block.type === "image") {
                    return /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: block.content, alt: "Question", className: "max-w-full max-h-48 rounded-lg" }, block.id);
                  } else if (block.type === "code") {
                    return /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-800 text-neutral-100 p-3 rounded-lg overflow-x-auto text-xs font-mono", children: block.content }, block.id);
                  } else if (block.type === "row-layout" && block.children) {
                    const getCellValue = (cell) => {
                      if (typeof cell === "string") return cell;
                      return cell?.value || "";
                    };
                    const renderChild = (child) => {
                      if (child.type === "text") return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap", children: child.content });
                      if (child.type === "image") return /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: child.content, alt: "", className: "max-w-full max-h-48 rounded-lg" });
                      if (child.type === "code") return /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-800 text-neutral-100 p-3 rounded-lg overflow-x-auto text-xs font-mono", children: child.content });
                      if (child.type === "data-table" && child.dataTable) {
                        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded overflow-hidden text-xs", children: [
                          child.dataTable.tableName && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-2 py-1 font-semibold font-mono", children: child.dataTable.tableName }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: child.dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-2 py-1 text-left font-semibold border-r last:border-r-0", children: col.header }, col.id)) }) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: child.dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t", children: row.cells.map((cell, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-2 py-1 border-r last:border-r-0", children: getCellValue(cell) }, idx)) }, row.id)) })
                          ] })
                        ] });
                      }
                      if (child.type === "code-table" && child.codeSections) {
                        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded overflow-hidden text-xs", children: child.codeSections.map((section) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-2 py-1 font-semibold", children: section.label }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-900 text-neutral-100 p-2 font-mono", children: section.code })
                        ] }, section.id)) });
                      }
                      if (child.type === "row-layout" && child.children) {
                        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-2", children: child.children.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: renderChild(c) }, c.id)) });
                      }
                      return null;
                    };
                    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col md:flex-row gap-4", children: block.children.map((child) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: renderChild(child) }, child.id)) }, block.id);
                  }
                  return null;
                }) : item.questionText ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap", children: item.questionText }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "italic text-neutral-400", children: "Question text not available" }),
                item.codeSnippet && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-800 text-neutral-100 p-3 rounded-lg overflow-x-auto text-xs font-mono mt-2", children: item.codeSnippet })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: "font-semibold text-sm text-amber-700 dark:text-amber-300 mb-2", children: "Your Answer" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-amber-600 dark:text-amber-400 whitespace-pre-wrap", children: formatUserAnswer(item.userAnswer) })
            ] }),
            item.feedback && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: "font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2", children: "Feedback" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-neutral-600 dark:text-neutral-400 space-y-1", children: (typeof item.feedback === "string" ? item.feedback : Array.isArray(item.feedback) ? item.feedback.join("\n") : String(item.feedback)).split(/\n/).map((line, i) => {
                const bulletMatch = line.match(/^(\s*[-•*]\s*)(.*)/);
                if (bulletMatch) {
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 ml-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: bulletMatch[2] })
                  ] }, i);
                }
                const numMatch = line.match(/^(\s*\d+[.)]\s*)(.*)/);
                if (numMatch) {
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 ml-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: numMatch[1].trim() }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: numMatch[2] })
                  ] }, i);
                }
                return line.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: line }, i) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1" }, i);
              }) })
            ] }),
            item.suggestions && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: "font-semibold text-sm text-blue-700 dark:text-blue-300 mb-2", children: "How to Improve" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-blue-600 dark:text-blue-400 space-y-1", children: (typeof item.suggestions === "string" ? item.suggestions : Array.isArray(item.suggestions) ? item.suggestions.join("\n") : String(item.suggestions)).split(/\n/).map((line, i) => {
                const bulletMatch = line.match(/^(\s*[-•*]\s*)(.*)/);
                if (bulletMatch) {
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 ml-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: bulletMatch[2] })
                  ] }, i);
                }
                const numMatch = line.match(/^(\s*\d+[.)]\s*)(.*)/);
                if (numMatch) {
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 ml-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: numMatch[1].trim() }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: numMatch[2] })
                  ] }, i);
                }
                return line.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: line }, i) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1" }, i);
              }) })
            ] })
          ] }) }) })
        ] }) }, index);
      })
    ] })
  ] }) });
}
export {
  ExamResults as default
};
//# sourceMappingURL=ExamResults-DmOtdUCI.js.map
