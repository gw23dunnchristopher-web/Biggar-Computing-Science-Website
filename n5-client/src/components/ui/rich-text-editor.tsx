import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "./button";
import { Bold, Italic, Code, Superscript, AlignLeft, AlignCenter, AlignRight, List } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, rows = 3, className = "" }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  const handleSelect = () => {
    if (textareaRef.current) {
      setSelectionStart(textareaRef.current.selectionStart);
      setSelectionEnd(textareaRef.current.selectionEnd);
    }
  };

  const wrapSelection = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = selectionStart;
    const end = selectionEnd;
    const text = value;
    
    if (start === end) {
      const newText = text.slice(0, start) + prefix + suffix + text.slice(end);
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }, 0);
    } else {
      const selectedText = text.slice(start, end);
      const newText = text.slice(0, start) + prefix + selectedText + suffix + text.slice(end);
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        const newStart = start + prefix.length;
        const newEnd = end + prefix.length;
        textarea.setSelectionRange(newStart, newEnd);
      }, 0);
    }
  };

  const handleButtonMouseDown = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    action();
  };

  const applyBold = () => wrapSelection("**", "**");
  const applyItalic = () => wrapSelection("*", "*");
  const applyMonospace = () => wrapSelection("`", "`");
  const applySuperscript = () => wrapSelection("^", "^");

  const applyAlignment = (align: "left" | "center" | "right") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const lines = value.split('\n');
    const beforeCursor = value.slice(0, selectionStart);
    const lineIndex = beforeCursor.split('\n').length - 1;
    
    const alignmentPrefixes = ["[left]", "[center]", "[right]"];
    let currentLine = lines[lineIndex];
    
    for (const prefix of alignmentPrefixes) {
      if (currentLine.startsWith(prefix)) {
        currentLine = currentLine.slice(prefix.length);
        break;
      }
    }
    
    lines[lineIndex] = align === "left" ? currentLine : `[${align}]${currentLine}`;
    onChange(lines.join('\n'));
  };

  const toggleBullet = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const lines = value.split('\n');
    const beforeCursor = value.slice(0, selectionStart);
    const startLineIndex = beforeCursor.split('\n').length - 1;
    const beforeEnd = value.slice(0, selectionEnd);
    const endLineIndex = beforeEnd.split('\n').length - 1;

    for (let i = startLineIndex; i <= endLineIndex; i++) {
      if (lines[i].startsWith("• ")) {
        lines[i] = lines[i].slice(2);
      } else {
        lines[i] = "• " + lines[i];
      }
    }
    onChange(lines.join('\n'));
  };

  return (
    <div className={`border rounded-md overflow-hidden ${className}`}>
      <div className="flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 border-b flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onMouseDown={(e) => handleButtonMouseDown(e, applyBold)}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onMouseDown={(e) => handleButtonMouseDown(e, applyItalic)}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onMouseDown={(e) => handleButtonMouseDown(e, applyMonospace)}
          title="Courier New / Monospace"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onMouseDown={(e) => handleButtonMouseDown(e, applySuperscript)}
          title="Superscript"
        >
          <Superscript className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onMouseDown={(e) => handleButtonMouseDown(e, toggleBullet)}
          title="Bullet Point"
        >
          <List className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onMouseDown={(e) => handleButtonMouseDown(e, () => applyAlignment("left"))}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onMouseDown={(e) => handleButtonMouseDown(e, () => applyAlignment("center"))}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onMouseDown={(e) => handleButtonMouseDown(e, () => applyAlignment("right"))}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <span className="text-xs text-neutral-400 ml-2">
          Select text then click to format
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelect}
        onKeyUp={handleSelect}
        onClick={handleSelect}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-sm resize-vertical focus:outline-none bg-white dark:bg-neutral-950 dark:text-neutral-100 overflow-hidden"
        style={{ minHeight: "1.5em" }}
      />
    </div>
  );
}

export function RichTextDisplay({ content, className = "" }: { content: string; className?: string }) {
  if (!content) return null;
  
  const parseContent = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;
    
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={key++}>{parseContent(boldMatch[1])}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }
      
      const italicMatch = remaining.match(/^\*([^*]+?)\*/);
      if (italicMatch) {
        parts.push(<em key={key++}>{parseContent(italicMatch[1])}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }
      
      const codeMatch = remaining.match(/^`([^`]+?)`/);
      if (codeMatch) {
        parts.push(
          <code key={key++} className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }
      
      const supMatch = remaining.match(/^\^([^^]+?)\^/);
      if (supMatch) {
        parts.push(<sup key={key++}>{parseContent(supMatch[1])}</sup>);
        remaining = remaining.slice(supMatch[0].length);
        continue;
      }
      
      const nextSpecial = remaining.search(/\*\*|\*|`|\^/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }
    
    return parts;
  };
  
  const lines = content.split('\n');

  const groups: Array<{ type: "text"; line: string; alignment: string } | { type: "bullet"; items: string[] }> = [];
  for (const line of lines) {
    if (line.startsWith("• ")) {
      const last = groups[groups.length - 1];
      if (last && last.type === "bullet") {
        last.items.push(line.slice(2));
      } else {
        groups.push({ type: "bullet", items: [line.slice(2)] });
      }
    } else {
      let alignment = "text-left";
      let lineContent = line;
      if (line.startsWith("[center]")) {
        alignment = "text-center";
        lineContent = line.slice(8);
      } else if (line.startsWith("[right]")) {
        alignment = "text-right";
        lineContent = line.slice(7);
      } else if (line.startsWith("[left]")) {
        lineContent = line.slice(6);
      }
      groups.push({ type: "text", line: lineContent, alignment });
    }
  }

  return (
    <div className={className}>
      {groups.map((group, i) => {
        if (group.type === "bullet") {
          return (
            <ul key={i} className="list-disc pl-5 mb-2 space-y-0.5">
              {group.items.map((item, j) => (
                <li key={j}>{parseContent(item)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className={`${group.alignment} ${i < groups.length - 1 ? "mb-2" : ""}`}>
            {group.line ? parseContent(group.line) : <br />}
          </p>
        );
      })}
    </div>
  );
}
