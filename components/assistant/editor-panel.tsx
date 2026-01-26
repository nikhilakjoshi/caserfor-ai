"use client";

import { useState } from "react";
import {
  ChevronDown,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentEditor } from "@/components/editor/document-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EditorPanelProps {
  content: string;
  onChange: (content: string) => void;
  isStreaming?: boolean;
  version?: number;
  onVersionChange?: (version: number) => void;
  versions?: number[];
}

export function EditorPanel({
  content,
  onChange,
  isStreaming = false,
  version = 1,
  onVersionChange,
  versions = [1],
}: EditorPanelProps) {
  const [showEdits, setShowEdits] = useState(false);

  const handleExport = (format: "pdf" | "docx" | "txt") => {
    // TODO: implement export
    console.log("Export as:", format);
  };

  const handleShowSources = () => {
    // TODO: implement sources panel
    console.log("Show sources");
  };

  return (
    <div className="flex flex-col h-full border-l">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Draft</span>
          {isStreaming && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Generating...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Version dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                Version {version}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {versions.map((v) => (
                <DropdownMenuItem
                  key={v}
                  onClick={() => onVersionChange?.(v)}
                  className={v === version ? "bg-muted" : ""}
                >
                  Version {v}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sources button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={handleShowSources}
          >
            <FileText className="h-3.5 w-3.5" />
            Sources
          </Button>

          {/* Export button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="h-8 gap-1">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("docx")}>
                Export as DOCX
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("txt")}>
                Export as Text
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Show edits toggle */}
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-b bg-muted/30">
        <Switch
          id="show-edits"
          checked={showEdits}
          onCheckedChange={setShowEdits}
          className="h-4 w-7"
        />
        <Label
          htmlFor="show-edits"
          className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer"
        >
          <Eye className="h-3 w-3" />
          Show edits
        </Label>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-4">
        <DocumentEditor
          content={content}
          onChange={onChange}
          placeholder="Your document will appear here..."
          className="min-h-full"
        />
      </div>
    </div>
  );
}
