import { useEffect, useState } from "react";
import { KeyRound, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export function AdminSettingsPage() {
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function refreshStatus() {
    if (!supabase) {
      setError("ยังไม่ได้ตั้งค่า Supabase");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const { data, error: rpcError } = await supabase.functions.invoke("admin-settings", { body: { action: "status" } });
    if (rpcError) setError(rpcError.message);
    else setConfigured(Boolean(data));
    setLoading(false);
  }

  useEffect(() => { void refreshStatus(); }, []);

  async function saveKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !apiKey.trim()) return;
    setSaving(true);
    setError("");
    setNotice("");
    const { error: rpcError } = await supabase.functions.invoke("admin-settings", { body: { action: "set", apiKey: apiKey.trim() } });
    setSaving(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setApiKey("");
    setNotice("บันทึก API Key ลงใน Vault แล้ว ระบบจะไม่แสดงค่า Key กลับมา");
    await refreshStatus();
  }

  async function removeKey() {
    if (!supabase || !window.confirm("ต้องการลบ DeepSeek API Key ออกจากระบบใช่หรือไม่?")) return;
    setSaving(true);
    setError("");
    setNotice("");
    const { error: rpcError } = await supabase.functions.invoke("admin-settings", { body: { action: "remove" } });
    setSaving(false);
    if (rpcError) setError(rpcError.message);
    else {
      setNotice("ลบ API Key แล้ว");
      await refreshStatus();
    }
  }

  return <div className="admin-settings-page">
    <header className="admin-heading"><div><span className="admin-eyebrow">SYSTEM / CONFIGURATION</span><h1>ตั้งค่าระบบ</h1><p>จัดการบริการภายนอกและการตั้งค่าที่มีผลกับทั้งระบบ</p></div><button className="admin-refresh" type="button" onClick={() => void refreshStatus()} disabled={loading}><RefreshCw size={14}/> ตรวจสอบสถานะ</button></header>
    <section className="admin-panel admin-setting-card">
      <div className="admin-panel-head"><h2><KeyRound size={17}/> DeepSeek API</h2><span className={configured ? "admin-role admin" : "admin-role partner"}>{loading ? "กำลังตรวจสอบ" : configured ? "ตั้งค่าแล้ว" : "ยังไม่ได้ตั้งค่า"}</span></div>
      <p className="admin-setting-description">ใช้สำหรับวิเคราะห์ข้อความรายรับรายจ่ายในหน้า Partner ระบบจะเก็บ Key แบบเข้ารหัสด้วย Supabase Vault และเรียกใช้จาก Edge Function เท่านั้น</p>
      <div className="admin-setting-security"><ShieldCheck size={17}/><span>Key จะไม่ถูกส่งกลับมาแสดง ไม่บันทึกใน Browser Storage และไม่อยู่ใน Source Code</span></div>
      <form className="admin-secret-form" onSubmit={(event) => void saveKey(event)}>
        <label htmlFor="deepseek-key">DeepSeek API Key</label>
        <input id="deepseek-key" type="password" autoComplete="new-password" spellCheck={false} value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={configured ? "กรอก Key ใหม่เพื่อแทนที่ค่าเดิม" : "วาง DeepSeek API Key"} minLength={20} maxLength={500}/>
        <div className="admin-secret-actions"><button className="admin-primary-button" type="submit" disabled={saving || !apiKey.trim()}>{saving ? "กำลังบันทึก..." : configured ? "อัปเดต API Key" : "บันทึก API Key"}</button>{configured && <button className="admin-danger-button" type="button" onClick={() => void removeKey()} disabled={saving}><Trash2 size={15}/> ลบ Key</button>}</div>
      </form>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {error && <p className="entry-error" role="alert">{error}</p>}
    </section>
    <section className="admin-panel"><div className="admin-panel-head"><h2>แนวทางความปลอดภัย</h2></div><ul className="admin-security-list"><li>เฉพาะ Admin ที่ผ่านการยืนยันสิทธิ์ในฐานข้อมูลเท่านั้นที่ตั้งค่าได้</li><li>Partner เรียกใช้ AI ผ่าน Edge Function แต่ไม่สามารถอ่าน API Key ได้</li><li>การเปลี่ยนหรือลบ Key จะถูกบันทึกใน Audit Log</li><li>หาก Key หมดอายุ ให้สร้าง Key ใหม่จากผู้ให้บริการแล้วนำมาแทนที่ในหน้านี้</li></ul></section>
  </div>;
}
