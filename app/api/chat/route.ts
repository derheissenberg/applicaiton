import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { after } from "next/server";
import { buildSystemPrompt } from "@/lib/prompt";
import {
  observe,
  setActiveTraceIO,
  propagateAttributes,
} from "@langfuse/tracing";
import { trace } from "@opentelemetry/api";
import { langfuseSpanProcessor } from "@/instrumentation";

export const runtime = "nodejs";
export const maxDuration = 30;

async function handler(req: Request) {
  try {
    const { messages, sessionId }: {
      messages: UIMessage[];
      sessionId?: string;
    } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages required" }, { status: 400 });
    }

    const validSessionId =
      typeof sessionId === "string" && sessionId.length > 0
        ? sessionId
        : crypto.randomUUID();

    return propagateAttributes({ sessionId: validSessionId }, async () => {
      const lastUserMessage = messages.filter((m) => m.role === "user").pop();
      const lastUserText =
        lastUserMessage?.parts
          ?.filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("") ?? "";

      setActiveTraceIO({ input: lastUserText });

      const system = await buildSystemPrompt();

      const result = streamText({
        model: anthropic(process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5"),
        system,
        messages: await convertToModelMessages(messages),
        experimental_telemetry: {
          isEnabled: true,
          functionId: "chat-stream",
        },
        onFinish: (event) => {
          setActiveTraceIO({ output: event.text });
          trace.getActiveSpan()?.end();
        },
        onError: (event) => {
          setActiveTraceIO({ output: String(event.error) });
          trace.getActiveSpan()?.end();
        },
      });

      after(() => langfuseSpanProcessor.forceFlush());

      return result.toUIMessageStreamResponse();
    });
  } catch (error) {
    console.error("[api/chat] error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export const POST = observe(handler, { name: "chat-stream", endOnExit: false });
