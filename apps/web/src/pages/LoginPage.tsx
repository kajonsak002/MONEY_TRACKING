import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Wallet } from "lucide-react";
import { Button } from "../design-system/primitives/Button";
import { useAuth } from "../auth/AuthProvider";

export function LoginPage() {
  const { user, loading, configured, error, signInWithGoogle } = useAuth();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  if (!loading && user) return <Navigate to={from} replace />;

  async function handleGoogleLogin() {
    setSubmitting(true);
    await signInWithGoogle();
    setSubmitting(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo"><Wallet size={24} /></span>
          <span>money<span className="brand-accent">mate</span></span>
        </div>
        <p className="eyebrow">YOUR PERSONAL FINANCE SPACE</p>
        <h1>จัดการเงินให้ง่ายขึ้น</h1>
        <p className="auth-description">บันทึกรายรับรายจ่าย ดูภาพรวม และวางแผนการเงินของคุณในที่เดียว</p>
        {!configured && (
          <div className="auth-notice" role="status">
            ยังไม่ได้เชื่อมต่อ Supabase เพิ่ม VITE_SUPABASE_URL และ VITE_SUPABASE_PUBLISHABLE_KEY ในไฟล์ .env.local เพื่อเปิดใช้งาน
          </div>
        )}
        {error && <div className="auth-error" role="alert">{error}</div>}
        <Button className="google-login" size="lg" onClick={handleGoogleLogin} disabled={!configured || submitting || loading}>
          <GoogleMark />
          {submitting ? "กำลังเชื่อมต่อ..." : "เข้าสู่ระบบด้วย Google"}
        </Button>
        <p className="auth-footnote">เฉพาะบัญชีที่ผู้ดูแลอนุญาตเท่านั้น</p>
      </section>
      <p className="auth-copyright">MONEYMATE · PERSONAL FINANCE TRACKER</p>
    </main>
  );
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.62 5.91c4.45-4.11 7.14-10.17 7.14-17.56Z"/>
    <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.97-6.19Z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.89l-7.62-5.91c-2.12 1.43-4.84 2.28-8.28 2.28-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/>
  </svg>;
}
