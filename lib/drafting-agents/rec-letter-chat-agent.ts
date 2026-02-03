import { tool } from "ai"
import { z } from "zod"
import { defaultModel } from "@/lib/ai"
import { createDraftingTools } from "@/lib/drafting-tools"

const SYSTEM_PROMPT = `You are an expert EB-1A immigration attorney specializing in recommendation letters. You help lawyers iteratively refine recommendation letters through conversation.

You have tools to:
- Research the client's profile, vault documents, gap analysis, and recommender details
- Update specific sections of the current draft
- Replace the full draft content

Guidelines:
- Be concise and direct in chat responses
- When the user asks for changes, use update_draft_section for targeted edits or update_full_draft for wholesale rewrites
- Always explain what you changed and why after making edits
- Reference specific EB-1A criteria (extraordinary ability, outstanding researcher, etc.) when relevant
- Use legal writing conventions appropriate for USCIS recommendation letters
- When strengthening language, cite specific evidence from the client's profile or vault documents
- Keep the letter professional, specific, and persuasive -- avoid generic praise`

export function createRecLetterChatAgent(
  clientId: string,
  recommenderId: string,
  currentContent: string,
) {
  const draftingTools = createDraftingTools(clientId)

  const tools = {
    ...draftingTools,

    get_current_draft: tool({
      description:
        "Get the current draft content as it appears in the editor. Use this to read the letter before making changes.",
      inputSchema: z.object({}),
      execute: async () => {
        return currentContent || "Draft is empty -- no content yet."
      },
    }),

    update_draft_section: tool({
      description:
        "Replace a specific section of the draft identified by its heading. The frontend will find the heading and replace content until the next heading.",
      inputSchema: z.object({
        heading: z
          .string()
          .describe(
            "The exact heading text of the section to replace (e.g. 'Professional Background')",
          ),
        newContent: z
          .string()
          .describe(
            "The new markdown content for this section (excluding the heading itself)",
          ),
      }),
      execute: async ({ heading, newContent }) => {
        return JSON.stringify({ type: "section_update", heading, newContent })
      },
    }),

    update_full_draft: tool({
      description:
        "Replace the entire draft with new content. Use for major rewrites or when changes span multiple sections.",
      inputSchema: z.object({
        newContent: z
          .string()
          .describe("The complete new draft content in markdown format"),
      }),
      execute: async ({ newContent }) => {
        return JSON.stringify({ type: "full_update", newContent })
      },
    }),
  }

  return {
    model: defaultModel,
    instructions: SYSTEM_PROMPT,
    tools,
  }
}
