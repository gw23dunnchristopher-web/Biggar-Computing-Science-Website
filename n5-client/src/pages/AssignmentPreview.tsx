import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Clock, FileText, Image, Code, ChevronRight, ChevronDown, Eye, EyeOff, AlertCircle, Upload } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { renderQuestionInput, SubQuestion } from "@/components/QuestionInput";
import RichTextBlock from "@/components/RichTextBlock";
import DOMPurify from "dompurify";

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

interface AssignmentQuestion {
  id: string;
  questionNumber?: string;
  label?: string;
  questionText: string;
  contentBlocks?: ContentBlock[];
  maxMarks: number;
  inputStyle?: string;
  inputConfig?: {
    fields?: { key: string; label: string }[];
    columns?: { key: string; header: string; width?: string }[];
    rows?: { key?: string; label: string; value?: string; isInput?: boolean; multiline?: boolean }[];
    inputRows?: number;
    grid?: any;
    baseErdDiagram?: string;
    baseNavDiagram?: string;
    baseStructureDiagram?: string;
    maxScreenshots?: number;
    screenshotInstructions?: string;
  };
  codeRequirement?: "programming-language" | "design-notation" | "either";
  drawingBackgroundUrl?: string;
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
  subQuestions?: AssignmentQuestion[] | null;
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
  isPublished: boolean;
  sections?: AssignmentSection[];
}

const SECTION_LABELS: Record<string, string> = {
  sdd: "Software Design and Development",
  cs: "Computer Systems",
  ddd: "Database Design and Development",
  wdd: "Web Design and Development",
};

export default function AssignmentPreview() {
  const { id: assignmentId } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  const [showInputFields, setShowInputFields] = useState(true);

  useEffect(() => {
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
        setExpandedSections(new Set(data.sections.map((s: AssignmentSection) => s.id)));
        const allPartIds = data.sections.flatMap((s: AssignmentSection) => 
          s.parts?.map((p: AssignmentPart) => p.id) || []
        );
        setExpandedParts(new Set(allPartIds));
      }
    } catch (err) {
      setError("Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${mins} minutes`;
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const togglePart = (partId: string) => {
    setExpandedParts(prev => {
      const next = new Set(prev);
      if (next.has(partId)) next.delete(partId);
      else next.add(partId);
      return next;
    });
  };

  const renderContentBlock = (block: ContentBlock) => {
    switch (block.type) {
      case "heading":
        return (
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-4 mb-2">
            {block.content}
          </h3>
        );
      case "text":
        return <RichTextBlock content={block.content} />;
      case "image":
        return (
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
        );
      case "code":
        return (
          <pre className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg overflow-x-auto my-4">
            <code className="text-sm font-mono">{block.content}</code>
          </pre>
        );
      case "data-table":
        if (!block.dataTable) return null;
        return (
          <div className="my-6 overflow-x-auto">
            {block.dataTable.title && (
              <p className="font-medium mb-2">{block.dataTable.title}</p>
            )}
            <table className="min-w-full border border-neutral-200 dark:border-neutral-700">
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
              <tbody>
                {block.dataTable.rows?.map((row: any, rowIndex: number) => {
                  const cells = Array.isArray(row) ? row : (row.cells || []);
                  return (
                    <tr key={row.id || rowIndex} className={rowIndex % 2 === 0 ? "" : "bg-neutral-50 dark:bg-neutral-800/50"}>
                      {cells.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} className="px-3 py-2 text-sm border-b">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      case "pseudocode":
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
      case "row-layout":
        if (!block.children) return null;
        return (
          <div className="flex flex-col md:flex-row gap-4 items-start my-4">
            {block.children.map((child, childIdx) => (
              <div key={child.id || childIdx} className="flex-1 min-w-0">
                {renderContentBlock(child)}
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const renderQuestionPreview = (question: AssignmentQuestion, partLabel: string) => {
    const subQuestion: SubQuestion = {
      id: question.id,
      questionText: question.questionText,
      maxMarks: question.maxMarks,
      inputStyle: question.inputStyle,
      inputConfig: question.inputConfig,
      codeRequirement: question.codeRequirement,
      drawingBackgroundUrl: question.drawingBackgroundUrl,
      imageUrl: (question as any).imageUrl,
      aiGuidance: (question as any).aiGuidance,
    };

    return (
      <div key={question.id} className="border-l-2 border-blue-500 pl-4 py-3">
        <div className="flex items-start justify-between mb-2">
          <span className="font-medium text-sm">
            {question.label || question.questionNumber || `Q${partLabel}`}
          </span>
          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
            {question.maxMarks} mark{question.maxMarks !== 1 ? 's' : ''}
          </span>
        </div>
        
        {question.questionText && (
          <div 
            className="rich-text-content mb-3"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.questionText) }}
          />
        )}
        
        {question.contentBlocks?.map((block: ContentBlock) => (
          <div key={block.id}>
            {renderContentBlock(block)}
          </div>
        ))}
        
        {showInputFields && (
          <div className="mt-3 opacity-60 pointer-events-none">
            {renderQuestionInput(subQuestion, {}, () => {}, undefined, undefined, true)}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-neutral-500">Loading preview...</span>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium" data-testid="text-error-title">Failed to load assignment</p>
            <p className="text-neutral-500 mt-2" data-testid="text-error-message">{error || "Assignment not found"}</p>
            <Button className="mt-4" onClick={() => setLocation("/teacher/assignments")} data-testid="button-back-to-assignments">
              Back to Assignments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const compulsorySections = assignment.sections?.filter(s => s.isCompulsory) || [];
  const optionalSections = assignment.sections?.filter(s => !s.isCompulsory) || [];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 py-3">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-amber-600" />
            <span className="font-medium text-amber-800 dark:text-amber-200">
              Preview Mode - This is how students will see the assignment
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInputFields(!showInputFields)}
              className="border-amber-300 dark:border-amber-700"
              data-testid="button-toggle-input-fields"
            >
              {showInputFields ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showInputFields ? "Hide" : "Show"} Input Fields
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.close()}
              className="border-amber-300 dark:border-amber-700"
              data-testid="button-close-preview"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Close Preview
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl" data-testid="text-assignment-title">{assignment.year} - Assignment</CardTitle>
                <CardDescription className="mt-2" data-testid="text-assignment-year">
                  {assignment.year} Assignment
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400" data-testid="text-assignment-time">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(assignment.totalTimeMinutes)}</span>
                </div>
                <div className="text-sm text-neutral-500 mt-1" data-testid="text-assignment-marks">
                  {assignment.totalMarks} marks total
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {compulsorySections.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Compulsory Sections</h2>
            <div className="space-y-4">
              {compulsorySections.sort((a, b) => a.orderIndex - b.orderIndex).map(section => (
                <Card key={section.id}>
                  <Collapsible 
                    open={expandedSections.has(section.id)} 
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50" data-testid={`trigger-section-${section.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {expandedSections.has(section.id) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                            <CardTitle className="text-lg">
                              {SECTION_LABELS[section.sectionType] || section.title}
                            </CardTitle>
                          </div>
                          <span className="text-sm text-neutral-500">
                            {section.parts?.reduce((sum, p) => sum + p.maxMarks, 0) || 0} marks
                          </span>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 border-t">
                        <div className="space-y-4 py-4">
                          {section.informationSheet && section.informationSheet.length > 0 && (
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg mb-2">
                              <p className="text-sm font-medium text-purple-700 dark:text-purple-400 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Information Sheet ({section.informationSheet.length} block{section.informationSheet.length !== 1 ? "s" : ""}) - visible to students across all parts
                              </p>
                            </div>
                          )}
                          {section.parts?.sort((a, b) => a.orderIndex - b.orderIndex).map(part => (
                            <Collapsible
                              key={part.id}
                              open={expandedParts.has(part.id)}
                              onOpenChange={() => togglePart(part.id)}
                            >
                              <div className="border rounded-lg">
                                <CollapsibleTrigger asChild>
                                  <div className="p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 flex items-center justify-between" data-testid={`trigger-part-${part.id}`}>
                                    <div className="flex items-center gap-2">
                                      {expandedParts.has(part.id) ? 
                                        <ChevronDown className="h-4 w-4" /> : 
                                        <ChevronRight className="h-4 w-4" />
                                      }
                                      <span className="font-medium">Part {part.partLabel}</span>
                                      {part.title && <span className="text-neutral-500">- {part.title}</span>}
                                      {part.requiresUpload && (
                                        <span className="flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                                          <Upload className="h-3 w-3" />
                                          Upload Required
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-sm text-neutral-500">{part.maxMarks} marks</span>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="px-4 pb-4 pt-6 border-t">
                                    {part.instructions && (
                                      <div 
                                        className="rich-text-content mb-4"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(part.instructions.replace(/\n/g, "<br />")) }}
                                      />
                                    )}
                                    
                                    {part.contentBlocks?.map((block: ContentBlock) => (
                                      <div key={block.id}>
                                        {renderContentBlock(block)}
                                      </div>
                                    ))}
                                    
                                    {part.subQuestions && part.subQuestions.length > 0 && (
                                      <div className="mt-4 space-y-4">
                                        {part.subQuestions.map((q: AssignmentQuestion) => 
                                          renderQuestionPreview(q, part.partLabel)
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </div>
        )}

        {optionalSections.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Optional Sections 
              <span className="text-sm font-normal text-neutral-500 ml-2">(Students choose one)</span>
            </h2>
            <div className="space-y-4">
              {optionalSections.sort((a, b) => a.orderIndex - b.orderIndex).map(section => (
                <Card key={section.id} className="border-dashed">
                  <Collapsible 
                    open={expandedSections.has(section.id)} 
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50" data-testid={`trigger-section-${section.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {expandedSections.has(section.id) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                            <CardTitle className="text-lg">
                              {SECTION_LABELS[section.sectionType] || section.title}
                            </CardTitle>
                            <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                              Optional
                            </span>
                          </div>
                          <span className="text-sm text-neutral-500">
                            {section.parts?.reduce((sum, p) => sum + p.maxMarks, 0) || 0} marks
                          </span>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 border-t">
                        <div className="space-y-4 py-4">
                          {section.informationSheet && section.informationSheet.length > 0 && (
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg mb-2">
                              <p className="text-sm font-medium text-purple-700 dark:text-purple-400 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Information Sheet ({section.informationSheet.length} block{section.informationSheet.length !== 1 ? "s" : ""}) - visible to students across all parts
                              </p>
                            </div>
                          )}
                          {section.parts?.sort((a, b) => a.orderIndex - b.orderIndex).map(part => (
                            <Collapsible
                              key={part.id}
                              open={expandedParts.has(part.id)}
                              onOpenChange={() => togglePart(part.id)}
                            >
                              <div className="border rounded-lg">
                                <CollapsibleTrigger asChild>
                                  <div className="p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 flex items-center justify-between" data-testid={`trigger-part-${part.id}`}>
                                    <div className="flex items-center gap-2">
                                      {expandedParts.has(part.id) ? 
                                        <ChevronDown className="h-4 w-4" /> : 
                                        <ChevronRight className="h-4 w-4" />
                                      }
                                      <span className="font-medium">Part {part.partLabel}</span>
                                      {part.title && <span className="text-neutral-500">- {part.title}</span>}
                                      {part.requiresUpload && (
                                        <span className="flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                                          <Upload className="h-3 w-3" />
                                          Upload Required
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-sm text-neutral-500">{part.maxMarks} marks</span>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="px-4 pb-4 pt-6 border-t">
                                    {part.instructions && (
                                      <div 
                                        className="rich-text-content mb-4"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(part.instructions.replace(/\n/g, "<br />")) }}
                                      />
                                    )}
                                    
                                    {part.contentBlocks?.map((block: ContentBlock) => (
                                      <div key={block.id}>
                                        {renderContentBlock(block)}
                                      </div>
                                    ))}
                                    
                                    {part.subQuestions && part.subQuestions.length > 0 && (
                                      <div className="mt-4 space-y-4">
                                        {part.subQuestions.map((q: AssignmentQuestion) => 
                                          renderQuestionPreview(q, part.partLabel)
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
