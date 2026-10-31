import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { Button } from "../design-system/primitives/Button";
import {
  CardGardenLedge,
  CardGinghamOverlay,
  CardGrassMound,
} from "../components/common/CardGrounding";
import { useAuth } from "../auth/AuthProvider";

export function LoginPage() {
  const { user, profile, loading, configured, error, signInWithGoogle, setDevPreviewRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const from = (location.state as { from?: string } | null)?.from ?? (profile?.role === "admin" ? "/admin" : "/app");

  if (!loading && user && profile) {
    return <Navigate to={from} replace />;
  }

  async function handleGoogleLogin() {
    setSubmitting(true);
    await signInWithGoogle();
    setSubmitting(false);
  }

  function handleDevPreview(role: "partner" | "admin") {
    if (setDevPreviewRole) {
      setDevPreviewRole(role);
      navigate(role === "admin" ? "/admin" : "/app", { replace: true });
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] flex flex-col justify-between items-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#e8f3ea] blur-3xl pointer-events-none opacity-70" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#fcecee] blur-3xl pointer-events-none opacity-70" />

      <div className="w-full max-w-md my-auto relative z-10 pt-8 pb-6">
        <section className="relative bg-gradient-to-b from-[#f9fdfa] via-white to-[#f3f9f5] rounded-[32px] p-7 sm:p-9 shadow-[0_16px_45px_rgba(42,78,56,0.06)] border border-[#d7eadb] text-center group overflow-visible">
          <CardGinghamOverlay opacity="opacity-[0.02]" />

          {/* Top Garden Hedge Grounding the Frog */}
          <CardGardenLedge className="right-0 w-24" />

          {/* Bottom Left Grass Mound Grounding the Pig */}
          <CardGrassMound position="bottom-left" color="emerald" />

          {/* Playful Mascots Peeking Around Login Card */}
          <div className="absolute -top-8 -right-2 w-16 h-16 pointer-events-none filter drop-shadow-[0_8px_16px_rgba(35,70,45,0.16)] z-20 transition-transform group-hover:scale-105 group-hover:rotate-6">
            <img
              src="/images/mascots/frog-mascot-happy.png"
              alt="Frog Mascot"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="absolute -bottom-2 -left-2 w-20 h-20 pointer-events-none filter drop-shadow-[0_8px_16px_rgba(30,65,40,0.16)] z-20 transition-transform group-hover:scale-105 group-hover:-rotate-3">
            <img
              src="/images/mascots/pig-mascot-coin.png"
              alt="Pig Mascot"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="relative z-10">
          {/* Mascots Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative w-16 h-16 rounded-2xl bg-[#fdf0f2] border border-[#fbdbe1] p-1 shadow-xs flex items-center justify-center">
              <img
                src="/images/mascots/pig-mascot-happy.png"
                alt="MoneyMate Pig"
                className="w-14 h-14 object-contain filter drop-shadow-xs"
              />
            </div>
            <div className="relative w-16 h-16 rounded-2xl bg-[#ebf5ee] border border-[#d5eadc] p-1 shadow-xs flex items-center justify-center">
              <img
                src="/images/mascots/frog-mascot-happy.png"
                alt="MoneyMate Frog"
                className="w-14 h-14 object-contain filter drop-shadow-xs"
              />
            </div>
          </div>

          {/* Brand Name */}
          <div className="inline-flex items-center gap-1.5 text-2xl font-bold tracking-tight text-[#22392f] mb-1">
            <span>Money<span className="text-[#438765]">Tracking</span></span>
          </div>
          <p className="text-[11px] font-semibold tracking-wider text-[#6b8577] uppercase mb-4">
            Personal & Household Finance
          </p>

          <h1 className="text-xl font-bold text-[#23382e] mb-2">
            บันทึกรายรับรายจ่ายแสนน่ารัก
          </h1>
          <p className="text-xs text-[#74897e] leading-relaxed mb-6">
            ติดตามยอดเงิน วางแผนงบประมาณ และสรุปการเงินได้อย่างสบายใจร่วมกับน้องหมูและน้องกบ 🌿
          </p>

          {!configured && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 text-left">
              ยังไม่ได้ระบุ Supabase URL / Publishable Key ในไฟล์ .env.local
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 text-left" role="alert">
              {error}
            </div>
          )}

          <Button
            className="w-full !min-h-[50px] !rounded-2xl !bg-white hover:!bg-[#f8faf7] !text-[#2c4035] !border !border-[#dbe7dc] shadow-sm font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
            size="lg"
            onClick={handleGoogleLogin}
            disabled={!configured || submitting || loading}
          >
            <GoogleMark />
            <span>{submitting ? "กำลังเชื่อมต่อ..." : "เข้าสู่ระบบด้วย Google"}</span>
          </Button>

          <p className="mt-4 text-[11px] text-[#8aa093]">
            เฉพาะบัญชีที่ได้รับอนุญาตในระบบ
          </p>

          {/* Dev Mode Preview Toolbar (Enabled only during development) */}
          {import.meta.env.DEV && (
            <div className="mt-7 pt-6 border-t border-[#eaf0e9]">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#6a8775] tracking-wider uppercase mb-3">
                <Sparkles size={12} className="text-amber-500" />
                <span>Development UI Preview</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDevPreview("partner")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#ebf5ee] hover:bg-[#deede2] text-[#2c5840] text-xs font-semibold border border-[#d2e8d9] transition"
                >
                  <UserCheck size={14} />
                  <span>เข้าชมหน้า Member</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDevPreview("admin")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#fdf0f2] hover:bg-[#fae2e6] text-[#b84a5a] text-xs font-semibold border border-[#f6d2d8] transition"
                >
                  <ShieldCheck size={14} />
                  <span>เข้าชมหน้า Admin</span>
                </button>
              </div>
            </div>
          )}
          </div>
        </section>
      </div>

      <footer className="relative z-10 text-center">
        <p className="text-[11px] font-medium text-[#8ea497] tracking-wider uppercase">
          MONEY TRACKING · CUTE PASTEL FINANCIAL DASHBOARD
        </p>
      </footer>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.62 5.91c4.45-4.11 7.14-10.17 7.14-17.56Z"/>
      <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.97-6.19Z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.89l-7.62-5.91c-2.12 1.43-4.84 2.28-8.28 2.28-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/>
    </svg>
  );
}
