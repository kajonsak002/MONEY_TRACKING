import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BSK = "C:\\Users\\USER\\.local\\bin\\bsk.exe";
const SESSION = "dhom";
const TAB = "377021039";
const OUT_DIR = path.resolve("screenshots");
const ARTIFACT_DIR = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\5d024d1b-308e-428b-b520-73b3c83604ed\\screenshots";

function syncContext() {
  try {
    const raw = execFileSync(BSK, ["cooperate", "sync", "--session", SESSION, "--tab-id", TAB, "--json"], { encoding: "utf-8" });
    const data = JSON.parse(raw);
    return data.context_id || null;
  } catch {
    return null;
  }
}

function bsk(cmd, ...args) {
  const ctx = syncContext();
  const cmdArgs = [cmd];
  if (ctx) cmdArgs.push("--context", ctx);
  cmdArgs.push("--session", SESSION, ...args);
  return execFileSync(BSK, cmdArgs, { encoding: "utf-8" });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function capture(name) {
  const localFile = path.join(OUT_DIR, `${name}.png`);
  const artifactFile = path.join(ARTIFACT_DIR, `${name}.png`);
  bsk("screenshot", "--tab-id", TAB, "--out", localFile);
  fs.copyFileSync(localFile, artifactFile);
  console.log(`Captured: ${name}.png`);
}

async function run() {
  // Ensure desktop window
  try {
    bsk("emulate", "--tab-id", TAB, "--off");
  } catch {}

  // 1. Capture updated Dashboard
  console.log("Navigating to /app...");
  bsk("navigate", "http://localhost:5173/app", "--tab-id", TAB);
  await delay(1500);
  capture("02-desktop-dashboard");

  // 2. Capture Admin
  console.log("Navigating to /login...");
  bsk("navigate", "http://localhost:5173/login", "--tab-id", TAB);
  await delay(1200);

  console.log("Clicking เข้าชมหน้า Admin...");
  try {
    bsk("evaluate", `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('เข้าชมหน้า Admin'));
      if (btn) btn.click();
    })()`, "--tab-id", TAB);
  } catch (e) {
    console.log("Admin click error:", e.message);
  }
  await delay(1800);
  capture("08-desktop-admin");

  // 3. Capture mobile dashboard
  console.log("Emulating mobile...");
  bsk("emulate", "--tab-id", TAB, "--device", "iphone-14");
  await delay(500);
  console.log("Navigating to /app (mobile)...");
  bsk("navigate", "http://localhost:5173/app", "--tab-id", TAB);
  await delay(1500);
  capture("09-mobile-dashboard");

  // Restore
  bsk("emulate", "--tab-id", TAB, "--off");
  console.log("Completed!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
