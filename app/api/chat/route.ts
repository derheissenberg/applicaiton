import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { buildSystemPrompt } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages required" }, { status: 400 });
    }

    const system = await buildSystemPrompt();

    const result = streamText({
      model: anthropic(process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5"),
      system,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[api/chat] error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
