"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  KeyboardEvent,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import { MentionDropdown, type Mention as MentionData, type MentionDropdownRef } from "./mention-dropdown";
import { cn } from "@/lib/utils";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  mentions: MentionData[];
  onMentionsChange: (mentions: MentionData[]) => void;
  placeholder?: string;
  disabled?: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  className?: string;
}

export interface MentionInputRef {
  clearContent: () => void;
  focus: () => void;
}

export const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(
  function MentionInput(
    {
      value,
      onChange,
      mentions,
      onMentionsChange,
      placeholder = "Ask anything. Type @ to mention vaults or agents.",
      disabled = false,
      onKeyDown,
      className,
    },
    ref
  ) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
    const [mentionQuery, setMentionQuery] = useState("");
    const suggestionPropsRef = useRef<{
      command: (attrs: { id: string; label: string; type: string }) => void;
    } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<MentionDropdownRef>(null);

    // Extract mentions from editor content
    const extractMentions = useCallback(
      (editor: ReturnType<typeof useEditor>) => {
        if (!editor) return [];
        const mentions: MentionData[] = [];
        editor.state.doc.descendants((node) => {
          if (node.type.name === "mention") {
            mentions.push({
              id: node.attrs.id,
              type: node.attrs.type as "vault" | "agent",
              name: node.attrs.label,
            });
          }
        });
        return mentions;
      },
      []
    );

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: false,
          codeBlock: false,
          blockquote: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          horizontalRule: false,
        }),
        Placeholder.configure({
          placeholder,
        }),
        Mention.extend({
          addAttributes() {
            return {
              ...this.parent?.(),
              type: {
                default: "vault",
                parseHTML: (element) => element.getAttribute("data-type"),
                renderHTML: (attributes) => ({
                  "data-type": attributes.type,
                }),
              },
            };
          },
        }).configure({
          HTMLAttributes: {
            class: "mention",
          },
          suggestion: {
            char: "@",
            allowSpaces: false,
            items: ({ query }) => {
              setMentionQuery(query);
              return [];
            },
            render: () => ({
              onStart: (props) => {
                suggestionPropsRef.current = {
                  command: props.command,
                };
                // Calculate position from the decorator
                const rect = props.decorationNode?.getBoundingClientRect();
                if (rect) {
                  setDropdownPosition({
                    x: rect.left,
                    y: rect.bottom + 4,
                  });
                }
                setDropdownOpen(true);
              },
              onUpdate: (props) => {
                suggestionPropsRef.current = {
                  command: props.command,
                };
                const rect = props.decorationNode?.getBoundingClientRect();
                if (rect) {
                  setDropdownPosition({
                    x: rect.left,
                    y: rect.bottom + 4,
                  });
                }
              },
              onKeyDown: ({ event }) => {
                if (event.key === "Escape") {
                  setDropdownOpen(false);
                  return true;
                }
                if (event.key === "ArrowUp") {
                  dropdownRef.current?.moveUp();
                  return true;
                }
                if (event.key === "ArrowDown") {
                  dropdownRef.current?.moveDown();
                  return true;
                }
                if (event.key === "Enter") {
                  return dropdownRef.current?.selectCurrent() ?? false;
                }
                return false;
              },
              onExit: () => {
                setDropdownOpen(false);
                suggestionPropsRef.current = null;
              },
            }),
          },
        }),
      ],
      content: "",
      editable: !disabled,
      editorProps: {
        attributes: {
          class: cn(
            "min-h-[80px] w-full bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          ),
        },
        handleKeyDown: (view, event) => {
          // Handle Ctrl+Enter or Cmd+Enter to submit
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            // Create a synthetic keyboard event for the parent
            const syntheticEvent = {
              key: event.key,
              metaKey: event.metaKey,
              ctrlKey: event.ctrlKey,
              preventDefault: () => event.preventDefault(),
            } as KeyboardEvent<HTMLDivElement>;
            onKeyDown?.(syntheticEvent);
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        // Get plain text for the value prop
        const text = editor.getText();
        onChange(text);

        // Extract and sync mentions
        const currentMentions = extractMentions(editor);
        // Only update if mentions changed
        const currentIds = currentMentions.map((m) => `${m.type}:${m.id}`).sort();
        const prevIds = mentions.map((m) => `${m.type}:${m.id}`).sort();
        if (currentIds.join(",") !== prevIds.join(",")) {
          onMentionsChange(currentMentions);
        }
      },
    });

    // Sync disabled state
    useEffect(() => {
      if (editor) {
        editor.setEditable(!disabled);
      }
    }, [editor, disabled]);

    // Handle external value changes (e.g., clearing)
    useEffect(() => {
      if (editor && value === "" && editor.getText() !== "") {
        editor.commands.clearContent();
      }
    }, [editor, value]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      clearContent: () => {
        editor?.commands.clearContent();
      },
      focus: () => {
        editor?.commands.focus();
      },
    }));

    // Handle mention selection from dropdown
    const handleMentionSelect = useCallback(
      (mention: MentionData) => {
        if (suggestionPropsRef.current) {
          suggestionPropsRef.current.command({
            id: mention.id,
            label: mention.name,
            type: mention.type,
          });
        }
        setDropdownOpen(false);
      },
      []
    );

    return (
      <div ref={containerRef} className="relative max-h-[40vh] overflow-y-auto">
        <EditorContent editor={editor} />
        <MentionDropdown
          ref={dropdownRef}
          open={dropdownOpen}
          onOpenChange={setDropdownOpen}
          position={dropdownPosition}
          searchQuery={mentionQuery}
          onSelect={handleMentionSelect}
        />
      </div>
    );
  }
);
