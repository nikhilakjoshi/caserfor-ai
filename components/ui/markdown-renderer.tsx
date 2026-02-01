"use client";

import React from "react";
import Markdown from "markdown-to-jsx";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

// Regex to match [docName, chunk N] citation format
const CITATION_REGEX = /\[([^\]]+?),\s*chunk\s+(\d+)\]/g;

interface CitationBadgeProps {
  documentName: string;
  chunkIndex: number;
  onClick?: (documentName: string, chunkIndex: number) => void;
}

function CitationBadge({
  documentName,
  chunkIndex,
  onClick,
}: CitationBadgeProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary/20 transition-colors cursor-pointer align-baseline"
      onClick={() => onClick?.(documentName, chunkIndex)}
      title={`${documentName}, chunk ${chunkIndex}`}
    >
      <FileText className="h-3 w-3 shrink-0" />
      <span className="truncate max-w-[150px]">{documentName}</span>
      <span className="text-primary/60">#{chunkIndex}</span>
    </button>
  );
}

/**
 * Parses text and replaces [docName, chunk N] patterns with CitationBadge components.
 */
function parseCitations(
  text: string,
  onCitationClick?: (documentName: string, chunkIndex: number) => void,
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(CITATION_REGEX.source, "g");
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <CitationBadge
        key={`citation-${match.index}`}
        documentName={match[1].trim()}
        chunkIndex={parseInt(match[2], 10)}
        onClick={onCitationClick}
      />,
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

/**
 * Recursively processes React children, replacing citation patterns in text nodes.
 */
function processChildren(
  children: React.ReactNode,
  onCitationClick?: (documentName: string, chunkIndex: number) => void,
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      if (CITATION_REGEX.test(child)) {
        return <>{parseCitations(child, onCitationClick)}</>;
      }
      return child;
    }
    if (
      React.isValidElement<{ children?: React.ReactNode }>(child) &&
      child.props.children
    ) {
      return React.cloneElement(
        child,
        {},
        processChildren(child.props.children, onCitationClick),
      );
    }
    return child;
  });
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onCitationClick?: (documentName: string, chunkIndex: number) => void;
}

export function MarkdownRenderer({
  content,
  className,
  onCitationClick,
}: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none markdown-body",
        className,
      )}
    >
      {/* <ReactMarkdown
        components={{
          // Code blocks with syntax highlighting style
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName
            if (isInline) {
              return (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <code
                className={cn(
                  "block bg-muted p-3 rounded text-sm font-mono overflow-x-auto",
                  codeClassName
                )}
                {...props}
              >
                {children}
              </code>
            )
          },
          // Pre wrapper for code blocks
          pre: ({ children }) => (
            <pre className="bg-muted border rounded p-0 overflow-hidden my-3">
              {children}
            </pre>
          ),
          // Tables with proper styling
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border-collapse border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border px-3 py-2 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border px-3 py-2">{children}</td>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
          ),
          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-3 mb-1">{children}</h3>
          ),
          // Paragraphs - with citation parsing
          p: ({ children }) => <p className="my-2">{processChildren(children, onCitationClick)}</p>,
          // List items - with citation parsing
          li: ({ children }) => <li>{processChildren(children, onCitationClick)}</li>,
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-3">
              {children}
            </blockquote>
          ),
          // Links
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-primary underline hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          // Emphasis/Italic
          em: ({ children }) => <em className="italic">{children}</em>,
          // Horizontal rule
          hr: () => <hr className="my-4 border-muted" />,
        }}
      >
        {content}
      </ReactMarkdown> */}
      <Markdown>{content}</Markdown>
    </div>
  );
}

// Helper to strip markdown and get plain text
export function stripMarkdown(markdown: string): string {
  return (
    markdown
      // Remove headers
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/_(.+?)_/g, "$1")
      // Remove inline code
      .replace(/`(.+?)`/g, "$1")
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove links, keep text
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      // Remove images
      .replace(/!\[.*?\]\(.+?\)/g, "")
      // Remove blockquotes
      .replace(/^>\s+/gm, "")
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, "")
      // Remove list markers
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // Clean up extra whitespace
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
