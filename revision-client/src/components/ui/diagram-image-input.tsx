import { useRef, useCallback } from "react";
import { Upload, Download, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiagramImageInputProps {
  value: string;
  onChange: (value: string) => void;
  startingImageUrl?: string;
  placeholder?: string;
  hint?: string;
}

const DIAGRAM_HINTS: Record<string, string> = {
  drawing: "Create your diagram in another application (e.g. Google Slides, draw.io, or paper), take a screenshot, then paste it below.",
  "erd-annotation": "Draw your Entity-Relationship Diagram in another application, screenshot it, then paste it below.",
  "nav-structure": "Draw your navigation structure diagram in another application, screenshot it, then paste it below.",
  "nav-structure-higher": "Draw your navigation structure diagram in another application, screenshot it, then paste it below.",
  "structure-dataflow": "Draw your structure/data-flow diagram in another application, screenshot it, then paste it below.",
  "form-wireframe": "Design your form wireframe in another application, screenshot it, then paste it below.",
  "webpage-wireframe": "Design your webpage wireframe in another application, screenshot it, then paste it below.",
  "structure-diagram": "Draw your structure diagram in another application, screenshot it, then paste it below.",
};

export function DiagramImageInput({ value, onChange, startingImageUrl, placeholder, hint }: DiagramImageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteZoneRef = useRef<HTMLDivElement>(null);

  const handleImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) onChange(result);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageFile(file);
        break;
      }
    }
  }, [handleImageFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = "";
  };

  const handleDownloadStarting = () => {
    if (!startingImageUrl) return;
    const a = document.createElement("a");
    a.href = startingImageUrl;
    a.download = "starting-diagram.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const hintText = hint || placeholder;

  return (
    <div className="space-y-3 mt-4">
      {startingImageUrl && (
        <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Starting Diagram</span>
            <Button size="sm" variant="outline" onClick={handleDownloadStarting} className="h-7 text-xs">
              <Download className="h-3 w-3 mr-1" /> Download
            </Button>
          </div>
          <img src={startingImageUrl} alt="Starting diagram" className="max-w-full rounded border border-blue-200 dark:border-blue-700" />
        </div>
      )}

      {hintText && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2">
          {hintText}
        </p>
      )}

      {value ? (
        <div className="relative inline-block w-full">
          <img
            src={value}
            alt="Your diagram"
            className="max-w-full rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm"
          />
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2 h-7 w-7 p-0"
            onClick={() => onChange("")}
            title="Remove image"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          ref={pasteZoneRef}
          onPaste={handlePaste}
          tabIndex={0}
          className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-8 text-center cursor-pointer hover:border-red-400 dark:hover:border-red-500 focus:outline-none focus:border-red-500 dark:focus:border-red-400 transition-colors"
          onClick={() => pasteZoneRef.current?.focus()}
        >
          <Image className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            Paste your diagram here
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-4">
            Click this area, then press <kbd className="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-mono">Ctrl+V</kbd> to paste your screenshot
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            <Upload className="h-3 w-3 mr-1.5" /> Upload Image File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
}

export { DIAGRAM_HINTS };
