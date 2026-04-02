import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Pencil, Undo, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawingCanvasProps {
  onChange?: (dataUrl: string) => void;
  className?: string;
  disabled?: boolean;
}

export function DrawingCanvas({ onChange, className, disabled }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil");
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set initial white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Handle resizing
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        // Save content
        const content = canvas.toDataURL();
        
        canvas.width = rect.width;
        canvas.height = 400; // Fixed height
        
        // Restore white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Restore content (optional - simplistic approach)
        const img = new Image();
        img.src = content;
        img.onload = () => ctx.drawImage(img, 0, 0);
      }
    };
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
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
    if (!isDrawing || disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    
    ctx.lineWidth = tool === "eraser" ? 20 : lineWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (disabled) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && onChange) {
      onChange(canvas.toDataURL());
    }
  };

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

  const clearCanvas = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (onChange) onChange("");
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {!disabled && (
        <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-t-lg border border-slate-200 dark:border-slate-700 border-b-0">
          <Button
            variant={tool === "pencil" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("pencil")}
            title="Pencil"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === "eraser" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("eraser")}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </Button>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-2" />
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
            title="Color Picker"
          />
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCanvas}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
      <div className={cn("border-2 border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white touch-none", disabled && "opacity-80")}>
        <canvas
          ref={canvasRef}
          className="w-full h-[400px] cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <p className="text-xs text-slate-500 text-center">
        Use your mouse or touch screen to draw your answer
      </p>
    </div>
  );
}
