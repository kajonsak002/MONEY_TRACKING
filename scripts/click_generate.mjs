import { execFileSync } from "child_process";
const BSK = "C:\\Users\\USER\\.local\\bin\\bsk.exe";
const SESSION = "agal";
const TAB = "377021056";

function sync() {
  execFileSync(BSK, ["cooperate", "wait", "--session", SESSION, "--tab-id", TAB]);
  const raw = execFileSync(BSK, ["cooperate", "sync", "--session", SESSION, "--tab-id", TAB, "--json"], { encoding: "utf-8" });
  return JSON.parse(raw).context_id;
}

const ctx = sync();
const code = `(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  // Find the button with the arrow right icon or near the prompt box
  const arrowBtn = btns.find(b => b.querySelector('mat-icon, i, svg') && b.innerHTML.includes('arrow_forward') || b.getAttribute('aria-label') === 'สร้าง' || b.className.includes('submit'));
  if (arrowBtn) {
    arrowBtn.click();
    return 'clicked arrowBtn: ' + arrowBtn.className;
  }
  // Try finding last button inside the prompt box container
  const promptBox = document.querySelector('.ProseMirror')?.parentElement?.parentElement;
  if (promptBox) {
    const boxBtns = Array.from(promptBox.querySelectorAll('button'));
    const lastBtn = boxBtns[boxBtns.length - 1];
    if (lastBtn) {
      lastBtn.click();
      return 'clicked lastBtn: ' + lastBtn.className;
    }
  }
  return 'not found';
})()`;

const out = execFileSync(BSK, ["evaluate", "--context", ctx, "--session", SESSION, "--tab-id", TAB, code], { encoding: "utf-8" });
console.log(out);
