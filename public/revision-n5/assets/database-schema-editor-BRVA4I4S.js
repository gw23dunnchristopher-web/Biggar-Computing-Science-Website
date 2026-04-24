import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, g as cn } from "./index-DZjJp9Jo.js";
import { B as Button } from "./button-CuYF_D-8.js";
import { I as Input } from "./input-BglVfhce.js";
import { L as Label } from "./label-DXOWQ5Is.js";
import { P as Plus } from "./plus-Bl_GJopp.js";
import { T as Trash2 } from "./trash-2-bLg5w6uM.js";
import { K as Key } from "./key-DEEIcqry.js";
const __iconNode$1 = [
  ["path", { d: "M9 17H7A5 5 0 0 1 7 7h2", key: "8i5ue5" }],
  ["path", { d: "M15 7h2a5 5 0 1 1 0 10h-2", key: "1b9ql8" }],
  ["line", { x1: "8", x2: "16", y1: "12", y2: "12", key: "1jonct" }]
];
const Link2 = createLucideIcon("link-2", __iconNode$1);
const __iconNode = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["circle", { cx: "12", cy: "12", r: "6", key: "1vlfrh" }],
  ["circle", { cx: "12", cy: "12", r: "2", key: "1c9p78" }]
];
const Target = createLucideIcon("target", __iconNode);
function TagMatchingEditor({
  sourceTags,
  targetZones,
  backgroundUrl,
  onChange,
  mode,
  studentConnections = [],
  onStudentConnectionsChange,
  disabled = false
}) {
  const containerRef = reactExports.useRef(null);
  const [selectedZoneId, setSelectedZoneId] = reactExports.useState(null);
  const [selectedPointId, setSelectedPointId] = reactExports.useState(null);
  const [isDrawingZone, setIsDrawingZone] = reactExports.useState(false);
  const [isPlacingPoint, setIsPlacingPoint] = reactExports.useState(false);
  const [zoneStart, setZoneStart] = reactExports.useState(null);
  const [tempZone, setTempZone] = reactExports.useState(null);
  const [drawingLine, setDrawingLine] = reactExports.useState(null);
  const [containerHeight, setContainerHeight] = reactExports.useState(400);
  reactExports.useEffect(() => {
    if (!backgroundUrl) {
      setContainerHeight(400);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const containerWidth = containerRef.current?.clientWidth || 800;
      const aspectRatio = img.height / img.width;
      setContainerHeight(Math.min(containerWidth * aspectRatio, 600));
    };
    img.src = backgroundUrl;
  }, [backgroundUrl]);
  const getMousePos = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };
  const handleMouseDown = (e) => {
    if (disabled) return;
    const pos = getMousePos(e);
    if (mode === "edit" && isDrawingZone) {
      setZoneStart(pos);
      setTempZone({ x: pos.x, y: pos.y, width: 0, height: 0 });
    } else if (mode === "edit" && isPlacingPoint) {
      const newPoint = {
        id: `point-${Date.now()}`,
        label: `Point ${sourceTags.length + 1}`,
        x: pos.x,
        y: pos.y,
        isPoint: true
      };
      onChange?.([...sourceTags, newPoint], targetZones);
      setSelectedPointId(newPoint.id);
      setIsPlacingPoint(false);
    }
  };
  const handleMouseMove = (e) => {
    if (disabled) return;
    const pos = getMousePos(e);
    if (mode === "edit" && zoneStart && tempZone) {
      setTempZone({
        x: Math.min(zoneStart.x, pos.x),
        y: Math.min(zoneStart.y, pos.y),
        width: Math.abs(pos.x - zoneStart.x),
        height: Math.abs(pos.y - zoneStart.y)
      });
    } else if (mode === "student" && drawingLine) {
      setDrawingLine({ ...drawingLine, endX: pos.x, endY: pos.y });
    }
  };
  const handleMouseUp = (e) => {
    if (disabled) return;
    const pos = getMousePos(e);
    if (mode === "edit" && zoneStart && tempZone && tempZone.width > 20 && tempZone.height > 20) {
      const newZone = {
        id: `zone-${Date.now()}`,
        label: `Zone ${targetZones.length + 1}`,
        x: tempZone.x,
        y: tempZone.y,
        width: tempZone.width,
        height: tempZone.height,
        correctTagId: ""
      };
      onChange?.(sourceTags, [...targetZones, newZone]);
      setSelectedZoneId(newZone.id);
    }
    if (mode === "student" && drawingLine) {
      const newConnection = {
        tagId: drawingLine.tagId,
        endX: pos.x,
        endY: pos.y
      };
      const updatedConnections = studentConnections.filter((c) => c.tagId !== drawingLine.tagId);
      onStudentConnectionsChange?.([...updatedConnections, newConnection]);
    }
    setZoneStart(null);
    setTempZone(null);
    setDrawingLine(null);
    setIsDrawingZone(false);
  };
  const updateTag = (id, updates) => {
    const updated = sourceTags.map((t) => t.id === id ? { ...t, ...updates } : t);
    onChange?.(updated, targetZones);
  };
  const deleteTag = (id) => {
    onChange?.(sourceTags.filter((t) => t.id !== id), targetZones);
  };
  const updateZone = (id, updates) => {
    const updated = targetZones.map((z) => z.id === id ? { ...z, ...updates } : z);
    onChange?.(sourceTags, updated);
  };
  const deleteZone = (id) => {
    onChange?.(sourceTags, targetZones.filter((z) => z.id !== id));
    setSelectedZoneId(null);
  };
  const selectedZone = targetZones.find((z) => z.id === selectedZoneId);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    mode === "edit" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: isPlacingPoint ? "default" : "outline",
          size: "sm",
          onClick: () => {
            setIsPlacingPoint(!isPlacingPoint);
            setIsDrawingZone(false);
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
            " ",
            isPlacingPoint ? "Click to place..." : "Place Point"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: isDrawingZone ? "default" : "outline",
          size: "sm",
          onClick: () => {
            setIsDrawingZone(!isDrawingZone);
            setIsPlacingPoint(false);
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "h-4 w-4 mr-1" }),
            " ",
            isDrawingZone ? "Drawing Zone..." : "Draw Zone"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-500", children: isPlacingPoint ? "Click on the image to place a source point" : isDrawingZone ? "Click and drag on the image to create a target zone" : "Place points where students will draw FROM, then draw zones where arrows should END" })
    ] }),
    mode === "student" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-neutral-600 dark:text-neutral-400", children: "Click and drag from each numbered point to draw an arrow to the correct part of the image." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        ref: containerRef,
        className: cn(
          "relative border rounded-lg overflow-hidden bg-white dark:bg-neutral-900",
          (isDrawingZone || isPlacingPoint) && "cursor-crosshair",
          mode === "student" && drawingLine && "cursor-crosshair"
        ),
        style: { height: containerHeight },
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onMouseLeave: () => {
          setTempZone(null);
          setDrawingLine(null);
        },
        children: [
          backgroundUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: backgroundUrl,
              alt: "Background",
              className: "absolute inset-0 w-full h-full object-contain pointer-events-none"
            }
          ),
          sourceTags.map((tag, index) => {
            const isDrawing = drawingLine?.tagId === tag.id;
            const hasConnection = studentConnections.some((c) => c.tagId === tag.id);
            const isSelected = selectedPointId === tag.id;
            const pointNumber = index + 1;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: cn(
                  "absolute flex items-center justify-center rounded-full text-sm font-bold select-none transition-all",
                  "w-8 h-8 -ml-4 -mt-4",
                  // Center the circle on the point
                  mode === "edit" ? isSelected ? "bg-red-500 text-white border-2 border-red-700 cursor-move" : "bg-blue-500 text-white border-2 border-blue-700 cursor-pointer hover:bg-blue-600" : disabled ? "bg-neutral-400 text-white cursor-not-allowed" : isDrawing ? "bg-green-500 text-white border-2 border-green-700 cursor-crosshair scale-110" : hasConnection ? "bg-green-500 text-white border-2 border-green-600 cursor-grab" : "bg-yellow-500 text-white border-2 border-yellow-600 hover:bg-yellow-400 cursor-grab shadow-lg"
                ),
                style: { left: tag.x, top: tag.y },
                onClick: (e) => {
                  e.stopPropagation();
                  if (mode === "edit") {
                    setSelectedPointId(isSelected ? null : tag.id);
                    setSelectedZoneId(null);
                  }
                },
                onMouseDown: (e) => {
                  e.stopPropagation();
                  if (mode === "student" && !disabled) {
                    e.preventDefault();
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    setDrawingLine({
                      tagId: tag.id,
                      startX: tag.x,
                      startY: tag.y,
                      endX: e.clientX - rect.left,
                      endY: e.clientY - rect.top
                    });
                  }
                },
                children: pointNumber
              },
              tag.id
            );
          }),
          (mode === "edit" || mode === "review") && targetZones.map((zone) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: cn(
                "absolute border-2 border-dashed",
                mode === "edit" ? selectedZoneId === zone.id ? "border-red-500 bg-red-500/20" : "border-orange-400 bg-orange-400/10" : "border-green-500 bg-green-500/10"
              ),
              style: {
                left: zone.x,
                top: zone.y,
                width: zone.width,
                height: zone.height
              },
              onClick: (e) => {
                e.stopPropagation();
                if (mode === "edit") {
                  setSelectedZoneId(zone.id);
                }
              },
              children: mode === "edit" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-5 left-0 text-xs bg-orange-100 text-orange-800 px-1 rounded", children: zone.label })
            },
            zone.id
          )),
          tempZone && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "absolute border-2 border-dashed border-red-500 bg-red-500/20",
              style: {
                left: tempZone.x,
                top: tempZone.y,
                width: tempZone.width,
                height: tempZone.height
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "absolute inset-0 w-full h-full pointer-events-none", children: [
            studentConnections.map((conn) => {
              const tag = sourceTags.find((t) => t.id === conn.tagId);
              if (!tag) return null;
              const isCorrect = mode === "review" && targetZones.some(
                (zone) => zone.correctTagId === conn.tagId && conn.endX >= zone.x && conn.endX <= zone.x + zone.width && conn.endY >= zone.y && conn.endY <= zone.y + zone.height
              );
              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                "line",
                {
                  x1: tag.x,
                  y1: tag.y,
                  x2: conn.endX,
                  y2: conn.endY,
                  stroke: mode === "review" ? isCorrect ? "#22c55e" : "#ef4444" : "#3b82f6",
                  strokeWidth: "3",
                  markerEnd: mode === "review" ? isCorrect ? "url(#arrowhead-green)" : "url(#arrowhead-red)" : "url(#arrowhead)"
                },
                conn.tagId
              );
            }),
            drawingLine && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: drawingLine.startX,
                y1: drawingLine.startY,
                x2: drawingLine.endX,
                y2: drawingLine.endY,
                stroke: "#3b82f6",
                strokeWidth: "2",
                strokeDasharray: "5,5"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("defs", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("marker", { id: "arrowhead", markerWidth: "10", markerHeight: "7", refX: "9", refY: "3.5", orient: "auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "0 0, 10 3.5, 0 7", fill: "#3b82f6" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("marker", { id: "arrowhead-green", markerWidth: "10", markerHeight: "7", refX: "9", refY: "3.5", orient: "auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "0 0, 10 3.5, 0 7", fill: "#22c55e" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("marker", { id: "arrowhead-red", markerWidth: "10", markerHeight: "7", refX: "9", refY: "3.5", orient: "auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "0 0, 10 3.5, 0 7", fill: "#ef4444" }) })
            ] })
          ] })
        ]
      }
    ),
    mode === "edit" && selectedZone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border rounded-lg bg-neutral-50 dark:bg-neutral-800 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-semibold", children: [
          "Edit Zone: ",
          selectedZone.label
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "ghost",
            size: "sm",
            className: "text-red-500",
            onClick: () => deleteZone(selectedZone.id),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Zone Label" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: selectedZone.label,
              onChange: (e) => updateZone(selectedZone.id, { label: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Correct Point" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              className: "w-full px-3 py-2 border rounded-md bg-white dark:bg-neutral-900",
              value: selectedZone.correctTagId,
              onChange: (e) => updateZone(selectedZone.id, { correctTagId: e.target.value }),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "-- Select point --" }),
                sourceTags.map((tag, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: tag.id, children: [
                  "Point ",
                  idx + 1,
                  ": ",
                  tag.label
                ] }, tag.id))
              ]
            }
          )
        ] })
      ] })
    ] }),
    mode === "edit" && selectedPointId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-semibold", children: [
          "Edit Point ",
          sourceTags.findIndex((t) => t.id === selectedPointId) + 1
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            variant: "ghost",
            size: "sm",
            className: "text-red-500",
            onClick: () => {
              deleteTag(selectedPointId);
              setSelectedPointId(null);
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }),
              " Delete"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Label (for reference)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: sourceTags.find((t) => t.id === selectedPointId)?.label || "",
            onChange: (e) => updateTag(selectedPointId, { label: e.target.value }),
            placeholder: "e.g., Header section, Navigation area"
          }
        )
      ] })
    ] }),
    mode === "edit" && sourceTags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-neutral-600 dark:text-neutral-400", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
        sourceTags.length,
        " point",
        sourceTags.length !== 1 ? "s" : ""
      ] }),
      " placed. Click a point to edit or delete it."
    ] })
  ] });
}
function gradeTagMatching(connections, zones) {
  const details = [];
  let correct = 0;
  const total = zones.filter((z) => z.correctTagId).length;
  for (const zone of zones) {
    if (!zone.correctTagId) continue;
    const connection = connections.find((c) => c.tagId === zone.correctTagId);
    const isCorrect = connection !== void 0 && connection.endX >= zone.x && connection.endX <= zone.x + zone.width && connection.endY >= zone.y && connection.endY <= zone.y + zone.height;
    details.push({ tagId: zone.correctTagId, correct: isCorrect });
    if (isCorrect) correct++;
  }
  return { correct, total, details };
}
function DatabaseSchemaEditor({ value, onChange, disabled }) {
  const [tables, setTables] = reactExports.useState(value?.tables || []);
  reactExports.useEffect(() => {
    if (value?.tables) {
      setTables(value.tables);
    }
  }, [value]);
  const generateId = () => Math.random().toString(36).substring(2, 10);
  const updateTables = (newTables) => {
    setTables(newTables);
    onChange({ tables: newTables });
  };
  const addTable = () => {
    const newTable = {
      id: generateId(),
      name: "NewTable",
      fields: [
        { id: generateId(), name: "id", isPrimaryKey: true }
      ]
    };
    updateTables([...tables, newTable]);
  };
  const removeTable = (tableId) => {
    updateTables(tables.filter((t) => t.id !== tableId));
  };
  const updateTableName = (tableId, name) => {
    updateTables(tables.map((t) => t.id === tableId ? { ...t, name } : t));
  };
  const addField = (tableId) => {
    updateTables(tables.map((t) => {
      if (t.id === tableId) {
        return {
          ...t,
          fields: [...t.fields, { id: generateId(), name: "newField" }]
        };
      }
      return t;
    }));
  };
  const removeField = (tableId, fieldId) => {
    updateTables(tables.map((t) => {
      if (t.id === tableId) {
        return {
          ...t,
          fields: t.fields.filter((f) => f.id !== fieldId)
        };
      }
      return t;
    }));
  };
  const updateFieldName = (tableId, fieldId, name) => {
    updateTables(tables.map((t) => {
      if (t.id === tableId) {
        return {
          ...t,
          fields: t.fields.map((f) => f.id === fieldId ? { ...f, name } : f)
        };
      }
      return t;
    }));
  };
  const togglePrimaryKey = (tableId, fieldId) => {
    updateTables(tables.map((t) => {
      if (t.id === tableId) {
        return {
          ...t,
          fields: t.fields.map((f) => f.id === fieldId ? { ...f, isPrimaryKey: !f.isPrimaryKey } : f)
        };
      }
      return t;
    }));
  };
  const toggleForeignKey = (tableId, fieldId) => {
    updateTables(tables.map((t) => {
      if (t.id === tableId) {
        return {
          ...t,
          fields: t.fields.map((f) => f.id === fieldId ? { ...f, isForeignKey: !f.isForeignKey } : f)
        };
      }
      return t;
    }));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-neutral-700 dark:text-neutral-300", children: "Database Schema Tables" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: "outline",
          size: "sm",
          onClick: addTable,
          disabled,
          "data-testid": "add-table-btn",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-1" }),
            " Add Table"
          ]
        }
      )
    ] }),
    tables.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-neutral-500 dark:text-neutral-400 italic", children: 'No tables defined. Click "Add Table" to create a database table.' }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-4", children: tables.map((table) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 min-w-[180px]",
        "data-testid": `table-${table.id}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-neutral-300 dark:border-neutral-600 px-3 py-2 flex items-center gap-2 bg-neutral-50 dark:bg-neutral-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: table.name,
                onChange: (e) => updateTableName(table.id, e.target.value),
                className: "h-7 text-sm font-bold flex-1 min-w-0",
                disabled,
                "data-testid": `table-name-${table.id}`
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "sm",
                onClick: () => removeTable(table.id),
                disabled,
                className: "h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50",
                "data-testid": `remove-table-${table.id}`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-neutral-200 dark:divide-neutral-600", children: table.fields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "px-3 py-1.5 flex items-center gap-2",
              "data-testid": `field-${field.id}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: field.name,
                    onChange: (e) => updateFieldName(table.id, field.id, e.target.value),
                    className: cn(
                      "h-6 text-sm flex-1 min-w-0 border-0 bg-transparent p-0 focus:ring-0",
                      field.isPrimaryKey && "underline font-medium"
                    ),
                    disabled,
                    "data-testid": `field-name-${field.id}`
                  }
                ),
                field.isForeignKey && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-neutral-600 dark:text-neutral-400", children: "*" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "sm",
                      onClick: () => togglePrimaryKey(table.id, field.id),
                      disabled,
                      className: cn(
                        "h-6 w-6 p-0",
                        field.isPrimaryKey ? "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30" : "text-neutral-400"
                      ),
                      title: "Primary Key (underlined)",
                      "data-testid": `pk-toggle-${field.id}`,
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { className: "w-3.5 h-3.5" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "sm",
                      onClick: () => toggleForeignKey(table.id, field.id),
                      disabled,
                      className: cn(
                        "h-6 w-6 p-0",
                        field.isForeignKey ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30" : "text-neutral-400"
                      ),
                      title: "Foreign Key (*)",
                      "data-testid": `fk-toggle-${field.id}`,
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "w-3.5 h-3.5" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "sm",
                      onClick: () => removeField(table.id, field.id),
                      disabled,
                      className: "h-6 w-6 p-0 text-red-400 hover:text-red-600",
                      "data-testid": `remove-field-${field.id}`,
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
                    }
                  )
                ] })
              ]
            },
            field.id
          )) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-2 border-t border-neutral-200 dark:border-neutral-600", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "ghost",
              size: "sm",
              onClick: () => addField(table.id),
              disabled,
              className: "h-6 text-xs w-full",
              "data-testid": `add-field-${table.id}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                " Add Field"
              ]
            }
          ) })
        ]
      },
      table.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded border border-neutral-200 dark:border-neutral-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-neutral-600 dark:text-neutral-400", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { className: "w-3 h-3 inline mr-1 text-yellow-600" }),
      " = Primary Key (underlined)",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mx-3", children: "|" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "w-3 h-3 inline mr-1 text-blue-600" }),
      " = Foreign Key (*)"
    ] }) })
  ] });
}
function DatabaseSchemaDisplay({ schema, className }) {
  if (!schema?.tables || schema.tables.length === 0) {
    return null;
  }
  const tableCount = schema.tables.length;
  const tableWidth = tableCount <= 3 ? "min-w-[140px] flex-1" : "min-w-[120px] w-[140px]";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex flex-wrap gap-4 justify-center items-stretch", className), children: schema.tables.map((table) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn("border border-neutral-400 dark:border-neutral-500 bg-white dark:bg-neutral-800 flex flex-col", tableWidth),
      "data-testid": `schema-table-${table.id}`,
      children: [
        table.name && table.name.trim() !== "" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-neutral-400 dark:border-neutral-500 px-4 py-1.5 text-sm font-bold text-neutral-500 dark:text-white bg-neutral-200 dark:bg-neutral-700", children: table.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: table.fields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "px-4 py-0.5 text-sm",
            "data-testid": `schema-field-${field.id}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: field.isPrimaryKey ? "underline" : "", children: field.name }),
              field.isForeignKey && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-600 dark:text-neutral-400", children: "*" })
            ]
          },
          field.id
        )) })
      ]
    },
    table.id
  )) });
}
export {
  DatabaseSchemaDisplay as D,
  TagMatchingEditor as T,
  DatabaseSchemaEditor as a,
  gradeTagMatching as g
};
//# sourceMappingURL=database-schema-editor-BRVA4I4S.js.map
