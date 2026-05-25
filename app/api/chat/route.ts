import { anthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  convertToModelMessages,
  validateUIMessages,
  type UIMessage,
} from "ai";
import { after } from "next/server";
import { buildSystemPrompt } from "@/lib/prompt";
import {
  matchContext,
  buildContextBlock,
  type ContextEntry,
} from "@/lib/context-loader";
import { ratelimit, getClientIp } from "@/lib/ratelimit";
import { observe, setActiveTraceIO } from "@langfuse/tracing";
import { trace } from "@opentelemetry/api";
import { langfuseSpanProcessor } from "@/instrumentation";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_ORIGINS = [
  "https://stefanheissenberg.de",
  "https://www.stefanheissenberg.de",
  "http://127.0.0.1:3003",
  "http://localhost:3003",
  "https://applicaiton.vercel.app",
];

function getCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin");
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// #region agent log
async function debugLog(payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch(
      "http://127.0.0.1:7336/ingest/d59e9ced-9d47-44ed-8229-0f50553ae11f",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "7e412f",
        },
        body: JSON.stringify({ sessionId: "7e412f", ...payload }),
      }
    );
  } catch {
    // non-blocking — debug log failures must never affect the request
  }
}
// #endregion

async function handler(req: Request) {
  const rootSpan = trace.getActiveSpan();
  after(async () => {
    rootSpan?.end();
  });
  after(async () => {
    await langfuseSpanProcessor.forceFlush();
  });

  const ip = getClientIp(req);

  // #region agent log
  void debugLog({ hypothesisId: "H2", event: "ratelimit.before" });
  // #endregion

  let limitResult: Awaited<ReturnType<typeof ratelimit.limit>>;
  try {
    limitResult = await ratelimit.limit(ip);
  } catch (rlError) {
    const rlName = rlError instanceof Error ? rlError.name : "UnknownError";
    const rlMsg = rlError instanceof Error ? rlError.message : String(rlError);
    console.error("[api/chat] error: ratelimit failed:", rlName, rlMsg);
    // #region agent log
    void debugLog({ hypothesisId: "H2", event: "ratelimit.error", errorName: rlName });
    // #endregion
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 503, headers: getCorsHeaders(req) }
    );
  }

  const { success, reset, remaining, limit } = limitResult;

  // #region agent log
  void debugLog({ hypothesisId: "H2", event: "ratelimit.success", success, remaining });
  // #endregion

  if (!success) {
    return Response.json(
      { error: "Rate limit exceeded. Please try again in a moment." },
      {
        status: 429,
        headers: {
          ...getCorsHeaders(req),
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
      return Response.json(
        { error: "messages required" },
        { status: 400, headers: getCorsHeaders(req) }
      );
    }

    const validatedMessages = await validateUIMessages({ messages });

    const validSessionId =
      typeof sessionId === "string" && sessionId.length > 0
        ? sessionId
        : crypto.randomUUID();

    const userTexts = validatedMessages
      .filter((m) => m.role === "user")
      .map(
        (m) =>
          m.parts
            ?.filter((p) => p.type === "text")
            ?.map((p) => p.text)
            ?.join("") ?? ""
      );
    const lastUserText = userTexts[userTexts.length - 1] ?? "";

    setActiveTraceIO({ input: lastUserText });

    trace.getActiveSpan()?.setAttribute("session.id", validSessionId);

    const system = await buildSystemPrompt();
    let matched: ContextEntry | null = null;
    try {
      matched = await matchContext(userTexts);
    } catch (err) {
      console.error("[api/chat] context loader failed:", err);
    }
    const contextBlock = matched ? "\n\n" + buildContextBlock(matched) : "";
    const systemWithContext = matched ? system + contextBlock : system;

    if (matched?.slug) {
      trace.getActiveSpan()?.setAttribute("context.loaded", matched.slug);
    }

    // #region agent log
    void debugLog({
      hypothesisId: "H3",
      event: "streamText.before",
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    });
    // #endregion

    const result = streamText({
      model: anthropic(process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5"),
      system: systemWithContext,
      messages: await convertToModelMessages(validatedMessages),
      maxRetries: 4,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "chat-stream",
      },
      onFinish: (event) => {
        setActiveTraceIO({ output: event.text });
      },
      onError: (event) => {
        const errMsg = String(event.error);
        setActiveTraceIO({ output: errMsg });
      },
    });

    return result.toUIMessageStreamResponse({
      headers: {
        ...getCorsHeaders(req),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (error) {
    const errName = error instanceof Error ? error.name : "UnknownError";
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[api/chat] error:", errName, errMsg);
    // #region agent log
    void debugLog({
      hypothesisId: "H2/H3",
      event: "catch",
      errorName: errName,
      errorMessage: errMsg.slice(0, 120),
    });
    // #endregion
    return Response.json(
      { error: "Something went wrong" },
      { status: 500, headers: getCorsHeaders(req) }
    );
  }
}

export const POST = observe(handler, {
  name: "chat-stream",
  endOnExit: false,
});

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}