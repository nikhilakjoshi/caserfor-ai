"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: string;
  state: "pending" | "result";
}

interface ToolCallDisplayProps {
  toolInvocations: ToolInvocation[];
}

export function ToolCallDisplay({ toolInvocations }: ToolCallDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (toolInvocations.length === 0) return null;

  // Filter to only agent tool calls
  const agentCalls = toolInvocations.filter((t) =>
    t.toolName.startsWith("agent_"),
  );
  if (agentCalls.length === 0) return null;

  return (
    <div className="my-2 border rounded bg-muted/30 text-sm">
      <Button
        variant="ghost"
        size="sm"
        className="w-full flex items-center justify-between px-3 py-2 h-auto"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <Bot className="h-3.5 w-3.5" />
          <span>
            {agentCalls.length} agent{agentCalls.length !== 1 ? "s" : ""}{" "}
            consulted
          </span>
        </span>
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {agentCalls.map((call) => {
            const agentName = call.toolName
              .replace("agent_", "")
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            const query =
              typeof call.args === "object" &&
              call.args !== null &&
              "query" in call.args
                ? String(call.args.query)
                : "";

            return (
              <div
                key={call.toolCallId}
                className="border rounded bg-background p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="font-medium">{agentName}</span>
                  {call.state === "pending" && (
                    <span className="text-xs text-muted-foreground">
                      (thinking...)
                    </span>
                  )}
                </div>

                {query && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Query:</p>
                    <p className="text-sm bg-muted/50 rounded px-2 py-1.5">
                      {query}
                    </p>
                  </div>
                )}

                {call.state === "result" && call.result && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Response:
                    </p>
                    <p className="text-sm bg-muted/50 rounded px-2 py-1.5 whitespace-pre-wrap">
                      {call.result.length > 500
                        ? call.result.substring(0, 500) + "..."
                        : call.result}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
