import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const isInternalUpdate = useRef(false);
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '',
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      onChange(editor.getHTML());
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 0);
    },
    editorProps: {
      attributes: {
        class: 'rich-text-content max-w-none focus:outline-none min-h-[80px] p-3',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex gap-1 p-1 border-b bg-neutral-50 dark:bg-neutral-900">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
          className="h-7 w-7 p-0"
        >
          <Bold className="w-3 h-3" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
          }}
          className="h-7 w-7 p-0"
        >
          <Italic className="w-3 h-3" />
        </Button>
        <div className="w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
          }}
          className="h-7 w-7 p-0"
        >
          <List className="w-3 h-3" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
          }}
          className="h-7 w-7 p-0"
        >
          <ListOrdered className="w-3 h-3" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
