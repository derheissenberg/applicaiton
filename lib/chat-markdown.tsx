import { Fragment, type ReactNode } from "react";

/**
 * Minimal, dependency-free markdown renderer for assistant chat messages.
 *
 * The assistant is constrained (see chatbot-prompt.txt section 4) to a small
 * markdown subset: occasional **bold**, short lists, and headings only when
 * explicitly asked. This renderer covers exactly that surface and nothing more
 * (no code blocks, tables, math, or diagrams), so we avoid pulling in a heavy
 * streaming-markdown dependency.
 *
 * Tradeoff: a half-streamed inline marker (e.g. an opening ** with no close yet)
 * renders as literal text until its closing token arrives.
 */

const SAFE_URL_SCHEME = /^(https?:|mailto:)/i;

function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim();
  return SAFE_URL_SCHEME.test(trimmed) ? trimmed : null;
}

type InlineRule = {
  re: RegExp;
  build: (match: RegExpExecArray, key: string) => ReactNode;
};

const INLINE_RULES: InlineRule[] = [
  {
    // inline code — highest priority, contents are not re-parsed
    re: /`([^`]+)`/,
    build: (m, key) => <code key={key}>{m[1]}</code>,
  },
  {
    // bold: **text** or __text__
    re: /\*\*([^*]+?)\*\*|__([^_]+?)__/,
    build: (m, key) => (
      <strong key={key}>{parseInline(m[1] ?? m[2], key)}</strong>
    ),
  },
  {
    // italic: *text* or _text_ (single line)
    re: /\*([^*\n]+?)\*|_([^_\n]+?)_/,
    build: (m, key) => <em key={key}>{parseInline(m[1] ?? m[2], key)}</em>,
  },
  {
    // markdown link: [label](url)
    re: /\[([^\]]+)\]\(([^)\s]+)\)/,
    build: (m, key) => {
      const href = sanitizeUrl(m[2]);
      if (!href) return <Fragment key={key}>{m[0]}</Fragment>;
      return (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer">
          {parseInline(m[1], key)}
        </a>
      );
    },
  },
  {
    // bare URL or www.-prefixed link
    re: /(https?:\/\/[^\s<]+|www\.[^\s<]+)/,
    build: (m, key) => {
      let raw = m[1];
      let trailing = "";
      const trailingMatch = raw.match(/[).,!?;:]+$/);
      if (trailingMatch) {
        trailing = trailingMatch[0];
        raw = raw.slice(0, -trailing.length);
      }
      const href = raw.startsWith("www.") ? `https://${raw}` : raw;
      return (
        <Fragment key={key}>
          <a href={href} target="_blank" rel="noopener noreferrer">
            {raw}
          </a>
          {trailing}
        </Fragment>
      );
    },
  },
  {
    // email address
    re: /[\w.+-]+@[\w-]+\.[\w.-]+/,
    build: (m, key) => (
      <a key={key} href={`mailto:${m[0]}`}>
        {m[0]}
      </a>
    ),
  },
];

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  if (!text) return [];

  let best: { index: number; rule: InlineRule; match: RegExpExecArray } | null =
    null;
  for (const rule of INLINE_RULES) {
    const match = rule.re.exec(text);
    if (match && (best === null || match.index < best.index)) {
      best = { index: match.index, rule, match };
    }
  }

  if (!best) return [text];

  const nodes: ReactNode[] = [];
  if (best.index > 0) nodes.push(text.slice(0, best.index));
  nodes.push(best.rule.build(best.match, `${keyPrefix}-${best.index}`));
  const rest = text.slice(best.index + best.match[0].length);
  nodes.push(...parseInline(rest, `${keyPrefix}r${best.index}`));
  return nodes;
}

const UNORDERED_ITEM = /^\s*[-*+]\s+/;
const ORDERED_ITEM = /^\s*\d+\.\s+/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const HEADING_TAGS = ["h2", "h3", "h4"] as const;

function parseBlocks(source: string): ReactNode[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let key = 0;
  let i = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const k = `p-${key++}`;
    blocks.push(<p key={k}>{parseInline(paragraph.join(" "), k)}</p>);
    paragraph = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      flushParagraph();
      i++;
      continue;
    }

    const heading = HEADING.exec(trimmed);
    if (heading) {
      flushParagraph();
      const level = Math.min(heading[1].length, HEADING_TAGS.length);
      const Tag = HEADING_TAGS[level - 1];
      const k = `h-${key++}`;
      blocks.push(<Tag key={k}>{parseInline(heading[2], k)}</Tag>);
      i++;
      continue;
    }

    if (UNORDERED_ITEM.test(line)) {
      flushParagraph();
      const items: ReactNode[] = [];
      while (i < lines.length && UNORDERED_ITEM.test(lines[i])) {
        const k = `li-${key++}`;
        const content = lines[i].replace(UNORDERED_ITEM, "");
        items.push(<li key={k}>{parseInline(content, k)}</li>);
        i++;
      }
      blocks.push(<ul key={`ul-${key++}`}>{items}</ul>);
      continue;
    }

    if (ORDERED_ITEM.test(line)) {
      flushParagraph();
      const items: ReactNode[] = [];
      while (i < lines.length && ORDERED_ITEM.test(lines[i])) {
        const k = `li-${key++}`;
        const content = lines[i].replace(ORDERED_ITEM, "");
        items.push(<li key={k}>{parseInline(content, k)}</li>);
        i++;
      }
      blocks.push(<ol key={`ol-${key++}`}>{items}</ol>);
      continue;
    }

    paragraph.push(trimmed);
    i++;
  }

  flushParagraph();
  return blocks;
}

export function ChatMarkdown({ text }: { text: string }) {
  return <>{parseBlocks(text)}</>;
}
