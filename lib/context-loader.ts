import { Redis } from "@upstash/redis";
import matter from "gray-matter";

const redis = Redis.fromEnv();

const ACTIVE_STATUSES = new Set([
  "pre_application",
  "submitted",
  "interviewing",
  "offer_stage",
]);

export type ContextEntry = {
  slug: string;
  keywords: string[];
  status: string;
  disclosureLevel: string;
  body: string;
};

let indexPromise: Promise<ContextEntry[]> | null = null;

function loadIndex(): Promise<ContextEntry[]> {
  if (indexPromise) return indexPromise;

  indexPromise = (async (): Promise<ContextEntry[]> => {
    try {
      const entries: ContextEntry[] = [];
      let cursor = "0";

      do {
        const [nextCursor, keys] = await redis.scan(cursor, {
          match: "ctx:*",
          count: 100,
        });
        cursor = nextCursor as string;

        for (const key of keys as string[]) {
          try {
            const raw = await redis.get<string>(key);
            if (typeof raw !== "string" || !raw) continue;

            const { data, content } = matter(raw);

            if (
              !data.application_status ||
              !ACTIVE_STATUSES.has(data.application_status)
            ) {
              continue;
            }

            const rawKeywords: unknown = data.trigger_keywords;
            let keywords: string[] = [];
            if (typeof rawKeywords === "string") {
              keywords = [rawKeywords.toLowerCase()];
            } else if (Array.isArray(rawKeywords)) {
              keywords = rawKeywords
                .filter((k): k is string => typeof k === "string")
                .map((k) => k.toLowerCase());
            }
            if (keywords.length === 0) continue;

            entries.push({
              slug: key.startsWith("ctx:") ? key.slice(4) : key,
              status: data.application_status as string,
              disclosureLevel:
                typeof data.disclosure_level === "string"
                  ? data.disclosure_level
                  : "",
              keywords,
              body: content.trim(),
            });
          } catch (err) {
            console.error("[context-loader]", "Failed to parse key", key, err);
          }
        }
      } while (cursor !== "0");

      entries.sort((a, b) => a.slug.localeCompare(b.slug));
      return entries;
    } catch (err) {
      console.error("[context-loader]", "Failed to load index", err);
      return [];
    }
  })();

  return indexPromise;
}

export async function matchContext(
  userTexts: string[]
): Promise<ContextEntry | null> {
  try {
    const index = await loadIndex();
    if (index.length === 0) return null;

    for (const msg of userTexts) {
      const lowerMsg = msg.toLowerCase();
      for (const entry of index) {
        for (const keyword of entry.keywords) {
          if (lowerMsg.includes(keyword)) {
            return entry;
          }
        }
      }
    }
    return null;
  } catch (error) {
    console.error("[context-loader] matchContext failed:", error);
    return null;
  }
}

export function buildContextBlock(entry: ContextEntry): string {
  return `=== Additional context for this conversation ===

The following is Stefan's calibrated reasoning for the company the user has mentioned. Treat it as additional grounding alongside the base knowledge. Lead with what Stefan has built; do not volunteer the "honest gaps" sections unless the recruiter explicitly asks about weaknesses, mismatches, or technical depth.

${entry.body}

=== End additional context ===`;
}
