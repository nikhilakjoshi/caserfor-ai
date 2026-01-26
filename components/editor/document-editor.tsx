"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { useEffect, useRef, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  isStreaming?: boolean;
}

export function DocumentEditor({
  content = "",
  onChange,
  placeholder = "Start typing...",
  editable = true,
  className,
  isStreaming = false,
}: DocumentEditorProps) {
  // Track previous content length to detect new streamed content
  const prevContentLengthRef = useRef(0);
  const isStreamingRef = useRef(isStreaming);
  const wasStreamingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      // Only emit changes when not streaming (user edits)
      if (!isStreamingRef.current) {
        onChange?.(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3 dark:prose-invert",
      },
    },
  });

  // Keep refs in sync
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Convert plain text to simple HTML paragraphs
  const textToHtml = useCallback((text: string): string => {
    if (!text) return "";
    // Split by double newlines for paragraphs, preserve single newlines as <br>
    return text
      .split(/\n\n+/)
      .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
      .join("");
  }, []);

  // Handle streaming content updates
  useEffect(() => {
    if (!editor) return;

    if (isStreaming) {
      wasStreamingRef.current = true;

      // During streaming, append only new content to avoid cursor jumps
      const currentLength = content.length;
      const prevLength = prevContentLengthRef.current;

      if (currentLength > prevLength) {
        // Get the new content that was added
        const newContent = content.slice(prevLength);

        // Move cursor to end and insert new text
        editor
          .chain()
          .focus("end")
          .insertContent(newContent)
          .run();
      } else if (currentLength === 0 && prevLength > 0) {
        // Content was cleared, reset editor
        editor.commands.clearContent();
      }

      prevContentLengthRef.current = currentLength;
    } else {
      // Streaming ended
      if (wasStreamingRef.current) {
        // Streaming just finished - convert to proper HTML format
        wasStreamingRef.current = false;
        prevContentLengthRef.current = 0;

        // Final content sync with HTML conversion
        const htmlContent = textToHtml(content);
        editor.commands.setContent(htmlContent);
      } else if (content !== editor.getText()) {
        // Regular content update (not from streaming)
        // Check if content looks like HTML or plain text
        const isHtml = content.startsWith("<") || content.includes("</");
        if (isHtml) {
          editor.commands.setContent(content);
        } else {
          editor.commands.setContent(textToHtml(content));
        }
        prevContentLengthRef.current = content.length;
      }
    }
  }, [content, editor, isStreaming, textToHtml]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "border border-border rounded bg-background overflow-hidden",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30 flex-wrap">
        {/* Text formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bold") && "bg-muted"
          )}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("italic") && "bg-muted"
          )}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("underline") && "bg-muted"
          )}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("strike") && "bg-muted"
          )}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bulletList") && "bg-muted"
          )}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("orderedList") && "bg-muted"
          )}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text alignment */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: "left" }) && "bg-muted"
          )}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: "center" }) && "bg-muted"
          )}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: "right" }) && "bg-muted"
          )}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("link") && "bg-muted"
          )}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}

export { useEditor };
