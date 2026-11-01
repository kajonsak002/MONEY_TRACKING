import { execFileSync } from "child_process";

const BSK = "C:\\Users\\USER\\.local\\bin\\bsk.exe";
const SESSION = "iumu";
const TAB = "377021517";

export function sync() {
  const out = execFileSync(BSK, ["cooperate", "sync", "--session", SESSION, "--tab-id", TAB, "--json"], {
    encoding: "utf-8"
  });
  return JSON.parse(out);
}

export function navigate(url) {
  const syncData = sync();
  return execFileSync(BSK, [
    "navigate",
    "--session", SESSION,
    "--tab-id", TAB,
    "--context", syncData.context_id,
    "--depends-on", "body",
    url
  ], { encoding: "utf-8" });
}

export function evaluate(code) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const syncData = sync();
      return execFileSync(
        BSK,
        ["evaluate", "--session", SESSION, "--tab-id", TAB, "--context", syncData.context_id, "--depends-on", "body", code],
        { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 }
      );
    } catch (err) {
      if (attempt === 4) throw err;
      execFileSync(BSK, ["wait-ms", "500"]);
    }
  }
}

import fs from "fs";

async function main() {
  const urls = [
    {
      url: "https://flow-content.google/image/9cec7994-ff1a-4619-930a-12b4035f782d?Expires=1793523100&KeyName=labs-flow-prod-cdn-key&Signature=L2aT04OKQXVMR9c6azOsakspnr4",
      dest: "apps/web/public/images/illustrations/mascot-financial-proportion.png"
    },
    {
      url: "https://flow-content.google/image/b95a1f04-a5ec-46a5-8695-00fcf4bb5e03?Expires=1793523100&KeyName=labs-flow-prod-cdn-key&Signature=9fxgWvIxNvS7vTEmZAny9fQDiJc",
      dest: "apps/web/public/images/illustrations/mascot-financial-proportion-2.png"
    }
  ];

  for (const item of urls) {
    console.log("Fetching from Flow:", item.url.slice(0, 50) + "...");
    const fetchCode = `(async () => {
      const res = await fetch(${JSON.stringify(item.url)});
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    })()`;

    const evalOut = evaluate(fetchCode);
    let dataUrl;
    try {
      dataUrl = JSON.parse(evalOut.trim());
    } catch {
      dataUrl = evalOut.trim().replace(/^"/, "").replace(/"$/, "");
    }
    const base64Data = dataUrl.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync(item.dest, buffer);
    console.log(`Saved ${buffer.length} bytes to ${item.dest}`);
  }
}

if (process.argv[1].endsWith("flow_helper.mjs")) {
  main().catch(console.error);
}
