/**
 * Chat client for evals - streams responses from the chat API
 * Uses AI SDK UI message stream format (line-delimited JSON)
 */

import type { UIMessage } from "ai";

const EVAL_BASE_URL = process.env.EVAL_BASE_URL || "https://applicaiton.vercel.app";

export interface ChatClientOptions {
  sessionId: string;
  messages: Array<{ role: "user"; parts: Array<{ type: "text"; text: string }> }>;
}

export interface ChatResponse {
  text: string;
}

/**
 * Stream chat response from the API and extract assistant text.
 * Parses the AI SDK UI message stream format.
 */
export async function streamChat(options: ChatClientOptions): Promise<ChatResponse> {
  const url = `${EVAL_BASE_URL}/api/chat`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: options.sessionId,
      messages: options.messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${body || response.statusText}`);
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  // Parse the stream using AI SDK UI message format
  // Each line is a JSON-encoded UIMessageChunk
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue;

        // SSE format: lines start with "data: "
        const jsonStr = trimmed.startsWith("data: ")
          ? trimmed.slice(6) // Remove "data: " prefix
          : trimmed;

        if (jsonStr === "[DONE]") continue;
        if (!jsonStr) continue;

        try {
          const chunk = JSON.parse(jsonStr);
          // AI SDK UI message stream chunks have various types
          // We care about 'text-delta' which contains text fragments
          if (chunk.type === "text-delta" && chunk.delta) {
            fullText += chunk.delta;
          }
        } catch (e) {
          // Skip malformed lines
          // console.debug("Skip malformed chunk:", jsonStr.slice(0, 100));
        }
      }
    }

    // Process any remaining buffer
    const finalBuffer = buffer.trim();
    if (finalBuffer && !finalBuffer.startsWith(":")) {
      const jsonStr = finalBuffer.startsWith("data: ")
        ? finalBuffer.slice(6)
        : finalBuffer;
      if (jsonStr !== "[DONE]" && jsonStr) {
        try {
          const chunk = JSON.parse(jsonStr);
          if (chunk.type === "text-delta" && chunk.delta) {
            fullText += chunk.delta;
          }
        } catch {
          // Ignore final parse errors
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { text: fullText.trim() };
}

/**
 * Test spike: Send one request and print the response
 */
async function spikeTest() {
  const sessionId = `spike-${Date.now()}`;
  console.log("=== Chat Client Spike Test ===");
  console.log(`Session ID: ${sessionId}`);
  console.log(`Base URL: ${EVAL_BASE_URL}`);

  try {
    const result = await streamChat({
      sessionId,
      messages: [
        {
          role: "user",
          parts: [{ type: "text", text: "Where is Stefan based?" }],
        },
      ],
    });

    console.log("\n=== Response ===");
    console.log(result.text);
    console.log("\n=== Word Count ===");
    console.log(`Words: ${result.text.split(/\s+/).length}`);
    console.log("\n=== Spike SUCCESS ===");
    process.exit(0);
  } catch (error) {
    console.error("\n=== Spike FAILED ===");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run spike if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  spikeTest();
}
