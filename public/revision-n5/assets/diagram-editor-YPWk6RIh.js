import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, g as cn, X, h as Type } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { P as Pencil } from "./pencil-BpyvL5SV.js";
import { T as Trash2 } from "./trash-2-bLg5w6uM.js";
import { C as Circle } from "./circle-D4qz0ZWK.js";
import { D as Database } from "./database-C7hi9e55.js";
import { L as List } from "./list-CSQ5KgpQ.js";
import { C as ChevronDown } from "./chevron-down-C5HdvL5Z.js";
import { C as Check } from "./check-tIL4sncn.js";
const __iconNode$c = [
  ["path", { d: "M12 5v14", key: "s699le" }],
  ["path", { d: "m19 12-7 7-7-7", key: "1idqje" }]
];
const ArrowDown = createLucideIcon("arrow-down", __iconNode$c);
const __iconNode$b = [
  ["path", { d: "m5 12 7-7 7 7", key: "hav0vg" }],
  ["path", { d: "M12 19V5", key: "x0mq9r" }]
];
const ArrowUp = createLucideIcon("arrow-up", __iconNode$b);
const __iconNode$a = [
  [
    "path",
    {
      d: "M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z",
      key: "1f1r0c"
    }
  ]
];
const Diamond = createLucideIcon("diamond", __iconNode$a);
const __iconNode$9 = [
  [
    "path",
    {
      d: "M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21",
      key: "g5wo59"
    }
  ],
  ["path", { d: "m5.082 11.09 8.828 8.828", key: "1wx5vj" }]
];
const Eraser = createLucideIcon("eraser", __iconNode$9);
const __iconNode$8 = [
  ["rect", { width: "18", height: "7", x: "3", y: "3", rx: "1", key: "f1a2em" }],
  ["rect", { width: "9", height: "7", x: "3", y: "14", rx: "1", key: "jqznyg" }],
  ["rect", { width: "5", height: "7", x: "16", y: "14", rx: "1", key: "q5h2i8" }]
];
const LayoutTemplate = createLucideIcon("layout-template", __iconNode$8);
const __iconNode$7 = [["path", { d: "M5 12h14", key: "1ays0h" }]];
const Minus = createLucideIcon("minus", __iconNode$7);
const __iconNode$6 = [
  [
    "path",
    {
      d: "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z",
      key: "edeuup"
    }
  ]
];
const MousePointer2 = createLucideIcon("mouse-pointer-2", __iconNode$6);
const __iconNode$5 = [
  ["circle", { cx: "6", cy: "19", r: "3", key: "1kj8tv" }],
  ["path", { d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15", key: "1d8sl" }],
  ["circle", { cx: "18", cy: "5", r: "3", key: "gq8acd" }]
];
const Route = createLucideIcon("route", __iconNode$5);
const __iconNode$4 = [
  ["circle", { cx: "19", cy: "5", r: "2", key: "mhkx31" }],
  ["circle", { cx: "5", cy: "19", r: "2", key: "v8kfzx" }],
  ["path", { d: "M5 17A12 12 0 0 1 17 5", key: "1okkup" }]
];
const Spline = createLucideIcon("spline", __iconNode$4);
const __iconNode$3 = [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }]
];
const Square = createLucideIcon("square", __iconNode$3);
const __iconNode$2 = [
  ["path", { d: "M21 5H3", key: "1fi0y6" }],
  ["path", { d: "M17 12H7", key: "16if0g" }],
  ["path", { d: "M19 19H5", key: "vjpgq2" }]
];
const TextAlignCenter = createLucideIcon("text-align-center", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "M21 5H3", key: "1fi0y6" }],
  ["path", { d: "M21 12H9", key: "dn1m92" }],
  ["path", { d: "M21 19H7", key: "4cu937" }]
];
const TextAlignEnd = createLucideIcon("text-align-end", __iconNode$1);
const __iconNode = [
  ["path", { d: "M21 5H3", key: "1fi0y6" }],
  ["path", { d: "M15 12H3", key: "6jk70r" }],
  ["path", { d: "M17 19H3", key: "z6ezky" }]
];
const TextAlignStart = createLucideIcon("text-align-start", __iconNode);
function DiagramEditor({ initialData, initialDrawing, onChange, disabled, backgroundUrl, mode = "general", baseDiagram, showFunctionNumbers = false, allowBaseItemDeletion = false }) {
  const [items, setItems] = reactExports.useState(() => {
    if ((mode === "erd-annotation" || mode === "nav-structure" || mode === "nav-structure-higher" || mode === "structure-dataflow" || mode === "structure-diagram" || mode === "entity-occurrence") && baseDiagram) {
      try {
        const baseItems = JSON.parse(baseDiagram).map((item) => ({
          ...item,
          isBaseItem: true
        }));
        if (initialData) {
          const studentItems = JSON.parse(initialData);
          const studentAdditions = studentItems.filter((si) => !baseItems.some((bi) => bi.id === si.id));
          const mergedBase = baseItems.map((bi) => {
            const studentVersion = studentItems.find((si) => si.id === bi.id);
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
  const [selectedId, setSelectedId] = reactExports.useState(null);
  const [editingItemId, setEditingItemId] = reactExports.useState(null);
  const [tool, setTool] = reactExports.useState("select");
  const [selectedAttributeId, setSelectedAttributeId] = reactExports.useState(null);
  const [isDraggingNewShape, setIsDraggingNewShape] = reactExports.useState(false);
  const [dragStart, setDragStart] = reactExports.useState(null);
  const [tempShape, setTempShape] = reactExports.useState(null);
  const containerRef = reactExports.useRef(null);
  const canvasRef = reactExports.useRef(null);
  const canvasInitializedRef = reactExports.useRef(false);
  const canvasClearedRef = reactExports.useRef(false);
  const paragraphTextareaRef = reactExports.useRef(null);
  const isWireframeMode = mode === "webpage-wireframe" || mode === "form-wireframe";
  const defaultHeight = isWireframeMode ? 650 : 400;
  const defaultWidth = isWireframeMode ? 450 : void 0;
  const [containerHeight, setContainerHeight] = reactExports.useState(defaultHeight);
  const [containerWidth, setContainerWidth] = reactExports.useState(defaultWidth);
  reactExports.useEffect(() => {
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
  const [isDrawing, setIsDrawing] = reactExports.useState(false);
  const [color, setColor] = reactExports.useState("#000000");
  const functionNumberMap = reactExports.useMemo(() => {
    if (!showFunctionNumbers) return {};
    const functionBoxes = items.filter((i) => i.type === "box").sort((a, b) => {
      const yDiff = a.y - b.y;
      if (Math.abs(yDiff) > 30) return yDiff;
      return a.x - b.x;
    });
    const map = {};
    functionBoxes.forEach((box, idx) => {
      map[box.id] = idx + 1;
    });
    return map;
  }, [items, showFunctionNumbers]);
  const onChangeRef = reactExports.useRef(onChange);
  const debounceTimerRef = reactExports.useRef(null);
  const lastSyncedDataRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  reactExports.useEffect(() => {
    if (!onChangeRef.current) return;
    const data = JSON.stringify(items);
    if (lastSyncedDataRef.current === data) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (!onChangeRef.current) return;
      lastSyncedDataRef.current = data;
      const canvas = canvasRef.current;
      const drawingData = canvas ? canvas.toDataURL() : "";
      onChangeRef.current(data, drawingData);
    }, 150);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [items]);
  reactExports.useEffect(() => {
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
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = containerWidth || canvas.parentElement?.clientWidth || 800;
    canvas.height = containerHeight;
    if (initialDrawing && !canvasClearedRef.current) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.src = initialDrawing;
        img.onload = () => ctx.drawImage(img, 0, 0);
      }
    }
  }, [containerHeight, containerWidth]);
  const getShapeCenter = (item) => {
    const width = item.width || (item.type === "circle" ? 40 : 120);
    const height = item.height || (item.type === "circle" ? 40 : 60);
    return {
      x: item.x + width / 2,
      y: item.y + height / 2
    };
  };
  const getShapeAnchors = (shape) => {
    const w = shape.width || 120;
    const h = shape.height || 50;
    if (shape.type === "entity-oval" && shape.occurrences) {
      const anchors = [];
      const occurrenceHeight = 24;
      const startY = 30;
      const rx = w / 2;
      const ry = h / 2;
      const dotMargin = 8;
      shape.occurrences.forEach((occ, idx) => {
        const occCenterY = startY + idx * occurrenceHeight + occurrenceHeight / 2;
        const dy = occCenterY - ry;
        const xFromCenter = rx * Math.sqrt(Math.max(0, 1 - dy * dy / (ry * ry)));
        const dotInset = rx - xFromCenter + dotMargin;
        const occY = shape.y + occCenterY;
        if (occ.dotPosition === "left" || occ.dotPosition === "both") {
          anchors.push({ x: shape.x + dotInset, y: occY, side: "left", shapeId: shape.id, occurrenceId: occ.id });
        }
        if (occ.dotPosition === "right" || occ.dotPosition === "both") {
          anchors.push({ x: shape.x + w - dotInset, y: occY, side: "right", shapeId: shape.id, occurrenceId: occ.id });
        }
      });
      return anchors;
    }
    if (shape.type === "entity-occurrence") {
      const dotPos = shape.dotPosition || "left";
      const anchors = [];
      if (dotPos === "left" || dotPos === "both") {
        anchors.push({ x: shape.x, y: shape.y + h / 2, side: "left", shapeId: shape.id });
      }
      if (dotPos === "right" || dotPos === "both") {
        anchors.push({ x: shape.x + w, y: shape.y + h / 2, side: "right", shapeId: shape.id });
      }
      return anchors;
    }
    return [
      { x: shape.x + w / 2, y: shape.y, side: "top", shapeId: shape.id },
      { x: shape.x + w / 2, y: shape.y + h, side: "bottom", shapeId: shape.id },
      { x: shape.x, y: shape.y + h / 2, side: "left", shapeId: shape.id },
      { x: shape.x + w, y: shape.y + h / 2, side: "right", shapeId: shape.id }
    ];
  };
  const findNearestAnchor = (x, y) => {
    const ANCHOR_SNAP_DISTANCE = 20;
    let nearestAnchor = null;
    let nearestDistance = ANCHOR_SNAP_DISTANCE;
    const anchorableTypes = mode === "structure-diagram" ? ["struct-process", "struct-decision", "struct-loop"] : mode === "entity-occurrence" ? ["entity-oval", "entity-occurrence"] : ["nav-page"];
    for (const item of items) {
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
  const getAnchorByIdAndSide = (shapeId, side) => {
    const shape = items.find((i) => i.id === shapeId);
    if (!shape) return null;
    const w = shape.width || 120;
    const h = shape.height || 50;
    switch (side) {
      case "top":
        return { x: shape.x + w / 2, y: shape.y };
      case "bottom":
        return { x: shape.x + w / 2, y: shape.y + h };
      case "left":
        return { x: shape.x, y: shape.y + h / 2 };
      case "right":
        return { x: shape.x + w, y: shape.y + h / 2 };
    }
  };
  const getNavAnchorPoint = (shape, targetX, targetY) => {
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
        return { x: centerX, y: shapeBottom, side: "bottom" };
      } else {
        return { x: shapeLeft, y: centerY, side: "left" };
      }
    } else if (dy < 0) {
      if (isHorizontallyAligned) {
        return { x: centerX, y: shapeTop, side: "top" };
      } else {
        return { x: shapeLeft, y: centerY, side: "left" };
      }
    } else {
      if (dx > 0) {
        return { x: shapeRight, y: centerY, side: "right" };
      } else {
        return { x: shapeLeft, y: centerY, side: "left" };
      }
    }
  };
  const getDataflowEdgeAnchor = (box, direction) => {
    const width = box.width || 120;
    const height = box.height || 60;
    const bottomY = box.y + height;
    if (direction === "up") {
      return { x: box.x + width * 0.25, y: bottomY };
    } else {
      return { x: box.x + width * 0.75, y: bottomY };
    }
  };
  const findFunctionBoxForArrow = (arrowX, arrowY) => {
    const TOLERANCE = 50;
    for (const item of items) {
      if (item.type !== "box") continue;
      const width = item.width || 120;
      const height = item.height || 60;
      const inHorizontalBounds = arrowX >= item.x && arrowX <= item.x + width;
      if (!inHorizontalBounds) continue;
      const bottomEdge = item.y + height;
      if (arrowY >= bottomEdge - TOLERANCE && arrowY <= bottomEdge + 120) {
        return item;
      }
    }
    return null;
  };
  const getEdgeIntersection = (shape, targetX, targetY) => {
    const width = shape.width || (shape.type === "circle" ? 40 : 120);
    const height = shape.height || (shape.type === "circle" ? 40 : 60);
    const centerX = shape.x + width / 2;
    const centerY = shape.y + height / 2;
    const dx = targetX - centerX;
    const dy = targetY - centerY;
    if (dx === 0 && dy === 0) {
      return { x: centerX, y: centerY };
    }
    if (shape.type === "circle" || shape.type === "ellipse") {
      const rx = width / 2;
      const ry = height / 2;
      const angle = Math.atan2(dy, dx);
      return {
        x: centerX + rx * Math.cos(angle),
        y: centerY + ry * Math.sin(angle)
      };
    }
    const halfW = width / 2;
    const halfH = height / 2;
    let t = Infinity;
    if (dx > 0) {
      const tRight = halfW / dx;
      if (tRight < t && Math.abs(dy * tRight) <= halfH) t = tRight;
    }
    if (dx < 0) {
      const tLeft = -halfW / dx;
      if (tLeft < t && Math.abs(dy * tLeft) <= halfH) t = tLeft;
    }
    if (dy > 0) {
      const tBottom = halfH / dy;
      if (tBottom < t && Math.abs(dx * tBottom) <= halfW) t = tBottom;
    }
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
  const findNearestShape = (x, y, excludeTypes = ["line", "crowfoot", "text", "bullet-text", "numbered-text", "link-text"]) => {
    const SNAP_DISTANCE = mode === "nav-structure-higher" || mode === "structure-diagram" || mode === "entity-occurrence" ? 25 : 60;
    const expandedBounds = mode === "nav-structure-higher" || mode === "structure-diagram" || mode === "entity-occurrence" ? 8 : 20;
    let nearestShape = null;
    let nearestDistance = SNAP_DISTANCE;
    for (const item of items) {
      if (excludeTypes.includes(item.type)) continue;
      const width = item.width || (item.type === "circle" ? 40 : 120);
      const height = item.height || (item.type === "circle" ? 40 : 60);
      const center = getShapeCenter(item);
      const inBounds = x >= item.x - expandedBounds && x <= item.x + width + expandedBounds && y >= item.y - expandedBounds && y <= item.y + height + expandedBounds;
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
  const addItem = (type, x, y, width, height, x2, y2, connectedTo1, connectedTo2, anchor1Side, anchor2Side) => {
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
      if (type === "entity-oval") return void 0;
      if (type === "entity-occurrence") return "Occurrence";
      if (type === "wf-heading") return "Heading";
      if (type === "wf-paragraph") return void 0;
      if (type === "wf-audio") return "audio.mp3";
      if (type === "wf-video") return "video.mp4";
      if (type === "wf-div") return void 0;
      if (type === "wf-annotation") return "annotation";
      return void 0;
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
      if (type === "entity-oval") return 140;
      if (type === "entity-occurrence") return 80;
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
      return void 0;
    };
    const getDefaultHeight = () => {
      if (height) return height;
      if (isErdEntity) return 120;
      if (type === "circle") return 40;
      if (type === "ui-label") return 24;
      if (type === "ui-input") return 28;
      if (type === "ui-dropdown") return 28;
      if (type === "ui-radio" || type === "ui-checkbox") return 24;
      if (type === "ui-submit") return 36;
      if (type === "ui-textarea") return 80;
      if (type === "nav-page") return 50;
      if (type === "nav-highlight") return 150;
      if (type === "struct-process") return 40;
      if (type === "struct-decision") return 50;
      if (type === "struct-loop") return 40;
      if (type === "entity-oval") return 200;
      if (type === "entity-occurrence") return 20;
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
      return void 0;
    };
    const newItemId = Math.random().toString(36).substring(7);
    const isFormInputType = type === "ui-input" || type === "ui-textarea" || type === "ui-dropdown";
    const shouldCreatePairedLabel = mode === "form-wireframe" && isFormInputType;
    const isEntityOval = type === "entity-oval";
    let pairedLabelId = void 0;
    let pairedLabel = void 0;
    if (shouldCreatePairedLabel) {
      pairedLabelId = Math.random().toString(36).substring(7);
      const labelWidth = 80;
      const labelHeight = 24;
      const labelOffsetX = -84;
      const labelOffsetY = ((getDefaultHeight() || 30) - labelHeight) / 2;
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
        pairOffsetY: labelOffsetY
      };
    }
    let linkedTitleId = void 0;
    let linkedTitle = void 0;
    if (isEntityOval) {
      linkedTitleId = Math.random().toString(36).substring(7);
      const entityWidth = getDefaultWidth() || 140;
      const titleWidth = entityWidth;
      const titleHeight = 24;
      linkedTitle = {
        id: linkedTitleId,
        type: "text",
        x,
        // Aligned with entity left edge
        y: y - titleHeight - 8,
        // Position above the entity
        width: titleWidth,
        height: titleHeight,
        content: "Entity",
        textAlign: "center",
        isBold: true,
        parentEntityId: newItemId
        // Link title to entity
      };
    }
    const newItem = {
      id: newItemId,
      type,
      x,
      y,
      content: getDefaultContent(),
      width: getDefaultWidth(),
      height: getDefaultHeight(),
      x2: isLineType ? x2 ?? x + 100 : void 0,
      y2: isLineType ? y2 ?? y : void 0,
      connectedTo1: isLineType ? connectedTo1 : void 0,
      connectedTo2: isLineType ? connectedTo2 : void 0,
      anchor1Side: isLineType ? anchor1Side : void 0,
      anchor2Side: isLineType ? anchor2Side : void 0,
      entityName: isErdEntity ? "Entity" : void 0,
      attributes: isErdEntity ? [{ id: "attr1", name: "attribute1", marking: "none" }] : void 0,
      relationshipLabel: isLineType ? "" : void 0,
      pairedLabelId: shouldCreatePairedLabel ? pairedLabelId : void 0,
      // Entity oval specific fields
      linkedTitleId: isEntityOval ? linkedTitleId : void 0,
      occurrences: isEntityOval ? [
        { id: Math.random().toString(36).substring(7), text: "occurrence 1", dotPosition: "left" },
        { id: Math.random().toString(36).substring(7), text: "occurrence 2", dotPosition: "right" }
      ] : void 0
    };
    if (pairedLabel) {
      setItems((prev) => [...prev, pairedLabel, newItem]);
    } else if (linkedTitle) {
      setItems((prev) => [...prev, linkedTitle, newItem]);
    } else {
      setItems((prev) => [...prev, newItem]);
    }
    setSelectedId(newItem.id);
    setTool("select");
  };
  const handleShapeMouseDown = (e) => {
    if (disabled) return;
    if (tool === "select" || tool === "pencil" || tool === "eraser") return;
    if (e.target.closest(".diagram-item")) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDraggingNewShape(true);
    setDragStart({ x, y });
    const tempId = "temp-" + Math.random().toString(36).substring(7);
    const isLineType = tool === "line" || tool === "crowfoot" || tool === "dataflow-up" || tool === "dataflow-down";
    setTempShape({
      id: tempId,
      type: isLineType && (tool === "dataflow-up" || tool === "dataflow-down") ? "dataflow-arrow" : tool,
      x,
      y,
      width: 10,
      height: 10,
      x2: isLineType ? x : void 0,
      y2: isLineType ? y : void 0
    });
  };
  const handleShapeMouseMove = (e) => {
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
        x2,
        y2
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
        height: Math.max(20, height)
      });
    }
  };
  const handleShapeMouseUp = (e) => {
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
      let connectedTo1;
      let connectedTo2;
      let anchor1Side;
      let anchor2Side;
      if (mode === "nav-structure-higher" || mode === "structure-diagram" || mode === "entity-occurrence") {
        const startAnchor = findNearestAnchor(dragStart.x, dragStart.y);
        const endAnchor = findNearestAnchor(currentX, currentY);
        if (startAnchor) {
          startX = startAnchor.x;
          startY = startAnchor.y;
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
          if (endAnchor.occurrenceId) {
            connectedTo2 = `${endAnchor.shapeId}-occ-${endAnchor.occurrenceId}`;
          } else {
            connectedTo2 = endAnchor.shapeId;
          }
          anchor2Side = endAnchor.side;
        }
      } else {
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
      if (tool === "dataflow-up" || tool === "dataflow-down") {
        const direction = tool === "dataflow-up" ? "up" : "down";
        const functionBox = findFunctionBoxForArrow(startX, startY) || findFunctionBoxForArrow(endX, endY);
        const arrowLength = 50;
        let arrowX1, arrowY1, arrowX2, arrowY2;
        if (functionBox) {
          const edgeAnchor = getDataflowEdgeAnchor(functionBox, direction);
          if (direction === "up") {
            arrowX1 = edgeAnchor.x;
            arrowY1 = edgeAnchor.y + arrowLength;
            arrowX2 = edgeAnchor.x;
            arrowY2 = edgeAnchor.y;
          } else {
            arrowX1 = edgeAnchor.x;
            arrowY1 = edgeAnchor.y;
            arrowX2 = edgeAnchor.x;
            arrowY2 = edgeAnchor.y + arrowLength;
          }
          const arrowId = Math.random().toString(36).substring(7);
          const newArrow = {
            id: arrowId,
            type: "dataflow-arrow",
            x: arrowX1,
            y: arrowY1,
            x2: arrowX2,
            y2: arrowY2,
            dataflowDirection: direction,
            originFunctionId: functionBox.id
          };
          const labelX = arrowX1 - 30;
          const labelY = Math.max(arrowY1, arrowY2) + 10;
          const newLabel = {
            id: Math.random().toString(36).substring(7),
            type: "text",
            x: labelX,
            y: labelY,
            content: "",
            attachedArrowId: arrowId
          };
          setItems((prev) => [...prev, newArrow, newLabel]);
          setSelectedId(newLabel.id);
          setTool("select");
        } else {
          const arrowId = Math.random().toString(36).substring(7);
          const newArrow = {
            id: arrowId,
            type: "dataflow-arrow",
            x: startX,
            y: startY,
            x2: endX,
            y2: endY,
            dataflowDirection: direction
          };
          const labelX = startX - 30;
          const labelY = Math.max(startY, endY) + 10;
          const newLabel = {
            id: Math.random().toString(36).substring(7),
            type: "text",
            x: labelX,
            y: labelY,
            content: "",
            attachedArrowId: arrowId
          };
          setItems((prev) => [...prev, newArrow, newLabel]);
          setSelectedId(newLabel.id);
          setTool("select");
        }
      } else {
        addItem(tool, startX, startY, void 0, void 0, endX, endY, connectedTo1, connectedTo2, anchor1Side, anchor2Side);
      }
    } else {
      const width = Math.abs(currentX - dragStart.x);
      const height = Math.abs(currentY - dragStart.y);
      const x = Math.min(dragStart.x, currentX);
      const y = Math.min(dragStart.y, currentY);
      if (width > 10 || height > 10) {
        addItem(tool, x, y, Math.max(40, width), Math.max(30, height));
      } else {
        addItem(tool, dragStart.x, dragStart.y);
      }
    }
    setIsDraggingNewShape(false);
    setDragStart(null);
    setTempShape(null);
  };
  const handleContainerClick = (e) => {
    if (disabled) return;
    if (tool === "select") {
      if (e.target === containerRef.current || e.target.classList.contains("diagram-bg") || e.target.tagName === "CANVAS") {
        setSelectedId(null);
        setEditingItemId(null);
      }
      return;
    }
  };
  const updateItem = (id, updates) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
  };
  const deleteItem = (id) => {
    const item = items.find((i) => i.id === id);
    if (mode === "erd-annotation" && item?.isBaseItem && !allowBaseItemDeletion) {
      return;
    }
    const idsToDelete = /* @__PURE__ */ new Set([id]);
    if (item?.pairedLabelId) {
      idsToDelete.add(item.pairedLabelId);
    }
    if (item?.pairedFieldId) {
      idsToDelete.add(item.pairedFieldId);
    }
    if (item?.linkedTitleId) {
      idsToDelete.add(item.linkedTitleId);
    }
    setItems((prev) => prev.filter((item2) => !idsToDelete.has(item2.id)));
    setSelectedId(null);
  };
  const toggleMarking = (id) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === id) {
        const currentMarking = item.marking || "none";
        const nextMarking = currentMarking === "none" ? "primary" : currentMarking === "primary" ? "foreign" : "none";
        return { ...item, marking: nextMarking };
      }
      return item;
    }));
  };
  const addAttributeToEntity = (entityId) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === entityId && item.type === "erd-entity") {
        const newAttr = {
          id: Math.random().toString(36).substring(7),
          name: "",
          marking: "none"
        };
        return { ...item, attributes: [...item.attributes || [], newAttr] };
      }
      return item;
    }));
  };
  const updateEntityAttribute = (entityId, attrId, updates) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === entityId && item.type === "erd-entity") {
        return {
          ...item,
          attributes: (item.attributes || []).map(
            (attr) => attr.id === attrId ? { ...attr, ...updates } : attr
          )
        };
      }
      return item;
    }));
  };
  const deleteEntityAttribute = (entityId, attrId) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === entityId && item.type === "erd-entity") {
        return {
          ...item,
          attributes: (item.attributes || []).filter((attr) => attr.id !== attrId)
        };
      }
      return item;
    }));
  };
  const toggleAttributeMarking = (entityId, attrId) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === entityId && item.type === "erd-entity") {
        return {
          ...item,
          attributes: (item.attributes || []).map((attr) => {
            if (attr.id === attrId) {
              const nextMarking = attr.marking === "none" ? "primary" : attr.marking === "primary" ? "foreign" : "none";
              return { ...attr, marking: nextMarking };
            }
            return attr;
          })
        };
      }
      return item;
    }));
  };
  const [clipboardItem, setClipboardItem] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const handleKeyDown = (e) => {
      const isInEditMode = editingItemId !== null;
      const activeEl = document.activeElement;
      const isTypingInInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") && containerRef.current?.contains(activeEl);
      if (e.key === "Escape" && isInEditMode) {
        setEditingItemId(null);
        containerRef.current?.focus();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !disabled) {
        if (isInEditMode || isTypingInInput) {
          return;
        }
        deleteItem(selectedId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedId && !disabled) {
        if (isInEditMode || isTypingInInput) {
          return;
        }
        e.preventDefault();
        const itemToCopy = items.find((i) => i.id === selectedId);
        if (itemToCopy) {
          setClipboardItem({ ...itemToCopy });
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && clipboardItem && !disabled) {
        if (isInEditMode || isTypingInInput) {
          return;
        }
        e.preventDefault();
        const newId = Math.random().toString(36).substring(7);
        const pastedItem = {
          ...clipboardItem,
          id: newId,
          x: clipboardItem.x + 20,
          y: clipboardItem.y + 20,
          isBaseItem: false
          // Pasted items are never base items
        };
        if (pastedItem.type === "erd-entity" && pastedItem.attributes) {
          pastedItem.attributes = pastedItem.attributes.map((attr) => ({
            ...attr,
            id: Math.random().toString(36).substring(7)
          }));
        }
        setItems((prev) => [...prev, pastedItem]);
        setSelectedId(newId);
        setClipboardItem({ ...clipboardItem, x: clipboardItem.x + 20, y: clipboardItem.y + 20 });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && selectedId && !disabled) {
        if (isInEditMode || isTypingInInput) {
          return;
        }
        e.preventDefault();
        const itemToDuplicate = items.find((i) => i.id === selectedId);
        if (itemToDuplicate) {
          const newId = Math.random().toString(36).substring(7);
          const duplicatedItem = {
            ...itemToDuplicate,
            id: newId,
            x: itemToDuplicate.x + 20,
            y: itemToDuplicate.y + 20,
            isBaseItem: false
          };
          if (duplicatedItem.type === "erd-entity" && duplicatedItem.attributes) {
            duplicatedItem.attributes = duplicatedItem.attributes.map((attr) => ({
              ...attr,
              id: Math.random().toString(36).substring(7)
            }));
          }
          setItems((prev) => [...prev, duplicatedItem]);
          setSelectedId(newId);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, disabled, items, clipboardItem, editingItemId]);
  const handleDoubleClick = (e, id) => {
    if (disabled) return;
    e.stopPropagation();
    setEditingItemId(id);
  };
  const handleMouseDown = (e, id) => {
    if (disabled || tool !== "select") return;
    e.stopPropagation();
    if (selectedId !== id) {
      setEditingItemId(null);
    }
    setSelectedId(id);
    containerRef.current?.focus();
    const startX = e.clientX;
    const startY = e.clientY;
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const initialX = item.x;
    const initialY = item.y;
    const pairedId = item.pairedLabelId || item.pairedFieldId;
    const pairedItem = pairedId ? items.find((i) => i.id === pairedId) : null;
    const pairedInitialX = pairedItem?.x || 0;
    const pairedInitialY = pairedItem?.y || 0;
    const linkedTitleId = item.linkedTitleId;
    const linkedTitle = linkedTitleId ? items.find((i) => i.id === linkedTitleId) : null;
    const linkedTitleInitialX = linkedTitle?.x || 0;
    const linkedTitleInitialY = linkedTitle?.y || 0;
    const linkedByParentId = items.find((i) => i.parentEntityId === id);
    const linkedByParentInitialX = linkedByParentId?.x || 0;
    const linkedByParentInitialY = linkedByParentId?.y || 0;
    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setItems((prev) => prev.map((i) => {
        if (i.id === id) {
          return { ...i, x: initialX + dx, y: initialY + dy };
        }
        if (pairedId && i.id === pairedId) {
          return { ...i, x: pairedInitialX + dx, y: pairedInitialY + dy };
        }
        if (linkedTitleId && i.id === linkedTitleId) {
          return { ...i, x: linkedTitleInitialX + dx, y: linkedTitleInitialY + dy };
        }
        if (linkedByParentId && i.id === linkedByParentId.id) {
          return { ...i, x: linkedByParentInitialX + dx, y: linkedByParentInitialY + dy };
        }
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
  const handleResizeMouseDown = (e, id, corner) => {
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
    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      let newWidth = initialWidth;
      let newHeight = initialHeight;
      let newX = initialX;
      let newY = initialY;
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
  const getCoordinates = (e, canvas) => {
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const rect = canvas.getBoundingClientRect();
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };
  const startDrawing = (e) => {
    if (disabled || tool !== "pencil" && tool !== "eraser") return;
    if (e.target.closest(".diagram-item")) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };
  const draw = (e) => {
    if (!isDrawing || disabled || tool !== "pencil" && tool !== "eraser") return;
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
    if (onChangeRef.current && canvasRef.current) {
      const data = JSON.stringify(items);
      lastSyncedDataRef.current = data;
      onChangeRef.current(data, canvasRef.current.toDataURL());
    }
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvasClearedRef.current = true;
        if (onChangeRef.current) {
          const data = JSON.stringify(items);
          lastSyncedDataRef.current = data;
          onChangeRef.current(data, canvas.toDataURL());
        }
      }
    }
  };
  const renderShape = (type, width, height) => {
    const strokeWidth = 2;
    const stroke = "#262626";
    const fill = "rgba(255, 255, 255, 0.9)";
    switch (type) {
      case "box":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: strokeWidth, y: strokeWidth, width: width - strokeWidth * 2, height: height - strokeWidth * 2, rx: "2", fill, stroke, strokeWidth });
      case "ellipse":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: strokeWidth, y: strokeWidth, width: width - strokeWidth * 2, height: height - strokeWidth * 2, rx: height / 2, fill, stroke, strokeWidth });
      case "circle":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: width / 2, cy: height / 2, r: Math.min(width, height) / 2 - strokeWidth, fill, stroke, strokeWidth });
      case "diamond":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: `${width / 2},${strokeWidth} ${width - strokeWidth},${height / 2} ${width / 2},${height - strokeWidth} ${strokeWidth},${height / 2}`, fill, stroke, strokeWidth });
      case "parallelogram":
        const skew = 20;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: `${skew + strokeWidth},${strokeWidth} ${width - strokeWidth},${strokeWidth} ${width - skew - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`, fill, stroke, strokeWidth });
      case "cylinder":
        const ry = height * 0.15;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: `M${strokeWidth},${ry + strokeWidth} v${height - 2 * ry - 2 * strokeWidth} a${width / 2 - strokeWidth},${ry} 0 0 0 ${width - 2 * strokeWidth},0 v-${height - 2 * ry - 2 * strokeWidth}`, fill, stroke, strokeWidth }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ellipse", { cx: width / 2, cy: ry + strokeWidth, rx: width / 2 - strokeWidth, ry, fill, stroke, strokeWidth })
        ] });
      case "document":
        const waveHeight = 10;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            d: `M${strokeWidth},${strokeWidth} h${width - 2 * strokeWidth} v${height - waveHeight - 2 * strokeWidth} 
                        q-${(width - 2 * strokeWidth) / 4},${waveHeight} -${(width - 2 * strokeWidth) / 2},0 
                        t-${(width - 2 * strokeWidth) / 2},0 z`,
            fill,
            stroke,
            strokeWidth
          }
        );
      case "hexagon":
        const pointWidth = 15;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: `${pointWidth},${strokeWidth} ${width - pointWidth},${strokeWidth} ${width - strokeWidth},${height / 2} ${width - pointWidth},${height - strokeWidth} ${pointWidth},${height - strokeWidth} ${strokeWidth},${height / 2}`, fill, stroke, strokeWidth });
      case "trapezoid":
        const indent = 20;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: `${strokeWidth},${strokeWidth} ${width - strokeWidth},${strokeWidth} ${width - indent},${height - strokeWidth} ${indent},${height - strokeWidth}`, fill, stroke, strokeWidth });
      case "struct-process":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: strokeWidth, y: strokeWidth, width: width - strokeWidth * 2, height: height - strokeWidth * 2, rx: "2", fill, stroke, strokeWidth });
      case "struct-decision":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: `${width / 2},${strokeWidth} ${width - strokeWidth},${height / 2} ${width / 2},${height - strokeWidth} ${strokeWidth},${height / 2}`, fill, stroke, strokeWidth });
      case "struct-loop":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("ellipse", { cx: width / 2, cy: height / 2, rx: width / 2 - strokeWidth, ry: height / 2 - strokeWidth, fill, stroke, strokeWidth });
      case "entity-oval":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("ellipse", { cx: width / 2, cy: height / 2, rx: width / 2 - strokeWidth, ry: height / 2 - strokeWidth, fill, stroke, strokeWidth });
      case "line":
        return null;
      // Lines are rendered separately
      default:
        return null;
    }
  };
  const getShapeClasses = (type) => {
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
  const getTextClasses = (type) => {
    return "";
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
    !disabled && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1 sm:gap-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-t-lg border border-neutral-200 dark:border-neutral-700 border-b-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: tool === "select" ? "secondary" : "ghost",
          size: "sm",
          onClick: () => setTool("select"),
          title: "Select / Move Items",
          className: cn("px-2 sm:px-3", tool === "select" && "bg-blue-500 text-white hover:bg-blue-600"),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MousePointer2, { className: "w-4 h-4 sm:mr-1" }),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Select" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: tool === "pencil" ? "secondary" : "ghost",
            size: "sm",
            onClick: () => setTool("pencil"),
            title: "Draw Lines (Not Marked)",
            className: cn("px-2 sm:px-3", tool === "pencil" && "bg-blue-500 text-white hover:bg-blue-600"),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "w-4 h-4 sm:mr-1" }),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Draw" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: tool === "eraser" ? "secondary" : "ghost",
            size: "sm",
            onClick: () => setTool("eraser"),
            title: "Erase Drawing",
            className: cn("px-2", tool === "eraser" && "bg-blue-500 text-white hover:bg-blue-600"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eraser, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: clearCanvas,
            className: "text-orange-500 hover:bg-orange-50 px-2",
            title: "Clear Freehand Drawing",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            disabled: !selectedId,
            onClick: () => selectedId && deleteItem(selectedId),
            className: "text-red-600 hover:bg-red-50 disabled:text-neutral-300 px-2 sm:px-3",
            title: "Delete Selected Shape (Del)",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 sm:mr-1" }),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Delete" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full sm:w-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 flex-wrap", children: [
        mode === "structure-dataflow" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "dataflow-up" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("dataflow-up"),
              title: "Data In Arrow (pointing up into function)",
              className: cn("px-2 sm:px-3", tool === "dataflow-up" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Data In" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "dataflow-down" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("dataflow-down"),
              title: "Data Out Arrow (pointing down out of function)",
              className: cn("px-2 sm:px-3", tool === "dataflow-down" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Data Out" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "text" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("text"),
              title: "Variable Name Label",
              className: cn("px-2 sm:px-3", tool === "text" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Label" })
              ]
            }
          )
        ] }) : mode === "nav-structure" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "box" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("box"),
              title: "Webpage Box",
              className: cn("px-2 sm:px-3", tool === "box" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Page" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "line" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("line"),
              title: "Link Line",
              className: cn("px-2 sm:px-3", tool === "line" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Link" })
              ]
            }
          )
        ] }) : mode === "nav-structure-higher" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "nav-page" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("nav-page"),
              title: "Webpage Box (blue)",
              className: cn("px-2 sm:px-3", tool === "nav-page" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-nav-page",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Page" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "line" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("line"),
              title: "Hierarchy Connector",
              className: cn("px-2 sm:px-3", tool === "line" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-nav-connector",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Connect" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "nav-highlight" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("nav-highlight"),
              title: "Navigation Bar Area (yellow)",
              className: cn("px-2 sm:px-3", tool === "nav-highlight" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-nav-highlight",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutTemplate, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Nav Area" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "text" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("text"),
              title: "Text Label",
              className: cn("px-2 sm:px-3", tool === "text" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-nav-text",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Label" })
              ]
            }
          )
        ] }) : mode === "structure-diagram" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "struct-process" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("struct-process"),
              title: "Process (Rectangle)",
              className: cn("px-2 sm:px-3", tool === "struct-process" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-struct-process",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Process" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "struct-decision" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("struct-decision"),
              title: "Decision (Diamond)",
              className: cn("px-2 sm:px-3", tool === "struct-decision" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-struct-decision",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Diamond, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Decision" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "struct-loop" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("struct-loop"),
              title: "Loop (Ellipse)",
              className: cn("px-2 sm:px-3", tool === "struct-loop" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-struct-loop",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Loop" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "line" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("line"),
              title: "Connector Line",
              className: cn("px-2 sm:px-3", tool === "line" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-struct-connector",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Connect" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "text" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("text"),
              title: "Text Label",
              className: cn("px-2 sm:px-3", tool === "text" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-struct-text",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Label" })
              ]
            }
          )
        ] }) : mode === "entity-occurrence" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "entity-oval" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("entity-oval"),
              title: "Entity (Tall Oval with occurrences)",
              className: cn("px-2 sm:px-3", tool === "entity-oval" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-entity-oval",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Entity" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "line" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("line"),
              title: "Relationship Line (connect occurrences)",
              className: cn("px-2 sm:px-3", tool === "line" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-entity-connector",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Connect" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-500 ml-2 hidden sm:inline", children: "Click entity to edit occurrences" })
        ] }) : mode === "erd-annotation" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "box" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("box"),
              title: "Rectangle",
              className: cn("px-2 sm:px-3", tool === "box" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Rectangle" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "ellipse" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ellipse"),
              title: "Ellipse",
              className: cn("px-2 sm:px-3", tool === "ellipse" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Ellipse" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "diamond" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("diamond"),
              title: "Diamond",
              className: cn("px-2 sm:px-3", tool === "diamond" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Diamond, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Diamond" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "crowfoot" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("crowfoot"),
              title: "Forked Line (One-to-Many)",
              className: cn("px-2 sm:px-3", tool === "crowfoot" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Forked Line" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "line" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("line"),
              title: "Plain Line",
              className: cn("px-2 sm:px-3", tool === "line" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "w-4 h-4 sm:mr-1" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Line" })
              ]
            }
          )
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: tool === "box" ? "secondary" : "ghost",
            size: "sm",
            onClick: () => setTool("box"),
            title: "Rectangle",
            className: cn("px-2 sm:px-3", tool === "box" && "bg-blue-500 text-white hover:bg-blue-600"),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "w-4 h-4 sm:mr-1" }),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Box" })
            ]
          }
        ) }),
        (mode === "flowchart" || mode === "general") && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "ellipse" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ellipse"),
              title: "Start/End",
              className: cn(tool === "ellipse" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "w-4 h-4 mr-1" }),
                " Start/End"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "diamond" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("diamond"),
              title: "Decision",
              className: cn(tool === "diamond" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Diamond, { className: "w-4 h-4 mr-1" }),
                " Decision"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "parallelogram" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("parallelogram"),
              title: "Input/Output",
              className: cn(tool === "parallelogram" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Spline, { className: "w-4 h-4 mr-1" }),
                " I/O"
              ]
            }
          )
        ] }),
        (mode === "database" || mode === "general") && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "cylinder" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("cylinder"),
              title: "Entity/Table",
              className: cn(tool === "cylinder" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "w-4 h-4 mr-1" }),
                " Entity"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "ellipse" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ellipse"),
              title: "Attribute (Oval)",
              className: cn(tool === "ellipse" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "w-4 h-4 mr-1" }),
                " Attribute"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "diamond" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("diamond"),
              title: "Relationship (Diamond)",
              className: cn(tool === "diamond" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Diamond, { className: "w-4 h-4 mr-1" }),
                " Relationship"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "crowfoot" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("crowfoot"),
              title: "Crow's Foot Connector (One-to-Many)",
              className: cn(tool === "crowfoot" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { className: "w-4 h-4 mr-1" }),
                " 1:M Line"
              ]
            }
          )
        ] }),
        mode !== "erd-annotation" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "line" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("line"),
              title: "Line / Connector",
              className: cn(tool === "line" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "w-4 h-4 mr-1" }),
                " Line"
              ]
            }
          )
        ] }),
        (mode === "wireframe" || mode === "general") && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-500 dark:text-neutral-400 mr-1", children: "UI:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "ui-window" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ui-window"),
              title: "Window",
              className: cn(tool === "ui-window" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Window"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "ui-button" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ui-button"),
              title: "Button",
              className: cn(tool === "ui-button" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Button"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "ui-input" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ui-input"),
              title: "Input",
              className: cn(tool === "ui-input" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Input"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "ui-dropdown" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ui-dropdown"),
              title: "Dropdown",
              className: cn(tool === "ui-dropdown" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Dropdown"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "ui-output" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ui-output"),
              title: "Output Field",
              className: cn(tool === "ui-output" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Output"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "ui-image" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ui-image"),
              title: "Image Placeholder",
              className: cn(tool === "ui-image" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Image"
            }
          )
        ] }),
        mode === "webpage-wireframe" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-500 dark:text-neutral-400 mr-1", children: "Page:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "ui-image" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ui-image"),
              title: "Image Placeholder",
              className: cn(tool === "ui-image" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Image"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "wf-heading" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("wf-heading"),
              title: "Heading",
              className: cn(tool === "wf-heading" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Heading"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "wf-paragraph" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("wf-paragraph"),
              title: "Paragraph",
              className: cn(tool === "wf-paragraph" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Paragraph"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "link-text" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("link-text"),
              title: "Link (underlined text)",
              className: cn(tool === "link-text" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Link"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "bullet-text" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("bullet-text"),
              title: "Bullet List",
              className: cn(tool === "bullet-text" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Bullets"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "numbered-text" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("numbered-text"),
              title: "Numbered List",
              className: cn(tool === "numbered-text" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Numbers"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "wf-audio" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("wf-audio"),
              title: "Audio Player",
              className: cn(tool === "wf-audio" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Audio"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "wf-video" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("wf-video"),
              title: "Video Player",
              className: cn(tool === "wf-video" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Video"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-500 dark:text-neutral-400 mr-1", children: "Layout:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "wf-div" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("wf-div"),
              title: "Rectangle / Div container",
              className: cn(tool === "wf-div" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-wf-div",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "w-3.5 h-3.5 mr-1" }),
                " Div"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "wf-annotation" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("wf-annotation"),
              title: "Annotation text (small grey note)",
              className: cn(tool === "wf-annotation" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-wf-annotation",
              children: "Note"
            }
          )
        ] }),
        mode === "form-wireframe" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-500 dark:text-neutral-400 mr-1", children: "Form:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "ui-label" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ui-label"),
              title: "Label",
              className: cn(tool === "ui-label" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Label"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "ui-input" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ui-input"),
              title: "Text Input",
              className: cn(tool === "ui-input" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Input"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "ui-textarea" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ui-textarea"),
              title: "Text Area",
              className: cn(tool === "ui-textarea" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Textarea"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "ui-dropdown" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ui-dropdown"),
              title: "Dropdown",
              className: cn(tool === "ui-dropdown" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Dropdown"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "ui-radio" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ui-radio"),
              title: "Radio Button",
              className: cn(tool === "ui-radio" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Radio"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "ui-checkbox" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ui-checkbox"),
              title: "Checkbox",
              className: cn(tool === "ui-checkbox" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Checkbox"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "ui-submit" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("ui-submit"),
              title: "Submit Button",
              className: cn(tool === "ui-submit" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: "Submit"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "wf-div" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("wf-div"),
              title: "Rectangle / Div container",
              className: cn(tool === "wf-div" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-form-wf-div",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "w-3.5 h-3.5 mr-1" }),
                " Div"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: tool === "wf-annotation" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("wf-annotation"),
              title: "Annotation text (small grey note)",
              className: cn(tool === "wf-annotation" && "bg-blue-500 text-white hover:bg-blue-600"),
              "data-testid": "tool-form-wf-annotation",
              children: "Note"
            }
          )
        ] }),
        mode !== "erd-annotation" && mode !== "nav-structure" && mode !== "nav-structure-higher" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "text" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("text"),
              title: "Add Text",
              className: cn(tool === "text" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "w-4 h-4 mr-1" }),
                " Text"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "bullet-text" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("bullet-text"),
              title: "Add Bullet Point List",
              className: cn(tool === "bullet-text" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "w-4 h-4 mr-1" }),
                " Bullet"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "numbered-text" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("numbered-text"),
              title: "Add Numbered List",
              className: cn(tool === "numbered-text" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mr-1 text-xs font-mono", children: "1." }),
                " Numbered"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: tool === "link-text" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setTool("link-text"),
              title: "Add Underlined Text",
              className: cn(tool === "link-text" && "bg-blue-500 text-white hover:bg-blue-600"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "underline mr-1", children: "U" }),
                " Underline"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" })
    ] }),
    mode === "erd-annotation" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 text-sm rounded-md flex items-start gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 font-bold", children: "Instructions:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "Click an item, then click ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Mark" }),
        " to toggle: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "underline decoration-2", children: "underline" }),
        " = Primary Key, ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-600 font-bold", children: "*" }),
        " = Foreign Key. Use the shape tools to annotate the diagram."
      ] })
    ] }) : mode === "webpage-wireframe" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 text-sm rounded-md flex items-start gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 font-bold", children: "Tip:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Design a webpage layout using the tools above. Add headings, paragraphs, images, links, lists, audio and video elements." })
    ] }) : mode === "form-wireframe" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 text-sm rounded-md flex items-start gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 font-bold", children: "Tip:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "Use ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "*" }),
        " in labels for required fields. Type validation rules ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "inside text inputs" }),
        ' (e.g. "1-14" or "must be positive").'
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 text-sm rounded-md flex items-start gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 font-bold", children: "Tip:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "Click and drag to draw shapes. Use ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Line" }),
        " for connectors. Text in shapes is read by the auto-marker."
      ] })
    ] }),
    mode === "entity-occurrence" && selectedId && (() => {
      const selectedItem = items.find((i) => i.id === selectedId);
      if (!selectedItem || selectedItem.type !== "entity-oval") return null;
      const occurrences = selectedItem.occurrences || [];
      const addOccurrence = () => {
        const newOccId = Math.random().toString(36).substring(7);
        updateItem(selectedId, {
          occurrences: [...occurrences, { id: newOccId, text: "new occurrence", dotPosition: "left" }]
        });
      };
      const updateOccurrence = (idx, updates) => {
        const newOccs = [...occurrences];
        newOccs[idx] = { ...newOccs[idx], ...updates };
        updateItem(selectedId, { occurrences: newOccs });
      };
      const removeOccurrence = (idx) => {
        const newOccs = occurrences.filter((_, i) => i !== idx);
        updateItem(selectedId, { occurrences: newOccs });
      };
      const linkedTitle = items.find((i) => i.parentEntityId === selectedId);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-purple-800 dark:text-purple-200", children: "Entity Occurrences" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: addOccurrence, className: "h-7 text-xs", children: "+ Add Occurrence" })
        ] }),
        linkedTitle && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-purple-600 dark:text-purple-400 w-16", children: "Title:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: linkedTitle.content || "",
              onChange: (e) => updateItem(linkedTitle.id, { content: e.target.value }),
              onKeyDown: (e) => e.stopPropagation(),
              className: "flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-neutral-800",
              placeholder: "Entity name"
            }
          )
        ] }),
        occurrences.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: occurrences.map((occ, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-purple-600 dark:text-purple-400 w-4", children: [
            idx + 1,
            "."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: occ.text,
              onChange: (e) => updateOccurrence(idx, { text: e.target.value }),
              onKeyDown: (e) => e.stopPropagation(),
              className: "flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-neutral-800",
              placeholder: "Occurrence text"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: occ.dotPosition,
              onChange: (e) => updateOccurrence(idx, { dotPosition: e.target.value }),
              className: "px-2 py-1 text-xs border rounded bg-white dark:bg-neutral-800",
              title: "Dot position",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "left", children: "Left dot" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "right", children: "Right dot" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "both", children: "Both dots" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => removeOccurrence(idx),
              className: "text-red-500 hover:text-red-700 text-xs px-1",
              title: "Remove occurrence",
              children: "×"
            }
          )
        ] }, idx)) }),
        occurrences.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-purple-500", children: 'No occurrences. Click "Add Occurrence" to add one.' })
      ] });
    })(),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        ref: containerRef,
        tabIndex: 0,
        onClick: handleContainerClick,
        onMouseDown: handleShapeMouseDown,
        onMouseMove: handleShapeMouseMove,
        onMouseUp: handleShapeMouseUp,
        onMouseLeave: () => {
          setIsDraggingNewShape(false);
          setTempShape(null);
        },
        style: { height: containerHeight, ...isWireframeMode ? { width: containerWidth || 450, margin: "0 auto" } : {}, ...backgroundUrl && !isWireframeMode && containerWidth ? { width: containerWidth, margin: "0 auto" } : {} },
        className: cn(
          `relative bg-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden select-none diagram-bg focus:outline-none focus:ring-2 focus:ring-red-500`,
          !isWireframeMode && !containerWidth && "w-full",
          disabled && "opacity-80 pointer-events-none",
          tool !== "select" && tool !== "pencil" && tool !== "eraser" && "cursor-crosshair"
        ),
        children: [
          backgroundUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: backgroundUrl,
              className: "absolute inset-0 w-full h-full object-fill pointer-events-none z-0 mix-blend-multiply dark:mix-blend-normal",
              alt: "Background"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "canvas",
            {
              ref: canvasRef,
              className: "absolute inset-0 z-0 pointer-events-auto",
              onMouseDown: startDrawing,
              onMouseMove: draw,
              onMouseUp: stopDrawing,
              onMouseLeave: stopDrawing,
              onTouchStart: startDrawing,
              onTouchMove: draw,
              onTouchEnd: stopDrawing
            }
          ),
          tempShape && (tempShape.type === "line" || tempShape.type === "crowfoot" || tempShape.type === "dataflow-arrow") ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "absolute inset-0 w-full h-full pointer-events-none z-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: tempShape.x,
              y1: tempShape.y,
              x2: tempShape.x2 || tempShape.x,
              y2: tempShape.y2 || tempShape.y,
              stroke: "#262626",
              strokeWidth: "2",
              strokeDasharray: "4"
            }
          ) }) : tempShape && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: {
                left: tempShape.x,
                top: tempShape.y,
                width: tempShape.width || 20,
                height: tempShape.height || 20
              },
              className: "absolute border-2 border-dashed border-red-400 bg-red-50/50 pointer-events-none z-20"
            }
          ),
          items.filter((item) => item.type === "line" || item.type === "crowfoot" || item.type === "dataflow-arrow").map((item) => {
            let x1 = item.x;
            let y1 = item.y;
            let x2 = item.x2 || item.x + 100;
            let y2 = item.y2 || item.y;
            const parseOccurrenceConnection = (connStr) => {
              if (!connStr) return null;
              const match = connStr.match(/^(.+)-occ-(.+)$/);
              if (match) return { entityId: match[1], occurrenceId: match[2] };
              return null;
            };
            const getOccurrenceAnchorPosition = (entityId, occurrenceId, side) => {
              const entity = items.find((i) => i.id === entityId);
              if (!entity || entity.type !== "entity-oval" || !entity.occurrences) return null;
              const occIdx = entity.occurrences.findIndex((o) => o.id === occurrenceId);
              if (occIdx === -1) return null;
              const occurrenceHeight = 24;
              const startY = 30;
              const w = entity.width || 140;
              const h = entity.height || 200;
              const rx = w / 2;
              const ry = h / 2;
              const dotMargin = 8;
              const occCenterY = startY + occIdx * occurrenceHeight + occurrenceHeight / 2;
              const dy = occCenterY - ry;
              const xFromCenter = rx * Math.sqrt(Math.max(0, 1 - dy * dy / (ry * ry)));
              const dotInset = rx - xFromCenter + dotMargin;
              const occY = entity.y + occCenterY;
              if (side === "left") return { x: entity.x + dotInset, y: occY };
              if (side === "right") return { x: entity.x + w - dotInset, y: occY };
              return null;
            };
            if (item.type === "crowfoot" || mode === "nav-structure" || mode === "nav-structure-higher" || mode === "structure-diagram" || mode === "entity-occurrence") {
              const occConn1 = parseOccurrenceConnection(item.connectedTo1);
              const occConn2 = parseOccurrenceConnection(item.connectedTo2);
              const shape1 = occConn1 ? items.find((i) => i.id === occConn1.entityId) : item.connectedTo1 ? items.find((i) => i.id === item.connectedTo1) : null;
              const shape2 = occConn2 ? items.find((i) => i.id === occConn2.entityId) : item.connectedTo2 ? items.find((i) => i.id === item.connectedTo2) : null;
              if (mode === "nav-structure-higher" || mode === "structure-diagram" || mode === "entity-occurrence") {
                if (occConn1 && item.anchor1Side && (item.anchor1Side === "left" || item.anchor1Side === "right")) {
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
                if (occConn2 && item.anchor2Side && (item.anchor2Side === "left" || item.anchor2Side === "right")) {
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
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const strokeColor = selectedId === item.id ? "#ef4444" : "#262626";
            const strokeW = selectedId === item.id ? 3 : 2;
            const arrowSize = 10;
            const renderArrowHead = (atX, atY, fromX, fromY) => {
              const arrowAngle = Math.atan2(fromY - atY, fromX - atX);
              const arrowAngle1 = arrowAngle + Math.PI / 6;
              const arrowAngle2 = arrowAngle - Math.PI / 6;
              const x1Arrow = atX + arrowSize * Math.cos(arrowAngle1);
              const y1Arrow = atY + arrowSize * Math.sin(arrowAngle1);
              const x2Arrow = atX + arrowSize * Math.cos(arrowAngle2);
              const y2Arrow = atY + arrowSize * Math.sin(arrowAngle2);
              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                "polygon",
                {
                  points: `${atX},${atY} ${x1Arrow},${y1Arrow} ${x2Arrow},${y2Arrow}`,
                  fill: strokeColor
                }
              );
            };
            const useElbowConnector = (mode === "nav-structure-higher" || mode === "structure-diagram") && item.type === "line";
            const storedAnchor1Side = item.anchor1Side;
            const storedAnchor2Side = item.anchor2Side;
            const getElbowPath = () => {
              const offset = 15;
              if (storedAnchor1Side === "bottom" && storedAnchor2Side === "top") {
                const midY = (y1 + y2) / 2;
                return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
              }
              if (storedAnchor1Side === "top" && storedAnchor2Side === "bottom") {
                const midY = (y1 + y2) / 2;
                return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
              }
              if (storedAnchor1Side === "right" && storedAnchor2Side === "left") {
                const midX = (x1 + x2) / 2;
                return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
              }
              if (storedAnchor1Side === "left" && storedAnchor2Side === "right") {
                const midX = (x1 + x2) / 2;
                return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
              }
              if (storedAnchor1Side === "bottom" && (storedAnchor2Side === "left" || storedAnchor2Side === "right")) {
                return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;
              }
              if (storedAnchor1Side === "top" && (storedAnchor2Side === "left" || storedAnchor2Side === "right")) {
                return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;
              }
              if ((storedAnchor1Side === "left" || storedAnchor1Side === "right") && (storedAnchor2Side === "top" || storedAnchor2Side === "bottom")) {
                return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`;
              }
              if (storedAnchor1Side === "bottom" && storedAnchor2Side === "bottom") {
                const lowestY = Math.max(y1, y2) + offset * 2;
                return `M ${x1} ${y1} L ${x1} ${lowestY} L ${x2} ${lowestY} L ${x2} ${y2}`;
              }
              if (storedAnchor1Side === "top" && storedAnchor2Side === "top") {
                const highestY = Math.min(y1, y2) - offset * 2;
                return `M ${x1} ${y1} L ${x1} ${highestY} L ${x2} ${highestY} L ${x2} ${y2}`;
              }
              if (storedAnchor1Side === "left" && storedAnchor2Side === "left") {
                const leftmostX = Math.min(x1, x2) - offset * 2;
                return `M ${x1} ${y1} L ${leftmostX} ${y1} L ${leftmostX} ${y2} L ${x2} ${y2}`;
              }
              if (storedAnchor1Side === "right" && storedAnchor2Side === "right") {
                const rightmostX = Math.max(x1, x2) + offset * 2;
                return `M ${x1} ${y1} L ${rightmostX} ${y1} L ${rightmostX} ${y2} L ${x2} ${y2}`;
              }
              return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;
            };
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: cn("absolute inset-0 w-full h-full pointer-events-none", selectedId === item.id ? "z-[100]" : mode === "entity-occurrence" ? "z-[50]" : "z-[5]"), style: { overflow: "visible" }, children: [
              useElbowConnector ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  d: getElbowPath(),
                  stroke: strokeColor,
                  strokeWidth: strokeW,
                  fill: "none",
                  className: "pointer-events-auto cursor-move",
                  onMouseDown: (e) => {
                    e.stopPropagation();
                    handleMouseDown(e, item.id);
                  }
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                "line",
                {
                  x1,
                  y1,
                  x2,
                  y2,
                  stroke: strokeColor,
                  strokeWidth: strokeW,
                  className: "pointer-events-auto cursor-move",
                  onMouseDown: (e) => {
                    e.stopPropagation();
                    handleMouseDown(e, item.id);
                  }
                }
              ),
              item.arrowStart && renderArrowHead(x1, y1, x2, y2),
              item.arrowEnd && renderArrowHead(x2, y2, x1, y1),
              item.type === "dataflow-arrow" && (item.dataflowDirection === "up" ? renderArrowHead(x2, y2, x1, y1) : renderArrowHead(x2, y2, x1, y1)),
              mode === "nav-structure" && selectedId === item.id && !disabled && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "foreignObject",
                {
                  x: (x1 + x2) / 2 - 70,
                  y: (y1 + y2) / 2 - 40,
                  width: "140",
                  height: "36",
                  className: "pointer-events-auto overflow-visible",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md p-1 shadow-lg", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          updateItem(item.id, { arrowStart: !item.arrowStart });
                        },
                        className: cn(
                          "px-2 py-1 text-xs rounded",
                          item.arrowStart ? "bg-blue-500 text-white" : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                        ),
                        title: "Arrow at start",
                        children: "← Start"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          updateItem(item.id, { arrowEnd: !item.arrowEnd });
                        },
                        className: cn(
                          "px-2 py-1 text-xs rounded",
                          item.arrowEnd ? "bg-blue-500 text-white" : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                        ),
                        title: "Arrow at end",
                        children: "End →"
                      }
                    )
                  ] })
                }
              ),
              (mode === "erd-annotation" || mode === "database") && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: selectedId === item.id && !disabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "foreignObject",
                {
                  x: (x1 + x2) / 2 - 50,
                  y: (y1 + y2) / 2 - 30,
                  width: "100",
                  height: "28",
                  className: "pointer-events-auto overflow-visible",
                  style: { overflow: "visible" },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "text",
                      value: item.relationshipLabel || "",
                      onChange: (e) => updateItem(item.id, { relationshipLabel: e.target.value }),
                      placeholder: "Enter label...",
                      className: "w-full h-full text-sm text-center bg-white text-black border-2 border-blue-400 rounded px-2 py-1 outline-none shadow-lg",
                      onClick: (e) => e.stopPropagation(),
                      autoFocus: true
                    }
                  )
                }
              ) : item.relationshipLabel ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "text",
                {
                  x: (x1 + x2) / 2,
                  y: (y1 + y2) / 2 - 10,
                  textAnchor: "middle",
                  dominantBaseline: "middle",
                  className: "text-xs fill-neutral-800 pointer-events-none",
                  style: { fontSize: "11px" },
                  children: item.relationshipLabel
                }
              ) : null }),
              item.type === "crowfoot" && (() => {
                const strokeColor2 = selectedId === item.id ? "#ef4444" : "#262626";
                const strokeW2 = selectedId === item.id ? 3 : 2;
                const footLength = 12;
                const prongSpread = 8;
                const perpX = Math.cos(angle + Math.PI / 2);
                const perpY = Math.sin(angle + Math.PI / 2);
                const convergeX = x2 - Math.cos(angle) * footLength;
                const convergeY = y2 - Math.sin(angle) * footLength;
                const topEdgeX = x2 + perpX * prongSpread;
                const topEdgeY = y2 + perpY * prongSpread;
                const bottomEdgeX = x2 - perpX * prongSpread;
                const bottomEdgeY = y2 - perpY * prongSpread;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: convergeX, y1: convergeY, x2: topEdgeX, y2: topEdgeY, stroke: strokeColor2, strokeWidth: strokeW2 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: convergeX, y1: convergeY, x2: bottomEdgeX, y2: bottomEdgeY, stroke: strokeColor2, strokeWidth: strokeW2 })
                ] });
              })(),
              selectedId === item.id && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "circle",
                  {
                    cx: item.x,
                    cy: item.y,
                    r: "6",
                    fill: "#ef4444",
                    className: "pointer-events-auto cursor-move",
                    onMouseDown: (e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const initialX1 = item.x;
                      const initialY1 = item.y;
                      const handleMove = (moveE) => {
                        if (!containerRef.current) return;
                        const newX = initialX1 + (moveE.clientX - startX);
                        const newY = initialY1 + (moveE.clientY - startY);
                        const snapShape = findNearestShape(newX, newY);
                        const structTypes = ["struct-process", "struct-decision", "struct-loop"];
                        if (snapShape) {
                          if (mode === "nav-structure-higher" && snapShape.type === "nav-page") {
                            const otherX = item.x2 || item.x + 100;
                            const otherY = item.y2 || item.y;
                            const anchor = getNavAnchorPoint(snapShape, otherX, otherY);
                            updateItem(item.id, { x: anchor.x, y: anchor.y, connectedTo1: snapShape.id });
                          } else if (mode === "structure-diagram" && structTypes.includes(snapShape.type)) {
                            const otherX = item.x2 || item.x + 100;
                            const otherY = item.y2 || item.y;
                            const anchor = getNavAnchorPoint(snapShape, otherX, otherY);
                            updateItem(item.id, { x: anchor.x, y: anchor.y, connectedTo1: snapShape.id });
                          } else {
                            const center = getShapeCenter(snapShape);
                            updateItem(item.id, { x: center.x, y: center.y, connectedTo1: snapShape.id });
                          }
                        } else {
                          updateItem(item.id, { x: newX, y: newY, connectedTo1: void 0 });
                        }
                      };
                      const handleUp = () => {
                        window.removeEventListener("mousemove", handleMove);
                        window.removeEventListener("mouseup", handleUp);
                      };
                      window.addEventListener("mousemove", handleMove);
                      window.addEventListener("mouseup", handleUp);
                    }
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "circle",
                  {
                    cx: item.x2 || item.x + 100,
                    cy: item.y2 || item.y,
                    r: "6",
                    fill: "#ef4444",
                    className: "pointer-events-auto cursor-move",
                    onMouseDown: (e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const initialX2 = item.x2 || item.x + 100;
                      const initialY2 = item.y2 || item.y;
                      const handleMove = (moveE) => {
                        if (!containerRef.current) return;
                        const newX = initialX2 + (moveE.clientX - startX);
                        const newY = initialY2 + (moveE.clientY - startY);
                        const snapShape = findNearestShape(newX, newY);
                        const structTypes2 = ["struct-process", "struct-decision", "struct-loop"];
                        if (snapShape) {
                          if (mode === "nav-structure-higher" && snapShape.type === "nav-page") {
                            const anchor = getNavAnchorPoint(snapShape, item.x, item.y);
                            updateItem(item.id, { x2: anchor.x, y2: anchor.y, connectedTo2: snapShape.id });
                          } else if (mode === "structure-diagram" && structTypes2.includes(snapShape.type)) {
                            const anchor = getNavAnchorPoint(snapShape, item.x, item.y);
                            updateItem(item.id, { x2: anchor.x, y2: anchor.y, connectedTo2: snapShape.id });
                          } else {
                            const center = getShapeCenter(snapShape);
                            updateItem(item.id, { x2: center.x, y2: center.y, connectedTo2: snapShape.id });
                          }
                        } else {
                          updateItem(item.id, { x2: newX, y2: newY, connectedTo2: void 0 });
                        }
                      };
                      const handleUp = () => {
                        window.removeEventListener("mousemove", handleMove);
                        window.removeEventListener("mouseup", handleUp);
                      };
                      window.addEventListener("mousemove", handleMove);
                      window.addEventListener("mouseup", handleUp);
                    }
                  }
                )
              ] })
            ] }, item.id);
          }),
          items.filter((item) => item.type !== "line" && item.type !== "crowfoot").sort((a, b) => {
            if (a.type === "nav-highlight" && b.type !== "nav-highlight") return -1;
            if (b.type === "nav-highlight" && a.type !== "nav-highlight") return 1;
            return 0;
          }).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-diagram-item": item.id,
              onMouseDown: (e) => handleMouseDown(e, item.id),
              style: {
                left: item.x,
                top: item.y,
                width: item.type !== "text" ? item.width || (item.type === "circle" ? 40 : 120) : "auto",
                height: item.type !== "text" ? item.height || (item.type === "circle" ? 40 : 60) : "auto"
              },
              className: cn(
                "absolute flex items-center justify-center group cursor-move diagram-item z-10",
                getShapeClasses(item.type),
                selectedId === item.id && "ring-2 ring-red-500 ring-offset-2",
                mode === "entity-occurrence" && tool === "line" && "pointer-events-none"
              ),
              children: [
                !item.type.startsWith("ui-") && item.type !== "text" && item.type !== "bullet-text" && item.type !== "numbered-text" && item.type !== "link-text" && item.type !== "wf-heading" && item.type !== "wf-annotation" && item.type !== "wf-paragraph" && item.type !== "wf-audio" && item.type !== "wf-video" && item.type !== "wf-div" && item.type !== "line" && item.type !== "crowfoot" && /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "absolute inset-0 w-full h-full overflow-visible pointer-events-none z-0", children: renderShape(item.type, item.width || (item.type === "circle" ? 40 : 120), item.height || (item.type === "circle" ? 40 : 60)) }),
                mode === "nav-structure-higher" && item.type === "nav-page" && tool === "line" && (() => {
                  const w = item.width || 120;
                  const h = item.height || 50;
                  const dotRadius = 4;
                  const dotFill = "#1e40af";
                  const dotStroke = "#ffffff";
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "absolute overflow-visible pointer-events-none z-20", style: { left: 0, top: 0, width: w, height: h }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: w / 2, cy: 0, r: dotRadius, fill: dotFill, stroke: dotStroke, strokeWidth: "2" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: w / 2, cy: h, r: dotRadius, fill: dotFill, stroke: dotStroke, strokeWidth: "2" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: 0, cy: h / 2, r: dotRadius, fill: dotFill, stroke: dotStroke, strokeWidth: "2" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: w, cy: h / 2, r: dotRadius, fill: dotFill, stroke: dotStroke, strokeWidth: "2" })
                  ] });
                })(),
                mode === "structure-diagram" && (item.type === "struct-process" || item.type === "struct-decision" || item.type === "struct-loop") && tool === "line" && (() => {
                  const w = item.width || 120;
                  const h = item.height || 60;
                  const dotRadius = 4;
                  const dotFill = "#059669";
                  const dotStroke = "#ffffff";
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "absolute overflow-visible pointer-events-none z-20", style: { left: 0, top: 0, width: w, height: h }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: w / 2, cy: 0, r: dotRadius, fill: dotFill, stroke: dotStroke, strokeWidth: "2" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: w / 2, cy: h, r: dotRadius, fill: dotFill, stroke: dotStroke, strokeWidth: "2" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: 0, cy: h / 2, r: dotRadius, fill: dotFill, stroke: dotStroke, strokeWidth: "2" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: w, cy: h / 2, r: dotRadius, fill: dotFill, stroke: dotStroke, strokeWidth: "2" })
                  ] });
                })(),
                mode === "entity-occurrence" && item.type === "entity-occurrence" && tool === "line" && (() => {
                  const w = item.width || 80;
                  const h = item.height || 20;
                  const dotRadius = 4;
                  const dotFill = "#7c3aed";
                  const dotStroke = "#ffffff";
                  const dotPos = item.dotPosition || "left";
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "absolute overflow-visible pointer-events-none z-20", style: { left: 0, top: 0, width: w, height: h }, children: [
                    (dotPos === "left" || dotPos === "both") && /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: 0, cy: h / 2, r: dotRadius, fill: dotFill, stroke: dotStroke, strokeWidth: "2" }),
                    (dotPos === "right" || dotPos === "both") && /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: w, cy: h / 2, r: dotRadius, fill: dotFill, stroke: dotStroke, strokeWidth: "2" })
                  ] });
                })(),
                item.type === "entity-oval" && (() => {
                  const w = item.width || 140;
                  const h = item.height || 200;
                  const occurrences = item.occurrences || [];
                  const occurrenceHeight = 24;
                  const startY = 30;
                  const rx = w / 2;
                  const ry = h / 2;
                  const dotMargin = 8;
                  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex flex-col items-center pointer-events-none overflow-visible", style: { paddingTop: startY }, children: occurrences.map((occ, idx) => {
                    const occCenterY = startY + idx * occurrenceHeight + occurrenceHeight / 2;
                    const dy = occCenterY - ry;
                    const xFromCenter = rx * Math.sqrt(Math.max(0, 1 - dy * dy / (ry * ry)));
                    const dotInset = rx - xFromCenter + dotMargin;
                    const textPadding = dotInset + 16;
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "relative flex items-center justify-center w-full pointer-events-none",
                        style: { height: occurrenceHeight, paddingLeft: textPadding, paddingRight: textPadding },
                        children: [
                          (occ.dotPosition === "left" || occ.dotPosition === "both") && /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              className: "absolute w-2 h-2 rounded-full bg-black",
                              style: { left: dotInset, top: "50%", transform: "translateY(-50%)" }
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-center truncate w-full text-black font-medium", children: occ.text }),
                          (occ.dotPosition === "right" || occ.dotPosition === "both") && /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              className: "absolute w-2 h-2 rounded-full bg-black",
                              style: { right: dotInset, top: "50%", transform: "translateY(-50%)" }
                            }
                          )
                        ]
                      },
                      idx
                    );
                  }) });
                })(),
                showFunctionNumbers && item.type === "box" && functionNumberMap[item.id] && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "absolute -top-3 -left-3 w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center z-30 shadow-md",
                    title: `Function #${functionNumberMap[item.id]}`,
                    children: functionNumberMap[item.id]
                  }
                ),
                mode === "erd-annotation" && selectedId === item.id && (item.type === "text" || item.type === "bullet-text" || item.type === "numbered-text" || item.type === "link-text" || item.type === "ellipse") && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      toggleMarking(item.id);
                    },
                    className: "absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded whitespace-nowrap z-40 shadow-lg",
                    title: "Click to toggle marking",
                    children: "Mark"
                  }
                ),
                item.type === "wf-heading" || item.type === "wf-annotation" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col w-full h-full overflow-hidden", children: [
                  selectedId === item.id && !disabled && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute -top-8 left-0 flex gap-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded shadow-lg p-1 z-50", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          const sizes = ["small", "normal", "large", "xlarge"];
                          const currentIdx = sizes.indexOf(item.fontSize || (item.type === "wf-heading" ? "large" : "small"));
                          if (currentIdx > 0) {
                            updateItem(item.id, { fontSize: sizes[currentIdx - 1] });
                          }
                        },
                        className: cn(
                          "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                          item.fontSize === "small" && "opacity-50 cursor-not-allowed"
                        ),
                        title: "Decrease text size",
                        "data-testid": "button-decrease-wf-text",
                        children: "A-"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-6 h-6 flex items-center justify-center text-[10px] text-neutral-500", children: (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "small" ? "S" : (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "large" ? "L" : (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "xlarge" ? "XL" : "M" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          const sizes = ["small", "normal", "large", "xlarge"];
                          const currentIdx = sizes.indexOf(item.fontSize || (item.type === "wf-heading" ? "large" : "small"));
                          if (currentIdx < sizes.length - 1) {
                            updateItem(item.id, { fontSize: sizes[currentIdx + 1] });
                          }
                        },
                        className: cn(
                          "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                          (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "xlarge" && "opacity-50 cursor-not-allowed"
                        ),
                        title: "Increase text size",
                        "data-testid": "button-increase-wf-text",
                        children: "A+"
                      }
                    )
                  ] }),
                  editingItemId === item.id && !disabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "text",
                      autoFocus: true,
                      value: item.content || "",
                      placeholder: item.type === "wf-heading" ? "Heading" : "annotation",
                      onChange: (e) => updateItem(item.id, { content: e.target.value }),
                      onBlur: () => setEditingItemId(null),
                      onKeyDown: (e) => {
                        e.stopPropagation();
                        if (e.key === "Escape" || e.key === "Enter") {
                          setEditingItemId(null);
                        }
                      },
                      onMouseDown: (e) => e.stopPropagation(),
                      onClick: (e) => e.stopPropagation(),
                      className: cn(
                        "bg-transparent border-none focus:ring-0 outline-none cursor-text w-full",
                        item.type === "wf-heading" ? "font-bold text-neutral-900 placeholder:text-neutral-400" : "italic text-neutral-400 placeholder:text-neutral-300"
                      ),
                      style: { fontSize: (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "small" ? 11 : (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "normal" ? 14 : (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "large" ? 20 : 28 }
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      onDoubleClick: (e) => handleDoubleClick(e, item.id),
                      className: cn(
                        "cursor-default w-full overflow-hidden text-ellipsis",
                        item.type === "wf-heading" ? "font-bold text-neutral-900" : "italic text-neutral-400",
                        !item.content && "opacity-50"
                      ),
                      style: { fontSize: (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "small" ? 11 : (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "normal" ? 14 : (item.fontSize || (item.type === "wf-heading" ? "large" : "small")) === "large" ? 20 : 28 },
                      children: item.content || (item.type === "wf-heading" ? "Heading" : "annotation")
                    }
                  )
                ] }) : item.type === "text" || item.type === "bullet-text" || item.type === "numbered-text" || item.type === "link-text" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
                  "flex flex-col w-full h-full overflow-hidden",
                  item.textAlign === "center" && "items-center",
                  item.textAlign === "right" && "items-end",
                  (!item.textAlign || item.textAlign === "left") && "items-start"
                ), children: [
                  selectedId === item.id && !disabled && mode !== "erd-annotation" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute -top-8 left-0 flex gap-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded shadow-lg p-1 z-50", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          updateItem(item.id, { isBold: !item.isBold });
                        },
                        className: cn(
                          "w-6 h-6 flex items-center justify-center rounded text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700",
                          item.isBold && "bg-neutral-200 dark:bg-neutral-600"
                        ),
                        title: "Bold",
                        children: "B"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onMouseDown: (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        },
                        onClick: (e) => {
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
                              setTimeout(() => {
                                ta.selectionStart = start;
                                ta.selectionEnd = end - 2;
                              }, 0);
                            } else {
                              const wrapped = text.slice(0, start) + "_" + selected + "_" + text.slice(end);
                              updateItem(item.id, { content: wrapped });
                              setTimeout(() => {
                                ta.selectionStart = start;
                                ta.selectionEnd = end + 2;
                              }, 0);
                            }
                          } else {
                            updateItem(item.id, { isUnderline: !item.isUnderline });
                          }
                        },
                        className: cn(
                          "w-6 h-6 flex items-center justify-center rounded text-xs underline hover:bg-neutral-100 dark:hover:bg-neutral-700",
                          item.isUnderline && "bg-neutral-200 dark:bg-neutral-600"
                        ),
                        title: "Underline (select text first to underline only selection)",
                        children: "U"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          updateItem(item.id, { hasBullet: !item.hasBullet });
                        },
                        className: cn(
                          "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                          item.hasBullet && "bg-neutral-200 dark:bg-neutral-600"
                        ),
                        title: "Bullet Point",
                        children: "•"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-4 bg-neutral-300 dark:bg-neutral-600 mx-0.5" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          updateItem(item.id, { textAlign: "left" });
                        },
                        className: cn(
                          "w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-700",
                          (item.textAlign === "left" || !item.textAlign) && "bg-neutral-200 dark:bg-neutral-600"
                        ),
                        title: "Align Left",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignStart, { className: "w-3 h-3" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          updateItem(item.id, { textAlign: "center" });
                        },
                        className: cn(
                          "w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-700",
                          item.textAlign === "center" && "bg-neutral-200 dark:bg-neutral-600"
                        ),
                        title: "Align Center",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignCenter, { className: "w-3 h-3" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          updateItem(item.id, { textAlign: "right" });
                        },
                        className: cn(
                          "w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-700",
                          item.textAlign === "right" && "bg-neutral-200 dark:bg-neutral-600"
                        ),
                        title: "Align Right",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignEnd, { className: "w-3 h-3" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-4 bg-neutral-300 dark:bg-neutral-600 mx-0.5" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          const sizes = ["small", "normal", "large", "xlarge"];
                          const currentIdx = sizes.indexOf(item.fontSize || "normal");
                          if (currentIdx > 0) {
                            updateItem(item.id, { fontSize: sizes[currentIdx - 1] });
                          }
                        },
                        className: cn(
                          "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                          item.fontSize === "small" && "opacity-50 cursor-not-allowed"
                        ),
                        title: "Decrease text size",
                        children: "A-"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-6 h-6 flex items-center justify-center text-[10px] text-neutral-500", children: item.fontSize === "small" ? "S" : item.fontSize === "large" ? "L" : item.fontSize === "xlarge" ? "XL" : "M" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          const sizes = ["small", "normal", "large", "xlarge"];
                          const currentIdx = sizes.indexOf(item.fontSize || "normal");
                          if (currentIdx < sizes.length - 1) {
                            updateItem(item.id, { fontSize: sizes[currentIdx + 1] });
                          }
                        },
                        className: cn(
                          "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                          item.fontSize === "xlarge" && "opacity-50 cursor-not-allowed"
                        ),
                        title: "Increase text size",
                        children: "A+"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start gap-1", children: item.type === "bullet-text" || item.type === "numbered-text" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col w-full", children: (item.content || "").split("\n").map((line, idx, arr) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(item.parentEntityId ? "text-black" : "text-neutral-900", "font-bold leading-6 min-w-[20px]"), children: item.type === "bullet-text" ? "•" : `${idx + 1}.` }),
                    selectedId === item.id && !disabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "text",
                        value: line,
                        onChange: (e) => {
                          const lines = (item.content || "").split("\n");
                          lines[idx] = e.target.value;
                          updateItem(item.id, { content: lines.join("\n") });
                        },
                        onKeyDown: (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const lines = (item.content || "").split("\n");
                            lines.splice(idx + 1, 0, "");
                            updateItem(item.id, { content: lines.join("\n") });
                            setTimeout(() => {
                              const nextInput = e.target.parentElement?.nextElementSibling?.querySelector("input");
                              nextInput?.focus();
                            }, 0);
                          } else if (e.key === "Backspace" && line === "" && arr.length > 1) {
                            e.preventDefault();
                            const lines = (item.content || "").split("\n");
                            lines.splice(idx, 1);
                            updateItem(item.id, { content: lines.join("\n") });
                            setTimeout(() => {
                              const prevInput = e.target.parentElement?.previousElementSibling?.querySelector("input");
                              prevInput?.focus();
                            }, 0);
                          }
                        },
                        className: cn(
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
                        ),
                        autoFocus: idx === arr.length - 1,
                        placeholder: idx === 0 ? item.type === "bullet-text" ? "Type here, Enter for new bullet" : "Type here, Enter for new item" : ""
                      }
                    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
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
                    ), children: line || " " })
                  ] }, idx)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    item.hasBullet && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(item.parentEntityId ? "text-black" : "text-neutral-900", "font-bold text-lg"), children: "•" }),
                    editingItemId === item.id && !disabled && !(mode === "erd-annotation" && item.isBaseItem) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "textarea",
                      {
                        ref: paragraphTextareaRef,
                        autoFocus: true,
                        value: item.content,
                        onChange: (e) => updateItem(item.id, { content: e.target.value }),
                        onBlur: (e) => {
                          if (e.relatedTarget && e.relatedTarget.closest("[title*='Underline']")) return;
                          setEditingItemId(null);
                        },
                        onKeyDown: (e) => {
                          e.stopPropagation();
                          if (e.key === "Escape") {
                            setEditingItemId(null);
                          }
                        },
                        onMouseDown: (e) => e.stopPropagation(),
                        onClick: (e) => e.stopPropagation(),
                        rows: Math.max(1, (item.content || "").split("\n").length),
                        spellCheck: false,
                        className: cn(
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
                        ),
                        placeholder: "Enter text (one per line)"
                      }
                    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        onDoubleClick: (e) => handleDoubleClick(e, item.id),
                        className: cn(
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
                          !item.content && "opacity-50"
                        ),
                        children: item.content ? item.content.split("\n").map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: line.split(/(_[^_]+_)/g).map(
                          (part, i) => part.startsWith("_") && part.endsWith("_") && part.length > 2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "underline decoration-1", children: part.slice(1, -1) }, i) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: part }, i)
                        ) }, idx)) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Double-click to edit" })
                      }
                    ),
                    item.marking === "foreign" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-600 font-bold", children: "*" })
                  ] }) })
                ] }) : item.type === "ui-window" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-6 bg-neutral-200 border-b border-neutral-300 flex items-center px-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-red-400" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-yellow-400" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-green-400" })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "text",
                      value: item.content || "",
                      placeholder: "Window Title",
                      onChange: (e) => updateItem(item.id, { content: e.target.value }),
                      className: "bg-transparent border-none focus:ring-0 w-full font-bold text-neutral-700 outline-none cursor-move placeholder:text-neutral-400/50"
                    }
                  ) })
                ] }) : item.type === "ui-image" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex items-center justify-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "absolute inset-0 w-full h-full pointer-events-none", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "0", y1: "0", x2: "100%", y2: "100%", stroke: "#9ca3af", strokeWidth: "1" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "100%", y1: "0", x2: "0", y2: "100%", stroke: "#9ca3af", strokeWidth: "1" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "text",
                      value: item.content || "",
                      placeholder: "image.jpg",
                      onChange: (e) => updateItem(item.id, { content: e.target.value }),
                      className: "bg-white/80 border-none focus:ring-0 text-center w-auto px-2 outline-none cursor-text placeholder:text-neutral-400 text-xs text-neutral-700 z-10",
                      onMouseDown: (e) => e.stopPropagation(),
                      onClick: (e) => e.stopPropagation(),
                      onKeyDown: (e) => e.stopPropagation()
                    }
                  )
                ] }) : item.type === "ui-dropdown" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "text",
                      value: item.content || "",
                      placeholder: "Select...",
                      onChange: (e) => updateItem(item.id, { content: e.target.value }),
                      className: "bg-transparent border-none focus:ring-0 w-full outline-none cursor-text placeholder:text-neutral-400 text-sm text-neutral-900",
                      onMouseDown: (e) => e.stopPropagation(),
                      onClick: (e) => e.stopPropagation(),
                      onKeyDown: (e) => e.stopPropagation()
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-4 h-4 text-neutral-500" })
                ] }) : item.type === "ui-textarea" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-start", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    value: item.content || "",
                    placeholder: "Text area...",
                    onChange: (e) => updateItem(item.id, { content: e.target.value }),
                    className: "bg-transparent border-none focus:ring-0 w-full outline-none cursor-text placeholder:text-neutral-400 text-sm text-neutral-900",
                    onMouseDown: (e) => e.stopPropagation(),
                    onClick: (e) => e.stopPropagation(),
                    onKeyDown: (e) => e.stopPropagation()
                  }
                ) }) : item.type === "ui-radio" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 rounded-full border-2 border-neutral-400 bg-white flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-neutral-400" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "text",
                      value: item.content || "",
                      placeholder: "Option",
                      onChange: (e) => updateItem(item.id, { content: e.target.value }),
                      className: "bg-transparent border-none focus:ring-0 flex-1 outline-none cursor-text placeholder:text-neutral-400 text-sm text-neutral-900",
                      onMouseDown: (e) => e.stopPropagation(),
                      onClick: (e) => e.stopPropagation(),
                      onKeyDown: (e) => e.stopPropagation()
                    }
                  )
                ] }) : item.type === "ui-checkbox" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 border-2 border-neutral-400 bg-white rounded-sm flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-3 h-3 text-neutral-400" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "text",
                      value: item.content || "",
                      placeholder: "Check this",
                      onChange: (e) => updateItem(item.id, { content: e.target.value }),
                      className: "bg-transparent border-none focus:ring-0 flex-1 outline-none cursor-text placeholder:text-neutral-400 text-sm text-neutral-900",
                      onMouseDown: (e) => e.stopPropagation(),
                      onClick: (e) => e.stopPropagation(),
                      onKeyDown: (e) => e.stopPropagation()
                    }
                  )
                ] }) : item.type === "ui-submit" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    value: item.content || "",
                    placeholder: "Submit",
                    onChange: (e) => updateItem(item.id, { content: e.target.value }),
                    className: "bg-transparent border-none focus:ring-0 w-full text-center outline-none cursor-text placeholder:text-white/70 text-sm text-white",
                    onMouseDown: (e) => e.stopPropagation(),
                    onClick: (e) => e.stopPropagation(),
                    onKeyDown: (e) => e.stopPropagation()
                  }
                ) : item.type === "ui-label" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    value: item.content || "",
                    placeholder: "Label:",
                    onChange: (e) => {
                      const newContent = e.target.value;
                      const canvas = document.createElement("canvas");
                      const ctx = canvas.getContext("2d");
                      if (ctx) {
                        ctx.font = "500 14px system-ui, sans-serif";
                        const textWidth = ctx.measureText(newContent || "Label:").width;
                        const minWidth = 80;
                        const padding = 8;
                        const newWidth = Math.max(minWidth, textWidth + padding);
                        const oldWidth = item.width || minWidth;
                        if (newWidth !== oldWidth) {
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
                    },
                    className: "bg-transparent border-none focus:ring-0 w-full text-right outline-none cursor-text placeholder:text-neutral-400 text-sm font-medium text-neutral-900",
                    onMouseDown: (e) => e.stopPropagation(),
                    onClick: (e) => e.stopPropagation(),
                    onKeyDown: (e) => e.stopPropagation()
                  }
                ) : item.type === "wf-paragraph" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full flex flex-col overflow-hidden", children: [
                  selectedId === item.id && !disabled && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute -top-8 left-0 flex gap-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded shadow-lg p-1 z-50", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          updateItem(item.id, { isBold: !item.isBold });
                        },
                        className: cn(
                          "w-6 h-6 flex items-center justify-center rounded text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700",
                          item.isBold && "bg-neutral-200 dark:bg-neutral-600"
                        ),
                        title: "Bold",
                        "data-testid": "button-paragraph-bold",
                        children: "B"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onMouseDown: (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        },
                        onClick: (e) => {
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
                                setTimeout(() => {
                                  ta.selectionStart = start;
                                  ta.selectionEnd = end - 2;
                                }, 0);
                              } else {
                                const wrapped = text.slice(0, start) + "_" + selected + "_" + text.slice(end);
                                updateItem(item.id, { content: wrapped });
                                setTimeout(() => {
                                  ta.selectionStart = start;
                                  ta.selectionEnd = end + 2;
                                }, 0);
                              }
                            }
                          }
                        },
                        className: "w-6 h-6 flex items-center justify-center rounded text-xs underline hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        title: "Underline selected text",
                        "data-testid": "button-paragraph-underline",
                        children: "U"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          updateItem(item.id, { hasBullet: !item.hasBullet });
                        },
                        className: cn(
                          "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                          item.hasBullet && "bg-neutral-200 dark:bg-neutral-600"
                        ),
                        title: "Bullet Points",
                        "data-testid": "button-paragraph-bullet",
                        children: "•"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-4 bg-neutral-300 dark:bg-neutral-600 mx-0.5 self-center" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          const sizes = ["small", "normal", "large", "xlarge"];
                          const currentIdx = sizes.indexOf(item.fontSize || "small");
                          if (currentIdx > 0) {
                            updateItem(item.id, { fontSize: sizes[currentIdx - 1] });
                          }
                        },
                        className: cn(
                          "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                          (item.fontSize === "small" || !item.fontSize) && "opacity-50 cursor-not-allowed"
                        ),
                        title: "Decrease text size",
                        "data-testid": "button-paragraph-size-down",
                        children: "A-"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-6 h-6 flex items-center justify-center text-[10px] text-neutral-500", children: (item.fontSize || "small") === "small" ? "S" : (item.fontSize || "small") === "normal" ? "M" : (item.fontSize || "small") === "large" ? "L" : "XL" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          const sizes = ["small", "normal", "large", "xlarge"];
                          const currentIdx = sizes.indexOf(item.fontSize || "small");
                          if (currentIdx < sizes.length - 1) {
                            updateItem(item.id, { fontSize: sizes[currentIdx + 1] });
                          }
                        },
                        className: cn(
                          "w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700",
                          item.fontSize === "xlarge" && "opacity-50 cursor-not-allowed"
                        ),
                        title: "Increase text size",
                        "data-testid": "button-paragraph-size-up",
                        children: "A+"
                      }
                    )
                  ] }),
                  editingItemId === item.id && !disabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "textarea",
                    {
                      ref: paragraphTextareaRef,
                      autoFocus: true,
                      value: item.content || "",
                      placeholder: item.hasBullet ? "Type here, one bullet per line" : "Type paragraph text here...\nSelect text and press U to underline",
                      onChange: (e) => updateItem(item.id, { content: e.target.value }),
                      onBlur: (e) => {
                        if (e.relatedTarget && e.relatedTarget.closest("[data-testid='button-paragraph-underline']")) return;
                        setEditingItemId(null);
                      },
                      onKeyDown: (e) => {
                        e.stopPropagation();
                        if (e.key === "Escape") {
                          setEditingItemId(null);
                        }
                      },
                      onMouseDown: (e) => e.stopPropagation(),
                      onClick: (e) => e.stopPropagation(),
                      className: cn(
                        "bg-transparent border-none focus:ring-0 w-full h-full p-0 outline-none cursor-text resize-none text-neutral-700 placeholder:text-neutral-400 leading-relaxed",
                        item.isBold && "font-bold",
                        item.fontSize === "small" && "text-xs",
                        item.fontSize === "normal" && "text-sm",
                        item.fontSize === "large" && "text-base",
                        item.fontSize === "xlarge" && "text-lg",
                        !item.fontSize && "text-xs"
                      )
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      onDoubleClick: (e) => handleDoubleClick(e, item.id),
                      className: "w-full h-full cursor-default",
                      children: [
                        item.content ? item.hasBullet ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
                          "text-neutral-700 leading-relaxed",
                          item.isBold && "font-bold",
                          item.fontSize === "small" && "text-xs",
                          item.fontSize === "normal" && "text-sm",
                          item.fontSize === "large" && "text-base",
                          item.fontSize === "xlarge" && "text-lg",
                          !item.fontSize && "text-xs"
                        ), children: item.content.split("\n").map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0", children: "•" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "break-words", children: line.split(/(_[^_]+_)/g).map(
                            (part, i) => part.startsWith("_") && part.endsWith("_") && part.length > 2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "underline decoration-1", children: part.slice(1, -1) }, i) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: part }, i)
                          ) })
                        ] }, idx)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
                          "text-neutral-700 leading-relaxed whitespace-pre-wrap break-words",
                          item.isBold && "font-bold",
                          item.fontSize === "small" && "text-xs",
                          item.fontSize === "normal" && "text-sm",
                          item.fontSize === "large" && "text-base",
                          item.fontSize === "xlarge" && "text-lg",
                          !item.fontSize && "text-xs"
                        ), children: item.content.split(/(_[^_]+_)/g).map(
                          (part, i) => part.startsWith("_") && part.endsWith("_") && part.length > 2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "underline decoration-1", children: part.slice(1, -1) }, i) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: part }, i)
                        ) }) : null,
                        (() => {
                          const fontSize = item.fontSize || "small";
                          const lineH = fontSize === "small" ? 14 : fontSize === "normal" ? 18 : fontSize === "large" ? 22 : 26;
                          const barH = Math.max(2, Math.round(lineH * 0.4));
                          const gapH = lineH - barH;
                          const padding = 8;
                          const boxH = item.height || 80;
                          const textLines = item.content ? item.content.split("\n").length : 0;
                          const textH = textLines * lineH;
                          const remainH = boxH - 2 * padding - textH;
                          const fillerCount = Math.floor(remainH / lineH);
                          if (fillerCount <= 0) return null;
                          const widths = ["100%", "100%", "92%", "97%", "85%", "100%", "95%", "88%", "100%", "62%"];
                          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full", style: { marginTop: textLines > 0 ? `${gapH}px` : 0 }, children: Array.from({ length: fillerCount }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: `${lineH}px`, display: "flex", alignItems: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              style: { height: `${barH}px`, width: widths[i % widths.length] },
                              className: "bg-neutral-200 dark:bg-neutral-600 rounded"
                            }
                          ) }, i)) });
                        })()
                      ]
                    }
                  )
                ] }) : item.type === "wf-audio" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full flex items-center gap-2 px-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", className: "w-5 h-5 shrink-0 text-neutral-500", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "5,3 19,12 5,21" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1 bg-neutral-400 rounded flex-1" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", className: "w-4 h-4 shrink-0 text-neutral-500", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "11,5 6,9 2,9 2,15 6,15 11,19" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M15.54 8.46a5 5 0 0 1 0 7.07" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19.07 4.93a10 10 0 0 1 0 14.14" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "text",
                      value: item.content || "",
                      placeholder: "audio.mp3",
                      onChange: (e) => updateItem(item.id, { content: e.target.value }),
                      className: "bg-transparent border-none focus:ring-0 w-16 text-right outline-none cursor-text placeholder:text-neutral-400 text-[10px] text-neutral-500",
                      onMouseDown: (e) => e.stopPropagation(),
                      onClick: (e) => e.stopPropagation(),
                      onKeyDown: (e) => e.stopPropagation()
                    }
                  )
                ] }) : item.type === "wf-video" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col items-center justify-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 48 48", className: "w-12 h-12 text-neutral-500", fill: "currentColor", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "24", cy: "24", r: "20", fill: "none", stroke: "currentColor", strokeWidth: "2" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "19,14 19,34 36,24" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "text",
                      value: item.content || "",
                      placeholder: "video.mp4",
                      onChange: (e) => updateItem(item.id, { content: e.target.value }),
                      className: "bg-transparent border-none focus:ring-0 text-center w-auto px-2 outline-none cursor-text placeholder:text-neutral-400 text-xs text-neutral-500 mt-1",
                      onMouseDown: (e) => e.stopPropagation(),
                      onClick: (e) => e.stopPropagation(),
                      onKeyDown: (e) => e.stopPropagation()
                    }
                  )
                ] }) : item.type === "wf-div" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full" }) : item.type === "erd-entity" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full flex flex-col bg-white border-2 border-neutral-800 rounded overflow-hidden", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-neutral-200 border-b-2 border-neutral-800 px-2 py-1 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "text",
                      value: item.entityName || "Entity",
                      onChange: (e) => updateItem(item.id, { entityName: e.target.value }),
                      className: "bg-transparent border-none text-center font-bold text-sm text-neutral-900 outline-none w-full",
                      disabled: disabled || mode === "erd-annotation" && item.isBaseItem
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 p-1 overflow-y-auto text-xs", children: [
                    (item.attributes || []).map((attr, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          setSelectedAttributeId(attr.id);
                        },
                        className: cn(
                          "flex items-center gap-1 px-1 py-0.5 rounded cursor-pointer hover:bg-neutral-100",
                          selectedAttributeId === attr.id && selectedId === item.id && "bg-blue-100 ring-1 ring-blue-400"
                        ),
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
                            "flex-1",
                            attr.marking === "primary" && "underline decoration-2"
                          ), children: selectedId === item.id && !disabled && !(mode === "erd-annotation" && item.isBaseItem) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "text",
                              value: attr.name,
                              onChange: (e) => updateEntityAttribute(item.id, attr.id, { name: e.target.value }),
                              placeholder: "attribute",
                              className: "bg-transparent border-none outline-none w-full text-xs",
                              onClick: (e) => e.stopPropagation()
                            }
                          ) : attr.name || "attribute" }),
                          attr.marking === "foreign" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-600 font-bold", children: "*" }),
                          selectedId === item.id && selectedAttributeId === attr.id && !disabled && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-0.5", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "button",
                              {
                                onClick: (e) => {
                                  e.stopPropagation();
                                  toggleAttributeMarking(item.id, attr.id);
                                },
                                className: "text-[10px] bg-blue-500 text-white px-1 rounded hover:bg-blue-600",
                                title: "Toggle marking",
                                children: "Mark"
                              }
                            ),
                            !(mode === "erd-annotation" && item.isBaseItem) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "button",
                              {
                                onClick: (e) => {
                                  e.stopPropagation();
                                  deleteEntityAttribute(item.id, attr.id);
                                },
                                className: "text-[10px] bg-red-500 text-white px-1 rounded hover:bg-red-600",
                                title: "Delete",
                                children: "×"
                              }
                            )
                          ] })
                        ]
                      },
                      attr.id
                    )),
                    selectedId === item.id && !disabled && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          addAttributeToEntity(item.id);
                        },
                        className: "w-full text-[10px] text-blue-600 hover:bg-blue-50 rounded py-0.5 mt-1",
                        children: "+ Add Attribute"
                      }
                    )
                  ] })
                ] }) : item.type === "line" ? null : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("w-full h-full flex items-center justify-center text-sm text-neutral-900 font-semibold z-10 relative overflow-hidden", getTextClasses(item.type)), children: editingItemId === item.id && !disabled && !(mode === "erd-annotation" && item.isBaseItem) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "textarea",
                  {
                    autoFocus: true,
                    value: item.content || "",
                    onChange: (e) => updateItem(item.id, { content: e.target.value }),
                    onBlur: () => setEditingItemId(null),
                    onKeyDown: (e) => {
                      e.stopPropagation();
                      if (e.key === "Escape") {
                        setEditingItemId(null);
                      }
                    },
                    onMouseDown: (e) => e.stopPropagation(),
                    onClick: (e) => e.stopPropagation(),
                    className: cn(
                      "w-full h-full bg-transparent outline-none text-center px-1 border-2 border-blue-400 font-semibold resize-none",
                      item.marking === "primary" && "underline decoration-2 decoration-red-600"
                    ),
                    style: {
                      fontSize: "14px",
                      lineHeight: "1.3",
                      wordBreak: "break-word",
                      overflowWrap: "break-word"
                    }
                  }
                ) : (
                  /* Display mode: just show content, double-click to edit */
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      onDoubleClick: (e) => handleDoubleClick(e, item.id),
                      className: cn(
                        "w-full h-full flex items-center justify-center bg-transparent text-center px-1 whitespace-pre-wrap cursor-default",
                        item.marking === "primary" && "underline decoration-2 decoration-red-600"
                      ),
                      style: {
                        fontSize: "14px",
                        lineHeight: "1.3",
                        wordBreak: "break-word"
                      },
                      dangerouslySetInnerHTML: { __html: (item.content || "").replace(/\n/g, "<br>") + (item.marking === "foreign" ? '<span class="text-red-600 font-bold ml-1">*</span>' : "") }
                    }
                  )
                ) }),
                (item.type === "ui-input" || item.type === "ui-textarea") && (item.content || item.validationMessage || item.validationMin !== void 0 || item.validationMax !== void 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "absolute left-0 right-0 text-[10px] text-amber-600 dark:text-amber-400 italic pointer-events-none z-10",
                    style: { top: `${(item.height || 28) + 2}px` },
                    children: [
                      "Validation: ",
                      item.content || item.validationMessage || `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}`
                    ]
                  }
                ),
                item.type === "ui-dropdown" && (item.validationMessage || item.validationMin !== void 0 || item.validationMax !== void 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "absolute left-0 right-0 text-[10px] text-amber-600 dark:text-amber-400 italic pointer-events-none z-10",
                    style: { top: `${(item.height || 28) + 2}px` },
                    children: [
                      "Validation: ",
                      item.validationMessage || `${item.validationMin ?? "?"}-${item.validationMax ?? "?"}`
                    ]
                  }
                ),
                selectedId === item.id && !disabled && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        deleteItem(item.id);
                      },
                      className: "absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 z-20",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" })
                    }
                  ),
                  item.type !== "erd-entity" && item.type !== "line" && item.type !== "crowfoot" && (mode === "erd-annotation" || mode === "database") && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        toggleMarking(item.id);
                      },
                      className: "absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded shadow hover:bg-blue-600 z-20",
                      title: "Toggle marking",
                      children: "Mark"
                    }
                  ),
                  item.type !== "text" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        onMouseDown: (e) => handleResizeMouseDown(e, item.id, "se"),
                        className: "absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 border border-white rounded-sm cursor-se-resize z-20"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        onMouseDown: (e) => handleResizeMouseDown(e, item.id, "sw"),
                        className: "absolute -bottom-1 -left-1 w-3 h-3 bg-red-500 border border-white rounded-sm cursor-sw-resize z-20"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        onMouseDown: (e) => handleResizeMouseDown(e, item.id, "ne"),
                        className: "absolute -top-1 -right-1 w-3 h-3 bg-red-500 border border-white rounded-sm cursor-ne-resize z-20"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        onMouseDown: (e) => handleResizeMouseDown(e, item.id, "nw"),
                        className: "absolute -top-1 -left-1 w-3 h-3 bg-red-500 border border-white rounded-sm cursor-nw-resize z-20"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        onMouseDown: (e) => handleResizeMouseDown(e, item.id, "e"),
                        className: "absolute top-1/2 -right-1 w-2 h-4 -translate-y-1/2 bg-red-500 border border-white rounded-sm cursor-e-resize z-20"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        onMouseDown: (e) => handleResizeMouseDown(e, item.id, "w"),
                        className: "absolute top-1/2 -left-1 w-2 h-4 -translate-y-1/2 bg-red-500 border border-white rounded-sm cursor-w-resize z-20"
                      }
                    )
                  ] })
                ] })
              ]
            },
            item.id
          ))
        ]
      }
    )
  ] });
}
export {
  ArrowUp as A,
  DiagramEditor as D,
  TextAlignStart as T,
  ArrowDown as a,
  TextAlignCenter as b,
  TextAlignEnd as c
};
//# sourceMappingURL=diagram-editor-YPWk6RIh.js.map
