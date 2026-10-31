import { useEffect, useState } from "react";
import { Activity, CheckCircle2, KeyRound, LoaderCircle, RefreshCw, Save, ShieldCheck, Trash2, Wallet } from "lucide-react";
import { supabase } from "../lib/supabase";

type Settings = { app_name: string; app_tagline: string; deepseek_low_balance_threshold: number };
type Balance = { currency: string; total_balance: string; granted_balance: string; topped_up_balance: string };
const defaults: Settings = { app_name: "MoneyMate", app_tagline: "บันทึกรายรับรายจ่ายอย่างเป็นระบบ", deepseek_low_balance_threshold: 5 };
const money = (value: string, currency: string) => {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat("th-TH", { style: "currency", currency, maximumFractionDigits: 2 }).format(number) : `${value} ${currency}`;
};

export function AdminSettingsPage() {
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [settings, setSettings] = useState<Settings>(defaults);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checkedAt, setCheckedAt] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function invoke(action: string, extra: Record<string, unknown> = {}) {
    if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
    const { data, error: invokeError } = await supabase.functions.invoke("admin-settings", { body: { action, ...extra } });
    if (invokeError || data?.error) throw new Error(data?.error ?? invokeError?.message ?? "คำขอไม่สำเร็จ");
    return data;
  }

  async function refreshAll() {
    setLoading(true); setError("");
    try {
      const [status, config] = await Promise.all([invoke("status"), invoke("get-settings")]);
      setConfigured(Boolean(status.configured));
      const value = config.settings ?? {};
      setSettings({
        app_name: typeof value.app_name === "string" ? value.app_name : defaults.app_name,
        app_tagline: typeof value.app_tagline === "string" ? value.app_tagline : defaults.app_tagline,
        deepseek_low_balance_threshold: Number(value.deepseek_low_balance_threshold ?? defaults.deepseek_low_balance_threshold),
      });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "โหลดการตั้งค่าไม่สำเร็จ"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refreshAll(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!apiKey.trim()) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await invoke("set", { apiKey: apiKey.trim() });
      setApiKey(""); setConfigured(true); setNotice("บันทึก API Key ลง Supabase Vault แล้ว");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "บันทึก API Key ไม่สำเร็จ"); }
    finally { setSaving(false); }
  }
  async function removeKey() {
    if (!window.confirm("ต้องการลบ DeepSeek API Key ใช่หรือไม่?")) return;
    setSaving(true); setError(""); setNotice("");
    try { await invoke("remove"); setConfigured(false); setBalances([]); setConnected(false); setNotice("ลบ API Key แล้ว"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "ลบ Key ไม่สำเร็จ"); }
    finally { setSaving(false); }
  }
  async function testConnection() {
    setSaving(true); setError(""); setNotice("");
    try {
      const result = await invoke("test");
      setConnected(Boolean(result.connected)); setAvailable(Boolean(result.is_available));
      setBalances(result.balances ?? []); setCheckedAt(result.checked_at ?? new Date().toISOString());
      setNotice("เชื่อมต่อ DeepSeek API สำเร็จ และอ่านยอดคงเหลือได้");
    } catch (cause) { setConnected(false); setBalances([]); setError(cause instanceof Error ? cause.message : "ทดสอบ DeepSeek ไม่สำเร็จ"); }
    finally { setSaving(false); }
  }
  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      await invoke("update-settings", { settings });
      setNotice("บันทึกการตั้งค่าระบบแล้ว");
      window.dispatchEvent(new CustomEvent("app-settings-updated"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "บันทึกการตั้งค่าไม่สำเร็จ"); }
    finally { setSaving(false); }
  }

  return <div className="admin-settings-page">
    <header className="admin-heading"><div><span className="admin-eyebrow">SYSTEM / CONFIGURATION</span><h1>ตั้งค่าระบบ</h1><p>จัดการแบรนด์ การเชื่อมต่อ AI และค่าพื้นฐานของ MONEY TRACKING</p></div><button className="admin-refresh" type="button" onClick={() => void refreshAll()} disabled={loading}><RefreshCw size={14}/> โหลดการตั้งค่า</button></header>
    <section className="admin-panel admin-setting-card">
      <div className="admin-panel-head"><h2>ข้อมูลแอปพลิเคชัน</h2><span className="admin-role admin">ตั้งค่าทั่วไป</span></div>
      <p className="admin-setting-description">ชื่อและคำอธิบายนี้จะแสดงในส่วนหัวของหน้า Admin และ Partner</p>
      <form className="admin-secret-form" onSubmit={(event) => void saveSettings(event)}>
        <label htmlFor="app-name">ชื่อแอป</label>
        <input id="app-name" value={settings.app_name} maxLength={40} onChange={(e) => setSettings(s => ({ ...s, app_name: e.target.value }))} required/>
        <label htmlFor="app-tagline">คำอธิบายสั้น ๆ</label>
        <input id="app-tagline" value={settings.app_tagline} maxLength={100} onChange={(e) => setSettings(s => ({ ...s, app_tagline: e.target.value }))}/>
        <label htmlFor="balance-threshold">แจ้งเตือนเมื่อยอด DeepSeek ต่ำกว่า (หน่วยตามสกุลเงินที่ API ส่งมา)</label>
        <input id="balance-threshold" type="number" min="0" max="1000000" step="0.01" value={settings.deepseek_low_balance_threshold} onChange={(e) => setSettings(s => ({ ...s, deepseek_low_balance_threshold: Number(e.target.value) }))}/>
        <div className="admin-secret-actions"><button className="admin-primary-button" type="submit" disabled={saving || loading}><Save size={15}/> บันทึกการตั้งค่า</button></div>
      </form>
    </section>
    <section className="admin-panel admin-setting-card">
      <div className="admin-panel-head"><h2><KeyRound size={17}/> DeepSeek API</h2><span className={configured ? "admin-role admin" : "admin-role partner"}>{loading ? "กำลังตรวจสอบ" : configured ? "ตั้งค่าแล้ว" : "ยังไม่ได้ตั้งค่า"}</span></div>
      <p className="admin-setting-description">ใช้สำหรับ AI Quick Add ระบบเก็บ Key ใน Supabase Vault และเรียกใช้งานจาก Edge Function เท่านั้น</p>
      <div className="admin-setting-security"><ShieldCheck size={17}/><span>API Key จะไม่ถูกส่งกลับมาแสดง ไม่เก็บใน Browser Storage และไม่อยู่ใน Source Code</span></div>
      <form className="admin-secret-form" onSubmit={(event) => void saveKey(event)}>
        <label htmlFor="deepseek-key">DeepSeek API Key</label>
        <input id="deepseek-key" type="password" autoComplete="new-password" spellCheck={false} value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={configured ? "กรอก Key ใหม่เพื่อแทนที่ค่าเดิม" : "วาง DeepSeek API Key"} minLength={20} maxLength={500}/>
        <div className="admin-secret-actions"><button className="admin-primary-button" type="submit" disabled={saving || !apiKey.trim()}>{saving ? "กำลังบันทึก..." : configured ? "อัปเดต API Key" : "บันทึก API Key"}</button>{configured && <button className="admin-danger-button" type="button" onClick={() => void removeKey()} disabled={saving}><Trash2 size={15}/> ลบ Key</button>}<button className="admin-outline-button" type="button" onClick={() => void testConnection()} disabled={!configured || saving}><Activity size={15}/> ทดสอบการเชื่อมต่อ</button></div>
      </form>
      <div className="admin-deepseek-status">
        <div className="admin-panel-head"><h3><Wallet size={16}/> สถานะและยอดคงเหลือ</h3><span className={connected ? "admin-role admin" : "admin-role partner"}>{connected === null ? "ยังไม่ได้ทดสอบ" : connected ? available ? "เชื่อมต่อแล้ว · พร้อมใช้งาน" : "เชื่อมต่อแล้ว · ยอดไม่พร้อมใช้" : "เชื่อมต่อไม่สำเร็จ"}</span></div>
        {balances.length ? <div className="admin-balance-grid">{balances.map((item) => <article key={item.currency}><small>ยอดคงเหลือรวม</small><strong>{money(item.total_balance,item.currency)}</strong><div><span>เครดิตที่ได้รับ</span><b>{money(item.granted_balance,item.currency)}</b></div><div><span>ยอดเติมเงิน</span><b>{money(item.topped_up_balance,item.currency)}</b></div></article>)}</div> : <p className="admin-setting-description">กด “ทดสอบการเชื่อมต่อ” เพื่ออ่านยอดคงเหลือล่าสุดจาก DeepSeek</p>}
        {balances.some((item) => Number(item.total_balance) < settings.deepseek_low_balance_threshold) && <p className="admin-balance-warning" role="status">ยอด DeepSeek ต่ำกว่าระดับแจ้งเตือนที่ตั้งไว้ ควรตรวจสอบและเติมเครดิตหากจำเป็น</p>}
        {checkedAt && <small className="admin-balance-updated">ตรวจสอบล่าสุด {new Intl.DateTimeFormat("th-TH",{dateStyle:"medium",timeStyle:"short"}).format(new Date(checkedAt))}</small>}
      </div>
    </section>
    <section className="admin-panel"><div className="admin-panel-head"><h2>ค่าพื้นฐานและความปลอดภัย</h2><ShieldCheck size={17}/></div><ul className="admin-security-list"><li>สกุลเงินหลักของระบบ: บาทไทย (THB)</li><li>เขตเวลาสำหรับวันที่และรายการ: Asia/Bangkok</li><li>เฉพาะ Admin เท่านั้นที่แก้ไขการตั้งค่าระบบและ API Key ได้</li><li>Partner ใช้งาน AI ผ่าน Edge Function โดยไม่สามารถอ่าน API Key ได้</li><li>DeepSeek Balance แสดงยอดตามสกุลเงินที่ผู้ให้บริการส่งกลับมาโดยตรง ไม่มีการแปลงค่าเงิน</li></ul></section>
    {notice && <p className="admin-notice" role="status"><CheckCircle2 size={15}/> {notice}</p>}
    {error && <p className="entry-error" role="alert">{error}</p>}
    {saving && <p className="admin-setting-description"><LoaderCircle size={14} className="spin"/> กำลังดำเนินการ...</p>}
  </div>;
}
