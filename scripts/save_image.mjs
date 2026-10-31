import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const [,, url, outputPath] = process.argv;

if (!url || !outputPath) {
  console.error("Usage: node scripts/save_image.mjs <url> <outputPath>");
  process.exit(1);
}

// 1. Sync session dhom to get context
const syncOut = execFileSync("bsk", ["cooperate", "sync", "--session", "dhom", "--json"], { encoding: "utf-8" });
const syncData = JSON.parse(syncOut);
const contextId = syncData.context_id;

// 2. Fetch image base64 in browser context
const code = `(async () => {
  const res = await fetch(${JSON.stringify(url)});
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
})()`;

const evalOut = execFileSync("bsk", ["evaluate", "--session", "dhom", "--context", contextId, code], {
  encoding: "utf-8",
  maxBuffer: 50 * 1024 * 1024
});

const base64Data = evalOut.trim().replace(/^data:image\/\w+;base64,/, "");
const buffer = Buffer.from(base64Data, "base64");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, buffer);
console.log(`Saved ${buffer.length} bytes to ${outputPath}`);
