import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BSK = "C:\\Users\\USER\\.local\\bin\\bsk.exe";
const SESSION = "dhom";
const TAB = "377021039";
const OUT_DIR = path.resolve("screenshots");
const ARTIFACT_DIR = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\5d024d1b-308e-428b-b520-73b3c83604ed\\screenshots";

function syncContext() {
  for (let i = 0; i < 5; i++) {
    try {
      execFileSync(BSK, ["cooperate", "wait", "--session", SESSION, "--tab-id", TAB], { encoding: "utf-8" });
    } catch {}
    try {
      const raw = execFileSync(BSK, ["cooperate", "sync", "--session", SESSION, "--tab-id", TAB, "--json"], { encoding: "utf-8" });
      const data = JSON.parse(raw);
      if (data.context_id) return data.context_id;
    } catch {}
  }
  return null;
}

function bsk(cmd, ...args) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const ctx = syncContext();
      const cmdArgs = [cmd];
      if (ctx) cmdArgs.push("--context", ctx);
      cmdArgs.push("--session", SESSION, ...args);
      return execFileSync(BSK, cmdArgs, { encoding: "utf-8" });
    } catch (e) {
      if (attempt === 4) throw e;
    }
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("Navigating directly to /admin?role=admin...");
  bsk("navigate", "http://localhost:5173/admin?role=admin", "--tab-id", TAB);
  await delay(2000);

  const localFile = path.join(OUT_DIR, "08-desktop-admin.png");
  const artifactFile = path.join(ARTIFACT_DIR, "08-desktop-admin.png");
  bsk("screenshot", "--tab-id", TAB, "--out", localFile);
  fs.copyFileSync(localFile, artifactFile);
  console.log("Admin screenshot successfully captured!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
