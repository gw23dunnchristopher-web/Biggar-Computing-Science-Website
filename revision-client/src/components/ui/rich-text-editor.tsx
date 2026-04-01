import { useRef, useState } from "react";
import { Button } from "./button";
import { Bold, Italic, Code, List, Type, IndentIncrease, IndentDecrease } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const INDENT_SIZE = 2;
const BULLET_CHAR = "• ";

function getBulletInfo(line: string): { isBullet: boolean; indent: number; content: string } {
  const match = line.match(/^(\s*)(•\s?)(.*)/);
  if (match) {
    return { isBullet: true, indent: match[1].length, content: match[3] };
  }
  return { isBullet: false, indent: 0, content: line };
}

export function RichTextEditor({ value, onChange, placeholder, rows = 3, className = "" }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

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
  const applyCourier = () => wrapSelection("{{courier}}", "{{/courier}}");

  const applyBulletList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = selectionStart;
    const end = selectionEnd;
    const text = value;

    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = text.indexOf('\n', end);
    const selectedLines = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);

    const lines = selectedLines.split('\n');
    const allBulleted = lines.every(l => getBulletInfo(l).isBullet);

    const transformed = lines.map(line => {
      const info = getBulletInfo(line);
      if (allBulleted) {
        return info.isBullet ? " ".repeat(info.indent) + info.content : line;
      } else {
        return info.isBullet ? line : BULLET_CHAR + line;
      }
    }).join('\n');

    const newText = text.slice(0, lineStart) + transformed + text.slice(lineEnd === -1 ? text.length : lineEnd);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + transformed.length);
    }, 0);
  };

  const changeIndent = (direction: 1 | -1) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value;

    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = text.indexOf('\n', end);
    const selectedLines = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);

    const lines = selectedLines.split('\n');
    const transformed = lines.map(line => {
      const info = getBulletInfo(line);
      if (!info.isBullet) return line;
      if (direction === 1) {
        return " ".repeat(info.indent + INDENT_SIZE) + BULLET_CHAR + info.content;
      } else {
        const newIndent = Math.max(0, info.indent - INDENT_SIZE);
        return " ".repeat(newIndent) + BULLET_CHAR + info.content;
      }
    }).join('\n');

    const newText = text.slice(0, lineStart) + transformed + text.slice(lineEnd === -1 ? text.length : lineEnd);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      const cursorOffset = transformed.length - selectedLines.length;
      textarea.setSelectionRange(start + cursorOffset, end + cursorOffset);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (e.key === "Enter") {
      const cursorPos = textarea.selectionStart;
      const text = value;
      const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
      const currentLine = text.slice(lineStart, cursorPos);
      const info = getBulletInfo(currentLine);

      if (info.isBullet) {
        e.preventDefault();
        if (info.content.trim() === "") {
          if (info.indent > 0) {
            const newIndent = Math.max(0, info.indent - INDENT_SIZE);
            const newLine = " ".repeat(newIndent) + BULLET_CHAR;
            const newText = text.slice(0, lineStart) + newLine + text.slice(cursorPos);
            onChange(newText);
            setTimeout(() => {
              textarea.focus();
              const pos = lineStart + newLine.length;
              textarea.setSelectionRange(pos, pos);
            }, 0);
          } else {
            const newText = text.slice(0, lineStart) + text.slice(cursorPos);
            onChange(newText);
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(lineStart, lineStart);
            }, 0);
          }
        } else {
          const prefix = " ".repeat(info.indent) + BULLET_CHAR;
          const newText = text.slice(0, cursorPos) + "\n" + prefix + text.slice(cursorPos);
          onChange(newText);
          setTimeout(() => {
            textarea.focus();
            const pos = cursorPos + 1 + prefix.length;
            textarea.setSelectionRange(pos, pos);
          }, 0);
        }
      }
    }

    if (e.key === "Tab") {
      const cursorPos = textarea.selectionStart;
      const text = value;
      const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
      const lineEnd = text.indexOf('\n', cursorPos);
      const currentLine = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
      const info = getBulletInfo(currentLine);

      if (info.isBullet) {
        e.preventDefault();
        if (e.shiftKey) {
          changeIndent(-1);
        } else {
          changeIndent(1);
        }
      }
    }
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
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-0.5" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-1.5 p-0 text-xs font-mono"
          onMouseDown={(e) => handleButtonMouseDown(e, applyCourier)}
          title="Courier New Font"
        >
          <Type className="h-4 w-4 mr-0.5" />
          <span className="text-[10px]">CN</span>
        </Button>
        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-0.5" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onMouseDown={(e) => handleButtonMouseDown(e, applyBulletList)}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onMouseDown={(e) => handleButtonMouseDown(e, () => changeIndent(1))}
          title="Increase Indent (Tab)"
        >
          <IndentIncrease className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onMouseDown={(e) => handleButtonMouseDown(e, () => changeIndent(-1))}
          title="Decrease Indent (Shift+Tab)"
        >
          <IndentDecrease className="h-4 w-4" />
        </Button>
        <span className="text-xs text-neutral-400 ml-2">
          Tab / Shift+Tab to indent bullets
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelect}
        onKeyUp={handleSelect}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-sm resize-none focus:outline-none bg-white dark:bg-neutral-950 dark:text-neutral-100"
      />
    </div>
  );
}

interface BulletNode {
  content: string;
  children: BulletNode[];
}

function buildBulletTree(lines: { indent: number; content: string }[]): BulletNode[] {
  const roots: BulletNode[] = [];
  const stack: { node: BulletNode; indent: number }[] = [];

  for (const line of lines) {
    const node: BulletNode = { content: line.content, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].indent >= line.indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ node, indent: line.indent });
  }

  return roots;
}

export function RichTextDisplay({ content, className = "" }: { content: string; className?: string }) {
  if (!content) return null;

  const parseContent = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const courierMatch = remaining.match(/^\{\{courier\}\}(.+?)\{\{\/courier\}\}/s);
      if (courierMatch) {
        parts.push(
          <span key={key++} style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            {parseContent(courierMatch[1])}
          </span>
        );
        remaining = remaining.slice(courierMatch[0].length);
        continue;
      }

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
          <code key={key++} className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      const nextSpecial = remaining.search(/\{\{courier\}\}|\*\*|\*|`/);
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

  let keyCounter = 0;

  const renderBulletTree = (nodes: BulletNode[], depth: number): React.ReactNode => {
    const listStyle = depth === 0 ? "disc" : depth === 1 ? "circle" : "square";
    return (
      <ul key={keyCounter++} className="mb-2 space-y-0.5" style={{ listStyleType: listStyle, paddingLeft: depth === 0 ? "1.5rem" : "1.25rem" }}>
        {nodes.map((node) => (
          <li key={keyCounter++}>
            {parseContent(node.content)}
            {node.children.length > 0 && renderBulletTree(node.children, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  const lines = content.split('\n');

  return (
    <div className={className}>
      {(() => {
        const elements: React.ReactNode[] = [];
        let bulletGroup: { indent: number; content: string }[] = [];

        const flushBullets = () => {
          if (bulletGroup.length > 0) {
            const tree = buildBulletTree(bulletGroup);
            elements.push(renderBulletTree(tree, 0));
            bulletGroup = [];
          }
        };

        lines.forEach((line) => {
          const info = getBulletInfo(line);
          if (info.isBullet) {
            bulletGroup.push({ indent: info.indent, content: info.content });
          } else {
            flushBullets();
            elements.push(
              <p key={keyCounter++} className="mb-2">
                {line ? parseContent(line) : <br />}
              </p>
            );
          }
        });

        flushBullets();
        return elements;
      })()}
    </div>
  );
}
