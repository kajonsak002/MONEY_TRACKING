import { execFileSync } from "child_process";
import fs from "fs";

const session = "bbqj";

function sync() {
  const out = execFileSync("bsk", ["cooperate", "sync", "--session", session, "--json"], { encoding: "utf-8" });
  return JSON.parse(out);
}

function evaluate(code) {
  const syncData = sync();
  return execFileSync("bsk", ["evaluate", "--session", session, "--context", syncData.context_id, code], {
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024
  });
}

const items = [
  {
    url: "https://flow.google.com/asb/ANqvLOahtkF-DFKLJJ58M8bv1rYUckFVxjkvtMuR-47-t-DwS7CifGRBVtmZ8DooPS3wK6x7adIaEEOuUWLfdZvoVulmNYUgJHkFZcLWSWCIaw3jMQxSu2TGxZ6jQPs4c7qFlom2vAqUtDKh88nPYY5NDC5AKQvKuuVmC9PfnFR-tg=s1600",
    dest: "apps/web/public/images/illustrations/card-bg-meadow.png"
  },
  {
    url: "https://flow.google.com/asb/ANqvLOZ4OjPxriCzTCPufUli3ZHhvMNdMiCmMCY-HiGwuJ0ASmKHo4ZQ7G3B91CsJzk-UhV_6WWkp-P0I6Yo1D4MRiyi6erFNOKbj5ydL6siI16YtRiBxJqufdeS8mgH_SAQSi_GNpPCdrsndF_6gUinTq5m7TmZe5uMNXDVNCRz0Q=s1600",
    dest: "apps/web/public/images/illustrations/card-bg-meadow-2.png"
  }
];

async function run() {
  for (const item of items) {
    console.log("Fetching image for", item.dest);
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
    const base64Data = evalOut.trim().replace(/^"data:image\/\w+;base64,/, "").replace(/"$/, "");
    const buffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync(item.dest, buffer);
    console.log(`Saved ${buffer.length} bytes to ${item.dest}`);
  }
}

run().catch(console.error);
