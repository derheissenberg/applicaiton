import fs from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import matter from "gray-matter";

// Lazy: only construct the client when the Upstash path is actually taken.
// Redis.fromEnv() throws if creds are absent, so eager construction would make
// the module unimportable in a fixtures-only run (CONTEXT_FIXTURES with no
// Upstash env). Constructing on demand keeps the fixtures path fully offline.
let redisClient: Redis | null = null;
function getRedis(): Redis {
  if (!redisClient) redisClient = Redis.fromEnv();
  return redisClient;
}

const ACTIVE_STATUSES = new Set([
  "pre_application",
  "submitted",
  "interviewing",
  "offer_stage",
]);

const FIXTURES_DIR = path.join(
  process.cwd(),
  "evals",
  "fixtures",
  "contexts"
);

export type ContextEntry = {
  slug: string;
  keywords: string[];
  status: string;
  disclosureLevel: string;
  body: string;
};

let indexPromise: Promise<ContextEntry[]> | null = null;

function shouldLoadFixtures(): boolean {
  const value = process.env.EVAL_CONTEXT_FIXTURES?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

function parseContextEntry(
  data: Record<string, unknown>,
  content: string,
  slug: string
): ContextEntry | null {
  if (
    !data.application_status ||
    !ACTIVE_STATUSES.has(data.application_status as string)
  ) {
    return null;
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
  if (keywords.length === 0) return null;

  return {
    slug,
    status: data.application_status as string,
    disclosureLevel:
      typeof data.disclosure_level === "string" ? data.disclosure_level : "",
    keywords,
    body: content.trim(),
  };
}

async function loadFixtureEntries(): Promise<ContextEntry[]> {
  const entries: ContextEntry[] = [];

  if (!fs.existsSync(FIXTURES_DIR)) {
    return entries;
  }

  const files = fs.readdirSync(FIXTURES_DIR).filter((name) => name.endsWith(".md"));

  for (const filename of files) {
    const filepath = path.join(FIXTURES_DIR, filename);
    try {
      const raw = fs.readFileSync(filepath, "utf-8");
      const { data, content } = matter(raw);
      const slug = filename.replace(/\.md$/, "");
      const entry = parseContextEntry(
        data as Record<string, unknown>,
        content,
        slug
      );
      if (entry) entries.push(entry);
    } catch (err) {
      console.error(
        "[context-loader]",
        "Failed to parse fixture",
        filename,
        err
      );
    }
  }

  return entries;
}

async function loadUpstashEntries(): Promise<ContextEntry[]> {
  const entries: ContextEntry[] = [];
  let cursor = "0";

  do {
    const [nextCursor, keys] = await getRedis().scan(cursor, {
      match: "ctx:*",
      count: 100,
    });
    cursor = nextCursor as string;

    for (const key of keys as string[]) {
      try {
        const raw = await getRedis().get<string>(key);
        if (typeof raw !== "string" || !raw) continue;

        const { data, content } = matter(raw);
        const slug = key.startsWith("ctx:") ? key.slice(4) : key;
        const entry = parseContextEntry(
          data as Record<string, unknown>,
          content,
          slug
        );
        if (entry) entries.push(entry);
      } catch (err) {
        console.error("[context-loader]", "Failed to parse key", key, err);
      }
    }
  } while (cursor !== "0");

  return entries;
}

function loadIndex(): Promise<ContextEntry[]> {
  if (indexPromise) return indexPromise;

  indexPromise = (async (): Promise<ContextEntry[]> => {
    try {
      // Fixtures REPLACE Upstash when enabled — they do not merge. Merging would
      // still hit Upstash (network + live ctx:* keys), defeating the point of a
      // deterministic, offline eval run. Prod leaves the flag unset → Upstash.
      const entries: ContextEntry[] = shouldLoadFixtures()
        ? await loadFixtureEntries()
        : await loadUpstashEntries();
      entries.sort((a, b) => a.slug.localeCompare(b.slug));
      return entries;
    } catch (err) {
      // F2: reset the cache so a transient load failure (Upstash timeout OR a
      // fixture read error) retries on the next request instead of caching [].
      console.error("[context-loader]", "Failed to load index", err);
      indexPromise = null;
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
