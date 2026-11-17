import { translateToVernacular } from "./dialogue";

const DB_NAME = "worldlit-chapter-translations-v1";
const STORE = "chunks";

function openCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function cached(key: string): Promise<string | null> {
  try {
    const db = await openCache();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(key);
      request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

async function save(key: string, value: string): Promise<void> {
  try {
    const db = await openCache();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // A full or unavailable browser cache must not hide a completed translation.
  }
}

function fingerprint(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return `${text.length}-${(h >>> 0).toString(36)}`;
}

export function chapterChunks(content: string): string[] {
  const paragraphs = content.replace(/\r\n?/g, "\n").split(/\n{2,}/).filter(Boolean);
  const parts: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    // Split unusually long paragraphs too; each request stays within the model output limit.
    const pieces = paragraph.match(/[\s\S]{1,1800}/g) ?? [];
    for (const piece of pieces) {
      if (current && current.length + piece.length + 2 > 1800) {
        parts.push(current);
        current = "";
      }
      current = current ? `${current}\n\n${piece}` : piece;
    }
  }
  if (current) parts.push(current);
  return parts;
}

export async function translateChapter(
  editionId: string,
  chapter: number,
  content: string,
  source: string,
  onProgress: (done: number, total: number, text: string) => void,
): Promise<string> {
  const chunks = chapterChunks(content);
  const translated: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const key = `${editionId}/${chapter}/${fingerprint(content)}/${i}`;
    let result = await cached(key);
    if (!result) {
      result = await translateToVernacular(chunks[i], undefined, undefined, source, "enChapter");
      if (!result?.trim()) throw new Error(`第 ${i + 1} 段翻译失败，请稍后重试。`);
      result = result.trim();
      await save(key, result);
    }
    translated.push(result);
    onProgress(i + 1, chunks.length, translated.join("\n\n"));
  }
  return translated.join("\n\n");
}
