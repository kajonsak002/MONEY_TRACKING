import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BSK = "C:\\Users\\USER\\.local\\bin\\bsk.exe";

function getActiveSessionAndTab() {
  const sessionsRaw = execFileSync(BSK, ["session", "list"], { encoding: "utf-8" });
  const lines = sessionsRaw.trim().split("\n").map(l => l.trim()).filter(Boolean);
  // header: SESSION INSTANCE ...
  let session = "ypyv";
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/\s+/);
    if (parts[0]) {
      session = parts[0];
      break;
    }
  }

  const tabsRaw = execFileSync(BSK, ["tab", "list", "--session", session], { encoding: "utf-8" });
  const tabLines = tabsRaw.trim().split("\n").map(l => l.trim()).filter(Boolean);
  let tab = null;
  for (let i = 1; i < tabLines.length; i++) {
    const parts = tabLines[i].split(/\s+/);
    if (parts[1] === "agent") {
      tab = parts[0];
      break;
    }
  }
  if (!tab && tabLines[1]) tab = tabLines[1].split(/\s+/)[0];

  return { session, tab };
}

const { session: SESSION, tab: TAB } = getActiveSessionAndTab();
console.log(`Using active session: ${SESSION}, tab: ${TAB}`);
const OUT_DIR = path.resolve("screenshots");
const ARTIFACT_DIR = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\5d024d1b-308e-428b-b520-73b3c83604ed\\screenshots";

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

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
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ctx = syncContext();
      const cmdArgs = [cmd];
      if (ctx) cmdArgs.push("--context", ctx);
      cmdArgs.push("--session", SESSION, ...args);
      return execFileSync(BSK, cmdArgs, { encoding: "utf-8" });
    } catch (e) {
      if (attempt === 2) throw e;
    }
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function capture(name, fullPage = false) {
  const localFile = path.join(OUT_DIR, `${name}.png`);
  const artifactFile = path.join(ARTIFACT_DIR, `${name}.png`);
  
  const args = ["--tab-id", TAB, "--out", localFile];
  if (fullPage) args.push("--full-page");
  
  bsk("screenshot", ...args);
  fs.copyFileSync(localFile, artifactFile);
  console.log(`Saved screenshot: ${name}.png`);
}

async function run() {
  console.log("Setting desktop window 1440x900...");
  try {
    const ctx = syncContext();
    execFileSync(BSK, ["window", "resize", "--session", SESSION, "--width", "1440", "--height", "900"], { encoding: "utf-8" });
  } catch (e) {
    console.log("Window resize notice:", e.message);
  }
  try {
    bsk("emulate", "--tab-id", TAB, "--off");
  } catch {}

  // 1. Desktop Login Page
  console.log("Navigating to /login...");
  bsk("navigate", "http://localhost:5173/login", "--tab-id", TAB);
  await delay(1500);
  capture("01-desktop-login");

  // 2. Desktop Dashboard (Member mode)
  console.log("Navigating to /app?role=partner...");
  bsk("navigate", "http://localhost:5173/app?role=partner", "--tab-id", TAB);
  await delay(2000);
  capture("02-desktop-dashboard");

  // 3. Desktop Entries (Transactions)
  console.log("Navigating to /app/entries...");
  bsk("navigate", "http://localhost:5173/app/entries", "--tab-id", TAB);
  await delay(1500);
  capture("03-desktop-entries");

  // 4. Desktop Summary (Reports)
  console.log("Navigating to /app/summary...");
  bsk("navigate", "http://localhost:5173/app/summary", "--tab-id", TAB);
  await delay(1500);
  capture("04-desktop-summary");

  // 5. Desktop Budget
  console.log("Navigating to /app/budget...");
  bsk("navigate", "http://localhost:5173/app/budget", "--tab-id", TAB);
  await delay(1500);
  capture("05-desktop-budget");

  // 6. Desktop Categories
  console.log("Navigating to /app/categories...");
  bsk("navigate", "http://localhost:5173/app/categories", "--tab-id", TAB);
  await delay(1500);
  capture("06-desktop-categories");

  // 7. Desktop Settings
  console.log("Navigating to /app/settings...");
  bsk("navigate", "http://localhost:5173/app/settings", "--tab-id", TAB);
  await delay(1500);
  capture("07-desktop-settings");

  // 8. Desktop Admin
  console.log("Navigating to /admin?role=admin...");
  bsk("navigate", "http://localhost:5173/admin?role=admin", "--tab-id", TAB);
  await delay(2000);
  capture("08-desktop-admin");

  // 9. Mobile Emulation (iPhone 14: 390x844)
  console.log("Setting iPhone 14 mobile emulation...");
  bsk("emulate", "--tab-id", TAB, "--device", "iphone-14");
  await delay(600);

  // Mobile Dashboard
  console.log("Navigating to /app (Mobile)...");
  bsk("navigate", "http://localhost:5173/app?role=partner", "--tab-id", TAB);
  await delay(1500);
  capture("09-mobile-dashboard");

  // Mobile Entries
  console.log("Navigating to /app/entries (Mobile)...");
  bsk("navigate", "http://localhost:5173/app/entries", "--tab-id", TAB);
  await delay(1500);
  capture("10-mobile-entries");

  // Mobile Budget
  console.log("Navigating to /app/budget (Mobile)...");
  bsk("navigate", "http://localhost:5173/app/budget", "--tab-id", TAB);
  await delay(1500);
  capture("11-mobile-budget");

  // Mobile Login
  console.log("Navigating to /login (Mobile)...");
  bsk("navigate", "http://localhost:5173/login", "--tab-id", TAB);
  await delay(1500);
  capture("12-mobile-login");

  // Restore Emulation
  console.log("Restoring emulation...");
  bsk("emulate", "--tab-id", TAB, "--off");

  console.log("All updated screenshots captured successfully!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
