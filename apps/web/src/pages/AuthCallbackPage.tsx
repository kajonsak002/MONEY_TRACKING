import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export function AuthCallbackPage() {
  const { user, loading, error } = useAuth();
  if (loading) return <div className="auth-loading" role="status">กำลังเข้าสู่ระบบ...</div>;
  if (user) return <Navigate to="/" replace />;
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>เข้าสู่ระบบไม่สำเร็จ</h1>
        <p>{error ?? "ไม่สามารถยืนยันบัญชีได้ กรุณาลองใหม่อีกครั้ง"}</p>
        <a className="auth-back-link" href="/login">กลับไปหน้าเข้าสู่ระบบ</a>
      </section>
    </main>
  );
}
