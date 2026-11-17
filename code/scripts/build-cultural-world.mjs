/** Generate a compact equirectangular world basemap from Natural Earth. */
import fs from "node:fs";

const input = process.argv[2];
if (!input) throw new Error("Pass the Natural Earth countries GeoJSON path");
const geo = JSON.parse(fs.readFileSync(input, "utf8"));
const x = (lon) => 36 + (lon + 180) * (928 / 360);
const y = (lat) => 45 + (84 - lat) * (600 / 144);
const point = ([lon, lat]) => `${x(lon).toFixed(1)} ${y(lat).toFixed(1)}`;
const ringPath = (ring) => `M${ring.map(point).join("L")}Z`;
const geometryPath = (geometry) => {
  if (geometry.type === "Polygon") return geometry.coordinates.map(ringPath).join("");
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flatMap((polygon) => polygon.map(ringPath)).join("");
  return "";
};
const features = geo.features
  .map((f) => ({ name: f.properties.ADMIN || f.properties.NAME || "", path: geometryPath(f.geometry) }))
  .filter((f) => f.path);
const output = `/** Natural Earth 1:110m, public domain; projected at build time. */\nexport const CULTURAL_WORLD_BASEMAP = ${JSON.stringify(features)};\nexport const culturalWorldProject = (lon: number, lat: number) => ({ x: 36 + (lon + 180) * (928 / 360), y: 45 + (84 - lat) * (600 / 144) });\n`;
fs.writeFileSync(new URL("../app/world/culturalWorldBasemap.ts", import.meta.url), output);
console.log(`Wrote ${features.length} world shapes`);
