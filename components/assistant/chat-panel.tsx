"use client";

import { useState } from "react";
import {
  Copy,
  Bookmark,
  Pencil,
  Loader2,
  PenSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatPanelProps {
  query: string;
  completion: string;
  isLoading: boolean;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  onNewThread: () => void;
  inputControls?: React.ReactNode;
  compact?: boolean;
}

export function ChatPanel({
  query,
  completion,
  isLoading,
  onQueryChange,
  onSubmit,
  onNewThread,
  inputControls,
  compact = false,
}: ChatPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuery, setEditedQuery] = useState(query);
  const hasResponse = completion.length > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(query);
  };

  const handleSavePrompt = () => {
    // TODO: wire to /api/prompts POST
    console.log("Save prompt:", query);
  };

  const handleEditQuery = () => {
    setEditedQuery(query);
    setIsEditing(true);
  };

  const handleEditSubmit = () => {
    onQueryChange(editedQuery);
    setIsEditing(false);
    onSubmit();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with New Thread button */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="text-sm font-medium text-muted-foreground">Chat</span>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8"
          onClick={onNewThread}
        >
          <PenSquare className="h-4 w-4" />
          {!compact && "New thread"}
        </Button>
      </div>

      {/* Query display area */}
      {hasResponse && !isEditing && (
        <div className="p-4 border-b space-y-3">
          <div className="p-3 bg-muted/30 rounded">
            <p className="text-sm">{query}</p>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={handleCopy}
            >
              <Copy className="h-3 w-3" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={handleSavePrompt}
            >
              <Bookmark className="h-3 w-3" />
              Save prompt
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={handleEditQuery}
            >
              <Pencil className="h-3 w-3" />
              Edit query
            </Button>
          </div>
        </div>
      )}

      {/* Edit query form */}
      {isEditing && (
        <div className="p-4 border-b space-y-3">
          <Textarea
            value={editedQuery}
            onChange={(e) => setEditedQuery(e.target.value)}
            className="min-h-[80px] text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleEditSubmit}>
              Resubmit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Generation status */}
      {isLoading && (
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Answering</span>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Generating new version...</span>
          </div>
        </div>
      )}

      {/* Completion display (only in chat mode / full width) */}
      {hasResponse && !compact && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap">{completion}</div>
          </div>
        </div>
      )}

      {/* Spacer when in compact mode */}
      {compact && <div className="flex-1" />}

      {/* Chat input at bottom */}
      <div className="mt-auto border-t p-4">
        <div className="border rounded bg-background">
          <Textarea
            placeholder="Follow-up question..."
            value={hasResponse ? "" : query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="min-h-[60px] resize-none text-sm border-0 focus-visible:ring-0 rounded-b-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                onSubmit();
              }
            }}
            disabled={isLoading}
          />
          {inputControls && (
            <div className="flex items-center gap-2 p-2 border-t bg-muted/30">
              {inputControls}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
