import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Clipboard, Copy, Image as ImageIcon, Trash2, Upload, Check } from "lucide-react";

interface ImagePasteInputProps {
  value: string;
  onChange: (val: string) => void;
  startingImage?: string;
  disabled?: boolean;
  testId?: string;
  instructions?: string;
}

const MAX_BYTES = 8 * 1024 * 1024;

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function downscaleIfNeeded(dataUrl: string, maxDim = 1800): Promise<string> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image load failed"));
      img.src = dataUrl;
    });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return dataUrl;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    if (scale === 1 && dataUrl.length < MAX_BYTES) return dataUrl;
    const targetW = Math.round(w * scale);
    const targetH = Math.round(h * scale);
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return dataUrl;
  }
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [header, data] = dataUrl.split(",");
    if (!header || !data) return null;
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bin = atob(data);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  } catch {
    return null;
  }
}

export function ImagePasteInput({
  value,
  onChange,
  startingImage,
  disabled,
  testId,
  instructions,
}: ImagePasteInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pasteFocused, setPasteFocused] = useState(false);

  const handleImageData = useCallback(async (raw: string) => {
    setError(null);
    setBusy(true);
    try {
      const finalUrl = await downscaleIfNeeded(raw);
      onChange(finalUrl);
    } catch (e) {
      setError("Could not process the image. Try again or use the file picker.");
    } finally {
      setBusy(false);
    }
  }, [onChange]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, etc).");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    await handleImageData(dataUrl);
  }, [handleImageData]);

  const onPaste = useCallback(async (e: ClipboardEvent | React.ClipboardEvent) => {
    if (disabled) return;
    const items = (e as ClipboardEvent).clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleFile(file);
        }
        return;
      }
    }
  }, [disabled, handleFile]);

  useEffect(() => {
    if (!pasteFocused) return;
    const handler = (e: ClipboardEvent) => { void onPaste(e); };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [pasteFocused, onPaste]);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  }, [disabled, handleFile]);

  const tryReadFromClipboard = useCallback(async () => {
    setError(null);
    if (!navigator.clipboard || !(navigator.clipboard as any).read) {
      setError("Your browser does not support reading the clipboard. Press Ctrl+V instead.");
      return;
    }
    try {
      const items = await (navigator.clipboard as any).read();
      for (const item of items) {
        const imgType = item.types.find((t: string) => t.startsWith("image/"));
        if (imgType) {
          const blob: Blob = await item.getType(imgType);
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
          await handleImageData(dataUrl);
          return;
        }
      }
      setError("No image found on the clipboard. Copy an image, then try again.");
    } catch {
      setError("Could not read the clipboard. Press Ctrl+V instead.");
    }
  }, [handleImageData]);

  const copyStartingImage = useCallback(async () => {
    if (!startingImage) return;
    setError(null);
    try {
      let blob: Blob | null = null;
      if (startingImage.startsWith("data:")) {
        blob = dataUrlToBlob(startingImage);
      } else {
        const resp = await fetch(startingImage);
        blob = await resp.blob();
      }
      if (!blob) throw new Error("no blob");
      let copyBlob = blob;
      if (blob.type !== "image/png") {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("img load fail"));
          img.src = url;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          copyBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png")!);
        }
        URL.revokeObjectURL(url);
      }
      const ClipboardItemCtor: any = (window as any).ClipboardItem;
      if (!ClipboardItemCtor || !navigator.clipboard?.write) {
        setError("Your browser cannot copy images. Right-click the starting image and 'Copy image'.");
        return;
      }
      await navigator.clipboard.write([new ClipboardItemCtor({ "image/png": copyBlob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the starting image. Right-click it and choose 'Copy image'.");
    }
  }, [startingImage]);

  const clear = useCallback(() => {
    onChange("");
    setError(null);
  }, [onChange]);

  return (
    <div className="space-y-3 mt-4" data-testid={testId}>
      {instructions && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{instructions}</p>
      )}

      {startingImage && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Starting image
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={copyStartingImage}
              data-testid="button-copy-starting-image"
              className="gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy starting image"}
            </Button>
          </div>
          <img
            src={startingImage}
            alt="Starting diagram"
            className="max-h-72 w-auto rounded border border-neutral-200 dark:border-neutral-800 bg-white"
          />
          <p className="text-xs text-neutral-500">
            Copy this image, paste it into your drawing app, edit your answer, then paste your finished diagram below.
          </p>
        </div>
      )}

      {value ? (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Your answer
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || busy}
                data-testid="button-replace-image"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={clear}
                disabled={disabled || busy}
                data-testid="button-clear-image"
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </div>
          <img
            src={value}
            alt="Your pasted answer"
            className="max-h-[600px] w-auto rounded border border-neutral-200 dark:border-neutral-800 bg-white"
          />
        </div>
      ) : (
        <div
          ref={dropRef}
          tabIndex={disabled ? -1 : 0}
          onPaste={onPaste}
          onFocus={() => setPasteFocused(true)}
          onBlur={() => setPasteFocused(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => dropRef.current?.focus()}
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-colors focus:outline-none ${
            pasteFocused
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-blue-400"
          }`}
          data-testid="image-paste-dropzone"
        >
          <ImageIcon className="w-10 h-10 text-neutral-400" />
          <div>
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {pasteFocused ? "Press Ctrl+V (or ⌘+V) to paste your image" : "Click here, then press Ctrl+V to paste"}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              You can also drag &amp; drop an image, or use a button below.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || busy}
              onClick={(e) => { e.stopPropagation(); void tryReadFromClipboard(); }}
              className="gap-2"
              data-testid="button-paste-from-clipboard"
            >
              <Clipboard className="w-4 h-4" />
              Paste from clipboard
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || busy}
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="gap-2"
              data-testid="button-upload-image"
            >
              <Upload className="w-4 h-4" />
              Upload image
            </Button>
          </div>
          {busy && <p className="text-xs text-neutral-500">Processing image…</p>}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await handleFile(file);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        data-testid="input-image-file"
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
