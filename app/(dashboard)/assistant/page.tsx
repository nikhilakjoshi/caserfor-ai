"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useCompletion } from "@ai-sdk/react";
import { useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useDropzone } from "react-dropzone";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ChatPanel } from "@/components/assistant/chat-panel";
import { EditorPanel } from "@/components/assistant/editor-panel";
import {
  FileText,
  Table2,
  Folder,
  Paperclip,
  BookOpen,
  Sparkles,
  Check,
  Loader2,
  Star,
  X,
  Upload,
  File,
  Database,
  Wand2,
  Search,
  Plus,
  ChevronLeft,
  HardDrive,
  Calendar,
  ArrowUpDown,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox as TableCheckbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface AttachedFile {
  id: string;
  file: File | null; // null for vault file references
  name: string;
  size: number;
  source: "upload" | "vault";
  vaultId?: string;
}

interface NewVaultFile {
  id: string;
  file: File;
  name: string;
  size: number;
  category: string;
}

interface VaultFile {
  id: string;
  name: string;
  fileType: string;
  documentType: string;
  size: number;
  uploadedAt: string;
  tags: string[];
}

interface Vault {
  id: string;
  name: string;
  type: "knowledge_base" | "sandbox";
  fileCount: number;
  storageUsed: number;
  createdAt: string;
  files: VaultFile[];
}

type OutputType = "draft" | "review_table";
type OwnerType = "system" | "personal";
type AssistantMode = "chat" | "document";

interface VaultSource {
  id: string;
  name: string;
}

interface Prompt {
  id: string;
  name: string;
  content: string;
  ownerType: OwnerType;
  category: string | null;
  isStarred: boolean;
}

// Mock data - will be replaced with API calls
const mockVaults: VaultSource[] = [
  { id: "1", name: "Client Documents" },
  { id: "2", name: "Legal Templates" },
  { id: "3", name: "Research Papers" },
];

// Mock vaults with files for vault selection modal
const mockVaultsWithFiles: Vault[] = [
  {
    id: "1",
    name: "Client Documents",
    type: "knowledge_base",
    fileCount: 5,
    storageUsed: 558000,
    createdAt: "2024-12-15",
    files: [
      {
        id: "f1",
        name: "Agreement_2024.pdf",
        fileType: "pdf",
        documentType: "Contract",
        size: 245000,
        uploadedAt: "2024-12-20",
        tags: ["contract", "2024"],
      },
      {
        id: "f2",
        name: "NDA_Template.docx",
        fileType: "docx",
        documentType: "Template",
        size: 45000,
        uploadedAt: "2024-12-18",
        tags: ["nda", "template"],
      },
      {
        id: "f3",
        name: "Client_Notes.txt",
        fileType: "txt",
        documentType: "Notes",
        size: 12000,
        uploadedAt: "2024-12-22",
        tags: ["notes"],
      },
      {
        id: "f4",
        name: "Contract_Draft.pdf",
        fileType: "pdf",
        documentType: "Contract",
        size: 189000,
        uploadedAt: "2024-12-21",
        tags: ["contract", "draft"],
      },
      {
        id: "f5",
        name: "Appendix_A.pdf",
        fileType: "pdf",
        documentType: "Appendix",
        size: 67000,
        uploadedAt: "2024-12-19",
        tags: ["appendix"],
      },
    ],
  },
  {
    id: "2",
    name: "Legal Templates",
    type: "knowledge_base",
    fileCount: 3,
    storageUsed: 288000,
    createdAt: "2024-11-10",
    files: [
      {
        id: "f6",
        name: "Master_Agreement.docx",
        fileType: "docx",
        documentType: "Template",
        size: 98000,
        uploadedAt: "2024-11-12",
        tags: ["master", "template"],
      },
      {
        id: "f7",
        name: "SLA_Template.pdf",
        fileType: "pdf",
        documentType: "Template",
        size: 156000,
        uploadedAt: "2024-11-15",
        tags: ["sla", "template"],
      },
      {
        id: "f8",
        name: "Privacy_Policy.docx",
        fileType: "docx",
        documentType: "Policy",
        size: 34000,
        uploadedAt: "2024-11-20",
        tags: ["privacy", "policy"],
      },
    ],
  },
  {
    id: "3",
    name: "Research Papers",
    type: "sandbox",
    fileCount: 4,
    storageUsed: 1388000,
    createdAt: "2024-10-05",
    files: [
      {
        id: "f9",
        name: "Case_Study_2023.pdf",
        fileType: "pdf",
        documentType: "Research",
        size: 420000,
        uploadedAt: "2024-10-08",
        tags: ["case-study", "2023"],
      },
      {
        id: "f10",
        name: "Legal_Analysis.pdf",
        fileType: "pdf",
        documentType: "Analysis",
        size: 312000,
        uploadedAt: "2024-10-10",
        tags: ["analysis"],
      },
      {
        id: "f11",
        name: "Market_Research.pdf",
        fileType: "pdf",
        documentType: "Research",
        size: 567000,
        uploadedAt: "2024-10-12",
        tags: ["market", "research"],
      },
      {
        id: "f12",
        name: "Regulatory_Review.docx",
        fileType: "docx",
        documentType: "Review",
        size: 89000,
        uploadedAt: "2024-10-15",
        tags: ["regulatory", "review"],
      },
    ],
  },
];

const recommendedWorkflows = [
  {
    id: "1",
    name: "Draft Client Alert",
    description: "Generate client-facing alerts from source documents",
    outputType: "draft" as const,
    category: "General",
  },
  {
    id: "2",
    name: "Extract Key Data",
    description: "Pull structured data from agreements",
    outputType: "extraction" as const,
    category: "Transactional",
  },
  {
    id: "3",
    name: "Summarize Calls",
    description: "Create summaries from meeting transcripts",
    outputType: "draft" as const,
    category: "General",
  },
  {
    id: "4",
    name: "Review Table",
    description: "Build comparison tables from multiple docs",
    outputType: "review_table" as const,
    category: "Transactional",
  },
];

// Mock prompts - will be replaced with API call to /api/prompts
const mockPrompts: Prompt[] = [
  {
    id: "1",
    name: "Contract Summary",
    content:
      "Summarize the key terms of this contract including parties, effective date, term, and material obligations.",
    ownerType: "system",
    category: "analysis",
    isStarred: true,
  },
  {
    id: "2",
    name: "Risk Identification",
    content:
      "Identify and list all potential legal risks in this document, categorized by severity (high, medium, low).",
    ownerType: "system",
    category: "review",
    isStarred: false,
  },
  {
    id: "3",
    name: "Change of Control Analysis",
    content:
      "Analyze all change of control provisions and their implications for the transaction.",
    ownerType: "system",
    category: "transactional",
    isStarred: false,
  },
  {
    id: "4",
    name: "My Custom Review Prompt",
    content:
      "Review this document for compliance with our internal policies on data retention and privacy.",
    ownerType: "personal",
    category: "compliance",
    isStarred: true,
  },
  {
    id: "5",
    name: "Timeline Extraction",
    content:
      "Extract all dates and deadlines from this document and present them in chronological order with context.",
    ownerType: "system",
    category: "extraction",
    isStarred: false,
  },
  {
    id: "6",
    name: "Clause Comparison",
    content:
      "Compare the indemnification clauses across the provided documents and highlight key differences.",
    ownerType: "system",
    category: "review",
    isStarred: false,
  },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DEFAULT_PLACEHOLDER = "Ask anything. Type @ to add sources.";
const VAULT_CONTEXT_PLACEHOLDER =
  "Ask a question about your selected vault files...";

interface PreloadedVaultContext {
  vaultId: string;
  vaultName: string;
  fileIds: string[];
}

export default function AssistantPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [preloadedContext, setPreloadedContext] =
    useState<PreloadedVaultContext | null>(null);
  const [outputType, setOutputType] = useState<OutputType>("draft");
  const [selectedVaults, setSelectedVaults] = useState<string[]>([]);
  const [deepAnalysis, setDeepAnalysis] = useState(false);
  const [showVaultSelector, setShowVaultSelector] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [selectedVaultForFiles, setSelectedVaultForFiles] =
    useState<Vault | null>(null);
  const [selectedVaultFiles, setSelectedVaultFiles] = useState<string[]>([]);
  const [hoveredPrompt, setHoveredPrompt] = useState<Prompt | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [vaultSearchQuery, setVaultSearchQuery] = useState("");
  const [fileSortColumn, setFileSortColumn] = useState<
    "name" | "documentType" | "size" | "uploadedAt"
  >("name");
  const [fileSortDirection, setFileSortDirection] = useState<"asc" | "desc">(
    "asc",
  );
  const [focusedFile, setFocusedFile] = useState<VaultFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mode state for split-panel layout
  const [mode, setMode] = useState<AssistantMode>("chat");
  const [editorContent, setEditorContent] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  // Document auto-save state
  const [currentQueryId, setCurrentQueryId] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryIdRef = useRef<string | null>(null);

  // Version state
  const [currentVersion, setCurrentVersion] = useState(1);
  const [availableVersions, setAvailableVersions] = useState<number[]>([1]);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);

  // Create New Vault modal state
  const [showCreateVaultModal, setShowCreateVaultModal] = useState(false);
  const [newVaultName, setNewVaultName] = useState("");
  const [newVaultFiles, setNewVaultFiles] = useState<NewVaultFile[]>([]);
  const [isCreatingVault, setIsCreatingVault] = useState(false);

  // Custom fetch to capture X-Query-Id header from response
  const customFetch = useCallback(
    async (url: RequestInfo | URL, init?: RequestInit) => {
      const response = await fetch(url, init);
      const queryId = response.headers.get("X-Query-Id");
      if (queryId) {
        queryIdRef.current = queryId;
        setCurrentQueryId(queryId);
      }
      return response;
    },
    [],
  );

  const { completion, isLoading, complete, error } = useCompletion({
    api: "/api/assistant/query",
    fetch: customFetch,
    streamProtocol: "text", // Use plain text streaming (matches toTextStreamResponse)
  });

  // Parse mode and content from AI response
  const parsedResponse = useMemo(() => {
    if (!completion) return { mode: null, content: "" };

    // Check for mode prefix: [MODE:chat] or [MODE:document]
    // Allow optional whitespace at start, after colon, and case-insensitive
    const modeMatch = completion.match(
      /^\s*\[MODE:\s*(chat|document)\s*\]\s*/i,
    );
    if (modeMatch) {
      const detectedMode = modeMatch[1].toLowerCase() as "chat" | "document";
      // Strip the mode prefix and any leading whitespace/newlines
      const content = completion.slice(modeMatch[0].length).replace(/^\n+/, "");
      return { mode: detectedMode, content };
    }

    // No mode prefix found, return raw completion
    return { mode: null, content: completion };
  }, [completion]);

  // Read URL params and set up preloaded vault context (runs once on mount)
  useEffect(() => {
    const vaultId = searchParams.get("vault");
    const vaultName = searchParams.get("vaultName");
    const filesParam = searchParams.get("files");
    const queryParam = searchParams.get("query");

    if (vaultId && filesParam) {
      const fileIds = filesParam.split(",");
      setPreloadedContext({
        vaultId,
        vaultName: vaultName || "Vault",
        fileIds,
      });

      // Add vault files to attached files as references
      // Find files from mock data that match the IDs
      const vault = mockVaultsWithFiles.find((v) => v.id === vaultId);
      if (vault) {
        const filesToAdd: AttachedFile[] = vault.files
          .filter((f) => fileIds.includes(f.id))
          .map((f) => ({
            id: `vault-${f.id}`,
            file: null,
            name: f.name,
            size: f.size,
            source: "vault" as const,
            vaultId: vaultId,
          }));
        setAttachedFiles(filesToAdd);
        // Add vault to selected vaults for context
        setSelectedVaults((prev) =>
          prev.includes(vaultId) ? prev : [vaultId],
        );
      }
    } else if (vaultId) {
      // Just vault selected, no specific files
      setPreloadedContext({
        vaultId,
        vaultName: vaultName || "Vault",
        fileIds: [],
      });
      setSelectedVaults((prev) => (prev.includes(vaultId) ? prev : [vaultId]));
    }

    // Pre-fill query if provided
    if (queryParam) {
      setQuery(queryParam);
    }
  }, [searchParams]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles: AttachedFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      source: "upload" as const,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = ""; // Reset for re-selection
      }
    },
    [addFiles],
  );

  const toggleVault = (vaultId: string) => {
    setSelectedVaults((prev) =>
      prev.includes(vaultId)
        ? prev.filter((id) => id !== vaultId)
        : [...prev, vaultId],
    );
  };

  const handleVaultSelect = (vault: Vault) => {
    setSelectedVaultForFiles(vault);
    setSelectedVaultFiles([]);
  };

  const handleBackToVaults = () => {
    setSelectedVaultForFiles(null);
    setSelectedVaultFiles([]);
    setFocusedFile(null);
  };

  const handleFileSort = (
    column: "name" | "documentType" | "size" | "uploadedAt",
  ) => {
    if (fileSortColumn === column) {
      setFileSortDirection(fileSortDirection === "asc" ? "desc" : "asc");
    } else {
      setFileSortColumn(column);
      setFileSortDirection("asc");
    }
  };

  const toggleSelectAllFiles = () => {
    if (!selectedVaultForFiles) return;
    if (selectedVaultFiles.length === selectedVaultForFiles.files.length) {
      setSelectedVaultFiles([]);
    } else {
      setSelectedVaultFiles(selectedVaultForFiles.files.map((f) => f.id));
    }
  };

  // Filter and sort vaults
  const filteredVaults = mockVaultsWithFiles.filter((vault) =>
    vault.name.toLowerCase().includes(vaultSearchQuery.toLowerCase()),
  );

  // Sort files
  const sortedFiles = selectedVaultForFiles
    ? [...selectedVaultForFiles.files].sort((a, b) => {
        const direction = fileSortDirection === "asc" ? 1 : -1;
        switch (fileSortColumn) {
          case "name":
            return direction * a.name.localeCompare(b.name);
          case "documentType":
            return direction * a.documentType.localeCompare(b.documentType);
          case "size":
            return direction * (a.size - b.size);
          case "uploadedAt":
            return direction * a.uploadedAt.localeCompare(b.uploadedAt);
          default:
            return 0;
        }
      })
    : [];

  const toggleVaultFileSelection = (fileId: string) => {
    setSelectedVaultFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const confirmVaultFileSelection = () => {
    if (!selectedVaultForFiles) return;

    const filesToAdd: AttachedFile[] = selectedVaultForFiles.files
      .filter((f) => selectedVaultFiles.includes(f.id))
      .map((f) => ({
        id: `vault-${f.id}`,
        file: null, // Vault files are references, not actual File objects
        name: f.name,
        size: f.size,
        source: "vault" as const,
        vaultId: selectedVaultForFiles.id,
      }));

    setAttachedFiles((prev) => [...prev, ...filesToAdd]);
    setShowVaultModal(false);
    setSelectedVaultForFiles(null);
    setSelectedVaultFiles([]);
  };

  const handleSubmit = async () => {
    if (!query.trim() || isLoading) return;

    const sources = selectedVaults
      .map((id) => {
        const vault = mockVaults.find((v) => v.id === id);
        return vault ? { id, name: vault.name } : null;
      })
      .filter(Boolean);

    // Build attached files metadata for API
    const files = attachedFiles.map((af) => ({
      id: af.id,
      name: af.name,
      size: af.size,
      source: af.source,
      vaultId: af.vaultId,
    }));

    // Store the query that was submitted
    setSubmittedQuery(query);

    await complete(query, {
      body: {
        inputText: query,
        outputType,
        sources,
        deepAnalysis,
        attachedFiles: files,
      },
    });
  };

  // Switch mode based on AI-detected mode prefix and sync content
  useEffect(() => {
    if (parsedResponse.mode) {
      setMode(parsedResponse.mode);
      // Always sync content when in document mode, even if empty
      setEditorContent(parsedResponse.content);
    }
  }, [parsedResponse.mode, parsedResponse.content]);

  // Debounced auto-save function (2 second delay)
  const debouncedSaveDocument = useDebouncedCallback(
    async (content: string, queryId: string | null, docId: string | null) => {
      // Only save if we have content and are in document mode
      if (!content.trim() || !queryId) return;

      setIsSaving(true);
      try {
        if (docId) {
          // Update existing document
          const response = await fetch(`/api/documents/${docId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: { html: content },
            }),
          });
          if (!response.ok) {
            console.error("Failed to update document");
          }
        } else {
          // Create new document
          const title =
            submittedQuery.length > 50
              ? submittedQuery.substring(0, 50) + "..."
              : submittedQuery || "Untitled Draft";

          const response = await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              content: { html: content },
              queryId,
            }),
          });

          if (response.ok) {
            const doc = await response.json();
            setDocumentId(doc.id);
            setCurrentVersion(doc.currentVersion || 1);
            setAvailableVersions(doc.availableVersions || [1]);
          } else if (response.status === 409) {
            // Document already exists for this query, fetch and use it
            console.log("Document already exists for query, skipping create");
          } else {
            console.error("Failed to create document");
          }
        }
      } catch (error) {
        console.error("Error saving document:", error);
      } finally {
        setIsSaving(false);
      }
    },
    2000, // 2 second delay
  );

  // Handle editor content changes with auto-save
  const handleEditorChange = useCallback(
    (content: string) => {
      setEditorContent(content);
      // Only trigger save if not currently streaming (user editing)
      if (!isLoading && mode === "document") {
        debouncedSaveDocument(content, currentQueryId, documentId);
      }
    },
    [isLoading, mode, currentQueryId, documentId, debouncedSaveDocument],
  );

  const hasResponse = completion.length > 0;
  const displayContent = parsedResponse.content;

  // Get starred prompts first, then others
  const sortedPrompts = [...mockPrompts].sort((a, b) => {
    if (a.isStarred && !b.isStarred) return -1;
    if (!a.isStarred && b.isStarred) return 1;
    return 0;
  });

  const insertPrompt = (prompt: Prompt) => {
    const currentQuery = query.trim();
    const newQuery = currentQuery
      ? `${currentQuery}\n\n${prompt.content}`
      : prompt.content;
    setQuery(newQuery);
    setHoveredPrompt(null);
  };

  const handleImprove = async () => {
    if (!query.trim() || isImproving || isLoading) return;

    setIsImproving(true);
    try {
      const response = await fetch("/api/assistant/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText: query }),
      });

      if (!response.ok) {
        throw new Error("Failed to improve prompt");
      }

      // Stream the response and build up the improved prompt
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let improvedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        improvedText += decoder.decode(value, { stream: true });
        setQuery(improvedText);
      }
    } catch (error) {
      console.error("Error improving prompt:", error);
    } finally {
      setIsImproving(false);
    }
  };

  // Compute placeholder - shows hovered prompt preview, vault context, or default
  const textareaPlaceholder = hoveredPrompt
    ? hoveredPrompt.content.slice(0, 100) +
      (hoveredPrompt.content.length > 100 ? "..." : "")
    : preloadedContext && preloadedContext.fileIds.length > 0
      ? VAULT_CONTEXT_PLACEHOLDER
      : DEFAULT_PLACEHOLDER;

  // Create New Vault dropzone
  const onDropNewVaultFiles = useCallback((acceptedFiles: File[]) => {
    const newFiles: NewVaultFile[] = acceptedFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      category: "",
    }));
    setNewVaultFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const {
    getRootProps: getNewVaultRootProps,
    getInputProps: getNewVaultInputProps,
    isDragActive: isNewVaultDragActive,
  } = useDropzone({
    onDrop: onDropNewVaultFiles,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
  });

  const removeNewVaultFile = (id: string) => {
    setNewVaultFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateNewVaultFileCategory = (id: string, category: string) => {
    setNewVaultFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, category } : f)),
    );
  };

  const handleCreateVault = async () => {
    if (!newVaultName.trim() || isCreatingVault) return;

    setIsCreatingVault(true);
    try {
      // 1. Create the vault
      const response = await fetch("/api/vaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newVaultName,
          type: "knowledge_base",
          description: "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create vault");
      }

      const vault = await response.json();

      // 2. Upload files if any
      if (newVaultFiles.length > 0) {
        const formData = new FormData();

        // Build categories map: { filename: category }
        const categories: Record<string, string> = {};
        newVaultFiles.forEach((f) => {
          formData.append("files", f.file);
          if (f.category) {
            categories[f.name] = f.category;
          }
        });

        formData.append("categories", JSON.stringify(categories));

        const uploadResponse = await fetch(
          `/api/vaults/${vault.id}/documents`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!uploadResponse.ok) {
          console.error("Failed to upload files, but vault was created");
        }
      }

      setShowCreateVaultModal(false);
      setNewVaultName("");
      setNewVaultFiles([]);
    } catch (error) {
      console.error("Error creating vault:", error);
    } finally {
      setIsCreatingVault(false);
    }
  };

  const resetCreateVaultModal = () => {
    setShowCreateVaultModal(false);
    setNewVaultName("");
    setNewVaultFiles([]);
  };

  const handleNewThread = () => {
    setQuery("");
    setSubmittedQuery("");
    setEditorContent("");
    setMode("chat");
    // Reset document state
    setCurrentQueryId(null);
    setDocumentId(null);
    queryIdRef.current = null;
    // Reset version state
    setCurrentVersion(1);
    setAvailableVersions([1]);
  };

  // Handle version switching
  const handleVersionChange = useCallback(
    async (version: number) => {
      if (!documentId || version === currentVersion || isLoadingVersion) return;

      setIsLoadingVersion(true);
      try {
        const response = await fetch(
          `/api/documents/${documentId}/versions/${version}`,
        );
        if (!response.ok) {
          throw new Error("Failed to load version");
        }

        const data = await response.json();
        // Extract HTML content from the JSON structure
        const htmlContent = data.content?.html || "";
        setEditorContent(htmlContent);
        setCurrentVersion(version);
      } catch (error) {
        console.error("Error loading version:", error);
      } finally {
        setIsLoadingVersion(false);
      }
    },
    [documentId, currentVersion, isLoadingVersion],
  );

  // Calculate total size of files being uploaded to new vault
  const newVaultTotalSize = newVaultFiles.reduce((sum, f) => sum + f.size, 0);
  const MAX_STORAGE_GB = 100;
  const MAX_FILE_COUNT = 100000;

  // Render input controls for chat panel
  const renderInputControls = () => (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="inline"
            size="sm"
            className="gap-1.5 h-8"
            disabled={isLoading}
          >
            <Paperclip className="h-4 w-4" />
            Files & Sources
            {attachedFiles.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 w-5 p-0 justify-center"
              >
                {attachedFiles.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>File Actions</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Upload Files
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Sources</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setShowVaultModal(true)}>
              <Database className="h-4 w-4" />
              Add From Vault
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu onOpenChange={(open) => !open && setHoveredPrompt(null)}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="inline"
            size="sm"
            className="gap-1.5 h-8"
            disabled={isLoading}
          >
            <BookOpen className="h-4 w-4" />
            Prompts
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-72 max-h-80 overflow-y-auto"
        >
          <DropdownMenuLabel>Saved Prompts</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sortedPrompts.map((prompt) => (
            <DropdownMenuItem
              key={prompt.id}
              onClick={() => insertPrompt(prompt)}
              onMouseEnter={() => setHoveredPrompt(prompt)}
              onMouseLeave={() => setHoveredPrompt(null)}
              className="flex flex-col items-start gap-1 cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                {prompt.isStarred && (
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                )}
                <span className="font-medium text-sm truncate">
                  {prompt.name}
                </span>
                {prompt.ownerType === "personal" && (
                  <Badge variant="outline" className="text-xs ml-auto shrink-0">
                    Personal
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 w-full">
                {prompt.content}
              </p>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="inline"
        size="sm"
        className="gap-1.5 h-8"
        disabled={isLoading || isImproving || !query.trim()}
        onClick={handleImprove}
      >
        {isImproving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Improving
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            Improve
          </>
        )}
      </Button>
      {/* Spacer */}
      <div className="flex-1" />
      {/* Ask Button - right aligned */}
      <Button
        onClick={handleSubmit}
        disabled={!query.trim() || isLoading}
        size="sm"
        className="h-8"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            Generating
          </>
        ) : (
          <>Ask</>
        )}
      </Button>
    </>
  );

  // Render the split-panel layout when in document mode
  if (mode === "document" && hasResponse) {
    return (
      <>
        <PageHeader title="Assistant" />
        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error.message}</p>
          </div>
        )}
        <div className="flex h-[calc(100vh-4rem)] transition-all duration-300">
          {/* Chat Panel - 25% width */}
          <div className="w-1/4 min-w-[280px] border-r transition-all duration-300">
            <ChatPanel
              query={submittedQuery}
              completion={displayContent}
              isLoading={isLoading}
              onQueryChange={setQuery}
              onSubmit={handleSubmit}
              onNewThread={handleNewThread}
              inputControls={renderInputControls()}
              compact
            />
          </div>
          {/* Editor Panel - 75% width */}
          <div className="flex-1 transition-all duration-300">
            <EditorPanel
              content={editorContent}
              onChange={handleEditorChange}
              isStreaming={isLoading}
              isSaving={isSaving}
              version={currentVersion}
              versions={availableVersions}
              onVersionChange={handleVersionChange}
              isLoadingVersion={isLoadingVersion}
            />
          </div>
        </div>

        {/* Modals */}
        {renderVaultModal()}
        {renderCreateVaultModal()}
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
      </>
    );
  }

  // Render vault modal
  function renderVaultModal() {
    return (
      <Dialog
        open={showVaultModal}
        onOpenChange={(open) => {
          setShowVaultModal(open);
          if (!open) {
            setSelectedVaultForFiles(null);
            setSelectedVaultFiles([]);
            setVaultSearchQuery("");
            setFocusedFile(null);
          }
        }}
      >
        <DialogContent
          className="w-[50vw] max-w-[50vw] h-[50vh] max-h-[50vh] bg-gray-50 dark:bg-muted/50 border border-neutral-200 dark:border-neutral-700 p-0 flex flex-col overflow-hidden"
          showCloseButton={false}
        >
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedVaultForFiles && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleBackToVaults}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <DialogTitle>
                  {selectedVaultForFiles
                    ? selectedVaultForFiles.name
                    : "Choose a Vault"}
                </DialogTitle>
              </div>
              {/* Search bar - top right */}
              {!selectedVaultForFiles && (
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vaults..."
                    value={vaultSearchQuery}
                    onChange={(e) => setVaultSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-white dark:bg-background"
                  />
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowVaultModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {selectedVaultForFiles ? (
              /* File Table View with Metadata Panel */
              <div className="flex h-full">
                {/* File Table */}
                <div
                  className={`${focusedFile ? "flex-1" : "w-full"} overflow-y-auto p-6`}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <TableCheckbox
                            checked={
                              selectedVaultFiles.length ===
                                selectedVaultForFiles.files.length &&
                              selectedVaultForFiles.files.length > 0
                            }
                            onCheckedChange={toggleSelectAllFiles}
                          />
                        </TableHead>
                        <TableHead>
                          <button
                            className="flex items-center gap-1 hover:text-foreground"
                            onClick={() => handleFileSort("name")}
                          >
                            File Name
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            className="flex items-center gap-1 hover:text-foreground"
                            onClick={() => handleFileSort("documentType")}
                          >
                            File Type
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            className="flex items-center gap-1 hover:text-foreground"
                            onClick={() => handleFileSort("size")}
                          >
                            File Size
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            className="flex items-center gap-1 hover:text-foreground"
                            onClick={() => handleFileSort("uploadedAt")}
                          >
                            Uploaded On
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </TableHead>
                        <TableHead>Tags</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedFiles.map((file) => {
                        const isSelected = selectedVaultFiles.includes(file.id);
                        const isFocused = focusedFile?.id === file.id;
                        return (
                          <TableRow
                            key={file.id}
                            className={`cursor-pointer ${isFocused ? "bg-primary/10" : ""}`}
                            onClick={() => {
                              toggleVaultFileSelection(file.id);
                              setFocusedFile(file);
                            }}
                            data-state={isSelected ? "selected" : undefined}
                          >
                            <TableCell>
                              <TableCheckbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  toggleVaultFileSelection(file.id)
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4 text-muted-foreground" />
                                {file.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {file.documentType}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatFileSize(file.size)}</TableCell>
                            <TableCell>{file.uploadedAt}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {file.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {file.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{file.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Metadata Panel - Right Side */}
                {focusedFile && (
                  <div className="w-64 border-l border-neutral-200 dark:border-neutral-700 bg-white dark:bg-background p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-sm">File Details</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setFocusedFile(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {/* File Icon and Name */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-muted flex items-center justify-center shrink-0">
                          <File className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium break-words">
                            {focusedFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase">
                            {focusedFile.fileType}
                          </p>
                        </div>
                      </div>

                      {/* Metadata Fields */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Document Type
                          </p>
                          <Badge variant="secondary">
                            {focusedFile.documentType}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Category
                          </p>
                          <p className="text-sm">{focusedFile.documentType}</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            File Size
                          </p>
                          <p className="text-sm">
                            {formatFileSize(focusedFile.size)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            File Format
                          </p>
                          <p className="text-sm uppercase">
                            {focusedFile.fileType}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Uploaded On
                          </p>
                          <p className="text-sm">{focusedFile.uploadedAt}</p>
                        </div>

                        {focusedFile.tags.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Tags
                            </p>
                            <div className="flex gap-1 flex-wrap">
                              {focusedFile.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Vault Cards View */
              <div className="space-y-4 p-6 overflow-y-auto h-full">
                {/* Create New Vault option */}
                <button
                  className="w-full p-4 border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-white dark:bg-background hover:border-primary hover:bg-primary/5 transition-colors flex items-center gap-3"
                  onClick={() => {
                    setShowCreateVaultModal(true);
                  }}
                >
                  <div className="h-10 w-10 bg-primary/10 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Create New Vault</p>
                    <p className="text-sm text-muted-foreground">
                      Start a new knowledge base or sandbox
                    </p>
                  </div>
                </button>

                {/* Vault Cards Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {filteredVaults.map((vault) => (
                    <button
                      key={vault.id}
                      onClick={() => handleVaultSelect(vault)}
                      className="p-4 bg-white dark:bg-background border border-neutral-200 dark:border-neutral-700 hover:border-primary transition-colors text-left"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {vault.type === "knowledge_base" ? (
                            <Database className="h-5 w-5 text-primary" />
                          ) : (
                            <Folder className="h-5 w-5 text-amber-500" />
                          )}
                          <span className="font-medium">{vault.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {vault.type === "knowledge_base" ? "KB" : "Sandbox"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{vault.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <File className="h-3.5 w-3.5" />
                          <span>{vault.fileCount} files</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <HardDrive className="h-3.5 w-3.5" />
                          <span>{formatFileSize(vault.storageUsed)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Empty state */}
                {filteredVaults.length === 0 && vaultSearchQuery && (
                  <div className="text-center py-8 text-muted-foreground">
                    No vaults found matching &quot;{vaultSearchQuery}&quot;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-background flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedVaultForFiles
                ? `${selectedVaultFiles.length} file${selectedVaultFiles.length !== 1 ? "s" : ""} selected`
                : `${filteredVaults.length} vault${filteredVaults.length !== 1 ? "s" : ""}`}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVaultModal(false);
                  setSelectedVaultForFiles(null);
                  setSelectedVaultFiles([]);
                  setVaultSearchQuery("");
                }}
              >
                Cancel
              </Button>
              {selectedVaultForFiles && (
                <Button
                  onClick={confirmVaultFileSelection}
                  disabled={selectedVaultFiles.length === 0}
                >
                  Add{" "}
                  {selectedVaultFiles.length > 0
                    ? `${selectedVaultFiles.length} `
                    : ""}
                  File{selectedVaultFiles.length !== 1 ? "s" : ""}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render create vault modal
  function renderCreateVaultModal() {
    return (
      <Dialog
        open={showCreateVaultModal}
        onOpenChange={(open) => {
          if (!open) resetCreateVaultModal();
          else setShowCreateVaultModal(open);
        }}
      >
        <DialogContent
          className="w-[50vw] max-w-[50vw] h-[50vh] max-h-[50vh] bg-gray-50 dark:bg-muted/50 border border-neutral-200 dark:border-neutral-700 p-0 flex flex-col overflow-hidden"
          showCloseButton={false}
        >
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-background">
            <div className="flex items-center justify-between">
              <DialogTitle>Create a Vault</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={resetCreateVaultModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Vault Name Input */}
            <div className="space-y-2">
              <Label htmlFor="vault-name" className="text-sm font-medium">
                Vault Name
              </Label>
              <Input
                id="vault-name"
                placeholder="Enter vault name..."
                value={newVaultName}
                onChange={(e) => setNewVaultName(e.target.value)}
                className="bg-white dark:bg-background"
              />
            </div>

            {/* Drag-and-Drop Upload Zone */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Upload Files</Label>
              <div
                {...getNewVaultRootProps()}
                className={`
                  border-2 border-dashed p-8 text-center cursor-pointer transition-colors bg-white dark:bg-background
                  ${
                    isNewVaultDragActive
                      ? "border-primary bg-primary/5"
                      : "border-neutral-300 dark:border-neutral-600 hover:border-primary/50"
                  }
                `}
              >
                <input {...getNewVaultInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                {isNewVaultDragActive ? (
                  <p className="text-sm text-primary">Drop files here...</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports PDF, DOC, DOCX, TXT
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Uploaded Files List */}
            {newVaultFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Files ({newVaultFiles.length})
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {newVaultFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-background border border-neutral-200 dark:border-neutral-700"
                    >
                      <File className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Select
                        value={file.category}
                        onValueChange={(value) =>
                          updateNewVaultFileCategory(file.id, value)
                        }
                      >
                        <SelectTrigger className="w-32 h-8 text-xs bg-white dark:bg-background">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="template">Template</SelectItem>
                          <SelectItem value="agreement">Agreement</SelectItem>
                          <SelectItem value="memo">Memo</SelectItem>
                          <SelectItem value="policy">Policy</SelectItem>
                          <SelectItem value="research">Research</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeNewVaultFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-background flex items-center justify-between">
            {/* Usage stats - left side */}
            <div className="flex gap-6 text-xs text-muted-foreground">
              <span>
                {formatFileSize(newVaultTotalSize)} of {MAX_STORAGE_GB} GB
              </span>
              <span>
                {newVaultFiles.length} of {MAX_FILE_COUNT.toLocaleString()}{" "}
                files
              </span>
            </div>
            {/* Action buttons - right side */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetCreateVaultModal}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateVault}
                disabled={!newVaultName.trim() || isCreatingVault}
              >
                {isCreatingVault ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Creating
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Default chat mode layout (full width)
  return (
    <>
      <PageHeader title="Assistant" />
      <div className="flex flex-col items-center min-h-[60vh] gap-8 px-4 py-8 transition-all duration-300">
        {/* Title/Logo - only show when no response */}
        {!hasResponse && (
          <div className="text-center space-y-2 mt-[10vh]">
            <h1 className="text-4xl font-bold tracking-tight">
              Legal Workflow
            </h1>
            <p className="text-lg text-muted-foreground">
              AI-powered legal document analysis
            </p>
          </div>
        )}

        {/* Response Area - only in chat mode */}
        {hasResponse && mode === "chat" && (
          <div className="w-full max-w-3xl">
            <div className="mb-4 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Query:</p>
              <MarkdownRenderer content={submittedQuery} />
            </div>
            <MarkdownRenderer content={displayContent} />
            {isLoading && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
              </span>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="w-full max-w-2xl p-4 bg-destructive/10 text-destructive rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error.message}</p>
          </div>
        )}

        {/* Main Input Area */}
        <div
          className={`w-full max-w-4xl space-y-4 ${hasResponse ? "mt-auto" : ""}`}
        >
          {/* Unified Chat Input Container */}
          <div className="border rounded bg-background">
            {/* Textarea */}
            <Textarea
              placeholder={textareaPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[100px] resize-none text-base border-0 focus-visible:ring-0 rounded-b-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
              }}
              disabled={isLoading}
            />
            {/* Embedded Button Row */}
            <div className="flex items-center gap-2 p-2 border-t bg-muted/30">
              {renderInputControls()}
            </div>
          </div>

          {/* Output Type Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Output:</span>
            <div className="flex gap-1">
              <Toggle
                pressed={outputType === "draft"}
                onPressedChange={() => setOutputType("draft")}
                size="sm"
                className="gap-1.5"
                disabled={isLoading}
              >
                <FileText className="h-4 w-4" />
                Draft document
              </Toggle>
              <Toggle
                pressed={outputType === "review_table"}
                onPressedChange={() => setOutputType("review_table")}
                size="sm"
                className="gap-1.5"
                disabled={isLoading}
              >
                <Table2 className="h-4 w-4" />
                Review table
              </Toggle>
            </div>
          </div>

          {/* Source Selector */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVaultSelector(!showVaultSelector)}
                className="gap-1.5"
                disabled={isLoading}
              >
                <Folder className="h-4 w-4" />
                Choose vault
              </Button>
            </div>

            {/* Vault Selection Dropdown */}
            {showVaultSelector && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md">
                {mockVaults.map((vault) => {
                  const isSelected = selectedVaults.includes(vault.id);
                  return (
                    <Button
                      key={vault.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleVault(vault.id)}
                      className="gap-1.5"
                      disabled={isLoading}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {vault.name}
                    </Button>
                  );
                })}
              </div>
            )}

            {/* Hidden file input for Upload Files action */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />

            {/* Preloaded Vault Context Display */}
            {preloadedContext && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-md space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Querying: {preloadedContext.vaultName}
                  </span>
                  {preloadedContext.fileIds.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {preloadedContext.fileIds.length} file
                      {preloadedContext.fileIds.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Attached files display */}
            {attachedFiles.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {attachedFiles.length} file
                    {attachedFiles.length !== 1 ? "s" : ""} attached
                  </span>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {attachedFiles.map((af) => (
                    <div
                      key={af.id}
                      className="flex items-center gap-2 p-2 bg-background rounded text-sm"
                    >
                      <File className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{af.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatFileSize(af.size)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeFile(af.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Sources Indicator */}
            {selectedVaults.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Sources:</span>
                {selectedVaults.map((id) => {
                  const vault = mockVaults.find((v) => v.id === id);
                  return vault ? (
                    <Badge key={id} variant="secondary">
                      {vault.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Deep Analysis Toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="deep-analysis"
              checked={deepAnalysis}
              onCheckedChange={(checked) => setDeepAnalysis(checked === true)}
              disabled={isLoading}
            />
            <label
              htmlFor="deep-analysis"
              className="text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Deep analysis
            </label>
            <span className="text-xs text-muted-foreground">
              (Extended processing for complex queries)
            </span>
          </div>
        </div>

        {/* Recommended Workflows - only show when no response */}
        {!hasResponse && (
          <div className="w-full space-y-4 mt-8">
            <h2 className="text-lg font-semibold">Recommended workflows</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="p-4 bg-gray-50 dark:bg-muted/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-muted transition-colors"
                >
                  <div className="space-y-1.5 pb-2">
                    <h3 className="text-base font-semibold leading-none tracking-tight">
                      {workflow.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {workflow.description}
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline" className="text-xs">
                      {workflow.outputType === "draft" && "Draft"}
                      {workflow.outputType === "review_table" && "Review table"}
                      {workflow.outputType === "extraction" && "Extraction"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {renderVaultModal()}
      {renderCreateVaultModal()}
    </>
  );
}
