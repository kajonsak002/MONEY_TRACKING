import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function RequireAuth() {
  const { user, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="auth-loading" role="status">กำลังตรวจสอบบัญชีของคุณ...</div>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!profile) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="auth-logo">M</div>
          <h1>ยังไม่พบข้อมูลบัญชี</h1>
          <p>บัญชีนี้ยังไม่มีโปรไฟล์ในระบบ กรุณาตรวจสอบ Allowlist ใน Supabase หรือติดต่อผู้ดูแลระบบ</p>
        </section>
      </main>
    );
  }
  return <Outlet />;
}
