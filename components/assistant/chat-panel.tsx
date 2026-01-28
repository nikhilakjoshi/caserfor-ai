"use client";

import { useState } from "react";
import {
  Copy,
  FileText,
  Bookmark,
  Pencil,
  Loader2,
  PenSquare,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownRenderer, stripMarkdown } from "@/components/ui/markdown-renderer";

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
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [promptName, setPromptName] = useState("");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copyTooltip, setCopyTooltip] = useState<"markdown" | "plain" | null>(null);
  const hasResponse = completion.length > 0;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(query);
    setCopyTooltip("markdown");
    setTimeout(() => setCopyTooltip(null), 2000);
  };

  const handleCopyPlainText = () => {
    const plainText = stripMarkdown(query);
    navigator.clipboard.writeText(plainText);
    setCopyTooltip("plain");
    setTimeout(() => setCopyTooltip(null), 2000);
  };

  const handleSavePrompt = () => {
    // Generate a default name from first 30 chars of query
    const defaultName = query.trim().length > 30
      ? query.trim().slice(0, 30) + "..."
      : query.trim() || "My Prompt";
    setPromptName(defaultName);
    setShowSaveDialog(true);
    setSaveSuccess(false);
  };

  const handleConfirmSavePrompt = async () => {
    if (!promptName.trim() || isSavingPrompt) return;

    setIsSavingPrompt(true);
    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: promptName.trim(),
          content: query,
          category: "personal",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save prompt");
      }

      setSaveSuccess(true);
      // Close dialog after brief success indication
      setTimeout(() => {
        setShowSaveDialog(false);
        setPromptName("");
        setSaveSuccess(false);
      }, 1000);
    } catch (error) {
      console.error("Error saving prompt:", error);
    } finally {
      setIsSavingPrompt(false);
    }
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

      {/* Scrollable content area */}
      <ScrollArea className="flex-1">
        {/* Query display area */}
        {hasResponse && !isEditing && (
          <div className="p-4 border-b space-y-3">
            <div className="p-3 bg-muted/30 rounded">
              <MarkdownRenderer content={query} className="text-sm" />
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Tooltip open={copyTooltip === "markdown"}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={handleCopyMarkdown}
                  >
                    <Copy className="h-3 w-3" />
                    Copy Markdown
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copied!</TooltipContent>
              </Tooltip>
              <Tooltip open={copyTooltip === "plain"}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={handleCopyPlainText}
                  >
                    <FileText className="h-3 w-3" />
                    Copy Text
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copied!</TooltipContent>
              </Tooltip>
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
          <div className="p-4">
            <MarkdownRenderer content={completion} />
          </div>
        )}
      </ScrollArea>

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

      {/* Save Prompt Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prompt-name">Prompt Name</Label>
              <Input
                id="prompt-name"
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
                placeholder="Enter a name for this prompt..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleConfirmSavePrompt();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Content Preview</Label>
              <div className="p-3 bg-muted/30 rounded text-sm max-h-32 overflow-y-auto">
                {query}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
              disabled={isSavingPrompt}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSavePrompt}
              disabled={!promptName.trim() || isSavingPrompt}
            >
              {saveSuccess ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Saved
                </>
              ) : isSavingPrompt ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Saving
                </>
              ) : (
                "Save Prompt"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
