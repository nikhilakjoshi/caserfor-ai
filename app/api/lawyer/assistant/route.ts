import {
  ToolLoopAgent,
  createAgentUIStreamResponse,
  type UIMessage,
} from "ai"
import { defaultModel } from "@/lib/ai"
import { createDashboardTools } from "@/lib/dashboard-agent-tools"
import { getUser } from "@/lib/get-user"

const SYSTEM_PROMPT = `You are a legal case management assistant for immigration lawyers. Help lawyers review case statuses, find information across documents, and track progress.

You have tools to:
- List all assigned cases
- Get detailed case information
- Search vault documents using semantic search
- Retrieve gap analyses, eligibility reports, and drafts

When answering:
- Be concise and direct
- Reference specific case data when available
- If asked about a specific client, use get_case_detail first
- For questions about evidence or documents, use search_vault
- For caseload overview questions, use get_all_cases`

export async function POST(req: Request) {
  const user = await getUser()
  if (!user || (user.role !== "lawyer" && user.role !== "admin")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { messages } = (await req.json()) as { messages?: UIMessage[] }
  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const tools = createDashboardTools(user.id)

  const agent = new ToolLoopAgent({
    model: defaultModel,
    instructions: SYSTEM_PROMPT,
    tools,
  })

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
  })
}
