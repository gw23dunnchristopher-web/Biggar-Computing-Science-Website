import { c as createLucideIcon, d as useRoute, e as useQuestions, r as reactExports, f as compareQuestionsByNumber, T as TOPICS, j as jsxRuntimeExports, L as Link, g as cn } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { T as Textarea } from "./textarea-DVZKhD5j.js";
import { I as Input } from "./input-BglVfhce.js";
import { D as DiagramImageInput, a as DIAGRAM_HINTS } from "./diagram-image-input-BvTCIJFA.js";
import { D as DatabaseSchemaDisplay, g as gradeTagMatching, T as TagMatchingEditor } from "./database-schema-editor-BRVA4I4S.js";
import { R as RowLayout, a as RowLayoutItem } from "./row-layout-Cx0Djyld.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-CwuHQhjb.js";
import { c as confetti } from "./confetti.module-CcsmJSab.js";
import { M as ModeToggle } from "./mode-toggle-Bf7eeVrX.js";
import { A as ArrowLeft } from "./arrow-left-Cvn2b4La.js";
import { C as ChevronDown } from "./chevron-down-C5HdvL5Z.js";
import { m as motion } from "./proxy-B_4tW7TK.js";
import { C as CircleCheck } from "./circle-check-CfjmjGXe.js";
import { C as CircleX } from "./circle-x-DWAGdAys.js";
import { L as List } from "./list-CSQ5KgpQ.js";
import { C as CodeXml, F as FilePen } from "./file-pen-D6Iuyym7.js";
import { C as ChevronRight } from "./chevron-right-CVWIcf-n.js";
import "./download-DGRZihqj.js";
import "./upload-BqUh_JkD.js";
import "./label-DXOWQ5Is.js";
import "./plus-Bl_GJopp.js";
import "./trash-2-bLg5w6uM.js";
import "./key-DEEIcqry.js";
import "./index-C94DArSW.js";
import "./dropdown-menu-DZfpUsGF.js";
import "./index-D-MpoJPS.js";
import "./Combination-DqZOzdwe.js";
import "./index-Ck6_BvxI.js";
import "./check-tIL4sncn.js";
import "./circle-D4qz0ZWK.js";
const __iconNode$1 = [
  ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
  ["path", { d: "M8 16H3v5", key: "1cv678" }]
];
const RefreshCw = createLucideIcon("refresh-cw", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72",
      key: "ul74o6"
    }
  ],
  ["path", { d: "m14 7 3 3", key: "1r5n42" }],
  ["path", { d: "M5 6v4", key: "ilb8ba" }],
  ["path", { d: "M19 14v4", key: "blhpug" }],
  ["path", { d: "M10 2v2", key: "7u0qdc" }],
  ["path", { d: "M7 8H3", key: "zfb6yr" }],
  ["path", { d: "M21 16h-4", key: "1cnmox" }],
  ["path", { d: "M11 3H9", key: "1obp7u" }]
];
const WandSparkles = createLucideIcon("wand-sparkles", __iconNode);
const getCellValue = (cell) => {
  return typeof cell === "string" ? cell : cell.value;
};
const getCellRole = (cell) => {
  return typeof cell === "string" ? "data" : cell.role || "data";
};
const getCellColSpan = (cell) => {
  return typeof cell === "string" ? 1 : cell.colSpan || 1;
};
const getCellRowSpan = (cell) => {
  return typeof cell === "string" ? 1 : cell.rowSpan || 1;
};
const isCellHidden = (cell) => {
  return typeof cell === "string" ? false : cell.hidden || false;
};
function getQuestionPreviewText(q) {
  const scenarioText = q.scenario?.contentBlocks?.find((b) => b.type === "text")?.content || q.scenario?.text;
  if (scenarioText) return scenarioText.substring(0, 80) + "...";
  const firstSubQ = q.subQuestions[0];
  if (firstSubQ) {
    const subQText = firstSubQ.contentBlocks?.find((b) => b.type === "text")?.content || firstSubQ.questionText;
    if (subQText) return subQText.substring(0, 80) + "...";
  }
  return "No scenario text";
}
function formatInlineText(text) {
  const parts = [];
  let key = 0;
  const combinedRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\^([^^]+?)\^)/g;
  let lastIndex = 0;
  let match;
  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const fullMatch = match[0];
    if (fullMatch.startsWith("**") && fullMatch.endsWith("**")) {
      parts.push(/* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: fullMatch.slice(2, -2) }, key++));
    } else if (fullMatch.startsWith("`") && fullMatch.endsWith("`")) {
      parts.push(/* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono text-sm", children: fullMatch.slice(1, -1) }, key++));
    } else if (fullMatch.startsWith("^") && fullMatch.endsWith("^")) {
      parts.push(/* @__PURE__ */ jsxRuntimeExports.jsx("sup", { children: fullMatch.slice(1, -1) }, key++));
    } else if (fullMatch.startsWith("*") && fullMatch.endsWith("*")) {
      parts.push(/* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: fullMatch.slice(1, -1) }, key++));
    }
    lastIndex = match.index + fullMatch.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
}
function extractAlignment(line) {
  if (line.startsWith("[center]")) {
    return { content: line.slice(8), align: "center" };
  } else if (line.startsWith("[right]")) {
    return { content: line.slice(7), align: "right" };
  } else if (line.startsWith("[left]")) {
    return { content: line.slice(6), align: "left" };
  }
  return { content: line, align: "left" };
}
function formatText(text) {
  let keyCounter = 0;
  const lines = text.split("\n");
  const elements = [];
  let currentBulletItems = [];
  let currentParagraphLines = [];
  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      let currentAlign = currentParagraphLines[0].align;
      let currentGroup = [];
      for (const line of currentParagraphLines) {
        if (line.align === currentAlign) {
          currentGroup.push(line.content);
        } else {
          if (currentGroup.length > 0) {
            const alignClass = currentAlign === "center" ? "text-center" : currentAlign === "right" ? "text-right" : "";
            elements.push(
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mb-5 ${alignClass}`, children: formatInlineText(currentGroup.join("\n")) }, keyCounter++)
            );
          }
          currentAlign = line.align;
          currentGroup = [line.content];
        }
      }
      if (currentGroup.length > 0) {
        const alignClass = currentAlign === "center" ? "text-center" : currentAlign === "right" ? "text-right" : "";
        elements.push(
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mb-5 ${alignClass}`, children: formatInlineText(currentGroup.join("\n")) }, keyCounter++)
        );
      }
      currentParagraphLines = [];
    }
  };
  const renderNestedList = (items) => {
    if (items.length === 0) return null;
    const result = [];
    let i = 0;
    while (i < items.length) {
      const item = items[i];
      const currentLevel = item.level;
      const nestedItems = [];
      let j = i + 1;
      while (j < items.length && items[j].level > currentLevel) {
        nestedItems.push(items[j]);
        j++;
      }
      result.push(
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "pl-1", children: [
          formatInlineText(item.content),
          nestedItems.length > 0 && renderNestedList(nestedItems)
        ] }, i)
      );
      i = j;
    }
    const isNumbered = items[0].isNumbered;
    const ListTag = isNumbered ? "ol" : "ul";
    const listStyle = items[0].level === 0 ? `mb-4 ml-5 space-y-1 ${isNumbered ? "list-decimal" : "list-disc"}` : `mt-1 ml-5 space-y-1 ${isNumbered ? "list-decimal" : "list-disc"}`;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ListTag, { className: listStyle, children: result }, keyCounter++);
  };
  const flushBulletList = () => {
    if (currentBulletItems.length > 0) {
      elements.push(renderNestedList(currentBulletItems));
      currentBulletItems = [];
    }
  };
  for (const line of lines) {
    const trimmedLine = line.trim();
    const leadingSpaces = line.match(/^(\s*)/)?.[1] || "";
    const level = Math.floor(leadingSpaces.replace(/\t/g, "  ").length / 2);
    const bulletMatch = trimmedLine.match(/^[-•]\s+(.+)$/);
    const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      currentBulletItems.push({ content: bulletMatch[1], isNumbered: false, level });
    } else if (numberedMatch) {
      flushParagraph();
      currentBulletItems.push({ content: numberedMatch[2], isNumbered: true, level });
    } else if (trimmedLine === "") {
      flushBulletList();
      flushParagraph();
    } else {
      flushBulletList();
      const { content, align } = extractAlignment(line);
      currentParagraphLines.push({ content, align });
    }
  }
  flushBulletList();
  flushParagraph();
  if (elements.length === 1) {
    return elements[0];
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: elements });
}
function hasScenarioContent(scenario) {
  if (!scenario) return false;
  if (scenario.contentBlocks && scenario.contentBlocks.length > 0) {
    return scenario.contentBlocks.some((block) => block.content && block.content.trim());
  }
  return !!(scenario.text && scenario.text.trim() || scenario.imageUrl || scenario.codeSnippet || scenario.preCodeText || scenario.postImageText);
}
function Revision() {
  const [match, params] = useRoute("/revise/:topic");
  const topicId = params?.topic;
  const { questions } = useQuestions();
  const [allQuestions, setAllQuestions] = reactExports.useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = reactExports.useState(null);
  const [userInputs, setUserInputs] = reactExports.useState({});
  const [subQuestionResults, setSubQuestionResults] = reactExports.useState({});
  const [showResults, setShowResults] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (topicId) {
      const topicQuestions = questions.filter((q) => q.topic === topicId).sort(compareQuestionsByNumber);
      setAllQuestions(topicQuestions);
    }
  }, [topicId, questions]);
  const currentQuestion = allQuestions.find((q) => q.id === selectedQuestionId);
  const topicDetails = TOPICS.find((t) => t.id === topicId);
  const handleInputChange = (subId, key, value) => {
    setUserInputs((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId] || {},
        [key]: value
      }
    }));
  };
  const calculateMarks = (inputs, subQ) => {
    if (subQ.maxMarks === 0) return 0;
    let combinedAnswer = Object.values(inputs).join("\n").trim().toLowerCase();
    if (subQ.inputStyle === "design-choice") {
      const mode = inputs["design_mode"] || "pseudocode";
      if (mode === "pseudocode") {
        combinedAnswer = (inputs["main"] || "").toLowerCase();
      } else if (mode === "diagram" && inputs["drawing"]) {
        try {
          const items = JSON.parse(inputs["drawing"]);
          const textContents = items.filter((i) => (i.type === "text" || i.type === "box" || i.type === "ellipse" || i.type === "diamond" || i.type === "parallelogram") && i.content).sort((a, b) => {
            if (Math.abs(a.y - b.y) > 40) {
              return a.y - b.y;
            }
            return a.x - b.x;
          }).map((i) => i.content?.toLowerCase() || "");
          combinedAnswer = textContents.join(" ");
        } catch (e) {
          console.error("Failed to parse diagram data", e);
          combinedAnswer = "";
        }
      }
    } else if (subQ.inputStyle === "drawing" && inputs["drawing"]) {
      try {
        const items = JSON.parse(inputs["drawing"]);
        const textContents = items.filter((i) => (i.type === "text" || i.type === "box" || i.type === "ellipse" || i.type === "diamond" || i.type === "parallelogram") && i.content).sort((a, b) => {
          if (Math.abs(a.y - b.y) > 40) {
            return a.y - b.y;
          }
          return a.x - b.x;
        }).map((i) => i.content?.toLowerCase() || "");
        combinedAnswer = textContents.join(" ");
      } catch (e) {
        console.error("Failed to parse diagram data", e);
      }
    } else if (subQ.inputStyle === "erd-annotation") {
      const config = subQ.inputConfig;
      let totalRequirements = 0;
      let correctCount = 0;
      let studentItems = [];
      if (inputs["erd_diagram"]) {
        try {
          studentItems = JSON.parse(inputs["erd_diagram"]);
        } catch (e) {
          console.error("Failed to parse student ERD diagram", e);
        }
      }
      if (config?.erdAttributes) {
        for (const attr of config.erdAttributes) {
          totalRequirements++;
          const studentItem = studentItems.find((item) => item.id === attr.id);
          const studentMarking = studentItem?.marking || "none";
          if (studentMarking === attr.correctMarking) {
            correctCount++;
          }
        }
      }
      const erdEntities = studentItems.filter((item) => item.type === "erd-entity");
      for (const entity of erdEntities) {
        if (entity.attributes) {
          for (const attr of entity.attributes) {
            if (attr.marking === "primary" || attr.marking === "foreign") ;
          }
        }
      }
      if (config?.erdRequiredAttributes) {
        for (const reqAttr of config.erdRequiredAttributes) {
          totalRequirements++;
          const foundLegacy = studentItems.some(
            (item) => (item.type === "ellipse" || item.type === "text") && !item.isBaseItem && item.content?.toLowerCase().includes(reqAttr.attributeName.toLowerCase())
          );
          const foundInEntity = erdEntities.some(
            (entity) => entity.attributes?.some(
              (attr) => attr.name?.toLowerCase().includes(reqAttr.attributeName.toLowerCase())
            )
          );
          if (foundLegacy || foundInEntity) {
            correctCount++;
          }
        }
      }
      if (config?.erdRequiredLines) {
        for (const reqLine of config.erdRequiredLines) {
          totalRequirements++;
          const entity1 = studentItems.find(
            (item) => (item.type === "box" || item.type === "cylinder") && item.content?.toLowerCase().includes(reqLine.entity1.toLowerCase()) || item.type === "erd-entity" && item.entityName?.toLowerCase().includes(reqLine.entity1.toLowerCase())
          );
          const entity2 = studentItems.find(
            (item) => (item.type === "box" || item.type === "cylinder") && item.content?.toLowerCase().includes(reqLine.entity2.toLowerCase()) || item.type === "erd-entity" && item.entityName?.toLowerCase().includes(reqLine.entity2.toLowerCase())
          );
          if (entity1 && entity2) {
            const hasLine = studentItems.some(
              (item) => item.type === "line" && (item.connectedTo1 === entity1.id && item.connectedTo2 === entity2.id || item.connectedTo1 === entity2.id && item.connectedTo2 === entity1.id)
            );
            if (hasLine) {
              correctCount++;
            }
          }
        }
      }
      if (config?.erdRequiredCrowfootLines) {
        for (const reqCrowfoot of config.erdRequiredCrowfootLines) {
          totalRequirements++;
          const entity1 = studentItems.find(
            (item) => (item.type === "box" || item.type === "cylinder") && item.content?.toLowerCase().includes(reqCrowfoot.entity1.toLowerCase()) || item.type === "erd-entity" && item.entityName?.toLowerCase().includes(reqCrowfoot.entity1.toLowerCase())
          );
          const entity2 = studentItems.find(
            (item) => (item.type === "box" || item.type === "cylinder") && item.content?.toLowerCase().includes(reqCrowfoot.entity2.toLowerCase()) || item.type === "erd-entity" && item.entityName?.toLowerCase().includes(reqCrowfoot.entity2.toLowerCase())
          );
          if (entity1 && entity2) {
            const hasCrowfoot = studentItems.some(
              (item) => item.type === "crowfoot" && (item.connectedTo1 === entity1.id && item.connectedTo2 === entity2.id || item.connectedTo1 === entity2.id && item.connectedTo2 === entity1.id)
            );
            if (hasCrowfoot) {
              correctCount++;
            }
          }
        }
      }
      if (totalRequirements === 0) return 0;
      return Math.round(correctCount / totalRequirements * subQ.maxMarks);
    }
    let marks = 0;
    if (subQ.acceptedAnswers) {
      for (const accepted of subQ.acceptedAnswers) {
        if (combinedAnswer === accepted.toLowerCase()) {
          return subQ.maxMarks;
        }
        if (new RegExp(`\\b${accepted.toLowerCase()}\\b`).test(combinedAnswer)) {
          return subQ.maxMarks;
        }
      }
    }
    if (subQ.keywords) {
      let keywordsFound = 0;
      const usedKeywords = /* @__PURE__ */ new Set();
      for (const keyword of subQ.keywords) {
        if (combinedAnswer.includes(keyword.toLowerCase()) && !usedKeywords.has(keyword.toLowerCase())) {
          keywordsFound++;
          usedKeywords.add(keyword.toLowerCase());
        }
      }
      marks = Math.min(keywordsFound, subQ.maxMarks);
    }
    return marks;
  };
  const [isGrading, setIsGrading] = reactExports.useState(false);
  const [aiFeedback, setAiFeedback] = reactExports.useState({});
  const handleAutoMark = async () => {
    if (!currentQuestion) return;
    setIsGrading(true);
    const newResults = {};
    const newFeedback = {};
    let totalMarksEarned = 0;
    let totalMaxMarks = 0;
    try {
      const prepareStudentAnswer = (sub, inputs) => {
        if (sub.inputStyle === "design-choice") {
          const mode = inputs["design_mode"] || "pseudocode";
          if (mode === "pseudocode") {
            return inputs["main"] || "";
          } else if (mode === "diagram" && inputs["diagram_image"]) {
            return "Student submitted a diagram image (see attached image for visual grading).";
          } else if (mode === "diagram" && inputs["drawing"]) {
            try {
              const items = JSON.parse(inputs["drawing"]);
              const shapeDescriptions = items.filter((i) => i.type !== "line").sort((a, b) => {
                if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
                return a.x - b.x;
              }).map((i) => {
                const shapeType = i.type === "diamond" ? "DECISION" : i.type === "ellipse" ? "START_END" : i.type === "parallelogram" ? "INPUT_OUTPUT" : i.type === "box" ? "PROCESS" : i.type === "text" || i.type === "bullet-text" || i.type === "link-text" ? "LABEL" : i.type.toUpperCase();
                const formatting = [];
                if (i.isBold) formatting.push("bold");
                if (i.isUnderline || i.type === "link-text") formatting.push("underlined");
                if (i.hasBullet || i.type === "bullet-text") formatting.push("bullet");
                if (i.textAlign && i.textAlign !== "left") formatting.push(`aligned-${i.textAlign}`);
                const formatStr = formatting.length > 0 ? ` (${formatting.join(", ")})` : "";
                return `[${shapeType}: ${i.content || "empty"}${formatStr}]`;
              });
              return shapeDescriptions.join(" ");
            } catch (e) {
              return "";
            }
          }
        } else if (sub.inputStyle === "drawing" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]);
            const labels = items.filter((i) => i.type === "text" || i.type === "bullet-text" || i.type === "link-text");
            const findNearestLabel = (element) => {
              let nearest = null;
              let minDist = 100;
              for (const label of labels) {
                const labelCenterY = label.y + (label.height || 20) / 2;
                const elemCenterY = element.y + (element.height || 30) / 2;
                const yDist = Math.abs(labelCenterY - elemCenterY);
                const isLeftOrAbove = label.x <= element.x || label.y < element.y;
                if (yDist < minDist && isLeftOrAbove) {
                  minDist = yDist;
                  nearest = label;
                }
              }
              return nearest;
            };
            const shapeDescriptions = items.filter((i) => i.type !== "line" && i.type !== "text" && i.type !== "bullet-text" && i.type !== "link-text").sort((a, b) => {
              if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
              return a.x - b.x;
            }).map((i) => {
              const shapeType = i.type === "diamond" ? "RELATIONSHIP_DIAMOND" : i.type === "ellipse" ? "ATTRIBUTE_OVAL" : i.type === "cylinder" ? "ENTITY_TABLE" : i.type === "box" ? "BOX" : i.type === "ui-window" ? "WINDOW" : i.type === "ui-button" ? "BUTTON" : i.type === "ui-input" ? "INPUT_FIELD" : i.type === "ui-output" ? "OUTPUT_FIELD" : i.type === "ui-dropdown" ? "DROPDOWN" : i.type === "ui-image" ? "IMAGE" : i.type.toUpperCase();
              const posStr = `at approx (${Math.round(i.x)}, ${Math.round(i.y)})`;
              if (["ui-input", "ui-output", "ui-dropdown"].includes(i.type)) {
                const nearLabel = findNearestLabel(i);
                const labelText = nearLabel?.content ? ` (labelled "${nearLabel.content}")` : "";
                return `[${shapeType} ${posStr}${labelText}: ${i.content || "empty"}]`;
              }
              return `[${shapeType} ${posStr}: ${i.content || "empty"}]`;
            });
            const textDescriptions = items.filter((i) => i.type === "text" || i.type === "bullet-text" || i.type === "numbered-text" || i.type === "link-text").sort((a, b) => {
              if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
              return a.x - b.x;
            }).map((i) => {
              const formatting = [];
              if (i.isBold) formatting.push("bold");
              if (i.isUnderline || i.type === "link-text") formatting.push("underlined");
              if (i.fontSize && i.fontSize !== "normal") formatting.push(`size-${i.fontSize}`);
              if (i.textAlign && i.textAlign !== "left") formatting.push(`aligned-${i.textAlign}`);
              const formatStr = formatting.length > 0 ? ` (${formatting.join(", ")})` : "";
              if (i.type === "bullet-text" && i.content) {
                const bulletPoints = i.content.split("\n").filter((line) => line.trim());
                return `[BULLET_LIST: ${bulletPoints.length} bullet points: ${bulletPoints.map((p, idx) => `${idx + 1}. "${p}"`).join(", ")}${formatStr}]`;
              }
              if (i.type === "numbered-text" && i.content) {
                const numberedItems = i.content.split("\n").filter((line) => line.trim());
                return `[NUMBERED_LIST: ${numberedItems.length} numbered items: ${numberedItems.map((p, idx) => `${idx + 1}. "${p}"`).join(", ")}${formatStr}]`;
              }
              return `[TEXT: ${i.content || "empty"}${formatStr}]`;
            });
            const lines = items.filter((i) => i.type === "line");
            const connectionDescriptions = lines.map((line) => {
              const fromItem = line.connectedTo1 ? items.find((i) => i.id === line.connectedTo1) : null;
              const toItem = line.connectedTo2 ? items.find((i) => i.id === line.connectedTo2) : null;
              const fromDesc = fromItem ? `"${fromItem.content || fromItem.type}"` : `point at (${Math.round(line.x)}, ${Math.round(line.y)})`;
              const toDesc = toItem ? `"${toItem.content || toItem.type}"` : `point at (${Math.round(line.x2 || 0)}, ${Math.round(line.y2 || 0)})`;
              let positionContext = "";
              if (!toItem && line.x2 !== void 0 && line.y2 !== void 0) {
                const x = line.x2;
                const y = line.y2;
                const vPos = y < 150 ? "top" : y < 300 ? "middle" : "bottom";
                const hPos = x < 200 ? "left" : x < 400 ? "center" : "right";
                positionContext = ` (${vPos}-${hPos} area)`;
              }
              return `[LINE: from ${fromDesc} to ${toDesc}${positionContext}]`;
            });
            const connectionDesc = connectionDescriptions.length > 0 ? " Connections: " + connectionDescriptions.join(" ") : "";
            const textDesc = textDescriptions.length > 0 ? " " + textDescriptions.join(" ") : "";
            return shapeDescriptions.join(" ") + textDesc + connectionDesc;
          } catch (e) {
            return "";
          }
        }
        if (sub.inputStyle === "tag-matching" && inputs["tag_connections"]) {
          try {
            const connections = JSON.parse(inputs["tag_connections"]);
            const config = sub.inputConfig?.tagMatchingConfig;
            if (!config) return "No tag configuration found";
            const result = gradeTagMatching(connections, config.targetZones || []);
            const connectionDescs = connections.map((conn) => {
              const tag = config.sourceTags.find((t) => t.id === conn.tagId);
              const zone = config.targetZones.find(
                (z) => z.correctTagId === conn.tagId && conn.endX >= z.x && conn.endX <= z.x + z.width && conn.endY >= z.y && conn.endY <= z.y + z.height
              );
              const tagLabel = tag?.label || "unknown tag";
              const zoneLabel = zone?.label || "incorrect area";
              const isCorrect = zone !== void 0;
              return `${tagLabel} -> ${zoneLabel} (${isCorrect ? "CORRECT" : "INCORRECT"})`;
            });
            return `Tag connections (${result.correct}/${result.total} correct):
${connectionDescs.join("\n")}`;
          } catch (e) {
            return "";
          }
        }
        if (sub.inputStyle === "nav-structure" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]);
            const boxes = items.filter((i) => i.type === "box").sort((a, b) => {
              if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
              return a.x - b.x;
            }).map((i) => `[PAGE: "${i.content || "unnamed"}"]`);
            const lines = items.filter((i) => i.type === "line");
            const connections = lines.map((line) => {
              const fromBox = items.find((i) => i.id === line.connectedTo1);
              const toBox = items.find((i) => i.id === line.connectedTo2);
              const fromName = fromBox?.content || "unknown";
              const toName = toBox?.content || "unknown";
              let linkType = "no arrows";
              if (line.arrowStart && line.arrowEnd) {
                linkType = "double-headed (internal link)";
              } else if (line.arrowEnd) {
                linkType = "single arrow pointing to end (external link from start to end)";
              } else if (line.arrowStart) {
                linkType = "single arrow pointing to start (external link from end to start)";
              }
              return `[CONNECTION: "${fromName}" to "${toName}" - ${linkType}]`;
            });
            const pagesDesc = boxes.length > 0 ? `Pages: ${boxes.join(", ")}` : "No pages drawn";
            const linksDesc = connections.length > 0 ? `Links: ${connections.join(", ")}` : "No links drawn";
            return `${pagesDesc}. ${linksDesc}`;
          } catch (e) {
            return "";
          }
        }
        if (sub.inputStyle === "nav-structure-higher" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]);
            const pages = items.filter((i) => i.type === "nav-page" || i.type === "box").sort((a, b) => {
              if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
              return a.x - b.x;
            });
            const navAreas = items.filter((i) => i.type === "nav-highlight");
            const pagesInNavBar = pages.filter((page) => {
              const pageCenterX = page.x + (page.width || 120) / 2;
              const pageCenterY = page.y + (page.height || 50) / 2;
              return navAreas.some(
                (area) => pageCenterX >= area.x && pageCenterX <= area.x + (area.width || 400) && pageCenterY >= area.y && pageCenterY <= area.y + (area.height || 150)
              );
            });
            const lines = items.filter((i) => i.type === "line");
            const pageDescs = pages.map((p) => {
              const isInNav = pagesInNavBar.some((nav) => nav.id === p.id);
              const name = p.content || "unnamed";
              return `[PAGE: "${name}"${isInNav ? " (IN NAV BAR)" : ""}]`;
            });
            const hierarchyConns = lines.map((line) => {
              const parentPage = pages.find((p) => p.id === line.connectedTo1);
              const childPage = pages.find((p) => p.id === line.connectedTo2);
              const parentName = parentPage?.content || "unknown";
              const childName = childPage?.content || "unknown";
              return `[HIERARCHY: "${parentName}" -> "${childName}" (parent to child)]`;
            });
            const pagesDesc = pageDescs.length > 0 ? `Pages: ${pageDescs.join(", ")}` : "No pages drawn";
            const navDesc = pagesInNavBar.length > 0 ? `Navigation Bar contains: ${pagesInNavBar.map((p) => `"${p.content || "unnamed"}"`).join(", ")}` : "No navigation bar area defined";
            const hierarchyDesc = hierarchyConns.length > 0 ? `Hierarchy: ${hierarchyConns.join(", ")}` : "No hierarchy connections";
            return `HIGHER NAVIGATION STRUCTURE:
${pagesDesc}
${navDesc}
${hierarchyDesc}`;
          } catch (e) {
            return "";
          }
        }
        if (sub.inputStyle === "structure-dataflow" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]);
            const allItems = items;
            const studentItems = items.filter((i) => !i.isBaseItem);
            const functionBoxes = items.filter((i) => i.type === "box").sort((a, b) => {
              const yDiff = a.y - b.y;
              if (Math.abs(yDiff) > 30) return yDiff;
              return a.x - b.x;
            });
            const functionNumberMap = {};
            functionBoxes.forEach((box, idx) => {
              functionNumberMap[box.id] = {
                number: idx + 1,
                label: box.content || `Function ${idx + 1}`
              };
            });
            const functionIndexLines = functionBoxes.map((box, idx) => {
              const label = box.content || "(unnamed)";
              return `  ${idx + 1}. "${label}"`;
            });
            const functionIndexSection = functionIndexLines.length > 0 ? `FUNCTION INDEX (numbered rectangles in diagram):
${functionIndexLines.join("\n")}` : "No function boxes in diagram";
            const getFunctionRef = (boxId, fallbackX, fallbackY) => {
              if (boxId && functionNumberMap[boxId]) {
                const { number, label } = functionNumberMap[boxId];
                return `Function #${number} ("${label}")`;
              }
              if (fallbackX !== void 0 && fallbackY !== void 0) {
                let nearestBox = null;
                let nearestDist = Infinity;
                for (const box of functionBoxes) {
                  const boxCenterX = box.x + (box.width || 120) / 2;
                  const boxCenterY = box.y + (box.height || 60) / 2;
                  const dist = Math.sqrt(Math.pow(fallbackX - boxCenterX, 2) + Math.pow(fallbackY - boxCenterY, 2));
                  if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestBox = box;
                  }
                }
                if (nearestBox && functionNumberMap[nearestBox.id]) {
                  const { number, label } = functionNumberMap[nearestBox.id];
                  return `Function #${number} ("${label}")`;
                }
              }
              return "unknown function";
            };
            const dataflowArrows = items.filter((i) => i.type === "dataflow-arrow");
            const arrowDescriptions = dataflowArrows.map((arrow) => {
              const arrowMidX = (arrow.x + (arrow.x2 || arrow.x)) / 2;
              const arrowMidY = Math.min(arrow.y, arrow.y2 || arrow.y);
              const functionRef = getFunctionRef(arrow.originFunctionId, arrowMidX, arrowMidY);
              const direction = arrow.dataflowDirection === "up" ? "INPUT" : "OUTPUT";
              const attachedLabels = items.filter((i) => i.type === "text" && i.attachedArrowId === arrow.id).map((t) => (t.content || "").trim()).filter((c) => c.length > 0);
              const nearbyTexts = items.filter((i) => i.type === "text" && !i.attachedArrowId).filter((t) => {
                const midX = (arrow.x + (arrow.x2 || arrow.x)) / 2;
                const midY = (arrow.y + (arrow.y2 || arrow.y)) / 2;
                const dist = Math.sqrt(Math.pow(t.x - midX, 2) + Math.pow(t.y - midY, 2));
                return dist < 80;
              }).map((t) => (t.content || "").trim()).filter((c) => c.length > 0);
              const allLabels = [...attachedLabels, ...nearbyTexts];
              const variables = allLabels.flatMap((l) => l.split("\n").map((v) => v.trim()).filter((v) => v.length > 0));
              const variableStr = variables.length > 0 ? `variables: [${variables.join(", ")}]` : "no variables labeled";
              return `  - ${direction} arrow on ${functionRef}: ${variableStr}`;
            });
            const arrowSection = arrowDescriptions.length > 0 ? `DATAFLOW ARROWS:
${arrowDescriptions.join("\n")}` : "No dataflow arrows drawn";
            return `${functionIndexSection}

${arrowSection}`;
          } catch (e) {
            return "";
          }
        }
        if (sub.inputStyle === "structure-diagram" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]);
            const shapes = items.filter((i) => i.type === "struct-process" || i.type === "struct-decision" || i.type === "struct-loop").sort((a, b) => {
              if (Math.abs(a.y - b.y) > 30) return a.y - b.y;
              return a.x - b.x;
            });
            const lines = items.filter((i) => i.type === "line");
            const textLabels = items.filter((i) => i.type === "text");
            const shapeDescs = shapes.map((s) => {
              const typeLabel = s.type === "struct-process" ? "PROCESS" : s.type === "struct-decision" ? "DECISION" : "LOOP";
              const name = s.content || "unnamed";
              return `[${typeLabel}: "${name}"]`;
            });
            const connectionDescs = lines.map((line) => {
              const fromShape = shapes.find((s) => s.id === line.connectedTo1);
              const toShape = shapes.find((s) => s.id === line.connectedTo2);
              const fromName = fromShape?.content || "unknown";
              const toName = toShape?.content || "unknown";
              const fromType = fromShape?.type?.replace("struct-", "").toUpperCase() || "?";
              const toType = toShape?.type?.replace("struct-", "").toUpperCase() || "?";
              return `[FLOW: "${fromName}" (${fromType}) -> "${toName}" (${toType})]`;
            });
            const labelDescs = textLabels.map((t) => `[LABEL: "${t.content || ""}"]`);
            const shapesDesc = shapeDescs.length > 0 ? `Structure Elements: ${shapeDescs.join(", ")}` : "No structure elements drawn";
            const flowDesc = connectionDescs.length > 0 ? `Flow Connections: ${connectionDescs.join(", ")}` : "No flow connections";
            const labelsDesc = labelDescs.length > 0 ? `Labels: ${labelDescs.join(", ")}` : "";
            return `STRUCTURE DIAGRAM:
${shapesDesc}
${flowDesc}${labelsDesc ? "\n" + labelsDesc : ""}`;
          } catch (e) {
            return "";
          }
        }
        if (sub.inputStyle === "entity-occurrence-diagram" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]);
            const entities = items.filter((i) => i.type === "entity-oval").sort((a, b) => a.x - b.x);
            const linkedTitles = items.filter((i) => i.type === "text" && i.parentEntityId);
            const lines = items.filter((i) => i.type === "line");
            const entityDescs = entities.map((entity) => {
              const linkedTitle = linkedTitles.find((t) => t.parentEntityId === entity.id);
              const entityName = linkedTitle?.content || entity.content || "unnamed";
              const occurrences = entity.occurrences || [];
              const occText = occurrences.map((o) => o.text).join(", ");
              return `[ENTITY: "${entityName}" with occurrences: ${occText || "none"}]`;
            });
            const allOccurrences = [];
            entities.forEach((entity) => {
              const linkedTitle = linkedTitles.find((t) => t.parentEntityId === entity.id);
              const entityName = linkedTitle?.content || entity.content || "unnamed";
              (entity.occurrences || []).forEach((occ) => {
                allOccurrences.push({ entityId: entity.id, entityName, text: occ.text, occId: occ.id });
              });
            });
            const connectionDescs = lines.map((line) => {
              const parseOccRef = (ref) => {
                if (!ref) return null;
                const match2 = ref.match(/^(.+)-occ-(.+)$/);
                if (match2) {
                  const entityId = match2[1];
                  const occId = match2[2];
                  const occ = allOccurrences.find((o) => o.entityId === entityId && o.occId === occId);
                  return occ ? `${occ.entityName}:${occ.text}` : null;
                }
                return null;
              };
              const from = parseOccRef(line.connectedTo1) || "unknown";
              const to = parseOccRef(line.connectedTo2) || "unknown";
              return `[CONNECTION: "${from}" <-> "${to}"]`;
            });
            const entitiesStr = entityDescs.length > 0 ? `Entities: ${entityDescs.join(", ")}` : "No entities drawn";
            const connectionsStr = connectionDescs.length > 0 ? `Connections: ${connectionDescs.join(", ")}` : "No connections drawn";
            return `ENTITY-OCCURRENCE DIAGRAM:
${entitiesStr}
${connectionsStr}`;
          } catch (e) {
            return "";
          }
        }
        if (sub.inputStyle === "form-wireframe" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]);
            const sortedItems = items.sort((a, b) => {
              if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
              return a.x - b.x;
            });
            const formElements = [];
            const labels = sortedItems.filter((i) => i.type === "ui-label" || i.type === "text");
            const isRequiredLabel = (labelContent) => {
              return labelContent?.includes("*") || false;
            };
            const findNearestLabel = (element) => {
              let nearest = null;
              let minDist = 100;
              for (const label of labels) {
                const labelCenterY = label.y + (label.height || 20) / 2;
                const elemCenterY = element.y + (element.height || 30) / 2;
                const yDist = Math.abs(labelCenterY - elemCenterY);
                const isLeftOrAbove = label.x <= element.x || label.y < element.y - 10;
                if (yDist < minDist && isLeftOrAbove) {
                  minDist = yDist;
                  nearest = label;
                }
              }
              return nearest;
            };
            for (const item of sortedItems) {
              switch (item.type) {
                case "ui-label":
                case "text":
                  const labelContent = item.content || "unnamed";
                  const requiredMarker = isRequiredLabel(labelContent) ? " (REQUIRED - has *)" : "";
                  formElements.push(`[LABEL: "${labelContent}"${requiredMarker}]`);
                  break;
                case "ui-input":
                  const inputLabel = findNearestLabel(item);
                  const inputRequired = inputLabel && isRequiredLabel(inputLabel.content) ? " REQUIRED" : "";
                  const inputLabelStr = inputLabel ? ` for "${inputLabel.content || "unlabeled"}"` : "";
                  const inputValidationText = item.content || item.validationMessage || (item.validationMin !== void 0 || item.validationMax !== void 0 ? `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}` : "");
                  const inputContent = inputValidationText ? ` with validation "${inputValidationText}"` : "";
                  formElements.push(`[TEXT INPUT${inputLabelStr}${inputRequired}${inputContent}]`);
                  break;
                case "ui-textarea":
                  const textareaLabel = findNearestLabel(item);
                  const textareaRequired = textareaLabel && isRequiredLabel(textareaLabel.content) ? " REQUIRED" : "";
                  const textareaLabelStr = textareaLabel ? ` for "${textareaLabel.content || "unlabeled"}"` : "";
                  const textareaValidationText = item.content || item.validationMessage || (item.validationMin !== void 0 || item.validationMax !== void 0 ? `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}` : "");
                  const textareaContent = textareaValidationText ? ` with validation "${textareaValidationText}"` : "";
                  formElements.push(`[TEXTAREA${textareaLabelStr}${textareaRequired}${textareaContent}]`);
                  break;
                case "ui-dropdown":
                  const dropdownLabel = findNearestLabel(item);
                  const dropdownRequired = dropdownLabel && isRequiredLabel(dropdownLabel.content) ? " REQUIRED" : "";
                  const dropdownLabelStr = dropdownLabel ? ` for "${dropdownLabel.content || "unlabeled"}"` : "";
                  const dropdownOptionText = item.content ? ` showing "${item.content}"` : "";
                  const dropdownLegacyVal = item.validationMessage || (item.validationMin !== void 0 || item.validationMax !== void 0 ? `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}` : "");
                  const dropdownValidation = dropdownLegacyVal ? ` with validation "${dropdownLegacyVal}"` : "";
                  formElements.push(`[DROPDOWN${dropdownLabelStr}${dropdownRequired}${dropdownOptionText}${dropdownValidation}]`);
                  break;
                case "ui-radio":
                  formElements.push(`[RADIO BUTTON: "${item.content || "option"}"]`);
                  break;
                case "ui-checkbox":
                  formElements.push(`[CHECKBOX: "${item.content || "option"}"]`);
                  break;
                case "ui-submit":
                  formElements.push(`[SUBMIT BUTTON: "${item.content || "Submit"}"]`);
                  break;
              }
            }
            const result = `FORM ELEMENTS (in order from top to bottom, note: * in a label indicates a REQUIRED field):
${formElements.join("\n")}`;
            return result;
          } catch (e) {
            return "";
          }
        }
        if (sub.inputStyle === "webpage-wireframe" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]);
            const sortedItems = items.sort((a, b) => {
              if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
              return a.x - b.x;
            });
            const pageElements = [];
            for (const item of sortedItems) {
              switch (item.type) {
                case "wf-heading":
                  pageElements.push(`[HEADING: "${item.content || "untitled"}"]`);
                  break;
                case "wf-paragraph":
                  pageElements.push(`[PARAGRAPH]`);
                  break;
                case "ui-image":
                  pageElements.push(`[IMAGE: "${item.content || "image"}"]`);
                  break;
                case "link-text":
                  pageElements.push(`[LINK: "${item.content || "link"}"]`);
                  break;
                case "bullet-text":
                  pageElements.push(`[BULLET LIST: "${item.content || "list"}"]`);
                  break;
                case "numbered-text":
                  pageElements.push(`[NUMBERED LIST: "${item.content || "list"}"]`);
                  break;
                case "wf-audio":
                  pageElements.push(`[AUDIO PLAYER: "${item.content || "audio"}"]`);
                  break;
                case "wf-video":
                  pageElements.push(`[VIDEO PLAYER: "${item.content || "video"}"]`);
                  break;
                case "text":
                  pageElements.push(`[TEXT: "${item.content || ""}"]`);
                  break;
              }
            }
            return `WEBPAGE ELEMENTS (in order from top to bottom):
${pageElements.join("\n")}`;
          } catch (e) {
            return "";
          }
        }
        if (sub.inputStyle === "table" && sub.inputConfig) {
          if (sub.inputConfig.grid) {
            const grid = sub.inputConfig.grid;
            const gridAnswers = [];
            grid.rows.forEach((row, rowIdx) => {
              row.cells.forEach((cell, cellIdx) => {
                if (cell.isInput) {
                  const key = cell.key || `cell_${rowIdx}_${cellIdx}`;
                  const header = grid.headers[cellIdx] || `Column ${cellIdx + 1}`;
                  gridAnswers.push(`${header}: ${inputs[key] || "(no answer)"}`);
                }
              });
            });
            return gridAnswers.join("\n");
          }
          if (sub.inputConfig.columns) {
            const numRows = sub.inputConfig.inputRows || 1;
            const columnAnswers = [];
            for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
              const rowAnswers = sub.inputConfig.columns.map((col) => {
                const key = numRows > 1 ? `${col.key}_${rowIdx + 1}` : col.key;
                return `${col.header}: ${inputs[key] || "(no answer)"}`;
              });
              if (numRows > 1) {
                columnAnswers.push(`Row ${rowIdx + 1}: ${rowAnswers.join(", ")}`);
              } else {
                columnAnswers.push(rowAnswers.join("\n"));
              }
            }
            return columnAnswers.join("\n");
          }
          if (sub.inputConfig.rows) {
            const tableAnswers = sub.inputConfig.rows.filter((row) => row.isInput && row.key).map((row) => `${row.label}: ${inputs[row.key] || "(no answer)"}`).join("\n");
            return tableAnswers;
          }
        }
        if (sub.inputStyle === "labeled-inputs" && sub.inputConfig?.fields) {
          const fieldAnswers = sub.inputConfig.fields.map((field) => `${field.label}: ${inputs[field.key] || "(no answer)"}`).join("\n");
          return fieldAnswers;
        }
        if (sub.inputStyle === "erd-annotation") {
          if (inputs["diagram_image"]) {
            return "Student submitted a diagram image (see attached image for visual grading).";
          }
          const config = sub.inputConfig;
          const descriptions = [];
          let studentItems = [];
          if (inputs["erd_diagram"]) {
            try {
              studentItems = JSON.parse(inputs["erd_diagram"]);
            } catch (e) {
              console.error("Failed to parse student ERD diagram", e);
            }
          }
          if (config?.correctErdDiagram) {
            try {
              const correctItems = JSON.parse(config.correctErdDiagram);
              const correctDescriptions = [];
              const markedItems = correctItems.filter(
                (item) => item.marking === "primary" || item.marking === "foreign"
              );
              if (markedItems.length > 0) {
                correctDescriptions.push("Correct key markings:");
                for (const item of markedItems) {
                  const markingLabel = item.marking === "primary" ? "Primary Key (PK - underlined)" : "Foreign Key (FK - asterisk)";
                  correctDescriptions.push(`  - "${item.content || item.entityName || "unnamed"}": ${markingLabel}`);
                }
              }
              const correctEntities = correctItems.filter((item) => item.type === "erd-entity");
              for (const entity of correctEntities) {
                if (entity.attributes && entity.attributes.length > 0) {
                  const markedAttrs = entity.attributes.filter((attr) => attr.marking === "primary" || attr.marking === "foreign");
                  if (markedAttrs.length > 0) {
                    correctDescriptions.push(`Entity "${entity.entityName || "unnamed"}" correct markings:`);
                    for (const attr of markedAttrs) {
                      const markingLabel = attr.marking === "primary" ? "Primary Key (PK)" : "Foreign Key (FK)";
                      correctDescriptions.push(`  - ${attr.name}: ${markingLabel}`);
                    }
                  }
                }
              }
              if (correctDescriptions.length > 0) {
                descriptions.push("=== TEACHER'S CORRECT ANSWER (use for grading reference) ===");
                descriptions.push(...correctDescriptions);
                descriptions.push("=== END CORRECT ANSWER ===\n");
              }
            } catch (e) {
              console.error("Failed to parse correct ERD diagram", e);
            }
          }
          descriptions.push("=== STUDENT'S ANSWER ===");
          if (config?.erdAttributes) {
            descriptions.push("Attribute Markings:");
            for (const attr of config.erdAttributes) {
              const studentItem = studentItems.find((item) => item.id === attr.id);
              const marking = studentItem?.marking || "none";
              const markingLabel = marking === "primary" ? "Primary Key (PK)" : marking === "foreign" ? "Foreign Key (FK)" : "None";
              descriptions.push(`  ${attr.entityName}.${attr.attributeName}: ${markingLabel}`);
            }
          }
          const erdEntities = studentItems.filter((item) => item.type === "erd-entity");
          if (erdEntities.length > 0) {
            descriptions.push("ERD Entities:");
            for (const entity of erdEntities) {
              const entityName = entity.entityName || "Unnamed Entity";
              const isStudentAdded = !entity.isBaseItem;
              descriptions.push(`  Entity: ${entityName}${isStudentAdded ? " (student added)" : ""}`);
              if (entity.attributes && entity.attributes.length > 0) {
                for (const attr of entity.attributes) {
                  const markingLabel = attr.marking === "primary" ? " [PK - underlined]" : attr.marking === "foreign" ? " [FK - asterisk]" : "";
                  descriptions.push(`    - ${attr.name || "unnamed"}${markingLabel}`);
                }
              }
            }
          }
          const addedAttrs = studentItems.filter(
            (item) => (item.type === "ellipse" || item.type === "text") && !item.isBaseItem && item.content
          );
          if (addedAttrs.length > 0) {
            descriptions.push("Added Attributes (shapes):");
            for (const attr of addedAttrs) {
              descriptions.push(`  ${attr.content}`);
            }
          }
          const getEntityName = (itemId) => {
            if (!itemId) return "unknown";
            const item = studentItems.find((i) => i.id === itemId);
            if (!item) return "unknown";
            if (item.type === "erd-entity") return item.entityName || "unnamed entity";
            if (item.type === "box" || item.type === "cylinder") return item.content || "unnamed";
            return "unknown";
          };
          const addedLines = studentItems.filter(
            (item) => item.type === "line" && !item.isBaseItem
          );
          if (addedLines.length > 0) {
            descriptions.push("Added Relationship Lines:");
            for (const line of addedLines) {
              const label = line.relationshipLabel ? `"${line.relationshipLabel}"` : "(no label)";
              const from = getEntityName(line.connectedTo1);
              const to = getEntityName(line.connectedTo2);
              descriptions.push(`  Line from "${from}" to "${to}", label: ${label}`);
            }
          }
          const addedCrowfoots = studentItems.filter(
            (item) => item.type === "crowfoot" && !item.isBaseItem
          );
          if (addedCrowfoots.length > 0) {
            descriptions.push("Added 1:M Relationships (crowfoot lines):");
            for (const line of addedCrowfoots) {
              const label = line.relationshipLabel ? `"${line.relationshipLabel}"` : "(no label)";
              const oneEntity = getEntityName(line.connectedTo1);
              const manyEntity = getEntityName(line.connectedTo2);
              descriptions.push(`  Crowfoot line: "${oneEntity}" (ONE side, plain end) ---> "${manyEntity}" (MANY side, forked end), label: ${label}`);
            }
          }
          return descriptions.join("\n");
        }
        if (inputs["diagram_image"]) {
          return "Student submitted a diagram image (see attached image for visual grading).";
        }
        return Object.entries(inputs).filter(([key]) => key !== "diagram_image").map(([, val]) => val).join("\n");
      };
      const allSubQuestions = [];
      currentQuestion.subQuestions.forEach((sub) => {
        allSubQuestions.push(sub);
        if (sub.subParts && sub.subParts.length > 0) {
          allSubQuestions.push(...sub.subParts);
        }
      });
      const gradingPromises = allSubQuestions.filter((sub) => sub.maxMarks > 0).map(async (sub) => {
        const inputs = userInputs[sub.id] || {};
        const studentAnswer = prepareStudentAnswer(sub, inputs);
        totalMaxMarks += sub.maxMarks;
        if (!studentAnswer.trim()) {
          return { subId: sub.id, marks: 0, feedback: null };
        }
        try {
          const contentBlocksToText = (blocks) => {
            if (!blocks || blocks.length === 0) return "";
            return blocks.map((b) => {
              if (b.type === "text") return b.content || "";
              if (b.type === "code") return "```\n" + (b.content || "") + "\n```";
              if (b.type === "data-table" && b.dataTable) {
                const table = b.dataTable;
                const escapeCell = (s) => String(s || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
                const getCellValue2 = (cell) => {
                  if (typeof cell === "string") return cell;
                  if (cell && typeof cell === "object" && "value" in cell) return cell.value || "";
                  return String(cell || "");
                };
                const headers = table.columns.map((c) => escapeCell(c.header));
                const headerRow = "| " + headers.join(" | ") + " |";
                const separator = "| " + headers.map(() => "---").join(" | ") + " |";
                const dataRows = table.rows.map(
                  (r) => "| " + r.cells.map((cell) => escapeCell(getCellValue2(cell))).join(" | ") + " |"
                ).join("\n");
                return `**Table: ${table.tableName}**
${headerRow}
${separator}
${dataRows}`;
              }
              if (b.type === "code-table" && b.codeSections) {
                return b.codeSections.map((s) => `**${s.label}:**
\`\`\`
${s.code}
\`\`\``).join("\n\n");
              }
              return "";
            }).filter(Boolean).join("\n\n");
          };
          const scenarioText = contentBlocksToText(currentQuestion.scenario?.contentBlocks) || currentQuestion.scenario?.text || "";
          const questionContent = contentBlocksToText(sub.contentBlocks) || sub.questionText || "";
          const otherSubQuestions = allSubQuestions.filter((other) => other.id !== sub.id && other.maxMarks > 0);
          const siblingContext = otherSubQuestions.map((other) => {
            const otherInputs = userInputs[other.id] || {};
            const otherAnswer = prepareStudentAnswer(other, otherInputs);
            const otherQuestion = contentBlocksToText(other.contentBlocks) || other.questionText || "";
            return `Part ${other.label || "?"}: ${otherQuestion}
Student's answer: ${otherAnswer || "(no answer)"}`;
          }).join("\n\n");
          const formExpectationsContext = sub.inputStyle === "form-wireframe" && sub.inputConfig?.formWireframeExpectations?.length ? `
EXPECTED FORM ELEMENTS (teacher-defined - grade based on these):
${sub.inputConfig.formWireframeExpectations.map((exp, i) => {
            let desc = `${i + 1}. ${exp.fieldType.toUpperCase()}`;
            if (exp.labelText) desc += ` with label "${exp.labelText}"`;
            if (exp.required) desc += " (REQUIRED - must have *)";
            if (exp.options?.length) desc += ` with options: ${exp.options.join(", ")}`;
            const valText = exp.validationMessage || (exp.validationMin !== void 0 || exp.validationMax !== void 0 ? `${exp.validationMin ?? "?"}-${exp.validationMax ?? "?"}` : "");
            if (valText) desc += ` VALIDATION: "${valText}"`;
            return desc;
          }).join("\n")}` : "";
          let wireframeExampleContext = "";
          if ((sub.inputStyle === "webpage-wireframe" || sub.inputStyle === "form-wireframe") && sub.inputConfig?.wireframeExampleData) {
            try {
              const exampleItems = JSON.parse(sub.inputConfig.wireframeExampleData);
              const sorted = exampleItems.sort((a, b) => {
                if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
                return a.x - b.x;
              });
              const descriptions = [];
              for (const item of sorted) {
                switch (item.type) {
                  case "wf-heading":
                    descriptions.push(`[HEADING: "${item.content || ""}"]`);
                    break;
                  case "wf-paragraph":
                    descriptions.push(`[PARAGRAPH]`);
                    break;
                  case "wf-audio":
                    descriptions.push(`[AUDIO PLAYER: "${item.content || ""}"]`);
                    break;
                  case "wf-video":
                    descriptions.push(`[VIDEO PLAYER: "${item.content || ""}"]`);
                    break;
                  case "ui-image":
                    descriptions.push(`[IMAGE: "${item.content || ""}"]`);
                    break;
                  case "link-text":
                    descriptions.push(`[LINK: "${item.content || ""}"]`);
                    break;
                  case "bullet-text":
                    descriptions.push(`[BULLET LIST: "${item.content || ""}"]`);
                    break;
                  case "numbered-text":
                    descriptions.push(`[NUMBERED LIST: "${item.content || ""}"]`);
                    break;
                  case "ui-label":
                  case "text":
                    descriptions.push(`[LABEL: "${item.content || ""}"]`);
                    break;
                  case "ui-input":
                    descriptions.push(`[TEXT INPUT: "${item.content || ""}"]`);
                    break;
                  case "ui-textarea":
                    descriptions.push(`[TEXTAREA: "${item.content || ""}"]`);
                    break;
                  case "ui-dropdown":
                    descriptions.push(`[DROPDOWN: "${item.content || ""}"]`);
                    break;
                  case "ui-radio":
                    descriptions.push(`[RADIO: "${item.content || ""}"]`);
                    break;
                  case "ui-checkbox":
                    descriptions.push(`[CHECKBOX: "${item.content || ""}"]`);
                    break;
                  case "ui-submit":
                    descriptions.push(`[SUBMIT BUTTON: "${item.content || ""}"]`);
                    break;
                  default:
                    if (item.content) descriptions.push(`[${item.type.toUpperCase()}: "${item.content}"]`);
                }
              }
              if (descriptions.length > 0) {
                wireframeExampleContext = `
TEACHER'S EXAMPLE (expected answer - compare student's wireframe against this):
${descriptions.join("\n")}`;
              }
            } catch (e) {
            }
          }
          const navExampleContext = sub.inputStyle === "nav-structure" && sub.inputConfig?.navExampleData ? (() => {
            try {
              const items = JSON.parse(sub.inputConfig.navExampleData);
              const pages = items.filter((i) => i.type === "nav-page" || i.type === "box").sort((a, b) => {
                if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
                return a.x - b.x;
              });
              const lines = items.filter((i) => i.type === "line");
              const pageDescs = pages.map((p) => `"${p.content || "unnamed"}"`);
              const connections = lines.map((line) => {
                const from = pages.find((p) => p.id === line.connectedTo1);
                const to = pages.find((p) => p.id === line.connectedTo2);
                const arrowDesc = line.arrowEnd === "both" ? "<->" : "->";
                return `"${from?.content || "?"}" ${arrowDesc} "${to?.content || "?"}"`;
              });
              return `
EXPECTED NAVIGATION STRUCTURE (teacher-defined example answer - compare student answer to this):
Expected Pages: ${pageDescs.join(", ")}
Expected Links: ${connections.join(", ") || "none"}`;
            } catch (e) {
              return "";
            }
          })() : "";
          const navSolutionContext = sub.inputStyle === "nav-structure-higher" && sub.inputConfig?.solutionNavDiagram ? (() => {
            try {
              const items = JSON.parse(sub.inputConfig.solutionNavDiagram);
              const pages = items.filter((i) => i.type === "nav-page" || i.type === "box").sort((a, b) => {
                if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
                return a.x - b.x;
              });
              const navAreas = items.filter((i) => i.type === "nav-highlight");
              const pagesInNavBar = pages.filter((page) => {
                const pageCenterX = page.x + (page.width || 120) / 2;
                const pageCenterY = page.y + (page.height || 50) / 2;
                return navAreas.some(
                  (area) => pageCenterX >= area.x && pageCenterX <= area.x + (area.width || 400) && pageCenterY >= area.y && pageCenterY <= area.y + (area.height || 150)
                );
              });
              const lines = items.filter((i) => i.type === "line");
              const pageDescs = pages.map((p) => {
                const isInNav = pagesInNavBar.some((nav) => nav.id === p.id);
                const name = p.content || "unnamed";
                return `"${name}"${isInNav ? " (IN NAV BAR)" : ""}`;
              });
              const hierarchyConns = lines.map((line) => {
                const parentPage = pages.find((p) => p.id === line.connectedTo1);
                const childPage = pages.find((p) => p.id === line.connectedTo2);
                return `"${parentPage?.content || "?"}" -> "${childPage?.content || "?"}"`;
              });
              return `
EXPECTED SOLUTION (teacher-defined - compare student answer to this):
Expected Pages: ${pageDescs.join(", ")}
Expected in Nav Bar: ${pagesInNavBar.map((p) => `"${p.content || "unnamed"}"`).join(", ") || "none"}
Expected Hierarchy: ${hierarchyConns.join(", ") || "none"}`;
            } catch (e) {
              return "";
            }
          })() : "";
          const entityOccurrenceSolutionContext = sub.inputStyle === "entity-occurrence-diagram" && sub.inputConfig?.solutionEntityOccurrenceDiagram ? (() => {
            try {
              const items = JSON.parse(sub.inputConfig.solutionEntityOccurrenceDiagram);
              const entities = items.filter((i) => i.type === "entity-oval");
              const linkedTitles = items.filter((i) => i.type === "text" && i.parentEntityId);
              const lines = items.filter((i) => i.type === "line");
              const entityDescs = entities.map((e) => {
                const linkedTitle = linkedTitles.find((t) => t.parentEntityId === e.id);
                const entityName = linkedTitle?.content || e.content || "unnamed";
                const occs = e.occurrences || [];
                const occText = occs.map((o) => o.text).join(", ");
                return `Entity: "${entityName}" [occurrences: ${occText || "none"}]`;
              });
              const allOccs = [];
              entities.forEach((e) => {
                const linkedTitle = linkedTitles.find((t) => t.parentEntityId === e.id);
                const entityName = linkedTitle?.content || e.content || "unnamed";
                (e.occurrences || []).forEach((occ) => {
                  allOccs.push({ entityId: e.id, entityName, text: occ.text, occId: occ.id });
                });
              });
              const connections = lines.map((line) => {
                const parseOccRef = (ref) => {
                  if (!ref) return null;
                  const match2 = ref.match(/^(.+)-occ-(.+)$/);
                  if (match2) {
                    const entityId = match2[1];
                    const occId = match2[2];
                    const occ = allOccs.find((o) => o.entityId === entityId && o.occId === occId);
                    return occ ? `${occ.entityName}:${occ.text}` : null;
                  }
                  return null;
                };
                const from = parseOccRef(line.connectedTo1) || "?";
                const to = parseOccRef(line.connectedTo2) || "?";
                return `"${from}" -> "${to}"`;
              });
              return `
EXPECTED SOLUTION (teacher-defined entity-occurrence diagram - compare student answer to this):
Expected Entities: ${entityDescs.join(", ")}
Expected Connections: ${connections.join(", ") || "none"}`;
            } catch (e) {
              return "";
            }
          })() : "";
          const structureSolutionContext = sub.inputStyle === "structure-diagram" && sub.inputConfig?.solutionStructureDiagram ? (() => {
            try {
              const items = JSON.parse(sub.inputConfig.solutionStructureDiagram);
              const shapes = items.filter((i) => i.type === "struct-process" || i.type === "struct-decision" || i.type === "struct-loop").sort((a, b) => {
                if (Math.abs(a.y - b.y) > 30) return a.y - b.y;
                return a.x - b.x;
              });
              const lines = items.filter((i) => i.type === "line");
              const shapeDescs = shapes.map((s) => {
                const typeLabel = s.type === "struct-process" ? "Process" : s.type === "struct-decision" ? "Decision" : "Loop";
                return `${typeLabel}: "${s.content || "unnamed"}"`;
              });
              const connections = lines.map((line) => {
                const from = shapes.find((s) => s.id === line.connectedTo1);
                const to = shapes.find((s) => s.id === line.connectedTo2);
                return `"${from?.content || "?"}" -> "${to?.content || "?"}"`;
              });
              return `
EXPECTED SOLUTION (teacher-defined structure diagram - compare student answer to this):
Expected Structure Elements: ${shapeDescs.join(", ")}
Expected Flow Connections: ${connections.join(", ") || "none"}`;
            } catch (e) {
              return "";
            }
          })() : "";
          const databaseSchemaContext = sub.inputConfig?.databaseSchema?.tables?.length ? (() => {
            const schema = sub.inputConfig.databaseSchema;
            const tableDescs = schema.tables.map((t) => {
              const fieldDescs = t.fields.map((f) => {
                let desc = f.name;
                if (f.isPrimaryKey) desc = `${desc} (PK)`;
                if (f.isForeignKey) desc = `${desc} (FK)`;
                return desc;
              });
              return `Table "${t.name}": ${fieldDescs.join(", ")}`;
            });
            return `
DATABASE SCHEMA (for context - question relates to this database structure):
${tableDescs.join("\n")}`;
          })() : "";
          const fullContext = [
            `Question: ${currentQuestion.title}${sub.label ? ` Part ${sub.label}` : ""}`,
            scenarioText ? `Scenario: ${scenarioText}` : "",
            `Question Text: ${questionContent}`,
            `Maximum Marks: ${sub.maxMarks}`,
            `Marking Scheme:
${sub.markingScheme.map((m, i) => `  ${i + 1}. ${m}`).join("\n")}`,
            sub.aiGuidance ? `Teacher Guidance: ${sub.aiGuidance}` : "",
            formExpectationsContext,
            wireframeExampleContext,
            navExampleContext,
            navSolutionContext,
            structureSolutionContext,
            entityOccurrenceSolutionContext,
            databaseSchemaContext,
            siblingContext ? `
OTHER PARTS OF THIS QUESTION (for context - grade ONLY the current part):
${siblingContext}` : ""
          ].filter(Boolean).join("\n\n");
          const diagramInputStyles = ["drawing", "structure-dataflow", "erd-annotation", "form-wireframe", "webpage-wireframe", "nav-structure", "nav-structure-higher", "design-choice", "structure-diagram", "entity-occurrence-diagram"];
          const isDiagram = diagramInputStyles.includes(sub.inputStyle || "");
          const studentDiagramImage = isDiagram ? inputs["diagram_image"] || "" : "";
          const response = await fetch("/api/grade-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentAnswer: studentAnswer.trim(),
              markingScheme: sub.markingScheme,
              maxMarks: sub.maxMarks,
              questionContext: fullContext,
              aiGuidance: sub.aiGuidance,
              studentDiagramImage: studentDiagramImage || void 0
            })
          });
          if (response.ok) {
            const result = await response.json();
            return {
              subId: sub.id,
              marks: result.marks,
              feedback: { feedback: result.feedback, suggestions: result.suggestions }
            };
          } else {
            const marks = calculateMarks(inputs, sub);
            return { subId: sub.id, marks, feedback: null };
          }
        } catch (error) {
          const marks = calculateMarks(inputs, sub);
          return { subId: sub.id, marks, feedback: null };
        }
      });
      const results = await Promise.all(gradingPromises);
      for (const result of results) {
        newResults[result.subId] = result.marks;
        if (result.feedback) {
          newFeedback[result.subId] = result.feedback;
        }
        totalMarksEarned += result.marks;
      }
      setSubQuestionResults(newResults);
      setAiFeedback(newFeedback);
      setShowResults(true);
      if (totalMaxMarks > 0 && totalMarksEarned === totalMaxMarks && !document.documentElement.classList.contains("reduced-motion")) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#dc2626", "#000000", "#ffffff"]
        });
      }
    } catch (error) {
      console.error("Grading error:", error);
      const allSubs = [];
      currentQuestion.subQuestions.forEach((sub) => {
        allSubs.push(sub);
        if (sub.subParts && sub.subParts.length > 0) {
          allSubs.push(...sub.subParts);
        }
      });
      allSubs.forEach((sub) => {
        if (sub.maxMarks > 0) {
          const inputs = userInputs[sub.id] || {};
          const marks = calculateMarks(inputs, sub);
          newResults[sub.id] = marks;
          totalMarksEarned += marks;
          totalMaxMarks += sub.maxMarks;
        }
      });
      setSubQuestionResults(newResults);
      setShowResults(true);
    } finally {
      setIsGrading(false);
    }
  };
  const handleSelectQuestion = (id) => {
    setSelectedQuestionId(id);
    setUserInputs({});
    setShowResults(false);
    setSubQuestionResults({});
  };
  const handleBackToList = () => {
    setSelectedQuestionId(null);
    setUserInputs({});
    setShowResults(false);
    setSubQuestionResults({});
  };
  const handleKeyDown = (e, subId) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      if (e.shiftKey) {
        if (value.substring(start - 2, start) === "  ") {
          const newValue = value.substring(0, start - 2) + value.substring(end);
          handleInputChange(subId, "main", newValue);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start - 2;
          }, 0);
        }
      } else {
        const newValue = value.substring(0, start) + "  " + value.substring(end);
        handleInputChange(subId, "main", newValue);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        }, 0);
      }
    }
  };
  const getRequirementBadge = (req) => {
    if (req === "programming-language") {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900/50 w-fit mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CodeXml, { className: "w-4 h-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-wider", children: "Must Use: Programming Language" })
      ] });
    }
    if (req === "design-notation") {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900/50 w-fit mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FilePen, { className: "w-4 h-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-wider", children: "Must Use: Design Notation" })
      ] });
    }
    return null;
  };
  const renderInputArea = (subQ) => {
    if (subQ.maxMarks === 0) return null;
    const currentInput = userInputs[subQ.id] || {};
    if (subQ.inputStyle === "code-editor") {
      const isProgrammingOnly = subQ.codeRequirement === "programming-language";
      const starterCode = subQ.inputConfig?.starterCode || "";
      const placeholderText = isProgrammingOnly ? "// Write your code here (Pseudocode is NOT allowed)..." : "// Write your code or design notation here...";
      const currentValue = currentInput["main"];
      const displayValue = currentValue !== void 0 ? currentValue : starterCode;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 mt-4", children: [
        getRequirementBadge(subQ.codeRequirement),
        starterCode && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-md border border-blue-100 dark:border-blue-900/50 w-fit", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CodeXml, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-wider", children: "Complete the Code" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              placeholder: placeholderText,
              className: "min-h-[200px] text-base font-mono p-4 resize-y bg-neutral-900 text-neutral-100 border-neutral-800 focus:border-red-500 transition-all selection:bg-red-500/30",
              value: displayValue,
              onChange: (e) => handleInputChange(subQ.id, "main", e.target.value),
              onKeyDown: (e) => handleKeyDown(e, subQ.id),
              disabled: showResults,
              spellCheck: false
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-3 right-3 text-xs text-neutral-500", children: "Tab to indent" })
        ] })
      ] });
    }
    if (subQ.inputStyle === "table" && subQ.inputConfig) {
      if (subQ.inputConfig.grid) {
        const grid = subQ.inputConfig.grid;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-block border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "text-left text-sm", style: { width: "auto", tableLayout: "auto" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: grid.headers.map((header, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-medium", children: header }, i)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-neutral-200 dark:divide-neutral-700", children: grid.rows.map((row, rowIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-white dark:bg-neutral-900", children: row.cells.map((cell, cellIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", style: { verticalAlign: cell.multiline ? "top" : void 0 }, children: cell.isInput ? cell.multiline ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              placeholder: cell.placeholder || "Enter answer...",
              value: currentInput[cell.key || `cell_${rowIdx}_${cellIdx}`] || "",
              onChange: (e) => handleInputChange(subQ.id, cell.key || `cell_${rowIdx}_${cellIdx}`, e.target.value),
              disabled: showResults,
              className: "min-h-[100px] bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm resize-y",
              style: cell.width && cell.width !== "auto" ? { width: cell.width } : void 0
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: cell.placeholder || "Enter answer...",
              value: currentInput[cell.key || `cell_${rowIdx}_${cellIdx}`] || "",
              onChange: (e) => handleInputChange(subQ.id, cell.key || `cell_${rowIdx}_${cellIdx}`, e.target.value),
              disabled: showResults,
              className: "bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm",
              style: cell.width && cell.width !== "auto" ? { width: cell.width } : void 0
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-700 dark:text-neutral-300", children: cell.value || "" }) }, cellIdx)) }, rowIdx)) })
        ] }) });
      }
      if (subQ.inputConfig.columns) {
        const numRows = subQ.inputConfig.inputRows || 1;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: subQ.inputConfig.columns.map((col, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-medium", style: col.width ? { width: col.width } : void 0, children: col.header }, i)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-neutral-200 dark:divide-neutral-700", children: Array.from({ length: numRows }).map((_, rowIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-white dark:bg-neutral-900", children: subQ.inputConfig.columns.map((col, colIdx) => {
            const key = numRows > 1 ? `${col.key}_${rowIdx + 1}` : col.key;
            return /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                placeholder: col.placeholder || `Enter ${col.header.toLowerCase()}...`,
                value: currentInput[key] || "",
                onChange: (e) => handleInputChange(subQ.id, key, e.target.value),
                disabled: showResults,
                className: "min-h-[80px] bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm resize-none",
                style: col.width && col.width !== "auto" ? { width: col.width } : void 0
              }
            ) }, colIdx);
          }) }, rowIdx)) })
        ] }) });
      }
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4", children: [
        subQ.inputConfig.headers && subQ.inputConfig.headers.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700", children: subQ.inputConfig.headers.map((header, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("px-4 py-3 font-medium", i === 0 ? "shrink-0 whitespace-nowrap" : "flex-1 min-w-0"), children: header }, i)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid w-full", style: { gridTemplateColumns: "max-content 1fr" }, children: subQ.inputConfig.rows?.map((row, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 font-medium text-neutral-900 dark:text-white whitespace-nowrap bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 flex items-center", children: row.label }, `label-${i}`),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 flex items-center", children: row.isInput ? row.multiline ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              placeholder: row.placeholder || "Enter value...",
              value: currentInput[row.key || `row-${i}`] || "",
              onChange: (e) => handleInputChange(subQ.id, row.key || `row-${i}`, e.target.value),
              disabled: showResults,
              className: "w-full min-h-[100px] bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm resize-y"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: row.placeholder || "Enter value...",
              value: currentInput[row.key || `row-${i}`] || "",
              onChange: (e) => handleInputChange(subQ.id, row.key || `row-${i}`, e.target.value),
              disabled: showResults,
              className: "w-full bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-500", children: row.value }) }, `input-${i}`)
        ] })) })
      ] });
    }
    if (subQ.inputStyle === "labeled-inputs" && subQ.inputConfig) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 mt-4 w-full", children: subQ.inputConfig.fields?.map((field, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-neutral-700 dark:text-neutral-300 shrink-0 whitespace-nowrap", children: field.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: currentInput[field.key] || "",
            onChange: (e) => handleInputChange(subQ.id, field.key, e.target.value),
            disabled: showResults,
            className: "flex-1 min-w-0 bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm"
          }
        )
      ] }, i)) });
    }
    if (subQ.inputStyle === "fill-in-blanks" && subQ.inputConfig?.codeTemplate) {
      const template = subQ.inputConfig.codeTemplate;
      const blanks = subQ.inputConfig.blanks || [];
      const renderCodeWithBlanks = () => {
        const parts = [];
        let lastIndex = 0;
        const regex = /\{\{(blank_\d+)\}\}/g;
        let match2;
        while ((match2 = regex.exec(template)) !== null) {
          if (match2.index > lastIndex) {
            parts.push(
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-300", children: template.substring(lastIndex, match2.index) }, `text-${lastIndex}`)
            );
          }
          const blankKey = match2[1];
          const blankConfig = blanks.find((b) => b.key === blankKey);
          const userAnswer = currentInput[blankKey] || "";
          const isCorrect = showResults && blankConfig && userAnswer.toLowerCase().trim() === blankConfig.answer.toLowerCase().trim();
          const isWrong = showResults && blankConfig && userAnswer.toLowerCase().trim() !== blankConfig.answer.toLowerCase().trim();
          parts.push(
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-block mx-1 align-middle", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: userAnswer,
                  onChange: (e) => handleInputChange(subQ.id, blankKey, e.target.value),
                  disabled: showResults,
                  placeholder: blankConfig?.hint || "...",
                  style: { width: blankConfig?.width ? `${blankConfig.width}px` : "80px" },
                  className: `px-2 py-1 text-sm font-mono rounded border-2 transition-all
                  ${showResults ? isCorrect ? "bg-green-900/50 border-green-500 text-green-300" : "bg-red-900/50 border-red-500 text-red-300" : "bg-neutral-800 border-neutral-600 text-white focus:border-red-500"}`,
                  "data-testid": `input-blank-${blankKey}`
                }
              ),
              showResults && isWrong && blankConfig && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-green-400 text-xs", children: [
                "(",
                blankConfig.answer,
                ")"
              ] })
            ] }, blankKey)
          );
          lastIndex = match2.index + match2[0].length;
        }
        if (lastIndex < template.length) {
          parts.push(
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-300", children: template.substring(lastIndex) }, `text-${lastIndex}`)
          );
        }
        return parts;
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-900 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-neutral-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "whitespace-pre-wrap leading-relaxed", children: renderCodeWithBlanks() }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-2", children: "Fill in the blanks to complete the code" })
      ] });
    }
    if (subQ.inputStyle === "drawing") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        DiagramImageInput,
        {
          value: currentInput["diagram_image"] || "",
          onChange: (val) => !showResults && handleInputChange(subQ.id, "diagram_image", val),
          startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
          hint: DIAGRAM_HINTS["drawing"]
        }
      );
    }
    if (subQ.inputStyle === "design-choice") {
      const activeTab = currentInput["design_mode"] || "pseudocode";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-4", children: [
        getRequirementBadge(subQ.codeRequirement),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg w-fit", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => handleInputChange(subQ.id, "design_mode", "pseudocode"),
              className: `px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "pseudocode" ? "bg-white dark:bg-neutral-700 text-red-600 dark:text-red-400 shadow-sm" : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"}`,
              children: "Pseudocode"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => handleInputChange(subQ.id, "design_mode", "diagram"),
              className: `px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "diagram" ? "bg-white dark:bg-neutral-700 text-red-600 dark:text-red-400 shadow-sm" : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"}`,
              children: "Structure Diagram"
            }
          )
        ] }),
        activeTab === "pseudocode" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              placeholder: "// Write your design in pseudocode here...",
              className: "min-h-[300px] text-base font-mono p-4 resize-y bg-neutral-900 text-neutral-100 border-neutral-800 focus:border-red-500 transition-all selection:bg-red-500/30",
              value: currentInput["main"] || "",
              onChange: (e) => handleInputChange(subQ.id, "main", e.target.value),
              onKeyDown: (e) => handleKeyDown(e, subQ.id),
              disabled: showResults,
              spellCheck: false
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-3 right-3 text-xs text-neutral-500", children: "Tab to indent" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          DiagramImageInput,
          {
            value: currentInput["diagram_image"] || "",
            onChange: (val) => !showResults && handleInputChange(subQ.id, "diagram_image", val),
            startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
            hint: DIAGRAM_HINTS["drawing"]
          }
        )
      ] });
    }
    if (subQ.inputStyle === "erd-annotation") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        DiagramImageInput,
        {
          value: currentInput["diagram_image"] || "",
          onChange: (val) => !showResults && handleInputChange(subQ.id, "diagram_image", val),
          startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
          hint: DIAGRAM_HINTS["erd-annotation"]
        }
      );
    }
    if (subQ.inputStyle === "nav-structure") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        DiagramImageInput,
        {
          value: currentInput["diagram_image"] || "",
          onChange: (val) => !showResults && handleInputChange(subQ.id, "diagram_image", val),
          startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
          hint: DIAGRAM_HINTS["nav-structure"]
        }
      );
    }
    if (subQ.inputStyle === "nav-structure-higher") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        DiagramImageInput,
        {
          value: currentInput["diagram_image"] || "",
          onChange: (val) => !showResults && handleInputChange(subQ.id, "diagram_image", val),
          startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
          hint: DIAGRAM_HINTS["nav-structure-higher"]
        }
      );
    }
    if (subQ.inputStyle === "structure-diagram") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        DiagramImageInput,
        {
          value: currentInput["diagram_image"] || "",
          onChange: (val) => !showResults && handleInputChange(subQ.id, "diagram_image", val),
          startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
          hint: DIAGRAM_HINTS["drawing"]
        }
      );
    }
    if (subQ.inputStyle === "entity-occurrence-diagram") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        DiagramImageInput,
        {
          value: currentInput["diagram_image"] || "",
          onChange: (val) => !showResults && handleInputChange(subQ.id, "diagram_image", val),
          startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
          hint: DIAGRAM_HINTS["drawing"]
        }
      );
    }
    if (subQ.inputStyle === "database-schema") {
      const schema = subQ.inputConfig?.databaseSchema;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900", children: schema && schema.tables.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 italic", children: "No database schema defined for this question." }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-2", children: "Review the database schema above. Primary keys are underlined, foreign keys are marked with an asterisk (*)." })
      ] });
    }
    if (subQ.inputStyle === "tag-matching") {
      const tagConfig = subQ.inputConfig?.tagMatchingConfig;
      const savedConnections = currentInput["tag_connections"] ? JSON.parse(currentInput["tag_connections"]) : [];
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TagMatchingEditor,
          {
            mode: showResults ? "review" : "student",
            backgroundUrl: subQ.drawingBackgroundUrl,
            sourceTags: tagConfig?.sourceTags || [],
            targetZones: tagConfig?.targetZones || [],
            studentConnections: savedConnections,
            onStudentConnectionsChange: (connections) => {
              handleInputChange(subQ.id, "tag_connections", JSON.stringify(connections));
            },
            disabled: showResults
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-neutral-500 mt-2", children: "Click and drag from each numbered point to draw an arrow to where it belongs on the image." })
      ] });
    }
    if (subQ.inputStyle === "structure-dataflow") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        DiagramImageInput,
        {
          value: currentInput["diagram_image"] || "",
          onChange: (val) => !showResults && handleInputChange(subQ.id, "diagram_image", val),
          startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
          hint: DIAGRAM_HINTS["structure-dataflow"]
        }
      );
    }
    if (subQ.inputStyle === "form-wireframe") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        DiagramImageInput,
        {
          value: currentInput["diagram_image"] || "",
          onChange: (val) => !showResults && handleInputChange(subQ.id, "diagram_image", val),
          startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
          hint: DIAGRAM_HINTS["form-wireframe"]
        }
      );
    }
    if (subQ.inputStyle === "webpage-wireframe") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        DiagramImageInput,
        {
          value: currentInput["diagram_image"] || "",
          onChange: (val) => !showResults && handleInputChange(subQ.id, "diagram_image", val),
          startingImageUrl: subQ.drawingBackgroundUrl || subQ.imageUrl,
          hint: DIAGRAM_HINTS["form-wireframe"]
        }
      );
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Textarea,
      {
        placeholder: "Type your answer here...",
        className: "min-h-[100px] text-lg p-4 resize-none bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm transition-all mt-4",
        value: currentInput["main"] || "",
        onChange: (e) => handleInputChange(subQ.id, "main", e.target.value),
        onKeyDown: (e) => handleKeyDown(e, subQ.id),
        disabled: showResults
      }
    );
  };
  const getTopicName = (topicId2) => {
    const topic = TOPICS.find((t) => t.id === topicId2);
    return topic ? topic.name : "Unknown Topic";
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-[200]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 sm:gap-4 min-w-0", children: [
        selectedQuestionId ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: handleBackToList, className: "rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-5 h-5 text-neutral-500" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: "/", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-5 h-5 text-neutral-500" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-semibold text-neutral-900 dark:text-white text-sm sm:text-base truncate", children: topicDetails?.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-neutral-500 truncate", children: selectedQuestionId ? `Question ${currentQuestion?.title}` : `${allQuestions.length} Questions Available` })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ModeToggle, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-grow container mx-auto max-w-4xl px-3 sm:px-6 py-4 sm:py-6", children: !selectedQuestionId ? (
      // Question List View - Grouped by Year
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-neutral-900 dark:text-white mb-2", children: "Select a Question" }),
        (() => {
          const practiceQuestions = allQuestions.filter((q) => q.isPractice).sort(compareQuestionsByNumber);
          const pastPaperQuestions = allQuestions.filter((q) => !q.isPractice && !q.additionalPaperId && !q.isAdditionalExam);
          const questionsByYear = pastPaperQuestions.reduce((acc, q) => {
            if (!acc[q.year]) {
              acc[q.year] = [];
            }
            acc[q.year].push(q);
            return acc;
          }, {});
          Object.keys(questionsByYear).forEach((year) => {
            questionsByYear[Number(year)].sort(compareQuestionsByNumber);
          });
          const sortedYears = Object.keys(questionsByYear).map(Number).sort((a, b) => b - a);
          const renderQuestionCard = (q, index, showYear = true) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: index * 0.05 },
              onClick: () => handleSelectQuestion(q.id),
              className: "bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-red-500 dark:hover:border-red-500 cursor-pointer transition-all shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 group",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 sm:gap-3 mb-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded bg-neutral-50 dark:bg-neutral-900", children: getTopicName(q.topic) }),
                    showYear && !q.isPractice && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-neutral-500", children: q.year })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-neutral-900 dark:text-white", children: q.title }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-700 dark:text-neutral-300 line-clamp-1 font-medium", children: getQuestionPreviewText(q) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-5 h-5 text-neutral-400 group-hover:text-red-500 transition-colors" })
              ]
            },
            q.id
          );
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            practiceQuestions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Collapsible, { defaultOpen: false, className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CollapsibleTrigger, { className: "flex items-center gap-2 w-full group cursor-pointer py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-lg px-2 -mx-2 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-5 w-5 text-green-500 transition-transform duration-200 group-data-[state=closed]:-rotate-90" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-green-600 dark:text-green-400", children: "Practice Questions" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 border-b border-green-200 dark:border-green-800 mt-1 ml-2 group-hover:border-green-300 dark:group-hover:border-green-700 transition-colors" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-green-500 font-medium", children: [
                  practiceQuestions.length,
                  " questions"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { className: "pt-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-4", children: practiceQuestions.map((q, index) => renderQuestionCard(q, index, false)) }) })
            ] }, "practice"),
            sortedYears.map((year) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Collapsible, { defaultOpen: false, className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CollapsibleTrigger, { className: "flex items-center gap-2 w-full group cursor-pointer py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-lg px-2 -mx-2 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-5 w-5 text-neutral-400 transition-transform duration-200 group-data-[state=closed]:-rotate-90" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-neutral-800 dark:text-neutral-200", children: year }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 border-b border-neutral-200 dark:border-neutral-700 mt-1 ml-2 group-hover:border-neutral-300 dark:group-hover:border-neutral-600 transition-colors" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-neutral-400 font-medium", children: [
                  questionsByYear[year].length,
                  " questions"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { className: "pt-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-4", children: questionsByYear[year].map((q, index) => renderQuestionCard(q, index, false)) }) })
            ] }, year))
          ] });
        })()
      ] })
    ) : (
      // Single Question Revision View with Sub-questions
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full max-w-4xl mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          transition: { duration: 0.4 },
          className: "bg-white dark:bg-neutral-900 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200", children: currentQuestion?.year }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-neutral-900 dark:text-white", children: currentQuestion?.title })
            ] }),
            currentQuestion?.scenario && hasScenarioContent(currentQuestion.scenario) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 sm:mb-8 p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-950 rounded-lg sm:rounded-xl border border-neutral-200 dark:border-neutral-800", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3", children: "Scenario" }),
              currentQuestion.scenario.contentBlocks && currentQuestion.scenario.contentBlocks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: currentQuestion.scenario.contentBlocks.map((block) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                block.type === "text" && (block.hasBorder ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
                  "border border-neutral-300 dark:border-neutral-600 rounded-lg p-4",
                  block.borderWidth === "xs" && "max-w-[200px]",
                  block.borderWidth === "sm" && "max-w-xs",
                  (!block.borderWidth || block.borderWidth === "md") && "max-w-md",
                  block.borderWidth === "lg" && "max-w-lg",
                  block.borderWidth === "xl" && "max-w-xl",
                  block.borderWidth === "full" && "w-full"
                ), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-neutral-700 dark:text-neutral-300 leading-relaxed ${block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left"}`, children: formatText(block.content) }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-neutral-700 dark:text-neutral-300 leading-relaxed ${block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left"}`, children: formatText(block.content) })),
                block.type === "image" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
                  "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                  block.imageSize === "xs" && "max-w-[150px]",
                  block.imageSize === "small" && "max-w-xs",
                  block.imageSize === "medium" && "max-w-md",
                  block.imageSize === "large" && "max-w-xl",
                  block.imageSize === "xl" && "max-w-2xl",
                  block.imageSize === "2xl" && "max-w-4xl",
                  block.imageSize === "full" && "w-full",
                  !block.imageSize && "max-w-md"
                ), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: block.content, alt: block.caption || "Scenario image", className: "max-w-full h-auto object-contain" }),
                  block.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 dark:text-neutral-400 p-2", children: block.caption })
                ] }),
                block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-900 p-4 rounded-lg font-mono text-sm text-neutral-300 overflow-x-auto border border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { children: block.content }) }),
                block.type === "pseudocode" && block.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
                ] }, line.id || idx)) }) }),
                block.type === "code-table" && block.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: block.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-neutral-900 p-4 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0", children: section.code })
                ] }, section.id || sIdx)) }),
                block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden inline-block", children: [
                  block.dataTable.tableName && block.dataTable.tableName.trim() !== "" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono", children: block.dataTable.tableName }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: block.dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0", children: col.header }, col.id)) }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-neutral-300 dark:border-neutral-700", children: row.cells.map((cell, cellIndex) => {
                      if (isCellHidden(cell)) return null;
                      const cellRole = getCellRole(cell);
                      const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                      const colSpan = getCellColSpan(cell);
                      const rowSpan = getCellRowSpan(cell);
                      return /* @__PURE__ */ jsxRuntimeExports.jsx(
                        CellTag,
                        {
                          colSpan: colSpan > 1 ? colSpan : void 0,
                          rowSpan: rowSpan > 1 ? rowSpan : void 0,
                          className: cn(
                            "px-4 py-2 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                            cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                            cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                          ),
                          children: getCellValue(cell)
                        },
                        cellIndex
                      );
                    }) }, row.id)) })
                  ] })
                ] }) }),
                block.type === "database-schema" && block.databaseSchema && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema: block.databaseSchema }) }),
                block.type === "row-layout" && block.children && /* @__PURE__ */ jsxRuntimeExports.jsx(RowLayout, { children: block.children.map((childBlock) => /* @__PURE__ */ jsxRuntimeExports.jsxs(RowLayoutItem, { children: [
                  childBlock.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-neutral-700 dark:text-neutral-300 leading-relaxed ${childBlock.textAlign === "center" ? "text-center" : childBlock.textAlign === "right" ? "text-right" : "text-left"}`, children: formatText(childBlock.content) }),
                  childBlock.type === "image" && childBlock.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
                    "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center",
                    childBlock.imageSize === "xs" && "max-w-[150px]",
                    childBlock.imageSize === "small" && "max-w-xs",
                    childBlock.imageSize === "medium" && "max-w-md",
                    !childBlock.imageSize && "max-w-md"
                  ), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: childBlock.content, alt: childBlock.caption || "", className: "max-w-full h-auto object-contain" }),
                    childBlock.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 p-2", children: childBlock.caption })
                  ] }),
                  childBlock.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "p-4 bg-neutral-900 text-neutral-50 rounded-lg overflow-x-auto font-mono text-sm border border-neutral-700", children: childBlock.content }),
                  childBlock.type === "pseudocode" && childBlock.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: childBlock.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
                  ] }, line.id || idx)) }) }),
                  childBlock.type === "data-table" && childBlock.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: [
                    childBlock.dataTable.tableName && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-3 py-1.5 font-semibold text-sm border-b border-neutral-300 dark:border-neutral-600 font-mono", children: childBlock.dataTable.tableName }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "text-sm w-full", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: childBlock.dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-1.5 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0 text-xs", children: col.header }, col.id)) }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: childBlock.dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-neutral-300 dark:border-neutral-700", children: row.cells.map((cell, cellIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-1.5 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0 text-xs", children: getCellValue(cell) }, cellIndex)) }, row.id)) })
                    ] })
                  ] }),
                  childBlock.type === "code-table" && childBlock.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: childBlock.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-3 py-2 font-semibold text-sm border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-900 text-neutral-100 p-3 text-sm font-mono overflow-x-auto", children: section.code })
                  ] }, section.id || sIdx)) }),
                  childBlock.type === "database-schema" && childBlock.databaseSchema && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema: childBlock.databaseSchema }) })
                ] }, childBlock.id)) })
              ] }, block.id)) }) : (
                /* Legacy fallback */
                /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  currentQuestion.scenario.text && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-neutral-700 dark:text-neutral-300 mb-4 leading-relaxed", children: formatText(currentQuestion.scenario.text) }),
                  currentQuestion.scenario.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: currentQuestion.scenario.imageUrl, alt: "Scenario Illustration", className: "max-w-full h-auto max-h-[600px] object-contain" }) }),
                  currentQuestion.scenario.preCodeText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 text-neutral-700 dark:text-neutral-300 leading-relaxed", children: formatText(currentQuestion.scenario.preCodeText) }),
                  currentQuestion.scenario.codeSnippet && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-900 p-4 rounded-lg font-mono text-sm text-neutral-300 overflow-x-auto border border-neutral-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { children: currentQuestion.scenario.codeSnippet }) }),
                  currentQuestion.scenario.postImageText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 text-neutral-700 dark:text-neutral-300 leading-relaxed", children: formatText(currentQuestion.scenario.postImageText) })
                ] })
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-8 sm:space-y-12", children: currentQuestion?.subQuestions.map((subQ, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-neutral-100 dark:border-neutral-800 pt-6 sm:pt-8 first:border-0 first:pt-0 w-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 mb-4 w-full", children: [
              subQ.label && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base sm:text-lg font-bold text-neutral-900 dark:text-white shrink-0", children: subQ.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 w-full min-w-0 overflow-hidden", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2", children: subQ.maxMarks > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "self-start sm:ml-auto inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 whitespace-nowrap", children: [
                  subQ.maxMarks,
                  " ",
                  subQ.maxMarks === 1 ? "Mark" : "Marks"
                ] }) }),
                subQ.contentBlocks && subQ.contentBlocks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4 my-4", children: subQ.contentBlocks.map((block) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  block.type === "text" && (block.hasBorder ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
                    "border border-neutral-300 dark:border-neutral-600 rounded-lg p-4",
                    block.borderWidth === "xs" && "max-w-[200px]",
                    block.borderWidth === "sm" && "max-w-xs",
                    (!block.borderWidth || block.borderWidth === "md") && "max-w-md",
                    block.borderWidth === "lg" && "max-w-lg",
                    block.borderWidth === "xl" && "max-w-xl",
                    block.borderWidth === "full" && "w-full"
                  ), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-base sm:text-lg font-medium text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap ${block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left"}`, children: formatText(block.content) }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-base sm:text-lg font-medium text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap ${block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left"}`, children: formatText(block.content) })),
                  block.type === "image" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
                    "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                    block.imageSize === "xs" && "max-w-[150px]",
                    block.imageSize === "small" && "max-w-xs",
                    block.imageSize === "medium" && "max-w-md",
                    block.imageSize === "large" && "max-w-xl",
                    block.imageSize === "xl" && "max-w-2xl",
                    block.imageSize === "2xl" && "max-w-4xl",
                    block.imageSize === "full" && "w-full",
                    !block.imageSize && "max-w-md"
                  ), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: block.content, alt: block.caption || "Question image", className: "max-w-full h-auto object-contain" }),
                    block.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 dark:text-neutral-400 p-2", children: block.caption })
                  ] }),
                  block.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-sm text-green-400 font-mono whitespace-pre-wrap", children: block.content }) }),
                  block.type === "pseudocode" && block.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
                  ] }, line.id || idx)) }) }),
                  block.type === "code-table" && block.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: block.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-neutral-900 p-4 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0", children: section.code })
                  ] }, section.id || sIdx)) }),
                  block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden inline-block", children: [
                    block.dataTable.tableName && block.dataTable.tableName.trim() !== "" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono", children: block.dataTable.tableName }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "text-sm", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: block.dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0", children: col.header }, col.id)) }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-neutral-300 dark:border-neutral-700", children: row.cells.map((cell, cellIndex) => {
                        if (isCellHidden(cell)) return null;
                        const cellRole = getCellRole(cell);
                        const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                        const colSpan = getCellColSpan(cell);
                        const rowSpan = getCellRowSpan(cell);
                        return /* @__PURE__ */ jsxRuntimeExports.jsx(
                          CellTag,
                          {
                            colSpan: colSpan > 1 ? colSpan : void 0,
                            rowSpan: rowSpan > 1 ? rowSpan : void 0,
                            className: cn(
                              "px-4 py-2 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                              cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                              cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                            ),
                            children: getCellValue(cell)
                          },
                          cellIndex
                        );
                      }) }, row.id)) })
                    ] })
                  ] }) }),
                  block.type === "database-schema" && block.databaseSchema && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema: block.databaseSchema }) }),
                  block.type === "row-layout" && block.children && /* @__PURE__ */ jsxRuntimeExports.jsx(RowLayout, { children: block.children.map((childBlock) => /* @__PURE__ */ jsxRuntimeExports.jsxs(RowLayoutItem, { children: [
                    childBlock.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-neutral-900 dark:text-white leading-relaxed ${childBlock.textAlign === "center" ? "text-center" : childBlock.textAlign === "right" ? "text-right" : ""}`, children: formatText(childBlock.content) }),
                    childBlock.type === "image" && childBlock.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: childBlock.content, alt: childBlock.caption || "", className: "max-w-full h-auto object-contain" }),
                      childBlock.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 p-2", children: childBlock.caption })
                    ] }),
                    childBlock.type === "code" && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "p-4 bg-neutral-900 text-neutral-50 rounded-lg overflow-x-auto font-mono text-sm", children: childBlock.content }),
                    childBlock.type === "pseudocode" && childBlock.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: childBlock.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
                    ] }, line.id || idx)) }) }),
                    childBlock.type === "data-table" && childBlock.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: [
                      childBlock.dataTable.tableName && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-3 py-1.5 font-semibold text-sm font-mono", children: childBlock.dataTable.tableName }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "text-sm w-full", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: childBlock.dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-1.5 text-left font-semibold text-xs border-r last:border-r-0", children: col.header }, col.id)) }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: childBlock.dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t", children: row.cells.map((cell, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-1.5 text-xs border-r last:border-r-0", children: getCellValue(cell) }, idx)) }, row.id)) })
                      ] })
                    ] }),
                    childBlock.type === "code-table" && childBlock.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: childBlock.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-3 py-2 font-semibold text-sm border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-neutral-900 text-neutral-100 p-3 text-sm font-mono overflow-x-auto", children: section.code })
                    ] }, section.id || sIdx)) }),
                    childBlock.type === "database-schema" && childBlock.databaseSchema && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema: childBlock.databaseSchema }) })
                  ] }, childBlock.id)) })
                ] }, block.id)) }) : (
                  /* Legacy content */
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    subQ.questionText && /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base sm:text-lg font-medium text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap", children: formatText(subQ.questionText) }),
                    subQ.imageUrl && subQ.inputStyle !== "drawing" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: subQ.imageUrl, alt: "Question Illustration", className: "max-w-full h-auto max-h-[600px] object-contain" }) }) }),
                    subQ.preCodeText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-4 text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap", children: formatText(subQ.preCodeText) }),
                    subQ.codeSnippet && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-4 p-4 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-sm text-green-400 font-mono whitespace-pre-wrap", children: subQ.codeSnippet }) }),
                    subQ.imageCaption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "my-4 text-base text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap", children: subQ.imageCaption })
                  ] })
                ),
                renderInputArea(subQ),
                subQ.subParts && subQ.subParts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 ml-4 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700 space-y-6", children: subQ.subParts.map((part) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-start gap-2", children: [
                  part.label && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm sm:text-base font-bold text-neutral-800 dark:text-neutral-200", children: part.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2", children: [
                      part.contentBlocks && part.contentBlocks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 space-y-3", children: part.contentBlocks.map((block) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        block.type === "text" && block.content && (block.hasBorder ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
                          "border border-neutral-300 dark:border-neutral-600 rounded-lg p-3",
                          block.borderWidth === "xs" && "max-w-[200px]",
                          block.borderWidth === "sm" && "max-w-xs",
                          (!block.borderWidth || block.borderWidth === "md") && "max-w-md",
                          block.borderWidth === "lg" && "max-w-lg",
                          block.borderWidth === "xl" && "max-w-xl",
                          block.borderWidth === "full" && "w-full"
                        ), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
                          "text-sm sm:text-base text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap",
                          block.textAlign === "center" && "text-center",
                          block.textAlign === "right" && "text-right"
                        ), children: formatText(block.content) }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
                          "text-sm sm:text-base text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap",
                          block.textAlign === "center" && "text-center",
                          block.textAlign === "right" && "text-right"
                        ), children: formatText(block.content) })),
                        block.type === "image" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
                          "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                          block.imageSize === "xs" && "max-w-[120px]",
                          block.imageSize === "small" && "max-w-xs",
                          block.imageSize === "medium" && "max-w-md",
                          block.imageSize === "large" && "max-w-xl",
                          block.imageSize === "xl" && "max-w-2xl",
                          block.imageSize === "2xl" && "max-w-4xl",
                          block.imageSize === "full" && "w-full",
                          !block.imageSize && "max-w-md"
                        ), children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: block.content, alt: block.caption || "Question image", className: "max-w-full h-auto object-contain" }),
                          block.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 dark:text-neutral-400 p-2", children: block.caption })
                        ] }),
                        block.type === "code" && block.content && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-sm text-green-400 font-mono whitespace-pre-wrap", children: block.content }) }),
                        block.type === "pseudocode" && block.pseudocodeLines && /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "font-mono text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.pseudocodeLines.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap", children: line.lineLabel }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-neutral-900 dark:text-neutral-100 whitespace-pre", children: line.content })
                        ] }, line.id || idx)) }) }),
                        block.type === "code-table" && block.codeSections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden", children: block.codeSections.map((section, sIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600", children: section.label }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white dark:bg-neutral-900 p-4 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0", children: section.code })
                        ] }, section.id || sIdx)) }),
                        block.type === "data-table" && block.dataTable && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden inline-block", children: [
                          block.dataTable.tableName && block.dataTable.tableName.trim() !== "" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono", children: block.dataTable.tableName }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "text-sm", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-neutral-100 dark:bg-neutral-800", children: block.dataTable.columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0", children: col.header }, col.id)) }) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: block.dataTable.rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-neutral-300 dark:border-neutral-700", children: row.cells.map((cell, cellIndex) => {
                              if (isCellHidden(cell)) return null;
                              const cellRole = getCellRole(cell);
                              const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                              const colSpan = getCellColSpan(cell);
                              const rowSpan = getCellRowSpan(cell);
                              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                                CellTag,
                                {
                                  colSpan: colSpan > 1 ? colSpan : void 0,
                                  rowSpan: rowSpan > 1 ? rowSpan : void 0,
                                  className: cn(
                                    "px-4 py-2 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                                    cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                                    cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                                  ),
                                  children: getCellValue(cell)
                                },
                                cellIndex
                              );
                            }) }, row.id)) })
                          ] })
                        ] }) }),
                        block.type === "database-schema" && block.databaseSchema && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DatabaseSchemaDisplay, { schema: block.databaseSchema }) })
                      ] }, block.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm sm:text-base text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap", children: formatText(part.questionText) }),
                      part.maxMarks > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "self-start sm:ml-4 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 whitespace-nowrap", children: [
                        part.maxMarks,
                        " ",
                        part.maxMarks === 1 ? "Mark" : "Marks"
                      ] })
                    ] }),
                    (!part.contentBlocks || part.contentBlocks.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      part.imageUrl && part.inputStyle !== "drawing" && part.inputStyle !== "design-choice" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: part.imageUrl,
                          alt: "Question Illustration",
                          className: "max-w-full h-auto max-h-[400px] object-contain"
                        }
                      ) }) }),
                      part.preCodeText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-3 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap", children: formatText(part.preCodeText) }),
                      part.codeSnippet && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-3 p-3 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-sm text-green-400 font-mono whitespace-pre-wrap", children: part.codeSnippet }) }),
                      part.imageCaption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "my-3 text-sm text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap", children: part.imageCaption })
                    ] }),
                    renderInputArea(part),
                    showResults && part.maxMarks > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-neutral-600 dark:text-neutral-400", children: "Result" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-2 text-xs font-bold ${(subQuestionResults[part.id] || 0) === part.maxMarks ? "text-green-600 dark:text-green-400" : (subQuestionResults[part.id] || 0) > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`, children: [
                          (subQuestionResults[part.id] || 0) === part.maxMarks ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "w-3 h-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "w-3 h-3" }),
                          subQuestionResults[part.id] || 0,
                          " / ",
                          part.maxMarks
                        ] })
                      ] }),
                      aiFeedback[part.id] && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-md mb-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-neutral-700 dark:text-neutral-300 space-y-1", children: (typeof aiFeedback[part.id].feedback === "string" ? aiFeedback[part.id].feedback : Array.isArray(aiFeedback[part.id].feedback) ? aiFeedback[part.id].feedback.join("\n• ") : String(aiFeedback[part.id].feedback)).split("•").filter(Boolean).map((point, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: point.trim() })
                        ] }, i)) }),
                        aiFeedback[part.id].suggestions && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-neutral-600 dark:text-neutral-400 mt-1 text-xs italic", children: [
                          "💡 ",
                          typeof aiFeedback[part.id].suggestions === "string" ? aiFeedback[part.id].suggestions : Array.isArray(aiFeedback[part.id].suggestions) ? aiFeedback[part.id].suggestions.join(", ") : String(aiFeedback[part.id].suggestions)
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1", children: "Marking Scheme" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-0.5 text-xs text-neutral-600 dark:text-neutral-400", children: part.markingScheme.map((point, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-2 items-start", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-[3px] h-[3px] rounded-full bg-red-400 mt-1.5" }),
                        point
                      ] }, i)) })
                    ] })
                  ] })
                ] }) }, part.id)) }),
                showResults && subQ.maxMarks > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 p-4 rounded-lg border bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-neutral-600 dark:text-neutral-400", children: "Result" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-2 text-sm font-bold ${(subQuestionResults[subQ.id] || 0) === subQ.maxMarks ? "text-green-600 dark:text-green-400" : (subQuestionResults[subQ.id] || 0) > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`, children: [
                      (subQuestionResults[subQ.id] || 0) === subQ.maxMarks ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "w-4 h-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "w-4 h-4" }),
                      subQuestionResults[subQ.id] || 0,
                      " / ",
                      subQ.maxMarks
                    ] })
                  ] }),
                  aiFeedback[subQ.id] && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-md mb-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-neutral-700 dark:text-neutral-300 space-y-1", children: (typeof aiFeedback[subQ.id].feedback === "string" ? aiFeedback[subQ.id].feedback : Array.isArray(aiFeedback[subQ.id].feedback) ? aiFeedback[subQ.id].feedback.join("\n• ") : String(aiFeedback[subQ.id].feedback)).split("•").filter(Boolean).map((point, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: point.trim() })
                    ] }, i)) }),
                    aiFeedback[subQ.id].suggestions && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-neutral-600 dark:text-neutral-400 mt-2 text-xs italic", children: [
                      "💡 ",
                      typeof aiFeedback[subQ.id].suggestions === "string" ? aiFeedback[subQ.id].suggestions : Array.isArray(aiFeedback[subQ.id].suggestions) ? aiFeedback[subQ.id].suggestions.join(", ") : String(aiFeedback[subQ.id].suggestions)
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2", children: "Marking Scheme" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1 text-sm text-neutral-600 dark:text-neutral-400", children: subQ.markingScheme.map((point, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-2 items-start", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-[4px] h-[4px] rounded-full bg-red-400 mt-1.5" }),
                    point
                  ] }, i)) })
                ] })
              ] })
            ] }) }, subQ.id)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8", children: !showResults ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                className: "w-full",
                size: "lg",
                onClick: handleAutoMark,
                disabled: isGrading,
                children: isGrading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4 mr-2 animate-spin" }),
                  " Grading with AI..."
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "w-4 h-4 mr-2" }),
                  " Check All Answers"
                ] })
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full", size: "lg", onClick: handleBackToList, variant: "outline", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "mr-2 w-4 h-4" }),
              " Back to Questions"
            ] }) })
          ]
        },
        currentQuestion?.id
      ) }) })
    ) })
  ] });
}
export {
  Revision as default
};
//# sourceMappingURL=Revision-HSnij5xV.js.map
