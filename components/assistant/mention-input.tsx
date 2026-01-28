"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { MentionDropdown, type Mention } from "./mention-dropdown";
import { MentionBadge } from "./mention-badge";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  mentions: Mention[];
  onMentionsChange: (mentions: Mention[]) => void;
  placeholder?: string;
  disabled?: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
}

export function MentionInput({
  value,
  onChange,
  mentions,
  onMentionsChange,
  placeholder = "Ask anything. Type @ to mention vaults or agents.",
  disabled = false,
  onKeyDown,
  className,
}: MentionInputProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart;
      onChange(newValue);

      // Detect @ pattern before cursor
      const textBeforeCursor = newValue.slice(0, cursorPos);
      const atMatch = textBeforeCursor.match(/@(\w*)$/);

      if (atMatch) {
        const matchIndex = textBeforeCursor.lastIndexOf("@");
        setMentionStartIndex(matchIndex);
        setMentionQuery(atMatch[1] || "");

        // Calculate dropdown position
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect();
          // Position below the textarea, offset by approximate cursor position
          const lineHeight = 20;
          const lines = textBeforeCursor.split("\n").length;
          setDropdownPosition({
            x: rect.left + 10,
            y: rect.top + lines * lineHeight + 24,
          });
        }

        setDropdownOpen(true);
      } else {
        setDropdownOpen(false);
        setMentionStartIndex(null);
        setMentionQuery("");
      }
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (mention: Mention) => {
      if (mentionStartIndex === null) return;

      // Replace @query with @Name and add to mentions
      const before = value.slice(0, mentionStartIndex);
      const cursorPos = textareaRef.current?.selectionStart || value.length;
      const after = value.slice(cursorPos);
      const newValue = `${before}@${mention.name} ${after}`;

      onChange(newValue);

      // Add mention if not already present
      if (!mentions.find((m) => m.id === mention.id && m.type === mention.type)) {
        onMentionsChange([...mentions, mention]);
      }

      setDropdownOpen(false);
      setMentionStartIndex(null);
      setMentionQuery("");

      // Focus back to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = before.length + mention.name.length + 2; // +2 for @ and space
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [value, onChange, mentions, onMentionsChange, mentionStartIndex]
  );

  const handleRemoveMention = useCallback(
    (mentionToRemove: Mention) => {
      onMentionsChange(
        mentions.filter(
          (m) =>
            !(m.id === mentionToRemove.id && m.type === mentionToRemove.type)
        )
      );

      // Also remove from text if present
      const regex = new RegExp(`@${mentionToRemove.name}\\s?`, "g");
      onChange(value.replace(regex, ""));
    },
    [mentions, onMentionsChange, value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape" && dropdownOpen) {
        e.preventDefault();
        setDropdownOpen(false);
        return;
      }
      onKeyDown?.(e);
    },
    [dropdownOpen, onKeyDown]
  );

  return (
    <div className="relative">
      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {mentions.map((mention) => (
            <MentionBadge
              key={`${mention.type}-${mention.id}`}
              mention={mention}
              onRemove={() => handleRemoveMention(mention)}
            />
          ))}
        </div>
      )}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        rows={3}
      />
      <MentionDropdown
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
        position={dropdownPosition}
        searchQuery={mentionQuery}
        onSelect={handleSelect}
      />
    </div>
  );
}
