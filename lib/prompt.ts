import { readFile } from "fs/promises";
import path from "path";
import { loadKnowledge } from "./knowledge";

let cached: string | null = null;

export async function buildSystemPrompt(): Promise<string> {
  if (cached !== null) {
    return cached;
  }

  const promptPath = path.join(process.cwd(), "chatbot-prompt.txt");
  const basePrompt = await readFile(promptPath, "utf-8");
  const knowledge = await loadKnowledge();

  const result = `${basePrompt}\n\n---\n\n# KNOWLEDGE BASE\n\nThe following sections contain Stefan's knowledge folder. Use them as your source of truth.\n\n---\n\n${knowledge}`;

  cached = result;
  return result;
}
