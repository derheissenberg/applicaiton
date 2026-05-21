import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { after } from "next/server";
import { buildSystemPrompt } from "@/lib/prompt";
import { ratelimit, getClientIp } from "@/lib/ratelimit";
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
  const ip = getClientIp(req);
  const limitResult = await ratelimit.limit(ip);
  const { success, reset, remaining, limit } = limitResult;
  const limitReason =
    "reason" in limitResult
      ? (limitResult as { reason?: string }).reason
      : undefined;

  // #region agent log
  fetch("http://127.0.0.1:7336/ingest/d59e9ced-9d47-44ed-8229-0f50553ae11f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "d3a49b",
    },
    body: JSON.stringify({
      sessionId: "d3a49b",
      runId: "pre-fix",
      hypothesisId: "H1-H2-H4",
      location: "app/api/chat/route.ts:rate-limit",
      message: "ratelimit.limit result",
      data: {
        ip,
        success,
        remaining,
        limit,
        limitReason,
        hasUpstashUrl: Boolean(process.env.UPSTASH_REDIS_REST_URL),
        hasUpstashToken: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
        forwarded: req.headers.get("x-forwarded-for") ?? null,
        realIp: req.headers.get("x-real-ip") ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!success) {
    return Response.json(
      { error: "Rate limit exceeded. Please try again in a moment." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Reset": reset.toString(),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

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

      return result.toUIMessageStreamResponse({
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
        },
      });
    });
  } catch (error) {
    console.error("[api/chat] error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export const POST = observe(handler, { name: "chat-stream", endOnExit: false });
