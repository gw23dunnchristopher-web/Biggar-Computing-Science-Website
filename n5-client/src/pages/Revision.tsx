import { useState, useEffect, ReactNode } from "react";
import { useRoute, Link } from "wouter";
import { Question, SubQuestion, TOPICS, ContentBlock, DataTableCell, DataTableCellRole } from "@/lib/past-papers";

// Helper functions for DataTable cells (handles both string and object cells)
const getCellValue = (cell: string | DataTableCell): string => {
  return typeof cell === "string" ? cell : cell.value;
};

const getCellRole = (cell: string | DataTableCell): DataTableCellRole => {
  return typeof cell === "string" ? "data" : (cell.role || "data");
};

const getCellColSpan = (cell: string | DataTableCell): number => {
  return typeof cell === "string" ? 1 : (cell.colSpan || 1);
};

const getCellRowSpan = (cell: string | DataTableCell): number => {
  return typeof cell === "string" ? 1 : (cell.rowSpan || 1);
};

const isCellHidden = (cell: string | DataTableCell): boolean => {
  return typeof cell === "string" ? false : (cell.hidden || false);
};
import { cn } from "@/lib/utils";
import { useQuestions, compareQuestionsByNumber } from "@/lib/QuestionContext";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, ChevronDown, RefreshCw, Wand2, List, Code2, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DiagramEditor, DiagramItem } from "@/components/ui/diagram-editor";
import { DiagramImageInput, DIAGRAM_HINTS } from "@/components/ui/diagram-image-input";
import { TagMatchingEditor, gradeTagMatching, StudentConnection } from "@/components/ui/tag-matching-editor";
import { DatabaseSchemaDisplay } from "@/components/ui/database-schema-editor";
import { RowLayout, RowLayoutItem } from "@/components/ui/row-layout";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import confetti from "canvas-confetti";
import { ModeToggle } from "@/components/mode-toggle";

// Helper function to get preview text from a question (checks contentBlocks first, then legacy)
function getQuestionPreviewText(q: Question): string {
  const scenarioText = q.scenario?.contentBlocks?.find(b => b.type === "text")?.content 
    || q.scenario?.text;
  if (scenarioText) return scenarioText.substring(0, 80) + "...";
  
  const firstSubQ = q.subQuestions[0];
  if (firstSubQ) {
    const subQText = firstSubQ.contentBlocks?.find(b => b.type === "text")?.content 
      || firstSubQ.questionText;
    if (subQText) return subQText.substring(0, 80) + "...";
  }
  
  return "No scenario text";
}

// Helper function to format inline text with **bold**, *italic*, and `code` (monospace)
function formatInlineText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let key = 0;
  
  // Combined regex to find all formatting markers including superscript
  const combinedRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\^([^^]+?)\^)/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    const fullMatch = match[0];
    
    if (fullMatch.startsWith('**') && fullMatch.endsWith('**')) {
      parts.push(<strong key={key++}>{fullMatch.slice(2, -2)}</strong>);
    } else if (fullMatch.startsWith('`') && fullMatch.endsWith('`')) {
      parts.push(<code key={key++} className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono text-sm">{fullMatch.slice(1, -1)}</code>);
    } else if (fullMatch.startsWith('^') && fullMatch.endsWith('^')) {
      parts.push(<sup key={key++}>{fullMatch.slice(1, -1)}</sup>);
    } else if (fullMatch.startsWith('*') && fullMatch.endsWith('*')) {
      parts.push(<em key={key++}>{fullMatch.slice(1, -1)}</em>);
    }
    
    lastIndex = match.index + fullMatch.length;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
}

// Helper to extract alignment from line
function extractAlignment(line: string): { content: string; align: "left" | "center" | "right" } {
  if (line.startsWith("[center]")) {
    return { content: line.slice(8), align: "center" };
  } else if (line.startsWith("[right]")) {
    return { content: line.slice(7), align: "right" };
  } else if (line.startsWith("[left]")) {
    return { content: line.slice(6), align: "left" };
  }
  return { content: line, align: "left" };
}

// Helper function to format text with paragraphs, bullet points (with nesting), **bold**, *italic*, `code`, and alignment
function formatText(text: string): ReactNode {
  let keyCounter = 0;
  
  const lines = text.split('\n');
  const elements: ReactNode[] = [];
  let currentBulletItems: { content: string; isNumbered: boolean; level: number }[] = [];
  let currentParagraphLines: { content: string; align: "left" | "center" | "right" }[] = [];
  
  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      // Group consecutive lines with same alignment
      let currentAlign = currentParagraphLines[0].align;
      let currentGroup: string[] = [];
      
      for (const line of currentParagraphLines) {
        if (line.align === currentAlign) {
          currentGroup.push(line.content);
        } else {
          // Flush current group
          if (currentGroup.length > 0) {
            const alignClass = currentAlign === "center" ? "text-center" : currentAlign === "right" ? "text-right" : "";
            elements.push(
              <p key={keyCounter++} className={`mb-5 ${alignClass}`}>
                {formatInlineText(currentGroup.join('\n'))}
              </p>
            );
          }
          currentAlign = line.align;
          currentGroup = [line.content];
        }
      }
      // Flush remaining
      if (currentGroup.length > 0) {
        const alignClass = currentAlign === "center" ? "text-center" : currentAlign === "right" ? "text-right" : "";
        elements.push(
          <p key={keyCounter++} className={`mb-5 ${alignClass}`}>
            {formatInlineText(currentGroup.join('\n'))}
          </p>
        );
      }
      currentParagraphLines = [];
    }
  };
  
  const renderNestedList = (items: { content: string; isNumbered: boolean; level: number }[]): ReactNode => {
    if (items.length === 0) return null;
    
    const result: ReactNode[] = [];
    let i = 0;
    
    while (i < items.length) {
      const item = items[i];
      const currentLevel = item.level;
      
      // Find nested items (items with higher level that follow this one)
      const nestedItems: { content: string; isNumbered: boolean; level: number }[] = [];
      let j = i + 1;
      while (j < items.length && items[j].level > currentLevel) {
        nestedItems.push(items[j]);
        j++;
      }
      
      result.push(
        <li key={i} className="pl-1">
          {formatInlineText(item.content)}
          {nestedItems.length > 0 && renderNestedList(nestedItems)}
        </li>
      );
      
      i = j;
    }
    
    const isNumbered = items[0].isNumbered;
    const ListTag = isNumbered ? 'ol' : 'ul';
    const listStyle = items[0].level === 0 
      ? `mb-4 ml-5 space-y-1 ${isNumbered ? 'list-decimal' : 'list-disc'}`
      : `mt-1 ml-5 space-y-1 ${isNumbered ? 'list-decimal' : 'list-disc'}`;
    
    return <ListTag key={keyCounter++} className={listStyle}>{result}</ListTag>;
  };
  
  const flushBulletList = () => {
    if (currentBulletItems.length > 0) {
      elements.push(renderNestedList(currentBulletItems));
      currentBulletItems = [];
    }
  };
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Calculate indentation level (every 2 spaces or 1 tab = 1 level)
    const leadingSpaces = line.match(/^(\s*)/)?.[1] || '';
    const level = Math.floor(leadingSpaces.replace(/\t/g, '  ').length / 2);
    
    // Check for bullet points: - or • at start of trimmed line
    const bulletMatch = trimmedLine.match(/^[-•]\s+(.+)$/);
    // Check for numbered list: 1. or 1) at start
    const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);
    
    if (bulletMatch) {
      flushParagraph();
      currentBulletItems.push({ content: bulletMatch[1], isNumbered: false, level });
    } else if (numberedMatch) {
      flushParagraph();
      currentBulletItems.push({ content: numberedMatch[2], isNumbered: true, level });
    } else if (trimmedLine === '') {
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
  
  return <div className="space-y-1">{elements}</div>;
}

// Helper function to check if a scenario has any actual content
function hasScenarioContent(scenario: Question["scenario"]): boolean {
  if (!scenario) return false;
  
  // Check new content blocks approach
  if (scenario.contentBlocks && scenario.contentBlocks.length > 0) {
    return scenario.contentBlocks.some(block => block.content && block.content.trim());
  }
  
  // Check legacy fields
  return !!(
    (scenario.text && scenario.text.trim()) ||
    scenario.imageUrl ||
    scenario.codeSnippet ||
    scenario.preCodeText ||
    scenario.postImageText
  );
}

export default function Revision() {
  const [match, params] = useRoute("/revise/:topic");
  const topicId = params?.topic;

  const { questions } = useQuestions(); // Use context instead of constant
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // State to track inputs and marking for EACH sub-question
  // Key: subQuestionId
  const [userInputs, setUserInputs] = useState<Record<string, Record<string, string>>>({});
  const [subQuestionResults, setSubQuestionResults] = useState<Record<string, number | null>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (topicId) {
      const topicQuestions = questions.filter(q => q.topic === topicId).sort(compareQuestionsByNumber);
      setAllQuestions(topicQuestions);
    }
  }, [topicId, questions]); // Depend on questions from context

  const currentQuestion = allQuestions.find(q => q.id === selectedQuestionId);
  const topicDetails = TOPICS.find(t => t.id === topicId);

  // Helper to update input for a specific sub-question
  const handleInputChange = (subId: string, key: string, value: string) => {
    setUserInputs(prev => ({
      ...prev,
      [subId]: {
        ...(prev[subId] || {}),
        [key]: value
      }
    }));
  };

  const calculateMarks = (inputs: Record<string, string>, subQ: SubQuestion): number => {
    // If maxMarks is 0 (e.g. informational placeholder), return 0
    if (subQ.maxMarks === 0) return 0;

    let combinedAnswer = Object.values(inputs).join("\n").trim().toLowerCase();

    // Special handling for design choice - prioritize the active mode or combine both
    if (subQ.inputStyle === "design-choice") {
        const mode = inputs["design_mode"] || "pseudocode";
        if (mode === "pseudocode") {
            combinedAnswer = (inputs["main"] || "").toLowerCase();
        } else if (mode === "diagram" && inputs["drawing"]) {
             try {
                const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
                const textContents = items
                  .filter(i => (i.type === "text" || i.type === "box" || i.type === "ellipse" || i.type === "diamond" || i.type === "parallelogram") && i.content)
                  .sort((a, b) => {
                      // Sort by Y first (with 40px tolerance for "same line"), then X
                      if (Math.abs(a.y - b.y) > 40) {
                          return a.y - b.y;
                      }
                      return a.x - b.x;
                  })
                  .map(i => i.content?.toLowerCase() || "");
                combinedAnswer = textContents.join(" ");
             } catch (e) {
                console.error("Failed to parse diagram data", e);
                combinedAnswer = "";
             }
        }
    } 
    // Special handling for diagram editor output (standard)
    else if (subQ.inputStyle === "drawing" && inputs["drawing"]) {
      try {
        const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
        // Extract text content from all text items AND shapes
        const textContents = items
          .filter(i => (i.type === "text" || i.type === "box" || i.type === "ellipse" || i.type === "diamond" || i.type === "parallelogram") && i.content)
          .sort((a, b) => {
              // Sort by Y first (with 40px tolerance for "same line"), then X
              if (Math.abs(a.y - b.y) > 40) {
                  return a.y - b.y;
              }
              return a.x - b.x;
          })
          .map(i => i.content?.toLowerCase() || "");
        combinedAnswer = textContents.join(" ");
      } catch (e) {
        console.error("Failed to parse diagram data", e);
      }
    }
    // Special handling for ERD annotation
    else if (subQ.inputStyle === "erd-annotation") {
      const config = subQ.inputConfig;
      let totalRequirements = 0;
      let correctCount = 0;
      
      // Parse student's diagram
      let studentItems: DiagramItem[] = [];
      if (inputs["erd_diagram"]) {
        try {
          studentItems = JSON.parse(inputs["erd_diagram"]) as DiagramItem[];
        } catch (e) {
          console.error("Failed to parse student ERD diagram", e);
        }
      }
      
      // 1. Check PK/FK markings on existing attributes (legacy shapes)
      if (config?.erdAttributes) {
        for (const attr of config.erdAttributes) {
          totalRequirements++;
          const studentItem = studentItems.find(item => item.id === attr.id);
          const studentMarking = studentItem?.marking || "none";
          if (studentMarking === attr.correctMarking) {
            correctCount++;
          }
        }
      }
      
      // 1b. Check PK/FK markings on ERD entity attributes
      const erdEntities = studentItems.filter(item => item.type === "erd-entity");
      for (const entity of erdEntities) {
        if (entity.attributes) {
          for (const attr of entity.attributes) {
            // Count marked attributes (student work)
            if (attr.marking === "primary" || attr.marking === "foreign") {
              // This counts as student work - they've marked something
            }
          }
        }
      }
      
      // 2. Check required additional attributes (legacy ellipse/text or new ERD entity attributes)
      if (config?.erdRequiredAttributes) {
        for (const reqAttr of config.erdRequiredAttributes) {
          totalRequirements++;
          // Look for an ellipse/text item with matching content (case-insensitive)
          const foundLegacy = studentItems.some(item => 
            (item.type === "ellipse" || item.type === "text") && 
            !item.isBaseItem &&
            item.content?.toLowerCase().includes(reqAttr.attributeName.toLowerCase())
          );
          // Also check ERD entity attributes
          const foundInEntity = erdEntities.some(entity => 
            entity.attributes?.some(attr => 
              attr.name?.toLowerCase().includes(reqAttr.attributeName.toLowerCase())
            )
          );
          if (foundLegacy || foundInEntity) {
            correctCount++;
          }
        }
      }
      
      // 3. Check required lines between entities (also check erd-entity types)
      if (config?.erdRequiredLines) {
        for (const reqLine of config.erdRequiredLines) {
          totalRequirements++;
          // Find entity shapes by name (box, cylinder, or erd-entity)
          const entity1 = studentItems.find(item => 
            ((item.type === "box" || item.type === "cylinder") &&
            item.content?.toLowerCase().includes(reqLine.entity1.toLowerCase())) ||
            (item.type === "erd-entity" && item.entityName?.toLowerCase().includes(reqLine.entity1.toLowerCase()))
          );
          const entity2 = studentItems.find(item => 
            ((item.type === "box" || item.type === "cylinder") &&
            item.content?.toLowerCase().includes(reqLine.entity2.toLowerCase())) ||
            (item.type === "erd-entity" && item.entityName?.toLowerCase().includes(reqLine.entity2.toLowerCase()))
          );
          
          if (entity1 && entity2) {
            // Check if there's a line connecting them
            const hasLine = studentItems.some(item => 
              item.type === "line" &&
              ((item.connectedTo1 === entity1.id && item.connectedTo2 === entity2.id) ||
               (item.connectedTo1 === entity2.id && item.connectedTo2 === entity1.id))
            );
            if (hasLine) {
              correctCount++;
            }
          }
        }
      }
      
      // 4. Check required crowfoot (1:M) lines (also check erd-entity types)
      if (config?.erdRequiredCrowfootLines) {
        for (const reqCrowfoot of config.erdRequiredCrowfootLines) {
          totalRequirements++;
          // Find entity shapes by name (box, cylinder, or erd-entity)
          const entity1 = studentItems.find(item => 
            ((item.type === "box" || item.type === "cylinder") &&
            item.content?.toLowerCase().includes(reqCrowfoot.entity1.toLowerCase())) ||
            (item.type === "erd-entity" && item.entityName?.toLowerCase().includes(reqCrowfoot.entity1.toLowerCase()))
          );
          const entity2 = studentItems.find(item => 
            ((item.type === "box" || item.type === "cylinder") &&
            item.content?.toLowerCase().includes(reqCrowfoot.entity2.toLowerCase())) ||
            (item.type === "erd-entity" && item.entityName?.toLowerCase().includes(reqCrowfoot.entity2.toLowerCase()))
          );
          
          if (entity1 && entity2) {
            // Check if there's a crowfoot line connecting them
            const hasCrowfoot = studentItems.some(item => 
              item.type === "crowfoot" &&
              ((item.connectedTo1 === entity1.id && item.connectedTo2 === entity2.id) ||
               (item.connectedTo1 === entity2.id && item.connectedTo2 === entity1.id))
            );
            if (hasCrowfoot) {
              correctCount++;
            }
          }
        }
      }
      
      // Award proportional marks based on correct answers
      if (totalRequirements === 0) return 0;
      return Math.round((correctCount / totalRequirements) * subQ.maxMarks);
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
      const usedKeywords = new Set<string>();

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

  const [isGrading, setIsGrading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<Record<string, { feedback: string; suggestions: string }>>({});

  const handleAutoMark = async () => {
    if (!currentQuestion) return;

    setIsGrading(true);
    const newResults: Record<string, number> = {};
    const newFeedback: Record<string, { feedback: string; suggestions: string }> = {};
    let totalMarksEarned = 0;
    let totalMaxMarks = 0;

    try {
      // Helper function to prepare student answer for a sub-question
      const prepareStudentAnswer = (sub: SubQuestion, inputs: Record<string, string>): string => {
        if (sub.inputStyle === "design-choice") {
          const mode = inputs["design_mode"] || "pseudocode";
          if (mode === "pseudocode") {
            return inputs["main"] || "";
          } else if (mode === "diagram" && inputs["diagram_image"]) {
            return "Student submitted a diagram image (see attached image for visual grading).";
          } else if (mode === "diagram" && inputs["drawing"]) {
            try {
              const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
              const shapeDescriptions = items
                .filter(i => i.type !== "line")
                .sort((a, b) => {
                  if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
                  return a.x - b.x;
                })
                .map(i => {
                  const shapeType = i.type === "diamond" ? "DECISION" :
                                   i.type === "ellipse" ? "START_END" :
                                   i.type === "parallelogram" ? "INPUT_OUTPUT" :
                                   i.type === "box" ? "PROCESS" :
                                   i.type === "text" || i.type === "bullet-text" || i.type === "link-text" ? "LABEL" : i.type.toUpperCase();
                  const formatting: string[] = [];
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
            const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
            
            const labels = items.filter(i => i.type === "text" || i.type === "bullet-text" || i.type === "link-text");
            
            const findNearestLabel = (element: DiagramItem) => {
              let nearest: DiagramItem | null = null;
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
            
            const shapeDescriptions = items
              .filter(i => i.type !== "line" && i.type !== "text" && i.type !== "bullet-text" && i.type !== "link-text")
              .sort((a, b) => {
                if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
                return a.x - b.x;
              })
              .map(i => {
                const shapeType = i.type === "diamond" ? "RELATIONSHIP_DIAMOND" :
                                 i.type === "ellipse" ? "ATTRIBUTE_OVAL" :
                                 i.type === "cylinder" ? "ENTITY_TABLE" :
                                 i.type === "box" ? "BOX" :
                                 i.type === "ui-window" ? "WINDOW" :
                                 i.type === "ui-button" ? "BUTTON" :
                                 i.type === "ui-input" ? "INPUT_FIELD" :
                                 i.type === "ui-output" ? "OUTPUT_FIELD" :
                                 i.type === "ui-dropdown" ? "DROPDOWN" :
                                 i.type === "ui-image" ? "IMAGE" :
                                 i.type.toUpperCase();
                
                const posStr = `at approx (${Math.round(i.x)}, ${Math.round(i.y)})`;
                if (["ui-input", "ui-output", "ui-dropdown"].includes(i.type)) {
                  const nearLabel = findNearestLabel(i);
                  const labelText = nearLabel?.content ? ` (labelled "${nearLabel.content}")` : "";
                  return `[${shapeType} ${posStr}${labelText}: ${i.content || "empty"}]`;
                }
                return `[${shapeType} ${posStr}: ${i.content || "empty"}]`;
              });
            
            const textDescriptions = items
              .filter(i => i.type === "text" || i.type === "bullet-text" || i.type === "numbered-text" || i.type === "link-text")
              .sort((a, b) => {
                if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
                return a.x - b.x;
              })
              .map(i => {
                const formatting: string[] = [];
                if (i.isBold) formatting.push("bold");
                if (i.isUnderline || i.type === "link-text") formatting.push("underlined");
                if (i.fontSize && i.fontSize !== "normal") formatting.push(`size-${i.fontSize}`);
                if (i.textAlign && i.textAlign !== "left") formatting.push(`aligned-${i.textAlign}`);
                const formatStr = formatting.length > 0 ? ` (${formatting.join(", ")})` : "";
                
                if (i.type === "bullet-text" && i.content) {
                  const bulletPoints = i.content.split("\n").filter(line => line.trim());
                  return `[BULLET_LIST: ${bulletPoints.length} bullet points: ${bulletPoints.map((p, idx) => `${idx + 1}. "${p}"`).join(", ")}${formatStr}]`;
                }
                
                if (i.type === "numbered-text" && i.content) {
                  const numberedItems = i.content.split("\n").filter(line => line.trim());
                  return `[NUMBERED_LIST: ${numberedItems.length} numbered items: ${numberedItems.map((p, idx) => `${idx + 1}. "${p}"`).join(", ")}${formatStr}]`;
                }
                
                return `[TEXT: ${i.content || "empty"}${formatStr}]`;
              });
            
            const lines = items.filter(i => i.type === "line");
            
            // Describe each line connection in detail
            const connectionDescriptions = lines.map(line => {
              // Find what the line connects at each end
              const fromItem = line.connectedTo1 ? items.find(i => i.id === line.connectedTo1) : null;
              const toItem = line.connectedTo2 ? items.find(i => i.id === line.connectedTo2) : null;
              
              // Get descriptions of connected items
              const fromDesc = fromItem 
                ? `"${fromItem.content || fromItem.type}"` 
                : `point at (${Math.round(line.x)}, ${Math.round(line.y)})`;
              const toDesc = toItem 
                ? `"${toItem.content || toItem.type}"` 
                : `point at (${Math.round(line.x2 || 0)}, ${Math.round(line.y2 || 0)})`;
              
              // Add position context for unconnected endpoints (helps identify image regions)
              let positionContext = "";
              if (!toItem && line.x2 !== undefined && line.y2 !== undefined) {
                const x = line.x2;
                const y = line.y2;
                // Provide rough position description
                const vPos = y < 150 ? "top" : y < 300 ? "middle" : "bottom";
                const hPos = x < 200 ? "left" : x < 400 ? "center" : "right";
                positionContext = ` (${vPos}-${hPos} area)`;
              }
              
              return `[LINE: from ${fromDesc} to ${toDesc}${positionContext}]`;
            });
            
            const connectionDesc = connectionDescriptions.length > 0 
              ? " Connections: " + connectionDescriptions.join(" ") 
              : "";
            const textDesc = textDescriptions.length > 0 ? " " + textDescriptions.join(" ") : "";
            
            return shapeDescriptions.join(" ") + textDesc + connectionDesc;
          } catch (e) {
            return "";
          }
        }
        
        // Handle tag-matching - auto-grade based on zone positions
        if (sub.inputStyle === "tag-matching" && inputs["tag_connections"]) {
          try {
            const connections: StudentConnection[] = JSON.parse(inputs["tag_connections"]);
            const config = sub.inputConfig?.tagMatchingConfig;
            if (!config) return "No tag configuration found";
            
            const result = gradeTagMatching(connections, config.targetZones || []);
            
            // Format the answer showing which connections were made
            const connectionDescs = connections.map(conn => {
              const tag = config.sourceTags.find(t => t.id === conn.tagId);
              const zone = config.targetZones.find(z => 
                z.correctTagId === conn.tagId &&
                conn.endX >= z.x && conn.endX <= z.x + z.width &&
                conn.endY >= z.y && conn.endY <= z.y + z.height
              );
              const tagLabel = tag?.label || "unknown tag";
              const zoneLabel = zone?.label || "incorrect area";
              const isCorrect = zone !== undefined;
              return `${tagLabel} -> ${zoneLabel} (${isCorrect ? "CORRECT" : "INCORRECT"})`;
            });
            
            return `Tag connections (${result.correct}/${result.total} correct):\n${connectionDescs.join("\n")}`;
          } catch (e) {
            return "";
          }
        }
        
        // Handle navigation structure - describe boxes and connections with arrow types
        if (sub.inputStyle === "nav-structure" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
            
            // Describe boxes (webpages)
            const boxes = items
              .filter(i => i.type === "box")
              .sort((a, b) => {
                if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
                return a.x - b.x;
              })
              .map(i => `[PAGE: "${i.content || "unnamed"}"]`);
            
            // Describe lines with arrow information
            const lines = items.filter(i => i.type === "line");
            const connections = lines.map(line => {
              const fromBox = items.find(i => i.id === line.connectedTo1);
              const toBox = items.find(i => i.id === line.connectedTo2);
              const fromName = fromBox?.content || "unknown";
              const toName = toBox?.content || "unknown";
              
              // Determine link type based on arrows
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
        
        // Handle advanced navigation structure - describe hierarchical structure with nav highlight areas
        if (sub.inputStyle === "nav-structure-higher" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
            
            // Get page boxes (nav-page type)
            const pages = items
              .filter(i => i.type === "nav-page" || i.type === "box")
              .sort((a, b) => {
                if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
                return a.x - b.x;
              });
            
            // Get navigation highlight areas
            const navAreas = items.filter(i => i.type === "nav-highlight");
            
            // Determine which pages are inside each nav highlight area
            const pagesInNavBar = pages.filter(page => {
              const pageCenterX = page.x + (page.width || 120) / 2;
              const pageCenterY = page.y + (page.height || 50) / 2;
              return navAreas.some(area => 
                pageCenterX >= area.x && 
                pageCenterX <= area.x + (area.width || 400) &&
                pageCenterY >= area.y && 
                pageCenterY <= area.y + (area.height || 150)
              );
            });
            
            // Get connections (lines) to understand hierarchy
            const lines = items.filter(i => i.type === "line");
            
            // Build page descriptions
            const pageDescs = pages.map(p => {
              const isInNav = pagesInNavBar.some(nav => nav.id === p.id);
              const name = p.content || "unnamed";
              return `[PAGE: "${name}"${isInNav ? " (IN NAV BAR)" : ""}]`;
            });
            
            // Build hierarchy connections
            const hierarchyConns = lines.map(line => {
              const parentPage = pages.find(p => p.id === line.connectedTo1);
              const childPage = pages.find(p => p.id === line.connectedTo2);
              const parentName = parentPage?.content || "unknown";
              const childName = childPage?.content || "unknown";
              return `[HIERARCHY: "${parentName}" -> "${childName}" (parent to child)]`;
            });
            
            const pagesDesc = pageDescs.length > 0 ? `Pages: ${pageDescs.join(", ")}` : "No pages drawn";
            const navDesc = pagesInNavBar.length > 0 
              ? `Navigation Bar contains: ${pagesInNavBar.map(p => `"${p.content || "unnamed"}"`).join(", ")}`
              : "No navigation bar area defined";
            const hierarchyDesc = hierarchyConns.length > 0 
              ? `Hierarchy: ${hierarchyConns.join(", ")}` 
              : "No hierarchy connections";
            
            return `HIGHER NAVIGATION STRUCTURE:\n${pagesDesc}\n${navDesc}\n${hierarchyDesc}`;
          } catch (e) {
            return "";
          }
        }
        
        // Handle structure dataflow - describe boxes and dataflow arrows with labels
        if (sub.inputStyle === "structure-dataflow" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
            
            // Get all items including base items (for function box lookups)
            const allItems = items;
            
            // Get student-added items (not base items) for arrows and labels
            const studentItems = items.filter(i => !i.isBaseItem);
            
            // Get ALL function boxes (both base and student-added) and sort by position
            // Sort by Y first (top to bottom), then by X (left to right) for stable numbering
            const functionBoxes = items
              .filter(i => i.type === "box")
              .sort((a, b) => {
                const yDiff = a.y - b.y;
                if (Math.abs(yDiff) > 30) return yDiff; // Different rows
                return a.x - b.x; // Same row, sort by X
              });
            
            // Create a numbered index map: boxId -> { number, label }
            const functionNumberMap: Record<string, { number: number; label: string }> = {};
            functionBoxes.forEach((box, idx) => {
              functionNumberMap[box.id] = {
                number: idx + 1,
                label: box.content || `Function ${idx + 1}`
              };
            });
            
            // Build the Function Index section for AI context
            const functionIndexLines = functionBoxes.map((box, idx) => {
              const label = box.content || "(unnamed)";
              return `  ${idx + 1}. "${label}"`;
            });
            const functionIndexSection = functionIndexLines.length > 0
              ? `FUNCTION INDEX (numbered rectangles in diagram):\n${functionIndexLines.join("\n")}`
              : "No function boxes in diagram";
            
            // Helper to get function reference by ID
            const getFunctionRef = (boxId: string | undefined, fallbackX?: number, fallbackY?: number): string => {
              if (boxId && functionNumberMap[boxId]) {
                const { number, label } = functionNumberMap[boxId];
                return `Function #${number} ("${label}")`;
              }
              // Fallback: find nearest box by proximity
              if (fallbackX !== undefined && fallbackY !== undefined) {
                let nearestBox: DiagramItem | null = null;
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
            
            // Describe dataflow arrows with numbered function references
            const dataflowArrows = items.filter(i => i.type === "dataflow-arrow");
            const arrowDescriptions = dataflowArrows.map(arrow => {
              const arrowMidX = (arrow.x + (arrow.x2 || arrow.x)) / 2;
              const arrowMidY = Math.min(arrow.y, arrow.y2 || arrow.y); // Top of arrow
              
              const functionRef = getFunctionRef(arrow.originFunctionId, arrowMidX, arrowMidY);
              const direction = arrow.dataflowDirection === "up" ? "INPUT" : "OUTPUT";
              
              // Find any text labels attached to this arrow
              const attachedLabels = items
                .filter(i => i.type === "text" && i.attachedArrowId === arrow.id)
                .map(t => (t.content || "").trim())
                .filter(c => c.length > 0);
              
              // Also find nearby text items that might be labels (within 80 pixels)
              const nearbyTexts = items
                .filter(i => i.type === "text" && !i.attachedArrowId)
                .filter(t => {
                  const midX = (arrow.x + (arrow.x2 || arrow.x)) / 2;
                  const midY = (arrow.y + (arrow.y2 || arrow.y)) / 2;
                  const dist = Math.sqrt(Math.pow(t.x - midX, 2) + Math.pow(t.y - midY, 2));
                  return dist < 80;
                })
                .map(t => (t.content || "").trim())
                .filter(c => c.length > 0);
              
              const allLabels = [...attachedLabels, ...nearbyTexts];
              // Split multi-line labels into individual variables
              const variables = allLabels.flatMap(l => l.split("\n").map(v => v.trim()).filter(v => v.length > 0));
              
              const variableStr = variables.length > 0 
                ? `variables: [${variables.join(", ")}]` 
                : "no variables labeled";
              
              return `  - ${direction} arrow on ${functionRef}: ${variableStr}`;
            });
            
            const arrowSection = arrowDescriptions.length > 0
              ? `DATAFLOW ARROWS:\n${arrowDescriptions.join("\n")}`
              : "No dataflow arrows drawn";
            
            return `${functionIndexSection}\n\n${arrowSection}`;
          } catch (e) {
            return "";
          }
        }
        
        // Handle structure-diagram - describe process/decision/loop shapes and connections
        if (sub.inputStyle === "structure-diagram" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
            
            // Get structure diagram shapes (excluding base items)
            const shapes = items
              .filter(i => i.type === "struct-process" || i.type === "struct-decision" || i.type === "struct-loop")
              .sort((a, b) => {
                if (Math.abs(a.y - b.y) > 30) return a.y - b.y;
                return a.x - b.x;
              });
            
            // Get connection lines
            const lines = items.filter(i => i.type === "line");
            
            // Get text labels
            const textLabels = items.filter(i => i.type === "text");
            
            // Build shape descriptions
            const shapeDescs = shapes.map(s => {
              const typeLabel = s.type === "struct-process" ? "PROCESS" : 
                               s.type === "struct-decision" ? "DECISION" : "LOOP";
              const name = s.content || "unnamed";
              return `[${typeLabel}: "${name}"]`;
            });
            
            // Build connection descriptions
            const connectionDescs = lines.map(line => {
              const fromShape = shapes.find(s => s.id === line.connectedTo1);
              const toShape = shapes.find(s => s.id === line.connectedTo2);
              const fromName = fromShape?.content || "unknown";
              const toName = toShape?.content || "unknown";
              const fromType = fromShape?.type?.replace("struct-", "").toUpperCase() || "?";
              const toType = toShape?.type?.replace("struct-", "").toUpperCase() || "?";
              return `[FLOW: "${fromName}" (${fromType}) -> "${toName}" (${toType})]`;
            });
            
            // Build text label descriptions
            const labelDescs = textLabels.map(t => `[LABEL: "${t.content || ""}"]`);
            
            const shapesDesc = shapeDescs.length > 0 
              ? `Structure Elements: ${shapeDescs.join(", ")}` 
              : "No structure elements drawn";
            const flowDesc = connectionDescs.length > 0 
              ? `Flow Connections: ${connectionDescs.join(", ")}` 
              : "No flow connections";
            const labelsDesc = labelDescs.length > 0 
              ? `Labels: ${labelDescs.join(", ")}` 
              : "";
            
            return `STRUCTURE DIAGRAM:\n${shapesDesc}\n${flowDesc}${labelsDesc ? "\n" + labelsDesc : ""}`;
          } catch (e) {
            return "";
          }
        }

        // Handle entity-occurrence-diagram - describe entities, occurrences (inside entities), and connections
        if (sub.inputStyle === "entity-occurrence-diagram" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
            
            // Get entities (tall ovals) - occurrences are now inside entities as array
            const entities = items
              .filter(i => i.type === "entity-oval")
              .sort((a, b) => a.x - b.x);
            
            // Get linked titles for entities
            const linkedTitles = items.filter(i => i.type === "text" && i.parentEntityId);
            
            // Get connection lines
            const lines = items.filter(i => i.type === "line");
            
            // Build entity descriptions with their occurrences
            const entityDescs = entities.map(entity => {
              const linkedTitle = linkedTitles.find(t => t.parentEntityId === entity.id);
              const entityName = linkedTitle?.content || entity.content || "unnamed";
              const occurrences = entity.occurrences || [];
              const occText = occurrences.map(o => o.text).join(", ");
              return `[ENTITY: "${entityName}" with occurrences: ${occText || "none"}]`;
            });
            
            // Build flat list of all occurrences for connection lookups
            const allOccurrences: { entityId: string; entityName: string; text: string; occId: string }[] = [];
            entities.forEach(entity => {
              const linkedTitle = linkedTitles.find(t => t.parentEntityId === entity.id);
              const entityName = linkedTitle?.content || entity.content || "unnamed";
              (entity.occurrences || []).forEach((occ) => {
                allOccurrences.push({ entityId: entity.id, entityName, text: occ.text, occId: occ.id });
              });
            });
            
            // Build connection descriptions (connections go between occurrence anchor points)
            const connectionDescs = lines.map(line => {
              // connectedTo1/2 format for occurrences: "entityId-occ-occurrenceId"
              const parseOccRef = (ref?: string) => {
                if (!ref) return null;
                const match = ref.match(/^(.+)-occ-(.+)$/);
                if (match) {
                  const entityId = match[1];
                  const occId = match[2];
                  const occ = allOccurrences.find(o => o.entityId === entityId && o.occId === occId);
                  return occ ? `${occ.entityName}:${occ.text}` : null;
                }
                return null;
              };
              const from = parseOccRef(line.connectedTo1) || "unknown";
              const to = parseOccRef(line.connectedTo2) || "unknown";
              return `[CONNECTION: "${from}" <-> "${to}"]`;
            });
            
            const entitiesStr = entityDescs.length > 0 
              ? `Entities: ${entityDescs.join(", ")}` 
              : "No entities drawn";
            const connectionsStr = connectionDescs.length > 0 
              ? `Connections: ${connectionDescs.join(", ")}` 
              : "No connections drawn";
            
            return `ENTITY-OCCURRENCE DIAGRAM:\n${entitiesStr}\n${connectionsStr}`;
          } catch (e) {
            return "";
          }
        }
        
        // Handle form-wireframe - describe form elements drawn by student
        if (sub.inputStyle === "form-wireframe" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
            
            // Sort items by position (top to bottom, left to right)
            const sortedItems = items.sort((a, b) => {
              if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
              return a.x - b.x;
            });
            
            const formElements: string[] = [];
            
            // Track labels to associate with nearby input elements
            const labels = sortedItems.filter(i => i.type === "ui-label" || i.type === "text");
            
            // Helper to check if a label indicates required field (contains *)
            const isRequiredLabel = (labelContent: string | undefined): boolean => {
              return labelContent?.includes("*") || false;
            };
            
            const findNearestLabel = (element: DiagramItem) => {
              let nearest: DiagramItem | null = null;
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
                  const labelContent = item.content || 'unnamed';
                  const requiredMarker = isRequiredLabel(labelContent) ? " (REQUIRED - has *)" : "";
                  formElements.push(`[LABEL: "${labelContent}"${requiredMarker}]`);
                  break;
                case "ui-input":
                  const inputLabel = findNearestLabel(item);
                  const inputRequired = inputLabel && isRequiredLabel(inputLabel.content) ? " REQUIRED" : "";
                  const inputLabelStr = inputLabel ? ` for "${inputLabel.content || 'unlabeled'}"` : "";
                  const inputValidationText = item.content || item.validationMessage || 
                    ((item.validationMin !== undefined || item.validationMax !== undefined) ? `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}` : "");
                  const inputContent = inputValidationText ? ` with validation "${inputValidationText}"` : "";
                  formElements.push(`[TEXT INPUT${inputLabelStr}${inputRequired}${inputContent}]`);
                  break;
                case "ui-textarea":
                  const textareaLabel = findNearestLabel(item);
                  const textareaRequired = textareaLabel && isRequiredLabel(textareaLabel.content) ? " REQUIRED" : "";
                  const textareaLabelStr = textareaLabel ? ` for "${textareaLabel.content || 'unlabeled'}"` : "";
                  const textareaValidationText = item.content || item.validationMessage || 
                    ((item.validationMin !== undefined || item.validationMax !== undefined) ? `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}` : "");
                  const textareaContent = textareaValidationText ? ` with validation "${textareaValidationText}"` : "";
                  formElements.push(`[TEXTAREA${textareaLabelStr}${textareaRequired}${textareaContent}]`);
                  break;
                case "ui-dropdown":
                  const dropdownLabel = findNearestLabel(item);
                  const dropdownRequired = dropdownLabel && isRequiredLabel(dropdownLabel.content) ? " REQUIRED" : "";
                  const dropdownLabelStr = dropdownLabel ? ` for "${dropdownLabel.content || 'unlabeled'}"` : "";
                  const dropdownOptionText = item.content ? ` showing "${item.content}"` : "";
                  const dropdownLegacyVal = item.validationMessage || 
                    ((item.validationMin !== undefined || item.validationMax !== undefined) ? `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}` : "");
                  const dropdownValidation = dropdownLegacyVal ? ` with validation "${dropdownLegacyVal}"` : "";
                  formElements.push(`[DROPDOWN${dropdownLabelStr}${dropdownRequired}${dropdownOptionText}${dropdownValidation}]`);
                  break;
                case "ui-radio":
                  formElements.push(`[RADIO BUTTON: "${item.content || 'option'}"]`);
                  break;
                case "ui-checkbox":
                  formElements.push(`[CHECKBOX: "${item.content || 'option'}"]`);
                  break;
                case "ui-submit":
                  formElements.push(`[SUBMIT BUTTON: "${item.content || 'Submit'}"]`);
                  break;
              }
            }
            
            const result = `FORM ELEMENTS (in order from top to bottom, note: * in a label indicates a REQUIRED field):\n${formElements.join("\n")}`;
            return result;
          } catch (e) {
            return "";
          }
        }

        if (sub.inputStyle === "webpage-wireframe" && inputs["drawing"]) {
          try {
            const items = JSON.parse(inputs["drawing"]) as DiagramItem[];
            const sortedItems = items.sort((a, b) => {
              if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
              return a.x - b.x;
            });
            const pageElements: string[] = [];
            for (const item of sortedItems) {
              switch (item.type) {
                case "wf-heading":
                  pageElements.push(`[HEADING: "${item.content || 'untitled'}"]`);
                  break;
                case "wf-paragraph":
                  pageElements.push(`[PARAGRAPH]`);
                  break;
                case "ui-image":
                  pageElements.push(`[IMAGE: "${item.content || 'image'}"]`);
                  break;
                case "link-text":
                  pageElements.push(`[LINK: "${item.content || 'link'}"]`);
                  break;
                case "bullet-text":
                  pageElements.push(`[BULLET LIST: "${item.content || 'list'}"]`);
                  break;
                case "numbered-text":
                  pageElements.push(`[NUMBERED LIST: "${item.content || 'list'}"]`);
                  break;
                case "wf-audio":
                  pageElements.push(`[AUDIO PLAYER: "${item.content || 'audio'}"]`);
                  break;
                case "wf-video":
                  pageElements.push(`[VIDEO PLAYER: "${item.content || 'video'}"]`);
                  break;
                case "text":
                  pageElements.push(`[TEXT: "${item.content || ''}"]`);
                  break;
              }
            }
            return `WEBPAGE ELEMENTS (in order from top to bottom):\n${pageElements.join("\n")}`;
          } catch (e) {
            return "";
          }
        }
        
        // Handle table inputs - include the row labels with answers
        if (sub.inputStyle === "table" && sub.inputConfig) {
          // Flexible grid table
          if (sub.inputConfig.grid) {
            const grid = sub.inputConfig.grid;
            const gridAnswers: string[] = [];
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
          
          // Column-based table (e.g., input/process/output)
          if (sub.inputConfig.columns) {
            const numRows = sub.inputConfig.inputRows || 1;
            const columnAnswers: string[] = [];
            for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
              const rowAnswers = sub.inputConfig.columns.map(col => {
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
          
          // Row-based table
          if (sub.inputConfig.rows) {
            const tableAnswers = sub.inputConfig.rows
              .filter(row => row.isInput && row.key)
              .map(row => `${row.label}: ${inputs[row.key!] || "(no answer)"}`)
              .join("\n");
            return tableAnswers;
          }
        }
        
        // Handle labeled inputs - include field labels with answers
        if (sub.inputStyle === "labeled-inputs" && sub.inputConfig?.fields) {
          const fieldAnswers = sub.inputConfig.fields
            .map(field => `${field.label}: ${inputs[field.key] || "(no answer)"}`)
            .join("\n");
          return fieldAnswers;
        }
        
        // Handle ERD annotation - describe student's full work
        if (sub.inputStyle === "erd-annotation") {
          if (inputs["diagram_image"]) {
            return "Student submitted a diagram image (see attached image for visual grading).";
          }
          const config = sub.inputConfig;
          const descriptions: string[] = [];
          
          // Parse student's diagram
          let studentItems: DiagramItem[] = [];
          if (inputs["erd_diagram"]) {
            try {
              studentItems = JSON.parse(inputs["erd_diagram"]) as DiagramItem[];
            } catch (e) {
              console.error("Failed to parse student ERD diagram", e);
            }
          }
          
          // Include teacher's correct ERD diagram as grading reference
          if (config?.correctErdDiagram) {
            try {
              const correctItems: DiagramItem[] = JSON.parse(config.correctErdDiagram);
              const correctDescriptions: string[] = [];
              
              // Describe correct PK/FK markings
              const markedItems = correctItems.filter(item => 
                item.marking === "primary" || item.marking === "foreign"
              );
              if (markedItems.length > 0) {
                correctDescriptions.push("Correct key markings:");
                for (const item of markedItems) {
                  const markingLabel = item.marking === "primary" ? "Primary Key (PK - underlined)" : "Foreign Key (FK - asterisk)";
                  correctDescriptions.push(`  - "${item.content || item.entityName || 'unnamed'}": ${markingLabel}`);
                }
              }
              
              // Describe correct ERD entity markings
              const correctEntities = correctItems.filter(item => item.type === "erd-entity");
              for (const entity of correctEntities) {
                if (entity.attributes && entity.attributes.length > 0) {
                  const markedAttrs = entity.attributes.filter(attr => attr.marking === "primary" || attr.marking === "foreign");
                  if (markedAttrs.length > 0) {
                    correctDescriptions.push(`Entity "${entity.entityName || 'unnamed'}" correct markings:`);
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
          
          // Describe PK/FK markings on existing attributes (legacy shapes)
          if (config?.erdAttributes) {
            descriptions.push("Attribute Markings:");
            for (const attr of config.erdAttributes) {
              const studentItem = studentItems.find(item => item.id === attr.id);
              const marking = studentItem?.marking || "none";
              const markingLabel = marking === "primary" ? "Primary Key (PK)" : marking === "foreign" ? "Foreign Key (FK)" : "None";
              descriptions.push(`  ${attr.entityName}.${attr.attributeName}: ${markingLabel}`);
            }
          }
          
          // Describe ERD Entity items (new entity boxes with attributes)
          const erdEntities = studentItems.filter(item => item.type === "erd-entity");
          if (erdEntities.length > 0) {
            descriptions.push("ERD Entities:");
            for (const entity of erdEntities) {
              const entityName = entity.entityName || "Unnamed Entity";
              const isStudentAdded = !entity.isBaseItem;
              descriptions.push(`  Entity: ${entityName}${isStudentAdded ? " (student added)" : ""}`);
              if (entity.attributes && entity.attributes.length > 0) {
                for (const attr of entity.attributes) {
                  const markingLabel = attr.marking === "primary" ? " [PK - underlined]" : 
                                      attr.marking === "foreign" ? " [FK - asterisk]" : "";
                  descriptions.push(`    - ${attr.name || "unnamed"}${markingLabel}`);
                }
              }
            }
          }
          
          // Describe added attributes (non-base items - legacy ellipse/text)
          const addedAttrs = studentItems.filter(item => 
            (item.type === "ellipse" || item.type === "text") && 
            !item.isBaseItem && 
            item.content
          );
          if (addedAttrs.length > 0) {
            descriptions.push("Added Attributes (shapes):");
            for (const attr of addedAttrs) {
              descriptions.push(`  ${attr.content}`);
            }
          }
          
          // Helper to get entity name from an item ID
          const getEntityName = (itemId: string | undefined): string => {
            if (!itemId) return "unknown";
            const item = studentItems.find(i => i.id === itemId);
            if (!item) return "unknown";
            if (item.type === "erd-entity") return item.entityName || "unnamed entity";
            if (item.type === "box" || item.type === "cylinder") return item.content || "unnamed";
            return "unknown";
          };

          // Describe added lines with labels
          const addedLines = studentItems.filter(item => 
            item.type === "line" && !item.isBaseItem
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
          
          // Describe added crowfoot lines with labels and direction
          const addedCrowfoots = studentItems.filter(item => 
            item.type === "crowfoot" && !item.isBaseItem
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
        return Object.entries(inputs)
          .filter(([key]) => key !== "diagram_image")
          .map(([, val]) => val)
          .join("\n");
      };

      // Flatten all sub-questions including nested subParts
      const allSubQuestions: SubQuestion[] = [];
      currentQuestion.subQuestions.forEach(sub => {
        allSubQuestions.push(sub);
        if (sub.subParts && sub.subParts.length > 0) {
          allSubQuestions.push(...sub.subParts);
        }
      });

      // Grade all sub-questions in parallel (including nested subParts)
      const gradingPromises = allSubQuestions
        .filter(sub => sub.maxMarks > 0)
        .map(async (sub) => {
          const inputs = userInputs[sub.id] || {};
          const studentAnswer = prepareStudentAnswer(sub, inputs);
          
          totalMaxMarks += sub.maxMarks;

          if (!studentAnswer.trim()) {
            return { subId: sub.id, marks: 0, feedback: null };
          }

          try {
            // Helper to convert content blocks to text (including data tables for AI grading)
            const contentBlocksToText = (blocks: ContentBlock[] | undefined): string => {
              if (!blocks || blocks.length === 0) return "";
              return blocks.map(b => {
                if (b.type === "text") return b.content || "";
                if (b.type === "code") return "```\n" + (b.content || "") + "\n```";
                if (b.type === "data-table" && b.dataTable) {
                  const table = b.dataTable;
                  const escapeCell = (s: string) => String(s || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
                  // Helper to extract cell value - cells can be strings or objects with { value: string }
                  const getCellValue = (cell: any): string => {
                    if (typeof cell === "string") return cell;
                    if (cell && typeof cell === "object" && "value" in cell) return cell.value || "";
                    return String(cell || "");
                  };
                  const headers = table.columns.map(c => escapeCell(c.header));
                  const headerRow = "| " + headers.join(" | ") + " |";
                  const separator = "| " + headers.map(() => "---").join(" | ") + " |";
                  const dataRows = table.rows.map(r => 
                    "| " + r.cells.map(cell => escapeCell(getCellValue(cell))).join(" | ") + " |"
                  ).join("\n");
                  return `**Table: ${table.tableName}**\n${headerRow}\n${separator}\n${dataRows}`;
                }
                if (b.type === "code-table" && b.codeSections) {
                  return b.codeSections.map(s => `**${s.label}:**\n\`\`\`\n${s.code}\n\`\`\``).join("\n\n");
                }
                return "";
              }).filter(Boolean).join("\n\n");
            };
            
            // Build comprehensive question context including scenario, content blocks, and question text
            const scenarioText = contentBlocksToText(currentQuestion.scenario?.contentBlocks) 
              || currentQuestion.scenario?.text || "";
            
            const questionContent = contentBlocksToText(sub.contentBlocks) 
              || sub.questionText || "";
            
            // Build context from ALL other sub-questions in this question (siblings, subParts, everything)
            // This allows e.g. 6c to reference answers from 6b(i) and 6b(ii)
            const otherSubQuestions = allSubQuestions
              .filter(other => other.id !== sub.id && other.maxMarks > 0);
            const siblingContext = otherSubQuestions
              .map(other => {
                const otherInputs = userInputs[other.id] || {};
                const otherAnswer = prepareStudentAnswer(other, otherInputs);
                const otherQuestion = contentBlocksToText(other.contentBlocks) || other.questionText || "";
                return `Part ${other.label || "?"}: ${otherQuestion}\nStudent's answer: ${otherAnswer || "(no answer)"}`;
              })
              .join("\n\n");
            
            // Build form wireframe expectations context if applicable
            const formExpectationsContext = sub.inputStyle === "form-wireframe" && sub.inputConfig?.formWireframeExpectations?.length
              ? `\nEXPECTED FORM ELEMENTS (teacher-defined - grade based on these):\n${sub.inputConfig.formWireframeExpectations.map((exp, i) => {
                  let desc = `${i + 1}. ${exp.fieldType.toUpperCase()}`;
                  if (exp.labelText) desc += ` with label "${exp.labelText}"`;
                  if (exp.required) desc += " (REQUIRED - must have *)";
                  if (exp.options?.length) desc += ` with options: ${exp.options.join(", ")}`;
                  const valText = exp.validationMessage || 
                    ((exp.validationMin !== undefined || exp.validationMax !== undefined) ? `${exp.validationMin ?? "?"}-${exp.validationMax ?? "?"}` : "");
                  if (valText) desc += ` VALIDATION: "${valText}"`;
                  return desc;
                }).join("\n")}`
              : "";
            
            let wireframeExampleContext = "";
            if ((sub.inputStyle === "webpage-wireframe" || sub.inputStyle === "form-wireframe") && sub.inputConfig?.wireframeExampleData) {
              try {
                const exampleItems = JSON.parse(sub.inputConfig.wireframeExampleData) as DiagramItem[];
                const sorted = exampleItems.sort((a, b) => {
                  if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
                  return a.x - b.x;
                });
                const descriptions: string[] = [];
                for (const item of sorted) {
                  switch (item.type) {
                    case "wf-heading": descriptions.push(`[HEADING: "${item.content || ''}"]`); break;
                    case "wf-paragraph": descriptions.push(`[PARAGRAPH]`); break;
                    case "wf-audio": descriptions.push(`[AUDIO PLAYER: "${item.content || ''}"]`); break;
                    case "wf-video": descriptions.push(`[VIDEO PLAYER: "${item.content || ''}"]`); break;
                    case "ui-image": descriptions.push(`[IMAGE: "${item.content || ''}"]`); break;
                    case "link-text": descriptions.push(`[LINK: "${item.content || ''}"]`); break;
                    case "bullet-text": descriptions.push(`[BULLET LIST: "${item.content || ''}"]`); break;
                    case "numbered-text": descriptions.push(`[NUMBERED LIST: "${item.content || ''}"]`); break;
                    case "ui-label": case "text": descriptions.push(`[LABEL: "${item.content || ''}"]`); break;
                    case "ui-input": descriptions.push(`[TEXT INPUT: "${item.content || ''}"]`); break;
                    case "ui-textarea": descriptions.push(`[TEXTAREA: "${item.content || ''}"]`); break;
                    case "ui-dropdown": descriptions.push(`[DROPDOWN: "${item.content || ''}"]`); break;
                    case "ui-radio": descriptions.push(`[RADIO: "${item.content || ''}"]`); break;
                    case "ui-checkbox": descriptions.push(`[CHECKBOX: "${item.content || ''}"]`); break;
                    case "ui-submit": descriptions.push(`[SUBMIT BUTTON: "${item.content || ''}"]`); break;
                    default: if (item.content) descriptions.push(`[${item.type.toUpperCase()}: "${item.content}"]`);
                  }
                }
                if (descriptions.length > 0) {
                  wireframeExampleContext = `\nTEACHER'S EXAMPLE (expected answer - compare student's wireframe against this):\n${descriptions.join("\n")}`;
                }
              } catch (e) {}
            }

            // Build nav-structure (N5) example answer context if applicable
            const navExampleContext = sub.inputStyle === "nav-structure" && sub.inputConfig?.navExampleData
              ? (() => {
                  try {
                    const items = JSON.parse(sub.inputConfig.navExampleData!) as DiagramItem[];
                    const pages = items
                      .filter(i => i.type === "nav-page" || i.type === "box")
                      .sort((a, b) => {
                        if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
                        return a.x - b.x;
                      });
                    const lines = items.filter(i => i.type === "line");
                    const pageDescs = pages.map(p => `"${p.content || "unnamed"}"`);
                    const connections = lines.map(line => {
                      const from = pages.find(p => p.id === line.connectedTo1);
                      const to = pages.find(p => p.id === line.connectedTo2);
                      const arrowDesc = line.arrowEnd === "both" ? "<->" : "->";
                      return `"${from?.content || "?"}" ${arrowDesc} "${to?.content || "?"}"`;
                    });
                    return `\nEXPECTED NAVIGATION STRUCTURE (teacher-defined example answer - compare student answer to this):\nExpected Pages: ${pageDescs.join(", ")}\nExpected Links: ${connections.join(", ") || "none"}`;
                  } catch (e) {
                    return "";
                  }
                })()
              : "";

            // Build nav-structure-higher solution context if applicable
            const navSolutionContext = sub.inputStyle === "nav-structure-higher" && sub.inputConfig?.solutionNavDiagram
              ? (() => {
                  try {
                    const items = JSON.parse(sub.inputConfig.solutionNavDiagram) as DiagramItem[];
                    const pages = items
                      .filter(i => i.type === "nav-page" || i.type === "box")
                      .sort((a, b) => {
                        if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
                        return a.x - b.x;
                      });
                    const navAreas = items.filter(i => i.type === "nav-highlight");
                    const pagesInNavBar = pages.filter(page => {
                      const pageCenterX = page.x + (page.width || 120) / 2;
                      const pageCenterY = page.y + (page.height || 50) / 2;
                      return navAreas.some(area => 
                        pageCenterX >= area.x && 
                        pageCenterX <= area.x + (area.width || 400) &&
                        pageCenterY >= area.y && 
                        pageCenterY <= area.y + (area.height || 150)
                      );
                    });
                    const lines = items.filter(i => i.type === "line");
                    const pageDescs = pages.map(p => {
                      const isInNav = pagesInNavBar.some(nav => nav.id === p.id);
                      const name = p.content || "unnamed";
                      return `"${name}"${isInNav ? " (IN NAV BAR)" : ""}`;
                    });
                    const hierarchyConns = lines.map(line => {
                      const parentPage = pages.find(p => p.id === line.connectedTo1);
                      const childPage = pages.find(p => p.id === line.connectedTo2);
                      return `"${parentPage?.content || "?"}" -> "${childPage?.content || "?"}"`;
                    });
                    return `\nEXPECTED SOLUTION (teacher-defined - compare student answer to this):\nExpected Pages: ${pageDescs.join(", ")}\nExpected in Nav Bar: ${pagesInNavBar.map(p => `"${p.content || "unnamed"}"`).join(", ") || "none"}\nExpected Hierarchy: ${hierarchyConns.join(", ") || "none"}`;
                  } catch (e) {
                    return "";
                  }
                })()
              : "";
            
            // Build entity-occurrence-diagram solution context if applicable
            const entityOccurrenceSolutionContext = sub.inputStyle === "entity-occurrence-diagram" && sub.inputConfig?.solutionEntityOccurrenceDiagram
              ? (() => {
                  try {
                    const items = JSON.parse(sub.inputConfig.solutionEntityOccurrenceDiagram) as DiagramItem[];
                    const entities = items.filter(i => i.type === "entity-oval");
                    const linkedTitles = items.filter(i => i.type === "text" && i.parentEntityId);
                    const lines = items.filter(i => i.type === "line");
                    
                    // Build entity descriptions with occurrences inside them
                    const entityDescs = entities.map(e => {
                      const linkedTitle = linkedTitles.find(t => t.parentEntityId === e.id);
                      const entityName = linkedTitle?.content || e.content || "unnamed";
                      const occs = e.occurrences || [];
                      const occText = occs.map(o => o.text).join(", ");
                      return `Entity: "${entityName}" [occurrences: ${occText || "none"}]`;
                    });
                    
                    // Build flat list of occurrences for connection lookups
                    const allOccs: { entityId: string; entityName: string; text: string; occId: string }[] = [];
                    entities.forEach(e => {
                      const linkedTitle = linkedTitles.find(t => t.parentEntityId === e.id);
                      const entityName = linkedTitle?.content || e.content || "unnamed";
                      (e.occurrences || []).forEach((occ) => {
                        allOccs.push({ entityId: e.id, entityName, text: occ.text, occId: occ.id });
                      });
                    });
                    
                    const connections = lines.map(line => {
                      const parseOccRef = (ref?: string) => {
                        if (!ref) return null;
                        const match = ref.match(/^(.+)-occ-(.+)$/);
                        if (match) {
                          const entityId = match[1];
                          const occId = match[2];
                          const occ = allOccs.find(o => o.entityId === entityId && o.occId === occId);
                          return occ ? `${occ.entityName}:${occ.text}` : null;
                        }
                        return null;
                      };
                      const from = parseOccRef(line.connectedTo1) || "?";
                      const to = parseOccRef(line.connectedTo2) || "?";
                      return `"${from}" -> "${to}"`;
                    });
                    return `\nEXPECTED SOLUTION (teacher-defined entity-occurrence diagram - compare student answer to this):\nExpected Entities: ${entityDescs.join(", ")}\nExpected Connections: ${connections.join(", ") || "none"}`;
                  } catch (e) {
                    return "";
                  }
                })()
              : "";

            // Build structure-diagram solution context if applicable
            const structureSolutionContext = sub.inputStyle === "structure-diagram" && sub.inputConfig?.solutionStructureDiagram
              ? (() => {
                  try {
                    const items = JSON.parse(sub.inputConfig.solutionStructureDiagram) as DiagramItem[];
                    const shapes = items
                      .filter(i => i.type === "struct-process" || i.type === "struct-decision" || i.type === "struct-loop")
                      .sort((a, b) => {
                        if (Math.abs(a.y - b.y) > 30) return a.y - b.y;
                        return a.x - b.x;
                      });
                    const lines = items.filter(i => i.type === "line");
                    const shapeDescs = shapes.map(s => {
                      const typeLabel = s.type === "struct-process" ? "Process" : 
                                       s.type === "struct-decision" ? "Decision" : "Loop";
                      return `${typeLabel}: "${s.content || "unnamed"}"`;
                    });
                    const connections = lines.map(line => {
                      const from = shapes.find(s => s.id === line.connectedTo1);
                      const to = shapes.find(s => s.id === line.connectedTo2);
                      return `"${from?.content || "?"}" -> "${to?.content || "?"}"`;
                    });
                    return `\nEXPECTED SOLUTION (teacher-defined structure diagram - compare student answer to this):\nExpected Structure Elements: ${shapeDescs.join(", ")}\nExpected Flow Connections: ${connections.join(", ") || "none"}`;
                  } catch (e) {
                    return "";
                  }
                })()
              : "";
            
            // Build database schema context if applicable
            const databaseSchemaContext = sub.inputConfig?.databaseSchema?.tables?.length
              ? (() => {
                  const schema = sub.inputConfig.databaseSchema;
                  const tableDescs = schema.tables.map(t => {
                    const fieldDescs = t.fields.map(f => {
                      let desc = f.name;
                      if (f.isPrimaryKey) desc = `${desc} (PK)`;
                      if (f.isForeignKey) desc = `${desc} (FK)`;
                      return desc;
                    });
                    return `Table "${t.name}": ${fieldDescs.join(", ")}`;
                  });
                  return `\nDATABASE SCHEMA (for context - question relates to this database structure):\n${tableDescs.join("\n")}`;
                })()
              : "";
            
            const fullContext = [
              `Question: ${currentQuestion.title}${sub.label ? ` Part ${sub.label}` : ""}`,
              scenarioText ? `Scenario: ${scenarioText}` : "",
              `Question Text: ${questionContent}`,
              `Maximum Marks: ${sub.maxMarks}`,
              `Marking Scheme:\n${sub.markingScheme.map((m, i) => `  ${i + 1}. ${m}`).join("\n")}`,
              sub.aiGuidance ? `Teacher Guidance: ${sub.aiGuidance}` : "",
              formExpectationsContext,
              wireframeExampleContext,
              navExampleContext,
              navSolutionContext,
              structureSolutionContext,
              entityOccurrenceSolutionContext,
              databaseSchemaContext,
              siblingContext ? `\nOTHER PARTS OF THIS QUESTION (for context - grade ONLY the current part):\n${siblingContext}` : ""
            ].filter(Boolean).join("\n\n");

            const diagramInputStyles = ["drawing", "structure-dataflow", "erd-annotation", "form-wireframe", "webpage-wireframe", "nav-structure", "nav-structure-higher", "design-choice", "structure-diagram", "entity-occurrence-diagram"];
            const isDiagram = diagramInputStyles.includes(sub.inputStyle || "");
            const studentDiagramImage = isDiagram ? (inputs["diagram_image"] || "") : "";

            const response = await fetch("/api/grade-answer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                studentAnswer: studentAnswer.trim(),
                markingScheme: sub.markingScheme,
                maxMarks: sub.maxMarks,
                questionContext: fullContext,
                aiGuidance: sub.aiGuidance,
                studentDiagramImage: studentDiagramImage || undefined
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
          } catch (error: any) {
            const marks = calculateMarks(inputs, sub);
            return { subId: sub.id, marks, feedback: null };
          }
        });

      // Wait for all grading to complete in parallel
      const results = await Promise.all(gradingPromises);
      
      // Process results
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
          colors: ['#dc2626', '#000000', '#ffffff']
        });
      }
    } catch (error) {
      console.error("Grading error:", error);
      // Fallback to basic keyword matching if AI fails (including subParts)
      const allSubs: SubQuestion[] = [];
      currentQuestion.subQuestions.forEach(sub => {
        allSubs.push(sub);
        if (sub.subParts && sub.subParts.length > 0) {
          allSubs.push(...sub.subParts);
        }
      });
      allSubs.forEach(sub => {
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

  const handleSelectQuestion = (id: string) => {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, subId: string) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
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

  const getRequirementBadge = (req?: "programming-language" | "design-notation" | "either") => {
    if (req === "programming-language") {
      return (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900/50 w-fit mb-2">
          <Code2 className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Must Use: Programming Language</span>
        </div>
      );
    }
    if (req === "design-notation") {
      return (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900/50 w-fit mb-2">
          <FileEdit className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Must Use: Design Notation</span>
        </div>
      );
    }
    return null;
  };

  const renderInputArea = (subQ: SubQuestion) => {
    // If maxMarks is 0, it's just informational text, no input needed
    if (subQ.maxMarks === 0) return null;

    const currentInput = userInputs[subQ.id] || {};

    if (subQ.inputStyle === "code-editor") {
      const isProgrammingOnly = subQ.codeRequirement === "programming-language";
      const starterCode = subQ.inputConfig?.starterCode || "";
      const placeholderText = isProgrammingOnly 
        ? "// Write your code here (Pseudocode is NOT allowed)..." 
        : "// Write your code or design notation here...";
      
      // Initialize with starter code if not already set
      const currentValue = currentInput["main"];
      const displayValue = currentValue !== undefined ? currentValue : starterCode;

      return (
        <div className="space-y-2 mt-4">
          {getRequirementBadge(subQ.codeRequirement)}
          {starterCode && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-md border border-blue-100 dark:border-blue-900/50 w-fit">
              <Code2 className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Complete the Code</span>
            </div>
          )}
          <div className="relative">
            <Textarea 
              placeholder={placeholderText}
              className="min-h-[200px] text-base font-mono p-4 resize-y bg-neutral-900 text-neutral-100 border-neutral-800 focus:border-red-500 transition-all selection:bg-red-500/30"
              value={displayValue}
              onChange={(e) => handleInputChange(subQ.id, "main", e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, subQ.id)}
              disabled={showResults}
              spellCheck={false}
            />
            <div className="absolute bottom-3 right-3 text-xs text-neutral-500">
              Tab to indent
            </div>
          </div>
        </div>
      );
    }

    if (subQ.inputStyle === "table" && subQ.inputConfig) {
      // Flexible grid table (full control over each cell)
      if (subQ.inputConfig.grid) {
        const grid = subQ.inputConfig.grid;
        return (
          <div className="inline-block border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4">
            <table className="text-left text-sm" style={{ width: 'auto', tableLayout: 'auto' }}>
              <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                <tr>
                  {grid.headers.map((header, i) => (
                    <th key={i} className="px-4 py-3 font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {grid.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="bg-white dark:bg-neutral-900">
                    {row.cells.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3" style={{ verticalAlign: cell.multiline ? 'top' : undefined }}>
                        {cell.isInput ? (
                          cell.multiline ? (
                            <Textarea
                              placeholder={cell.placeholder || "Enter answer..."}
                              value={currentInput[cell.key || `cell_${rowIdx}_${cellIdx}`] || ""}
                              onChange={(e) => handleInputChange(subQ.id, cell.key || `cell_${rowIdx}_${cellIdx}`, e.target.value)}
                              disabled={showResults}
                              className="min-h-[100px] bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm resize-y"
                              style={cell.width && cell.width !== "auto" ? { width: cell.width } : undefined}
                            />
                          ) : (
                            <Input
                              placeholder={cell.placeholder || "Enter answer..."}
                              value={currentInput[cell.key || `cell_${rowIdx}_${cellIdx}`] || ""}
                              onChange={(e) => handleInputChange(subQ.id, cell.key || `cell_${rowIdx}_${cellIdx}`, e.target.value)}
                              disabled={showResults}
                              className="bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm"
                              style={cell.width && cell.width !== "auto" ? { width: cell.width } : undefined}
                            />
                          )
                        ) : (
                          <span className="text-neutral-700 dark:text-neutral-300">{cell.value || ""}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      
      // Column-based table (e.g., input/process/output with inputs below headers)
      if (subQ.inputConfig.columns) {
        const numRows = subQ.inputConfig.inputRows || 1;
        return (
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                <tr>
                  {subQ.inputConfig.columns.map((col, i) => (
                    <th key={i} className="px-4 py-3 font-medium" style={col.width ? { width: col.width } : undefined}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {Array.from({ length: numRows }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="bg-white dark:bg-neutral-900">
                    {subQ.inputConfig!.columns!.map((col, colIdx) => {
                      const key = numRows > 1 ? `${col.key}_${rowIdx + 1}` : col.key;
                      return (
                        <td key={colIdx} className="px-4 py-3">
                          <Textarea
                            placeholder={col.placeholder || `Enter ${col.header.toLowerCase()}...`}
                            value={currentInput[key] || ""}
                            onChange={(e) => handleInputChange(subQ.id, key, e.target.value)}
                            disabled={showResults}
                            className="min-h-[80px] bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm resize-none"
                            style={col.width && col.width !== "auto" ? { width: col.width } : undefined}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      
      // Row-based table (original format with label in first column)
      return (
        <div className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4">
          {subQ.inputConfig.headers && subQ.inputConfig.headers.length > 0 && (
            <div className="flex w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
              {subQ.inputConfig.headers.map((header, i) => (
                <div key={i} className={cn("px-4 py-3 font-medium", i === 0 ? "shrink-0 whitespace-nowrap" : "flex-1 min-w-0")}>{header}</div>
              ))}
            </div>
          )}
          <div className="grid w-full" style={{ gridTemplateColumns: 'max-content 1fr' }}>
            {subQ.inputConfig.rows?.map((row, i) => (
              <>
                <div key={`label-${i}`} className="px-4 py-3 font-medium text-neutral-900 dark:text-white whitespace-nowrap bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 flex items-center">{row.label}</div>
                <div key={`input-${i}`} className="px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
                  {row.isInput ? (
                    row.multiline ? (
                      <Textarea
                        placeholder={row.placeholder || "Enter value..."}
                        value={currentInput[row.key || `row-${i}`] || ""}
                        onChange={(e) => handleInputChange(subQ.id, row.key || `row-${i}`, e.target.value)}
                        disabled={showResults}
                        className="w-full min-h-[100px] bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm resize-y"
                      />
                    ) : (
                      <Input 
                        placeholder={row.placeholder || "Enter value..."}
                        value={currentInput[row.key || `row-${i}`] || ""}
                        onChange={(e) => handleInputChange(subQ.id, row.key || `row-${i}`, e.target.value)}
                        disabled={showResults}
                        className="w-full bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm"
                      />
                    )
                  ) : (
                    <span className="text-neutral-500">{row.value}</span>
                  )}
                </div>
              </>
            ))}
          </div>
        </div>
      );
    }

    if (subQ.inputStyle === "labeled-inputs" && subQ.inputConfig) {
      return (
        <div className="space-y-3 mt-4 w-full">
          {subQ.inputConfig.fields?.map((field, i) => (
            <div key={i} className="flex w-full items-center gap-4">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 shrink-0 whitespace-nowrap">
                {field.label}
              </label>
              <Input 
                value={currentInput[field.key] || ""}
                onChange={(e) => handleInputChange(subQ.id, field.key, e.target.value)}
                disabled={showResults}
                className="flex-1 min-w-0 bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm"
              />
            </div>
          ))}
        </div>
      );
    }

    if (subQ.inputStyle === "fill-in-blanks" && subQ.inputConfig?.codeTemplate) {
      const template = subQ.inputConfig.codeTemplate;
      const blanks = subQ.inputConfig.blanks || [];
      
      const renderCodeWithBlanks = () => {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        const regex = /\{\{(blank_\d+)\}\}/g;
        let match;
        
        while ((match = regex.exec(template)) !== null) {
          if (match.index > lastIndex) {
            parts.push(
              <span key={`text-${lastIndex}`} className="text-neutral-300">
                {template.substring(lastIndex, match.index)}
              </span>
            );
          }
          
          const blankKey = match[1];
          const blankConfig = blanks.find(b => b.key === blankKey);
          const userAnswer = currentInput[blankKey] || "";
          const isCorrect = showResults && blankConfig && 
            userAnswer.toLowerCase().trim() === blankConfig.answer.toLowerCase().trim();
          const isWrong = showResults && blankConfig && 
            userAnswer.toLowerCase().trim() !== blankConfig.answer.toLowerCase().trim();
          
          parts.push(
            <span key={blankKey} className="inline-block mx-1 align-middle">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => handleInputChange(subQ.id, blankKey, e.target.value)}
                disabled={showResults}
                placeholder={blankConfig?.hint || "..."}
                style={{ width: blankConfig?.width ? `${blankConfig.width}px` : '80px' }}
                className={`px-2 py-1 text-sm font-mono rounded border-2 transition-all
                  ${showResults 
                    ? isCorrect 
                      ? "bg-green-900/50 border-green-500 text-green-300" 
                      : "bg-red-900/50 border-red-500 text-red-300"
                    : "bg-neutral-800 border-neutral-600 text-white focus:border-red-500"
                  }`}
                data-testid={`input-blank-${blankKey}`}
              />
              {showResults && isWrong && blankConfig && (
                <span className="ml-2 text-green-400 text-xs">
                  ({blankConfig.answer})
                </span>
              )}
            </span>
          );
          
          lastIndex = match.index + match[0].length;
        }
        
        if (lastIndex < template.length) {
          parts.push(
            <span key={`text-${lastIndex}`} className="text-neutral-300">
              {template.substring(lastIndex)}
            </span>
          );
        }
        
        return parts;
      };
      
      return (
        <div className="mt-4">
          <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-neutral-700">
            <pre className="whitespace-pre-wrap leading-relaxed">
              {renderCodeWithBlanks()}
            </pre>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Fill in the blanks to complete the code
          </p>
        </div>
      );
    }

    if (subQ.inputStyle === "drawing") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => !showResults && handleInputChange(subQ.id, "diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["drawing"]}
        />
      );
    }

    if (subQ.inputStyle === "design-choice") {
      const activeTab = currentInput["design_mode"] || "pseudocode";

      return (
        <div className="mt-4 space-y-4">
          {getRequirementBadge(subQ.codeRequirement)}

          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg w-fit">
            <button
              onClick={() => handleInputChange(subQ.id, "design_mode", "pseudocode")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "pseudocode" 
                  ? "bg-white dark:bg-neutral-700 text-red-600 dark:text-red-400 shadow-sm" 
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
              }`}
            >
              Pseudocode
            </button>
            <button
              onClick={() => handleInputChange(subQ.id, "design_mode", "diagram")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "diagram" 
                  ? "bg-white dark:bg-neutral-700 text-red-600 dark:text-red-400 shadow-sm" 
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
              }`}
            >
              Structure Diagram
            </button>
          </div>

          {activeTab === "pseudocode" ? (
             <div className="relative">
                <Textarea 
                  placeholder="// Write your design in pseudocode here..."
                  className="min-h-[300px] text-base font-mono p-4 resize-y bg-neutral-900 text-neutral-100 border-neutral-800 focus:border-red-500 transition-all selection:bg-red-500/30"
                  value={currentInput["main"] || ""}
                  onChange={(e) => handleInputChange(subQ.id, "main", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, subQ.id)}
                  disabled={showResults}
                  spellCheck={false}
                />
                <div className="absolute bottom-3 right-3 text-xs text-neutral-500">
                  Tab to indent
                </div>
             </div>
          ) : (
             <DiagramImageInput
                value={currentInput["diagram_image"] || ""}
                onChange={(val) => !showResults && handleInputChange(subQ.id, "diagram_image", val)}
                startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
                hint={DIAGRAM_HINTS["drawing"]}
             />
          )}
        </div>
      );
    }

    if (subQ.inputStyle === "erd-annotation") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => !showResults && handleInputChange(subQ.id, "diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["erd-annotation"]}
        />
      );
    }

    if (subQ.inputStyle === "nav-structure") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => !showResults && handleInputChange(subQ.id, "diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["nav-structure"]}
        />
      );
    }

    if (subQ.inputStyle === "nav-structure-higher") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => !showResults && handleInputChange(subQ.id, "diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["nav-structure-higher"]}
        />
      );
    }

    if (subQ.inputStyle === "structure-diagram") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => !showResults && handleInputChange(subQ.id, "diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["drawing"]}
        />
      );
    }

    if (subQ.inputStyle === "entity-occurrence-diagram") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => !showResults && handleInputChange(subQ.id, "diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["drawing"]}
        />
      );
    }

    if (subQ.inputStyle === "database-schema") {
      const schema = subQ.inputConfig?.databaseSchema;
      return (
        <div className="mt-4">
          <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900">
            {schema && schema.tables.length > 0 ? (
              <DatabaseSchemaDisplay schema={schema} />
            ) : (
              <p className="text-sm text-neutral-500 italic">No database schema defined for this question.</p>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Review the database schema above. Primary keys are underlined, foreign keys are marked with an asterisk (*).
          </p>
        </div>
      );
    }

    if (subQ.inputStyle === "tag-matching") {
      const tagConfig = subQ.inputConfig?.tagMatchingConfig;
      const savedConnections: StudentConnection[] = currentInput["tag_connections"] 
        ? JSON.parse(currentInput["tag_connections"]) 
        : [];
      
      return (
        <div className="mt-4">
          <TagMatchingEditor
            mode={showResults ? "review" : "student"}
            backgroundUrl={subQ.drawingBackgroundUrl}
            sourceTags={tagConfig?.sourceTags || []}
            targetZones={tagConfig?.targetZones || []}
            studentConnections={savedConnections}
            onStudentConnectionsChange={(connections) => {
              handleInputChange(subQ.id, "tag_connections", JSON.stringify(connections));
            }}
            disabled={showResults}
          />
          <p className="text-xs text-neutral-500 mt-2">
            Click and drag from each numbered point to draw an arrow to where it belongs on the image.
          </p>
        </div>
      );
    }

    if (subQ.inputStyle === "structure-dataflow") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => !showResults && handleInputChange(subQ.id, "diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["structure-dataflow"]}
        />
      );
    }

    if (subQ.inputStyle === "form-wireframe") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => !showResults && handleInputChange(subQ.id, "diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["form-wireframe"]}
        />
      );
    }

    if (subQ.inputStyle === "webpage-wireframe") {
      return (
        <DiagramImageInput
          value={currentInput["diagram_image"] || ""}
          onChange={(val) => !showResults && handleInputChange(subQ.id, "diagram_image", val)}
          startingImageUrl={subQ.drawingBackgroundUrl || subQ.imageUrl}
          hint={DIAGRAM_HINTS["form-wireframe"]}
        />
      );
    }

    return (
      <Textarea 
        placeholder="Type your answer here..." 
        className="min-h-[100px] text-lg p-4 resize-none bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 focus:border-red-500 shadow-sm transition-all mt-4"
        value={currentInput["main"] || ""}
        onChange={(e) => handleInputChange(subQ.id, "main", e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, subQ.id)}
        disabled={showResults}
      />
    );
  };

  // Helper to get topic name
  const getTopicName = (topicId: string) => {
    const topic = TOPICS.find(t => t.id === topicId);
    return topic ? topic.name : "Unknown Topic";
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-[200]">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {selectedQuestionId ? (
            <Button variant="ghost" size="icon" onClick={handleBackToList} className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0">
              <ArrowLeft className="w-5 h-5 text-neutral-500" />
            </Button>
          ) : (
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0">
                <ArrowLeft className="w-5 h-5 text-neutral-500" />
              </Button>
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="font-semibold text-neutral-900 dark:text-white text-sm sm:text-base truncate">{topicDetails?.name}</h1>
            <div className="text-xs text-neutral-500 truncate">
              {selectedQuestionId ? `Question ${currentQuestion?.title}` : `${allQuestions.length} Questions Available`}
            </div>
          </div>
        </div>
        <ModeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto max-w-4xl px-3 sm:px-6 py-4 sm:py-6">

        {!selectedQuestionId ? (
          // Question List View - Grouped by Year
          <div className="space-y-8">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Select a Question</h2>
            {(() => {
              // Separate practice questions from past paper questions
              const practiceQuestions = allQuestions.filter(q => q.isPractice).sort(compareQuestionsByNumber);
              const pastPaperQuestions = allQuestions.filter(q => !q.isPractice);

              // Group past paper questions by year
              const questionsByYear = pastPaperQuestions.reduce((acc, q) => {
                if (!acc[q.year]) {
                  acc[q.year] = [];
                }
                acc[q.year].push(q);
                return acc;
              }, {} as Record<number, Question[]>);

              // Sort questions within each year by question number
              Object.keys(questionsByYear).forEach(year => {
                questionsByYear[Number(year)].sort(compareQuestionsByNumber);
              });

              const sortedYears = Object.keys(questionsByYear).map(Number).sort((a, b) => b - a);

              const renderQuestionCard = (q: Question, index: number, showYear: boolean = true) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelectQuestion(q.id)}
                  className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-red-500 dark:hover:border-red-500 cursor-pointer transition-all shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                      <span className="text-sm text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded bg-neutral-50 dark:bg-neutral-900">
                        {getTopicName(q.topic)}
                      </span>
                      {showYear && !q.isPractice && (
                        <span className="text-sm text-neutral-500">{q.year}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {q.title}
                      </span>
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300 line-clamp-1 font-medium">
                      {getQuestionPreviewText(q)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-red-500 transition-colors" />
                </motion.div>
              );

              return (
                <>
                  {/* Practice Questions Section */}
                  {practiceQuestions.length > 0 && (
                    <Collapsible key="practice" defaultOpen={false} className="space-y-2">
                      <CollapsibleTrigger className="flex items-center gap-2 w-full group cursor-pointer py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-lg px-2 -mx-2 transition-colors">
                        <ChevronDown className="h-5 w-5 text-green-500 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                          Practice Questions
                        </h2>
                        <div className="flex-1 border-b border-green-200 dark:border-green-800 mt-1 ml-2 group-hover:border-green-300 dark:group-hover:border-green-700 transition-colors"></div>
                        <span className="text-xs text-green-500 font-medium">
                          {practiceQuestions.length} questions
                        </span>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="pt-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                        <div className="grid grid-cols-1 gap-4">
                          {practiceQuestions.map((q, index) => renderQuestionCard(q, index, false))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Past Paper Questions by Year */}
                  {sortedYears.map((year) => (
                    <Collapsible key={year} defaultOpen={false} className="space-y-2">
                      <CollapsibleTrigger className="flex items-center gap-2 w-full group cursor-pointer py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-lg px-2 -mx-2 transition-colors">
                        <ChevronDown className="h-5 w-5 text-neutral-400 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                          {year}
                        </h2>
                        <div className="flex-1 border-b border-neutral-200 dark:border-neutral-700 mt-1 ml-2 group-hover:border-neutral-300 dark:group-hover:border-neutral-600 transition-colors"></div>
                        <span className="text-xs text-neutral-400 font-medium">
                          {questionsByYear[year].length} questions
                        </span>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="pt-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                        <div className="grid grid-cols-1 gap-4">
                          {questionsByYear[year].map((q, index) => renderQuestionCard(q, index, false))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </>
              );
            })()}
          </div>
        ) : (
          // Single Question Revision View with Sub-questions
          <div className="w-full max-w-4xl mx-auto">
            {/* Question and Inputs */}
            <div className="space-y-8">
              <motion.div
                key={currentQuestion?.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white dark:bg-neutral-900 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                    {currentQuestion?.year}
                  </span>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {currentQuestion?.title}
                  </h2>
                </div>

                {/* Scenario Section (Shared) */}
                {currentQuestion?.scenario && hasScenarioContent(currentQuestion.scenario) && (
                  <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-950 rounded-lg sm:rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Scenario</div>
                    {/* New content blocks approach */}
                    {currentQuestion.scenario.contentBlocks && currentQuestion.scenario.contentBlocks.length > 0 ? (
                      <div className="space-y-4">
                        {currentQuestion.scenario.contentBlocks.map((block: ContentBlock) => (
                          <div key={block.id}>
                            {block.type === "text" && (
                              block.hasBorder ? (
                                <div className="flex justify-center">
                                  <div className={cn(
                                    "border border-neutral-300 dark:border-neutral-600 rounded-lg p-4",
                                    block.borderWidth === "xs" && "max-w-[200px]",
                                    block.borderWidth === "sm" && "max-w-xs",
                                    (!block.borderWidth || block.borderWidth === "md") && "max-w-md",
                                    block.borderWidth === "lg" && "max-w-lg",
                                    block.borderWidth === "xl" && "max-w-xl",
                                    block.borderWidth === "full" && "w-full"
                                  )}>
                                    <div className={`text-neutral-700 dark:text-neutral-300 leading-relaxed ${block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left"}`}>
                                      {formatText(block.content)}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className={`text-neutral-700 dark:text-neutral-300 leading-relaxed ${block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left"}`}>
                                  {formatText(block.content)}
                                </div>
                              )
                            )}
                            {block.type === "image" && block.content && (
                              <div className={cn(
                                "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                                block.imageSize === "xs" && "max-w-[150px]",
                                block.imageSize === "small" && "max-w-xs",
                                block.imageSize === "medium" && "max-w-md",
                                block.imageSize === "large" && "max-w-xl",
                                block.imageSize === "xl" && "max-w-2xl",
                                block.imageSize === "2xl" && "max-w-4xl",
                                block.imageSize === "full" && "w-full",
                                !block.imageSize && "max-w-md"
                              )}>
                                <img src={block.content} alt={block.caption || "Scenario image"} className="max-w-full h-auto object-contain" />
                                {block.caption && <p className="text-sm text-neutral-500 dark:text-neutral-400 p-2">{block.caption}</p>}
                              </div>
                            )}
                            {block.type === "code" && (
                              <div className="bg-neutral-900 p-4 rounded-lg font-mono text-sm text-neutral-300 overflow-x-auto border border-neutral-800">
                                <pre>{block.content}</pre>
                              </div>
                            )}
                            {block.type === "pseudocode" && block.pseudocodeLines && (
                              <table className="font-mono text-sm">
                                <tbody>
                                  {block.pseudocodeLines.map((line, idx) => (
                                    <tr key={line.id || idx}>
                                      <td className="pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap">{line.lineLabel}</td>
                                      <td className="text-neutral-900 dark:text-neutral-100 whitespace-pre">{line.content}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                            {block.type === "code-table" && block.codeSections && (
                              <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                {block.codeSections.map((section, sIdx) => (
                                  <div key={section.id || sIdx}>
                                    <div className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600">
                                      {section.label}
                                    </div>
                                    <div className="bg-white dark:bg-neutral-900 p-4 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0">
                                      {section.code}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {block.type === "data-table" && block.dataTable && (
                              <div className="flex justify-center">
                                <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden inline-block">
                                  {block.dataTable.tableName && block.dataTable.tableName.trim() !== "" && (
                                    <div className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono">
                                      {block.dataTable.tableName}
                                    </div>
                                  )}
                                  <table className="text-sm">
                                  <thead>
                                    <tr className="bg-neutral-100 dark:bg-neutral-800">
                                      {block.dataTable.columns.map((col) => (
                                        <th key={col.id} className="px-4 py-2 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0">
                                          {col.header}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {block.dataTable.rows.map((row) => (
                                      <tr key={row.id} className="border-t border-neutral-300 dark:border-neutral-700">
                                        {row.cells.map((cell, cellIndex) => {
                                          if (isCellHidden(cell)) return null;
                                          const cellRole = getCellRole(cell);
                                          const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                                          const colSpan = getCellColSpan(cell);
                                          const rowSpan = getCellRowSpan(cell);
                                          return (
                                            <CellTag 
                                              key={cellIndex} 
                                              colSpan={colSpan > 1 ? colSpan : undefined}
                                              rowSpan={rowSpan > 1 ? rowSpan : undefined}
                                              className={cn(
                                                "px-4 py-2 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                                                cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                                                cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                                              )}
                                            >
                                              {getCellValue(cell)}
                                            </CellTag>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                </div>
                              </div>
                            )}
                            {block.type === "database-schema" && block.databaseSchema && (
                              <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                                <DatabaseSchemaDisplay schema={block.databaseSchema} />
                              </div>
                            )}
                            {block.type === "row-layout" && block.children && (
                              <RowLayout>
                                {block.children.map((childBlock) => (
                                  <RowLayoutItem key={childBlock.id}>
                                    {childBlock.type === "text" && (
                                      <div className={`text-neutral-700 dark:text-neutral-300 leading-relaxed ${childBlock.textAlign === "center" ? "text-center" : childBlock.textAlign === "right" ? "text-right" : "text-left"}`}>
                                        {formatText(childBlock.content)}
                                      </div>
                                    )}
                                    {childBlock.type === "image" && childBlock.content && (
                                      <div className={cn(
                                        "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center",
                                        childBlock.imageSize === "xs" && "max-w-[150px]",
                                        childBlock.imageSize === "small" && "max-w-xs",
                                        childBlock.imageSize === "medium" && "max-w-md",
                                        !childBlock.imageSize && "max-w-md"
                                      )}>
                                        <img src={childBlock.content} alt={childBlock.caption || ""} className="max-w-full h-auto object-contain" />
                                        {childBlock.caption && <p className="text-sm text-neutral-500 p-2">{childBlock.caption}</p>}
                                      </div>
                                    )}
                                    {childBlock.type === "code" && (
                                      <pre className="p-4 bg-neutral-900 text-neutral-50 rounded-lg overflow-x-auto font-mono text-sm border border-neutral-700">
                                        {childBlock.content}
                                      </pre>
                                    )}
                                    {childBlock.type === "pseudocode" && childBlock.pseudocodeLines && (
                                      <table className="font-mono text-sm">
                                        <tbody>
                                          {childBlock.pseudocodeLines.map((line, idx) => (
                                            <tr key={line.id || idx}>
                                              <td className="pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap">{line.lineLabel}</td>
                                              <td className="text-neutral-900 dark:text-neutral-100 whitespace-pre">{line.content}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                    {childBlock.type === "data-table" && childBlock.dataTable && (
                                      <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                        {childBlock.dataTable.tableName && (
                                          <div className="bg-neutral-200 dark:bg-neutral-700 px-3 py-1.5 font-semibold text-sm border-b border-neutral-300 dark:border-neutral-600 font-mono">
                                            {childBlock.dataTable.tableName}
                                          </div>
                                        )}
                                        <table className="text-sm w-full">
                                          <thead>
                                            <tr className="bg-neutral-100 dark:bg-neutral-800">
                                              {childBlock.dataTable.columns.map((col) => (
                                                <th key={col.id} className="px-3 py-1.5 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0 text-xs">
                                                  {col.header}
                                                </th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {childBlock.dataTable.rows.map((row) => (
                                              <tr key={row.id} className="border-t border-neutral-300 dark:border-neutral-700">
                                                {row.cells.map((cell, cellIndex) => (
                                                  <td key={cellIndex} className="px-3 py-1.5 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0 text-xs">
                                                    {getCellValue(cell)}
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                    {childBlock.type === "code-table" && childBlock.codeSections && (
                                      <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                        {childBlock.codeSections.map((section, sIdx) => (
                                          <div key={section.id || sIdx}>
                                            <div className="bg-neutral-200 dark:bg-neutral-700 px-3 py-2 font-semibold text-sm border-b border-neutral-300 dark:border-neutral-600">{section.label}</div>
                                            <pre className="bg-neutral-900 text-neutral-100 p-3 text-sm font-mono overflow-x-auto">{section.code}</pre>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {childBlock.type === "database-schema" && childBlock.databaseSchema && (
                                      <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                                        <DatabaseSchemaDisplay schema={childBlock.databaseSchema} />
                                      </div>
                                    )}
                                  </RowLayoutItem>
                                ))}
                              </RowLayout>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Legacy fallback */
                      <>
                        {currentQuestion.scenario.text && (
                          <div className="text-neutral-700 dark:text-neutral-300 mb-4 leading-relaxed">
                            {formatText(currentQuestion.scenario.text)}
                          </div>
                        )}
                        {currentQuestion.scenario.imageUrl && (
                          <div className="mb-4 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center">
                            <img src={currentQuestion.scenario.imageUrl} alt="Scenario Illustration" className="max-w-full h-auto max-h-[600px] object-contain" />
                          </div>
                        )}
                        {currentQuestion.scenario.preCodeText && (
                          <div className="mb-4 text-neutral-700 dark:text-neutral-300 leading-relaxed">
                            {formatText(currentQuestion.scenario.preCodeText)}
                          </div>
                        )}
                        {currentQuestion.scenario.codeSnippet && (
                          <div className="bg-neutral-900 p-4 rounded-lg font-mono text-sm text-neutral-300 overflow-x-auto border border-neutral-800">
                            <pre>{currentQuestion.scenario.codeSnippet}</pre>
                          </div>
                        )}
                        {currentQuestion.scenario.postImageText && (
                          <div className="mt-4 text-neutral-700 dark:text-neutral-300 leading-relaxed">
                            {formatText(currentQuestion.scenario.postImageText)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Sub Questions Loop */}
                <div className="space-y-8 sm:space-y-12">
                  {currentQuestion?.subQuestions.map((subQ, index) => (
                    <div key={subQ.id} className="border-t border-neutral-100 dark:border-neutral-800 pt-6 sm:pt-8 first:border-0 first:pt-0 w-full overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 mb-4 w-full">
                        {subQ.label && (
                            <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white shrink-0">
                                {subQ.label}
                            </span>
                        )}
                        <div className="flex-1 w-full min-w-0 overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                {subQ.maxMarks > 0 && (
                                    <span className="self-start sm:ml-auto inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 whitespace-nowrap">
                                    {subQ.maxMarks} {subQ.maxMarks === 1 ? 'Mark' : 'Marks'}
                                    </span>
                                )}
                            </div>

                            {/* Content blocks or legacy content */}
                            {subQ.contentBlocks && subQ.contentBlocks.length > 0 ? (
                              <div className="space-y-4 my-4">
                                {subQ.contentBlocks.map((block: ContentBlock) => (
                                  <div key={block.id}>
                                    {block.type === "text" && (
                                      block.hasBorder ? (
                                        <div className="flex justify-center">
                                          <div className={cn(
                                            "border border-neutral-300 dark:border-neutral-600 rounded-lg p-4",
                                            block.borderWidth === "xs" && "max-w-[200px]",
                                            block.borderWidth === "sm" && "max-w-xs",
                                            (!block.borderWidth || block.borderWidth === "md") && "max-w-md",
                                            block.borderWidth === "lg" && "max-w-lg",
                                            block.borderWidth === "xl" && "max-w-xl",
                                            block.borderWidth === "full" && "w-full"
                                          )}>
                                            <div className={`text-base sm:text-lg font-medium text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap ${block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left"}`}>
                                              {formatText(block.content)}
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className={`text-base sm:text-lg font-medium text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap ${block.textAlign === "center" ? "text-center" : block.textAlign === "right" ? "text-right" : "text-left"}`}>
                                          {formatText(block.content)}
                                        </div>
                                      )
                                    )}
                                    {block.type === "image" && block.content && (
                                      <div className={cn(
                                        "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                                        block.imageSize === "xs" && "max-w-[150px]",
                                        block.imageSize === "small" && "max-w-xs",
                                        block.imageSize === "medium" && "max-w-md",
                                        block.imageSize === "large" && "max-w-xl",
                                        block.imageSize === "xl" && "max-w-2xl",
                                        block.imageSize === "2xl" && "max-w-4xl",
                                        block.imageSize === "full" && "w-full",
                                        !block.imageSize && "max-w-md"
                                      )}>
                                        <img src={block.content} alt={block.caption || "Question image"} className="max-w-full h-auto object-contain" />
                                        {block.caption && <p className="text-sm text-neutral-500 dark:text-neutral-400 p-2">{block.caption}</p>}
                                      </div>
                                    )}
                                    {block.type === "code" && (
                                      <div className="p-4 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                                        <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{block.content}</pre>
                                      </div>
                                    )}
                                    {block.type === "pseudocode" && block.pseudocodeLines && (
                                      <table className="font-mono text-sm">
                                        <tbody>
                                          {block.pseudocodeLines.map((line, idx) => (
                                            <tr key={line.id || idx}>
                                              <td className="pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap">{line.lineLabel}</td>
                                              <td className="text-neutral-900 dark:text-neutral-100 whitespace-pre">{line.content}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                    {block.type === "code-table" && block.codeSections && (
                                      <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                        {block.codeSections.map((section, sIdx) => (
                                          <div key={section.id || sIdx}>
                                            <div className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600">
                                              {section.label}
                                            </div>
                                            <div className="bg-white dark:bg-neutral-900 p-4 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0">
                                              {section.code}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {block.type === "data-table" && block.dataTable && (
                                      <div className="flex justify-center">
                                        <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden inline-block">
                                          {block.dataTable.tableName && block.dataTable.tableName.trim() !== "" && (
                                            <div className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono">
                                              {block.dataTable.tableName}
                                            </div>
                                          )}
                                          <table className="text-sm">
                                            <thead>
                                              <tr className="bg-neutral-100 dark:bg-neutral-800">
                                                {block.dataTable.columns.map((col) => (
                                                  <th key={col.id} className="px-4 py-2 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0">
                                                    {col.header}
                                                  </th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {block.dataTable.rows.map((row) => (
                                                <tr key={row.id} className="border-t border-neutral-300 dark:border-neutral-700">
                                                  {row.cells.map((cell, cellIndex) => {
                                                    if (isCellHidden(cell)) return null;
                                                    const cellRole = getCellRole(cell);
                                                    const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                                                    const colSpan = getCellColSpan(cell);
                                                    const rowSpan = getCellRowSpan(cell);
                                                    return (
                                                      <CellTag 
                                                        key={cellIndex} 
                                                        colSpan={colSpan > 1 ? colSpan : undefined}
                                                        rowSpan={rowSpan > 1 ? rowSpan : undefined}
                                                        className={cn(
                                                          "px-4 py-2 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                                                          cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                                                          cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                                                        )}
                                                      >
                                                        {getCellValue(cell)}
                                                      </CellTag>
                                                    );
                                                  })}
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                    {block.type === "database-schema" && block.databaseSchema && (
                                      <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                                        <DatabaseSchemaDisplay schema={block.databaseSchema} />
                                      </div>
                                    )}
                                    {block.type === "row-layout" && block.children && (
                                      <RowLayout>
                                        {block.children.map((childBlock) => (
                                          <RowLayoutItem key={childBlock.id}>
                                            {childBlock.type === "text" && (
                                              <div className={`text-neutral-900 dark:text-white leading-relaxed ${childBlock.textAlign === "center" ? "text-center" : childBlock.textAlign === "right" ? "text-right" : ""}`}>
                                                {formatText(childBlock.content)}
                                              </div>
                                            )}
                                            {childBlock.type === "image" && childBlock.content && (
                                              <div className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
                                                <img src={childBlock.content} alt={childBlock.caption || ""} className="max-w-full h-auto object-contain" />
                                                {childBlock.caption && <p className="text-sm text-neutral-500 p-2">{childBlock.caption}</p>}
                                              </div>
                                            )}
                                            {childBlock.type === "code" && (
                                              <pre className="p-4 bg-neutral-900 text-neutral-50 rounded-lg overflow-x-auto font-mono text-sm">{childBlock.content}</pre>
                                            )}
                                            {childBlock.type === "pseudocode" && childBlock.pseudocodeLines && (
                                              <table className="font-mono text-sm">
                                                <tbody>
                                                  {childBlock.pseudocodeLines.map((line, idx) => (
                                                    <tr key={line.id || idx}>
                                                      <td className="pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap">{line.lineLabel}</td>
                                                      <td className="text-neutral-900 dark:text-neutral-100 whitespace-pre">{line.content}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            )}
                                            {childBlock.type === "data-table" && childBlock.dataTable && (
                                              <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                                {childBlock.dataTable.tableName && (
                                                  <div className="bg-neutral-200 dark:bg-neutral-700 px-3 py-1.5 font-semibold text-sm font-mono">{childBlock.dataTable.tableName}</div>
                                                )}
                                                <table className="text-sm w-full">
                                                  <thead><tr className="bg-neutral-100 dark:bg-neutral-800">{childBlock.dataTable.columns.map(col => <th key={col.id} className="px-3 py-1.5 text-left font-semibold text-xs border-r last:border-r-0">{col.header}</th>)}</tr></thead>
                                                  <tbody>{childBlock.dataTable.rows.map(row => <tr key={row.id} className="border-t">{row.cells.map((cell, idx) => <td key={idx} className="px-3 py-1.5 text-xs border-r last:border-r-0">{getCellValue(cell)}</td>)}</tr>)}</tbody>
                                                </table>
                                              </div>
                                            )}
                                            {childBlock.type === "code-table" && childBlock.codeSections && (
                                              <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                                {childBlock.codeSections.map((section, sIdx) => (
                                                  <div key={section.id || sIdx}>
                                                    <div className="bg-neutral-200 dark:bg-neutral-700 px-3 py-2 font-semibold text-sm border-b border-neutral-300 dark:border-neutral-600">{section.label}</div>
                                                    <pre className="bg-neutral-900 text-neutral-100 p-3 text-sm font-mono overflow-x-auto">{section.code}</pre>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            {childBlock.type === "database-schema" && childBlock.databaseSchema && (
                                              <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                                                <DatabaseSchemaDisplay schema={childBlock.databaseSchema} />
                                              </div>
                                            )}
                                          </RowLayoutItem>
                                        ))}
                                      </RowLayout>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* Legacy content */
                              <>
                                {subQ.questionText && (
                                  <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                                    {formatText(subQ.questionText)}
                                  </h3>
                                )}
                                {subQ.imageUrl && subQ.inputStyle !== "drawing" && (
                                  <div className="my-4">
                                    <div className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center w-full">
                                      <img src={subQ.imageUrl} alt="Question Illustration" className="max-w-full h-auto max-h-[600px] object-contain" />
                                    </div>
                                  </div>
                                )}
                                {subQ.preCodeText && (
                                  <div className="my-4 text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                                    {formatText(subQ.preCodeText)}
                                  </div>
                                )}
                                {subQ.codeSnippet && (
                                  <div className="my-4 p-4 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                                    <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{subQ.codeSnippet}</pre>
                                  </div>
                                )}
                                {subQ.imageCaption && (
                                  <p className="my-4 text-base text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap">{subQ.imageCaption}</p>
                                )}
                              </>
                            )}

                            {renderInputArea(subQ)}

                            {/* Nested Sub-Parts */}
                            {subQ.subParts && subQ.subParts.length > 0 && (
                              <div className="mt-6 ml-4 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700 space-y-6">
                                {subQ.subParts.map((part) => (
                                  <div key={part.id} className="space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                                      {part.label && (
                                        <span className="text-sm sm:text-base font-bold text-neutral-800 dark:text-neutral-200">
                                          {part.label}
                                        </span>
                                      )}
                                      <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                          {/* Content blocks or legacy question text */}
                                          {part.contentBlocks && part.contentBlocks.length > 0 ? (
                                            <div className="flex-1 space-y-3">
                                              {part.contentBlocks.map((block) => (
                                                <div key={block.id}>
                                                  {block.type === "text" && block.content && (
                                                    block.hasBorder ? (
                                                      <div className="flex justify-center">
                                                        <div className={cn(
                                                          "border border-neutral-300 dark:border-neutral-600 rounded-lg p-3",
                                                          block.borderWidth === "xs" && "max-w-[200px]",
                                                          block.borderWidth === "sm" && "max-w-xs",
                                                          (!block.borderWidth || block.borderWidth === "md") && "max-w-md",
                                                          block.borderWidth === "lg" && "max-w-lg",
                                                          block.borderWidth === "xl" && "max-w-xl",
                                                          block.borderWidth === "full" && "w-full"
                                                        )}>
                                                          <div className={cn(
                                                            "text-sm sm:text-base text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap",
                                                            block.textAlign === "center" && "text-center",
                                                            block.textAlign === "right" && "text-right"
                                                          )}>
                                                            {formatText(block.content)}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <div className={cn(
                                                        "text-sm sm:text-base text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap",
                                                        block.textAlign === "center" && "text-center",
                                                        block.textAlign === "right" && "text-right"
                                                      )}>
                                                        {formatText(block.content)}
                                                      </div>
                                                    )
                                                  )}
                                                  {block.type === "image" && block.content && (
                                                    <div className={cn(
                                                      "rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center mx-auto",
                                                      block.imageSize === "xs" && "max-w-[120px]",
                                                      block.imageSize === "small" && "max-w-xs",
                                                      block.imageSize === "medium" && "max-w-md",
                                                      block.imageSize === "large" && "max-w-xl",
                                                      block.imageSize === "xl" && "max-w-2xl",
                                                      block.imageSize === "2xl" && "max-w-4xl",
                                                      block.imageSize === "full" && "w-full",
                                                      !block.imageSize && "max-w-md"
                                                    )}>
                                                      <img src={block.content} alt={block.caption || "Question image"} className="max-w-full h-auto object-contain" />
                                                      {block.caption && <p className="text-sm text-neutral-500 dark:text-neutral-400 p-2">{block.caption}</p>}
                                                    </div>
                                                  )}
                                                  {block.type === "code" && block.content && (
                                                    <div className="p-3 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                                                      <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{block.content}</pre>
                                                    </div>
                                                  )}
                                                  {block.type === "pseudocode" && block.pseudocodeLines && (
                                                    <table className="font-mono text-sm">
                                                      <tbody>
                                                        {block.pseudocodeLines.map((line, idx) => (
                                                          <tr key={line.id || idx}>
                                                            <td className="pr-4 text-neutral-500 dark:text-neutral-400 align-top whitespace-nowrap">{line.lineLabel}</td>
                                                            <td className="text-neutral-900 dark:text-neutral-100 whitespace-pre">{line.content}</td>
                                                          </tr>
                                                        ))}
                                                      </tbody>
                                                    </table>
                                                  )}
                                                  {block.type === "code-table" && block.codeSections && (
                                                    <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                                                      {block.codeSections.map((section, sIdx) => (
                                                        <div key={section.id || sIdx}>
                                                          <div className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600">
                                                            {section.label}
                                                          </div>
                                                          <div className="bg-white dark:bg-neutral-900 p-4 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap border-b border-neutral-300 dark:border-neutral-700 last:border-b-0">
                                                            {section.code}
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                  {block.type === "data-table" && block.dataTable && (
                                                    <div className="flex justify-center">
                                                      <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden inline-block">
                                                        {block.dataTable.tableName && block.dataTable.tableName.trim() !== "" && (
                                                          <div className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 font-semibold text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-600 font-mono">
                                                            {block.dataTable.tableName}
                                                          </div>
                                                        )}
                                                        <table className="text-sm">
                                                          <thead>
                                                            <tr className="bg-neutral-100 dark:bg-neutral-800">
                                                              {block.dataTable.columns.map((col) => (
                                                                <th key={col.id} className="px-4 py-2 text-left font-semibold border-r border-neutral-300 dark:border-neutral-600 last:border-r-0">
                                                                  {col.header}
                                                                </th>
                                                              ))}
                                                            </tr>
                                                          </thead>
                                                          <tbody>
                                                            {block.dataTable.rows.map((row) => (
                                                              <tr key={row.id} className="border-t border-neutral-300 dark:border-neutral-700">
                                                                {row.cells.map((cell, cellIndex) => {
                                                                  if (isCellHidden(cell)) return null;
                                                                  const cellRole = getCellRole(cell);
                                                                  const CellTag = cellRole === "title" || cellRole === "header" ? "th" : "td";
                                                                  const colSpan = getCellColSpan(cell);
                                                                  const rowSpan = getCellRowSpan(cell);
                                                                  return (
                                                                    <CellTag 
                                                                      key={cellIndex} 
                                                                      colSpan={colSpan > 1 ? colSpan : undefined}
                                                                      rowSpan={rowSpan > 1 ? rowSpan : undefined}
                                                                      className={cn(
                                                                        "px-4 py-2 border-r border-neutral-300 dark:border-neutral-600 last:border-r-0",
                                                                        cellRole === "title" && "bg-blue-100 dark:bg-blue-900 font-bold text-center",
                                                                        cellRole === "header" && "bg-neutral-100 dark:bg-neutral-800 font-semibold"
                                                                      )}
                                                                    >
                                                                      {getCellValue(cell)}
                                                                    </CellTag>
                                                                  );
                                                                })}
                                                              </tr>
                                                            ))}
                                                          </tbody>
                                                        </table>
                                                      </div>
                                                    </div>
                                                  )}
                                                  {block.type === "database-schema" && block.databaseSchema && (
                                                    <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                                                      <DatabaseSchemaDisplay schema={block.databaseSchema} />
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-sm sm:text-base text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                                              {formatText(part.questionText)}
                                            </p>
                                          )}
                                          {part.maxMarks > 0 && (
                                            <span className="self-start sm:ml-4 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 whitespace-nowrap">
                                              {part.maxMarks} {part.maxMarks === 1 ? 'Mark' : 'Marks'}
                                            </span>
                                          )}
                                        </div>

                                        {/* Legacy fields fallback - only shown if no content blocks */}
                                        {(!part.contentBlocks || part.contentBlocks.length === 0) && (
                                          <>
                                            {part.imageUrl && part.inputStyle !== "drawing" && part.inputStyle !== "design-choice" && (
                                              <div className="my-3">
                                                <div className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center w-full">
                                                  <img 
                                                    src={part.imageUrl} 
                                                    alt="Question Illustration" 
                                                    className="max-w-full h-auto max-h-[400px] object-contain"
                                                  />
                                                </div>
                                              </div>
                                            )}

                                            {part.preCodeText && (
                                              <div className="my-3 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                                                {formatText(part.preCodeText)}
                                              </div>
                                            )}

                                            {part.codeSnippet && (
                                              <div className="my-3 p-3 bg-neutral-900 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                                                <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{part.codeSnippet}</pre>
                                              </div>
                                            )}

                                            {part.imageCaption && (
                                              <p className="my-3 text-sm text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap">{part.imageCaption}</p>
                                            )}
                                          </>
                                        )}

                                        {renderInputArea(part)}

                                        {/* Sub-part results */}
                                        {showResults && part.maxMarks > 0 && (
                                          <div className="mt-3 p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                                            <div className="flex justify-between items-center mb-2">
                                              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Result</span>
                                              <div className={`flex items-center gap-2 text-xs font-bold ${
                                                (subQuestionResults[part.id] || 0) === part.maxMarks 
                                                  ? "text-green-600 dark:text-green-400" 
                                                  : (subQuestionResults[part.id] || 0) > 0 
                                                  ? "text-yellow-600 dark:text-yellow-400"
                                                  : "text-red-600 dark:text-red-400"
                                              }`}>
                                                {(subQuestionResults[part.id] || 0) === part.maxMarks ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {subQuestionResults[part.id] || 0} / {part.maxMarks}
                                              </div>
                                            </div>

                                            {aiFeedback[part.id] && (
                                              <div className="text-xs p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-md mb-2">
                                                <div className="text-neutral-700 dark:text-neutral-300 space-y-1">
                                                  {(typeof aiFeedback[part.id].feedback === "string" ? aiFeedback[part.id].feedback : Array.isArray(aiFeedback[part.id].feedback) ? aiFeedback[part.id].feedback.join("\n• ") : String(aiFeedback[part.id].feedback)).split('•').filter(Boolean).map((point, i) => (
                                                    <p key={i} className="flex gap-1">
                                                      <span>•</span>
                                                      <span>{point.trim()}</span>
                                                    </p>
                                                  ))}
                                                </div>
                                                {aiFeedback[part.id].suggestions && (
                                                  <p className="text-neutral-600 dark:text-neutral-400 mt-1 text-xs italic">💡 {typeof aiFeedback[part.id].suggestions === "string" ? aiFeedback[part.id].suggestions : Array.isArray(aiFeedback[part.id].suggestions) ? aiFeedback[part.id].suggestions.join(", ") : String(aiFeedback[part.id].suggestions)}</p>
                                                )}
                                              </div>
                                            )}

                                            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                                              Marking Scheme
                                            </div>
                                            <ul className="space-y-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                                              {part.markingScheme.map((point, i) => (
                                                <li key={i} className="flex gap-2 items-start">
                                                  <span className="min-w-[3px] h-[3px] rounded-full bg-red-400 mt-1.5"></span>
                                                  {point}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Inline feedback after submission */}
                            {showResults && subQ.maxMarks > 0 && (
                              <div className="mt-4 p-4 rounded-lg border bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Result</span>
                                  <div className={`flex items-center gap-2 text-sm font-bold ${
                                    (subQuestionResults[subQ.id] || 0) === subQ.maxMarks 
                                      ? "text-green-600 dark:text-green-400" 
                                      : (subQuestionResults[subQ.id] || 0) > 0 
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}>
                                    {(subQuestionResults[subQ.id] || 0) === subQ.maxMarks ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    {subQuestionResults[subQ.id] || 0} / {subQ.maxMarks}
                                  </div>
                                </div>

                                {aiFeedback[subQ.id] && (
                                  <div className="text-sm p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-md mb-3">
                                    <div className="text-neutral-700 dark:text-neutral-300 space-y-1">
                                      {(typeof aiFeedback[subQ.id].feedback === "string" ? aiFeedback[subQ.id].feedback : Array.isArray(aiFeedback[subQ.id].feedback) ? aiFeedback[subQ.id].feedback.join("\n• ") : String(aiFeedback[subQ.id].feedback)).split('•').filter(Boolean).map((point, i) => (
                                        <p key={i} className="flex gap-1">
                                          <span>•</span>
                                          <span>{point.trim()}</span>
                                        </p>
                                      ))}
                                    </div>
                                    {aiFeedback[subQ.id].suggestions && (
                                      <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-xs italic">💡 {typeof aiFeedback[subQ.id].suggestions === "string" ? aiFeedback[subQ.id].suggestions : Array.isArray(aiFeedback[subQ.id].suggestions) ? aiFeedback[subQ.id].suggestions.join(", ") : String(aiFeedback[subQ.id].suggestions)}</p>
                                    )}
                                  </div>
                                )}

                                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                                  Marking Scheme
                                </div>
                                <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                                  {subQ.markingScheme.map((point, i) => (
                                    <li key={i} className="flex gap-2 items-start">
                                      <span className="min-w-[4px] h-[4px] rounded-full bg-red-400 mt-1.5"></span>
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  {!showResults ? (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleAutoMark}
                      disabled={isGrading}
                    >
                      {isGrading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Grading with AI...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" /> Check All Answers
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg" onClick={handleBackToList} variant="outline">
                      <List className="mr-2 w-4 h-4" /> Back to Questions
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}