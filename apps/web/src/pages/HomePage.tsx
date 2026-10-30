import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";

const thaiDateFormatter = new Intl.DateTimeFormat("th-TH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

export function HomePage() {
  const today = thaiDateFormatter.format(new Date());
  return (
    <div className="home-page">
      <section className="welcome-row">
        <div><p className="eyebrow">{today}</p><h1>สวัสดีครับ</h1><p className="muted">วันนี้การเงินของคุณเป็นอย่างไรบ้าง?</p></div>
        <div className="avatar" aria-hidden="true">M</div>
      </section>
      <section className="balance-card" aria-label="ยอดคงเหลือ">
        <div className="balance-card-top"><span>ยอดคงเหลือทั้งหมด</span><span className="balance-period">เดือนนี้</span></div>
        <p className="balance-value">฿ 0.00</p>
        <div className="balance-divider" />
        <div className="balance-stats">
          <div><span className="stat-icon income-bg"><ArrowDownLeft size={16} /></span><div><small>รายรับ</small><strong className="income-text">฿ 0.00</strong></div></div>
          <div><span className="stat-icon expense-bg"><ArrowUpRight size={16} /></span><div><small>รายจ่าย</small><strong className="expense-text">฿ 0.00</strong></div></div>
        </div>
      </section>
      <section className="quick-add-card">
        <div className="section-heading"><div><p className="eyebrow">QUICK ADD</p><h2>เพิ่มรายการเร็ว</h2></div><span className="sparkle">✦</span></div>
        <label className="quick-input-label" htmlFor="quick-entry">พิมพ์รายการของคุณ</label>
        <div className="quick-input-wrap"><input id="quick-entry" type="text" placeholder="เช่น ข้าว 60, เงินเดือน 30000" maxLength={200} disabled /><button type="button" className="add-button" disabled aria-label="เพิ่มรายการ"><Plus size={19} /></button></div>
        <p className="helper-text">ตัวอย่าง: “กาแฟ 65 เมื่อวาน” หรือ “+เงินเดือน 30000”</p>
      </section>
      <section className="recent-section"><div className="section-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>รายการล่าสุด</h2></div><button className="text-action" type="button" disabled>ดูทั้งหมด</button></div><div className="empty-state"><div className="empty-icon"><span>฿</span></div><strong>ยังไม่มีรายการ</strong><p>เริ่มบันทึกรายรับรายจ่ายของคุณได้เลย</p></div></section>
    </div>
  );
}
