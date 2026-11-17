/** Generate a small, projected SVG basemap from Natural Earth 1:50m GeoJSON. */
import fs from "node:fs";

const input = process.argv[2];
if (!input) throw new Error("Pass the Natural Earth countries GeoJSON path");
const geo = JSON.parse(fs.readFileSync(input, "utf8"));
const wanted = new Set(["China", "Taiwan", "Mongolia", "India", "Nepal", "Myanmar", "Vietnam", "Laos", "North Korea", "South Korea", "Bhutan", "Pakistan", "Bangladesh", "Thailand", "Japan"]);
const x = (lon) => 45 + (lon - 72) * 13.6;
const y = (lat) => 53 + (54 - lat) * 15.5;
const point = ([lon, lat]) => `${x(lon).toFixed(1)} ${y(lat).toFixed(1)}`;
const path = (geometry) => {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flatMap((polygon) => polygon.map((ring) => `M${ring.map(point).join("L")}Z`)).join("");
};
const features = geo.features.filter((f) => wanted.has(f.properties.ADMIN)).map((f) => ({ name: f.properties.ADMIN, path: path(f.geometry) }));
const output = `/** Natural Earth 1:50m, public domain; projected at build time. */\nexport const CULTURAL_BASEMAP = ${JSON.stringify(features)};\nexport const culturalProject = (lon: number, lat: number) => ({ x: 45 + (lon - 72) * 13.6, y: 53 + (54 - lat) * 15.5 });\n`;
fs.writeFileSync(new URL("../app/world/culturalBasemap.ts", import.meta.url), output);
console.log(`Wrote ${features.length} geographic shapes`);
