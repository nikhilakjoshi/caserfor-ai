import { tool, generateText, type Tool } from "ai"
import { z } from "zod"
import { defaultModel, analysisModel } from "@/lib/ai"
import type { Agent } from "@prisma/client"

// Input schema for agent tools
const agentToolInputSchema = z.object({
  query: z.string().describe("The query or task to send to this agent"),
  context: z
    .string()
    .optional()
    .describe("Optional additional context for the agent"),
})

type AgentToolInput = z.infer<typeof agentToolInputSchema>

/**
 * Creates a tool from an Agent record that can be used by the main assistant.
 * The tool wraps a sub-agent call using generateText with the agent's instruction.
 */
export function createAgentTool(
  agent: Agent,
  useAnalysisModel: boolean = false
): Tool<AgentToolInput, string> {
  const model = useAnalysisModel ? analysisModel : defaultModel

  return tool({
    description: `${agent.name}: ${agent.description || "A specialized agent"}`,
    inputSchema: agentToolInputSchema,
    execute: async ({ query, context }) => {
      // Build the user prompt with optional context
      const userPrompt = context
        ? `Context:\n${context}\n\nQuery:\n${query}`
        : query

      const result = await generateText({
        model,
        system: agent.instruction,
        prompt: userPrompt,
      })

      return result.text
    },
  })
}

/**
 * Builds a record of tools from an array of Agent records.
 * Tool names use the format: agent_{slug}
 */
export function buildAgentTools(
  agents: Agent[],
  deepAnalysis: boolean = false
): Record<string, Tool<AgentToolInput, string>> {
  const tools: Record<string, Tool<AgentToolInput, string>> = {}

  for (const agent of agents) {
    const toolName = `agent_${agent.slug}`
    tools[toolName] = createAgentTool(agent, deepAnalysis)
  }

  return tools
}
