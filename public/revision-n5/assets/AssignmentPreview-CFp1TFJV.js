import { t as useParams, u as useLocation, r as reactExports, j as jsxRuntimeExports, E as Eye } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle, c as CardDescription } from "./card-D7eXR4Y_.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-CwuHQhjb.js";
import { r as renderQuestionInput } from "./QuestionInput-KmSAPMhQ.js";
import { R as RichTextBlock } from "./RichTextBlock-B5hwZVHB.js";
import purify from "./purify.es-DdxQyCyd.js";
import { C as CircleAlert } from "./circle-alert-DWz_G-vq.js";
import { E as EyeOff } from "./eye-off-Ju-xnFEe.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { C as Clock } from "./clock-CBMrk16J.js";
import { C as ChevronDown } from "./chevron-down-C5HdvL5Z.js";
import { C as ChevronRight } from "./chevron-right-CVWIcf-n.js";
import { F as FileText } from "./file-text-7qIELcrq.js";
import { U as Upload } from "./upload-BqUh_JkD.js";
import "./index-C94DArSW.js";
import "./textarea-DVZKhD5j.js";
import "./input-BglVfhce.js";
import "./diagram-editor-YPWk6RIh.js";
import "./pencil-BpyvL5SV.js";
import "./trash-2-bLg5w6uM.js";
import "./circle-D4qz0ZWK.js";
import "./database-C7hi9e55.js";
import "./list-CSQ5KgpQ.js";
import "./check-tIL4sncn.js";
import "./file-pen-D6Iuyym7.js";
const SECTION_LABELS = {
  sdd: "Software Design and Development",
  cs: "Computer Systems",
  ddd: "Database Design and Development",
  wdd: "Web Design and Development"
};
function AssignmentPreview() {
  const { id: assignmentId } = useParams();
  const [, setLocation] = useLocation();
  const [assignment, setAssignment] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [expandedSections, setExpandedSections] = reactExports.useState(/* @__PURE__ */ new Set());
  const [expandedParts, setExpandedParts] = reactExports.useState(/* @__PURE__ */ new Set());
  const [showInputFields, setShowInputFields] = reactExports.useState(true);
  reactExports.useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);
  const fetchAssignment = async () => {
    if (!assignmentId) return;
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`);
      if (!response.ok) throw new Error("Failed to fetch assignment");
      const data = await response.json();
      setAssignment(data);
      if (data.sections) {
        setExpandedSections(new Set(data.sections.map((s) => s.id)));
        const allPartIds = data.sections.flatMap(
          (s) => s.parts?.map((p) => p.id) || []
        );
        setExpandedParts(new Set(allPartIds));
      }
    } catch (err) {
      setError("Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
    return `${mins} minutes`;
  };
  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };
  const togglePart = (partId) => {
    setExpandedParts((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) next.delete(partId);
      else next.add(partId);
      return next;
    });
  };
  const renderContentBlock = (block) => {
    switch (block.type) {
      case "heading":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-4 mb-2", children: block.content });
      case "text":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(RichTextBlock, { content: block.content });
      case "image":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("figure", { className: "my-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: block.content,
              alt: block.caption || "Assignment image",
              className: `rounded-lg ${block.imageSize === "small" ? "max-w-xs" : block.imageSize === "medium" ? "max-w-md" : block.imageSize === "large" ? "max-w-2xl" : "max-w-full"}`
            }
          ),
          block.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("figcaption", { className: "text-sm text-neutral-500 mt-2", children: block.caption })
        ] });
      case "code":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg overflow-x-auto my-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-sm font-mono", children: block.content }) });
      case "data-table":
        if (!block.dataTable) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-6 overflow-x-auto", children: [
          block.dataTable.title && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium mb-2", children: block.dataTable.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full border border-neutral-200 dark:border-neutral-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: (block.dataTable.headers || block.dataTable.columns)?.map((header, i) => {
              const headerText = typeof header === "string" ? header : header.header;
              return /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left text-sm font-medium border-b", children: headerText }, header.id || i);
            }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.dataTable.rows?.map((row, rowIndex) => {
              const cells = Array.isArray(row) ? row : row.cells || [];
              return /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: rowIndex % 2 === 0 ? "" : "bg-neutral-50 dark:bg-neutral-800/50", children: cells.map((cell, cellIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-sm border-b", children: cell }, cellIndex)) }, row.id || rowIndex);
            }) })
          ] })
        ] });
      case "pseudocode":
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
      case "row-layout":
        if (!block.children) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col md:flex-row gap-4 items-start my-4", children: block.children.map((child, childIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: renderContentBlock(child) }, child.id || childIdx)) });
      default:
        return null;
    }
  };
  const renderQuestionPreview = (question, partLabel) => {
    const subQuestion = {
      id: question.id,
      questionText: question.questionText,
      maxMarks: question.maxMarks,
      inputStyle: question.inputStyle,
      inputConfig: question.inputConfig,
      codeRequirement: question.codeRequirement,
      drawingBackgroundUrl: question.drawingBackgroundUrl,
      imageUrl: question.imageUrl,
      aiGuidance: question.aiGuidance
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-l-2 border-blue-500 pl-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm", children: question.label || question.questionNumber || `Q${partLabel}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded", children: [
          question.maxMarks,
          " mark",
          question.maxMarks !== 1 ? "s" : ""
        ] })
      ] }),
      question.questionText && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "rich-text-content mb-3",
          dangerouslySetInnerHTML: { __html: purify.sanitize(question.questionText) }
        }
      ),
      question.contentBlocks?.map((block) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: renderContentBlock(block) }, block.id)),
      showInputFields && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 opacity-60 pointer-events-none", children: renderQuestionInput(subQuestion, {}, () => {
      }, void 0, void 0, true) })
    ] }, question.id);
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-neutral-500", children: "Loading preview..." })
    ] }) });
  }
  if (error || !assignment) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-12 w-12 text-red-500 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-medium", "data-testid": "text-error-title", children: "Failed to load assignment" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-500 mt-2", "data-testid": "text-error-message", children: error || "Assignment not found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "mt-4", onClick: () => setLocation("/teacher/assignments"), "data-testid": "button-back-to-assignments", children: "Back to Assignments" })
    ] }) }) });
  }
  const compulsorySections = assignment.sections?.filter((s) => s.isCompulsory) || [];
  const optionalSections = assignment.sections?.filter((s) => !s.isCompulsory) || [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-5 w-5 text-amber-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-amber-800 dark:text-amber-200", children: "Preview Mode - This is how students will see the assignment" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => setShowInputFields(!showInputFields),
            className: "border-amber-300 dark:border-amber-700",
            "data-testid": "button-toggle-input-fields",
            children: [
              showInputFields ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4 mr-1" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4 mr-1" }),
              showInputFields ? "Hide" : "Show",
              " Input Fields"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => window.close(),
            className: "border-amber-300 dark:border-amber-700",
            "data-testid": "button-close-preview",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }),
              "Close Preview"
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 py-6 max-w-4xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-2xl", "data-testid": "text-assignment-title", children: [
            assignment.year,
            " - Assignment"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "mt-2", "data-testid": "text-assignment-year", children: [
            assignment.year,
            " Assignment"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-neutral-600 dark:text-neutral-400", "data-testid": "text-assignment-time", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTime(assignment.totalTimeMinutes) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-neutral-500 mt-1", "data-testid": "text-assignment-marks", children: [
            assignment.totalMarks,
            " marks total"
          ] })
        ] })
      ] }) }) }),
      compulsorySections.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold mb-4", children: "Compulsory Sections" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: compulsorySections.sort((a, b) => a.orderIndex - b.orderIndex).map((section) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Collapsible,
          {
            open: expandedSections.has(section.id),
            onOpenChange: () => toggleSection(section.id),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50", "data-testid": `trigger-section-${section.id}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  expandedSections.has(section.id) ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: SECTION_LABELS[section.sectionType] || section.title })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-neutral-500", children: [
                  section.parts?.reduce((sum, p) => sum + p.maxMarks, 0) || 0,
                  " marks"
                ] })
              ] }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-0 border-t", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
                section.informationSheet && section.informationSheet.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-purple-700 dark:text-purple-400 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4" }),
                  "Information Sheet (",
                  section.informationSheet.length,
                  " block",
                  section.informationSheet.length !== 1 ? "s" : "",
                  ") - visible to students across all parts"
                ] }) }),
                section.parts?.sort((a, b) => a.orderIndex - b.orderIndex).map((part) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Collapsible,
                  {
                    open: expandedParts.has(part.id),
                    onOpenChange: () => togglePart(part.id),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 flex items-center justify-between", "data-testid": `trigger-part-${part.id}`, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                          expandedParts.has(part.id) ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
                            "Part ",
                            part.partLabel
                          ] }),
                          part.title && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-neutral-500", children: [
                            "- ",
                            part.title
                          ] }),
                          part.requiresUpload && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3 w-3" }),
                            "Upload Required"
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-neutral-500", children: [
                          part.maxMarks,
                          " marks"
                        ] })
                      ] }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-4 pt-6 border-t", children: [
                        part.instructions && /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            className: "rich-text-content mb-4",
                            dangerouslySetInnerHTML: { __html: purify.sanitize(part.instructions.replace(/\n/g, "<br />")) }
                          }
                        ),
                        part.contentBlocks?.map((block) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: renderContentBlock(block) }, block.id)),
                        part.subQuestions && part.subQuestions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 space-y-4", children: part.subQuestions.map(
                          (q) => renderQuestionPreview(q, part.partLabel)
                        ) })
                      ] }) })
                    ] })
                  },
                  part.id
                ))
              ] }) }) })
            ]
          }
        ) }, section.id)) })
      ] }),
      optionalSections.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-semibold mb-4", children: [
          "Optional Sections",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-normal text-neutral-500 ml-2", children: "(Students choose one)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: optionalSections.sort((a, b) => a.orderIndex - b.orderIndex).map((section) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Collapsible,
          {
            open: expandedSections.has(section.id),
            onOpenChange: () => toggleSection(section.id),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50", "data-testid": `trigger-section-${section.id}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  expandedSections.has(section.id) ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: SECTION_LABELS[section.sectionType] || section.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded", children: "Optional" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-neutral-500", children: [
                  section.parts?.reduce((sum, p) => sum + p.maxMarks, 0) || 0,
                  " marks"
                ] })
              ] }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-0 border-t", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
                section.informationSheet && section.informationSheet.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-purple-700 dark:text-purple-400 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4" }),
                  "Information Sheet (",
                  section.informationSheet.length,
                  " block",
                  section.informationSheet.length !== 1 ? "s" : "",
                  ") - visible to students across all parts"
                ] }) }),
                section.parts?.sort((a, b) => a.orderIndex - b.orderIndex).map((part) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Collapsible,
                  {
                    open: expandedParts.has(part.id),
                    onOpenChange: () => togglePart(part.id),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 flex items-center justify-between", "data-testid": `trigger-part-${part.id}`, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                          expandedParts.has(part.id) ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
                            "Part ",
                            part.partLabel
                          ] }),
                          part.title && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-neutral-500", children: [
                            "- ",
                            part.title
                          ] }),
                          part.requiresUpload && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3 w-3" }),
                            "Upload Required"
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-neutral-500", children: [
                          part.maxMarks,
                          " marks"
                        ] })
                      ] }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-4 pt-6 border-t", children: [
                        part.instructions && /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            className: "rich-text-content mb-4",
                            dangerouslySetInnerHTML: { __html: purify.sanitize(part.instructions.replace(/\n/g, "<br />")) }
                          }
                        ),
                        part.contentBlocks?.map((block) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: renderContentBlock(block) }, block.id)),
                        part.subQuestions && part.subQuestions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 space-y-4", children: part.subQuestions.map(
                          (q) => renderQuestionPreview(q, part.partLabel)
                        ) })
                      ] }) })
                    ] })
                  },
                  part.id
                ))
              ] }) }) })
            ]
          }
        ) }, section.id)) })
      ] })
    ] })
  ] });
}
export {
  AssignmentPreview as default
};
//# sourceMappingURL=AssignmentPreview-CFp1TFJV.js.map
