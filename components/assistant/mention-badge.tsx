"use client";

import { Database, Bot, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type MentionType } from "./mention-dropdown";

interface MentionBadgeProps {
  mention: {
    id: string;
    type: MentionType;
    name: string;
  };
  onRemove?: () => void;
}

export function MentionBadge({ mention, onRemove }: MentionBadgeProps) {
  const isVault = mention.type === "vault";
  const Icon = isVault ? Database : Bot;

  return (
    <Badge
      variant="secondary"
      className={`gap-1 pr-1 ${
        isVault
          ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
          : "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
      }`}
    >
      <Icon className="h-3 w-3" />
      <span className="max-w-[100px] truncate">{mention.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}
