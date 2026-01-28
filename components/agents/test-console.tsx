"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, RotateCcw, Bot, User } from "lucide-react";
import Markdown from "react-markdown";

interface TestConsoleProps {
  instruction: string;
  disabled?: boolean;
}

// Wrapper that uses key to reset inner component when instruction changes
export function TestConsole(props: TestConsoleProps) {
  // Use instruction as key to force remount on change, resetting all state
  return <TestConsoleInner key={props.instruction} {...props} />;
}

function TestConsoleInner({
  instruction,
  disabled = false,
}: TestConsoleProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create transport with current instruction
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agents/test",
        body: () => ({ instruction }),
      }),
    [instruction],
  );
  const { messages, setMessages, sendMessage, status } = useChat({ transport });

  const isStreaming = status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || disabled) return;
    sendMessage({ text: trimmed });
    setInput("");
  }, [input, isStreaming, disabled, sendMessage]);

  const handleReset = useCallback(() => {
    setMessages([]);
    setInput("");
  }, [setMessages]);

  const getMessageText = (msg: (typeof messages)[number]) => {
    return msg.parts
      .filter(
        (p): p is Extract<typeof p, { type: "text" }> => p.type === "text",
      )
      .map((p) => p.text)
      .join("");
  };

  return (
    <div className="flex flex-col h-full border rounded bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium text-muted-foreground">
          Test Console
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={handleReset}
          disabled={messages.length === 0 || isStreaming}
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Send a message to test your agent</p>
          </div>
        )}
        {messages.map((msg) => {
          const text = getMessageText(msg);
          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 mt-0.5">
                  <div className="rounded-md bg-muted p-1.5">
                    <Bot className="h-3 w-3" />
                  </div>
                </div>
              )}
              <div
                className={`max-w-[80%] rounded px-3 py-2 text-sm whitespace-pre-wrap markdown-body ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50"
                }`}
              >
                {(text && <Markdown>{text}</Markdown>) ||
                  (isStreaming && msg.role === "assistant" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null)}
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 mt-0.5">
                  <div className="rounded-md bg-primary/10 p-1.5">
                    <User className="h-3 w-3" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-2">
        <div className="flex gap-2">
          <Textarea
            placeholder={
              disabled
                ? "Fill in all required fields to test"
                : "Type a test message..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[40px] max-h-[100px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isStreaming || disabled}
          />
          <Button
            size="sm"
            className="h-[40px] px-3"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || disabled}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
