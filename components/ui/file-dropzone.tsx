"use client"

import { useDropzone, type DropzoneOptions } from "react-dropzone"
import { Upload, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FileDropzoneProps {
  onDrop: (files: File[]) => void
  accept?: DropzoneOptions["accept"]
  maxSize?: number
  maxFiles?: number
  multiple?: boolean
  disabled?: boolean
  loading?: boolean
  className?: string
  hint?: string
  activeText?: string
  loadingText?: string
  idleText?: string
}

const DEFAULT_ACCEPT: DropzoneOptions["accept"] = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
}

export function FileDropzone({
  onDrop,
  accept = DEFAULT_ACCEPT,
  maxSize,
  maxFiles,
  multiple = true,
  disabled = false,
  loading = false,
  className,
  hint = "PDF, DOC, DOCX, TXT (max 25MB)",
  activeText = "Drop files here...",
  loadingText = "Uploading...",
  idleText = "Drop files here or click to browse",
}: FileDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    multiple,
    disabled: disabled || loading,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center gap-2 border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <input {...getInputProps()} />
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : (
        <Upload className="h-8 w-8 text-muted-foreground" />
      )}
      <div className="text-center">
        <p className="text-sm font-medium">
          {loading ? loadingText : isDragActive ? activeText : idleText}
        </p>
        {hint && (
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        )}
      </div>
    </div>
  )
}
