import fs from "node:fs";
import { FORMAL_SIKU_EDGES, SIKU_EDGES, SIKU_LINEAGE_REVIEW } from "../app/world/sikuLineage";
import { SIKU_REVIEW_RULE_KEYS, sikuEdgeKey } from "../app/world/sikuLineageReview";

type CatalogEntry = { title: string; bookId?: string };
const catalog = JSON.parse(fs.readFileSync(new URL("../public/siku/catalog.json", import.meta.url), "utf8")) as CatalogEntry[];
const ids = new Set(catalog.flatMap((entry) => [entry.bookId, `目:${entry.title}`].filter(Boolean) as string[]));
const errors: string[] = [];
const seenFormal = new Set<string>();
const seenOriginal = new Set<string>();

for (const edge of SIKU_EDGES) {
  const key = sikuEdgeKey(edge);
  if (seenOriginal.has(key)) errors.push(`duplicate original edge: ${key}`);
  seenOriginal.add(key);
}

for (const key of SIKU_REVIEW_RULE_KEYS) {
  if (!seenOriginal.has(key)) errors.push(`review rule does not match an original edge: ${key}`);
}

for (const edge of FORMAL_SIKU_EDGES) {
  const key = sikuEdgeKey(edge);
  if (!ids.has(edge.from)) errors.push(`missing source endpoint: ${edge.from}`);
  if (!ids.has(edge.to)) errors.push(`missing target endpoint: ${edge.to}`);
  if (edge.from === edge.to) errors.push(`self edge: ${key}`);
  if (seenFormal.has(key)) errors.push(`duplicate formal edge: ${key}`);
  seenFormal.add(key);
}

if (SIKU_LINEAGE_REVIEW.length !== SIKU_EDGES.length) {
  errors.push(`review coverage mismatch: ${SIKU_LINEAGE_REVIEW.length}/${SIKU_EDGES.length}`);
}

const byStatus = SIKU_LINEAGE_REVIEW.reduce<Record<string, number>>((acc, edge) => {
  acc[edge.review.status] = (acc[edge.review.status] ?? 0) + 1;
  return acc;
}, { accepted: 0, corrected: 0, pending: 0, rejected: 0 });
const byGrade = SIKU_LINEAGE_REVIEW.reduce<Record<string, number>>((acc, edge) => {
  acc[edge.review.grade] = (acc[edge.review.grade] ?? 0) + 1;
  return acc;
}, {});
const byType = FORMAL_SIKU_EDGES.reduce<Record<string, number>>((acc, edge) => {
  acc[edge.type] = (acc[edge.type] ?? 0) + 1;
  return acc;
}, {});

console.log(`Original Chinese edges: ${SIKU_EDGES.length}`);
console.log(`Reviewed: ${SIKU_LINEAGE_REVIEW.length} (coverage 100%)`);
console.log(`Status: ${Object.entries(byStatus).map(([key, n]) => `${key} ${n}`).join(" · ")}`);
console.log(`Evidence grade: ${Object.entries(byGrade).map(([key, n]) => `${key} ${n}`).join(" · ")}`);
console.log(`Formal graph: ${FORMAL_SIKU_EDGES.length} edges`);
console.log(`Relations: ${Object.entries(byType).map(([key, n]) => `${key} ${n}`).join(" · ")}`);

const corrected = SIKU_LINEAGE_REVIEW.filter((edge) => edge.review.status === "corrected");
for (const edge of corrected) {
  const before = edge.review.original;
  console.log(`  ${edge.review.id}: ${before.from} → ${before.to} [${before.type}]  =>  ${edge.from} → ${edge.to} [${edge.type}]`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Audit passed: review coverage, rule matching, endpoints, uniqueness, and self-edge checks are valid.");
}
