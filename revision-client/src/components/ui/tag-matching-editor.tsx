import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Target, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SourceTag {
  id: string;
  label: string; // Optional label for reference (shown in edit mode only)
  x: number;
  y: number;
  isPoint?: boolean; // If true, shown as a draggable point on the image rather than a text tag
}

export interface TargetZone {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  correctTagId: string;
}

export interface StudentConnection {
  tagId: string;
  endX: number;
  endY: number;
}

interface TagMatchingEditorProps {
  sourceTags: SourceTag[];
  targetZones: TargetZone[];
  backgroundUrl?: string;
  onChange?: (tags: SourceTag[], zones: TargetZone[]) => void;
  mode: "edit" | "student" | "review";
  studentConnections?: StudentConnection[];
  onStudentConnectionsChange?: (connections: StudentConnection[]) => void;
  disabled?: boolean;
}

export function TagMatchingEditor({
  sourceTags,
  targetZones,
  backgroundUrl,
  onChange,
  mode,
  studentConnections = [],
  onStudentConnectionsChange,
  disabled = false
}: TagMatchingEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [isPlacingPoint, setIsPlacingPoint] = useState(false);
  const [zoneStart, setZoneStart] = useState<{ x: number; y: number } | null>(null);
  const [tempZone, setTempZone] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [drawingLine, setDrawingLine] = useState<{ tagId: string; startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  useEffect(() => {
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

  const getMousePos = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    const pos = getMousePos(e);

    if (mode === "edit" && isDrawingZone) {
      setZoneStart(pos);
      setTempZone({ x: pos.x, y: pos.y, width: 0, height: 0 });
    } else if (mode === "edit" && isPlacingPoint) {
      const newPoint: SourceTag = {
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
    // Note: student line drawing is now initiated from the point's onMouseDown
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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

  const handleMouseUp = (e: React.MouseEvent) => {
    if (disabled) return;
    const pos = getMousePos(e);

    if (mode === "edit" && zoneStart && tempZone && tempZone.width > 20 && tempZone.height > 20) {
      const newZone: TargetZone = {
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
      const newConnection: StudentConnection = {
        tagId: drawingLine.tagId,
        endX: pos.x,
        endY: pos.y
      };
      const updatedConnections = studentConnections.filter(c => c.tagId !== drawingLine.tagId);
      onStudentConnectionsChange?.([...updatedConnections, newConnection]);
    }

    setZoneStart(null);
    setTempZone(null);
    setDrawingLine(null);
    setIsDrawingZone(false);
  };

  const addTag = () => {
    const newTag: SourceTag = {
      id: `tag-${Date.now()}`,
      label: "<tag>",
      x: 10,
      y: 10 + sourceTags.length * 40
    };
    onChange?.([...sourceTags, newTag], targetZones);
  };

  const updateTag = (id: string, updates: Partial<SourceTag>) => {
    const updated = sourceTags.map(t => t.id === id ? { ...t, ...updates } : t);
    onChange?.(updated, targetZones);
  };

  const deleteTag = (id: string) => {
    onChange?.(sourceTags.filter(t => t.id !== id), targetZones);
  };

  const updateZone = (id: string, updates: Partial<TargetZone>) => {
    const updated = targetZones.map(z => z.id === id ? { ...z, ...updates } : z);
    onChange?.(sourceTags, updated);
  };

  const deleteZone = (id: string) => {
    onChange?.(sourceTags, targetZones.filter(z => z.id !== id));
    setSelectedZoneId(null);
  };

  const selectedZone = targetZones.find(z => z.id === selectedZoneId);

  return (
    <div className="space-y-4">
      {mode === "edit" && (
        <div className="flex flex-wrap gap-2 items-center">
          <Button 
            type="button" 
            variant={isPlacingPoint ? "default" : "outline"} 
            size="sm" 
            onClick={() => { setIsPlacingPoint(!isPlacingPoint); setIsDrawingZone(false); }}
          >
            <Plus className="h-4 w-4 mr-1" /> {isPlacingPoint ? "Click to place..." : "Place Point"}
          </Button>
          <Button 
            type="button" 
            variant={isDrawingZone ? "default" : "outline"} 
            size="sm" 
            onClick={() => { setIsDrawingZone(!isDrawingZone); setIsPlacingPoint(false); }}
          >
            <Target className="h-4 w-4 mr-1" /> {isDrawingZone ? "Drawing Zone..." : "Draw Zone"}
          </Button>
          <span className="text-xs text-neutral-500">
            {isPlacingPoint 
              ? "Click on the image to place a source point" 
              : isDrawingZone 
                ? "Click and drag on the image to create a target zone" 
                : "Place points where students will draw FROM, then draw zones where arrows should END"}
          </span>
        </div>
      )}

      {mode === "student" && (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Click and drag from each numbered point to draw an arrow to the correct part of the image.
        </div>
      )}

      <div 
        ref={containerRef}
        className={cn(
          "relative border rounded-lg overflow-hidden bg-white dark:bg-neutral-900",
          (isDrawingZone || isPlacingPoint) && "cursor-crosshair",
          mode === "student" && drawingLine && "cursor-crosshair"
        )}
        style={{ height: containerHeight }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setTempZone(null);
          setDrawingLine(null);
        }}
      >
        {backgroundUrl && (
          <img 
            src={backgroundUrl} 
            alt="Background" 
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        )}

        {/* Source Points - rendered as numbered circles on the image */}
        {sourceTags.map((tag, index) => {
          const isDrawing = drawingLine?.tagId === tag.id;
          const hasConnection = studentConnections.some(c => c.tagId === tag.id);
          const isSelected = selectedPointId === tag.id;
          const pointNumber = index + 1;
          
          return (
            <div
              key={tag.id}
              className={cn(
                "absolute flex items-center justify-center rounded-full text-sm font-bold select-none transition-all",
                "w-8 h-8 -ml-4 -mt-4", // Center the circle on the point
                mode === "edit" 
                  ? isSelected
                    ? "bg-red-500 text-white border-2 border-red-700 cursor-move"
                    : "bg-blue-500 text-white border-2 border-blue-700 cursor-pointer hover:bg-blue-600"
                  : disabled
                    ? "bg-neutral-400 text-white cursor-not-allowed"
                    : isDrawing
                      ? "bg-green-500 text-white border-2 border-green-700 cursor-crosshair scale-110"
                      : hasConnection
                        ? "bg-green-500 text-white border-2 border-green-600 cursor-grab"
                        : "bg-yellow-500 text-white border-2 border-yellow-600 hover:bg-yellow-400 cursor-grab shadow-lg"
              )}
              style={{ left: tag.x, top: tag.y }}
              onClick={(e) => {
                e.stopPropagation();
                if (mode === "edit") {
                  setSelectedPointId(isSelected ? null : tag.id);
                  setSelectedZoneId(null);
                }
              }}
              onMouseDown={(e) => {
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
              }}
            >
              {pointNumber}
            </div>
          );
        })}

        {/* Target Zones (visible in edit mode and review mode) */}
        {(mode === "edit" || mode === "review") && targetZones.map(zone => (
          <div
            key={zone.id}
            className={cn(
              "absolute border-2 border-dashed",
              mode === "edit" 
                ? selectedZoneId === zone.id
                  ? "border-red-500 bg-red-500/20"
                  : "border-orange-400 bg-orange-400/10"
                : "border-green-500 bg-green-500/10"
            )}
            style={{
              left: zone.x,
              top: zone.y,
              width: zone.width,
              height: zone.height
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (mode === "edit") {
                setSelectedZoneId(zone.id);
              }
            }}
          >
            {mode === "edit" && (
              <span className="absolute -top-5 left-0 text-xs bg-orange-100 text-orange-800 px-1 rounded">
                {zone.label}
              </span>
            )}
          </div>
        ))}

        {/* Temporary zone while drawing */}
        {tempZone && (
          <div
            className="absolute border-2 border-dashed border-red-500 bg-red-500/20"
            style={{
              left: tempZone.x,
              top: tempZone.y,
              width: tempZone.width,
              height: tempZone.height
            }}
          />
        )}

        {/* Student Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {studentConnections.map(conn => {
            const tag = sourceTags.find(t => t.id === conn.tagId);
            if (!tag) return null;
            
            const isCorrect = mode === "review" && targetZones.some(zone => 
              zone.correctTagId === conn.tagId &&
              conn.endX >= zone.x && conn.endX <= zone.x + zone.width &&
              conn.endY >= zone.y && conn.endY <= zone.y + zone.height
            );
            
            return (
              <line
                key={conn.tagId}
                x1={tag.x}
                y1={tag.y}
                x2={conn.endX}
                y2={conn.endY}
                stroke={mode === "review" ? (isCorrect ? "#22c55e" : "#ef4444") : "#3b82f6"}
                strokeWidth="3"
                markerEnd={mode === "review" ? (isCorrect ? "url(#arrowhead-green)" : "url(#arrowhead-red)") : "url(#arrowhead)"}
              />
            );
          })}
          {drawingLine && (
            <line
              x1={drawingLine.startX}
              y1={drawingLine.startY}
              x2={drawingLine.endX}
              y2={drawingLine.endY}
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
            </marker>
            <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
            </marker>
            <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Zone editor panel (edit mode only) */}
      {mode === "edit" && selectedZone && (
        <div className="p-4 border rounded-lg bg-neutral-50 dark:bg-neutral-800 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">Edit Zone: {selectedZone.label}</h4>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="text-red-500"
              onClick={() => deleteZone(selectedZone.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Zone Label</Label>
              <Input
                value={selectedZone.label}
                onChange={(e) => updateZone(selectedZone.id, { label: e.target.value })}
              />
            </div>
            <div>
              <Label>Correct Point</Label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-neutral-900"
                value={selectedZone.correctTagId}
                onChange={(e) => updateZone(selectedZone.id, { correctTagId: e.target.value })}
              >
                <option value="">-- Select point --</option>
                {sourceTags.map((tag, idx) => (
                  <option key={tag.id} value={tag.id}>Point {idx + 1}: {tag.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Point editor panel (edit mode only) */}
      {mode === "edit" && selectedPointId && (
        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">Edit Point {sourceTags.findIndex(t => t.id === selectedPointId) + 1}</h4>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="text-red-500"
              onClick={() => {
                deleteTag(selectedPointId);
                setSelectedPointId(null);
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
          <div>
            <Label>Label (for reference)</Label>
            <Input
              value={sourceTags.find(t => t.id === selectedPointId)?.label || ""}
              onChange={(e) => updateTag(selectedPointId, { label: e.target.value })}
              placeholder="e.g., Header section, Navigation area"
            />
          </div>
        </div>
      )}

      {/* Points summary (edit mode only) */}
      {mode === "edit" && sourceTags.length > 0 && (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          <strong>{sourceTags.length} point{sourceTags.length !== 1 ? "s" : ""}</strong> placed. 
          Click a point to edit or delete it.
        </div>
      )}
    </div>
  );
}

export function gradeTagMatching(
  connections: StudentConnection[],
  zones: TargetZone[]
): { correct: number; total: number; details: Array<{ tagId: string; correct: boolean }> } {
  const details: Array<{ tagId: string; correct: boolean }> = [];
  let correct = 0;
  const total = zones.filter(z => z.correctTagId).length;

  for (const zone of zones) {
    if (!zone.correctTagId) continue;
    
    const connection = connections.find(c => c.tagId === zone.correctTagId);
    const isCorrect = connection !== undefined &&
      connection.endX >= zone.x && connection.endX <= zone.x + zone.width &&
      connection.endY >= zone.y && connection.endY <= zone.y + zone.height;
    
    details.push({ tagId: zone.correctTagId, correct: isCorrect });
    if (isCorrect) correct++;
  }

  return { correct, total, details };
}
