/** User-facing message for useChat / stream errors (no secrets). */
export function formatChatErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  const lower = raw.toLowerCase();

  if (lower.includes("rate limit exceeded")) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (lower.includes("overloaded") || lower.includes("failed after")) {
    return "The AI service is busy right now. Please try again in a few seconds.";
  }

  if (lower.includes("messages required")) {
    return "Please enter a message.";
  }

  return "Something went wrong. Try again.";
}
