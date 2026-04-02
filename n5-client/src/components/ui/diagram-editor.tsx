import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Square, Type, X, MousePointer2, Pencil, Eraser, Trash2, Circle, Diamond, Spline, LayoutTemplate, MousePointerClick, FormInput, Image as ImageIcon, ChevronDown, Database, FileText, Hexagon, Route, Minus, List, Link, AlignLeft, AlignCenter, AlignRight, ArrowUp, ArrowDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErdAttribute {
  id: string;
  name: string;
  marking: "none" | "primary" | "foreign";
}

export interface DiagramItem {
  id: string;
  type: "box" | "text" | "ellipse" | "diamond" | "parallelogram" | "cylinder" | "document" | "hexagon" | "trapezoid" | "circle" | "line" | "crowfoot" | "ui-window" | "ui-button" | "ui-input" | "ui-output" | "ui-image" | "ui-dropdown" | "bullet-text" | "numbered-text" | "link-text" | "erd-entity" | "dataflow-arrow" | "ui-textarea" | "ui-radio" | "ui-checkbox" | "ui-submit" | "ui-label" | "nav-highlight" | "nav-page" | "struct-process" | "struct-decision" | "struct-loop" | "entity-oval" | "entity-occurrence" | "wf-heading" | "wf-paragraph" | "wf-audio" | "wf-video" | "wf-div" | "wf-annotation";
  x: number;
  y: number;
  content?: string;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  connectedTo1?: string; // ID of shape connected at start point
  connectedTo2?: string; // ID of shape connected at end point
  anchor1Side?: 'top' | 'bottom' | 'left' | 'right'; // Which anchor on shape1
  anchor2Side?: 'top' | 'bottom' | 'left' | 'right'; // Which anchor on shape2
  marking?: "none" | "primary" | "foreign"; // For ERD annotation - PK (underline) or FK (star)
  isBaseItem?: boolean; // True if this is part of the teacher's base diagram (can't be deleted by student)
  isBold?: boolean; // Text formatting
  isUnderline?: boolean; // Text formatting
  hasBullet?: boolean; // Has bullet point prefix
  textAlign?: "left" | "center" | "right"; // Text alignment
  fontSize?: "small" | "normal" | "large" | "xlarge"; // Text size
  // ERD Entity specific fields
  entityName?: string; // Name shown in entity header
  attributes?: ErdAttribute[]; // List of attributes for ERD entity
  relationshipLabel?: string; // Label for relationship lines
  arrowStart?: boolean; // Arrow at start point of line
  arrowEnd?: boolean; // Arrow at end point of line
  // Structure dataflow specific fields
  dataflowDirection?: "up" | "down"; // Direction of dataflow arrow
  originFunctionId?: string; // ID of the function box this arrow originates from
  attachedArrowId?: string; // For text labels: ID of the arrow this text is attached to
  isFunction?: boolean; // True if this box represents a function (for structure diagrams)
  // Form wireframe specific fields
  isRequired?: boolean; // Form field is required (shows asterisk)
  radioGroupName?: string; // Group name for radio buttons
  dropdownOptions?: string[]; // Options for dropdown menus
  // Paired label/field linking (for form-wireframe)
  pairedLabelId?: string; // For input fields: ID of the paired label
  pairedFieldId?: string; // For labels: ID of the paired input field
  pairOffsetX?: number; // X offset of label relative to field
  pairOffsetY?: number; // Y offset of label relative to field
  // Validation rules (for form-wireframe input elements)
  validationMin?: number; // Minimum numeric value
  validationMax?: number; // Maximum numeric value
  validationMessage?: string; // Custom validation message to display
  // Entity occurrence diagram specific fields
  parentEntityId?: string; // For entity-occurrence: which entity oval this occurrence belongs to
  dotPosition?: "left" | "right" | "both"; // Where to show dots on occurrence
  // Entity oval specific fields (for entity-occurrence diagrams)
  entityTitle?: string; // Title shown above the entity oval
  occurrences?: Array<{id: string; text: string; dotPosition: "left" | "right" | "both"}>; // Typed occurrences inside the entity
  linkedTitleId?: string; // ID of the linked title text item above the entity
}

interface DiagramEditorProps {
  initialData?: string; // JSON string of items
  initialDrawing?: string; // Data URL for drawing
  onChange?: (data: string, drawing: string) => void; // Returns JSON string and drawing Data URL
  disabled?: boolean;
  backgroundUrl?: string;
  mode?: "flowchart" | "database" | "wireframe" | "general" | "erd-annotation" | "nav-structure" | "nav-structure-higher" | "structure-dataflow" | "form-wireframe" | "structure-diagram" | "entity-occurrence" | "webpage-wireframe"; // Controls which tools are shown
  baseDiagram?: string; // For erd-annotation mode: the teacher's base diagram (JSON string) that students annotate
  showFunctionNumbers?: boolean; // Show numbered labels on function boxes (for structure-dataflow)
  allowBaseItemDeletion?: boolean; // Override isBaseItem protection (for teacher editing)
}

export function DiagramEditor({ initialData, initialDrawing, onChange, disabled, backgroundUrl, mode = "general", baseDiagram, showFunctionNumbers = false, allowBaseItemDeletion = false }: DiagramEditorProps) {
  const [items, setItems] = useState<DiagramItem[]>(() => {
    // For ERD annotation, nav-structure, structure-dataflow, structure-diagram, or entity-occurrence mode, merge base diagram (teacher's) with student's additions
    if ((mode === "erd-annotation" || mode === "nav-structure" || mode === "nav-structure-higher" || mode === "structure-dataflow" || mode === "structure-diagram" || mode === "entity-occurrence") && baseDiagram) {
      try {
        const baseItems: DiagramItem[] = JSON.parse(baseDiagram).map((item: DiagramItem) => ({
          ...item,
          isBaseItem: true
        }));
        // If student has existing work, merge it
        if (initialData) {
          const studentItems: DiagramItem[] = JSON.parse(initialData);
          // Find items that are student additions (not in base) or have markings
          const studentAdditions = studentItems.filter(si => !baseItems.some(bi => bi.id === si.id));
          // Update base items with any markings from student data
          const mergedBase = baseItems.map(bi => {
            const studentVersion = studentItems.find(si => si.id === bi.id);
            return studentVersion ? { ...bi, marking: studentVersion.marking } : bi;
          });
          return [...mergedBase, ...studentAdditions];
        }
        return baseItems;
      } catch (e) {
        return [];
      }
    }
    if (initialData) {
      try {
        return JSON.parse(initialData);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null); // For text editing mode (double-click to enter)
  const [tool, setTool] = useState<"select" | "box" | "text" | "pencil" | "eraser" | "ellipse" | "diamond" | "parallelogram" | "cylinder" | "document" | "hexagon" | "trapezoid" | "circle" | "line" | "crowfoot" | "ui-window" | "ui-button" | "ui-input" | "ui-output" | "ui-image" | "ui-dropdown" | "bullet-text" | "numbered-text" | "link-text" | "erd-entity" | "dataflow-up" | "dataflow-down" | "ui-textarea" | "ui-radio" | "ui-checkbox" | "ui-submit" | "ui-label" | "nav-highlight" | "nav-page" | "struct-process" | "struct-decision" | "struct-loop" | "entity-oval" | "entity-occurrence" | "wf-heading" | "wf-paragraph" | "wf-audio" | "wf-video" | "wf-div" | "wf-annotation">("select");
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(null); // For ERD attribute selection
  
  // State for click-and-drag shape creation
  const [isDraggingNewShape, setIsDraggingNewShape] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [tempShape, setTempShape] = useState<DiagramItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasInitializedRef = useRef(false);
  const canvasClearedRef = useRef(false);
  const paragraphTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const isWireframeMode = mode === "webpage-wireframe" || mode === "form-wireframe";
  const defaultHeight = isWireframeMode ? 650 : 400;
  const defaultWidth = isWireframeMode ? 450 : undefined;
  
  const [containerHeight, setContainerHeight] = useState(defaultHeight);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(defaultWidth);
  
  useEffect(() => {
    if (!backgroundUrl) {
      setContainerHeight(defaultHeight);
      setContainerWidth(defaultWidth);
      return;
    }
    
    const img = new window.Image();
    img.src = backgroundUrl;
    img.onload = () => {
      const maxWidth = containerRef.current?.parentElement?.clientWidth || 800;
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;
      const aspectRatio = imgH / imgW;
      const fitWidth = Math.min(imgW, maxWidth);
      const fitHeight = Math.round(fitWidth * aspectRatio);
      setContainerWidth(fitWidth);
      setContainerHeight(fitHeight);
    };
  }, [backgroundUrl]);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");

  // Compute function numbers for boxes (sorted by position: top-to-bottom, left-to-right)
  const functionNumberMap = useMemo(() => {
    if (!showFunctionNumbers) return {};
    
    const functionBoxes = items
      .filter(i => i.type === "box")
      .sort((a, b) => {
        const yDiff = a.y - b.y;
        if (Math.abs(yDiff) > 30) return yDiff; // Different rows
        return a.x - b.x; // Same row, sort by X
      });
    
    const map: Record<string, number> = {};
    functionBoxes.forEach((box, idx) => {
      map[box.id] = idx + 1;
    });
    return map;
  }, [items, showFunctionNumbers]);

  const onChangeRef = useRef(onChange);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Notify parent of changes with debouncing to prevent text deletion during typing
  useEffect(() => {
    if (onChangeRef.current) {
      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Debounce the onChange callback to reduce processing during rapid typing
      debounceTimerRef.current = setTimeout(() => {
        if (onChangeRef.current) {
          const canvas = canvasRef.current;
          const drawingData = canvas ? canvas.toDataURL() : "";
          onChangeRef.current(JSON.stringify(items), drawingData);
        }
      }, 150); // 150ms debounce
    }
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [items]); 

  // Initialize canvas with existing drawing if provided
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !initialDrawing || canvasInitializedRef.current) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const img = new Image();
    img.src = initialDrawing;
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      canvasInitializedRef.current = true;
    };
  }, []);

  // Resize handling for canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = containerWidth || canvas.parentElement?.clientWidth || 800;
    canvas.height = containerHeight;
    
    // Only restore drawing if not cleared and initialDrawing exists
    if (initialDrawing && !canvasClearedRef.current) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
            const img = new Image();
            img.src = initialDrawing;
            img.onload = () => ctx.drawImage(img, 0, 0);
        }
    }
  }, [containerHeight, containerWidth]);


  // Helper to get the center point of a shape
  const getShapeCenter = (item: DiagramItem) => {
    const width = item.width || (item.type === "circle" ? 40 : 120);
    const height = item.height || (item.type === "circle" ? 40 : 60);
    return {
      x: item.x + width / 2,
      y: item.y + height / 2
    };
  };

  // Helper to get all anchor points for a shape (4 for regular shapes, left/right for entity-occurrence/entity-oval)
  const getShapeAnchors = (shape: DiagramItem): Array<{ x: number; y: number; side: 'top' | 'bottom' | 'left' | 'right'; shapeId: string; occurrenceId?: string }> => {
    const w = shape.width || 120;
    const h = shape.height || 50;
    
    // Entity-oval: anchors are at the occurrence dots inside the oval
    if (shape.type === "entity-oval" && shape.occurrences) {
      const anchors: Array<{ x: number; y: number; side: 'top' | 'bottom' | 'left' | 'right'; shapeId: string; occurrenceId?: string }> = [];
      const occurrenceHeight = 24;
      const startY = 30; // Matches the rendering
      const rx = w / 2; // Semi-axis x
      const ry = h / 2; // Semi-axis y
      const dotMargin = 8; // Margin from ellipse edge
      
      shape.occurrences.forEach((occ, idx) => {
        const occCenterY = startY + (idx * occurrenceHeight) + occurrenceHeight / 2;
        const dy = occCenterY - ry; // Distance from ellipse center
        const xFromCenter = rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)));
        const dotInset = rx - xFromCenter + dotMargin;
        const occY = shape.y + occCenterY;
        
        if (occ.dotPosition === "left" || occ.dotPosition === "both") {
          anchors.push({ x: shape.x + dotInset, y: occY, side: 'left' as const, shapeId: shape.id, occurrenceId: occ.id });
        }
        if (occ.dotPosition === "right" || occ.dotPosition === "both") {
          anchors.push({ x: shape.x + w - dotInset, y: occY, side: 'right' as const, shapeId: shape.id, occurrenceId: occ.id });
        }
      });
      return anchors;
    }
    
    // Entity-occurrence items only have left and right anchors based on dotPosition
    if (shape.type === "entity-occurrence") {
      const dotPos = shape.dotPosition || "left";
      const anchors: Array<{ x: number; y: number; side: 'top' | 'bottom' | 'left' | 'right'; shapeId: string }> = [];
      if (dotPos === "left" || dotPos === "both") {
        anchors.push({ x: shape.x, y: shape.y + h / 2, side: 'left' as const, shapeId: shape.id });
      }
      if (dotPos === "right" || dotPos === "both") {
        anchors.push({ x: shape.x + w, y: shape.y + h / 2, side: 'right' as const, shapeId: shape.id });
      }
      return anchors;
    }
    
    // Regular shapes have all 4 anchor points
    return [
      { x: shape.x + w / 2, y: shape.y, side: 'top' as const, shapeId: shape.id },
      { x: shape.x + w / 2, y: shape.y + h, side: 'bottom' as const, shapeId: shape.id },
      { x: shape.x, y: shape.y + h / 2, side: 'left' as const, shapeId: shape.id },
      { x: shape.x + w, y: shape.y + h / 2, side: 'right' as const, shapeId: shape.id },
    ];
  };

  // Helper to find the nearest anchor POINT (not shape) for nav-structure-higher and structure-diagram modes
  const findNearestAnchor = (x: number, y: number): { x: number; y: number; side: 'top' | 'bottom' | 'left' | 'right'; shapeId: string; occurrenceId?: string } | null => {
    const ANCHOR_SNAP_DISTANCE = 20; // Must be close to the anchor dot to snap
    let nearestAnchor: { x: number; y: number; side: 'top' | 'bottom' | 'left' | 'right'; shapeId: string; occurrenceId?: string } | null = null;
    let nearestDistance = ANCHOR_SNAP_DISTANCE;

    // Define which item types have anchor points based on mode
    const anchorableTypes = mode === "structure-diagram" 
      ? ["struct-process", "struct-decision", "struct-loop"]
      : mode === "entity-occurrence"
      ? ["entity-oval", "entity-occurrence"]
      : ["nav-page"];

    for (const item of items) {
      // Only certain items have anchor points based on mode
      if (!anchorableTypes.includes(item.type)) continue;
      
      const anchors = getShapeAnchors(item);
      for (const anchor of anchors) {
        const distance = Math.sqrt(Math.pow(x - anchor.x, 2) + Math.pow(y - anchor.y, 2));
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestAnchor = anchor;
        }
      }
    }
    
    return nearestAnchor;
  };

  // Helper to get a specific anchor point by shape ID and side
  const getAnchorByIdAndSide = (shapeId: string, side: 'top' | 'bottom' | 'left' | 'right'): { x: number; y: number } | null => {
    const shape = items.find(i => i.id === shapeId);
    if (!shape) return null;
    
    const w = shape.width || 120;
    const h = shape.height || 50;
    
    switch (side) {
      case 'top': return { x: shape.x + w / 2, y: shape.y };
      case 'bottom': return { x: shape.x + w / 2, y: shape.y + h };
      case 'left': return { x: shape.x, y: shape.y + h / 2 };
      case 'right': return { x: shape.x + w, y: shape.y + h / 2 };
    }
  };

  // Legacy helper - kept for backward compatibility with other modes
  const getNavAnchorPoint = (shape: DiagramItem, targetX: number, targetY: number): { x: number; y: number; side: 'top' | 'bottom' | 'left' | 'right' } => {
    const w = shape.width || 120;
    const h = shape.height || 50;
    const centerX = shape.x + w / 2;
    const centerY = shape.y + h / 2;
    const shapeLeft = shape.x;
    const shapeRight = shape.x + w;
    const shapeTop = shape.y;
    const shapeBottom = shape.y + h;
    
    const dx = targetX - centerX;
    const dy = targetY - centerY;
    const isHorizontallyAligned = targetX >= shapeLeft - 20 && targetX <= shapeRight + 20;
    
    if (dy > 0) {
      if (isHorizontallyAligned) {
        return { x: centerX, y: shapeBottom, side: 'bottom' };
      } else {
        return { x: shapeLeft, y: centerY, side: 'left' };
      }
    } else if (dy < 0) {
      if (isHorizontallyAligned) {
        return { x: centerX, y: shapeTop, side: 'top' };
      } else {
        return { x: shapeLeft, y: centerY, side: 'left' };
      }
    } else {
      if (dx > 0) {
        return { x: shapeRight, y: centerY, side: 'right' };
      } else {
        return { x: shapeLeft, y: centerY, side: 'left' };
      }
    }
  };

  // Helper to get edge anchor point for dataflow arrows
  // Both arrows connect to BOTTOM edge of the box
  // Input arrows (up) connect to LEFT side of bottom edge
  // Output arrows (down) connect to RIGHT side of bottom edge
  const getDataflowEdgeAnchor = (box: DiagramItem, direction: "up" | "down") => {
    const width = box.width || 120;
    const height = box.height || 60;
    const bottomY = box.y + height;
    
    if (direction === "up") {
      // Data IN: left side of bottom edge
      return { x: box.x + width * 0.25, y: bottomY };
    } else {
      // Data OUT: right side of bottom edge
      return { x: box.x + width * 0.75, y: bottomY };
    }
  };

  // Helper to find which function box an arrow is connected to based on horizontal overlap
  // Both arrow types connect to the bottom edge of boxes
  const findFunctionBoxForArrow = (arrowX: number, arrowY: number) => {
    const TOLERANCE = 50; // Vertical tolerance for detecting connection
    
    for (const item of items) {
      // Only consider box types (function rectangles)
      if (item.type !== "box") continue;
      
      const width = item.width || 120;
      const height = item.height || 60;
      
      // Check horizontal overlap: arrow X is within the box's horizontal bounds
      const inHorizontalBounds = arrowX >= item.x && arrowX <= item.x + width;
      
      if (!inHorizontalBounds) continue;
      
      // Check if arrow is near or below the bottom edge of the box
      const bottomEdge = item.y + height;
      if (arrowY >= bottomEdge - TOLERANCE && arrowY <= bottomEdge + 120) {
        return item;
      }
    }
    
    return null;
  };

  // Helper to calculate where a line from center to a point intersects the shape edge
  const getEdgeIntersection = (shape: DiagramItem, targetX: number, targetY: number) => {
    const width = shape.width || (shape.type === "circle" ? 40 : 120);
    const height = shape.height || (shape.type === "circle" ? 40 : 60);
    const centerX = shape.x + width / 2;
    const centerY = shape.y + height / 2;
    
    // Direction vector from center to target
    const dx = targetX - centerX;
    const dy = targetY - centerY;
    
    if (dx === 0 && dy === 0) {
      return { x: centerX, y: centerY };
    }
    
    // For circles/ellipses, use parametric intersection
    if (shape.type === "circle" || shape.type === "ellipse") {
      const rx = width / 2;
      const ry = height / 2;
      const angle = Math.atan2(dy, dx);
      return {
        x: centerX + rx * Math.cos(angle),
        y: centerY + ry * Math.sin(angle)
      };
    }
    
    // For rectangles and other shapes, find intersection with bounding box
    const halfW = width / 2;
    const halfH = height / 2;
    
    // Calculate intersection with each edge
    let t = Infinity;
    
    // Right edge
    if (dx > 0) {
      const tRight = halfW / dx;
      if (tRight < t && Math.abs(dy * tRight) <= halfH) t = tRight;
    }
    // Left edge
    if (dx < 0) {
      const tLeft = -halfW / dx;
      if (tLeft < t && Math.abs(dy * tLeft) <= halfH) t = tLeft;
    }
    // Bottom edge
    if (dy > 0) {
      const tBottom = halfH / dy;
      if (tBottom < t && Math.abs(dx * tBottom) <= halfW) t = tBottom;
    }
    // Top edge
    if (dy < 0) {
      const tTop = -halfH / dy;
      if (tTop < t && Math.abs(dx * tTop) <= halfW) t = tTop;
    }
    
    if (t === Infinity) t = 1;
    
    return {
      x: centerX + dx * t,
      y: centerY + dy * t
    };
  };

  // Helper to find the nearest shape to a point (for snapping)
  const findNearestShape = (x: number, y: number, excludeTypes: string[] = ["line", "crowfoot", "text", "bullet-text", "numbered-text", "link-text"]) => {
    // Use tighter snap distance for nav-structure-higher and structure-diagram modes
    const SNAP_DISTANCE = (mode === "nav-structure-higher" || mode === "structure-diagram" || mode === "entity-occurrence") ? 25 : 60;
    const expandedBounds = (mode === "nav-structure-higher" || mode === "structure-diagram" || mode === "entity-occurrence") ? 8 : 20;
    
    let nearestShape: DiagramItem | null = null;
    let nearestDistance = SNAP_DISTANCE;

    for (const item of items) {
      if (excludeTypes.includes(item.type)) continue;
      
      // Check if point is inside or near the shape bounds
      const width = item.width || (item.type === "circle" ? 40 : 120);
      const height = item.height || (item.type === "circle" ? 40 : 60);
      const center = getShapeCenter(item);
      
      // Check if within expanded bounds
      const inBounds = x >= item.x - expandedBounds && 
                       x <= item.x + width + expandedBounds &&
                       y >= item.y - expandedBounds && 
                       y <= item.y + height + expandedBounds;
      
      if (inBounds) {
        const distance = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2));
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestShape = item;
        }
      }
    }
    
    return nearestShape;
  };

  const addItem = (type: DiagramItem["type"], x: number, y: number, width?: number, height?: number, x2?: number, y2?: number, connectedTo1?: string, connectedTo2?: string, anchor1Side?: 'top' | 'bottom' | 'left' | 'right', anchor2Side?: 'top' | 'bottom' | 'left' | 'right') => {
    const isTextType = type === "text" || type === "bullet-text" || type === "numbered-text" || type === "link-text";
    const isShape = !isTextType;
    const isLineType = type === "line" || type === "crowfoot";
    const isErdEntity = type === "erd-entity";
    const getDefaultContent = () => {
      if (type === "text") return "Label";
      if (type === "bullet-text") return "Bullet point";
      if (type === "numbered-text") return "Numbered item";
      if (type === "link-text") return "Underlined text";
      if (type === "ui-label") return "Label:";
      if (type === "ui-submit") return "Submit";
      if (type === "ui-radio") return "Option";
      if (type === "ui-checkbox") return "Check this";
      if (type === "nav-page") return "Page Name";
      if (type === "struct-process") return "Process";
      if (type === "struct-decision") return "Decision";
      if (type === "struct-loop") return "Loop";
      if (type === "entity-oval") return undefined; // Entity title is separate text
      if (type === "entity-occurrence") return "Occurrence";
      if (type === "wf-heading") return "Heading";
      if (type === "wf-paragraph") return undefined;
      if (type === "wf-audio") return "audio.mp3";
      if (type === "wf-video") return "video.mp4";
      if (type === "wf-div") return undefined;
      if (type === "wf-annotation") return "annotation";
      return undefined;
    };
    const getDefaultWidth = () => {
      if (width) return width;
      if (isErdEntity) return 150;
      if (type === "circle") return 40;
      if (type === "ui-label") return 80;
      if (type === "ui-radio" || type === "ui-checkbox") return 120;
      if (type === "ui-submit") return 100;
      if (type === "ui-textarea") return 200;
      if (type === "nav-page") return 120;
      if (type === "nav-highlight") return 400;
      if (type === "struct-process") return 100;
      if (type === "struct-decision") return 80;
      if (type === "struct-loop") return 100;
      if (type === "entity-oval") return 140; // Tall oval width (min to fit text and dots)
      if (type === "entity-occurrence") return 80; // Occurrence width
      if (type === "wf-heading") return 200;
      if (type === "wf-paragraph") return 250;
      if (type === "wf-audio") return 250;
      if (type === "wf-video") return 200;
      if (type === "wf-div") return 150;
      if (type === "wf-annotation") return 100;
      if (type === "bullet-text") return 200;
      if (type === "numbered-text") return 200;
      if (type === "link-text") return 150;
      if (isShape) return 120;
      return undefined;
    };
    const getDefaultHeight = () => {
      if (height) return height;
      if (isErdEntity) return 120;
      if (type === "circle") return 40;
      if (type === "ui-label") return 24;
      if (type === "ui-input") return 28; // Compact input field height
      if (type === "ui-dropdown") return 28; // Compact dropdown height
      if (type === "ui-radio" || type === "ui-checkbox") return 24;
      if (type === "ui-submit") return 36;
      if (type === "ui-textarea") return 80;
      if (type === "nav-page") return 50;
      if (type === "nav-highlight") return 150;
      if (type === "struct-process") return 40;
      if (type === "struct-decision") return 50;
      if (type === "struct-loop") return 40;
      if (type === "entity-oval") return 200; // Tall oval height
      if (type === "entity-occurrence") return 20; // Occurrence height
      if (type === "wf-heading") return 36;
      if (type === "wf-paragraph") return 80;
      if (type === "wf-audio") return 40;
      if (type === "wf-video") return 150;
      if (type === "wf-div") return 100;
      if (type === "wf-annotation") return 20;
      if (type === "bullet-text") return 30;
      if (type === "numbered-text") return 30;
      if (type === "link-text") return 28;
      if (isShape) return 60;
      return undefined;
    };
    const newItemId = Math.random().toString(36).substring(7);
    const isFormInputType = type === "ui-input" || type === "ui-textarea" || type === "ui-dropdown";
    const shouldCreatePairedLabel = mode === "form-wireframe" && isFormInputType;
    const isEntityOval = type === "entity-oval";
    
    // Create paired label for form input elements in form-wireframe mode
    let pairedLabelId: string | undefined = undefined;
    let pairedLabel: DiagramItem | undefined = undefined;
    
    if (shouldCreatePairedLabel) {
      pairedLabelId = Math.random().toString(36).substring(7);
      const labelWidth = 80;
      const labelHeight = 24;
      const labelOffsetX = -(labelWidth + 4); // 4px gap between label and input
      const labelOffsetY = ((getDefaultHeight() || 30) - labelHeight) / 2; // Vertically center the label
      
      pairedLabel = {
        id: pairedLabelId,
        type: "ui-label",
        x: x + labelOffsetX,
        y: y + labelOffsetY,
        width: labelWidth,
        height: labelHeight,
        content: "Label:",
        pairedFieldId: newItemId,
        pairOffsetX: labelOffsetX,
        pairOffsetY: labelOffsetY,
      };
    }
    
    // Create linked title for entity-oval
    let linkedTitleId: string | undefined = undefined;
    let linkedTitle: DiagramItem | undefined = undefined;
    
    if (isEntityOval) {
      linkedTitleId = Math.random().toString(36).substring(7);
      const entityWidth = getDefaultWidth() || 140;
      const titleWidth = entityWidth;
      const titleHeight = 24;
      
      linkedTitle = {
        id: linkedTitleId,
        type: "text",
        x: x, // Aligned with entity left edge
        y: y - titleHeight - 8, // Position above the entity
        width: titleWidth,
        height: titleHeight,
        content: "Entity",
        textAlign: "center",
        isBold: true,
        parentEntityId: newItemId, // Link title to entity
      };
    }
    
    const newItem: DiagramItem = {
      id: newItemId,
      type,
      x,
      y,
      content: getDefaultContent(),
      width: getDefaultWidth(),
      height: getDefaultHeight(),
      x2: isLineType ? (x2 ?? x + 100) : undefined,
      y2: isLineType ? (y2 ?? y) : undefined,
      connectedTo1: isLineType ? connectedTo1 : undefined,
      connectedTo2: isLineType ? connectedTo2 : undefined,
      anchor1Side: isLineType ? anchor1Side : undefined,
      anchor2Side: isLineType ? anchor2Side : undefined,
      entityName: isErdEntity ? "Entity" : undefined,
      attributes: isErdEntity ? [{ id: "attr1", name: "attribute1", marking: "none" }] : undefined,
      relationshipLabel: isLineType ? "" : undefined,
      pairedLabelId: shouldCreatePairedLabel ? pairedLabelId : undefined,
      // Entity oval specific fields
      linkedTitleId: isEntityOval ? linkedTitleId : undefined,
      occurrences: isEntityOval ? [
        { id: Math.random().toString(36).substring(7), text: "occurrence 1", dotPosition: "left" as const },
        { id: Math.random().toString(36).substring(7), text: "occurrence 2", dotPosition: "right" as const }
      ] : undefined,
    };
    
    // Add both items atomically
    if (pairedLabel) {
      setItems((prev) => [...prev, pairedLabel!, newItem]);
    } else if (linkedTitle) {
      setItems((prev) => [...prev, linkedTitle!, newItem]);
    } else {
      setItems((prev) => [...prev, newItem]);
    }
    setSelectedId(newItem.id);
    setTool("select");
  };

  // Add a dataflow arrow (up = data IN to function, down = data OUT from function)
  const addDataflowArrow = (x: number, y: number, x2: number, y2: number, direction: "up" | "down", originFunctionId?: string) => {
    const newItem: DiagramItem = {
      id: Math.random().toString(36).substring(7),
      type: "dataflow-arrow",
      x,
      y,
      x2,
      y2,
      dataflowDirection: direction,
      originFunctionId,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
    setTool("select");
  };

  // Handle click-and-drag shape creation
  const handleShapeMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    if (tool === "select" || tool === "pencil" || tool === "eraser") return;
    if ((e.target as HTMLElement).closest(".diagram-item")) return;
    
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDraggingNewShape(true);
    setDragStart({ x, y });
    
    // Create temp shape for visual feedback
    const tempId = "temp-" + Math.random().toString(36).substring(7);
    const isLineType = tool === "line" || tool === "crowfoot" || tool === "dataflow-up" || tool === "dataflow-down";
    setTempShape({
      id: tempId,
      type: isLineType && (tool === "dataflow-up" || tool === "dataflow-down") ? "dataflow-arrow" : tool as DiagramItem["type"],
      x,
      y,
      width: 10,
      height: 10,
      x2: isLineType ? x : undefined,
      y2: isLineType ? y : undefined,
    });
  };
  
  const handleShapeMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingNewShape || !dragStart || !tempShape) return;
    
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const isLineType = tool === "line" || tool === "crowfoot" || tool === "dataflow-up" || tool === "dataflow-down";
    if (isLineType) {
      let x1 = tempShape.x;
      let y1 = tempShape.y;
      let x2 = currentX;
      let y2 = currentY;
      
      if (mode === "nav-structure-higher" || mode === "structure-diagram" || mode === "entity-occurrence") {
        // For nav-structure-higher, structure-diagram, and entity-occurrence: snap directly to anchor POINTS
        const startAnchor = findNearestAnchor(tempShape.x, tempShape.y);
        const endAnchor = findNearestAnchor(currentX, currentY);
        
        if (startAnchor && dragStart) {
          x1 = startAnchor.x;
          y1 = startAnchor.y;
        }
        if (endAnchor) {
          x2 = endAnchor.x;
          y2 = endAnchor.y;
        }
      } else {
        // Other modes: snap to shape centers
        const startShape = findNearestShape(tempShape.x, tempShape.y);
        const endShape = findNearestShape(currentX, currentY);
        
        if (startShape && dragStart) {
          const center = getShapeCenter(startShape);
          x1 = center.x;
          y1 = center.y;
        }
        if (endShape) {
          const center = getShapeCenter(endShape);
          x2 = center.x;
          y2 = center.y;
        }
      }
      
      setTempShape({
        ...tempShape,
        x: x1,
        y: y1,
        x2: x2,
        y2: y2,
      });
    } else {
      const width = Math.abs(currentX - dragStart.x);
      const height = Math.abs(currentY - dragStart.y);
      const x = Math.min(dragStart.x, currentX);
      const y = Math.min(dragStart.y, currentY);
      
      setTempShape({
        ...tempShape,
        x,
        y,
        width: Math.max(20, width),
        height: Math.max(20, height),
      });
    }
  };
  
  const handleShapeMouseUp = (e: React.MouseEvent) => {
    if (!isDraggingNewShape || !dragStart || !tempShape) {
      setIsDraggingNewShape(false);
      setDragStart(null);
      setTempShape(null);
      return;
    }
    
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const isLineType = tool === "line" || tool === "crowfoot" || tool === "dataflow-up" || tool === "dataflow-down";
    if (isLineType) {
      let startX = dragStart.x;
      let startY = dragStart.y;
      let endX = currentX;
      let endY = currentY;
      let connectedTo1: string | undefined;
      let connectedTo2: string | undefined;
      let anchor1Side: 'top' | 'bottom' | 'left' | 'right' | undefined;
      let anchor2Side: 'top' | 'bottom' | 'left' | 'right' | undefined;
      
      if (mode === "nav-structure-higher" || mode === "structure-diagram" || mode === "entity-occurrence") {
        // For nav-structure-higher, structure-diagram, and entity-occurrence: snap directly to anchor POINTS and store anchor sides
        const startAnchor = findNearestAnchor(dragStart.x, dragStart.y);
        const endAnchor = findNearestAnchor(currentX, currentY);
        
        if (startAnchor) {
          startX = startAnchor.x;
          startY = startAnchor.y;
          // For entity-occurrence mode with occurrence anchors, store as "entityId-occ-occurrenceId"
          if (startAnchor.occurrenceId) {
            connectedTo1 = `${startAnchor.shapeId}-occ-${startAnchor.occurrenceId}`;
          } else {
            connectedTo1 = startAnchor.shapeId;
          }
          anchor1Side = startAnchor.side;
        }
        if (endAnchor) {
          endX = endAnchor.x;
          endY = endAnchor.y;
          // For entity-occurrence mode with occurrence anchors, store as "entityId-occ-occurrenceId"
          if (endAnchor.occurrenceId) {
            connectedTo2 = `${endAnchor.shapeId}-occ-${endAnchor.occurrenceId}`;
          } else {
            connectedTo2 = endAnchor.shapeId;
          }
          anchor2Side = endAnchor.side;
        }
      } else {
        // Other modes: snap to shape centers
        const startShape = findNearestShape(dragStart.x, dragStart.y);
        const endShape = findNearestShape(currentX, currentY);
        
        if (startShape) {
          const center = getShapeCenter(startShape);
          startX = center.x;
          startY = center.y;
          connectedTo1 = startShape.id;
        }
        if (endShape) {
          const center = getShapeCenter(endShape);
          endX = center.x;
          endY = center.y;
          connectedTo2 = endShape.id;
        }
      }
      
      // For dataflow arrows, use edge-based positioning
      if (tool === "dataflow-up" || tool === "dataflow-down") {
        const direction = tool === "dataflow-up" ? "up" : "down";
        
        // Find function box based on horizontal overlap at the arrow position
        const functionBox = findFunctionBoxForArrow(startX, startY) || 
                           findFunctionBoxForArrow(endX, endY);
        
        const arrowLength = 50;
        let arrowX1: number, arrowY1: number, arrowX2: number, arrowY2: number;
        
        if (functionBox) {
          // Snap arrow to edge of function box (bottom edge, left for IN, right for OUT)
          const edgeAnchor = getDataflowEdgeAnchor(functionBox, direction);
          
          if (direction === "up") {
            // Data IN: arrow points UP into function (from below to bottom edge)
            arrowX1 = edgeAnchor.x;
            arrowY1 = edgeAnchor.y + arrowLength;
            arrowX2 = edgeAnchor.x;
            arrowY2 = edgeAnchor.y;
          } else {
            // Data OUT: arrow points DOWN from function (from bottom edge downward)
            arrowX1 = edgeAnchor.x;
            arrowY1 = edgeAnchor.y;
            arrowX2 = edgeAnchor.x;
            arrowY2 = edgeAnchor.y + arrowLength;
          }
          
          // Create the arrow
          const arrowId = Math.random().toString(36).substring(7);
          const newArrow: DiagramItem = {
            id: arrowId,
            type: "dataflow-arrow",
            x: arrowX1,
            y: arrowY1,
            x2: arrowX2,
            y2: arrowY2,
            dataflowDirection: direction,
            originFunctionId: functionBox.id,
          };
          
          // Create a label below the arrow
          const labelX = arrowX1 - 30;
          const labelY = Math.max(arrowY1, arrowY2) + 10;
          const newLabel: DiagramItem = {
            id: Math.random().toString(36).substring(7),
            type: "text",
            x: labelX,
            y: labelY,
            content: "",
            attachedArrowId: arrowId,
          };
          
          setItems((prev) => [...prev, newArrow, newLabel]);
          setSelectedId(newLabel.id);
          setTool("select");
        } else {
          // No function box found, place arrow where user drew with label below
          const arrowId = Math.random().toString(36).substring(7);
          const newArrow: DiagramItem = {
            id: arrowId,
            type: "dataflow-arrow",
            x: startX,
            y: startY,
            x2: endX,
            y2: endY,
            dataflowDirection: direction,
          };
          
          const labelX = startX - 30;
          const labelY = Math.max(startY, endY) + 10;
          const newLabel: DiagramItem = {
            id: Math.random().toString(36).substring(7),
            type: "text",
            x: labelX,
            y: labelY,
            content: "",
            attachedArrowId: arrowId,
          };
          
          setItems((prev) => [...prev, newArrow, newLabel]);
          setSelectedId(newLabel.id);
          setTool("select");
        }
      } else {
        addItem(tool, startX, startY, undefined, undefined, endX, endY, connectedTo1, connectedTo2, anchor1Side, anchor2Side);
      }
    } else {
      const width = Math.abs(currentX - dragStart.x);
      const height = Math.abs(currentY - dragStart.y);
      const x = Math.min(dragStart.x, currentX);
      const y = Math.min(dragStart.y, currentY);
      
      // Only add if dragged enough
      if (width > 10 || height > 10) {
        addItem(tool as DiagramItem["type"], x, y, Math.max(40, width), Math.max(30, height));
      } else {
        // Small click - add with default size
        addItem(tool as DiagramItem["type"], dragStart.x, dragStart.y);
      }
    }
    
    setIsDraggingNewShape(false);
    setDragStart(null);
    setTempShape(null);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (disabled) return;
    
    // Handle select tool clicks
    if (tool === "select") {
       if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains("diagram-bg") || (e.target as HTMLElement).tagName === "CANVAS") {
         setSelectedId(null);
         setEditingItemId(null); // Exit edit mode when clicking outside
       }
       return;
    }
    
    // Shape creation is now handled by mouse down/up for drag
    // Drawing tools are handled by canvas events
  };

  const updateItem = (id: string, updates: Partial<DiagramItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteItem = (id: string) => {
    // In annotation mode, prevent deleting base items (unless teacher override)
    const item = items.find(i => i.id === id);
    if (mode === "erd-annotation" && item?.isBaseItem && !allowBaseItemDeletion) {
      return; // Can't delete teacher's base diagram items
    }
    
    // Cascade delete paired items (for form-wireframe) and linked titles (for entity-oval)
    const idsToDelete = new Set([id]);
    if (item?.pairedLabelId) {
      idsToDelete.add(item.pairedLabelId);
    }
    if (item?.pairedFieldId) {
      idsToDelete.add(item.pairedFieldId);
    }
    // For entity-oval: delete linked title when deleting the entity
    if (item?.linkedTitleId) {
      idsToDelete.add(item.linkedTitleId);
    }
    // Note: Deleting a linked title does NOT delete the parent entity
    // Only deleting the entity deletes the title, not vice versa
    
    setItems((prev) => prev.filter((item) => !idsToDelete.has(item.id)));
    setSelectedId(null);
  };

  // Toggle PK/FK marking on items (for annotation mode)
  const toggleMarking = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const currentMarking = item.marking || "none";
        const nextMarking = currentMarking === "none" ? "primary" : 
                           currentMarking === "primary" ? "foreign" : "none";
        return { ...item, marking: nextMarking };
      }
      return item;
    }));
  };

  // ERD Entity attribute management
  const addAttributeToEntity = (entityId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === entityId && item.type === "erd-entity") {
        const newAttr: ErdAttribute = {
          id: Math.random().toString(36).substring(7),
          name: "",
          marking: "none"
        };
        return { ...item, attributes: [...(item.attributes || []), newAttr] };
      }
      return item;
    }));
  };

  const updateEntityAttribute = (entityId: string, attrId: string, updates: Partial<ErdAttribute>) => {
    setItems(prev => prev.map(item => {
      if (item.id === entityId && item.type === "erd-entity") {
        return {
          ...item,
          attributes: (item.attributes || []).map(attr =>
            attr.id === attrId ? { ...attr, ...updates } : attr
          )
        };
      }
      return item;
    }));
  };

  const deleteEntityAttribute = (entityId: string, attrId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === entityId && item.type === "erd-entity") {
        return {
          ...item,
          attributes: (item.attributes || []).filter(attr => attr.id !== attrId)
        };
      }
      return item;
    }));
  };

  const toggleAttributeMarking = (entityId: string, attrId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === entityId && item.type === "erd-entity") {
        return {
          ...item,
          attributes: (item.attributes || []).map(attr => {
            if (attr.id === attrId) {
              const nextMarking = attr.marking === "none" ? "primary" : 
                                 attr.marking === "primary" ? "foreign" : "none";
              return { ...attr, marking: nextMarking };
            }
            return attr;
          })
        };
      }
      return item;
    }));
  };

  // Clipboard state for copy/paste
  const [clipboardItem, setClipboardItem] = useState<DiagramItem | null>(null);

  // Keyboard shortcuts for delete, copy, paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const isInEditMode = editingItemId !== null;
        
        const activeEl = document.activeElement;
        const isTypingInInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && containerRef.current?.contains(activeEl);
        
        if (e.key === 'Escape' && isInEditMode) {
            setEditingItemId(null);
            containerRef.current?.focus();
            return;
        }
        
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !disabled) {
            if (isInEditMode || isTypingInInput) {
                return;
            }
            deleteItem(selectedId);
        }
        
        // Copy shortcut (Ctrl+C / Cmd+C)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedId && !disabled) {
            if (isInEditMode || isTypingInInput) {
                return; // Allow normal text copy
            }
            e.preventDefault();
            const itemToCopy = items.find(i => i.id === selectedId);
            if (itemToCopy) {
                setClipboardItem({ ...itemToCopy });
            }
        }
        
        // Paste shortcut (Ctrl+V / Cmd+V)
        if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardItem && !disabled) {
            if (isInEditMode || isTypingInInput) {
                return; // Allow normal text paste
            }
            e.preventDefault();
            
            // Create a new item with offset position and new ID
            const newId = Math.random().toString(36).substring(7);
            const pastedItem: DiagramItem = {
                ...clipboardItem,
                id: newId,
                x: clipboardItem.x + 20,
                y: clipboardItem.y + 20,
                isBaseItem: false, // Pasted items are never base items
            };
            
            // If it's an ERD entity, also regenerate attribute IDs
            if (pastedItem.type === "erd-entity" && pastedItem.attributes) {
                pastedItem.attributes = pastedItem.attributes.map(attr => ({
                    ...attr,
                    id: Math.random().toString(36).substring(7)
                }));
            }
            
            setItems(prev => [...prev, pastedItem]);
            setSelectedId(newId);
            
            // Update clipboard position for subsequent pastes
            setClipboardItem({ ...clipboardItem, x: clipboardItem.x + 20, y: clipboardItem.y + 20 });
        }
        
        // Duplicate shortcut (Ctrl+D / Cmd+D)
        if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId && !disabled) {
            if (isInEditMode || isTypingInInput) {
                return;
            }
            e.preventDefault();
            const itemToDuplicate = items.find(i => i.id === selectedId);
            if (itemToDuplicate) {
                const newId = Math.random().toString(36).substring(7);
                const duplicatedItem: DiagramItem = {
                    ...itemToDuplicate,
                    id: newId,
                    x: itemToDuplicate.x + 20,
                    y: itemToDuplicate.y + 20,
                    isBaseItem: false,
                };
                
                if (duplicatedItem.type === "erd-entity" && duplicatedItem.attributes) {
                    duplicatedItem.attributes = duplicatedItem.attributes.map(attr => ({
                        ...attr,
                        id: Math.random().toString(36).substring(7)
                    }));
                }
                
                setItems(prev => [...prev, duplicatedItem]);
                setSelectedId(newId);
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, disabled, items, clipboardItem, editingItemId]);

  // Double-click to enter text editing mode
  const handleDoubleClick = (e: React.MouseEvent, id: string) => {
    if (disabled) return;
    e.stopPropagation();
    setEditingItemId(id);
  };

  // Drag logic for items
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (disabled || tool !== "select") return;
    e.stopPropagation();
    // If clicking a different item, exit edit mode
    if (selectedId !== id) {
      setEditingItemId(null);
    }
    setSelectedId(id);
    // Focus container to enable keyboard shortcuts
    containerRef.current?.focus();

    const startX = e.clientX;
    const startY = e.clientY;
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const initialX = item.x;
    const initialY = item.y;

    // Find paired item if exists (for form-wireframe paired label/field)
    const pairedId = item.pairedLabelId || item.pairedFieldId;
    const pairedItem = pairedId ? items.find(i => i.id === pairedId) : null;
    const pairedInitialX = pairedItem?.x || 0;
    const pairedInitialY = pairedItem?.y || 0;

    // Find linked title if exists (for entity-oval)
    const linkedTitleId = item.linkedTitleId;
    const linkedTitle = linkedTitleId ? items.find(i => i.id === linkedTitleId) : null;
    const linkedTitleInitialX = linkedTitle?.x || 0;
    const linkedTitleInitialY = linkedTitle?.y || 0;

    // Also find any linked titles that reference this entity (via parentEntityId)
    const linkedByParentId = items.find(i => i.parentEntityId === id);
    const linkedByParentInitialX = linkedByParentId?.x || 0;
    const linkedByParentInitialY = linkedByParentId?.y || 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      // Update the item position (and paired/linked items if exist)
      setItems(prev => prev.map(i => {
        if (i.id === id) {
          return { ...i, x: initialX + dx, y: initialY + dy };
        }
        // Move paired item together (form-wireframe)
        if (pairedId && i.id === pairedId) {
          return { ...i, x: pairedInitialX + dx, y: pairedInitialY + dy };
        }
        // Move linked title together (entity-oval)
        if (linkedTitleId && i.id === linkedTitleId) {
          return { ...i, x: linkedTitleInitialX + dx, y: linkedTitleInitialY + dy };
        }
        // Move items linked by parentEntityId
        if (linkedByParentId && i.id === linkedByParentId.id) {
          return { ...i, x: linkedByParentInitialX + dx, y: linkedByParentInitialY + dy };
        }
        // Update connected lines
        if (i.type === "line") {
          const movedItem = { ...item, x: initialX + dx, y: initialY + dy };
          const newCenter = getShapeCenter(movedItem);
          
          if (i.connectedTo1 === id) {
            return { ...i, x: newCenter.x, y: newCenter.y };
          }
          if (i.connectedTo2 === id) {
            return { ...i, x2: newCenter.x, y2: newCenter.y };
          }
        }
        return i;
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Resize logic for items
  const handleResizeMouseDown = (e: React.MouseEvent, id: string, corner: string) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const item = items.find((i) => i.id === id);
    if (!item) return;
    
    const initialWidth = item.width || 120;
    const initialHeight = item.height || 60;
    const initialX = item.x;
    const initialY = item.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      let newWidth = initialWidth;
      let newHeight = initialHeight;
      let newX = initialX;
      let newY = initialY;
      
      // Minimum width for entity-oval to fit text and dots inside
      const minWidth = item.type === "entity-oval" ? 140 : 60;

      if (corner.includes("e")) newWidth = Math.max(minWidth, initialWidth + dx);
      if (corner.includes("w")) {
        newWidth = Math.max(minWidth, initialWidth - dx);
        newX = initialX + (initialWidth - newWidth);
      }
      if (corner.includes("s")) newHeight = Math.max(40, initialHeight + dy);
      if (corner.includes("n")) {
        newHeight = Math.max(40, initialHeight - dy);
        newY = initialY + dy;
      }

      updateItem(id, { width: newWidth, height: newHeight, x: newX, y: newY });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Canvas Drawing Logic
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const rect = canvas.getBoundingClientRect();
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || (tool !== "pencil" && tool !== "eraser")) return;
    
    // If touching an item, don't draw
    if ((e.target as HTMLElement).closest(".diagram-item")) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    setIsDrawing(true);
    
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || (tool !== "pencil" && tool !== "eraser")) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    
    ctx.lineWidth = tool === "eraser" ? 20 : 2;
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Trigger change update
    if (onChange && canvasRef.current) {
        onChange(JSON.stringify(items), canvasRef.current.toDataURL());
    }
  };

  const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              canvasClearedRef.current = true;
              if (onChange) onChange(JSON.stringify(items), canvas.toDataURL());
          }
      }
  };

  // Helper to render shape SVG paths
  const renderShape = (type: DiagramItem["type"], width: number, height: number) => {
    const strokeWidth = 2;
    const stroke = "#262626"; // neutral-800
    const fill = "rgba(255, 255, 255, 0.9)";

    switch (type) {
        case "box":
            return <rect x={strokeWidth} y={strokeWidth} width={width - strokeWidth * 2} height={height - strokeWidth * 2} rx="2" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
        case "ellipse": // Terminator (Pill shape)
            return <rect x={strokeWidth} y={strokeWidth} width={width - strokeWidth * 2} height={height - strokeWidth * 2} rx={height / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
        case "circle": // Connector
            return <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) / 2 - strokeWidth} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
        case "diamond": // Decision
            return <polygon points={`${width/2},${strokeWidth} ${width-strokeWidth},${height/2} ${width/2},${height-strokeWidth} ${strokeWidth},${height/2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
        case "parallelogram": // Input/Output
            // Skew by 20 degrees approx
            const skew = 20;
            return <polygon points={`${skew + strokeWidth},${strokeWidth} ${width - strokeWidth},${strokeWidth} ${width - skew - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
        case "cylinder": // Database
            // Ellipse at top, vertical lines, half ellipse at bottom
            const ry = height * 0.15;
            return (
                <>
                    <path d={`M${strokeWidth},${ry + strokeWidth} v${height - 2 * ry - 2 * strokeWidth} a${width / 2 - strokeWidth},${ry} 0 0 0 ${width - 2 * strokeWidth},0 v-${height - 2 * ry - 2 * strokeWidth}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                    <ellipse cx={width / 2} cy={ry + strokeWidth} rx={width / 2 - strokeWidth} ry={ry} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                </>
            );
        case "document": // Document (wave bottom)
            // Rect with wave at bottom
            const waveHeight = 10;
            return (
               <path d={`M${strokeWidth},${strokeWidth} h${width - 2*strokeWidth} v${height - waveHeight - 2*strokeWidth} 
                        q-${(width-2*strokeWidth)/4},${waveHeight} -${(width-2*strokeWidth)/2},0 
                        t-${(width-2*strokeWidth)/2},0 z`} 
                        fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            );
        case "hexagon": // Preparation
             // Pointy sides
             const pointWidth = 15;
             return <polygon points={`${pointWidth},${strokeWidth} ${width-pointWidth},${strokeWidth} ${width-strokeWidth},${height/2} ${width-pointWidth},${height-strokeWidth} ${pointWidth},${height-strokeWidth} ${strokeWidth},${height/2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
        case "trapezoid": // Manual Input
             const indent = 20;
             return <polygon points={`${strokeWidth},${strokeWidth} ${width-strokeWidth},${strokeWidth} ${width-indent},${height-strokeWidth} ${indent},${height-strokeWidth}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
        case "struct-process": // Structure diagram: Process (rectangle)
            return <rect x={strokeWidth} y={strokeWidth} width={width - strokeWidth * 2} height={height - strokeWidth * 2} rx="2" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
        case "struct-decision": // Structure diagram: Decision (diamond)
            return <polygon points={`${width/2},${strokeWidth} ${width-strokeWidth},${height/2} ${width/2},${height-strokeWidth} ${strokeWidth},${height/2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
        case "struct-loop": // Structure diagram: Loop (ellipse/oval)
            return <ellipse cx={width / 2} cy={height / 2} rx={width / 2 - strokeWidth} ry={height / 2 - strokeWidth} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
        case "entity-oval": // Entity occurrence: Tall oval entity
            return <ellipse cx={width / 2} cy={height / 2} rx={width / 2 - strokeWidth} ry={height / 2 - strokeWidth} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
        case "line":
             return null; // Lines are rendered separately
        default:
            return null;
    }
  };

  // Helper to render shape styles (Legacy/UI only now)
  const getShapeClasses = (type: DiagramItem["type"]) => {
    switch (type) {
      case "ui-window":
        return "border-2 border-neutral-400 bg-neutral-50 shadow-md flex-col !justify-start !items-stretch rounded-md overflow-hidden";
      case "ui-button":
        return "border border-neutral-400 bg-neutral-200 rounded shadow-sm hover:bg-neutral-300";
      case "ui-input":
        return "border border-neutral-400 bg-white rounded shadow-sm !justify-start pl-2";
      case "ui-output":
        return "border-2 border-neutral-500 bg-neutral-100 rounded shadow-sm";
      case "ui-image":
        return "border border-neutral-300 bg-neutral-100 flex-col gap-2";
      case "ui-dropdown":
        return "border border-neutral-400 bg-white rounded shadow-sm !justify-between px-2";
      case "ui-textarea":
        return "border border-neutral-400 bg-white rounded shadow-sm !justify-start !items-start p-2";
      case "ui-radio":
        return "bg-transparent !justify-start gap-2";
      case "ui-checkbox":
        return "bg-transparent !justify-start gap-2";
      case "ui-submit":
        return "border border-blue-500 bg-blue-500 text-white rounded shadow-sm font-semibold";
      case "ui-label":
        return "bg-transparent !justify-start";
      case "nav-page":
        return "border-2 border-blue-600 bg-blue-100 dark:bg-blue-900/50 rounded shadow-sm font-medium text-blue-900 dark:text-blue-100";
      case "nav-highlight":
        return "border-2 border-yellow-500 bg-yellow-200/60 dark:bg-yellow-700/40 rounded";
      case "struct-process":
        return "font-medium text-neutral-800 dark:text-neutral-200";
      case "struct-decision":
        return "font-medium text-neutral-800 dark:text-neutral-200";
      case "struct-loop":
        return "font-medium text-neutral-800 dark:text-neutral-200";
      case "entity-oval":
        return "font-medium text-neutral-800 dark:text-neutral-200";
      case "entity-occurrence":
        return "bg-transparent !justify-start text-sm";
      case "wf-heading":
        return "bg-transparent !justify-start";
      case "wf-paragraph":
        return "bg-transparent rounded !justify-start !items-start p-2";
      case "wf-audio":
        return "border border-neutral-300 bg-neutral-100 rounded !justify-center";
      case "wf-video":
        return "border border-neutral-300 bg-neutral-200 rounded flex-col !justify-center !items-center";
      case "wf-div":
        return "border border-neutral-400 bg-transparent rounded";
      case "wf-annotation":
        return "bg-transparent !justify-start !items-start";
      default:
        return "";
    }
  };

  // Helper to un-rotate/un-skew text inside shapes - NO LONGER NEEDED for new shapes
  const getTextClasses = (type: DiagramItem["type"]) => {
     return "";
  };

  return (
    <div className="flex flex-col gap-2">
      {!disabled && (
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-t-lg border border-neutral-200 dark:border-neutral-700 border-b-0">
          <div className="flex items-center gap-1">
            <Button
                variant={tool === "select" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTool("select")}
                title="Select / Move Items"
                className={cn("px-2 sm:px-3", tool === "select" && "bg-blue-500 text-white hover:bg-blue-600")}
            >
                <MousePointer2 className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Select</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
                variant={tool === "pencil" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTool("pencil")}
                title="Draw Lines (Not Marked)"
                className={cn("px-2 sm:px-3", tool === "pencil" && "bg-blue-500 text-white hover:bg-blue-600")}
            >
                <Pencil className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Draw</span>
            </Button>
            <Button
                variant={tool === "eraser" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTool("eraser")}
                title="Erase Drawing"
                className={cn("px-2", tool === "eraser" && "bg-blue-500 text-white hover:bg-blue-600")}
            >
                <Eraser className="w-4 h-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={clearCanvas}
                className="text-orange-500 hover:bg-orange-50 px-2"
                title="Clear Freehand Drawing"
            >
                <X className="w-4 h-4" />
            </Button>
            
            <Button
                variant="ghost"
                size="sm"
                disabled={!selectedId}
                onClick={() => selectedId && deleteItem(selectedId)}
                className="text-red-600 hover:bg-red-50 disabled:text-neutral-300 px-2 sm:px-3"
                title="Delete Selected Shape (Del)"
            >
                <Trash2 className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>

          <div className="w-full sm:w-auto" />

          <div className="flex items-center gap-1 flex-wrap">
            {/* Structure Dataflow mode - dataflow arrows and text for parameter labels */}
            {mode === "structure-dataflow" ? (
              <>
                <Button
                    variant={tool === "dataflow-up" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("dataflow-up")}
                    title="Data In Arrow (pointing up into function)"
                    className={cn("px-2 sm:px-3", tool === "dataflow-up" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <ArrowUp className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Data In</span>
                </Button>
                <Button
                    variant={tool === "dataflow-down" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("dataflow-down")}
                    title="Data Out Arrow (pointing down out of function)"
                    className={cn("px-2 sm:px-3", tool === "dataflow-down" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <ArrowDown className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Data Out</span>
                </Button>
                <Button
                    variant={tool === "text" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("text")}
                    title="Variable Name Label"
                    className={cn("px-2 sm:px-3", tool === "text" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Type className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Label</span>
                </Button>
              </>
            ) : mode === "nav-structure" ? (
              <>
                <Button
                    variant={tool === "box" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("box")}
                    title="Webpage Box"
                    className={cn("px-2 sm:px-3", tool === "box" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Square className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Page</span>
                </Button>
                <Button
                    variant={tool === "line" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("line")}
                    title="Link Line"
                    className={cn("px-2 sm:px-3", tool === "line" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Minus className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Link</span>
                </Button>
              </>
            ) : mode === "nav-structure-higher" ? (
              <>
                <Button
                    variant={tool === "nav-page" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("nav-page")}
                    title="Webpage Box (blue)"
                    className={cn("px-2 sm:px-3", tool === "nav-page" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-nav-page"
                >
                    <Square className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Page</span>
                </Button>
                <Button
                    variant={tool === "line" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("line")}
                    title="Hierarchy Connector"
                    className={cn("px-2 sm:px-3", tool === "line" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-nav-connector"
                >
                    <Minus className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Connect</span>
                </Button>
                <Button
                    variant={tool === "nav-highlight" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("nav-highlight")}
                    title="Navigation Bar Area (yellow)"
                    className={cn("px-2 sm:px-3", tool === "nav-highlight" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-nav-highlight"
                >
                    <LayoutTemplate className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Nav Area</span>
                </Button>
                <Button
                    variant={tool === "text" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("text")}
                    title="Text Label"
                    className={cn("px-2 sm:px-3", tool === "text" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-nav-text"
                >
                    <Type className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Label</span>
                </Button>
              </>
            ) : mode === "structure-diagram" ? (
              <>
                <Button
                    variant={tool === "struct-process" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("struct-process")}
                    title="Process (Rectangle)"
                    className={cn("px-2 sm:px-3", tool === "struct-process" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-struct-process"
                >
                    <Square className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Process</span>
                </Button>
                <Button
                    variant={tool === "struct-decision" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("struct-decision")}
                    title="Decision (Diamond)"
                    className={cn("px-2 sm:px-3", tool === "struct-decision" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-struct-decision"
                >
                    <Diamond className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Decision</span>
                </Button>
                <Button
                    variant={tool === "struct-loop" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("struct-loop")}
                    title="Loop (Ellipse)"
                    className={cn("px-2 sm:px-3", tool === "struct-loop" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-struct-loop"
                >
                    <Circle className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Loop</span>
                </Button>
                <Button
                    variant={tool === "line" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("line")}
                    title="Connector Line"
                    className={cn("px-2 sm:px-3", tool === "line" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-struct-connector"
                >
                    <Minus className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Connect</span>
                </Button>
                <Button
                    variant={tool === "text" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("text")}
                    title="Text Label"
                    className={cn("px-2 sm:px-3", tool === "text" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-struct-text"
                >
                    <Type className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Label</span>
                </Button>
              </>
            ) : mode === "entity-occurrence" ? (
              <>
                <Button
                    variant={tool === "entity-oval" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("entity-oval")}
                    title="Entity (Tall Oval with occurrences)"
                    className={cn("px-2 sm:px-3", tool === "entity-oval" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-entity-oval"
                >
                    <Circle className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Entity</span>
                </Button>
                <Button
                    variant={tool === "line" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("line")}
                    title="Relationship Line (connect occurrences)"
                    className={cn("px-2 sm:px-3", tool === "line" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-entity-connector"
                >
                    <Minus className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Connect</span>
                </Button>
                <span className="text-xs text-neutral-500 ml-2 hidden sm:inline">Click entity to edit occurrences</span>
              </>
            ) : mode === "erd-annotation" ? (
              <>
                <Button
                    variant={tool === "box" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("box")}
                    title="Rectangle"
                    className={cn("px-2 sm:px-3", tool === "box" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Square className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Rectangle</span>
                </Button>
                <Button
                    variant={tool === "ellipse" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ellipse")}
                    title="Ellipse"
                    className={cn("px-2 sm:px-3", tool === "ellipse" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Circle className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Ellipse</span>
                </Button>
                <Button
                    variant={tool === "diamond" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("diamond")}
                    title="Diamond"
                    className={cn("px-2 sm:px-3", tool === "diamond" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Diamond className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Diamond</span>
                </Button>
                <Button
                    variant={tool === "crowfoot" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("crowfoot")}
                    title="Forked Line (One-to-Many)"
                    className={cn("px-2 sm:px-3", tool === "crowfoot" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Route className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Forked Line</span>
                </Button>
                <Button
                    variant={tool === "line" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("line")}
                    title="Plain Line"
                    className={cn("px-2 sm:px-3", tool === "line" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Minus className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Line</span>
                </Button>
              </>
            ) : (
              <>
                {/* Basic shapes - always shown */}
                <Button
                    variant={tool === "box" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("box")}
                    title="Rectangle"
                    className={cn("px-2 sm:px-3", tool === "box" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Square className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Box</span>
                </Button>
              </>
            )}
            
            {/* Flowchart shapes - shown for flowchart and general modes */}
            {(mode === "flowchart" || mode === "general") && (
              <>
                <Button
                    variant={tool === "ellipse" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ellipse")}
                    title="Start/End"
                    className={cn(tool === "ellipse" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Circle className="w-4 h-4 mr-1" /> Start/End
                </Button>
                <Button
                    variant={tool === "diamond" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("diamond")}
                    title="Decision"
                    className={cn(tool === "diamond" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Diamond className="w-4 h-4 mr-1" /> Decision
                </Button>
                <Button
                    variant={tool === "parallelogram" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("parallelogram")}
                    title="Input/Output"
                    className={cn(tool === "parallelogram" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Spline className="w-4 h-4 mr-1" /> I/O
                </Button>
              </>
            )}

            {/* Database shapes - shown for database and general modes */}
            {(mode === "database" || mode === "general") && (
              <>
                <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />
                <Button
                    variant={tool === "cylinder" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("cylinder")}
                    title="Entity/Table"
                    className={cn(tool === "cylinder" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Database className="w-4 h-4 mr-1" /> Entity
                </Button>
                <Button
                    variant={tool === "ellipse" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ellipse")}
                    title="Attribute (Oval)"
                    className={cn(tool === "ellipse" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Circle className="w-4 h-4 mr-1" /> Attribute
                </Button>
                <Button
                    variant={tool === "diamond" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("diamond")}
                    title="Relationship (Diamond)"
                    className={cn(tool === "diamond" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Diamond className="w-4 h-4 mr-1" /> Relationship
                </Button>
                <Button
                    variant={tool === "crowfoot" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("crowfoot")}
                    title="Crow's Foot Connector (One-to-Many)"
                    className={cn(tool === "crowfoot" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Route className="w-4 h-4 mr-1" /> 1:M Line
                </Button>
              </>
            )}

            {mode !== "erd-annotation" && (
              <>
                <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />
                
                <Button
                    variant={tool === "line" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("line")}
                    title="Line / Connector"
                    className={cn(tool === "line" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Minus className="w-4 h-4 mr-1" /> Line
                </Button>
              </>
            )}

            {/* Wireframe tools - shown for wireframe and general modes */}
            {(mode === "wireframe" || mode === "general") && (
              <>
                <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mr-1">UI:</span>
                <Button
                    variant={tool === "ui-window" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ui-window")}
                    title="Window"
                    className={cn(tool === "ui-window" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Window
                </Button>
                <Button
                    variant={tool === "ui-button" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ui-button")}
                    title="Button"
                    className={cn(tool === "ui-button" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Button
                </Button>
                <Button
                    variant={tool === "ui-input" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ui-input")}
                    title="Input"
                    className={cn(tool === "ui-input" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Input
                </Button>
                <Button
                    variant={tool === "ui-dropdown" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ui-dropdown")}
                    title="Dropdown"
                    className={cn(tool === "ui-dropdown" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Dropdown
                </Button>
                <Button
                    variant={tool === "ui-output" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ui-output")}
                    title="Output Field"
                    className={cn(tool === "ui-output" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Output
                </Button>
                <Button
                    variant={tool === "ui-image" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ui-image")}
                    title="Image Placeholder"
                    className={cn(tool === "ui-image" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Image
                </Button>
              </>
            )}

            {/* Webpage Wireframe tools - for webpage-wireframe mode */}
            {mode === "webpage-wireframe" && (
              <>
                <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mr-1">Page:</span>
                <Button
                    variant={tool === "ui-image" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ui-image")}
                    title="Image Placeholder"
                    className={cn(tool === "ui-image" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Image
                </Button>
                <Button
                    variant={tool === "wf-heading" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("wf-heading")}
                    title="Heading"
                    className={cn(tool === "wf-heading" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Heading
                </Button>
                <Button
                    variant={tool === "wf-paragraph" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("wf-paragraph")}
                    title="Paragraph"
                    className={cn(tool === "wf-paragraph" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Paragraph
                </Button>
                <Button
                    variant={tool === "link-text" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("link-text")}
                    title="Link (underlined text)"
                    className={cn(tool === "link-text" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Link
                </Button>
                <Button
                    variant={tool === "bullet-text" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("bullet-text")}
                    title="Bullet List"
                    className={cn(tool === "bullet-text" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Bullets
                </Button>
                <Button
                    variant={tool === "numbered-text" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("numbered-text")}
                    title="Numbered List"
                    className={cn(tool === "numbered-text" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Numbers
                </Button>
                <Button
                    variant={tool === "wf-audio" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("wf-audio")}
                    title="Audio Player"
                    className={cn(tool === "wf-audio" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Audio
                </Button>
                <Button
                    variant={tool === "wf-video" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("wf-video")}
                    title="Video Player"
                    className={cn(tool === "wf-video" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Video
                </Button>
                <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mr-1">Layout:</span>
                <Button
                    variant={tool === "wf-div" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("wf-div")}
                    title="Rectangle / Div container"
                    className={cn(tool === "wf-div" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-wf-div"
                >
                    <Square className="w-3.5 h-3.5 mr-1" /> Div
                </Button>
                <Button
                    variant={tool === "wf-annotation" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("wf-annotation")}
                    title="Annotation text (small grey note)"
                    className={cn(tool === "wf-annotation" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-wf-annotation"
                >
                    Note
                </Button>
              </>
            )}

            {/* Form Wireframe tools - for form-wireframe mode */}
            {mode === "form-wireframe" && (
              <>
                <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mr-1">Form:</span>
                <Button
                    variant={tool === "ui-label" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ui-label")}
                    title="Label"
                    className={cn(tool === "ui-label" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Label
                </Button>
                <Button
                    variant={tool === "ui-input" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ui-input")}
                    title="Text Input"
                    className={cn(tool === "ui-input" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Input
                </Button>
                <Button
                    variant={tool === "ui-textarea" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ui-textarea")}
                    title="Text Area"
                    className={cn(tool === "ui-textarea" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Textarea
                </Button>
                <Button
                    variant={tool === "ui-dropdown" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ui-dropdown")}
                    title="Dropdown"
                    className={cn(tool === "ui-dropdown" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Dropdown
                </Button>
                <Button
                    variant={tool === "ui-radio" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ui-radio")}
                    title="Radio Button"
                    className={cn(tool === "ui-radio" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Radio
                </Button>
                <Button
                    variant={tool === "ui-checkbox" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ui-checkbox")}
                    title="Checkbox"
                    className={cn(tool === "ui-checkbox" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Checkbox
                </Button>
                <Button
                    variant={tool === "ui-submit" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("ui-submit")}
                    title="Submit Button"
                    className={cn(tool === "ui-submit" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    Submit
                </Button>
                <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />
                <Button
                    variant={tool === "wf-div" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("wf-div")}
                    title="Rectangle / Div container"
                    className={cn(tool === "wf-div" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-form-wf-div"
                >
                    <Square className="w-3.5 h-3.5 mr-1" /> Div
                </Button>
                <Button
                    variant={tool === "wf-annotation" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("wf-annotation")}
                    title="Annotation text (small grey note)"
                    className={cn(tool === "wf-annotation" && "bg-blue-500 text-white hover:bg-blue-600")}
                    data-testid="tool-form-wf-annotation"
                >
                    Note
                </Button>
              </>
            )}

            {mode !== "erd-annotation" && mode !== "nav-structure" && mode !== "nav-structure-higher" && (
              <>
                <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

                <Button
                    variant={tool === "text" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("text")}
                    title="Add Text"
                    className={cn(tool === "text" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <Type className="w-4 h-4 mr-1" /> Text
                </Button>
                <Button
                    variant={tool === "bullet-text" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("bullet-text")}
                    title="Add Bullet Point List"
                    className={cn(tool === "bullet-text" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <List className="w-4 h-4 mr-1" /> Bullet
                </Button>
                <Button
                    variant={tool === "numbered-text" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("numbered-text")}
                    title="Add Numbered List"
                    className={cn(tool === "numbered-text" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <span className="mr-1 text-xs font-mono">1.</span> Numbered
                </Button>
                <Button
                    variant={tool === "link-text" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTool("link-text")}
                    title="Add Underlined Text"
                    className={cn(tool === "link-text" && "bg-blue-500 text-white hover:bg-blue-600")}
                >
                    <span className="underline mr-1">U</span> Underline
                </Button>
              </>
            )}
          </div>
          
          <div className="flex-1" />
        </div>
      )}

      {mode === "erd-annotation" ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 text-sm rounded-md flex items-start gap-2">
          <div className="mt-0.5 font-bold">Instructions:</div>
          <div>
            Click an item, then click <strong>Mark</strong> to toggle: <span className="underline decoration-2">underline</span> = Primary Key, <span className="text-red-600 font-bold">*</span> = Foreign Key. 
            Use the shape tools to annotate the diagram.
          </div>
        </div>
      ) : mode === "webpage-wireframe" ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 text-sm rounded-md flex items-start gap-2">
          <div className="mt-0.5 font-bold">Tip:</div>
          <div>
              Design a webpage layout using the tools above. Add headings, paragraphs, images, links, lists, audio and video elements.
          </div>
        </div>
      ) : mode === "form-wireframe" ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 text-sm rounded-md flex items-start gap-2">
          <div className="mt-0.5 font-bold">Tip:</div>
          <div>
              Use <strong>*</strong> in labels for required fields. Type validation rules <strong>inside text inputs</strong> (e.g. "1-14" or "must be positive").
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 text-sm rounded-md flex items-start gap-2">
          <div className="mt-0.5 font-bold">Tip:</div>
          <div>
              Click and drag to draw shapes. Use <strong>Line</strong> for connectors. Text in shapes is read by the auto-marker.
          </div>
        </div>
      )}


      {/* Entity-oval occurrence editor panel */}
      {mode === "entity-occurrence" && selectedId && (() => {
        const selectedItem = items.find(i => i.id === selectedId);
        if (!selectedItem || selectedItem.type !== "entity-oval") return null;
        
        const occurrences = selectedItem.occurrences || [];
        
        const addOccurrence = () => {
          const newOccId = Math.random().toString(36).substring(7);
          updateItem(selectedId, {
            occurrences: [...occurrences, { id: newOccId, text: "new occurrence", dotPosition: "left" as const }]
          });
        };
        
        const updateOccurrence = (idx: number, updates: Partial<{text: string; dotPosition: "left" | "right" | "both"}>) => {
          const newOccs = [...occurrences];
          newOccs[idx] = { ...newOccs[idx], ...updates };
          updateItem(selectedId, { occurrences: newOccs });
        };
        
        const removeOccurrence = (idx: number) => {
          const newOccs = occurrences.filter((_, i) => i !== idx);
          updateItem(selectedId, { occurrences: newOccs });
        };
        
        // Also find and allow editing the linked title
        const linkedTitle = items.find(i => i.parentEntityId === selectedId);
        
        return (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Entity Occurrences</span>
              <Button size="sm" variant="outline" onClick={addOccurrence} className="h-7 text-xs">
                + Add Occurrence
              </Button>
            </div>
            
            {linkedTitle && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-600 dark:text-purple-400 w-16">Title:</span>
                <input
                  type="text"
                  value={linkedTitle.content || ""}
                  onChange={(e) => updateItem(linkedTitle.id, { content: e.target.value })}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-neutral-800"
                  placeholder="Entity name"
                />
              </div>
            )}
            
            {occurrences.length > 0 && (
              <div className="space-y-2">
                {occurrences.map((occ, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-purple-600 dark:text-purple-400 w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      value={occ.text}
                      onChange={(e) => updateOccurrence(idx, { text: e.target.value })}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-neutral-800"
                      placeholder="Occurrence text"
                    />
                    <select
                      value={occ.dotPosition}
                      onChange={(e) => updateOccurrence(idx, { dotPosition: e.target.value as "left" | "right" | "both" })}
                      className="px-2 py-1 text-xs border rounded bg-white dark:bg-neutral-800"
                      title="Dot position"
                    >
                      <option value="left">Left dot</option>
                      <option value="right">Right dot</option>
                      <option value="both">Both dots</option>
                    </select>
                    <button
                      onClick={() => removeOccurrence(idx)}
                      className="text-red-500 hover:text-red-700 text-xs px-1"
                      title="Remove occurrence"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {occurrences.length === 0 && (
              <p className="text-xs text-purple-500">No occurrences. Click "Add Occurrence" to add one.</p>
            )}
          </div>
        );
      })()}

      <div
        ref={containerRef}
        tabIndex={0}
        onClick={handleContainerClick}
        onMouseDown={handleShapeMouseDown}
        onMouseMove={handleShapeMouseMove}
        onMouseUp={handleShapeMouseUp}
        onMouseLeave={() => { setIsDraggingNewShape(false); setTempShape(null); }}
        style={{ height: containerHeight, ...(isWireframeMode ? { width: containerWidth || 450, margin: "0 auto" } : {}), ...(backgroundUrl && !isWireframeMode && containerWidth ? { width: containerWidth, margin: "0 auto" } : {}) }}
        className={cn(
          `relative bg-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden select-none diagram-bg focus:outline-none focus:ring-2 focus:ring-red-500`,
          !isWireframeMode && !containerWidth && "w-full",
          disabled && "opacity-80 pointer-events-none",
          tool !== "select" && tool !== "pencil" && tool !== "eraser" && "cursor-crosshair"
        )}
      >
        {backgroundUrl && (
             <img 
                src={backgroundUrl} 
                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0 mix-blend-multiply dark:mix-blend-normal" 
                alt="Background"
             />
        )}
        
        {/* Canvas Layer for Drawing */}
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 pointer-events-auto"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />

            {/* Temp shape while dragging */}
        {tempShape && (tempShape.type === "line" || tempShape.type === "crowfoot" || tempShape.type === "dataflow-arrow") ? (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
            <line 
              x1={tempShape.x} y1={tempShape.y} 
              x2={tempShape.x2 || tempShape.x} y2={tempShape.y2 || tempShape.y}
              stroke="#262626" strokeWidth="2" strokeDasharray="4"
            />
          </svg>
        ) : tempShape && (
          <div
            style={{
              left: tempShape.x,
              top: tempShape.y,
              width: tempShape.width || 20,
              height: tempShape.height || 20,
            }}
            className="absolute border-2 border-dashed border-red-400 bg-red-50/50 pointer-events-none z-20"
          />
        )}

        {/* Line, Crowfoot and Dataflow Arrow items rendered as SVG */}
        {items.filter(item => item.type === "line" || item.type === "crowfoot" || item.type === "dataflow-arrow").map((item) => {
          // Render lines/crowfoot at higher z-index so labels are visible
          // Get start and end positions
          let x1 = item.x;
          let y1 = item.y;
          let x2 = item.x2 || item.x + 100;
          let y2 = item.y2 || item.y;
          
          // Helper to parse occurrence connection format: "entityId-occ-occurrenceId"
          const parseOccurrenceConnection = (connStr?: string): { entityId: string; occurrenceId: string } | null => {
            if (!connStr) return null;
            const match = connStr.match(/^(.+)-occ-(.+)$/);
            if (match) return { entityId: match[1], occurrenceId: match[2] };
            return null;
          };
          
          // Helper to get occurrence anchor position
          const getOccurrenceAnchorPosition = (entityId: string, occurrenceId: string, side: 'left' | 'right'): { x: number; y: number } | null => {
            const entity = items.find(i => i.id === entityId);
            if (!entity || entity.type !== "entity-oval" || !entity.occurrences) return null;
            
            const occIdx = entity.occurrences.findIndex(o => o.id === occurrenceId);
            if (occIdx === -1) return null;
            
            const occurrenceHeight = 24;
            const startY = 30;
            const w = entity.width || 140;
            const h = entity.height || 200;
            const rx = w / 2;
            const ry = h / 2;
            const dotMargin = 8;
            
            const occCenterY = startY + (occIdx * occurrenceHeight) + occurrenceHeight / 2;
            const dy = occCenterY - ry;
            const xFromCenter = rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)));
            const dotInset = rx - xFromCenter + dotMargin;
            const occY = entity.y + occCenterY;
            
            if (side === 'left') return { x: entity.x + dotInset, y: occY };
            if (side === 'right') return { x: entity.x + w - dotInset, y: occY };
            return null;
          };
          
          // For crow's foot lines and nav-structure lines, clip to shape edges
          if (item.type === "crowfoot" || mode === "nav-structure" || mode === "nav-structure-higher" || mode === "structure-diagram" || mode === "entity-occurrence") {
            // Handle occurrence connections (format: "entityId-occ-occurrenceId")
            const occConn1 = parseOccurrenceConnection(item.connectedTo1);
            const occConn2 = parseOccurrenceConnection(item.connectedTo2);
            
            // Get shapes - for occurrence connections, extract entity ID
            const shape1 = occConn1 
              ? items.find(i => i.id === occConn1.entityId)
              : item.connectedTo1 ? items.find(i => i.id === item.connectedTo1) : null;
            const shape2 = occConn2 
              ? items.find(i => i.id === occConn2.entityId)
              : item.connectedTo2 ? items.find(i => i.id === item.connectedTo2) : null;
            
            if (mode === "nav-structure-higher" || mode === "structure-diagram" || mode === "entity-occurrence") {
              // Use stored anchor sides to get exact anchor point positions
              // This ensures lines connect TO the visible anchor dots
              
              if (occConn1 && item.anchor1Side && (item.anchor1Side === 'left' || item.anchor1Side === 'right')) {
                // Occurrence connection - calculate position based on occurrence
                const anchor = getOccurrenceAnchorPosition(occConn1.entityId, occConn1.occurrenceId, item.anchor1Side);
                if (anchor) {
                  x1 = anchor.x;
                  y1 = anchor.y;
                }
              } else if (shape1 && item.anchor1Side) {
                const anchor = getAnchorByIdAndSide(shape1.id, item.anchor1Side);
                if (anchor) {
                  x1 = anchor.x;
                  y1 = anchor.y;
                }
              }
              
              if (occConn2 && item.anchor2Side && (item.anchor2Side === 'left' || item.anchor2Side === 'right')) {
                // Occurrence connection - calculate position based on occurrence
                const anchor = getOccurrenceAnchorPosition(occConn2.entityId, occConn2.occurrenceId, item.anchor2Side);
                if (anchor) {
                  x2 = anchor.x;
                  y2 = anchor.y;
                }
              } else if (shape2 && item.anchor2Side) {
                const anchor = getAnchorByIdAndSide(shape2.id, item.anchor2Side);
                if (anchor) {
                  x2 = anchor.x;
                  y2 = anchor.y;
                }
              }
            } else {
              // Original behavior for other modes
              if (shape1) {
                const edge = getEdgeIntersection(shape1, x2, y2);
                x1 = edge.x;
                y1 = edge.y;
              }
              if (shape2) {
                const edge = getEdgeIntersection(shape2, x1, y1);
                x2 = edge.x;
                y2 = edge.y;
              }
            }
          }
          
          // Calculate angle for crow's foot notation
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const footSize = 12;
          const footAngle = Math.PI / 6; // 30 degrees spread
          
          const strokeColor = selectedId === item.id ? "#ef4444" : "#262626";
          const strokeW = selectedId === item.id ? 3 : 2;
          const arrowSize = 10;
          
          // Calculate arrow head points - arrow points FROM pointsTo TOWARDS at
          const renderArrowHead = (atX: number, atY: number, fromX: number, fromY: number) => {
            // Arrow angle points from "from" to "at" (the direction of travel)
            const arrowAngle = Math.atan2(fromY - atY, fromX - atX);
            const arrowAngle1 = arrowAngle + Math.PI / 6;
            const arrowAngle2 = arrowAngle - Math.PI / 6;
            const x1Arrow = atX + arrowSize * Math.cos(arrowAngle1);
            const y1Arrow = atY + arrowSize * Math.sin(arrowAngle1);
            const x2Arrow = atX + arrowSize * Math.cos(arrowAngle2);
            const y2Arrow = atY + arrowSize * Math.sin(arrowAngle2);
            return (
              <polygon 
                points={`${atX},${atY} ${x1Arrow},${y1Arrow} ${x2Arrow},${y2Arrow}`}
                fill={strokeColor}
              />
            );
          };
          
          // For nav-structure-higher and structure-diagram, use elbow (orthogonal) connectors
          const useElbowConnector = (mode === "nav-structure-higher" || mode === "structure-diagram") && item.type === "line";
          
          // Get anchor sides from the stored item properties (set when line was created)
          const storedAnchor1Side = item.anchor1Side;
          const storedAnchor2Side = item.anchor2Side;
          
          // Calculate elbow path based on which sides are connected
          // Rule: Lines must exit perpendicular to anchor, route OUTSIDE shapes, then enter perpendicular
          const getElbowPath = () => {
            const offset = 15; // Distance from shape before turning (routing clearance)
            
            // Bottom-to-Top: Most common hierarchical case (parent above, child below)
            if (storedAnchor1Side === 'bottom' && storedAnchor2Side === 'top') {
              // Exit downward, route horizontally outside both shapes, enter from above
              const midY = (y1 + y2) / 2;
              return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
            }
            
            // Top-to-Bottom: Reverse hierarchical (child above parent)
            if (storedAnchor1Side === 'top' && storedAnchor2Side === 'bottom') {
              const midY = (y1 + y2) / 2;
              return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
            }
            
            // Right-to-Left: Horizontal connection (shape1 on left, shape2 on right)
            if (storedAnchor1Side === 'right' && storedAnchor2Side === 'left') {
              const midX = (x1 + x2) / 2;
              return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
            }
            
            // Left-to-Right: Horizontal connection (shape1 on right, shape2 on left)
            if (storedAnchor1Side === 'left' && storedAnchor2Side === 'right') {
              const midX = (x1 + x2) / 2;
              return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
            }
            
            // Bottom-to-Left or Bottom-to-Right: Mixed vertical exit to horizontal entry
            if (storedAnchor1Side === 'bottom' && (storedAnchor2Side === 'left' || storedAnchor2Side === 'right')) {
              // Go down first, then horizontal to the target
              return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;
            }
            
            // Top-to-Left or Top-to-Right: Mixed vertical exit to horizontal entry
            if (storedAnchor1Side === 'top' && (storedAnchor2Side === 'left' || storedAnchor2Side === 'right')) {
              return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;
            }
            
            // Left/Right to Top/Bottom: Mixed horizontal exit to vertical entry
            if ((storedAnchor1Side === 'left' || storedAnchor1Side === 'right') && 
                (storedAnchor2Side === 'top' || storedAnchor2Side === 'bottom')) {
              return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`;
            }
            
            // Same side connections (e.g., both bottom, both left) - route around
            if (storedAnchor1Side === 'bottom' && storedAnchor2Side === 'bottom') {
              // Both exit downward - route below both shapes
              const lowestY = Math.max(y1, y2) + offset * 2;
              return `M ${x1} ${y1} L ${x1} ${lowestY} L ${x2} ${lowestY} L ${x2} ${y2}`;
            }
            if (storedAnchor1Side === 'top' && storedAnchor2Side === 'top') {
              // Both exit upward - route above both shapes
              const highestY = Math.min(y1, y2) - offset * 2;
              return `M ${x1} ${y1} L ${x1} ${highestY} L ${x2} ${highestY} L ${x2} ${y2}`;
            }
            if (storedAnchor1Side === 'left' && storedAnchor2Side === 'left') {
              // Both exit leftward - route to the left of both
              const leftmostX = Math.min(x1, x2) - offset * 2;
              return `M ${x1} ${y1} L ${leftmostX} ${y1} L ${leftmostX} ${y2} L ${x2} ${y2}`;
            }
            if (storedAnchor1Side === 'right' && storedAnchor2Side === 'right') {
              // Both exit rightward - route to the right of both
              const rightmostX = Math.max(x1, x2) + offset * 2;
              return `M ${x1} ${y1} L ${rightmostX} ${y1} L ${rightmostX} ${y2} L ${x2} ${y2}`;
            }
            
            // Fallback: simple L-shape going down then horizontal
            return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;
          };
          
          return (
            <svg key={item.id} className={cn("absolute inset-0 w-full h-full pointer-events-none", selectedId === item.id ? "z-[100]" : mode === "entity-occurrence" ? "z-[50]" : "z-[5]")} style={{ overflow: 'visible' }}>
              {/* Main line - use path for elbow connectors in nav-structure-higher */}
              {useElbowConnector ? (
                <path
                  d={getElbowPath()}
                  stroke={strokeColor}
                  strokeWidth={strokeW}
                  fill="none"
                  className="pointer-events-auto cursor-move"
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e as any, item.id); }}
                />
              ) : (
                <line 
                  x1={x1} y1={y1} 
                  x2={x2} y2={y2}
                  stroke={strokeColor} 
                  strokeWidth={strokeW}
                  className="pointer-events-auto cursor-move"
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e as any, item.id); }}
                />
              )}
              
              {/* Arrow at start point */}
              {item.arrowStart && renderArrowHead(x1, y1, x2, y2)}
              
              {/* Arrow at end point */}
              {item.arrowEnd && renderArrowHead(x2, y2, x1, y1)}
              
              {/* Dataflow arrow head - always render arrow pointing in direction */}
              {item.type === "dataflow-arrow" && (
                item.dataflowDirection === "up" 
                  ? renderArrowHead(x2, y2, x1, y1) // Arrow points toward x2,y2 (function edge) - data flows IN
                  : renderArrowHead(x2, y2, x1, y1) // Arrow points toward x2,y2 (down from function) - data flows OUT
              )}
              
              {/* Arrow toggle buttons for nav-structure mode */}
              {mode === "nav-structure" && selectedId === item.id && !disabled && (
                <foreignObject
                  x={(x1 + x2) / 2 - 70}
                  y={(y1 + y2) / 2 - 40}
                  width="140"
                  height="36"
                  className="pointer-events-auto overflow-visible"
                >
                  <div className="flex gap-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md p-1 shadow-lg">
                    <button
                      onClick={(e) => { e.stopPropagation(); updateItem(item.id, { arrowStart: !item.arrowStart }); }}
                      className={cn(
                        "px-2 py-1 text-xs rounded",
                        item.arrowStart ? "bg-blue-500 text-white" : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                      )}
                      title="Arrow at start"
                    >
                      ← Start
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateItem(item.id, { arrowEnd: !item.arrowEnd }); }}
                      className={cn(
                        "px-2 py-1 text-xs rounded",
                        item.arrowEnd ? "bg-blue-500 text-white" : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                      )}
                      title="Arrow at end"
                    >
                      End →
                    </button>
                  </div>
                </foreignObject>
              )}
              
              {/* Relationship label at midpoint - only show input when selected, otherwise show text if exists */}
              {(mode === "erd-annotation" || mode === "database") && (
                <>
                  {selectedId === item.id && !disabled ? (
                    <foreignObject
                      x={(x1 + x2) / 2 - 50}
                      y={(y1 + y2) / 2 - 30}
                      width="100"
                      height="28"
                      className="pointer-events-auto overflow-visible"
                      style={{ overflow: 'visible' }}
                    >
                      <input
                        type="text"
                        value={item.relationshipLabel || ""}
                        onChange={(e) => updateItem(item.id, { relationshipLabel: e.target.value })}
                        placeholder="Enter label..."
                        className="w-full h-full text-sm text-center bg-white text-black border-2 border-blue-400 rounded px-2 py-1 outline-none shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </foreignObject>
                  ) : item.relationshipLabel ? (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 10}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs fill-neutral-800 pointer-events-none"
                      style={{ fontSize: '11px' }}
                    >
                      {item.relationshipLabel}
                    </text>
                  ) : null}
                </>
              )}
              
              {/* Crow's foot notation - widest at edge, converging inward */}
              {item.type === "crowfoot" && (() => {
                const strokeColor = selectedId === item.id ? "#ef4444" : "#262626";
                const strokeW = selectedId === item.id ? 3 : 2;
                const footLength = 12; // How far back the convergence point is
                const prongSpread = 8; // How far apart at the edge
                
                // Perpendicular direction for spreading
                const perpX = Math.cos(angle + Math.PI / 2);
                const perpY = Math.sin(angle + Math.PI / 2);
                
                // Convergence point (back from edge on the main line)
                const convergeX = x2 - Math.cos(angle) * footLength;
                const convergeY = y2 - Math.sin(angle) * footLength;
                
                // Spread endpoints at the edge (perpendicular to line direction)
                const topEdgeX = x2 + perpX * prongSpread;
                const topEdgeY = y2 + perpY * prongSpread;
                const bottomEdgeX = x2 - perpX * prongSpread;
                const bottomEdgeY = y2 - perpY * prongSpread;
                
                return (
                  <>
                    {/* Top prong - from convergence point to spread edge */}
                    <line x1={convergeX} y1={convergeY} x2={topEdgeX} y2={topEdgeY} stroke={strokeColor} strokeWidth={strokeW} />
                    {/* Bottom prong - from convergence point to spread edge */}
                    <line x1={convergeX} y1={convergeY} x2={bottomEdgeX} y2={bottomEdgeY} stroke={strokeColor} strokeWidth={strokeW} />
                  </>
                );
              })()}
              
              {selectedId === item.id && (
                <>
                  {/* Start point handle */}
                  <circle cx={item.x} cy={item.y} r="6" fill="#ef4444" className="pointer-events-auto cursor-move"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const initialX1 = item.x;
                      const initialY1 = item.y;
                      const handleMove = (moveE: MouseEvent) => {
                        if (!containerRef.current) return;
                        const newX = initialX1 + (moveE.clientX - startX);
                        const newY = initialY1 + (moveE.clientY - startY);
                        
                        // Check for snap
                        const snapShape = findNearestShape(newX, newY);
                        const structTypes = ["struct-process", "struct-decision", "struct-loop"];
                        if (snapShape) {
                          if (mode === "nav-structure-higher" && snapShape.type === "nav-page") {
                            // Use anchor point for nav-structure-higher mode
                            const otherX = item.x2 || item.x + 100;
                            const otherY = item.y2 || item.y;
                            const anchor = getNavAnchorPoint(snapShape, otherX, otherY);
                            updateItem(item.id, { x: anchor.x, y: anchor.y, connectedTo1: snapShape.id });
                          } else if (mode === "structure-diagram" && structTypes.includes(snapShape.type)) {
                            // Use anchor point for structure-diagram mode
                            const otherX = item.x2 || item.x + 100;
                            const otherY = item.y2 || item.y;
                            const anchor = getNavAnchorPoint(snapShape, otherX, otherY);
                            updateItem(item.id, { x: anchor.x, y: anchor.y, connectedTo1: snapShape.id });
                          } else {
                            const center = getShapeCenter(snapShape);
                            updateItem(item.id, { x: center.x, y: center.y, connectedTo1: snapShape.id });
                          }
                        } else {
                          updateItem(item.id, { x: newX, y: newY, connectedTo1: undefined });
                        }
                      };
                      const handleUp = () => {
                        window.removeEventListener("mousemove", handleMove);
                        window.removeEventListener("mouseup", handleUp);
                      };
                      window.addEventListener("mousemove", handleMove);
                      window.addEventListener("mouseup", handleUp);
                    }}
                  />
                  {/* End point handle */}
                  <circle cx={item.x2 || item.x + 100} cy={item.y2 || item.y} r="6" fill="#ef4444" className="pointer-events-auto cursor-move"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const initialX2 = item.x2 || item.x + 100;
                      const initialY2 = item.y2 || item.y;
                      const handleMove = (moveE: MouseEvent) => {
                        if (!containerRef.current) return;
                        const newX = initialX2 + (moveE.clientX - startX);
                        const newY = initialY2 + (moveE.clientY - startY);
                        
                        // Check for snap
                        const snapShape = findNearestShape(newX, newY);
                        const structTypes2 = ["struct-process", "struct-decision", "struct-loop"];
                        if (snapShape) {
                          if (mode === "nav-structure-higher" && snapShape.type === "nav-page") {
                            // Use anchor point for nav-structure-higher mode
                            const anchor = getNavAnchorPoint(snapShape, item.x, item.y);
                            updateItem(item.id, { x2: anchor.x, y2: anchor.y, connectedTo2: snapShape.id });
                          } else if (mode === "structure-diagram" && structTypes2.includes(snapShape.type)) {
                            // Use anchor point for structure-diagram mode
                            const anchor = getNavAnchorPoint(snapShape, item.x, item.y);
                            updateItem(item.id, { x2: anchor.x, y2: anchor.y, connectedTo2: snapShape.id });
                          } else {
                            const center = getShapeCenter(snapShape);
                            updateItem(item.id, { x2: center.x, y2: center.y, connectedTo2: snapShape.id });
                          }
                        } else {
                          updateItem(item.id, { x2: newX, y2: newY, connectedTo2: undefined });
                        }
                      };
                      const handleUp = () => {
                        window.removeEventListener("mousemove", handleMove);
                        window.removeEventListener("mouseup", handleUp);
                      };
                      window.addEventListener("mousemove", handleMove);
                      window.addEventListener("mouseup", handleUp);
                    }}
                  />
                </>
              )}
            </svg>
          );
        })}

            {/* Items Layer - nav-highlight renders first (behind other items) */}
        {items
          .filter(item => item.type !== "line" && item.type !== "crowfoot")
          .sort((a, b) => {
            // nav-highlight should render first (behind other items)
            if (a.type === "nav-highlight" && b.type !== "nav-highlight") return -1;
            if (b.type === "nav-highlight" && a.type !== "nav-highlight") return 1;
            return 0;
          })
          .map((item) => (
          <div
            key={item.id}
            data-diagram-item={item.id}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
            style={{
              left: item.x,
              top: item.y,
              width: (item.type !== "text") ? (item.width || (item.type === "circle" ? 40 : 120)) : "auto",
              height: (item.type !== "text") ? (item.height || (item.type === "circle" ? 40 : 60)) : "auto",
            }}
            className={cn(
              "absolute flex items-center justify-center group cursor-move diagram-item z-10",
              getShapeClasses(item.type),
              selectedId === item.id && "ring-2 ring-red-500 ring-offset-2",
              mode === "entity-occurrence" && tool === "line" && "pointer-events-none"
            )}
          >
             {/* Render SVG Background for non-UI shapes */}
             {!item.type.startsWith("ui-") && item.type !== "text" && item.type !== "bullet-text" && item.type !== "numbered-text" && item.type !== "link-text" && item.type !== "wf-heading" && item.type !== "wf-annotation" && item.type !== "wf-paragraph" && item.type !== "wf-audio" && item.type !== "wf-video" && item.type !== "wf-div" && item.type !== "line" && item.type !== "crowfoot" && (
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-0">
                    {renderShape(item.type, item.width || (item.type === "circle" ? 40 : 120), item.height || (item.type === "circle" ? 40 : 60))}
                </svg>
             )}

            {/* Anchor dots for nav-page items in nav-structure-higher mode - only visible when line tool is selected */}
            {mode === "nav-structure-higher" && item.type === "nav-page" && tool === "line" && (() => {
              const w = item.width || 120;
              const h = item.height || 50;
              const dotRadius = 4; // Visible dot size
              const dotFill = "#1e40af"; // Darker blue for visibility
              const dotStroke = "#ffffff";
              
              return (
                <svg className="absolute overflow-visible pointer-events-none z-20" style={{ left: 0, top: 0, width: w, height: h }}>
                  {/* Top center anchor */}
                  <circle cx={w / 2} cy={0} r={dotRadius} fill={dotFill} stroke={dotStroke} strokeWidth="2" />
                  {/* Bottom center anchor */}
                  <circle cx={w / 2} cy={h} r={dotRadius} fill={dotFill} stroke={dotStroke} strokeWidth="2" />
                  {/* Left center anchor */}
                  <circle cx={0} cy={h / 2} r={dotRadius} fill={dotFill} stroke={dotStroke} strokeWidth="2" />
                  {/* Right center anchor */}
                  <circle cx={w} cy={h / 2} r={dotRadius} fill={dotFill} stroke={dotStroke} strokeWidth="2" />
                </svg>
              );
            })()}

            {/* Anchor dots for structure-diagram shapes - only visible when line tool is selected */}
            {mode === "structure-diagram" && (item.type === "struct-process" || item.type === "struct-decision" || item.type === "struct-loop") && tool === "line" && (() => {
              const w = item.width || 120;
              const h = item.height || 60;
              const dotRadius = 4;
              const dotFill = "#059669"; // Green for structure diagrams
              const dotStroke = "#ffffff";
              
              return (
                <svg className="absolute overflow-visible pointer-events-none z-20" style={{ left: 0, top: 0, width: w, height: h }}>
                  {/* Top center anchor */}
                  <circle cx={w / 2} cy={0} r={dotRadius} fill={dotFill} stroke={dotStroke} strokeWidth="2" />
                  {/* Bottom center anchor */}
                  <circle cx={w / 2} cy={h} r={dotRadius} fill={dotFill} stroke={dotStroke} strokeWidth="2" />
                  {/* Left center anchor */}
                  <circle cx={0} cy={h / 2} r={dotRadius} fill={dotFill} stroke={dotStroke} strokeWidth="2" />
                  {/* Right center anchor */}
                  <circle cx={w} cy={h / 2} r={dotRadius} fill={dotFill} stroke={dotStroke} strokeWidth="2" />
                </svg>
              );
            })()}

            {/* Anchor dots for entity-occurrence items - left and right dots for connecting lines */}
            {mode === "entity-occurrence" && item.type === "entity-occurrence" && tool === "line" && (() => {
              const w = item.width || 80;
              const h = item.height || 20;
              const dotRadius = 4;
              const dotFill = "#7c3aed"; // Purple for entity-occurrence
              const dotStroke = "#ffffff";
              const dotPos = item.dotPosition || "left";
              
              return (
                <svg className="absolute overflow-visible pointer-events-none z-20" style={{ left: 0, top: 0, width: w, height: h }}>
                  {/* Left anchor - shown if dotPosition is "left" or "both" */}
                  {(dotPos === "left" || dotPos === "both") && (
                    <circle cx={0} cy={h / 2} r={dotRadius} fill={dotFill} stroke={dotStroke} strokeWidth="2" />
                  )}
                  {/* Right anchor - shown if dotPosition is "right" or "both" */}
                  {(dotPos === "right" || dotPos === "both") && (
                    <circle cx={w} cy={h / 2} r={dotRadius} fill={dotFill} stroke={dotStroke} strokeWidth="2" />
                  )}
                </svg>
              );
            })()}

            {/* Entity-oval with occurrences inside */}
            {item.type === "entity-oval" && (() => {
              const w = item.width || 140;
              const h = item.height || 200;
              const occurrences = item.occurrences || [];
              const occurrenceHeight = 24;
              const startY = 30; // Start below top of oval
              const rx = w / 2; // Semi-axis x (horizontal radius)
              const ry = h / 2; // Semi-axis y (vertical radius)
              const dotMargin = 8; // Margin from ellipse edge
              
              return (
                <div className="absolute inset-0 flex flex-col items-center pointer-events-none overflow-visible" style={{ paddingTop: startY }}>
                  {occurrences.map((occ, idx) => {
                    // Calculate dot position based on ellipse equation
                    const occCenterY = startY + (idx * occurrenceHeight) + occurrenceHeight / 2;
                    const dy = occCenterY - ry; // Distance from ellipse center
                    // Ellipse equation: x = rx * sqrt(1 - (dy^2 / ry^2))
                    const xFromCenter = rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)));
                    const dotInset = rx - xFromCenter + dotMargin; // Distance from edge
                    const textPadding = dotInset + 16; // Room for dots + spacing
                    
                    return (
                      <div 
                        key={idx} 
                        className="relative flex items-center justify-center w-full pointer-events-none"
                        style={{ height: occurrenceHeight, paddingLeft: textPadding, paddingRight: textPadding }}
                      >
                        {/* Left dot - inside the ellipse curve */}
                        {(occ.dotPosition === "left" || occ.dotPosition === "both") && (
                          <div 
                            className="absolute w-2 h-2 rounded-full bg-black"
                            style={{ left: dotInset, top: '50%', transform: 'translateY(-50%)' }}
                          />
                        )}
                        {/* Occurrence text - black color */}
                        <span className="text-xs text-center truncate w-full text-black font-medium">{occ.text}</span>
                        {/* Right dot - inside the ellipse curve */}
                        {(occ.dotPosition === "right" || occ.dotPosition === "both") && (
                          <div 
                            className="absolute w-2 h-2 rounded-full bg-black"
                            style={{ right: dotInset, top: '50%', transform: 'translateY(-50%)' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Function number badge for structure-dataflow mode */}
            {showFunctionNumbers && item.type === "box" && functionNumberMap[item.id] && (
              <div 
                className="absolute -top-3 -left-3 w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center z-30 shadow-md"
                title={`Function #${functionNumberMap[item.id]}`}
              >
                {functionNumberMap[item.id]}
              </div>
            )}

            {/* Mark button for annotation mode - shown above selected text/ellipse items only (shapes handled separately below) */}
            {mode === "erd-annotation" && selectedId === item.id && (item.type === "text" || item.type === "bullet-text" || item.type === "numbered-text" || item.type === "link-text" || item.type === "ellipse") && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleMarking(item.id); }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded whitespace-nowrap z-40 shadow-lg"
                title="Click to toggle marking"
              >
                Mark
              </button>
            )}

            {(item.type === "wf-heading" || item.type === "wf-annotation") ? (
              <div className="flex flex-col w-full h-full overflow-hidden">
                {selectedId === item.id && !disabled && (
                  <div className="absolute -top-8 left-0 flex gap-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded shadow-lg p-1 z-50">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const sizes: Array<"small" | "normal" | "large" | "xlarge"> = ["small", "normal", "large", "xlarge"];
                        const currentIdx = sizes.indexOf(item.fontSize || (item.type === "wf-heading" ? "large" : "small"));
                        if (currentIdx > 0) {
                          updateItem(item.id, { fontSize: sizes[currentIdx - 1] });
                        }
                      }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        (item.fontSize === "small") && "opacity-50 cursor-not-allowed"
                      )}
                      title="Decrease text size"
                      data-testid="button-decrease-wf-text"
                    >
                      A-
                    </button>
                    <span className="w-6 h-6 flex items-center justify-center text-[10px] text-neutral-500">
                      {(item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "small" ? "S" : (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "large" ? "L" : (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "xlarge" ? "XL" : "M"}
                    </span>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const sizes: Array<"small" | "normal" | "large" | "xlarge"> = ["small", "normal", "large", "xlarge"];
                        const currentIdx = sizes.indexOf(item.fontSize || (item.type === "wf-heading" ? "large" : "small"));
                        if (currentIdx < sizes.length - 1) {
                          updateItem(item.id, { fontSize: sizes[currentIdx + 1] });
                        }
                      }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        ((item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "xlarge") && "opacity-50 cursor-not-allowed"
                      )}
                      title="Increase text size"
                      data-testid="button-increase-wf-text"
                    >
                      A+
                    </button>
                  </div>
                )}
                {editingItemId === item.id && !disabled ? (
                  <input
                    type="text"
                    autoFocus
                    value={item.content || ""}
                    placeholder={item.type === "wf-heading" ? "Heading" : "annotation"}
                    onChange={(e) => updateItem(item.id, { content: e.target.value })}
                    onBlur={() => setEditingItemId(null)}
                    onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Escape" || e.key === "Enter") { setEditingItemId(null); } }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "bg-transparent border-none focus:ring-0 outline-none cursor-text w-full",
                      item.type === "wf-heading" ? "font-bold text-neutral-900 placeholder:text-neutral-400" : "italic text-neutral-400 placeholder:text-neutral-300"
                    )}
                    style={{ fontSize: (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "small" ? 11 : (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "normal" ? 14 : (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "large" ? 20 : 28 }}
                  />
                ) : (
                  <div
                    onDoubleClick={(e) => handleDoubleClick(e, item.id)}
                    className={cn(
                      "cursor-default w-full overflow-hidden text-ellipsis",
                      item.type === "wf-heading" ? "font-bold text-neutral-900" : "italic text-neutral-400",
                      !(item.content) && "opacity-50"
                    )}
                    style={{ fontSize: (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "small" ? 11 : (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "normal" ? 14 : (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "large" ? 20 : 28 }}
                  >
                    {item.content || (item.type === "wf-heading" ? "Heading" : "annotation")}
                  </div>
                )}
              </div>
            ) : (item.type === "text" || item.type === "bullet-text" || item.type === "numbered-text" || item.type === "link-text") ? (
              <div className={cn(
                "flex flex-col w-full h-full overflow-hidden",
                item.textAlign === "center" && "items-center",
                item.textAlign === "right" && "items-end",
                (!item.textAlign || item.textAlign === "left") && "items-start"
              )}>
                {/* Formatting toolbar - appears when selected */}
                {selectedId === item.id && !disabled && mode !== "erd-annotation" && (
                  <div className="absolute -top-8 left-0 flex gap-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded shadow-lg p-1 z-50">
                    <button
                      onClick={(e) => { e.stopPropagation(); updateItem(item.id, { isBold: !item.isBold }); }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        item.isBold && "bg-neutral-200 dark:bg-neutral-600"
                      )}
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const ta = paragraphTextareaRef.current;
                        if (ta && editingItemId === item.id && ta.selectionStart !== null && ta.selectionEnd !== null && ta.selectionStart !== ta.selectionEnd) {
                          const text = ta.value;
                          const start = ta.selectionStart;
                          const end = ta.selectionEnd;
                          const selected = text.slice(start, end);
                          if (selected.startsWith("_") && selected.endsWith("_") && selected.length > 2) {
                            const unwrapped = text.slice(0, start) + selected.slice(1, -1) + text.slice(end);
                            updateItem(item.id, { content: unwrapped });
                            setTimeout(() => { ta.selectionStart = start; ta.selectionEnd = end - 2; }, 0);
                          } else {
                            const wrapped = text.slice(0, start) + "_" + selected + "_" + text.slice(end);
                            updateItem(item.id, { content: wrapped });
                            setTimeout(() => { ta.selectionStart = start; ta.selectionEnd = end + 2; }, 0);
                          }
                        } else {
                          updateItem(item.id, { isUnderline: !item.isUnderline });
                        }
                      }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded text-xs underline hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        item.isUnderline && "bg-neutral-200 dark:bg-neutral-600"
                      )}
                      title="Underline (select text first to underline only selection)"
                    >
                      U
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateItem(item.id, { hasBullet: !item.hasBullet }); }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        item.hasBullet && "bg-neutral-200 dark:bg-neutral-600"
                      )}
                      title="Bullet Point"
                    >
                      •
                    </button>
                    <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600 mx-0.5" />
                    <button
                      onClick={(e) => { e.stopPropagation(); updateItem(item.id, { textAlign: "left" }); }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        (item.textAlign === "left" || !item.textAlign) && "bg-neutral-200 dark:bg-neutral-600"
                      )}
                      title="Align Left"
                    >
                      <AlignLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateItem(item.id, { textAlign: "center" }); }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        item.textAlign === "center" && "bg-neutral-200 dark:bg-neutral-600"
                      )}
                      title="Align Center"
                    >
                      <AlignCenter className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateItem(item.id, { textAlign: "right" }); }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        item.textAlign === "right" && "bg-neutral-200 dark:bg-neutral-600"
                      )}
                      title="Align Right"
                    >
                      <AlignRight className="w-3 h-3" />
                    </button>
                    <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600 mx-0.5" />
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const sizes: Array<"small" | "normal" | "large" | "xlarge"> = ["small", "normal", "large", "xlarge"];
                        const currentIdx = sizes.indexOf(item.fontSize || "normal");
                        if (currentIdx > 0) {
                          updateItem(item.id, { fontSize: sizes[currentIdx - 1] });
                        }
                      }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        (item.fontSize === "small") && "opacity-50 cursor-not-allowed"
                      )}
                      title="Decrease text size"
                    >
                      A-
                    </button>
                    <span className="w-6 h-6 flex items-center justify-center text-[10px] text-neutral-500">
                      {item.fontSize === "small" ? "S" : item.fontSize === "large" ? "L" : item.fontSize === "xlarge" ? "XL" : "M"}
                    </span>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const sizes: Array<"small" | "normal" | "large" | "xlarge"> = ["small", "normal", "large", "xlarge"];
                        const currentIdx = sizes.indexOf(item.fontSize || "normal");
                        if (currentIdx < sizes.length - 1) {
                          updateItem(item.id, { fontSize: sizes[currentIdx + 1] });
                        }
                      }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        (item.fontSize === "xlarge") && "opacity-50 cursor-not-allowed"
                      )}
                      title="Increase text size"
                    >
                      A+
                    </button>
                  </div>
                )}
                <div className="flex items-start gap-1">
                  {(item.type === "bullet-text" || item.type === "numbered-text") ? (
                    <div className="flex flex-col w-full">
                      {(item.content || "").split("\n").map((line, idx, arr) => (
                        <div key={idx} className="flex items-start gap-1">
                          <span className={cn(item.parentEntityId ? "text-black" : "text-neutral-900", "font-bold leading-6 min-w-[20px]")}>
                            {item.type === "bullet-text" ? "•" : `${idx + 1}.`}
                          </span>
                          {selectedId === item.id && !disabled ? (
                            <input
                              type="text"
                              value={line}
                              onChange={(e) => {
                                const lines = (item.content || "").split("\n");
                                lines[idx] = e.target.value;
                                updateItem(item.id, { content: lines.join("\n") });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const lines = (item.content || "").split("\n");
                                  lines.splice(idx + 1, 0, "");
                                  updateItem(item.id, { content: lines.join("\n") });
                                  setTimeout(() => {
                                    const nextInput = (e.target as HTMLElement).parentElement?.nextElementSibling?.querySelector("input");
                                    nextInput?.focus();
                                  }, 0);
                                } else if (e.key === "Backspace" && line === "" && arr.length > 1) {
                                  e.preventDefault();
                                  const lines = (item.content || "").split("\n");
                                  lines.splice(idx, 1);
                                  updateItem(item.id, { content: lines.join("\n") });
                                  setTimeout(() => {
                                    const prevInput = (e.target as HTMLElement).parentElement?.previousElementSibling?.querySelector("input");
                                    prevInput?.focus();
                                  }, 0);
                                }
                              }}
                              className={cn(
                                "bg-transparent border-none focus:ring-0 p-0 flex-1 outline-none",
                                item.parentEntityId ? "text-black" : "text-neutral-900",
                                item.isBold && "font-bold",
                                !item.isBold && "font-medium",
                                item.isUnderline && "underline decoration-1",
                                item.textAlign === "center" && "text-center",
                                item.textAlign === "right" && "text-right",
                                item.fontSize === "small" && "text-xs",
                                (!item.fontSize || item.fontSize === "normal") && "text-base",
                                item.fontSize === "large" && "text-lg",
                                item.fontSize === "xlarge" && "text-xl"
                              )}
                              autoFocus={idx === arr.length - 1}
                              placeholder={idx === 0 ? (item.type === "bullet-text" ? "Type here, Enter for new bullet" : "Type here, Enter for new item") : ""}
                            />
                          ) : (
                            <span className={cn(
                              item.parentEntityId ? "text-black" : "text-neutral-900",
                              item.isBold && "font-bold",
                              !item.isBold && "font-medium",
                              item.isUnderline && "underline decoration-1",
                              item.textAlign === "center" && "text-center",
                              item.textAlign === "right" && "text-right",
                              item.fontSize === "small" && "text-xs",
                              (!item.fontSize || item.fontSize === "normal") && "text-base",
                              item.fontSize === "large" && "text-lg",
                              item.fontSize === "xlarge" && "text-xl"
                            )}>{line || "\u00A0"}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {item.hasBullet && (
                        <span className={cn(item.parentEntityId ? "text-black" : "text-neutral-900", "font-bold text-lg")}>•</span>
                      )}
                      {editingItemId === item.id && !disabled && !(mode === "erd-annotation" && item.isBaseItem) ? (
                        <textarea
                          ref={paragraphTextareaRef}
                          autoFocus
                          value={item.content}
                          onChange={(e) => updateItem(item.id, { content: e.target.value })}
                          onBlur={(e) => {
                            if (e.relatedTarget && (e.relatedTarget as HTMLElement).closest("[title*='Underline']")) return;
                            setEditingItemId(null);
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Escape") { setEditingItemId(null); }
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          rows={Math.max(1, (item.content || "").split("\n").length)}
                          spellCheck={false}
                          className={cn(
                            "bg-transparent border-none focus:ring-0 p-1 w-full resize-none overflow-hidden outline-none cursor-text",
                            item.parentEntityId ? "text-black" : "text-neutral-900",
                            item.isBold && "font-bold",
                            !item.isBold && "font-medium",
                            (item.isUnderline || item.type === "link-text") && "underline decoration-1",
                            item.marking === "primary" && "underline decoration-2 decoration-red-600",
                            item.textAlign === "center" && "text-center w-full",
                            item.textAlign === "right" && "text-right",
                            item.fontSize === "small" && "text-xs",
                            (!item.fontSize || item.fontSize === "normal") && "text-base",
                            item.fontSize === "large" && "text-lg",
                            item.fontSize === "xlarge" && "text-xl"
                          )}
                          placeholder="Enter text (one per line)"
                        />
                      ) : (
                        <div
                          onDoubleClick={(e) => handleDoubleClick(e, item.id)}
                          className={cn(
                            "w-full cursor-default p-1 whitespace-pre-wrap",
                            item.parentEntityId ? "text-black" : "text-neutral-900",
                            item.isBold && "font-bold",
                            !item.isBold && "font-medium",
                            (item.isUnderline || item.type === "link-text") && "underline decoration-1",
                            item.marking === "primary" && "underline decoration-2 decoration-red-600",
                            item.textAlign === "center" && "text-center",
                            item.textAlign === "right" && "text-right",
                            item.fontSize === "small" && "text-xs",
                            (!item.fontSize || item.fontSize === "normal") && "text-base",
                            item.fontSize === "large" && "text-lg",
                            item.fontSize === "xlarge" && "text-xl",
                            !(item.content) && "opacity-50"
                          )}
                        >
                          {item.content ? (
                            item.content.split("\n").map((line, idx) => (
                              <div key={idx}>
                                {line.split(/(_[^_]+_)/g).map((part, i) =>
                                  part.startsWith("_") && part.endsWith("_") && part.length > 2 ? (
                                    <span key={i} className="underline decoration-1">{part.slice(1, -1)}</span>
                                  ) : (
                                    <span key={i}>{part}</span>
                                  )
                                )}
                              </div>
                            ))
                          ) : (
                            <span>Double-click to edit</span>
                          )}
                        </div>
                      )}
                      {item.marking === "foreign" && <span className="text-red-600 font-bold">*</span>}
                    </>
                  )}
                </div>
              </div>
            ) : item.type === "ui-window" ? (
              <>
                <div className="w-full h-6 bg-neutral-200 border-b border-neutral-300 flex items-center px-2">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    </div>
                </div>
                <div className="flex-1 p-2">
                     <input
                        type="text"
                        value={item.content || ""}
                        placeholder="Window Title"
                        onChange={(e) => updateItem(item.id, { content: e.target.value })}
                        className="bg-transparent border-none focus:ring-0 w-full font-bold text-neutral-700 outline-none cursor-move placeholder:text-neutral-400/50"
                      />
                </div>
              </>
            ) : item.type === "ui-image" ? (
               <div className="w-full h-full relative flex items-center justify-center">
                 {/* X through the box for image placeholder */}
                 <svg className="absolute inset-0 w-full h-full pointer-events-none">
                   <line x1="0" y1="0" x2="100%" y2="100%" stroke="#9ca3af" strokeWidth="1" />
                   <line x1="100%" y1="0" x2="0" y2="100%" stroke="#9ca3af" strokeWidth="1" />
                 </svg>
                 <input
                    type="text"
                    value={item.content || ""}
                    placeholder="image.jpg"
                    onChange={(e) => updateItem(item.id, { content: e.target.value })}
                    className="bg-white/80 border-none focus:ring-0 text-center w-auto px-2 outline-none cursor-text placeholder:text-neutral-400 text-xs text-neutral-700 z-10"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
               </div>
            ) : item.type === "ui-dropdown" ? (
                <>
                   <input
                    type="text"
                    value={item.content || ""}
                    placeholder="Select..."
                    onChange={(e) => updateItem(item.id, { content: e.target.value })}
                    className="bg-transparent border-none focus:ring-0 w-full outline-none cursor-text placeholder:text-neutral-400 text-sm text-neutral-900"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                </>
            ) : item.type === "ui-textarea" ? (
                <div className="w-full h-full flex items-start">
                   <input
                    type="text"
                    value={item.content || ""}
                    placeholder="Text area..."
                    onChange={(e) => updateItem(item.id, { content: e.target.value })}
                    className="bg-transparent border-none focus:ring-0 w-full outline-none cursor-text placeholder:text-neutral-400 text-sm text-neutral-900"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
            ) : item.type === "ui-radio" ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-neutral-400 bg-white flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-neutral-400"></div>
                  </div>
                  <input
                    type="text"
                    value={item.content || ""}
                    placeholder="Option"
                    onChange={(e) => updateItem(item.id, { content: e.target.value })}
                    className="bg-transparent border-none focus:ring-0 flex-1 outline-none cursor-text placeholder:text-neutral-400 text-sm text-neutral-900"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </>
            ) : item.type === "ui-checkbox" ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-400 bg-white rounded-sm flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    value={item.content || ""}
                    placeholder="Check this"
                    onChange={(e) => updateItem(item.id, { content: e.target.value })}
                    className="bg-transparent border-none focus:ring-0 flex-1 outline-none cursor-text placeholder:text-neutral-400 text-sm text-neutral-900"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </>
            ) : item.type === "ui-submit" ? (
                <input
                  type="text"
                  value={item.content || ""}
                  placeholder="Submit"
                  onChange={(e) => updateItem(item.id, { content: e.target.value })}
                  className="bg-transparent border-none focus:ring-0 w-full text-center outline-none cursor-text placeholder:text-white/70 text-sm text-white"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
            ) : item.type === "ui-label" ? (
                <input
                  type="text"
                  value={item.content || ""}
                  placeholder="Label:"
                  onChange={(e) => {
                    const newContent = e.target.value;
                    // Measure text width and auto-resize label, growing to the left
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                      ctx.font = "500 14px system-ui, sans-serif"; // Match text-sm font-medium
                      const textWidth = ctx.measureText(newContent || "Label:").width;
                      const minWidth = 80;
                      const padding = 8; // Some padding for the input
                      const newWidth = Math.max(minWidth, textWidth + padding);
                      const oldWidth = item.width || minWidth;
                      
                      if (newWidth !== oldWidth) {
                        // Grow to the left: shift x position by the difference
                        const widthDelta = newWidth - oldWidth;
                        updateItem(item.id, { 
                          content: newContent, 
                          width: newWidth,
                          x: item.x - widthDelta
                        });
                        return;
                      }
                    }
                    updateItem(item.id, { content: newContent });
                  }}
                  className="bg-transparent border-none focus:ring-0 w-full text-right outline-none cursor-text placeholder:text-neutral-400 text-sm font-medium text-neutral-900"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
            ) : item.type === "wf-paragraph" ? (
              <div className="w-full h-full flex flex-col overflow-hidden">
                {selectedId === item.id && !disabled && (
                  <div className="absolute -top-8 left-0 flex gap-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded shadow-lg p-1 z-50">
                    <button
                      onClick={(e) => { e.stopPropagation(); updateItem(item.id, { isBold: !item.isBold }); }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        item.isBold && "bg-neutral-200 dark:bg-neutral-600"
                      )}
                      title="Bold"
                      data-testid="button-paragraph-bold"
                    >
                      B
                    </button>
                    <button
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const ta = paragraphTextareaRef.current;
                        if (ta && editingItemId === item.id) {
                          const start = ta.selectionStart;
                          const end = ta.selectionEnd;
                          const text = item.content || "";
                          if (start !== end) {
                            const selected = text.slice(start, end);
                            if (selected.startsWith("_") && selected.endsWith("_") && selected.length > 2) {
                              const unwrapped = text.slice(0, start) + selected.slice(1, -1) + text.slice(end);
                              updateItem(item.id, { content: unwrapped });
                              setTimeout(() => { ta.selectionStart = start; ta.selectionEnd = end - 2; }, 0);
                            } else {
                              const wrapped = text.slice(0, start) + "_" + selected + "_" + text.slice(end);
                              updateItem(item.id, { content: wrapped });
                              setTimeout(() => { ta.selectionStart = start; ta.selectionEnd = end + 2; }, 0);
                            }
                          }
                        }
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded text-xs underline hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      title="Underline selected text"
                      data-testid="button-paragraph-underline"
                    >
                      U
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateItem(item.id, { hasBullet: !item.hasBullet }); }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        item.hasBullet && "bg-neutral-200 dark:bg-neutral-600"
                      )}
                      title="Bullet Points"
                      data-testid="button-paragraph-bullet"
                    >
                      •
                    </button>
                    <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600 mx-0.5 self-center" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const sizes: Array<"small" | "normal" | "large" | "xlarge"> = ["small", "normal", "large", "xlarge"];
                        const currentIdx = sizes.indexOf(item.fontSize || "small");
                        if (currentIdx > 0) {
                          updateItem(item.id, { fontSize: sizes[currentIdx - 1] });
                        }
                      }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        (item.fontSize === "small" || !item.fontSize) && "opacity-50 cursor-not-allowed"
                      )}
                      title="Decrease text size"
                      data-testid="button-paragraph-size-down"
                    >
                      A-
                    </button>
                    <span className="w-6 h-6 flex items-center justify-center text-[10px] text-neutral-500">
                      {(item.fontSize || "small") === "small" ? "S" : (item.fontSize || "small") === "normal" ? "M" : (item.fontSize || "small") === "large" ? "L" : "XL"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const sizes: Array<"small" | "normal" | "large" | "xlarge"> = ["small", "normal", "large", "xlarge"];
                        const currentIdx = sizes.indexOf(item.fontSize || "small");
                        if (currentIdx < sizes.length - 1) {
                          updateItem(item.id, { fontSize: sizes[currentIdx + 1] });
                        }
                      }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        (item.fontSize === "xlarge") && "opacity-50 cursor-not-allowed"
                      )}
                      title="Increase text size"
                      data-testid="button-paragraph-size-up"
                    >
                      A+
                    </button>
                  </div>
                )}
                {editingItemId === item.id && !disabled ? (
                  <textarea
                    ref={paragraphTextareaRef}
                    autoFocus
                    value={item.content || ""}
                    placeholder={item.hasBullet ? "Type here, one bullet per line" : "Type paragraph text here...\nSelect text and press U to underline"}
                    onChange={(e) => updateItem(item.id, { content: e.target.value })}
                    onBlur={(e) => {
                      if (e.relatedTarget && (e.relatedTarget as HTMLElement).closest("[data-testid='button-paragraph-underline']")) return;
                      setEditingItemId(null);
                    }}
                    onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Escape") { setEditingItemId(null); } }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "bg-transparent border-none focus:ring-0 w-full h-full p-0 outline-none cursor-text resize-none text-neutral-700 placeholder:text-neutral-400 leading-relaxed",
                      item.isBold && "font-bold",
                      item.fontSize === "small" && "text-xs",
                      item.fontSize === "normal" && "text-sm",
                      item.fontSize === "large" && "text-base",
                      item.fontSize === "xlarge" && "text-lg",
                      !item.fontSize && "text-xs"
                    )}
                  />
                ) : (
                  <div
                    onDoubleClick={(e) => handleDoubleClick(e, item.id)}
                    className="w-full h-full cursor-default"
                  >
                    {item.content ? (
                      item.hasBullet ? (
                        <div className={cn(
                          "text-neutral-700 leading-relaxed",
                          item.isBold && "font-bold",
                          item.fontSize === "small" && "text-xs",
                          item.fontSize === "normal" && "text-sm",
                          item.fontSize === "large" && "text-base",
                          item.fontSize === "xlarge" && "text-lg",
                          !item.fontSize && "text-xs"
                        )}>
                          {item.content.split("\n").map((line, idx) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span className="shrink-0">•</span>
                              <span className="break-words">
                                {line.split(/(_[^_]+_)/g).map((part, i) =>
                                  part.startsWith("_") && part.endsWith("_") && part.length > 2 ? (
                                    <span key={i} className="underline decoration-1">{part.slice(1, -1)}</span>
                                  ) : (
                                    <span key={i}>{part}</span>
                                  )
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={cn(
                          "text-neutral-700 leading-relaxed whitespace-pre-wrap break-words",
                          item.isBold && "font-bold",
                          item.fontSize === "small" && "text-xs",
                          item.fontSize === "normal" && "text-sm",
                          item.fontSize === "large" && "text-base",
                          item.fontSize === "xlarge" && "text-lg",
                          !item.fontSize && "text-xs"
                        )}>
                          {item.content.split(/(_[^_]+_)/g).map((part, i) =>
                            part.startsWith("_") && part.endsWith("_") && part.length > 2 ? (
                              <span key={i} className="underline decoration-1">{part.slice(1, -1)}</span>
                            ) : (
                              <span key={i}>{part}</span>
                            )
                          )}
                        </div>
                      )
                    ) : null}
                    {(() => {
                      const fontSize = item.fontSize || "small";
                      const lineH = fontSize === "small" ? 14 : fontSize === "normal" ? 18 : fontSize === "large" ? 22 : 26;
                      const barH = Math.max(2, Math.round(lineH * 0.4));
                      const gapH = lineH - barH;
                      const padding = 8;
                      const boxH = item.height || 80;
                      const textLines = item.content ? item.content.split("\n").length : 0;
                      const textH = textLines * lineH;
                      const remainH = boxH - (2 * padding) - textH;
                      const fillerCount = Math.floor(remainH / lineH);
                      if (fillerCount <= 0) return null;
                      const widths = ["100%", "100%", "92%", "97%", "85%", "100%", "95%", "88%", "100%", "62%"];
                      return (
                        <div className="w-full" style={{ marginTop: textLines > 0 ? `${gapH}px` : 0 }}>
                          {Array.from({ length: fillerCount }).map((_, i) => (
                            <div key={i} style={{ height: `${lineH}px`, display: "flex", alignItems: "center" }}>
                              <div
                                style={{ height: `${barH}px`, width: widths[i % widths.length] }}
                                className="bg-neutral-200 dark:bg-neutral-600 rounded"
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : item.type === "wf-audio" ? (
              <div className="w-full h-full flex items-center gap-2 px-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 text-neutral-500" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                <div className="flex-1 flex items-center gap-1">
                  <div className="h-1 bg-neutral-400 rounded flex-1"></div>
                </div>
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                <input
                  type="text"
                  value={item.content || ""}
                  placeholder="audio.mp3"
                  onChange={(e) => updateItem(item.id, { content: e.target.value })}
                  className="bg-transparent border-none focus:ring-0 w-16 text-right outline-none cursor-text placeholder:text-neutral-400 text-[10px] text-neutral-500"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            ) : item.type === "wf-video" ? (
              <div className="w-full h-full relative flex flex-col items-center justify-center">
                <svg viewBox="0 0 48 48" className="w-12 h-12 text-neutral-500" fill="currentColor">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" />
                  <polygon points="19,14 19,34 36,24" />
                </svg>
                <input
                  type="text"
                  value={item.content || ""}
                  placeholder="video.mp4"
                  onChange={(e) => updateItem(item.id, { content: e.target.value })}
                  className="bg-transparent border-none focus:ring-0 text-center w-auto px-2 outline-none cursor-text placeholder:text-neutral-400 text-xs text-neutral-500 mt-1"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            ) : item.type === "wf-div" ? (
              <div className="w-full h-full" />
            ) : item.type === "erd-entity" ? (
              <div className="w-full h-full flex flex-col bg-white border-2 border-neutral-800 rounded overflow-hidden">
                {/* Header - Entity Name */}
                <div className="bg-neutral-200 border-b-2 border-neutral-800 px-2 py-1 flex items-center justify-center">
                  <input
                    type="text"
                    value={item.entityName || "Entity"}
                    onChange={(e) => updateItem(item.id, { entityName: e.target.value })}
                    className="bg-transparent border-none text-center font-bold text-sm text-neutral-900 outline-none w-full"
                    disabled={disabled || (mode === "erd-annotation" && item.isBaseItem)}
                  />
                </div>
                {/* Body - Attributes */}
                <div className="flex-1 p-1 overflow-y-auto text-xs">
                  {(item.attributes || []).map((attr, idx) => (
                    <div 
                      key={attr.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAttributeId(attr.id);
                      }}
                      className={cn(
                        "flex items-center gap-1 px-1 py-0.5 rounded cursor-pointer hover:bg-neutral-100",
                        selectedAttributeId === attr.id && selectedId === item.id && "bg-blue-100 ring-1 ring-blue-400"
                      )}
                    >
                      <span className={cn(
                        "flex-1",
                        attr.marking === "primary" && "underline decoration-2"
                      )}>
                        {selectedId === item.id && !disabled && !(mode === "erd-annotation" && item.isBaseItem) ? (
                          <input
                            type="text"
                            value={attr.name}
                            onChange={(e) => updateEntityAttribute(item.id, attr.id, { name: e.target.value })}
                            placeholder="attribute"
                            className="bg-transparent border-none outline-none w-full text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          attr.name || "attribute"
                        )}
                      </span>
                      {attr.marking === "foreign" && <span className="text-red-600 font-bold">*</span>}
                      {selectedId === item.id && selectedAttributeId === attr.id && !disabled && (
                        <div className="flex gap-0.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleAttributeMarking(item.id, attr.id); }}
                            className="text-[10px] bg-blue-500 text-white px-1 rounded hover:bg-blue-600"
                            title="Toggle marking"
                          >
                            Mark
                          </button>
                          {!(mode === "erd-annotation" && item.isBaseItem) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteEntityAttribute(item.id, attr.id); }}
                              className="text-[10px] bg-red-500 text-white px-1 rounded hover:bg-red-600"
                              title="Delete"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {selectedId === item.id && !disabled && (
                    <button
                      onClick={(e) => { e.stopPropagation(); addAttributeToEntity(item.id); }}
                      className="w-full text-[10px] text-blue-600 hover:bg-blue-50 rounded py-0.5 mt-1"
                    >
                      + Add Attribute
                    </button>
                  )}
                </div>
              </div>
            ) : item.type === "line" ? (
               null // Lines rendered as SVG below
            ) : (
               <div className={cn("w-full h-full flex items-center justify-center text-sm text-neutral-900 font-semibold z-10 relative overflow-hidden", getTextClasses(item.type))}>
                  {/* Edit mode: controlled input when double-clicked */}
                  {editingItemId === item.id && !disabled && !(mode === "erd-annotation" && item.isBaseItem) ? (
                    <textarea
                      autoFocus
                      value={item.content || ""}
                      onChange={(e) => updateItem(item.id, { content: e.target.value })}
                      onBlur={() => setEditingItemId(null)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Escape') {
                          setEditingItemId(null);
                        }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "w-full h-full bg-transparent outline-none text-center px-1 border-2 border-blue-400 font-semibold resize-none",
                        item.marking === "primary" && "underline decoration-2 decoration-red-600"
                      )}
                      style={{ 
                        fontSize: '14px',
                        lineHeight: '1.3',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                      }}
                    />
                  ) : (
                    /* Display mode: just show content, double-click to edit */
                    <div
                      onDoubleClick={(e) => handleDoubleClick(e, item.id)}
                      className={cn(
                        "w-full h-full flex items-center justify-center bg-transparent text-center px-1 whitespace-pre-wrap cursor-default",
                        item.marking === "primary" && "underline decoration-2 decoration-red-600"
                      )}
                      style={{ 
                        fontSize: '14px',
                        lineHeight: '1.3',
                        wordBreak: 'break-word'
                      }}
                      dangerouslySetInnerHTML={{ __html: (item.content || "").replace(/\n/g, '<br>') + (item.marking === "foreign" ? '<span class="text-red-600 font-bold ml-1">*</span>' : '') }}
                    />
                  )}
               </div>
            )}
            
            {/* Validation text display for form inputs - show content as validation for text inputs */}
            {/* Also supports legacy validationMessage/validationMin/validationMax fields for backward compatibility */}
            {(item.type === "ui-input" || item.type === "ui-textarea") && 
             (item.content || item.validationMessage || item.validationMin !== undefined || item.validationMax !== undefined) && (
              <div 
                className="absolute left-0 right-0 text-[10px] text-amber-600 dark:text-amber-400 italic pointer-events-none z-10"
                style={{ top: `${(item.height || 28) + 2}px` }}
              >
                Validation: {item.content || item.validationMessage || `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}`}
              </div>
            )}
            {/* Dropdown legacy validation display (backward compat only - new dropdowns don't use validation) */}
            {item.type === "ui-dropdown" && 
             (item.validationMessage || item.validationMin !== undefined || item.validationMax !== undefined) && (
              <div 
                className="absolute left-0 right-0 text-[10px] text-amber-600 dark:text-amber-400 italic pointer-events-none z-10"
                style={{ top: `${(item.height || 28) + 2}px` }}
              >
                Validation: {item.validationMessage || `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}`}
              </div>
            )}
            
            {selectedId === item.id && !disabled && (
              <>
               <button 
                 onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                 className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 z-20"
               >
                 <X className="w-3 h-3" />
               </button>
               
               {/* Marking toggle for shapes (not ERD entities which have their own system) */}
               {item.type !== "erd-entity" && item.type !== "line" && item.type !== "crowfoot" && (mode === "erd-annotation" || mode === "database") && (
                 <button
                   onClick={(e) => { e.stopPropagation(); toggleMarking(item.id); }}
                   className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded shadow hover:bg-blue-600 z-20"
                   title="Toggle marking"
                 >
                   Mark
                 </button>
               )}
               
               {/* Resize handles */}
               {item.type !== "text" && (
                 <>
                   <div 
                     onMouseDown={(e) => handleResizeMouseDown(e, item.id, "se")}
                     className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 border border-white rounded-sm cursor-se-resize z-20"
                   />
                   <div 
                     onMouseDown={(e) => handleResizeMouseDown(e, item.id, "sw")}
                     className="absolute -bottom-1 -left-1 w-3 h-3 bg-red-500 border border-white rounded-sm cursor-sw-resize z-20"
                   />
                   <div 
                     onMouseDown={(e) => handleResizeMouseDown(e, item.id, "ne")}
                     className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border border-white rounded-sm cursor-ne-resize z-20"
                   />
                   <div 
                     onMouseDown={(e) => handleResizeMouseDown(e, item.id, "nw")}
                     className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 border border-white rounded-sm cursor-nw-resize z-20"
                   />
                   <div 
                     onMouseDown={(e) => handleResizeMouseDown(e, item.id, "e")}
                     className="absolute top-1/2 -right-1 w-2 h-4 -translate-y-1/2 bg-red-500 border border-white rounded-sm cursor-e-resize z-20"
                   />
                   <div 
                     onMouseDown={(e) => handleResizeMouseDown(e, item.id, "w")}
                     className="absolute top-1/2 -left-1 w-2 h-4 -translate-y-1/2 bg-red-500 border border-white rounded-sm cursor-w-resize z-20"
                   />
                 </>
               )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
