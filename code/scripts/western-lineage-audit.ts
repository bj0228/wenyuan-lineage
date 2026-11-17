import { WESTERN_CANON } from "../app/world/westernCanon";
import { WESTERN_LINEAGE_CANDIDATES } from "../app/world/westernLineage";

const ids = new Set(WESTERN_CANON.map((e) => `wl:${e.id}`));
const accepted = WESTERN_LINEAGE_CANDIDATES.filter((e) => e.review.status === "accepted");
const rejected = WESTERN_LINEAGE_CANDIDATES.filter((e) => e.review.status === "rejected");
const errors: string[] = [];
const seen = new Set<string>();

for (const edge of accepted) {
  if (!ids.has(edge.from)) errors.push(`${edge.id}: missing source endpoint ${edge.from}`);
  if (!ids.has(edge.to)) errors.push(`${edge.id}: missing target endpoint ${edge.to}`);
  if (edge.from === edge.to) errors.push(`${edge.id}: self edge`);
  const key = `${edge.from}|${edge.to}|${edge.type}`;
  if (seen.has(key)) errors.push(`${edge.id}: duplicate ${key}`);
  seen.add(key);
  if (!edge.evidence?.source) errors.push(`${edge.id}: missing evidence source`);
  if (!edge.evidence?.quote && !edge.evidence?.summary) errors.push(`${edge.id}: missing evidence content`);
}

const byType = accepted.reduce<Record<string, number>>((acc, edge) => {
  acc[edge.type] = (acc[edge.type] ?? 0) + 1;
  return acc;
}, {});

console.log(`Western canon: ${WESTERN_CANON.length} works`);
console.log(`Candidates: ${WESTERN_LINEAGE_CANDIDATES.length}`);
console.log(`Accepted: ${accepted.length}; rejected: ${rejected.length}`);
console.log(`Relations: ${Object.entries(byType).map(([k, n]) => `${k} ${n}`).join(" · ")}`);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Audit passed: endpoints, uniqueness, and evidence are valid.");
}
