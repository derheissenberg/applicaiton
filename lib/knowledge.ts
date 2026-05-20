import { readdir, readFile } from "fs/promises";
import path from "path";

export async function loadKnowledge(): Promise<string> {
  const knowledgeDir = path.join(process.cwd(), "knowledge");

  let entries;
  try {
    entries = await readdir(knowledgeDir, { withFileTypes: true });
  } catch {
    throw new Error(`Knowledge folder not found at ${knowledgeDir}`);
  }

  const files: Array<{ type: "file"; path: string; name: string } | { type: "dir"; path: string; name: string; sortKey: number }> = [];

  for (const entry of entries) {
    const name = entry.name;

    if (entry.isFile() && name.endsWith(".md") && !name.startsWith(".")) {
      files.push({
        type: "file",
        path: path.join(knowledgeDir, name),
        name: `knowledge/${name}`,
      });
    } else if (entry.isDirectory() && name === "06-case-studies") {
      const numericMatch = name.match(/^(\d+)/);
      const sortKey = numericMatch ? parseInt(numericMatch[1], 10) : 999;
      files.push({
        type: "dir",
        path: path.join(knowledgeDir, name),
        name,
        sortKey,
      });
    }
  }

  if (files.length === 0) {
    throw new Error(`No loadable .md files found in ${knowledgeDir}`);
  }

  files.sort((a, b) => {
    const getSortKey = (item: typeof a) => {
      if (item.type === "file") {
        const numericMatch = item.name.match(/knowledge\/(\d+)/);
        return numericMatch ? parseInt(numericMatch[1], 10) : 999;
      }
      return item.sortKey;
    };
    return getSortKey(a) - getSortKey(b);
  });

  const parts: string[] = [];

  for (const item of files) {
    if (item.type === "file") {
      const content = await readFile(item.path, "utf-8");
      parts.push(`# === FILE: ${item.name} ===\n\n${content}`);
    } else {
      const dirPath = item.path;
      let subEntries;
      try {
        subEntries = await readdir(dirPath, { withFileTypes: true });
      } catch {
        continue;
      }

      const mdFiles = subEntries
        .filter((e) => e.isFile() && e.name.endsWith(".md") && !e.name.startsWith("."))
        .map((e) => e.name)
        .sort();

      for (const mdFile of mdFiles) {
        const filePath = path.join(dirPath, mdFile);
        const content = await readFile(filePath, "utf-8");
        parts.push(`# === FILE: knowledge/06-case-studies/${mdFile} ===\n\n${content}`);
      }
    }
  }

  return parts.join("\n\n");
}

const isDirectRun = process.argv[1]?.includes("knowledge");
if (isDirectRun) {
  loadKnowledge().then((s) => console.log(s.length, "characters"));
}
