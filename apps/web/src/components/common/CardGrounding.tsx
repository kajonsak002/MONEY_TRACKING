/**
 * Card grounding / scenic footer components.
 * These create physical depth so mascots never feel like floating stickers.
 */

/** ─────────────────────────────────────────────
 * HillScene – organic layered hill at bottom of a card.
 * Used inside overflow-hidden cards so the mascot stands on the hill.
 * ─────────────────────────────────────────────*/
interface HillSceneProps {
  color?: "emerald" | "rose" | "lavender" | "amber" | "sage";
  className?: string;
}

export function HillScene({ color = "emerald", className = "" }: HillSceneProps) {
  const palette = {
    emerald: {
      sky: "from-[#e8f8ed]/0 to-[#d5f0dd]/60",
      hill1: "#c3e9cb",
      hill2: "#9ed5aa",
      hill3: "#82c48f",
      flower1: "#ffd166",
      flower2: "#ff9ebb",
    },
    rose: {
      sky: "from-[#fff0f2]/0 to-[#ffd9e0]/60",
      hill1: "#fddde4",
      hill2: "#f9bcc8",
      hill3: "#f4a0b0",
      flower1: "#ffd166",
      flower2: "#c4b5fd",
    },
    lavender: {
      sky: "from-[#f5f0ff]/0 to-[#e0d5ff]/60",
      hill1: "#e8dfff",
      hill2: "#cdbffc",
      hill3: "#b8a5f7",
      flower1: "#fbbf24",
      flower2: "#f9a8d4",
    },
    amber: {
      sky: "from-[#fffbeb]/0 to-[#fde8c0]/60",
      hill1: "#fde8c0",
      hill2: "#fbd09a",
      hill3: "#f7b96d",
      flower1: "#86efac",
      flower2: "#f9a8d4",
    },
    sage: {
      sky: "from-[#eef7ee]/0 to-[#d4ecda]/60",
      hill1: "#cce8d4",
      hill2: "#a8d6b4",
      hill3: "#88c49a",
      flower1: "#fcd34d",
      flower2: "#fb7185",
    },
  };

  const p = palette[color];

  return (
    <div
      className={`absolute inset-x-0 bottom-0 h-20 pointer-events-none overflow-hidden rounded-b-[inherit] z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Sky gradient fade */}
      <div className={`absolute inset-0 bg-gradient-to-t ${p.sky}`} />

      {/* Layered hills via SVG */}
      <svg
        viewBox="0 0 300 80"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        {/* Hill Layer 3 – back */}
        <path
          d="M0,60 Q60,20 120,45 Q180,68 240,30 Q270,15 300,40 L300,80 L0,80 Z"
          fill={p.hill1}
          opacity="0.6"
        />
        {/* Hill Layer 2 – mid */}
        <path
          d="M0,72 Q80,38 160,58 Q220,72 300,50 L300,80 L0,80 Z"
          fill={p.hill2}
          opacity="0.8"
        />
        {/* Hill Layer 1 – front */}
        <path
          d="M0,80 Q50,54 110,68 Q170,80 220,62 Q260,50 300,65 L300,80 Z"
          fill={p.hill3}
        />

        {/* Tiny flower clusters */}
        <circle cx="60" cy="66" r="3" fill="white" opacity="0.9" />
        <circle cx="60" cy="66" r="1.5" fill={p.flower1} />
        <circle cx="70" cy="70" r="2.5" fill="white" opacity="0.9" />
        <circle cx="70" cy="70" r="1.2" fill={p.flower2} />
        <circle cx="185" cy="65" r="2.5" fill="white" opacity="0.9" />
        <circle cx="185" cy="65" r="1.2" fill={p.flower1} />
        <circle cx="240" cy="58" r="3" fill="white" opacity="0.9" />
        <circle cx="240" cy="58" r="1.5" fill={p.flower2} />

        {/* Tiny blade grass */}
        <line x1="90" y1="68" x2="87" y2="62" stroke={p.hill3} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="92" y1="68" x2="95" y2="61" stroke={p.hill3} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="210" y1="62" x2="208" y2="56" stroke={p.hill3} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="212" y1="62" x2="215" y2="55" stroke={p.hill3} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** ─────────────────────────────────────────────
 * HeroGround – full scenic ground for the hero banner.
 * Wide meadow landscape with layered hills + trees.
 * ─────────────────────────────────────────────*/
export function HeroGround({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 h-28 pointer-events-none overflow-hidden rounded-b-[32px] z-0 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 900 112"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        {/* Far hill */}
        <path
          d="M0,90 Q150,40 300,70 Q450,95 600,50 Q720,20 900,65 L900,112 L0,112 Z"
          fill="#d4edda"
          opacity="0.5"
        />
        {/* Mid hill */}
        <path
          d="M0,105 Q100,68 200,88 Q350,110 500,78 Q650,55 900,85 L900,112 L0,112 Z"
          fill="#b8e3c2"
          opacity="0.7"
        />
        {/* Front ground */}
        <path
          d="M0,112 Q80,88 180,100 Q280,112 400,94 Q520,80 650,98 Q780,112 900,96 L900,112 Z"
          fill="#9ecfac"
        />

        {/* Flowers */}
        <circle cx="140" cy="100" r="3.5" fill="white" opacity="0.95" />
        <circle cx="140" cy="100" r="1.8" fill="#fbbf24" />
        <circle cx="155" cy="104" r="2.8" fill="white" opacity="0.9" />
        <circle cx="155" cy="104" r="1.3" fill="#f472b6" />
        <circle cx="310" cy="96" r="3" fill="white" opacity="0.95" />
        <circle cx="310" cy="96" r="1.5" fill="#fbbf24" />
        <circle cx="460" cy="90" r="3.5" fill="white" opacity="0.9" />
        <circle cx="460" cy="90" r="1.8" fill="#fb923c" />
        <circle cx="580" cy="95" r="3" fill="white" opacity="0.95" />
        <circle cx="580" cy="95" r="1.5" fill="#fbbf24" />
        <circle cx="740" cy="100" r="2.8" fill="white" opacity="0.9" />
        <circle cx="740" cy="100" r="1.3" fill="#f472b6" />
        <circle cx="820" cy="98" r="3" fill="white" opacity="0.9" />
        <circle cx="820" cy="98" r="1.5" fill="#fbbf24" />

        {/* Small trees */}
        <ellipse cx="80" cy="78" rx="14" ry="18" fill="#7dc48a" opacity="0.7" />
        <ellipse cx="80" cy="72" rx="10" ry="14" fill="#5ba869" opacity="0.8" />
        <rect x="78" y="90" width="4" height="12" rx="2" fill="#8b7355" opacity="0.6" />

        <ellipse cx="820" cy="82" rx="12" ry="16" fill="#7dc48a" opacity="0.7" />
        <ellipse cx="820" cy="76" rx="9" ry="12" fill="#5ba869" opacity="0.8" />
        <rect x="818" y="93" width="4" height="10" rx="2" fill="#8b7355" opacity="0.6" />

        {/* Grass blades */}
        <line x1="200" y1="104" x2="197" y2="96" stroke="#7dba8b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="204" y1="104" x2="207" y2="96" stroke="#7dba8b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="500" y1="92" x2="497" y2="85" stroke="#7dba8b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="504" y1="92" x2="507" y2="84" stroke="#7dba8b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="680" y1="100" x2="677" y2="92" stroke="#7dba8b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="684" y1="100" x2="687" y2="92" stroke="#7dba8b" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** ─────────────────────────────────────────────
 * CardGinghamOverlay – subtle plaid texture overlay.
 * ─────────────────────────────────────────────*/
export function CardGinghamOverlay({
  className = "",
  opacity = "opacity-[0.035]",
}: {
  className?: string;
  opacity?: string;
}) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none rounded-[inherit] ${opacity} ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(45deg, #4d7a5b 25%, transparent 25%), 
          linear-gradient(-45deg, #4d7a5b 25%, transparent 25%), 
          linear-gradient(45deg, transparent 75%, #4d7a5b 75%), 
          linear-gradient(-45deg, transparent 75%, #4d7a5b 75%)
        `,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
      }}
      aria-hidden="true"
    />
  );
}

/** ─────────────────────────────────────────────
 * Legacy exports — kept for backward compat.
 * ─────────────────────────────────────────────*/
export function CardGardenLedge({ className = "inset-x-6" }: { className?: string }) {
  return (
    <div
      className={`absolute -top-1.5 h-3 rounded-full bg-gradient-to-r from-[#8fc99e]/90 via-[#a7d8b4] to-[#8fc99e]/90 border border-[#72ab83] shadow-[0_2px_5px_rgba(40,75,50,0.16)] pointer-events-none z-10 flex items-center justify-between px-2.5 ${className}`}
      aria-hidden="true"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-xs" />
      <div className="flex gap-1.5 items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-[#6aa67a]/50" />
        <span className="w-2 h-2 rounded-full bg-white/80 shadow-xs" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#6aa67a]/50" />
      </div>
      <span className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-xs" />
    </div>
  );
}

export function CardGrassMound({
  position = "bottom-right",
  color = "emerald",
  className = "",
}: {
  position?: "bottom-right" | "bottom-left";
  color?: "emerald" | "rose" | "lavender" | "amber";
  className?: string;
}) {
  const colorMap = {
    emerald: { hill1: "bg-[#b8e7c4]", hill2: "bg-[#9ad8a9]", border: "border-[#85c895]", flower: "text-[#ffd166]" },
    rose: { hill1: "bg-[#ffdbe2]", hill2: "bg-[#fbbec8]", border: "border-[#f4a1ae]", flower: "text-[#ff9ebb]" },
    lavender: { hill1: "bg-[#e8dfff]", hill2: "bg-[#d4c3ff]", border: "border-[#bba4f8]", flower: "text-[#c2abff]" },
    amber: { hill1: "bg-[#fde7c7]", hill2: "bg-[#fcd09a]", border: "border-[#f5b870]", flower: "text-[#ffa94d]" },
  };
  const scheme = colorMap[color];
  const isRight = position === "bottom-right";
  return (
    <div
      className={`absolute bottom-0 ${isRight ? "right-0 rounded-bl-[40px] rounded-br-[28px]" : "left-0 rounded-br-[40px] rounded-bl-[28px]"} w-28 h-11 pointer-events-none overflow-hidden z-0 ${className}`}
      aria-hidden="true"
    >
      <div className={`absolute bottom-[-6px] ${isRight ? "right-[-10px]" : "left-[-10px]"} w-28 h-12 rounded-full ${scheme.hill1} opacity-90 border-t ${scheme.border} shadow-inner transform ${isRight ? "rotate-[-6deg]" : "rotate-[6deg]"}`} />
      <div className={`absolute bottom-[-10px] ${isRight ? "right-[-4px]" : "left-[-4px]"} w-24 h-11 rounded-full ${scheme.hill2} border-t-2 ${scheme.border} shadow-[0_-2px_6px_rgba(40,75,50,0.06)]`} />
      <div className={`absolute bottom-1.5 ${isRight ? "right-14" : "left-14"} flex items-center gap-1.5 z-10`}>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-white shadow-xs border border-white/60 relative">
          <span className="absolute inset-0.5 rounded-full bg-[#f6b73c]" />
        </span>
        <span className="inline-block w-2 h-2 rounded-full bg-white shadow-xs border border-white/60 relative -top-1">
          <span className="absolute inset-0.5 rounded-full bg-[#f6b73c]" />
        </span>
      </div>
    </div>
  );
}

export function CardMeadowFooter({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 h-14 pointer-events-none overflow-hidden rounded-b-[30px] z-0 ${className}`}
      aria-hidden="true"
    >
      <div className="absolute -bottom-6 -left-8 right-1/3 h-16 rounded-[100%] bg-gradient-to-t from-[#c5eacc]/70 to-[#ddf2e2]/30 border-t border-[#b2e0ba]/50" />
      <div className="absolute -bottom-8 left-1/4 -right-8 h-18 rounded-[100%] bg-gradient-to-t from-[#afdcb7]/80 to-[#cdecd3]/40 border-t border-[#9ecfA8]/60 shadow-[0_-2px_8px_rgba(35,70,45,0.04)]" />
      <div className="absolute bottom-2 left-16 flex items-center gap-4 opacity-80">
        <span className="w-2.5 h-2.5 rounded-full bg-white shadow-xs relative">
          <span className="absolute inset-0.5 rounded-full bg-[#f8c146]" />
        </span>
        <span className="w-2 h-2 rounded-full bg-white shadow-xs relative -bottom-1">
          <span className="absolute inset-0.5 rounded-full bg-[#f88f9b]" />
        </span>
      </div>
    </div>
  );
}
