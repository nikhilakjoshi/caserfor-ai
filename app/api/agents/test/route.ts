import { ToolLoopAgent, createAgentUIStreamResponse, UIMessage } from "ai";
import { defaultModel } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const {
      instruction,
      messages,
    }: { instruction: string; messages: UIMessage[] } = await request.json();

    if (!instruction || typeof instruction !== "string") {
      return new Response(
        JSON.stringify({ error: "Instruction is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const agent = new ToolLoopAgent({
      model: defaultModel,
      instructions: instruction,
      tools: {},
    });

    return createAgentUIStreamResponse({ agent, uiMessages: messages });
  } catch (error) {
    console.error("Agent test error:", error);
    return new Response(JSON.stringify({ error: "Failed to run agent test" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
