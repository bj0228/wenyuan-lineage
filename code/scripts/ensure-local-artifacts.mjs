#!/usr/bin/env node

/**
 * Create non-sensitive fallbacks for generated research artifacts.
 *
 * Full vectors and persona registries remain local and are ignored by Git. A fresh
 * public clone can still build: semantic retrieval falls back to keywords, and the
 * interface uses the hand-authored core personas already present in the source.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const fallbacks = [
  {
    path: "app/world/canon-vectors.ts",
    content:
      "/** Local generated artifact not included in the public repository. */\n" +
      "export const CANON_VECTORS: Record<string, number[]> = {};\n",
  },
  {
    path: "app/world/generated-personas.ts",
    content:
      'import type { Persona } from "./characters";\n\n' +
      "/** Local generated artifact not included in the public repository. */\n" +
      "export const generatedPersonas: Persona[] = [];\n",
  },
  {
    path: "public/data/persona-directory.json",
    content: "[]\n",
  },
];

for (const artifact of fallbacks) {
  const target = resolve(root, artifact.path);
  if (existsSync(target)) continue;
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, artifact.content, "utf8");
  console.log(`Created local fallback: ${artifact.path}`);
}
